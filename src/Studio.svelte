<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Button, ControlScope, Feedback, Select, StatusBadge } from '@victframework/ui-svelte';
  import { Button as ControlButton, Dialog, Menubar } from '@victframework/ui-svelte/primitives';
  import { Conversation, Input } from '@victframework/ui-ai-svelte';
  import { SvelteFlow, SvelteFlowProvider, Background } from '@victframework/ui-flow-svelte';
  import AssemblyNode from './AssemblyNode.svelte';
  import FlowAccess from './FlowAccess.svelte';
  import Fields from './Fields.svelte';
  import {add,binding,change,emptyAssembly,field,history,instructions,modelName,readiness,resolved,wire} from './assembly';

  const initial=emptyAssembly();
  let graph=$state.raw(initial);
  let journal=history(initial);
  const authoringBytes=({revision,...content}:typeof initial)=>JSON.stringify(content);
  let baseline=$state(authoringBytes(initial));
  let canUndo=$state(false),canRedo=$state(false);
  function historyState(){canUndo=journal.canUndo;canRedo=journal.canRedo;}
  let state=$state.raw<any>({revision:null,activation:null,sessions:[],runs:[],provider:false});
  let ready=$derived(readiness(graph));
  let dirty=$derived(baseline!==authoringBytes(graph));
  let selection=$state('');
  let page=$state('Agents');
  let view=$state({x:0,y:0,zoom:1});
  let flow=$state<any>();
  let library=$state(true), inspector=$state(true);
  let mobile=$state(false), sheet=$state(''), mobileOpen=$state(false);
  let sheetInvoker:HTMLElement|null=null;
  let loaded=$state(false), pending=$state(false), sending=$state(false);
  let error=$state(''), graphError=$state('');
  let activeSession=$state(''), activeRun=$state('');
  let session=$derived(state.sessions.find((s)=>s.id===activeSession));
  let run=$derived(state.runs.find((r)=>r.id===activeRun));
  let layoutWidth=$state('Standard');
  let query=$state('');
  let activateDisabled=$derived(!loaded||!!ready||dirty||!state.revision||pending||(state.activation?.revision===state.revision?.id&&state.activation?.route===state.route));
  let types={assembly:AssemblyNode};
  let nodes=$state.raw<any[]>([]);
  const pages=['Agents','Workflows','Creative','Sessions','Runs'];
  const objectTitle=(id:string)=>id==='agent' ? resolved(graph).name||'Untitled agent':id==='model'?(field(graph,id,'model')?modelName:'Unassigned model'):'System prompt';

  async function request(path='',data?:any) {
    const response=await fetch('/api/studio'+path, data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const result=await response.json();
    if(!response.ok) throw new Error(result.message||'Studio could not complete this action.');
    return result;
  }
  function applyState(next:any){state=next;if(!activeSession)activeSession=next.sessions[0]?.id??'';if(!activeRun)activeRun=next.runs[0]?.id??'';}
  function reopen(next:any) {
    const g=next.graph??emptyAssembly();
    journal=history(g); graph=journal.graph; baseline=authoringBytes(graph);historyState();
    if(!graph.nodes.some(n=>n.id===selection)) selection='';
  }
  onMount(()=>{
    const mq=matchMedia('(max-width: 720px)');
    const measure=()=>mobile=mq.matches; measure(); mq.addEventListener('change',measure);
    try{
      const prefs=JSON.parse(localStorage.getItem('tori-v1a-layout')??'{}');
      library=prefs.library??true;inspector=prefs.inspector??true;layoutWidth=prefs.width??'Standard';
      selection=prefs.selection??'';
    }catch{}
    request().then(next=>{applyState(next);reopen(next);}).catch(e=>error=e.message).finally(()=>loaded=true);
    return ()=>mq.removeEventListener('change',measure);
  });
  $effect(()=>{if(loaded)localStorage.setItem('tori-v1a-layout',JSON.stringify({library,inspector,width:layoutWidth,selection}));});
  $effect(()=>{
    const g=graph,s=selection;
    nodes=g.nodes.map(n=>({id:n.id,type:'assembly',position:n.position,selected:s===n.id,
      data:{title:objectTitle(n.id),subtitle:n.id==='agent'?(binding(g,'model')?modelName:'Model unbound'):n.id==='model'?'Z.AI · text generation':'Reusable system instructions',
        fields:{graph:g,edit,expose,connect,disconnect,remove}}}));
  });
  let edges=$derived(graph.edges.map(e=>({id:e.id,source:e.source,target:e.target,sourceHandle:e.sourcePort,targetHandle:e.targetPort,selectable:false,
    style:e.targetPort==='model'?'stroke:#a3b4e6;stroke-width:2;stroke-dasharray:6 4':'stroke:#a3b4e6;stroke-width:2'})));
  function commit(operations:any[]){
    const result=journal.apply(operations,graph.revision);
    if(!result.ok){graphError=result.issues.map(i=>i.message).join(' ');return false;}
    graph=result.graph;graphError='';historyState();return true;
  }
  function edit(id:string,key:string,value:string|number){if(field(graph,id,key)!==value)commit([change(id,key,value)]);}
  function travel(direction:'undo'|'redo'){
    const result=journal[direction]();if(!result.ok)return;graph=result.graph;graphError='';historyState();
    if(!graph.nodes.some(n=>n.id===selection))selection='';
  }
  function connect(id:string,port:string){if(binding(graph,port)?.source!==id)commit([wire(id,port)]);}
  function disconnect(port:string){
    const edge=binding(graph,port);if(!edge)return;
    commit([...(port==='instructions'?[change('agent','instructions',instructions(graph))]:[]),{type:'remove',selection:{nodes:[],edges:[edge.id]}}]);
  }
  function remove(id:string){
    if(id==='agent')return;
    const ops:any[]=[];
    if(id==='instructions'&&binding(graph,'instructions'))ops.push(change('agent','instructions',instructions(graph)));
    if(commit([...ops,{type:'remove',selection:{nodes:[id],edges:[]}}])&&selection===id)selection='';
  }
  async function fit(){await tick();await flow?.fitView({padding:0.18,maxZoom:1});}
  async function reveal(id:string){selection=id;await tick();await flow?.fitView({nodes:[{id}],padding:0.28,maxZoom:1});}
  function create(id:string){if(commit([add(id)]))void reveal(id);}
  function expose(){
    if(binding(graph,'instructions'))return;
    const exists=graph.nodes.some(n=>n.id==='instructions');
    if(commit([...(exists?[]:[add('instructions'),change('instructions','text',instructions(graph))]),wire('instructions','instructions')]))void reveal('instructions');
  }
  function onConnection(c:any){
    if(c.target!=='agent'||c.sourceHandle!=='value'){graphError='Connect a source output to an input on the Agent Definition.';return;}
    connect(c.source,c.targetHandle);
  }
  async function action(work:()=>Promise<void>){if(pending)return;pending=true;error='';try{await work();}catch(e){error=(e as Error).message;}finally{pending=false;}}
  const save=()=>action(async()=>{const snapshot=graph;applyState(await request('/save',{graph:snapshot,expected:state.revision}));baseline=authoringBytes(snapshot);});
  const reload=()=>action(async()=>{const next=await request();applyState(next);reopen(next);});
  const activate=()=>action(async()=>{applyState(await request('/activate',{revision:state.revision}));});
  const start=()=>action(async()=>{const next=await request('/sessions',{activation:state.activation.version});activeSession=next.sessions[0].id;applyState(next);page='Sessions';});
  async function send(input:string,accepted?:()=>void){
    const id=activeSession;
    sending=true;
    try{
      const next=await request('/turn',{session:id,input});
      applyState(next);
      activeRun=next.runs[0]?.id??'';
      accepted?.();
      const last=next.runs[0];
      return last?.status==='completed'?{ok:true}:{ok:false,message:last?.message??'The response did not complete. See Runs.'};
    }catch(e){return {ok:false,message:(e as Error).message};}
    finally{sending=false;}
  }
  function toggle(panel:string,invoker:HTMLElement|null=null){
    if(mobile){sheetInvoker=invoker??document.getElementById('window-menu-trigger');sheet=panel;mobileOpen=true;}
    else if(panel==='Library')library=!library;
    else inspector=!inspector;
  }
  function keys(e:KeyboardEvent){
    if(!(e.ctrlKey||e.metaKey)||page!=='Agents')return;
    if(e.key.toLowerCase()==='s'){e.preventDefault();if(dirty&&!pending)void save();}
    if(e.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)){e.preventDefault();travel(e.shiftKey?'redo':'undo');}
  }
  const menu=$derived([
    {name:'File',items:[{label:'Save draft',fn:save,disabled:!dirty||pending||!loaded},{label:'Reopen saved draft',fn:reload,disabled:dirty||pending||!state.revision}]},
    {name:'Edit',items:[{label:'Undo',fn:()=>travel('undo'),disabled:!canUndo},{label:'Redo',fn:()=>travel('redo'),disabled:!canRedo}]},
    {name:'View',items:[{label:'Fit canvas',fn:fit,disabled:page!=='Agents'||!graph.nodes.length}]},
    {name:'Insert',items:[{label:'Agent Definition',fn:()=>create('agent'),disabled:!!graph.nodes.length},{label:'Instruction Text',fn:expose,disabled:!graph.nodes.length||!!binding(graph,'instructions')},{label:'Model Reference',fn:()=>create('model'),disabled:!graph.nodes.length||!!graph.nodes.find(n=>n.id==='model')}]},
    {name:'Run',items:[{label:'Activate saved revision',fn:activate,disabled:activateDisabled},{label:'Start Session',fn:start,disabled:!state.activation||pending}]},
    {name:'Window',items:[{label:'Library',checked:mobile?undefined:library,fn:()=>toggle('Library'),disabled:page!=='Agents'},{label:'Inspector',checked:mobile?undefined:inspector,fn:()=>toggle('Inspector'),disabled:page!=='Agents'},{label:layoutWidth==='Wide'?'Use standard panels':'Use wider panels',fn:()=>layoutWidth=layoutWidth==='Wide'?'Standard':'Wide',disabled:mobile||page!=='Agents'},{label:'Reset layout',fn:()=>{layoutWidth='Standard';library=true;inspector=true;},disabled:mobile||page!=='Agents'}]},
    {name:'Help',items:[{label:'V1a · Assembly, Sessions and Runs',fn:()=>{},disabled:true}]},
  ]);
