import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { AgentProfileRegistry, AgentStreamHub, authenticatedActorContext } from '@victframework/runtime';
import { createSqliteAgentControlStores } from '@victframework/store-sqlite';
import { composeMastraTurnExecutor, createDedicatedMastraStore, createDeterministicOfflineModel,
  MASTRA_ADAPTER_COMPATIBILITY, MastraThreadCoordinator } from '@victframework/mastra';

const dir=await mkdtemp(join(tmpdir(),'tori-007-vict-probe-'));
const memory=await createDedicatedMastraStore({dataDir:dir,retention:{messagesMaxAgeMs:60000,threadsMaxAgeMs:60000,spansMaxAgeMs:60000}});
const path=join(dir,'control.sqlite');
let stores=createSqliteAgentControlStores({path});
const actorId='synthetic-operator';
const threadId='vict-conv-'+randomUUID();
await stores.actors.upsert({actorId,roles:['developer'],status:'active',createdAt:0});
const actor=authenticatedActorContext(await stores.actors.get(actorId),actorId);
const instructions={id:'fixture.instructions',revision:'1'},memoryPolicy={id:'fixture.memory',revision:'1'};
const registry=new AgentProfileRegistry();
registry.installArtifacts([{kind:'instructions',...instructions,text:'Synthetic probe.'},
  {kind:'memory-policy',...memoryPolicy,config:{lastMessages:10,workingMemory:{enabled:false},semanticRecall:false}}]);
registry.registerProfile({schema:'vict.agent-profile@1',id:'fixture.agent',revision:'1',instructions,memoryPolicy,
  modelProfile:{id:'fixture.model',revision:'1',routerModel:'offline-fixture/deterministic-1',provider:'offline-fixture'},
  generation:{maxRetries:0},turnPolicy:{maxSteps:1,maxToolCalls:0,onLimit:'fail-closed'},adapter:MASTRA_ADAPTER_COMPATIBILITY});
const activation=registry.activateAgentProfile({id:'fixture.agent',revision:'1'});
const ids={turnId:randomUUID,streamId:randomUUID,invocationId:randomUUID,approvalId:randomUUID,idempotencyKey:randomUUID,cancelId:randomUUID};
const hub=new AgentStreamHub({ledger:stores.streamLedger,transientBufferSize:1});
const base=createDeterministicOfflineModel({script:{
  detach:{kind:'text',text:'A real pinned VICT fixture result.'},cancel:{kind:'text',text:'Never reached.'},
}});
let reached,release,modelCount=0,cancelObserved=false;
const reset=()=>{
  let mark,unblock;
  const ready=new Promise(r=>{mark=r;});
  const wait=new Promise(r=>{unblock=r;});
  reached=mark;release=unblock;
  return {ready,wait};
};
let gate=reset();
const composition=composeMastraTurnExecutor({activation,stores,hub,ids,agentConfig:{
  store:memory.store,threadCoordinator:new MastraThreadCoordinator(),tracing:{sampling:{type:'never'}},
  modelFactory:()=>({...base,async doStream(opts){
    modelCount++;reached();
    const cancelled=delay(12000,undefined,{signal:opts.abortSignal}).then(()=>{throw Error('probe model gate expired');});
    try{await Promise.race([gate.wait,cancelled]);}
    catch(e){cancelObserved=opts.abortSignal.aborted;throw e;}
    return base.doStream(opts);
  }}),
},capabilityBridge:{resolveCapability:()=>undefined,invoke:()=>assert.fail('No tool is granted.')}});
const {turnService}=composition;
try {
  const first=await turnService.startTurn(actor,{threadId,input:'detach'});
  await gate.ready;
  const initial=[];
  const detached=new AbortController();
  await hub.subscribe(first.turn.streamId,{subscriberId:'initial',signal:detached.signal,deliver(e){initial.push(e);return true;}});
  const cursor={streamId:first.turn.streamId,lastSeq:initial.at(-1).seq};
  detached.abort();
  const rejoined=[];
  await hub.subscribe(first.turn.streamId,{subscriberId:'rejoined',deliver(e){rejoined.push(e);return true;}},{lastSeq:cursor.lastSeq});
  release();
  const result=await first.outcomePromise;
  assert.equal(result.status,'completed');
  assert.equal(modelCount,1);
  assert.ok(rejoined.every(e=>e.turnId===first.turn.turnId&&e.seq>cursor.lastSeq));
  assert.ok(rejoined.some(e=>e.kind==='response.completed'));
  assert.ok(!initial.some(e=>e.kind==='response.completed'));
  const terminalCursor={...cursor,lastSeq:rejoined.at(-1).seq};
  const replay=await hub.replay(cursor);
  const again=await hub.replay(cursor);
  assert.deepEqual(again,replay);
  const caughtUp=await hub.replay(terminalCursor);
  assert.equal(caughtUp.events.length,0);
  console.log(JSON.stringify({probe:'VICT detach and cursor replay',turnId:first.turn.turnId,
    cursor,observed:rejoined.map(e=>[e.seq,e.kind]),replay:replay.events.map(e=>[e.seq,e.kind]),gap:replay.olderThanBuffer,
    duplicateReplayIdentical:true,terminalCursor,modelCount,turnStatus:(await stores.turns.getTurn(first.turn.turnId)).status}));
  hub.unsubscribe(first.turn.streamId,'rejoined');
  gate=reset();
  const second=await turnService.startTurn(actor,{threadId,input:'cancel'});
  await gate.ready;
  const wrong=await turnService.cancelTurn(actor,{turnId:randomUUID(),reasonCode:'WRONG_RUN'}).catch(()=>null);
  assert.equal(wrong,null);
  await turnService.cancelTurn(actor,{turnId:second.turn.turnId,reasonCode:'PROBE_STOP'});
  const secondResult=await second.outcomePromise;
  const secondRecord=await stores.turns.getTurn(second.turn.turnId);
  assert.equal(secondRecord.status,'cancelled');
  assert.ok(cancelObserved);
  assert.equal(modelCount,2);
  await composition.productAgent.flush();
  console.log(JSON.stringify({probe:'VICT cancel original turn',turnId:second.turn.turnId,streamId:second.turn.streamId,
    result:secondResult.status,record:secondRecord.status,cancelObserved,wrongIdentityRefused:true,modelCount}));
  stores.close();stores=createSqliteAgentControlStores({path});
  const restartedHub=new AgentStreamHub({ledger:stores.streamLedger});
  const reopened=await restartedHub.replay(cursor);
  const complete=await stores.turns.getTurn(first.turn.turnId);
  assert.equal(complete.status,'completed');
  assert.ok(reopened.olderThanBuffer);
  assert.ok(reopened.events.some(e=>e.kind==='response.completed'));
  assert.ok(!reopened.events.some(e=>e.kind==='text.delta'));
  assert.equal(reopened.newestSeq,terminalCursor.lastSeq);
  console.log(JSON.stringify({probe:'VICT reopened ledger',turnId:first.turn.turnId,turnStatus:complete.status,
    oldestCursor:cursor,newestSeq:reopened.newestSeq,gap:reopened.olderThanBuffer,durable:reopened.events.map(e=>[e.seq,e.kind]),
    governedResumeApi:typeof turnService.resumeTurn,rawSignalApi:typeof composition.productAgent.sendSignal}));
}finally{
  await memory.close();
  stores.close();
}
