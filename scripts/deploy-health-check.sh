#!/usr/bin/env bash

# This file is sourced by deploy.sh. The caller supplies log, ok, fail, PORT,
# and PREV_COMMIT. Time settings may be shortened by the isolated test harness.
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-60}"
HEALTH_RETRY_SECONDS="${HEALTH_RETRY_SECONDS:-2}"
HEALTH_URL="http://127.0.0.1:$PORT/"
HEALTH_DEADLINE=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
HEALTH_ATTEMPT=0
HTTP_CODE=""
PM2_STATE="unknown"

log "Waiting up to ${HEALTH_TIMEOUT_SECONDS}s for the app to respond at $HEALTH_URL"
while (( SECONDS < HEALTH_DEADLINE )); do
  HEALTH_ATTEMPT=$((HEALTH_ATTEMPT + 1))

  if HTTP_CODE=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time "$HEALTH_RETRY_SECONDS" "$HEALTH_URL" 2>/dev/null); then
    ok "App responded with HTTP $HTTP_CODE on port $PORT (attempt $HEALTH_ATTEMPT)"
    break
  fi
  # curl may print "000" even when it exits non-zero; only retain real success.
  HTTP_CODE=""

  PM2_STATE=$(pm2 jlist 2>/dev/null \
    | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const p=JSON.parse(s).find(p=>p.name==='BSS');process.stdout.write(p?.pm2_env?.status||'missing')}catch(e){process.stdout.write('unknown')}})")

  if [[ "$PM2_STATE" != "online" && "$PM2_STATE" != "launching" ]]; then
    echo
    log "pm2 status"
    pm2 status || true
    log "Last 40 BSS log lines (process state: $PM2_STATE):"
    pm2 logs BSS --lines 40 --nostream || true
    fail "Health check aborted because BSS is not running (pm2 state: $PM2_STATE).
    Fix the startup error shown above, or roll back with:
      git reset --hard $PREV_COMMIT && ./deploy.sh"
  fi

  printf "  attempt %d: no response yet; BSS is %s, retrying in %ss...\n" \
    "$HEALTH_ATTEMPT" "$PM2_STATE" "$HEALTH_RETRY_SECONDS"
  sleep "$HEALTH_RETRY_SECONDS"
done

if [[ -z "$HTTP_CODE" ]]; then
  echo
  log "pm2 status"
  pm2 status || true
  log "Last 40 BSS log lines (startup exceeded ${HEALTH_TIMEOUT_SECONDS}s):"
  pm2 logs BSS --lines 40 --nostream || true
  fail "BSS stayed $PM2_STATE but did not answer within ${HEALTH_TIMEOUT_SECONDS}s.
    Startup may be unusually slow or stuck in migrations. nginx will show 502
    until the app responds. Inspect the logs above, or roll back with:
      git reset --hard $PREV_COMMIT && ./deploy.sh"
fi