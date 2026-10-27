import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/sidepanel.html');
});

test('create, format, autosave, preview, copy, and restore the original draft', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Create first post' }).click();
  await page.getByRole('textbox', { name: 'Draft title' }).fill('A small observation');
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('Good writing starts with paying attention.');
  await editor.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'Bold (Ctrl+B)', exact: true }).click();
  await expect(editor.locator('strong')).toHaveText('Good writing starts with paying attention.');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.preview-text')).toHaveText(
    'Good writing starts with paying attention.',
  );
  await page.getByRole('button', { name: 'Copy Post', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copied!', exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'Good writing starts with paying attention.',
  );
  await page.reload();
  await expect(editor).toHaveText('Good writing starts with paying attention.');
  await expect(page.getByRole('textbox', { name: 'Draft title' })).toHaveValue(
    'A small observation',
  );
});

test('Markdown import is undoable, normal paste is literal, and HTML is sanitized', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  await page.getByRole('button', { name: 'Paste as Markdown', exact: true }).click();
  await page.getByLabel('Markdown text').fill('**Hello**\n\n- A thought\n- Another thought');
  await page.getByRole('button', { name: 'Insert text', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await expect(editor.locator('strong')).toHaveText('Hello');
  await page.getByRole('button', { name: 'Undo (Ctrl+Z)', exact: true }).click();
  await expect(editor).toHaveText('');
  await page.getByRole('button', { name: 'Redo (Ctrl+Shift+Z)', exact: true }).click();
  await expect(editor.locator('strong')).toHaveText('Hello');
  await page.getByRole('button', { name: 'Undo (Ctrl+Z)', exact: true }).click();
  await expect(editor).toHaveText('');
  await editor.evaluate((el) => {
    const data = new DataTransfer();
    data.setData('text/plain', '**literal**');
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  });
  await expect(editor).toContainText('**literal**');
  await editor.press('ControlOrMeta+End');
  await editor.evaluate((el) => {
    const data = new DataTransfer();
    data.setData(
      'text/html',
      '<p><b>Safe</b><img src=x onerror="window.pasteExecuted=true"></p><script>window.pasteExecuted=true</script>',
    );
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  });
  await expect(editor.locator('strong')).toHaveText('Safe');
  expect(await page.evaluate(() => 'pasteExecuted' in window)).toBe(false);
});

test('clipboard rejection offers manual copy without losing the draft', async ({ page }) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  await page.getByRole('textbox', { name: 'Post content' }).fill('Keep these words.');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
    });
  });
  await page.getByRole('button', { name: 'Copy Post', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Copy your post manually');
  await expect(page.getByLabel('Post text', { exact: true })).toHaveValue('Keep these words.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'Post content' })).toHaveText('Keep these words.');
});

test('marked hard breaks persist and Unicode output leaves original text editable', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('Hello');
  await editor.press('ControlOrMeta+a');
  await editor.press('ControlOrMeta+b');
  await editor.press('ArrowRight');
  await editor.press('Shift+Enter');
  await editor.pressSequentially('World');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await page.getByLabel('Output mode').selectOption('unicode');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('A note about Unicode styling');
  await page.getByRole('button', { name: 'Use Unicode styling', exact: true }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.preview-text')).toContainText('𝐇𝐞𝐥𝐥𝐨');
  await page.getByLabel('Output mode').selectOption('plain');
  await expect(page.locator('.preview-text')).toHaveText('Hello\nWorld');
  await page.reload();
  await expect(editor.locator('br')).toHaveCount(1);
  await expect(editor).toContainText('World');
  await expect(editor.locator('strong').first()).toContainText('Hello');
});

test('failed writes preserve unsaved text and prevent a draft switch until retry', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('Original');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    Object.assign(window, {
      restorePut: () => {
        IDBObjectStore.prototype.put = put;
      },
    });
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await editor.fill('Keep my unsaved words');
  await expect(page.getByRole('alert')).toContainText('storage is full');
  await page.getByRole('button', { name: 'New draft', exact: true }).click();
  await expect(editor).toHaveText('Keep my unsaved words');
  await expect(page.getByRole('status').filter({ hasText: 'Save failed' })).toBeVisible();
  await page.evaluate(() => (window as unknown as { restorePut: () => void }).restorePut());
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await page.reload();
  await expect(editor).toHaveText('Keep my unsaved words');
});

test('missing active draft offers an explicit recovery without blank replacement', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  await page.getByRole('textbox', { name: 'Post content' }).fill('Remaining draft');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem('postnook-settings')!);
    settings.activeDraftId = crypto.randomUUID();
    localStorage.setItem('postnook-settings', JSON.stringify(settings));
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('no longer available');
  await expect(page.getByRole('textbox', { name: 'Post content' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open remaining drafts' }).click();
  await expect(page.getByRole('textbox', { name: 'Post content' })).toHaveText('Remaining draft');
});

test('concurrent windows cannot silently overwrite a newer draft', async ({ page, context }) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  await page.getByRole('textbox', { name: 'Post content' }).fill('Base version');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  const other = await context.newPage();
  await other.goto('/sidepanel.html');
  await expect(other.getByRole('textbox', { name: 'Post content' })).toHaveText('Base version');
  await page.getByRole('textbox', { name: 'Post content' }).fill('New stored version');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await other.getByRole('textbox', { name: 'Post content' }).fill('My unsaved variation');
  await expect(other.getByRole('alert')).toContainText('A newer version');
  await expect(other.getByRole('textbox', { name: 'Post content' })).toHaveText(
    'My unsaved variation',
  );
  await other.getByRole('button', { name: 'Keep separate copy', exact: true }).click();
  await expect(other.getByRole('textbox', { name: 'Draft title' })).toHaveValue(/recovered/);
  await page.reload();
  await page.getByRole('button', { name: 'Open drafts', exact: true }).click();
  await expect(page.locator('.draft-row')).toHaveCount(2);
  await other.close();
});

