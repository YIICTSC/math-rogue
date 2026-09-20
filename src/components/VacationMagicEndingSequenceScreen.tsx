import React, { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { LanguageMode } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { getEnvironmentBackgroundPath } from '../data/vacationEnvironmentAssets';

interface Props {
  characterName: string;
  languageMode: LanguageMode;
  onComplete: () => void;
}

const PAGES = [
  {
    title: '星海の夜明け',
    titleHiragana: 'せいかいの よあけ',
    titleEnglish: 'Dawn Over the Star Sea',
    text: '星界化した海は静まり、夜明けの波がリゾートを本来の景色へ戻していった。',
    textHiragana: 'せいかいかした うみは しずまり、よあけの なみが りぞおとを ほんらいの けしきへ もどしていった。',
    textEnglish: 'The star-touched sea grew quiet, and dawn waves returned the resort to its true shape.',
  },
  {
    title: '持ち帰る魔法',
    titleHiragana: 'もちかえる まほう',
    titleEnglish: 'Magic to Bring Home',
    text: '臨海研修で出会った願いと感情は、誰かに封じてもらうものではなく、自分で選び取る魔法になった。',
    textHiragana: 'りんかいけんしゅうで であった ねがいと かんじょうは、だれかに ふうじてもらうものではなく、じぶんで えらびとる まほうになった。',
    textEnglish: 'The wishes and feelings found during the seaside trip became magic to choose for themselves, not something to seal away.',
  },
  {
    title: '帰路の朝',
    titleHiragana: 'きろの あさ',
    titleEnglish: 'Morning on the Way Home',
    text: '夏の旅は終わる。だからこそ、次の海でまた会える約束と、変わり始めた心を胸に帰ることができる。',
    textHiragana: 'なつの たびは おわる。だからこそ、つぎの うみで また あえる やくそくと、かわりはじめた こころを むねに かえることが できる。',
    textEnglish: 'The summer trip ends. That is why they can go home carrying a promise to meet again and hearts that have begun to change.',
  },
] as const;

const VacationMagicEndingSequenceScreen: React.FC<Props> = ({ characterName, languageMode, onComplete }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const page = PAGES[pageIndex];
  const localizedTitle = languageMode === 'ENGLISH' ? page.titleEnglish : languageMode === 'HIRAGANA' ? page.titleHiragana : page.title;
  const localizedText = languageMode === 'ENGLISH' ? page.textEnglish : languageMode === 'HIRAGANA' ? page.textHiragana : page.text;
  const isLast = pageIndex === PAGES.length - 1;
  const fallback = getEnvironmentBackgroundPath('magic', 'actClear', 'VACATION');

  const handleContinue = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setPageIndex(value => value + 1);
  };

  return (
    <div data-gamepad-initial-scope={`magic-vacation-ending-${pageIndex}`} className="themed-ending-sequence relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white">
      <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-black">
        <img src={assetUrl(`sprites/endings/magic-vacation/common/ending-${pageIndex + 1}.webp`)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-md" onError={(event) => { event.currentTarget.src = assetUrl(fallback); }} />
        <img src={assetUrl(`sprites/endings/magic-vacation/common/ending-${pageIndex + 1}.webp`)} alt={localizedTitle} className="relative z-10 h-full w-full object-contain" onError={(event) => { event.currentTarget.src = assetUrl(fallback); }} />
      </div>
      <div data-gamepad-navigation-root className="relative z-10 w-full shrink-0 border-t border-white/25 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-[0.16em] text-cyan-200"><Sparkles size={16} /> {languageMode === 'ENGLISH' ? 'VACATION EPILOGUE' : languageMode === 'HIRAGANA' ? 'ばかんす えぴろおぐ' : 'バカンス終幕'} / {pageIndex + 1} of {PAGES.length}</div>
        <h1 className="text-xl font-black text-white sm:text-3xl">{localizedTitle}</h1>
        <p className="mt-3 max-h-[30dvh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-100 sm:text-lg">{localizedText}</p>
        <p className="mt-3 rounded-lg border border-cyan-200/30 bg-cyan-100/10 px-3 py-2 text-sm font-bold text-cyan-100"><span className="mr-2 text-xs text-cyan-200/75">{characterName}</span>{languageMode === 'ENGLISH' ? 'The next shore is waiting.' : languageMode === 'HIRAGANA' ? 'つぎの うみが まっている。' : '次の海が待っている。'}</p>
        <button type="button" data-gamepad-initial-choice onClick={handleContinue} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 font-black text-slate-950 hover:bg-cyan-200">
          {languageMode === 'ENGLISH' ? (isLast ? 'View results' : 'Next') : languageMode === 'HIRAGANA' ? (isLast ? 'けっかへ' : 'つぎへ') : (isLast ? 'クリア結果へ' : '次へ')}<ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default VacationMagicEndingSequenceScreen;
