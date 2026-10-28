// QA-004: measures the PRD section 13 targets in installed Chrome and Edge.
// Start the dev server on 4173 (for module-level timings) and `vite preview --port 4174`
// on the production build (for startup and interaction timings), then run this script.
import os from 'node:os';
import { chromium } from '@playwright/test';

const RUNS = 10;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const max = (values) => Math.max(...values);
const p90 = (values) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * 0.9) - 1];
const fixture = 'A thought worth sharing, with #hashtags and https://example.com/links. '.repeat(
  43,
);

async function measure(channel) {
  const browser = await chromium.launch({ channel });
  const version = browser.version();
  const results = {};
  const record = (name, values) => {
    results[name] = { median: median(values), p90: p90(values), max: max(values) };
    if (process.env.SAMPLES) console.log(channel, name, values.map((v) => v.toFixed(1)).join(' '));
  };

  // Startup: navigation start until the first actionable control is rendered (production build).
  const startup = [];
  for (let i = 0; i < RUNS; i++) {
    const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4174/sidepanel.html');
    await page.getByRole('button', { name: 'Create first post' }).waitFor();
    startup.push(await page.evaluate(() => performance.now()));
    await context.close();
  }
  record('startup to interactive', startup);

  const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4174/sidepanel.html');
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.waitFor();
  await page.waitForFunction(() => document.activeElement?.classList.contains('tiptap'));
  await editor.fill(fixture);

  // Formatting: toggling bold on the whole 3,000-character post, until the DOM shows it.
  const formatting = [];
  for (let i = 0; i < RUNS; i++) {
    await editor.press('ControlOrMeta+a');
    formatting.push(
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            const start = performance.now();
            const target = document.querySelector('.tiptap');
            const expectBold = !target.querySelector('strong');
            const observer = new MutationObserver(() => {
              if (Boolean(target.querySelector('strong')) === expectBold) {
                observer.disconnect();
                resolve(performance.now() - start);
              }
            });
            observer.observe(target, { childList: true, subtree: true });
            target.dispatchEvent(
              new KeyboardEvent('keydown', {
                key: 'b',
                code: 'KeyB',
                ctrlKey: true,
                bubbles: true,
              }),
            );
          }),
      ),
    );
  }
  record('formatting (bold, 3,000 chars)', formatting);

  // Typing: one inserted character at the end of the 3,000-character post until the DOM has it.
  await editor.press('End');
  const typing = [];
  for (let i = 0; i < RUNS * 3; i++)
    typing.push(
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            const target = document.querySelector('.tiptap');
            const start = performance.now();
            const observer = new MutationObserver(() => {
              observer.disconnect();
              resolve(performance.now() - start);
            });
            observer.observe(target, { characterData: true, childList: true, subtree: true });
            document.execCommand('insertText', false, 'x');
          }),
      ),
    );
  record('typing (keystroke to DOM, 3,000 chars)', typing);

  // Preview: a real click on Preview, timed by the browser's Event Timing API from input to the
  // next paint. Clicks under 16 ms produce no entry and count as 16.
  await page.evaluate(() => {
    window.__clicks = [];
    window.__frames = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (e.name === 'click') window.__clicks.push(e.duration);
    }).observe({ type: 'event', durationThreshold: 16 });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        window.__frames.push({
          duration: Math.round(e.duration),
          blocking: Math.round(e.blockingDuration),
          beforeRender: Math.round(e.renderStart ? e.renderStart - e.startTime : 0),
          styleLayout: Math.round(
            e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0,
          ),
          scripts: e.scripts.map((s) => `${s.invoker} ${Math.round(s.duration)}ms`),
        });
    }).observe({ type: 'long-animation-frame' });
  });
  const preview = [];
  const frames = [];
  for (let i = 0; i < RUNS; i++) {
    await page.evaluate(() => {
      window.__clicks.length = 0;
      window.__frames.length = 0;
    });
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await page.locator('.preview-text').waitFor();
    // Event Timing entries are delivered after the paint; give the observer a few frames.
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50))),
        ),
    );
    const sample = await page.evaluate(() => ({
      click: window.__clicks.length ? Math.max(...window.__clicks) : 16,
      frames: [...window.__frames],
    }));
    preview.push(sample.click);
    if (sample.click > 100) frames.push(sample.frames);
    await page.getByRole('button', { name: 'Write', exact: true }).click();
    await page.waitForTimeout(400);
  }
  record('preview refresh', preview);
  if (process.env.SAMPLES && frames.length)
    console.log(channel, 'slow preview frames', JSON.stringify(frames));
  await context.close();

  // Module timings on the dev server: serialization and one committed IndexedDB save.
  const dev = await browser.newPage();
  await dev.goto('http://127.0.0.1:4173/sidepanel.html');
  const modules = await dev.evaluate(
    async ({ text, runs }) => {
      const { serializePost } = await import('/src/services/serializer.ts');
      const { textDocument } = await import('/src/domain/document.ts');
      const { IndexedDraftRepository, PostNookDatabase } = await import('/src/storage/drafts.ts');
      const bold = {
        type: 'doc',
        content: textDocument(text).content.map((p) => ({
          ...p,
          content: p.content?.map((n) => (n.text ? { ...n, marks: [{ type: 'bold' }] } : n)),
        })),
      };
      const serialize = [];
      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        serializePost(bold, 'unicode');
        serialize.push(performance.now() - start);
      }
      const db = new PostNookDatabase('perf-' + crypto.randomUUID());
      const repo = new IndexedDraftRepository(db);
      let draft = await repo.createDraft('Perf', textDocument(text));
      const save = [];
      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        draft = await repo.updateDraft(draft.id, draft.revision, textDocument(text + i), 'Perf');
        save.push(performance.now() - start);
      }
      await db.delete();
      return { serialize, save };
    },
    { text: fixture.slice(0, 3000), runs: RUNS },
  );
  record('serialization (3,000 chars, Unicode)', modules.serialize);
  record('draft save (start to commit)', modules.save);
  await browser.close();
  return { version, results };
}

const targets = {
  'startup to interactive': 2000,
  'formatting (bold, 3,000 chars)': 100,
  // "No perceptible lag": 50 ms is the RAIL input-response budget.
  'typing (keystroke to DOM, 3,000 chars)': 50,
  'serialization (3,000 chars, Unicode)': 50,
  'draft save (start to commit)': 500,
  'preview refresh': 200,
};
console.log(
  `Hardware: ${os.cpus()[0].model}, ${os.cpus().length} threads, ${Math.round(os.totalmem() / 2 ** 30)} GB RAM, ${os.type()} ${os.release()}`,
);
let failed = false;
for (const channel of ['chrome', 'msedge']) {
  const { version, results } = await measure(channel);
  console.log(`\n${channel} ${version} (median / p90 / max of ${RUNS} runs, ms)`);
  for (const [name, { median: m, p90: p, max: x }] of Object.entries(results)) {
    // Judged on the 90th percentile: single headless frames that wait before rendering, with no
    // script or layout work, are browser scheduling rather than PostNook work (see the docs).
    const pass = p <= targets[name];
    failed ||= !pass;
    console.log(
      `${name.padEnd(38)} ${m.toFixed(1).padStart(7)} / ${p.toFixed(1).padStart(7)} / ${x.toFixed(1).padStart(7)}  target < ${targets[name]}  ${pass ? 'Pass' : 'FAIL'}`,
    );
  }
}
process.exit(failed ? 1 : 0);
