import assert from 'node:assert/strict';
import { AgentProfileRegistry } from '@victframework/runtime';
import { MASTRA_ADAPTER_COMPATIBILITY } from '@victframework/mastra';
import { openMemoryStore, memoryScope, gatedMemorySave, proposalLifetimeMs } from '@tori-studio/memory';
import { directiveDefaults, directiveInput } from '@tori-studio/directive';
import { directivePolicy, directiveRevision, resolveDirective, withDirectiveReference } from '@tori-studio/directive/activation';

const scope=memoryScope('consumer-actor','consumer-project','consumer-agent');
const options={...directiveDefaults,historyBytes:4096,deadlineMs:120000};
const policy=directivePolicy(options,'glm-5.3-flash','coding',proposalLifetimeMs);
const hash=directiveRevision(policy);
const memory=withDirectiveReference({id:'consumer-memory',revision:'1'},hash);
const instructions={id:'consumer-instructions',revision:'1'};
const config={lastMessages:10,workingMemory:{enabled:false},semanticRecall:false};
const make=()=>{
  const registry=new AgentProfileRegistry();
  registry.installArtifacts([{kind:'instructions',...instructions,text:'Synthetic installed consumer.'},
    {kind:'memory-policy',...memory,config}]);
  registry.registerProfile({schema:'vict.agent-profile@1',id:'consumer-agent',revision:'1',instructions,memoryPolicy:memory,
    modelProfile:{id:'consumer-model',revision:'1',routerModel:'zai/glm-5.3-flash',provider:'zai'},
    generation:{maxRetries:0},turnPolicy:{maxSteps:1,maxToolCalls:0,onLimit:'fail-closed'},adapter:MASTRA_ADAPTER_COMPATIBILITY});
  return registry;
};
const first=make().activateAgentProfile({id:'consumer-agent',revision:'1'});
const record={recordSchema:'vict.agent-activation-record@1',activationVersion:first.activationVersion,
  agentProfileVersion:first.agentProfileVersion,agentId:'consumer-agent',agentRevision:'1',
  canonicalManifest:first.canonicalManifestJson,artifacts:first.artifactList,createdAt:first.createdAt};
const restored=make().restoreActivation(JSON.parse(JSON.stringify(record)));
assert.equal(restored.ok,true);
assert.equal(resolveDirective({directive:policy},restored.activation.memoryPolicy.reference,'glm-5.3-flash','coding',proposalLifetimeMs).revision,hash);
assert.equal(resolveDirective({directive:{...policy,deadlineMs:22000}},memory,'glm-5.3-flash','coding',proposalLifetimeMs).status,'unavailable');
const current={id:'current',text:'Keep the Orchid status format.'};
const input=directiveInput([{id:'excluded',role:'user',text:'🍀'.repeat(1100)}],current,options.historyBytes);
assert.deepEqual(input,{history:[],current,truncated:true});

const store=openMemoryStore(':memory:');
try{
  const binding={session:'consumer-session',activation:record.activationVersion,run:'consumer-run'};
  const original='For future Orchid updates, use three short bullets.';
  const text='For future Orchid updates, use two short bullets.';
  const proposed=store.propose(scope,{...binding,text:original,source:'current',contextBasis:['current'],
    directiveRevision:hash,expires:Date.now()+proposalLifetimeMs});
  assert.equal(proposed.directive.revision,1);
  const revision=store.reviseProposal(scope,{...binding,text,operation:proposed.operation,revision:1});
  assert.equal(revision.proposal.directive.revision,2);
  assert.equal(store.list(scope).length,0);
  const grant={...binding,operation:proposed.operation,revision:2,confirmed:true};
  const context={victActorId:scope.actor,victTurnId:binding.run,victIdempotencyKey:proposed.operation};
  const save=gatedMemorySave(store,scope,grant,()=>true);
  assert.equal((await save({text:original},context)).status,'stale-revision');
  const confirmed=await save({text},context);
  assert.equal(confirmed.receipt.directive.proposalRevision,2);
  assert.deepEqual((await save({text},context)).receipt,confirmed.receipt);
  assert.equal(store.list(scope).length,1);
  console.log(JSON.stringify({activation:record.activationVersion,binding:hash,historyBytes:options.historyBytes,
    deadlineMs:options.deadlineMs,confirmedRevision:confirmed.receipt.directive.proposalRevision,once:true}));
}finally{
  store.close();
}
