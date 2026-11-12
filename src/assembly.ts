import { GraphSessionV3, validateGraphV3, type GraphDocumentV3, type GraphOperationV3 } from '@victframework/ui-flow-svelte/model';

import { executionBounds, workspaceBinding } from '../packages/authoring/index.mjs';
import { registeredTool, registeredTools } from './registered-tools.mjs';

export const modelId = 'glm-5.3-flash';
export const modelName = 'GLM-5.3 Flash';
export const rootId = 'agent';
export const instructionId = 'instructions';
export const modelNodeId = 'model';

export const tokenSourceId = 'output-limit';
export const governedMemoryValue='governed@1';
export const savedMemoryChoices=[{value:'off',label:'Off'},{value:governedMemoryValue,label:'Governed Memory'}];
export const optionalBindings=[
  {id:modelNodeId,label:'Model Reference'},
  {id:instructionId,label:'System prompt'},
  {id:tokenSourceId,label:'Output limit Integer'},
  {id:'memory',label:'Memory Policy'},
  {id:'output',label:'Output Contract'},
] as const;
export const isOptionalBinding=(id:string)=>optionalBindings.some(item=>item.id===id);

export function nodeVisibilityLabel(title:string,shown:boolean,connected:boolean) {
  if(!connected)return (shown?'Hide node from Canvas: ':'Show node on Canvas: ')+title;
  return (shown?'Hide separate binding node: ':'Show binding as a separate node: ')+title;
}


const legacyDefinitions: GraphDocumentV3['nodeTypes'] = [
  { id:'agent', label:'Agent Definition', parameters:{
    name:{type:'string',default:'Untitled agent'}, instructions:{type:'string',default:''},
  }, ports:[
    {id:'instructions',label:'Instructions',type:'text',direction:'input',maxConnections:1},
    {id:'model',label:'Model',type:'model-reference',direction:'input',maxConnections:1},
  ] },
  { id:'text', label:'Instruction Text', parameters:{text:{type:'string',default:''}},
    ports:[{id:'value',label:'Text',type:'text',direction:'output'}] },
  { id:'model', label:'Model Reference', parameters:{model:{type:'string',default:''}, tokens:{type:'number',default:4096}},
    ports:[{id:'value',label:'Model Reference',type:'model-reference',direction:'output'}] },
];

const a1Definitions: GraphDocumentV3['nodeTypes'] = [
  ...legacyDefinitions.map(node => node.id === 'model'
    ? {...node, ports:[...node.ports,{id:'tokens',label:'Max output tokens',type:'integer',direction:'input' as const,maxConnections:1}]}
    : node),
  {id:tokenSourceId,label:'Output limit Integer',parameters:{tokens:{type:'number',default:4096}},
    ports:[{id:'value',label:'Integer',type:'integer',direction:'output'}]},
];

const a2Definitions = a1Definitions.map(node => {
  if (node.id === rootId) return {...node,parameters:{...node.parameters,
    maxSteps:{type:'number' as const,default:1},maxRetries:{type:'number' as const,default:0}}};
  if (node.id === modelNodeId) return {...node,parameters:{...node.parameters,
    temperature:{type:'number' as const,default:0},topP:{type:'number' as const,default:1}}};
  return node;
});

const a3Resources = [
  {id:'context',label:'Context Source',type:'context-reference',defaultValue:'reference@1'},
  {id:'memory',label:'Memory Policy',type:'memory-reference',defaultValue:'recent-10@1'},
  {id:'tool',label:'Read-only MCP Tool',type:'tool-reference',defaultValue:'local-reference@1'},
] as const;
const resourceCatalog=(resources:ReadonlyArray<{id:string,label:string,type:string,defaultValue:string}>):GraphDocumentV3['nodeTypes']=>[
  ...a2Definitions.map(node=>node.id===rootId?{...node,ports:[...node.ports,...resources.map(resource=>({
    id:resource.id,label:resource.label,type:resource.type,direction:'input' as const,maxConnections:1,
  }))]}:node),
  ...resources.map(resource=>({id:resource.id,label:resource.label,parameters:{reference:{type:'string' as const,default:resource.defaultValue}},
    ports:[{id:'value',label:resource.label,type:resource.type,direction:'output' as const}]})),
];

