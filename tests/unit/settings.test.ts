import { describe, expect, it } from 'vitest';
import { parseSettings } from '../../src/browser/settings';
import { defaultSettings } from '../../src/domain/contracts';

describe('parseSettings', () => {
  it('defaults to the system theme and plain output', () => {
    expect(parseSettings(undefined)).toEqual(defaultSettings);
    expect(defaultSettings).toMatchObject({
      theme: 'system',
      outputMode: 'plain',
      previewMode: 'desktop',
      activeDraftId: null,
      unicodeWarningAcknowledged: false,
      settingsSchemaVersion: 1,
    });
  });
  it('keeps valid stored choices', () => {
    const stored = {
      theme: 'dark',
      outputMode: 'unicode',
      previewMode: 'mobile',
      activeDraftId: '8f0c2b8e-1b2a-4c3d-9e4f-5a6b7c8d9e0f',
      unicodeWarningAcknowledged: true,
      settingsSchemaVersion: 1,
    };
    expect(parseSettings(stored)).toEqual(stored);
  });
  it('replaces invalid values with defaults instead of trusting them', () => {
    expect(
      parseSettings({
        theme: 'neon',
        outputMode: 'html',
        previewMode: 'tablet',
        activeDraftId: 42,
        unicodeWarningAcknowledged: 'yes',
      }),
    ).toEqual(defaultSettings);
  });
  it('rejects preferences from a newer schema rather than downgrading them', () => {
    expect(() => parseSettings({ settingsSchemaVersion: 2 })).toThrow('newer PostNook version');
  });
});
