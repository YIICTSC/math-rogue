import React, { useCallback, useRef, useState } from 'react';
import { BookOpen, Heart, Sparkles } from 'lucide-react';
import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, LanguageMode } from '../types';
import MiniGameProblemChallenge from './MiniGameProblemChallenge';

const REQUIRED_CORRECT_ANSWERS = 6;

interface RpgDefeatChallengeScreenProps {
  mode: GameMode;
  modePool?: string[];
  answerMode: AnswerMode;
  assignment?: AssignmentPayload | null;
  onAnswerResult: (result: AssignmentAnswerResult) => void;
  onComplete: () => void;
  languageMode: LanguageMode;
}

const RpgDefeatChallengeScreen: React.FC<RpgDefeatChallengeScreenProps> = ({
  mode,
  modePool,
  answerMode,
  assignment,
  onAnswerResult,
  onComplete,
  languageMode,
}) => {
  const [correctCount, setCorrectCount] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const correctCountRef = useRef(0);
  const completedRef = useRef(false);

  const handleQuestionComplete = useCallback((questionCorrectCount: number) => {
    if (completedRef.current) return;

    const nextCorrectCount = correctCountRef.current + (questionCorrectCount > 0 ? 1 : 0);
    correctCountRef.current = nextCorrectCount;
    if (questionCorrectCount > 0) setCorrectCount(nextCorrectCount);

    if (nextCorrectCount >= REQUIRED_CORRECT_ANSWERS) {
      completedRef.current = true;
      onComplete();
      return;
    }

    setQuestionIndex(index => index + 1);
  }, [onComplete]);

  const copy = languageMode === 'ENGLISH'
    ? {
        title: 'Defeat Recovery Quiz',
        instructions: 'Answer 6 questions correctly to return to the map. Wrong answers do not reduce your progress.',
        progress: 'Correct answers',
        reward: 'Answer correctly to recover and continue your adventure.',
      }
    : languageMode === 'HIRAGANA'
      ? {
          title: 'まけたあとの もんだい',
          instructions: '6もん せいかいすると マップに もどれます。まちがえても せいかいすうは へりません。',
          progress: 'せいかい',
          reward: 'もんだいに こたえて、ぼうけんを つづけよう。',
        }
      : {
          title: '敗北後の問題',
          instructions: '6問正解するとマップに戻れます。間違えても正解数は減りません。',
          progress: '正解数',
          reward: '問題に答えて、冒険を再開しよう。',
        };

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col bg-slate-950 text-white" data-gamepad-navigation-root>
      <header className="shrink-0 border-b border-amber-300/30 bg-slate-900 px-4 py-3 sm:px-8 sm:py-5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-lg font-black text-amber-100 sm:text-2xl">
              <BookOpen className="shrink-0 text-amber-300" size={22} />
              <span>{copy.title}</span>
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">{copy.instructions}</p>
          </div>
          <div className="shrink-0 rounded-xl border border-emerald-300/40 bg-emerald-950/70 px-3 py-2 text-center sm:px-5">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-200 sm:text-xs">
              <Heart size={13} /> {copy.progress}
            </div>
            <div className="font-mono text-lg font-black text-white sm:text-2xl" aria-live="polite">
              {correctCount} / {REQUIRED_CORRECT_ANSWERS}
            </div>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-5xl shrink-0 items-center gap-2 px-4 pt-2 text-[11px] font-semibold text-amber-100/80 sm:px-8 sm:pt-3 sm:text-xs">
          <Sparkles size={14} className="shrink-0 text-amber-300" />
          <span>{copy.reward}</span>
        </div>
        <div className="min-h-0 flex-1" data-allow-japanese="true">
          <MiniGameProblemChallenge
            key={questionIndex}
            mode={mode}
            modePool={modePool}
            answerMode={answerMode}
            assignment={assignment}
            onAnswerResult={onAnswerResult}
            onComplete={handleQuestionComplete}
            isChallenge
            problemOffset={questionIndex}
            languageMode={languageMode}
          />
        </div>
      </div>
    </div>
  );
};

export default RpgDefeatChallengeScreen;
