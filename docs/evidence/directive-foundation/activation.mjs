import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentProfileRegistry, validateAgentActivationRecord } from '@victframework/runtime';
import { MASTRA_ADAPTER_COMPATIBILITY } from '@victframework/mastra';

const instructions = { id: 'probe-instructions', revision: '1' };
const config = { lastMessages: 10, workingMemory: { enabled: false }, semanticRecall: false };
const policy = recognition => ({
  schema: 'tori.directive-policy.probe@1',
  recognition, location: 'operator-turn', event: 'turn-start-recall', operation: 'save-preference',
  scope: 'trusted-actor-project-agent',
});
const r1 = policy('Recognize explicit requests to retain a standing preference.');
const r2 = policy('Recognize explicit requests to retain a reusable project fact.');
const history = { id: 'probe-directive-memory-policy', revision: 'recent-10@1' };
const policyRef = value => ({
  id: history.id, revision: history.revision + '+directive-' +
    createHash('sha256').update(JSON.stringify(value)).digest('hex'),
});

function build({ install, register, substitute } = {}) {
  const registry = new AgentProfileRegistry();
  registry.installArtifacts([{ kind: 'instructions', ...instructions, text: 'Answer clearly.' },
    { kind: 'memory-policy', ...history, config }]);
  for (const value of install ?? [r1, r2]) {
    registry.installArtifacts([{ kind: 'memory-policy', ...policyRef(value), config }]);
  }
  for (const [revision, memoryPolicy] of register ?? [['1', policyRef(r1)], ['2', policyRef(r2)], ['3', history]]) {
    registry.registerProfile({
      schema: 'vict.agent-profile@1', id: 'probe-agent', revision, instructions,
      memoryPolicy: substitute ?? memoryPolicy,
      modelProfile: { id: 'probe-model', revision: '1', routerModel: 'offline-fixture/deterministic-1', provider: 'offline-fixture' },
      generation: { maxRetries: 0 }, turnPolicy: { maxSteps: 1, maxToolCalls: 0, onLimit: 'fail-closed' },
      adapter: MASTRA_ADAPTER_COMPATIBILITY,
    });
  }
  return registry;
}

function record(activation, revision) {
  return { recordSchema: 'vict.agent-activation-record@1', activationVersion: activation.activationVersion,
    agentProfileVersion: activation.agentProfileVersion, agentId: 'probe-agent', agentRevision: revision,
    canonicalManifest: activation.canonicalManifestJson, artifacts: activation.artifactList, createdAt: activation.createdAt };
}

// This sidecar resolver is probe code. The server selects a saved activation
// and its artifact reference. An incoming canvas draft is never consulted.
function resolvePinned(registry, stored, resources) {
  if (!validateAgentActivationRecord(stored).ok) return { outcome: 'invalid-record' };
  const restored = registry.restoreActivation(stored);
  if (!restored.ok) return { outcome: restored.code };
  const pin = restored.activation.memoryPolicy.reference;
  if (pin.revision === history.revision) return { outcome: 'unavailable' };
  const value = resources[pin.revision];
  if (!value || policyRef(value).revision !== pin.revision) return { outcome: 'missing-or-mismatched-policy' };
  return { outcome: 'available', recognition: value.recognition, revision: pin.revision };
}

const registry = build();
let nativeArtifactCode, extendedConfigCode, extendedProfileCode;
try { registry.installArtifacts([{ kind: 'directive-policy', ...policyRef(r1), policy: r1 }]); }
catch (error) { nativeArtifactCode = error.code; }
assert.equal(nativeArtifactCode, 'VICT_AGENT_INVALID_ARTIFACT');
try { registry.installArtifacts([{ kind: 'memory-policy', ...policyRef(r1), config: { ...config, directive: r1 } }]); }
catch (error) { extendedConfigCode = error.code; }
assert.equal(extendedConfigCode, 'VICT_AGENT_UNKNOWN_ARTIFACT_FIELD');
try {
  const profile = registry.activateAgentProfile({ id: 'probe-agent', revision: '1' }).profile.profile;
  registry.registerProfile({ ...profile, revision: 'probe-invalid', directivePolicy: policyRef(r1) });
} catch (error) { extendedProfileCode = error.code; }
assert.ok(extendedProfileCode, 'An unknown Agent Profile field must be refused.');

const first = registry.activateAgentProfile({ id: 'probe-agent', revision: '1' });
const second = registry.activateAgentProfile({ id: 'probe-agent', revision: '2' });
const off = registry.activateAgentProfile({ id: 'probe-agent', revision: '3' });
assert.equal(new Set([first, second, off].map(item => item.activationVersion)).size, 3);
assert.deepEqual(first.capabilities, []);
assert.deepEqual(second.capabilities, []);

const dir = await mkdtemp(join(tmpdir(), 'tori-directive-activation-'));
try {
  const path = join(dir, 'snapshot.json');
  await writeFile(path, JSON.stringify({
    activations: [record(first, '1'), record(second, '2'), record(off, '3')],
    resources: { [policyRef(r1).revision]: r1, [policyRef(r2).revision]: r2 },
  }));
  const saved = JSON.parse(await readFile(path, 'utf8'));
  const reopened = build();
  const [old, edited, unwired] = saved.activations;
  assert.equal(resolvePinned(reopened, old, saved.resources).recognition, r1.recognition);
  assert.equal(resolvePinned(reopened, edited, saved.resources).recognition, r2.recognition);
  assert.equal(resolvePinned(reopened, unwired, saved.resources).outcome, 'unavailable');
  assert.equal(resolvePinned(reopened, old, {}).outcome, 'missing-or-mismatched-policy');
  assert.equal(resolvePinned(reopened, old, { [policyRef(r1).revision]: r2 }).outcome, 'missing-or-mismatched-policy');
  assert.equal(resolvePinned(build({ install: [r2] }), old, saved.resources).outcome,
    'AGENT_ACTIVATION_ARTIFACT_REVISION_MISMATCH');
  assert.equal(resolvePinned(build({ substitute: policyRef(r2) }), old, saved.resources).outcome,
    'AGENT_ACTIVATION_PROFILE_MISMATCH');
  const sessions = new Map([['bound-session', old], ['unwired-session', unwired]]);
  const runtimePolicy = (request, ownedSessions) => {
    const pinned = ownedSessions.get(request.session);
    if (!pinned) return { outcome: 'unavailable' };
    return resolvePinned(reopened, pinned, saved.resources);
  };
  const clientDraft = { activation: edited.activationVersion, canvas: { directivePolicy: r2 } };
  assert.equal(runtimePolicy({ session: 'bound-session', ...clientDraft }, sessions).recognition, r1.recognition);
  assert.equal(runtimePolicy({ session: 'unwired-session', ...clientDraft }, sessions).outcome, 'unavailable');
  assert.equal(runtimePolicy({ session: 'unowned-session', ...clientDraft }, sessions).outcome, 'unavailable');

  console.log(JSON.stringify({
    nativeArtifactCode, extendedConfigCode, extendedProfileCode,
    exactRevisionRestore: true, unboundUnavailable: true, oldRevisionAfterEdit: true,
    missingOrSubstitutedRevisionDenied: true, mutatedSidecarDenied: true, clientDraftIgnoredByHarness: true,
    registeredToolOrGrantCount: 0, activationIds: [first, second, off].map(item => item.activationVersion),
    proof: 'Installed VICT activation APIs and disposable server-side resolver. No Studio Canvas integration.',
  }, null, 2));
} finally {
  await rm(dir, { recursive: true, force: true });
}
