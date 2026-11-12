<script lang="ts">
  import { Select } from '@victframework/ui-svelte';
  import { savedMemoryChoices } from './assembly';
  let {id,value,set}:{id:string;value:string;set:(value:string)=>void}=$props();
</script>

<div class="saved-memory-setting">
  <label for={id}>Saved memory</label>
  <Select {id} name="saved-memory" {value} options={savedMemoryChoices} onChange={choice=>{if(choice)set(choice);}}/>
</div>
