/* POST /api/music/upload   Authorization: Bearer <Firebase ID token of an admin>
 * Content-Type: audio/mpeg, X-File-Name: <file name>, body = the MP3  ->  { url, name }  (public Cloudflare R2 address) */
import { uploadMusic } from "../_lib/music.js";
export default uploadMusic;
