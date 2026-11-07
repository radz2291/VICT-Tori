<script>
  import { getContext, tick, untrack } from 'svelte';
  import { GRAPH_WORKSPACE, GRAPH_EDITOR_HOST, GraphViewport, getViewportForBounds } from '@victframework/ui-flow-svelte';
  let { active = true, label, register = () => {} } = $props();
  const workspace = getContext(GRAPH_WORKSPACE);
  const host = getContext(GRAPH_EDITOR_HOST);
  let root;
  let version = $state(0);
  const projectionKey = 'canvas';
  const identity = { nodeId: workspace.sourceIdentity.nodeId, occurrenceKey: JSON.stringify([workspace.sourceIdentity.occurrenceKey, 'viewport', projectionKey]) };
  const controller = host.presentationFor(identity);
  const needsMobileStart = window.innerWidth <= 620 && !controller.get();
  let mobileStarted = false;

  async function navigate(action, id) {
    await tick();
    const bounds = root?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height || !workspace.graph.nodes.length) return;
    const nodes = id ? workspace.graph.nodes.filter(node => node.id === id) : workspace.graph.nodes;
    if (!nodes.length) return;
    const previous = controller.get()?.viewport ?? { x: 0, y: 0, zoom: 1 };
    let viewport;
    if (action === 'zoomIn' || action === 'zoomOut') {
      const zoom = Math.max(.1, Math.min(2, previous.zoom * (action === 'zoomIn' ? 1.25 : .8)));
      viewport = {
        x: bounds.width / 2 - (bounds.width / 2 - previous.x) * zoom / previous.zoom,
        y: bounds.height / 2 - (bounds.height / 2 - previous.y) * zoom / previous.zoom,
        zoom
      };
    } else {
      const x = Math.min(...nodes.map(node => node.position.x));
      const y = Math.min(...nodes.map(node => node.position.y));
      const sizes = new Map(Array.from(root.querySelectorAll('[data-tori-node]'), element => [
        element.dataset.toriNode, { width: element.offsetWidth, height: element.offsetHeight }
      ]));
      const right = Math.max(...nodes.map(node => node.position.x + (sizes.get(node.id)?.width || 270)));
      const bottom = Math.max(...nodes.map(node => node.position.y + (sizes.get(node.id)?.height || 210)));
      viewport = getViewportForBounds({ x, y, width: right - x, height: bottom - y }, bounds.width, bounds.height, .1, 1, .15);
    }
    controller.set({ viewport, selection: workspace.selection });
    version += 1;
  }
  $effect(() => {
    register({
      fit: () => navigate('fit'),
      reveal: id => navigate('reveal', id),
      zoomIn: () => navigate('zoomIn'),
      zoomOut: () => navigate('zoomOut')
    });
  });
  $effect(() => {
    if (!active || !workspace.graph.nodes.length) return;
    untrack(() => {
      if (needsMobileStart && !mobileStarted) {
        mobileStarted = true;
        void navigate('reveal', workspace.graph.nodes[0].id);
      }
    });
  });
</script>

<div class="canvas-frame" bind:this={root}>
  {#key version}<GraphViewport props={{ label }} nodeId="canvas" occurrenceKey={projectionKey}/>{/key}
</div>

<style>
  .canvas-frame { width: 100%; height: 100%; min-width: 0; }
  .canvas-frame :global(.graph-viewport) { height: 100% !important; }
</style>
