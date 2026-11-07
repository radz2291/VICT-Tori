import { randomUUID } from 'node:crypto';
import { pinAgentTurnRunner } from '@victframework/runtime';
import { createDeterministicOfflineModel, createGovernedMemoryDeletionPort, MastraProductAgent, mastraThreadIdForConversation } from '@victframework/mastra';

export const outputRef={id:'tori.output.finding',revision:'1'};
export const childRef={id:'tori.child.reference-reviewer',revision:'1'};
export const delegationRef={id:'tori.delegate.reference-reviewer',revision:'1'};
export const delegateGrant='tori.child.reference-reviewer.invoke';

export const outputArtifact={kind:'structured-output-contract',...outputRef,description:'One JSON object with a finding string.',
  parse(text){
    if(text.length<=2048)try{
      const value=JSON.parse(text);
      if(value&&typeof value==='object'&&Object.keys(value).length===1&&typeof value.finding==='string'&&
        value.finding.trim().length>0&&value.finding.length<=512)return {ok:true,value:{finding:value.finding}};
    }catch{/* Reject malformed text without retaining it. */}
    return {ok:false};
  },
};

export function registerChild(registry,parent,adapter){
  const instructions={id:'tori.child.reference-instructions',revision:'1'};
  registry.installArtifacts([{kind:'instructions',...instructions,text:'Review the supplied synthetic reference task in one short sentence.'}]);
  registry.registerProfile({schema:'vict.agent-profile@1',...childRef,instructions,memoryPolicy:parent.memoryPolicy,
    modelProfile:{id:'tori.child.offline',revision:'1',routerModel:'offline-fixture/deterministic-1',provider:'offline-fixture'},
    generation:{maxOutputTokens:256,maxRetries:0},turnPolicy:{maxSteps:1,maxToolCalls:0,onLimit:'fail-closed'},adapter});
  return registry.activateAgentProfile(childRef);
}

export function createChildCapability({activation,child,parentRun,agentConfig,persist,modelForTask=task=>
  createDeterministicOfflineModel({script:{[task]:{kind:'text',text:'Synthetic reference review completed.'}}})}){
  const inputSchema={type:'object',properties:{task:{type:'string',minLength:1,maxLength:256}},required:['task'],additionalProperties:false};
  const parse=(predicate,value)=>predicate(value)?{ok:true,value}:{ok:false,issues:[]};
  return {
    ...delegationRef,effect:'read',description:'Delegate one synthetic reference review to the pinned child.',
    permissions:[delegateGrant],
    input:{id:'tori.delegate.input',revision:'1',descriptiveJsonSchema:inputSchema,parse:value=>parse(v=>
      v!==null&&typeof v==='object'&&Object.keys(v).length===1&&typeof v.task==='string'&&v.task.trim().length>0&&v.task.length<=256,value)},
    output:{id:'tori.delegate.output',revision:'1',parse:value=>parse(v=>typeof v?.text==='string'&&v.text.length<=512,value)},
    async invoke({task},context){
      const bound=activation.subagents.some(item=>item.reference.id===childRef.id&&item.reference.revision===childRef.revision&&
        item.agentProfileVersion===child.agentProfileVersion);
      if(!bound||parentRun.parentRun||context.signal?.aborted)throw new Error('TORI_CHILD_BOUNDARY_DENIED');
      const id=randomUUID(), at=()=>new Date().toISOString();
      const run={id,parentRun:parentRun.id,parentVictTurn:context.victTurnId,parentInvocation:context.victInvocationId,
        session:parentRun.session,activation:child.activationVersion,revision:childRef.revision,name:'Reference reviewer',
        provider:'offline-fixture',model:'deterministic-1',tokens:256,status:'running',started:at(),
        fixture:parentRun.fixture,events:[]};
      persist(run);
      try{
        const adapter=MastraProductAgent.create(child,{...agentConfig,modelFactory:()=>modelForTask(task)});
        const result=await pinAgentTurnRunner(adapter,child).runTurn({
          turnId:id,threadId:mastraThreadIdForConversation(id),actorId:context.victActorId,input:task,
        },{abortSignal:context.signal,victRunId:id});
        await adapter.flush();
        const {deletionPort}=createGovernedMemoryDeletionPort({store:agentConfig.store,
          threadCoordinator:agentConfig.threadCoordinator,actorId:context.victActorId});
        await deletionPort.deleteConversationThread(id);
        run.status=result.status;
        run.errorCode=result.errorCode;
        run.usage=result.usage;
        run.events=result.events.filter(event=>event.kind.startsWith('response.')).map(event=>({at:at(),label:'VICT · '+event.kind}));
        if(result.status!=='completed'||!result.text)throw new Error('TORI_CHILD_INCOMPLETE');
        return {text:result.text};
      }catch{
        run.status=context.signal?.aborted?'cancelled':'failed';
        run.errorCode??='TORI_CHILD_INCOMPLETE';
        throw new Error('TORI_CHILD_INCOMPLETE');
      }finally{
        run.ended=at();
        persist(run);
      }
    },
  };
}
