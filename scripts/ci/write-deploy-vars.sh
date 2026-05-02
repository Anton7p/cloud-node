#!/usr/bin/env bash
# Единая генерация deploy_vars.yml для GitHub Actions (deploy + infrastructure).
# Все значения — из переменных окружения шага workflow.
set -euo pipefail

OUT="${DEPLOY_VARS_PATH:-deploy_vars.yml}"

: "${IMAGE_NAME:?IMAGE_NAME is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${DOMAIN_NAME:?DOMAIN_NAME is required}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${ENCRYPTION_KEY:?ENCRYPTION_KEY is required}"
: "${VPN_ADMIN_USERNAME:?VPN_ADMIN_USERNAME is required}"
: "${VPN_ADMIN_PASSWORD:?VPN_ADMIN_PASSWORD is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

MARZBAN_INBOUND_TAG="${MARZBAN_INBOUND_TAG:-VLESS TCP REALITY}"
INFRASTRUCTURE_IP_LIST="${INFRASTRUCTURE_IP_LIST:-}"
REALITY_PUBLIC_KEY="${REALITY_PUBLIC_KEY:-}"
REALITY_SHORT_ID="${REALITY_SHORT_ID:-}"
VPN_PANEL_URL="${VPN_PANEL_URL:-}"

cat >"$OUT" <<VARS_EOF
---
image_name: "${IMAGE_NAME}"
image_tag: "${IMAGE_TAG}"
domain_name: "${DOMAIN_NAME}"
db_password: "${VPN_ADMIN_PASSWORD}"
redis_password: "${VPN_ADMIN_PASSWORD}"
telegram_bot_token: "${TELEGRAM_BOT_TOKEN}"
encryption_key: "${ENCRYPTION_KEY}"
vpn_admin_username: "${VPN_ADMIN_USERNAME}"
vpn_admin_password: "${VPN_ADMIN_PASSWORD}"
infrastructure_ip_list: '${INFRASTRUCTURE_IP_LIST}'
reality_public_key: "${REALITY_PUBLIC_KEY}"
reality_short_id: "${REALITY_SHORT_ID}"
marzban_inbound_tag: "${MARZBAN_INBOUND_TAG}"
vpn_panel_url: "${VPN_PANEL_URL}"
github_token: "${GITHUB_TOKEN}"
github_actor: "${GITHUB_ACTOR}"
VARS_EOF

echo "Wrote ${OUT}"
