import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const [entry, chrome, url] = process.argv.slice(2);
const { chromium } = await import(pathToFileURL(entry));
const browser = await chromium.launch({ executablePath: chrome });
const page = await browser.newPage({ viewport: { width: 1531, height: 668 } });
page.setDefaultTimeout(7000);
const error = [];
page.on('pageerror', e => error.push(String(e)));
const button = name => page.getByRole('button', { name, exact: true });
const canvas = page.getByRole('application', { name: 'Workflow canvas' });
const dialog = page.getByRole('dialog');
async function select(scope, label, option) {
  await scope.getByLabel(label, { exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
try {
  await page.goto(new URL('?preview=workflow', url).href);
  await button('Workflow examples').click();
  await dialog.getByRole('button', { name: 'Insert example', exact: true }).click();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await canvas.getByText('Route recommendation', { exact: true }).waitFor();
  assert.equal(await canvas.locator('.svelte-flow__edge').count(), 4);
  await button('Validate workflow').click();
  await dialog.getByText(/needs an available agent reference/).waitFor();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await button('Save draft').click();
  await page.reload();
  await canvas.getByText('Route recommendation', { exact: true }).waitFor();
  assert.equal(await canvas.locator('.svelte-flow__edge').count(), 4);
  await button('Workflow examples').click();
  await select(dialog, 'Workflow example', 'Research workflow');
  await dialog.getByRole('button', { name: 'Insert example', exact: true }).click();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  assert.equal(await canvas.locator('.svelte-flow__edge').count(), 10);
  await button('Undo').click();
  assert.equal(await canvas.locator('.svelte-flow__edge').count(), 4);
  await button('Redo').click();
  assert.equal(await canvas.locator('.svelte-flow__edge').count(), 10);
  await button('Library').click();
  const library = page.getByRole('complementary', { name: 'Library' });
  await library.getByRole('button', { name: 'Route research', exact: true }).click();
  await button('Inspector').click();
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await inspector.getByLabel('Simulated match tokens').fill('ready specialist');
  await inspector.getByText(/Exclusive · Primary review/).waitFor();
  await select(inspector, 'Routing strategy', 'Multiple matching branches');
  await inspector.getByText(/Multiple · Primary review and Specialist review/).waitFor();
  await inspector.getByLabel('Simulated match tokens').fill('unmatched');
  await inspector.getByText(/No match · wait for review/).waitFor();
  assert.equal(await canvas.getByLabel('Routing strategy', { exact: true }).filter({ hasText: 'Multiple matching branches' }).count(), 1);
  await library.getByRole('button', { name: 'Route recommendation', exact: true }).click();
  await select(inspector, 'Routing strategy', 'Multiple matching branches');
  await inspector.getByLabel('Simulated match tokens').fill('ready specialist');
  await inspector.getByText(/Unavailable · connect Specialist review/).waitFor();
  assert.deepEqual(error, []);
  console.log('PASS: business and research fixtures insert, typed links render, readiness warns, incomplete draft persists, and sample insertion is one Undo/Redo action, and routing previews cover exclusive, multi-match, no-match and unavailable paths.');
} finally {
  await browser.close();
}
