import { GraphSessionV3, validateGraphV3, type GraphDocumentV3, type GraphOperationV3 } from '@victframework/ui-flow-svelte/model';

export const modelId = 'glm-5.3-flash';
export const modelName = 'GLM-5.3 Flash';
export const rootId = 'agent';
export const instructionId = 'instructions';
export const modelNodeId = 'model';

export const tokenSourceId = 'output-limit';

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

export const executionBounds = {maxSteps:4,maxRetries:1,deadlineMs:90000} as const;
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

export const agentResources=[...a3Resources,
  {id:'output',label:'Output Contract',type:'output-reference',defaultValue:'finding@1'},
  {id:'child',label:'Child Agent',type:'agent-reference',defaultValue:'reference-reviewer@1'},
] as const;
const a3Definitions=resourceCatalog(a3Resources);
const definitions=resourceCatalog(agentResources);

function upgrade(graph:GraphDocumentV3):GraphDocumentV3 {
  return [legacyDefinitions,a1Definitions,a2Definitions,a3Definitions].some(catalog=>JSON.stringify(graph.nodeTypes)===JSON.stringify(catalog))
    ? {...graph,nodeTypes:structuredClone(definitions)} : graph;
}

export function emptyAssembly():GraphDocumentV3 {
  return {schema:'vict.flow-graph@3',revision:0,nodeTypes:structuredClone(definitions),nodes:[],edges:[]};
}

export function assemblyIssues(graph:GraphDocumentV3) {
  const expected:Record<string,string> = {agent:'agent',instructions:'text',model:'model',[tokenSourceId]:tokenSourceId,...Object.fromEntries(agentResources.map(item=>[item.id,item.id]))};
  if (JSON.stringify(graph.nodeTypes)!==JSON.stringify(definitions) ||
      graph.nodes.some(node => expected[node.id]!==node.type) ||
      graph.edges.some(edge => edge.sourcePort!=='value' || !(
        (edge.target===rootId && ((edge.source===instructionId && edge.targetPort==='instructions') ||
          (edge.source===modelNodeId && edge.targetPort==='model') ||
          agentResources.some(resource=>edge.source===resource.id&&edge.targetPort===resource.id))) ||
        (edge.target===modelNodeId && edge.source===tokenSourceId && edge.targetPort==='tokens')))) {
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

export function resolved(graph:GraphDocumentV3) {
  const modelValues=graph.nodes.find(node=>node.id===modelNodeId)?.values;
  const temperature=modelValues?.temperature as number|undefined;
  const topP=modelValues?.topP as number|undefined;
  const resource=(id:string)=>binding(graph,id)?field(graph,id,'reference'):undefined;
  return {output:resource('output'),child:resource('child'),context:resource('context'),memory:resource('memory'),tool:resource('tool'),name:String(field(graph,rootId,'name')??''),instructions:instructions(graph),
    model:binding(graph,'model') ? String(field(graph,modelNodeId,'model')??'') : '',
    tokens:outputTokens(graph),temperature,topP,
    maxSteps:Number(field(graph,rootId,'maxSteps')??1),maxRetries:Number(field(graph,rootId,'maxRetries')??0)};
}
export function readiness(graph:GraphDocumentV3,route?:string) {
  const value=resolved(graph);
  return !graph.nodes.some(n=>n.id===rootId) ? 'Add an Agent Definition.' :
    !value.name.trim() ? 'Enter an agent name.' :
    !value.instructions.trim() ? 'Write system instructions.' :
    value.model!==modelId ? 'Select GLM-5.3 Flash and connect its Model Reference.' :
    value.context!==undefined && !['reference@1','reference@2'].includes(String(value.context)) ? 'Select a supported Context Source revision.' :
    value.memory!==undefined && !['recent-10@1','recent-100@1'].includes(String(value.memory)) ? 'Select a supported Memory Policy.' :
    value.output!==undefined && value.output!=='finding@1' ? 'Select the supported Output Contract.' :
    value.child!==undefined && value.child!=='reference-reviewer@1' ? 'Select the allowlisted Child Agent.' :
    value.tool!==undefined && value.tool!=='local-reference@1' ? 'Select the allowlisted read-only MCP Tool.' :
    route!==undefined && route!=='coding' && (value.temperature!==undefined||value.topP!==undefined) ? 'Clear sampling overrides or select the supported Coding route on the host.' :
    !Number.isInteger(value.tokens)||value.tokens<64||value.tokens>32768 ? 'Enter a whole output limit from 64 to 32,768 tokens.' :
    value.temperature!==undefined && (!Number.isFinite(value.temperature)||value.temperature<0||value.temperature>1) ? 'Enter a temperature from 0 to 1, or leave it blank.' :
    value.topP!==undefined && (!Number.isFinite(value.topP)||value.topP<=0||value.topP>1) ? 'Enter a top-p greater than 0 and at most 1, or leave it blank.' :
    !Number.isInteger(value.maxSteps)||value.maxSteps<1||value.maxSteps>executionBounds.maxSteps ? 'Enter a whole step limit from 1 to 4.' :
    !Number.isInteger(value.maxRetries)||value.maxRetries<0||value.maxRetries>executionBounds.maxRetries ? 'Enter 0 or 1 model retries.' : '';

}
export const change = (nodeId:string,key:string,value:string|number|undefined):GraphOperationV3 => value===undefined ? {type:'unsetParameter',nodeId,key} : {type:'setParameter',nodeId,key,value};
export const add = (id:string):GraphOperationV3 => ({type:'addNode',id,nodeType:id==='instructions'?'text':id,
  position:agentResources.some(resource=>resource.id===id)?{x:-250,y:630+agentResources.findIndex(resource=>resource.id===id)*200}:id==='agent'?{x:390,y:140}:id==='model'?{x:55,y:351}:id===tokenSourceId?{x:-250,y:351}:{x:55,y:115}});
export const wire = (source:string,targetPort:string):GraphOperationV3 => ({type:'connect',edge:{
  id:source+'-to-'+targetPort,source,sourcePort:'value',target:targetPort==='tokens'?modelNodeId:rootId,targetPort,
}});
