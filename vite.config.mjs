import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  plugins:[svelte(),{
    name:'tori-local-studio',
    configureServer(server) {
      let service;
      const localHost='127.0.0.1:'+(server.config.server.port??48761);
      const origin='http://'+localHost;
      server.middlewares.use('/api/studio',async(req,res)=>{
        const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
        try {
          if(req.headers.host!==localHost)return send(403,{message:'Open Studio at its local address.'});
          if(!['GET','POST'].includes(req.method))return send(405,{message:'Unsupported Studio method.'});
          if(req.method==='POST'&&(req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json')))
            return send(403,{message:'The request must come from local Studio.'});
          let body={};let bytes=0;
          if(req.method==='POST'){
            const chunks=[];
            for await(const chunk of req){bytes+=chunk.length;if(bytes>1000000)return send(413,{message:'The request is too large.'});chunks.push(chunk);}
            try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{message:'Invalid Studio request.'});}
          }
          const parsed=new URL(req.url,'http://localhost');
          const path=parsed.pathname.replace(/\/$/,'');
          // Activity projects only the validated public VICT response lifecycle.
          if(req.method==='GET'&&path==='/activity')body={session:parsed.searchParams.get('session')};
          if((req.method==='GET')!==(!path||path==='/activity'))return send(405,{message:'Unsupported Studio method.'});
          service??=import('./server/studio.mjs').then(({createStudio})=>createStudio({
            getAssembly:()=>server.ssrLoadModule('/src/assembly.ts'),
            dataDirectory:process.env.TORI_DATA_DIR??resolve('.data'),
          }));
          const app=await service;
          return send(200,await app.dispatch(path,body));
        }catch(e){return send(e.status??500,{message:e.status?e.message:'Studio could not complete this action. Check local setup.'});}
      });
    }
  }],
  optimizeDeps:{noDiscovery:true},
  ssr:{noExternal:['@victframework/ui-flow-svelte']},
  server:{cors:false,fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.data/**','**/.pi/**','**/server/**','**/*.sqlite*','**/*.db*']}},
});
