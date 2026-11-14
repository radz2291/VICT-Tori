import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSqliteAgentControlStores } from '@victframework/store-sqlite';
import { recoverRunRecords } from '../server/run-recovery.mjs';

const open=dir=>createSqliteAgentControlStores({path:join(dir,'control.sqlite')});

async function stage(dir){
  const stores=open(dir);
  const asker=randomUUID(),answerer=randomUUID(),owner=randomUUID(),session=randomUUID();
  const at=Date.now();
  for(const turnId of [asker,answerer]){
    await stores.turns.createTurnIntent({turnId,streamId:randomUUID(),threadId:'synthetic-'+turnId,
      actorId:'synthetic-actor',agentProfileVersion:'synthetic-profile',inputSummary:'Synthetic waiting exchange',
      status:'intent',createdAt:at,updatedAt:at});
    await stores.turns.startTurn(turnId,at);
  }
  async function pendingTool(turnId,effect){
    const invocationId=randomUUID();
    await stores.invocations.recordInvocationIntent({invocationId,turnId,toolCallId:invocationId,
      toolName:'synthetic',capabilityId:'fixture.'+effect,capabilityRevision:'1',effect,
      idempotencyKey:randomUUID(),actorId:'synthetic-actor',argDigest:'synthetic-digest',
      argumentSummary:'Synthetic invocation, no effect executed',status:'intent',createdAt:at,updatedAt:at});
    await stores.invocations.claimInvocationRun({invocationId,fenceToken:'original',ownerIdentity:owner,at});
    return invocationId;
  }
  const askInvocation=await pendingTool(asker,'read');
  const unconfirmedEffect=await pendingTool(answerer,'write');
  process.send({asker,answerer,owner,session,askInvocation,unconfirmedEffect});
  process.on('message',()=>{});
}

if(process.argv[2]==='stage'){
  await stage(process.argv[3]);
}else{
  const dir=await mkdtemp(join(tmpdir(),'tori-exchange-recovery-'));
  const worker=fork(fileURLToPath(import.meta.url),['stage',dir]);
  const exited=once(worker,'exit');
  const [ids]=await Promise.race([
    once(worker,'message'),
    exited.then(([code])=>assert.fail('Owner exited before persisting the fixture: '+code)),
  ]);
  worker.kill('SIGKILL');
  await exited;
  const stores=open(dir);
  const record=(id,extra)=>({id,ownerId:ids.owner,session:ids.session,status:'running',events:[],...extra});
  const state={sessions:[{id:ids.session}],runs:[
    record(ids.answerer,{}),record(ids.asker,{parentRun:ids.answerer,parentInvocation:ids.askInvocation}),
  ]};
  try{
    assert.equal(await recoverRunRecords(state,stores,{findReceipt:()=>null,pendingEffects:()=>[]}),true);
    const [answerer,asker]=state.runs;
    assert.equal(answerer.status,'uncertain');
    assert.equal(asker.status,'interrupted');
    assert.ok(state.runs.every(run=>run.recovery.replay==='none'&&run.recovery.priorOwner===ids.owner));
    assert.equal(answerer.recovery.tools.find(t=>t.id===ids.unconfirmedEffect)?.status,'outcome_unknown');
    assert.equal(asker.recovery.parent,ids.answerer);
    console.log(JSON.stringify({fixture:'persisted pair and pending operations; existing recovery only',
      answerer:answerer.status,asker:asker.status,replay:'none',originalIdentities:true}));
  }finally{
    stores.close();
  }
}
