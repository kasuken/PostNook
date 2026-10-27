import { useEffect, useState } from 'react';
import { Plus, Bold, FileDown, ChevronDown } from 'lucide-react';
import { Button, IconButton, Modal, Notice, SaveIndicator, NookMark } from '../components/ui';
import type { SaveStatus } from '../services/autosave';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import { defaultSettings, type Settings } from '../domain/contracts';

export default function DevStudio() {
  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [dialog, setDialog] = useState(false);
  const [scenario, setScenario] = useState('Save failed');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <main className="studio">
      <div className="studio-header">
        <NookMark />
        <h1>PostNook component studio</h1>
      </div>
      <Notice>Development fixtures only. Save, copy, and error states below are simulated.</Notice>
      <label className="field-label" htmlFor="studio-theme">
        Theme
      </label>
      <select id="studio-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option>light</option>
        <option>dark</option>
      </select>
      <section>
        <h2>Actions and formatting</h2>
        <div className="showcase-row">
          <Button variant="primary">Copy Post</Button>
          <Button>Secondary</Button>
          <Button variant="danger">Delete draft</Button>
          <Button disabled>Unavailable</Button>
          <IconButton label="Bold" aria-pressed>
            <Bold size={18} />
          </IconButton>
          <IconButton label="Import">
            <FileDown size={18} />
          </IconButton>
          <IconButton label="New draft">
            <Plus size={18} />
          </IconButton>
        </div>
      </section>
      <section>
        <h2>Drafts and menus</h2>
        <button className="draft-row" type="button" onClick={() => setDialog(true)}>
          <span>
            <strong>A little thought about creative work</strong>
            <small>Today, 10:30</small>
          </span>
          <ChevronDown size={17} />
        </button>
        <Button onClick={() => setDialog(true)}>Open example dialog</Button>
      </section>
      <section>
        <h2>Persistence states</h2>
        <div className="showcase-column">
          {(['saved', 'saving', 'dirty', 'failed', 'conflict'] as SaveStatus[]).map((status) => (
            <SaveIndicator key={status} status={status} />
          ))}
        </div>
      </section>
      <section>
        <h2>Error and recovery states</h2>
        <label htmlFor="scenario">Simulated scenario</label>
        <select id="scenario" value={scenario} onChange={(e) => setScenario(e.target.value)}>
          {[
            'Save failed',
            'Storage unavailable',
            'Load failure',
            'Stale revision conflict',
            'Clipboard failure',
            'Editor initialization failure',
            'Markdown parsing failure',
            'Storage quota exceeded',
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <Notice
          actions={
            <>
              <Button>Retry</Button>
              <Button>Keep separate copy</Button>
            </>
          }
        >
          {scenario}. Your existing text remains available. These controls demonstrate layout only.
        </Notice>
      </section>
      <section>
        <h2>Counter and output</h2>
        <p className="character-count approaching">2,950 / 3,000 · Approaching the estimate</p>
        <p className="character-count over">3,120 / 3,000 · Over the estimate</p>
        <label className="field-label" htmlFor="studio-output">
          Output mode
        </label>
        <select id="studio-output">
          <option>Plain text</option>
          <option>Unicode styling</option>
        </select>
        <Notice>
          Unicode styling can be harder for screen readers and search. Plain text keeps ordinary
          characters.
        </Notice>
        <p role="status">Copied! (simulated notification)</p>
      </section>
      <section>
        <h2>Preferences</h2>
        <SettingsPanel settings={settings} onChange={setSettings} />
      </section>
      {dialog && (
        <Modal title="A focused little dialog" onClose={() => setDialog(false)}>
          <p>
            Tab stays inside this dialog. Escape closes it and returns focus to the opening control.
          </p>
          <label className="field-label" htmlFor="example-title">
            Draft title
          </label>
          <input id="example-title" className="text-input" defaultValue="A little thought" />
          <div className="modal-actions">
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setDialog(false)}>
              Save title
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
