import { emptyGraphV3, serializeGraphV3 } from '@victframework/ui-flow-svelte/model';

const port = (id, direction, type) => ({
  id,
  label: id,
  direction,
  type,
  ...(direction === 'input' ? { maxConnections: 1 } : {}),
});

export const workflowNodeTypes = [
  { id: 'request', label: 'Request', parameters: {}, ports: [port('Brief', 'output', 'brief')] },
  {
    id: 'run-agent',
    label: 'Run agent',
    parameters: { resource: { type: 'string', default: '', label: 'Agent reference' } },
    ports: [port('Brief', 'input', 'brief'), port('Proposal', 'output', 'proposal')],
  },
  {
    id: 'decision',
    label: 'Decision',
    parameters: {},
    ports: [port('Proposal', 'input', 'proposal'), port('Review', 'output', 'review')],
  },
  {
    id: 'human-review',
    label: 'Human review',
    parameters: {},
    ports: [port('Review', 'input', 'review'), port('Approval', 'output', 'approval')],
  },
  {
    id: 'quellight-action',
    label: 'Quellight action',
    parameters: {},
    ports: [port('Approval', 'input', 'approval')],
  },
];

export function newWorkflowSource() {
  return serializeGraphV3({
    ...emptyGraphV3(), nodeTypes: workflowNodeTypes,
    edgeDefaults: { color: 'token:muted', width: 2, endArrow: 'closed' },
  });
}
