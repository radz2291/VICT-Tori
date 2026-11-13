const states=new Set(['Running','Finished','Interrupted','Uncertain']);

// This follows one immutable Run identity. Transport events never transition
// execution state: a VICT response.completed can precede Studio settlement.
export function acceptRunPacket(previous,packet,identity){
  const {run,stream}=packet??{};
  if(run?.id!==identity.run||run.session!==identity.session||run.activation!==identity.activation||
    !states.has(run.state)||!stream||stream.streamId!==run.streamId||
    (previous&&previous.cursor.streamId!==stream.streamId)||
    !Number.isSafeInteger(stream.newestSeq)||!Number.isSafeInteger(stream.after)||
    stream.after<0||stream.after>stream.newestSeq)
    throw new Error('Run observation returned a mismatched snapshot.');
  const last=previous?.cursor.lastSeq??0;
  if(stream.newestSeq<last||stream.after>last||
    (previous?.run?.state==='Finished'&&run.state!=='Finished')||
    (previous?.run?.state==='Interrupted'&&run.state!=='Interrupted')||
    (previous?.run?.state==='Uncertain'&&run.state!=='Uncertain'&&
      (run.state==='Running'||!run.reconciliation)))
    return previous;
  let next=last, gap=!!(previous?.gap||stream.gap);
  const seen=new Set();
  const events=[...stream.events].sort((a,b)=>a.seq-b.seq).filter(event=>{
    if(event.streamId!==stream.streamId||!Number.isSafeInteger(event.seq)||event.seq>stream.newestSeq||
      event.seq<=last||seen.has(event.seq))return false;
    seen.add(event.seq);
    return true;
  });
  for(const event of events){
    if(event.seq!==next+1)gap=true;
    next=event.seq;
  }
  if(next<stream.newestSeq)gap=true;
  return {run,cursor:{streamId:stream.streamId,lastSeq:stream.newestSeq},gap};
}
