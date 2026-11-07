import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

const {chromium} = createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE ?? 'playwright');
const directory = await mkdtemp(join(tmpdir(),'tori-a1-fixture-'));
const capture = join(directory,'capture.jsonl');
const port = process.env.TORI_A1_PORT ?? '48769';
const url = 'http://127.0.0.1:'+port;
const a2=process.env.TORI_BROWSER_A2==='1';
const a3=process.env.TORI_BROWSER_A3==='1';
let server, browser, log = '';
async function launch() {
  log = '';
  server = spawn(process.execPath,['--import','./tests/a1-provider-fixture.mjs','./node_modules/vite/bin/vite.js',
    '--host','127.0.0.1','--port',port,'--strictPort'],{
    env:{...process.env,TORI_DATA_DIR:directory,TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',
      TORI_ENABLE_PI_ZAI:'0',TORI_A1_CAPTURE:capture},windowsHide:true,
  });
  for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{log+=chunk;});
  for(let i=0;i<300;i++){
    if(server.exitCode!==null)throw new Error(log);
    if(log.includes('Local:')){
      const response = await fetch(url+'/api/studio').catch(()=>null);
      if(response?.ok)return;
    }
    await setTimeout(100);
  }
  throw new Error('Studio start timed out\n'+log);
}
async function stop() {
  if(!server || server.exitCode!==null || server.signalCode!==null)return;
  const exit = once(server,'exit');
  server.kill();
  await exit;
}
const readCapture = async()=> (await readFile(capture,'utf8')).trim().split('\n').map(line=>JSON.parse(line).maxOutputTokens);

