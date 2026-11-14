import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const task = process.argv[2];
assert.ok(['authoring', 'assembly'].includes(task));
const port = '48931';
const url = 'http://127.0.0.1:' + port;
const { chromium } = createRequire(import.meta.url)(process.env.TORI_PLAYWRIGHT_MODULE);
const directory = await mkdtemp(join(tmpdir(), 'tori-008-' + task + '-'));
const evidence = resolve('.local/t8-' + task + '-browser');
await mkdir(evidence, { recursive: true });
const env = { ...process.env, TORI_DATA_DIR: directory, TORI_ZAI_ROUTE: 'coding',
  TORI_ZAI_API_KEY: 'synthetic-a1-fixture', TORI_ENABLE_PI_ZAI: '0', TORI_EXECUTION_FIXTURE: 'a1-request-capture',
  TORI_AUTHORING_LIVE: '0', TORI_BROWSER_LIVE: '0',
};
const server = spawn(process.execPath, [
  '--import', './tests/' + (task === 'authoring' ? 'authoring' : 'a1') + '-provider-fixture.mjs',
  './node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', port, '--strictPort',
], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
const stopped = once(server, 'exit');
let diagnostic = '';
for (const stream of [server.stdout, server.stderr]) {
  stream.on('data', bytes => { diagnostic = (diagnostic + bytes).slice(-6000); });
}
try {
  const browser = await chromium.launch();
  try {
    const deadline = Date.now() + 90000;
    let ready;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) throw Error('Isolated host exited.');
      ready = await fetch(url + '/api/studio', { signal: AbortSignal.timeout(1000) })
        .then(response => response.ok ? response.json() : null).catch(() => null);
      if (ready?.workspace) break;
      await delay(200);
    }
    assert.equal(ready?.fixture, true);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.getByRole('button', { name: 'Add Agent', exact: true }).waitFor({ timeout: 90000 });
  } finally {
    await browser.close();
  }
  const driver = spawn(process.execPath, ['./tests/' + (task === 'authoring' ? 'authoring-browser' : 'browser') + '.mjs'], {
    env: { ...env, TORI_AUTHORING_PREVIEW: '1', TORI_AUTHORING_PORT: port, TORI_AUTHORING_EVIDENCE: evidence,
      TORI_AUTHORING_DATA: directory, TORI_BROWSER_URL: url },
    windowsHide: true, stdio: 'inherit',
  });
  process.exitCode = (await once(driver, 'exit'))[0] ?? 1;
} catch (error) {
  console.error(diagnostic);
  throw error;
} finally {
  if (server.exitCode === null && server.signalCode === null) server.kill();
  await stopped;
}
