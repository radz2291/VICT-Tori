import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

process.env.TORI_EXECUTION_FIXTURE = 'a1-request-capture';

const agent = (name, instructions, extra = {}) => ({ name, instructions, model: 'glm-5.3-flash', ...extra });

async function fixtureFetch(url, init) {
  assert.equal(String(url), 'https://api.z.ai/api/coding/paas/v4/chat/completions');
  init.signal?.throwIfAborted();
  const body = JSON.parse(init.body);
  const lastUser = body.messages.findLastIndex(message => message.role === 'user');
  const prompt = body.messages[lastUser].content;
  const results = body.messages.slice(lastUser + 1).filter(message => message.role === 'tool').map(message => {
    const value = JSON.parse(message.content);
    return value.result ?? value.output ?? value.data ?? value;
  });
  const toolNames = (body.tools ?? []).map(tool => tool.function.name);
  let delta;
  const call = (suffix, args) => {
    const name = toolNames.find(tool => tool.endsWith(suffix));
    assert.ok(name, 'The pinned catalog should contain ' + suffix);
    delta = { role: 'assistant', tool_calls: [{
      index: 0, id: 'fixture-' + randomUUID(), type: 'function',
      function: { name, arguments: JSON.stringify(args) },
    }] };
  };
  const say = content => { delta = { role: 'assistant', content }; };
  const step = results.length;

  if (toolNames.some(name => name.endsWith('workspace_inspect'))) {
    if (prompt.includes('review that Run')) {
      assert.equal(toolNames.length, 1, 'Review exposes only inspection to the provider.');
      if (!step) call('workspace_inspect', {});
      else {
        assert.ok(results[0].run, JSON.stringify({ keys: Object.keys(results[0]), step, toolNames }));
        say('Run ' + results[0].run.id + ' used the Research result. Add a source label to the specialist instructions.');
      }
    } else if (!step) {
      call('workspace_inspect', {});
    } else if (prompt.includes('build and save')) {
      if (step === 1) {
        const { tools, contextSources } = results[0];
        call('workspace_assemble', {
          agent: agent('Quellight', 'Delegate to your pinned specialist and include its project knowledge.'),
          specialist: agent('Research', 'Read the requested reference key and cite the returned reference.', {
            context: contextSources.find(item => item.value === 'studio-research@1').value,
            tool: tools.find(item => item.label.startsWith('Research Topics')).reference,
          }),
          save: true,
        });
      } else if (step === 2) {
        const built = results[1].definitions.find(item => item.role === 'agent');
        call('workspace_test', {
          definitionId: built.definitionId, savedRevision: built.savedRevision,
          input: 'Delegate a habits research request to your specialist and report the result.',
        });
      } else {
        say('I saved the composition and tested it in Run ' + results[2].run.id + '.');
      }
    } else if (prompt.includes('draft a new weekly reviewer')) {
      if (step === 1) call('workspace_assemble', {
        agent: { name: 'Weekly Reviewer', instructions: 'Summarize synthetic weekly commitments.' }, save: false,
      });
      else say('The weekly reviewer is an unsaved draft.');
    } else if (prompt.includes('denied script read')) {
      if (step === 1) {
        const saved = results[0].openDraft;
        call('workspace_test', {
          definitionId: saved.definitionId, savedRevision: saved.savedRevision, input: 'Try the denied script key private-logs.',
        });
      } else say('The registered script refused the requested key.');
    } else {
      const open = results[0].openDraft;
      if (step === 1) {
        const tool = results[0].tools.find(item => item.label.startsWith('Reading List'));
        call('workspace_edit', {
          draftId: prompt.includes('outside this draft') ? '00000000-0000-4000-8000-000000000001' : open.draftId,
          expectedRevision: open.revision,
          patch: prompt.includes('Reading List') ? { tool: tool.reference } :
            prompt.includes('save this draft') ? {} : { instructions: open.instructions + ' Include a source label in every finding.' },
          save: prompt.includes('Reading List') || prompt.includes('save this draft'),
        });
      } else if (step === 2 && prompt.includes('Reading List') && results[1].savedRevision) {
        call('workspace_test', {
          definitionId: open.definitionId, savedRevision: results[1].savedRevision, input: 'Use the Reading List to read the planning key.',
        });
      } else say('Studio recorded the outcome: ' + results.at(-1).status + '.');
    }
  } else if (toolNames.some(name => name.includes('delegate'))) {
    if (!step) call(toolNames.find(name => name.includes('delegate')), { task: 'Read the habits reference using the approved tool.', includeContext: true });
    else say('The specialist returned: ' + results[0].text);
  } else if (toolNames.some(name => name.includes('script'))) {
    if (!step) call(toolNames.find(name => name.includes('script')),
      { key: prompt.includes('private-logs') ? 'private-logs' : prompt.includes('planning') ? 'planning' : 'habits' });
    else say(results[0].text ?? 'The requested read failed.');
  } else {
    say('The fixture model received the requested input.');
  }

  const chunks = [
    { choices: [{ index: 0, delta, finish_reason: null }] },
    { choices: [{ index: 0, delta: {}, finish_reason: delta.tool_calls ? 'tool_calls' : 'stop' }] },
    { choices: [], usage: { prompt_tokens: 12, completion_tokens: 17, total_tokens: 29 } },
  ];
  return new Response(chunks.map(chunk => 'data: ' + JSON.stringify({
    id: 'authoring-foundation-fixture', object: 'chat.completion.chunk', created: 1, model: body.model, ...chunk,
  })).join('\n\n') + '\n\ndata: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
}

globalThis.fetch = async (url, init) => {
  try {
    return await fixtureFetch(url, init);
  } catch (error) {
    if (!init.signal?.aborted) console.error('Synthetic provider fixture:', error.message);
    throw error;
  }
};
