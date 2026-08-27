# Creates a SQLite-consistent Family Hub snapshot, stores it in an encrypted
# Restic repository, then applies the retention policy. Schedule this script
# with install-restic-backup.ps1 after configuring hosting/restic.env.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$config = Join-Path $PSScriptRoot 'restic.env'
$snapshotDir = Join-Path $env:TEMP 'FamilyHubResticSnapshot'
$node = (Get-Command node -ErrorAction Stop).Source
$resticCommand = Get-Command restic -ErrorAction SilentlyContinue
$restic = if ($resticCommand) {
  $resticCommand.Source
} else {
  # WinGet machine installs expose package shims here. This fallback also makes
  # the scheduled task reliable before Windows refreshes an existing PATH.
  $winGetShim = Join-Path $env:ProgramFiles 'WinGet\Links\restic.exe'
  if (-not (Test-Path -LiteralPath $winGetShim)) {
    throw 'Restic was not found on PATH or at the WinGet machine-install location.'
  }
  $winGetShim
}

if (-not (Test-Path -LiteralPath $config)) {
  throw "Missing $config. Copy hosting/restic.env.example to hosting/restic.env and configure B2 first."
}

# Load only simple KEY=VALUE lines. This avoids evaluating the config as code.
Get-Content -LiteralPath $config | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $parts = $line.Split('=', 2)
  if ($parts.Count -ne 2 -or -not $parts[0].Trim()) { throw "Invalid config line: $line" }
  [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
}

foreach ($name in 'RESTIC_REPOSITORY', 'B2_ACCOUNT_ID', 'B2_ACCOUNT_KEY', 'RESTIC_PASSWORD_FILE') {
  if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) { throw "Missing $name in $config" }
}
if (-not (Test-Path -LiteralPath $env:RESTIC_PASSWORD_FILE)) {
  throw "Restic password file was not found: $env:RESTIC_PASSWORD_FILE"
}

New-Item -ItemType Directory -Force -Path $snapshotDir | Out-Null

try {
  # A fresh B2 prefix has no Restic config yet. Initialize it once; later runs
  # simply confirm that the encrypted repository can be opened.
  $oldErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $restic cat config *> $null
  $repositoryExists = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $oldErrorActionPreference
  if (-not $repositoryExists) {
    & $restic init
    if ($LASTEXITCODE -ne 0) { throw "Restic repository initialization failed with exit code $LASTEXITCODE" }
  }

  # Reuse the app's verified node:sqlite backup path so live WAL changes are included.
  $env:FAMILYHUB_BACKUP_DIR = $snapshotDir
  $env:FAMILYHUB_KEEP_DAYS = '1'
  & $node (Join-Path $PSScriptRoot 'backup-db.mjs')
  if ($LASTEXITCODE -ne 0) { throw "SQLite backup failed with exit code $LASTEXITCODE" }

  $snapshot = Get-ChildItem -LiteralPath $snapshotDir -Filter 'familyhub-*.sqlite.gz' |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $snapshot) { throw 'SQLite backup did not create a snapshot' }

  & $restic backup $snapshot.FullName --tag familyhub --tag sqlite
  if ($LASTEXITCODE -ne 0) { throw "Restic backup failed with exit code $LASTEXITCODE" }

  & $restic forget --keep-daily 30 --keep-monthly 12 --prune
  if ($LASTEXITCODE -ne 0) { throw "Restic retention failed with exit code $LASTEXITCODE" }

  # A full repository check weekly catches remote corruption without making the
  # daily job needlessly slow.
  if ((Get-Date).DayOfWeek -eq 'Sunday') {
    & $restic check
    if ($LASTEXITCODE -ne 0) { throw "Restic integrity check failed with exit code $LASTEXITCODE" }
  }
}
finally {
  Remove-Item -LiteralPath $snapshotDir -Recurse -Force -ErrorAction SilentlyContinue
}
