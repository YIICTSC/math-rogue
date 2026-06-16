import React, { useMemo, useState } from 'react';
import { Heart, ChevronRight, Users } from 'lucide-react';
import type { LanguageMode, Player } from '../types';
import { getMagicEndingPages } from '../services/magicEndingService';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';

interface MagicRomanceEndingScreenProps {
  player: Player;
  heroId: string;
  languageMode: LanguageMode;
  onComplete: () => void;
}

const MagicRomanceEndingScreen: React.FC<MagicRomanceEndingScreenProps> = ({
  player,
  heroId,
  languageMode,
  onComplete,
}) => {
  const endings = useMemo(() => getMagicEndingPages(player, heroId), [heroId, player]);
  const [endingIndex, setEndingIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(-1);
  const ending = endings[endingIndex];
  if (!ending) {
    return null;
  }
  const currentText = lineIndex < 0 ? ending.description : ending.lines[lineIndex];
  const isLast = lineIndex >= ending.lines.length - 1;
  const isFinalEnding = endingIndex >= endings.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (isFinalEnding) {
        onComplete();
      } else {
        setEndingIndex((current) => current + 1);
        setLineIndex(-1);
      }
      return;
    }
    setLineIndex((current) => current + 1);
  };

  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-hidden bg-black p-4 text-white sm:p-8">
      <img
        src={assetUrl(ending.imagePath)}
        alt={ending.title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

      <div className="relative z-10 mb-4 w-full max-w-3xl rounded-lg border border-pink-300/60 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-sm sm:mb-8 sm:p-7">
        <div className="mb-3 flex items-center gap-3 border-b border-pink-300/30 pb-3">
          {ending.kind === 'friendship'
            ? <Users className="text-emerald-300" size={22} />
            : <Heart className="text-pink-300" fill="currentColor" size={22} />}
          <div>
            <div className={`text-xs font-bold ${ending.kind === 'friendship' ? 'text-emerald-300' : 'text-pink-300'}`}>
              {trans(ending.rankLabel, languageMode)} / {trans(ending.metricLabel, languageMode)}
              {endings.length > 1 && ` / ${endingIndex + 1} of ${endings.length}`}
            </div>
            <h1 className="text-xl font-black text-pink-100 sm:text-2xl">{trans(ending.title, languageMode)}</h1>
          </div>
        </div>
        <p className="min-h-[7rem] whitespace-pre-wrap text-base leading-relaxed text-slate-100 sm:text-lg">
          {trans(currentText, languageMode)}
        </p>
        <button
          onClick={handleNext}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-pink-400 px-5 py-3 font-black text-slate-950 transition-colors hover:bg-pink-300"
        >
          {trans(isLast ? (isFinalEnding ? '通常エンディングへ' : '次のエンディングへ') : '次へ', languageMode)}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default MagicRomanceEndingScreen;
