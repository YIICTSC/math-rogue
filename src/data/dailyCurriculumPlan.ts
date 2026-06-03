import type { SubjectCategoryType } from '../subjectConfig';

export interface CurriculumWeekPlan {
  categoryId: SubjectCategoryType | 'KANJI';
  unitOffset: number;
  label: string;
}

const expandAnnualPlan = (terms: ReadonlyArray<ReadonlyArray<Omit<CurriculumWeekPlan, 'unitOffset'> & { unitOffset?: number }>>) => {
  const flat = terms.flat();
  return Array.from({ length: 52 }, (_, weekIndex): CurriculumWeekPlan => {
    const entry = flat[weekIndex % flat.length];
    return {
      ...entry,
      unitOffset: entry.unitOffset ?? weekIndex,
    };
  });
};

const lowerElementaryTerm1 = [
  { categoryId: 'MATH_GRADES', label: '算数 基礎と数' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 文字とことば' },
  { categoryId: 'KANJI', label: '漢字 読み書き' },
  { categoryId: 'LIFE', label: '生活 学校と身近な自然' },
] as const;

const lowerElementaryTerm2 = [
  { categoryId: 'MATH_GRADES', label: '算数 計算と量' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 読む・書く' },
  { categoryId: 'KANJI', label: '漢字 語彙づくり' },
  { categoryId: 'LIFE', label: '生活 季節とくらし' },
] as const;

const lowerElementaryTerm3 = [
  { categoryId: 'MATH_GRADES', label: '算数 まとめ' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 文章表現' },
  { categoryId: 'KANJI', label: '漢字 学年まとめ' },
  { categoryId: 'SUMMARY', label: '総まとめ' },
] as const;

const middleElementaryTerm1 = [
  { categoryId: 'MATH_GRADES', label: '算数 数と計算' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 説明文・物語' },
  { categoryId: 'KANJI', label: '漢字 読み書き' },
  { categoryId: 'SCIENCE', label: '理科 生命・自然' },
  { categoryId: 'SOCIAL', label: '社会 地域とくらし' },
] as const;

const middleElementaryTerm2 = [
  { categoryId: 'MATH_GRADES', label: '算数 図形・測定' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 要点・表現' },
  { categoryId: 'KANJI', label: '漢字 語彙づくり' },
  { categoryId: 'SCIENCE', label: '理科 物質・エネルギー' },
  { categoryId: 'SOCIAL', label: '社会 産業・地域' },
  { categoryId: 'ENGLISH', label: '英語 音声・表現' },
] as const;

const middleElementaryTerm3 = [
  { categoryId: 'MATH_GRADES', label: '算数 データ・活用' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 作文・話し合い' },
  { categoryId: 'KANJI', label: '漢字 学年まとめ' },
  { categoryId: 'SCIENCE', label: '理科 学年まとめ' },
  { categoryId: 'SOCIAL', label: '社会 学年まとめ' },
  { categoryId: 'SUMMARY', label: '総まとめ' },
] as const;

const upperElementaryTerm1 = [
  { categoryId: 'MATH_GRADES', label: '算数 数と計算' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 読解' },
  { categoryId: 'KANJI', label: '漢字 読み書き' },
  { categoryId: 'SCIENCE', label: '理科 生命・地球' },
  { categoryId: 'SOCIAL', label: '社会 産業・歴史' },
  { categoryId: 'ENGLISH', label: '英語 基本表現' },
] as const;

const upperElementaryTerm2 = [
  { categoryId: 'MATH_GRADES', label: '算数 図形・割合' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 要約・意見' },
  { categoryId: 'KANJI', label: '漢字 語彙づくり' },
  { categoryId: 'SCIENCE', label: '理科 物質・エネルギー' },
  { categoryId: 'SOCIAL', label: '社会 政治・国際' },
  { categoryId: 'ENGLISH', label: '英語 読む・書く' },
] as const;

const upperElementaryTerm3 = [
  { categoryId: 'MATH_GRADES', label: '算数 データ・総合' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 表現・発表' },
  { categoryId: 'KANJI', label: '漢字 学年まとめ' },
  { categoryId: 'SCIENCE', label: '理科 学年まとめ' },
  { categoryId: 'SOCIAL', label: '社会 学年まとめ' },
  { categoryId: 'ENGLISH', label: '英語 学年まとめ' },
  { categoryId: 'SUMMARY', label: '総まとめ' },
] as const;

const juniorHighTerm1 = [
  { categoryId: 'MATH_GRADES', label: '数学 数と式' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 読解' },
  { categoryId: 'KANJI', label: '漢字・語彙' },
  { categoryId: 'ENGLISH', label: '英語 文法・表現' },
  { categoryId: 'SCIENCE', label: '理科 生命・物質' },
  { categoryId: 'SOCIAL', label: '社会 地理・歴史' },
] as const;

const juniorHighTerm2 = [
  { categoryId: 'MATH_GRADES', label: '数学 関数・図形' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 古典・表現' },
  { categoryId: 'KANJI', label: '漢字・語彙活用' },
  { categoryId: 'ENGLISH', label: '英語 読解・作文' },
  { categoryId: 'SCIENCE', label: '理科 エネルギー・地球' },
  { categoryId: 'SOCIAL', label: '社会 歴史・公民' },
] as const;

const juniorHighTerm3 = [
  { categoryId: 'MATH_GRADES', label: '数学 データ・総合' },
  { categoryId: 'KOKUGO_GRADES', label: '国語 総合読解' },
  { categoryId: 'KANJI', label: '漢字 学年まとめ' },
  { categoryId: 'ENGLISH', label: '英語 総合' },
  { categoryId: 'SCIENCE', label: '理科 学年まとめ' },
  { categoryId: 'SOCIAL', label: '社会 学年まとめ' },
  { categoryId: 'SUMMARY', label: '総まとめ' },
] as const;

export const CURRICULUM_WEEKLY_PLANS: Record<number, CurriculumWeekPlan[]> = {
  1: expandAnnualPlan([lowerElementaryTerm1, lowerElementaryTerm2, lowerElementaryTerm3]),
  2: expandAnnualPlan([lowerElementaryTerm1, lowerElementaryTerm2, lowerElementaryTerm3]),
  3: expandAnnualPlan([middleElementaryTerm1, middleElementaryTerm2, middleElementaryTerm3]),
  4: expandAnnualPlan([middleElementaryTerm1, middleElementaryTerm2, middleElementaryTerm3]),
  5: expandAnnualPlan([upperElementaryTerm1, upperElementaryTerm2, upperElementaryTerm3]),
  6: expandAnnualPlan([upperElementaryTerm1, upperElementaryTerm2, upperElementaryTerm3]),
  7: expandAnnualPlan([juniorHighTerm1, juniorHighTerm2, juniorHighTerm3]),
  8: expandAnnualPlan([juniorHighTerm1, juniorHighTerm2, juniorHighTerm3]),
  9: expandAnnualPlan([juniorHighTerm1, juniorHighTerm2, juniorHighTerm3]),
};
