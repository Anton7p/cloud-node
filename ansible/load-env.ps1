# Load environment variables from .env file for Ansible
# Usage: .\load-env.ps1

$EnvFile = "..\.env"

if (-not (Test-Path $EnvFile)) {
    Write-Error "File $EnvFile not found!"
    exit 1
}

Get-Content $EnvFile | ForEach-Object {
    # Skip comments and empty lines
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
        return
    }
    
    # Parse KEY=VALUE
    if ($_ -match '^\s*([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove quotes if present
        if ($value -match '^"(.*)"$' -or $value -match '^''(.*)''$') {
            $value = $matches[1]
        }
        
        [System.Environment]::SetEnvironmentVariable($key, $value)
        Write-Host "Loaded: $key" -ForegroundColor Green
    }
}

Write-Host "`nEnvironment loaded successfully!" -ForegroundColor Cyan
Write-Host "Run: ansible-playbook -i inventory.ini deploy_app.yml" -ForegroundColor Yellow
