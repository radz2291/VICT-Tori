import { randomUUID } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { AgentProfileRegistry, pinAgentTurnRunner, validateAgentActivationRecord } from '@victframework/runtime';
import { createDedicatedMastraStore, MastraProductAgent, MastraThreadCoordinator, mastraThreadIdForConversation, MASTRA_ADAPTER_COMPATIBILITY } from '@victframework/mastra';

const provider='zai';
const model='glm-5.3-flash';
const endpoints={general:'https://api.z.ai/api/paas/v4',coding:'https://api.z.ai/api/coding/paas/v4'};
const selectedRoute=()=>process.env.TORI_ZAI_ROUTE==='coding'?'coding':'general';
const actor='tori-local-owner';
const now=()=>new Date().toISOString();
const codes={
  '1113':'Z.AI reports no available balance or resource package (1113). Check the selected connection.',
  '1000':'Z.AI rejected authentication (1000). Check the server credential.',
  '1211':'Z.AI did not recognize the configured model (1211).',
  '1302':'Z.AI rate limited this request (1302). Wait before sending another message.',
};
class StudioError extends Error {constructor(status,message){super(message);this.status=status;}}
const conflict=(message)=>new StudioError(409,message);
function credential(routeName=selectedRoute()) {
  if(routeName!==selectedRoute())return undefined;
  if(process.env.TORI_ZAI_API_KEY?.trim())return process.env.TORI_ZAI_API_KEY.trim();
  if(process.env.TORI_ENABLE_PI_ZAI!=='1')return undefined;
  const dir=join(homedir(),'.pi','agent');
  try {
    const models=JSON.parse(readFileSync(join(dir,'models.json'),'utf8'));
    const route=models.providers?.['zai-key1'];
    if(route?.baseUrl!==endpoints[routeName])return undefined;
    let auth;
    try{auth=JSON.parse(readFileSync(join(dir,'auth.json'),'utf8'))?.['zai-key1'];}catch{}
    const key=auth?.type==='api_key'?auth.key:route.apiKey;
    return typeof key==='string'&&/^[A-Za-z0-9._-]{12,500}$/.test(key)?key:undefined;
  }catch{return undefined;}
}
function activationFor(revision,value,route,record) {
  const registry=new AgentProfileRegistry();
  const instructionRef={id:'tori-instructions',revision:revision.id};
  const memoryRef={id:'tori-conversation-memory',revision:'1'};
  registry.installArtifacts([
    {kind:'instructions',...instructionRef,text:value.instructions},
    {kind:'memory-policy',...memoryRef,config:{lastMessages:100,workingMemory:{enabled:false},semanticRecall:false}},
  ]);
  registry.registerProfile({schema:'vict.agent-profile@1',id:'tori-local-agent',revision:revision.id,
    instructions:instructionRef,memoryPolicy:memoryRef,modelProfile:{id:'zai-glm-flash',revision:'1-'+route,routerModel:provider+'/'+model,provider},
    generation:{maxOutputTokens:value.tokens,maxRetries:0},turnPolicy:{maxSteps:1,maxToolCalls:0,onLimit:'fail-closed'},
    adapter:MASTRA_ADAPTER_COMPATIBILITY});
  if(!record)return registry.activateAgentProfile({id:'tori-local-agent',revision:revision.id});
  const restored=registry.restoreActivation(record);
  if(!restored.ok)throw conflict('The original VICT activation could not be restored.');
  return restored.activation;
}
// The provider may return private reasoning in its protocol. Strip it before
// Mastra can observe, retain or deliver it, while preserving text and usage.
function publicProviderStream(response) {
  if(!response.body || !response.headers.get('content-type')?.includes('text/event-stream'))return response;
  let tail='';
  const decoder=new TextDecoder(),encoder=new TextEncoder();
  const redact=line=>{
    if(!line.startsWith('data:')||line.trim()==='data: [DONE]')return line;
    try {
      const parsed=JSON.parse(line.slice(5));
      const choices=parsed.choices?.map(c=>{
        const sanitize=value=>{
          if(!value)return value;
          const {reasoning_content,reasoning,thinking,...publicParts}=value;
          return publicParts;
        };
        return {...c,...(c.delta?{delta:sanitize(c.delta)}:{}),...(c.message?{message:sanitize(c.message)}:{})};
      });
      return 'data: '+JSON.stringify({...parsed,...(choices?{choices}:{})});
    }catch{return 'data: {"error":{"message":"Invalid provider event"}}';}
  };
  const body=response.body.pipeThrough(new TransformStream({
    transform(chunk,controller) {
      const lines=(tail+decoder.decode(chunk,{stream:true})).split('\n');
      tail=lines.pop()??'';
      controller.enqueue(encoder.encode(lines.map(redact).join('\n')+(lines.length?'\n':'')));
    },
    flush(controller){const rest=tail+decoder.decode();if(rest)controller.enqueue(encoder.encode(redact(rest)));},
  }));
  return new Response(body,{status:response.status,headers:{'Content-Type':'text/event-stream'}});
}
function providerModel(key, route, evidence) {
  const endpoint=endpoints[route];
  return createOpenAICompatible({
    name:provider,baseURL:endpoint,supportsStructuredOutputs:false,
    fetch:async (url,init)=>{
      if(String(url)!==endpoint+'/chat/completions')throw new Error('TORI_PROVIDER_ROUTE_DENIED');
      const headers=new Headers(init?.headers);headers.set('Authorization','Bearer '+key);
      const body=JSON.parse(init.body);
      if(Number.isInteger(body.max_tokens))evidence.sentMaxOutputTokens=body.max_tokens;
      if(body.model!==model || body.tools?.length)throw new Error('TORI_PROVIDER_MODEL_DENIED');
      const reply=await fetch(url,{...init,headers,redirect:'error'});
      evidence.http=reply.status;
      if(!reply.ok){
        const error=await reply.json().catch(()=>null);
        const code=String(error?.error?.code??'');
        evidence.code=/^\d{4}$/.test(code)?code:undefined;
        // SDK errors must not carry raw provider text.
        return new Response(JSON.stringify({error:{message:'Z.AI rejected the request.',type:'provider_error',code:evidence.code}}),
          {status:reply.status,headers:{'Content-Type':'application/json'}});
      }
      return publicProviderStream(reply);
    }
  }).chatModel(model);
}

