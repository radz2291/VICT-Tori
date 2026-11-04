import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';

const [playwrightEntry, chrome, studioUrl, importUrl, studioDirectory, importDirectory] = process.argv.slice(2);
const { chromium } = await import(pathToFileURL(playwrightEntry));
const servers = [];
async function serve(url, directory, args) {
  if (!directory) return;
  servers.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...args,
    '--host', '127.0.0.1', '--port', new URL(url).port, '--strictPort'], {
    cwd: directory, stdio: 'inherit', windowsHide: true
  }));
  for (let attempt = 0; attempt < 90; attempt++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await setTimeout(1000);
  }
  throw new Error(`Vite did not start at ${url}`);
}
let browser;
try {
  await serve(importUrl, importDirectory, ['preview']);
  await serve(studioUrl, studioDirectory, []);
  browser = await chromium.launch({ executablePath: chrome });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error); });
  if (importUrl) {
    await page.goto(importUrl);
    await page.getByText('VICT public imports loaded (19)').waitFor();
  }
  await page.goto(studioUrl);
  await mkdir('test-results', { recursive: true });
  const button = name => page.getByRole('button', { name, exact: true });
  const inspector = page.getByLabel('Agent instructions', { exact: true });
  const inline = page.getByLabel('Node instructions', { exact: true });
  const expectValue = async (field, value) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await field.inputValue() === value) return;
      await setTimeout(50);
    }
    assert.equal(await field.inputValue(), value);
  };
  const commit = async (field, value) => {
    await field.click();
    await field.fill(value);
    await page.getByRole('heading', { name: 'Agents', exact: true }).click();
  };
  await page.getByRole('heading', { name: 'Start with an agent' }).waitFor();
  await page.screenshot({ path: 'test-results/studio-r1-first-open.png' });
  await button('Add agent').click();
  await inline.waitFor();
  await page.locator('[data-graph-node] .node.active').waitFor();
  await inline.waitFor();
  await commit(page.getByLabel('Agent name'), 'Research assistant');
  await commit(inspector, 'Inspect the draft.');
  await expectValue(inline, 'Inspect the draft.');

  await commit(inline, 'Review the draft.');
  await expectValue(inspector, 'Review the draft.');
  await button('Undo').click();
  await expectValue(inspector, 'Inspect the draft.');
  await button('Redo').click();
  await expectValue(inspector, 'Review the draft.');
  await button('Inspector').click();
  await inspector.waitFor({ state: 'hidden' });
  await page.locator('[data-graph-node]').click({ position: { x: 85, y: 20 } });
  await page.locator('[data-graph-node].selected').waitFor();
  assert.equal(await inspector.isVisible(), false);
  await button('Inspector').click();
  await inspector.waitFor();
  await button('Save draft').click();
  await page.getByText('Draft saved locally').waitFor();
  await page.reload();
  await inline.waitFor();
  await expectValue(inspector, 'Review the draft.');
  await expectValue(inline, 'Review the draft.');
  await button('Reopen saved draft').click();
  await page.getByText('Saved draft reopened').waitFor();
  assert.equal(await page.getByLabel('Agent name').inputValue(), 'Research assistant');
  await button('Session').click();
  await page.getByText(/Simulated execution/).waitFor();
  await button('Definition').click();
  await expectValue(inline, 'Review the draft.');
  assert.deepEqual(errors, []);
  await page.locator('[data-graph-node]').click({ position: { x: 85, y: 20 } });
  await page.locator('[data-graph-node] .node.active').waitFor();
  await page.screenshot({ path: 'test-results/studio-r1-selected.png' });
  await page.keyboard.press('Escape');
  await page.locator('[data-graph-node] .node.active').waitFor({ state: 'hidden' });
  await page.locator('[data-graph-node]').click({ position: { x: 85, y: 20 } });
  await page.locator('[data-graph-node] .node.active').waitFor();
  await page.locator('.svelte-flow__pane').click({ position: { x: 160, y: 100 } });
  await page.locator('[data-graph-node] .node.active').waitFor({ state: 'hidden' });
  await button('Fit view').click();
  await inline.waitFor();
  await button('Find agent').press('Enter');
  const agentChoice = page.getByRole('menuitemradio', { name: 'Research assistant' });
  await agentChoice.waitFor();
  await agentChoice.press('Enter');
  await button('Find agent').press('Enter');
  await agentChoice.waitFor();
  assert.equal(await agentChoice.getAttribute('aria-checked'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await button('Find agent').evaluate(el => el === document.activeElement), true);
  const keyboardContext = await browser.newContext({ viewport: { width: 640, height: 800 }, reducedMotion: 'reduce' });
  const keyboard = await keyboardContext.newPage();
  await keyboard.goto(studioUrl);
  const press = async name => {
    const target = keyboard.getByRole('button', { name, exact: true });
    for (let attempt = 0; attempt < 45; attempt++) {
      if (await target.evaluate(element => element === document.activeElement)) {
        await keyboard.keyboard.press('Enter');
        return;
      }
      await keyboard.keyboard.press('Tab');
    }
    throw new Error(`Could not tab to ${name}`);
  };
  await press('Add agent');
  await keyboard.locator('input:focus').waitFor();
  await keyboard.keyboard.press('ControlOrMeta+A');
  await keyboard.keyboard.type('Keyboard agent');
  await keyboard.keyboard.press('Tab');
  await keyboard.keyboard.type('Work from the brief.');
  await keyboard.keyboard.press('Tab');
  await press('Undo');
  const instructions = keyboard.getByLabel('Agent instructions', { exact: true });
  await expectValue(instructions, '');
  await press('Redo');
  await expectValue(instructions, 'Work from the brief.');
  await press('Inspector');
  const inspectorToggle = keyboard.getByRole('button', { name: 'Inspector', exact: true });
  assert.equal(await inspectorToggle.evaluate(el => el === document.activeElement), true);
  assert.equal(await inspectorToggle.getAttribute('aria-pressed'), 'false');
  await press('Inspector');
  assert.equal(await inspectorToggle.getAttribute('aria-pressed'), 'true');
  await press('Save draft');
  await keyboard.getByText('Draft saved locally').waitFor();
  await press('Reopen saved draft');
  await expectValue(keyboard.getByLabel('Agent name'), 'Keyboard agent');

  const otherTab = await keyboard.context().newPage();
  await otherTab.goto(studioUrl);
  await otherTab.getByLabel('Agent name').fill('Changed in another tab');
  await otherTab.getByRole('heading', { name: 'Agents', exact: true }).click();
  await otherTab.getByRole('button', { name: 'Save draft' }).click();
  await otherTab.getByText('Draft saved locally').waitFor();
  await press('Save draft');
  await keyboard.getByText(/Another tab changed the saved draft/).waitFor();
  await expectValue(keyboard.getByLabel('Agent name'), 'Keyboard agent');
  const download = keyboard.waitForEvent('download');
  await press('Download draft');
  assert.equal((await download).suggestedFilename(), 'tori-draft.json');
  await press('Reopen saved draft');
  await expectValue(keyboard.getByLabel('Agent name'), 'Changed in another tab');
  await keyboard.getByText(/Another tab changed the saved draft/).waitFor({ state: 'hidden' });
  await page.goto(new URL('?preview=workflow', studioUrl).href);
  await button('Add node').click();
  await page.getByLabel('Node', { exact: true }).selectOption('run-agent');
  await button('Add node').click();
  await page.getByLabel('Output', { exact: true }).selectOption({ label: 'Request · Brief' });
  await page.getByLabel('Input', { exact: true }).selectOption({ label: 'Run agent · Brief' });
  await button('Connect').click();
  await page.locator('.svelte-flow__edge').waitFor();
  await button('Undo').click();
  await page.locator('.svelte-flow__edge').waitFor({ state: 'detached' });
  await button('Redo').click();
  await page.locator('.svelte-flow__edge').waitFor();
  await page.getByLabel('Output', { exact: true }).selectOption({ label: 'Run agent · Proposal' });
  await button('Connect').click();
  await page.getByRole('alert').waitFor();
  await page.locator('.svelte-flow__edge').waitFor();
  assert.equal(await page.locator('.svelte-flow__edge').count(), 1);
  console.log('Pointer and keyboard authoring, history, Save/reopen and save conflict recovery passed.');
} finally {
  await browser?.close();
  for (const server of servers) server.kill();
}
