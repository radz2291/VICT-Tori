param([Parameter(Mandatory)][string]$Source)
$ErrorActionPreference='Stop'
$sourcePath=(Resolve-Path -LiteralPath $Source).Path
$pin='6b420a3e9eada6f694cc2550debda7753316b5b3'
if ((git -C $sourcePath rev-parse HEAD) -ne $pin) { throw "Use a separate VICT checkout at $pin." }
git -C $sourcePath diff --quiet HEAD -- packages
if ($LASTEXITCODE -ne 0) { throw 'VICT tracked package files differ from the pin.' }
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$packDir=Join-Path $root 'packs'
New-Item -ItemType Directory -Force -Path $packDir | Out-Null
$package=Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json -AsHashtable
foreach($entry in $package.dependencies.GetEnumerator()) {
  if ($entry.Key -notlike '@victframework/*') { continue }
  $name=$entry.Key.Split('/')[1]
  $packagePath=Join-Path $sourcePath "packages/$name"
  npm.cmd pack $packagePath --pack-destination $packDir --json | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "VICT artifact pack failed: $name. Build the pinned checkout first." }
}
