import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'vite';
import * as mastra from '@victframework/mastra';

test('Studio host deadline cancels a stalled child through the installed governed parent executor', async t => {
  const directory=await mkdtemp(join(tmpdir(),'tori-independent-a4-deadline-'));
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const assembly=await vite.ssrLoadModule('/src/assembly.ts');
  Object.assign(process.env,{TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',
    TORI_EXECUTION_FIXTURE:'a1-request-capture',TORI_ENABLE_PI_ZAI:'0'});
  let entered=0, sawAbort=false;
  t.mock.module('@victframework/mastra',{
    exports:{...mastra,createDeterministicOfflineModel:options=>({
      ...mastra.createDeterministicOfflineModel(options),
      async doStream({abortSignal}){
        entered++;
        assert.ok(abortSignal,'The child model must receive a signal');
        assert.equal(abortSignal.aborted,false,'The child must enter before the host deadline');
        try{await setTimeout(15000,undefined,{signal:abortSignal});}
        catch(error){sawAbort=abortSignal.aborted;throw error;}
        throw new Error('Child did not observe parent cancellation');
      },
    })},
  });
  const { createStudio }=await import('./server/studio.mjs');
  const originalFetch=globalThis.fetch;
  let providerRequests=0;
  globalThis.fetch=async(url,init)=>{
    assert.equal(String(url),'https://api.z.ai/api/coding/paas/v4/chat/completions');
    const body=JSON.parse(init.body);
    providerRequests++;
    assert.equal(providerRequests,1,'No model continuation should dispatch after the stalled child');
    assert.equal(body.tools?.length,1);
    const tool={index:0,id:'independent-child-deadline',type:'function',
      function:{name:body.tools[0].function.name,arguments:'{"task":"Review the synthetic record."}'}};
    const frames=[
      {choices:[{index:0,delta:{role:'assistant',tool_calls:[tool]},finish_reason:null}]},
      {choices:[{index:0,delta:{},finish_reason:'tool_calls'}]},
    ];
    return new Response(frames.map(frame=>'data: '+JSON.stringify({id:'a4-deadline',object:'chat.completion.chunk',
      created:1,model:body.model,...frame})).join('\n\n')+'\n\ndata: [DONE]\n\n',
      {headers:{'Content-Type':'text/event-stream'}});
  };
  const service=createStudio({getAssembly:()=>assembly,dataDirectory:directory,turnDeadlineMs:8000});
  try{
    const {history,emptyAssembly,add,change,wire,modelId}=assembly;
    const draft=history(emptyAssembly());
    const edit=draft.apply([add('agent'),add('model'),add('child'),change('agent','instructions','Run the pinned fixture child.'),
      change('agent','maxSteps',2),change('model','model',modelId),wire('model','model'),wire('child','child')]);
    assert.equal(edit.ok,true,JSON.stringify(edit.issues));
    const {revision}=await service.dispatch('/save',{graph:draft.graph});
    const {activation}=await service.dispatch('/activate',{revision});
    const {sessions:[session]}=await service.dispatch('/sessions',{activation:activation.version});
    const settled=await service.dispatch('/turn',{session:session.id,input:'Request the fixed child.'});
    const parent=settled.runs.find(run=>!run.parentRun);
    let child=settled.runs.find(run=>run.parentRun===parent.id);
    for(let i=0;i<60&&child?.status==='running';i++){
      await setTimeout(25);
      const state=await service.dispatch('',{});
      child=state.runs.find(run=>run.parentRun===parent.id);
    }
    const receipt={parent:{id:parent.id,status:parent.status,code:parent.errorCode,attempts:parent.providerAttempts,
      turn:parent.governance?.turnId,invocation:parent.governance?.invocations[0]?.invocationId,
      events:parent.events.map(event=>event.kind??event.label)},
      child:child&&{id:child.id,parentRun:child.parentRun,parentVictTurn:child.parentVictTurn,
        parentInvocation:child.parentInvocation,status:child.status,events:child.events.map(event=>event.label)},
      childModelEntries:entered,childSignalAborted:sawAbort,providerRequests};
    console.log(JSON.stringify(receipt));
    assert.equal(entered,1);
    assert.equal(sawAbort,true);
    assert.equal(parent.status,'cancelled');
    assert.equal(parent.errorCode,'TORI_TURN_DEADLINE');
    assert.equal(providerRequests,1);
    assert.ok(child);
    assert.equal(child.status,'cancelled');
    assert.equal(child.parentRun,parent.id);
    if(parent.governance?.turnId)assert.equal(child.parentVictTurn,parent.governance.turnId);
    if(parent.governance?.invocations[0]?.invocationId)assert.equal(child.parentInvocation,parent.governance.invocations[0].invocationId);
    await assert.rejects(service.dispatch('/turn',{session:session.id,input:'Try again.'}),/interrupted/);
  }finally{
    globalThis.fetch=originalFetch;
    await service.close();
    await vite.close();
  }
});

