import { randomUUID } from 'node:crypto';
import { pinAgentTurnRunner } from '@victframework/runtime';
import { createDeterministicOfflineModel, createGovernedMemoryDeletionPort, MastraProductAgent, mastraThreadIdForConversation } from '@victframework/mastra';

export const outputRef={id:'tori.output.finding',revision:'1'};
import { childRef, childName, delegateGrant, childTask, childResult, taskLengthLimit, resultLengthLimit } from '../src/delegation-fixture.mjs';
export {childRef,delegateGrant};
export const delegationRef={id:'tori.delegate.reference-reviewer',revision:'1'};

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
  registry.installArtifacts([{kind:'instructions',...instructions,text:childTask}]);
  registry.registerProfile({schema:'vict.agent-profile@1',...childRef,instructions,memoryPolicy:parent.memoryPolicy,
    modelProfile:{id:'tori.child.offline',revision:'1',routerModel:'offline-fixture/deterministic-1',provider:'offline-fixture'},
    generation:{maxOutputTokens:256,maxRetries:0},turnPolicy:{maxSteps:1,maxToolCalls:0,onLimit:'fail-closed'},adapter});
  return registry.activateAgentProfile(childRef);
}

export function createChildCapability({activation,child,parentRun,agentConfig,persist,delegated,runDelegated,modelForTask=task=>
  createDeterministicOfflineModel({script:{[task]:{kind:'text',text:childResult}}})}){
  const reference=delegated?{id:delegated.revision.definition??'tori-local-agent',revision:delegated.revision.id}:childRef;
  const inputSchema={type:'object',properties:{task:{type:'string',minLength:1,maxLength:taskLengthLimit},
    ...(delegated?{includeContext:{type:'boolean',description:'Request the child’s pinned project context.'}}:{})},
    required:['task'],additionalProperties:false};
  const parse=(predicate,value)=>predicate(value)?{ok:true,value}:{ok:false,issues:[]};
  return {
    ...delegationRef,effect:'read',description:'Delegate one synthetic reference review to the pinned child.',
    permissions:[delegateGrant],
    input:{id:'tori.delegate.input',revision:'1',descriptiveJsonSchema:inputSchema,parse:value=>parse(v=>
      v!==null&&typeof v==='object'&&Object.keys(v).every(key=>key==='task'||(delegated&&key==='includeContext'&&typeof v[key]==='boolean'))&&typeof v.task==='string'&&v.task.trim().length>0&&v.task.length<=taskLengthLimit,value)},
    output:{id:'tori.delegate.output',revision:'1',parse:value=>parse(v=>typeof v?.text==='string'&&v.text.length<=resultLengthLimit,value)},
    async invoke({task,includeContext},context){
      const bound=activation.subagents.some(item=>item.reference.id===reference.id&&item.reference.revision===reference.revision&&
        item.agentProfileVersion===child.agentProfileVersion);
      if(!bound||parentRun.parentRun||context.signal?.aborted)throw new Error('TORI_CHILD_BOUNDARY_DENIED');
      const id=randomUUID(), at=()=>new Date().toISOString();
      const run={id,parentRun:parentRun.id,parentVictTurn:context.victTurnId,parentInvocation:context.victInvocationId,
        session:parentRun.session,activation:child.activationVersion,revision:reference.revision,number:delegated?.revision.number,name:delegated?.value.name??childName,
        definition:delegated?reference.id:undefined,
        provider:'offline-fixture',model:delegated?'glm-5.3-flash':'deterministic-1',tokens:delegated?.value.tokens??256,status:'running',started:at(),
        fixture:parentRun.fixture,events:[]};
      persist(run);
      try{
        const threadId=mastraThreadIdForConversation(id);
        let result;
        if(delegated){
          result=await runDelegated(run,task,includeContext,context.signal,threadId);
        }else{
          const adapter=MastraProductAgent.create(child,{...agentConfig,modelFactory:()=>modelForTask(task)});
          result=await pinAgentTurnRunner(adapter,child).runTurn({
            turnId:id,threadId,actorId:context.victActorId,input:task,
          },{abortSignal:context.signal,victRunId:id});
          await adapter.flush();
        }
        const {deletionPort}=createGovernedMemoryDeletionPort({store:agentConfig.store,
          threadCoordinator:agentConfig.threadCoordinator,actorId:context.victActorId});
        await deletionPort.deleteConversationThread(id);
        run.status=result.status;
        run.errorCode=result.errorCode;
        run.usage=result.usage;
        run.events=result.events.filter(event=>event.kind.startsWith('response.')||event.kind.startsWith('tool.')).map(event=>({at:at(),label:'VICT · '+event.kind}));
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
