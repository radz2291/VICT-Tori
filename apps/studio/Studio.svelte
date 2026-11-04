<script>
  import { AlertDialog } from '@victframework/ui-svelte/catalog/alert-dialog';
  import StudioMenu from './StudioMenu.svelte';
  import GraphCommands from './GraphCommands.svelte';
  import { tick } from 'svelte';
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
  let source = $state(blank());
  let savedSource = $state(null);
  let selected = $state(null);
  let status = $state('New local draft');
  let draftError = $state('');
  let nameInput = $state(null);
  let inspectorOpen = $state(false);
  let inspectorDismissed = $state(false);
  let viewportVersion = $state(0);
  let view = $state(new URLSearchParams(window.location.search).get('preview') === 'workflow' ? 'Workflows' : 'Agents');
  let workflowStatus = $state('New local draft');
  let creativeStatus = $state('New local draft');
  const pages = ['Agents', 'Workflows', 'Creative', 'Sessions', 'Runs'];
  let layouts = $state({});
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
  let panels = $derived(['Library', 'Inspector', 'Activity'].map(name => ({
    name, open: name === 'Inspector' && view === 'Agents' ? inspectorOpen : Boolean(layouts[view]?.[name])
  })));
  function togglePanel(name) {
    if (name === 'Inspector' && view === 'Agents') return toggleInspector(!inspectorOpen);
    layouts[view] = { ...layouts[view], [name]: !layouts[view]?.[name] };
  }
  function resetLayout() {
    layouts[view] = {};
    if (view === 'Agents') toggleInspector(Boolean(agent));
  }
  let commands = $derived(view === 'Agents' ? {
    save, reopen, dirty: status === 'Unsaved edits', canReopen: Boolean(savedSource), undo: agentWorkspace && (() => agentWorkspace.undo()),
    redo: agentWorkspace && (() => agentWorkspace.redo()), fit: graph?.nodes.length ? () => viewportVersion += 1 : undefined,
    add: addAgent
  } : view === 'Workflows' ? workflowCommands : view === 'Creative' ? creativeCommands : {});
  let currentWorkspace = $derived(view === 'Agents' ? agentWorkspace : commands.workspace);
  let objects = $derived(currentWorkspace?.graph.nodes ?? []);
  let selectedObject = $derived(objects.find(node => currentWorkspace?.selection.nodes.includes(node.id)));
  let menus = $derived([
    { name: 'File', items: [{ label: 'Save draft', run: commands.save, hint: 'Ctrl+S' }, { label: 'Reopen saved draft', run: commands.canReopen ? requestReopen : undefined }] },
    { name: 'Edit', items: [{ label: 'Undo', run: commands.undo, hint: 'Ctrl+Z' }, { label: 'Redo', run: commands.redo, hint: 'Ctrl+Shift+Z' }] },
    { name: 'View', items: [{ label: 'Fit view', run: commands.fit }] },
    { name: 'Insert', items: [{ label: commands.addLabel ?? 'Add agent', run: commands.add }] },
    { name: 'Run', items: [{ label: 'Live execution unavailable in U0' }] },
    { name: 'Window' },
    { name: 'Help', items: [{ label: 'About this workspace', run: () => help = !help }] }
  ]);
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
      draftError = '';
    } catch {
      draftError = 'Could not reopen the saved draft. Your current edits are still here. Download a copy before refreshing.';
    }
  }
  reopen();

  function save() {
    try {
      if (localStorage.getItem(key) !== savedSource) {
        draftError = 'Save blocked. Another tab changed the saved draft. Download your edits before reopening the saved version.';
        return;
      }
      localStorage.setItem(key, source);
      savedSource = source;
      status = 'Draft saved locally';
      draftError = '';
    } catch {
      draftError = 'Could not save to browser storage. Your edits are still here. Free up browser storage and retry Save draft, or download a copy.';
    }
  }

  function downloadDraft() {
    const url = URL.createObjectURL(new Blob([source], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tori-draft.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  async function focusAddedAgent(id, previousCount) {
    selected = id;
    inspectorDismissed = false;
    inspectorOpen = true;
    if (previousCount > 0) viewportVersion += 1;
    await tick();
    nameInput?.focus();
  }

  function toggleInspector(open) {
    inspectorDismissed = !open;
    inspectorOpen = open;
  }

  function edit(frame, key, value) {
    const operation = key === 'label'
      ? { type: 'setLabel', nodeId: agent.id, label: value }
      : { type: 'setParameter', nodeId: agent.id, key, value };
    frame.onOutput('operation', JSON.stringify([operation]));
  }
</script>

<svelte:window onkeydown={shortcuts}/>
<ControlScope class="studio">
  <div class="menu-strip"><span class="wordmark">TORI</span><StudioMenu {menus} {panels} toggle={togglePanel} reset={resetLayout}/></div>
  <header>
    <div class="project"><strong>Untitled project</strong><span aria-hidden="true">/</span><span>{view}</span></div>
    <div class="panel-controls" role="group" aria-label="Workspace panels">
      {#each panels as panel (panel.name)}
        <Button.Root class="action panel-toggle" aria-pressed={panel.open} onclick={() => togglePanel(panel.name)}>{panel.name}</Button.Root>
      {/each}
    </div>
    <div class="save-state">
      {#if view === 'Agents'}<Feedback message={status}/>
      {:else if view === 'Workflows'}<Feedback message={workflowStatus}/>
      {:else if view === 'Creative'}<Feedback message={creativeStatus}/>
      {/if}
    </div>
  </header>
  {#if view === 'Agents' && draftError}
    <div class="draft-feedback">
      <Feedback kind="error" message={draftError}/>
      <Button.Root class="action" onclick={downloadDraft}>Download draft</Button.Root>
    </div>
  {/if}
  {#if help}<div class="draft-feedback"><Feedback message="TORI Studio · U0 local drafts. Live execution and provider access are unavailable."/><Button.Root class="action" onclick={() => help = false}>Dismiss</Button.Root></div>{/if}
  <main>
    <div class="desk">
      {#if layouts[view]?.Library}
        <aside class="dock library" aria-label="Library">
          <h2>Library</h2>
          {#if objects.length}
            {#each objects as node (node.id)}
              <Button.Root class="action library-row" aria-pressed={selectedObject?.id === node.id} onclick={() => currentWorkspace?.select({ nodes: [node.id], edges: [] })}>{node.label}</Button.Root>
            {/each}
          {:else}
            <Feedback kind="empty" message={view === 'Agents' ? 'Add an agent to populate this library.' : 'No library items for this workspace.'}/>
          {/if}
        </aside>
      {/if}
      <div class="stage">
    {#snippet body(frame)}
      <article class="node" class:active={frame.props.nodeId === selected}>
        <div class="node-heading vict-graph-drag-handle">
          <span class="node-kind" aria-hidden="true">A</span>
          <strong>{frame.props.label}</strong>
        </div>
        <label for={`node-instructions-${frame.props.nodeId}`}>Node instructions
          <Textarea id={`node-instructions-${frame.props.nodeId}`} class="studio-field" placeholder="Describe what this agent should do"
            value={String(frame.state.instructions ?? '')}
            onchange={(event) => frame.onStateChange('instructions', event.currentTarget.value)}/>
        </label>
      </article>
    {/snippet}
    {#snippet content(frame)}
      <GraphCommands register={(workspace) => { agentWorkspace = workspace; }}/>
      <div>
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
              <Button.Root class="action icon-action" aria-label="Reopen saved draft" title="Reopen saved draft" disabled={!savedSource} onclick={requestReopen}>
                <MediaIcon props={{ name: 'clock', size: 16 }} nodeId="reopen-icon" occurrenceKey="reopen-icon"/>
              </Button.Root>
            </div>
          </div>
        </div>
        <div class="workspace" class:inspecting={inspectorOpen}>
          <div class="canvas">
            <AgentCanvas active={view === 'Agents'} version={viewportVersion} onclear={() => selected = null}/>
            {#if !graph?.nodes.length}
              <div class="empty">

                <h2>Start with an agent</h2>

                <AddAgent primary onadd={focusAddedAgent} register={(action) => { addAgent = action; }}/>
              </div>
            {:else}
              <div class="canvas-tools" role="group" aria-label="Canvas tools">
                <AddAgent onadd={focusAddedAgent} register={(action) => { addAgent = action; }}/>
                <Button.Root class="action" onclick={() => viewportVersion += 1}>Fit view</Button.Root>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger class="action">Find agent</DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content class="agent-menu" align="start" sideOffset={4}>
                      <DropdownMenu.RadioGroup value={selected ?? ''} onValueChange={(id) => {
                        selected = id;
                        if (!inspectorDismissed) inspectorOpen = true;
                      }}>
                        {#each graph.nodes as node, index (node.id)}
                          <DropdownMenu.RadioItem class="agent-menu-item" value={node.id} textValue={node.label}>
                            <span class="agent-menu-label">{node.label}{graph.nodes.filter(item => item.label === node.label).length > 1 ? ` Â· ${index + 1}` : ''}</span>
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
          {#if inspectorOpen}
            <aside aria-label="Inspector">
              <div class="inspector-heading">
                <h2>Inspector</h2>
              </div>
              {#if agent}
              <label for="agent-name">Agent name <Input id="agent-name" class="studio-field" bind:ref={nameInput} value={agent.label} onchange={(event) => edit(frame, 'label', event.currentTarget.value)} /></label>
              <label for="agent-instructions">Agent instructions <Textarea id="agent-instructions" class="studio-field" aria-describedby="agent-readiness" placeholder="Describe what this agent should do" value={String(agent.values.instructions ?? '')}
                onchange={(event) => edit(frame, 'instructions', event.currentTarget.value)}/></label>
              <p class="readiness" id="agent-readiness">{agent.values.instructions ? 'Instructions configured' : 'Add instructions before running this agent. You can save it as a draft now.'}</p>
              {:else}<Feedback kind="empty" message="Select an agent to inspect." />{/if}
            </aside>
          {/if}
        </div>
        <footer><span>{graph?.nodes.length ?? 0} agents</span><span>Execution simulation</span></footer>
      </div>
    {/snippet}
    <div hidden={view !== 'Agents'}>
      <GraphWorkspaceV3 props={{ graph: source, label: 'Agent graph' }}
        io={{ emit, scopedSlots: { content, body } }} nodeId="agents" occurrenceKey="agents"/>
    </div>
    <div hidden={view !== 'Workflows'}><WorkflowPreview {requestReopen} agents={graph?.nodes ?? []} bind:status={workflowStatus} register={(value) => { workflowCommands = value; }}/></div>
    <div hidden={view !== 'Creative'}><CreativeCanvas {requestReopen} bind:status={creativeStatus} register={(value) => { creativeCommands = value; }}/></div>
    {#if view === 'Sessions' || view === 'Runs'}
      <section class="placeholder">
        <div class="workspace-caption">U0 · Simulation only</div>
        <h1>{view === 'Sessions' ? 'Conversation' : 'Execution trace'}</h1>
        <Feedback kind="empty" message={view === 'Sessions' ? 'No conversation records. This build cannot start a live session.' : 'No run evidence. This build cannot execute a workflow or record provider activity.'}/>
      </section>
    {/if}
      </div>
      {#if view !== 'Agents' && layouts[view]?.Inspector}
        <aside class="dock" aria-label="Inspector">
          <h2>Inspector</h2>
          {#if selectedObject}
            <dl><dt>Name</dt><dd>{selectedObject.label}</dd><dt>Type</dt><dd>{currentWorkspace.graph.nodeTypes.find(type => type.id === selectedObject.type)?.label ?? selectedObject.type}</dd></dl>
            <p class="readiness">Edit this object on the canvas.</p>
          {:else}
            <Feedback kind="empty" message={currentWorkspace ? 'Select an object on the canvas.' : 'There is no record to inspect.'}/>
          {/if}
        </aside>
      {/if}
    </div>
    {#if layouts[view]?.Activity}
      <section class="activity" aria-label="Activity"><h2>Activity</h2><Feedback message="No execution activity. Live execution is unavailable in U0."/></section>
    {/if}
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
    --vict-color-textMuted: var(--vict-color-muted);
    --vict-color-danger: #ff9b9b;
    --vict-color-border: #363638;
    --vict-color-accent: #b2a4ff;
    --vict-color-focusRing: var(--vict-color-accent);
    --studio-raised: #29292b;
    background: var(--vict-color-bg);
    min-height: 100dvh;
    display: flex; flex-direction: column; color: var(--vict-color-text);
  }
  header, .workbar, .tools, .group, nav, .project, .inspector-heading, footer { display: flex; align-items: center; gap: .5rem; }
  header { min-height: 44px; padding: 4px 14px; justify-content: space-between; flex-wrap: wrap; border-bottom: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .project { gap: 12px; }
  .project strong { font-weight: 500; }
  .wordmark { font-size: 11px; font-weight: 700; letter-spacing: .15em; border-right: 1px solid var(--vict-color-border); padding-right: 12px; }
  .save-state, footer, .readiness { color: var(--vict-color-muted); font-size: 11px; }
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
  .workspace { display: grid; grid-template-columns: minmax(0, 1fr); }
  .workspace.inspecting { grid-template-columns: minmax(0, 1fr) 264px; }
  .canvas { position: relative; height: max(25rem, calc(100dvh - 183px)); overflow: hidden; }
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
  :global(.studio .studio-field) { color: var(--vict-color-text); border: 0; border-radius: 2px; background: var(--vict-color-bg); padding: 6px 8px; min-width: 0; width: 100%; }
  :global(.studio .agent-menu) { z-index: 10; width: max-content; min-width: 0; max-width: min(300px, 85vw); max-height: 50vh; overflow: auto; padding: 4px; background: var(--studio-raised); border: 1px solid var(--vict-color-border); border-radius: 3px; }
  :global(.studio .agent-menu-item) { display: flex; align-items: center; justify-content: flex-start; gap: 6px; padding: 4px 8px; cursor: pointer; }
  :global(.studio .agent-menu-item[data-highlighted]) { background: var(--vict-color-bg); }
  :global(.studio .agent-menu-item::before) { content: none; }
  .agent-menu-label { min-width: 0; overflow-wrap: anywhere; }
  .menu-current { color: var(--vict-color-accent); width: 14px; flex: none; }
  :global(.studio textarea.studio-field) { min-height: 3.5rem; resize: vertical; }
  aside :global(textarea.studio-field) { min-height: 7rem; }
  :global(.studio .studio-field::placeholder) { color: var(--vict-color-muted); }
  .readiness { margin: 8px 0 0; }
  footer { justify-content: space-between; padding: 3px 14px; border-top: 1px solid var(--vict-color-border); }
  .dialog-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
  .menu-strip { display: flex; align-items: center; gap: 8px; padding: 3px 14px; border-bottom: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .project span { color: var(--vict-color-muted); }
  .panel-controls { display: flex; gap: 4px; }
  .panel-controls :global(.panel-toggle[aria-pressed=true]) { color: var(--vict-color-accent); background: var(--studio-raised); }
  main { flex: 1; min-width: 0; }
  .desk { display: flex; align-items: stretch; min-height: 0; }
  .stage { flex: 1; min-width: 0; }
  .dock { width: 220px; flex: 0 0 220px; box-sizing: border-box; }
  .dock dl { font-size: 12px; }
  .dock dt { color: var(--vict-color-muted); margin-top: 8px; }
  .dock dd { margin: 2px 0 0; overflow-wrap: anywhere; }
  .library { border-left: 0; border-right: 1px solid var(--vict-color-border); }
  .library :global(.library-row) { display: block; width: 100%; text-align: left; margin-top: 8px; overflow: hidden; text-overflow: ellipsis; }
  .library :global(.library-row[aria-pressed=true]) { color: var(--vict-color-accent); background: var(--studio-raised); }
  .activity { padding: 10px 14px; border-top: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .placeholder { padding: clamp(20px, 5vw, 64px); max-width: 700px; }
  .placeholder h1 { font-size: 24px; margin: 6px 0 18px; }
  .workspace-caption { color: var(--vict-color-muted); }
  .page-dock { position: sticky; z-index: 12; bottom: 0; justify-content: center; gap: 2px; padding: 4px; background: var(--vict-color-surface); border-top: 1px solid var(--vict-color-border); }
  .page-dock :global(.tab) { min-height: 36px; min-width: min(7rem, 19vw); padding-inline: 3px; }
  .page-dock :global(.tab[aria-current]) { background: var(--studio-raised); box-shadow: inset 0 2px var(--vict-color-accent); }
  @media (max-width: 790px) {
    .desk { flex-direction: column; }
    .dock { width: auto; flex: auto; border: 0; border-bottom: 1px solid var(--vict-color-border); }
    .menu-strip { padding-inline: 6px; }
  }
  @media (max-width: 690px) {
    .workspace.inspecting { grid-template-columns: 1fr; }
    .canvas { height: 50dvh; }
    aside { border-left: 0; border-top: 1px solid var(--vict-color-border); }
  }
  @media (pointer: coarse) {
    :global(.studio .action), :global(.studio .tab) { min-height: 44px; min-width: 44px; }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.studio *) { scroll-behavior: auto !important; }
  }
</style>
