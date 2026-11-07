import test,{after,before} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'vite';
import {createStudio} from '../server/studio.mjs';

let vite, assembly, directory, service;
before(async()=>{
  vite=await createServer({server:{middlewareMode:true,watch:null}});
  assembly=await vite.ssrLoadModule('/src/assembly.ts');
  directory=await mkdtemp(join(tmpdir(),'tori-v1a-test-'));
  service=createStudio({getAssembly:()=>assembly,dataDirectory:directory});
});
after(async()=>{
  await service?.close();
  await vite?.close();
  if(directory)await rm(directory,{recursive:true,force:true});
});

test('typed links, shared edit and history retain the last valid graph',()=>{
  const {emptyAssembly,history,add,change,wire,instructions}=assembly;
  const session=history(emptyAssembly());
  assert.equal(session.apply([add('agent'),add('model'),add('instructions')]).ok,true);
  assert.equal(session.apply([change('instructions','text','One canonical instruction'),wire('instructions','instructions')]).ok,true);
  assert.equal(instructions(session.graph),'One canonical instruction');
  const previous=session.graph;
  assert.equal(session.apply([wire('model','instructions')]).ok,false);
  assert.deepEqual(session.graph,previous);
  assert.equal(session.apply([change('instructions','text','Edited from Inspector')]).ok,true);
  assert.equal(instructions(session.graph),'Edited from Inspector');
  assert.equal(session.undo().ok,true);
  assert.equal(instructions(session.graph),'One canonical instruction');
  assert.equal(session.redo().ok,true);
  assert.equal(instructions(session.graph),'Edited from Inspector');
});

test('save incomplete, reject stale writes, pin and restore activation after restart',async()=>{
  const {emptyAssembly,history,add,change,wire,modelId}=assembly;
  const author=history(emptyAssembly());
  assert.equal(author.apply([add('agent')]).ok,true);
  const first=await service.dispatch('/save',{graph:author.graph});
  await assert.rejects(service.dispatch('/activate',{revision:first.revision}),/instructions/);
  await assert.rejects(service.dispatch('/save',{graph:author.graph}),/newer draft/);
  assert.equal(author.apply([add('model'),change('agent','instructions','Summarize synthetic research.'),change('model','model',modelId),wire('model','model')]).ok,true);
  const second=await service.dispatch('/save',{graph:author.graph,expected:first.revision});
  const active=await service.dispatch('/activate',{revision:second.revision});
  assert.match(active.activation.version,/^v1_[a-f0-9]{64}$/);
  const opened=await service.dispatch('/sessions',{activation:active.activation.version});
  assert.equal(opened.sessions[0].number,2);
  assert.equal(author.apply([change('agent','name','Next revision')]).ok,true);
  const newer=await service.dispatch('/save',{graph:author.graph,expected:second.revision});
  assert.equal(newer.activation.version,active.activation.version);
  await service.close();
  service=createStudio({getAssembly:()=>assembly,dataDirectory:directory});
  const restored=await service.dispatch('',{});
  assert.equal(restored.revision.number,3);
  assert.equal(restored.activation.version,active.activation.version);
  assert.equal(restored.sessions[0].activation,active.activation.version);
  assert.equal(restored.runs.length,0);
});
