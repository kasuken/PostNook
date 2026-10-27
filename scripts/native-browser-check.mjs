import { chromium, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

// Dedicated disposable profiles only. Never touches a user's browser profile.
const channel = process.argv[2] || 'chrome';
const profile = resolve(`.browser-profiles/${channel}-${Date.now()}`);
const launchOptions = {
  channel,
  headless: true,
  viewport: { width: 1000, height: 850 },
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--enable-unsafe-extension-debugging'],
};
let context = await chromium.launchPersistentContext(profile, launchOptions);
try {
  const tab = context.pages()[0] || (await context.newPage());
  await tab.goto('http://127.0.0.1:4173/sidepanel.html');
  const cdp = await context.browser().newBrowserCDPSession();
  const { id } = await cdp.send('Extensions.loadUnpacked', { path: resolve('dist') });
  const worker =
    context.serviceWorkers().find((w) => w.url().includes(id)) ||
    (await context.waitForEvent('serviceworker'));
  await expect
    .poll(() => worker.evaluate(() => chrome.sidePanel.getPanelBehavior()))
    .toEqual({ openPanelOnActionClick: true });
  const targets = await cdp.send('Target.getTargets', {
    filter: [{ type: 'tab', exclude: false }],
  });
  const target = targets.targetInfos.find((t) => t.url === tab.url());
  if (!target) throw new Error('The test tab target is not available: ' + JSON.stringify(targets));
  await cdp.send('Extensions.triggerAction', { id, targetId: target.targetId });
  await expect
    .poll(
      async () =>
        (await cdp.send('Target.getTargets')).targetInfos.filter(
          (t) => t.url === `chrome-extension://${id}/sidepanel.html`,
        ).length,
    )
    .toBeGreaterThan(0);
  console.log(
    'Native panel targets',
    JSON.stringify(
      (await cdp.send('Target.getTargets')).targetInfos
        .filter((t) => t.url.includes(id))
        .map((t) => ({ type: t.type, url: t.url })),
    ),
  );
  // Playwright intentionally does not expose side_panel views as Page instances.
  // Attach to the observed panel target through the documented CDP target API.
  const panelTarget = (await cdp.send('Target.getTargets')).targetInfos.find(
    (t) => t.url === `chrome-extension://${id}/sidepanel.html`,
  );
  const { sessionId } = await cdp.send('Target.attachToTarget', {
    targetId: panelTarget.targetId,
    flatten: false,
  });
  let sequence = 0;
  const send = (method, params = {}) =>
    new Promise((resolveCommand, reject) => {
      const commandId = ++sequence;
      const timer = setTimeout(() => {
        cdp.off('Target.receivedMessageFromTarget', listener);
        reject(new Error(`Timed out: ${method}`));
      }, 15000);
      const listener = (event) => {
        if (event.sessionId !== sessionId) return;
        const message = JSON.parse(event.message);
        if (message.id !== commandId) return;
        clearTimeout(timer);
        cdp.off('Target.receivedMessageFromTarget', listener);
        if (message.error) reject(new Error(message.error.message));
        else resolveCommand(message.result);
      };
      cdp.on('Target.receivedMessageFromTarget', listener);
      cdp
        .send('Target.sendMessageToTarget', {
          sessionId,
          message: JSON.stringify({ id: commandId, method, params }),
        })
        .catch((error) => {
          clearTimeout(timer);
          cdp.off('Target.receivedMessageFromTarget', listener);
          reject(error);
        });
    });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description || JSON.stringify(result.exceptionDetails),
      );
    return result.result.value;
  };
  await expect
    .poll(() => evaluate("document.body?.innerText.includes('Create first post') ?? false"))
    .toBe(true);
  await evaluate(
    "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Create first post')).click()",
  );
  await expect
    .poll(() =>
      evaluate(
        'document.querySelector(\'[aria-label="Post content"]\')?.isContentEditable ?? false',
      ),
    )
    .toBe(true);
  await evaluate('document.querySelector(\'[aria-label="Post content"]\').focus()');
  await send('Input.insertText', {
    text: 'A native side-panel draft.\n\nSaved here. Copied by me.',
  });
  await expect
    .poll(() =>
      evaluate(
        "document.body.innerText.includes('Saved on this device') && document.querySelector('.tiptap').textContent.includes('native side-panel')",
      ),
    )
    .toBe(true);
  await evaluate(
    "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Copy Post')).click()",
  );
  await expect.poll(() => evaluate("document.body.innerText.includes('Copied!')")).toBe(true);
  await context.grantPermissions(['clipboard-read'], { origin: 'http://127.0.0.1:4173' });
  await tab.bringToFront();
  const copied = await tab.evaluate(() => navigator.clipboard.readText());
  // Windows' system clipboard canonicalizes LF to CRLF. Compare text semantics.
  expect(copied.replace(/\r\n/g, '\n')).toBe(
    'A native side-panel draft.\n\nSaved here. Copied by me.',
  );
  await send('Page.reload');
  await expect
    .poll(() =>
      evaluate(
        "document.querySelector('.tiptap')?.textContent.includes('A native side-panel draft.') ?? false",
      ),
    )
    .toBe(true);
  await mkdir('docs/design/prototype', { recursive: true });
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(
    `docs/design/prototype/${channel}-native.png`,
    Buffer.from(screenshot.data, 'base64'),
  );
  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
  const version = context.browser().version();
  await context.close();
  context = await chromium.launchPersistentContext(profile, launchOptions);
  const restartSession = await context.browser().newBrowserCDPSession();
  const restartedExtension = await restartSession.send('Extensions.loadUnpacked', {
    path: resolve('dist'),
  });
  expect(restartedExtension.id).toBe(id);
  const restored = await context.newPage();
  await restored.goto(`chrome-extension://${id}/sidepanel.html`);
  await expect(restored.getByRole('textbox', { name: 'Post content' })).toContainText(
    'A native side-panel draft.',
  );
  const result = {
    channel,
    browserVersion: version,
    testedAt: new Date().toISOString(),
    nativeActionOpenedPanel: true,
    createSaveCopyReload: true,
    clipboardContentVerified: true,
    browserRestartRestored: true,
    permissions: manifest.permissions,
    extraClipboardPermission: false,
  };
  await mkdir('docs/testing', { recursive: true });
  await writeFile(`docs/testing/${channel}-native.json`, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await context.close();
}
