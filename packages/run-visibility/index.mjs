import { validateAgentStreamEvent } from '@victframework/contracts';

export const RUN_REPORT_SCHEMA='tori.run-report@1';
export const QUESTION_UNAVAILABLE='Unavailable: the pinned public runtime has no governed parent answer and child continuation mechanism.';
const states={completed:'Finished',running:'Running',failed:'Interrupted',cancelled:'Interrupted',interrupted:'Interrupted',blocked:'Interrupted',uncertain:'Uncertain'};
const text=value=>typeof value==='string'?value:null;
const count=value=>Number.isSafeInteger(value)&&value>=0?value:null;
const terminalKinds=new Set(['response.completed','response.failed','response.cancelled']);
const labels={
  'response.started':'Response started','text.delta':'Response text received','content.completed':'Answer recorded',
  'tool.requested':'Tool requested','tool.started':'Tool started','tool.awaiting_approval':'Tool awaiting approval',
  'tool.completed':'Tool completed','tool.failed':'Tool failed','memory.updated':'Session history updated',
  'usage.updated':'Usage recorded','response.completed':'Response completed','response.failed':'Response failed','response.cancelled':'Response cancelled',
};

// This is a TORI operational receipt, NOT a new VICT event. A text.delta may
// precede structured-output acceptance; its payload must never enter this
// report. Retain sequence/correlation only and point to authoritative accepted
// Run output for content. The strict upstream event/hub stays unchanged.
export function capturePublicEvent(event,at=null){
  if(!validateAgentStreamEvent(event).ok)return null;
  if(event.kind==='text.delta'){
    const {delta,...identity}=event;
    return {schema:'tori.public-event-receipt@1',event:structuredClone(identity),at:text(at),payloadStatus:'not-retained; accepted Run output is authoritative'};
  }
  return {schema:'tori.public-event-receipt@1',event:structuredClone(event),at:text(at)};
}

function validCapture(capture){
  const event=capture?.event;
  if(event?.kind!=='text.delta')return validateAgentStreamEvent(event).ok;
  // Validate the closed delta metadata shape against the installed validator,
  // without emitting or retaining a fabricated upstream text event.
  return capture.schema==='tori.public-event-receipt@1'&&
    capture.payloadStatus==='not-retained; accepted Run output is authoritative'&&
    !Object.hasOwn(event,'delta')&&validateAgentStreamEvent({...event,delta:'metadata-validation-only'}).ok;
}

function matches(event,run){
  const scope=run.observation;
  return event.turnId===run.id && (event.victRunId===undefined||event.victRunId===run.id) &&
    (event.activationVersion===undefined||event.activationVersion===run.activation) &&
    (!scope||(event.streamId===scope.stream&&event.threadId===scope.thread&&event.actorId===scope.actor&&event.agentProfileVersion===scope.profile));
}

function dimension(key,label,limit,consumed,stopReason){
  limit=count(limit);consumed=count(consumed);
  return {key,label,limit,consumed,remaining:limit===null||consumed===null?null:Math.max(0,limit-consumed),stopReason};
}
function budgetRow(run){
  const limits=run.execution??{};
  const stopReason=text(run.errorCode)??(run.status==='cancelled'?'Cancelled':null);
  return {runId:run.id,name:text(run.name)??run.id,dimensions:[
    dimension('modelSteps','Model steps',limits.maxSteps,run.modelSteps,stopReason),
    dimension('providerAttempts','Provider attempts',null,run.providerAttempts,stopReason),
    // Retries are a configured per-request allowance. attempts - steps is not a
    // proven retry counter, so it must not be presented as observed retries.
    dimension('retries','Model retries',limits.maxRetries,run.providerRetries,stopReason),
    dimension('toolCalls','Admitted tool calls',limits.maxToolCalls,run.toolCalls??run.governance?.admittedCalls,stopReason),
    dimension('inputTokens','Input tokens',null,run.usage?.inputTokens,stopReason),
    dimension('outputTokens','Output tokens',null,run.usage?.outputTokens,stopReason),
  ]};
}

