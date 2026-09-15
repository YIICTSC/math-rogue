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
export const d = (ans: string, ...others: string[]) => {
    const choices = Array.from(new Set([ans, ...others]));
    const addChoice = (choice: string) => {
        if (choices.length < 4 && choice !== ans && !choices.includes(choice)) choices.push(choice);
    };

    // 計算問題では、誤答候補が正解や互いに重なった場合も
    // 「どれでもない」のような汎用選択肢へすぐ逃げず、答えの形式を保った
    // 近い数値を補う。低学年の計算・単位問題ほど自然な4択になる。
    const fraction = ans.match(/^(-?\d+)\/(\d+)(.*)$/);
    if (fraction && choices.length < 4) {
        const numerator = Number(fraction[1]);
        const denominator = Number(fraction[2]);
        const suffix = fraction[3];
        addChoice(`${numerator + 1}/${denominator}${suffix}`);
        if (numerator > 0) addChoice(`${numerator - 1}/${denominator}${suffix}`);
        addChoice(`${numerator}/${denominator + 1}${suffix}`);
        addChoice(`${numerator + 1}/${denominator + 1}${suffix}`);
    }

    const numeric = ans.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
    if (numeric && choices.length < 4) {
        const value = Number(numeric[1]);
        const suffix = numeric[2];
        const decimals = numeric[1].includes('.') ? numeric[1].split('.')[1].length : 0;
        const format = (candidate: number) => decimals > 0 ? candidate.toFixed(decimals) : String(candidate);
        const step = decimals > 0 ? 10 ** -decimals : 1;
        addChoice(`${format(value + step)}${suffix}`);
        addChoice(`${format(value + step * 2)}${suffix}`);
        if (value - step >= 0) addChoice(`${format(value - step)}${suffix}`);
        addChoice(`${format(value + step * 3)}${suffix}`);
    }

    const allEnglish = [ans, ...others].every((choice) => /^[A-Za-z][A-Za-z .,'!?-]*$/.test(choice));
    const fallbacks = allEnglish
        ? ['none of these', 'another answer', 'not applicable']
        : ['わからない', 'どちらでもない', 'あてはまらない'];
    for (const fallback of fallbacks) {
        if (choices.length >= 4) break;
        addChoice(fallback);
    }
    return choices.slice(0, 4);
};

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
    options: { min?: number; maxAttempts?: number; duplicatePatience?: number; stopAtMin?: boolean } = {},
): void => {
    const min = options.min ?? 50;
    const maxAttempts = options.maxAttempts ?? 240;
    const duplicatePatience = options.duplicatePatience ?? 80;
    const stopAtMin = options.stopAtMin === true;

    Object.keys(unitData).forEach((unitId) => {
        const problems = unitData[unitId];
        // もともとの単元データ側に完全一致の重複がある場合も、生成前に
        // 1件へ整理する。生成ロジックだけを重複防止しても、種データの
        // 重複は残り続けるため、ここで一元的に除外する。
        const uniqueProblems = new Map<string, GeneralProblem>();
        problems.forEach((problem) => {
            const signature = problemSignature(problem);
            if (!uniqueProblems.has(signature)) uniqueProblems.set(signature, problem);
        });
        if (uniqueProblems.size !== problems.length) {
            problems.splice(0, problems.length, ...uniqueProblems.values());
        }

        const seen = new Set(problems.map(problemSignature));
        let n = problems.length;
        let duplicateStreak = 0;

        while (
            n < maxAttempts
            && (problems.length < min || (!stopAtMin && duplicateStreak < duplicatePatience))
        ) {
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

        // 品質優先モードでは、生成パターンを使い切った後に同一問題を
        // 水増しして最低件数へ合わせない。実際に異なる問題だけを残す。
        if (!stopAtMin) {
            while (problems.length < min) {
                problems.push(makeProblem(unitId, problems.length));
            }
        }
    });
};
