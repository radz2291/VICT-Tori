import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { contextPrompt, contextReply, contextSource, correctedText, editedContext, overInterpreted, recallPrompt, savePrompt, syntheticKey } from './memory-provider-fixture.mjs';

const live=process.env.TORI_MEMORY_LIVE==='1';
const early=process.env.TORI_MEMORY_EARLY==='1';
const {chromium}=createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE??'playwright');
const directory=await mkdtemp(join(tmpdir(),'tori-006-browser-'));
const evidence=process.env.TORI_MEMORY_EVIDENCE??directory;
await mkdir(evidence,{recursive:true});
const port=process.env.TORI_MEMORY_PORT??'48827';
const url='http://127.0.0.1:'+port;
const cwd=process.env.TORI_MEMORY_HOST??process.cwd();
let server,browser,page;
const observed={origin:live?'live Coding':'deterministic provider',desktop:{width:1531,height:850},narrow:{width:390,height:844},runs:{}};
let log='';
const api=async()=>fetch(url+'/api/studio').then(res=>res.json());
const post=async(path,data)=>{
  const res=await fetch(url+'/api/studio/'+path,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(data)});
  assert.equal(res.status,200,await res.clone().text());
  return res.json();
};
async function start(){
  server=spawn(process.execPath,[
    ...(live?[]:['--import',pathToFileURL(resolve('./tests/memory-provider-fixture.mjs')).href]),
    './node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',port,'--strictPort',
  ],{cwd,windowsHide:true,env:{...process.env,TORI_DATA_DIR:directory,TORI_ZAI_ROUTE:'coding',
    ...(live?{TORI_ENABLE_PI_ZAI:'1',TORI_EXECUTION_FIXTURE:''}:{TORI_ZAI_API_KEY:syntheticKey,TORI_MEMORY_FIXTURE_PRELOAD:'1',
      TORI_MEMORY_CAPTURE:join(directory,'wire.jsonl')})}});
  for(const stream of [server.stdout,server.stderr])stream.on('data',bytes=>{log=(log+String(bytes)).slice(-12000);});
  for(let i=0;i<250;i++){
    const ready=await api().catch(()=>undefined);
    if(ready?.workspace){
      assert.ok(ready.provider,'The approved Coding connection is unavailable.');
      assert.equal(ready.fixture,!live);
      return ready.workspace;
    }
    if(server.exitCode!==null)break;
    await delay(200);
  }
  throw Error('Studio did not become ready.');
}
async function stop(){
  if(!server||server.exitCode!==null)return;
  const closed=once(server,'close');
  server.kill();
  await closed;
}
async function route(path,action){
  const pending=page.waitForResponse(response=>response.url()===url+'/api/studio/'+path&&response.request().method()==='POST',
    {timeout:110000});
  await action();
  const reply=await pending;
  assert.equal(reply.status(),200,await reply.text());
  return reply.json();
}
const button=name=>page.getByRole('button',{name,exact:typeof name==='string'});
const field=id=>page.locator('#'+id);
const memoryCard=id=>page.locator('[data-memory-turn="'+id+'"]');
const message=id=>page.locator('[data-message-id="'+id+'"]').getByTestId('conversation-message');
const proposalText=card=>card.getByTestId('memory-proposal-text');
const confirmedText=card=>card.getByTestId('memory-confirmed-text');
async function attached(id){
  const card=memoryCard(id);
  await card.waitFor();
  assert.equal(await card.getAttribute('data-source-message'),id+'-user');
  assert.equal(await card.evaluate(node=>node.closest('[data-message-id]')?.getAttribute('data-message-id')),id+'-agent');
  assert.equal(await card.evaluate(node=>!!node.closest('[data-testid="conversation-message"]')),false);
  return card;
}
function inCharacter(reply){
  assert.ok(reply.trim());
  assert.doesNotMatch(reply,/(?:memory proposal|review the text in studio|nothing was saved|i(?:['’]ve| have| just) (?:saved|stored|memorized|remembered)|i(?:['’]ll| will) remember)/i);
}
const focused=control=>control.evaluate(node=>node===document.activeElement);
const contrast=(control,background)=>control.evaluate((element,selector)=>{
  const foreground=getComputedStyle(element).color;
  const surface=getComputedStyle(selector?element.closest(selector):element).backgroundColor;
  const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255)
    .map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4)
    .reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
  const scores=[luminance(foreground),luminance(surface)].sort((a,b)=>b-a);
  return (scores[0]+.05)/(scores[1]+.05);
},background);
async function openSession(id){
  await task('Sessions').click();
  if(!await button('New Session').isVisible())await button('Sessions sidebar').click();
  const row=page.locator('[data-session-id="'+id+'"]');
  if(!await row.isVisible())await button('Quellight').click();
  await row.click();
  await page.getByRole('textbox',{name:'Message',exact:true}).waitFor();
}
const task=name=>page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name,exact:true});
const sessionDetails=()=>page.getByRole('region',{name:'Session details content'});
const runDetails=()=>page.getByRole('region',{name:'Run details content'});
const memoryRegion=()=>page.getByRole('region',{name:'Saved memory admission'});
const capture=async(name,locator)=>{
  await locator?.scrollIntoViewIfNeeded();
  return page.screenshot({path:join(evidence,name+'.png'),animations:'disabled'});
};
async function chooseSession(revision=1){
  await task('Sessions').click();
  if(!await button('New Session').isVisible()){
    await button('Sessions sidebar').click();
  }
  await button('New Session').click();
  const picker=page.getByRole('region',{name:'Choose an agent'});
  await picker.getByRole('button',{name:'Quellight',exact:true}).click();
  const selected=await route('sessions',()=>picker.getByRole('button',{name:new RegExp('^Start Session with Quellight · r'+revision+'(?: ·|$)')}).click());
  const id=selected.openedSession;
  await page.getByRole('textbox',{name:'Message',exact:true}).waitFor();
  return id;
}
async function send(session,prompt,label){
  const textbox=page.getByRole('textbox',{name:'Message',exact:true});
  await textbox.fill(prompt);
  const state=await route('turn',()=>textbox.press('Enter'));
  const run=state.runs.find(item=>item.session===session&&!item.parentRun);
  assert.equal(run.status,'completed',JSON.stringify({id:run.id,status:run.status,code:run.errorCode,message:run.message}));
  const reply=state.sessions.find(item=>item.id===session).messages.find(item=>item.id===run.id+'-agent').text;
  if(label)observed.runs[label]={run:run.id,session,reply};
  return {id:run.id,reply};
}
async function details(pageName){
  const toggle=button(pageName+' sidebar');
  if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
  const control=button('Details');
  if(await control.getAttribute('aria-expanded')!=='true')await control.click();
}
async function runViaSession(){
  await details('Sessions');
  await sessionDetails().getByRole('button',{name:/Inspect runs/i}).click();
  await details('Runs');
  return runDetails();
}
async function newPage(){
  await page.goto(url,{timeout:120000});
  await task('Agents').waitFor({timeout:75000});
}
const bullets=text=>text.split('\n').filter(line=>/^\s*[-*•]\s+/.test(line)).length;
try {
  const workspace=await start();
  browser=await chromium.launch();
  observed.chromium=browser.version();
  page=await browser.newPage({viewport:observed.desktop});
  page.setDefaultTimeout(25000);
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await newPage();
  await button('Canvas').click();
  await button('Add Agent').click({timeout:65000});
  await button('Configure').click();
  await field('settings-agent-name').fill('Quellight');
  await field('settings-agent-text').fill('You are Quellight, a concise project assistant. For Orchid project updates, design is approved, implementation is in progress, and the demo is Friday. Follow any saved preferences supplied by Studio for response format. In the absence of a saved format preference, reply with one short sentence. Use simple hyphen bullets when the user prefers bullets.');
  await field('settings-model').selectOption('glm-5.3-flash');
  await field('settings-memory').selectOption('recent-10@1');
  const policy=field('settings-saved-memory');
  assert.equal(await policy.inputValue(),'off');
  await policy.selectOption('governed@1');
  await policy.selectOption('');
  assert.equal(await policy.inputValue(),'governed@1');
  assert.equal(await policy.evaluate(node=>node===document.activeElement),true);
  await button('Canvas').click();
  await button('Actions for Quellight').click();
  await page.getByRole('menuitem',{name:'Show binding as a separate node: Memory Policy'}).click();
  const onNode=field('canvas-memory-saved-memory');
  assert.equal(await onNode.inputValue(),'governed@1');
  await onNode.selectOption('off');
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await page.getByRole('menuitem',{name:'Undo',exact:true}).click();
  assert.equal(await onNode.inputValue(),'governed@1');
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await page.getByRole('menuitem',{name:'Redo',exact:true}).click();
  assert.equal(await onNode.inputValue(),'off');
  await onNode.selectOption('governed@1');
  await capture('memory-policy-canvas');
  await button('Configure').click();
  assert.equal(await policy.inputValue(),'governed@1');
  assert.equal(await field('settings-memory').inputValue(),'recent-10@1');
  await capture('memory-policy-configure');
  await route('save',()=>button('Save').click());
  const active=await route('activate',()=>button(/^Activate r1$/).click());
  assert.equal(active.activation.savedMemory,true);
  assert.equal(active.activation.memoryPolicy.organizer,'off');
  assert.equal(await page.getByLabel(/organizer/i).count(),0);
  observed.activation=active.activation.version;
  const original=await chooseSession();
  const save=await send(original,savePrompt,'draft');
  inCharacter(save.reply);
  const card=await attached(save.id);
  await card.getByRole('heading',{name:'Memory proposal'}).waitFor();
  assert.equal(await card.getByText(/Review the wording/).count(),1);
  const exact=await proposalText(card).textContent();
  assert.ok(exact);
  assert.equal(await card.getByText('Saved',{exact:true}).count(),0);
  const editorButton=card.getByRole('button',{name:'Correct',exact:true});
  await editorButton.focus();
  await editorButton.press('Enter');
  const draft=card.getByRole('textbox',{name:'Memory to save'});
  await draft.waitFor();
  assert.equal(await focused(draft),true);
  assert.equal(await draft.inputValue(),exact);
  observed.confirmationContrast=await contrast(draft);
  assert.ok(observed.confirmationContrast>=4.5,'Draft field contrast: '+observed.confirmationContrast);
  assert.match(exact,/(three|3).{0,35}bullet/i);
  await draft.fill('A correction I will cancel.');
  await card.getByRole('button',{name:'Cancel correction'}).press('Enter');
  await proposalText(card).waitFor();
  assert.equal(await focused(editorButton),true);
  assert.equal(await proposalText(card).textContent(),exact);
  await capture('memory-confirmation',card);
  await message(save.id+'-agent').getByRole('button',{name:'Copy message'}).click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),save.reply);
  const confirmed=await route('memory/confirm',()=>card.getByRole('button',{name:'Confirm and save'}).click());
  assert.equal(confirmed.memory.memory.content,exact);
  assert.equal(confirmed.receipt.revision,1);
  assert.equal(confirmed.receipt.source.message,save.id+'-user');
  assert.deepEqual(confirmed.receipt.contextBasis,[save.id+'-user']);
  assert.ok(!Object.hasOwn(confirmed.receipt,'content'));
  observed.save=confirmed.receipt;
  await confirmedText(card).waitFor();
  assert.equal(await confirmedText(card).textContent(),exact);
  assert.equal(await card.getByText('Saved',{exact:true}).count(),1);
  assert.equal(await focused(card.getByRole('heading',{name:'Memory proposal'})),true);
  await capture('memory-saved',card);
  await stop();
  assert.equal(await start(),workspace);
  await newPage();
  const fresh=await chooseSession();
  assert.notEqual(original,fresh);
  const recall=await send(fresh,recallPrompt,'freshRecall');
  const admitted=await post('memory/run',{run:recall.id});
  assert.deepEqual(admitted.evidence.admitted.map(({id,revision})=>[id,revision]),[[confirmed.receipt.memoryId,1]]);
  assert.equal(admitted.records[0].memory.content,exact);
  assert.equal(bullets(recall.reply),3,recall.reply);
  observed.firstAdmission=admitted.evidence;
  await runViaSession();
  await memoryRegion().getByText('1 memory admitted',{exact:true}).waitFor();
  await memoryRegion().getByText(exact,{exact:true}).waitFor();
  await capture('memory-run-recall',memoryRegion().getByRole('heading',{name:'Saved memory'}));
  if(!early){
    await task('Agents').click();
    await button('Configure').click();
    await policy.selectOption('off');
    await route('save',()=>button('Save').click());
    const historyOnly=await route('activate',()=>button(/^Activate r2$/).click());
    assert.equal(historyOnly.activation.savedMemory,false);
    const historySession=await chooseSession(2);
    const historyRun=await send(historySession,recallPrompt,'historyOnly');
    const offEvidence=await post('memory/run',{run:historyRun.id});
    assert.equal(offEvidence.evidence.status,'policy-off');
    assert.equal(offEvidence.evidence.admitted.length,0);
    assert.equal(bullets(historyRun.reply),0);
    await task('Sessions').click();
    const historyRow=page.locator('[data-session-id="'+fresh+'"]');
    if(!await historyRow.isVisible())await button('Quellight').click();
    await historyRow.click();
    await details('Sessions');
    const list=sessionDetails().getByRole('region',{name:'Saved memory',exact:true});
    await list.getByText(exact,{exact:true}).waitFor();
    await list.getByRole('button',{name:'Correct memory'}).click();
    let dialog=page.getByRole('dialog',{name:'Correct saved memory'});
    await dialog.getByRole('textbox',{name:'Corrected memory'}).fill(correctedText);
    const corrected=await route('memory/correct',()=>dialog.getByRole('button',{name:'Save correction'}).click());
    assert.equal(corrected.receipt.revision,2);
    assert.equal(corrected.memory.memory.content,correctedText);
    observed.correction=corrected.receipt;
    await stop();
    assert.equal(await start(),workspace);
    await newPage();
    const correctionSession=await chooseSession();
    const recall2=await send(correctionSession,recallPrompt,'correctedRecall');
    const admitted2=await post('memory/run',{run:recall2.id});
    assert.deepEqual(admitted2.evidence.admitted.map(item=>item.revision),[2]);
    assert.equal(bullets(recall2.reply),2,recall2.reply);

    await page.setViewportSize(observed.narrow);
    await details('Sessions');
    const narrowList=page.getByRole('region',{name:'Saved memory',exact:true});
    await narrowList.getByText(correctedText,{exact:true}).waitFor();
    await capture('memory-narrow-list',narrowList.getByText(correctedText,{exact:true}));
    await narrowList.getByRole('button',{name:'Forget memory'}).click();
    dialog=page.getByRole('dialog',{name:'Forget saved memory'});
    await capture('memory-narrow-forget');
    const forgot=await route('memory/forget',()=>dialog.getByRole('button',{name:'Forget',exact:true}).click());
    assert.equal(forgot.receipt.outcome,'forgotten');
    assert.equal(forgot.memory.status,'forgotten');
    observed.forget=forgot.receipt;
    if(await button('Close Inspector').isVisible())await button('Close Inspector').click();
    await page.setViewportSize(observed.desktop);
    const forgotten=await chooseSession();
    const zero=await send(forgotten,recallPrompt,'afterForget');
    const noMemory=await post('memory/run',{run:zero.id});
    assert.equal(noMemory.evidence.admitted.length,0);
    assert.equal(noMemory.evidence.status,'no-eligible-memories');
    assert.equal(bullets(zero.reply),0);
    await runViaSession();
    await memoryRegion().getByText('0 memories admitted',{exact:true}).waitFor();
    await capture('memory-run-zero',memoryRegion().getByText('0 memories admitted',{exact:true}));
    const older=await post('memory/run',{run:recall.id});
    assert.equal(older.records[0].status,'forgotten');
    assert.equal(older.records[0].memory,undefined);
    await task('Sessions').click();
    const olderRow=page.locator('[data-session-id="'+fresh+'"]');
    if(!await olderRow.isVisible())await button('Quellight').click();
    await olderRow.click();
    await runViaSession();
    await memoryRegion().getByText('Forgotten · audit reference retained',{exact:true}).waitFor();
    await capture('memory-run-forgotten',memoryRegion().getByText('Forgotten · audit reference retained',{exact:true}));
    const savedRun=await post('memory/run',{run:save.id});
    assert.equal(savedRun.savedRecordStatus,'forgotten');
    assert.equal(savedRun.receipt.outcome,'saved');
    assert.equal(JSON.stringify(savedRun).includes(exact),false);
    await task('Sessions').click();
    const originalRow=page.locator('[data-session-id="'+original+'"]');
    if(!await originalRow.isVisible())await button('Quellight').click();
    await originalRow.click();
    await runViaSession();
    await capture('memory-save-run-forgotten',memoryRegion().getByText('Forgotten · audit reference retained',{exact:true}));
    await stop();
    assert.equal(await start(),workspace);
    await newPage();
    const after=await chooseSession();
    const restarted=await send(after,recallPrompt,'afterForgetRestart');
    assert.equal((await post('memory/run',{run:restarted.id})).evidence.admitted.length,0);

    const conversation=await chooseSession();
    const prior=await send(conversation,contextSource,'planningContext');
    const contextualRun=await send(conversation,contextPrompt,'contextDraft');
    inCharacter(contextualRun.reply);
    if(!live)assert.equal(contextualRun.reply,contextReply);
    const contextCard=await attached(contextualRun.id);
    observed.suggestedContext=await proposalText(contextCard).textContent();
    if(!live)assert.equal(observed.suggestedContext,overInterpreted);
    assert.equal(await message(contextualRun.id+'-agent').getByText(/calendar taking a day off|Memory proposal:/i).count(),0);
    await capture('memory-context-over-interpreted',contextCard);
    await contextCard.getByRole('button',{name:'Correct',exact:true}).press('Enter');
    const editor=contextCard.getByRole('textbox',{name:'Memory to save'});
    await editor.waitFor();
    assert.equal(await focused(editor),true);
    await editor.fill(editedContext);
    await capture('memory-context-editor',contextCard);
    const contextual=await route('memory/confirm',()=>contextCard.getByRole('button',{name:'Confirm and save'}).click());
    assert.equal(contextual.memory.memory.content,editedContext);
    assert.equal(contextual.receipt.source.message,contextualRun.id+'-user');
    assert.ok(contextual.receipt.contextBasis.some(ref=>ref.startsWith(prior.id)),JSON.stringify(contextual.receipt.contextBasis));
    observed.contextual=contextual.receipt;
    await confirmedText(contextCard).waitFor();
    assert.equal(await confirmedText(contextCard).textContent(),editedContext);
    await capture('memory-context-corrected',contextCard);
    await send(conversation,'Continue after the planning brief.','afterContext');
    const contextFresh=await chooseSession();
    const contextRecall=await send(contextFresh,'How should we lay out the next planning brief?','contextRecall');
    const recalledContext=await post('memory/run',{run:contextRecall.id});
    assert.deepEqual(recalledContext.evidence.admitted.map(({id,revision})=>[id,revision]),[[contextual.receipt.memoryId,1]]);
    assert.equal(recalledContext.records[0].memory.content,editedContext);
    await openSession(conversation);
    const reopened=await attached(contextualRun.id);
    assert.equal(await confirmedText(reopened).textContent(),editedContext);
    assert.equal(await page.getByTestId('conversation-message').getByText(/Memory proposal:|calendar taking a day off/i).count(),0);
    await capture('memory-context-reopened',reopened);
    if(!live){
      const vocabulary=await chooseSession();
      for(const [index,prompt] of [
        'Pls remember that project updates use short titles.',
        'Don’t forget that project updates use short titles.',
        'Never forget that project updates use short titles.',
        'Do not forget that project updates use short titles.',
      ].entries()){
        const run=await send(vocabulary,prompt,'affirmative'+(index+1));
        inCharacter(run.reply);
        const pending=await attached(run.id);
        assert.match(await proposalText(pending).textContent(),/short titles/);
        if(index===0)await capture('memory-pls-remember',pending);
        assert.equal((await post('memory/run',{run:run.id})).receipt,undefined);
        await route('memory/dismiss',()=>pending.getByRole('button',{name:'Dismiss'}).press('Enter'));
        await pending.getByText('Nothing saved. This proposal was dismissed.',{exact:true}).waitFor();
        assert.equal(await focused(pending.getByRole('heading',{name:'Memory proposal'})),true);
      }
      for(const [index,prompt] of [
        "Don't remember that project updates use short titles.",
        'Don’t save this as a memory: project updates use short titles.',
      ].entries()){
        const run=await send(vocabulary,prompt,'negation'+(index+1));
        const evidence=await post('memory/run',{run:run.id});
        assert.equal(evidence.request.reason,'negated-request');
        assert.equal(evidence.proposal,undefined);
        assert.equal(evidence.receipt,undefined);
        assert.equal(await memoryCard(run.id).count(),0);
      }
      for(const [index,prompt] of ['Remember to send the planning update.',"Don't forget to send the planning update."].entries()){
        const run=await send(vocabulary,prompt,'clarification'+(index+1));
        const feedback=await attached(run.id);
        await feedback.getByText('Save as a memory, or set a reminder?',{exact:true}).waitFor();
        assert.equal(await feedback.getByRole('button').count(),0);
        const evidence=await post('memory/run',{run:run.id});
        assert.equal(evidence.request.reason,'memory-or-reminder');
        assert.equal(evidence.draft,undefined);
        assert.equal(evidence.proposal,undefined);
        assert.equal(evidence.receipt,undefined);
        if(index===0)await capture('memory-reminder-clarification',feedback);
      }
      assert.equal((await post('memory/session',{session:vocabulary})).records.length,1);
      await page.setViewportSize(observed.narrow);
      const narrowSession=await chooseSession();
      const narrowRun=await send(narrowSession,'Remember that narrow notes use action verbs.','narrowProposal');
      const narrow=await attached(narrowRun.id);
      const narrowCorrect=narrow.getByRole('button',{name:'Correct',exact:true});
      observed.narrowComposerContrast=await contrast(page.getByRole('textbox',{name:'Message',exact:true}),'.vict-ai-composer');
      assert.ok(observed.narrowComposerContrast>=4.5,'Narrow composer contrast: '+observed.narrowComposerContrast);
      const bounds=await narrow.boundingBox();
      assert.ok(bounds.width<=390 && bounds.x>=0 && bounds.x+bounds.width<=390,JSON.stringify(bounds));
      const actionBounds=await narrowCorrect.boundingBox();
      assert.ok(actionBounds.height>=44,JSON.stringify(actionBounds));
      await capture('memory-narrow-confirmation',narrow);
      await narrowCorrect.press('Enter');
      const narrowEditor=narrow.getByRole('textbox',{name:'Memory to save'});
      await narrowEditor.waitFor();
      assert.equal(await focused(narrowEditor),true);
      await capture('memory-narrow-editor',narrow);
      await route('memory/dismiss',()=>narrow.getByRole('button',{name:'Dismiss'}).press('Enter'));
      await narrow.getByText('Nothing saved. This proposal was dismissed.',{exact:true}).waitFor();
      assert.equal(await focused(narrow.getByRole('heading',{name:'Memory proposal'})),true);
      await capture('memory-narrow-dismissed',narrow);
      const waiting=page.getByRole('textbox',{name:'Message',exact:true});
      const delayedUrl=url+'/api/studio/turn';
      let release,responded;
      const delayed=new Promise(resolve=>{release=resolve;});
      const serverSettled=new Promise(resolve=>{responded=resolve;});
      await page.route(delayedUrl,async route=>{
        const response=await route.fetch();
        responded();
        await delayed;
        await route.fulfill({response});
      });
      try{
        await waiting.fill('Remember the delayed acknowledgement preference.');
        const completed=await route('turn',async()=>{
          await waiting.press('Enter');
          await button('Stop').waitFor();
          const readinessTimeout=AbortSignal.timeout(15000);
          await Promise.race([serverSettled,new Promise((_,reject)=>readinessTimeout.addEventListener('abort',()=>reject(readinessTimeout.reason),{once:true}))]);
          const stopResult=await route('stop-turn',()=>button('Stop').click());
          assert.equal(stopResult.status,'cancelled');
          release();
        });
        const completedRun=completed.runs.find(item=>item.session===narrowSession);
        assert.equal((await post('memory/run',{run:completedRun.id})).proposal,'cancelled');
        await page.getByText('Nothing saved. The turn was stopped before confirmation.',{exact:true}).waitFor();
      }finally{release();await page.unroute(delayedUrl);}
      await waiting.fill('Remember the slow review preference.');
      const stopped=await route('turn',async()=>{
        await waiting.press('Enter');
        await route('stop-turn',()=>button('Stop').click());
      });
      assert.equal(stopped.runs.find(item=>item.session===narrowSession).status,'cancelled');
      assert.equal((await post('memory/session',{session:narrowSession})).records.length,1);
      await page.setViewportSize(observed.desktop);
      for(let i=0;i<3;i++){
        const storage=await chooseSession();
        const run=await send(storage,'Remember that synthetic budget item '+i+': '+String.fromCharCode(97+i).repeat(900));
        const pending=await attached(run.id);
        await route('memory/confirm',()=>pending.getByRole('button',{name:'Confirm and save'}).click());
      }
      const budgetSession=await chooseSession();
      const budgetRun=await send(budgetSession,recallPrompt,'budget');
      const budget=await post('memory/run',{run:budgetRun.id});
      assert.ok(budget.evidence.omitted.some(item=>item.reason==='budget'));
      await details('Sessions');
      await sessionDetails().getByText(/eligible memories omitted by the latest Run/).waitFor();
      await capture('memory-budget-panel',sessionDetails().getByText(/eligible memories omitted by the latest Run/));
      await runViaSession();
      const omitted=memoryRegion().getByText(/Some eligible memories exceeded the Run/).first();
      await omitted.waitFor();
      await capture('memory-budget-run',omitted);
      observed.budget=budget.evidence;
    }
  }
  await writeFile(join(evidence,'memory-observations.json'),JSON.stringify(observed,null,2)+'\n');
  console.log(JSON.stringify({origin:observed.origin,runs:observed.runs,save:observed.save?.memoryId,revision:observed.save?.revision,
    correction:observed.correction?.revision,forget:observed.forget?.outcome,context:observed.contextual?.contextBasis}));
}catch(error){
  await page?.screenshot({path:join(evidence,'memory-browser-failure.png')}).catch(()=>{});
  console.error(log);
  throw error;
}finally{
  await browser?.close();
  await stop();
}
