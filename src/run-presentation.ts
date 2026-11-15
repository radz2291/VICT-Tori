import type { ConversationActivity, ConversationEvent, ConversationMessage } from '@victframework/ui-ai-svelte';

/** Presentation only: input is the existing authorized Run projection. */
export type Density = 'quiet' | 'summary' | 'full';
export type RunView = { id: string; name?: string; parentRun?: string; status?: string; state?: string; message?: string; input?: string; output?: string;
  report?: {finalAnswer?: string; terminalReason?: string; state?: string;
    groups?: readonly Group[]; problems?: readonly {code: string; label: string}[];
    specialist?: {task?: string; parentInvocation?: string; children?: readonly {id: string; name: string; status: string}[]} };
  scriptReceipts?: readonly {invocationId: string; key?: string; result?: {text?: string}}[];
  publicEvents?: readonly {event: {streamId: string; seq: number; toolCallId?: string}}[];
  activityInvocations?: readonly {invocationId: string; toolCallId: string}[];
};
type Group = {id: string; label: string; afterAnswer: boolean; rows: readonly Receipt[]};
type Receipt = {id: string; kind: string; label: string; streamId?: string; invocationId?: string; attemptId?: string; code?: string; seq?: number; contentRef?: string};
type Activity = ConversationActivity & {destination?: {id: string; name: string}};
const operationStates: Record<string, ConversationActivity['state']> = {
  'tool.requested':'pending','tool.awaiting_approval':'pending','tool.started':'running','tool.completed':'completed','tool.failed':'failed',
};
const stageTitles: Record<string,string> = {'tool.requested':'Requested','tool.awaiting_approval':'Awaiting approval',
  'tool.started':'Started','tool.completed':'Completed','tool.failed':'Did not complete'};
const limit = (code: string) => /STEP.*LIMIT/i.test(code) ? 'Model step limit reached.' :
  /TOOL.*LIMIT|CALL_LIMIT/i.test(code) ? 'Tool call limit reached.' : /LIMIT/i.test(code) ? 'Execution limit reached.' : undefined;
function warning(code: string) {
  if(/INTERRUPTED/i.test(code))return 'Interrupted before the turn completed.';
  if(/DEADLINE|TIMEOUT|TIME_LIMIT/i.test(code))return 'Time limit reached.';
  if(/_STOP$|CANCELLED/i.test(code))return 'Turn stopped.';
  if(/DENIED|FORBIDDEN|REVOKED/i.test(code))return 'A requested action was denied.';
  if(/PUBLIC_EVENT_GAP|PUBLIC_EVENT_CONFLICT|PUBLIC_EVENT_REJECTED|OUTCOME_UNKNOWN|UNCERTAIN/i.test(code))
    return 'Some activity could not be confirmed. The saved Run remains authoritative.';
  return limit(code);
}
function operationTitle(row: Receipt, activityState: ConversationActivity['state'], child?: {name: string}) {
  const token=row.label.split(' · ')[1]??'';
  const base=child ? child.name :
    /local_reference|local-reference|read-only-source|observatory/i.test(token) ? 'read-only source' :
    /delegate|saved_agent|reference_reviewer/i.test(token) ? 'specialist' :
    /draft.*(edit|apply)|workspace.*(edit|assemble)/i.test(token) ? 'draft change' : 'tool';
  if(row.kind==='tool.awaiting_approval')return base+' · Awaiting approval';
  if(activityState==='failed')return /DENIED|FORBIDDEN|REVOKED/i.test(row.code??'') ?
    (child?child.name:'Read '+base)+' · Denied' : 'Could not run '+base;
  if(activityState==='cancelled')return base+' · Interrupted';
  if(activityState==='running')return 'Running '+base;
  if(activityState==='completed')return (base==='read-only source'?'Read ':'Ran ')+base;
  return 'Run '+base;
}

