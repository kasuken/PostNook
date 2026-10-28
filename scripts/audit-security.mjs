// QA-003: static audit of the production build and the source it came from. Run after `vite build`.
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

async function files(dir, pattern) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path, pattern)));
    else if (pattern.test(entry.name)) out.push(path);
  }
  return out;
}
const failures = [];
const check = (ok, message) => ok || failures.push(message);

// Bundled code: no remote code, dynamic evaluation, network, page access or clipboard reads.
const bundle = await files('dist', /\.(js|html)$/);
const forbidden = [
  [/\beval\s*\(/, 'eval'],
  [/\bnew Function\b/, 'new Function'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bsendBeacon\b/, 'navigator.sendBeacon'],
  [/\bEventSource\b/, 'EventSource'],
  [/\bimportScripts\b/, 'importScripts'],
  [/clipboard\.read(Text)?\b/, 'automatic clipboard reading'],
  [/chrome\.(scripting|tabs|webRequest|cookies|history|debugger)\b/, 'page or browsing access'],
  [/\bexecuteScript\b/, 'script injection'],
  [/\bdocument\.write\b/, 'document.write'],
  [/linkedin\.com/i, 'LinkedIn host'],
];
// URLs that only appear as XML namespaces or in library error messages, never requested.
const allowedUrls = [
  /^http:\/\/www\.w3\.org\//,
  /^https:\/\/react\.dev\/errors\//,
  /^https:\/\/prosemirror\.net\/docs\//,
  /^https:\/\/github\.com\/markedjs\/marked/,
  /^https:\/\/tinyurl\.com\/y2uuvskb/, // Dexie error help link
  /^http:\/\/bit\.ly\/2kdckMn/, // Dexie error help link
];
for (const path of bundle) {
  const code = await readFile(path, 'utf8');
  for (const [pattern, name] of forbidden) check(!pattern.test(code), `${path}: ${name}`);
  // Vite's modulepreload polyfill is the only fetch, and it only loads the extension's own files.
  const fetches = code.match(/\bfetch\(/g)?.length ?? 0;
  check(
    fetches === 0 || (fetches === 1 && /fetch\(e\.href,n\)/.test(code)),
    `${path}: unexpected fetch`,
  );
  for (const url of code.match(/https?:\/\/[^\s"'`)\\]+/g) ?? [])
    check(
      allowedUrls.some((allowed) => allowed.test(url)),
      `${path}: unexpected URL ${url}`,
    );
  if (path.endsWith('.html'))
    check(
      !/<script(?![^>]*\bsrc=["']\.\/)[^>]*>/i.test(code) && !/\son[a-z]+=/i.test(code),
      `${path}: inline script or handler`,
    );
}

// Source: no HTML injection or network calls of our own.
for (const path of await files('src', /\.(ts|tsx)$/)) {
  const code = await readFile(path, 'utf8');
  check(!/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(code), `${path}: HTML injection`);
  check(!/\bfetch\(|https?:\/\//.test(code), `${path}: network call or remote URL`);
}

// Dependencies: no analytics, error-reporting or remote-config SDKs.
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const telemetry =
  /analytics|sentry|segment|mixpanel|amplitude|posthog|datadog|bugsnag|logrocket|firebase|gtag/i;
for (const name of Object.keys(pkg.dependencies))
  check(!telemetry.test(name), `dependency ${name} looks like telemetry`);

// Manifest: nothing beyond the two permissions, no remote code allowance.
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
const csp = manifest.content_security_policy.extension_pages;
check(!/unsafe-eval|wasm-unsafe-eval|https?:/.test(csp), 'CSP allows eval or remote sources');
assert.deepEqual([...manifest.permissions].sort(), ['sidePanel', 'storage']);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Security audit passed: ${bundle.length} bundle files, no remote code, network, page access, clipboard reads or telemetry.`,
);
