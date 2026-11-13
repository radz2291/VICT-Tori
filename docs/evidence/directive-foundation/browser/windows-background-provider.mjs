import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { sanitizeCapabilityToolName } from '@victframework/mastra';
import { memoryProvider, syntheticKey } from '../../../../tests/memory-provider-fixture.mjs';

assert.equal(process.env.TORI_ZAI_API_KEY, syntheticKey);
assert.equal(process.env.TORI_ENABLE_PI_ZAI, '0');
const originalFetch = globalThis.fetch;
const endpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const delegationStart = 'Delegate habits research to the saved Research specialist now.';
const stopStart = 'Delegate the habits check to Research,';
const restartStart = 'Delegate a habits review to Research,';
let sequence = 0;

function response(model, delta, finish = 'stop') {
  const id = 'tori-008-background-' + ++sequence;
  const chunk = (payload, finish_reason) => 'data: ' + JSON.stringify({
    id, object: 'chat.completion.chunk', created: 1, model,
    choices: [{ index: 0, delta: payload, finish_reason }],
  }) + '\n\n';
  return new Response(chunk({ role: 'assistant', ...delta }, null) + chunk({}, finish) + 'data: [DONE]\n\n', {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function toolResponse(model, name, args) {
  return response(model, { tool_calls: [{ index: 0, id: 'fixture-' + sequence,
    type: 'function', function: { name, arguments: JSON.stringify(args) } }] }, 'tool_calls');
}

globalThis.fetch = async (url, init) => {
  if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, init);
  assert.equal(String(url), endpoint, 'Fixture must not contact an external service.');
  init.signal?.throwIfAborted();
  const body = JSON.parse(init.body);
  assert.equal(body.model, 'glm-5.3-flash');
  const last = body.messages.findLastIndex(message => message.role === 'user');
  const prompt = body.messages[last].content;
  const afterUser = body.messages.slice(last + 1);
  const names = (body.tools ?? []).map(tool => tool.function.name);

  if (prompt.startsWith(stopStart) || prompt.startsWith(restartStart)) {
    await delay(60000, undefined, { signal: init.signal });
    throw Error('The fixture expected an explicit Stop or host restart.');
  }

  const researchTool = names.find(name => name === sanitizeCapabilityToolName('tori.script.research-topics'));
  if (researchTool) {
    if (!afterUser.some(message => message.role === 'tool')) {
      return toolResponse(body.model, researchTool, { key: 'habits' });
    }
    assert.ok(afterUser.some(message => String(message.content).includes('TOPIC-104')));
    return response(body.model, { content: 'TOPIC-104 recommends pairing a small habit with an existing routine.' });
  }

  if (prompt.startsWith(delegationStart)) {
    if (!afterUser.some(message => message.role === 'tool')) {
      // Keep the genuine Run pending while the browser drops both acknowledgements and reattaches.
      await delay(10000, undefined, { signal: init.signal });
      const delegate = names.find(name => name.includes('delegate'));
      assert.ok(delegate, 'The pinned Research delegation tool is required.');
      return toolResponse(body.model, delegate, { task: 'Use the approved tool to look up the habits topic.' });
    }
    return response(body.model, { content: 'TOPIC-104 recommends pairing a small habit with an existing routine and recording the cue.' });
  }

  return memoryProvider(url, init);
};
