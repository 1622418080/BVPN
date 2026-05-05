import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { verifyAccessToken, type AuthTokenPayload } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  message: { error: "RATE_LIMIT" }
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    req.auth = verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== "ADMIN") {
    return res.status(403).json({ error: "ADMIN_ONLY" });
  }
  next();
}
