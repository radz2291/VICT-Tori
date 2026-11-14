param(
  [Parameter(Mandatory)] [string]$Node,
  [Parameter(Mandatory)] [string]$Playwright,
  [Parameter(Mandatory)] [string]$Evidence
)
$ErrorActionPreference = 'Stop'
$expected = 'f302de96b96ede5eb158f4ce779801e955a8f69f'
if ((git rev-parse HEAD) -ne $expected) { throw 'Use the exact candidate in a fresh detached worktree.' }
if ((git rev-parse HEAD:package-lock.json) -ne '746b69fbefb4a9123029f54ab4ca47a00aaa5310') { throw 'Unexpected lock.' }
if (Test-Path -LiteralPath node_modules) { throw 'Use a fresh worktree with the verified packs staged.' }
if (Test-Path -LiteralPath $Evidence) { throw 'Use a fresh evidence directory.' }
$Node = (Resolve-Path -LiteralPath $Node).Path
$toolchain = Split-Path $Node -Parent
$npm = Join-Path $toolchain 'node_modules/npm/bin/npm-cli.js'
if ((& $Node --version) -ne 'v22.13.1' -or (& $Node $npm --version) -ne '11.19.1') { throw 'Unexpected Node or adjacent npm.' }
$env:PATH = "$toolchain;$env:PATH"
$env:TORI_PLAYWRIGHT_MODULE = (Resolve-Path -LiteralPath $Playwright).Path
$env:TORI_RV_QUALIFICATION = $Evidence
New-Item -ItemType Directory -Path $Evidence | Out-Null
& $Node $npm ci --no-audit --no-fund *> (Join-Path $Evidence 'npm-ci.log')
if ($LASTEXITCODE) { exit $LASTEXITCODE }
& $Node scripts/qualify-run-visibility.mjs | Tee-Object -FilePath (Join-Path $Evidence 'driver.log')
$driverExit = $LASTEXITCODE
& $Node (Join-Path $PSScriptRoot 'independent-replay.mjs') *> (Join-Path $Evidence 'independent-replay.log')
$replayExit = $LASTEXITCODE
$env:TORI_RV_RECEIPT_PORT = '48922'
$env:TORI_RV_RECEIPT_EVIDENCE = Join-Path $Evidence 'receipt-browser'
& $Node tests/run-visibility-receipt-browser.mjs *> (Join-Path $Evidence 'receipt-browser.log')
$receiptExit = $LASTEXITCODE
if ($driverExit -or $replayExit -or $receiptExit) { exit 1 }
