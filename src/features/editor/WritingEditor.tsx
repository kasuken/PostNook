import { useEffect, useRef } from 'react';
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
import { validateDocument, type PostDocument } from '../../domain/document';
import { parseSupportedClipboardContent } from '../../services/paste';

interface Props {
  initialContent: PostDocument;
  onChange: (doc: PostDocument) => void;
  onReady: (editor: Editor | null) => void;
  onImport: () => void;
  onError: (message: string) => void;
  hidden?: boolean;
  editable?: boolean;
}
export function WritingEditor({
  initialContent,
  onChange,
  onReady,
  onImport,
  onError,
  hidden,
  editable = true,
}: Props) {
  const callbacks = useRef({ onChange, onError });
  useEffect(() => {
    callbacks.current = { onChange, onError };
  }, [onChange, onError]);
  const editor = useEditor({
    extensions: editorExtensions(),
    content: initialContent,
    injectCSS: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Post content',
        'aria-multiline': 'true',
        spellcheck: 'true',
        dir: 'auto',
      },
      handlePaste(view, event) {
        if (!event.clipboardData) return false;
        try {
          const doc = parseSupportedClipboardContent(event.clipboardData);
          const content = view.state.schema.nodeFromJSON(doc).content;
          view.dispatch(view.state.tr.replaceSelection(new Slice(content, 0, 0)).scrollIntoView());
        } catch (error) {
          callbacks.current.onError(
            error instanceof Error ? error.message : 'Paste failed. Your draft is unchanged.',
          );
        }
        return true;
      },
    },
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
      undo: e?.can().undo(),
      redo: e?.can().redo(),
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
            label="Bold (Ctrl+B)"
            aria-pressed={active?.bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={17} />
          </IconButton>
          <IconButton
            label="Italic (Ctrl+I)"
            aria-pressed={active?.italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={17} />
          </IconButton>
          <IconButton
            label="Bullet list"
            aria-pressed={active?.bullet}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={18} />
          </IconButton>
          <IconButton
            label="Numbered list"
            aria-pressed={active?.ordered}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={18} />
          </IconButton>
        </div>
        <div className="toolbar-group">
          <IconButton
            label="Undo (Ctrl+Z)"
            disabled={!active?.undo}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={17} />
          </IconButton>
          <IconButton
            label="Redo (Ctrl+Shift+Z)"
            disabled={!active?.redo}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={17} />
          </IconButton>
          <IconButton
            label="Clear formatting"
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
      <p className="editor-note">A little space to make your point.</p>
    </section>
  );
}
