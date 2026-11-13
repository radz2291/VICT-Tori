import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';
import { InMemoryActorDirectory } from '@victframework/runtime';
import { createStudio } from '../server/studio.mjs';
import { gatedMemorySave, memoryIntent, memoryScope, openMemoryStore, draftContext, draftContextBytes } from '../packages/memory/index.mjs';
import { contextReply, correctedText, contextPrompt, contextSource, editedContext, installMemoryProvider, overInterpreted, recallPrompt, savedText, savePrompt, syntheticKey } from './memory-provider-fixture.mjs';

const scope=memoryScope('fixture-actor','fixture-project','fixture-agent');
const source='memory-source-user';
const proposal={session:'source-session',activation:'activation',run:'source-run',source,contextBasis:[source]};
const commitInput=(p,opts={})=>({...proposal,operation:p.operation,text:p.text,...opts});
const sqlite=(file,run)=>{
  const db=new DatabaseSync(file);
  try{return run(db);}finally{db.close();}
};
test('explicit memory intent excludes negation, quotes, questions and insufficient context',()=>{
  for(const text of [savePrompt,'Please remember: I prefer brief notes.','Could you please remember my weekly review preference?',
    'I’d like you to remember that Mondays are for planning.','Remember:\nLine one.\nLine two.'])
    assert.equal(memoryIntent(text).kind,'explicit',text);
  assert.deepEqual(memoryIntent(contextPrompt),{kind:'explicit',contextual:true});
  for(const text of ["Don't remember this.","Do not remember that preference.",'Never save this as a memory.',
    '"Remember that the marker is quoted."','> Remember that this is a quote.','We say “remember that...” as an example.',
    'Remember “time is relative” is a quotation.', 'Remember when we changed it?', 'Remember this. Actually, do not save it.',
    'Remember means to recall.', 'Remember is a verb.', 'Remember that this is only for this reply.',
    'Remember that synthetic preference only for this reply; do not store it.', 'Would you remember the marker if I asked you tomorrow?',
    "Remember: don't store this message.", 'Can you remember the date I told you yesterday?',
    'Please remember that these are words to quote, not to store.'])
    assert.equal(memoryIntent(text).kind,'ineligible',text);
  assert.equal(memoryIntent('Remember this.').kind,'ambiguous');
  assert.equal(memoryIntent('Remember this for me.').kind,'ambiguous');
  assert.equal(memoryIntent('A regular project update').kind,'ordinary');
  assert.equal(draftContext([], {id:source,role:'user',text:contextPrompt},true),undefined);
  assert.equal(draftContext([], {id:source,role:'user',text:'a'.repeat(draftContextBytes+1)},false),undefined);
});

