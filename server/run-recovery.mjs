import { AgentTurnService } from '@victframework/control';
import { randomUUID } from 'node:crypto';

const now=()=>new Date().toISOString();
const protectedEffect=effect=>!['read','pure'].includes(effect);
const settled=new Set(['completed','failed','declined','cancelled']);

// The pinned host is a single owner. On a new process there is no resumable
// VICT executor; only reconcile persisted intent/receipt data.
export async function recoverRunRecords(state,stores,authoring){
  const unsettled=state.runs.filter(run=>run.status==='running');
  if(!unsettled.length)return false;
  const turns=new AgentTurnService({stores});
  await turns.reconcileAfterRestart();
  const evidence=new Map();
  for(const run of unsettled){
    const invocations=await stores.invocations.listInvocationsForTurn(run.id);
    evidence.set(run.id,invocations);
  }
  for(const run of unsettled){
    const invocations=evidence.get(run.id);
    const tools=[];
    let unknown=false;
    for(const intent of invocations){
      let status=intent.status;
      const localReceipt=protectedEffect(intent.effect)&&authoring.findReceipt(run.id,intent.idempotencyKey,state);
      if(status==='running'&&intent.runFenceToken){
        // VICT controls the fence. Preserve its outcome_unknown even when
        // TORI has separate domain evidence accounting for the effect.
        const recorded=await stores.invocations.reconcileAbandonedRun({
          invocationId:intent.invocationId,observedFenceToken:intent.runFenceToken,
          reconciledFenceToken:randomUUID(),at:Date.now(),
        });
        status=recorded.status;
      }else if(['intent','approved'].includes(status)){
        const recorded=await stores.invocations.settleInvocationPending({
          invocationId:intent.invocationId,status:'cancelled',at:Date.now(),errorCode:'VICT_TURN_INTERRUPTED',
        });
        status=recorded.status;
      }
      if(protectedEffect(intent.effect)&&!localReceipt&&!settled.has(status))unknown=true;
      tools.push({id:intent.invocationId,operation:intent.idempotencyKey,capability:intent.capabilityId,
        effect:intent.effect,status,...(localReceipt?{disposition:localReceipt}:{})});
    }
    const unconfirmedDraft=authoring.pendingEffects(run.id);
    if(unconfirmedDraft.length)unknown=true;
    const at=now();
    const delegates=state.runs.filter(child=>child.parentRun===run.id);
    const turn=await stores.turns.getTurn(run.id);
    run.status=unknown?'uncertain':'interrupted';
    run.ended=at;
    run.message=unknown?'Studio restarted with an unresolved effect. Check the original operation before retrying.':
      'Studio restarted before the turn result was confirmed. It was not replayed.';
    run.recovery={at,decision:run.status,replay:'none',priorOwner:run.ownerId,
      ...(turn?{victTurn:{id:turn.turnId,status:turn.status,reason:turn.errorCode}}:{}),
      tools,unconfirmedDraft,children:delegates.map(child=>({run:child.id,invocation:child.parentInvocation,
        operation:child.parentOperation,status:child.status==='running'?'owner-lost':child.status})),
      ...(run.parentRun?{parent:run.parentRun,invocation:run.parentInvocation,operation:run.parentOperation}:{})};
    run.events.push({at,label:unknown?'Uncertain · unresolved effect':'Interrupted · no replay'});
    const session=state.sessions.find(s=>s.id===run.session);
    if(session)session.interrupted=true;
  }
  return true;
}
