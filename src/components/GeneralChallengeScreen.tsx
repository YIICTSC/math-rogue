import {awardAnswer} from '../point-exchange/store';
import { drawProblemVisual } from '../utils/drawProblemVisual';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BookOpen, CheckCircle, XCircle, Volume2, Mic } from 'lucide-react';
import { audioService } from '../services/audioService';
import { AnswerMode, AssignmentAnswerResult, AssignmentCustomProblem, AssignmentReviewProblem, AssignmentUnit, GameMode, LanguageMode } from '../types';
import { storageService } from '../services/storageService';
import { SUBJECT_DATA, GeneralProblem } from '../data/subjectData';
import { getUnitBoardSummary } from '../data/unitBoardSummaries';
import { MAP_SYMBOL_ASSET_MAP } from './mapSymbolImageMap';
import RewardHintBanner from './RewardHintBanner';
import UnitBoardModal from './UnitBoardModal';
import { claimUnitBoardFirstDisplay } from '../utils/unitBoardSeen';
import { trans } from '../utils/textUtils';
import { formatProblemUnitName } from '../utils/problemUnitName';
import MathText from './MathText';
import { assignmentFilterForMode, matchesAssignmentRangeFilter } from '../utils/assignmentRangeFilters';
import { getProblemCycleScope, selectProblemsForCycle } from '../utils/problemCycle';
import { matchesSchoolAnswer, matchesSchoolSpeech, normalizeSchoolNumber, schoolAnswerOptions, schoolQuestionNeedsChoices, schoolQuestionPromptKey } from '../utils/schoolAnswer';

interface GeneralChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  modePool?: string[];
  onModeCorrect?: (mode: string, correctCount: number) => void;
  answerMode?: AnswerMode;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
  rewardHint?: string;
  languageMode?: LanguageMode;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
  customProblems?: AssignmentCustomProblem[];
  problemOffset?: number;
  reviewProblem?: AssignmentReviewProblem | null;
  assignmentUnits?: AssignmentUnit[];
  debugProblems?: GeneralProblem[];
  previewOnly?: boolean;
}

const EMPTY_CUSTOM_PROBLEMS: AssignmentCustomProblem[] = [];
const EMPTY_DEBUG_PROBLEMS: GeneralProblem[] = [];

const buildCustomProblemOptions = (answer: string, providedOptions: string[] = [], languageMode: LanguageMode = 'JAPANESE'): string[] => {
  const correct = answer.trim();
  const options = Array.from(new Set([correct, ...providedOptions.map((option) => option.trim()).filter(Boolean)]));
  const numericAnswer = Number(correct);

  if (Number.isFinite(numericAnswer) && correct !== '') {
    const offsets = [1, -1, 2, -2, 5, -5, 10, -10];
    for (const offset of offsets) {
      if (options.length >= 4) break;
      options.push(String(numericAnswer + offset));
    }
  }

  const textSeeds = languageMode === 'ENGLISH'
    ? [
        `Not ${correct}`,
        correct.length > 1 ? correct.slice(0, -1) : `${correct} 1`,
        `Before ${correct}`,
        `After ${correct}`,
        `${correct}?`,
      ]
    : [
        `${correct}？`,
        `${correct}ではない`,
        correct.length > 1 ? correct.slice(0, -1) : `${correct}1`,
        `${correct}の一つ前`,
        `${correct}の一つ後`,
      ];
  for (const seed of textSeeds) {
    const candidate = seed.trim();
    if (options.length >= 4) break;
    if (candidate && candidate !== correct && !options.includes(candidate)) {
      options.push(candidate);
    }
  }

  return Array.from(new Set(options)).slice(0, 4);
};

// 内部的に正解を保持するための拡張型
interface ExtendedGeneralProblem extends GeneralProblem {
  actualCorrectAnswer: string;
  sourceMode: string;
  choiceRequired?: boolean;
  assignmentProblemId?: string;
  assignmentProblemKey?: string;
  isAssignmentRetry?: boolean;
  retryOfProblemKey?: string;
  timeLimitSeconds?: number | null;
}

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