test('a save and receipt are atomic; cancel, expire, replay and forget preserve authority',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'tori-006-memory-ledger-'));
  const file=join(directory,'memory.sqlite');
  let time=Date.parse('2026-11-12T01:00:00Z');
  let store=openMemoryStore(file,{clock:()=>time});
  const begin=(run,text=savedText)=>store.propose(scope,{...proposal,run,text,expires:time+5000});
  try {
    const pending=begin(proposal.run);
    assert.equal(store.list(scope).length,0);
    const grant={...commitInput(pending),confirmed:true};
    const context={victActorId:scope.actor,victTurnId:grant.run,victIdempotencyKey:grant.operation,signal:new AbortController().signal};
    await assert.rejects(gatedMemorySave(store,scope,{...grant,confirmed:false},()=>true)({text:savedText},context),/not granted/);
    assert.equal((await gatedMemorySave(store,scope,grant,()=>true)({text:savedText},{...context,victActorId:'other'})).status,'denied');
    sqlite(file,db=>db.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON operations BEGIN SELECT RAISE(ABORT,'fixture-receipt-failure'); END"));
    await assert.rejects(gatedMemorySave(store,scope,grant,()=>true)({text:savedText},context),/fixture-receipt-failure/);
    assert.equal(store.list(scope).length,0);
    assert.equal(store.proposal(scope,proposal.session,proposal.run).status,'pending');
    sqlite(file,db=>db.exec('DROP TRIGGER fail_receipt'));
    const saved=await gatedMemorySave(store,scope,grant,()=>true)({text:savedText},context);
    assert.equal(saved.status,'saved');
    assert.equal(saved.receipt.source.message,source);
    assert.equal(saved.receipt.savedByRun,proposal.run);
    assert.deepEqual(saved.receipt.contextBasis,[source]);
    assert.equal(store.list(scope).length,1);
    store.close();
    store=openMemoryStore(file,{clock:()=>time});
    assert.deepEqual(store.confirm(scope,commitInput(pending)),saved);
    assert.equal(store.confirm(scope,commitInput(pending,{text:'conflict'})).status,'operation-conflict');
    assert.equal(store.confirm(scope,commitInput(pending,{stillAuthorized:()=>false})).status,'denied');
    const other=memoryScope(scope.actor,'other-project',scope.agent);
    assert.equal(store.confirm(other,commitInput(pending)).status,'not-found');
    const edit={action:'correct',id:saved.receipt.memoryId,session:'fresh-session',expectedRevision:1,operation:randomUUID(),text:correctedText};
    const corrected=store.change(scope,edit);
    assert.equal(corrected.receipt.revision,2);
    assert.equal(store.change(scope,{...edit,operation:randomUUID()}).status,'stale-revision');
    assert.equal(store.inspect(scope,edit.id,1).memory.content,savedText);
    assert.equal(store.inspect(scope,edit.id,2).memory.content,correctedText);
    const forget={...edit,action:'forget',expectedRevision:2,operation:randomUUID()};
    assert.equal(store.change(scope,forget).status,'forgotten');
    assert.equal(store.inspect(scope,edit.id,1).status,'forgotten');
    assert.equal(store.inspect(scope,edit.id,2).status,'forgotten');
    assert.deepEqual(store.confirm(scope,commitInput(pending)),saved);
    assert.equal(store.admit(scope).evidence.admitted.length,0);
    const cancelled=begin('cancelled-run');
    assert.equal(store.confirm(scope,commitInput(cancelled,{run:'cancelled-run',signal:AbortSignal.abort()})).status,'cancelled');
    const expired=begin('expired-run');
    time+=5001;
    assert.equal(store.confirm(scope,commitInput(expired,{run:'expired-run'})).status,'expired');
    assert.equal(store.list(scope).length,0);
    const counts=sqlite(file,db=>({
      textRows:db.prepare('SELECT COUNT(*) AS n FROM revisions').get().n,
      textProposals:db.prepare('SELECT COUNT(*) AS n FROM proposals WHERE text IS NOT NULL').get().n,
      receipts:db.prepare('SELECT receipt FROM operations ORDER BY rowid').all().map(item=>JSON.parse(item.receipt)),
    }));
    assert.deepEqual([counts.textRows,counts.textProposals], [0,0]);
    assert.deepEqual(counts.receipts.map(item=>item.outcome),['saved','corrected','forgotten']);
    assert.ok(!JSON.stringify(counts.receipts).includes(savedText));
    const bytes=await readFile(file);
    assert.equal(bytes.includes(Buffer.from(savedText)),false,'SQLite secure delete removes old content from the memory file');
    assert.equal(bytes.includes(Buffer.from(correctedText)),false);
  }finally{store.close();}
});

