import assert from 'node:assert/strict';
import { createServer } from 'vite';

const url = process.argv[2];
assert.match(url, /^http:\/\/127\.0\.0\.1:\d+$/);
const read = async (path = '', body) => {
  const response = await fetch(url + '/api/studio' + path, body === undefined ? {} : {
    method: 'POST', headers: { Origin: url, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, 200, data.message);
  return data;
};
const initial = await read();
assert.ok(initial.provider, 'The supported Coding connection is unavailable.');
assert.equal(initial.activeAgents.length, 0, 'Seed only a fresh disposable Studio.');
const vite = await createServer({server:{middlewareMode:true,watch:null,ws:false}});
try {
  const assembly = await vite.ssrLoadModule('/src/assembly.ts');
  const draft = assembly.history(assembly.emptyAssembly());
  assert.ok(draft.apply(assembly.assemblyPatchOperations(draft.graph,{
    name:'Quellight',
    instructions:'You are Quellight, a concise project assistant. Orchid’s design is approved, implementation is in progress, and the demo is Friday. When asked for an Orchid update, use the applicable saved format or answer in one short sentence. Acknowledge requests about preferred format naturally without announcing that anything was saved.',
    model:assembly.modelId,
  })).ok);
  assert.ok(draft.apply(assembly.configureOperations(draft.graph,'memory','savedMemory',assembly.governedMemoryValue)).ok);
  assert.ok(draft.apply(assembly.configureOperations(draft.graph,'directive','','',false)).ok);
  const disconnected = (await read('/save',{expected:initial.revision,graph:draft.graph})).revision;
  assert.ok(draft.apply([assembly.wire('directive','directive')]).ok);
  const connected = (await read('/save',{expected:disconnected,graph:draft.graph})).revision;
  const { activation } = await read('/activate',{revision:connected});
  assert.equal(activation.directive.status,'bound');
  const { openedSession } = await read('/sessions',{activation:activation.version});
  console.log(JSON.stringify({activation:activation.version,policy:activation.directive.revision,session:openedSession,
    firstRevision:disconnected.number,directiveRevision:connected.number,fixture:initial.fixture}));
} finally {
  await vite.close();
}
