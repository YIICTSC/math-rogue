import { KANJI_G1_DATA } from './subjects/kanji_g1';
import { KANJI_G2_DATA } from './subjects/kanji_g2';
import { KANJI_G3_DATA } from './subjects/kanji_g3';
import { KANJI_G4_DATA } from './subjects/kanji_g4';
import { KANJI_G5_DATA } from './subjects/kanji_g5';
import { KANJI_G6_DATA } from './subjects/kanji_g6';
import { KANJI_G7_DATA } from './subjects/kanji_g7';
import { KANJI_G8_DATA } from './subjects/kanji_g8';
import { KANJI_G9_DATA } from './subjects/kanji_g9';
import { KANJI_1KYU_DATA, KANJI_H1_DATA, KANJI_H2_DATA, KANJI_H3_DATA, KANJI_PRE1_DATA } from './subjects/kanji_upper';
import {
    KANKEN_10_EXTRA,
    KANKEN_9_EXTRA,
    KANKEN_8_EXTRA,
    KANKEN_7_EXTRA,
    KANKEN_6_EXTRA,
    KANKEN_5_EXTRA,
    KANKEN_4_EXTRA,
    KANKEN_3_EXTRA,
    KANKEN_PRE2_EXTRA,
    KANKEN_2_EXTRA,
    KANKEN_PRE1_EXTRA,
    KANKEN_1_EXTRA,
} from './subjects/kanken_extra';
import { HARD_KANJI_DATA } from './subjects/hard_kanji';

export interface KanjiProblem {
    question: string;
    answer: string;
    options: string[];
    hint?: string;
    distractorPool?: string[];
}

