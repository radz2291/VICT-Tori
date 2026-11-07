import assert from 'node:assert/strict';
import { appendFileSync } from 'node:fs';

globalThis.fetch = async (url, init) => {
  const endpoint = String(url);
  appendFileSync(process.env.TORI_VERIFIER_ATTEMPTS, JSON.stringify({endpoint})+'\n');
  assert.equal(process.env.TORI_VERIFIER_ALLOW, '1', 'Unexpected provider attempt in refusal case');
  assert.equal(endpoint, 'https://api.z.ai/api/coding/paas/v4/chat/completions');
  const body = JSON.parse(init.body);
  assert.equal(body.model, 'glm-5.3-flash');
  assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer synthetic-verifier-only');
  const system = body.messages.filter(message=>message.role==='system').map(message=>message.content);
  appendFileSync(process.env.TORI_VERIFIER_CAPTURE, JSON.stringify({endpoint,model:body.model,system,maxOutputTokens:body.max_tokens})+'\n');
  const chunks = [
    {choices:[{index:0,delta:{role:'assistant',content:'Deterministic verifier response.'},finish_reason:null}]},
    {choices:[{index:0,delta:{},finish_reason:'stop'}]},
    {choices:[],usage:{prompt_tokens:5,completion_tokens:9,total_tokens:14}},
  ];
  return new Response(chunks.map(chunk=>'data: '+JSON.stringify({
    id:'independent-verifier-fixture',object:'chat.completion.chunk',created:1,model:body.model,...chunk
  })).join('\n\n')+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
};