try {
  await launch();
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1531,height:668}});
  page.setDefaultTimeout(20000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const button=name=>page.getByRole('button',{name,exact:true});
  const field=id=>page.locator('#'+id);
  const api=async()=> (await page.request.get(url+'/api/studio')).json();
  async function clickRequest(buttonName,path) {
    const pending=page.waitForResponse(r=>r.url().endsWith('/api/studio/'+path)&&r.request().method()==='POST');
    await button(buttonName).click();
    const response=await pending;
    assert.equal(response.status(),200,await response.text());
    return response.json();
  }
  async function turn(expectedSession,expectedTokens) {
    const composer=page.getByRole('textbox',{name:'Message'});
    await composer.fill('Synthetic A1 verification');
    const pending=page.waitForResponse(r=>r.url().endsWith('/api/studio/turn'),{timeout:120000});
    await composer.press('Enter');
    const response=await pending;
    assert.equal(response.status(),200,await response.text());
    const run=(await response.json()).runs[0];
    assert.equal(run.status,'completed',JSON.stringify(run));
    assert.equal(run.session,expectedSession.id);
    assert.equal(run.activation,expectedSession.activation);
    assert.equal(run.fixture,'a1-request-capture');
    assert.equal(run.tokens,expectedTokens);
    assert.equal(run.sentMaxOutputTokens,expectedTokens);
    if(a2){
      assert.equal(run.sentTemperature,expectedTokens===2048?0.4:undefined);
      assert.equal(run.sentTopP,expectedTokens===2048?0.8:undefined);
      assert.equal(run.execution.maxSteps,expectedTokens===2048?2:1);
      assert.equal(run.execution.maxRetries,expectedTokens===2048?1:0);
    }
    await page.getByText('Deterministic A1 fixture answer.',{exact:true}).last().waitFor();
  }

  await page.goto(url,{timeout:120000});
  await button('Add Agent').click({timeout:60000});
  await field('inspector-agent-name').fill('A1 Fixture Agent');
  await field('inspector-agent-text').fill('Return a concise synthetic answer.');
  await button('Add model').click();
  await field('inspector-model-model').selectOption('glm-5.3-flash');
  await button('Connect to Model').click();
  await field('inspector-model-tokens').fill('4096');
  await clickRequest('Save','save');
  await clickRequest('Activate','activate');
  const old=(await clickRequest('Start Session','sessions')).sessions[0];
  await page.getByText('SESSION · DETERMINISTIC FIXTURE',{exact:true}).waitFor();
  await turn(old,4096);

  await button('Agents').click();
  await button('GLM-5.3 Flash').click();
  await button('Show output limit as node').click();
  await page.locator('.svelte-flow__edge[data-id="output-limit-to-tokens"]').waitFor();
  assert.equal(await field('inspector-output-limit-tokens').inputValue(),'4096');
  await field('inspector-output-limit-tokens').fill('2048');
  await button('GLM-5.3 Flash').click();
  assert.equal(await field('inspector-model-tokens').inputValue(),'2048');
  await page.screenshot({path:join(directory,'connected-output-limit.png'),animations:'disabled'});
  await button('Detach output limit source').click();
  assert.equal(await field('inspector-model-tokens').inputValue(),'2048');
  await button('Show output limit as node').click();
  assert.equal(await field('inspector-output-limit-tokens').inputValue(),'2048');
  if(a2){
    await button('GLM-5.3 Flash').click();
    await field('inspector-model-temperature').fill('0.4');
    await field('inspector-model-top-p').fill('0.8');
    await button('A1 Fixture Agent').click();
    await field('inspector-agent-steps').fill('2');
    await field('inspector-agent-retries').fill('1');
  }
  await clickRequest('Save','save');
  await clickRequest('Activate','activate');
  const next=(await clickRequest('Start Session','sessions')).sessions[0];
  assert.notEqual(next.activation,old.activation);
  await turn(next,2048);
  await button('Inspect runs').click();
  await page.getByText('2048 - sent 2048',{exact:true}).waitFor();
  await page.getByText('DETERMINISTIC FIXTURE',{exact:true}).waitFor();
  if(a2)await page.getByText('Temperature 0.4 · sent 0.4 / Top-p 0.8 · sent 0.8',{exact:true}).waitFor();
  await page.screenshot({path:join(directory,'fixture-run.png'),animations:'disabled'});

  await button('Agents').click();
  await button('Output limit Integer').click();
  for(const bad of ['63','64.5','32769']){
    await field('inspector-output-limit-tokens').fill(bad);
    const state=await clickRequest('Save','save');
    assert.ok(await button('Activate').isDisabled());
    const refused=await page.request.post(url+'/api/studio/activate',{data:{revision:state.revision},headers:{origin:url}});
    assert.equal(refused.status(),409);
    assert.match((await refused.json()).message,/whole output limit/);
    assert.equal((await api()).activation.version,next.activation);
  }
  assert.deepEqual(await readCapture(),[4096,2048]);

  await stop();
  await launch();
  await page.reload({timeout:120000});
  await button('Sessions').click();
  await field('session-picker').selectOption(old.id);
  await turn(old,4096);
  await field('session-picker').selectOption(next.id);
  await turn(next,2048);
  assert.deepEqual(await readCapture(),[4096,2048,4096,2048]);
  if(a3){
    await button('Agents').click();
    await button('Output limit Integer').click();
    await field('inspector-output-limit-tokens').fill('4096');
    for(const label of ['Context Source','Memory Policy','Read-only MCP Tool']){
      await page.getByRole('menuitem',{name:'Insert',exact:true}).click();
      await page.getByRole('menuitem',{name:label,exact:true}).click();
      await button('Connect '+label).click();
    }
    await button('A1 Fixture Agent').click();
    await field('inspector-agent-steps').fill('2');
    await clickRequest('Save','save');
    await clickRequest('Activate','activate');
    await clickRequest('Start Session','sessions');
    await page.getByRole('checkbox',{name:'Include pinned context on next turn'}).click();
    async function readReference(){
      const composer=page.getByRole('textbox',{name:'Message'});
      await composer.fill('Read the synthetic observatory reference.');
      const pending=page.waitForResponse(r=>r.url().endsWith('/api/studio/turn'),{timeout:120000});
      await composer.press('Enter');
      const response=await pending;
      assert.equal(response.status(),200);
      return (await response.json()).runs[0];
    }
    const enough=await readReference();
    assert.equal(enough.status,'completed');
    assert.equal(enough.modelSteps,2);
    assert.equal(enough.governance.calls,1);
    assert.equal(enough.context.status,'admitted');
    await button('Inspect runs').click();
    await page.getByText('1 MCP calls · completed',{exact:true}).waitFor();
    await page.screenshot({path:join(directory,'a3-completed.png'),animations:'disabled'});
    await button('Agents').click();
    await button('A1 Fixture Agent').click();
    await field('inspector-agent-steps').fill('1');
    await clickRequest('Save','save');
    await clickRequest('Activate','activate');
    await clickRequest('Start Session','sessions');
    const low=await readReference();
    assert.equal(low.errorCode,'TORI_MODEL_STEP_LIMIT');
    assert.equal(low.modelSteps,1);
    assert.equal(low.governance.calls,1);
    await button('Inspect runs').click();
    await page.getByText('Model step limit reached before the next call.',{exact:true}).waitFor();
    await page.screenshot({path:join(directory,'a3-step-limit.png'),animations:'disabled'});
    await button('Open Session').click();
    await button('Delete Session').click();
    await page.getByRole('dialog').getByText('Delete this Session?').waitFor();
    await clickRequest('Confirm delete Session','delete-session');
    assert.ok(!(await api()).sessions.some(session=>session.id===low.session));
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({mode:'deterministic fixture only',requests:await readCapture(),
    invalidDrafts:['63','64.5','32769'],restartIsolation:true,evidenceDirectory:directory}));
} catch(error) {
  console.error(log);
  throw error;
} finally {
  await browser?.close();
  await stop();
}
