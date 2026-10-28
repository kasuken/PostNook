import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Editor } from '@tiptap/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { WritingEditor } from '../../src/features/editor/WritingEditor';
import {
  emptyDocument,
  textDocument,
  validateDocument,
  type OutputMode,
  type PostDocument,
  type PostNode,
} from '../../src/domain/document';

function setup(content: PostDocument = emptyDocument(), outputMode: OutputMode = 'plain') {
  let editor: Editor | null = null;
  const onChange = vi.fn();
  const onError = vi.fn();
  const view = render(
    <WritingEditor
      initialContent={content}
      onChange={onChange}
      onReady={(e) => {
        if (e) editor = e;
      }}
      onImport={vi.fn()}
      onError={onError}
      outputMode={outputMode}
    />,
  );
  return { get: () => editor!, onChange, onError, ...view };
}
// jsdom has no layout; ProseMirror only needs empty rects to scroll the selection into view.
beforeAll(() => {
  const rects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
  for (const proto of [Range.prototype, Element.prototype]) {
    proto.getClientRects ??= rects;
    proto.getBoundingClientRect ??= () => new DOMRect();
  }
});
const button = (name: string) => screen.getByRole('button', { name });

describe('writing editor', () => {
  it('starts from an empty document with history and clear formatting unavailable', () => {
    const { get } = setup();
    expect(get().getJSON()).toEqual(emptyDocument());
    expect(screen.getByRole('textbox', { name: 'Post content' })).toBeVisible();
    for (const name of ['Undo (Ctrl+Z)', 'Redo (Ctrl+Shift+Z)', 'Clear formatting'])
      expect(button(name)).toBeDisabled();
    for (const name of ['Bold (Ctrl+B)', 'Italic (Ctrl+I)', 'Bullet list', 'Numbered list'])
      expect(button(name)).toBeEnabled();
  });

  it('reports supported JSON and shows active formatting programmatically', () => {
    const { get, onChange } = setup(textDocument('Hello world'));
    act(() => {
      get().chain().setTextSelection({ from: 1, to: 6 }).toggleBold().run();
    });
    expect(button('Bold (Ctrl+B)')).toHaveAttribute('aria-pressed', 'true');
    expect(button('Italic (Ctrl+I)')).toHaveAttribute('aria-pressed', 'false');
    expect(button('Clear formatting')).toBeEnabled();
    expect(button('Undo (Ctrl+Z)')).toBeEnabled();
    const doc = onChange.mock.lastCall![0] as PostDocument;
    expect(validateDocument(doc)).toBe(true);
    expect(doc.content[0]?.content?.[0]).toEqual({
      type: 'text',
      text: 'Hello',
      marks: [{ type: 'bold' }],
    });
  });

  it('applies toolbar formatting without losing the selection', async () => {
    const user = userEvent.setup();
    const { get } = setup(textDocument('Keep this selected'));
    act(() => {
      get().commands.setTextSelection({ from: 6, to: 10 });
    });
    await user.click(button('Italic (Ctrl+I)'));
    await user.click(button('Bold (Ctrl+B)'));
    const { from, to } = get().state.selection;
    expect({ from, to }).toEqual({ from: 6, to: 10 });
    expect(get().state.doc.textBetween(from, to)).toBe('this');
    expect(get().isActive('bold') && get().isActive('italic')).toBe(true);
  });

  it('toggles lists and clears marks and lists back to plain paragraphs', async () => {
    const user = userEvent.setup();
    const { get } = setup(textDocument('One thought'));
    act(() => {
      get().chain().selectAll().toggleBold().run();
    });
    await user.click(button('Numbered list'));
    expect(button('Numbered list')).toHaveAttribute('aria-pressed', 'true');
    await user.click(button('Bullet list'));
    expect(button('Bullet list')).toHaveAttribute('aria-pressed', 'true');
    expect(button('Numbered list')).toHaveAttribute('aria-pressed', 'false');
    act(() => {
      get().commands.selectAll();
    });
    await user.click(button('Clear formatting'));
    expect(get().getJSON()).toEqual(textDocument('One thought'));
    expect(button('Clear formatting')).toBeDisabled();
    await user.click(button('Undo (Ctrl+Z)'));
    expect(get().isActive('bulletList')).toBe(true);
    await user.click(button('Redo (Ctrl+Shift+Z)'));
    expect(get().isActive('bulletList')).toBe(false);
  });

  it('exposes keyboard shortcuts and disables every control while input is locked', () => {
    let editor: Editor | null = null;
    render(
      <WritingEditor
        initialContent={textDocument('Locked')}
        onChange={vi.fn()}
        onReady={(e) => {
          if (e) editor = e;
        }}
        onImport={vi.fn()}
        onError={vi.fn()}
        editable={false}
      />,
    );
    expect(button('Bold (Ctrl+B)')).toHaveAttribute('aria-keyshortcuts', 'Control+B Meta+B');
    expect(button('Redo (Ctrl+Shift+Z)')).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Shift+Z Meta+Shift+Z',
    );
    for (const control of screen.getAllByRole('button')) expect(control).toBeDisabled();
    expect(editor!.isEditable).toBe(false);
  });

  it('explains how internal formatting maps to the selected output mode', () => {
    const { rerender } = setup();
    const textbox = screen.getByRole('textbox', { name: 'Post content' });
    expect(textbox).toHaveAccessibleDescription(/Plain-text output copies your words without/);
    rerender(
      <WritingEditor
        initialContent={emptyDocument()}
        onChange={vi.fn()}
        onReady={vi.fn()}
        onImport={vi.fn()}
        onError={vi.fn()}
        outputMode="unicode"
      />,
    );
    expect(textbox).toHaveAccessibleDescription(/copied as Unicode characters/);
  });

  it('handles long documents and never reports content that fails validation', () => {
    const long = textDocument(Array.from({ length: 400 }, (_, i) => `Line ${i}`).join('\n\n'));
    const { get, onChange, onError } = setup(long);
    expect(get().getJSON()).toEqual(long);
    let deep: PostNode = { type: 'paragraph', content: [{ type: 'text', text: 'deep' }] };
    for (let i = 0; i < 20; i++)
      deep = { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(), deep] }] };
    act(() => {
      get().commands.setContent({ type: 'doc', content: [deep] }, { emitUpdate: true });
    });
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('could not be saved safely'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('converts unsupported pasted HTML into supported nodes inline', () => {
    const { get, onChange } = setup(textDocument('Before after'));
    act(() => {
      get().commands.setTextSelection(8);
    });
    const data = { getData: (type: string) => (type === 'text/html' ? '<h1>Big</h1>' : 'Big') };
    act(() => {
      get().view.dom.dispatchEvent(
        Object.assign(new Event('paste', { bubbles: true, cancelable: true }), {
          clipboardData: data,
        }),
      );
    });
    const doc = onChange.mock.lastCall![0] as PostDocument;
    expect(doc).toEqual(textDocument('Before Bigafter'));
  });
});
const paragraph = (): PostNode => ({ type: 'paragraph', content: [{ type: 'text', text: 'x' }] });
