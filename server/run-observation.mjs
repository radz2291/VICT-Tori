import { validateAgentStreamEvent } from '@victframework/contracts';

export const runStates = Object.freeze({
  completed:'Finished', running:'Running', failed:'Interrupted', cancelled:'Interrupted',
  interrupted:'Interrupted', blocked:'Interrupted', uncertain:'Uncertain',
});
export const runState = run => runStates[run.status]??'Uncertain';
export const isRunKey = value => typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);

// The public VICT hub supplies sequence numbers and gap detection. TORI owns
// the Run/activation binding; a cursor alone never grants access to a stream.
export function matchesRunEvent(event,run){
  const scope=run.observation;
  return !!scope&&validateAgentStreamEvent(event).ok&&event.streamId===scope.stream&&
    event.turnId===run.id&&event.threadId===scope.thread&&event.actorId===scope.actor&&
    event.agentProfileVersion===scope.profile&&
    (event.victRunId===undefined||event.victRunId===run.id)&&
    (event.activationVersion===undefined||event.activationVersion===run.activation);
}
export async function replayRun(hub,run,cursor){
  const streamId=run.observation.stream;
  if(cursor!==undefined&&(cursor?.streamId!==streamId||!Number.isSafeInteger(cursor.lastSeq)||cursor.lastSeq<0))
    throw Object.assign(new Error('This cursor does not belong to the selected Run.'),{status:409});
  const requested={streamId,lastSeq:cursor?.lastSeq??0};
  if(requested.lastSeq>await hub.latestSeq(streamId))
    throw Object.assign(new Error('This cursor is ahead of the Run stream.'),{status:409});
  const replay=await hub.replay(requested);
  const events=replay.events.filter(event=>matchesRunEvent(event,run));
  // Studio's snapshot contains accepted content. Transport only carries the
  // event identities and kinds here; missing deltas never yield invented text.
  return {streamId,after:requested.lastSeq,newestSeq:replay.newestSeq,
    gap:replay.olderThanBuffer||events.length!==replay.events.length,
    events:events.map(({seq,kind})=>({streamId,seq,kind}))};
}
