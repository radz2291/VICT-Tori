<script>
  import { Slider } from '@victframework/ui-svelte/catalog/slider';
  import { Dialog } from '@victframework/ui-svelte/catalog/dialog';

  let { panel, narrow, resize, close, children } = $props();
</script>

{#if panel.open}
  {#if narrow}
    <Dialog.Root open={true} onOpenChange={(open) => { if (!open) close(); }}>
      <Dialog.Overlay/>
      <Dialog.Content class="workspace-panel-dialog">
        <Dialog.Title>{panel.name}</Dialog.Title>
        <Dialog.Description>Workspace {panel.name.toLowerCase()}</Dialog.Description>
        {@render children()}
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  {:else}
    <aside aria-label={panel.name} style:--dock-width={panel.width + 'px'}>
      <h2>{panel.name}</h2>
      <div class="dock-content">{@render children()}</div>
      <div class="size">
        <span>{panel.name} width</span>
        <Slider.Root type="single" min={180} max={360} step={4} value={panel.width} onValueChange={resize}>
          <Slider.Range/>
          <Slider.Thumb index={0} aria-label={panel.name + ' width'} aria-valuetext={panel.width + ' pixels'}/>
        </Slider.Root>
      </div>
    </aside>
  {/if}
{/if}

<style>
  aside {
    --fit-width: min(var(--dock-width), round(down, calc((100vw - 300px) / 2), 1px));
    width: var(--fit-width);
    flex: 0 0 var(--fit-width);
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    border-inline: 1px solid var(--vict-color-border);
    background: var(--vict-color-surface);
  }
  h2 { margin: 0; padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--vict-color-border); }
  .dock-content { flex: 1; padding: 10px 12px; max-height: 62dvh; overflow: auto; }
  .size { display: grid; gap: 4px; padding: 8px 12px 12px; color: var(--vict-color-muted); font-size: 11px; }
  :global(.workspace-panel-dialog) { max-height: 85dvh; overflow: auto; }
</style>
