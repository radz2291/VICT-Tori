import { spawn } from 'node:child_process';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registeredTool } from '../src/registered-tools.mjs';

const entries = new Map([
  ['research-topics@1', new URL('./tools/research-topics.mjs', import.meta.url)],
  ['reading-list@1', new URL('./tools/reading-list.mjs', import.meta.url)],
]);
const outputLimit = 2048;
const timeoutMs = 5000;
const resultContract = value => value && typeof value.text === 'string' &&
  value.text.length > 0 && value.text.length <= 512 && Object.keys(value).length === 1;
const objectContract = (id, schema, accepts) => ({
  id, revision: '1', descriptiveJsonSchema: schema,
  parse: value => accepts(value) ? { ok: true, value } : {
    ok: false, issues: [{ code: 'INVALID', path: '$', message: 'Invalid script tool data.' }],
  },
});
const output = objectContract('tori.script.read-result', {
  type: 'object', properties: { text: { type: 'string', maxLength: 512 } },
  required: ['text'], additionalProperties: false,
}, resultContract);

function readScript(entry, key, signal, onSpawn) {
  const fence = AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
  fence.throwIfAborted();
  const script = fileURLToPath(entry);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, key], {
      cwd: dirname(script), env: {}, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
    });
    let size = 0;
    let failure;
    const chunks = [];
    const stop = () => child.kill();
    fence.addEventListener('abort', stop, { once: true });
    if (fence.aborted) stop();
    child.once('spawn', onSpawn);
    child.once('error', error => { failure = error; });
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > outputLimit) {
        failure ??= new Error('TORI_SCRIPT_OUTPUT_LIMIT');
        stop();
      } else {
        chunks.push(chunk);
      }
    });
    child.once('close', code => {
      fence.removeEventListener('abort', stop);
      if (fence.aborted) return reject(fence.reason);
      if (failure || code !== 0) return reject(failure ?? new Error('TORI_SCRIPT_FAILED'));
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!resultContract(value)) throw new Error('TORI_SCRIPT_RESULT_INVALID');
        resolve(value);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function createScriptCapability(reference, record) {
  const tool = registeredTool(reference);
  const entry = entries.get(reference);
  if (!tool || !entry) return undefined;

  function receipt(context, key) {
    return {
      id: tool.id, revision: tool.revision, grant: tool.grant, entry: basename(fileURLToPath(entry)),
      invocationId: context.victInvocationId, key, calls: 0, started: new Date().toISOString(),
    };
  }
  function settle(evidence, status) {
    record({ ...evidence, status, ended: new Date().toISOString() });
  }

  const capability = {
    id: tool.id, revision: tool.revision, effect: 'read', permissions: [tool.grant],
    description: tool.description + ' Permitted keys: ' + tool.keys.join(', ') + '.',
    input: objectContract('tori.script.read-input', {
      type: 'object', properties: { key: { type: 'string', maxLength: 64 } },
      required: ['key'], additionalProperties: false,
    }, value => value && typeof value.key === 'string' && value.key.length <= 64 && Object.keys(value).length === 1),
    output,
    async invoke({ key }, context) {
      const evidence = receipt(context, key);
      if (!tool.keys.includes(key)) {
        settle({ ...evidence, reason: 'key-outside-scope' }, 'denied');
        throw new Error('TORI_SCRIPT_SCOPE_DENIED');
      }
      try {
        const result = await readScript(entry, key, context.signal, () => { evidence.calls++; });
        settle({ ...evidence, result }, 'completed');
        return result;
      } catch (error) {
        settle(evidence, context.signal.aborted ? 'cancelled' : error?.name === 'TimeoutError' ? 'timed-out' : 'failed');
        throw error;
      }
    },
  };
  return {
    capability, grant: tool.grant,
    deny: (args, context, reason) => settle({ ...receipt(context, args.key), reason }, 'denied'),
  };
}
