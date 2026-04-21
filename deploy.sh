#!/bin/bash
# Deploy script for WSL with environment variables from .env
# Uses new deploy-phase.yml

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

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
cd "$SCRIPT_DIR/ansible"
ansible-playbook -i inventory.ini deploy-phase.yml \
  -e "@deploy_vars.yml"

echo "Deployment completed!"
