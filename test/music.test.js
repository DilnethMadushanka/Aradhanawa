/* Admin MP3 upload/delete to Cloudflare R2, against a local fake R2. Run: npm test */
import { test, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

const ADMINS_DOCS = new Set(["helper@x.lk"]);
mock.module("../api/_lib/firebase.js", { namedExports: {
  db: () => ({ collection: () => ({ doc: id => ({ get: async () => ({ exists: ADMINS_DOCS.has(id) }) }) }) }),
  auth: () => ({ verifyIdToken: async t => ({
    owner: { uid: "o1", email: "gamingmads0103@gmail.com", email_verified: true },
    helper: { uid: "h1", email: "helper@x.lk", email_verified: true },
    unverified: { uid: "o2", email: "gamingmads0103@gmail.com", email_verified: false },
    user: { uid: "u1", email: "someone@x.lk", email_verified: true },
  })[t] || (() => { throw new Error("bad") })() }),
} });

const objects = new Map();
const r2 = http.createServer((req, res) => {
  const chunks = []; req.on("data", c => chunks.push(c)); req.on("end", () => {
    if (req.method === "PUT") { objects.set(req.url, { body: Buffer.concat(chunks), type: req.headers["content-type"] }); return res.end() }
    if (req.method === "DELETE") { objects.delete(req.url); res.statusCode = 204; return res.end() }
    res.statusCode = 400; res.end();
  });
});

const fakeRes = () => { const r = { code: 200, headers: {}, body: null };
  r.status = c => { r.code = c; return r }; r.json = b => { r.body = b; return r }; r.setHeader = (k, v) => { r.headers[k] = v }; return r };
const call = async (fn, body, tok = "owner") => { const res = fakeRes(); await fn({ method: "POST", headers: { authorization: "Bearer " + tok }, body }, res); return res };
const MP3 = "data:audio/mpeg;base64," + Buffer.concat([Buffer.from("ID3"), Buffer.from([4, 0, 0]), Buffer.alloc(300, 1)]).toString("base64");
const FRAME = "data:audio/mpeg;base64," + Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(300, 1)]).toString("base64");

let upload, del;
before(async () => {
  await new Promise(r => r2.listen(0, "127.0.0.1", r));
  Object.assign(process.env, { R2_ACCOUNT_ID: "acc", R2_ACCESS_KEY_ID: "KEY", R2_SECRET_ACCESS_KEY: "SECRET", R2_BUCKET: "photos",
    R2_PUBLIC_URL: "https://media.example.com", R2_ENDPOINT: `http://127.0.0.1:${r2.address().port}` });
  upload = (await import("../api/music/upload.js")).default;
  del = (await import("../api/music/delete.js")).default;
});
after(() => r2.close());

test("an admin uploads an MP3 and gets its public URL under music/", async () => {
  for (const [data, tok] of [[MP3, "owner"], [FRAME, "helper"]]) {
    const res = await call(upload, { name: "Jayamangala Gatha.mp3", data }, tok);
    assert.equal(res.code, 200, JSON.stringify(res.body));
    const m = /^https:\/\/media\.example\.com\/(music\/jayamangala-gatha-[A-Za-z0-9_-]+\.mp3)$/.exec(res.body.url);
    assert.ok(m, res.body.url);
    assert.equal(objects.get("/photos/" + m[1]).type, "audio/mpeg");
  }
});

test("only verified admins may upload, and only MP3s", async () => {
  assert.equal((await call(upload, { data: MP3 }, "user")).code, 403);
  assert.equal((await call(upload, { data: MP3 }, "unverified")).code, 403);
  assert.equal((await call(upload, { data: MP3 }, "nope")).code, 401);
  assert.equal((await call(upload, { data: "data:audio/mpeg;base64," + Buffer.from("<html>").toString("base64") })).code, 400);
  assert.equal((await call(upload, { data: "data:text/html;base64,PGI+" })).code, 400);
  const big = "data:audio/mpeg;base64," + Buffer.concat([Buffer.from("ID3"), Buffer.alloc(13 * 1024 * 1024)]).toString("base64");
  assert.equal((await call(upload, { data: big })).code, 413);
});

test("delete removes uploaded songs only", async () => {
  const { body: { url } } = await call(upload, { name: "x", data: MP3 });
  assert.equal((await call(del, { url }, "user")).code, 403);
  assert.equal((await call(del, { url: "https://media.example.com/gallery/u1/wedding/a.jpg" })).code, 403);
  assert.equal((await call(del, { url })).code, 200);
  assert.equal(objects.has("/photos/" + url.slice("https://media.example.com/".length)), false);
});

test("without R2 settings the API says storage is not set up", async () => {
  const keep = process.env.R2_BUCKET; delete process.env.R2_BUCKET;
  try { assert.equal((await call(upload, { data: MP3 })).code, 503) } finally { process.env.R2_BUCKET = keep }
});
