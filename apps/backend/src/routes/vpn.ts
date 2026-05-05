import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { provisionWireGuardForUser } from "../services/provision.js";

export const vpnRouter = Router();
vpnRouter.use(requireAuth);

vpnRouter.get("/accounts", async (req, res) => {
  const accounts = await prisma.vpnAccount.findMany({
    where: { userId: req.auth!.sub },
    include: { node: true },
    orderBy: { createdAt: "desc" }
  });
  res.json({ accounts });
});

vpnRouter.post("/provision", async (req, res) => {
  const active = await prisma.subscription.findFirst({
    where: {
      userId: req.auth!.sub,
      status: "ACTIVE",
      endAt: { gt: new Date() }
    }
  });
  if (!active) return res.status(402).json({ error: "ACTIVE_SUBSCRIPTION_REQUIRED" });

  const account = await provisionWireGuardForUser(req.auth!.sub);
  res.status(201).json({ account });
});

vpnRouter.get("/config", async (req, res) => {
  const account = await prisma.vpnAccount.findFirst({
    where: { userId: req.auth!.sub, isActive: true },
    include: { node: true }
  });
  if (!account) return res.status(404).json({ error: "VPN_ACCOUNT_NOT_FOUND" });

  res.type("text/plain").send(account.configText);
});
