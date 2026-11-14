<script lang="ts">
  import { Feedback, StatusBadge } from '@victframework/ui-svelte';
  import { Button } from '@victframework/ui-svelte/primitives';
  import { Accordion } from '@victframework/ui-svelte/catalog/accordion';
  let {run,workspace,detail='quiet',inspect,compact=false}=$props();
  let report=$derived(run.report);
  const diagnostics=$derived((report?.problems??[]).filter(problem=>problem.code==='PUBLIC_EVENT_METADATA_UNAVAILABLE'));
  const operationalProblems=$derived((report?.problems??[]).filter(problem=>problem.code!=='PUBLIC_EVENT_METADATA_UNAVAILABLE'));
  const problems=$derived(detail==='full'?operationalProblems:
    operationalProblems.filter((problem,index,all)=>all.findIndex(item=>item.code===problem.code)===index));
  let expanded=$state<string[]>([]);
  const storageKey=$derived('tori-run-groups:'+workspace+':'+run.id);
  $effect(()=>{
    const key=storageKey;
    try{const saved=JSON.parse(localStorage.getItem(key)??'[]');expanded=Array.isArray(saved)?saved.filter(id=>typeof id==='string'):[];}
    catch{expanded=[];}
  });
  function change(values:string[]){
    expanded=values;
    try{localStorage.setItem(storageKey,JSON.stringify(values));}catch{}
  }
  const time=(value:string)=>{const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleTimeString():null;};
</script>

<section class="run-activity" class:compact aria-label="Run activity" data-run-activity={run.id}>
  {#if report}
    {#if problems.length}
      <div class="run-activity-problems" aria-label="Run problems">
        {#each problems as problem, index (problem.code+':'+index)}
          <div><StatusBadge value={problem.label} tone="danger"/>{#if detail==='full'&&problem.code}<code>{problem.code}</code>{/if}</div>
        {/each}
        {#if compact&&inspect}<Button.Root class="vict-btn vict-btn--quiet" onclick={()=>inspect(run.id)}>Inspect Run problem</Button.Root>{/if}
      </div>
    {/if}
    {#if report.gaps?.length}
      <Feedback message="Some public activity is unavailable. Saved outcomes remain authoritative."/>
    {/if}
    {#if detail!=='quiet'&&report.summaries?.length}
      <dl class="activity-facts" aria-label="Activity summary">
        {#each report.summaries as fact (fact.label)}<div><dt>{fact.label}</dt><dd>{fact.value??'Unavailable'}</dd></div>{/each}
      </dl>
    {/if}
    {#if report.groups?.length}
      <Accordion.Root type="multiple" class="activity-groups library-sections" value={expanded}
        onValueChange={change} aria-label="Working groups">
        {#each report.groups as group (group.id)}
          <Accordion.Item value={group.id}>
            <Accordion.Header><Accordion.Trigger aria-label={group.label}>
              <span>{group.label}</span><span class="activity-count">{group.rows.length}</span>
            </Accordion.Trigger></Accordion.Header>
            <Accordion.Content>
              {#if detail!=='full'&&group===report.groups[0]}
                {#each diagnostics as diagnostic (diagnostic.code)}<p class="activity-unavailable">{diagnostic.label}</p>{/each}
              {/if}
              <ol class="activity-rows">
                {#each group.rows as row (row.id)}
                  <li id={'receipt-'+encodeURIComponent(row.id)}>
                    <div><span>{row.label}</span>{#if row.at&&time(row.at)}<time datetime={row.at}>{time(row.at)}</time>{/if}</div>
                    {#if detail==='full'}
                      <dl class="activity-receipt">
                        <dt>Receipt</dt><dd>{row.id}</dd>
                        {#if row.streamId}<dt>Stream</dt><dd>{row.streamId}{row.seq==null?'':' · sequence '+row.seq}</dd>{/if}
                        {#if row.invocationId}<dt>Invocation</dt><dd>{row.invocationId}</dd>{/if}
                        {#if row.attemptId}<dt>Attempt</dt><dd>{row.attemptId}</dd>{/if}
                        {#if row.code}<dt>Reason</dt><dd>{row.code}</dd>{/if}
                        {#if row.contentRef}<dt>Content reference</dt><dd>{row.contentRef}</dd>{/if}
                      </dl>
                    {/if}
                  </li>
                {/each}
              </ol>
            </Accordion.Content>
          </Accordion.Item>
        {/each}
      </Accordion.Root>
    {/if}
    {#if compact&&inspect&&(detail!=='quiet'||report.specialist?.children?.length)}
      <div class="activity-links"><Button.Root class="vict-btn vict-btn--quiet" onclick={()=>inspect(run.id)}>Inspect Run</Button.Root>
        {#each report.specialist?.children??[] as child (child.id)}<Button.Root class="vict-btn vict-btn--quiet" onclick={()=>inspect(child.id)}>{'Open '+child.name+' Run'}</Button.Root>{/each}
      </div>
    {/if}
    {#if detail==='full'}
      {#each diagnostics as diagnostic (diagnostic.code)}<p class="activity-unavailable">{diagnostic.label}</p>{/each}
      <p class="activity-unavailable">{report.reasoning?.reason??'Public reasoning is unavailable.'}</p>
    {/if}
  {:else if detail!=='quiet'}
    <p class="activity-unavailable">Detailed activity is unavailable for this historical Run.</p>
  {/if}
</section>
