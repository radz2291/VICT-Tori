import { emptyGraphV3, serializeGraphV3 } from '@victframework/ui-flow-svelte/model';
import { fixtureResources } from './agent-configuration.js';

const roles = [
  { key: 'model', name: 'Model binding', kind: 'Model', semantic: 'Configuration' },
  { key: 'skill', name: 'Skill attachment', kind: 'Skill', semantic: 'Configuration' },
  { key: 'tool', name: 'Tool availability', kind: 'Tool', semantic: 'Availability' },
  { key: 'specialist', name: 'Specialist delegation', kind: 'Agent', semantic: 'Delegation' },
];

export function agentRelationships(agent, settings, agents) {
  return roles.filter(role => agent.values[role.key]).map(role => {
    const resourceId = agent.values[role.key];
    const fixture = fixtureResources[role.key].find(([id]) => id === resourceId);
    const capability = settings.capabilities.find(item => item.id === resourceId && item.kind === role.kind);
    const definition = role.key === 'specialist' && agents.find(item => item.id === resourceId);
    return {
      ...role, resourceId,
      label: fixture?.[1] ?? capability?.name ?? definition?.label ?? 'Unavailable resource',
      unavailable: !(fixture || capability?.enabled || definition),
      nodeId: 'resource:' + role.key + ':' + resourceId,
    };
  });
}

export function agentRelationshipGraph(agent, relationships) {
  const port = (key, direction, name) => ({ id: key, direction, type: key, label: name });
  return serializeGraphV3({
    ...emptyGraphV3(),
    nodeTypes: [
      { id: 'definition', label: 'Agent definition', parameters: {}, ports: relationships.map(role => port(role.key, 'output', role.name)) },
      ...relationships.map(role => ({
        id: role.key, label: role.kind, parameters: {}, ports: [port(role.key, 'input', role.name)],
      })),
    ],
    nodes: [
      { id: agent.id, type: 'definition', label: agent.label, values: {}, position: { x: 8, y: Math.max(8, relationships.length - 1) * 24 } },
      ...relationships.map((role, index) => ({
        id: role.nodeId, type: role.key, label: role.label, values: {}, position: { x: 200, y: index * 65 },
      })),
    ],
    edges: relationships.map(role => ({
      id: agent.id + ':' + role.key + ':' + role.resourceId,
      source: agent.id, sourcePort: role.key, target: role.nodeId, targetPort: role.key,
      appearance: { pattern: role.semantic === 'Delegation' ? 'dash' : 'solid', endArrow: 'arrow' },
    })),
  });
}
