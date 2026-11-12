/**
 * Keep VICT's pinned durable-presence check on the public LibSQL memory port.
 * Its two-key, scoped list compares message array lengths, so the implicit
 * LibSQL page of 40 must not stand in for the whole stored thread. Explicitly
 * paged reads, including Mastra's history window, retain their exact options.
 */
export function withCompleteScopedThreadReads(store) {
  const domains=new WeakMap();
  const bound=(target,property)=>{
    const value=Reflect.get(target,property,target);
    return typeof value==='function'?value.bind(target):value;
  };
  return new Proxy(store,{
    get(target,property){
      if(property!=='getStore')return bound(target,property);
      return async name=>{
        const domain=await target.getStore(name);
        if(name!=='memory'||!domain)return domain;
        if(!domains.has(domain))domains.set(domain,new Proxy(domain,{
          get(memory,key){
            if(key!=='listMessages')return bound(memory,key);
            return args=>{
              const scopedThread=typeof args.threadId==='string'&&typeof args.resourceId==='string'&&
                Object.keys(args).every(key=>key==='threadId'||key==='resourceId');
              return memory.listMessages(scopedThread?{...args,perPage:false}:args);
            };
          },
        }));
        return domains.get(domain);
      };
    },
  });
}
