import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { AgentProfileRegistry, AgentStreamHub, authenticatedActorContext, gateCapabilityInvoke } from '@victframework/runtime';
import { createSqliteAgentControlStores } from '@victframework/store-sqlite';
import { composeMastraTurnExecutor, createDedicatedMastraStore, createDeterministicOfflineModel,
  MastraThreadCoordinator, MASTRA_ADAPTER_COMPATIBILITY, sanitizeCapabilityToolName } from '@victframework/mastra';

test('a distinct approver can allow or refuse a synthetic protected effect',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'tori-a3-approval-'));
  const memory=await createDedicatedMastraStore({dataDir:dir,retention:{messagesMaxAgeMs:60000,threadsMaxAgeMs:60000,spansMaxAgeMs:60000}});
  const stores=createSqliteAgentControlStores({path:join(dir,'control.sqlite')});
  let effects=0;
  const contract=id=>({id,revision:'1',descriptiveJsonSchema:{type:'object'},parse:value=>({ok:true,value})});
  const capability={id:'fixture.approval.effect',revision:'1',effect:'write',permissions:['fixture.counter.write'],
    input:contract('fixture.approval.input'),output:contract('fixture.approval.output'),
    async invoke(){effects++;return {counted:true};}};
  const registry=new AgentProfileRegistry({resolveCapabilityRevision:(id,rev)=>id===capability.id&&rev==='1'});
  const instructions={id:'fixture.instructions',revision:'1'};
  const memoryPolicy={id:'fixture.memory',revision:'1'};
  registry.installArtifacts([
    {kind:'instructions',...instructions,text:'Use the test counter tool.'},
    {kind:'memory-policy',...memoryPolicy,config:{lastMessages:10,workingMemory:{enabled:false},semanticRecall:false}},
  ]);
  registry.registerProfile({schema:'vict.agent-profile@1',id:'fixture.agent',revision:'1',instructions,memoryPolicy,
    modelProfile:{id:'fixture.model',revision:'1',routerModel:'offline-fixture/deterministic-1',provider:'offline-fixture'},
    generation:{},turnPolicy:{maxSteps:2,maxToolCalls:1,onLimit:'fail-closed'},adapter:MASTRA_ADAPTER_COMPATIBILITY,
    capabilities:[{id:capability.id,revision:'1'}]});
  const activation=registry.activateAgentProfile({id:'fixture.agent',revision:'1'});
  for(const [actorId,roles] of [['requester',['developer','approver']],['reviewer',['approver']]])
    await stores.actors.upsert({actorId,roles,status:'active',createdAt:0});
  const requester=authenticatedActorContext(await stores.actors.get('requester'),'requester');
  const reviewer=authenticatedActorContext(await stores.actors.get('reviewer'),'reviewer');
  const tool={kind:'tool-call',toolName:sanitizeCapabilityToolName(capability.id),args:{},thenText:'Fixture turn settled.'};
  const hub=new AgentStreamHub({ledger:stores.streamLedger});
  const composition=composeMastraTurnExecutor({activation,stores,hub,
    ids:{turnId:randomUUID,streamId:randomUUID,invocationId:randomUUID,approvalId:randomUUID,idempotencyKey:randomUUID,cancelId:randomUUID},
    agentConfig:{
    store:memory.store,threadCoordinator:new MastraThreadCoordinator(),tracing:{sampling:{type:'never'}},
    modelFactory:()=>createDeterministicOfflineModel({script:{approved:tool,declined:tool}}),
  },capabilityBridge:{
    resolveCapability:(id,rev)=>id===capability.id&&rev==='1'?capability:undefined,
    invoke:(definition,input,context)=>gateCapabilityInvoke(definition,{grants:['fixture.counter.write']})(input,context),
    recordInvocationIntent:input=>composition.turnService.recordToolInvocationIntent(input),
    requestApproval:input=>composition.turnService.requestApproval(input),
    consumeApproval:binding=>composition.turnService.consumeApproval(binding),
    updateInvocationStatus:command=>stores.invocations.updateInvocationStatus(command),
    findExistingApproval:async id=>(await stores.approvals.listApprovalsForInvocation(id))[0]?.approvalId,
    pollApprovalDecision:id=>stores.approvals.getApproval(id),
    approvalExpiryMs:5000,pollIntervalMs:10,
  }});
  const evidence=[];
  try{
    for(const decision of ['approved','declined']){
      const before=effects;
      const {turn,outcomePromise}=await composition.turnService.startTurn(requester,{threadId:'vict-conv-fixture-'+decision,input:decision});
      let approval;
      for(let i=0;i<250&&!approval;i++){
        approval=(await stores.approvals.listOpenApprovals())[0];
        if(!approval)await setTimeout(10);
      }
      assert.ok(approval,'a pending approval must exist');
      assert.equal(effects,before);
      await assert.rejects(composition.turnService.decideToolApproval(requester,{approvalId:approval.approvalId,decision}));
      await composition.turnService.decideToolApproval(reviewer,{approvalId:approval.approvalId,decision});
      await outcomePromise;
      const [invocation]=await stores.invocations.listInvocationsForTurn(turn.turnId);
      assert.equal(invocation.status,decision==='approved'?'completed':'declined');
      assert.equal(effects-before,decision==='approved'?1:0);
      const events=(await hub.replay({streamId:turn.streamId,lastSeq:0})).events;
      assert.ok(events.some(event=>event.kind==='tool.awaiting_approval'));
      assert.ok(events.some(event=>event.kind===(decision==='approved'?'tool.completed':'tool.failed')));
      assert.equal(effects-before,decision==='approved'?1:0);
      evidence.push({decision,turnId:turn.turnId,approvalId:approval.approvalId,invocationId:invocation.invocationId,
        effects:effects-before,status:invocation.status,events:events.filter(event=>event.kind.startsWith('tool.')).map(event=>event.kind)});
    }
    console.log(JSON.stringify({fixture:'protected in-memory counter',receipts:evidence}));
  }finally{
    await composition.productAgent.flush();
    await memory.close();
    stores.close();
  }
});
