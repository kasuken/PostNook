# PostNook: Product Requirements Document

Product: PostNook
Headline: Post Editor for LinkedIn
Tagline: Your little corner for better posts.
Document version: 1.0
Target release: v0.1.0
Date: October 27, 2026
Status: Ready for implementation
Platforms: Google Chrome and Microsoft Edge
Release model: Free, local-first browser extension

---

## 1. Product Overview

### 1.1 Product Summary

PostNook is a lightweight browser extension providing a dedicated writing workspace inside the native Chrome and Edge side panel.

Users can write, format, preview, save, and organize LinkedIn posts without leaving their current browser tab.

The final post is copied to the system clipboard. Users manually paste it into LinkedIn and publish it themselves.

PostNook does not modify LinkedIn, scrape data, access LinkedIn accounts, or automate publishing.

### 1.2 Problem Statement

LinkedIn’s post composer offers limited formatting capabilities compared with a conventional writing editor.

Users experience friction when:

* Writing and organizing longer posts.
* Applying formatting.
* Moving content from Markdown-based tools.
* Copying content from Word, Notion, Google Docs, or ChatGPT.
* Preserving paragraph spacing.
* Managing multiple drafts.
* Recovering content after editing problems.
* Previewing posts before publishing.

Existing alternatives address some of these problems but may require multiple tools, external accounts, or broad functionality that individual writers do not need.

PostNook offers an independent, simple, and reliable writing workspace.

### 1.3 Product Vision

Make writing LinkedIn posts as simple and reliable as using a dedicated text editor.

### 1.4 Value Proposition

A better way to write LinkedIn posts, right beside LinkedIn. Format, preview, and save your work. Copy when you’re ready. No account required.

### 1.5 Design Principles

1. Local-first: User content remains on the device.
2. Simple: Minimize UI complexity and unnecessary actions.
3. Reliable: Draft persistence is a critical product feature.
4. Private: No LinkedIn credentials, scraping, or telemetry by default.
5. Accessible: Prefer standard characters and readable formatting.
6. Independent: Work without depending on LinkedIn’s DOM or APIs.
7. Predictable: Preview the actual text being copied, not unsupported formatting.

---

## 2. Goals and Success Criteria

### 2.1 Primary Goals

G-001: Simplify post creation

Users can compose and format a post inside the side panel without switching tabs.

G-002: Protect user content

Writing is automatically persisted locally and can be recovered after closing and reopening the panel or browser.

G-003: Improve content portability

Users can import commonly formatted text and export a LinkedIn-compatible representation.

G-004: Minimize platform exposure

PostNook operates independently of LinkedIn’s website.

G-005: Validate recurring usage

Establish whether frequent LinkedIn publishers return to PostNook for subsequent posts.

### 2.2 MVP Success Metrics

| KPI | Target | Measurement |
| --- | --- | --- |
| First-post activation | 60% | Opt-in pilot observation |
| Successful copy/paste | 95% | Controlled compatibility testing |
| Draft recovery | 100% of defined recovery tests | Automated and manual QA |
| Second-post creation | 40% | Opt-in pilot measurement |
| Week-4 retention | 25% | Opt-in pilot measurement |
| Pilot satisfaction | 8/10 | User survey |
| Critical data-loss defects | 0 unresolved | Release defect tracker |

These are validation targets, not proven benchmarks.

No analytics SDK is required for v0.1.0. Behavioral measurement can be conducted during a consent-based pilot.

---

## 3. Scope

### 3.1 In Scope: v0.1.0

* Manifest V3 browser extension.
* Chrome and Edge compatibility.
* Native browser side panel.
* Rich-text editor.
* Basic formatting toolbar.
* Markdown shortcuts and import.
* Smart paste normalization.
* LinkedIn-compatible output generation.
* Optional Unicode emphasis formatting.
* Character counter.
* One-click clipboard export.
* Local draft persistence.
* Multiple drafts.
* Automatic saving.
* Basic desktop and mobile previews.
* Light and dark themes.
* Basic settings.
* Error handling.
* Accessibility.
* Privacy documentation.
* Browser store distribution.

### 3.2 Out of Scope: v0.1.0

* LinkedIn account authentication.
* LinkedIn API integration.
* Direct posting.
* Scheduling.
* Reading existing LinkedIn posts.
* LinkedIn profile or engagement analytics.
* AI writing and rewriting.
* Cloud synchronization.
* Team collaboration.
* User registration.
* Payments or subscriptions.
* Image and video editing.
* Post attachments.
* Advanced templates.
* Snippets.
* Advanced revision history.
* Full-tab editing mode.
* HTML clipboard publishing as a supported feature.
* Native mobile applications.

### 3.3 Non-Negotiable Constraints

The MVP must not:

* Inject scripts or components into LinkedIn.
* Read LinkedIn page content.
* Manipulate LinkedIn’s composer.
* Automatically paste or publish posts.
* Access LinkedIn cookies or credentials.
* Request broad website permissions.
* Send draft content to external services.
* Execute remotely hosted JavaScript.

---

## 4. Target Users

### 4.1 Primary Persona: Frequent LinkedIn Publisher

Profile: Professional publishing at least twice weekly.

Needs:

* Fast post composition.
* Reliable draft saving.
* Simple formatting.
* Easy copy and paste.
* Minimal application complexity.

Success: Creates and copies a post without switching to another writing tool.

### 4.2 Secondary Persona: Technical Content Creator

Profile: Developer, technical lead, engineer, consultant, or speaker.

Needs:

* Markdown-based writing.
* Readable lists and spacing.
* Easy transfer from technical tools.
* Saved drafts for announcements and articles.

