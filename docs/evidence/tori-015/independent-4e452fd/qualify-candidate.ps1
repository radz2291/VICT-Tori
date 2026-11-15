param(
  [Parameter(Mandatory)] [string]$Candidate,
  [Parameter(Mandatory)] [string]$Evidence,
  [Parameter(Mandatory)] [string]$Toolchain,
  [Parameter(Mandatory)] [string]$Playwright,
  [Parameter(Mandatory)] [string]$ReplayProbe,
  [Parameter(Mandatory)] [string]$DeadlineProbe,
  [Parameter(Mandatory)] [string]$VictSource,
  [string]$VictCommit = 'cfa3cb9f009b55a551f0dce7c0e5c762a46e7106'
)
$ErrorActionPreference='Stop'
if ((git rev-parse HEAD) -ne $Candidate) { throw 'Unexpected checkout.' }
if (@(git status --porcelain).Count) { throw 'Tracked checkout must be clean.' }
if (Test-Path -LiteralPath $Evidence) { throw 'Use a new evidence directory.' }
if (!(Test-Path -LiteralPath node_modules)) { throw 'Install candidate with pinned npm ci before starting the driver.' }
$node=Join-Path $Toolchain 'node.exe'
$npm=Join-Path $Toolchain 'node_modules/npm/bin/npm-cli.js'
if ((& $node --version) -ne 'v22.13.1' -or (& $node $npm --version) -ne '11.19.1') { throw 'Unexpected toolchain.' }
if ((Get-Content -Raw (Join-Path $Playwright 'package.json') | ConvertFrom-Json).version -ne '1.63.0') { throw 'Unexpected Playwright.' }
New-Item -ItemType Directory -Path $Evidence | Out-Null
$Evidence=(Resolve-Path -LiteralPath $Evidence).Path
$env:Path="$Toolchain;$env:Path"
$env:TORI_PLAYWRIGHT_MODULE=$Playwright
$env:TORI_RV_QUALIFICATION=$Evidence
$env:TORI_FOUNDATION_EVIDENCE=$Evidence
$env:TORI_RV_RECEIPT_PORT='48967'
$env:TORI_RV_RECEIPT_EVIDENCE=Join-Path $Evidence 'receipt-browser'
$env:VICT_TURN_PROOF_PORT='48968'
$env:npm_config_offline='true'
$steps=[System.Collections.Generic.List[object]]::new()
function Invoke-Check([string]$Name,[string[]]$Command) {
  Write-Output "Running $Name on $Candidate"
  $started=Get-Date -Format o
  & $node @Command *> (Join-Path $Evidence ($Name+'.log'))
  $code=$LASTEXITCODE
  $steps.Add([ordered]@{name=$Name;args=@($Command);started=$started;ended=(Get-Date -Format o);exit=$code})
  [ordered]@{candidate=$Candidate;lock=(git rev-parse HEAD:package-lock.json);checks=$steps.ToArray()} |
    ConvertTo-Json -Depth 6 | Set-Content (Join-Path $Evidence 'independent-steps.json')
  Write-Output "$Name exit $code"
}
Invoke-Check -Name 'deadline-challenge' -Command @($DeadlineProbe,(Join-Path $Evidence 'deadline-challenge.json'))
Invoke-Check -Name 'driver' -Command @('scripts/qualify-run-visibility.mjs','memory','visibility','directive','a1a4','v1b','authoring','assembly','background','unit','build','consumer')
Invoke-Check -Name 'independent-replay' -Command @($ReplayProbe)
Invoke-Check -Name 'receipt-browser' -Command @('tests/run-visibility-receipt-browser.mjs')
Invoke-Check -Name 'foundation-consumers' -Command @('scripts/probe-foundation-consumers.mjs')
if ((git -C $VictSource rev-parse HEAD) -ne $VictCommit) { throw 'Unexpected VICT proof fixture revision.' }
$fixture=Join-Path (Get-Location) ('.local/independent-vict-proof-'+$Candidate.Substring(0,8))
New-Item -ItemType Directory -Path $fixture | Out-Null
Copy-Item -Path (Join-Path $VictSource 'scripts/fixtures/tori-turn-composition/*') -Destination $fixture
New-Item -ItemType Junction -Path (Join-Path $fixture 'node_modules') -Target (Join-Path (Get-Location) 'node_modules') | Out-Null
Push-Location -LiteralPath $fixture
try {
  Invoke-Check -Name 'packed-vict-browser' -Command @('browser.mjs')
} finally {
  Pop-Location
}
if (@(git status --porcelain).Count) { throw 'Tracked checkout changed during qualification.' }
if (@($steps | Where-Object exit -ne 0).Count) { exit 1 }
