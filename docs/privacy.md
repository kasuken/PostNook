# Privacy and local data

PostNook's foundation build stores drafts on your device in the extension's IndexedDB. Appearance, output mode, preview choice, and active draft selection use local extension storage.

The extension has no account, backend, analytics SDK, advertising trackers, cloud synchronization, or remote fonts. It does not read websites, LinkedIn credentials, cookies, or page content. It neither pastes into LinkedIn nor publishes for you.

Copy Post writes generated text to the system clipboard when you choose the action. Paste reads only clipboard data supplied by your paste event. Imported HTML is sanitized before conversion. Other applications and the operating system may have their own clipboard behavior.

Local storage is not a backup and PostNook does not claim to encrypt drafts. Uninstalling the extension, clearing browser storage, or losing the browser profile can remove your work. Keep an external copy of important posts. Full backup/import remains outside v0.1.

Saved on this device means the latest storage transaction completed. If saving fails, keep the editor open, copy the text somewhere safe, and retry. Unsaved edits can be lost in a crash. If another window saved a newer version, keep a separate recovered copy or explicitly reload it.

This document describes this implementation. It does not claim marketplace approval or completion of the release privacy review.
