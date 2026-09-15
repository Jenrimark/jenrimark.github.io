# Listen for deploy trigger (GitHub Actions curl or GitHub Webhook via frp)
# Default: http://127.0.0.1:9100/webhook?token=YOUR_SECRET

param(
    [int]$Port = 9100
)

$ErrorActionPreference = "Stop"
$RepoRoot = if ($env:REPO_ROOT) { $env:REPO_ROOT } else { "E:\Desktop\Jenrimark" }
$DeployPs1 = Join-Path $RepoRoot "deploy\scripts\deploy.ps1"
$TokenFile = Join-Path $RepoRoot "deploy\webhook.token"

function Read-TokenFromFile([string]$path) {
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    return $text.Trim().Trim([char]0xFEFF)
}

function Get-QueryToken([System.Net.HttpListenerRequest]$request) {
    $raw = $request.QueryString["token"]
    if ([string]::IsNullOrEmpty($raw)) { return "" }
    return [System.Uri]::UnescapeDataString($raw).Trim()
}

function Send-Response(
    [System.Net.HttpListenerResponse]$response,
    [int]$code,
    [string]$body
) {
    $response.StatusCode = $code
    $response.Headers["Connection"] = "Close"
    $buf = [System.Text.Encoding]::UTF8.GetBytes($body)
    $response.ContentLength64 = $buf.Length
    $response.OutputStream.Write($buf, 0, $buf.Length)
    $response.OutputStream.Close()
}

function Start-DeployJob() {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Deploy triggered."
    Start-Process -FilePath "powershell.exe" -WorkingDirectory $RepoRoot -WindowStyle Minimized -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $DeployPs1
    ) | Out-Null
}

# Load token: prefer webhook.token file; env DEPLOY_WEBHOOK_TOKEN overrides if set
$Token = $null
$tokenSource = "none"
if (Test-Path $TokenFile) {
    $Token = Read-TokenFromFile $TokenFile
    $tokenSource = "file"
}
if (-not [string]::IsNullOrWhiteSpace($env:DEPLOY_WEBHOOK_TOKEN)) {
    $Token = $env:DEPLOY_WEBHOOK_TOKEN.Trim().Trim([char]0xFEFF)
    $tokenSource = "env DEPLOY_WEBHOOK_TOKEN"
}
if (-not $Token) {
    throw "Create deploy\webhook.token (see webhook.token.example)"
}

if (-not (Test-Path $DeployPs1)) {
    throw "Missing $DeployPs1"
}

$prefix = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Webhook server: $prefix"
Write-Host "POST /webhook?token=***"
Write-Host "Token source: $tokenSource (length $($Token.Length))"
Write-Host "Token file:   $TokenFile"
Write-Host "Repo: $RepoRoot"
Write-Host "Ctrl+C to stop."
Write-Host ""

while ($listener.IsListening) {
    $context = $null
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        if ($request.Url.AbsolutePath -eq "/health") {
            Send-Response $response 200 "ok"
        }
        elseif ($request.HttpMethod -ne "POST") {
            Send-Response $response 405 "POST only"
        }
        elseif ($request.Url.AbsolutePath -ne "/webhook") {
            Send-Response $response 404 "not found"
        }
        else {
            $qToken = Get-QueryToken $request
            if ($qToken -cne $Token) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 401 mismatch (query len=$($qToken.Length), expected len=$($Token.Length))"
                if ($qToken.Length -eq 0) {
                    Write-Host "  Hint: add ?token=... to URL"
                }
                Send-Response $response 401 "unauthorized"
            }
            else {
                # 先响应再部署，避免 ReadToEnd 经 frp 阻塞导致 GitHub Actions 超时
                Send-Response $response 200 "deploy started"
                Start-DeployJob
            }
        }
    }
    catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Request error: $_"
    }
    finally {
        if ($null -ne $context) {
            try { $context.Response.Close() } catch {}
        }
    }
}
