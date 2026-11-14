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

const {chromium}=createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE??'playwright');
const port=process.env.TORI_RV_BROWSER_PORT??'48921',url='http://127.0.0.1:'+port;
const directory=await mkdtemp(join(tmpdir(),'tori-rv-browser-'));
const out=process.env.TORI_RV_EVIDENCE??'.local/run-visibility-browser';
await mkdir(out,{recursive:true});
const db=new DatabaseSync(join(directory,'studio.sqlite'));
db.exec('CREATE TABLE project (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');
db.prepare('INSERT INTO project VALUES (1,?)').run(JSON.stringify({workspace:'rv-browser-fixture',drafts:[],activations:[],sessions:[fixtureSession],runs:fixtureRuns}));db.close();
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
  const activity=()=>page.locator('[data-run-activity="rv-fixture-parent"]');
  const openDetails=async()=>{
    const sidebar=page.getByRole('button',{name:'Runs sidebar',exact:true});
    if(await sidebar.getAttribute('aria-expanded')!=='true')await sidebar.click();
    const details=page.getByRole('button',{name:'Details',exact:true});
    if(await details.getAttribute('aria-expanded')!=='true')await details.click();
  };
  const choose=async value=>{await openDetails();await page.getByLabel('Activity detail',{exact:true}).selectOption(value);};
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await task('Runs').click();
  await page.getByRole('heading',{name:'Quellight fixture',exact:true}).waitFor();
  assert.equal(await activity().getByRole('button',{name:'Working',exact:true}).getAttribute('aria-expanded'),'false');
  await activity().getByText('A read-only tool was denied in this synthetic fixture.',{exact:true}).waitFor();
  await page.getByRole('main',{name:'Run outcome and timeline'}).getByText(fixtureRuns[0].output,{exact:true}).waitFor();
  await page.screenshot({path:join(out,'desktop-quiet.png')});
  await choose('summary');await activity().getByRole('definition').first().waitFor();
  await page.screenshot({path:join(out,'desktop-summary.png')});
  await choose('full');
  for(const name of ['Working','Continued working']){const control=activity().getByRole('button',{name,exact:true});await control.focus();await control.press('Space');assert.equal(await control.getAttribute('aria-expanded'),'true');}
  await activity().getByText('Receipt',{exact:true}).first().waitFor();
  await page.screenshot({path:join(out,'desktop-full.png')});
  await page.getByRole('button',{name:/^Open child Run · Research fixture/}).click();
  await openDetails();
  const specialist=page.getByRole('region',{name:'Specialist report'});
  await page.getByText('rv-fixture-child-r3',{exact:true}).waitFor();
  await page.getByText('Not configured',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Open parent Run',exact:true}).click();
  assert.equal(await activity().getByRole('button',{name:'Continued working',exact:true}).getAttribute('aria-expanded'),'true');
  await page.reload();await task('Runs').click();await openDetails();
  assert.equal(await page.getByLabel('Activity detail',{exact:true}).inputValue(),'full');
  assert.equal(await activity().getByRole('button',{name:'Working',exact:true}).getAttribute('aria-expanded'),'true');
  await task('Sessions').click();
  await page.getByRole('main',{name:'Conversation'}).getByText(fixtureRuns[0].output,{exact:true}).waitFor();
  await activity().getByRole('button',{name:'Continued working',exact:true}).waitFor();
  await task('Runs').click();await choose('quiet');
  for(const name of ['Working','Continued working']){const control=activity().getByRole('button',{name,exact:true});if(await control.getAttribute('aria-expanded')==='true')await control.click();}
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:join(out,'narrow-quiet.png')});
  await choose('summary');await page.keyboard.press('Escape');
  await page.screenshot({path:join(out,'narrow-summary.png')});
  await choose('full');await page.keyboard.press('Escape');
  await activity().getByRole('button',{name:'Continued working',exact:true}).click();
  await page.screenshot({path:join(out,'narrow-full.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(JSON.stringify((await api()).runs),unchanged);
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  record.assertions=['Same fixture Run at three levels','Quiet denial visible','Keyboard disclosure works','Groups persist by workspace and Run','Local preference persists after reload','Parent and child links','Budget unavailable vs no team cap','Session answer and separate continued work','390px no page overflow','Zero execution/mutation requests','Stored receipts unchanged'];
  record.pass=true;
}catch(error){record.pass=false;record.error=error.stack;record.hostLog=hostLog;throw error;}
finally{
  await writeFile(join(out,'browser.json'),JSON.stringify(record,null,2));
  await browser?.close();
  if(host&&host.exitCode===null){const end=once(host,'exit');host.kill();await end;}
}
