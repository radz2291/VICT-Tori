import { createHash, randomUUID } from 'node:crypto';
import { commitDraftEdit } from '@victframework/control/draft-authoring';
import { toCanonicalJson } from '@victframework/runtime';
import { createWorkspaceCapabilities, workspaceOccurrence } from '../packages/authoring/index.mjs';
import { registeredTool, registeredTools } from '../src/registered-tools.mjs';
import { sources } from './a3-catalog.mjs';

export const operationDigest = value => createHash('sha256').update(toCanonicalJson(value)).digest('hex');
export const knownOperation = (state, id) => state.workspaceOperations?.[id];
export function rememberOperation(state, id, entry) {
  state.workspaceOperations ??= {};
  state.workspaceOperations[id] = entry;
}

function saveIdentity(operationId) {
  const hex = operationDigest({ save: operationId });
  return [hex.slice(0, 8), hex.slice(8, 12), '4' + hex.slice(13, 16),
    '8' + hex.slice(17, 20), hex.slice(20, 32)].join('-');
}

const present = value => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));

export function runEvidence(state, run) {
  if (!run) return undefined;
  const session = state.sessions.find(item => item.id === run.session);
  return present({
    id: run.id, name: run.name, session: run.session, revision: run.revision, activation: run.activation,
    status: run.status, fixture: !!run.fixture, errorCode: run.errorCode,
    input: run.input ?? session?.messages.find(item => item.id === run.id + '-user')?.text,
    output: run.output ?? session?.messages.find(item => item.id === run.id + '-agent')?.text,
    context: run.context, scripts: run.scriptReceipts ?? [],
    children: state.runs.filter(child => child.parentRun === run.id).map(child => runEvidence(state, child)),
  });
}

function patchIssue(patch, assembly) {
  if (patch.model !== undefined && patch.model !== assembly.modelId) return 'Choose the available model from discovery.';
  if (patch.context !== undefined && !Object.hasOwn(sources, patch.context)) return 'Choose an approved context revision from discovery.';
  if (patch.tool !== undefined && !registeredTool(patch.tool)) return 'Choose an approved registered script tool from discovery.';
}

function initialGraph(assembly, patch, context, role) {
  const before = assembly.emptyAssembly();
  const draftId = randomUUID();
  const journal = assembly.history(before);
  const operations = assembly.assemblyPatchOperations(before, patch);
  const edit = JSON.stringify(patch);
  const editDigest = createHash('sha256').update(JSON.stringify(edit)).digest('hex');
  let receipt;
  commitDraftEdit({
    actorId: context.victActorId, turnId: context.victTurnId,
    operationId: context.victIdempotencyKey + ':' + role,
    draftId, occurrenceId: workspaceOccurrence, expectedRevision: before.revision, edit, editDigest,
  }, context.signal, {
    resolveDraft: () => ({ draftId, occurrenceId: workspaceOccurrence, revision: journal.graph.revision }),
    readReceipt: () => undefined,
    apply: () => {
      const result = journal.apply(operations, before.revision);
      return result.ok ? { status: 'applied', revision: result.graph.revision } : { status: 'invalid' };
    },
    recordReceipt: result => { receipt = result; },
  });
  return { before, graph: journal.graph, operations, receipt };
}

