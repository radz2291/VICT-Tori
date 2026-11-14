import assert from 'node:assert/strict';
import {createServer} from 'vite';

const url=process.argv[2];
assert.match(url,/^http:\/\/127\.0\.0\.1:\d+$/);
const read=async(path='',body)=>{
  const response=await fetch(url+'/api/studio'+path,body===undefined?{}:{method:'POST',
    headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json();
  assert.equal(response.status,200,data.message);
  return data;
};
const initial=await read();
assert.ok(initial.provider,'The authorized Coding connection is unavailable.');
assert.equal(initial.activeAgents.length,0,'Seed only a fresh isolated workspace.');
assert.equal(initial.sessions.length,0,'Preserve existing Sessions.');
const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
try{
  const a=await vite.ssrLoadModule('/src/assembly.ts');
  const draft=(name,instructions)=>{
    const h=a.history(a.emptyAssembly());
    assert.ok(h.apply(a.assemblyPatchOperations(h.graph,{name,instructions,model:a.modelId})).ok);
    return h;
  };
  const apply=(h,...ops)=>assert.ok(h.apply(ops).ok);
  const save=async(h,definition)=>{
    const revision=(await read('/save',{definition,graph:h.graph})).revision;
    const {activation}=await read('/activate',{definition,revision});
    return {revision,activation};
  };
  const research=draft('Research','Use only the approved Research Topics script for synthetic project facts. For habits, call Research Topics with key habits. Report the returned code and short finding.');
  apply(research,a.add('tool'),a.change('tool','reference','research-topics@1'),a.wire('tool','tool'),
    a.change('agent','maxSteps',3),a.change('agent','maxToolCalls',2));
  const researchDefinition=(await read('/definitions',{})).definition;
  const child=await save(research,researchDefinition);
  const parent=draft('Quellight','You are Quellight, a concise project companion. Orchid design is approved, implementation is in progress, and the demo is Friday. When asked to delegate, use the saved Research specialist first. Use only synthetic facts and applicable confirmed saved preferences. Acknowledge preferred-format requests naturally without claiming anything was saved.');
  apply(parent,a.add('child'),a.change('child','reference','saved:'+child.revision.id),a.wire('child','child'),
    a.change('agent','maxSteps',5),a.change('agent','maxToolCalls',1));
  apply(parent,...a.configureOperations(parent.graph,'memory','savedMemory',a.governedMemoryValue));
  apply(parent,...a.configureOperations(parent.graph,'directive','','',false),a.wire('directive','directive'));
  const quellight=await save(parent,initial.definition);
  const author=draft('Authoring Agent','Help the operator compose and inspect agents in this Studio through the authorized workspace tools. Preserve manual work and report actual results.');
  apply(author,a.add('authoring'),a.change('authoring','reference','workspace@1'),a.wire('authoring','authoring'),
    a.change('agent','maxSteps',7),a.change('agent','maxToolCalls',5));
  const authorDefinition=(await read('/definitions',{})).definition;
  const authoring=await save(author,authorDefinition);
  const {openedSession}=await read('/sessions',{activation:quellight.activation.version});
  console.log(JSON.stringify({fixture:initial.fixture,workspace:initial.workspace,activation:quellight.activation.version,quellight:quellight.activation.version,
    research:child.activation.version,authoring:authoring.activation.version,session:openedSession}));
}finally{await vite.close();}
