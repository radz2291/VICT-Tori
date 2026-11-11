<script lang="ts">
  import { Button, Select, StatusBadge } from '@victframework/ui-svelte';
  import { Button as ControlButton } from '@victframework/ui-svelte/primitives';
  import { DropdownMenu } from '@victframework/ui-svelte/catalog/dropdown-menu';
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import { binding, field, instructions, modelId, modelName, rootId, instructionId, modelNodeId, tokenSourceId, agentResources, resourceChoices as choices, inlineAgentSettings } from './assembly';
  import ModelSampling from './ModelSampling.svelte';
  import ExecutionLimits from './ExecutionLimits.svelte';
  import { childRef, childName, delegateGrant, childTask, childResult, taskLengthLimit, resultLengthLimit } from './delegation-fixture.mjs';
  let {graph,route,id,location='',childRevisions=[],pinnedChild,edit,disconnect,reveal,
    openDefinition,canOpenDefinition,fixture,configure,section,hostDeadlineMs}=$props();
  let base=$derived(location?location+'-settings':'settings');
  let prefix=$derived(base+'-'+id);
  let name=$derived(String(field(graph,rootId,'name')??''));
  let textWire=$derived(binding(graph,'instructions'));
  let tokenWire=$derived(binding(graph,'tokens'));
  let resource=$derived(agentResources.find(item=>item.id===id));
  let selectedChild=$derived(childRevisions.find(item=>'saved:'+item.id===field(graph,id,'reference')));
  let activeChild=$derived(childRevisions.find(item=>item.id===pinnedChild));
  let childChoices=$derived([...choices.child,...childRevisions.map(item=>({value:'saved:'+item.id,label:item.name+' · r'+item.number}))]);
  let modelWire=$derived(binding(graph,'model'));
  let existingCapabilities=$derived(agentResources.filter(item=>['context','tool','child'].includes(item.id)&&binding(graph,item.id)));
  let availableCapabilities=$derived(agentResources
    .filter(item=>['context','tool','child'].includes(item.id)&&!existingCapabilities.includes(item)&&(fixture||item.id==='context'))
    .map(item=>({value:item.id,label:item.label})));
</script>

