<script>
  import { getContext, tick } from 'svelte';
  import { GRAPH_WORKSPACE } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';

  let { onadd, primary = false } = $props();
  const workspace = getContext(GRAPH_WORKSPACE);

  async function add() {
    const id = crypto.randomUUID();
    const count = workspace.graph.nodes.length;
    const position = { x: 48 + (count % 3) * 310, y: 48 + Math.floor(count / 3) * 190 };
    workspace.apply([{ type: 'addNode', id, nodeType: 'agent', position }]);
    if (!workspace.graph.nodes.some(node => node.id === id)) return;
    onadd(id, count);
    await tick();
    workspace.select({ nodes: [id], edges: [] });
  }
</script>

<Button.Root class={primary ? 'action primary' : 'action'} onclick={add}>
  <span aria-hidden="true">+</span> Add agent
</Button.Root>
