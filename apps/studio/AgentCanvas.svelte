<script>
  import { getContext } from 'svelte';
  import WorkspaceCanvas from './WorkspaceCanvas.svelte';
  import { GRAPH_WORKSPACE } from '@victframework/ui-flow-svelte';

  let { active, register, onclear } = $props();
  const workspace = getContext(GRAPH_WORKSPACE);

  function clear() {
    workspace.select({ nodes: [], edges: [] });
    onclear();
  }
</script>

<svelte:window onclick={(event) => {
  if (active && event.target?.matches?.('.studio .svelte-flow__pane')) clear();
}} onkeydown={(event) => {
  if (active && event.key === 'Escape' && !event.defaultPrevented &&
      !event.target?.closest?.('input, textarea, select, [contenteditable]')) clear();
}}/>

<WorkspaceCanvas {active} {register} label="Agent canvas"/>

<!-- The native pane owns pointer gestures and emits selection changes. -->
