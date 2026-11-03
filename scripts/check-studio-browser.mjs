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
  page.on('pageerror', error => errors.push(error.message));
  if (importUrl) {
    await page.goto(importUrl);
    await page.getByText('VICT public imports loaded (19)').waitFor();
  }
  await page.goto(studioUrl);
  await mkdir('test-results', { recursive: true });
  const button = name => page.getByRole('button', { name, exact: true });
  const inspector = page.getByLabel('Agent instructions', { exact: true });
  const inline = page.getByLabel('Node instructions', { exact: true });
  const commit = async (field, value) => {
    await field.fill(value);
    await field.press('Tab');
  };
  await page.getByRole('heading', { name: 'Start with an agent' }).waitFor();
  await page.screenshot({ path: 'test-results/studio-r1-first-open.png' });
  await button('Add agent').click();
  await inline.waitFor();
  await page.locator('[data-graph-node] .node.active').waitFor();
  await inline.waitFor();
  await commit(page.getByLabel('Agent name'), 'Research assistant');
  await commit(inspector, 'Inspect the draft.');
  assert.equal(await inline.inputValue(), 'Inspect the draft.');
  await commit(inline, 'Review the draft.');
  assert.equal(await inspector.inputValue(), 'Review the draft.');
  await button('Undo').click();
  assert.equal(await inspector.inputValue(), 'Inspect the draft.');
  await button('Redo').click();
  assert.equal(await inspector.inputValue(), 'Review the draft.');
  await button('Hide inspector').click();
  await inspector.waitFor({ state: 'hidden' });
  await page.locator('[data-graph-node]').click({ position: { x: 85, y: 20 } });
  await page.locator('[data-graph-node].selected').waitFor();
  assert.equal(await inspector.isVisible(), false);
  await button('Show inspector').click();
  await inspector.waitFor();
  await button('Save draft').click();
  await page.getByText('Draft saved locally').waitFor();
  await page.reload();
  await inline.waitFor();
  assert.equal(await inspector.inputValue(), 'Review the draft.');
  assert.equal(await inline.inputValue(), 'Review the draft.');
  await button('Reopen saved draft').click();
  await page.getByText('Saved draft reopened').waitFor();
  assert.equal(await page.getByLabel('Agent name').inputValue(), 'Research assistant');
  await button('Session').click();
  await page.getByText(/Simulated execution/).waitFor();
  await button('Definition').click();
  assert.equal(await inline.inputValue(), 'Review the draft.');
  assert.deepEqual(errors, []);
  await page.locator('[data-graph-node]').click({ position: { x: 85, y: 20 } });
  await page.locator('[data-graph-node] .node.active').waitFor();
  await page.screenshot({ path: 'test-results/studio-r1-selected.png' });
  console.log('Browser check passed for installed imports, inline/inspector edits, Undo/Redo, Save/reload and navigation.');
} finally {
  await browser?.close();
  for (const server of servers) server.kill();
}
