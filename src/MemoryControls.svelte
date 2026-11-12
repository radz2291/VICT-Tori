<script lang="ts">
  import { tick } from 'svelte';
  import { Button, Feedback, StatusBadge } from '@victframework/ui-svelte';
  import { Dialog } from '@victframework/ui-svelte/primitives';
  import { Textarea } from '@victframework/ui-ai-svelte';
  import { memoryAge, memoryDate, memoryReasons, type MemoryTurn } from './memory-display';
  let {view,mode,act,sessionId,turn,busyTurn}:{
    view:any; mode:'card'|'list'; sessionId:string; turn?:MemoryTurn; busyTurn:boolean;
    act:(path:string,body:any,sessionId:string)=>Promise<any>;
  }=$props();
  let busy=$state(false);
  let problem=$state('');
  let result=$state('');
  let content=$state('');
  let correcting=$state(false);
  let card=$state<HTMLElement>();
  let edited=$state('');
  let actionOpen=$state(false);
  let action=$state<'correct'|'forget'>('correct');
  let target=$state<any>();
  let operation='';
  let invoker:HTMLElement|null=null;
  let inputId=$derived('saved-memory-'+mode+'-'+(turn?.run??sessionId));
  let proposal=$derived(turn?.proposal);
  let saved=$derived(turn?.saved);
  let savedRecord=$derived(view?.records?.find((item:any)=>item.id===saved?.receipt.memoryId&&item.status==='available'));
  let valueToSave=$derived(correcting?content:proposal?.text??'');
  function focusHeading(){
    return tick().then(()=>card?.querySelector<HTMLElement>('h3')?.focus({preventScroll:true}));
  }
  async function correctProposal(){
    content=proposal?.text??'';correcting=true;problem='';
    await tick();
    card?.querySelector('textarea')?.focus({preventScroll:true});
  }
  async function cancelCorrection(){
    correcting=false;problem='';
    await tick();
    card?.querySelector<HTMLElement>('[data-action-id="correct-proposal"]')?.focus({preventScroll:true});
  }
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
      await act(path,body,sessionId);
      if(path==='correct'||path==='forget'){
        close();
        result=path==='correct'?'Memory corrected.':'Memory forgotten. Older Runs keep the receipt without the text.';
      }else{
        correcting=false;
        await focusHeading();
      }
    }catch(e){problem=(e as Error).message;}
    finally{busy=false;}
  }
</script>

{#if mode==='card' && turn}
  <section class="memory-confirmation" bind:this={card} data-memory-turn={turn.run} data-source-message={turn.source} aria-labelledby={inputId+'-heading'}>
    <div class="memory-card-heading">
      <h3 id={inputId+'-heading'} tabindex="-1">{proposal?'Memory proposal':'Memory request'}</h3>
      {#if saved}<StatusBadge value={saved.memory.status==='forgotten'?'Forgotten':'Saved'}/>{/if}
    </div>
    {#if proposal?.status==='pending'}
      <p class="memory-meta">Review the wording. Confirm to save it for future Sessions, or correct or dismiss it here.</p>
      {#if correcting}
        <label for={inputId}>Memory to save</label>
        <Textarea id={inputId} class="tori-field" rows={3} bind:value={content} disabled={busy||busyTurn}/>
      {:else}
        <p class="memory-value" data-testid="memory-proposal-text">{proposal.text}</p>
      {/if}
      <p class="memory-meta">Based on {proposal.contextBasis.length} {proposal.contextBasis.length===1?'message':'messages'} in this Session.</p>
      <div class="memory-actions">
        <Button label="Confirm and save" disabled={busy||busyTurn||!valueToSave.trim()}
          onclick={()=>void submit('confirm',{run:proposal.run,operation:proposal.operation,text:valueToSave})}/>
        {#if correcting}
          <Button label="Cancel correction" variant="secondary" disabled={busy||busyTurn} onclick={()=>void cancelCorrection()}/>
        {:else}
          <Button label="Correct" actionId="correct-proposal" variant="secondary" disabled={busy||busyTurn} onclick={()=>void correctProposal()}/>
        {/if}
        <Button label="Dismiss" variant="secondary" disabled={busy||busyTurn} onclick={()=>void submit('dismiss',{run:proposal.run})}/>
      </div>
    {:else if saved?.memory.memory}
      <p class="memory-value" data-testid="memory-confirmed-text">{saved.memory.memory.content}</p>
      {#if savedRecord}
        {#if savedRecord.revision!==saved.receipt.revision}
          <p class="memory-meta">Confirmed here as revision {saved.receipt.revision}. Current saved revision: {savedRecord.revision}.</p>
        {/if}
        <div class="memory-actions">
          <Button label="Correct memory" variant="secondary" haspopup="dialog" disabled={busy||busyTurn} onclick={(event)=>edit(event,savedRecord,'correct')}/>
          <Button label="Forget memory" variant="secondary" haspopup="dialog" disabled={busy||busyTurn} onclick={(event)=>edit(event,savedRecord,'forget')}/>
        </div>
      {/if}
    {:else if saved}
      <Feedback message={saved.memory.status==='forgotten'?'The original save has a receipt. The memory has since been forgotten.':memoryReasons['storage-unavailable']}/>
    {:else if proposal}
      <Feedback message={proposal.status==='saved'?memoryReasons['storage-unavailable']:'Nothing saved. '+(memoryReasons[proposal.status]??'Proposal closed.')}/>
    {:else if turn.request}
      <Feedback message={turn.request.reason==='memory-or-reminder'?memoryReasons['memory-or-reminder']:
        'Nothing saved. '+(memoryReasons[turn.request.reason]??'No memory was confirmed.')}/>
    {/if}
    {#if !actionOpen&&problem}<Feedback kind="error" message={problem}/>{/if}
  </section>
{:else if mode==='list'}
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
              <Button label="Correct memory" variant="secondary" haspopup="dialog" disabled={busyTurn||item.status!=='available'} onclick={(event)=>edit(event,item,'correct')}/>
              <Button label="Forget memory" variant="secondary" haspopup="dialog" disabled={busyTurn} onclick={(event)=>edit(event,item,'forget')}/>
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
