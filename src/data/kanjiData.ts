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
import {
    KANJI_CONTEXT_READING_PROFILES,
    KANJI_READING_PROFILES,
    KanjiContextReadingVariant,
    KanjiReadingKind,
    KanjiReadingVariant,
} from './kanjiReadingProfiles';
import {
    KANKEN_JOYO_KANJI_SET,
    KANKEN_OFFICIAL_LEVEL_KANJI_SETS,
    KANKEN_OFFICIAL_LEVEL_ORDER,
    OfficialKankenLevel,
} from './kankenLevelKanji';

export interface KanjiProblem {
    question: string;
    answer: string;
    options: string[];
    hint?: string;
    /** 書きモードで実際に書く表記。読み問題では表示用の問題文と分離する。 */
    writingAnswer?: string;
    distractorPool?: string[];
    /** 漢検モードで、この問題が属する級。通常の学年別漢字では未設定。 */
    kankenLevel?: KankenLevel;
    /** 漢検モードで、その級の配当漢字として実際に判定対象になる漢字。 */
    targetKanji?: string;
}

export type KankenLevel =
    | 'KANKEN_10'
    | 'KANKEN_9'
    | 'KANKEN_8'
    | 'KANKEN_7'
    | 'KANKEN_6'
    | 'KANKEN_5'
    | 'KANKEN_4'
    | 'KANKEN_3'
    | 'KANKEN_PRE2'
    | 'KANKEN_2'
    | 'KANKEN_PRE1'
    | 'KANKEN_1';

const normalizeSingleKanji = (question: string): string =>
    question.replace(/[「」『』【】\s]/g, '');

const isSingleKanjiQuestion = (question: string, kanji: string): boolean =>
    normalizeSingleKanji(question) === kanji;

const allProfileReadings = KANJI_READING_PROFILES.flatMap((profile) => [
    ...(profile.onyomi ?? []).map((variant) => variant.reading),
    ...(profile.kunyomi ?? []).map((variant) => variant.reading),
]);

const makeReadingOptions = (
    answer: string,
    counterpartReadings: string[],
    sourceOptions: string[],
    seed: number,
): string[] => {
    const options: string[] = [answer];
    const candidates = [
        ...counterpartReadings,
        ...sourceOptions,
        ...allProfileReadings.slice(seed),
        ...allProfileReadings.slice(0, seed),
    ];
    for (const candidate of candidates) {
        if (candidate === answer || options.includes(candidate)) continue;
        options.push(candidate);
        if (options.length === 4) break;
    }
    return options;
};

const makeReadingProblem = (
    kanji: string,
    kind: KanjiReadingKind,
    variant: KanjiReadingVariant,
    counterpartReadings: string[],
    sourceOptions: string[],
    seed: number,
): KanjiProblem => {
    const kindLabel = kind === 'onyomi' ? '音読み' : '訓読み';
    return {
        question: `【${kindLabel}】「${variant.example}」の「${kanji}」は何と読む？`,
        answer: variant.reading,
        options: makeReadingOptions(variant.reading, counterpartReadings, sourceOptions, seed),
        hint: `${kindLabel}の問題。${variant.hint}`,
        writingAnswer: kanji,
    };
};

const makeContextReadingProblem = (
    variant: KanjiContextReadingVariant,
    sourceOptions: string[],
    validReadings: string[],
    seed: number,
    writingAnswer: string,
): KanjiProblem => {
    const safeSourceOptions = sourceOptions.filter((candidate) =>
        candidate === variant.reading || !validReadings.includes(candidate),
    );
    return {
        question: variant.question,
        answer: variant.reading,
        options: makeReadingOptions(variant.reading, [], [...variant.distractors, ...safeSourceOptions], seed),
        hint: variant.hint,
        writingAnswer,
    };
};

const polishKanjiReadingProblems = (items: KanjiProblem[]): KanjiProblem[] => {
    const polished: KanjiProblem[] = [];
    items.forEach((item, itemIndex) => {
        const profile = KANJI_READING_PROFILES.find((candidate) =>
            isSingleKanjiQuestion(item.question, candidate.kanji),
        );
        if (!profile) {
            const contextProfile = KANJI_CONTEXT_READING_PROFILES.find((candidate) =>
                candidate.sourceQuestion === item.question,
            );
            if (!contextProfile) {
                polished.push(item);
                return;
            }

            const validReadings = contextProfile.variants.map((variant) => variant.reading);
            contextProfile.variants.forEach((variant, variantIndex) => {
                polished.push(makeContextReadingProblem(
                    variant,
                    item.options,
                    validReadings,
                    itemIndex + variantIndex,
                    contextProfile.sourceQuestion,
                ));
            });
            return;
        }

        const variants: KanjiProblem[] = [];
        const onyomi = profile.onyomi ?? [];
        const kunyomi = profile.kunyomi ?? [];
        onyomi.forEach((variant, variantIndex) => {
            variants.push(makeReadingProblem(
                profile.kanji,
                'onyomi',
                variant,
                kunyomi.map((entry) => entry.reading),
                item.options,
                itemIndex + variantIndex,
            ));
        });
        kunyomi.forEach((variant, variantIndex) => {
            variants.push(makeReadingProblem(
                profile.kanji,
                'kunyomi',
                variant,
                onyomi.map((entry) => entry.reading),
                item.options,
                itemIndex + onyomi.length + variantIndex,
            ));
        });

        polished.push(...variants);
    });
    return polished;
};