const a4Resources=[...a3Resources,
  {id:'output',label:'Output Contract',type:'output-reference',defaultValue:'finding@1'},
  {id:'child',label:'Child Agent',type:'agent-reference',defaultValue:'reference-reviewer@1'},
] as const;
export const agentResources=[...a4Resources,
  {id:'authoring',label:'Draft Authoring',type:'authoring-reference',defaultValue:'instructions@1'},
] as const;
export const resourceChoices={
  authoring:[{value:'instructions@1',label:'Edit draft instructions · r1'},{value:workspaceBinding,label:'Workspace authoring · r1'}],
  context:[{value:'studio-research@1',label:'Studio Research Knowledge · r1'},{value:'project-knowledge@1',label:'Project Knowledge r1'},{value:'reference@1',label:'Observatory reference · r1'},{value:'reference@2',label:'Observatory reference · r2'}],
  memory:[{value:'recent-10@1',label:'Last 10 messages'},{value:'recent-100@1',label:'Last 100 messages'}],
  output:[{value:'finding@1',label:'Finding JSON · r1'}],
  child:[{value:'reference-reviewer@1',label:'Reference reviewer · r1 (fixture)'}],
  tool:[{value:'local-reference@1',label:'Local observatory · read only'},
    ...registeredTools.map(tool=>({value:tool.reference,label:tool.label}))],
};
export const inlineAgentSettings=[
  {id:'memory',label:'Memory window',options:[{value:'default',label:'Last 100 messages (default)'},...resourceChoices.memory]},
  {id:'output',label:'Output format',options:[{value:'default',label:'Text (default)'},...resourceChoices.output]},
] as const;
const a3Definitions=resourceCatalog(a3Resources);
const authoringDefinitions=resourceCatalog(agentResources);
const authoringBudgets=authoringDefinitions.map(node=>node.id===rootId?{...node,parameters:{...node.parameters,
  maxToolCalls:{type:'number' as const,default:0}}}:node);
const definitions=authoringBudgets.map(node=>node.id==='memory'?{...node,parameters:{...node.parameters,
  savedMemory:{type:'string' as const,default:'off'}}}:node);

function upgrade(graph:GraphDocumentV3):GraphDocumentV3 {
  return [legacyDefinitions,a1Definitions,a2Definitions,a3Definitions,resourceCatalog(a4Resources),authoringDefinitions,authoringBudgets].some(catalog=>JSON.stringify(graph.nodeTypes)===JSON.stringify(catalog))
    ? {...graph,nodeTypes:structuredClone(definitions)} : graph;
}

export function emptyAssembly():GraphDocumentV3 {
  return {schema:'vict.flow-graph@3',revision:0,nodeTypes:structuredClone(definitions),nodes:[],edges:[]};
}

export function canWire(source:string,sourcePort:string|null,target:string,targetPort:string|null) {
  if(sourcePort!=='value')return false;
  if(target===modelNodeId)return source===tokenSourceId&&targetPort==='tokens';
  return target===rootId&&source===targetPort&&
    (source===instructionId||source===modelNodeId||agentResources.some(resource=>resource.id===source));
}

export function assemblyIssues(graph:GraphDocumentV3) {
  const expected:Record<string,string> = {agent:'agent',instructions:'text',model:'model',[tokenSourceId]:tokenSourceId,...Object.fromEntries(agentResources.map(item=>[item.id,item.id]))};
  if (JSON.stringify(graph.nodeTypes)!==JSON.stringify(definitions) ||
      graph.nodes.some(node => expected[node.id]!==node.type) ||
      graph.edges.some(edge => !canWire(edge.source,edge.sourcePort,edge.target,edge.targetPort))) {
    return [{code:'TORI_ASSEMBLY_SHAPE',path:'graph',message:'Connect Instruction Text to Instructions and Model Reference to Model.'}];
  }
  return [];
}
export function checkedAssembly(input:unknown) {
  const result = validateGraphV3(input);
  if (!result.ok || assemblyIssues(upgrade(result.graph)).length) throw new Error('This document is not a supported Agent Assembly.');
  return upgrade(result.graph);
}
export function history(graph:GraphDocumentV3) {
  return new GraphSessionV3(upgrade(graph),{validate:assemblyIssues});
}
export function field(graph:GraphDocumentV3,id:string,key:string) {
  const node = graph.nodes.find(n=>n.id===id);
  return node?.values[key] ?? graph.nodeTypes.find(n=>n.id===node?.type)?.parameters[key]?.default;
}
export const binding = (graph:GraphDocumentV3,port:string) => graph.edges.find(e=>e.target===(port==='tokens'?modelNodeId:rootId) && e.targetPort===port);
export const instructions = (graph:GraphDocumentV3) => String(binding(graph,'instructions') ?
  field(graph,instructionId,'text')??'' : field(graph,rootId,'instructions')??'');
