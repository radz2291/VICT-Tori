<script>
  import { GraphWorkspaceV3, GraphViewport, emptyGraphV3, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { ControlScope } from '@victframework/ui-svelte/controls';

  const key = 'tori.studio.draft.v1';
  const blank = () => JSON.stringify({
    ...emptyGraphV3(),
    allowCycles: true,
    nodeTypes: [{
      id: 'agent', label: 'Agent definition', ports: [],
      parameters: { instructions: { type: 'string', default: '', label: 'Instructions' } }
    }]
  });
  let source = $state(blank());
  let savedSource = $state(null);
  let selected = $state(null);
  let status = $state('New local draft');
  let view = $state('Definition');
  let parsed = $derived(parseGraphV3(source));
  let graph = $derived(parsed.ok ? parsed.graph : null);
  let agent = $derived(graph?.nodes.find(node => node.id === selected));

  function reopen() {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return;
      const result = parseGraphV3(stored);
      if (!result.ok) throw new Error('The saved graph is invalid.');
      source = stored;
      savedSource = stored;
      selected = result.graph.nodes[0]?.id ?? null;
      status = 'Saved draft reopened';
    } catch (error) {
      status = error.message;
    }
  }
  reopen();

  function save() {
    try {
      if (localStorage.getItem(key) !== savedSource) {
        throw new Error('The saved draft changed in another tab. Reopen it before saving.');
      }
      localStorage.setItem(key, source);
      savedSource = source;
      status = 'Draft saved locally';
    } catch (error) {
      status = error.message;
    }
  }

  function emit(name, value) {
    if (name === 'graphChange') {
      source = value;
      status = source === savedSource ? 'Saved draft' : 'Unsaved edits';
    }
    if (name === 'selectionChange') selected = JSON.parse(value).nodes[0] ?? null;
  }

  function add(frame) {
    const id = crypto.randomUUID();
    const position = { x: 28 + graph.nodes.length * 48, y: 28 + graph.nodes.length * 85 };
    frame.onOutput('operation', JSON.stringify([{ type: 'addNode', id, nodeType: 'agent', position }]));
    selected = id;
  }

  function edit(frame, key, value) {
    const operation = key === 'label'
      ? { type: 'setLabel', nodeId: agent.id, label: value }
      : { type: 'setParameter', nodeId: agent.id, key, value };
    frame.onOutput('operation', JSON.stringify([operation]));
  }
</script>

<ControlScope>
  <header>
    <div><strong>TORI</strong> <span>Studio</span></div>
    <nav aria-label="Studio views">
      {#each ['Definition', 'Trace', 'Session'] as item}
        <Button.Root aria-current={view === item ? 'page' : undefined} onclick={() => view = item}>{item}</Button.Root>
      {/each}
    </nav>
    <span class="badge">Execution simulation</span>
  </header>
  <main>
    <p class="eyebrow">LOCAL PROJECT / {view.toUpperCase()}</p>
    <h1>{view === 'Definition' ? 'Agent Builder' : view}</h1>
    {#snippet body(frame)}
      <article class="node">
        <strong class="vict-graph-drag-handle">{frame.props.label}</strong>
        <label>Node instructions
          <textarea value={String(frame.state.instructions ?? '')}
            onchange={(event) => frame.onStateChange('instructions', event.currentTarget.value)}></textarea>
        </label>
      </article>
    {/snippet}
    {#snippet content(frame)}
      <div hidden={view !== 'Definition'}>
        <div class="toolbar">
          <Button.Root onclick={() => add(frame)}>Add agent</Button.Root>
          <Button.Root onclick={() => frame.onOutput('undo')}>Undo</Button.Root>
          <Button.Root onclick={() => frame.onOutput('redo')}>Redo</Button.Root>
          <Button.Root onclick={save}>Save draft</Button.Root>
          <Button.Root disabled={!savedSource} onclick={reopen}>Reopen saved draft</Button.Root>
          <span role="status">{status}</span>
        </div>
        <div class="workspace">
          <div class="canvas"><GraphViewport props={{}} nodeId="canvas" occurrenceKey="canvas"/></div>
          <aside aria-label="Inspector">
            <h2>Inspector</h2>
            {#if agent}
              <p class="eyebrow">AGENT DEFINITION</p>
              <label>Agent name <input value={agent.label} onchange={(event) => edit(frame, 'label', event.currentTarget.value)} /></label>
              <label>Agent instructions <textarea value={String(agent.values.instructions ?? '')}
                onchange={(event) => edit(frame, 'instructions', event.currentTarget.value)}></textarea></label>
              <p>{agent.values.instructions ? 'Instructions configured' : 'Draft · Instructions required for readiness'}</p>
            {:else}
              <p>Add or select an agent to edit its configuration.</p>
            {/if}
          </aside>
        </div>
      </div>
    {/snippet}
    <GraphWorkspaceV3 props={{ graph: source, label: 'Agent graph' }}
      io={{ emit, scopedSlots: { content, body } }} nodeId="agents" occurrenceKey="agents"/>
    {#if view !== 'Definition'}
      <p>Simulated execution. {view} records will appear here in a later checkpoint.</p>
    {/if}
  </main>
</ControlScope>

<style>
  :global(body) { margin: 0; background: #101618; color: #edf4f1; font: 15px system-ui, sans-serif; }
  header, .toolbar, nav { display: flex; align-items: center; gap: .65rem; flex-wrap: wrap; }
  header { padding: .9rem 1.5rem; border-bottom: 1px solid #344441; justify-content: space-between; }
  header strong { letter-spacing: .18em; color: #94e0c6; }
  main { padding: 1.4rem; }
  h1 { margin: .35rem 0 1rem; font-size: 2rem; }
  h2 { font-size: 1.05rem; margin-top: 0; }
  .eyebrow, .badge { color: #94e0c6; font-size: .73rem; letter-spacing: .1em; }
  .toolbar { margin-bottom: 1rem; }
  .workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(15rem, 24%); gap: 1rem; }
  .canvas, aside { border: 1px solid #344441; border-radius: .65rem; background: #192321; }
  .canvas { height: min(62vh, 42rem); overflow: hidden; }
  .canvas :global(.svelte-flow) { width: 100%; height: 100%; }
  aside, .node { padding: 1rem; }
  .node { width: 13rem; background: #253632; border: 1px solid #57786e; border-radius: .5rem; }
  .node strong { display: block; cursor: grab; }
  label { display: grid; gap: .35rem; margin-top: .75rem; }
  input, textarea { font: inherit; color: inherit; border: 1px solid #57786e; border-radius: .3rem; background: #101618; padding: .45rem; min-width: 0; }
  textarea { min-height: 3rem; }
  @media (max-width: 650px) { .workspace { grid-template-columns: 1fr; } .canvas { height: 42vh; } }
</style>
