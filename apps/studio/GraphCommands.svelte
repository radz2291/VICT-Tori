<script>
  import { getContext } from 'svelte';
  import { GRAPH_WORKSPACE } from '@victframework/ui-flow-svelte';
  let { register } = $props();
  const graph = getContext(GRAPH_WORKSPACE);
  $effect(() => register(graph));
</script>
