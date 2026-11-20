# DigitalOcean droplet (Ubuntu) eke site eka run karanna

Vercel nathuwa, apema server ekaka (droplet) site eka saha payment functions (`api/pay/*`) run karanna.

- `deploy/server.js`: Node server eka. Static site eka (vercel.json eke `cleanUrls`, `/i/<code>`, `/admin` rewrites, `img/` cache header ekka) saha `api/` functions denawa. Aluth npm package ona na.
- `deploy/install.sh`: eka command eken okkoma setup karana script eka (app user, git clone, `.env`, `npm ci`, systemd service, Nginx). Aye run kalama update wenawa.

## Install / update (root widiyata)

```bash
curl -fsSL https://raw.githubusercontent.com/dilnethmadushanka/aradhanawa/main/deploy/install.sh | bash
```

Iwara unama `Done! Your site is live at: http://<IP>` kiyala pennanawa. Update ekak ona welawata aye e command ekama run karanna.

## Secrets (chat ekata, GitHub ekata danna epa)

Settings thiyenne `/opt/aradhanawa/.env` eke (root ta witharai kiyawanna puluwan). Aye run kalath parana values thiyagannawa.

- `GENIE_API_KEY`: script eka ahanawa. Paste karala Enter (type karana eka pennanne na). Skip karanna Enter witharak.
- `FIREBASE_SERVICE_ACCOUNT`: Firebase JSON file eka server ekata copy karanna, passe script eka run karanna. Windows PowerShell eken:
  ```powershell
  scp "$HOME\Downloads\your-firebase-key.json" root@168.144.100.241:/root/firebase-service-account.json
  ```
  Script eka eka `.env` ekata dala file eka root ta witharak read karanna puluwan widiyata hadanawa.

Payments nathuwath site eka wada. Keys dannakan payment button eka error ekak denawa witharai.

## Domain + HTTPS

Domain eke DNS A record eka (`@` saha `www`) droplet IP ekata maru karala, tikak inna, passe:

```bash
curl -fsSL https://raw.githubusercontent.com/dilnethmadushanka/aradhanawa/main/deploy/install.sh | DOMAIN=aradhanawa.lk bash
```

Let's Encrypt HTTPS certificate eka danawa, `SITE_URL` eka `https://www.aradhanawa.lk` karanawa. Firebase console → Authentication → Settings → **Authorized domains** eke domain eka thiyenna one (Google login ekata).

### HTTPS warning email

Certificate eka renew wenna bari unoth Let's Encrypt email ekak ewanawa. Eka parak:

```bash
curl -fsSL https://raw.githubusercontent.com/dilnethmadushanka/aradhanawa/main/deploy/install.sh | EMAIL=you@example.com bash
```

## Server eka karana dewal

- `aradhanawa.lk` → `https://www.aradhanawa.lk` ta 301 redirect (`SITE_URL` eka www nam). Google ekata eka site ekai penenne.
- Security headers (HSTS, X-Frame-Options, Referrer-Policy, ...) Node server eken.
- `/api/` ekata IP ekakata minute ekakata requests 30 (`API_RATE_LIMIT` eken wenas karanna puluwan).
- Firewall (`ufw`): SSH, 80, 443 witharai open. Epa nam `FIREWALL=no`.
- Backups: DigitalOcean → droplet → **Backups** eka on karanna (sathiyakata parak, droplet price eken ~20%). Firestore data Google eke thiyena nisa e backup ekata one na.

## Gallery photos: Cloudflare R2

R2 set karala nathnam photos parana widiyatama Firestore eke (data URL) save wenawa. R2 dammama aluth photos R2 bucket ekata upload wela, Firestore eke thiyenne link eka witharai (photo ekakata 1 MB limit eka nathi wenawa, page eka ikman wenawa).

1. Cloudflare → **R2 Object Storage** → **Create bucket**. Name: `aradhanawa-photos`, Location: Automatic, Storage class: Standard → Create.
2. Bucket eka → **Settings** → **Public access**:
   - `aradhanawa.lk` Cloudflare DNS eke nam: **Custom Domains** → **Connect Domain** → `media.aradhanawa.lk` (honda option eka).
   - Nathnam: **R2.dev subdomain** → **Allow** (testing walata hari, Cloudflare kiyanne production ekata custom domain ekak danna kiyala).
   - Penna address eka (`https://media.aradhanawa.lk` hari `https://pub-....r2.dev`) copy karaganna.
3. R2 overview page eka → **Manage API tokens** (Account details yata) → **Create Account API token**: Permissions **Object Read & Write**, Specify bucket → `aradhanawa-photos` → Create. **Access Key ID** saha **Secret Access Key** copy karaganna (secret eka ekaparai pennanne).
4. Server eke `nano /opt/aradhanawa/.env` → yatatama me lines dala (oyage values ekka) → `systemctl restart aradhanawa`:
   ```
   R2_ACCOUNT_ID=<R2 overview eke Account ID>
   R2_ACCESS_KEY_ID=<Access Key ID>
   R2_SECRET_ACCESS_KEY=<Secret Access Key>
   R2_BUCKET=aradhanawa-photos
   R2_PUBLIC_URL=https://media.aradhanawa.lk
   ```
   `install.sh` aye run kalath me lines thiyagannawa.

Check karanna: site ekata log wela gallery photo ekak danna. Bucket eke `gallery/<uid>/<type>/` folder eke photo eka penna one. Error nam `journalctl -u aradhanawa -f` eke `[photos]` kiyala balanna.

## Useful commands

- Logs: `journalctl -u aradhanawa -f`
- Restart: `systemctl restart aradhanawa`
- Settings wenas kala passe: `nano /opt/aradhanawa/.env` → `systemctl restart aradhanawa`
- Local run: `npm ci && npm start` → http://127.0.0.1:3000
