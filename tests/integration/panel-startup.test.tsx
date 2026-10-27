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

  it('shows a recoverable error when browser storage cannot be read', async () => {
    stubChrome(() => Promise.reject(new Error('storage unavailable')));
    render(<App />);
    expect(await screen.findByText('storage unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry loading/i })).toBeEnabled();
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
