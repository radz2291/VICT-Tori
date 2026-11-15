import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {validateAgentStreamEvent} from '@victframework/contracts';
import {AgentProfileRegistry, AgentStreamHub} from '@victframework/runtime';
import {
  AGENT_EXCHANGE_ASK_CAPABILITY, MASTRA_EXCHANGE_ADAPTER_COMPATIBILITY, MastraThreadCoordinator,
  createDedicatedMastraStore, createDeterministicOfflineModel, createMastraAgentExchange, sanitizeCapabilityToolName,
} from '@victframework/mastra';
import {createSqliteAgentControlStores, createSqliteAgentExchangeStore} from '@victframework/store-sqlite';
import {governedReadTurn} from '../server/a3-runtime.mjs';
import {delegateGrant} from '../server/a4-runtime.mjs';

const actorId = 'tori-exchange-fixture';
const question = 'Which synthetic item is in scope?';
const context = 'GREEN synthetic fixture.';
const ask = {id:AGENT_EXCHANGE_ASK_CAPABILITY,revision:'1'};
const hold = {id:'tori.exchange.fixture.hold',revision:'1'};
const ref = id => ({id:'fixture.'+id,revision:'1'});
const contract = (id,properties,check) => ({
  ...ref(id),descriptiveJsonSchema:{type:'object',properties,required:Object.keys(properties),additionalProperties:false},
  parse:value=>check(value)?{ok:true,value}:{ok:false,issues:[]},
});
const askCapability = {
  ...ask,effect:'read',description:'Ask the fixture supervisor.',
  input:contract('ask.input',{question:{type:'string'}},value=>value?.question===question),
  output:contract('ask.output',{},value=>value?.status==='answered'||value?.status==='refused'),
  invoke:()=>assert.fail('An exchange ask reached the ordinary TORI bridge'),
};

function activatePair() {
  const registry = new AgentProfileRegistry({resolveCapabilityRevision:(id,revision)=>
    [ask,hold].some(cap=>cap.id===id&&cap.revision===revision),
  });
  const instructions=ref('instructions'), memoryPolicy=ref('memory'), model=ref('model');
  registry.installArtifacts([
    {kind:'instructions',...instructions,text:'Fixture instructions; do not disclose.'},
    {kind:'memory-policy',...memoryPolicy,config:{lastMessages:10,workingMemory:{enabled:false},semanticRecall:false}},
  ]);
  function activate(id,capability,maxSteps,subagents=[]) {
    const reference=ref(id);
    registry.registerProfile({
      ...reference,schema:'vict.agent-profile@1',instructions,memoryPolicy,subagents,
      modelProfile:{...model,routerModel:'offline-fixture/deterministic-1',provider:'offline-fixture'},
      generation:{maxRetries:0},turnPolicy:{maxSteps,maxToolCalls:1,onLimit:'fail-closed'},
      capabilities:[capability],adapter:MASTRA_EXCHANGE_ADAPTER_COMPATIBILITY,
    });
    return registry.activateAgentProfile(reference);
  }
  const asker=activate('asker',ask,2);
  const answerer=activate('answerer',hold,3,[ref('asker')]);
  return {asker,answerer,askCapability:ask,holdingCapability:hold};
}

