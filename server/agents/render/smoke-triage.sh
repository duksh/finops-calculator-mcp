#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-10000}"
BASE_URL="http://127.0.0.1:${PORT}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

node "$AGENTS_DIR/api-server.js" >/tmp/ficecal-agent-hub-smoke.log 2>&1 &
SERVER_PID=$!

for _ in {1..25}; do
  if curl -fsS "$BASE_URL/healthz" >/dev/null 2>&1; then
    break
  fi
  sleep 0.4
done

HEALTH_RESPONSE="$(curl -fsS "$BASE_URL/healthz")"
if [[ "$HEALTH_RESPONSE" != *'"status":"ok"'* ]]; then
  echo "[FAIL] healthz did not return status ok"
  echo "$HEALTH_RESPONSE"
  exit 1
fi

TRIAGE_PAYLOAD='{
  "requestId": "smoke-triage-001",
  "inputs": {
    "nRef": 120,
    "devPerClient": 500,
    "infraTotal": 2400,
    "startupTargetPrice": 35,
    "margin": 20
  },
  "providers": ["aws"],
  "context": {
    "goal": "improve-health-zone",
    "audience": "cto",
    "maxActions": 3
  }
}'

TRIAGE_RESPONSE="$(curl -fsS -X POST "$BASE_URL/v1/agent/triage" \
  -H 'content-type: application/json' \
  --data "$TRIAGE_PAYLOAD")"

if [[ "$TRIAGE_RESPONSE" != *'"status":"success"'* ]]; then
  echo "[FAIL] triage did not return status success"
  echo "$TRIAGE_RESPONSE"
  exit 1
fi

if [[ "$TRIAGE_RESPONSE" != *'"actionPlan"'* ]]; then
  echo "[FAIL] triage response missing actionPlan"
  echo "$TRIAGE_RESPONSE"
  exit 1
fi

echo "[PASS] Agent triage smoke test succeeded."
