/* POST /api/music/upload   Authorization: Bearer <Firebase ID token of an admin>
 * body { name, data: "data:audio/mpeg;base64,..." }  ->  { url }  (public Cloudflare R2 address of the MP3) */
import { uploadMusic } from "../_lib/music.js";
export default uploadMusic;
