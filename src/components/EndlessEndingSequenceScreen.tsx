import React, { useMemo, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { LanguageMode } from '../types';
import {
  getEndlessEndingLocalizedText,
  getEndlessEndingLocalizedTitle,
  getEndlessEndingSequence,
  type EndlessEndingKind,
} from '../data/endlessEndingSequences';
import { assetUrl } from '../utils/assetPaths';

interface Props {
  kind: EndlessEndingKind;
  characterId: string;
  characterName: string;
  languageMode: LanguageMode;
  onComplete: () => void;
}

const EndlessEndingSequenceScreen: React.FC<Props> = ({ kind, characterId, characterName, languageMode, onComplete }) => {
  const sequence = useMemo(() => getEndlessEndingSequence(kind, characterId, characterName), [characterId, characterName, kind]);
  const [pageIndex, setPageIndex] = useState(0);
  const page = sequence.pages[pageIndex];
  const isLast = pageIndex >= sequence.pages.length - 1;
  if (!page) return null;

  const localizedTitle = getEndlessEndingLocalizedTitle(page, languageMode);
  const localizedText = getEndlessEndingLocalizedText(page, languageMode);
  const isTrueEnding = kind === 'TRUE';
  const fallback = isTrueEnding
    ? 'sprites/backgrounds/learning-rogue/high-school-act-clear.webp'
    : 'sprites/backgrounds/learning-rogue/reward-rooftop.webp';

  return (
    <div data-gamepad-initial-scope={`endless-${kind.toLowerCase()}-${sequence.characterId}-${pageIndex}`} className="themed-ending-sequence relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white">
      <div className="themed-ending-sequence-art relative min-h-0 w-full flex-1 overflow-hidden bg-black">
        <img src={assetUrl(page.imagePath)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-md" />
        <img
          src={assetUrl(page.imagePath)}
          alt={localizedTitle}
          className="themed-ending-sequence-foreground relative z-10 h-full w-full object-contain"
          onError={(event) => {
            if (event.currentTarget.dataset.fallbackApplied === 'true') return;
            event.currentTarget.dataset.fallbackApplied = 'true';
            event.currentTarget.src = assetUrl(fallback);
          }}
        />
      </div>
      <div data-gamepad-navigation-root className="themed-ending-sequence-panel relative z-10 w-full shrink-0 border-t border-white/25 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-[0.16em] text-amber-200">
          <Sparkles size={16} />
          {isTrueEnding
            ? (languageMode === 'ENGLISH' ? 'TRUE ENDING' : languageMode === 'HIRAGANA' ? 'しんえんでぃんぐ' : '真エンディング')
            : (languageMode === 'ENGLISH' ? 'ENDLESS PROLOGUE' : languageMode === 'HIRAGANA' ? 'おわらない たびの じょしょう' : 'エンドレス序章')}
          {' / '}{pageIndex + 1} of {sequence.pages.length}
        </div>
        <h1 className="text-xl font-black text-white sm:text-3xl">{localizedTitle}</h1>
        <p className="mt-3 max-h-[30dvh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-100 sm:text-lg">{localizedText}</p>
        <button
          type="button"
          data-gamepad-initial-choice
          onClick={() => isLast ? onComplete() : setPageIndex(index => index + 1)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 font-black text-slate-950 hover:bg-amber-200"
        >
          {languageMode === 'ENGLISH'
            ? (isLast ? (isTrueEnding ? 'View results' : 'Enter endless mode') : 'Next')
            : languageMode === 'HIRAGANA'
              ? (isLast ? (isTrueEnding ? 'けっかを みる' : 'えんどれすへ') : 'つぎへ')
              : (isLast ? (isTrueEnding ? '結果を見る' : 'エンドレスへ') : '次へ')}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default EndlessEndingSequenceScreen;
