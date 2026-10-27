import { FileText, Plus, Check } from 'lucide-react';
import type { Draft } from '../../domain/contracts';
import { Button } from '../../components/ui';
export function DraftList({
  drafts,
  activeId,
  onSelect,
  onCreate,
}: {
  drafts: Draft[];
  activeId?: string;
  onSelect: (draft: Draft) => void;
  onCreate: () => void;
}) {
  return (
    <>
      <p className="muted">Little beginnings. Future conversations.</p>
      <div className="draft-list">
        {drafts.map((d) => (
          <button
            type="button"
            className="draft-row"
            key={d.id}
            onClick={() => onSelect(d)}
            aria-current={d.id === activeId ? 'true' : undefined}
          >
            <FileText size={20} aria-hidden="true" />
            <span>
              <strong>{d.title || 'Untitled Post'}</strong>
              <small>
                {new Intl.DateTimeFormat(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date(d.updatedAt))}
              </small>
            </span>
            {d.id === activeId && <Check size={16} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <Button className="full-width" onClick={onCreate}>
        <Plus size={17} />
        New draft
      </Button>
    </>
  );
}
