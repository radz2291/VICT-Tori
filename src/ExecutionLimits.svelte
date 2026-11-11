<script lang="ts">
  import { Input } from '@victframework/ui-ai-svelte';
  import { binding, executionBounds, field, rootId } from './assembly';

  let {graph, edit, prefix, hostDeadlineMs, compact=false}=$props();
  let authoring=$derived(!!binding(graph,'authoring'));
  let governed=$derived(authoring?'Governed draft authoring':binding(graph,'child')?'Governed delegation fixture':
    binding(graph,'tool')?'Governed read-only MCP':undefined);
  const numeric=(value:string)=>value===''?undefined:Number(value);
</script>

<div class={compact?'node-inline-setting':'configure-setting'}>
  <label for={prefix+'-steps'}>Max model steps</label>
  <Input id={prefix+'-steps'} class="tori-field" type="number" min={executionBounds.minSteps} max={executionBounds.maxSteps} step={1}
    value={field(graph,rootId,'maxSteps')} oninput={event=>edit(rootId,'maxSteps',numeric(event.currentTarget.value))}/>
</div>
<div class={compact?'node-inline-setting':'configure-setting'}>
  <label for={prefix+'-retries'}>Max model retries</label>
  <Input id={prefix+'-retries'} class="tori-field" type="number" min={executionBounds.minRetries} max={executionBounds.maxRetries} step={1}
    value={field(graph,rootId,'maxRetries')} oninput={event=>edit(rootId,'maxRetries',numeric(event.currentTarget.value))}/>
</div>
<p class="muted execution-limit-note">
  Studio allows up to {executionBounds.maxSteps} steps and {executionBounds.maxRetries} retry.
  {#if hostDeadlineMs!==undefined}Host deadline {hostDeadlineMs/1000} s.{/if}
  {authoring?'One discovery and one instruction edit per turn.':governed?'One governed capability call allowed.':'Tool calls are disabled.'}
</p>
{#if !compact}<dl><dt>Draft runtime</dt><dd>{governed??'Conversation only'}</dd></dl>{/if}