const KANJI_G1_POLISHED = polishKanjiReadingProblems(KANJI_G1_DATA);
const KANJI_G2_POLISHED = polishKanjiReadingProblems(KANJI_G2_DATA);
const KANJI_G3_POLISHED = polishKanjiReadingProblems(KANJI_G3_DATA);
const KANJI_G4_POLISHED = polishKanjiReadingProblems(KANJI_G4_DATA);
const KANJI_G5_POLISHED = polishKanjiReadingProblems(KANJI_G5_DATA);
const KANJI_G6_POLISHED = polishKanjiReadingProblems(KANJI_G6_DATA);
const KANJI_G7_POLISHED = polishKanjiReadingProblems(KANJI_G7_DATA);
const KANJI_G8_POLISHED = polishKanjiReadingProblems(KANJI_G8_DATA);
const KANJI_G9_POLISHED = polishKanjiReadingProblems(KANJI_G9_DATA);

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

const tagKankenLevel = (level: KankenLevel, items: KanjiProblem[]): KanjiProblem[] =>
    items.map((item) => ({ ...item, kankenLevel: level }));

/**
 * 漢検級別は「その級向けに用意した問題」だけを収録する。
 * 下位級の問題は混ぜず、総復習は KANKEN_MIXED 側に任せる。
 */
const buildKankenLevel = (
    level: KankenLevel,
    groups: KanjiProblem[][],
    contextualDistractors = false,
): KanjiProblem[] => tagKankenLevel(
    level,
    contextualDistractors
        ? withDistractorsBySourcePools(groups)
        : mergeUniqueProblems(...groups),
);

const extractKankenTargetText = (question: string): string => {
    const quoted = [...question.matchAll(/「([^」]+)」/g)].map((match) => match[1]);
    if (quoted.length >= 2 && question.includes('何と読む')) {
        return quoted[quoted.length - 1];
    }
    return question;
};

const extractKanjiCharacters = (text: string): string[] =>
    Array.from(new Set(text.match(/[\u3400-\u4DBF\u4E00-\u9FFF]/g) ?? []));

const filterOfficialKankenGroups = (
    level: OfficialKankenLevel,
    groups: KanjiProblem[][],
    learnedKanji: ReadonlySet<string>,
): KanjiProblem[][] => {
    const levelKanji = KANKEN_OFFICIAL_LEVEL_KANJI_SETS[level];
    return groups.map((group) => group.flatMap((problem) => {
        const targetText = extractKankenTargetText(problem.question);
        const kanji = extractKanjiCharacters(targetText);
        if (kanji.length === 0 || kanji.some((character) => !learnedKanji.has(character))) {
            return [];
        }

        const targetKanji = kanji.filter((character) => levelKanji.has(character));
        if (targetKanji.length === 0) return [];
        return [{ ...problem, targetKanji: targetKanji.join('') }];
    }));
};

const filterUpperKankenGroups = (
    groups: KanjiProblem[][],
    excludedTargetKanji: ReadonlySet<string>,
): { groups: KanjiProblem[][]; targetKanji: Set<string> } => {
    const assignedTargetKanji = new Set<string>();
    const filteredGroups = groups.map((group) => group.flatMap((problem) => {
        const targetText = extractKankenTargetText(problem.question);
        const targetKanji = extractKanjiCharacters(targetText).filter((character) =>
            !KANKEN_JOYO_KANJI_SET.has(character) && !excludedTargetKanji.has(character),
        );
        if (targetKanji.length === 0) return [];
        targetKanji.forEach((character) => assignedTargetKanji.add(character));
        return [{ ...problem, targetKanji: targetKanji.join('') }];
    }));
    return { groups: filteredGroups, targetKanji: assignedTargetKanji };
};

export const KANJI_DATA: Record<string, KanjiProblem[]> = {
    KANJI_1: KANJI_G1_POLISHED,
    KANJI_2: KANJI_G2_POLISHED,
    KANJI_3: KANJI_G3_POLISHED,
    KANJI_4: KANJI_G4_POLISHED,
    KANJI_5: KANJI_G5_POLISHED,
    KANJI_6: KANJI_G6_POLISHED,
    KANJI_7: KANJI_G7_POLISHED,
    KANJI_8: KANJI_G8_POLISHED,
    KANJI_9: KANJI_G9_POLISHED,
    KANJI_10: withContextualDistractors(mergeUniqueProblems(KANJI_G7_POLISHED, KANJI_G8_POLISHED, KANJI_G9_POLISHED, KANJI_H1_DATA)),
    KANJI_11: withContextualDistractors(mergeUniqueProblems(KANJI_G7_POLISHED, KANJI_G8_POLISHED, KANJI_G9_POLISHED, KANJI_H1_DATA, KANJI_H2_DATA)),
    KANJI_12: withContextualDistractors(mergeUniqueProblems(KANJI_G7_POLISHED, KANJI_G8_POLISHED, KANJI_G9_POLISHED, KANJI_H1_DATA, KANJI_H2_DATA, KANJI_H3_DATA)),
};

