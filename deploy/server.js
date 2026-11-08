/* Aradhanawa production server for a plain Linux box (used by deploy/install.sh behind Nginx).
 *
 * Does what Vercel did for this repo, with no extra npm packages:
 *   - serves the static site from the repo root, with vercel.json's cleanUrls, rewrites and img/ cache header
 *   - runs the Vercel-style functions in api/ (api/pay/create, return, webhook) with the same req/res helpers
 *
 * Settings come from the environment (systemd loads them from /opt/aradhanawa/.env):
 *   PORT (default 3000), HOST (default 127.0.0.1), GENIE_API_KEY, FIREBASE_SERVICE_ACCOUNT, SITE_URL, GENIE_MODE
 * Run locally: node deploy/server.js
 */
import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = path.join(ROOT, "api");
const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const BODY_LIMIT = 1024 * 1024;

/* Same as vercel.json "rewrites" */
const REWRITES = [
  [/^\/i\/[^/]+\/?$/, "/"],
  [/^\/admin\/?$/, "/"],
];

/* Never serve these from the repo folder (code, secrets, git data). */
const BLOCKED_TOP = new Set(["api", "deploy", "node_modules", "scripts", "test"]);
const BLOCKED_FILES = new Set(["package.json", "package-lock.json", "vercel.json", "firestore.rules"]);
const isBlocked = rel => {
  const parts = rel.split("/").filter(Boolean);
  if (!parts.length) return false;
  if (parts.some(p => p.startsWith("."))) return true;        // .git, .env, .vercelignore ...
  if (BLOCKED_TOP.has(parts[0])) return true;
  if (parts.length === 1 && (BLOCKED_FILES.has(parts[0]) || parts[0].endsWith(".md"))) return true;
  return false;
};

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".webm": "video/webm",
  ".woff2": "font/woff2", ".woff": "font/woff", ".pdf": "application/pdf",
};

async function statFile(p) {
  try { const s = await fsp.stat(p); return s.isFile() ? s : null } catch { return null }
}

/* cleanUrls: /about -> about.html, /dir -> dir/index.html */
async function findFile(urlPath) {
  const rel = urlPath.replace(/^\/+/, "");
  if (isBlocked(rel)) return null;
  const abs = path.join(ROOT, rel);
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return null;
  const tries = urlPath.endsWith("/") ? [path.join(abs, "index.html")] : [abs, abs + ".html", path.join(abs, "index.html")];
  for (const f of tries) { const s = await statFile(f); if (s) return { file: f, stat: s } }
  return null;
}

function cacheControl(urlPath, file) {
  if (urlPath.startsWith("/img/")) return "public, max-age=31536000, immutable";  // vercel.json headers
  if (file.endsWith(".html")) return "public, max-age=0, must-revalidate";
  return "public, max-age=3600";
}

async function serveStatic(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain" }); return res.end("Method not allowed");
  }
  let p;
  try { p = decodeURIComponent(url.pathname) } catch { res.writeHead(400); return res.end("Bad request") }
  if (p.includes("\0")) { res.writeHead(400); return res.end("Bad request") }

  // cleanUrls: /x.html -> /x, /x/index.html -> /x/
  const m = p.match(/^(.*?)(\/index)?\.html$/);
  if (m && !isBlocked(p.slice(1))) {
    const to = (m[2] ? m[1] + "/" : m[1]) || "/";
    res.writeHead(308, { Location: to + url.search }); return res.end();
  }
  for (const [re, to] of REWRITES) if (re.test(p)) { p = to; break }

  let hit = await findFile(p);
  let status = 200;
  if (!hit) { hit = await findFile("/404"); status = 404 }
  if (!hit) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Not found") }

  const { file, stat } = hit;
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const headers = {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": status === 200 ? cacheControl(p, file) : "no-store",
    "Last-Modified": stat.mtime.toUTCString(), ETag: etag, "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };
  if (status === 200 && req.headers["if-none-match"] === etag) { res.writeHead(304, headers); return res.end() }

  // Range requests (audio / video seeking, Safari needs these)
  let start = 0, end = stat.size - 1;
  const range = status === 200 && req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (range) {
    if (range[1] === "" && range[2] !== "") { start = Math.max(0, stat.size - +range[2]) }
    else { start = +range[1] || 0; if (range[2] !== "") end = Math.min(+range[2], end) }
    if (start > end || start >= stat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }); return res.end();
    }
    status = 206; headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers["Content-Length"] = stat.size ? end - start + 1 : 0;
  res.writeHead(status, headers);
  if (req.method === "HEAD" || !stat.size) return res.end();
  fs.createReadStream(file, { start, end }).on("error", () => res.destroy()).pipe(res);
}

