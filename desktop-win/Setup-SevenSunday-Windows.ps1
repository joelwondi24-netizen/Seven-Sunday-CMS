$ErrorActionPreference = "Stop"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Seven Sunday Ethiopia ERP — Windows .exe Setup Builder" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js 20+ is required. Opening https://nodejs.org/ ..." -ForegroundColor Red
  Start-Process "https://nodejs.org/"
  exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

if (Test-Path (Join-Path $rootDir "package.json")) {
  Write-Host "[1/3] Preparing frontend & standalone backend bundle..." -ForegroundColor Yellow
  Push-Location $rootDir
  if (-not (Test-Path (Join-Path $rootDir "node_modules"))) {
    npm install
  }
  npm run desktop:prepare
  Pop-Location
}

Write-Host "[2/3] Installing Windows Electron packager dependencies..." -ForegroundColor Yellow
Push-Location $scriptDir
npm install

Write-Host "[3/3] Compiling Windows Setup (.exe) & Portable (.exe)..." -ForegroundColor Yellow
npm run dist:win
Pop-Location

$outDir = Join-Path $rootDir "dist-electron"
if (Test-Path $outDir) {
  Write-Host ""
  Write-Host "Build complete! Generated Windows executables:" -ForegroundColor Green
  Get-ChildItem $outDir -Filter "*.exe" | ForEach-Object { Write-Host "  - $($_.FullName)" -ForegroundColor White }
  $setupExe = Get-ChildItem $outDir -Filter "*Setup*.exe" | Select-Object -First 1
  if ($setupExe) {
    Write-Host "Launching installer: $($setupExe.Name)" -ForegroundColor Cyan
    Start-Process $setupExe.FullName
  } else {
    Start-Process explorer.exe $outDir
  }
}
