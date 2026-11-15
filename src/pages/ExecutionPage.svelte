<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    page, toolbar, children,
    mobile, inspectorVisible, inspectorToggle, sidebarActions, sidebarBody,
  }: {
    page: 'Sessions'|'Runs';
    toolbar: Snippet;
    children: Snippet;
    mobile: boolean;
    inspectorVisible: boolean;
    inspectorToggle: Snippet;
    sidebarActions: Snippet;
    sidebarBody: Snippet;
  } = $props();
</script>

<div class="agent-workspace execution-workspace" data-layout={mobile?'narrow':'desktop'} class:has-inspector-dock={!mobile&&inspectorVisible}>
  <div class="agent-detail">
    <div class="agent-dockbar execution-toolbar">
      {@render toolbar()}
      <div class="execution-actions">{@render inspectorToggle()}</div>
    </div>
    {@render children()}
  </div>
  {#if !mobile&&inspectorVisible}
    <aside class="inspector execution-right-dock" aria-label={page==='Sessions'?'Session history':'Run history'}>
      <div class="library-tabbar">
        <h2>{page}</h2>
        {@render sidebarActions()}
      </div>
      {@render sidebarBody()}
    </aside>
  {/if}
</div>
