<script>
  import GraphHost from './GraphHost.svelte';
  import WorkspaceCanvas from './WorkspaceCanvas.svelte';
  import { GraphPortRow, GraphWorkspaceV3, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Dialog } from '@victframework/ui-svelte/catalog/dialog';
  import { Feedback } from '@victframework/ui-svelte';
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import { project } from './project-storage.js';
  import { GraphDraft } from './graph-draft.svelte.js';
  import GraphCommands from './GraphCommands.svelte';
  import Choice from './Choice.svelte';
  import CreativeSimulation from './CreativeSimulation.svelte';
  import { creativeContext, creativeInput, creativeSource, newCreativeSource, referenceEdge } from './creative-graph.js';

  let { status = $bindable(), register = () => {}, active, workspace, openRun, convertToWorkflow } = $props();
  let graphWorkspace = $state.raw();
  let navigation = $state.raw({});
  let comparing = $state(false);
  let linking = $state(false);
  let from = $state('');
  let to = $state('');
  let linkError = $state('');
  let simulating = $state(false);
  const draft = new GraphDraft('tori.studio.creative.v1', newCreativeSource(project !== 'blank'), creativeSource);
  let graph = $derived(parseGraphV3(draft.source).graph);
  let directions = $derived(graph.nodes.filter(node => node.type === 'direction'));
  let selected = $derived(graphWorkspace?.selection.nodes.length === 1 && !graphWorkspace.selection.edges.length
    ? directions.find(node => node.id === graphWorkspace.selection.nodes[0]) : undefined);
  let simulationInput = $derived(selected && creativeInput(graph, selected));
  let context = $derived(selected && creativeContext(graph, selected));
  let referenceOptions = $derived(options(graph.nodes));

  $effect(() => { status = draft.status; });

  function options(nodes) {
    return nodes.map(node => ({
      value: node.id,
      label: nodes.some(other => other.id !== node.id && other.label === node.label)
        ? node.label + ' · ' + node.id.slice(0, 8) : node.label,
    }));
  }

  function uniqueLabel(base) {
    let label = base;
    let index = 2;
    while (graph.nodes.some(node => node.label === label)) label = base + ' ' + index++;
    return label;
  }

  function addDirection(parent) {
    const id = crypto.randomUUID();
    const label = uniqueLabel(parent ? parent.label + ' variation' : 'Direction');
    const position = {
      x: parent?.position.x ?? 20 + directions.length % 3 * 245,
      y: graph.nodes.length ? Math.max(...graph.nodes.map(node => node.position.y)) + 220 : 40,
    };
    const operations = [
      { type: 'addNode', nodeType: 'direction', id, position },
      { type: 'setLabel', nodeId: id, label },
    ];
    if (parent) operations.push(
      { type: 'setParameter', nodeId: id, key: 'notes', value: parent.values.notes ?? '' },
      { type: 'setParameter', nodeId: id, key: 'branchOf', value: parent.id },
      { type: 'setParameter', nodeId: id, key: 'branchRevision', value: graph.revision },
      { type: 'connect', edge: referenceEdge(parent.id, id) },
    );
    graphWorkspace.apply(operations);
  }

  function prefer(id) {
    const operations = directions.filter(node => Boolean(node.values.preferred) !== (node.id === id))
      .map(node => ({ type: 'setParameter', nodeId: node.id, key: 'preferred', value: node.id === id }));
    if (operations.length) graphWorkspace.apply(operations);
  }

  function connect() {
    const edge = referenceEdge(from, to);
    const issue = graphWorkspace.connectionIssue(edge);
    if (issue) { linkError = issue.message; return; }
    graphWorkspace.apply([{ type: 'connect', edge }]);
    linking = false;
  }

  function select(id) {
    graphWorkspace.select({ nodes: [id], edges: [] });
    void navigation.reveal?.(id);
  }
</script>

