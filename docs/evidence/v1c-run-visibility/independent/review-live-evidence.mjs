import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [url,captureFile,label='review']=process.argv.slice(2);
assert.ok(url?.startsWith('http://127.0.0.1:'));
const source=await readFile(captureFile),capture=JSON.parse(source);
assert.equal(capture.fixture,false);
assert.equal(capture.confirmed,'For future Orchid updates, use two short bullets.');
const phases=['sameSession','afterRestart'].map(name=>({name,session:capture[name].session,cases:capture[name].cases.map(item=>({run:item.id,input:item.input,reply:item.reply,directive:item.directive.status,proposal:item.proposal,request:item.request,admitted:item.admitted.map(m=>({id:m.id,revision:m.revision,updatedAt:m.updatedAt}))}))}));
for(const phase of phases){assert.equal(phase.cases.length,5);for(const item of phase.cases){assert.equal(item.directive,'none');assert.equal(item.proposal,null);assert.equal(item.request,null);assert.equal(item.admitted[0].id,capture.receipt.memoryId);assert.equal(item.admitted[0].revision,capture.receipt.revision);}}
// GET only: review the orchestrator's already executed synthetic live records.
const snapshot=await fetch(url+'/api/studio').then(r=>{assert.ok(r.ok);return r.json();});
const parent=snapshot.runs.find(r=>r.id==='4fa613bc-f0b5-4155-9dbe-0902a7eb9aea');
const child=snapshot.runs.find(r=>r.id==='af5bb3fa-8de2-4572-a6e4-178dc031eded');
assert.equal(parent.status,'completed');assert.equal(child.status,'completed');assert.equal(child.parentRun,parent.id);
const accepted=snapshot.sessions.find(s=>s.id===parent.session).messages.find(m=>m.id===parent.id+'-agent'&&m.role==='assistant');assert.ok(accepted?.text);
const record={attribution:'manager executed live; verifier read existing capture and GET snapshot only',sourceCaptureSha256:createHash('sha256').update(source).digest('hex'),phases,receipt:{operation:capture.receipt.operation,memoryId:capture.receipt.memoryId,revision:capture.receipt.revision,at:capture.receipt.at},parent:{id:parent.id,status:parent.status,revision:parent.revision,activation:parent.activation,acceptedReply:accepted.text,reportFinalAnswer:parent.report.finalAnswer,matchesAccepted:parent.report.finalAnswer===accepted.text,modelSteps:parent.modelSteps,providerAttempts:parent.providerAttempts,toolCalls:parent.toolCalls},child:{id:child.id,parentRun:child.parentRun,parentInvocation:child.parentInvocation,status:child.status,revision:child.revision,activation:child.activation,result:child.report.finalAnswer,modelSteps:child.modelSteps,providerAttempts:child.providerAttempts,toolCalls:child.toolCalls,expectedResult:child.report.specialist.expectedResult},combined:parent.report.budget.combined,teamLimit:parent.report.budget.teamLimit};
await mkdir('.local/independent',{recursive:true});
await writeFile('.local/independent/live-'+label+'.json',JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({label,memoryCases:phases.reduce((n,p)=>n+p.cases.length,0),parentMatchesAccepted:record.parent.matchesAccepted,parent:parent.id,child:child.id,dispatchesByVerifier:0,captureSha256:record.sourceCaptureSha256}));
process.exitCode=record.parent.matchesAccepted?0:1;
