import { emptyGraphV3, parseGraphV3, serializeGraphV3 } from '@victframework/ui-flow-svelte/model';

const port = (id, direction, type, label = id) => ({
  id, label, direction, type,
  ...(direction === 'input' ? { maxConnections: 1 } : {}),
});
const field = (label, value = '') => ({ type: 'string', default: value, label });

export const workflowNodeTypes = [
  { id: 'request', label: 'Request', parameters: {
    brief: field('Request brief'), creativeSource: field('Creative source'), creativeRevision: field('Creative revision'),
    creativeContext: field('Creative context'),
  }, ports: [port('Brief', 'output', 'brief', 'Request brief')] },
  {
    id: 'run-agent', label: 'Run agent',
    parameters: {
      resource: field('Agent reference'), resourceRevision: field('Agent revision'),
      task: field('Invocation task'),
    },
    ports: [port('Brief', 'input', 'brief', 'Input brief'), port('Proposal', 'output', 'proposal')],
  },
  {
    id: 'decision', label: 'Decision',
    parameters: {
      routing: field('Routing strategy', 'exclusive'), noMatch: field('When no branch matches', 'wait'),
      primaryCondition: field('Review match'), specialistCondition: field('Specialist match'),
    },
    ports: [
      port('Proposal', 'input', 'proposal'), port('Review', 'output', 'review', 'Primary review'),
      port('Specialist', 'output', 'review', 'Specialist review'),
    ],
  },
  {
    id: 'human-review', label: 'Human review',
    parameters: { prompt: field('Review instructions') },
    ports: [port('Review', 'input', 'review', 'Review request'), port('Approval', 'output', 'approval')],
  },
  {
    id: 'quellight-action', label: 'Quellight action',
    parameters: { action: field('Requested action', 'daily-desk-proposal') },
    ports: [port('Approval', 'input', 'approval')],
  },
  {
    id: 'output', label: 'Research output',
    parameters: { format: field('Output format', 'summary') },
    ports: [port('Approval', 'input', 'approval', 'Reviewed result')],
  },
];

const descriptors = new Map(workflowNodeTypes.map(type => [type.id, type]));
export const workflowType = id => descriptors.get(id);

export function newWorkflowSource() {
  return serializeGraphV3({
    ...emptyGraphV3(), nodeTypes: workflowNodeTypes,
    edgeDefaults: { color: 'token:muted', width: 2, endArrow: 'closed' },
  });
}

export function upgradeWorkflowSource(source) {
  const parsed = parseGraphV3(source);
  if (!parsed.ok) return source;
  const graph = parsed.graph;
  const types = graph.nodeTypes.map(type => {
    const registered = workflowType(type.id);
    if (!registered) return type;
    const known = new Map(registered.ports.map(port => [port.id, port]));
    return {
      ...type,
      parameters: { ...registered.parameters, ...type.parameters },
      ports: [
        ...type.ports.map(port => ({ ...port, label: known.get(port.id)?.label ?? port.label })),
        ...registered.ports.filter(port => !type.ports.some(previous => previous.id === port.id)),
      ],
    };
  });
  for (const type of workflowNodeTypes) {
    if (!types.some(previous => previous.id === type.id)) types.push(type);
  }
  return JSON.stringify({ ...graph, nodeTypes: types });
}

const businessNodes = [
  ['request', 'Business request', { brief: 'Review the synthetic Daily Desk recommendation.' }],
  ['run-agent', 'Recommend an update', { task: 'Draft a recommendation for human review.' }],
  ['decision', 'Route recommendation', { primaryCondition: 'ready', specialistCondition: 'specialist' }],
  ['human-review', 'Review recommendation', { prompt: 'Check the recommendation against the synthetic Living Book.' }],
  ['quellight-action', 'Quellight action', { action: 'daily-desk-proposal' }],
];
const researchNodes = [
  ['request', 'Research request', { brief: 'Compare the synthetic reports and summarize the evidence.' }],
  ['run-agent', 'Research sources', { task: 'Summarize the provided synthetic sources.' }],
  ['decision', 'Route research', { primaryCondition: 'ready', specialistCondition: 'specialist' }],
  ['human-review', 'Review research', { prompt: 'Check the conclusion against the synthetic sources.' }],
  ['output', 'Research output', { format: 'summary' }],
  ['human-review', 'Specialist review', { prompt: 'Assess uncertain sources before continuing.' }],
  ['output', 'Specialist output', { format: 'evidence' }],
];
const mainPath = [
  [0, 'Brief', 1, 'Brief'], [1, 'Proposal', 2, 'Proposal'], [2, 'Review', 3, 'Review'], [3, 'Approval', 4, 'Approval'],
];

export const workflowSamples = [
  { value: 'business', label: 'AI-to-business workflow' },
  { value: 'research', label: 'Research workflow' },
];

export function workflowLabel(label, taken) {
  let candidate = label;
  let number = 2;
  while (taken.has(candidate.toLowerCase())) candidate = label + ' ' + number++;
  taken.add(candidate.toLowerCase());
  return candidate;
}

