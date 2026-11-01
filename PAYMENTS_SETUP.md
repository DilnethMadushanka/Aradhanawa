# Online payments (Dialog Genie Business)

Customers **Pay Rs. 990** (Aradhanawa Plus) or **Pay Rs. 4,900** (custom design) karama Genie payment page ekata yanawa. Pay karala awama order eka automatically **Paid** wenawa.

- Plus: order eka `Done` wenawa, e function ekata guest limit eka ain wenawa.
- Custom design: order eka `In progress` wenawa (paid). Design eka ready unama Admin → Orders eken `Done` karanna; ethakota design eka unlock wenawa.
- Prices ganne **Admin → Prices** walin (server eken). Browser eken price eka wenas karanna ba.
  - **Add plan**: nama, price (`Rs. 12,000` wage), type eka (Plus / Custom design / Other service), details (line ekakata point ekak).
  - **Edit** / **Delete** / ↑ (order eka) / **On site** switch eken hide karanna puluwan. Hide karapu ho delete karapu plan ekak kawuruwath ganna ba.
  - Plus type eka pay karapu gaman guest limit eka ain wenawa. Custom design saha Other service `In progress` wela, oya Orders eken `Done` karanna one.
  - Hama type ekema site eke pennanne udinma thiyena plan eka **Main** eka (editor eke Plus upgrade eka saha design yata Buy button eka eka use karanawa).

## Vercel eke danna one env vars (eka parak witharai)

Vercel → aradhanawa project → **Settings → Environment Variables** → Production (saha Preview) ekata:

| Name | Value |
|---|---|
| `GENIE_API_KEY` | Genie dashboard → **Connect** → `aradhanawa` app → **API Key (secret)** → Copy. (`eyJ...` walin patan ganna eka. Public Key eka nemei.) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase console → ⚙ **Project settings → Service accounts → Generate new private key** → download wena JSON file eke **mulu content eka** paste karanna. |
| `SITE_URL` | `https://www.aradhanawa.com` (optional, default eka meka) |

Danata passe **Deployments → latest → Redeploy** karanna (env vars ganne aluth deploy walata witharai).

> Secret key eka saha service account JSON eka **kawadawat** code ekata, GitHub ekata, WhatsApp ekata danna epa. Vercel env vars wala witharai. Key eka leak unoth Genie Connect eken app eka delete karala aluth ekak hadala Vercel eke value eka maru karanna.

## Test karanna
1. Genie dashboard eke **test payment provider** eka on karanna puluwan (live account eke, salli payout wenne na). Nathnam Rs. 990 real payment ekak karala refund karanna.
2. Site eke log wela → Create → **Get Plus → Pay Rs. 990**.
3. Genie page eke pay karanna → site ekata aye enawa → "Payment received" pennanawa.
4. Admin → Orders eke order eka **Done · Paid** wela thiyenna one.

Sandbox ekak one nam (genie.integration@dialog.lk walin illanna), `GENIE_MODE=sandbox` saha sandbox key eka `GENIE_API_KEY` ekata danna.

## Kohomada wada karanne
- `api/pay/create.js` – login wela inna user ge order eka Firestore eke `Awaiting payment` widiyata hadala, Genie transaction ekak hadala payment link eka denawa.
- `api/pay/return.js` – Genie eken customer wa aye ewana thana. Genie API eken transaction eka check karala order eka update karanawa.
- `api/pay/webhook.js` – Genie eken status update ewanawa. Meketh Genie API eken aye check karanawa, ewana data eka witharak trust karanne na.
- Paid wenne Genie eke state eka `CONFIRMED`/`AUTHORIZED` saha amount + currency + order id match unoth witharai.
- Tests: `npm install && npm test`.
