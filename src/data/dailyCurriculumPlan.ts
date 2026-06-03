import type { SubjectCategoryType } from '../subjectConfig';

export type CurriculumCategoryId = SubjectCategoryType | 'KANJI';

export interface CurriculumWeekPlan {
  categoryId: CurriculumCategoryId;
  unitOffset: number;
  label: string;
}

const repeatWeek = (
  categoryId: CurriculumCategoryId,
  unitOffset: number,
  label: string,
  weeks: number,
): CurriculumWeekPlan[] => Array.from({ length: weeks }, () => ({ categoryId, unitOffset, label }));

const fitYear = (weeks: CurriculumWeekPlan[]) => {
  const fallback = weeks[weeks.length - 1] || { categoryId: 'SUMMARY', unitOffset: 0, label: '総まとめ' };
  return Array.from({ length: 52 }, (_, index) => weeks[index] || fallback);
};

const kanji = (grade: number, label = '漢字 新出漢字・語彙') => repeatWeek('KANJI', 0, label, grade <= 2 ? 1 : 2);
const summerReview = (label: string) => [
  ...repeatWeek('SUMMARY', 0, `${label} 夏休み前の復習`, 2),
  ...repeatWeek('SUMMARY', 0, `${label} 夏休み復習`, 2),
  ...repeatWeek('SUMMARY', 0, `${label} 2学期の予習`, 1),
];

const grade1Plan = fitYear([
  ...repeatWeek('MATH_GRADES', 0, '算数 なかまづくりとかず', 3),
  ...repeatWeek('KOKUGO_GRADES', 0, '国語 ひらがな', 2),
  ...repeatWeek('MATH_GRADES', 1, '算数 いくつといくつ', 3),
  ...kanji(1),
  ...repeatWeek('LIFE', 0, '生活 学校たんけん', 2),
  ...repeatWeek('MATH_GRADES', 2, '算数 たし算のはじめ', 3),
  ...repeatWeek('KOKUGO_GRADES', 1, '国語 ことばあつめ', 1),
  ...repeatWeek('MATH_GRADES', 3, '算数 ひき算のはじめ', 3),
  ...summerReview('小1'),
  ...repeatWeek('MATH_GRADES', 4, '算数 10より大きい数', 3),
  ...repeatWeek('KOKUGO_GRADES', 2, '国語 のばす音', 1),
  ...repeatWeek('LIFE', 1, '生活 秋のくらし', 2),
  ...repeatWeek('MATH_GRADES', 5, '算数 かたち', 2),
  ...repeatWeek('MATH_GRADES', 6, '算数 時計', 2),
  ...repeatWeek('KOKUGO_GRADES', 5, '国語 かたかな', 1),
  ...repeatWeek('MATH_GRADES', 7, '算数 20までの計算', 3),
  ...repeatWeek('LIFE', 2, '生活 冬・成長', 2),
  ...repeatWeek('MATH_GRADES', 8, '算数 たし算・ひき算まとめ', 3),
  ...repeatWeek('KOKUGO_GRADES', 10, '国語 文を書く', 1),
  ...repeatWeek('SUMMARY', 0, '小1 総まとめ', 4),
]);

const grade2Plan = fitYear([
  ...repeatWeek('MATH_GRADES', 0, '算数 表とグラフ', 2),
  ...repeatWeek('KOKUGO_GRADES', 0, '国語 かたかなのことば', 1),
  ...repeatWeek('MATH_GRADES', 1, '算数 たし算のひっ算', 3),
  ...kanji(2, '漢字 2年生の新出漢字'),
  ...repeatWeek('MATH_GRADES', 2, '算数 ひき算のひっ算', 3),
  ...repeatWeek('KOKUGO_GRADES', 1, '国語 主語と述語', 1),
  ...repeatWeek('LIFE', 0, '生活 春・夏の町たんけん', 2),
  ...repeatWeek('MATH_GRADES', 3, '算数 長さ', 3),
  ...repeatWeek('KOKUGO_GRADES', 2, '国語 文のきまり', 1),
  ...summerReview('小2'),
  ...repeatWeek('MATH_GRADES', 4, '算数 100までの数', 2),
  ...repeatWeek('LIFE', 1, '生活 生きもの・季節のくらし', 2),
  ...repeatWeek('MATH_GRADES', 5, '算数 かさ', 2),
  ...repeatWeek('KOKUGO_GRADES', 4, '国語 せつめい文を読む', 1),
  ...repeatWeek('MATH_GRADES', 6, '算数 時こくと時間', 2),
  ...repeatWeek('KOKUGO_GRADES', 5, '国語 物語を読む', 1),
  ...repeatWeek('MATH_GRADES', 7, '算数 3けたの数', 3),
  ...kanji(2, '漢字 語彙を広げる'),
  ...repeatWeek('MATH_GRADES', 8, '算数 かけ算の意味', 3),
  ...repeatWeek('KOKUGO_GRADES', 7, '国語 手紙を書く', 1),
  ...repeatWeek('MATH_GRADES', 9, '算数 九九', 5),
  ...repeatWeek('LIFE', 2, '生活 冬・成長のまとめ', 2),
  ...repeatWeek('MATH_GRADES', 10, '算数 はこの形', 2),
  ...repeatWeek('MATH_GRADES', 11, '算数 文章題', 3),
  ...repeatWeek('SUMMARY', 0, '小2 総まとめ', 3),
]);

