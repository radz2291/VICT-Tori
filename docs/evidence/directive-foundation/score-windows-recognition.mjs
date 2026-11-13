import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { baseline, heldOut, assess } from './recognition-cases.mjs';

const folder = process.argv[2];
assert.ok(folder, 'Pass the Windows evidence directory.');
const read = name => readFileSync(join(folder, name), 'utf8');
const fixed = read('recognition.ndjson').trim().split(/\r?\n/).map(line => JSON.parse(line)).filter(row => row.id);
assert.ok(fixed.every(row => row.trial === 1));
const lookup = new Map(fixed.map(row => [row.id, row]));
assert.equal(lookup.size, fixed.length);
const notes = JSON.parse(read('semantic-review.json')).caseNotes;
const rate = (count, denominator) => ({ count, denominator,
  percent: denominator ? Math.round((10000 * count) / denominator) / 100 : null });
function distribution(values) {
  const found = values.filter(Number.isFinite).sort((a, b) => a - b);
  const percentile = fraction => found.length ? found[Math.ceil(found.length * fraction) - 1] : null;
  return { n: found.length, p50: percentile(0.5), p95: percentile(0.95), max: found.at(-1) ?? null };
}

const brief = 'Use input, decision, next step, and a due date for planning briefs.';
function expectedMeaning(test) {
  if (notes[test.id]?.expected) return notes[test.id].expected;
  if (test.outcome === 'clarify') return 'Clarification without a save proposal.';
  if (test.outcome === 'none') return 'Neither a save proposal nor clarification.';
  if (test.history.some(row => row.text === brief)) return brief;
  if (test.history.length && test.text.includes('weekly review preference')) return test.history[0].text;
  if (test.id === 'held-out-1') return 'The Orchid brief belongs to Mei.';
  if (test.id === 'held-out-2' || test.id === 'held-out-4') return 'Use two short bullets for Orchid updates as a standing preference.';
  if (test.id === 'held-out-3') return 'Project summaries must use three short points, in Malay.';
  if (test.id === 'held-out-25') return 'Use two bullets for future Orchid updates. Exclude the separate budget fact.';
  if (test.text.includes('Line one.')) return 'Retain both lines in order.';
  if (test.text.includes('three short bullets')) return 'The operator prefers project updates in three short bullets.';
  if (test.text.includes('short project updates')) return 'The operator prefers short project updates.';
  if (test.text.includes('brief notes')) return 'The operator prefers brief notes.';
  if (test.text.includes('Mondays are for planning')) return 'Mondays are for planning.';
  if (test.text.includes('updates on Monday')) return 'The operator prefers planning updates on Monday.';
  throw Error('Missing expected-meaning note for ' + test.id);
}

function combine(group, test) {
  const row = lookup.get(test.id);
  if (row) {
    assert.equal(row.group, group);
    assert.equal(row.expected, test.outcome);
    assert.equal(row.calls, test.origin === 'operator' ? 1 : 0);
    if (row.result) assert.deepEqual(row.scores, assess(test, row.result));
    assert.equal(Number(Boolean(row.result)) + Number(Boolean(row.invalidOutput)) +
      Number(Boolean(row.error || row.http)), 1);
  }
  const result = { group, id: test.id, origin: test.origin, expected: test.outcome, expectedMeaning: expectedMeaning(test),
    latest: test.text, context: test.history, observed: row ?? null };
  if (row?.result?.kind === 'proposal') {
    result.review = {
      finding: notes[test.id]?.finding ?? (test.outcome === 'proposal' ?
        'Preserves the requested meaning.' : 'Unwanted proposal for the fixed label.'),
      verdict: test.outcome === 'proposal' ? notes[test.id]?.verdict ?? 'correct' : 'unwanted',
      citedContext: row.result.basis.flatMap(id => test.history.filter(message => message.id === id)),
    };
  }
  return result;
}

const groups = Object.fromEntries([['baseline', baseline], ['held-out', heldOut]].map(([name, tests]) =>
  [name, tests.map(test => combine(name, test))]));
assert.equal(Object.values(groups).flat().filter(row => row.observed).length, fixed.length);

function tokenStats(rows) {
  return Object.fromEntries(['input', 'output', 'reasoning'].map(key => {
    const values = rows.map(row => row.usage?.[key]).filter(Number.isInteger);
    return [key, { ...distribution(values), total: values.length ? values.reduce((a, b) => a + b) : null }];
  }));
}