Success: Converts Markdown-based content into readable LinkedIn text without manually fixing the entire post.

### 4.3 Secondary Persona: Occasional Publisher

Profile: Professional publishing infrequently.

Needs:

* No registration.
* Intuitive editor.
* Low learning curve.
* Clear formatting limitations.

Success: Creates a post successfully during the first session.

---

## 5. Core User Journey

Journey A: First-Time User

1. Install PostNook.
2. Click the browser extension icon.
3. See the welcome state inside the side panel.
4. Select Create first post.
5. Enter text.
6. Apply formatting.
7. See the character counter update.
8. Open the preview.
9. Click Copy Post.
10. Paste the text into LinkedIn.
11. Publish manually.

Expected result: The user completes the workflow without authentication or external configuration.

Journey B: Returning User

1. Open PostNook.
2. The previously active draft loads.
3. Continue editing.
4. See the saved status.
5. Copy the updated post.
6. Close the side panel.

Expected result: The draft remains available for future editing.

Journey C: Markdown Import

1. Create a new draft.
2. Select Paste as Markdown.
3. Paste Markdown content.
4. PostNook parses supported elements.
5. The user edits the resulting document.
6. Preview the generated output.
7. Copy the post.

Expected result: Supported Markdown structures are preserved without displaying raw Markdown markers in the final plain-text output.

Journey D: Recovery

1. User edits an existing draft.
2. The autosave service commits the change.
3. Browser or side panel closes.
4. User reopens PostNook.
5. The latest successfully persisted content appears.

Expected result: No content committed to storage is lost.

---

## 6. Functional Requirements

### Epic E01: Browser Extension Foundation

#### US-001: Open PostNook from the Browser

Priority: P0
Story points: 3

**User Story**

As a browser user, I want to open PostNook from the extension toolbar so that I can write without leaving my current website.

**Acceptance Criteria**

* AC-001.1: Clicking the PostNook icon opens the native browser side panel.
* AC-001.2: The panel can open when LinkedIn is active.
* AC-001.3: The panel also works when another website is active.
* AC-001.4: Closing the panel does not delete stored drafts.
* AC-001.5: Reopening the panel restores the previous active draft.
* AC-001.6: No website access permission is required.
* AC-001.7: The application displays a usable state when no drafts exist.
* AC-001.8: Browser API initialization errors display a recoverable error state.

**Technical Notes**

Use:

* Manifest V3.
* chrome.sidePanel.
* Global side_panel.default_path.
* Extension action icon.
* chrome.sidePanel.setPanelBehavior() to enable opening through the action icon.

A background service worker may be used for extension initialization but must not own draft editing state.

The Chrome target is version 116 or later. Edge compatibility must be validated against the same required APIs.

**Definition of Done**

The extension opens successfully on the supported versions of Chrome and Edge and requires no LinkedIn-specific permissions.

---

### Epic E02: Writing Editor

#### US-002: Create and Edit a Post

Priority: P0
Story points: 5

**User Story**

As a writer, I want a comfortable editing environment so that I can create LinkedIn posts without fighting the native composer.

**Acceptance Criteria**

* AC-002.1: Users can create a new document.
* AC-002.2: Users can type, select, delete, and replace text.
* AC-002.3: Enter creates a new paragraph.
* AC-002.4: Shift+Enter inserts a line break within the paragraph.
* AC-002.5: Ctrl/Cmd+Z performs undo.
* AC-002.6: Ctrl/Cmd+Shift+Z performs redo.
* AC-002.7: Ctrl/Cmd+B toggles bold on the selection.
* AC-002.8: Ctrl/Cmd+I toggles italic on the selection.
* AC-002.9: Cursor location remains stable when applying formatting.
* AC-002.10: The editor works with empty and long documents.
* AC-002.11: User content is never replaced silently when parsing fails.
* AC-002.12: Unsupported pasted elements are converted to text or supported nodes.

**Supported Document Elements**

* Paragraph.
* Hard line break.
* Text.
* Bold mark.
* Italic mark.
* Bullet list.
* Ordered list.
* List item.

Headings, tables, code blocks, images, embedded media, and arbitrary HTML elements are not native v0.1 document types.

**Technical Notes**

Use Tiptap with a minimal extension configuration.

Disable unnecessary StarterKit features rather than exposing formatting that cannot be represented in the LinkedIn output.

Store the structured document as Tiptap-compatible JSON.

---

#### US-003: Format Text

Priority: P0
Story points: 3

**User Story**

As a writer, I want a compact toolbar so that I can structure my content without memorizing formatting syntax.

**Acceptance Criteria**

* AC-003.1: Toolbar provides bold, italic, bullet list, and numbered list controls.
* AC-003.2: Toolbar provides undo and redo.
* AC-003.3: Toolbar provides clear-formatting functionality.
* AC-003.4: Active formatting is visually indicated.
* AC-003.5: Disabled commands are visually and programmatically disabled.
* AC-003.6: Formatting commands are keyboard-accessible.
* AC-003.7: Applying formatting does not lose the current selection.
* AC-003.8: The editor explains that internal formatting may differ from published LinkedIn text.

**Important Behavior**

Bold and italic are stored as editor marks.

In the default plain-text output mode, those marks do not generate Unicode styling and are not represented as visible Markdown markers.

Users must select the optional Unicode output mode if they want compatible characters visually transformed.

The preview always shows the output generated for the currently selected mode.

---

### Epic E03: Markdown and Smart Paste

#### US-004: Import Markdown

Priority: P0
Story points: 5

**User Story**

As a technical content creator, I want to import Markdown so that I can reuse content written in development tools.

