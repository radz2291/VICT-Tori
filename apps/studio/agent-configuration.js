export const agentFixtures = {
  'Authoring agent': {
    instructions: 'Plan a Studio edit, present a reviewable diff, and wait for approval.',
    model: 'fixture-model', mode: 'assist', memory: 'Current session', policy: 'Review required',
    skill: 'studio-authoring', tool: 'governed-edit',
  },
  'Quellight workspace': {
    instructions: 'Summarize synthetic Living Book entries, Compass goals, commitments and the Daily Desk.',
    model: 'fixture-model', mode: 'assist', memory: 'Synthetic project', policy: 'Review required',
    skill: 'quellight-context', tool: 'browser-tool', specialist: 'research-specialist', workspaceContext: 'quellight',
  },
  'Coding workspace': {
    instructions: 'Review the synthetic src/brief.js diff and summarize the supplied test report. Request review before shell commands.',
    model: 'fixture-model', mode: 'assist', memory: 'Synthetic project', policy: 'Read only',
    skill: 'repository-review', tool: 'shell-command', specialist: 'review-specialist', workspaceContext: 'coding',
  },
};

export const workspaceContexts = {
  quellight: {
    label: 'Quellight synthetic workspace',
    records: [
      ['living-book:001', 'Living Book', 'The release draft needs source review before publication.'],
      ['compass:001', 'Compass', 'Goal: prepare a reviewable weekly brief.'],
      ['commitment:001', 'Commitment', 'Review the brief with the project lead on Friday.'],
      ['daily-desk:001', 'Daily Desk', 'Propose a review task. A governed approval is required before an update.'],
    ],
  },
  coding: {
    label: 'Coding synthetic workspace',
    records: [
      ['repository:001', 'Repository scope', 'Read-only fixture scope: src/brief.js and test/brief.test.js.'],
      ['diff:001', 'Proposed diff', '- return title;\n+ return title.trim();'],
      ['tests:001', 'Sample test report', 'Whitespace case: passed in fixture. No shell process was launched.'],
      ['review:001', 'Specialist review', 'The change requires review before application. Shell commands remain unavailable.'],
    ],
  },
};

export const fixtureResources = {
  model: [['fixture-model', 'Deterministic fixture model']],
  skill: [['studio-authoring', 'Studio authoring'], ['quellight-context', 'Quellight context'], ['repository-review', 'Repository review']],
  tool: [['browser-tool', 'Browser tool'], ['governed-edit', 'Governed edit'], ['shell-command', 'Shell command']],
  specialist: [['research-specialist', 'Research Specialist'], ['review-specialist', 'Review Specialist']],
};
