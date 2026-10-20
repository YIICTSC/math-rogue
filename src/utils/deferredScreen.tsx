import React, { Component, Suspense, useMemo, useState } from 'react';
import type { LanguageMode } from '../types';

const COPY = {
  JAPANESE: { loading: '読み込み中です。通信が混み合っている場合は、このままお待ちください。', failed: '画面を読み込めませんでした。通信を確認して、もう一度お試しください。', retry: 'もう一度試す', reload: '再読み込み' },
  HIRAGANA: { loading: 'よみこみちゅうです。つうしんが こんでいるときは、このまま おまちください。', failed: 'がめんを よみこめませんでした。つうしんを かくにんして、もういちど おためしください。', retry: 'もういちど ためす', reload: 'さいよみこみ' },
  ENGLISH: { loading: 'Loading. Please wait while the connection is busy.', failed: 'This screen could not load. Check your connection and try again.', retry: 'Try again', reload: 'Reload' },
};

function copyFor(mode?: LanguageMode) {
  if (!mode) {
    try { mode = localStorage.getItem('pixel_spire_language_mode_v1') as LanguageMode; } catch { /* Storage may be unavailable. */ }
  }
  return COPY[mode || 'JAPANESE'] || COPY.JAPANESE;
}

export function ScreenLoading({ languageMode }: { languageMode?: LanguageMode }) {
  return <div role="status" className="h-full min-h-48 grid place-content-center gap-4 bg-slate-950 p-6 text-center text-slate-100" aria-live="polite">{copyFor(languageMode).loading}</div>;
}

// Only retry loading failures. Re-running a module that threw an application
// error cannot repair it. Jitter prevents a class from retrying in lockstep.
export async function loadScreen<T>(load: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await load(); } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const workerRetries = typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;
      if (workerRetries || attempt >= 2 || !/fetch|network|loading.*(?:module|chunk)|importing.*module/i.test(message)) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt + Math.random() * 1000));
    }
  }
}

class ScreenBoundary extends Component<{
  children: React.ReactNode;
  languageMode?: LanguageMode;
  retry: () => void;
}, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    const copy = copyFor(this.props.languageMode);
    return <div role="alert" className="h-full min-h-48 grid place-content-center gap-4 bg-slate-950 p-6 text-center text-slate-100">
      <p>{copy.failed}</p>
      <button className="rounded bg-cyan-300 px-6 py-3 text-slate-950" onClick={this.props.retry}>{copy.retry}</button>
      <button className="rounded border border-slate-500 px-6 py-3" onClick={() => window.location.reload()}>{copy.reload}</button>
    </div>;
  }
}

/** Load a selected screen without suspending or discarding the parent game. */
export function deferredScreen<P extends object>(load: () => Promise<{ default: React.ComponentType<P> }>): React.FC<P> {
  return function DeferredScreen(props: P) {
    const [attempt, setAttempt] = useState(0);
    const Screen = useMemo(() => React.lazy(() => loadScreen(load)), [attempt]);
    const languageMode = (props as { languageMode?: LanguageMode }).languageMode;
    return <ScreenBoundary key={attempt} languageMode={languageMode} retry={() => setAttempt(value => value + 1)}>
      <Suspense fallback={<ScreenLoading languageMode={languageMode} />}><Screen {...props} /></Suspense>
    </ScreenBoundary>;
  };
}
