<script lang="ts">
  import { Input } from '@victframework/ui-ai-svelte';
  import { executionBounds, workspaceBinding } from '../packages/authoring/index.mjs';
  import { hostDeadlineBounds, validHostDeadline } from '../packages/authoring/host-deadline.mjs';
  import { Feedback } from '@victframework/ui-svelte';
  import { binding, executionSettings, field, rootId } from './assembly';

  let {graph, edit, prefix, compact=false}=$props();
  let authoring=$derived(binding(graph,'authoring')&&field(graph,'authoring','reference'));
  let runtime=$derived(authoring===workspaceBinding?'Workspace authoring':authoring?'Draft instruction authoring':
    binding(graph,'child')?'Governed delegation':binding(graph,'tool')?'Governed read-only tool':'Conversation only');
  let limits=$derived(executionSettings(graph));
  const numeric=(value:string)=>value===''?undefined:Number(value);
  const parseDeadline=(value:string)=>{
    if(value==='')return 0;
    const scaled=Number(value)*1000, nearest=Math.round(scaled);
    return Math.abs(scaled-nearest)<=Number.EPSILON*Math.max(1,Math.abs(scaled))?nearest:scaled;
  };
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
</p>
<div class={compact?'node-inline-setting':'configure-setting'}>
  <label for={prefix+'-host-deadline'}>Host deadline (seconds)</label>
  <Input id={prefix+'-host-deadline'} class="tori-field" type="number" min={hostDeadlineBounds.min/1000}
    max={hostDeadlineBounds.max/1000} step={0.001} value={limits.hostDeadlineMs===0?'':limits.hostDeadlineMs/1000}
    aria-invalid={!validHostDeadline(limits.hostDeadlineMs)}
    oninput={event=>edit(rootId,'hostDeadlineMs',parseDeadline(event.currentTarget.value))}/>
  {#if !validHostDeadline(limits.hostDeadlineMs)}<Feedback kind="error" message="Enter a deadline from 1 to 120 seconds." />{/if}
</div>
{#if !compact}<dl><dt>Draft runtime</dt><dd>{runtime}</dd></dl>{/if}
