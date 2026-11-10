#!/usr/bin/env bash
# Aradhanawa: install or update the site on an Ubuntu server (DigitalOcean droplet).
#
# Run as root. First install and every update use the same command:
#   curl -fsSL https://raw.githubusercontent.com/dilnethmadushanka/aradhanawa/main/deploy/install.sh | bash
#
# Optional settings (put them before "bash", e.g. "... | DOMAIN=aradhanawa.lk bash"):
#   BRANCH=main            git branch to deploy
#   DOMAIN=aradhanawa.lk  your domain; also sets up HTTPS (Let's Encrypt) once the domain points at this server
#   PORT=3000              local port for the Node server (Nginx talks to it)
#   GENIE_API_KEY=...      Genie Business secret key (or type it when asked; kept in /opt/aradhanawa/.env)
#   FIREBASE_SA_FILE=...   path to the Firebase service account JSON (default /root/firebase-service-account.json)
#   EMAIL=you@example.com  Let's Encrypt sends HTTPS certificate expiry warnings here (asked once, kept in .env)
#   FIREWALL=no            skip the ufw firewall (by default only SSH, 80 and 443 are open)
#
# Safe to run again: it pulls the latest code, keeps the existing .env values, and restarts the service.

set -Eeuo pipefail

# Everything runs inside main(), so bash reads the whole script before running any of it (important for curl | bash).
main() {

REPO_URL="${REPO_URL:-https://github.com/dilnethmadushanka/aradhanawa.git}"
BRANCH="${BRANCH:-main}"
APP_NAME="aradhanawa"
APP_USER="aradhanawa"
APP_HOME="/opt/aradhanawa"
SRC="$APP_HOME/app"
ENV_FILE="$APP_HOME/.env"
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"
NGINX_SITE="/etc/nginx/sites-available/$APP_NAME"
FIREBASE_SA_FILE="${FIREBASE_SA_FILE:-/root/firebase-service-account.json}"

say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!!  %s\033[0m\n' "$*" >&2; }
die()  { printf '\033[1;31mXX  %s\033[0m\n' "$*" >&2; exit 1; }
trap 'printf "\033[1;31mXX  Something failed near line %s (see the message above). Fix it and run the same command again.\033[0m\n" "$LINENO" >&2' ERR

[ "$(id -u)" -eq 0 ] || die "Please run as root (ssh root@your-server, then run the command again)."
for c in git node npm nginx systemctl curl base64; do
  command -v "$c" >/dev/null 2>&1 || die "'$c' is not installed. Install it first (apt install $c)."
done
NODE_BIN="$(command -v node)"
NODE_MAJOR="$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Node.js 20 or newer is needed (found $("$NODE_BIN" -v))."

# Reads KEY=value from the existing .env. Prints nothing (and does not fail) when the key or the file is missing.
env_get() {
  [ -f "$ENV_FILE" ] || return 0
  { grep -m1 -E "^$1=" "$ENV_FILE" || true; } | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'
}
# True when we can ask the person a question (works with curl | bash because we read from the terminal, not stdin).
can_ask() { { : </dev/tty; } 2>/dev/null; }

public_ip() {
  local ip=""
  ip="$(curl -fsS --max-time 2 http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || true)"
  [ -n "$ip" ] || ip="$(curl -fsS4 --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  [ -n "$ip" ] || ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  printf '%s' "$ip"
}

# ---------------------------------------------------------------- 1. app user
say "1/7  App user '$APP_USER'"
if id "$APP_USER" >/dev/null 2>&1; then
  echo "Already exists."
else
  useradd --system --home-dir "$APP_HOME" --create-home --shell /usr/sbin/nologin "$APP_USER"
  echo "Created."
fi
mkdir -p "$APP_HOME"
chown "$APP_USER:$APP_USER" "$APP_HOME"
chmod 755 "$APP_HOME"
as_app() { runuser -u "$APP_USER" -- env HOME="$APP_HOME" "$@"; }

# ---------------------------------------------------------------- 2. code
say "2/7  Code from $REPO_URL (branch $BRANCH)"
if [ -d "$SRC/.git" ]; then
  chown -R "$APP_USER:$APP_USER" "$SRC"
  as_app git -C "$SRC" remote set-url origin "$REPO_URL"
  as_app git -C "$SRC" fetch --depth 1 --prune origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" \
    || die "Could not download branch '$BRANCH'. Check the name (or the internet connection) and run again."
  as_app git -C "$SRC" checkout -q -f -B "$BRANCH" "origin/$BRANCH"
  as_app git -C "$SRC" reset -q --hard "origin/$BRANCH"
  as_app git -C "$SRC" clean -q -fd
else
  rm -rf "$SRC.tmp"
  as_app git clone -q --depth 1 --branch "$BRANCH" "$REPO_URL" "$SRC.tmp" \
    || die "Could not download branch '$BRANCH' from $REPO_URL."
  rm -rf "$SRC"
  mv "$SRC.tmp" "$SRC"
fi
echo "Now at: $(as_app git -C "$SRC" log -1 --format='%h %s')"
[ -f "$SRC/deploy/server.js" ] || die "This branch has no deploy/server.js. Use a branch that includes the deploy files."

# ---------------------------------------------------------------- 3. .env
say "3/7  Settings file $ENV_FILE"
SERVER_IP="$(public_ip)"
DOMAIN="${DOMAIN:-$(env_get DOMAIN)}"
DOMAIN="$(printf '%s' "$DOMAIN" | tr '[:upper:]' '[:lower:]' | sed -e 's#^https\?://##' -e 's#/.*$##' -e 's/^www\.//')"
PORT="${PORT:-$(env_get PORT)}"; PORT="${PORT:-3000}"
GENIE_MODE="${GENIE_MODE:-$(env_get GENIE_MODE)}"
GENIE_API_BASE="${GENIE_API_BASE:-$(env_get GENIE_API_BASE)}"

points_here() { [ -n "$SERVER_IP" ] && { getent ahostsv4 "$1" 2>/dev/null || true; } | awk '{print $1}' | grep -x "$SERVER_IP" >/dev/null; }
DOMAIN_OK=""; WWW_OK=""
if [ -n "$DOMAIN" ]; then
  if points_here "$DOMAIN"; then DOMAIN_OK=1; fi
  if points_here "www.$DOMAIN"; then WWW_OK=1; fi
fi
# SITE_URL is where Genie sends customers back after paying. A value you set yourself is kept;
# the automatic value follows the domain once it points here, otherwise the server IP.
OLD_SITE_URL="$(env_get SITE_URL)"
is_auto_site_url() {   # values this script would have written by itself
  case "${1%/}" in
    http://[0-9]*.[0-9]*.[0-9]*.[0-9]*) [ -z "$(printf '%s' "${1#http://}" | tr -d '0-9./')" ] ;;
    "https://$DOMAIN"|"https://www.$DOMAIN") [ -n "$DOMAIN" ] ;;
    *) return 1 ;;
  esac
}
if [ -n "${SITE_URL:-}" ]; then :
elif [ -n "$OLD_SITE_URL" ] && ! is_auto_site_url "$OLD_SITE_URL"; then SITE_URL="$OLD_SITE_URL"
elif [ -n "$WWW_OK" ]; then SITE_URL="https://www.$DOMAIN"
elif [ -n "$DOMAIN_OK" ]; then SITE_URL="https://$DOMAIN"
else SITE_URL="http://$SERVER_IP"
fi