export const outputTokens = (graph:GraphDocumentV3) =>
  Number(field(graph,binding(graph,'tokens')?tokenSourceId:modelNodeId,'tokens')??4096);

export function executionSettings(graph:GraphDocumentV3) {
  const authoring=binding(graph,'authoring')&&field(graph,'authoring','reference');
  // Preserve the budget of already saved definitions that predate this field.
  const defaultToolCalls=authoring===workspaceBinding?3:authoring?2:binding(graph,'tool')||binding(graph,'child')?1:0;
  const authoredToolCalls=graph.nodes.find(node=>node.id===rootId)?.values.maxToolCalls as number|undefined;
  return {
    maxSteps:Number(field(graph,rootId,'maxSteps')??executionBounds.maxSteps.min),
    maxRetries:Number(field(graph,rootId,'maxRetries')??executionBounds.maxRetries.min),
    maxToolCalls:authoredToolCalls??defaultToolCalls,
    authoredToolCalls,defaultToolCalls,
  };
}

export function resolved(graph:GraphDocumentV3) {
  const modelValues=graph.nodes.find(node=>node.id===modelNodeId)?.values;
  const temperature=modelValues?.temperature as number|undefined;
  const topP=modelValues?.topP as number|undefined;
  const resource=(id:string)=>binding(graph,id)?field(graph,id,'reference'):undefined;
  const {maxSteps,maxRetries,maxToolCalls}=executionSettings(graph);
  return {authoring:resource('authoring'),output:resource('output'),child:resource('child'),context:resource('context'),memory:resource('memory'),savedMemory:binding(graph,'memory')?field(graph,'memory','savedMemory'):undefined,tool:resource('tool'),name:String(field(graph,rootId,'name')??''),instructions:instructions(graph),
    model:binding(graph,'model') ? String(field(graph,modelNodeId,'model')??'') : '',
    tokens:outputTokens(graph),temperature,topP,
    maxSteps,maxRetries,maxToolCalls};
}

