$baseDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$zipPath = Join-Path $baseDir "web-ext-artifacts\facebook_messenger_sidebar-1.0.0.zip"
$xpiPath = Join-Path $baseDir "web-ext-artifacts\facebook_messenger_sidebar-1.0.0.xpi"

if (Test-Path $zipPath) {
    Copy-Item $zipPath $xpiPath -Force
    Write-Host "Created XPI package at $xpiPath"
} else {
    Write-Host "Zip package not found, run npm run build first."
}
