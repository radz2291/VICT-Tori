<script>
  import WorkspaceCanvas from './WorkspaceCanvas.svelte';
  let { active, register } = $props();
</script>

<WorkspaceCanvas {active} {register} label="Agent canvas"/>
