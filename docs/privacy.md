# Privacy policy

Effective for PostNook v0.1.0. Last updated 2026-10-28.

PostNook is a free browser extension for writing posts in the Chrome and Edge side panel. This policy describes what the extension does with your information. It reflects how this version is actually built and is checked by an automated audit of every build (`scripts/audit-security.mjs`).

## What PostNook stores

- **Drafts**: titles, content and timestamps, stored in the extension's IndexedDB on your device.
- **Preferences**: theme, output mode, preview choice, the active draft and whether you have seen the Unicode warning, stored in the extension's local storage on your device.

Nothing else is stored, and nothing is stored anywhere but your browser profile.

## What PostNook does not do

- It has no account, server or backend, and sends no data anywhere. Its content security policy blocks network connections (`connect-src 'none'`).
- It contains no analytics, telemetry, advertising or error-reporting code.
- It does not read the websites you visit. It has no host permissions or content scripts and requests only `sidePanel` and `storage`.
- It never accesses LinkedIn, your LinkedIn credentials or cookies, and never pastes or publishes for you. You copy the text and publish it yourself.
- It never reads your clipboard on its own. **Copy Post** writes to the clipboard only when you choose it. Paste uses only the data from a paste you make; pasted HTML is sanitized and never run.

## Your control and data loss

Your drafts stay until you delete them. Deleting a draft removes it after you confirm.

Local storage is not a backup, and PostNook does not encrypt drafts beyond whatever protection your browser and operating system provide. **Uninstalling PostNook, clearing browser or extension storage, or losing the browser profile permanently deletes your drafts.** Keep a separate copy of important posts. Backup and export are not available in v0.1.

"Saved on this device" means the last storage transaction completed. Edits made in the last moments before a crash may not be saved.

Other applications and the operating system may handle clipboard contents under their own policies.

## Changes and contact

Changes to this policy are published with the extension and in this repository. Questions: [GitHub issues](https://github.com/kasuken/PostNook/issues).
