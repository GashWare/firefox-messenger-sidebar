param(
    [string]$Token = $env:GITHUB_TOKEN
)

if (-not $Token) {
    Write-Error "Please provide a GitHub Personal Access Token via -Token or `$env:GITHUB_TOKEN"
    exit 1
}

$repoName = "firefox-messenger-sidebar"
$description = "Ultra lightweight, robust and dynamic Facebook Messenger sidebar extension for Firefox"

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

# Reset git history to a clean single commit (removes all intermediate draft history)
git checkout --orphan fresh_main
git add -A
git commit -m "Initial release: Facebook Messenger Sidebar for Firefox v1.0.0"

# Replace main branch with fresh_main
git branch -D main 2>$null
git branch -m main

$remoteUrl = "https://$($username):$($Token)@github.com/$username/$repoName.git"
git remote remove origin 2>$null
git remote add origin $remoteUrl

Write-Host "Pushing clean single-commit history to GitHub ($username/$repoName)..."
git push -u origin main --force

# Sanitize remote URL
git remote set-url origin "https://github.com/$username/$repoName.git"

Write-Host "Successfully updated https://github.com/$username/$repoName with clean history."
