import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, pkg.version);
assert.deepEqual([...manifest.permissions].sort(), ['sidePanel', 'storage']);
for (const forbidden of [
  'host_permissions',
  'optional_host_permissions',
  'content_scripts',
  'externally_connectable',
])
  assert.equal(manifest[forbidden], undefined, forbidden);
assert.equal(manifest.action.default_popup, undefined);
assert.equal(manifest.minimum_chrome_version, '116');
assert.match(manifest.content_security_policy.extension_pages, /script-src 'self';/);
assert.match(manifest.content_security_policy.extension_pages, /connect-src 'none'/);
for (const path of [
  manifest.side_panel.default_path,
  manifest.background.service_worker,
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
])
  await access(`dist/${path}`);
const html = await readFile(`dist/${manifest.side_panel.default_path}`, 'utf8');
assert.doesNotMatch(html, /<script[^>]*src=["']https?:|<script[^>]*>\s*[^<\s]/i);
console.log('Manifest, version, CSP, permission allowlist, and packaged assets verified.');
