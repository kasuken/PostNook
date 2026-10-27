import { Component, lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '../styles/app.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal-error">
          <h1>Your nook needs a moment.</h1>
          <p>
            The editor could not start safely. Your stored drafts have not been replaced. Pending
            edits may not have been saved.
          </p>
          <button type="button" onClick={() => location.reload()}>
            Try opening again
          </button>
        </main>
      );
    return this.props.children;
  }
}
const DevStudio = import.meta.env.DEV ? lazy(() => import('./DevStudio')) : null;
const studio = DevStudio && new URLSearchParams(location.search).has('studio');
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    {studio ? (
      <Suspense fallback={<p>Opening component studio…</p>}>
        <DevStudio />
      </Suspense>
    ) : (
      <App />
    )}
  </ErrorBoundary>,
);
