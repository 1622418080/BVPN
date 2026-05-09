import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const plansRouter = Router();

const planSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  priceCents: z.number().int().positive(),
  currency: z.string().default("USD"),
  durationDays: z.number().int().positive(),
  trafficLimitGb: z.number().int().positive(),
  maxDevices: z.number().int().positive()
});

plansRouter.get("/", asyncHandler(async (_req, res, _next) => {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceCents: "asc" }
  });
  res.json({ plans });
}));

plansRouter.post("/", requireAuth, requireAdmin, asyncHandler(async (req, res, next) => {
  const input = planSchema.parse(req.body);
  const plan = await prisma.plan.create({ data: input });
  res.status(201).json({ plan });
}));
