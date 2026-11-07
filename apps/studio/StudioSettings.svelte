<script>
  import { Dialog } from '@victframework/ui-svelte/catalog/dialog';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Feedback } from '@victframework/ui-svelte';
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import Choice from './Choice.svelte';

  let { open = $bindable(), workspace } = $props();
  const groups = [
    { value: 'capabilities', label: 'Providers, Skills and tools' },
    { value: 'modes', label: 'Modes' },
    { value: 'evaluations', label: 'Evaluation cases' },
  ];
  const kinds = ['Provider', 'Model', 'Skill', 'Tool'].map(value => ({ value, label: value }));
  let group = $state('capabilities');
  let id = $state('');
  let name = $state('');
  let notes = $state('');
  let kind = $state('Provider');
  let result = $state('');
  let entries = $derived(workspace.data.settings[group]);
  let selected = $derived(entries.find(item => item.id === id));

  function edit(item) {
    id = item?.id ?? '';
    name = item?.name ?? '';
    notes = item?.notes ?? '';
    kind = item?.kind ?? 'Provider';
    result = '';
  }

  function save(event) {
    event.preventDefault();
    if (!name.trim()) return;
    const saved = workspace.update(state => {
      const items = state.settings[group];
      const existing = items.find(item => item.id === id);
      const value = { id: existing?.id ?? crypto.randomUUID(), name: name.trim(), notes: notes.trim(), enabled: existing?.enabled ?? true };
      if (group === 'capabilities') value.kind = kind;
      if (existing) Object.assign(existing, value);
      else items.push(value);
      return value.id;
    });
    if (saved) id = saved;
  }

  function changeEnabled(item) {
    workspace.update(state => {
      const current = state.settings[group].find(entry => entry.id === item.id);
      if (current) current.enabled = !current.enabled;
    });
  }

  function remove() {
    if (workspace.update(state => {
      state.settings[group] = state.settings[group].filter(item => item.id !== id);
      return true;
    })) edit();
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Overlay/>
  <Dialog.Content class="settings-dialog">
    <Dialog.Title>Studio settings</Dialog.Title>
    <Dialog.Description>Configuration saves locally. Provider tests and evaluation results use U0 simulations. Enter synthetic details only.</Dialog.Description>
    <Choice label="Settings area" value={group} options={groups} change={value => { group = value; edit(); }}/>
    <div class="entries">
      <Button.Root class="action" onclick={() => edit()}>New entry</Button.Root>
      {#each entries as item (item.id)}
        <Button.Root class="action" aria-pressed={id === item.id} onclick={() => edit(item)}>{item.name}{item.kind ? ' · ' + item.kind : ''}{item.enabled ? '' : ' · Disabled'}</Button.Root>
      {/each}
    </div>
    <form onsubmit={save}>
      {#if group === 'capabilities'}<Choice label="Capability type" value={kind} options={kinds} change={value => kind = value}/>{/if}
      <label for="settings-name">Name</label>
      <Input id="settings-name" class="studio-field" bind:value={name}/>
      <label for="settings-notes">{group === 'evaluations' ? 'Case and expected result' : 'Synthetic configuration notes'}</label>
      <Textarea id="settings-notes" class="studio-field" bind:value={notes}/>
      <div class="entries">
        <Button.Root class="action primary" type="submit" disabled={!name.trim()}>Save configuration</Button.Root>
        {#if selected}
          <Button.Root class="action" onclick={() => changeEnabled(selected)}>{selected.enabled ? 'Disable' : 'Enable'}</Button.Root>
          <Button.Root class="action" onclick={remove}>Delete entry</Button.Root>
          {#if group !== 'modes'}
            <Button.Root class="action" disabled={!selected.enabled}
              onclick={() => {
                const sample = group === 'evaluations'
                  ? 'Simulated evaluation: expected-result comparison unavailable. Sample result only.'
                  : 'Simulated availability check: no external connection was attempted.';
                if (workspace.update(state => {
                  const entry = state.settings[group].find(record => record.id === selected.id);
                  if (!entry) return false;
                  entry.result = { origin: 'simulation', text: sample };
                  return true;
                })) result = sample;
              }}>{group === 'evaluations' ? 'Simulate evaluation' : 'Simulate availability check'}</Button.Root>
          {/if}
        {/if}
      </div>
    </form>
    {#if workspace.error}<Feedback kind="error" message={workspace.error}/>{/if}
    {#if result || entries.find(item => item.id === id)?.result}<Feedback message={result || entries.find(item => item.id === id).result.text}/>{/if}
    <Dialog.Close>Close settings</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>

<style>
  :global(.settings-dialog) { max-height: 90dvh; overflow: auto; }
  .entries { display: flex; flex-wrap: wrap; gap: 6px; margin-block: 8px; }
  form { display: grid; gap: 6px; }
  .entries :global([aria-pressed="true"]) { color: var(--vict-color-accent); }
</style>
