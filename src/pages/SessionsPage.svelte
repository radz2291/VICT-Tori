<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Conversation, type ConversationMessage } from '@victframework/ui-ai-svelte';
  import { Button } from '@victframework/ui-svelte';
  import MemoryControls from '../MemoryControls.svelte';
  import { presentConversation, type Density, type RunView } from '../run-presentation';
  import type { MemoryTurn } from '../memory-display';

  type SelectedSession = {
    id: string;
    title: string;
    authoring?: boolean;
    messages: readonly ConversationMessage[];
  };

  let {
    session, sessionBusy, workspace, activityDetail, memoryView, sending, sessionRuns, sessionComposer,
    changeMemory, inspectRun, rememberReadingPosition,
    conversationPane = $bindable(),
  }: {
    session?: SelectedSession;
    sessionBusy: boolean;
    workspace: string;
    activityDetail: string;
    memoryView?: {turns?: readonly MemoryTurn[]};
    sending: boolean;
    sessionRuns: readonly RunView[];
    sessionComposer: Snippet;
    changeMemory: (path: string, payload: unknown, id: string) => Promise<unknown>;
    inspectRun: (id: string, sourceId?:string) => Promise<void>;
    rememberReadingPosition: (node: HTMLElement, id: string) => {destroy(): void};
    conversationPane?: HTMLDivElement;
  } = $props();
  const display=$derived(presentConversation(session?.messages??[],sessionRuns,activityDetail as Density));
  const attachmentMessages=$derived.by(()=>{
    const ids=new Set(display.messages.map(message=>message.id));
    return new Map((memoryView?.turns??[]).filter(turn=>ids.has(turn.source)).map(turn=>{
      const reply=turn.run+'-agent';
      const answer=session?.messages.find(message=>message.id===reply);
      return [answer?reply:turn.source,turn] as const;
    }));
  });
</script>

<main class="session-view" aria-label="Conversation">
  {#if session}
    {#key session.id}
      <div class="conversation" bind:this={conversationPane} use:rememberReadingPosition={session.id}>
        {#if session.authoring}
          <Conversation messages={session.messages} busy={sessionBusy}
            composer={sessionComposer} emptyMessage="Start a conversation."/>
        {:else}
          <Conversation messages={display.messages} busy={sessionBusy} composer={sessionComposer}
            activityDensity={activityDetail==='summary'?'summary':'full'} emptyMessage="Start a conversation.">
            {#snippet turnAttachment(message)}
              {@const turn=attachmentMessages.get(message.id)}
              {@const binding=display.scopes.get(message.id)}
              {#if turn}<MemoryControls view={memoryView} mode="card" sessionId={session.id} {turn} act={changeMemory} busyTurn={sending||sessionBusy}/>{/if}
              {#if binding&&(activityDetail!=='quiet'||binding.warnings.length)}
                <div class="run-turn-actions">
                  <Button label="Inspect Run" variant="secondary" onclick={()=>inspectRun(binding.run.id,binding.run.id)}/>
                  {#each binding.run.report?.specialist?.children??[] as child (child.id)}
                    <Button label={'Open '+child.name+' Run'} variant="secondary" onclick={()=>inspectRun(child.id,binding.run.id)}/>
                  {/each}
                </div>
              {/if}
            {/snippet}
            {#snippet activityAction(message,activity)}
              {@const binding=display.scopes.get(message.id)}
              {@const action=binding?.destinations.get(activity.id)}
              {#if action}<Button label={'Open '+action.name+' Run'} variant="secondary" onclick={()=>inspectRun(action.id,binding?.run.id)}/>{/if}
            {/snippet}
          </Conversation>
        {/if}
      </div>
    {/key}
  {:else}
    <div class="empty"><h1>No conversation yet</h1><p>Use New Session in the right sidebar to choose an active agent.</p></div>
  {/if}
</main>
