// Compare the two installed public package surfaces without altering either install.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, realpath, lstat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join, resolve, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const [reviewedArg, packedArg] = process.argv.slice(2);
assert.ok(reviewedArg && packedArg, 'Usage: node scripts/probe-exchange-pins.mjs REVIEWED_INSTALL VICT005_PACKED');
assert.equal(process.platform, 'win32');
assert.equal(process.version, 'v22.13.1');
const [reviewed, packed] = await Promise.all([realpath(resolve(reviewedArg)),realpath(resolve(packedArg))]);
const verifiedCommit = '2ebac8f0e20c19c5731766d0021b0f33ff1ec249';
const version = '0.4.0-rc.1';
const readJson = async path => JSON.parse(await readFile(path,'utf8'));
const hash = (bytes, algo, format='hex') => createHash(algo).update(bytes).digest(format);
const packageName = name => '@victframework/'+name;
const manifest = await readJson(join(packed,'manifest.json'));
const lock = await readJson(join(reviewed,'package-lock.json'));
assert.equal(manifest.candidate,verifiedCommit);
assert.equal(manifest.node,process.version);

async function publicModule(root,name) {
  const specifier = packageName(name);
  const directory = join(root,'node_modules','@victframework',name);
  const manifest = await readJson(join(directory,'package.json'));
  const file = await realpath(createRequire(join(root,'package.json')).resolve(specifier));
  assert.ok(file.startsWith(directory+sep),specifier+' resolved outside the installed package');
  assert.equal((await lstat(directory)).isSymbolicLink(),false);
  assert.equal(manifest.name,specifier);
  assert.equal(manifest.version,version);
  return import(pathToFileURL(file).href);
}

const diffs = [];
for (const name of ['contracts','control','kernel','mastra','runtime','sdk','store-sqlite','ui']) {
  const filename = 'victframework-'+name+'-'+version+'.tgz';
  const pin = lock.packages['node_modules/'+packageName(name)];
  const existing = await readFile(join(reviewed,'packs',filename));
  const verified = await readFile(join(packed,'archives',filename));
  assert.equal('sha512-'+hash(existing,'sha512','base64'),pin.integrity,filename+' TORI lock');
  assert.equal(hash(verified,'sha512'),manifest.files.find(file=>file.name===filename)?.sha512,filename+' VICT-005 manifest');
  const reviewedExports=(await readJson(join(reviewed,'node_modules',packageName(name),'package.json'))).exports;
  const verifiedExports=(await readJson(join(packed,'consumer','node_modules',packageName(name),'package.json'))).exports;
  const lostPublicSubpaths=Object.keys(reviewedExports??{}).filter(key=>!Object.hasOwn(verifiedExports??{},key));
  diffs.push({name,reviewedSha256:hash(existing,'sha256'),verifiedSha256:hash(verified,'sha256'),
    sameBytes:existing.equals(verified),lostPublicSubpaths});
}
assert.ok(diffs.find(item=>item.name==='control').lostPublicSubpaths.includes('./draft-authoring'));
assert.ok(diffs.find(item=>item.name==='contracts').lostPublicSubpaths.includes('./sha256'));

const proof = join(packed,'consumer');
const [oldMastra,newMastra,oldSqlite,newSqlite,newRuntime] = await Promise.all([
  publicModule(reviewed,'mastra'),publicModule(proof,'mastra'),
  publicModule(reviewed,'store-sqlite'),publicModule(proof,'store-sqlite'),
  publicModule(proof,'runtime'),
]);
assert.equal(typeof oldMastra.createMastraAgentExchange,'undefined');
assert.equal(typeof oldSqlite.createSqliteAgentExchangeStore,'undefined');
assert.equal(typeof newMastra.createMastraAgentExchange,'function');
assert.equal(typeof newMastra.composeMastraTurnExecutor,'function');
assert.equal(typeof newMastra.AGENT_EXCHANGE_ASK_CAPABILITY,'string');
assert.equal(newMastra.MASTRA_EXCHANGE_ADAPTER_COMPATIBILITY.revision,'7');
assert.equal(typeof newSqlite.createSqliteAgentExchangeStore,'function');
assert.equal(typeof newRuntime.validateAgentExchangeReceipt,'function');
assert.equal((await readJson(join(proof,'node_modules','@mastra','core','package.json'))).version,'1.64.0');
assert.equal((await readJson(join(reviewed,'node_modules','@mastra','core','package.json'))).version,'1.64.0');

console.log(JSON.stringify({check:'TORI-016 public pin preflight',result:'PASS',node:process.version,verifiedCommit,
  reviewedExportsExchange:false,verifiedExportsExchange:true,directToriUpgrade:'INCOMPATIBLE',
  compatibility:newMastra.MASTRA_EXCHANGE_ADAPTER_COMPATIBILITY,diffs},null,2));
