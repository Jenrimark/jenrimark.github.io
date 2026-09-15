# Watchdog: keep local webhook (127.0.0.1:9100) alive; restart if port/health check fails.
# Usage:
#   powershell -File watch-webhook.ps1              # check once
#   powershell -File watch-webhook.ps1 -Loop        # loop every 60s (for startup shortcut)

param(
    [int]$Port = 9100,
    [switch]$Loop,
    [int]$IntervalSec = 60
)

$ErrorActionPreference = "Stop"
$RepoRoot = if ($env:REPO_ROOT) { $env:REPO_ROOT } else { "E:\Desktop\Jenrimark" }
$DaemonBat = Join-Path $RepoRoot "deploy\windows\run-webhook-daemon.bat"

function Test-WebhookPort([int]$port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("127.0.0.1", $port, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne(3000, $false)
        if (-not $ok) {
            $client.Close()
            return $false
        }
        $client.EndConnect($async)
        $client.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Test-WebhookHealth([int]$port) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/health" -Method GET -TimeoutSec 3 -UseBasicParsing
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Start-WebhookDaemon {
    if (-not (Test-Path $DaemonBat)) {
        throw "Missing $DaemonBat"
    }
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Webhook down — starting..."
    Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "`"$DaemonBat`"") -WorkingDirectory $RepoRoot -WindowStyle Minimized | Out-Null
}

function Ensure-Webhook([int]$port) {
    if ((Test-WebhookPort $port) -and (Test-WebhookHealth $port)) {
        return
    }
    Start-WebhookDaemon
}

Write-Host "Webhook watchdog: port $Port, interval ${IntervalSec}s, loop=$Loop"
Write-Host "Repo: $RepoRoot"
Write-Host ""

do {
    Ensure-Webhook -port $Port
    if ($Loop) {
        Start-Sleep -Seconds $IntervalSec
    }
} while ($Loop)
