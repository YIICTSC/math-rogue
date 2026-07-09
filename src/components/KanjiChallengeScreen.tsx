import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { audioService } from '../services/audioService';
import { AnswerMode, AssignmentAnswerResult, AssignmentReviewProblem, GameMode, LanguageMode } from '../types';
import { storageService } from '../services/storageService';
import { HARD_KANJI_DATA, KANJI_DATA, KANKEN_DATA, KanjiProblem } from '../data/kanjiData';
import { resolveAnswerMode } from '../utils/answerMode';
import RewardHintBanner from './RewardHintBanner';
import { trans } from '../utils/textUtils';

interface KanjiChallengeScreenProps {
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

interface ExtendedKanjiProblem extends KanjiProblem {
  actualCorrectAnswer: string;
  problemKey?: string;
  isAssignmentRetry?: boolean;
  retryOfProblemKey?: string;
}

const KanjiChallengeScreen: React.FC<KanjiChallengeScreenProps> = ({ onComplete, mode, answerMode = 'CHOICE' as AnswerMode, useSavedAnswerMode = false, debugSkip, isChallenge, streak = 0, rewardHint, languageMode = 'NORMAL', onAnswerResult, reviewProblem = null }) => {
  const resolvedAnswerMode = resolveAnswerMode(answerMode as AnswerMode, useSavedAnswerMode);
  const [problems, setProblems] = useState<ExtendedKanjiProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const questionStartedAtRef = React.useRef(Date.now());

  useEffect(() => {
    if (!isAnswered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAnswered, currentProblemIndex]);

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentProblemIndex]);

  // 表記のゆらぎ（スペース、括弧内の補足、全角半角など）を排除して比較する関数
  const normalize = (s: string) => {
    if (!s) return "";
    return s
      .replace(/\（.*?\）|\(.*?\)/g, "") // （）や()の中身を削除
      .replace(/[\s　]+/g, "")           // 全角・半角スペースを削除
      .trim();
  };

  useEffect(() => {
    if (debugSkip) {
        onComplete(1); 
        return;
    }

    if (!isChallenge) {
        try {
            audioService.playBGM('math');
        } catch (e) {
            console.warn("BGM playback failed", e);
        }
    }

    if (reviewProblem) {
      setProblems([{
        question: reviewProblem.question,
        options: [...new Set([reviewProblem.correctAnswer, ...(reviewProblem.options || [])])].slice(0, 4).sort(() => Math.random() - 0.5),
        hint: undefined,
        actualCorrectAnswer: reviewProblem.correctAnswer,
        problemKey: reviewProblem.problemKey,
        isAssignmentRetry: true,
        retryOfProblemKey: reviewProblem.problemKey,
      }]);
      return;
    }

    let problemPool: KanjiProblem[];
    if (mode === GameMode.KANJI_MIXED) {
        problemPool = Object.values(KANJI_DATA).flat();
    } else if (mode === GameMode.KANKEN_MIXED) {
        problemPool = Object.values(KANKEN_DATA).flat();
    } else if (mode === GameMode.HARD_KANJI_MIXED) {
        problemPool = Object.values(HARD_KANJI_DATA).flat();
    } else if (mode in KANKEN_DATA) {
        const kankenKey = mode as keyof typeof KANKEN_DATA;
        problemPool = KANKEN_DATA[kankenKey];
    } else if (mode in HARD_KANJI_DATA) {
        const hardKanjiKey = mode as keyof typeof HARD_KANJI_DATA;
        problemPool = HARD_KANJI_DATA[hardKanjiKey];
    } else {
        const gradeKey = mode as keyof typeof KANJI_DATA;
        problemPool = KANJI_DATA[gradeKey] || KANJI_DATA.KANJI_1;
    }
    
    const count = isChallenge ? 1 : 3;
    const shuffled = [...problemPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map(p => {
            // 指示通り、options[0]を絶対的な正解として保持する
            const correctAnswer = p.options[0];
            const contextualOptions = p.distractorPool && p.distractorPool.length >= 3
                ? [correctAnswer, ...p.distractorPool.slice(0, 3)]
                : p.options;
            return {
                ...p,
                problemKey: `${mode}:${p.question}`,
                actualCorrectAnswer: correctAnswer,
                // 表示用にはシャッフルした選択肢を渡す
                options: [...contextualOptions].sort(() => Math.random() - 0.5)
            };
        });
        
    setProblems(shuffled);
  }, [mode, debugSkip, isChallenge, reviewProblem]);

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    // 選択された文字列と、保持していた正解文字列を正規化して比較
    const isCorrect = normalize(option) === normalize(problems[currentProblemIndex].actualCorrectAnswer);
    const answerResult = {
      mode,
      correct: isCorrect,
      elapsedMs: Date.now() - questionStartedAtRef.current,
      problemKey: problems[currentProblemIndex].problemKey || `${mode}:${problems[currentProblemIndex].question}`,
      question: problems[currentProblemIndex].question,
      correctAnswer: problems[currentProblemIndex].actualCorrectAnswer,
      selectedAnswer: option,
      isRetry: problems[currentProblemIndex].isAssignmentRetry,
      retryOfProblemKey: problems[currentProblemIndex].retryOfProblemKey,
    };
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('CORRECT');
      audioService.playSound('correct');
      const currentTotal = storageService.getMathCorrectCount();
      storageService.saveMathCorrectCount(currentTotal + 1);
      
      const currentStreak = storageService.getHintStreaks()[mode] || 0;
      storageService.saveHintStreak(mode, currentStreak + 1);
    } else {
      setFeedback('WRONG');
      audioService.playSound('wrong');
      storageService.saveHintStreak(mode, 0);
    }

