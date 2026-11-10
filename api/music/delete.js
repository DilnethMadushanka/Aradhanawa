/* POST /api/music/delete   Authorization: Bearer <Firebase ID token of an admin>
 * body { url }  ->  { ok: true }   (removes an uploaded song from Cloudflare R2) */
import { deleteMusic } from "../_lib/music.js";
export default deleteMusic;