EMAIL="${EMAIL:-$(env_get EMAIL)}"
if [ -z "$EMAIL" ] && [ -n "$DOMAIN" ] && can_ask; then
  echo "Email for HTTPS certificate warnings (Let's Encrypt writes only if renewal fails). Press Enter to skip."
  read -r -p "EMAIL: " EMAIL </dev/tty || EMAIL=""
fi
EMAIL="$(printf '%s' "$EMAIL" | tr -d '[:space:]')"
case "$EMAIL" in ""|*@*.*) ;; *) warn "'$EMAIL' does not look like an email address. Skipping it."; EMAIL="" ;; esac

GENIE_API_KEY="${GENIE_API_KEY:-$(env_get GENIE_API_KEY)}"
if [ -z "$GENIE_API_KEY" ] && can_ask; then
  echo "Genie Business API key (secret) for online payments."
  echo "Paste it and press Enter (nothing shows while you paste). Press Enter alone to skip for now."
  read -r -s -p "GENIE_API_KEY: " GENIE_API_KEY </dev/tty || GENIE_API_KEY=""
  echo
fi
GENIE_API_KEY="$(printf '%s' "$GENIE_API_KEY" | tr -d '[:space:]')"

FIREBASE_SERVICE_ACCOUNT="${FIREBASE_SERVICE_ACCOUNT:-}"
if [ -z "$FIREBASE_SERVICE_ACCOUNT" ] && [ -f "$FIREBASE_SA_FILE" ]; then
  if "$NODE_BIN" -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(!j.private_key||!j.client_email) process.exit(1)' "$FIREBASE_SA_FILE" 2>/dev/null; then
    FIREBASE_SERVICE_ACCOUNT="$(base64 -w0 "$FIREBASE_SA_FILE")"
    chmod 600 "$FIREBASE_SA_FILE"
    echo "Using the Firebase service account from $FIREBASE_SA_FILE."
  else
    warn "$FIREBASE_SA_FILE is not a valid Firebase service account JSON file. Skipping it."
  fi
