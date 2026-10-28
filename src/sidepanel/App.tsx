import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Copy,
  Check,
  Plus,
  Settings2,
  ChevronDown,
  Eye,
  PenLine,
  ArrowRight,
  Trash2,
  LockKeyhole,
  FileText,
} from 'lucide-react';
import { NookMark, Button, IconButton, Modal, Notice, SaveIndicator } from '../components/ui';
import { emptyDocument, validateDocument, type PostDocument } from '../domain/document';
import { defaultSettings, type Draft, type Settings } from '../domain/contracts';
import { IndexedDraftRepository } from '../storage/drafts';
import { BrowserSettings, isExtension } from '../browser/settings';
import { BrowserClipboard } from '../browser/clipboard';
import { AutosaveService, type SaveSnapshot } from '../services/autosave';
import {
  serializePost,
  countCharacters,
  getLimitStatus,
  LINKEDIN_LIMIT,
} from '../services/serializer';
import { MarkedAdapter } from '../services/markdown';
import { WritingEditor } from '../features/editor/WritingEditor';
import { insertDocument } from '../features/editor/insert';
import { PostPreview } from '../features/preview/PostPreview';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import { DraftList } from '../features/drafts/DraftList';

const repository = new IndexedDraftRepository();
const settingsRepository = new BrowserSettings();
const clipboard = new BrowserClipboard();
type Dialog =
  | 'drafts'
  | 'settings'
  | 'markdown'
  | 'delete'
  | 'unicode'
  | 'over-limit'
  | 'manual-copy'
  | 'reload'
  | null;

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const settingsRef = useRef(settings);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [unreadable, setUnreadable] = useState(0);
  const [save, setSave] = useState<SaveSnapshot | null>(null);
  const service = useRef<AutosaveService | null>(null);
  const unsubscribe = useRef<(() => void) | null>(null);
  const editor = useRef<Editor | null>(null);
  const focusNext = useRef(false);
  const [session, setSession] = useState(0);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState('');
  const [error, setError] = useState('');
  const [panelError, setPanelError] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [preview, setPreview] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [importError, setImportError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');
  const [manualText, setManualText] = useState('');
  const [busy, setBusy] = useState(false);
  const settingsQueue = useRef(Promise.resolve());
  const busyRef = useRef(false);

  const updateSettings = useCallback((next: Settings) => {
    settingsRef.current = next;
    setSettings(next);
    settingsQueue.current = settingsQueue.current
      .then(() => settingsRepository.save(next))
      .catch(() =>
        setError(
          'Your preferences could not be saved. Your draft is unaffected. Try changing the setting again.',
        ),
      );
  }, []);
  const attach = useCallback(
    (draft: Draft) => {
      unsubscribe.current?.();
      service.current?.dispose();
      const next = new AutosaveService(draft, repository);
      service.current = next;
      setSave(next.snapshot());
      unsubscribe.current = next.subscribe(setSave);
      setSession((n) => n + 1);
      setCopyState('idle');
      setPreview(false);
      updateSettings({ ...settingsRef.current, activeDraftId: draft.id });
    },
    [updateSettings],
  );

  const refresh = useCallback(async () => {
    const listing = await repository.listDrafts();
    setDrafts(listing.drafts);
    setUnreadable(listing.unreadable);
    return listing.drafts;
  }, []);
  const load = useCallback(
    async (ignoreActive = false) => {
      setBooting(true);
      setBootError('');
      try {
        const preferences = await settingsRepository.load();
        if (ignoreActive) {
          preferences.activeDraftId = null;
          await settingsRepository.save(preferences);
        }
        settingsRef.current = preferences;
        setSettings(preferences);
        const available = await refresh();
        // Never replace a missing requested draft with a blank document.
        const active = preferences.activeDraftId
          ? await repository.getDraft(preferences.activeDraftId)
          : available[0];
        if (active) attach(active);
        if (isExtension()) {
          const data = await chrome.storage.local.get('panelError');
          setPanelError(typeof data.panelError === 'string' ? data.panelError : '');
        }
      } catch (e) {
        setBootError(e instanceof Error ? e.message : 'Your drafts could not be loaded.');
      } finally {
        setBooting(false);
      }
    },
    [attach, refresh],
  );
  useEffect(() => {
    void load();
    return () => {
      unsubscribe.current?.();
      service.current?.dispose();
    };
  }, [load]);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : settings.theme;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.theme]);
  useEffect(() => {
    const flush = () => {
      void service.current?.flush();
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (service.current && service.current.snapshot().status !== 'saved') {
        event.preventDefault();
      }
    };
    window.addEventListener('blur', flush);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('blur', flush);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('beforeunload', warn);
    };
  }, []);
  const ready = useCallback((value: Editor | null) => {
    editor.current = value;
    if (value?.isEditable && focusNext.current) {
      value.commands.focus('end');
      focusNext.current = false;
    }
  }, []);
  const change = useCallback((doc: PostDocument) => {
    service.current?.edit(doc);
    setCopyState('idle');
  }, []);
  async function action(fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      // Close any dialog so the message is not hidden behind it.
      setDialog(null);
      setError(
        e instanceof Error
          ? e.message
          : 'That action could not be completed. Your text has been kept.',
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  // Saves the open draft before it is replaced; a failed save stops the action with a reason.
  async function saveCurrent() {
    if (service.current && !(await service.current.flush()))
      throw new Error(
        'Your current draft has unsaved changes that could not be saved, so it stays open. Retry the save or keep a separate copy first.',
      );
  }
  async function create() {
    await action(async () => {
      await saveCurrent();
      const created = await repository.createDraft('Untitled Post', emptyDocument());
      focusNext.current = true;
      attach(created);
      await refresh();
      setDialog(null);
    });
  }
  async function select(draft: Draft) {
    await action(async () => {
      await saveCurrent();
      const loaded = await repository.getDraft(draft.id);
      attach(loaded);
      setDialog(null);
    });
  }
  async function openDrafts() {
    await action(async () => {
      await refresh();
      setDialog('drafts');
    });
  }
  const currentDocument = save?.draft.content ?? emptyDocument();
  const serializable = validateDocument(currentDocument);
  const text = serializable ? serializePost(currentDocument, settings.outputMode) : '';
  const count = countCharacters(text);
  const limit = getLimitStatus(count);
  async function copy(confirmed = false) {
    if (copyState === 'copying') return;
    if (limit === 'over' && !confirmed) {
      setDialog('over-limit');
      return;
    }
    setDialog(null);
    setCopyState('copying');
    // Call directly in the click handler, before any storage await consumes activation.
    const result = await clipboard.copyText(text);
    if (!result.ok) {
      setManualText(text);
      setError(result.message);
      setDialog('manual-copy');
      setCopyState('idle');
      return;
    }
    const current = service.current?.draft;
    if (
      current?.id === save?.draft.id &&
      current &&
      serializePost(current.content, settingsRef.current.outputMode) === text
    )
      setCopyState('copied');
    else {
      setCopyState('idle');
      setError('The earlier version was copied. Copy again to include your latest edits.');
    }
    if (save) {
      try {
        await repository.updateLastCopiedAt(save.draft.id, new Date().toISOString());
      } catch {
        setError('Your post was copied, but its copy time could not be recorded.');
      }
    }
  }
  function importMarkdown() {
    try {
      const doc = new MarkedAdapter().parse(markdown);
      const view = editor.current?.view;
      // Keep the typed Markdown when there is nowhere to put it yet.
      if (!view) {
        setImportError('The editor is not ready yet. Your Markdown is kept; try again.');
        return;
      }
      insertDocument(view, doc);
      view.focus();
      setMarkdown('');
      setImportError('');
      setDialog(null);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed. Your draft is unchanged.');
    }
  }
  async function recover(duplicate: boolean) {
    await action(async () => {
      if (!service.current) return;
      const current = service.current.draft;
      const recovered = duplicate
        ? await repository.createDraft(
            `${current.title.slice(0, 105)} (recovered)`,
            current.content,
          )
        : await repository.getDraft(current.id);
      attach(recovered);
      await refresh();
      setDialog(null);
    });
  }
  async function remove() {
    await action(async () => {
      if (!service.current) return;
      await saveCurrent();
      await repository.deleteDraft(service.current.draft.id, service.current.draft.revision);
      const remaining = await refresh();
      unsubscribe.current?.();
      service.current.dispose();
      service.current = null;
      setSave(null);
      if (remaining[0]) attach(remaining[0]);
      else updateSettings({ ...settingsRef.current, activeDraftId: null });
      setDialog(null);
    });
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to writing
      </a>
      <header className="app-header">
        <div className="brand">
          <NookMark />
          <div>
            <span className="wordmark">PostNook</span>
            <p>Your little corner for better posts.</p>
          </div>
        </div>
        <IconButton label="Settings" onClick={() => setDialog('settings')}>
          <Settings2 size={19} />
        </IconButton>
      </header>
      {panelError && (
        <Notice
          actions={
            <Button
              onClick={() => {
                void chrome.runtime
                  .sendMessage({ type: 'retry-panel' })
                  .then(() => chrome.storage.local.get('panelError'))
                  .then((data) =>
                    setPanelError(typeof data.panelError === 'string' ? data.panelError : ''),
                  )
                  .catch(() =>
                    setPanelError(
                      'Panel setup is still unavailable. Reload the extension after saving or copying your text.',
                    ),
                  );
              }}
            >
              Retry panel setup
            </Button>
          }
        >
          {panelError}
        </Notice>
      )}
      {error && (
        <Notice
          actions={
            <Button variant="ghost" onClick={() => setError('')}>
              Dismiss
            </Button>
          }
        >
          {error}
        </Notice>
      )}
      {unreadable > 0 && (
        <Notice>
          {unreadable === 1
            ? '1 stored draft could not be read. It was left untouched on this device.'
            : `${unreadable} stored drafts could not be read. They were left untouched on this device.`}
        </Notice>
      )}
      {booting ? (
        <main id="main" className="welcome">
          <p role="status">Opening your nook…</p>
        </main>
      ) : bootError ? (
        <main id="main" className="welcome">
          <Notice
            actions={
              <>
                <Button
                  onClick={() => {
                    void load();
                  }}
                >
                  Retry loading
                </Button>
                <Button
                  onClick={() => {
                    void load(true);
                  }}
                >
                  Open remaining drafts
                </Button>
              </>
            }
          >
            {bootError}
          </Notice>
        </main>
      ) : !save ? (
        <main id="main" className="welcome">
          <div className="welcome-art" aria-hidden="true">
            <div className="note-sheet">
              <NookMark large />
              <span />
              <span />
              <span />
            </div>
            <span className="small-spark">✳</span>
          </div>
          <span className="welcome-caption">A thought worth sharing.</span>
          <h1>Give it a little space.</h1>
          <p>
            Write, find your rhythm, and make it yours.
            <br />
            Your next post starts here.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              void create();
            }}
            disabled={busy}
          >
            Create first post
            <ArrowRight size={18} />
          </Button>
          <div className="welcome-assurance">
            <LockKeyhole size={14} aria-hidden="true" />
            Private by nature. Saved on your device.
          </div>
        </main>
      ) : (
        <>
          <div className="draft-heading">
            <div className="draft-title">
              <label htmlFor="draft-title">Draft title</label>
              <input
                id="draft-title"
                maxLength={120}
                disabled={busy}
                value={save.draft.title}
                onChange={(event) =>
                  service.current?.edit(service.current.draft.content, event.target.value)
                }
                onBlur={() => {
                  void service.current?.flush();
                }}
              />
            </div>
            <div className="draft-actions">
              <Button
                variant="ghost"
                aria-haspopup="dialog"
                aria-label="Open drafts"
                onClick={() => {
                  void openDrafts();
                }}
                disabled={busy}
              >
                <FileText size={16} />
                <span>Drafts</span>
                <ChevronDown size={13} />
              </Button>
              <IconButton
                label="New draft"
                disabled={busy}
                onClick={() => {
                  void create();
                }}
              >
                <Plus size={19} />
              </IconButton>
            </div>
          </div>
          <nav className="view-switch" aria-label="Editor view">
            <button
              type="button"
              aria-pressed={!preview}
              onClick={() => {
                setPreview(false);
                // ProseMirror's own focus restores the selection at once without scrolling to
                // it, so the reading position the editor restored is kept.
                requestAnimationFrame(() => {
                  if (editor.current && !editor.current.isDestroyed) editor.current.view.focus();
                });
              }}
            >
              <PenLine size={15} />
              Write
            </button>
            <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>
              <Eye size={16} />
              Preview
            </button>
            <span className="view-hint">A post, in progress.</span>
          </nav>
          {save.message && (
            <Notice
              actions={
                <>
                  <Button
                    onClick={() => {
                      void service.current?.flush();
                    }}
                  >
                    Retry save
                  </Button>
                  <Button
                    onClick={() => {
                      void recover(true);
                    }}
                  >
                    Keep separate copy
                  </Button>
                  {save.status === 'conflict' && (
                    <Button onClick={() => setDialog('reload')}>Reload saved</Button>
                  )}
                </>
              }
            >
              {save.message}
            </Notice>
          )}
          <main id="main" className="workspace">
            <WritingEditor
              key={session}
              initialContent={save.draft.content}
              onChange={change}
              onReady={ready}
              onImport={() => {
                setImportError('');
                setDialog('markdown');
              }}
              onError={setError}
              hidden={preview}
              editable={!busy}
              outputMode={settings.outputMode}
            />
            {preview && (
              <PostPreview
                text={text}
                failed={!serializable}
                mode={settings.previewMode}
                onMode={(mode) => updateSettings({ ...settingsRef.current, previewMode: mode })}
              />
            )}
          </main>
          <footer className="app-footer">
            <div className="status-row">
              <SaveIndicator status={save.status} />
              <span
                className={`character-count ${limit}`}
                data-testid="character-count"
                title="Estimated characters in the copied post. LinkedIn may count differently."
              >
                <span aria-hidden="true">
                  {count.toLocaleString()}
                  <span> / {LINKEDIN_LIMIT.toLocaleString()}</span>
                </span>
                <span className="sr-only">
                  {count.toLocaleString()} of {LINKEDIN_LIMIT.toLocaleString()} estimated characters
                </span>
              </span>
            </div>
            {/* Always mounted so screen readers announce the text when it appears. */}
            <p className={`limit-note ${limit}`} role="status">
              {limit === 'over'
                ? 'Over the estimated limit. You can still save or copy.'
                : limit === 'approaching'
                  ? 'You’re close to the estimated character limit.'
                  : ''}
            </p>
            <div className="publish-row">
              <label className="output-select">
                <span>Copy as</span>
                <select
                  aria-label="Output mode"
                  value={settings.outputMode}
                  onChange={(event) => {
                    if (event.target.value === 'unicode' && !settings.unicodeWarningAcknowledged)
                      setDialog('unicode');
                    else
                      updateSettings({
                        ...settingsRef.current,
                        outputMode: event.target.value === 'unicode' ? 'unicode' : 'plain',
                      });
                    setCopyState('idle');
                  }}
                >
                  <option value="plain">Plain text</option>
                  <option value="unicode">Unicode styling</option>
                </select>
              </label>
              <Button
                variant="primary"
                disabled={!text.trim() || copyState === 'copying'}
                onClick={() => {
                  void copy();
                }}
              >
                {copyState === 'copied' ? <Check size={17} /> : <Copy size={17} />}{' '}
                {copyState === 'copied'
                  ? 'Copied!'
                  : copyState === 'copying'
                    ? 'Copying…'
                    : 'Copy Post'}
              </Button>
            </div>
            <div className="footer-note">
              <span>
                {settings.outputMode === 'plain'
                  ? 'Plain text keeps your words easy to read.'
                  : 'Unicode styling may be harder to read or search.'}
              </span>
              <IconButton label="Delete current draft" onClick={() => setDialog('delete')}>
                <Trash2 size={14} />
              </IconButton>
            </div>
            <span className="sr-only" role="status">
              {copyState === 'copied'
                ? 'Post copied. Paste it into LinkedIn and publish manually.'
                : ''}
            </span>
          </footer>
        </>
      )}
      {dialog === 'settings' && (
        <Modal title="Your nook, your way" onClose={() => setDialog(null)}>
          <SettingsPanel settings={settings} onChange={updateSettings} />
        </Modal>
      )}
      {dialog === 'drafts' && (
        <Modal title="Your drafts" onClose={() => setDialog(null)}>
          <DraftList
            drafts={drafts}
            activeId={save?.draft.id}
            onSelect={(d) => {
              void select(d);
            }}
            onCreate={() => {
              void create();
            }}
          />
        </Modal>
      )}
      {dialog === 'markdown' && (
        <Modal title="Paste as Markdown" onClose={() => setDialog(null)}>
          <p className="muted">Bring your words with you. Bold, italic, and lists stay editable.</p>
          <label className="field-label" htmlFor="markdown">
            Markdown text
          </label>
          <textarea
            id="markdown"
            className="text-input import-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={'**A thought worth sharing**\n\n- Start here'}
          />
          {importError && <Notice>{importError}</Notice>}
          <p className="muted small">
            Inserted at your cursor. Unsupported elements become readable text.
          </p>
          <div className="modal-actions">
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="primary" disabled={!markdown.trim()} onClick={importMarkdown}>
              Insert text
            </Button>
          </div>
        </Modal>
      )}
      {dialog === 'delete' && (
        <Modal title="Delete this draft?" onClose={() => setDialog(null)}>
          <p>
            “{save?.draft.title || 'Untitled Post'}” will be removed from this device. This cannot
            be undone.
          </p>
          <div className="modal-actions">
            <Button onClick={() => setDialog(null)}>Keep draft</Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                void remove();
              }}
            >
              Delete draft
            </Button>
          </div>
        </Modal>
      )}
      {dialog === 'reload' && (
        <Modal title="Replace your unsaved changes?" onClose={() => setDialog(null)}>
          <p>
            Reloading replaces the text in this window with the last stored version. Keep a separate
            copy if you need both versions.
          </p>
          <div className="modal-actions">
            <Button
              onClick={() => {
                void recover(true);
              }}
            >
              Keep separate copy
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                void recover(false);
              }}
            >
              Reload saved version
            </Button>
          </div>
        </Modal>
      )}
      {dialog === 'unicode' && (
        <Modal title="A note about Unicode styling" onClose={() => setDialog(null)}>
          <p>
            Unicode emphasis replaces ordinary letters with special characters. Some screen readers,
            searches, and devices may not read them as expected.
          </p>
          <p>Your original draft stays unchanged. Plain text is the most accessible choice.</p>
          <div className="modal-actions">
            <Button onClick={() => setDialog(null)}>Keep plain text</Button>
            <Button
              variant="primary"
              onClick={() => {
                updateSettings({
                  ...settingsRef.current,
                  outputMode: 'unicode',
                  unicodeWarningAcknowledged: true,
                });
                setDialog(null);
              }}
            >
              Use Unicode styling
            </Button>
          </div>
        </Modal>
      )}
      {dialog === 'over-limit' && (
        <Modal title="Your post is over the estimate" onClose={() => setDialog(null)}>
          <p>
            This output is an estimated {count.toLocaleString()} characters. LinkedIn may reject it
            or count characters differently.
          </p>
          <div className="modal-actions">
            <Button onClick={() => setDialog(null)}>Keep editing</Button>
            <Button
              variant="primary"
              onClick={() => {
                void copy(true);
              }}
            >
              Copy anyway
            </Button>
          </div>
        </Modal>
      )}
      {dialog === 'manual-copy' && (
        <Modal title="Copy your post manually" onClose={() => setDialog(null)}>
          <p>Select the text, then press Ctrl+C or Cmd+C. Your draft stays in the editor.</p>
          <label className="field-label" htmlFor="manual-copy">
            Post text
          </label>
          <textarea
            id="manual-copy"
            className="text-input import-input"
            value={manualText}
            readOnly
            onFocus={(e) => e.target.select()}
          />
          <Button
            className="full-width"
            onClick={() => {
              const el = window.document.getElementById('manual-copy') as HTMLTextAreaElement;
              el.focus();
              el.select();
            }}
          >
            Select all text
          </Button>
        </Modal>
      )}
    </div>
  );
}
