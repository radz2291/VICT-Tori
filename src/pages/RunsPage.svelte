<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button, Feedback, StatusBadge } from '@victframework/ui-svelte';
  import { Button as ControlButton } from '@victframework/ui-svelte/primitives';
  import { Conversation, type ConversationMessage } from '@victframework/ui-ai-svelte';
  import RunActivity from '../RunActivity.svelte';

  type RunEvent = {at: string; kind?: string; label: string};
  type RunRecord = {
    id: string;
    name: string;
    number?: number;
    revision: string;
    message?: string;
    state?: string;
    status?: string;
    started: string;
    parentRun?: string;
    streamId?: string;
    awaitingObservation?: boolean;
    background?: boolean;
    events: readonly RunEvent[];
    report?: unknown;
  };
  type SessionLink = {id: string};

  let {
    run, runOwner, runSession, runs, session, runScope, workspace,
    selectedPrompt, selectedReply, activityDetail, runActionError, observation, runDuration,
    runTokenUsage, stoppingRun, openRun, openSession, stopWatchedRun, openViewIcon, elapsed,
    historyDate, recordIdentity, recordMode, runStatus,
    runTitle = $bindable(), runPane = $bindable(),
  }: {
    run?: RunRecord;
    runOwner?: RunRecord;
    runSession?: SessionLink;
    runs: readonly RunRecord[];
    session?: SessionLink;
    runScope: 'session'|'all';
    workspace: string;
    selectedPrompt?: ConversationMessage;
    selectedReply?: ConversationMessage;
    activityDetail: string;
    runActionError: string;
    observation?: {run: string; disconnected: boolean; gap: boolean; canStop: boolean};
    runDuration?: string;
    runTokenUsage: string;
    stoppingRun: string;
    openRun: (id: string, focus?: boolean) => Promise<void>;
    openSession: (id: string, focus?: boolean, messageId?: string) => Promise<void>;
    stopWatchedRun: (run: RunRecord) => Promise<void>;
    openViewIcon: Snippet;
    elapsed: (start: string, end?: string, format?: Intl.NumberFormat) => string|undefined;
    historyDate: (timestamp: string) => string;
    recordIdentity: (record: RunRecord) => string;
    recordMode: (record: RunRecord) => string;
    runStatus: (status?: string) => string;
    runTitle?: HTMLHeadingElement;
    runPane?: HTMLElement;
  } = $props();

  const timelineSecondsFormat=new Intl.NumberFormat(undefined,{minimumFractionDigits:3,maximumFractionDigits:3});
  const timelineClockFormat=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3});
  const eventNames:Record<string,string>={
    'response.started':'Model response started',
    'response.completed':'Model response completed',
    'response.failed':'Model response failed',
    'response.cancelled':'Model response cancelled',
    'usage.updated':'Token usage reported',
    'tool.requested':'Tool requested',
    'tool.started':'Tool started',
    'tool.completed':'Tool completed',
    'tool.failed':'Tool failed',
  };
  function eventLabel(event:{kind?:string;label:string}){
    return event.kind&&event.label==='VICT · '+event.kind?eventNames[event.kind]??event.label:event.label;
  }
</script>

