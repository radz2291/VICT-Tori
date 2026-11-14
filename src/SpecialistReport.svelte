<script lang="ts">
  import { Button, Detail } from '@victframework/ui-svelte';
  let {report,inspectRun}=$props();
  const value=(number:unknown)=>number==null?'Unavailable':String(number);
</script>

{#if report}
  {#if report.specialist?.parentRunId||report.specialist?.children?.length}
    <section aria-label="Specialist report">
      <h3>Specialist report</h3>
      <dl>
        <dt>Task</dt><dd>{report.specialist.task??'Unavailable'}</dd>
        <dt>Expected result</dt><dd>{report.specialist.expectedResult??'Unavailable'}</dd>
        <dt>Final result</dt><dd>{report.finalAnswer??'Unavailable'}</dd>
        <dt>Revision</dt><dd>{report.specialist.revision??'Unavailable'}</dd>
        <dt>Activation</dt><dd class="hash">{report.specialist.activation??'Unavailable'}</dd>
        <dt>Terminal reason</dt><dd>{report.terminalReason??'Unavailable'}</dd>
        <dt>Parent questions</dt><dd>{report.specialist.exchangeAvailability}</dd>
        {#if report.specialist.parentInvocation}<dt>Parent invocation</dt><dd class="hash">{report.specialist.parentInvocation}</dd>{/if}
      </dl>
      {#if report.specialist.parentRunId}<Button label="Open parent Run" variant="secondary" onclick={()=>inspectRun(report.specialist.parentRunId)}/>{/if}
      {#each report.specialist.children??[] as child (child.id)}
        <Button label={'Open '+child.name+' Run'} variant="secondary" onclick={()=>inspectRun(child.id)}/>
      {/each}
    </section>
  {/if}
  <section class="run-budget" aria-label="Run budgets">
    <h3>Budgets</h3>
    {#each report.budget?.runs??[] as budget (budget.runId)}
      <h4>{budget.name}{budget.runId===report.runId?' · this Run':''}</h4>
      <Detail fields={budget.dimensions.map(row=>({label:row.label,value:'Limit '+value(row.limit)+' · Used '+value(row.consumed)+' · Left '+value(row.remaining)}))}/>
      {#each budget.dimensions.filter(row=>row.stopReason) as row (row.key)}<p class="activity-unavailable">{row.label}: {row.stopReason}</p>{/each}
    {/each}
    <h4>Combined consumption</h4>
    <dl>{#each report.budget?.combined??[] as row (row.key)}<dt>{row.label}</dt><dd>{value(row.consumed)}</dd>{/each}
      <dt>Team limit / remaining</dt><dd>{report.budget?.teamLimit??'Not configured'}</dd>
    </dl>
  </section>
{/if}
