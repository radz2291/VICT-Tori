<script lang="ts">
  import { onMount, tick, untrack, type Snippet } from 'svelte';
  import { patchInput, workspaceOccurrence } from '../packages/authoring/index.mjs';
  import { commitDraftEdit, type DraftEditProposal, type DraftEditReceipt } from '@victframework/control/draft-authoring';
  import { Button, ControlScope, Feedback, Select, StatusBadge } from '@victframework/ui-svelte';
  import { Button as ControlButton, Dialog, Menubar, Tooltip } from '@victframework/ui-svelte/primitives';
  import { DropdownMenu } from '@victframework/ui-svelte/catalog/dropdown-menu';
  import { Accordion } from '@victframework/ui-svelte/catalog/accordion';
  import { Tabs } from '@victframework/ui-svelte/catalog/tabs';
  import { Toggle } from '@victframework/ui-svelte/catalog/toggle';
  import { Badge, Conversation, Input, Patterns, type ConversationMessage } from '@victframework/ui-ai-svelte';
  import { SvelteFlow, SvelteFlowProvider, Background, connectionIssueForTopology, type Connection, type Edge, type IsValidConnection } from '@victframework/ui-flow-svelte';
  import AssemblyNode, { promptWidths, promptHeights } from './AssemblyNode.svelte';
  import AssemblyWire, { type AssemblyWireEdge } from './AssemblyWire.svelte';
  import AssemblyGlyph from './AssemblyGlyph.svelte';
  import FlowAccess from './FlowAccess.svelte';
  import Fields from './Fields.svelte';
  import RunDetails from './RunDetails.svelte';
  import MemoryControls from './MemoryControls.svelte';
  import SessionConversation from './SessionConversation.svelte';
  import { acceptRunPacket } from './run-observer.mjs';
  import {add,binding,canWire,change,emptyAssembly,field,history,instructions,modelName,readiness,resolved,wire,outputTokens,tokenSourceId,agentResources,resourceChoices,optionalBindings,isOptionalBinding,nodeVisibilityLabel,assemblyPatchOperations,configureOperations} from './assembly';

  type DockPanel='Authoring Agent'|'Assembly / Selection'|'Inspector';
  const initial=emptyAssembly();
  let graph=$state.raw(initial);
  let journal=history(initial);
  const authoringBytes=({revision,...content}:typeof initial)=>JSON.stringify(content);
  let baseline=$state(authoringBytes(initial));
  let canUndo=$state(false),canRedo=$state(false);
  function historyState(){canUndo=journal.canUndo;canRedo=journal.canRedo;}
  let state=$state.raw<any>({revision:null,activation:null,sessions:[],runs:[],provider:false});
  let ready=$derived(readiness(graph,state.route));
  let dirty=$derived(baseline!==authoringBytes(graph));
  let selection=$state('');
  let agentSearch=$state('');
  let componentQuery=$state('');
  let page=$state('Agents');
  let view=$state({x:0,y:0,zoom:1});
  let canvasInitialized=false;
  let flow=$state<any>();
  let authoringDock=$state(false), assemblyDock=$state(true);
  let assemblyContext=$state('assembly');
  let assemblySections=$state<string[]>(['agents']);
  let assemblyScroll=0;
  let selectionScroll=0;
  let wireSource=$state('');
  let selectedWire=$state('');
  const inspectedWire=$derived(graph.edges.find(edge=>edge.id===selectedWire));
  const delegationSelected=$derived(inspectedWire?.source==='child'&&inspectedWire.targetPort==='child');
  let wireDrag:{id:string;graph:typeof initial;event:MouseEvent|TouchEvent;cancelled:boolean}|undefined;
  let cancelFlowClick: (()=>void)|undefined;
  let delegationInvoker:HTMLElement|string|null=null;
  let mobile=$state(false), sheet=$state<DockPanel|''>(''), mobileOpen=$state(false);
  let sheetInvoker:HTMLElement|SVGElement|null=null;
  let loaded=$state(false), pending=$state(false), sending=$state(false);
  let authoringActivation=$state('');
  let authoringActivationUnavailable=$state(false);
  const authoringActivationKey=(workspace:string)=>'tori-authoring-activation:'+workspace;
  let authoringInput=$state('');
  let authoringMode=$state<'inspect'|'change'>('inspect');
  let authoringOptionsOpen=$state(false);
  const authoringModeKey=(workspace:string)=>'tori-authoring-permission:'+workspace;
  const authoringModes=[
    {value:'inspect',label:'Review only'},
    {value:'change',label:'Allow edits and tests'},
  ];
  let authoringError=$state('');
  let authoringResult=$state<{session:string;run?:string;message:string;kind?:'status'|'error'|'denied'}|null>(null);
  let authoringStatus=$state('');
  type DraftTurn = {
    channel:string; definition:string; savedRevision:string|null; draftId:string; workspace:boolean;
    stop:AbortController; receipts:Map<string,JournalRecovery>; turnId?:string; session?:string;
  };
  let draftInstance=crypto.randomUUID();
  let draftTurn=$state.raw<DraftTurn|null>(null);
  const recoveryPrefix=(workspace:string)=>'tori-v1b-journal:'+workspace+':';
  type JournalRecovery = {channel:string; receipt:DraftEditReceipt; graph?:typeof initial};
  type JournalAction = {operations:Parameters<typeof journal.apply>[0]} | {travel:'undo'|'redo'};
  let journalBefore=initial;
  let journalActions:JournalAction[]=[];
  type WorkingDraft = {
    savedRevision:string|null; before?:typeof initial; actions:JournalAction[];
    receipts:Record<string,JournalRecovery>;
  };
  const editableOccurrence=()=>!graph.nodes.some(node=>node.id==='agent')?undefined:
    binding(graph,'instructions')?'instructions.text':'agent.instructions';
  let sendActivity=$state<{session:string;phase:string;turn?:string;canStop?:boolean}|null>(null);
  let memoryResult=$state.raw<{session:string;view:any}>();
  let memoryView=$derived(memoryResult?.session===session?.id?memoryResult?.view:undefined);
  let memoryRead=0;
  let stoppingSession=$state(false);
  let backgroundChoice=$state<Record<string,boolean>>({});
  let observation=$state.raw<{run:string;gap:boolean;canStop:boolean;writing:boolean;disconnected:boolean}>();
  let stoppingRun=$state('');
  let runActionError=$state('');
  const cursorKey=(workspace:string,run:string)=>'tori-run-cursor:'+workspace+':'+run;
  const pendingRunKey=(workspace:string)=>'tori-pending-run:'+workspace;
  const resumeRunKey=(workspace:string)=>'tori-background-run:'+workspace;
  type StartRequest={request:string;session:string;activation:string};
  let pendingStart=$state.raw<StartRequest>();
  let pendingInput:{request:string;text:string}|undefined;
  let startNotFound=$state(false);
  let error=$state(''), graphError=$state('');
  let activeSession=$state(''), activeRun=$state('');
  let sessionDrafts=$state<Record<string,string>>({});
  let sessionContext=$state<Record<string,boolean>>({});
  let turnErrors=$state<Record<string,string>>({});
  let deleteTarget=$state<{id:string;title:string}|null>(null),deleteError=$state('');
  let renameTarget=$state(''),renameTitle=$state(''),renameError=$state('');
  let historyOptionsButton:HTMLButtonElement|null=$state(null);
  let sessionActionInvoker:HTMLElement|null=null;
  let sessionActionGroup:HTMLElement|null=null;
  let launchOpen=$state(false),launchError=$state(''),launchQuery=$state('');
  let sessionLauncherButton:HTMLButtonElement|null=$state(null);
  type AgentActivation={definition:string;version:string;number:number;name:string;route?:string;authoring?:boolean;workspaceAuthoring?:boolean;
    execution?:{maxSteps:number;maxToolCalls:number;maxRetries:number}};
  type ActiveAgent=AgentActivation&{revisions:AgentActivation[]};
  type AgentDefinitionSummary={id:string;name:string;savedRevision?:number};
  let activeAgents:ActiveAgent[]=$derived(state.activeAgents??[]);
  const agentDefinitions:AgentDefinitionSummary[]=$derived(state.definitions??[]);
  const authoringActivations=$derived(activeAgents.flatMap(agent=>agent.revisions)
    .filter(revision=>revision.authoring&&(revision.workspaceAuthoring||revision.definition!==state.definition)&&revision.route===state.route));
  const selectedAuthoringActivation=$derived(authoringActivations.find(revision=>revision.version===authoringActivation));
  const workspaceAuthoring=$derived(!!selectedAuthoringActivation?.workspaceAuthoring);
  const dockChat=$derived(workspaceAuthoring?state.authoringChats?.find(chat=>chat.activation===authoringActivation):undefined);
  const dockSession=$derived(state.sessions.find(session=>session.id===dockChat?.session));
  const dockMessages=$derived((dockChat?.sessionIds??[]).flatMap(id=>state.sessions.find(session=>session.id===id)?.messages??[]));
  const dockRun=$derived(dockSession&&state.runs.find(run=>run.session===dockSession.id&&!run.parentRun));
  const dockBusy=$derived(dockRun?.status==='running');
  const dockTestRun=$derived(dockChat?.testRun&&state.runs.find(run=>run.id===dockChat.testRun));
  const dockRunLink=$derived(authoringResult?.run?state.runs.find(run=>run.id===authoringResult.run):dockRun);
  const dockInterruption=$derived(dockSession?.interrupted&&!sending&&!dockBusy
    ? (dockRun?.message??'The last turn was interrupted.')+' Your chat is saved. Send a new message to continue.'
    : '');
  const authoringChoices=$derived(authoringActivations.map(revision=>({value:revision.version,label:revision.name+' · r'+revision.number})));
  const activeDefinitionIds=$derived(new Set(activeAgents.map(agent=>agent.definition)));
  const agentsNeedingActivation=$derived(agentDefinitions.filter(agent=>agent.savedRevision!==undefined&&!activeDefinitionIds.has(agent.id)));
  const matchingActiveAgents=$derived(activeAgents.filter(agent=>matchesSearch(agent.name,agent.revisions.map(revision=>'r'+revision.number).join(' '),launchQuery)));
  const matchingInactiveAgents=$derived(agentsNeedingActivation.filter(agent=>matchesSearch(agent.name,'r'+agent.savedRevision,launchQuery)));
  let sessionSidebar=$state(true),showSessionDescriptions=$state(true);
  let runSidebar=$state(true),showRunDescriptions=$state(true);
  let sessionQuery=$state(''),runQuery=$state('');
  let sessionSearchOpen=$state(false),launchSearchOpen=$state(false);
  let sessionFilter=$state('all'),sessionGrouping=$state('agent');
  let sessionGroupChoice=$state<string>();
  const sessionGroupings=[{value:'agent',label:'Agent'},{value:'date',label:'Activity date'}];
  const sessionFilters=[{value:'all',label:'All Sessions'},{value:'live',label:'Live'},{value:'fixture',label:'Fixture'}];
  let runScopePreference=$state<'session'|'all'>('all');
  let inspectSessionScope=$state(false);
  let runScope=$derived(inspectSessionScope?'session':runScopePreference);
  let runReturnSession=$state('');
  let runSearchOpen=$state(false),runGrouping=$state('session');
  let runGroupChoice=$state<string>();
  let runPane:HTMLElement|undefined=$state();
  let conversationPane:HTMLDivElement|undefined=$state();
  let runTitle:HTMLHeadingElement|undefined=$state();
  let sessionTitle:HTMLHeadingElement|undefined=$state();
  const readingPositions=new Map<string,number>();
  let executionPage=$derived(page==='Sessions'||page==='Runs');
  let authoringVisible=$derived(page==='Agents'&&authoringDock);
  let inspectorVisible=$derived(page==='Sessions'?sessionSidebar:page==='Runs'&&runSidebar);
  let inspectorLabel=$derived(executionPage?page+' sidebar':'Inspector');
  let session=$derived(state.sessions.find((s)=>s.id===activeSession));
  let run=$derived(state.runs.find((r)=>r.id===activeRun));
  let sessionRuns=$derived(state.runs.filter(r=>r.session===activeSession));
  let sessionRun=$derived(sessionRuns.find(item=>item.id===activeRun)??sessionRuns.find(item=>!item.parentRun)??sessionRuns[0]);
  const currentSessionRun=$derived(sessionRuns.find(item=>!item.parentRun));
  const runOwner=$derived(run?.parentRun?state.runs.find(item=>item.id===run.parentRun):run);
  const watchedRun=$derived(page==='Runs'?runOwner:page==='Sessions'?currentSessionRun:undefined);
  const liveSessionRun=$derived(currentSessionRun?.state==='Running'?currentSessionRun:undefined);
  const awaitingStart=$derived(!!session&&pendingStart?.session===session.id&&!startNotFound);
  const sessionBusy=$derived((!!session&&sendActivity?.session===session.id)||!!liveSessionRun||
    !!currentSessionRun?.awaitingObservation||awaitingStart);
  const interruptedRun=$derived(session?.interrupted?sessionRuns.find(item=>!item.parentRun&&['failed','cancelled','interrupted','uncertain'].includes(item.status)):undefined);
  let runReturnTarget=$derived(state.sessions.find(item=>item.id===runReturnSession));
  let runSession=$derived(state.sessions.find(item=>item.id===run?.session));
  const recordIdentity=(record:any)=>record.name+' · r'+(record.number??record.revision);
  const recordMode=(record:any)=>record.archivedFixture?'Fixture history':record.fixture?'Fixture':'Live';
  const runStatus=(status?:string)=>status==='running'?'Running':status==='completed'?'Finished':status==='uncertain'?'Uncertain':'Interrupted';
  const secondsFormat=new Intl.NumberFormat(undefined,{minimumFractionDigits:1,maximumFractionDigits:3});
  const timelineSecondsFormat=new Intl.NumberFormat(undefined,{minimumFractionDigits:3,maximumFractionDigits:3});
  const timelineClockFormat=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3});
  function elapsed(start:string,end?:string,format=secondsFormat){
    if(!end)return undefined;
    const milliseconds=Date.parse(end)-Date.parse(start);
    return Number.isFinite(milliseconds)&&milliseconds>=0?format.format(milliseconds/1000)+' s':undefined;
  }
  const tokenCount=(value:unknown)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value.toLocaleString():undefined;
  let runDuration=$derived(run?.status==='completed'?elapsed(run.started,run.ended):undefined);
  let runTokenUsage=$derived.by(()=>{
    if(run?.status!=='completed')return '';
    const input=tokenCount(run.usage?.inputTokens);
    const output=tokenCount(run.usage?.outputTokens);
    return [input!==undefined?input+' input':undefined,output!==undefined?output+' output':undefined].filter(Boolean).join(' / ');
  });
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
  const historyDate=(timestamp:string)=>new Date(timestamp).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'medium'});
  const matchesSearch=(name:string,subtitle:string,query:string)=>(name+' '+subtitle).toLowerCase().includes(query.trim().toLowerCase());
  const activityDate=(timestamp:string)=>new Date(timestamp).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
  const localCalendarDay=(date:Date)=>Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86_400_000;
  let today=$state(localCalendarDay(new Date()));
  function activityGroupLabel(date:Date,fullDate:string){
    const daysAgo=today-localCalendarDay(date);
    if(daysAgo===0)return 'Today';
    if(daysAgo===1)return 'Yesterday';
    if(daysAgo>=2&&daysAgo<7)return date.toLocaleDateString(undefined,{weekday:'long'});
    return fullDate;
  }
  type SessionHistoryItem={id:string;title:string;name:string;number:number;lastActivityAt:string;definition?:string;fixture?:string;archivedFixture?:boolean};
  let sessionHistory=$derived.by(()=>{
    const names=new Map<string,string>((state.definitions??[]).map(item=>[item.id,item.name]));
    const sessions:SessionHistoryItem[]=state.sessions
      .filter(item=>(sessionFilter==='all'||sessionFilter===(item.fixture?'fixture':'live'))&&
        matchesSearch(item.title,[recordIdentity(item),names.get(item.definition),activityDate(item.lastActivityAt),recordMode(item)].join(' '),sessionQuery))
      .sort((a,b)=>b.lastActivityAt.localeCompare(a.lastActivityAt));
    const groups=new Map<string,{key:string;label:string;fullDate?:string;sessions:SessionHistoryItem[]}>();
    for(const item of sessions){
      const date=sessionGrouping==='date'?new Date(item.lastActivityAt):undefined;
      const key=date?date.toDateString():item.definition?'agent:'+item.definition:'name:'+item.name;
      let group=groups.get(key);
      if(!group){
        const fullDate=date?.toLocaleDateString(undefined,{dateStyle:'long'});
        const label=date&&fullDate?activityGroupLabel(date,fullDate):names.get(item.definition??'')??item.name;
        group={key,label,fullDate,sessions:[]};
        groups.set(key,group);
      }
      group.sessions.push(item);
    }
    return [...groups.values()];
  });
  let openSessionHistoryGroup=$derived.by(()=>{
    if(sessionGroupChoice===''||sessionHistory.some(group=>group.key===sessionGroupChoice))return sessionGroupChoice??'';
    return sessionQuery.trim()?sessionHistory[0]?.key??'':'';
  });
  type RunHistoryItem={id:string;session:string;name:string;number?:number;revision:string;started:string;ended?:string;status:string;parentRun?:string;provider?:string;input?:string;output?:string;fixture?:string;archivedFixture?:boolean};
  type RunHistoryRow=RunHistoryItem&{sequence:number;messagePreview?:string};
  let messagesBySession=$derived.by(()=>new Map<string,Map<string,ConversationMessage>>(
    state.sessions.map(session=>[session.id,new Map((session.messages??[]).map(message=>[message.id,message]))])
  ));
  function runMessage(item:RunHistoryItem,role:'user'|'assistant'){
    if(item.parentRun){
      if(item.provider==='offline-fixture')return undefined;
      const text=role==='user'?item.input:item.output;
      return text?{id:item.id+'-'+role,role,text}:undefined;
    }
    const message=messagesBySession.get(item.session)?.get(item.id+(role==='user'?'-user':'-agent'));
    return message?.role===role?message:undefined;
  }
  let selectedPrompt=$derived(run?runMessage(run,'user'):undefined);
  let selectedReply=$derived(selectedPrompt&&run.status==='completed'?runMessage(run,'assistant'):undefined);
  const runActivity=(item:RunHistoryItem)=>item.ended??item.started;
  const runHistoryTime=(item:RunHistoryItem)=>new Date(runActivity(item)).toLocaleString(undefined,
    runGrouping==='date'?{timeStyle:'short'}:{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  let runSequences=$derived.by(()=>{
    const counts=new Map<string,number>();
    const sequences=new Map<string,number>();
    const runs:RunHistoryItem[]=[...state.runs].reverse();
    for(const item of runs.sort((a,b)=>a.started.localeCompare(b.started))){
      const sequence=(counts.get(item.session)??0)+1;
      counts.set(item.session,sequence);
      sequences.set(item.id,sequence);
    }
    return sequences;
  });
  let runHistory=$derived.by(()=>{
    const sessions=new Map<string,SessionHistoryItem>(state.sessions.map(item=>[item.id,item]));
    const runs:RunHistoryItem[]=state.runs.filter(item=>runScope==='all'||item.session===activeSession);
    const groups=new Map<string,{key:string;label:string;title:string;runs:RunHistoryRow[];sequenceDigits:number}>();
    for(const item of runs.sort((a,b)=>runGrouping==='date'?runActivity(b).localeCompare(runActivity(a)):b.started.localeCompare(a.started))){
      const sessionLabel=sessions.get(item.session)?.title??'Session unavailable';
      const message=runMessage(item,'user')?.text.trim().replace(/\s+/gu,' ');
      const characters=message?Array.from(message):[];
      const messagePreview=characters.length>100?characters.slice(0,99).join('')+'…':message||undefined;
      if(runQuery.trim()&&!matchesSearch(recordIdentity(item),[messagePreview,sessionLabel,historyDate(runActivity(item)),recordMode(item),item.status,item.id].join(' '),runQuery))continue;
      const date=runGrouping==='date'?new Date(runActivity(item)):undefined;
      const key=date?date.toDateString():item.session;
      let group=groups.get(key);
      if(!group){
        const fullDate=date?.toLocaleDateString(undefined,{dateStyle:'long'});
        const label=date&&fullDate?activityGroupLabel(date,fullDate):sessionLabel;
        group={key,label,title:fullDate??label,runs:[],sequenceDigits:2};
        groups.set(key,group);
      }
      const sequence=runSequences.get(item.id)!;
      group.sequenceDigits=Math.max(group.sequenceDigits,String(sequence).length);
      group.runs.push({...item,messagePreview,sequence});
    }
    return [...groups.values()];
  });
  let openRunHistoryGroup=$derived.by(()=>{
    if(runGroupChoice===''||runHistory.some(group=>group.key===runGroupChoice))return runGroupChoice??'';
    return runHistory.find(group=>group.runs.some(item=>item.id===activeRun))?.key??(runQuery.trim()?runHistory[0]?.key??'':'');
  });
  let layoutWidth=$state('Standard');
  let layerQuery=$state('');
  let agentView=$state<'Settings'|'Canvas'>('Settings');
  const assemblyVisible=$derived(page==='Agents'&&assemblyDock);
  const activationMatchesSaved=$derived(!!state.revision&&state.activation?.revision===state.revision.id&&state.activation?.route===state.route);
  const activateDisabled=$derived(!loaded||!!ready||dirty||!state.revision||pending||sending||activationMatchesSaved);
  const agentRevisionStatus=$derived([
    dirty?'Unsaved changes':undefined,
    state.revision?'Saved r'+state.revision.number:'No saved revision',
    state.activation?'Active r'+state.activation.number:'No active revision',
  ].filter(Boolean).join(' · '));
  let types={assembly:AssemblyNode};
  let nodes=$state.raw<any[]>([]);
  const pages=['Agents','Workflows','Creative','Sessions','Runs'];
  let shownBindings=$state.raw<string[]>([]);
  const visibilityByDefinition=new Map<string,string[]>();
  const canvasNodes=$derived(graph.nodes.filter(node=>!isOptionalBinding(node.id)||shownBindings.includes(node.id)));
  const canvasIds=$derived(new Set(canvasNodes.map(node=>node.id)));
  const defaultPromptSize={width:promptWidths.min,height:promptHeights.min};
  let promptSize=$state.raw(defaultPromptSize);
  const promptSizeKey=(definition:string,axis:'width'|'height')=>'tori-canvas-prompt-'+axis+':'+definition;
  function promptDimension(value:number,{min,max}:{min:number;max:number}){
    return Number.isFinite(value)?Math.max(min,Math.min(max,Math.round(value))):min;
  }
  const defaultNodeTitle=(id:string)=>id==='agent'?'Agent Definition':id==='model'?'Model Reference':
    id===tokenSourceId?'Output limit Integer':id==='tool'&&(!state.fixture||(field(graph,'tool','reference')??'local-reference@1')!=='local-reference@1')?'Read-only Tool':agentResources.find(item=>item.id===id)?.label??'System prompt';
  function customNodeTitle(id:string){
    const node=graph.nodes.find(item=>item.id===id);
    const original=graph.nodeTypes.find(type=>type.id===node?.type)?.label;
    return node?.label!==original?node?.label:undefined;
  }
  const objectTitle=(id:string)=>id==='agent' ? resolved(graph).name||'Untitled agent' : customNodeTitle(id)??defaultNodeTitle(id);
  const assemblyDefinitions=$derived(agentDefinitions.map(item=>item.id===state.definition&&graph.nodes.some(node=>node.id==='agent')
    ? {...item,name:objectTitle('agent')} : item));
  function resizePrompt({width=promptSize.width,height=promptSize.height}:Partial<typeof defaultPromptSize>){
    promptSize={width:promptDimension(width,promptWidths),height:promptDimension(height,promptHeights)};
    if(state.definition){
      try{
        for(const axis of ['width','height'] as const)
          localStorage.setItem(promptSizeKey(state.definition,axis),String(promptSize[axis]));
      }catch{}
    }
  }

  async function request(path='',data?:any,definition=state.definition,signal?:AbortSignal) {
    const suffix=data===undefined&&definition?'?definition='+encodeURIComponent(definition):'';
    const response=await fetch('/api/studio'+path+suffix, data===undefined?{signal}:{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,definition})});
    const result=await response.json();
    if(!response.ok) throw Object.assign(new Error(result.message||'Studio could not complete this action.'),{status:response.status});
    return result;
  }
  async function loadSessionMemory(id:string){
    if(id!==activeSession)return;
    const read=++memoryRead;
    try {
      const value=await request('/memory/session',{session:id});
      if(read===memoryRead&&id===activeSession)memoryResult={session:id,view:value};
    }catch{if(read===memoryRead&&id===activeSession)memoryResult={session:id,view:{status:'error'}};}
  }
  $effect(()=>{
    const selected=session;
    state.runs.find(item=>item.session===selected?.id&&!item.parentRun);
    if(page!=='Sessions'||!selected||selected.authoring||selected.archivedFixture){memoryRead++;memoryResult=undefined;return;}
    untrack(()=>void loadSessionMemory(selected.id));
  });
  const pendingMemorySave=$derived(memoryView?.turns?.some((turn:any)=>turn.operation?.status==='running'));
  $effect(()=>{
    const id=activeSession;
    if(page!=='Sessions'||!id||!pendingMemorySave)return;
    const poll=setInterval(()=>void loadSessionMemory(id),750);
    return ()=>clearInterval(poll);
  });
  async function changeMemory(path:string,payload:any,id:string){
    if(id!==activeSession)throw new Error('Reopen the source Session to change this memory.');
    try{return await request('/memory/'+path,{...payload,session:id});}
    catch(error){
      if(path==='confirm'&&!(error as any).status){
        // A missing response is not evidence of a failed save. Query the
        // original operation only; this path never submits another write.
        const reconciled=await request('/memory/check',{session:id,run:payload.run,operation:payload.operation}).catch(()=>null);
        if(reconciled?.status==='saved')return reconciled;
      }
      throw error;
    }
    finally{await loadSessionMemory(id);}
  }
  async function stopWatchedRun(item:any){
    if(!item||observation?.run!==item.id||!observation.canStop||stoppingRun)return;
    stoppingRun=item.id;
    runActionError='';
    try{await request('/stop-turn',{session:item.session,run:item.id,activation:item.activation});}
    catch(error){runActionError=(error as Error).message;stoppingRun='';}
  }
  async function stopSessionTurn(){
    if(liveSessionRun&&observation?.run===liveSessionRun.id&&observation.canStop){
      await stopWatchedRun(liveSessionRun);
      return;
    }
    const activity=sendActivity;
    if(!activity?.canStop||!activity.turn||stoppingSession)return;
    stoppingSession=true;
    try{
      const result=await request('/stop-turn',{session:activity.session,run:activity.turn});
      if(result.status!=='stopping')await loadSessionMemory(activity.session);
    }
    catch(error){turnErrors[activity.session]=(error as Error).message;stoppingSession=false;}
  }
  function mergeObserved(packet:any){
    const row=packet.run;
    const old=state.runs.find(item=>item.id===row.id);
    // A partial/late delivery cannot move a terminal row back to Running.
    if(old?.state&&old.state!=='Running'&&
      (old.state==='Uncertain'?row.state!=='Uncertain'&&!row.reconciliation:row.state!==old.state))return;
    const seen=new Map<string,any>((packet.children??[]).map((item:any)=>[item.id,item]));
    seen.set(row.id,row);
    const runs=state.runs.map(item=>{
      const next=seen.get(item.id);
      seen.delete(item.id);
      return next??item;
    });
    state={...state,
      sessions:state.sessions.map(item=>item.id===packet.session.id?packet.session:item),
      runs:[...seen.values(),...runs],
    };
  }
  function followRun(run:string,session:string,activation:string,streamId:string,workspace:string){
    const target={run,session,activation};
    const abort=new AbortController();
    const key=cursorKey(workspace,run);
    let seen:any;
    try {
      const stored=JSON.parse(localStorage.getItem(key)??'null');
      if(stored?.cursor?.streamId===streamId&&Number.isSafeInteger(stored.cursor.lastSeq)&&stored.cursor.lastSeq>=0)
        seen=stored;
    }catch{}
    let timer:ReturnType<typeof setTimeout>;
    const watch=async()=>{
      try{
        const packet=await request('/run-observe',{...target,cursor:seen?.cursor},undefined,abort.signal);
        if(abort.signal.aborted)return;
        const next=acceptRunPacket(seen,packet,target);
        if(next===seen){timer=setTimeout(watch,500);return;}
        seen=next;
        mergeObserved({...packet,run:next.run});
        observation={run,gap:next.gap,canStop:packet.canStop,writing:packet.writing,disconnected:false};
        try{localStorage.setItem(key,JSON.stringify({cursor:next.cursor,gap:next.gap}));}catch{}
        if(next.run.state!=='Running'){
          if(stoppingRun===run)stoppingRun='';
          return;
        }
      }catch(error){
        if(abort.signal.aborted)return;
        const previous=observation?.run===run?observation:undefined;
        observation={run,gap:!!previous?.gap,canStop:false,writing:false,disconnected:true};
        const status=(error as any).status;
        if(status===409){
          // A cursor from before a store restore may be ahead of disk. Rejoin
          // from the authoritative snapshot; never advance from that cursor.
          seen=undefined;
          try{localStorage.removeItem(key);}catch{}
        }
        if([403,404].includes(status))return;
      }
      timer=setTimeout(watch,500);
    };
    void watch();
    return ()=>{abort.abort();clearTimeout(timer);};
  }
  const watchedRunId=$derived(watchedRun?.id), watchedSessionId=$derived(watchedRun?.session);
  const watchedActivation=$derived(watchedRun?.activation), watchedStream=$derived(watchedRun?.streamId);
  const workspaceId=$derived(state.workspace);
  $effect(()=>{
    const run=watchedRunId,id=watchedSessionId,pin=watchedActivation,stream=watchedStream,workspace=workspaceId;
    if(!run||!id||!pin||!stream||!workspace)return;
    return untrack(()=>followRun(run,id,pin,stream,workspace));
  });
  function applyState(next:any){
    const workspaceChanged=next.workspace!==state.workspace;
    if(workspaceChanged){
      authoringMode='inspect';
      if(next.workspace){
        try{
          if(localStorage.getItem(authoringModeKey(next.workspace))==='change')authoringMode='change';
        }catch{}
      }
    }
    if(next.definition!==state.definition){
      promptSize=defaultPromptSize;
      shownBindings=visibilityByDefinition.get(next.definition)??[];
      if(next.definition){
        try{
          promptSize={
            width:promptDimension(Number(localStorage.getItem(promptSizeKey(next.definition,'width'))),promptWidths),
            height:promptDimension(Number(localStorage.getItem(promptSizeKey(next.definition,'height'))),promptHeights),
          };
        }catch{}
      }
    }
    state=next;
    if(workspaceChanged)restoreAuthoringActivation();
    if(!next.sessions.some(item=>item.id===activeSession))activeSession=next.sessions[0]?.id??'';
    if(page==='Runs')syncRunSelection();
    else if(!next.runs.some(item=>item.id===activeRun))activeRun=next.runs[0]?.id??'';
  }
  function restoreAuthoringActivation(){
    let saved:string|null=null;
    try{saved=localStorage.getItem(authoringActivationKey(state.workspace));}catch{}
    const available=(version:string)=>authoringActivations.some(item=>item.version===version);
    authoringActivationUnavailable=!!saved&&!available(saved);
    authoringActivation=saved?(authoringActivationUnavailable?'':saved):
      state.authoringChats?.find(chat=>available(chat.activation))?.activation??'';
  }
  function selectAuthoringActivation(value:string){
    authoringActivation=value;
    authoringActivationUnavailable=false;
    authoringOptionsOpen=false;
    authoringResult=null;
    authoringError='';
    if(state.workspace){
      try{localStorage.setItem(authoringActivationKey(state.workspace),value);}catch{}
    }
  }
  function setAuthoringMode(value:string){
    authoringMode=value==='change'?'change':'inspect';
    if(state.workspace){
      try{localStorage.setItem(authoringModeKey(state.workspace),authoringMode);}catch{}
    }
  }
  function reopen(next:any) {
    cancelWire();
    draftInstance=crypto.randomUUID();
    const g=next.graph??emptyAssembly();
    journal=history(g); graph=journal.graph; baseline=authoringBytes(graph);historyState();
    journalBefore=graph;
    journalActions=[];
    if(next.workingAssembly){
      const {operations,receipt}=next.workingAssembly;
      draftInstance=receipt.draftId;
      commit(operations,false);
    }
    selectedWire='';
    if(!graph.nodes.some(node=>node.id===selection))selection='';
  }
  onMount(()=>{
    const mq=matchMedia('(max-width: 720px)');
    const measure=()=>{
      mobile=mq.matches;
      if(!mobile&&mobileOpen){
        mobileOpen=false;
        if(sheet)setDesktopDock(sheet,true);
      }
    };
    measure();
    mq.addEventListener('change',measure);
    try{
      const prefs=JSON.parse(localStorage.getItem('tori-v1a-layout')??'{}');
      layoutWidth=prefs.width??'Standard';
      assemblyDock=prefs.assemblyDock??prefs.layers??true;
      if(mobile&&prefs.authoringOpen){sheet='Authoring Agent';mobileOpen=true;}
      else authoringDock=prefs.authoringOpen===true;
      selection=prefs.selection??'';
      sessionSidebar=prefs.sessionSidebar??prefs.sessionLibrary??true;
      showSessionDescriptions=prefs.showSessionDescriptions??prefs.showSessionRevision??true;
      runSidebar=prefs.runSidebar??true;
      showRunDescriptions=prefs.showRunDescriptions??true;
      runGrouping=prefs.runGrouping==='date'?'date':'session';
      runScopePreference=prefs.runScopePreference==='session'?'session':'all';
    }catch{}
    request().then(next=>{
      applyState(next);reopen(next);restoreWorkingDraft(next);void recoverDraftReceipts(next);
      const url=new URL(window.location.href);
      const linked=url.searchParams.get('run');
      let remembered:string|null=null;
      try{remembered=localStorage.getItem(resumeRunKey(next.workspace));}catch{}
      const restored=next.runs.find(item=>item.id===(linked??remembered)&&
        (item.streamId||next.runs.some(parent=>parent.id===item.parentRun&&parent.streamId)));
      if(restored){
        activeSession=restored.session;
        if(linked){inspectSessionScope=true;runReturnSession=restored.session;changePage('Runs');void openRun(restored.id);}
        else void openSession(restored.session);
      }else if(linked){
        activeRun='';
        inspectSessionScope=false;
        runReturnSession='';
        changePage('Runs');
        runActionError='This Run is not available in the current Studio.';
      }
      try{
        const saved=JSON.parse(localStorage.getItem(pendingRunKey(next.workspace))??'null');
        if(saved&&[saved.request,saved.session,saved.activation].every(value=>typeof value==='string')){
          if(next.sessions.some(item=>item.id===saved.session&&item.activation===saved.activation))pendingStart=saved;
          else clearPendingStart(next.workspace,saved);
        }
      }catch{}
    }).catch(e=>error=e.message).finally(()=>loaded=true);
    const dayCheck=setInterval(()=>today=localCalendarDay(new Date()),60_000);
    return ()=>{
      mq.removeEventListener('change',measure);
      clearInterval(dayCheck);
    };
  });
  $effect(()=>{if(loaded)localStorage.setItem('tori-v1a-layout',JSON.stringify({assemblyDock,authoringOpen:mobile?mobileOpen&&sheet==='Authoring Agent':authoringDock,width:layoutWidth,selection,sessionSidebar,showSessionDescriptions,runSidebar,showRunDescriptions,runGrouping,runScopePreference}));});
  $effect(()=>{
    if(sending||!dockBusy)return;
    const definition=state.definition;
    const run=dockRun.id;
    let disposed=false;
    let timer:ReturnType<typeof setTimeout>;
    const refresh=async()=>{
      try{
        const next=await request('',undefined,definition);
        if(!disposed&&state.definition===definition&&dockRun?.id===run)applyState(next);
      }catch{/* Keep the saved chat visible while the connection recovers. */}
      if(!disposed)timer=setTimeout(refresh,500);
    };
    timer=setTimeout(refresh,500);
    return ()=>{disposed=true;clearTimeout(timer);};
  });
  $effect(()=>{
    const g=graph;
    const selected=untrack(()=>selection);
    nodes=canvasNodes.map(n=>{
      const resource=agentResources.find(item=>item.id===n.id);
      const reference=resource?field(g,n.id,'reference'):undefined;
      const preview=n.id==='child'?childTitle(reference):
        resource?resourceChoices[resource.id].find(option=>option.value===reference)?.label??reference:undefined;
      return {id:n.id,type:'assembly',position:n.position,selected:selected===n.id,deletable:false,
        ...(n.id==='instructions'?promptSize:{}),
        data:{graph:g,preview,activePin:n.id==='child'?state.childRevisions?.find(item=>item.id===state.activation?.childRevision):undefined,
          title:objectTitle(n.id),customTitle:customNodeTitle(n.id),defaultTitle:defaultNodeTitle(n.id),mobile,promptSize,canvasIds,route:state.route,hostDeadlineMs:state.hostDeadlineMs,
          wireSource,fixture:state.fixture,
          fields:{childRevisions:state.childRevisions,edit,configure,connect,disconnect,remove,inspectDelegation,
            focus:focusCanvasNode,rename:renameNode,resizePrompt,
            showOptionalNode,hideOptionalNode,createAndConnectSettingNode}}};
    });
  });
  $effect(()=>{
    const selected=selection;
    untrack(()=>{
      // Flow may already have applied pointer selection. Keep its measured nodes in that case.
      if(!nodes.some(node=>!!node.selected!==(node.id===selected)))return;
      nodes=nodes.map(node=>!!node.selected===(node.id===selected)?node:{...node,selected:node.id===selected});
    });
  });
  const edgeTypes={assembly:AssemblyWire};
  let edges:AssemblyWireEdge[]=$derived(graph.edges.filter(e=>canvasIds.has(e.source)&&canvasIds.has(e.target)).map(e=>{
    const label=graph.nodeTypes.find(type=>type.id===e.target)?.ports.find(port=>port.id===e.targetPort)?.label??e.targetPort;
    const delegation=e.source==='child'&&e.targetPort==='child';
    return {id:e.id,type:'assembly',source:e.source,target:e.target,sourceHandle:e.sourcePort,targetHandle:e.targetPort,
      ariaLabel:objectTitle(e.source)+' to '+label,interactionWidth:22,
      class:delegation?'delegation-wire':undefined,
      style:delegation?'stroke-dasharray:3 4':e.targetPort==='model'?'stroke-dasharray:6 4':undefined};
  }));
  function commit(operations:any[],persist=true){
    const result=journal.apply(operations,graph.revision);
    if(!result.ok){graphError=result.issues.map(i=>i.message).join(' ');return false;}
    graph=result.graph;graphError='';historyState();
    journalActions.push({operations});
    if(persist)rememberWorkingActions();
    return true;
  }
  function edit(id:string,key:string,value:string|number|undefined){if(graph.nodes.find(n=>n.id===id)?.values[key]!==value)commit([change(id,key,value)]);}
  function renameNode(id:string,label:string){
    const node=graph.nodes.find(item=>item.id===id);
    if(!node)return false;
    const name=label.trim();
    if(id==='agent')return field(graph,id,'name')===name||commit([change(id,'name',name)]);
    const original=graph.nodeTypes.find(type=>type.id===node.type)?.label;
    if(!original)return false;
    const nextLabel=name||original;
    return node.label===nextLabel||commit([{type:'setLabel',nodeId:id,label:nextLabel}]);
  }
  function childTitle(reference:any){
    const child=state.childRevisions?.find(item=>'saved:'+item.id===reference);
    return (child?child.name+' \u00b7 r'+child.number:undefined)??(reference==='reference-reviewer@1'?'Reference reviewer':'Saved revision unavailable');
  }
  function configure(id:string,key:string,value:string|number){
    const operations=configureOperations(graph,id,key,value);
    return operations.length===0||commit(operations);
  }
  function travel(direction:'undo'|'redo'){
    const result=journal[direction]();if(!result.ok)return;graph=result.graph;graphError='';historyState();
    journalActions.push({travel:direction});
    rememberWorkingActions();
    if(!graph.nodes.some(node=>node.id===selection))selection='';
  }
  function connect(id:string,port:string){if(binding(graph,port)?.source!==id)commit([wire(id,port)]);}
  function disconnect(port:string){
    const edge=binding(graph,port);
    if(edge)disconnectWire(edge.id);
  }
  function disconnectWire(id:string){
    const edge=graph.edges.find(link=>link.id===id);
    if(!edge)return;
    const operations=retainInlineValue(edge);
    const activeElement=document.activeElement;
    const restoreFocus=activeElement===document.body||activeElement?.closest('.svelte-flow__edge');
    if(commit([...operations,{type:'remove',selection:{nodes:[],edges:[id]}}])&&restoreFocus){
      void tick().then(()=>document.querySelector<HTMLElement>('.flow .svelte-flow__node[data-id="'+edge.target+'"]')?.focus({preventScroll:true}));
    }
  }
  function retainInlineValue(edge:{target:string;targetPort:string}){
    if(edge.target==='agent'&&edge.targetPort==='instructions')return [change('agent','instructions',instructions(graph))];
    if(edge.target==='model'&&edge.targetPort==='tokens')return [change('model','tokens',outputTokens(graph))];
    return [];
  }
  async function inspectDelegation(invoker:HTMLElement|string|null){
    const edge=graph.edges.find(edge=>edge.source==='child'&&edge.targetPort==='child');
    if(!edge)return;
    delegationInvoker=invoker;
    selection='';
    selectedWire=edge.id;
    assemblyContext='selection';
    if(mobile){
      sheetInvoker=typeof invoker==='string'?canvasWire(invoker):invoker;
      sheet='Assembly / Selection';
      mobileOpen=true;
    }else{
      assemblyDock=true;
      await tick();
      document.getElementById('agent-selection-heading')?.focus({preventScroll:true});
    }
  }
  function canvasWire(id:string){
    return document.querySelector<SVGElement>('.flow .svelte-flow__edge[data-id="'+CSS.escape(id)+'"]');
  }
  function inspectDelegationWire(event:MouseEvent){
    const target=event.target instanceof Element?event.target:null;
    const id=target?.closest('.delegation-wire')?.getAttribute('data-id');
    if(!id)return;
    event.preventDefault();
    event.stopPropagation();
    inspectDelegation(id);
  }
  function restoreDelegationFocus(){
    const invoker=typeof delegationInvoker==='string'?canvasWire(delegationInvoker):delegationInvoker;
    if(invoker?.isConnected)invoker.focus({preventScroll:true});
    delegationInvoker=null;
  }
  function rememberDockScroll(node:HTMLElement,context:'assembly'|'selection'){
    const restore=()=>node.scrollTop=context==='assembly'?assemblyScroll:selectionScroll;
    const save=()=>{
      if(context!==assemblyContext||!node.clientHeight)return;
      if(context==='assembly')assemblyScroll=node.scrollTop;
      else selectionScroll=node.scrollTop;
    };
    const frame=requestAnimationFrame(restore);
    node.addEventListener('scroll',save);
    return {destroy:()=>{cancelAnimationFrame(frame);node.removeEventListener('scroll',save);}};
  }
  function cancelWire(){
    cancelFlowClick?.();
    wireSource='';
  }
  function remove(id:string){
    if(id==='agent')return;
    const ops:any[]=[];
    if(id==='instructions'&&binding(graph,'instructions'))ops.push(change('agent','instructions',instructions(graph)));
    if(id===tokenSourceId&&binding(graph,'tokens'))ops.push(change('model','tokens',outputTokens(graph)));
    if(commit([...ops,{type:'remove',selection:{nodes:[id],edges:[]}}])&&selection===id)selection='';
  }
  async function fit(){await tick();await flow?.fitView({padding:0.18,maxZoom:1});}
  function selectCanvas(id:string){
    selectedWire='';
    selection=id;
  }
  async function focusCanvasNode(id:string,alsoShow?:string){
    selectCanvas(id);
    if(agentView!=='Canvas')return;
    await tick();
    // Let Flow measure the canvas after the panel layout settles.
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    if(agentView==='Canvas'&&selection===id){
      const visible=[{id},...(alsoShow&&canvasIds.has(alsoShow)?[{id:alsoShow}]:[])];
      await flow?.fitView({nodes:visible,padding:0.28,maxZoom:1});
    }
  }
  function setBindingVisible(id:string,visible:boolean){
    if(!isOptionalBinding(id))return;
    cancelWire();
    const next=new Set(shownBindings);
    if(visible){
      next.add(id);
      if(id===tokenSourceId)next.add('model');
    }else{
      next.delete(id);
      if(id==='model')next.delete(tokenSourceId);
    }
    shownBindings=[...next];
    if(state.definition)visibilityByDefinition.set(state.definition,shownBindings);
  }
  function create(id:string){
    if(commit([add(id)])){
      setBindingVisible(id,true);
      void focusCanvasNode(id,id===tokenSourceId?'model':id==='agent'?undefined:'agent');
    }
  }
  async function showOptionalNode(id:string){
    if(!isOptionalBinding(id)||!graph.nodes.some(node=>node.id===id))return;
    setBindingVisible(id,true);
    await tick();
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    if(agentView==='Canvas')await fit();
  }
  function hideOptionalNode(id:string){
    setBindingVisible(id,false);
  }
  async function createAndConnectSettingNode(id:'instructions'|typeof tokenSourceId){
    if(graph.nodes.some(node=>node.id===id))return;
    if(id===tokenSourceId&&!graph.nodes.some(node=>node.id==='model'))return;
    const operations=id==='instructions'
      ? [add(id),change(id,'text',instructions(graph)),wire(id,'instructions')]
      : [add(id),change(id,'tokens',outputTokens(graph)),wire(id,'tokens')];
    if(commit(operations))await showOptionalNode(id);
  }
  function connectionEndpoints({source,sourceHandle,target,targetHandle}:Connection|Edge){
    if(!sourceHandle||!targetHandle)return;
    return {source,sourcePort:sourceHandle,target,targetPort:targetHandle};
  }
  function isCurrentWireDrag(id:string){
    return wireDrag?.id===id&&!wireDrag.cancelled&&wireDrag.graph===graph&&page==='Agents'&&agentView==='Canvas';
  }
  const isValidConnection:IsValidConnection=connection=>{
    if(wireDrag&&!isCurrentWireDrag(wireDrag.id))return false;
    const ends=connectionEndpoints(connection);
    return !!ends&&canWire(ends.source,ends.sourcePort,ends.target,ends.targetPort)&&
      !connectionIssueForTopology(graph,{id:wireDrag?.id??'',...ends});
  };
  function onConnection(connection:Connection):false{
    if(connection.targetHandle&&isValidConnection(connection))connect(connection.source,connection.targetHandle);
    return false;
  }
  function reconnectWire(next:AssemblyWireEdge,previous:AssemblyWireEdge):false{
    if(!isCurrentWireDrag(previous.id)||!isValidConnection(next))return false;
    const edge=graph.edges.find(link=>link.id===previous.id);
    const ends=connectionEndpoints(next);
    if(!edge||!ends)return false;

    const sameTarget=edge.target===ends.target&&edge.targetPort===ends.targetPort;
    if(!sameTarget||edge.source!==ends.source||edge.sourcePort!==ends.sourcePort){
      const operations=sameTarget?[]:retainInlineValue(edge);
      commit([...operations,{type:'reconnect',edgeId:edge.id,connection:ends}]);
    }
    // The canvas redraws from the graph history entry after validation.
    return false;
  }
  function finishWireDrag(event:MouseEvent|TouchEvent,id:string,hasTarget:boolean){
    if(wireDrag?.id!==id)return;
    const shouldDisconnect=!hasTarget&&isCurrentWireDrag(id);
    wireDrag=undefined;
    if(!shouldDisconnect)return;
    const pointer='changedTouches' in event?event.changedTouches[0]:event;
    if(!pointer)return;
    const surface=document.elementFromPoint(pointer.clientX,pointer.clientY);
    if(surface?.matches('.flow .svelte-flow__pane, .flow .svelte-flow__viewport'))disconnectWire(id);
  }
  async function action(work:()=>Promise<void>){if(pending)return;pending=true;error='';try{await work();}catch(e){error=(e as Error).message;}finally{pending=false;}}
  const save=()=>action(async()=>{
    if(draftTurn)return;
    const snapshot=graph;
    applyState(await request('/save',{graph:snapshot,expected:state.revision}));
    baseline=authoringBytes(snapshot);
    updateWorkingAfterSave(graph!==snapshot);
  });
  async function switchDefinition(next:any){
    const canvasWasMounted=agentView==='Canvas'&&graph.nodes.length>0;
    applyState(next);selection='';layerQuery='';componentQuery='';graphError='';reopen(next);restoreWorkingDraft(next);
    canvasInitialized=canvasWasMounted&&graph.nodes.length>0;
    view={x:0,y:0,zoom:1};
    // If Flow stays mounted, fit the new document here. Otherwise oninit owns the first fit.
    if(canvasInitialized)void fit();
  }
  const openDefinition=(id:string)=>action(async()=>switchDefinition(await request('',undefined,id)));
  const newDefinition=()=>action(async()=>{
    await switchDefinition(await request('/definitions',{}));
    create('agent');
  });
  const reload=()=>action(async()=>{
    const next=await request();
    updateWorkingAfterSave(false);
    applyState(next);
    reopen(next);
  });
  const activate=()=>action(async()=>{applyState(await request('/activate',{revision:state.revision}));});
  function changePage(next:string){
    if(next!=='Runs'){
      const url=new URL(window.location.href);
      if(url.searchParams.has('run')){url.searchParams.delete('run');window.history.replaceState(null,'',url);}
    }
    launchOpen=false;
    mobileOpen=false;
    if(next!=='Agents'){cancelWire();selectedWire='';if(wireDrag)wireDrag.cancelled=true;}
    if(next!=='Runs')closeRunInspection();
    page=next;
  }
  async function toggleSessionSearch(){
    if(launchOpen){
      launchSearchOpen=!launchSearchOpen;
      if(!launchSearchOpen)launchQuery='';
    }else{
      sessionSearchOpen=!sessionSearchOpen;
      if(!sessionSearchOpen){sessionQuery='';sessionGroupChoice=undefined;}
    }
    await tick();
    document.getElementById(launchOpen?'session-agent-search':'session-history-search')?.focus({preventScroll:true});
  }
  function focusSessionLauncher(){
    document.getElementById('new-session-picker-title')?.focus({preventScroll:true});
  }
  async function showSessionLauncher(){
    if(page!=='Sessions')changePage('Sessions');
    if(mobile){
      if(!mobileOpen||sheet!=='Inspector')toggle('Inspector');
    }else sessionSidebar=true;
    launchError='';
    launchQuery='';
    launchSearchOpen=false;
    launchOpen=true;
    await tick();
    focusSessionLauncher();
  }
  async function closeSessionLauncher(){
    if(pending)return;
    launchOpen=false;
    await tick();
    sessionLauncherButton?.focus({preventScroll:true});
  }
  async function openAgentForActivation(definition:string){
    if(pending||sending||(dirty&&state.definition!==definition))return;
    if(state.definition!==definition){
      await openDefinition(definition);
      if(state.definition!==definition)return;
    }
    selection='agent';
    agentView='Settings';
    if(mobile)sheetInvoker=null;
    changePage('Agents');
    await focusAgentRevision();
  }
  async function focusAgentRevision(){
    await tick();
    if(page==='Agents')document.getElementById('agent-revision-status')?.focus({preventScroll:true});
  }
  async function start(agent:AgentActivation,fromEditor=false){
    if(pending||sending)return;
    pending=true;
    launchError='';
    if(fromEditor)error='';
    try{
      const next=await request('/sessions',{
        activation:agent.version,sessionDefinition:agent.definition,
        ...(fromEditor?{activeDefinition:agent.definition}:{}),
      });
      applyState(next);
      if(fromEditor?page==='Agents':page==='Sessions'&&launchOpen){
        if(mobile)sheetInvoker=null;
        await openSession(next.sessions[0].id,true);
      }
    }catch(e){
      if(fromEditor)error=(e as Error).message;
      else launchError=(e as Error).message;
      try{applyState(await request());}catch{/* Preserve the creation error if refreshing also fails. */}
    }finally{pending=false;}
  }
  async function openSession(id:string,focus=false,messageId?:string){
    if(activeSession!==id&&runScopePreference==='session'){
      runQuery='';
      runGroupChoice=undefined;
    }
    activeSession=id;
    changePage('Sessions');
    if(focus){
      await tick();
      if(messageId){
        // Let the Conversation viewport finish restoring its reading position first.
        await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      }
      if(page!=='Sessions'||activeSession!==id)return;
      const target=messageId?conversationPane?.querySelector<HTMLElement>('[data-message-id="'+CSS.escape(messageId)+'"]'):undefined;
      if(target){
        target.tabIndex=-1;
        target.focus({preventScroll:true});
        target.scrollIntoView({block:'start',inline:'nearest'});
      }else sessionTitle?.focus({preventScroll:true});
    }
  }
  async function openRun(id:string,focus=false){
    const changed=activeRun!==id;
    if(changed)runActionError='';
    if(changed&&focus)runGroupChoice=undefined;
    activeRun=id;
    const selected=state.runs.find(item=>item.id===id);
    if(page==='Runs'){
      const url=new URL(window.location.href);
      if(selected?.streamId||state.runs.some(parent=>parent.id===selected?.parentRun&&parent.streamId))url.searchParams.set('run',id);
      else url.searchParams.delete('run');
      window.history.replaceState(null,'',url);
    }
    if(focus&&mobileOpen)sheetInvoker=null;
    mobileOpen=false;
    await tick();
    if(page==='Runs'&&activeRun===id){
      if(changed&&runPane)runPane.scrollTop=0;
      if(focus)runTitle?.focus({preventScroll:true});
    }
  }
  function syncRunSelection(){
    const selected=runScope==='session'?sessionRun:run??state.runs[0];
    const id=selected?.id??'';
    if(id===activeRun)return;
    activeRun=id;
    if(runPane)runPane.scrollTop=0;
  }
  function setRunScope(value:'session'|'all'){
    runScopePreference=value;
    inspectSessionScope=false;
    runGroupChoice=undefined;
    syncRunSelection();
  }
  function closeRunInspection(){
    if(!runReturnSession)return;
    runReturnSession='';
    inspectSessionScope=false;
    runQuery='';
    runGroupChoice=undefined;
  }
  function openRuns(){
    closeRunInspection();
    syncRunSelection();
    changePage('Runs');
  }
  async function toggleRunSearch(){
    runSearchOpen=!runSearchOpen;
    if(!runSearchOpen){runQuery='';runGroupChoice=undefined;}
    await tick();
    document.getElementById('run-history-search')?.focus({preventScroll:true});
  }
  function inspectSessionRuns(runId=sessionRun?.id){
    if(!runId)return;
    inspectSessionScope=true;
    runReturnSession=activeSession;
    runQuery='';
    runGroupChoice=undefined;
    if(mobileOpen)sheetInvoker=null;
    changePage('Runs');
    void openRun(runId,true);
  }
  function rememberReadingPosition(node:HTMLElement,id:string){
    const offset=readingPositions.get(id);
    let restoring=offset!==undefined;
    let frame=0;
    const remember=(event:Event)=>{
      const feed=event.target;
      if(restoring||!(feed instanceof HTMLElement)||!feed.matches('.vict-conversation'))return;
      if(feed.scrollHeight-feed.clientHeight-feed.scrollTop<=1)readingPositions.delete(id);
      else readingPositions.set(id,feed.scrollTop);
    };
    node.addEventListener('scroll',remember,true);
    if(restoring){
      // Let the public Conversation viewport finish positioning its messages on mount.
      frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{
        const feed=node.querySelector<HTMLElement>('.vict-conversation');
        if(feed)feed.scrollTop=offset!;
        restoring=false;
      });});
    }
    return {destroy(){
      cancelAnimationFrame(frame);
      node.removeEventListener('scroll',remember,true);
    }};
  }
  const sessionActionId=(id:string)=>'session-row-actions-'+id;
  function rememberSessionAction(id:string){
    sessionActionInvoker=document.getElementById(sessionActionId(id));
    sessionActionGroup=sessionActionInvoker?.closest('[data-accordion-item]')?.querySelector('[data-accordion-trigger]')??null;
  }
  function restoreSessionActionFocus(event:Event){
    const target=[sessionActionInvoker,sessionActionGroup,historyOptionsButton].find(element=>element?.isConnected);
    if(target){
      event.preventDefault();
      target.focus({preventScroll:true});
    }
  }
  function openRename(item:SessionHistoryItem){
    rememberSessionAction(item.id);
    renameTarget=item.id;
    renameTitle=item.title;
    renameError='';
  }
  function openDelete(item:SessionHistoryItem){
    rememberSessionAction(item.id);
    deleteTarget={id:item.id,title:item.title};
    deleteError='';
  }
  async function renameSession(event:SubmitEvent){
    event.preventDefault();
    if(pending||sending||!renameTitle.trim())return;
    pending=true;
    renameError='';
    try{
      applyState(await request('/rename-session',{session:renameTarget,title:renameTitle}));
      renameTarget='';
    }catch(e){renameError=(e as Error).message;}
    finally{pending=false;}
  }
  const deleteSession=()=>action(async()=>{
    if(!deleteTarget)return;
    const {id}=deleteTarget;
    deleteError='';
    try{
      const next=await request('/delete-session',{session:id});
      if(pendingStart?.session===id)clearPendingStart(state.workspace,pendingStart);
      delete sessionDrafts[id];
      delete sessionContext[id];
      delete turnErrors[id];
      readingPositions.delete(id);
      applyState(next);
      deleteTarget=null;
    }catch(e){deleteError=(e as Error).message;}
  });
  function clearPendingStart(workspace:string,identity:StartRequest){
    if(pendingStart?.request===identity.request){pendingStart=undefined;startNotFound=false;}
    if(pendingInput?.request===identity.request)pendingInput=undefined;
    try{
      const stored=JSON.parse(localStorage.getItem(pendingRunKey(workspace))??'null');
      if(stored?.request===identity.request)localStorage.removeItem(pendingRunKey(workspace));
    }catch{}
  }
  async function attachAccepted(accepted:any,workspace:string,identity:StartRequest){
    const {run,session:id,activation,streamId}=accepted;
    if(typeof run!=='string'||typeof streamId!=='string'||id!==identity.session||activation!==identity.activation)
      throw new Error('Studio returned a different Run request.');
    try{
      localStorage.setItem(resumeRunKey(workspace),run);
    }catch{}
    if(!state.runs.some(item=>item.id===run)){
      // Acknowledgement proves identity. Until an observation arrives this
      // row can drive polling, but does not claim current execution state.
      const source=state.sessions.find(item=>item.id===id);
      if(!source)throw new Error('Reopen the Session to follow its accepted Run.');
      const placeholder={id:run,session:id,activation,streamId,background:true,name:source.name,
        revision:source.revision,number:source.number,fixture:source.fixture,started:source.lastActivityAt,
        events:[],awaitingObservation:true};
      state={...state,runs:[placeholder,...state.runs]};
      observation={run,gap:false,canStop:false,writing:false,disconnected:false};
    }
    delete turnErrors[id];
    if(pendingInput?.request===identity.request){
      if(sessionDrafts[id]?.trim()===pendingInput.text)delete sessionDrafts[id];
      sessionContext[id]=false;
    }
    clearPendingStart(workspace,identity);
  }
  $effect(()=>{
    const identity=pendingStart,workspace=workspaceId;
    if(!identity||!workspace)return;
    const abort=new AbortController();
    let timer:ReturnType<typeof setTimeout>;
    const check=async()=>{
      try{
        const accepted=await request('/run-lookup',identity,undefined,abort.signal);
        if(abort.signal.aborted||pendingStart?.request!==identity.request)return;
        await attachAccepted(accepted,workspace,identity);
        if(page==='Agents'&&!dirty)await openSession(accepted.session);
        return;
      }catch(error){
        if(abort.signal.aborted||pendingStart?.request!==identity.request)return;
        // Absence now is not proof a delayed start won't arrive. An explicit
        // resend uses the exact original identity, including after a reload.
        if(!sending)startNotFound=(error as any).status===404;
        if((error as any).status===403)return;
      }
      timer=setTimeout(check,750);
    };
    void check();
    return ()=>{abort.abort();clearTimeout(timer);};
  });
  async function sendBackground(input:string,id:string,activation:string,workspace:string){
    let identity={request:crypto.randomUUID(),session:id,activation};
    let previous=pendingStart;
    if(!previous)try{previous=JSON.parse(localStorage.getItem(pendingRunKey(workspace))??'null');}catch{}
    if(previous){
      try{
        const accepted=await request('/run-lookup',previous);
        await attachAccepted(accepted,workspace,previous);
        await openSession(accepted.session);
        return;
      }catch(error){
        if((error as any).status!==404){turnErrors[id]=(error as Error).message;return;}
      }
      if(previous.session!==id||previous.activation!==activation){
        turnErrors[id]='Return to the original Session to check its background Run request.';
        return;
      }
      identity=previous;
    }
    startNotFound=false;
    pendingStart=identity;
    pendingInput={request:identity.request,text:input};
    try{localStorage.setItem(pendingRunKey(workspace),JSON.stringify(identity));}catch{}
    try{
      let accepted;
      try{accepted=await request('/start-run',{...identity,input,includeContext:!!sessionContext[id]});}
      catch(error){
        try{accepted=await request('/run-lookup',identity);}
        catch{
          // A definite validation refusal on a new request can be replaced.
          // A lost reply must be joined or explicitly sent with the same ID.
          if(!previous&&[400,403,404,409].includes((error as any).status))clearPendingStart(workspace,identity);
          throw error;
        }
      }
      sessionContext[id]=false;
      if(sessionDrafts[id]?.trim()===input)delete sessionDrafts[id];
      await attachAccepted(accepted,workspace,identity);
    }catch(error){
      if(pendingStart?.request===identity.request||!state.runs.some(item=>item.session===id&&item.background))
        turnErrors[id]=(error as Error).message;
    }
  }
  async function send(input:string){
    const id=activeSession;
    if(sending||pending||sessionBusy||!session?.connectionReady||session.interrupted)return;
    sending=true;
    if((backgroundChoice[id]||pendingStart?.session===id)&&!session.authoring){
      delete turnErrors[id];
      try{await sendBackground(input,id,session.activation,state.workspace);}
      finally{sending=false;}
      return;
    }
    delete turnErrors[id];
    sendActivity={session:id,phase:'waiting'};
    const activityAbort=new AbortController();
    const poll=async()=>{
      try {
        const response=await fetch('/api/studio/activity?session='+encodeURIComponent(id),{signal:activityAbort.signal});
        if(response.ok){
          const {phase,turn,canStop}=await response.json();
          if(phase&&!activityAbort.signal.aborted)sendActivity={session:id,phase,turn,canStop};
        }
      }catch{/* The turn request still owns success and failure. */}
      if(!activityAbort.signal.aborted)setTimeout(poll,350);
    };
    void poll();
    try{
      const next=await request('/turn',{session:id,input,includeContext:!!sessionContext[id]});
      sessionContext[id]=false;
      if(sessionDrafts[id]?.trim()===input)delete sessionDrafts[id];
      applyState(next);
      const last=next.runs.find(item=>item.session===id&&!item.parentRun);
      if(last?.status!=='completed')turnErrors[id]=last?.message??'The response did not complete. See Runs.';
    }catch(e){turnErrors[id]=(e as Error).message;}
    finally{activityAbort.abort();sendActivity=null;sending=false;stoppingSession=false;}
  }
  function workingKey(workspace:string,definition:string){
    return recoveryPrefix(workspace)+definition;
  }
  function readWorking(key:string):WorkingDraft|undefined{
    const stored=sessionStorage.getItem(key);
    return stored?JSON.parse(stored):undefined;
  }
  function writeWorking(key:string,item:WorkingDraft){
    if(item.before||Object.keys(item.receipts).length)sessionStorage.setItem(key,JSON.stringify(item));
    else sessionStorage.removeItem(key);
  }
  function restoreWorkingDraft(next:any){
    try{
      const item=readWorking(workingKey(next.workspace,next.definition));
      if(!item?.before)return;
      if(item.savedRevision!==(next.revision?.id??null)){
        authoringError='The saved revision changed. This tab still holds the earlier working draft recovery record.';
        return;
      }
      const restored=history(item.before);
      for(const action of item.actions){
        const result='travel' in action?restored[action.travel]():restored.apply(action.operations);
        if(!result.ok)throw new Error('Invalid working draft history.');
      }
      journal=restored;
      journalBefore=item.before;
      journalActions=[...item.actions];
      graph=journal.graph;
      historyState();
    }catch{
      authoringError='The working draft could not be restored. Its recovery record is retained in this tab.';
    }
  }
  function rememberWorkingActions(){
    const key=workingKey(state.workspace,state.definition);
    try{
      const item=readWorking(key);
      if(!item?.before||item.savedRevision!==(state.revision?.id??null))return;
      writeWorking(key,{...item,actions:journalActions});
    }catch{
      authoringError='The latest edit could not be added to the recovery record. Save the draft before reloading.';
    }
  }
  function updateWorkingAfterSave(keepDraft:boolean){
    const key=workingKey(state.workspace,state.definition);
    try{
      const item=readWorking(key);
      if(!item)return;
      writeWorking(key,{...item,savedRevision:state.revision?.id??null,
        ...(!keepDraft?{before:undefined,actions:[]}:{}),
      });
    }catch{
      authoringError='The draft recovery record could not be updated.';
    }
  }
  async function sendDraftReceipt(key:string, item:JournalRecovery){
    const acknowledge=()=>request('/authoring-ack',{channel:item.channel,receipt:item.receipt,graph:item.graph});
    const confirmation=await acknowledge().catch(error=>{
      if(item.graph&&error instanceof TypeError)return acknowledge();
      throw error;
    });
    const working=readWorking(key);
    if(working&&Object.hasOwn(working.receipts,item.receipt.operationId)){
      delete working.receipts[item.receipt.operationId];
      writeWorking(key,working);
    }
    if(confirmation.saved?.id&&item.graph&&state.definition===confirmation.saved.definition&&
       (state.revision?.id??null)===confirmation.saved.expected){
      const {id,number}=confirmation.saved;
      applyState({...state,revision:{id,number}});
      baseline=authoringBytes(item.graph);
      updateWorkingAfterSave(dirty);
    }
  }
  async function recoverDraftReceipts(next:any){
    const prefix=recoveryPrefix(next.workspace);
    let recovered=false;
    try{
      for(const key of Object.keys(sessionStorage).filter(key=>key.startsWith(prefix))){
        const working=readWorking(key);
        for(const item of Object.values(working?.receipts??{})){
          await sendDraftReceipt(key,item);
          recovered=true;
        }
      }
      if(recovered&&state.definition===next.definition)applyState(await request());
    }catch{
      authoringError='An earlier authoring receipt could not be sent. It is retained in this tab.';
    }
  }
  async function acceptDraftProposal(turn:DraftTurn, proposal:DraftEditProposal, actorId:string, deadlineAt:number){
    if(proposal.actorId!==actorId||proposal.turnId!==turn.turnId||proposal.draftId!==turn.draftId)return;
    const workspace=state.workspace;
    const key=workingKey(workspace,turn.definition);
    let acknowledged:JournalRecovery|undefined;
    let operations:Parameters<typeof journal.apply>[0]|undefined;
    let staged:typeof graph|undefined;
    let save=false;
    if(Date.now()>=deadlineAt)turn.stop.abort();
    commitDraftEdit(proposal,turn.stop.signal,{
      resolveDraft:()=>{
        const occurrenceId=turn.workspace?workspaceOccurrence:editableOccurrence();
        return draftTurn===turn&&draftInstance===turn.draftId&&state.definition===turn.definition&&(state.revision?.id??null)===turn.savedRevision&&occurrenceId
          ?{draftId:turn.draftId,occurrenceId,revision:graph.revision}:undefined;
      },
      readReceipt:()=>{
        acknowledged=turn.receipts.get(proposal.operationId);
        if(acknowledged)return acknowledged.receipt;
        acknowledged=readWorking(key)?.receipts[proposal.operationId];
        return acknowledged?.receipt;
      },
      apply:bound=>{
        if(turn.workspace){
          const proposal=JSON.parse(bound.edit);
          const parsed=patchInput.safeParse(proposal.patch);
          if(!parsed.success)return {status:'invalid'};
          save=proposal.save===true;
          if(save&&typeof proposal.saveOnlyRevision==='string'&&!Object.keys(parsed.data).length){
            // Save the validated current snapshot without adding an Undo entry.
            staged=graph;
            return {status:'applied',revision:proposal.saveOnlyRevision};
          }
          operations=assemblyPatchOperations(graph,parsed.data);
        }else{
          if(!bound.edit.trim()||bound.edit.length>12000)return {status:'invalid'};
          const [nodeId,fieldName]=bound.occurrenceId.split('.');
          operations=[change(nodeId,fieldName,bound.edit)];
        }
        const result=history(graph).apply(operations,graph.revision);
        if(!result.ok){operations=undefined;return {status:'invalid'};}
        staged=result.graph;
        return {status:'applied',revision:staged.revision};
      },
      recordReceipt:receipt=>{
        const item:JournalRecovery={channel:turn.channel,receipt,...(save&&staged?{graph:staged}:{})};
        const previous=readWorking(key);
        const working=previous?.savedRevision===turn.savedRevision?previous:{
          savedRevision:turn.savedRevision,actions:[],receipts:previous?.receipts??{},
        };
        // Persist the replayable journal action and receipt together. The
        // preflight and the live journal apply share a synchronous revision fence.
        writeWorking(key,{
          ...working,
          before:operations?journalBefore:working.before,
          actions:operations?[...journalActions,{operations}]:working.actions,
          receipts:{...working.receipts,[proposal.operationId]:item},
        });
        if(operations&&staged&&!commit(operations,false)){
          if(previous)writeWorking(key,previous);
          else sessionStorage.removeItem(key);
          throw new Error('The draft changed before the authoring edit could commit.');
        }
        turn.receipts.set(proposal.operationId,item);
        acknowledged=item;
      },
    });
    if(acknowledged){
      await sendDraftReceipt(key,acknowledged);
      if(draftTurn===turn)authoringError='';
      else await refreshDraftRun(acknowledged.receipt.turnId);
    }
  }
  async function refreshDraftRun(id:string){
    const definition=state.definition;
    const next=await request('',undefined,definition);
    const updated=next.runs.find(item=>item.id===id);
    if(!updated||state.definition!==definition)return;
    applyState({...state,runs:state.runs.map(item=>item.id===id?updated:item)});
    if(authoringResult?.run===id&&updated.draftReceipts?.length&&!updated.authoringActions){
      authoringResult={...authoringResult,...draftOutcome(updated.draftReceipts.at(-1).status)};
    }
  }
  function draftOutcome(status:string):{message:string;kind:'status'|'error'|'denied'}{
    switch(status){
      case 'applied': return {kind:'status',message:'Instructions updated. Save the draft to retain the new revision.'};
      case 'cancelled': return {kind:'status',message:'The draft edit was cancelled.'};
      case 'denied': return {kind:'denied',message:'The edit was outside the authorized draft scope.'};
      case 'stale': return {kind:'error',message:'The draft changed during the turn. Your current edits are intact.'};
      case 'invalid': return {kind:'error',message:'The draft edit failed validation.'};
      case 'operation-conflict': return {kind:'error',message:'The edit conflicts with a prior operation. Inspect the Run.'};
      default: return {kind:'error',message:'The edit could not be confirmed. Inspect the Run before retrying.'};
    }
  }
  function stopAuthoring(){
    const turn=draftTurn;
    if(!turn)return;
    turn.stop.abort();
    authoringStatus='Stopping…';
    // The journal fence is already latched even if the command is delayed.
    void request('/authoring-stop',{channel:turn.channel}).catch(()=>{});
  }
  async function sendAuthoring(){
    const activation=authoringActivations.find(item=>item.version===authoringActivation);
    const workspace=!!activation?.workspaceAuthoring;
    const occurrenceId=workspace?workspaceOccurrence:editableOccurrence();
    if(!activation||!occurrenceId||(!workspace&&!state.revision)||pending||sending||dockBusy)return;
    const input=authoringInput.trim();
    if(!input)return;
    const turn:DraftTurn={
      channel:crypto.randomUUID(),definition:state.definition,savedRevision:state.revision?.id??null,
      draftId:draftInstance,workspace,stop:new AbortController(),receipts:new Map(),
    };
    const target={channel:turn.channel,draftId:turn.draftId,occurrenceId,revision:graph.revision,
      savedRevision:turn.savedRevision,...(workspace?{mode:authoringMode,hasDraft:graph.nodes.length>0,graph}:{instructions:instructions(graph)})};
    draftTurn=turn; sending=true; authoringError='';authoringResult=null;
    authoringStatus='Opening authoring chat…';
    let pollTimer:ReturnType<typeof setTimeout>|undefined;
    try{
      const next=await request('/sessions',{activation:activation.version,sessionDefinition:activation.definition,authoringDock:workspace},turn.definition);
      turn.session=next.openedSession;
      applyState(next);
      if(turn.stop.signal.aborted)return;
      const poll=async()=>{
        try{
          const packet=await request('/authoring-poll',{channel:turn.channel});
          if(draftTurn!==turn)return;
          if(packet.active){
            turn.turnId=packet.turnId;
            if(turn.stop.signal.aborted&&!packet.stopped)await request('/authoring-stop',{channel:turn.channel});
            if(packet.stopped)turn.stop.abort();
            for(const proposal of packet.proposals)await acceptDraftProposal(turn,proposal,packet.actorId,packet.deadlineAt);
          }
        }catch(e){
          if(draftTurn===turn)authoringError=(e as Error).message;
        }
        if(draftTurn===turn)pollTimer=setTimeout(poll,150);
      };
      authoringStatus='Authoring turn running…';
      const payload={session:turn.session,input,draftTarget:target};
      const send=()=>request('/turn',payload,turn.definition);
      const pendingTurn=send().catch(error=>{
        if(workspace&&error instanceof TypeError)return send();
        throw error;
      });
      void poll();
      const result=await pendingTurn;
      if(state.definition===turn.definition){
        const changed=result.revision?.id!==state.revision?.id;
        applyState(result);
        if(workspace&&changed&&result.graph){
          baseline=authoringBytes(result.graph);
          updateWorkingAfterSave(dirty);
        }
      }
      const run=result.runs.find(item=>item.session===turn.session&&!item.parentRun);
      const status=run?.draftReceipts?.at(-1)?.status??run?.authoringOutcomes?.at(-1);
      const failure=run?.authoringActions?.find(item=>['denied','stale','invalid','cancelled','failed','unconfirmed','operation-conflict'].includes(item.result.status));
      const unsaved=run?.authoringActions?.find(item=>item.result.saveStatus&&item.result.saveStatus!=='saved');
      authoringResult={session:turn.session!,run:run?.id,
        ...(workspace?(failure?{message:failure.result.message??draftOutcome(failure.result.status).message,
          kind:failure.result.status==='denied'?'denied':'error'}:unsaved?{
            message:'The draft edit was applied. Save outcome: '+unsaved.result.saveStatus+'.',kind:'error',
          }:{message:run?.message??'',kind:run?.status==='failed'?'error':'status'}):
          status?draftOutcome(status):{message:run?.message??'The turn ended without a confirmed draft edit.'})};
      if(authoringInput.trim()===input)authoringInput='';
    }catch(e){authoringError=(e as Error).message;}
    finally{
      clearTimeout(pollTimer);
      draftTurn=null;
      sending=false;
      authoringStatus='';
    }
  }
  async function inspectAuthoringRun(run:{id:string;session:string}){
    changePage('Runs');
    inspectSessionScope=true;
    activeSession=run.session;
    runReturnSession=run.session;
    await openRun(run.id,true);
  }
  type LayerBranch={id:string;title:string;connection?:string;children:LayerBranch[]};
  const layerRoots=$derived.by(()=>{
    const branches=new Map<string,LayerBranch>();
    for(const node of graph.nodes){
      branches.set(node.id,{id:node.id,title:objectTitle(node.id),children:[]});
    }
    const childIds=new Set<string>();
    for(const edge of graph.edges){
      const child=branches.get(edge.source), parent=branches.get(edge.target);
      if(!child||!parent)continue;
      const target=graph.nodes.find(node=>node.id===edge.target);
      const input=graph.nodeTypes.find(type=>type.id===target?.type)?.ports.find(port=>port.id===edge.targetPort);
      child.connection='Connected to '+parent.title+' / '+(input?.label??edge.targetPort);
      parent.children.push(child);
      childIds.add(child.id);
    }
    const query=layerQuery.trim().toLowerCase();
    function filterBranch(branch:LayerBranch):LayerBranch|undefined{
      const children=branch.children.map(filterBranch).filter(child=>child!==undefined);
      if(children.length||branch.title.toLowerCase().includes(query))return {...branch,children};
    }
    return [...branches.values()].filter(branch=>!childIds.has(branch.id))
      .map(filterBranch).filter(branch=>branch!==undefined);
  });
  const agentLayer=$derived(layerRoots.find(branch=>branch.id==='agent'));
  const unconnectedLayers=$derived(layerRoots.filter(branch=>branch.id!=='agent'));
  function chooseLayer(id:string){
    if(!canvasIds.has(id)){
      selectCanvas(id);
      return;
    }
    mobileOpen=false;
    void focusCanvasNode(id);
  }
  function setLayerVisibility(id:string,visible:boolean){
    setBindingVisible(id,visible);
    if(visible)void focusCanvasNode(id,id===tokenSourceId?'model':'agent');
  }
  function setDesktopDock(panel:DockPanel,open:boolean){
    if(page==='Sessions'){
      if(panel==='Inspector'){
        sessionSidebar=open;
        if(!open)launchOpen=false;
      }
    }else if(page==='Runs'){
      if(panel==='Inspector')runSidebar=open;
    }else if(panel==='Authoring Agent')authoringDock=open;
    else if(panel==='Assembly / Selection')assemblyDock=open;
  }
  function dockOpen(panel:DockPanel){
    return mobile?mobileOpen&&sheet===panel:panel==='Authoring Agent'?authoringVisible:panel==='Assembly / Selection'?assemblyVisible:inspectorVisible;
  }
  function toggle(panel:DockPanel,invoker:HTMLElement|null=null){
    if(mobile){
      if(dockOpen(panel)){mobileOpen=false;return;}
      sheetInvoker=invoker??document.getElementById('window-menu-trigger');
      sheet=panel;
      mobileOpen=true;
    }else{
      const open=!dockOpen(panel);
      setDesktopDock(panel,open);
      if(!open&&panel==='Assembly / Selection')delegationInvoker=null;
    }
  }
  function showSelectedRow(node:HTMLElement,activeId:string){
    let frame=0;
    const reveal=(id:string)=>{
      cancelAnimationFrame(frame);
      if(!id||!node.closest('.execution-right-dock, .agent-layers-dock'))return;
      frame=requestAnimationFrame(()=>{
        node.querySelector('button[aria-pressed="true"]')?.scrollIntoView({block:'nearest',inline:'nearest'});
      });
    };
    reveal(activeId);
    return {update:reveal,destroy:()=>cancelAnimationFrame(frame)};
  }
  function resetLayout(){
    layoutWidth='Standard';
    if(page==='Sessions'){sessionSidebar=true;launchOpen=false;}
    else if(page==='Runs')runSidebar=true;
    else {authoringDock=false;assemblyDock=true;assemblyContext='assembly';}
  }
  async function persistKeyboardMove(){
    await tick();
    const positions=Object.fromEntries(nodes.filter(node=>{
      const previous=graph.nodes.find(n=>n.id===node.id)?.position;
      return previous && (previous.x!==node.position.x || previous.y!==node.position.y);
    }).map(node=>[node.id,node.position]));
    if(Object.keys(positions).length)commit([{type:'moveNodes',positions}]);
  }
  function keys(e:KeyboardEvent){
    if(page==='Sessions'&&launchOpen&&!mobile&&e.key==='Escape'&&!e.defaultPrevented){
      e.preventDefault();
      void closeSessionLauncher();
      return;
    }
    if(page!=='Agents')return;
    if(e.key==='Escape'&&!e.defaultPrevented&&!mobileOpen&&e.target instanceof Element&&e.target.closest('.agent-selection-content')){
      if(delegationInvoker){e.preventDefault();restoreDelegationFocus();}
      return;
    }
    if(agentView==='Canvas'&&!e.defaultPrevented&&!mobileOpen){
      const wire=e.target instanceof Element?e.target.closest('.svelte-flow__edge'):null;
      const focusedWire=wire?.getAttribute('data-id')??(e.target===document.body?selectedWire:'');
      if(focusedWire&&['Enter',' '].includes(e.key)&&wire?.classList.contains('delegation-wire')){
        e.preventDefault();void inspectDelegation(focusedWire);return;
      }
      if(focusedWire===selectedWire&&focusedWire&&(e.key==='Delete'||e.key==='Backspace')&&
        !e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey){
        e.preventDefault();
        disconnectWire(focusedWire);
        return;
      }
      if(e.key==='Escape'&&(wireSource||focusedWire||wireDrag)){
        if(wireDrag){wireDrag.cancelled=true;e.preventDefault();}
        else if(wireSource){cancelWire();e.preventDefault();}
        else if(!wire)flow?.updateEdge(focusedWire,{selected:false});
        return;
      }
    }
    if(e.key==='Escape'&&!e.repeat&&dirty&&!pending&&!mobileOpen&&!e.defaultPrevented&&
      !(e.target instanceof Element&&e.target.closest('[role="menu"],[role="dialog"],select'))){
      e.preventDefault();
      void reload();
      return;
    }
    if(e.key.startsWith('Arrow')&&(e.target as HTMLElement)?.matches?.('.svelte-flow__node'))void persistKeyboardMove();
    if(!(e.ctrlKey||e.metaKey))return;
    if(e.key.toLowerCase()==='s'){e.preventDefault();if(dirty&&!pending)void save();}
    if(e.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)){e.preventDefault();travel(e.shiftKey?'redo':'undo');}
  }
  function insertComponent(id:string){
    if(page!=='Agents'||!loaded||pending||sending||graph.nodes.some(node=>node.id===id))return;
    agentView='Canvas';
    create(id);
  }
  const canInsert=$derived(page==='Agents'&&loaded&&!pending&&!sending);
  const componentGroups=$derived([
    {label:'Agents',items:[
      {id:'agent',label:'Agent Definition',fn:()=>insertComponent('agent'),disabled:!canInsert||!!graph.nodes.length},
      {id:'child',label:'Child Agent',fn:()=>insertComponent('child'),disabled:!canInsert||!graph.nodes.length||graph.nodes.some(n=>n.id==='child')},
    ]},
    {label:'Resources',items:agentResources.filter(item=>['context','tool','authoring'].includes(item.id)).map(item=>({
      id:item.id,label:defaultNodeTitle(item.id),fn:()=>insertComponent(item.id),disabled:!canInsert||!graph.nodes.length||graph.nodes.some(n=>n.id===item.id),
    }))},
    {label:'Optional nodes',items:optionalBindings.map(item=>({
      id:item.id,label:item.label,fn:()=>insertComponent(item.id),
      disabled:!canInsert||!graph.nodes.length||graph.nodes.some(n=>n.id===item.id)||
        (item.id===tokenSourceId&&!graph.nodes.some(n=>n.id==='model')),
    }))},
  ]);
  const hiddenNodes=$derived(graph.nodes.filter(node=>isOptionalBinding(node.id)&&!canvasIds.has(node.id)));
  async function showAllHiddenNodes(){
    for(const node of hiddenNodes)setBindingVisible(node.id,true);
    if(agentView!=='Canvas')agentView='Canvas';
    await tick();
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    await fit();
  }
  const visibleComponentGroups=$derived(componentGroups.map(group=>({
    ...group,items:group.items.filter(item=>item.label.toLowerCase().includes(componentQuery.trim().toLowerCase())),
  })).filter(group=>group.items.length));
  const menu=$derived([
    {name:'File',items:[{label:'New agent',fn:newDefinition,disabled:page!=='Agents'||!loaded||dirty||pending||sending},{label:'Save draft',fn:save,disabled:page!=='Agents'||!dirty||pending||!!draftTurn||!loaded},{label:'Reopen saved draft',fn:reload,disabled:page!=='Agents'||dirty||pending||!state.revision}]},
    {name:'Edit',items:[{label:'Undo',fn:()=>travel('undo'),disabled:!canUndo},{label:'Redo',fn:()=>travel('redo'),disabled:!canRedo}]},
    {name:'View',items:[
      {label:'Fit canvas',fn:fit,disabled:page!=='Agents'||agentView!=='Canvas'||!graph.nodes.length},
      {label:'Show all hidden nodes',fn:showAllHiddenNodes,disabled:page!=='Agents'||!hiddenNodes.length},
    ]},
    {name:'Insert',items:componentGroups.flatMap(group=>group.items)},
    {name:'Run',items:[{label:'Activate saved revision',fn:activate,disabled:activateDisabled},{label:'Start Session',fn:showSessionLauncher,disabled:!loaded||pending||sending}]},
    {name:'Window',items:[...(executionPage?[{label:inspectorLabel,checked:dockOpen('Inspector'),fn:()=>toggle('Inspector')}]:page==='Agents'?[{label:'Authoring Agent',checked:dockOpen('Authoring Agent'),fn:()=>toggle('Authoring Agent')},{label:'Assembly / Selection',checked:dockOpen('Assembly / Selection'),fn:()=>toggle('Assembly / Selection')}]:[]),{label:layoutWidth==='Wide'?'Use standard panels':'Use wider panels',fn:()=>layoutWidth=layoutWidth==='Wide'?'Standard':'Wide',disabled:mobile||(page!=='Agents'&&!executionPage)},{label:'Reset layout',fn:resetLayout,disabled:mobile||(page!=='Agents'&&!executionPage)}]},
    {name:'Help',items:[{label:'V1a · Assembly, Sessions and Runs',fn:()=>{},disabled:true}]},
  ]);
