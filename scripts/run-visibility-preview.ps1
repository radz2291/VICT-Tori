param([switch]$Restart, [ValidateRange(1024,65535)][int]$Port=48901)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$data=Join-Path $root ".data/run-visibility-preview-$Port"
$local=Join-Path $root '.local'
$vite=Join-Path $root 'node_modules/vite/bin/vite.js'
if(!(Test-Path -LiteralPath $vite)){throw 'Install the pinned Studio dependencies before launching this preview.'}
New-Item -ItemType Directory -Force -Path $data,$local | Out-Null
$pidFile=Join-Path $local "run-visibility-preview-$Port.pid"
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
$env:TORI_DATA_DIR=$data
$env:TORI_ZAI_ROUTE='coding'
$env:TORI_ENABLE_PI_ZAI='1'
$env:TORI_EXECUTION_FIXTURE=''
$env:TORI_ZAI_API_KEY=''
$node=(Get-Command node -ErrorAction Stop).Source
$studio=Start-Process -FilePath $node -ArgumentList ('"'+$vite+'" --host 127.0.0.1 --port '+$Port+' --strictPort') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $local "run-visibility-preview-$Port.out.log") -RedirectStandardError (Join-Path $local "run-visibility-preview-$Port.err.log") -PassThru
Set-Content -LiteralPath $pidFile -Value $studio.Id
$healthy=$null
for($i=0;$i -lt 60;$i++){
  if($studio.HasExited){throw 'Studio failed to start on the selected port. See its local preview log.'}
  try{$healthy=Invoke-RestMethod -Uri "$url/api/studio" -TimeoutSec 2;break}catch{Start-Sleep -Milliseconds 500}
}
if(!$healthy){throw 'The Studio preview did not become ready.'}
if(!$healthy.provider){throw 'Studio is running, but the approved local Coding credential is unavailable.'}
Write-Output $url
