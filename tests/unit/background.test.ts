import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('records initialization failure and clears it after a successful retry', async () => {
  const setPanelBehavior = vi
    .fn()
    .mockRejectedValueOnce(new Error('API unavailable'))
    .mockResolvedValue(undefined);
  const set = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);
  const setBadgeText = vi.fn().mockResolvedValue(undefined);
  const onMessage = { addListener: vi.fn() };
  vi.stubGlobal('chrome', {
    sidePanel: { setPanelBehavior },
    storage: { local: { set, remove } },
    action: { setBadgeText },
    runtime: {
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() },
      onMessage,
    },
  });
  await import('../../src/extension/background');
  await vi.waitFor(() => expect(setBadgeText).toHaveBeenCalledWith({ text: '!' }));
  expect(set).toHaveBeenCalledWith({ panelError: expect.stringContaining('could not enable') });
  const respond = vi.fn();
  expect(onMessage.addListener.mock.calls[0]?.[0]({ type: 'retry-panel' }, {}, respond)).toBe(true);
  await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({ done: true }));
  expect(setPanelBehavior).toHaveBeenLastCalledWith({ openPanelOnActionClick: true });
  expect(remove).toHaveBeenCalledWith('panelError');
  expect(setBadgeText).toHaveBeenLastCalledWith({ text: '' });
});
