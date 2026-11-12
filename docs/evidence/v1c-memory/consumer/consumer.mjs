import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gatedMemorySave, memoryIntent, memoryScope, memoryStoreSchemaVersion, openMemoryStore } from '@tori-studio/memory';
import { effectiveMemoryPolicy, memoryArtifact } from '@tori-studio/memory/policy';

const scope=memoryScope('synthetic-actor','synthetic-project','synthetic-agent');
const other=memoryScope(scope.actor,scope.project,'different-agent');
const directory=await mkdtemp(join(tmpdir(),'tori-memory-consumer-'));
const file=join(directory,'consumer.sqlite');
const text='Keep synthetic progress reports in three short bullets.';
assert.equal(memoryIntent('Remember that '+text).kind,'explicit');
let store=openMemoryStore(file);
try {
  const request={session:'consumer-session',activation:'consumer-activation',run:'consumer-run',
    source:'consumer-source-user',contextBasis:['consumer-source-user']};
  const proposal=store.propose(scope,{...request,text,expires:Date.now()+60000});
  const grant={...request,confirmed:true,operation:proposal.operation};
  const call={victActorId:scope.actor,victTurnId:request.run,victIdempotencyKey:proposal.operation,signal:new AbortController().signal};
  assert.equal(store.admit(scope).evidence.admitted.length,0);
  await assert.rejects(gatedMemorySave(store,scope,{...grant,confirmed:false},()=>true)({text},call),/not granted/);
  const result=await gatedMemorySave(store,scope,grant,()=>true)({text},call);
  assert.equal(result.status,'saved');
  assert.equal(store.schemaVersion,memoryStoreSchemaVersion);
  assert.deepEqual(store.list(scope)[0].derivedFrom,[]);
  assert.equal(store.list(scope)[0].compactedInto,null);
  for(const artifact of [memoryArtifact(),memoryArtifact('recent-10@1','governed@1')])
    assert.equal(effectiveMemoryPolicy(artifact).organizer,'off');
  assert.equal(memoryIntent("Don't forget to send the report.").reason,'memory-or-reminder');
  store.close();
  store=openMemoryStore(file);
  assert.deepEqual(store.admit(scope).evidence.admitted.map(item=>item.id),[result.receipt.memoryId]);
  assert.equal(store.admit(other).evidence.admitted.length,0);
  assert.deepEqual(await gatedMemorySave(store,scope,grant,()=>true)({text},call),result);
  const forgot=store.change(scope,{action:'forget',session:'consumer-second-session',id:result.receipt.memoryId,
    operation:'consumer-forget',expectedRevision:1});
  assert.equal(forgot.status,'forgotten');
  assert.equal(store.inspect(scope,result.receipt.memoryId,1).status,'forgotten');
  assert.equal(store.admit(scope).evidence.admitted.length,0);
  console.log(JSON.stringify({consumer:'installed @tori-studio/memory with public VICT runtime',save:result.status,
    replay:'original receipt',crossAgentAdmissions:0,forget:forgot.status}));
}finally{store.close();}
