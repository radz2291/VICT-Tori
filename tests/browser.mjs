import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.TORI_PLAYWRIGHT_MODULE??'playwright');
const url=process.env.TORI_BROWSER_URL??'http://127.0.0.1:48761';
const out='.local/v1a-browser';
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1531,height:668}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const button=(label)=>page.getByRole('button',{name:label,exact:true});
const field=(id)=>page.locator('#'+id);
const sidebar=page.getByRole('complementary',{name:'Assembly / Selection'});
const task=name=>page.getByRole('navigation',{name:'Studio tasks'}).getByRole('button',{name,exact:true});
const chooseView=name=>button(name).click();
async function menu(action,name){await button(action).click();await page.getByRole('menuitem',{name,exact:true}).click();}
const fit=()=>menu('Canvas view','Fit to view');
const saved=()=>page.getByText(/^Saved r1 · (?:No active revision|Active r1)$/).waitFor();
async function travel(action){
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await page.getByRole('menuitem',{name:action,exact:true}).click();
}
const expectEdges=(ids)=>page.waitForFunction(expected=>{
  const actual=[...new Set([...document.querySelectorAll('.svelte-flow__edge[data-id]')].map(edge=>edge.getAttribute('data-id')))].sort();
  return JSON.stringify(actual)===JSON.stringify(expected);
},ids,{timeout:5000});
const assertFit=()=>page.evaluate(()=>{
  const nav=document.querySelector('.tasks').getBoundingClientRect();
  const work=document.querySelector('main').getBoundingClientRect();
  return nav.bottom<=innerHeight+1 && work.bottom<=nav.top+1 && document.documentElement.scrollWidth<=innerWidth+1;
});
async function screenshot(name){await page.screenshot({path:out+'/'+name+'.png',animations:'disabled'});}
async function api(){return await (await page.request.get(url+'/api/studio')).json();}
try {
  await page.goto(url,{timeout:90000});
  await chooseView('Canvas');
  await button('Add Agent').click({timeout:60000});
  await menu('Actions for Untitled agent','Rename agent');
  await field('canvas-agent-label').fill('Research Assistant');
  await button('Apply').click();
  await field('canvas-agent-instructions').fill('Help structure synthetic research. Follow brief response formatting instructions and recall earlier turns.');
  await menu('Actions for Research Assistant','Create and connect: System prompt');
  const sourceText='Help structure synthetic research. Reply concisely and remember previous turns.';
  await field('canvas-system-prompt').fill(sourceText);
  await page.locator('.svelte-flow__node[data-id="agent"]').click({position:{x:55,y:22}});
  assert.equal(await page.locator('.svelte-flow__node.selected[data-id="agent"]').count(),1);
  await chooseView('Configure');
  assert.equal(await field('settings-agent-name').inputValue(),'Research Assistant');
  assert.equal(await field('settings-agent-text').inputValue(),sourceText);
  await chooseView('Canvas');
  await page.locator('.svelte-flow__pane').click({position:{x:10,y:10}});
  assert.equal(await page.locator('.svelte-flow__node.selected').count(),0);
  await menu('Canvas view','Add model');
  await field('canvas-model').selectOption('glm-5.3-flash');
  await fit();
  const source=await page.locator('[data-id="instructions"] .svelte-flow__handle').boundingBox();
  const target=await page.locator('[data-id="agent"] .svelte-flow__handle[data-handleid="model"]').boundingBox();
  assert.ok(source && target);
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);
  await page.mouse.down();
  await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:14});
  await page.mouse.up();
  await page.locator('.canvas-status [role="alert"]').waitFor();
  console.log('invalid edge',await page.locator('.canvas-status [role="alert"]').innerText());
  await expectEdges(['instructions-to-instructions']);
  await menu('Actions for Model Reference','Connect to Model');
  await expectEdges(['instructions-to-instructions','model-to-model']);
  await travel('Undo');
  await expectEdges(['instructions-to-instructions']);
  await travel('Redo');
  await expectEdges(['instructions-to-instructions','model-to-model']);
  await fit();
  assert.equal(await assertFit(),true);
  await screenshot('assembly-1531');
  const stageWidth=(await page.locator('.stage').boundingBox()).width;
  await button('Assembly / Selection').click();
  assert.ok((await page.locator('.stage').boundingBox()).width>stageWidth);
  await page.locator('.svelte-flow__node[data-id="agent"]').click({position:{x:55,y:22}});
  assert.equal(await sidebar.count(),0);
  await button('Assembly / Selection').click();
  await page.setViewportSize({width:1728,height:960});
  await fit();
  assert.equal(await assertFit(),true);
  await screenshot('assembly-1728');
  await page.setViewportSize({width:1531,height:668});
  await button('Save').click();
  await saved();
  await page.reload({timeout:90000});
  await chooseView('Canvas');
  await page.getByRole('menuitem',{name:'View',exact:true}).click();
  await page.getByRole('menuitem',{name:'Show all hidden nodes',exact:true}).click();
  await expectEdges(['instructions-to-instructions','model-to-model']);
  await field('canvas-model-output-limit').waitFor({timeout:30000});
  const originalTokens=await field('canvas-model-output-limit').inputValue();
  await field('canvas-model-output-limit').fill('2048');
  await page.getByText('Unsaved changes · Saved r1 · No active revision',{exact:true}).waitFor();
  await travel('Undo');
  await saved();
  assert.equal(await field('canvas-model-output-limit').inputValue(),originalTokens);
  assert.equal(await button('Save').count(),0);
  await button('Activate r1').click();
  await button('Start Session').click({timeout:30000});
  await page.waitForFunction(()=>document.getElementById('selected-session-identity')?.textContent.includes('New Session · Research Assistant · r1'));
  await screenshot('session-1531');
  let data=await api();
  const sessionId=data.sessions[0].id;
  assert.equal(data.sessions[0].number,1);
  if(process.env.TORI_BROWSER_LIVE==='1'){
    assert.equal(data.provider,true);
    for(const input of [
      'Our synthetic project is called Tern Observatory. Acknowledge the name in one short sentence.',
      'What was the project name I gave you? Reply with just the name.',
    ]){
      if(input.startsWith('What was'))await page.setViewportSize({width:390,height:844});
      const composer=page.getByRole('textbox',{name:'Message'});
      await composer.fill(input);
      const terminal=page.waitForResponse(r=>r.url().endsWith('/api/studio/turn'),{timeout:120000});
      await composer.press('Enter');
      const response=await terminal;
      data=await response.json();
      assert.equal(response.status(),200,JSON.stringify(data));
      const run=data.runs[0];
      console.log('turn',JSON.stringify({status:run.status,route:run.route,model:run.observedModel,usage:run.usage,events:run.events,error:run.errorCode}));
      assert.equal(run.session,sessionId);
      if(run.status!=='completed')break;
    }
    await page.setViewportSize({width:1531,height:668});
    await button('Inspect runs').click();
    await page.getByRole('heading',{name:'Timeline'}).waitFor();
    await screenshot('run-1531');
    if(data.runs.length===2 && data.runs.every(r=>r.status==='completed')){
      assert.match(data.sessions[0].messages.at(-1).text,/Tern Observatory/i);
      console.log('live follow-up verified');
    }
    await button('Open turn').click();
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await assertFit(),true);
  await screenshot('session-390');
  await task('Agents').click();
  await button('Assembly / Selection').click();
  await page.getByRole('dialog').waitFor();
  await screenshot('inspector-390');
  await page.getByRole('dialog').getByRole('button',{name:/^Close/}).click();
  assert.equal(await assertFit(),true);
  await screenshot('assembly-390');
  await page.reload();
  await saved();
  assert.equal((await api()).sessions[0].id,sessionId);
  assert.deepEqual(errors,[]);
  console.log('Desktop 1531×668 and phone 390×844: Assembly, selection, save/reload, activation and Session passed.');
}finally{await browser.close();}
