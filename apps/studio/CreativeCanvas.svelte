<script>
  import { GraphWorkspaceV3, GraphViewport, emptyGraphV3, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { serializeGraphV3 } from '@victframework/ui-flow-svelte/model';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Feedback } from '@victframework/ui-svelte';
  import { Textarea } from '@victframework/ui-ai-svelte';
  import { GraphDraft } from './graph-draft.svelte.js';
  import DraftActions from './DraftActions.svelte';
  import GraphCommands from './GraphCommands.svelte';

  let { status = $bindable(), register = () => {}, requestReopen } = $props();
  let comparing = $state(false);
  const directions = [
    ['metallic', 'Metallic', 'Reflective aluminum, machined edges and hard directional light.'],
    ['biological', 'Biological', 'Translucent membranes, branching veins and diffuse warm light.'],
    ['architectural', 'Architectural', 'Layered concrete, generous voids and long cast shadows.'],
  ];
  const initial = serializeGraphV3({
    ...emptyGraphV3(),
    nodeTypes: [{
      id: 'direction', label: 'Direction', ports: [],
      parameters: { notes: { type: 'string', label: 'Direction notes', default: '' } },
    }],
    nodes: directions.map(([id, label, notes], index) => ({
      id, label, type: 'direction', values: { notes },
      position: { x: 20 + index * 230, y: 40 + index % 2 * 25 },
    })),
  });
  const draft = new GraphDraft('tori.studio.creative.v1', initial);
  let graph = $derived(parseGraphV3(draft.source).graph);
  $effect(() => { status = draft.status; });

  function branch(frame, node) {
    const id = crypto.randomUUID();
    const base = `${node.label} variation`;
    let label = base;
    let index = 2;
    while (graph.nodes.some(direction => direction.label === label)) label = `${base} ${index++}`;
    frame.onOutput('operation', JSON.stringify([
      { type: 'addNode', nodeType: 'direction', id, position: { x: node.position.x, y: node.position.y + 165 } },
      { type: 'setLabel', nodeId: id, label },
      { type: 'setParameter', nodeId: id, key: 'notes', value: node.values.notes },
    ]));
  }
</script>

{#if draft.error}
  <div class="commands">
    <Feedback kind="error" message={draft.error}/>
    <Button.Root class="action" onclick={() => draft.download('tori-creative.json')}>Download draft</Button.Root>
  </div>
{/if}

{#snippet body(frame)}
  <article class="direction">
    <strong class="vict-graph-drag-handle">{frame.props.label}</strong>
    <Textarea class="studio-field" aria-label={`${frame.props.label} notes`}
      value={String(frame.state.notes ?? '')} onchange={(event) => frame.onStateChange('notes', event.currentTarget.value)}/>
  </article>
{/snippet}

{#snippet content(frame)}
  <GraphCommands register={(workspace) => register({
    workspace, addLabel: 'Branch selected direction',
    get add() {
      const direction = graph.nodes.find(node => workspace.selection.nodes.includes(node.id));
      return direction ? () => branch(frame, direction) : undefined;
    },
    save: () => draft.save(), reopen: () => draft.saved === null ? undefined : draft.reopen(),
    get dirty() { return draft.status === 'Unsaved edits'; },
    get canReopen() { return draft.saved !== null; },
    undo: () => workspace.undo(), redo: () => workspace.redo()
  })}/>
  <div class="commands">
    <h1>Creative</h1>
    <Button.Root class="action" aria-expanded={comparing} aria-controls="direction-comparison"
      onclick={() => comparing = !comparing}>Compare directions</Button.Root>
    <Button.Root class="action" onclick={() => frame.onOutput('undo')}>Undo</Button.Root>
    <Button.Root class="action" onclick={() => frame.onOutput('redo')}>Redo</Button.Root>
    <DraftActions {draft} {requestReopen}/>
  </div>
  <section id="direction-comparison" class="comparison" hidden={!comparing} aria-label="Direction comparison">
    {#each graph.nodes as node (node.id)}
      <article>
        <h2>{node.label}</h2>
        <p>{node.values.notes || 'No notes yet'}</p>
        <Button.Root class="action" aria-label={`Branch ${node.label}`} onclick={() => branch(frame, node)}>Branch</Button.Root>
      </article>
    {/each}
  </section>
  <div class="canvas"><GraphViewport props={{ label: 'Creative canvas' }} nodeId="creative-canvas" occurrenceKey="creative-canvas"/></div>
{/snippet}

<GraphWorkspaceV3 props={{ graph: draft.source, label: 'Creative graph' }}
  io={{ emit: (name, value) => { if (name === 'graphChange') draft.edit(value); }, scopedSlots: { content, body } }}
  nodeId="creative" occurrenceKey="creative"/>

<style>
  .commands { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 4px 14px; border-bottom: 1px solid var(--vict-color-border); }
  h1 { font-size: 13px; margin: 0 auto 0 0; }
  h2 { font-size: 13px; margin: 0; }
  .direction { width: 190px; background: var(--studio-raised); padding: 10px; }
  .direction strong { display: block; margin-bottom: 8px; cursor: grab; }
  .comparison:not([hidden]) { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); }
  .comparison article { padding: 10px 14px; border: 1px solid var(--vict-color-border); background: var(--vict-color-surface); }
  .comparison p { color: var(--vict-color-muted); margin: 4px 0 0; overflow-wrap: anywhere; white-space: pre-wrap; }
  .canvas :global(.graph-viewport) { height: max(24rem, calc(100dvh - 195px)) !important; --vict-color-surface: var(--vict-color-bg); }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: #353537; }
</style>