const mergeUniqueProblems = (...groups: KanjiProblem[][]): KanjiProblem[] => {
    const seen = new Set<string>();
    return groups.flat().filter((problem) => {
        const key = `${problem.question}::${problem.answer}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const withContextualDistractors = (items: KanjiProblem[]): KanjiProblem[] => {
    const pool = Array.from(new Set(items.map((item) => item.answer)));
    return items.map((item, index) => {
        const distractors: string[] = [];
        for (let offset = 1; distractors.length < 3 && offset < pool.length; offset += 1) {
            const candidate = pool[(index + offset) % pool.length];
            if (candidate !== item.answer && !distractors.includes(candidate)) {
                distractors.push(candidate);
            }
        }
        return {
            ...item,
            distractorPool: distractors,
        };
    });
};

const withDistractorsBySourcePools = (groups: KanjiProblem[][]): KanjiProblem[] => {
    const merged = mergeUniqueProblems(...groups);
    const sourcePools = groups.map((group) => new Set(group.map((item) => `${item.question}::${item.answer}`)));
    const answerPools = groups.map((group) => Array.from(new Set(group.map((item) => item.answer))));
    return merged.map((item, index) => {
        const itemKey = `${item.question}::${item.answer}`;
        const sourceIndex = sourcePools.findIndex((pool) => pool.has(itemKey));
        const pool = answerPools[Math.max(sourceIndex, 0)];
        const distractors: string[] = [];
        for (let offset = 0; distractors.length < 3 && offset < pool.length; offset += 1) {
            const candidate = pool[(index + offset) % pool.length];
            if (candidate !== item.answer && !distractors.includes(candidate)) {
                distractors.push(candidate);
            }
        }
        return {
            ...item,
            distractorPool: distractors,
        };
    });
};

export const KANJI_DATA: Record<string, KanjiProblem[]> = {
    KANJI_1: KANJI_G1_DATA,
    KANJI_2: KANJI_G2_DATA,
    KANJI_3: KANJI_G3_DATA,
    KANJI_4: KANJI_G4_DATA,
    KANJI_5: KANJI_G5_DATA,
    KANJI_6: KANJI_G6_DATA,
    KANJI_7: KANJI_G7_DATA,
    KANJI_8: KANJI_G8_DATA,
    KANJI_9: KANJI_G9_DATA,
    KANJI_10: withContextualDistractors(mergeUniqueProblems(KANJI_G7_DATA, KANJI_G8_DATA, KANJI_G9_DATA, KANJI_H1_DATA)),
    KANJI_11: withContextualDistractors(mergeUniqueProblems(KANJI_G7_DATA, KANJI_G8_DATA, KANJI_G9_DATA, KANJI_H1_DATA, KANJI_H2_DATA)),
    KANJI_12: withContextualDistractors(mergeUniqueProblems(KANJI_G7_DATA, KANJI_G8_DATA, KANJI_G9_DATA, KANJI_H1_DATA, KANJI_H2_DATA, KANJI_H3_DATA)),
};

export const KANKEN_DATA: Record<string, KanjiProblem[]> = {
    KANKEN_10: mergeUniqueProblems(KANJI_G1_DATA, KANKEN_10_EXTRA),
    KANKEN_9: mergeUniqueProblems(KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA),
    KANKEN_8: mergeUniqueProblems(KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA),
    KANKEN_7: mergeUniqueProblems(KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA, KANJI_G4_DATA, KANKEN_7_EXTRA),
    KANKEN_6: mergeUniqueProblems(KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA, KANJI_G4_DATA, KANKEN_7_EXTRA, KANJI_G5_DATA, KANKEN_6_EXTRA),
    KANKEN_5: mergeUniqueProblems(KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA, KANJI_G4_DATA, KANKEN_7_EXTRA, KANJI_G5_DATA, KANKEN_6_EXTRA, KANJI_G6_DATA, KANKEN_5_EXTRA),
    KANKEN_4: mergeUniqueProblems(KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA, KANJI_G4_DATA, KANKEN_7_EXTRA, KANJI_G5_DATA, KANKEN_6_EXTRA, KANJI_G6_DATA, KANKEN_5_EXTRA, KANJI_G7_DATA, KANKEN_4_EXTRA),
    KANKEN_3: mergeUniqueProblems(KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA, KANJI_G4_DATA, KANKEN_7_EXTRA, KANJI_G5_DATA, KANKEN_6_EXTRA, KANJI_G6_DATA, KANKEN_5_EXTRA, KANJI_G7_DATA, KANKEN_4_EXTRA, KANJI_G8_DATA, KANKEN_3_EXTRA),
    KANKEN_PRE2: withDistractorsBySourcePools([
        KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA,
        KANJI_G4_DATA, KANKEN_7_EXTRA, KANJI_G5_DATA, KANKEN_6_EXTRA, KANJI_G6_DATA, KANKEN_5_EXTRA,
        KANJI_G7_DATA, KANKEN_4_EXTRA, KANJI_G8_DATA, KANKEN_3_EXTRA, KANJI_G9_DATA, KANKEN_PRE2_EXTRA,
    ]),
    KANKEN_2: withDistractorsBySourcePools([
        KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA,
        KANJI_G4_DATA, KANKEN_7_EXTRA, KANJI_G5_DATA, KANKEN_6_EXTRA, KANJI_G6_DATA, KANKEN_5_EXTRA,
        KANJI_G7_DATA, KANKEN_4_EXTRA, KANJI_G8_DATA, KANKEN_3_EXTRA, KANJI_G9_DATA, KANKEN_PRE2_EXTRA,
        KANJI_H1_DATA, KANKEN_2_EXTRA,
    ]),
    KANKEN_PRE1: withDistractorsBySourcePools([
        KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA,
        KANJI_G4_DATA, KANKEN_7_EXTRA, KANJI_G5_DATA, KANKEN_6_EXTRA, KANJI_G6_DATA, KANKEN_5_EXTRA,
        KANJI_G7_DATA, KANKEN_4_EXTRA, KANJI_G8_DATA, KANKEN_3_EXTRA, KANJI_G9_DATA, KANKEN_PRE2_EXTRA,
        KANJI_H1_DATA, KANKEN_2_EXTRA, KANJI_PRE1_DATA, KANKEN_PRE1_EXTRA,
    ]),
    KANKEN_1: withDistractorsBySourcePools([
        KANJI_G1_DATA, KANKEN_10_EXTRA, KANJI_G2_DATA, KANKEN_9_EXTRA, KANJI_G3_DATA, KANKEN_8_EXTRA,
        KANJI_G4_DATA, KANKEN_7_EXTRA, KANJI_G5_DATA, KANKEN_6_EXTRA, KANJI_G6_DATA, KANKEN_5_EXTRA,
        KANJI_G7_DATA, KANKEN_4_EXTRA, KANJI_G8_DATA, KANKEN_3_EXTRA, KANJI_G9_DATA, KANKEN_PRE2_EXTRA,
        KANJI_H1_DATA, KANKEN_2_EXTRA, KANJI_PRE1_DATA, KANKEN_PRE1_EXTRA, KANJI_1KYU_DATA, KANKEN_1_EXTRA,
    ]),
};

export { HARD_KANJI_DATA };
