import { Monitor, Smartphone } from 'lucide-react';
import { IconButton } from '../../components/ui';
// Built only from the serialized output: no LinkedIn assets, images or network requests.
export function PostPreview({
  text,
  mode,
  onMode,
  failed,
}: {
  text: string;
  mode: 'desktop' | 'mobile';
  onMode: (mode: 'desktop' | 'mobile') => void;
  failed?: boolean;
}) {
  return (
    <section className="preview-pane" aria-label="Post preview">
      <div className="preview-controls">
        <span>{mode === 'desktop' ? 'Desktop preview' : 'Mobile preview'}</span>
        <div className="segmented">
          <IconButton
            label="Desktop preview"
            aria-pressed={mode === 'desktop'}
            onClick={() => onMode('desktop')}
          >
            <Monitor size={17} />
          </IconButton>
          <IconButton
            label="Mobile preview"
            aria-pressed={mode === 'mobile'}
            onClick={() => onMode('mobile')}
          >
            <Smartphone size={17} />
          </IconButton>
        </div>
      </div>
      {/* Above the post so it stays in view however long the post is. */}
      <p className="preview-note" id="preview-note">
        LinkedIn may render the pasted post differently. You’ll paste and publish it yourself.
      </p>
      {failed ? (
        <p className="preview-error" role="alert">
          This draft could not be turned into post text, so there is nothing to preview. Your draft
          is unchanged; return to Write to keep editing.
        </p>
      ) : (
        // Focusable so the post can be scrolled with the keyboard.
        <article
          className={`preview-post ${mode}`}
          tabIndex={0}
          aria-label="Post text preview"
          aria-describedby="preview-note"
        >
          <div className="preview-author">
            <div className="avatar" aria-hidden="true">
              Y
            </div>
            <div>
              <strong>Your name</strong>
              <span>Your next post</span>
            </div>
          </div>
          <div className="preview-text" dir="auto">
            {text || 'Your words will appear here.'}
          </div>
        </article>
      )}
    </section>
  );
}
