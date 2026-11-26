import {awardAnswer} from '../point-exchange/store';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { audioService } from '../services/audioService';
import { AnswerMode, AssignmentAnswerResult, AssignmentReviewProblem, AssignmentUnit, GameMode, LanguageMode } from '../types';
import { storageService } from '../services/storageService';
import { resolveAnswerMode } from '../utils/answerMode';
import { getUnitBoardSummary } from '../data/unitBoardSummaries';
import RewardHintBanner from './RewardHintBanner';
import UnitBoardModal from './UnitBoardModal';
import { claimUnitBoardFirstDisplay } from '../utils/unitBoardSeen';
import { trans } from '../utils/textUtils';
import { assignmentFilterForMode } from '../utils/assignmentRangeFilters';
import { getProblemCycleScope, selectProblemsForCycle } from '../utils/problemCycle';
import { normalizeSchoolNumber } from '../utils/schoolAnswer';
import { useSchoolAnswerInput } from '../utils/useSchoolAnswerInput';
import { arithmeticPool } from '../mini-games/gakuro-kart/arithmetic';

interface MathProblem {
  question: string;
  options: number[];
  answer: number;
  problemKey?: string;
  isAssignmentRetry?: boolean;
  retryOfProblemKey?: string;
}

const MathChallengeScreen: React.FC<MathChallengeScreenProps> = ({ onComplete, mode, answerMode = 'CHOICE' as AnswerMode, useSavedAnswerMode = false, debugSkip, isChallenge, streak = 0, rewardHint, languageMode = 'JAPANESE', onAnswerResult, reviewProblem = null, assignmentUnits }) => {
  const pointQuestionRef = React.useRef<{problem:unknown;index:number;receipt:string}>({problem:null,index:-1,receipt:''});
  const getPointReceipt=(problem:unknown,index:number)=>{const q=pointQuestionRef.current;if(q.problem!==problem||q.index!==index){q.problem=problem;q.index=index;q.receipt=crypto.randomUUID();}return q.receipt;};
  const resolvedAnswerMode = resolveAnswerMode(answerMode as AnswerMode, useSavedAnswerMode);
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const questionStartedAtRef = useRef(Date.now());
  const unitBoardAutoShownRef = useRef<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [isUnitBoardOpen, setIsUnitBoardOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const unitBoardSummary = useMemo(() => getUnitBoardSummary(mode), [mode]);

  useEffect(() => {
    if (!unitBoardSummary || reviewProblem) return;
    if (unitBoardAutoShownRef.current === unitBoardSummary.id) return;
    unitBoardAutoShownRef.current = unitBoardSummary.id;

    if (claimUnitBoardFirstDisplay(unitBoardSummary.id)) setIsUnitBoardOpen(true);
  }, [reviewProblem, unitBoardSummary]);

  const handleUnitBoardClose = useCallback(() => {
    setIsUnitBoardOpen(false);
  }, []);

  useEffect(() => {
    if (!isAnswered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAnswered, currentProblemIndex]);

  useEffect(() => {
    if (debugSkip) {
        onComplete(1); 
        return;
    }

    // チャレンジモード以外の場合のみ専用BGMを流す
    if (!isChallenge) {
        try {
            audioService.playBGM('math');
        } catch (e) {
            console.warn("BGM playback failed", e);
        }
    }

    if (reviewProblem) {
      const answer = Number(reviewProblem.correctAnswer);
      const optionValues = [...new Set([answer, ...(reviewProblem.options || []).map((option) => Number(option)).filter(Number.isFinite)])];
      setProblems([{
        question: reviewProblem.question,
        options: optionValues.length >= 4 ? optionValues.slice(0, 4).sort(() => Math.random() - 0.5) : [answer, answer + 1, answer - 1, answer + 2].sort(() => Math.random() - 0.5),
        answer,
        problemKey: reviewProblem.problemKey,
        isAssignmentRetry: true,
        retryOfProblemKey: reviewProblem.problemKey,
      }]);
      return;
    }

    const safeMode = mode || GameMode.MULTIPLICATION;
    const rangeFilter = assignmentFilterForMode(assignmentUnits, safeMode);
    const count = isChallenge ? 1 : 3;
    const quotientEnding = languageMode === 'ENGLISH' ? ' — whole-number quotient?' : languageMode === 'HIRAGANA' ? ' の しょうは？' : ' の商は？';
    const generatedProblems = arithmeticPool(safeMode, rangeFilter).map(problem =>
      problem.remainder === undefined ? problem : { ...problem, question: problem.question.replace(' = ?', quotientEnding) },
    );
    const cycleScope = getProblemCycleScope(String(safeMode), rangeFilter);
    const cycleProblems = selectProblemsForCycle(
      generatedProblems,
      count,
      () => cycleScope,
      (problem) => problem.problemKey || `${safeMode}:${problem.question}`,
    );
    setProblems(cycleProblems);
  }, [mode, debugSkip, isChallenge, reviewProblem, assignmentUnits, languageMode]);

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentProblemIndex]);

  const submittedProblem = useRef<MathProblem | undefined>(undefined);
  const handleAnswer = (option: number) => {
    const problem = problems[currentProblemIndex];
    if (!problem || isAnswered || submittedProblem.current === problem) return;
    submittedProblem.current = problem;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const isCorrect = option === problems[currentProblemIndex].answer;
    const answerResult = {
      pointReceipt: getPointReceipt(problems[currentProblemIndex],currentProblemIndex),
      mode,
      subjectId: mode,
      correct: isCorrect,
      elapsedMs: Date.now() - questionStartedAtRef.current,
      problemKey: problems[currentProblemIndex].problemKey || `${mode}:${problems[currentProblemIndex].question}`,
      question: problems[currentProblemIndex].question,
      correctAnswer: String(problems[currentProblemIndex].answer),
      selectedAnswer: Number.isNaN(option) ? inputAnswer : String(option),
      isRetry: problems[currentProblemIndex].isAssignmentRetry,
      retryOfProblemKey: problems[currentProblemIndex].retryOfProblemKey,
    };
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('CORRECT');
      try { audioService.playSound('correct'); } catch { /* Audio failure must not strand the answered question. */ }
      if (!problems[currentProblemIndex].isAssignmentRetry) {
        const cycleScope = getProblemCycleScope(String(mode), assignmentFilterForMode(assignmentUnits, mode));
        storageService.markProblemCycleCorrect(cycleScope, answerResult.problemKey);
      }
      const currentTotal = storageService.getMathCorrectCount();
      storageService.saveMathCorrectCount(currentTotal + 1);
    } else {
      setFeedback('WRONG');
      try { audioService.playSound('wrong'); } catch { /* Audio failure must not strand the answered question. */ }
    }

    if (!debugSkip) void awardAnswer(answerResult);

    setTimeout(() => {
      onAnswerResult?.(answerResult);
      if (isChallenge) {
          // チャレンジモードは1問ごとに結果を返す（不正解なら0、正解なら1）
          onComplete(isCorrect ? 1 : 0);
      } else if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(prev => prev + 1);
        setSelectedOption(null);
        setInputAnswer('');
        setIsAnswered(false);
        setFeedback(null);
      } else {
        onComplete(isCorrect ? correctCount + 1 : correctCount);
      }
    }, 1000);
  };

  const { isComposing, ...inputEvents } = useSchoolAnswerInput(setInputAnswer, (value) => {
    const problem = problems[currentProblemIndex];
    if (problem && normalizeSchoolNumber(value) === String(problem.answer)) handleAnswer(problem.answer);
  });
  const handleInputSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = problems[currentProblemIndex];
    if (isComposing() || !problem || !inputAnswer.trim()) return;
    handleAnswer(normalizeSchoolNumber(inputAnswer) === String(problem.answer) ? problem.answer : Number.NaN);
  };

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;

  if (problems.length === 0) return (
      <div className="flex flex-col h-full w-full bg-emerald-950 text-white items-center justify-center p-8 font-mono">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];

  return (
    <div data-gamepad-navigation-root data-gamepad-question-screen data-gamepad-initial-scope={`math-challenge-${currentProblemIndex}`} className="main-challenge-screen flex flex-col h-full w-full bg-emerald-950 text-white relative items-center justify-center p-8 font-mono">
        <div className="absolute inset-0 texture-blackboard opacity-20 pointer-events-none"></div>
        <RewardHintBanner text={rewardHint} languageMode={languageMode} />
        {unitBoardSummary && (
            <button
                type="button"
                onClick={() => setIsUnitBoardOpen(true)}
                data-gamepad-zone="challenge-tools"
                data-gamepad-order={0}
                className="unit-board-open-button absolute left-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-yellow-100/45 bg-black/35 text-yellow-100 shadow-lg transition hover:bg-black/55"
                aria-label={trans('単元板書を開く', languageMode)}
                title={trans('単元板書', languageMode)}
            >
                <BookOpen size={22} />
            </button>
        )}
        <UnitBoardModal summary={unitBoardSummary} open={isUnitBoardOpen} onClose={handleUnitBoardClose} languageMode={languageMode} />
        
        <div className="basic-challenge-layout z-10 w-full max-w-md text-center">
            <div className="basic-challenge-question bg-black/40 border-4 border-white p-8 rounded-lg mb-8 shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[160px]">
                <h3 className="text-5xl font-bold text-white tracking-widest font-mono">{currentProblem.question}</h3>
                
                {feedback && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 animate-in zoom-in duration-200">
                        {feedback === 'CORRECT' ? (
                            <CheckCircle size={120} className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
                        ) : (
                            <XCircle size={120} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                        )}
                    </div>
                )}
            </div>

            {resolvedAnswerMode === 'INPUT' ? (
              <form onSubmit={handleInputSubmit} className="basic-challenge-options space-y-3">
                <input
                  ref={inputRef}
                  value={inputAnswer}
                  {...inputEvents}
                  disabled={isAnswered}
                  autoFocus
                  inputMode="numeric"
                  className={`w-full rounded-lg border-4 bg-white px-4 py-4 text-center text-3xl font-black text-slate-950 outline-none transition-colors ${isAnswered ? 'border-slate-400 opacity-80' : 'border-blue-500 focus:border-yellow-300'}`}
                  placeholder={trans('答えを入力', languageMode)}
                />
                <button
                  type="submit"
                  disabled={isAnswered || inputAnswer.trim() === ''}
                  className="w-full rounded-lg border-b-4 border-blue-900 bg-blue-600 py-4 text-xl font-bold transition-all hover:bg-blue-500 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {trans('決定', languageMode)}
                </button>
              </form>
            ) : (
              <div className="basic-challenge-options grid grid-cols-2 gap-4">
                {currentProblem.options.map((opt, idx) => {
                  const isCorrectOption = opt === currentProblem.answer;
                  const isSelectedWrong = opt === selectedOption && !isCorrectOption;
                  return (
                    <button
                        key={idx}
                        data-gamepad-initial-choice
                        data-gamepad-zone="challenge-options"
                        data-gamepad-order={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={isAnswered}
                        className={`
                            py-4 text-2xl font-bold rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${isAnswered && isCorrectOption ? 'bg-green-600 border-green-800 scale-105' : ''}
                            ${isAnswered && isSelectedWrong ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered || (!isCorrectOption && !isSelectedWrong) ? 'bg-blue-600 border-blue-800' : ''}
                            ${!isAnswered ? 'hover:bg-blue-500 cursor-pointer' : 'opacity-80'}
                        `}
                    >
                        {opt}
                    </button>
                  );
                })}
              </div>
            )}
        </div>
    </div>
  );
};

export default MathChallengeScreen;
interface MathChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  answerMode?: AnswerMode;
  useSavedAnswerMode?: boolean;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
  rewardHint?: string;
  languageMode?: LanguageMode;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
  reviewProblem?: AssignmentReviewProblem | null;
  assignmentUnits?: AssignmentUnit[];
}
