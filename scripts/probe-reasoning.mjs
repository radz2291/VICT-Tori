import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Agent } from '@mastra/core/agent';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { AGENT_STREAM_SCHEMA, validateAgentStreamEvent } from '@victframework/contracts';
import { AgentProfileRegistry, pinAgentTurnRunner } from '@victframework/runtime';
import { createDedicatedMastraStore, MastraProductAgent, MastraThreadCoordinator,
  mastraThreadIdForConversation, MASTRA_ADAPTER_COMPATIBILITY } from '@victframework/mastra';

const live=process.argv.includes('--live');
const effort=process.argv.includes('--effort=low')?'low':undefined;
const endpoint='https://api.z.ai/api/coding/paas/v4/chat/completions';
const modelId='glm-5.3-flash';
const canary='synthetic-reasoning-canary';
const output='Fixture public answer.';
const chunks=[
  {choices:[{index:0,delta:{role:'assistant',reasoning_content:canary},finish_reason:null}]},
  {choices:[{index:0,delta:{content:output},finish_reason:null}]},
  {choices:[{index:0,delta:{},finish_reason:'stop'}]},
  {choices:[],usage:{prompt_tokens:5,completion_tokens:9,total_tokens:14}},
];
const sse=()=>new Response(chunks.map(chunk=>'data: '+JSON.stringify({
  id:'synthetic-turn',object:'chat.completion.chunk',created:1,model:modelId,...chunk
})).join('\n\n')+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
const requestModel=(fetch)=>createOpenAICompatible({
  name:'zai',baseURL:'https://api.z.ai/api/coding/paas/v4',fetch,
}).chatModel(modelId);
async function mastraKinds(model){
  // Standalone Agent: no memory, telemetry exporter or payload capture.
  const agent=new Agent({id:'r-vis-01',name:'Reasoning probe',instructions:'Answer briefly.',model});
  const result=await agent.stream('Find the least positive integer divisible by both 8 and 21 whose digits sum to 15. Verify it and explain briefly.',{
    maxSteps:1, modelSettings:{maxOutputTokens:4096,maxRetries:0},
  });
  const kinds=new Set();
  for await(const item of result.fullStream)kinds.add(item.type);
  return [...kinds];
}
const fixtureMastra=await mastraKinds(requestModel(async()=>sse()));
for(const type of ['reasoning-start','reasoning-delta','reasoning-end','text-delta'])assert.ok(fixtureMastra.includes(type),type);
const registry=new AgentProfileRegistry();
const instructions={id:'probe-instructions',revision:'1'},memory={id:'probe-memory',revision:'1'};
registry.installArtifacts([
  {kind:'instructions',...instructions,text:'Answer briefly.'},
  {kind:'memory-policy',...memory,config:{lastMessages:false,workingMemory:{enabled:false},semanticRecall:false}},
]);
registry.registerProfile({schema:'vict.agent-profile@1',id:'probe-agent',revision:'1',instructions,memoryPolicy:memory,
  modelProfile:{id:'probe-model',revision:'1',routerModel:'zai/'+modelId,provider:'zai'},
  generation:{maxOutputTokens:4096,maxRetries:0},turnPolicy:{maxSteps:1,maxToolCalls:0,onLimit:'fail-closed'},
  adapter:MASTRA_ADAPTER_COMPATIBILITY});
const activation=registry.activateAgentProfile({id:'probe-agent',revision:'1'});
const dataDir=await mkdtemp(join(tmpdir(),'tori-r-vis-01-synthetic-'));
const storage=await createDedicatedMastraStore({dataDir,retention:{messagesMaxAgeMs:86400000,threadsMaxAgeMs:86400000,spansMaxAgeMs:86400000}});
try {
  const adapter=MastraProductAgent.create(activation,{store:storage.store,modelFactory:()=>requestModel(async()=>sse()),
    threadCoordinator:new MastraThreadCoordinator(),tracing:{sampling:{type:'never'}}});
  const events=[];
  const outcome=await pinAgentTurnRunner(adapter,activation).runTurn({
    turnId:randomUUID(),threadId:mastraThreadIdForConversation(randomUUID()),actorId:'probe-actor',input:'Return the public fixture answer.',
  },{onEvent:event=>{events.push(event);}});
  await adapter.flush();
  assert.equal(outcome.status,'completed');
  assert.equal(outcome.text,output);
  assert.ok(events.every(event=>validateAgentStreamEvent(event).ok));
  assert.doesNotMatch(JSON.stringify(events),new RegExp(canary));
  assert.ok(events.some(event=>event.kind==='text.delta'));
  assert.ok(!events.some(event=>event.kind.startsWith('reasoning.')));
  const base=events.find(event=>event.kind==='response.started');
  const rejected=['reasoning.started','reasoning.completed','reasoning.summary'].map(kind=>{
    const result=validateAgentStreamEvent({...base,kind});assert.equal(result.ok,false);return kind;
  });
  console.log(JSON.stringify({fixture:{mastra:fixtureMastra,vict:[...new Set(events.map(e=>e.kind))],contract:AGENT_STREAM_SCHEMA,rejected}},null,2));
}finally{await storage.close();}
if(live){
  const key=process.env.TORI_ZAI_API_KEY;
  if(!key)throw new Error('Explicitly enable the approved Z.AI test credential.');
  const evidence={providerFields:[]};
  const observed=new Set();
  function observe(response){
    const decoder=new TextDecoder();
    let tail='';
    const inspect=line=>{
      if(!line.startsWith('data:')||line.trim()==='data: [DONE]')return;
      try{
        const event=JSON.parse(line.slice(5));
        for(const choice of event.choices??[]){
          const delta=choice.delta??{};
          for(const name of ['reasoning_content','reasoning','thinking','content']){
            if(typeof delta[name]==='string'&&delta[name].length)observed.add(name);
          }
        }
      }catch{/* Unrecognized provider payload is not recorded. */}
    };
    const body=response.body.pipeThrough(new TransformStream({
      transform(chunk,controller){
        const lines=(tail+decoder.decode(chunk,{stream:true})).split('\n');
        tail=lines.pop()??'';
        lines.forEach(inspect);
        controller.enqueue(chunk);
      },
      flush(){inspect(tail+decoder.decode());},
    }));
    return new Response(body,{status:response.status,headers:response.headers});
  }
  try{
    const kinds=await mastraKinds(requestModel(async(url,init)=>{
      if(String(url)!==endpoint)throw new Error('Provider route denied.');
      const body=JSON.parse(init.body);
      if(body.model!==modelId || body.tools?.length)throw new Error('Provider model denied.');
      if(effort)body.reasoning_effort=effort;
      evidence.sent={model:body.model,reasoningEffort:body.reasoning_effort??null,maxOutputTokens:body.max_tokens};
      const headers=new Headers(init.headers);headers.set('Authorization','Bearer '+key);
      const response=await fetch(endpoint,{...init,headers,body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(60000)});
      evidence.http=response.status;
      if(!response.ok)throw new Error('Provider rejected the probe.');
      return observe(response);
    }));
    evidence.providerFields=[...observed];
    assert.equal(evidence.http,200);
    assert.ok(kinds.includes('text-delta'));
    console.log(JSON.stringify({live:{...evidence,mastra:kinds}},null,2));
  }catch{console.error(JSON.stringify({live:{...evidence,status:'probe did not complete'}}));process.exitCode=1;}
}
