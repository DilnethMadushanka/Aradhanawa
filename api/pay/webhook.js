/* POST /api/pay/webhook  Genie calls this when a transaction changes.
 * The body is only used to find the order; settle() re-reads the transaction from Genie before marking anything paid. */
import { settle } from "../_lib/pay.js";
import { db } from "../_lib/firebase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "POST only" }) }
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    let id = String(b.localId || (b.data && b.data.localId) || "").slice(0, 128);
    const txId = String(b.transactionId || b.id || (b.data && b.data.id) || "").slice(0, 128);
    if (!/^[A-Za-z0-9_-]+$/.test(id) && txId) {
      const q = await db().collection("orders").where("payRef", "==", txId).limit(1).get();
      id = q.empty ? "" : q.docs[0].id;
    }
    if (!id) return res.status(200).json({ ok: true, ignored: true });
    const r = await settle(id);
    res.status(200).json({ ok: true, result: r.result });
  } catch (e) {
    console.error("[pay] webhook", e);
    res.status(500).json({ ok: false });
  }
}
