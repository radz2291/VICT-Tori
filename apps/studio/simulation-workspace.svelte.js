import { projectKey } from './project-storage.js';

export const simulationOutcomes = [
  ['succeeded', 'Success'], ['waiting', 'Waiting for review'], ['failed', 'Tool failure'],
  ['denied', 'Protected action denied'], ['cancelled', 'Cancelled'], ['interrupted', 'Interrupted'],
].map(([value, label]) => ({ value, label }));

export const defaultModes = [{ id: 'assist', name: 'Assist', enabled: true }];

const origin = 'simulation';
const key = projectKey('tori.studio.operations.v1');
const empty = () => ({ schema: 1, sessions: [], runs: [], settings: { modes: defaultModes, capabilities: [], evaluations: [] } });

function read() {
  const raw = localStorage.getItem(key);
  if (raw === null) return empty();
  const state = JSON.parse(raw);
  if (state.schema !== 1 || !Array.isArray(state.sessions) || !Array.isArray(state.runs)
    || !Array.isArray(state.settings?.modes) || !Array.isArray(state.settings?.capabilities)
    || !Array.isArray(state.settings?.evaluations)) throw new Error('Unsupported operational workspace');
  return state;
}

function record(outcome, input, definition, sessionId, intent) {
  const id = crypto.randomUUID();
  const recordedAt = new Date().toISOString();
  const event = (suffix, data) => ({ id: id + ':' + suffix, origin, recordedAt, ...data });
  const details = {
    succeeded: ['Completed simulation', 'Synthetic result is ready.'],
    waiting: ['Waiting for human review', 'Review is pending.'],
    failed: ['Synthetic tool error', 'The sample tool returned FIXTURE_TOOL_ERROR.'],
    denied: ['Protected action refused', 'This simulation does not dispatch or replay protected effects.'],
    cancelled: ['Cancelled fixture', 'The simulated operation was cancelled.'],
    interrupted: ['Interrupted fixture', 'The simulated worker stopped before completing.'],
  }[outcome];
  return {
    id, sessionId, definition, origin, intent, status: outcome, cost: null, recordedAt,
    events: [event('request', {
      name: 'Request accepted by U0 adapter', status: 'succeeded', input,
      children: [event('step', {
        name: definition?.coordinator ? 'Workflow step fixture' : 'Session adapter fixture', status: outcome,
        input: { target: definition?.id ?? null, revision: definition?.revision ?? null, capability: definition?.aiStep ?? 'Deterministic adapter' },
        children: [event('result', {
          name: details[0], status: outcome,
          output: outcome === 'succeeded' ? details[1] : null,
          error: ['failed', 'denied', 'interrupted'].includes(outcome) ? details[1] : null,
          detail: details[1],
        })],
      })],
    })],
  };
}

export class SimulationWorkspace {
  data = $state(empty());
  error = $state('');

  constructor() {
    this.refresh();
  }

  refresh() {
    try { this.data = read(); this.error = ''; }
    catch { this.error = 'Could not read the local simulation workspace. Existing data was retained.'; }
  }

  update(change) {
    try {
      const state = read();
      const result = change(state);
      localStorage.setItem(key, JSON.stringify(state));
      this.data = state;
      this.error = '';
      return result;
    } catch {
      this.error = 'Could not save the simulation workspace. Existing data was retained.';
    }
  }

  createSession(definition = null) {
    return this.update(state => {
      const id = crypto.randomUUID();
      state.sessions.push({ id, definition, origin, title: definition?.label ?? 'Conversation ' + (state.sessions.length + 1), messages: [] });
      return id;
    });
  }

  simulate({ definition, sessionId, input, outcome, mode, intent = 'Run definition' }) {
    return this.update(state => {
      let session = state.sessions.find(item => item.id === sessionId);
      if (!session) {
        session = { id: crypto.randomUUID(), definition, origin, title: definition?.label ?? 'Conversation ' + (state.sessions.length + 1), messages: [] };
        state.sessions.push(session);
      }
      const protectedEffect = session.definition?.protectedEffect || session.definition?.type === 'quellight-action';
      let runDefinition = session.definition;
      if (sessionId && runDefinition?.creative) {
        const { creative, ...identity } = runDefinition;
        runDefinition = {
          ...identity,
          sourceArtifactId: creative.reusedArtifactId || (creative.artifact ? session.messages[0]?.runId + ':artifact' : null),
        };
      }
      const run = record(protectedEffect ? 'denied' : outcome, {
        text: input, mode,
        ...(session.definition?.coordinator ? { coordinator: session.definition.coordinator } : {}),
        ...(session.definition?.branch ? { branch: session.definition.branch } : {}),
        ...(session.definition?.workspaceContext ? { workspaceContext: session.definition.workspaceContext } : {}),
      }, runDefinition, session.id, intent);
      const result = run.events[0].children[0].children[0];
      session.messages.push(
        { id: run.id + ':input', runId: run.id, role: 'You', text: input, mode, origin: 'authored' },
        { id: run.id + ':reply', runId: run.id, role: 'Simulation', text: result.detail, status: run.status, mode, origin }
      );
      state.runs.push(run);
      return run;
    });
  }
}
