<script>
  import { Menubar } from '@victframework/ui-svelte/catalog/menubar';
  import { DropdownMenu } from '@victframework/ui-svelte/catalog/dropdown-menu';
  let { menus, panels, toggle, reset, narrow = false } = $props();
</script>

{#if narrow}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="action mobile-menu">Menu</DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={4} class="studio-command-menu">
        {#each menus as menu (menu.name)}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>{menu.name}</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent class="studio-command-menu">
              {#if menu.name === 'Window'}
                {#each panels as panel (panel.name)}
                  <DropdownMenu.CheckboxItem checked={panel.open} onCheckedChange={() => toggle(panel.name)}>{panel.name}</DropdownMenu.CheckboxItem>
                {/each}
                <DropdownMenu.Item disabled={!panels.length} onSelect={reset}>{panels.length ? 'Reset layout' : 'No panels available'}</DropdownMenu.Item>
              {:else}
                {#each menu.items as item (item.label)}
                  <DropdownMenu.Item disabled={!item.run} onSelect={() => item.run?.()}>{item.label}</DropdownMenu.Item>
                {/each}
              {/if}
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
{:else}
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
            <Menubar.Item aria-keyshortcuts={item.hint?.replace('Ctrl', 'Control')} disabled={!item.run} onSelect={() => item.run?.()}>
              {item.label}{#if item.hint}<kbd aria-hidden="true">{item.hint}</kbd>{/if}
            </Menubar.Item>
          {/each}
        {/if}
      </Menubar.Content>
    </Menubar.Menu>
  {/each}
</Menubar.Root>
{/if}

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
