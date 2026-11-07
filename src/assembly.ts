import { GraphSessionV3, validateGraphV3, type GraphDocumentV3, type GraphOperationV3 } from '@victframework/ui-flow-svelte/model';

export const modelId = 'glm-5.3-flash';
export const modelName = 'GLM-5.3 Flash';
export const rootId = 'agent';
export const instructionId = 'instructions';
export const modelNodeId = 'model';

const definitions: GraphDocumentV3['nodeTypes'] = [
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

export function emptyAssembly():GraphDocumentV3 {
  return {schema:'vict.flow-graph@3',revision:0,nodeTypes:structuredClone(definitions),nodes:[],edges:[]};
}

export function assemblyIssues(graph:GraphDocumentV3) {
  const expected:Record<string,string> = {agent:'agent',instructions:'text',model:'model'};
  if (JSON.stringify(graph.nodeTypes)!==JSON.stringify(definitions) ||
      graph.nodes.some(node => expected[node.id]!==node.type) ||
      graph.edges.some(edge => edge.sourcePort!=='value' || edge.target!=='agent' ||
        !((edge.source==='instructions' && edge.targetPort==='instructions') || (edge.source==='model' && edge.targetPort==='model')))) {
    return [{code:'TORI_ASSEMBLY_SHAPE',path:'graph',message:'Connect Instruction Text to Instructions and Model Reference to Model.'}];
  }
  return [];
}
export function checkedAssembly(input:unknown) {
  const result = validateGraphV3(input);
  if (!result.ok || assemblyIssues(result.graph).length) throw new Error('This document is not a supported Agent Assembly.');
  return result.graph;
}
export function history(graph:GraphDocumentV3) {
  return new GraphSessionV3(graph,{validate:assemblyIssues});
}
export function field(graph:GraphDocumentV3,id:string,key:string) {
  const node = graph.nodes.find(n=>n.id===id);
  return node?.values[key] ?? graph.nodeTypes.find(n=>n.id===node?.type)?.parameters[key]?.default;
}
export const binding = (graph:GraphDocumentV3,port:string) => graph.edges.find(e=>e.target==='agent' && e.targetPort===port);
export const instructions = (graph:GraphDocumentV3) => String(binding(graph,'instructions') ?
  field(graph,instructionId,'text')??'' : field(graph,rootId,'instructions')??'');
export function resolved(graph:GraphDocumentV3) {
  return {name:String(field(graph,rootId,'name')??''),instructions:instructions(graph),
    model:binding(graph,'model') ? String(field(graph,modelNodeId,'model')??'') : '',
    tokens:Number(field(graph,modelNodeId,'tokens')??4096)};
}
export function readiness(graph:GraphDocumentV3) {
  const value=resolved(graph);
  return !graph.nodes.some(n=>n.id===rootId) ? 'Add an Agent Definition.' :
    !value.name.trim() ? 'Enter an agent name.' :
    !value.instructions.trim() ? 'Write system instructions.' :
    value.model!==modelId ? 'Select GLM-5.3 Flash and connect its Model Reference.' :
    !Number.isInteger(value.tokens)||value.tokens<64||value.tokens>32768 ? 'Enter a whole output limit from 64 to 32,768 tokens.' : '';
}
export const change = (nodeId:string,key:string,value:string|number):GraphOperationV3 => ({type:'setParameter',nodeId,key,value});
export const add = (id:string):GraphOperationV3 => ({type:'addNode',id,nodeType:id==='instructions'?'text':id,
  position:id==='agent'?{x:390,y:140}:id==='model'?{x:55,y:351}:{x:55,y:115}});
export const wire = (source:string,targetPort:string):GraphOperationV3 => ({type:'connect',edge:{
  id:source+'-to-'+targetPort,source,sourcePort:'value',target:'agent',targetPort,
}});
