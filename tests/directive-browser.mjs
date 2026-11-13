import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';

const {chromium}=createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE??'playwright');
const port=process.env.TORI_DIRECTIVE_BROWSER_PORT??'48938';
const url='http://127.0.0.1:'+port;
const directory=await mkdtemp(join(tmpdir(),'tori-directive-browser-'));
const out=process.env.TORI_DIRECTIVE_BROWSER_EVIDENCE??'.local/t9-directive-browser';
await mkdir(out,{recursive:true});
const fixture='synthetic-a1-fixture';
const env={...process.env,TORI_DATA_DIR:directory,TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:fixture,
  TORI_ENABLE_PI_ZAI:'0',TORI_TEST_HISTORICAL_ACTIVATION:'0'};
let host, browser, hostLog='';
const api=async()=>fetch(url+'/api/studio').then(response=>response.json());
const post=async (path,body)=>{
  const response=await fetch(url+'/api/studio/'+path,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:response.status,body:await response.json()};
};
const record={fixture:true};
const source='Going forward, give me Orchid updates in three short bullets. Keep that as my preference.';
const revised='For future Orchid updates, use two short bullets.';
const quiet=['Do you remember what we talked about last week?', 'Do you remember what we discussed last week?',
  'Ingat lagi apa kita bincang minggu lepas?'];
async function until(check){
  for(let i=0;i<100;i++){
    const result=await check();
    if(result)return result;
    await delay(100);
  }
  throw Error('Expected browser fixture state did not settle.');
}
const waitDirective=(run,status)=>until(async()=>{
  const {body}=await post('memory/run',{run});
  return body.directive?.status===status?body:undefined;
});

