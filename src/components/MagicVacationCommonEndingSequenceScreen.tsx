import React, { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { LanguageMode } from '../types';
import { MAGIC_VACATION_COMMON_ENDING_PAGES } from '../data/vacationEndingCopy';
import { assetUrl } from '../utils/assetPaths';

interface Props {
  languageMode: LanguageMode;
  onComplete: () => void;
}

const MagicVacationCommonEndingSequenceScreen: React.FC<Props> = ({ languageMode, onComplete }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const page = MAGIC_VACATION_COMMON_ENDING_PAGES[pageIndex] ?? MAGIC_VACATION_COMMON_ENDING_PAGES[0];
  const isLast = pageIndex >= MAGIC_VACATION_COMMON_ENDING_PAGES.length - 1;
  const localized = (value: { ja: string; hira: string; en: string }) => (
    languageMode === 'ENGLISH' ? value.en : languageMode === 'HIRAGANA' ? value.hira : value.ja
  );

  const handleContinue = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setPageIndex(index => index + 1);
  };

  return (
    <div data-gamepad-initial-scope={`magic-vacation-common-ending-${pageIndex}`} className="themed-ending-sequence relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white">
      <div className="themed-ending-sequence-art relative min-h-0 w-full flex-1 overflow-hidden bg-black">
        <img
          src={assetUrl(`sprites/endings/magic-vacation/common/ending-${pageIndex + 1}.webp`)}
          alt={localized(page.title)}
          className="themed-ending-sequence-foreground relative z-10 h-full w-full object-contain"
        />
      </div>
      <div data-gamepad-navigation-root className="themed-ending-sequence-panel relative z-10 w-full shrink-0 border-t border-white/25 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-[0.16em] text-amber-200">
          <Sparkles size={16} /> {languageMode === 'ENGLISH' ? 'Vacation Ending' : languageMode === 'HIRAGANA' ? 'ばかんす えんでぃんぐ' : 'バカンスエンディング'} / {pageIndex + 1} of {MAGIC_VACATION_COMMON_ENDING_PAGES.length}
        </div>
        <h1 className="text-xl font-black text-white sm:text-3xl">{localized(page.title)}</h1>
        <p className="mt-3 max-h-[30dvh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-100 sm:text-lg">{localized(page.description)}</p>
        <p className="mt-3 border-l-4 border-amber-300/70 pl-3 text-left text-sm font-semibold italic leading-relaxed text-amber-100 sm:text-base">{localized(page.dialogue)}</p>
        <button type="button" data-gamepad-initial-choice onClick={handleContinue} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 font-black text-slate-950 hover:bg-amber-200">
          {languageMode === 'ENGLISH' ? (isLast ? 'Continue to results' : 'Next') : languageMode === 'HIRAGANA' ? (isLast ? 'けっかへ' : 'つぎへ') : (isLast ? 'クリア結果へ' : '次へ')}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default MagicVacationCommonEndingSequenceScreen;
