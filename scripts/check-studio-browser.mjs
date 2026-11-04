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
  await page.getByRole('region', { name: 'Agent graph' }).locator('[data-graph-node]').click({ position: { x: 85, y: 20 } });
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
  await button('Sessions').click();
  await page.getByText(/Simulation only/).waitFor();
  await button('Agents').click();
  await expectValue(inline, 'Review the draft.');
  assert.deepEqual(errors, []);
  await page.getByRole('region', { name: 'Agent graph' }).locator('[data-graph-node]').click({ position: { x: 85, y: 20 } });
  await page.locator('[data-graph-node] .node.active').waitFor();
  await page.screenshot({ path: 'test-results/studio-r1-selected.png' });
  await page.keyboard.press('Escape');
  await page.locator('[data-graph-node] .node.active').waitFor({ state: 'hidden' });
  await page.getByRole('region', { name: 'Agent graph' }).locator('[data-graph-node]').click({ position: { x: 85, y: 20 } });
  await page.locator('[data-graph-node] .node.active').waitFor();
  await page.getByRole('region', { name: 'Agent graph' }).locator('.svelte-flow__pane').click({ position: { x: 160, y: 100 } });
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
  await keyboard.screenshot({ path: 'test-results/studio-control-save-conflict.png' });
  await expectValue(keyboard.getByLabel('Agent name'), 'Keyboard agent');
  const download = keyboard.waitForEvent('download');
  await press('Download draft');
  assert.equal((await download).suggestedFilename(), 'tori-draft.json');
  await press('Reopen saved draft');
  await expectValue(keyboard.getByLabel('Agent name'), 'Changed in another tab');
  await keyboard.getByText(/Another tab changed the saved draft/).waitFor({ state: 'hidden' });
  assert.deepEqual(await page.getByRole('navigation', { name: 'Studio views' }).getByRole('button').allTextContents(),
    ['Agents', 'Workflows', 'Creative', 'Sessions', 'Runs']);
  await button('Workflows').click();
  assert.equal(await button('Workflows').getAttribute('data-button-root'), 'true');
  assert.equal(await button('Reopen saved draft').isDisabled(), true);
  assert.equal(await button('Connect').isDisabled(), true);
  await button('Add node').click();
  const choose = async (label, option) => {
    const trigger = page.getByLabel(label, { exact: true });
    await trigger.press('Enter');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    await page.getByRole('option', { name: option, exact: true }).waitFor();
    if (label === 'Output') await page.screenshot({ path: 'test-results/studio-control-workflow-select.png' });
    await page.getByRole('option', { name: option, exact: true }).click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await trigger.filter({ hasText: option }).waitFor();
  };
  await choose('Node', 'Run agent');
  await button('Add node').click();
  await choose('Agent reference', 'Research assistant');
  await choose('Node', 'Decision');
  await button('Add node').click();
  const workflow = page.getByRole('region', { name: 'Workflow graph' });
  const port = (node, name) => workflow.locator('.svelte-flow__node').filter({ hasText: node }).locator(`[aria-label="${name}"]`);
  const drag = async (source, target) => {
    await source.waitFor();
    await target.waitFor();
    const start = await source.boundingBox();
    const end = await target.boundingBox();
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 18 });
    await page.mouse.up();
  };
  const edge = workflow.locator('.svelte-flow__edge');
  await drag(port('Request', 'output Brief: brief'), port('Decision', 'input Proposal: proposal'));
  assert.equal(await edge.count(), 0);
  await drag(port('Request', 'output Brief: brief'), port('Run agent', 'input Brief: brief'));
  await edge.waitFor();
  await button('Undo').click();
  await edge.waitFor({ state: 'detached' });
  await button('Redo').click();
  await edge.waitFor();
  await button('Save draft').click();
  await page.getByText('Draft saved locally').waitFor();
  await choose('Output', 'Request · Brief');
  await choose('Input', 'Decision · Proposal');
  await button('Connect').click();
  await page.getByRole('alert').waitFor();
  await page.screenshot({ path: 'test-results/studio-r2-workflow-validation.png' });
  await edge.waitFor();
  assert.equal(await edge.count(), 1);
  await button('Undo').click();
  await edge.waitFor({ state: 'detached' });
  await button('Reopen saved draft').click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reopen saved draft' }).click();
  await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
  await edge.waitFor();
  await page.getByText('Saved draft reopened').waitFor();
  await button('Fit view').click();
  await port('Request', 'output Brief: brief').waitFor();
  await setTimeout(300);
  await page.screenshot({ path: 'test-results/studio-r2-workflow-reopened.png' });
  await button('Creative').click();
  await button('Compare directions').click();
  const comparison = page.getByRole('region', { name: 'Direction comparison' });
  assert.deepEqual(await comparison.getByRole('heading').allTextContents(), ['Metallic', 'Biological', 'Architectural']);
  const metallic = page.getByRole('textbox', { name: 'Metallic notes' });
  assert.equal(await metallic.getAttribute('data-slot'), 'textarea');
  await metallic.fill('Brushed titanium and soft light');
  await metallic.press('Tab');
  await comparison.getByText('Brushed titanium and soft light').waitFor();
  await button('Save draft').click();
  await page.getByText('Draft saved locally').waitFor();
  await metallic.fill('Unsaved alternative');
  await metallic.press('Tab');
  await comparison.getByText('Unsaved alternative').waitFor();
  await button('Reopen saved draft').click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reopen saved draft' }).click();
  await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
  await comparison.getByText('Brushed titanium and soft light').waitFor();
  await page.screenshot({ path: 'test-results/studio-r2-creative-comparison.png' });
  await button('Branch Metallic').click();
  const variation = comparison.getByRole('heading', { name: 'Metallic variation' });
  await variation.waitFor();
  await button('Undo').click();
  await variation.waitFor({ state: 'detached' });
  await button('Redo').click();
  await variation.waitFor();
  await button('Save draft').click();
  await page.reload();
  await expectValue(inline, 'Review the draft.');
  await button('Workflows').click();
  await edge.waitFor();
  await page.getByLabel('Agent reference', { exact: true }).filter({ hasText: 'Research assistant' }).waitFor();
  await button('Creative').click();
  await expectValue(metallic, 'Brushed titanium and soft light');
  await button('Compare directions').click();
  await variation.waitFor();
  await button('Runs').click();
  await page.getByRole('heading', { name: 'Execution trace', exact: true }).waitFor();
  await page.locator('.vict-state[data-state="empty"]:visible').waitFor();
  assert.deepEqual(errors, []);
  console.log('Passed Agents pointer/keyboard and conflict recovery, Workflows native port editing/history/reopen, and Creative comparison/reopen.');
} finally {
  await browser?.close();
  for (const server of servers) server.kill();
}
