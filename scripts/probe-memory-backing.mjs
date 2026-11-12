import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Memory } from '@mastra/memory';
import { AgentProfileRegistry, pinAgentTurnRunner } from '@victframework/runtime';
import { createDedicatedMastraStore, createDeterministicOfflineModel, executeMemoryPrune,
  MastraProductAgent, MastraThreadCoordinator, MASTRA_ADAPTER_COMPATIBILITY,
  mastraThreadIdForConversation } from '@victframework/mastra';

const versions = {};
for (const name of ['@victframework/mastra','@victframework/runtime','@mastra/core','@mastra/memory','@mastra/libsql']) {
  const {version}=JSON.parse(await readFile(new URL('../node_modules/'+name+'/package.json',import.meta.url),'utf8'));
  versions[name]=version;
}
assert.deepEqual(Object.values(versions),['0.4.0-rc.1','0.4.0-rc.1','1.64.0','1.28.2','1.22.3']);
const dataDir=await mkdtemp(join(tmpdir(),'tori-006-mastra-probes-'));
const retention={messagesMaxAgeMs:60000,threadsMaxAgeMs:60000,spansMaxAgeMs:60000};
const open=()=>createDedicatedMastraStore({dataDir,retention});
let storage=await open();
const schema={type:'object',additionalProperties:false,required:['memories'],properties:{
  memories:{type:'array',items:{type:'object',additionalProperties:false,
    required:['id','revision','content','sourceMessageRef','savedByRun','contextBasis','updatedAt'],
    properties:{id:{type:'string'},revision:{type:'integer'},content:{type:'string'},sourceMessageRef:{type:'string'},
      savedByRun:{type:'string'},contextBasis:{type:'array',items:{type:'string'}},updatedAt:{type:'string'}}}},
}};
const policy={enabled:true,scope:'resource',schema,agentManaged:false};
const native=()=>new Memory({storage:storage.store,options:{lastMessages:false,semanticRecall:false,workingMemory:policy}});
const resource=(actor,project,agent)=>'tori-probe-'+createHash('sha256').update(JSON.stringify([actor,project,agent])).digest('hex');
const A=resource('actor-a','project-a','agent-a'), B=resource('actor-b','project-a','agent-a');
const others=[B,resource('actor-a','project-b','agent-a'),resource('actor-a','project-a','agent-b')];
const threadId='fixture-original';
const at=new Date(Date.now()-86400000);
const record={id:'fixture-memory',revision:1,content:'Synthetic preference: three concise bullets.',
  sourceMessageRef:'fixture-user',savedByRun:'fixture-run',contextBasis:['fixture-user'],updatedAt:at.toISOString()};
