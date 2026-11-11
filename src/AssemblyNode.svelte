<script module lang="ts">
  export const promptWidths={min:240,max:320};
  export const promptHeights={min:79,expanded:224,max:360};
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Handle, NodeResizeControl, Position, useUpdateNodeInternals } from '@victframework/ui-flow-svelte';
  import { Button as ActionButton, Select } from '@victframework/ui-svelte';
  import { Button, Dialog } from '@victframework/ui-svelte/primitives';
  import { DropdownMenu } from '@victframework/ui-svelte/catalog/dropdown-menu';
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import { agentResources, binding, canWire, field, instructions, modelId, modelName, outputTokens, resourceChoices, tokenSourceId, optionalBindings, inlineAgentSettings, nodeVisibilityLabel } from './assembly';
  import ModelSampling from './ModelSampling.svelte';
  import ExecutionLimits from './ExecutionLimits.svelte';
  import AssemblyGlyph from './AssemblyGlyph.svelte';
  let {id,data,selected}=$props();
  let root=$derived(id==='agent');
  let prompt=$derived(id==='instructions');
  let menuTrigger=$state<HTMLButtonElement|null>(null);
  let renameOpen=$state(false);
  let labelDraft=$state('');
  let openingDelegation=false;
  let outputPort=$derived(id===tokenSourceId?'tokens':id);
  let outputTarget=$derived(id===tokenSourceId?'model':'agent');
  let outputLabel=$derived(data.graph.nodeTypes.find(type=>type.id===outputTarget)?.ports.find(port=>port.id===outputPort)?.label??data.defaultTitle);
  let outputConnected=$derived(binding(data.graph,outputPort)?.source===id);
  const acceptsOutput=(port:string)=>!!data.wireSource&&!binding(data.graph,port)&&canWire(data.wireSource,'value',id,port);
  function openRename(){
    labelDraft=root?String(field(data.graph,id,'name')??''):data.customTitle??'';
    renameOpen=true;
  }
  function saveLabel(event:SubmitEvent){
    event.preventDefault();
    if(data.fields.rename(id,labelDraft))renameOpen=false;
  }
  let resource=$derived(agentResources.find(item=>item.id===id));
  const updateHandles=useUpdateNodeInternals();
  let resourcePorts=$derived(root?agentResources.filter(item=>!['memory','output'].includes(item.id)&&data.canvasIds.has(item.id)):[]);
  let shownPrompt=$derived(textWire&&data.canvasIds.has('instructions'));
  let shownModel=$derived(modelWire&&data.canvasIds.has('model'));
  let tokenWire=$derived(binding(data.graph,'tokens'));
  let shownInteger=$derived(tokenWire&&data.canvasIds.has(tokenSourceId));
  let samplingOpen=$state(false);
  let executionOpen=$state(false);
  let stepLimit=$derived(field(data.graph,id,'maxSteps'));
  let retryLimit=$derived(field(data.graph,id,'maxRetries'));
  const modelChoices=[{value:modelId,label:modelName}];
  let modelWire=$derived(binding(data.graph,'model'));
  let textWire=$derived(binding(data.graph,'instructions'));
  let choices=$derived(resource?.id==='child'
    ? [...(data.fixture||field(data.graph,id,'reference')==='reference-reviewer@1'?resourceChoices.child:[]),...(data.fields.childRevisions??[]).map((revision:{id:string;name:string;number:number})=>({
      value:'saved:'+revision.id,label:revision.name+' · r'+revision.number
    }))]
    : resource?.id==='tool'?resourceChoices.tool.filter(option=>data.fixture||option.value!=='local-reference@1'||field(data.graph,id,'reference')===option.value)
    : resource?resourceChoices[resource.id]:[]);
  $effect(()=>{
    if(root){
      data.canvasIds;
      updateHandles(id);
    }
  });
</script>

