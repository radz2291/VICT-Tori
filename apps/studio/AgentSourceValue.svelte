<script>
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import Choice from './Choice.svelte';
  import { fixtureResources, workspaceContexts } from './agent-configuration.js';

  let { input, value, change, settings, agents, draft, label } = $props();
  const capabilityKinds = { model: 'Model', skill: 'Skill', tool: 'Tool' };
  const options = pairs => pairs.map(([value, label]) => ({ value, label }));
  const policies = {
    memory: [['Current session', 'Current session'], ['Synthetic project', 'Synthetic project']],
    policy: [['Read only', 'Read only'], ['Review required', 'Review required']],
    processor: [['source-review', 'Source review'], ['structured-output', 'Structured output']],
    workspaceContext: Object.entries(workspaceContexts).map(([id, context]) => [id, context.label]),
  };
  let choices = $derived.by(() => {
    const key = input.id;
    const kind = capabilityKinds[key];
    let available = options(fixtureResources[key] ?? policies[key] ?? []);
    if (kind) available = [...available, ...settings.capabilities.filter(item => item.enabled && item.kind === kind)
      .map(item => ({ value: item.id, label: item.name }))];
    if (key === 'mode') available = settings.modes.filter(item => item.enabled).map(item => ({ value: item.id, label: item.name }));
    if (key === 'specialist') available = [...available, ...agents.map(item => ({ value: item.id, label: item.label }))];
    if (value && !available.some(item => item.value === value)) available.push({ value, label: 'Unavailable · ' + value });
    return [{ value: 'unconfigured', label: 'Unconfigured' }, ...available];
  });
</script>

<div class="nodrag nopan nowheel">
  {#if input.source === 'text'}
    <Textarea aria-label={label} class="studio-field" placeholder="Enter text" value={value ?? ''}
      onfocus={() => draft.beginEdit()} onblur={() => draft.endEdit()} oninput={event => change(event.currentTarget.value)}/>
  {:else if input.source === 'number'}
    <Input aria-label={label} class="studio-field" type="number" value={value ?? ''}
      onfocus={() => draft.beginEdit()} onblur={() => draft.endEdit()} oninput={event => change(event.currentTarget.value)}/>
  {:else}
    <Choice {label} value={value || 'unconfigured'} options={choices} change={next => change(next === 'unconfigured' ? '' : next)}/>
  {/if}
</div>
