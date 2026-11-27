/* Bank transfer + slip upload (api/pay/bank, verify, slip) against a fake Firestore and a local fake R2. Run: npm test */
import { test, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

const store = new Map();
let auto = 0;
const docRef = path => ({
  id: path.split("/").pop(),
  async get() { const d = store.get(path); return { exists: !!d, data: () => d && { ...d }, id: path.split("/").pop() } },
  async set(v) { store.set(path, { ...v }) },
  async update(v) { store.set(path, { ...store.get(path), ...v }) },
});
const fakeDb = { doc: p => docRef(p), collection: c => ({ doc: id => docRef(`${c}/${id || "ord" + (++auto)}`) }) };
const USERS = { cust: { uid: "u1", email: "c@b.lk" }, other: { uid: "u2", email: "x@b.lk" }, admin: { uid: "ad", email: "gamingmads0103@gmail.com", email_verified: true } };
mock.module("../api/_lib/firebase.js", { namedExports: {
  db: () => fakeDb,
  auth: () => ({ verifyIdToken: async t => { if (!USERS[t]) throw new Error("bad"); return USERS[t] } }),
} });

const objects = new Map();
const r2 = http.createServer((req, res) => {
  const chunks = []; req.on("data", c => chunks.push(c)); req.on("end", () => {
    if (req.method === "PUT") { objects.set(req.url, { body: Buffer.concat(chunks), type: req.headers["content-type"] }); return res.end() }
    if (req.method === "DELETE") { objects.delete(req.url); res.statusCode = 204; return res.end() }
    if (req.method === "GET") { const o = objects.get(req.url); if (!o) { res.statusCode = 404; return res.end() } res.setHeader("content-type", o.type); return res.end(o.body) }
    res.statusCode = 400; res.end();
  });
});

const fakeRes = () => { const r = { code: 200, headers: {}, body: null };
  r.status = c => (r.code = c, r); r.json = b => (r.body = b, r); r.send = b => (r.body = b, r); r.setHeader = (k, v) => { r.headers[k] = v }; return r };
const post = async (fn, body, tok) => { const res = fakeRes(); await fn({ method: "POST", headers: { authorization: "Bearer " + tok }, body }, res); return res };
const JPG = "data:image/jpeg;base64," + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(300, 7)]).toString("base64");
const PDF = "data:application/pdf;base64," + Buffer.from("%PDF-1.4 slip").toString("base64");
const BANK = { bank: "Bank of Ceylon", branch: "Kandy", name: "Aradhanawa Studio", number: "0001234567" };

let bank, verify, slip;
before(async () => {
  await new Promise(r => r2.listen(0, "127.0.0.1", r));
  Object.assign(process.env, { R2_ACCOUNT_ID: "acc", R2_ACCESS_KEY_ID: "KEY", R2_SECRET_ACCESS_KEY: "SECRET", R2_BUCKET: "photos",
    R2_PUBLIC_URL: "https://media.example.com", R2_ENDPOINT: `http://127.0.0.1:${r2.address().port}` });
  bank = (await import("../api/pay/bank.js")).default;
  verify = (await import("../api/pay/verify.js")).default;
  slip = (await import("../api/pay/slip.js")).default;
});
after(() => r2.close());

test("without bank details set in Admin, bank transfer is refused", async () => {
  store.set("settings/site", { config: { PRICE_PLUS: "Rs. 990" } });
  const r = await post(bank, { kind: "plus", type: "wedding", slip: JPG }, "cust");
  assert.equal(r.code, 503);
});

test("a slip creates an order waiting for verification, priced on the server", async () => {
  store.set("settings/site", { config: { PRICE_PLUS: "Rs. 990", BANK } });
  const r = await post(bank, { kind: "plus", type: "wedding", slip: JPG, fileName: "slip.jpg", amount: "Rs. 1" }, "cust");
  assert.equal(r.code, 200, JSON.stringify(r.body));
  const o = store.get("orders/" + r.body.orderId);
  assert.equal(o.status, "Awaiting verification");
  assert.equal(o.method, "bank"); assert.equal(o.paid, false); assert.equal(o.amount, "Rs. 990"); assert.equal(o.uid, "u1");
  assert.match(o.slipKey, /^slips\/u1\/ord\d+-[\w-]+\.jpg$/);
  assert.equal(o.payTo, "Bank of Ceylon 0001234567");
  assert.ok(objects.has("/photos/" + o.slipKey));
  assert.ok(!store.has("plus/u1_wedding"), "nothing is unlocked before an admin checks the slip");
});

test("bad files and logins are refused", async () => {
  assert.equal((await post(bank, { kind: "plus", slip: "data:text/html;base64,PGI+" }, "cust")).code, 400);
  assert.equal((await post(bank, { kind: "plus", slip: "data:image/png;base64," + Buffer.from("not a png").toString("base64") }, "cust")).code, 400);
  assert.equal((await post(bank, { kind: "plus", slip: JPG }, "nobody")).code, 401);
});

test("only admins can approve; approving unlocks the card like a card payment", async () => {
  const r = await post(bank, { kind: "plus", type: "birthday", slip: PDF }, "cust");
  const id = r.body.orderId;
  assert.equal((await post(verify, { order: id, approve: true }, "cust")).code, 403);
  const v = await post(verify, { order: id, approve: true }, "admin");
  assert.equal(v.code, 200, JSON.stringify(v.body));
  const o = store.get("orders/" + id);
  assert.equal(o.paid, true); assert.equal(o.status, "Done"); assert.equal(o.verifiedBy, "gamingmads0103@gmail.com");
  assert.equal(store.get("plus/u1_birthday").orderId, id);
  assert.equal((await post(verify, { order: id, approve: true }, "admin")).code, 409);
});

test("a rejected slip can be replaced by the owner, and the old file is removed", async () => {
  const id = (await post(bank, { kind: "plus", type: "party", slip: JPG }, "cust")).body.orderId;
  const first = store.get("orders/" + id).slipKey;
  await post(verify, { order: id, approve: false, note: "Amount does not match" }, "admin");
  assert.equal(store.get("orders/" + id).status, "Slip rejected");
  assert.equal(store.get("orders/" + id).rejectNote, "Amount does not match");
  assert.equal((await post(bank, { order: id, slip: JPG }, "other")).code, 404, "not someone else's order");
  const again = await post(bank, { order: id, slip: PDF }, "cust");
  assert.equal(again.code, 200);
  const o = store.get("orders/" + id);
  assert.equal(o.status, "Awaiting verification"); assert.notEqual(o.slipKey, first); assert.equal(o.rejectNote, "");
  assert.ok(!objects.has("/photos/" + first));
});

test("the slip file is served to the admin and the owner only", async () => {
  const id = (await post(bank, { kind: "plus", type: "dana", slip: PDF }, "cust")).body.orderId;
  const get = async tok => { const res = fakeRes(); await slip({ method: "GET", headers: { authorization: "Bearer " + tok }, query: { order: id } }, res); return res };
  const a = await get("admin");
  assert.equal(a.code, 200); assert.equal(a.headers["Content-Type"], "application/pdf"); assert.ok(a.body.toString().startsWith("%PDF-"));
  assert.equal((await get("cust")).code, 200);
  assert.equal((await get("other")).code, 403);
});
