/* Background music uploads to Cloudflare R2 (api/music/upload, api/music/delete). Admins only.
 * The admin dashboard (Admin → Music) uploads an MP3 here, saves the returned URL in settings/site config.MUSIC_LIB,
 * and picks it for a function or a single card design. Files are stored at music/{random}.mp3. */
import fs from "node:fs";
import crypto from "node:crypto";
import { userFromRequest, fail } from "./pay.js";
import { db } from "./firebase.js";
import { r2Config, putObject, deleteObject, publicUrl, keyFromUrl } from "./r2.js";

export const MAX_BYTES = 12 * 1024 * 1024;   // a 4-5 minute song at 192 kbps is ~7 MB

/* An MP3 starts with an ID3 tag or an MPEG audio frame (11 sync bits set, layer III). */
export const isMp3 = b => b.length > 4 && ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe6) === 0xe2));

function bootstrapAdmins() {
  const env = String(process.env.ADMIN_EMAILS || "").split(",");
  let file = [];
  try {
    const src = fs.readFileSync(new URL("../../firebase-config.js", import.meta.url), "utf8");
    const m = /adminEmails\s*:\s*\[([^\]]*)\]/.exec(src);
    if (m) file = [...m[1].matchAll(/["']([^"']+)["']/g)].map(x => x[1]);
  } catch { /* no config file */ }
  return [...env, ...file].map(e => e.trim().toLowerCase()).filter(Boolean);
}

/* Same rule as firestore.rules: a verified Google email in firebase-config.js adminEmails, or an admins/{email} doc. */
export async function adminFromRequest(req) {
  const user = await userFromRequest(req), em = String(user.email || "").toLowerCase();
  if (!em || !user.email_verified) throw fail(403, "Admins only.");
  if (bootstrapAdmins().includes(em)) return user;
  try { if ((await db().collection("admins").doc(em).get()).exists) return user } catch { /* no service account: owners only */ }
  throw fail(403, "Admins only.");
}

function sendError(res, e) {
  if (!e.status || e.status === 502) console.error("[music]", e);
  res.status(e.status || 500).json({ error: e.status && e.status !== 502 ? e.message : "Could not save the song. Please try again." });
}
const bodyOf = req => typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
function config() {
  const c = r2Config();
  if (!c) throw fail(503, "Music storage (Cloudflare R2) is not set up on the server.");
  return c;
}

/* body { name, data: "data:audio/mpeg;base64,..." }  ->  { url } */
export async function uploadMusic(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "POST only" }) }
  try {
    const c = config(); await adminFromRequest(req); const body = bodyOf(req);
    const m = /^data:audio\/(?:mpeg|mp3|mpeg3|x-mpeg-3);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ""));
    if (!m) throw fail(400, "Send one MP3 file.");
    const buf = Buffer.from(m[1], "base64");
    if (!buf.length || buf.length > MAX_BYTES) throw fail(413, "That song is too large (12 MB at most).");
    if (!isMp3(buf)) throw fail(400, "That file is not an MP3.");
    const slug = String(body.name || "").toLowerCase().replace(/\.mp3$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    const key = `music/${slug ? slug + "-" : ""}${crypto.randomBytes(6).toString("base64url")}.mp3`;
    await putObject(c, key, buf, "audio/mpeg");
    res.status(200).json({ url: publicUrl(c, key) });
  } catch (e) { sendError(res, e) }
}

/* body { url }  ->  { ok: true }. Only files under music/. */
export async function deleteMusic(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "POST only" }) }
  try {
    const c = config(); await adminFromRequest(req); const key = keyFromUrl(c, bodyOf(req).url);
    if (!key.startsWith("music/") || key.includes("..")) throw fail(403, "That is not an uploaded song.");
    await deleteObject(c, key);
    res.status(200).json({ ok: true });
  } catch (e) { sendError(res, e) }
}
