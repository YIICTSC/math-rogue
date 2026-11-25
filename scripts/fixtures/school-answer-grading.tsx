import React from 'react';
import { createRoot } from 'react-dom/client';
import GeneralChallengeScreen from '../../src/components/GeneralChallengeScreen';
import MathChallengeScreen from '../../src/components/MathChallengeScreen';
import KanjiChallengeScreen from '../../src/components/KanjiChallengeScreen';
import EnglishChallengeScreen from '../../src/components/EnglishChallengeScreen';
import { SUBJECT_DATA } from '../../src/data/subjectData';
import type { AnswerMode, AssignmentAnswerResult, AssignmentReviewProblem, GameMode } from '../../src/types';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') as GameMode;
const answerMode: AnswerMode = params.get('input') === '1' ? 'INPUT' : 'CHOICE';
const question = params.get('question') || '';
const reviewAnswer = params.get('reviewAnswer');
const outcome = { result: null as AssignmentAnswerResult | null, correctCount: null as number | null };
Object.assign(window, { schoolAnswerOutcome: outcome });

const props = {
  mode, answerMode, isChallenge: true,
  onComplete: (correctCount: number) => { outcome.correctCount = correctCount; },
  onAnswerResult: (result: AssignmentAnswerResult) => { outcome.result = result; },
};
const reviewProblem: AssignmentReviewProblem | null = reviewAnswer === null ? null : {
  mode, problemKey: 'school-answer-test', question, correctAnswer: reviewAnswer, options: params.getAll('option'),
};

let screen;
switch (params.get('screen')) {
  case 'math': screen = <MathChallengeScreen {...props} reviewProblem={reviewProblem} />; break;
  case 'kanji': screen = <KanjiChallengeScreen {...props} reviewProblem={reviewProblem} />; break;
  case 'english': screen = <EnglishChallengeScreen {...props} reviewProblem={reviewProblem} />; break;
  default: {
    if (reviewProblem) {
      screen = <GeneralChallengeScreen {...props} reviewProblem={reviewProblem} previewOnly />;
      break;
    }
    const problem = SUBJECT_DATA[mode]?.find(entry => entry.question === question);
    if (!problem) throw new Error('Could not find curriculum problem: ' + question);
    screen = <GeneralChallengeScreen {...props} debugProblems={[problem]} previewOnly />;
  }
}

createRoot(document.getElementById('root')!).render(screen);
