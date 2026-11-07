import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { AgentStreamHub, authenticatedActorContext, gateCapabilityInvoke } from '@victframework/runtime';
import { composeMastraTurnExecutor } from '@victframework/mastra';
import { delegateGrant, delegationRef } from './a4-runtime.mjs';
import { contextBudget, inputSchema, readGrant, schemaDigest, sources, toolRef } from './a3-catalog.mjs';

export { toolRef };

export function contextPolicy(binding) {
  if(!Object.hasOwn(sources,binding))return undefined;
  return {source:binding,digest:sources[binding].digest,loader:'local-reference@1',
    purpose:'observatory-reference',trigger:'explicit-turn-demand',budgetBytes:contextBudget};
}

export async function loadContext(binding,demand,read=readFile,pin=contextPolicy(binding)) {
  if(!binding)return {receipt:demand?{status:'omitted',reason:'no-pinned-source'}:undefined};
  const receipt={source:binding,trigger:'explicit-turn-demand',budgetBytes:contextBudget,reads:0};
  if(demand!==true)return {receipt:{...receipt,status:'omitted',reason:'no-demand'}};
  const current=contextPolicy(binding);
  if(!current||JSON.stringify(current)!==JSON.stringify(pin))return {receipt:{...receipt,status:'omitted',reason:'stale'}};
  if(process.env.TORI_CONTEXT_REVOKED==='1')return {receipt:{...receipt,status:'omitted',reason:'denied'}};
  try {
    receipt.reads++;
    const content=await read(sources[binding].file);
    if(content.byteLength>pin.budgetBytes)return {receipt:{...receipt,status:'omitted',reason:'over-budget'}};
    const normalized=content.toString('utf8').replaceAll('\r\n','\n');
    if(createHash('sha256').update(normalized).digest('hex')!==pin.digest)
      return {receipt:{...receipt,status:'omitted',reason:'stale'}};
    return {content:normalized,receipt:{...receipt,status:'admitted',bytes:content.byteLength}};
  } catch {
    return {receipt:{...receipt,status:'omitted',reason:'unavailable'}};
  }
}

async function withMcp(operation,signal,fixture) {
  const serverPath=fileURLToPath(new URL('./a3-mcp-server.mjs',import.meta.url));
  const transport=new StdioClientTransport({
    command:process.execPath,args:[serverPath],stderr:'pipe',
    env:fixture?{
      ...(process.env.TORI_MCP_SCHEMA_DRIFT==='1'?{TORI_MCP_SCHEMA_DRIFT:'1'}:{}),
      ...(process.env.TORI_MCP_CALL_CAPTURE?{TORI_MCP_CALL_CAPTURE:process.env.TORI_MCP_CALL_CAPTURE}:{}),
    }:{},
  });
  const client=new Client({name:'tori-studio',version:'1'});
  const options={signal,timeout:15000};
  try {
    signal?.throwIfAborted();
    await client.connect(transport,options);
    return await operation(client,options);
  } finally {
    await client.close();
  }
}

async function verifyTool(client,options) {
  const {tools}=await client.listTools(undefined,options);
  const tool=tools.find(item=>item.name===toolRef.name);
  if(!tool||tool.annotations?.readOnlyHint!==true||schemaDigest(tool.inputSchema)!==schemaDigest(inputSchema))
    throw new Error('TORI_MCP_SCHEMA_DRIFT');
}

export function discoverReadTool(fixture) {
  return withMcp(async(client,options)=>{
    await verifyTool(client,options);
    return toolRef;
  },undefined,fixture);
}

const objectContract=(id,test,descriptiveJsonSchema)=>({
  id,revision:'1',descriptiveJsonSchema,
  parse(value){return test(value)?{ok:true,value}:{ok:false,issues:[{code:'INVALID',path:'$',message:'Invalid reference contract.'}]};},
});

