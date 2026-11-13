import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../../server/studio.mjs', import.meta.url), 'utf8');
const route = source.match(/^const endpoints=.*\r?\nconst selectedRoute=.*$/m)?.[0];
const loader = source.match(/^function credential\(routeName=selectedRoute\(\)\) \{[\s\S]*?^\}/m)?.[0];

export function loadCodingCredential() {
  assert.ok(route && loader, 'Could not read the pinned Studio credential loader.');
  const env = { TORI_ZAI_ROUTE: 'coding', TORI_ENABLE_PI_ZAI: '1' };
  const key = runInNewContext(route + '\n' + loader + '\ncredential()', {
    process: { env }, readFileSync, homedir, join,
  });
  assert.ok(typeof key === 'string' && key.length > 0, 'The existing Coding loader yielded no credential.');
  return key;
}

if (process.argv.includes('--check-loader')) {
  loadCodingCredential();
  console.log('Authorized Coding loader available.');
}
if (process.argv.includes('--live')) {
  process.env.TORI_ZAI_API_KEY = loadCodingCredential();
  process.env.TORI_DIRECTIVE_TRIALS = '1';
  await import('./recognition.mjs');
}
