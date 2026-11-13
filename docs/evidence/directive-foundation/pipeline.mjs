import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'vite';
import { createStudio } from '../../../server/studio.mjs';

Object.assign(process.env, { TORI_ZAI_ROUTE: 'coding', TORI_ZAI_API_KEY: 'synthetic-a1-fixture',
  TORI_EXECUTION_FIXTURE: 'a1-request-capture', TORI_ENABLE_PI_ZAI: '0' });

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

const timeout = () => new Promise((_, reject) => {
  setTimeout(() => reject(Error('Timed out waiting for fixture draft dispatch.')), 10000).unref();
});
const draftText = 'Use two short bullets for Orchid project updates.';
const publicReply = 'Two short bullets would keep the Orchid update clear.';
const input = 'Please remember that Orchid project updates should use two short bullets.';
const dir = await mkdtemp(join(tmpdir(), 'tori-directive-pipeline-'));
let studio, vite, active;
const originalFetch = globalThis.fetch;
const ms = value => Math.round(value * 100) / 100;

function completion(body, text) {
  const chunk = (delta, finish_reason) => 'data: ' + JSON.stringify({
    id: 'directive-pipeline-fixture', object: 'chat.completion.chunk', created: 1, model: body.model,
    choices: [{ index: 0, delta, finish_reason }],
  }) + '\n\n';
  return new Response(chunk({ role: 'assistant', content: text }, null) + chunk({}, 'stop') + 'data: [DONE]\n\n',
    { headers: { 'Content-Type': 'text/event-stream' } });
}

globalThis.fetch = async (url, options) => {
  assert.equal(String(url), 'https://api.z.ai/api/coding/paas/v4/chat/completions', 'Fixture must never contact a remote service.');
  const body = JSON.parse(options.body);
  const context = body.messages.find(message => typeof message.content === 'string' &&
    message.content.startsWith('Authorized conversation and message references (data):\n'));
  assert.ok(!(body.tools ?? []).some(tool => /memory|save/i.test(tool.function.name)));
  if (!context) {
    active.mainCalls++;
    assert.ok(!JSON.stringify(body).includes('Studio asks you only to draft a reusable memory'));
    assert.ok(!JSON.stringify(body).includes(draftText));
    active.memoryReplyGuardSeen = body.messages.some(message =>
      typeof message.content === 'string' && message.content.includes('Do not discuss a memory proposal'));
    return completion(body, publicReply);
  }
  active.draftCalls++;
  assert.deepEqual(body.tools ?? [], []);
  assert.ok(!JSON.stringify(body).includes('Speak naturally about Orchid.'));
  const transcript = JSON.parse(context.content.split('\n').slice(1).join('\n'));
  const draft = JSON.stringify({ draft: draftText, basis: [transcript.at(-1).id] });
  active.draft.resolve();
  await active.release.promise;
  // Deliberately ignore the abort. The host must reject a late valid result.
  active.lateResponse = options.signal.aborted;
  if (active.mode === 'failed') return new Response('{}', { status: 500 });
  return completion(body, draft);
};

