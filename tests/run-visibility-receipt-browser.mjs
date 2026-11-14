import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'vite';

const {chromium}=createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE??'playwright');
const port=process.env.TORI_RV_RECEIPT_PORT??'48922',url='http://127.0.0.1:'+port;
const directory=await mkdtemp(join(tmpdir(),'tori-rv-receipts-')),capture=join(directory,'calls.jsonl');
const out=process.env.TORI_RV_RECEIPT_EVIDENCE??'.local/run-visibility-receipts';await mkdir(out,{recursive:true});
let host,vite,browser,log='',record={origin:'deterministic provider; actual governed runtime receipts'};
const api=()=>fetch(url+'/api/studio').then(r=>r.json());
const post=async(path,body)=>{const r=await fetch(url+'/api/studio/'+path,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert.ok(r.ok,value.message);return value;};
try{
  host=spawn(process.execPath,['--import','./tests/a1-provider-fixture.mjs','./node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',port,'--strictPort'],{
    env:{...process.env,TORI_DATA_DIR:directory,TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',TORI_ENABLE_PI_ZAI:'0',TORI_A1_CAPTURE:capture,TORI_BROWSER_A4:'1'},windowsHide:true});
  for(const s of [host.stdout,host.stderr])s.on('data',b=>log=(log+b).slice(-5000));
  let initial;for(let i=0;i<400;i++){initial=await api().catch(()=>null);if(initial?.workspace)break;if(host.exitCode!==null)throw Error(log);await delay(150);}
  assert.ok(initial?.fixture);
  vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const a=await vite.ssrLoadModule('/src/assembly.ts');
  const agent=name=>{const h=a.history(a.emptyAssembly());assert.ok(h.apply(a.assemblyPatchOperations(h.graph,{name,instructions:'Use the synthetic approved source; delegate when available.',model:a.modelId,maxSteps:3})).ok);return h;};
  const child=agent('Research receipt fixture');
  assert.ok(child.apply([a.add('tool'),a.wire('tool','tool'),a.change('agent','maxSteps',3)]).ok);
  const definition=(await post('definitions',{})).definition;
  const revision=(await post('save',{definition,graph:child.graph})).revision;
  await post('activate',{definition,revision});
  const parent=agent('Quellight receipt fixture');
  assert.ok(parent.apply([a.add('child'),a.change('child','reference','saved:'+revision.id),a.wire('child','child'),a.change('agent','maxSteps',3)]).ok);
  const parentRevision=(await post('save',{definition:initial.definition,graph:parent.graph})).revision;
  const activation=(await post('activate',{definition:initial.definition,revision:parentRevision})).activation;
  const session=(await post('sessions',{activation:activation.version})).sessions[0];
  const result=await post('turn',{session:session.id,input:'Delegate a review of the synthetic source.'});
  const run=result.runs.find(r=>r.session===session.id&&!r.parentRun),specialist=result.runs.find(r=>r.parentRun===run.id);
  assert.equal(run.status,'completed');assert.equal(specialist.status,'completed');
  const parentReply=result.sessions.find(item=>item.id===run.session)?.messages.find(message=>message.role==='assistant'&&message.id===run.id+'-agent');
  assert.ok(parentReply?.text);assert.equal(run.report.finalAnswer,parentReply.text);
  assert.equal(specialist.report.specialist.revision,revision.id);assert.ok(specialist.publicEvents.length);
  const before=await readFile(capture,'utf8'),stored=JSON.stringify((await api()).runs);
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1531,height:850}});page.setDefaultTimeout(25000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name:'Runs',exact:true}).click();
  await page.getByRole('button',{name:'Details',exact:true}).click();
  for(const value of ['summary','full','quiet'])await page.getByLabel('Activity detail',{exact:true}).selectOption(value);
  await page.getByRole('button',{name:/^Open child Run · Research receipt fixture/}).click();
  await page.getByText(revision.id,{exact:true}).waitFor();
  await page.getByRole('heading',{name:'Specialist report',exact:true}).waitFor();
  await page.getByText('Not configured',{exact:true}).waitFor();
  await page.getByLabel('Activity detail',{exact:true}).selectOption('full');
  const work=page.locator('[data-run-activity="'+specialist.id+'"]').getByRole('button',{name:'Working',exact:true});await work.click();
  await page.screenshot({path:join(out,'actual-specialist.png')});
  await page.getByRole('button',{name:'Open parent Run',exact:true}).click();
  await page.getByRole('region',{name:'Specialist report'}).getByText(parentReply.text,{exact:true}).waitFor();
  await page.screenshot({path:join(out,'actual-parent.png')});
  assert.equal(await readFile(capture,'utf8'),before,'Inspecting must not make new provider calls');
  assert.equal(JSON.stringify((await api()).runs),stored,'Inspecting must not mutate receipts');assert.deepEqual(errors,[]);
  record={...record,pass:true,browser:browser.version(),parent:run.id,child:specialist.id,revision:revision.id,providerCalls:before.trim().split('\n').length,
    eventRows:specialist.publicEvents.length,reportMatchesReceipt:true,zeroDispatchOnViews:true,unchangedRunReceipts:true};
}catch(error){record={...record,pass:false,error:error.message};throw error;}
finally{await writeFile(join(out,'browser.json'),JSON.stringify(record,null,2));await browser?.close();await vite?.close();if(host&&host.exitCode===null){const end=once(host,'exit');host.kill();await end;}}
