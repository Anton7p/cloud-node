#!/bin/bash
# Full deployment script - two-phase deployment for master and all nodes
# Phase 1: Bootstrap (SSH, Docker, Security) - runs once
# Phase 2: Deploy (Application deployment)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

echo "========================================="
echo "FULL DEPLOYMENT - TWO PHASE"
echo "========================================="
echo "Loading environment from $ENV_FILE..."

set -a
source "$ENV_FILE"
set +a

cd "$SCRIPT_DIR"

# Clean SSH known_hosts for reinstalled servers
echo ""
echo "========================================="
echo "CLEANING SSH KNOWN_HOSTS"
echo "========================================="
echo "Removing old host keys for reinstalled servers..."
ssh-keygen -f '/home/anton/.ssh/known_hosts' -R '62.60.229.227' 2>/dev/null || true
ssh-keygen -f '/home/anton/.ssh/known_hosts' -R '109.172.95.82' 2>/dev/null || true
echo "SSH known_hosts cleaned successfully"

# Phase 1: Bootstrap all servers (master + nodes)
echo ""
echo "========================================="
echo "PHASE 1: Bootstrap all servers"
echo "========================================="
echo "This phase runs once and creates .bootstrapped flag"
echo "SSH keys, Docker, UFW firewall, TCP BBR"
ansible-playbook -i inventory.ini bootstrap-phase.yml \
  -e "infrastructure_ip_list=${INFRASTRUCTURE_IP_LIST}" \
  -e "ssh_public_key=${SSH_PUBLIC_KEY}"

# Phase 2: Deploy application on master
echo ""
echo "========================================="
echo "PHASE 2: Deploy application on master"
echo "========================================="
ansible-playbook -i inventory.ini deploy-phase.yml \
  -e "@deploy_vars.yml"

# Phase 2: Deploy application on nodes
echo ""
echo "========================================="
echo "PHASE 2: Deploy application on nodes"
echo "========================================="
ansible-playbook -i inventory_nodes.ini deploy-phase.yml \
  -e "master_server_address=62.60.229.227" \
  -e "@deploy_vars.yml"

echo ""
echo "========================================="
echo "FULL DEPLOYMENT COMPLETED"
echo "========================================="
echo "Phase 1 (Bootstrap) - DONE"
echo "Phase 2 (Deploy) - DONE"
echo "Next runs will skip Phase 1 thanks to .bootstrapped flag"
echo "========================================="
