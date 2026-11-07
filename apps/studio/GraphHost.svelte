<script>
  import { setContext } from 'svelte';
  import { GRAPH_EDITOR_HOST } from '@victframework/ui-flow-svelte';
  let { draft, children } = $props();
  setContext(GRAPH_EDITOR_HOST, {
    historyFor: () => draft,
    presentationFor: ({ nodeId, occurrenceKey }) => {
      const key = JSON.stringify([nodeId, occurrenceKey]);
      return {
        get: () => draft.views.get(key),
        set: state => draft.views.set(key, state)
      };
    }
  });
</script>

{@render children()}
