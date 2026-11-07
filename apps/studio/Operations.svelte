<script>
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Feedback } from '@victframework/ui-svelte';
  import { Message, Textarea, Trace } from '@victframework/ui-ai-svelte';
  import { MediaVector } from '@victframework/ui-media-svelte';
  import Choice from './Choice.svelte';
  import { simulationOutcomes } from './simulation-workspace.svelte.js';

  let { page, workspace, sessionId = $bindable(), runId = $bindable(), navigate, openDefinition } = $props();
  let message = $state('');
  let outcome = $state('succeeded');
  let mode = $state('');
  let eventId = $state('');
  let session = $derived(workspace.data.sessions.find(item => item.id === sessionId));
  let run = $derived(workspace.data.runs.find(item => item.id === runId));
  let modeOptions = $derived(workspace.data.settings.modes.filter(item => item.enabled)
    .map(item => ({ value: item.id, label: item.name })));
  let effectiveMode = $derived(modeOptions.some(item => item.value === mode) ? mode : modeOptions[0]?.value);
  function findEvent(events, id) {
    for (const event of events) {
      if (event.id === id) return event;
      const nested = findEvent(event.children ?? [], id);
      if (nested) return nested;
    }
  }
  let activeEvent = $derived(findEvent(run?.events ?? [], eventId));

  function send(event) {
    event.preventDefault();
    if (!session || !message.trim() || !effectiveMode) return;
    const result = workspace.simulate({ sessionId, input: message.trim(), mode: effectiveMode, outcome, intent: 'Session message' });
    if (result) { message = ''; runId = result.id; }
  }

  function openRun(id) {
    runId = id;
    eventId = '';
    navigate('Runs');
  }
</script>

