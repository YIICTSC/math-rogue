$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Port = 5173
$Url = "http://localhost:$Port"
$LogDir = Join-Path $ProjectRoot 'logs'
$OutLog = Join-Path $LogDir 'shortcut-devserver.log'
$ErrLog = Join-Path $LogDir 'shortcut-devserver.err.log'

function Test-DevServer {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (-not (Test-DevServer)) {
  $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npm) {
    $npm = Get-Command npm -ErrorAction SilentlyContinue
  }

  if (-not $npm) {
    Add-Content -Path $ErrLog -Value "$(Get-Date -Format s) npm was not found on PATH."
    throw 'npm was not found on PATH.'
  }

  Start-Process -FilePath $npm.Source `
    -ArgumentList 'run dev' `
    -WorkingDirectory $ProjectRoot `
    -WindowStyle Minimized `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog

  $deadline = (Get-Date).AddSeconds(30)
  while ((Get-Date) -lt $deadline) {
    if (Test-DevServer) {
      break
    }
    Start-Sleep -Milliseconds 500
  }
}

Start-Process $Url
