import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [entry, chrome, url, evidence] = process.argv.slice(2);
const { chromium } = await import(pathToFileURL(entry));
const browser = await chromium.launch({ executablePath: chrome });
const desktop = { width: 1280, height: 800 };
const phone = { width: 390, height: 844 };
try {
  const page = await browser.newPage({ viewport: desktop, hasTouch: true, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const button = name => page.getByRole('button', { name, exact: true });
  const capture = async name => {
    if (!evidence) return;
    await mkdir(evidence, { recursive: true });
    await page.screenshot({ path: evidence + '/' + name + '.jpg', quality: 88 });
  };
  await page.goto(url);
  await button('Add agent').click();
  await page.getByLabel('Agent name').fill('Research assistant');
  await page.getByLabel('Agent instructions', { exact: true }).fill('Summarize the brief and cite the source.');
  await button('Save draft').click();
  await button('Workflows').click();
  await button('Add node').click();
  await page.getByLabel('Node', { exact: true }).click();
  await page.getByRole('option', { name: 'Run agent', exact: true }).click();
  await button('Add node').click();
  await button('Save draft').click();
  await button('Creative').click();
  await page.getByLabel('Metallic notes').fill('Authored direction: brushed titanium and soft light.');
  await button('Save draft').click();
  await page.reload();
  const geometry = [];
  for (const route of ['Agents', 'Workflows', 'Creative']) {
    await page.setViewportSize(desktop);
    await button(route).click();
    await page.getByText('Saved draft reopened', { exact: true }).waitFor();
    await button('Fit view').click();
    const canvas = page.locator('.authoring-page:not([hidden]) .canvas-frame');
    const bounds = await canvas.boundingBox();
    const cards = canvas.locator('[data-tori-node]');
    const ids = await cards.evaluateAll(nodes => nodes.map(node => node.dataset.toriNode));
    const first = await cards.first().boundingBox();
    await capture(route.toLowerCase() + '-desktop');
    // Pan the saved canvas far to the right before narrowing the same live viewport.
    for (let i = 0; i < 2; i++) {
      await page.mouse.move(bounds.x + 16, bounds.y + bounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width - 24, bounds.y + bounds.height / 2, { steps: 12 });
      await page.mouse.up();
    }
    const panned = await cards.first().boundingBox();
    assert.ok(panned.x - first.x > 350, 'Desktop pan should leave the saved canvas outside the phone viewport');
    await page.setViewportSize(phone);
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.authoring-page:not([hidden]) .canvas-frame');
      const area = canvas.getBoundingClientRect();
      return [...canvas.querySelectorAll('[data-tori-node]')].some(card => {
        const box = card.getBoundingClientRect();
        return box.width >= 150 && box.left >= area.left - 2 && box.right <= area.right + 2
          && box.top >= area.top - 2 && box.bottom <= area.bottom + 2;
      });
    });
    assert.deepEqual(await cards.evaluateAll(nodes => nodes.map(node => node.dataset.toriNode)), ids);
    const after = await canvas.boundingBox();
    assert.ok(after.height >= 650, JSON.stringify(after));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), phone.width);
    assert.equal(await page.getByRole('menubar').count(), 0);
    assert.equal(await button('Fit view').isVisible(), true);
    geometry.push({ route, desktopCanvas: bounds.height, phoneCanvas: after.height, phoneCanvasTop: after.y });
    await capture(route.toLowerCase() + '-phone');
    await button('Menu').tap();
    for (const family of ['File', 'Edit', 'View', 'Insert', 'Run', 'Window', 'Help']) {
      await page.getByRole('menuitem', { name: new RegExp('^' + family) }).waitFor();
    }
    if (route === 'Agents') await capture('phone-command-menu');
    await page.getByRole('menuitem', { name: /^View/ }).tap();
    await page.getByRole('menuitem', { name: 'Fit view', exact: true }).tap();
    await page.getByRole('menu').waitFor({ state: 'hidden' });
    if (route === 'Workflows') {
      await button('Connect ports').tap();
      for (const [label, choice] of [['Output', 'Request · Request brief'], ['Input', 'Run agent · Input brief']]) {
        await page.getByLabel(label, { exact: true }).tap();
        await page.getByRole('option', { name: choice, exact: true }).tap();
      }
      await capture('workflow-connect-phone');
      await button('Connect').tap();
      await button('Done').tap();
      await canvas.locator('.svelte-flow__edge').waitFor();
      assert.equal(await button('Connect ports').evaluate(el => el === document.activeElement), true);
    }
  }
  console.log(JSON.stringify({ geometry, errors }));
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
