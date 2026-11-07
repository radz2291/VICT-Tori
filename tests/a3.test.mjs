import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { createDedicatedMastraStore, executeMemoryPrune, MastraConversationExportPort, MastraThreadCoordinator } from '@victframework/mastra';
import { createStudio } from '../server/studio.mjs';
import { loadContext } from '../server/a3-runtime.mjs';

function reply(body,index,tool) {
  const toolCall={index:0,id:'ref-'+index,type:'function',function:{name:tool,arguments:'{"key":"observatory"}'}};
  const chunks=[
    {choices:[{index:0,delta:{role:'assistant',...(tool?{tool_calls:[toolCall]}:{content:'Synthetic A3 answer.'})},finish_reason:null}]},
    {choices:[{index:0,delta:{},finish_reason:tool?'tool_calls':'stop'}]},
  ];
  return new Response(chunks.map(chunk=>'data: '+JSON.stringify({
    id:'a3-'+index,object:'chat.completion.chunk',created:1,model:body.model,...chunk
  })).join('\n\n')+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
}

test('A3 Studio uses pinned context, scoped memory, and a governed MCP read with a model-step boundary',async()=>{
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const assembly=await vite.ssrLoadModule('/src/assembly.ts');
  const directory=await mkdtemp(join(tmpdir(),'tori-a3-proof-'));
  const toolCapture=join(directory,'mcp-calls.log');
  Object.assign(process.env,{TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',
    TORI_EXECUTION_FIXTURE:'a1-request-capture',TORI_MCP_CALL_CAPTURE:toolCapture,TORI_ENABLE_PI_ZAI:'0'});
  const oldFetch=globalThis.fetch;
  const requests=[];
  globalThis.fetch=async(url,init)=>{
    assert.equal(String(url),'https://api.z.ai/api/coding/paas/v4/chat/completions');
    const body=JSON.parse(init.body);
    const lastUser=body.messages.findLastIndex(message=>message.role==='user');
    const usedTool=body.messages.slice(lastUser+1).some(message=>message.role==='tool');
    requests.push(body);
    return reply(body,requests.length,body.tools?.length&&!usedTool?body.tools[0].function.name:undefined);
  };
  let reads=0;
  const start=()=>createStudio({getAssembly:()=>assembly,dataDirectory:directory,contextReader:async file=>{
    reads++;
    return readFile(file);
  }});
  let service=start();
  try{
    const {history,emptyAssembly,add,change,wire,modelId}=assembly;
    const graph=history(emptyAssembly());
    const edit=(...ops)=>{
      const result=graph.apply(ops);
      assert.equal(result.ok,true,JSON.stringify(result.issues));
    };
    edit(add('agent'),add('model'),add('context'),add('memory'),change('agent','instructions','Synthetic A3 test.'),
      change('model','model',modelId),wire('model','model'),wire('context','context'),wire('memory','memory'));
    let revision;
    async function activate() {
      revision=(await service.dispatch('/save',{graph:graph.graph,expected:revision})).revision;
      const {activation}=await service.dispatch('/activate',{revision});
      return (await service.dispatch('/sessions',{activation:activation.version})).sessions[0];
    }
    const turn=async(session,input,includeContext=false)=>(await service.dispatch('/turn',{session:session.id,input,includeContext})).runs[0];
    const countToolCalls=async()=> (await readFile(toolCapture,'utf8').catch(()=>'' )).split('\n').filter(Boolean).length;

    const one=await activate();
    assert.equal(reads,0);
    assert.equal((await turn(one,'MEMORY-ISOLATION-ONE')).context.reason,'no-demand');
    assert.equal(reads,0);
    const admitted=await turn(one,'Use the requested reference',true);
    assert.equal(admitted.context.status,'admitted');
    assert.equal(admitted.context.reads,1);
    assert.match(JSON.stringify(requests.at(-1).messages),/TERN-CONTEXT-ONE/);
    assert.match(JSON.stringify(requests.at(-1).messages),/MEMORY-ISOLATION-ONE/);
    assert.doesNotMatch(JSON.stringify(admitted),/TERN-CONTEXT-ONE/);

    edit(change('context','reference','reference@2'));
    const two=await activate();
    await service.close();
    service=start();
    await turn(two,'Separate session',true);
    assert.match(JSON.stringify(requests.at(-1).messages),/TERN-CONTEXT-TWO/);
    assert.doesNotMatch(JSON.stringify(requests.at(-1).messages),/MEMORY-ISOLATION-ONE|TERN-CONTEXT-ONE/);
    await turn(one,'Original pinned source',true);
    assert.match(JSON.stringify(requests.at(-1).messages),/TERN-CONTEXT-ONE/);
    assert.doesNotMatch(JSON.stringify(requests.at(-1).messages),/TERN-CONTEXT-TWO/);
    process.env.TORI_CONTEXT_REVOKED='1';
    const readsBeforeDenial=reads;
    assert.equal((await turn(one,'Denied source',true)).context.reason,'denied');
    assert.equal(reads,readsBeforeDenial);
    assert.doesNotMatch(JSON.stringify(requests.at(-1).messages),/TERN-CONTEXT-/);
    delete process.env.TORI_CONTEXT_REVOKED;

    edit(add('tool'),wire('tool','tool'),change('agent','maxSteps',2));
    const enough=await activate();
    assert.equal(await countToolCalls(),0);
    const before=requests.length;
    const success=await turn(enough,'Read the observatory reference');
    assert.equal(success.status,'completed',JSON.stringify(success));
    assert.equal(success.modelSteps,2);
    assert.equal(requests.length-before,2);
    assert.equal(success.governance.calls,1);
    assert.equal(success.governance.invocations[0].status,'completed');
    assert.match(JSON.stringify(requests.at(-1).messages),/TERN-MCP-READ/);
    assert.equal(await countToolCalls(),1);
    assert.ok(success.events.some(event=>event.label==='VICT · tool.completed'));

    edit(change('agent','maxSteps',1));
    const low=await activate();
    const lowBefore=requests.length;
    const limited=await turn(low,'Read the observatory reference');
    assert.equal(limited.status,'failed',JSON.stringify(limited));
    assert.equal(limited.errorCode,'TORI_MODEL_STEP_LIMIT');
    assert.equal(limited.modelSteps,1);
    assert.equal(requests.length-lowBefore,1);
    assert.equal(await countToolCalls(),2);
    assert.equal(limited.governance.calls,1);
    assert.ok(limited.events.some(event=>event.label==='Model step limit reached'));
    assert.equal(limited.activation,low.activation);

    process.env.TORI_MCP_REVOKED='1';
    const revoked=await turn(enough,'Read after revocation');
    assert.equal(revoked.errorCode,'TORI_MCP_SCOPE_DENIED');
    assert.equal(await countToolCalls(),2);
    delete process.env.TORI_MCP_REVOKED;
    process.env.TORI_MCP_SCHEMA_DRIFT='1';
    const drift=await turn(enough,'Read after schema change');
    assert.equal(drift.errorCode,'TORI_MCP_SCHEMA_DRIFT');
    assert.equal(await countToolCalls(),2);
    delete process.env.TORI_MCP_SCHEMA_DRIFT;

    const deleted=await service.dispatch('/delete-session',{session:one.id});
    assert.equal(deleted.deletion.status,'completed');
    assert.equal(deleted.deletion.completedSteps.length,2);
    await service.close();
    service=start();
    await assert.rejects(turn(one,'Deleted memory'),/Session was not found/);
    assert.ok((await service.dispatch('',{})).sessions.some(session=>session.id===two.id));
    await service.close();
    service=undefined;
    const memory=await createDedicatedMastraStore({dataDir:directory,retention:{
      messagesMaxAgeMs:2592000000,threadsMaxAgeMs:2592000000,spansMaxAgeMs:86400000,
    }});
    try{
      const port=actorId=>new MastraConversationExportPort({store:memory.store,actorId,threadCoordinator:new MastraThreadCoordinator()});
      assert.equal(await port('tori-local-owner').exportConversationThread(one.id),undefined);
      assert.ok((await port('tori-local-owner').exportConversationThread(two.id)).messages.length);
      assert.equal(await port('different-actor').exportConversationThread(two.id),undefined);
      const pruned=await executeMemoryPrune({store:memory.store,retention:{messagesMaxAgeMs:1}});
      assert.ok(pruned.tables.some(item=>item.deleted>0));
      assert.equal((await port('tori-local-owner').exportConversationThread(two.id)).messages.length,0);
    }finally{await memory.close();}
    console.log(JSON.stringify({contextReads:reads,governedToolCalls:await countToolCalls(),modelSteps:[success.modelSteps,limited.modelSteps],
      terminal:[success.status,limited.errorCode],deletion:deleted.deletion.completedSteps}));
  }finally{
    globalThis.fetch=oldFetch;
    await service?.close();
    await vite.close();
  }
});

test('context refusal never returns content',async()=>{
  assert.equal((await loadContext('reference@1',true,async()=>Buffer.alloc(513))).receipt.reason,'over-budget');
  assert.equal((await loadContext('reference@1',true,async()=>Buffer.from('changed'))).receipt.reason,'stale');
  assert.equal((await loadContext('reference@1',true,async()=>{throw Error('synthetic');})).receipt.reason,'unavailable');
});
