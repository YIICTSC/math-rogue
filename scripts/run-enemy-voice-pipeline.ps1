param(
    [string]$ProjectDir = "C:\Users\myfav\Documents\VScode\学習ローグ",
    [switch]$Force,
    [switch]$Fast
)

$ErrorActionPreference = "Stop"

Set-Location $ProjectDir
$logsDir = Join-Path $ProjectDir "logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$refLog = Join-Path $logsDir "enemy-reference-voices-irodori.log"
$battleLog = Join-Path $logsDir "humanoid-enemy-voices-enemy-speakers.log"

$refArgs = @("scripts/create-enemy-reference-voices-irodori.py")
if ($Force) { $refArgs += "--force" }
if ($Fast) { $refArgs += "--fast" }

$battleArgs = @("scripts/generate-humanoid-enemy-voices-irodori.py")
if ($Force) { $battleArgs += "--force" }
if ($Fast) { $battleArgs += "--fast" }

Write-Host "[pipeline] reference voices -> $refLog"
python -u @refArgs *>> $refLog
if ($LASTEXITCODE -ne 0) {
    throw "reference voice generation failed. See $refLog"
}

Write-Host "[pipeline] battle voices -> $battleLog"
python -u @battleArgs *>> $battleLog
if ($LASTEXITCODE -ne 0) {
    throw "battle voice generation failed. See $battleLog"
}

Write-Host "[pipeline] complete"