try {
  vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  const assembly = await vite.ssrLoadModule('/src/assembly.ts');
  studio = createStudio({ getAssembly: () => assembly, dataDirectory: dir });
  const call = (path, value = {}) => studio.dispatch(path, value);

  async function activate(enabled, expected) {
    const graph = assembly.history(assembly.emptyAssembly());
    assert.ok(graph.apply(assembly.assemblyPatchOperations(graph.graph, {
      name: 'Probe Quellight', instructions: 'Speak naturally about Orchid.', model: assembly.modelId,
    })).ok);
    assert.ok(graph.apply(assembly.configureOperations(graph.graph, 'memory', 'reference', 'recent-10@1')).ok);
    if (enabled) assert.ok(graph.apply(assembly.configureOperations(
      graph.graph, 'memory', 'savedMemory', assembly.governedMemoryValue)).ok);
    const { revision } = await call('/save', { graph: graph.graph, expected: expected ? { id: expected } : undefined });
    const { activation } = await call('/activate', { revision });
    return { version: activation.version, revision: revision.id };
  }

  const off = await activate(false);
  const on = await activate(true, off.revision);
  const evidence = [];
  for (const [mode, activation] of [['off', off], ['success', on], ['failed', on], ['late-stop', on]]) {
    active = { mode, draft: deferred(), release: deferred(), mainCalls: 0, draftCalls: 0 };
    const session = (await call('/sessions', { activation: activation.version })).openedSession;
    const start = performance.now();
    let responseSettled = false;
    const clientDraft = mode === 'off' ? { activation: on.version, savedMemory: assembly.governedMemoryValue,
      canvas: { directive: 'save-preference' } } : {};
    const pending = call('/turn', { session, input, ...clientDraft }).finally(() => { responseSettled = true; });
    let timing = {};
    try {
      if (mode !== 'off') {
        await Promise.race([active.draft.promise, pending.then(() => { throw Error('Turn returned before drafting.'); }), timeout()]);
        const activity = await call('/activity', { session });
        const observed = await call('/run-observe', { session, run: activity.turn, activation: activation.version });
        assert.equal(activity.phase, 'answer');
        assert.ok(observed.stream.events.some(event => event.kind === 'text.delta'));
        const textObservedByMs = ms(performance.now() - start);
        const memory = await call('/memory/run', { run: activity.turn });
        assert.equal(memory.proposal, undefined);
        await delay(150);
        assert.equal(responseSettled, false);
        await assert.rejects(call('/turn', { session, input: 'Continue with an ordinary project update.' }),
          error => error.status === 409);
        timing = { observedPublicTextBeforeDraftReleased: true, textObservedByMs,
          ordinarySendWhileDraftPending: 'busy', draftGateReleasedByMs: ms(performance.now() - start) };
        if (mode === 'late-stop') {
          assert.equal((await call('/stop-turn', { session, run: activity.turn })).status, 'stopping');
        }
      }
    } finally {
      active.release.resolve();
    }
    const result = await pending;
    const run = result.runs.find(row => row.session === session);
    const memory = await call('/memory/run', { run: run.id });
    assert.equal(run.status, 'completed');
    assert.equal(run.activation, activation.version);
    assert.equal(result.sessions.find(row => row.id === session).messages.at(-1).text, publicReply);
    assert.equal(active.mainCalls, 1);
    assert.equal(active.draftCalls, mode === 'off' ? 0 : 1);
    assert.equal(memory.proposal, mode === 'success' ? 'pending' : undefined);
    assert.equal((await call('/memory/session', { session })).proposal?.text, mode === 'success' ? draftText : undefined);
    assert.equal(memory.receipt, undefined);
    const forged = { session, run: run.id, operation: randomUUID(), text: draftText,
      confirmed: true, origin: 'operator', actor: 'other-actor' };
    await assert.rejects(call('/memory/confirm', forged),
      error => error.status === (mode === 'off' ? 403 : 404));
    if (mode === 'failed') assert.equal(memory.request.reason, 'draft-failed');
    if (mode === 'late-stop') {
      assert.equal(active.lateResponse, true);
      assert.equal(memory.request.reason, 'cancelled');
    }
    evidence.push({ mode, ...timing, totalMs: ms(performance.now() - start),
      mainCalls: active.mainCalls, draftCalls: active.draftCalls, reply: run.status,
      baselineReplyGuardSeen: active.memoryReplyGuardSeen, forgedConfirmationRefused: true,
      proposal: memory.proposal ?? 'absent', reason: memory.request?.reason,
      ...(mode === 'late-stop' ? { fixtureReturnedAfterAbort: active.lateResponse } : {}),
    });
  }
  const db = new DatabaseSync(join(dir, 'saved-memory.sqlite'), { readOnly: true });
  let counts;
  try {
    counts = Object.fromEntries(['memories', 'revisions', 'operations', 'save_attempts']
      .map(table => [table, db.prepare('SELECT count(*) AS n FROM ' + table).get().n]));
  } finally {
    db.close();
  }
  assert.deepEqual(counts, { memories: 0, revisions: 0, operations: 0, save_attempts: 0 });
  console.log(JSON.stringify({ source: 'Actual pinned TORI turn pipeline, synthetic provider', cases: evidence,
    beforeAnyOperatorClick: counts }, null, 2));
} finally {
  globalThis.fetch = originalFetch;
  await studio?.close();
  await vite?.close();
  await rm(dir, { recursive: true, force: true });
}
