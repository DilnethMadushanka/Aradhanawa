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
curl -fsSL https://raw.githubusercontent.com/dilnethmadushanka/aradhanawa/main/deploy/install.sh | DOMAIN=aradhanawa.com bash
```

Let's Encrypt HTTPS certificate eka danawa, `SITE_URL` eka `https://www.aradhanawa.com` karanawa. Firebase console → Authentication → Settings → **Authorized domains** eke domain eka thiyenna one (Google login ekata).

### HTTPS warning email

Certificate eka renew wenna bari unoth Let's Encrypt email ekak ewanawa. Eka parak:

```bash
curl -fsSL https://raw.githubusercontent.com/dilnethmadushanka/aradhanawa/main/deploy/install.sh | EMAIL=you@example.com bash
```

## Server eka karana dewal

- `aradhanawa.com` → `https://www.aradhanawa.com` ta 301 redirect (`SITE_URL` eka www nam). Google ekata eka site ekai penenne.
- Security headers (HSTS, X-Frame-Options, Referrer-Policy, ...) Node server eken.
- `/api/` ekata IP ekakata minute ekakata requests 30 (`API_RATE_LIMIT` eken wenas karanna puluwan).
- Firewall (`ufw`): SSH, 80, 443 witharai open. Epa nam `FIREWALL=no`.
- Backups: DigitalOcean → droplet → **Backups** eka on karanna (sathiyakata parak, droplet price eken ~20%). Firestore data Google eke thiyena nisa e backup ekata one na.

## Useful commands

- Logs: `journalctl -u aradhanawa -f`
- Restart: `systemctl restart aradhanawa`
- Settings wenas kala passe: `nano /opt/aradhanawa/.env` → `systemctl restart aradhanawa`
- Local run: `npm ci && npm start` → http://127.0.0.1:3000
