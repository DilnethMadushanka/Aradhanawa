# Aradhanawa.com (prototype)

- `index.html`: standalone site. Netlify / Vercel / GitHub Pages ekata upload karama wada. Backend nathuwa share links wada karanne (event details link eke `#i=` kotase encode wela thiyenne).
- `app.html`: same app, Claude Artifact version.
- `img/`: AI images, WebP 480px / 960px (responsive srcset).
- `image-prompts.md`: AI image prompts 10.

Guest link eka open kalama full invitation website ekak (countdown, schedule, gallery, map, RSVP form, bottom nav) pennanawa. RSVP form eka WhatsApp walata reply eka yawanawa.

Wenas karanna one dewal (`CONFIG` in the script):
- `STUDIO_WA`: Aradhanawa team WhatsApp number (94764487857)
- `PRICE_PLUS`, `PRICE_CUSTOM`, `FREE_GUESTS`

Login + database: Firebase (Google login, Firestore). Setup steps: `FIREBASE_SETUP.md`. Files: `firebase-config.js` (config + admin emails), `fb.js` (Auth + Firestore), `firestore.rules`.

Online payments: Dialog Genie Business (`api/pay/*`, Vercel serverless). Setup steps: `PAYMENTS_SETUP.md`.

Production ekata ilaga steps: short links (aradhanawa.com/i/xyz), server-side 5-guest limit (danata browser eke witharai).
