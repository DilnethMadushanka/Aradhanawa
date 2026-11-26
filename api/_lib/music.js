/* Card music uploads to Cloudflare R2 (api/music/upload, api/music/delete). Admins only. */
import crypto from "node:crypto";
import fs from "node:fs";
import { db } from "./firebase.js";
import { userFromRequest, fail } from "./pay.js";
import { r2Config, putObject, deleteObject, publicUrl, keyFromUrl } from "./r2.js";

export const MAX_BYTES = 15 * 1024 * 1024;   // a 4-5 minute MP3 at 192 kbps is about 7 MB

/* Owner emails: adminEmails in firebase-config.js (the same list the dashboard uses) plus ADMIN_EMAILS in .env (comma separated).
 * Admins added from Admin → Settings → Admins live in Firestore admins/{email}. */
let owners = null;
function ownerEmails() {
  if (owners) return owners;
  let txt = "";
  try { txt = fs.readFileSync(new URL("../../firebase-config.js", import.meta.url), "utf8") } catch {}
  const m = /adminEmails\s*:\s*\[([^\]]*)\]/.exec(txt);
  const fromFile = m ? [...m[1].matchAll(/["']([^"']+)["']/g)].map(x => x[1]) : [];
  const fromEnv = String(process.env.ADMIN_EMAILS || "").split(",");
  return owners = [...fromFile, ...fromEnv].map(e => e.trim().toLowerCase()).filter(Boolean);
}

export async function adminFromRequest(req) {
  const user = await userFromRequest(req);
  const em = String(user.email || "").toLowerCase();
  if (em && user.email_verified !== false) {
    if (ownerEmails().includes(em)) return user;
    try { if ((await db().doc(`admins/${em}`).get()).exists) return user } catch (e) { console.warn("[music] admins", e.message) }
  }
  throw fail(403, "Only admins can change the card music.");
}

/* MP3: an ID3 tag, or straight away an MPEG audio frame (11 sync bits). */
export const isMp3 = b => b.length > 3 && (b.slice(0, 3).toString("latin1") === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0));
const slug = s => String(s || "").replace(/\.[a-z0-9]{2,4}$/i, "").normalize("NFKD").replace(/[^\w\s-]/g, "")
  .trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40) || "track";

function sendError(res, e) {
  if (!e.status || e.status === 502) console.error("[music]", e);
  res.status(e.status || 500).json({ error: e.status && e.status !== 502 ? e.message : "Could not save the music. Please try again." });
}
function config() {
  const c = r2Config();
  if (!c) throw fail(503, "Music storage (Cloudflare R2) is not set up on the server.");
  return c;
}
/* deploy/server.js hands audio bodies over as a Buffer. Elsewhere, read the stream ourselves. */
async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (req.body != null && typeof req.body !== "object") return Buffer.from(String(req.body), "latin1");
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > MAX_BYTES) throw fail(413, "That MP3 is too large (15 MB at most)."); chunks.push(c) }
  return Buffer.concat(chunks);
}

/* body: the MP3 file itself (Content-Type audio/mpeg), header X-File-Name: the original file name (URI encoded)
 *   ->  { url, name } */
export async function uploadMusic(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "POST only" }) }
  try {
    const c = config();
    await adminFromRequest(req);
    let name = ""; try { name = decodeURIComponent(String(req.headers["x-file-name"] || "")) } catch {}
    name = name.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 120);
    const buf = await rawBody(req);
    if (!buf.length) throw fail(400, "Choose an MP3 file.");
    if (buf.length > MAX_BYTES) throw fail(413, "That MP3 is too large (15 MB at most).");
    if (!isMp3(buf)) throw fail(400, "That file is not an MP3.");
    const key = `music/${slug(name)}-${crypto.randomBytes(6).toString("base64url")}.mp3`;
    await putObject(c, key, buf, "audio/mpeg", 120000);
    res.status(200).json({ url: publicUrl(c, key), name: name.replace(/\.mp3$/i, "") || "Track" });
  } catch (e) { sendError(res, e) }
}

/* body { url }  ->  { ok: true }. Only files under music/. */
export async function deleteMusic(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "POST only" }) }
  try {
    const c = config();
    await adminFromRequest(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const key = keyFromUrl(c, body.url);
    if (!key.startsWith("music/") || key.includes("..")) throw fail(400, "That is not an uploaded track.");
    await deleteObject(c, key);
    res.status(200).json({ ok: true });
  } catch (e) { sendError(res, e) }
}
