import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
const candidate=process.env.TORI_VERIFY_CANDIDATE??'cd415e07f2592d36d7ebb32317d7111fc01f7e76';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),candidate);
const directory='docs/evidence/v1c-run-visibility/independent';
const out=resolve(process.env.TORI_VERIFY_EVIDENCE??'.local/independent/final');await mkdir(out,{recursive:true});
const node=process.execPath,npm=join(dirname(node),'node_modules/npm/bin/npm-cli.js');
const env={...process.env,TORI_ENABLE_PI_ZAI:'0',TORI_ZAI_API_KEY:'synthetic-a1-fixture',TORI_ZAI_ROUTE:'coding',TORI_AUTHORING_LIVE:'0',TORI_V1B_LIVE:'0',TORI_MEMORY_LIVE:'0',TORI_BROWSER_LIVE:'0',TORI_MEMORY_EARLY:'0'};
// External test-launcher copies only: preserve candidate product and drivers.
const warm=(await readFile('docs/evidence/directive-foundation/browser/windows-warm-browser.mjs','utf8')).replace("const port = task === 'authoring' ? '48934' : '48936';","const port = '48931';");
await writeFile(join(directory,'windows-warm-isolated.mjs'),warm);
const background=(await readFile('docs/evidence/directive-foundation/browser/windows-background.ps1','utf8')).replaceAll('48935','48932');
await writeFile(join(directory,'windows-background-isolated.ps1'),background);
const steps={
  manifest:{args:['scripts/run-visibility-manifest.mjs',join(out,'manifest.json')]},
  accepted:{args:[directory+'/accepted-reply-challenge.mjs']},
  controls:{args:[directory+'/control-audit.mjs']},
  affected:{args:['--test','--test-concurrency=1','--test-timeout=480000','tests/a4.test.mjs','tests/saved-research.test.mjs','tests/run-visibility.test.mjs','tests/workspace-discovery.test.mjs','tests/authoring-continuity.test.mjs','tests/provider-stream.test.mjs']},
  projection:{args:[directory+'/projection-challenge.mjs']},
  boundary:{args:['scripts/probe-run-visibility.mjs']},
  consumer:{args:['scripts/probe-run-visibility-consumer.mjs']},
  receipt:{args:['tests/run-visibility-receipt-browser.mjs'],env:{TORI_RV_RECEIPT_PORT:'48931',TORI_RV_RECEIPT_EVIDENCE:join(out,'receipt')}},
  visibility:{args:['tests/run-visibility-browser.mjs'],env:{TORI_RV_BROWSER_PORT:'48931',TORI_RV_EVIDENCE:join(out,'visibility')}},
  unit:{args:['--test','--test-concurrency=1','--test-timeout=480000','tests/*.test.mjs']},
  build:{args:[npm,'run','build']},
  a1a4:{args:['tests/a1-browser.mjs'],env:{TORI_A1_PORT:'48931',TORI_BROWSER_A2:'1',TORI_BROWSER_A3:'1',TORI_BROWSER_A4:'1'}},
  v1b:{args:['tests/v1b-browser.mjs'],env:{TORI_V1B_PORT:'48931'}},
  memory:{args:['tests/memory-browser.mjs'],env:{TORI_MEMORY_PORT:'48931',TORI_MEMORY_EVIDENCE:join(out,'memory')}},
  directive:{args:['tests/directive-browser.mjs'],env:{TORI_DIRECTIVE_BROWSER_PORT:'48931',TORI_DIRECTIVE_BROWSER_EVIDENCE:join(out,'directive')}},
  authoring:{args:[directory+'/windows-warm-isolated.mjs','authoring']},
  assembly:{args:[directory+'/windows-warm-isolated.mjs','assembly']},
  background:{command:'pwsh',args:['-NoProfile','-File',directory+'/windows-background-isolated.ps1'],env:{TORI_T8_BACKGROUND_LABEL:'independent-'+Date.now()}},
};
const selected=process.argv.slice(2),names=selected.length?selected:Object.keys(steps);assert.ok(names.every(n=>Object.hasOwn(steps,n)));
const runFile=join(out,'results-'+Date.now()+'.json');
const record={candidate,node:process.version,origin:'independent fixture and installed verification; no live calls',steps:[]};
for(const name of names){
  const step=steps[name],started=new Date().toISOString(),log=join(out,name+'-'+Date.now()+'.log');
  console.log(JSON.stringify({step:name,status:'started',candidate}));
  const stream=createWriteStream(log),child=spawn(step.command??node,step.args,{env:{...env,...step.env},windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
  const [code,signal]=await once(child,'exit');stream.end();await once(stream,'finish');
  record.steps.push({name,started,ended:new Date().toISOString(),code,signal,command:[step.command??'node',...step.args],log});
  await writeFile(runFile,JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify({step:name,status:code===0?'passed':'failed',code,signal,log}));
}
process.exitCode=record.steps.some(s=>s.code!==0)?1:0;
