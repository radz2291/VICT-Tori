import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'vite';
import { createStudio } from '../server/studio.mjs';

test('ordinary host deadline remains pinned across 100 seconds, expires at 120, rejects pin damage and distinguishes Stop',{timeout:120000},async()=>{
  const directory=await mkdtemp(join(tmpdir(),'tori-host-deadline-'));
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const assembly=await vite.ssrLoadModule('/src/assembly.ts');
  Object.assign(process.env,{TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',
    TORI_EXECUTION_FIXTURE:'a1-request-capture',TORI_ENABLE_PI_ZAI:'0'});
  const fetchBefore=globalThis.fetch;
  let now=Date.now(), provider=Promise.withResolvers(), calls=0;
  const timers=[];
  const advance=milliseconds=>{
    now+=milliseconds;
    for(const timer of timers)if(now>=timer.at&&!timer.signal.aborted)timer.abort(new DOMException('deadline','TimeoutError'));
  };
  const start=()=>createStudio({getAssembly:()=>assembly,dataDirectory:directory,hostDeadlineFixture:{
    clock:()=>now,
    timeout(milliseconds){
      const controller=new AbortController();
      timers.push(Object.assign(controller,{at:now+milliseconds}));
      return controller.signal;
    },
  }});
  globalThis.fetch=async(url,init)=>{
    assert.equal(String(url),'https://api.z.ai/api/coding/paas/v4/chat/completions');
    const signal=init.signal;
    calls++;
    const body=JSON.parse(init.body);
    const user=body.messages.findLast(message=>message.role==='user');
    if(user?.content==='Delegate the deadline challenge.'){
      const followUp=body.messages.some(message=>message.role==='tool');
      const delta=followUp?{role:'assistant',content:'The delegated step did not complete.'}:
        {role:'assistant',tool_calls:[{index:0,id:'deadline-child',type:'function',
          function:{name:body.tools[0].function.name,arguments:JSON.stringify({task:'Wait under the original child pin.'})}}]};
      const chunks=[{choices:[{index:0,delta,finish_reason:null}]},{choices:[{index:0,delta:{},finish_reason:followUp?'stop':'tool_calls'}]}];
      return new Response(chunks.map(chunk=>'data: '+JSON.stringify({id:'deadline-fixture',object:'chat.completion.chunk',
        created:1,model:body.model,...chunk})).join('\n\n')+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
    }
    provider.resolve(signal);
    await new Promise((_,reject)=>{
      if(signal.aborted)reject(signal.reason);
      else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
    });
  };
  let service=start();
  const running=new Set();
  async function waitForDispatch(){
    let watchdog;
    const limit=new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(new Error('Provider fixture did not dispatch within 30 seconds.')),30000);});
    try{return await Promise.race([provider.promise,limit]);}
    finally{clearTimeout(watchdog);}
  }
  try {
    const {history,emptyAssembly,add,change,wire,modelId}=assembly;
    const draft=history(emptyAssembly());
    const edit=(...ops)=>assert.equal(draft.apply(ops).ok,true);
    edit(add('agent'),add('model'),change('agent','name','Deadline test'),
      change('agent','instructions','Wait for the controlled test.'),change('model','model',modelId),wire('model','model'));
    assert.equal(assembly.executionSettings(draft.graph).hostDeadlineMs,90000);
    let revision;
    const save=async()=>{revision=(await service.dispatch('/save',{expected:revision,graph:draft.graph})).revision;};
    const activate=()=>service.dispatch('/activate',{revision});
    edit(change('agent','hostDeadlineMs',undefined));await save();
    await assert.rejects(activate(),/host deadline/);
    for(const invalid of [0,999,1000.5,120001]){
      edit(change('agent','hostDeadlineMs',invalid));await save();
      await assert.rejects(activate(),/host deadline/);
    }
    assert.equal(calls,0);
    edit(change('agent','hostDeadlineMs',120000));await save();
    const activation=(await activate()).activation;
    const makeSession=async()=>((await service.dispatch('/sessions',{activation:activation.version})).sessions[0]);
    const pinned=await makeSession();
    const stopped=await makeSession();
    // A new revision must not change the existing Session's pin.
    edit(change('agent','hostDeadlineMs',1000));await save();
    const shortActivation=(await activate()).activation;
    const short=(await service.dispatch('/sessions',{activation:shortActivation.version})).sessions[0];
    await service.close();
    service=start();
    const begun=now;
    const send=(session,input)=>{
      const task=service.dispatch('/turn',{session:session.id,input});
      running.add(task);
      void task.then(()=>running.delete(task),()=>running.delete(task));
      return task;
    };
    const inFlight=send(pinned,'Hold for the pinned deadline.');
    const signal=await waitForDispatch();
    advance(100000);
    const active=(await service.dispatch('',{})).runs[0];
    assert.equal(signal.aborted,false);
    assert.equal(active.state,'Running');
    assert.equal(active.execution.deadlineMs,120000);
    assert.deepEqual(active.hostDeadline,{acceptedAt:begun,deadlineAt:begun+120000,source:'activation',activation:activation.version});
    advance(19999);assert.equal(signal.aborted,false);
    advance(1);assert.equal(signal.aborted,true);
    const expired=(await inFlight).runs[0];
    assert.equal(expired.status,'cancelled');
    assert.equal(expired.errorCode,'TORI_TURN_DEADLINE');
    assert.deepEqual(expired.hostDeadline,active.hostDeadline);
    provider=Promise.withResolvers();
    const explicit=send(stopped,'Hold until Stop.');
    await waitForDispatch();
    const pending=(await service.dispatch('',{})).runs[0];
    await service.dispatch('/stop-turn',{session:stopped.id,run:pending.id,activation:stopped.activation});
    assert.equal((await explicit).runs[0].errorCode,'TORI_SESSION_STOP');
    provider=Promise.withResolvers();
    const shortTurn=send(short,'Use the later, short activation.');
    const shortSignal=await waitForDispatch();
    advance(999);assert.equal(shortSignal.aborted,false);
    advance(1);assert.equal(shortSignal.aborted,true);
    assert.equal((await shortTurn).runs[0].errorCode,'TORI_TURN_DEADLINE');

    const parentDefinition=(await service.dispatch('/definitions',{})).definition;
    const parent=history(emptyAssembly());
    assert.equal(parent.apply([add('agent'),add('model'),add('child'),change('agent','hostDeadlineMs',120000),
      change('agent','instructions','Use the saved child for this request.'),change('agent','maxSteps',2),
      change('model','model',modelId),wire('model','model'),change('child','reference','saved:'+revision.id),wire('child','child')]).ok,true);
    const parentRevision=(await service.dispatch('/save',{definition:parentDefinition,graph:parent.graph})).revision;
    const parentActivation=(await service.dispatch('/activate',{definition:parentDefinition,revision:parentRevision})).activation;
    const parentSession=(await service.dispatch('/sessions',{activation:parentActivation.version})).sessions[0];
    provider=Promise.withResolvers();
    const delegation=send(parentSession,'Delegate the deadline challenge.');
    const childSignal=await waitForDispatch();
    const inProgress=(await service.dispatch('',{})).runs.find(run=>run.parentRun&&run.state==='Running');
    assert.equal(inProgress.activation,shortActivation.version);
    assert.equal(inProgress.execution.deadlineMs,1000);
    assert.equal(inProgress.hostDeadline.deadlineAt,inProgress.hostDeadline.acceptedAt+1000);
    advance(999);assert.equal(childSignal.aborted,false);
    advance(1);assert.equal(childSignal.aborted,true);
    const result=await delegation;
    const expiredChild=result.runs.find(run=>run.id===inProgress.id);
    assert.equal(expiredChild.status,'cancelled');
    assert.equal(expiredChild.errorCode,'TORI_CHILD_DEADLINE');
    const holdingParent=result.runs.find(run=>run.id===inProgress.parentRun);
    assert.equal(holdingParent.execution.deadlineMs,120000);
    assert.notEqual(holdingParent.errorCode,'TORI_TURN_DEADLINE');

    const tampered=await makeSession();
    const callsBeforeTampered=calls;
    assert.equal(callsBeforeTampered,6,'parent settled with one ordinary follow-up after the child deadline');
    await service.close();
    const db=new DatabaseSync(join(directory,'studio.sqlite'));
    const state=JSON.parse(db.prepare('SELECT value FROM project WHERE id=1').get().value);
    delete state.activations.find(entry=>entry.record.activationVersion===pinned.activation).hostDeadlineMs;
    db.prepare('UPDATE project SET value=? WHERE id=1').run(JSON.stringify(state));db.close();
    service=start();
    await assert.rejects(send(tampered,'Must not dispatch with a missing pin.'),/deadline pin/);
    assert.equal(calls,callsBeforeTampered);
  }finally{
    advance(240000);
    await Promise.allSettled([...running]);
    globalThis.fetch=fetchBefore;
    await service?.close();
    await vite.close();
  }
});
