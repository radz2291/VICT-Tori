import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createServer } from 'vite';

const root = await mkdtemp(join(tmpdir(), 'tori-a1-independent-regressions-'));
const capture = join(root, 'system-capture.jsonl');
const attempts = join(root, 'attempts.jsonl');
const port = process.env.TORI_VERIFIER_PORT ?? '48775';
const origin = 'http://127.0.0.1:'+port;
const address = origin+'/api/studio';
const key = 'synthetic-verifier-only';
const initial = 'A1 independent fixture revision one.';
const edited = 'A1 independent fixture revision two.';
let server, log;

async function start(route, credential, allow) {
  log = '';
  server = spawn(process.execPath, ['--import','./verifier-preload.mjs',
    './node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',port,'--strictPort'], {
    windowsHide: true,
    env: {...process.env, TORI_DATA_DIR:root, TORI_ZAI_ROUTE:route, TORI_ZAI_API_KEY:credential,
      TORI_ENABLE_PI_ZAI:'0', TORI_EXECUTION_FIXTURE:'', TORI_VERIFIER_ALLOW:allow?'1':'0',
      TORI_VERIFIER_CAPTURE:capture,TORI_VERIFIER_ATTEMPTS:attempts},
  });
  for (const stream of [server.stdout,server.stderr]) stream.on('data', data=>{log+=data;});
  for (let i=0; i<600; i++) {
    if (server.exitCode!==null) throw new Error(log);
    if (log.includes('Local:') && (await fetch(address).catch(()=>null))?.ok) return;
    await setTimeout(100);
  }
  throw new Error('Studio startup timed out\n'+log);
}
async function stop() {
  if (!server || server.exitCode!==null || server.signalCode!==null) return;
  const closed = once(server,'exit');
  server.kill();
  await closed;
}
async function get() {
  const response = await fetch(address);
  assert.equal(response.status,200);
  return response.json();
}
async function post(path,data,status=200) {
  const response = await fetch(address+'/'+path,{method:'POST',
    headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
  const body = await response.json();
  assert.equal(response.status,status,JSON.stringify(body));
  return body;
}
async function readLines(file) {
  return (await readFile(file,'utf8')).trim().split('\n').map(line=>JSON.parse(line));
}
async function turn(session, revision, instruction, limit) {
  const state = await post('turn',{session:session.id,input:'Synthetic instruction-revision verification'});
  const run = state.runs[0];
  assert.equal(run.status,'completed',JSON.stringify(run));
  assert.equal(run.session,session.id);
  assert.equal(run.activation,session.activation);
  assert.equal(run.revision,revision.id);
  assert.equal(run.route,'coding');
  assert.equal(run.sentMaxOutputTokens,limit);
  const outgoing = (await readLines(capture)).at(-1);
  assert.deepEqual(outgoing.system,[instruction]);
  assert.equal(outgoing.maxOutputTokens,limit);
  return {session:run.session,activation:run.activation,revision:run.revision,...outgoing};
}
async function refusal(label, route, credential, old) {
  await stop();
  await start(route,credential,false);
  const before = await get();
  const pinned = before.sessions.find(session=>session.id===old.id);
  assert.equal(before.route,route);
  assert.equal(before.provider,Boolean(credential));
  assert.equal(pinned.route,'coding');
  assert.equal(pinned.activation,old.activation);
  assert.equal(pinned.connectionReady,false);
  const captureBefore = await readFile(capture,'utf8');
  const attemptsBefore = await readFile(attempts,'utf8');
  const result = await post('turn',{session:old.id,input:'Synthetic refused verification'},409);
  assert.match(result.message,/credential for this Session's pinned route/);
  const after = await get();
  assert.deepEqual(after,before);
  assert.equal(await readFile(capture,'utf8'),captureBefore);
  assert.equal(await readFile(attempts,'utf8'),attemptsBefore);
  return {label,hostRoute:route,hostCredentialPresent:before.provider,
    session:old.id,pinnedRoute:pinned.route,activation:pinned.activation,status:409,
    message:result.message,newRuns:0,additionalFetchAttempts:0};
}

try {
  const vite = await createServer({server:{middlewareMode:true,watch:null}});
  const a = await vite.ssrLoadModule('/src/assembly.ts');
  const author = a.history(a.emptyAssembly());
  assert.equal(author.apply([a.add('agent'),a.add('model'),a.add('instructions'),
    a.change('agent','name','A1 independent synthetic agent'),a.change('instructions','text',initial),
    a.change('model','model',a.modelId),a.wire('instructions','instructions'),a.wire('model','model')]).ok,true);
  await vite.close();
  await start('coding',key,true);
  const {revision:r1} = await post('save',{graph:author.graph});
  const {activation:a1} = await post('activate',{revision:r1});
  const {sessions:[old]} = await post('sessions',{activation:a1.version});
  const evidence = {beforeEdit:await turn(old,r1,initial,4096)};

  assert.equal(author.apply([a.change('instructions','text',edited),
    a.add(a.tokenSourceId),a.change(a.tokenSourceId,'tokens',2048),a.wire(a.tokenSourceId,'tokens')]).ok,true);
  const {revision:r2} = await post('save',{graph:author.graph,expected:r1});
  const {activation:a2} = await post('activate',{revision:r2});
  assert.notEqual(a1.version,a2.version);
  const {sessions:[latest]} = await post('sessions',{activation:a2.version});
  evidence.afterEdit = await turn(latest,r2,edited,2048);

  await stop();
  await start('coding',key,true);
  const restored = await get();
  assert.equal(restored.activation.version,a2.version);
  assert.deepEqual(restored.sessions.map(session=>[session.id,session.activation]),
    [[latest.id,a2.version],[old.id,a1.version]]);
  evidence.oldAfterRestart = await turn(old,r1,initial,4096);
  evidence.newAfterRestart = await turn(latest,r2,edited,2048);
  evidence.missingCredential = await refusal('missing credential','coding','',old);
  evidence.routeMismatch = await refusal('route mismatch','general',key,old);
  assert.equal((await readLines(attempts)).length,4);
  console.log(JSON.stringify({mode:'deterministic verifier interception',root,...evidence},null,2));
} catch (error) {
  console.error(log);
  throw error;
} finally {
  await stop();
}
