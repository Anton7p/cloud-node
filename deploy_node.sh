#!/bin/bash
# Deploy script for infrastructure nodes
# Uses new deploy-phase.yml

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo "Loading environment from $ENV_FILE..."

# Export all variables from .env automatically
set -a
source "$ENV_FILE"
set +a

echo "Environment loaded from .env"
echo "VPN_ADMIN_USERNAME=$VPN_ADMIN_USERNAME"
echo "DOMAIN_NAME=$DOMAIN_NAME"
echo ""
echo "Starting Ansible node deployment..."
cd "$SCRIPT_DIR/ansible"
ansible-playbook -i inventory_nodes.ini deploy-phase.yml \
  -e "master_server_address=62.60.229.227" \
  -e "@deploy_vars.yml" \
  -e "ssh_public_key=${SSH_PUBLIC_KEY}"

echo "Node deployment completed!"
