import assert from 'node:assert/strict';
import { readFile,writeFile,mkdtemp,mkdir,readdir } from 'node:fs/promises';
import { dirname,join,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root=fileURLToPath(new URL('..',import.meta.url));
const npm=join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const invoke=(args,cwd)=>execFileSync(process.execPath,[npm,...args],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const lock=JSON.parse(await readFile(join(root,'package-lock.json'),'utf8'));
const archives=[];
for(const file of (await readdir(join(root,'packs'))).filter(x=>x.endsWith('.tgz')).sort()){
  const bytes=await readFile(join(root,'packs',file));
  const name=file.replace(/^victframework-/,'@victframework/').replace(/-0\.4\.0-rc\.1\.tgz$/,'');
  const actual='sha512-'+createHash('sha512').update(bytes).digest('base64');
  assert.equal(actual,lock.packages['node_modules/'+name].integrity,file+' integrity');
  archives.push({file,sha256:createHash('sha256').update(bytes).digest('hex')});
}
assert.equal(archives.length,16);
await mkdir(join(root,'.local'),{recursive:true});
const [packed]=JSON.parse(invoke(['pack','./packages/run-visibility','--pack-destination','.local','--json'],root));
const artifact=join(root,'.local',packed.filename);
const consumer=await mkdtemp(join(tmpdir(),'tori011-installed-consumer-'));
await writeFile(join(consumer,'package.json'),JSON.stringify({private:true,type:'module'}));
invoke(['install','--offline','--ignore-scripts','--no-audit','--no-fund',artifact,join(root,'packs/victframework-contracts-0.4.0-rc.1.tgz')],consumer);
await writeFile(join(consumer,'verify.mjs'),`
import assert from 'node:assert/strict';
import { projectRunReport,capturePublicEvent } from '@tori/run-visibility';
globalThis.fetch=()=>assert.fail('Projection must not call the network');
const receipt=capturePublicEvent({streamId:'consumer-stream',turnId:'consumer-run',threadId:'consumer-thread',actorId:'consumer-actor',agentProfileVersion:'consumer-profile',seq:1,kind:'response.started'});
const report=projectRunReport({run:{id:'consumer-run',status:'running',fixture:'installed-consumer',publicEvents:[receipt]}});
assert.equal(report.schema,'tori.run-report@1');assert.equal(report.state,'Running');assert.equal(report.groups[0].rows.length,1);
assert.match(import.meta.resolve('@tori/run-visibility'),/node_modules/);
assert.doesNotMatch(import.meta.resolve('@tori/run-visibility'),/RV-Runtime/);
console.log(JSON.stringify({schema:report.schema,origin:report.origin,dispatches:0,packageEntry:'node_modules/@tori/run-visibility/index.mjs'}));
`);
const proof=JSON.parse(execFileSync(process.execPath,['verify.mjs'],{cwd:consumer,encoding:'utf8'}));
console.log(JSON.stringify({node:process.version,artifact:packed.filename,artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),archiveCount:archives.length,archives,consumer:proof}));
