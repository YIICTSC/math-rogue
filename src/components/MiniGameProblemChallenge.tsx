import React from 'react';
import { AnswerMode, GameMode, GameScreen } from '../types';
import { getChallengeScreenForMode } from '../subjectConfig';
import MathChallengeScreen from './MathChallengeScreen';
import KanjiChallengeScreen from './KanjiChallengeScreen';
import EnglishChallengeScreen from './EnglishChallengeScreen';
import GeneralChallengeScreen from './GeneralChallengeScreen';
import { storageService } from '../services/storageService';
import { getAssignmentModePool } from '../utils/assignmentUtils';

interface MiniGameProblemChallengeProps {
  mode: GameMode;
  modePool?: string[];
  answerMode?: AnswerMode;
  onComplete: (correctCount: number) => void;
  isChallenge?: boolean;
  streak?: number;
  rewardHint?: string;
}

const MiniGameProblemChallenge: React.FC<MiniGameProblemChallengeProps> = ({
  mode,
  modePool,
  answerMode = 'CHOICE',
  onComplete,
  isChallenge = false,
  streak = 0,
  rewardHint,
}) => {
  const challengeScreen = getChallengeScreenForMode(mode);
  const assignment = storageService.getCurrentAssignment();
  const handleAnswerResult = (result: { mode: string; correct: boolean; elapsedMs: number; problemId?: string }) => {
    const assignmentModePool = getAssignmentModePool(assignment);
    const assignmentUnit = assignment?.units.find((unit) => unit.modes.includes(result.mode));
    const isCustomAssignmentAnswer = result.mode === 'ASSIGNMENT_CUSTOM' && (assignment?.customProblems.length || 0) > 0;
    const isAssignmentAnswer = !!assignment && (isCustomAssignmentAnswer || !assignmentModePool || assignmentModePool.includes(result.mode));
    storageService.saveAssignmentAnswer({
      assignmentId: isAssignmentAnswer ? assignment?.id : undefined,
      mode: result.mode,
      unitName: isCustomAssignmentAnswer ? 'オリジナル問題' : assignmentUnit?.name,
      problemId: result.problemId,
      correct: result.correct,
      elapsedMs: Math.max(0, result.elapsedMs || 0),
      answeredAt: new Date().toISOString(),
    });
  };

  if (challengeScreen === GameScreen.KANJI_CHALLENGE) {
    return <KanjiChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} onAnswerResult={handleAnswerResult} />;
  }

  if (challengeScreen === GameScreen.ENGLISH_CHALLENGE) {
    return <EnglishChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} onAnswerResult={handleAnswerResult} />;
  }

  if (challengeScreen === GameScreen.GENERAL_CHALLENGE) {
    return (
      <GeneralChallengeScreen
        mode={mode}
        modePool={modePool}
        answerMode={answerMode}
        onComplete={onComplete}
        isChallenge={isChallenge}
        streak={streak}
        rewardHint={rewardHint}
        onAnswerResult={handleAnswerResult}
        customProblems={assignment?.gameMode === 'FREE' ? assignment.customProblems : undefined}
      />
    );
  }

  return <MathChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} onAnswerResult={handleAnswerResult} />;
};

export default MiniGameProblemChallenge;
