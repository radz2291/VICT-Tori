import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {platform, release, arch} from 'node:os';
import {dirname} from 'node:path';

const json=async path=>JSON.parse(await readFile(path,'utf8'));
const hash=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest(algorithm==='sha512'?'base64':'hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const lock=await json('package-lock.json');
const accepted=await json('docs/evidence/directive-foundation/windows/environment.json');
assert.equal(process.version,'v22.13.1');
assert.equal(git('hash-object','package-lock.json'),'746b69fbefb4a9123029f54ab4ca47a00aaa5310');
const archives=[];
for(const item of accepted.archives){
  const bytes=await readFile(item.file);
  const integrity='sha512-'+hash(bytes,'sha512');
  assert.equal(hash(bytes),item.sha256,item.name+' accepted SHA-256');
  assert.equal(integrity,lock.packages['node_modules/'+item.name].integrity,item.name+' lock SHA-512');
  const installed=await json('node_modules/'+item.name+'/package.json');
  assert.equal(installed.version,item.version);
  archives.push({name:item.name,version:installed.version,file:item.file,sha256:hash(bytes),integrity,bytes:bytes.length});
}
assert.equal(archives.length,16);
const versions={};
for(const name of ['@mastra/core','@mastra/memory','@mastra/libsql','@ai-sdk/openai-compatible'])
  versions[name]=(await json('node_modules/'+name+'/package.json')).version;
assert.deepEqual(versions,{'@mastra/core':'1.64.0','@mastra/memory':'1.28.2','@mastra/libsql':'1.22.3','@ai-sdk/openai-compatible':'2.0.0'});
const files=git('ls-files','fixtures','tests','packages/run-visibility').split('\n').filter(Boolean);
const fixtures=[];
for(const path of files)fixtures.push({path,sha256:hash(await readFile(path))});
const manifest={candidate:git('rev-parse','HEAD'),branch:git('branch','--show-current'),contract:'8f1b68ecde71f3bd9dc2f90f9fd2fb09462256ab',
  baseline:'bffe61268523360ea2d238383fc838645ecdd772',lockBlob:git('hash-object','package-lock.json'),
  host:platform(),osRelease:release(),architecture:arch(),node:process.version,
  npm:execFileSync('npm.cmd',['--version'],{encoding:'utf8',shell:true}).trim(),versions,archives,fixtures};
const out=process.argv[2]??'.local/run-visibility/manifest.json';
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({candidate:manifest.candidate,archives:archives.length,fixtures:fixtures.length,lockBlob:manifest.lockBlob,out}));
