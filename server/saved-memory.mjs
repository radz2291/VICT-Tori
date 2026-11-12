import {
  gatedMemorySave, governedPolicy, memoryBudgetBytes, memoryScope, openMemoryStore,
} from '../packages/memory/index.mjs';

const memoryId='tori-conversation-memory';
const governedRevisions=['recent-10@1','recent-100@1'].map(value=>value+'+'+governedPolicy);
export const memoryArtifact=(history,governed)=>({
  id:memoryId,revision:governed===governedPolicy?(history??'recent-100@1')+'+'+governedPolicy:(history??'1'),
});
export const pinAllowsSavedMemory=pin=>!!pin?.record?.artifacts?.some(item=>
  item.kind==='memory-policy'&&item.id===memoryId&&governedRevisions.includes(item.revision));
export const emptyAdmission=status=>({schema:'tori.memory.admission@1',status,budgetBytes:memoryBudgetBytes,bytes:0,admitted:[],omitted:[]});
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
const error=(status,message)=>Object.assign(new Error(message),{status});

export function createSavedMemoryHost({path,actor,project,fixture,snapshot,definitionOf,actorAllowed,turnActive}) {
  let opened;
  const store=()=>opened??=openMemoryStore(path);
  const notRevoked=()=>process.env.TORI_SAVED_MEMORY_REVOKED!=='1';
  const scopeFor=(state,agent)=>memoryScope(actor,project??state.workspace,agent);
  const access=async()=>notRevoked()&&await actorAllowed(actor)&&notRevoked();
  const sessionFor=(state,id)=>{
    const session=state.sessions.find(item=>item.id===id&&item.fixture===fixture&&!item.authoring);
    const pin=state.activations.find(item=>item.record.activationVersion===session?.activation);
    if(!session||!pin)throw error(404,'This Session is not available for saved memory.');
    return {session,pin,scope:scopeFor(state,definitionOf(pin))};
  };
  const runScope=(state,run)=>{
    if(!run?.savedMemory||run.fixture!==fixture||!run.savedMemoryAgent)return undefined;
    const scope=scopeFor(state,run.savedMemoryAgent);
    return scope.key===run.savedMemoryScope?scope:undefined;
  };
  const asNotSaved=result=>{
    const responses={
      'invalid-text':[400,'Enter a nonblank memory of up to 1,024 UTF-8 bytes. Nothing was saved.'],
      'invalid':[400,'Invalid memory operation.'],
      'denied':[403,'Saved memory access was denied. Nothing was changed.'],
      'not-found':[404,'This memory or proposal was not found in this Session’s scope.'],
      'stale-revision':[409,'This memory changed. Reload it before editing or forgetting it.'],
      'operation-conflict':[409,'This operation already has a different result. Nothing was changed.'],
      'cancelled':[409,'The operation stopped before commit. Nothing was saved.'],
      'dismissed':[409,'This proposal was dismissed. Nothing was saved.'],
      'expired':[409,'This proposal expired. Send a new request to remember it.'],
      'storage-unavailable':[409,'Storage unavailable / memory missing. Nothing was changed.'],
    };
    if(responses[result.status])throw error(...responses[result.status]);
    return result;
  };
  const operationView=(scope,result)=>{
    const {receipt}=asNotSaved(result);
    return receipt?{...result,memory:store().inspect(scope,receipt.memoryId,receipt.revision)}:result;
  };
  return {
    scopeFor,
    access,
    admit(scope){return store().admit(scope);},
    propose(scope,proposal){return store().propose(scope,proposal);},
    cancelSession(state,id){
      try{const {scope,session}=sessionFor(state,id);store().withdrawSession(scope,session.id);}catch(e){if(e.status!==404)throw e;}
    },
    visibleRun(run,state){
      if(!run.savedMemory)return run;
      const {savedMemoryScope,savedMemoryAgent,savedMemory,savedMemoryRequest,...publicRun}=run;
      return runScope(state,run)?{...publicRun,hasSavedMemoryEvidence:true}:publicRun;
    },
    close(){opened?.close();},
    async handle(path,body){
      if(path==='/memory/run'){
        const state=snapshot();
        const run=state.runs.find(item=>item.id===body.run);
        const scope=runScope(state,run);
        if(!scope)throw error(404,'Saved-memory evidence was not found for this Run.');
        const allowed=await access();
        if(!allowed)return {status:'denied'};
        const receipt=store().receiptForRun(scope,run.id);
        return {status:'available',evidence:run.savedMemory,request:run.savedMemoryRequest,
          proposal:store().proposal(scope,run.session,run.id)?.status,receipt,
          savedRecordStatus:receipt&&store().inspect(scope,receipt.memoryId).status,
          records:run.savedMemory.admitted.map(item=>({id:item.id,revision:item.revision,...store().inspect(scope,item.id,item.revision)}))};
      }
      const {session,pin,scope}=sessionFor(snapshot(),body.session);
      if(path==='/memory/session'){
        const enabled=pinAllowsSavedMemory(pin);
        const recent=snapshot().runs.find(item=>item.session===session.id&&item.savedMemoryScope===scope.key);
        if(!enabled)return {status:'off',policy:false,records:[],request:recent?.savedMemoryRequest};
        if(!await access())return {status:'denied',policy:true,records:[],request:recent?.savedMemoryRequest};
        const proposal=store().latestProposal(scope,session.id);
        const receipt=proposal&&store().receiptForRun(scope,proposal.run);
        return {status:'available',policy:enabled,records:store().list(scope),proposal,
          saved:receipt&&{receipt,memory:store().inspect(scope,receipt.memoryId,receipt.revision)},
          request:recent?.savedMemoryRequest,evidence:recent?.savedMemory};
      }
      if(!await access())throw error(403,'Saved memory access was denied. Nothing was changed.');
      const stillAuthorized=()=>{
        if(!notRevoked()||turnActive())return false;
        try {
          const current=sessionFor(snapshot(),session.id);
          return current.scope.key===scope.key&&current.session.activation===session.activation&&pinAllowsSavedMemory(current.pin);
        }catch{return false;}
      };
      if(path==='/memory/dismiss'||path==='/memory/stop'){
        if(!uuid(body.run))throw error(400,'Select a saved-memory proposal.');
        const result=store().withdraw(scope,session.id,body.run,path==='/memory/stop'?'cancelled':'dismissed');
        if(result.status==='not-found')asNotSaved(result);
        return result;
      }
      if(turnActive())throw error(409,'Wait for the current turn before changing saved memory.');
      if(!pinAllowsSavedMemory(pin))throw error(403,'Saved memory is off for this activation.');
      if(!uuid(body.operation))throw error(400,'Invalid memory operation.');
      if(path==='/memory/confirm'){
        const run=snapshot().runs.find(item=>item.id===body.run&&item.session===session.id&&item.savedMemoryScope===scope.key);
        if(!run||run.status!=='completed'||run.savedMemoryRequest?.status!=='proposed')
          throw error(404,'No confirmable memory proposal was found for this turn.');
        const grant={confirmed:true,session:session.id,activation:session.activation,run:run.id,operation:body.operation};
        const capability=gatedMemorySave(store(),scope,grant,stillAuthorized);
        let result;
        try {
          result=await capability({text:body.text},{victActorId:actor,victTurnId:run.id,victIdempotencyKey:body.operation,
            signal:new AbortController().signal});
        }catch{throw error(503,'Studio could not confirm this save. Retry confirmation to check for a committed receipt.');}
        return operationView(scope,result);
      }
      if(path==='/memory/correct'||path==='/memory/forget'){
        if(!uuid(body.id))throw error(400,'Select a memory to change.');
        return operationView(scope,store().change(scope,{action:path.slice('/memory/'.length),id:body.id,session:session.id,
          expectedRevision:body.revision,operation:body.operation,text:body.text,stillAuthorized}));
      }
      throw error(404,'Unknown Studio memory operation.');
    },
  };
}
