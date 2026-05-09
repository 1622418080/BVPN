import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { signAccessToken } from "../lib/auth.js";
import { requireAuth, authLimiter } from "../middleware/auth.js";

export const authRouter = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true
} as const;

authRouter.post("/register", authLimiter, asyncHandler(async (req, res, next) => {
  const input = authSchema.parse(req.body);
  const email = input.email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "EMAIL_EXISTS" });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(input.password, 12)
    },
    select: publicUserSelect
  });

  const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  res.json({ token, user });
}));

authRouter.post("/login", authLimiter, asyncHandler(async (req, res, next) => {
  const input = authSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  if (user.status !== "ACTIVE") return res.status(403).json({ error: "USER_NOT_ACTIVE" });

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.sub },
    select: publicUserSelect
  });
  if (!user) return res.status(401).json({ error: "USER_NOT_FOUND" });
  res.json({ user });
}));