const elementaryPlan = (
  gradeLabel: string,
  firstScienceOrLife: CurriculumCategoryId,
  socialWeeks: boolean,
  englishWeeks: boolean,
) => fitYear([
  ...repeatWeek('MATH_GRADES', 0, `${gradeLabel} 算数 1学期前半`, 3),
  ...repeatWeek('KOKUGO_GRADES', 0, `${gradeLabel} 国語 読解の基礎`, 2),
  ...kanji(3),
  ...repeatWeek(firstScienceOrLife, 0, `${gradeLabel} 理科・生活 春の単元`, 2),
  ...repeatWeek('MATH_GRADES', 1, `${gradeLabel} 算数 1学期中盤`, 3),
  ...(socialWeeks ? repeatWeek('SOCIAL', 0, `${gradeLabel} 社会 くらしと地域`, 2) : []),
  ...repeatWeek('MATH_GRADES', 2, `${gradeLabel} 算数 1学期後半`, 3),
  ...repeatWeek('KOKUGO_GRADES', 1, `${gradeLabel} 国語 説明文`, 1),
  ...summerReview(gradeLabel),
  ...repeatWeek('MATH_GRADES', 3, `${gradeLabel} 算数 2学期前半`, 3),
  ...repeatWeek(firstScienceOrLife, 1, `${gradeLabel} 理科・生活 秋の単元`, 2),
  ...(englishWeeks ? repeatWeek('ENGLISH', 0, `${gradeLabel} 英語 基本表現`, 2) : []),
  ...repeatWeek('MATH_GRADES', 4, `${gradeLabel} 算数 2学期中盤`, 3),
  ...repeatWeek('KOKUGO_GRADES', 2, `${gradeLabel} 国語 文章構成`, 1),
  ...(socialWeeks ? repeatWeek('SOCIAL', 1, `${gradeLabel} 社会 産業・歴史`, 2) : []),
  ...repeatWeek('MATH_GRADES', 5, `${gradeLabel} 算数 2学期後半`, 3),
  ...repeatWeek(firstScienceOrLife, 2, `${gradeLabel} 理科・生活 冬の単元`, 2),
  ...repeatWeek('MATH_GRADES', 6, `${gradeLabel} 算数 3学期前半`, 3),
  ...repeatWeek('KOKUGO_GRADES', 5, `${gradeLabel} 国語 物語・表現`, 1),
  ...(englishWeeks ? repeatWeek('ENGLISH', 0, `${gradeLabel} 英語 まとめ`, 1) : []),
  ...repeatWeek('MATH_GRADES', 7, `${gradeLabel} 算数 3学期後半`, 3),
  ...repeatWeek('SUMMARY', 0, `${gradeLabel} 総まとめ`, 4),
]);

