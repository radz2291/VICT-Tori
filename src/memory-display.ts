type Proposal={run:string;status:string;source:{session:string;message:string};contextBasis:string[];text?:string;operation?:string};
export type MemoryTurn={
  run:string;source:string;proposal?:Proposal;request?:{reason:string};
  saved?:{receipt:{memoryId:string;revision:number};memory:{status:string;memory?:{content:string}}};
};
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
  'temporary-request':'The current message limits this information to the conversation.',
  'recall-question':'A recall question does not ask to save anything.',
  'hypothetical':'A hypothetical question does not ask to save anything.',
  'quoted':'A quote does not authorize a save.',
  'mentioned-phrase':'Mentioning a phrase does not authorize a save.',
  'untrusted-origin':'A save request must come from the current operator message.',
  'memory-or-reminder':'Save as a memory, or set a reminder?',
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