**Supported Syntax**

| Markdown | Editor Representation |
| --- | --- |
| Paragraphs | Paragraphs |
| **bold** | Bold mark |
| *italic* | Italic mark |
| - item | Bullet list |
| 1. item | Numbered list |
| Line breaks | Paragraph or hard break according to parser rules |

**Acceptance Criteria**

* AC-004.1: A Paste as Markdown action is available.
* AC-004.2: Supported Markdown converts to structured editor content.
* AC-004.3: Normal paste does not automatically interpret every Markdown-looking string.
* AC-004.4: Unsupported Markdown is preserved as readable text where possible.
* AC-004.5: Parsing failures do not remove the user’s existing content.
* AC-004.6: Imported text remains editable.
* AC-004.7: Markdown import and output generation are covered by unit tests.
* AC-004.8: Importing Markdown never executes HTML, scripts, or embedded instructions.

**Technical Decision**

Tiptap’s Markdown extension is beta.

Place Markdown conversion behind a dedicated adapter interface so the implementation can be replaced if necessary.

Persist editor JSON rather than Markdown strings.

---

#### US-005: Smart Paste

Priority: P0
Story points: 5

**User Story**

As a writer, I want pasted content cleaned automatically so that I don’t waste time fixing formatting from other applications.

**Expected Sources**

* ChatGPT.
* Microsoft Word.
* Google Docs.
* Notion.
* VS Code.
* Plain-text editors.

**Acceptance Criteria**

* AC-005.1: Normal paste accepts text/plain.
* AC-005.2: When suitable text/html is available, supported semantic formatting may be retained.
* AC-005.3: Dangerous markup is removed.
* AC-005.4: Script elements and event attributes are never executed.
* AC-005.5: Paragraph boundaries are retained where possible.
* AC-005.6: Non-breaking spaces are normalized when appropriate.
* AC-005.7: Emoji and non-Latin characters are preserved.
* AC-005.8: Pasting unsupported tables produces readable text rather than silently dropping content.
* AC-005.9: Users can undo the paste operation.
* AC-005.10: Clipboard read errors display a useful message without damaging the existing document.

**Processing Rules**

1. Read clipboard data from the user-initiated paste event.
2. Prefer supported semantic structure when safe.
3. Sanitize source HTML.
4. Convert supported elements to Tiptap nodes.
5. Normalize unsupported structure.
6. Insert the result at the current selection.
7. Trigger autosave.

Never access the clipboard continuously in the background.

---

### Epic E04: LinkedIn Output

#### US-006: Generate Publishing Text

Priority: P0
Story points: 5

**User Story**

As a writer, I want PostNook to generate text suitable for LinkedIn so that I can paste my content without manually restructuring it.

**Output Modes**

Mode 1: Plain Text

Default and required for MVP.

Mode 2: Unicode Styling

Optional, with an accessibility warning.

Rich HTML clipboard output is excluded from the supported MVP. It can be evaluated separately after compatibility testing.

**Plain-Text Serialization Rules**

* Paragraphs are separated by two newline characters.
* Hard breaks become one newline.
* Bullet items begin with • .
* Numbered items begin with sequential 1. , 2. , etc.
* List items are separated by single newlines.
* Paragraph-to-list transitions use one blank line.
* Leading and trailing empty paragraphs are trimmed.
* Accidental excessive empty paragraphs are normalized to a maximum of one blank line in generated output.
* URLs, hashtags, mentions, and emojis remain ordinary text.
* Internal bold and italic marks are ignored in plain output.
* No Markdown markers are added unless they were entered as literal text.

**Unicode Styling Rules**

* Only explicitly marked bold or italic text is transformed.
* Unsupported characters remain unchanged.
* URLs, hashtags, and mentions are not transformed.
* The user receives a warning about readability and accessibility.
* The preview reflects transformed characters.
* The character counter recalculates after transformation.
* Users can return to plain-text mode without changing the underlying document.

**Acceptance Criteria**

* AC-006.1: The same document and output mode generate deterministic text.
* AC-006.2: Empty content produces an empty output string.
* AC-006.3: Basic paragraphs retain their intended spacing.
* AC-006.4: Lists are readable after pasting.
* AC-006.5: Emoji and international characters are preserved.
* AC-006.6: Generated text contains no unexpected HTML tags.
* AC-006.7: The preview and clipboard use the same serialization service.
* AC-006.8: Changing output mode never changes the stored editor document.
* AC-006.9: Malformed or unsupported internal nodes fail safely.
* AC-006.10: No automatic LinkedIn page interaction occurs.

**Implementation Requirement**

Use a pure output function equivalent to:

serializePost(document, outputMode) -> string

This service must have no dependency on React, browser extension APIs, or LinkedIn.

---

#### US-007: Character Counter

Priority: P0
Story points: 2

**User Story**

As a writer, I want to see the estimated length of my finished post so that I can avoid exceeding LinkedIn’s posting limit.

**Acceptance Criteria**

* AC-007.1: Counter updates when content changes.
* AC-007.2: Counter uses serialized output, not raw editor JSON.
* AC-007.3: LinkedIn’s current 3,000-character limit is displayed.
* AC-007.4: A warning appears when the estimated count approaches the limit.
* AC-007.5: A clear error state appears when the estimate exceeds 3,000.
* AC-007.6: Unicode formatting changes trigger recounting.
* AC-007.7: Over-limit content can still be edited and saved.
* AC-007.8: Copying over-limit content requires an explicit warning but is not silently blocked.

**Technical Note**

Initially use UTF-16 code-unit length as a conservative estimate.

LinkedIn’s exact handling of Unicode sequences must be checked against actual publishing behavior.

