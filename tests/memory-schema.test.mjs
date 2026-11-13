import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { memoryScope, memoryStoreSchemaVersion, openMemoryStore } from '../packages/memory/index.mjs';

const legacySchema=`
  CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), secret TEXT NOT NULL);
  CREATE TABLE memories (id TEXT PRIMARY KEY, scope TEXT NOT NULL, revision INTEGER NOT NULL,
    status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, last_used_at TEXT);
  CREATE INDEX memory_scope ON memories(scope,updated_at DESC,id);
  CREATE TABLE revisions (id TEXT REFERENCES memories(id), revision INTEGER NOT NULL,
    content TEXT NOT NULL, session TEXT NOT NULL, source TEXT NOT NULL, saved_by_run TEXT NOT NULL,
    basis TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(id,revision));
  CREATE TABLE proposals (run TEXT PRIMARY KEY, scope TEXT NOT NULL, session TEXT NOT NULL,
    activation TEXT NOT NULL, source TEXT NOT NULL, basis TEXT NOT NULL, operation TEXT NOT NULL UNIQUE,
    expires INTEGER NOT NULL, status TEXT NOT NULL, text TEXT);
  CREATE INDEX proposal_scope ON proposals(scope,session);
  CREATE TABLE operations (id TEXT PRIMARY KEY, scope TEXT NOT NULL, digest TEXT NOT NULL, receipt TEXT NOT NULL, run TEXT);
`; // The shipped schema at 2e95a06. SQLite's user_version was 0.
const at='2026-11-12T10:00:00.000Z',time=Date.parse(at);
const scope=memoryScope('fixture-actor','fixture-project','fixture-agent');
const foreign=memoryScope('other-fixture-actor',scope.project,scope.agent);
const lineage={derivedFrom:[],compactedInto:null};
const contextBasis=['earlier-message','request-user'];
const grant={session:'original-session',activation:'immutable-activation',run:'original-run',operation:'save-op',text:'An exact first memory.'};
const nextText='Updated memory: “keep the due date.”\nPreserve spacing.';
const withDb=(path,run)=>{
  const db=new DatabaseSync(path);
  try{return run(db);}finally{db.close();}
};
const memoryRows=path=>withDb(path,db=>db.prepare('SELECT * FROM memories ORDER BY id').all());
const ledger=path=>withDb(path,db=>Object.fromEntries(['settings','operations','proposals','revisions']
  .map(table=>[table,db.prepare('SELECT * FROM '+table+' ORDER BY rowid').all()])));
const version=path=>withDb(path,db=>db.prepare('PRAGMA user_version').get().user_version);
const lineageOf=item=>({derivedFrom:item.derivedFrom,compactedInto:item.compactedInto});

