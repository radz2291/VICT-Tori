<script>
  import GraphHost from './GraphHost.svelte';
  import { GraphDraft } from './graph-draft.svelte.js';
  import { AlertDialog } from '@victframework/ui-svelte/catalog/alert-dialog';
  import WorkspaceDock from './WorkspaceDock.svelte';
  import StudioMenu from './StudioMenu.svelte';
  import GraphCommands from './GraphCommands.svelte';
  import { tick, untrack } from 'svelte';
  import { GraphWorkspaceV3, emptyGraphV3, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { DropdownMenu } from '@victframework/ui-svelte/catalog/dropdown-menu';
  import { Feedback } from '@victframework/ui-svelte';
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import { MediaIcon } from '@victframework/ui-media-svelte';
  import AddAgent from './AddAgent.svelte';
  import AgentCanvas from './AgentCanvas.svelte';
  import WorkflowPreview from './WorkflowPreview.svelte';
  import CreativeCanvas from './CreativeCanvas.svelte';
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
  const agentDraft = new GraphDraft(key, blank());
  let source = $derived(agentDraft.source);
  let savedSource = $derived(agentDraft.saved);
  let selected = $state(parseGraphV3(agentDraft.source).graph?.nodes[0]?.id ?? null);
  let status = $derived(agentDraft.status);
  let draftError = $derived(agentDraft.error);
  let nameInput = $state(null);
  let agentNavigation = $state.raw({});
  const preview = new URLSearchParams(window.location.search).get('preview');
  let view = $state(preview === 'sessions' ? 'Sessions' : preview === 'workflow' ? 'Workflows' : 'Agents');
  let workflowStatus = $state('New local draft');
  let creativeStatus = $state('New local draft');
  const pages = ['Agents', 'Workflows', 'Creative', 'Sessions', 'Runs'];
  const layoutKey = 'tori.studio.docks.v1';
  function readLayouts() {
    try {
      const stored = JSON.parse(localStorage.getItem(layoutKey));
      return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    } catch { return {}; }
  }
  let layouts = $state(readLayouts());
  let inspectedNodes = $state({});
  function persistPageLayout(pageLayout) {
    try {
      const stored = readLayouts();
      if (pageLayout) stored[view] = pageLayout;
      else delete stored[view];
      localStorage.setItem(layoutKey, JSON.stringify(stored));
    } catch { /* Keep this session usable. */ }
  }
  const narrowQuery = window.matchMedia('(max-width: 620px)');
  let narrow = $state(narrowQuery.matches);
  $effect(() => {
    function update(event) {
      narrow = event.matches;
    }
    narrowQuery.addEventListener('change', update);
    return () => narrowQuery.removeEventListener('change', update);
  });
  let agentWorkspace = $state.raw();
  let addAgent = $state.raw();
  let workflowCommands = $state.raw({});
  let creativeCommands = $state.raw({});
  let help = $state(false);
  let confirmReopen = $state(false);
  let reopenAction;
  function requestReopen() {
    if (!commands.canReopen) return;
    if (!commands.dirty) return commands.reopen();
    reopenAction = commands.reopen;
    confirmReopen = true;
  }
  const dockRoles = [
    { name: 'Library', width: 220, icon: 'folder' },
    { name: 'Inspector', width: 264, icon: 'sliders-horizontal' }
  ];
  let panels = $derived(dockRoles.filter(({ name }) => name === 'Library' ? objects.length : inspected)
    .map(role => {
      const preference = layouts[view]?.[role.name];
      return {
        ...role,
        width: Number.isInteger(preference?.width) && preference.width >= 180 && preference.width <= 360
          ? preference.width : role.width,
        open: narrow ? layouts[view]?.narrowPanel === role.name : typeof preference?.open === 'boolean'
          ? preference.open : view === 'Agents' && role.name === 'Inspector'
      };
    }));
  function changeLayout(change) {
    const pageLayout = { ...(layouts[view] ?? {}), ...change };
    layouts[view] = pageLayout;
    persistPageLayout(pageLayout);
  }
  function setPanel(name, change) {
    changeLayout({ [name]: { ...layouts[view]?.[name], ...change } });
  }
  async function closeNarrowPanel(name) {
    if (layouts[view]?.narrowPanel !== name) return;
    changeLayout({ narrowPanel: null });
    await tick();
    document.getElementById('dock-toggle-' + name)?.focus();
  }
  function togglePanel(name) {
    const panel = panels.find(item => item.name === name);
    if (!panel) return;
    if (narrow) {
      if (panel.open) void closeNarrowPanel(name);
      else changeLayout({ narrowPanel: name });
    }
    else setPanel(name, { open: !panel.open });
  }
  function resetLayout() {
    delete layouts[view];
    persistPageLayout(null);
  }
  let commands = $derived(view === 'Agents' ? {
    save, reopen, dirty: agentDraft.dirty, canReopen: Boolean(savedSource),
    undo: agentDraft.canUndo() ? () => agentWorkspace?.undo() : undefined,
    redo: agentDraft.canRedo() ? () => agentWorkspace?.redo() : undefined,
    navigation: agentNavigation,
    add: addAgent
  } : view === 'Workflows' ? workflowCommands : view === 'Creative' ? creativeCommands : {});
  let currentWorkspace = $derived(view === 'Agents' ? agentWorkspace : commands.workspace);
  let objects = $derived(currentWorkspace?.graph.nodes ?? []);
  let selectedObject = $derived(objects.find(node => node.id === inspectedNodes[view]));
  let inspected = $derived(view === 'Agents' ? agent : selectedObject);
  let library = $derived(panels.find(panel => panel.name === 'Library'));
  let inspector = $derived(panels.find(panel => panel.name === 'Inspector'));
  // Restore an inspectable object only when reopening a saved layout for the first time.
  const restoredSelection = new Set();
  $effect(() => {
    if (!currentWorkspace || !objects.length || restoredSelection.has(view)) return;
    restoredSelection.add(view);
    untrack(() => {
      const saved = layouts[view]?.inspectedId;
      if (!saved || !objects.some(node => node.id === saved)) return;
      if (view === 'Agents') selected = saved;
      else inspectedNodes[view] = saved;
      currentWorkspace.select({ nodes: [saved], edges: [] });
    });
  });
  $effect(() => {
    if (!inspector?.open || !inspected) return;
    const id = inspected.id;
    untrack(() => {
      if (layouts[view]?.inspectedId !== id) changeLayout({ inspectedId: id });
    });
  });
  let menus = $derived([
    { name: 'File', items: [{ label: 'Save draft', run: commands.save, hint: 'Ctrl+S' }, { label: 'Reopen saved draft', run: commands.canReopen ? requestReopen : undefined }] },
    { name: 'Edit', items: [{ label: 'Undo', run: commands.undo, hint: 'Ctrl+Z' }, { label: 'Redo', run: commands.redo, hint: 'Ctrl+Shift+Z' }, { label: 'Delete selected object', run: inspected ? deleteSelected : undefined }] },
    { name: 'View', items: [
      { label: 'Fit view', run: objects.length ? commands.navigation?.fit : undefined },
      { label: 'Reveal selected object', run: inspected ? () => commands.navigation?.reveal(inspected.id) : undefined },
      { label: 'Zoom in', run: objects.length ? commands.navigation?.zoomIn : undefined },
      { label: 'Zoom out', run: objects.length ? commands.navigation?.zoomOut : undefined }
    ] },
    { name: 'Insert', items: [{ label: commands.addLabel ?? 'Add agent', run: commands.add }] },
    { name: 'Run', items: [{ label: 'Live execution unavailable in U0' }] },
    { name: 'Window' },
    { name: 'Help', items: [{ label: 'About this workspace', run: () => help = !help }] }
  ]);
  function deleteSelected() {
    if (!inspected || !currentWorkspace) return;
    currentWorkspace.apply([{ type: 'remove', selection: { nodes: [inspected.id], edges: [] } }]);
    if (view === 'Agents') selected = null;
    else inspectedNodes[view] = null;
  }
  function shortcuts(event) {
    if ((!event.ctrlKey && !event.metaKey) || event.altKey || event.defaultPrevented) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]')) return;
    const command = key === 's' ? commands.save : key === 'z' ? event.shiftKey ? commands.redo : commands.undo : undefined;
    if (command) { event.preventDefault(); command(); }
  }
  let parsed = $derived(parseGraphV3(source));
  let graph = $derived(parsed.ok ? parsed.graph : null);
  let agent = $derived(graph?.nodes.find(node => node.id === selected));

  function reopen() {
    agentDraft.reopen();
    const nodes = parseGraphV3(agentDraft.source).graph?.nodes ?? [];
    selected = nodes.find(node => node.id === layouts.Agents?.inspectedId)?.id ?? nodes[0]?.id ?? null;
  }
  function save() { agentDraft.save(); }
  function downloadDraft() { agentDraft.download('tori-draft.json'); }

  function emit(name, value) {
    if (name === 'graphChange') {
      agentDraft.edit(value);
    }
    if (name === 'selectionChange') {
      const node = JSON.parse(value).nodes[0];
      if (node) {
        selected = node;
      }
    }
  }

  async function focusAddedAgent(id, previousCount) {
    selected = id;
    if (previousCount > 0) void agentNavigation.reveal?.(id);
    await tick();
    nameInput?.focus();
  }

  function edit(key, value) {
    const operation = key === 'label'
      ? { type: 'setLabel', nodeId: agent.id, label: value }
      : { type: 'setParameter', nodeId: agent.id, key, value };
    agentWorkspace?.apply([operation]);
  }
