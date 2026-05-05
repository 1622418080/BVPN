import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.auth!.sub },
    include: { plan: true },
    orderBy: { createdAt: "desc" }
  });
  res.json({ orders });
});

ordersRouter.post("/", async (req, res) => {
  const input = z.object({ planId: z.string().min(1) }).parse(req.body);
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan || !plan.isActive) return res.status(404).json({ error: "PLAN_NOT_FOUND" });

  const order = await prisma.order.create({
    data: {
      userId: req.auth!.sub,
      planId: plan.id,
      amountCents: plan.priceCents,
      currency: plan.currency
    }
  });

  res.status(201).json({ order });
});