fi
[ -n "$FIREBASE_SERVICE_ACCOUNT" ] || FIREBASE_SERVICE_ACCOUNT="$(env_get FIREBASE_SERVICE_ACCOUNT)"
# One line only (systemd reads one value per line). JSON pasted as text gets stored as base64; the app reads both.
case "$FIREBASE_SERVICE_ACCOUNT" in
  *'{'*) FIREBASE_SERVICE_ACCOUNT="$(printf '%s' "$FIREBASE_SERVICE_ACCOUNT" | base64 -w0)" ;;
esac

TMP_ENV="$(mktemp "$APP_HOME/.env.XXXXXX")"
{
  echo "# Aradhanawa settings. Written by deploy/install.sh; your values are kept when it runs again."
  echo "NODE_ENV=production"
  echo "PORT=$PORT"
  echo "SITE_URL=$SITE_URL"
  echo "DOMAIN=$DOMAIN"
  echo "EMAIL=$EMAIL"
  echo "GENIE_API_KEY=$GENIE_API_KEY"
  echo "GENIE_MODE=$GENIE_MODE"
  echo "GENIE_API_BASE=$GENIE_API_BASE"
  echo "FIREBASE_SERVICE_ACCOUNT=$FIREBASE_SERVICE_ACCOUNT"
  # Keep any extra lines someone added by hand.
  if [ -f "$ENV_FILE" ]; then
    { grep -v -E '^(#|NODE_ENV=|PORT=|SITE_URL=|DOMAIN=|EMAIL=|GENIE_API_KEY=|GENIE_MODE=|GENIE_API_BASE=|FIREBASE_SERVICE_ACCOUNT=)' "$ENV_FILE" || true; } | { grep -E '^[A-Za-z_][A-Za-z0-9_]*=' || true; }
  fi
} > "$TMP_ENV"
chown root:root "$TMP_ENV"
chmod 600 "$TMP_ENV"
mv -f "$TMP_ENV" "$ENV_FILE"
PAY_READY="yes"
[ -n "$GENIE_API_KEY" ] || { PAY_READY="no"; warn "GENIE_API_KEY is empty: the site works, but online payments are off."; }
[ -n "$FIREBASE_SERVICE_ACCOUNT" ] || { PAY_READY="no"; warn "FIREBASE_SERVICE_ACCOUNT is empty: the site works, but online payments are off."; }
echo "Saved (only root can read it)."

# ---------------------------------------------------------------- 4. build
say "4/7  Installing packages (npm ci)"
as_app bash -c "cd '$SRC' && npm ci --omit=dev --no-audit --no-fund --loglevel=error"
as_app "$NODE_BIN" --check "$SRC/deploy/server.js"

# ---------------------------------------------------------------- 5. systemd
say "5/7  Service '$APP_NAME' (starts by itself after a reboot)"
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Aradhanawa website
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$SRC
EnvironmentFile=$ENV_FILE
Environment=HOST=127.0.0.1
Environment=NODE_OPTIONS=--max-old-space-size=384
ExecStart=$NODE_BIN $SRC/deploy/server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=$APP_HOME

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable -q "$APP_NAME"
systemctl restart "$APP_NAME"

ok=""
for _ in $(seq 1 20); do
  if curl -fsS --max-time 2 "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1; then ok=1; break; fi
  sleep 1
done
if [ -z "$ok" ]; then
  journalctl -u "$APP_NAME" -n 40 --no-pager || true
  die "The site did not start. The log is above."
fi
echo "Running on 127.0.0.1:$PORT."

