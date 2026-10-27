# Prototype walkthrough and screen studies

This foundation is runnable with real local services. Follow the repository README to build/load the native panel. For fast design inspection run `npm run dev -- --port 4173`, then open `http://127.0.0.1:4173/sidepanel.html`. The separate `?studio` page is development-only and labels simulated statuses. There is no production full-tab editing feature.

## Walkthrough

1. Create first post. Focus moves into the writing surface.
2. Rename the draft, write a short paragraph, select words, and apply bold. Observe Saved on this device after persistence.
3. Open Paste as Markdown, insert a list, and undo/redo the insertion. Normal paste stays literal unless safe semantic HTML is supplied.
4. Open preview. Compare the text with plain output; desktop/mobile changes presentation only. Return to Write without losing content.
5. Select Unicode styling, read the warning, and opt in. Return to plain text to see the original characters.
6. Copy Post, paste into a local plain-text editor, and inspect the result. Publishing is manual. Empty posts cannot report success; over-limit posts ask before copying.
7. Create another draft, switch back, and reopen the panel. Confirm the title and content. Delete requires confirmation.
8. Change appearance. The light/dark hierarchy and primary action remain consistent.

## State matrix

| State                    | Reproduce                                     | Evidence type / recovery                                                                           |
| ------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| No drafts / empty draft  | Fresh test profile, create                    | Real UI; clear primary action and empty placeholder                                                |
| Saved / saving / unsaved | Type; observe status around debounced writes  | Real service, deterministic timing unit tests; studio has labelled snapshots                       |
| Save failure / quota     | E2E injects a failing IndexedDB put           | Fault injection; visible text retained, switch prevented, retry persists                           |
| Storage unavailable      | Repository open failure path; studio scenario | Typed failure path and labelled layout fixture; browser policy/OS failures not exhaustively tested |
| Load failure             | E2E points activeDraftId at a missing UUID    | Real recovery UI; explicit Open remaining drafts, no blank replacement                             |
| Stale revision           | Open two panels on one draft, save in each    | Real shared IndexedDB; rejected stale overwrite, separate recovered copy                           |
| Clipboard failure        | E2E rejects Clipboard API promise             | Fault injection; manual select-and-copy dialog, document retained                                  |
| Markdown parse failure   | Import more than 200,000 characters           | Adapter rejects before insertion; existing text retained                                           |
| Over estimate            | Enter 3,001 UTF-16 units                      | Real counter and explicit copy warning                                                             |
| Unicode first use        | Select Unicode mode with fresh preferences    | Real warning and opt-in, original JSON retained                                                    |
| Editor initialization    | Error boundary and studio scenario            | Recovery shell implemented; unexpected engine failures not exhaustively reproduced                 |

## Screen studies

Screens use non-sensitive sample copy. `chrome-*` and `edge-*` were captured from the live app in installed browsers. The native screenshots separately show the packaged side-panel workflow. Screenshots demonstrate layout; test assertions and JSON reports establish behavior.

| Width | Light editor                          | Dark editor                          | Light preview                          | Dark preview                          |
| ----- | ------------------------------------- | ------------------------------------ | -------------------------------------- | ------------------------------------- |
| 320   | [Chrome](chrome-320-light-editor.png) | [Chrome](chrome-320-dark-editor.png) | [Chrome](chrome-320-light-preview.png) | [Chrome](chrome-320-dark-preview.png) |
| 400   | [Chrome](chrome-400-light-editor.png) | [Chrome](chrome-400-dark-editor.png) | [Chrome](chrome-400-light-preview.png) | [Chrome](chrome-400-dark-preview.png) |
| 600   | [Chrome](chrome-600-light-editor.png) | [Chrome](chrome-600-dark-editor.png) | [Chrome](chrome-600-light-preview.png) | [Chrome](chrome-600-dark-preview.png) |

| Width | Light drafts                          | Dark drafts                          | Light settings                          | Dark settings                          |
| ----- | ------------------------------------- | ------------------------------------ | --------------------------------------- | -------------------------------------- |
| 320   | [Chrome](chrome-320-light-drafts.png) | [Chrome](chrome-320-dark-drafts.png) | [Chrome](chrome-320-light-settings.png) | [Chrome](chrome-320-dark-settings.png) |
| 400   | [Chrome](chrome-400-light-drafts.png) | [Chrome](chrome-400-dark-drafts.png) | [Chrome](chrome-400-light-settings.png) | [Chrome](chrome-400-dark-settings.png) |
| 600   | [Chrome](chrome-600-light-drafts.png) | [Chrome](chrome-600-dark-drafts.png) | [Chrome](chrome-600-light-settings.png) | [Chrome](chrome-600-dark-settings.png) |

Equivalent Edge studies use the same filenames with an `edge-` prefix. [Chrome native panel](chrome-native.png) and [Edge native panel](msedge-native.png) were captured by the packaged-extension probe.

Annotations: the bookmark N provides identity without competing with writing; the editable title and draft actions form one group; formatting sits directly above content; save status and the output estimate sit next to Copy Post. Settings and draft navigation occupy temporary dialogs rather than permanent columns. The 320px toolbar compresses hit areas without horizontal app scrolling; 600px increases writing space rather than adding panels.

Test fixtures also include a 120-character title, an unbroken URL, emoji, Japanese, Arabic mixed with English, empty content, and exactly 3,000 UTF-16 units. The same text is asserted after reload and in preview at every width. [UI review](../ui-review.md) records remaining human checks. UX-001 and QA-004 must recheck the baseline as later features are integrated.
