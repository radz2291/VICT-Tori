import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {dirname,join,resolve} from 'node:path';

const out=resolve(process.env.TORI_RV_QUALIFICATION??'.local/run-visibility/qualification');
await mkdir(out,{recursive:true});
const node=process.execPath,npm=join(dirname(node),'node_modules/npm/bin/npm-cli.js');
const base={...process.env,TORI_ENABLE_PI_ZAI:'0',TORI_ZAI_API_KEY:'synthetic-a1-fixture',TORI_ZAI_ROUTE:'coding',
  TORI_AUTHORING_LIVE:'0',TORI_V1B_LIVE:'0',TORI_MEMORY_LIVE:'0',TORI_MEMORY_EARLY:'0',TORI_BROWSER_LIVE:'0'};
const steps={
  unit:{args:['--test','--test-concurrency=1','--test-timeout=480000','tests/*.test.mjs']},
  build:{args:[npm,'run','build']},
  a1a4:{args:['tests/a1-browser.mjs'],env:{TORI_A1_PORT:'48903',TORI_BROWSER_A2:'1',TORI_BROWSER_A3:'1',TORI_BROWSER_A4:'1'}},
  v1b:{args:['tests/v1b-browser.mjs'],env:{TORI_V1B_PORT:'48904'}},
  memory:{args:['tests/memory-browser.mjs'],env:{TORI_MEMORY_PORT:'48905',TORI_MEMORY_EVIDENCE:join(out,'memory')}},
  authoring:{args:['docs/evidence/directive-foundation/browser/windows-warm-browser.mjs','authoring']},
  directive:{args:['tests/directive-browser.mjs'],env:{TORI_DIRECTIVE_BROWSER_PORT:'48907',TORI_DIRECTIVE_BROWSER_EVIDENCE:join(out,'directive')}},
  assembly:{args:['docs/evidence/directive-foundation/browser/windows-warm-browser.mjs','assembly']},
  background:{command:'pwsh',args:['-NoProfile','-File','docs/evidence/directive-foundation/browser/windows-background.ps1'],env:{TORI_T8_BACKGROUND_LABEL:'rv-'+Date.now()}},
  visibility:{args:['tests/run-visibility-browser.mjs'],env:{TORI_RV_BROWSER_PORT:'48908',TORI_RV_EVIDENCE:join(out,'visibility')}},
  consumer:{args:['scripts/probe-run-visibility-consumer.mjs']},
};
const selected=process.argv.slice(2);
const names=selected.length?selected:Object.keys(steps);
assert.ok(names.every(name=>Object.hasOwn(steps,name)));
const record={candidate:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,
  origin:'deterministic and installed browser qualification; no live calls',steps:[]};
for(const name of names){
  const step=steps[name],started=new Date().toISOString(),log=join(out,name+'.log');
  console.log(JSON.stringify({step:name,status:'started',candidate:record.candidate}));
  const stream=createWriteStream(log);
  const child=spawn(step.command??node,step.args,{env:{...base,...step.env},windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
  const [code,signal]=await once(child,'exit');
  stream.end();await once(stream,'finish');
  record.steps.push({name,started,ended:new Date().toISOString(),code,signal,command:[step.command??'node',...step.args],log:name+'.log'});
  await writeFile(join(out,'results.json'),JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify({step:name,status:code===0?'passed':'failed',code,signal}));
}
process.exitCode=record.steps.some(step=>step.code!==0)?1:0;
