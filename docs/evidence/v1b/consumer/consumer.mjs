import assert from 'node:assert/strict';
import { createDraftAuthoring, commitDraftEdit } from '@victframework/control/draft-authoring';

const trusted = {actorId:'synthetic-actor', turnId:'synthetic-turn'};
let document = {draftId:'research', occurrenceId:'instructions.text', revision:7, text:'Current instructions'};
const receipts = new Map();
const matches = ({actorId, turnId}) => actorId === trusted.actorId && turnId === trusted.turnId;
const journal = {
  resolveDraft: key => matches(key) ? document : undefined,
  readReceipt: key => matches(key) ? receipts.get(key.operationId) : undefined,
  apply: ({edit}) => {
    document = {...document, text:edit, revision:document.revision+1};
    return {status:'applied', revision:document.revision};
  },
  recordReceipt: receipt => receipts.set(receipt.operationId,receipt),
};
let simulateLoss = false;
const api = createDraftAuthoring({
  ...journal,
  commit: (proposal, signal) => {
    commitDraftEdit(proposal, signal, journal);
    if(simulateLoss)throw new Error('Synthetic lost acknowledgement after commit');
  },
});
const operation = (operationId, signal = new AbortController().signal) => ({...trusted,operationId,signal});
const base = await api.discover(trusted);
assert.deepEqual(base, {draftId:'research', occurrenceId:'instructions.text', revision:7});
assert.equal(await api.discover({...trusted,actorId:'other'}),undefined);
const input = {draftId:base.draftId,occurrenceId:base.occurrenceId,expectedRevision:base.revision,edit:'Include source links'};
assert.deepEqual(await api.apply(operation('outside'),{...input,occurrenceId:'agent.instructions'}),{status:'denied'});
assert.equal(receipts.size,0);
simulateLoss=true;
const applied = await api.apply(operation('once'),input);
assert.equal(applied.status,'confirmed');
assert.equal(applied.receipt.status,'applied');
assert.equal(applied.receipt.revision,8);
assert.deepEqual(await api.observe(operation('once')),applied.receipt);
assert.deepEqual(await api.apply(operation('once'),input),applied);
assert.deepEqual(await api.apply(operation('once'),{...input,edit:'Different edit'}),{status:'operation-conflict'});
assert.equal(document.revision,8);
simulateLoss=false;
const stale=await api.apply(operation('stale'),input);
assert.equal(stale.receipt.status,'stale');
const stop=new AbortController();
stop.abort();
const stopped=await api.apply(operation('stopped',stop.signal),{...input,expectedRevision:8});
assert.equal(stopped.receipt.status,'cancelled');
assert.deepEqual(await api.apply(operation('once',stop.signal),input),applied);
assert.equal(document.text,'Include source links');
assert.equal(document.revision,8);
console.log(JSON.stringify({result:'pass', export:'@victframework/control/draft-authoring', discovery:base, applied:applied.receipt, stale:stale.receipt.status, stop:stopped.receipt.status, outside:'denied', duplicate:'same receipt', changedOperation:'operation-conflict'}));
