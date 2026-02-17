
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { audioService } from '../services/audioService';
import { GameMode } from '../types';
import { storageService } from '../services/storageService';
import { SUBJECT_DATA, GeneralProblem } from '../data/subjectData';

interface GeneralChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
}

// 内部的に正解を保持するための拡張型
interface ExtendedGeneralProblem extends GeneralProblem {
  actualCorrectAnswer: string;
}

// 教科に応じた背景色の取得
const getBackgroundClass = (mode: string) => {
    if (mode.startsWith('MATH')) return 'bg-emerald-950';
    if (mode.startsWith('SCIENCE') || mode.startsWith('LIFE')) return 'bg-amber-950';
    if (mode.startsWith('SOCIAL') || mode.includes('GEOGRAPHY') || mode.includes('HISTORY') || mode.includes('CIVICS')) return 'bg-orange-950';
    if (mode.startsWith('MAP_') || mode.startsWith('PREF_') || mode.startsWith('PREFECTURES')) return 'bg-rose-950';
    if (mode.startsWith('IT_')) return 'bg-indigo-950'; // ICT系はインディゴ
    return 'bg-slate-900';
};

const GeneralChallengeScreen: React.FC<GeneralChallengeScreenProps> = ({ onComplete, mode, debugSkip, isChallenge, streak = 0 }) => {
  const [problems, setProblems] = useState<ExtendedGeneralProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

  const normalize = (s: string) => {
    if (!s) return "";
    return s
      .replace(/\（.*?\）|\(.*?\)/g, "") // 括弧削除
      .replace(/[\s　]+/g, "")           // 空白削除
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

    let problemPool: GeneralProblem[] = SUBJECT_DATA[mode] || SUBJECT_DATA.MAP_SYMBOLS;
    
    const count = isChallenge ? 1 : 3;
    const shuffled = [...problemPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map(p => {
            // 指示通り、options[0]を絶対的な正解として保持する
            const correctAnswer = p.options[0];
            return {
                ...p,
                actualCorrectAnswer: correctAnswer,
                options: [...p.options].sort(() => Math.random() - 0.5)
            };
        });
        
    setProblems(shuffled);
  }, [mode, debugSkip, isChallenge]);

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    // actualCorrectAnswer（インデックス0から抽出した文字列）と比較する
    const isCorrect = normalize(option) === normalize(problems[currentProblemIndex].actualCorrectAnswer);
    
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
      if (isChallenge) {
          onComplete(isCorrect ? 1 : 0);
      } else if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setFeedback(null);
      } else {
        onComplete(isCorrect ? correctCount + 1 : correctCount);
      }
    }, 1200);
  };

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;

  const bgClass = getBackgroundClass(mode);

  if (problems.length === 0) return (
      <div className={`flex flex-col h-full w-full ${bgClass} text-white items-center justify-center p-8 font-mono`}>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className={`flex flex-col h-full w-full ${bgClass} text-white relative items-center justify-center p-4 md:p-8 font-mono`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-md text-center flex flex-col">
            <div className="mb-4 flex flex-col items-center justify-center">
                <Lightbulb size={32} className="mb-1 text-yellow-300 animate-pulse" />
                <div className="text-2xl font-bold text-white tracking-widest font-mono border-b-2 border-white pb-1">
                    {isChallenge ? `第 ${streak + 1} 問` : `${currentProblemIndex + 1} / ${problems.length}`}
                </div>
            </div>

            <div className="bg-black/40 border-4 border-white p-4 md:p-6 rounded-2xl mb-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
                {currentProblem.hint && (
                    <div className="bg-white/10 p-2 rounded-lg border border-white/20 mb-4 w-full animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] text-yellow-300 font-bold mb-0.5 uppercase tracking-tighter text-left">Hint</div>
                        <div className="text-[11px] md:text-xs text-gray-100 leading-relaxed text-left">{currentProblem.hint}</div>
                    </div>
                )}
                
                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4 break-words w-full">
                    {currentProblem.question}
                </h3>
                
                {feedback && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 animate-in zoom-in duration-200">
                        {feedback === 'CORRECT' ? (
                            <CheckCircle size={100} className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
                        ) : (
                            <XCircle size={100} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2 md:gap-4">
                {currentProblem.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={isAnswered}
                        className={`
                            py-3 px-4 font-bold rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1 text-base md:text-lg
                            ${isAnswered && normalize(opt) === normalize(currentProblem.actualCorrectAnswer) ? 'bg-green-600 border-green-800 scale-102' : ''}
                            ${isAnswered && opt === selectedOption && normalize(opt) !== normalize(currentProblem.actualCorrectAnswer) ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered ? 'bg-white/10 border-white/30 hover:bg-white/20 cursor-pointer' : 'opacity-80'}
                            break-words shadow-lg
                        `}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default GeneralChallengeScreen;
