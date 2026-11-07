<script>
  import { getContext, tick } from 'svelte';
  import { GRAPH_WORKSPACE } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte/catalog/button';

  let { onadd, primary = false, register = () => {} } = $props();
  const workspace = getContext(GRAPH_WORKSPACE);

  async function add() {
    const id = crypto.randomUUID();
    const count = workspace.graph.nodes.length;
    const position = { x: 48 + (count % 3) * 310, y: 48 + Math.floor(count / 3) * 190 };
    let label = 'Agent definition';
    let suffix = 2;
    while (workspace.graph.nodes.some(node => node.label === label)) label = 'Agent definition ' + suffix++;
    workspace.apply([{ type: 'addNode', id, nodeType: 'agent', position }, { type: 'setLabel', nodeId: id, label }]);
    if (!workspace.graph.nodes.some(node => node.id === id)) return;
    await tick();
    workspace.select({ nodes: [id], edges: [] });
    onadd(id, count);
  }
  $effect(() => register(add));
</script>

<Button.Root class={primary ? 'action primary' : 'action'} onclick={add}>
  <span aria-hidden="true">+</span> Add agent
</Button.Root>
