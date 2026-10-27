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
