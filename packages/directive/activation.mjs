import { createHash } from 'node:crypto';
import { directiveDefaults, directiveFields, directiveRules } from './policy.mjs';

export function directivePolicy(values, model, route, proposalLifetimeMs) {
  if (!values) return null;
  if (Object.keys(directiveFields(values, proposalLifetimeMs)).length || route !== 'coding' || typeof model !== 'string')
    throw new Error('The Directive policy is not ready.');
  const fields = Object.fromEntries(Object.keys(directiveDefaults).map(name => [name, values[name]]));
  return { ...directiveRules, ...fields, model, route };
}

export const directiveRevision = policy => policy === null ? 'off' :
  createHash('sha256').update(JSON.stringify(policy)).digest('hex');

const referenceMarker = '+directive@1-';
const referencePattern = /\+directive@1-(off|[0-9a-f]{64})$/;
export const withDirectiveReference = (ref, revision) => ({ ...ref, revision: ref.revision + referenceMarker + revision });
export const directiveReference = ref => referencePattern.exec(ref?.revision ?? '')?.[1];
export const baseMemoryReference = ref => ref && ({ ...ref, revision: ref.revision?.replace(referencePattern, '') });

export function resolveDirective(pin, memoryReference, model, route, proposalLifetimeMs) {
  const revision = directiveReference(memoryReference);
  if (!revision) {
    const hasMarker = memoryReference?.revision?.includes(referenceMarker);
    return { status: !hasMarker && pin?.directive === undefined ? 'legacy' : 'unavailable' };
  }
  if (revision === 'off') return { status: pin?.directive === null ? 'off' : 'unavailable' };
  try {
    const expected = directivePolicy(pin?.directive, model, route, proposalLifetimeMs);
    if (!expected || directiveRevision(expected) !== revision || JSON.stringify(pin.directive) !== JSON.stringify(expected))
      return { status: 'unavailable' };
    return { status: 'bound', revision, policy: expected };
  } catch {
    return { status: 'unavailable' };
  }
}
