import assert from 'node:assert/strict';

process.env.TORI_EXECUTION_FIXTURE = 'a1-request-capture';

globalThis.fetch = async (url, init) => {
  assert.equal(String(url), 'https://api.z.ai/api/coding/paas/v4/chat/completions');
  init.signal?.throwIfAborted();
  const body = JSON.parse(init.body);
  const lastUser = body.messages.findLastIndex(item => item.role === 'user');
  const prompt = body.messages[lastUser].content;
  const tools = body.tools.map(tool => tool.function.name);
  const results = body.messages.slice(lastUser + 1).filter(item => item.role === 'tool');
  let delta = { role: 'assistant', content: 'The deterministic authoring turn finished.' };
  let finish = 'stop';
  if (results.length < 2) {
    const name = tools.find(tool => tool.includes(results.length === 0 ? 'discover' : 'instructions'));
    assert.ok(name);
    const args = {};
    if (results.length === 1) {
      const payload = JSON.parse(results[0].content);
      const target = payload.draftId ? payload : payload.result ?? payload.data ?? payload.output;
      assert.ok(target?.draftId, 'Discovery must return the authorized target.');
      Object.assign(args, {
        draftId: prompt.includes('Scope denial') ? 'wrong-draft' : target.draftId,
        occurrenceId: target.occurrenceId,
        expectedRevision: target.revision,
        edit: 'Include a source link for every finding.',
      });
    }
    delta = { role: 'assistant', tool_calls: [{
      index: 0, id: 'authoring-fixture-' + results.length, type: 'function',
      function: { name, arguments: JSON.stringify(args) },
    }] };
    finish = 'tool_calls';
  }
  const chunks = [
    { choices: [{ index: 0, delta, finish_reason: null }] },
    { choices: [{ index: 0, delta: {}, finish_reason: finish }] },
    { choices: [], usage: { prompt_tokens: 5, completion_tokens: 9, total_tokens: 14 } },
  ];
  return new Response(chunks.map(chunk => 'data: ' + JSON.stringify({
    id: 'authoring-fixture', object: 'chat.completion.chunk', created: 1, model: body.model, ...chunk,
  })).join('\n\n') + '\n\ndata: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
};

