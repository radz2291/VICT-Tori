import { emptyGraphV3, parseGraphV3, serializeGraphV3 } from '@victframework/ui-flow-svelte/model';

const reference = [
  { id: 'reference-in', label: 'Reference input', type: 'creative-reference', direction: 'input' },
  { id: 'reference-out', label: 'Reference output', type: 'creative-reference', direction: 'output' },
];

const notes = { type: 'string', label: 'Notes', default: '' };
const direction = {
  id: 'direction', label: 'Direction', ports: reference,
  parameters: {
    notes,
    context: { type: 'string', label: 'Context source', default: '' },
    branchOf: { type: 'string', label: 'Branched from', default: '' },
    branchRevision: { type: 'number', label: 'Source graph revision', default: 0 },
    preferred: { type: 'boolean', label: 'Preferred direction', default: false },
  },
};
const idea = { id: 'idea', label: 'Idea', ports: reference, parameters: { notes } };

export const referenceEdge = (source, target, id = crypto.randomUUID()) => ({
  id, source, target, sourcePort: 'reference-out', targetPort: 'reference-in',
});

export function newCreativeSource(seed = true) {
  const directions = [
    ['metallic', 'Metallic', 'Reflective aluminum, machined edges and hard directional light.'],
    ['biological', 'Biological', 'Translucent membranes, branching veins and diffuse warm light.'],
    ['architectural', 'Architectural', 'Layered concrete, generous voids and long cast shadows.'],
  ];
  return serializeGraphV3({
    ...emptyGraphV3(),
    allowCycles: true,
    edgeDefaults: { pattern: 'dash', color: 'token:muted', endArrow: 'arrow' },
    nodeTypes: [direction, idea],
    nodes: seed ? [
      ...directions.map(([id, label, text], index) => ({
        id, label, type: direction.id, values: { notes: text },
        position: { x: 20 + index * 245, y: 40 + index % 2 * 25 },
      })),
      { id: 'creative-idea', label: 'Source idea', type: idea.id, values: { notes: 'A speculative environment explored through three material languages.' }, position: { x: 265, y: 270 } },
    ] : [],
    edges: seed ? [
      ...directions.map(([id]) => referenceEdge('creative-idea', id, 'idea-to-' + id)),
      referenceEdge('metallic', 'biological', 'metallic-to-biological'),
      referenceEdge('biological', 'architectural', 'biological-to-architectural'),
      referenceEdge('architectural', 'metallic', 'architectural-to-metallic'),
    ] : [],
  });
}

// Upgrade the editable projection for older local drafts without rewriting their
// saved bytes. The first native edit saves the expanded public schema.
export function creativeSource(source) {
  const { graph } = parseGraphV3(source);
  const existing = graph.nodeTypes.find(type => type.id === direction.id);
  const hasIdeaType = graph.nodeTypes.some(type => type.id === idea.id);
  if (existing?.parameters.context && hasIdeaType && graph.allowCycles) return source;
  const nodeTypes = graph.nodeTypes.map(type => type.id === direction.id
    ? { ...type, ports: type.ports.length ? type.ports : reference, parameters: { ...direction.parameters, ...type.parameters } }
    : type);
  if (!existing) nodeTypes.push(direction);
  if (!hasIdeaType) nodeTypes.push(idea);
  return serializeGraphV3({
    ...graph,
    allowCycles: true,
    edgeDefaults: graph.edgeDefaults ?? { pattern: 'dash', color: 'token:muted', endArrow: 'arrow' },
    nodeTypes,
  });
}

export function creativeContext(graph, node) {
  const referenceIds = new Set(graph.edges.filter(edge => edge.target === node.id).map(edge => edge.source));
  const references = graph.nodes.filter(item => referenceIds.has(item.id));
  const source = references.find(item => item.id === node.values.context);
  return {
    references,
    invalid: Boolean(node.values.context && !source),
    snapshot: source ? { id: source.id, label: source.label, notes: source.values.notes ?? '' } : null,
  };
}

export function creativeInput(graph, node) {
  return {
    id: node.id,
    label: node.label,
    revision: graph.revision,
    notes: node.values.notes ?? '',
    context: creativeContext(graph, node).snapshot,
  };
}

export const creativeOperator = 'tori.u0.direction-fixture@1';
export const artifactId = run => run.id + ':artifact';
export function sameCreativeInputs(a, b) {
  return a?.id === b.id && a?.notes === b.notes &&
    a?.context?.id === b.context?.id && a?.context?.notes === b.context?.notes;
}

export function creativeArtifact(input, variation) {
  const seed = Array.from(JSON.stringify([input.notes, input.context?.notes, variation]))
    .reduce((hash, letter) => Math.imul(hash ^ letter.codePointAt(0), 16777619) >>> 0, 2166136261);
  const hue = seed % 360;
  const graphic = {
    schema: 'vict.vector@1',
    viewBox: '0 0 192 96',
    nodes: [
      { tag: 'rect', attributes: { width: 192, height: 96, fill: 'hsl(' + hue + ', 22%, 15%)' } },
      ...Array.from({ length: 5 }, (_, index) => ({
        tag: 'rect',
        attributes: {
          x: 12 + index * 35, y: 12 + ((seed >>> (index * 4)) % 30), width: 27,
          height: 36 + ((seed >>> (index * 4)) % 19),
          fill: 'hsl(' + (hue + index * 9) % 360 + ', 40%, ' + (41 + index * 7) + '%)',
        },
      })),
    ],
  };
  return { origin: 'simulation', variation, seed, graphic };
}