</script>

<svelte:window onkeydown={shortcuts}/>
<ControlScope class="studio"><div class="studio-shell" class:phone={narrow}>
  {#if !narrow}<div class="menu-strip"><span class="wordmark">TORI</span><StudioMenu {menus} {panels} toggle={togglePanel} reset={resetLayout}/></div>{/if}
  <header>
    <div class="project">{#if !narrow}<strong>Untitled project</strong><span aria-hidden="true">/</span>{/if}<span>{view}</span></div>
  {#if objects.length && !narrow}
    <div class="view-tools" role="group" aria-label="Canvas navigation">
      <Button.Root class="action" onclick={() => commands.navigation?.zoomOut?.()}>Zoom out</Button.Root>
      <Button.Root class="action" onclick={() => commands.navigation?.zoomIn?.()}>Zoom in</Button.Root>
      <Button.Root class="action" disabled={!inspected} onclick={() => commands.navigation?.reveal(inspected.id)}>Reveal selected object</Button.Root>
      <Button.Root class="action" disabled={!inspected} onclick={deleteSelected}>Delete selected object</Button.Root>
    </div>
  {/if}
    {#if panels.length}<div class="panel-controls" role="group" aria-label="Workspace panels">
      {#each panels as panel (panel.name)}
        <Button.Root class="action panel-toggle icon-action" id={'dock-toggle-' + panel.name} aria-label={panel.name} title={panel.name}
          aria-pressed={panel.open} onclick={() => togglePanel(panel.name)}>
          <MediaIcon props={{ name: panel.icon, size: 16 }} nodeId={panel.name} occurrenceKey={panel.name}/>
        </Button.Root>
      {/each}
    </div>{/if}
    {#if view !== 'Sessions'}<div class="save-state">
      {#if view === 'Agents'}<Feedback message={status}/>
      {:else if view === 'Workflows'}<Feedback message={workflowStatus}/>
      {:else if view === 'Creative'}<Feedback message={creativeStatus}/>
      {/if}
    </div>{/if}
    {#if narrow}
      {#if objects.length}<Button.Root class="action phone-fit" aria-label="Fit view" onclick={() => commands.navigation?.fit?.()}>Fit</Button.Root>{/if}
      <StudioMenu {menus} {panels} toggle={togglePanel} reset={resetLayout} {narrow}/>
    {/if}
  </header>
  {#if view === 'Agents' && draftError}
    <div class="draft-feedback">
      <Feedback kind="error" message={draftError}/>
      <Button.Root class="action" onclick={downloadDraft}>Download draft</Button.Root>
    </div>
  {/if}
  {#if help}<div class="draft-feedback"><Feedback message="TORI Studio · U0 local drafts. Live execution and provider access are unavailable."/><Button.Root class="action" onclick={() => help = false}>Dismiss</Button.Root></div>{/if}
  <main class:phone-workspace={narrow} class:conversation-workspace={view === 'Sessions'}>
    <div class="desk">
      {#if library}
        <WorkspaceDock panel={library} {narrow} resize={(width) => setPanel('Library', { width })} close={() => closeNarrowPanel('Library')}>
          {#each objects as node (node.id)}
            <Button.Root class="action library-row" aria-pressed={(view === 'Agents' ? selected : selectedObject?.id) === node.id}
              onclick={() => {
                if (view === 'Agents') selected = node.id;
                else inspectedNodes[view] = node.id;
                currentWorkspace?.select({ nodes: [node.id], edges: [] });
                if (narrow) void closeNarrowPanel('Library');
              }}>{node.label}</Button.Root>
          {/each}
        </WorkspaceDock>
      {/if}
      <div class="stage">
    {#snippet body(frame)}
      <article class="node" data-tori-node={frame.props.nodeId} class:active={frame.props.nodeId === selected}>
        <div class="node-heading vict-graph-drag-handle">
          <span class="node-kind" aria-hidden="true">A</span>
          <strong>{frame.props.label}</strong>
        </div>
        <label for={`node-instructions-${frame.props.nodeId}`}>Node instructions
          <Textarea onfocus={() => agentDraft.beginEdit()} onblur={() => agentDraft.endEdit()} id={`node-instructions-${frame.props.nodeId}`} class="studio-field" placeholder="Describe what this agent should do"
            value={String(frame.state.instructions ?? '')}
            oninput={(event) => frame.onStateChange('instructions', event.currentTarget.value)}/>
        </label>
      </article>
    {/snippet}
    {#snippet content(frame)}
      <GraphCommands register={(workspace) => { agentWorkspace = workspace; }}/>
      <div class="agent-page">
        <div class="workbar">
          <h1>Agents</h1>
          <div class="tools">
            <div class="group" role="group" aria-label="Edit history">
              <Button.Root class="action icon-action" aria-label="Undo" title="Undo" disabled={!agentDraft.canUndo()} onclick={() => frame.onOutput('undo')}>
                <MediaIcon props={{ name: 'undo', size: 16 }} nodeId="undo-icon" occurrenceKey="undo-icon"/>
              </Button.Root>
              <Button.Root class="action icon-action" aria-label="Redo" title="Redo" disabled={!agentDraft.canRedo()} onclick={() => frame.onOutput('redo')}>
                <MediaIcon props={{ name: 'redo', size: 16 }} nodeId="redo-icon" occurrenceKey="redo-icon"/>
              </Button.Root>
            </div>
            <div class="group" role="group" aria-label="Draft actions">
              <Button.Root class="action icon-action" aria-label="Save draft" title="Save draft" onclick={save}>
                <MediaIcon props={{ name: 'save', size: 16 }} nodeId="save-icon" occurrenceKey="save-icon"/>
              </Button.Root>
              <Button.Root class="action icon-action" aria-label="Reopen saved draft" title="Reopen saved draft" disabled={!savedSource} onclick={requestReopen}>
                <MediaIcon props={{ name: 'clock', size: 16 }} nodeId="reopen-icon" occurrenceKey="reopen-icon"/>
              </Button.Root>
            </div>
          </div>
        </div>
          <div class="canvas">
            <AgentCanvas active={view === 'Agents'} register={(value) => { agentNavigation = value; }} onclear={() => selected = null}/>
            {#if !graph?.nodes.length}
              <div class="empty">

                <h2>Start with an agent</h2>

                <AddAgent primary onadd={focusAddedAgent} register={(action) => { addAgent = action; }}/>
              </div>
            {:else}
              <div class="canvas-tools" role="group" aria-label="Canvas tools">
                <AddAgent onadd={focusAddedAgent} register={(action) => { addAgent = action; }}/>
                <Button.Root class="action desktop-command" onclick={() => agentNavigation.fit?.()}>Fit view</Button.Root>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger class="action">Find agent</DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content class="agent-menu" align="start" sideOffset={4}>
                      <DropdownMenu.RadioGroup value={selected ?? ''} onValueChange={(id) => {
                        selected = id;
                      }}>
                        {#each graph.nodes as node, index (node.id)}
                          <DropdownMenu.RadioItem class="agent-menu-item" value={node.id} textValue={node.label}>
                            <span class="agent-menu-label">{node.label}{graph.nodes.filter(item => item.label === node.label).length > 1 ? ` · ${index + 1}` : ''}</span>
                            <span class="menu-current" aria-hidden="true">
                              {#if selected === node.id}
                                <MediaIcon props={{ name: 'check', size: 14 }} nodeId={node.id} occurrenceKey={node.id}/>
                              {/if}
                            </span>
                          </DropdownMenu.RadioItem>
                        {/each}
                      </DropdownMenu.RadioGroup>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            {/if}
          </div>
        <footer><span>{graph?.nodes.length ?? 0} agents</span><span>Execution simulation</span></footer>
      </div>
    {/snippet}
    <div class="authoring-page" hidden={view !== 'Agents'}>
      <GraphHost draft={agentDraft}><GraphWorkspaceV3 props={{ graph: source, label: 'Agent graph' }}
        io={{ emit, scopedSlots: { content, body } }} nodeId="agents" occurrenceKey="agents"/></GraphHost>
    </div>
    <div class="authoring-page" hidden={view !== 'Workflows'}><WorkflowPreview active={view === 'Workflows'} onSelection={(id) => { inspectedNodes.Workflows = id; }} {requestReopen} agents={graph?.nodes ?? []} bind:status={workflowStatus} register={(value) => { workflowCommands = value; }}/></div>
    <div class="authoring-page" hidden={view !== 'Creative'}><CreativeCanvas active={view === 'Creative'} onSelection={(id) => { inspectedNodes.Creative = id; }} {requestReopen} bind:status={creativeStatus} register={(value) => { creativeCommands = value; }}/></div>
    {#if view === 'Sessions'}
      <section class="conversation" aria-labelledby="conversation-title">
        <div class="conversation-heading">
          <h1 id="conversation-title">Conversation</h1>
          <Feedback message="U0 | Simulation only"/>
        </div>
        <div class="conversation-body">
          <div>
            <h2>No conversation yet</h2>
            <Feedback kind="empty" message="Live sessions are unavailable in this build."/>
          </div>
        </div>
      </section>
    {:else if view === 'Runs'}
      <section class="placeholder">
        <div class="workspace-caption">U0 | Simulation only</div>
        <h1>Execution trace</h1>
        <Feedback kind="empty" message="No run evidence. This build cannot execute a workflow or record provider activity."/>
      </section>
    {/if}
      </div>
      {#if inspector}
        <WorkspaceDock panel={inspector} {narrow} resize={(width) => setPanel('Inspector', { width })} close={() => closeNarrowPanel('Inspector')}>
          {#if view === 'Agents' && agent}
              <label for="agent-name">Agent name <Input onfocus={() => agentDraft.beginEdit()} onblur={() => agentDraft.endEdit()} id="agent-name" class="studio-field" bind:ref={nameInput} value={agent.label} oninput={(event) => edit('label', event.currentTarget.value)} /></label>
              <label for="agent-instructions">Agent instructions <Textarea onfocus={() => agentDraft.beginEdit()} onblur={() => agentDraft.endEdit()} id="agent-instructions" class="studio-field" aria-describedby="agent-readiness" placeholder="Describe what this agent should do" value={String(agent.values.instructions ?? '')}
                oninput={(event) => edit('instructions', event.currentTarget.value)}/></label>
              <p class="readiness" id="agent-readiness">{agent.values.instructions ? 'Instructions configured' : 'Add instructions before running this agent. You can save it as a draft now.'}</p>
          {:else if inspected}
            <dl><dt>Name</dt><dd>{inspected.label}</dd><dt>Type</dt><dd>{currentWorkspace.graph.nodeTypes.find(type => type.id === inspected.type)?.label ?? inspected.type}</dd></dl>
            <p class="readiness">Edit this object on the canvas.</p>
          {/if}
          <div class="object-actions">
            <Button.Root class="action" onclick={() => {
              if (narrow) void closeNarrowPanel('Inspector');
              commands.navigation?.reveal(inspected.id);
            }}>Reveal selected object</Button.Root>
            <Button.Root class="action" onclick={deleteSelected}>Delete this object</Button.Root>
          </div>
        </WorkspaceDock>
      {/if}
    </div>
  </main>
  <AlertDialog.Root bind:open={confirmReopen}>
    <AlertDialog.Overlay/>
    <AlertDialog.Content>
      <AlertDialog.Title>Reopen saved draft?</AlertDialog.Title>
      <AlertDialog.Description>Reopening replaces unsaved edits in this workspace. Cancel to keep editing or save a copy first.</AlertDialog.Description>
      <div class="dialog-actions">
        <AlertDialog.Cancel>Keep editing</AlertDialog.Cancel>
        <AlertDialog.Action onclick={() => { confirmReopen = false; reopenAction?.(); }}>Reopen saved draft</AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Root>
  <nav class="page-dock" aria-label="Studio views">
    {#each pages as item (item)}
      <Button.Root class="tab" aria-current={view === item ? 'page' : undefined} onclick={() => view = item}>{item}</Button.Root>
    {/each}
  </nav>
</div></ControlScope>

<style>
  :global(body) { margin: 0; }
  :global(.studio) {
    --vict-font-family: "Segoe UI", system-ui, sans-serif;
    --vict-font-sizeBase: 13px;
    --vict-color-bg: #181819;
    --vict-color-surface: #202021;
    --vict-color-text: #efeff0;
    --vict-color-muted: #aaaab0;
    --vict-color-textMuted: var(--vict-color-muted);
    --vict-color-danger: #ff9b9b;
    --vict-color-border: #363638;
    --vict-color-accent: #b2a4ff;
    --vict-color-focusRing: var(--vict-color-accent);
    --studio-raised: #29292b;
    background: var(--vict-color-bg);
    color: var(--vict-color-text);
  }
  .studio-shell {
    min-height: 100dvh;
    display: flex; flex-direction: column;
  }
  header, .workbar, .tools, .group, nav, .project, footer { display: flex; align-items: center; gap: .5rem; }
  header { min-height: 44px; padding: 4px 14px; justify-content: space-between; flex-wrap: wrap; border-bottom: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .project { gap: 12px; }
  .project strong { font-weight: 500; }
  .wordmark { font-size: 11px; font-weight: 700; letter-spacing: .15em; border-right: 1px solid var(--vict-color-border); padding-right: 12px; }
  .save-state, footer, .readiness { color: var(--vict-color-muted); font-size: 11px; }
  .save-state { min-width: 0; }
  .save-state :global(.vict-state) { margin: 0; padding: 0; border: 0; background: transparent; color: inherit; }
  .draft-feedback :global(.vict-alert) { margin: 0; padding: 0 0 0 8px; border-width: 0 0 0 2px; border-radius: 0; }
  .draft-feedback { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 14px; border-bottom: 1px solid var(--vict-color-border); }
  .workbar { min-height: 38px; justify-content: space-between; flex-wrap: wrap; padding: 3px 14px; border-bottom: 1px solid var(--vict-color-border); }
  .tools { flex-wrap: wrap; }
  .group { gap: 0; }
  .group + .group { border-left: 1px solid var(--vict-color-border); padding-left: 8px; }
  h1, h2 { margin: 0; line-height: 1.3; font-size: 13px; font-weight: 600; }
  :global(.studio .action), :global(.studio .tab) { cursor: pointer; border: 0; color: var(--vict-color-muted); background: transparent; padding: 4px 8px; border-radius: 2px; white-space: nowrap; }
  :global(.studio .action:hover:not(:disabled)), :global(.studio .tab:hover) { background: var(--studio-raised); color: var(--vict-color-text); }
  :global(.studio .icon-action) { display: grid; place-items: center; width: 32px; height: 30px; padding: 0; }
  :global(.studio .icon-action[aria-pressed='true']) { background: var(--studio-raised); color: var(--vict-color-text); }
  :global(.studio .tab[aria-current]) { color: var(--vict-color-accent); box-shadow: inset 0 -1px var(--vict-color-accent); }
  :global(.studio .primary) { background: var(--studio-raised); color: var(--vict-color-text); padding: 5px 11px; }
  .canvas { position: relative; height: max(25rem, calc(100dvh - 183px)); overflow: hidden; }
  .canvas :global(.graph-viewport) { height: 100% !important; --vict-color-surface: var(--vict-color-bg); }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: #353537; }
  .empty { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 10px; pointer-events: none; }
  .empty :global(button) { pointer-events: auto; }
  .empty h2 { color: var(--vict-color-muted); font-weight: 400; }
  .canvas-tools { position: absolute; top: 8px; left: 8px; display: flex; background: var(--vict-color-surface); }
  .node { width: 15rem; background: var(--studio-raised); border-radius: 3px; box-shadow: 0 5px 16px #0005; padding: 10px; }
  .node.active { box-shadow: 0 0 0 1px var(--vict-color-accent), 0 5px 16px #0005; }
  .node:not(.active):hover { background: #303032; }
  .canvas :global(.composed-graph-node.selected) { outline: none; }
  .node-heading { cursor: grab; display: flex; align-items: center; gap: 8px; }
  .node-heading strong { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }
  .node-kind { display: grid; place-items: center; width: 20px; height: 20px; flex: none; background: var(--vict-color-bg); font-size: 11px; color: var(--vict-color-muted); }
  label { display: grid; gap: 4px; margin-top: 10px; font-size: 12px; color: var(--vict-color-muted); }
  :global(.studio .studio-field) { color: var(--vict-color-text); border: 0; border-radius: 2px; background: var(--vict-color-bg); padding: 6px 8px; min-width: 0; width: 100%; }
  :global(.studio .agent-menu) { z-index: 10; width: max-content; min-width: 0; max-width: min(300px, 85vw); max-height: 50vh; overflow: auto; padding: 4px; background: var(--studio-raised); border: 1px solid var(--vict-color-border); border-radius: 3px; }
  :global(.studio .agent-menu-item) { display: flex; align-items: center; justify-content: flex-start; gap: 6px; padding: 4px 8px; cursor: pointer; }
  :global(.studio .agent-menu-item[data-highlighted]) { background: var(--vict-color-bg); }
  :global(.studio .agent-menu-item::before) { content: none; }
  .agent-menu-label { min-width: 0; overflow-wrap: anywhere; }
  .menu-current { color: var(--vict-color-accent); width: 14px; flex: none; }
  :global(.studio textarea.studio-field) { min-height: 3.5rem; resize: vertical; }
  :global(.studio #agent-instructions) { min-height: 7rem; }
  :global(.studio .graph-viewport .svelte-flow__node:focus-visible) {
    outline: 3px solid var(--vict-color-focusRing);
    outline-offset: 4px;
  }
  :global(.studio .studio-field::placeholder) { color: var(--vict-color-muted); }
  .readiness { margin: 8px 0 0; }
  footer { justify-content: space-between; padding: 3px 14px; border-top: 1px solid var(--vict-color-border); }
  .dialog-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
  .menu-strip { display: flex; align-items: center; gap: 8px; padding: 3px 14px; border-bottom: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .project span { color: var(--vict-color-muted); }
  .panel-controls { display: flex; gap: 2px; margin-left: auto; }
  .panel-controls :global(.panel-toggle[aria-pressed=true]) { color: var(--vict-color-accent); background: var(--studio-raised); }
  .view-tools, .object-actions { display: flex; gap: 4px; flex-wrap: wrap; padding: 4px 12px; }
  .view-tools { margin-left: auto; padding: 0; }
  main { flex: 1; min-width: 0; }
  .desk { display: flex; align-items: stretch; min-height: 0; }
  .stage { flex: 1; min-width: 0; }
  dl { font-size: 12px; }
  dt { color: var(--vict-color-muted); margin-top: 8px; }
  dd { margin: 2px 0 0; overflow-wrap: anywhere; }
  :global(.studio .library-row) { display: block; width: 100%; text-align: left; margin-top: 8px; overflow: hidden; text-overflow: ellipsis; }
  :global(.studio .library-row[aria-pressed=true]) { color: var(--vict-color-accent); background: var(--studio-raised); }
  .conversation-workspace, .conversation-workspace .stage { display: flex; flex-direction: column; }
  .conversation-workspace .desk, .conversation { flex: 1; }
  .conversation { display: flex; flex-direction: column; min-width: 0; }
  .conversation-heading {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
    min-height: 44px; padding: 6px clamp(14px, 3vw, 36px); border-bottom: 1px solid var(--vict-color-border);
  }
  .conversation-heading h1 { font-size: 16px; }
  .conversation-heading :global(.vict-state) { margin: 0; padding: 0; border: 0; background: transparent; color: var(--vict-color-muted); }
  .conversation-body { flex: 1; display: grid; place-items: center; padding: 24px; text-align: center; }
  .conversation-body h2 { font-size: 15px; }
  .conversation-body :global(.vict-state) { margin: 0; border: 0; background: transparent; }
  .placeholder { padding: clamp(20px, 5vw, 64px); max-width: 700px; }
  .placeholder h1 { font-size: 24px; margin: 6px 0 18px; }
  .workspace-caption { color: var(--vict-color-muted); }
  .page-dock { position: sticky; z-index: 12; bottom: 0; justify-content: center; gap: 2px; padding: 4px; background: var(--vict-color-surface); border-top: 1px solid var(--vict-color-border); }
  .page-dock :global(.tab) { min-height: 36px; min-width: min(7rem, 19vw); padding-inline: 3px; }
  .page-dock :global(.tab[aria-current]) { background: var(--studio-raised); box-shadow: inset 0 2px var(--vict-color-accent); }
  @media (max-width: 790px) {
    .menu-strip { padding-inline: 6px; }
  }
  .phone { height: 100dvh; }
  .phone header { padding: 0 8px; gap: 3px; flex-wrap: nowrap; }
  .phone .project { font-weight: 650; }
  .phone .project span { color: var(--vict-color-text); }
  .phone .save-state { margin-left: auto; line-height: 1.2; }
  .phone .panel-controls { margin-left: auto; gap: 0; }
  .phone .panel-controls + .save-state { margin-left: 0; }
  .phone :global(.mobile-menu), .phone :global(.phone-fit), .phone :global(.panel-toggle) { min-height: 44px; min-width: 44px; }
  .phone :global(.desktop-command), .phone .workbar, .phone .agent-page footer { display: none; }
  .phone-workspace { min-height: 0; overflow: auto; display: flex; flex-direction: column; }
  .phone-workspace .desk, .phone-workspace .stage, .phone-workspace .authoring-page:not([hidden]),
  .phone-workspace .authoring-page > :global(section), .phone-workspace .agent-page {
    flex: 1; min-height: 0; display: flex; flex-direction: column;
  }
  .phone-workspace .canvas { height: auto; flex: 1; min-height: 180px; }
  .phone .page-dock { flex: none; }

  @media (pointer: coarse) {
    :global(.studio .action), :global(.studio .tab) { min-height: 44px; min-width: 44px; }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.studio *) { scroll-behavior: auto !important; }
  }
</style>
