/* GET /api/pay/slip?order=<id>   Authorization: Bearer <Firebase ID token>  ->  the payment slip (admins and the order's owner). */
import { slipHandler } from "../_lib/bank.js";
export default slipHandler;
