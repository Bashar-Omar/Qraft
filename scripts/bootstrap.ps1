$ErrorActionPreference = "Stop"

$RequiredPnpmVersion = "11.23.0"

Write-Host ""
Write-Host "Qraft / Phase 0 bootstrap" -ForegroundColor Green
Write-Host "--------------------------"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed. Install Node 24 LTS and rerun."
}

$nodeVersion = node -p "process.versions.node"
$nodeMajor = [int]($nodeVersion.Split(".")[0])

if ($nodeMajor -ne 24) {
  throw "Qraft Phase 0 standardizes local and CI on Node 24 LTS. Found Node $nodeVersion."
}

Write-Host "Node: $nodeVersion"

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

$pnpmCommand = Resolve-Pnpm

if (-not $pnpmCommand) {
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is unavailable. Reinstall Node 24 LTS with npm included."
  }

  $userNpmPrefix = Join-Path $env:APPDATA "npm"
  New-Item -ItemType Directory -Force -Path $userNpmPrefix | Out-Null

  Write-Host ""
  Write-Host "pnpm is not available on PATH." -ForegroundColor Yellow
  Write-Host "Installing pnpm $RequiredPnpmVersion into the current user's npm prefix..." -ForegroundColor Cyan

  & npm install --global "pnpm@$RequiredPnpmVersion" --prefix $userNpmPrefix

  if ($LASTEXITCODE -ne 0) {
    throw "pnpm installation failed with exit code $LASTEXITCODE."
  }

  # Make the user-level npm global bin immediately available in this shell.
  $pathEntries = $env:Path -split ";"
  if ($pathEntries -notcontains $userNpmPrefix) {
    $env:Path = "$userNpmPrefix;$env:Path"
  }

  $pnpmCommand = Resolve-Pnpm
}

if (-not $pnpmCommand) {
  throw "pnpm installation completed but Qraft could not resolve pnpm.cmd/pnpm.exe."
}

$pnpmVersion = (& $pnpmCommand --version).Trim()

if ($LASTEXITCODE -ne 0) {
  throw "Unable to run pnpm."
}

Write-Host "pnpm: $pnpmVersion"

if ($pnpmVersion -ne $RequiredPnpmVersion) {
  throw "Qraft requires pnpm $RequiredPnpmVersion for this checkpoint. Found $pnpmVersion."
}

Write-Host ""
Write-Host "Installing dependencies and generating pnpm-lock.yaml..." -ForegroundColor Cyan
& $pnpmCommand install

if ($LASTEXITCODE -ne 0) {
  throw "pnpm install failed with exit code $LASTEXITCODE."
}

if (-not (Test-Path ".\pnpm-lock.yaml")) {
  throw "pnpm install completed without creating pnpm-lock.yaml."
}

Write-Host ""
Write-Host "Bootstrap complete." -ForegroundColor Green
Write-Host "Lockfile: $(Resolve-Path .\pnpm-lock.yaml)"
Write-Host "Next: .\scripts\verify.ps1"
