/* Payment flow tests: fake Firestore + a local fake Genie API. Run: npm test */
import { test, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";

/* ---- fake Firestore / Auth ---- */
const store = new Map();
let auto = 0;
const docRef = path => ({
  id: path.split("/").pop(),
  async get() { const d = store.get(path); return { exists: !!d, data: () => d && { ...d }, id: path.split("/").pop() } },
  async set(v) { store.set(path, { ...v }) },
  async update(v) { store.set(path, { ...store.get(path), ...v }) },
});
const fakeDb = {
  doc: p => docRef(p),
  collection: c => ({
    doc: id => docRef(`${c}/${id || "ord" + (++auto)}`),
    where: (f, _op, v) => ({ limit: () => ({ async get() {
      const docs = [...store].filter(([k, d]) => k.startsWith(c + "/") && d[f] === v).map(([k]) => ({ id: k.split("/").pop() }));
      return { empty: !docs.length, docs } } }) }),
  }),
};
mock.module("../api/_lib/firebase.js", { namedExports: {
  db: () => fakeDb,
  auth: () => ({ verifyIdToken: async t => { if (t !== "good") throw new Error("bad"); return { uid: "u1", email: "a@b.lk" } } }),
} });

/* ---- fake Genie ---- */
const txs = new Map(); let lastCreate = null;
const genie = http.createServer((req, res) => {
  let body = ""; req.on("data", c => body += c); req.on("end", () => {
    assert.equal(req.headers.authorization, "test-key");
    if (req.method === "POST" && req.url === "/transactions") {
      lastCreate = JSON.parse(body);
      const id = "tx" + (txs.size + 1);
      txs.set(id, { id, state: "INITIATED", amount: lastCreate.amount, currency: lastCreate.currency, localId: lastCreate.localId });
      res.end(JSON.stringify({ id, url: "https://pay.example/" + id, state: "INITIATED" }));
    } else if (req.method === "GET" && req.url.startsWith("/transactions/")) {
      const t = txs.get(req.url.split("/").pop()); res.statusCode = t ? 200 : 404; res.end(JSON.stringify(t || { message: "nf" }));
    } else { res.statusCode = 404; res.end("{}") }
  });
});

let pay;
before(async () => {
  await new Promise(r => genie.listen(0, r));
  process.env.GENIE_API_KEY = "test-key";
  process.env.GENIE_API_BASE = `http://127.0.0.1:${genie.address().port}/`;
  process.env.SITE_URL = "https://www.aradhanawa.com";
  pay = await import("../api/_lib/pay.js");
});
after(() => genie.close());

const fakeRes = () => { const r = { code: 200, headers: {}, body: null, loc: null };
  r.status = c => (r.code = c, r); r.json = b => (r.body = b, r); r.setHeader = (k, v) => r.headers[k] = v; r.redirect = (c, l) => (r.code = c, r.loc = l, r); return r };

test("price comes from admin settings, not the browser", async () => {
  store.set("settings/site", { config: { PRICE_PLUS: "Rs. 1,250", PRICE_CUSTOM: "Rs. 4,900" } });
  store.set("users/u1", { name: "Kasun", email: "a@b.lk", phone: "0771234567" });
  const { default: create } = await import("../api/pay/create.js");
  const res = fakeRes();
  await create({ method: "POST", headers: { authorization: "Bearer good" }, body: { kind: "plus", type: "wedding", amount: 1 } }, res);
  assert.equal(res.code, 200, JSON.stringify(res.body));
  assert.match(res.body.url, /^https:\/\/pay\.example\//);
  assert.equal(lastCreate.amount, 125000);
  assert.equal(lastCreate.currency, "LKR");
  assert.equal(lastCreate.signature, crypto.createHash("sha1").update("amount=125000&currency=LKR&apiKey=test-key").digest("hex"));
  assert.equal(lastCreate.redirectUrl, `https://www.aradhanawa.com/api/pay/return?order=${res.body.orderId}`);
  const o = store.get("orders/" + res.body.orderId);
  assert.equal(o.status, "Awaiting payment"); assert.equal(o.uid, "u1"); assert.equal(o.payRef, "tx1"); assert.equal(o.paid, false);
});

test("needs a login", async () => {
  const { default: create } = await import("../api/pay/create.js");
  const res = fakeRes();
  await create({ method: "POST", headers: {}, body: { kind: "plus" } }, res);
  assert.equal(res.code, 401);
});

test("return before paying stays pending; after CONFIRMED marks Plus Done", async () => {
  const { default: ret } = await import("../api/pay/return.js");
  const id = [...store.keys()].find(k => k.startsWith("orders/")).split("/")[1];
  let res = fakeRes();
  await ret({ query: { order: id, state: "CONFIRMED" }, headers: {} }, res);   // forged state in the URL is ignored
  assert.match(res.loc, /\?pay=pending/);
  assert.equal(store.get("orders/" + id).paid, false);
  txs.get("tx1").state = "CONFIRMED";
  res = fakeRes();
  await ret({ query: { order: id }, headers: {} }, res);
  assert.equal(res.loc, `https://www.aradhanawa.com/?pay=ok&kind=plus&order=${id}#account`);
  const o = store.get("orders/" + id);
  assert.equal(o.paid, true); assert.equal(o.status, "Done");
});

test("custom design: webhook settles to In progress; amount mismatch never pays", async () => {
  const { default: create } = await import("../api/pay/create.js");
  const { default: hook } = await import("../api/pay/webhook.js");
  let res = fakeRes();
  await create({ method: "POST", headers: { authorization: "Bearer good" }, body: { kind: "custom", type: "birthday", design: "Confetti Pop" } }, res);
  const id = res.body.orderId, tx = store.get("orders/" + id).payRef;
  assert.equal(lastCreate.amount, 490000);
  txs.get(tx).state = "CONFIRMED"; txs.get(tx).amount = 100;
  res = fakeRes(); await hook({ method: "POST", headers: {}, body: { transactionId: tx } }, res);
  assert.equal(store.get("orders/" + id).paid, false);
  txs.get(tx).amount = 490000;
  res = fakeRes(); await hook({ method: "POST", headers: {}, body: { transactionId: tx, localId: id } }, res);
  assert.equal(res.body.result, "paid");
  const o = store.get("orders/" + id);
  assert.equal(o.status, "In progress"); assert.equal(o.design, "Confetti Pop");
});

test("failed payment is recorded; bad ids are ignored", async () => {
  const { default: create } = await import("../api/pay/create.js");
  const res = fakeRes();
  await create({ method: "POST", headers: { authorization: "Bearer good" }, body: { kind: "plus", type: "party" } }, res);
  const id = res.body.orderId; txs.get(store.get("orders/" + id).payRef).state = "FAILED";
  assert.equal((await pay.settle(id)).result, "failed");
  assert.equal(store.get("orders/" + id).status, "Payment failed");
  assert.equal((await pay.settle("../settings/site")).result, "missing");
});
