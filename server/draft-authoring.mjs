import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { workspaceOccurrence } from '../packages/authoring/index.mjs';
import { createDraftAuthoring } from '@victframework/control/draft-authoring';

export const editGrant = 'tori.draft.instructions.edit';
export const authoringRefs = [
  { id: 'tori.draft.discover', revision: '1' },
  { id: 'tori.draft.instructions', revision: '1' },
];
export const instructionOccurrences = ['agent.instructions', 'instructions.text'];
const tokenHash = token => createHash('sha256').update(token).digest('hex');
const validToken = token => typeof token === 'string' && /^[a-f0-9-]{36}$/.test(token);
const validRevision = value => Number.isSafeInteger(value) && value >= 0;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const contract = (id, schema, accepts) => ({
  id, revision: '1', descriptiveJsonSchema: schema,
  parse: value => accepts(value) ? { ok: true, value } : {
    ok: false, issues: [{ code: 'INVALID', path: 'input', message: 'Invalid draft authoring data.' }],
  },
});
const objectOutput = contract('tori.draft.result', { type: 'object' }, record);
const fields = ['draftId', 'occurrenceId', 'expectedRevision', 'edit'];
const statuses = ['applied', 'stale', 'cancelled', 'denied', 'invalid'];
const bindingFields = ['actorId', 'turnId', 'operationId', 'draftId', 'occurrenceId', 'expectedRevision', 'editDigest'];

export function validAuthoringTarget(value, workspace) {
  return record(value) && validToken(value.channel) && validToken(value.draftId) && validRevision(value.revision) &&
    (workspace ? value.occurrenceId === workspaceOccurrence && typeof value.hasDraft === 'boolean' &&
      ['inspect', 'change'].includes(value.mode) : instructionOccurrences.includes(value.occurrenceId));
}

