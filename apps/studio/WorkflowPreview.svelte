<script>
  import GraphHost from './GraphHost.svelte';
  import WorkspaceCanvas from './WorkspaceCanvas.svelte';
  import { GraphWorkspaceV3, GraphPortRow, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Dialog } from '@victframework/ui-svelte/catalog/dialog';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Select } from '@victframework/ui-svelte/catalog/select';
  import { Feedback } from '@victframework/ui-svelte';
  import { GraphDraft } from './graph-draft.svelte.js';
  import DraftActions from './DraftActions.svelte';
  import GraphCommands from './GraphCommands.svelte';
  import { newWorkflowSource, workflowNodeTypes } from './workflow-graph.js';

  let { agents, status = $bindable(), register = () => {}, requestReopen, onSelection, active } = $props();
  const draft = new GraphDraft('tori.studio.workflow.v1', newWorkflowSource());
  $effect(() => { status = draft.status; });
  let kind = $state(workflowNodeTypes[0].id);
  let from = $state('');
  let to = $state('');
  let navigation = $state.raw({});
  let workspaceContext;
  let connectionError = $state('');
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
    connectionError = '';
    const [source, sourcePort] = JSON.parse(from);
    const [target, targetPort] = JSON.parse(to);
    const edge = { id: crypto.randomUUID(), source, sourcePort, target, targetPort };
    const issue = workspaceContext.connectionIssue(edge);
    if (issue) {
      const output = endpoints('output').find(port => port.value === from);
      const input = endpoints('input').find(port => port.value === to);
      const sourceType = workspaceContext.ports(graph.nodes.find(node => node.id === source)).find(port => port.id === sourcePort).type;
      const targetType = workspaceContext.ports(graph.nodes.find(node => node.id === target)).find(port => port.id === targetPort).type;
      const recovery = sourceType === targetType
        ? ' Review existing connections or choose another port.'
        : ' Choose a compatible input, or change the output.';
      connectionError = output.label + ' (' + sourceType + ') to ' + input.label + ' (' + targetType + '): ' + issue.message + recovery;
      return;
    }
    apply(frame, { type: 'connect', edge });
  }
</script>

{#snippet picker(label, value, options, change, inline = false)}
  <Select.Root type="single" {value} onValueChange={change}>
    <Select.Trigger class="workflow-picker" aria-label={label}>
      {options.find(option => option.value === value)?.label ?? `Choose ${label.toLowerCase()}`}
    </Select.Trigger>
    {#snippet popup()}
      <Select.Content class="workflow-options" sideOffset={6} align="start">
        {#each options as option (option.value)}
          <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    {/snippet}
    {#if inline}{@render popup()}{:else}<Select.Portal>{@render popup()}</Select.Portal>{/if}
  </Select.Root>
{/snippet}

{#if draft.error}
  <div class="commands">
    <Feedback kind="error" message={draft.error}/>
    <Button.Root class="action" onclick={() => draft.download('tori-workflow.json')}>Download draft</Button.Root>
  </div>
{/if}
{#snippet body(frame)}
  <article data-tori-node={frame.props.nodeId}>
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
  <GraphCommands register={(workspace) => { workspaceContext = workspace; register({
    workspace, add: () => addNode(frame), addLabel: 'Add selected node type',
    save: () => draft.save(), reopen: () => draft.saved === null ? undefined : draft.reopen(),
    get dirty() { return draft.dirty; },
    get canReopen() { return draft.saved !== null; },
    navigation,
    get undo() { return draft.canUndo() ? () => workspace.undo() : undefined; },
    get redo() { return draft.canRedo() ? () => workspace.redo() : undefined; }
  }); }}/>
  <div class="commands">
    <h1 class="desktop-command">Workflows</h1>
    {@render picker('Node', kind, workflowNodeTypes.map(type => ({ value: type.id, label: type.label })), value => kind = value)}
    <Button.Root class="action primary" onclick={() => addNode(frame)}>Add node</Button.Root>
    <Dialog.Root>
      <Dialog.Trigger class="action">Connect ports</Dialog.Trigger>
      <Dialog.Overlay/>
      <Dialog.Content class="connect-dialog">
        <Dialog.Title>Connect ports</Dialog.Title>
        <Dialog.Description>Choose an output and an input with matching types.</Dialog.Description>
        <div class="connection-fields">
          {@render picker('Output', from, endpoints('output'), value => { from = value; connectionError = ''; }, true)}
          {@render picker('Input', to, endpoints('input'), value => { to = value; connectionError = ''; }, true)}
        </div>
        {#if connectionError}<Feedback kind="error" message={connectionError}/>{/if}
        <div class="connection-fields">
          <Button.Root class="action primary" disabled={!canConnect} onclick={() => connect(frame)}>Connect</Button.Root>
          <Dialog.Close>Done</Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Root>
    <Button.Root class="action desktop-command" disabled={!draft.canUndo()} onclick={() => frame.onOutput('undo')}>Undo</Button.Root>
    <Button.Root class="action desktop-command" disabled={!draft.canRedo()} onclick={() => frame.onOutput('redo')}>Redo</Button.Root>
    <Button.Root class="action desktop-command" disabled={!graph.nodes.length} onclick={() => navigation.fit?.()}>Fit view</Button.Root>
    <span class="simulation"><span class="desktop-command">Execution simulation</span><span class="phone-simulation" title="Execution simulation">Simulation</span></span>
    <div class="desktop-command"><DraftActions {draft} {requestReopen}/></div>
  </div>
  <div class="canvas">
    <WorkspaceCanvas {active} label="Workflow canvas" register={(value) => { navigation = value; }}/>
  </div>
{/snippet}
<GraphHost {draft}><GraphWorkspaceV3 props={{ graph: draft.source, label: 'Workflow graph' }}
  io={{ emit: (name, value) => { if (name === 'graphChange') draft.edit(value);
    if (name === 'selectionChange') {
      const id = JSON.parse(value).nodes[0];
      if (id) onSelection?.(id);
    } }, scopedSlots: { content, body } }}
  nodeId="workflow" occurrenceKey="workflow"/></GraphHost>

<style>
  :global(.studio .workflow-options) { --vict-control-popup-width: min(18rem, calc(100vw - 32px)); }
  :global(.studio .workflow-options [role=option]) { white-space: nowrap; }
  .connection-fields { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 10px; }
  .commands :global(.workflow-picker) { width: auto; max-width: 100%; }
  .commands { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 4px 14px; border-bottom: 1px solid var(--vict-color-border); }
  h1 { font-size: 13px; margin: 0 auto 0 0; }
  .phone-simulation { display: none; }
  :global(.phone) .phone-simulation { display: inline; }
  .simulation { color: var(--vict-color-muted); font-size: 11px; }
  .canvas { height: max(24rem, calc(100dvh - 175px)) !important; --vict-color-surface: var(--vict-color-bg); }
  :global(.phone) .canvas { height: auto !important; flex: 1; min-height: 180px; }
  :global(.phone) .commands { padding-inline: 8px; gap: 4px; }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: #353537; }
  article { width: 178px; background: var(--studio-raised); padding: 10px; }
  strong { cursor: grab; }
</style>
