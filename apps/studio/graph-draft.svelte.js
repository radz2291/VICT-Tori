import { parseGraphV3 } from '@victframework/ui-flow-svelte/model';

// VICT validates authored operations. Its public host delegates document history here.
export class GraphDraft {
  source = $state('');
  saved = $state(null);
  status = $state('New local draft');
  error = $state('');
  past = $state([]);
  future = $state([]);
  views = new Map();
  editing = false;
  editRecorded = false;

  beginEdit() { this.editing = true; this.editRecorded = false; }
  endEdit() { this.editing = false; this.editRecorded = false; }

  constructor(key, initialSource) {
    this.key = key;
    this.source = initialSource;
    let retained;
    try { retained = sessionStorage.getItem(key + '.recovery'); } catch { /* Storage may be unavailable. */ }
    this.reopen();
    try {
      const recovery = JSON.parse(retained ?? 'null');
      if (recovery && (recovery.base === null || typeof recovery.base === 'string') && parseGraphV3(recovery.source).ok) {
        this.source = recovery.source;
        this.saved = recovery.base;
        this.status = 'Unsaved edits recovered';
        this.recover();
      }
    } catch {
      this.error = 'Could not read draft recovery. Your saved draft is still available.';
    }
  }
  get dirty() {
    return this.status === 'Unsaved edits' || this.status === 'Unsaved edits recovered';
  }
  recover() {
    try {
      if (this.dirty) sessionStorage.setItem(this.key + '.recovery', JSON.stringify({ source: this.source, base: this.saved }));
      else sessionStorage.removeItem(this.key + '.recovery');
    } catch {
      this.error = 'Draft recovery is unavailable. Save or download your edits before leaving.';
    }
  }
  edit(source) {
    if (source === this.source) return;
    if (!this.editing || !this.editRecorded) this.past.push(this.source);
    this.editRecorded = this.editing;
    this.future = [];
    this.source = source;
    this.status = source === this.saved ? 'Saved draft' : 'Unsaved edits';
    this.recover();
  }
  canUndo() { return this.past.length > 0; }
  canRedo() { return this.future.length > 0; }
  travel(from, to) {
    this.endEdit();
    if (!from.length) return;
    const previous = from.pop();
    const graph = parseGraphV3(previous).graph;
    graph.revision = parseGraphV3(this.source).graph.revision + 1;
    to.push(this.source);
    this.source = JSON.stringify(graph);
    this.status = 'Unsaved edits';
    this.recover();
  }
  undo() { this.travel(this.past, this.future); }
  redo() { this.travel(this.future, this.past); }
  reopen() {
    this.endEdit();
    try {
      const source = localStorage.getItem(this.key);
      if (source === null) return;
      if (!parseGraphV3(source).ok) throw new Error('Invalid graph');
      this.source = this.saved = source;
      this.past = [];
      this.future = [];
      this.status = 'Saved draft reopened';
      this.error = '';
      this.recover();
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
      this.recover();
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
