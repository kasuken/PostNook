# Technical foundation

The side-panel React application owns the active editor and unsaved work. The service worker only enables action-click opening and records initialization errors. It does not store editing state.

## Boundaries

| Layer       | Implementation                                       | Responsibility                                                                              |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Domain      | `src/domain/`                                        | Supported JSON schema, validation, entities, typed errors, repository and adapter contracts |
| Editor      | `src/features/editor/`                               | Tiptap selection, history, formatting, safe paste insertion                                 |
| Output      | `src/services/serializer.ts`                         | Pure deterministic output and UTF-16 estimate                                               |
| Import      | `src/services/markdown.ts`, `paste.ts`               | Markdown adapter and sanitized clipboard conversion                                         |
| Persistence | `src/storage/drafts.ts`                              | Dexie transactions, revision checks, validation, migration boundary                         |
| Autosave    | `src/services/autosave.ts`                           | Dirty generations, debounce, maximum wait, retries, visible state                           |
| Browser     | `src/browser/`                                       | Clipboard and extension preferences adapters                                                |
| UI          | `src/sidepanel/`, `src/components/`, `src/features/` | Shell, dialogs, editor, drafts, preview, settings                                           |
| Extension   | `src/extension/`, `public/manifest.json`             | Packaged worker, action, icons, native panel                                                |

Domain and serializer code have no React, DOM, extension API, or LinkedIn dependency. Clipboard access is isolated. The paste normalizer uses the DOM for inert parsing after DOMPurify sanitation. No feature reads the active website.

## Document and storage

Tiptap JSON supports doc, paragraph, hardBreak, text, bulletList, orderedList, listItem, bold, and italic. StarterKit headings, blockquotes, code, code blocks, rules, strike, links, underline, and trailing-node behavior are disabled. Hard breaks can carry inherited marks. JSON is validated before storage and output; invalid stored records produce a load error rather than a blank replacement. Editor options are created once per mounted draft so app re-renders do not re-apply editor state mid-input. Pasted and imported content share one insertion path (`src/features/editor/insert.ts`): a single paragraph is inserted as an open slice so it merges into the current line, other content stays whole blocks, and each insertion closes the undo group so it is its own undo step. Paste is handled at the DOM `paste` event, before ProseMirror reads the clipboard, so a read failure is reported without changing the document. The insertion does not carry the `paste` UI event, so Tiptap's Markdown-style paste rules never apply to normal paste.

The paste normalizer collapses source-HTML whitespace, reads bold and italic from tags and from inline `font-weight`/`font-style` (Google Docs), rebuilds Word `mso-list` paragraphs as lists, keeps lines and indentation for `pre` and `white-space: pre` blocks (VS Code), turns tables into `A | B` rows, drops spacer paragraphs, and falls back to `text/plain` when the HTML has no text. Styles are read from the sanitized fragment only and never rendered. The Markdown adapter decodes entities as text, keeps soft line breaks as hard breaks, and leaves inline HTML as literal text. Numbered lists always count from 1, matching the plain-text output rule. Toolbar commands expose pressed, disabled, and shortcut state; a note under the editor explains how marks map to the selected output mode.

Dexie database `postnook`, version 1, has `drafts` keyed by `id` and indexed by `updatedAt` and `createdAt`. Drafts use UUID v4, UTC timestamps, a 120-character title maximum, schemaVersion 1, and initial revision 1. Preferences are stored as `settings` in `chrome.storage.local`. The localhost harness uses localStorage instead and never accesses extension drafts.

Updates read, validate, compare the expected revision, and write the complete record inside one read/write transaction. Concurrent stale updates and stale deletes fail. Copy timestamps update only after clipboard success, without replacing content or advancing the content revision.

Autosave waits 300 ms after an edit and persists at least every 1,500 ms during continuous input. A generation counter preserves changes made during an in-flight write. Switching drafts flushes first and locks editing during the transition. A save failure preserves unsaved content. Conflicts offer explicit reload confirmation or a separate recovered copy. Browser closure can still lose edits that have not committed; Saved means the transaction completed.

The migration spike tests `migrateDraftV1` inside a transaction with preserved content and unknown fields. Schema 0 is a synthetic fixture, not a previously released database. Initial production storage remains version 1. Future schema upgrades must register a Dexie `.version(n).upgrade(...)` transaction, validate records, preserve unknown fields, and test rollback. Unknown versions and corrupt records are never deleted automatically.

## Output and errors

`serializePost(document, outputMode)` is shared by preview, counter, and clipboard. Paragraphs use two newlines, hard breaks one, bullets `• `, and ordered items sequential numbering. Nested lists, extra item paragraphs and line breaks inside an item are indented under their marker. Empty list items are left out, and excess blank lines and trailing spaces are normalized. Plain mode ignores emphasis marks; Unicode mode transforms supported marked Latin letters and protects URL, hashtag, and mention spans across mark boundaries. Original JSON stays unchanged. Unsupported characters remain ordinary text. Unicode accessibility and external rendering limitations are explained before use.

The 3,000 limit and 2,900 warning use UTF-16 code units, not a verified LinkedIn counting algorithm. Storage errors are typed as conflict, unavailable, quota, invalid, or missing. Save/copy success is announced only after promises resolve. Clipboard failure provides selectable text. A missing active draft requires an explicit action to open remaining drafts. Panel setup retry updates its status without reloading the editor.

Only `sidePanel` and `storage` permissions are packaged. No host permissions, content scripts, remote code, backend, telemetry, or LinkedIn interactions exist. CSP blocks network connections. Styles allow editor inline attributes; scripts are restricted to packaged code.

## Remaining work

This is a Sprint 0 proof of concept with real services, not a completed v0.1 release. Release CI, performance measurements on reference hardware, macOS/previous-major compatibility, manual LinkedIn paste checks, independent review, and marketplace assets remain in their existing epics. The editor bundle triggers Vite's size advisory; profile startup before choosing where to split it.
