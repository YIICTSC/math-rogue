import React, { Component, Suspense, useMemo, useState } from 'react';
import type { LanguageMode } from '../types';

const COPY = {
  JAPANESE: { failed: '画面を読み込めませんでした。通信を確認して、もう一度お試しください。', retry: 'もう一度試す', reload: '再読み込み' },
  HIRAGANA: { failed: 'がめんを よみこめませんでした。つうしんを かくにんして、もういちど おためしください。', retry: 'もういちど ためす', reload: 'さいよみこみ' },
  ENGLISH: { failed: 'This screen could not load. Check your connection and try again.', retry: 'Try again', reload: 'Reload' },
};

function copyFor(mode?: LanguageMode) {
  if (!mode) {
    try { mode = localStorage.getItem('pixel_spire_language_mode_v1') as LanguageMode; } catch { /* Storage may be unavailable. */ }
  }
  return COPY[mode || 'JAPANESE'] || COPY.JAPANESE;
}

// Only retry loading failures. Re-running a module that threw an application
// error cannot repair it. Jitter prevents a class from retrying in lockstep.
export async function loadScreen<T>(load: () => Promise<T>, continueLoading = false): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await load(); } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const workerRetries = typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;
      if ((!continueLoading && (workerRetries || attempt >= 2)) || !/fetch|network|loading.*(?:module|chunk)|importing.*module/i.test(message)) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.min(10000, 1000 * 2 ** Math.min(attempt, 3)) + Math.random() * 1000));
    }
  }
}

class ScreenBoundary extends Component<{
  children: React.ReactNode;
  languageMode?: LanguageMode;
  retry: () => void;
  startup?: boolean;
}, { failed: boolean }> {
  state = { failed: false };
  private timer?: ReturnType<typeof setTimeout>;
  componentDidCatch() {
    if (this.props.startup) {
      window.dispatchEvent(new Event('learning-rogue-startup-waiting'));
      this.timer = setTimeout(this.props.retry, 5000 + Math.random() * 1000);
    }
  }
  componentWillUnmount() { clearTimeout(this.timer); }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.startup) return null;
    const copy = copyFor(this.props.languageMode);
    return <div role="alert" className="h-full min-h-48 grid place-content-center gap-4 bg-slate-950 p-6 text-center text-slate-100">
      <p>{copy.failed}</p>
      <button className="rounded bg-cyan-300 px-6 py-3 text-slate-950" onClick={this.props.retry}>{copy.retry}</button>
      <button className="rounded border border-slate-500 px-6 py-3" onClick={() => window.location.reload()}>{copy.reload}</button>
    </div>;
  }
}

/** Load a selected screen without suspending or discarding the parent game. */
export function deferredScreen<P extends object>(load: () => Promise<{ default: React.ComponentType<P> }>, options: { startup?: boolean } = {}): React.FC<P> {
  // Cache the component outside the mounted wrapper. Even an already-cached
  // import() returns a promise, so recreating React.lazy on each visit made
  // every screen change suspend again for at least one render.
  let loaded: React.ComponentType<P> | undefined;
  const loadAndCache = async () => {
    try {
      const module = await loadScreen(load, options.startup);
      loaded = module.default;
      return module;
    } catch (error) {
      sharedScreen = React.lazy(loadAndCache);
      throw error;
    }
  };
  let sharedScreen = React.lazy(loadAndCache);
  return function DeferredScreen(props: P) {
    const [attempt, setAttempt] = useState(0);
    const LazyScreen = useMemo(() => attempt === 0 ? sharedScreen : React.lazy(loadAndCache), [attempt]);
    const Screen = loaded || LazyScreen;
    const languageMode = (props as { languageMode?: LanguageMode }).languageMode;
    return <ScreenBoundary key={attempt} startup={options.startup} languageMode={languageMode} retry={() => setAttempt(value => value + 1)}>
      {/* index.html owns the only loading screen, shown once during startup. */}
      <Suspense fallback={null}><Screen {...props} /></Suspense>
    </ScreenBoundary>;
  };
}
