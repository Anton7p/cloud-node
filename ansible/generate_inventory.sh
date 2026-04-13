#!/bin/bash
# Generate Ansible inventory from INFRASTRUCTURE_IP_LIST environment variable
# Usage: ./generate_inventory.sh [output_file]
# Default output: inventory.ini

OUTPUT_FILE="${1:-inventory.ini}"
SERVER_USER="${SERVER_USER:-root}"
SSH_KEY_FILE="${SSH_KEY_FILE:-~/.ssh/id_rsa}"

if [ -z "$INFRASTRUCTURE_IP_LIST" ] && [ -z "$SERVER_IP" ]; then
    echo "Error: Either INFRASTRUCTURE_IP_LIST or SERVER_IP must be set"
    echo "Example: export INFRASTRUCTURE_IP_LIST='192.168.1.10,192.168.1.11'"
    echo "Example: export SERVER_IP='192.168.1.1'"
    exit 1
fi

echo "Generating Ansible inventory..."

# Add master server if SERVER_IP is set
if [ -n "$SERVER_IP" ]; then
    echo "[master]" > "$OUTPUT_FILE"
    echo "${SERVER_IP} ansible_user=${SERVER_USER} ansible_ssh_private_key_file=${SSH_KEY_FILE}" >> "$OUTPUT_FILE"
    echo "  Added master: $SERVER_IP"
    echo "" >> "$OUTPUT_FILE"
fi

echo "[nodes]" >> "$OUTPUT_FILE"

# Split by comma and process each IP
if [ -n "$INFRASTRUCTURE_IP_LIST" ]; then
    IFS=',' read -ra IPS <<< "$INFRASTRUCTURE_IP_LIST"
    for ip in "${IPS[@]}"; do
        # Trim whitespace
        ip=$(echo "$ip" | xargs)
        if [ -n "$ip" ]; then
            echo "${ip} ansible_user=${SERVER_USER} ansible_ssh_private_key_file=${SSH_KEY_FILE}" >> "$OUTPUT_FILE"
            echo "  Added node: $ip"
        fi
    done
else
    echo "  Warning: INFRASTRUCTURE_IP_LIST is empty, no nodes will be configured"
fi

echo "" >> "$OUTPUT_FILE"
echo "[nodes:vars]" >> "$OUTPUT_FILE"
echo "ansible_python_interpreter=/usr/bin/python3" >> "$OUTPUT_FILE"
echo "ansible_ssh_extra_args=-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" >> "$OUTPUT_FILE"

echo ""
echo "Inventory file generated: $OUTPUT_FILE"
if [ -n "$INFRASTRUCTURE_IP_LIST" ]; then
    IFS=',' read -ra IPS <<< "$INFRASTRUCTURE_IP_LIST"
    echo "Total nodes: ${#IPS[@]}"
else
    echo "Total nodes: 0"
fi
if [ -n "$SERVER_IP" ]; then
    echo "Master server: $SERVER_IP"
fi
