import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { memoryProvider, syntheticKey } from './memory-provider-fixture.mjs';

const fetchBeforeFixture = globalThis.fetch;
const providerUrl = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const savePrompt = 'Going forward, give me Orchid updates in three short bullets. Keep that as my preference.';
const heldPrompts = new Set(['Keep this synthetic preference until Stop.', 'Keep the Orchid restart preference.']);
assert.equal(process.env.TORI_ZAI_API_KEY, syntheticKey);
process.env.TORI_EXECUTION_FIXTURE = 'a1-request-capture';

globalThis.fetch = async (url, init) => {
  if (String(url).startsWith('http://127.0.0.1:')) return fetchBeforeFixture(url, init);
  assert.equal(String(url), providerUrl);
  const body=JSON.parse(init.body);
  if (!body.messages[0].content.includes('Authorized recognition focus:')) return memoryProvider(url, init);
  const {current}=JSON.parse(body.messages.at(-1).content);
  if (heldPrompts.has(current.text)) await delay(60000,undefined,{signal:init.signal});
  const proposal=current.text===savePrompt;
  if (proposal) await delay(7000,undefined,{signal:init.signal});
  const result=proposal?{kind:'proposal',draft:'For future Orchid updates, use three short bullets.',basis:[current.id]}:{kind:'none'};
  const part=(delta,finish_reason,usage)=>'data: '+JSON.stringify({
    id:'directive-browser-fixture',object:'chat.completion.chunk',created:1,model:body.model,
    choices:[{index:0,delta,finish_reason}],...(usage?{usage}:{}),
  })+'\n\n';
  return new Response(part({role:'assistant',content:JSON.stringify(result)},null)+
    part({},'stop',{prompt_tokens:30,completion_tokens:28,completion_tokens_details:{reasoning_tokens:8}})+'data: [DONE]\n\n',
    {headers:{'Content-Type':'text/event-stream'}});
};
