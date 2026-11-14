import test from 'node:test';
import assert from 'node:assert/strict';
import { capturePublicEvent,projectRunReport } from '../packages/run-visibility/index.mjs';

const base={streamId:'stream-one',turnId:'run-one',threadId:'thread-one',actorId:'actor-one',agentProfileVersion:'profile-one',victRunId:'run-one',activationVersion:'activation-one'};
const event=(seq,kind,extra={})=>{
  const result=capturePublicEvent({...base,seq,kind,...extra},'2026-11-14T00:00:00Z');
  assert.ok(result,'Fixture must cross the real strict public schema: '+kind);
  return result;
};
const run=(extra={})=>({id:'run-one',session:'session-one',activation:'activation-one',revision:'revision-one',name:'Parent',status:'completed',output:'Accepted final answer.',fixture:'run-visibility',execution:{maxSteps:5,maxToolCalls:3,maxRetries:2},modelSteps:2,providerAttempts:3,toolCalls:1,usage:{inputTokens:11,outputTokens:7,totalTokens:18},publicEvents:[event(1,'response.started'),event(2,'content.completed',{contentRef:'conversation:accepted'}),event(3,'response.completed')],...extra});

test('strict capture rejects private/raw/foreign schema and detaches producer state',()=>{
  assert.equal(capturePublicEvent({...base,seq:1,kind:'child.question'}),null);
  assert.equal(capturePublicEvent({...base,seq:1,kind:'text.delta',delta:'answer',reasoning:'PRIVATE_CANARY'}),null);
  const original={...base,seq:1,kind:'usage.updated',usage:{inputTokens:1,outputTokens:2,totalTokens:3}};
  const captured=capturePublicEvent(original);original.usage.totalTokens=99;
  assert.equal(captured.event.usage.totalTokens,3);
});

test('unaccepted response delta payload never crosses operational capture but its sequence remains',()=>{
  const capture=event(2,'text.delta',{delta:'UNACCEPTED-FIXTURE-CANARY'});
  assert.doesNotMatch(JSON.stringify(capture),/UNACCEPTED-FIXTURE-CANARY/);
  assert.equal(capture.event.seq,2);assert.equal(capture.event.kind,'text.delta');
  assert.equal(capture.event.delta,undefined);assert.match(capture.payloadStatus,/not-retained/);
  const report=projectRunReport({run:run({status:'failed',output:undefined,errorCode:'VICT_AGENT_STRUCTURED_OUTPUT_REJECTED',publicEvents:[event(1,'response.started'),capture,event(3,'response.failed',{code:'VICT_AGENT_STRUCTURED_OUTPUT_REJECTED'})]})});
  assert.doesNotMatch(JSON.stringify(report),/UNACCEPTED-FIXTURE-CANARY/);
  assert.equal(report.finalAnswer,null);assert.deepEqual(report.gaps,[]);
});

test('projection is pure, stable, and ordinary settlement creates no fake Continued working',()=>{
  const source=run();const before=structuredClone(source);
  const report=projectRunReport({run:source});
  assert.deepEqual(report,projectRunReport({run:source}));assert.deepEqual(source,before);
  assert.equal(report.finalAnswer,source.output);assert.equal(report.origin,'fixture');
  assert.deepEqual(report.groups.map(g=>g.label),['Working']);
  assert.equal(report.groups[0].rows[1].kind,'content.completed');
  assert.equal(report.groups[0].rows[1].contentRef,'conversation:accepted');
  assert.equal(report.reasoning.status,'unavailable');
});

test('actual work after an answer gets a stable separate group and visible denial',()=>{
  const source=run({status:'failed',errorCode:'VICT_SCOPE_DENIED',publicEvents:[event(1,'response.started'),event(2,'content.completed',{contentRef:'conversation:answer'}),event(3,'tool.requested',{toolCallId:'call-one',toolName:'read'}),event(4,'tool.failed',{toolCallId:'call-one',toolName:'read',code:'VICT_SCOPE_DENIED'}),event(5,'response.failed',{code:'VICT_SCOPE_DENIED'})]});
  const report=projectRunReport({run:source});
  assert.deepEqual(report.groups.map(g=>g.label),['Working','Continued working']);
  assert.equal(report.state,'Interrupted');assert.ok(report.problems.some(p=>p.code==='VICT_SCOPE_DENIED'));
  assert.equal(report.groups[1].rows.filter(row=>row.kind==='tool.failed').length,1);
  assert.equal(report.groups[1].id,'run-one:group:stream-one:3');
});

