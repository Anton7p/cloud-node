#!/bin/bash
# Deploy script for WSL with environment variables from .env

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

echo "Loading environment from $ENV_FILE..."

# Export all variables from .env (properly handling spaces and special chars)
while IFS='=' read -r key value || [[ -n "$key" ]]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    
    # Trim whitespace and Windows carriage returns from key
    key=$(echo "$key" | sed 's/\r$//' | xargs)
    
    # Skip if no value
    [[ -z "$value" ]] && continue
    
    # Remove quotes if present and Windows carriage returns
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" -e 's/\r$//')
    
    export "$key=$value"
    echo "Loaded: $key"
done < "$ENV_FILE"

echo ""
echo "Loaded IMAGE_NAME=$IMAGE_NAME"
echo "Loaded IMAGE_TAG=$IMAGE_TAG"
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
  -e "redis_password=${REDIS_PASSWORD:-${VPN_ADMIN_PASSWORD}}"

echo "Deployment completed!"
