<script lang="ts">
  import { Input } from '@victframework/ui-ai-svelte';
  import { modelNodeId } from './assembly';
  let {graph,route,edit,prefix,compact=false}=$props();
  let sampling=$derived(graph.nodes.find(node=>node.id===modelNodeId)?.values);
  const numeric=(value:string)=>value===''?undefined:Number(value);
</script>

{#if route==='coding'||sampling?.temperature!==undefined||sampling?.topP!==undefined}
  <div class={compact?'node-inline-setting':'configure-setting'}>
    <label for={prefix+'-temperature'}>Temperature</label>
    <Input id={prefix+'-temperature'} class="tori-field" type="number" min={0} max={1} step="any"
      placeholder="Provider default" value={sampling?.temperature??''} oninput={e=>edit(modelNodeId,'temperature',numeric(e.currentTarget.value))}/>
  </div>
  <div class={compact?'node-inline-setting':'configure-setting'}>
    <label for={prefix+'-top-p'}>Top-p</label>
    <Input id={prefix+'-top-p'} class="tori-field" type="number" min={0} max={1} step="any"
      placeholder="Provider default" value={sampling?.topP??''} oninput={e=>edit(modelNodeId,'topP',numeric(e.currentTarget.value))}/>
  </div>
{:else}
  <p class="muted">Sampling overrides are available on the Coding route.</p>
{/if}
