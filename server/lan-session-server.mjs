import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8787);
const ACTIVE_TTL_MS = 15_000;
const DROP_TTL_MS = 60_000;

/** @type {Map<string, { sessionId: string, label: string, coins: number, path: string, ip: string, lastSeen: number }>} */
const sessions = new Map();
/** @type {Map<string, Array<{ id: string, type: "topup", amount: number, reason?: string, createdAt: number }>>} */
const commandsQueue = new Map();

const json = (res, code, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(payload);
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });

const cleanup = () => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastSeen > DROP_TTL_MS) {
      sessions.delete(id);
      commandsQueue.delete(id);
    }
  }
};

setInterval(cleanup, 10_000).unref();

createServer(async (req, res) => {
  const { method, url } = req;

  if (method === "OPTIONS") {
    return json(res, 204, {});
  }

  if (method === "GET" && url === "/health") {
    return json(res, 200, { ok: true });
  }

  if (method === "GET" && url === "/sessions") {
    const now = Date.now();
    const active = Array.from(sessions.values())
      .filter((s) => now - s.lastSeen <= ACTIVE_TTL_MS)
      .sort((a, b) => b.lastSeen - a.lastSeen);

    return json(res, 200, { ok: true, sessions: active });
  }

  if (method === "POST" && url === "/heartbeat") {
    try {
      const body = await parseBody(req);
      const sessionId = String(body.sessionId || "");
      const label = String(body.label || "Player");
      const coins = Number(body.coins || 0);
      const path = String(body.path || "/");
      const ip = String(
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"
      );

      if (!sessionId) {
        return json(res, 400, { ok: false, error: "sessionId is required" });
      }

      sessions.set(sessionId, {
        sessionId,
        label,
        coins: Number.isFinite(coins) ? Math.floor(coins) : 0,
        path,
        ip,
        lastSeen: Date.now(),
      });

      const commands = commandsQueue.get(sessionId) || [];
      commandsQueue.set(sessionId, []);
      return json(res, 200, { ok: true, commands });
    } catch (error) {
      return json(res, 400, { ok: false, error: error.message });
    }
  }

  if (method === "POST" && url === "/topup") {
    try {
      const body = await parseBody(req);
      const sessionId = String(body.sessionId || "");
      const amount = Number(body.amount || 0);

      if (!sessions.has(sessionId)) {
        return json(res, 404, { ok: false, error: "Session not found or offline" });
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        return json(res, 400, { ok: false, error: "amount must be > 0" });
      }

      const command = {
        id: randomUUID(),
        type: "topup",
        amount: Math.floor(amount),
        createdAt: Date.now(),
      };

      const current = commandsQueue.get(sessionId) || [];
      commandsQueue.set(sessionId, [...current, command]);

      return json(res, 200, { ok: true, queued: command });
    } catch (error) {
      return json(res, 400, { ok: false, error: error.message });
    }
  }

  return json(res, 404, { ok: false, error: "Not found" });
}).listen(PORT, HOST, () => {
  console.log(`[lan-session-server] listening on http://${HOST}:${PORT}`);
});

