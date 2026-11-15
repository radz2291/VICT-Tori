import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = await mkdtemp(join(resolve(process.env.TORI_FOUNDATION_EVIDENCE ?? tmpdir()), 'tori-foundation-consumers-'));
const archives = join(output, 'archives');
const npm = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const result = {node: process.version, output, artifacts: {}, consumers: []};

async function run(cwd, label, executable, args) {
  const log = join(cwd, label+'.log');
  const command = JSON.stringify([executable, ...args]);
  const {status, signal, stdout, stderr, error} = spawnSync(executable, args, {cwd, encoding: 'utf8', windowsHide: true});
  await writeFile(log, [command, 'Exit '+status, stdout, stderr, error?.message].filter(line => line !== undefined).join('\n'));
  if (error) throw error;
  assert.equal(status, 0, label+' failed ('+(signal ?? status)+'). See '+log);
  return stdout;
}

console.log(output);
await mkdir(archives);
result.npm = (await run(output, 'npm-version', process.execPath, [npm, '--version'])).trim();

for (const name of ['authoring', 'memory', 'directive']) {
  const [pack] = JSON.parse(await run(output, 'pack-'+name, process.execPath, [
    npm, 'pack', join(root, 'packages', name), '--pack-destination', archives, '--offline', '--ignore-scripts', '--json',
  ]));
  assert.equal(pack.name, '@tori/'+name);
  result.artifacts[pack.name] = {
    file: pack.filename,
    version: pack.version,
    sha256: sha256(await readFile(join(archives, pack.filename))),
    integrity: pack.integrity,
  };
}

const cases = [
  {name: 'authoring', source: 'authoring-foundation/consumer', entry: 'consumer.mjs'},
  {name: 'memory', source: 'v1c-memory/consumer', entry: 'consumer.mjs'},
  {name: 'directive', source: 'directive-foundation', entry: 'installed-consumer.mjs'},
];
for (const {name, source, entry} of cases) {
  const cwd = join(output, name);
  const packs = join(cwd, 'packs');
  await mkdir(packs, {recursive: true});
  const from = join(root, 'docs/evidence', source);
  const manifest = await readJson(join(from, 'package.json'));
  await copyFile(join(from, 'package.json'), join(cwd, 'package.json'));
  await copyFile(join(from, entry), join(cwd, entry));

  for (const [dependency, reference] of Object.entries(manifest.dependencies)) {
    if (!reference.startsWith('file:packs/')) continue;
    const file = reference.slice('file:packs/'.length);
    const isVict = dependency.startsWith('@victframework/');
    const archive = join(isVict ? join(root, 'packs') : archives, file);
    const bytes = await readFile(archive);
    const integrity = 'sha512-'+createHash('sha512').update(bytes).digest('base64');
    assert.equal(integrity, isVict ? lock.packages['node_modules/'+dependency]?.integrity : result.artifacts[dependency]?.integrity);
    await copyFile(archive, join(packs, file));
  }

  // Keep the reviewed resolutions while the consumer supplies its own entry points.
  const seed = structuredClone(lock);
  seed.name = manifest.name;
  delete seed.version;
  seed.packages[''] = {name: manifest.name, dependencies: manifest.dependencies};
  for (const [dependency, reference] of Object.entries(manifest.dependencies)) {
    const artifact = result.artifacts[dependency];
    if (!artifact) continue;
    const packageManifest = await readJson(join(root, 'packages', dependency.split('/')[1], 'package.json'));
    seed.packages['node_modules/'+dependency] = {
      version: artifact.version,
      resolved: reference,
      integrity: artifact.integrity,
      ...(packageManifest.dependencies ? {dependencies: packageManifest.dependencies} : {}),
    };
  }
  await writeFile(join(cwd, 'package-lock.json'), JSON.stringify(seed, null, 2)+'\n');
  await run(cwd, 'npm-lock', process.execPath, [npm, 'install', '--package-lock-only', '--offline', '--ignore-scripts', '--no-audit', '--no-fund']);
  await run(cwd, 'npm-ci', process.execPath, [npm, 'ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund']);
  await run(cwd, 'npm-ls', process.execPath, [npm, 'ls', '--all']);
  const installed = await readJson(join(cwd, 'package-lock.json'));
  for (const [dependency, reference] of Object.entries(manifest.dependencies)) {
    if (!reference.startsWith('file:packs/')) continue;
    const actual = installed.packages['node_modules/'+dependency];
    const expected = dependency.startsWith('@victframework/') ? lock.packages['node_modules/'+dependency] : result.artifacts[dependency];
    assert.equal(actual.integrity, expected.integrity);
    assert.equal(actual.resolved, reference);
  }
  const stdout = await run(cwd, 'proof', process.execPath, [entry]);
  result.consumers.push({
    name,
    lockSha256: sha256(await readFile(join(cwd, 'package-lock.json'))),
    proof: JSON.parse(stdout),
  });
  await writeFile(join(output, 'results.json'), JSON.stringify(result, null, 2)+'\n');
}
console.log(JSON.stringify(result));
