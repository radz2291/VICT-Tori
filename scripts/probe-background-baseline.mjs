import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'vite';
import {syntheticKey} from '../tests/memory-provider-fixture.mjs';

const dir=await mkdtemp(join(tmpdir(),'tori-007-memory-baseline-'));
const capture=join(dir,'requests.ndjson');
const port=process.env.TORI_PROBE_PORT??'48871', url='http://127.0.0.1:'+port;
let host, exited;
const app=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
const assembly=await app.ssrLoadModule('/src/assembly.ts');
await app.close();
const wait=async(check,label,timeout=30000)=>{
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline){const value=await check().catch(()=>undefined);if(value)return value;await delay(100);}
  throw Error('Timed out waiting for '+label);
};
const call=async(path='',body,signal)=>{
  const res=await fetch(url+'/api/studio'+path,body===undefined?{signal}:{
    method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body),signal,
  });
  const data=await res.json();assert.ok(res.ok,data.message);return data;
};
const start=async()=>{
  host=spawn(process.execPath,['--import','./tests/memory-provider-fixture.mjs',
    './node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',port,'--strictPort'],{
    env:{...process.env,TORI_DATA_DIR:dir,TORI_ZAI_API_KEY:syntheticKey,TORI_ZAI_ROUTE:'coding',TORI_ENABLE_PI_ZAI:'0',
      TORI_MEMORY_FIXTURE_PRELOAD:'1',TORI_MEMORY_CAPTURE:capture},
    windowsHide:true,stdio:['ignore','ignore','ignore'],
  });
  exited=once(host,'exit');
  await wait(async()=>host.exitCode===null&&(await call()).fixture,'isolated baseline fixture host');
};
const stop=async()=>{if(host&&host.exitCode===null){host.kill();await exited;}};
const turns=async()=> (await readFile(capture,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
try{
  await start();
  const {history,emptyAssembly,add,change,wire,modelId,configureOperations,governedMemoryValue}=assembly;
  const draft=history(emptyAssembly());
  assert.ok(draft.apply([add('agent'),add('model'),add('memory'),wire('model','model'),wire('memory','memory'),
    change('agent','name','Quellight'),change('agent','instructions','Synthetic conformance only.'),change('model','model',modelId)]).ok);
  assert.ok(draft.apply(configureOperations(draft.graph,'memory','savedMemory',governedMemoryValue)).ok);
  const {revision}=await call('/save',{graph:draft.graph});
  const {activation}=await call('/activate',{revision});
  const {openedSession:session}=await call('/sessions',{activation:activation.version});
  const observed=async(input,disconnect=false)=>{
    const transport=new AbortController();
    const running=call('/turn',{session,input},transport.signal).catch(e=>({message:e.name}));
    await wait(async()=> (await turns()).some(row=>row.prompt===input),'provider dispatch');
    const snap=await call();
    const row=snap.runs.find(row=>row.session===session&&row.status==='running');
    assert.ok(row);
    if(disconnect){
      transport.abort();
      assert.equal((await running).message,'AbortError');
      assert.equal((await call()).runs.find(r=>r.id===row.id).status,'running');
    }
    return row;
  };
  const stopPrompt='Synthetic slow review: detach then cancel.';
  const first=await observed(stopPrompt,true);
  const cancellation=await call('/stop-turn',{session,run:first.id});
  assert.equal(cancellation.status,'stopping');
  const cancelled=await wait(async()=> (await call()).runs.find(r=>r.id===first.id&&r.status==='cancelled'),'terminal cancellation');
  assert.equal((await turns()).filter(r=>r.prompt===stopPrompt).length,1);
  console.log(JSON.stringify({probe:'accepted Studio transport abort',runId:first.id,session,pinnedActivation:activation.version,
    rejoined:'running',cancelled:cancelled.status,code:cancelled.errorCode,modelDispatches:1}));
  const {openedSession:secondSession}=await call('/sessions',{activation:activation.version});
  const restartPrompt='Synthetic slow review: process crash.';
  const restartRequest=call('/turn',{session:secondSession,input:restartPrompt}).catch(()=>null);
  await wait(async()=> (await turns()).some(row=>row.prompt===restartPrompt),'second provider dispatch');
  const interrupted=(await call()).runs.find(row=>row.session===secondSession&&row.status==='running');
  assert.ok(interrupted);
  const before=host.pid;
  await stop();
  await restartRequest;
  await start();
  const snap=await call();
  const original=snap.runs.find(r=>r.id===interrupted.id);
  assert.equal(original.status,'interrupted');
  assert.ok(snap.sessions.find(s=>s.id===secondSession).interrupted);
  assert.equal((await turns()).filter(r=>r.prompt===restartPrompt).length,1);
  console.log(JSON.stringify({probe:'accepted Studio process restart',runId:interrupted.id,session:secondSession,
    before,after:host.pid,record:original.status,sessionLocked:true,modelDispatches:1,previousCancellationRetained:snap.runs.some(r=>r.id===first.id&&r.status==='cancelled')}));
}finally{await stop();}
