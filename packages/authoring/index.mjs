import { z } from 'zod';

export const workspaceBinding = 'workspace@1';
export const workspaceOccurrence = 'agent.assembly';

const string = maxLength => ({ type: 'string', minLength: 1, maxLength });
const integer = (minimum, maximum) => ({ type: 'integer', minimum, maximum });
const object = (properties, required = []) => ({
  type: 'object', properties, required, additionalProperties: false,
});
const boolean = { type: 'boolean' };
const revision = integer(0, Number.MAX_SAFE_INTEGER);
const text = max => z.string().trim().min(1).max(max);
const uuid = z.string().uuid();
const patchProperties = {
  name: string(100), instructions: string(12000), model: string(80), context: string(80),
  tool: string(80), childRevision: string(36), maxSteps: integer(1, 4),
};
export const patchInput = z.object({
  name: text(100).optional(), instructions: text(12000).optional(), model: text(80).optional(),
  context: text(80).optional(), tool: text(80).optional(), childRevision: uuid.optional(),
  maxSteps: z.number().int().min(1).max(4).optional(),
}).strict();
const newAgent = patchInput.omit({ childRevision: true }).extend({
  name: text(100), instructions: text(12000),
});
const { childRevision: _childRevision, ...newAgentProperties } = patchProperties;
const newAgentSchema = object(newAgentProperties, ['name', 'instructions']);
const values = z.object({
  name: z.string(), instructions: z.string(), model: z.string(), context: z.string(), tool: z.string(),
  memory: z.string(), child: z.string(), output: z.string(), authoring: z.string(), tokens: z.number(),
  temperature: z.number(), topP: z.number(), maxSteps: z.number(), maxRetries: z.number(),
}).partial();
const revisionId = z.number().int().nonnegative();
const draftReceipt = z.object({
  actorId: z.string(), turnId: z.string(), operationId: z.string(), draftId: uuid, occurrenceId: z.string(),
  expectedRevision: revisionId, editDigest: z.string(), revision: z.union([revisionId, uuid]).optional(),
  status: z.enum(['applied', 'stale', 'cancelled', 'denied', 'invalid']),
}).strict();
const scriptReceipt = z.object({
  id: z.string(), revision: z.string(), grant: z.string(), entry: z.string(), invocationId: z.string(),
  key: z.string(), calls: z.number().int().nonnegative(), started: z.string(), ended: z.string(),
  status: z.enum(['completed', 'failed', 'cancelled', 'timed-out', 'denied']), reason: z.string().optional(),
  result: z.object({ text: z.string() }).strict().optional(),
}).strict();
const runStatus = z.enum(['running', 'completed', 'failed', 'cancelled', 'interrupted']);
const runSummary = z.object({
  id: uuid, name: z.string(), session: uuid, revision: z.string(), activation: z.string(),
  status: runStatus, fixture: z.boolean(), input: z.string().optional(), output: z.string().optional(),
  errorCode: z.string().optional(), scripts: z.array(scriptReceipt),
  context: z.object({
    status: z.enum(['omitted', 'admitted']), source: z.string().optional(), trigger: z.string().optional(),
    reason: z.string().optional(), budgetBytes: z.number().optional(), reads: z.number().optional(), bytes: z.number().optional(),
  }).strict().optional(),
}).strict();
const runEvidence = runSummary.extend({ children: z.array(runSummary.extend({ children: z.tuple([]) })) });
const refusal = z.object({
  status: z.enum(['cancelled', 'denied', 'invalid', 'unconfirmed', 'operation-conflict']),
  message: z.string().optional(), runId: uuid.optional(),
}).strict();
const entries = [
  {
    key: 'inspect', effect: 'read',
    description: 'Discover the current open draft, authorized actions, registered resources, saved definitions and recent Runs. To review evidence, give the exact Run ID or omit it to inspect the latest test in this conversation.',
    schema: object({ runId: string(36), definitionId: string(80) }),
    input: z.object({ runId: uuid.optional(), definitionId: text(80).optional() }).strict(),
    output: z.object({
      status: z.enum(['observed', 'not-found']), scope: z.string(), availableActions: z.array(z.string()), model: z.string(),
      definitions: z.array(z.object({ id: z.string(), name: z.string(), savedRevision: uuid, number: revisionId }).strict()),
      contextSources: z.array(z.object({ value: z.string(), label: z.string() }).strict()),
      tools: z.array(z.object({
        id: z.string(), reference: z.string(), revision: z.string(), grant: z.string(),
        label: z.string(), description: z.string(), keys: z.array(z.string()),
      }).strict()),
      openDraft: values.extend({
        draftId: uuid, occurrenceId: z.string(), revision: revisionId, definitionId: z.string(),
        savedRevision: uuid.nullable(), readiness: z.string().optional(),
      }).strict().optional(),
      definition: values.extend({ id: z.string(), savedRevision: uuid }).strict().optional(),
      run: runEvidence.optional(),
    }).strict(),
  },
  {
    key: 'assemble', effect: 'write',
    description: 'Create a new primary agent and optionally one specialist with approved resource references from discovery. The primary agent pins the new specialist revision when saved. Set save only when the operator requested saving or testing. Returns exact definition and saved revision IDs.',
    schema: object({ agent: newAgentSchema, specialist: newAgentSchema, save: boolean }, ['agent', 'save']),
    input: z.object({ agent: newAgent, specialist: newAgent.optional(), save: z.boolean() }).strict(),
    output: z.union([refusal, z.object({
      status: z.enum(['saved', 'created']), message: z.string().optional(),
      definitions: z.array(z.object({
        role: z.enum(['specialist', 'agent']), definitionId: uuid, name: z.string(),
        savedRevision: uuid.nullable(), number: revisionId.nullable(), readiness: z.string(), receipt: draftReceipt,
      }).strict()),
    }).strict()]),
  },
  {
    key: 'edit', effect: 'write',
    description: 'Edit the current open draft. Studio binds its exact identity and revision. Omit draftId and expectedRevision unless the user supplied an exact reference to verify. Set save when requested or needed for a requested test. Use an empty patch with save true to save without editing.',
    schema: object({ draftId: string(36), expectedRevision: revision, patch: object(patchProperties), save: boolean },
      ['patch']),
    input: z.object({
      draftId: uuid.optional(), expectedRevision: z.number().int().nonnegative().safe().optional(),
      patch: patchInput, save: z.boolean().optional(),
    }).strict().refine(value => value.save || Object.keys(value.patch).length > 0),
    output: z.union([refusal, z.object({
      status: draftReceipt.shape.status, definitionId: z.string().optional(), receipt: draftReceipt,
      savedRevision: uuid.optional(), number: revisionId.optional(), readiness: z.string().optional(),
      saveStatus: z.enum(['saved', 'cancelled', 'stale', 'invalid']).optional(),
    }).strict()]),
  },
  {
    key: 'test', effect: 'write',
    description: 'Activate and test the exact saved revision of an agent with a user-authorized synthetic input. Returns the actual Run, activation, status, child and tool results. Run one test per authoring turn.',
    schema: object({ definitionId: string(80), savedRevision: string(36), input: string(2000), includeContext: boolean },
      ['definitionId', 'savedRevision', 'input']),
    input: z.object({
      definitionId: text(80), savedRevision: uuid, input: text(2000), includeContext: z.boolean().optional(),
    }).strict(),
    output: z.union([refusal, z.object({ status: runStatus, run: runEvidence }).strict()]),
  },
];

const reference = key => ({ id: 'tori.workspace.' + key, revision: '1' });
export const workspaceRefs = Object.freeze(entries.map(entry => Object.freeze(reference(entry.key))));
export const workspaceGrant = key => 'tori.workspace.' + key + '.invoke';
export const workspaceReadOnly = workspaceRefs[0];
const contract = (id, schema, validator) => ({
  id, revision: '1', ...(schema ? { descriptiveJsonSchema: schema } : {}),
  parse(value) {
    const parsed = validator.safeParse(value);
    return parsed.success ? { ok: true, value: parsed.data } : {
      ok: false, issues: [{ code: 'INVALID', path: '$', message: 'Invalid workspace action data.' }],
    };
  },
});

// The consumer supplies authorized ports and the governing turn. This catalog
// owns tool identity, contracts, effect declarations, and required grants.
export function createWorkspaceCapabilities(ports) {
  return entries.map(({ key, effect, description, schema, input, output }) => ({
    ...reference(key), effect, description, permissions: [workspaceGrant(key)],
    input: contract('tori.workspace.' + key + '.input', schema, input),
    output: contract('tori.workspace.' + key + '.result', undefined, output),
    invoke: (args, context) => ports[key](args, context),
  }));
}