test('unversioned store migrates atomically, retaining both scopes, revisions, receipts and tombstone',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'tori-memory-legacy-'));
  const path=join(dir,'legacy.sqlite');
  let store;
  try{
    const secret='synthetic legacy HMAC fixture';
    const digest=values=>createHmac('sha256',secret).update(JSON.stringify(values)).digest('hex');
    const receipt=(owner,id,operation,action,outcome,revision)=>({
      schema:'tori.memory.receipt@1',capability:'tori.memory.save',capabilityRevision:'1',
      operation,action,outcome,scope:{actor:owner.actor,project:owner.project,agent:owner.agent},
      memoryId:id,revision,source:{session:grant.session,message:contextBasis[1]},savedByRun:grant.run,
      contextBasis,operatorSession:grant.session,at,
    });
    const saved=receipt(scope,'legacy-active',grant.operation,'save','saved',1);
    const corrected=receipt(scope,'legacy-active','correct-op','correct','corrected',2);
    const forgotten=receipt(scope,'legacy-forgotten','forget-op','forget','forgotten',1);
    const correction={action:'correct',session:grant.session,id:saved.memoryId,expectedRevision:1,
      operation:corrected.operation,text:nextText};
    const forget={action:'forget',session:grant.session,id:forgotten.memoryId,expectedRevision:1,operation:forgotten.operation};
    withDb(path,db=>{
      db.exec(legacySchema);
      const insert=(table,count,...args)=>db.prepare('INSERT INTO '+table+' VALUES ('+Array(count).fill('?').join(',')+')').run(...args);
      insert('settings',2,1,secret);
      insert('memories',7,saved.memoryId,scope.key,2,'active',at,at,at);
      insert('memories',7,forgotten.memoryId,scope.key,1,'forgotten',at,at,null);
      insert('memories',7,'legacy-foreign',foreign.key,1,'active',at,at,null);
      insert('revisions',8,saved.memoryId,1,grant.text,grant.session,contextBasis[1],grant.run,JSON.stringify(contextBasis),at);
      insert('revisions',8,saved.memoryId,2,nextText,grant.session,contextBasis[1],grant.run,JSON.stringify(contextBasis),at);
      insert('revisions',8,'legacy-foreign',1,'Only the other actor sees this.',grant.session,contextBasis[1],grant.run,JSON.stringify(contextBasis),at);
      insert('proposals',10,grant.run,scope.key,grant.session,grant.activation,contextBasis[1],JSON.stringify(contextBasis),
        grant.operation,time+10000,'saved',null);
      insert('operations',5,saved.operation,scope.key,digest(['save',scope.key,grant.session,grant.activation,grant.run,grant.operation,grant.text]),JSON.stringify(saved),grant.run);
      insert('operations',5,corrected.operation,scope.key,digest(['correct',scope.key,grant.session,correction.id,1,correction.operation,correction.text]),JSON.stringify(corrected),null);
      insert('operations',5,forgotten.operation,scope.key,digest(['forget',scope.key,grant.session,forget.id,1,forget.operation,null]),JSON.stringify(forgotten),null);
    });
    assert.equal(version(path),0);
    const before=ledger(path),headers=memoryRows(path);
    for(let reopen=0;reopen<2;reopen++){
      store=openMemoryStore(path,{clock:()=>time});
      assert.equal(store.schemaVersion,memoryStoreSchemaVersion);
      assert.equal(version(path),memoryStoreSchemaVersion);
      assert.deepEqual(ledger(path),before);
      assert.deepEqual(memoryRows(path),headers.map(header=>Object.assign(Object.create(null),header,{derived_from:'[]',compacted_into:null})));
      const [item]=store.list(scope);
      assert.equal(item.id,saved.memoryId);
      assert.equal(item.revision,2);
      assert.equal(item.content,nextText);
      assert.equal(item.lastUsedAt,at);
      assert.deepEqual(lineageOf(item),lineage);
      assert.equal(store.inspect(scope,saved.memoryId,1).memory.content,grant.text);
      assert.equal(store.list(foreign)[0].id,'legacy-foreign');
      assert.equal(store.inspect(foreign,saved.memoryId).status,'not-found');
      assert.equal(store.inspect(scope,'legacy-foreign').status,'not-found');
      assert.deepEqual(store.inspect(scope,forgotten.memoryId),{status:'forgotten'});
      assert.deepEqual(store.receiptForRun(scope,grant.run),saved);
      assert.deepEqual(store.confirm(scope,grant).receipt,saved);
      assert.deepEqual(store.change(scope,correction).receipt,corrected);
      assert.deepEqual(store.change(scope,forget).receipt,forgotten);
      assert.deepEqual(ledger(path),before);
      store.close();store=undefined;
    }
  }finally{store?.close();await rm(dir,{recursive:true,force:true});}
});

test('fresh store writes dormant defaults and leaves an unknown schema untouched',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'tori-memory-schema-'));
  const path=join(dir,'fresh.sqlite');
  let store;
  try{
    store=openMemoryStore(path,{clock:()=>time});
    assert.equal(store.schemaVersion,memoryStoreSchemaVersion);
    assert.equal(version(path),memoryStoreSchemaVersion);
    const proposal=store.propose(scope,{...grant,source:contextBasis[1],contextBasis,expires:time+1000});
    const result=store.confirm(scope,{...grant,operation:proposal.operation});
    assert.deepEqual(lineageOf(store.list(scope)[0]),lineage);
    assert.equal(store.list(scope)[0].content,grant.text);
    assert.ok(!Object.hasOwn(result.receipt,'derivedFrom'));
    assert.ok(!Object.hasOwn(store.admit(scope).evidence.admitted[0],'compactedInto'));
    store.close();store=undefined;
    const before=ledger(path);
    withDb(path,db=>db.exec('PRAGMA user_version=99'));
    assert.throws(()=>openMemoryStore(path),/Unsupported TORI saved-memory schema version: 99/);
    assert.equal(version(path),99);
    assert.deepEqual(ledger(path),before);
  }finally{store?.close();await rm(dir,{recursive:true,force:true});}
});