// 教科に応じた背景色の取得
const getBackgroundClass = (mode: string) => {
    if (mode.startsWith('MATH')) return 'bg-emerald-950';
    if (mode.startsWith('NATIVE_MATH')) return 'bg-emerald-950';
    if (mode.startsWith('NATIVE_ELA')) return 'bg-indigo-950';
    if (mode.startsWith('NATIVE_SCIENCE')) return 'bg-amber-950';
    if (mode.startsWith('NATIVE_SOCIAL')) return 'bg-orange-950';
    if (mode.startsWith('NATIVE_JAPANESE')) return 'bg-rose-950';
    if (mode.startsWith('ENGLISH')) return 'bg-indigo-950';
    if (mode.startsWith('SCIENCE') || mode.startsWith('LIFE')) return 'bg-amber-950';
    if (mode.startsWith('SOCIAL') || mode.includes('GEOGRAPHY') || mode.includes('HISTORY') || mode.includes('CIVICS')) return 'bg-orange-950';
    if (mode.startsWith('MAP_') || mode.startsWith('PREF_') || mode.startsWith('PREFECTURES')) return 'bg-rose-950';
    if (mode.startsWith('IT_')) return 'bg-indigo-950'; // ICT系はインディゴ
    return 'bg-slate-900';
};

const isEnglishSpeakingReviewMode = (mode: string) =>
  /^ENGLISH_G[3-6]_U(12|13|14)$/.test(mode) ||
  /^ENGLISH_G7_U(14|15|16)$/.test(mode) ||
  /^ENGLISH_G8_U(11|12|13)$/.test(mode) ||
  /^ENGLISH_G9_U(12|13|14)$/.test(mode);

const ENGLISH_AUDIO_BGM_DUCK_MULTIPLIER = 0.05;

const isEnglishAudioFocusProblem = (problem: ExtendedGeneralProblem | undefined, fallbackMode: string) => {
  if (!problem?.audioPrompt && !problem?.speechPrompt) return false;
  const sourceMode = problem.sourceMode || fallbackMode;
  const isEnglishMode = /(?:^|_)ENGLISH(?:_|$)/.test(sourceMode);
  const hasEnglishAudio = [problem.audioPrompt?.lang, problem.speechPrompt?.lang]
    .some((lang) => typeof lang === 'string' && /^en(?:-|$)/i.test(lang));
  return isEnglishMode || hasEnglishAudio;
};

