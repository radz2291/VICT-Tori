import assert from 'node:assert/strict';
import { appendFileSync } from 'node:fs';

process.env.TORI_EXECUTION_FIXTURE = 'a1-request-capture';
globalThis.fetch = async (url, init) => {
  assert.equal(String(url), 'https://api.z.ai/api/coding/paas/v4/chat/completions');
  const body = JSON.parse(init.body);
  assert.equal(body.model, 'glm-5.3-flash');
  assert.equal(body.stream, true);
  appendFileSync(process.env.TORI_A1_CAPTURE, JSON.stringify({maxOutputTokens:body.max_tokens})+'\n');
  const chunks = [
    {choices:[{index:0,delta:{role:'assistant',content:'Deterministic A1 fixture answer.'},finish_reason:null}]},
    {choices:[{index:0,delta:{},finish_reason:'stop'}]},
    {choices:[],usage:{prompt_tokens:5,completion_tokens:9,total_tokens:14}},
  ];
  return new Response(chunks.map(chunk=>'data: '+JSON.stringify({
    id:'a1-fixture',object:'chat.completion.chunk',created:1,model:body.model,...chunk
  })).join('\n\n')+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
};
