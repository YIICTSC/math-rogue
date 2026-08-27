import type { LanguageMode } from '../../types';

export type TrpgCopy = {
  ja: string;
  hira: string;
  en: string;
};

export const trpgCopy = (ja: string, hira: string, en: string): TrpgCopy => ({ ja, hira, en });

export const localizeTrpgCopy = (copy: TrpgCopy, languageMode: LanguageMode = 'JAPANESE') =>
  languageMode === 'ENGLISH' ? copy.en : languageMode === 'HIRAGANA' ? copy.hira : copy.ja;

export type TrpgStat = 'study' | 'energy' | 'friendship' | 'courage';
export type TrpgPhase = 'MAP' | 'EVENT' | 'RESULT' | 'QUESTION' | 'COMBAT' | 'REWARD' | 'ENDING';
export type TrpgQuestionGateId =
  | 'LIBRARY'
  | 'MISSION_CLEAR'
  | 'CHAPTER1_RESEARCH'
  | 'CHAPTER1_CLEAR'
  | 'CHAPTER2_RESEARCH'
  | 'CHAPTER2_CLEAR'
  | 'CHAPTER3_RESEARCH'
  | 'CHAPTER3_CLEAR'
  | 'CHAPTER4_RESEARCH'
  | 'CHAPTER4_CLEAR'
  | 'CHAPTER5_RESEARCH'
  | 'CHAPTER5_CLEAR'
  | 'HIDDEN_RESEARCH'
  | 'HIDDEN_CLEAR';
export type TrpgCombatResolution = 'DEFEAT' | 'PERSUADE' | 'ESCAPE' | 'OVERWHELMED';
export type TrpgCheckGrade = 'GREAT' | 'SUCCESS' | 'SETBACK';

export type TrpgLocation = {
  id: string;
  eventId: string;
  chapter?: number;
  name: TrpgCopy;
  shortName: TrpgCopy;
  description: TrpgCopy;
  backgroundAsset: string;
  iconAsset: string;
  x: number;
  y: number;
  danger: 0 | 1 | 2 | 3;
  travelCost: number;
};

export type TrpgLocationVisitState = 'UNVISITED' | 'SEEN' | 'RESOLVED' | 'ALTERED' | 'COMPANION_REACTION';

export type TrpgChoice = {
  id: string;
  label: TrpgCopy;
  detail: TrpgCopy;
  stat: TrpgStat;
  difficulty: number;
  clueOnSuccess: number;
  stressOnFailure: number;
  success: TrpgCopy;
  failure: TrpgCopy;
  flags: Record<string, boolean | number | string>;
  /** Optional authored condition for a contextual choice. */
  requiresFlag?: string;
  /** Flags granted only when this choice clears its check. */
  successFlags?: Record<string, boolean | number | string>;
  /** Flags granted only when this choice misses its check. */
  failureFlags?: Record<string, boolean | number | string>;
};

export type TrpgEventArchetype =
  | 'INVESTIGATION'
  | 'DIALOGUE'
  | 'PUZZLE'
  | 'CHASE'
  | 'DEFENSE'
  | 'COMBAT';

export type TrpgEvent = {
  id: string;
  locationId: string;
  chapter?: number;
  title: TrpgCopy;
  eyebrow: TrpgCopy;
  body: TrpgCopy;
  backgroundAsset: string;
  /** Original full-scene artwork produced specifically for this event. */
  illustrationAsset?: string;
  foregroundAsset?: string;
  archetype?: TrpgEventArchetype;
  choices: TrpgChoice[];
  nextPhase: 'MAP' | 'QUESTION' | 'COMBAT';
  questionGate?: TrpgQuestionGateId;
  /** Optional stateful revisit scene shown after the primary scene is cleared. */
  revisit?: TrpgEventVariant;
};

export type TrpgEventVariant = {
  id: string;
  locationId: string;
  title: TrpgCopy;
  eyebrow: TrpgCopy;
  body: TrpgCopy;
  backgroundAsset: string;
  illustrationAsset?: string;
  foregroundAsset?: string;
  archetype?: TrpgEventArchetype;
  choices: TrpgChoice[];
  nextPhase: 'MAP' | 'QUESTION' | 'COMBAT';
  questionGate?: TrpgQuestionGateId;
};

