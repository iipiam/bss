#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

BIN_DIR="$TMP_DIR/bin"
mkdir -p "$BIN_DIR"

cat >"$BIN_DIR/curl" <<'EOF'
#!/usr/bin/env bash
count=0
[[ -f "$CURL_COUNT_FILE" ]] && read -r count <"$CURL_COUNT_FILE"
count=$((count + 1))
printf '%s\n' "$count" >"$CURL_COUNT_FILE"
if [[ "$CURL_MODE" == "delayed" && "$count" -ge 3 ]]; then
  printf '200'
  exit 0
fi
printf '000'
exit 7
EOF

cat >"$BIN_DIR/pm2" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  jlist)
    printf '[{"name":"BSS","pm2_env":{"status":"%s"}}]\n' "$PM2_TEST_STATE"
    ;;
  status)
    printf 'MOCK PM2 STATUS: %s\n' "$PM2_TEST_STATE"
    ;;
  logs)
    printf 'MOCK BSS LOG: startup diagnostic\n'
    ;;
  *)
    printf 'unexpected pm2 invocation: %s\n' "$*" >&2
    exit 2
    ;;
esac
EOF
chmod +x "$BIN_DIR/curl" "$BIN_DIR/pm2"

RUN_STATUS=0
RUN_OUTPUT=""

run_case() {
  local mode="$1"
  local state="$2"
  local timeout="$3"
  local retry="$4"
  local count_file="$TMP_DIR/curl-count-$mode"
  rm -f "$count_file"

  set +e
  RUN_OUTPUT=$(
    PATH="$BIN_DIR:$PATH" \
    CURL_MODE="$mode" \
    CURL_COUNT_FILE="$count_file" \
    PM2_TEST_STATE="$state" \
    HEALTH_TIMEOUT_SECONDS="$timeout" \
    HEALTH_RETRY_SECONDS="$retry" \
    ROOT="$ROOT" \
    bash -c '
      set -euo pipefail
      log() { printf "LOG: %s\n" "$*"; }
      ok() { printf "OK: %s\n" "$*"; }
      fail() { printf "FAIL: %s\n" "$*"; exit 1; }
      PORT=5000
      PREV_COMMIT=test-previous-commit
      source "$ROOT/scripts/deploy-health-check.sh"
    ' 2>&1
  )
  RUN_STATUS=$?
  set -e
}

assert_status() {
  local expected="$1"
  local label="$2"
  if [[ "$RUN_STATUS" -ne "$expected" ]]; then
    printf 'not ok - %s (expected status %s, got %s)\n%s\n' \
      "$label" "$expected" "$RUN_STATUS" "$RUN_OUTPUT" >&2
    exit 1
  fi
}

assert_output() {
  local expected="$1"
  local label="$2"
  if [[ "$RUN_OUTPUT" != *"$expected"* ]]; then
    printf 'not ok - %s (missing output: %s)\n%s\n' \
      "$label" "$expected" "$RUN_OUTPUT" >&2
    exit 1
  fi
}

run_case delayed online 2 0
assert_status 0 "delayed success exits successfully"
assert_output "attempt 2: no response yet; BSS is online" "delayed success reports retries"
assert_output "App responded with HTTP 200 on port 5000 (attempt 3)" "delayed success reports recovery"
printf 'ok - delayed success\n'

run_case crash errored 2 0
assert_status 1 "crashed process exits with failure"
assert_output "MOCK PM2 STATUS: errored" "crashed process prints pm2 status"
assert_output "MOCK BSS LOG: startup diagnostic" "crashed process prints logs"
assert_output "Health check aborted because BSS is not running (pm2 state: errored)" "crashed process explains failure"
printf 'ok - crashed process\n'

timeout_started=$SECONDS
run_case timeout online 1 1
timeout_elapsed=$((SECONDS - timeout_started))
assert_status 1 "timeout exits with failure"
assert_output "startup exceeded 1s" "timeout labels bounded wait"
assert_output "BSS stayed online but did not answer within 1s" "timeout explains failure"
if (( timeout_elapsed > 3 )); then
  printf 'not ok - timeout was not bounded (elapsed %ss)\n%s\n' \
    "$timeout_elapsed" "$RUN_OUTPUT" >&2
  exit 1
fi
printf 'ok - bounded timeout (%ss)\n' "$timeout_elapsed"