$baseDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$artifactsDir = Join-Path $baseDir "web-ext-artifacts"

$latestZip = Get-ChildItem -Path $artifactsDir -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestZip) {
    $xpiPath = [System.IO.Path]::ChangeExtension($latestZip.FullName, ".xpi")
    Copy-Item $latestZip.FullName $xpiPath -Force
    Write-Host "Created XPI package at $xpiPath from $($latestZip.Name)"
} else {
    Write-Host "Zip package not found in $artifactsDir, run npm run build first."
}
