/* Order + payment logic shared by api/pay/create, return and webhook. */
import { db, auth } from "./firebase.js";
import { createTransaction, getTransaction, CURRENCY, PAID_STATES, FAILED_STATES } from "./genie.js";

export const SITE = () => (process.env.SITE_URL || "https://www.aradhanawa.com").replace(/\/+$/, "");
export const TYPES = ["wedding", "homecoming", "birthday", "party", "dana", "other"];
const DEFAULT_PRICE = { plus: "Rs. 990", custom: "Rs. 4,900" };
export const KINDS = ["plus", "custom", "service"];   // what a plan unlocks: unlimited guests, a custom design, or a service the studio fulfils
export const ST = { AWAIT: "Awaiting payment", FAILED: "Payment failed" };

const now = () => new Date().toISOString();
const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
export const toCents = label => {   // "Rs. 4,900" -> 490000, "Rs. 990.50" -> 99050
  const m = String(label || "").replace(/,/g, "").match(/\d+(\.\d+)?/);
  const n = m ? +m[0] : 0; return n > 0 ? Math.round(n * 100) : 0 };
export const fail = (status, message) => Object.assign(new Error(message), { status });

/* Plans and prices come from Firestore settings/site (Admin → Prices), never from the browser.
 * Before any plan is saved, the old Plus / Custom price settings are used. */
const cleanPlan = p => {
  if (!p || typeof p !== "object") return null;
  const id = str(p.id, 40), kind = KINDS.includes(p.kind) ? p.kind : "", price = str(p.price, 40);
  if (!/^[a-z0-9-]+$/.test(id) || !kind || !toCents(price)) return null;
  return { id, kind, name: str(p.name, 120) || id, price, on: p.on !== false };
};
export function plansFrom(c) {
  c = c || {};
  if (Array.isArray(c.PLANS)) return c.PLANS.map(cleanPlan).filter(Boolean);
  return [
    { id: "plus", kind: "plus", name: "Aradhanawa Plus", price: toCents(c.PRICE_PLUS) ? c.PRICE_PLUS : DEFAULT_PRICE.plus, on: true },
    { id: "custom", kind: "custom", name: "Custom design", price: toCents(c.PRICE_CUSTOM) ? c.PRICE_CUSTOM : DEFAULT_PRICE.custom, on: true },
  ];
}
/* A plan id picks that plan. Without one (older pages), the first plan of the kind is used. Hidden plans can't be bought. */
export async function planFor({ plan, kind } = {}) {
  let c = {};
  try { const s = await db().doc("settings/site").get(); c = (s.exists && s.data().config) || {} }
  catch (e) { console.warn("[pay] settings", e.message) }
  const on = plansFrom(c).filter(p => p.on);
  const p = plan ? on.find(x => x.id === String(plan)) : on.find(x => x.kind === kind);
  return p ? { ...p, label: p.price, cents: toCents(p.price) } : null;
}
export async function priceFor(kind) {
  const p = await planFor({ kind });
  return p ? { label: p.label, cents: p.cents } : { label: "", cents: 0 };
}

export async function userFromRequest(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!tok) throw fail(401, "Please log in to pay.");
  try { return await auth().verifyIdToken(tok) } catch (e) { throw fail(401, "Your login expired. Please log in again.") }
}

export async function startCheckout(user, body) {
  body = body || {};
  if (!body.plan && !KINDS.includes(body.kind)) throw fail(400, "Unknown product.");
  const plan = await planFor({ plan: body.plan, kind: body.kind });
  if (!plan) throw fail(400, "This price plan is not available any more. Please refresh the page.");
  const { kind, label, cents } = plan;
  if (!cents) throw fail(500, "Price is not set.");
  const type = TYPES.includes(body.type) ? body.type : "other";
  const design = (kind === "custom" && str(body.design, 120)) || plan.name;

  const prof = (await db().doc(`users/${user.uid}`).get()).data() || {};
  const ref = db().collection("orders").doc();
  const order = {
    kind, design, type, planId: plan.id, planName: plan.name,
    name: str(prof.name || user.name || "", 160), email: str(prof.email || user.email || "", 160).toLowerCase(), phone: str(prof.phone || "", 40),
    amount: label, amountCents: cents, currency: CURRENCY, status: ST.AWAIT, paid: false, method: "genie",
    created: now(), uid: user.uid,
  };
  await ref.set(order);

  const site = SITE();
  let tx;
  try {
    tx = await createTransaction({
      amount: cents, localId: ref.id,
      redirectUrl: `${site}/api/pay/return?order=${ref.id}`,
      webhook: `${site}/api/pay/webhook`,
      customer: order.email || order.phone ? { name: order.name, email: order.email || undefined, phone: order.phone || undefined } : undefined,
    });
  } catch (e) {
    await ref.update({ status: ST.FAILED, payError: str(e.message, 300), updated: now() }).catch(() => {});
    throw e;
  }
  const url = tx.url || tx.paymentUrl || tx.checkoutUrl;
  if (!tx.id || !url) {
    await ref.update({ status: ST.FAILED, payError: "Genie did not return a payment link", updated: now() }).catch(() => {});
    throw fail(502, "The payment page could not be opened. Please try again.");
  }
  await ref.update({ payRef: String(tx.id), payState: str(tx.state, 40), updated: now() });
  return { orderId: ref.id, url };
}

/* Ask Genie for the real state of this order's transaction and record it.
 * Only the server-stored transaction id is trusted, so a forged redirect or webhook can't mark an order paid. */
export async function settle(orderId) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(String(orderId || ""))) return { result: "missing" };
  const ref = db().collection("orders").doc(String(orderId));
  const snap = await ref.get();
  if (!snap.exists) return { result: "missing" };
  const o = snap.data();
  if (o.paid) return { result: "paid", order: o };
  if (!o.payRef) return { result: "pending", order: o };

  const tx = await getTransaction(o.payRef);
  const state = String(tx.state || tx.status || "").toUpperCase();
  const amountOk = tx.amount == null || +tx.amount === +o.amountCents;
  const currencyOk = !tx.currency || String(tx.currency).toUpperCase() === (o.currency || CURRENCY);
  const localOk = !tx.localId || String(tx.localId) === ref.id;

  if (PAID_STATES.includes(state) && amountOk && currencyOk && localOk) {
    const upd = {
      paid: true, paidAt: now(), payState: state, updated: now(),
      // Plus is ready at once. A custom design or a service still needs the studio, so the admin marks it Done later.
      status: o.kind === "plus" ? "Done" : "In progress",
    };
    await ref.update(upd);
    return { result: "paid", order: { ...o, ...upd } };
  }
  if (PAID_STATES.includes(state)) {
    await ref.update({ payState: state, payError: `Mismatch: amount ${tx.amount} ${tx.currency}, localId ${tx.localId}`, updated: now() });
    console.error("[pay] mismatch", ref.id, tx.amount, tx.currency, tx.localId);
    return { result: "pending", order: o };
  }
  if (FAILED_STATES.includes(state)) {
    await ref.update({ status: ST.FAILED, payState: state, updated: now() });
    return { result: "failed", order: o };
  }
  if (state && state !== o.payState) await ref.update({ payState: state, updated: now() });
  return { result: "pending", order: o };
}

export function sendError(res, e) {
  const status = e.status || 500;
  if (status >= 500) console.error("[pay]", e);
  res.status(status).json({ error: status >= 500 && !e.status ? "Something went wrong. Please try again." : e.message });
}
