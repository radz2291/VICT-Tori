<script lang="ts">
  import { Button, Feedback, StatusBadge } from '@victframework/ui-svelte';
  import { memoryAge, memoryDate, memoryReasons } from './memory-display';
  let {run,load,check}=$props();
  let view=$state<any>();
  let checking=$state(false);
  let checkError=$state('');
  async function checkSave(){
    if(checking||!view?.operation?.operation)return;
    checking=true;checkError='';
    try{
      await check({session:run.session,run:run.id,operation:view.operation.operation});
      view=await load(run.id);
    }catch(e){checkError=(e as Error).message;}
    finally{checking=false;}
  }
  $effect(()=>{
    const id=run.id, terminal=run.status;
    let current=true;
    view=undefined;
    void load(id,terminal).then(value=>{if(current)view=value;},
      ()=>{if(current)view={status:'error'};});
    return ()=>{current=false;};
  });
</script>

<section class="run-memory-evidence" aria-label="Saved memory admission">
  <h3>Saved memory</h3>
  {#if !view}
    <Feedback message="Loading saved memory evidence…"/>
  {:else if view.status==='denied'}
    <Feedback kind="denied" message={memoryReasons['access-denied']}/>
  {:else if view.status==='error'}
    <Feedback kind="error" message="Saved memory evidence could not be loaded."/>
  {:else}
    {@const count=view.evidence.admitted.length}
    <StatusBadge value={count===1?'1 memory admitted':count+' memories admitted'}/>
    {#if view.evidence.status!=='admitted'}
      <p>{memoryReasons[view.evidence.status]??view.evidence.status}</p>
    {/if}
    {#if view.evidence.bytes||view.evidence.omitted.length}
      <p class="memory-meta">{view.evidence.bytes} / {view.evidence.budgetBytes} UTF-8 bytes</p>
    {/if}
    {#each view.evidence.admitted as item, i (item.id)}
      {@const resolved=view.records[i]}
      <dl>
        <dt>Memory</dt><dd class="hash">{item.id} · r{item.revision}</dd>
        <dt>Source message</dt><dd class="hash">{item.source.message}<br/>Session {item.source.session}</dd>
        <dt>Context basis</dt><dd class="hash">{item.contextBasis.join(', ')}</dd>
        <dt>Age at admission</dt><dd>{memoryAge(item.ageMs)}</dd>
        <dt>Last used at this Run</dt><dd>{memoryDate(item.lastUsedAt)}</dd>
        <dt>Content</dt><dd class="memory-value">{resolved.status==='forgotten'?'Forgotten · audit reference retained':
          resolved.status==='available'?resolved.memory.content:memoryReasons['storage-unavailable']}</dd>
      </dl>
    {/each}
    {#each view.evidence.omitted as item (item.id)}
      <dl><dt>Omitted</dt><dd class="hash">{item.id} · r{item.revision}<br/>{memoryReasons[item.reason]??item.reason}</dd></dl>
    {/each}
    {#if view.operation?.status==='uncertain'}
      <StatusBadge value="Uncertain" tone="danger"/>
      <Feedback kind="error" message="The saved memory and receipt could not be reconciled. A retry is unavailable."/>
      {#if view.operation.operation}
        <dl><dt>Operation</dt><dd class="hash">{view.operation.operation}</dd></dl>
        <Button label="Check save outcome" variant="secondary" busy={checking} onclick={()=>void checkSave()}/>
      {/if}
      {#if checkError}<Feedback kind="error" message={checkError}/>{/if}
    {:else if view.operation?.status==='running'}
      <StatusBadge value="Running"/>
    {:else if view.receipt}
      <dl>
        <dt>Save outcome</dt><dd>Saved · {view.receipt.memoryId} · r{view.receipt.revision}</dd>
        {#if view.savedRecordStatus==='forgotten'}
          <dt>Current record</dt><dd>Forgotten · audit reference retained</dd>
        {:else if view.savedRecordStatus!=='available'}
          <dt>Current record</dt><dd>{memoryReasons['storage-unavailable']}</dd>
        {/if}
        <dt>Source message</dt><dd class="hash">{view.receipt.source.message}<br/>Session {view.receipt.source.session}</dd>
        <dt>Context basis</dt><dd class="hash">{view.receipt.contextBasis.join(', ')}</dd>
        <dt>Operation</dt><dd class="hash">{view.receipt.operation}</dd>
      </dl>
    {:else if view.operation?.status==='interrupted'&&view.operation.reason==='no-commit'}
      <StatusBadge value="Interrupted"/>
      <p>The original confirmation did not commit.</p>
    {:else if view.proposal}
      <p>{view.proposal==='pending'?'Confirmation pending. Nothing saved.':'Nothing saved. '+(memoryReasons[view.proposal]??view.proposal)}</p>
    {:else if view.request?.status==='not-saved'}
      <p>Nothing saved. {memoryReasons[view.request.reason]??view.request.reason}</p>
    {/if}
  {/if}
</section>
