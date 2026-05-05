import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";

type AgentPeerResponse = {
  publicKey: string;
  assignedIp: string;
  configText: string;
};

export async function provisionWireGuardForUser(userId: string) {
  const node = await prisma.vpnNode.findFirst({ where: { isActive: true } });
  if (!node) throw new Error("NO_ACTIVE_VPN_NODE");

  const existing = await prisma.vpnAccount.findUnique({
    where: { userId_nodeId: { userId, nodeId: node.id } }
  });
  if (existing) return existing;

  const response = await fetch(`${node.apiUrl}/peers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.AGENT_TOKEN}`
    },
    body: JSON.stringify({ userId })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AGENT_ERROR_${response.status}: ${text}`);
  }

  const peer = (await response.json()) as AgentPeerResponse;

  return prisma.vpnAccount.create({
    data: {
      userId,
      nodeId: node.id,
      publicKey: peer.publicKey,
      assignedIp: peer.assignedIp,
      configText: peer.configText
    }
  });
}

export async function activatePaidOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { plan: true }
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status === "PAID") return order;

  const now = new Date();
  const endAt = new Date(now.getTime() + order.plan.durationDays * 86_400_000);

  const paidOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: now }
    });

    await tx.subscription.create({
      data: {
        userId: order.userId,
        planId: order.planId,
        startAt: now,
        endAt,
        trafficLimitGb: order.plan.trafficLimitGb
      }
    });

    return updated;
  });

  // Provision VPN after payment succeeds. If this fails, the payment is
  // still captured and the user can retry via /vpn/provision.
  try {
    await provisionWireGuardForUser(order.userId);
  } catch (error) {
    console.error(`VPN provision failed for user ${order.userId} after payment:`, error);
  }

  return paidOrder;
}
