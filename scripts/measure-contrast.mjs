import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4173/sidepanel.html');
  await page.getByRole('button', { name: 'Create first post' }).click();
  await page.getByRole('textbox', { name: 'Post content' }).fill('A thought worth sharing.');
  const rows = [];
  function luminance(hex) {
    const rgb = hex
      .match(/[a-f\d]{2}/gi)
      .map((s) => parseInt(s, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: theme, exact: true }).click();
    await page.keyboard.press('Escape');
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(
        [
          'paper',
          'canvas',
          'ink',
          'muted',
          'accent',
          'on-accent',
          'accent-hover',
          'accent-soft',
          'danger',
          'danger-soft',
          'success',
          'focus',
          'control-border',
        ].map((name) => [name, style.getPropertyValue('--' + name).trim()]),
      );
    });
    for (const [role, fg, bg, minimum] of [
      ['Editor text', 'ink', 'paper', 4.5],
      ['Secondary text on paper', 'muted', 'paper', 4.5],
      ['Secondary text on canvas', 'muted', 'canvas', 4.5],
      ['Primary button', 'on-accent', 'accent', 4.5],
      ['Primary hover', 'on-accent', 'accent-hover', 4.5],
      ['Active control', 'accent', 'accent-soft', 4.5],
      ['Error message', 'danger', 'danger-soft', 4.5],
      ['Saved status', 'success', 'paper', 4.5],
      ['Focus ring against paper', 'focus', 'paper', 3],
      ['Control boundary', 'control-border', 'paper', 3],
    ]) {
      const a = luminance(tokens[fg]),
        b = luminance(tokens[bg]);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      rows.push(
        `| ${theme} | ${role} | ${tokens[fg]} / ${tokens[bg]} | ${ratio.toFixed(2)}:1 | ${minimum}:1 | ${ratio >= minimum ? 'Pass' : 'FAIL'} |`,
      );
      if (ratio < minimum) throw new Error(`${theme} ${role} contrast failed: ${ratio}`);
    }
  }
  await writeFile(
    'docs/design/contrast.md',
    '# Contrast measurements\n\nMeasured from computed theme tokens in running Chrome on 2026-10-27, using WCAG sRGB relative luminance. These opaque pairs are used by the rendered controls; disabled controls and decorative seams are excluded. Automated axe checks separately inspect rendered editor screens at each documented width. This is not a complete accessibility certification.\n\nRun `node scripts/measure-contrast.mjs` with the development server on port 4173.\n\n| Theme | Role | Foreground / background | Measured | Minimum | Result |\n| --- | --- | --- | --- | --- | --- |\n' +
      rows.join('\n') +
      '\n',
  );
  console.log('All 20 theme contrast pairs passed.');
} finally {
  await browser.close();
}