test('duplicates render once, gaps are explicit, foreign and late events cannot regress state',()=>{
  const start=event(1,'response.started');
  const source=run({publicEvents:[start,start,event(3,'response.completed'),event(4,'response.started'),{event:{...base,seq:5,turnId:'foreign',kind:'response.failed',code:'VICT_PRIVATE_FOREIGN'},at:null}]});
  const report=projectRunReport({run:source});
  assert.equal(report.state,'Finished');assert.equal(report.groups.flatMap(g=>g.rows).length,2);
  assert.deepEqual(report.gaps,[{streamId:'stream-one',from:2,to:2}]);
  assert.ok(report.problems.some(p=>p.code==='PUBLIC_EVENT_AFTER_TERMINAL'));
  assert.ok(report.problems.some(p=>p.code==='PUBLIC_EVENT_REJECTED'));
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE_FOREIGN/);
});

test('snapshot truth does not turn a disconnect or sparse stream into interruption',()=>{
  const report=projectRunReport({run:run({status:'running',output:undefined,publicEvents:[event(3,'response.started')]})});
  assert.equal(report.state,'Running');assert.equal(report.finalAnswer,null);assert.equal(report.gaps.length,1);
});

test('replay fills an earlier gap before interpreting terminal order without dispatch or source mutation',()=>{
  const source=run({publicEvents:[event(1,'response.started'),event(3,'response.completed')]});
  const sparse=projectRunReport({run:source});
  assert.deepEqual(sparse.gaps,[{streamId:'stream-one',from:2,to:2}]);
  const filled=run({publicEvents:[...source.publicEvents,event(2,'tool.started',{toolCallId:'call-one',toolName:'read'}),source.publicEvents[1]]});
  const before=structuredClone(filled);
  const report=projectRunReport({run:filled});
  assert.deepEqual(report.gaps,[]);
  assert.deepEqual(report.groups.flatMap(group=>group.rows).map(row=>row.seq),[1,2,3]);
  assert.equal(report.groups[0].id,sparse.groups[0].id);
  assert.equal(report.state,'Finished');assert.deepEqual(filled,before);
  assert.ok(!report.problems.some(problem=>problem.code==='PUBLIC_EVENT_AFTER_TERMINAL'||problem.code==='PUBLIC_EVENT_OUT_OF_ORDER'));
});

test('replay orders each stream independently without propagating another stream answer boundary',()=>{
  const second=(seq,kind,extra={})=>capturePublicEvent({...base,streamId:'stream-two',seq,kind,...extra},'1900-01-01T00:00:00Z');
  const source=run({publicEvents:[event(2,'content.completed',{contentRef:'conversation:answer'}),second(2,'tool.started',{toolCallId:'call-two',toolName:'read'}),event(1,'response.started'),second(1,'response.started'),event(3,'response.completed'),second(3,'response.completed'),event(4,'tool.started',{toolCallId:'late-call',toolName:'read'})]});
  const report=projectRunReport({run:source});
  assert.deepEqual(report.gaps,[]);
  assert.deepEqual(report.groups.map(group=>[group.streamId,group.label]),[['stream-one','Working'],['stream-two','Working']]);
  assert.deepEqual(report.groups.map(group=>group.rows.map(row=>row.seq)),[[1,2,3],[1,2,3]]);
  assert.match(report.eventOrder,/not a global timeline/);
  assert.ok(report.problems.some(problem=>problem.code==='PUBLIC_EVENT_AFTER_TERMINAL'));
  assert.equal(report.state,'Finished');
});

test('per-run budgets and deduplicated totals preserve unknowns and never invent a team cap',()=>{
  const parent=run();
  const child={id:'child-one',parentRun:parent.id,session:parent.session,name:'Research',status:'completed',execution:{maxSteps:3,maxToolCalls:2,maxRetries:0},modelSteps:1,providerAttempts:1,toolCalls:1,usage:{inputTokens:3,outputTokens:4}};
  const report=projectRunReport({run:parent,relatedRuns:[child,child,{...child,id:'foreign',session:'elsewhere'}]});
  assert.equal(report.budget.runs.length,2);
  assert.equal(report.budget.runs[0].dimensions.find(d=>d.key==='modelSteps').remaining,3);
  assert.equal(report.budget.combined.find(d=>d.key==='toolCalls').consumed,2);
  assert.equal(report.budget.combined.find(d=>d.key==='retries').consumed,null);
  assert.ok(report.budget.combined.every(d=>d.limit===null&&d.remaining===null));
  assert.equal(report.budget.teamLimit,'Not configured');
  assert.equal(report.specialist.children.length,1);
});

test('historical evidence exposes unavailability without guessed counters or exchange results',()=>{
  const report=projectRunReport({run:{id:'old-run',status:'uncertain',events:[{label:'Old receipt',at:'yesterday'}]}});
  assert.equal(report.state,'Uncertain');assert.equal(report.groups[0].rows[0].seq,null);
  assert.ok(report.budget.runs[0].dimensions.every(d=>d.consumed===null));
  assert.equal(report.specialist.expectedResult,null);assert.equal(report.specialist.task,null);
  assert.deepEqual(report.specialist.exchanges,[]);assert.match(report.specialist.exchangeAvailability,/Unavailable/);
});
