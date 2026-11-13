import { MAX_RETENTION_AGE_MS } from '@victframework/mastra';
export const maxRetentionAgeMs = MAX_RETENTION_AGE_MS;
const settings = {
  messagesMaxAgeMs: ['TORI_MASTRA_MESSAGES_MAX_AGE_MS', 2592000000],
  threadsMaxAgeMs: ['TORI_MASTRA_THREADS_MAX_AGE_MS', 2592000000],
  spansMaxAgeMs: ['TORI_MASTRA_SPANS_MAX_AGE_MS', 86400000],
};

export function mastraRetention(env = process.env) {
  return Object.freeze(Object.fromEntries(Object.entries(settings).map(([property, [name, fallback]]) => {
    const raw = env[name];
    if (raw === undefined) return [property, fallback];
    const value = Number(raw);
    if (!/^[0-9]+$/.test(raw) || !Number.isSafeInteger(value) || value < 1 || value > maxRetentionAgeMs)
      throw Error(name + ' must be a positive whole number of milliseconds up to ' + maxRetentionAgeMs + '.');
    return [property, value];
  })));
}
