export const registeredTools = Object.freeze([
  Object.freeze({
    reference: 'research-topics@1',
    id: 'tori.script.research-topics',
    revision: '1',
    grant: 'tori.script.research-topics.read',
    label: 'Research Topics · r1',
    description: 'Look up a synthetic research topic in the approved project index.',
    keys: Object.freeze(['habits', 'planning']),
  }),
  Object.freeze({
    reference: 'reading-list@1',
    id: 'tori.script.reading-list',
    revision: '1',
    grant: 'tori.script.reading-list.read',
    label: 'Reading List · r1',
    description: 'Read the approved synthetic reading list for a project topic.',
    keys: Object.freeze(['habits', 'planning']),
  }),
]);

export const registeredTool = reference => registeredTools.find(item => item.reference === reference);
