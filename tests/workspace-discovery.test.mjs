import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createServer } from 'vite';
import { workspaceOccurrence } from '../packages/authoring/index.mjs';
import { workspaceCapabilities } from '../server/workspace-actions.mjs';

test('Authoring discovery returns valid open and named draft results with governed memory configured', async () => {
  const vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  try {
    const assembly = await vite.ssrLoadModule('/src/assembly.ts');
    const { add, change, emptyAssembly, governedMemoryValue, history, modelId, wire } = assembly;
    function graph(name) {
      const draft = history(emptyAssembly());
      assert.ok(draft.apply([
        add('agent'), add('model'), add('memory'),
        change('agent', 'name', name), change('agent', 'instructions', 'Read the source.'),
        change('model', 'model', modelId), change('memory', 'reference', 'recent-10@1'),
        change('memory', 'savedMemory', governedMemoryValue), wire('model', 'model'), wire('memory', 'memory'),
      ]).ok);
      return draft.graph;
    }

    const open = graph('Open reviewer');
    const saved = { definition: randomUUID(), id: randomUUID(), graph: graph('Saved reviewer'), number: 1 };
    const openValues = assembly.resolved(open);
    assert.equal(openValues.savedMemory, governedMemoryValue);
    assert.equal(openValues.organizer, 'off');
    const state = { drafts: [saved], sessions: [], runs: [] };
    const [inspect] = workspaceCapabilities({
      snapshot: () => state, assembly, definition: 'tori-local-agent', definitionOf: item => item.definition,
      persistRun: () => {}, run: { authoringActions: [] }, session: { id: randomUUID() },
      draftTurn: {
        allowChanges: false,
        discover: () => ({ draftId: randomUUID(), occurrenceId: workspaceOccurrence, revision: open.revision }),
      },
      target: { values: openValues, readiness: 'ready' },
    });
    const parsed = inspect.output.parse(await inspect.invoke({ definitionId: saved.definition }, {
      victIdempotencyKey: randomUUID(),
    }));
    assert.ok(parsed.ok, JSON.stringify(parsed.issues));
    const { openDraft, definition, availableActions, contextSources, tools } = parsed.value;
    assert.equal(openDraft.name, 'Open reviewer');
    assert.equal(openDraft.memory, 'recent-10@1');
    assert.equal(definition.name, 'Saved reviewer');
    assert.equal(definition.savedRevision, saved.id);
    assert.equal(definition.memory, 'recent-10@1');
    for (const draft of [openDraft, definition]) {
      assert.equal(Object.hasOwn(draft, 'savedMemory'), false);
      assert.equal(Object.hasOwn(draft, 'organizer'), false);
    }
    assert.deepEqual(availableActions, ['inspect']);
    assert.ok(contextSources.some(source => source.value === 'studio-research@1'));
    assert.ok(tools.some(tool => tool.label.startsWith('Research Topics')));
  } finally {
    await vite.close();
  }
});
