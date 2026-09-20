export interface VacationEndlessChapterResult {
  chapter: number;
  title: string;
  content: string;
  englishTitle: string;
  englishContent: string;
}

/**
 * Endless chapter records keep the same chapter number and reward flow as the
 * standard run, but describe the seaside route when the player is on Vacation.
 */
export const getVacationEndlessChapterResult = (
  chapter: number,
  trueEndless = false,
): VacationEndlessChapterResult => {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (trueEndless) {
    return {
      chapter: safeChapter,
      title: `星海航路・真記録 ${String(safeChapter).padStart(2, '0')}：夏の先の朝`,
      content: `星界化した海の異常を越え、${safeChapter}章の航路に残った光を仲間と記録した。夏の旅は終わりではなく、次の季節へ持ち帰る約束になった。`,
      englishTitle: `STARSEA TRUE RECORD ${String(safeChapter).padStart(2, '0')}: Morning Beyond Summer`,
      englishContent: `After crossing the star-touched sea anomaly, we recorded the light left on chapter ${safeChapter}'s route together. The summer journey became a promise to carry into the next season, not an ending.`,
    };
  }
  return {
    chapter: safeChapter,
    title: `海辺の深層記録 ${String(safeChapter).padStart(2, '0')}：潮風の手がかり`,
    content: `第${safeChapter}章の海辺で、旅の途中に残された手がかりを見つけた。波が消す前に仲間と記録し、次の目的地へ進む準備を整えた。`,
    englishTitle: `SEASIDE RECORD ${String(safeChapter).padStart(2, '0')}: A Salt-Wind Clue`,
    englishContent: `On the seaside route of chapter ${safeChapter}, we found a clue left along the journey. We recorded it together before the waves erased it and prepared for the next destination.`,
  };
};