test('real Studio turns pin policy, admit stored values and refuse scope, replay and model write attempts',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'tori-006-memory-runtime-'));
  const file=join(directory,'saved-memory.sqlite');
  const capture=join(directory,'wire.jsonl');
  Object.assign(process.env,{TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:syntheticKey,TORI_EXECUTION_FIXTURE:'a1-request-capture',
    TORI_ENABLE_PI_ZAI:'0',TORI_MCP_MEMORY_PHRASE:'1',TORI_MEMORY_CAPTURE:capture});
  const restore=installMemoryProvider();
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const assembly=await vite.ssrLoadModule('/src/assembly.ts');
  const open=memoryFixture=>createStudio({getAssembly:()=>assembly,dataDirectory:directory,memoryFixture,directiveFixture:{historicalActivation:true}});
  let service=open();
  const restart=async identity=>{await service.close();service=open(identity);};
  const req=(path,body={})=>service.dispatch(path,body);
  const runView=run=>req('/memory/run',{run});
  const memoryView=session=>req('/memory/session',{session});
  const session=async activation=>(await req('/sessions',{activation})).openedSession;
  const turn=async (sid,input,extra={})=>{
    const state=await req('/turn',{session:sid,input,...extra});
    return state.runs.find(item=>item.session===sid&&!item.parentRun);
  };
  const wires=async()=> (await readFile(capture,'utf8')).trim().split('\n').map(JSON.parse);
  const makeGraph=(name,governed,tool=false)=>{
    const graph=assembly.history(assembly.emptyAssembly());
    const initial=assembly.assemblyPatchOperations(graph.graph,{name,instructions:'Use the synthetic facts.',model:assembly.modelId,
      ...(tool?{tool:'local-reference@1',maxSteps:2,maxToolCalls:1}:{})});
    assert.ok(graph.apply(initial).ok);
    assert.ok(graph.apply(assembly.configureOperations(graph.graph,'memory','reference','recent-10@1')).ok);
    if(governed)assert.ok(graph.apply(assembly.configureOperations(graph.graph,'memory','savedMemory',assembly.governedMemoryValue)).ok);
    return graph;
  };
  const activate=async (graph,definition,expected)=>{
    const {revision}=await req('/save',{graph:graph.graph,definition,expected});
    const {activation}=await req('/activate',{revision,definition});
    return {activation,revision};
  };
  const current=async sid=>(await memoryView(sid)).proposal;
  const confirm=(sid,p,extra={})=>req('/memory/confirm',{session:sid,run:p.run,operation:p.operation,text:p.text,...extra});
  try{
    const {activation:off,revision:old}=await activate(makeGraph('Quellight',false));
    const offSession=await session(off.version);
    const offRun=await turn(offSession,savePrompt);
    assert.equal((await runView(offRun.id)).evidence.status,'policy-off');
    assert.equal((await runView(offRun.id)).request.reason,'policy-off');

    const {activation:on,revision}=await activate(makeGraph('Quellight',true),undefined,old);
    assert.equal(on.savedMemory,true);
    assert.deepEqual(on.memoryPolicy,{schema:'tori.memory-policy@1',artifact:{id:'tori-conversation-memory',revision:'recent-10@1+governed@1'},
      savedMemory:'governed@1',organizer:'off'});
    assert.deepEqual(off.memoryPolicy,{schema:'tori.memory-policy@1',artifact:{id:'tori-conversation-memory',revision:'recent-10@1'},
      savedMemory:'off',organizer:'off'});
    assert.notEqual(on.version,off.version);
    const saveSession=await session(on.version);
    for(const [prompt,reason] of [
      ["Don't remember that I prefer lists.",'negated-request'],
      ['"Remember that lists are better."','quoted'],
      ['Remember this.','clarification-needed'],
      ['Remember is a verb.','mentioned-phrase'],
      ['Remember that synthetic preference only for this reply; do not store it.','negated-request'],
      ['Would you remember the marker if I asked you tomorrow?','hypothetical'],
      ["Remember: don't store this message.",'negated-request'],
      ['Can you remember the date I told you yesterday?','recall-question'],
      ['Please remember that these are words to quote, not to store.','negated-request'],
      ['Remember this for me.','clarification-needed'],
      ['Remember to send the update.','memory-or-reminder'],
      ['Remember that our marker is amber — do not save it.','negated-request'],
      ['Remember this for this chat: The temporary marker is amber.','temporary-request'],
      ['Remember that I prefer an amber marker just for the rest of this chat.','temporary-request'],
      ['Remember that for the rest of this chat I want short notes.','temporary-request'],
      ['Remember: for this conversation use short titles.','temporary-request'],
      ['Remember: use short titles in this chat.','temporary-request'],
      ['Remember that I want short notes during this chat.','temporary-request'],
      ['Remember that I want short notes until this chat ends.','temporary-request'],
      ['Remember that I prefer short notes, but please do not put that in your memory.','negated-request'],
      ['Remember that I prefer short notes — on second thought don’t save it.','negated-request'],
      ['Remember that I prefer short notes. Actually, I don’t want you to save it.','negated-request'],
      ["Don't forget to send the update.",'memory-or-reminder'],
    ]){
      const run=await turn(saveSession,prompt);
      const view=await runView(run.id);
      assert.equal(view.request.reason,reason);
      assert.equal(view.proposal,undefined);

      assert.equal(view.receipt,undefined);
      assert.equal(view.draft,undefined);
      if(reason==='memory-or-reminder'){
        assert.equal((await memoryView(saveSession)).turns.find(turn=>turn.run===run.id).request.reason,reason);
      }
    }
    const priorRecall=await turn(saveSession,'Do you remember when the last planning brief was due?');
    assert.equal(priorRecall.status,'completed');
    assert.equal((await runView(priorRecall.id)).request.reason,'recall-question');
    assert.equal((await runView(priorRecall.id)).proposal,undefined);
    assert.equal((await req('')).sessions.find(item=>item.id===saveSession).messages.at(-1).text,
      'I remember that the last planning brief was due on Monday.');
    const noContext=await turn(await session(on.version),contextPrompt);
    assert.equal((await runView(noContext.id)).request.reason,'context-unavailable');
    const ordinary=await turn(saveSession,'A regular chat request.');
    assert.equal((await runView(ordinary.id)).request,undefined);
    const forged=await turn(saveSession,'Attempt a model-originated write.');
    assert.equal((await runView(forged.id)).receipt,undefined);
    assert.deepEqual((await memoryView(saveSession)).records,[]);
    await assert.rejects(req('/memory/confirm',{session:saveSession,run:ordinary.id,operation:randomUUID(),text:'not granted'}),/No confirmable/);

    for(const input of [
      'Remember the false confirmation preference.',
      'Remember the past-tense confirmation preference.',
      'Remember the passive storage claim preference.',
      'Remember the expanded preference claim preference.',
      'Remember the stored location claim preference.',
      'Remember the revision claim preference.',
      'Remember the progressive storage claim preference.',
      'Remember the permanent preference claim preference.',
      'Please don’t remember that I prefer blue cards.',
    ]){
      const fakeSession=await session(on.version);
      const falseClaim=await turn(fakeSession,input);
      assert.equal(falseClaim.status,'failed');
      assert.equal(falseClaim.errorCode,'TORI_MEMORY_REPLY_UNCONFIRMED');
      assert.equal((await runView(falseClaim.id)).draft,undefined);
      assert.equal((await runView(falseClaim.id)).receipt,undefined);
      assert.equal((await runView(falseClaim.id)).proposal,undefined);
      assert.equal((await req('')).sessions.find(item=>item.id===fakeSession).messages.length,1);
      assert.equal((await turn(fakeSession,'Continue with an ordinary project update.')).status,'completed');
      assert.deepEqual((await wires()).at(-1).assistantHistory,[]);
    }

    const stoppedSession=await session(on.version);
    const stopping=turn(stoppedSession,'Remember the slow review preference.');
    let running;
    for(let tries=0;tries<200&&!running?.canStop;tries++){
      running=await req('/activity',{session:stoppedSession});
      if(!running.canStop)await delay(15);
    }
    assert.equal(running.canStop,true);
    assert.equal((await req('/stop-turn',{session:stoppedSession,run:running.turn})).status,'stopping');
    const stopped=await stopping;
    assert.equal(stopped.status,'cancelled');
    assert.equal((await runView(stopped.id)).request.reason,'cancelled');
    assert.deepEqual((await memoryView(stoppedSession)).records,[]);

    const draftStopSession=await session(on.version);
    const draftStopping=turn(draftStopSession,'Remember the slow drafting preference.');
    let draftDispatched=false;
    for(let tries=0;tries<250&&!draftDispatched;tries++){
      draftDispatched=(await wires()).some(item=>item.prompt==='Remember the slow drafting preference.'&&item.draftRole==='user');
      if(!draftDispatched)await delay(20);
    }
    assert.equal(draftDispatched,true);
    const drafting=await req('/activity',{session:draftStopSession});
    assert.equal(drafting.phase,'answer');
    assert.equal((await req('/stop-turn',{session:draftStopSession,run:drafting.turn})).status,'stopping');
    const draftStopped=await draftStopping;
    assert.equal(draftStopped.status,'completed');
    const stoppedDraft=await runView(draftStopped.id);
    assert.equal(stoppedDraft.request.reason,'cancelled');
    assert.equal(stoppedDraft.proposal,undefined);
    assert.equal(stoppedDraft.receipt,undefined);
    assert.equal((await req('')).sessions.find(item=>item.id===draftStopSession).messages.length,2);

    const sid=await session(on.version);
    await turn(sid,savePrompt);
    const withdrawn=await current(sid);
    assert.equal((await req('/memory/dismiss',{session:sid,run:withdrawn.run})).status,'dismissed');
    await assert.rejects(confirm(sid,withdrawn),/dismissed/);
    const lateStopRun=await turn(sid,savePrompt);
    const lateStopProposal=await current(sid);
    assert.equal(lateStopProposal.run,lateStopRun.id);
    assert.equal((await req('/stop-turn',{session:sid,run:lateStopRun.id})).status,'cancelled');
    await assert.rejects(confirm(sid,lateStopProposal),/stopped before commit/);
    assert.deepEqual((await memoryView(sid)).records,[]);
    const draftRun=await turn(sid,savePrompt);
    const pending=await current(sid);
    assert.equal(pending.status,'pending');
    assert.equal(pending.text,savedText);
    assert.deepEqual((await memoryView(sid)).records,[]);
    const save=await confirm(sid,pending,{actor:'forged',project:'forged',agent:'forged'});
    assert.equal(save.receipt.scope.actor,'tori-local-owner');
    assert.equal(save.receipt.scope.agent,on.definition);
    assert.equal(save.receipt.source.message,draftRun.id+'-user');
    assert.equal(save.memory.memory.content,savedText);
    const id=save.receipt.memoryId;
    // Restore the pre-addendum graph catalog against the same immutable VICT
    // activation record. The missing TORI field must resolve to organizer off.
    await service.close();
    sqlite(join(directory,'studio.sqlite'),db=>{
      const state=JSON.parse(db.prepare('SELECT value FROM project WHERE id=1').get().value);
      for(const draft of state.drafts)delete draft.graph.nodeTypes.find(node=>node.id==='memory').parameters.organizer;
      db.prepare('UPDATE project SET value=? WHERE id=1').run(JSON.stringify(state));
    });
    service=open();
    const restored=await req('');
    assert.equal(restored.activation.version,on.version);
    assert.deepEqual(restored.activation.memoryPolicy,on.memoryPolicy);
    assert.deepEqual((await confirm(sid,pending)).receipt,save.receipt);
    await assert.rejects(confirm(sid,pending,{text:'payload drift'}),/different result/);

    const fresh=await session(on.version);
    const recall=await turn(fresh,recallPrompt);
    const admitted=await runView(recall.id);
    assert.deepEqual(admitted.evidence.admitted.map(item=>[item.id,item.revision]),[[id,1]]);
    assert.equal(admitted.records[0].memory.content,savedText);
    assert.ok(admitted.evidence.admitted[0].lastUsedAt);
    assert.equal(JSON.stringify(admitted.evidence).includes(savedText),false);
    const revised=makeGraph('Quellight',true);
    assert.ok(revised.apply([assembly.change('agent','instructions','Use synthetic facts from the authorized store.')]).ok);
    const changed=await activate(revised,undefined,revision);
    assert.notEqual(changed.activation.version,on.version);
    const newActivationRecall=await turn(await session(changed.activation.version),recallPrompt);
    assert.deepEqual((await runView(newActivationRecall.id)).evidence.admitted.map(item=>item.id),[id]);
    const historyOnly=await turn(await session(off.version),recallPrompt);
    assert.equal((await runView(historyOnly.id)).evidence.status,'policy-off');
    process.env.TORI_SAVED_MEMORY_REVOKED='1';
    const revoked=await turn(fresh,recallPrompt);
    assert.equal((await memoryView(fresh)).status,'denied');
    assert.equal((await runView(revoked.id)).status,'denied');
    await assert.rejects(confirm(sid,pending),/access was denied/);
    delete process.env.TORI_SAVED_MEMORY_REVOKED;
    assert.equal((await runView(revoked.id)).evidence.status,'access-denied');
    const actors=new InMemoryActorDirectory();
    const principal={actorId:'tori-local-owner',roles:['developer'],createdAt:0,status:'active'};
    await actors.upsert({...principal,status:'disabled'});
    await restart({directory:actors});
    const suspended=await turn(fresh,recallPrompt);
    assert.equal((await memoryView(fresh)).status,'denied');
    await actors.upsert(principal);
    assert.equal((await runView(suspended.id)).evidence.status,'access-denied');

    const lockedSession=await session(on.version);
    await turn(lockedSession,savePrompt);
    const lockedProposal=await current(lockedSession);
    const held=new DatabaseSync(file);
    held.exec('BEGIN IMMEDIATE');
    try {
      await assert.rejects(confirm(lockedSession,lockedProposal),/could not confirm this save/);
      await actors.upsert({...principal,status:'disabled'});
    }finally{held.exec('ROLLBACK');held.close();}
    await assert.rejects(confirm(lockedSession,lockedProposal),/access was denied/);
    await actors.upsert(principal);
    assert.equal((await memoryView(fresh)).records.length,1);
    assert.equal((await current(lockedSession)).status,'pending');
    await req('/memory/dismiss',{session:lockedSession,run:lockedProposal.run});

    const correction={session:fresh,id,revision:1,operation:randomUUID(),text:correctedText};
    for(const identity of [{actor:'tori-memory-second-actor'},{project:'tori-memory-second-project'}]){
      await restart(identity);
      const attempt=await turn(await session(on.version),recallPrompt,{actor:save.receipt.scope.actor,project:save.receipt.scope.project});
      assert.equal((await runView(attempt.id)).evidence.admitted.length,0);
      assert.deepEqual((await memoryView(fresh)).records,[]);
      await assert.rejects(runView(recall.id),/not found/);
      await assert.rejects(req('/memory/correct',correction),/not found/);
      await assert.rejects(req('/memory/forget',correction),/not found/);
      await assert.rejects(confirm(sid,pending),/No confirmable/);
    }
    await restart();
    const otherAgent=(await req('/definitions')).definition;
    const {activation:other}=await activate(makeGraph('Unrelated Agent',true),otherAgent);
    const foreign=await session(other.version);
    assert.deepEqual((await memoryView(foreign)).records,[]);
    assert.equal((await runView((await turn(foreign,recallPrompt)).id)).evidence.admitted.length,0);
    await assert.rejects(req('/memory/correct',{...correction,session:foreign}),/not found/);
    await assert.rejects(req('/memory/forget',{...correction,session:foreign}),/not found/);
    await assert.rejects(confirm(foreign,pending),/No confirmable/);

    const updated=await req('/memory/correct',correction);
    assert.equal(updated.receipt.revision,2);
    await assert.rejects(req('/memory/correct',{...correction,operation:randomUUID()}),/changed/);
    const newRecall=await turn(await session(on.version),recallPrompt);
    assert.deepEqual((await runView(newRecall.id)).evidence.admitted.map(item=>item.revision),[2]);
    assert.equal((await runView(recall.id)).records[0].memory.content,savedText);
    const forgotten=await req('/memory/forget',{...correction,revision:2,operation:randomUUID()});
    assert.equal(forgotten.receipt.outcome,'forgotten');
    assert.equal((await runView(recall.id)).records[0].status,'forgotten');
    const historicalSave=await runView(draftRun.id);
    assert.equal(historicalSave.savedRecordStatus,'forgotten');
    assert.deepEqual(historicalSave.receipt,save.receipt);
    assert.equal(JSON.stringify(historicalSave).includes(savedText),false);
    assert.equal((await confirm(sid,pending)).memory.status,'forgotten');
    await restart();
    assert.equal((await runView((await turn(await session(on.version),recallPrompt)).id)).evidence.admitted.length,0);
    assert.equal(sqlite(file,db=>db.prepare('SELECT COUNT(*) AS n FROM revisions WHERE id=?').get(id).n),0);

    const conversation=await session(on.version);
    const prior=await turn(conversation,contextSource);
    for(let index=0;index<7;index++)await turn(conversation,'Synthetic history message '+index);
    const window=await turn(conversation,'Ordinary history check.');
    assert.equal(window.status,'completed');
    const contextual=await turn(conversation,contextPrompt);
    const contextDraft=await current(conversation);
    assert.ok(contextDraft.contextBasis.includes(prior.id+'-user'));
    assert.ok(contextDraft.contextBasis.includes(contextual.id+'-user'));
    assert.equal(contextDraft.text,overInterpreted);
    const contextualRun=await runView(contextual.id);
    assert.deepEqual(contextualRun.draft,{providerAttempts:1,modelSteps:1,http:200,status:'proposed'});
    assert.equal((await req('')).sessions.find(session=>session.id===conversation).messages.find(message=>message.id===contextual.id+'-agent').text,contextReply);
    const contextSave=await confirm(conversation,contextDraft,{text:editedContext});
    assert.equal(contextSave.memory.memory.content,editedContext);
    const afterContext=await turn(conversation,'Continue after the planning brief.');
    assert.equal(afterContext.status,'completed');
    const observed=await wires();
    const contextualWires=observed.filter(item=>item.prompt===contextPrompt&&
      (item.transcript.length||item.history.includes('Ordinary history check.')));
    assert.equal(contextualWires.length,2);
    assert.deepEqual(contextualWires[0].transcript,[]);
    assert.deepEqual(contextualWires[1].assistantHistory,[]);
    const nextWire=observed.find(item=>item.prompt==='Continue after the planning brief.');
    assert.ok(nextWire.assistantHistory.includes(contextReply));
    assert.ok(nextWire.assistantHistory.every(text=>!text.includes(overInterpreted)&&!text.includes('Memory proposal:')));
    assert.deepEqual(nextWire.admitted.map(({id,revision,content})=>[id,revision,content]),[[contextSave.receipt.memoryId,1,editedContext]]);
    assert.deepEqual((await memoryView(conversation)).turns.find(turn=>turn.run===contextual.id).saved.receipt,contextSave.receipt);
    assert.ok(!observed.find(item=>item.prompt==='Ordinary history check.').history.includes(contextSource));
    assert.ok(observed.find(item=>item.prompt===contextPrompt&&item.transcript.length>10).transcript.some(item=>item.text===contextSource));
    assert.ok(observed.filter(item=>item.admitted.length).every(item=>item.recallRole==='user'));
    assert.ok(observed.filter(item=>item.transcript.length).every(item=>item.draftRole==='user'));
    for(const refusal of observed.filter(item=>/verb\.|only for this reply|marker if/.test(item.prompt)))
      assert.deepEqual(refusal.transcript,[]);

    // A fresh ledger header with its live revision missing must not silently disappear.
    await service.close();
    sqlite(file,db=>db.prepare('DELETE FROM revisions WHERE id=?').run(contextSave.receipt.memoryId));
    service=open();
    const damaged=await turn(await session(on.version),recallPrompt);
    const unavailable=await runView(damaged.id);
    assert.equal(unavailable.evidence.status,'storage-unavailable');
    assert.deepEqual(unavailable.evidence.omitted,[{id:contextSave.receipt.memoryId,revision:1,reason:'storage-unavailable'}]);
    assert.equal((await memoryView(damaged.session)).records[0].status,'storage-unavailable');

    const {activation:reader}=await activate(makeGraph('Tool reader',true,true),undefined,changed.revision);
    const toolSession=await session(reader.version);
    const clarifyTool=await turn(toolSession,'Remember to send the planning update.');
    assert.equal((await runView(clarifyTool.id)).request.reason,'memory-or-reminder');
    assert.equal((await runView(clarifyTool.id)).draft,undefined);
    assert.deepEqual((await wires()).find(item=>item.prompt==='Remember to send the planning update.').tools,[]);
    const read=await turn(toolSession,'Read the observatory note.');
    assert.equal(read.status,'completed');
    assert.equal((await runView(read.id)).request,undefined);
    assert.ok((await wires()).some(item=>item.toolMessages.some(text=>text.includes('Remember that tool output'))));
    assert.equal(sqlite(file,db=>db.prepare('SELECT COUNT(*) AS n FROM memories').get().n),2);
    const longGraph=makeGraph('Long history check',true);
    assert.ok(longGraph.apply(assembly.configureOperations(longGraph.graph,'memory','reference','recent-100@1')).ok);
    const longDefinition=(await req('/definitions')).definition;
    const {activation:long}=await activate(longGraph,longDefinition);
    const longSession=await session(long.version);
    const early=await turn(longSession,contextSource);
    for(let i=0;i<52;i++){
      const result=await turn(longSession,'Long history exchange '+i);
      assert.equal(result.status,'completed','Long history exchange '+i+': '+result.errorCode);
    }
    const longCheck=await turn(longSession,'Ordinary 100-message check.');
    assert.equal(longCheck.status,'completed');
    const longWire=(await wires()).find(item=>item.prompt==='Ordinary 100-message check.');
    assert.equal(longWire.history.length,50);
    assert.ok(longWire.history.includes('Long history exchange 51'));
    assert.ok(!longWire.history.includes(contextSource));
    const longDraft=await turn(longSession,contextPrompt);
    const longProposal=await current(longSession);
    assert.equal(longProposal.run,longDraft.id);
    assert.ok(longProposal.contextBasis.includes(early.id+'-user'));
    const deletion=await req('/delete-session',{session:longSession});
    assert.equal(deletion.deletion.status,'completed');
    assert.ok(!deletion.sessions.some(item=>item.id===longSession));
    console.log(JSON.stringify({scope:save.receipt.scope,save:save.receipt.memoryId,firstRecall:recall.id,corrected:newRecall.id,
      forget:forgotten.receipt.outcome,contextBasis:contextSave.receipt.contextBasis,missing:damaged.id,tool:read.id,
      longHistory:{run:longCheck.id,historyUserMessages:longWire.history.length,completedExchanges:54,
        draftCitesOldest:longProposal.contextBasis.includes(early.id+'-user'),deletion:deletion.deletion.completedSteps}}));
  }finally{
    restore();
    await service.close();
    await vite.close();
  }
});