Do not describe the count as an exact platform guarantee until validated.

---

#### US-008: Copy Post

Priority: P0
Story points: 3

**User Story**

As a writer, I want to copy my completed post with one click so that I can publish it manually.

**Acceptance Criteria**

* AC-008.1: Copy Post is available in the editor.
* AC-008.2: Clicking it copies generated output, not editor HTML.
* AC-008.3: It uses the user-triggered browser Clipboard API.
* AC-008.4: Successful copying displays confirmation.
* AC-008.5: A clipboard failure displays an actionable error.
* AC-008.6: Copy does not clear the editor.
* AC-008.7: Copy does not change the current draft.
* AC-008.8: The last copied timestamp is stored only after a successful copy.
* AC-008.9: Empty drafts cannot trigger a misleading success message.
* AC-008.10: No LinkedIn API calls or DOM manipulation occur.

**Technical Notes**

Use navigator.clipboard.writeText() from a direct user interaction.

Prototype clipboard permissions on both browsers before adding extra manifest permissions.

If the operation is unavailable, provide a manual select-and-copy fallback.

---

### Epic E05: Draft Management

#### US-009: Automatically Save Drafts

Priority: P0
Story points: 8

**User Story**

As a writer, I want my work saved automatically so that I can return to it after closing the browser or experiencing interruptions.

**Acceptance Criteria**

* AC-009.1: A new draft receives a unique identifier.
* AC-009.2: Changes are persisted to IndexedDB.
* AC-009.3: Autosave is debounced to reduce excessive writes.
* AC-009.4: Continuous typing triggers periodic persistence.
* AC-009.5: Save status is visible.
* AC-009.6: Successfully persisted content survives reopening the browser.
* AC-009.7: Storage failures are reported instead of silently ignored.
* AC-009.8: Pending writes are flushed where possible when focus is lost or the panel closes.
* AC-009.9: Saving uses transactions that avoid partial document writes.
* AC-009.10: A second open panel must not silently overwrite newer changes from another browser window.
* AC-009.11: A schema migration preserves existing draft content.

**Autosave Defaults**

* Debounce: 300 milliseconds.
* Maximum wait during continuous typing: 1,500 milliseconds.
* Save on explicit draft switching.
* Attempt to flush pending changes on visibility change.
* Reconcile storage revision conflicts.

A crash can still lose edits that have not yet committed. The product must never falsely claim that uncommitted edits were saved.

**Save States**

* Saved
* Saving
* Unsaved changes
* Save failed
* Storage unavailable

**Error Handling**

On a storage error:

1. Keep unsaved content in the active editor.
2. Display a persistent error state.
3. Offer retry.
4. Avoid changing the displayed state to Saved until persistence succeeds.
5. Warn users before actions that could discard the unsaved content.

---

#### US-010: Manage Multiple Drafts

Priority: P0
Story points: 5

**User Story**

As a writer, I want multiple drafts so that I can prepare different posts independently.

**Acceptance Criteria**

* AC-010.1: Users can create a draft.
* AC-010.2: Users can rename a draft.
* AC-010.3: Users can switch between drafts.
* AC-010.4: Users can delete a draft.
* AC-010.5: Deleting requires confirmation.
* AC-010.6: Drafts are sorted by last modification time.
* AC-010.7: The last active draft is restored on reopening.
* AC-010.8: Switching drafts saves the current draft first.
* AC-010.9: Empty-state messaging appears when no drafts exist.
* AC-010.10: If a draft cannot be loaded, users see an error instead of a blank replacement document.

**UI Requirements**

Draft selector displays:

* Draft title.
* Last modified timestamp.
* Current active state.

**Default Title**

Use Untitled Post until renamed.

The editor must not automatically overwrite a user-defined title.

---

### Epic E06: Preview

#### US-011: Preview the Finished Post

Priority: P0
Story points: 5

**User Story**

As a writer, I want to preview my post so that I can inspect the content before publishing.

**Acceptance Criteria**

* AC-011.1: Users can open preview mode.
* AC-011.2: Users can select desktop or mobile presentation.
* AC-011.3: Preview uses the generated output.
* AC-011.4: Paragraph and list spacing matches output serialization.
* AC-011.5: Unicode styling appears only when selected.
* AC-011.6: Long content remains scrollable.
* AC-011.7: Users can return to editing without losing position or content.
* AC-011.8: An explanatory label states that LinkedIn may render the pasted content differently.
* AC-011.9: No LinkedIn content is downloaded or scraped to construct the preview.

**Design Requirement**

The preview should reproduce the essential visual structure of a LinkedIn post without copying LinkedIn branding or claiming pixel-perfect compatibility.

An estimated “see more” boundary may be added only if a testable approximation is available.

---

### Epic E07: Settings and Accessibility

#### US-012: Select Application Theme

Priority: P0
Story points: 2

**User Story**

As a user, I want PostNook to match my preferred appearance.

**Acceptance Criteria**

* AC-012.1: Light theme is supported.
* AC-012.2: Dark theme is supported.
* AC-012.3: System preference is the default.
* AC-012.4: Theme selection persists between sessions.
* AC-012.5: Theme changes do not interrupt editing.
* AC-012.6: Core controls meet WCAG 2.2 AA contrast and keyboard interaction requirements.

---

#### US-013: Configure Output Behavior

Priority: P0
Story points: 3

**User Story**

As a writer, I want control over the text copied from PostNook.

**Acceptance Criteria**

