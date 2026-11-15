<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button, Feedback } from '@victframework/ui-svelte';
  import { Button as ControlButton } from '@victframework/ui-svelte/primitives';
  import { DropdownMenu } from '@victframework/ui-svelte/catalog/dropdown-menu';
  import { SvelteFlowProvider } from '@victframework/ui-flow-svelte';

  const views = ['Settings', 'Canvas'] as const;
  type AgentView = typeof views[number];

  let {
    mobile, authoringVisible, assemblyVisible, agentView, loaded, nodes, graphError, selection, zoom,
    agentRevisionStatus, ready, dirty, pending, draftTurnOpen, activationMatchesSaved, sending,
    savedRevision, activateDisabled,
    authoringOptions, authoringBody, dockToggle, agentFields, canvas, assemblyBody,
    selectAgentView, create, backToAgent, objectTitle, inspectDelegationWire,
    zoomIn, zoomOut, actualSize, fit, discardRevision, saveRevision, startSession, activateRevision,
  }: {
    mobile: boolean;
    authoringVisible: boolean;
    assemblyVisible: boolean;
    agentView: AgentView;
    loaded: boolean;
    nodes: readonly {id: string}[];
    graphError: string;
    selection: string;
    zoom: number;
    agentRevisionStatus: string;
    ready?: string;
    dirty: boolean;
    pending: boolean;
    draftTurnOpen: boolean;
    activationMatchesSaved: boolean;
    sending: boolean;
    savedRevision?: {number: number};
    activateDisabled: boolean;
    authoringOptions: Snippet;
    authoringBody: Snippet;
    dockToggle: Snippet<['Authoring Agent'|'Assembly / Selection']>;
    agentFields: Snippet<[string]>;
    canvas: Snippet;
    assemblyBody: Snippet<['sidebar']>;
    selectAgentView: (view: AgentView) => void;
    create: (id: string) => void;
    backToAgent: () => void;
    objectTitle: (id: string) => string;
    inspectDelegationWire: (event: MouseEvent) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    actualSize: () => void;
    fit: () => Promise<void>;
    discardRevision: () => Promise<void>;
    saveRevision: () => Promise<void>;
    startSession: () => Promise<void>;
    activateRevision: () => Promise<void>;
  } = $props();
</script>

<div class="agent-workspace" class:has-agent-dock={!mobile&&authoringVisible} class:has-inspector-dock={!mobile&&assemblyVisible}>
  {#if !mobile&&authoringVisible}
    <aside class="agent-left-dock" aria-label="Authoring Agent">
      <div class="library-tabbar"><h2>Authoring Agent</h2>{@render authoringOptions()}</div>
      {@render authoringBody()}
    </aside>
  {/if}
  <div class="agent-detail">
    <div class="agent-dockbar">
      <div class="agent-dock-actions">{@render dockToggle('Authoring Agent')}</div>
      <div class="agent-views" role="group" aria-label="Agent view">
        {#each views as viewName}
          <ControlButton.Root class="vict-btn vict-btn--secondary" aria-pressed={agentView===viewName}
            onclick={()=>selectAgentView(viewName)}>{viewName==='Settings'?'Configure':'Canvas'}</ControlButton.Root>
        {/each}
      </div>
      <div class="agent-dock-actions right">{@render dockToggle('Assembly / Selection')}</div>
    </div>
    {#if !nodes.length}
      <main class="agent-empty" aria-labelledby="agent-empty-title">
        <div class="agent-empty-content">
          <h1 id="agent-empty-title">No agent yet</h1>
          <p>Add an agent, then give it instructions and a model.</p>
          <Button label="Add Agent" variant="secondary" disabled={!loaded} onclick={()=>create('agent')}/>
          {#if graphError}<Feedback kind="error" message={graphError}/>{/if}
        </div>
      </main>
    {:else if agentView==='Settings'}
      {@const current=nodes.some(node=>node.id===selection)?selection:'agent'}
      {#if selection&&selection!=='agent'&&nodes.some(node=>node.id===selection)}
        <div class="configure-detail-nav">
          <ControlButton.Root class="vict-btn vict-btn--quiet configure-back" aria-label="Back to agent"
            onclick={backToAgent}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="m11 5-7 7 7 7M4 12h16"/>
            </svg>
            Back
          </ControlButton.Root>
        </div>
      {/if}
      <main class="agent-settings" aria-label="Configure agent">
        <div class="agent-settings-content">
          {#if current!=='agent'}
            <header class="configure-detail-heading">
              <h1 class="configure-heading">{objectTitle(current)}</h1>
              {#if current==='context'}<p>Choose the source revision this agent can load on demand.</p>{/if}
            </header>
          {/if}
          {#if current!=='agent'}
            <section class="configure-group configure-detail-panel" aria-label={objectTitle(current)+' settings'}>
              {@render agentFields(current)}
            </section>
          {:else}
            {@render agentFields(current)}
          {/if}
          {#if graphError}<Feedback kind="error" message={graphError}/>{/if}
        </div>
      </main>
    {:else}
      <main class="assembly">
        <section class="stage" aria-label="Agent assembly canvas">
          <div class="flow" ondblclickcapture={inspectDelegationWire}>
            <div class="canvas-view-menu">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger class="vict-btn vict-btn--secondary" aria-label="Canvas view">
                  {Math.round(zoom*100)}% <span aria-hidden="true">⌃</span>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="menu-content" align="end" side="top" sideOffset={4}>
                    <DropdownMenu.Item class="menu-item" disabled={zoom>=1.7} onSelect={zoomIn}>Zoom in</DropdownMenu.Item>
                    <DropdownMenu.Item class="menu-item" disabled={zoom<=0.2} onSelect={zoomOut}>Zoom out</DropdownMenu.Item>
                    <DropdownMenu.Item class="menu-item" onSelect={actualSize}>Actual size</DropdownMenu.Item>
                    <DropdownMenu.Item class="menu-item" onSelect={fit}>Fit to view</DropdownMenu.Item>
                    {#if !nodes.some(n=>n.id==='model')}
                      <DropdownMenu.Separator/>
                      <DropdownMenu.Item class="menu-item" onSelect={()=>create('model')}>Add model</DropdownMenu.Item>
                    {/if}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
            <SvelteFlowProvider>
              {@render canvas()}
            </SvelteFlowProvider>
          </div>
          {#if graphError}
            <div class="canvas-status"><Feedback kind="error" message={graphError}/></div>
          {/if}
        </section>
      </main>
    {/if}
    {#if loaded&&nodes.length}
      <footer class="agent-editor-footer" aria-label="Agent revision and actions">
        <div id="agent-revision-status" class="agent-revision-status" tabindex="-1">
          <Feedback message={agentRevisionStatus}/>
          {#if ready}<Feedback message={ready}/>{/if}
        </div>
        <div class="agent-revision-actions">
          {#if dirty}
            <Button label="Discard" variant="secondary" disabled={pending} onclick={discardRevision}/>
            <Button label="Save" disabled={pending||draftTurnOpen} onclick={saveRevision}/>
          {:else if activationMatchesSaved}
            <Button label="Start Session" disabled={pending||sending} onclick={startSession}/>
          {:else if savedRevision}
            <Button label={'Activate r'+savedRevision.number} disabled={activateDisabled}
              onclick={activateRevision}/>
          {/if}
        </div>
      </footer>
    {/if}
  </div>
  {#if !mobile&&assemblyVisible}
    <aside class="inspector agent-layers-dock" aria-label="Assembly / Selection">
      {@render assemblyBody('sidebar')}
    </aside>
  {/if}
</div>
