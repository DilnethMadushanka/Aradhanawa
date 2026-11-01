/* Firebase Admin for the payment functions. Needs FIREBASE_SERVICE_ACCOUNT on Vercel:
 * the whole service account JSON (Firebase console → Project settings → Service accounts → Generate new private key). */
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app = null;
function init() {
  if (app) return app;
  if (getApps().length) return (app = getApps()[0]);
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  if (!raw) throw Object.assign(new Error("FIREBASE_SERVICE_ACCOUNT is not set on the server"), { status: 503 });
  let sa;
  try { sa = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) }
  catch (e) { throw Object.assign(new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON"), { status: 503 }) }
  return (app = initializeApp({ credential: cert(sa) }));
}

export const db = () => getFirestore(init());
export const auth = () => getAuth(init());
