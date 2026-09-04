import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { VisualThemeId } from '../data/visualThemes';
import {
  getEndlessEndingLocalizedDialogue,
  getEndlessEndingLocalizedText,
  getEndlessEndingLocalizedTitle,
  getEndlessEndingSequence,
  getEndlessEndingVoiceHeroId,
  type EndlessEndingKind,
} from '../data/endlessEndingSequences';
import { assetUrl } from '../utils/assetPaths';
import { audioService } from '../services/audioService';

interface Props {
  kind: EndlessEndingKind;
  characterId: string;
  characterName: string;
  languageMode: LanguageMode;
  theme?: VisualThemeId;
  magicProtagonistId?: string;
  onComplete: () => void;
}

const EndlessEndingSequenceScreen: React.FC<Props> = ({ kind, characterId, characterName, languageMode, theme = 'elementary', magicProtagonistId, onComplete }) => {
  const sequence = useMemo(() => getEndlessEndingSequence(kind, characterId, characterName, theme as VisualThemeId, magicProtagonistId), [characterId, characterName, kind, magicProtagonistId, theme]);
  const [pageIndex, setPageIndex] = useState(0);
  const page = sequence.pages[pageIndex];
  const isLast = pageIndex >= sequence.pages.length - 1;
  const voiceName = `endless-${kind.toLowerCase()}-${pageIndex + 1}`;
  const voiceHeroId = getEndlessEndingVoiceHeroId(characterId, theme as VisualThemeId, magicProtagonistId);
  const completionStartedRef = useRef(false);

  useEffect(() => {
    audioService.stopHighSchoolVoices();
    audioService.stopMagicEventVoices();
    if (theme === 'high-school') {
      void audioService.playHighSchoolVoiceFile(voiceHeroId, voiceName, 12000).catch(() => undefined);
    } else if (theme === 'magic') {
      void audioService.playMagicEventVoice(voiceHeroId, voiceName).catch(() => undefined);
    }
    return () => {
      audioService.stopHighSchoolVoices();
      audioService.stopMagicEventVoices();
    };
  }, [characterId, kind, magicProtagonistId, pageIndex, theme, voiceHeroId, voiceName]);

  if (!page) return null;

  const localizedTitle = getEndlessEndingLocalizedTitle(page, languageMode);
  const localizedText = getEndlessEndingLocalizedText(page, languageMode);
  const localizedDialogue = getEndlessEndingLocalizedDialogue(page, languageMode);
  const isTrueEnding = kind === 'TRUE';
  const fallback = isTrueEnding
    ? 'sprites/backgrounds/learning-rogue/high-school-act-clear.webp'
    : 'sprites/backgrounds/learning-rogue/reward-rooftop.webp';
  const useEventLayout = theme === 'high-school' || theme === 'magic';
  const sequenceLabel = isTrueEnding
    ? (languageMode === 'ENGLISH' ? 'TRUE ENDING' : languageMode === 'HIRAGANA' ? 'しんえんでぃんぐ' : '真エンディング')
    : (languageMode === 'ENGLISH' ? 'ENDLESS PROLOGUE' : languageMode === 'HIRAGANA' ? 'おわらない たびの じょしょう' : 'エンドレス序章');
  const eventBackground = theme === 'magic'
    ? 'sprites/backgrounds/learning-rogue/magic-event-hallway.webp'
    : 'sprites/backgrounds/learning-rogue/event-hallway.webp';
  const handleContinue = () => {
    if (!isLast) {
      setPageIndex(index => Math.min(index + 1, sequence.pages.length - 1));
      return;
    }
    if (completionStartedRef.current) return;
    completionStartedRef.current = true;
    onComplete();
  };

  return (
    <div
      data-gamepad-initial-scope={`endless-${kind.toLowerCase()}-${sequence.characterId}-${pageIndex}`}
      className={useEventLayout
        ? 'main-event-screen flex h-full w-full flex-col items-center justify-start overflow-y-auto bg-gray-900 bg-cover bg-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-white relative custom-scrollbar sm:justify-center sm:p-8'
        : 'themed-ending-sequence relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white'}
      style={useEventLayout ? { backgroundImage: `url(${assetUrl(eventBackground)})` } : undefined}
    >
      {useEventLayout && <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />}
      <div
        data-gamepad-navigation-root
        className={useEventLayout
          ? 'event-screen-panel z-10 my-auto w-full max-w-2xl rounded-lg border-2 border-gray-600 bg-gray-800 p-4 shadow-2xl sm:p-8'
          : 'themed-ending-sequence-panel relative z-10 w-full shrink-0 border-t border-white/25 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-sm sm:p-6'}
      >
        {useEventLayout ? (
          <div className="event-screen-title mb-4 flex items-center border-b border-gray-700 pb-3 sm:mb-6 sm:pb-4">
            <div className="mr-3 rounded-full border border-purple-500 bg-purple-900 p-2 sm:mr-4 sm:p-3">
              <Sparkles size={28} className="text-purple-300 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black tracking-[0.16em] text-amber-200">{sequenceLabel} / {pageIndex + 1} of {sequence.pages.length}</div>
              <h2 className="text-2xl font-bold text-purple-100 sm:text-3xl">{localizedTitle}</h2>
            </div>
          </div>
        ) : (
          <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-[0.16em] text-amber-200">
            <Sparkles size={16} /> {sequenceLabel} / {pageIndex + 1} of {sequence.pages.length}
          </div>
        )}

        <div className={useEventLayout
          ? 'event-screen-image relative mx-auto mb-4 aspect-square w-full max-w-[18rem] overflow-hidden rounded-xl border border-purple-400/40 bg-slate-950 sm:mb-6 sm:max-w-[22rem]'
          : 'themed-ending-sequence-art relative min-h-0 w-full flex-1 overflow-hidden bg-black'}>
          {useEventLayout ? (
            <img
              src={assetUrl(page.imagePath)}
              alt={localizedTitle}
              className="absolute inset-0 h-full w-full object-contain"
              onError={(event) => {
                if (event.currentTarget.dataset.fallbackApplied === 'true') return;
                event.currentTarget.dataset.fallbackApplied = 'true';
                event.currentTarget.src = assetUrl(fallback);
              }}
            />
          ) : (
            <>
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
            </>
          )}
        </div>

        {useEventLayout ? (
          <div className="event-screen-description min-h-0 max-h-[36dvh] overflow-y-auto text-sm leading-relaxed text-slate-100 sm:text-base">
            <p className="whitespace-pre-wrap">{localizedText}</p>
            <p className="mt-3 rounded-lg border border-amber-200/30 bg-amber-100/10 px-3 py-2 text-sm font-bold leading-relaxed text-amber-100 sm:text-base">
              <span className="mr-2 text-xs tracking-wide text-amber-200/75">{sequence.characterName}</span>
              {localizedDialogue}
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-black text-white sm:text-3xl">{localizedTitle}</h1>
            <p className="mt-3 max-h-[30dvh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-100 sm:text-lg">{localizedText}</p>
            <p className="mt-3 rounded-lg border border-amber-200/30 bg-amber-100/10 px-3 py-2 text-sm font-bold leading-relaxed text-amber-100 sm:text-base">
              <span className="mr-2 text-xs tracking-wide text-amber-200/75">{sequence.characterName}</span>
              {localizedDialogue}
            </p>
          </>
        )}

        <div className={useEventLayout ? 'event-screen-actions mt-4 flex justify-end' : ''}>
          <button
            type="button"
            data-gamepad-initial-choice
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 font-black text-slate-950 hover:bg-amber-200"
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
    </div>
  );
};

export default EndlessEndingSequenceScreen;
