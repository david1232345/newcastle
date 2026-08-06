import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import health from "./api/health.js";
import players from "./api/players.js";
import officials from "./api/officials.js";
import analyzeReplay from "./api/replays/analyze.js";
import reminders from "./api/cron/reminders.js";
import interactions from "./api/discord/interactions.js";

const root = path.dirname(fileURLToPath(import.meta.url));

async function loadEnv() {
  try {
    const raw = await readFile(path.join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // El servidor local también puede usar variables del sistema.
  }
}

await loadEnv();

const handlers = new Map([
  ["/api/health", health],
  ["/api/players", players],
  ["/api/officials", officials],
  ["/api/replays/analyze", analyzeReplay],
  ["/api/cron/reminders", reminders],
  ["/api/discord/interactions", interactions]
]);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".hbr2": "application/octet-stream",
  ".txt": "text/plain; charset=utf-8",
  ".sql": "text/plain; charset=utf-8"
};

function decorateResponse(res) {
  res.status = function status(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function json(payload) {
    if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
    return payload;
  };
  res.send = function send(payload) {
    res.end(payload);
  };
}

const server = http.createServer(async (req, res) => {
  decorateResponse(res);
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  req.query = Object.fromEntries(url.searchParams.entries());

  const handler = handlers.get(url.pathname);
  if (handler) {
    try {
      await handler(req, res);
    } catch (error) {
      if (!res.headersSent) res.statusCode = 500;
      if (!res.writableEnded) res.end(JSON.stringify({ ok: false, error: error.message }));
    }
    return;
  }

  let requestPath = decodeURIComponent(url.pathname);
  if (requestPath === "/") requestPath = "/index.html";
  const filePath = path.resolve(root, `.${requestPath}`);
  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    const body = await readFile(filePath);
    res.setHeader("Content-Type", mime[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Newcastle Team: http://localhost:${port}`);
  console.log(`Base de datos: ${process.env.SUPABASE_URL ? "Supabase" : "JSON local"}`);
});
