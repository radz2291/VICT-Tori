<script>
  import { GraphWorkspaceV3, GraphViewport, GraphPortRow, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Select } from '@victframework/ui-svelte/catalog/select';
  import { newWorkflowSource, workflowNodeTypes } from './workflow-graph.js';

  let source = $state(newWorkflowSource());
  let kind = $state(workflowNodeTypes[0].id);
  let from = $state('');
  let to = $state('');
  let graph = $derived(parseGraphV3(source).graph);
  const endpoints = (direction) => graph.nodes.flatMap(node =>
    workflowNodeTypes.find(type => type.id === node.type).ports
      .filter(port => port.direction === direction)
      .map(port => ({ value: JSON.stringify([node.id, port.id]), label: `${node.label} · ${port.label}` })),
  );

  function apply(frame, operation) {
    frame.onOutput('operation', JSON.stringify([operation]));
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

<h1>Workflow</h1>
<p>R2 preview · Execution simulation</p>
{#snippet body(frame)}
  <article>
    <strong class="vict-graph-drag-handle">{frame.props.label}</strong>
    {#each workflowNodeTypes.find(type => type.id === frame.props.nodeType).ports as port (port.id)}
      <GraphPortRow props={{ id: port.id }} nodeId={port.id} occurrenceKey={port.id}/>
    {/each}
  </article>
{/snippet}
{#snippet content(frame)}
  <div class="commands">
    {@render picker('Node', kind, workflowNodeTypes.map(type => ({ value: type.id, label: type.label })), value => kind = value)}
    <Button.Root onclick={() => apply(frame, { type: 'addNode', nodeType: kind, position: { x: 44 + graph.nodes.length % 3 * 200, y: 48 + Math.floor(graph.nodes.length / 3) * 130 + graph.nodes.length % 2 * 24 } })}>Add node</Button.Root>
    <Button.Root onclick={() => frame.onOutput('undo')}>Undo</Button.Root>
    <Button.Root onclick={() => frame.onOutput('redo')}>Redo</Button.Root>
  </div>
  <div class="commands">
    {@render picker('Output', from, endpoints('output'), value => from = value)}
    {@render picker('Input', to, endpoints('input'), value => to = value)}
    <Button.Root disabled={!from || !to} onclick={() => connect(frame)}>Connect</Button.Root>
  </div>
  <GraphViewport props={{ height: 480 }} nodeId="workflow-canvas" occurrenceKey="workflow-canvas"/>
{/snippet}
<GraphWorkspaceV3 props={{ graph: source, label: 'Workflow graph' }}
  io={{ emit: (name, value) => { if (name === 'graphChange') source = value; }, scopedSlots: { content, body } }}
  nodeId="workflow" occurrenceKey="workflow"/>

<style>
  .commands :global(.workflow-picker) { width: auto; max-width: 100%; }
  .commands { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 8px 0; }
  article { width: 150px; background: var(--studio-raised); padding: 10px; }
  strong { cursor: grab; }
</style>
