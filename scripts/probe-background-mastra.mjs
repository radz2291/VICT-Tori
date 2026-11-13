import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { mkdtemp, readFile, appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { createDurableAgent } from '@mastra/core/agent/durable';
import { createTool } from '@mastra/core/tools';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { z } from 'zod';
import { createDeterministicOfflineModel } from '@victframework/mastra';

const awaitIt = (promise, label, ms=12000) => Promise.race([
  promise, delay(ms, undefined, {ref:false}).then(()=>{throw Error('Timeout: '+label);}),
]);
const out = (probe, data)=>console.log(JSON.stringify({probe,...data}));
const waitUntil = async check=>{
  for(let i=0;i<100;i++){const result=await check();if(result)return result;await delay(50);}
  throw Error('Probe boundary did not arrive');
};
const retention={lastMessages:10,workingMemory:{enabled:false},semanticRecall:false};
const modelFor=(callback=async()=>{}, tools={})=>{
  const base=createDeterministicOfflineModel({script:tools});
  return {...base,async doStream(opts){
    await callback(opts);
    const input=opts.prompt.findLast(x=>x.role==='user')?.content?.map?.(x=>x.text??'').join('')??'';
    if(!Object.hasOwn(tools,input)){
      return createDeterministicOfflineModel({script:{[input]:{kind:'text',text:'Synthetic result for '+input}}}).doStream(opts);
    }
    return base.doStream(opts);
  }};
};
const memoryAddress={thread:'synthetic-thread',resource:'synthetic-resource'};
async function setup(path,model,tool,mode='durable'){
  const storage=new LibSQLStore({id:'probe-libsql',url:'file:'+join(path,'mastra.sqlite').replaceAll('\\','/')});
  const agent=new Agent({id:'background-probe',name:'Background probe',instructions:'Synthetic conformance only.',model,
    memory:new Memory({storage,options:retention}),...(tool?{tools:{hold:tool}}:{})});
  const configured=mode==='durable'?createDurableAgent({agent,cleanupTimeoutMs:0}):agent;
  const mastra=new Mastra({storage,agents:{probe:configured}});
  return {agent:configured,mastra,storage};
}
const options=runId=>({runId,memory:memoryAddress,maxSteps:3,maxRetries:0});
async function child(mode,path,runId) {
  const capture=join(path,'effect.ndjson');
  const tool=createTool({id:'hold',description:'Synthetic non-idempotent counter with an optional pause.',
    inputSchema:z.object({}),suspendSchema:z.object({waiting:z.boolean()}),resumeSchema:z.object({approved:z.boolean()}),
    execute:async(_input,ctx)=>{
      const resumed=ctx.agent?.resumeData?.approved??false;
      await appendFile(capture,JSON.stringify({pid:process.pid,runId,stage:resumed?'resumed':'entry'})+'\n');
      if(mode==='park'&&!resumed)return ctx.agent.suspend({waiting:true});
      if(mode==='start'){
        process.send({stage:'effect-before-return',runId,pid:process.pid});
        await delay(60000,undefined,{signal:ctx.abortSignal});
      }
      return {counted:true};
    }});
  const script={effect:{kind:'tool-call',toolName:'hold',args:{},thenText:'Synthetic settled result.'}};
  const {agent}=await setup(path,modelFor(undefined,script),tool,mode==='plain'?'plain':'durable');
  if(mode==='park'){
    const result=await agent.generate('effect',options(runId));
    const snapshot=await agent.listSuspendedRuns({threadId:memoryAddress.thread,resourceId:memoryAddress.resource});
    process.send({stage:'parked',runId:result.runId,finish:result.finishReason,suspended:snapshot.runs.map(x=>x.runId)});
  }else if(mode==='start'){

    const run=await agent.stream('effect',options(runId));
    const kinds=[];
    for await(const item of run.fullStream)kinds.push(item.type);

    const suspended=await agent.listSuspendedRuns({threadId:memoryAddress.thread,resourceId:memoryAddress.resource});
    process.send({stage:'parked',runId:run.runId,kinds,suspended:suspended.runs?.map(x=>x.runId)??suspended});
  }else if(mode==='recover'){
    const active=await agent.listActiveRuns({threadId:memoryAddress.thread,resourceId:memoryAddress.resource});
    const recovered=await awaitIt(agent.recoverActiveRuns({runId}),'raw Mastra orphan recovery',22000).catch(e=>({error:e.message}));
    process.send({stage:'recovered',active:active.runs.map(({runId,status})=>({runId,status})),
      recovered:recovered.recovered?.map(({runId,status,error})=>({runId,status,error:error?.message}))??recovered});
  }else if(mode==='resume'){
    const before=await agent.listSuspendedRuns({threadId:memoryAddress.thread,resourceId:memoryAddress.resource});
    const result=await agent.resume(runId,{approved:true});
    const kinds=[];
    for await(const item of result.fullStream)kinds.push(item.type);
    process.send({stage:'resumed',runId:result.runId,before:before.runs?.map(x=>x.runId)??before,
      kinds,text:await result.output.text});
  }
}
if(process.argv[2]){
  const hold=setInterval(()=>{},1000);
  try{await child(...process.argv.slice(2));}
  catch(e){process.send({stage:'error',message:e.message,stack:e.stack});}
  clearInterval(hold);
  if(process.argv[2]!=='start'){process.disconnect();process.exit(0);}
}else{
  const nodeVersion=process.version, versions={};
  for(const name of ['@mastra/core','@mastra/libsql','@mastra/memory','@victframework/mastra','@victframework/runtime','@victframework/store-sqlite','@victframework/control','@victframework/contracts']){
    versions[name]=JSON.parse(await readFile(new URL('../node_modules/'+name+'/package.json',import.meta.url),'utf8')).version;
  }
  assert.deepEqual(Object.values(versions),['1.64.0','1.22.3','1.28.2',...Array(5).fill('0.4.0-rc.1')]);
  out('versions',{nodeVersion,versions});
  const path=await mkdtemp(join(tmpdir(),'tori-007-mastra-probe-'));
  let count=0;
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  const {agent,mastra}=await setup(path,modelFor(async opts=>{
    count++;
    const cancelled=new Promise((_,reject)=>opts.abortSignal?.addEventListener('abort',()=>reject(opts.abortSignal.reason),{once:true}));
    await Promise.race([gate,cancelled]);
  }));
  const run=await agent.stream('detach',options(randomUUID()));
  await waitUntil(()=>count===1);
  const reader=run.fullStream.getReader();
  await awaitIt(reader.cancel(),'subscriber detach');
  const subscriber=await agent.observe(run.runId,{idleTimeoutMs:4000});
  const drain=(async()=>{const events=[];for await(const item of subscriber.fullStream)events.push(item.type);return events;})();
  release();
  const kinds=await awaitIt(drain,'observe');
  const text=await awaitIt(subscriber.output.text,'observed result');
  assert.equal(subscriber.runId,run.runId);
  assert.equal(count,1);
  assert.match(text,/detach/);
  out('raw Mastra detach',{runId:run.runId,modelDispatches:count,events:kinds,text});
  await delay(250);
  await mastra.shutdown();

  const cancelPath=await mkdtemp(join(tmpdir(),'tori-007-mastra-cancel-'));
  let dispatches=0,aborted=false;
  const cancellation=await setup(cancelPath,modelFor(async opts=>{
    dispatches++;
    try{await delay(60000,undefined,{signal:opts.abortSignal});}
    catch(e){aborted=opts.abortSignal.aborted;throw e;}
  }));
  const toCancel=await cancellation.agent.stream('cancel',options(randomUUID()));
  const observed=await cancellation.agent.observe(toCancel.runId,{idleTimeoutMs:4000});
  const ended=(async()=>{const events=[];for await(const item of observed.fullStream)events.push(item.type);return events;})();
  await waitUntil(()=>dispatches===1);
  await observed.abort();
  const events=await awaitIt(ended,'cancel terminal');
  assert.equal(aborted,true);
  assert.equal(dispatches,1);
  out('raw Mastra cancel',{runId:toCancel.runId,dispatches,providerSignalAborted:aborted,events});
  await delay(250);
  await cancellation.mastra.shutdown();

  const signalPath=await mkdtemp(join(tmpdir(),'tori-007-mastra-signal-'));
  const prompts=[];
  const signalHost=await setup(signalPath,modelFor(async opts=>prompts.push(JSON.stringify(opts.prompt))),undefined,'plain');
  const target={threadId:memoryAddress.thread,resourceId:memoryAddress.resource};
  const discard=signalHost.agent.sendSignal({id:randomUUID(),type:'reactive',contents:'Discard synthetic signal'},{...target,ifIdle:{behavior:'discard'}});
  const dropped=await discard.accepted;
  const signal=signalHost.agent.sendSignal({id:randomUUID(),type:'reactive',contents:'Synthetic signal wake'},{
    ...target,ifIdle:{behavior:'wake',streamOptions:{maxSteps:1,maxRetries:0}},
  });
  const accepted=await awaitIt(signal.accepted,'signal accepted');
  assert.equal(dropped.action,'discard');
  assert.equal(accepted.action,'wake');
  await awaitIt(accepted.output.text,'signal wake result');
  assert.ok(prompts.some(x=>x.includes('Synthetic signal wake')));
  assert.equal(prompts.length,1);
  out('raw Mastra signals',{signalId:signal.signal.id,action:accepted.action,runId:accepted.runId,modelReceived:true,
    discardId:discard.signal.id,discardAction:dropped.action});
  // The synthetic plain agent owns no background execution after its result is consumed.

  const launch=(mode,dir,id)=>fork(fileURLToPath(import.meta.url),[mode,dir,id],{stdio:['ignore','inherit','inherit','ipc']});
  const invoke=async(mode,dir,id)=>{
    const proc=launch(mode,dir,id);
    const exited=once(proc,'exit');
    const [result]=await Promise.race([awaitIt(once(proc,'message'),mode,27000),exited.then(([code])=>{throw Error(mode+' exited before evidence: '+code);})]);
    if(mode==='start'||result.stage==='error')proc.kill();
    await awaitIt(exited,mode+' exit');
    return {...result,exitPid:proc.pid};
  };
  const readEffects=async dir=>(await readFile(join(dir,'effect.ndjson'),'utf8')).trim().split('\n').map(JSON.parse);
  const parkDir=await mkdtemp(join(tmpdir(),'tori-007-mastra-suspend-'));
  const suspendedId=randomUUID();
  const parked=await invoke('park',parkDir,suspendedId);
  const resumed=parked.stage==='parked'?await invoke('resume',parkDir,suspendedId):null;
  out('raw Mastra suspended checkpoint across process',{runId:suspendedId,parked,resumed,calls:await readEffects(parkDir).catch(()=>[])});

  const recoverDir=await mkdtemp(join(tmpdir(),'tori-007-mastra-recover-'));
  const recoveredId=randomUUID();
  const started=await invoke('start',recoverDir,recoveredId);
  const recovered=started.stage==='effect-before-return'?await invoke('recover',recoverDir,recoveredId):null;
  out('raw Mastra active crash after counter entry',{runId:recoveredId,started,recovered,calls:await readEffects(recoverDir).catch(()=>[])});
}
