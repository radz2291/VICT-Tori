import assert from 'node:assert/strict';
import {createServer} from 'vite';

const url=process.argv[2]??'http://127.0.0.1:48872';
assert.match(url,/^http:\/\/127\.0\.0\.1:\d+$/);
const post=async(path,body)=>{
  const response=await fetch(url+'/api/studio/'+path,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const result=await response.json();
  assert.ok(response.ok,result.message);
  return result;
};
const initial=await fetch(url+'/api/studio').then(res=>res.json());
assert.ok(initial.provider,'The approved Coding route is unavailable.');
if(initial.activeAgents.some(a=>a.name==='Quellight')){
  console.log(JSON.stringify({workspace:initial.workspace,quellight:initial.activeAgents.find(a=>a.name==='Quellight').version}));
}else{
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  try {
    const a=await vite.ssrLoadModule('/src/assembly.ts');
    const agent=(name,instructions)=>a.history(make(name,instructions));
    function make(name,instructions){
      const draft=a.history(a.emptyAssembly());
      assert.ok(draft.apply(a.assemblyPatchOperations(draft.graph,{name,instructions,model:a.modelId})).ok);
      return draft.graph;
    }
    function edit(draft,...operations){assert.ok(draft.apply(operations).ok);}
    const research=agent('Research','Use only the approved Research Topics script for synthetic project facts. For habits, call Research Topics with key habits. Report the returned code and short finding.');
    edit(research,a.add('tool'),a.change('tool','reference','research-topics@1'),a.wire('tool','tool'),
      a.change('agent','maxSteps',3),a.change('agent','maxToolCalls',2));
    const researchDef=(await post('definitions',{})).definition;
    const researchRevision=(await post('save',{definition:researchDef,graph:research.graph})).revision;
    await post('activate',{definition:researchDef,revision:researchRevision});
    const parent=agent('Quellight','You are Quellight, a concise project companion. When asked to delegate, use the saved Research specialist first. For a long review, explain the finding, assumptions, tradeoffs, and follow-up ideas in detail. Use only synthetic facts. For regular replies, use applicable saved preferences from Studio.');
    edit(parent,a.add('child'),a.change('child','reference','saved:'+researchRevision.id),a.wire('child','child'),
      a.add('memory'),a.wire('memory','memory'),a.change('agent','maxSteps',5),a.change('agent','maxToolCalls',1),a.change('model','tokens',4096));
    edit(parent,...a.configureOperations(parent.graph,'memory','savedMemory',a.governedMemoryValue));
    const revision=(await post('save',{definition:initial.definition,graph:parent.graph,expected:initial.revision})).revision;
    const {activation}=await post('activate',{definition:initial.definition,revision});
    assert.equal(activation.savedMemory,true);
    assert.equal(activation.childRevision,researchRevision.id);
    console.log(JSON.stringify({workspace:initial.workspace,quellight:activation.version,research:researchRevision.id}));
  }finally{await vite.close();}
}
