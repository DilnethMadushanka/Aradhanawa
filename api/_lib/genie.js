/* Genie Business (Dialog) "Connect" API: https://www.geniebusiness.lk/developer.php
 * Same calls the official PHP SDK makes (github.com/geniebiz/php-plugin):
 *   POST {base}transactions      Authorization: <API key>   -> { id, url, state, ... }
 *   GET  {base}transactions/{id}  Authorization: <API key>   -> { id, state, amount, currency, localId, ... }
 * Amounts are in cents (Rs. 990 = 99000). The API key only lives in the GENIE_API_KEY env var on Vercel.
 */
import crypto from "node:crypto";

export const CURRENCY = "LKR";
const BASE = {
  production: "https://api.geniebiz.lk/public/",
  sandbox: "https://api.uat.geniebiz.lk/public/",
};
export const PAID_STATES = ["CONFIRMED", "AUTHORIZED"];
export const FAILED_STATES = ["FAILED", "CANCELLED", "CANCELED", "EXPIRED", "VOIDED", "REJECTED"];

function cfg() {
  const key = (process.env.GENIE_API_KEY || "").trim();
  if (!key) throw Object.assign(new Error("GENIE_API_KEY is not set on the server"), { status: 503 });
  const base = process.env.GENIE_API_BASE || BASE[process.env.GENIE_MODE === "sandbox" ? "sandbox" : "production"];
  return { key, base: base.endsWith("/") ? base : base + "/" };
}

export const sign = (amount, currency, key) =>
  crypto.createHash("sha1").update(`amount=${amount}&currency=${currency}&apiKey=${key}`).digest("hex");

async function call(method, path, body) {
  const { key, base } = cfg();
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: key },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data = null; try { data = JSON.parse(text) } catch (e) { /* not JSON */ }
  if (!r.ok) {
    const msg = (data && (data.message || data.error)) || text.slice(0, 200) || r.statusText;
    throw Object.assign(new Error(`Genie ${method} ${path} failed (${r.status}): ${msg}`), { status: 502 });
  }
  return data || {};
}

export function createTransaction({ amount, localId, redirectUrl, webhook, customer }) {
  const { key } = cfg();
  const body = {
    amount, currency: CURRENCY, localId, redirectUrl, webhook,
    apiVersion: "2.0", appVersion: "aradhanawa-web", signMethod: "sha1",
    signature: sign(amount, CURRENCY, key),
  };
  if (customer) body.customer = customer;
  return call("POST", "transactions", body);
}

export const getTransaction = id => call("GET", "transactions/" + encodeURIComponent(id));
