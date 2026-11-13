import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { baseline, heldOut } from './recognition-cases.mjs';
import { connector, interpret } from './recognition.mjs';
import { loadCodingCredential } from './windows-coding-loader.mjs';

const sizes = [1024, 4096, 8192, 16384];
const placements = { head: 0.1, middle: 0.5, tail: 0.9 };
const source = { id: 'orchid-source', role: 'operator',
  text: 'For Orchid weekly reviews, put all risks in a single sentence and make the next review date the last item.' };
const latest = 'Keep the handoff rule we agreed for the Orchid weekly review as my standing preference in future chats.';
const encodedSize = value => Buffer.byteLength(JSON.stringify(value), 'utf8');
const notes = [
  'I received the mockup from Mei; the footer and cover title matched the sample.',
  'Liao checked the planning room. The projector worked after the cable was replaced.',
  'The printed labels arrived at the reception desk. Five reserved copies still need names.',
  'Ravi sent the inventory status. The spare brackets were already on the shelf.',
  'The test account was restored after lunch. The calendar export opened with all its dates.',
  'The archive boxes have arrived; the team will count their contents in the morning.',
  'Nur noted two changes to the instructions and set the draft aside for discussion.',
  'The screenshot shows the demo header. It uses the staging colors as expected.',
  'A short overview went out on Monday, and the designer replied with a small correction.',
  'The meeting notes distinguish expected deliveries from items everyone has seen.',
  'We resolved the duplicate row for the green sample. The label was kept as written.',
  'The test worksheet has the accession date and a link to yesterday’s status page.',
  'Aina took the draft from the library to the meeting room, where Faye made a copy.',
  'One ticket was parked while the team checked whether the dated attachment was complete.',
  'Jun tried the tabletop recording and heard no background noise from the small fan.',
  'The afternoon summary lists paper samples, dimensions and the rooms reserved for both sessions.',
];
const topics = ['graphics', 'facilities', 'supplies', 'workspace', 'staging', 'operations', 'documentation'];

function createHistory(budget, placement) {
  const fillers = [];
  for (let i = 0; encodedSize([...fillers, source]) < budget; i++) {
    const text = 'Update ' + (i + 1) + ', ' + topics[i % topics.length] + '. ' + notes[i % notes.length];
    const row = { id: 'note-' + (i + 1), role: i % 2 === 0 ? 'operator' : 'assistant', text };
    if (encodedSize([...fillers, row, source]) > budget) break;
    fillers.push(row);
  }
  const fraction = placements[placement];
  const index = Math.min(fillers.length, Math.round(fillers.length * fraction));
  return [...fillers.slice(0, index), source, ...fillers.slice(index)];
}

function recentWithin(history, budget) {
  const recent = [];
  for (const row of history.toReversed()) {
    if (encodedSize([row, ...recent]) > budget) break;
    recent.unshift(row);
  }
  return recent;
}

const cases = sizes.flatMap(budget => Object.keys(placements).map(placement => {
  const history = createHistory(budget, placement);
  return { id: budget + '-' + placement, origin: 'operator', text: latest, history, budget, placement,
    originalHistoryBytes: encodedSize(history) };
}));
const excludedHistory = createHistory(16384, 'head');
cases.push({ id: '8192-source-excluded', origin: 'operator', text: latest,
  history: recentWithin(excludedHistory, 8192), budget: 8192, placement: 'excluded',
  originalHistoryBytes: encodedSize(excludedHistory) });

for (const test of cases) {
  assert.equal(test.text, latest);
  assert.ok(encodedSize(test.history) <= test.budget);
  assert.equal(test.history.includes(source), test.placement !== 'excluded');
  assert.equal(new Set(test.history.map(row => row.id)).size, test.history.length);
}

const describe = test => {
  const index = test.history.indexOf(source);
  return { id: test.id, budget: test.budget, placement: test.placement, latest: test.text,
    expected: index === -1 ? 'clarify' : 'proposal',
    originalHistoryBytes: test.originalHistoryBytes, historyBytes: encodedSize(test.history),
    authorizedInputBytes: encodedSize({ history: test.history, current: { id: 'current', text: test.text } }),
    sourceId: index === -1 ? null : source.id,
    sourceOffsetBytes: index === -1 ? null : index === 0 ? 1 : encodedSize(test.history.slice(0, index)),
    sourceText: index === -1 ? null : source.text,
    historySha256: createHash('sha256').update(JSON.stringify(test.history)).digest('hex') };
};

if (process.argv.includes('--plan')) {
  console.log(JSON.stringify(cases.map(describe), null, 2));
} else if (process.argv.includes('--context-probe')) {
  const fixedOutput = readFileSync(process.argv[3], 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
  const seen = fixedOutput.filter(row => row.id);
  assert.deepEqual(seen.map(row => row.id), [...baseline, ...heldOut].map(row => row.id),
    'The complete fixed corpus must run before the context experiment.');
  assert.ok(!seen.some(row => [401, 403, 429].includes(row.http)), 'Coding refusal. Live work is stopped.');
  let requestBytes;
  const client = connector(loadCodingCredential(), (url, init) => {
    requestBytes = Buffer.byteLength(init.body, 'utf8');
    return fetch(url, init);
  });
  for (const test of cases) {
    requestBytes = null;
    const observed = await interpret(test, client);
    console.log(JSON.stringify({ ...describe(test), requestBytes, ...observed }));
    if ([401, 403, 429].includes(observed.http)) {
      process.exitCode = 2;
      break;
    }
  }
} else {
  throw Error('Use --plan --context-probe for the frozen plan, or --context-probe with the fixed NDJSON path.');
}
