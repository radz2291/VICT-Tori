import assert from 'node:assert/strict';
import { createWorkspaceCapabilities, workspaceOccurrence, workspaceRefs } from '@tori-studio/authoring';
import { commitDraftEdit, createDraftAuthoring } from '@victframework/control/draft-authoring';
import { gateCapabilityInvoke } from '@victframework/runtime';

const actorId = 'consumer-owner';
const turnId = 'consumer-turn';
const draftId = 'df1d2c0e-ed4e-4b69-8034-b22613828771';
let document = { name: 'Independent draft', revision: 7 };
let commits = 0;
const receipts = new Map();
const resolveDraft = context => context.actorId === actorId && context.turnId === turnId
  ? { draftId, occurrenceId: workspaceOccurrence, revision: document.revision } : undefined;
const journal = {
  resolveDraft,
  readReceipt: key => receipts.get(key.operationId),
  apply({ edit }) {
    document = { ...document, ...JSON.parse(edit), revision: document.revision + 1 };
    commits++;
    return { status: 'applied', revision: document.revision };
  },
  recordReceipt: receipt => receipts.set(receipt.operationId, receipt),
};
const authoring = createDraftAuthoring({
  ...journal,
  commit(proposal, signal) {
    commitDraftEdit(proposal, signal, journal);
    throw new Error('Synthetic loss after the journal commits');
  },
});
const actions = createWorkspaceCapabilities({
  inspect: async () => ({ status: 'observed' }),
  assemble: () => { throw new Error('Assembly is outside this consumer scope.'); },
  test: () => { throw new Error('Execution is outside this consumer scope.'); },
  async edit({ draftId, expectedRevision, patch }, context) {
    const result = await authoring.apply({
      actorId: context.victActorId, turnId: context.victTurnId,
      operationId: context.victIdempotencyKey, signal: context.signal,
    }, { draftId, occurrenceId: workspaceOccurrence, expectedRevision, edit: JSON.stringify(patch) });
    return result.status === 'confirmed' ? { status: result.receipt.status, receipt: result.receipt } : result;
  },
});
assert.deepEqual(actions.map(({ id, revision }) => ({ id, revision })), workspaceRefs);
const edit = actions.find(item => item.id.endsWith('.edit'));
const valid = edit.input.parse({ draftId, expectedRevision: 7, patch: { name: 'Field Notes' } });
assert.equal(valid.ok, true);
assert.equal(edit.input.parse({ ...valid.value, grants: ['admin'] }).ok, false);
assert.equal(edit.input.parse({ ...valid.value, patch: { shell: 'example' } }).ok, false);
const operation = (id, signal = new AbortController().signal) => ({
  victActorId: actorId, victTurnId: turnId, victIdempotencyKey: id, signal,
});
await assert.rejects(gateCapabilityInvoke(edit)(valid.value, operation('denied')),
  { code: 'VICT_RUNTIME_PERMISSION_DENIED' });
assert.equal(commits, 0);
const permitted = gateCapabilityInvoke(edit, { grants: edit.permissions });
const exact = await permitted(valid.value, operation('once'));
assert.equal(edit.output.parse(exact).ok, true);
assert.equal(exact.receipt.status, 'applied');
assert.deepEqual(await permitted(valid.value, operation('once')), exact);
assert.equal((await permitted({ ...valid.value, patch: { name: 'Other' } }, operation('once'))).status, 'operation-conflict');
assert.equal((await permitted(valid.value, operation('stale'))).status, 'stale');
const stopped = AbortSignal.abort();
assert.equal((await permitted({ ...valid.value, expectedRevision: 8 }, operation('stop', stopped))).status, 'cancelled');
assert.deepEqual(document, { name: 'Field Notes', revision: 8 });
assert.equal(commits, 1);
console.log(JSON.stringify({ package: '@tori-studio/authoring', references: workspaceRefs, commits, receipt: exact.receipt }));
