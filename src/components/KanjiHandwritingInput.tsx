import React, { useEffect, useMemo, useState } from 'react';
import { Eraser, PenLine } from 'lucide-react';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

declare global {
  interface Window {
    jhr_init?: () => void;
    erase?: () => void;
  }
}

const JHR_SCRIPT_ID = 'learning-rogue-jlect-jhr';
const JHR_SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/ZacharyRead/jlect-jhr@master/jlect-jhr.full.js';
let jhrLoader: Promise<void> | null = null;

const loadJhr = () => {
  if (window.jhr_init) return Promise.resolve();
  if (jhrLoader) return jhrLoader;

  jhrLoader = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(JHR_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('JLect JHR failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = JHR_SCRIPT_ID;
    script.src = JHR_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('JLect JHR failed to load'));
    document.head.appendChild(script);
  });
  return jhrLoader;
};

interface KanjiHandwritingInputProps {
  expectedAnswer: string;
  disabled?: boolean;
  languageMode: LanguageMode;
  onSubmit: (answer: string) => void;
}

const KanjiHandwritingInput: React.FC<KanjiHandwritingInputProps> = ({
  expectedAnswer,
  disabled = false,
  languageMode,
  onSubmit,
}) => {
  const characters = useMemo(
    () => Array.from(expectedAnswer).filter((character) => !/[\s　]/.test(character)),
    [expectedAnswer],
  );
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [writtenCharacters, setWrittenCharacters] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const readCandidates = () => {
      const guessElement = document.getElementById('jhr-guess');
      if (!guessElement) return;
      const anchors = Array.from(guessElement.querySelectorAll('a'))
        .map((element) => element.textContent?.trim() || '')
        .filter(Boolean);
      const fallback = anchors.length > 0
        ? anchors
        : Array.from(guessElement.textContent || '').filter(Boolean);
      const nextCandidates = Array.from(new Set(fallback));
      setCandidates(nextCandidates);
      setSelectedCandidate((current) => current && nextCandidates.includes(current) ? current : nextCandidates[0] || '');
    };

    const initialize = async () => {
      try {
        await loadJhr();
        if (cancelled) return;

        const guessElement = document.getElementById('jhr-guess');
        if (guessElement) {
          observer = new MutationObserver(readCandidates);
          observer.observe(guessElement, { childList: true, subtree: true, characterData: true });
        }
        window.jhr_init?.();
        // The recognizer keeps its stroke history globally. Clear it whenever
        // the writing screen is mounted so the previous problem cannot leak in.
        window.erase?.();
        readCandidates();
        setEngineReady(true);
      } catch {
        if (!cancelled) setEngineError(true);
      }
    };

    initialize();
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  const candidateOptions = candidates.filter((candidate) => Array.from(candidate).length === 1).slice(0, 8);
  const canAdvance = engineReady && !disabled && Boolean(selectedCandidate) && characterIndex < characters.length;

  const clearCurrentCharacter = () => {
    window.erase?.();
    setCandidates([]);
    setSelectedCandidate('');
  };

  const advance = () => {
    if (!canAdvance) return;
    const nextWrittenCharacters = [...writtenCharacters, selectedCandidate];
    if (characterIndex >= characters.length - 1) {
      onSubmit(nextWrittenCharacters.join(''));
      return;
    }
    setWrittenCharacters(nextWrittenCharacters);
    setCharacterIndex((current) => current + 1);
    clearCurrentCharacter();
  };

  return (
    <div className="space-y-3 rounded-xl border-4 border-cyan-500/70 bg-slate-950/80 p-3 text-left shadow-xl">
      <div className="flex items-center gap-2 text-sm font-black text-cyan-100">
        <PenLine size={18} />
        {trans('答えを1文字ずつ手書き', languageMode)}
      </div>
      <div className="flex items-center justify-between text-xs font-bold text-cyan-100">
        <span>{characterIndex + 1} / {Math.max(characters.length, 1)} {trans('文字目', languageMode)}</span>
        {writtenCharacters.length > 0 && <span className="text-slate-400">{writtenCharacters.join('')}</span>}
      </div>
      <div className="flex justify-center rounded-lg border-2 border-cyan-300/60 bg-white p-2">
        <canvas
          id="can"
          width="301"
          height="301"
          aria-label={trans('漢字を書く入力欄', languageMode)}
          className="h-[min(82vw,420px)] w-[min(82vw,420px)] touch-none cursor-crosshair"
          style={{ background: 'linear-gradient(90deg, transparent 49.7%, #cbd5e1 49.7%, #cbd5e1 50.3%, transparent 50.3%), linear-gradient(0deg, transparent 49.7%, #cbd5e1 49.7%, #cbd5e1 50.3%, transparent 50.3%)' }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
        <span>
          {engineError
            ? trans('手書き認識エンジンを読み込めませんでした。通信を確認してください。', languageMode)
            : !engineReady
              ? trans('手書き認識エンジンを準備中…', languageMode)
              : candidateOptions.length > 0
                ? trans('候補を選んでください', languageMode)
                : trans('マスの中に文字を書いてください', languageMode)}
        </span>
        <button type="button" id="jhr-clear" onClick={clearCurrentCharacter} disabled={!engineReady || disabled} className="flex shrink-0 items-center gap-1 rounded border border-slate-500 bg-slate-800 px-2 py-1 font-bold text-slate-100 disabled:opacity-40">
          <Eraser size={13} /> {trans('消去', languageMode)}
        </button>
      </div>
      {candidateOptions.length > 0 && (
        <div className="grid grid-cols-4 gap-2" aria-label={trans('認識候補', languageMode)}>
          {candidateOptions.map((candidate, index) => (
            <button
              key={`${candidate}-${index}`}
              type="button"
              onClick={() => setSelectedCandidate(candidate)}
              disabled={disabled}
              className={`rounded-lg border-2 py-2 text-2xl font-black text-slate-950 transition-colors ${selectedCandidate === candidate ? 'border-yellow-300 bg-yellow-300' : 'border-slate-300 bg-white hover:border-cyan-500'}`}
            >
              {candidate}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={advance}
        disabled={!canAdvance}
        className="w-full rounded-lg border-b-4 border-cyan-950 bg-cyan-700 py-3 text-xl font-bold transition-all hover:bg-cyan-600 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {characterIndex >= characters.length - 1 ? trans('決定', languageMode) : trans('次の文字', languageMode)}
      </button>
      <div className="text-center text-[10px] leading-4 text-slate-500">
        {trans('漢字・熟語・送り仮名を、1文字ずつ手書き認識して答え全体を判定します。', languageMode)}{' '}
        <a href="https://github.com/ZacharyRead/jlect-jhr" target="_blank" rel="noreferrer" className="underline hover:text-cyan-300">JLect JHR</a>
      </div>
      <div className="hidden" aria-hidden="true">
        <div id="jhr-guess" />
        <div id="jhr-slength" />
        <div id="jhr-fuzzy" />
        <div id="jhr-similarity" />
        <div id="jhr-wrongorder" />
        <div id="jhr-angles" />
        <div id="jhr-direction" />
        <div id="jhr-overlap" />
        <div id="jhr-saver" />
      </div>
    </div>
  );
};

export default KanjiHandwritingInput;