* AC-013.1: Default output is plain text.
* AC-013.2: Unicode styling is opt-in.
* AC-013.3: The active output mode is visible.
* AC-013.4: Unicode mode displays an accessibility warning before first use.
* AC-013.5: Preferences persist locally.
* AC-013.6: Changing output mode immediately updates the counter and preview.
* AC-013.7: Switching output modes does not alter the original document.

---

## 7. UI and UX Requirements

### 7.1 Layout

PostNook must fit a narrow browser side panel.

Header

* PostNook identity.
* Active draft title.
* New draft action.
* Draft selector.
* Settings action.

Editor Toolbar

* Bold.
* Italic.
* Bullet list.
* Numbered list.
* Undo.
* Redo.
* Clear formatting.
* Paste as Markdown.

Main Content

* Scrollable writing editor.
* Clear focus state.
* Empty-document placeholder.

Footer

* Character counter.
* Save status.
* Output mode control.
* Preview action.
* Primary Copy Post action.

### 7.2 Minimum Supported Width

Target a usable layout from approximately 320 CSS pixels upward.

Below this width, controls may collapse into an overflow menu. Horizontal scrolling of the entire application should be avoided.

### 7.3 Empty States

No drafts

Display a clear Create First Post action.

Empty draft

Display: Start writing your post...

No content to copy

Disable Copy Post or explain why no content is available.

### 7.4 Error States

Required error handling:

* IndexedDB unavailable.
* Draft load failure.
* Draft save failure.
* Markdown parsing failure.
* Clipboard permission or write failure.
* Storage quota exceeded.
* Stale revision conflict.
* Unexpected editor initialization failure.

Error messages must distinguish retryable errors from actions that could permanently lose data.

### 7.5 Accessibility

The UI must:

* Support keyboard navigation.
* Provide visible focus indicators.
* Give icon-only buttons accessible names.
* Announce meaningful save/copy status changes.
* Maintain sufficient contrast.
* Avoid relying only on color for warnings.
* Respect reduced-motion preferences.
* Use semantic labels and controls.

---

## 8. Technical Architecture

### 8.1 Technology Stack

| Layer | Technology |
| --- | --- |
| Extension standard | Manifest V3 |
| Language | TypeScript |
| UI | React |
| Build tooling | Vite |
| Editor | Tiptap |
| Styling | Tailwind CSS |
| Local persistence | IndexedDB |
| Database wrapper | Dexie |
| Preferences | chrome.storage.local |
| Clipboard | Web Clipboard API |
| Browser panel | chrome.sidePanel |
| Unit tests | Vitest |
| UI tests | React Testing Library |
| Browser tests | Playwright |
| CI | GitHub Actions |
| Backend | None |
| Authentication | None |

### 8.2 Architecture Overview

Browser extension

* Manifest.
* Action icon.
* Side-panel registration.
* Lightweight background service worker.

Side-panel React application

* Application shell.
* Editor.
* Toolbar.
* Draft selector.
* Preview.
* Settings.
* Notifications.

Application services

* DraftRepository.
* AutosaveService.
* MarkdownAdapter.
* PasteNormalizer.
* PostSerializer.
* CharacterCounter.
* ClipboardService.
* SettingsRepository.

Persistence

* IndexedDB for documents.
* Browser extension storage for lightweight preferences.

Output

* User-triggered clipboard copy.
* Manual paste into LinkedIn.

### 8.3 Architecture Rules

1. Domain logic must not depend on React.
2. Database access must be isolated behind repository interfaces.
3. Clipboard access must be isolated behind an adapter.
4. Serialization must be deterministic.
5. Browser-specific API calls must not appear in reusable domain code.
6. No application feature may directly read the active website’s DOM.
7. Editor content must never be sent to a server.
8. The background service worker must not be the source of truth for unsaved drafts.

### 8.4 Suggested Repository Structure

* src/extension/ — Manifest and service-worker initialization.
* src/sidepanel/ — Side-panel application entry point.
* src/components/ — Shared UI components.
* src/features/editor/ — Editor and formatting.
* src/features/drafts/ — Draft management.
* src/features/preview/ — Preview components.
* src/features/settings/ — Settings UI.
* src/domain/ — Types and pure business rules.
* src/services/ — Serialization, Markdown, clipboard, autosave.
* src/storage/ — IndexedDB repositories and migrations.
* src/browser/ — Chrome/Edge API adapters.
* src/styles/ — Themes and application styling.
* tests/unit/ — Domain and service tests.
* tests/integration/ — Storage and component tests.
* tests/e2e/ — Browser extension tests.
* public/icons/ — Packaged extension icons.
* docs/ — Architecture, decisions, privacy, and support.

Use strict TypeScript configuration and explicit interfaces across the major service boundaries.

---

## 9. Data Model

### 9.1 Draft Entity

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID string | Yes | Unique draft identifier |
| title | string | Yes | User-defined title |
| content | Tiptap JSON document | Yes | Editable structured document |
| schemaVersion | integer | Yes | Stored document schema version |
| revision | integer | Yes | Optimistic concurrency revision |
| createdAt | ISO 8601 UTC string | Yes | Creation timestamp |
| updatedAt | ISO 8601 UTC string | Yes | Last successful content update |
| lastCopiedAt | ISO 8601 UTC string or null | No | Last successful copy timestamp |

**Constraints**

* Title: Maximum 120 characters.
* IDs: UUID v4.
* Initial revision: 1.
* Timestamps: UTC.
* Content: Must validate against the supported editor schema.
* New documents: One empty paragraph.
* Draft persistence must be transactional.

### 9.2 Settings Entity

| Field | Type | Default |
| --- | --- | --- |
| theme | system, light, dark | system |
| outputMode | plain, unicode | plain |
| previewMode | desktop, mobile | desktop |
| activeDraftId | UUID or null | null |
| unicodeWarningAcknowledged | boolean | false |
| settingsSchemaVersion | integer | 1 |

