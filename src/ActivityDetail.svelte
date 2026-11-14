<script lang="ts">
  import { Select } from '@victframework/ui-svelte';
  let {id,value,change}=$props();
  const options=[{value:'quiet',label:'Quiet'},{value:'summary',label:'Summary'},{value:'full',label:'Full trace'}];
</script>

<div class="activity-detail-setting">
  <label for={id}>Activity detail</label>
  <Select {id} name="activity-detail" {value} {options} onChange={next=>{if(options.some(option=>option.value===next))change(next);}}/>
</div>
