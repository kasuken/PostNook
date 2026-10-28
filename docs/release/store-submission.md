# Store submission (v0.1.0)

Status: **not submitted**. Submission is a manual step for the owner. It needs the owner's Chrome Web Store and Microsoft Partner Center developer accounts, and nothing here is automated. The packages come from the release workflow (draft GitHub release) or from `npm run package`.

## Packages

| Store            | File                        | Notes                                           |
| ---------------- | --------------------------- | ----------------------------------------------- |
| Chrome Web Store | `postnook-0.1.0-chrome.zip` | Built from `dist/`, `manifest.json` at the root |
| Edge Add-ons     | `postnook-0.1.0-edge.zip`   | Same build; Edge accepts the Chrome MV3 package |
| Checksums        | `SHA256SUMS.txt`            | Compare before uploading                        |

Before uploading, unzip one package and confirm that `manifest.json` is at the root, the version is 0.1.0, the permissions are only `sidePanel` and `storage`, and the four icons are present. `npm run build` checks all of this, and its security audit must pass.

## Listing text

**Name:** PostNook

**Short description (up to 132 characters):** A private side-panel editor for writing, formatting and saving social posts. Copy the text and publish it yourself.

**Category:** Productivity (Chrome: Workflow & Planning; Edge: Productivity)

**Language:** English

**Description:**

> PostNook is a quiet writing space in your browser's side panel. Draft your next post while you browse, shape it with bold, italic and lists, and copy clean text when it's ready.
>
> - Write in the side panel next to any page. PostNook never reads the page.
> - Format with bold, italic, bullet and numbered lists, with full undo.
> - Paste from Word, Google Docs or a chat assistant and keep the formatting that matters. Scripts and styles are removed.
> - Import Markdown.
> - Keep several drafts. They save automatically on your device.
> - Preview the exact text you'll copy as a desktop or mobile card.
> - An estimated character counter warns you near a 3,000-character limit.
> - Optional Unicode bold and italic, with a clear accessibility warning.
> - Light, dark or system theme.
>
> Private by design: no account, no server, no tracking. Drafts never leave your device. PostNook does not post for you or connect to any social network; you paste and publish yourself.
>
> Good to know: previews and counts are estimates, and the site you paste into may render the text differently. Uninstalling the extension or clearing its storage deletes your drafts, so keep copies of important posts.

The listing title, icon and images use no social network's logo, colours or branding. The name LinkedIn appears in one place, the in-app disclaimer in `screenshot-2-preview.png` ("LinkedIn may render the pasted post differently"). The manifest `description` says "LinkedIn posts" while this listing text avoids the name, so decide on one approach and make both match before submitting. PostNook is an independent tool, not affiliated with or endorsed by LinkedIn. If the owner chooses to mention LinkedIn in the description, use it only to describe compatibility ("for posts you publish on LinkedIn"), add that disclaimer, and make no claim of exact rendering.

## Images (`docs/release/store/`, regenerate with `node scripts/store-assets.mjs`)

| Asset                        | Size     | Chrome             | Edge                   |
| ---------------------------- | -------- | ------------------ | ---------------------- |
| `public/icons/icon-128.png`  | 128×128  | Store icon         | n/a                    |
| `edge-logo-300x300.png`      | 300×300  | n/a                | Extension logo         |
| `screenshot-1-write.png`     | 1280×800 | Screenshot         | Screenshot             |
| `screenshot-2-preview.png`   | 1280×800 | Screenshot         | Screenshot             |
| `screenshot-3-dark.png`      | 1280×800 | Screenshot         | Screenshot             |
| `promo-small-440x280.png`    | 440×280  | Small promo tile   | Small promotional tile |
| `promo-marquee-1400x560.png` | 1400×560 | Marquee (optional) | Large promotional tile |

The screenshots show the real app with sample text. They contain no third-party logos or branding.

## Privacy disclosures

**Single purpose:** Write, format and save post drafts locally, and copy them as plain or Unicode-styled text.

**Permission justifications:**

- `sidePanel`: opens the editor in the browser side panel when the toolbar icon is selected.
- `storage`: saves the user's preferences (theme, output mode, preview choice, active draft) on the device. Drafts are stored in the extension's own IndexedDB.

**Host permissions:** none. **Remote code:** none; all code is packaged and CSP sets `script-src 'self'` and `connect-src 'none'`.

**Data usage (Chrome "Privacy practices" / Edge "Privacy"):** PostNook collects no user data. None of the data categories apply: personally identifiable information, health, financial, authentication, personal communications, location, web history, user activity or website content. Draft text is stored only on the device and is never transmitted. Certify: not sold to third parties, not used for unrelated purposes, not used for creditworthiness.

**Privacy policy URL:** the published [privacy policy](../privacy.md), for example `https://github.com/kasuken/PostNook/blob/main/docs/privacy.md`, or a GitHub Pages copy.

## Steps

1. Push a tag `v0.1.0` that matches `package.json`. Wait for the Release workflow, then check the draft release's ZIPs against `SHA256SUMS.txt`.
2. **Chrome Web Store** ([Developer Dashboard](https://chrome.google.com/webstore/devconsole)): add a new item, upload `postnook-0.1.0-chrome.zip`, fill Store listing, Privacy practices and Distribution from this page, and submit for review. Optionally choose deferred publishing.
3. **Edge Add-ons** ([Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)): create a new extension, upload `postnook-0.1.0-edge.zip`, fill Properties, Store listings and Privacy from this page, and submit.
4. Publish the draft GitHub release once both stores accept the package, or earlier if the owner prefers.
5. Record submission dates, review outcomes and store URLs in [REL-003](https://github.com/kasuken/PostNook/issues/38) and the [release gates](v0.1.0-gates.md).

Store policies change. Check the current Chrome Web Store and Edge Add-ons requirements at submission time; the sizes above were current when this was written.
