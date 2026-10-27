import Dexie, { type Table } from 'dexie';
import { DraftError, type Draft, type DraftRepository } from '../domain/contracts';
import { validateDocument, type PostDocument } from '../domain/document';

export class PostNookDatabase extends Dexie {
  drafts!: Table<Draft, string>;
  constructor(name = 'postnook') {
    super(name);
    this.version(1).stores({ drafts: 'id, updatedAt, createdAt' });
  }
}
export function validateDraft(value: unknown): asserts value is Draft {
  const d = value as Draft;
  if (
    !d ||
    typeof d !== 'object' ||
    typeof d.id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.id) ||
    typeof d.title !== 'string' ||
    d.title.length > 120 ||
    d.schemaVersion !== 1 ||
    !Number.isSafeInteger(d.revision) ||
    d.revision < 1 ||
    !validateDocument(d.content) ||
    ![d.createdAt, d.updatedAt].every(
      (t) => typeof t === 'string' && t.endsWith('Z') && Number.isFinite(Date.parse(t)),
    ) ||
    !(
      d.lastCopiedAt === null ||
      (typeof d.lastCopiedAt === 'string' &&
        d.lastCopiedAt.endsWith('Z') &&
        Number.isFinite(Date.parse(d.lastCopiedAt)))
    )
  ) {
    throw new DraftError(
      'invalid',
      'This draft could not be read safely. Its stored content has not been replaced.',
    );
  }
}
// Reusable migration boundary. Unknown fields survive; unknown schemas are rejected,
// never deleted. Future Dexie upgrade transactions must call this before committing.
export function migrateDraftV1(raw: unknown): Draft {
  if (!raw || typeof raw !== 'object') throw new DraftError('invalid', 'Invalid stored draft.');
  const next = structuredClone(raw) as Draft;
  if (next.schemaVersion === 0) next.schemaVersion = 1;
  validateDraft(next);
  return next;
}
function storageError(error: unknown): never {
  if (error instanceof DraftError) throw error;
  if (error instanceof Error && /quota/i.test(error.name))
    throw new DraftError(
      'quota',
      'Device storage is full. Keep a copy of your post, free some space, and retry.',
    );
  throw new DraftError(
    'unavailable',
    'Local storage is unavailable. Keep this window open and retry, or copy your text somewhere safe.',
  );
}
export class IndexedDraftRepository implements DraftRepository {
  constructor(public db = new PostNookDatabase()) {}
  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      await this.db.open();
      return await operation();
    } catch (error) {
      return storageError(error);
    }
  }
  async createDraft(title: string, content: PostDocument) {
    return this.run(async () => {
      const now = new Date().toISOString();
      const draft: Draft = {
        id: crypto.randomUUID(),
        title,
        content: structuredClone(content),
        schemaVersion: 1,
        revision: 1,
        createdAt: now,
        updatedAt: now,
        lastCopiedAt: null,
      };
      validateDraft(draft);
      await this.db.drafts.add(draft);
      return draft;
    });
  }
  async getDraft(id: string) {
    return this.run(async () => {
      const draft = await this.db.drafts.get(id);
      if (!draft)
        throw new DraftError(
          'missing',
          'This draft is no longer available. Your unsaved text is still in the editor.',
        );
      validateDraft(draft);
      return draft;
    });
  }
  async listDrafts() {
    return this.run(async () => {
      const drafts = await this.db.drafts.orderBy('updatedAt').reverse().toArray();
      // A bad record is surfaced, never silently skipped or replaced.
      drafts.forEach(validateDraft);
      return drafts;
    });
  }
  async updateDraft(id: string, expectedRevision: number, content: PostDocument, title: string) {
    return this.run(() =>
      this.db.transaction('rw', this.db.drafts, async () => {
        const current = await this.db.drafts.get(id);
        if (!current)
          throw new DraftError(
            'missing',
            'This draft was deleted in another window. Keep a separate copy of your text.',
          );
        validateDraft(current);
        if (current.revision !== expectedRevision)
          throw new DraftError(
            'conflict',
            'A newer version was saved in another window. Keep your changes as a separate draft, or reload the saved version.',
          );
        const next: Draft = {
          ...current,
          content: structuredClone(content),
          title,
          updatedAt: new Date().toISOString(),
          revision: current.revision + 1,
        };
        validateDraft(next);
        await this.db.drafts.put(next);
        return next;
      }),
    );
  }
  async deleteDraft(id: string, expectedRevision: number) {
    return this.run(() =>
      this.db.transaction('rw', this.db.drafts, async () => {
        const current = await this.db.drafts.get(id);
        if (current && current.revision !== expectedRevision)
          throw new DraftError(
            'conflict',
            'This draft changed in another window. Reload before deleting it.',
          );
        await this.db.drafts.delete(id);
      }),
    );
  }
  async updateLastCopiedAt(id: string, timestamp: string) {
    return this.run(() =>
      this.db.transaction('rw', this.db.drafts, async () => {
        if (!timestamp.endsWith('Z') || !Number.isFinite(Date.parse(timestamp)))
          throw new DraftError('invalid', 'Invalid copy timestamp.');
        const current = await this.db.drafts.get(id);
        if (!current)
          throw new DraftError(
            'missing',
            'Text copied, but the draft no longer exists to record the copy time.',
          );
        validateDraft(current);
        await this.db.drafts.put({ ...current, lastCopiedAt: timestamp });
      }),
    );
  }
}
