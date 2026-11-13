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
    let timer:ReturnType<typeof setTimeout>;
    const refresh=()=>void load(id,terminal).then(value=>{
      if(!current)return;
      view=value;
      if(value.directive?.status==='pending')timer=setTimeout(refresh,750);
    },()=>{if(current)view={status:'error'};});
    refresh();
    return ()=>{current=false;clearTimeout(timer);};
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
    {#if view.directive}
      <dl>
        <dt>Directive</dt><dd>{view.directive.status}{view.directive.reason?' · '+view.directive.reason:''}</dd>
        <dt>Policy revision</dt><dd class="hash">{view.directive.policyRevision}</dd>
        <dt>Interpretation limits</dt><dd>{view.directive.historyUsedBytes?.toLocaleString()??'—'} / {view.directive.historyBytes.toLocaleString()} bytes · {view.directive.deadlineMs/1000} s · {view.directive.outputTokens} tokens requested{view.directive.sentOutputTokens?' / '+view.directive.sentOutputTokens+' sent':''}</dd>
        <dt>Interpreter finish</dt><dd>{view.directive.finish??'Not reported'}</dd>
        {#if view.directive.reasoningEffort}
          <dt>Interpreter reasoning effort</dt><dd>{view.directive.reasoningEffort}</dd>
        {/if}
        <dt>Interpreter usage</dt><dd>{view.directive.usage?`${view.directive.usage.input??'Unknown'} input / ${view.directive.usage.output??'unknown'} output / ${view.directive.usage.reasoning??'unknown'} reasoning`:'Not reported'}</dd>
      </dl>
    {/if}
    {#each view.evidence.admitted as item, i (item.id)}
      {@const resolved=view.records[i]}
      <dl>
        <dt>Memory</dt><dd class="hash">{item.id} · r{item.revision}</dd>
        <dt>Source message</dt><dd class="hash">{item.source.message}<br/>Session {item.source.session}</dd>
        <dt>Context basis</dt><dd class="hash">{item.contextBasis.join(', ')}</dd>
        {#if resolved.provenance?.messages.some((source:any)=>source.status==='unavailable')}
          <dt>Provenance</dt><dd>Source text unavailable</dd>
        {/if}
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
        {#if view.provenance?.messages.some((item:any)=>item.status==='unavailable')}
          <dt>Provenance</dt><dd>Source text unavailable</dd>
        {/if}
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
