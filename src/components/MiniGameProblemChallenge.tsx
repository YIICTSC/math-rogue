import React from 'react';
import { AnswerMode, GameMode, GameScreen } from '../types';
import { getChallengeScreenForMode } from '../subjectConfig';
import MathChallengeScreen from './MathChallengeScreen';
import KanjiChallengeScreen from './KanjiChallengeScreen';
import EnglishChallengeScreen from './EnglishChallengeScreen';
import GeneralChallengeScreen from './GeneralChallengeScreen';

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

  if (challengeScreen === GameScreen.KANJI_CHALLENGE) {
    return <KanjiChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} />;
  }

  if (challengeScreen === GameScreen.ENGLISH_CHALLENGE) {
    return <EnglishChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} />;
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
      />
    );
  }

  return <MathChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} rewardHint={rewardHint} />;
};

export default MiniGameProblemChallenge;
