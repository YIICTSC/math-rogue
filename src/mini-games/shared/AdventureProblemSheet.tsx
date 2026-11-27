import { Suspense, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import { trans } from '../../utils/textUtils';

export default function AdventureProblemSheet({ heading, onClose, ...challenge }: ComponentProps<typeof MiniGameProblemChallenge> & {
  heading: string;
  onClose?: () => void;
}) {
  const language = challenge.languageMode ?? 'JAPANESE';
  const mount = useRef<HTMLSpanElement>(null);
  const [container, setContainer] = useState<HTMLElement>();
  useLayoutEffect(() => {
    const screen = mount.current?.closest<HTMLElement>('[data-adventure-screen]');
    if (screen?.parentElement) setContainer(screen.parentElement);
  }, []);
  const sheet = <section className="absolute inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-slate-950 text-white"
    role="dialog" aria-modal="true" aria-label={heading} data-gamepad-modal data-adventure-problem>
    <header className="flex min-w-0 items-center gap-3 border-b border-cyan-900 px-3 py-1">
      {onClose && <button type="button" className="flex shrink-0 items-center gap-1 rounded border border-cyan-700 px-2 py-1" data-gamepad-back onClick={onClose}>
        <ArrowLeft size={16} />{trans('戻る', language)}
      </button>}
      <h2 className="truncate text-sm font-bold">{heading}</h2>
    </header>
    <div className="relative min-h-0 min-w-0 overflow-auto" data-allow-japanese="true">
      <Suspense fallback={<p role="status" className="p-4 text-center">{trans('読み込み中…', language)}</p>}>
        <MiniGameProblemChallenge {...challenge} />
      </Suspense>
    </div>
  </section>;
  return <><span hidden ref={mount} />{container && createPortal(sheet, container)}</>;
}
