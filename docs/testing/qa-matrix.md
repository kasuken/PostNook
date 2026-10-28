# QA evidence (E08)

Date: 2026-10-28. Host: Windows 11 (10.0.26300), Intel Core Ultra 7 165H, 22 threads, 16 GB RAM. Browsers: Chrome 156.0.8078.74 and Edge 156.0.4314.50, installed stable channels.

## QA-001 unit test matrix (PRD 14.1)

`tests/unit/matrix.test.ts` has one named case for each PRD 14.1 item. The expectations come from the requirement rather than the current output. Deeper cases live in `tests/unit/serializer.test.ts`, `tests/unit/import.test.ts` and `tests/integration/storage.test.ts`.

| Area              | PRD cases                                                                                                                                                                                              | Status  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| Serializer        | empty, single and multiple paragraphs, line break, bullets, numbers, mixed, marks, Unicode, emoji (ZWJ, flags), hashtags and mentions, URLs, non-Latin, whitespace, unsupported nodes, malformed input | Covered |
| Markdown adapter  | valid, invalid, mixed formatting, nested, unsupported syntax, empty, large (2,000 paragraphs; over 200,000 characters refused), embedded HTML inert                                                    | Covered |
| Character counter | ASCII, accented, combining, emoji and surrogate pairs, newlines, Unicode styling output, exactly 3,000 and over 3,000                                                                                  | Covered |
| Draft repository  | create, read, update, delete, sort, conflict, rollback, migration, invalid document, quota failure                                                                                                     | Covered |
| Paste security    | scripts, event attributes, unsafe HTML, inert Markdown HTML (`import.test.ts`, e2e Markdown/paste)                                                                                                     | Covered |

Defect found and fixed: a quota failure was reported as "Local storage is unavailable". The check required `instanceof Error`, which a `DOMException` does not satisfy in every realm, and it ignored Dexie's `AbortError.inner`. It now matches by name, including inner errors. Both quota tests fail without the fix.

Open: the counter counts UTF-16 code units. Combining sequences and emoji therefore count as more than one character, and LinkedIn's own counting is unknown (QA-005). This is labeled as an estimate in the UI and is not a defect.

## QA-002 integration scenarios (PRD 14.2)

| #   | Scenario                        | Evidence                                                                                |
| --- | ------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Open editor and create draft    | e2e `create, format, autosave…`; native probe (real side panel)                         |
| 2   | Edit and autosave               | e2e `create, format…`, `focus loss and page hide save…`; native probe                   |
| 3   | Switch drafts                   | e2e `draft switching saves edits…`                                                      |
| 4   | Reopen active draft             | e2e `drafts list newest first… reopen the last active one`                              |
| 5   | Apply formatting and undo       | e2e `keyboard editing…`, `formatting keeps the cursor…`                                 |
| 6   | Paste HTML safely               | e2e `Markdown import… HTML is sanitized`, `native Ctrl+V keeps Google Docs formatting…` |
| 7   | Import Markdown                 | e2e `Markdown import is undoable…`, `…inserts a list mid-paragraph…`                    |
| 8   | Preview serialized output       | e2e `preview shows the exact copied text…`                                              |
| 9   | Copy output                     | e2e `copy records the time only after success…`; native probe clipboard read-back       |
| 10  | Handle clipboard rejection      | e2e `clipboard rejection offers manual copy…`                                           |
| 11  | Handle IndexedDB failure        | e2e `failed writes preserve unsaved text…`; integration `storage unavailable` and quota |
| 12  | Recover after browser restart   | native probe: browser closed and restarted with the same profile, draft restored        |
| 13  | Resolve stale revision conflict | e2e `concurrent windows cannot silently overwrite a newer draft`                        |
| 14  | Change output mode              | e2e `Unicode output is opt-in…`, `the counter follows the generated output…`            |
| 15  | Change application theme        | e2e `theme follows the system by default…`, layout tests in both themes                 |

Native probe (`node scripts/native-browser-check.mjs chrome|msedge`) results on 2026-10-28: [Chrome](chrome-native.json) and [Edge](msedge-native.json) both opened the real side panel from the action on an ordinary tab, created, saved, copied, verified the clipboard, reloaded and restored the draft after a browser restart. The only permissions were `sidePanel` and `storage`. The probe's panel screenshot is now best-effort, because Chrome 156.0.8078.74 timed out capturing it twice. It does not affect the checks.

Data loss: content that reached "Saved on this device" survived reload, draft switch and browser restart in every run. Pending edits flush on blur, hide and page close (E05). Edits typed in the last moment before a crash are uncommitted by definition, and the UI never shows them as saved.

Browser matrix (PRD 14.3):

| Browser               | OS         | Required    | Result                                         |
| --------------------- | ---------- | ----------- | ---------------------------------------------- |
| Chrome Stable 156     | Windows 11 | Required    | Pass (e2e suite and native probe)              |
| Edge Stable 156       | Windows 11 | Required    | Pass (e2e suite and native probe)              |
| Chrome Stable         | macOS      | Required    | **Not run**: no macOS host available           |
| Edge Stable           | macOS      | Recommended | **Not run**: no macOS host available           |
| Chrome previous major | Windows    | Regression  | **Not run**: no previous-major build installed |
| Edge previous major   | Windows    | Regression  | **Not run**: no previous-major build installed |

