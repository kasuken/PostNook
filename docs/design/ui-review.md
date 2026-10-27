# Foundation UI review

Date: 2026-10-27. Scope: TF-007 through TF-010. Review method: implementation self-review, captured screens, automated browser checks, and measured contrast. No independent human review is claimed.

**TF-010 and E00 remain open.** Three consenting target writers have not reviewed the prototype. Hands-on screen-reader checks, the complete keyboard-only journey, and actual 200% browser zoom are also not verified. Automated axe and text resizing do not replace those checks.

## Design critique

The [selected notebook direction](design-direction.md) is visible in the open writing surface, bookmark N, restrained violet action, and quiet footer. The title, editing controls, content, and publishing action have separate groups with consistent alignment. Settings and drafts temporarily overlay the editor rather than consuming permanent writing width. Light/dark screenshots at 320/400/600 preserve this hierarchy.

Reviewed screen examples: [320 light editor](prototype/chrome-320-light-editor.png), [400 dark editor](prototype/chrome-400-dark-editor.png), [320 light settings](prototype/chrome-320-light-settings.png), and [600 dark preview](prototype/chrome-600-dark-preview.png). Text flows normally, long titles retain their editable value, and Copy Post remains visually primary. Editor screenshots show a scrollable writing region; text below its edge remains in the document. Preview deliberately has less editor chrome and explains rendering limitations.

Twenty [computed contrast pairs](contrast.md) pass their text/non-text thresholds. Rendered editor screens pass automated axe checks in both themes at all three widths. Real fixtures cover long titles, URLs, emoji, Japanese, mixed Arabic/English, empty content, and exactly 3,000 estimated units. No claim of full WCAG conformance follows from these automated checks.

## Findings and corrections

| ID       | Severity | Reproduction / before evidence                                                                                                                                                                                         | Change / retest                                                                                                                                                                   |
| -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-01    | High     | Tab through all settings controls; browser focus could leave the dialog. The added focus-loop assertion failed in Chrome and Edge at all widths.                                                                       | Explicit forward/backward boundary wrapping added to the native dialog. Six layout/focus scenarios pass; Escape restores the opener.                                              |
| DATA-01  | High     | Open the same draft in a second window. Setting editor editability emitted an update, advancing revision without a document change; the first real writer got a stale conflict. Both browser concurrency tests failed. | Set editability without emitting an update. Real two-window stale-write/recovery tests pass in both browsers.                                                                     |
| DATA-02  | High     | Review found an asynchronous draft transition could accept edits after its save snapshot, then replace the editor.                                                                                                     | Title, editor, and toolbar are temporarily disabled during transitions. Failed-write tests show a refused switch retains unsaved text; normal switch tests verify stored content. |
| DATA-03  | High     | Review found panel initialization retry reused full draft loading, which could replace active unsaved state.                                                                                                           | Retry only updates the panel error state. It does not attach a draft or recreate the editor. Source review verifies the boundary; worker retry has a unit regression.             |
| DATA-04  | Medium   | A missing active ID initially left reopening stuck on a load error.                                                                                                                                                    | Explicit Open remaining drafts recovery preserves the missing-record warning and never invents a blank draft. Browser regression passes.                                          |
| EDIT-01  | High     | Tiptap can attach marks to Shift+Enter hard breaks; schema validation originally rejected that shape.                                                                                                                  | Supported marks accepted on hard breaks. Bold + Shift+Enter saves, reloads, previews, and switches Unicode/plain in both browsers.                                                |
| COPY-01  | Medium   | Review found a clipboard write could finish after the user edited again and label the newer text Copied.                                                                                                               | Completion compares copied text and draft identity with the current output; changed content asks for another copy. Clipboard promise timing is unit-tested.                       |
| BUILD-01 | Medium   | Package script used a removed default export in archiver 8 and failed.                                                                                                                                                 | Use ZipArchive; both packages and checksums build successfully.                                                                                                                   |

These are development findings and retests, not invented user research. No known task-blocking defect remains from the checks executed. Broader release coverage and independent review are still required.

## Open checks and owner handoff

| Check                          | State                              | Completion evidence required                                                                                      |
| ------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Three target writers           | Not verified; blocks TF-010        | Consent, anonymous sample IDs, task outcomes, observed problems, interpretation of save/manual publishing/Unicode |
| Hands-on screen reader         | Not verified; blocks TF-010        | NVDA or comparable actual assistive-technology session covering the full workflow and announcements               |
| Complete keyboard-only journey | Partially automated; blocks TF-010 | Human run through creation, formatting, drafts, import, preview, settings, copy, and recovery                     |
| Actual 200% browser zoom       | Not verified; blocks TF-010        | Headed Chrome and Edge run; existing checks resize text to 200%, which is different                               |
| macOS, prior major browsers    | Not verified                       | QA compatibility matrix                                                                                           |
| Reference-hardware performance | Not verified                       | Startup/editor/serializer/save/preview timings; Vite bundle advisory remains                                      |
| Manual LinkedIn compatibility  | Not verified                       | Human paste tests only; record differences without automation                                                     |

UX-001 (#30) should reuse this baseline and recheck it after integration. QA-004 (#34) owns broader accessibility verification. TF-010 (#43) must remain open until unavailable checks are performed and high-severity findings are resolved. E00 (#1) therefore stays open even though its nine implementation children are complete.

## Formative session protocol

Recruit three consenting frequent or occasional LinkedIn writers. Use supplied non-sensitive sample posts, no account credentials, and no recording without separate consent. For each participant ask them to create a draft, format a passage, import a list, find preview, copy the output, reopen the draft, recover from a demonstrated failed save, and explain the Unicode warning.

Record an anonymous participant ID, consent confirmation, browser/version, each task's completion and assistance needed, observed discoverability problems, and their explanation of Saved and manual publishing. Leave unknown outcomes blank. Treat findings as formative evidence, not the PRD's activation/retention KPIs. Prioritize lost-work risks and inaccessible controls before cosmetic preferences.
