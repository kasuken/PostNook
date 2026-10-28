import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X, Check, CloudOff, CircleAlert, LoaderCircle, PenLine } from 'lucide-react';
import type { SaveStatus } from '../services/autosave';

export function NookMark({ large = false }: { large?: boolean }) {
  return (
    <svg className={large ? 'nook-mark large' : 'nook-mark'} viewBox="0 0 40 44" aria-hidden="true">
      <path d="M5 2h22l8 8v31l-15-7-15 7z" fill="currentColor" />
      <path d="M27 2v9h8" fill="white" opacity=".35" />
      <path
        d="M13 26V14l14 12V14"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Button({
  children,
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button type="button" {...props} className={`button ${variant} ${className}`}>
      {children}
    </button>
  );
}
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      {...props}
      className={`icon-button ${props.className ?? ''}`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? 'modal wide' : 'modal'}
      aria-labelledby={id}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]',
          ),
        ).filter(
          (el) => !el.matches(':disabled') && el.tabIndex >= 0 && el.getClientRects().length > 0,
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <IconButton label="Close dialog" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
const saveLabels: Record<SaveStatus, string> = {
  saved: 'Saved on this device',
  saving: 'Saving…',
  dirty: 'Unsaved changes',
  failed: 'Save failed',
  unavailable: 'Storage unavailable',
  conflict: 'Newer version found',
};
export function SaveIndicator({ status }: { status: SaveStatus }) {
  const Icon =
    status === 'saved'
      ? Check
      : status === 'saving'
        ? LoaderCircle
        : status === 'dirty'
          ? PenLine
          : CloudOff;
  return (
    <span className={`save-indicator ${status}`} role="status" aria-live="polite">
      <Icon size={14} aria-hidden="true" />
      {saveLabels[status]}
    </span>
  );
}
export function Notice({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="notice" role="alert">
      <CircleAlert size={18} aria-hidden="true" />
      <div>
        <p>{children}</p>
        {actions && <div className="notice-actions">{actions}</div>}
      </div>
    </div>
  );
}
