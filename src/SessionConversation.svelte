<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte';
  import { MessageScroller, Patterns, type ConversationMessage } from '@victframework/ui-ai-svelte';
  import { Feedback } from '@victframework/ui-svelte';
  import type { MemoryTurn } from './memory-display';

  let {messages,busy,turns,composer,attachment,activity}: {
    messages: readonly ConversationMessage[]; busy: boolean; turns: readonly MemoryTurn[];
    composer: Snippet; attachment: Snippet<[MemoryTurn]>; activity?: Snippet<[string]>;
  }=$props();
  const placements=$derived.by(()=>{
    const ids=new Set(messages.map(message=>message.id));
    return new Map(turns.filter(turn=>ids.has(turn.source)).map(turn=>{
      const reply=turn.run+'-agent';
      return [ids.has(reply)?reply:turn.source,turn] as const;
    }));
  });
  let copyStatus=$state('');
  let copiedMessage=$state('');
  let copyError=$state(false);
  let timer:ReturnType<typeof setTimeout>|undefined;
  onDestroy(()=>clearTimeout(timer));
  async function copy(message:ConversationMessage){
    clearTimeout(timer);
    copyStatus='';copiedMessage='';copyError=false;
    try{
      await navigator.clipboard.writeText(message.text);
      copyStatus='Message copied.';copiedMessage=message.id;
      timer=setTimeout(()=>{copiedMessage='';copyStatus='';},2000);
    }catch{copyError=true;copyStatus='Copy unavailable. Select the message text to copy it.';}
  }
</script>

<!-- The public Conversation has a composer slot but no turn slot. Compose its
     public scroller and message pattern so attachments stay outside messages. -->
<section class="vict-ai vict-ai-conversation session-transcript" aria-label="Session transcript">
  <MessageScroller.Provider>
    <MessageScroller.Root class="session-feed-root">
      <MessageScroller.Viewport class="vict-conversation session-feed" data-testid="conversation-feed" role="region" aria-label="Messages — Message" tabindex={0}>
        <MessageScroller.Content class="vict-ai-messages session-feed-messages" aria-busy={busy}>
          {#if !messages.length}<Feedback kind="empty" message="Start a conversation."/>{/if}
          {#each messages as message (message.id)}
            {@const turn=placements.get(message.id)}
            <MessageScroller.Item messageId={message.id} scrollAnchor={message.role==='user'}>
              <div class="session-message" class:vict-ai-markdown={message.role==='assistant'} data-testid="conversation-message" data-participant={message.role}>
                <span class="visually-hidden">{message.author??(message.role==='user'?'You':'Assistant')}</span>
                <Patterns.Message role={message.role} text={message.text}
                  onCopy={message.text&&!(busy&&message===messages.at(-1))?()=>void copy(message):undefined}
                  copied={copiedMessage===message.id}/>
              </div>
              {#if turn}{@render attachment(turn)}{/if}
              {#if activity}{@render activity(message.id)}{/if}
            </MessageScroller.Item>
          {/each}
        </MessageScroller.Content>
      </MessageScroller.Viewport>
      <MessageScroller.Button aria-label="Scroll to latest message"/>
    </MessageScroller.Root>
  </MessageScroller.Provider>
  {@render composer()}
  {#if copyStatus}
    <div class:visually-hidden={!copyError}><Feedback kind={copyError?'error':'status'} message={copyStatus}/></div>
  {/if}
</section>
