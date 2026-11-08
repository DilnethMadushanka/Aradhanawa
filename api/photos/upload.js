/* POST /api/photos/upload   Authorization: Bearer <Firebase ID token>
 * body { type, data: "data:image/jpeg;base64,..." }  ->  { url }  (public Cloudflare R2 address of the stored photo) */
import { uploadPhoto } from "../_lib/photos.js";
export default uploadPhoto;