{#if draft.error}
  <div class="commands">
    <Feedback kind="error" message={draft.error}/>
    <Button.Root class="action" onclick={() => draft.download('tori-creative.json')}>Download draft</Button.Root>
  </div>
{/if}

{#snippet notes(frame, label)}
  <Textarea onfocus={() => draft.beginEdit()} onblur={() => draft.endEdit()} class="studio-field" aria-label={label}
    value={String(frame.state.notes ?? '')} oninput={(event) => frame.onStateChange('notes', event.currentTarget.value)}/>
{/snippet}

{#snippet body(frame)}
  <article class="direction" data-tori-node={frame.props.nodeId}>
    <strong class="vict-graph-drag-handle">{frame.props.label}</strong>
    {#if frame.props.nodeType === 'idea'}<p class="node-role">Source idea</p>{/if}
    {@render notes(frame, frame.props.label + ' notes')}
    <GraphPortRow props={{ id: 'reference-in' }} nodeId="reference-in" occurrenceKey="reference-in"/>
    <GraphPortRow props={{ id: 'reference-out' }} nodeId="reference-out" occurrenceKey="reference-out"/>
  </article>
{/snippet}

{#snippet inspect(node)}
  {@const frame = graphWorkspace.frame(node, 'creative-inspector')}
  <div class="fields">
    <label for="creative-object-name">Name</label>
    <Input id="creative-object-name" class="studio-field" value={node.label}
      onfocus={() => draft.beginEdit()} onblur={() => draft.endEdit()}
      oninput={event => graphWorkspace.apply([{ type: 'setLabel', nodeId: node.id, label: event.currentTarget.value }])}/>
    {@render notes(frame, 'Direction notes in Inspector')}
    {#if node.type === 'direction'}
      {@const binding = creativeContext(graph, node)}
      <p>Reference links are associations. Choose a context source to include its notes in a simulation.</p>
      <Choice label="Explicit context source" value={frame.state.context || 'none'}
        options={[{ value: 'none', label: 'No bound context' }, ...options(binding.references)]}
        change={value => frame.onStateChange('context', value === 'none' ? '' : value)}/>
      {#if binding.invalid}<Feedback kind="warning" message="Bound reference is missing. Rebind or clear it."/>
      {:else if binding.snapshot}<p>Context preview: {binding.snapshot.notes}</p>{/if}
      {#if frame.state.branchOf}
        <p>Branched from {frame.state.branchOf} at revision {frame.state.branchRevision}.</p>
      {/if}
      <Button.Root class="action" aria-pressed={Boolean(frame.state.preferred)} onclick={() => prefer(node.id)}>Preferred direction</Button.Root>
    {/if}
  </div>
{/snippet}

{#snippet content()}
  <GraphCommands register={(current) => {
    graphWorkspace = current;
    register({
      workspace: current, addLabel: 'Add direction', add: () => addDirection(),
      branchLabel: 'Branch selected direction',
      get branch() { return selected ? () => addDirection(selected) : undefined; },
      inspect, draft,
      save: () => draft.save(), reopen: () => draft.saved === null ? undefined : draft.reopen(),
      get dirty() { return draft.dirty; },
      get canReopen() { return draft.saved !== null; },
      get navigation() { return navigation; },
      get undo() { return draft.canUndo() ? () => current.undo() : undefined; },
      get redo() { return draft.canRedo() ? () => current.redo() : undefined; }
    });
  }}/>
  <div class="commands">
    <Button.Root class="action" aria-expanded={comparing} aria-controls="direction-comparison"
      onclick={() => comparing = !comparing}>Compare directions</Button.Root>
    <Button.Root class="action" onclick={() => addDirection()}>Add direction</Button.Root>
    <Button.Root class="action" disabled={!selected} onclick={() => addDirection(selected)}>Branch selected direction</Button.Root>
    <Button.Root class="action" disabled={graph.nodes.length < 2} onclick={() => {
      from = selected?.id ?? ''; to = ''; linkError = ''; linking = true;
    }}>Link references</Button.Root>
    <Button.Root class="action" disabled={!selected} onclick={() => simulating = true}>Simulate selected direction</Button.Root>
    <Button.Root class="action" disabled={!selected || !convertToWorkflow || context?.invalid || !simulationInput?.notes.trim()}
      onclick={() => convertToWorkflow(simulationInput)}>Create workflow from selection</Button.Root>
  </div>
  <section id="direction-comparison" class="comparison" hidden={!comparing} aria-label="Direction comparison">
    {#each directions as node (node.id)}
      <article>
        <h2>{node.label}</h2>
        <p>{node.values.notes || 'No notes yet'}</p>
        {#if node.values.preferred}<span>Preferred direction</span>{/if}
        <div class="comparison-actions">
          <Button.Root class="action" aria-label={'Select ' + node.label} aria-pressed={selected?.id === node.id} onclick={() => select(node.id)}>Select</Button.Root>
          <Button.Root class="action" aria-label={'Branch ' + node.label} onclick={() => {
            graphWorkspace.select({ nodes: [node.id], edges: [] });
            addDirection(node);
          }}>Branch</Button.Root>
        </div>
      </article>
    {/each}
  </section>
  <div class="canvas"><WorkspaceCanvas {active} label="Creative canvas" register={(value) => { navigation = value; }}/></div>
{/snippet}

<GraphHost {draft}><GraphWorkspaceV3 props={{ graph: draft.source, label: 'Creative graph' }}
  io={{ emit: (name, value) => { if (name === 'graphChange') draft.edit(value); }, scopedSlots: { content, body } }}
  nodeId="creative" occurrenceKey="creative"/></GraphHost>

<Dialog.Root bind:open={linking}>
  <Dialog.Overlay/>
  <Dialog.Content>
    <Dialog.Title>Link references</Dialog.Title>
    <Dialog.Description>Reference links can form cycles. They do not bind context or start a run.</Dialog.Description>
    <div class="fields">
      <Choice label="Reference source" value={from} options={referenceOptions}
        change={value => { from = value; linkError = ''; }}/>
      <Choice label="Reference target" value={to} options={referenceOptions}
        change={value => { to = value; linkError = ''; }}/>
      {#if linkError}<Feedback kind="error" message={linkError}/>{/if}
    </div>
    <Button.Root class="action primary" disabled={!from || !to} onclick={connect}>Connect reference</Button.Root>
    <Dialog.Close>Cancel</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>

<CreativeSimulation bind:open={simulating} input={simulationInput} invalid={context?.invalid} {workspace} {openRun}/>

<style>
  .commands { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 4px 14px; border-bottom: 1px solid var(--vict-color-border); }
  h2 { font-size: 13px; margin: 0; }
  .direction { width: 190px; background: var(--studio-raised); padding: 10px; }
  .direction strong { display: block; margin-bottom: 8px; cursor: grab; }
  .direction :global(.graph-port-row) { min-height: 24px; padding-block: 2px; }
  .node-role { font-size: 11px; color: var(--vict-color-muted); margin: 0 0 8px; }
  .comparison:not([hidden]) { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); max-height: 30dvh; overflow: auto; }
  .comparison article { padding: 10px 14px; border: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .comparison p, .fields p { color: var(--vict-color-muted); margin: 4px 0 0; overflow-wrap: anywhere; white-space: pre-wrap; }
  .comparison-actions { display: flex; gap: 6px; }
  .fields { display: grid; gap: 6px; margin-block: 8px; }
  .canvas { flex: 1; min-height: 180px; --vict-color-surface: var(--vict-color-bg); }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: #353537; }
</style>
