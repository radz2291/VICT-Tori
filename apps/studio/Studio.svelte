<script>
  import { openProject, project, projectKey, projectLabel, resetSamples } from './project-storage.js';
  import ImportDraft from './ImportDraft.svelte';
  import AgentSourceValue from './AgentSourceValue.svelte';
  import Choice from './Choice.svelte';
  import { agentFixtures, workspaceContexts } from './agent-configuration.js';
  import { addAgentSource, agentBindings, agentEdge, agentInputs, agentNodeTypes, agentSource, prepareAgentSource } from './agent-graph.js';
  import StudioSettings from './StudioSettings.svelte';
  import Operations from './Operations.svelte';
  import SimulationDialog from './SimulationDialog.svelte';
  import { SimulationWorkspace } from './simulation-workspace.svelte.js';
  import GraphHost from './GraphHost.svelte';
  import { GraphDraft } from './graph-draft.svelte.js';
  import { AlertDialog } from '@victframework/ui-svelte/catalog/alert-dialog';
  import WorkspaceDock from './WorkspaceDock.svelte';
  import StudioMenu from './StudioMenu.svelte';
  import GraphCommands from './GraphCommands.svelte';
  import { tick, untrack } from 'svelte';
  import { GraphPortRow, GraphWorkspaceV3, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Feedback } from '@victframework/ui-svelte';
  import { Input } from '@victframework/ui-ai-svelte';
  import { MediaIcon } from '@victframework/ui-media-svelte';
  import AgentCanvas from './AgentCanvas.svelte';
  import WorkflowPreview from './WorkflowPreview.svelte';
  import CreativeCanvas from './CreativeCanvas.svelte';
  import { ControlScope } from '@victframework/ui-svelte/controls';

  const key = 'tori.studio.draft.v1';
  const agentDraft = new GraphDraft(key, agentSource(), prepareAgentSource);
  let source = $derived(agentDraft.source);
  let savedSource = $derived(agentDraft.saved);
  let status = $derived(agentDraft.status);
  let draftError = $derived(agentDraft.error);
  let nameInput = $state(null);
  let primitive = $state('text');
  const primitiveOptions = agentNodeTypes.slice(1).map(type => ({ value: type.id, label: type.label }));
  let agentNavigation = $state.raw({});
  const preview = new URLSearchParams(window.location.search).get('preview');
  let view = $state(preview === 'sessions' ? 'Sessions' : preview === 'workflow' ? 'Workflows' : 'Agents');
  let workflowStatus = $state('New local draft');
  let creativeStatus = $state('New local draft');
  const pages = ['Agents', 'Workflows', 'Creative', 'Sessions', 'Runs'];
  const layoutKey = projectKey('tori.studio.docks.v1');
  function readLayouts() {
    try {
      const stored = JSON.parse(localStorage.getItem(layoutKey));
      return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    } catch { return {}; }
  }
  let layouts = $state(readLayouts());
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
  const addAgent = () => addConfiguredAgent();
  let workflowCommands = $state.raw({});
  let creativeCommands = $state.raw({});
  let help = $state(false);
  let confirmReopen = $state(false);
  let confirmSampleReset = $state(false);
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
    const selectionPreference = inspected ? { inspectedId: inspected.id } : null;
    if (selectionPreference) layouts[view] = selectionPreference;
    else delete layouts[view];
    persistPageLayout(selectionPreference);
  }
  let commands = $derived(view === 'Agents' ? {
    draft: agentDraft, save, reopen, dirty: agentDraft.dirty, canReopen: Boolean(savedSource),
    undo: agentDraft.canUndo() ? () => agentWorkspace?.undo() : undefined,
    redo: agentDraft.canRedo() ? () => agentWorkspace?.redo() : undefined,
    navigation: agentNavigation,
    add: addAgent
  } : view === 'Workflows' ? workflowCommands : view === 'Creative' ? creativeCommands : {});
  let currentWorkspace = $derived(view === 'Agents' ? agentWorkspace : commands.workspace);
  let objects = $derived(currentWorkspace?.graph.nodes ?? []);
  let selection = $derived(currentWorkspace?.selection);
  let inspected = $derived(selection?.nodes.length === 1 && !selection.edges.length
    ? objects.find(node => node.id === selection.nodes[0]) : undefined);
  let hasSelection = $derived(Boolean(selection?.nodes.length || selection?.edges.length));
  let library = $derived(panels.find(panel => panel.name === 'Library'));
  let inspector = $derived(panels.find(panel => panel.name === 'Inspector'));
  const restoringSelection = new Set();
  let restoredSelection = $state({});
  $effect(() => {
    if (!currentWorkspace || !objects.length || restoringSelection.has(view)) return;
    const page = view;
    const workspace = currentWorkspace;
    restoringSelection.add(page);
    // Let the renderer finish adopting the loaded source before restoring a
    // semantic selection. Persist only after restoration has settled.
    void tick().then(() => {
      const saved = layouts[page]?.inspectedId;
      const { nodes, edges } = workspace.selection;
      if (saved && !nodes.length && !edges.length && workspace.graph.nodes.some(node => node.id === saved)) {
        workspace.select({ nodes: [saved], edges: [] });
      }
      restoredSelection[page] = true;
    });
  });
  $effect(() => {
    if (!currentWorkspace || !restoredSelection[view]) return;
    const id = inspected?.id ?? null;
    untrack(() => {
      if ((layouts[view]?.inspectedId ?? null) !== id) changeLayout({ inspectedId: id });
    });
  });
  const operations = new SimulationWorkspace();
  const operationBookmark = projectKey('tori.studio.operation-bookmark.v1');
  function readOperationBookmark() {
    try { return JSON.parse(sessionStorage.getItem(operationBookmark) ?? '{}') ?? {}; }
    catch { return {}; }
  }
  const bookmark = readOperationBookmark();
  let sessionId = $state(bookmark.sessionId);
  let runId = $state(bookmark.runId);
  let navigationFeedback = $state('');
  $effect(() => {
    const current = { sessionId, runId };
    try { sessionStorage.setItem(operationBookmark, JSON.stringify(current)); }
    catch { /* The operational records still save independently. */ }
  });
  let importOpen = $state(false);
  let importing = $state.raw();
  let settingsOpen = $state(false);
  let simulationOpen = $state(false);
  let simulationDefinition = $state(null);
  let agentValidation = $state(null);
  let effectiveAgentContext = $derived(workspaceContexts[bindings.workspaceContext?.value]);
  function agentIssues() {
    const issues = [];
    if (!bindings.instructions?.value?.trim()) issues.push('Instructions are required for activation.');
    if (bindings.budget?.value && !/^[1-9]\d*$/.test(bindings.budget.value)) issues.push('Step budget must be a positive whole number.');
    if (agent?.values.lifecycle === 'retired') issues.push('Restore the retired agent before activation.');
    return issues;
  }
  function openSimulation() {
    if (!canSimulate || !currentWorkspace) return;
    simulationDefinition = {
      page: view, id: inspected.id, label: inspected.label, type: inspected.type,
      revision: currentWorkspace.graph.revision,
      ...(agent ? { model: bindings.model?.value, mode: bindings.mode?.value, policy: bindings.policy?.value, workspaceContext: effectiveAgentContext, bindings: Object.fromEntries(Object.entries(bindings).map(([key, binding]) => [key, { sourceId: binding.node.id, value: binding.value }])) } : {}),
      ...commands.simulationContext?.(inspected),
      readiness: commands.readiness?.() ?? (agent ? agentIssues() : [])
    };
    simulationOpen = true;
  }
  async function openDefinition(definition) {
    view = definition.page;
    navigationFeedback = '';
    await tick();
    if (objects.some(node => node.id === definition.id)) {
      currentWorkspace.select({ nodes: [definition.id], edges: [] });
      void commands.navigation?.reveal(definition.id);
      if (currentWorkspace.graph.revision !== definition.revision) {
        navigationFeedback = 'Showing the current draft. The simulated run retains its original revision ' + definition.revision + '.';
      }
    } else {
      navigationFeedback = 'The definition is missing from the current draft. Its simulated run retains the original snapshot.';
    }
  }
  function runCreated(run) {
    runId = run.id;
    sessionId = run.sessionId;
    view = 'Runs';
  }

  async function addConfiguredAgent(label, values = {}) {
    if (!agentWorkspace) return;
    const id = crypto.randomUUID();
    const count = agents.length;
    if (!label) {
      label = 'Agent definition';
      let suffix = 2;
      while (agents.some(node => node.label === label)) label = 'Agent definition ' + suffix++;
    }
    const position = { x: 390 + count % 2 * 650, y: 72 + Math.floor(count / 2) * 840 };
    const operations = [
      { type: 'addNode', id, nodeType: 'agent', position },
      { type: 'setLabel', nodeId: id, label },
    ];
    for (const [index, input] of agentInputs.filter(input => input.id === 'instructions' || values[input.id]).entries()) {
      const source = addAgentSource(input, { x: position.x - 320, y: position.y + index * 170 }, values[input.id]);
      operations.push(...source.operations, { type: 'connect', edge: agentEdge(crypto.randomUUID(), source.id, id, input.id) });
    }
    agentWorkspace.apply(operations);
    await selectAgentObject(id, !narrow);
    if (!narrow) nameInput?.focus();
  }

  async function selectAgentObject(id, fit = false) {
    await tick();
    if (!agentWorkspace.graph.nodes.some(node => node.id === id)) return;
    agentWorkspace.select({ nodes: [id], edges: [] });
    if (fit) void agentNavigation.fit?.();
    else void agentNavigation.reveal?.(id);
  }

  function createSource(type, target, input = agentInputs.find(item => item.source === type)) {
    if (!agentWorkspace || !input) return;
    const count = agentWorkspace.graph.nodes.length;
    const position = target
      ? { x: target.position.x - 320, y: target.position.y }
      : { x: 48 + count % 3 * 300, y: 48 + Math.floor(count / 3) * 180 };
    while (agentWorkspace.graph.nodes.some(node => Math.abs(node.position.x - position.x) < 250 && Math.abs(node.position.y - position.y) < 160)) {
      position.y += 170;
    }
    const source = addAgentSource(input, position);
    if (target) source.operations.push({ type: 'connect', edge: agentEdge(crypto.randomUUID(), source.id, target.id, input.id) });
    else source.operations[1].label = agentNodeTypes.find(node => node.id === type).label;
    agentWorkspace.apply(source.operations);
    void selectAgentObject(source.id, !narrow);
  }

  function rebind(input, sourceId) {
    const existing = bindings[input.id]?.edge;
    if (sourceId === 'unconnected') {
      if (existing) agentWorkspace.apply([{ type: 'remove', selection: { nodes: [], edges: [existing.id] } }]);
      return;
    }
    const sourceNode = graph.nodes.find(node => node.id === sourceId);
    if (!sourceNode || existing?.source === sourceId) return;
    const edge = agentEdge(crypto.randomUUID(), sourceId, agent.id, input.id, sourceNode.type === 'agent' ? 'agent' : 'value');
    if (existing) {
      const { id, ...connection } = edge;
      agentWorkspace.apply([{ type: 'reconnect', edgeId: existing.id, connection }]);
    } else agentWorkspace.apply([{ type: 'connect', edge }]);
  }

  function sourceOptions(input) {
    return [{ value: 'unconnected', label: 'Unconnected' }, ...graph.nodes.filter(node =>
      node.id !== agent.id && (node.type === input.source || (input.id === 'specialist' && node.type === 'agent'))
    ).map(node => ({ value: node.id, label: objectLabel(node) }))];
  }

  async function convertCreative(snapshot) {
    view = 'Workflows';
    await tick();
    workflowCommands.fromCreative?.(snapshot);
  }

  let menus = $derived([
    { name: 'File', items: [{ label: 'Save draft', run: commands.save, hint: 'Ctrl+S' }, { label: 'Reopen saved draft', run: commands.canReopen ? requestReopen : undefined }, { label: 'Export graph draft', run: commands.draft ? () => commands.draft.download('tori-' + view.toLowerCase() + '.json') : undefined },
      { label: 'Import graph draft', run: commands.draft ? () => { importing = commands.draft; importOpen = true; } : undefined },
      { label: 'Studio settings', run: () => settingsOpen = true },
      ...[['studio', 'Open Studio project'], ['blank', 'Open blank project'], ['samples', 'Open sample project']]
        .filter(([id]) => id !== project).map(([id, label]) => ({ label, run: () => openProject(id) })),
      ...(project === 'samples' ? [{ label: 'Reset sample project', run: () => confirmSampleReset = true }] : [])] },
    { name: 'Edit', items: [{ label: 'Undo', run: commands.undo, hint: 'Ctrl+Z' }, { label: 'Redo', run: commands.redo, hint: 'Ctrl+Shift+Z' }, { label: 'Delete selected object', run: hasSelection ? deleteSelected : undefined },
      ...(agent ? [{ label: 'Clone agent', run: () => addConfiguredAgent(agent.label + ' copy', Object.fromEntries(Object.entries(bindings).map(([key, binding]) => [key, binding.value]))) },
        { label: agent.values.lifecycle === 'retired' ? 'Restore agent' : 'Retire agent',
          run: () => edit('lifecycle', agent.values.lifecycle === 'retired' ? '' : 'retired') }] : [])] },
    { name: 'View', items: [
      { label: 'Fit view', run: objects.length ? commands.navigation?.fit : undefined },
      { label: 'Reveal selected object', run: inspected ? () => commands.navigation?.reveal(inspected.id) : undefined },
      { label: 'Zoom in', run: objects.length ? commands.navigation?.zoomIn : undefined },
      { label: 'Zoom out', run: objects.length ? commands.navigation?.zoomOut : undefined }
    ] },
    { name: 'Insert', items: [{ label: commands.addLabel ?? 'Add agent', run: commands.add },
      ...(view === 'Agents' ? [{ label: 'Add Text', run: () => createSource('text') }, { label: 'Add Number', run: () => createSource('number') }] : []),
      ...(view === 'Agents' ? Object.entries(agentFixtures).map(([label, values]) => ({ label: 'Add ' + label + ' fixture', run: () => addConfiguredAgent(label, values) })) : []),
      ...(commands.fixtures ?? []), ...(commands.branchLabel ? [{ label: commands.branchLabel, run: commands.branch }] : [])] },
    { name: 'Run', items: [{ label: 'Start simulated run', run: canSimulate ? openSimulation : undefined }, { label: 'Live execution unavailable in U0' }] },
    { name: 'Window' },
    { name: 'Help', items: [{ label: 'About this workspace', run: () => help = !help }] }
  ]);
  function deleteSelected() {
    if (!hasSelection) return;
    currentWorkspace.apply([{ type: 'remove', selection }]);
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
  let agents = $derived(graph?.nodes.filter(node => node.type === 'agent') ?? []);
  let agent = $derived(view === 'Agents' && inspected?.type === 'agent' ? inspected : undefined);
  let bindings = $derived(agent ? agentBindings(graph, agent.id) : {});
  let canSimulate = $derived(Boolean(inspected && (view === 'Workflows' || (agent && agent.values.lifecycle !== 'retired'))));

  function reopen() { agentDraft.reopen(); }
  function save() { agentDraft.save(); }
  function downloadDraft() { agentDraft.download('tori-draft.json'); }

  function emit(name, value) {
    if (name === 'graphChange') agentDraft.edit(value);
  }

  function objectLabel(node) {
    const matches = objects.filter(item => item.label.trim().toLowerCase() === node.label.trim().toLowerCase());
    return matches.length > 1 ? node.label + ' · ' + (matches.findIndex(item => item.id === node.id) + 1) : node.label;
  }

  async function selectFromLibrary(id) {
    currentWorkspace.select({ nodes: [id], edges: [] });
    if (narrow) await closeNarrowPanel('Library');
    void commands.navigation?.reveal(id);
  }

  function edit(key, value) {
    const operation = key === 'label'
      ? { type: 'setLabel', nodeId: inspected.id, label: value }
      : { type: 'setParameter', nodeId: inspected.id, key, value };
    agentWorkspace?.apply([operation]);
  }
</script>

{#snippet sourceValue(nodeType, value, change, label)}
  {@const input = agentInputs.find(item => item.source === nodeType)}
  {#if input}
    <AgentSourceValue {input} {value} {change} {label} settings={operations.data.settings} {agents} draft={agentDraft}/>
  {/if}
{/snippet}

<svelte:window onkeydown={shortcuts} onstorage={() => operations.refresh()}/>
<ControlScope class="studio"><div class="studio-shell" class:phone={narrow}>
  {#if !narrow}<div class="menu-strip"><span class="wordmark">TORI</span><StudioMenu {menus} {panels} toggle={togglePanel} reset={resetLayout}/></div>{/if}
  <header>
    <div class="project">{#if !narrow}<strong>{projectLabel}</strong><span aria-hidden="true">/</span>{/if}{#if commands.save}<h1>{view}</h1>{:else}<span>{view}</span>{/if}</div>
    {#if panels.length}<div class="panel-controls" role="group" aria-label="Workspace panels">
      {#each panels as panel (panel.name)}
        <Button.Root class="action panel-toggle icon-action" id={'dock-toggle-' + panel.name} aria-label={panel.name} title={panel.name}
          aria-pressed={panel.open} onclick={() => togglePanel(panel.name)}>
          <MediaIcon props={{ name: panel.icon, size: 16 }} nodeId={panel.name} occurrenceKey={panel.name}/>
        </Button.Root>
      {/each}
    </div>{/if}
    {#if commands.save}<div class="document-actions" role="group" aria-label="Draft actions">
      <Button.Root class="action" onclick={commands.save}>Save draft</Button.Root>
      {#if !narrow}<Button.Root class="action" disabled={!commands.canReopen} onclick={requestReopen}>Reopen saved draft</Button.Root>{/if}
      <div class="save-state"><Feedback message={view === 'Agents' ? status : view === 'Workflows' ? workflowStatus : creativeStatus}/></div>
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
  {#if navigationFeedback}<div class="draft-feedback"><Feedback message={navigationFeedback}/><Button.Root class="action" onclick={() => navigationFeedback = ''}>Dismiss navigation status</Button.Root></div>{/if}
  {#if help}<div class="draft-feedback"><Feedback message="TORI Studio · U0 local drafts. Live execution and provider access are unavailable."/><Button.Root class="action" onclick={() => help = false}>Dismiss</Button.Root></div>{/if}
  {#if commands.save && !narrow}
    <div class="workbar" role="group" aria-label="Authoring commands">
      <Button.Root class="action" disabled={!commands.undo} onclick={commands.undo}>Undo</Button.Root>
      <Button.Root class="action" disabled={!commands.redo} onclick={commands.redo}>Redo</Button.Root>
      <Button.Root class="action" disabled={!objects.length} onclick={commands.navigation?.fit}>Fit view</Button.Root>
      <Button.Root class="action" disabled={!objects.length} onclick={commands.navigation?.zoomOut}>Zoom out</Button.Root>
      <Button.Root class="action" disabled={!objects.length} onclick={commands.navigation?.zoomIn}>Zoom in</Button.Root>
      <Button.Root class="action" disabled={!inspected} onclick={() => commands.navigation?.reveal(inspected.id)}>Reveal selected object</Button.Root>
      <Button.Root class="action" disabled={!hasSelection} onclick={deleteSelected}>Delete selected object</Button.Root>
      {#if view !== 'Creative'}<Button.Root class="action" disabled={!canSimulate} onclick={openSimulation}>Start simulated run</Button.Root>{/if}
    </div>
  {/if}
  <main>
    <div class="desk">
      {#if library}
        <WorkspaceDock panel={library} {narrow} resize={(width) => setPanel('Library', { width })} close={() => closeNarrowPanel('Library')}>
          {#each objects as node (node.id)}
            <Button.Root class="action library-row" aria-pressed={selection?.nodes.includes(node.id) ?? false}
              onclick={() => selectFromLibrary(node.id)}>{objectLabel(node)}</Button.Root>
          {/each}
        </WorkspaceDock>
      {/if}
      <div class="stage">
    {#snippet body(frame)}
      {@const type = agentNodeTypes.find(item => item.id === frame.props.nodeType)}
      <article class="node" class:agent-node={frame.props.nodeType === 'agent'} data-tori-node={frame.props.nodeId}>
        <div class="node-heading vict-graph-drag-handle">
          <span class="node-kind" aria-hidden="true">{type.label.slice(0, 1)}</span>
          <strong>{frame.props.label}</strong>
        </div>
        {#if frame.props.nodeType !== 'agent'}
          <p class="source-kind">{type.label}</p>
          {@render sourceValue(frame.props.nodeType, frame.state.value, value => frame.onStateChange('value', value), frame.props.label + ' value')}
        {/if}
        {#each type.ports as port (port.id)}
          <GraphPortRow props={{ id: port.id, showType: frame.props.nodeType !== 'agent' }} nodeId={port.id} occurrenceKey={port.id}/>
        {/each}
      </article>
    {/snippet}
    {#snippet content()}
      <GraphCommands register={(workspace) => { agentWorkspace = workspace; }}/>
      <div class="agent-page">
        <div class="canvas">
          <AgentCanvas active={view === 'Agents'} register={(value) => { agentNavigation = value; }}/>
          {#if !graph?.nodes.length}
            <div class="empty">
              <h2>Start with an agent</h2>
              <Button.Root class="action primary" onclick={addAgent}><span aria-hidden="true">+</span> Add agent</Button.Root>
            </div>
          {:else}
            <div class="canvas-tools" role="group" aria-label="Canvas tools">
              <Button.Root class="action" onclick={addAgent}>Add agent</Button.Root>
              <Choice portal label="Node type" value={primitive} options={primitiveOptions} change={value => primitive = value}/>
              <Button.Root class="action" onclick={() => createSource(primitive)}>Add node</Button.Root>
            </div>
          {/if}
        </div>
        <footer><span>{agents.length} {agents.length === 1 ? 'agent' : 'agents'}</span><span>Execution simulation</span></footer>
      </div>
    {/snippet}
    <div class="authoring-page" hidden={view !== 'Agents'}>
      <GraphHost draft={agentDraft}><GraphWorkspaceV3 props={{ graph: source, label: 'Agent graph' }}
        io={{ emit, scopedSlots: { content, body } }} nodeId="agents" occurrenceKey="agents"/></GraphHost>
    </div>
    <div class="authoring-page" hidden={view !== 'Workflows'}><WorkflowPreview active={view === 'Workflows'} {agents} agentRevision={graph?.revision ?? 0} bind:status={workflowStatus} register={(value) => { workflowCommands = value; }}/></div>
    <div class="authoring-page" hidden={view !== 'Creative'}><CreativeCanvas workspace={operations} openRun={runCreated} convertToWorkflow={convertCreative} active={view === 'Creative'} bind:status={creativeStatus} register={(value) => { creativeCommands = value; }}/></div>
    {#if view === 'Sessions' || view === 'Runs'}
      <Operations page={view} workspace={operations} bind:sessionId bind:runId navigate={(page) => view = page} {openDefinition}/>
    {/if}
      </div>
      {#if inspector}
        <WorkspaceDock panel={inspector} {narrow} resize={(width) => setPanel('Inspector', { width })} close={() => closeNarrowPanel('Inspector')}>
          {#if view === 'Agents' && agent}
              <label for="agent-name">Agent name <Input onfocus={() => agentDraft.beginEdit()} onblur={() => agentDraft.endEdit()} id="agent-name" class="studio-field" bind:ref={nameInput} value={agent.label} oninput={(event) => edit('label', event.currentTarget.value)} /></label>
              <h2 class="inputs-heading">Inputs</h2>
              {#each agentInputs as input (input.id)}
                <div class="agent-binding">
                  <span>{input.label}</span>
                  <Choice portal={!narrow} label={input.label + ' source'} value={bindings[input.id]?.node.id ?? 'unconnected'}
                    options={sourceOptions(input)} change={id => rebind(input, id)}/>
                  {#if bindings[input.id]}
                    <Button.Root class="action" aria-label={'Open ' + input.label + ' source'}
                      onclick={() => selectAgentObject(bindings[input.id].node.id)}>Open source</Button.Root>
                  {:else}
                    <Button.Root class="action" onclick={() => createSource(input.source, agent, input)}>Add {input.label.toLowerCase()} source</Button.Root>
                  {/if}
                </div>
              {/each}
              {#if effectiveAgentContext}
                <section aria-label={effectiveAgentContext.label}>
                  <h2>{effectiveAgentContext.label}</h2>
                  <dl>
                    {#each effectiveAgentContext.records as [id, label, detail] (id)}
                      <dt>{label} · {id}</dt><dd>{detail}</dd>
                    {/each}
                  </dl>
                </section>
              {/if}
              <Button.Root class="action" onclick={() => agentValidation = { id: agent.id, revision: graph.revision, issues: agentIssues() }}>Validate agent</Button.Root>
              {#if agentValidation?.id === agent.id && agentValidation.revision === graph.revision}
                <Feedback message={agentValidation.issues.join(' ') || 'Draft validation passed. Live activation is unavailable in U0.'}/>
              {/if}
              <p class="readiness" id="agent-readiness">{agent.values.lifecycle === 'retired' ? 'Retired agent' : bindings.instructions?.value ? 'System prompt connected' : 'Connect a text source before running this agent. You can save it as a draft now.'}</p>
          {:else if view === 'Agents' && inspected}
            <label for="agent-source-name">Node name <Input id="agent-source-name" class="studio-field" value={inspected.label}
              onfocus={() => agentDraft.beginEdit()} onblur={() => agentDraft.endEdit()} oninput={event => edit('label', event.currentTarget.value)}/></label>
            <p class="source-kind">{agentNodeTypes.find(type => type.id === inspected.type).label}</p>
            {@render sourceValue(inspected.type, inspected.values.value, value => edit('value', value), 'Source value')}
          {:else if inspected}
            <dl><dt>Name</dt><dd>{objectLabel(inspected)}</dd><dt>Type</dt><dd>{currentWorkspace.graph.nodeTypes.find(type => type.id === inspected.type)?.label ?? inspected.type}</dd></dl>
            {#if commands.inspect}{@render commands.inspect(inspected)}{/if}
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
  <AlertDialog.Root bind:open={confirmSampleReset}>
    <AlertDialog.Overlay/>
    <AlertDialog.Content>
      <AlertDialog.Title>Reset the sample project?</AlertDialog.Title>
      <AlertDialog.Description>This restores the sample starting point and removes changes made inside the sample project. The Studio and blank projects are stored separately.</AlertDialog.Description>
      <div class="dialog-actions"><AlertDialog.Cancel>Keep samples</AlertDialog.Cancel><AlertDialog.Action onclick={resetSamples}>Reset samples</AlertDialog.Action></div>
    </AlertDialog.Content>
  </AlertDialog.Root>
  <ImportDraft bind:open={importOpen} draft={importing}/>
  <StudioSettings bind:open={settingsOpen} workspace={operations}/>
  <SimulationDialog bind:open={simulationOpen} definition={simulationDefinition} workspace={operations} complete={runCreated}/>
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
    height: 100dvh;
    display: flex; flex-direction: column;
  }
  header, .workbar, nav, .project, footer { display: flex; align-items: center; gap: .5rem; }
  header { min-height: 44px; padding: 4px 14px; justify-content: space-between; flex-wrap: wrap; border-bottom: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .project { gap: 12px; }
  .project h1 { margin: 0; font-size: 13px; font-weight: 600; }
  .project strong { font-weight: 500; }
  .wordmark { font-size: 11px; font-weight: 700; letter-spacing: .15em; border-right: 1px solid var(--vict-color-border); padding-right: 12px; }
  .save-state, footer, .readiness { color: var(--vict-color-muted); font-size: 11px; }
  .save-state { min-width: 0; }
  .save-state :global(.vict-state) { margin: 0; padding: 0; border: 0; background: transparent; color: inherit; }
  .draft-feedback :global(.vict-alert) { margin: 0; padding: 0 0 0 8px; border-width: 0 0 0 2px; border-radius: 0; }
  .draft-feedback { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 14px; border-bottom: 1px solid var(--vict-color-border); }
  .workbar { min-height: 30px; flex-wrap: wrap; padding: 3px 14px; border-bottom: 1px solid var(--vict-color-border); }
  h2 { margin: 0; line-height: 1.3; font-size: 13px; font-weight: 600; }
  :global(.studio .action), :global(.studio .tab) { cursor: pointer; border: 0; color: var(--vict-color-muted); background: transparent; padding: 4px 8px; border-radius: 2px; white-space: nowrap; }
  :global(.studio .action:hover:not(:disabled)), :global(.studio .tab:hover) { background: var(--studio-raised); color: var(--vict-color-text); }
  :global(.studio .icon-action) { display: grid; place-items: center; width: 32px; height: 30px; padding: 0; }
  :global(.studio .icon-action[aria-pressed='true']) { background: var(--studio-raised); color: var(--vict-color-text); }
  :global(.studio .tab[aria-current]) { color: var(--vict-color-accent); box-shadow: inset 0 -1px var(--vict-color-accent); }
  :global(.studio .primary) { background: var(--studio-raised); color: var(--vict-color-text); padding: 5px 11px; }
  .canvas { position: relative; flex: 1; min-height: 180px; overflow: hidden; }
  .canvas :global(.graph-viewport) { height: 100% !important; --vict-color-surface: var(--vict-color-bg); }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: #353537; }
  .empty { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 10px; pointer-events: none; }
  .empty :global(button) { pointer-events: auto; }
  .empty h2 { color: var(--vict-color-muted); font-weight: 400; }
  .canvas-tools { position: absolute; top: 8px; left: 8px; display: flex; background: var(--vict-color-surface); }
  .node { width: 15rem; background: var(--studio-raised); border-radius: 3px; box-shadow: 0 5px 16px #0005; padding: 10px; }
  .node:hover { background: #303032; }
  .node-heading { cursor: grab; display: flex; align-items: center; gap: 8px; }
  .node-heading strong { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }
  .source-kind { color: var(--vict-color-muted); font-size: 12px; margin: 6px 0; }
  .agent-node :global(.graph-port-row) { min-height: 24px; padding-block: 1px; }
  .agent-binding { display: grid; gap: 4px; margin: 8px 0; }
  .agent-binding > span { color: var(--vict-color-muted); font-size: 12px; }
  .agent-binding :global(button) { justify-self: start; }
  .inputs-heading { margin-top: 14px; }
  .canvas-tools { align-items: center; gap: 4px; max-width: calc(100% - 16px); }
  .canvas-tools :global([data-select-trigger]) { width: auto; min-width: 0; max-width: 45vw; }
  .node-kind { display: grid; place-items: center; width: 20px; height: 20px; flex: none; background: var(--vict-color-bg); font-size: 11px; color: var(--vict-color-muted); }
  label { display: grid; gap: 4px; margin-top: 10px; font-size: 12px; color: var(--vict-color-muted); }
  :global(.studio .studio-field) { color: var(--vict-color-text); border: 0; border-radius: 2px; background: var(--vict-color-bg); padding: 6px 8px; min-width: 0; width: 100%; }
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
  .object-actions { display: flex; gap: 4px; flex-wrap: wrap; padding: 4px 12px; }
  .document-actions { display: flex; align-items: center; gap: 6px; }
  main { flex: 1; min-width: 0; min-height: 0; overflow: auto; display: flex; flex-direction: column; }
  .desk { flex: 1; display: flex; align-items: stretch; min-height: 0; }
  .stage, .authoring-page:not([hidden]), .authoring-page > :global(section), .agent-page {
    flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column;
  }
  :global(.studio .svelte-flow__node.selected) { outline: 2px solid var(--vict-color-accent); }
  dl { font-size: 12px; }
  dt { color: var(--vict-color-muted); margin-top: 8px; }
  dd { margin: 2px 0 0; overflow-wrap: anywhere; }
  :global(.studio .library-row) { display: block; width: 100%; text-align: left; margin-top: 8px; overflow: hidden; text-overflow: ellipsis; }
  :global(.studio .library-row[aria-pressed=true]) { color: var(--vict-color-accent); background: var(--studio-raised); }
  .page-dock { flex: none; z-index: 12; justify-content: center; gap: 2px; padding: 4px; background: var(--vict-color-surface); border-top: 1px solid var(--vict-color-border); }
  .page-dock :global(.tab) { min-height: 36px; min-width: min(7rem, 19vw); padding-inline: 3px; }
  .page-dock :global(.tab[aria-current]) { background: var(--studio-raised); box-shadow: inset 0 2px var(--vict-color-accent); }
  @media (max-width: 790px) {
    .menu-strip { padding-inline: 6px; }
  }
  .phone { height: 100dvh; }
  .phone header { padding: 0 8px; gap: 3px; }
  .phone .document-actions { order: 1; flex-basis: 100%; }
  .phone .project { font-weight: 650; }
  .phone .project span { color: var(--vict-color-text); }
  .phone .save-state { margin-left: auto; line-height: 1.2; }
  .phone .panel-controls { margin-left: auto; gap: 0; }
  .phone :global(.mobile-menu), .phone :global(.phone-fit), .phone :global(.panel-toggle) { min-height: 44px; min-width: 44px; }
  .phone :global(.desktop-command), .phone .workbar, .phone .agent-page footer { display: none; }
  @media (pointer: coarse) {
    :global(.studio .action), :global(.studio .tab) { min-height: 44px; min-width: 44px; }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.studio *) { scroll-behavior: auto !important; }
  }
</style>