Autosave is mandatory in v0.1 and does not need a user-facing disable toggle.

### 9.3 Database Definition

Database name: postnook

Initial schema version: 1

Object stores:

drafts

* Primary key: id.
* Index: updatedAt.
* Index: createdAt.

Preferences are stored separately in extension storage.

### 9.4 Persistence Rules

* Initialize the database before loading documents.
* Validate document data before passing it to Tiptap.
* Save using revision-aware transactions.
* Do not overwrite a newer revision with stale content.
* Keep the current editor state intact after save failure.
* Maintain an explicit migration process for future versions.
* Do not delete unknown records during schema migration.
* Report storage quota issues.

### 9.5 Concurrency

If a draft has changed in another extension window:

1. Reject a stale overwrite.
2. Preserve unsaved editor content.
3. Notify the user.
4. Offer a safe reload or duplicate-draft recovery path.

A more advanced merging system is out of scope.

---

## 10. Application Service Contracts

DraftRepository

Required operations:

* createDraft(title, content)
* getDraft(id)
* listDrafts()
* updateDraft(id, expectedRevision, content, title)
* deleteDraft(id)
* updateLastCopiedAt(id, timestamp)

updateDraft must return the new stored revision or a typed conflict/error result.

PostSerializer

Required operations:

* serialize(document, outputMode)
* validateDocument(document)

The serializer must be pure and deterministic.

MarkdownAdapter

Required operations:

* parse(markdown)
* serialize(document)

Markdown serialization is primarily for tests and future portability. LinkedIn clipboard output uses PostSerializer, not Markdown serialization.

PasteNormalizer

Required operations:

* normalizePlainText(input)
* normalizeHtml(input)
* parseSupportedClipboardContent(data)

The service must reject or neutralize executable content.

CharacterCounter

Required operations:

* count(serializedText)
* getLimitStatus(count)

Limit statuses:

* Normal.
* Approaching limit.
* Over limit.

Default warning threshold: 2,900 estimated characters.

ClipboardService

Required operations:

* copyText(text)

Returns success or an actionable failure. It must not report success until the clipboard write resolves.

AutosaveService

Responsibilities:

* Track dirty state.
* Debounce writes.
* Force periodic persistence.
* Handle save failures.
* Retry explicit failed writes.
* Avoid stale writes.
* Expose save status to the UI.

---

## 11. Browser Extension Manifest Requirements

The extension must include:

| Manifest Field | Requirement |
| --- | --- |
| manifest_version | 3 |
| name | PostNook |
| version | 0.1.0 |
| description | Concise product description |
| action | Extension icon and title |
| side_panel.default_path | Packaged side-panel HTML |
| background.service_worker | Packaged initialization worker |
| permissions | sidePanel, storage |
| icons | Actual packaged icon assets |
| minimum_chrome_version | 116 for the Chrome build |

The background worker must configure the action icon to open the side panel.

Do not define an action default_popup that prevents the intended icon-click behavior.

**Forbidden Permissions for MVP**

Do not request:

* tabs
* activeTab
* cookies
* scripting
* webRequest
* webRequestBlocking
* Broad host permissions
* LinkedIn-specific host permissions

Clipboard-related permissions must only be considered if compatibility testing proves them necessary and the narrower user-triggered API is insufficient.

No content scripts are allowed in v0.1.

---

## 12. Privacy and Security Requirements

### 12.1 Privacy

* No backend.
* No authentication.
* No LinkedIn credentials.
* No draft-content transmission.
* No advertising trackers.
* No third-party analytics SDK.
* No automatic clipboard reading.
* No background page inspection.

### 12.2 Content Security Policy

* Bundle executable code with the extension.
* Do not load executable code from CDNs.
* Do not use eval or dynamic code generation.
* Do not execute user-provided HTML.
* Avoid inline script execution.

### 12.3 Clipboard Safety

* Read clipboard content only through explicit user actions or paste events.
* Sanitize imported HTML.
* Never execute pasted scripts.
* Handle clipboard permission failures.

### 12.4 Storage Safety

* Use structured document validation.
* Handle unavailable storage.
* Detect quota errors.
* Implement schema migration tests.
* Avoid unverified claims of encryption.

### 12.5 User Data Limitations

Local drafts may be lost when the extension is uninstalled or its storage is removed.

The product must explain this limitation in help documentation.

A full backup/export feature is planned for v0.2. Until then, users can retain a manual copy of important posts outside the extension.

---

## 13. Non-Functional Requirements

Performance

| Requirement | Target |
| --- | --- |
| Side-panel initial interactive state | Within 2 seconds on reference hardware |
| Editor typing responsiveness | No perceptible lag under normal content |
| Typical formatting operation | Under 100 ms |
| Output serialization for a 3,000-character post | Under 50 ms |
| Typical draft save | Under 500 ms after save starts |
| Preview refresh | Under 200 ms |
| Browser tab navigation | Must not discard persisted data |

These are engineering acceptance targets and must be measured on reference hardware.

Reliability

* No unresolved critical data-loss defects.
* Committed drafts survive browser restart.
* Failed saves are visible.
* Stale writes are detected.
* Unsupported content never silently clears a draft.

Maintainability

* TypeScript strict mode.
* Modular service architecture.
* Unit tests for all serialization paths.
* Centralized error handling.
* Versioned database schema.
* Dependency versions pinned for production builds.

Accessibility

Target WCAG 2.2 AA for the PostNook interface.

Screen-reader and keyboard-only workflows must be included in release testing.

