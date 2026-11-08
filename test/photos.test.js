/* Gallery photo upload/delete to Cloudflare R2, against a local fake R2. Run: npm test */
import { test, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";

mock.module("../api/_lib/firebase.js", { namedExports: {
  db: () => ({}),
  auth: () => ({ verifyIdToken: async t => { if (t !== "good") throw new Error("bad"); return { uid: "u1", email: "a@b.lk" } } }),
} });

const objects = new Map(); const seen = [];
const r2 = http.createServer((req, res) => {
  const chunks = []; req.on("data", c => chunks.push(c)); req.on("end", () => {
    const body = Buffer.concat(chunks);
    seen.push({ method: req.method, url: req.url, headers: req.headers });
    assert.match(req.headers.authorization, /^AWS4-HMAC-SHA256 Credential=KEY\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=[a-z0-9;-]+, Signature=[0-9a-f]{64}$/);
    assert.equal(req.headers["x-amz-content-sha256"], crypto.createHash("sha256").update(body).digest("hex"));
    if (req.method === "PUT") { objects.set(req.url, { body, type: req.headers["content-type"] }); return res.end() }
    if (req.method === "DELETE") { objects.delete(req.url); res.statusCode = 204; return res.end() }
    res.statusCode = 400; res.end();
  });
});

const fakeRes = () => { const r = { code: 200, headers: {}, body: null };
  r.status = c => { r.code = c; return r }; r.json = b => { r.body = b; return r }; r.setHeader = (k, v) => { r.headers[k] = v }; return r };
const call = async (fn, body, tok = "good") => { const res = fakeRes(); await fn({ method: "POST", headers: { authorization: "Bearer " + tok }, body }, res); return res };
const JPEG = "data:image/jpeg;base64," + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)]).toString("base64");

let upload, del;
before(async () => {
  await new Promise(r => r2.listen(0, "127.0.0.1", r));
  Object.assign(process.env, { R2_ACCOUNT_ID: "acc", R2_ACCESS_KEY_ID: "KEY", R2_SECRET_ACCESS_KEY: "SECRET", R2_BUCKET: "photos",
    R2_PUBLIC_URL: "https://media.example.com/", R2_ENDPOINT: `http://127.0.0.1:${r2.address().port}` });
  upload = (await import("../api/photos/upload.js")).default;
  del = (await import("../api/photos/delete.js")).default;
});
after(() => r2.close());

test("upload stores the photo under the user's folder and returns its public URL", async () => {
  const res = await call(upload, { type: "wedding", data: JPEG });
  assert.equal(res.code, 200, JSON.stringify(res.body));
  const m = /^https:\/\/media\.example\.com\/(gallery\/u1\/wedding\/[A-Za-z0-9_-]+\.jpg)$/.exec(res.body.url);
  assert.ok(m, res.body.url);
  const obj = objects.get("/photos/" + m[1]);
  assert.equal(obj.type, "image/jpeg");
  assert.deepEqual(obj.body, Buffer.from(JPEG.split(",")[1], "base64"));
  assert.equal(seen.at(-1).headers["cache-control"], "public, max-age=31536000, immutable");
});

test("upload refuses bad logins, types and files", async () => {
  assert.equal((await call(upload, { type: "wedding", data: JPEG }, "bad")).code, 401);
  assert.equal((await call(upload, { type: "../x", data: JPEG })).code, 400);
  assert.equal((await call(upload, { type: "wedding", data: "data:image/jpeg;base64," + Buffer.from("not an image").toString("base64") })).code, 400);
  assert.equal((await call(upload, { type: "wedding", data: "data:text/html;base64,PGI+" })).code, 400);
  const big = "data:image/jpeg;base64," + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(800 * 1024)]).toString("base64");
  assert.equal((await call(upload, { type: "wedding", data: big })).code, 413);
});

test("delete removes only the caller's own photos", async () => {
  const { body: { url } } = await call(upload, { type: "party", data: JPEG });
  assert.equal((await call(del, { url: url.replace("/u1/", "/u2/") })).code, 403);
  assert.equal((await call(del, { url: "https://evil.example/gallery/u1/party/x.jpg" })).code, 403);
  const res = await call(del, { url });
  assert.equal(res.code, 200);
  assert.equal(objects.has("/photos/" + url.slice("https://media.example.com/".length)), false);
});

test("without R2 settings the API says it is not set up (the site then keeps photos in Firestore)", async () => {
  const keep = process.env.R2_BUCKET; delete process.env.R2_BUCKET;
  try { assert.equal((await call(upload, { type: "wedding", data: JPEG })).code, 503) } finally { process.env.R2_BUCKET = keep }
});
