import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Editor } from '@tiptap/react';
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

test('native Ctrl+V keeps Google Docs formatting, collapses source whitespace, and undoes', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('Before');
  await page.evaluate(async () => {
    const html =
      '<b style="font-weight:normal" id="docs-internal-guid-1"><p><span style="font-weight:700">Bold</span><span style="font-weight:400"> and\n   plain</span></p><br><p><span style="font-style:italic">Second 👋 日本語</span></p></b>';
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob(['Bold and plain\n\nSecond'], { type: 'text/plain' }),
      }),
    ]);
  });
  await editor.press('ControlOrMeta+End');
  await editor.press('Enter');
  await editor.press('ControlOrMeta+v');
  await expect(editor.locator('p')).toHaveText(['Before', 'Bold and plain', 'Second 👋 日本語']);
  await expect(editor.locator('strong')).toHaveText('Bold');
  await expect(editor.locator('em')).toHaveText('Second 👋 日本語');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await editor.press('ControlOrMeta+z');
  await expect(editor).not.toContainText('Bold');
  await expect(editor).toContainText('Before');
});

test('Markdown import inserts a list mid-paragraph and the result stays editable', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('Start end');
  await editor.press('ControlOrMeta+End');
  for (let i = 0; i < 4; i++) await editor.press('ArrowLeft');
  await page.getByRole('button', { name: 'Paste as Markdown', exact: true }).click();
  await page.getByLabel('Markdown text').fill('- one\n- two');
  await page.getByRole('button', { name: 'Insert text', exact: true }).click();
  await expect(editor.locator('li')).toHaveText(['one', 'two']);
  await expect(editor.locator('> p')).toHaveText(['Start', 'end']);
  await editor.locator('li').last().click();
  await editor.press('End');
  await editor.pressSequentially(' edited');
  await expect(editor.locator('li').last()).toHaveText('two edited');
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
  await expect(page.getByText('could not be saved, so it stays open')).toBeVisible();
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
  await expect(editor).toBeFocused();
  await title.fill('First draft');
  await editor.fill('Keep the first post');
  await page.getByRole('button', { name: 'New draft', exact: true }).click();
  await expect(editor).toBeFocused();
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
    // A new draft focuses the editor once it is editable; filling before that can append.
    await expect(editor).toBeFocused();
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
    // Write focuses the editor on the next frame; a fill before that can lose its selection.
    await expect(editor).toBeFocused();
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
    await expect(page.getByRole('textbox', { name: 'Post content' })).toBeFocused();
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

// Automated keys can outrun selectionchange, and locator actions refocus the editor, which
// restores ProseMirror's last known selection. Navigation therefore uses page.keyboard, and
// tests wait until ProseMirror reports the selection before pressing a shortcut that uses it.
async function settled(editor: Locator, expected: { text: string; from?: number }) {
  await expect
    .poll(() =>
      editor.evaluate((el) => {
        const { state } = (el as HTMLElement & { editor: Editor }).editor;
        const { from, to } = state.selection;
        return { text: state.doc.textBetween(from, to, ' '), from };
      }),
    )
    .toMatchObject(expected);
}

test('keyboard editing: paragraphs, line breaks, marks, undo, redo, and replace', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await expect(page.getByRole('button', { name: 'Undo (Ctrl+Z)', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Clear formatting', exact: true })).toBeDisabled();
  // Typing key by key does not wait for the post-create input lock to lift.
  await expect(editor).toBeEditable();
  await editor.click();
  await editor.pressSequentially('First line');
  await page.keyboard.press('Shift+Enter');
  await editor.pressSequentially('same paragraph');
  await page.keyboard.press('Enter');
  await editor.pressSequentially('Second paragraph');
  await expect(editor.locator('p')).toHaveCount(2);
  await expect(editor.locator('p').first().locator('br')).toHaveCount(1);
  await page.keyboard.press('Shift+Home');
  await settled(editor, { text: 'Second paragraph' });
  await page.keyboard.press('ControlOrMeta+i');
  await expect(editor.locator('em')).toHaveText('Second paragraph');
  await expect(page.getByRole('button', { name: 'Italic (Ctrl+I)', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('ControlOrMeta+z');
  await expect(editor.locator('em')).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(editor.locator('em')).toHaveText('Second paragraph');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  await expect(editor).toHaveText('');
  await editor.pressSequentially('Replaced');
  await expect(editor).toHaveText('Replaced');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
});

test('formatting keeps the cursor and selection stable from keys and toolbar', async ({ page }) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('Write a clear sentence');
  // Select "clear" by placing the cursor after it and extending left.
  await page.keyboard.press('End');
  for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowLeft');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+ArrowLeft');
  await settled(editor, { text: 'clear', from: 9 });
  const selection = () => page.evaluate(() => window.getSelection()?.toString());
  await page.getByRole('button', { name: 'Bold (Ctrl+B)', exact: true }).click();
  await expect(editor.locator('strong')).toHaveText('clear');
  expect(await selection()).toBe('clear');
  await expect(editor).toBeFocused();
  // Keyboard-only: reach the toolbar from the editor and apply italic to the same selection.
  const italic = page.getByRole('button', { name: 'Italic (Ctrl+I)', exact: true });
  for (let i = 0; i < 10 && !(await italic.evaluate((el) => el === document.activeElement)); i++)
    await page.keyboard.press('Shift+Tab');
  await expect(italic).toBeFocused();
  await page.keyboard.press('Space');
  await expect(editor.locator('em')).toHaveText('clear');
  await expect(editor).toBeFocused();
  expect(await selection()).toBe('clear');
  // A collapsed cursor keeps its position: typed text lands mid-sentence and bold.
  await page.keyboard.press('End');
  for (let i = 0; i < 13; i++) await page.keyboard.press('ArrowLeft');
  await settled(editor, { text: '', from: 10 });
  const bold = page.getByRole('button', { name: 'Bold (Ctrl+B)', exact: true });
  await page.keyboard.press('ControlOrMeta+b');
  await expect(bold).toHaveAttribute('aria-pressed', 'false');
  await editor.pressSequentially('X');
  await expect(editor).toHaveText('Write a cXlear sentence');
  await expect(editor.locator('strong').filter({ hasText: 'X' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear formatting', exact: true }).click();
  await expect(editor).toHaveText('Write a cXlear sentence');
});

test('pasting plain text over a selection stays inside the paragraph', async ({ page }) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('Keep old words here');
  await page.keyboard.press('End');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+ArrowLeft');
  await settled(editor, { text: 'words' });
  await editor.evaluate((el) => {
    const data = new DataTransfer();
    data.setData('text/plain', 'new');
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  });
  await expect(editor).toHaveText('Keep old new here');
  await expect(editor.locator('p')).toHaveCount(1);
  await editor.evaluate((el) => {
    const data = new DataTransfer();
    data.setData('text/html', '<h2>Heading</h2><pre><code>code()</code></pre><img src="x">');
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  });
  await expect(editor.locator('h2, pre, code, img')).toHaveCount(0);
  await expect(editor).toContainText('Heading');
  await expect(editor).toContainText('code()');
});

// The counter follows the browser locale, so any thousands separator is accepted.
const counted = (n: string) =>
  new RegExp(`^${n.replace(/\B(?=(\d{3})+$)/g, '\\D?')} of 3\\D?000 estimated characters$`);
type StoredDraft = {
  title: string;
  content: unknown;
  revision: number;
  lastCopiedAt: string | null;
};
const storedDrafts = (page: import('@playwright/test').Page) =>
  page.evaluate(
    () =>
      new Promise<StoredDraft[]>((resolve, reject) => {
        const open = indexedDB.open('postnook');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const all = open.result.transaction('drafts').objectStore('drafts').getAll();
          all.onsuccess = () => {
            open.result.close();
            resolve(all.result as StoredDraft[]);
          };
        };
      }),
  );
const storedDraft = async (page: import('@playwright/test').Page) => (await storedDrafts(page))[0]!;

test('the counter follows the generated output, not the editor content', async ({ page }) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const count = page.getByTestId('character-count').locator('.sr-only');
  const copy = page.getByRole('button', { name: 'Copy Post', exact: true });
  await expect(count).toContainText(counted('0'));
  await expect(copy).toBeDisabled();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('Hello');
  await expect(count).toContainText(counted('5'));
  await page.getByRole('button', { name: 'Bullet list', exact: true }).click();
  // The bullet marker and its space are part of the copied text.
  await expect(count).toContainText(counted('7'));
  await page.getByRole('button', { name: 'Bullet list', exact: true }).click();
  await editor.press('ControlOrMeta+a');
  await editor.press('ControlOrMeta+b');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  const before = await storedDraft(page);
  await page.getByLabel('Output mode').selectOption('unicode');
  await page.getByRole('button', { name: 'Use Unicode styling', exact: true }).click();
  await expect(count).toContainText(counted('10'));
  await page.getByLabel('Output mode').selectOption('plain');
  await expect(count).toContainText(counted('5'));
  expect((await storedDraft(page)).content).toEqual(before.content);
  await editor.press('ControlOrMeta+a');
  await editor.press('Delete');
  await expect(count).toContainText(counted('0'));
  await expect(copy).toBeDisabled();
});

test('approaching and over-limit posts warn, still save, and copy after confirmation', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  const note = page.locator('.limit-note');
  await editor.fill('a'.repeat(2899));
  await expect(note).toBeEmpty();
  await editor.press('End');
  await editor.pressSequentially('b');
  await expect(note).toHaveText('You’re close to the estimated character limit.');
  const over = 'a'.repeat(2900) + 'é👋'.repeat(33) + 'z';
  await editor.fill(over);
  await expect(page.getByTestId('character-count').locator('.sr-only')).toContainText(
    counted('3000'),
  );
  await editor.press('End');
  await editor.pressSequentially('!');
  await expect(note).toHaveText('Over the estimated limit. You can still save or copy.');
  await expect(page.getByTestId('character-count')).toHaveClass(/over/);
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await page.reload();
  await expect(editor).toHaveText(over + '!');
  await page.getByRole('button', { name: 'Copy Post', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Your post is over the estimate');
  await page.getByRole('button', { name: 'Copy anyway', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copied!', exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(over + '!');
});

test('copy records the time only after success and leaves the draft untouched', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await editor.fill('First line\n\nSecond line');
  await editor.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'Numbered list', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  const before = await storedDraft(page);
  expect(before.lastCopiedAt).toBeNull();

  await page.evaluate(() => {
    const native = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) =>
          (window as unknown as { failCopy?: boolean }).failCopy === false
            ? native.writeText(text)
            : Promise.reject(new DOMException('Denied', 'NotAllowedError')),
        readText: () => native.readText(),
      },
    });
  });
  const copy = page.getByRole('button', { name: 'Copy Post', exact: true });
  await copy.click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Copy your post manually');
  await expect(page.getByText(/could not copy your post/)).toBeVisible();
  await page.keyboard.press('Escape');
  expect((await storedDraft(page)).lastCopiedAt).toBeNull();

  await page.evaluate(() => ((window as unknown as { failCopy?: boolean }).failCopy = false));
  await copy.click();
  await expect(page.getByRole('button', { name: 'Copied!', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Post copied.' })).toBeAttached();
  await expect.poll(async () => (await storedDraft(page)).lastCopiedAt).not.toBeNull();
  const after = await storedDraft(page);
  expect(after.revision).toBe(before.revision);
  expect(after.content).toEqual(before.content);
  // The empty item between the lines is left out, and numbering stays sequential.
  // Windows reads the clipboard back with CRLF line endings.
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(
    '1. First line\n2. Second line',
  );
  await expect(editor.locator('ol li')).toHaveCount(3);
  await expect(editor).toHaveText('First lineSecond line');
});

test('focus loss and page hide save pending edits before the debounce fires', async ({ page }) => {
  await page.clock.install();
  await page.reload();
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await expect(editor).toBeVisible();
  // Freeze time so neither the 300 ms debounce nor the 1,500 ms maximum wait can fire.
  await page.clock.pauseAt(Date.now() + 60_000);
  const status = page.getByRole('status').filter({ hasText: /Saved on this device|Unsaved/ });
  for (const [text, event] of [
    ['Saved on blur', 'blur'],
    ['Saved on hide', 'visibilitychange'],
    ['Saved on close', 'pagehide'],
  ] as const) {
    await editor.fill(text);
    await expect(status).toHaveText('Unsaved changes');
    expect(JSON.stringify((await storedDraft(page)).content)).not.toContain(text);
    await page.evaluate((name) => {
      const target = name === 'visibilitychange' ? document : window;
      target.dispatchEvent(new Event(name));
    }, event);
    await expect(status).toHaveText('Saved on this device');
    expect(JSON.stringify((await storedDraft(page)).content)).toContain(text);
  }
});

test('drafts list newest first, show the active draft, and reopen the last active one', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const title = page.getByRole('textbox', { name: 'Draft title' });
  const editor = page.getByRole('textbox', { name: 'Post content' });
  const saved = page.getByRole('status').filter({ hasText: 'Saved on this device' });
  await expect(editor).toBeFocused();
  await title.fill('Older draft');
  await editor.fill('Written first');
  await expect(saved).toBeVisible();
  await page.getByRole('button', { name: 'New draft', exact: true }).click();
  await expect(editor).toBeFocused();
  await expect(title).toHaveValue('Untitled Post');
  await title.fill('Newer draft');
  await editor.fill('Written second');
  await expect
    .poll(async () => (await storedDrafts(page)).map((d) => d.title))
    .toContain('Newer draft');
  await expect(saved).toBeVisible();
  await page.getByRole('button', { name: 'Open drafts', exact: true }).click();
  const rows = page.locator('.draft-row');
  await expect(rows).toHaveText([/Newer draft/, /Older draft/]);
  await expect(rows.first()).toHaveAttribute('aria-current', 'true');
  await rows.filter({ hasText: 'Older draft' }).click();
  await expect(editor).toHaveText('Written first');
  // The older draft is not the newest, so only the stored active id can bring it back.
  await page.reload();
  await expect(title).toHaveValue('Older draft');
  await expect(editor).toHaveText('Written first');
  await page.getByRole('button', { name: 'Open drafts', exact: true }).click();
  await expect(rows.filter({ hasText: 'Older draft' })).toHaveAttribute('aria-current', 'true');
  await expect(rows.filter({ hasText: 'Newer draft' })).not.toHaveAttribute('aria-current');
});

test('deleting the last draft shows the empty state', async ({ page }) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  await expect(page.getByRole('textbox', { name: 'Post content' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Draft title' }).fill('');
  await page.getByRole('button', { name: 'Delete current draft' }).click();
  await expect(page.getByRole('dialog')).toContainText('“Untitled Post” will be removed');
  await page.getByRole('button', { name: 'Delete draft', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Give it a little space.' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Post content' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Create first post' })).toBeVisible();
});

test('an unreadable stored draft is reported and left untouched while others stay usable', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Create first post' }).click();
  const title = page.getByRole('textbox', { name: 'Draft title' });
  const editor = page.getByRole('textbox', { name: 'Post content' });
  const saved = page.getByRole('status').filter({ hasText: 'Saved on this device' });
  await expect(editor).toBeFocused();
  await title.fill('Healthy draft');
  await editor.fill('Still readable');
  await expect(saved).toBeVisible();
  await page.getByRole('button', { name: 'New draft', exact: true }).click();
  await expect(editor).toBeFocused();
  await title.fill('Damaged draft');
  // The new draft already shows Saved, so wait for the renamed record itself.
  await expect
    .poll(async () => (await storedDrafts(page)).map((d) => d.title))
    .toContain('Damaged draft');
  await expect(saved).toBeVisible();
  // Mark the active draft as written by a future schema.
  const damagedId = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const id = JSON.parse(localStorage.getItem('postnook-settings')!).activeDraftId as string;
        const open = indexedDB.open('postnook');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const store = open.result.transaction('drafts', 'readwrite').objectStore('drafts');
          const get = store.get(id);
          get.onsuccess = () => {
            store.put({ ...get.result, schemaVersion: 99 }).onsuccess = () => {
              open.result.close();
              resolve(id);
            };
          };
        };
      }),
  );
  await page.reload();
  await expect(page.getByText('could not be read safely')).toBeVisible();
  await expect(editor).toHaveCount(0);
  await page.getByRole('button', { name: 'Open remaining drafts' }).click();
  await expect(page.getByText('1 stored draft could not be read')).toBeVisible();
  await expect(title).toHaveValue('Healthy draft');
  await expect(editor).toHaveText('Still readable');
  await page.getByRole('button', { name: 'Open drafts', exact: true }).click();
  await expect(page.locator('.draft-row')).toHaveCount(1);
  const kept = await page.evaluate(
    (id) =>
      new Promise<unknown>((resolve) => {
        const open = indexedDB.open('postnook');
        open.onsuccess = () => {
          const get = open.result.transaction('drafts').objectStore('drafts').get(id);
          get.onsuccess = () => {
            open.result.close();
            resolve(get.result);
          };
        };
      }),
    damagedId,
  );
  expect(kept).toMatchObject({ title: 'Damaged draft', schemaVersion: 99 });
});

async function importMarkdown(page: Page, markdown: string) {
  await page.getByRole('button', { name: 'Paste as Markdown', exact: true }).click();
  await page.getByLabel('Markdown text').fill(markdown);
  await page.getByRole('button', { name: 'Insert text', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
}

test('preview shows the exact copied text, keeps its spacing, and fetches nothing', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Create first post' }).click();
  await expect(page.getByRole('textbox', { name: 'Post content' })).toBeFocused();
  await page.getByRole('button', { name: 'Paste as Markdown', exact: true }).click();
  await page
    .getByLabel('Markdown text')
    .fill(
      '**Opening** line  \nwith a break\n\nSecond paragraph\n\n- First\n- Second\n  - Nested\n\n1. One\n2. Two\n\nClosing *thought*',
    );
  await page.getByRole('button', { name: 'Insert text', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  const origin = new URL(page.url()).origin;
  const external: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
  });
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  // textContent, not toHaveText, so whitespace and blank lines are compared exactly.
  const raw = () => page.locator('.preview-text').evaluate((el) => el.textContent);
  const expected =
    'Opening line\nwith a break\n\nSecond paragraph\n\n• First\n• Second\n  • Nested\n\n1. One\n2. Two\n\nClosing thought';
  expect(await raw()).toBe(expected);
  await page.getByRole('button', { name: 'Copy Post', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copied!', exact: true })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.replace(/\r\n/g, '\n')).toBe(await raw());
  // Unicode styling appears only once it is selected, and leaves again with plain text.
  expect(await raw()).not.toMatch(/[\u{1D400}-\u{1D7FF}]/u);
  await page.getByLabel('Output mode').selectOption('unicode');
  await page.getByRole('button', { name: 'Use Unicode styling', exact: true }).click();
  await expect(page.locator('.preview-text')).toContainText('𝐎𝐩𝐞𝐧𝐢𝐧𝐠');
  await expect(page.locator('.preview-text')).toContainText('Closing 𝑡ℎ𝑜𝑢𝑔ℎ𝑡');
  await page.getByLabel('Output mode').selectOption('plain');
  expect(await raw()).toBe(expected);
  await expect(page.getByText('LinkedIn may render the pasted post differently.')).toBeVisible();
  await page.getByRole('button', { name: 'Mobile preview', exact: true }).click();
  await expect(page.locator('.preview-post')).toHaveClass(/mobile/);
  expect(await raw()).toBe(expected);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  expect(external).toEqual([]);
  await expect(page.locator('.preview-pane img, .preview-pane iframe')).toHaveCount(0);
});

test('desktop or mobile preview is remembered and long posts scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await expect(editor).toBeFocused();
  const paragraphs = Array.from({ length: 40 }, (_, i) => `Paragraph ${i + 1} of the post.`);
  await importMarkdown(page, paragraphs.join('\n\n'));
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const desktop = page.getByRole('button', { name: 'Desktop preview', exact: true });
  const mobile = page.getByRole('button', { name: 'Mobile preview', exact: true });
  await expect(desktop).toHaveAttribute('aria-pressed', 'true');
  await mobile.click();
  await expect(mobile).toHaveAttribute('aria-pressed', 'true');
  await expect(desktop).toHaveAttribute('aria-pressed', 'false');
  const pane = page.locator('.preview-pane');
  expect(await pane.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  // Keyboard scrolling: focus the post and press End.
  await page.getByRole('article', { name: 'Post text preview' }).focus();
  await page.keyboard.press('End');
  await expect
    .poll(() => pane.evaluate((el) => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop)))
    .toBeLessThan(2);
  expect(
    await page
      .locator('.preview-text')
      .evaluate(
        (el) =>
          el.getBoundingClientRect().bottom <=
          el.closest('section')!.getBoundingClientRect().bottom,
      ),
  ).toBe(true);
  await expect(page.locator('.preview-text')).toContainText(/Paragraph 40 of the post\.$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.preview-post')).toHaveClass(/mobile/);
  await desktop.click();
  await expect(page.locator('.preview-post')).toHaveClass(/desktop/);
});

test('returning from preview keeps the content, cursor, and scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 640 });
  await page.getByRole('button', { name: 'Create first post' }).click();
  const editor = page.getByRole('textbox', { name: 'Post content' });
  await expect(editor).toBeFocused();
  const paragraphs = Array.from({ length: 60 }, (_, i) => `Line ${i + 1} of a long draft.`);
  await importMarkdown(page, paragraphs.join('\n\n'));
  // Put the cursor near the top, then scroll the reading position well away from it.
  await editor.evaluate((el) => {
    (el as HTMLElement & { editor: Editor }).editor.commands.setTextSelection(30);
  });
  await settled(editor, { text: '', from: 30 });
  const scroller = page.locator('.writing-scroll');
  await scroller.evaluate((el) => {
    el.scrollTop = 900;
  });
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(400);
  const before = await scroller.evaluate((el) => el.scrollTop);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.preview-text')).toContainText('Line 60 of a long draft.');
  await page.getByRole('button', { name: 'Write', exact: true }).click();
  await expect(editor).toBeFocused();
  await settled(editor, { text: '', from: 30 });
  expect(await scroller.evaluate((el) => el.scrollTop)).toBe(before);
  await expect(editor).toHaveText(paragraphs.join(''));
  await page.keyboard.type('X');
  await expect(editor.locator('p').nth(1)).toHaveText('LineX 2 of a long draft.');
});
