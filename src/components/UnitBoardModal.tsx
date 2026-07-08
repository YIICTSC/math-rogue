import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { assetUrl } from '../utils/assetPaths';
import type { UnitBoardSummary } from '../data/unitBoardSummaries';

interface UnitBoardModalProps {
  summary: UnitBoardSummary | null;
  open: boolean;
  onClose: () => void;
}

const UnitBoardModal: React.FC<UnitBoardModalProps> = ({ summary, open, onClose }) => {
  if (!open || !summary) return null;

  const isNativeEnglishBoard = summary.id.startsWith('NATIVE_');
  const boardLabel = isNativeEnglishBoard ? 'Board' : summary.grade && summary.grade <= 2 ? 'ばんしょ' : '板書';
  const goalLabel = isNativeEnglishBoard ? 'Goal' : 'めあて';
  const ideaLabel = isNativeEnglishBoard ? 'Key Ideas' : summary.grade && summary.grade <= 1 ? 'かんがえかた' : '考え方';
  const mistakesLabel = isNativeEnglishBoard ? 'Common Mistakes' : 'よくあるまちがい';
  const exampleLabel = isNativeEnglishBoard ? 'Example' : '例';
  const closeLabel = isNativeEnglishBoard ? 'Back to question' : summary.grade && summary.grade <= 2 ? 'もんだいにもどる' : '問題にもどる';
  const closeAriaLabel = isNativeEnglishBoard ? 'Close board' : '板書を閉じる';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-2 font-mono text-white sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unit-board-title"
        className="unit-board-dialog relative h-[92dvh] w-[96vw] max-w-[1100px] overflow-hidden rounded-lg border-4 border-amber-900/80 shadow-2xl"
        style={{
          backgroundImage: `linear-gradient(rgba(4, 23, 20, 0.34), rgba(4, 23, 20, 0.52)), url(${assetUrl('ui/unit-board-modal.webp')})`,
          backgroundPosition: 'center',
          backgroundSize: '100% 100%',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="unit-board-close absolute right-[6%] top-[5%] z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/35 text-white transition hover:bg-black/55 sm:h-10 sm:w-10"
          aria-label={closeAriaLabel}
        >
          <X size={20} />
        </button>

        <div className="unit-board-scroll absolute inset-x-[8%] bottom-[19%] top-[7%] overflow-y-auto px-1 pr-2 sm:inset-x-[9%] sm:bottom-[18%] sm:top-[8%]">
          <div className="unit-board-header mb-2 flex items-center gap-2 pr-10 sm:mb-3 sm:gap-3">
            <BookOpen className="unit-board-icon shrink-0 text-yellow-100 drop-shadow" size={26} />
            <div className="min-w-0 text-left">
              <div className="unit-board-label text-[10px] font-bold tracking-widest text-yellow-100/90 sm:text-xs">{boardLabel}</div>
              <h2 id="unit-board-title" className="unit-board-title break-words text-xl font-black leading-tight text-white sm:text-2xl md:text-3xl">
                {summary.title}
              </h2>
              <p className="unit-board-subtitle mt-0.5 text-xs font-bold leading-snug text-emerald-100 sm:mt-1 sm:text-sm md:text-base">{summary.subtitle}</p>
            </div>
          </div>

          <div className="unit-board-content grid grid-cols-1 gap-2 text-left text-xs leading-5 text-emerald-50 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2 md:text-sm md:leading-6 lg:text-base">
            <section>
              <h3 className="unit-board-section-title mb-0.5 text-sm font-black text-yellow-100 sm:mb-1 sm:text-base md:text-lg">{goalLabel}</h3>
              <p>{summary.goal}</p>
            </section>

            <section>
              <h3 className="unit-board-section-title mb-0.5 text-sm font-black text-yellow-100 sm:mb-1 sm:text-base md:text-lg">{ideaLabel}</h3>
              <ul className="space-y-0.5 sm:space-y-1">
                {summary.points.map((point) => (
                  <li key={point} className="flex gap-1.5 sm:gap-2">
                    <span className="mt-0.5 text-yellow-100">・</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="unit-board-section-title mb-0.5 text-sm font-black text-yellow-100 sm:mb-1 sm:text-base md:text-lg">{mistakesLabel}</h3>
              <ul className="space-y-0.5 sm:space-y-1">
                {summary.mistakes.map((mistake) => (
                  <li key={mistake} className="flex gap-1.5 sm:gap-2">
                    <span className="mt-0.5 text-rose-100">・</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </section>

            {summary.example && (
              <section>
                <h3 className="unit-board-section-title mb-0.5 text-sm font-black text-yellow-100 sm:mb-1 sm:text-base md:text-lg">{exampleLabel}</h3>
                <p>{summary.example}</p>
              </section>
            )}
          </div>
        </div>

        <div className="unit-board-footer absolute bottom-[8%] right-[10%] z-10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="unit-board-return rounded-md border-b-4 border-emerald-950 bg-emerald-600 px-4 py-1.5 text-xs font-black text-white transition hover:bg-emerald-500 active:translate-y-1 active:border-b-0 sm:px-5 sm:py-2 sm:text-sm"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitBoardModal;
