<script>
  import { GraphWorkspaceV3, GraphViewport, GraphPortRow, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Select } from '@victframework/ui-svelte/catalog/select';
  import { Feedback } from '@victframework/ui-svelte';
  import { GraphDraft } from './graph-draft.svelte.js';
  import DraftActions from './DraftActions.svelte';
  import GraphCommands from './GraphCommands.svelte';
  import { newWorkflowSource, workflowNodeTypes } from './workflow-graph.js';

  let { agents, status = $bindable(), register = () => {}, requestReopen } = $props();
  const draft = new GraphDraft('tori.studio.workflow.v1', newWorkflowSource());
  $effect(() => { status = draft.status; });
  let kind = $state(workflowNodeTypes[0].id);
  let from = $state('');
  let to = $state('');
  let viewportVersion = $state(0);
  let graph = $derived(parseGraphV3(draft.source).graph);
  let canConnect = $derived(endpoints('output').some(port => port.value === from) && endpoints('input').some(port => port.value === to));
  const endpoints = (direction) => graph.nodes.flatMap(node =>
    workflowNodeTypes.find(type => type.id === node.type).ports
      .filter(port => port.direction === direction)
      .map(port => ({ value: JSON.stringify([node.id, port.id]), label: `${node.label} · ${port.label}` })),
  );

  function agentOptions(resource) {
    const options = [{ value: 'unconfigured', label: 'Unconfigured' },
      ...agents.map(agent => ({ value: agent.id, label: agent.label }))];
    if (resource && !options.some(option => option.value === resource)) {
      options.push({ value: resource, label: 'Missing agent' });
    }
    return options;
  }

  function apply(frame, operation) {
    frame.onOutput('operation', JSON.stringify([operation]));
  }

  function addNode(frame) {
    apply(frame, { type: 'addNode', nodeType: kind, position: { x: 44 + graph.nodes.length % 3 * 235, y: 48 + Math.floor(graph.nodes.length / 3) * 180 + graph.nodes.length % 2 * 24 } });
  }

  function connect(frame) {
    const [source, sourcePort] = JSON.parse(from);
    const [target, targetPort] = JSON.parse(to);
    apply(frame, { type: 'connect', edge: { source, sourcePort, target, targetPort } });
  }
</script>

{#snippet picker(label, value, options, change)}
  <Select.Root type="single" {value} onValueChange={change}>
    <Select.Trigger class="workflow-picker" aria-label={label}>
      {options.find(option => option.value === value)?.label ?? `Choose ${label.toLowerCase()}`}
    </Select.Trigger>
    <Select.Portal>
      <Select.Content sideOffset={6} align="start">
        {#each options as option (option.value)}
          <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Portal>
  </Select.Root>
{/snippet}

{#if draft.error}
  <div class="commands">
    <Feedback kind="error" message={draft.error}/>
    <Button.Root class="action" onclick={() => draft.download('tori-workflow.json')}>Download draft</Button.Root>
  </div>
{/if}
{#snippet body(frame)}
  <article>
    <strong class="vict-graph-drag-handle">{frame.props.label}</strong>
    {#if frame.props.nodeType === 'run-agent'}
      <div class="nodrag nopan nowheel">
        {@render picker('Agent reference', frame.state.resource || 'unconfigured', agentOptions(frame.state.resource),
          value => frame.onStateChange('resource', value === 'unconfigured' ? '' : value))}
      </div>
    {/if}
    {#each workflowNodeTypes.find(type => type.id === frame.props.nodeType).ports as port (port.id)}
      <GraphPortRow props={{ id: port.id }} nodeId={port.id} occurrenceKey={port.id}/>
    {/each}
  </article>
{/snippet}
{#snippet content(frame)}
  <GraphCommands register={(workspace) => register({
    workspace, add: () => addNode(frame), addLabel: 'Add selected node type',
    save: () => draft.save(), reopen: () => draft.saved === null ? undefined : draft.reopen(),
    get dirty() { return draft.status === 'Unsaved edits'; },
    get canReopen() { return draft.saved !== null; },
    undo: () => workspace.undo(), redo: () => workspace.redo(), get fit() { return graph.nodes.length ? () => viewportVersion += 1 : undefined; }
  })}/>
  <div class="commands">
    <h1>Workflows</h1>
    <span class="simulation">Execution simulation</span>
    <DraftActions {draft} {requestReopen}/>
  </div>
  <div class="commands">
    {@render picker('Node', kind, workflowNodeTypes.map(type => ({ value: type.id, label: type.label })), value => kind = value)}
    <Button.Root class="action primary" onclick={() => addNode(frame)}>Add node</Button.Root>
    <Button.Root class="action" onclick={() => frame.onOutput('undo')}>Undo</Button.Root>
    <Button.Root class="action" onclick={() => frame.onOutput('redo')}>Redo</Button.Root>
    <Button.Root class="action" disabled={!graph.nodes.length} onclick={() => viewportVersion += 1}>Fit view</Button.Root>
  </div>
  <div class="commands">
    {@render picker('Output', from, endpoints('output'), value => from = value)}
    {@render picker('Input', to, endpoints('input'), value => to = value)}
    <Button.Root class="action primary" disabled={!canConnect} onclick={() => connect(frame)}>Connect</Button.Root>
    <span class="simulation">Connect ports with matching types. Use the pickers for a keyboard route and connection diagnostics.</span>
  </div>
  <div class="canvas">
    {#key viewportVersion}<GraphViewport props={{ label: 'Workflow canvas' }} nodeId="workflow-canvas" occurrenceKey="workflow-canvas"/>{/key}
  </div>
{/snippet}
<GraphWorkspaceV3 props={{ graph: draft.source, label: 'Workflow graph' }}
  io={{ emit: (name, value) => { if (name === 'graphChange') draft.edit(value); }, scopedSlots: { content, body } }}
  nodeId="workflow" occurrenceKey="workflow"/>

<style>
  .commands :global(.workflow-picker) { width: auto; max-width: 100%; }
  .commands { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 4px 14px; border-bottom: 1px solid var(--vict-color-border); }
  h1 { font-size: 13px; margin: 0 auto 0 0; }
  .simulation { color: var(--vict-color-muted); font-size: 11px; }
  .canvas :global(.graph-viewport) { height: max(24rem, calc(100dvh - 245px)) !important; --vict-color-surface: var(--vict-color-bg); }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: #353537; }
  article { width: 178px; background: var(--studio-raised); padding: 10px; }
  strong { cursor: grab; }
</style>
