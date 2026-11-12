export const memoryReasons:Record<string,string>={
  'policy-off':'Saved memory is off for this activation.',
  'no-eligible-memories':'No saved memories in this scope.',
  'budget':'Some eligible memories exceeded the Run’s memory budget.',
  'storage-unavailable':'Storage unavailable / memory missing.',
  'drafting-only':'This turn drafted a memory from the current Session.',
  'not-dispatched':'No model request received saved memory.',
  'access-denied':'Saved memory access was denied.',
  'negated-request':'The current message did not authorize a save.',
  'not-an-explicit-request':'Only an explicit request in the current message can start a save.',
  'context-unavailable':'The necessary Session context was unavailable. Describe what you want to remember.',
  'structured-output':'The pinned output contract does not support a memory draft.',
  'clarification-needed':'Describe exactly what you want to remember.',
  'cancelled':'The turn was stopped before confirmation.',
  'draft-failed':'A draft could not be prepared.',
  'unconfirmed':'No memory was confirmed.',
  'expired':'This proposal expired. Send a new request to remember it.',
  'dismissed':'This proposal was dismissed.',
};
export function memoryAge(ms:number) {
  if(ms<60_000)return 'less than a minute';
  if(ms<3_600_000)return Math.floor(ms/60_000)+' min';
  if(ms<86_400_000)return Math.floor(ms/3_600_000)+' hr';
  return Math.floor(ms/86_400_000)+' days';
}
export const memoryDate=(value?:string|null)=>value?new Date(value).toLocaleString():'Never';
