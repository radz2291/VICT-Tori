<script>
  import { Select } from '@victframework/ui-svelte/catalog/select';

  let { label, value, options, change } = $props();
</script>

<Select.Root type="single" {value} onValueChange={change}>
  <Select.Trigger aria-label={label}>{options.find(option => option.value === value)?.label ?? label}</Select.Trigger>
  <Select.Content sideOffset={4} align="start">
    {#each options as option (option.value)}
      <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
