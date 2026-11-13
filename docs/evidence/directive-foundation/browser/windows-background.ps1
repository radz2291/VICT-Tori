param([switch]$Restart, [string]$Port = '48935')
$ErrorActionPreference = 'Stop'
if ($Port -ne '48935') { throw 'This harness owns only port 48935.' }
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '../../../..'))
$root = (Get-Location).Path
$url = 'http://127.0.0.1:' + $Port
$env:TORI_T8_BACKGROUND_LABEL ??= 'full'
if ($env:TORI_T8_BACKGROUND_LABEL -notmatch '^[a-z0-9-]+$') { throw 'Invalid fixture evidence label.' }
$state = Join-Path $root ('.local/t8-background-browser-' + $env:TORI_T8_BACKGROUND_LABEL)
[void](New-Item -ItemType Directory -Path $state -Force)
$pidFile = Join-Path $state 'host.pid'
$env:TORI_DATA_DIR = Join-Path $state 'disposable-studio'
$env:TORI_EXECUTION_FIXTURE = 'a1-request-capture'
$env:TORI_ZAI_API_KEY = 'synthetic-a1-fixture'
$env:TORI_ENABLE_PI_ZAI = '0'
$env:TORI_ZAI_ROUTE = 'coding'
$env:TORI_MEMORY_FIXTURE_PRELOAD = '0'
$env:TORI_TEST_HISTORICAL_ACTIVATION = '1'
$env:TORI_BACKGROUND_URL = $url
$env:TORI_BACKGROUND_STEP = 'full'
$env:TORI_BACKGROUND_FIXTURE = '1'
$env:TORI_BACKGROUND_FIXTURE_DB = Join-Path $env:TORI_DATA_DIR 'saved-memory.sqlite'
$env:TORI_BACKGROUND_EVIDENCE = $state
$env:TORI_BACKGROUND_RESTART_SCRIPT = $PSCommandPath
$node = (Get-Command node).Source

function Stop-ProbeHost {
  param([int]$ProbeId)
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProbeId"
  if (!$process -or $process.Name -ne 'node.exe' -or
      !$process.CommandLine.Contains('windows-background-provider.mjs') -or
      !$process.CommandLine.Contains('--port 48935 --strictPort')) {
    throw 'The recorded process is not this isolated fixture host.'
  }
  Stop-Process -Id $ProbeId
  Wait-Process -Id $ProbeId -Timeout 10 -ErrorAction SilentlyContinue
}
function Start-ProbeHost {
  $suffix = if ($Restart) { 'restart' } else { 'first' }
  $viteArguments = '--import ./docs/evidence/directive-foundation/browser/windows-background-provider.mjs ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 48935 --strictPort'
  $app = Start-Process -FilePath $node -WorkingDirectory $root -ArgumentList $viteArguments -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $state "host-$suffix.stdout") -RedirectStandardError (Join-Path $state "host-$suffix.stderr")
  $app.Id | Set-Content $pidFile
  for ($i=0; $i -lt 300; $i++) {
    if ($app.HasExited) { throw "Isolated fixture host exited with code $($app.ExitCode)." }
    try {
      $ready = Invoke-RestMethod "$url/api/studio" -TimeoutSec 2
      if ($ready.fixture -eq 'a1-request-capture' -or $ready.fixture -eq $true) {
        Write-Output "Fixture host $suffix ready at $url."
        return
      }
    } catch { Start-Sleep -Milliseconds 200 }
  }
  throw 'Isolated fixture host readiness timed out.'
}

if ($Restart) {
  Stop-ProbeHost ([int](Get-Content $pidFile))
  Start-ProbeHost
  exit 0
}

if (Test-Path -LiteralPath $env:TORI_DATA_DIR) { throw 'Use a fresh disposable fixture directory for this run.' }
$driverExit = 1
try {
  Start-ProbeHost
  & $node scripts/seed-background-preview.mjs $url
  if ($LASTEXITCODE -eq 0) {
    & $node tests/background-browser.mjs
    $driverExit = $LASTEXITCODE
  }
} finally {
  if (Test-Path -LiteralPath $pidFile) {
    $hostPid = [int](Get-Content $pidFile)
    if (Get-Process -Id $hostPid -ErrorAction SilentlyContinue) { Stop-ProbeHost $hostPid }
  }
}
exit $driverExit
