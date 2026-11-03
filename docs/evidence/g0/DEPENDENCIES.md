# G0 VICT package consumer proof

The isolated Windows checkout was clean at VICT commit `6b420a3e9eada6f694cc2550debda7753316b5b3`. Its release workflow selects Node 24 and pins npm 11.19.1. This run used Node 24.15.0 and npm 11.19.1. The source lockfile pins Svelte 5.57.0, TypeScript 6.0.3, Vite 6.4.3 and the Vite Svelte plugin 5.1.1.

From PowerShell, with `$source` set to an isolated checkout at that commit, use the following commands from the TORI root.

```powershell
$toolchain = Join-Path $env:TEMP 'tori-node-24.15.0'
npm install --prefix $toolchain node@24.15.0 npm@11.19.1 --no-audit --no-fund
$env:Path = "$toolchain/node_modules/node/bin;$env:Path"
$npmCli = "$toolchain/node_modules/npm/bin/npm-cli.js"
node --version
node $npmCli --version
Push-Location $source
node $npmCli ci --no-audit --no-fund
node $npmCli run build
Pop-Location
./scripts/verify-vict-consumer.ps1 -Source $source -NpmCli $npmCli
```

The source install added 719 packages and the full root build exited 0. The probe packed 11 VICT packages with `npm pack --json` and installed the tarballs as direct file dependencies into a new temporary directory. `npm install --strict-peer-deps --no-audit --no-fund` added 242 packages. `npm ls --depth=0` listed all 11 VICT packages at 0.4.0-rc.1. Vite transformed 1,921 modules and exited 0 on the public import entry. The consumer build used neither VICT workspace symlinks nor source aliases.

See the [artifact identities](vict-artifacts.json) and [observed consumer lockfile](consumer-package-lock.json). The npm registry returned 404 for the Flow package, so the proof uses local tarballs. The first probe attempt failed in PowerShell `ConvertFrom-Json` because the npm lockfile has an empty root-package key. Reading it with `-AsHashtable` resolved the failure. The source build reported upstream Svelte warnings, and Vite reported chunks larger than 500 kB.

This evidence covers the package build and public import compilation. Studio editing, persistence, native interaction, and U0 acceptance require separate evidence.
