<script>
  import { Menubar } from '@victframework/ui-svelte/catalog/menubar';
  let { menus, panels, toggle, reset } = $props();
</script>

<Menubar.Root aria-label="Studio commands" class="studio-menubar">
  {#each menus as menu (menu.name)}
    <Menubar.Menu value={menu.name}>
      <Menubar.Trigger>{menu.name}</Menubar.Trigger>
      <Menubar.Content class="studio-command-menu" align="start" sideOffset={4}>
        {#if menu.name === 'Window'}
          {#if panels.length}
            {#each panels as panel (panel.name)}
              <Menubar.CheckboxItem checked={panel.open} onCheckedChange={() => toggle(panel.name)}>
                <span aria-hidden="true">{panel.open ? '✓' : '·'}</span> {panel.name}
              </Menubar.CheckboxItem>
            {/each}
            <Menubar.Separator/>
            <Menubar.Item onSelect={reset}>Reset layout</Menubar.Item>
          {:else}
            <Menubar.Item disabled>No panels available in this workspace</Menubar.Item>
          {/if}
        {:else}
          {#each menu.items as item (item.label)}
            <Menubar.Item disabled={!item.run} onSelect={() => item.run?.()}>
              {item.label}{#if item.hint}<kbd>{item.hint}</kbd>{/if}
            </Menubar.Item>
          {/each}
        {/if}
      </Menubar.Content>
    </Menubar.Menu>
  {/each}
</Menubar.Root>

<style>
  :global(.studio-menubar) { display: flex; gap: 2px; overflow-x: auto; border: 0; padding: 0; }
  :global(.studio-menubar [data-menubar-trigger]) { padding: 5px 9px; border: 0; color: var(--vict-color-text); background: transparent; }
  :global(.studio-menubar [data-state='open']), :global(.studio-menubar [data-menubar-trigger]:hover) { background: var(--studio-raised); }
  :global(.studio-command-menu) { z-index: 30; min-width: 13rem; padding: 4px; color: var(--vict-color-text); background: var(--vict-color-surface); border: 1px solid var(--vict-color-border); box-shadow: 0 8px 22px #0007; }
  :global(.studio-command-menu [role^='menuitem']) { display: flex; align-items: center; gap: 8px; padding: 7px 9px; }
  :global(.studio-command-menu [data-highlighted]) { background: var(--studio-raised); }
  :global(.studio-command-menu [data-disabled]) { color: var(--vict-color-muted); }
  kbd { margin-left: auto; color: var(--vict-color-muted); font: inherit; }
</style>
