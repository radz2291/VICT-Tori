import { createHash } from 'node:crypto';

export const toolName = 'read_reference';
export const readGrant = 'tori.mcp.reference.read';
export const inputSchema = Object.freeze({
  type:'object', properties:{key:{type:'string',enum:['observatory']}}, required:['key'], additionalProperties:false,
});
const stable = value => Array.isArray(value) ? value.map(stable) :
  value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])) : value;
export const schemaDigest = schema => createHash('sha256').update(JSON.stringify(stable(schema))).digest('hex');
export const toolRef = Object.freeze({
  id:'tori.reference.read', revision:'1-'+schemaDigest(inputSchema), server:'local-reference@1', name:toolName,
});
export const sources = Object.freeze({
  'reference@1':{file:new URL('../fixtures/v1a/a3-context-v1.txt',import.meta.url),
    digest:'d00176ebf046ed4cfc71acf3e215015b297bbe75afeeab8a80b66ee17308cd1c'},
  'reference@2':{file:new URL('../fixtures/v1a/a3-context-v2.txt',import.meta.url),
    digest:'391d26277981c51975edb4a041ab9d6aff634dd1751a99babe5e91bba728f4d0'},
});
export const contextBudget = 512;
