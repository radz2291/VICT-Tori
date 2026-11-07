import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const [entry, chrome, url, output] = process.argv.slice(2);
const { chromium } = await import(pathToFileURL(entry));
const browser = await chromium.launch({ executablePath: chrome });
const results = { surfaces: [], menus: [], contrast: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => results.errors.push(error.message));
  const button = name => page.getByRole('button', { name, exact: true });
  const menu = name => page.getByRole('menuitem', { name, exact: true });
  const capture = async name => {
    await mkdir(output, { recursive: true });
    await page.screenshot({ path: output + '/' + name + '.jpg', quality: 88 });
  };
  await page.goto(url);
  await button('Add agent').click();
  await page.getByLabel('Agent instructions', { exact: true }).fill('Synthetic audit agent instructions.');
  await page.getByLabel('Agent instructions', { exact: true }).press('Tab');
  await button('Save draft').click();
  for (const name of ['File', 'Edit', 'View', 'Insert', 'Run', 'Window', 'Help']) {
    await menu(name).focus();
    await menu(name).press('ArrowDown');
    const items = await page.getByRole('menu').getByRole('menuitem').allTextContents();
    results.menus.push({ name, items });
    await page.keyboard.press('Escape');
    assert.equal(await menu(name).evaluate(element => element === document.activeElement), true);
  }
  await page.getByLabel('Agent name').fill('Unsaved audit name');
  await button('Reopen saved draft').click();
  await page.getByRole('alertdialog').waitFor();
  await capture('reopen-dialog');
  await page.keyboard.press('Escape');
  await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
  assert.equal(await button('Reopen saved draft').evaluate(element => element === document.activeElement), true);
  for (const route of ['Agents', 'Workflows', 'Creative', 'Sessions', 'Runs']) {
    await button(route).click();
    if (route === 'Workflows') {
      await button('Add node').click();
      await page.getByLabel('Node', { exact: true }).click();
      await page.getByRole('option', { name: 'Run agent', exact: true }).click();
      await button('Add node').click();
      for (const [label, option] of [['Output', 'Request · Brief'], ['Input', 'Run agent · Brief']]) {
        await page.getByLabel(label, { exact: true }).click();
        await page.getByRole('option', { name: option, exact: true }).click();
      }
      await button('Connect').click();
      const edge = page.locator('.svelte-flow__edge-path:visible').first();
      await edge.waitFor();
      results.graphColors = await edge.evaluate(element => ({
        stroke: getComputedStyle(element).stroke,
        width: getComputedStyle(element).strokeWidth,
        ports: Array.from(document.querySelectorAll('.svelte-flow__handle')).map(port => ({
          color: getComputedStyle(port).color,
          background: getComputedStyle(port).backgroundColor,
          border: getComputedStyle(port).borderColor
        }))
      }));
    }
    results.surfaces.push({
      route,
      buttons: await page.getByRole('button').allTextContents(),
      visibleControlRoles: await page.locator('[data-button-root]:visible, [data-select-trigger]:visible, [data-slot]:visible, .vict-state:visible').count()
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await capture(route.toLowerCase() + '-desktop');
  }
  await button('Workflows').click();
  await page.getByLabel('Node', { exact: true }).press('ArrowDown');
  const option = page.getByRole('option', { selected: true });
  await option.waitFor();
  await capture('workflow-select');
  await page.keyboard.press('Escape');
  assert.equal(await page.getByLabel('Node', { exact: true }).evaluate(element => element === document.activeElement), true);
  await button('Agents').click();
  await page.getByLabel('Agent name').focus();
  results.focus = await page.getByLabel('Agent name').evaluate(element => {
    const style = getComputedStyle(element);
    return { outline: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor, offset: style.outlineOffset };
  });
  assert.notEqual(results.focus.outline, 'none');
  const graphNode = page.locator('.svelte-flow__node:visible').first();
  await page.keyboard.press('Tab');
  await graphNode.focus();
  assert.equal(await graphNode.evaluate(element => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
  }), true);
  const samples = ['#agent-name', '#agent-instructions', '.node-heading strong', '.readiness', '.project strong'];
  for (const selector of samples) {
    results.contrast.push(await page.locator(selector).first().evaluate(element => {
      const rgb = color => (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = channels => channels.map(value => {
        const c = value / 255;
        return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
      }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
      const foreground = getComputedStyle(element).color;
      let parent = element;
      let background = '';
      while (parent) {
        const value = getComputedStyle(parent).backgroundColor;
        if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') { background = value; break; }
        parent = parent.parentElement;
      }
      const a = luminance(rgb(foreground)), b = luminance(rgb(background));
      return { name: element.id || element.className || element.tagName, foreground, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
    }));
  }
  for (const sample of results.contrast) assert.ok(sample.ratio >= 4.5, JSON.stringify(sample));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['Agents', 'Workflows', 'Creative', 'Sessions', 'Runs']) {
    await button(route).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    const box = await page.getByRole('navigation', { name: 'Studio views' }).boundingBox();
    assert.ok(Math.abs(box.height + box.y - 844) <= 1);
    await capture(route.toLowerCase() + '-phone');
  }
  await button('Agents').click();
  await button('Inspector').click();
  await page.getByRole('dialog', { name: 'Inspector' }).waitFor();
  await capture('inspector-phone');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(await button('Inspector').evaluate(element => element === document.activeElement), true);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await button('Sessions').click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  await capture('sessions-200-percent');
  await page.evaluate(() => { document.body.style.zoom = ''; });
  assert.deepEqual(results.errors, []);
  await writeFile(output + '/audit.json', JSON.stringify(results, null, 2));
  console.log('PASS UI audit: all pages, menu/overlay keyboard focus, Select, measured text contrast, reduced motion, phone overflow and anchored nav, 200% layout.');
} finally {
  await browser.close();
}
