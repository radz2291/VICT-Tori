<script lang="ts">
  import { Button, Select, StatusBadge, Feedback } from '@victframework/ui-svelte';
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import { binding, field, instructions, modelId, modelName, rootId, instructionId, modelNodeId, outputTokens, tokenSourceId, agentResources } from './assembly';
  import { childRef, childName, delegateGrant, childTask, childResult, taskLengthLimit, resultLengthLimit } from './delegation-fixture.mjs';
  let {graph,route,id,area,childRevisions=[],pinnedChild,edit,expose,exposeTokens,connect,disconnect,remove}=$props();
  let prefix=$derived(area+'-'+id);
  let name=$derived(String(field(graph,rootId,'name')??''));
  let textWire=$derived(binding(graph,'instructions'));
  let tokenWire=$derived(binding(graph,'tokens'));
  const numeric=(value:string)=>value===''?undefined:Number(value);
  let sampling=$derived(graph.nodes.find(n=>n.id===modelNodeId)?.values);
  let resource=$derived(agentResources.find(item=>item.id===id));
  const choices={
    context:[{value:'project-knowledge@1',label:'Project Knowledge r1'},{value:'reference@1',label:'Observatory reference · r1'},{value:'reference@2',label:'Observatory reference · r2'}],
    memory:[{value:'recent-10@1',label:'Last 10 messages'},{value:'recent-100@1',label:'Last 100 messages'}],
    output:[{value:'finding@1',label:'Finding JSON · r1'}],
    child:[{value:'reference-reviewer@1',label:'Reference reviewer · r1 (fixture)'}],
    tool:[{value:'local-reference@1',label:'Local observatory · read only'}],
  };
  let selectedChild=$derived(childRevisions.find(item=>'saved:'+item.id===field(graph,id,'reference')));
  let activeChild=$derived(childRevisions.find(item=>item.id===pinnedChild));
  let childChoices=$derived([...choices.child,...childRevisions.map(item=>({value:'saved:'+item.id,label:item.name+' · r'+item.number}))]);
  let modelWire=$derived(binding(graph,'model'));
  let governedMode=$derived(binding(graph,'child')?'Governed delegation fixture':
    binding(graph,'tool')?'Governed read-only MCP':'Conversation only');
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
    <p class="muted">Host deadline: 90 seconds. {binding(graph,'child')||binding(graph,'tool')?'One governed capability call allowed.':'Tool calls are disabled.'}</p>
    <dl><dt>Model binding</dt><dd>{modelWire ? modelName : 'Not connected'}</dd><dt>Draft runtime</dt><dd>{governedMode}</dd></dl>
  {/if}
{:else if id===instructionId}
  <label for={prefix+'-value'}>Text value</label>
  <Textarea id={prefix+'-value'} class="tori-field nodrag nowheel" rows={area==='node'?2:4} value={String(field(graph,id,'text')??'')} oninput={(e)=>edit(id,'text',e.currentTarget.value)}/>
{:else if resource}
  <label for={prefix+'-reference'}>{resource.label}</label>
  <div class="nodrag"><Select id={prefix+'-reference'} name="reference" value={String(field(graph,id,'reference'))} options={id==='child'?childChoices:choices[resource.id]} onChange={v=>edit(id,'reference',v)}/></div>
  {#if id==='child' && area==='inspector'}
    <h4>Delegation binding</h4>
    <StatusBadge value={binding(graph,'child')?'Connected · deterministic fixture':'Unconnected · deterministic fixture'}/>
    {#if selectedChild}
      <dl>
        <dt>Selected saved revision</dt><dd>{selectedChild.name} r{selectedChild.number}</dd>
        <dt>Active pin</dt><dd>{activeChild?activeChild.name+' r'+activeChild.number:'Activate to pin this revision.'}</dd>
        <dt>Selected revision scope</dt><dd>{selectedChild.context==='project-knowledge@1'?'Project Knowledge r1 on demand. ':selectedChild.context?'Pinned context on demand. ':''}{selectedChild.tool?'One governed read-only observatory call. ':'No tool calls. '}Further delegation is disabled.</dd>
        <dt>Required grant</dt><dd>{delegateGrant}</dd>
        <dt>Task</dt><dd>Review the supplied research task. Quellight can request the pinned context.</dd>
        <dt>Expected result</dt><dd>A short text finding of up to {resultLengthLimit} characters.</dd>
      </dl>
    {:else}
    <dl>
      <dt>Child reference</dt><dd>{childName} · r{childRef.revision}<br/>{childRef.id}</dd>
      <dt>Permitted scope</dt><dd>One read-only delegation. No child tool calls or further delegation.</dd>
      <dt>Required grant</dt><dd>{delegateGrant}</dd>
      <dt>Task</dt><dd>{childTask} Input is one nonblank task of up to {taskLengthLimit} characters.</dd>
      <dt>Expected fixture result</dt><dd>Text of up to {resultLengthLimit} characters. The fixture returns “{childResult}”</dd>
    </dl>
    <p class="muted">Activation pins this child profile. It is a built-in fixture with no direct Session or independent Studio definition.</p>
    {/if}
  {/if}
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
