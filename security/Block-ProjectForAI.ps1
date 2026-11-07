#Requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='High')]
param(
  [Parameter(Mandatory=$true)][string]$AiAccount,
  [string]$ProjectPath = (Get-Location).Path,
  [switch]$Apply
)
$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath $ProjectPath).Path
if (-not (Test-Path -LiteralPath (Join-Path $project 'package.json'))) {
  throw 'package.json not found. Pass -ProjectPath pointing to the employees_master root.'
}
$identity = New-Object System.Security.Principal.NTAccount($AiAccount)
$sid = $identity.Translate([System.Security.Principal.SecurityIdentifier]).Value
$current = [System.Security.Principal.WindowsIdentity]::GetCurrent()
if ($current.User.Value -eq $sid -or ($current.Groups | Where-Object { $_.Value -eq $sid })) {
  throw 'Target account is the current user or belongs to its token. Refusing to lock yourself out.'
}
$backup = Join-Path $env:USERPROFILE ('employees_master_acl_backup_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.txt')
Write-Host "Project: $project"
Write-Host "AI identity: $AiAccount ($sid)"
Write-Host 'NOTE: only processes running with this Windows identity are blocked.'
Write-Host 'Workspace AI extensions running as your developer account are NOT blocked.'
if (-not $Apply) {
  Write-Host 'DRY RUN ONLY. Add -Apply to save ACLs and set a deny-read ACE at project root.'
  return
}
if ($PSCmdlet.ShouldProcess($project, "Backup ACLs and deny read for $AiAccount")) {
  # icacls /save takes the directory and writes the ACLs of it and descendants.
  $saveOutput = & icacls.exe $project /save $backup /T /C 2>&1
  if ($LASTEXITCODE -ne 0) { throw "ACL backup failed: $saveOutput" }
  # Deny read-and-execute (RX) inherited by subfolders/files; no changes to developer identity.
  $denyRule = "*${sid}:(OI)(CI)(RX)"
  $result = & icacls.exe $project /deny $denyRule 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Could not apply ACL: $result" }
  Write-Host "DENY added. Backup: $backup"
  Write-Host 'Test from the restricted account using Test-ProjectRead.ps1.'
}
