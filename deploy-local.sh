#!/bin/bash
# Local Docker deployment script
# Usage: ./deploy-local.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo "=================================="
echo "Local Docker Deployment"
echo "=================================="

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    echo "Please create .env file from .env.example"
    exit 1
fi

echo "Loading environment from $ENV_FILE..."

# Export variables from .env
while IFS='=' read -r key value || [[ -n "$key" ]]; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    key=$(echo "$key" | sed 's/\r$//' | xargs)
    [[ -z "$value" ]] && continue
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" -e 's/\r$//')
    export "$key=$value"
    echo "  $key loaded"
done < "$ENV_FILE"

echo ""
echo "Checking required variables..."

# Validate required variables
required_vars=("IMAGE_NAME" "IMAGE_TAG" "DB_PASSWORD" "TELEGRAM_BOT_TOKEN" "ENCRYPTION_KEY")
missing=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing+=("$var")
    fi
done

if [ ${#missing[@]} -gt 0 ]; then
    echo "Error: Missing required variables:"
    for var in "${missing[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

echo "  All required variables present"
echo ""
echo "Docker Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "Docker is running"
echo ""

# Create postgres_data directory if not exists
mkdir -p "$SCRIPT_DIR/postgres_data"

# Pull latest image
echo "Pulling latest image..."
docker pull "${IMAGE_NAME}:${IMAGE_TAG}"

# Stop existing containers
echo ""
echo "Stopping existing containers..."
docker compose -f "$SCRIPT_DIR/docker-compose.local.yml" down || true

# Start new containers
echo ""
echo "Starting containers..."
docker compose -f "$SCRIPT_DIR/docker-compose.local.yml" up -d

# Wait for database
echo ""
echo "Waiting for database..."
sleep 5

# Check container status
echo ""
echo "Container status:"
docker ps -a | grep cloudnode || true

# Check logs if bot not healthy
echo ""
echo "Checking bot logs..."
sleep 3
docker logs cloudnode-bot-1 --tail 20 || true

echo ""
echo "=================================="
echo "Deployment complete!"
echo "=================================="
echo ""
echo "Useful commands:"
echo "  docker logs cloudnode-bot-1 -f    # Follow bot logs"
echo "  docker logs cloudnode-db-1 -f     # Follow db logs"
echo "  docker compose -f docker-compose.local.yml down  # Stop all"
echo ""