function executionIssue(value:ReturnType<typeof resolved>) {
  const labels={maxSteps:'step limit',maxRetries:'retry limit',maxToolCalls:'tool call limit'} as const;
  for(const key of Object.keys(labels) as (keyof typeof labels)[]){
    const {min,max}=executionBounds[key];
    if(!Number.isInteger(value[key])||value[key]<min||value[key]>max)
      return `Enter a whole ${labels[key]} from ${min} to ${max}.`;
  }
  return '';
}
export function readiness(graph:GraphDocumentV3,route?:string) {
  const value=resolved(graph);
  return !graph.nodes.some(n=>n.id===rootId) ? 'Add an Agent Definition.' :
    !value.name.trim() ? 'Enter an agent name.' :
    !value.instructions.trim() ? 'Write system instructions.' :
    value.model!==modelId ? 'Select GLM-5.3 Flash and connect its Model Reference.' :
    value.context!==undefined && !resourceChoices.context.some(option=>option.value===value.context) ? 'Select a supported Context Source revision.' :
    value.memory!==undefined && !['recent-10@1','recent-100@1'].includes(String(value.memory)) ? 'Select a supported Memory Policy.' :
    value.savedMemory!==undefined && value.savedMemory!=='off' && value.savedMemory!==governedMemoryValue ? 'Select a supported saved memory policy.' :
    value.output!==undefined && value.output!=='finding@1' ? 'Select the supported Output Contract.' :
    value.child!==undefined && value.child!=='reference-reviewer@1' && !/^saved:[0-9a-f-]{36}$/.test(String(value.child)) ? 'Select the allowlisted Child Agent.' :
    value.authoring!==undefined && value.authoring!=='instructions@1' && value.authoring!==workspaceBinding ? 'Select the supported Draft Authoring capability.' :
    value.authoring && (value.tool||value.child||value.output) ? 'Remove MCP, delegation and structured output from this authoring activation.' :
    value.tool!==undefined && value.tool!=='local-reference@1' && !registeredTool(value.tool) ? 'Select a registered read-only tool revision.' :
    route!==undefined && route!=='coding' && (value.temperature!==undefined||value.topP!==undefined) ? 'Clear sampling overrides or select the supported Coding route on the host.' :
    !Number.isInteger(value.tokens)||value.tokens<64||value.tokens>32768 ? 'Enter a whole output limit from 64 to 32,768 tokens.' :
    value.temperature!==undefined && (!Number.isFinite(value.temperature)||value.temperature<0||value.temperature>1) ? 'Enter a temperature from 0 to 1, or leave it blank.' :
    value.topP!==undefined && (!Number.isFinite(value.topP)||value.topP<=0||value.topP>1) ? 'Enter a top-p greater than 0 and at most 1, or leave it blank.' :
    executionIssue(value);

}
export const change = (nodeId:string,key:string,value:string|number|undefined):GraphOperationV3 => value===undefined ? {type:'unsetParameter',nodeId,key} : {type:'setParameter',nodeId,key,value};
export const add = (id:string):GraphOperationV3 => ({type:'addNode',id,nodeType:id==='instructions'?'text':id,
  position:agentResources.some(resource=>resource.id===id)?{x:-250,y:630+agentResources.findIndex(resource=>resource.id===id)*200}:id==='agent'?{x:390,y:140}:id==='model'?{x:55,y:351}:id===tokenSourceId?{x:-250,y:351}:{x:55,y:115}});
export const wire = (source:string,targetPort:string):GraphOperationV3 => ({type:'connect',edge:{
  id:source+'-to-'+targetPort,source,sourcePort:'value',target:targetPort==='tokens'?modelNodeId:rootId,targetPort,
}});

export function configureOperations(graph:GraphDocumentV3,id:string,key:string,value:string|number) {
  const operations:GraphOperationV3[]=[];
  if(!graph.nodes.some(node=>node.id===id)){
    operations.push(add(id));
    if(id==='memory'&&key==='savedMemory')operations.push(change(id,'reference','recent-100@1'));
  }
  if(key)operations.push(change(id,key,value));
  if(binding(graph,id)?.source!==id)operations.push(wire(id,id));
  return operations;
}

type AssemblyPatch = {
  name?:string; instructions?:string; model?:string; context?:string; tool?:string;
  childRevision?:string; maxSteps?:number; maxToolCalls?:number; maxRetries?:number;
};

export function assemblyPatchOperations(graph:GraphDocumentV3,patch:AssemblyPatch) {
  const operations:GraphOperationV3[]=[];
  const creating=!graph.nodes.some(node=>node.id===rootId);
  if(creating)operations.push(add(rootId));
  if(patch.name!==undefined)operations.push(change(rootId,'name',patch.name));
  if(patch.instructions!==undefined)operations.push(binding(graph,'instructions')
    ? change(instructionId,'text',patch.instructions)
    : change(rootId,'instructions',patch.instructions));
  // A new tool-using agent starts with room for one tool result and a reply.
  // Once authored, its step budget is never adjusted by a binding edit.
  const maxSteps=patch.maxSteps??(creating&&(patch.tool||patch.childRevision)?2:undefined);
  if(maxSteps!==undefined)operations.push(change(rootId,'maxSteps',maxSteps));
  if(patch.maxToolCalls!==undefined)operations.push(change(rootId,'maxToolCalls',patch.maxToolCalls));
  if(patch.maxRetries!==undefined)operations.push(change(rootId,'maxRetries',patch.maxRetries));
  if(patch.model!==undefined)operations.push(...configureOperations(graph,modelNodeId,'model',patch.model));
  if(patch.context!==undefined)operations.push(...configureOperations(graph,'context','reference',patch.context));
  if(patch.tool!==undefined)operations.push(...configureOperations(graph,'tool','reference',patch.tool));
  if(patch.childRevision!==undefined)operations.push(...configureOperations(graph,'child','reference','saved:'+patch.childRevision));
  return operations;
}