</script>

<svelte:window onkeydown={keys}/>
{#snippet layerBranch(branch:LayerBranch)}
  {@const shown=canvasIds.has(branch.id)}
  {@const visibilityLabel=nodeVisibilityLabel(branch.title,shown,!!branch.connection)}
  <li data-layer-id={branch.id}>
    <div class="layer-entry">
      <ControlButton.Root class="vict-btn vict-btn--quiet layer-row" aria-pressed={selection===branch.id}
        aria-label={branch.title} aria-describedby={branch.connection?'layer-connection-'+branch.id:undefined}
        title={branch.connection?branch.title+' | '+branch.connection:branch.title} onclick={()=>chooseLayer(branch.id)}>
        <AssemblyGlyph kind={branch.id}/>
        <span class="layer-name">{branch.title}</span>
        {#if branch.connection}
          <span class="visually-hidden" id={'layer-connection-'+branch.id}>{branch.connection}</span>
        {/if}
      </ControlButton.Root>
      {#if isOptionalBinding(branch.id)}
        <Tooltip.Root>
          <Tooltip.Trigger class="vict-btn vict-btn--quiet layer-visibility" aria-label={visibilityLabel}
            onclick={()=>setLayerVisibility(branch.id,!shown)}>
            <AssemblyGlyph kind={shown?'separate-node':'inline-node'} connected={!!branch.connection}/>
          </Tooltip.Trigger>
          <Tooltip.Content class="layer-tooltip" side="left" sideOffset={5}>
            {shown?'Hide separate node':'Show separate node'}
          </Tooltip.Content>
        </Tooltip.Root>
      {/if}
    </div>
    {#if branch.children.length}
      <ul class="layer-children" role="list">
        {#each branch.children as child (child.id)}
          {@render layerBranch(child)}
        {/each}
      </ul>
    {/if}
  </li>
{/snippet}
{#snippet layersBody()}
  <Tooltip.Provider delayDuration={450} ignoreNonKeyboardFocus>
    <div class="layers-body">
      <div class="library-filter"><Input class="tori-field" aria-label="Search nodes" placeholder="Search nodes" bind:value={layerQuery}/></div>
      <div class="layers-list" use:showSelectedRow={selection}>
        {#if !layerRoots.length}
          <Feedback kind="empty" message={layerQuery.trim()?'No matching nodes.':'No nodes yet.'}/>
        {/if}
        {#if agentLayer}
          <ul class="layer-tree" role="list" aria-label="Agent bindings">
            {@render layerBranch(agentLayer)}
          </ul>
        {/if}
        {#if unconnectedLayers.length}
          <section class="layer-group" aria-label="Unconnected">
            <h3>Unconnected</h3>
            <ul class="layer-tree" role="list">
              {#each unconnectedLayers as branch (branch.id)}
                {@render layerBranch(branch)}
              {/each}
            </ul>
          </section>
        {/if}
      </div>
    </div>
  </Tooltip.Provider>
{/snippet}
{#snippet componentPalette()}
  <div class="library-filter">
    <Input class="tori-field" aria-label="Search components" placeholder="Search components" bind:value={componentQuery}/>
  </div>
  {#each visibleComponentGroups as group (group.label)}
    <div class="canvas-component-group" role="group" aria-label={group.label}>
      <p class="canvas-component-heading">{group.label}</p>
      {#each group.items as item (item.id)}
        <ControlButton.Root class="vict-btn vict-btn--quiet canvas-component-row"
          aria-label={'Add '+item.label} disabled={item.disabled} onclick={()=>{mobileOpen=false;item.fn();}}>
          <AssemblyGlyph kind={item.id}/><span>{item.label}</span>
        </ControlButton.Root>
      {/each}
    </div>
  {:else}
    <Feedback kind="empty" message="No matching components."/>
  {/each}
{/snippet}
{#snippet agentFields(id:string,section:'configure'|'delegation'='configure',location='')}
  <Fields {graph} {location} childRevisions={state.childRevisions} pinnedChild={state.activation?.childRevision} route={state.route} {id} {section} {edit} {disconnect}
    reveal={focusCanvasNode} openDefinition={async id=>{mobileOpen=false;await openDefinition(id);}} canOpenDefinition={!dirty&&!pending&&!sending}
    fixture={state.fixture} {configure} hostDeadlineMs={state.hostDeadlineMs}/>
{/snippet}

{#snippet dockToggle(panel:DockPanel,disabled=false)}
  {@const label=panel==='Inspector'?inspectorLabel:panel}
  <ControlButton.Root class="vict-btn vict-btn--secondary panel-shortcut" aria-label={label} title={label} {disabled}
    aria-expanded={!disabled&&dockOpen(panel)}
    onclick={event=>toggle(panel,event.currentTarget as HTMLElement)}>
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d={panel==='Authoring Agent'?'M9 5v14':'M15 5v14'}/>
    </svg>
  </ControlButton.Root>
{/snippet}

{#snippet sessionHistoryRows(group:{label:string;sessions:SessionHistoryItem[]})}
  {#each group.sessions as item (item.id)}
    {@const showAgentName=sessionGrouping==='date'||item.name!==group.label}
    <div class="session-history-row" class:current-session-row={item.id===activeSession}>
      <ControlButton.Root class="vict-btn vict-btn--secondary definition-row history-list-row" aria-pressed={item.id===activeSession} data-session-id={item.id}
        title={showSessionDescriptions?item.title+' · '+recordIdentity(item):item.title} onclick={()=>openSession(item.id)}>
        <span class="definition-copy">
          <span class="definition-name">{item.title}</span>
          {#if showSessionDescriptions}
            <span class="definition-note session-row-meta">
              {#if showAgentName}<span class="definition-name">{item.name}</span>{/if}
              <span class="session-row-revision">{showAgentName?'· ':''}r{item.number}{item.fixture?' · Fixture':''}</span>
            </span>
          {/if}
        </span>
      </ControlButton.Root>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger id={sessionActionId(item.id)} class="vict-btn vict-btn--quiet history-options session-row-actions"
          aria-label={'Actions for '+item.title} title={'Actions for '+item.title}>
          <span aria-hidden="true">⋮</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content class="menu-content history-options-menu" align="end" sideOffset={4} collisionPadding={10}>
            <DropdownMenu.Item class="menu-item" disabled={pending||sending} onSelect={()=>openRename(item)}>Rename Session</DropdownMenu.Item>
            <DropdownMenu.Item class="menu-item" disabled={pending||sending} onSelect={()=>openDelete(item)}>Delete Session</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  {/each}
{/snippet}

{#snippet historyOptions(label:string,choices:Snippet)}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger bind:ref={historyOptionsButton} class="vict-btn vict-btn--quiet panel-shortcut history-options"
      aria-label={label} title={label}>
      <span aria-hidden="true">⋮</span>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content class="menu-content history-options-menu" align="end" sideOffset={4} collisionPadding={10}
        aria-label={label}>
        {@render choices()}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
{/snippet}

{#snippet sessionHistoryChoices()}
  <DropdownMenu.RadioGroup value={sessionGrouping} onValueChange={value=>{sessionGrouping=value;sessionGroupChoice=undefined;}}>
    <DropdownMenu.GroupHeading>Group by</DropdownMenu.GroupHeading>
    {#each sessionGroupings as option (option.value)}
      <DropdownMenu.RadioItem class="menu-item panel-check" value={option.value} aria-label={option.label}>{option.label}</DropdownMenu.RadioItem>
    {/each}
  </DropdownMenu.RadioGroup>
  <DropdownMenu.Separator/>
  <DropdownMenu.RadioGroup bind:value={sessionFilter}>
    <DropdownMenu.GroupHeading>Show</DropdownMenu.GroupHeading>
    {#each sessionFilters as option (option.value)}
      <DropdownMenu.RadioItem class="menu-item panel-check" value={option.value} aria-label={option.label}>{option.label}</DropdownMenu.RadioItem>
    {/each}
  </DropdownMenu.RadioGroup>
  <DropdownMenu.Separator/>
  <DropdownMenu.CheckboxItem class="menu-item panel-check" aria-label="Show row descriptions" bind:checked={showSessionDescriptions}>
    Show row descriptions
  </DropdownMenu.CheckboxItem>
{/snippet}

{#snippet runHistoryChoices()}
  <DropdownMenu.RadioGroup value={runScope}>
    <DropdownMenu.GroupHeading>Scope</DropdownMenu.GroupHeading>
    <DropdownMenu.RadioItem class="menu-item panel-check" aria-label="This Session" value="session" onSelect={()=>setRunScope('session')}>This Session</DropdownMenu.RadioItem>
    <DropdownMenu.RadioItem class="menu-item panel-check" aria-label="All runs" value="all" onSelect={()=>setRunScope('all')}>All runs</DropdownMenu.RadioItem>
  </DropdownMenu.RadioGroup>
  <DropdownMenu.Separator/>
  <DropdownMenu.RadioGroup value={runGrouping} onValueChange={value=>{runGrouping=value;runGroupChoice=undefined;}}>
    <DropdownMenu.GroupHeading>Group by</DropdownMenu.GroupHeading>
    <DropdownMenu.RadioItem class="menu-item panel-check" aria-label="Session" value="session">Session</DropdownMenu.RadioItem>
    <DropdownMenu.RadioItem class="menu-item panel-check" aria-label="Activity date" value="date">Activity date</DropdownMenu.RadioItem>
  </DropdownMenu.RadioGroup>
  <DropdownMenu.Separator/>
  <DropdownMenu.CheckboxItem class="menu-item panel-check" aria-label="Show row descriptions" bind:checked={showRunDescriptions}>
    Show row descriptions
  </DropdownMenu.CheckboxItem>
{/snippet}

{#snippet executionHistory()}
  <div class="library-sections execution-history">
    {#if page==='Sessions'}
      {#if launchOpen?launchSearchOpen:sessionSearchOpen}
        <div class="library-filter">
          {#if launchOpen}
            <Input id="session-agent-search" class="tori-field" aria-label="Search agents" placeholder="Search agents" bind:value={launchQuery}/>
          {:else}
            <Input id="session-history-search" class="tori-field" aria-label="Search Sessions" placeholder="Search Sessions" bind:value={sessionQuery} oninput={()=>sessionGroupChoice=undefined}/>
          {/if}
        </div>
      {/if}
      <ControlButton.Root bind:ref={sessionLauncherButton} class="vict-btn vict-btn--quiet session-create-row"
        disabled={pending||(!launchOpen&&(!loaded||sending))} onclick={()=>launchOpen?closeSessionLauncher():showSessionLauncher()}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          {#if launchOpen}<path d="M19 12H5m7-7-7 7 7 7"/>
          {:else}<path d="M12 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6M10 14l1-4 7-7 3 3-7 7-4 1Z"/>{/if}
        </svg>
        {launchOpen?'Back':'New Session'}
      </ControlButton.Root>
      {#if launchOpen}
        {@render sessionPicker()}
      {:else}
        <div class="definition-list" class:history-group-list={sessionHistory.length>0} use:showSelectedRow={activeSession}>
          {#if !sessionHistory.length}
            <Feedback kind="empty" surfaceId="sessions-history" message={sessionQuery||sessionFilter!=='all'?'No matching Sessions.':'No Sessions yet.'}/>
          {:else}
            <Accordion.Root type="single" aria-label="Session history groups" value={openSessionHistoryGroup}
              onValueChange={key=>sessionGroupChoice=key}>
              {#each sessionHistory as group (group.key)}
                <Accordion.Item value={group.key}>
                  <Accordion.Header><Accordion.Trigger aria-label={group.label} title={group.fullDate??group.label}>
                    <span class="definition-name">{group.label}</span>
                  </Accordion.Trigger></Accordion.Header>
                  <Accordion.Content>{@render sessionHistoryRows(group)}</Accordion.Content>
                </Accordion.Item>
              {/each}
            </Accordion.Root>
          {/if}
        </div>
      {/if}
    {:else}
      {#if runScope==='session'}
        <p class="run-history-scope">
          This Session{runGrouping==='date'?' · '+(session?.title??'Session unavailable'):''}
        </p>
      {/if}
      {#if runSearchOpen}
        <div class="library-filter">
          <Input id="run-history-search" class="tori-field" aria-label="Search Runs" placeholder="Search Runs"
            bind:value={runQuery} oninput={()=>runGroupChoice=undefined}/>
        </div>
      {/if}
      <div class="definition-list" class:history-group-list={runHistory.length>0} use:showSelectedRow={activeRun}>
        {#if runHistory.length}
          <Accordion.Root type="single" aria-label="Run history groups" value={openRunHistoryGroup}
            onValueChange={key=>runGroupChoice=key}>
            {#each runHistory as group (group.key)}
              <Accordion.Item value={group.key}>
                <Accordion.Header><Accordion.Trigger aria-label={group.label} aria-description={group.runs.length+' '+(group.runs.length===1?'Run':'Runs')} title={group.title}>
                  <span class="definition-name">{group.label}</span>
                  <span class="run-group-count definition-note" aria-hidden="true">{group.runs.length}</span>
                </Accordion.Trigger></Accordion.Header>
                <Accordion.Content style={'--run-sequence-digits:'+group.sequenceDigits}>
                  {#each group.runs as item (item.id)}
                    <ControlButton.Root class="vict-btn vict-btn--secondary definition-row history-list-row run-history-row"
                      aria-pressed={item.id===activeRun} data-run-id={item.id} title={historyDate(runActivity(item))}
                      onclick={()=>openRun(item.id,mobile)}>
                      <span class="run-row-numbered">
                        <span class="run-row-number"><span class="visually-hidden">Run </span>{item.sequence}</span>
                        <span class="definition-copy">
                          <span class="run-row-overview">
                            {#if item.messagePreview||item.parentRun}
                              <span class="definition-name">{item.messagePreview??('Child Run · '+item.name)}</span>
                            {:else}
                              <time class="definition-name" datetime={runActivity(item)}>{runHistoryTime(item)}</time>
                            {/if}
                            {#if !item.awaitingObservation}
                              <StatusBadge value={runStatus(item.status)} tone={item.state==='Uncertain'?'danger':'neutral'}/>
                            {/if}
                          </span>
                          {#if showRunDescriptions}
                            <span class="definition-note">
                              {#if item.messagePreview||item.parentRun}<time datetime={runActivity(item)}>{runHistoryTime(item)}</time> · {/if}
                              {recordIdentity(item)}{item.fixture?' · '+recordMode(item):''}
                            </span>
                          {/if}
                        </span>
                      </span>
                    </ControlButton.Root>
                  {/each}
                </Accordion.Content>
              </Accordion.Item>
            {/each}
          </Accordion.Root>
        {:else}
          <Feedback kind="empty" surfaceId="runs-history" message={runQuery.trim()?'No matching Runs.':'No Runs in this history yet.'}/>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet sidebarDetails(label:string,content:Snippet)}
  <Accordion.Root class="execution-sidebar-details library-sections" type="single" aria-label={label}>
    <Accordion.Item value="details">
      <Accordion.Header><Accordion.Trigger aria-label="Details">Details</Accordion.Trigger></Accordion.Header>
      <Accordion.Content class="execution-details-scroll" role="region" aria-label={label+' content'} tabindex={0}>
        {@render content()}
      </Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
{/snippet}

{#snippet openViewIcon()}
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 5h6v6m0-6-8 8m-2-7H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/>
  </svg>
{/snippet}

{#snippet sessionDetails()}
  <div class="session-details">
    {#if sessionRuns.length}
      <ControlButton.Root class="vict-btn vict-btn--quiet session-inspect-runs" onclick={()=>inspectSessionRuns()}>
        {@render openViewIcon()} Inspect runs
      </ControlButton.Root>
    {/if}
    <dl>
      <dt>Agent revision</dt><dd>{recordIdentity(session)}</dd>
      <dt>Last activity</dt><dd><time datetime={session.lastActivityAt}>{activityDate(session.lastActivityAt)}</time></dd>
      <dt>Execution</dt><dd>{recordMode(session)}</dd>
      <dt>Model route</dt><dd>{session.fixture?'Simulated ':''}Z.AI {session.route==='coding'?'Coding':'General'} · {modelName}</dd>
      {#if session.context}<dt>Pinned context</dt><dd>{session.context}</dd>{/if}
      {#if session.memory}<dt>Session history</dt><dd>{session.memory==='recent-10@1'?'Last 10 messages':'Last 100 messages'} · this Session</dd>{/if}
      <dt>Thinking</dt><dd>Thinking details are unavailable through this connection.</dd>
    </dl>
    {#if !session.authoring&&!session.archivedFixture}
      {#key session.id}
        <MemoryControls view={memoryView} mode="list" sessionId={session.id} act={changeMemory} busyTurn={sending}/>
      {/key}
    {/if}
  </div>
{/snippet}

{#snippet runDetails()}
  <RunDetails {run} loadMemory={(id:string)=>request('/memory/run',{run:id})}
    checkMemory={(binding:any)=>request('/memory/check',binding)} inspectRun={async(id:string)=>{
    setRunScope('all');
    runReturnSession='';
    await openRun(id,true);
  }}/>
{/snippet}

{#snippet historyHeaderActions(searchLabel:string,searchOpen:boolean,toggleSearch:()=>void,optionsLabel:string,choices:Snippet)}
  <div class="history-header-actions">
    <ControlButton.Root class="vict-btn vict-btn--quiet history-search-button" aria-label={searchLabel} title={searchLabel}
      aria-expanded={searchOpen} onclick={toggleSearch}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>
      </svg>
    </ControlButton.Root>
    {@render historyOptions(optionsLabel,choices)}
  </div>
{/snippet}

{#snippet executionHeaderActions()}
  {#if page==='Sessions'}
    {@render historyHeaderActions(launchOpen?'Search agents':'Search Sessions',launchOpen?launchSearchOpen:sessionSearchOpen,
      toggleSessionSearch,'Session history options',sessionHistoryChoices)}
  {:else}
    {@render historyHeaderActions('Search Runs',runSearchOpen,toggleRunSearch,'Run history options',runHistoryChoices)}
  {/if}
{/snippet}

{#snippet sessionPicker()}
  <section id="new-session-picker" class="session-picker" aria-labelledby="new-session-picker-title">
    <div class="session-picker-heading">
      <h3 id="new-session-picker-title" tabindex="-1">Choose an agent</h3>
    </div>
    {@render sessionAgentChoices()}
  </section>
{/snippet}

{#snippet executionSidebarBody()}
  {@render executionHistory()}
  {#if page==='Sessions'&&session}
    {@render sidebarDetails('Session details',sessionDetails)}
  {:else if page==='Runs'&&run}
    {@render sidebarDetails('Run details',runDetails)}
  {/if}
{/snippet}

{#snippet sessionAgentChoices()}
  <div class="session-agent-list library-sections definition-list history-group-list" aria-label="Agents for a new Session">
    {#if launchError}<Feedback kind="error" message={launchError}/>{/if}
    <Accordion.Root type="single" aria-label="Agent revisions">
      {#each matchingActiveAgents as agent (agent.definition)}
        <Accordion.Item value={agent.definition}>
          <Accordion.Header><Accordion.Trigger aria-label={agent.name} data-agent-revisions={agent.definition}>
            <span class="definition-name">{agent.name}</span>
          </Accordion.Trigger></Accordion.Header>
          <Accordion.Content>
            {#each agent.revisions as revision (revision.version)}
              {@const routeLabel=revision.route==='coding'?'Coding':'General'}
              {@const showRoute=agent.revisions.filter(item=>item.number===revision.number).length>1}
              <ControlButton.Root class="vict-btn vict-btn--quiet definition-row history-list-row" data-start-agent={agent.definition}
                aria-label={'Start Session with '+revision.name+' · r'+revision.number+(showRoute?' · '+routeLabel:'')+(state.fixture?' · Fixture':'')}
                title={revision.name+' · r'+revision.number+' · '+routeLabel} disabled={pending||sending} onclick={()=>start(revision)}>
                <span class="definition-name">r{revision.number}{showRoute?' · '+routeLabel:''}</span>
                {#if revision.version===agent.version||state.fixture}
                  <span class="definition-note">{revision.version===agent.version?'Active':''}{revision.version===agent.version&&state.fixture?' · ':''}{state.fixture?'Fixture':''}</span>
                {/if}
              </ControlButton.Root>
            {/each}
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
    {#each matchingInactiveAgents as agent (agent.id)}
      {@const switchingBlocked=dirty&&state.definition!==agent.id}
      <ControlButton.Root class="vict-btn vict-btn--quiet definition-row history-list-row session-inactive-agent"
        aria-label={'Open '+agent.name+' in Agents to activate revision '+agent.savedRevision}
        title={switchingBlocked?'Save or discard the current agent draft before switching.':'Open in Agents'}
        disabled={pending||sending||switchingBlocked} onclick={()=>openAgentForActivation(agent.id)}>
        <span class="definition-copy">
          <span class="definition-name">{agent.name}</span>
          <span class="definition-note">r{agent.savedRevision} · Needs activation</span>
        </span>
      </ControlButton.Root>
    {/each}
    {#if !matchingActiveAgents.length&&!matchingInactiveAgents.length}
      <Feedback kind="empty" surfaceId="session-agent-picker" message={launchQuery?'No matching agents.':'Save and activate an agent to start a Session.'}/>
    {/if}
  </div>
{/snippet}

{#snippet readOnlyTurn()}{/snippet}

{#snippet sessionComposer()}
  {#if session?.authoring}
    <Feedback message="To start a draft edit, use the Authoring Agent dock on Agents."/>
  {:else}
  {#if session.archivedFixture}
    <div class="session-readonly"><Feedback message="Fixture history · read only"/></div>
  {:else if session.interrupted}
    <div class="session-readonly">
      <Feedback kind="error" message={interruptedRun?.message??'This Session was interrupted. Start a new Session to continue.'}/>
      <div class="session-recovery-actions">
        {#if interruptedRun}
          <Button label="Inspect Run" variant="secondary" onclick={()=>inspectSessionRuns(interruptedRun.id)}/>
        {/if}
        <Button label="Start a new Session" variant="secondary" onclick={showSessionLauncher}/>
      </div>
    </div>
  {:else if !session.connectionReady}
    <div class="session-readonly"><Feedback kind="error" message="Connect a credential for this Session’s pinned route to send a message."/></div>
  {:else}
    <div class="session-composer">
      {#if turnErrors[session.id]}<Feedback kind="error" message={turnErrors[session.id]}/>{/if}
      {#if runActionError&&stoppingRun===''&&liveSessionRun}<Feedback kind="error" message={runActionError}/>{/if}
      {#if currentSessionRun?.awaitingObservation}
        <Feedback message={observation?.disconnected?'Connection lost. Checking the accepted Run.':'Checking the accepted Run…'}/>
      {/if}
      {#if pendingStart?.session===session.id}
        <Feedback message={startNotFound?'No Run has been found yet. Sending again uses the same request.':'Checking whether Studio accepted the Run…'}/>
      {/if}
      {#if liveSessionRun}
        <div class="run-links">
          <Button label="Inspect Run" variant="secondary" onclick={()=>inspectSessionRuns(liveSessionRun.id)}/>
          {#if liveSessionRun.background}<span class="muted">You can close this tab while Studio stays open.</span>{/if}
        </div>
        {#if observation?.run===liveSessionRun.id&&observation.disconnected}
          <Feedback message="Connection lost. Waiting to read the Run’s current state."/>
        {/if}
      {/if}
      <Patterns.PromptInput bind:value={()=>sessionDrafts[session.id]??'',value=>sessionDrafts[session.id]=value} busy={sessionBusy}
        onSend={!sending&&!pending&&!sessionBusy?send:undefined}
        onStop={!stoppingSession&&!stoppingRun&&((sendActivity?.session===session.id&&sendActivity?.canStop)||
          (liveSessionRun&&observation?.run===liveSessionRun.id&&observation.canStop))?stopSessionTurn:undefined}>
        {#snippet footer()}
          {@const revision=session.number??session.revision}
          <Badge variant="secondary" class="session-agent-chip" title={revision==null?session.name:recordIdentity(session)}>
            <span class="visually-hidden">Pinned agent </span>
            <span class="session-agent-name">{session.name}</span>
            {#if revision!=null}<span class="session-agent-revision">· r{revision}</span>{/if}
          </Badge>
          {#if session.context}
            <Toggle.Root type="button" class="session-context-toggle"
              bind:pressed={()=>!!sessionContext[session.id],pressed=>sessionContext[session.id]=pressed}
              disabled={sessionBusy} aria-label="Include pinned context on next turn"
              title={'Include pinned context on next turn · '+session.context}>Include context</Toggle.Root>
          {/if}
          {#if !session.authoring}
            <Toggle.Root type="button" class="session-context-toggle" disabled={sessionBusy||sending||pendingStart?.session===session.id}
              bind:pressed={()=>!!backgroundChoice[session.id],pressed=>backgroundChoice[session.id]=pressed}
              aria-label="Run in background">Run in background</Toggle.Root>
          {/if}
          {#if sessionBusy&&!currentSessionRun?.awaitingObservation&&!awaitingStart}
            <span class="session-turn-state"><StatusBadge value="Running"/></span>
          {/if}
        {/snippet}
      </Patterns.PromptInput>
    </div>
  {/if}
  {/if}
{/snippet}

<ControlScope class="tori-scope vict-app">
  <div class="studio" class:wide={layoutWidth==='Wide'}>
    <header class="shell">
      <div class="menuline"><span class="brand" role="img" aria-label="TORI Studio" title="TORI Studio">T</span>
      <Menubar.Root class="app-menu">
        {#each menu as family}
          <Menubar.Menu><Menubar.Trigger class="menu-trigger" id={family.name==='Window'?'window-menu-trigger':undefined}>{family.name}</Menubar.Trigger>
          <Menubar.Portal><Menubar.Content class="menu-content" align="start">
            {#each family.items as item}
              {#if 'checked' in item && item.checked!==undefined}
                <Menubar.CheckboxItem class="menu-item panel-check" checked={item.checked} disabled={item.disabled} onSelect={item.fn}>
                  {item.label}
                </Menubar.CheckboxItem>
              {:else}
                <Menubar.Item class="menu-item" disabled={item.disabled} onSelect={item.fn}>{item.label}</Menubar.Item>
              {/if}
            {/each}
          </Menubar.Content></Menubar.Portal></Menubar.Menu>
        {/each}
      </Menubar.Root><span class="local">LOCAL STUDIO</span></div>
    </header>
    {#if error}<div class="banner"><Feedback kind="error" message={error}/></div>{/if}
    {#if page==='Agents'}
      <div class="agent-workspace" class:has-agent-dock={!mobile&&authoringVisible} class:has-inspector-dock={!mobile&&assemblyVisible}>
        {#if !mobile&&authoringVisible}
          <aside class="agent-left-dock" aria-label="Authoring Agent">
            <div class="library-tabbar"><h2>Authoring Agent</h2>{@render authoringOptions()}</div>
            {@render authoringBody()}
          </aside>
        {/if}
        <div class="agent-detail">
      <div class="agent-dockbar">
        <div class="agent-dock-actions">{@render dockToggle('Authoring Agent')}</div>
      <div class="agent-views" role="group" aria-label="Agent view">
        {#each ['Settings','Canvas'] as viewName}
          <ControlButton.Root class="vict-btn vict-btn--secondary" aria-pressed={agentView===viewName}
            onclick={()=>{if(agentView===viewName)return;cancelWire();if(wireDrag)wireDrag.cancelled=true;agentView=viewName==='Canvas'?'Canvas':'Settings';}}>{viewName==='Settings'?'Configure':'Canvas'}</ControlButton.Root>
        {/each}
      </div>
        <div class="agent-dock-actions right">{@render dockToggle('Assembly / Selection')}</div>
      </div>
      {#if !graph.nodes.length}
        <main class="agent-empty" aria-labelledby="agent-empty-title">
          <div class="agent-empty-content">
            <h1 id="agent-empty-title">No agent yet</h1>
            <p>Add an agent, then give it instructions and a model.</p>
            <Button label="Add Agent" variant="secondary" disabled={!loaded} onclick={()=>create('agent')}/>
            {#if graphError}<Feedback kind="error" message={graphError}/>{/if}
          </div>
        </main>
      {:else if agentView==='Settings'}
        {@const current=graph.nodes.some(node=>node.id===selection)?selection:'agent'}
        {#if selection&&selection!=='agent'&&graph.nodes.some(node=>node.id===selection)}
          <div class="configure-detail-nav">
                <ControlButton.Root class="vict-btn vict-btn--quiet configure-back" aria-label="Back to agent"
                  onclick={()=>selection='agent'}>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path d="m11 5-7 7 7 7M4 12h16"/>
                  </svg>
                  Back
                </ControlButton.Root>
          </div>
        {/if}
        <main class="agent-settings" aria-label="Configure agent">
          <div class="agent-settings-content">
            {#if current!=='agent'}
              <header class="configure-detail-heading">
                <h1 class="configure-heading">{objectTitle(current)}</h1>
                {#if current==='context'}<p>Choose the source revision this agent can load on demand.</p>{/if}
              </header>
            {/if}
            {#if current!=='agent'}
              <section class="configure-group configure-detail-panel" aria-label={objectTitle(current)+' settings'}>
                {@render agentFields(current)}
              </section>
            {:else}
              {@render agentFields(current)}
            {/if}
            {#if graphError}<Feedback kind="error" message={graphError}/>{/if}
          </div>
        </main>
      {:else}
      <main class="assembly">
        <section class="stage" aria-label="Agent assembly canvas">
          <div class="flow" ondblclickcapture={inspectDelegationWire}>
            <div class="canvas-view-menu">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger class="vict-btn vict-btn--secondary" aria-label="Canvas view">
                  {Math.round(view.zoom*100)}% <span aria-hidden="true">⌃</span>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="menu-content" align="end" side="top" sideOffset={4}>
                    <DropdownMenu.Item class="menu-item" disabled={view.zoom>=1.7} onSelect={()=>flow?.zoomIn()}>Zoom in</DropdownMenu.Item>
                    <DropdownMenu.Item class="menu-item" disabled={view.zoom<=0.2} onSelect={()=>flow?.zoomOut()}>Zoom out</DropdownMenu.Item>
                    <DropdownMenu.Item class="menu-item" onSelect={()=>flow?.setZoom(1)}>Actual size</DropdownMenu.Item>
                    <DropdownMenu.Item class="menu-item" onSelect={fit}>Fit to view</DropdownMenu.Item>
                    {#if !graph.nodes.some(n=>n.id==='model')}
                      <DropdownMenu.Separator/>
                      <DropdownMenu.Item class="menu-item" onSelect={()=>create('model')}>Add model</DropdownMenu.Item>
                    {/if}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
            <SvelteFlowProvider>
              {@render canvas()}
            </SvelteFlowProvider>
          </div>
          {#if graphError}
            <div class="canvas-status"><Feedback kind="error" message={graphError}/></div>
          {/if}
        </section>
      </main>
      {/if}
        {#if loaded&&graph.nodes.length}
          <footer class="agent-editor-footer" aria-label="Agent revision and actions">
            <div id="agent-revision-status" class="agent-revision-status" tabindex="-1">
              <Feedback message={agentRevisionStatus}/>
              {#if ready}<Feedback message={ready}/>{/if}
            </div>
            <div class="agent-revision-actions">
              {#if dirty}
                <Button label="Discard" variant="secondary" disabled={pending} onclick={async()=>{await reload();if(!dirty)await focusAgentRevision();}}/>
                <Button label="Save" disabled={pending||!!draftTurn} onclick={async()=>{await save();if(!dirty)await focusAgentRevision();}}/>
              {:else if activationMatchesSaved}
                <Button label="Start Session" disabled={pending||sending} onclick={()=>start(state.activation,true)}/>
              {:else if state.revision}
                <Button label={'Activate r'+state.revision.number} disabled={activateDisabled}
                  onclick={async()=>{await activate();if(activationMatchesSaved)await focusAgentRevision();}}/>
              {/if}
            </div>
          </footer>
        {/if}
        </div>
        {#if !mobile&&assemblyVisible}
          <aside class="inspector agent-layers-dock" aria-label="Assembly / Selection">
            {@render assemblyBody('sidebar')}
          </aside>
        {/if}
      </div>
    {:else if executionPage}
      <div class="agent-workspace execution-workspace" class:has-inspector-dock={!mobile&&inspectorVisible}>
        <div class="agent-detail">
          <div class="agent-dockbar execution-toolbar">
            {#if page==='Sessions'}
              <div class="execution-identity">
                <h1 bind:this={sessionTitle} tabindex="-1"
                  aria-describedby={session?'selected-session-identity':undefined}>Sessions</h1>
                {#if session}
                  <span id="selected-session-identity" class="visually-hidden">{session.title} · {recordIdentity(session)}{session.fixture?' · '+recordMode(session):''}</span>
                {/if}
              </div>
            {:else}
              {#if runReturnTarget}
                <ControlButton.Root class="vict-btn vict-btn--quiet panel-shortcut" aria-label="Back to Session" title="Back to Session"
                  onclick={()=>openSession(runReturnTarget.id,true)}>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5m7-7-7 7 7 7"/>
                  </svg>
                </ControlButton.Root>
              {/if}
              <div class="execution-identity"><strong>Runs</strong></div>
            {/if}
            <div class="execution-actions">{@render dockToggle('Inspector')}</div>
          </div>
          {#if page==='Sessions'}
            <main class="session-view" aria-label="Conversation">
              {#if session}
                {#key session.id}
                  <div class="conversation" bind:this={conversationPane} use:rememberReadingPosition={session.id}>
                    {#if session.authoring || session.archivedFixture}
                      <Conversation messages={session.messages} busy={sessionBusy}
                        composer={sessionComposer} emptyMessage="Start a conversation."/>
                    {:else}
                      <SessionConversation messages={session.messages} busy={sessionBusy}
                        turns={memoryView?.turns??[]} composer={sessionComposer}>
                        {#snippet attachment(turn)}
                          <MemoryControls view={memoryView} mode="card" sessionId={session.id} {turn} act={changeMemory} busyTurn={sending||sessionBusy}/>
                        {/snippet}
                      </SessionConversation>
                    {/if}
                  </div>
                {/key}
              {:else}
                <div class="empty"><h1>No conversation yet</h1><p>Use New Session in the right sidebar to choose an active agent.</p></div>
              {/if}
            </main>
          {:else}
            <main class="runs-view" aria-label="Run outcome and timeline" bind:this={runPane}>
              {#if run}
                {@const parent=run.parentRun?state.runs.find(item=>item.id===run.parentRun):undefined}
                {@const children=state.runs.filter(child=>child.parentRun===run.id)}
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
                    <div class="run-section-heading"><h2>Timeline</h2></div>
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
                  </section>
                </div>
              {:else}
                <div class="empty">
                  {#if runActionError}<Feedback kind="error" message={runActionError}/>
                  {:else}<h1>No Runs yet</h1><p>{runScope==='session'&&session?'This Session has no recorded Runs yet.':'Recorded turns will appear here.'}</p>{/if}
                </div>
              {/if}
            </main>
          {/if}
        </div>
        {#if !mobile&&inspectorVisible}
          <aside class="inspector execution-right-dock" aria-label={page==='Sessions'?'Session history':'Run history'}>
            <div class="library-tabbar">
              <h2>{page}</h2>
              {@render executionHeaderActions()}
            </div>
            {@render executionSidebarBody()}
          </aside>
        {/if}
      </div>
    {/if}
    <nav class="tasks" aria-label="Studio tasks">
      {#each pages as item}
        <ControlButton.Root class={'vict-btn vict-btn--secondary '+(page===item?'current-task':'')} aria-current={page===item?'page':undefined} disabled={['Workflows','Creative'].includes(item)} onclick={()=>item==='Runs'?openRuns():changePage(item)}>{item}</ControlButton.Root>
      {/each}
    </nav>
  </div>
  <Dialog.Root open={!!renameTarget} onOpenChange={open=>{if(!open&&!pending)renameTarget='';}}>
    <Dialog.Portal><Dialog.Overlay class="sheet-shade studio-dialog-shade"/><Dialog.Content class="mobile-sheet studio-dialog"
      onCloseAutoFocus={restoreSessionActionFocus}>
      <Dialog.Title>Rename Session</Dialog.Title>
      <Dialog.Description class="visually-hidden">Give this conversation a title.</Dialog.Description>
      <form class="session-rename-form" onsubmit={renameSession}>
        <label for="session-title-input">Session title</label>
        <Input id="session-title-input" class="tori-field" bind:value={renameTitle} maxlength={80} disabled={pending}/>
        {#if renameError}<Feedback kind="error" message={renameError}/>{/if}
        <div class="launch-actions">
          <Dialog.Close class="vict-btn vict-btn--quiet" type="button" disabled={pending}>Cancel</Dialog.Close>
          <Button label="Save title" type="submit" variant="secondary" disabled={pending||!renameTitle.trim()}/>
        </div>
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>
  <Dialog.Root open={!!deleteTarget} onOpenChange={open=>{if(!open&&!pending)deleteTarget=null;}}>
    <Dialog.Portal><Dialog.Overlay class="sheet-shade studio-dialog-shade"/><Dialog.Content class="mobile-sheet studio-dialog"
      onCloseAutoFocus={restoreSessionActionFocus}>
    <Dialog.Title>Delete this Session?</Dialog.Title>
    <Dialog.Description>“{deleteTarget?.title}” and its conversation memory will be deleted. Run receipts are retained.</Dialog.Description>
    {#if deleteError}<Feedback kind="error" message={deleteError}/>{/if}
    <div class="launch-actions">
      <Dialog.Close class="vict-btn vict-btn--quiet" disabled={pending}>Cancel</Dialog.Close>
      <Button label="Confirm delete Session" variant="danger" disabled={pending} onclick={deleteSession}/>
    </div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>
  <Dialog.Root bind:open={mobileOpen} onOpenChange={open=>{if(!open&&page==='Sessions')launchOpen=false;}}><Dialog.Portal><Dialog.Overlay class="sheet-shade"/><Dialog.Content class={'mobile-sheet'+(executionPage?' execution-sidebar-sheet':'')}
    onEscapeKeydown={event=>{if(page==='Sessions'&&launchOpen){event.preventDefault();void closeSessionLauncher();}}}
    onCloseAutoFocus={(event)=>{if(sheetInvoker?.isConnected){event.preventDefault();sheetInvoker.focus({preventScroll:true});}
    else if(executionPage)event.preventDefault();}}>
    <div class="sheet-top">
      <Dialog.Title class={executionPage?'execution-sidebar-title':undefined}>{executionPage?page:sheet}</Dialog.Title>
      <div class="sheet-top-actions">
        {#if executionPage}{@render executionHeaderActions()}{/if}
        {#if !executionPage&&sheet==='Authoring Agent'}{@render authoringOptions()}{/if}
        <Dialog.Close class="menu-trigger">Close</Dialog.Close>
      </div>
    </div>
    <Dialog.Description class="visually-hidden">{executionPage?'Browse or inspect the current workspace.':sheet==='Authoring Agent'?'Authoring for the current draft.':'Browse or inspect the current agent.'}</Dialog.Description>
    {#if executionPage}
      {@render executionSidebarBody()}
    {:else if sheet==='Assembly / Selection'}
      {@render assemblyBody('sheet')}
    {:else if sheet==='Authoring Agent'}
      {@render authoringBody()}
    {/if}
  </Dialog.Content></Dialog.Portal></Dialog.Root>
</ControlScope>

{#snippet canvas()}
  <SvelteFlow bind:nodes {edges} nodeTypes={types} {edgeTypes} bind:viewport={view}
    oninit={()=>{
      if(canvasInitialized)return;
      canvasInitialized=true;
      if(mobile&&selection)void focusCanvasNode(selection);
      else if(view.x===0&&view.y===0)void fit();
    }}
    onnodeclick={({node})=>selectCanvas(node.id)}
    onedgeclick={({edge})=>void tick().then(()=>{
      if(!mobileOpen)canvasWire(edge.id)?.focus({preventScroll:true});
    })}
    onpaneclick={()=>{selection='';selectedWire='';cancelWire();}}
    onselectionchange={({nodes:selected,edges:selectedWires})=>{
      if(selectedWires.length){selectedWire=selectedWires[0].id;selection='';}
      else if(selected.length)selectCanvas(selected[0].id);
    }}
    {isValidConnection} onbeforeconnect={onConnection}
    onconnectstart={event=>{
      if(wireDrag?.event!==event)wireDrag=undefined;
      graphError='';cancelWire();
    }}
    onconnectend={(_event,connection)=>{
      if(connection.toHandle&&!connection.isValid&&!wireDrag?.cancelled){
        graphError=wireDrag?'Drop on a compatible port with room for the wire.':'Use a matching, unconnected input.';
      }
    }}
    onreconnectstart={(event,edge)=>{wireDrag={id:edge.id,graph,event,cancelled:false};}}
    onbeforereconnect={reconnectWire}
    onreconnectend={(event,edge,_end,connection)=>finishWireDrag(event,edge.id,!!connection.toHandle)}
    clickConnect onclickconnectstart={(_event,handle)=>{wireDrag=undefined;graphError='';wireSource=handle.nodeId??'';}}
    onclickconnectend={()=>wireSource=''}
    onnodedragstop={({nodes:moved})=>commit([{type:'moveNodes',positions:Object.fromEntries(moved.map(n=>[n.id,n.position]))}])}
    nodesDraggable={!mobile} multiSelectionKey={null} deleteKey={null} minZoom={0.2} maxZoom={1.7} proOptions={{hideAttribution:true}}>
    <FlowAccess onready={(instance,cancelClick)=>{flow=instance;cancelFlowClick=cancelClick;}}/>
    <Background color="var(--canvas-grid)" gap={24} size={1}/>
  </SvelteFlow>
{/snippet}


{#snippet definitionList(location:string)}
  <div class="library-filter">
    <label for={'agent-search-'+location} class="visually-hidden">Search agents</label>
    <Input id={'agent-search-'+location} class="tori-field" placeholder="Search agents" bind:value={agentSearch}/>
  </div>
  <div class="definition-list">
    {#each assemblyDefinitions.filter(item=>item.name.toLowerCase().includes(agentSearch.trim().toLowerCase())) as item (item.id)}
      <ControlButton.Root class="vict-btn vict-btn--secondary definition-row" aria-pressed={state.definition===item.id}
        disabled={state.definition!==item.id&&(dirty||pending||sending)}
        onclick={async()=>{if(state.definition!==item.id)await openDefinition(item.id);if(!error)mobileOpen=false;}}>
        <span class="definition-copy">
          <span class="definition-name">{item.name}</span>
          {#if state.definition===item.id&&dirty}<span class="definition-note">Unsaved changes</span>
          {:else if item.savedRevision!==undefined&&!activeDefinitionIds.has(item.id)}
            <span class="definition-note">Needs activation</span>
          {/if}
        </span>
      </ControlButton.Root>
    {:else}
      <Feedback kind="empty" surfaceId="assembly-agents" message="No matching agents."/>
    {/each}
  </div>
  <div class="library-create">
    <Button label="New agent" variant="secondary" disabled={!loaded||dirty||pending||sending}
      onclick={async()=>{await newDefinition();if(!error)mobileOpen=false;}}/>
  </div>
  {#if dirty}<p class="muted">Save or discard changes before switching agents.</p>{/if}
{/snippet}

{#snippet assemblySectionsBody(location:string)}
  <Accordion.Root class="library-sections" type="multiple" bind:value={assemblySections} aria-label="Assembly sections">
    <Accordion.Item value="agents">
      <Accordion.Header><Accordion.Trigger aria-label="Agents">Agents</Accordion.Trigger></Accordion.Header>
      <Accordion.Content class="agent-index">{@render definitionList(location)}</Accordion.Content>
    </Accordion.Item>
    {#if agentView==='Canvas'}
      <Accordion.Item value="components">
        <Accordion.Header><Accordion.Trigger aria-label="Components">Components</Accordion.Trigger></Accordion.Header>
        <Accordion.Content class="canvas-component-palette">{@render componentPalette()}</Accordion.Content>
      </Accordion.Item>
    {/if}
    <Accordion.Item value="nodes">
      <Accordion.Header><Accordion.Trigger aria-label="Nodes">Nodes</Accordion.Trigger></Accordion.Header>
      <Accordion.Content class="assembly-node-section">{@render layersBody()}</Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
{/snippet}

{#snippet assemblyBody(location:'sidebar'|'sheet')}
  <Tabs.Root bind:value={assemblyContext} class="agent-dock-tabs">
    <Tabs.List class="agent-dock-tablist" aria-label="Agent sidebar context">
      <Tabs.Trigger value="assembly">Assembly</Tabs.Trigger>
      <Tabs.Trigger value="selection">Selection</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="assembly" class="agent-dock-tabpanel">
      {#if assemblyContext==='assembly'}
        <div class="agent-dock-scroll" use:rememberDockScroll={'assembly'}>
          {@render assemblySectionsBody(location)}
        </div>
      {/if}
    </Tabs.Content>
    <Tabs.Content value="selection" class="agent-dock-tabpanel">
      {#if assemblyContext==='selection'}
        <div class="agent-dock-scroll agent-selection-content" use:rememberDockScroll={'selection'}>
          {#if inspectedWire}
            <h2 id="agent-selection-heading" tabindex="-1">{delegationSelected?'Delegation':'Connection'}</h2>
            {#if delegationSelected}
              {@render agentFields('child','delegation','dock')}
            {:else}
              <p>{objectTitle(inspectedWire.source)} → {objectTitle(inspectedWire.target)}</p>
              <p class="muted">{graph.nodeTypes.find(type=>type.id===graph.nodes.find(n=>n.id===inspectedWire?.target)?.type)?.ports.find(port=>port.id===inspectedWire?.targetPort)?.label??inspectedWire.targetPort}</p>
            {/if}
            <Button label="Disconnect" variant="secondary" onclick={()=>{disconnectWire(inspectedWire.id);selectedWire='';}}/>
          {:else if selection&&graph.nodes.some(node=>node.id===selection)}
            <h2 id="agent-selection-heading" tabindex="-1">{objectTitle(selection)}</h2>
            {@render agentFields(selection,'configure','dock')}
          {:else}
            <Feedback kind="empty" message="Select a node or connection to inspect it."/>
          {/if}
        </div>
      {/if}
    </Tabs.Content>
  </Tabs.Root>
{/snippet}

{#snippet authoringOptions()}
  {#if authoringChoices.length}
    <Dialog.Root bind:open={authoringOptionsOpen}>
      <Dialog.Trigger class="vict-btn vict-btn--quiet panel-shortcut history-options"
        aria-label="Authoring options" title="Authoring options" disabled={sending||dockBusy}>
        <span aria-hidden="true">⋮</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="sheet-shade studio-dialog-shade"/>
        <Dialog.Content class="mobile-sheet studio-dialog authoring-options-dialog">
          <Dialog.Title>Choose authoring activation</Dialog.Title>
          <Dialog.Description>
            {#if graph.nodes.length}Draft: {objectTitle('agent')}. {/if}Each revision has its own chat.
          </Dialog.Description>
          <div class="authoring-activation-field">
            <label for="authoring-activation">Authoring activation</label>
            <Select id="authoring-activation" name="authoring-activation" options={authoringChoices}
              value={authoringActivation} disabled={sending||dockBusy} onChange={selectAuthoringActivation}/>
          </div>
          <div class="launch-actions">
            <Dialog.Close class="vict-btn vict-btn--quiet">Cancel</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  {/if}
{/snippet}

{#snippet authoringComposer()}
  <div class="authoring-composer">
    <div class="authoring-feedback">
      {#if !state.provider}
        <Feedback message="Connect the provider for the selected activation on the local server."/>
      {:else if authoringActivationUnavailable}
        <Feedback kind="error" message="The previous authoring activation is unavailable. Choose a revision in Authoring options to open its chat."/>
      {:else if authoringActivation&&!workspaceAuthoring}
        <Feedback message={state.revision?'This revision handles one instruction edit per Session. Choose a workspace authoring revision for a continuing chat.':'Save this Agent Definition before authoring.'}/>
      {/if}
      {#if authoringStatus||dockBusy}<Feedback message={authoringStatus||'The last message is still running…'}/>{/if}
      {#if authoringError}<Feedback kind="error" message={authoringError}/>{/if}
      {#if dockInterruption}
        <Feedback kind="error" message={dockInterruption}/>
      {:else if authoringResult?.message}
        <Feedback kind={authoringResult.kind} message={authoringResult.message}/>
      {/if}
    </div>
    <Patterns.PromptInput bind:value={authoringInput} busy={sending||dockBusy}
      label={!authoringActivation||workspaceAuthoring?'Message':'Requested change'}
      placeholder={!authoringActivation||workspaceAuthoring?'Write a message…':'Describe an instruction change…'}
      onSend={authoringActivation&&!sending&&!dockBusy&&!pending&&state.provider&&(workspaceAuthoring||state.revision)
        ? ()=>void sendAuthoring() : undefined}
      onStop={draftTurn&&!draftTurn.stop.signal.aborted&&authoringStatus!=='Stopping…'?stopAuthoring:undefined}>
      {#snippet footer()}
        {#if workspaceAuthoring}
          <label class="visually-hidden" for="authoring-mode">Turn permission</label>
          <Select id="authoring-mode" name="authoring-mode" options={authoringModes}
            value={authoringMode} disabled={sending||dockBusy} onChange={setAuthoringMode}/>
        {/if}
      {/snippet}
    </Patterns.PromptInput>
    {#if dockRunLink||dockTestRun}
      <div class="authoring-run-action">
        {#if dockRunLink}
          <ControlButton.Root class="vict-btn vict-btn--quiet" onclick={()=>inspectAuthoringRun(dockRunLink)}>Inspect authoring Run</ControlButton.Root>
        {/if}
        {#if dockTestRun}
          <ControlButton.Root class="vict-btn vict-btn--quiet" onclick={()=>inspectAuthoringRun(dockTestRun)}>Inspect last test Run</ControlButton.Root>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet authoringBody()}
  <div class="authoring-dock-content">
    {#if !authoringChoices.length}
      <Feedback kind="empty" message="Create and activate an agent with Draft Authoring to use this dock."/>
    {:else}
      {#key authoringActivation}
        <Conversation messages={dockMessages} busy={sending||dockBusy} composer={authoringComposer}
          emptyMessage={!authoringActivation?'Choose an activation from Authoring options.':workspaceAuthoring?'Start a conversation.':'Request an instruction change.'}/>
      {/key}
    {/if}
    {#if !authoringChoices.length&&authoringError}
      <Feedback kind="error" message={authoringError}/>
    {/if}
  </div>
{/snippet}