test('draft switching saves edits and deletion requires an explicit confirmation', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const title = page.getByRole('textbox', { name: 'Draft title' });
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await title.fill('First draft');
  await editor.fill('Keep the first post');
  await page.getByRole('button', { name: 'New draft', exact: true }).click();
  await title.fill('Second draft');
  await editor.fill('Keep the second post');
  await page.getByRole('button', { name: 'Open drafts', exact: true }).click();
  await page.locator('.draft-row').filter({ hasText: 'First draft' }).click();
  await expect(editor).toHaveText('Keep the first post');
  await page.getByRole('button', { name: 'Delete current draft' }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Delete this draft?');
  await page.getByRole('button', { name: 'Keep draft', exact: true }).click();
  await expect(editor).toHaveText('Keep the first post');
  await page.getByRole('button', { name: 'Delete current draft' }).click();
  await page.getByRole('button', { name: 'Delete draft', exact: true }).click();
  await expect(title).toHaveValue('Second draft');
  await expect(editor).toHaveText('Keep the second post');
  await page.reload();
  await page.getByRole('button', { name: 'Open drafts', exact: true }).click();
  await expect(page.locator('.draft-row')).toHaveCount(1);
});

for (const width of [320, 400, 600]) {
  test(`stress content remains editable and copy stays visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.getByRole('button', { name: 'Create first post' }).click();
    const editor = page.getByRole('textbox', { name: 'Post content' });
    const sample = 'مرحبا Hello 日本語 👩‍💻 https://example.com/' + 'a'.repeat(180);
    const fixture = sample.padEnd(3000, '文');
    await page.getByRole('textbox', { name: 'Draft title' }).fill('Long title '.repeat(10));
    await editor.fill(fixture);
    await expect(
      page.getByRole('status').filter({ hasText: 'Saved on this device' }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('button', { name: 'Copy Post', exact: true })).toBeInViewport();
    await page.reload();
    await expect(editor).toHaveText(fixture);
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.locator('.preview-text')).toHaveText(fixture);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Write', exact: true }).click();
    await editor.fill(fixture + 'x');
    await page.getByRole('button', { name: 'Copy Post', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveAccessibleName('Your post is over the estimate');
    await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
    await expect(editor).toHaveText(fixture + 'x');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      await page
        .getByRole('button', { name: 'Copy Post', exact: true })
        .evaluate((el) => getComputedStyle(el).transitionDuration),
    ).toBe('0s');
  });
  test(`layout, themes, dialog focus, and accessibility at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 800 });
    await page.getByRole('button', { name: 'Create first post' }).click();
    await page
      .getByRole('textbox', { name: 'Draft title' })
      .fill('A small observation about creative work');
    await page
      .getByRole('textbox', { name: 'Post content' })
      .fill(
        'The best ideas rarely arrive fully formed.\n\nThey start as a sentence in a notebook. A question after a conversation. Something you can’t quite let go of.\n\nGive that thought a little space.\n\nWhat have you been thinking about lately?',
      );
    await expect(
      page.getByRole('status').filter({ hasText: 'Saved on this device' }),
    ).toBeVisible();
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page.getByRole('button', { name: theme, exact: true }).click();
      await page.screenshot({
        path: `docs/design/prototype/${testInfo.project.name}-${width}-${theme.toLowerCase()}-settings.png`,
      });
      for (let step = 0; step < 10; step++) {
        await page.keyboard.press('Tab');
        expect(
          await page.getByRole('dialog').evaluate((el) => el.contains(document.activeElement)),
        ).toBe(true);
      }
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations).toEqual([]);
      await page.locator('.writing-scroll').evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({
        path: `docs/design/prototype/${testInfo.project.name}-${width}-${theme.toLowerCase()}-editor.png`,
      });
      await page.getByRole('button', { name: 'Preview', exact: true }).click();
      await page.screenshot({
        path: `docs/design/prototype/${testInfo.project.name}-${width}-${theme.toLowerCase()}-preview.png`,
      });
      await page.getByRole('button', { name: 'Write', exact: true }).click();
      await page.getByRole('button', { name: 'Open drafts', exact: true }).click();
      await page.screenshot({
        path: `docs/design/prototype/${testInfo.project.name}-${width}-${theme.toLowerCase()}-drafts.png`,
      });
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.screenshot({
      path: `docs/design/prototype/${testInfo.project.name}-${width}-settings.png`,
    });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open drafts', exact: true }).click();
    await page.screenshot({
      path: `docs/design/prototype/${testInfo.project.name}-${width}-drafts.png`,
    });
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('button', { name: 'Copy Post', exact: true })).toBeVisible();
  });
}
