<script lang="ts">
  import { Input } from '@victframework/ui-ai-svelte';
  import { executionBounds, workspaceBinding } from '../packages/authoring/index.mjs';
  import { binding, executionSettings, field, rootId } from './assembly';

  let {graph, edit, prefix, hostDeadlineMs, compact=false}=$props();
  let authoring=$derived(binding(graph,'authoring')&&field(graph,'authoring','reference'));
  let runtime=$derived(authoring===workspaceBinding?'Workspace authoring':authoring?'Draft instruction authoring':
    binding(graph,'child')?'Governed delegation':binding(graph,'tool')?'Governed read-only tool':'Conversation only');
  let limits=$derived(executionSettings(graph));
  const numeric=(value:string)=>value===''?undefined:Number(value);
</script>

<div class={compact?'node-inline-setting':'configure-setting'}>
  <label for={prefix+'-steps'}>Max model steps</label>
  <Input id={prefix+'-steps'} class="tori-field" type="number" min={executionBounds.maxSteps.min} max={executionBounds.maxSteps.max} step={1}
    value={limits.maxSteps} oninput={event=>edit(rootId,'maxSteps',numeric(event.currentTarget.value))}/>
</div>
<div class={compact?'node-inline-setting':'configure-setting'}>
  <label for={prefix+'-tool-calls'}>Max tool calls</label>
  <Input id={prefix+'-tool-calls'} class="tori-field" type="number" min={executionBounds.maxToolCalls.min} max={executionBounds.maxToolCalls.max} step={1}
    value={limits.authoredToolCalls??''} placeholder={String(limits.defaultToolCalls)} aria-describedby={prefix+'-execution-limits'}
    oninput={event=>edit(rootId,'maxToolCalls',numeric(event.currentTarget.value))}/>
</div>
<div class={compact?'node-inline-setting':'configure-setting'}>
  <label for={prefix+'-retries'}>Max model retries</label>
  <Input id={prefix+'-retries'} class="tori-field" type="number" min={executionBounds.maxRetries.min} max={executionBounds.maxRetries.max} step={1}
    value={limits.maxRetries} oninput={event=>edit(rootId,'maxRetries',numeric(event.currentTarget.value))}/>
</div>
<p id={prefix+'-execution-limits'} class="muted execution-limit-note">
  VICT allows up to {executionBounds.maxSteps.max} steps, {executionBounds.maxToolCalls.max} tool calls and {executionBounds.maxRetries.max} retries.
  Leave tool calls blank to use {limits.defaultToolCalls}. Set 0 to disable calls.
  {#if hostDeadlineMs!==undefined}Host deadline: {hostDeadlineMs/1000} s.{/if}
</p>
{#if !compact}<dl><dt>Draft runtime</dt><dd>{runtime}</dd></dl>{/if}
