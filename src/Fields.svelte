<script lang="ts">
  import { Button, Select, StatusBadge } from '@victframework/ui-svelte';
  import { Input } from '@victframework/ui-ai-svelte';
  import { binding, executionSettings, field, instructions, modelName, rootId, instructionId, modelNodeId, tokenSourceId, agentResources, resourceChoices, outputTokens, directiveValues } from './assembly';
  import { childRef, childName, delegateGrant, childTask, childResult, taskLengthLimit } from './delegation-fixture.mjs';
  let {graph,id,location='',childRevisions=[],pinnedChild,reveal,
    openDefinition,canOpenDefinition,fixture,section,pinnedDirective,pinnedHostDeadline}=$props();
  const prefix=$derived((location||'selection')+'-settings-'+id);
  const resource=$derived(agentResources.find(item=>item.id===id));
  const selectedChild=$derived(childRevisions.find(item=>'saved:'+item.id===field(graph,id,'reference')));
  const activeChild=$derived(childRevisions.find(item=>item.id===pinnedChild));
  const hostExecution=$derived(executionSettings(graph));
  const directive=$derived(directiveValues(graph));
  const scope=$derived(id==='tool'?'Read-only Tool':resource?.label??'Node');
</script>

{#if section==='configure'}
  <div class="configure-group configure-readonly" data-selected-node={id}>
    {#if id===rootId}
      <h2 class="configure-heading">Definition</h2>
      <dl class="delegation-facts">
        <dt>Agent name</dt><dd data-node-value="name">{field(graph,id,'name')}</dd>
        <dt>Model</dt><dd>{binding(graph,'model')&&field(graph,modelNodeId,'model')?modelName:'Not connected'}</dd>
        <dt>System instructions</dt><dd class="configure-instructions" data-node-value="instructions">{instructions(graph)||'Not written'}</dd>
        <dt>Execution</dt><dd data-node-value="execution">{hostExecution.maxSteps} steps · {hostExecution.maxToolCalls} calls · {hostExecution.maxRetries} retries · {typeof hostExecution.hostDeadlineMs==='number'?hostExecution.hostDeadlineMs/1000+' s':'Deadline missing'}</dd>
        {#if pinnedHostDeadline!==undefined}<dt>Active host deadline</dt><dd>{pinnedHostDeadline/1000} s</dd>{/if}
      </dl>
      <Button label="Show Agent on canvas" variant="secondary" onclick={()=>reveal(rootId)}/>
      <div class="configure-capability-grid" aria-label="Configured nodes">
        {#each graph.nodes.filter(node=>node.id!==rootId) as node (node.id)}
          {@const label=node.id===modelNodeId?'Model Reference':node.id===instructionId?'System prompt':node.id===tokenSourceId?'Output limit Integer':
            agentResources.find(resource=>resource.id===node.id)?.label??node.label}
          <Button label={'Show '+label+' on canvas'} variant="secondary" onclick={()=>reveal(node.id)}/>
        {/each}
      </div>
    {:else if id==='directive'}
      <h2 class="configure-heading">Standing Directive</h2>
      <dl class="delegation-facts">
        <dt>Display name</dt><dd>{directive.name}</dd>
        <dt>Recognition context</dt><dd class="configure-instructions">{directive.recognition}</dd>
        <dt>Transcript budget</dt><dd data-node-value="transcript-budget">{directive.historyBytes} bytes</dd>
        <dt>Interpretation deadline</dt><dd>{Number(directive.deadlineMs)/1000} seconds</dd>
        <dt>Interpretation output tokens</dt><dd>{directive.outputTokens}</dd>
        <dt>Sensitivity tuning</dt><dd>{directive.tuning==='on'?String(directive.sensitivity):'Off'}</dd>
        <dt>Active policy</dt><dd>{pinnedDirective?.status==='bound'?pinnedDirective.revision:'Not active'}</dd>
      </dl>
      <Button label="Show Standing Directive on canvas" variant="secondary" onclick={()=>reveal(id)}/>
    {:else if id===modelNodeId || id===tokenSourceId}
      <h2 class="configure-heading">{id===modelNodeId?'Model Reference':'Output limit Integer'}</h2>
      <dl class="delegation-facts">
        {#if id===modelNodeId}
          <dt>Model</dt><dd>{field(graph,id,'model')?modelName:'Not selected'}</dd>
          <dt>Temperature</dt><dd>{field(graph,id,'temperature')??'Provider default'}</dd>
          <dt>Top-p</dt><dd>{field(graph,id,'topP')??'Provider default'}</dd>
        {/if}
        <dt>Max output tokens</dt><dd>{outputTokens(graph)}</dd>
      </dl>
      <Button label="Show node on canvas" variant="secondary" onclick={()=>reveal(id)}/>
    {:else if id===instructionId}
      <h2 class="configure-heading">Instruction source</h2>
      <p class="configure-instructions">{field(graph,id,'text')??''}</p>
      <Button label="Show System prompt on canvas" variant="secondary" onclick={()=>reveal(id)}/>
    {:else if resource}
      {@const reference=field(graph,id,'reference')}
      {@const options=resourceChoices[resource.id]}
      <h2 class="configure-heading">{scope}</h2>
      <dl class="delegation-facts">
        <dt>Reference</dt><dd data-node-value="reference">{id==='child'&&selectedChild?selectedChild.name+' · r'+selectedChild.number:options.find(option=>option.value===reference)?.label??'Not selected'}</dd>
        {#if id==='memory'}<dt>Saved Memory</dt><dd data-node-value="saved-memory">{field(graph,id,'savedMemory')==='governed@1'?'Governed':'Off'}</dd>{/if}
        <dt>Connection</dt><dd>{binding(graph,id)?'Connected':'Unconnected'}</dd>
      </dl>
      <Button label="Show node on canvas" variant="secondary" onclick={()=>reveal(id)}/>
      {#if id==='child'}{@render delegationDetails()}{/if}
    {/if}
  </div>
{:else if section==='delegation'}
  {@render delegationDetails()}
{/if}
{#snippet delegationDetails()}
  <div class="delegation-details">
    <StatusBadge value={(binding(graph,'child')?'Connected':'Unconnected')+(fixture||!selectedChild?' · deterministic fixture':' · saved revision')}/>
    <dl class="delegation-facts">
      {#if selectedChild}
        <dt>Selected revision</dt><dd>{selectedChild.name} r{selectedChild.number}</dd>
        <dt>Active pin</dt><dd>{activeChild?activeChild.name+' r'+activeChild.number:'Activate to pin this revision.'}</dd>
        <dt>Permitted scope</dt><dd>{selectedChild.context==='project-knowledge@1'?'Project Knowledge r1 on demand. ':selectedChild.context?'Pinned context on demand. ':''}{selectedChild.tool?'One governed read-only tool call. ':'No tool calls. '}Further delegation is disabled.</dd>
        <dt>Task</dt><dd>Review the supplied research task.</dd>
        <dt>Expected result</dt><dd>A text finding under the specialist’s pinned output-token limit.</dd>
      {:else}
        <dt>Child reference</dt><dd>{childName} · r{childRef.revision}</dd>
        <dt>Permitted scope</dt><dd>One read-only delegation. No child tool calls or further delegation.</dd>
        <dt>Task</dt><dd>{childTask} Input is one nonblank task of up to {taskLengthLimit} characters.</dd>
        <dt>Expected fixture result</dt><dd>{childResult}</dd>
      {/if}
    </dl>
    <section class="parent-question-policy" aria-label="Parent questions">
      <label for={prefix+'-parent-questions'}>Parent questions</label>
      <Select id={prefix+'-parent-questions'} name="parent-questions" value="unavailable" disabled
        options={[{value:'unavailable',label:'Unavailable'}]} onChange={()=>{}}/>
      <label for={prefix+'-parent-exchanges'}>Maximum exchanges</label>
      <Input id={prefix+'-parent-exchanges'} class="tori-field" type="number" min={0} max={2} value={1} disabled
        aria-describedby={prefix+'-parent-question-help'}/>
      <p id={prefix+'-parent-question-help'} class="activity-unavailable">This connection cannot continue a specialist after a parent answer. The proposed limit is 1 exchange, within 0–2. It is not active.</p>
    </section>
    <section class="delegation-technical" aria-label="Technical details">
      <h3>Technical details</h3>
      <dl class="delegation-facts">
        <dt>Required grant</dt><dd><code>{delegateGrant}</code></dd>
        {#if !selectedChild}
          <dt>Child ID</dt><dd><code>{childRef.id}</code></dd>
        {/if}
      </dl>
    </section>
    {#if selectedChild}
      <div class="delegation-actions">
        <Button label={'Open '+selectedChild.name+' definition'} variant="secondary" disabled={!canOpenDefinition}
          onclick={()=>openDefinition(selectedChild.definition)}/>
      </div>
    {/if}
  </div>
{/snippet}