/** Pure view over host-authorized public records. Does not fetch or dispatch. */
export function projectRunReport({run,relatedRuns=[]}){
  if(!run||typeof run.id!=='string')throw new TypeError('A Run identity is required.');
  const problems=[],gaps=[],groups=[],seen=new Map(),streams=new Map();
  const addProblem=(code,label)=>{if(!problems.some(x=>x.code===code&&x.label===label))problems.push({code,label});};
  const state=states[run.status]??'Uncertain';
  const terminalReason=text(run.errorCode)??text(run.terminalReason)??text(run.message);
  if(state==='Interrupted'||state==='Uncertain')addProblem(text(run.errorCode)??run.status??'UNAVAILABLE',text(run.message)??terminalReason??state);
  let group=null,afterAnswer=false,rows=0;
  function append(row){
    if(!group){group={id:run.id+':group:'+row.id,label:afterAnswer?'Continued working':'Working',afterAnswer,rows:[]};groups.push(group);}
    group.rows.push(row);rows++;
  }
  for(const capture of run.publicEvents??[]){
    const event=capture?.event;
    if(!validCapture(capture)||!matches(event,run)){addProblem('PUBLIC_EVENT_REJECTED','An invalid or unrelated public event was omitted.');continue;}
    const id=event.streamId+':'+event.seq;
    const signature=JSON.stringify(event);
    if(seen.has(id)){
      if(seen.get(id)!==signature)addProblem('PUBLIC_EVENT_CONFLICT','Conflicting copies of a public event are unavailable.');
      continue;
    }
    seen.set(id,signature);
    let stream=streams.get(event.streamId);
    if(!stream){stream={last:0,terminal:false};streams.set(event.streamId,stream);}
    if(event.seq<=stream.last){addProblem('PUBLIC_EVENT_OUT_OF_ORDER','Out-of-order public evidence is unavailable.');continue;}
    if(event.seq>stream.last+1)gaps.push({streamId:event.streamId,from:stream.last+1,to:event.seq-1});
    stream.last=event.seq;
    if(stream.terminal){addProblem('PUBLIC_EVENT_AFTER_TERMINAL','Late stream evidence cannot change the authoritative Run outcome.');continue;}
    if(terminalKinds.has(event.kind))stream.terminal=true;
    // Text deltas do not become separate activity rows or fake answers. The
    // authoritative accepted output remains the final answer source.
    if(event.kind==='text.delta')continue;
    if(event.kind==='tool.failed'||event.kind==='response.failed')addProblem(event.code,labels[event.kind]+': '+event.code);
    if(event.kind==='response.cancelled')addProblem('RESPONSE_CANCELLED','Response cancelled');
    const row={id,kind:event.kind,label:labels[event.kind]+(event.toolName?' · '+event.toolName:''),at:text(capture.at),
      streamId:event.streamId,seq:event.seq,invocationId:text(event.victInvocationId),attemptId:text(event.victAttemptId),
      code:text(event.code),contentRef:text(event.contentRef)};
    // Settlement bookkeeping after an answer is not new work. Only an actual
    // subsequent response/tool activity begins a Continued working group.
    if(afterAnswer&&!group&&groups.length&&(terminalKinds.has(event.kind)||event.kind==='usage.updated'||event.kind==='memory.updated')){
      groups.at(-1).rows.push(row);rows++;
    }else append(row);
    if(event.kind==='content.completed'){afterAnswer=true;group=null;}
  }
  if(gaps.length)addProblem('PUBLIC_EVENT_GAP','Some stream evidence is unavailable; the saved Run remains authoritative.');
  if(!(run.publicEvents?.length)){
    for(const [index,event] of (run.events??[]).entries()){
      if(!text(event.label))continue;
      append({id:run.id+':legacy:'+index,kind:'historical.label',label:event.label,at:text(event.at),streamId:null,seq:null,invocationId:null,attemptId:null,code:null,contentRef:null});
    }
    addProblem('PUBLIC_EVENT_METADATA_UNAVAILABLE','Historical Run: public sequence and correlation evidence is unavailable.');
  }
  const authorized=new Map([[run.id,run]]);
  for(const other of relatedRuns){
    if(!other||typeof other.id!=='string'||authorized.has(other.id))continue;
    if((other.parentRun===run.id||run.parentRun===other.id)&&(!run.session||!other.session||run.session===other.session))authorized.set(other.id,other);
  }
  const budgetRuns=[...authorized.values()].map(budgetRow);
  const combined=budgetRuns[0].dimensions.map((first,index)=>{
    const values=budgetRuns.map(r=>r.dimensions[index].consumed);
    return {...first,limit:null,remaining:null,stopReason:null,consumed:values.every(v=>v!==null)?values.reduce((a,b)=>a+b,0):null};
  });
  const children=[...authorized.values()].filter(r=>r.parentRun===run.id).map(r=>({id:r.id,name:text(r.name)??r.id,status:states[r.status]??'Uncertain'}));
  const summaries=[{label:'Public activity',value:rows}];
  if(count(run.modelSteps)!==null)summaries.push({label:'Model steps',value:run.modelSteps});
  if(count(run.toolCalls??run.governance?.admittedCalls)!==null)summaries.push({label:'Admitted tool calls',value:run.toolCalls??run.governance.admittedCalls});
  if(children.length)summaries.push({label:'Specialists',value:children.length});
  return {schema:RUN_REPORT_SCHEMA,runId:run.id,origin:run.fixture?'fixture':'live',state,terminalReason,finalAnswer:text(run.output),
    groups,problems,summaries,gaps,
    specialist:{task:text(run.input),expectedResult:text(run.expectedResult),revision:text(run.revision),activation:text(run.activation),
      parentRunId:text(run.parentRun),parentInvocation:text(run.parentInvocation),children,exchanges:[],exchangeAvailability:QUESTION_UNAVAILABLE},
    budget:{runs:budgetRuns,combined,teamLimit:'Not configured'},
    reasoning:{status:'unavailable',reason:'No public reasoning events or summary are available under the pinned VICT contract.'},
    provenance:{activation:text(run.activation),revision:text(run.revision),definition:text(run.definition),started:text(run.started),ended:text(run.ended)}};
}
