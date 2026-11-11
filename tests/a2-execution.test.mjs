import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { createServer } from 'vite';
import { createStudio } from '../server/studio.mjs';

const live=process.env.TORI_A2_PERMITTED_LIVE==='1';

test(live?'A2 permitted Coding route sampling':'A2 sampling, retry limit, and deadline',async()=>{
  const vite=await createServer({server:{middlewareMode:true,watch:null,hmr:false}});
  const assembly=await vite.ssrLoadModule('/src/assembly.ts');
  const directory=await mkdtemp(join(tmpdir(),'tori-a2-'));
  const capture=[];
  const originalFetch=globalThis.fetch;
  let service, mode='ok', retrySuccessAttempts=0;
  const start=(deadline)=>createStudio({getAssembly:()=>assembly,dataDirectory:directory,turnDeadlineMs:deadline});
  process.env.TORI_ZAI_ROUTE='coding';
  if(!live){
    process.env.TORI_ZAI_API_KEY='synthetic-a1-fixture';
    process.env.TORI_EXECUTION_FIXTURE='a1-request-capture';
    process.env.TORI_ENABLE_PI_ZAI='0';
    globalThis.fetch=async(url,init)=>{
      assert.equal(String(url),'https://api.z.ai/api/coding/paas/v4/chat/completions');
      const body=JSON.parse(init.body);
      assert.equal(body.model,'glm-5.3-flash');
      assert.ok(!body.tools?.length);
      capture.push({temperature:body.temperature,topP:body.top_p});
      if(mode==='deadline')await setTimeout(30000,undefined,{signal:init.signal});
      if(mode==='retry'||(mode==='retry-success'&&++retrySuccessAttempts===1))
        return Response.json({error:{code:'1302'}},{status:429});
      const chunks=mode==='tool'?[
        {choices:[{index:0,delta:{role:'assistant',tool_calls:[{
          index:0,id:'forbidden-call',type:'function',function:{name:'protected_write',arguments:'{}'},
        }]},finish_reason:null}]},
        {choices:[{index:0,delta:{},finish_reason:'tool_calls'}]},
      ]:[
        {choices:[{index:0,delta:{role:'assistant',content:'Synthetic A2 answer.'},finish_reason:null}]},
        {choices:[{index:0,delta:{},finish_reason:'stop'}]},
      ];
      return new Response(chunks.map(chunk=>'data: '+JSON.stringify({
        id:'a2-fixture',object:'chat.completion.chunk',created:1,model:body.model,...chunk
      })).join('\n\n')+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
    };
  }
  try{
    service=start();
    const {history,emptyAssembly,add,change,wire,modelId}=assembly;
    const graph=history(emptyAssembly());
    const edit=(...ops)=>assert.equal(graph.apply(ops).ok,true);
    edit(add('agent'),add('model'),change('agent','instructions','Answer with one short sentence.'),
      change('model','model',modelId),wire('model','model'));
    let revision;
    const save=async()=>{
      revision=(await service.dispatch('/save',{graph:graph.graph,expected:revision})).revision;
      return revision;
    };
    const activate=async()=>{
      const {activation}=await service.dispatch('/activate',{revision});
      return (await service.dispatch('/sessions',{activation:activation.version})).sessions[0];
    };
    const send=async(session)=>(await service.dispatch('/turn',{session:session.id,input:'Acknowledge this synthetic check.'})).runs[0];
    if(live){
      assert.equal((await service.dispatch('',{})).provider,true,'Permitted Coding credential unavailable');
      edit(change('model','temperature',0.4),change('model','topP',0.8));
      await save();
      const run=await send(await activate());
      assert.equal(run.status,'completed',JSON.stringify({status:run.status,errorCode:run.errorCode,events:run.events}));
      assert.equal(run.sentTemperature,0.4);
      assert.equal(run.sentTopP,0.8);
      assert.equal(run.sentMaxOutputTokens,4096);
      console.log(JSON.stringify({route:run.route,model:run.observedModel,status:run.status,
        sentTemperature:run.sentTemperature,sentTopP:run.sentTopP,sentMaxOutputTokens:run.sentMaxOutputTokens,
        providerAttempts:run.providerAttempts,http:run.events.find(event=>event.label.startsWith('Z.AI HTTP'))?.label}));
      return;
    }
    await save();
    const original=await activate();
    const defaults=await send(original);
    assert.equal(defaults.status,'completed');
    assert.deepEqual(capture.at(-1),{temperature:undefined,topP:undefined});
    for(const [id,key,value,issue] of [
      ['model','temperature',1.1,/temperature/],['model','topP',0,/top-p/],
      ['agent','maxSteps',5,/step limit/],['agent','maxRetries',2,/retries/],
    ]){
      edit(change(id,key,value));
      await save();
      await assert.rejects(service.dispatch('/activate',{revision}),issue);
      edit(change(id,key,undefined));
    }
    assert.equal(capture.length,1);
    edit(change('model','temperature',0.4),change('model','topP',0.8),change('agent','maxSteps',2),change('agent','maxRetries',1));
    await save();
    process.env.TORI_ZAI_ROUTE='general';
    await assert.rejects(service.dispatch('/activate',{revision}),/supported Coding route/);
    process.env.TORI_ZAI_ROUTE='coding';
    const updated=await activate();
    const configured=await send(updated);
    assert.equal(configured.status,'completed');
    assert.deepEqual(configured.execution,{temperature:0.4,topP:0.8,maxSteps:2,maxRetries:1,maxToolCalls:0,deadlineMs:90000});
    assert.deepEqual(capture.at(-1),{temperature:0.4,topP:0.8});
    await service.close();
    service=start(1500);
    assert.equal((await service.dispatch('',{})).hostDeadlineMs,1500);
    const restored=await send(original);
    assert.equal(restored.activation,original.activation);
    assert.equal(restored.execution.deadlineMs,1500);
    assert.deepEqual(capture.at(-1),{temperature:undefined,topP:undefined});
    mode='deadline';
    const cancelled=await send(updated);
    assert.equal(cancelled.status,'cancelled');
    assert.equal(cancelled.errorCode,'TORI_TURN_DEADLINE');
    assert.equal(cancelled.providerAttempts,1);
    await assert.rejects(send(updated),/interrupted/);
    await service.close();
    service=start();
    mode='retry';
    const withoutRetry=await send(original);
    assert.equal(withoutRetry.status,'failed');
    assert.equal(withoutRetry.providerAttempts,1);
    const retrySession=await activate();
    const retried=await send(retrySession);
    assert.equal(retried.status,'failed');
    assert.equal(retried.providerAttempts,2);
    mode='retry-success';
    const recovered=await send(await activate());
    assert.equal(recovered.status,'completed');
    assert.equal(recovered.providerAttempts,2);
    assert.equal(recovered.errorCode,undefined);
    assert.ok(recovered.events.some(event=>event.label==='Fixture HTTP 200'));
    mode='tool';
    const refused=await send(await activate());
    assert.equal(refused.status,'failed');
    assert.equal(refused.execution.maxToolCalls,0);
    assert.equal(refused.providerAttempts,2);
    assert.equal(capture.length,11);
  }finally{
    globalThis.fetch=originalFetch;
    await service?.close();
    await vite.close();
  }
});