export async function governedReadTurn({activation,stores,agentConfig,actorId,threadId,input,deadline,fixture,onEvent,childCapability}) {
  const hub=new AgentStreamHub({ledger:stores.streamLedger});
  const streamId=randomUUID();
  const governance={calls:0,disposition:undefined};
  const definition={
    id:toolRef.id,revision:toolRef.revision,effect:'read',description:'Read the synthetic observatory reference.',
    permissions:[readGrant],
    input:objectContract('tori.reference.input',v=>v!==null&&typeof v==='object'&&Object.keys(v).length===1&&v.key==='observatory',inputSchema),
    output:objectContract('tori.reference.output',v=>typeof v?.text==='string'&&v.text.length<=512),
    invoke:async(args,context)=>withMcp(async(client,options)=>{
      try{await verifyTool(client,options);}catch{governance.disposition='schema-mismatch';throw new Error('TORI_MCP_SCHEMA_DRIFT');}
      options.signal?.throwIfAborted();
      governance.calls++;
      const result=await client.callTool({name:toolRef.name,arguments:args},options);
      const item=result.content?.[0];
      if(result.isError||result.content?.length!==1||item?.type!=='text'||item.text.length>512)
        throw new Error('TORI_MCP_RESULT_INVALID');
      governance.disposition='completed';
      return {text:item.text};
    },context.signal,fixture),
  };
  const requester=authenticatedActorContext(await stores.actors.get(actorId),actorId);
  let service;
  const id=()=>randomUUID();
  const composition=composeMastraTurnExecutor({
    stores,activation,hub,agentConfig,
    ids:{turnId:id,streamId:()=>streamId,invocationId:id,approvalId:id,idempotencyKey:id,cancelId:id},
    capabilityBridge:{
      resolveCapability:(capId,rev)=>capId===definition.id&&rev===definition.revision?definition:
        capId===childCapability?.id&&rev===childCapability?.revision?childCapability:undefined,
      invoke:(cap,args,context)=>{
        const child=cap.id===delegationRef.id;
        const granted=context.victActorId===actorId&&requester.scopes.includes('agent.turn.start')&&
          (child?process.env.TORI_CHILD_REVOKED!=='1':process.env.TORI_MCP_REVOKED!=='1');
        if(!granted)governance.disposition=child?'child-denied':'denied';
        return gateCapabilityInvoke(cap,{grants:granted?[child?delegateGrant:readGrant]:[]})(args,context);
      },
      recordInvocationIntent:command=>service.recordToolInvocationIntent(command),
      updateInvocationStatus:command=>stores.invocations.updateInvocationStatus(command),
    },
  });
  service=composition.turnService;
  let text='', usage;
  const events=[];
  await hub.subscribe(streamId,{subscriberId:streamId,deliver(event){
    if(event.kind==='text.delta')text+=event.delta;
    else events.push(event);
    if(event.kind==='usage.updated')usage=event.usage;
    onEvent(event);
    return true;
  }});
  let cancel, cancellation;
  try{
    deadline.throwIfAborted();
    const {turn,outcomePromise}=await service.startTurn(requester,{threadId,input,inputSummary:'TORI governed turn'});
    cancel=()=>{cancellation=service.cancelTurn(requester,{turnId:turn.turnId,reasonCode:'TORI_TURN_DEADLINE'}).catch(()=>undefined);};
    deadline.addEventListener('abort',cancel,{once:true});
    if(deadline.aborted)cancel();
    const outcome=await outcomePromise;
    await cancellation;
    await composition.productAgent.flush();
    const invocations=await stores.invocations.listInvocationsForTurn(turn.turnId);
    return {status:outcome.status,text,usage,errorCode:outcome.errorCode,events,governance:{
      ...governance,turnId:turn.turnId,streamId,invocations:invocations.map(({invocationId,status})=>({invocationId,status})),
    }};
  }finally{
    if(cancel)deadline.removeEventListener('abort',cancel);
    hub.unsubscribe(streamId,streamId);
  }
}