function metrics(rows) {
  const of = (list, outcome) => list.filter(row => row.expected === outcome);
  const operator = rows.filter(row => row.origin === 'operator');
  const attempted = operator.filter(row => row.observed?.calls === 1);
  const provider = attempted.map(row => row.observed);
  const valid = attempted.filter(row => row.observed.result);
  const trueSaves = of(valid, 'proposal');
  const actual = (row, kind) => row.observed?.result?.kind === kind;
  const returned = trueSaves.filter(row => actual(row, 'proposal'));
  const misses = trueSaves.filter(row => !actual(row, 'proposal'));
  const eligibleUnwanted = valid.filter(row => row.expected !== 'proposal');
  const unwanted = eligibleUnwanted.filter(row => actual(row, 'proposal'));
  const incorrect = returned.filter(row => row.review.verdict === 'incorrect');
  const anchors = returned.filter(row => row.observed.scores.wrongText);
  const clarifies = valid.filter(row => row.expected === 'clarify');
  const unnecessary = valid.filter(row => actual(row, 'clarify') && row.expected !== 'clarify');
  const missing = clarifies.filter(row => !actual(row, 'clarify'));
  const invalid = attempted.filter(row => row.observed.invalidOutput);
  const unavailable = attempted.filter(row => row.observed.http || row.observed.error);
  const expectedSaves = of(operator, 'proposal');
  const ids = list => list.map(row => row.id);
  return {
    cases: rows.length, operator: operator.length, gateRows: rows.length - operator.length,
    gatedObserved: rows.filter(row => row.origin !== 'operator' && row.observed?.calls === 0).length,
    gateCalls: rows.filter(row => row.origin !== 'operator').reduce((n, row) => n + (row.observed?.calls ?? 0), 0),
    attemptCoverage: rate(attempted.length, operator.length), validCoverage: rate(valid.length, operator.length),
    validPerAttempt: rate(valid.length, attempted.length),
    missed: rate(misses.length, trueSaves.length), missIds: ids(misses),
    expectedSaveLostInvalid: ids(of(invalid, 'proposal')),
    expectedSaveLostUnavailable: ids(of(unavailable, 'proposal')),
    expectedSaveUnattempted: ids(expectedSaves.filter(row => !row.observed)),
    delivery: rate(returned.length, expectedSaves.length),
    unwanted: rate(unwanted.length, eligibleUnwanted.length), unwantedIds: ids(unwanted),
    incorrectMeaning: rate(incorrect.length, returned.length), incorrectMeaningIds: ids(incorrect),
    anchorTriage: rate(anchors.length, returned.length), anchorTriageIds: ids(anchors),
    clarificationMismatch: rate(unnecessary.length + missing.length, valid.length),
    unnecessaryClarification: rate(unnecessary.length, valid.length - clarifies.length),
    missingClarification: rate(missing.length, clarifies.length),
    unnecessaryClarificationIds: ids(unnecessary), missingClarificationIds: ids(missing),
    invalid: rate(invalid.length, attempted.length), invalidIds: ids(invalid),
    unavailable: rate(unavailable.length, attempted.length), unavailableIds: ids(unavailable),
    latencyMs: distribution(provider.map(row => row.latencyMs)),
    firstPublicTextMs: distribution(provider.map(row => row.firstTextMs)),
    usage: tokenStats(provider), models: [...new Set(provider.flatMap(row => row.observedModel ?? []))],
  };
}

const output = Object.fromEntries(Object.entries(groups).map(([group, rows]) => [group, metrics(rows)]));
const all = Object.values(groups).flat();
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('|', '\\|').replaceAll('\n', '<br>');
const table = [
  '# Fixed recognition trial — actual proposed drafts',
  '',
  'Each proposal was read against its latest synthetic input and earlier messages. Substantive wording, anchor triage, presentation, and fixed-label eligibility have separate findings. The source ID current refers to the latest message shown. Exact text, including original newlines, is preserved in the [case evidence](cases.json). Radzi’s review is pending.',
  '',
  '| Case | Latest operator message | Cited context | Expected meaning | Actual draft | Reviewer finding |',
  '| --- | --- | --- | --- | --- | --- |',
  ...all.filter(row => row.review).map(row => {
    const context = row.review.citedContext.map(source => source.id + ' — ' + source.text).join('\n') || '—';
    return '| ' + [row.id, row.latest, context, row.expectedMeaning, row.observed.result.draft,
      row.review.finding].map(escape).join(' | ') + ' |';
  }),
];
writeFileSync(join(folder, 'cases.json'), JSON.stringify(all, null, 2) + '\n');
writeFileSync(join(folder, 'metrics.json'), JSON.stringify(output, null, 2) + '\n');
writeFileSync(join(folder, 'DRAFT-REVIEW.md'), table.join('\n') + '\n');
console.log(JSON.stringify(output, null, 2));
