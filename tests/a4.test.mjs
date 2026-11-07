import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { setTimeout } from 'node:timers/promises';
import { AgentProfileRegistry } from '@victframework/runtime';
import { createDedicatedMastraStore, createDeterministicOfflineModel, MastraThreadCoordinator, MASTRA_ADAPTER_COMPATIBILITY } from '@victframework/mastra';
import { childRef, createChildCapability, registerChild } from '../server/a4-runtime.mjs';
import { createStudio } from '../server/studio.mjs';

test('A4 pins the output parser and one governed child, with denial and trace',async()=>{
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const assembly=await vite.ssrLoadModule('/src/assembly.ts');
  const directory=await mkdtemp(join(tmpdir(),'tori-a4-'));
  Object.assign(process.env,{TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',
    TORI_EXECUTION_FIXTURE:'a1-request-capture',TORI_ENABLE_PI_ZAI:'0'});
  const originalFetch=globalThis.fetch;
  const requests=[];
  globalThis.fetch=async(url,init)=>{
    assert.equal(String(url),'https://api.z.ai/api/coding/paas/v4/chat/completions');
    const body=JSON.parse(init.body);
    requests.push(body);
    const lastUser=body.messages.findLastIndex(message=>message.role==='user');
    const delegate=body.tools?.length&&!body.messages.slice(lastUser+1).some(message=>message.role==='tool');
    const invalid=body.messages[lastUser].content==='invalid output';
    const delta=delegate?{tool_calls:[{index:0,id:'fixture-child',type:'function',
      function:{name:body.tools[0].function.name,arguments:'{"task":"Review the synthetic record."}'}}]}:
      {content:invalid?'UNACCEPTED-FIXTURE-CANARY':'{"finding":"Synthetic review accepted."}'};
    const chunks=[
      {choices:[{index:0,delta:{role:'assistant',...delta},finish_reason:null}]},
      {choices:[{index:0,delta:{},finish_reason:delegate?'tool_calls':'stop'}]},
    ];
    return new Response(chunks.map(chunk=>'data: '+JSON.stringify({id:'a4-'+requests.length,
      object:'chat.completion.chunk',created:1,model:body.model,...chunk})).join('\n\n')+'\n\ndata: [DONE]\n\n',
    {headers:{'Content-Type':'text/event-stream'}});
  };
  const start=()=>createStudio({getAssembly:()=>assembly,dataDirectory:directory});
  let service=start();
  try{
    const {history,emptyAssembly,add,change,wire,modelId}=assembly;
    const draft=history(emptyAssembly());
    const edit=(...ops)=>{
      const result=draft.apply(ops);
      assert.equal(result.ok,true,JSON.stringify(result.issues));
    };
    edit(add('agent'),add('model'),add('output'),change('agent','instructions','Produce the fixture JSON.'),
      change('model','model',modelId),wire('model','model'),wire('output','output'));
    let revision;
    const activate=async()=>{
      revision=(await service.dispatch('/save',{graph:draft.graph,expected:revision})).revision;
      const {activation}=await service.dispatch('/activate',{revision});
      return (await service.dispatch('/sessions',{activation:activation.version})).sessions[0];
    };
    const turn=(session,input)=>service.dispatch('/turn',{session:session.id,input});
    const structured=await activate();
    assert.equal((await turn(structured,'valid output')).runs[0].outputValidation,'accepted');
    const invalid=await turn(structured,'invalid output');
    assert.equal(invalid.runs[0].status,'failed');
    assert.equal(invalid.runs[0].outputValidation,'rejected');
    assert.equal(invalid.runs[0].errorCode,'VICT_AGENT_STRUCTURED_OUTPUT_REJECTED');
    assert.doesNotMatch(JSON.stringify(invalid),/UNACCEPTED-FIXTURE-CANARY/);
    await assert.rejects(turn(structured,'Continue from the rejected output'),/interrupted/);
    edit(add('child'),wire('child','child'),change('agent','maxSteps',2));
    const delegated=await activate();
    await service.close();
    service=start();
    const result=await turn(delegated,'Request the fixed child.');
    const parent=result.runs[0];
    const children=result.runs.filter(run=>run.parentRun===parent.id);
    assert.equal(parent.status,'completed',JSON.stringify(parent));
    assert.equal(parent.outputValidation,'accepted');
    assert.equal(children.length,1);
    assert.equal(children[0].status,'completed');
    assert.equal(children[0].parentVictTurn,parent.governance.turnId);
    assert.equal(children[0].parentInvocation,parent.governance.invocations[0].invocationId);
    assert.match(JSON.stringify(requests.at(-1).messages),/Synthetic reference review completed/);
    process.env.TORI_CHILD_REVOKED='1';
    const denied=await turn(delegated,'Request the fixed child after revocation.');
    assert.equal(denied.runs[0].errorCode,'TORI_CHILD_SCOPE_DENIED');
    assert.equal(denied.runs.filter(run=>run.parentRun===denied.runs[0].id).length,0);
    delete process.env.TORI_CHILD_REVOKED;
    console.log(JSON.stringify({valid:'accepted',invalid:invalid.runs[0].errorCode,
      parent:parent.id,child:children[0].id,invocation:children[0].parentInvocation,denial:denied.runs[0].errorCode}));
  }finally{
    globalThis.fetch=originalFetch;
    await service.close();
    await vite.close();
  }
});

test('parent cancellation reaches the pinned child model and settles the child Run',async()=>{
  const dataDir=await mkdtemp(join(tmpdir(),'tori-a4-cancel-'));
  const memory=await createDedicatedMastraStore({dataDir,retention:{messagesMaxAgeMs:60000,threadsMaxAgeMs:60000,spansMaxAgeMs:60000}});
  const registry=new AgentProfileRegistry();
  const memoryPolicy={id:'fixture.memory',revision:'1'};
  registry.installArtifacts([{kind:'memory-policy',...memoryPolicy,
    config:{lastMessages:10,workingMemory:{enabled:false},semanticRecall:false}}]);
  const child=registerChild(registry,{memoryPolicy},MASTRA_ADAPTER_COMPATIBILITY);
  const controller=new AbortController();
  const states=[];
  let sawAbort=false;
  const capability=createChildCapability({
    activation:{subagents:[{reference:childRef,agentProfileVersion:child.agentProfileVersion}]},
    child,parentRun:{id:'synthetic-parent',session:'synthetic-session',fixture:'a4'},
    agentConfig:{store:memory.store,threadCoordinator:new MastraThreadCoordinator(),tracing:{sampling:{type:'never'}}},
    persist:run=>states.push(structuredClone(run)),
    modelForTask:()=>({...createDeterministicOfflineModel(),async doStream({abortSignal}){
      controller.abort();
      try{await setTimeout(2000,undefined,{signal:abortSignal});}
      catch(error){sawAbort=abortSignal.aborted;throw error;}
      throw new Error('The child model did not receive cancellation.');
    }}),
  });
  try{
    await assert.rejects(capability.invoke({task:'Synthetic cancellable task.'},{
      victActorId:'synthetic-actor',victInvocationId:'synthetic-invocation',signal:controller.signal,
    }),/TORI_CHILD_INCOMPLETE/);
    assert.equal(sawAbort,true);
    assert.deepEqual(states.map(run=>run.status),['running','cancelled']);
    assert.equal(states[1].parentRun,'synthetic-parent');
  }finally{await memory.close();}
});
