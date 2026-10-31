#Requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='High')]
param(
  [Parameter(Mandatory=$true)][string]$AiAccount,
  [string]$ProjectPath = (Get-Location).Path,
  [switch]$Apply
)
$ErrorActionPreference='Stop'
$project=(Resolve-Path -LiteralPath $ProjectPath).Path
$sid=(New-Object System.Security.Principal.NTAccount($AiAccount)).Translate([System.Security.Principal.SecurityIdentifier]).Value
Write-Host "Project: $project, SID: $sid"
if (-not $Apply) { Write-Host 'DRY RUN. Add -Apply to remove DENY entries for this SID.'; return }
if ($PSCmdlet.ShouldProcess($project, 'Remove deny rules for AI account')) {
  $output = & icacls.exe $project /remove:d "*$sid" /T /C 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Removal returned error: $output" }
  Write-Host 'Deny entries removed. Existing allow ACLs were not restored or changed.'
}
