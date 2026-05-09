import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { requestLogger } from "./lib/logger.js";
import { authRouter } from "./routes/auth.js";
import { plansRouter } from "./routes/plans.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { vpnRouter } from "./routes/vpn.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { adminRouter } from "./routes/admin.js";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

const app = express();
app.set("trust proxy", 1);

app.use(requestLogger);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: config.APP_URL, credentials: true }));

app.use((req, res, next) => {
  if (req.path === "/payments/stripe/webhook") {
    return express.raw({ type: "application/json" })(req, res, next);
  }
  return express.json({ limit: "1mb" })(req, res, next);
});

app.get("/health", async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  res.json({
    ok: true,
    service: "backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: dbOk ? "ok" : "error"
  });
});

const globalLimiter = rateLimit({ windowMs: 60_000, limit: 120 });
app.use(globalLimiter);
app.use("/auth", authRouter);
app.use("/plans", plansRouter);
app.use("/orders", ordersRouter);
app.use("/payments", paymentsRouter);
app.use("/vpn", vpnRouter);
app.use("/dashboard", dashboardRouter);
app.use("/admin/api", adminRouter);

app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  if (err instanceof SyntaxError || err instanceof z.ZodError) {
    return res.status(400).json({ error: "BAD_REQUEST" });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: "CONFLICT" });
    if (err.code === "P2025") return res.status(404).json({ error: "NOT_FOUND" });
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: "INVALID_QUERY" });
  }

  res.status(500).json({ error: "INTERNAL_ERROR" });
});

const server = app.listen(config.BACKEND_PORT, () => {
  console.log(`BVPN backend listening on http://localhost:${config.BACKEND_PORT}`);
});

function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
