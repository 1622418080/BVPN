import express from "express";
import { z } from "zod";
import { config } from "./config.js";
import { createPeer } from "./wireguard.js";
import { readPeers } from "./store.js";

const app = express();
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

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "agent",
    dryRun: config.WG_DRY_RUN,
    interface: config.WG_INTERFACE
  });
});

app.post("/peers", async (req, res, next) => {
  try {
    const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body);
    const peer = await createPeer(userId);
    res.status(201).json({
      publicKey: peer.publicKey,
      assignedIp: peer.assignedIp,
      configText: peer.configText
    });
  } catch (error) {
    next(error);
  }
});

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

app.listen(config.AGENT_PORT, () => {
  console.log(`BVPN WireGuard agent listening on http://localhost:${config.AGENT_PORT}`);
});
