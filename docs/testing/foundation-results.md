# Foundation verification results

Verified on 2026-10-27 using Node 25.2.1, npm 11.6.2, Windows, Chrome 156.0.8078.48, and Edge 156.0.4314.50.

| Check                                                           | Result                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run validate`                                              | Pass: strict TypeScript, ESLint, Prettier, 30 tests in seven files, production build, manifest validator |
| Fresh copied source tree: `npm ci`, `npm test`, `npm run build` | Pass: 362 packages installed from lockfile, all 30 tests, production build                               |
| `npm run test:e2e -- --project=chrome --project=edge`           | Pass: 28 browser scenarios                                                                               |
| Packaged native-panel probe, Chrome and Edge                    | Pass: action opening, create/save, clipboard read-back, reload, browser restart                          |
| Theme contrast                                                  | Pass: 20 computed token pairs; rendered axe checks at 320/400/600 in both themes                         |
| `npm audit --audit-level=moderate`                              | Zero reported vulnerabilities at verification time                                                       |
| `npm run package`                                               | Chrome and Edge ZIPs and SHA-256 checksums created                                                       |
| Package integrity                                               | ZIP CRC, packaged file bytes versus dist, manifest permissions/version, and SHA-256 verified             |
| Documentation                                                   | Local links resolve; supplied PRD files are unchanged                                                    |
| Git whitespace check                                            | Pass                                                                                                     |

The final browser run includes actual failures injected into storage and clipboard paths; those are tests of failure handling, not claims that real device storage filled up. The migration test uses a synthetic prior schema. See [browser methods and limitations](browser-testing.md).

During development a parallel validation run failed before executing tests because forked test workers timed out starting. Stopping the development server and rerunning validation independently passed all tests. A native probe attempted while a production rebuild was replacing assets also failed to reach its initial state; the final probes ran against a stable completed build and both passed. Neither unsuccessful attempt is counted as a pass.

The build retains Vite's advisory for the approximately 839 kB editor JavaScript chunk (266 kB gzip). Reference-hardware performance targets have not been measured. Human usability, screen-reader, full keyboard-only, and actual browser-zoom checks remain unverified in the [TF-010 review](../design/ui-review.md). The owner authorized TF-010 and E00 closure on 2026-10-27 with those checks waived as foundation blockers; no new test evidence is implied. No marketplace release or full MVP acceptance is claimed.