<article class="graph-node" class:root class:selected data-kind={id}>
  <header>
    <span class="node-glyph" title={data.defaultTitle}><AssemblyGlyph kind={id}/></span>
    <strong class="node-card-title" title={data.title}>{data.title}</strong>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger bind:ref={menuTrigger} class="vict-btn vict-btn--quiet node-menu nodrag nopan"
        aria-label={'Actions for '+data.title} title="Node actions"><span aria-hidden="true">⋯</span></DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="menu-content" align="end" sideOffset={4}
          onCloseAutoFocus={event=>{
            if(renameOpen||openingDelegation)event.preventDefault();
            openingDelegation=false;
          }}>
          <DropdownMenu.Item class="menu-item" onSelect={openRename}>{root?"Rename agent":"Rename node"}</DropdownMenu.Item>
          <DropdownMenu.Item class="menu-item" onSelect={()=>data.fields.focus(id)}>Focus node</DropdownMenu.Item>
          {#if root}
            <DropdownMenu.Separator/>
            <DropdownMenu.Group>
              <DropdownMenu.GroupHeading>Optional nodes</DropdownMenu.GroupHeading>
              {#each optionalBindings as item (item.id)}
                {@const port=item.id===tokenSourceId?'tokens':item.id}
                {@const connected=binding(data.graph,port)?.source===item.id}
                {#if data.canvasIds.has(item.id)}
                  <DropdownMenu.Item class="menu-item" onSelect={()=>data.fields.hideOptionalNode(item.id)}>
                    {nodeVisibilityLabel(item.label,true,connected)}
                  </DropdownMenu.Item>
                {:else if data.graph.nodes.some(node=>node.id===item.id)}
                  <DropdownMenu.Item class="menu-item" onSelect={()=>data.fields.showOptionalNode(item.id)}>
                    {nodeVisibilityLabel(item.label,false,connected)}
                  </DropdownMenu.Item>
                {:else if item.id==='instructions'||item.id===tokenSourceId}
                  <DropdownMenu.Item class="menu-item" disabled={item.id===tokenSourceId&&!data.graph.nodes.some(node=>node.id==='model')}
                    onSelect={()=>data.fields.createAndConnectSettingNode(item.id)}>
                    Create and connect: {item.label}
                  </DropdownMenu.Item>
                {/if}
              {/each}
            </DropdownMenu.Group>
          {/if}
          {#if !root}
            <DropdownMenu.Separator/>
            {#if !outputConnected&&data.canvasIds.has(outputTarget)}
              <DropdownMenu.Item class="menu-item" onSelect={()=>data.fields.connect(id,outputPort)}>
                Connect to {outputLabel}
              </DropdownMenu.Item>
            {/if}
            {#if id==='child'}
              <DropdownMenu.Item class="menu-item" onSelect={()=>{openingDelegation=true;data.fields.inspectDelegation(menuTrigger);}}>
                Inspect delegation
              </DropdownMenu.Item>
            {/if}
            <DropdownMenu.Item class="menu-item" onSelect={()=>data.fields.remove(id)}>Delete node</DropdownMenu.Item>
          {/if}
          {#if prompt}
            <DropdownMenu.Item class="menu-item" onSelect={()=>data.fields.resizePrompt({width:data.promptSize.width===promptWidths.max?promptWidths.min:promptWidths.max})}>
              {data.promptSize.width===promptWidths.max?'Reset width':'Widen prompt'}
            </DropdownMenu.Item>
            {#if data.promptSize.width>promptWidths.min&&data.promptSize.width<promptWidths.max}
              <DropdownMenu.Item class="menu-item" onSelect={()=>data.fields.resizePrompt({width:promptWidths.min})}>Reset width</DropdownMenu.Item>
            {/if}
            <DropdownMenu.Item class="menu-item" onSelect={()=>data.fields.resizePrompt({height:data.promptSize.height===promptHeights.min?promptHeights.expanded:promptHeights.min})}>
              {data.promptSize.height===promptHeights.min?'Make prompt taller':'Reset height'}
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  </header>
  {#if root}
    {#snippet promptField()}
      {#if shownPrompt}
        {@render sourceLink(textWire.source,'System prompt')}
      {/if}
    {/snippet}
    {@render inputPort('instructions','Instructions','Text',promptField)}
    {#if !shownPrompt}
      <div class="node-prompt nodrag nopan nowheel">
        <label class="visually-hidden" for="canvas-agent-instructions">System instructions</label>
        <Textarea id="canvas-agent-instructions" class="tori-field" rows={2} value={instructions(data.graph)}
          oninput={event=>textWire?data.fields.edit(textWire.source,'text',event.currentTarget.value):data.fields.edit(id,'instructions',event.currentTarget.value)}/>
      </div>
    {/if}
    {#snippet modelField()}
      {#if shownModel}
        {@render sourceLink(modelWire.source,field(data.graph,modelWire.source,'model')?modelName:'Model reference')}
      {:else}
        <div class="node-port-control nodrag nopan">{@render modelPicker('canvas-agent-model',true)}</div>
      {/if}
    {/snippet}
    {@render inputPort('model','Model','Model reference',modelField)}
    {#if modelWire&&!shownModel}
      <div class="node-inline-fields nodrag nopan">
        <div class="node-inline-setting">
          <label for="canvas-agent-output-limit">Max output tokens</label>
          <Input id="canvas-agent-output-limit" class="tori-field" type="number" min={64} max={32768} step={1}
            value={outputTokens(data.graph)} oninput={event=>data.fields.edit(tokenWire?.source??'model','tokens',Number(event.currentTarget.value))}/>
        </div>
        {@render sampling()}
      </div>
    {/if}
    {#each inlineAgentSettings as setting (setting.id)}
      {@const linked=binding(data.graph,setting.id)}
      {#snippet settingField()}
        {#if linked&&data.canvasIds.has(setting.id)}
          {@render sourceLink(linked.source,setting.id==='memory'?'Memory Policy':'Output Contract')}
        {:else}
          <div class="node-port-control nodrag nopan">
            <label class="visually-hidden" for={'canvas-agent-'+setting.id}>{setting.label}</label>
            <Select id={'canvas-agent-'+setting.id} name={setting.id} value={linked?String(field(data.graph,setting.id,'reference')??''):'default'}
              options={setting.options}
              onChange={value=>value&&value!=='default'?data.fields.configure(setting.id,'reference',value):data.fields.disconnect(setting.id)}/>
          </div>
        {/if}
      {/snippet}
      {@render inputPort(setting.id,setting.label,'Reference',settingField)}
    {/each}
    {#each resourcePorts as item (item.id)}
      {@render inputPort(item.id,item.label,item.label+' reference')}
    {/each}
    <div class="node-inline-fields node-execution nodrag nopan">
      <Button.Root class="vict-btn vict-btn--quiet node-execution-trigger" aria-expanded={executionOpen}
        onclick={()=>executionOpen=!executionOpen}>
        <span>Execution <span aria-hidden="true">{executionOpen?'⌄':'›'}</span></span>
        <span class="muted">{stepLimit} {stepLimit===1?'step':'steps'} · {retryLimit} {retryLimit===1?'retry':'retries'}</span>
      </Button.Root>
      {#if executionOpen}
        <ExecutionLimits graph={data.graph} edit={data.fields.edit} prefix="canvas-agent" hostDeadlineMs={data.hostDeadlineMs} compact/>
      {/if}
    </div>
  {:else if id==='model'}
    <div class="node-editor">
      <div class="node-model-choice">
        <div class="nodrag nopan">{@render modelPicker('canvas-model',false)}</div>
        <Handle class={data.wireSource===id?'node-handle wire-start':'node-handle'} type="source" position={Position.Right} id="value" title="Model reference output"/>
      </div>
      <div class="node-limit-field" class:linked={!!tokenWire}>
        <Handle class={acceptsOutput('tokens')?'node-handle wire-target':'node-handle'} data-port="tokens" type="target" position={Position.Left} id="tokens" title="Output limit · Integer input" isConnectableStart={false}/>
        <label for="canvas-model-output-limit">Max output tokens</label>
        <Input id="canvas-model-output-limit" class="tori-field nodrag nopan" type="number" min={64} max={32768} step={1}
          value={outputTokens(data.graph)} readonly={!!shownInteger}
          oninput={event=>{if(!shownInteger)data.fields.edit(tokenWire?.source??id,'tokens',Number(event.currentTarget.value));}}/>
        {#if shownInteger}{@render sourceLink(tokenWire.source,'Integer')}{/if}
      </div>
      <div class="node-inline-fields nodrag nopan">{@render sampling()}</div>
    </div>
  {:else}
    <div class="node-port node-output">
      {#if id===tokenSourceId}
        <div class="node-port-control nodrag nopan">
          <label class="visually-hidden" for="canvas-integer-output-limit">Output limit Integer</label>
          <Input id="canvas-integer-output-limit" class="tori-field" type="number" min={64} max={32768} step={1}
            value={field(data.graph,id,'tokens')} oninput={event=>data.fields.edit(id,'tokens',Number(event.currentTarget.value))}/>
        </div>
      {:else if id==='instructions'}
        <div class="node-port-control nodrag nopan nowheel">
          <label class="visually-hidden" for="canvas-system-prompt">System prompt</label>
          <Textarea id="canvas-system-prompt" class="tori-field" rows={2} value={String(field(data.graph,id,'text')??'')}
            oninput={event=>data.fields.edit(id,'text',event.currentTarget.value)}/>
        </div>
      {:else if choices.length>1}
        <div class="node-port-control nodrag nopan">
          <label class="visually-hidden" for={'canvas-'+id+'-reference'}>{data.title} revision</label>
          <Select id={'canvas-'+id+'-reference'} name={id} value={String(field(data.graph,id,'reference')??'')}
            options={choices} onChange={value=>data.fields.edit(id,'reference',value)}/>
        </div>
      {:else}
        {@const reference=String(field(data.graph,id,'reference')??'')}
        {@const label=choices.find(choice=>choice.value===reference)?.label??data.preview}
        <span class="node-preview" title={label}>{label}</span>
      {/if}
      <Handle class={data.wireSource===id?'node-handle wire-start':'node-handle'} type="source" position={Position.Right} id="value" title={data.title+' output'}/>
    </div>
    {#if data.activePin}
      <div class="node-pin node-detail">Active pin · {data.activePin.name} · r{data.activePin.number}</div>
    {/if}
  {/if}
  {#if prompt&&selected&&!data.mobile}
    <NodeResizeControl position="bottom-right" autoScale={false}
      class="prompt-resize" minWidth={promptWidths.min} maxWidth={promptWidths.max}
      minHeight={promptHeights.min} maxHeight={promptHeights.max}
      title="Resize prompt" aria-hidden="true" onResizeEnd={(_event,{width,height})=>data.fields.resizePrompt({width,height})}/>
  {/if}
</article>

<Dialog.Root bind:open={renameOpen}>
  <Dialog.Portal>
    <Dialog.Overlay class="sheet-shade studio-dialog-shade"/>
    <Dialog.Content class="mobile-sheet studio-dialog"
      onCloseAutoFocus={event=>{if(menuTrigger?.isConnected){event.preventDefault();menuTrigger.focus({preventScroll:true});}}}>
      <Dialog.Title>{root?'Rename agent':'Rename node'}</Dialog.Title>
      <Dialog.Description class={root?'visually-hidden':undefined}>{root?'Change the name of this agent definition.':'Give this card a name for the canvas. Leave it blank to use its default name.'}</Dialog.Description>
      <form onsubmit={saveLabel}>
        <label for={'canvas-'+id+'-label'}>{root?'Agent name':'Node name'}</label>
        <Input id={'canvas-'+id+'-label'} class="tori-field" placeholder={root?'Untitled agent':data.defaultTitle}
          value={labelDraft} oninput={event=>labelDraft=event.currentTarget.value}/>
        <div class="launch-actions">
          <Dialog.Close class="vict-btn vict-btn--quiet" type="button">Cancel</Dialog.Close>
          <ActionButton label="Apply" type="submit" variant="secondary"/>
        </div>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

{#snippet modelPicker(controlId:string,attach:boolean)}
  <label class="visually-hidden" for={controlId}>Cloud model</label>
  <Select id={controlId} name="model" value={attach&&!modelWire?'':String(field(data.graph,'model','model')??'')} options={modelChoices}
    onChange={value=>{
      if(attach){if(value)data.fields.configure('model','model',value);else data.fields.disconnect('model');}
      else data.fields.edit(id,'model',value);
    }}/>
{/snippet}

{#snippet sampling()}
  <Button.Root class="vict-btn vict-btn--quiet node-sampling" aria-expanded={samplingOpen}
    onclick={()=>samplingOpen=!samplingOpen}>Sampling <span aria-hidden="true">{samplingOpen?'⌄':'›'}</span></Button.Root>
  {#if samplingOpen}
    <ModelSampling graph={data.graph} route={data.route} edit={data.fields.edit} prefix={'canvas-'+id} compact/>
  {/if}
{/snippet}

{#snippet sourceLink(source:string,label:string)}
  <Button.Root class="vict-btn vict-btn--quiet node-source nodrag nopan" title={'Open '+label+' node'}
    onclick={event=>{
      // Keep the containing node's click handler from reselecting it.
      event.stopPropagation();
      void data.fields.focus(source);
    }}>{label} ↗</Button.Root>
{/snippet}

{#snippet inputPort(port:string,label:string,type:string,control?:Snippet)}
  {@const linked=!!binding(data.graph,port)}
  <div class="node-port input-port" class:linked data-port={port}>
    {#if data.canvasIds.has(port)}
      <Handle class={acceptsOutput(port)?'node-handle wire-target':'node-handle'} type="target" position={Position.Left} id={port} title={label+' · '+type+' input'} isConnectableStart={false}/>
    {/if}
    <span>{label}</span>
    {@render control?.()}
    {#if linked}<span class="visually-hidden">Connected</span>{/if}
  </div>
{/snippet}
