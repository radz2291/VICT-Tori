<script lang="ts">
  import { onMount } from 'svelte';
  import { useSvelteFlow, useStore } from '@victframework/ui-flow-svelte';
  let {onready}=$props();
  const flow=useSvelteFlow();
  const store=useStore();
  onMount(()=>{onready(flow,()=>store.clickConnectStartHandle=null);});
</script>