export function workspaceCapabilities({
  snapshot, store, assembly, definition, definitionOf, createDefinition, saveDefinition, persistRun,
  draftTurn, target, route, session, run, test,
}) {
  function note(action, context, result) {
    if (!run.authoringActions.some(item => item.operationId === context.victIdempotencyKey)) {
      run.authoringActions.push({
        action, operationId: context.victIdempotencyKey, at: new Date().toISOString(), result,
      });
      persistRun(run);
    }
    return result;
  }
  function reject(action, context, message, status = 'denied') {
    return note(action, context, { status, message });
  }

  return createWorkspaceCapabilities({
    async inspect({ runId, definitionId }, context) {
      const open = await draftTurn.discover(context);
      const state = snapshot();
      const saved = state.drafts.filter((item, index, all) =>
        all.findIndex(candidate => definitionOf(candidate) === definitionOf(item)) === index);
      const tested = runId ? state.runs.find(item => item.id === runId) :
        state.runs.find(item => item.authoringSession === session.id && !item.parentRun);
      const requested = definitionId && saved.find(item => definitionOf(item) === definitionId);
      const observed = runEvidence(state, tested);
      const result = {
        status: (runId && !observed) || (definitionId && !requested) ? 'not-found' : 'observed',
        scope: draftTurn.allowChanges ? 'assemble, edit, save and test' : 'read only',
        availableActions: draftTurn.allowChanges ? ['inspect', 'assemble', 'edit', 'test'] : ['inspect'],
        model: assembly.modelId,
        definitions: saved.map(item => ({
          id: definitionOf(item), name: assembly.resolved(item.graph).name, savedRevision: item.id, number: item.number,
        })),
        contextSources: assembly.resourceChoices.context,
        tools: registeredTools,
        ...(open ? { openDraft: present({
          ...open, definitionId: definition, savedRevision: target.savedRevision ?? null,
          ...target.values, readiness: target.readiness,
        }) } : {}),
        ...(requested ? { definition: present({ id: definitionId, savedRevision: requested.id, ...assembly.resolved(requested.graph) }) } : {}),
        ...(observed ? { run: observed } : {}),
      };
      note('inspect', context, { status: result.status, ...(observed ? { runId: observed.id } : {}),
        ...(open ? { definitionId: definition, draftId: open.draftId, revision: open.revision } : {}) });
      return result;
    },

    assemble(args, context) {
      const state = snapshot();
      const operationId = context.victIdempotencyKey;
      const fingerprint = operationDigest(args);
      const prior = knownOperation(state, operationId);
      if (prior) return prior.kind === 'assemble' && prior.fingerprint === fingerprint
        ? note('assemble', context, prior.result) : reject('assemble', context, 'This operation already has a different result.', 'operation-conflict');
      if (context.signal.aborted || draftTurn.signal.aborted) return reject('assemble', context, 'Stopped before creating a draft.', 'cancelled');

      for (const patch of [args.agent, args.specialist].filter(Boolean)) {
        const issue = patchIssue(patch, assembly);
        if (issue) return reject('assemble', context, issue);
      }
      const revisions = [];
      const create = (role, fields) => {
        const patch = { ...fields };
        if (role === 'agent' && args.specialist && args.save) patch.childRevision = revisions[0].savedRevision;
        if ((patch.tool || patch.childRevision) && patch.maxSteps === undefined) patch.maxSteps = 2;
        const initial = initialGraph(assembly, patch, context, role);
        if (initial.receipt.status !== 'applied') return false;
        const id = createDefinition(state);
        const saved = args.save ? saveDefinition(state, id, null, initial.graph, assembly) : undefined;
        if (!saved) {
          state.workingAssemblies ??= {};
          state.workingAssemblies[id] = initial;
        }
        revisions.push({
          role, definitionId: id, name: fields.name, savedRevision: saved?.id ?? null, number: saved?.number ?? null,
          readiness: assembly.readiness(initial.graph, route) || 'ready', receipt: initial.receipt,
        });
        return true;
      };
      if ((args.specialist && !create('specialist', args.specialist)) || !create('agent', args.agent)) {
        return reject('assemble', context, 'The initial draft did not commit.', context.signal.aborted ? 'cancelled' : 'invalid');
      }
      const result = { status: args.save ? 'saved' : 'created', definitions: revisions,
        ...(args.specialist && !args.save ? { message: 'Save the specialist before pinning its revision to the primary agent.' } : {}) };
      rememberOperation(state, operationId, { kind: 'assemble', runId: run.id, fingerprint, result });
      store(state);
      return note('assemble', context, result);
    },

    async edit({ draftId, expectedRevision, patch, save }, context) {
      const issue = patchIssue(patch, assembly);
      if (issue) return reject('edit', context, issue);
      if (patch.childRevision) {
        const child = snapshot().drafts.find(item => item.id === patch.childRevision);
        if (!child || definitionOf(child) === definition || assembly.readiness(child.graph, route) ||
            assembly.resolved(child.graph).authoring || assembly.resolved(child.graph).child) {
          return reject('edit', context, 'Choose a ready saved specialist without authoring or delegation.');
        }
      }
      const open = await draftTurn.discover(context);
      if (!open) return reject('edit', context, 'Open the agent definition you want to edit.');
      const saveOnlyRevision = save && !Object.keys(patch).length ? saveIdentity(context.victIdempotencyKey) : undefined;
      const result = await draftTurn.apply({
        draftId: draftId ?? open.draftId, expectedRevision: expectedRevision ?? open.revision,
        occurrenceId: workspaceOccurrence, edit: JSON.stringify({ patch, save: save === true, saveOnlyRevision }),
      }, context);
      if (result.status !== 'confirmed') return note('edit', context, result);
      const saved = knownOperation(snapshot(), context.victIdempotencyKey)?.result;
      return note('edit', context, {
        status: result.receipt.status, definitionId: definition, receipt: result.receipt,
        ...(saved?.id ? { savedRevision: saved.id, number: saved.number, readiness: saved.readiness } : {}),
        ...(saved ? { saveStatus: saved.status } : {}),
      });
    },

    async test(args, context) {
      const result = await test(args, context);
      return note('test', context, result);
    },
  });
}
