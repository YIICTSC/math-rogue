import React, { useEffect } from 'react';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { DIFFICULTY_CONFIGS } from '../config/difficulty';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

interface DifficultySelectionScreenProps {
  maxUnlockedDifficulty: number;
  onSelectDifficulty: (level: number) => void;
  onBack: () => void;
  languageMode: LanguageMode;
}

const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({
  maxUnlockedDifficulty,
  onSelectDifficulty,
  onBack,
  languageMode,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '0') {
        e.preventDefault();
        onBack();
        return;
      }
      const level = e.key === 'a' ? 10 : Number(e.key);
      if (level >= 1 && level <= 10 && level <= maxUnlockedDifficulty) {
        e.preventDefault();
        onSelectDifficulty(level);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxUnlockedDifficulty, onBack, onSelectDifficulty]);

  return (
    <div className="main-difficulty-screen h-full w-full overflow-y-auto bg-slate-950 p-2 text-white custom-scrollbar sm:p-4">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col py-2 sm:py-6">
        <button
          onClick={onBack}
          className="mb-2 flex w-fit items-center gap-2 rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800 sm:mb-4"
        >
          <ArrowLeft size={16} /> {trans('戻る', languageMode)}
        </button>

        <div className="mb-3 text-center sm:mb-6">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-0.5 text-[10px] font-black text-amber-200 sm:mb-2 sm:px-4 sm:py-1 sm:text-xs">
            <ShieldCheck size={14} /> GAME DIFFICULTY
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">{trans('ゲーム難易度選択', languageMode)}</h1>
          <p className="mt-1 text-xs font-bold leading-snug text-slate-300 sm:mt-2 sm:text-sm">
            {trans('学習問題の難しさとは別に、冒険の厳しさを選びます。クリアすると次の難易度が解禁されます。', languageMode)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {DIFFICULTY_CONFIGS.map(config => {
            const locked = config.level > maxUnlockedDifficulty;
            const features = [
              config.level === 1 ? '' : `敵HP x${config.enemyHpMultiplier.toFixed(2)}`,
              config.scienceRoomChance <= 0 ? '休憩時理科室なし' : `休憩時理科室 ${Math.round(config.scienceRoomChance * 100)}%`,
              config.legacyCardAllowed ? '引継ぎあり' : '引継ぎなし',
              config.cardEraserEnabled ? 'カード消しゴム出現' : '',
              config.removeCostStep > 0 ? `削除費 +${config.removeCostStep}G` : '削除費固定',
            ].filter(Boolean);

            return (
              <button
                key={config.level}
                disabled={locked}
                onClick={() => onSelectDifficulty(config.level)}
                className={`relative rounded-lg border-2 p-3 text-left shadow-lg transition-all sm:p-4 ${
                  locked
                    ? 'border-slate-800 bg-slate-900/60 text-slate-500'
                    : 'selectable-difficulty border-amber-300/80 bg-slate-800 text-white shadow-[0_0_18px_rgba(250,204,21,0.16)] hover:border-amber-200 hover:bg-slate-700'
                }`}
              >
                <div className="mb-2 flex items-center justify-between sm:mb-3">
                  <div>
                    <div className="text-[10px] font-black text-amber-300 sm:text-xs">{trans('難易度', languageMode)} {config.level === 10 ? 'A' : config.level}</div>
                    <div className="text-xl font-black text-white sm:text-2xl">{trans(config.name, languageMode)}</div>
                  </div>
                  {locked ? (
                    <Lock className="text-slate-500" size={24} />
                  ) : (
                    <div className="rounded-full border border-cyan-300 bg-cyan-950 px-2 py-0.5 text-xs font-black text-cyan-100 sm:py-1">
                      {config.level === 10 ? 'A' : config.level}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {features.map(feature => (
                    <span key={feature} className="rounded border border-slate-700 bg-black/30 px-2 py-0.5 text-[10px] font-bold text-slate-200 sm:py-1 sm:text-[11px]">
                      {trans(feature, languageMode)}
                    </span>
                  ))}
                </div>
                {locked && <div className="mt-2 text-[10px] font-bold text-slate-500 sm:mt-3 sm:text-xs">{trans('前の難易度をクリアすると解禁', languageMode)}</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DifficultySelectionScreen;
