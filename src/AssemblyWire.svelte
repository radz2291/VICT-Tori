<script module lang="ts">
  import type { Edge } from '@victframework/ui-flow-svelte';
  export type AssemblyWireEdge=Edge<Record<string,never>,'assembly'>;
</script>

<script lang="ts">
  import { BaseEdge, EdgeReconnectAnchor, getBezierPath, type EdgeProps } from '@victframework/ui-flow-svelte';

  let {id,sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,style,interactionWidth}:EdgeProps<AssemblyWireEdge>=$props();
  let movingSource=$state(false),movingTarget=$state(false);
  let [path]=$derived(getBezierPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition}));
</script>

<BaseEdge {id} {path} {style} {interactionWidth} class={movingSource||movingTarget?'wire-moving':undefined}/>
<EdgeReconnectAnchor type="source" position={{x:sourceX,y:sourceY}} size={22} dragThreshold={4}
  bind:reconnecting={movingSource} class="assembly-wire-end" data-wire-id={id} aria-hidden="true" title="Drag to reconnect or disconnect">
  <span class="wire-end-ring"></span>
</EdgeReconnectAnchor>
<EdgeReconnectAnchor type="target" position={{x:targetX,y:targetY}} size={22} dragThreshold={4}
  bind:reconnecting={movingTarget} class="assembly-wire-end" data-wire-id={id} aria-hidden="true" title="Drag to reconnect or disconnect">
  <span class="wire-end-ring"></span>
</EdgeReconnectAnchor>
