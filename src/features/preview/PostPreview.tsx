import { Monitor, Smartphone } from 'lucide-react';
import { IconButton } from '../../components/ui';
export function PostPreview({
  text,
  mode,
  onMode,
}: {
  text: string;
  mode: 'desktop' | 'mobile';
  onMode: (mode: 'desktop' | 'mobile') => void;
}) {
  return (
    <section className="preview-pane" aria-label="Post preview">
      <div className="preview-controls">
        <span>Preview your words</span>
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
      <div className={`preview-post ${mode}`}>
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
      </div>
      <p className="preview-note">
        A text preview, not an exact LinkedIn rendering.
        <br />
        You’ll paste and publish the post yourself.
      </p>
    </section>
  );
}
