export type ProblemVisual =
    | { kind: 'clock'; hour: number; minute: number }
    | { kind: 'polygon'; sides: number; labels?: string[]; showDiagonals?: boolean }
    | { kind: 'angle'; degrees: number; rightAngleMark?: boolean; parallelLines?: boolean; labels?: string[] }
    | { kind: 'circle'; showRadius?: boolean; showDiameter?: boolean; showChord?: boolean; centralAngle?: number; inscribedAngle?: number; labels?: string[] }
    | { kind: 'cube'; showHiddenEdges?: boolean; labels?: string[] }
    | { kind: 'prism'; baseSides: number; labels?: string[] }
    | { kind: 'cylinder'; showNet?: boolean; showRadius?: boolean; showHeight?: boolean }
    | { kind: 'pyramid'; baseSides: number }
    | { kind: 'cone'; showRadius?: boolean; showHeight?: boolean; showNet?: boolean }
    | { kind: 'parabola'; a: number; markX?: number }
    | { kind: 'bar_chart'; values: number[]; labels?: string[] }
    | { kind: 'dots'; counts: number[]; labels?: string[] }
    | { kind: 'number_sequence'; values: number[] }
    | { kind: 'fraction'; numerator: number; denominator: number; whole?: number }
    | { kind: 'fraction_operation'; left: { n: number; d: number }; right: { n: number; d: number }; op: '+' | '-' | '×' | '÷' | '>' | '<' }
    | { kind: 'map_symbol'; symbol: string };

export interface GeneralProblem {
    question: string;
    answer: string;
    options: string[];
    passage?: string;
    passageTitle?: string;
    hint?: string;
    unitLabel?: string;
    visual?: ProblemVisual;
    audioPrompt?: {
        text: string;
        lang?: string;
        autoPlay?: boolean;
    };
    speechPrompt?: {
        expected: string;
        alternates?: string[];
        keywords?: string[];
        minKeywordHits?: number;
        lang?: string;
        buttonLabel?: string;
        freeResponse?: boolean;
        examples?: string[];
    };
}

/**
 * 正解の選択肢とその他の選択肢を並べる。
 * シャッフルはコンポーネント側で行うため、ここでは行わない。
 */
export const d = (ans: string, ...others: string[]) => [ans, ...others];

export const normalizeProblemQuestionText = (question: string): string =>
    question
        .replace(/^【[^】]+】\s*/, '')
        .replace(/^(?:確認|復習)\s*\d+\s*の\s*/g, '')
        .replace(/^(?:確認|復習)\s*\d+\s*で\s*/g, '')
        .replace(/^(?:確認|復習)\s*\d+\s*を\s*/g, '')
        .replace(/^(?:確認|復習)\s*\d+\s*([にへと])\s*/g, '$1 ')
        .replace(/^(?:確認|復習)\s*\d+\s*/g, '')
        .replace(/【([^】]+)】\s*(?:確認|復習)\s*\d+\s*の\s*/g, '$1の学習の')
        .replace(/【([^】]+)】\s*(?:確認|復習)\s*\d+\s*で\s*/g, '$1の学習で ')
        .replace(/【([^】]+)】\s*(?:確認|復習)\s*\d+\s*を\s*/g, '$1を ')
        .replace(/【([^】]+)】\s*(?:確認|復習)\s*\d+\s*([にへと])\s*/g, '$1$2 ')
        .replace(/【([^】]+)】\s*(?:確認|復習)\s*\d+\s*/g, '$1の学習')
        .replace(/学習まとめ/g, '学習のまとめ')
        .replace(/\s*(?:確認|復習)\s*\d+\s*$/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/ \n/g, '\n')
        .trim();

export const stripReviewStepLabel = (label: string): string =>
    label
        .replace(/【([^】]+)】/g, '$1')
        .replace(/\s*(?:確認|復習)\s*\d+\s*/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

export const extractProblemUnitLabel = (question: string): string | null => {
    const match = question.match(/^【([^】]+)】/);
    return match ? stripReviewStepLabel(match[1]) : null;
};

export const normalizeProblemQuestionLabels = (problem: GeneralProblem): GeneralProblem => {
    const unitLabel = problem.unitLabel ?? extractProblemUnitLabel(problem.question) ?? undefined;
    const normalizedQuestion = normalizeProblemQuestionText(problem.question);
    return normalizedQuestion === problem.question && unitLabel === problem.unitLabel
        ? problem
        : { ...problem, question: normalizedQuestion, unitLabel };
};

const problemSignature = (problem: GeneralProblem): string =>
    JSON.stringify({
        question: problem.question,
        answer: problem.answer,
        options: problem.options,
        passage: problem.passage,
        passageTitle: problem.passageTitle,
        hint: problem.hint,
        unitLabel: problem.unitLabel,
        visual: problem.visual,
        audioPrompt: problem.audioPrompt,
        speechPrompt: problem.speechPrompt,
    });

export const fillGeneratedUnitProblems = (
    unitData: Record<string, GeneralProblem[]>,
    makeProblem: (unitId: string, n: number) => GeneralProblem,
    options: { min?: number; maxAttempts?: number; duplicatePatience?: number } = {},
): void => {
    const min = options.min ?? 50;
    const maxAttempts = options.maxAttempts ?? 240;
    const duplicatePatience = options.duplicatePatience ?? 80;

    Object.keys(unitData).forEach((unitId) => {
        const problems = unitData[unitId];
        const seen = new Set(problems.map(problemSignature));
        let n = problems.length;
        let duplicateStreak = 0;

        while (n < maxAttempts && (problems.length < min || duplicateStreak < duplicatePatience)) {
            const problem = makeProblem(unitId, n);
            const signature = problemSignature(problem);
            if (!seen.has(signature)) {
                problems.push(problem);
                seen.add(signature);
                duplicateStreak = 0;
            } else {
                duplicateStreak += 1;
            }
            n += 1;
        }

        while (problems.length < min) {
            problems.push(makeProblem(unitId, problems.length));
        }
    });
};
