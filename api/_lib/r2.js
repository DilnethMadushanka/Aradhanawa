/* Cloudflare R2 (S3-compatible) for gallery photos and card music. No SDK: requests are signed with AWS Signature V4 using node:crypto.
 * Settings (server .env):
 *   R2_ACCOUNT_ID         Cloudflare account ID (R2 overview page, right side)
 *   R2_ACCESS_KEY_ID      R2 API token → Access Key ID
 *   R2_SECRET_ACCESS_KEY  R2 API token → Secret Access Key
 *   R2_BUCKET             bucket name, e.g. aradhanawa-photos
 *   R2_PUBLIC_URL         public address of the bucket, e.g. https://pub-xxxx.r2.dev or https://media.aradhanawa.com
 * Photos are stored at gallery/{uid}/{type}/{random}.{ext}, card music (Admin → Settings → Music library) at music/{name}-{random}.mp3.
 * Guests load both straight from R2_PUBLIC_URL. Bank transfer slips go to slips/{uid}/{order}-{random}.{ext}; the site never links
 * their public address, admins see them through api/pay/slip. */
import crypto from "node:crypto";

const env = k => String(process.env[k] || "").trim();
export function r2Config() {
  const c = { account: env("R2_ACCOUNT_ID"), key: env("R2_ACCESS_KEY_ID"), secret: env("R2_SECRET_ACCESS_KEY"),
    bucket: env("R2_BUCKET"), publicUrl: env("R2_PUBLIC_URL").replace(/\/+$/, ""), endpoint: env("R2_ENDPOINT").replace(/\/+$/, "") };
  if (!c.account || !c.key || !c.secret || !c.bucket || !/^https:\/\//.test(c.publicUrl)) return null;
  if (!c.endpoint) c.endpoint = `https://${c.account}.r2.cloudflarestorage.com`;
  return c;
}

const sha256 = d => crypto.createHash("sha256").update(d).digest("hex");
const hmac = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
const encKey = key => key.split("/").map(s => encodeURIComponent(s)).join("/");

/* Signs one request to the bucket. Exported for the tests. */
export function signedRequest(c, method, key, body = Buffer.alloc(0), headers = {}, now = new Date()) {
  const url = new URL(`${c.endpoint}/${encodeURIComponent(c.bucket)}/${encKey(key)}`);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""), day = amzDate.slice(0, 8);
  const h = { ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()])),
    host: url.host, "x-amz-content-sha256": sha256(body), "x-amz-date": amzDate };
  const names = Object.keys(h).sort();
  const canonical = [method, url.pathname, "", names.map(n => `${n}:${h[n]}\n`).join(""), names.join(";"), h["x-amz-content-sha256"]].join("\n");
  const scope = `${day}/auto/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const kSign = hmac(hmac(hmac(hmac("AWS4" + c.secret, day), "auto"), "s3"), "aws4_request");
  h.authorization = `AWS4-HMAC-SHA256 Credential=${c.key}/${scope}, SignedHeaders=${names.join(";")}, Signature=${crypto.createHmac("sha256", kSign).update(toSign).digest("hex")}`;
  delete h.host;
  return { url: url.href, init: { method, headers: h, body: method === "PUT" ? body : undefined } };
}

async function send(c, method, key, body, headers, ms = 15000) {
  const { url, init } = signedRequest(c, method, key, body, headers);
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  if (!r.ok && !(method === "DELETE" && r.status === 404)) {
    const t = await r.text().catch(() => "");
    throw Object.assign(new Error(`R2 ${method} failed: ${r.status} ${t.slice(0, 300)}`), { status: 502 });
  }
}

export const putObject = (c, key, body, type, ms) =>
  send(c, "PUT", key, body, { "content-type": type, "cache-control": "public, max-age=31536000, immutable" }, ms);
export const deleteObject = (c, key) => send(c, "DELETE", key);
/* Reads one object back (bank slips are served to the admin through api/pay/slip, not from the public address). */
export async function getObject(c, key, ms = 15000) {
  const { url, init } = signedRequest(c, "GET", key);
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  if (r.status === 404) return null;
  if (!r.ok) { const t = await r.text().catch(() => ""); throw Object.assign(new Error(`R2 GET failed: ${r.status} ${t.slice(0, 300)}`), { status: 502 }) }
  return { body: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type") || "application/octet-stream" };
}
export const publicUrl = (c, key) => `${c.publicUrl}/${encKey(key)}`;
/* The object key for a public URL of ours, or "" when the URL is not from this bucket. */
export const keyFromUrl = (c, url) => typeof url === "string" && url.startsWith(c.publicUrl + "/") ? decodeURIComponent(url.slice(c.publicUrl.length + 1)) : "";
