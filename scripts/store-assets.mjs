// REL-003: renders Chrome Web Store and Edge Add-ons images from the running app.
// Start the dev server on port 4173 first. Output: docs/release/store/.
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const out = 'docs/release/store';
await mkdir(out, { recursive: true });
const mark = (size) => `
  <svg width="${size}" height="${size * 1.1}" viewBox="0 0 40 44" aria-hidden="true">
    <path d="M5 2h22l8 8v31l-15-7-15 7z" fill="#6246c6" />
    <path d="M27 2v9h8" fill="white" opacity=".35" />
    <path d="M13 26V14l14 12V14" stroke="white" stroke-width="3" fill="none" stroke-linejoin="round" />
  </svg>`;
const font = `font-family: 'Segoe UI', system-ui, sans-serif;`;
const sample =
  'The best ideas rarely arrive fully formed.\n\nThey start as a sentence in a notebook. A question after a conversation. Something you can’t quite let go of.\n\nGive that thought a little space:\n\n';
const shots = [
  {
    name: 'screenshot-1-write',
    title: 'Write in the side panel',
    text: 'Format with bold, italic and lists while you browse. Drafts save on your device.',
    theme: 'Light',
    view: 'write',
  },
  {
    name: 'screenshot-2-preview',
    title: 'See exactly what you’ll copy',
    text: 'Preview the plain text as a desktop or mobile card, then copy it and publish it yourself.',
    theme: 'Light',
    view: 'preview',
  },
  {
    name: 'screenshot-3-dark',
    title: 'Light, dark or system',
    text: 'No account, no tracking, no access to the sites you visit.',
    theme: 'Dark',
    view: 'write',
  },
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const shot of shots) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const dark = shot.theme === 'Dark';
  // Served from the app's origin so the framed panel keeps ordinary, unpartitioned storage.
  const wrapper = `<!doctype html><html><body style="margin:0;${font}
      background:${dark ? '#181621' : '#f4f3f8'};color:${dark ? '#f2eff9' : '#242139'};
      display:flex;align-items:center;justify-content:center;gap:72px;height:800px">
    <div style="max-width:440px">
      ${mark(56)}
      <h1 style="font-size:44px;line-height:1.15;margin:24px 0 16px">${shot.title}</h1>
      <p style="font-size:22px;line-height:1.5;margin:0;color:${dark ? '#b6b0c7' : '#686477'}">${shot.text}</p>
    </div>
    <iframe src="http://127.0.0.1:4173/sidepanel.html" title="PostNook"
      style="width:400px;height:720px;border:1px solid ${dark ? '#3a3550' : '#ddd9e8'};border-radius:14px;
      background:white;box-shadow:0 20px 50px rgba(30,20,60,.18)"></iframe>
  </body></html>`;
  await page.route('http://127.0.0.1:4173/__store.html', (route) =>
    route.fulfill({ contentType: 'text/html; charset=utf-8', body: wrapper }),
  );
  await page.goto('http://127.0.0.1:4173/__store.html');
  const app = page.frameLocator('iframe');
  await app.getByRole('button', { name: 'Create first post' }).click();
  const editor = app.getByRole('textbox', { name: 'Post content' });
  await editor.waitFor();
  await page.waitForTimeout(300);
  await app.getByRole('textbox', { name: 'Draft title' }).fill('A small observation');
  await app.getByRole('button', { name: 'Paste as Markdown', exact: true }).click();
  await app
    .getByLabel('Markdown text')
    .fill(
      sample.replace(/\n\n$/, '') +
        '\n\n- **Write** it down\n- **Shape** it\n- *Share* it\n\nWhat have you been thinking about lately?',
    );
  await app.getByRole('button', { name: 'Insert text', exact: true }).click();
  await app.getByText('Saved on this device').waitFor();
  if (dark) {
    await app.getByRole('button', { name: 'Settings', exact: true }).click();
    await app.getByRole('button', { name: 'Dark', exact: true }).click();
    await app.getByRole('button', { name: 'Close dialog', exact: true }).click();
  }
  if (shot.view === 'preview')
    await app.getByRole('button', { name: 'Preview', exact: true }).click();
  await app.locator('body').evaluate(() => document.activeElement?.blur());
  await page.mouse.move(1, 1);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${shot.name}.png` });
  await context.close();
}

const tiles = [
  { name: 'promo-small-440x280', width: 440, height: 280, markSize: 54, title: 34, tag: 16 },
  { name: 'promo-marquee-1400x560', width: 1400, height: 560, markSize: 110, title: 76, tag: 30 },
];
for (const tile of tiles) {
  const page = await browser.newPage({ viewport: { width: tile.width, height: tile.height } });
  await page.setContent(`<body style="margin:0;${font};width:${tile.width}px;height:${tile.height}px;
      display:flex;align-items:center;justify-content:center;gap:${tile.markSize / 2}px;
      background:linear-gradient(135deg,#f4f3f8,#eeebfc);color:#242139">
    ${mark(tile.markSize)}
    <div><div style="font-size:${tile.title}px;font-weight:700">PostNook</div>
    <div style="font-size:${tile.tag}px;color:#686477;margin-top:6px">Your little corner for better posts.</div></div>
  </body>`);
  await page.screenshot({ path: `${out}/${tile.name}.png` });
  await page.close();
}
const logo = await browser.newPage({ viewport: { width: 300, height: 300 } });
await logo.setContent(
  `<body style="margin:0;width:300px;height:300px;display:grid;place-items:center;background:transparent">${mark(240)}</body>`,
);
await logo.screenshot({ path: `${out}/edge-logo-300x300.png`, omitBackground: true });
await browser.close();
console.log(`Store images written to ${out}/.`);
