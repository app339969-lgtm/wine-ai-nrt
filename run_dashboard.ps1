$ErrorActionPreference = 'Stop'
$webDir = Join-Path $PSScriptRoot 'web'
$npm = 'C:\Program Files\nodejs\npm.cmd'
if (-not (Test-Path $npm)) {
  $cmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "Node.js / npm.cmd not found. Please install Node.js LTS first." }
  $npm = $cmd.Source
}
if (-not (Test-Path (Join-Path $webDir 'node_modules'))) {
  Write-Host "Installing npm dependencies..."
  & $npm --prefix $webDir install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
}
if (-not (Test-Path (Join-Path $webDir '.next\BUILD_ID'))) {
  Write-Host "Building production Next.js bundle..."
  & $npm --prefix $webDir run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
}
Write-Host "Starting SmartRetail Dashboard at http://localhost:3000 (Judge Login: judge@smartretail.th / SmartRetail2025)"
& $npm --prefix $webDir run start
