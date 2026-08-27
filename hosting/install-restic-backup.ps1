# Installs a daily, per-user Windows task for the encrypted Family Hub backup.
# Run from an elevated PowerShell after creating hosting/restic.env and the
# password file named there.
[CmdletBinding()]
param(
  [switch]$RunNow,
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$taskName = 'Family Hub Encrypted Backup'
$script = Join-Path $PSScriptRoot 'backup-restic.ps1'
$logDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'logs'
$log = Join-Path $logDir 'restic-backup.log'

if ($Uninstall) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed scheduled task: $taskName"
  exit 0
}

if (-not (Test-Path -LiteralPath $script)) { throw "Missing backup script: $script" }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'restic.env'))) {
  throw 'Create hosting/restic.env from restic.env.example before installing the task.'
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$command = "& `"$script`" *>> `"$log`""
$argument = "-NoProfile -ExecutionPolicy Bypass -Command $command"
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argument
$trigger = New-ScheduledTaskTrigger -Daily -At 3:30AM
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Host "Installed daily task: $taskName (3:30 AM)"

if ($RunNow) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script
  if ($LASTEXITCODE -ne 0) { throw "Initial backup failed with exit code $LASTEXITCODE" }
}
