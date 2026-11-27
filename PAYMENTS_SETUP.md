# Online payments (Dialog Genie Business)

Customers **Pay Rs. 990** (Aradhanawa Plus) or **Pay Rs. 4,900** (custom design) karama Genie payment page ekata yanawa. Pay karala awama order eka automatically **Paid** wenawa.

- Plus: order eka `Done` wenawa, e function ekata guest limit eka ain wenawa.
- Custom design: order eka `In progress` wenawa (paid). Design eka ready unama Admin → Orders eken `Done` karanna; ethakota design eka unlock wenawa.
- Prices ganne **Admin → Prices** walin (server eken). Browser eken price eka wenas karanna ba.
  - **Add plan**: nama, price (`Rs. 12,000` wage), type eka (Plus / Custom design / Other service), details (line ekakata point ekak).
  - **Edit** / **Delete** / ↑ (order eka) / **On site** switch eken hide karanna puluwan. Hide karapu ho delete karapu plan ekak kawuruwath ganna ba.
  - Plus type eka pay karapu gaman guest limit eka ain wenawa. Custom design saha Other service `In progress` wela, oya Orders eken `Done` karanna one.
  - Hama type ekema site eke pennanne udinma thiyena plan eka **Main** eka (editor eke Plus upgrade eka saha design yata Buy button eka eka use karanawa).

## Bank transfer (slip upload)

Customer ta **Card payment** (Genie) ho **Bank transfer** thoranna puluwan.

1. **Admin → Settings → Bank transfer** eke bank eka, branch eka, account name saha account number danna → **Save bank details**. Account number eka his karoth bank transfer off wenawa (card witharai).
2. Customer bank transfer thoruwama account details pennanawa. Salli dala slip eke photo / screenshot / PDF eka upload karanawa. Order eka **Awaiting verification** wenawa.
3. Admin → Orders (saha Overview) eke udinma **"bank slip to check"** box eka enawa. **Check slip** → slip eka balala bank account eke salli awada kiyala check karanna:
   - **Approve and unlock** → order eka Paid wenawa, card payment ekak wage card eka unlock wenawa (Plus / template nam `Done`, custom design nam `In progress`).
   - **Reject** → hethuwa liyanna. Customer ta My orders eke eka pennanawa, **Upload new slip** eken aluth slip ekak ewanna puluwan.
- Slips Cloudflare R2 eke `slips/{uid}/` yata save wenawa (gallery photos wage, R2_* env vars ma use karanawa). Site eke public link ekak denne na; admin ta saha order eke owner ta witharak `api/pay/slip` eken penawa.
- Firestore rules wenas karanna one na (orders server eken liyanne, bank details `settings/site` eke).
- Droplet eke: `deploy/install.sh` aye run karanna (slip upload ekata Nginx limit eka 5 MB karanawa).

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
- `api/pay/bank.js` – bank transfer order eka hadala slip eka R2 ekata upload karanawa (nathnam rejected order ekakata aluth slip ekak).
- `api/pay/verify.js` – admin approve / reject. Approve unoth Genie payment ekak wage `plus/{uid_type}` hadanawa.
- `api/pay/slip.js` – slip file eka admin ta / owner ta pennanawa.
- Tests: `npm install && npm test`.