async function stopHost(){
  if(!host||host.exitCode!==null||host.signalCode!==null)return;
  const closed=once(host,'exit');
  host.kill();
  await closed;
}
async function startHost(){
  host=spawn(process.execPath,['--import','./tests/directive-provider-fixture.mjs','./node_modules/vite/bin/vite.js',
    '--host','127.0.0.1','--port',port,'--strictPort'],{env,windowsHide:true});
  for(const stream of [host.stdout,host.stderr])stream.on('data',bytes=>{hostLog=(hostLog+bytes).slice(-5000);});
  for(let i=0;i<300;i++){
    const ready=await api().catch(()=>null);
    if(ready?.workspace){assert.equal(ready.fixture,true);return;}
    if(host.exitCode!==null)break;
    await delay(200);
  }
  throw Error('The isolated browser fixture could not start.');
}
try{
  await startHost();
  browser=await chromium.launch();
  record.chromium=browser.version();
  const page=await browser.newPage({viewport:{width:1531,height:850}});
  page.setDefaultTimeout(20000);
  const button=name=>page.getByRole('button',{name,exact:typeof name==='string'});
  const field=id=>page.locator('#'+id);
  const task=name=>page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name,exact:true});
  const settings=()=>page.getByRole('region',{name:'Standing Directive settings'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url,{timeout:90000});
  await button('Add Agent').click({timeout:90000});
  await field('settings-agent-name').fill('Quellight');
  await field('settings-agent-text').fill('Respond naturally to synthetic Orchid updates.');
  await field('settings-model').selectOption('glm-5.3-flash');
  await field('settings-saved-memory').selectOption('governed@1');
  await button('Add Directive').click();
  await settings().getByText('Unconnected',{exact:true}).waitFor();
  assert.equal(await field('settings-directive-historyBytes').inputValue(),'8192');
  assert.equal(await field('settings-directive-deadlineMs').inputValue(),'22');
  const tuning=page.getByRole('switch',{name:'Advanced sensitivity tuning'});
  assert.equal(await tuning.getAttribute('aria-checked'),'false');
  await tuning.click();
  await field('settings-directive-sensitivity').selectOption('cautious');
  assert.equal(await field('settings-directive-sensitivity').inputValue(),'cautious');
  await page.screenshot({path:join(out,'directive-tuning.png'),animations:'disabled'});
  await tuning.click();
  assert.equal(await field('settings-directive-sensitivity').count(),0);
  await button('Connect Directive').click();
  await field('settings-directive-deadlineMs').fill('121');
  const save=async()=>{
    const response=page.waitForResponse(r=>r.url().endsWith('/api/studio/save'));
    await button('Save').click();
    const result=await response;
    assert.equal(result.status(),200);
    return (await result.json()).revision;
  };
  const bad=await save();
  assert.equal((await post('activate',{revision:bad})).status,409);
  await field('settings-directive-deadlineMs').fill('120');
  await field('settings-directive-historyBytes').fill('4096');
  const valid=await save();
  await button('Activate r'+valid.number).click();
  await page.getByText('4,096 bytes · 120 s · 1,536 output tokens',{exact:true}).waitFor();
  await page.screenshot({path:join(out,'directive-configure.png'),animations:'disabled'});
  record.activation=(await api()).activation;

  await button('Canvas').click();
  const dock=page.getByRole('complementary',{name:'Assembly / Selection'});
  await dock.getByRole('tab',{name:'Assembly',exact:true}).click();
  const nodes=dock.getByRole('button',{name:'Nodes',exact:true});
  if(await nodes.getAttribute('aria-expanded')!=='true')await nodes.click();
  await dock.getByRole('button',{name:'Standing Directive',exact:true}).click();
  await dock.getByRole('tab',{name:'Selection',exact:true}).click();
  await field('dock-settings-directive-historyBytes').fill('6144');
  await button('Configure').click();
  assert.equal(await field('settings-directive-historyBytes').inputValue(),'6144');
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await page.getByRole('menuitem',{name:'Undo',exact:true}).click();
  assert.equal(await field('settings-directive-historyBytes').inputValue(),'4096');
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await page.getByRole('menuitem',{name:'Redo',exact:true}).click();
  assert.equal(await field('settings-directive-historyBytes').inputValue(),'6144');
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await page.getByRole('menuitem',{name:'Undo',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:join(out,'directive-configure-phone.png'),animations:'disabled'});
  await page.setViewportSize({width:1531,height:850});

  const launch=page.waitForResponse(r=>r.url().endsWith('/api/studio/sessions')&&r.request().method()==='POST');
  await button('Start Session').click();
  const session=(await (await launch).json()).openedSession;
  assert.ok(session);
  const send=async text=>{
    const input=page.getByRole('textbox',{name:'Message',exact:true});
    await input.fill(text);
    const reply=page.waitForResponse(r=>r.url().endsWith('/api/studio/turn')&&r.request().method()==='POST');
    await input.press('Enter');
    const response=await reply;
    assert.equal(response.status(),200);
    return (await response.json()).runs.find(r=>r.session===session);
  };
  const first=await send(source);
  assert.equal(first.status,'completed');
  assert.equal(first.directive.status,'pending');
  const next=await send('Give me a planning update.');
  assert.equal(next.status,'completed');
  const card=page.locator('[data-memory-turn="'+first.id+'"]');
  await card.getByTestId('memory-proposal-text').waitFor();
  assert.equal(await card.getAttribute('data-source-message'),first.id+'-user');
  await card.getByRole('button',{name:'Correct',exact:true}).click();
  await card.getByRole('textbox',{name:'Memory to save'}).fill(revised);
  await card.getByRole('button',{name:'Review correction',exact:true}).click();
  assert.equal(await card.getByTestId('memory-proposal-text').textContent(),revised);
  await card.getByRole('button',{name:'Confirm and save',exact:true}).click();
  await card.locator('[data-testid="memory-confirmed-text"]').waitFor();
  const memory=await post('memory/run',{run:first.id});
  assert.equal(memory.body.receipt.directive.proposalRevision,2);
  await page.screenshot({path:join(out,'directive-confirmed.png'),animations:'disabled'});
  record.receipt=memory.body.receipt;
  record.nextSendCompleted=next.id;
  const sameSession=await send('Give me an Orchid project update.');
  assert.equal(sameSession.status,'completed');
  const sameMemory=await waitDirective(sameSession.id,'none');
  assert.deepEqual(sameMemory.evidence.admitted.map(({id,revision,updatedAt})=>({id,revision,updatedAt})),[
    {id:record.receipt.memoryId,revision:1,updatedAt:record.receipt.at},
  ]);
  const sameAnswer=(await api()).sessions.find(item=>item.id===session).messages
    .find(item=>item.id===sameSession.id+'-agent').text;
  assert.equal(sameAnswer.split('\n').filter(line=>line.startsWith('- ')).length,2);
  await page.getByText(sameAnswer.split('\n')[0].slice(2),{exact:true}).waitFor();
  assert.equal(await page.locator('[data-memory-turn="'+sameSession.id+'"]').count(),0);
  record.sameSession={id:sameSession.id,answer:sameAnswer,admitted:sameMemory.evidence.admitted[0]};
  await page.screenshot({path:join(out,'directive-same-session.png'),animations:'disabled'});
  const details=page.getByRole('region',{name:'Session details content'});
  await details.waitFor({state:'hidden'});
  const sidebar=button('Sessions sidebar');
  if(await sidebar.getAttribute('aria-expanded')!=='true')await sidebar.click();
  await button('Details').click();
  await details.waitFor();
  const stopped=await send('Keep this synthetic preference until Stop.');
  await details.getByRole('list',{name:'Pending interpretations'}).getByRole('button',{name:'Stop interpretation',exact:true}).click();
  const stoppedEvidence=await waitDirective(stopped.id,'cancelled');
  assert.equal(stoppedEvidence.proposal,undefined);
  assert.equal(await page.locator('[data-memory-turn="'+stopped.id+'"]').count(),0);
  record.stopped=stopped.id;
  record.quiet=[];
  for(const text of quiet){
    const recall=await send(text);
    assert.equal(recall.status,'completed');
    const viewed=await waitDirective(recall.id,'none');
    assert.equal(viewed.proposal,undefined);
    assert.equal(viewed.request,undefined);
    assert.equal(await page.locator('[data-memory-turn="'+recall.id+'"]').count(),0);
    record.quiet.push(recall.id);
  }
  const manualSource=quiet.at(-1);
  await details.getByLabel('Draft a memory from a turn').selectOption({label:manualSource});
  await details.getByRole('textbox',{name:'Memory to propose'}).fill('Use concise timing notes for the synthetic planning project.');
  await details.getByRole('button',{name:'Draft memory',exact:true}).click();
  const manual=page.locator('[data-memory-turn="'+record.quiet.at(-1)+'"]');
  await manual.getByRole('button',{name:'Confirm and save',exact:true}).waitFor();
  await page.screenshot({path:join(out,'directive-manual.png'),animations:'disabled'});
  await manual.getByRole('button',{name:'Dismiss',exact:true}).click();
  await manual.getByText(/Nothing saved/).waitFor();
  await page.setViewportSize({width:390,height:844});
  await card.screenshot({path:join(out,'directive-confirmed-phone.png'),animations:'disabled'});

  const crashed=await send('Keep the Orchid restart preference.');
  assert.equal(crashed.directive.status,'pending');
  await stopHost();
  await startHost();
  const interrupted=await waitDirective(crashed.id,'interrupted');
  assert.equal(interrupted.directive.reason,'host-restarted');
  assert.equal(interrupted.proposal,undefined);
  assert.deepEqual((await post('memory/run',{run:first.id})).body.receipt,record.receipt);
  record.interrupted=crashed.id;
  const {openedSession:fresh}=(await post('sessions',{activation:record.activation.version})).body;
  const recalled=await post('turn',{session:fresh,input:'Give me an Orchid project update.'});
  const recallRun=recalled.body.runs.find(r=>r.session===fresh);
  const evidence=await post('memory/run',{run:recallRun.id});
  assert.deepEqual(evidence.body.evidence.admitted.map(r=>[r.id,r.revision]),[[record.receipt.memoryId,1]]);
  const answer=recalled.body.sessions.find(s=>s.id===fresh).messages.at(-1).text;
  assert.equal(answer.split('\n').filter(line=>line.startsWith('- ')).length,2);
  record.recall={id:recallRun.id,answer,admitted:evidence.body.evidence.admitted[0]};
  assert.deepEqual(errors,[]);
  await writeFile(join(out,'observed.json'),JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify({chromium:record.chromium,activation:record.activation.version,save:record.receipt.memoryId,nextSend:next.id,recall:recallRun.id}));
}catch(error){
  console.error(hostLog);
  throw error;
}finally{
  await browser?.close();
  await stopHost();
}
