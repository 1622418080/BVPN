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
    signal: AbortSignal.timeout(config.AGENT_REQUEST_TIMEOUT_MS),
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
  const now = new Date();

  const paidOrder = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: orderId },
      include: { plan: true }
    });
    if (!current) throw new Error("ORDER_NOT_FOUND");
    if (current.status === "PAID") return current;

    const latestActive = await tx.subscription.findFirst({
      where: {
        userId: current.userId,
        status: "ACTIVE",
        endAt: { gt: now }
      },
      orderBy: { endAt: "desc" }
    });
    const startAt = latestActive?.endAt && latestActive.endAt > now ? latestActive.endAt : now;
    const endAt = new Date(startAt.getTime() + current.plan.durationDays * 86_400_000);

    const updated = await tx.order.update({
      where: { id: current.id },
      data: { status: "PAID", paidAt: now }
    });

    await tx.subscription.create({
      data: {
        userId: current.userId,
        planId: current.planId,
        startAt,
        endAt,
        trafficLimitGb: current.plan.trafficLimitGb
      }
    });

    return updated;
  });

  try {
    await provisionWireGuardForUser(paidOrder.userId);
  } catch (error) {
    console.error(`[order=${orderId}] VPN provision failed for user ${paidOrder.userId}:`, error);
  }

  return paidOrder;
}