---

## 14. Test Strategy

### 14.1 Unit Tests

Serializer

Test:

* Empty document.
* Single paragraph.
* Multiple paragraphs.
* Single line break.
* Bullet lists.
* Numbered lists.
* Mixed paragraphs and lists.
* Bold and italic marks.
* Unicode conversion.
* Emoji.
* Hashtags.
* URLs.
* Non-Latin text.
* Excessive whitespace.
* Unsupported editor nodes.
* Malformed input.

Markdown Adapter

Test:

* Valid Markdown.
* Invalid Markdown.
* Mixed formatting.
* Nested structures.
* Unsupported syntax.
* Empty content.
* Large content.
* Safe treatment of embedded HTML.

Character Counter

Test:

* ASCII.
* Accented characters.
* Emoji.
* Combining characters.
* Surrogate pairs.
* Newlines.
* Unicode styling output.
* Exactly 3,000 estimated characters.
* More than 3,000 estimated characters.

Draft Repository

Test:

* Create.
* Read.
* Update.
* Delete.
* Sort.
* Conflict detection.
* Transaction rollback.
* Migration.
* Invalid document.
* Storage quota failure.

### 14.2 Integration Tests

Required scenarios:

1. Open editor and create draft.
2. Edit and autosave.
3. Switch drafts.
4. Reopen active draft.
5. Apply formatting and undo.
6. Paste HTML safely.
7. Import Markdown.
8. Preview serialized output.
9. Copy output.
10. Handle clipboard rejection.
11. Handle IndexedDB failure.
12. Recover after browser restart.
13. Resolve stale revision conflict.
14. Change output mode.
15. Change application theme.

### 14.3 Browser Compatibility Matrix

| Browser | OS | Requirement |
| --- | --- | --- |
| Chrome Stable | Windows 11 | Required |
| Chrome Stable | macOS | Required |
| Edge Stable | Windows 11 | Required |
| Edge Stable | macOS | Recommended |
| Previous major Chrome release | Windows | Compatibility regression |
| Previous major Edge release | Windows | Compatibility regression |

Only supported releases exposing the necessary side-panel APIs are in scope.

### 14.4 Manual LinkedIn Compatibility Testing

These tests must not be automated through scraping or interaction with LinkedIn.

A tester manually pastes generated output into LinkedIn and checks the result.

Test cases:

* Short plain-text post.
* Multiple paragraphs.
* Bullet list.
* Numbered list.
* Post containing URLs.
* Post containing hashtags.
* Emoji-heavy post.
* Non-English post.
* Unicode-styled text.
* Approximately 3,000-character post.
* Text copied from Word.
* Text copied from ChatGPT.

Record observed differences between PostNook preview and LinkedIn rendering.

If a conversion cannot be made reliable, document the limitation rather than claiming compatibility.

---

## 15. CI/CD Requirements

Use GitHub Actions.

Pull Request Pipeline

Run:

1. Dependency installation.
2. TypeScript type checking.
3. ESLint.
4. Formatting validation.
5. Unit tests.
6. Integration tests.
7. Production extension build.
8. Manifest validation.
9. Artifact creation.

Pull requests must fail when required checks fail.

Main Branch Pipeline

Run:

* All validation checks.
* Production build.
* Extension package generation.
* Build artifact publication.

Release Pipeline

On a version tag:

1. Validate the version.
2. Run tests.
3. Build production assets.
4. Package the Chrome extension.
5. Package the Edge extension.
6. Create checksums.
7. Attach artifacts to the GitHub release.

Automatic marketplace publishing is optional. Manual submission is sufficient for v0.1.

---

## 16. Implementation Roadmap

Estimates assume one experienced developer with AI coding assistance.

Story points represent relative complexity, not a guaranteed delivery timeline.

Sprint 0: Technical Foundation

| Task | Priority |
| --- | --- |
| Initialize React/TypeScript/Vite project | P0 |
| Configure Manifest V3 | P0 |
| Implement side-panel opening | P0 |
| Validate Chrome compatibility | P0 |
| Validate Edge compatibility | P0 |
| Test clipboard writing | P0 |
| Implement IndexedDB proof of concept | P0 |
| Validate Tiptap integration | P0 |
| Test Markdown import library | P0 |
| Prototype LinkedIn-compatible output | P0 |

Exit condition: A text-only side panel can save, reopen, and copy content in Chrome and Edge.

Sprint 1: Core Writing Experience

Stories:

* US-002.
* US-003.
* US-004.
* US-005.
* US-006.
* US-007.

Deliverables:

* Editor.
* Formatting toolbar.
* Markdown conversion.
* Smart paste.
* Serializer.
* Character counter.

Exit condition: A user can prepare a complete post with reliable generated output.

Sprint 2: Persistence and Publishing Workflow

Stories:

* US-008.
* US-009.
* US-010.
* US-011.

Deliverables:

* Clipboard integration.
* IndexedDB repository.
* Autosave.
* Draft management.
* Post preview.
* Recovery handling.

Exit condition: Users can return to drafts and manually transfer completed posts.

Sprint 3: Product Quality and Release

Stories:

* US-012.
* US-013.
* Browser compatibility.
* Accessibility.
* Security tests.
* Documentation.
* Marketplace assets.

Deliverables:

* Themes.
* Settings.
* Error handling.
* Final QA.
* Store listings.
* Version 0.1.0 packages.

Exit condition: All release-blocking requirements pass.

---

## 17. Definition of Done

Every user story must meet the following conditions:

* Functional acceptance criteria pass.
* Code passes TypeScript strict checks.
* Relevant unit tests exist.
* Required integration tests pass.
* No critical accessibility regressions.
* No unnecessary browser permissions are introduced.
* No LinkedIn scraping or automation is introduced.
* Error states are handled.
* Code is reviewed.
* Documentation is updated.
* The feature works in supported browsers.

---

## 18. MVP Release Gates

PostNook v0.1.0 may be released when:

* [ ] Chrome side-panel opening works.
* [ ] Edge side-panel opening works.
* [ ] Writing editor is stable.
* [ ] Formatting toolbar works.
* [ ] Markdown import works for supported syntax.
* [ ] Smart paste is sanitized.
* [ ] Plain-text output is deterministic.
* [ ] Unicode mode warnings work.
* [ ] Character counting works.
* [ ] Clipboard copy works.
* [ ] Draft creation works.
* [ ] Autosave works.
* [ ] Draft restoration works.
* [ ] Revision conflicts are handled.
* [ ] Preview uses serialized output.
* [ ] Light and dark themes work.
* [ ] Keyboard navigation works.
* [ ] Storage errors are visible.
* [ ] No LinkedIn permissions or content scripts exist.
* [ ] No unresolved critical defects remain.
* [ ] Privacy policy is written.
* [ ] Extension icons are packaged.
* [ ] Chrome Web Store assets are prepared.
* [ ] Edge Add-ons assets are prepared.
* [ ] Production builds pass validation.
* [ ] Manual LinkedIn paste compatibility has been tested.

---

## 19. Risks and Mitigations

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Draft loss | Critical | Transactional persistence and recovery testing |
| Clipboard incompatibility | High | Early browser spike and fallback |
| LinkedIn rendering changes | High | Plain-text defaults and manual compatibility tests |
| Markdown adapter defects | High | Isolated adapter and conversion tests |
| Browser differences | Medium | Chrome/Edge test matrix |
| Accessibility problems | High | Keyboard, screen-reader, and contrast testing |
| Unicode output inconsistencies | Medium | Opt-in mode, warnings, graceful fallback |
| Extension storage deletion | High | User documentation, future backup feature |
| Competition | High | Reliability and simplicity as primary value |
| LinkedIn policy exposure | Medium | No page access, scraping, or automation |
| Unexpected storage corruption | High | Data validation and safe migration |
| Scope expansion | Medium | Fixed v0.1 exclusion list |

---

## 20. Post-MVP Roadmap

v0.2: Productivity and Recovery

* Revision history.
* Draft duplication.
* Draft search.
* Markdown export.
* JSON backup and import.
* Reusable snippets.
* Post templates.
* Improved preview.
* Full-tab editing mode.

v0.3: Advanced Writing

* Advanced formatting profiles.
* Readability checks.
* Multilingual writing assistance.
* Better formatting compatibility.
* Template customization.
* Draft organization.

v1.0: Commercial Validation

Potential features, subject to user validation:

* Optional Pro license.
* Advanced templates.
* Cross-device synchronization.
* Optional AI proofreading.
* Additional social media formats.

Do not introduce these features until repeat usage of the core editor has been demonstrated.

---

## 21. Decisions and Assumptions

**Confirmed Product Decisions**

| Decision | Value |
| --- | --- |
| Name | PostNook |
| Headline | Post Editor for LinkedIn |
| Tagline | Your little corner for better posts |
| Platforms | Chrome and Edge |
| Primary UI | Native browser side panel |
| Frontend | React + TypeScript |
| Editor | Tiptap |
| Storage | IndexedDB |
| Backend | None |
| Authentication | None |
| Default output | Plain text |
| Optional output | Unicode styling |
| Publishing | Manual copy and paste |
| Initial price | Free |

**Implementation Assumptions**

* The first release is desktop-browser-only.
* English is the initial interface language.
* The browser provides the required side-panel and Clipboard APIs.
* The first release does not support media attachments.
* PostNook stores the user’s original structured document.
* LinkedIn’s character limit is treated as 3,000 until official documentation changes.
* Rich HTML clipboard output requires separate validation before inclusion.
* Local draft data is not automatically synchronized across devices.

These assumptions can be revisited after v0.1 user testing without changing the core architecture.

---

## 22. Required Engineering Deliverables

The implementing team must produce:

1. Working Chrome/Edge extension source code.
2. Versioned Manifest V3 configuration.
3. Tiptap editor implementation.
4. Draft repository and migration logic.
5. Markdown adapter.
6. Smart paste sanitizer.
7. Deterministic PostSerializer.
8. Character counter.
9. Clipboard service.
10. Autosave service.
11. Side-panel preview.
12. Theme and settings implementation.
13. Unit and integration tests.
14. Browser test instructions.
15. GitHub Actions CI pipeline.
16. Production extension packages.
17. README with setup instructions.
18. Architecture documentation.
19. Privacy policy.
20. Store submission documentation.

---

## 23. Technical References

**Browser APIs**

* Chrome Side Panel API
* Microsoft Edge Sidebar Extensions
* Chrome Manifest V3
* Chrome Extension Storage
* Chrome Extension Storage and Cookies
* Clipboard API

**Development Stack**

* React
* TypeScript
* Vite
* Tiptap
* Tiptap Markdown
* Tailwind CSS
* Dexie
* Vitest
* Playwright

**Platform and Compliance**

* LinkedIn Prohibited Software and Extensions
* LinkedIn User Agreement
* LinkedIn Post Creation and Sharing

---

Document: PostNook Product Requirements Document
Version: 1.0
Target Application Release: 0.1.0
Status: Ready for implementation
Next Action: Create the repository, complete Sprint 0, and implement stories according to the defined priorities and acceptance criteria.