const GeneralChallengeScreen: React.FC<GeneralChallengeScreenProps> = ({ onComplete, mode, modePool, onModeCorrect, answerMode = 'CHOICE', debugSkip, isChallenge, streak = 0, rewardHint, languageMode = 'JAPANESE', onAnswerResult, customProblems = EMPTY_CUSTOM_PROBLEMS, problemOffset = 0, reviewProblem = null, assignmentUnits, debugProblems = EMPTY_DEBUG_PROBLEMS, previewOnly = false }) => {
  const pointQuestionRef = React.useRef<{problem:unknown;index:number;receipt:string}>({problem:null,index:-1,receipt:''});
  const getPointReceipt=(problem:unknown,index:number)=>{const q=pointQuestionRef.current;if(q.problem!==problem||q.index!==index){q.problem=problem;q.index=index;q.receipt=crypto.randomUUID();}return q.receipt;};
  const [problems, setProblems] = useState<ExtendedGeneralProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const visualCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechSynthSettlingTimerRef = useRef<number | null>(null);
  const speechStartInProgressRef = useRef(false);
  const questionStartedAtRef = useRef(Date.now());
  const unitBoardAutoShownRef = useRef<string | null>(null);
  const [mapSymbolImageFailed, setMapSymbolImageFailed] = useState(false);
  const [isUnitBoardOpen, setIsUnitBoardOpen] = useState(false);
  const currentProblem = problems[currentProblemIndex];
  const preferredAnswerMode = assignmentUnits?.find((unit) => unit.modes.includes(currentProblem?.sourceMode || mode))?.answerMode || answerMode;
  const currentAnswerMode = currentProblem?.choiceRequired ? 'CHOICE' : preferredAnswerMode;
  const numericAnswer = normalizeSchoolNumber(currentProblem?.actualCorrectAnswer ?? '');
  const inputMode = numericAnswer === null || numericAnswer.startsWith('-')
    ? 'text' : numericAnswer.includes('.') ? 'decimal' : 'numeric';
  const shouldDuckBgmForEnglishAudio = isEnglishAudioFocusProblem(currentProblem, mode);
  const shouldUseEnglishAudioButton = languageMode === 'ENGLISH';
  const audioButtonLabel = shouldUseEnglishAudioButton ? 'Listen' : 'おとを きく';
  const audioButtonAriaLabel = shouldUseEnglishAudioButton ? 'Listen to audio' : 'おとを きく';
  const mapSymbolAsset =
    currentProblem?.visual?.kind === 'map_symbol'
      ? MAP_SYMBOL_ASSET_MAP[currentProblem.visual.symbol]
      : undefined;
  const unitBoardSummary = useMemo(
    () => getUnitBoardSummary(currentProblem?.sourceMode || mode, currentProblem?.unitLabel),
    [currentProblem?.sourceMode, currentProblem?.unitLabel, mode]
  );

  const visualRenderKey = JSON.stringify(currentProblem?.visual ?? null);

  useEffect(() => {
    audioService.setBgmDuckMultiplier(shouldDuckBgmForEnglishAudio ? ENGLISH_AUDIO_BGM_DUCK_MULTIPLIER : 1);
    return () => {
      if (shouldDuckBgmForEnglishAudio) audioService.setBgmDuckMultiplier(1);
    };
  }, [shouldDuckBgmForEnglishAudio]);

  useEffect(() => {
    if (previewOnly || !unitBoardSummary || reviewProblem) return;
    if (unitBoardAutoShownRef.current === unitBoardSummary.id) return;
    unitBoardAutoShownRef.current = unitBoardSummary.id;

    if (claimUnitBoardFirstDisplay(unitBoardSummary.id)) setIsUnitBoardOpen(true);
  }, [previewOnly, reviewProblem, unitBoardSummary]);

  const handleUnitBoardClose = useCallback(() => {
    setIsUnitBoardOpen(false);
  }, []);

  const stopSpeechSynthesis = useCallback((settleMs = 0) => new Promise<void>((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    if (speechSynthSettlingTimerRef.current) {
      window.clearTimeout(speechSynthSettlingTimerRef.current);
      speechSynthSettlingTimerRef.current = null;
    }

    const start = Date.now();
    const waitUntilQuiet = () => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        speechSynthSettlingTimerRef.current = window.setTimeout(() => {
          speechSynthSettlingTimerRef.current = null;
          resolve();
        }, settleMs);
        return;
      }

      if (Date.now() - start > 900) {
        resolve();
        return;
      }

      speechSynthSettlingTimerRef.current = window.setTimeout(waitUntilQuiet, 50);
    };

    waitUntilQuiet();
  }), []);

  const primeMicrophonePermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
        video: false,
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.warn('Microphone permission check failed:', error);
      return false;
    }
  }, []);

  const speakPrompt = useCallback((text: string, lang = 'ja-JP') => {
    if (!('speechSynthesis' in window) || !text || isListening) return;
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    synthesis.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.82;
    utterance.pitch = 1.0;
    utterance.volume = 0.78;
    const normalizedLang = lang.toLowerCase();
    const voices = synthesis.getVoices();
    const preferredVoice = voices.find((voice) => voice.lang.toLowerCase() === normalizedLang)
      || voices.find((voice) => voice.lang.toLowerCase().startsWith(normalizedLang.split('-')[0]));
    if (preferredVoice) utterance.voice = preferredVoice;
    synthesis.speak(utterance);
  }, [isListening]);

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
      const source = SUBJECT_DATA[reviewProblem.mode] ?? [];
      const original = source.find(problem =>
        problem.question === reviewProblem.question && problem.options[0] === reviewProblem.correctAnswer,
      );
      const choiceDependent = original && source.some(problem =>
        problem.question === original.question && problem.options[0] !== original.options[0] &&
        schoolQuestionPromptKey(problem) === schoolQuestionPromptKey(original),
      );
      const availableOptions = original?.options ?? reviewProblem.options ?? [];
      setProblems([{
        ...original,
        question: reviewProblem.question,
        answer: original?.answer ?? reviewProblem.correctAnswer,
        options: [...new Set([reviewProblem.correctAnswer, ...availableOptions])].slice(0, 4).sort(() => Math.random() - 0.5),
        unitLabel: reviewProblem.unitName ? formatProblemUnitName(reviewProblem.unitName, languageMode) : trans('再出題', languageMode),
        sourceMode: reviewProblem.mode,
        assignmentProblemId: reviewProblem.problemId,
        assignmentProblemKey: reviewProblem.problemKey,
        retryOfProblemKey: reviewProblem.problemKey,
        isAssignmentRetry: true,
        actualCorrectAnswer: reviewProblem.correctAnswer,
        choiceRequired: choiceDependent || schoolQuestionNeedsChoices(reviewProblem.question),
      }]);
      return;
    }

    let problemPool: Array<GeneralProblem & { sourceMode: string }> = [];
    if (debugProblems.length > 0) {
      problemPool = debugProblems.map((problem) => ({ ...problem, sourceMode: mode }));
    } else if (modePool && modePool.length > 0) {
      problemPool = modePool.flatMap((m) => {
        const source = SUBJECT_DATA[m] || [];
        const filter = assignmentFilterForMode(assignmentUnits, m);
        const filtered = filter ? source.filter((problem) => matchesAssignmentRangeFilter(problem, filter)) : source;
        return (filtered.length > 0 ? filtered : source).map((p) => ({ ...p, sourceMode: m }));
      });
    } else if (!modePool) {
      const source = SUBJECT_DATA[mode] || [];
      const filter = assignmentFilterForMode(assignmentUnits, mode);
      const filtered = filter ? source.filter((problem) => matchesAssignmentRangeFilter(problem, filter)) : source;
      problemPool = (filtered.length > 0 ? filtered : source).map((p) => ({ ...p, sourceMode: mode }));
    }
    if (debugProblems.length === 0 && customProblems.length > 0) {
      const customProblemPool = customProblems.map((problem) => ({
        question: problem.question,
        answer: problem.answer,
        options: buildCustomProblemOptions(problem.answer, problem.options, languageMode),
        unitLabel: trans('オリジナル問題', languageMode),
        sourceMode: 'ASSIGNMENT_CUSTOM',
        assignmentProblemId: problem.id,
        timeLimitSeconds: problem.timeLimitSeconds,
      }));
      const offset = customProblemPool.length > 0 ? problemOffset % customProblemPool.length : 0;
      const rotatedCustomProblemPool = [
        ...customProblemPool.slice(offset),
        ...customProblemPool.slice(0, offset),
      ];
      problemPool = [
        ...rotatedCustomProblemPool,
        ...problemPool,
      ];
    }
    if (problemPool.length === 0) {
      problemPool = SUBJECT_DATA.MAP_SYMBOLS.map((p) => ({ ...p, sourceMode: 'MAP_SYMBOLS' }));
    }
    const count = debugProblems.length > 0 ? debugProblems.length : isChallenge ? 1 : 3;
    const cycleEnabled = debugProblems.length === 0 && customProblems.length === 0 && !previewOnly;
    const orderedPool = cycleEnabled
      ? selectProblemsForCycle(
          problemPool,
          count,
          (problem) => getProblemCycleScope(problem.sourceMode, assignmentFilterForMode(assignmentUnits, problem.sourceMode)),
          (problem) => `${problem.sourceMode}:${problem.question}`,
        )
      : debugProblems.length > 0 || customProblems.length > 0
        ? [...problemPool]
        : [...problemPool].sort(() => Math.random() - 0.5);
    const selectedProblems = orderedPool.slice(0, count);
    const selectedPrompts = new Set(selectedProblems.map(problem => problem.question));
    const answersByPrompt = new Map<string, string>();
    const choiceDependentPrompts = new Set<string>();
    for (const problem of problemPool) {
      if (!selectedPrompts.has(problem.question)) continue;
      const key = schoolQuestionPromptKey(problem);
      const correct = problem.options[0];
      const previous = answersByPrompt.get(key);
      if (previous !== undefined && previous !== correct) choiceDependentPrompts.add(key);
      answersByPrompt.set(key, correct);
    }
    const shuffled = selectedProblems
        .map(p => {
            // 指示通り、options[0]を絶対的な正解として保持する
            const correctAnswer = p.options[0];
            return {
                ...p,
                actualCorrectAnswer: correctAnswer,
                choiceRequired: schoolQuestionNeedsChoices(p.question) || choiceDependentPrompts.has(schoolQuestionPromptKey(p)),
                options: [...p.options].sort(() => Math.random() - 0.5),
                assignmentProblemKey: ('assignmentProblemId' in p && typeof p.assignmentProblemId === 'string' ? p.assignmentProblemId : undefined) || `${p.sourceMode}:${p.question}`,
            };
        });
        
    setProblems(shuffled);
  }, [mode, modePool, debugSkip, isChallenge, customProblems, problemOffset, reviewProblem, languageMode, assignmentUnits, debugProblems]);

  const attemptedCount = currentProblemIndex + (isAnswered ? 1 : 0);
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  useEffect(() => {
    if (!currentProblem?.audioPrompt || isAnswered) return;
    if (currentProblem.audioPrompt.autoPlay === false) return;
    const timer = window.setTimeout(() => {
      speakPrompt(currentProblem.audioPrompt!.text, currentProblem.audioPrompt!.lang || 'ja-JP');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [currentProblemIndex, currentProblem?.audioPrompt?.text, currentProblem?.audioPrompt?.lang, currentProblem?.audioPrompt?.autoPlay, isAnswered, speakPrompt]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
          recognitionRef.current.stop();
        } catch (error) {
          console.warn('Failed to stop speech recognition:', error);
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechSynthSettlingTimerRef.current) {
        window.clearTimeout(speechSynthSettlingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSpeechTranscript('');
    setSpeechError('');
    setIsListening(false);
    setMapSymbolImageFailed(false);
    setRemainingSeconds(currentProblem?.timeLimitSeconds || null);
    questionStartedAtRef.current = Date.now();
  }, [currentProblem?.timeLimitSeconds, currentProblemIndex]);

  const submitAnswerResult = useCallback((isCorrect: boolean, selected: string) => {
    if (isAnswered) return;

    setSelectedOption(selected);
    setIsAnswered(true);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('CORRECT');
      try { audioService.playSound('correct'); } catch { /* Audio failure must not strand the answered question. */ }
      if (!previewOnly) {
        onModeCorrect?.(problems[currentProblemIndex].sourceMode, 1);
        const currentTotal = storageService.getMathCorrectCount();
        storageService.saveMathCorrectCount(currentTotal + 1);
        const currentStreak = storageService.getHintStreaks()[problems[currentProblemIndex].sourceMode] || 0;
        storageService.saveHintStreak(problems[currentProblemIndex].sourceMode, currentStreak + 1);
      }
    } else {
      setFeedback('WRONG');
      try { audioService.playSound('wrong'); } catch { /* Audio failure must not strand the answered question. */ }
      if (!previewOnly) storageService.saveHintStreak(problems[currentProblemIndex].sourceMode, 0);
    }
    const answerResult = {
      pointReceipt: getPointReceipt(problems[currentProblemIndex],currentProblemIndex),
      mode: problems[currentProblemIndex].sourceMode,
      subjectId: problems[currentProblemIndex].sourceMode,
      correct: isCorrect,
      elapsedMs: Date.now() - questionStartedAtRef.current,
      problemId: problems[currentProblemIndex].assignmentProblemId,
      problemKey: problems[currentProblemIndex].assignmentProblemKey || problems[currentProblemIndex].assignmentProblemId || `${problems[currentProblemIndex].sourceMode}:${problems[currentProblemIndex].question}`,
      question: problems[currentProblemIndex].question,
      correctAnswer: problems[currentProblemIndex].actualCorrectAnswer,
      selectedAnswer: selected,
      isRetry: problems[currentProblemIndex].isAssignmentRetry,
      retryOfProblemKey: problems[currentProblemIndex].retryOfProblemKey,
    };

    if (isCorrect && !previewOnly && !problems[currentProblemIndex].isAssignmentRetry && customProblems.length === 0 && debugProblems.length === 0) {
      const solvedProblem = problems[currentProblemIndex];
      const cycleScope = getProblemCycleScope(solvedProblem.sourceMode, assignmentFilterForMode(assignmentUnits, solvedProblem.sourceMode));
      storageService.markProblemCycleCorrect(cycleScope, answerResult.problemKey);
    }

    if (!previewOnly && debugProblems.length === 0) void awardAnswer(answerResult);

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
  }, [correctCount, currentProblemIndex, isAnswered, isChallenge, onAnswerResult, onComplete, onModeCorrect, previewOnly, problems]);

  const handleAnswer = (option: string) => {
    if (currentProblem) submitAnswerResult(option === currentProblem.actualCorrectAnswer, option);
  };

  useEffect(() => {
    if (!currentProblem?.timeLimitSeconds || isAnswered || remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      submitAnswerResult(false, trans('時間切れ！', languageMode));
      return;
    }
    const timer = window.setTimeout(() => setRemainingSeconds((current) => current === null ? null : Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [currentProblem?.timeLimitSeconds, isAnswered, languageMode, remainingSeconds, submitAnswerResult]);

  const handleInputSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentProblem || !inputAnswer.trim()) return;
    const options = schoolAnswerOptions(currentProblem.sourceMode, currentProblem.question);
    const isCorrect = matchesSchoolAnswer(inputAnswer, currentProblem.actualCorrectAnswer, options)
      || matchesSchoolAnswer(inputAnswer, currentProblem.answer, options);
    submitAnswerResult(isCorrect, inputAnswer);
  };

  useEffect(() => {
    if (!isAnswered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAnswered, currentProblemIndex]);

  const startSpeechRecognition = useCallback(async () => {
    if (!currentProblem?.speechPrompt || isAnswered || isListening || speechStartInProgressRef.current) return;
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setSpeechError(trans('このブラウザでは はつわ判定が つかえません', languageMode));
      return;
    }

    speechStartInProgressRef.current = true;
    setSpeechError('');
    setSpeechTranscript('');
    setIsListening(true);

    await stopSpeechSynthesis(180);
    const microphoneReady = await primeMicrophonePermission();
    if (!microphoneReady) {
      setSpeechError(trans('マイクの許可を確認してください', languageMode));
      setIsListening(false);
      speechStartInProgressRef.current = false;
      return;
    }

    await new Promise<void>((resolve) => window.setTimeout(resolve, 120));

    if (!currentProblem?.speechPrompt || isAnswered) {
      setIsListening(false);
      speechStartInProgressRef.current = false;
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = currentProblem.speechPrompt.lang || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.onresult = (event) => {
      const result = event.results?.[event.resultIndex ?? 0] ?? event.results?.[0];
      const alternatives = Array.from(result || [])
        .map((candidate: any) => String(candidate?.transcript || '').trim())
        .filter(Boolean);
      const transcript = alternatives[0] || '';
      setSpeechTranscript(transcript);
      if (!result?.isFinal) return;
      const acceptedTranscript = alternatives.find(candidate => matchesSchoolSpeech(candidate, currentProblem.speechPrompt!));
      submitAnswerResult(!!acceptedTranscript, acceptedTranscript || transcript || currentProblem.speechPrompt!.expected);
    };
    recognition.onerror = (event: any) => {
      const detail = event?.error;
      setSpeechError(
        detail === 'not-allowed' || detail === 'service-not-allowed'
          ? trans('マイクの許可を確認してください', languageMode)
          : detail === 'no-speech'
            ? trans('声が聞こえませんでした。もう一度どうぞ', languageMode)
            : trans('うまく ききとれませんでした', languageMode)
      );
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      speechStartInProgressRef.current = false;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      console.warn('Speech recognition failed to start:', error);
      setSpeechError(trans('マイクを開始できませんでした。もう一度押してください', languageMode));
      setIsListening(false);
      speechStartInProgressRef.current = false;
    }
  }, [currentProblem, isAnswered, isListening, languageMode, primeMicrophonePermission, stopSpeechSynthesis, submitAnswerResult]);

  useEffect(() => {
    if (visualCanvasRef.current && currentProblem?.visual) drawProblemVisual(visualCanvasRef.current, currentProblem.visual);
  }, [visualRenderKey, mapSymbolImageFailed]);

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;

  const bgClass = getBackgroundClass(mode);
  if (problems.length === 0) return (
      <div className={`flex flex-col h-full w-full ${bgClass} text-white items-center justify-center p-8 font-mono`}>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const layoutTextLength = [
    currentProblem.question,
    currentProblem.hint,
    currentProblem.passage,
    currentProblem.unitLabel,
    ...(currentProblem.options || []),
    ...(currentProblem.speechPrompt?.examples || []),
  ].reduce((total, value) => total + String(value || '').length, 0);
  const landscapeDensityClass = layoutTextLength > 520
    ? 'general-challenge-density-ultra'
    : layoutTextLength > 260
      ? 'general-challenge-density-compact'
      : 'general-challenge-density-normal';

  return (
    <div data-gamepad-navigation-root data-gamepad-question-screen data-gamepad-initial-scope={`general-challenge-${currentProblemIndex}`} className={`main-challenge-screen ${landscapeDensityClass} flex flex-col h-full w-full ${bgClass} text-white relative items-center justify-center p-2 sm:p-3 md:p-8 font-mono overflow-y-auto overflow-x-hidden`}>
        <div className="absolute inset-0 texture-dark-matter opacity-20 pointer-events-none"></div>
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
        
        <div className="general-challenge-layout z-10 w-full max-w-md text-center flex flex-col py-2 md:py-0 min-w-0">
            {isEnglishSpeakingReviewMode(mode) && !isChallenge && (
                <div className="mb-4 flex justify-center gap-3 text-xs md:text-sm text-cyan-100">
                    <span>Score: {correctCount}</span>
                    <span>Attempted: {attemptedCount}</span>
                    <span>Accuracy: {accuracy}%</span>
                </div>
            )}

            <div className="general-challenge-question w-full bg-black/40 border-4 border-white p-3 sm:p-4 md:p-6 rounded-2xl mb-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[210px] md:min-h-[260px] min-w-0">
                {currentProblem.hint && (storageService.getHintStreaks()[currentProblem.sourceMode] || 0) < 3 && (
                    <div className="bg-white/10 p-2 rounded-lg border border-white/20 mb-4 w-full animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] text-yellow-300 font-bold mb-0.5 uppercase tracking-tighter text-left">Hint</div>
                        <div className="text-[11px] md:text-xs text-gray-100 leading-relaxed text-left">{currentProblem.hint}</div>
                    </div>
                )}

                {currentProblem.unitLabel && (
                    <div className="mb-2 max-w-full rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-[10px] sm:text-xs font-bold text-cyan-100 leading-none break-words">
                        {currentProblem.unitLabel}
                    </div>
                )}

                {currentProblem.passage && (
                    <section className="mb-4 w-full max-h-[34vh] overflow-y-auto rounded-xl border border-cyan-200/30 bg-slate-950/70 px-3 py-3 text-left shadow-inner sm:px-4">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200 sm:text-xs">
                            {currentProblem.passageTitle || trans('本文', languageMode)}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100 sm:text-base">
                            {currentProblem.passage}
                        </p>
                    </section>
                )}
                
                {remainingSeconds !== null && <div className={`mb-3 w-full rounded-full border px-3 py-2 text-sm font-black ${remainingSeconds <= 5 ? 'border-red-300 bg-red-500/25 text-red-100' : 'border-cyan-300/50 bg-cyan-400/15 text-cyan-100'}`}><span>{trans('残り', languageMode)} {remainingSeconds}{languageMode === 'ENGLISH' ? ' sec' : '秒'}</span><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/30"><i className="block h-full rounded-full bg-current transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, remainingSeconds / Math.max(1, currentProblem.timeLimitSeconds || remainingSeconds) * 100))}%` }} /></div></div>}

                <h3 className="text-[clamp(1.25rem,4vw,1.875rem)] font-bold text-white leading-tight mb-4 break-words w-full min-w-0">
                    <MathText text={currentProblem.question} />
                </h3>

                {currentProblem.audioPrompt && (
                    <button
                        type="button"
                        onClick={() => speakPrompt(currentProblem.audioPrompt!.text, currentProblem.audioPrompt!.lang || 'ja-JP')}
                        disabled={isListening}
                        aria-label={audioButtonAriaLabel}
                        className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-500/15 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
                    >
                        <Volume2 size={18} />
                        {audioButtonLabel}
                    </button>
                )}

                {currentProblem.speechPrompt && (
                    <div className="mb-4 flex w-full flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={startSpeechRecognition}
                            disabled={isAnswered || isListening}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${isListening ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100' : 'border-pink-300/50 bg-pink-500/15 text-pink-100 hover:bg-pink-500/25'} disabled:opacity-60`}
                        >
                            <Mic size={18} />
                            {isListening ? trans('ききとり中...', languageMode) : (currentProblem.speechPrompt.buttonLabel || trans('はなして こたえる', languageMode))}
                        </button>
                        {speechTranscript && (
                            <div className="text-xs text-emerald-200">{trans('ききとり:', languageMode)} {speechTranscript}</div>
                        )}
                        {speechError && (
                            <div className="text-xs text-amber-300">{speechError}</div>
                        )}
                        {currentProblem.speechPrompt.freeResponse && currentProblem.speechPrompt.examples && currentProblem.speechPrompt.examples.length > 0 && (
                            <div className="w-full rounded-lg border border-pink-300/20 bg-pink-500/10 px-3 py-2 text-left text-[11px] text-pink-100">
                                {trans('例:', languageMode)} {currentProblem.speechPrompt.examples.join(' / ')}
                            </div>
                        )}
                    </div>
                )}

                {currentProblem.visual && currentProblem.visual.kind !== 'map_symbol' && (
                    <div
                        className="dynamic-visual-stage"
                        data-visual-kind={currentProblem.visual.kind}
                        role="img"
                        aria-label={languageMode === 'ENGLISH' ? 'Problem visual' : languageMode === 'HIRAGANA' ? 'もんだいのず' : '問題の図'}
                    >
                        <canvas
                            ref={visualCanvasRef}
                            width={780}
                            height={540}
                            className="dynamic-visual-canvas"
                        />
                    </div>
                )}
                {currentProblem.visual?.kind === 'map_symbol' && (
                    <div
                        className="dynamic-visual-stage dynamic-visual-stage--map"
                        data-visual-kind="map_symbol"
                        role="img"
                        aria-label={languageMode === 'ENGLISH' ? 'Map symbol' : languageMode === 'HIRAGANA' ? 'ちずきごう' : '地図記号'}
                    >
                        <div className="dynamic-visual-map-card">
                                {mapSymbolAsset && !mapSymbolImageFailed ? (
                                    <img
                                        src={mapSymbolAsset.src}
                                        alt={mapSymbolAsset.title}
                                        className="dynamic-visual-map-image"
                                        onError={() => setMapSymbolImageFailed(true)}
                                    />
                                ) : (
                                    <canvas
                                        ref={visualCanvasRef}
                                        width={780}
                                        height={540}
                                        className="dynamic-visual-canvas dynamic-visual-canvas--map"
                                    />
                                )}
                        </div>
                    </div>
                )}
                
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

            {!currentProblem.speechPrompt?.freeResponse && currentAnswerMode === 'INPUT' && (
            <form onSubmit={handleInputSubmit} className="general-challenge-input w-full space-y-3">
                <input
                    ref={inputRef}
                    value={inputAnswer}
                    onChange={(event) => setInputAnswer(event.target.value)}
                    disabled={isAnswered}
                    autoFocus
                    inputMode={inputMode}
                    className={`w-full rounded-xl border-4 bg-white px-4 py-4 text-center text-3xl font-black text-slate-950 outline-none transition-colors ${isAnswered ? 'border-slate-400 opacity-80' : 'border-emerald-400 focus:border-yellow-300'}`}
                    placeholder={trans('答えを入力', languageMode)}
                />
                <button
                    type="submit"
                    disabled={isAnswered || inputAnswer.trim() === ''}
                    className="w-full rounded-xl border-b-4 border-emerald-950 bg-emerald-600 py-3 text-xl font-bold transition-all hover:bg-emerald-500 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {trans('決定', languageMode)}
                </button>
            </form>
            )}

            {!currentProblem.speechPrompt?.freeResponse && !(currentAnswerMode === 'INPUT') && (
            <div className="general-challenge-options w-full grid grid-cols-2 gap-2 md:gap-3 min-w-0">
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
                                py-2.5 md:py-3 px-2 md:px-3 font-bold rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1 text-[clamp(0.8rem,2.8vw,1rem)]
                                ${isAnswered && isCorrectOption ? 'bg-green-600 border-green-800 scale-102' : ''}
                                ${isAnswered && isSelectedWrong ? 'bg-red-600 border-red-800' : ''}
                                ${!isAnswered || (!isCorrectOption && !isSelectedWrong) ? 'bg-white/10 border-white/30' : ''}
                                ${!isAnswered ? 'hover:bg-white/20 cursor-pointer' : 'opacity-80'}
                                break-words shadow-lg min-w-0
                            `}
                        >
                            <MathText text={opt} />
                        </button>
                    );
                })}
            </div>
            )}
        </div>
    </div>
  );
};

export default GeneralChallengeScreen;