{#snippet readOnlyTurn()}{/snippet}

<main class="runs-view" aria-label="Run outcome and timeline" bind:this={runPane}>
  {#if run}
    {@const parent=run.parentRun?runs.find(item=>item.id===run.parentRun):undefined}
    {@const children=runs.filter(child=>child.parentRun===run.id)}
    {@const revision=run.number??run.revision}
    <div class="runs-content">
      <section class="run-summary" aria-labelledby="run-outcome-heading">
        <header class="run-section-heading">
          <span class="run-section-label" id="run-outcome-heading">Outcome</span>
        </header>
        <div class="run-section-card">
          {#if run.message}<Feedback kind={run.state==='Uncertain'||run.status==='failed'?'error':'status'} message={run.message}/>{/if}
          {#if runActionError}<Feedback kind="error" message={runActionError}/>{/if}
          {#if observation?.run===runOwner?.id}
            {#if observation.disconnected}
              <Feedback message="Connection lost. Showing the last confirmed Run state."/>
            {:else if observation.gap}
              <Feedback message="Some stream events could not be replayed. The saved Run result is shown below."/>
            {/if}
          {/if}
          <dl class="run-summary-meta">
            <div>
              <dt>Agent</dt>
              <dd><h1 bind:this={runTitle} tabindex="-1">{run.name}</h1></dd>
            </div>
            <div><dt>Version</dt><dd>{revision==null?'Not recorded':'r'+revision}</dd></div>
            <div>
              <dt>Status</dt>
              <dd>
                {#if run.awaitingObservation}<Feedback message="Checking the accepted Run…"/>
                {:else}<StatusBadge value={runStatus(run.status)} tone={run.state==='Uncertain'||run.status==='failed'?'danger':'neutral'}/>{/if}
              </dd>
            </div>
            <div><dt>Execution</dt><dd>{recordMode(run)}{run.background?' · Background':''}</dd></div>
          </dl>
          <dl class="run-summary-meta run-summary-timing">
            <div><dt>Started</dt><dd><time datetime={run.started}>{historyDate(run.started)}</time></dd></div>
            {#if runDuration}<div><dt>Duration</dt><dd>{runDuration}</dd></div>{/if}
            {#if runTokenUsage}<div><dt>Token usage</dt><dd>{runTokenUsage}</dd></div>{/if}
          </dl>
          {#if !selectedPrompt || parent || children.length || (run.state==='Running'&&runOwner?.streamId)}
            <div class="run-links">
              {#if run.state==='Running'&&runOwner&&observation?.run===runOwner.id&&observation.canStop}
                <Button label={run.parentRun?'Stop parent Run':'Stop Run'} variant="secondary"
                  disabled={stoppingRun===runOwner.id} onclick={()=>stopWatchedRun(runOwner)}/>
              {/if}
              {#if !selectedPrompt}
                {#if runSession}
                  <ControlButton.Root class="vict-btn vict-btn--quiet" onclick={()=>openSession(runSession.id,true)}>Open Session</ControlButton.Root>
                {:else}<span class="muted">Session unavailable</span>{/if}
              {/if}
              {#if parent}
                <ControlButton.Root class="vict-btn vict-btn--quiet" onclick={()=>openRun(parent.id,true)}>
                  Open parent Run · {recordIdentity(parent)}
                </ControlButton.Root>
              {/if}
              {#each children as child (child.id)}
                <ControlButton.Root class="vict-btn vict-btn--quiet" onclick={()=>openRun(child.id,true)}>
                  Open child Run · {recordIdentity(child)}
                </ControlButton.Root>
              {/each}
            </div>
          {/if}
        </div>
      </section>
      {#if selectedPrompt}
        {#key run.id}
          <section class="run-turn" aria-labelledby="run-turn-heading">
            <header class="run-section-heading">
              <h2 id="run-turn-heading">Turn</h2>
              {#if runSession&&!run.parentRun}
                <ControlButton.Root class="vict-btn vict-btn--quiet run-open-turn" aria-label="Open turn" title="Open turn in Sessions"
                  onclick={()=>openSession(runSession.id,true,selectedPrompt.id)}>
                  {@render openViewIcon()}
                </ControlButton.Root>
              {/if}
            </header>
            <div class="run-section-card">
              <Conversation messages={selectedReply?[selectedPrompt,selectedReply]:[selectedPrompt]} composer={readOnlyTurn} inputLabel="Run turn"/>
            </div>
          </section>
        {/key}
      {/if}
      <section class="run-timeline" aria-label="Timeline">
        <RunActivity {run} {workspace} detail={activityDetail} outcomeMessage={run.message}/>
        {#if !run.report&&activityDetail==='full'}
        <div class="run-section-heading"><h2>Historical timeline</h2></div>
        <ol class="timeline">{#each run.events as event, index}
          {@const offset=elapsed(run.started,event.at,timelineSecondsFormat)}
          {@const timestamp=new Date(event.at)}
          <li>
            <span class="timeline-event">
              <span class="timeline-number" aria-hidden="true">{index+1}</span>
              <span class="timeline-label">{eventLabel(event)}</span>
            </span>
            <span class="timeline-offset">{offset?'+'+offset:'—'}</span>
            {#if Number.isFinite(timestamp.getTime())}
              <time class="timeline-clock" datetime={event.at} title={historyDate(event.at)}>{timelineClockFormat.format(timestamp)}</time>
            {:else}<span class="timeline-clock">Time unavailable</span>{/if}
          </li>
        {/each}</ol>
        {/if}
      </section>
    </div>
  {:else}
    <div class="empty">
      {#if runActionError}<Feedback kind="error" message={runActionError}/>
      {:else}<h1>No Runs yet</h1><p>{runScope==='session'&&session?'This Session has no recorded Runs yet.':'Recorded turns will appear here.'}</p>{/if}
    </div>
  {/if}
</main>
