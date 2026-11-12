import assert from 'node:assert/strict';
import { createServer } from 'vite';

const url=process.argv[2]??'http://127.0.0.1:48826';
assert.match(url,/^http:\/\/127\.0\.0\.1:\d+$/);
const get=()=>fetch(url+'/api/studio').then(res=>res.json());
const post=async (path,body)=>{
  const res=await fetch(url+'/api/studio/'+path,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const result=await res.json();
  assert.equal(res.status,200,result.message);
  return result;
};
const initial=await get();
assert.ok(initial.provider,'The approved Coding connection is unavailable. Check local setup.');
const present=initial.activeAgents.find(item=>item.name==='Quellight');
if(!present){
  const fixtureHost=await createServer({server:{middlewareMode:true,watch:null}});
  try {
    const assembly=await fixtureHost.ssrLoadModule('/src/assembly.ts');
    const journal=assembly.history(assembly.emptyAssembly());
    const graph=journal.apply(assembly.assemblyPatchOperations(journal.graph,{
      name:'Quellight',instructions:'You are Quellight, a concise project assistant. Use the synthetic Orchid project facts when asked for an update: design is approved, implementation is in progress, and the next milestone is a demo on Friday. Use applicable saved preferences supplied by Studio for the answer format. If there is no saved format preference, answer in one short sentence. Use simple hyphen bullets when the user prefers bullets.',
      model:assembly.modelId,
    }),journal.graph.revision);
    assert.ok(graph.ok);
    const policy=journal.apply(assembly.configureOperations(journal.graph,'memory','savedMemory',assembly.governedMemoryValue),journal.graph.revision);
    assert.ok(policy.ok);
    const saved=await post('save',{graph:journal.graph,expected:initial.revision});
    const active=await post('activate',{revision:saved.revision});
    assert.equal(active.activation.savedMemory,true);
    console.log(JSON.stringify({agent:active.activation.name,revision:active.activation.number,activation:active.activation.version}));
  }finally{await fixtureHost.close();}
}else console.log(JSON.stringify({agent:present.name,revision:present.number,activation:present.version}));
