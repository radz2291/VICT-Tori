$ErrorActionPreference='Stop'
$record=$env:TORI_VERIFICATION_EVIDENCE
if (!$record) { throw 'Set TORI_VERIFICATION_EVIDENCE to an evidence directory' }
if (!$env:TORI_PLAYWRIGHT_MODULE) { throw 'Set TORI_PLAYWRIGHT_MODULE to Playwright Core 1.63.0' }
$lock=(git rev-parse HEAD:package-lock.json).Trim()
if($lock -ne '746b69fbefb4a9123029f54ab4ca47a00aaa5310'){throw 'Unexpected lock'}
node ./scripts/run-visibility-manifest.mjs "$record/manifest.json"
if($LASTEXITCODE){exit $LASTEXITCODE}
$env:TORI_RV_QUALIFICATION=Join-Path $record 'full-configured'
node ./scripts/qualify-run-visibility.mjs
exit $LASTEXITCODE
