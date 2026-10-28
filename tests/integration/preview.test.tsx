import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PostPreview } from '../../src/features/preview/PostPreview';

describe('PostPreview', () => {
  it('shows the given output verbatim with the rendering disclaimer', () => {
    const text = 'First\n\n• One\n   • Nested\n\nLast';
    render(<PostPreview text={text} mode="desktop" onMode={() => {}} />);
    const post = screen.getByRole('article', { name: 'Post text preview' });
    expect(post.querySelector('.preview-text')?.textContent).toBe(text);
    expect(post).toHaveAccessibleDescription(
      'LinkedIn may render the pasted post differently. You’ll paste and publish it yourself.',
    );
    expect(post).toHaveAttribute('tabindex', '0');
    expect(post.querySelector('img, a, iframe')).toBeNull();
  });
  it('switches between desktop and mobile presentation', async () => {
    const onMode = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<PostPreview text="Hi" mode="desktop" onMode={onMode} />);
    expect(screen.getByRole('button', { name: 'Desktop preview', pressed: true })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Mobile preview' }));
    expect(onMode).toHaveBeenCalledWith('mobile');
    rerender(<PostPreview text="Hi" mode="mobile" onMode={onMode} />);
    expect(screen.getByRole('button', { name: 'Mobile preview', pressed: true })).toBeVisible();
    expect(screen.getByRole('article')).toHaveClass('mobile');
  });
  it('explains a draft that cannot be serialized instead of showing an empty post', () => {
    render(<PostPreview text="" failed mode="desktop" onMode={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('could not be turned into post text');
    expect(screen.queryByRole('article')).toBeNull();
  });
});
