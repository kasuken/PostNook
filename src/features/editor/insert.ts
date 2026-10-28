import type { EditorView } from '@tiptap/pm/view';
import { Slice } from '@tiptap/pm/model';
import { closeHistory } from '@tiptap/pm/history';
import type { PostDocument } from '../../domain/document';

// Inserts converted content at the selection as its own undo step, even right after typing.
// A single paragraph joins the current line; lists and multiple paragraphs stay whole blocks
// instead of merging their first item into the surrounding text.
export function insertDocument(view: EditorView, document: PostDocument) {
  const content = view.state.schema.nodeFromJSON(document).content;
  const inline = content.childCount === 1 && content.firstChild?.type.name === 'paragraph';
  const slice = inline ? Slice.maxOpen(content) : new Slice(content, 0, 0);
  // No 'paste' uiEvent meta: it would run Tiptap's paste rules and turn literal **text** bold.
  view.dispatch(closeHistory(view.state.tr).replaceSelection(slice).scrollIntoView());
}
