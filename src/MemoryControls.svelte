<script lang="ts">
  import { tick } from 'svelte';
  import { Button, Feedback, StatusBadge } from '@victframework/ui-svelte';
  import { Dialog } from '@victframework/ui-svelte/primitives';
  import { Textarea } from '@victframework/ui-ai-svelte';
  import { memoryAge, memoryDate, memoryReasons } from './memory-display';
  let {view,mode,act,sessionId,currentRun,busyTurn}=$props();
  let busy=$state(false);
  let problem=$state('');
  let result=$state('');
  let content=$state('');
  let edited=$state('');
  let actionOpen=$state(false);
  let action=$state<'correct'|'forget'>('correct');
  let target=$state<any>();
  let operation='';
  let invoker:HTMLElement|null=null;
  let inputId=$derived('saved-memory-'+mode+'-'+sessionId);
  let proposal=$derived(view?.proposal);
  let latestSaved=$derived(proposal?.run===currentRun?view?.saved:undefined);
  let savedRecord=$derived(view?.records?.find((item:any)=>item.id===latestSaved?.receipt.memoryId&&item.status==='available'));
  $effect(()=>{
    content=proposal?.status==='pending'?proposal.text:'';
  });
  $effect(()=>{currentRun;result='';problem='';});
  function edit(event:MouseEvent,item:any,next:'correct'|'forget'){
    invoker=event.currentTarget as HTMLElement;
    target=item;edited=item.content??'';action=next;operation=crypto.randomUUID();
    problem='';result='';actionOpen=true;
  }
  function close(){
    actionOpen=false;
    void tick().then(()=>invoker?.isConnected?invoker.focus({preventScroll:true}):document.getElementById(inputId+'-heading')?.focus({preventScroll:true}));
  }
  async function submit(path:string,body:any) {
    if(busy)return;
    busy=true;problem='';result='';
    try {
      const response=await act(path,body);
      if(path==='correct'||path==='forget'){
        close();
        result=path==='correct'?'Memory corrected.':'Memory forgotten. Older Runs keep the receipt without the text.';
      }else if(response?.memory?.status==='forgotten')result='The original save was confirmed. The memory has since been forgotten.';
    }catch(e){problem=(e as Error).message;}
    finally{busy=false;}
  }
</script>

