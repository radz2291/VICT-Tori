import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const [entry, chrome, url] = process.argv.slice(2);
const { chromium } = await import(pathToFileURL(entry));
const browser = await chromium.launch({ executablePath: chrome });
try {
  const page = await browser.newPage({ viewport: { width: 1531, height: 668 } });
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const button = name => page.getByRole('button', { name, exact: true });
  const node = label => page.locator('.authoring-page:visible .svelte-flow__node').and(page.getByRole('group', { name: label, exact: true }));
  const canvas = () => page.locator('.authoring-page:visible .graph-viewport');
  const waitSelected = async (label) => {
    await node(label).and(page.locator('.selected')).waitFor();
  };
  async function boundary() {
    const graph = await canvas().boundingBox();
    const nav = await page.getByRole('navigation', { name: 'Studio views' }).boundingBox();
    assert.ok(graph.height >= 180 && graph.y + graph.height <= nav.y + 1, JSON.stringify({ graph, nav }));
  }
  async function menu(name, item) {
    await page.getByRole('menuitem', { name, exact: true }).click();
    await page.getByRole('menuitem', { name: item, exact: true }).click();
  }
  async function blank() {
    const point = await canvas().evaluate(element => {
      const bounds = element.getBoundingClientRect();
      for (let y = bounds.top + 20; y < bounds.bottom - 15; y += 18) {
        for (let x = bounds.left + 12; x < bounds.right - 12; x += 18) {
          if (document.elementFromPoint(x, y)?.matches('.svelte-flow__pane')) return { x, y };
        }
      }
      throw new Error('No clear canvas point visible');
    });
    await page.mouse.click(point.x, point.y);
    await page.locator('.authoring-page:visible .svelte-flow__node.selected').waitFor({ state: 'hidden' });
  }

  await page.goto(url);
  await button('Add agent').click();
  await page.getByLabel('Agent name').fill('Review assistant');
  await page.getByLabel('Agent instructions', { exact: true }).fill('Summarize the synthetic brief.');
  await button('Save draft').click();
  await button('Library').click();
  await button('Review assistant').click();
  await waitSelected('Review assistant');
  assert.equal(await button('Review assistant').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByLabel('Agent name').inputValue(), 'Review assistant');
  await boundary();
  await blank();
  assert.equal(await button('Review assistant').getAttribute('aria-pressed'), 'false');
  assert.ok(await button('Delete selected object').isDisabled());
  await node('Review assistant').locator('strong').click();
  assert.equal(await button('Review assistant').getAttribute('aria-pressed'), 'true');
  await button('Start simulated run').click();
  await page.getByLabel('Run input').fill('Inspect the test brief.');
  await button('Create simulated run').click();
  await button('Request accepted by U0 adapter').click();
  await page.getByText('Inspect the test brief.', { exact: false }).waitFor();
  await button('Completed simulation').click();
  await page.getByText('Synthetic result is ready.', { exact: true }).waitFor();
  const runIdentity = await page.getByText(/^Run ID /).textContent();
  await button('Open linked session').click();
  const sessionIdentity = await page.getByText(/^Session ID /).textContent();
  await page.getByLabel('Message', { exact: true }).fill('Check the source.');
  await page.getByLabel('Simulation outcome').click();
  await page.getByRole('option', { name: 'Tool failure', exact: true }).click();
  await button('Send simulated message').click();
  await page.getByText('The sample tool returned FIXTURE_TOOL_ERROR.').waitFor();
  await button('Inspect simulated run').last().click();
  await button('Synthetic tool error').click();
  await page.getByText('The sample tool returned FIXTURE_TOOL_ERROR.').waitFor();
  await button('Open definition').click();
  await waitSelected('Review assistant');
  await page.reload();
  assert.equal(await page.getByLabel('Agent instructions', { exact: true }).inputValue(), 'Summarize the synthetic brief.');
  await button('Runs').click();
  await page.getByRole('button', { name: /Review assistant · succeeded/ }).click();
  assert.equal(await page.getByText(/^Run ID /).textContent(), runIdentity);
  await button('Open linked session').click();
  assert.equal(await page.getByText(/^Session ID /).textContent(), sessionIdentity);
  await page.getByText('Check the source.').waitFor();

  await menu('File', 'Studio settings');
  await page.getByLabel('Name', { exact: true }).fill('Synthetic provider');
  await page.getByLabel('Synthetic configuration notes').fill('Local fixture');
  await button('Save configuration').click();
  await button('Simulate availability check').click();
  await page.getByText('Simulated availability check: no external connection was attempted.').waitFor();
  await button('Close settings').click();
  await page.reload();
  await menu('File', 'Studio settings');
  await page.getByRole('button', { name: /Synthetic provider.*Provider/ }).click();
  assert.equal(await page.getByLabel('Synthetic configuration notes').inputValue(), 'Local fixture');
  await button('Close settings').click();

  await menu('File', 'Import graph draft');
  await page.getByLabel('Graph JSON file').setInputFiles({
    name: 'corrupt.json', mimeType: 'application/json', buffer: Buffer.from('{broken'),
  });
  await button('Import into draft').click();
  await page.getByText('This file is not a valid VICT Flow v3 graph. The current draft was retained.').waitFor();
  await button('Cancel').click();
  assert.equal(await page.getByLabel('Agent name').inputValue(), 'Review assistant');

  await button('Workflows').click();
  await button('Add node').click();
  await button('Library').click();
  await button('Request').click();
  await waitSelected('Request');
  await boundary();
  await blank();
  assert.equal(await button('Request').getAttribute('aria-pressed'), 'false');
  await button('Creative').click();
  await button('Library').click();
  await button('Biological').click();
  await waitSelected('Biological');
  await boundary();
  await menu('Insert', 'Branch selected direction');
  await node('Biological variation').waitFor();
  await button('Undo').click();
  await node('Biological variation').waitFor({ state: 'hidden' });
  await button('Redo').click();
  await node('Biological variation').waitFor();

  await menu('File', 'Open sample project');
  await page.waitForURL('**/?project=samples');
  await menu('Insert', 'Add Quellight workspace fixture');
  await waitSelected('Quellight workspace');
  await page.getByLabel('Tool', { exact: true }).getByText('Browser tool').waitFor();
  await page.getByLabel('Delegated specialist', { exact: true }).getByText('Research Specialist').waitFor();
  await button('Show agent bindings').click();
  await page.getByLabel('Node Tool', { exact: true }).getByText('Browser tool').waitFor();
  await button('Hide agent bindings').click();
  await page.getByLabel('Tool', { exact: true }).getByText('Browser tool').waitFor();
  await button('Show resource relationships').click();
  const projection = page.getByRole('region', { name: 'Agent relationship projection' });
  await projection.getByRole('term').filter({ hasText: 'Specialist delegation' }).waitFor();
  await projection.locator('.svelte-flow__edge').nth(3).waitFor();
  assert.equal(await projection.locator('.svelte-flow__edge').count(), 4);
  await button('Hide resource relationships').click();
  await projection.waitFor({ state: 'hidden' });
  await page.getByLabel('Tool', { exact: true }).getByText('Browser tool').waitFor();
  await button('Save draft').click();
  await menu('File', 'Reset sample project');
  await button('Reset samples').click();
  await button('Add agent').waitFor();
  assert.equal(await page.locator('.authoring-page:visible .svelte-flow__node').count(), 0);
  await menu('File', 'Open Studio project');
  await page.waitForURL(new URL(url).href);
  assert.equal(await page.getByLabel('Agent name').inputValue(), 'Review assistant');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const [view, label] of [['Agents', 'Review assistant'], ['Workflows', 'Request'], ['Creative', 'Metallic']]) {
    await button(view).click();
    await boundary();
    if (view === 'Workflows' && !(await button('Library').count())) await button('Add node').click();
    await button('Library').click();
    await button(label).click();
    await waitSelected(label);
    await boundary();
    await blank();
  }
  assert.deepEqual(errors, []);
  console.log('PASS 1531×668 and 390×844 selection, document commands, canvas bounds and linked simulation reload');
} finally {
  await browser.close();
}
