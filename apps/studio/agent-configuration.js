export const agentParameters = Object.fromEntries([
  ['instructions', 'Instructions'], ['model', 'Model'], ['mode', 'Mode'], ['memory', 'Memory'],
  ['policy', 'Policy'], ['skill', 'Skill'], ['tool', 'Tool'], ['specialist', 'Delegated specialist'],
  ['lifecycle', 'Lifecycle'],
].map(([id, label]) => [id, { type: 'string', default: '', label }]));

export function prepareAgentSource(source) {
  const graph = JSON.parse(source);
  const agent = graph.nodeTypes.find(type => type.id === 'agent');
  if (!agent || Object.keys(agentParameters).every(key => key in agent.parameters)) return source;
  agent.parameters = { ...agentParameters, ...agent.parameters };
  return JSON.stringify(graph);
}

export const agentFixtures = {
  'Authoring agent': {
    instructions: 'Plan a Studio edit, present a reviewable diff, and wait for approval.',
    model: 'fixture-model', mode: 'assist', memory: 'Current session', policy: 'Review required',
    skill: 'studio-authoring', tool: 'governed-edit',
  },
  'Quellight workspace': {
    instructions: 'Summarize synthetic Living Book entries, Compass goals, commitments and the Daily Desk.',
    model: 'fixture-model', mode: 'assist', memory: 'Synthetic project', policy: 'Review required',
    skill: 'quellight-context', tool: 'browser-tool', specialist: 'research-specialist',
  },
  'Coding workspace': {
    instructions: 'Review the synthetic src/brief.js diff and summarize the supplied test report. Request review before shell commands.',
    model: 'fixture-model', mode: 'assist', memory: 'Synthetic project', policy: 'Read only',
    skill: 'repository-review', tool: 'shell-command', specialist: 'review-specialist',
  },
};

export const fixtureResources = {
  model: [['fixture-model', 'Deterministic fixture model']],
  skill: [['studio-authoring', 'Studio authoring'], ['quellight-context', 'Quellight context'], ['repository-review', 'Repository review']],
  tool: [['browser-tool', 'Browser tool'], ['governed-edit', 'Governed edit'], ['shell-command', 'Shell command']],
  specialist: [['research-specialist', 'Research Specialist'], ['review-specialist', 'Review Specialist']],
};
