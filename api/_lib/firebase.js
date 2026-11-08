/* Firebase Admin for the server functions. Firestore (payments) needs FIREBASE_SERVICE_ACCOUNT:
 * the whole service account JSON (Firebase console → Project settings → Service accounts → Generate new private key).
 * Checking a login (verifyIdToken, used by api/photos/*) only needs the project ID, so it works without the service account:
 * FIREBASE_PROJECT_ID, or else the projectId in firebase-config.js. */
import fs from "node:fs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const saRaw = () => (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
function projectId() {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID.trim();
  try { return (/projectId:\s*["']([a-z0-9-]+)["']/.exec(fs.readFileSync(new URL("../../firebase-config.js", import.meta.url), "utf8")) || [])[1] || "" }
  catch { return "" }
}

let app = null;
function init() {
  if (app) return app;
  if (getApps().length) return (app = getApps()[0]);
  const raw = saRaw();
  if (!raw) {
    const id = projectId();
    if (!id) throw Object.assign(new Error("FIREBASE_SERVICE_ACCOUNT is not set on the server"), { status: 503 });
    return (app = initializeApp({ projectId: id }));   // login checks only
  }
  let sa;
  try { sa = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) }
  catch (e) { throw Object.assign(new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON"), { status: 503 }) }
  return (app = initializeApp({ credential: cert(sa) }));
}

export const db = () => {
  if (!saRaw()) throw Object.assign(new Error("FIREBASE_SERVICE_ACCOUNT is not set on the server"), { status: 503 });
  return getFirestore(init());
};
export const auth = () => getAuth(init());
