<script lang="ts">
  let {kind,connected=false}: {kind:string;connected?:boolean} = $props();
  const paths:Record<string,string> = {
    agent:'M12 4v3m-6 3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v7H6zm-2 2v3m16-3v3m-10-3h.01m4 0h.01m-5 3h6',
    instructions:'M5 6h14M5 10h14M5 14h10M5 18h7',
    model:'M8 4h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4h4v6h-4zM3 8h3m-3 6h3m12-6h3m-3 6h3M10 18v3m4-3v3',
    'output-limit':'M10 4 8 20m8-16-2 16M5 9h14M4 15h14',
    context:'M4 6c3-1 5-.5 8 2 3-2.5 5-3 8-2v12c-3-1-5-.5-8 2-3-2.5-5-3-8-2zM12 8v12',
    memory:'M5 8h14v12H5zM3 4h18v4H3zm7 8h4',
    tool:'m8 16-3 3m6-6-3 3m5-9 3-3m1 7 3-3M9 9l6 6m-4-8 6 6m-7-5-2 2a4 4 0 0 0 6 6l2-2',
    output:'M9 4H7a2 2 0 0 0-2 2v3l-2 3 2 3v3a2 2 0 0 0 2 2h2m6-16h2a2 2 0 0 1 2 2v3l2 3-2 3v3a2 2 0 0 1-2 2h-2',
    child:'M5 4v14m0-9h7a4 4 0 0 1 4 4v2m-3-2 3 3 3-3M3 4h4M3 20h4',
  };
</script>

<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  {#if kind==='separate-node'||kind==='inline-node'}
    {#if connected}
      <rect x="3" y="8" width="7" height="8" rx="1"/>
      <path d="M10 12h4"/>
    {/if}
    <rect x={connected?14:8} y="8" width="7" height="8" rx="1"
      fill={kind==='separate-node'?'currentColor':'none'}
      stroke-dasharray={kind==='inline-node'?'1.5 2':undefined}/>
  {:else}
    <path d={paths[kind]??paths.agent}/>
  {/if}
</svg>
