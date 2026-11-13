<script lang="ts">
  import { tick } from 'svelte';
  import { Button, Feedback, Select, StatusBadge } from '@victframework/ui-svelte';
  import { Dialog, Label } from '@victframework/ui-svelte/primitives';
  import { Textarea } from '@victframework/ui-ai-svelte';
  import { memoryAge, memoryDate, memoryReasons, type MemoryTurn } from './memory-display';
  let {view,mode,act,sessionId,turn,busyTurn,messages=[]}:{
    view:any; mode:'card'|'list'; sessionId:string; turn?:MemoryTurn; busyTurn:boolean;
    act:(path:string,body:any,sessionId:string)=>Promise<any>;
    messages?:{id:string;text:string}[];
  }=$props();
  let busy=$state(false);
  let problem=$state('');
  let result=$state('');
  let content=$state('');
  let correcting=$state(false);
  let card=$state<HTMLElement>();
  let edited=$state('');
  let manualRun=$state('');
  let manualText=$state('');
  let choices=$derived((view?.manualRuns??[]).flatMap((run:string)=>{
    const source=messages.find(message=>message.id===run+'-user');
    return source?[{value:run,label:Array.from(source.text).slice(0,100).join('')}]:[];
  }));
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
  let forgotten=$derived(saved?.memory.status==='forgotten');
  let saveOperation=$derived(turn?.operation);
  let uncertain=$derived(saveOperation?.status==='uncertain');
  let saving=$derived(saveOperation?.status==='running');
  function focusHeading(){
    return tick().then(()=>card?.querySelector<HTMLElement>('h3')?.focus());
  }
  async function correctProposal(){
    content=proposal?.text??'';correcting=true;problem='';
    await tick();
    card?.querySelector('textarea')?.focus();
  }
  async function cancelCorrection(){
    correcting=false;problem='';
    await tick();
    card?.querySelector<HTMLElement>('[data-action-id="correct-proposal"]')?.focus();
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
      const outcome=await act(path,body,sessionId);
      if(path==='check'){
        result=outcome.status==='saved'?'The original receipt was found.':
          outcome.status==='interrupted'?'The original save did not commit. You can confirm it again.':
          outcome.status==='uncertain'?'The original save still cannot be reconciled.':'The save has not settled.';
        await focusHeading();
      }else if(path==='correct'||path==='forget'){
        close();
        if(path==='correct')result='Memory corrected.';
        else if(mode==='list')result='Memory forgotten. Older Runs keep the receipt without the text.';
      }else if(path==='manual'){
        manualRun='';manualText='';
      }else{
        correcting=false;
        await focusHeading();
      }
    }catch(e){problem=(e as Error).message;}
    finally{
      busy=false;
      if(problem&&card&&!actionOpen){
        await tick();
        const focused=document.activeElement;
        if(card?.isConnected&&(card.contains(focused)||focused===document.body)){
          // Return to the edit and bring its adjacent error into the feed.
          if(correcting)card.querySelector('textarea')?.focus();
          card.querySelector('[role="alert"]')?.scrollIntoView({block:'nearest'});
        }
      }
    }
  }
  function confirmProposal(){
    if(!proposal||proposal.status!=='pending')return;
    if(correcting&&proposal.directive){
      void submit('revise',{run:proposal.run,operation:proposal.operation,revision:proposal.directive.revision,text:content});
      return;
    }
    void submit('confirm',{run:proposal.run,operation:proposal.operation,text:valueToSave,
      ...(proposal.directive?{revision:proposal.directive.revision}:{})});
  }
</script>

