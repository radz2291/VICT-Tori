<script>
  import { Select } from '@victframework/ui-svelte/catalog/select';

  let { label, value, options, change, portal = false } = $props();
</script>

<Select.Root type="single" {value} onValueChange={change}>
  <Select.Trigger aria-label={label}>{options.find(option => option.value === value)?.label ?? label}</Select.Trigger>
  {#snippet popup()}
    <Select.Content sideOffset={4} align="start">
      {#each options as option (option.value)}
        <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
      {/each}
    </Select.Content>
  {/snippet}
  {#if portal}<Select.Portal>{@render popup()}</Select.Portal>{:else}{@render popup()}{/if}
</Select.Root>
