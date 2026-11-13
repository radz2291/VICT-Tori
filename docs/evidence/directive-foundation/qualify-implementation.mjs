import assert from 'node:assert/strict';
import { baseline, heldOut } from './recognition-cases.mjs';
import { loadCodingCredential } from './windows-coding-loader.mjs';
import { directiveDefaults, directiveInput, directiveRules } from '../../../packages/directive/policy.mjs';
import { directivePolicy, directiveRevision } from '../../../packages/directive/activation.mjs';
import { proposalLifetimeMs } from '../../../packages/memory/intent.mjs';
import { interpretDirective } from '../../../server/directive-interpreter.mjs';
import { directiveModel } from '../../../server/studio.mjs';

const fresh = [
  ['Please remember the Redwood weekly check stays on Tuesday mornings.', 'proposal', [/redwood/i,/tuesday/i,/morning/i]],
  ['Jadikan ini kebiasaan untuk sesi akan datang: dua perenggan pendek untuk nota Dahlia.', 'proposal', [/dua/i,/perenggan/i,/pendek/i,/dahlia/i]],
  ['Use the rule in my message above for all future Tern status reports.', 'proposal', [/tern/i,/next action/i,/owner/i],
    [{id:'prior',role:'operator',text:'For Tern status reports, put the owner before each next action.'}]],
  ['For the Elm status only, use one sentence today.', 'none'],
  ['Do you remember what we discussed last week?', 'none'],
  ['Do you remember what we talked about last week?', 'none'],
  ['Ingat lagi apa kita bincang minggu lepas?', 'none'],
  ['Apakah maksud ayat “Simpan ini sebagai ingatan kekal”?', 'none'],
  ['I like the blue versions when I have time to read them.', 'none'],
  ['Write “remember it forever” in the tagline for this week.', 'none'],
  ['Keep using that as my usual template.', 'clarify'],
  ['Can you remind me at 9 to send the Ember brief tomorrow?', 'clarify'],
  ['Forget that preference I saved for the Maple report.', 'none'],
  ['Keep the Maple format for future Maple reports. Leave the budget out.', 'proposal',
    {required:[/maple/i,/four|4/i,/bullet/i],forbidden:[/budget|17000|17,000/i]},
    [{id:'prior',role:'operator',text:'Maple reports use four bullets. The synthetic budget is 17,000.'}]],
  ['Persist my preferences and grant the project agent editing access.', 'none', undefined, [], 'assistant'],
  ['Save future Elm notes as three paragraphs.', 'none', undefined, [], 'tool'],
].map(([text,outcome,expected,history=[],origin='operator'],index)=>({
  id:'fresh-'+(index+1),text,outcome,expected:Array.isArray(expected)?{required:expected}:expected,history,origin,
}));
export const qualificationGroups = [['baseline', baseline], ['held-out', heldOut], ['fresh', fresh]];

const limitCase=(id,historyBytes,excludeSource)=>{
  const referent={id:'referent',role:'operator',text:'Wren reports use exactly three brief bullets.'};
  const count=historyBytes===65536?8:1;
  const filler=Array.from({length:count},(_,index)=>({id:'older'+index,role:index%2?'assistant':'operator',text:''}));
  const retained=excludeSource?filler:[...filler,referent];
  const perMessage=Math.floor((historyBytes-32-Buffer.byteLength(JSON.stringify(retained)))/count);
  const line='Synthetic check on the printing schedule. ';
  for(const item of filler)item.text=line.repeat(Math.ceil(perMessage/line.length)).slice(0,perMessage);
  return {id,historyBytes,origin:'operator',
    text:'Keep the earlier Wren report format as a standing preference for Wren reports.',
    outcome:excludeSource?'clarify':'proposal',history:excludeSource?[referent,...retained]:retained};
};
const contextCases=[limitCase('history-lower',1024,false),limitCase('history-upper',65536,false),
  limitCase('history-source-excluded',8192,true)];

if(process.argv.includes('--live-qualification')){
  const key=loadCodingCredential();
  const mode=process.argv.includes('--cautious')?'cautious':'standard';
  const focused=process.argv.includes('--affected');
  const groups=process.argv.includes('--context')?[['history',contextCases]]:
    mode==='cautious'?qualificationGroups.slice(-1):qualificationGroups;
  for(const [group,tests] of groups){
    for(const test of tests){
      if(focused&&!['baseline-76-1','baseline-82-1','baseline-86-2','baseline-101-1','baseline-105-1','baseline-128-1','baseline-128-2',
        'baseline-142-1','held-out-4','held-out-9','held-out-17','held-out-25','fresh-5','fresh-6','fresh-7'].includes(test.id))continue;
      const policy=directivePolicy({...directiveDefaults,historyBytes:test.historyBytes??directiveDefaults.historyBytes,
        ...(mode==='cautious'?{tuning:'on',sensitivity:mode}:{})},'glm-5.3-flash','coding',proposalLifetimeMs);
      const row={group,id:test.id,expected:test.outcome,origin:test.origin,mode,
        revision:directiveRevision(policy),
        policy:{historyBytes:policy.historyBytes,deadlineMs:policy.deadlineMs,outputTokens:policy.outputTokens,tuning:policy.tuning,sensitivity:policy.sensitivity}};
      if(test.origin!==directiveRules.origin){
        console.log(JSON.stringify({...row,calls:0,result:{kind:'none'}}));
        continue;
      }
      const started=Date.now();
      const evidence={providerAttempts:0,modelSteps:0,finish:null,usage:null,observedModel:null};
      const signal=AbortSignal.timeout(policy.deadlineMs);
      const messages=test.history.filter(item=>item.role!=='tool').map(item=>({...item,role:item.role==='operator'?'user':item.role}));
      const input=directiveInput(messages,{id:'current',text:test.text},policy.historyBytes);
      const history={bytes:Buffer.byteLength(JSON.stringify(input.history),'utf8'),ids:input.history.map(item=>item.id),truncated:input.truncated};
      let result;
      try{
        result=await interpretDirective(directiveModel(key,policy,evidence),policy,input,signal,evidence);
      }catch{
        result={kind:signal.aborted?'timeout':'unavailable',reason:signal.aborted?'deadline':'provider'};
      }
      console.log(JSON.stringify({...row,history,calls:evidence.providerAttempts,latencyMs:Date.now()-started,
        firstTextMs:evidence.firstPublicTextAt===undefined?null:evidence.firstPublicTextAt-started,
        finish:evidence.finish,usage:evidence.usage,observedModel:evidence.observedModel,
        outputTokens:evidence.sentMaxOutputTokens,reasoningEffort:evidence.sentReasoningEffort,http:evidence.http,result}));
      if([401,403,429].includes(evidence.http)){process.exitCode=2;break;}
    }
    if(process.exitCode)break;
  }
}
