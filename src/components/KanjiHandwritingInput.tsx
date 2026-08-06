import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eraser, Eye, EyeOff, PenLine } from 'lucide-react';
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
const INACTIVITY_TIMEOUT_MS = 6000;
const RECOGNITION_SETTLE_TIMEOUT_MS = 1200;
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
  showTraceGuide?: boolean;
  onSubmit: (answer: string) => void;
}

const KanjiHandwritingInput: React.FC<KanjiHandwritingInputProps> = ({
  expectedAnswer,
  disabled = false,
  languageMode,
  showTraceGuide = false,
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
  const [exactCandidates, setExactCandidates] = useState<string[]>([]);
  const [writtenCharacters, setWrittenCharacters] = useState<string[]>([]);
  const [traceModeEnabled, setTraceModeEnabled] = useState(showTraceGuide);
  const [hasStartedWriting, setHasStartedWriting] = useState(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<number | null>(null);
  const candidateOptionsRef = useRef<string[]>([]);
  const hasStartedWritingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const disabledRef = useRef(disabled);
  const [pointerReleasedVersion, setPointerReleasedVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let restoreCanvasCoordinates: (() => void) | null = null;

    const readCandidates = () => {
      const candidateElements = ['jhr-guess', 'jhr-fuzzy', 'jhr-similarity', 'jhr-slength']
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => Boolean(element));
      if (candidateElements.length === 0) return;

      const extractCandidates = (element: HTMLElement) => {
        const anchors = Array.from(element.querySelectorAll('a'))
          .map((anchor) => anchor.textContent?.trim() || '')
          .filter(Boolean);
        return anchors.length > 0
          ? anchors
          : Array.from(element.textContent || '').filter((character) => !/\s/.test(character));
      };
      const nextCandidates = Array.from(new Set(candidateElements.flatMap(extractCandidates)));
      const exactElement = document.getElementById('jhr-guess');
      const nextExactCandidates = exactElement instanceof HTMLElement ? extractCandidates(exactElement) : [];
      setCandidates(nextCandidates);
      setExactCandidates(nextExactCandidates);
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
  const singleCharacterExactCandidates = Array.from(new Set(
    exactCandidates.filter((candidate) => Array.from(candidate).length === 1),
  ));
  const expectedCharacter = characters[characterIndex] || '';
  const candidateOptions = expectedCharacter && singleCharacterCandidates.includes(expectedCharacter)
    ? [expectedCharacter, ...singleCharacterCandidates.filter((candidate) => candidate !== expectedCharacter)].slice(0, 8)
    : singleCharacterCandidates.slice(0, 8);
  const candidateOptionsKey = candidateOptions.join('\u0000');
  const exactCandidateOptionsKey = singleCharacterExactCandidates.join('\u0000');

  useEffect(() => {
    candidateOptionsRef.current = candidateOptions;
  }, [candidateOptionsKey]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    setTraceModeEnabled(showTraceGuide);
  }, [showTraceGuide]);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const scheduleInactivityTimeout = useCallback(() => {
    clearInactivityTimer();
    const judgeAfterInactivity = () => {
      inactivityTimerRef.current = null;
      if (!hasStartedWritingRef.current || disabledRef.current) return;
      if (!isPointerDownRef.current) {
        // Candidates are intentionally not shown to the learner. If the
        // expected character has not been recognized before the timeout,
        // submit the best recognized candidate (or an empty answer).
        onSubmit(candidateOptionsRef.current[0] || '');
        return;
      }
      // Do not judge while a finger or stylus is still down. Wait again
      // after the stroke is released so the final stroke cannot be cut off.
      inactivityTimerRef.current = window.setTimeout(judgeAfterInactivity, INACTIVITY_TIMEOUT_MS);
    };
    inactivityTimerRef.current = window.setTimeout(judgeAfterInactivity, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, onSubmit]);

  const beginWriting = useCallback(() => {
    if (disabled || !engineReady) return;
    isPointerDownRef.current = true;
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    hasStartedWritingRef.current = true;
    setHasStartedWriting(true);
    scheduleInactivityTimeout();
  }, [disabled, engineReady, scheduleInactivityTimeout]);

  const continueWriting = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.buttons > 0 && hasStartedWritingRef.current) {
      isPointerDownRef.current = true;
      scheduleInactivityTimeout();
    }
  }, [scheduleInactivityTimeout]);

  const finishWritingStroke = useCallback(() => {
    isPointerDownRef.current = false;
    setPointerReleasedVersion((current) => current + 1);
    if (hasStartedWritingRef.current && !disabledRef.current) {
      scheduleInactivityTimeout();
    }
  }, [scheduleInactivityTimeout]);

  const clearCurrentCharacter = useCallback(() => {
    clearInactivityTimer();
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    isPointerDownRef.current = false;
    hasStartedWritingRef.current = false;
    setHasStartedWriting(false);
    window.erase?.();
    setCandidates([]);
    setExactCandidates([]);
  }, [clearInactivityTimer]);

  useEffect(() => () => {
    clearInactivityTimer();
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, [clearInactivityTimer]);

  const advanceWithCandidate = useCallback((candidate: string) => {
    if (!engineReady || disabled || !candidate || characterIndex >= characters.length) return;
    const nextWrittenCharacters = [...writtenCharacters, candidate];
    if (characterIndex >= characters.length - 1) {
      clearCurrentCharacter();
      onSubmit(nextWrittenCharacters.join(''));
      return;
    }
    setWrittenCharacters(nextWrittenCharacters);
    setCharacterIndex((current) => current + 1);
    clearCurrentCharacter();
  }, [characterIndex, characters.length, clearCurrentCharacter, disabled, engineReady, onSubmit, writtenCharacters]);

  // あいまい候補は1画目の途中でも現れるため、自動確定には使わない。
  // 完全一致候補が出て、指・ペンを離してから認識が安定した時だけ進める。
  useEffect(() => {
    if (!engineReady || disabled || !hasStartedWritingRef.current || isPointerDownRef.current || !expectedCharacter || !singleCharacterExactCandidates.includes(expectedCharacter)) return;
    if (autoAdvanceTimerRef.current !== null) return;

    autoAdvanceTimerRef.current = window.setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      advanceWithCandidate(expectedCharacter);
    }, RECOGNITION_SETTLE_TIMEOUT_MS);

    return () => {
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [advanceWithCandidate, disabled, engineReady, exactCandidateOptionsKey, expectedCharacter, pointerReleasedVersion]);

  return (
    <div className="kanji-handwriting-input min-w-0 max-w-full space-y-3 overflow-y-auto rounded-xl border-4 border-cyan-500/70 bg-slate-950/80 p-3 text-left shadow-xl">
      <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 text-sm font-black text-cyan-100">
        <div className="flex shrink-0 items-center" aria-label={trans('手書き', languageMode)}>
          <PenLine size={18} aria-hidden="true" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setTraceModeEnabled((current) => !current)}
            disabled={disabled || !engineReady}
            aria-pressed={traceModeEnabled}
            className="flex shrink-0 items-center gap-1 rounded border border-cyan-300/60 bg-slate-800 px-2 py-1 text-xs font-bold text-cyan-100 transition-colors hover:bg-slate-700 disabled:opacity-40"
          >
            {traceModeEnabled ? <EyeOff size={14} /> : <Eye size={14} />}
            {trans('模写モード', languageMode)}
          </button>
          <button
            type="button"
            id="jhr-clear"
            onClick={clearCurrentCharacter}
            disabled={!engineReady || disabled}
            className="flex shrink-0 items-center gap-1 rounded border border-slate-500 bg-slate-800 px-2 py-1 text-xs font-bold text-slate-100 shadow-lg transition-colors hover:bg-slate-700 disabled:opacity-40"
          >
            <Eraser size={13} /> {trans('消去', languageMode)}
          </button>
        </div>
      </div>
      <div className="kanji-writing-canvas-frame relative mx-auto flex w-full max-w-[420px] min-w-0 justify-center rounded-lg border-2 border-cyan-300/60 bg-white p-2">
        {traceModeEnabled && !disabled && expectedCharacter && (
          <span aria-hidden="true" className="kanji-trace-guide pointer-events-none absolute inset-2 z-20 flex items-center justify-center font-serif">
            {expectedCharacter}
          </span>
        )}
        <canvas
          id="can"
          width="301"
          height="301"
          aria-label={trans('漢字を書く入力欄', languageMode)}
          onPointerDown={beginWriting}
          onPointerMove={continueWriting}
          onPointerUp={finishWritingStroke}
          onPointerCancel={finishWritingStroke}
          className="relative z-10 block aspect-square h-auto w-full max-w-[420px] touch-none cursor-crosshair"
          style={{ background: 'linear-gradient(90deg, transparent 49.7%, #cbd5e1 49.7%, #cbd5e1 50.3%, transparent 50.3%), linear-gradient(0deg, transparent 49.7%, #cbd5e1 49.7%, #cbd5e1 50.3%, transparent 50.3%)' }}
        />
      </div>
      <div className="flex min-w-0 items-start gap-2 text-xs text-slate-300">
        <span className="min-w-0 flex-1">
          {engineError
            ? trans('手書き認識エンジンを読み込めませんでした。通信を確認してください。', languageMode)
            : !engineReady
              ? trans('手書き認識エンジンを準備中…', languageMode)
              : hasStartedWriting
                ? trans('認識中…', languageMode)
                : trans('マスの中に文字を書いてください', languageMode)}
        </span>
      </div>
      <div className="text-center text-[10px] leading-4 text-slate-500">
        {trans('正しく認識すると自動で次へ進みます', languageMode)}{' '}
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
