<script>
  import { Button } from '@victframework/ui-svelte/catalog/button';
  import { MediaIcon } from '@victframework/ui-media-svelte';

  let { draft, requestReopen = () => draft.reopen() } = $props();
</script>

<div class="actions" role="group" aria-label="Draft actions">
  <Button.Root class="action icon-action" aria-label="Save draft" title="Save draft" onclick={() => draft.save()}>
    <MediaIcon props={{ name: 'save', size: 16 }} nodeId="save-icon" occurrenceKey="save-icon"/>
  </Button.Root>
  <Button.Root class="action icon-action" aria-label="Reopen saved draft" title="Reopen saved draft"
    disabled={draft.saved === null} onclick={requestReopen}>
    <MediaIcon props={{ name: 'clock', size: 16 }} nodeId="reopen-icon" occurrenceKey="reopen-icon"/>
  </Button.Root>
</div>

<style>
  .actions { display: flex; border-left: 1px solid var(--vict-color-border); padding-left: 8px; }
</style>
