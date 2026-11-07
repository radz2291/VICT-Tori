<script>
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Dialog } from '@victframework/ui-svelte/catalog/dialog';
  import { Feedback } from '@victframework/ui-svelte';
  import { MediaVector } from '@victframework/ui-media-svelte';
  import Choice from './Choice.svelte';
  import { artifactId, creativeArtifact, creativeOperator, sameCreativeInputs } from './creative-graph.js';

  let { open = $bindable(), input, invalid, workspace, openRun } = $props();
  let intent = $state('Run Node');
  const intents = ['Run Node', 'Run To', 'Run From', 'Reuse current artifact', 'Generate another variation']
    .map(value => ({ value, label: value }));
  let artifacts = $derived(input ? (workspace?.data.runs ?? []).filter(run =>
    run.status === 'succeeded' && run.definition?.creative?.operator === creativeOperator &&
    !run.definition.creative.reusedArtifactId && run.definition.id === input.id).toReversed() : []);
  let matching = $derived(input && !invalid
    ? artifacts.find(run => sameCreativeInputs(run.definition.creative.input, input)) : undefined);
  let unavailable = $derived(!workspace ? 'Simulation adapter is unavailable.'
    : invalid ? 'The bound reference is missing. Rebind or clear it in Inspector.'
    : !input?.notes.trim() ? 'Add direction notes before starting a simulation.'
    : intent === 'Run To' ? 'Run To is unavailable. Reference links provide no upstream executable operations.'
    : intent === 'Run From' ? 'Run From is unavailable. This direction has no downstream executable operations.'
    : intent === 'Reuse current artifact' && !matching ? 'No artifact matches these inputs. Generate a new version or restore its inputs.'
    : undefined);

  function simulate() {
    if (unavailable || !input) return;
    const reusedArtifactId = intent === 'Reuse current artifact' ? artifactId(matching) : null;
    const artifact = reusedArtifactId ? null : creativeArtifact(input, artifacts.length + 1);
    const run = workspace.simulate({
      definition: {
        page: 'Creative', id: input.id, label: input.label, type: 'direction', revision: input.revision,
        creative: { input, operator: creativeOperator, reusedArtifactId, artifact },
      },
      input: JSON.stringify({ notes: input.notes, context: input.context, operator: creativeOperator, reusedArtifactId }),
      outcome: 'succeeded',
      mode: 'assist',
      intent,
    });
    if (run) { open = false; openRun?.(run); }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Overlay/>
  <Dialog.Content class="creative-simulation">
    <Dialog.Title>Simulate selected direction</Dialog.Title>
    <Dialog.Description>U0 simulation only. A local synthetic artifact records the selected inputs. Cost is unknown.</Dialog.Description>
    {#if input}
      <dl>
        <dt>Direction</dt><dd>{input.label} · Revision {input.revision}</dd>
        <dt>Direction notes</dt><dd>{input.notes || 'Empty'}</dd>
        <dt>Explicit context</dt><dd>{input.context ? input.context.label + ' · ' + input.context.notes : 'None'}</dd>
      </dl>
      <Choice label="Creative simulation intent" value={intent} options={intents} change={value => intent = value}/>
      {#if unavailable}<Feedback kind="warning" message={unavailable}/>{/if}
      {#if workspace?.error}<Feedback kind="error" message={workspace.error}/>{/if}
      <Button.Root class="action primary" disabled={Boolean(unavailable)} onclick={simulate}>Create simulated run</Button.Root>
      <h3>Artifact versions</h3>
      {#each artifacts as run (run.id)}
        <div class="artifact">
          {#if run.definition.creative.artifact}
            <div class="artifact-preview">
              <MediaVector props={{ data: JSON.stringify(run.definition.creative.artifact.graphic), label: 'Synthetic artifact variation ' + run.definition.creative.artifact.variation }}
                nodeId={artifactId(run)} occurrenceKey="creative-artifact"/>
            </div>
          {/if}
          <span>{artifactId(run)} · {invalid || !sameCreativeInputs(run.definition.creative.input, input) ? 'Stale inputs' : 'Current inputs'}</span>
          <Button.Root class="action" onclick={() => { open = false; openRun?.(run); }}>Inspect artifact run</Button.Root>
        </div>
      {:else}
        <Feedback kind="empty" message="No simulated artifact versions for this direction."/>
      {/each}
    {/if}
    <Dialog.Close>Close</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>

<style>
  :global(.creative-simulation) { max-height: 90dvh; overflow: auto; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 8px; }
  dd { margin: 0; overflow-wrap: anywhere; }
  .artifact { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; overflow-wrap: anywhere; }
  .artifact-preview { width: 96px; flex: none; }
  h3 { font-size: 13px; }
</style>
