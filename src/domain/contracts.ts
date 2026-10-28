import type { OutputMode, PostDocument } from './document';

export interface Draft {
  id: string;
  title: string;
  content: PostDocument;
  schemaVersion: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  lastCopiedAt: string | null;
}
export class DraftError extends Error {
  constructor(
    public code: 'conflict' | 'unavailable' | 'quota' | 'invalid' | 'missing',
    message: string,
  ) {
    super(message);
    this.name = 'DraftError';
  }
}
export interface DraftListing {
  drafts: Draft[];
  /** Stored records that failed validation; they stay in the database untouched. */
  unreadable: number;
}
export interface DraftRepository {
  createDraft(title: string, content: PostDocument): Promise<Draft>;
  getDraft(id: string): Promise<Draft>;
  listDrafts(): Promise<DraftListing>;
  updateDraft(
    id: string,
    expectedRevision: number,
    content: PostDocument,
    title: string,
  ): Promise<Draft>;
  deleteDraft(id: string, expectedRevision: number): Promise<void>;
  updateLastCopiedAt(id: string, timestamp: string): Promise<void>;
}
export interface Settings {
  theme: 'system' | 'light' | 'dark';
  outputMode: OutputMode;
  previewMode: 'desktop' | 'mobile';
  activeDraftId: string | null;
  unicodeWarningAcknowledged: boolean;
  settingsSchemaVersion: 1;
}
export const defaultSettings: Settings = {
  theme: 'system',
  outputMode: 'plain',
  previewMode: 'desktop',
  activeDraftId: null,
  unicodeWarningAcknowledged: false,
  settingsSchemaVersion: 1,
};
export interface SettingsRepository {
  load(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}
export interface ClipboardService {
  copyText(text: string): Promise<{ ok: true } | { ok: false; message: string }>;
}
export interface MarkdownAdapter {
  parse(markdown: string): PostDocument;
  serialize(document: PostDocument): string;
}
export interface PostSerializer {
  serialize(document: PostDocument, mode: OutputMode): string;
  validateDocument(value: unknown): value is PostDocument;
}
