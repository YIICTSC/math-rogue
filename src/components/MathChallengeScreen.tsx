
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Brain } from 'lucide-react';
import { audioService } from '../services/audioService';
import { GameMode } from '../types';

interface MathChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  debugSkip?: boolean;
}

interface MathProblem {
  question: string;
  options: number[];
  answer: number;
}

const MathChallengeScreen: React.FC<MathChallengeScreenProps> = ({ onComplete, mode, debugSkip }) => {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

  useEffect(() => {
    if (debugSkip) {
        onComplete(1); // Auto-complete for 15G reward
        return;
    }

    try {
        audioService.playBGM('math');
    } catch (e) {
        console.warn("BGM playback failed", e);
    }

    // Safeguard: default to multiplication if mode is undefined
    const safeMode = mode || GameMode.MULTIPLICATION;

    const generatedProblems: MathProblem[] = [];
    for (let i = 0; i < 3; i++) {
      let a, b, answer, operator;
      
      // Determine operation type for this problem
      let type = safeMode;
      if (safeMode === GameMode.MIXED) {
          const types = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION];
          type = types[Math.floor(Math.random() * types.length)];
      }

      switch (type) {
          case GameMode.ADDITION:
              a = Math.floor(Math.random() * 20) + 1;
              b = Math.floor(Math.random() * 20) + 1;
              answer = a + b;
              operator = '+';
              break;
          case GameMode.SUBTRACTION:
              a = Math.floor(Math.random() * 20) + 5;
              b = Math.floor(Math.random() * a); // Ensure positive result
              answer = a - b;
              operator = '-';
              break;
          case GameMode.DIVISION:
              b = Math.floor(Math.random() * 9) + 2; // Divisor
              answer = Math.floor(Math.random() * 9) + 1; // Quotient
              a = b * answer; // Dividend
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
        if (wrong < 0) wrong = 0; 
        if (wrong !== answer) options.add(wrong);
      }
      
      generatedProblems.push({
        question: `${a} ${operator} ${b} = ?`,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        answer: answer
      });
    }
    setProblems(generatedProblems);
  }, [mode, debugSkip]);

  const handleAnswer = (option: number) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const isCorrect = option === problems[currentProblemIndex].answer;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('CORRECT');
      audioService.playSound('correct');
    } else {
      setFeedback('WRONG');
      audioService.playSound('wrong');
    }

    setTimeout(() => {
      if (currentProblemIndex < problems.length - 1) {
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
      <div className="flex flex-col h-full w-full bg-green-900 text-white items-center justify-center p-8 font-mono">
          <div className="animate-pulse text-2xl">準備中...</div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="flex flex-col h-full w-full bg-green-900 text-white relative items-center justify-center p-8 font-mono">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/blackboard.png')] opacity-20 pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-md text-center">
            <div className="mb-8">
                <Brain size={48} className="mx-auto mb-2 text-yellow-300 animate-pulse" />
                <h2 className="text-3xl font-bold text-white mb-2">算数バトル！</h2>
                <p className="text-gray-300">正解すると良い報酬がもらえるかも？ ({currentProblemIndex + 1}/3)</p>
            </div>

            <div className="bg-black/40 border-4 border-white p-8 rounded-lg mb-8 shadow-2xl relative overflow-hidden">
                <h3 className="text-5xl font-bold text-white tracking-widest">{currentProblem.question}</h3>
                
                {feedback && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 animate-in zoom-in duration-200">
                        {feedback === 'CORRECT' ? (
                            <div className="text-center">
                                <CheckCircle size={80} className="text-green-400 mx-auto mb-2" />
                                <span className="text-2xl font-bold text-green-400">せいかい！</span>
                            </div>
                        ) : (
                            <div className="text-center">
                                <XCircle size={80} className="text-red-500 mx-auto mb-2" />
                                <span className="text-2xl font-bold text-red-500">ざんねん...</span>
                            </div>
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
                            py-4 text-2xl font-bold rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${isAnswered && opt === currentProblem.answer ? 'bg-green-600 border-green-800' : ''}
                            ${isAnswered && opt === selectedOption && opt !== currentProblem.answer ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered ? 'bg-blue-600 border-blue-800 hover:bg-blue-500 cursor-pointer' : 'opacity-80'}
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

export default MathChallengeScreen;
