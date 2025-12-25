
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { audioService } from '../services/audioService';
import { GameMode } from '../types';
import { storageService } from '../services/storageService';
import { KANJI_DATA, KanjiProblem } from '../data/kanjiData';

interface KanjiChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
}

const KanjiChallengeScreen: React.FC<KanjiChallengeScreenProps> = ({ onComplete, mode, debugSkip, isChallenge, streak = 0 }) => {
  const [problems, setProblems] = useState<KanjiProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

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

    let problemPool: KanjiProblem[];
    if (mode === GameMode.KANJI_MIXED) {
        problemPool = Object.values(KANJI_DATA).flat();
    } else {
        const gradeKey = mode as keyof typeof KANJI_DATA;
        problemPool = KANJI_DATA[gradeKey] || KANJI_DATA.KANJI_1;
    }
    
    const count = isChallenge ? 1 : 3;
    const shuffled = [...problemPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map(p => ({
            ...p,
            options: [...p.options].sort(() => Math.random() - 0.5)
        }));
        
    setProblems(shuffled);
  }, [mode, debugSkip, isChallenge]);

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const isCorrect = option === problems[currentProblemIndex].answer;
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
    }, 1000);
  };

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;

  if (problems.length === 0) return (
      <div className="flex flex-col h-full w-full bg-slate-900 text-white items-center justify-center p-8 font-mono">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="flex flex-col h-full w-full bg-slate-800 text-white relative items-center justify-center p-8 font-mono">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-md text-center">
            <div className="mb-8 flex flex-col items-center justify-center">
                <BookOpen size={64} className="mb-4 text-cyan-300 animate-pulse" />
                <div className="text-4xl font-bold text-white tracking-widest font-mono border-b-4 border-white pb-2">
                    {isChallenge ? `第 ${streak + 1} 問` : `${currentProblemIndex + 1} / ${problems.length}`}
                </div>
            </div>

            <div className="bg-black/40 border-4 border-white p-8 rounded-lg mb-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
                {currentProblem.hint && (
                    <div className="bg-blue-900/40 p-2 rounded border border-blue-500/30 mb-4 w-full animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] text-blue-300 font-bold mb-1">ヒント</div>
                        <div className="text-xs text-gray-200 leading-relaxed">{currentProblem.hint}</div>
                    </div>
                )}
                <div className="text-xs text-gray-400 mb-2">この漢字の読み方は？</div>
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

            <div className="grid grid-cols-2 gap-4">
                {currentProblem.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={isAnswered}
                        className={`
                            py-4 text-xl font-bold rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${isAnswered && opt === currentProblem.answer ? 'bg-green-600 border-green-800 scale-105' : ''}
                            ${isAnswered && opt === selectedOption && opt !== currentProblem.answer ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered ? 'bg-cyan-700 border-cyan-900 hover:bg-cyan-600 cursor-pointer' : 'opacity-80'}
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

export default KanjiChallengeScreen;
