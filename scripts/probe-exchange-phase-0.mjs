import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { createTool } from '@mastra/core/tools';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { createDeterministicOfflineModel } from '@victframework/mastra';
import { z } from 'zod';

const require = createRequire(import.meta.url);
assert.equal(require('@mastra/core/package.json').version,'1.64.0');
const directory = await mkdtemp(join(tmpdir(),'tori-exchange-survey-'));
const storage = new LibSQLStore({id:'survey',url:'file:'+join(directory,'signals.db').replaceAll('\\','/')});
const entered = Promise.withResolvers();
const release = Promise.withResolvers();
const prompts = [];
const scripted = createDeterministicOfflineModel({script:{
  'hold-in-tool':{kind:'tool-call',toolName:'hold',args:{},thenText:'Finished after held tool.'},
}});
const plain = new Agent({
  id:'survey-answerer',name:'Survey answerer',instructions:'Deterministic survey only.',
  memory:new Memory({storage,options:{lastMessages:10,semanticRecall:false,workingMemory:{enabled:false}}}),
  model:{...scripted,async doStream(options){
    prompts.push(JSON.stringify(options.prompt));
    if(prompts.length===1)return scripted.doStream(options);
    return createDeterministicOfflineModel({script:{}}).doStream(options);
  }},
  tools:{hold:createTool({id:'hold',description:'Hold until the survey releases the tool.',
    inputSchema:z.object({}),async execute(){
      entered.resolve();
      await release.promise;
      return {released:true};
    },
  })},
});
const mastra = new Mastra({storage,agents:{plain}});
assert.equal(typeof plain.network,'function');
assert.equal(typeof plain.queueMessage,'function');
assert.equal(typeof plain.resumeStream,'function');
const address={thread:'survey-thread',resource:'survey-resource'};
const run=await plain.stream('hold-in-tool',{memory:address,maxSteps:2,maxRetries:0});
const drain=(async()=>{for await(const event of run.fullStream){ void event; }})();
const cap=async(promise,label)=>Promise.race([promise,delay(10000,undefined,{ref:false}).then(()=>{throw Error(label);})]);
try{
  await cap(entered.promise,'Tool did not enter');
  const signal=plain.sendSignal({id:'held-steer',type:'reactive',contents:'SYNTHETIC_STEER_WHILE_HELD',transient:true},
    {runId:run.runId,ifActive:{behavior:'deliver'}});
  const accepted=await cap(signal.accepted,'No signal routing disposition');
  assert.equal(accepted.action,'deliver');
  assert.equal(accepted.runId,run.runId);
  await delay(100);
  const dispatchesWhileHeld=prompts.length;
  assert.equal(dispatchesWhileHeld,1);
  release.resolve();
  await cap(drain,'Held stream did not finish');
  assert.equal(prompts.length,2);
  assert.match(prompts[1],/SYNTHETIC_STEER_WHILE_HELD/);
  console.log(JSON.stringify({core:'1.64.0',node:process.version,runId:run.runId,signalAction:accepted.action,
    dispatchesWhileHeld,dispatchesAfterRelease:prompts.length,signalObservedAfterRelease:true,
    network:'public function',queueMessage:'public function',resumeStream:'public function'}));
}finally{
  release.resolve();
  await mastra.shutdown();
}
