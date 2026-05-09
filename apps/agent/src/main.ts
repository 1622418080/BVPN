import express from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { config } from "./config.js";
import { createPeer, restorePeers, checkInterface } from "./wireguard.js";
import { readPeers } from "./store.js";

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const app = express();
let server: ReturnType<typeof app.listen>;
app.use(express.json());

function requireAgentToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.path === "/health") return next();
  const header = req.headers.authorization;
  if (header !== `Bearer ${config.AGENT_TOKEN}`) {
    return res.status(401).json({ error: "INVALID_AGENT_TOKEN" });
  }
  next();
}
app.use(requireAgentToken);

app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "agent",
    dryRun: config.WG_DRY_RUN,
    interface: config.WG_INTERFACE,
    interfaceUp: await checkInterface()
  });
});

app.post("/peers", asyncHandler(async (req, res, _next) => {
  const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body);
  const peer = await createPeer(userId);
  res.status(201).json({
    publicKey: peer.publicKey,
    assignedIp: peer.assignedIp,
    configText: peer.configText
  });
}));

app.get("/peers", (_req, res) => {
  const peers = readPeers().map(({ privateKey: _privateKey, ...rest }) => rest);
  res.json({ peers });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "BAD_REQUEST";
  const status = err instanceof z.ZodError ? 400 : 500;
  res.status(status).json({ error: message });
});

restorePeers().catch((err) => {
  console.error("Failed to restore peers:", err);
}).then(() => {
  server = app.listen(config.AGENT_PORT, () => {
    console.log(`BVPN WireGuard agent listening on http://localhost:${config.AGENT_PORT}`);
  });
});

function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
