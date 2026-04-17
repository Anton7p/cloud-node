# Local Docker deployment script for PowerShell
# Usage: .\deploy-local.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $ScriptDir ".env"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Local Docker Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Error "Error: .env file not found at $EnvFile"
    Write-Host "Please create .env file from .env.example"
    exit 1
}

Write-Host "Loading environment from $EnvFile..." -ForegroundColor Yellow

# Load .env file
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    if ($_ -match '^\s*([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Remove quotes
        if ($value -match '^"(.*)"$' -or $value -match '^''(.*)''$') {
            $value = $matches[1]
        }
        # Remove carriage returns
        $key = $key -replace '\r', ''
        $value = $value -replace '\r', ''
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "  $key loaded" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Checking required variables..." -ForegroundColor Yellow

# Validate required variables
$requiredVars = @("IMAGE_NAME", "IMAGE_TAG", "DB_PASSWORD", "TELEGRAM_BOT_TOKEN", "ENCRYPTION_KEY")
$missing = @()

foreach ($var in $requiredVars) {
    $val = [Environment]::GetEnvironmentVariable($var, "Process")
    if ([string]::IsNullOrWhiteSpace($val)) {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Error "Error: Missing required variables:"
    foreach ($var in $missing) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    exit 1
}

Write-Host "  All required variables present" -ForegroundColor Green
Write-Host ""

$imageName = [Environment]::GetEnvironmentVariable("IMAGE_NAME", "Process")
$imageTag = [Environment]::GetEnvironmentVariable("IMAGE_TAG", "Process")
Write-Host "Docker Image: ${imageName}:${imageTag}" -ForegroundColor Cyan
Write-Host ""

# Check Docker is running
try {
    $null = docker info 2>$null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Error "Error: Docker is not running. Please start Docker Desktop."
    exit 1
}

Write-Host ""

# Create postgres_data directory
$postgresDir = Join-Path $ScriptDir "postgres_data"
if (-not (Test-Path $postgresDir)) {
    New-Item -ItemType Directory -Path $postgresDir -Force | Out-Null
}

# Login to GHCR
Write-Host "Logging in to GitHub Container Registry..." -ForegroundColor Yellow
$ghcrUsername = [Environment]::GetEnvironmentVariable("GHCR_USERNAME", "Process")
$ghcrToken = [Environment]::GetEnvironmentVariable("GHCR_TOKEN", "Process")
if ($ghcrUsername -and $ghcrToken) {
    $ghcrToken | docker login ghcr.io -u $ghcrUsername --password-stdin 2>$null
    Write-Host "  Login successful" -ForegroundColor Green
} else {
    Write-Host "  Warning: GHCR credentials not found, pull may fail" -ForegroundColor Yellow
}

# Pull latest image
Write-Host ""
Write-Host "Pulling latest image..." -ForegroundColor Yellow
docker pull "${imageName}:${imageTag}"

# Stop existing containers
Write-Host ""
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
$composeFile = Join-Path $ScriptDir "docker-compose.local.yml"
try { docker compose -f $composeFile down 2>$null } catch { }

# Start new containers
Write-Host ""
Write-Host "Starting containers..." -ForegroundColor Yellow
docker compose -f $composeFile up -d

# Wait for database
Write-Host ""
Write-Host "Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check container status
Write-Host ""
Write-Host "Container status:" -ForegroundColor Cyan
$containers = docker ps -a | Select-String "cloudnode"
if (-not $containers) { Write-Host "No containers found" }

# Check logs
Write-Host ""
Write-Host "Checking bot logs..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try { docker logs cloudnode-bot --tail 20 2>$null } catch { Write-Host "No logs yet" }

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  docker logs cloudnode-bot -f    # Follow bot logs"
Write-Host "  docker logs cloudnode-db -f     # Follow db logs"
Write-Host "  docker compose -f docker-compose.local.yml down  # Stop all"
Write-Host ""