const KANKEN_2_REUSABLE_HARD_PROBLEMS: KanjiProblem[] = [
    ...HARD_KANJI_DATA.HARD_KANJI_FLORA_FAUNA,
    ...HARD_KANJI_DATA.HARD_KANJI_KOKUJI,
    ...HARD_KANJI_DATA.HARD_KANJI_YOJUKUGO,
    ...HARD_KANJI_DATA.HARD_KANJI_ATEJI.filter((problem) => problem.question === '椅子'),
];

const KANKEN_OFFICIAL_LEVEL_SPECS: Array<{
    level: OfficialKankenLevel;
    groups: KanjiProblem[][];
    contextualDistractors?: boolean;
}> = [
    { level: 'KANKEN_10', groups: [KANJI_G1_POLISHED, KANKEN_10_EXTRA] },
    { level: 'KANKEN_9', groups: [KANJI_G2_POLISHED, KANKEN_9_EXTRA] },
    { level: 'KANKEN_8', groups: [KANJI_G3_POLISHED, KANKEN_8_EXTRA] },
    { level: 'KANKEN_7', groups: [KANJI_G4_POLISHED, KANKEN_7_EXTRA] },
    { level: 'KANKEN_6', groups: [KANJI_G5_POLISHED, KANKEN_6_EXTRA] },
    { level: 'KANKEN_5', groups: [KANJI_G6_POLISHED, KANKEN_5_EXTRA] },
    { level: 'KANKEN_4', groups: [KANJI_G7_POLISHED, KANKEN_4_EXTRA] },
    { level: 'KANKEN_3', groups: [KANJI_G8_POLISHED, KANKEN_3_EXTRA] },
    { level: 'KANKEN_PRE2', groups: [KANJI_G9_POLISHED, KANKEN_PRE2_EXTRA], contextualDistractors: true },
    {
        level: 'KANKEN_2',
        groups: [KANJI_H1_DATA, KANKEN_PRE2_EXTRA, KANKEN_2_EXTRA, KANKEN_2_REUSABLE_HARD_PROBLEMS],
        contextualDistractors: true,
    },
];

const buildIsolatedKankenData = (): Record<KankenLevel, KanjiProblem[]> => {
    const seenProblemKeys = new Set<string>();
    const result = {} as Record<KankenLevel, KanjiProblem[]>;
    const learnedKanji = new Set<string>();

    const storeUniqueProblems = (level: KankenLevel, problems: KanjiProblem[]): void => {
        result[level] = problems.filter((problem) => {
            const key = `${problem.question}::${problem.answer}`;
            if (seenProblemKeys.has(key)) return false;
            seenProblemKeys.add(key);
            return true;
        });
    };

    for (const level of KANKEN_OFFICIAL_LEVEL_ORDER) {
        for (const character of KANKEN_OFFICIAL_LEVEL_KANJI_SETS[level]) {
            learnedKanji.add(character);
        }
        const spec = KANKEN_OFFICIAL_LEVEL_SPECS.find((candidate) => candidate.level === level);
        if (!spec) continue;
        const filteredGroups = filterOfficialKankenGroups(level, spec.groups, learnedKanji);
        const levelProblems = buildKankenLevel(
            spec.level,
            filteredGroups,
            spec.contextualDistractors ?? false,
        );
        storeUniqueProblems(spec.level, levelProblems);
    }

    // 準1級・1級は固定の公式級別漢字表がないため、既存の専用問題群を使う。
    // 常用漢字（2級まで）を除外し、さらに準1級で使った対象漢字を1級から除外する。
    const pre1 = filterUpperKankenGroups([KANJI_PRE1_DATA, KANKEN_PRE1_EXTRA], new Set());
    storeUniqueProblems(
        'KANKEN_PRE1',
        buildKankenLevel('KANKEN_PRE1', pre1.groups, true),
    );

    const level1 = filterUpperKankenGroups([KANJI_1KYU_DATA, KANKEN_1_EXTRA], pre1.targetKanji);
    storeUniqueProblems(
        'KANKEN_1',
        buildKankenLevel('KANKEN_1', level1.groups, true),
    );

    return result;
};

export const KANKEN_DATA: Record<string, KanjiProblem[]> = buildIsolatedKankenData();

export { HARD_KANJI_DATA };
