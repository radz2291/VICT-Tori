<script>
  import { GraphWorkspaceV3, emptyGraphV3, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { MediaIcon } from '@victframework/ui-media-svelte';
  import AddAgent from './AddAgent.svelte';
  import AgentCanvas from './AgentCanvas.svelte';
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
  let inspectorDismissed = $state(false);
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
        if (!inspectorDismissed) inspectorOpen = true;
      }
    }
  }

  function focusAddedAgent(id, previousCount) {
    selected = id;
    inspectorDismissed = false;
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
    <div class="project"><span class="wordmark">TORI</span><strong>Untitled project</strong></div>
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
          <span class="node-kind" aria-hidden="true">A</span>
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
          <h1>Agents</h1>
          <div class="tools">
            <div class="group" role="group" aria-label="Edit history">
              <Button.Root class="action icon-action" aria-label="Undo" title="Undo" onclick={() => frame.onOutput('undo')}>
                <MediaIcon props={{ name: 'undo', size: 16 }} nodeId="undo-icon" occurrenceKey="undo-icon"/>
              </Button.Root>
              <Button.Root class="action icon-action" aria-label="Redo" title="Redo" onclick={() => frame.onOutput('redo')}>
                <MediaIcon props={{ name: 'redo', size: 16 }} nodeId="redo-icon" occurrenceKey="redo-icon"/>
              </Button.Root>
            </div>
            <div class="group" role="group" aria-label="Draft actions">
              <Button.Root class="action icon-action" aria-label="Save draft" title="Save draft" onclick={save}>
                <MediaIcon props={{ name: 'save', size: 16 }} nodeId="save-icon" occurrenceKey="save-icon"/>
              </Button.Root>
              <Button.Root class="action" disabled={!savedSource} onclick={reopen}>Reopen saved draft</Button.Root>
            </div>
            {#if agent && !inspectorOpen}
              <Button.Root class="action" onclick={() => { inspectorDismissed = false; inspectorOpen = true; }}>Show inspector</Button.Root>
            {/if}
          </div>
        </div>
        <div class="workspace" class:inspecting={agent && inspectorOpen}>
          <div class="canvas">
            <AgentCanvas version={viewportVersion} onclear={() => selected = null}/>
            {#if !graph?.nodes.length}
              <div class="empty">

                <h2>Start with an agent</h2>

                <AddAgent primary onadd={focusAddedAgent}/>
              </div>
            {:else}
              <div class="canvas-tools" role="group" aria-label="Canvas tools">
                <AddAgent onadd={focusAddedAgent}/>
                <Button.Root class="action" onclick={() => viewportVersion += 1}>Fit view</Button.Root>
              </div>
            {/if}
          </div>
          {#if agent && inspectorOpen}
            <aside aria-label="Inspector">
              <div class="inspector-heading">
                <h2>Inspector</h2>
                <Button.Root class="action" onclick={() => { inspectorDismissed = true; inspectorOpen = false; }}>Hide inspector</Button.Root>
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
    --vict-font-family: "Segoe UI", system-ui, sans-serif;
    --vict-font-sizeBase: 13px;
    --vict-color-bg: #181819;
    --vict-color-surface: #202021;
    --vict-color-text: #efeff0;
    --vict-color-muted: #aaaab0;
    --vict-color-border: #363638;
    --vict-color-accent: #b2a4ff;
    --vict-color-focusRing: var(--vict-color-accent);
    --studio-raised: #29292b;
    background: var(--vict-color-bg);
    min-height: 100dvh;
  }
  header, .workbar, .tools, .group, nav, .project, .inspector-heading, footer { display: flex; align-items: center; gap: .5rem; }
  header { min-height: 44px; padding: 4px 14px; justify-content: space-between; flex-wrap: wrap; border-bottom: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .project { gap: 12px; }
  .project strong { font-weight: 500; }
  .wordmark { font-size: 11px; font-weight: 700; letter-spacing: .15em; border-right: 1px solid var(--vict-color-border); padding-right: 12px; }
  .save-state, footer, .readiness { color: var(--vict-color-muted); font-size: 11px; }
  .workbar { min-height: 38px; justify-content: space-between; flex-wrap: wrap; padding: 3px 14px; border-bottom: 1px solid var(--vict-color-border); }
  .tools { flex-wrap: wrap; }
  .group { gap: 0; }
  .group + .group { border-left: 1px solid var(--vict-color-border); padding-left: 8px; }
  h1, h2 { margin: 0; line-height: 1.3; font-size: 13px; font-weight: 600; }
  :global(.studio .action), :global(.studio .tab) { cursor: pointer; border: 0; color: var(--vict-color-muted); background: transparent; padding: 4px 8px; border-radius: 2px; white-space: nowrap; }
  :global(.studio .action:hover:not(:disabled)), :global(.studio .tab:hover) { background: var(--studio-raised); color: var(--vict-color-text); }
  :global(.studio .icon-action) { display: grid; place-items: center; width: 32px; height: 30px; padding: 0; }
  :global(.studio .tab[aria-current]) { color: var(--vict-color-accent); box-shadow: inset 0 -1px var(--vict-color-accent); }
  :global(.studio .primary) { background: var(--studio-raised); color: var(--vict-color-text); padding: 5px 11px; }
  .workspace { display: grid; grid-template-columns: minmax(0, 1fr); }
  .workspace.inspecting { grid-template-columns: minmax(0, 1fr) 264px; }
  .canvas { position: relative; height: max(25rem, calc(100dvh - 107px)); overflow: hidden; }
  .canvas :global(.graph-viewport) { height: 100% !important; --vict-color-surface: var(--vict-color-bg); }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: #353537; }
  .empty { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 10px; pointer-events: none; }
  .empty :global(button) { pointer-events: auto; }
  .empty h2 { color: var(--vict-color-muted); font-weight: 400; }
  .canvas-tools { position: absolute; top: 8px; left: 8px; display: flex; background: var(--vict-color-surface); }
  aside { padding: 12px; background: var(--vict-color-surface); border-left: 1px solid var(--vict-color-border); }
  .inspector-heading { justify-content: space-between; border-bottom: 1px solid var(--vict-color-border); padding-bottom: 6px; }
  .node { width: 15rem; background: var(--studio-raised); border-radius: 3px; box-shadow: 0 5px 16px #0005; padding: 10px; }
  .node.active { box-shadow: 0 0 0 1px var(--vict-color-accent), 0 5px 16px #0005; }
  .node:not(.active):hover { background: #303032; }
  .canvas :global(.composed-graph-node.selected) { outline: none; }
  .node-heading { cursor: grab; display: flex; align-items: center; gap: 8px; }
  .node-heading strong { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }
  .node-kind { display: grid; place-items: center; width: 20px; height: 20px; flex: none; background: var(--vict-color-bg); font-size: 11px; color: var(--vict-color-muted); }
  label { display: grid; gap: 4px; margin-top: 10px; font-size: 12px; color: var(--vict-color-muted); }
  input, textarea { color: var(--vict-color-text); border: 0; border-radius: 2px; background: var(--vict-color-bg); padding: 6px 8px; min-width: 0; width: 100%; }
  textarea { min-height: 3.5rem; resize: vertical; }
  aside textarea { min-height: 7rem; }
  input::placeholder, textarea::placeholder { color: var(--vict-color-muted); }
  .readiness { margin: 8px 0 0; }
  footer { justify-content: space-between; padding: 3px 14px; border-top: 1px solid var(--vict-color-border); }
  .placeholder { padding: 14px; }
  @media (max-width: 690px) {
    .workspace.inspecting { grid-template-columns: 1fr; }
    .canvas { height: 50dvh; }
    aside { border-left: 0; border-top: 1px solid var(--vict-color-border); }
  }
</style>
