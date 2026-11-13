import {
  effectiveMemoryPolicy, gatedMemorySave, governedPolicy, memoryBudgetBytes, memoryScope, openMemoryStore,
} from '../packages/memory/index.mjs';

export const pinnedMemoryPolicy=pin=>effectiveMemoryPolicy(pin?.record?.artifacts?.find(item=>item.kind==='memory-policy'));
export const pinAllowsSavedMemory=pin=>pinnedMemoryPolicy(pin)?.savedMemory===governedPolicy;
export const emptyAdmission=status=>({schema:'tori.memory.admission@1',status,budgetBytes:memoryBudgetBytes,bytes:0,admitted:[],omitted:[]});
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
const error=(status,message)=>Object.assign(new Error(message),{status});

export function createSavedMemoryHost({path,actor,project,fixture,snapshot,definitionOf,actorAllowed,turnActive,fault}) {
  let opened;
  const saves=new Map();
  const runBusy=()=>turnActive()||saves.size>0;
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
      'uncertain':[409,'The save outcome is Uncertain. Check the original operation before trying again.'],
    };
    if(responses[result.status])throw error(...responses[result.status]);
    return result;
  };
  function saveEvidence(scope, binding, check=false){
    try{
      const live=saves.get(binding.run);
      const owned=!!live&&(!binding.operation||live.operation===binding.operation);
      return check?store().reconcileSave(scope,binding,owned):store().saveDisposition(scope,binding,owned);
    }catch{
      return {status:'uncertain',run:binding.run,operation:binding.operation,reason:'save-storage-unavailable'};
    }
  }
  const operationView=(scope,result)=>{
    const {receipt}=asNotSaved(result);
    return receipt?{...result,memory:store().inspect(scope,receipt.memoryId,receipt.revision)}:result;
  };
  return {
    scopeFor,
    access,
    saving:()=>saves.size>0,
    admit(scope){return store().admit(scope);},
    propose(scope,proposal){return store().propose(scope,proposal);},
    cancelSession(state,id){
      try{const {scope,session}=sessionFor(state,id);store().withdrawSession(scope,session.id);}catch(e){if(e.status!==404)throw e;}
    },
    visibleRun(run,state){
      if(!run.savedMemory)return run;
      const {savedMemoryScope,savedMemoryAgent,savedMemory,savedMemoryRequest,savedMemoryDraft,...publicRun}=run;
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
        const operation=run.savedMemoryRequest?.status==='proposed'?
          saveEvidence(scope,{session:run.session,activation:run.activation,run:run.id}):undefined;
        const receipt=operation?.receipt;
        return {status:'available',evidence:run.savedMemory,request:run.savedMemoryRequest,draft:run.savedMemoryDraft,
          proposal:store().proposal(scope,run.session,run.id)?.status,receipt,operation,
          savedRecordStatus:receipt&&store().inspect(scope,receipt.memoryId).status,
          records:run.savedMemory.admitted.map(item=>({id:item.id,revision:item.revision,...store().inspect(scope,item.id,item.revision)}))};
      }
      const {session,pin,scope}=sessionFor(snapshot(),body.session);
      if(path==='/memory/session'){
        const enabled=pinAllowsSavedMemory(pin);
        // Match the current actor/project/agent and this Session; never project
        // a pending store row without a corresponding, completed source turn.
        const snapshotForScope=snapshot();
        const runs=snapshotForScope.runs.filter(item=>item.session===session.id&&runScope(snapshotForScope,item)?.key===scope.key);
        const recent=runs[0];
        const feedback=run=>run.status!=='running'&&run.savedMemoryRequest?.feedback?
          [{run:run.id,source:run.id+'-user',request:run.savedMemoryRequest}]:[];
        if(!enabled)return {status:'off',policy:false,records:[],turns:runs.flatMap(feedback),request:recent?.savedMemoryRequest};
        if(!await access())return {status:'denied',policy:true,records:[],request:recent?.savedMemoryRequest};
        const memory=store(),proposals=new Map(memory.sessionProposals(scope,session.id).map(item=>[item.run,item]));
        const turns=runs.flatMap(run=>{
          if(run.status==='running')return [];
          const source=run.id+'-user';
          const proposal=proposals.get(run.id);
          const operation=run.savedMemoryRequest?.status==='proposed'?
            saveEvidence(scope,{session:session.id,activation:session.activation,run:run.id}):undefined;
          if(proposal?.source.message===source){
            const visible=proposal.status==='pending'&&run.status!=='completed'?
              {...proposal,status:'cancelled',text:undefined,operation:undefined}:proposal;
            const receipt=operation?.receipt;
            return [{run:run.id,source,proposal:visible,operation,
              ...(receipt?{saved:{receipt,memory:memory.inspect(scope,receipt.memoryId,receipt.revision)}}:{})}];
          }
          if(operation?.status==='uncertain')return [{run:run.id,source,operation}];
          return feedback(run);
        });
        const latest=turns.find(turn=>turn.proposal);
        return {status:'available',policy:enabled,records:memory.list(scope),turns,proposal:latest?.proposal,
          saved:latest?.saved,request:recent?.savedMemoryRequest,evidence:recent?.savedMemory};
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
        const owned=saves.get(body.run);
        if(owned?.session===session.id&&owned.scope===scope.key){
          if(path==='/memory/dismiss')throw error(409,'Wait for the save result or stop the original save.');
          const disposition=saveEvidence(scope,{session:session.id,activation:session.activation,run:body.run,operation:owned.operation});
          if(disposition.status==='saved')return operationView(scope,disposition);
          owned.stop.abort();
          return {status:'stopping'};
        }
        const outcome=saveEvidence(scope,{session:session.id,activation:session.activation,run:body.run});
        if(outcome.status==='uncertain')asNotSaved(outcome);
        const result=store().withdraw(scope,session.id,body.run,path==='/memory/stop'?'cancelled':'dismissed');
        if(result.status==='not-found')asNotSaved(result);
        return result;
      }
      if(!pinAllowsSavedMemory(pin))throw error(403,'Saved memory is off for this activation.');
      if(!uuid(body.operation))throw error(400,'Invalid memory operation.');
      if(path==='/memory/check'){
        const run=snapshot().runs.find(item=>item.id===body.run&&item.session===session.id&&item.savedMemoryScope===scope.key);
        if(!run||run.savedMemoryRequest?.status!=='proposed')throw error(404,'No saved-memory operation was found for this turn.');
        const status=saveEvidence(scope,{session:session.id,activation:session.activation,run:run.id,operation:body.operation},true);
        if(status.status==='not-found')asNotSaved(status);
        return status;
      }
      if(runBusy())throw error(409,'Wait for the current turn or memory save before changing saved memory.');
      if(path==='/memory/confirm'){
        const run=snapshot().runs.find(item=>item.id===body.run&&item.session===session.id&&item.savedMemoryScope===scope.key);
        if(!run||run.status!=='completed'||run.savedMemoryRequest?.status!=='proposed')
          throw error(404,'No confirmable memory proposal was found for this turn.');
        const grant={confirmed:true,session:session.id,activation:session.activation,run:run.id,operation:body.operation};
        const stop=new AbortController();
        let owner, result;
        try{
          const memory=store();
          result=memory.reserveSave(scope,{...grant,text:body.text,stillAuthorized});
          if(result.status==='reserved'){
            owner={operation:grant.operation,session:session.id,scope:scope.key,stop};
            saves.set(run.id,owner);
            // Only isolated deterministic hosts can pause or fault here.
            await fault?.('reserved',grant,stop.signal);
            const capability=gatedMemorySave(memory,scope,{...grant,beforeCommit:fault?()=>fault('before-commit',grant,stop.signal):undefined},stillAuthorized);
            result=await capability({text:body.text},{victActorId:actor,victTurnId:run.id,victIdempotencyKey:body.operation,signal:stop.signal});
            if(result.status==='saved')await fault?.('committed',grant,stop.signal);
          }
        }catch{
          if(owner){
            saves.delete(run.id);
            const observed=saveEvidence(scope,grant,true);
            if(observed.status==='saved')return operationView(scope,observed);
            if(observed.status==='uncertain')asNotSaved(observed);
            if(stop.signal.aborted)asNotSaved(store().withdraw(scope,session.id,run.id,'cancelled'));
          }
          throw error(503,'Studio could not confirm this save. Check the original operation before confirming again.');
        }finally{if(saves.get(run.id)===owner)saves.delete(run.id);}
        return operationView(scope,result);
      }
      if(path==='/memory/correct'||path==='/memory/forget'){
        if(!uuid(body.id))throw error(400,'Select a memory to change.');
        let result;
        try{result=store().change(scope,{action:path.slice('/memory/'.length),id:body.id,session:session.id,
          expectedRevision:body.revision,operation:body.operation,text:body.text,stillAuthorized});}
        catch{throw error(503,'Studio could not confirm this change. Retry to check for a committed receipt.');}
        return operationView(scope,result);
      }
      throw error(404,'Unknown Studio memory operation.');
    },
  };
}