export function createStudio({getAssembly,dataDirectory}) {
  const dir=resolve(dataDirectory);mkdirSync(dir,{recursive:true});
  const db=new DatabaseSync(join(dir,'studio.sqlite'));
  db.exec("PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS project (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");
  const read=db.prepare('SELECT value FROM project WHERE id=1');
  const write=db.prepare('INSERT INTO project VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET value=excluded.value');
  const snapshot=()=>JSON.parse(read.get()?.value??'{"drafts":[],"activations":[],"sessions":[],"runs":[]}');
  const store=(state)=>write.run(JSON.stringify(state));
  const old=snapshot();
  for(const run of old.runs.filter(r=>r.status==='running')){
    run.status='interrupted';run.message='Studio restarted before the turn result was confirmed. It was not replayed.';
    run.events.push({at:now(),label:'Interrupted · no replay'});
    const session=old.sessions.find(s=>s.id===run.session);
    if(session)session.interrupted=true;
  }
  store(old);
  let busy=false;
  let storage;
  const threads=new MastraThreadCoordinator();
  const projection=(state)=>{
    const saved=state.drafts[0];const active=state.activations[0];
    return {graph:saved?.graph??null,revision:saved&&{id:saved.id,number:saved.number},
      activation:active&&{version:active.record.activationVersion,revision:active.revision,number:active.number,name:active.name,route:active.route},
      sessions:state.sessions.map(s=>({...s,connectionReady:!!credential(s.route??'general')})),runs:state.runs,provider:!!credential(),route:selectedRoute()};
  };
  async function dispatch(path,input){
    if(path==='')return projection(snapshot());
    const assembly=await getAssembly();
    const state=snapshot();
    const saved=state.drafts[0];
    if(path==='/save'){
      if((input.expected?.id??null)!==(saved?.id??null))throw conflict('A newer draft exists. Reload it before saving again.');
      let graph;
      try{graph=assembly.checkedAssembly(input.graph);}catch{throw new StudioError(400,'The graph contains an unsupported node or connection.');}
      state.drafts.unshift({id:randomUUID(),number:(saved?.number??0)+1,graph});
    } else if(path==='/activate'){
      if(!saved||input.revision?.id!==saved.id)throw conflict('Save and reopen the current revision before activation.');
      const issue=assembly.readiness(saved.graph);if(issue)throw conflict(issue);
      if(state.activations[0]?.revision===saved.id&&state.activations[0]?.route===selectedRoute())return projection(state);
      const value=assembly.resolved(saved.graph);
      const route=selectedRoute();
      const activation=activationFor(saved,value,route);
      const record={recordSchema:'vict.agent-activation-record@1',activationVersion:activation.activationVersion,
        agentProfileVersion:activation.agentProfileVersion,agentId:'tori-local-agent',agentRevision:saved.id,
        canonicalManifest:activation.canonicalManifestJson,artifacts:activation.artifactList,createdAt:activation.createdAt};
      if(!validateAgentActivationRecord(record).ok)throw conflict('VICT rejected the activation record.');
      state.activations.unshift({record,route,revision:saved.id,number:saved.number,name:value.name});
    } else if(path==='/sessions'){
      const activation=state.activations.find(a=>a.record.activationVersion===input.activation);
      if(!activation)throw conflict('Activate a saved Agent first.');
      state.sessions.unshift({id:randomUUID(),created:now(),name:activation.name,number:activation.number,route:activation.route,activation:input.activation,messages:[]});
    } else if(path==='/turn'){
      const session=state.sessions.find(s=>s.id===input.session);
      const key=credential(session?.route);
      if(!session)throw new StudioError(404,'This Session was not found.');
      if(session.interrupted)throw conflict('This Session was interrupted. Open a new Session to avoid replaying an uncertain turn.');
      if(!key)throw conflict('Connect a Z.AI credential for this Session pinned pinned route on the local server.');
      if(busy)throw conflict('A turn is already running. Wait for it to finish.');
      const text=typeof input.input==='string'?input.input.trim():'';
      if(!text||text.length>12000)throw new StudioError(400,'Enter a message between 1 and 12,000 characters.');
      const pin=state.activations.find(a=>a.record.activationVersion===session.activation);
      const revision=state.drafts.find(d=>d.id===pin?.revision);
      if(!revision)throw conflict('The pinned revision is unavailable.');
      const value=assembly.resolved(revision.graph);
      const activation=activationFor(revision,value,pin.route??'general',pin.record);
      const run={id:randomUUID(),session:session.id,activation:session.activation,revision:revision.id,number:revision.number,name:session.name,
        provider,model,route:pin.route??'general',tokens:value.tokens,started:now(),status:'running',events:[]};
      run.events.push({at:run.started,label:'Turn accepted by Studio'});
      session.messages.push({id:run.id+'-user',role:'user',text});
      state.runs.unshift(run);store(state);
      busy=true;
      const evidence={};
      const eventTimes=new Map();
      try {
        storage??=await createDedicatedMastraStore({dataDir:dir,retention:{messagesMaxAgeMs:2592000000,threadsMaxAgeMs:2592000000,spansMaxAgeMs:86400000}});
        const adapter=MastraProductAgent.create(activation,{store:storage.store,modelFactory:()=>providerModel(key,run.route,evidence),
          threadCoordinator:threads,tracing:{sampling:{type:'never'}}});
        const outcome=await pinAgentTurnRunner(adapter,activation).runTurn({turnId:run.id,threadId:mastraThreadIdForConversation(session.id),actorId:actor,input:text},
          {abortSignal:AbortSignal.timeout(90000),victRunId:run.id,onEvent:event=>{eventTimes.set(event.seq,now());}});
        await adapter.flush();
        run.status=outcome.status==='completed'&&!outcome.text?.trim()?'failed':outcome.status;
        run.usage=outcome.usage;
        run.observedModel=evidence.http===200?outcome.providerModelIdentity:undefined;
        for(const event of outcome.events){
          if(['response.started','response.completed','response.failed','response.cancelled','usage.updated'].includes(event.kind))
            run.events.push({at:eventTimes.get(event.seq)??now(),label:'VICT · '+event.kind});
        }
        if(run.status==='completed')session.messages.push({id:run.id+'-agent',role:'assistant',text:outcome.text});
        else run.message=codes[evidence.code]??'The provider response did not complete. Inspect this run before sending again.';
        run.errorCode=evidence.code??outcome.errorCode;
      } catch {
        run.status='failed';run.errorCode=evidence.code;run.message=codes[evidence.code]??'Studio could not confirm the model response. No automatic replay was attempted.';
        if(evidence.http===200)session.interrupted=true;
      } finally {busy=false;}
      run.sentMaxOutputTokens=evidence.sentMaxOutputTokens;
      run.ended=now();
      if(evidence.http)run.events.push({at:run.ended,label:'Z.AI HTTP '+evidence.http+(evidence.code?' · '+evidence.code:'')});
      run.events.push({at:run.ended,label:'Turn '+run.status});
      const latest=snapshot();
      latest.runs=latest.runs.map(r=>r.id===run.id?run:r);
      latest.sessions=latest.sessions.map(s=>s.id===session.id?session:s);
      store(latest);
      return projection(latest);
    } else throw new StudioError(404,'Unknown Studio operation.');
    store(state);
    return projection(state);
  }
  return {dispatch,close:async()=>{await storage?.close();db.close();}};
}
