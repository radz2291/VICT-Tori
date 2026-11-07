<script lang="ts">
  import { Handle, Position } from '@victframework/ui-flow-svelte';
  import { Button } from '@victframework/ui-svelte';
  import Fields from './Fields.svelte';
  let {id,data,selected}=$props();
  let root=$derived(id==='agent');
</script>

<article class="graph-node" class:root class:selected data-kind={id}>
  <header>
    <span class="node-type">{root?'Agent definition':id==='model'?'Model reference':'Instruction text'}</span>
    <strong>{data.title}</strong>
    <span class="node-detail">{data.subtitle}</span>
  </header>
  <div class="node-fields"><Fields {...data.fields} {id} area="node"/></div>
  {#if root}
    <div class="node-port input-port"><Handle type="target" position={Position.Left} id="instructions"/><span>Instructions</span><small>Text</small></div>
    <div class="node-port input-port"><Handle type="target" position={Position.Left} id="model"/><span>Model</span><small>Reference</small></div>
  {:else}
    <div class="node-port output-port"><span>{id==='model'?'Model Reference':'Text'}</span><Handle type="source" position={Position.Right} id="value"/></div>
  {/if}
</article>
