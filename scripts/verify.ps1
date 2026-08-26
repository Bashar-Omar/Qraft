$ErrorActionPreference = "Stop"

$RequiredPnpmVersion = "11.23.0"

Write-Host ""
Write-Host "Qraft / repository verification" -ForegroundColor Green
Write-Host "----------------------------"

function Resolve-Pnpm {
  $existing = Get-Command pnpm -ErrorAction SilentlyContinue
  if ($existing) {
    return $existing.Source
  }

  $candidateFiles = New-Object System.Collections.Generic.List[string]

  if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmPrefix = (& npm config get prefix 2>$null).Trim()
    if ($npmPrefix) {
      $candidateFiles.Add((Join-Path $npmPrefix "pnpm.cmd"))
      $candidateFiles.Add((Join-Path $npmPrefix "pnpm.exe"))
    }
  }

  if ($env:APPDATA) {
    $candidateFiles.Add((Join-Path $env:APPDATA "npm\pnpm.cmd"))
    $candidateFiles.Add((Join-Path $env:APPDATA "npm\pnpm.exe"))
  }

  foreach ($candidate in ($candidateFiles | Select-Object -Unique)) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is unavailable."
}

$nodeVersion = node -p "process.versions.node"
$nodeMajor = [int]($nodeVersion.Split(".")[0])

if ($nodeMajor -ne 24) {
  throw "Qraft repository verification requires Node 24 LTS. Found Node $nodeVersion."
}

$pnpmCommand = Resolve-Pnpm

if (-not $pnpmCommand) {
  throw "pnpm is unavailable. Run .\scripts\bootstrap.ps1 first."
}

$pnpmVersion = (& $pnpmCommand --version).Trim()
if ($pnpmVersion -ne $RequiredPnpmVersion) {
  throw "Qraft verification requires pnpm $RequiredPnpmVersion. Found $pnpmVersion."
}

if (-not (Test-Path ".\pnpm-lock.yaml")) {
  throw "pnpm-lock.yaml is missing. Run .\scripts\bootstrap.ps1 first."
}

Write-Host "Node: $nodeVersion"
Write-Host "pnpm: $pnpmVersion"
Write-Host ""

& $pnpmCommand format:check
if ($LASTEXITCODE -ne 0) { throw "format:check failed." }

& $pnpmCommand lint
if ($LASTEXITCODE -ne 0) { throw "lint failed." }

& $pnpmCommand typecheck
if ($LASTEXITCODE -ne 0) { throw "typecheck failed." }

& $pnpmCommand test
if ($LASTEXITCODE -ne 0) { throw "unit tests failed." }

& $pnpmCommand build
if ($LASTEXITCODE -ne 0) { throw "production build failed." }

Write-Host ""
Write-Host "Installing the matching Chromium build for Playwright..." -ForegroundColor Cyan
& $pnpmCommand exec playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "Playwright Chromium install failed." }

& $pnpmCommand test:e2e
if ($LASTEXITCODE -ne 0) { throw "E2E tests failed." }

Write-Host ""
Write-Host "Qraft local verification passed." -ForegroundColor Green
