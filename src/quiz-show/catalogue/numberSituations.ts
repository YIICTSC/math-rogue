import type { RecommendedAudience } from '../types';
import type { Category, Level } from './partyTopics';
import data from './numberSituations.json';

type LocalText = readonly [string, string, string];
type SituationGroup = readonly [id: string, level: Level, question: LocalText, scenes: readonly LocalText[], audiences?: readonly RecommendedAudience[]];
const situations = data as unknown as Record<Category, readonly SituationGroup[]>;

// The remaining numberPrompts rows still supply four-choice options for the other party rules.
export const keptNumericPrompts: Record<Category, readonly number[]> = {
  ANIMALS: [1, 7, 17, 20, 25, 39, 43],
  FOOD: [0, 4, 9, 10, 12, 14, 16, 20, 26, 29, 37],
  LOVE: [6, 10, 11, 13, 14, 16, 17],
  DAILY: [1, 7, 10, 13, 16, 17, 18, 19, 23],
  WORLD: [2, 3, 5, 6, 8, 13, 16, 20],
  NATURE: [1, 3, 5, 8, 10, 16, 17, 21],
  CULTURE: [1, 5, 6, 10, 14, 17, 18, 23],
  FANTASY: [3, 4, 7, 10, 11, 12, 14],
  SPORTS: [0, 4, 5, 9, 10, 11, 19, 22, 23],
  GAMES: [0, 3, 5, 9, 12, 17, 20, 22, 23],
  SCHOOL: [0, 2, 3, 8, 10, 13, 14, 15, 16, 18, 22],
  WORK: [5, 6, 7, 9, 10, 11, 12, 15, 16, 20, 24],
  HISTORY: [2, 3, 5, 11, 13, 17, 19, 20, 21, 22],
  TECH: [0, 1, 2, 3, 6, 7, 9, 14, 23],
  MYSTERY: [1, 2, 4, 5, 7, 8, 11, 14, 17, 20],
  MONEY: [1, 3, 4, 5, 6, 8, 11, 12, 14, 16, 17, 18, 20, 21, 22, 25],
  SEASONS: [2, 3, 8, 13, 15, 18, 21, 22, 24],
  TRANSPORT: [0, 1, 3, 7, 8, 10, 14, 16, 19, 22],
  HEALTH: [1, 3, 4, 7, 8, 11, 12, 13, 17, 19, 21, 23],
  SPACE: [1, 2, 3, 8, 12, 15, 23, 24],
};

export function numberSituations(category: Category, locale: number) {
  return situations[category].flatMap(([id, level, question, scenes, audiences]) => scenes.map((scene, index) => ({
    id: `number-${id}-${index}`,
    text: question[locale].replace('{scene}', () => scene[locale]),
    level,
    audiences,
  })));
}
