/* POST /api/photos/delete   Authorization: Bearer <Firebase ID token>
 * body { url }  ->  { ok: true }   (removes one of the caller's own gallery photos from Cloudflare R2) */
import { deletePhoto } from "../_lib/photos.js";
export default deletePhoto;
