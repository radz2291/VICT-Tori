import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';

const {appendPublicEventCapture,capturePublicEvent,projectRunReport} =
  await import(pathToFileURL(join(process.cwd(),'packages/run-visibility/index.mjs')).href);
const base={turnId:'replay-turn',streamId:'replay-stream',threadId:'fixture-thread',
  actorId:'fixture-actor',agentProfileVersion:'fixture-profile',victRunId:'replay-turn',activationVersion:'fixture-pin'};
function capture(seq,kind,fields={}){
  const result=capturePublicEvent({...base,seq,kind,...fields},'2026-11-14T00:00:00Z');
  assert.ok(result);
  return result;
}
const complete=capture(2,'tool.completed',{toolCallId:'fixture-call',toolName:'read'});
const failure=capture(2,'tool.failed',{toolCallId:'fixture-call',toolName:'read',code:'VICT_SCOPE_DENIED'});
const dispositions=[[complete,failure],[failure,complete]];
const reports=[];
for (const order of dispositions) {
  let captures=[capture(1,'response.started')];
  assert.ok(appendPublicEventCapture(captures,order[0]));
  captures=JSON.parse(JSON.stringify(captures));
  assert.ok(appendPublicEventCapture(captures,order[1]));
  captures=JSON.parse(JSON.stringify(captures));
  for (const observation of order) {
    const reordered=Object.fromEntries(Object.entries(observation).reverse());
    reordered.event=Object.fromEntries(Object.entries(reordered.event).reverse());
    assert.equal(appendPublicEventCapture(captures,reordered),null);
  }
  assert.equal(captures.filter(row=>row.event.seq===2).length,2);
  assert.ok(appendPublicEventCapture(captures,capture(3,'response.completed')));
  const readAfterReopen=JSON.parse(JSON.stringify(captures));
  const run={id:base.turnId,session:'fixture-session',status:'completed',output:'accepted result',
    activation:base.activationVersion,publicEvents:readAfterReopen,fixture:'run-visibility'};
  const before=JSON.stringify(run);
  const report=projectRunReport({run});
  assert.equal(JSON.stringify(run),before);
  assert.deepEqual(report.problems.map(row=>row.code),['PUBLIC_EVENT_CONFLICT']);
  assert.deepEqual(report.groups.flatMap(group=>group.rows.map(row=>row.seq)),[1,3]);
  assert.equal(report.finalAnswer,'accepted result');
  assert.equal(report.state,'Finished');
  assert.deepEqual(report.gaps,[]);
  reports.push(report);
  console.log(JSON.stringify({order:order.map(row=>row.event.kind),snapshotReload:true,
    retainedRows:[1,3],problem:'PUBLIC_EVENT_CONFLICT',state:report.state,result:'PASS'}));
}
assert.deepEqual(reports[0],reports[1]);
