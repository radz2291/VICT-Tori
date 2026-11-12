import { governedPolicy } from './intent.mjs';

// Reserved by TORI. Bind the posture to the immutable public VICT reference
// without extending VICT's closed memory-policy config or changing old pins.
export const organizerOff='off';
const id='tori-conversation-memory';
const historyRevisions=['recent-10@1','recent-100@1'];
const governedRevisions=historyRevisions.map(revision=>revision+'+'+governedPolicy);

export const memoryArtifact=(history,governed)=>({
  id,revision:governed===governedPolicy?(history??'recent-100@1')+'+'+governedPolicy:(history??'1'),
});
export function effectiveMemoryPolicy(artifact){
  if(artifact?.id!==id)return undefined;
  const {revision}=artifact;
  const governed=governedRevisions.includes(revision);
  if(!governed&&revision!=='1'&&!historyRevisions.includes(revision))return undefined;
  return {schema:'tori.memory-policy@1',artifact:{id,revision},savedMemory:governed?governedPolicy:'off',organizer:organizerOff};
}
