<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Conversation, type ConversationMessage } from '@victframework/ui-ai-svelte';
  import ExecutionPage from './ExecutionPage.svelte';
  import MemoryControls from '../MemoryControls.svelte';
  import RunActivity from '../RunActivity.svelte';
  import SessionConversation from '../SessionConversation.svelte';
  import type { MemoryTurn } from '../memory-display';

  type SelectedSession = {
    id: string;
    title: string;
    name: string;
    number: number;
    fixture?: string;
    authoring?: boolean;
    messages: readonly ConversationMessage[];
  };

  let {
    mobile, inspectorVisible, inspectorToggle, sidebarActions, sidebarBody,
    session, sessionBusy, workspace, activityDetail, memoryView, sending, sessionRuns, sessionComposer,
    changeMemory, inspectRun, recordIdentity, recordMode, rememberReadingPosition,
    sessionTitle = $bindable(), conversationPane = $bindable(),
  }: {
    mobile: boolean;
    inspectorVisible: boolean;
    inspectorToggle: Snippet;
    sidebarActions: Snippet;
    sidebarBody: Snippet;
    session?: SelectedSession;
    sessionBusy: boolean;
    workspace: string;
    activityDetail: string;
    memoryView?: {turns?: readonly MemoryTurn[]};
    sending: boolean;
    sessionRuns: readonly {id: string; parentRun?: string}[];
    sessionComposer: Snippet;
    changeMemory: (path: string, payload: unknown, id: string) => Promise<unknown>;
    inspectRun: (id: string) => Promise<void>;
    recordIdentity: (session: SelectedSession) => string;
    recordMode: (session: SelectedSession) => string;
    rememberReadingPosition: (node: HTMLElement, id: string) => {destroy(): void};
    sessionTitle?: HTMLHeadingElement;
    conversationPane?: HTMLDivElement;
  } = $props();
</script>

<ExecutionPage page="Sessions" {mobile} {inspectorVisible} {inspectorToggle} {sidebarActions} {sidebarBody}>
  {#snippet toolbar()}
    <div class="execution-identity">
      <h1 bind:this={sessionTitle} tabindex="-1"
        aria-describedby={session?'selected-session-identity':undefined}>Sessions</h1>
      {#if session}
        <span id="selected-session-identity" class="visually-hidden">{session.title} · {recordIdentity(session)}{session.fixture?' · '+recordMode(session):''}</span>
      {/if}
    </div>
  {/snippet}
  <main class="session-view" aria-label="Conversation">
    {#if session}
      {#key session.id}
        <div class="conversation" bind:this={conversationPane} use:rememberReadingPosition={session.id}>
          {#if session.authoring}
            <Conversation messages={session.messages} busy={sessionBusy}
              composer={sessionComposer} emptyMessage="Start a conversation."/>
          {:else}
            <SessionConversation messages={session.messages} busy={sessionBusy}
              turns={memoryView?.turns??[]} composer={sessionComposer}>
              {#snippet attachment(turn)}
                <MemoryControls view={memoryView} mode="card" sessionId={session.id} {turn} act={changeMemory} busyTurn={sending||sessionBusy}/>
              {/snippet}
              {#snippet activity(messageId)}
                {@const activityRun=sessionRuns.find(item=>!item.parentRun&&(messageId===item.id+'-agent'||
                  (messageId===item.id+'-user'&&!session.messages.some(message=>message.id===item.id+'-agent'))))}
                {#if activityRun}<RunActivity run={activityRun} {workspace} detail={activityDetail} compact
                  inspect={inspectRun}/>{/if}
              {/snippet}
            </SessionConversation>
          {/if}
        </div>
      {/key}
    {:else}
      <div class="empty"><h1>No conversation yet</h1><p>Use New Session in the right sidebar to choose an active agent.</p></div>
    {/if}
  </main>
</ExecutionPage>
