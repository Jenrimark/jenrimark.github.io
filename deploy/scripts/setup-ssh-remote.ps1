# Switch repo remote from HTTPS to SSH (fixes TLS errors on git pull)
# Run once on Windows home PC

param(
    [string]$RepoRoot = "E:\Desktop\Jenrimark",
    [string]$GithubRepo = "Jenrimark/Jenrimark"
)

$ErrorActionPreference = "Stop"
$sshUrl = "git@github.com:$GithubRepo.git"
$keyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
$pubPath = "$keyPath.pub"

Write-Host "==> Repo: $RepoRoot"
Write-Host "==> SSH remote: $sshUrl"
Write-Host ""

if (-not (Test-Path $RepoRoot)) {
    throw "Repo not found: $RepoRoot"
}

Set-Location $RepoRoot

if (-not (Test-Path ".git")) {
    throw "Not a git repo: $RepoRoot"
}

if (-not (Test-Path $keyPath)) {
    Write-Host "No SSH key found. Creating id_ed25519 ..."
    Write-Host "Press Enter for defaults (empty passphrase is OK)."
    ssh-keygen -t ed25519 -C "jenrimark-windows-deploy" -f $keyPath
    Write-Host ""
}

if (-not (Test-Path $pubPath)) {
    throw "Missing public key: $pubPath"
}

Write-Host "==> Add this public key to GitHub:"
Write-Host "    https://github.com/settings/keys  -> New SSH key"
Write-Host ""
Get-Content $pubPath
Write-Host ""
Read-Host "Press Enter after you added the key on GitHub"

Write-Host "==> Testing SSH to GitHub..."
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
ssh -T git@github.com 2>&1 | ForEach-Object { Write-Host $_ }
$ErrorActionPreference = $prev
Write-Host "(Hi username! or success message = OK; warning about shell is OK)"
Write-Host ""

Write-Host "==> git remote set-url origin $sshUrl"
git remote set-url origin $sshUrl
git remote -v
Write-Host ""

Write-Host "==> git pull..."
function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
    $p = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & git @GitArgs
    $code = $LASTEXITCODE
    $ErrorActionPreference = $p
    if ($code -ne 0) { throw "git failed: git $($GitArgs -join ' ')" }
}
Invoke-Git pull origin main

Write-Host ""
Write-Host "[OK] SSH remote ready. deploy-once.bat / webhook deploy will use SSH now."
