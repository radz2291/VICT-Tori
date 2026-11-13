import assert from 'node:assert/strict';
import { createServer as httpServer } from 'node:http';
import { createServer } from 'vite';
import { createStudio } from '../server/studio.mjs';
import { installMemoryProvider, syntheticKey } from './memory-provider-fixture.mjs';
import { appendFileSync } from 'node:fs';

const [dataDirectory,capture,mode]=process.argv.slice(2);
Object.assign(process.env,{TORI_EXECUTION_FIXTURE:'a1-request-capture',TORI_ZAI_API_KEY:syntheticKey,
  TORI_ZAI_ROUTE:'coding',TORI_ENABLE_PI_ZAI:'0'});
const original=globalThis.fetch;
installMemoryProvider();
const memoryFetch=globalThis.fetch;
const announce=(stage,evidence)=>process.send({stage,...evidence});
const records=(stage,payload)=>appendFileSync(capture,JSON.stringify({stage,...payload})+'\n');
const gate=(name,signal)=>new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(signal.reason);
  const listener=message=>{if(message===name){clean();resolve();}};
  const abort=()=>{clean();reject(signal.reason);};
  const clean=()=>{process.off('message',listener);signal?.removeEventListener('abort',abort);};
  process.on('message',listener);signal?.addEventListener('abort',abort,{once:true});
});
const sse=body=>new Response(body,{headers:{'Content-Type':'text/event-stream'}});
const chunk=(delta,finish_reason)=>'data: '+JSON.stringify({
  id:'background-fixture',object:'chat.completion.chunk',created:1,model:'glm-5.3-flash',
  choices:[{index:0,delta,finish_reason}],
})+'\n\n';
globalThis.fetch=async(url,init)=>{
  if(!String(url).startsWith('https://api.z.ai/'))return original(url,init);
  init.signal?.throwIfAborted();
  const body=JSON.parse(init.body);
  const last=body.messages.findLastIndex(item=>item.role==='user');
  const text=body.messages[last].content;
  records('provider',{text});
  if(text.startsWith('Synthetic hold model')){
    const release=gate('model',init.signal);
    announce('model',{text});
    await release;
    // A deliberately split pair of real provider deltas.
    return sse(chunk({role:'assistant',content:'Synthetic '},null)+chunk({content:'settled reply.'},null)+chunk({},'stop')+'data: [DONE]\n\n');
  }
  if(text.startsWith('Synthetic delegation')){
    const tool=body.tools?.find(item=>item.function.name.includes('delegate'));
    if(tool&&!body.messages.slice(last+1).some(item=>item.role==='tool')){
      const delta={role:'assistant',tool_calls:[{index:0,id:'synthetic-delegation',type:'function',
        function:{name:tool.function.name,arguments:'{"task":"Synthetic specialist read."}'}}]};
      return sse(chunk(delta,null)+chunk({},'tool_calls')+'data: [DONE]\n\n');
    }
    return sse(chunk({role:'assistant',content:'Synthetic parent settled.'},null)+chunk({},'stop')+'data: [DONE]\n\n');
  }
  return memoryFetch(url,init);
};
const vite=await createServer({server:{middlewareMode:true,watch:null,ws:false}});
const assembly=await vite.ssrLoadModule('/src/assembly.ts');
const studio=createStudio({dataDirectory,getAssembly:()=>assembly,backgroundFixture:{
  async child(run,signal){
    const release=gate('child',signal);
    announce('child',{run:run.id,parent:run.parentRun,invocation:run.parentInvocation,operation:run.parentOperation,owner:run.ownerId});
    await release;
  },
  memory(stage,grant,signal){
    if(stage==='reserved'&&mode==='hold-save'){
      const release=gate('memory',signal);
      announce(stage,{run:grant.run,operation:grant.operation});
      return release;
    }
    if(stage==='before-commit'&&mode==='crash-in-transaction'){
      records(stage,{run:grant.run,operation:grant.operation});
      process.exit(47);
    }
    if(stage==='committed'&&mode==='hold-ack'){
      const release=gate('memory',signal);
      announce(stage,{run:grant.run,operation:grant.operation});
      return release;
    }
  },
}});
const server=httpServer(async(req,res)=>{
  try{
    assert.equal(req.headers.host,'127.0.0.1:'+server.address().port);
    const chunks=[];
    for await(const chunk of req)chunks.push(chunk);
    const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
    const result=await studio.dispatch(req.url.replace(/\/$/,''),body);
    res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(result));
  }catch(e){
    res.writeHead(e.status??500,{'content-type':'application/json'}).end(JSON.stringify({message:e.message}));
  }
});
server.listen(0,'127.0.0.1',()=>announce('ready',{port:server.address().port,pid:process.pid}));
