import { McpServer, fromJsonSchema } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { appendFileSync } from 'node:fs';
import { inputSchema, toolName } from './a3-catalog.mjs';

const server = new McpServer({name:'local-reference',version:'1'});
const schema = process.env.TORI_MCP_SCHEMA_DRIFT==='1'
  ? {...inputSchema,properties:{key:{type:'string',enum:['other']}}} : inputSchema;
server.registerTool(toolName,{
  description:'Read the synthetic observatory reference.',
  inputSchema:fromJsonSchema(schema),annotations:{readOnlyHint:true},
},async()=>{
  if(process.env.TORI_MCP_CALL_CAPTURE)appendFileSync(process.env.TORI_MCP_CALL_CAPTURE,'read_reference\n');
  return {content:[{type:'text',text:'The synthetic observatory reference is TERN-MCP-READ.'}]};
});
await server.connect(new StdioServerTransport());
