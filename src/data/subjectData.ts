
import { GeneralProblem, normalizeProblemQuestionLabels } from './subjects/utils';
import { LIFE_G1_DATA } from './subjects/life_g1';
import { LIFE_G2_DATA } from './subjects/life_g2';
import { SCIENCE_G3_DATA } from './subjects/science_g3';
import { SCIENCE_G4_DATA } from './subjects/science_g4';
import { SCIENCE_G5_DATA } from './subjects/science_g5';
import { SCIENCE_G6_DATA } from './subjects/science_g6';
import { SCIENCE_G7_DATA } from './subjects/science_g7';
import { SCIENCE_G8_DATA } from './subjects/science_g8';
import { SCIENCE_G9_DATA } from './subjects/science_g9';
import { SOCIAL_G3_DATA } from './subjects/social_g3';
import { SOCIAL_G4_DATA } from './subjects/social_g4';
import { SOCIAL_G5_DATA } from './subjects/social_g5';
import { SOCIAL_G6_DATA } from './subjects/social_g6';
import { SOCIAL_G7_DATA } from './subjects/social_g7';
import { SOCIAL_G8_DATA } from './subjects/social_g8';
import { SOCIAL_G9_DATA } from './subjects/social_g9';
import { MAP_PREF_DATA } from './subjects/map_pref';
import { PREFECTURE_QUIZ_DATA } from './subjects/prefecture_quiz';

// 算数・数学のインポート
import { MATH_G1_DATA } from './subjects/math_g1';
import { MATH_G2_DATA } from './subjects/math_g2';
import { MATH_G3_DATA } from './subjects/math_g3';
import { MATH_G4_DATA } from './subjects/math_g4';
import { MATH_G5_DATA } from './subjects/math_g5';
import { MATH_G6_DATA } from './subjects/math_g6';
import { MATH_G7_DATA } from './subjects/math_g7';
import { MATH_G8_DATA } from './subjects/math_g8';
import { MATH_G9_DATA } from './subjects/math_g9';
import { KOKUGO_G1_DATA } from './subjects/kokugo_g1';
import { KOKUGO_G2_DATA } from './subjects/kokugo_g2';
import { KOKUGO_G3_DATA } from './subjects/kokugo_g3';
import { KOKUGO_G4_DATA } from './subjects/kokugo_g4';
import { KOKUGO_G5_DATA } from './subjects/kokugo_g5';
import { KOKUGO_G6_DATA } from './subjects/kokugo_g6';
import { KOKUGO_G7_DATA } from './subjects/kokugo_g7';
import { KOKUGO_G8_DATA } from './subjects/kokugo_g8';
import { KOKUGO_G9_DATA } from './subjects/kokugo_g9';
import { ENGLISH_G3_DATA } from './subjects/english_g3';
import { ENGLISH_G4_DATA } from './subjects/english_g4';
import { ENGLISH_G5_DATA } from './subjects/english_g5';
import { ENGLISH_G6_DATA } from './subjects/english_g6';
import { ENGLISH_G7_DATA } from './subjects/english_g7';
import { ENGLISH_G8_DATA } from './subjects/english_g8';
import { ENGLISH_G9_DATA } from './subjects/english_g9';
import { ENGLISH_GRADE_WORD_UNIT_DATA, UPPER_ENGLISH_WORD_UNIT_DATA } from './subjects/english_word_banks';
import { SCIENCE_GRADE_UNITS } from '../scienceUnitConfig';
import { SCIENCE_UNIT_DATA as DEDICATED_SCIENCE_UNIT_DATA } from './subjects/science_units';
import { SOCIAL_GRADE_UNITS } from '../socialUnitConfig';
import { SOCIAL_UNIT_DATA as DEDICATED_SOCIAL_UNIT_DATA } from './subjects/social_units';
import { KANJI_DATA } from './kanjiData';

// IT・情報のインポート
import { IT_TABLET_DATA } from './subjects/it_tablet';
import { IT_INTERNET_DATA } from './subjects/it_internet';
import { IT_LITERACY_DATA } from './subjects/it_literacy';
import { IT_PROGRAMMING_DATA } from './subjects/it_programming';
import { IT_SECURITY_DATA } from './subjects/it_security';
import { HIGH_SCHOOL_UPPER_SUBJECT_DATA } from './subjects/high_school_upper';
import { HIGH_SCHOOL_MATH_SUBJECT_DATA } from './subjects/high_school_math';
import { HIGH_SCHOOL_SCIENCE_SUBJECT_DATA } from './subjects/high_school_science';
import { HIGH_SCHOOL_SOCIETY_SUBJECT_DATA } from './subjects/high_school_society';
import { HIGH_SCHOOL_ESSAY_SUBJECT_DATA } from './subjects/high_school_essay';
import { HIGH_SCHOOL_PRACTICAL_SUBJECT_DATA } from './subjects/high_school_practical';
import { HIGH_SCHOOL_DEEP_UNIT_DATA } from './subjects/high_school_deep_units';
import { HIGH_SCHOOL_MASSIVE_UNIT_DATA } from './subjects/high_school_massive_units';
import { HIGH_SCHOOL_ULTRA_UNIT_DATA } from './subjects/high_school_ultra_units';
import { HIGH_SCHOOL_GIGA_UNIT_DATA } from './subjects/high_school_giga_units';
import { HIGH_SCHOOL_MATH_GENERATED_DATA } from './subjects/high_school_math_generated';
import { HOBBY_KNOWLEDGE_DATA } from './subjects/hobby_knowledge';

