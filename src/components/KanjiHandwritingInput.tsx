import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type JhrCanvasPrototype = {
  relMouseCoords?: (this: HTMLCanvasElement, event: MouseEvent) => { x: number; y: number };
};

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
    () => [...expectedAnswer].filter((character) => !/[\s　]/.test(character)),
    [expectedAnswer],
  );
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [writtenCharacters, setWrittenCharacters] = useState<string[]>([]);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let restoreCanvasCoordinates: (() => void) | null = null;

    const readCandidates = () => {
      const candidateElements = ['jhr-guess', 'jhr-fuzzy', 'jhr-similarity', 'jhr-slength']
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => Boolean(element));
      if (candidateElements.length === 0) return;

      const nextCandidates = Array.from(new Set(candidateElements.flatMap((element) => {
        const anchors = Array.from(element.querySelectorAll('a'))
          .map((anchor) => anchor.textContent?.trim() || '')
          .filter(Boolean);
        return anchors.length > 0
          ? anchors
          : Array.from(element.textContent || '').filter((character) => !/\s/.test(character));
      })));
      setCandidates(nextCandidates);
      setSelectedCandidate((current) => current && nextCandidates.includes(current) ? current : nextCandidates[0] || '');
    };

    const initialize = async () => {
      try {
        await loadJhr();
        if (cancelled) return;

        const candidateElements = ['jhr-guess', 'jhr-fuzzy', 'jhr-similarity', 'jhr-slength']
          .map((id) => document.getElementById(id))
          .filter((element): element is HTMLElement => Boolean(element));
        if (candidateElements.length > 0) {
          observer = new MutationObserver(readCandidates);
          candidateElements.forEach((element) => observer?.observe(element, { childList: true, subtree: true, characterData: true }));
        }

        // JHR's original coordinate helper uses event.offsetX/offsetY. Those
        // values are CSS pixels, while the recognizer's canvas is 301 logical
        // pixels and is resized for touch screens. Convert from the rendered
        // rectangle back into the logical canvas before JHR draws the stroke.
        const canvasPrototype = HTMLCanvasElement.prototype as unknown as JhrCanvasPrototype;
        const originalRelMouseCoords = canvasPrototype.relMouseCoords;
        canvasPrototype.relMouseCoords = function (this: HTMLCanvasElement, event: MouseEvent) {
          const rect = this.getBoundingClientRect();
          const scaleX = rect.width > 0 ? this.width / rect.width : 1;
          const scaleY = rect.height > 0 ? this.height / rect.height : 1;
          return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY,
          };
        };
        restoreCanvasCoordinates = () => {
          canvasPrototype.relMouseCoords = originalRelMouseCoords;
        };

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
      restoreCanvasCoordinates?.();
    };
  }, []);

  const singleCharacterCandidates = Array.from(new Set(
    candidates.filter((candidate) => Array.from(candidate).length === 1),
  ));
  const expectedCharacter = characters[characterIndex] || '';
  const candidateOptions = expectedCharacter && singleCharacterCandidates.includes(expectedCharacter)
    ? [expectedCharacter, ...singleCharacterCandidates.filter((candidate) => candidate !== expectedCharacter)].slice(0, 8)
    : singleCharacterCandidates.slice(0, 8);
  const candidateOptionsKey = candidateOptions.join('\u0000');
  const canAdvance = engineReady && !disabled && Boolean(selectedCandidate) && characterIndex < characters.length;

  const clearCurrentCharacter = useCallback(() => {
    window.erase?.();
    setCandidates([]);
    setSelectedCandidate('');
  }, []);

  const advanceWithCandidate = useCallback((candidate: string) => {
    if (!engineReady || disabled || !candidate || characterIndex >= characters.length) return;
    const nextWrittenCharacters = [...writtenCharacters, candidate];
    if (characterIndex >= characters.length - 1) {
      onSubmit(nextWrittenCharacters.join(''));
      return;
    }
    setWrittenCharacters(nextWrittenCharacters);
    setCharacterIndex((current) => current + 1);
    clearCurrentCharacter();
  }, [characterIndex, characters.length, clearCurrentCharacter, disabled, engineReady, onSubmit, writtenCharacters]);

  // 認識候補に現在の正答が含まれていれば、候補選択と次の文字への移動を自動化する。
  // 候補が一瞬で切り替わる認識エンジンのため、短い待ち時間を置いてから確定する。
  useEffect(() => {
    if (!engineReady || disabled || !expectedCharacter || !candidateOptions.includes(expectedCharacter)) return;
    if (autoAdvanceTimerRef.current !== null) return;

    autoAdvanceTimerRef.current = window.setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      advanceWithCandidate(expectedCharacter);
    }, 140);

    return () => {
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [advanceWithCandidate, candidateOptionsKey, disabled, engineReady, expectedCharacter]);

  const advance = () => {
    if (!canAdvance) return;
    advanceWithCandidate(selectedCandidate);
  };

  return (
    <div className="kanji-handwriting-input min-w-0 max-w-full space-y-3 overflow-y-auto rounded-xl border-4 border-cyan-500/70 bg-slate-950/80 p-3 text-left shadow-xl">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-black text-cyan-100">
        <PenLine size={18} />
        {trans('答えを1文字ずつ手書き', languageMode)}
      </div>
      <div className="flex min-w-0 justify-center rounded-lg border-2 border-cyan-300/60 bg-white p-2">
        <canvas
          id="can"
          width="301"
          height="301"
          aria-label={trans('漢字を書く入力欄', languageMode)}
          className="block aspect-square h-auto w-full max-w-[420px] touch-none cursor-crosshair"
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
