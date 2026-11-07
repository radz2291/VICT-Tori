import { emptyGraphV3, serializeGraphV3 } from '@victframework/ui-flow-svelte/model';

export const agentInputs = [
  { id: 'instructions', label: 'System prompt', source: 'text', type: 'text' },
  ...[
    ['model', 'Model'], ['skill', 'Skill'], ['tool', 'Tool availability'], ['mode', 'Mode'],
    ['memory', 'Memory policy'], ['policy', 'Policy'], ['specialist', 'Delegated specialist'],
    ['processor', 'Processor'], ['workspaceContext', 'Workspace context'],
  ].map(([id, label]) => ({ id, label, source: id + '-reference', type: id })),
  { id: 'budget', label: 'Step budget', source: 'number', type: 'number' },
];

const value = { type: 'string', default: '', label: 'Value' };
const sourceTypes = agentInputs.map(input => ({
  id: input.source,
  label: input.source === 'text' ? 'Text' : input.source === 'number' ? 'Number' : input.label + ' reference',
  parameters: { value },
  ports: [{ id: 'value', label: 'Output', direction: 'output', type: input.type }],
}));

export const agentNodeTypes = [{
  id: 'agent', label: 'Agent definition',
  parameters: { lifecycle: { type: 'string', default: '', label: 'Lifecycle' } },
  ports: [
    ...agentInputs.map(({ id, label, type }) => ({ id, label, type, direction: 'input', maxConnections: 1 })),
    { id: 'agent', label: 'Agent reference', type: 'specialist', direction: 'output' },
  ],
}, ...sourceTypes];

const edgeDefaults = { color: 'token:muted', width: 2, endArrow: 'closed' };

export function agentSource() {
  return serializeGraphV3({ ...emptyGraphV3(), nodeTypes: agentNodeTypes, edgeDefaults });
}

export function agentEdge(id, source, target, targetPort, sourcePort = 'value') {
  return { id, source, sourcePort, target, targetPort };
}

export function prepareAgentSource(source) {
  const graph = JSON.parse(source);
  const agentType = graph.nodeTypes.find(type => type.id === 'agent');
  if (agentType?.ports.some(port => port.id === 'instructions')) return source;
  const occupied = new Set([...graph.nodes, ...graph.edges].map(item => item.id));
  function unique(base) {
    let id = base;
    let suffix = 2;
    while (occupied.has(id)) id = base + '-' + suffix++;
    occupied.add(id);
    return id;
  }
  for (const agent of [...graph.nodes].filter(node => node.type === 'agent')) {
    const values = agent.values;
    agent.values = values.lifecycle ? { lifecycle: values.lifecycle } : {};
    agentInputs.forEach((input, index) => {
      if (!values[input.id]) return;
      const id = unique(agent.id + '-source-' + input.id);
      graph.nodes.push({
        id, type: input.source, label: input.label, values: { value: values[input.id] },
        position: { x: agent.position.x - 300, y: agent.position.y + index * 170 },
      });
      graph.edges.push(agentEdge(unique(id + '-binding'), id, agent.id, input.id));
    });
  }
  graph.nodeTypes = agentNodeTypes;
  graph.edgeDefaults = edgeDefaults;
  graph.allowCycles = false;
  return serializeGraphV3(graph);
}

export function agentBindings(graph, agentId) {
  return Object.fromEntries(graph.edges.filter(edge => edge.target === agentId).flatMap(edge => {
    const node = graph.nodes.find(item => item.id === edge.source);
    return node ? [[edge.targetPort, { edge, node, value: node.type === 'agent' ? node.id : node.values.value }]] : [];
  }));
}

export function addAgentSource(input, position, initialValue = '') {
  const id = crypto.randomUUID();
  return {
    id,
    operations: [
      { type: 'addNode', id, nodeType: input.source, position },
      { type: 'setLabel', nodeId: id, label: input.label },
      { type: 'setParameter', nodeId: id, key: 'value', value: initialValue },
    ],
  };
}
