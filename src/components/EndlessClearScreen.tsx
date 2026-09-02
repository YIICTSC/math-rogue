import React, { useMemo } from 'react';
import { ChevronRight, Home, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { ADDITIONAL_CARDS } from '../constants1';
import { LanguageMode, Card as ICard } from '../types';
import { buildEnglishCardDescription, trans, transEventText } from '../utils/textUtils';
import { getEndlessChapterResult } from '../data/endlessChapterResults';
import Card from './Card';

interface EndlessClearScreenProps {
  languageMode: LanguageMode;
  visualTheme?: 'elementary' | 'high-school' | 'magic';
  newlyUnlockedCardName?: string;
  onReturnToTitle: () => void;
  onEnterTrueEndless: () => void;
}

const EndlessClearScreen: React.FC<EndlessClearScreenProps> = ({
  languageMode,
  visualTheme = 'elementary',
  newlyUnlockedCardName,
  onReturnToTitle,
  onEnterTrueEndless,
}) => {
  const unlockedCard = useMemo(() => {
    if (!newlyUnlockedCardName) return null;
    const cardTemplate = Object.values(ADDITIONAL_CARDS).find(card => card.name === newlyUnlockedCardName);
    return cardTemplate ? ({ ...cardTemplate, id: `endless-clear-${cardTemplate.name}` } as ICard) : null;
  }, [newlyUnlockedCardName]);

  const finalRecord = getEndlessChapterResult(50);
  const finalRecordTitle = languageMode === 'ENGLISH'
    ? finalRecord.englishTitle
    : languageMode === 'HIRAGANA'
      ? transEventText(finalRecord.title, languageMode)
      : finalRecord.title;
  const finalRecordContent = languageMode === 'ENGLISH'
    ? finalRecord.englishContent
    : languageMode === 'HIRAGANA'
      ? transEventText(finalRecord.content, languageMode)
      : finalRecord.content;
  const isMagic = visualTheme === 'magic';
  const accent = isMagic ? 'border-fuchsia-400/70 text-fuchsia-100' : 'border-cyan-400/70 text-cyan-100';
  const panelAccent = isMagic ? 'border-fuchsia-500/45 bg-fuchsia-950/20' : 'border-cyan-500/45 bg-cyan-950/20';

  return (
    <div
      data-gamepad-initial-scope="endless-clear"
      className="ios-edge-to-edge relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#172554_0%,_#09090b_58%,_#000_100%)] p-4 font-mono sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 opacity-15">
        <InfinityIcon className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 text-cyan-300" />
      </div>
      <div data-gamepad-navigation-root className={`relative z-10 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-y-auto rounded-2xl border-2 bg-black/85 p-5 shadow-2xl sm:p-8 ${accent}`}>
        <div className="text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-black tracking-[0.28em] text-amber-300">
            <Sparkles size={16} /> {languageMode === 'ENGLISH' ? 'FINAL RECORD' : languageMode === 'HIRAGANA' ? 'さいしゅう きろく' : '最終記録'} <Sparkles size={16} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tight text-white sm:text-5xl">
            {languageMode === 'ENGLISH' ? 'ENDLESS MODE CLEARED' : languageMode === 'HIRAGANA' ? 'えんどれすもーど くりあ' : 'エンドレスモード クリア'}
          </h1>
          <p className="mt-3 text-sm font-bold leading-7 text-slate-300 sm:text-base">
            {languageMode === 'ENGLISH'
              ? 'You crossed all 50 chapters and reached the true ending. The record can end here—or continue beyond its boundary.'
              : languageMode === 'HIRAGANA'
                ? 'ごじゅっしょうを こえて、しんえんでぃんぐに たどりついた。ここで おわるか、きろくの そとへ すすむかを えらべる。'
                : '全50章を踏破し、真エンディングに到達した。ここで記録を終えるか、その境界の外側へ進むかを選べる。'}
          </p>
        </div>

        <div className={`mt-6 rounded-xl border-2 p-4 text-left ${panelAccent}`}>
          <div className="mb-2 text-center text-xs font-black tracking-[0.2em] text-amber-200">{finalRecordTitle}</div>
          <p className="text-sm leading-7 text-slate-200">{finalRecordContent}</p>
        </div>

        {unlockedCard && (
          <div className="mt-6 rounded-xl border-2 border-yellow-500/50 bg-yellow-600/10 p-4">
            <div className="mb-3 flex items-center justify-center gap-2 text-xs font-black tracking-[0.18em] text-yellow-300">
              <Sparkles size={15} /> {trans('新しいカードを解放！', languageMode)} <Sparkles size={15} />
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <div className="scale-90">
                <Card card={unlockedCard} onClick={() => {}} disabled={false} languageMode={languageMode} />
              </div>
              <div className="max-w-sm text-center sm:text-left">
                <h2 className="text-lg font-black text-white">{trans(unlockedCard.name, languageMode)}</h2>
                <p className="mt-1 text-xs leading-6 text-slate-300">
                  {languageMode === 'ENGLISH' ? buildEnglishCardDescription(unlockedCard) : trans(unlockedCard.description, languageMode)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            data-gamepad-initial-choice
            data-gamepad-zone="endless-clear-actions"
            data-gamepad-order={0}
            onClick={onReturnToTitle}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-500 bg-slate-900 px-4 py-4 text-sm font-black text-slate-100 transition hover:bg-slate-800"
          >
            <Home size={18} />
            {languageMode === 'ENGLISH' ? 'RETURN TO TITLE' : languageMode === 'HIRAGANA' ? 'たいとるへ もどる' : 'タイトルへ戻る'}
          </button>
          <button
            data-gamepad-zone="endless-clear-actions"
            data-gamepad-order={1}
            onClick={onEnterTrueEndless}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-cyan-300 bg-cyan-950/70 px-4 py-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-900"
          >
            <InfinityIcon size={18} />
            {languageMode === 'ENGLISH' ? 'ENTER TRUE ENDLESS' : languageMode === 'HIRAGANA' ? 'しんの えんどれすへ' : '真のエンドレスへ'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndlessClearScreen;
