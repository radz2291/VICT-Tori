import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gatedMemorySave,memoryScope,openMemoryStore} from '@tori-studio/memory';

const scope=memoryScope('synthetic-operator','synthetic-project','synthetic-agent');
const foreign=memoryScope(scope.actor,scope.project,'other-agent');
const path=join(await mkdtemp(join(tmpdir(),'tori-007-consumer-')),'memory.sqlite');
let store=openMemoryStore(path);
try{
  const grant={session:'synthetic-session',activation:'synthetic-pin',run:'synthetic-run',
    source:'synthetic-source',contextBasis:['synthetic-source'],text:'Synthetic update format.',expires:Date.now()+60000};
  const proposal=store.propose(scope,grant);
  grant.operation=proposal.operation;
  grant.confirmed=true;
  const context={victActorId:scope.actor,victTurnId:grant.run,victIdempotencyKey:grant.operation,
    signal:new AbortController().signal};
  assert.equal(store.reserveSave(scope,grant).status,'reserved');
  assert.equal(store.saveDisposition(scope,grant,true).status,'running');
  const result=await gatedMemorySave(store,scope,grant,()=>true)({text:grant.text},context);
  assert.equal(result.status,'saved');
  store.close();
  store=openMemoryStore(path);
  assert.deepEqual(store.reconcileSave(scope,grant).receipt,result.receipt);
  assert.deepEqual(store.replaySave(scope,grant).receipt,result.receipt);
  assert.equal(store.replaySave(scope,{...grant,text:'different value'}).status,'operation-conflict');
  assert.equal(store.replaySave(foreign,grant).status,'not-found');
  assert.equal(store.list(scope).length,1);
  console.log(JSON.stringify({installed:'@tori-studio/memory',schema:store.schemaVersion,operation:grant.operation,
    effect:result.receipt.memoryId,receipt:'same after reopen',effects:1,foreign:'denied'}));
}finally{store.close();}
