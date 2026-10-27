# PostNook

**Post Editor for LinkedIn**

Your little corner for better posts.

PostNook is a planned free, local-first Chrome and Edge extension for writing LinkedIn posts in the browser side panel. The v0.1.0 scope includes editing, Markdown import, smart paste, local drafts, preview, and manual clipboard export.

## Project status

The PRD and implementation backlog are ready. Application implementation has not started; there is no installable extension or released package yet.

- [Product requirements, version 1.0](docs/PRD.md)
- [Original supplied PRD](docs/PRD.source.txt)
- [Epics and child issues](docs/backlog-index.md)
- [Machine-readable backlog](docs/backlog.json)

## Product boundaries

Drafts remain on the device. The product requires no account, backend, LinkedIn credentials, page access, scraping, or automatic publishing. Users copy the generated text, paste it into LinkedIn, and publish manually.

Plain text is the default output. Optional Unicode emphasis requires an accessibility warning. Preview and character counts are estimates of the publishing result; compatibility must be validated.

## Implementation sequence

Start with Sprint 0: scaffold React, TypeScript, and Vite; validate the native side panel, clipboard, IndexedDB, Tiptap, Markdown conversion, and serialization in Chrome and Edge. Continue with the PRD's writing, persistence, and release sprints.

The backlog retains E01-E07 and US-001-US-013 from the PRD. E00, E08, E09, and prefixed engineering tasks decompose its foundation, quality, and release requirements. Derived tasks are not given invented story-point estimates. Future v0.2, v0.3, and v1.0 ideas remain in the PRD outside the MVP backlog.

## Document provenance

`docs/PRD.source.txt` preserves the supplied PRD verbatim. `docs/PRD.md` adds Markdown headings and tables for navigation without revising requirements. External API, library, platform, and policy statements are supplied assumptions to validate during implementation.