export type TrpgReward = {
  id: string;
  chapter?: number;
  /** Chapter in which the effect is consumed; defaults to origin chapter + 1. */
  useChapter?: number;
  name: TrpgCopy;
  description: TrpgCopy;
  artName: string;
  /** Dedicated discovery illustration. Kept separate from card art so rewards never fall back to unknown-card. */
  artAsset?: string;
  flag: string;
  /** Exact point in the following route where the discovery is consumed. */
  useCopy: TrpgCopy;
  effect: {
    kind: 'CHECK_BONUS' | 'TRAVEL_TIME' | 'QUESTION_CLUE' | 'COMBAT_INSIGHT' | 'COMBAT_RESOLVE' | 'FATIGUE_RECOVERY' | 'ENDING_KEY';
    amount: number;
  };
};

export type TrpgEnding = {
  id: string;
  chapter?: number;
  title: TrpgCopy;
  subtitle: TrpgCopy;
  body: TrpgCopy;
  tone: 'CYAN' | 'GOLD' | 'VIOLET' | 'ROSE';
  artAsset?: string;
  route?: TrpgCombatResolution | 'TIMELINE';
};

export type TrpgEndingArt = {
  asset: string;
  focalPoint: { x: number; y: number };
  alt: TrpgCopy;
};

export type TrpgCheckResult = {
  choiceId: string;
  stat: TrpgStat;
  roll: number;
  statValue: number;
  fateBonus: number;
  itemBonus?: number;
  itemName?: TrpgCopy;
  total: number;
  difficulty: number;
  success: boolean;
  grade?: TrpgCheckGrade;
  /** Permanent growth awarded by this check after soft-cap adjustment. */
  statGain?: number;
  copy: TrpgCopy;
  nextPhase: 'MAP' | 'QUESTION' | 'COMBAT';
};

export type TrpgCombatLogEntry = {
  turn: number;
  copy: TrpgCopy;
};

export type TrpgCombatState = {
  /** Optional encounter metadata added without invalidating v1 saves. */
  encounterId?: string;
  enemyId?: string;
  combatType?: 'DUEL' | 'DEFENSE' | 'ESCORT' | 'CHASE' | 'PUZZLE_BATTLE' | 'NEGOTIATION';
  phase?: number;
  actionHistory?: TrpgCombatActionId[];
  hazard?: { id: string; label: TrpgCopy; progress: number; target: number };
  allyStates?: Array<{ id: string; label: TrpgCopy; integrity: number; status: 'READY' | 'THREATENED' | 'SAFE' }>;
  /** Changes the encounter rule-of-thumb and the visual encounter label per chapter. */
  mode?: 'DUEL' | 'RITUAL' | 'CHASE' | 'DEFENSE' | 'PARADOX' | 'ECHO';
  /** Short, authored objective shown beside the encounter actions. */
  objective?: TrpgCopy;
  enemyHp: number;
  enemyMaxHp: number;
  enemyIntent: number;
  insight: number;
  resolve: number;
  turn: number;
  result: 'WIN' | 'LOSE' | null;
  resolution: TrpgCombatResolution | null;
  logs: TrpgCombatLogEntry[];
};

export type TrpgCampaignState = {
  version: 1;
  seed: number;
  rngStep: number;
  phase: TrpgPhase;
  chapter: number;
  time: number;
  stress: number;
  fate: number;
  clues: number;
  stats: Record<TrpgStat, number>;
  flags: Record<string, boolean | number | string>;
  inventory: string[];
  unlockedLocationIds: string[];
  /** Visit state is additive so v1 saves without it remain readable. */
  locationStates?: Record<string, TrpgLocationVisitState>;
  completedEventIds: string[];
  currentLocationId: string;
  currentEventId: string | null;
  currentEventVariant?: 'PRIMARY' | 'REVISIT';
  pendingQuestionGate: TrpgQuestionGateId | null;
  completedQuestionGates: TrpgQuestionGateId[];
  result: TrpgCheckResult | null;
  combat: TrpgCombatState | null;
  selectedRewardId: string | null;
  endingId: string | null;
  /** Ending IDs discovered across replays; optional for v1 save compatibility. */
  endingHistory?: string[];
  /** Short causal summary assembled from route, quiz, and combat choices. */
  endingSummary?: TrpgCopy;
  discoveryLog: TrpgCopy[];
};

export type TrpgCombatActionId = 'STRIKE' | 'INVESTIGATE' | 'PERSUADE' | 'GUARD' | 'ESCAPE' | 'INTERACT' | 'USE_ITEM' | 'ALLY_SKILL' | 'PROTECT';
