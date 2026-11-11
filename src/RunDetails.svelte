<script lang="ts">
  import { Button } from '@victframework/ui-svelte';
  let {run,inspectRun}=$props();
</script>

<div class="run-details">
  <section aria-label="Execution">
    <h3>Execution</h3>
    <dl>
      <dt>Provider / model</dt>
      <dd>{run.provider==='offline-fixture'?'Offline fixture':(run.fixture?'Simulated ':'')+'Z.AI '+(run.route==='coding'?'Coding':'General')} / {run.observedModel??run.model}</dd>
      <dt>Output token limit</dt>
      <dd>{run.tokens}{run.sentMaxOutputTokens===undefined?' - configured':' - sent '+run.sentMaxOutputTokens}</dd>
      {#if run.execution}
        <dt>Sampling</dt>
        <dd>Temperature {run.execution.temperature??'provider default'}{run.sentTemperature!==undefined?' · sent '+run.sentTemperature:''} / Top-p {run.execution.topP??'provider default'}{run.sentTopP!==undefined?' · sent '+run.sentTopP:''}</dd>
        <dt>Execution limits</dt>
        <dd>{run.execution.maxSteps} steps · {run.execution.maxRetries} model retries · {run.execution.maxToolCalls} tool calls · {run.execution.deadlineMs/1000}s host deadline</dd>
        <dt>Provider attempts</dt><dd>{run.providerAttempts??'Not reported'}</dd>
      {/if}
      {#if run.modelSteps!==undefined}<dt>Observed model steps</dt><dd>{run.modelSteps}</dd>{/if}
      {#if run.toolCalls!==undefined}<dt>Admitted tool calls</dt><dd>{run.toolCalls}</dd>{/if}
      <dt>Usage</dt><dd>{run.usage?run.usage.inputTokens+' input / '+run.usage.outputTokens+' output':'Not reported'}</dd>
    </dl>
  </section>
  <section aria-label="Evidence">
    <h3>Evidence</h3>
    <dl>
      <dt>Context</dt><dd>{run.context?run.context.source+' · '+run.context.status+(run.context.reason?' · '+run.context.reason:run.context.reads?' · '+run.context.reads+' read':''):'No on-demand source admitted'}</dd>
      {#if run.memory}<dt>Scoped memory</dt><dd>{run.memory==='recent-10@1'?'Last 10 messages':'Last 100 messages'} · this Session</dd>{/if}
      {#if run.outputContract}<dt>Output validation</dt><dd>{run.outputContract.id} · r{run.outputContract.revision} · {run.outputValidation??'not validated'}</dd>{/if}
      {#if run.governance&&!run.scriptReceipts?.length}
        <dt>Governed tool</dt><dd>{run.governance.calls} MCP calls · {run.governance.disposition??'not called'}</dd>
        {#if run.governance.scope}<dt>Tool scope</dt><dd>{run.name} · r{run.number} · read-only observatory</dd>{/if}
      {/if}
      <dt>Thinking</dt><dd>{run.reasoningAt?'Earlier provider observation; not a public VICT reasoning event.':'No public reasoning events or summary are available for this run.'}</dd>
    </dl>
  </section>
  {#if run.draftTarget}
    <section aria-label="Draft authoring">
      <h3>Draft authoring</h3>
      <dl>
        <dt>Definition</dt><dd class="hash">{run.draftTarget.definition}</dd>
        <dt>Occurrence</dt><dd>{run.draftTarget.occurrenceId}</dd>
        <dt>Open draft</dt><dd class="hash">{run.draftTarget.draftId}</dd>
        {#each run.draftReceipts??[] as receipt (receipt.operationId)}
          <dt>Outcome</dt><dd>{receipt.status}</dd>
          <dt>Operation</dt><dd class="hash">{receipt.operationId}</dd>
          <dt>{typeof receipt.revision==='string'?'Draft → saved revision':'Revision'}</dt>
          <dd>{receipt.expectedRevision}{receipt.revision===undefined?'':' → '+receipt.revision}</dd>
        {:else}
          <dt>Outcome</dt><dd>{run.authoringOutcomes?.at(-1)??'No confirmed draft receipt'}</dd>
        {/each}
      </dl>
    </section>
  {/if}
  {#if run.authoringActions?.length}
    <section aria-label="Studio actions">
      <h3>Studio actions</h3>
      {#each run.authoringActions as item (item.operationId)}
        {@const linked=item.result.run?.id??item.result.runId}
        <dl>
          <dt>Action</dt><dd>{item.action} · {item.result.status}</dd>
          <dt>Operation</dt><dd class="hash">{item.operationId}</dd>
          {#if item.result.message}<dt>Result</dt><dd>{item.result.message}</dd>{/if}
          {#each item.result.definitions??[] as definition (definition.definitionId)}
            <dt>Definition</dt><dd>{definition.name} · {definition.definitionId}</dd>
            <dt>Draft</dt><dd class="hash">{definition.receipt.draftId} · {definition.receipt.expectedRevision} → {definition.receipt.revision}</dd>
            <dt>Saved revision</dt><dd class="hash">{definition.savedRevision??'Unsaved'}</dd>
            <dt>Readiness</dt><dd>{definition.readiness}</dd>
          {/each}
          {#if item.result.saveStatus}<dt>Save outcome</dt><dd>{item.result.saveStatus}</dd>{/if}
          {#if item.result.savedRevision}
            <dt>Saved revision</dt><dd class="hash">{item.result.savedRevision}</dd>
          {/if}
          {#if linked}<dt>Run</dt><dd class="hash">{linked}</dd>{/if}
        </dl>
        {#if linked}
          <Button label="Open linked Run" variant="secondary" onclick={()=>inspectRun(linked)}/>
        {/if}
        {#each item.result.run?.children??[] as child (child.id)}
          <Button label={'Open '+child.name+' Run'} variant="secondary" onclick={()=>inspectRun(child.id)}/>
        {/each}
      {/each}
    </section>
  {/if}
  {#if run.scriptReceipts?.length}
    <section aria-label="Script evidence">
      <h3>Script evidence</h3>
      {#each run.scriptReceipts as receipt (receipt.invocationId)}
        <dl>
          <dt>Tool</dt><dd>{receipt.id} · r{receipt.revision}</dd>
          <dt>Permission</dt><dd class="hash">{receipt.grant}</dd>
          <dt>Entry point</dt><dd>{receipt.entry}</dd>
          <dt>Invocation</dt><dd class="hash">{receipt.invocationId}</dd>
          <dt>Outcome</dt><dd>{receipt.status} · {receipt.calls} script {receipt.calls===1?'invocation':'invocations'}</dd>
          <dt>Input key</dt><dd>{receipt.key}</dd>
          {#if receipt.reason}<dt>Reason</dt><dd>{receipt.reason}</dd>{/if}
          {#if receipt.result}<dt>Result</dt><dd>{receipt.result.text}</dd>{/if}
        </dl>
      {/each}
    </section>
  {/if}
  <section aria-label="Provenance">
    <h3>Provenance</h3>
    <dl>
      <dt>Run</dt><dd class="hash">{run.id}</dd>
      <dt>Activation</dt><dd class="hash">{run.activation}</dd>
      {#if run.authoringRun}<dt>Authoring Run</dt><dd class="hash">{run.authoringRun}</dd>{/if}
      {#if run.parentRun}
        <dt>Parent Run</dt><dd class="hash">{run.parentRun}</dd>
        <dt>Parent invocation</dt><dd class="hash">{run.parentInvocation}</dd>
      {/if}
      {#if run.governance?.turnId}<dt>VICT turn</dt><dd class="hash">{run.governance.turnId}</dd>{/if}
    </dl>
  </section>
</div>
