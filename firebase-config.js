/* Aradhanawa ↔ Firebase settings.
 *
 * 1. Firebase console → Project settings → General → "Your apps" → Web app → copy the config object
 *    and paste it as `config` below (replace null).
 * 2. Put the Google account email(s) that should open the admin dashboard in `adminEmails`.
 *    Put the same emails in firestore.rules (ADMIN_EMAILS) so the database enforces it too.
 *
 * While `config` is null the site runs in demo mode: accounts and orders live in this browser only.
 * These keys are public by design (Firebase web config); security comes from firestore.rules.
 */
window.ARADHANA_FIREBASE = {
  config: {
    apiKey: "AIzaSyB9LkG0w9QI5C76bDpoc6fdvu1BHheBfik",
    authDomain: "aradhanawa-e52be.firebaseapp.com",
    projectId: "aradhanawa-e52be",
    storageBucket: "aradhanawa-e52be.firebasestorage.app",
    messagingSenderId: "177511735890",
    appId: "1:177511735890:web:505396847f755bb524758b",
    measurementId: "G-YQJEHHCVPK"
  },
  adminEmails: [
    "raveeshaheshan26@gmail.com"
  ]
};
