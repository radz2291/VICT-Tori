import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {setTimeout as delay} from 'node:timers/promises';

const {chromium}=createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE??'playwright');
const url=process.env.TORI_BACKGROUND_URL??'http://127.0.0.1:48872';
const out=process.env.TORI_BACKGROUND_EVIDENCE??'.local/background-browser';
const isFixture=process.env.TORI_BACKGROUND_FIXTURE==='1';
const full=process.env.TORI_BACKGROUND_STEP==='full';
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const desktop=await browser.newContext({viewport:{width:1531,height:850}});
const wait=async(fn,label,ms=20000)=>{
  const deadline=Date.now()+ms;
  while(Date.now()<deadline){const result=await Promise.resolve().then(fn).catch(()=>null);if(result)return result;await delay(80);}
  throw Error('Timed out: '+label);
};
const api=async()=>fetch(url+'/api/studio').then(r=>r.json());
const post=async(path,body)=>{
  const res=await fetch(url+'/api/studio/'+path,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:res.status,body:await res.json()};
};
const visibleState=(page,text)=>page.getByRole('main',{name:'Run outcome and timeline'}).getByText(text,{exact:true}).waitFor();
const evidence={origin:isFixture?'fixture':'live',browser:browser.version()};
try {
  const initial=await api();
  assert.equal(initial.fixture,isFixture);
  const createSession=async(page)=>{
    await page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name:'Sessions',exact:true}).click();
    await page.getByRole('button',{name:'New Session',exact:true}).click();
    await page.getByRole('region',{name:'Choose an agent'}).getByRole('button',{name:'Quellight',exact:true}).click();
    await page.getByRole('button',{name:/^Start Session with Quellight · r1(?: ·|$)/}).click();
    return page.getByRole('textbox',{name:'Message',exact:true});
  };
  const start=async(page,prompt)=>{
    const text=await createSession(page);
    const toggle=page.getByRole('button',{name:'Run in background',exact:true});
    await toggle.waitFor();
    assert.equal(await toggle.getAttribute('aria-pressed'),'false');
    await toggle.focus();
    await toggle.press('Space');
    assert.equal(await toggle.getAttribute('aria-pressed'),'true');
    await text.fill(prompt);
    const request=page.waitForResponse(r=>r.url().endsWith('/api/studio/start-run'));
    await text.press('Enter');
    const res=await request, result=await res.json();
    assert.equal(res.status(),200,result.message);
    return result;
  };
  const startWithLostAcknowledgement=async(page,prompt)=>{
    const text=await createSession(page);
    const toggle=page.getByRole('button',{name:'Run in background',exact:true});
    await toggle.focus();await toggle.press('Space');
    let accepted, lookups=0;
    const startRoute='**/api/studio/start-run', lookupRoute='**/api/studio/run-lookup';
    await page.route(lookupRoute,route=>{lookups++;return route.abort('internetdisconnected');});
    await page.route(startRoute,async route=>{
      const response=await route.fetch();
      accepted={status:response.status(),body:await response.json()};
      await route.abort('internetdisconnected');
    });
    await text.fill(prompt);await text.press('Enter');
    await wait(()=>accepted&&lookups>=1,'lost start and lookup acknowledgements');
    assert.equal(accepted.status,200,accepted.body.message);
    await page.getByText('Checking whether Studio accepted the Run…',{exact:true}).waitFor();
    assert.equal(await toggle.isDisabled(),true);
    await page.unroute(startRoute);
    await page.unroute(lookupRoute);
    await page.getByText('Checking whether Studio accepted the Run…',{exact:true}).waitFor({state:'hidden'});
    return accepted.body;
  };
  let page=await desktop.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('navigation',{name:'Studio tasks'}).waitFor({timeout:90000});
  const step=process.env.TORI_BACKGROUND_STEP;
  if(!['stop','effects','fixture-memory'].includes(step)){
  const prompt='Delegate habits research to the saved Research specialist now. Then give me a long report: include the actual finding code and four detailed sections about assumptions, interpretation, tradeoffs and follow-up options. Clearly distinguish suggestions from facts.';
  const observationRoute='**/api/studio/run-observe';
  await page.route(observationRoute,route=>route.abort('internetdisconnected'));
  const original=await startWithLostAcknowledgement(page,prompt);
  await page.getByText('Connection lost. Checking the accepted Run.',{exact:true}).waitFor();
  await page.unroute(observationRoute);
  await page.getByText('You can close this tab while Studio stays open.',{exact:true}).waitFor();
  evidence.firstObservationRecovered=true;
  evidence.lostStartAndLookupRecovered=true;
  await page.getByRole('button',{name:'Inspect Run',exact:true}).click();
  await visibleState(page,'Running');
  const link=page.url();
  assert.equal(new URL(link).searchParams.get('run'),original.run);
  const before=await api();
  assert.equal(before.runs.find(r=>r.id===original.run).state,'Running');
  await page.screenshot({path:join(out,'running.png')});
  await page.close();
  const narrow=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  page=await narrow.newPage();
  await page.goto(link,{waitUntil:'domcontentloaded'});
  const current=await api();
  const rejoined=current.runs.find(r=>r.id===original.run);
  assert.equal(rejoined.session,original.session);
  assert.equal(rejoined.activation,original.activation);
  await visibleState(page,rejoined.state);
  await page.screenshot({path:join(out,'rejoined-narrow.png')});
  if(rejoined.state==='Running'){
    const endpoint='**/api/studio/run-observe';
    await page.route(endpoint,route=>route.abort('internetdisconnected'));
    await page.getByText('Connection lost. Showing the last confirmed Run state.',{exact:true}).waitFor();
    await page.screenshot({path:join(out,'transport-dropped.png')});
    await page.unroute(endpoint);
    await page.getByText('Connection lost. Showing the last confirmed Run state.',{exact:true}).waitFor({state:'hidden'});
    evidence.transportDrop={...original,rejoined:true};
  }
  const terminal=await wait(async()=>{
    const fresh=await api(), row=fresh.runs.find(r=>r.id===original.run);
    return row?.state!=='Running'?{row,fresh}:null;
  },'original Run completion',100000);
  assert.ok(['Finished','Interrupted'].includes(terminal.row.state),terminal.row.message);
  if(isFixture)assert.equal(terminal.row.state,'Finished',terminal.row.message);
  await visibleState(page,terminal.row.state);
  await page.screenshot({path:join(out,terminal.row.state.toLowerCase()+'-narrow.png')});
  const originalRuns=terminal.fresh.runs.filter(r=>r.session===original.session&&!r.parentRun);
  assert.equal(originalRuns.length,1);
  const children=terminal.fresh.runs.filter(r=>r.parentRun===original.run);
  assert.equal(children.length,1);
  if(terminal.row.state==='Finished')assert.equal(children[0].state,'Finished');
  const scriptReceipt=children[0].scriptReceipts?.find(r=>r.status==='completed');
  assert.ok(scriptReceipt,'Actual governed Research read receipt is required.');
  const finalSession=terminal.fresh.sessions.find(s=>s.id===original.session);
  const answer=finalSession.messages.find(m=>m.id===original.run+'-agent');
  assert.equal(!!answer,terminal.row.state==='Finished');
  evidence.detach={...original,stream:terminal.row.streamId,rejoinedState:rejoined.state,
    status:terminal.row.state,modelSteps:terminal.row.modelSteps,child:children[0].id,invocation:children[0].parentInvocation,
    scriptReceipt:scriptReceipt.invocationId,errorCode:terminal.row.errorCode,
    executionCount:originalRuns.length,resultLength:answer?.text.length};
  await narrow.close();
  }

  if(!['effects','fixture-memory'].includes(step)){
  page=await desktop.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const stopped=await start(page,'Delegate the habits check to Research, then produce a detailed long report with twenty numbered reflections.');
  await page.getByRole('button',{name:'Inspect Run',exact:true}).click();
  await page.waitForURL(u=>u.searchParams.get('run')===stopped.run);
  const stopLink=page.url();
  await page.close();
  page=await desktop.newPage();
  await page.goto(stopLink,{waitUntil:'domcontentloaded'});
  const cancel=page.getByRole('button',{name:'Stop Run',exact:true});
  await cancel.waitFor();
  const stopResponse=page.waitForResponse(r=>r.url().endsWith('/api/studio/stop-turn'));
  await cancel.focus();await cancel.press('Enter');
  assert.equal((await (await stopResponse).json()).status,'stopping');
  await visibleState(page,'Interrupted');
  await page.screenshot({path:join(out,'interrupted.png')});
  const settled=(await api()).runs.filter(r=>r.session===stopped.session&&!r.parentRun);
  assert.equal(settled.length,1);
  assert.equal(settled[0].id,stopped.run);
  assert.equal(settled[0].errorCode,'TORI_SESSION_STOP');
  evidence.stop={...stopped,status:settled[0].state,code:settled[0].errorCode,executionCount:settled.length};
  }
  if(full||step==='effects'||step==='fixture-memory'){
    await page.goto(url,{waitUntil:'domcontentloaded'});
    const sessionOpened=page.waitForResponse(r=>r.url().endsWith('/api/studio/sessions'));
    const textbox=await createSession(page);
    const sourceSession=(await (await sessionOpened).json()).openedSession;
    await textbox.fill('Remember that I prefer Orchid updates in exactly three short bullets.');
    await textbox.press('Enter');
    const source=await wait(async()=> (await api()).runs.find(r=>r.session===sourceSession&&!r.parentRun&&r.state==='Finished'),
      'live memory proposal turn',100000);
    const confirmButton=page.getByRole('button',{name:'Confirm and save',exact:true});
    await confirmButton.waitFor({timeout:35000});
    let confirmation;
    const lostAck='**/api/studio/memory/confirm';
    await page.route(lostAck,async route=>{
      const result=await route.fetch();
      confirmation={body:route.request().postDataJSON(),result:await result.json(),status:result.status()};
      await route.abort('internetdisconnected');
    });
    await confirmButton.click();
    await wait(()=>confirmation,'save committed with response dropped',25000);
    await page.unroute(lostAck);
    assert.equal(confirmation.status,200,confirmation.result.message);
    const scope={session:source.session,run:source.id,operation:confirmation.body.operation};
    const checked=await post('memory/check',scope);
    assert.equal(checked.body.status,'saved');
    const receipt=confirmation.result.receipt;
    assert.deepEqual(checked.body.receipt,receipt);
    assert.deepEqual((await post('memory/confirm',confirmation.body)).body.receipt,receipt);
    const memory=(await post('memory/session',{session:source.session})).body;
    assert.equal(memory.records.filter(m=>m.id===receipt.memoryId).length,1);
    assert.equal(memory.records.find(m=>m.id===receipt.memoryId).revision,1);
    await page.locator('[data-memory-state="saved"]').waitFor();
    await page.screenshot({path:join(out,'memory-saved.png')});
    evidence.memory={run:source.id,operation:receipt.operation,memoryId:receipt.memoryId,
      revision:1,originalReceiptReplayed:true,acknowledgementDropped:true};
    if(isFixture&&process.env.TORI_BACKGROUND_FIXTURE_DB){
      const db=new DatabaseSync(process.env.TORI_BACKGROUND_FIXTURE_DB);
      let original;
      try{
        original=db.prepare('SELECT * FROM operations WHERE id=?').get(receipt.operation);
        assert.ok(original);
        db.prepare('DELETE FROM operations WHERE id=?').run(receipt.operation);
        const inspect=await post('memory/check',scope);
        assert.equal(inspect.body.status,'uncertain');
        await page.reload({waitUntil:'domcontentloaded'});
        await page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name:'Sessions',exact:true}).click();
        const row=page.locator('[data-session-id="'+source.session+'"]');
        if(!await row.isVisible())await page.getByRole('button',{name:'Quellight',exact:true}).first().click();
        await row.click();
        const card=page.locator('[data-memory-state="uncertain"]');
        await card.waitFor();
        assert.equal(await card.getByRole('button',{name:'Confirm and save',exact:true}).count(),0);
        await card.getByRole('button',{name:'Check save outcome',exact:true}).click();
        await card.getByText('The original save still cannot be reconciled.',{exact:true}).waitFor();
        assert.equal((await post('memory/confirm',confirmation.body)).status,409);
        await card.screenshot({path:join(out,'memory-uncertain.png')});
        db.prepare('INSERT INTO operations VALUES (?,?,?,?,?)')
          .run(original.id,original.scope,original.digest,original.receipt,original.run);
        original=undefined;
        await card.getByRole('button',{name:'Check save outcome',exact:true}).click();
        await page.locator('[data-memory-state="saved"]').waitFor();
        evidence.memory.fixtureUncertainRefused=true;
      }finally{
        if(original)db.prepare('INSERT OR IGNORE INTO operations VALUES (?,?,?,?,?)')
          .run(original.id,original.scope,original.digest,original.receipt,original.run);
        db.close();
      }
    }

    if(step!=='fixture-memory'){
    await page.goto(url,{waitUntil:'domcontentloaded'});
    const restartRun=await start(page,'Delegate a habits review to Research, then write a long report with sections. Start with the actual research lookup.');
    await page.getByRole('button',{name:'Inspect Run',exact:true}).click();
    await page.waitForURL(u=>u.searchParams.get('run')===restartRun.run);
    const restartLink=page.url();
    await visibleState(page,'Running');
    await page.close();
    assert.ok(process.env.TORI_BACKGROUND_RESTART_SCRIPT,'An isolated preview restart command is required.');
    const proc=spawn('pwsh',['-NoProfile','-File',process.env.TORI_BACKGROUND_RESTART_SCRIPT,'-Restart',
      '-Port',new URL(url).port],{stdio:'inherit',windowsHide:true});
    assert.equal((await once(proc,'exit'))[0],0);
    page=await desktop.newPage();
    await page.goto(restartLink,{waitUntil:'domcontentloaded',timeout:120000});
    await visibleState(page,'Interrupted');
    await page.getByText('Studio restarted before the turn result was confirmed. It was not replayed.',{exact:true}).waitFor();
    const recovered=await post('run-observe',restartRun);
    assert.equal(recovered.status,200);
    assert.equal(recovered.body.run.state,'Interrupted');
    assert.equal(recovered.body.run.recovery.replay,'none');
    assert.equal(recovered.body.ownership,undefined);
    assert.equal(recovered.body.session.interrupted,true);
    assert.equal((await api()).runs.filter(r=>r.session===restartRun.session&&!r.parentRun).length,1);
    assert.deepEqual((await post('memory/confirm',confirmation.body)).body.receipt,receipt);
    await page.screenshot({path:join(out,'restart-interrupted.png')});
    evidence.restart={...restartRun,state:recovered.body.run.state,replay:'none',
      streamGap:recovered.body.stream.gap,priorOwner:recovered.body.run.recovery.priorOwner,previousSaveReceiptRetained:true};
    }
  }
  if(step==='fixture-memory'){
    await page.goto(url,{waitUntil:'domcontentloaded'});
    const opened=page.waitForResponse(r=>r.url().endsWith('/api/studio/sessions'));
    const text=await createSession(page);
    const id=(await (await opened).json()).openedSession;
    await page.getByRole('button',{name:'Run in background',exact:true}).click();
    let skipped=false;
    const lostStart='**/api/studio/start-run';
    await page.route(lostStart,route=>{skipped=true;return route.abort('internetdisconnected');});
    await text.fill('Synthetic missing start request.');await text.press('Enter');
    await wait(()=>skipped,'start not delivered');
    await page.getByText('No Run has been found yet. Sending again uses the same request.',{exact:true}).waitFor();
    await page.unroute(lostStart);
    const deletion=await post('delete-session',{session:id});
    assert.equal(deletion.status,200);
    await page.reload({waitUntil:'domcontentloaded'});
    const newer=await start(page,'Synthetic start after deleting the abandoned request Session.');
    assert.notEqual(newer.session,id);
    evidence.abandonedSessionCleared=true;
  }
  await writeFile(join(out,'observed.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence));
}finally{await browser.close();}