const juniorHighPlan = (gradeLabel: string) => fitYear([
  ...repeatWeek('MATH_GRADES', 0, `${gradeLabel} 数学 1学期前半`, 3),
  ...repeatWeek('ENGLISH', 0, `${gradeLabel} 英語 文法基礎`, 2),
  ...repeatWeek('KOKUGO_GRADES', 0, `${gradeLabel} 国語 読解`, 2),
  ...repeatWeek('SCIENCE', 0, `${gradeLabel} 理科 生命・物質`, 2),
  ...repeatWeek('SOCIAL', 0, `${gradeLabel} 社会 地理・歴史`, 2),
  ...repeatWeek('MATH_GRADES', 1, `${gradeLabel} 数学 1学期中盤`, 3),
  ...kanji(7, `${gradeLabel} 漢字・語彙`),
  ...summerReview(gradeLabel),
  ...repeatWeek('MATH_GRADES', 2, `${gradeLabel} 数学 2学期前半`, 3),
  ...repeatWeek('ENGLISH', 0, `${gradeLabel} 英語 読解・作文`, 2),
  ...repeatWeek('SCIENCE', 1, `${gradeLabel} 理科 エネルギー・地球`, 2),
  ...repeatWeek('SOCIAL', 1, `${gradeLabel} 社会 歴史・公民`, 2),
  ...repeatWeek('MATH_GRADES', 3, `${gradeLabel} 数学 2学期後半`, 3),
  ...repeatWeek('KOKUGO_GRADES', 1, `${gradeLabel} 国語 古典・表現`, 2),
  ...repeatWeek('MATH_GRADES', 4, `${gradeLabel} 数学 3学期前半`, 3),
  ...repeatWeek('ENGLISH', 0, `${gradeLabel} 英語 総合`, 2),
  ...repeatWeek('SCIENCE', 2, `${gradeLabel} 理科 まとめ`, 1),
  ...repeatWeek('SOCIAL', 2, `${gradeLabel} 社会 まとめ`, 1),
  ...repeatWeek('SUMMARY', 0, `${gradeLabel} 総まとめ`, 5),
]);

export const CURRICULUM_WEEKLY_PLANS: Record<number, CurriculumWeekPlan[]> = {
  1: grade1Plan,
  2: grade2Plan,
  3: elementaryPlan('小3', 'SCIENCE', true, true),
  4: elementaryPlan('小4', 'SCIENCE', true, true),
  5: elementaryPlan('小5', 'SCIENCE', true, true),
  6: elementaryPlan('小6', 'SCIENCE', true, true),
  7: juniorHighPlan('中1'),
  8: juniorHighPlan('中2'),
  9: juniorHighPlan('中3'),
};

export const UPPER_CURRICULUM_WEEKLY_PLANS: Record<'upper' | 'adult', CurriculumWeekPlan[]> = {
  upper: fitYear([
    ...repeatWeek('UPPER_MATH', 0, '高校 数学 基礎', 3),
    ...repeatWeek('UPPER_ENGLISH', 0, '高校 英語 基礎', 3),
    ...repeatWeek('UPPER_MODERN', 0, '高校 現代文・語彙', 2),
    ...repeatWeek('UPPER_SCIENCE', 0, '高校 理科 基礎', 3),
    ...repeatWeek('UPPER_SOCIETY', 0, '高校 地歴・公民 基礎', 3),
    ...repeatWeek('UPPER_INFORMATION', 0, '高校 情報I', 2),
    ...summerReview('高校以上'),
    ...repeatWeek('UPPER_MATH', 1, '高校 数学 発展', 4),
    ...repeatWeek('UPPER_ENGLISH', 1, '高校 英語 語彙・読解', 3),
    ...repeatWeek('UPPER_CLASSICS', 0, '高校 古典', 2),
    ...repeatWeek('UPPER_SCIENCE', 1, '高校 理科 発展', 3),
    ...repeatWeek('UPPER_SOCIETY', 1, '高校 地歴・公民 発展', 3),
    ...repeatWeek('UPPER_ESSAY', 0, '高校 小論文・探究', 3),
    ...repeatWeek('SUMMARY', 0, '高校以上 総まとめ', 4),
  ]),
  adult: fitYear([
    ...repeatWeek('UPPER_PRACTICAL', 0, '大人 生活実用 お金・契約', 4),
    ...repeatWeek('UPPER_INFORMATION', 0, '大人 情報・ネット活用', 3),
    ...repeatWeek('UPPER_ESSAY', 0, '大人 読解・要約', 3),
    ...repeatWeek('UPPER_ENGLISH', 0, '大人 英語 基礎', 3),
    ...repeatWeek('UPPER_SOCIETY', 0, '大人 社会・時事', 3),
    ...summerReview('大人'),
    ...repeatWeek('UPPER_PRACTICAL', 1, '大人 健康・安全', 4),
    ...repeatWeek('UPPER_INFORMATION', 0, '大人 デジタル効率化', 3),
    ...repeatWeek('UPPER_ESSAY', 1, '大人 発信・レポート', 3),
    ...repeatWeek('UPPER_MATH', 0, '大人 数とデータ', 3),
    ...repeatWeek('UPPER_ENGLISH', 1, '大人 英語 実用', 3),
    ...repeatWeek('UPPER_PRACTICAL', 2, '大人 キャリア・公共サービス', 3),
    ...repeatWeek('SUMMARY', 0, '大人 総まとめ', 4),
  ]),
};