</script>

<svelte:window onkeydown={keys}/>
{#snippet libraryBody()}
  {#if !mobile}<h2>Library</h2>{/if}
  {#if graph.nodes.length}<Input class="tori-field" aria-label="Search assembly objects" placeholder="Find a node" bind:value={query}/>{/if}
  <p class="eyebrow library-heading">ASSEMBLY OBJECTS</p>
  {#each graph.nodes.filter(n=>objectTitle(n.id).toLowerCase().includes(query.trim().toLowerCase())) as n (n.id)}
    <ControlButton.Root class="vict-btn vict-btn--secondary library-row" aria-pressed={selection===n.id} onclick={()=>{void reveal(n.id);mobileOpen=false;}}>{objectTitle(n.id)}</ControlButton.Root>
  {:else}<Feedback kind="empty" message={query?'No matching nodes.':'Your nodes will appear here.'}/>
  {/each}
{/snippet}
{#snippet inspectorBody()}
  {#if !mobile}<h2>Inspector</h2>{/if}
  {#if selection && graph.nodes.some(n=>n.id===selection)}
    <p class="eyebrow">SELECTED OBJECT</p><h3>{objectTitle(selection)}</h3>
    <Fields {graph} id={selection} area="inspector" {edit} {expose} {connect} {disconnect} {remove}/>
  {:else}<Feedback kind="empty" message="Select a node to inspect its configuration."/>
  {/if}
{/snippet}

<ControlScope class="tori-scope">
  <div class="studio" class:wide={layoutWidth==='Wide'}>
    <header class="shell">
      <div class="menuline"><span class="brand"><i aria-hidden="true"></i>TORI <span>STUDIO</span></span>
      <Menubar.Root class="app-menu">
        {#each menu as family}
          <Menubar.Menu><Menubar.Trigger class="menu-trigger" id={family.name==='Window'?'window-menu-trigger':undefined}>{family.name}</Menubar.Trigger>
          <Menubar.Portal><Menubar.Content class="menu-content" align="start">
            {#each family.items as item}
              {#if 'checked' in item && item.checked!==undefined}
                <Menubar.CheckboxItem class="menu-item panel-check" checked={item.checked} disabled={item.disabled} onSelect={item.fn}>
                  <span aria-hidden="true">{item.checked?'✓':' '}</span>{item.label}
                </Menubar.CheckboxItem>
              {:else}
                <Menubar.Item class="menu-item" disabled={item.disabled} onSelect={item.fn}>{item.label}</Menubar.Item>
              {/if}
            {/each}
          </Menubar.Content></Menubar.Portal></Menubar.Menu>
        {/each}
      </Menubar.Root><span class="local">LOCAL STUDIO</span></div>
      <div class="document">
        <div class="doc-name"><span class="eyebrow">LOCAL PROJECT / {page.toUpperCase()}</span><strong>{page==='Agents'&&graph.nodes.length?objectTitle('agent'):page==='Agents'?'Agent Assembly':page}</strong></div>
        {#if page==='Agents'}
          <StatusBadge value={dirty?'Unsaved':state.revision?'Saved · r'+state.revision.number:'New'}/>
          <div class="history">
            <Button label="Undo" variant="secondary" disabled={!canUndo} onclick={()=>travel('undo')}/>
            <Button label="Redo" variant="secondary" disabled={!canRedo} onclick={()=>travel('redo')}/>
          </div>
          <Button label="Save" variant="secondary" disabled={!loaded||!dirty||pending} onclick={save}/>
          <Button label="Activate" disabled={activateDisabled} onclick={activate}/>
        {:else if page==='Sessions'}
          <Button label="New Session" variant="secondary" disabled={!state.activation||pending||sending} onclick={start}/>
        {/if}
      </div>
    </header>
    {#if error}<div class="banner"><Feedback kind="error" message={error}/></div>{/if}
    {#if page==='Agents'}
      <main class="assembly" class:has-library={!mobile&&library} class:has-inspector={!mobile&&inspector}>
        {#if !mobile&&library}<aside class="library">{@render libraryBody()}</aside>{/if}
        <section class="stage" aria-label="Agent assembly canvas">
          <div class="canvas-tools">
            <Button label="Library" variant="secondary" expanded={mobile?mobileOpen&&sheet==='Library':library} onclick={(event)=>toggle('Library',event.currentTarget as HTMLElement)}/>
            <Button label="Inspector" variant="secondary" expanded={mobile?mobileOpen&&sheet==='Inspector':inspector} onclick={(event)=>toggle('Inspector',event.currentTarget as HTMLElement)}/>
            <span class="spacer"></span>
            {#if graph.nodes.length}
              {#if !graph.nodes.some(n=>n.id==='model')}<Button label="Add model" variant="secondary" onclick={()=>create('model')}/>{/if}
              <Button label="Fit" variant="secondary" onclick={fit}/>
            {/if}
          </div>
          <div class="flow">
            {#if graph.nodes.length}
              <SvelteFlowProvider>
                {@render canvas()}
              </SvelteFlowProvider>
            {:else}
              <div class="empty"><div class="empty-mark" aria-hidden="true">◇</div><p class="eyebrow">AGENT ASSEMBLY</p><h1>Build your first agent</h1><p>Start with a definition, give it instructions, and bind a model before activation.</p><Button label="Add Agent" disabled={!loaded} onclick={()=>create('agent')}/></div>
            {/if}
          </div>
          <div class="canvas-status">
            {#if graphError}<Feedback kind="error" message={graphError}/>
            {:else if state.activation}<span>Active r{state.activation.number} · {state.activation.name}</span><Button label="Start Session" variant="secondary" disabled={pending} onclick={start}/>
            {:else if graph.nodes.length}<span>{ready||'Ready to activate after saving.'}</span>
            {:else}<span>Agent definitions are saved in this local project.</span>{/if}
          </div>
        </section>
        {#if !mobile&&inspector}<aside class="inspector">{@render inspectorBody()}</aside>{/if}
      </main>
    {:else if page==='Sessions'}
      <main class="session-view">
        {#if session}
          <header class="session-header"><div><p class="eyebrow">SESSION · LIVE PROVIDER</p><h1>{session.name}</h1><p>Z.AI {session.route==='coding'?'Coding':'General'} · {modelName} · Activated r{session.number} · Conversation</p></div>
            <StatusBadge value={sending?'Waiting for Z.AI':session.interrupted?'Interrupted':session.connectionReady?'Ready':'Credential not connected'}/>
          </header>
          {#if state.sessions.length>1}<div class="session-picker"><label for="session-picker">Open Session</label><Select id="session-picker" name="session" value={activeSession} options={state.sessions.map(s=>({value:s.id,label:s.name+' · '+new Date(s.created).toLocaleString()}))} onChange={v=>activeSession=v}/></div>{/if}
          <div class="conversation"><Conversation messages={session.messages} busy={sending} onSend={session.connectionReady&&!session.interrupted?send:undefined} emptyMessage="Start a conversation with your activated agent."/></div>
          <div class="session-foot"><Button label="Inspect runs" variant="secondary" disabled={!state.runs.some(r=>r.session===activeSession)} onclick={()=>{activeRun=state.runs.find(r=>r.session===activeSession).id;page='Runs';}}/></div>
        {:else}
          <div class="empty"><p class="eyebrow">SESSIONS</p><h1>Start a conversation</h1><p>{state.activation?'Open a Session pinned to your active agent.':'Activate a saved agent to start a real Session.'}</p><Button label={state.activation?'Start Session':'Open Agents'} onclick={state.activation?start:()=>page='Agents'}/></div>
        {/if}
      </main>
    {:else if page==='Runs'}
      <main class="runs-view">
        <p class="eyebrow">EXECUTION EVIDENCE</p><h1>Runs</h1>
        {#if run}
          <label for="run-picker">Run</label><Select id="run-picker" name="run" value={activeRun} options={state.runs.map(r=>({value:r.id,label:new Date(r.started).toLocaleString()+' · '+r.status}))} onChange={v=>activeRun=v}/>
          <dl><dt>Status</dt><dd><StatusBadge value={run.status}/></dd><dt>Agent</dt><dd>{run.name} · r{run.number}</dd><dt>Activation</dt><dd class="hash">{run.activation}</dd><dt>Provider / model</dt><dd>Z.AI {run.route==='coding'?'Coding':'General'} / {run.observedModel??run.model}</dd><dt>Output token limit</dt><dd>{run.tokens}{run.sentMaxOutputTokens===undefined?' - configured':' - sent '+run.sentMaxOutputTokens}</dd><dt>Usage</dt><dd>{run.usage?run.usage.inputTokens+' input / '+run.usage.outputTokens+' output':'Not reported'}</dd><dt>Context</dt><dd>Pinned instructions and up to 100 recent messages. No JIT sources or tools.</dd></dl>
          {#if run.message}<Feedback kind="error" message={run.message}/>{/if}
          <h2>Timeline</h2><ol class="timeline">{#each run.events as event}<li><time>{new Date(event.at).toLocaleTimeString()}</time><span>{event.label}</span></li>{/each}</ol>
          <Button label="Open Session" variant="secondary" onclick={()=>{activeSession=run.session;page='Sessions';}}/>
        {:else}<Feedback kind="empty" message="Completed, interrupted and failed turns will appear here."/>
        {/if}
      </main>
    {/if}
    <nav class="tasks" aria-label="Studio tasks">
      {#each pages as item}
        <ControlButton.Root class={'vict-btn vict-btn--secondary '+(page===item?'current-task':'')} aria-current={page===item?'page':undefined} disabled={['Workflows','Creative'].includes(item)} onclick={()=>page=item}>{item}</ControlButton.Root>
      {/each}
    </nav>
  </div>
  <Dialog.Root bind:open={mobileOpen}><Dialog.Portal><Dialog.Overlay class="sheet-shade"/><Dialog.Content class="mobile-sheet" onCloseAutoFocus={(event)=>{if(sheetInvoker?.isConnected){event.preventDefault();sheetInvoker.focus({preventScroll:true});}}}>
    <div class="sheet-top"><Dialog.Title>{sheet}</Dialog.Title><Dialog.Close class="menu-trigger">Close</Dialog.Close></div>
    <Dialog.Description>Inspect the current assembly.</Dialog.Description>
    {#if sheet==='Library'}{@render libraryBody()}{:else}{@render inspectorBody()}{/if}
  </Dialog.Content></Dialog.Portal></Dialog.Root>
</ControlScope>

{#snippet canvas()}
  <SvelteFlow bind:nodes {edges} nodeTypes={types} bind:viewport={view} oninit={()=>{if(mobile&&selection)void reveal(selection);else if(view.x===0&&view.y===0)void fit();}}
    onnodeclick={({node})=>selection=node.id} onpaneclick={()=>selection=''}
    onselectionchange={({nodes:selected})=>{if(selected.length)selection=selected[0].id;}}
    onbeforeconnect={(connection)=>{onConnection(connection);return false;}}
    onnodedragstop={({nodes:moved})=>commit([{type:'moveNodes',positions:Object.fromEntries(moved.map(n=>[n.id,n.position]))}])}
    nodesDraggable={!mobile} multiSelectionKey={null} deleteKey={null} minZoom={0.2} maxZoom={1.7} proOptions={{hideAttribution:true}}>
    <FlowAccess onready={(instance)=>flow=instance}/>
    <Background color="#454950" gap={24} size={1}/>
  </SvelteFlow>
{/snippet}
