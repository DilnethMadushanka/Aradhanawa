/* GET /api/pay/return?order=<id>  (Genie sends the customer here after paying and adds transactionId/state/signature)
 * Checks the real state with Genie, then sends the customer back to the site with ?pay=ok|pending|failed. */
import { settle, SITE } from "../_lib/pay.js";

export default async function handler(req, res) {
  const id = String((req.query && req.query.order) || "");
  let r = { result: "pending" };
  if (id) { try { r = await settle(id) } catch (e) { console.error("[pay] return", id, e) } }
  const pay = r.result === "paid" ? "ok" : r.result === "failed" ? "failed" : "pending";
  const kind = r.order && r.order.kind ? `&kind=${r.order.kind}` : "";
  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, `${SITE()}/?pay=${pay}${kind}&order=${encodeURIComponent(id)}#account`);
}