{#if section==='configure' && id===rootId}
  <h2 class="configure-heading">Definition</h2>
  <div class="configure-group">
    <div class="configure-identity">
      <div>
        <label for={prefix+'-name'}>Agent name</label>
        <Input id={prefix+'-name'} class="tori-field" value={name} oninput={(e)=>edit(rootId,'name',e.currentTarget.value)}/>
      </div>
      <div>
        <label for={base+'-model'}>Model</label>
        <Select id={base+'-model'} name="model" value={modelWire?String(field(graph,modelNodeId,'model')??''):''}
          options={[{value:modelId,label:modelName}]} onChange={value=>value?configure(modelNodeId,'model',value):disconnect('model')}/>
      </div>
    </div>
    <label for={prefix+'-text'}>System instructions</label>
    <Textarea id={prefix+'-text'} class="tori-field" rows={4} value={instructions(graph)} oninput={(e)=>textWire?edit(instructionId,'text',e.currentTarget.value):edit(rootId,'instructions',e.currentTarget.value)}/>
  </div>
  <section class="agent-capabilities" aria-label="Capabilities">
    <h2 class="configure-heading">Capabilities</h2>
    <div class="configure-group configure-capability-grid">
      {#each existingCapabilities as capability}
        {@const reference=field(graph,capability.id,'reference')}
        {@const label=(capability.id==='child'?childChoices:choices[capability.id]).find(option=>option.value===reference)?.label}
        <div class="configure-capability">
          <div><span>{capability.label}</span>{#if label}<small>{label}</small>{/if}</div>
          <ControlButton.Root class="vict-btn vict-btn--quiet" aria-label={'Edit '+capability.label}
            onclick={()=>reveal(capability.id)}>Edit</ControlButton.Root>
        </div>
      {/each}
      {#if availableCapabilities.length}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="vict-btn vict-btn--secondary configure-capability configure-add-tile" aria-label="Add capability" title="Add capability">
            <span aria-hidden="true">+</span>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content class="menu-content" align="start">
              {#each availableCapabilities as option (option.value)}
                <DropdownMenu.Item class="menu-item" onSelect={()=>{if(configure(option.value,'',''))void reveal(option.value);}}>
                  {option.label}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      {:else}
        <ControlButton.Root class="vict-btn vict-btn--secondary configure-capability configure-add-tile" aria-label="Add capability · Coming soon" disabled>
          <span aria-hidden="true">+</span>
          <small>Coming soon</small>
        </ControlButton.Root>
      {/if}
    </div>
  </section>
  <section aria-label="Advanced settings">
    <h2 class="configure-heading">Advanced</h2>
    <div class="configure-group configure-advanced-fields">
      {@render generationFields()}
      <ExecutionLimits {graph} {edit} {prefix} {hostDeadlineMs}/>
    </div>
  </section>
{:else if section==='configure' && id===instructionId}
  <label for={prefix+'-text'}>Instruction source</label>
  <Textarea id={prefix+'-text'} class="tori-field" rows={4} value={String(field(graph,id,'text')??'')}
    oninput={event=>edit(id,'text',event.currentTarget.value)}/>
{:else if section==='configure' && id===modelNodeId}
  <label for={prefix+'-reference'}>Model</label>
  <Select id={prefix+'-reference'} name="model" value={String(field(graph,id,'model')??'')}
    options={[{value:modelId,label:modelName}]} onChange={value=>edit(id,'model',value||undefined)}/>
  {@render outputLimit(tokenWire?tokenSourceId:modelNodeId)}
  <ModelSampling {graph} {route} {edit} {prefix}/>
{:else if section==='configure' && id===tokenSourceId}
  {@render outputLimit(tokenSourceId)}
{:else if section==='configure' && resource}
  <div class="configure-setting">
    <label for={prefix+'-reference'}>{id==='context'?'Source revision':resource.label}</label>
    <Select id={prefix+'-reference'} name="reference" value={String(field(graph,id,'reference'))} options={id==='child'?childChoices:choices[resource.id]} onChange={v=>edit(id,'reference',v)}/>
  </div>
  {#if id==='child'}{@render delegationDetails()}{/if}
  {#if binding(graph,id)}
    <div class="configure-remove">
      <Button label={id==='context'?'Remove source':'Remove capability'} variant="secondary"
        onclick={()=>{disconnect(id);void reveal(rootId);}}/>
    </div>
  {/if}
{:else if section==='delegation'}
  {@render delegationDetails()}
{/if}

{#snippet delegationDetails()}
  <div class="delegation-details">
    <StatusBadge value={binding(graph,'child')?'Connected · deterministic fixture':'Unconnected · deterministic fixture'}/>
    <dl class="delegation-facts">
      {#if selectedChild}
        <dt>Selected revision</dt><dd>{selectedChild.name} r{selectedChild.number}</dd>
        <dt>Active pin</dt><dd>{activeChild?activeChild.name+' r'+activeChild.number:'Activate to pin this revision.'}</dd>
        <dt>Permitted scope</dt><dd>{selectedChild.context==='project-knowledge@1'?'Project Knowledge r1 on demand. ':selectedChild.context?'Pinned context on demand. ':''}{selectedChild.tool?'One governed read-only observatory call. ':'No tool calls. '}Further delegation is disabled.</dd>
        <dt>Task</dt><dd>Review the supplied research task.</dd>
        <dt>Expected result</dt><dd>A short text finding of up to {resultLengthLimit} characters.</dd>
      {:else}
        <dt>Child reference</dt><dd>{childName} · r{childRef.revision}</dd>
        <dt>Permitted scope</dt><dd>One read-only delegation. No child tool calls or further delegation.</dd>
        <dt>Task</dt><dd>{childTask} Input is one nonblank task of up to {taskLengthLimit} characters.</dd>
        <dt>Expected fixture result</dt><dd>{childResult}</dd>
      {/if}
    </dl>
    <section class="delegation-technical" aria-label="Technical details">
      <h3>Technical details</h3>
      <dl class="delegation-facts">
        <dt>Required grant</dt><dd><code>{delegateGrant}</code></dd>
        {#if !selectedChild}
          <dt>Child ID</dt><dd><code>{childRef.id}</code></dd>
        {/if}
      </dl>
    </section>
    {#if selectedChild}
      <div class="delegation-actions">
        <Button label={'Open '+selectedChild.name+' definition'} variant="secondary" disabled={!canOpenDefinition}
          onclick={()=>openDefinition(selectedChild.definition)}/>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet generationFields()}
  {#if modelWire}
    {@render outputLimit(tokenWire?tokenSourceId:modelNodeId)}
    <ModelSampling {graph} {route} {edit} prefix={base+'-model'}/>
  {/if}
  {#each inlineAgentSettings as setting}
    <div class="configure-setting">
      <label for={base+'-'+setting.id}>{setting.label}</label>
      <Select id={base+'-'+setting.id} name={setting.id}
        value={binding(graph,setting.id)?String(field(graph,setting.id,'reference')):'default'}
        options={setting.options} onChange={value=>value&&value!=='default'?configure(setting.id,'reference',value):disconnect(setting.id)}/>
    </div>
  {/each}
{/snippet}

{#snippet outputLimit(nodeId:string)}
  <div class="configure-setting">
    <label for={base+'-output-limit'}>Max output tokens</label>
    <Input id={base+'-output-limit'} class="tori-field" type="number" min={64} max={32768}
      value={Number(field(graph,nodeId,'tokens')??4096)} oninput={event=>edit(nodeId,'tokens',Number(event.currentTarget.value))}/>
  </div>
{/snippet}
