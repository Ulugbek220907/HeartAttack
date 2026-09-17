"use strict";

/*
 * HeartAttack 2026 server: serves the app and relays Ollama Cloud requests.
 *
 * Browsers can't call ollama.com directly (it sends no CORS headers), so the
 * page talks to this relay instead. The relay forwards only two Ollama
 * endpoints, passes each user's own API key through, and never stores or
 * logs keys or messages.
 *
 * No dependencies. Needs Node 18+ (global fetch).
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 10000;
const UPSTREAM = (process.env.OLLAMA_UPSTREAM || "https://ollama.com").replace(/\/+$/, "");
const SITE_ROOT = path.resolve(__dirname, "..");
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 180_000;
// Optional comma-separated list, e.g. "https://heartattack.onrender.com". Default: any origin.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

const STATIC_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function corsHeaders(req) {
  const origin = req.headers.origin;
  let allow = "*";
  if (ALLOWED_ORIGINS.length) allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function sendJson(req, res, status, body) {
  res.writeHead(status, { ...corsHeaders(req), "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("Request too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function relay(req, res, upstreamPath) {
  const headers = { "Accept": "application/json" };
  const auth = req.headers.authorization;
  if (auth && /^Bearer\s+\S+/.test(auth)) headers.Authorization = auth;

  let body;
  if (req.method === "POST") {
    const raw = await readBody(req);
    let parsed;
    try { parsed = JSON.parse(raw.toString("utf8") || "{}"); }
    catch (e) { return sendJson(req, res, 400, { error: "Body must be JSON." }); }
    if (!parsed || typeof parsed.model !== "string" || !Array.isArray(parsed.messages)) {
      return sendJson(req, res, 400, { error: "Expected { model, messages }." });
    }
    // The app reads one complete JSON answer.
    parsed.stream = false;
    body = JSON.stringify(parsed);
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  req.on("close", () => { if (!res.writableEnded) controller.abort(); });
  try {
    const upstream = await fetch(UPSTREAM + upstreamPath, { method: req.method, headers, body, signal: controller.signal });
    const text = await upstream.text();
    res.writeHead(upstream.status, {
      ...corsHeaders(req),
      "Content-Type": upstream.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store"
    });
    res.end(text);
  } catch (err) {
    if (res.headersSent) return res.end();
    const timedOut = err && err.name === "AbortError";
    sendJson(req, res, timedOut ? 504 : 502, { error: timedOut ? "Ollama took too long to answer." : "The relay couldn't reach Ollama." });
  } finally {
    clearTimeout(timer);
  }
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  const file = path.resolve(SITE_ROOT, "." + rel);
  const insideRoot = file.startsWith(SITE_ROOT + path.sep);
  const hidden = rel.split("/").some(part => part.startsWith("."));
  const type = STATIC_TYPES[path.extname(file).toLowerCase()];
  if (!insideRoot || hidden || !type || file.startsWith(path.join(SITE_ROOT, "relay") + path.sep)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  let pathname;
  try { pathname = new URL(req.url, "http://relay").pathname; }
  catch (e) { res.writeHead(400); return res.end(); }

  try {
    if (pathname.startsWith("/ollama/")) {
      if (req.method === "OPTIONS") {
        res.writeHead(204, corsHeaders(req));
        return res.end();
      }
      if (pathname === "/ollama/health" && req.method === "GET") return sendJson(req, res, 200, { ok: true, service: "HeartAttack 2026 Ollama relay" });
      if (pathname === "/ollama/api/tags" && req.method === "GET") return await relay(req, res, "/api/tags");
      if (pathname === "/ollama/api/chat" && req.method === "POST") return await relay(req, res, "/api/chat");
      return sendJson(req, res, 404, { error: "Unknown relay route." });
    }
    if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res, pathname);
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method not allowed");
  } catch (err) {
    if (!res.headersSent) sendJson(req, res, err.status || 500, { error: err.status === 413 ? "Request too large." : "Relay error." });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`HeartAttack 2026 is running on port ${PORT} (Ollama upstream: ${UPSTREAM})`);
});
