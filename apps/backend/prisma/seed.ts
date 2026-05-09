import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@bvpn.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const agentUrl = process.env.AGENT_URL || "http://localhost:4100";

  await prisma.$transaction(async (tx) => {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await tx.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, passwordHash, role: UserRole.ADMIN }
    });

    const plans = [
      { name: "Starter", description: "适合轻量使用，1 台设备，100GB 流量。", priceCents: 699, currency: "USD", durationDays: 30, trafficLimitGb: 100, maxDevices: 1 },
      { name: "Pro", description: "适合长期使用，3 台设备，500GB 流量。", priceCents: 1599, currency: "USD", durationDays: 30, trafficLimitGb: 500, maxDevices: 3 },
      { name: "Yearly", description: "年付优惠，5 台设备，5TB 年流量。", priceCents: 12999, currency: "USD", durationDays: 365, trafficLimitGb: 5000, maxDevices: 5 }
    ];

    for (const plan of plans) {
      await tx.plan.upsert({ where: { name: plan.name }, update: plan, create: plan });
    }

    await tx.vpnNode.upsert({
      where: { id: "default-node" },
      update: { apiUrl: agentUrl },
      create: { id: "default-node", name: "Demo Node", region: "Local", apiUrl: agentUrl, publicIp: "127.0.0.1" }
    });
  });

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
