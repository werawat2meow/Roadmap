#Requires -Version 5.1
param([string]$ProjectPath = (Get-Location).Path)
$ErrorActionPreference = 'Stop'
$target=(Resolve-Path -LiteralPath $ProjectPath).Path
Write-Host ('Current Windows identity: ' + [System.Security.Principal.WindowsIdentity]::GetCurrent().Name)
try {
  $list = [System.IO.Directory]::EnumerateFileSystemEntries($target).GetEnumerator()
  try { [void]$list.MoveNext() } finally { $list.Dispose() }
  Write-Host 'READ ALLOWED: Listing succeeded.'
  exit 1
} catch [System.UnauthorizedAccessException] {
  Write-Host 'ACCESS DENIED (PASS): Account cannot list the project.'
  exit 0
} catch {
  Write-Host "TEST INCONCLUSIVE: $($_.Exception.Message)"
  exit 2
}
