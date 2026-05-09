import crypto from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { config } from "./config.js";
import { readPeers, addPeer, type PeerRecord } from "./store.js";

const peerQueue: Array<{
  userId: string;
  resolve: (peer: PeerRecord & { configText: string }) => void;
  reject: (error: unknown) => void;
}> = [];
let queueRunning = false;

async function drainQueue() {
  if (queueRunning) return;
  queueRunning = true;
  while (peerQueue.length > 0) {
    const item = peerQueue.shift()!;
    try {
      item.resolve(await createPeerLocked(item.userId));
    } catch (error) {
      item.reject(error);
    }
  }
  queueRunning = false;
}

function execFileAsync(cmd: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    execFile(cmd, args, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout.trim());
    });
  });
}

function wgPubkey(privateKey: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("wg", ["pubkey"], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || `wg pubkey exited with ${code}`));
    });
    child.stdin.write(privateKey);
    child.stdin.end();
  });
}

export async function generateKeyPair() {
  if (config.WG_DRY_RUN) {
    const privateKey = crypto.randomBytes(32).toString("base64");
    const publicKey = crypto.createHash("sha256").update(privateKey).digest("base64");
    return { privateKey, publicKey };
  }

  const privateKey = await execFileAsync("wg", ["genkey"]);
  const publicKey = await wgPubkey(privateKey);
  return { privateKey, publicKey };
}

function cidrBasePrefix(cidr: string) {
  const [addr, prefixLength = "24"] = cidr.split("/");
  if (prefixLength !== "24") {
    throw new Error("WG_ADDRESS_CIDR currently supports IPv4 /24 pools only");
  }
  const parts = addr.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    throw new Error("WG_ADDRESS_CIDR must be like 10.8.0.0/24");
  }
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

export function nextClientIp() {
  const peers = readPeers();
  const used = new Set(peers.map((p) => p.assignedIp.split("/")[0]));
  const prefix = cidrBasePrefix(config.WG_ADDRESS_CIDR);
  for (let i = 2; i < 255; i += 1) {
    const ip = `${prefix}.${i}`;
    if (!used.has(ip)) return `${ip}/32`;
  }
  throw new Error("VPN_IP_POOL_FULL");
}

export function buildClientConfig(peer: PeerRecord) {
  return `[Interface]
PrivateKey = ${peer.privateKey}
Address = ${peer.assignedIp}
DNS = ${config.WG_DNS}

[Peer]
PublicKey = ${config.WG_SERVER_PUBLIC_KEY}
Endpoint = ${config.WG_SERVER_ENDPOINT}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`;
}

async function createPeerLocked(userId: string) {
  const peers = readPeers();
  const existing = peers.find((p) => p.userId === userId);
  if (existing) {
    return { ...existing, configText: buildClientConfig(existing) };
  }

  const { privateKey, publicKey } = await generateKeyPair();
  const assignedIp = nextClientIp();
  const peer: PeerRecord = {
    userId,
    privateKey,
    publicKey,
    assignedIp,
    createdAt: new Date().toISOString()
  };

  if (!config.WG_DRY_RUN) {
    await execFileAsync("wg", [
      "set",
      config.WG_INTERFACE,
      "peer",
      publicKey,
      "allowed-ips",
      assignedIp
    ]);
  }

  await addPeer(peer);
  return { ...peer, configText: buildClientConfig(peer) };
}

export function createPeer(userId: string): Promise<PeerRecord & { configText: string }> {
  return new Promise((resolve, reject) => {
    peerQueue.push({ userId, resolve, reject });
    drainQueue();
  });
}

export async function restorePeers(): Promise<void> {
  if (config.WG_DRY_RUN) return;
  const peers = readPeers();
  if (peers.length === 0) return;
  let restored = 0;
  for (const peer of peers) {
    try {
      await execFileAsync("wg", [
        "set",
        config.WG_INTERFACE,
        "peer",
        peer.publicKey,
        "allowed-ips",
        peer.assignedIp
      ]);
      restored++;
    } catch (err) {
      console.error(`Failed to restore peer ${peer.userId}:`, err);
    }
  }
  console.log(`Restored ${restored}/${peers.length} peers to ${config.WG_INTERFACE}`);
}

export async function checkInterface(): Promise<boolean> {
  if (config.WG_DRY_RUN) return false;
  try {
    await execFileAsync("wg", ["show", config.WG_INTERFACE]);
    return true;
  } catch {
    return false;
  }
}
