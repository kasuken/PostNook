# Technical foundation status

Implementation date: 2026-10-27. Target: E00, Sprint 0. This records engineering work, not completion of the full MVP.

| Task                     | Issue                                                | Status          | Evidence                                                                                 |
| ------------------------ | ---------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| TF-001 scaffold          | [#24](https://github.com/kasuken/PostNook/issues/24) | Implemented     | Strict TS, pinned lockfile, commands, service boundaries, clean install/build            |
| TF-002 native panel      | [#25](https://github.com/kasuken/PostNook/issues/25) | Implemented     | Packaged action opening in Chrome/Edge; manifest allowlist and initialization retry test |
| TF-003 clipboard         | [#26](https://github.com/kasuken/PostNook/issues/26) | Implemented     | Native write/read-back, failure/unavailable tests, manual fallback, no extra permission  |
| TF-004 storage           | [#27](https://github.com/kasuken/PostNook/issues/27) | Implemented     | Revision transactions, rollback, conflict, synthetic migration, browser restart          |
| TF-005 editor            | [#28](https://github.com/kasuken/PostNook/issues/28) | Implemented     | Minimal schema, JSON persistence, keyboard formatting, undo/redo, sanitized import       |
| TF-006 conversion        | [#29](https://github.com/kasuken/PostNook/issues/29) | Implemented     | Adapter ADR, deterministic serializer, native save/reopen/copy workflow                  |
| TF-007 design direction  | [#40](https://github.com/kasuken/PostNook/issues/40) | Implemented     | Alternatives, journey map, themed studies at 320/400/600                                 |
| TF-008 UI foundations    | [#41](https://github.com/kasuken/PostNook/issues/41) | Implemented     | Tokens, component studio, measured contrast, focus and keyboard tests                    |
| TF-009 prototype         | [#42](https://github.com/kasuken/PostNook/issues/42) | Implemented     | Working application, real services, state matrix and screenshots                         |
| TF-010 human review gate | [#43](https://github.com/kasuken/PostNook/issues/43) | Closed by owner | Automated/self-review complete; human checks unverified, closure blockers waived         |
| E00 Technical Foundation | [#1](https://github.com/kasuken/PostNook/issues/1)   | Closed by owner | All ten children closed; TF-010 human checks waived as foundation blockers               |

See [browser evidence](testing/browser-testing.md), [design walkthrough](design/prototype/README.md), and [UI review](design/ui-review.md). Existing PRD and published backlog files retain their original content; the original publication-verification report describes the earlier bootstrap, not this implementation.

Release CI, marketplace distribution, full compatibility/accessibility testing, manual LinkedIn paste validation, and performance targets remain in downstream tasks. The production build currently has a bundle-size advisory. No store release or automatic publishing was performed.

## E01 Browser Extension Foundation

| Story                         | Issue                                                | Status      | Evidence                                                                                                                   |
| ----------------------------- | ---------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| US-001 open from the browser  | [#11](https://github.com/kasuken/PostNook/issues/11) | Implemented | Native action probe on Chrome and Edge 156, manifest allowlist, worker retry test, first-run and error-state startup tests |
| E01 Extension Foundation epic | [#2](https://github.com/kasuken/PostNook/issues/2)   | Implemented | Single child US-001 closed                                                                                                 |

US-001 acceptance mapping: AC-001.1 to .3 and .6 are covered by the native probe (`docs/testing/chrome-native.json`, `msedge-native.json`) against an ordinary tab with only `sidePanel` and `storage` permissions and no host access, so the panel is independent of the active site, including LinkedIn. AC-001.4 and .5 are covered by the probe's reload and browser-restart restore. AC-001.7 and .8 are covered by `tests/integration/panel-startup.test.tsx` and `tests/unit/background.test.ts`.

Not verified: Chrome 116 (the declared minimum) and previous-major releases; only the installed Chrome/Edge 156 builds were exercised. No LinkedIn page was driven.

## E02 Writing Editor

| Story                   | Issue                                                | Status      | Evidence                                                                                                   |
| ----------------------- | ---------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| US-002 create and edit  | [#12](https://github.com/kasuken/PostNook/issues/12) | Implemented | Minimal Tiptap schema, validated JSON, keyboard editing, stable selection, inline paste conversion         |
| US-003 format text      | [#13](https://github.com/kasuken/PostNook/issues/13) | Implemented | Toolbar with pressed/disabled state, shortcuts exposed via `aria-keyshortcuts`, mode-aware formatting note |
| E02 Writing Editor epic | [#3](https://github.com/kasuken/PostNook/issues/3)   | Implemented | Both children closed                                                                                       |

US-002 acceptance mapping:

- AC-002.1 new document: `Create first post` and `New draft` in `tests/e2e/writing.spec.ts`; the empty document state is in `tests/integration/editor.test.tsx`.
- AC-002.2 to .8 (type, select, delete, replace, Enter, Shift+Enter, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+B, Ctrl/Cmd+I): the e2e test `keyboard editing: paragraphs, line breaks, marks, undo, redo, and replace`, plus the existing hard-break and formatting e2e tests.
- AC-002.9 stable cursor: the e2e test `formatting keeps the cursor and selection stable from keys and toolbar` and the integration test for toolbar selection.
- AC-002.10 empty and long documents: integration tests (empty and 400-paragraph documents) and the existing 3,000-character stress e2e at 320, 400 and 600 px.
- AC-002.11 no silent replacement: an editor update that fails validation reports an error and is not passed on for saving (integration test). Invalid stored records are rejected without replacement (`tests/integration/storage.test.ts`).
- AC-002.12 unsupported paste: headings, code, tables, images and scripts are converted or removed (`tests/unit/import.test.ts`, the integration test, and the e2e tests for HTML and plain-text paste).

The editor keeps its Tiptap options, extensions and editor props stable across renders, so autosave status updates no longer re-apply editor state while the user is typing. Paste now inserts an open slice, so a single pasted line replaces a selection inside the paragraph instead of splitting it.

US-003 acceptance mapping:

- AC-003.1 to .3 (bold, italic, bullet and numbered lists, undo, redo, clear formatting): `toggles lists and clears marks and lists back to plain paragraphs` (integration).
- AC-003.4 active state: `aria-pressed`, shown visually with a fill and an underline, so it does not rely on color alone.
- AC-003.5 disabled state: undo, redo and clear formatting are disabled (native `disabled`) when there is nothing to act on. Every control is disabled while input is locked.
- AC-003.6 keyboard access: controls are native buttons in tab order, their shortcuts are exposed as `aria-keyshortcuts`, and the toolbar is reachable from the keyboard (e2e).
- AC-003.7 selection kept: toolbar clicks keep the selection and focus (e2e and integration).
- AC-003.8 explanation: the note under the editor follows the selected output mode and is linked to the editor as its accessible description (integration).

Validation (2026-10-27):

- Typecheck, lint and format checks passed.
- 41 unit and integration tests passed.
- Production build and manifest check passed.
- Playwright: 34 tests on installed Chrome and Edge. The three new editor tests were repeated 8 times on each browser.

Not verified:

- The bundled Playwright Chromium project and macOS Cmd shortcuts. The labels switch to `Cmd` on Apple platforms, but this has not been tested on a Mac.
- Screen-reader announcement of the formatting note.
- Manual LinkedIn paste behavior, which is covered by QA-005.

## E03 Markdown and Smart Paste

| Story                             | Issue                                                | Status      | Evidence                                                                                              |
| --------------------------------- | ---------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| US-004 import Markdown            | [#14](https://github.com/kasuken/PostNook/issues/14) | Implemented | Adapter edge cases (escapes, entities, soft breaks, nested marks, inert HTML), shared undoable insert |
| US-005 smart paste                | [#15](https://github.com/kasuken/PostNook/issues/15) | Implemented | Per-source HTML fixtures, whitespace collapse, plain-text fallback, read-failure and undo tests       |
| E03 Markdown and Smart Paste epic | [#4](https://github.com/kasuken/PostNook/issues/4)   | Implemented | Both children closed                                                                                  |

US-004 acceptance mapping:

- AC-004.1 Paste as Markdown action: toolbar button and dialog (e2e `Markdown import is undoable…`).
- AC-004.2 conversion: paragraphs, bold, italic, bullet and numbered lists, nested lists and line breaks (`tests/unit/import.test.ts`, e2e). A soft line break becomes a hard break so the post keeps the writer's lines.
- AC-004.3 normal paste stays literal: unit, integration (`keeps Markdown-looking plain text literal…`) and e2e. The e2e caught Tiptap paste rules bolding `**literal**` during this work; insertion no longer triggers them.
- AC-004.4 unsupported syntax readable: headings, code, links, strike, quotes, rules, images and tables stay as text.
- AC-004.5 failures keep the draft: parsing happens before insertion; oversized input is rejected; if the editor is not ready the typed Markdown is kept.
- AC-004.6 editable result: e2e `Markdown import inserts a list mid-paragraph and the result stays editable`.
- AC-004.7 unit coverage: `tests/unit/import.test.ts` (adapter, round trip) and `tests/unit/serializer.test.ts`.
- AC-004.8 nothing executed: inline and block HTML stay literal text; the result is only Tiptap JSON.

US-005 acceptance mapping:

- AC-005.1 and .2: `text/plain` is accepted; `text/html` is used when it carries text, with bold, italic and lists retained. Native Ctrl+V with Google Docs-style HTML is tested in e2e.
- AC-005.3 and .4: DOMPurify allowlist with no rendered attributes; script, iframe, SVG, form, style and event attributes are removed (unit, e2e `pasteExecuted` check).
- AC-005.5 paragraph boundaries: source whitespace collapses, spacer paragraphs are dropped, and inline wrappers around blocks keep blocks apart.
- AC-005.6 NBSP normalized to spaces; AC-005.7 emoji, CJK, Cyrillic and right-to-left text preserved (unit and e2e).
- AC-005.8 tables become `A | B` rows.
- AC-005.9 undo: each paste is its own undo step, including right after typing (integration, e2e Ctrl+Z).
- AC-005.10 read failure: the paste is handled before ProseMirror reads the clipboard; a failing read shows a message and leaves the document unchanged (integration).
- Processing rules: data is read once from the user's paste event only, inserted at the selection, and the editor update triggers autosave (e2e waits for `Saved on this device`).

Validation (2026-10-27):

- Typecheck, lint and format checks passed.
- 60 unit and integration tests passed.
- Production build and manifest check passed (existing bundle-size advisory).
- Playwright: 38 tests on installed Chrome and Edge. The three paste and import tests were repeated 5 times on each browser.

Not verified:

- Real clipboard captures from ChatGPT, Microsoft Word, Google Docs, Notion and VS Code. These sources are covered by hand-written HTML fixtures modelled on their clipboard formats, not by copying from the applications.
- A real clipboard read failure in a browser; browsers supply paste data synchronously, so the failure path is tested with a throwing `getData` in jsdom.
- Word multi-level list nesting (levels are flattened into one list) and the bundled Playwright Chromium project.
- Manual LinkedIn paste behavior, which is covered by QA-005.

## E04 LinkedIn Output

| Story                    | Issue                                                | Status      | Evidence                                                                                                  |
| ------------------------ | ---------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| US-006 publishing text   | [#16](https://github.com/kasuken/PostNook/issues/16) | Implemented | Pure `serializePost`, empty items and blank lines normalized, nested and multi-line items indented        |
| US-007 character counter | [#17](https://github.com/kasuken/PostNook/issues/17) | Implemented | Count of serialized output, locale-consistent limit, always-mounted warning live region, over-limit saves |
| US-008 copy post         | [#18](https://github.com/kasuken/PostNook/issues/18) | Implemented | User-triggered `writeText`, confirmation, manual fallback, copy time recorded only after success          |
| E04 LinkedIn Output epic | [#5](https://github.com/kasuken/PostNook/issues/5)   | Implemented | All three children closed                                                                                 |

US-006 acceptance mapping:

- AC-006.1 deterministic: repeated runs give identical text (`tests/unit/serializer.test.ts`).
- AC-006.2 empty output: an empty document, an empty list item and whitespace-only paragraphs all produce `''`. Before this epic, an empty list item copied as a lone `•` and enabled Copy Post.
- AC-006.3 spacing: two newlines between paragraphs, one per hard break, one blank line between paragraphs and lists, excess blank lines collapsed, trailing spaces removed.
- AC-006.4 lists: `• ` bullets and sequential `1.`, `2.` numbers. Nested lists, extra item paragraphs and line breaks inside an item are indented under their marker. An empty item that only holds a nested list keeps the nested items without a doubled marker (unit, and e2e clipboard read-back).
- AC-006.5 emoji and international text kept (unit, stress e2e).
- AC-006.6 no markup: marks emit no `<`, `*` or `_`. Literal `**x**` and `<b>` typed by the writer stay as typed.
- AC-006.7 one service: preview, counter and clipboard all use the same `text` value from `serializePost`.
- AC-006.8 mode change: the e2e test compares the stored document before and after switching to Unicode and back.
- AC-006.9 malformed input: `serializePost` throws a safe message, and the app shows an empty output instead of crashing. The editor and storage reject invalid documents before they reach the serializer.
- AC-006.10 no LinkedIn interaction: `scripts/validate-manifest.mjs` enforces only `sidePanel` and `storage`, no host permissions, no content scripts and `connect-src 'none'`.

US-007 acceptance mapping:

- AC-007.1, .2 and .6: the counter uses `countCharacters(serializePost(...))`. The e2e test shows a bullet marker adding two characters, and Unicode bold raising the count from 5 to 10 and back.
- AC-007.3: the limit is shown in the browser locale, together with the count. Before this epic, Edge showed `3'000 / 3,000`.
- AC-007.4 and .5: the approaching note appears at 2,900 and the over-limit note and error color at 3,001 (e2e). The note is a live region that stays mounted, so the change is announced.
- AC-007.7: over-limit content reaches "Saved on this device" and survives a reload (e2e).
- AC-007.8: Copy Post opens a warning, and **Copy anyway** copies the full text (e2e clipboard read-back).
- The count is described as an estimate in the label, the tooltip and the warning dialog.

US-008 acceptance mapping:

- AC-008.1 to .4: the Copy Post button calls `navigator.clipboard.writeText` from the click and shows `Copied!` plus a status announcement (e2e).
- AC-008.5: a rejected or unavailable clipboard shows an actionable error and a manual select-and-copy dialog (unit and e2e).
- AC-008.6 and .7: after copying, the editor text, stored content and revision are unchanged (e2e).
- AC-008.8: `lastCopiedAt` stays `null` after a rejected copy and is set after a successful one (e2e reads IndexedDB).
- AC-008.9: Copy Post is disabled for empty output, and the clipboard service refuses blank text (unit and e2e).
- AC-008.10: no extra permission was added; see AC-006.10.

Validation (2026-10-27):

- Typecheck, lint and format checks passed.
- 65 unit and integration tests passed.
- Production build and manifest check passed (existing bundle-size advisory).
- Playwright: 44 tests on installed Chrome and Edge. The three new output tests were repeated 5 times on each browser.
- Known flake: the existing stress test sometimes appends instead of replacing on `editor.fill` (2 of 24 repeats, and 1 of 24 on the pre-E04 source). It passes on rerun and is not caused by this epic.

Not verified:

- LinkedIn's real character counting, which is why the count is shown as an estimate.
- How lists, indentation and Unicode styling look after a manual paste into LinkedIn (QA-005).
- Chrome 116, the bundled Playwright Chromium project, and macOS.
- Windows reads the clipboard back with CRLF line endings; the e2e test normalizes them. How LinkedIn handles them is part of QA-005.

## E05 Draft Management

| Story                     | Issue                                                | Status      | Evidence                                                                                                      |
| ------------------------- | ---------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| US-009 automatic saving   | [#19](https://github.com/kasuken/PostNook/issues/19) | Implemented | Debounced and periodic writes, flush on blur, hide and page close, Storage unavailable state, revision checks |
| US-010 multiple drafts    | [#20](https://github.com/kasuken/PostNook/issues/20) | Implemented | Create, rename, switch, confirmed delete, newest-first list, last active restored, unreadable drafts reported |
| E05 Draft Management epic | [#6](https://github.com/kasuken/PostNook/issues/6)   | Implemented | Both children closed                                                                                          |

US-009 acceptance mapping:

- AC-009.1 unique id: `crypto.randomUUID()` v4, validated on every read and write (`tests/integration/storage.test.ts`).
- AC-009.2 and .9: each save reads, validates, checks the revision and writes the whole record in one Dexie read/write transaction; a failure after the put rolls back (integration).
- AC-009.3 and .4: 300 ms debounce and 1,500 ms maximum wait; 15 edits over 1.5 s produce one write (`tests/unit/autosave.test.ts`).
- AC-009.5 save status: Saved, Saving, Unsaved changes, Save failed, Storage unavailable and Newer version found, in a polite live region. Storage unavailable is new in this epic and, like the other error states, stays visible while typing continues (unit).
- AC-009.6: content and title survive a reload (e2e); a real browser restart was verified by the TF-004 native probe.
- AC-009.7: errors keep the text, show a persistent notice with Retry save and Keep separate copy, and Saved appears only after a retry commits (unit and e2e with failing `IDBObjectStore.put`).
- AC-009.8: window `blur`, `visibilitychange` and `pagehide` flush at once. The e2e test freezes the page clock so the debounce cannot fire, dispatches each event and reads the edit back from IndexedDB.
- AC-009.10: a stale second window gets Newer version found and keeps its text; it can keep a separate copy or reload after confirmation (e2e with two pages).
- AC-009.11: a test-only Dexie version 2 upgrade runs `migrateDraftV1` and the version 1 record survives unchanged (integration). Production storage stays at version 1.
- Error handling: creating, switching or deleting while the current draft cannot be saved now stops with a visible reason instead of silently doing nothing behind the dialog (e2e).

US-010 acceptance mapping:

- AC-010.1 to .3: New draft, the Draft title field and the drafts dialog (e2e). New drafts are named Untitled Post; the title is never set automatically.
- AC-010.4 and .5: Delete current draft opens a confirmation; Keep draft leaves it in place (e2e).
- AC-010.6: the list is sorted by `updatedAt`, newest first, using explicit timestamps (integration) and in the dialog (e2e).
- AC-010.7: switching to the older draft and reloading reopens that draft, so the stored active id is used rather than the newest draft (e2e).
- AC-010.8: switching and creating flush the current draft first (e2e).
- AC-010.9: deleting the last draft shows the empty state, also after a reload (e2e). The dialog list has its own empty message.
- AC-010.10: a missing or unreadable active draft shows an error instead of a blank document. A record from a future schema no longer blocks the other drafts: Open remaining drafts opens them, a notice says one draft could not be read, and the record stays untouched in IndexedDB (integration and e2e).
- The selector shows title (Untitled Post when blank), last modified time and the active draft (`aria-current` plus a check mark).

Validation (2026-10-27):

- Typecheck, lint and format checks passed.
- 68 unit and integration tests passed.
- Production build and manifest check passed (existing bundle-size advisory).
- Playwright: 52 tests on installed Chrome and Edge; the final full run passed, and an earlier full run hit the stress-test flake described below before it was fixed. The new and changed draft tests and the stress test were repeated 8 times on each browser.
- The E04 stress-test flake is explained and fixed. The app focuses the editor late (once a new draft becomes editable, and one frame after Write), and a `fill` that lands before that focus loses its selection and appends. The stress test, the draft-switching test and the new tests now wait for the focus first. A few older tests type right after creating a draft and could still hit this; a person cannot type in that window.

Not verified:

- Flush when the real side panel is closed. The `pagehide` path is tested in a tab; whether Chrome and Edge finish the IndexedDB write as the panel closes was not measured.
- A browser restart after this epic's changes; restart persistence relies on the TF-004 probe.
- Two side panels in two real browser windows; the conflict test uses two tabs on the dev server.