function rollUp(group: Group,run: RunView,runs: readonly RunView[]): Activity[] {
  const buckets=new Map<string,Receipt[]>();
  const captured=new Map((run.publicEvents??[]).map(({event})=>[JSON.stringify([event.streamId,event.seq]),event]));
  const callId=(row: Receipt)=>{
    const value=captured.get(JSON.stringify([row.streamId,row.seq]))?.toolCallId;
    return value&&value!=='unknown'?value:undefined;
  };
  for(const row of group.rows){
    if(!Object.hasOwn(operationStates,row.kind)||!row.streamId)continue;
    // Only already-projected rows participate. Mastra's public tool call ID
    // connects lifecycle rows when the upstream event omits invocation ID.
    const call=callId(row);
    if(!call&&!row.invocationId)continue;
    const id=JSON.stringify([run.id,row.streamId,call?'call':'invocation',call??row.invocationId]);
    const pile=buckets.get(id);
    if(pile)pile.push(row);else buckets.set(id,[row]);
  }
  return [...buckets].map(([id,rows])=>{
    const last=rows.at(-1)!;
    const matches=run.activityInvocations?.filter(item=>item.toolCallId===callId(last))??[];
    const invocation=last.invocationId??(matches.length===1?matches[0].invocationId:undefined);
    const related=run.report?.specialist?.children?.find(child=>
      invocation&&runs.find(candidate=>candidate.id===child.id)?.report?.specialist?.parentInvocation===invocation);
    const child=related?runs.find(candidate=>candidate.id===related.id):undefined;
    const script=run.scriptReceipts?.find(item=>item.invocationId===invocation);
    const observed=operationStates[last.kind];
    const terminal=run.state!==undefined&&run.state!=='Running';
    const unconfirmed=terminal&&(observed==='running'||observed==='pending');
    const state=unconfirmed?'cancelled':observed;
    const input=script?.key??child?.report?.specialist?.task;
    const result=script?.result?.text??child?.report?.finalAnswer;
    return {
      id,title:operationTitle(last,state,related),state,
      detail:unconfirmed?'The saved Run did not confirm this action’s outcome.':warning(last.code??'')??
        (state==='running'?'This action is in progress.':state==='completed'?'The Run confirmed completion.':undefined),
      input:input ? {text:input} : {text:'Input was not retained for this call.',unavailable:true},
      result:result ? {text:result} : (state==='running'||state==='pending'?undefined:{
        text:unconfirmed?'Result could not be confirmed.':'Result was not retained for this call.',unavailable:true,
      }),
      stages:rows.map(row=>({id:row.id,title:stageTitles[row.kind],state:operationStates[row.kind],
        detail:[row.kind,row.attemptId?'Attempt '+row.attemptId:null,row.seq==null?null:'Sequence '+row.seq,row.code].filter(Boolean).join(' · ')})),
      ...(related?{destination:{id:related.id,name:related.name}}:{}),
    };
  });
}

export function presentTurn(run:RunView, answer:string, density:Density, related:readonly RunView[]) {
  const events:ConversationEvent[]=[];
  const destinations=new Map<string,{id:string;name:string}>();
  const report=run.report;
  const warnings=new Set<string>();
  const terminal=report?.terminalReason??'';
  if(run.message&&!/^(VICT|TORI)_[A-Z0-9_]+$/.test(run.message))warnings.add(run.message);
  else if(terminal&&warning(terminal))warnings.add(warning(terminal)!);
  for(const problem of report?.problems??[]){
    if(problem.code==='PUBLIC_EVENT_METADATA_UNAVAILABLE')continue;
    if(warnings.size&&problem.code===terminal)continue;
    if(warning(problem.code))warnings.add(warning(problem.code)!);
    else if(problem.code!=='completed'&&problem.code!=='running')warnings.add('An action or response did not complete.');
  }
  if(report?.state==='Uncertain'&&!warnings.size)warnings.add('The outcome could not be confirmed.');
  if(report?.state==='Interrupted'&&!warnings.size)warnings.add('The response did not complete.');
  for(const text of warnings)events.push({id:run.id+':warning:'+text,kind:'summary',text});
  const relatedGroups=(report?.groups??[]).map(group=>({group,activities:rollUp(group,run,related)}));
  const pre=relatedGroups.filter(({group})=>!group.afterAnswer);
  const post=relatedGroups.filter(({group})=>group.afterAnswer);
  const append=(groups:typeof relatedGroups)=>{
    if(density==='quiet')return;
    for(const {group,activities} of groups){
      if(!activities.length)continue;
      events.push({id:group.id,kind:'summary',text:group.label});
      for(const activity of activities){
        events.push({id:activity.id,kind:'activity',activity});
        if(activity.destination)destinations.set(activity.id,activity.destination);
      }
    }
  };
  append(pre);
  const text=answer||report?.finalAnswer;
  if(text)events.push({id:run.id+':answer',kind:'text',text});
  else events.push({id:run.id+':no-answer',kind:'summary',text:run.state==='Running'||run.status==='running' ?
    'Waiting for the answer.' : 'No final answer was received.'});
  append(post);
  return {events,destinations,warnings:[...warnings]};
}

export function presentConversation(original:readonly ConversationMessage[],runs:readonly RunView[],density:Density) {
  const messages:ConversationMessage[]=[];
  const scopes=new Map<string,{run:RunView; destinations:ReturnType<typeof presentTurn>['destinations']; warnings:string[]}>();
  const indexed=new Map(original.map(message=>[message.id,message]));
  const roots=new Map(runs.filter(run=>!run.parentRun).map(run=>[run.id+'-user',run]));
  const skip=new Set<string>();
  for(const message of original){
    if(skip.has(message.id))continue;
    messages.push(message);
    const run=roots.get(message.id);
    if(!run)continue;
    const replyId=run.id+'-agent';
    const reply=indexed.get(replyId);
    const answer=reply?.text??run.report?.finalAnswer??'';
    const {events,destinations,warnings}=presentTurn(run,answer,density,runs);
    messages.push({id:replyId,role:'assistant',text:answer,events});
    scopes.set(replyId,{run,destinations,warnings});
    skip.add(replyId);
  }
  return {messages,scopes};
}
