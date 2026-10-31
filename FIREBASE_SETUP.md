# Firebase setup (Google login + admin dashboard database)

Site eka Firebase ekata connect karanna steps 6i. Config eka danna kalin site eka **demo mode** eke wada (data browser eke witharai).

## 1. Project eka hadanna
1. https://console.firebase.google.com → **Add project** → name eka `aradhanawa` (Google Analytics one naha).
2. Project eka athule **Web app** (`</>`) ekak add karanna → nickname `aradhanawa-web` → Hosting tick karanna epa.
3. Pennana `firebaseConfig` object eka copy karaganna.

## 2. Config eka site ekata danna
`firebase-config.js` open karala:
```js
window.ARADHANA_FIREBASE = {
  config: { apiKey: "...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", appId: "..." },
  adminEmails: ["oyage.gmail@gmail.com"]
};
```
Me keys public wenna puluwan (Firebase web config). Data arakshawa karanne rules walin (step 5).

## 3. Login methods on karanna
**Build → Authentication → Get started → Sign-in method**:
- **Google** → Enable → support email eka select karala Save.
- **Email/Password** → Enable → Save.

**Authentication → Settings → Authorized domains** ekata add karanna:
- `aradhanawa.com` (saha `www.aradhanawa.com`)
- Vercel domain eka (e.g. `aradhanawa.vercel.app`)

### Phone eke Google login ekata (one)
Google login eka aradhanawa.com eke athule wenna (`/__/auth/*` Vercel eken proxy wenawa), Google Cloud eke redirect URI add karanna one:
**console.cloud.google.com** → project `aradhanawa-e52be` → **APIs & Services → Credentials** → **Web client (auto created by Google Service)** →
- *Authorized JavaScript origins*: `https://aradhanawa.com`, `https://www.aradhanawa.com`
- *Authorized redirect URIs*: `https://aradhanawa.com/__/auth/handler`, `https://www.aradhanawa.com/__/auth/handler`

Save karanna (apply wenna minute 5k witra yanna puluwan).

## 4. Database eka hadanna
**Build → Firestore Database → Create database** → location `asia-south1` (Mumbai, Lanka ekata langa) → **Production mode**.

## 5. Rules danna
`firestore.rules` file eke `ADMIN_EMAILS()` list ekata oyage Gmail eka danna (step 2 eke dapu ekama), then full file eka copy karala
**Firestore Database → Rules** ekata paste karala **Publish**.

## 6. Test karanna
1. Site eke **Log in → Continue with Google** → oyage Gmail eken log wenna.
2. Nav eke **Admin** button eka enawa → `#admin` dashboard.
3. Thawa admin kenek add karanna: **Admin → Settings → Admins** → email eka danna. Eyala Google walin log wenna one (email verify wela thiyena account).

## Database eke thiyena dewal
| Collection | Mokakda | Kauda balanna puluwan |
|---|---|---|
| `users/{uid}` | Account details, plan (Free/Plus) | User ta thamange eka, admin ta okkoma |
| `admins/{email}` | Dashboard ekata yanna puluwan aya | Admin |
| `orders` | Custom design / Plus requests | User ta thamange, admin ta okkoma |
| `invitations/{uid_type}` | Log wela edit karana invitation (photos nathuwa) | Owner + admin |
| `rsvps` | Guest la "Send reply" obapu replies | Owner + admin |
| `settings/site` | Prices, WhatsApp number, hide karapu templates | Hamotama read, admin witharak write |

## Danata nathi dewal
- User kenek dashboard eken delete kalama Firestore profile eka witharai yanne. Login eka ain karanna **Authentication → Users** eken delete karanna.
- RSVP replies save wenne guest link eka **log wela hadapu** invitation walin witharai (link eke owner id eka thiyena nisa).
- Free plan eke 5-guest limit eka thama browser eke check karanne. Server-side karanna Cloud Functions one (Blaze plan).
