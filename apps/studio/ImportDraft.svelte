<script>
  import { Dialog } from '@victframework/ui-svelte/catalog/dialog';
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { Feedback } from '@victframework/ui-svelte';
  import { Input } from '@victframework/ui-ai-svelte';

  let { open = $bindable(), draft } = $props();
  let error = $state('');
  let file = $state();
  let busy = $state(false);

  async function load() {
    if (!file || !draft || busy) return;
    busy = true;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Select a graph draft under 10 MB.');
      draft.importSource(await file.text());
      open = false;
    } catch (issue) {
      error = issue.message || 'Could not import this graph.';
    } finally {
      busy = false;
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={value => { if (value) { file = undefined; error = ''; } }}>
  <Dialog.Overlay/>
  <Dialog.Content>
    <Dialog.Title>Import graph draft</Dialog.Title>
    <Dialog.Description>Load an exported graph for this workspace as an Undoable edit. Save it when ready.</Dialog.Description>
    <label for="draft-file">Graph JSON file</label>
    <Input id="draft-file" type="file" accept=".json,application/json" onchange={event => { file = event.currentTarget.files?.[0]; error = ''; }}/>
    {#if error}<Feedback kind="error" message={error}/>{/if}
    <Button.Root class="action primary" disabled={!file || busy} onclick={load}>Import into draft</Button.Root>
    <Dialog.Close disabled={busy}>Cancel</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
