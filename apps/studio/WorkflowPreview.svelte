<script>
  import GraphHost from './GraphHost.svelte';
  import WorkspaceCanvas from './WorkspaceCanvas.svelte';
  import { GraphWorkspaceV3, GraphPortRow, parseGraphV3 } from '@victframework/ui-flow-svelte';
  import { Dialog } from '@victframework/ui-svelte/catalog/dialog';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Select } from '@victframework/ui-svelte/catalog/select';
  import { Input } from '@victframework/ui-ai-svelte';
  import { tick } from 'svelte';
  import { Feedback } from '@victframework/ui-svelte';
  import { GraphDraft } from './graph-draft.svelte.js';
  import GraphCommands from './GraphCommands.svelte';
  import {
    creativeWorkflowOperations, newWorkflowSource, previewDecision, sampleWorkflowOperations,
    upgradeWorkflowSource, workflowLabel, workflowNodeTypes, workflowReadiness, workflowSamples,
  } from './workflow-graph.js';

  let { agents, agentRevision, status = $bindable(), register = () => {}, active } = $props();
  const draft = new GraphDraft('tori.studio.workflow.v1', newWorkflowSource(), upgradeWorkflowSource);
  $effect(() => { status = draft.status; });
  let kind = $state(workflowNodeTypes[0].id);
  let sample = $state(workflowSamples[0].value);
  let branchInput = $state('');
  const routingOptions = [
    { value: 'exclusive', label: 'Exclusive · first match' },
    { value: 'multiple', label: 'Multiple matching branches' },
  ];
  const noMatchOptions = [
    { value: 'wait', label: 'Wait for review' }, { value: 'fail', label: 'Fail request' },
  ];
  let from = $state('');
  let to = $state('');
  let navigation = $state.raw({});
  let workspaceContext = $state.raw();
  let connectionError = $state('');
  let graph = $derived(parseGraphV3(draft.source).graph);
  let diagnostics = $derived(workflowReadiness(graph, agents, agentRevision));
  let canConnect = $derived(endpoints('output').some(port => port.value === from) && endpoints('input').some(port => port.value === to));
  const endpoints = (direction) => graph.nodes.flatMap(node =>
    (graph.nodeTypes.find(type => type.id === node.type)?.ports ?? [])
      .filter(port => port.direction === direction)
      .map(port => ({ value: JSON.stringify([node.id, port.id]), label: `${displayName(graph.nodes, node)} · ${port.label}` })),
  );

  function agentOptions(resource) {
    const options = [{ value: 'unconfigured', label: 'Unconfigured' },
      ...agents.map(agent => ({ value: agent.id, label: displayName(agents, agent) }))];
    if (resource && !options.some(option => option.value === resource)) {
      options.push({ value: resource, label: 'Missing agent' });
    }
    return options;
  }

  function apply(frame, operation) {
    frame.onOutput('operation', JSON.stringify([operation]));
  }

  function displayName(nodes, node) {
    const duplicates = nodes.filter(item => item.label.trim().toLowerCase() === node.label.trim().toLowerCase());
    return duplicates.length > 1 ? node.label + ' · ' + (duplicates.findIndex(item => item.id === node.id) + 1) : node.label;
  }

  async function addNode() {
    const id = crypto.randomUUID();
    const count = graph.nodes.length;
    const position = { x: 44 + count % 3 * 245, y: 48 + Math.floor(count / 3) * 245 + count % 2 * 24 };
    const label = workflowNodeTypes.find(type => type.id === kind).label;
    workspaceContext.apply([
      { type: 'addNode', id, nodeType: kind, position },
      { type: 'setLabel', nodeId: id, label: workflowLabel(label, new Set(graph.nodes.map(node => node.label.toLowerCase()))) },
    ]);
    await tick();
    if (workspaceContext.graph.nodes.some(node => node.id === id)) {
      workspaceContext.select({ nodes: [id], edges: [] });
    }
  }

  function bindAgent(frame, value) {
    const nodeId = frame.props.nodeId;
    workspaceContext.apply([
      { type: 'setParameter', nodeId, key: 'resource', value: value === 'unconfigured' ? '' : value },
      { type: 'setParameter', nodeId, key: 'resourceRevision', value: value === 'unconfigured' ? '' : String(agentRevision ?? 0) },
    ]);
  }

  function simulationContext(node) {
    return {
      coordinator: 'VICT business workflow (U0 mapping)',
      aiStep: 'Mastra agent capability (U0 mapping)',
      approvalOwner: 'VICT',
      protectedEffect: node.type === 'quellight-action',
      branch: node.type === 'decision' ? {
        strategy: node.values.routing || 'exclusive',
        noMatch: node.values.noMatch || 'wait',
        primaryMatch: node.values.primaryCondition || '',
        specialistMatch: node.values.specialistCondition || '',
          join: 'separate review paths',
      } : undefined,
      readiness: diagnostics,
    };
  }

  function insertSample() {
    workspaceContext.apply(sampleWorkflowOperations(sample, graph));
    void navigation.fit?.();
  }

  function fromCreative(snapshot) {
    const operations = creativeWorkflowOperations(snapshot, graph);
    workspaceContext.apply(operations);
    const request = operations[0].id;
    if (workspaceContext.graph.nodes.some(node => node.id === request)) {
      workspaceContext.select({ nodes: [request], edges: [] });
      void navigation.reveal?.(request);
      return request;
    }
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
{#snippet textField(frame, key, label, location)}
  <label for={location + '-' + frame.props.nodeId + '-' + key}>{label}</label>
  <Input id={location + '-' + frame.props.nodeId + '-' + key} class="studio-field"
    value={String(frame.state[key] ?? '')} onfocus={() => draft.beginEdit()} onblur={() => draft.endEdit()}
    oninput={event => frame.onStateChange(key, event.currentTarget.value)}/>
{/snippet}

{#snippet fields(frame, location)}
  <div class="workflow-fields nodrag nopan nowheel">
    {#if frame.props.nodeType === 'request'}
      {@render textField(frame, 'brief', 'Request brief', location)}
      {#if location === 'inspector' && frame.state.creativeSource}
        <p>Creative source {frame.state.creativeSource} · revision {frame.state.creativeRevision}</p>
        <p>{frame.state.creativeContext || 'No creative context bound.'}</p>
      {/if}
    {:else if frame.props.nodeType === 'run-agent'}
      {@render picker('Agent reference', frame.state.resource || 'unconfigured', agentOptions(frame.state.resource), value => bindAgent(frame, value), location === 'inspector')}
      {#if location === 'inspector' && frame.state.resource}
        <p>Definition {frame.state.resource} · revision {frame.state.resourceRevision || 'Unpinned'}</p>
        {#if frame.state.resourceRevision && frame.state.resourceRevision !== String(agentRevision)}
          <Feedback message={'The pinned revision differs from current draft revision ' + agentRevision + '.'}/>
        {/if}
        <Button.Root class="action" disabled={!agents.some(agent => agent.id === frame.state.resource)}
          onclick={() => bindAgent(frame, frame.state.resource)}>Pin current agent revision</Button.Root>
      {/if}
      {@render textField(frame, 'task', 'Invocation task', location)}
    {:else if frame.props.nodeType === 'decision'}
      {@render picker('Routing strategy', frame.state.routing, routingOptions, value => frame.onStateChange('routing', value), location === 'inspector')}
      {#if location === 'inspector'}
        {@render picker('When no branch matches', frame.state.noMatch, noMatchOptions, value => frame.onStateChange('noMatch', value), true)}
        {@render textField(frame, 'primaryCondition', 'Primary review match', location)}
        {@render textField(frame, 'specialistCondition', 'Specialist review match', location)}
        <label for="decision-preview-input">Simulated match tokens (space-separated)</label>
        <Input id="decision-preview-input" class="studio-field" bind:value={branchInput}/>
        <Feedback message={'Simulated routing preview · ' + previewDecision({ id: frame.props.nodeId, values: frame.state }, branchInput, graph)}/>
      {/if}
    {:else if frame.props.nodeType === 'human-review'}
      {@render textField(frame, 'prompt', 'Review instructions', location)}
    {:else if frame.props.nodeType === 'quellight-action'}
      {#if location === 'inspector'}
        {@render textField(frame, 'action', 'Requested action', location)}
        <Feedback message="Protected effect. VICT approval and receipt reconciliation are required for live action. U0 only simulates the refusal."/>
      {/if}
    {:else if frame.props.nodeType === 'output'}
      {@render textField(frame, 'format', 'Output format', location)}
    {/if}
  </div>
{/snippet}

{#snippet inspect(node)}
  {@const frame = workspaceContext.frame(node, 'workflow-inspector')}
  {@render fields(frame, 'inspector')}
{/snippet}

{#snippet body(frame)}
  <article data-tori-node={frame.props.nodeId}>
    <strong class="vict-graph-drag-handle">{displayName(graph.nodes, { id: frame.props.nodeId, label: frame.props.label })}</strong>
    {@render fields(frame, 'canvas')}
    {#each (graph.nodeTypes.find(type => type.id === frame.props.nodeType)?.ports ?? []) as port (port.id)}
      <GraphPortRow props={{ id: port.id, color: ['review', 'approval'].includes(port.type) ? 'token:muted' : 'token:accent' }}
        nodeId={port.id} occurrenceKey={port.id}/>
    {/each}
  </article>
{/snippet}
{#snippet content(frame)}
  <GraphCommands register={(workspace) => { workspaceContext = workspace; register({
    workspace, draft, add: addNode, addLabel: 'Add selected node type', inspect, fromCreative, simulationContext,
    readiness: () => diagnostics,
    save: () => draft.save(), reopen: () => draft.saved === null ? undefined : draft.reopen(),
    get dirty() { return draft.dirty; },
    get canReopen() { return draft.saved !== null; },
    get navigation() { return navigation; },
    get undo() { return draft.canUndo() ? () => workspace.undo() : undefined; },
    get redo() { return draft.canRedo() ? () => workspace.redo() : undefined; }
  }); }}/>
  <div class="commands">
    {@render picker('Node', kind, workflowNodeTypes.map(type => ({ value: type.id, label: type.label })), value => kind = value)}
    <Button.Root class="action primary" onclick={addNode}>Add node</Button.Root>
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
    <Dialog.Root>
      <Dialog.Trigger class="action">Workflow examples</Dialog.Trigger>
      <Dialog.Overlay/>
      <Dialog.Content>
        <Dialog.Title>Insert a workflow example</Dialog.Title>
        <Dialog.Description>Add an editable synthetic example to the current draft. Existing nodes stay in place.</Dialog.Description>
        {@render picker('Workflow example', sample, workflowSamples, value => sample = value, true)}
        <Button.Root class="action primary" onclick={insertSample}>Insert example</Button.Root>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
    <Dialog.Root>
      <Dialog.Trigger class="action">Validate workflow</Dialog.Trigger>
      <Dialog.Overlay/>
      <Dialog.Content class="validation-dialog">
        <Dialog.Title>Workflow readiness</Dialog.Title>
        <Dialog.Description>Revision {graph.revision} · VICT coordination · Mastra agent capability · Live execution unavailable in U0.</Dialog.Description>
        <p>Data ports carry a request brief and recommendation. Review and approval ports carry VICT control handoffs. The protected action requires VICT authorization and receipt reconciliation.</p>
        {#if !graph.nodes.length}
          <Feedback kind="empty" message="Add a workflow node to validate its configuration."/>
        {:else if diagnostics.length}
          <Feedback message="Incomplete draft. Saving is available."/>
          <ul>{#each diagnostics as issue}<li>{issue}</li>{/each}</ul>
        {:else}
          <Feedback message="The draft has no missing fields or connections in this U0 check."/>
        {/if}
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  </div>
  <div class="canvas">
    <WorkspaceCanvas {active} label="Workflow canvas" register={(value) => { navigation = value; }}/>
  </div>
{/snippet}
<GraphHost {draft}><GraphWorkspaceV3 props={{ graph: draft.source, label: 'Workflow graph' }}
  io={{ emit: (name, value) => { if (name === 'graphChange') draft.edit(value);
  }, scopedSlots: { content, body } }}
  nodeId="workflow" occurrenceKey="workflow"/></GraphHost>

<style>
  :global(.studio .workflow-options) { --vict-control-popup-width: min(18rem, calc(100vw - 32px)); }
  :global(.studio .workflow-options [role=option]) { white-space: nowrap; }
  .connection-fields { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 10px; }
  .commands :global(.workflow-picker) { width: auto; max-width: 100%; }
  .commands { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 4px 14px; border-bottom: 1px solid var(--vict-color-border); }
  .workflow-fields { display: grid; gap: 4px; margin-block: 6px; font-size: 11px; }
  .workflow-fields :global(.workflow-picker) { width: 100%; }
  .workflow-fields p { overflow-wrap: anywhere; }
  :global(.validation-dialog) { max-height: 90dvh; overflow: auto; }
  .canvas { flex: 1; min-height: 180px; --vict-color-surface: var(--vict-color-bg); }
  :global(.phone) .commands { flex-wrap: nowrap; overflow-x: auto; padding-inline: 8px; gap: 4px; }
  .canvas :global(.svelte-flow__background) { --xy-background-pattern-color: #353537; }
  article { width: 178px; background: var(--studio-raised); padding: 10px; }
  strong { cursor: grab; }
</style>
