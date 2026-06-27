param(
  [string]$DialogueFile = "src\data\magicFriendshipEndingDialogue.ts",
  [string]$OutputRoot = "public\sfx\magic-event-voices"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Speech

$source = Get-Content -Raw -Encoding UTF8 -LiteralPath $DialogueFile
$pattern = "speakerId:\s*'([^']+)'\s*,\s*lineId:\s*'([^']+)'\s*,\s*text:\s*'([^']*)'"
$matches = [regex]::Matches($source, $pattern)

if ($matches.Count -eq 0) {
  throw "No friendship voice lines found in $DialogueFile"
}

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() |
  Where-Object { $_.VoiceInfo.Culture.Name -eq "ja-JP" } |
  Select-Object -First 1

if (-not $voice) {
  throw "No ja-JP speech synthesis voice is installed."
}

$synth.SelectVoice($voice.VoiceInfo.Name)
$synth.Rate = 0
$synth.Volume = 100

$generated = 0
$skipped = 0

foreach ($match in $matches) {
  $speakerId = $match.Groups[1].Value.ToUpperInvariant()
  $lineId = $match.Groups[2].Value.ToLowerInvariant()
  $text = $match.Groups[3].Value

  $speakText = $text
  $quoteMatch = [regex]::Match($text, "^([^\u300c]+)\u300c(.+)\u300d$")
  if ($quoteMatch.Success) {
    $speakText = $quoteMatch.Groups[2].Value
  }

  $speakerDir = Join-Path $OutputRoot $speakerId
  if (-not (Test-Path -LiteralPath $speakerDir)) {
    New-Item -ItemType Directory -Force -Path $speakerDir | Out-Null
  }

  $wavPath = Join-Path $speakerDir "$lineId.wav"
  if (Test-Path -LiteralPath $wavPath) {
    $skipped++
    continue
  }

  $synth.SetOutputToWaveFile($wavPath)
  $synth.Speak($speakText)
  $synth.SetOutputToNull()
  $generated++
}

$synth.Dispose()

$converted = 0
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
  $resolvedRoot = (Resolve-Path -LiteralPath $OutputRoot).Path
  $env:MAGIC_FRIENDSHIP_VOICE_ROOT = $resolvedRoot
  $convertResult = @'
import os
from pathlib import Path

try:
    import soundfile as sf
except Exception:
    print("ogg conversion skipped: Python soundfile is not installed")
    raise SystemExit(0)

root = Path(os.environ["MAGIC_FRIENDSHIP_VOICE_ROOT"])
converted = 0
for wav in root.glob("*/friendship-*.wav"):
    ogg = wav.with_suffix(".ogg")
    if ogg.exists():
        continue
    data, sample_rate = sf.read(str(wav), dtype="float32")
    sf.write(str(ogg), data, sample_rate, format="OGG", subtype="VORBIS")
    converted += 1
print(f"ogg conversion generated: {converted}")
'@ | python -

  $convertedLine = $convertResult | Select-String -Pattern "ogg conversion generated: (\d+)" | Select-Object -Last 1
  if ($convertedLine -and $convertedLine.Matches.Count -gt 0) {
    $converted = [int]$convertedLine.Matches[0].Groups[1].Value
  }
  $convertResult | ForEach-Object { Write-Host $_ }
}

Write-Host "Magic friendship voices wav generated: $generated, wav skipped: $skipped, ogg generated: $converted, total lines: $($matches.Count)"
