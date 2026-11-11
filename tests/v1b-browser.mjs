import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const live = process.env.TORI_V1B_LIVE === '1';
const { chromium } = createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE ?? 'playwright');
const directory = await mkdtemp(join(tmpdir(), 'tori-v1b-authoring-'));
const port = process.env.TORI_V1B_PORT ?? '48785';
const url = 'http://127.0.0.1:' + port;
const server = spawn(process.execPath, [
  ...(live ? [] : ['--import', './tests/v1b-provider-fixture.mjs']),
  './node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', port, '--strictPort',
], {
  env: {
    ...process.env, TORI_DATA_DIR: directory, TORI_ZAI_ROUTE: 'coding',
    ...(live ? {} : { TORI_ZAI_API_KEY: 'synthetic-a1-fixture', TORI_ENABLE_PI_ZAI: '0' }),
  },
  windowsHide: true,
});
let log = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { log += chunk; });
let browser;
try {
  for (let i = 0; i < 300; i++) {
    if (server.exitCode !== null) throw new Error('The isolated Studio could not start.');
    if (log.includes('Local:')) {
      const response = await fetch(url + '/api/studio').catch(() => null);
      if (response?.ok) {
        assert.equal((await response.json()).provider, true, 'Configure the approved Coding provider for a live proof.');
        break;
      }
    }
    await delay(100);
  }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1531, height: 850 } });
  page.setDefaultTimeout(20000);
  const button = name => page.getByRole('button', { name, exact: true });
  const field = id => page.locator('#' + id);
  const tab = name => page.getByRole('navigation', { name: 'Studio tasks' }).getByRole('button', { name, exact: true });
  const api = async () => (await page.request.get(url + '/api/studio')).json();
  async function clickRequest(action, path) {
    const response = page.waitForResponse(r => r.url() === url + '/api/studio/' + path && r.request().method() === 'POST');
    await action.click();
    const reply = await response;
    assert.equal(reply.status(), 200, await reply.text());
    return reply.json();
  }
  async function fillAgent(name, instructions) {
    await field('settings-agent-name').fill(name);
    await field('settings-agent-text').fill(instructions);
    await field('settings-model').selectOption('glm-5.3-flash');
  }
  const activate = () => clickRequest(page.getByRole('button', { name: /^Activate r\d+$/ }), 'activate');
  async function openDefinition(name) {
    const dock = page.getByRole('complementary', { name: 'Assembly / Selection' });
    await dock.getByRole('button', { name, exact: true }).click();
    await page.waitForFunction(name => document.getElementById('settings-agent-name')?.value === name, name);
  }
  const authoring = page.getByRole('complementary', { name: 'Authoring Agent' });
  const openAuthoring = async (version) => {
    const toggle=page.locator('.agent-dock-actions').getByRole('button',{name:'Authoring Agent',exact:true});
    if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
    await field('authoring-activation').selectOption(version);
  };
  async function send(prompt) {
    await field('authoring-instructions').fill(prompt);
    const reply = page.waitForResponse(r => r.url() === url + '/api/studio/turn' && r.request().method() === 'POST', { timeout: 120000 });
    await authoring.getByRole('button', { name: 'Send', exact: true }).click();
    return { reply };
  }
  async function runFrom(reply) {
    const response = await reply;
    assert.equal(response.status(), 200, await response.text());
    return (await response.json()).runs[0];
  }
  async function history(command) {
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: command, exact: true }).click();
  }
  async function interceptProposal() {
    let arrived;
    const proposal = new Promise(resolve => { arrived = resolve; });
    await page.route('**/api/studio/authoring-poll', async route => {
      const response = await route.fetch();
      const body = await response.json();
      if (body.proposals?.length) {
        let release;
        const wait = new Promise(resolve => { release = resolve; });
        arrived({ body, release });
        await wait;
      }
      await route.fulfill({ response });
    });
    return proposal;
  }

  await page.goto(url, { timeout: 120000 });
  await button('Add Agent').click();
  await fillAgent('Research Agent', 'Summarize the findings.');
  const research = await clickRequest(button('Save'), 'save');
  const researchPin = (await activate()).activation;

  await clickRequest(button('New agent'), 'definitions');
  await fillAgent('Authoring Agent', 'You edit draft instructions when asked. Call draft discovery first, then replace the exact instructions using the returned draft ID, occurrence and revision. Keep other instructions. Report only a confirmed edit.');
  await field('settings-agent-steps').fill('4');
  await button('Add capability').click();
  await page.getByRole('menuitem', { name: 'Draft Authoring', exact: true }).click();
  await clickRequest(button('Save'), 'save');
  const authorPin = (await activate()).activation;
  assert.equal(authorPin.authoring, true);
  await openDefinition('Research Agent');
  await openDefinition('Authoring Agent');
  await openDefinition('Research Agent');
  await openAuthoring(authorPin.version);

  if (!live) {
    let lost = 0;
    await page.route('**/api/studio/authoring-ack', async route => {
      if (lost++ === 0) await route.abort();
      else await route.continue();
    });
  }
  const { reply } = await send("Update Research Agent's instructions so every finding includes a source link.");
  const success = await runFrom(reply);
  assert.equal(success.activation, authorPin.version);
  assert.equal(success.draftTarget.definition, research.definition);
  assert.equal(success.draftReceipts.length, 1, JSON.stringify(success));
  assert.equal(success.draftReceipts[0].status, 'applied');
  assert.equal(success.draftReceipts[0].revision, success.draftReceipts[0].expectedRevision + 1);
  const newText = await field('settings-agent-text').inputValue();
  assert.match(newText, /source link/i);
  await history('Undo');
  assert.equal(await field('settings-agent-text').inputValue(), 'Summarize the findings.');
  await history('Redo');
  assert.equal(await field('settings-agent-text').inputValue(), newText);
  await button('Canvas').click();
  assert.equal(await field('canvas-agent-instructions').inputValue(), newText);
  await button('Configure').click();
  if (!live) {
    await page.reload();
    await page.waitForFunction(text => document.getElementById('settings-agent-text')?.value === text, newText);
    await history('Undo');
    assert.equal(await field('settings-agent-text').inputValue(), 'Summarize the findings.');
    await history('Redo');
    assert.equal(await field('settings-agent-text').inputValue(), newText);
  }
  await clickRequest(button('Save'), 'save');
  assert.equal((await api()).activation.version, researchPin.version);
  if (live) await authoring.getByRole('button', { name: 'Inspect authoring Run', exact: true }).click();
  else await tab('Runs').click();
  await page.getByText('Draft edit · applied', { exact: true }).waitFor();
  await page.reload();
  assert.equal((await api()).runs[0].draftReceipts[0].operationId, success.draftReceipts[0].operationId);
  await field('settings-agent-text').waitFor();
  assert.equal(await field('settings-agent-text').inputValue(), newText);

  if (!live) {
    await page.unroute('**/api/studio/authoring-ack');
    assert.ok((await api()).runs[0].fixture);
    await openAuthoring(authorPin.version);
    const pending = interceptProposal();
    const stale = await send('Test the manual revision fence.');
    const gated = await pending;
    const competing = await page.request.post(url + '/api/studio/save', {
      headers: { origin: url },
      data: { definition: research.definition, expected: research.revision, graph: research.graph },
    });
    assert.equal(competing.status(), 409);
    assert.match((await competing.json()).message, /Wait for the authoring turn/);
    await field('settings-agent-text').fill('Preserve the newer manual edit.');
    gated.release();
    const staleRun = await runFrom(stale.reply);
    assert.equal(staleRun.draftReceipts[0].status, 'stale');
    assert.equal(await field('settings-agent-text').inputValue(), 'Preserve the newer manual edit.');
    await page.unroute('**/api/studio/authoring-poll');
    const denied = await runFrom((await send('Scope denial fixture.')).reply);
    assert.deepEqual(denied.draftReceipts, []);
    assert.deepEqual(denied.authoringOutcomes, ['denied']);
    assert.ok(denied.events.some(event => event.label === 'Draft edit · denied'));
    await authoring.locator('.vict-alert--denied').getByText('The edit was outside the authorized draft scope.').waitFor();
    const waiting = interceptProposal();
    const stopped = await send('Test Stop before the browser commit.');
    const late = await waiting;
    await authoring.getByRole('button', { name: 'Stop', exact: true }).click();
    late.release();
    const stoppedRun = await runFrom(stopped.reply);
    assert.equal(stoppedRun.status, 'cancelled');
    assert.ok(!stoppedRun.draftReceipts.some(receipt => receipt.status === 'applied'));
    assert.equal(await field('settings-agent-text').inputValue(), 'Preserve the newer manual edit.');
    await page.unroute('**/api/studio/authoring-poll');

    // The journal commits before Stop, while the acknowledgement is held.
    let releaseAck;
    let reportAck;
    const heldAck = new Promise(resolve => { reportAck = resolve; });
    await page.route('**/api/studio/authoring-ack', async route => {
      const held = new Promise(resolve => { releaseAck = resolve; });
      reportAck();
      await held;
      await route.continue();
    });
    const afterCommit = await send('Test Stop after the browser commit.');
    await heldAck;
    assert.match(await field('settings-agent-text').inputValue(), /source link/);
    await authoring.getByRole('button', { name: 'Stop', exact: true }).click();
    const lateRun = await runFrom(afterCommit.reply);
    assert.equal(lateRun.status, 'cancelled');
    const ack = page.waitForResponse(r => r.url().endsWith('/authoring-ack'));
    releaseAck();
    assert.equal((await ack).status(), 200);
    await authoring.getByRole('button', { name: 'Inspect authoring Run', exact: true }).click();
    await page.getByText('Draft edit · applied', { exact: true }).waitFor();
    await page.unroute('**/api/studio/authoring-ack');
    await page.reload();
    await page.waitForFunction(() => /source link/.test(document.getElementById('settings-agent-text')?.value));
    await history('Undo');
    assert.equal(await field('settings-agent-text').inputValue(), 'Preserve the newer manual edit.');
  }
  await page.screenshot({ path: join(directory, 'authoring-checkpoint.png'), animations: 'disabled' });
  console.log(JSON.stringify({ live, applied: success.draftReceipts[0], run: success.id, session: success.session, evidenceDirectory: directory }));
} catch (error) {
  if (!live) console.error(log);
  throw error;
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) {
    const exit = once(server, 'exit');
    server.kill();
    await exit;
  }
}

