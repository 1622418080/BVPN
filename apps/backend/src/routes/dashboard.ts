import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", asyncHandler(async (req, res, next) => {
  const [subscription, orders, accounts] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        userId: req.auth!.sub,
        status: "ACTIVE",
        endAt: { gt: new Date() }
      },
      include: { plan: true },
      orderBy: { endAt: "desc" }
    }),
    prisma.order.findMany({
      where: { userId: req.auth!.sub },
      take: 5,
      include: { plan: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.vpnAccount.findMany({
      where: { userId: req.auth!.sub },
      include: { node: true }
    })
  ]);

  res.json({ subscription, orders, accounts });
}));
