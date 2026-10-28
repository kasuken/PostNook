# Architecture

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

Updates read, validate, compare the expected revision, and write the complete record inside one read/write transaction. Concurrent stale updates and stale deletes fail. Listing reads every record, returns the readable drafts newest first by `updatedAt`, and counts records that fail validation; those stay in the database untouched and the panel reports how many could not be read. Copy timestamps update only after clipboard success, without replacing content or advancing the content revision.

Autosave waits 300 ms after an edit and persists at least every 1,500 ms during continuous input. Window `blur`, `visibilitychange` and `pagehide` flush pending edits immediately. A generation counter preserves changes made during an in-flight write. The save states are Saved, Saving, Unsaved changes, Save failed, Storage unavailable and Newer version found; the three error states persist through further typing until an explicit retry succeeds. Creating, switching and deleting flush first and lock editing during the transition; if the flush fails the action stops, the current draft stays open and the reason is shown outside any dialog. A save failure preserves unsaved content. Conflicts offer explicit reload confirmation or a separate recovered copy. Browser closure can still lose edits that have not committed; Saved means the transaction completed.

The migration spike tests `migrateDraftV1` inside a transaction with preserved content and unknown fields. Schema 0 is a synthetic fixture, not a previously released database. Initial production storage remains version 1. Future schema upgrades must register a Dexie `.version(n).upgrade(...)` transaction, validate records, preserve unknown fields, and test rollback. Unknown versions and corrupt records are never deleted automatically.

## Service contracts

The PRD section 10 contracts live in `src/domain/contracts.ts` and are implemented as follows. UI code depends on these contracts, not on Dexie, the clipboard API or `chrome.storage` directly.

| Contract           | Implementation                                     | Operations                                                                                                                                                                                                                                            |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DraftRepository    | `IndexedDraftRepository` (`src/storage/drafts.ts`) | `createDraft`, `getDraft`, `listDrafts` (readable drafts plus an unreadable count), `updateDraft(id, expectedRevision, content, title)` returning the new revision or a typed `DraftError`, `deleteDraft(id, expectedRevision)`, `updateLastCopiedAt` |
| PostSerializer     | `serializePost`, `validateDocument`                | Pure and deterministic; throws on an unsupported document rather than copying it                                                                                                                                                                      |
| MarkdownAdapter    | `MarkedAdapter` (`src/services/markdown.ts`)       | `parse` (200,000-character limit, inert HTML), `serialize` for tests and portability; clipboard output never uses Markdown                                                                                                                            |
| PasteNormalizer    | `src/services/paste.ts`                            | `normalizePlainText`, `normalizeHtml` (DOMPurify, then inert parsing), `parseSupportedClipboardContent`                                                                                                                                               |
| CharacterCounter   | `countCharacters`, `getLimitStatus`                | UTF-16 estimate of the serialized text; normal, approaching (from 2,900) and over (above 3,000)                                                                                                                                                       |
| ClipboardService   | `BrowserClipboard` (`src/browser/clipboard.ts`)    | `copyText` resolves `{ ok: true }` only after `writeText` resolves, otherwise an actionable message                                                                                                                                                   |
| SettingsRepository | `BrowserSettings` (`src/browser/settings.ts`)      | `load` validates and defaults each field and rejects newer schemas; `save`. An unreadable store opens the panel with session-only defaults                                                                                                            |
| AutosaveService    | `src/services/autosave.ts`                         | Dirty generations, debounce and maximum wait, flush, explicit retry, conflict detection, observable status                                                                                                                                            |

## Output and errors

`serializePost(document, outputMode)` is shared by preview, counter, and clipboard. Paragraphs use two newlines, hard breaks one, bullets `• `, and ordered items sequential numbering. Nested lists, extra item paragraphs and line breaks inside an item are indented under their marker. Empty list items are left out, and excess blank lines and trailing spaces are normalized. Plain mode ignores emphasis marks; Unicode mode transforms supported marked Latin letters and protects URL, hashtag, and mention spans across mark boundaries. Original JSON stays unchanged. Unsupported characters remain ordinary text. Unicode accessibility and external rendering limitations are explained before use.

The 3,000 limit and 2,900 warning use UTF-16 code units, not a verified LinkedIn counting algorithm. Storage errors are typed as conflict, unavailable, quota, invalid, or missing. Save/copy success is announced only after promises resolve. Clipboard failure provides selectable text. A missing active draft requires an explicit action to open remaining drafts. Panel setup retry updates its status without reloading the editor.

Only `sidePanel` and `storage` permissions are packaged. No host permissions, content scripts, remote code, backend, telemetry, or LinkedIn interactions exist. CSP blocks network connections. Styles allow editor inline attributes; scripts are restricted to packaged code.

## Validation and release

CI (`.github/workflows/ci.yml`) runs on pull requests and `main`: install, type check, lint, formatting, unit and integration tests, production build with the manifest check and security audit, Playwright on Chromium, packaging, and artifact upload. The release workflow (`.github/workflows/release.yml`) runs on `v*.*.*` tags: it checks the tag against `package.json` and the manifest, validates, packages Chrome and Edge ZIPs with SHA-256 checksums and creates a draft GitHub release. Store submission is manual ([store submission](release/store-submission.md)).

Browser evidence is in [browser testing](testing/browser-testing.md) and [QA evidence](testing/qa-matrix.md). The editor bundle triggers Vite's size advisory; startup is measured at about 0.5 s, so splitting it is not needed for v0.1.
