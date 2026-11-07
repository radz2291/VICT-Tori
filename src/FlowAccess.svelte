<script lang="ts">
  import { onMount } from 'svelte';
  import { useSvelteFlow } from '@victframework/ui-flow-svelte';
  let {onready}=$props();
  const flow=useSvelteFlow();
  onMount(()=>{onready(flow);});
</script>