## QA-003 privacy, permissions, CSP and paste security

`node scripts/audit-security.mjs` now runs at the end of `npm run build`. It fails on any of these in the built bundle:

- `eval`, `new Function`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource` or `importScripts`;
- clipboard reads, `chrome.scripting`/`tabs`/`webRequest`/`cookies`/`history`/`debugger`, or script injection;
- `document.write`, a LinkedIn host, or any URL outside a small allowlist of XML namespaces and library help links;
- inline scripts or handlers in HTML;
- any `fetch` other than Vite's modulepreload polyfill.

In our own source it fails on `innerHTML` assignment, `dangerouslySetInnerHTML`, `fetch` or remote URLs. It also fails on telemetry-like dependencies, and on a CSP with eval or remote sources. A planted `eval` plus remote `fetch` made it fail as expected.

The manifest check (`scripts/validate-manifest.mjs`) confirms permissions are exactly `sidePanel` and `storage`. There are no host permissions, content scripts or `externally_connectable`. The CSP has `script-src 'self'` and `connect-src 'none'`.

The audit found no backend, credentials, telemetry SDK, draft transmission, automatic clipboard reading or LinkedIn automation. Paste reads only the data of a user paste event. Sanitization is tested against scripts, event attributes and unsafe HTML without executing user content. Storage validation, quota mapping and migration are covered by QA-001. [Privacy](../privacy.md) documents uninstall and storage-removal loss and claims no encryption.

## QA-004 accessibility and performance

Automated accessibility:

- Axe with WCAG 2.2 AA tags is clean in light and dark at 320, 400 and 600 px, and in preview.
- 20 measured contrast pairs pass ([contrast](../design/contrast.md)).
- Keyboard focus is trapped in dialogs and returns to the opener.
- Theme and toolbar controls work from the keyboard.
- Save, copy and limit status use live regions, and warnings are in words.
- Transitions are 0s under reduced motion.
- There is no horizontal page overflow at 320 px or at 200% root font size.

Performance, measured with `node scripts/measure-performance.mjs`. This needs the dev server on 4173 and `vite preview --port 4174` on the production build. Results are median / p90 / max of 10 runs, in ms:

| Target (PRD 13)                       | Budget | Chrome 156      | Edge 156        |
| ------------------------------------- | ------ | --------------- | --------------- |
| Initial interactive state             | 2,000  | 480 / 686 / 818 | 531 / 638 / 732 |
| Formatting (bold on 3,000 chars)      | 100    | 2.2 / 3.1 / 4.3 | 1.7 / 2.6 / 3.3 |
| Typing, keystroke to DOM, 3,000 chars | 50     | 2.1 / 2.6 / 3.6 | 2.0 / 2.7 / 3.7 |
| Serialization, 3,000 chars, Unicode   | 50     | 4.0 / 4.9 / 9.8 | 2.4 / 3.3 / 6.1 |
| Draft save, start to commit           | 500    | 2.1 / 2.8 / 4.5 | 1.1 / 1.4 / 2.2 |
| Preview refresh, input to paint       | 200    | 32 / 32 / 32    | 32 / 32 / 32    |

Preview uses the browser's Event Timing API on a real click, at 8 ms resolution, so a reported 16 means 16 ms or less. In earlier runs single preview frames took 97–280 ms. In each one the long-animation-frame entry showed the whole delay before rendering began, with no script and no style or layout time. That is the headless browser not scheduling a frame, not PostNook work, so targets are judged on the 90th percentile with the max reported. Navigation persistence: reload, draft switch and browser restart keep committed content (QA-002).

The reference hardware is this development laptop. The PRD does not name a reference machine, so a slower one may give different numbers.

Not done: hands-on screen-reader runs (NVDA, Narrator, VoiceOver) and a keyboard-only journey by a person across editing, drafts, settings, preview, errors and copy. The steps are in the [manual test sheet](manual-test-sheet.md).

## QA-005 manual LinkedIn paste tests

Not run: this needs a human tester with their own LinkedIn account, and PostNook must not automate LinkedIn. The [manual test sheet](manual-test-sheet.md) lists the 12 PRD 14.4 cases and what to record.

Character limit: LinkedIn's help centre states a 3,000-character post limit ([Post and share updates](https://www.linkedin.com/help/linkedin/answer/a528176); also [group post limits](https://www.linkedin.com/help/linkedin/answer/a544801/)). It does not say how characters are counted, so the UTF-16 counter remains labeled an estimate.

Known limitations, documented rather than claimed compatible:

- Unicode styling uses Mathematical Alphanumeric letters only for Latin A–Z, a–z and bold digits. Accented and non-Latin letters stay plain, and screen readers and search may not read styled letters as words.
- Lists are text markers (`• `, `1. `), not LinkedIn list formatting.
- How LinkedIn trims blank lines and leading spaces in nested items is unknown until the manual run.
