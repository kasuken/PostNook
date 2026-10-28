import { DraftError, type Draft, type DraftRepository } from '../domain/contracts';
import type { PostDocument } from '../domain/document';
export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'failed' | 'unavailable' | 'conflict';
// Error states wait for an explicit retry so a keystroke never hides them.
const blocked = (status: SaveStatus) =>
  status === 'conflict' || status === 'failed' || status === 'unavailable';
export interface SaveSnapshot {
  draft: Draft;
  status: SaveStatus;
  message: string;
}

export class AutosaveService {
  private generation = 0;
  private committed = 0;
  private debounce?: ReturnType<typeof setTimeout>;
  private maxWait?: ReturnType<typeof setTimeout>;
  private running?: Promise<boolean>;
  private listeners = new Set<(snapshot: SaveSnapshot) => void>();
  private status: SaveStatus = 'saved';
  private message = '';
  constructor(
    public draft: Draft,
    private repository: DraftRepository,
  ) {}
  snapshot = (): SaveSnapshot => ({
    draft: this.draft,
    status: this.status,
    message: this.message,
  });
  subscribe(listener: (snapshot: SaveSnapshot) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private emit() {
    const state = this.snapshot();
    this.listeners.forEach((fn) => fn(state));
  }
  edit(content: PostDocument, title = this.draft.title) {
    this.draft = { ...this.draft, content, title };
    this.generation++;
    if (!blocked(this.status)) {
      this.status = 'dirty';
      clearTimeout(this.debounce);
      this.debounce = setTimeout(() => {
        void this.flush();
      }, 300);
      this.maxWait ??= setTimeout(() => {
        void this.flush();
      }, 1500);
    }
    this.emit();
  }
  flush(): Promise<boolean> {
    clearTimeout(this.debounce);
    clearTimeout(this.maxWait);
    this.maxWait = undefined;
    if (this.running) return this.running;
    if (this.committed === this.generation) return Promise.resolve(true);
    this.running = this.write().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }
  private async write(): Promise<boolean> {
    while (this.committed !== this.generation) {
      const version = this.generation;
      const snapshot = this.draft;
      this.status = 'saving';
      this.message = '';
      this.emit();
      try {
        const saved = await this.repository.updateDraft(
          snapshot.id,
          snapshot.revision,
          snapshot.content,
          snapshot.title,
        );
        this.draft = { ...saved, content: this.draft.content, title: this.draft.title };
        this.committed = version;
      } catch (error) {
        const code = error instanceof DraftError ? error.code : undefined;
        this.status =
          code === 'conflict' ? 'conflict' : code === 'unavailable' ? 'unavailable' : 'failed';
        this.message =
          error instanceof Error
            ? error.message
            : 'Your changes could not be saved. Keep a copy and retry.';
        this.emit();
        return false;
      }
    }
    this.status = 'saved';
    this.emit();
    return true;
  }
  dispose() {
    clearTimeout(this.debounce);
    clearTimeout(this.maxWait);
    this.listeners.clear();
  }
}
