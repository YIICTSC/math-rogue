import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { assetUrl } from '../utils/assetPaths';
import type { UnitBoardSummary, UnitBoardSummaryPage } from '../data/unitBoardSummaries';
import type { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

interface UnitBoardModalProps {
  summary: UnitBoardSummary | null;
  open: boolean;
  onClose: () => void;
  languageMode: LanguageMode;
}

const UnitBoardModal: React.FC<UnitBoardModalProps> = ({ summary, open, onClose, languageMode }) => {
  const [pageIndex, setPageIndex] = React.useState(0);

  React.useEffect(() => {
    if (open) setPageIndex(0);
  }, [open, summary?.id]);

  if (!open || !summary) return null;

  const isNativeEnglishBoard = summary.id.startsWith('NATIVE_');
  const translate = (text: string) => isNativeEnglishBoard || languageMode === 'HIRAGANA'
    ? text
    : trans(text, languageMode);
  const pages: UnitBoardSummaryPage[] = [
    {
      id: 'main',
      label: isNativeEnglishBoard ? 'Overview' : '基本',
      goal: summary.goal,
      points: summary.points,
      mistakes: summary.mistakes,
      example: summary.example,
    },
    ...(summary.pages ?? []),
  ];
  const currentPageIndex = Math.min(pageIndex, pages.length - 1);
  const currentPage = pages[currentPageIndex];
  const hasMultiplePages = pages.length > 1;
  const boardLabel = isNativeEnglishBoard ? 'Board' : translate(summary.grade && summary.grade <= 2 ? 'ばんしょ' : '板書');
  const pageLabel = translate(currentPage.label);
  const goalLabel = isNativeEnglishBoard ? 'Goal' : translate(currentPage.sectionLabels?.goal ?? 'めあて');
  const ideaLabel = isNativeEnglishBoard ? 'Key Ideas' : translate(currentPage.sectionLabels?.points ?? (summary.grade && summary.grade <= 1 ? 'かんがえかた' : '考え方'));
  const mistakesLabel = isNativeEnglishBoard ? 'Common Mistakes' : translate(currentPage.sectionLabels?.mistakes ?? 'よくあるまちがい');
  const exampleLabel = isNativeEnglishBoard ? 'Example' : translate(currentPage.sectionLabels?.example ?? '例');
  const closeLabel = isNativeEnglishBoard ? 'Back to question' : translate(summary.grade && summary.grade <= 2 ? 'もんだいにもどる' : '問題にもどる');
  const closeAriaLabel = isNativeEnglishBoard ? 'Close board' : translate('板書を閉じる');
  const previousLabel = isNativeEnglishBoard ? 'Previous' : translate('前ページ');
  const nextLabel = isNativeEnglishBoard ? 'Next' : translate('次ページ');
  const pageIndicatorLabel = isNativeEnglishBoard
    ? `${currentPageIndex + 1} / ${pages.length}`
    : translate(`${currentPageIndex + 1} / ${pages.length}ページ`);
  const handleClose = (event: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };
  const handlePageChange = (nextIndex: number) => (event: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPageIndex(Math.max(0, Math.min(pages.length - 1, nextIndex)));
  };

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
          onClick={handleClose}
          onPointerUp={handleClose}
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
                {translate(summary.title)}
              </h2>
              <p className="unit-board-subtitle mt-0.5 text-xs font-bold leading-snug text-emerald-100 sm:mt-1 sm:text-sm md:text-base">
                {translate(summary.subtitle)}
                {hasMultiplePages && <span className="ml-2 text-yellow-100/95">[{pageLabel}]</span>}
              </p>
            </div>
          </div>

          <div className="unit-board-content grid grid-cols-1 gap-2 text-left text-xs leading-5 text-emerald-50 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2 md:text-sm md:leading-6 lg:text-base">
            <section>
              <h3 className="unit-board-section-title mb-0.5 text-sm font-black text-yellow-100 sm:mb-1 sm:text-base md:text-lg">{goalLabel}</h3>
              <p>{translate(currentPage.goal)}</p>
            </section>

            <section>
              <h3 className="unit-board-section-title mb-0.5 text-sm font-black text-yellow-100 sm:mb-1 sm:text-base md:text-lg">{ideaLabel}</h3>
              <ul className="space-y-0.5 sm:space-y-1">
                {currentPage.points.map((point) => (
                  <li key={point} className="flex gap-1.5 sm:gap-2">
                    <span className="mt-0.5 text-yellow-100">・</span>
                    <span>{translate(point)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="unit-board-section-title mb-0.5 text-sm font-black text-yellow-100 sm:mb-1 sm:text-base md:text-lg">{mistakesLabel}</h3>
              <ul className="space-y-0.5 sm:space-y-1">
                {currentPage.mistakes.map((mistake) => (
                  <li key={mistake} className="flex gap-1.5 sm:gap-2">
                    <span className="mt-0.5 text-rose-100">・</span>
                    <span>{translate(mistake)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {currentPage.example && (
              <section>
                <h3 className="unit-board-section-title mb-0.5 text-sm font-black text-yellow-100 sm:mb-1 sm:text-base md:text-lg">{exampleLabel}</h3>
                <p>{translate(currentPage.example)}</p>
              </section>
            )}
          </div>
        </div>

        <div className="unit-board-footer absolute bottom-[8%] inset-x-[10%] z-10 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {hasMultiplePages && (
              <>
                <button
                  type="button"
                  onClick={handlePageChange(currentPageIndex - 1)}
                  onPointerUp={handlePageChange(currentPageIndex - 1)}
                  disabled={currentPageIndex === 0}
                  className="rounded-md border-b-4 border-slate-950 bg-slate-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-slate-600 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-45 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {previousLabel}
                </button>
                <span className="whitespace-nowrap rounded bg-black/25 px-2 py-1 text-xs font-black text-yellow-100 sm:text-sm">
                  {pageIndicatorLabel}
                </span>
                <button
                  type="button"
                  onClick={handlePageChange(currentPageIndex + 1)}
                  onPointerUp={handlePageChange(currentPageIndex + 1)}
                  disabled={currentPageIndex >= pages.length - 1}
                  className="rounded-md border-b-4 border-amber-950 bg-amber-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-amber-500 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-45 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {nextLabel}
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            onPointerUp={handleClose}
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
