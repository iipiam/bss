#!/usr/bin/env bash
# BSS one-shot deploy script for the Azure VPS.
# Usage:  ./deploy.sh           (normal deploy)
#         ./deploy.sh --no-build (skip npm run build, e.g. config-only change)
#
# Safe to re-run. Aborts on first error.

set -euo pipefail

SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --no-build) SKIP_BUILD=1 ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

log() { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }
fail() { printf "\n\033[1;31mxx %s\033[0m\n" "$*"; exit 1; }

# Ensure we run from the repo root (folder containing this script).
cd "$(dirname "$(readlink -f "$0")")"

command -v git  >/dev/null || fail "git not installed"
command -v npm  >/dev/null || fail "npm not installed"
command -v pm2  >/dev/null || fail "pm2 not installed (npm i -g pm2)"

log "Checking working tree is clean"
if [[ -n "$(git status --porcelain)" ]]; then
  fail "Uncommitted local changes on the server. Commit, stash, or discard them before deploying."
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
log "Pulling latest on branch: $BRANCH"
git pull --ff-only origin "$BRANCH"

if [[ -f package-lock.json ]]; then
  log "Installing dependencies (npm ci)"
  npm ci
else
  log "Installing dependencies (npm install) — no package-lock.json found"
  npm install
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  log "Building (npm run build)"
  npm run build
else
  log "Skipping build (--no-build)"
fi

log "Restarting pm2 processes"
pm2 restart all --update-env
pm2 save

log "Deploy complete. Recent logs:"
pm2 logs --lines 40 --nostream || true
