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
  config: null,
  // config: {
  //   apiKey: "AIza...",
  //   authDomain: "your-project.firebaseapp.com",
  //   projectId: "your-project",
  //   storageBucket: "your-project.appspot.com",
  //   messagingSenderId: "1234567890",
  //   appId: "1:1234567890:web:abc123"
  // },
  adminEmails: [
    // "you@gmail.com"
  ]
};
