param(
    [Parameter(Mandatory)][string]$Source,
    [Parameter(Mandatory)][string]$NpmCli
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
$Source = (Resolve-Path -LiteralPath $Source).Path
$pin = '6b420a3e9eada6f694cc2550debda7753316b5b3'
if ((git -C $Source rev-parse HEAD) -ne $pin -or (git -C $Source status --porcelain --untracked-files=no)) {
    throw "Expected clean VICT source at $pin"
}

$consumer = Join-Path ([IO.Path]::GetTempPath()) ("tori-consumer-" + [guid]::NewGuid())
$packs = New-Item -ItemType Directory -Path (Join-Path $consumer 'packs') -Force
$names = 'contracts', 'ui', 'sdk', 'application', 'ui-svelte', 'ui-media-svelte',
    'ui-editor', 'ui-flow-svelte', 'ui-structure-svelte', 'ui-ai-svelte', 'ui-patterns-svelte'
$dependencies = [ordered]@{}
$manifest = foreach ($name in $names) {
    $pack = (node $NpmCli pack (Join-Path $Source "packages/$name") --json --pack-destination $packs.FullName |
        Out-String | ConvertFrom-Json)[0]
    $dependencies[$pack.name] = "file:packs/$($pack.filename)"
    [ordered]@{
        name = $pack.name
        version = $pack.version
        filename = $pack.filename
        integrity = $pack.integrity
        sha256 = (Get-FileHash (Join-Path $packs.FullName $pack.filename)).Hash.ToLowerInvariant()
    }
}
$manifest | ConvertTo-Json | Set-Content (Join-Path $consumer 'artifacts.json')
$lock = Get-Content (Join-Path $Source 'package-lock.json') -Raw | ConvertFrom-Json -AsHashtable
foreach ($name in 'svelte', 'vite', '@sveltejs/vite-plugin-svelte', 'zod') {
    $dependencies[$name] = $lock.packages."node_modules/$name".version
}
Push-Location $consumer
try {
    @{name = 'tori-vict-consumer'; private = $true; type = 'module'; dependencies = $dependencies} |
        ConvertTo-Json | Set-Content package.json
    @'
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({ plugins: [svelte()] });
'@ | Set-Content vite.config.js
    '<!doctype html><html lang="en"><title>TORI VICT consumer</title><script type="module" src="/main.js"></script></html>' |
        Set-Content index.html
    @'
import { GraphWorkspaceV3, GraphPortRow, GraphEdgeSettings } from '@victframework/ui-flow-svelte';
import { StructureExplorer, StructureSourceNode, StructureRelationEdge } from '@victframework/ui-structure-svelte';
import { EditorBridge, Inspector, HistoryPanel, createLocalStorageDocumentStore } from '@victframework/ui-editor';
import { Conversation, Trace, Markdown, Patterns } from '@victframework/ui-ai-svelte';
import { AssetProvider, MediaImage } from '@victframework/ui-media-svelte';
import * as controls from '@victframework/ui-svelte/controls';
import * as dialog from '@victframework/ui-svelte/catalog/dialog';
import * as composition from '@victframework/ui-patterns-svelte';
import '@victframework/ui-svelte/styles.css';
import '@victframework/ui-flow-svelte/styles.css';
import '@victframework/ui-structure-svelte/styles.css';
import '@victframework/ui-ai-svelte/styles.css';

const imports = {
    GraphWorkspaceV3, GraphPortRow, GraphEdgeSettings, StructureExplorer,
    StructureSourceNode, StructureRelationEdge, EditorBridge, Inspector, HistoryPanel,
    createLocalStorageDocumentStore, Conversation, Trace, Markdown, Patterns,
    AssetProvider, MediaImage, controls, dialog, composition,
};
for (const [name, value] of Object.entries(imports)) {
    if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
        throw new Error(`Missing public export: ${name}`);
    }
}
document.body.textContent = `VICT public imports loaded (${Object.keys(imports).length})`;
'@ | Set-Content main.js
    Write-Host "Consumer directory $consumer"
    node $NpmCli install --strict-peer-deps --no-audit --no-fund
    node $NpmCli ls --depth=0
    node node_modules/vite/bin/vite.js build
}
finally {
    Pop-Location
}
