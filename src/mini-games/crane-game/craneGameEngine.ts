export type CranePrizeId =
  | 'raccoon'
  | 'dragon'
  | 'chick'
  | 'cat'
  | 'red-capsule'
  | 'blue-capsule';

export interface CranePrizeDefinition {
  id: CranePrizeId;
  spriteIndex: number;
  baseX: number;
  baseY: number;
  baseRotation: number;
  drift: number;
  rollDegrees: number;
  periodMs: number;
  phase: number;
  catchRadius: number;
  goldReward: number;
  label: {
    ja: string;
    hira: string;
    en: string;
  };
}

export interface CranePrizePose {
  x: number;
  y: number;
  rotation: number;
}

export interface CraneCatch {
  prize: CranePrizeDefinition;
  pose: CranePrizePose;
  distance: number;
}

export const CRANE_EVENT_CHANCE = 0.25;

export const CRANE_PRIZES: CranePrizeDefinition[] = [
  {
    id: 'cat', spriteIndex: 7, baseX: 18, baseY: 82, baseRotation: -31,
    drift: 1.4, rollDegrees: 7, periodMs: 2900, phase: 0.4, catchRadius: 8.5, goldReward: 40,
    label: { ja: '白ねこのぬいぐるみ', hira: 'しろねこの ぬいぐるみ', en: 'White Cat Plush' },
  },
  {
    id: 'raccoon', spriteIndex: 4, baseX: 35, baseY: 81, baseRotation: 24,
    drift: 2.4, rollDegrees: 13, periodMs: 2200, phase: 1.7, catchRadius: 10.5, goldReward: 50,
    label: { ja: 'アライグマのぬいぐるみ', hira: 'あらいぐまの ぬいぐるみ', en: 'Raccoon Plush' },
  },
  {
    id: 'red-capsule', spriteIndex: 8, baseX: 47, baseY: 88, baseRotation: -18,
    drift: 3.2, rollDegrees: 19, periodMs: 1800, phase: 2.1, catchRadius: 7.5, goldReward: 25,
    label: { ja: '赤いカプセル', hira: 'あかい カプセル', en: 'Red Capsule' },
  },
  {
    id: 'dragon', spriteIndex: 5, baseX: 60, baseY: 80, baseRotation: -20,
    drift: 1.6, rollDegrees: 8, periodMs: 3400, phase: 3.2, catchRadius: 9.5, goldReward: 55,
    label: { ja: '青いドラゴンのぬいぐるみ', hira: 'あおい ドラゴンの ぬいぐるみ', en: 'Blue Dragon Plush' },
  },
  {
    id: 'blue-capsule', spriteIndex: 9, baseX: 71, baseY: 88, baseRotation: 22,
    drift: 2.8, rollDegrees: 17, periodMs: 2000, phase: 4.4, catchRadius: 7.5, goldReward: 25,
    label: { ja: '青いカプセル', hira: 'あおい カプセル', en: 'Blue Capsule' },
  },
  {
    id: 'chick', spriteIndex: 6, baseX: 83, baseY: 82, baseRotation: 28,
    drift: 1.8, rollDegrees: 10, periodMs: 2600, phase: 5.3, catchRadius: 9, goldReward: 35,
    label: { ja: 'ひよこのぬいぐるみ', hira: 'ひよこの ぬいぐるみ', en: 'Chick Plush' },
  },
];

export const clampCraneX = (x: number): number => Math.max(8, Math.min(92, x));

export const getPrizePose = (prize: CranePrizeDefinition, elapsedMs: number): CranePrizePose => {
  const wave = (elapsedMs / prize.periodMs) * Math.PI * 2 + prize.phase;
  return {
    x: prize.baseX + Math.sin(wave) * prize.drift,
    y: prize.baseY + Math.cos(wave * 0.55) * 0.7,
    rotation: prize.baseRotation + Math.sin(wave) * prize.rollDegrees,
  };
};

export const findCatchCandidate = (
  clawX: number,
  elapsedMs: number,
  prizes: CranePrizeDefinition[] = CRANE_PRIZES,
): CraneCatch | null => {
  const candidates = prizes
    .map((prize) => {
      const pose = getPrizePose(prize, elapsedMs);
      return { prize, pose, distance: Math.abs(pose.x - clawX) };
    })
    .filter((candidate) => candidate.distance <= candidate.prize.catchRadius)
    .sort((left, right) => left.distance - right.distance);
  return candidates[0] ?? null;
};

export const getHangingPrizeRotation = (
  caughtRotation: number,
  elapsedSinceCatchMs: number,
  horizontalDirection: -1 | 0 | 1,
): number => {
  const directionLean = horizontalDirection * -7;
  const swing = Math.sin(elapsedSinceCatchMs / 170) * 8 * Math.exp(-elapsedSinceCatchMs / 2400);
  return caughtRotation + directionLean + swing;
};

export const shouldTriggerCraneEvent = (
  randomValue: number,
  currentAct: number,
  lastPlayedAct: number | undefined,
): boolean => lastPlayedAct !== currentAct && randomValue < CRANE_EVENT_CHANCE;
