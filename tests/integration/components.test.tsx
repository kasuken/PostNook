import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, IconButton, SaveIndicator } from '../../src/components/ui';
import { SettingsPanel } from '../../src/features/settings/SettingsPanel';
import { defaultSettings } from '../../src/domain/contracts';
describe('UI foundations', () => {
  it('exposes toolbar state and keeps disabled actions inoperable', async () => {
    const click = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <IconButton label="Bold" aria-pressed>
          {' '}
          B{' '}
        </IconButton>
        <Button disabled onClick={click}>
          Unavailable
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Bold', pressed: true })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Unavailable' }));
    expect(click).not.toHaveBeenCalled();
  });
  it('exposes meaningful save state independent of color', () => {
    const { rerender } = render(<SaveIndicator status="dirty" />);
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');
    rerender(<SaveIndicator status="failed" />);
    expect(screen.getByRole('status')).toHaveTextContent('Save failed');
  });
  it('supports keyboard theme selection without a pointer', async () => {
    const change = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel settings={defaultSettings} onChange={change} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'System' })).toHaveFocus();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(change).toHaveBeenCalledWith({ ...defaultSettings, theme: 'light' });
  });
});
