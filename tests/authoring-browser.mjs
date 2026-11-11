import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const live = process.env.TORI_AUTHORING_LIVE === '1';
const { chromium } = createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE ?? 'playwright');
const directory = process.env.TORI_AUTHORING_DATA ?? await mkdtemp(join(tmpdir(), 'tori-005-authoring-'));
const evidence = process.env.TORI_AUTHORING_EVIDENCE ?? directory;
await mkdir(evidence, { recursive: true });
const port = process.env.TORI_AUTHORING_PORT ?? '48789';
const url = 'http://127.0.0.1:' + port;
const server = process.env.TORI_AUTHORING_PREVIEW === '1' ? undefined : spawn(process.execPath, [
  ...(live ? [] : ['--import', './tests/authoring-provider-fixture.mjs']),
  './node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', port, '--strictPort',
], {
  env: {
    ...process.env, TORI_DATA_DIR: directory, TORI_ZAI_ROUTE: 'coding',
    ...(live ? { TORI_ENABLE_PI_ZAI: '1' } : { TORI_ZAI_API_KEY: 'synthetic-a1-fixture', TORI_ENABLE_PI_ZAI: '0' }),
  },
  windowsHide: true,
});
for (const stream of [server?.stdout, server?.stderr].filter(Boolean)) {
  if (!live && process.env.TORI_AUTHORING_FIXTURE_LOG === '1') stream.pipe(process.stderr);
  else stream.resume();
}
let browser, page;
const markdownStyles = [];
try {
  let initial;
  for (let attempt = 0; attempt < 300; attempt++) {
    if (server && server.exitCode !== null) throw new Error('The isolated Studio could not start.');
    const response = await fetch(url + '/api/studio').catch(() => null);
    if (response?.ok) {
      initial = await response.json();
      break;
    }
    await delay(100);
  }
  assert.ok(initial?.provider, 'Configure the approved Coding route for the live walkthrough.');
  assert.equal(initial.fixture, !live, 'Select an isolated preview with the intended execution origin.');
  assert.ok(initial.definitions.every(item => !['Quellight', 'Research'].includes(item.name)), 'Start with the target agents absent.');
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1531, height: 850 } });
  page.setDefaultTimeout(20000);
  const button = name => page.getByRole('button', { name, exact: true });
  const field = id => page.locator('#' + id);
  const dock = () => page.locator('.authoring-dock-content').filter({ visible: true });
  const tab = name => page.getByRole('navigation', { name: 'Studio tasks' }).getByRole('button', { name, exact: true });
  const api = async definition => (await page.request.get(url + '/api/studio' + (definition ? '?definition=' + definition : ''))).json();
  const actions = (run, name) => run.authoringActions.find(item => item.action === name)?.result;
  async function clickRequest(locator, path) {
    const response = page.waitForResponse(reply => reply.url() === url + '/api/studio/' + path &&
      reply.request().method() === 'POST', { timeout: 130000 });
    await locator.click();
    const reply = await response;
    assert.equal(reply.status(), 200, await reply.text());
    return reply.json();
  }
  async function openDefinition(name) {
    const library = page.getByRole('complementary', { name: 'Assembly / Selection' });
    await library.getByRole('button').filter({ has: page.getByText(name, { exact: true }) }).click();
    await page.waitForFunction(name => document.getElementById('settings-agent-name')?.value === name, name);
  }
  async function openAuthoring(version) {
    const toggle = page.locator('.agent-dock-actions').getByRole('button', { name: 'Authoring Agent', exact: true });
    if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
    const picker = dock().locator('#authoring-activation');
    if (await picker.inputValue() !== version) await picker.selectOption(version);
  }
  async function send(prompt, change = true) {
    if (change !== null) await dock().locator('#authoring-mode').selectOption(change ? 'change' : 'inspect');
    await dock().locator('#authoring-instructions').fill(prompt);
    const reply = page.waitForResponse(response => response.url() === url + '/api/studio/turn' &&
      response.request().method() === 'POST', { timeout: 130000 });
    await dock().getByRole('button', { name: 'Send', exact: true }).click();
    return { reply };
  }
  async function result({ reply }) {
    const response = await reply;
    assert.equal(response.status(), 200, await response.text());
    await dock().getByRole('button', { name: 'Inspect authoring Run' }).waitFor();
    const state = await response.json();
    const run = state.runs.find(item => item.authoringActions);
    const session = state.sessions.find(item => item.id === run.session);
    return { state, run, message: session.messages.find(item => item.id === run.id + '-agent')?.text };
  }
  async function openDetails(name) {
    if (await button('Runs sidebar').getAttribute('aria-expanded') !== 'true') await button('Runs sidebar').click();
    if (await button('Details').getAttribute('aria-expanded') !== 'true') await button('Details').click();
    const details = page.getByRole('region', { name: 'Run details content' });
    await details.getByRole('heading', { name, exact: true }).scrollIntoViewIfNeeded();
    return details;
  }
  async function checkMarkdown(container, view) {
    const markdown = container.locator('.vict-ai-markdown').filter({
      has: page.getByRole('heading', { name: 'Research review', exact: true }),
    });
    await markdown.locator('[data-slot="code-block-line-content"] > span').first().waitFor({ state: 'attached' });
    const styles = await markdown.evaluate(root => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      function rgba(color) {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data, value => value / 255);
      }
      const blend = (top, bottom) => top.slice(0, 3).map((value, channel) =>
        value * top[3] + bottom[channel] * (1 - top[3]));
      const luminance = color => color.map(value => value <= .04045 ?
        value / 12.92 : ((value + .055) / 1.055) ** 2.4)
        .reduce((total, value, channel) => total + value * [.2126, .7152, .0722][channel], 0);
      function contrast(element) {
        const layers = [];
        for (let current = element; current; current = current.parentElement) {
          const layer = rgba(getComputedStyle(current).backgroundColor);
          layers.push(layer);
          if (layer[3] === 1) break;
        }
        const background = layers.reduceRight((bottom, top) => blend(top, bottom), [1, 1, 1]);
        const foreground = blend(rgba(getComputedStyle(element).color), background);
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        return (values[0] + .05) / (values[1] + .05);
      }

      const list = root.querySelector('ol');
      const item = list.querySelector('li');
      const boundary = root.getBoundingClientRect();
      const inlineCode = item.querySelector('code');
      const longCode = item.querySelector('ul code');
      const highlighted = Array.from(root.querySelectorAll('[data-slot="code-block-line-content"] > span'));
      return {
        indent: item.getBoundingClientRect().left - boundary.left,
        listMarker: getComputedStyle(list).listStylePosition,
        longCodeFits: Array.from(longCode.getClientRects()).every(rect => rect.left >= boundary.left && rect.right <= boundary.right + 1),
        linkDecoration: getComputedStyle(root.querySelector('a')).textDecorationLine,
        contrast: {
          inlineCode: contrast(inlineCode),
          quote: contrast(root.querySelector('blockquote')),
          link: contrast(root.querySelector('a')),
          tableHeader: contrast(root.querySelector('th')),
          tableCell: contrast(root.querySelector('td')),
          syntax: Math.min(...highlighted.map(contrast)),
        },
      };
    });
    assert.ok(styles.indent <= 22, 'Excessive list indent in ' + view + ': ' + styles.indent);
    assert.equal(styles.listMarker, 'outside');
    assert.equal(styles.longCodeFits, true, 'Long inline code should wrap within ' + view);
    assert.match(styles.linkDecoration, /underline/);
    for (const [role, ratio] of Object.entries(styles.contrast)) {
      assert.ok(ratio >= 4.5, view + ' ' + role + ' contrast: ' + ratio.toFixed(2));
    }
    markdownStyles.push({ view, viewport: page.viewportSize(), ...styles });
    return markdown;
  }
  async function checkComposer(container) {
    const bounds = await container.boundingBox();
    for (const label of ['Send', 'Inspect authoring Run']) {
      const control = await container.getByRole('button', { name: label, exact: true }).boundingBox();
      assert.ok(control && control.y >= bounds.y && control.y + control.height <= bounds.y + bounds.height,
        label + ' should stay within the authoring panel');
    }
    const feed = await container.locator('.vict-conversation').boundingBox();
    const scrollControl = container.getByRole('button', { name: 'Scroll to latest message' });
    const scrollBounds = await scrollControl.boundingBox();
    assert.ok(feed && scrollBounds && feed.y + feed.height <= scrollBounds.y + 1,
      'The scroll-to-latest control should sit below the transcript text');
  }
  async function history(command) {
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: command, exact: true }).click();
  }
  async function holdProposal() {
    let arrived, release;
    const seen = new Promise(resolve => { arrived = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/api/studio/authoring-poll', async route => {
      const response = await route.fetch();
      const body = await response.json();
      if (body.proposals?.length) {
        arrived();
        await gate;
      }
      await route.fulfill({ response });
    });
    return { seen, release };
  }

  await page.goto(url);
  await button('Add Agent').click();
  await field('settings-agent-name').fill('Authoring Agent');
  await field('settings-agent-text').fill('Help the operator author Studio agents. Discover real definitions, resources and Runs. Apply only requested changes. Use exact returned IDs and report observed outcomes.');
  await field('settings-model').selectOption('glm-5.3-flash');
  await field('settings-agent-steps').fill('4');
  await button('Add capability').click();
  await page.getByRole('menuitem', { name: 'Draft Authoring', exact: true }).click();
  await field('settings-authoring-reference').selectOption('workspace@1');
  await clickRequest(button('Save'), 'save');
  const pinned = (await clickRequest(page.getByRole('button', { name: /^Activate r\d+$/ }), 'activate')).activation;
  assert.equal(pinned.workspaceAuthoring, true);
  await page.reload();
  await openAuthoring(pinned.version);
  assert.equal(await dock().locator('#authoring-mode').inputValue(), 'inspect');

  let lostBuildResponse = 0;
  if (!live) {
    await page.route('**/api/studio/turn', async route => {
      if (lostBuildResponse++) return route.continue();
      await route.fetch({ timeout: 130000 });
      await route.abort();
    });
  }
  const built = await result(await send(
    'Please build and save Quellight with a Research specialist using our available model. Bind Studio Research Knowledge and the registered Research Topics tool to Research. Have Research call the tool for the requested topic, quote the returned reference ID and suggest one practical next step. Quellight should delegate the research request with project knowledge included. Then test Quellight by asking it to delegate a habits research request to Research, with the key habits, and report the real result and Run ID.'
  ));
  if (!live) {
    assert.equal(lostBuildResponse, 2, 'Retry after a lost build acknowledgement.');
    await page.unroute('**/api/studio/turn');
  }
  assert.equal(built.run.status, 'completed', JSON.stringify(built.run));
  assert.equal(await dock().locator('#authoring-mode').inputValue(), 'change');
  assert.equal(built.run.activation, pinned.version);
  const saved = actions(built.run, 'assemble');
  assert.equal(saved?.status, 'saved', JSON.stringify(built.run.authoringActions));
  const [specialist, primary] = saved.definitions;
  assert.deepEqual([specialist.name, primary.name], ['Research', 'Quellight']);
  for (const name of ['Quellight', 'Research']) {
    assert.equal(built.state.definitions.filter(item => item.name === name).length, 1);
  }
  const test = actions(built.run, 'test')?.run;
  assert.equal(test?.status, 'completed', JSON.stringify(built.run.authoringActions));
  assert.equal(test.revision, primary.savedRevision);
  assert.equal(built.state.runs.filter(run => run.authoringRun === built.run.id).length, 1);
  assert.equal(test.children.length, 1);
  const child = test.children[0];
  assert.equal(child.status, 'completed');
  assert.equal(child.revision, specialist.savedRevision);
  assert.equal(child.context?.status, 'admitted');
  assert.equal(child.scripts.length, 1);
  assert.equal(child.scripts[0].id, 'tori.script.research-topics');
  assert.equal(child.scripts[0].calls, 1);
  assert.match(child.scripts[0].result.text, /TOPIC-104/);
  assert.match(child.output, /TOPIC-104/);
  await page.screenshot({ path: join(evidence, 'desktop-conversation.png') });

  const unchanged = await api(specialist.definitionId);
  const reviewed = await result(await send('Could you review that Run and suggest one improvement to Research? Cite the actual Run ID. Please only suggest a change.', false));
  assert.equal(reviewed.run.status, 'completed', JSON.stringify(reviewed.run));
  assert.equal(reviewed.run.session, built.run.session);
  assert.equal(reviewed.run.authoringMode, 'inspect');
  assert.ok(reviewed.run.authoringActions.length && reviewed.run.authoringActions.every(item => item.action === 'inspect'));
  assert.ok(reviewed.run.authoringActions.some(item => [test.id, child.id].includes(item.result.runId)), JSON.stringify(reviewed.run.authoringActions));
  assert.ok([test.id, child.id].some(id => reviewed.message?.includes(id)), reviewed.message);
  assert.deepEqual((await api(specialist.definitionId)).graph, unchanged.graph);
  assert.deepEqual((await api(specialist.definitionId)).revision, unchanged.revision);
  assert.deepEqual((await api(specialist.definitionId)).activation, unchanged.activation);

  if (!live) {
    await page.setViewportSize({ width: 1531, height: 668 });
    const desktopDock = page.getByRole('complementary', { name: 'Authoring Agent' });
    const desktopReply = await checkMarkdown(desktopDock, 'Authoring dock');
    await desktopReply.getByText('Bindings', { exact: true }).scrollIntoViewIfNeeded();
    await checkComposer(desktopDock);
    await page.screenshot({ path: join(evidence, 'markdown-authoring-desktop.png') });

    await page.setViewportSize({ width: 390, height: 844 });
    await desktopDock.waitFor({ state: 'hidden' });
    await openAuthoring(pinned.version);
    const drawer = page.getByRole('dialog', { name: 'Authoring Agent' });
    const phoneReply = await checkMarkdown(drawer, 'Authoring drawer');
    await phoneReply.getByText('Bindings', { exact: true }).scrollIntoViewIfNeeded();
    await checkComposer(drawer);
    await page.screenshot({ path: join(evidence, 'markdown-authoring-narrow.png') });
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'hidden' });

    await page.setViewportSize({ width: 1531, height: 668 });
    await desktopDock.waitFor();
    await desktopDock.getByRole('button', { name: 'Inspect authoring Run' }).click();
    const runReply = await checkMarkdown(page.locator('.run-turn'), 'Run turn');
    await runReply.getByText('Bindings', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(evidence, 'markdown-run.png') });
    await page.getByRole('button', { name: 'Open turn', exact: true }).click();
    const sessionReply = await checkMarkdown(page.locator('.session-view'), 'Session');
    await sessionReply.getByText('Bindings', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(evidence, 'markdown-session.png') });
    await tab('Agents').click();
    await page.setViewportSize({ width: 1531, height: 850 });
  }

  await openDefinition('Quellight');
  await button('Canvas').click();
  await page.getByRole('group', { name: 'Child Agent to Child Agent', exact: true }).waitFor({ state: 'attached' });
  await page.screenshot({ path: join(evidence, 'desktop-canvas.png') });
  await button('Configure').click();
  await openDefinition('Research');
  const original = await field('settings-agent-text').inputValue();
  const edited = await result(await send('Apply the improvement to the open Research draft by keeping the existing instructions and appending this exact sentence: Include a source label in every finding. Leave the draft open so I can check the edit.'));
  assert.equal(edited.run.session, built.run.session);
  assert.equal(edited.run.draftReceipts?.[0]?.status, 'applied', JSON.stringify(edited.run));
  const improved = await field('settings-agent-text').inputValue();
  assert.match(improved, /Include a source label in every finding/i);
  await history('Undo');
  assert.equal(await field('settings-agent-text').inputValue(), original);
  await history('Redo');
  assert.equal(await field('settings-agent-text').inputValue(), improved);
  const manualSaved = await clickRequest(button('Save'), 'save');
  await page.reload();
  await openDefinition('Research');
  assert.equal(await field('settings-agent-text').inputValue(), improved);
  await openAuthoring(pinned.version);
  assert.equal(await dock().locator('#authoring-mode').inputValue(), 'change');

  let droppedSaveAck = 0;
  if (!live) {
    await page.route('**/api/studio/authoring-ack', async route => {
      if (droppedSaveAck++ === 0) {
        const committed = await route.fetch();
        assert.equal((await committed.json()).saved.status, 'saved');
        await route.abort();
      } else await route.continue();
    });
  }
  let second = await result(await send(
    'Discover the registered Reading List and connect it to the open Research agent in place of Research Topics. Save this revision, then test Research directly using the Reading List tool with the planning key. Tell me the actual result.', null
  ));
  assert.equal(second.run.authoringMode, 'change');
  if (!live) {
    assert.ok(droppedSaveAck >= 2, 'Lost Save acknowledgement should trigger the same journal receipt again.');
    await page.unroute('**/api/studio/authoring-ack');
  }
  const bindingRun = second.run;
  if (live && !actions(second.run, 'test') && actions(second.run, 'edit')?.savedRevision) {
    second = await result(await send('Now test the saved Research agent. Ask it to use the Reading List tool for the planning key. Show the actual Run and result.'));
  }
  const secondRun = actions(second.run, 'test')?.run;
  assert.equal(secondRun?.status, 'completed', JSON.stringify(second.run.authoringActions));
  assert.equal(secondRun.scripts[0].id, 'tori.script.reading-list');
  assert.equal(secondRun.scripts[0].calls, 1);
  assert.match(secondRun.scripts[0].result.text, /READING-29/);
  const finalResearch = await api(specialist.definitionId);
  assert.equal(finalResearch.revision.number, manualSaved.revision.number + 1);
  assert.equal(finalResearch.revision.id, secondRun.revision);

  await dock().getByRole('button', { name: 'Inspect authoring Run' }).click();
  const studioActions = await openDetails('Studio actions');
  await studioActions.getByRole('button', { name: 'Open linked Run' }).last().click();
  const scriptEvidence = await openDetails('Script evidence');
  await scriptEvidence.getByText('READING-29:', { exact: false }).waitFor();
  await page.screenshot({ path: join(evidence, 'desktop-script-run.png') });
  await tab('Agents').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.agent-left-dock').waitFor({ state: 'hidden' });
  await openAuthoring(pinned.version);
  await dock().locator('#authoring-mode').waitFor();
  const sendBounds = await dock().getByRole('button', { name: 'Send', exact: true }).boundingBox();
  assert.ok(sendBounds && sendBounds.y >= 0 && sendBounds.y + sendBounds.height <= 844, 'The composer remains visible below a long conversation.');
  await page.screenshot({ path: join(evidence, 'narrow-conversation.png') });
  await page.keyboard.press('Escape');
  await dock().waitFor({ state: 'hidden' });

  const probes = {};
  if (!live) {
    await page.setViewportSize({ width: 1531, height: 850 });
    await page.locator('.agent-left-dock').waitFor();
    await openAuthoring(pinned.version);
    const denied = await result(await send('Please run a denied script read for the open agent.'));
    const script = actions(denied.run, 'test').run.scripts[0];
    assert.equal(script.status, 'denied');
    assert.equal(script.calls, 0);
    probes.deniedScript = script;
    const outside = await result(await send('Try an edit outside this draft.'));
    assert.equal(actions(outside.run, 'edit').status, 'denied');
    assert.equal(outside.run.draftReceipts?.length ?? 0, 0);
    probes.deniedDraft = outside.run.id;
    await page.screenshot({ path: join(evidence, 'desktop-denied.png') });

    const stale = await holdProposal();
    const pending = await send('Please revise the instructions to include a source label.');
    await stale.seen;
    await field('settings-agent-text').fill('Manual edit during the authoring turn.');
    stale.release();
    const staleRun = await result(pending);
    assert.equal(staleRun.run.draftReceipts[0].status, 'stale');
    assert.equal(await field('settings-agent-text').inputValue(), 'Manual edit during the authoring turn.');
    probes.stale = staleRun.run.draftReceipts[0];
    await page.unroute('**/api/studio/authoring-poll');

    const stop = await holdProposal();
    const stopping = await send('Please revise the instructions to include a source label.');
    await stop.seen;
    await dock().getByRole('button', { name: 'Stop', exact: true }).click();
    stop.release();
    const stopped = await result(stopping);
    assert.equal(stopped.run.status, 'cancelled');
    assert.ok(!stopped.run.draftReceipts?.some(item => item.status === 'applied'));
    assert.equal(await field('settings-agent-text').inputValue(), 'Manual edit during the authoring turn.');
    assert.equal((await api(specialist.definitionId)).revision.id, finalResearch.revision.id);
    probes.stopped = stopped.run.id;
    await page.unroute('**/api/studio/authoring-poll');

    await clickRequest(button('Save'), 'save');
    const variant = await result(await send('Could you draft a new weekly reviewer and leave it unsaved?'));
    assert.equal(actions(variant.run, 'assemble').status, 'created');
    await openDefinition('Weekly Reviewer');
    assert.match(await field('settings-agent-text').inputValue(), /weekly commitments/);
    const separateSave = await result(await send('Please save this draft as it is.'));
    assert.equal(actions(separateSave.run, 'edit').status, 'applied');
    const reopened = await api(actions(variant.run, 'assemble').definitions[0].definitionId);
    assert.equal(reopened.revision.number, 1);
    assert.equal(separateSave.run.draftReceipts[0].revision, reopened.revision.id);
    assert.ok(reopened.graph);
    probes.variant = variant.run.id;

    await openDefinition(pinned.name);
    await button('Canvas').click();
    const execution = page.locator('.graph-node[data-kind="agent"]').getByRole('button',{name:/^Execution /});
    if (await execution.getAttribute('aria-expanded') !== 'true') await execution.click();
    await field('canvas-agent-steps').fill('7');
    await field('canvas-agent-tool-calls').fill('5');
    await field('canvas-agent-retries').fill('2');
    await page.screenshot({ path: join(evidence, 'desktop-node-execution.png') });
    await button('Configure').click();
    assert.equal(await field('settings-agent-steps').inputValue(), '7');
    assert.equal(await field('settings-agent-tool-calls').inputValue(), '5');
    assert.equal(await field('settings-agent-retries').inputValue(), '2');
    await clickRequest(button('Save'), 'save');
    const configured = (await clickRequest(page.getByRole('button', { name: /^Activate r\d+$/ }), 'activate')).activation;
    assert.notEqual(configured.version, pinned.version);
    assert.deepEqual(configured.execution, { maxSteps: 7, maxToolCalls: 5, maxRetries: 2 });
    await page.reload();
    await openAuthoring(pinned.version);
    await dock().getByText('Per turn: 4 model steps · 3 tool calls', { exact: true }).waitFor();
    const legacyBudget = (await result(await send('Please compare execution budgets.', false))).run;
    assert.equal(legacyBudget.activation, pinned.version);
    assert.equal(legacyBudget.errorCode, 'TORI_CAPABILITY_CALL_LIMIT');
    assert.equal(legacyBudget.modelSteps, 4);
    assert.equal(legacyBudget.toolCalls, 3);
    assert.equal(legacyBudget.authoringActions.length, 3);
    assert.equal(legacyBudget.draftReceipts?.length ?? 0, 0);
    await dock().locator('#authoring-mode').selectOption('change');
    await openAuthoring(configured.version);
    assert.equal(await dock().locator('#authoring-mode').inputValue(), 'change');
    await dock().getByText('Per turn: 7 model steps · 5 tool calls', { exact: true }).waitFor();
    const expandedBudget = (await result(await send('Please compare execution budgets.', false))).run;
    assert.equal(expandedBudget.activation, configured.version);
    assert.equal(expandedBudget.status, 'completed', JSON.stringify(expandedBudget));
    assert.equal(expandedBudget.modelSteps, 6);
    assert.equal(expandedBudget.providerAttempts, 6);
    assert.equal(expandedBudget.toolCalls, 5);
    assert.equal(expandedBudget.authoringActions.length, 5);
    assert.equal(expandedBudget.draftReceipts?.length ?? 0, 0);
    await dock().getByText('Five synthetic inspections completed.', { exact: true }).waitFor();
    await page.screenshot({ path: join(evidence, 'desktop-authoring-budget.png') });

    await page.setViewportSize({ width: 390, height: 844 });
    await button('Canvas').click();
    if (await execution.getAttribute('aria-expanded') !== 'true') await execution.click();
    await field('canvas-agent-steps').fill('1');
    await field('canvas-agent-tool-calls').fill('0');
    await field('canvas-agent-tool-calls').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(evidence, 'narrow-node-execution.png') });
    await clickRequest(button('Save'), 'save');
    const zeroTools = (await clickRequest(page.getByRole('button', { name: /^Activate r\d+$/ }), 'activate')).activation;
    assert.deepEqual(zeroTools.execution, { maxSteps: 1, maxToolCalls: 0, maxRetries: 2 });
    await openAuthoring(zeroTools.version);
    await dock().getByText('Per turn: 1 model step · 0 tool calls', { exact: true }).waitFor();
    const noTools = (await result(await send('Please check disabled tool calls.', false))).run;
    assert.equal(noTools.status, 'completed', JSON.stringify(noTools));
    assert.equal(noTools.modelSteps, 1);
    assert.equal(noTools.toolCalls, 0);
    assert.equal(noTools.authoringActions.length, 0);
    await dock().getByText('No Studio tools were exposed.', { exact: true }).waitFor();
    await page.screenshot({ path: join(evidence, 'narrow-authoring-budget.png') });
    probes.execution = { legacy: legacyBudget, configured: expandedBudget, noTools };
  }
  const report = {
    live, chromium: browser.version(), authoringActivation: pinned, workspace: initial.workspace,
    build: built.run, review: reviewed.run, reviewReply: reviewed.message, edit: edited.run,
    bindingRun, second: second.run, test, child, secondRun, finalRevision: finalResearch.revision, probes, markdownStyles,
  };
  await writeFile(join(evidence, 'observations.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ live, build: built.run.id, review: reviewed.run.id, edit: edited.run.id,
    test: test.id, child: child.id, second: secondRun.id, directory, evidence }));
} catch (error) {
  await page?.screenshot({ path: join(evidence, 'failed.png') }).catch(() => {});
  console.error('Authoring walkthrough failed. Captures:', evidence);
  throw error;
} finally {
  await browser?.close();
  if (server?.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
}
