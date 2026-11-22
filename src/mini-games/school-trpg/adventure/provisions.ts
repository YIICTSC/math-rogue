import type { Biome, Good, Goods, Stat, Text } from './content';
import type { Adventure } from './state';

type MealEffect = Partial<Record<Stat | 'armor' | 'damage' | 'travel' | 'gather' | 'light' | 'recovery', number>>;
type MealRecipe = {
  name: Text;
  benefit: Text;
  biome: Biome;
  cost: Partial<Goods>;
  hours: number;
  effect: MealEffect;
};
export const MEALS = {
  'bell-bento': {
    name: ['鐘守のお弁当', 'Bellkeeper’s bento', 'かねもりの おべんとう'],
    benefit: ['体力の判定＋2、防御＋1', '+2 Might checks and +1 armor', 'たいりょくの はんてい＋2、ぼうぎょ＋1'],
    biome: 'academy', cost: { grain: 1, meat: 1 }, hours: 16, effect: { might: 2, armor: 1 },
  },
  'inkberry-tea': {
    name: ['墨苺の紅茶膳', 'Inkberry tea set', 'すみいちごの こうちゃぜん'],
    benefit: ['知恵の判定＋2、回復量＋2', '+2 Insight checks and +2 recovery', 'ちえの はんていと かいふく＋2'],
    biome: 'academy', cost: { herb: 2, grain: 1 }, hours: 18, effect: { insight: 2, recovery: 2 },
  },
  'herb-pie': {
    name: ['森番の香草パイ', 'Ranger’s herb pie', 'もりばんの こうそうパイ'],
    benefit: ['器用の判定＋2、採集量＋1', '+2 Finesse checks and +1 gathering yield', 'きようの はんてい＋2、さいしゅう＋1'],
    biome: 'grove', cost: { herb: 1, grain: 2 }, hours: 16, effect: { finesse: 2, gather: 1 },
  },
  'root-broth': {
    name: ['根菜のだし煮', 'Rootkeeper’s broth', 'こんさいの だしに'],
    benefit: ['防御＋2、回復量＋1', '+2 armor and +1 recovery', 'ぼうぎょ＋2、かいふく＋1'],
    biome: 'grove', cost: { herb: 2, meat: 1 }, hours: 15, effect: { armor: 2, recovery: 1 },
  },
  'tide-rice': {
    name: ['潮風の焼き魚飯', 'Sea breeze fish rice', 'しおかぜの やきざかなめし'],
    benefit: ['街道の移動時間−1時間、器用の判定＋1', 'Road travel takes 1 hour less and +1 Finesse checks', 'かいどうが 1じかん はやく、きよう＋1'],
    biome: 'coast', cost: { fish: 1, grain: 1 }, hours: 20, effect: { travel: 1, finesse: 1 },
  },
  'dock-chowder': {
    name: ['波止場の白いスープ', 'White dock chowder', 'はとばの しろい スープ'],
    benefit: ['魅力の判定＋2、回復量＋1', '+2 Presence checks and +1 recovery', 'みりょく＋2、かいふく＋1'],
    biome: 'coast', cost: { fish: 2, herb: 1 }, hours: 18, effect: { presence: 2, recovery: 1 },
  },
  'ridge-bread': {
    name: ['峠のチーズパン', 'Ridge cheese bread', 'とうげの チーズパン'],
    benefit: ['防御＋1、街道の移動時間−1時間', '+1 armor and road travel takes 1 hour less', 'ぼうぎょ＋1、かいどうが 1じかん はやい'],
    biome: 'alpine', cost: { grain: 2, herb: 1 }, hours: 22, effect: { armor: 1, travel: 1 },
  },
  'snow-stew': {
    name: ['雪籠もりの煮込み', 'Snow shelter stew', 'ゆきごもりの にこみ'],
    benefit: ['体力の判定＋1、回復量＋3', '+1 Might checks and +3 recovery', 'たいりょく＋1、かいふく＋3'],
    biome: 'alpine', cost: { meat: 2, herb: 1 }, hours: 18, effect: { might: 1, recovery: 3 },
  },
  'cinder-skewer': {
    name: ['炉火の串焼き', 'Kilnfire skewers', 'ろびの くしやき'],
    benefit: ['主人公の攻撃＋2', '+2 hero attack damage', 'しゅじんこうの こうげき＋2'],
    biome: 'ember', cost: { meat: 2, grain: 1 }, hours: 14, effect: { damage: 2 },
  },
  'red-porridge': {
    name: ['赤穀と木の実のおかゆ', 'Red grain and date porridge', 'あかこくと きのみの おかゆ'],
    benefit: ['魅力の判定＋1、採集量＋2', '+1 Presence checks and +2 gathering yield', 'みりょく＋1、さいしゅう＋2'],
    biome: 'ember', cost: { grain: 2, seed: 1 }, hours: 18, effect: { presence: 1, gather: 2 },
  },
  'moon-cakes': {
    name: ['星見の月餅', 'Stargazer’s mooncakes', 'ほしみの げっぺい'],
    benefit: ['遺跡に入る時の灯り＋3、知恵の判定＋1', '+3 entry light and +1 Insight checks', 'いせきの あかり＋3、ちえ＋1'],
    biome: 'sky', cost: { grain: 2, seed: 1 }, hours: 20, effect: { light: 3, insight: 1 },
  },
  'sky-infusion': {
    name: ['雲上花の薬茶膳', 'Cloudflower infusion set', 'うんじょうかの やくちゃぜん'],
    benefit: ['遺跡に入る時の灯り＋2、回復量＋2', '+2 entry light and +2 recovery', 'いせきの あかり＋2、かいふく＋2'],
    biome: 'sky', cost: { herb: 2, fish: 1 }, hours: 18, effect: { light: 2, recovery: 2 },
  },
} satisfies Record<string, MealRecipe>;
export type MealId = keyof typeof MEALS;
export const MEAL_IDS = Object.keys(MEALS) as MealId[];
export const mealRecipe = (id: MealId): MealRecipe => MEALS[id];

export function mealEffect(s: Adventure, key: keyof MealEffect) {
  const meal = s.journey.meal;
  return meal && meal.until > s.time ? (mealRecipe(meal.id).effect[key] ?? 0) : 0;
}

export const FOOD_GOODS: readonly Good[] = ['herb', 'fish', 'meat', 'grain', 'ration', 'seed'];
