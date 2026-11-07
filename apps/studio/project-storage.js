const requested = new URLSearchParams(window.location.search).get('project');
export const project = ['blank', 'samples'].includes(requested) ? requested : 'studio';
export const projectLabel = { studio: 'Untitled project', blank: 'Blank project', samples: 'Sample project' }[project];
export const projectKey = key => project === 'studio' ? key : key + '.' + project;

export function openProject(id) {
  const url = new URL(window.location.href);
  url.searchParams.delete('preview');
  if (id === 'studio') url.searchParams.delete('project');
  else url.searchParams.set('project', id);
  window.location.assign(url);
}

export function resetSamples() {
  if (project !== 'samples') return;
  for (const name of ['draft', 'workflow', 'creative', 'docks', 'operations']) {
    const key = projectKey('tori.studio.' + name + '.v1');
    localStorage.removeItem(key);
    sessionStorage.removeItem(key + '.recovery');
  }
  sessionStorage.removeItem(projectKey('tori.studio.operation-bookmark.v1'));
  window.location.reload();
}
