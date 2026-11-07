<script>
  import { getContext, tick, untrack } from 'svelte';
  import { GRAPH_WORKSPACE, GRAPH_EDITOR_HOST, GraphViewport, getViewportForBounds } from '@victframework/ui-flow-svelte';
  let { active = true, label, register = () => {} } = $props();
  const workspace = getContext(GRAPH_WORKSPACE);
  const host = getContext(GRAPH_EDITOR_HOST);
  let root = $state();
  let version = $state(0);
  const projectionKey = 'canvas';
  const identity = { nodeId: workspace.sourceIdentity.nodeId, occurrenceKey: JSON.stringify([workspace.sourceIdentity.occurrenceKey, 'viewport', projectionKey]) };
  const controller = host.presentationFor(identity);


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
    if (!active || !root) return;
    const element = root;
    let wasNarrow = false;
    let frame;
    const observer = new ResizeObserver(() => {
      const narrow = window.innerWidth <= 620 && element.clientWidth > 0;
      if (narrow && !wasNarrow) {
        frame = requestAnimationFrame(() => untrack(() => {
          const bounds = element.getBoundingClientRect();
          const cards = [...element.querySelectorAll('[data-tori-node]')];
          const readable = cards.some(card => {
            const rect = card.getBoundingClientRect();
            return rect.width >= 150 && rect.left >= bounds.left - 2 && rect.right <= bounds.right + 2
              && rect.top >= bounds.top - 2 && rect.bottom <= bounds.bottom + 2;
          });
          if (readable) return;
          const id = workspace.selection.nodes[0] ?? workspace.graph.nodes[0]?.id;
          if (id) void navigate('reveal', id);
        }));
      }
      wasNarrow = narrow;
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  });

</script>

<div class="canvas-frame" bind:this={root}>
  {#key version}<GraphViewport props={{ label }} nodeId="canvas" occurrenceKey={projectionKey}/>{/key}
</div>

<style>
  .canvas-frame { width: 100%; height: 100%; min-width: 0; }
  .canvas-frame :global(.graph-viewport) { height: 100% !important; }
</style>
