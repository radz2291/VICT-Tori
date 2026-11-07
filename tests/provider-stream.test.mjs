import test from 'node:test';
import assert from 'node:assert/strict';
import { publicProviderStream } from '../server/provider-stream.mjs';

test('provider activity exposes phase names without passing reasoning text downstream',async()=>{
  const chunks=[
    'data: {"choices":[{"delta":{"reasoning_con',
    'tent":"private text"}}]}\n\ndata: {"choices":[{"delta":{"content":"Public answer"}}]}\n\n',
    'data: {"choices":[],"usage":{"completion_tokens":42}}\n\ndata: [DONE]\n\n',
  ];
  const encoder=new TextEncoder();
  const response=new Response(new ReadableStream({start(controller){
    for(const chunk of chunks)controller.enqueue(encoder.encode(chunk));
    controller.close();
  }}),{headers:{'Content-Type':'text/event-stream'}});
  const phases=[];
  const result=await publicProviderStream(response,phase=>phases.push(phase)).text();
  assert.deepEqual(phases,['reasoning','answer']);
  assert.doesNotMatch(result,/private text|reasoning_content/);
  assert.match(result,/Public answer/);
  assert.match(result,/"completion_tokens":42/);
  assert.match(result,/\[DONE\]/);
});
