import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {setTimeout as delay} from 'node:timers/promises';
import {fixtureRuns,fixtureSession} from '../fixtures/run-visibility/preview.mjs';
import {projectRunReport} from '../packages/run-visibility/index.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE??'playwright');
const port=process.env.TORI_RV_BROWSER_PORT??'48921',url='http://127.0.0.1:'+port;
const directory=await mkdtemp(join(tmpdir(),'tori-rv-browser-'));
const out=process.env.TORI_RV_EVIDENCE??'.local/run-visibility-browser';
await mkdir(out,{recursive:true});
const db=new DatabaseSync(join(directory,'studio.sqlite'));
db.exec('CREATE TABLE project (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');
const historical={...fixtureRuns[0],id:'rv-fixture-historical',name:'Historical fixture',status:'completed',state:'Finished',errorCode:undefined,message:undefined,
  publicEvents:[],events:[{at:fixtureRuns[0].started,label:'Historical fixture completed'}]};
historical.report=projectRunReport({run:historical});
const noAnswer={...historical,id:'rv-no-answer',name:'Interrupted fixture',status:'failed',state:'Interrupted',
  errorCode:'TORI_TURN_INTERRUPTED',message:'The interrupted turn could not be confirmed.',input:'A request without an answer.',output:undefined};
const session={...fixtureSession,messages:[...fixtureSession.messages,{id:noAnswer.id+'-user',role:'user',text:noAnswer.input}]};
const emptySession={...fixtureSession,id:'rv-session-empty',title:'Empty fixture Session',messages:[]};
db.prepare('INSERT INTO project VALUES (1,?)').run(JSON.stringify({workspace:'rv-browser-fixture',drafts:[],activations:[],sessions:[session,emptySession],runs:[...fixtureRuns,historical,noAnswer]}));db.close();
let host,browser,hostLog='',record={origin:'synthetic presentation fixture',assertions:[]};
const api=()=>fetch(url+'/api/studio').then(r=>r.json());
try{
  host=spawn(process.execPath,['./node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',port,'--strictPort'],{
    env:{...process.env,TORI_DATA_DIR:directory,TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',TORI_EXECUTION_FIXTURE:'a1-request-capture',TORI_ENABLE_PI_ZAI:'0'},windowsHide:true});
  for(const stream of [host.stdout,host.stderr])stream.on('data',bytes=>{hostLog=(hostLog+bytes).slice(-5000);});
  let initial;
  for(let i=0;i<400;i++){initial=await api().catch(()=>null);if(initial?.workspace)break;if(host.exitCode!==null)throw Error(hostLog);await delay(150);}
  assert.equal(initial.workspace,'rv-browser-fixture');
  const unchanged=JSON.stringify(initial.runs);
  browser=await chromium.launch();record.browser=browser.version();
  const context=await browser.newContext({viewport:{width:1531,height:850}}),page=await context.newPage();
  const errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',request=>{if(request.method()==='POST'&&!/\/(memory\/list|memory\/run|run-observe)$/.test(request.url()))writes.push(request.url());});
  page.setDefaultTimeout(25000);
  const task=name=>page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name,exact:true});
  const activity=()=>page.locator('[data-activity-id]').filter({hasText:'Denied'});
  const resizeRuns=async(width,height,layout)=>{
    await page.setViewportSize({width,height});
    await page.locator(`.execution-workspace[data-layout="${layout}"]`).waitFor();
  };
  const openDetails=async()=>{
    const sidebar=page.getByRole('button',{name:'Runs sidebar',exact:true});
    if(await sidebar.getAttribute('aria-expanded')!=='true')await sidebar.click();
    const details=page.getByRole('button',{name:'Details',exact:true});
    if(await details.getAttribute('aria-expanded')!=='true')await details.click();
  };
  const closeNarrowSidebar=async()=>{
    await page.keyboard.press('Escape');
    await page.getByRole('dialog',{name:'Runs',exact:true}).waitFor({state:'hidden'});
  };
  const choose=async value=>{await openDetails();await page.getByLabel('Activity detail',{exact:true}).selectOption(value);};
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await task('Runs').click();
  await page.getByRole('heading',{name:'Quellight fixture',exact:true}).waitFor();
  assert.equal(await activity().count(),0);
  const outcome=page.getByRole('region',{name:'Turn',exact:true});
  const denial='A read-only tool was denied in this synthetic fixture.';
  await outcome.getByText(denial,{exact:true}).waitFor();
  assert.equal(await page.getByText(denial,{exact:true}).count(),1,'Quiet shows the outcome message once');
  await page.getByRole('main',{name:'Run outcome and timeline'}).getByText(fixtureRuns[0].output,{exact:true}).waitFor();
  await page.screenshot({path:join(out,'desktop-quiet.png')});
  await choose('summary');await activity().getByRole('button',{name:/Denied/}).waitFor();
  assert.equal(await activity().getByText('VICT_SCOPE_DENIED',{exact:false}).count(),0);
  await page.screenshot({path:join(out,'desktop-summary.png')});
  await choose('full');
  const row=activity().getByRole('button',{name:/Denied/});
  assert.equal(await row.getAttribute('aria-expanded'),'false');
  await row.focus();await row.press('Space');
  assert.equal(await row.getAttribute('aria-expanded'),'true');
  await activity().getByRole('list',{name:'Attempt receipts'}).waitFor();
  const technical=()=>page.getByRole('button',{name:'Public receipts and diagnostics',exact:true});
  await technical().click();
  await page.getByText('conversation:rv-fixture-parent-agent',{exact:true}).waitFor();
  await page.screenshot({path:join(out,'desktop-full.png')});
  await page.getByRole('button',{name:/^Open child Run · Research fixture/}).click();
  await openDetails();
  const specialist=page.getByRole('region',{name:'Specialist report'});
  await page.getByText('rv-fixture-child-r3',{exact:true}).waitFor();
  await page.getByText('Not configured',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Open parent Run',exact:true}).click();
  await page.getByRole('heading',{name:'Quellight fixture',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:/^Open child Run · Research fixture/}).evaluate(node=>node===document.activeElement),true);
  await page.reload();await task('Runs').click();await openDetails();
  assert.equal(await page.getByLabel('Activity detail',{exact:true}).inputValue(),'full');
  assert.equal(await activity().getByRole('button',{name:/Denied/}).getAttribute('aria-expanded'),'false');
  await task('Sessions').click();
  await page.getByRole('main',{name:'Conversation'}).getByText(fixtureRuns[0].output,{exact:true}).waitFor();
  await page.getByRole('main',{name:'Conversation'}).getByText('Continued working',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Open Research fixture Run',exact:true}).click();
  await page.getByRole('heading',{name:'Research fixture',exact:true}).waitFor();
  await page.getByRole('button',{name:'Back to Session',exact:true}).click();
  await page.getByRole('main',{name:'Conversation'}).getByText(fixtureRuns[0].output,{exact:true}).waitFor();
  const details=page.getByRole('button',{name:'Details',exact:true});
  if(await details.getAttribute('aria-expanded')!=='true')await details.click();
  await page.getByRole('button',{name:'Inspect runs',exact:true}).click();
  await page.getByRole('main',{name:'Run outcome and timeline'}).waitFor();
  await task('Runs').click();await choose('quiet');
  await resizeRuns(390,844,'narrow');
  await page.screenshot({path:join(out,'narrow-quiet.png')});
  await choose('summary');await closeNarrowSidebar();
  await page.screenshot({path:join(out,'narrow-summary.png')});
  await choose('full');await closeNarrowSidebar();
  const fullTool=activity().getByRole('button',{name:/Denied/});
  if(await fullTool.count())await fullTool.click();
  await page.screenshot({path:join(out,'narrow-full.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await resizeRuns(1531,850,'desktop');await choose('quiet');
  await page.screenshot({path:join(out,'desktop-return.png')});
  await page.locator('[data-run-id="rv-fixture-historical"]').click();
  await openDetails();
  const historicalReason='Historical Run: public sequence and correlation evidence is unavailable.';
  await page.getByText(historicalReason,{exact:true}).waitFor({state:'hidden'});
  if(await technical().getAttribute('aria-expanded')!=='true')await technical().click();
  await page.getByText(historicalReason,{exact:true}).waitFor();
  await page.screenshot({path:join(out,'historical-diagnostic.png')});
  await task('Sessions').click();
  await page.getByRole('main',{name:'Conversation'}).getByText(noAnswer.message,{exact:true}).waitFor();
  await page.getByRole('main',{name:'Conversation'}).getByText('No final answer was received.',{exact:true}).waitFor();
  const empty=page.locator('[data-session-id=rv-session-empty]');
  if(!await empty.isVisible()){
    const group=page.getByRole('complementary',{name:'Session history'}).getByRole('button',{name:'Search Sessions',exact:true});
    await group.click();
    await page.getByRole('textbox',{name:'Search Sessions',exact:true}).fill('Empty fixture Session');
  }
  await empty.click();
  if(await details.getAttribute('aria-expanded')!=='true')await details.click();
  await page.getByRole('button',{name:'Inspect runs',exact:true}).click();
  await page.getByRole('heading',{name:'No Runs yet',exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'No Runs yet',exact:true}).evaluate(node=>node===document.activeElement),true);
  await page.getByRole('button',{name:'Back to Session',exact:true}).click();
  assert.equal(JSON.stringify((await api()).runs),unchanged);
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  record.assertions=['Same fixture Run at three levels','Quiet denial and unanswered interruption visible','Keyboard disclosure works','Local preference persists after reload','Session-to-child and back','Session Details-to-Runs','Runs-to-child and back with source focus','Budget unavailable vs no team cap','Session answer and separate continued work','390px no page overflow','390px to desktop historical Details','Zero execution/mutation requests','Stored receipts unchanged','Historical metadata is an inspectable diagnostic, not a danger badge','Full trace content reference'];
  record.pass=true;
}catch(error){record.pass=false;record.error=error.stack;record.hostLog=hostLog;throw error;}
finally{
  await writeFile(join(out,'browser.json'),JSON.stringify(record,null,2));
  await browser?.close();
  if(host&&host.exitCode===null){const end=once(host,'exit');host.kill();await end;}
}
