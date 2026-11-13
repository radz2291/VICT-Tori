import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

assert.ok(process.argv.includes('--live-walkthrough'), 'The synthetic Coding walkthrough requires explicit live selection.');
const port=process.env.TORI_DIRECTIVE_LIVE_PORT??'48941';
assert.match(port,/^\d+$/);
const root=fileURLToPath(new URL('../../../..',import.meta.url));
const url='http://127.0.0.1:'+port;
const dataDir=await mkdtemp(join(tmpdir(),'tori-009-live-'));
const env={...process.env,TORI_DATA_DIR:dataDir,TORI_ZAI_ROUTE:'coding',TORI_ENABLE_PI_ZAI:'1',
  TORI_EXECUTION_FIXTURE:'',TORI_TEST_HISTORICAL_ACTIVATION:'0',TORI_ZAI_API_KEY:''};
let host;
const source='Going forward, give me Orchid updates in three short bullets. Keep that as my preference.';
const revised='For future Orchid updates, use two short bullets.';
const recall=[
  'Do you remember what we talked about last week?',
  'Do you remember what we discussed last week?',
  'Ingat lagi apa kita bincang minggu lepas?',
];

async function request(path='',data) {
  const response=await fetch(url+'/api/studio'+path,data===undefined?{}:{
    method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(data),
  });
  assert.equal(response.status,200,'Studio '+path+' returned '+response.status);
  return response.json();
}

async function stopHost(){
  if(!host||host.exitCode!==null||host.signalCode!==null)return;
  const exit=once(host,'exit');
  host.kill();
  await exit;
}

async function startHost(){
  host=spawn(process.execPath,['./node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',port,'--strictPort'],
    {cwd:root,env,windowsHide:true,stdio:'ignore'});
  for(let i=0;i<220;i++){
    if(host.exitCode!==null)break;
    const data=await request().catch(()=>null);
    if(data?.workspace){
      assert.equal(data.fixture,false);
      assert.equal(data.provider,true);
      return;
    }
    await delay(250);
  }
  throw Error('The isolated live host did not start.');
}

async function seed(){
  const child=spawn(process.execPath,['scripts/seed-directive-preview.mjs',url],
    {cwd:root,env,windowsHide:true,stdio:['ignore','pipe','ignore']});
  const exit=once(child,'exit');
  let json='';
  for await(const chunk of child.stdout)json+=chunk;
  assert.equal((await exit)[0],0);
  return JSON.parse(json);
}

async function turn(session,input){
  const start=Date.now();
  const state=await request('/turn',{session,input});
  const run=state.runs.find(item=>item.session===session&&!item.parentRun);
  const http=run.events.flatMap(item=>/^Z\.AI HTTP (\d+)(?: · .*|$)/.exec(item.label)?.[1]??[]).map(Number);
  assert.ok(!http.some(status=>[401,403,429].includes(status)),'Provider returned a stop status '+http.join(', '));
  assert.equal(run.status,'completed',JSON.stringify({status:run.status,http,code:run.errorCode}));
  return {id:run.id,initial:run.directive?.status,elapsedMs:Date.now()-start,
    reply:state.sessions.find(item=>item.id===session).messages.find(item=>item.id===run.id+'-agent').text};
}

async function settled(run){
  for(let i=0;i<130;i++){
    const view=await request('/memory/run',{run});
    assert.ok(![401,403,429].includes(view.directive?.http),'Interpreter returned a stop status '+view.directive.http);
    if(view.directive?.status!=='pending')return view;
    await delay(180);
  }
  throw Error('The Directive did not settle.');
}

try{
  await startHost();
  const initial=await seed();
  const {session,activation}=initial;
  const first=await turn(session,source);
  const follow=await turn(session,'Summarize the planning choice for this conversation.');
  const firstView=await settled(first.id);
  await settled(follow.id);
  assert.equal(firstView.directive.status,'proposal',JSON.stringify(firstView.directive));
  const memory=await request('/memory/session',{session});
  const proposal=memory.turns.find(item=>item.run===first.id)?.proposal;
  assert.equal(memory.records.length,0);
  assert.match(proposal.text,/orchid/i);
  assert.match(proposal.text,/three|\b3\b/i);
  assert.match(proposal.text,/bullet/i);
  const binding={session,run:first.id,operation:proposal.operation};
  const {proposal:corrected}=await request('/memory/revise',{...binding,revision:proposal.directive.revision,text:revised});
  assert.equal(corrected.text,revised);
  const {receipt,memory:record}=await request('/memory/confirm',{...binding,revision:corrected.directive.revision,text:corrected.text});
  assert.equal(record.memory.content,revised);
  assert.equal(receipt.directive.proposalRevision,2);
  const quiet=[];
  for(const input of recall){
    const ordinary=await turn(session,input);
    const view=await settled(ordinary.id);
    assert.equal(view.directive.status,'none',JSON.stringify(view.directive));
    assert.equal(view.proposal,undefined);
    assert.equal(view.request,undefined);
    quiet.push({...ordinary,input,directive:view.directive});
  }
  await stopHost();
  await startHost();
  assert.deepEqual((await request('/memory/run',{run:first.id})).receipt,receipt);
  const fresh=(await request('/sessions',{activation})).openedSession;
  const remembered=await turn(fresh,'Give me an Orchid project update.');
  const admission=await settled(remembered.id);
  assert.deepEqual(admission.evidence.admitted.map(item=>[item.id,item.revision]),[[receipt.memoryId,receipt.revision]]);
  assert.equal(remembered.reply.split('\n').filter(line=>/^[-*•]\s/.test(line.trim())).length,2,remembered.reply);
  console.log(JSON.stringify({fixture:false,initial,first:{...first,proposal:proposal.text,directive:firstView.directive},
    follow,confirmed:revised,receipt,quiet,restart:{fresh,remembered,admitted:admission.evidence.admitted}},null,2));
}finally{
  await stopHost();
}
