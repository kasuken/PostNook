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
