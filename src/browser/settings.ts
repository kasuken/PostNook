import { defaultSettings, type Settings, type SettingsRepository } from '../domain/contracts';
export const isExtension = () => typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
export function parseSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') return { ...defaultSettings };
  const s = raw as Partial<Settings>;
  if (s.settingsSchemaVersion !== undefined && s.settingsSchemaVersion !== 1)
    throw new Error('These preferences were saved by a newer PostNook version.');
  return {
    theme: ['system', 'light', 'dark'].includes(s.theme ?? '') ? s.theme! : 'system',
    outputMode: s.outputMode === 'unicode' ? 'unicode' : 'plain',
    previewMode: s.previewMode === 'mobile' ? 'mobile' : 'desktop',
    activeDraftId: typeof s.activeDraftId === 'string' ? s.activeDraftId : null,
    unicodeWarningAcknowledged: s.unicodeWarningAcknowledged === true,
    settingsSchemaVersion: 1,
  };
}
export class BrowserSettings implements SettingsRepository {
  async load(): Promise<Settings> {
    const raw: unknown = isExtension()
      ? (await chrome.storage.local.get('settings')).settings
      : JSON.parse(localStorage.getItem('postnook-settings') ?? 'null');
    return parseSettings(raw);
  }
  async save(settings: Settings) {
    if (isExtension()) await chrome.storage.local.set({ settings });
    else localStorage.setItem('postnook-settings', JSON.stringify(settings));
  }
}