{#if mode==='confirmation'}
  {#if proposal?.status==='pending'}
    <section class="memory-confirmation" aria-labelledby={inputId+'-heading'}>
      <h3 id={inputId+'-heading'} tabindex="-1">Confirm saved memory</h3>
      <label class="visually-hidden" for={inputId}>Memory to save</label>
      <Textarea id={inputId} class="tori-field" rows={2} bind:value={content} disabled={busy||busyTurn}/>
      <p class="memory-meta">Based on {proposal.contextBasis.length} {proposal.contextBasis.length===1?'message':'messages'} in this Session.</p>
      <div class="memory-actions">
        <Button label="Confirm and save" disabled={busy||busyTurn||!content.trim()} onclick={()=>void submit('confirm',{run:proposal.run,operation:proposal.operation,text:content})}/>
        <Button label="Dismiss" variant="secondary" disabled={busy||busyTurn} onclick={()=>void submit('dismiss',{run:proposal.run})}/>
      </div>
      {#if problem}<Feedback kind="error" message={problem}/>{/if}
    </section>
  {:else if savedRecord}
    {@const memory=savedRecord}
    <section class="memory-confirmation" aria-label="Saved memory confirmation">
      <h3 id={inputId+'-heading'} tabindex="-1"><StatusBadge value="Saved"/></h3>
      <p class="memory-value">{memory.content}</p>
      <div class="memory-actions">
        <Button label="Correct memory" variant="secondary" disabled={busyTurn} onclick={(event)=>edit(event,memory,'correct')}/>
        <Button label="Forget memory" variant="secondary" disabled={busyTurn} onclick={(event)=>edit(event,memory,'forget')}/>
      </div>
    </section>
  {:else if proposal?.run===currentRun&&['expired','cancelled','dismissed'].includes(proposal?.status)}
    <Feedback message={'Nothing saved. '+(memoryReasons[proposal.status]??'Proposal closed.')}/>
  {:else if view?.request?.status==='not-saved'&&!['negated-request','not-an-explicit-request'].includes(view.request.reason)}
    <Feedback message={'Nothing saved. '+(memoryReasons[view.request.reason]??'No memory was confirmed.')}/>
  {/if}
{:else}
  <section class="memory-panel" aria-labelledby={inputId+'-heading'}>
    <h3 id={inputId+'-heading'} tabindex="-1">Saved memory</h3>
    {#if !view}
      <Feedback message="Loading saved memory…"/>
    {:else if view.status==='off'}
      <Feedback kind="empty" message={memoryReasons['policy-off']}/>
    {:else if view.status==='denied'}
      <Feedback kind="denied" message={memoryReasons['access-denied']}/>
    {:else if view.status==='error'}
      <Feedback kind="error" message="Saved memory could not be loaded. Reopen this Session to retry."/>
    {:else}
      {#if view.evidence?.omitted.some((item:any)=>item.reason==='budget')}
        <Feedback message={view.evidence.omitted.filter((item:any)=>item.reason==='budget').length+' eligible memories omitted by the latest Run’s memory budget.'}/>
      {/if}
      {#if view.evidence?.omitted.some((item:any)=>item.reason==='storage-unavailable')}
        <Feedback kind="error" message={memoryReasons['storage-unavailable']}/>
      {/if}
      <ul class="memory-records">
        {#each view.records as item (item.id)}
          <li>
            {#if item.status==='available'}<p class="memory-value">{item.content}</p>
            {:else}<Feedback kind="error" message={memoryReasons['storage-unavailable']}/>{/if}
            <p class="memory-meta">Revision {item.revision} · Updated {memoryAge(item.ageMs)} ago<br/>Last used: {memoryDate(item.lastUsedAt)}</p>
            <div class="memory-actions">
              <Button label="Correct memory" variant="secondary" disabled={busyTurn||item.status!=='available'} onclick={(event)=>edit(event,item,'correct')}/>
              <Button label="Forget memory" variant="secondary" disabled={busyTurn} onclick={(event)=>edit(event,item,'forget')}/>
            </div>
          </li>
        {:else}
          <li><Feedback kind="empty" message="No saved memories yet. Ask this agent to remember something."/></li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}
{#if result}<Feedback message={result}/>{/if}

<Dialog.Root bind:open={actionOpen}>
  <Dialog.Portal>
    <Dialog.Overlay class="sheet-shade studio-dialog-shade"/>
    <Dialog.Content class="mobile-sheet studio-dialog memory-dialog"
      onCloseAutoFocus={event=>{event.preventDefault();void tick().then(()=>invoker?.isConnected?invoker.focus({preventScroll:true}):document.getElementById(inputId+'-heading')?.focus({preventScroll:true}));}}
      onEscapeKeydown={event=>{if(busy)event.preventDefault();}}
      onInteractOutside={event=>{if(busy)event.preventDefault();}}>
      <Dialog.Title>{action==='correct'?'Correct saved memory':'Forget saved memory'}</Dialog.Title>
      <Dialog.Description>{action==='correct'?'Save a new revision of this memory.':'Remove this memory and all saved revisions from future Runs. Existing Session messages stay in the conversation.'}</Dialog.Description>
      {#if action==='correct'}
        <label for={inputId+'-edit'}>Corrected memory</label>
        <Textarea id={inputId+'-edit'} class="tori-field" rows={4} bind:value={edited} disabled={busy}/>
      {:else if target?.content}
        <p class="memory-value">{target.content}</p>
      {/if}
      {#if problem}<Feedback kind="error" message={problem}/>{/if}
      <div class="memory-actions">
        <Dialog.Close class="vict-btn vict-btn--quiet" type="button" disabled={busy}>Cancel</Dialog.Close>
        <Button label={action==='correct'?'Save correction':'Forget'} variant={action==='forget'?'danger':'primary'} disabled={busy||busyTurn||(action==='correct'&&!edited.trim())}
          onclick={()=>void submit(action,{id:target.id,revision:target.revision,operation,...(action==='correct'?{text:edited}:{})})}/>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
