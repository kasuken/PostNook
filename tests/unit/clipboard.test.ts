import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserClipboard } from '../../src/browser/clipboard';
afterEach(() => vi.unstubAllGlobals());
describe('clipboard result', () => {
  it('returns an actionable fallback when the browser API is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    expect(await new BrowserClipboard().copyText('Keep this text')).toMatchObject({
      ok: false,
      message: expect.stringContaining('Ctrl+C'),
    });
  });
  it('reports success only when writeText resolves', async () => {
    let resolve!: () => void;
    const writeText = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    let done = false;
    const result = new BrowserClipboard().copyText('Hello').then((r) => {
      done = true;
      return r;
    });
    await Promise.resolve();
    expect(done).toBe(false);
    resolve();
    expect(await result).toEqual({ ok: true });
  });
  it('returns actionable failure for rejection and does not copy empty content', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await new BrowserClipboard().copyText('Text')).toMatchObject({
      ok: false,
      message: expect.stringContaining('Ctrl+C'),
    });
    await new BrowserClipboard().copyText(' ');
    expect(writeText).toHaveBeenCalledTimes(1);
  });
});
