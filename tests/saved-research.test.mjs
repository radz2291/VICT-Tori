import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createServer } from 'vite';
import { createStudio } from '../server/studio.mjs';

test('saved Research uses the same activation directly and through a pinned, governed child Run', async()=>{
  const directory=await mkdtemp(join(tmpdir(),'tori-saved-research-'));
  const calls=join(directory,'mcp-calls.txt');
  const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
  const assembly=await vite.ssrLoadModule('/src/assembly.ts');
  Object.assign(process.env,{
    TORI_ZAI_ROUTE:'coding',TORI_ZAI_API_KEY:'synthetic-a1-fixture',TORI_ENABLE_PI_ZAI:'0',
    TORI_BROWSER_A3:'1',TORI_BROWSER_A4:'1',TORI_A1_CAPTURE:join(directory,'requests.jsonl'),
    TORI_MCP_CALL_CAPTURE:calls,
  });
  const originalFetch=globalThis.fetch;
  await import('./a1-provider-fixture.mjs');
  const fixtureFetch=globalThis.fetch;
  const requests=[];
  globalThis.fetch=(url,init)=>{requests.push(JSON.parse(init.body));return fixtureFetch(url,init);};
  const start=()=>createStudio({getAssembly:()=>assembly,dataDirectory:directory});
  let service=start();
  const dispatch=(path,input={})=>service.dispatch(path,input);
  const countCalls=async()=> (await readFile(calls,'utf8')).trim().split('\n').length;
  try{
    const {history,emptyAssembly,add,change,wire,modelId}=assembly;
    const agent=(name,instructions)=>{
      const draft=history(emptyAssembly());
      edit(draft,add('agent'),add('model'),change('agent','name',name),
        change('agent','instructions',instructions),change('agent','maxSteps',2),
        change('model','model',modelId),wire('model','model'));
      return draft;
    };
    function edit(draft,...ops){
      const result=draft.apply(ops);
      assert.equal(result.ok,true,JSON.stringify(result.issues));
    }
    const save=async(draft,definition,expected)=>
      (await dispatch('/save',{graph:draft.graph,definition,expected})).revision;
    const activate=async(definition,revision)=>(await dispatch('/activate',{definition,revision})).activation;
    const session=async activation=>(await dispatch('/sessions',{activation:activation.version})).sessions[0];
    const turn=(session,input,includeContext)=>dispatch('/turn',{session:session.id,input,includeContext});
    const researchId=(await dispatch('/definitions')).definition;
    const research=agent('Research Agent','Research instructions r1. Use the admitted project context and one observatory read.');
    edit(research,add('context'),change('context','reference','project-knowledge@1'),wire('context','context'),
      add('tool'),wire('tool','tool'),change('model','tokens',512));
    const researchR1=await save(research,researchId);
    const researchActivation=await activate(researchId,researchR1);
    const direct=await turn(await session(researchActivation),'Research the observatory.',true);
    assert.equal(direct.runs[0].status,'completed',JSON.stringify(direct.runs[0]));
    assert.equal(direct.runs[0].context.status,'admitted');
    assert.equal(direct.runs[0].governance.calls,1);
    assert.equal(await countCalls(),1);
    const parent=agent('Quellight','Delegate the supplied research task, then return a finding.');
    edit(parent,add('child'),change('child','reference','saved:'+researchR1.id),wire('child','child'),
      add('output'),wire('output','output'));
    const parentR1=await save(parent);
    const parentActivation=await activate(undefined,parentR1);
    const parentSession=await session(parentActivation);
    edit(research,change('agent','instructions','Research instructions r2.'),change('model','tokens',1024));
    const researchR2=await save(research,researchId,researchR1);
    const researchActivationR2=await activate(researchId,researchR2);
    assert.notEqual(researchActivationR2.version,researchActivation.version);
    await service.close();
    service=start();
    assert.equal((await dispatch('')).activation.childRevision,researchR1.id);
    assert.equal((await dispatch('',{definition:researchId})).revision.id,researchR2.id);
    const linked=await turn(parentSession,'Delegate the observatory research.');
    const parentRun=linked.runs[0];
    const child=linked.runs.find(run=>run.parentRun===parentRun.id);
    assert.equal(parentRun.status,'completed',JSON.stringify(linked.runs.slice(0,2)));
    assert.equal(child.status,'completed');
    assert.equal(child.definition,researchId);
    assert.equal(child.revision,researchR1.id);
    assert.equal(child.activation,researchActivation.version);
    assert.equal(child.sentMaxOutputTokens,512);
    assert.equal(child.context.source,'project-knowledge@1');
    assert.equal(child.context.status,'admitted');
    assert.equal(child.context.reads,1);
    assert.equal(child.governance.calls,1);
    assert.equal(child.governance.scope.id,researchId);
    assert.equal(child.parentInvocation,parentRun.governance.invocations[0].invocationId);
    assert.equal(parentRun.governance.calls,0);
    assert.equal(await countCalls(),2);
    const childRequest=requests.findLast(request=>request.max_tokens===512);
    assert.match(JSON.stringify(childRequest.messages),/Research instructions r1/);
    assert.match(JSON.stringify(childRequest.messages),/Bound reference material/);
    assert.match(JSON.stringify(childRequest.messages),/TERN-MCP-READ/);
    process.env.TORI_CHILD_MCP_REVOKED='1';
    const denied=await turn(parentSession,'Delegate again with the child tool grant revoked.');
    const deniedChild=denied.runs.find(run=>run.parentRun===denied.runs[0].id);
    assert.equal(deniedChild.status,'failed');
    assert.equal(deniedChild.errorCode,'TORI_MCP_SCOPE_DENIED');
    assert.equal(deniedChild.governance.calls,0);
    assert.equal(await countCalls(),2);
    console.log(JSON.stringify({directory,researchId,direct:direct.runs[0].id,parent:parentRun.id,child:child.id,
      deniedChild:deniedChild.id,pinnedRevision:researchR1.id,currentRevision:researchR2.id}));
  }finally{
    delete process.env.TORI_CHILD_MCP_REVOKED;
    globalThis.fetch=originalFetch;
    await service.close();
    await vite.close();
  }
});
