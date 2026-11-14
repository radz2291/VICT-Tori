import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentProfileRegistry, pinAgentTurnRunner } from '@victframework/runtime';
import { AGENT_STREAM_EVENT_KINDS, validateAgentStreamEvent } from '@victframework/contracts';
import { MastraProductAgent, createDedicatedMastraStore, createDeterministicOfflineModel, MastraThreadCoordinator, MASTRA_ADAPTER_COMPATIBILITY } from '@victframework/mastra';

const versions={};
for(const name of ['@victframework/contracts','@victframework/runtime','@victframework/mastra','@mastra/core'])
  versions[name]=JSON.parse(await readFile(new URL('../node_modules/'+name+'/package.json',import.meta.url),'utf8')).version;
const base={streamId:'probe-stream',turnId:'probe-turn',threadId:'probe-thread',actorId:'probe-actor',agentProfileVersion:'probe-profile',seq:1,kind:'response.started'};
assert.equal(validateAgentStreamEvent(base).ok,true);
assert.equal(validateAgentStreamEvent({...base,kind:'child.question'}).ok,false);
assert.equal(validateAgentStreamEvent({...base,parentRunId:'parent'}).ok,false);
assert.equal(validateAgentStreamEvent({...base,reasoning:'PRIVATE_CANARY'}).ok,false);
console.log(JSON.stringify({probe:'strict public boundary',node:process.version,versions,kinds:AGENT_STREAM_EVENT_KINDS,unknownKind:false,unknownCorrelationField:false,privateReasoning:false}));

const path=await mkdtemp(join(tmpdir(),'tori011-boundary-'));
const memory=await createDedicatedMastraStore({dataDir:path,retention:{messagesMaxAgeMs:60000,threadsMaxAgeMs:60000,spansMaxAgeMs:60000}});
const registry=new AgentProfileRegistry();
const instructions={id:'probe.instructions',revision:'1'},memoryPolicy={id:'probe.memory',revision:'1'};
registry.installArtifacts([{kind:'instructions',...instructions,text:'Synthetic boundary probe.'},{kind:'memory-policy',...memoryPolicy,config:{lastMessages:10,workingMemory:{enabled:false},semanticRecall:false}}]);
registry.registerProfile({schema:'vict.agent-profile@1',id:'probe.agent',revision:'1',instructions,memoryPolicy,
  modelProfile:{id:'probe.model',revision:'1',routerModel:'offline-fixture/deterministic-1',provider:'offline-fixture'},
  generation:{maxRetries:0},turnPolicy:{maxSteps:1,maxToolCalls:1,onLimit:'fail-closed'},adapter:MASTRA_ADAPTER_COMPATIBILITY});
const activation=registry.activateAgentProfile({id:'probe.agent',revision:'1'});
const gates=[];
let adapter;
adapter=MastraProductAgent.create(activation,{store:memory.store,threadCoordinator:new MastraThreadCoordinator(),tracing:{sampling:{type:'never'}},modelFactory:()=>{
  const model=createDeterministicOfflineModel({script:{first:{kind:'text',text:'Synthetic first.'},answer:{kind:'text',text:'Synthetic answer.'}}});
  return {...model,async doStream(opts){gates.push([adapter.capabilityBudgetGate(),adapter.capabilityBudgetGate()]);return model.doStream(opts);}};
}});
const runner=pinAgentTurnRunner(adapter,activation);
try{
  const outcomes=[];
  for(const input of ['first','answer']) outcomes.push(await runner.runTurn({turnId:'same-turn',threadId:'vict-conv-probe',actorId:'probe-actor',input},{victRunId:'same-run'}));
  assert.equal(outcomes.length,2);
  assert.equal(outcomes[0].events[0].seq,1);
  assert.equal(outcomes[1].events[0].seq,1);
  assert.deepEqual(gates[0],gates[1]);
  console.log(JSON.stringify({probe:'second runTurn is not continuation',sameTurnIdentity:true,firstSequences:outcomes.map(x=>x.events[0].seq),gates,statuses:outcomes.map(x=>x.status),publicMethods:Object.getOwnPropertyNames(MastraProductAgent.prototype).filter(x=>x!=='constructor'),runnerMethods:Object.keys(runner),resume:typeof runner.resumeTurn,answer:typeof runner.answerQuestion}));
}finally{await adapter.flush();await memory.close();}
