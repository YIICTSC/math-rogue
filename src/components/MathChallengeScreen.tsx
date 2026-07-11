
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { audioService } from '../services/audioService';
import { AnswerMode, AssignmentAnswerResult, AssignmentReviewProblem, GameMode, LanguageMode } from '../types';
import { storageService } from '../services/storageService';
import { resolveAnswerMode } from '../utils/answerMode';
import { getUnitBoardSummary } from '../data/unitBoardSummaries';
import RewardHintBanner from './RewardHintBanner';
import UnitBoardModal from './UnitBoardModal';
import { trans } from '../utils/textUtils';

interface MathProblem {
  question: string;
  options: number[];
  answer: number;
  problemKey?: string;
  isAssignmentRetry?: boolean;
  retryOfProblemKey?: string;
}

const MathChallengeScreen: React.FC<MathChallengeScreenProps> = ({ onComplete, mode, answerMode = 'CHOICE' as AnswerMode, useSavedAnswerMode = false, debugSkip, isChallenge, streak = 0, rewardHint, languageMode = 'NORMAL', onAnswerResult, reviewProblem = null }) => {
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

    try {
      const seenKey = `unit-board-seen:${unitBoardSummary.id}`;
      if (window.localStorage.getItem(seenKey) === '1') return;
      setIsUnitBoardOpen(true);
    } catch {
      setIsUnitBoardOpen(true);
    }
  }, [reviewProblem, unitBoardSummary]);

  const handleUnitBoardClose = useCallback(() => {
    if (unitBoardSummary) {
      try {
        window.localStorage.setItem(`unit-board-seen:${unitBoardSummary.id}`, '1');
      } catch {
        // Storage can be unavailable in restricted browsers; closing the modal should still work.
      }
    }
    setIsUnitBoardOpen(false);
  }, [unitBoardSummary]);

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
    const generatedProblems: MathProblem[] = [];
    // チャレンジモードなら1問、通常なら3問生成
    const count = isChallenge ? 1 : 3;

    for (let i = 0; i < count; i++) {
      let a, b, answer, operator;
      let type = safeMode;
      
      if (safeMode === GameMode.MIXED) {
          const types = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION];
          type = types[Math.floor(Math.random() * types.length)];
      }

      switch (type) {
          case GameMode.ADD_1DIGIT:
              // 繰り上がりなし: a + b <= 9
              a = Math.floor(Math.random() * 8) + 1; // 1~8
              b = Math.floor(Math.random() * (9 - a)) + 1; // 1~(9-a)
              answer = a + b;
              operator = '+';
              break;
          case GameMode.ADD_1DIGIT_CARRY:
              // くりあがりあり: a + b >= 10
              a = Math.floor(Math.random() * 9) + 1;
              // bは 10-a 以上の数
              b = Math.floor(Math.random() * (9 - (10 - a) + 1)) + (10 - a);
              if (b < 1) b = 1; // セーフティ
              answer = a + b;
              operator = '+';
              break;
          case GameMode.SUB_1DIGIT:
              // くりさがりなし: 1ケタ同士で a >= b
              a = Math.floor(Math.random() * 9) + 1; // 1~9
              b = Math.floor(Math.random() * a) + 1; // 1~a
              answer = a - b;
              operator = '-';
              break;
          case GameMode.SUB_1DIGIT_BORROW:
              // くりさがりあり: 11-18 の数から 1-9 を引き、答えが1ケタ
              answer = Math.floor(Math.random() * 9) + 1; // 答えも1ケタ
              b = Math.floor(Math.random() * 9) + 1;
              a = answer + b;
              // 繰り下がりの定義として a が 10以上である必要がある
              if (a < 10) {
                // 再生成の代わりに補正
                a += 10;
                answer = a - b;
              }
              operator = '-';
              break;
          case GameMode.ADDITION:
              a = Math.floor(Math.random() * 40) + 10;
              b = Math.floor(Math.random() * 40) + 10;
              answer = a + b;
              operator = '+';
              break;
          case GameMode.SUBTRACTION:
              a = Math.floor(Math.random() * 50) + 20;
              b = Math.floor(Math.random() * (a - 10)) + 5;
              answer = a - b;
              operator = '-';
              break;
          case GameMode.DIVISION:
              b = Math.floor(Math.random() * 8) + 2;
              answer = Math.floor(Math.random() * 9) + 1;
              a = b * answer;
              operator = '÷';
              break;
          case GameMode.MULTIPLICATION:
          default:
              a = Math.floor(Math.random() * 9) + 1;
              b = Math.floor(Math.random() * 9) + 1;
              answer = a * b;
              operator = '×';
              break;
      }
      
      const options = new Set<number>();
      options.add(answer);
      while (options.size < 4) {
        let wrong = answer + (Math.floor(Math.random() * 10) - 5);
        if (wrong < 0) wrong = Math.floor(Math.random() * 20); 
        if (wrong !== answer) options.add(wrong);
      }
      
      generatedProblems.push({
        question: `${a} ${operator} ${b} = ?`,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        answer: answer,
        problemKey: `${type}:${a}${operator}${b}`,
      });
    }
    setProblems(generatedProblems);
  }, [mode, debugSkip, isChallenge, reviewProblem]);

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentProblemIndex]);

  const normalizeNumberInput = (value: string) => value
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
    .replace(/[，,]/g, '')
    .replace(/[\s　]+/g, '')
    .trim();

  const handleAnswer = (option: number) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const isCorrect = option === problems[currentProblemIndex].answer;
    const answerResult = {
      mode,
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
      audioService.playSound('correct');
      const currentTotal = storageService.getMathCorrectCount();
      storageService.saveMathCorrectCount(currentTotal + 1);
    } else {
      setFeedback('WRONG');
      audioService.playSound('wrong');
    }

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

  const handleInputSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeNumberInput(inputAnswer);
    if (!normalized) return;
    const numericAnswer = Number(normalized);
    if (!Number.isFinite(numericAnswer)) {
      handleAnswer(Number.NaN);
      return;
    }
    handleAnswer(numericAnswer);
  };

  useEffect(() => {
    if (!isAnswered && problems.length > 0 && resolvedAnswerMode === 'INPUT') {
      const normalized = normalizeNumberInput(inputAnswer);
      if (normalized) {
        const numericAnswer = Number(normalized);
        if (numericAnswer === problems[currentProblemIndex]?.answer) {
          handleAnswer(numericAnswer);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputAnswer]);

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;

  if (problems.length === 0) return (
      <div className="flex flex-col h-full w-full bg-emerald-950 text-white items-center justify-center p-8 font-mono">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];

  return (
    <div data-gamepad-initial-scope={`math-challenge-${currentProblemIndex}`} className="main-challenge-screen flex flex-col h-full w-full bg-emerald-950 text-white relative items-center justify-center p-8 font-mono">
        <div className="absolute inset-0 texture-blackboard opacity-20 pointer-events-none"></div>
        <RewardHintBanner text={rewardHint} languageMode={languageMode} />
        {unitBoardSummary && (
            <button
                type="button"
                onClick={() => setIsUnitBoardOpen(true)}
                className="absolute left-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-yellow-100/45 bg-black/35 text-yellow-100 shadow-lg transition hover:bg-black/55"
                aria-label={trans('単元板書を開く', languageMode)}
                title={trans('単元板書', languageMode)}
            >
                <BookOpen size={22} />
            </button>
        )}
        <UnitBoardModal summary={unitBoardSummary} open={isUnitBoardOpen} onClose={handleUnitBoardClose} />
        
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
                  onChange={(event) => setInputAnswer(event.target.value)}
                  disabled={isAnswered}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9０-９,，\\s]*"
                  className={`w-full rounded-lg border-4 bg-white px-4 py-4 text-center text-3xl font-black text-slate-950 outline-none transition-colors ${isAnswered ? 'border-slate-400 opacity-80' : 'border-blue-500 focus:border-yellow-300'}`}
                  placeholder={trans('答えを入力', languageMode)}
                />
                <button
                  type="submit"
                  disabled={isAnswered || normalizeNumberInput(inputAnswer) === ''}
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
}
