import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { LanguageMode } from '../types';
import { getMagicSummerEpilogue, resolveMagicSummerEpilogueHeroId } from '../data/magicSummerEpilogues';
import type { EndlessEndingPage } from '../data/endlessEndingSequences';
import { getEndlessEndingLocalizedTitle, getEndlessEndingLocalizedText, getEndlessEndingLocalizedDialogue } from '../data/endlessEndingSequences';
import { SUMMER_ENDING_VOICES_READY, summerEpilogueVoiceId } from '../data/summerEndingVoices';
import { audioService } from '../services/audioService';
import { assetUrl } from '../utils/assetPaths';

interface Props {
  languageMode: LanguageMode;
  heroId: string;
  pagesOverride?: EndlessEndingPage[];
  onComplete: () => void;
}

const MagicVacationCommonEndingSequenceScreen: React.FC<Props> = ({ languageMode, heroId, pagesOverride, onComplete }) => {
  const pages = useMemo(() => pagesOverride ?? getMagicSummerEpilogue(heroId), [heroId, pagesOverride]);
  const [pageIndex, setPageIndex] = useState(0);
  const completed = useRef(false);
  const page = pages[pageIndex] ?? pages[0];
  const isLast = pageIndex >= pages.length - 1;
  useEffect(() => {
    audioService.stopMagicEventVoices();
    if (SUMMER_ENDING_VOICES_READY) {
      void audioService.playMagicEventVoice(resolveMagicSummerEpilogueHeroId(heroId), summerEpilogueVoiceId(pageIndex)).catch(() => undefined);
    }
    return () => audioService.stopMagicEventVoices();
  }, [heroId, pageIndex]);
  useEffect(() => { setPageIndex(0); completed.current = false; }, [heroId, pagesOverride]);

  const handleContinue = () => {
    if (isLast) {
      if (completed.current) return;
      completed.current = true;
      onComplete();
      return;
    }
    setPageIndex(index => index + 1);
  };

  return (
    <div data-gamepad-initial-scope={`magic-vacation-epilogue-${heroId}-${pageIndex}`} className="summer-epilogue-sequence themed-ending-sequence relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white">
      <div className="themed-ending-sequence-art relative min-h-0 w-full flex-1 overflow-hidden bg-black">
        <img
          key={page.imagePath}
          src={assetUrl(page.imagePath)}
          alt={getEndlessEndingLocalizedTitle(page, languageMode)}
          className="themed-ending-sequence-foreground relative z-10 h-full w-full object-contain"
        />
      </div>
      <div data-gamepad-navigation-root className="themed-ending-sequence-panel relative z-10 w-full shrink-0 border-t border-white/25 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-[0.16em] text-amber-200">
          <Sparkles size={16} /> {languageMode === 'ENGLISH' ? 'Summer Epilogue' : languageMode === 'HIRAGANA' ? 'なつの ごじつだん' : '夏の後日談'} / {pageIndex + 1} of {pages.length}
        </div>
        <h1 className="text-xl font-black text-white sm:text-3xl">{getEndlessEndingLocalizedTitle(page, languageMode)}</h1>
        <div className="themed-ending-sequence-copy min-h-0 overflow-y-auto">
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-100 sm:text-lg">{getEndlessEndingLocalizedText(page, languageMode)}</p>
          <p className="mt-3 border-l-4 border-amber-300/70 pl-3 text-left text-sm font-semibold italic leading-relaxed text-amber-100 sm:text-base">{getEndlessEndingLocalizedDialogue(page, languageMode)}</p>
        </div>
        <button type="button" data-gamepad-initial-choice onClick={handleContinue} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 font-black text-slate-950 hover:bg-amber-200">
          {languageMode === 'ENGLISH' ? (isLast ? 'Continue to results' : 'Next') : languageMode === 'HIRAGANA' ? (isLast ? 'けっかへ' : 'つぎへ') : (isLast ? 'クリア結果へ' : '次へ')}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default MagicVacationCommonEndingSequenceScreen;
