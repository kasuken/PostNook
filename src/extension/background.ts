export async function initialize() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    await chrome.storage.local.remove('panelError');
    await chrome.action.setBadgeText({ text: '' });
  } catch {
    await chrome.storage.local.set({
      panelError: 'PostNook could not enable the side panel. Reload the extension and try again.',
    });
    await chrome.action.setBadgeText({ text: '!' });
  }
}
chrome.runtime.onInstalled.addListener(() => {
  void initialize();
});
chrome.runtime.onStartup.addListener(() => {
  void initialize();
});
chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === 'retry-panel') {
    void initialize().then(() => respond({ done: true }));
    return true;
  }
});
void initialize();
