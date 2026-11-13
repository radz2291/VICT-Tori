import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const {chromium}=createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE??'playwright');
const url=process.env.TORI_BACKGROUND_URL??'http://127.0.0.1:48872';
const out=process.env.TORI_BACKGROUND_EVIDENCE??'.local/background-browser';
const isFixture=process.env.TORI_BACKGROUND_FIXTURE==='1';
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const desktop=await browser.newContext({viewport:{width:1531,height:850}});
const wait=async(fn,label,ms=20000)=>{
  const deadline=Date.now()+ms;
  while(Date.now()<deadline){const result=await fn().catch(()=>null);if(result)return result;await delay(80);}
  throw Error('Timed out: '+label);
};
const api=async()=>fetch(url+'/api/studio').then(r=>r.json());
const visibleState=(page,text)=>page.getByRole('main',{name:'Run outcome and timeline'}).getByText(text,{exact:true}).waitFor();
const evidence={origin:isFixture?'fixture':'live',browser:browser.version()};
try {
  const initial=await api();
  assert.equal(initial.fixture,isFixture);
  const start=async(page,prompt)=>{
    await page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name:'Sessions',exact:true}).click();
    await page.getByRole('button',{name:'New Session',exact:true}).click();
    await page.getByRole('region',{name:'Choose an agent'}).getByRole('button',{name:'Quellight',exact:true}).click();
    await page.getByRole('button',{name:/^Start Session with Quellight · r1(?: ·|$)/}).click();
    const toggle=page.getByRole('button',{name:'Run in background',exact:true});
    await toggle.waitFor();
    assert.equal(await toggle.getAttribute('aria-pressed'),'false');
    await toggle.focus();
    await toggle.press('Space');
    assert.equal(await toggle.getAttribute('aria-pressed'),'true');
    const text=page.getByRole('textbox',{name:'Message',exact:true});
    await text.fill(prompt);
    const request=page.waitForResponse(r=>r.url().endsWith('/api/studio/start-run'));
    await text.press('Enter');
    const res=await request, result=await res.json();
    assert.equal(res.status(),200,result.message);
    return result;
  };
  let page=await desktop.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('navigation',{name:'Studio tasks'}).waitFor({timeout:90000});
  const prompt='Delegate habits research to the saved Research specialist now. Then give me a long report: include the actual finding code and ten detailed sections about assumptions, interpretation, tradeoffs and follow-up options. Clearly distinguish suggestions from facts.';
  const original=await start(page,prompt);
  await page.getByText('You can close this tab while Studio stays open.',{exact:true}).waitFor();
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
  const terminal=await wait(async()=>{
    const fresh=await api(), row=fresh.runs.find(r=>r.id===original.run);
    return row?.state!=='Running'?{row,fresh}:null;
  },'original Run completion',100000);
  assert.equal(terminal.row.state,'Finished',terminal.row.message);
  await visibleState(page,'Finished');
  await page.screenshot({path:join(out,'finished-narrow.png')});
  const originalRuns=terminal.fresh.runs.filter(r=>r.session===original.session&&!r.parentRun);
  assert.equal(originalRuns.length,1);
  const children=terminal.fresh.runs.filter(r=>r.parentRun===original.run);
  assert.equal(children.length,1);
  assert.equal(children[0].state,'Finished');
  assert.ok(children[0].scriptReceipts?.some(r=>r.status==='completed'));
  const finalSession=terminal.fresh.sessions.find(s=>s.id===original.session);
  assert.ok(finalSession.messages.some(m=>m.id===original.run+'-agent'&&m.text.length));
  evidence.detach={...original,stream:terminal.row.streamId,rejoinedState:rejoined.state,
    status:terminal.row.state,modelSteps:terminal.row.modelSteps,child:children[0].id,invocation:children[0].parentInvocation,
    scriptReceipt:children[0].scriptReceipts[0].invocationId,
    executionCount:originalRuns.length,resultLength:finalSession.messages.find(m=>m.id===original.run+'-agent').text.length};
  await narrow.close();

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
  await writeFile(join(out,'observed.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence));
}finally{await browser.close();}
