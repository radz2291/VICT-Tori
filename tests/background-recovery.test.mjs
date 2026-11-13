import assert from 'node:assert/strict';
import test from 'node:test';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,cp,readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'vite';
import {createStudio} from '../server/studio.mjs';
import {createSqliteAgentControlStores} from '@victframework/store-sqlite';
import {savePrompt} from './memory-provider-fixture.mjs';
import {acceptRunPacket} from '../src/run-observer.mjs';

const wait=async(check,why)=>{
  for(let i=0;i<500;i++){const value=await check();if(value)return value;await delay(25);}
  assert.fail('Timed out waiting for '+why);
};
const directory=()=>mkdtemp(join(tmpdir(),'tori-007-fault-'));
const sql=(path,fn)=>{
  const db=new DatabaseSync(path);
  try{return fn(db);}finally{db.close();}
};
const memoryCounts=(dir)=>sql(join(dir,'saved-memory.sqlite'),db=>Object.fromEntries(
  ['memories','revisions','operations','save_attempts'].map(table=>[table,db.prepare('SELECT count(*) n FROM '+table).get().n])));
async function host(dir,capture,mode='normal'){
  const proc=fork(fileURLToPath(new URL('./background-host-fixture.mjs',import.meta.url)),[dir,capture,mode],
    {stdio:['ignore','ignore','inherit','ipc']});
  const events=[], exit=once(proc,'exit');
  proc.on('message',message=>events.push(message));
  const event=stage=>wait(()=>events.find(item=>item.stage===stage),stage);
  let ready;
  try{ready=await Promise.race([event('ready'),exit.then(([code])=>assert.fail('Host exited: '+code))]);}
  catch(error){proc.kill();throw error;}
  const url='http://127.0.0.1:'+ready.port;
  const request=(path='',body={},signal)=>fetch(url+'/'+path,{method:'POST',body:JSON.stringify(body),signal});
  const call=async(path='',body={},signal)=>{
    const res=await request(path,body,signal), data=await res.json();
    assert.ok(res.ok,JSON.stringify({path,status:res.status,message:data.message}));
    return data;
  };
  const end=async()=>{if(proc.exitCode===null&&proc.signalCode===null)proc.kill();return exit;};
  return {proc,pid:ready.pid,event,call,request,exit,end,release:stage=>proc.send(stage)};
}
async function seed(app,a){
  const draft=(name,instructions)=>{
    const h=a.history(a.emptyAssembly());
    assert.ok(h.apply(a.assemblyPatchOperations(h.graph,{name,instructions,model:a.modelId})).ok);
    return h;
  };
  const child=draft('Research','Use only the synthetic read fixture.');
  const definition=(await app.call('definitions')).definition;
  const {revision:childRev}=await app.call('save',{definition,graph:child.graph});
  await app.call('activate',{definition,revision:childRev});
  const parent=draft('Quellight','Use the pinned Research agent when asked to delegate.');
  assert.ok(parent.apply([a.add('child'),a.change('child','reference','saved:'+childRev.id),a.wire('child','child'),
    a.add('memory'),a.wire('memory','memory'),a.change('agent','maxSteps',4),a.change('agent','maxToolCalls',1)]).ok);
  assert.ok(parent.apply(a.configureOperations(parent.graph,'memory','savedMemory',a.governedMemoryValue)).ok);
  const {revision}=await app.call('save',{graph:parent.graph});
  const {activation}=await app.call('activate',{revision});
  return activation.version;
}
const startSession=async(app,activation)=>(await app.call('sessions',{activation})).openedSession;
async function propose(app,activation){
  const session=await startSession(app,activation);
  await app.call('turn',{session,input:savePrompt});
  const view=await app.call('memory/session',{session});
  const proposal=view.proposal;
  assert.equal(proposal?.status,'pending');
  return {session,activation,run:proposal.run,operation:proposal.operation,text:proposal.text};
}
async function coldCopy(from){
  const to=await directory();
  // No running process or volatile shared-memory index carries over.
  await cp(from,to,{recursive:true,filter:source=>!source.endsWith('-shm')});
  return to;
}
const verifyOne=(result,row)=>{
  assert.equal(result.run.id,row.run);
  assert.equal(result.run.activation,row.activation);
  assert.equal(result.run.session,row.session);
};
test('all 16 O-05 cells retain authoritative identities without replay',async t=>{
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const a=await vite.ssrLoadModule('/src/assembly.ts');
  await vite.close();
  for(const fault of ['tab-close','transport-drop','process-exit','cold-reopen']){
    const stay=fault==='tab-close'||fault==='transport-drop';
    for(const kind of ['in-flight turn','background Run','memory save','pending child']){
      await t.test(fault+' / '+kind,async cell=>{
        let dir=await directory();
        const capture=join(dir,'provider.ndjson');
        const beforeMode=kind==='memory save'?'hold-save':'normal';
        let app=await host(dir,capture,beforeMode);
        const firstPid=app.pid;
        const activation=await seed(app,a);
        const subscription=new AbortController();
        let operation, row, child, started, originalOwner, startRequest;
        try{
          if(kind==='memory save'){
            operation=await propose(app,activation);
            started=app.call('memory/confirm',operation,subscription.signal).catch(error=>error.name);
            await app.event('reserved');
            const pending=await app.call('memory/check',operation);
            assert.equal(pending.status,'running');
            assert.equal(pending.operation,operation.operation);
            assert.equal(memoryCounts(dir).operations,0);
          }else{
            const session=await startSession(app,activation);
            const input=kind==='pending child'?'Synthetic delegation '+fault:'Synthetic hold model '+fault;
            if(kind==='in-flight turn'){
              started=app.call('turn',{session,input},subscription.signal).catch(error=>error.name);
              await app.event('model');
              row={session,activation,run:(await app.call()).runs.find(r=>r.session===session).id};
            }else{
              startRequest={session,activation,request:randomUUID(),input};
              // Lose the start ACK while retaining the operation identity.
              const startedRequest=app.call('start-run',startRequest,subscription.signal).catch(error=>error.name);
              await app.event(kind==='pending child'?'child':'model');
              if(stay)subscription.abort();
              await startedRequest;
              row=await app.call('run-lookup',startRequest);
              assert.deepEqual(await app.call('start-run',startRequest),row);
              assert.equal((await app.request('start-run',{...startRequest,input:'Changed payload'})).status,409);
              assert.equal((await app.request('run-lookup',{...startRequest,activation:'other'})).status,404);
              if(kind==='pending child')child=await app.event('child');
            }
            const running=await app.call('run-observe',row);
            verifyOne(running,row);
            assert.equal(running.run.state,'Running');
            assert.equal(running.ownership?.run,row.run);
            originalOwner=running.ownership.id;
            assert.equal((await app.request('run-observe',{...row,cursor:{streamId:randomUUID(),lastSeq:0}})).status,409);
            assert.equal((await app.request('run-observe',{...row,cursor:{streamId:running.stream.streamId,lastSeq:running.stream.newestSeq+1000}})).status,409);
            assert.equal((await app.request('run-observe',{...row,session:randomUUID()})).status,404);
            if(child){
              assert.equal(child.parent,row.run);
              assert.equal(child.owner,originalOwner);
              const pending=running.children.find(item=>item.id===child.run);
              assert.equal(pending?.state,'Running');
              assert.equal(pending.parentOperation,child.operation);
              assert.ok(child.invocation);
            }
          }
          if(stay){
            if(fault==='transport-drop'){
              subscription.abort();
              if(started)assert.equal(await started,'AbortError');
              if(row){
                const lost=new AbortController();lost.abort();
                await assert.rejects(app.call('run-observe',row,lost.signal),e=>e.name==='AbortError');
              }
            }else{
              // The original observer is discarded. No stop intent is sent.
              // A fresh observer starts with no cursor (browser close is also
              // exercised in Chromium against the actual Studio).
              subscription.abort();
              if(started)assert.equal(await started,'AbortError');
            }
            if(operation){
              assert.equal((await app.call('memory/check',operation)).status,'running');
              app.release('memory');
              const settled=await wait(async()=>{
                const status=await app.call('memory/check',operation);
                return status.status==='saved'?status:null;
              },'save receipt');
              const again=await app.call('memory/confirm',operation);
              assert.deepEqual(again.receipt,settled.receipt);
              assert.deepEqual(memoryCounts(dir),{memories:1,revisions:1,operations:1,save_attempts:1});
              cell.diagnostic(JSON.stringify({fault,kind,run:operation.run,operation:operation.operation,
                firstPid,currentPid:app.pid,rejoined:'Running',terminal:'Finished',receipt:again.receipt.memoryId,effects:1}));
            }else{
              const joined=await app.call('run-observe',row);
              assert.equal(joined.ownership.id,originalOwner);
              assert.equal(joined.run.state,'Running');
              app.release(child?'child':'model');
              const end=await wait(async()=>{
                const result=await app.call('run-observe',{...row,cursor:{streamId:joined.stream.streamId,lastSeq:joined.stream.newestSeq}});
                return result.run.state==='Finished'?result:null;
              },'Run completion');
              verifyOne(end,row);
              assert.ok(end.session.messages.some(message=>message.id===row.run+'-agent'));
              assert.equal((await app.call()).runs.filter(r=>r.session===row.session&&!r.parentRun).length,1);
              if(child)assert.equal(end.children.find(item=>item.id===child.run).state,'Finished');
              cell.diagnostic(JSON.stringify({fault,kind,...row,owner:originalOwner,firstPid,currentPid:app.pid,rejoined:'Running',
                terminal:'Finished',stream:end.stream.streamId,child:child?.run,invocation:child?.invocation,operation:child?.operation}));
            }
          }else{
            await app.end();
            if(started)await started;
            if(fault==='cold-reopen')dir=await coldCopy(dir);
            app=await host(dir,capture);
            if(operation){
              const recovery=await app.call('memory/check',operation);
              assert.equal(recovery.status,'interrupted');
              assert.equal(recovery.reason,'no-commit');
              assert.ok(recovery.checkedAt);
              assert.equal(recovery.operation,operation.operation);
              assert.deepEqual(memoryCounts(dir),{memories:0,revisions:0,operations:0,save_attempts:1});
              cell.diagnostic(JSON.stringify({fault,kind,run:operation.run,operation:operation.operation,
                firstPid,currentPid:app.pid,terminal:'Interrupted',reason:recovery.reason,effects:0}));
            }else{
              const end=await app.call('run-observe',row);
              verifyOne(end,row);
              assert.equal(end.run.state,'Interrupted');
              assert.equal(end.ownership,undefined);
              assert.equal(end.run.recovery.priorOwner,originalOwner);
              assert.equal(end.run.recovery.replay,'none');
              assert.equal(end.session.interrupted,true);
              assert.equal(end.session.messages.filter(item=>item.role==='assistant').length,0);
              if(child){
                assert.equal(end.children.find(item=>item.id===child.run).state,'Interrupted');
                assert.equal(end.children.find(item=>item.id===child.run).recovery.invocation,child.invocation);
                assert.equal(end.run.recovery.tools.find(item=>item.id===child.invocation).status,'outcome_unknown');
                assert.equal(end.run.recovery.victTurn.reason,'VICT_TURN_INTERRUPTED');
              }
              const lines=(await readFile(capture,'utf8')).trim().split('\n').map(JSON.parse);
              assert.equal(lines.filter(item=>item.stage==='provider').length,1);
              cell.diagnostic(JSON.stringify({fault,kind,...row,firstPid,currentPid:app.pid,priorOwner:originalOwner,
                terminal:'Interrupted',replay:'none',stream:end.stream.streamId,child:child?.run,invocation:child?.invocation,operation:child?.operation}));
            }
          }
        }finally{await app.end();}
      });
    }
  }
});
test('memory rollback, commit before acknowledgement, uncertainty and read-only reconciliation',async t=>{
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const a=await vite.ssrLoadModule('/src/assembly.ts');await vite.close();
  for(const mode of ['crash-in-transaction','hold-ack','hold-save']){
    await t.test(mode,async()=>{
      const dir=await directory(),capture=join(dir,'provider.ndjson');
      let app=await host(dir,capture,mode);
      try{
        const activation=await seed(app,a);
        const input=await propose(app,activation);
        const confirmation=app.request('memory/confirm',input).catch(e=>e.name);
        if(mode==='hold-save'){
          await app.event('reserved');
          assert.equal((await app.call('memory/stop',input)).status,'stopping');
          const response=await confirmation;
          assert.equal(response.status,409);
          const settled=await app.call('memory/check',input);
          assert.equal(settled.status,'interrupted');
          assert.equal(settled.reason,'cancelled');
          assert.equal(memoryCounts(dir).operations,0);
          t.diagnostic(JSON.stringify({mode,run:input.run,operation:input.operation,disposition:settled.status,effects:0}));
          return;
        }
        if(mode==='crash-in-transaction')assert.equal((await app.exit)[0],47);
        else{
          await app.event('committed');
          const before=await app.call('memory/check',input);
          assert.equal(before.status,'saved');
          await app.end();
        }
        assert.equal(typeof await confirmation,'string');
        app=await host(dir,capture);
        if(mode==='crash-in-transaction'){
          const disposition=await app.call('memory/check',input);
          assert.equal(disposition.status,'interrupted');
          assert.equal(disposition.reason,'no-commit');
          assert.equal(memoryCounts(dir).revisions,0);
          const captured=(await readFile(capture,'utf8')).trim().split('\n').map(JSON.parse);
          assert.ok(captured.some(row=>row.stage==='before-commit'&&row.operation===input.operation));
        }
        const reconciled=await app.call('memory/confirm',input);
        assert.equal(reconciled.status,'saved');
        assert.deepEqual((await app.call('memory/confirm',input)).receipt,reconciled.receipt);
        assert.equal((await app.request('memory/confirm',{...input,text:'Edited payload'})).status,409);
        assert.deepEqual(memoryCounts(dir),{memories:1,revisions:1,operations:1,save_attempts:1});
        const op=sql(join(dir,'saved-memory.sqlite'),db=>{
          const saved=db.prepare('SELECT * FROM operations WHERE id=?').get(input.operation);
          db.prepare('DELETE FROM operations WHERE id=?').run(input.operation);
          return saved;
        });
        const uncertain=await app.call('memory/check',input);
        assert.equal(uncertain.status,'uncertain');
        assert.equal(uncertain.operation,input.operation);
        assert.equal((await app.request('memory/confirm',input)).status,409);
        assert.deepEqual(memoryCounts(dir),{memories:1,revisions:1,operations:0,save_attempts:1});
        sql(join(dir,'saved-memory.sqlite'),db=>db.prepare('INSERT INTO operations VALUES (?,?,?,?,?)')
          .run(op.id,op.scope,op.digest,op.receipt,op.run));
        assert.equal((await app.request('memory/confirm',input)).status,409,'Previously uncertain must be reconciled before replay');
        const repaired=await app.call('memory/check',input);
        assert.equal(repaired.status,'saved');
        assert.ok(repaired.checkedAt);
        assert.deepEqual(repaired.receipt,reconciled.receipt);
        assert.deepEqual((await app.call('memory/confirm',input)).receipt,reconciled.receipt);
        assert.deepEqual(memoryCounts(dir),{memories:1,revisions:1,operations:1,save_attempts:1});
        t.diagnostic(JSON.stringify({mode,run:input.run,operation:input.operation,
          ambiguous:'Uncertain',retry:'refused',reconciliation:'saved',receipt:repaired.receipt.memoryId,effects:1}));
      }finally{await app.end();}
    });
  }
});
test('cursor projection deduplicates/reorders, flags gaps and preserves authoritative terminal states',()=>{
  const identity={run:'r',session:'s',activation:'a'};
  const event=(seq,kind='response.started',streamId='stream')=>({streamId,seq,kind});
  const packet=(state,after,newestSeq,events,fields={})=>({
    run:{id:'r',session:'s',activation:'a',state,streamId:'stream',...fields},
    stream:{streamId:'stream',after,newestSeq,events},
  });
  const first=acceptRunPacket(undefined,packet('Running',0,1,[event(1)]),identity);
  const duplicate=acceptRunPacket(first,packet('Running',0,3,[event(3,'response.completed'),event(2),event(3),event(1)]),identity);
  assert.equal(duplicate.cursor.lastSeq,3);
  assert.equal(duplicate.gap,false);
  assert.equal(duplicate.run.state,'Running','Stream completed is not Run settlement');
  const gap=acceptRunPacket(duplicate,packet('Finished',3,6,[event(5,'content.completed'),event(6,'response.completed')]),identity);
  assert.equal(gap.cursor.lastSeq,6);
  assert.equal(gap.gap,true);
  assert.equal(gap.run.state,'Finished');
  assert.equal(acceptRunPacket(gap,packet('Running',1,6,[event(6)]),identity),gap);
  assert.equal(acceptRunPacket(gap,packet('Interrupted',6,7,[event(7)]),identity),gap);
  const uncertain=acceptRunPacket(undefined,packet('Uncertain',0,0,[]),identity);
  assert.equal(acceptRunPacket(uncertain,packet('Finished',0,0,[]),identity),uncertain);
  const reconciled=acceptRunPacket(uncertain,packet('Finished',0,0,[],{reconciliation:{operation:'same-operation'}}),identity);
  assert.equal(reconciled.run.state,'Finished');
  assert.throws(()=>acceptRunPacket(first,packet('Running',0,1,[],{activation:'wrong'}),identity));
});

