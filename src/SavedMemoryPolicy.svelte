<script lang="ts">
  import { tick } from 'svelte';
  import { Select } from '@victframework/ui-svelte';
  import { savedMemoryChoices } from './assembly';
  let {id,value,set}:{id:string;value:string;set:(value:string)=>void}=$props();
  let reset=$state(0);
  function choose(choice:string){
    if(choice){set(choice);return;}
    // The public Select always inserts an empty placeholder. It is not a policy.
    reset++;
    void tick().then(()=>document.getElementById(id)?.focus({preventScroll:true}));
  }
</script>

<div class="saved-memory-setting">
  <label for={id}>Saved memory</label>
  {#key reset}
    <Select {id} name="saved-memory" {value} options={savedMemoryChoices} onChange={choose}/>
  {/key}
</div>
