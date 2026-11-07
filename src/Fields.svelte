<script lang="ts">
  import { Button, Select, StatusBadge, Feedback } from '@victframework/ui-svelte';
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import { binding, field, instructions, modelId, modelName, rootId, instructionId, modelNodeId, outputTokens, tokenSourceId, agentResources } from './assembly';
  let {graph,route,id,area,edit,expose,exposeTokens,connect,disconnect,remove}=$props();
  let prefix=$derived(area+'-'+id);
  let name=$derived(String(field(graph,rootId,'name')??''));
  let textWire=$derived(binding(graph,'instructions'));
  let tokenWire=$derived(binding(graph,'tokens'));
  const numeric=(value:string)=>value===''?undefined:Number(value);
  let sampling=$derived(graph.nodes.find(n=>n.id===modelNodeId)?.values);
  let resource=$derived(agentResources.find(item=>item.id===id));
  const choices={
    context:[{value:'reference@1',label:'Observatory reference · r1'},{value:'reference@2',label:'Observatory reference · r2'}],
    memory:[{value:'recent-10@1',label:'Last 10 messages'},{value:'recent-100@1',label:'Last 100 messages'}],
    output:[{value:'finding@1',label:'Finding JSON · r1'}],
    child:[{value:'reference-reviewer@1',label:'Reference reviewer · r1 (fixture)'}],
    tool:[{value:'local-reference@1',label:'Local observatory · read only'}],
  };
  let modelWire=$derived(binding(graph,'model'));
</script>

{#if id===rootId}
  <label for={prefix+'-name'}>Agent name</label>
  <Input id={prefix+'-name'} class="tori-field nodrag" value={name} oninput={(e)=>edit(rootId,'name',e.currentTarget.value)}/>
  <label for={prefix+'-text'}>System instructions {#if textWire}<span> · linked</span>{/if}</label>
  <Textarea id={prefix+'-text'} class="tori-field nodrag nowheel" rows={area==='node'?2:4} value={instructions(graph)} oninput={(e)=>edit(textWire?instructionId:rootId,textWire?'text':'instructions',e.currentTarget.value)}/>
  {#if area==='inspector'}
    <Button label={textWire?'Detach instruction source':'Show instructions as node'} variant="secondary" onclick={textWire?()=>disconnect('instructions'):expose}/>
    <label for={prefix+'-steps'}>Max model steps</label>
    <Input id={prefix+'-steps'} class="tori-field" type="number" min={1} max={4} step={1} value={field(graph,id,'maxSteps')} oninput={(e)=>edit(id,'maxSteps',numeric(e.currentTarget.value))}/>
    <label for={prefix+'-retries'}>Max model retries</label>
    <Input id={prefix+'-retries'} class="tori-field" type="number" min={0} max={1} step={1} value={field(graph,id,'maxRetries')} oninput={(e)=>edit(id,'maxRetries',numeric(e.currentTarget.value))}/>
    <p class="muted">Host deadline: 90 seconds. {binding(graph,'tool')?'One governed read allowed.':'Tool calls are disabled.'}</p>
    <dl><dt>Model binding</dt><dd>{modelWire ? modelName : 'Not connected'}</dd><dt>Runtime</dt><dd>Conversation only · no tools</dd></dl>
  {/if}
{:else if id===instructionId}
  <label for={prefix+'-value'}>Text value</label>
  <Textarea id={prefix+'-value'} class="tori-field nodrag nowheel" rows={area==='node'?2:4} value={String(field(graph,id,'text')??'')} oninput={(e)=>edit(id,'text',e.currentTarget.value)}/>
{:else if resource}
  <label for={prefix+'-reference'}>{resource.label}</label>
  <div class="nodrag"><Select id={prefix+'-reference'} name="reference" value={String(field(graph,id,'reference'))} options={choices[resource.id]} onChange={v=>edit(id,'reference',v)}/></div>
{:else if id===tokenSourceId}
  <label for={prefix+'-tokens'}>Output limit value</label>
  <Input id={prefix+'-tokens'} class="tori-field nodrag" type="number" min={64} max={32768} step={1} value={Number(field(graph,id,'tokens'))} oninput={(e)=>edit(id,'tokens',Number(e.currentTarget.value))}/>
{:else if id===modelNodeId}
  <label for={prefix+'-model'}>Cloud model</label>
  <div class="nodrag"><Select id={prefix+'-model'} name="model" value={String(field(graph,id,'model')??'')} options={[{value:modelId,label:modelName}]} onChange={(v)=>edit(id,'model',v)}/></div>
  <label for={prefix+'-tokens'}>Max output tokens {#if tokenWire}<span> · linked</span>{/if}</label>
  <Input id={prefix+'-tokens'} class="tori-field nodrag" type="number" min={64} max={32768} step={1} value={outputTokens(graph)} oninput={(e)=>edit(tokenWire?tokenSourceId:id,'tokens',Number(e.currentTarget.value))}/>
  {#if area==='inspector'}
    <Button label={tokenWire?'Detach output limit source':'Show output limit as node'} variant="secondary" onclick={tokenWire?()=>disconnect('tokens'):exposeTokens}/>
  {/if}
  {#if area==='inspector' && (route==='coding'||sampling?.temperature!==undefined||sampling?.topP!==undefined)}
    <label for={prefix+'-temperature'}>Temperature</label>
    <Input id={prefix+'-temperature'} class="tori-field" type="number" min={0} max={1} step="any" placeholder="Provider default" value={sampling?.temperature??''} oninput={(e)=>edit(id,'temperature',numeric(e.currentTarget.value))}/>
    <label for={prefix+'-top-p'}>Top-p</label>
    <Input id={prefix+'-top-p'} class="tori-field" type="number" min={0} max={1} step="any" placeholder="Provider default" value={sampling?.topP??''} oninput={(e)=>edit(id,'topP',numeric(e.currentTarget.value))}/>
    <p class="muted">Leave blank to use the provider default.</p>
  {:else if area==='inspector'}
    <p class="muted">Sampling overrides are available on the Coding route.</p>
  {/if}
  {#if area==='inspector'}<p class="muted">Reasoning effort uses the provider default. This VICT activation contract cannot pin an override.</p>{/if}
{/if}

{#if area==='inspector' && id!==rootId}
  <div class="object-actions">
    {#if id===instructionId && !textWire}<Button label="Connect to Instructions" variant="secondary" onclick={()=>connect(id,'instructions')}/>{/if}
    {#if id===instructionId && textWire}<Button label="Detach instruction source" variant="secondary" onclick={()=>disconnect('instructions')}/>{/if}
    {#if id===tokenSourceId && !tokenWire}<Button label="Connect to output limit" variant="secondary" onclick={()=>connect(id,'tokens')}/>{/if}
    {#if id===modelNodeId && !modelWire}<Button label="Connect to Model" variant="secondary" onclick={()=>connect(id,'model')}/>{/if}
    {#if id===modelNodeId && modelWire}<Button label="Detach model reference" variant="secondary" onclick={()=>disconnect('model')}/>{/if}
    {#if resource}
      <Button label={binding(graph,id)?'Detach '+resource.label:'Connect '+resource.label} variant="secondary"
        onclick={()=>binding(graph,id)?disconnect(id):connect(id,id)}/>
    {/if}
    <Button label="Delete node" variant="danger" onclick={()=>remove(id)}/>
  </div>
{/if}
