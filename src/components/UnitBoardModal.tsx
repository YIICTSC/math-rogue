import React from 'react';
import { BookOpen, Lightbulb, PencilLine, Sigma, Target, TriangleAlert, X } from 'lucide-react';
import { assetUrl } from '../utils/assetPaths';
import type { UnitBoardSummary, UnitBoardSummaryPage } from '../data/unitBoardSummaries';
import { buildUnitBoardTeachingContent } from '../data/unitBoardTeaching';
import { limitUnitBoardKanjiByGrade } from '../data/unitBoardGradeKanji.generated';
import { normalizeUnitBoardHiragana, repairUnitBoardHiraganaArtifacts } from '../data/unitBoardHiragana.generated';
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
  const keepJapaneseBoard = languageMode === 'ENGLISH' && !isNativeEnglishBoard;
  const translate = (text: string) => {
    if (isNativeEnglishBoard) return text;
    const boardText = limitUnitBoardKanjiByGrade(
      repairUnitBoardHiraganaArtifacts(text),
      summary.grade,
      summary.id,
    );
    if (keepJapaneseBoard) return boardText;
    const translated = languageMode === 'HIRAGANA'
      ? trans(normalizeUnitBoardHiragana(boardText), 'HIRAGANA')
      : trans(boardText, languageMode);
    return repairUnitBoardHiraganaArtifacts(translated);
  };
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
  const teaching = buildUnitBoardTeachingContent(summary, currentPage);
  const boardSubject = teaching.subject;
  const ruleLines = teaching.ruleLines;
  const workedExampleLines = teaching.workedExampleSteps;
  const boardLabel = isNativeEnglishBoard ? 'Board' : translate(summary.grade && summary.grade <= 2 ? 'ばんしょ' : '板書');
  const pageLabel = translate(currentPage.label);
  const goalLabel = isNativeEnglishBoard ? 'Goal' : translate(currentPage.sectionLabels?.goal ?? 'めあて');
  const ideaLabel = isNativeEnglishBoard ? 'How to Think' : translate(currentPage.sectionLabels?.points ?? (summary.grade && summary.grade <= 1 ? 'かんがえるじゅんばん' : '考える順番'));
  const mistakesLabel = isNativeEnglishBoard ? 'Watch Out' : translate(currentPage.sectionLabels?.mistakes ?? (summary.grade && summary.grade <= 2 ? 'ここにちゅうい' : 'ここに注意'));
  const exampleLabel = isNativeEnglishBoard ? 'Worked Example' : translate(currentPage.sectionLabels?.example ?? (summary.grade && summary.grade <= 2 ? 'れいだい・たしかめ' : '例題・たしかめ'));
  const ruleLabel = (() => {
    if (isNativeEnglishBoard) return 'Rule / Pattern';
    if (summary.grade && summary.grade <= 1) return translate('たいせつなきまり');
    switch (boardSubject) {
      case 'math': return translate('公式・きまり');
      case 'english': return translate('文の形・きまり');
      case 'science': return translate('しくみ・きまり');
      case 'social': return translate('大事なつながり');
      case 'language': return translate('読み方・書き方のコツ');
      case 'life': return translate('見つけるポイント');
      default: return translate('大事なポイント');
    }
  })();
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
    <div data-gamepad-modal data-gamepad-navigation-root data-gamepad-initial-scope={`unit-board-${summary.id}`} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-2 font-mono text-white sm:p-4">
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
          data-gamepad-back
          data-gamepad-initial-choice
          data-gamepad-zone="unit-board-close"
          data-gamepad-order={0}
          data-gamepad-down-zone={hasMultiplePages ? 'unit-board-pages' : 'unit-board-return'}
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

          <div className="unit-board-content space-y-3 text-left text-xs leading-5 text-emerald-50 md:text-sm md:leading-6 lg:text-base">
            <section className="unit-board-goal border-b border-dashed border-yellow-100/35 pb-2">
              <h3 className="unit-board-section-title mb-1 flex items-center gap-2 text-sm font-black text-yellow-100 sm:text-base md:text-lg">
                <Target className="unit-board-section-icon" size={18} />
                {goalLabel}
              </h3>
              <p className="pl-0.5 font-bold text-white">{translate(currentPage.goal)}</p>
            </section>

            <div className="unit-board-main-grid grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] sm:gap-4">
              <section className="unit-board-thinking min-w-0">
                <h3 className="unit-board-section-title mb-1.5 flex items-center gap-2 text-sm font-black text-yellow-100 sm:text-base md:text-lg">
                  <Lightbulb className="unit-board-section-icon" size={18} />
                  {ideaLabel}
                </h3>
                <ol className="unit-board-thinking-list space-y-1.5">
                  {teaching.thinkingSteps.map((point, index) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="unit-board-step-number mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-yellow-100/60 px-1 text-[10px] font-black leading-none text-yellow-100 sm:h-6 sm:min-w-6 sm:text-xs">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">{translate(point)}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="unit-board-rule min-w-0 border-2 border-yellow-100/45 bg-black/20 px-3 py-2 shadow-inner sm:px-4 sm:py-3">
                <h3 className="unit-board-section-title mb-1.5 flex items-center gap-2 text-sm font-black text-yellow-100 sm:text-base md:text-lg">
                  <Sigma className="unit-board-section-icon" size={18} />
                  {ruleLabel}
                </h3>
                <div className="space-y-1.5">
                  {ruleLines.map((rule) => (
                    <p key={rule} className="unit-board-rule-line font-black leading-snug text-white">
                      {translate(rule)}
                    </p>
                  ))}
                </div>
              </section>
            </div>

            {workedExampleLines.length > 0 && (
              <section className="unit-board-example border-l-4 border-cyan-100/55 bg-black/15 px-3 py-2 sm:px-4 sm:py-3">
                <h3 className="unit-board-section-title mb-1 flex items-center gap-2 text-sm font-black text-cyan-50 sm:text-base md:text-lg">
                  <PencilLine className="unit-board-section-icon" size={18} />
                  {exampleLabel}
                </h3>
                <div className="unit-board-example-lines space-y-0.5 font-bold text-white">
                  {workedExampleLines.map((line, index) => (
                    <p key={line} className="flex items-start gap-2">
                      <span className="text-cyan-100">{index === 0 ? '▶' : '→'}</span>
                      <span>{translate(line)}</span>
                    </p>
                  ))}
                </div>
              </section>
            )}

            <section className="unit-board-mistakes border-t border-dashed border-rose-100/35 pt-2">
              <h3 className="unit-board-section-title mb-1 flex items-center gap-2 text-sm font-black text-rose-100 sm:text-base md:text-lg">
                <TriangleAlert className="unit-board-section-icon" size={18} />
                {mistakesLabel}
              </h3>
              <ul className="space-y-0.5 sm:space-y-1">
                {currentPage.mistakes.map((mistake) => (
                  <li key={mistake} className="flex gap-2">
                    <span className="text-rose-100">※</span>
                    <span>{translate(mistake)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="unit-board-footer absolute bottom-[8%] inset-x-[10%] z-10 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {hasMultiplePages && (
              <>
                <button
                  type="button"
                  data-gamepad-zone="unit-board-pages"
                  data-gamepad-order={0}
                  data-gamepad-up-zone="unit-board-close"
                  data-gamepad-down-zone="unit-board-return"
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
                  data-gamepad-zone="unit-board-pages"
                  data-gamepad-order={1}
                  data-gamepad-up-zone="unit-board-close"
                  data-gamepad-down-zone="unit-board-return"
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
            data-gamepad-zone="unit-board-return"
            data-gamepad-order={0}
            data-gamepad-up-zone={hasMultiplePages ? 'unit-board-pages' : 'unit-board-close'}
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
