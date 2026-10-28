import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/sidepanel/App';

function stubChrome(get: (key: string) => Promise<Record<string, unknown>>) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
  vi.stubGlobal('chrome', {
    runtime: { id: 'postnook-test', sendMessage: vi.fn().mockResolvedValue({ done: true }) },
    storage: { local: { get, set: vi.fn().mockResolvedValue(undefined) } },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('side panel startup', () => {
  it('shows a usable first-run state when no drafts exist', async () => {
    stubChrome(() => Promise.resolve({}));
    render(<App />);
    expect(await screen.findByRole('button', { name: /create first post/i })).toBeEnabled();
  });

  it('keeps the drafts usable when preferences cannot be read, without overwriting them', async () => {
    stubChrome(() => Promise.reject(new Error('storage unavailable')));
    const set = chrome.storage.local.set;
    render(<App />);
    expect(await screen.findByText(/storage unavailable/)).toHaveTextContent(
      'Default preferences are used for now',
    );
    expect(screen.getByRole('button', { name: /retry preferences/i })).toBeEnabled();
    expect(await screen.findByRole('button', { name: /create first post/i })).toBeEnabled();
    expect(set).not.toHaveBeenCalled();
  });

  it('opens drafts with default preferences when they come from a newer version', async () => {
    stubChrome((key) =>
      Promise.resolve(key === 'settings' ? { settings: { settingsSchemaVersion: 2 } } : {}),
    );
    render(<App />);
    expect(await screen.findByText(/saved by a newer PostNook version/)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /create first post/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /retry loading/i })).toBeNull();
  });

  it('offers retry when the background worker recorded a setup failure', async () => {
    stubChrome((key) =>
      Promise.resolve(
        key === 'panelError' ? { panelError: 'Could not enable the side panel.' } : {},
      ),
    );
    render(<App />);
    expect(await screen.findByText('Could not enable the side panel.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry panel setup/i })).toBeEnabled();
  });
});
