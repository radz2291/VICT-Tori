import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

const [playwrightEntry, chrome, url, evidence] = process.argv.slice(2);
const { chromium } = await import(pathToFileURL(playwrightEntry));
const browser = await chromium.launch({ executablePath: chrome });
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}, reducedMotion:'reduce'});
 async function capture(name) {
   if (!evidence) return;
   await mkdir(evidence, { recursive: true });
   await page.screenshot({ path: evidence + '/' + name + '.jpg', quality: 88 });
 }
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 const button=name=>page.getByRole('button',{name,exact:true});
 const dock=name=>page.getByRole('complementary',{name,exact:true});
 const windowMenu=()=>page.getByRole('menuitem',{name:'Window',exact:true});
 const panelChoice=name=>page.getByRole('menuitemcheckbox',{name,exact:true});
 await page.goto(url);
 await button('Add agent').click();
 await dock('Inspector').waitFor();
 await button('Save draft').click();
 await button('Inspector').click();
 await dock('Inspector').waitFor({state:'hidden'});
 await windowMenu().click();
 assert.equal(await panelChoice('Inspector').getAttribute('aria-checked'),'false');
 await panelChoice('Library').click();
 await dock('Library').waitFor();
 assert.equal(await button('Library').getAttribute('aria-pressed'),'true');
 assert.equal(await button('Library').locator('svg').count(),1);
 const agentSlider=page.getByRole('slider',{name:'Library width'});
 await agentSlider.press('ArrowRight');
 const width=await agentSlider.getAttribute('aria-valuenow');
 assert.equal(width,'224');
 await page.reload();
 await dock('Library').waitFor();
 assert.equal(await agentSlider.getAttribute('aria-valuenow'),width);
 assert.equal(Math.round((await dock('Library').boundingBox()).width),224);
 assert.equal(await dock('Inspector').count(),0);

 await button('Workflows').click();
 assert.equal(await button('Library').count(),0);
 await button('Add node').click();
 await button('Save draft').click();
 await button('Library').click();
 await dock('Library').getByRole('button',{name:'Request',exact:true}).click();
 await button('Inspector').click();
 const stepWidth=page.getByRole('slider',{name:'Inspector width'});
 await stepWidth.press('ArrowRight');
 assert.equal(await stepWidth.getAttribute('aria-valuenow'),'268');
 await page.reload();
 await button('Workflows').click();
 await dock('Inspector').getByText('Request',{exact:true}).first().waitFor();
 assert.equal(await stepWidth.getAttribute('aria-valuenow'),'268');

 await button('Creative').click();
 await button('Library').click();
 await dock('Library').getByRole('button',{name:'Metallic',exact:true}).click();
 await button('Inspector').click();
 await dock('Inspector').getByText('Metallic',{exact:true}).waitFor();
 assert.equal(await stepWidth.getAttribute('aria-valuenow'),'264');
 await capture('creative-desktop');

 for(const pageName of ['Sessions','Runs']) {
   await button(pageName).click();
   assert.equal(await page.getByRole('group',{name:'Workspace panels'}).count(),0);
   await windowMenu().press('ArrowDown');
   assert.equal(await page.getByRole('menuitem',{name:'No panels available in this workspace'}).getAttribute('aria-disabled'),'true');
   await page.keyboard.press('Escape');
 }
 await button('Agents').click();
 await windowMenu().click();
 await page.getByRole('menuitem',{name:'Reset layout'}).click();
 await dock('Inspector').waitFor();
 assert.equal(await dock('Library').count(),0);
 await page.setViewportSize({width:390,height:844});
 await button('Inspector').click();
 const dialog=page.getByRole('dialog',{name:'Inspector'});
 await dialog.waitFor();
 assert.equal(await dialog.getByRole('slider').count(),0);
 await capture('agents-phone');
 await page.reload();
 await dialog.waitFor();
 await page.keyboard.press('Escape');
 await dialog.waitFor({state:'hidden'});
 assert.equal(await button('Inspector').evaluate(el=>document.activeElement===el),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
 assert.deepEqual(errors,[]);
 console.log('PASS: contextual docks, Window parity, desktop visibility/size/selection reload, independent page sizes, reset, and phone dialog reload/focus.');
} finally { await browser.close(); }
