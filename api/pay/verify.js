/* POST /api/pay/verify   Authorization: Bearer <Firebase ID token of an admin>
 * body { order, approve: true | false, note }  ->  { ok, status }. Approving unlocks the card the same way a card payment does. */
import { verifyHandler } from "../_lib/bank.js";
export default verifyHandler;
