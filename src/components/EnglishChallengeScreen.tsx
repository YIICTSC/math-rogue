import {awardAnswer} from '../point-exchange/store';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Volume2, VolumeX } from 'lucide-react';
import { audioService } from '../services/audioService';
import { AnswerMode, AssignmentAnswerResult, AssignmentReviewProblem, AssignmentUnit, GameMode, LanguageMode } from '../types';
import { storageService } from '../services/storageService';
import { ENGLISH_DATA, EnglishProblem } from '../data/englishData';
import RewardHintBanner from './RewardHintBanner';
import { trans } from '../utils/textUtils';
import { assignmentFilterForMode } from '../utils/assignmentRangeFilters';
import { getProblemCycleScope, selectProblemsForCycle } from '../utils/problemCycle';
import { matchesSchoolAnswer } from '../utils/schoolAnswer';
import { questionSpeechMessage, useQuestionPronunciation } from '../utils/useQuestionPronunciation';
import { useSchoolAnswerInput } from '../utils/useSchoolAnswerInput';

interface EnglishChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  answerMode?: AnswerMode;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
  rewardHint?: string;
  languageMode?: LanguageMode;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
  reviewProblem?: AssignmentReviewProblem | null;
  assignmentUnits?: AssignmentUnit[];
}

interface ExtendedEnglishProblem extends EnglishProblem {
  actualCorrectAnswer: string;
  problemKey?: string;
  isAssignmentRetry?: boolean;
  retryOfProblemKey?: string;
}