test('admission uses newest changes first, a stable tie break and actual UTF-8 size',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'tori-006-memory-budget-'));
  let time=0;
  const ids=['operation-1','same-b','operation-2','same-a','operation-3','newer'];
  const store=openMemoryStore(join(directory,'memory.sqlite'),{clock:()=>time,ids:()=>ids.shift(),budget:1180});
  try{
    for(const [index,id] of ['same-b','same-a','newer'].entries()){
      if(index===2)time++;
      const request={...proposal,run:'run-'+id};
      const text=(index===2?'y':'é').repeat(index===2?70:450);
      const p=store.propose(scope,{...request,text,expires:60000});
      assert.equal(store.confirm(scope,{...request,operation:p.operation,text}).receipt.memoryId,id);
    }
    time+=20000;
    const {block,evidence}=store.admit(scope);
    assert.deepEqual(evidence.admitted.map(item=>item.id),['newer','same-a']);
    assert.deepEqual(evidence.omitted,[{id:'same-b',revision:1,reason:'budget'}]);
    assert.equal(Buffer.byteLength(block,'utf8'),evidence.bytes);
    assert.ok(evidence.bytes<=1180);
    assert.equal(store.inspect(scope,'same-b').memory.lastUsedAt,null);
    assert.equal(store.inspect(scope,'same-a').memory.lastUsedAt,new Date(time).toISOString());
    assert.equal(evidence.admitted[0].ageMs,20000);
    const timed=store.admit(scope,{includeRevisionTime:true});
    assert.deepEqual(timed.evidence.admitted.map(item=>item.id),['newer']);
    assert.deepEqual(timed.evidence.omitted,[{id:'same-a',revision:1,reason:'budget'},{id:'same-b',revision:1,reason:'budget'}]);
    assert.equal(Buffer.byteLength(timed.block,'utf8'),timed.evidence.bytes);
    assert.ok(timed.evidence.bytes<=1180);
    assert.match(timed.block,/"updatedAt":"1970-01-01T00:00:00\.001Z"/);
    assert.doesNotMatch(block,/"updatedAt"/);
  }finally{store.close();}
});
