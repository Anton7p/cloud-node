#!/bin/bash
# Deploy script for WSL with environment variables from .env

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

echo "Loading environment from $ENV_FILE..."

# Export all variables from .env automatically
set -a  # automatically export all variables
source "$ENV_FILE"
set +a  # stop automatic export

echo "Environment loaded from .env"
echo "IMAGE_NAME=$IMAGE_NAME"
echo "IMAGE_TAG=$IMAGE_TAG"
echo ""
echo "Starting Ansible deployment..."
cd "$SCRIPT_DIR"
ansible-playbook -i inventory.ini deploy_app.yml \
  -e "image_name=${IMAGE_NAME}" \
  -e "image_tag=${IMAGE_TAG}" \
  -e "db_password=${DB_PASSWORD}" \
  -e "telegram_bot_token=${TELEGRAM_BOT_TOKEN}" \
  -e "encryption_key=${ENCRYPTION_KEY}" \
  -e "vpn_admin_username=${VPN_ADMIN_USERNAME}" \
  -e "vpn_admin_password=${VPN_ADMIN_PASSWORD}" \
  -e "domain_name=${DOMAIN_NAME}" \
  -e "infrastructure_ip_list=${INFRASTRUCTURE_IP_LIST}" \
  -e "ghcr_username=${GHCR_USERNAME}" \
  -e "ghcr_token=${GHCR_TOKEN}" \
  -e "redis_password=${REDIS_PASSWORD:-${VPN_ADMIN_PASSWORD}}" \
  -e "reality_public_key=${REALITY_PUBLIC_KEY:-}" \
  -e "reality_short_id=${REALITY_SHORT_ID:-}"

echo "Deployment completed!"
