#!/bin/bash
# Full deployment script - bootstrap + deploy for master and all nodes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

echo "========================================="
echo "FULL DEPLOYMENT"
echo "========================================="
echo "Loading environment from $ENV_FILE..."

set -a
source "$ENV_FILE"
set +a

cd "$SCRIPT_DIR"

# 1. Bootstrap master
echo ""
echo "========================================="
echo "STEP 1: Bootstrap master server"
echo "========================================="
ansible-playbook -i inventory.ini bootstrap.yml

# 2. Deploy application on master
echo ""
echo "========================================="
echo "STEP 2: Deploy application on master"
echo "========================================="
./deploy.sh

# 3. Bootstrap all nodes
echo ""
echo "========================================="
echo "STEP 3: Bootstrap all nodes"
echo "========================================="
ansible-playbook -i inventory_nodes.ini bootstrap.yml

# 4. Deploy Marzban Node on all nodes
echo ""
echo "========================================="
echo "STEP 4: Deploy Marzban Node on all nodes"
echo "========================================="
./deploy_node.sh

echo ""
echo "========================================="
echo "FULL DEPLOYMENT COMPLETED"
echo "========================================="