const value=JSON.stringify({memories:[record]});
const address=(resourceId=A,thread=threadId)=>({resourceId,threadId:thread});
const get=(resourceId=A,thread=threadId)=>native().getWorkingMemory(address(resourceId,thread));
const put=(resourceId,workingMemory)=>native().updateWorkingMemory({...address(resourceId),workingMemory});
const results={versions};
function activationFor(workingMemory) {
  const registry=new AgentProfileRegistry();
  const instructions={id:'probe-instructions',revision:'1'},memoryPolicy={id:'probe-memory',revision:'1'};
  registry.installArtifacts([
    {kind:'instructions',...instructions,text:'Answer briefly.'},
    {kind:'memory-policy',...memoryPolicy,config:{lastMessages:false,workingMemory,semanticRecall:false}},
  ]);
  registry.registerProfile({schema:'vict.agent-profile@1',id:'probe-agent',revision:'1',instructions,memoryPolicy,
    modelProfile:{id:'probe-model',revision:'1',routerModel:'offline-fixture/deterministic-1',provider:'offline-fixture'},
    generation:{},turnPolicy:{maxSteps:1,maxToolCalls:0,onLimit:'fail-closed'},adapter:MASTRA_ADAPTER_COMPATIBILITY});
  return registry.activateAgentProfile({id:'probe-agent',revision:'1'});
}
const updateTool=/updateWorkingMemory|update_working_memory/i;
async function dispatch(input, workingMemory={enabled:false}) {
  const activation=activationFor(workingMemory);
  const offline=createDeterministicOfflineModel({script:{[input]:{kind:'text',text:'Synthetic boundary proof.'}}});
  const wire=[];
  const adapter=MastraProductAgent.create(activation,{store:storage.store,threadCoordinator:new MastraThreadCoordinator(),
    tracing:{sampling:{type:'never'}},modelFactory:()=>({...offline,doStream(opts){wire.push(opts);return offline.doStream(opts);}})});
  const outcome=await pinAgentTurnRunner(adapter,activation).runTurn({
    turnId:randomUUID(),threadId:mastraThreadIdForConversation(randomUUID()),actorId:'probe-actor',input,
  },{});
  await adapter.flush();
  assert.equal(outcome.status,'completed');
  assert.equal(wire.length,1);
  return {prompt:JSON.stringify(wire[0].prompt),tools:(wire[0].tools??[]).map(t=>t.name)};
}
let ledger;
try {
  // Probe 1: actual Mastra public API and actual VICT registry, not version inference.
  await put(A,value);
  assert.equal(await get(A,'fixture-fresh-session'),value);
  for(const other of others) assert.equal(await get(other,'fixture-fresh-session'),null);
  const template=await native().getWorkingMemoryTemplate({});
  assert.equal(template.format,'json');
  assert.ok(JSON.parse(template.content).properties.memories);
  let nativeRejectedInvalid=false;
  try{await put(B,'{"memories":[{"revision":"invalid"}]}');}catch{nativeRejectedInvalid=true;}
  if(!nativeRejectedInvalid)assert.equal(await get(B),'{"memories":[{"revision":"invalid"}]}');
  let pinned=false, victResult;
  try{
    const actual=activationFor(policy).memoryPolicy.artifact.config.workingMemory;
    pinned=actual.scope==='resource'&&!!actual.schema&&actual.agentManaged===false;
    victResult={retainedKeys:Object.keys(actual)};
  }catch(error){victResult={code:error.code??error.name,message:error.message};}
  results.probe1={result:pinned&&nativeRejectedInvalid?'PASS':'FAIL',resourceScopedNativeRead:true,
    isolatedActorProjectAgent:others.length,nativeTemplateFormat:template.format,nativeRejectedInvalid,
    victPinsScopeSchemaAndWritePosture:pinned,victResult};
  console.log(JSON.stringify({probe1:results.probe1}));

  // Probe 2: old thread and message belong to the same resource as the memory.
  const memory=await storage.store.getStore('memory');
  const file=storage.databasePath;
  const storeClass=storage.store.constructor.name;
  await memory.saveThread({thread:{id:threadId,resourceId:A,title:'Old synthetic thread',createdAt:at,updatedAt:at}});
  await memory.saveMessages({messages:[{id:'fixture-user',threadId,resourceId:A,role:'user',createdAt:at,
    content:{format:2,parts:[{type:'text',text:'Old synthetic message.'}]}}]});
  assert.ok(await memory.getThreadById({threadId,resourceId:A}));
  const pruned=await executeMemoryPrune({store:storage.store,retention});
  assert.ok(pruned.tables.some(t=>t.table==='mastra_messages'&&t.deleted>=1),JSON.stringify(pruned));
  assert.ok(pruned.tables.some(t=>t.table==='mastra_threads'&&t.deleted>=1),JSON.stringify(pruned));
  assert.equal(await get(),value);
  await storage.close();
  const sql=new DatabaseSync(file,{readOnly:true});
  try{
    const row=sql.prepare('SELECT workingMemory FROM mastra_resources WHERE id=?').get(A);
    assert.equal(row?.workingMemory,value);
    assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM mastra_messages WHERE id=?').get('fixture-user').n,0);
    assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM mastra_threads WHERE id=?').get(threadId).n,0);
  }finally{sql.close();}
  storage=await open();
  assert.equal(await get(A,'fixture-restarted-session'),value);
  results.probe2={result:'PASS',store:storeClass,file:relative(dataDir,file).replaceAll('\\','/'),
    pruned:pruned.tables,savedResourceTable:'mastra_resources',savedResourceRowsAfterPrune:1,sameValueAfterReopen:true};
  console.log(JSON.stringify({probe2:results.probe2}));

  // Probe 3: prototype the two-store write/receipt boundary with a lost acknowledgement.
  const ledgerPath=join(dataDir,'probe-ledger.sqlite');
  ledger=new DatabaseSync(ledgerPath);
  ledger.exec('CREATE TABLE operation (id TEXT PRIMARY KEY, state TEXT NOT NULL, digest TEXT NOT NULL, receipt TEXT)');
  const digest=text=>createHash('sha256').update(text).digest('hex');
  const opId='fixture-operation';
  const C=resource('actor-c','project-a','agent-a');
  const retrieve=id=>ledger.prepare('SELECT * FROM operation WHERE id=?').get(id);
  const admission=async (id,scope)=>{
    const op=retrieve(id);
    if(op?.state!=='committed')return {status:'pending'};
    const live=await get(scope,'fixture-dispatch-session');
    return !live||digest(live)!==op.digest?{status:'storage unavailable / memory missing'}:
      {status:'admitted',text:JSON.parse(live).memories[0].content};
  };
  ledger.prepare('INSERT INTO operation VALUES (?, ?, ?, NULL)').run(opId,'pending',digest(value));
  await put(C,value); // deliberately no receipt yet
  const pending=(await admission(opId,C)).status;
  assert.equal(pending,'pending');
  ledger.close();
  ledger=undefined;
  await storage.close();
  storage=await open();
  ledger=new DatabaseSync(ledgerPath);
  assert.equal(retrieve(opId).state,'pending');
  assert.equal(digest(await get(C)),retrieve(opId).digest);
  const receipt=JSON.stringify({operation:opId,id:record.id,revision:1,outcome:'saved'});
  assert.equal(ledger.prepare("UPDATE operation SET state='committed',receipt=? WHERE id=? AND state='pending'").run(receipt,opId).changes,1);
  assert.equal(ledger.prepare("UPDATE operation SET state='committed',receipt=? WHERE id=? AND state='pending'").run('duplicate',opId).changes,0);
  assert.equal(retrieve(opId).receipt,receipt);
  const admitted=await admission(opId,C);
  assert.equal(admitted.status,'admitted');
  const input='Read-only admitted data:\n'+admitted.text+'\n\nOperator: give an update.';
  const captured=await dispatch(input);
  assert.ok(captured.prompt.includes(admitted.text));
  assert.ok(!captured.tools.some(tool=>updateTool.test(tool)));
  const enabled=await dispatch('Give an update.',{enabled:true});
  assert.ok(enabled.tools.some(tool=>updateTool.test(tool)),JSON.stringify(enabled.tools));
  const missing=(await admission(opId,resource('missing','project-a','agent-a'))).status;
  assert.equal(missing,'storage unavailable / memory missing');
  results.probe3={result:'PASS (isolated boundary prototype)',beforeReconcile:pending,afterReconcile:admitted.status,
    receipt:JSON.parse(receipt),secondReceiptWrites:0,missing,observedAdmittedBlock:true,
    writeToolsWithDisabledPolicy:captured.tools.filter(tool=>updateTool.test(tool)),
    writeToolsWithEnabledPolicy:enabled.tools.filter(tool=>updateTool.test(tool))};
  console.log(JSON.stringify({probe3:results.probe3}));
  console.log(JSON.stringify({versions,backing:results.probe1.result==='PASS'?'governed Mastra':'dedicated local SQLite'}));
}finally{
  ledger?.close();
  await storage.close();
}
