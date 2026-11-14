import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { createDeterministicOfflineModel } from '@victframework/mastra';
import { z } from 'zod';

assert.equal(createRequire(import.meta.url)('@mastra/core/package.json').version,'1.64.0');

// Synthetic composition probe. This state represents the proposed VICT-owned
// reservation, authorization and evidence boundary. Nothing here is a VICT API.
async function probe(mode) {
  const ledger={left:mode==='zero'?1:2,ordinary:0,answers:0,askerSteps:0,questions:0,receipts:0,blocked:0};
  const askerStop=new AbortController(),answererStop=new AbortController();
  const started=Date.now();
  const deadlines={asker:started+12000,answerer:started+15000};
  const signal=AbortSignal.any([askerStop.signal,answererStop.signal,AbortSignal.timeout(deadlines.asker-started),AbortSignal.timeout(deadlines.answerer-started)]);
  const valid=()=>!signal.aborted&&Date.now()<deadlines.asker&&Date.now()<deadlines.answerer;
  const permittedContext='Approved shared scope.';
  const privateContext='PRIVATE_ANSWERER_CONTEXT';
  const answerEntered=Promise.withResolvers(),answerRelease=Promise.withResolvers();
  const events=[];
  const runIds=[];
  let question,askerRunId;
  const operations=new Map();
  const reserve=()=>{
    signal.throwIfAborted();
    if(!valid())return false;
    if(ledger.left===0)return false;
    ledger.left--;
    return true;
  };
  const scripted=(id,input,step,check)=>{
    const model=createDeterministicOfflineModel({script:{[input]:step}});
    return new Agent({id,name:id,instructions:'Synthetic probe.',
      model:{...model,async doStream(options){
        await check(options);
        return model.doStream(options);
      }}});
  };
  const askPrompt='What is the approved scope?\n'+permittedContext;
  const answererStep=scripted('answer-step',askPrompt,{kind:'text',text:permittedContext},async options=>{
    ledger.answers++;
    assert.doesNotMatch(JSON.stringify(options.prompt),new RegExp(privateContext));
    assert.match(JSON.stringify(options.prompt),/Approved shared scope/);
    assert.equal(options.tools?.length??0,0);
    answerEntered.resolve();
    if(mode.startsWith('stop-'))await answerRelease.promise;
  });
  const exchange=(handle,questionId,text)=>{
    if(handle!==binding || text!=='What is the approved scope?' || !valid())
      return Promise.resolve({status:'refused'});
    if(operations.has(questionId))return operations.get(questionId);
    ledger.questions++;
    const operation=(async()=>{
      if(!reserve())return {status:'limit'};
      const reply=await answererStep.stream(askPrompt,{maxSteps:1,maxRetries:0,abortSignal:signal});
      for await(const event of reply.fullStream){void event;}
      const answer=await reply.text;
      if(!valid())return {status:'cancelled'};
      if(answer!==permittedContext)return {status:'refused'};
      ledger.receipts++;
      return {status:'answered',text:answer,receipt:questionId};
    })().catch(error=>{if(signal.aborted)return {status:'cancelled'};throw error;});
    operations.set(questionId,operation);
    return operation;
  };
  const binding=Object.freeze({asker:'survey-asker',answerer:'survey-answerer'});
  assert.equal((await exchange(undefined,'no-wiring','What is the approved scope?')).status,'refused');
  assert.equal(ledger.answers,0);
  const ask=createTool({id:'ask',description:'Ask the bound agent a question.',
    inputSchema:z.object({}),async execute(){
      const text='What is the approved scope?';
      assert.equal((await exchange({},'wrong-binding',text)).status,'refused');
      const first=exchange(binding,'exchange-one',text);
      assert.equal(first,exchange(binding,'exchange-one',text));
      if(mode.startsWith('stop-')){
        await answerEntered.promise;
        (mode==='stop-asker'?askerStop:answererStop).abort();
        answerRelease.resolve();
      }
      question=await first;
      return question;
    }});
  const askerModel=createDeterministicOfflineModel({script:{
    'synthetic-task':{kind:'tool-call',toolName:'ask',args:{},thenText:'Asker finished.'}
  }});
  const asker=new Agent({id:'survey-asker',name:'Survey asker',instructions:'Synthetic probe.',tools:{ask},
    model:{...askerModel,async doStream(options){
      signal.throwIfAborted();
      ledger.askerSteps++;
      assert.ok(ledger.askerSteps<=2);
      if(ledger.askerSteps===2){
        const visible=JSON.stringify(options.prompt);
        assert.doesNotMatch(visible,new RegExp(privateContext));
        assert.match(visible,mode==='zero'?/limit/:/Approved shared scope/);
      }
      return askerModel.doStream(options);
    }}});
  const delegate=createTool({id:'delegate',description:'Run the synthetic asker.',inputSchema:z.object({}),async execute(){
    const run=await asker.stream('synthetic-task',{runId:'original-asker-'+mode,maxSteps:2,maxRetries:0,abortSignal:signal});
    askerRunId=run.runId;
    for await(const event of run.fullStream){
      events.push(event.type);
      if(event.runId)runIds.push(event.runId);
    }
    if(signal.aborted)return {status:'cancelled'};
    return {text:await run.text};
  }});
  const answererModel=createDeterministicOfflineModel({script:{
    'begin':{kind:'tool-call',toolName:'delegate',args:{},thenText:'Answerer finished.'}
  }});
  const answerer=new Agent({id:'survey-answerer',name:'Survey answerer',instructions:privateContext,tools:{delegate},
    model:{...answererModel,async doStream(options){
      if(!reserve()){
        ledger.blocked++;
        throw Error('SYNTHETIC_STEP_LIMIT');
      }
      ledger.ordinary++;
      return answererModel.doStream(options);
    }}});
  try{
    const run=await answerer.stream('begin',{maxSteps:2,maxRetries:0,abortSignal:signal});
    for await(const event of run.fullStream){void event;}
  }catch(error){if(!signal.aborted&&ledger.blocked===0)throw error;}
  assert.equal(ledger.ordinary,1);
  assert.equal(ledger.questions,1);
  assert.equal(askerRunId,'original-asker-'+mode);
  assert.ok(runIds.every(id=>id===askerRunId));
  if(mode.startsWith('stop-')){
    assert.equal(ledger.askerSteps,1);
    assert.equal(ledger.answers,1);
    assert.equal(ledger.receipts,0);
    assert.equal(ledger.blocked,0);
  }else{
    assert.equal(ledger.askerSteps,2);
    assert.equal(question?.status,mode==='zero'?'limit':'answered');
    assert.equal(ledger.answers,mode==='zero'?0:1);
    assert.equal(ledger.receipts,mode==='zero'?0:1);
    assert.equal(ledger.blocked,1);
  }
  console.log(JSON.stringify({mode,ledger,askerRunId,askerEvents:events.length,question:question?.status??'cancelled'}));
}
for(const mode of ['one','zero','stop-asker','stop-answerer'])await probe(mode);