export type { GeneralProblem };

const BASE_SUBJECT_DATA: Record<string, GeneralProblem[]> = {
    ...MATH_G1_DATA,
    ...MATH_G2_DATA,
    ...MATH_G3_DATA,
    ...MATH_G4_DATA,
    ...MATH_G5_DATA,
    ...MATH_G6_DATA,
    ...MATH_G7_DATA,
    ...MATH_G8_DATA,
    ...MATH_G9_DATA,
    ...KOKUGO_G1_DATA,
    ...KOKUGO_G2_DATA,
    ...KOKUGO_G3_DATA,
    ...KOKUGO_G4_DATA,
    ...KOKUGO_G5_DATA,
    ...KOKUGO_G6_DATA,
    ...KOKUGO_G7_DATA,
    ...KOKUGO_G8_DATA,
    ...KOKUGO_G9_DATA,
    ...ENGLISH_G3_DATA,
    ...ENGLISH_G4_DATA,
    ...ENGLISH_G5_DATA,
    ...ENGLISH_G6_DATA,
    ...ENGLISH_G7_DATA,
    ...ENGLISH_G8_DATA,
    ...ENGLISH_G9_DATA,
    ...ENGLISH_GRADE_WORD_UNIT_DATA,
    ...LIFE_G1_DATA,
    ...LIFE_G2_DATA,
    ...SCIENCE_G3_DATA,
    ...SCIENCE_G4_DATA,
    ...SCIENCE_G5_DATA,
    ...SCIENCE_G6_DATA,
    ...SCIENCE_G7_DATA,
    ...SCIENCE_G8_DATA,
    ...SCIENCE_G9_DATA,
    ...SOCIAL_G3_DATA,
    ...SOCIAL_G4_DATA,
    ...SOCIAL_G5_DATA,
    ...SOCIAL_G6_DATA,
    ...SOCIAL_G7_DATA,
    ...SOCIAL_G8_DATA,
    ...SOCIAL_G9_DATA,
    ...MAP_PREF_DATA,
    ...PREFECTURE_QUIZ_DATA,
    // IT・情報
    ...IT_TABLET_DATA,
    IT_INTERNET: IT_INTERNET_DATA,
    IT_LITERACY: IT_LITERACY_DATA,
    IT_PROGRAMMING: IT_PROGRAMMING_DATA,
    IT_SECURITY: IT_SECURITY_DATA,
};

const SCIENCE_UNIT_ALIAS_DATA: Record<string, GeneralProblem[]> = Object.fromEntries(
    Object.values(SCIENCE_GRADE_UNITS)
        .flat()
        .map((unit) => [unit.mode, BASE_SUBJECT_DATA[unit.sourceMode] || []])
);

const SOCIAL_UNIT_ALIAS_DATA: Record<string, GeneralProblem[]> = Object.fromEntries(
    Object.values(SOCIAL_GRADE_UNITS)
        .flat()
        .map((unit) => [unit.mode, BASE_SUBJECT_DATA[unit.sourceMode] || []])
);

const GENERALIZED_KANJI_DATA: Record<string, GeneralProblem[]> = Object.fromEntries(
    Object.entries(KANJI_DATA).map(([mode, problems]) => [
        mode,
        problems.map((problem) => ({
            question: `「${problem.question}」の読みは？`,
            answer: problem.answer,
            options: [...problem.options],
            hint: problem.hint,
        })),
    ])
);

GENERALIZED_KANJI_DATA.KANJI_MIXED = Object.values(GENERALIZED_KANJI_DATA).flat();

const RAW_SUBJECT_DATA: Record<string, GeneralProblem[]> = {
    ...BASE_SUBJECT_DATA,
    ...SCIENCE_UNIT_ALIAS_DATA,
    ...SOCIAL_UNIT_ALIAS_DATA,
    ...GENERALIZED_KANJI_DATA,
    ...DEDICATED_SCIENCE_UNIT_DATA,
    ...DEDICATED_SOCIAL_UNIT_DATA,
    ...HIGH_SCHOOL_UPPER_SUBJECT_DATA,
    ...HIGH_SCHOOL_MATH_SUBJECT_DATA,
    ...HIGH_SCHOOL_SCIENCE_SUBJECT_DATA,
    ...HIGH_SCHOOL_SOCIETY_SUBJECT_DATA,
    ...HIGH_SCHOOL_ESSAY_SUBJECT_DATA,
    ...HIGH_SCHOOL_PRACTICAL_SUBJECT_DATA,
    ...UPPER_ENGLISH_WORD_UNIT_DATA,
    ...HIGH_SCHOOL_DEEP_UNIT_DATA,
    ...HIGH_SCHOOL_MASSIVE_UNIT_DATA,
    ...HIGH_SCHOOL_ULTRA_UNIT_DATA,
    ...HIGH_SCHOOL_GIGA_UNIT_DATA,
    ...HOBBY_KNOWLEDGE_DATA,
};

const AUGMENTED_SUBJECT_DATA: Record<string, GeneralProblem[]> = Object.fromEntries(
    Object.entries(RAW_SUBJECT_DATA).map(([mode, problems]) => [
        mode,
        [...problems, ...(HIGH_SCHOOL_MATH_GENERATED_DATA[mode] || [])],
    ])
);

export const SUBJECT_DATA: Record<string, GeneralProblem[]> = Object.fromEntries(
    Object.entries(AUGMENTED_SUBJECT_DATA).map(([mode, problems]) => [
        mode,
        problems.map(normalizeProblemQuestionLabels),
    ])
);
