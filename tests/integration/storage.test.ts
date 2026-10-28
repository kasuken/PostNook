import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndexedDraftRepository, PostNookDatabase, migrateDraftV1 } from '../../src/storage/drafts';
import { textDocument } from '../../src/domain/document';
import type { Draft } from '../../src/domain/contracts';
const databases: PostNookDatabase[] = [];
const repository = () => {
  const db = new PostNookDatabase('test-' + crypto.randomUUID());
  databases.push(db);
  return new IndexedDraftRepository(db);
};
afterEach(async () => {
  for (const db of databases.splice(0)) await db.delete();
});

describe('transactional drafts', () => {
  it('creates, updates, reopens, records a successful copy, sorts, and deletes', async () => {
    const repo = repository();
    const draft = await repo.createDraft('First', textDocument('One'));
    const changed = await repo.updateDraft(draft.id, 1, textDocument('Two'), 'Renamed');
    expect(changed.revision).toBe(2);
    repo.db.close();
    expect((await repo.getDraft(draft.id)).content).toEqual(textDocument('Two'));
    await repo.updateLastCopiedAt(draft.id, '2026-10-27T21:00:00.000Z');
    expect((await repo.getDraft(draft.id)).lastCopiedAt).toBe('2026-10-27T21:00:00.000Z');
    expect((await repo.listDrafts()).drafts[0]?.title).toBe('Renamed');
    await repo.deleteDraft(draft.id, 2);
    await expect(repo.getDraft(draft.id)).rejects.toMatchObject({ code: 'missing' });
  });
  it('allows only one concurrent writer for the same revision', async () => {
    const repo = repository();
    const d = await repo.createDraft('Test', textDocument('Original'));
    const result = await Promise.allSettled([
      repo.updateDraft(d.id, 1, textDocument('A'), 'A'),
      repo.updateDraft(d.id, 1, textDocument('B'), 'B'),
    ]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(result.filter((r) => r.status === 'rejected')[0]).toMatchObject({
      reason: { code: 'conflict' },
    });
    await expect(repo.deleteDraft(d.id, 1)).rejects.toMatchObject({ code: 'conflict' });
  });
  it('rolls back even if a write fails after replacing the record', async () => {
    const repo = repository();
    const d = await repo.createDraft('Test', textDocument('Original'));
    const originalPut = repo.db.drafts.put.bind(repo.db.drafts);
    vi.spyOn(repo.db.drafts, 'put').mockImplementationOnce((value) =>
      originalPut(value).then(() => {
        throw new DOMException('Full', 'QuotaExceededError');
      }),
    );
    await expect(repo.updateDraft(d.id, 1, textDocument('Lost?'), 'Changed')).rejects.toMatchObject(
      { code: 'quota' },
    );
    expect(await repo.getDraft(d.id)).toEqual(d);
  });
  it('migrates known documents in a transaction without losing content or unknown fields', async () => {
    const repo = repository();
    const d = await repo.createDraft('Keep me', textDocument('こんにちは'));
    const old = { ...d, schemaVersion: 0, futureMetadata: 'preserve me' };
    await repo.db.drafts.put(old);
    await repo.db.transaction('rw', repo.db.drafts, async () => {
      for (const record of await repo.db.drafts.toArray())
        await repo.db.drafts.put(migrateDraftV1(record));
    });
    expect(await repo.db.drafts.get(d.id)).toEqual({ ...old, schemaVersion: 1 });
  });
  it('reports corrupt and future records without deleting or replacing them', async () => {
    const repo = repository();
    const readable = await repo.createDraft('Readable', textDocument('Still here'));
    const d = await repo.createDraft('Safe', textDocument('Keep'));
    const future: Draft = { ...d, schemaVersion: 99 };
    await repo.db.drafts.put(future);
    await repo.db.drafts.put({ id: crypto.randomUUID() } as Draft);
    expect(await repo.listDrafts()).toEqual({ drafts: [readable], unreadable: 2 });
    await expect(repo.getDraft(d.id)).rejects.toMatchObject({ code: 'invalid' });
    expect(await repo.db.drafts.get(d.id)).toEqual(future);
    expect(await repo.db.drafts.count()).toBe(3);
    expect(() => migrateDraftV1(future)).toThrow();
  });
  it('lists drafts newest first by last modification', async () => {
    const repo = repository();
    const make = async (title: string, updatedAt: string) => {
      const d = await repo.createDraft(title, textDocument(title));
      await repo.db.drafts.put({ ...d, updatedAt });
    };
    await make('Middle', '2026-10-02T09:00:00.000Z');
    await make('Newest', '2026-10-03T09:00:00.000Z');
    await make('Oldest', '2026-10-01T09:00:00.000Z');
    const { drafts } = await repo.listDrafts();
    expect(drafts.map((d) => d.title)).toEqual(['Newest', 'Middle', 'Oldest']);
    const oldest = drafts[2]!;
    await repo.updateDraft(oldest.id, oldest.revision, oldest.content, 'Edited');
    expect((await repo.listDrafts()).drafts[0]?.title).toBe('Edited');
  });
  it('keeps version 1 drafts through a Dexie upgrade that runs the migration', async () => {
    const name = 'test-' + crypto.randomUUID();
    const v1 = new PostNookDatabase(name);
    const repo = new IndexedDraftRepository(v1);
    const d = await repo.createDraft('Before upgrade', textDocument('Kept across versions'));
    await v1.drafts.put({ ...d, schemaVersion: 0 });
    v1.close();
    // Test-only v2: production storage stays at version 1.
    class UpgradedDatabase extends PostNookDatabase {
      constructor() {
        super(name);
        this.version(2)
          .stores({ drafts: 'id, updatedAt, createdAt' })
          .upgrade((tx) =>
            tx
              .table('drafts')
              .toCollection()
              .modify((record: Draft, ref: { value: Draft }) => {
                ref.value = migrateDraftV1(record);
              }),
          );
      }
    }
    const v2 = new UpgradedDatabase();
    databases.push(v2);
    expect(await new IndexedDraftRepository(v2).getDraft(d.id)).toEqual(d);
  });
});