{#snippet eventList(events)}
  <ol>
    {#each events as event (event.id)}
      <li>
        <Button.Root class="action" aria-pressed={eventId === event.id} onclick={() => eventId = event.id}>{event.name}</Button.Root>
        {#if event.children?.length}{@render eventList(event.children)}{/if}
      </li>
    {/each}
  </ol>
{/snippet}

<section class="operations" aria-label={page === 'Sessions' ? 'Conversation' : 'Execution trace'}>
  <header><h1>{page === 'Sessions' ? 'Conversation' : 'Execution trace'}</h1><Feedback message="U0 | Simulation only"/></header>
  {#if workspace.error}<Feedback kind="error" message={workspace.error}/>{/if}
  {#if page === 'Sessions'}
    <div class="workspace-list">
      <Button.Root class="action primary" onclick={() => { const id = workspace.createSession(); if (id) sessionId = id; }}>New session</Button.Root>
      {#each workspace.data.sessions as item (item.id)}
        <Button.Root class="action" aria-pressed={sessionId === item.id} onclick={() => sessionId = item.id}>
          {item.title} · {item.id.slice(0, 8)}
        </Button.Root>
      {/each}
    </div>
    {#if session}
      <article aria-label="Session history">
        <h2>{session.title}</h2>
        <p>Session ID {session.id}</p>
        <p>Participant: You · TORI simulation adapter</p>
        <p>Model: Deterministic fixture · Activation: {session.definition ? 'Draft revision ' + session.definition.revision : 'Standalone session'}</p>
        {#if session.definition}<Button.Root class="action" onclick={() => openDefinition(session.definition)}>Open definition</Button.Root>{/if}
        {#each session.definition?.creativeSources ?? [] as source}
          <p>Creative source {source.id} · revision {source.revision}{source.artifactId ? ' · artifact ' + source.artifactId : ''}</p>
        {/each}
        {#each session.messages as item (item.id)}
          <Message.Root class="message">
            <strong>{item.role} · {item.mode}</strong>
            <Message.Content>{item.text}</Message.Content>
            {#if item.status}<Message.Footer>{item.status === 'waiting' ? 'Background status · Waiting for review' : 'Adapter status · ' + item.status}</Message.Footer>{/if}
            {#if item.origin === 'simulation'}<Button.Root class="action" onclick={() => openRun(item.runId)}>Inspect simulated run</Button.Root>{/if}
          </Message.Root>
        {:else}
          <Feedback kind="empty" message="Start the conversation with a message."/>
        {/each}
      </article>
      <form onsubmit={send}>
        <div class="workspace-list">
          <Choice label="Mode" value={effectiveMode} options={modeOptions} change={value => mode = value}/>
          <Choice label="Simulation outcome" value={outcome} options={simulationOutcomes} change={value => outcome = value}/>
        </div>
        <label for="session-message">Message</label>
        <Textarea id="session-message" class="studio-field" bind:value={message}/>
        <Button.Root type="submit" class="action primary" disabled={!message.trim() || !effectiveMode}>Send simulated message</Button.Root>
      </form>
    {:else}
      <Feedback kind="empty" message="Open a saved session or create a conversation."/>
    {/if}
  {:else}
    <div class="workspace-list">
      {#each workspace.data.runs as item (item.id)}
        <Button.Root class="action" aria-pressed={runId === item.id} onclick={() => openRun(item.id)}>
          {item.definition?.label ?? 'Session message'} · {item.status} · {item.id.slice(0, 8)}
        </Button.Root>
      {:else}
        <Feedback kind="empty" message="No simulated runs yet. Use the Run menu from an authored definition."/>
      {/each}
    </div>
    {#if run}
      <article aria-label="Run evidence">
        <h2>{run.intent} · {run.status}</h2>
        <p>Run ID {run.id}</p>
        <p>Origin: simulation · Cost unknown · Adapter: U0 deterministic fixture</p>
        <div class="workspace-list">
          <Button.Root class="action" onclick={() => { sessionId = run.sessionId; navigate('Sessions'); }}>Open linked session</Button.Root>
          {#if run.definition}<Button.Root class="action" onclick={() => openDefinition(run.definition)}>Open definition</Button.Root>{/if}
        </div>
        {#if run.definition?.sourceArtifactId}
          {@const sourceRun = workspace.data.runs.find(item => item.id + ':artifact' === run.definition.sourceArtifactId)}
          {#if sourceRun}
            <p>Source artifact {run.definition.sourceArtifactId}</p>
            <Button.Root class="action" onclick={() => openRun(sourceRun.id)}>Open source artifact run</Button.Root>
          {/if}
        {/if}
        {#each run.definition?.creativeSources ?? [] as source}
          <p>Creative source {source.id} · revision {source.revision}</p>
        {/each}
        {#if run.definition?.creative}
          <section aria-label="Creative artifact provenance">
            <h3>Creative artifact</h3>
            <p>Intent: {run.definition.creative.operator} · Origin: simulation</p>
            {#if run.definition.creative.reusedArtifactId || run.status === 'succeeded'}
              <p>Artifact ID {run.definition.creative.reusedArtifactId || run.id + ':artifact'}</p>
            {/if}
            {#if run.definition.creative.artifact}
              <div class="artifact-preview">
                <MediaVector props={{ data: JSON.stringify(run.definition.creative.artifact.graphic), label: 'Synthetic run artifact' }}
                  nodeId={run.id + ':artifact'} occurrenceKey="run-artifact"/>
              </div>
            {:else if run.definition.creative.reusedArtifactId}
              {@const sourceRun = workspace.data.runs.find(item => item.id + ':artifact' === run.definition.creative.reusedArtifactId)}
              {#if sourceRun}<Button.Root class="action" onclick={() => openRun(sourceRun.id)}>Open source artifact run</Button.Root>{/if}
            {/if}
            <pre>{JSON.stringify(run.definition.creative.input, null, 2)}</pre>
          </section>
        {/if}
        <Trace.Root>{@render eventList(run.events)}</Trace.Root>
        {#if activeEvent}
          <section aria-label="Event inspection">
            <h3>{activeEvent.name}</h3>
            <p>{activeEvent.status} · {activeEvent.origin}{activeEvent.recordedAt ? ' · ' + activeEvent.recordedAt : ''}</p>
            {#if activeEvent.input}<h4>Input</h4><pre>{JSON.stringify(activeEvent.input, null, 2)}</pre>{/if}
            {#if activeEvent.output}<h4>Output</h4><p>{activeEvent.output}</p>{/if}
            {#if activeEvent.error}<Feedback kind="error" message={activeEvent.error}/>
            {:else if activeEvent.detail && !activeEvent.output}<Feedback message={activeEvent.detail}/>{/if}
          </section>
        {/if}
      </article>
    {/if}
  {/if}
</section>

<style>
  .operations { min-height: 0; overflow: auto; padding: 12px clamp(12px, 3vw, 32px); }
  header, .workspace-list { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  header { justify-content: space-between; }
  h1 { font-size: 16px; }
  h2 { font-size: 14px; }
  p, pre { overflow-wrap: anywhere; white-space: pre-wrap; }
  .artifact-preview { width: min(100%, 240px); }
  .operations :global(.message), form, article { border-top: 1px solid var(--vict-color-border); padding: 12px 0; }
  form { display: grid; justify-items: start; gap: 6px; }
  .operations :global([aria-pressed="true"]) { color: var(--vict-color-accent); }
</style>
