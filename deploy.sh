#!/usr/bin/env bash
# BSS one-shot deploy script for the Azure VM.
#
# Usage:
#   ./deploy.sh                # full deploy: pull -> install -> migrate -> build -> restart
#   ./deploy.sh --no-build     # skip "npm run build" (config-only change)
#   ./deploy.sh --no-migrate   # skip "npm run db:push" (schema unchanged)
#
# Safe to re-run. Aborts on the first failed step (set -euo pipefail).
# See DEPLOYMENT.md for the full operator-facing deployment guide.

set -euo pipefail

SKIP_BUILD=0
SKIP_MIGRATE=0
for arg in "$@"; do
  case "$arg" in
    --no-build)   SKIP_BUILD=1 ;;
    --no-migrate) SKIP_MIGRATE=1 ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

log()  { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
fail() { printf "\n\033[1;31mxx %s\033[0m\n" "$*"; exit 1; }

# Always run from the repo root (folder containing this script).
cd "$(dirname "$(readlink -f "$0")")"

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
command -v git  >/dev/null || fail "git not installed"
command -v npm  >/dev/null || fail "npm not installed"
command -v pm2  >/dev/null || fail "pm2 not installed (npm i -g pm2)"

# ---------------------------------------------------------------------------
# Load environment from the canonical .env file (see DEPLOYMENT.md).
# We export every KEY=VALUE so child processes (npm, drizzle, pm2) inherit them.
# ---------------------------------------------------------------------------
if [[ -f .env ]]; then
  log "Loading environment from .env"
  set -a
  # shellcheck disable=SC1091
  source ./.env
  set +a
else
  log "No .env file found in repo root"
  echo "    Expected at: $(pwd)/.env (see DEPLOYMENT.md)."
  echo "    Continuing — pm2 may already have env vars baked in."
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  fail "DATABASE_URL is not set. Add it to .env (see DEPLOYMENT.md) before deploying."
fi

PORT="${PORT:-5000}"
log "App will listen on PORT=$PORT (must match nginx upstream)"

# ---------------------------------------------------------------------------
# Source code update
# ---------------------------------------------------------------------------
log "Checking working tree is clean"
if [[ -n "$(git status --porcelain)" ]]; then
  fail "Uncommitted local changes on the server. Commit, stash, or discard them before deploying."
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
PREV_COMMIT="$(git rev-parse HEAD)"
log "Pulling latest on branch: $BRANCH (current commit $PREV_COMMIT)"
git pull --ff-only origin "$BRANCH"
NEW_COMMIT="$(git rev-parse HEAD)"
ok "Now at commit $NEW_COMMIT"

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
if [[ -f package-lock.json ]]; then
  log "Installing dependencies (npm ci)"
  npm ci
else
  log "Installing dependencies (npm install) — no package-lock.json found"
  npm install
fi

# ---------------------------------------------------------------------------
# Database migrations
# ---------------------------------------------------------------------------
if [[ "$SKIP_MIGRATE" -eq 0 ]]; then
  log "Pushing schema to database (npm run db:push)"
  # `drizzle-kit push` is the authoritative way to keep RDS in sync with
  # shared/schema.ts. We pipe an empty stdin so it cannot block waiting on
  # an interactive prompt; if it exits non-zero (e.g. because it detected a
  # destructive change it would not auto-apply), we abort the deploy. Running
  # the app against an outdated schema is exactly what causes the 502s this
  # script is meant to prevent.
  npm run db:push < /dev/null \
    || fail "db:push failed. The schema is out of sync with shared/schema.ts.
    Run 'npm run db:push' from a workstation with prompts enabled, resolve any
    destructive-change warnings, then re-run ./deploy.sh on the VM.
    To temporarily skip (NOT recommended — schema drift will cause runtime
    errors): ./deploy.sh --no-migrate"
else
  log "Skipping db:push (--no-migrate) — only safe when the schema is unchanged"
fi

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
if [[ "$SKIP_BUILD" -eq 0 ]]; then
  log "Building (npm run build)"
  npm run build
else
  log "Skipping build (--no-build)"
fi

# ---------------------------------------------------------------------------
# Process restart — exactly ONE pm2 process named "BSS".
# ---------------------------------------------------------------------------
log "Reconciling pm2 process list (one BSS process only)"
# Delete any stale entries that aren't named BSS so we don't run duplicates.
pm2 jlist 2>/dev/null \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{JSON.parse(s).forEach(p=>{if(p.name!=='BSS')console.log(p.name)})}catch(e){}})" \
  | while read -r name; do
      [[ -n "$name" ]] && { echo "  deleting stale pm2 entry: $name"; pm2 delete "$name" || true; }
    done

if pm2 describe BSS >/dev/null 2>&1; then
  log "Restarting BSS (pm2 restart --update-env)"
  pm2 restart BSS --update-env
else
  log "Starting BSS for the first time"
  PORT="$PORT" pm2 start npm --name BSS --update-env -- run start
fi

pm2 save

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
log "Waiting 4s for the app to bind to port $PORT..."
sleep 4

log "pm2 status"
pm2 status

log "Health check: curl -fsS -o /dev/null -w '%{http_code}\\n' http://127.0.0.1:$PORT/"
if HTTP_CODE=$(curl -fsS -o /dev/null -w '%{http_code}\n' --max-time 10 "http://127.0.0.1:$PORT/"); then
  ok "App responded with HTTP $HTTP_CODE on port $PORT"
else
  echo
  log "Last 40 BSS log lines (for troubleshooting):"
  pm2 logs BSS --lines 40 --nostream || true
  fail "Health check failed. nginx will still show 502 until this is fixed. Roll back with:
    git reset --hard $PREV_COMMIT && ./deploy.sh"
fi

log "Recent logs:"
pm2 logs BSS --lines 20 --nostream || true

ok "Deploy complete — commit $NEW_COMMIT is live on port $PORT."
