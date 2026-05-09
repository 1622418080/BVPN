import fs from "node:fs";
import path from "node:path";

export type PeerRecord = {
  userId: string;
  privateKey: string;
  publicKey: string;
  assignedIp: string;
  createdAt: string;
};

const dataDir = path.resolve(process.cwd(), "data");
const peersFile = path.join(dataDir, "peers.json");

let peers: PeerRecord[] = [];
let initialized = false;
let writeQueue = Promise.resolve();

function init() {
  if (initialized) return;
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(peersFile)) {
    fs.writeFileSync(peersFile, "[]");
  }
  try {
    peers = JSON.parse(fs.readFileSync(peersFile, "utf8")) as PeerRecord[];
  } catch {
    console.error(`Corrupted peers.json, backing up and starting fresh`);
    fs.renameSync(peersFile, `${peersFile}.corrupted.${Date.now()}`);
    peers = [];
  }
  initialized = true;
}

function persist(): Promise<void> {
  writeQueue = writeQueue.then(
    () =>
      new Promise<void>((resolve, reject) => {
        const tmp = `${peersFile}.tmp`;
        fs.writeFile(tmp, JSON.stringify(peers, null, 2), (err) => {
          if (err) return reject(err);
          fs.rename(tmp, peersFile, (err2) => {
            if (err2) return reject(err2);
            resolve();
          });
        });
      })
  );
  return writeQueue;
}

export function readPeers(): PeerRecord[] {
  init();
  return [...peers];
}

export function addPeer(peer: PeerRecord) {
  init();
  if (peers.some((existing) => existing.userId === peer.userId)) {
    throw new Error("PEER_ALREADY_EXISTS");
  }
  peers.push(peer);
  return persist();
}

