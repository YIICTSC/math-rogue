$ErrorActionPreference = 'Stop'

$repo = 'C:\Users\myfav\Documents\VScode\_math-rogue-main-upload'
$defaultPort = 5173
$ports = $defaultPort..5180
$logPath = Join-Path $repo 'tmp\local-learning-rogue-launch.log'

function Show-LaunchError {
  param([string]$Message)

  try {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show(
      "$Message`n`nDetails: $logPath",
      'Learning Rogue local launch error',
      'OK',
      'Error'
    ) | Out-Null
  } catch {
    Write-Error $Message
  }
}

function Get-LearningRoguePort {
  $listeningPorts = @(Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty LocalPort -Unique)
  foreach ($candidatePort in $listeningPorts) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$candidatePort/" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ne 200 -or $response.Content -notmatch 'id="root"') {
        continue
      }

      # A plain Vite server also serves the title page, but it does not expose
      # the local debug features. Do not mistake it for the debug server.
      $runtimeResponse = Invoke-WebRequest -Uri "http://127.0.0.1:$candidatePort/src/config/runtime.ts" -UseBasicParsing -TimeoutSec 2
      if ($runtimeResponse.StatusCode -eq 200 -and $runtimeResponse.Content -match '"VITE_ENABLE_DEBUG_FEATURES"\s*:\s*"true"') {
        return $candidatePort
      }
    } catch {
      continue
    }
  }
  return $null
}

function Stop-ExistingLearningRogueVite {
  $connections = @(Get-NetTCPConnection -State Listen -LocalPort $defaultPort -ErrorAction SilentlyContinue)
  foreach ($connection in $connections) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
    if ($process -and $process.CommandLine -match [regex]::Escape($repo) -and $process.CommandLine -match 'vite') {
      Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 300
    }
  }
}

try {
  if (-not (Test-Path -LiteralPath $repo -PathType Container)) {
    throw "Repository not found: $repo"
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $logPath) | Out-Null
  "[$(Get-Date -Format s)] local launcher started" | Set-Content -LiteralPath $logPath -Encoding UTF8

  $port = Get-LearningRoguePort
  if (-not $port) {
    Stop-ExistingLearningRogueVite
    $viteCommand = Join-Path $repo 'node_modules\.bin\vite.cmd'
    if (-not (Test-Path -LiteralPath $viteCommand -PathType Leaf)) {
      throw "Local Vite executable not found: $viteCommand"
    }

    $env:VITE_ENABLE_DEBUG_FEATURES = 'true'
    "[$(Get-Date -Format s)] starting $viteCommand --host 0.0.0.0 --port $defaultPort with debug features enabled" | Add-Content -LiteralPath $logPath -Encoding UTF8
    $command = "& '$viteCommand' --host 0.0.0.0 --port $defaultPort"
    Start-Process -FilePath (Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe') -WorkingDirectory $repo -ArgumentList @(
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-NoExit',
      '-Command', $command
    ) | Out-Null

    for ($attempt = 0; $attempt -lt 90; $attempt += 1) {
      Start-Sleep -Milliseconds 500
      $port = Get-LearningRoguePort
      if ($port) { break }
    }
  }

  if (-not $port) {
    throw 'The local server did not become ready. Check the PowerShell window for the startup error.'
  }

  "[$(Get-Date -Format s)] server ready on http://127.0.0.1:$port/" | Add-Content -LiteralPath $logPath -Encoding UTF8
  Start-Process "http://127.0.0.1:$port/"
} catch {
  "[$(Get-Date -Format s)] ERROR $($_.Exception.Message)" | Add-Content -LiteralPath $logPath -Encoding UTF8
  Show-LaunchError $_.Exception.Message
}
