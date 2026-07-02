param(
    [string]$SourceFile = "src/data/humanoidEnemyVoiceLines.ts",
    [string]$VoicesDir = "C:\Users\myfav\Documents\VScode\tools\Irodori-TTS-Server\voices",
    [string]$DesignFile = "docs/humanoid-enemy-voice-quality-design.md",
    [switch]$Force,
    [switch]$Fast,
    [switch]$DryRun,
    [string]$Only = ""
)

$ErrorActionPreference = "Stop"

$argsList = @(
    "scripts/create-enemy-reference-voices-irodori.py",
    "--source=$SourceFile",
    "--voices-dir=$VoicesDir",
    "--design=$DesignFile"
)

if ($Force) { $argsList += "--force" }
if ($Fast) { $argsList += "--fast" }
if ($DryRun) { $argsList += "--dry-run" }
if ($Only) { $argsList += "--only=$Only" }

python @argsList
