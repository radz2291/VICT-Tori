import { mount } from 'svelte';
import Studio from './Studio.svelte';
import '@victframework/ui-svelte/styles.css';
import '@victframework/ui-svelte/catalog.css';
import '@victframework/ui-flow-svelte/styles.css';
import '@victframework/ui-structure-svelte/styles.css';
import '@victframework/ui-ai-svelte/styles.css';

mount(Studio, { target: document.querySelector('#app') });
