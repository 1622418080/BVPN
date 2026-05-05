import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { plansRouter } from "./routes/plans.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { vpnRouter } from "./routes/vpn.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.APP_URL, credentials: true }));

app.use((req, res, next) => {
  if (req.originalUrl === "/payments/stripe/webhook") {
    return express.raw({ type: "application/json" })(req, res, next);
  }
  return express.json({ limit: "1mb" })(req, res, next);
});

const globalLimiter = rateLimit({ windowMs: 60_000, limit: 120 });
app.use(globalLimiter);

app.get("/health", (_req, res) => res.json({ ok: true, service: "backend" }));
app.use("/auth", authRouter);
app.use("/plans", plansRouter);
app.use("/orders", ordersRouter);
app.use("/payments", paymentsRouter);
app.use("/vpn", vpnRouter);
app.use("/dashboard", dashboardRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const status = err instanceof SyntaxError ? 400 : 500;
  const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
  res.status(status).json({ error: message });
});

app.listen(config.BACKEND_PORT, () => {
  console.log(`BVPN backend listening on http://localhost:${config.BACKEND_PORT}`);
});
