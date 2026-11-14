import assert from 'node:assert/strict';
import {mkdir,access} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {fixtureRuns,fixtureSession} from '../fixtures/run-visibility/preview.mjs';

const root=resolve('.data'),directory=resolve(process.argv[2]??'.data/run-visibility-fixture-48902');
assert.ok(relative(root,directory)&&!relative(root,directory).startsWith('..'),'Use an isolated store inside this checkout .data directory.');
await mkdir(directory,{recursive:true});
const file=join(directory,'studio.sqlite');
assert.equal(await access(file).then(()=>true,()=>false),false,'Preserve the existing fixture workspace; seed once only.');
const db=new DatabaseSync(file);
try{
  db.exec('CREATE TABLE project (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');
  db.prepare('INSERT INTO project VALUES (1,?)').run(JSON.stringify({workspace:'run-visibility-labelled-fixture',
    drafts:[],activations:[],sessions:[fixtureSession],runs:fixtureRuns}));
}finally{db.close();}
console.log(JSON.stringify({origin:'synthetic presentation fixture',runs:fixtureRuns.length,providerCalls:0}));
