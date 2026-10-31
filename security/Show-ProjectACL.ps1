param([string]$ProjectPath=(Get-Location).Path)
$project=(Resolve-Path -LiteralPath $ProjectPath).Path
& icacls.exe $project
