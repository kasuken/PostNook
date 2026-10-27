import { Moon, Sun, Monitor, ShieldCheck } from 'lucide-react';
import type { Settings } from '../../domain/contracts';
import { Button } from '../../components/ui';
export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  return (
    <div className="settings-content">
      <fieldset>
        <legend>Make yourself at home</legend>
        <p className="muted">Choose the light that feels right.</p>
        <div className="theme-choices">
          {(
            [
              { value: 'system', label: 'System', Icon: Monitor },
              { value: 'light', label: 'Light', Icon: Sun },
              { value: 'dark', label: 'Dark', Icon: Moon },
            ] as const
          ).map(({ value, label, Icon }) => (
            <Button
              key={value}
              aria-pressed={settings.theme === value}
              onClick={() => onChange({ ...settings, theme: value })}
            >
              <Icon size={19} />
              {label}
            </Button>
          ))}
        </div>
      </fieldset>
      <div className="privacy-note">
        <ShieldCheck size={21} aria-hidden="true" />
        <div>
          <strong>Your words stay here.</strong>
          <p>
            No account. No tracking. No connection to LinkedIn. Drafts are saved on this device.
          </p>
        </div>
      </div>
      <p className="muted">
        Removing PostNook or clearing its storage removes your drafts. Keep a separate copy of
        important posts. Backup and sync are not available in this version.
      </p>
      <div className="settings-version">
        <span>PostNook</span>
        <span>Foundation · v0.1.0</span>
      </div>
    </div>
  );
}
