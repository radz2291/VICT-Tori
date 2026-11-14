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
const a4=process.env.TORI_BROWSER_A4==='1';
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
  const button=name=>page.getByRole('button',{
    name,
    exact:true,
  });
  async function canvasMenu(name,role='menuitem'){
    await button('Canvas view').click();
    await page.getByRole(role,{name,exact:true}).click();
  }
  const library=page.getByRole('complementary',{name:'Assembly / Selection'});
  const layer=name=>library.locator('.assembly-node-section').getByRole('button',{name,exact:true});
  async function openNodes(){await openLibrary('Nodes');}
  async function openLibrary(section){
    const toggle=button('Assembly / Selection');
    if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
    const assembly=library.getByRole('tab',{name:'Assembly',exact:true});
    if(await assembly.getAttribute('aria-selected')!=='true')await assembly.click();
    const group=library.getByRole('button',{name:section,exact:true});
    if(await group.getAttribute('aria-expanded')!=='true')await group.click();
  }
  async function addCanvasComponent(label){
    await openLibrary('Components');
    await library.getByRole('button',{name:'Add '+label,exact:true}).click();
  }
  const task=name=>page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name,exact:true});
  async function expectSessionIdentity(title,identity){
    await page.getByRole('heading',{name:'Sessions',exact:true})
      .and(page.locator('[aria-describedby="selected-session-identity"]')).waitFor();
    await page.waitForFunction(text=>document.getElementById('selected-session-identity')?.textContent?.trim()===text,
      title+' · '+identity);
  }
  async function findSessionRow(id){
    if(await button('Sessions sidebar').getAttribute('aria-expanded')!=='true')await button('Sessions sidebar').click();
    const history=page.getByRole('complementary',{name:'Session history'});
    const row=history.locator('[data-session-id="'+id+'"]');
    if(!await row.isVisible()){
      const snapshot=await api();
      const session=snapshot.sessions.find(item=>item.id===id);
      const name=snapshot.definitions.find(item=>item.id===session.definition)?.name??session.name;
      await history.getByRole('button',{name,exact:true}).click();
    }
    return row;
  }
  async function chooseSession(id){
    await (await findSessionRow(id)).click();
  }
  async function sessionRowAction(id,name){
    const row=await findSessionRow(id);
    await row.hover();
    await page.locator('#session-row-actions-'+id).click();
    await page.getByRole('menuitem',{name,exact:true}).click();
  }
  async function openSessionDetails(){
    if(await button('Sessions sidebar').getAttribute('aria-expanded')!=='true')await button('Sessions sidebar').click();
    const details=button('Details');
    if(await details.getAttribute('aria-expanded')!=='true')await details.click();
  }
  async function inspectRuns(){
    await openSessionDetails();
    await button('Inspect runs').click();
    await page.waitForFunction(()=>document.activeElement?.matches('.run-summary h1'));
  }
  async function openRunDetails(name){
    if(await button('Runs sidebar').getAttribute('aria-expanded')!=='true')await button('Runs sidebar').click();
    if(await button('Details').getAttribute('aria-expanded')!=='true')await button('Details').click();
    await page.getByRole('region',{name:'Run details content'}).getByRole('heading',{name,exact:true}).scrollIntoViewIfNeeded();
  }
  async function chooseRunOption(name){
    await button('Run history options').click();
    await page.getByRole('menu',{name:'Run history options',exact:true}).getByRole('menuitemradio',{name,exact:true}).click();
  }
  const field=id=>page.locator('#'+id);
  async function openAgentExecution(){
    const disclosure=page.locator('.graph-node[data-kind="agent"]').getByRole('button',{name:/^Execution /});
    if(await disclosure.getAttribute('aria-expanded')!=='true')await disclosure.click();
  }
  async function agentAction(agent,name){
    await button('Actions for '+agent).click();
    await page.getByRole('menuitem',{name,exact:true}).click();
  }
  async function renameAgent(previous,name){
    await agentAction(previous,'Rename agent');
    await field('canvas-agent-label').fill(name);
    await button('Apply').click();
  }
  const api=async()=> (await page.request.get(url+'/api/studio')).json();
  async function clickRequest(buttonName,path) {
    const pending=page.waitForResponse(r=>r.url().endsWith('/api/studio/'+path)&&r.request().method()==='POST');
    if(buttonName==='Activate')await page.getByRole('button',{name:/^Activate r\d+$/}).click();
    else await button(buttonName).click();
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
  const searchAgents=page.getByRole('textbox',{name:'Search agents',exact:true});
  await searchAgents.fill('Unmatched fixture name');
  await page.locator('[data-surface="assembly-agents"][data-state="empty"]').waitFor();
  await searchAgents.clear();
  await task('Sessions').click();
  await page.locator('[data-surface="sessions-history"][data-state="empty"]').waitFor();
  await button('New Session').click();
  await page.locator('[data-surface="session-agent-picker"][data-state="empty"]').waitFor();
  await task('Runs').click();
  await page.locator('[data-surface="runs-history"][data-state="empty"]').waitFor();
  await task('Agents').click();
  const authoringToggle=button('Authoring Agent');
  assert.equal(await authoringToggle.getAttribute('aria-expanded'),'false');
  await authoringToggle.click();
  await page.getByRole('complementary',{name:'Authoring Agent',exact:true})
    .getByText(/Create and activate an agent with Draft Authoring/).waitFor();
  await authoringToggle.click();
  assert.equal(await authoringToggle.getAttribute('aria-expanded'),'false');
  await button('Canvas').click();
  await button('Add Agent').click({timeout:60000});
  await page.setViewportSize({width:390,height:844});
  await canvasMenu('Zoom out');
  await canvasMenu('Zoom out');
  await page.waitForFunction(()=>parseInt(document.querySelector('[aria-label="Canvas view"]').textContent)<90);
  const canvasTransform=()=>page.locator('.svelte-flow__viewport').evaluate(node=>node.style.transform);
  const narrowCamera=await canvasTransform();
  await button('Configure').click();
  await button('Canvas').click();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
  assert.equal(await canvasTransform(),narrowCamera);
  await page.setViewportSize({width:1531,height:668});
  await canvasMenu('Fit to view');
  await openNodes();
  await renameAgent('Untitled agent','A1 Fixture Agent');
  await library.getByRole('button',{name:'A1 Fixture Agent Unsaved changes',exact:true}).waitFor();
  await field('canvas-agent-instructions').fill('Return a concise synthetic answer.');
  await layer('A1 Fixture Agent').click();
  await library.getByRole('tab',{name:'Selection',exact:true}).click();
  await button('Configure').click();
  const sharedInstructions=field('dock-settings-agent-text');
  await sharedInstructions.fill('Selection changes the same draft.');
  assert.equal(await field('settings-agent-text').inputValue(),'Selection changes the same draft.');
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await page.getByRole('menuitem',{name:'Undo',exact:true}).click();
  assert.equal(await field('settings-agent-text').inputValue(),'Return a concise synthetic answer.');
  await button('Canvas').click();
  assert.equal(await field('canvas-agent-instructions').inputValue(),'Return a concise synthetic answer.');
  await openNodes();
  await page.screenshot({path:join(directory,'v1b-assembly-desktop.png'),animations:'disabled'});
  await canvasMenu('Add model');
  await field('canvas-model').selectOption('glm-5.3-flash');
  await agentAction('Model Reference','Connect to Model');
  await field('canvas-model-output-limit').fill('4096');
  const {graph:initialValidGraph}=await clickRequest('Save','save');
  await clickRequest('Activate','activate');
  const old=(await clickRequest('Start Session','sessions')).sessions[0];
  await expectSessionIdentity('New Session','A1 Fixture Agent · r1 · Fixture');
  await turn(old,4096);
  await expectSessionIdentity('Synthetic A1 verification','A1 Fixture Agent · r1 · Fixture');
  const beforeRename=(await api()).sessions.find(item=>item.id===old.id);
  await sessionRowAction(old.id,'Rename Session');
  const titleInput=page.getByRole('textbox',{name:'Session title'});
  await titleInput.fill('   ');
  assert.ok(await button('Save title').isDisabled());
  await titleInput.fill('  Observatory notes  ');
  await clickRequest('Save title','rename-session');
  await expectSessionIdentity('Observatory notes','A1 Fixture Agent · r1 · Fixture');
  const renamed=(await api()).sessions.find(item=>item.id===old.id);
  assert.equal(renamed.lastActivityAt,beforeRename.lastActivityAt);
  assert.equal(renamed.activation,old.activation);
  assert.deepEqual(renamed.messages,beforeRename.messages);

  await task('Agents').click();
  if(await button('Canvas').getAttribute('aria-pressed')!=='true')await button('Canvas').click();
  await openNodes();
  await layer('Model Reference').click();
  await canvasMenu('Fit to view');
  await agentAction('A1 Fixture Agent','Create and connect: Output limit Integer');
  const outputEdge=page.locator('.svelte-flow__edge[data-id="output-limit-to-tokens"] .svelte-flow__edge-path');
  await outputEdge.waitFor({state:'attached'});
  assert.ok(await outputEdge.evaluate(path=>path.getTotalLength())>0);
  assert.equal(await field('canvas-integer-output-limit').inputValue(),'4096');
  await field('canvas-integer-output-limit').fill('2048');
  await layer('Model Reference').click();
  assert.equal(await field('canvas-model-output-limit').inputValue(),'2048');
  await page.screenshot({path:join(directory,'connected-output-limit.png'),animations:'disabled'});
  const outputWire=page.getByRole('group',{name:'Output limit Integer to Max output tokens',exact:true});
  await outputWire.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Delete');
  await outputEdge.waitFor({state:'detached'});
  assert.equal(await field('canvas-model-output-limit').inputValue(),'2048');
  await layer('Output limit Integer').click();
  await agentAction('Output limit Integer','Connect to Max output tokens');
  assert.equal(await field('canvas-integer-output-limit').inputValue(),'2048');
  if(a2){
    await layer('Model Reference').click();
    await button('Sampling').click();
    await field('canvas-model-temperature').fill('0.4');
    await field('canvas-model-top-p').fill('0.8');
    await layer('A1 Fixture Agent').click();
    await openAgentExecution();
    await field('canvas-agent-steps').fill('2');
    await field('canvas-agent-retries').fill('1');
  }
  await clickRequest('Save','save');
  await clickRequest('Activate','activate');
  const next=(await clickRequest('Start Session','sessions')).sessions[0];
  assert.notEqual(next.activation,old.activation);
  const composer=page.getByRole('textbox',{name:'Message'});
  await composer.fill('Unsent next Session draft');
  await chooseSession(old.id);
  assert.equal(await composer.inputValue(),'');
  await composer.fill('Unsent old Session draft');
  await chooseSession(next.id);
  assert.equal(await composer.inputValue(),'Unsent next Session draft');
  await task('Runs').click();
  await task('Sessions').click();
  assert.equal(await composer.inputValue(),'Unsent next Session draft');
  await turn(next,2048);
  await inspectRuns();
  const runSidebar=page.getByRole('complementary',{name:'Run history'});
  const runGroups=runSidebar.getByLabel('Run history groups').locator('[data-accordion-trigger]');
  const selectedRun=runSidebar.locator('[data-run-id][aria-pressed=true]');
  const selectedId=await selectedRun.getAttribute('data-run-id');
  await selectedRun.getByText('Synthetic A1 verification',{exact:true}).waitFor();
  const runTurn=page.getByRole('region',{name:'Turn',exact:true});
  await runTurn.getByText('Synthetic A1 verification',{exact:true}).waitFor();
  await runTurn.getByText('Deterministic A1 fixture answer.',{exact:true}).waitFor();
  assert.equal(await runGroups.count(),1);
  await chooseRunOption('All runs');
  assert.equal(await runGroups.count(),2);
  assert.equal(await selectedRun.getAttribute('data-run-id'),selectedId);
  await chooseRunOption('This Session');
  assert.equal(await runGroups.count(),1);
  await chooseRunOption('Activity date');
  await runGroups.first().getByText('Today',{exact:true}).waitFor();
  await chooseRunOption('Session');
  await button('Search Runs').click();
  await runSidebar.getByRole('textbox',{name:'Search Runs'}).fill(selectedId);
  assert.equal(await selectedRun.getAttribute('data-run-id'),selectedId);
  await button('Search Runs').click();
  await openRunDetails('Execution');
  await page.getByText('2048 - sent 2048',{exact:true}).waitFor();
  await page.getByRole('region',{name:'Outcome'}).getByText('Fixture',{exact:true}).waitFor();
  if(a2)await page.getByText('Temperature 0.4 · sent 0.4 / Top-p 0.8 · sent 0.8',{exact:true}).waitFor();
  await page.screenshot({path:join(directory,'fixture-run.png'),animations:'disabled'});

  await task('Agents').click();
  if(await button('Canvas').getAttribute('aria-pressed')!=='true')await button('Canvas').click();
  await openNodes();
  await layer('Output limit Integer').click();
  for(const bad of ['63','64.5','32769']){
    await field('canvas-integer-output-limit').fill(bad);
    const state=await clickRequest('Save','save');
    assert.ok(await page.getByRole('button',{name:/^Activate r\d+$/}).isDisabled());
    const refused=await page.request.post(url+'/api/studio/activate',{data:{revision:state.revision},headers:{origin:url}});
    assert.equal(refused.status(),409);
    assert.match((await refused.json()).message,/whole output limit/);
    assert.equal((await api()).activation.version,next.activation);
  }
  assert.deepEqual(await readCapture(),[4096,2048]);

  await page.goto('about:blank');
  await stop();
  await launch();
  await page.goto(url,{timeout:120000});
  await button('Sessions').click();
  if(await button('Sessions sidebar').getAttribute('aria-expanded')!=='true')await button('Sessions sidebar').click();
  const group=page.getByRole('complementary',{name:'Session history'}).getByRole('button',{name:'A1 Fixture Agent',exact:true});
  assert.equal(await group.getAttribute('aria-expanded'),'false');
  await chooseSession(old.id);
  await expectSessionIdentity('Observatory notes','A1 Fixture Agent · r1 · Fixture');
  await turn(old,4096);
  const history=page.getByRole('complementary',{name:'Session history'});
  await page.waitForFunction(id=>document.querySelector('[data-session-id]')?.getAttribute('data-session-id')===id,old.id);
  const oldRow=history.locator('[data-session-id="'+old.id+'"]');
  const metadata=oldRow.locator('.session-row-meta');
  await metadata.getByText('r1 · Fixture',{exact:true}).waitFor();
  assert.equal(await oldRow.locator('time').count(),0);
  await openSessionDetails();
  const activity=page.locator('.session-details time');
  await activity.waitFor();
  assert.ok(await activity.getAttribute('datetime')>renamed.lastActivityAt);
  await button('Search Sessions').click();
  await history.getByRole('textbox',{name:'Search Sessions'}).fill('Observatory notes');
  assert.equal(await history.locator('[data-session-id]').count(),1);
  await history.getByRole('textbox',{name:'Search Sessions'}).clear();
  const priorRun=(await api()).runs.filter(run=>run.session===old.id).at(-1);
  await inspectRuns();
  const priorRow=page.locator('[data-run-id="'+priorRun.id+'"]');
  await priorRow.click();
  await button('Open turn').click();
  await page.waitForFunction(id=>document.activeElement?.getAttribute('data-message-id')===id,priorRun.id+'-user');
  await inspectRuns();
  assert.equal(await priorRow.getAttribute('aria-pressed'),'true');
  await button('Open turn').click();
  await chooseSession(next.id);
  await turn(next,2048);
  assert.deepEqual(await readCapture(),[4096,2048,4096,2048]);
  if(a3){
    await task('Agents').click();
    if(await button('Canvas').getAttribute('aria-pressed')!=='true')await button('Canvas').click();
    await openNodes();
    await layer('Show binding as a separate node: Output limit Integer').click();
    await field('canvas-integer-output-limit').fill('4096');
    for(const label of ['Context Source','Memory Policy','Read-only MCP Tool']){
      await addCanvasComponent(label);
      await agentAction(label,'Connect to '+label);
    }
    await openNodes();
    await layer('A1 Fixture Agent').click();
    await openAgentExecution();
    await field('canvas-agent-steps').fill('2');
    await clickRequest('Save','save');
    await clickRequest('Activate','activate');
    await clickRequest('Start Session','sessions');
    await button('Include pinned context on next turn').click();
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
    await inspectRuns();
    await openRunDetails('Evidence');
    await page.getByText('1 MCP calls · completed',{exact:true}).waitFor();
    await page.screenshot({path:join(directory,'a3-completed.png'),animations:'disabled'});
    await task('Agents').click();
    if(await button('Canvas').getAttribute('aria-pressed')!=='true')await button('Canvas').click();
    await openNodes();
    await layer('A1 Fixture Agent').click();
    await openAgentExecution();
    await field('canvas-agent-steps').fill('1');
    await clickRequest('Save','save');
    await clickRequest('Activate','activate');
    await clickRequest('Start Session','sessions');
    const low=await readReference();
    assert.equal(low.errorCode,'TORI_MODEL_STEP_LIMIT');
    assert.equal(low.modelSteps,1);
    assert.equal(low.governance.calls,1);
    await inspectRuns();
    await page.getByText('Model step budget reached (1 of 1). Inspect this Run for completed actions.',{exact:true}).waitFor();
    await page.screenshot({path:join(directory,'a3-step-limit.png'),animations:'disabled'});
    const failedTurn=page.getByRole('region',{name:'Turn',exact:true});
    await failedTurn.getByText('Read the synthetic observatory reference.',{exact:true}).waitFor();
    assert.equal(await failedTurn.locator('[data-message-id]').count(),1);
    await button('Open turn').click();
    await sessionRowAction(low.session,'Delete Session');
    await page.getByRole('dialog').getByText('Delete this Session?').waitFor();
    await clickRequest('Confirm delete Session','delete-session');
    assert.ok(!(await api()).sessions.some(session=>session.id===low.session));
    if(a4){
      await task('Agents').click();
      if(await button('Canvas').getAttribute('aria-pressed')!=='true')await button('Canvas').click();
      await openNodes();
      await layer('Read-only MCP Tool').click();
      const toolWire=page.getByRole('group',{name:'Read-only MCP Tool to Read-only MCP Tool',exact:true});
      await toolWire.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Delete');
      await toolWire.waitFor({state:'detached'});
      for(const label of ['Output Contract','Child Agent']){
        await addCanvasComponent(label);
        await agentAction(label,'Connect to '+label);
      }
      await agentAction('Child Agent','Inspect delegation');
      const delegation=library.getByRole('tabpanel',{name:'Selection',exact:true});
      await delegation.getByRole('heading',{name:'Delegation',exact:true}).waitFor();
      await page.getByText('Connected · deterministic fixture',{exact:true}).waitFor();
      await page.getByText('tori.child.reference-reviewer.invoke',{exact:true}).waitFor();
      await page.getByText('Synthetic reference review completed.',{exact:false}).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await library.getByRole('tab',{name:'Selection',exact:true}).getAttribute('aria-selected'),'true');
      assert.equal(await button('Actions for Child Agent').evaluate(el=>el===document.activeElement),true);
      await library.getByRole('tab',{name:'Selection',exact:true}).press('ArrowLeft');
      assert.equal(await library.getByRole('tab',{name:'Assembly',exact:true}).getAttribute('aria-selected'),'true');
      const delegationWire=page.getByRole('group',{name:'Child Agent to Child Agent',exact:true});
      await delegationWire.focus();
      await page.keyboard.press('Enter');
      await delegation.getByRole('heading',{name:'Delegation',exact:true}).waitFor();
      await page.screenshot({path:join(directory,'v1b-selection-desktop.png'),animations:'disabled'});
      await page.keyboard.press('Escape');
      assert.equal(await delegationWire.evaluate(el=>el===document.activeElement),true);
      await page.setViewportSize({width:390,height:844});
      await authoringToggle.click();
      const authoringSheet=page.getByRole('dialog',{name:'Authoring Agent',exact:true});
      await authoringSheet.getByText(/Create and activate an agent with Draft Authoring/).waitFor();
      await page.screenshot({path:join(directory,'v1b-authoring-phone.png'),animations:'disabled'});
      await authoringSheet.getByRole('button',{name:'Close',exact:true}).click();
      assert.equal(await authoringToggle.evaluate(el=>el===document.activeElement),true);
      await button('Assembly / Selection').click();
      const assemblySheet=page.getByRole('dialog',{name:'Assembly / Selection',exact:true});
      await assemblySheet.getByRole('heading',{name:'Delegation',exact:true}).waitFor();
      await page.screenshot({path:join(directory,'v1b-selection-phone.png'),animations:'disabled'});
      await assemblySheet.getByRole('button',{name:'Close',exact:true}).click();
      await page.setViewportSize({width:1531,height:668});
      await library.waitFor();
      await openNodes();
      await layer('A1 Fixture Agent').click();
      await renameAgent('A1 Fixture Agent','Quellight · delegation fixture');
      await openAgentExecution();
      await field('canvas-agent-steps').fill('2');
      await clickRequest('Save','save');
      await clickRequest('Activate','activate');
      await clickRequest('Start Session','sessions');
      const parent=await readReference();
      assert.equal(parent.status,'completed');
      assert.equal(parent.outputValidation,'accepted');
      await inspectRuns();
      await openRunDetails('Evidence');
      await page.getByText('tori.output.finding · r1 · accepted',{exact:true}).waitFor();
      const outcome=page.getByRole('region',{name:'Outcome',exact:true});
      await outcome.getByRole('button',{name:/^Open child Run/}).click();
      assert.equal(await page.getByRole('region',{name:'Turn',exact:true}).count(),0);
      await openRunDetails('Provenance');
      await page.getByText(parent.id,{exact:true}).waitFor();
      await page.screenshot({path:join(directory,'a4-child.png'),animations:'disabled'});
      await outcome.getByRole('button',{name:/^Open parent Run/}).click();
      await openRunDetails('Evidence');
      await page.getByText('tori.output.finding · r1 · accepted',{exact:true}).scrollIntoViewIfNeeded();
      await page.screenshot({path:join(directory,'a4-parent.png'),animations:'disabled'});
    }
  }
  const post=async(path,data={})=>{
    const response=await page.request.post(url+'/api/studio/'+path,{headers:{origin:url},data});
    assert.equal(response.status(),200,await response.text());
    return response.json();
  };
  const current=await api();
  const {definition:otherDefinition}=await post('definitions');
  const otherGraph=structuredClone(initialValidGraph);
  otherGraph.nodes.find(node=>node.id==='agent').values.name='Second Active Agent';
  const otherSaved=await post('save',{definition:otherDefinition,graph:otherGraph});
  const otherActive=await post('activate',{definition:otherDefinition,revision:otherSaved.revision});
  await page.reload();
  await task('Sessions').click();
  if(await button('Sessions sidebar').getAttribute('aria-expanded')!=='true')await button('Sessions sidebar').click();
  await button('New Session').click();
  const picker=page.getByRole('region',{name:'Choose an agent'});
  await picker.getByRole('button',{name:'Second Active Agent',exact:true}).click();
  const created=await clickRequest('Start Session with Second Active Agent · r1 · Fixture','sessions');
  assert.equal(created.sessions[0].activation,otherActive.activation.version);
  assert.equal(created.sessions[0].definition,otherDefinition);
  assert.equal(created.sessions[0].title,'New Session');
  assert.equal(created.sessions[0].lastActivityAt,created.sessions[0].created);
  assert.equal(created.definition,current.definition);
  await expectSessionIdentity('New Session','Second Active Agent · r1 · Fixture');

  await button('New Session').click();
  await picker.locator('[data-agent-revisions="'+current.definition+'"]').click();
  const historical=await clickRequest('Start Session with A1 Fixture Agent · r1 · Fixture','sessions');
  assert.equal(historical.sessions[0].activation,old.activation);
  assert.equal(historical.activation.version,current.activation.version);
  await expectSessionIdentity('New Session','A1 Fixture Agent · r1 · Fixture');
  const mismatched=await page.request.post(url+'/api/studio/sessions',{headers:{origin:url},
    data:{activation:old.activation,sessionDefinition:otherDefinition}});
  assert.equal(mismatched.status(),409);
  assert.equal((await api()).sessions[0].id,historical.sessions[0].id);

  await page.setViewportSize({width:390,height:844});
  for(const view of ['Sessions','Runs']){
    await task(view).click();
    const sidebar=button(view+' sidebar');
    assert.equal(await sidebar.getAttribute('aria-expanded'),'false');
    await page.getByRole('menuitem',{name:'Window',exact:true}).click();
    const command=page.getByRole('menuitemcheckbox',{name:view+' sidebar',exact:true});
    assert.equal(await command.getAttribute('aria-checked'),'false');
    await command.click();
    const drawer=page.getByRole('dialog',{name:view,exact:true});
    await drawer.waitFor();
    assert.equal(await sidebar.getAttribute('aria-expanded'),'true');
    await drawer.getByRole('button',{name:'Close',exact:true}).click();
    assert.equal(await sidebar.getAttribute('aria-expanded'),'false');
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({mode:'deterministic fixture only',requests:await readCapture(),
    invalidDrafts:['63','64.5','32769'],restartIsolation:true,sessionTitles:true,activeAgentPicker:true,evidenceDirectory:directory}));
} catch(error) {
  console.error(log);
  throw error;
} finally {
  await browser?.close();
  await stop();
}