export function sampleWorkflowOperations(sample, graph) {
  const research = sample === 'research';
  const definitions = research ? researchNodes : businessNodes;
  const path = research ? [...mainPath, [2, 'Specialist', 5, 'Review'], [5, 'Approval', 6, 'Approval']] : mainPath;
  const ids = definitions.map(() => crypto.randomUUID());
  const taken = new Set(graph.nodes.map(node => node.label.toLowerCase()));
  const x = graph.nodes.length ? Math.max(...graph.nodes.map(node => node.position.x)) + 270 : 44;
  const operations = definitions.flatMap(([nodeType, label, values], index) => {
    const nodeId = ids[index];
    return [
      { type: 'addNode', id: nodeId, nodeType, position: { x: x + (index < 5 ? index : index - 2) * 245, y: index < 5 ? 45 : 330 } },
      { type: 'setLabel', nodeId, label: workflowLabel(label, taken) },
      ...Object.entries(values).map(([key, value]) => ({ type: 'setParameter', nodeId, key, value })),
    ];
  });
  for (const [source, sourcePort, target, targetPort] of path) {
    operations.push({ type: 'connect', edge: { id: crypto.randomUUID(), source: ids[source], sourcePort, target: ids[target], targetPort } });
  }
  return operations;
}

export function creativeWorkflowOperations(snapshot, graph) {
  const request = crypto.randomUUID();
  const operation = crypto.randomUUID();
  const taken = new Set(graph.nodes.map(node => node.label.toLowerCase()));
  const x = graph.nodes.length ? Math.max(...graph.nodes.map(node => node.position.x)) + 270 : 44;
  const context = typeof snapshot.context === 'string' ? snapshot.context : JSON.stringify(snapshot.context ?? '');
  return [
    { type: 'addNode', id: request, nodeType: 'request', position: { x, y: 48 } },
    { type: 'setLabel', nodeId: request, label: workflowLabel(snapshot.label + ' source', taken) },
    { type: 'setParameter', nodeId: request, key: 'brief', value: snapshot.notes ?? '' },
    { type: 'setParameter', nodeId: request, key: 'creativeSource', value: snapshot.id },
    { type: 'setParameter', nodeId: request, key: 'creativeRevision', value: String(snapshot.revision) },
    { type: 'setParameter', nodeId: request, key: 'creativeContext', value: context },
    { type: 'addNode', id: operation, nodeType: 'run-agent', position: { x: x + 245, y: 48 } },
    { type: 'setLabel', nodeId: operation, label: workflowLabel('Develop ' + snapshot.label, taken) },
    { type: 'connect', edge: { id: crypto.randomUUID(), source: request, sourcePort: 'Brief', target: operation, targetPort: 'Brief' } },
  ];
}

export function workflowReadiness(graph, agents, agentRevision) {
  const issues = [];
  for (const node of graph.nodes) {
    const descriptor = workflowType(node.type);
    const values = node.values;
    if (!descriptor) {
      issues.push(node.label + ' has no registered workflow mapping.');
      continue;
    }
    for (const input of descriptor.ports.filter(port => port.direction === 'input')) {
      if (!graph.edges.some(edge => edge.target === node.id && edge.targetPort === input.id)) {
        issues.push(node.label + ' needs a connection to ' + input.label + '.');
      }
    }
    if (node.type === 'request' && !values.brief?.trim()) issues.push(node.label + ' needs a request brief.');
    if (node.type === 'run-agent') {
      if (!values.resource || !agents.some(agent => agent.id === values.resource)) issues.push(node.label + ' needs an available agent reference.');
      else if (!values.resourceRevision) issues.push(node.label + ' needs an explicit agent revision. Pin the current revision in the Inspector.');
      else if (agentRevision !== undefined && values.resourceRevision !== String(agentRevision)) issues.push(node.label + ' pins an earlier agent draft revision.');
      if (!values.task?.trim()) issues.push(node.label + ' needs an invocation task.');
    }
    if (node.type === 'decision') {
      if (!values.primaryCondition?.trim()) issues.push(node.label + ' needs a primary review match.');
      if (!graph.edges.some(edge => edge.source === node.id && edge.sourcePort === 'Review')) {
        issues.push(node.label + ' needs its primary review path connected.');
      }
      if (values.routing === 'multiple' && !values.specialistCondition?.trim()) issues.push(node.label + ' needs a specialist match for multiple routing.');
      if (values.routing === 'multiple' && !graph.edges.some(edge => edge.source === node.id && edge.sourcePort === 'Specialist')) {
        issues.push(node.label + ' needs its specialist review path connected before multiple routing can be simulated.');
      }
    }
  }
  return issues;
}

export function previewDecision(node, input, graph) {
  const values = node.values;
  const supplied = new Set(input.trim().toLowerCase().split(/\s+/).filter(Boolean));
  const match = value => value?.trim() && supplied.has(value.trim().toLowerCase());
  const candidates = [
    { port: 'Review', label: 'Primary review', condition: values.primaryCondition },
    { port: 'Specialist', label: 'Specialist review', condition: values.specialistCondition },
  ];
  const matches = candidates.filter(candidate => match(candidate.condition));
  if (!matches.length) return values.noMatch === 'fail' ? 'No match · fail request' : 'No match · wait for review';
  const multiple = values.routing === 'multiple';
  const selected = multiple ? matches : matches.slice(0, 1);
  const missing = selected.filter(branch => !graph.edges.some(edge => edge.source === node.id && edge.sourcePort === branch.port));
  if (missing.length) return 'Unavailable · connect ' + missing.map(branch => branch.label).join(' and ');
  if (!multiple) return 'Exclusive · ' + selected[0].label;
  return 'Multiple · ' + selected.map(branch => branch.label).join(' and ') + ' · paths remain separate';
}
