/* Bank transfer with a payment slip (api/pay/bank, api/pay/verify, api/pay/slip).
 * The customer pays into the account set in Admin → Settings → Bank transfer (settings/site config.BANK), then uploads the
 * slip. The order waits as "Awaiting verification" until an admin approves it, which unlocks the card exactly like a
 * Genie payment (markPaid), or rejects it so the customer can send a new slip. Slips are stored in Cloudflare R2 under
 * slips/{uid}/ and are only ever shown through api/pay/slip, to the admin or the order's owner. */
import crypto from "node:crypto";
import { db } from "./firebase.js";
import { userFromRequest, draftOrder, markPaid, fail, ST } from "./pay.js";
import { isAdminUser, adminFromRequest } from "./admin.js";
import { r2Config, putObject, deleteObject, getObject } from "./r2.js";

export const MAX_SLIP = 3 * 1024 * 1024;   // the browser shrinks photos of slips to ~1600px JPEG (usually 150-500 KB); PDFs up to 3 MB
const SNIFF = [["jpg", "image/jpeg", b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["png", "image/png", b => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ["webp", "image/webp", b => b.slice(0, 4).toString("latin1") === "RIFF" && b.slice(8, 12).toString("latin1") === "WEBP"],
  ["pdf", "application/pdf", b => b.slice(0, 5).toString("latin1") === "%PDF-"]];

const now = () => new Date().toISOString();
const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const bodyOf = req => typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
const validId = id => /^[A-Za-z0-9_-]{1,128}$/.test(String(id || ""));

/* The account customers pay into. Bank transfer is offered only when the account name and number are set. */
export function bankFrom(c) {
  const b = (c && c.BANK && typeof c.BANK === "object") ? c.BANK : {};
  const out = { bank: str(b.bank, 80), branch: str(b.branch, 80), name: str(b.name, 120), number: str(b.number, 40), note: str(b.note, 300) };
  return out.name && out.number ? out : null;
}
async function bankAccount() {
  let c = {};
  try { const s = await db().doc("settings/site").get(); c = (s.exists && s.data().config) || {} }
  catch (e) { console.warn("[bank] settings", e.message) }
  return bankFrom(c);
}

export function readSlip(data) {
  const m = /^data:(?:image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(String(data || ""));
  if (!m) throw fail(400, "Send a photo (JPEG, PNG) or PDF of your payment slip.");
  const buf = Buffer.from(m[1], "base64");
  if (!buf.length) throw fail(400, "That slip file is empty.");
  if (buf.length > MAX_SLIP) throw fail(413, "That slip is too large (3 MB at most). Try a screenshot or a photo instead.");
  const kind = SNIFF.find(([, , ok]) => ok(buf));
  if (!kind) throw fail(400, "That file is not a photo or PDF.");
  return { buf, ext: kind[0], type: kind[1] };
}

/* New order paid by bank transfer, or a new slip for one of the customer's own bank orders that is still waiting or was rejected.
 * body { plan, kind, type, design, slip: data URL }  or  { order, slip }  ->  { orderId } */
export async function submitSlip(user, body) {
  body = body || {};
  const c = r2Config();
  if (!c) throw fail(503, "Slip upload is not set up on the server yet. Please pay by card or message us on WhatsApp.");
  const slip = readSlip(body.slip);

  let ref, order = null, oldKey = "";
  if (body.order) {
    if (!validId(body.order)) throw fail(400, "Unknown order.");
    ref = db().collection("orders").doc(String(body.order));
    const snap = await ref.get();
    const o = snap.exists ? snap.data() : null;
    if (!o || o.uid !== user.uid || o.method !== "bank") throw fail(404, "That order was not found.");
    if (o.paid || ![ST.VERIFY, ST.REJECTED].includes(o.status)) throw fail(409, "This order does not need a slip any more.");
    oldKey = o.slipKey || "";
  } else {
    const bank = await bankAccount();
    if (!bank) throw fail(503, "Bank transfer is not available right now. Please pay by card.");
    order = await draftOrder(user, body, "bank");
    order.payTo = str(`${bank.bank} ${bank.number}`, 140);
    ref = db().collection("orders").doc();
  }

  const key = `slips/${user.uid}/${ref.id}-${crypto.randomBytes(9).toString("base64url")}.${slip.ext}`;
  await putObject(c, key, slip.buf, slip.type, 60000);
  const upd = { status: ST.VERIFY, slipKey: key, slipType: slip.type, slipName: str(body.fileName, 120), slipAt: now(), rejectNote: "", updated: now() };
  if (order) await ref.set({ ...order, ...upd });
  else await ref.update(upd);
  if (oldKey && oldKey !== key) await deleteObject(c, oldKey).catch(e => console.warn("[bank] old slip", e.message));
  return { orderId: ref.id };
}

/* Admin approves (unlocks the card, same as a Genie payment) or rejects (customer can send a new slip).
 * body { order, approve: true|false, note }  ->  { ok, status } */
export async function verifySlip(admin, body) {
  body = body || {};
  if (!validId(body.order)) throw fail(400, "Unknown order.");
  const ref = db().collection("orders").doc(String(body.order));
  const snap = await ref.get();
  const o = snap.exists ? snap.data() : null;
  if (!o || o.method !== "bank") throw fail(404, "That bank transfer order was not found.");
  if (o.paid) throw fail(409, "This order is already paid.");
  const by = str(admin.email, 160);
  if (body.approve === true) {
    const done = await markPaid(ref, o, { verifiedBy: by, verifiedAt: now(), rejectNote: "" });
    return { ok: true, status: done.status };
  }
  const note = str(body.note, 300) || "We could not match this slip to a payment.";
  await ref.update({ status: ST.REJECTED, rejectNote: note, verifiedBy: by, verifiedAt: now(), updated: now() });
  return { ok: true, status: ST.REJECTED };
}

function sendError(res, e) {
  const status = e.status || 500;
  if (status >= 500) console.error("[bank]", e);
  res.status(status).json({ error: status >= 500 && status !== 503 ? "Something went wrong. Please try again." : e.message });
}
const postOnly = (req, res) => { if (req.method === "POST") return false; res.setHeader("Allow", "POST"); res.status(405).json({ error: "POST only" }); return true };

export async function bankHandler(req, res) {
  if (postOnly(req, res)) return;
  try { res.status(200).json(await submitSlip(await userFromRequest(req), bodyOf(req))) } catch (e) { sendError(res, e) }
}
export async function verifyHandler(req, res) {
  if (postOnly(req, res)) return;
  try { res.status(200).json(await verifySlip(await adminFromRequest(req, "Only admins can check payment slips."), bodyOf(req))) } catch (e) { sendError(res, e) }
}
/* GET /api/pay/slip?order=<id>  ->  the slip file. Only for admins and the order's owner. */
export async function slipHandler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "GET only" }) }
  try {
    const c = r2Config();
    if (!c) throw fail(503, "Slip storage is not set up on the server.");
    const user = await userFromRequest(req), id = String((req.query && req.query.order) || "");
    if (!validId(id)) throw fail(400, "Unknown order.");
    const snap = await db().collection("orders").doc(id).get();
    const o = snap.exists ? snap.data() : null;
    if (!o || !o.slipKey) throw fail(404, "No slip for this order.");
    if (o.uid !== user.uid && !(await isAdminUser(user))) throw fail(403, "That slip is not yours.");
    const f = await getObject(c, o.slipKey);
    if (!f) throw fail(404, "The slip file is missing.");
    res.setHeader("Content-Type", o.slipType || f.type);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(f.body);
  } catch (e) { sendError(res, e) }
}
