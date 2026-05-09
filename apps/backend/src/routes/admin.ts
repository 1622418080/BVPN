import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { activatePaidOrder } from "../services/provision.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/stats", asyncHandler(async (_req, res) => {
  const [totalUsers, activeSubs, totalOrders, paidOrders, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE", endAt: { gt: new Date() } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } })
  ]);

  res.json({
    totalUsers,
    activeSubscriptions: activeSubs,
    totalOrders,
    paidOrders,
    totalRevenueCents: totalRevenue._sum.amountCents || 0
  });
}));

adminRouter.get("/users", asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const take = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * take;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, status: true, createdAt: true, updatedAt: true }
    }),
    prisma.user.count()
  ]);

  res.json({ users, total, page, totalPages: Math.ceil(total / take) });
}));

adminRouter.get("/orders", asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const take = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * take;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take,
      include: { plan: true, user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.count()
  ]);

  res.json({ orders, total, page, totalPages: Math.ceil(total / take) });
}));

adminRouter.get("/subscriptions", asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const take = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * take;

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      skip,
      take,
      include: { plan: true, user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.subscription.count()
  ]);

  res.json({ subscriptions, total, page, totalPages: Math.ceil(total / take) });
}));

adminRouter.post("/orders/:id/pay", asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: "ORDER_NOT_FOUND" });

  const paid = await activatePaidOrder(id);
  res.json({ order: paid });
}));
