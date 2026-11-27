/* Who counts as an admin on the server (api/music/*, api/pay/verify, api/pay/slip). */
import fs from "node:fs";
import { db } from "./firebase.js";
import { userFromRequest, fail } from "./pay.js";

/* Owner emails: adminEmails in firebase-config.js (the same list the dashboard uses) plus ADMIN_EMAILS in .env (comma separated).
 * Admins added from Admin → Settings → Admins live in Firestore admins/{email}. */
let owners = null;
function ownerEmails() {
  if (owners) return owners;
  let txt = "";
  try { txt = fs.readFileSync(new URL("../../firebase-config.js", import.meta.url), "utf8") } catch {}
  const m = /adminEmails\s*:\s*\[([^\]]*)\]/.exec(txt);
  const fromFile = m ? [...m[1].matchAll(/["']([^"']+)["']/g)].map(x => x[1]) : [];
  const fromEnv = String(process.env.ADMIN_EMAILS || "").split(",");
  return owners = [...fromFile, ...fromEnv].map(e => e.trim().toLowerCase()).filter(Boolean);
}

export async function isAdminUser(user) {
  const em = String((user && user.email) || "").toLowerCase();
  if (!em || user.email_verified === false) return false;
  if (ownerEmails().includes(em)) return true;
  try { return (await db().doc(`admins/${em}`).get()).exists } catch (e) { console.warn("[admin] admins", e.message); return false }
}

export async function adminFromRequest(req, message = "Only admins can do that.") {
  const user = await userFromRequest(req);
  if (await isAdminUser(user)) return user;
  throw fail(403, message);
}
