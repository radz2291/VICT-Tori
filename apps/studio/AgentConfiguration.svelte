<script>
  import Choice from './Choice.svelte';
  import { fixtureResources } from './agent-configuration.js';

  let { state, change, settings, agents, agentId, prefix = '' } = $props();
  const unconfigured = { value: 'unconfigured', label: 'Unconfigured' };
  const options = pairs => pairs.map(([value, label]) => ({ value, label }));
  const capabilityKinds = { model: 'Model', skill: 'Skill', tool: 'Tool' };
  let fields = $derived([
    ...['model', 'skill', 'tool'].map(key => ({
      key, label: capabilityKinds[key], values: [
        ...options(fixtureResources[key]),
        ...settings.capabilities.filter(item => item.enabled && item.kind === capabilityKinds[key])
          .map(item => ({ value: item.id, label: item.name })),
      ],
    })),
    { key: 'mode', label: 'Mode', values: settings.modes.filter(item => item.enabled).map(item => ({ value: item.id, label: item.name })) },
    { key: 'memory', label: 'Memory', values: options(['Current session', 'Synthetic project'].map(value => [value, value])) },
    { key: 'policy', label: 'Policy', values: options(['Read only', 'Review required'].map(value => [value, value])) },
    { key: 'specialist', label: 'Delegated specialist', values: [
      ...options(fixtureResources.specialist),
      ...agents.filter(agent => agent.id !== agentId).map(agent => ({ value: agent.id, label: agent.label })),
    ] },
  ]);

  function choices(field) {
    const current = state[field.key];
    return [unconfigured, ...field.values, ...(current && !field.values.some(option => option.value === current)
      ? [{ value: current, label: 'Unavailable · ' + current }] : [])];
  }
</script>

<div class="fields">
  {#each fields as field (field.key)}
    <div>
      <span>{field.label}</span>
      <Choice label={prefix + field.label} value={state[field.key] || 'unconfigured'} options={choices(field)}
        change={value => change(field.key, value === 'unconfigured' ? '' : value)}/>
    </div>
  {/each}
</div>

<style>
  .fields { display: grid; gap: 4px; margin-top: 8px; }
  .fields > div { display: grid; grid-template-columns: 1fr minmax(0, 1fr); align-items: center; gap: 6px; }
  span { color: var(--vict-color-muted); font-size: 12px; }
</style>