# ---------------------------------------------------------------- 6. nginx
say "6/7  Nginx"
SERVER_NAMES="_"
LISTEN_V6=""
[ -e /proc/net/if_inet6 ] && LISTEN_V6="listen [::]:80 default_server;"
[ -n "$DOMAIN" ] && SERVER_NAMES="$DOMAIN www.$DOMAIN"
cat > "$NGINX_SITE" <<EOF
# Aradhanawa (written by deploy/install.sh; it is rewritten on every run)
server {
    listen 80 default_server;
    $LISTEN_V6
    server_name $SERVER_NAMES;

    client_max_body_size 2m;
    server_tokens off;

    gzip on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/css text/plain text/javascript application/javascript application/json application/xml image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
EOF
ln -sfn "$NGINX_SITE" "/etc/nginx/sites-enabled/$APP_NAME"
rm -f /etc/nginx/sites-enabled/default
nginx -t -q || die "Nginx settings check failed (see above)."
systemctl enable -q nginx
if systemctl is-active -q nginx; then systemctl reload nginx; else systemctl start nginx; fi

# ---------------------------------------------------------------- 7. HTTPS (only with DOMAIN)
say "7/7  HTTPS"
SCHEME="http"; HOSTNAME_SHOWN="$SERVER_IP"
if [ -z "$DOMAIN" ]; then
  echo "Skipped (no DOMAIN given). Add one later with: ... | DOMAIN=aradhanawa.lk bash"
elif [ -z "$DOMAIN_OK" ]; then
  warn "$DOMAIN does not point to $SERVER_IP yet. Change the DNS A record, wait a little, then run this again."
else
  CERT_DOMAINS=(-d "$DOMAIN")
  if [ -n "$WWW_OK" ]; then CERT_DOMAINS+=(-d "www.$DOMAIN"); else warn "www.$DOMAIN does not point here yet; HTTPS only for $DOMAIN."; fi
  if ! command -v certbot >/dev/null 2>&1; then
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
  fi
  if [ -n "$EMAIL" ]; then
    CERT_CONTACT=(--email "$EMAIL" --no-eff-email)
    # An account made earlier without an email gets this one added (harmless if it is already set).
    if [ -d /etc/letsencrypt/accounts ]; then certbot update_account --non-interactive --email "$EMAIL" --no-eff-email >/dev/null 2>&1 || true; fi
  else
    CERT_CONTACT=(--register-unsafely-without-email)
    warn "No EMAIL given: you will not be warned if the HTTPS certificate fails to renew. Run again with EMAIL=you@example.com."
  fi
  if certbot --nginx --non-interactive --agree-tos "${CERT_CONTACT[@]}" \
       --keep-until-expiring --redirect "${CERT_DOMAINS[@]}"; then
    SCHEME="https"; HOSTNAME_SHOWN="$DOMAIN"
  else
    warn "HTTPS setup failed. The site still works on http. Run this again later."
  fi
fi

# ---------------------------------------------------------------- firewall
# Only SSH, HTTP and HTTPS from outside. The Node server listens on 127.0.0.1 only, so it is never exposed.
FW_STATE="off"
if [ "${FIREWALL:-yes}" != "no" ]; then
  if ! command -v ufw >/dev/null 2>&1; then
    apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ufw >/dev/null || warn "Could not install ufw."
  fi
  if command -v ufw >/dev/null 2>&1; then
    # Allow every port sshd listens on (not just 22) before turning the firewall on, so this session is never cut off.
    SSH_PORTS="$( { ss -Htlnp 2>/dev/null | awk '/sshd/ {n=split($4,a,":"); print a[n]}'; } | sort -u)"
    [ -n "$SSH_PORTS" ] || SSH_PORTS="22"
    for p in $SSH_PORTS; do ufw allow "$p/tcp" >/dev/null; done
    ufw allow 80/tcp >/dev/null
    ufw allow 443/tcp >/dev/null
    ufw --force enable >/dev/null && FW_STATE="on (SSH $(echo $SSH_PORTS | tr ' ' ','), 80, 443)"
  fi
fi

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 -H "Host: ${DOMAIN:-localhost}" http://127.0.0.1/ || true)"
trap - ERR
echo
echo "================================================================"
if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "308" ]; then
  echo "  Done! Your site is live at:  $SCHEME://$HOSTNAME_SHOWN"
else
  echo "  Installed, but Nginx answered $code. Check: journalctl -u $APP_NAME -n 50"
fi
echo "  Payments ready: $PAY_READY      SITE_URL: $SITE_URL"
echo "  Firewall:       $FW_STATE"
echo "  Update later:   run the same command again"
echo "  Logs:           journalctl -u $APP_NAME -f"
echo "  Settings file:  $ENV_FILE"
echo "================================================================"
}

main "$@" </dev/null