const EnglishChallengeScreen: React.FC<EnglishChallengeScreenProps> = ({ onComplete, mode, answerMode = 'CHOICE', debugSkip, isChallenge, streak = 0, rewardHint, languageMode = 'JAPANESE', onAnswerResult, reviewProblem = null, assignmentUnits }) => {
  const pointQuestionRef = React.useRef<{problem:unknown;index:number;receipt:string}>({problem:null,index:-1,receipt:''});
  const getPointReceipt=(problem:unknown,index:number)=>{const q=pointQuestionRef.current;if(q.problem!==problem||q.index!==index){q.problem=problem;q.index=index;q.receipt=crypto.randomUUID();}return q.receipt;};
  const [problems, setProblems] = useState<ExtendedEnglishProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  
  // Voice feature control
  const [voiceEnabled, setVoiceEnabled] = useState(() => storageService.getEnglishVoiceEnabled());
  const questionStartedAtRef = React.useRef(Date.now());
  const submittedProblem = useRef<ExtendedEnglishProblem | undefined>(undefined);
  const currentProblem = problems[currentProblemIndex];
  const filter = assignmentFilterForMode(assignmentUnits, mode);
  const listeningAssignment = filter?.kind === 'english_words' && filter.values.includes('listening');
  const prompt = currentProblem && { text: currentProblem.question, lang: /[ぁ-んァ-ヶ一-龠]/.test(currentProblem.question) ? 'ja-JP' : 'en-US' };
  const pronunciation = useQuestionPronunciation(audioService, prompt, currentProblemIndex, {
    enabled: !isAnswered,
    autoPlay: voiceEnabled || listeningAssignment,
    muteBgm: Boolean(currentProblem && (voiceEnabled || listeningAssignment || currentProblem.isDialogue)),
  });
  const pronunciationMessage = questionSpeechMessage(pronunciation.status, languageMode);
  const listenLabel = languageMode === 'ENGLISH' ? 'Listen to audio' : 'おとを きく';

  const toggleVoice = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    storageService.saveEnglishVoiceEnabled(newVal);
    if (!newVal) pronunciation.stop();
    audioService.playSound('select');
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
        answer: reviewProblem.correctAnswer,
        options: [...new Set([reviewProblem.correctAnswer, ...(reviewProblem.options || [])])].slice(0, 4).sort(() => Math.random() - 0.5),
        hint: undefined,
        actualCorrectAnswer: reviewProblem.correctAnswer,
        problemKey: reviewProblem.problemKey,
        isAssignmentRetry: true,
        retryOfProblemKey: reviewProblem.problemKey,
      }]);
      return;
    }

    let problemPool: EnglishProblem[];
    if (mode === GameMode.ENGLISH_MIXED) {
        problemPool = Object.values(ENGLISH_DATA).flat();
    } else {
        const key = mode as keyof typeof ENGLISH_DATA;
        problemPool = ENGLISH_DATA[key] || ENGLISH_DATA.ENGLISH_ES;
    }
    const rangeFilter = assignmentFilterForMode(assignmentUnits, mode);
    if (rangeFilter?.kind === 'english_words' && rangeFilter.values.includes('english_to_japanese')) {
      const filtered = problemPool.filter((problem) => /[A-Za-z]/.test(problem.question) && !/[A-Za-z]/.test(problem.options[0] || problem.answer));
      if (filtered.length > 0) problemPool = filtered;
    }
    if (rangeFilter?.kind === 'english_words' && rangeFilter.values.includes('japanese_to_english')) {
      const source = problemPool.filter((problem) => /[A-Za-z]/.test(problem.question));
      if (source.length > 0) problemPool = source.map((problem, index) => ({
        ...problem,
        question: problem.options[0] || problem.answer,
        answer: problem.question,
        options: [problem.question, ...[1, 2, 3].map((offset) => source[(index + offset) % source.length]?.question).filter(Boolean)],
      }));
    }
    
    const count = isChallenge ? 1 : 3;
    const cycleScope = getProblemCycleScope(String(mode), rangeFilter);
    const cyclePool = selectProblemsForCycle(
        problemPool,
        count,
        () => cycleScope,
        (problem) => `${mode}:${problem.question}:${problem.answer}`,
    );
    const shuffled = cyclePool
        .map(p => {
            // インデックス0を正解として保持
            const correctAnswer = p.options[0];
            return {
                ...p,
                problemKey: `${mode}:${p.question}:${p.answer}`,
                actualCorrectAnswer: correctAnswer,
                options: [...p.options].sort(() => Math.random() - 0.5)
            };
        });
        
    setProblems(shuffled);
  }, [mode, debugSkip, isChallenge, reviewProblem, assignmentUnits]);

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentProblemIndex]);

  const isCorrectInput = (value: string) => Boolean(currentProblem && (
    matchesSchoolAnswer(value, currentProblem.actualCorrectAnswer) || matchesSchoolAnswer(value, currentProblem.answer)
  ));

  const handleAnswer = (option: string) => {
    if (!currentProblem || isAnswered || submittedProblem.current === currentProblem) return;
    submittedProblem.current = currentProblem;
    pronunciation.stop();
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const isCorrect = answerMode === 'INPUT' ? isCorrectInput(option) : option === currentProblem.actualCorrectAnswer;
    const answerResult = {
      pointReceipt: getPointReceipt(problems[currentProblemIndex],currentProblemIndex),
      mode,
      subjectId: mode,
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
      try { audioService.playSound('correct'); } catch { /* Audio failure must not strand the answered question. */ }
      if (!problems[currentProblemIndex].isAssignmentRetry) {
        const cycleScope = getProblemCycleScope(String(mode), assignmentFilterForMode(assignmentUnits, mode));
        storageService.markProblemCycleCorrect(cycleScope, answerResult.problemKey);
      }
      const currentTotal = storageService.getMathCorrectCount();
      storageService.saveMathCorrectCount(currentTotal + 1);

      const currentStreak = storageService.getHintStreaks()[mode] || 0;
      storageService.saveHintStreak(mode, currentStreak + 1);
    } else {
      setFeedback('WRONG');
      try { audioService.playSound('wrong'); } catch { /* Audio failure must not strand the answered question. */ }
      storageService.saveHintStreak(mode, 0);
    }

    if (!debugSkip) void awardAnswer(answerResult);

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
    }, 1200);
  };

  const { isComposing, ...inputEvents } = useSchoolAnswerInput(setInputAnswer, (value) => {
    if (isCorrectInput(value)) handleAnswer(value);
  });
  const handleInputSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComposing() && inputAnswer.trim()) handleAnswer(inputAnswer);
  };

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;
  if (problems.length === 0) return (
      <div className="flex flex-col h-full w-full bg-indigo-950 text-white items-center justify-center p-8 font-mono">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const isConv = currentProblem.isDialogue;

  return (
    <div data-gamepad-navigation-root data-gamepad-question-screen data-gamepad-initial-scope={`english-challenge-${currentProblemIndex}`} className="main-challenge-screen flex flex-col h-full w-full bg-indigo-950 text-white relative items-center justify-center p-4 md:p-8 font-mono">
        <div className="absolute inset-0 texture-dark-matter opacity-20 pointer-events-none"></div>
        <RewardHintBanner text={rewardHint} languageMode={languageMode} />
        
        {/* Header with Voice Toggle */}
        <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={toggleVoice}
              className={`p-2 rounded-full border transition-all ${voiceEnabled ? 'bg-cyan-600 border-cyan-300 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
              title={trans(voiceEnabled ? '音声読み上げをオフにする' : '音声読み上げをオンにする', languageMode)}
            >
              {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
        </div>

        <div className="basic-challenge-layout z-10 w-full max-w-md text-center flex flex-col">
            <div className="basic-challenge-question bg-black/40 border-4 border-white p-4 md:p-6 rounded-2xl mb-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[200px] md:min-h-[300px]">
                {currentProblem.hint && (storageService.getHintStreaks()[mode] || 0) < 3 && (
                    <div className="bg-indigo-800/60 p-2 rounded-lg border border-indigo-400/30 mb-4 w-full animate-in fade-in slide-in-from-top-2">
                        <div className="text-[9px] text-cyan-300 font-bold mb-0.5 uppercase tracking-tighter text-left">Hint</div>
                        <div className="text-[11px] md:text-xs text-gray-100 leading-relaxed text-left">{currentProblem.hint}</div>
                    </div>
                )}
                
                <div className="text-[10px] text-gray-400 mb-3 uppercase tracking-widest">
                  {isConv ? "Listen and Reply" : "Translation"}
                </div>

                {isConv ? (
                  <button
                    type="button"
                    aria-label={listenLabel}
                    disabled={isAnswered}
                    className="relative bg-white text-black p-4 md:p-5 rounded-3xl rounded-bl-none border-4 border-cyan-400 max-w-[95%] group cursor-pointer transition-transform active:scale-95 shadow-xl"
                    onClick={() => pronunciation.play()}
                  >
                     <span className="block text-base md:text-xl font-bold font-sans italic text-left pr-6 leading-tight">
                        "{currentProblem.question}"
                     </span>
                     <Volume2 size={18} className="absolute top-2 right-2 text-cyan-600 opacity-50 group-hover:opacity-100" />
                     <span className="absolute -bottom-4 left-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-white"></span>
                  </button>
                ) : (
                  <h3 className="text-4xl md:text-6xl font-bold text-white tracking-widest font-sans italic break-words max-w-full">
                    <button type="button" aria-label={listenLabel} disabled={isAnswered} onClick={() => pronunciation.play()} className="group relative flex flex-col items-center transition-transform active:scale-95">
                      <span>{currentProblem.question}</span>
                      <Volume2 size={24} className="text-cyan-400 mt-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </h3>
                )}
                {pronunciationMessage && <p role="status" className="mt-3 text-xs text-amber-200">{pronunciationMessage}</p>}
                
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

            {answerMode === 'INPUT' ? <form onSubmit={handleInputSubmit} className="basic-challenge-input w-full space-y-3">
                <input
                  value={inputAnswer}
                  {...inputEvents}
                  disabled={isAnswered}
                  autoFocus
                  inputMode="text"
                  className={`w-full rounded-xl border-4 bg-white px-4 py-4 text-center text-xl font-black text-slate-950 outline-none transition-colors ${isAnswered ? 'border-slate-400 opacity-80' : 'border-cyan-400 focus:border-yellow-300'}`}
                  placeholder={trans('答えを入力', languageMode)}
                  aria-label={trans('答えを入力', languageMode)}
                />
                <button type="submit" disabled={isAnswered || !inputAnswer.trim()} className="w-full rounded-xl border-b-4 border-cyan-950 bg-cyan-600 py-3 text-xl font-bold transition-all hover:bg-cyan-500 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50">{trans('決定', languageMode)}</button>
              </form> : <div className={`basic-challenge-options grid ${isConv ? 'grid-cols-1' : 'grid-cols-2'} gap-2 md:gap-4`}>
                {currentProblem.options.map((opt, idx) => {
                    const isCorrectOption = opt === currentProblem.actualCorrectAnswer;
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
                            py-2.5 px-4 font-bold rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${isConv ? 'text-left text-[13px] md:text-base' : 'text-center text-base md:text-lg'}
                            ${isAnswered && isCorrectOption ? 'bg-green-600 border-green-800 scale-102' : ''}
                            ${isAnswered && isSelectedWrong ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered || (!isCorrectOption && !isSelectedWrong) ? 'bg-indigo-700 border-indigo-900' : ''}
                            ${!isAnswered ? 'hover:bg-indigo-600 cursor-pointer' : 'opacity-80'}
                            break-words leading-tight shadow-lg
                        `}
                    >
                        {isConv && <span className="text-cyan-300 mr-2">▶</span>}
                        {opt}
                    </button>
                    );
                })}
            </div>}
        </div>
    </div>
  );
};

export default EnglishChallengeScreen;
