import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { NonMagicEndingTheme } from '../data/themedEndingSequences';
import { getThemedEndingToneLabel, getThemedEndingVariants, getThemedEndingVoiceHeroId, type ThemedEndingVariant } from '../data/themedEndingSequences';
import { assetUrl } from '../utils/assetPaths';
import { audioService } from '../services/audioService';

interface Props {
  theme: NonMagicEndingTheme;
  characterId: string;
  characterName: string;
  languageMode: LanguageMode;
  variantId?: string;
  onComplete: (variant: ThemedEndingVariant) => void;
}

const ThemedEndingSequenceScreen: React.FC<Props> = ({ theme, characterId, characterName, languageMode, variantId, onComplete }) => {
  const variants = useMemo(() => getThemedEndingVariants(theme, characterId, characterName), [characterId, characterName, theme]);
  const [variantIndex] = useState(() => {
    const requestedIndex = variantId ? variants.findIndex(variant => variant.id === variantId) : -1;
    return requestedIndex >= 0 ? requestedIndex : Math.floor(Math.random() * Math.max(1, variants.length));
  });
  const [pageIndex, setPageIndex] = useState(0);
  const variant = variants[variantIndex] ?? variants[0];
  const page = variant?.pages[pageIndex];
  const endingVoiceName = variant ? `ending-${variant.id}` : undefined;
  const voiceHeroId = getThemedEndingVoiceHeroId(characterId);

  useEffect(() => {
    if (theme !== 'high-school' || pageIndex !== 2 || !endingVoiceName) return undefined;
    void audioService.playHighSchoolVoiceFile(voiceHeroId, endingVoiceName, 12000);
    return () => audioService.stopHighSchoolVoices();
  }, [endingVoiceName, pageIndex, theme, voiceHeroId]);

  if (!variant || !page) return null;

  const isLast = pageIndex >= variant.pages.length - 1;
  const localizedTone = getThemedEndingToneLabel(variant.tone, languageMode);
  const fallback = theme === 'high-school'
    ? 'sprites/backgrounds/learning-rogue/high-school-act-clear.webp'
    : 'sprites/backgrounds/learning-rogue/reward-rooftop.webp';
  const localizedTitle = languageMode === 'ENGLISH' ? page.titleEnglish : languageMode === 'HIRAGANA' ? page.titleHiragana : page.title;
  const localizedText = languageMode === 'ENGLISH' ? page.textEnglish : languageMode === 'HIRAGANA' ? page.textHiragana : page.text;

  return (
    <div data-gamepad-initial-scope={`themed-ending-${variant.id}-${pageIndex}`} className="themed-ending-sequence relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white">
      <div className="themed-ending-sequence-art relative min-h-0 w-full flex-1 overflow-hidden bg-black">
        <img
          src={assetUrl(page.imagePath)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-md"
        />
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
          <Sparkles size={16} /> {languageMode === 'ENGLISH' ? `${localizedTone} Ending` : languageMode === 'HIRAGANA' ? `${localizedTone}えんでぃんぐ` : `${localizedTone}エンディング`} / {pageIndex + 1} of {variant.pages.length}
        </div>
        <h1 className="text-xl font-black text-white sm:text-3xl">{localizedTitle}</h1>
        <p className="mt-3 max-h-[30dvh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-100 sm:text-lg">{localizedText}</p>
        <button
          type="button"
          data-gamepad-initial-choice
          onClick={() => isLast ? onComplete(variant) : setPageIndex(index => index + 1)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 font-black text-slate-950 hover:bg-amber-200"
        >
          {languageMode === 'ENGLISH' ? (isLast ? 'Continue to results' : 'Next') : languageMode === 'HIRAGANA' ? (isLast ? 'けっかへ' : 'つぎへ') : (isLast ? 'クリア結果へ' : '次へ')}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ThemedEndingSequenceScreen;
