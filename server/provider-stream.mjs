// The provider may return private reasoning in its protocol. Strip it before
// Mastra can observe, retain or deliver it, while preserving text and usage.
export function publicProviderStream(response,onFinish,acceptText) {
  if(!response.body || !response.headers.get('content-type')?.includes('text/event-stream')){
    return Response.json({error:{message:'Unsupported provider response format.'}},{status:502});
  }
  let tail='';
  const buffered=acceptText?{frames:[],text:[]}:undefined;
  const decoder=new TextDecoder(),encoder=new TextEncoder();
  const redact=line=>{
    if(!line.startsWith('data:')||line.trim()==='data: [DONE]')return line;
    try {
      const parsed=JSON.parse(line.slice(5));
      const choices=parsed.choices?.map(c=>{
        if(c.index===0){
          if(typeof c.finish_reason==='string')onFinish?.(c.finish_reason);
          const text=c.delta?.content??c.message?.content;
          if(buffered&&typeof text==='string')buffered.text.push(text);
        }
        const sanitize=value=>{
          if(!value)return value;
          const {reasoning_content,reasoning,thinking,...publicParts}=value;
          return publicParts;
        };
        return {...c,...(c.delta?{delta:sanitize(c.delta)}:{}),...(c.message?{message:sanitize(c.message)}:{})};
      });
      return 'data: '+JSON.stringify({...parsed,...(choices?{choices}:{})});
    }catch{return 'data: {"error":{"message":"Invalid provider event"}}';}
  };
  const publish=(value,controller)=>{
    if(buffered)buffered.frames.push(value);
    else controller.enqueue(encoder.encode(value));
  };
  const body=response.body.pipeThrough(new TransformStream({
    transform(chunk,controller) {
      const lines=(tail+decoder.decode(chunk,{stream:true})).split('\n');
      tail=lines.pop()??'';
      if(lines.length)publish(lines.map(redact).join('\n')+'\n',controller);
    },
    flush(controller){
      const rest=tail+decoder.decode();
      if(rest)publish(redact(rest),controller);
      // A guarded turn must pass before a single provider frame can reach
      // Mastra's transcript. No raw or private stream data is exposed.
      if(buffered){
        if(!acceptText(buffered.text.join('')))controller.error(new Error('TORI_MEMORY_REPLY_UNCONFIRMED'));
        else controller.enqueue(encoder.encode(buffered.frames.join('')));
      }
    },
  }));
  return new Response(body,{status:response.status,headers:{'Content-Type':'text/event-stream'}});
}
