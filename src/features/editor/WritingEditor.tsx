import { useEffect, useId, useRef, useState } from 'react';
import type { EditorProps } from '@tiptap/pm/view';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import { Slice } from '@tiptap/pm/model';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  RemoveFormatting,
  FileDown,
} from 'lucide-react';
import { editorExtensions } from './extensions';
import { IconButton } from '../../components/ui';
import { validateDocument, type OutputMode, type PostDocument } from '../../domain/document';
import { parseSupportedClipboardContent } from '../../services/paste';

interface Props {
  initialContent: PostDocument;
  onChange: (doc: PostDocument) => void;
  onReady: (editor: Editor | null) => void;
  onImport: () => void;
  onError: (message: string) => void;
  hidden?: boolean;
  editable?: boolean;
  outputMode?: OutputMode;
}
const mod =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd' : 'Ctrl';
// Clear formatting is only meaningful when the selection carries marks or sits in a list.
function hasFormatting(editor: Editor) {
  if (editor.isActive('bulletList') || editor.isActive('orderedList')) return true;
  const { state } = editor;
  const { from, to, empty, $from } = state.selection;
  if (empty) return (state.storedMarks ?? $from.marks()).length > 0;
  let found = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (node.marks.length) found = true;
    return !found;
  });
  return found;
}
export function WritingEditor({
  initialContent,
  onChange,
  onReady,
  onImport,
  onError,
  hidden,
  editable = true,
  outputMode = 'plain',
}: Props) {
  const noteId = useId();
  const callbacks = useRef({ onChange, onError });
  useEffect(() => {
    callbacks.current = { onChange, onError };
  }, [onChange, onError]);
  // Options must keep their identity across renders: changed options make Tiptap reapply
  // the editor state, which can drop a DOM selection the browser has not reported yet.
  const [options] = useState(() => ({
    extensions: editorExtensions(),
    content: initialContent,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Post content',
        'aria-multiline': 'true',
        spellcheck: 'true',
        dir: 'auto',
        'aria-describedby': noteId,
      },
      handlePaste(view, event) {
        if (!event.clipboardData) return false;
        try {
          const doc = parseSupportedClipboardContent(event.clipboardData);
          const content = view.state.schema.nodeFromJSON(doc).content;
          // A single pasted paragraph joins the current line; lists and multiple paragraphs
          // stay whole blocks instead of merging their first item into the surrounding text.
          const inline = content.childCount === 1 && content.firstChild?.type.name === 'paragraph';
          const slice = inline ? Slice.maxOpen(content) : new Slice(content, 0, 0);
          view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView());
        } catch (error) {
          callbacks.current.onError(
            error instanceof Error ? error.message : 'Paste failed. Your draft is unchanged.',
          );
        }
        return true;
      },
    } satisfies EditorProps,
  }));
  const editor = useEditor({
    ...options,
    injectCSS: false,
    onUpdate({ editor }) {
      const doc = editor.getJSON();
      if (validateDocument(doc)) callbacks.current.onChange(doc);
      else
        callbacks.current.onError(
          'This content could not be saved safely. Undo the change or keep a copy.',
        );
    },
  });
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive('bold'),
      italic: e?.isActive('italic'),
      bullet: e?.isActive('bulletList'),
      ordered: e?.isActive('orderedList'),
      canBold: e?.can().toggleBold(),
      canItalic: e?.can().toggleItalic(),
      canBullet: e?.can().toggleBulletList(),
      canOrdered: e?.can().toggleOrderedList(),
      undo: e?.can().undo(),
      redo: e?.can().redo(),
      clear: e ? hasFormatting(e) : false,
    }),
  });
  useEffect(() => {
    // A temporary input lock is not a document edit or a new storage revision.
    editor?.setEditable(editable, false);
    onReady(editor);
    return () => onReady(null);
  }, [editor, onReady, editable]);
  if (!editor) return <p>Preparing your writing space…</p>;
  return (
    <section className="writing-pane" hidden={hidden} aria-label="Writing editor">
      <fieldset className="editor-toolbar" aria-label="Formatting controls" disabled={!editable}>
        <div className="toolbar-group">
          <IconButton
            label={`Bold (${mod}+B)`}
            aria-keyshortcuts="Control+B Meta+B"
            aria-pressed={active?.bold}
            disabled={!active?.canBold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={17} />
          </IconButton>
          <IconButton
            label={`Italic (${mod}+I)`}
            aria-keyshortcuts="Control+I Meta+I"
            aria-pressed={active?.italic}
            disabled={!active?.canItalic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={17} />
          </IconButton>
          <IconButton
            label="Bullet list"
            aria-keyshortcuts="Control+Shift+8 Meta+Shift+8"
            aria-pressed={active?.bullet}
            disabled={!active?.canBullet}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={18} />
          </IconButton>
          <IconButton
            label="Numbered list"
            aria-keyshortcuts="Control+Shift+7 Meta+Shift+7"
            aria-pressed={active?.ordered}
            disabled={!active?.canOrdered}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={18} />
          </IconButton>
        </div>
        <div className="toolbar-group">
          <IconButton
            label={`Undo (${mod}+Z)`}
            aria-keyshortcuts="Control+Z Meta+Z"
            disabled={!active?.undo}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={17} />
          </IconButton>
          <IconButton
            label={`Redo (${mod}+Shift+Z)`}
            aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
            disabled={!active?.redo}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={17} />
          </IconButton>
          <IconButton
            label="Clear formatting"
            disabled={!active?.clear}
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            <RemoveFormatting size={18} />
          </IconButton>
          <IconButton label="Paste as Markdown" onClick={onImport}>
            <FileDown size={18} />
          </IconButton>
        </div>
      </fieldset>
      <div className="writing-scroll">
        <EditorContent editor={editor} />
      </div>
      <p className="editor-note" id={noteId}>
        {outputMode === 'plain'
          ? 'Bold and italic help you shape this draft. Plain-text output copies your words without that styling.'
          : 'Bold and italic are copied as Unicode characters where possible. Other text stays unstyled on LinkedIn.'}
      </p>
    </section>
  );
}
