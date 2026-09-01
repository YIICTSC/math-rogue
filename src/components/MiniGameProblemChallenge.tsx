import React from 'react';
import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, GameScreen, LanguageMode } from '../types';
import { getChallengeScreenForMode } from '../subjectConfig';
import MathChallengeScreen from './MathChallengeScreen';
import KanjiChallengeScreen from './KanjiChallengeScreen';
import EnglishChallengeScreen from './EnglishChallengeScreen';
import GeneralChallengeScreen from './GeneralChallengeScreen';
import { storageService } from '../services/storageService';
import { getAssignmentModePool, getAssignmentRepresentativeMode } from '../utils/assignmentUtils';

interface MiniGameProblemChallengeProps {
  mode: GameMode;
  modePool?: string[];
  answerMode?: AnswerMode;
  onComplete: (correctCount: number) => void;
  isChallenge?: boolean;
  streak?: number;
  rewardHint?: string;
  languageMode?: LanguageMode;
  assignment?: AssignmentPayload | null;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
}

const MiniGameProblemChallenge: React.FC<MiniGameProblemChallengeProps> = ({
  mode,
  modePool,
  answerMode = 'CHOICE',
  onComplete,
  isChallenge = false,
  streak = 0,
  rewardHint,
  languageMode = storageService.getLanguageMode() ?? 'JAPANESE',
  assignment: assignmentOverride,
  onAnswerResult,
}) => {
  const assignmentCandidate = assignmentOverride ?? storageService.getCurrentAssignment();
  const assignmentSignature = assignmentCandidate
    ? JSON.stringify({
        id: assignmentCandidate.id,
        gameMode: assignmentCandidate.gameMode,
        answerMode: assignmentCandidate.answerMode,
        units: assignmentCandidate.units,
        customProblems: assignmentCandidate.customProblems,
        managementPortal: assignmentCandidate.managementPortal,
      })
    : '';
  const stableAssignmentRef = React.useRef<{ signature: string; value: AssignmentPayload | null }>({
    signature: assignmentSignature,
    value: assignmentCandidate,
  });
  if (stableAssignmentRef.current.signature !== assignmentSignature) {
    stableAssignmentRef.current = { signature: assignmentSignature, value: assignmentCandidate };
  }
  const assignment = stableAssignmentRef.current.value;
  const assignmentModePoolForPlay = React.useMemo(
    () => assignment?.gameMode === 'FREE' ? getAssignmentModePool(assignment) : undefined,
    [assignment],
  );
  const assignmentHasCustomProblems = assignment?.gameMode === 'FREE' && assignment.customProblems.length > 0;
  const effectiveMode = assignmentHasCustomProblems
    ? GameMode.UPPER_TRIVIA
    : assignmentModePoolForPlay && assignmentModePoolForPlay.length > 0
      ? getAssignmentRepresentativeMode(assignment!)
      : mode;
  const effectiveModePool = assignmentHasCustomProblems
    ? (assignmentModePoolForPlay || [])
    : (assignmentModePoolForPlay || modePool);
  const effectiveAnswerMode = assignment?.answerMode || answerMode;
  const effectiveCustomProblems = assignment?.gameMode === 'FREE' ? assignment.customProblems : undefined;
  const challengeScreen = getChallengeScreenForMode(effectiveMode);
  const handleAnswerResult = (result: AssignmentAnswerResult) => {
    if (onAnswerResult) {
      onAnswerResult(result);
      return;
    }
    const assignmentModePool = getAssignmentModePool(assignment);
    const assignmentUnit = assignment?.units.find((unit) => unit.modes.includes(result.mode));
    const isCustomAssignmentAnswer = result.mode === 'ASSIGNMENT_CUSTOM' && (assignment?.customProblems.length || 0) > 0;
    const isAssignmentAnswer = !!assignment && (isCustomAssignmentAnswer || !assignmentModePool || assignmentModePool.includes(result.mode));
    storageService.saveAssignmentAnswer({
      assignmentId: isAssignmentAnswer ? assignment?.id : undefined,
      mode: result.mode,
      subjectId: result.subjectId,
      unitName: isCustomAssignmentAnswer ? (languageMode === 'ENGLISH' ? 'Original Problem' : 'オリジナル問題') : assignmentUnit?.name,
      problemId: result.problemId,
      problemKey: result.problemKey,
      question: result.question,
      correctAnswer: result.correctAnswer,
      selectedAnswer: result.selectedAnswer,
      isRetry: result.isRetry,
      retryOfProblemKey: result.retryOfProblemKey,
      correct: result.correct,
      elapsedMs: Math.max(0, result.elapsedMs || 0),
      answeredAt: new Date().toISOString(),
    });
  };

  if (challengeScreen === GameScreen.KANJI_CHALLENGE) {
    return <KanjiChallengeScreen mode={effectiveMode} answerMode={effectiveAnswerMode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} languageMode={languageMode} onAnswerResult={handleAnswerResult} assignmentUnits={assignment?.units} />;
  }

  if (challengeScreen === GameScreen.ENGLISH_CHALLENGE) {
    return <EnglishChallengeScreen mode={effectiveMode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} languageMode={languageMode} onAnswerResult={handleAnswerResult} assignmentUnits={assignment?.units} />;
  }

  if (challengeScreen === GameScreen.GENERAL_CHALLENGE) {
    return (
      <GeneralChallengeScreen
        mode={effectiveMode}
        modePool={effectiveModePool}
        answerMode={effectiveAnswerMode}
        onComplete={onComplete}
        isChallenge={isChallenge}
        streak={streak}
        rewardHint={rewardHint}
        languageMode={languageMode}
        onAnswerResult={handleAnswerResult}
        customProblems={effectiveCustomProblems}
        assignmentUnits={assignment?.units}
      />
    );
  }

  return <MathChallengeScreen mode={effectiveMode} answerMode={effectiveAnswerMode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} languageMode={languageMode} onAnswerResult={handleAnswerResult} assignmentUnits={assignment?.units} />;
};

export default MiniGameProblemChallenge;
