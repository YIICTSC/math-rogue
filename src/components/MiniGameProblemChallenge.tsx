import React from 'react';
import { GameMode, GameScreen } from '../types';
import { getChallengeScreenForMode } from '../subjectConfig';
import MathChallengeScreen from './MathChallengeScreen';
import KanjiChallengeScreen from './KanjiChallengeScreen';
import EnglishChallengeScreen from './EnglishChallengeScreen';
import GeneralChallengeScreen from './GeneralChallengeScreen';

interface MiniGameProblemChallengeProps {
  mode: GameMode;
  modePool?: string[];
  onComplete: (correctCount: number) => void;
  isChallenge?: boolean;
  streak?: number;
}

const MiniGameProblemChallenge: React.FC<MiniGameProblemChallengeProps> = ({
  mode,
  modePool,
  onComplete,
  isChallenge = false,
  streak = 0,
}) => {
  const challengeScreen = getChallengeScreenForMode(mode);

  if (challengeScreen === GameScreen.KANJI_CHALLENGE) {
    return <KanjiChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} />;
  }

  if (challengeScreen === GameScreen.ENGLISH_CHALLENGE) {
    return <EnglishChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} />;
  }

  if (challengeScreen === GameScreen.GENERAL_CHALLENGE) {
    return (
      <GeneralChallengeScreen
        mode={mode}
        modePool={modePool}
        onComplete={onComplete}
        isChallenge={isChallenge}
        streak={streak}
      />
    );
  }

  return <MathChallengeScreen mode={mode} onComplete={onComplete} isChallenge={isChallenge} streak={streak} />;
};

export default MiniGameProblemChallenge;
