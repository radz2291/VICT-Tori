<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ControlScope, Feedback } from '@victframework/ui-svelte';
  import { Button as ControlButton, Menubar } from '@victframework/ui-svelte/primitives';

  type Menu = {
    name: string;
    items: readonly {label: string; checked?: boolean; disabled?: boolean; fn: () => unknown}[];
  };

  let {wide, menu, error, page, pages, openPage, children, dialogs}: {
    wide: boolean;
    menu: readonly Menu[];
    error: string;
    page: string;
    pages: readonly string[];
    openPage: (page: string) => void;
    children: Snippet;
    dialogs: Snippet;
  } = $props();
</script>

<ControlScope class="tori-scope vict-app">
  <div class="studio" class:wide>
    <header class="shell">
      <div class="menuline"><span class="brand" role="img" aria-label="TORI Studio" title="TORI Studio">T</span>
      <Menubar.Root class="app-menu">
        {#each menu as family}
          <Menubar.Menu><Menubar.Trigger class="menu-trigger" id={family.name==='Window'?'window-menu-trigger':undefined}>{family.name}</Menubar.Trigger>
          <Menubar.Portal><Menubar.Content class="menu-content" align="start">
            {#each family.items as item}
              {#if 'checked' in item && item.checked!==undefined}
                <Menubar.CheckboxItem class="menu-item panel-check" checked={item.checked} disabled={item.disabled} onSelect={item.fn}>
                  {item.label}
                </Menubar.CheckboxItem>
              {:else}
                <Menubar.Item class="menu-item" disabled={item.disabled} onSelect={item.fn}>{item.label}</Menubar.Item>
              {/if}
            {/each}
          </Menubar.Content></Menubar.Portal></Menubar.Menu>
        {/each}
      </Menubar.Root><span class="local">LOCAL STUDIO</span></div>
    </header>
    {#if error}<div class="banner"><Feedback kind="error" message={error}/></div>{/if}
    {@render children()}
    <nav class="tasks" aria-label="Studio tasks">
      {#each pages as item}
        <ControlButton.Root class={'vict-btn vict-btn--secondary '+(page===item?'current-task':'')} aria-current={page===item?'page':undefined} disabled={['Workflows','Creative'].includes(item)} onclick={()=>openPage(item)}>{item}</ControlButton.Root>
      {/each}
    </nav>
  </div>
  {@render dialogs()}
</ControlScope>
