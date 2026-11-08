/* Gallery photo uploads to Cloudflare R2 (api/photos/upload, api/photos/delete). */
import crypto from "node:crypto";
import { userFromRequest, fail } from "./pay.js";
import { r2Config, putObject, deleteObject, publicUrl, keyFromUrl } from "./r2.js";

export const MAX_BYTES = 700 * 1024;   // the browser shrinks photos to ~800px JPEG first (usually 60-200 KB)
const SNIFF = [["jpg", "image/jpeg", b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["png", "image/png", b => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ["webp", "image/webp", b => b.slice(0, 4).toString("latin1") === "RIFF" && b.slice(8, 12).toString("latin1") === "WEBP"]];

function sendError(res, e) {
  if (!e.status || e.status === 502) console.error("[photos]", e);
  res.status(e.status || 500).json({ error: e.status && e.status !== 502 ? e.message : "Could not save the photo. Please try again." });
}
const bodyOf = req => typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
function config() {
  const c = r2Config();
  if (!c) throw fail(503, "Photo storage is not set up on the server.");
  return c;
}

/* body { type, data: "data:image/jpeg;base64,..." }  ->  { url } */
export async function uploadPhoto(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "POST only" }) }
  try {
    const c = config(), user = await userFromRequest(req), body = bodyOf(req);
    const type = String(body.type || "");
    if (!/^[a-z]{2,20}$/.test(type)) throw fail(400, "Unknown invitation type.");
    const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ""));
    if (!m) throw fail(400, "Send one JPEG, PNG or WebP photo.");
    const buf = Buffer.from(m[1], "base64");
    if (!buf.length || buf.length > MAX_BYTES) throw fail(413, "That photo is too large.");
    const kind = SNIFF.find(([, , ok]) => ok(buf));
    if (!kind) throw fail(400, "That file is not a JPEG, PNG or WebP photo.");
    const key = `gallery/${user.uid}/${type}/${crypto.randomBytes(9).toString("base64url")}.${kind[0]}`;
    await putObject(c, key, buf, kind[1]);
    res.status(200).json({ url: publicUrl(c, key) });
  } catch (e) { sendError(res, e) }
}

/* body { url }  ->  { ok: true }. Only the owner's own photos (gallery/{uid}/...). */
export async function deletePhoto(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "POST only" }) }
  try {
    const c = config(), user = await userFromRequest(req), key = keyFromUrl(c, bodyOf(req).url);
    if (!key.startsWith(`gallery/${user.uid}/`) || key.includes("..")) throw fail(403, "That photo is not yours.");
    await deleteObject(c, key);
    res.status(200).json({ ok: true });
  } catch (e) { sendError(res, e) }
}
