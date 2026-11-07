<script>
  import { Dialog } from '@victframework/ui-svelte/catalog/dialog';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Feedback } from '@victframework/ui-svelte';
  import { Textarea } from '@victframework/ui-ai-svelte';
  import Choice from './Choice.svelte';
  import { simulationOutcomes } from './simulation-workspace.svelte.js';

  let { open = $bindable(), definition, workspace, complete } = $props();
  let input = $state('');
  let outcome = $state('succeeded');
  let intent = $state('Run definition');
  const intents = ['Run definition', 'Run Node', 'Run To', 'Run From'].map(value => ({ value, label: value }));
  let protectedAction = $derived(definition?.type === 'quellight-action');
  function run() {
    const result = workspace.simulate({
      definition, input: input.trim() || definition.label,
      outcome: protectedAction ? 'denied' : outcome, mode: definition.mode || 'assist', intent,
    });
    if (result) { open = false; input = ''; complete(result); }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Overlay/>
  <Dialog.Content>
    <Dialog.Title>Start simulated run</Dialog.Title>
    <Dialog.Description>Creates local synthetic run and session records for {definition?.label}. All events are labelled simulation.</Dialog.Description>
    {#if definition?.readiness?.length}<Feedback message={definition.readiness.join(' ')}/>{/if}
    <label for="simulation-input">Run input</label>
    <Textarea id="simulation-input" class="studio-field" bind:value={input}/>
    <Choice label="Run intent" value={intent} options={intents} change={value => intent = value}/>
    {#if protectedAction}
      <Feedback kind="warning" message="Protected action replay is refused. The run will record the denial."/>
    {:else}
      <Choice label="Simulation outcome" value={outcome} options={simulationOutcomes} change={value => outcome = value}/>
    {/if}
    {#if workspace.error}<Feedback kind="error" message={workspace.error}/>{/if}
    <Button.Root class="action primary" onclick={run}>Create simulated run</Button.Root>
    <Dialog.Close>Cancel</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
