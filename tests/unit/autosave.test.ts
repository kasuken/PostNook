import { afterEach, describe, expect, it, vi } from 'vitest';
import { AutosaveService } from '../../src/services/autosave';
import { DraftError, type Draft, type DraftRepository } from '../../src/domain/contracts';
import { textDocument } from '../../src/domain/document';
const draft: Draft = {
  id: crypto.randomUUID(),
  title: 'Test',
  content: textDocument('Initial'),
  revision: 1,
  schemaVersion: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastCopiedAt: null,
};
function setup() {
  const updateDraft = vi
    .fn<DraftRepository['updateDraft']>()
    .mockImplementation(async (_id, revision, content, title) => ({
      ...draft,
      revision: revision + 1,
      content,
      title,
    }));
  const repo: DraftRepository = {
    updateDraft,
    createDraft: vi.fn(),
    getDraft: vi.fn(),
    listDrafts: vi.fn(),
    deleteDraft: vi.fn(),
    updateLastCopiedAt: vi.fn(),
  };
  return { service: new AutosaveService(draft, repo), updateDraft };
}
afterEach(() => {
  vi.useRealTimers();
});
describe('honest autosave', () => {
  it('debounces and forces periodic persistence during continuous input', async () => {
    vi.useFakeTimers();
    const { service, updateDraft } = setup();
    for (let n = 0; n < 15; n++) {
      service.edit(textDocument(String(n)));
      await vi.advanceTimersByTimeAsync(100);
    }
    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(service.snapshot().status).toBe('saved');
    service.dispose();
  });
  it('preserves newer edits while an earlier write is pending', async () => {
    const { service, updateDraft } = setup();
    let resolve!: (draft: Draft) => void;
    updateDraft.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    service.edit(textDocument('First'));
    const pending = service.flush();
    service.edit(textDocument('Second'));
    resolve({ ...draft, revision: 2, content: textDocument('First') });
    await pending;
    expect(updateDraft).toHaveBeenLastCalledWith(draft.id, 2, textDocument('Second'), 'Test');
    expect(service.draft.revision).toBe(3);
    expect(service.draft.content).toEqual(textDocument('Second'));
    service.dispose();
  });
  it('retains unsaved content after failure and changes status only after explicit retry succeeds', async () => {
    const { service, updateDraft } = setup();
    updateDraft.mockRejectedValueOnce(new DraftError('unavailable', 'Storage unavailable'));
    service.edit(textDocument('Important'));
    expect(await service.flush()).toBe(false);
    expect(service.snapshot().status).toBe('failed');
    expect(service.draft.content).toEqual(textDocument('Important'));
    expect(await service.flush()).toBe(true);
    expect(service.snapshot().status).toBe('saved');
    service.dispose();
  });
  it('never advances a revision when a stale write is rejected', async () => {
    const { service, updateDraft } = setup();
    updateDraft.mockRejectedValue(new DraftError('conflict', 'A newer version exists'));
    service.edit(textDocument('Mine'));
    await service.flush();
    expect(service.snapshot().status).toBe('conflict');
    expect(service.draft.revision).toBe(1);
    service.dispose();
  });
});