test('a rejected output remains unaccepted and cannot feed a follow-up after reopen', async()=>{
  const directory=await mkdtemp(join(tmpdir(),'tori-independent-a4-rejection-'));
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const assembly=await vite.ssrLoadModule('/src/assembly.ts');
  const {createStudio}=await import('./server/studio.mjs');
  Object.assign(process.env,{TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',
    TORI_EXECUTION_FIXTURE:'a1-request-capture',TORI_ENABLE_PI_ZAI:'0'});
  const originalFetch=globalThis.fetch;
  const canary='VERIFIER-REJECTED-CANARY';
  let requests=0;
  globalThis.fetch=async (url,init)=>{
    assert.equal(String(url),'https://api.z.ai/api/coding/paas/v4/chat/completions');
    const body=JSON.parse(init.body);
    requests++;
    const frames=[
      {choices:[{index:0,delta:{role:'assistant',content:JSON.stringify({finding:'Plausible text',extra:canary})},finish_reason:null}]},
      {choices:[{index:0,delta:{},finish_reason:'stop'}]},
    ];
    return new Response(frames.map(frame=>'data: '+JSON.stringify({id:'a4-rejection',object:'chat.completion.chunk',
      created:1,model:body.model,...frame})).join('\n\n')+'\n\ndata: [DONE]\n\n',
      {headers:{'Content-Type':'text/event-stream'}});
  };
  const start=()=>createStudio({getAssembly:()=>assembly,dataDirectory:directory});
  let service=start();
  try{
    const {history,emptyAssembly,add,change,wire,modelId}=assembly;
    const draft=history(emptyAssembly());
    const edit=draft.apply([add('agent'),add('model'),add('output'),change('agent','instructions','Produce one finding.'),
      change('model','model',modelId),wire('model','model'),wire('output','output')]);
    assert.equal(edit.ok,true,JSON.stringify(edit.issues));
    const {revision}=await service.dispatch('/save',{graph:draft.graph});
    const {activation}=await service.dispatch('/activate',{revision});
    const {sessions:[session]}=await service.dispatch('/sessions',{activation:activation.version});
    const first=await service.dispatch('/turn',{session:session.id,input:'Return the fixture finding.'});
    const rejected=first.runs[0];
    assert.equal(rejected.status,'failed');
    assert.equal(rejected.outputValidation,'rejected');
    assert.equal(rejected.errorCode,'VICT_AGENT_STRUCTURED_OUTPUT_REJECTED');
    assert.ok(!first.sessions[0].messages.some(message=>message.role==='assistant'));
    assert.ok(!JSON.stringify(first).includes(canary));
    await service.close();
    service=undefined;
    const db=new DatabaseSync(join(directory,'studio.sqlite'),{readOnly:true});
    try{
      const stored=db.prepare('select value from project').get().value;
      assert.ok(!stored.includes(canary));
      const persisted=JSON.parse(stored);
      assert.equal(persisted.runs.find(run=>run.id===rejected.id).outputValidation,'rejected');
      assert.equal(persisted.sessions.find(item=>item.id===session.id).interrupted,true);
    }finally{db.close();}
    service=start();
    await assert.rejects(service.dispatch('/turn',{session:session.id,input:'Continue the rejected output.'}),/interrupted/);
    assert.equal(requests,1);
    console.log(JSON.stringify({rejection:{run:rejected.id,status:rejected.status,validation:rejected.outputValidation,
      code:rejected.errorCode,acceptedAssistantMessages:0,domainCanaryPresent:false,providerRequests:requests,
      rejectedSessionFencedAfterReopen:true}}));
  }finally{
    globalThis.fetch=originalFetch;
    await service?.close();
    await vite.close();
  }
});
