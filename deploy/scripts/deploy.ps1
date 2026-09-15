# Windows deploy: git pull + npm build
# Run: powershell -ExecutionPolicy Bypass -File deploy\scripts\deploy.ps1

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = & git @GitArgs 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    if ($output) {
        $output | ForEach-Object { Write-Host $_ }
    }
    if ($code -ne 0) {
        throw "git failed: git $($GitArgs -join ' ') (exit $code)"
    }
}

$RepoRoot   = if ($env:REPO_ROOT)   { $env:REPO_ROOT }   else { "E:\Desktop\Jenrimark" }
$BuildDist  = Join-Path $RepoRoot "dist"
$DeployPath = if ($env:DEPLOY_PATH) { $env:DEPLOY_PATH } else { $BuildDist }
$Branch     = if ($env:BRANCH)     { $env:BRANCH }     else { "main" }

Write-Host "==> Repo:    $RepoRoot"
Write-Host "==> Build:   $BuildDist"
Write-Host "==> Nginx:   $DeployPath"
Write-Host "==> Branch:  $Branch"

if (-not (Test-Path $RepoRoot)) {
    throw "Repo not found: $RepoRoot. Run: git clone ..."
}

Set-Location $RepoRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git not found. Install Git for Windows."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm not found. Install Node.js 22+."
}

Write-Host "==> git pull..."
Invoke-Git fetch origin $Branch
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
git checkout $Branch 2>$null | Out-Null
$ErrorActionPreference = $prev
Invoke-Git pull origin $Branch

Write-Host "==> npm ci..."
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

Write-Host "==> npm run build..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

if (-not (Test-Path $BuildDist)) {
    throw "Build failed: dist folder missing"
}

if (-not (Test-Path $DeployPath)) {
    New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
}

$buildResolved  = (Resolve-Path $BuildDist).Path
$deployResolved = (Resolve-Path $DeployPath).Path

if ($buildResolved -eq $deployResolved) {
    Write-Host "==> Build output is Nginx root (no copy needed)"
} else {
    Write-Host "==> robocopy $BuildDist -> $DeployPath"
    robocopy $BuildDist $DeployPath /MIR /NFL /NDL /NJH /NJS | Out-Host
    if ($LASTEXITCODE -ge 8) {
        throw "robocopy failed, exit code $LASTEXITCODE"
    }
}

Write-Host ""
Write-Host "Done: $DeployPath"
Write-Host "Local:  http://127.0.0.1:8080/"
Write-Host "Public: http://gd02.frp0.cc:23332/ | http://120.24.93.79:23332/ (if frpc is running)"
