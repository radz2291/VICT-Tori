export const directiveId = 'directive';
export const directiveLabel = 'Directive';
export const directiveDefaults = Object.freeze({
  name: 'Standing Directive',
  recognition: 'Recognize an affirmative request in the current operator message to retain a specific fact or preference for future conversations. Use authorized earlier exchanges only to resolve that request.',
  tuning: 'off',
  sensitivity: 'standard',
  historyBytes: 8192,
  deadlineMs: 22000,
  outputTokens: 1536,
});
export const directiveBounds = Object.freeze({
  historyBytes: Object.freeze({ min: 1024, max: 65536 }),
  deadlineMs: Object.freeze({ min: 5000, max: 120000 }),
  outputTokens: Object.freeze({ min: 1024, max: 32768 }),
});
export const directiveTuning = [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }];
export const directiveSensitivity = [{ value: 'standard', label: 'Standard' }, { value: 'cautious', label: 'Cautious' }];
export const directiveRules = Object.freeze({
  schema: 'tori.directive-policy@1',
  binding: directiveId,
  primitive: 'Keep',
  action: 'save-preference-or-fact',
  origin: 'operator',
  location: 'direct-turn',
  applicability: 'turn-start-memory-admission',
  review: 'Float',
  scope: 'trusted-actor-project-agent',
  reasoningEffort: 'low',
});

const encoder = new TextEncoder();
const bytes = value => encoder.encode(value).byteLength;
const nameLimit = 120;
const recognitionLimit = 12000;
export function directiveFields(values, proposalLifetimeMs) {
  const issues = {};
  if (typeof values.name !== 'string' || !values.name.trim() || !values.name.isWellFormed() || bytes(values.name) > nameLimit)
    issues.name = 'Enter a name of up to ' + nameLimit + ' UTF-8 bytes.';
  if (typeof values.recognition !== 'string' || !values.recognition.trim() || !values.recognition.isWellFormed() || bytes(values.recognition) > recognitionLimit)
    issues.recognition = 'Enter recognition context of up to ' + recognitionLimit + ' UTF-8 bytes.';
  if (!directiveTuning.some(item => item.value === values.tuning)) issues.tuning = 'Choose a supported tuning setting.';
  if (!directiveSensitivity.some(item => item.value === values.sensitivity)) issues.sensitivity = 'Choose a supported sensitivity.';
  for (const [field, { min, max }] of Object.entries(directiveBounds)) {
    if (!Number.isSafeInteger(values[field]) || values[field] < min || values[field] > max) {
      issues[field] = field === 'deadlineMs' ? `Enter a deadline from ${min / 1000} to ${max / 1000} seconds in whole milliseconds.` :
        'Enter a whole value from ' + min.toLocaleString('en-US') + ' to ' + max.toLocaleString('en-US') + '.';
    }
  }
  if (values.deadlineMs >= proposalLifetimeMs) issues.deadlineMs = 'The deadline must be shorter than the proposal lifetime.';
  return issues;
}

export function directiveInput(messages, current, historyBytes) {
  const history = [];
  let used = 2;
  for (let index = messages.length - 1; index >= 0; index--) {
    const source = messages[index];
    if ((source.role !== 'user' && source.role !== 'assistant') || source.id === current.id) continue;
    const item = { id: source.id, role: source.role === 'user' ? 'operator' : 'assistant', text: source.text };
    used += bytes(JSON.stringify(item)) + Number(history.length > 0);
    if (used > historyBytes) return { history: history.reverse(), current, truncated: true };
    history.push(item);
  }
  return { history: history.reverse(), current, truncated: false };
}
