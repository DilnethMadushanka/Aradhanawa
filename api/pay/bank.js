/* POST /api/pay/bank   Authorization: Bearer <Firebase ID token>
 * body { plan, type, design, slip: "data:image/jpeg;base64,..." | "data:application/pdf;base64,...", fileName }
 *   or { order, slip } to send a new slip for a waiting or rejected bank order  ->  { orderId } */
import { bankHandler } from "../_lib/bank.js";
export default bankHandler;
