<script lang="ts">
  import { Button, Feedback, Select, StatusBadge } from '@victframework/ui-svelte';
  import { Label, Switch } from '@victframework/ui-svelte/primitives';
  import { Input, Textarea } from '@victframework/ui-ai-svelte';
  import { binding, directiveIssues, directiveValues } from './assembly';
  import { directiveBounds, directiveSensitivity } from '../packages/directive/policy.mjs';
  let {graph,prefix,edit,configure,disconnect,active}=$props();
  const value=$derived(directiveValues(graph));
  const issues=$derived(directiveIssues(graph));
  const connected=$derived(!!binding(graph,'directive'));
  const numbers=[
    { key:'historyBytes', label:'Transcript budget (UTF-8 bytes)', scale:1 },
    { key:'deadlineMs', label:'Interpretation deadline (seconds)', scale:1000 },
    { key:'outputTokens', label:'Interpretation output tokens', scale:1 },
  ] as const;
</script>

<StatusBadge value={connected?'Connected':'Unconnected'}/>
<div class="configure-group">
  <Label.Root for={prefix+'-name'}>Display name</Label.Root>
  <Input class="tori-field" id={prefix+'-name'} value={String(value.name??'')}
    oninput={event=>edit('directive','name',event.currentTarget.value)}/>
  {#if issues.name}<Feedback kind="error" message={issues.name}/>{/if}
  <Label.Root for={prefix+'-recognition'}>Recognition context</Label.Root>
  <Textarea class="tori-field" id={prefix+'-recognition'} rows={3} value={String(value.recognition??'')}
    oninput={event=>edit('directive','recognition',event.currentTarget.value)}/>
  {#if issues.recognition}<Feedback kind="error" message={issues.recognition}/>{/if}
  {#each numbers as {key,label,scale} (key)}
    {@const bounds=directiveBounds[key]}
    <Label.Root for={prefix+'-'+key}>{label}</Label.Root>
    <Input class="tori-field" id={prefix+'-'+key} type="number" min={bounds.min/scale} max={bounds.max/scale} step={1/scale}
      value={typeof value[key]==='number'?Number(value[key])/scale:undefined}
      oninput={event=>{
        const input=event.currentTarget.value;
        const scaled=Number(input)*scale;
        const nearest=Math.round(scaled);
        edit('directive',key,Math.abs(scaled-nearest)<=Number.EPSILON*Math.max(1,Math.abs(scaled))?nearest:scaled);
      }}/>
    {#if issues[key]}<Feedback kind="error" message={issues[key]}/>{/if}
  {/each}
  <div class="vict-control-row">
    <Switch.Root id={prefix+'-tuning'} checked={value.tuning==='on'}
      onCheckedChange={checked=>edit('directive','tuning',checked?'on':'off')}>
      <Switch.Thumb/>
    </Switch.Root>
    <Label.Root for={prefix+'-tuning'}>Advanced sensitivity tuning</Label.Root>
  </div>
  {#if issues.tuning}<Feedback kind="error" message={issues.tuning}/>{/if}
  {#if value.tuning==='on'}
    <Label.Root for={prefix+'-sensitivity'}>Suggestion sensitivity</Label.Root>
    <Select id={prefix+'-sensitivity'} name="directive-sensitivity" options={directiveSensitivity}
      value={String(value.sensitivity)} onChange={selection=>edit('directive','sensitivity',selection)}/>
    {#if issues.sensitivity}<Feedback kind="error" message={issues.sensitivity}/>{/if}
  {/if}
</div>
<dl class="delegation-facts">
  <dt>Keep</dt><dd>Save preference or fact</dd>
  <dt>Origin</dt><dd>Current operator message</dd>
  <dt>Interpretation</dt><dd>Separate pass for the originating turn</dd>
  <dt>Review</dt><dd>Float</dd>
  <dt>Applies through</dt><dd>Turn-start memory admission</dd>
  <dt>Scope</dt><dd>Authorized actor, project and Agent Definition</dd>
  <dt>Binding limit</dt><dd>One per agent</dd>
  {#if active?.status==='bound'}
    <dt>Pinned policy revision</dt><dd class="hash">{active.revision}</dd>
    <dt>Effective limits</dt><dd>{active.policy.historyBytes.toLocaleString()} bytes · {active.policy.deadlineMs/1000} s · {active.policy.outputTokens.toLocaleString()} output tokens</dd>
    <dt>Interpreter</dt><dd>Z.AI Coding · {active.policy.model}</dd>
  {/if}
</dl>
<div class="configure-remove">
  {#if connected}
    <Button label="Disconnect Directive" variant="secondary" onclick={()=>disconnect('directive')}/>
  {:else}
    <Button label="Connect Directive" variant="secondary" onclick={()=>configure('directive','','')}/>
  {/if}
</div>
