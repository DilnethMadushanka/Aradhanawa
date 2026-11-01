/* POST /api/pay/create   Authorization: Bearer <Firebase ID token>
 * body { plan: <plan id from Admin → Prices>, type, design }  (or the older { kind: "plus" | "custom" })  ->  { orderId, url }  (send the browser to url) */
import { userFromRequest, startCheckout, sendError } from "../_lib/pay.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "POST only" }) }
  try {
    const user = await userFromRequest(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    res.status(200).json(await startCheckout(user, body));
  } catch (e) { sendError(res, e) }
}
