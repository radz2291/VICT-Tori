import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createServer } from 'vite';
import { workspaceBinding, workspaceOccurrence } from '../packages/authoring/index.mjs';
import { createStudio } from '../server/studio.mjs';

test('authoring restores completed history and a prior test after a deadline and restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tori-authoring-continuity-'));
  const vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  const originalFetch = globalThis.fetch;
  let studio;
  try {
    Object.assign(process.env, { TORI_ZAI_ROUTE: 'coding', TORI_ZAI_API_KEY: 'synthetic-a1-fixture' });
    await import('./authoring-provider-fixture.mjs');
    const fixtureFetch = globalThis.fetch;
    const requests = [];
    globalThis.fetch = (url, init) => {
      requests.push(JSON.parse(init.body));
      return fixtureFetch(url, init);
    };

    const assembly = await vite.ssrLoadModule('/src/assembly.ts');
    const { add, change, emptyAssembly, history, modelId, wire } = assembly;
    const start = turnDeadlineMs => createStudio({
      getAssembly: () => assembly, dataDirectory: directory, turnDeadlineMs,
    });
    studio = start();
    const draft = history(emptyAssembly());
    assert.equal(draft.apply([
      add('agent'), add('model'), add('authoring'), add('memory'),
      change('agent', 'name', 'Authoring Agent'),
      change('agent', 'maxSteps', 4),
      change('agent', 'instructions', 'Use the Studio catalog and report the exact saved Run.'),
      change('model', 'model', modelId),
      change('authoring', 'reference', workspaceBinding),
      change('memory', 'reference', 'recent-10@1'),
      wire('model', 'model'), wire('authoring', 'authoring'), wire('memory', 'memory'),
    ]).ok, true);
    const { revision } = await studio.dispatch('/save', { graph: draft.graph });
    const { activation } = await studio.dispatch('/activate', { revision });
    const dock = () => studio.dispatch('/sessions', { activation: activation.version, authoringDock: true });
    const turn = (session, input, mode = 'inspect') => studio.dispatch('/turn', {
      session, input, draftTarget: {
        channel: randomUUID(), draftId: randomUUID(), occurrenceId: workspaceOccurrence,
        revision: draft.graph.revision, savedRevision: revision.id, mode, hasDraft: false,
      },
    });

    const original = (await dock()).openedSession;
    const build = await turn(original, 'Please build and save Quellight and run the specialist test.', 'change');
    assert.equal(build.runs[0].status, 'completed', JSON.stringify(build.runs[0]));
    const previousTest = build.runs.find(run => run.authoringSession === original && !run.parentRun);
    assert.equal(previousTest.status, 'completed');

    const { openedSession: continued } = await studio.dispatch('/sessions', { activation: activation.version });
    await studio.close();
    studio = undefined;
    // Reproduce the shape persisted by the previous automatic rollover.
    const db = new DatabaseSync(join(directory, 'studio.sqlite'));
    try {
      const project = JSON.parse(db.prepare('SELECT value FROM project WHERE id=1').get().value);
      project.sessions.find(session => session.id === original).interrupted = true;
      project.sessions.find(session => session.id === continued).authoringDock = true;
      db.prepare('UPDATE project SET value=? WHERE id=1').run(JSON.stringify(project));
    } finally {
      db.close();
    }

    studio = start(2500);
    const timeout = await turn(continued, 'Please wait for the authoring deadline.');
    assert.equal(timeout.runs[0].status, 'cancelled');
    assert.equal(timeout.runs[0].errorCode, 'TORI_TURN_DEADLINE');
    assert.match(requests.at(-1).messages.findLast(message => message.role === 'user').content, /authoring deadline/);
    await studio.close();
    studio = undefined;

    studio = start();
    const restored = await dock();
    assert.equal(restored.openedSession, continued);
    assert.deepEqual(restored.authoringChats[0], {
      activation: activation.version, session: continued, sessionIds: [original, continued], testRun: previousTest.id,
    });
    assert.equal(restored.sessions.find(session => session.id === continued).messages.length, 1);
    const resumed = await turn(continued, 'Please review that Run after the deadline.');
    assert.equal(resumed.runs[0].status, 'completed', JSON.stringify(resumed.runs[0]));
    assert.equal(resumed.runs[0].session, continued);
    assert.equal(resumed.runs[0].authoringActions[0].result.runId, previousTest.id);
    assert.equal(resumed.sessions.find(session => session.id === continued).interrupted, undefined);
    assert.equal(resumed.sessions.filter(session => session.authoringDock).length, 2);
    assert.equal(resumed.runs.filter(run => run.authoringSession).length, 1, 'Continuing must not replay the test.');

    for (let marker = 1; marker <= 6; marker++) {
      const next = await turn(continued, 'Authoring memory marker ' + marker + '.');
      assert.equal(next.runs[0].status, 'completed');
    }
    const messages = requests.at(-1).messages.filter(message => ['user', 'assistant'].includes(message.role));
    assert.equal(messages.length, 11);
    assert.deepEqual(messages.filter(message => message.role === 'user').map(message => message.content),
      Array.from({ length: 6 }, (_, index) => 'Authoring memory marker ' + (index + 1) + '.'));
    assert.equal((await dock()).authoringChats[0].testRun, previousTest.id);
  } finally {
    globalThis.fetch = originalFetch;
    await studio?.close();
    await vite.close();
  }
});
