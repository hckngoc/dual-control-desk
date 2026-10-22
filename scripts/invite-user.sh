#!/usr/bin/env bash
# Operator-only invite generation. Does NOT mutate role mappings or approve CRs.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${1:?Usage: npm run invite -- username}"
if [ -f .env.bootstrap ]; then set -a; . ./.env.bootstrap; set +a; fi
: "${KC_BOOTSTRAP_ADMIN_PASSWORD:?Set operator credentials in .env.bootstrap}"
BASE="${TIDECLOAK_URL:-http://localhost:8080}"
REALM="${REALM_NAME:-dual-control-desk}"
TOKEN=$(curl -fsS -X POST "$BASE/realms/master/protocol/openid-connect/token" -H 'Content-Type: application/x-www-form-urlencoded' -d 'grant_type=password&client_id=admin-cli' --data-urlencode "username=${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}" --data-urlencode "password=$KC_BOOTSTRAP_ADMIN_PASSWORD" | jq -er '.access_token')
USER_ID=$(curl -fsS -G "$BASE/admin/realms/$REALM/users" --data-urlencode "username=$1" --data-urlencode 'exact=true' -H "Authorization: Bearer $TOKEN" | jq -er 'if length==1 then .[0].id else error("Need one exact committed user") end')
curl -fsS -X POST "$BASE/admin/realms/$REALM/tideAdminResources/get-required-action-link?userId=$USER_ID&lifespan=43200" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '["link-tide-account-action"]'
printf '\nShare privately with that user. Do not commit or record this invite.\n'
