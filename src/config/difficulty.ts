export interface DifficultyConfig {
  level: number;
  name: string;
  enemyHpMultiplier: number;
  enemyStrengthBonus: number;
  scienceRoomChance: number;
  legacyCardAllowed: boolean;
  cardEraserEnabled: boolean;
  removeBaseCost: number;
  removeCostStep: number;
}

export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  { level: 1, name: '前とび', enemyHpMultiplier: 1, enemyStrengthBonus: 0, scienceRoomChance: 0.5, legacyCardAllowed: true, cardEraserEnabled: false, removeBaseCost: 75, removeCostStep: 0 },
  { level: 2, name: '後ろとび', enemyHpMultiplier: 1.05, enemyStrengthBonus: 0, scienceRoomChance: 0.45, legacyCardAllowed: true, cardEraserEnabled: false, removeBaseCost: 75, removeCostStep: 25 },
  { level: 3, name: 'あやとび', enemyHpMultiplier: 1.1, enemyStrengthBonus: 0, scienceRoomChance: 0.4, legacyCardAllowed: true, cardEraserEnabled: false, removeBaseCost: 75, removeCostStep: 25 },
  { level: 4, name: '交差とび', enemyHpMultiplier: 1.18, enemyStrengthBonus: 1, scienceRoomChance: 0.34, legacyCardAllowed: true, cardEraserEnabled: false, removeBaseCost: 80, removeCostStep: 25 },
  { level: 5, name: '二重とび', enemyHpMultiplier: 1.25, enemyStrengthBonus: 1, scienceRoomChance: 0.28, legacyCardAllowed: true, cardEraserEnabled: false, removeBaseCost: 90, removeCostStep: 35 },
  { level: 6, name: '三重とび', enemyHpMultiplier: 1.35, enemyStrengthBonus: 2, scienceRoomChance: 0.22, legacyCardAllowed: false, cardEraserEnabled: true, removeBaseCost: 90, removeCostStep: 35 },
  { level: 7, name: 'はやぶさ返し', enemyHpMultiplier: 1.45, enemyStrengthBonus: 2, scienceRoomChance: 0.16, legacyCardAllowed: false, cardEraserEnabled: true, removeBaseCost: 100, removeCostStep: 40 },
  { level: 8, name: '校庭ワープとび', enemyHpMultiplier: 1.6, enemyStrengthBonus: 3, scienceRoomChance: 0.1, legacyCardAllowed: false, cardEraserEnabled: true, removeBaseCost: 100, removeCostStep: 50 },
  { level: 9, name: '銀河はやぶさ', enemyHpMultiplier: 1.75, enemyStrengthBonus: 4, scienceRoomChance: 0.05, legacyCardAllowed: false, cardEraserEnabled: true, removeBaseCost: 110, removeCostStep: 50 },
  { level: 10, name: '校長先生ブラックホール', enemyHpMultiplier: 1.95, enemyStrengthBonus: 5, scienceRoomChance: 0, legacyCardAllowed: false, cardEraserEnabled: true, removeBaseCost: 125, removeCostStep: 60 },
];

export const getDifficultyConfig = (level: number | undefined): DifficultyConfig =>
  DIFFICULTY_CONFIGS.find(config => config.level === level) || DIFFICULTY_CONFIGS[0];

export const clampDifficultyLevel = (level: number | undefined): number =>
  Math.min(10, Math.max(1, Number.isFinite(level || 0) ? Math.floor(level || 1) : 1));
