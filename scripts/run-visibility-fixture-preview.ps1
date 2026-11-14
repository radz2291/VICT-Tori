param([switch]$Restart, [ValidateRange(1024,65535)][int]$Port=48902)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$data=Join-Path $root ".data/run-visibility-fixture-$Port"
$local=Join-Path $root '.local'
$vite=Join-Path $root 'node_modules/vite/bin/vite.js'
$fixture='./tests/a1-provider-fixture.mjs'
New-Item -ItemType Directory -Force -Path $local | Out-Null
$pidFile=Join-Path $local "run-visibility-fixture-$Port.pid"
$url="http://127.0.0.1:$Port"
if(Test-Path -LiteralPath $pidFile){
  $studioId=0
  if([int]::TryParse((Get-Content -Raw -LiteralPath $pidFile).Trim(),[ref]$studioId)){
    $process=Get-CimInstance Win32_Process -Filter "ProcessId=$studioId"
    if($process -and $process.CommandLine -and $process.CommandLine.Contains($vite) -and $process.CommandLine -match " --port $Port "){
      if(!$Restart){Write-Output $url;return}
      Stop-Process -Id $studioId
      Wait-Process -Id $studioId -Timeout 15 -ErrorAction SilentlyContinue
    }
  }
}
$node=(Get-Command node -ErrorAction Stop).Source
if(!(Test-Path -LiteralPath (Join-Path $data 'studio.sqlite'))){
  Push-Location $root
  try { & $node scripts/seed-run-visibility-fixture.mjs $data; if($LASTEXITCODE -ne 0){throw 'Fixture seeding failed.'} }
  finally { Pop-Location }
}
$env:TORI_DATA_DIR=$data
$env:TORI_ZAI_ROUTE='coding'
$env:TORI_ENABLE_PI_ZAI='0'
$env:TORI_EXECUTION_FIXTURE='a1-request-capture'
$env:TORI_ZAI_API_KEY='synthetic-a1-fixture'
$arguments='--import "'+$fixture+'" "'+$vite+'" --host 127.0.0.1 --port '+$Port+' --strictPort'
$studio=Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $local "run-visibility-fixture-$Port.out.log") -RedirectStandardError (Join-Path $local "run-visibility-fixture-$Port.err.log") -PassThru
Set-Content -LiteralPath $pidFile -Value $studio.Id
for($i=0;$i -lt 60;$i++){
  if($studio.HasExited){throw 'Fixture Studio failed to start.'}
  try{$healthy=Invoke-RestMethod -Uri "$url/api/studio" -TimeoutSec 2;if($healthy.fixture){Write-Output $url;return}}catch{Start-Sleep -Milliseconds 500}
}
throw 'The fixture preview did not become ready.'
