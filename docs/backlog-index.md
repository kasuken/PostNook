# Implementation backlog

Target: **v0.1.0**. All issues begin open; their creation does not indicate implementation or validation.

E01-E07 and US-001-US-013 preserve the PRD identifiers, story points, requirements, and acceptance criteria. E00, E08, E09 and TF/UX/QA/REL tasks are derived engineering work. Derived task estimates remain TBC. Every child uses a native GitHub sub-issue relationship.

Sprint labels follow the implementation roadmap. Dependency identifiers below describe prerequisites, not completed work. Sprint 0 validation and shell/CI work support the feature stories.

[PRD](PRD.md) | [Original source](PRD.source.txt) | [Release milestone](https://github.com/kasuken/PostNook/milestone/1)

## [E00] Technical Foundation

[Epic #1](https://github.com/kasuken/PostNook/issues/1)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[TF-001] Initialize the React, TypeScript, and Vite project](https://github.com/kasuken/PostNook/issues/24) | 0 | TBC | None |
| [[TF-002] Prototype Manifest V3 and native side-panel opening](https://github.com/kasuken/PostNook/issues/25) | 0 | TBC | [TF-001](https://github.com/kasuken/PostNook/issues/24) |
| [[TF-003] Validate clipboard writing in Chrome and Edge](https://github.com/kasuken/PostNook/issues/26) | 0 | TBC | [TF-002](https://github.com/kasuken/PostNook/issues/25) |
| [[TF-004] Prototype revision-aware IndexedDB persistence](https://github.com/kasuken/PostNook/issues/27) | 0 | TBC | [TF-001](https://github.com/kasuken/PostNook/issues/24) |
| [[TF-005] Validate the minimal Tiptap editor schema](https://github.com/kasuken/PostNook/issues/28) | 0 | TBC | [TF-001](https://github.com/kasuken/PostNook/issues/24) |
| [[TF-006] Evaluate Markdown conversion and output serialization](https://github.com/kasuken/PostNook/issues/29) | 0 | TBC | [TF-003](https://github.com/kasuken/PostNook/issues/26), [TF-004](https://github.com/kasuken/PostNook/issues/27), [TF-005](https://github.com/kasuken/PostNook/issues/28) |

## [E01] Browser Extension Foundation

[Epic #2](https://github.com/kasuken/PostNook/issues/2)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[US-001] Open PostNook from the Browser](https://github.com/kasuken/PostNook/issues/11) | 0 | 3 | [TF-001](https://github.com/kasuken/PostNook/issues/24), [TF-002](https://github.com/kasuken/PostNook/issues/25) |

## [E02] Writing Editor

[Epic #3](https://github.com/kasuken/PostNook/issues/3)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[US-002] Create and Edit a Post](https://github.com/kasuken/PostNook/issues/12) | 1 | 5 | [TF-001](https://github.com/kasuken/PostNook/issues/24), [TF-005](https://github.com/kasuken/PostNook/issues/28) |
| [[US-003] Format Text](https://github.com/kasuken/PostNook/issues/13) | 1 | 3 | [US-002](https://github.com/kasuken/PostNook/issues/12) |

## [E03] Markdown and Smart Paste

[Epic #4](https://github.com/kasuken/PostNook/issues/4)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[US-004] Import Markdown](https://github.com/kasuken/PostNook/issues/14) | 1 | 5 | [US-002](https://github.com/kasuken/PostNook/issues/12), [TF-006](https://github.com/kasuken/PostNook/issues/29) |
| [[US-005] Smart Paste](https://github.com/kasuken/PostNook/issues/15) | 1 | 5 | [US-002](https://github.com/kasuken/PostNook/issues/12) |

## [E04] LinkedIn Output

[Epic #5](https://github.com/kasuken/PostNook/issues/5)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[US-006] Generate Publishing Text](https://github.com/kasuken/PostNook/issues/16) | 1 | 5 | [TF-005](https://github.com/kasuken/PostNook/issues/28), [TF-006](https://github.com/kasuken/PostNook/issues/29) |
| [[US-007] Character Counter](https://github.com/kasuken/PostNook/issues/17) | 1 | 2 | [US-006](https://github.com/kasuken/PostNook/issues/16) |
| [[US-008] Copy Post](https://github.com/kasuken/PostNook/issues/18) | 2 | 3 | [US-006](https://github.com/kasuken/PostNook/issues/16), [US-007](https://github.com/kasuken/PostNook/issues/17), [US-009](https://github.com/kasuken/PostNook/issues/19), [TF-003](https://github.com/kasuken/PostNook/issues/26) |

## [E05] Draft Management

[Epic #6](https://github.com/kasuken/PostNook/issues/6)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[US-009] Automatically Save Drafts](https://github.com/kasuken/PostNook/issues/19) | 2 | 8 | [TF-004](https://github.com/kasuken/PostNook/issues/27) |
| [[US-010] Manage Multiple Drafts](https://github.com/kasuken/PostNook/issues/20) | 2 | 5 | [US-009](https://github.com/kasuken/PostNook/issues/19) |

## [E06] Preview

[Epic #7](https://github.com/kasuken/PostNook/issues/7)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[US-011] Preview the Finished Post](https://github.com/kasuken/PostNook/issues/21) | 2 | 5 | [US-006](https://github.com/kasuken/PostNook/issues/16), [US-010](https://github.com/kasuken/PostNook/issues/20) |

## [E07] Settings and Accessibility

[Epic #8](https://github.com/kasuken/PostNook/issues/8)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[US-012] Select Application Theme](https://github.com/kasuken/PostNook/issues/22) | 3 | 2 | [UX-001](https://github.com/kasuken/PostNook/issues/30) |
| [[US-013] Configure Output Behavior](https://github.com/kasuken/PostNook/issues/23) | 3 | 3 | [US-006](https://github.com/kasuken/PostNook/issues/16), [US-007](https://github.com/kasuken/PostNook/issues/17), [US-011](https://github.com/kasuken/PostNook/issues/21), [UX-001](https://github.com/kasuken/PostNook/issues/30) |
| [[UX-001] Build the narrow side-panel shell and recoverable states](https://github.com/kasuken/PostNook/issues/30) | 1 | TBC | [TF-001](https://github.com/kasuken/PostNook/issues/24) |

## [E08] Quality, Security, and Compatibility

[Epic #9](https://github.com/kasuken/PostNook/issues/9)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[QA-001] Complete serializer, import, counter, and storage test matrices](https://github.com/kasuken/PostNook/issues/31) | 3 | TBC | [US-004](https://github.com/kasuken/PostNook/issues/14), [US-005](https://github.com/kasuken/PostNook/issues/15), [US-006](https://github.com/kasuken/PostNook/issues/16), [US-007](https://github.com/kasuken/PostNook/issues/17), [US-009](https://github.com/kasuken/PostNook/issues/19) |
| [[QA-002] Verify recovery, integration, and browser compatibility](https://github.com/kasuken/PostNook/issues/32) | 3 | TBC | [US-001](https://github.com/kasuken/PostNook/issues/11), [US-008](https://github.com/kasuken/PostNook/issues/18), [US-009](https://github.com/kasuken/PostNook/issues/19), [US-010](https://github.com/kasuken/PostNook/issues/20), [US-011](https://github.com/kasuken/PostNook/issues/21), [US-012](https://github.com/kasuken/PostNook/issues/22), [US-013](https://github.com/kasuken/PostNook/issues/23) |
| [[QA-003] Audit privacy, permissions, CSP, and paste security](https://github.com/kasuken/PostNook/issues/33) | 3 | TBC | [US-004](https://github.com/kasuken/PostNook/issues/14), [US-005](https://github.com/kasuken/PostNook/issues/15), [US-009](https://github.com/kasuken/PostNook/issues/19) |
| [[QA-004] Validate accessibility and performance targets](https://github.com/kasuken/PostNook/issues/34) | 3 | TBC | [UX-001](https://github.com/kasuken/PostNook/issues/30), [US-012](https://github.com/kasuken/PostNook/issues/22), [US-013](https://github.com/kasuken/PostNook/issues/23) |
| [[QA-005] Run manual LinkedIn paste compatibility tests](https://github.com/kasuken/PostNook/issues/35) | 3 | TBC | [US-005](https://github.com/kasuken/PostNook/issues/15), [US-006](https://github.com/kasuken/PostNook/issues/16), [US-007](https://github.com/kasuken/PostNook/issues/17), [US-008](https://github.com/kasuken/PostNook/issues/18), [US-011](https://github.com/kasuken/PostNook/issues/21) |

## [E09] Delivery, Documentation, and Release

[Epic #10](https://github.com/kasuken/PostNook/issues/10)

| Child | Sprint | Points | Dependencies |
| --- | --- | --- | --- |
| [[REL-001] Implement validation and release packaging workflows](https://github.com/kasuken/PostNook/issues/36) | 0 | TBC | [TF-001](https://github.com/kasuken/PostNook/issues/24) |
| [[REL-002] Write engineering, privacy, and user documentation](https://github.com/kasuken/PostNook/issues/37) | 3 | TBC | [US-009](https://github.com/kasuken/PostNook/issues/19), [US-013](https://github.com/kasuken/PostNook/issues/23), [QA-003](https://github.com/kasuken/PostNook/issues/33) |
| [[REL-003] Prepare extension icons and marketplace submissions](https://github.com/kasuken/PostNook/issues/38) | 3 | TBC | [REL-001](https://github.com/kasuken/PostNook/issues/36), [REL-002](https://github.com/kasuken/PostNook/issues/37), [QA-005](https://github.com/kasuken/PostNook/issues/35) |
| [[REL-004] Complete v0.1.0 release gates and consent-based pilot plan](https://github.com/kasuken/PostNook/issues/39) | 3 | TBC | [QA-001](https://github.com/kasuken/PostNook/issues/31), [QA-002](https://github.com/kasuken/PostNook/issues/32), [QA-003](https://github.com/kasuken/PostNook/issues/33), [QA-004](https://github.com/kasuken/PostNook/issues/34), [QA-005](https://github.com/kasuken/PostNook/issues/35), [REL-001](https://github.com/kasuken/PostNook/issues/36), [REL-002](https://github.com/kasuken/PostNook/issues/37), [REL-003](https://github.com/kasuken/PostNook/issues/38) |