test('TORI governed turn seam uses the verified exchange, preserving the original asker turns and receipts',async()=>{
  const path=await mkdtemp(join(tmpdir(),'tori-exchange-wiring-'));
  const stores=createSqliteAgentControlStores({path:join(path,'control.sqlite')});
  const receipts=createSqliteAgentExchangeStore({path:join(path,'exchange.sqlite')});
  const memory=await createDedicatedMastraStore({
    dataDir:path,retention:{messagesMaxAgeMs:60000,threadsMaxAgeMs:60000,spansMaxAgeMs:60000},
  });
  try {
    const {asker,answerer,...caps}=activatePair();
    await stores.actors.upsert({actorId,status:'active',roles:['developer'],createdAt:0});
    const exchange=createMastraAgentExchange({binding:{asker,answerer,...caps},stores,receipts,disclosure:{
      allowQuestion:({question:input})=>input===question?{context}:undefined,
      allowAnswer:({answer})=>answer===context,
    }});
    const hub=new AgentStreamHub({ledger:stores.streamLedger});
    const threadCoordinator=new MastraThreadCoordinator();
    const childTurn=randomUUID(), childStream=randomUUID(), parentTurn=randomUUID(), parentStream=randomUUID();
    const deadlineAt=Date.now()+25000;
    const toolOutput=[];
    const models={asker:0,answerer:0};
    const childModel=createDeterministicOfflineModel({
      script:{'begin-specialist':{kind:'tool-call',toolName:sanitizeCapabilityToolName(ask.id),
        args:{question},thenText:'Specialist continued in the original turn.'}},
      onToolResult:event=>toolOutput.push(event.output),
    });
    const parentModel=createDeterministicOfflineModel({script:{
      'begin-parent':{kind:'tool-call',toolName:sanitizeCapabilityToolName(hold.id),args:{},thenText:'Parent completed.'},
      [JSON.stringify({question,context})]:{kind:'text',text:context},
    }});
    const config=(model,role)=>({store:memory.store,threadCoordinator,modelFactory:()=>({
      ...model,async doStream(options){models[role]++;return model.doStream(options);},
    })});
    const events={child:[],parent:[]};
    const base={stores,hub,actorId,fixture:true,exchange:{binding:exchange,deadlineAt:()=>deadlineAt}};
    let child;
    const holdingCapability={
      ...hold,effect:'read',description:'Run the exact specialist.',permissions:[delegateGrant],
      input:contract('hold.input',{},value=>value!==null&&Object.keys(value).length===0),
      output:contract('hold.output',{text:{type:'string'}},value=>typeof value?.text==='string'),
      invoke:(_args,{signal})=>exchange.withAsker(async()=>{
        child=await governedReadTurn({...base,activation:asker,askCapability,agentConfig:config(childModel,'asker'),
          threadId:'vict-conv-'+childTurn,runId:childTurn,streamId:childStream,deadline:signal,input:'begin-specialist',
          onEvent:event=>events.child.push(event)});
        return {text:child.text};
      }),
    };
    const parent=await governedReadTurn({...base,activation:answerer,childCapability:holdingCapability,
      agentConfig:config(parentModel,'answerer'),threadId:'vict-conv-'+parentTurn,runId:parentTurn,streamId:parentStream,
      deadline:AbortSignal.timeout(deadlineAt-Date.now()),input:'begin-parent',onEvent:event=>events.parent.push(event)});
    assert.equal(parent.status,'completed');
    assert.equal(child?.status,'completed');
    assert.equal(child.text,'Specialist continued in the original turn.');
    assert.equal(toolOutput.length,1);
    assert.match(JSON.stringify(toolOutput[0]),/GREEN synthetic fixture/);

    for(const [turnId,streamId,captured] of [[childTurn,childStream,events.child],[parentTurn,parentStream,events.parent]]) {
      assert.ok(captured.length>1);
      assert.ok(captured.every((event,index)=>validateAgentStreamEvent(event).ok&&event.turnId===turnId&&
        event.streamId===streamId&&event.seq===index+1));
      assert.deepEqual((await hub.replay({streamId,lastSeq:0})).events,captured);
    }
    const invocations=await stores.invocations.listInvocationsForTurn(childTurn);
    assert.equal(invocations.length,1);
    const operation=invocations[0].idempotencyKey;
    const receipt=await exchange.readReceipt(operation,actorId);
    assert.equal(receipt?.status,'answered');
    assert.equal(receipt.asker.turnId,childTurn);
    assert.equal(receipt.asker.streamId,childStream);
    assert.equal(receipt.answerer.turnId,parentTurn);
    assert.equal(receipt.answerer.streamId,parentStream);
    assert.equal(receipt.answerer.deadlineAt,deadlineAt);
    assert.equal(receipt.asker.deadlineAt,deadlineAt);
    assert.deepEqual(models,{asker:2,answerer:3});
    assert.deepEqual(await exchange.readReceipt(operation,actorId),receipt);
    assert.deepEqual(models,{asker:2,answerer:3});
  } finally {
    await memory.close();
    receipts.close();
    stores.close();
  }
});
