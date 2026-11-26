/* Card music upload/delete to Cloudflare R2 (admins only), against a local fake R2. Run: npm test */
import { test, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

const USERS = { owner: { uid: "o1", email: "gamingmads0103@gmail.com" }, added: { uid: "a1", email: "helper@gmail.com" },
  guest: { uid: "g1", email: "someone@gmail.com" } };
mock.module("../api/_lib/firebase.js", { namedExports: {
  db: () => ({ doc: p => ({ get: async () => ({ exists: p === "admins/helper@gmail.com" }) }) }),
  auth: () => ({ verifyIdToken: async t => { if (!USERS[t]) throw new Error("bad"); return USERS[t] } }),
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
const call = async (fn, body, tok = "owner", name = "My Song.mp3") => { const res = fakeRes();
  await fn({ method: "POST", headers: { authorization: "Bearer " + tok, "x-file-name": encodeURIComponent(name) }, body }, res); return res };
const MP3 = Buffer.concat([Buffer.from("ID3"), Buffer.alloc(500, 1)]);
const FRAME = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(500, 2)]);

let upload, del;
before(async () => {
  await new Promise(r => r2.listen(0, "127.0.0.1", r));
  Object.assign(process.env, { R2_ACCOUNT_ID: "acc", R2_ACCESS_KEY_ID: "KEY", R2_SECRET_ACCESS_KEY: "SECRET", R2_BUCKET: "photos",
    R2_PUBLIC_URL: "https://media.example.com", R2_ENDPOINT: `http://127.0.0.1:${r2.address().port}` });
  upload = (await import("../api/music/upload.js")).default;
  del = (await import("../api/music/delete.js")).default;
});
after(() => r2.close());

test("an owner admin uploads an MP3 to music/ and gets its public URL and name", async () => {
  const res = await call(upload, MP3);
  assert.equal(res.code, 200, JSON.stringify(res.body));
  assert.equal(res.body.name, "My Song");
  const m = /^https:\/\/media\.example\.com\/(music\/my-song-[A-Za-z0-9_-]+\.mp3)$/.exec(res.body.url);
  assert.ok(m, res.body.url);
  const obj = objects.get("/photos/" + m[1]);
  assert.equal(obj.type, "audio/mpeg");
  assert.deepEqual(obj.body, MP3);
});

test("admins added from the dashboard can upload too; other users can't", async () => {
  assert.equal((await call(upload, FRAME, "added")).code, 200);
  assert.equal((await call(upload, MP3, "guest")).code, 403);
  assert.equal((await call(upload, MP3, "nobody")).code, 401);
});

test("only real MP3 files, 15 MB at most", async () => {
  assert.equal((await call(upload, Buffer.from("<html>not audio</html>"))).code, 400);
  assert.equal((await call(upload, Buffer.alloc(0))).code, 400);
  assert.equal((await call(upload, Buffer.concat([Buffer.from("ID3"), Buffer.alloc(15 * 1024 * 1024)]))).code, 413);
});

test("delete removes uploaded tracks only, for admins only", async () => {
  const { body: { url } } = await call(upload, MP3);
  assert.equal((await call(del, { url }, "guest")).code, 403);
  assert.equal((await call(del, { url: "https://media.example.com/gallery/u1/wedding/x.jpg" })).code, 400);
  assert.equal((await call(del, { url })).code, 200);
  assert.equal(objects.has("/photos/" + url.slice("https://media.example.com/".length)), false);
});

test("without R2 settings the API says it is not set up", async () => {
  const keep = process.env.R2_BUCKET; delete process.env.R2_BUCKET;
  try { assert.equal((await call(upload, MP3)).code, 503) } finally { process.env.R2_BUCKET = keep }
});
