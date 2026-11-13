import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assess } from '../recognition-cases.mjs';
import { qualificationGroups } from '../qualify-implementation.mjs';

const folder = process.argv[2];
assert.ok(folder, 'Pass the synthetic implementation evidence directory.');
const read = file => readFileSync(join(folder, file), 'utf8');
const readRows = file => read(file).trim().split(/\r?\n/).map(line => JSON.parse(line));
const review = JSON.parse(read('semantic-review.json'));
const output = {};
const validKinds = ['proposal', 'none', 'clarify'];
const ids = rows => rows.map(row => row.id);
const rate = (results, population) => ({ count: results.length, denominator: population.length, ids: ids(results) });
const stat = values => {
  const times = values.filter(Number.isFinite).sort((a,b) => a-b);
  const percentile = p => times[Math.ceil(times.length*p)-1] ?? null;
  return { n: times.length, p50: percentile(.5), p95: percentile(.95), max: times.at(-1) ?? null };
};

function score(tests, rows, notes) {
  const lookup = new Map(rows.map(row => [row.id, row]));
  assert.equal(lookup.size, tests.length);
  for(const test of tests){
    assert.equal(lookup.get(test.id)?.expected,test.outcome);
    assert.equal(lookup.get(test.id)?.origin,test.origin);
    assert.equal(lookup.get(test.id)?.calls,Number(test.origin==='operator'));
  }
  const eligible = rows.filter(row => row.origin === 'operator');
  const valid = eligible.filter(row => validKinds.includes(row.result.kind));
  const saves = eligible.filter(row => row.expected === 'proposal');
  const validSaves = valid.filter(row => row.expected === 'proposal');
  const nonSaves = valid.filter(row => row.expected !== 'proposal');
  const delivered = validSaves.filter(row => row.result.kind === 'proposal');
  const tokenUsage = {};
  for(const field of ['input','output','reasoning']){
    const values = eligible.map(row => row.usage?.[field]).filter(Number.isInteger);
    tokenUsage[field] = { ...stat(values), total: values.length ? values.reduce((sum,value)=>sum+value) : null };
  }
  return {
    cases: rows.length, nonOperator: rows.length-eligible.length,
    nonOperatorCalls: rows.filter(row=>row.origin!=='operator').reduce((sum,row)=>sum+row.calls,0),
    delivery: rate(delivered, saves),
    missedValid: rate(validSaves.filter(row=>row.result.kind!=='proposal'), validSaves),
    unwanted: rate(nonSaves.filter(row=>row.result.kind==='proposal'), nonSaves),
    substantiveErrors: rate(delivered.filter(row=>notes[row.id]?.verdict==='incorrect'), delivered),
    anchors: rate(delivered.filter(row=>assess(tests.find(test=>test.id===row.id),row.result).wrongText), delivered),
    clarificationMismatch: rate(valid.filter(row=>(row.expected==='clarify')!==(row.result.kind==='clarify')), valid),
    invalid: rate(eligible.filter(row=>row.result.kind==='invalid'), eligible),
    unavailable: rate(eligible.filter(row=>row.result.kind==='unavailable'), eligible),
    timeout: rate(eligible.filter(row=>row.result.kind==='timeout'), eligible),
    capExhaustion: rate(eligible.filter(row=>row.finish==='length'||row.result.reason==='output-allowance'), eligible),
    finishMissing: rate(eligible.filter(row=>!row.finish), eligible),
    finish: Object.fromEntries([...new Set(eligible.map(row=>row.finish))].map(key=>[key??'missing',eligible.filter(row=>row.finish===key).length])),
    latencyMs: stat(eligible.map(row=>row.latencyMs)),
    firstPublicTextMs: stat(eligible.map(row=>row.firstTextMs)),
    tokenUsage,
  };
}

const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('|','\\|').replaceAll('\n','<br>');
const table = [
  '# Implementation draft review',
  '',
  'Exact proposals from the selected trial, reviewed against the synthetic input and cited context. A substantive error changes the requested fact, preference, referent, qualification or scope. Anchor checks help triage paraphrases. Radzi’s acceptance is pending.',
  '',
  '| Case | Operator input | Cited earlier input | Exact proposal | Review |',
  '| --- | --- | --- | --- | --- |',
];
for(const mode of ['standard','cautious']){
  const rows = readRows(mode+'.ndjson');
  output[mode]={};
  for(const [group,tests] of qualificationGroups.filter(([group])=>mode==='standard'||group==='fresh')){
    const actual=rows.filter(row=>row.group===group);
    output[mode][group]=score(tests,actual,review[mode]);
    for(const row of actual.filter(row=>row.result.kind==='proposal')){
      const test=tests.find(test=>test.id===row.id);
      const source=test.history.filter(item=>row.result.basis.includes(item.id)).map(item=>item.id+' — '+item.text).join('\n');
      const finding=review[mode][row.id]?.finding??(test.outcome==='proposal'?'Requested meaning preserved.':'Unwanted under the fixed label.');
      table.push('| '+[mode+' '+row.id,test.text,source||'—',row.result.draft,finding].map(escape).join(' | ')+' |');
    }
  }
}
writeFileSync(join(folder,'metrics.json'),JSON.stringify(output,null,2)+'\n');
writeFileSync(join(folder,'DRAFT-REVIEW.md'),table.join('\n')+'\n');
