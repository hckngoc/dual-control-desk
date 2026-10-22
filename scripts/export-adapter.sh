#!/usr/bin/env bash
# Read-only export for an EXISTING, already licensed and IGA-enabled realm.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env.bootstrap ]; then set -a; . ./.env.bootstrap; set +a; fi
: "${KC_BOOTSTRAP_ADMIN_PASSWORD:?Set your operator credentials in .env.bootstrap (never in .env)}"
BASE="${TIDECLOAK_URL:-http://localhost:8080}"
REALM="${REALM_NAME:-dual-control-desk}"
CLIENT="${CLIENT_NAME:-dual-control-desk-client}"
TOKEN=$(curl -fsS -X POST "$BASE/realms/master/protocol/openid-connect/token" -H 'Content-Type: application/x-www-form-urlencoded' -d 'grant_type=password&client_id=admin-cli' --data-urlencode "username=${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}" --data-urlencode "password=$KC_BOOTSTRAP_ADMIN_PASSWORD" | jq -er '.access_token')
CLIENT_UUID=$(curl -fsS "$BASE/admin/realms/$REALM/clients?clientId=$CLIENT" -H "Authorization: Bearer $TOKEN" | jq -er '.[0].id')
mkdir -p data
TMP=$(mktemp)
trap 'test ! -f "$TMP" || unlink "$TMP"' EXIT
curl -fsS "$BASE/admin/realms/$REALM/vendorResources/get-installations-provider?clientId=$CLIENT_UUID&providerId=keycloak-oidc-keycloak-json" -H "Authorization: Bearer $TOKEN" > "$TMP"
jq -e '(.jwk.keys|length>0) and (.vendorId|length>0) and .resource and .realm and (."public-client"==true) and (has("credentials")|not) and ([.jwk.keys[]|has("d") or has("k")]|any|not)' "$TMP" >/dev/null || { echo 'Invalid adapter. Ensure realm licensing and IGA, then re-export.'; exit 1; }
cp "$TMP" data/tidecloak.json
printf 'Adapter exported. Restart app and rail. Keep .env.bootstrap out of the runtime.\n'