/** Loopback transport. Only the editor that started the turn holds its channel token. */
export function createAuthoringTransport(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS authoring_operation (
    id TEXT PRIMARY KEY, run TEXT NOT NULL, channel TEXT NOT NULL,
    binding TEXT NOT NULL, receipt TEXT, received TEXT
  )`);
  const operation = db.prepare('SELECT * FROM authoring_operation WHERE id=?');
  const insert = db.prepare('INSERT OR IGNORE INTO authoring_operation (id,run,channel,binding) VALUES (?,?,?,?)');
  const confirm = db.prepare('UPDATE authoring_operation SET receipt=?, received=? WHERE id=? AND receipt IS NULL');
  const receipts = db.prepare('SELECT receipt,received FROM authoring_operation WHERE run=? AND receipt IS NOT NULL ORDER BY received,id');

  function acknowledge(channel, receipt, graph, saveDraft, readSave) {
    if (!validToken(channel) || !record(receipt) || typeof receipt.operationId !== 'string') return false;
    const entry = operation.get(receipt.operationId);
    if (!entry || entry.channel !== tokenHash(channel)) return false;
    const binding = JSON.parse(entry.binding);
    if (!bindingFields.every(key => binding[key] === receipt[key]) || !statuses.includes(receipt.status)) return false;
    const revision = ['applied', 'stale'].includes(receipt.status);
    if (revision && (!validRevision(receipt.revision) || receipt.revision === binding.expectedRevision)) return false;
    if (receipt.status === 'applied' && receipt.revision !== binding.expectedRevision + 1) return false;
    const identity = Object.fromEntries(bindingFields.map(key => [key, binding[key]]));
    const clean = JSON.stringify({ ...identity, status: receipt.status, ...(revision ? { revision: receipt.revision } : {}) });
    if (entry.receipt !== null) return entry.receipt === clean && {
      accepted: true, saved: readSave(receipt.operationId),
    };
    if (!binding.save || receipt.status !== 'applied') {
      return confirm.run(clean, new Date().toISOString(), receipt.operationId).changes === 1 && { accepted: true };
    }
    // The saved revision and its VICT receipt have one SQLite commit boundary.
    if (!graph || graph.revision !== receipt.revision) return false;
    db.exec('BEGIN IMMEDIATE');
    try {
      const saved = saveDraft(binding, graph);
      confirm.run(clean, new Date().toISOString(), receipt.operationId);
      db.exec('COMMIT');
      return { accepted: true, saved };
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function start({ channel, draftId, occurrenceId, revision, hasDraft, savedRevision }, actorId, turnId, deadlineAt, definition) {
    const hash = tokenHash(channel);
    const stop = new AbortController();
    const pending = new Map();
    const scope = { draftId, occurrenceId, revision };
    const matches = key => key.actorId === actorId && key.turnId === turnId;
    const authoring = createDraftAuthoring({
      resolveDraft: key => matches(key) && hasDraft !== false ? scope : undefined,
      readReceipt: key => {
        if (!matches(key)) return undefined;
        const receipt = operation.get(key.operationId)?.receipt;
        return receipt ? JSON.parse(receipt) : undefined;
      },
      async commit(proposal, signal) {
        const binding = Object.fromEntries(bindingFields.map(key => [key, proposal[key]]));
        if (occurrenceId === workspaceOccurrence && JSON.parse(proposal.edit).save === true) {
          binding.save = { definition, expected: savedRevision ?? null, deadlineAt };
        }
        const serialized = JSON.stringify(binding);
        insert.run(proposal.operationId, turnId, hash, serialized);
        const registered = operation.get(proposal.operationId);
        if (registered?.binding !== serialized || registered.channel !== hash) return;
        if (registered.receipt !== null) return;
        pending.set(proposal.operationId, proposal);
        const until = Math.min(deadlineAt, Date.now() + 12000);
        try {
          while (Date.now() < until && !signal.aborted && !stop.signal.aborted) {
            if (operation.get(proposal.operationId)?.receipt) return;
            await delay(60);
          }
        } finally {
          pending.delete(proposal.operationId);
        }
      },
    });
    const outcomes = [];
    const refusals = [];
    const discover = context => authoring.discover({ actorId: context.victActorId, turnId: context.victTurnId });
    const apply = async (args, context) => {
      const result = await authoring.apply({
        actorId: context.victActorId, turnId: context.victTurnId,
        operationId: context.victIdempotencyKey, signal: context.signal,
      }, args);
      outcomes.push(result);
      if (result.status !== 'confirmed') {
        refusals.push({ at: new Date().toISOString(), label: 'Draft edit · ' + result.status });
      }
      return result;
    };
    const capabilities = [
      {
        ...authoringRefs[0], effect: 'read', description: 'Discover the exact open instruction field, its current revision and text.',
        input: contract('tori.draft.discovery.input', { type: 'object', properties: {}, additionalProperties: false },
          value => record(value) && Object.keys(value).length === 0),
        output: objectOutput,
        async invoke(_args, context) {
          const target = await discover(context);
          return target ? { ...target, instructions: scope.instructions } : { status: 'denied' };
        },
      },
      {
        ...authoringRefs[1], effect: 'write', permissions: [editGrant],
        description: 'Replace the instructions on the exact draft occurrence returned by discovery. Use the discovered revision and preserve other instructions.',
        input: contract('tori.draft.instructions.input', {
          type: 'object', properties: {
            draftId: { type: 'string' }, occurrenceId: { type: 'string' },
            expectedRevision: { type: 'integer' }, edit: { type: 'string', minLength: 1, maxLength: 12000 },
          }, required: fields, additionalProperties: false,
        }, value => record(value) && Object.keys(value).length === fields.length &&
          fields.every(key => Object.hasOwn(value, key)) && typeof value.draftId === 'string' &&
          typeof value.occurrenceId === 'string' && validRevision(value.expectedRevision) &&
          typeof value.edit === 'string' && !!value.edit.trim() && value.edit.length <= 12000),
        output: objectOutput,
        invoke: apply,
      },
    ];
    return {
      capabilities, discover, apply, outcomes, refusals, signal: stop.signal,
      setInstructions: instructions => { scope.instructions = instructions; },
      matches: candidate => validToken(candidate) && tokenHash(candidate) === hash,
      stop: () => stop.abort(),
      poll: () => ({ actorId, turnId, deadlineAt, stopped: stop.signal.aborted, proposals: [...pending.values()] }),
    };
  }

  return {
    start, acknowledge,
    receipts: runId => receipts.all(runId).map(row => ({ ...JSON.parse(row.receipt), at: row.received })),
  };
}

