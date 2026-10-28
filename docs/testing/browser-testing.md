# Browser foundation evidence

Date: 2026-10-27. Host: Windows. Installed Chrome 156.0.8078.48 and Edge 156.0.4314.50. Exact probe timestamps are in [Chrome report](chrome-native.json) and [Edge report](msedge-native.json).

## Automated layers

`npm run validate` checks strict TypeScript, lint, formatting, Vitest unit/integration behavior, production build, and packaged manifest. Vitest covers serialization, Markdown/paste, validation, transactions/rollback, synthetic migration, autosave timing/conflict, clipboard errors, worker initialization, and UI semantics.

`npm run test:e2e -- --project=chrome --project=edge` uses installed browsers and the localhost application harness. It exercises real IndexedDB and editor behavior at 320, 400, and 600 CSS pixels. Tests cover create/edit/save/restore, formatting, Markdown undo, safe paste, clipboard success/failure, marked hard breaks, Unicode opt-in, quota recovery, missing-active recovery, stale conflicts, long/mixed-language fixtures, reduced motion, dialog focus, themes, axe, and 200% text resizing. Clipboard permissions granted to this test harness are not manifest permissions.

## Packaged native panel

Build the extension and leave a localhost development server running on port 4173, then run:

```sh
node scripts/native-browser-check.mjs chrome
node scripts/native-browser-check.mjs msedge
```

Each probe launches a separate disposable profile under ignored `.browser-profiles/`; it never accesses a personal profile. Installed browsers no longer support the old unpacked-extension command-line workflow reliably, so the probe uses the development-only CDP Extensions API with `--enable-unsafe-extension-debugging`. Do not use that flag for normal browsing. It is not part of the packaged extension.

The probe loads `dist`, checks action-opening configuration, triggers the actual browser action against an ordinary tab, and interacts with the resulting native side-panel target. It creates text, waits for persistence, copies through a direct simulated user gesture, and reads the system clipboard back from the test page. Only that read-back page receives a test permission grant. The extension requests no clipboard permission. Windows clipboard CRLF is normalized to LF for the text comparison.

The native panel is reloaded and its content checked. The browser is then closed and restarted with the same isolated profile. CDP development installation must be re-enabled after restart; the same extension ID is asserted before verifying that IndexedDB content survived. Reports and native screenshots are saved in this repository. This is packaged, native, headless automation, not a claim of headed manual UX or store installation testing.

## Clipboard and initialization findings

Both tested browsers support `navigator.clipboard.writeText` in the native panel with direct user activation and only `sidePanel`/`storage` manifest permissions. Unit tests cover unavailable API and rejected writes; browser fault injection verifies manual fallback. Empty content cannot claim success, and copy timestamps are stored only after resolution.

The worker records a panel setup error and an action badge on failure. A unit test simulates API rejection, then successful retry and error clearing. The panel offers retry without reloading unsaved editing state. If the native panel cannot open at all, reload the unpacked extension from its management page after preserving any active text. Browser policy restrictions and completely unavailable extension storage require additional release testing.

## Not verified here

- Chrome 116, previous-major releases, macOS, and managed browser policies.
- Hands-on screen-reader operation, complete keyboard-only user journeys, actual 200% browser zoom, and three-writer formative review.
- Manual LinkedIn paste/rendering, Unicode count semantics, and platform policy review. No automated LinkedIn interaction was performed.
- Arbitrary storage corruption, power-loss behavior, store installation/update, and marketplace acceptance. Performance targets were measured on the development laptop on 2026-10-28 ([QA evidence](qa-matrix.md)).

These remain owned by existing feature/QA/release tasks. A localhost UI test is not treated as proof of native panel behavior; the native probe supplies that separate evidence.

Official API references: [Chrome sidePanel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel), [Edge sidebar extensions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/sidebar), [Playwright extension testing](https://playwright.dev/docs/chrome-extensions).
