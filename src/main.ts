import { mount } from 'svelte';
import '@victframework/ui-svelte/styles.css';
import '@victframework/ui-svelte/catalog.css';
import '@victframework/ui-flow-svelte/styles.css';
import '@victframework/ui-ai-svelte/styles.css';
import './studio.css';
import Studio from './Studio.svelte';

mount(Studio,{target:document.getElementById('app')!});