    setTimeout(() => {
      onAnswerResult?.(answerResult);
      if (isChallenge) {
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
    if (normalize(inputAnswer) === '') return;
    handleAnswer(inputAnswer);
  };

  useEffect(() => {
    if (!isAnswered && problems.length > 0 && resolvedAnswerMode === 'INPUT') {
      const normalizedInput = normalize(inputAnswer);
      if (normalizedInput && normalizedInput === normalize(problems[currentProblemIndex]?.actualCorrectAnswer)) {
        handleAnswer(inputAnswer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputAnswer]);

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;

  if (problems.length === 0) return (
      <div className="flex flex-col h-full w-full bg-cyan-950 text-white items-center justify-center p-8 font-mono">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="main-challenge-screen flex flex-col h-full w-full bg-cyan-950 text-white relative items-center justify-center p-8 font-mono">
        <div className="absolute inset-0 texture-dark-matter opacity-20 pointer-events-none"></div>
        <RewardHintBanner text={rewardHint} languageMode={languageMode} />
        
        <div className="basic-challenge-layout z-10 w-full max-w-md text-center">
            <div className="basic-challenge-question bg-black/40 border-4 border-white p-8 rounded-lg mb-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
                {currentProblem.hint && (storageService.getHintStreaks()[mode] || 0) < 3 && (
                    <div className="bg-blue-900/40 p-2 rounded border border-blue-500/30 mb-4 w-full animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] text-blue-300 font-bold mb-1">{trans('ヒント', languageMode)}</div>
                        <div className="text-xs text-gray-200 leading-relaxed">{currentProblem.hint}</div>
                    </div>
                )}
                <div className="text-xs text-gray-400 mb-2">{trans('この漢字の読み方は？', languageMode)}</div>
                <h3 className="text-7xl font-bold text-white tracking-widest font-serif">{currentProblem.question}</h3>
                
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
                  className={`w-full rounded-lg border-4 bg-white px-4 py-4 text-center text-2xl font-black text-slate-950 outline-none transition-colors ${isAnswered ? 'border-slate-400 opacity-80' : 'border-cyan-500 focus:border-yellow-300'}`}
                  placeholder={trans('読み方を入力', languageMode)}
                />
                <button
                  type="submit"
                  disabled={isAnswered || normalize(inputAnswer) === ''}
                  className="w-full rounded-lg border-b-4 border-cyan-950 bg-cyan-700 py-4 text-xl font-bold transition-all hover:bg-cyan-600 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {trans('決定', languageMode)}
                </button>
              </form>
            ) : (
              <div className="basic-challenge-options grid grid-cols-2 gap-4">
                {currentProblem.options.map((opt, idx) => {
                  const isCorrectOption = normalize(opt) === normalize(problems[currentProblemIndex].actualCorrectAnswer);
                  const isSelectedWrong = opt === selectedOption && !isCorrectOption;
                  return (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={isAnswered}
                        className={`
                            py-4 text-xl font-bold rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${isAnswered && isCorrectOption ? 'bg-green-600 border-green-800 scale-105' : ''}
                            ${isAnswered && isSelectedWrong ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered || (!isCorrectOption && !isSelectedWrong) ? 'bg-cyan-700 border-cyan-900' : ''}
                            ${!isAnswered ? 'hover:bg-cyan-600 cursor-pointer' : 'opacity-80'}
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

export default KanjiChallengeScreen;
