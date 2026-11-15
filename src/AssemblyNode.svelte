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
  import { agentResources, binding, canWire, executionSettings, field, instructions, modelId, modelName, outputTokens, resourceChoices, tokenSourceId, optionalBindings, inlineAgentSettings, nodeVisibilityLabel } from './assembly';
  import SavedMemoryPolicy from './SavedMemoryPolicy.svelte';
  import ModelSampling from './ModelSampling.svelte';
  import ExecutionLimits from './ExecutionLimits.svelte';
  import DirectiveFields from './DirectiveFields.svelte';
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
  let tokenWire=$derived(binding(data.graph,'tokens'));
  let samplingOpen=$state(false);
  let executionOpen=$state(false);
  let directiveOpen=$state(false);
  let execution=$derived(executionSettings(data.graph));
  const modelChoices=[{value:modelId,label:modelName}];
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
      {#if textWire}
        <Button.Root class="vict-btn vict-btn--quiet nodrag nopan" onclick={event=>{event.stopPropagation();void data.fields.showAndFocus(textWire.source);}}>Show System prompt</Button.Root>
      {/if}
    {/snippet}
    {@render inputPort('instructions','Instructions','Text',promptField)}
    {#if !textWire}
      <div class="node-prompt nodrag nopan nowheel">
        <label class="visually-hidden" for="canvas-agent-instructions">System instructions</label>
        <Textarea id="canvas-agent-instructions" class="tori-field" rows={2} value={instructions(data.graph)}
          oninput={event=>data.fields.edit(id,'instructions',event.currentTarget.value)}/>
      </div>
    {/if}
    {#snippet modelField()}
      {#if data.graph.nodes.some(node=>node.id==='model')}
        <Button.Root class="vict-btn vict-btn--quiet nodrag nopan" onclick={event=>{event.stopPropagation();void data.fields.showAndFocus('model');}}>Show Model Reference</Button.Root>
      {:else}
        <Button.Root class="vict-btn vict-btn--quiet nodrag nopan" onclick={event=>{event.stopPropagation();data.fields.createSetting('model');}}>Add Model Reference</Button.Root>
      {/if}
    {/snippet}
    {@render inputPort('model','Model','Model reference',modelField)}
    {#each inlineAgentSettings as setting (setting.id)}
      {#snippet settingField()}
        {#if data.graph.nodes.some(node=>node.id===setting.id)}
          <Button.Root class="vict-btn vict-btn--quiet nodrag nopan" onclick={event=>{event.stopPropagation();void data.fields.showAndFocus(setting.id);}}>
            Show {setting.id==='memory'?'Memory Policy':'Output Contract'}
          </Button.Root>
        {:else}
          <Button.Root class="vict-btn vict-btn--quiet nodrag nopan" onclick={event=>{event.stopPropagation();data.fields.createSetting(setting.id);}}>
            Add {setting.id==='memory'?'Memory Policy':'Output Contract'}
          </Button.Root>
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
        <span class="muted">{execution.maxSteps} {execution.maxSteps===1?'step':'steps'} · {execution.maxToolCalls} {execution.maxToolCalls===1?'call':'calls'}</span>
      </Button.Root>
      {#if executionOpen}
        <ExecutionLimits graph={data.graph} edit={data.fields.edit} prefix="canvas-agent" hostDeadlineMs={data.hostDeadlineMs} compact/>
      {/if}
    </div>
  {:else if id==='model'}
    <div class="node-editor">
      <div class="node-model-choice">
        <div class="nodrag nopan">
          <label class="visually-hidden" for="canvas-model">Cloud model</label>
          <Select id="canvas-model" name="model" value={String(field(data.graph,id,'model')??'')} options={modelChoices}
            onChange={value=>data.fields.edit(id,'model',value)}/>
        </div>
        <Handle class={data.wireSource===id?'node-handle wire-start':'node-handle'} type="source" position={Position.Right} id="value" title="Model reference output"/>
      </div>
      <div class="node-limit-field" class:linked={!!tokenWire}>
        <Handle class={acceptsOutput('tokens')?'node-handle wire-target':'node-handle'} data-port="tokens" type="target" position={Position.Left} id="tokens" title="Output limit · Integer input" isConnectableStart={false}/>
        <label for="canvas-model-output-limit">Max output tokens</label>
        <Input id="canvas-model-output-limit" class="tori-field nodrag nopan" type="number" min={64} max={32768} step={1}
          value={outputTokens(data.graph)} readonly={!!tokenWire}
          oninput={event=>{if(!tokenWire)data.fields.edit(id,'tokens',Number(event.currentTarget.value));}}/>
        {#if tokenWire}<Button.Root class="vict-btn vict-btn--quiet nodrag nopan" onclick={event=>{event.stopPropagation();void data.fields.showAndFocus(tokenWire.source);}}>Show Integer</Button.Root>{/if}
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
      {:else if id==='directive'}
        <span class="node-preview" title={data.preview}>{data.preview}</span>
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
    {#if id==='directive'}
      <div class="node-inline-fields nodrag nopan nowheel">
        <Button.Root class="vict-btn vict-btn--quiet" aria-expanded={directiveOpen} onclick={()=>directiveOpen=!directiveOpen}>Directive parameters</Button.Root>
        {#if directiveOpen}
          <section class="node-directive-parameters" aria-label="Directive parameters">
            <DirectiveFields graph={data.graph} prefix="canvas-directive" edit={data.fields.edit} configure={data.fields.configure}
              disconnect={data.fields.disconnect} active={data.pinnedDirective}/>
          </section>
        {/if}
      </div>
    {:else if id==='memory'}
      <div class="node-inline-fields nodrag nopan">
        <SavedMemoryPolicy id="canvas-memory-saved-memory" value={String(field(data.graph,'memory','savedMemory')??'off')}
          set={value=>data.fields.edit('memory','savedMemory',value)}/>
      </div>
    {/if}
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

{#snippet sampling()}
  <Button.Root class="vict-btn vict-btn--quiet node-sampling" aria-expanded={samplingOpen}
    onclick={()=>samplingOpen=!samplingOpen}>Sampling <span aria-hidden="true">{samplingOpen?'⌄':'›'}</span></Button.Root>
  {#if samplingOpen}
    <ModelSampling graph={data.graph} route={data.route} edit={data.fields.edit} prefix={'canvas-'+id} compact/>
  {/if}
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
