<script lang="ts">
  let {run}=$props();
</script>

<div class="run-details">
  <section aria-label="Execution">
    <h3>Execution</h3>
    <dl>
      <dt>Provider / model</dt>
      <dd>{run.parentRun?'Offline fixture':(run.fixture?'Simulated ':'')+'Z.AI '+(run.route==='coding'?'Coding':'General')} / {run.observedModel??run.model}</dd>
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
      <dt>Usage</dt><dd>{run.usage?run.usage.inputTokens+' input / '+run.usage.outputTokens+' output':'Not reported'}</dd>
    </dl>
  </section>
  <section aria-label="Evidence">
    <h3>Evidence</h3>
    <dl>
      <dt>Context</dt><dd>{run.context?run.context.source+' · '+run.context.status+(run.context.reason?' · '+run.context.reason:run.context.reads?' · '+run.context.reads+' read':''):'No on-demand source admitted'}</dd>
      {#if run.memory}<dt>Scoped memory</dt><dd>{run.memory==='recent-10@1'?'Last 10 messages':'Last 100 messages'} · this Session</dd>{/if}
      {#if run.outputContract}<dt>Output validation</dt><dd>{run.outputContract.id} · r{run.outputContract.revision} · {run.outputValidation??'not validated'}</dd>{/if}
      {#if run.governance}
        <dt>Governed tool</dt><dd>{run.governance.calls} MCP calls · {run.governance.disposition??'not called'}</dd>
        {#if run.governance.scope}<dt>Tool scope</dt><dd>{run.name} · r{run.number} · read-only observatory</dd>{/if}
      {/if}
      <dt>Thinking</dt><dd>{run.reasoningAt?'Earlier provider observation; not a public VICT reasoning event.':'No public reasoning events or summary are available for this run.'}</dd>
    </dl>
  </section>
  <section aria-label="Provenance">
    <h3>Provenance</h3>
    <dl>
      <dt>Run</dt><dd class="hash">{run.id}</dd>
      <dt>Activation</dt><dd class="hash">{run.activation}</dd>
      {#if run.parentRun}
        <dt>Parent Run</dt><dd class="hash">{run.parentRun}</dd>
        <dt>Parent invocation</dt><dd class="hash">{run.parentInvocation}</dd>
      {/if}
      {#if run.governance?.turnId}<dt>VICT turn</dt><dd class="hash">{run.governance.turnId}</dd>{/if}
    </dl>
  </section>
</div>
