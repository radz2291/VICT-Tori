export function canvasAuthoring(page) {
  const button=name=>page.getByRole('button',{name,exact:true});
  const field=id=>page.locator('#'+id);
  const node=id=>page.locator('.svelte-flow__node[data-id="'+id+'"]');
  const value=(id,name,area='main')=>page.locator(area+' [data-selected-node="'+id+'"] [data-node-value="'+name+'"]');
  const ensureCanvas=async()=>{
    if(await button('Canvas').getAttribute('aria-pressed')!=='true')await button('Canvas').click();
  };
  const nodeAction=async(id,label)=>{
    await node(id).getByRole('button',{name:/^Actions for /}).click();
    await page.getByRole('menuitem',{name:label,exact:true}).click();
  };
  const insert=async name=>{
    await ensureCanvas();
    await page.getByRole('menuitem',{name:'Insert',exact:true}).click();
    await page.getByRole('menuitem',{name,exact:true}).click();
  };
  const rename=async name=>{
    await ensureCanvas();
    await nodeAction('agent','Rename agent');
    await field('canvas-agent-label').fill(name);
    await button('Apply').click();
  };
  const rootInstructions=()=>field('canvas-agent-instructions');
  const model=async()=>{
    await ensureCanvas();
    if(!await field('canvas-model').count()){
      if(await button('Add Model Reference').count())await button('Add Model Reference').click();
      else await button('Show Model Reference').click();
    }
    await field('canvas-model').selectOption('glm-5.3-flash');
  };
  const execution=async()=>{
    await ensureCanvas();
    const toggle=node('agent').getByRole('button',{name:/^Execution/});
    if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
  };
  const memory=async()=>{
    await ensureCanvas();
    if(await button('Add Memory Policy').count())await button('Add Memory Policy').click();
    else if(!await field('canvas-memory-saved-memory').count())await button('Show Memory Policy').click();
  };
  return {ensureCanvas,node,nodeAction,insert,rename,rootInstructions,value,model,execution,memory};
}