{#if mode==='card' && turn}
  <section class="memory-confirmation" bind:this={card}
    data-memory-state={uncertain?'uncertain':saving?'running':saved?(forgotten?'forgotten':'saved'):proposal?.status??'request'}
    data-memory-turn={turn.run} data-source-message={turn.source} aria-labelledby={inputId+'-heading'}>
    <div class="memory-card-heading">
      <span class="memory-card-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 20V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14l-6-4-6 4Z"/>
        </svg>
      </span>
      <h3 id={inputId+'-heading'} tabindex="-1" aria-describedby={saved?inputId+'-status':undefined}>
        {saved?'Memory':proposal?'Memory proposal':'Memory request'}
      </h3>
      {#if saved}
        <span class="memory-card-status" id={inputId+'-status'}>
          <StatusBadge value={forgotten?'Forgotten':'Saved'} tone={forgotten?'neutral':'success'}/>
        </span>
      {:else if proposal?.status==='pending'}
        <span class="memory-card-source">{proposal.contextBasis.length} source {proposal.contextBasis.length===1?'message':'messages'}</span>
      {/if}
    </div>
    {#if uncertain}
      <Feedback kind="error" message="Save outcome Uncertain. The original operation must be reconciled before a retry."/>
      {#if saveOperation?.operation}
        <p class="memory-card-note">Operation {saveOperation.operation}</p>
        <div class="memory-actions memory-card-actions">
          <Button label="Check save outcome" variant="secondary" {busy}
            onclick={()=>void submit('check',{run:turn.run,operation:saveOperation.operation})}/>
        </div>
      {/if}
    {:else if saving}
      <Feedback message="Saving the confirmed memory…"/>
      <div class="memory-actions memory-card-actions">
        <Button label="Stop memory save" variant="secondary" {busy} onclick={()=>void submit('stop',{run:turn.run})}/>
      </div>
    {:else if proposal?.status==='pending'}
      <div class="memory-card-body">
        {#if saveOperation?.status==='interrupted'&&saveOperation.reason==='no-commit'}
          <Feedback message="The previous confirmation did not commit. Review the text before confirming again."/>
        {/if}
        {#if correcting}
          <Label.Root for={inputId}>Memory to save</Label.Root>
          <Textarea id={inputId} class="tori-field" rows={3} bind:value={content} disabled={busy||busyTurn}
            aria-describedby={problem?inputId+'-problem':undefined}/>
        {:else}
          <p class="memory-value" data-testid="memory-proposal-text">{proposal.text}</p>
        {/if}
        {#if !actionOpen&&problem}
          <div id={inputId+'-problem'}><Feedback kind="error" message={problem}/></div>
        {/if}
        {#if !correcting}<p class="memory-card-note">Review before saving for future Sessions.</p>{/if}
      </div>
      <div class="memory-actions memory-card-actions">
        <Button label={correcting&&proposal.directive?'Review correction':'Confirm and save'} {busy} disabled={busyTurn||!valueToSave.trim()}
          onclick={confirmProposal}/>
        {#if correcting}
          <Button label="Cancel correction" variant="secondary" {busy} disabled={busyTurn} onclick={()=>void cancelCorrection()}/>
        {:else}
          <Button label="Correct" actionId="correct-proposal" variant="secondary" {busy} disabled={busyTurn} onclick={()=>void correctProposal()}/>
        {/if}
        <Button label="Dismiss" variant="secondary" presentation={{class:'memory-card-quiet memory-card-dismiss'}} {busy} disabled={busyTurn}
          onclick={()=>void submit('dismiss',{run:proposal.run})}/>
      </div>
    {:else if saved?.memory.memory}
      <div class="memory-card-body">
        <p class="memory-value" data-testid="memory-confirmed-text">{saved.memory.memory.content}</p>
        {#if savedRecord&&savedRecord.revision!==saved.receipt.revision}
          <p class="memory-card-note">Confirmed as revision {saved.receipt.revision}. Current revision: {savedRecord.revision}.</p>
        {/if}
      </div>
      {#if savedRecord}
        <div class="memory-actions memory-card-actions">
          <Button label="Correct memory" variant="secondary" haspopup="dialog" disabled={busy||busyTurn} onclick={(event)=>edit(event,savedRecord,'correct')}/>
          <Button label="Forget memory" variant="secondary" presentation={{class:'memory-card-quiet memory-card-forget'}} haspopup="dialog"
            disabled={busy||busyTurn} onclick={(event)=>edit(event,savedRecord,'forget')}/>
        </div>
      {/if}
    {:else if saved}
      <Feedback message={forgotten?'This memory was forgotten. Its save receipt is still in Runs.':memoryReasons['storage-unavailable']}/>
    {:else if proposal}
      <Feedback message={proposal.status==='saved'?memoryReasons['storage-unavailable']:'Nothing saved. '+(memoryReasons[proposal.status]??'Proposal closed.')}/>
    {:else if turn.request}
      <Feedback message={turn.request.reason==='memory-or-reminder'?memoryReasons['memory-or-reminder']:
        'Nothing saved. '+(memoryReasons[turn.request.reason]??'No memory was confirmed.')}/>
    {/if}
    {#if !actionOpen&&problem&&(uncertain||saving||proposal?.status!=='pending')}
      <Feedback kind="error" message={problem}/>
    {/if}
    {#if result}<Feedback message={result}/>{/if}
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
      {#if view.interpreting?.length}
        <ul class="memory-records" aria-label="Pending interpretations">
          {#each view.interpreting as run (run)}
            {@const source=messages.find(message=>message.id===run+'-user')}
            <li>
              <p class="memory-meta">{source?.text??'Session message'}</p>
              <Button label="Stop interpretation" variant="secondary" {busy} onclick={()=>void submit('stop',{run})}/>
            </li>
          {/each}
        </ul>
      {/if}
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
          <li><Feedback kind="empty" message={(view.canPropose||view.legacy)
            ?'No saved memories yet. Ask this agent to remember something.':'No saved memories yet.'}/></li>
        {/each}
      </ul>
      {#if choices.length}
        <div class="memory-actions">
          <Label.Root for={inputId+'-turn'}>Draft a memory from a turn</Label.Root>
          <Select id={inputId+'-turn'} name="manual-memory-source" options={choices} value={manualRun}
            onChange={value=>{manualRun=value;manualText='';}}/>
          {#if manualRun}
            <Label.Root for={inputId+'-manual'}>Memory to propose</Label.Root>
            <Textarea id={inputId+'-manual'} class="tori-field" rows={3} bind:value={manualText}/>
            <Button label="Draft memory" variant="secondary" {busy} disabled={!manualText.trim()||busyTurn}
              onclick={()=>void submit('manual',{run:manualRun,text:manualText})}/>
          {/if}
        </div>
      {/if}
      {#if problem&&!actionOpen}<Feedback kind="error" message={problem}/>{/if}
    {/if}
  </section>
{/if}
{#if mode==='list'&&result}<Feedback message={result}/>{/if}

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
        <Label.Root for={inputId+'-edit'}>Corrected memory</Label.Root>
        <Textarea id={inputId+'-edit'} class="tori-field" rows={4} bind:value={edited} disabled={busy}/>
      {:else if target?.content}
        <p class="memory-value">{target.content}</p>
      {/if}
      {#if problem}<Feedback kind="error" message={problem}/>{/if}
      <div class="memory-actions">
        <Dialog.Close class="vict-btn vict-btn--quiet" type="button" disabled={busy}>Cancel</Dialog.Close>
        <Button label={action==='correct'?'Save correction':'Forget'} variant={action==='forget'?'danger':'primary'} {busy} disabled={busyTurn||(action==='correct'&&!edited.trim())}
          onclick={()=>void submit(action,{id:target.id,revision:target.revision,operation,...(action==='correct'?{text:edited}:{})})}/>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
