import { capturePublicEvent, projectRunReport } from '../../packages/run-visibility/index.mjs';

// Synthetic presentation only. A fixture host must retain this origin label.
export const fixtureOrigin='run-visibility-presentation';
const started='2026-11-14T03:00:00.000Z';
const at=seconds=>new Date(Date.parse(started)+seconds*1000).toISOString();
const parentId='rv-fixture-parent',childId='rv-fixture-specialist',sessionId='rv-fixture-session';
const base={session:sessionId,provider:'offline-fixture',model:'deterministic-presentation',route:'coding',tokens:256,fixture:fixtureOrigin,started,ended:at(6),
  status:'completed',state:'Finished',execution:{maxSteps:7,maxToolCalls:5,maxRetries:1,deadlineMs:90000},providerAttempts:2,modelSteps:2,toolCalls:1};
const parent={...base,id:parentId,name:'Quellight fixture',activation:'rv-fixture-parent-activation',revision:'rv-fixture-parent-r1',number:1,
  status:'failed',state:'Interrupted',errorCode:'VICT_SCOPE_DENIED',message:'A read-only tool was denied in this synthetic fixture.',
  input:'Review the synthetic Orchid source.',output:'Synthetic review: the Orchid example needs a source check before publication.'};
const child={...base,id:childId,name:'Research fixture',activation:'rv-fixture-child-activation',revision:'rv-fixture-child-r3',number:3,
  parentRun:parentId,parentInvocation:'rv-fixture-invocation',input:'Check the synthetic Orchid source.',output:'Synthetic finding: the source needs verification.',toolCalls:0};
const event=(run,seq,kind,extra={})=>capturePublicEvent({streamId:run.id+':stream',turnId:run.id,threadId:'rv-fixture-thread',actorId:'rv-fixture-actor',
  agentProfileVersion:run.activation,victRunId:run.id,activationVersion:run.activation,seq,kind,...extra},at(seq));
parent.publicEvents=[event(parent,1,'response.started'),event(parent,2,'content.completed',{contentRef:'conversation:'+parentId+'-agent'}),
  event(parent,3,'tool.requested',{toolCallId:'rv-fixture-read',toolName:'read-only-source'}),
  event(parent,4,'tool.failed',{toolCallId:'rv-fixture-read',toolName:'read-only-source',code:'VICT_SCOPE_DENIED'}),
  event(parent,5,'response.failed',{code:'VICT_SCOPE_DENIED'})];
child.publicEvents=[event(child,1,'response.started'),event(child,2,'content.completed',{contentRef:'conversation:'+childId+'-agent'}),event(child,3,'response.completed')];
for(const run of [parent,child]){
  run.events=run.publicEvents.map(({event,at})=>({at,label:'VICT · '+event.kind,kind:event.kind}));
  run.report=projectRunReport({run,relatedRuns:[parent,child]});
}
export const fixtureRuns=[parent,child];
export const fixtureSession={id:sessionId,name:parent.name,number:1,title:'Run Visibility · synthetic presentation',created:started,lastActivityAt:at(6),activation:parent.activation,
  fixture:fixtureOrigin,archivedFixture:true,route:'coding',messages:[{id:parentId+'-user',role:'user',text:parent.input},{id:parentId+'-agent',role:'assistant',text:parent.output}]};
export function withPresentationFixture(state){return {...state,fixture:true,sessions:[fixtureSession],runs:fixtureRuns};}
