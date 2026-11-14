// Copies reviewed synthetic evidence only; raw failed attempts remain local.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve,relative} from 'node:path';
const destination=resolve('docs/evidence/v1c-run-visibility/independent/artifacts');
const index=[];
const normalize=value=>value.replaceAll(process.cwd(),'[verification-worktree]').replaceAll(process.cwd().replaceAll('\\','/'),'[verification-worktree]').replaceAll(process.cwd().replaceAll('\\','\\\\'),'[verification-worktree]');
async function copy(source,target){
  const raw=await readFile(source);const textual=/\.(?:json|log|txt)$/.test(source);
  const content=textual?Buffer.from(normalize(raw.toString('utf8'))):raw;
  const path=join(destination,target);await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,content);
  index.push({source:relative(process.cwd(),source).replaceAll('\\','/'),artifact:target,sourceBytes:raw.length,sourceSha256:createHash('sha256').update(raw).digest('hex'),artifactSha256:createHash('sha256').update(content).digest('hex')});
}
async function tree(source,target,filter){
  for(const item of await readdir(source,{withFileTypes:true})){const from=join(source,item.name),to=target+'/'+item.name;if(item.isDirectory())await tree(from,to,filter);else if(filter(item.name))await copy(from,to);}
}
await mkdir(destination,{recursive:true});
await copy('.local/independent/manifest.json','78a410f/manifest.json');
await tree('.local/independent/qualification','78a410f',name=>/\.(?:json|png|log)$/.test(name));
await tree('.local/independent/final','final',name=>/\.(?:json|png|log)$/.test(name));
try{await tree('.local/independent/recheck058','recheck058',name=>/\.(?:json|png|log)$/.test(name));}catch(error){if(error.code!=='ENOENT')throw error;}
for(const name of ['control-audit','control-audit-02','control-audit-03'])await tree('.local/independent/'+name,name,n=>/\.(?:json|png)$/.test(n));
try{await tree('.local/independent/control-final','final/control',n=>/\.(?:json|png)$/.test(n));}catch(error){if(error.code!=='ENOENT')throw error;}
for(const name of ['prior-projection-red.log','live-78a410f.json','live-cd415e0.json']){try{await copy('.local/independent/'+name,name);}catch(error){if(error.code!=='ENOENT')throw error;}}
for(const [source,target] of [['.local/t8-authoring-browser','final/authoring'],['.local/v1a-browser','final/assembly']]){try{await tree(source,target,n=>/\.(?:json|png)$/.test(n));}catch(error){if(error.code!=='ENOENT')throw error;}}
for(const name of await readdir('.local'))if(name.startsWith('t8-background-browser-independent-'))await tree('.local/'+name,'final/'+name,n=>/\.(?:json|png)$/.test(n));
for(const directory of ['final','recheck058'])for(const name of await readdir('.local/independent/'+directory).catch(()=>[]))if(/^(?:a1a4|v1b)-.*\.log$/.test(name)){
  const text=await readFile('.local/independent/'+directory+'/'+name,'utf8');
  for(const line of text.split(/\r?\n/)){try{const record=JSON.parse(line);if(record.evidenceDirectory)await tree(record.evidenceDirectory,directory+'/'+name.split('-')[0]+'-screens',n=>n.endsWith('.png'));}catch(error){if(error.code&&error.code!=='ENOENT')throw error;}}
}
for(const name of ['install.log','install-02.log','install-03.log','install-04.log']){
  const source='.local/independent/'+name,raw=await readFile(source),lines=raw.toString('utf8').split(/\r?\n/);
  const excerpt=[...lines.slice(0,20),'[Repeated extraction diagnostics omitted from public excerpt; original local file hash is in INDEX.json.]',...lines.slice(-40)].join('\n');
  await writeFile(join(destination,name+'.txt'),normalize(excerpt));
  index.push({source,artifact:name+'.txt',kind:'installation excerpt',sourceBytes:raw.length,sourceSha256:createHash('sha256').update(raw).digest('hex')});
}
await writeFile(join(destination,'INDEX.json'),JSON.stringify({scope:'independent synthetic fixture evidence and read-only review of manager synthetic live captures',index},null,2)+'\n');
console.log(JSON.stringify({artifacts:index.length,path:relative(process.cwd(),destination)}));
