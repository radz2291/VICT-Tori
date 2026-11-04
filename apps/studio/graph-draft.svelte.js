import { parseGraphV3 } from '@victframework/ui-flow-svelte/model';

export class GraphDraft {
  source = $state('');
  saved = $state(null);
  status = $state('New local draft');
  error = $state('');

  constructor(key, initialSource) {
    this.key = key;
    this.source = initialSource;
    this.reopen();
  }

  edit(source) {
    this.source = source;
    this.status = source === this.saved ? 'Saved draft' : 'Unsaved edits';
  }

  reopen() {
    try {
      const source = localStorage.getItem(this.key);
      if (source === null) return;
      if (!parseGraphV3(source).ok) throw new Error('Invalid graph');
      this.source = this.saved = source;
      this.status = 'Saved draft reopened';
      this.error = '';
    } catch {
      this.error = 'Could not reopen the saved draft. Download your current draft before refreshing.';
    }
  }

  save() {
    try {
      if (localStorage.getItem(this.key) !== this.saved) {
        this.error = 'Another tab changed the saved draft. Download your edits before reopening the saved version.';
        return;
      }
      localStorage.setItem(this.key, this.source);
      this.saved = this.source;
      this.status = 'Draft saved locally';
      this.error = '';
    } catch {
      this.error = 'Could not save locally. Free browser storage and retry, or download your draft.';
    }
  }

  download(filename) {
    const url = URL.createObjectURL(new Blob([this.source], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
