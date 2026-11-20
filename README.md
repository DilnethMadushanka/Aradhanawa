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

Short guest links: login wela inna kenekuta guest link eka `aradhanawa.lk/i/Ab3dE9xk` widihata enawa (details Firestore `links/{code}` eke save wenawa). Save wenakan, logout wela innakota, nathnam `firestore.rules` publish karala nathnam parana digu `#i=` link eka enawa. Parana `#i=` links okkoma thawa wada.

Guest limit eka server eketh check karanawa: `firestore.rules` eken Free kenekuta invitation ekakata `FREE_GUESTS` (default 5) ta wada guests save karanna denne na. Plus plan eka, nathnam `plus/{uid_type}` doc eka (paid Plus order ekakin hari admin Done kalama hari hadenawa) thiyenna one. Rules wenas kalama Firebase console eke publish karanna, passe admin dashboard eka ekak open karanna (parana Done Plus orders walata `plus` docs hadanawa). Danata thiyena sima: parana digu `#i=` links okkoma browser eke hadana nisa ewa server eken nawaththanna ba.

Legal pages (`/terms`, `/privacy`, `/refunds`), `404.html`, favicon saha `site.webmanifest` hadanne `scripts/build_seo_pages.py` eken. Wenas karanna one nam e script eke `LEGAL` list eka edit karala aye run karanna.
