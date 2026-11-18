param(
    [string]$Token = $env:GITHUB_TOKEN,
    [string]$CommitMessage = "Release v1.1.0: Fix WebSocket & session loops, add AI Theming Studio"
)

if (-not $Token) {
    Write-Error "Please provide a GitHub Personal Access Token via -Token or `$env:GITHUB_TOKEN"
    exit 1
}

$repoName = "firefox-messenger-sidebar"
$description = "Ultra lightweight, robust and dynamic Facebook Messenger sidebar extension for Firefox with AI Theming"

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "PowerShell-Uploader"
}

Write-Host "Authenticating with GitHub API..."
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Method Get -Headers $headers
    $username = $user.login
    Write-Host "Authenticated successfully as: $username"
} catch {
    Write-Error "Failed to authenticate with GitHub: $_"
    exit 1
}

$baseDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $baseDir

# Commit changes
git add -A
git commit -m $CommitMessage

$remoteUrl = "https://$($username):$($Token)@github.com/$username/$repoName.git"
git remote remove origin 2>$null
git remote add origin $remoteUrl

Write-Host "Pushing updates to GitHub ($username/$repoName)..."
git push -u origin main

# Sanitize remote URL so token is never saved on disk
git remote set-url origin "https://github.com/$username/$repoName.git"

Write-Host "Successfully updated https://github.com/$username/$repoName"
