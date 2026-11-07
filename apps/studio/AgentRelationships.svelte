<script>
  import { GraphPortRow, GraphViewport, GraphWorkspaceV3 } from '@victframework/ui-flow-svelte';
  import { Feedback } from '@victframework/ui-svelte';
  import { agentRelationships, agentRelationshipGraph } from './agent-relationships.js';

  let { agent, settings, agents } = $props();
  let relationships = $derived(agentRelationships(agent, settings, agents));
  let source = $derived(agentRelationshipGraph(agent, relationships));
</script>

<section aria-label="Agent relationship projection">
  <h3>Resource relationships</h3>
  <p>Configure or detach each binding with its field above. Hiding this view keeps the bindings.</p>
  {#if relationships.length}
    {#snippet body(frame)}
      <article>
        <strong>{frame.props.label}</strong>
        {#if frame.props.nodeType === 'definition'}
          {#each relationships as item (item.key)}
            <GraphPortRow props={{ id: item.key }} nodeId={item.key} occurrenceKey={item.key}/>
          {/each}
        {:else}
          <GraphPortRow props={{ id: frame.props.nodeType }} nodeId={frame.props.nodeType} occurrenceKey={frame.props.nodeType}/>
        {/if}
      </article>
    {/snippet}
    {#snippet content()}
      <GraphViewport props={{ label: 'Agent resource graph', height: 240 }} nodeId="relationships" occurrenceKey="relationships"/>
    {/snippet}
    <div class="projection" inert>
      <GraphWorkspaceV3 props={{ graph: source, readOnly: true, label: 'Agent relationships' }}
        io={{ emit: () => {}, scopedSlots: { body, content } }} nodeId={agent.id} occurrenceKey="agent-relationships"/>
    </div>
    <dl>
      {#each relationships as item (item.key)}
        <dt>{item.name}</dt>
        <dd>{item.label}{item.unavailable ? ' · Unavailable' : ''}<small>{item.resourceId}</small></dd>
      {/each}
    </dl>
  {:else}
    <Feedback kind="empty" message="No resources are bound to this agent."/>
  {/if}
</section>

<style>
  section { margin-block: 12px; font-size: 12px; }
  article { min-width: 110px; max-width: 150px; padding: 5px; background: var(--studio-raised); overflow-wrap: anywhere; }
  .projection { border: 1px solid var(--vict-color-border); }
  dt { color: var(--vict-color-muted); }
  dd { margin: 0 0 8px; overflow-wrap: anywhere; }
  small { display: block; color: var(--vict-color-muted); }
</style>
