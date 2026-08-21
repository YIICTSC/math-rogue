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
export type TrpgQuestionGateId = 'LIBRARY' | 'MISSION_CLEAR' | 'CHAPTER1_RESEARCH' | 'CHAPTER1_CLEAR';
export type TrpgCombatResolution = 'DEFEAT' | 'PERSUADE' | 'ESCAPE' | 'OVERWHELMED';

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
};

export type TrpgEvent = {
  id: string;
  locationId: string;
  chapter?: number;
  title: TrpgCopy;
  eyebrow: TrpgCopy;
  body: TrpgCopy;
  backgroundAsset: string;
  foregroundAsset?: string;
  choices: TrpgChoice[];
  nextPhase: 'MAP' | 'QUESTION' | 'COMBAT';
  questionGate?: TrpgQuestionGateId;
};

export type TrpgReward = {
  id: string;
  chapter?: number;
  name: TrpgCopy;
  description: TrpgCopy;
  artName: string;
  flag: string;
};

export type TrpgEnding = {
  id: string;
  chapter?: number;
  title: TrpgCopy;
  subtitle: TrpgCopy;
  body: TrpgCopy;
  tone: 'CYAN' | 'GOLD' | 'VIOLET' | 'ROSE';
};

export type TrpgCheckResult = {
  choiceId: string;
  stat: TrpgStat;
  roll: number;
  statValue: number;
  fateBonus: number;
  total: number;
  difficulty: number;
  success: boolean;
  copy: TrpgCopy;
  nextPhase: 'MAP' | 'QUESTION' | 'COMBAT';
};

export type TrpgCombatLogEntry = {
  turn: number;
  copy: TrpgCopy;
};

export type TrpgCombatState = {
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
  completedEventIds: string[];
  currentLocationId: string;
  currentEventId: string | null;
  pendingQuestionGate: TrpgQuestionGateId | null;
  completedQuestionGates: TrpgQuestionGateId[];
  result: TrpgCheckResult | null;
  combat: TrpgCombatState | null;
  selectedRewardId: string | null;
  endingId: string | null;
  discoveryLog: TrpgCopy[];
};

export type TrpgCombatActionId = 'STRIKE' | 'INVESTIGATE' | 'PERSUADE' | 'GUARD' | 'ESCAPE';
