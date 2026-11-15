import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const root=process.cwd();
const candidate=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const fromCandidate=path=>import(pathToFileURL(join(root,path)).href);
const result={candidate,node:process.version,checks:[]};
const directory=await mkdtemp(join(tmpdir(),'tori-independent-deadline-'));
const capture=join(directory,'provider.jsonl');
Object.assign(process.env,{
  TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',
  TORI_EXECUTION_FIXTURE:'a1-request-capture',TORI_ENABLE_PI_ZAI:'0',
  TORI_BROWSER_A4:'1',TORI_A1_CAPTURE:capture,
});
await fromCandidate('tests/a1-provider-fixture.mjs');
const {createServer}=await fromCandidate('node_modules/vite/dist/node/index.js');
const {createStudio}=await fromCandidate('server/studio.mjs');
const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
let service;
const releaseChild=Promise.withResolvers();
let pending;
try{
  const a=await vite.ssrLoadModule('/src/assembly.ts');
  const childEntered=Promise.withResolvers();
  const timers=[];
  let clock=Date.now();
  service=createStudio({getAssembly:()=>a,dataDirectory:directory,hostDeadlineFixture:{
    clock:()=>clock,
    timeout(milliseconds){
      const controller=new AbortController();
      timers.push({at:clock+milliseconds,controller});
      return controller.signal;
    },
  },backgroundFixture:{async child(run,signal){
    childEntered.resolve({id:run.id,signal});
    await Promise.race([releaseChild.promise, new Promise(resolve=>{
      if(signal.aborted)resolve();
      else signal.addEventListener('abort',resolve,{once:true});
    })]);
  }}});
  const dispatch=(path,payload={})=>service.dispatch(path,payload);
  const makeGraph=(name,deadline)=>{
    const h=a.history(a.emptyAssembly());
    assert.ok(h.apply(a.assemblyPatchOperations(h.graph,{name,instructions:'Use the deterministic test capability.',model:a.modelId,maxSteps:3})).ok);
    assert.ok(h.apply([a.change('agent','hostDeadlineMs',deadline)]).ok);
    return h;
  };
  const blankDef=(await dispatch('/definitions')).definition;
  const blankGraph=structuredClone(makeGraph('Missing current deadline',120000).graph);
  const agent=blankGraph.nodes.find(node=>node.id==='agent');
  assert.equal(agent.values.hostDeadlineMs,120000);
  delete agent.values.hostDeadlineMs;
  let blankRevision;
  try{
    blankRevision=(await dispatch('/save',{definition:blankDef,graph:blankGraph})).revision;
    const value=await dispatch('/activate',{definition:blankDef,revision:blankRevision});
    result.checks.push({name:'missing deadline in current graph can save but cannot activate',pass:false,activation:value.activation?.version,observedMilliseconds:value.activation?.hostDeadlineMs??a.executionSettings(blankGraph).hostDeadlineMs});
  }catch(error){
    result.checks.push({name:'missing deadline in current graph can save but cannot activate',pass:!!blankRevision&&/deadline/i.test(error.message),saved:!!blankRevision,error:error.message});
  }

  const childDef=(await dispatch('/definitions')).definition;
  const childRevision=(await dispatch('/save',{definition:childDef,graph:makeGraph('Child pinned to 1 s',1000).graph})).revision;
  const childPin=(await dispatch('/activate',{definition:childDef,revision:childRevision})).activation;
  const parentDef=(await dispatch('/definitions')).definition;
  const parent=makeGraph('Parent pinned to 120 s',120000);
  assert.ok(parent.apply(a.assemblyPatchOperations(parent.graph,{childRevision:childRevision.id})).ok);
  const parentRevision=(await dispatch('/save',{definition:parentDef,graph:parent.graph})).revision;
  const parentPin=(await dispatch('/activate',{definition:parentDef,revision:parentRevision})).activation;
  const session=(await dispatch('/sessions',{activation:parentPin.version})).sessions[0];
  pending=dispatch('/turn',{session:session.id,input:'Delegate one task to the child.'});
  void pending.catch(()=>{});
  const {id,signal}=await Promise.race([
    childEntered.promise,
    pending.then(value=>{throw new Error('Parent settled before the child entered: '+JSON.stringify(value.runs.map(run=>({status:run.status,code:run.errorCode,message:run.message}))))}),
    delay(120000,undefined,{ref:false}).then(()=>{throw new Error('Child never entered the fixture hold.');}),
  ]);
  const before=(await dispatch('')).runs.find(run=>run.id===id);
  clock+=1000;
  for(const timer of timers)if(clock>=timer.at&&!timer.controller.signal.aborted)timer.controller.abort(new DOMException('deadline','TimeoutError'));
  const abortedAtAuthoredDeadline=signal.aborted;
  const during=(await dispatch('')).runs.find(run=>run.id===id);
  releaseChild.resolve();
  const terminal=await pending;
  const ended=terminal.runs.find(run=>run.id===id);
  result.checks.push({
    name:'child authored at 1 s expires under a 120 s parent',
    pass:abortedAtAuthoredDeadline&&before?.execution?.deadlineMs===1000&&ended?.status==='cancelled',
    childActivation:childPin.version,parentActivation:parentPin.version,
    initialRecordedDeadlineMs:before?.execution?.deadlineMs,childSignalAbortedAtOneSecond:abortedAtAuthoredDeadline,
    childStateAtOneSecond:during?.state,childTerminalState:ended?.status,terminalCode:ended?.errorCode,
  });
}catch(error){
  result.challengeError={message:error.message,stack:error.stack};
}finally{
  releaseChild.resolve();
  await Promise.race([pending?.catch(()=>{}),delay(10000,undefined,{ref:false})]);
  await service?.close();
  await vite.close();
  await writeFile(process.argv[2], JSON.stringify(result,null,2)+'\n');
}
console.log(JSON.stringify(result,null,2));
process.exitCode=result.challengeError||result.checks.length!==2||result.checks.some(check=>!check.pass)?1:0;
