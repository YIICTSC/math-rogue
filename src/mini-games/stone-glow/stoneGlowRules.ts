export type StoneGlowOutcome = 'WIN' | 'LOSE' | 'DRAW';

export interface StoneGlowRoundResultInput {
  playerScore: number;
  cpuScore: number;
  playerCardCount: number;
  cpuCardCount: number;
  round: number;
  goalScore?: number;
  maxRounds?: number;
}

/**
 * Resolve the result only after both players have completed the same round.
 * A tied score uses the common gem-game tie-breaker of fewer purchased cards;
 * an exact tie remains a draw instead of favoring either turn order.
 */
export const resolveStoneGlowRound = ({
  playerScore,
  cpuScore,
  playerCardCount,
  cpuCardCount,
  round,
  goalScore = 8,
  maxRounds = 18,
}: StoneGlowRoundResultInput): StoneGlowOutcome | null => {
  const reachedEnd = playerScore >= goalScore || cpuScore >= goalScore || round > maxRounds;
  if (!reachedEnd) return null;

  if (playerScore !== cpuScore) return playerScore > cpuScore ? 'WIN' : 'LOSE';
  if (playerCardCount !== cpuCardCount) return playerCardCount < cpuCardCount ? 'WIN' : 'LOSE';
  return 'DRAW';
};
