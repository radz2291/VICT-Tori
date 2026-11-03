<script>
  import { GraphWorkspaceV3, GraphViewport, emptyGraphV3, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import AddAgent from './AddAgent.svelte';
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
  let inspectorOpen = $state(false);
  let viewportVersion = $state(0);
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
      inspectorOpen = selected !== null;
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
    if (name === 'selectionChange') {
      const node = JSON.parse(value).nodes[0];
      if (node) {
        selected = node;
        inspectorOpen = true;
      }
    }
  }

  function focusAddedAgent(id, previousCount) {
    selected = id;
    inspectorOpen = true;
    if (previousCount > 0) viewportVersion += 1;
  }

  function edit(frame, key, value) {
    const operation = key === 'label'
      ? { type: 'setLabel', nodeId: agent.id, label: value }
      : { type: 'setParameter', nodeId: agent.id, key, value };
    frame.onOutput('operation', JSON.stringify([operation]));
  }
</script>

<ControlScope class="studio">
  <header>
    <div class="project"><span class="mark" aria-hidden="true">T</span><div><span class="kicker">TORI STUDIO</span><strong>Untitled project</strong></div></div>
    <nav aria-label="Studio views">
      {#each ['Definition', 'Trace', 'Session'] as item}
        <Button.Root class="tab" aria-current={view === item ? 'page' : undefined} onclick={() => view = item}>{item}</Button.Root>
      {/each}
    </nav>
    <span class="save-state" role="status">{status}</span>
  </header>
  <main>
    {#snippet body(frame)}
      <article class="node" class:active={frame.props.nodeId === selected}>
        <div class="node-heading vict-graph-drag-handle">
          <span class="kicker">AGENT DEFINITION</span>
          <strong>{frame.props.label}</strong>
        </div>
        <label>Node instructions
          <textarea placeholder="Describe what this agent should do"
            value={String(frame.state.instructions ?? '')}
            onchange={(event) => frame.onStateChange('instructions', event.currentTarget.value)}></textarea>
        </label>
      </article>
    {/snippet}
    {#snippet content(frame)}
      <div hidden={view !== 'Definition'}>
        <div class="workbar">
          <div><span class="kicker">DEFINITION</span><h1>Agent workspace</h1></div>
          <div class="tools">
            <div class="group" role="group" aria-label="Edit history">
              <Button.Root class="action" onclick={() => frame.onOutput('undo')}>Undo</Button.Root>
              <Button.Root class="action" onclick={() => frame.onOutput('redo')}>Redo</Button.Root>
            </div>
            <div class="group" role="group" aria-label="Draft actions">
              <Button.Root class="action" onclick={save}>Save draft</Button.Root>
              <Button.Root class="action" disabled={!savedSource} onclick={reopen}>Reopen saved draft</Button.Root>
            </div>
            {#if agent && !inspectorOpen}
              <Button.Root class="action" onclick={() => inspectorOpen = true}>Show inspector</Button.Root>
            {/if}
          </div>
        </div>
        <div class="workspace" class:inspecting={agent && inspectorOpen}>
          <div class="canvas">
            {#key viewportVersion}
              <GraphViewport props={{}} nodeId="canvas" occurrenceKey="canvas"/>
            {/key}
            {#if !graph?.nodes.length}
              <div class="empty">
                <span class="empty-icon" aria-hidden="true">+</span>
                <h2>Start with an agent</h2>
                <p>Give it a purpose, then refine its instructions right on the canvas.</p>
                <AddAgent primary onadd={focusAddedAgent}/>
              </div>
            {:else}
              <div class="canvas-tools"><AddAgent onadd={focusAddedAgent}/></div>
            {/if}
          </div>
          {#if agent && inspectorOpen}
            <aside aria-label="Inspector">
              <div class="inspector-heading">
                <div><span class="kicker">SELECTED NODE</span><h2>Inspector</h2></div>
                <Button.Root class="action" onclick={() => inspectorOpen = false}>Hide inspector</Button.Root>
              </div>
              <label>Agent name <input value={agent.label} onchange={(event) => edit(frame, 'label', event.currentTarget.value)} /></label>
              <label>Agent instructions <textarea placeholder="Describe what this agent should do" value={String(agent.values.instructions ?? '')}
                onchange={(event) => edit(frame, 'instructions', event.currentTarget.value)}></textarea></label>
              <p class="readiness">{agent.values.instructions ? 'Instructions configured' : 'Draft · Instructions required for readiness'}</p>
            </aside>
          {/if}
        </div>
        <footer><span>{graph?.nodes.length ?? 0} agents</span><span>Execution simulation</span></footer>
      </div>
    {/snippet}
    <GraphWorkspaceV3 props={{ graph: source, label: 'Agent graph' }}
      io={{ emit, scopedSlots: { content, body } }} nodeId="agents" occurrenceKey="agents"/>
    {#if view !== 'Definition'}
      <section class="placeholder"><h1>{view}</h1><p>Simulated execution. {view} records will appear here in a later checkpoint.</p></section>
    {/if}
  </main>
</ControlScope>

<style>
  :global(body) { margin: 0; }
  :global(.studio) {
    --vict-color-bg: #10181b;
    --vict-color-surface: #172226;
    --vict-color-text: #eef5f3;
    --vict-color-muted: #a4b7b6;
    --vict-color-border: #3b5055;
    --vict-color-accent: #a3e5cd;
    --vict-color-focusRing: #8ee0c7;
    --studio-raised: #233438;
    background: var(--vict-color-bg);
    min-height: 100dvh;
  }
  header, .workbar, .tools, .group, nav, .project, .inspector-heading, footer { display: flex; align-items: center; gap: .7rem; }
  header { padding: .6rem 1.25rem; justify-content: space-between; flex-wrap: wrap; border-bottom: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .project { line-height: 1.25; }
  .project strong, .kicker { display: block; }
  .mark, .empty-icon { display: grid; place-items: center; color: var(--vict-color-accent); background: var(--studio-raised); border: 1px solid var(--vict-color-border); border-radius: .6rem; }
  .mark { width: 2rem; height: 2rem; font-weight: 700; }
  .kicker { color: var(--vict-color-accent); font-size: .69rem; font-weight: 650; letter-spacing: .1em; }
  .save-state, footer, .empty p, .readiness { color: var(--vict-color-muted); }
  .save-state { font-size: .82rem; }
  main { padding: 0 1.25rem; }
  .workbar { min-height: 4.4rem; justify-content: space-between; flex-wrap: wrap; padding-block: .55rem; }
  .tools { flex-wrap: wrap; }
  .group { gap: .2rem; padding: .15rem; border: 1px solid var(--vict-color-border); border-radius: .5rem; }
  h1, h2 { margin: 0; line-height: 1.3; }
  h1 { font-size: 1.3rem; }
  h2 { font-size: 1.1rem; }
  :global(.studio .action), :global(.studio .tab) { cursor: pointer; border: 1px solid transparent; color: var(--vict-color-text); background: transparent; padding: .38rem .62rem; border-radius: .35rem; white-space: nowrap; }
  :global(.studio .action:hover:not(:disabled)), :global(.studio .tab:hover), :global(.studio .tab[aria-current]) { background: var(--studio-raised); }
  :global(.studio .primary) { color: var(--vict-color-bg); background: var(--vict-color-accent); font-weight: 700; padding-inline: 1rem; }
  :global(.studio .primary:hover:not(:disabled)) { color: var(--vict-color-bg); background: #c1f0df; }
  .workspace { display: grid; grid-template-columns: minmax(0, 1fr); gap: .75rem; }
  .workspace.inspecting { grid-template-columns: minmax(0, 1fr) minmax(17rem, 23%); }
  .canvas, aside { border: 1px solid var(--vict-color-border); border-radius: .65rem; background: var(--vict-color-surface); }
  .canvas { position: relative; height: max(27rem, calc(100dvh - 10rem)); overflow: hidden; }
  .canvas :global(.graph-viewport) { height: 100% !important; }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: var(--vict-color-border); }
  .empty { position: absolute; top: 47%; left: 50%; transform: translate(-50%, -50%); width: min(21rem, 88%); padding: 1.4rem; text-align: center; border: 1px solid var(--vict-color-border); border-radius: .75rem; background: var(--vict-color-surface); }
  .empty-icon { margin: 0 auto .7rem; width: 2.5rem; height: 2.5rem; font-size: 1.35rem; }
  .empty p { margin: .55rem 0 1rem; }
  .canvas-tools { position: absolute; top: .65rem; right: .65rem; border: 1px solid var(--vict-color-border); border-radius: .5rem; background: var(--vict-color-surface); }
  aside, .node { padding: .85rem; }
  .inspector-heading { justify-content: space-between; border-bottom: 1px solid var(--vict-color-border); padding-bottom: .6rem; }
  .node { width: 15rem; background: var(--studio-raised); border: 1px solid var(--vict-color-border); border-radius: .55rem; }
  .node.active { border-color: var(--vict-color-focusRing); }
  .node-heading { cursor: grab; }
  .node-heading strong { display: block; overflow-wrap: anywhere; }
  label { display: grid; gap: .3rem; margin-top: .75rem; font-size: .84rem; }
  input, textarea { color: inherit; border: 1px solid var(--vict-color-border); border-radius: .35rem; background: var(--vict-color-bg); padding: .45rem; min-width: 0; width: 100%; }
  textarea { min-height: 4rem; resize: vertical; }
  aside textarea { min-height: 7rem; }
  input::placeholder, textarea::placeholder { color: var(--vict-color-muted); }
  .readiness { font-size: .78rem; margin: .75rem 0 0; }
  footer { justify-content: space-between; padding: .35rem 0; font-size: .75rem; }
  .placeholder { padding: 1.5rem 0; }
  @media (max-width: 690px) {
    .workspace.inspecting { grid-template-columns: 1fr; }
    .canvas { height: 50dvh; min-height: 20rem; }
    main, header { padding-inline: .75rem; }
  }
</style>