/* ---- Vercel-style api/ functions ---- */
const handlers = new Map();
async function loadHandler(route) {
  if (handlers.has(route)) return handlers.get(route);
  const file = path.join(API_DIR, route + ".js");
  if (!(await statFile(file))) return null;
  const mod = await import(pathToFileURL(file).href);
  const fn = typeof mod.default === "function" ? mod.default : null;
  handlers.set(route, fn);
  return fn;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", c => {
      size += c.length;
      if (size > BODY_LIMIT) { reject(Object.assign(new Error("Body too large"), { status: 413 })); req.destroy(); return }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseBody(raw, type) {
  type = String(type || "").toLowerCase();
  if (!raw) return type.includes("json") ? {} : "";
  if (type.includes("application/json")) {
    try { return JSON.parse(raw) } catch { throw Object.assign(new Error("Invalid JSON body"), { status: 400 }) }
  }
  if (type.includes("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(raw));
  return raw;
}

function addHelpers(res) {
  res.status = code => { res.statusCode = code; return res };
  res.json = obj => {
    if (!res.getHeader("Content-Type")) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj)); return res;
  };
  res.send = body => {
    if (body == null) { res.end(); return res }
    if (typeof body === "object" && !Buffer.isBuffer(body)) return res.json(body);
    if (!res.getHeader("Content-Type")) res.setHeader("Content-Type", Buffer.isBuffer(body) ? "application/octet-stream" : "text/html; charset=utf-8");
    res.end(body); return res;
  };
  res.redirect = (a, b) => {
    const [code, loc] = typeof a === "number" ? [a, b] : [307, a];
    res.statusCode = code; res.setHeader("Location", loc); res.end(); return res;
  };
  return res;
}

async function serveApi(req, res, url) {
  addHelpers(res);
  const route = url.pathname.replace(/^\/api\//, "").replace(/\/+$/, "").replace(/\.js$/, "");
  // Only real function files: no _lib, no dot files, no "..".
  if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(route)) return res.status(404).json({ error: "Not found" });
  let fn;
  try { fn = await loadHandler(route) } catch (e) { console.error("[api] load", route, e); return res.status(500).json({ error: "Server error" }) }
  if (!fn) return res.status(404).json({ error: "Not found" });
  try {
    req.query = Object.fromEntries(url.searchParams);
    req.cookies = Object.fromEntries(String(req.headers.cookie || "").split(";").map(s => s.trim()).filter(Boolean)
      .map(s => { const i = s.indexOf("="); return i < 0 ? [s, ""] : [s.slice(0, i), decodeURIComponent(s.slice(i + 1))] }));
    req.body = req.method === "GET" || req.method === "HEAD" ? undefined : parseBody(await readBody(req), req.headers["content-type"]);
    await fn(req, res);
    if (!res.writableEnded) res.end();
  } catch (e) {
    if (!e.status || e.status >= 500) console.error("[api]", route, e);
    if (!res.headersSent) res.status(e.status && e.status < 500 ? e.status : 500).json({ error: e.status && e.status < 500 ? e.message : "Server error" });
    else res.end();
  }
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, "http://localhost") } catch { res.writeHead(400); return res.end("Bad request") }
  try {
    if (url.pathname === "/healthz") { res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" }); return res.end("ok") }
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return await serveApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (e) {
    console.error("[server]", req.method, req.url, e);
    if (!res.headersSent) { res.writeHead(500, { "Content-Type": "text/plain" }); res.end("Server error") } else res.destroy();
  }
});
server.keepAliveTimeout = 65000;   // a bit longer than Nginx's keepalive so idle sockets close cleanly
server.listen(PORT, HOST, () => console.log(`Aradhanawa listening on http://${HOST}:${PORT}`));

for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 5000).unref() });
