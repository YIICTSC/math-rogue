export type CranePrizeId =
  | 'raccoon'
  | 'dragon'
  | 'chick'
  | 'cat'
  | 'red-capsule'
  | 'blue-capsule'
  | 'elementary-hero'
  | 'high-school-hero'
  | 'magic-hero';

export type CranePermanentEffectKind =
  | 'MAX_HP'
  | 'MAX_ENERGY'
  | 'BATTLE_STRENGTH'
  | 'BATTLE_BLOCK'
  | 'BATTLE_DRAW';

export interface CranePermanentEffect {
  kind: CranePermanentEffectKind;
  amount: number;
  label: {
    ja: string;
    hira: string;
    en: string;
  };
}

export interface CranePrizeDefinition {
  id: CranePrizeId;
  spriteIndex: number;
  heldSpriteIndex: number;
  /** Optional sheet overrides for the protagonist prize sprites. */
  spriteSheet?: string;
  spriteColumns?: number;
  spriteRows?: number;
  spriteAspectRatio?: number;
  heldSpriteSheet?: string;
  heldSpriteColumns?: number;
  heldSpriteRows?: number;
  heldSpriteAspectRatio?: number;
  baseX: number;
  baseY: number;
  baseRotation: number;
  drift: number;
  rollDegrees: number;
  periodMs: number;
  phase: number;
  catchRadius: number;
  carryDropChance: number;
  goldReward: number;
  permanentEffect: CranePermanentEffect;
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
export const CRANE_REPLAY_COST = 100;
// The physical internal chute opening is on the left side of the cabinet sheet.
export const CRANE_CHUTE_X = 19;
export const CRANE_CARRY_DURATION_MS = 1250;
export const CRANE_CHUTE_DROP_DURATION_MS = 720;
export const CRANE_FALL_DURATION_MS = 640;

const PROTAGONIST_PRIZE_SHEET = 'sprites/mini-games/crane-game/crane-game-protagonist-prizes-3x2-alpha-v1.webp';
const PROTAGONIST_SHEET_COLUMNS = 3;
const PROTAGONIST_SHEET_ROWS = 2;
const PROTAGONIST_CELL_ASPECT = 2 / 3;

const protagonistPrizeSheetProps = {
  spriteSheet: PROTAGONIST_PRIZE_SHEET,
  spriteColumns: PROTAGONIST_SHEET_COLUMNS,
  spriteRows: PROTAGONIST_SHEET_ROWS,
  spriteAspectRatio: PROTAGONIST_CELL_ASPECT,
  heldSpriteSheet: PROTAGONIST_PRIZE_SHEET,
  heldSpriteColumns: PROTAGONIST_SHEET_COLUMNS,
  heldSpriteRows: PROTAGONIST_SHEET_ROWS,
  heldSpriteAspectRatio: PROTAGONIST_CELL_ASPECT,
};

export const CRANE_PRIZES: CranePrizeDefinition[] = [
  {
    id: 'cat', spriteIndex: 7, heldSpriteIndex: 3, baseX: 31, baseY: 82, baseRotation: -31,
    drift: 1.4, rollDegrees: 7, periodMs: 2900, phase: 0.4, catchRadius: 8.5, carryDropChance: 0.3, goldReward: 40,
    permanentEffect: { kind: 'MAX_HP', amount: 3, label: { ja: '最大HP +3', hira: 'さいだいHP +3', en: 'Max HP +3' } },
    label: { ja: '白ねこのぬいぐるみ', hira: 'しろねこの ぬいぐるみ', en: 'White Cat Plush' },
  },
  {
    id: 'raccoon', spriteIndex: 4, heldSpriteIndex: 0, baseX: 35, baseY: 81, baseRotation: 24,
    drift: 2.4, rollDegrees: 13, periodMs: 2200, phase: 1.7, catchRadius: 10.5, carryDropChance: 0.42, goldReward: 50,
    permanentEffect: { kind: 'MAX_ENERGY', amount: 1, label: { ja: '最大エナジー +1', hira: 'さいだいエナジー +1', en: 'Max Energy +1' } },
    label: { ja: 'アライグマのぬいぐるみ', hira: 'あらいぐまの ぬいぐるみ', en: 'Raccoon Plush' },
  },
  {
    id: 'red-capsule', spriteIndex: 8, heldSpriteIndex: 4, baseX: 47, baseY: 88, baseRotation: -18,
    drift: 3.2, rollDegrees: 19, periodMs: 1800, phase: 2.1, catchRadius: 7.5, carryDropChance: 0.18, goldReward: 25,
    permanentEffect: { kind: 'BATTLE_STRENGTH', amount: 1, label: { ja: '戦闘開始時の筋力 +1', hira: 'せんとう かいしじの きんりょく +1', en: 'Battle Strength +1' } },
    label: { ja: '赤いカプセル', hira: 'あかい カプセル', en: 'Red Capsule' },
  },
  {
    id: 'dragon', spriteIndex: 5, heldSpriteIndex: 1, baseX: 60, baseY: 80, baseRotation: -20,
    drift: 1.6, rollDegrees: 8, periodMs: 3400, phase: 3.2, catchRadius: 9.5, carryDropChance: 0.35, goldReward: 55,
    permanentEffect: { kind: 'BATTLE_BLOCK', amount: 4, label: { ja: '戦闘開始時のブロック +4', hira: 'せんとう かいしじの ブロック +4', en: 'Battle-start Block +4' } },
    label: { ja: '青いドラゴンのぬいぐるみ', hira: 'あおい ドラゴンの ぬいぐるみ', en: 'Blue Dragon Plush' },
  },
  {
    id: 'blue-capsule', spriteIndex: 9, heldSpriteIndex: 5, baseX: 71, baseY: 88, baseRotation: 22,
    drift: 2.8, rollDegrees: 17, periodMs: 2000, phase: 4.4, catchRadius: 7.5, carryDropChance: 0.22, goldReward: 25,
    permanentEffect: { kind: 'BATTLE_DRAW', amount: 1, label: { ja: '戦闘開始時のドロー +1', hira: 'せんとう かいしじの ドロー +1', en: 'Battle-start Draw +1' } },
    label: { ja: '青いカプセル', hira: 'あおい カプセル', en: 'Blue Capsule' },
  },
  {
    id: 'chick', spriteIndex: 6, heldSpriteIndex: 2, baseX: 83, baseY: 82, baseRotation: 28,
    drift: 1.8, rollDegrees: 10, periodMs: 2600, phase: 5.3, catchRadius: 9, carryDropChance: 0.28, goldReward: 35,
    permanentEffect: { kind: 'MAX_HP', amount: 2, label: { ja: '最大HP +2', hira: 'さいだいHP +2', en: 'Max HP +2' } },
    label: { ja: 'ひよこのぬいぐるみ', hira: 'ひよこの ぬいぐるみ', en: 'Chick Plush' },
  },
  {
    id: 'elementary-hero',
    spriteIndex: 0,
    heldSpriteIndex: 3,
    ...protagonistPrizeSheetProps,
    baseX: 40,
    baseY: 80,
    baseRotation: -8,
    drift: 1.7,
    rollDegrees: 11,
    periodMs: 2450,
    phase: 0.8,
    catchRadius: 9.5,
    carryDropChance: 0.3,
    goldReward: 70,
    permanentEffect: { kind: 'MAX_HP', amount: 5, label: { ja: '最大HP +5', hira: 'さいだいHP +5', en: 'Max HP +5' } },
    label: { ja: 'わんぱく小学生ぬいぐるみ', hira: 'わんぱく しょうがくせい ぬいぐるみ', en: 'Spirited Elementary Student Plush' },
  },
  {
    id: 'high-school-hero',
    spriteIndex: 1,
    heldSpriteIndex: 4,
    ...protagonistPrizeSheetProps,
    baseX: 58,
    baseY: 79,
    baseRotation: 7,
    drift: 1.5,
    rollDegrees: 9,
    periodMs: 3100,
    phase: 2.6,
    catchRadius: 9.5,
    carryDropChance: 0.34,
    goldReward: 85,
    permanentEffect: { kind: 'BATTLE_STRENGTH', amount: 2, label: { ja: '戦闘開始時の筋力 +2', hira: 'せんとう かいしじの きんりょく +2', en: 'Battle Strength +2' } },
    label: { ja: '反逆の高校生ぬいぐるみ', hira: 'はんぎゃくの こうこうせい ぬいぐるみ', en: 'Rebellious High Schooler Plush' },
  },
  {
    id: 'magic-hero',
    spriteIndex: 2,
    heldSpriteIndex: 5,
    ...protagonistPrizeSheetProps,
    baseX: 76,
    baseY: 81,
    baseRotation: -12,
    drift: 1.9,
    rollDegrees: 14,
    periodMs: 2150,
    phase: 4.8,
    catchRadius: 9,
    carryDropChance: 0.26,
    goldReward: 90,
    permanentEffect: { kind: 'MAX_ENERGY', amount: 1, label: { ja: '最大エナジー +1', hira: 'さいだいエナジー +1', en: 'Max Energy +1' } },
    label: { ja: '星宮あかりぬいぐるみ', hira: 'ほしみや あかり ぬいぐるみ', en: 'Akari Hoshimiya Plush' },
  },
];

export const clampCraneX = (x: number): number => Math.max(8, Math.min(92, x));

export const clampProgress = (progress: number): number => Math.max(0, Math.min(1, progress));

export const easeInOut = (progress: number): number => {
  const t = clampProgress(progress);
  return t * t * (3 - 2 * t);
};

export const interpolateCraneX = (startX: number, endX: number, progress: number): number => (
  startX + (endX - startX) * easeInOut(progress)
);

/**
 * Decide whether the held prize slips while the carriage travels to the chute.
 * A slip happens between 32% and 80% of the route, keeping the drop visible
 * instead of making it look like a random disappearance at the edge of the bay.
 */
export const getCarryDropPoint = (
  randomValue: number,
  prize: CranePrizeDefinition,
): number | null => {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= prize.carryDropChance) return null;
  const normalized = randomValue / Math.max(0.0001, prize.carryDropChance);
  return 0.32 + normalized * 0.48;
};

export const getPrizePose = (prize: CranePrizeDefinition, _elapsedMs: number): CranePrizePose => ({
  x: prize.baseX,
  y: prize.baseY,
  rotation: prize.baseRotation,
});

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
