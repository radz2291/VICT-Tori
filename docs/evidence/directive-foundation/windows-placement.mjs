import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'vite';
import { createStudio } from '../../../server/studio.mjs';
import { baseline, heldOut } from './recognition-cases.mjs';
import { loadCodingCredential } from './windows-coding-loader.mjs';

const parseRows = path => readFileSync(path, 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
const fixtureMode = process.argv.includes('--fixture');
const isRefusal = status => [401, 403, 429].includes(status);
if (!fixtureMode) {
  const fixed = parseRows(process.argv[2]).filter(row => row.id);
  const context = parseRows(process.argv[3]);
  assert.deepEqual(fixed.map(row => row.id), [...baseline, ...heldOut].map(row => row.id));
  assert.equal(context.length, 13, 'Finish the frozen context experiment before paired placement.');
  assert.ok(![...fixed, ...context].some(row => isRefusal(row.http)), 'Coding refusal. Live work is stopped.');
}

const originalFetch = globalThis.fetch;
Object.assign(process.env, {
  TORI_ZAI_API_KEY: fixtureMode ? 'synthetic-a1-fixture' : loadCodingCredential(), TORI_ZAI_ROUTE: 'coding',
  TORI_ENABLE_PI_ZAI: '0', TORI_EXECUTION_FIXTURE: fixtureMode ? 'a1-request-capture' : '',
});
const directory = await mkdtemp(join(tmpdir(), 'tori-directive-live-placement-'));
const elapsed = start => Math.round(performance.now() - start);
const memoryGuide = 'Do not discuss a memory proposal';
const input = 'Please remember that I prefer Orchid updates in exactly two short bullets.';
const followUp = 'Say only “Ready for the Orchid status check.”';
const endpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
let active, refusal, vite, studio;

function telemetry(response, record, start) {
  const decoder = new TextDecoder();
  let pending = '';
  const inspect = line => {
    if (!line.startsWith('data:') || line.trim() === 'data: [DONE]') return;
    let frame;
    try {
      frame = JSON.parse(line.slice(5));
    } catch {
      record.invalidSseFrame = true;
      return;
    }
    if (typeof frame.model === 'string' && /^[\w.-]{1,100}$/.test(frame.model)) record.model = frame.model;
    const choice = frame.choices?.find(item => item.index === 0);
    if (typeof choice?.delta?.content === 'string' && choice.delta.content.length > 0) {
      record.firstProviderTextMs ??= elapsed(start);
    }
    if (typeof choice?.finish_reason === 'string') record.finish = choice.finish_reason;
    if (frame.usage) {
      const { prompt_tokens, completion_tokens, completion_tokens_details } = frame.usage;
      record.usage = Object.fromEntries(Object.entries({
        input: prompt_tokens, output: completion_tokens, reasoning: completion_tokens_details?.reasoning_tokens,
      }).filter(([, value]) => Number.isInteger(value)));
    }
  };
  const body = response.body.pipeThrough(new TransformStream({
    transform(bytes, controller) {
      const lines = (pending + decoder.decode(bytes, { stream: true })).split('\n');
      pending = lines.pop();
      lines.forEach(inspect);
      controller.enqueue(bytes);
    },
    flush() {
      inspect(pending + decoder.decode());
      record.providerStreamCompleteMs = elapsed(start);
    },
  }));
  return new Response(body, { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') } });
}

function fixtureResponse(body, kind) {
  const transcript = body.messages.find(message => String(message.content)
    .startsWith('Authorized conversation and message references (data):\n'));
  const draft = 'I prefer Orchid updates in exactly two short bullets.';
  const text = kind === 'draft' ? JSON.stringify({
    draft, basis: [JSON.parse(transcript.content.split('\n').slice(1).join('\n')).at(-1).id],
  }) : 'Two short bullets would keep an Orchid update clear.';
  const chunk = (delta, finish_reason, usage) => 'data: ' + JSON.stringify({
    id: 'placement-self-check', object: 'chat.completion.chunk', created: 1, model: body.model,
    choices: [{ index: 0, delta, finish_reason }], ...(usage ? { usage } : {}),
  }) + '\n\n';
  return new Response(chunk({ content: text }, null) + chunk({}, 'stop',
    { prompt_tokens: 20, completion_tokens: 10, completion_tokens_details: { reasoning_tokens: 3 }, total_tokens: 30 }) +
    'data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
}

globalThis.fetch = async (url, init) => {
  assert.equal(String(url), endpoint);
  if (refusal) throw Error('Live transport stopped after Coding refusal.');
  const body = JSON.parse(init.body);
  assert.equal(body.model, 'glm-5.3-flash');
  assert.ok(!body.tools?.length);
  const draft = body.messages.some(message => String(message.content)
    .startsWith('Authorized conversation and message references (data):\n'));
  const turn = active;
  const kind = draft ? 'draft' : body.messages.at(-1).content === followUp ? 'follow-up' : 'ordinary';
  const record = { kind, sentByMs: elapsed(turn.start), wireBytes: Buffer.byteLength(init.body),
    hasMemoryReplyGuide: body.messages.some(message => String(message.content).includes(memoryGuide)),
    maxOutputTokens: body.max_tokens };
  turn.wire.push(record);
  let response;
  try {
    response = fixtureMode ? fixtureResponse(body, kind) : await originalFetch(url, { ...init, redirect: 'error' });
  } catch (error) {
    record.error = error.name;
    record.failedByMs = elapsed(turn.start);
    throw error;
  }
  record.http = response.status;
  record.headersByMs = elapsed(turn.start);
  if (isRefusal(response.status)) refusal = { http: response.status, kind, pair: turn.id };
  if (!response.ok) return response;
  if (draft) {
    record.pendingSendCheckedByMs = elapsed(turn.start);
    const activity = await studio.dispatch('/activity', { session: turn.session });
    record.activityAtNextSend = activity.phase;
    try {
      await studio.dispatch('/turn', { session: turn.session, input: followUp });
      record.nextSendWhileDraftPending = 200;
    } catch (error) {
      record.nextSendWhileDraftPending = error.status ?? 500;
    }
    record.pendingCheckCompleteByMs = elapsed(turn.start);
  }
  if (!response.headers.get('content-type')?.includes('text/event-stream') || !response.body) return response;
  return telemetry(response, record, turn.start);
};

try {
  vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  const assembly = await vite.ssrLoadModule('/src/assembly.ts');
  studio = createStudio({ getAssembly: () => assembly, dataDirectory: directory });
  const call = (path, value = {}) => studio.dispatch(path, value);
  async function activate(enabled, previous) {
    const history = assembly.history(assembly.emptyAssembly());
    assert.ok(history.apply(assembly.assemblyPatchOperations(history.graph, {
      name: 'Probe Quellight', instructions: 'Reply in one short, clear sentence about the current request.',
      model: assembly.modelId, maxRetries: 0, maxToolCalls: 0, maxSteps: 1,
    })).ok);
    assert.ok(history.apply(assembly.configureOperations(history.graph, 'memory', 'reference', 'recent-10@1')).ok);
    if (enabled) assert.ok(history.apply(
      assembly.configureOperations(history.graph, 'memory', 'savedMemory', assembly.governedMemoryValue)).ok);
    const { revision } = await call('/save', { graph: history.graph, expected: previous?.revision });
    const { activation } = await call('/activate', { revision });
    return { revision, version: activation.version };
  }

  const off = await activate(false);
  const on = await activate(true, off);
  const design = [[false, true], [true, false]];
  for (const [pairIndex, order] of design.entries()) {
    for (const enabled of order) {
      if (refusal) break;
      const { version } = enabled ? on : off;
      const session = (await call('/sessions', { activation: version })).openedSession;
      const turn = { id: (pairIndex + 1) + (enabled ? '-on' : '-off'), session, start: performance.now(), wire: [] };
      active = turn;
      let firstStudioTextByMs, settled = false;
      const result = call('/turn', { session, input }).finally(() => { settled = true; });
      const observe = (async () => {
        while (!settled && firstStudioTextByMs === undefined) {
          const activity = await call('/activity', { session });
          if (activity.phase === 'answer') firstStudioTextByMs = elapsed(turn.start);
          else await delay(15);
        }
      })();
      const snapshot = await result;
      const turnReturnedMs = elapsed(turn.start);
      await observe;
      const run = snapshot.runs.find(row => row.session === session && !row.parentRun);
      const reply = snapshot.sessions.find(row => row.id === session).messages.find(row => row.id === run.id + '-agent');
      const memory = await call('/memory/run', { run: run.id });
      const endState = { firstStudioTextByMs: firstStudioTextByMs ?? null, turnReturnedMs,
        mainRunStatus: run.status, publicReply: reply?.text, proposalState: memory.proposal ?? 'absent',
        memoryReason: memory.request?.reason, runUsage: run.usage };
      if (!refusal) {
        endState.nextSendAfterReturnAttemptByMs = elapsed(turn.start);
        try {
          const after = await call('/turn', { session, input: followUp });
          endState.nextSendAfterReturn = 200;
          endState.followUpStatus = after.runs.find(row => row.session === session && row.id !== run.id)?.status;
        } catch (error) {
          endState.nextSendAfterReturn = error.status ?? 500;
        }
      }
      console.log(JSON.stringify({ probe: fixtureMode ? 'fixture self-check' : 'live Coding', id: turn.id,
        enabled, input, followUp, ...endState, wire: turn.wire }));
    }
  }
  const db = new DatabaseSync(join(directory, 'saved-memory.sqlite'), { readOnly: true });
  try {
    const rows = Object.fromEntries(['memories', 'revisions', 'operations', 'save_attempts']
      .map(table => [table, db.prepare('SELECT count(*) n FROM ' + table).get().n]));
    assert.deepEqual(rows, { memories: 0, revisions: 0, operations: 0, save_attempts: 0 });
    console.log(JSON.stringify({ unconfirmedStoreRows: rows, refusal: refusal ?? null }));
  } finally {
    db.close();
  }
  if (refusal) process.exitCode = 2;
} finally {
  globalThis.fetch = originalFetch;
  await studio?.close();
  await vite?.close();
  console.error(JSON.stringify({ cleanup: 'after-exit', directory }));
}
