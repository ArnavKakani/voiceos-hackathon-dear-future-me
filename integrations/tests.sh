#!/usr/bin/env bash
set -euo pipefail

: "${DFM_API_URL:?Set DFM_API_URL, for example https://your-domain.example}"
: "${DFM_API_KEY_A:?Set DFM_API_KEY_A to a user A read/write key}"
: "${DFM_API_KEY_B:?Set DFM_API_KEY_B to a different user B read/write key}"

base_url="${DFM_API_URL%/}"
test_dir="$(mktemp -d)"
trap 'rm -r "$test_dir"' EXIT

expect_status() {
  expected="$1"
  shift
  actual="$(curl -sS -o "$test_dir/body" -w '%{http_code}' "$@")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected HTTP $expected, got $actual for: curl $*" >&2
    sed -n '1,20p' "$test_dir/body" >&2
    exit 1
  fi
}

expect_status 200 "$base_url/v1/crisis-resources?region=us"
expect_status 401 "$base_url/v1/entries"
expect_status 401 "$base_url/v1/entries" -H "x-api-key: dfm_live_invalid"

curl -fsS "$base_url/v1/entries" \
  -H "x-api-key: $DFM_API_KEY_A" \
  -H 'content-type: application/json' \
  --data '{"kind":"memory","title":"Isolation A","content":"private user A gate"}' \
  > "$test_dir/a.json"

curl -fsS "$base_url/v1/letters" \
  -H "x-api-key: $DFM_API_KEY_B" \
  -H 'content-type: application/json' \
  --data '{"title":"Isolation B","content":"private user B gate","revisit_at":"2099-01-01T00:00:00Z"}' \
  > "$test_dir/b.json"

entry_a="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["journal_id"])' "$test_dir/a.json")"
entry_b="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["journal_id"])' "$test_dir/b.json")"

expect_status 404 "$base_url/v1/letters/$entry_b" -H "x-api-key: $DFM_API_KEY_A"
expect_status 400 -X DELETE "$base_url/v1/entries/$entry_a" -H "x-api-key: $DFM_API_KEY_A"
expect_status 403 -X DELETE "$base_url/v1/entries/$entry_a?confirm=true" -H "x-api-key: $DFM_API_KEY_A"

curl -fsS "$base_url/v1/openapi.json" | python3 -c '
import json, sys
spec = json.load(sys.stdin)
assert spec["servers"], "OpenAPI servers is empty"
scheme = spec["components"]["securitySchemes"]["ApiKeyAuth"]
assert scheme == {"type": "apiKey", "in": "header", "name": "x-api-key", "description": "Personal Dear Future Me API key (dfm_live_…)."}
assert "/v1/entries" in spec["paths"]
'

echo "All DFM API production gates passed."