test('a second host cannot take ownership; abandoned protected intent stays Uncertain after startup',async()=>{
  const dir=await directory();
  const studio=createStudio({dataDirectory:dir,getAssembly:async()=>({})});
  try{
    assert.throws(()=>createStudio({dataDirectory:dir,getAssembly:async()=>({})}),/already has a host/);
  }finally{await studio.close();}
  const run=randomUUID(), session=randomUUID(), invocation=randomUUID(), owner=randomUUID(), operation=randomUUID();
  const at=new Date().toISOString();
  const controls=createSqliteAgentControlStores({path:join(dir,'a3-control.sqlite')});
  try{
    await controls.turns.createTurnIntent({turnId:run,streamId:randomUUID(),threadId:'synthetic-thread',
      actorId:'tori-local-owner',agentProfileVersion:'synthetic-profile',inputSummary:'Synthetic fixture',
      status:'intent',createdAt:0,updatedAt:0});
    await controls.turns.startTurn(run,1);
    await controls.invocations.recordInvocationIntent({
      invocationId:invocation,turnId:run,toolCallId:'synthetic-tool',toolName:'synthetic',capabilityId:'fixture.protected',
      capabilityRevision:'1',effect:'write',idempotencyKey:operation,actorId:'tori-local-owner',argDigest:'fixture',
      argumentSummary:'Synthetic proof',status:'intent',createdAt:0,updatedAt:0,
    });
    await controls.invocations.claimInvocationRun({invocationId:invocation,fenceToken:'original',ownerIdentity:owner,at:1});
  }finally{controls.close();}
  sql(join(dir,'studio.sqlite'),db=>{
    const project=JSON.parse(db.prepare('SELECT value FROM project WHERE id=1').get().value);
    project.sessions=[{id:session,created:at,messages:[]}];
    project.runs=[{id:run,session,ownerId:owner,status:'running',events:[],started:at}];
    db.prepare('UPDATE project SET value=? WHERE id=1').run(JSON.stringify(project));
  });
  const reopened=createStudio({dataDirectory:dir,getAssembly:async()=>({})});
  try{
    const view=await reopened.dispatch('',{});
    assert.equal(view.runs[0].state,'Uncertain');
    assert.equal(view.runs[0].recovery.priorOwner,owner);
    assert.equal(view.runs[0].recovery.tools[0].operation,operation);
    assert.equal(view.runs[0].recovery.tools[0].status,'outcome_unknown');
    assert.equal(view.sessions[0].interrupted,true);
    assert.equal(view.runs[0].recovery.replay,'none');
  }finally{await reopened.close();}
});
