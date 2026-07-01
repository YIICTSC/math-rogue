import { ENEMY_LIBRARY, TRUE_BOSS } from '../constants';
import {
  HIGH_SCHOOL_ENEMY_VARIANTS,
  HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS,
  MAGIC_ENEMY_VARIANTS,
  MAGIC_HUMANOID_ENEMY_VARIANTS,
  type VisualThemeId,
} from './visualThemes';

export interface EnemyCatalogEntry {
  name: string;
  description: string;
  tier: 1 | 2 | 3;
}

export type EnemyCatalog = Record<string, EnemyCatalogEntry>;

const createCatalog = (
  entries: readonly { name: string }[],
  descriptionPrefix: string,
  getTier: (name: string, index: number) => 1 | 2 | 3,
): EnemyCatalog => Object.fromEntries(entries.map((entry, index) => {
  const tier = getTier(entry.name, index);
  return [
    entry.name,
    {
      name: entry.name,
      description: `${descriptionPrefix} ${entry.name}。`,
      tier,
    },
  ];
}));

const matchesAny = (name: string, words: readonly string[]) => (
  words.some(word => name.includes(word))
);

const HIGH_SCHOOL_ACT1_WORDS = [
  '小鬼', 'ロボ', '黒板鳥', 'チョーク粉', '弁当箱', '掲示板', '雨傘',
  '化学薬品', 'ラジカセ', '昼休み', 'USB', '掃除機', '欠席届', '文化祭看板',
  '新米', '竹刀', '用心棒', '斥候', '号令手', 'ギタリスト', 'カメラマン',
  '射手', '疾走者', 'ハッカー', '予言者',
] as const;

const HIGH_SCHOOL_ACT3_WORDS = [
  '期末', '模試', '答案', '赤点', '成績', '卒業証書', '内申', '校則', '試験', '監視', '放課後ノイズ', '覇王',
  '校長', '真・校長', '監督官', '査問官', '審査員', '執行部員', '副会長',
  '主任', '王子', '監察官', '支配者', '評議員', '番長', '副隊長',
  '主将', '司書', '禁書', '数学研究会', 'エース', '策士', '令嬢', '試験女王',
] as const;

const getHighSchoolTier = (name: string): 1 | 2 | 3 => {
  if (matchesAny(name, HIGH_SCHOOL_ACT3_WORDS)) return 3;
  if (matchesAny(name, HIGH_SCHOOL_ACT1_WORDS)) return 1;
  return 2;
};

const MAGIC_ACT1_WORDS = [
  '星屑', '月影スライム', '芽獣', '火花', '欠片', '歯車霊', '小竜',
  '夢喰い', '光膜', '幼体', '結晶', '黒板魔法陣', '星砂', '見習い',
  'ルーン図書委員', '水晶', '聖灯', '火球', '風鈴', '夢色',
] as const;

const MAGIC_ACT3_WORDS = [
  '魔力試験', '星鍵', '月光庭園', '深淵', '闇劇場', '時針', '光晶',
  '月蝕', '炎筆', '影絵', '禁術', '大魔女', '星災', '女王',
  '時計塔の時術師', '星見台', '蝋燭', '氷鏡', '雷指揮',
] as const;

const getMagicTier = (name: string): 1 | 2 | 3 => {
  if (matchesAny(name, MAGIC_ACT3_WORDS)) return 3;
  if (matchesAny(name, MAGIC_ACT1_WORDS)) return 1;
  return 2;
};

export const HIGH_SCHOOL_ENEMY_LIBRARY: EnemyCatalog = createCatalog(
  [...HIGH_SCHOOL_ENEMY_VARIANTS, ...HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS],
  '高校編に出現する敵',
  getHighSchoolTier,
);

export const MAGIC_ENEMY_LIBRARY: EnemyCatalog = createCatalog(
  [...MAGIC_ENEMY_VARIANTS, ...MAGIC_HUMANOID_ENEMY_VARIANTS],
  'マジック編に出現する敵',
  getMagicTier,
);

export const ENEMY_LIBRARY_BY_THEME: Record<VisualThemeId, EnemyCatalog> = {
  elementary: ENEMY_LIBRARY,
  'high-school': HIGH_SCHOOL_ENEMY_LIBRARY,
  magic: MAGIC_ENEMY_LIBRARY,
};

export const TRUE_BOSS_BY_THEME = {
  elementary: TRUE_BOSS,
  'high-school': {
    ...TRUE_BOSS,
    name: '校長',
  },
  magic: {
    ...TRUE_BOSS,
    name: '大魔女校長',
  },
} satisfies Record<VisualThemeId, typeof TRUE_BOSS>;

export const getEnemyLibraryByTheme = (theme: VisualThemeId = 'elementary'): EnemyCatalog => (
  ENEMY_LIBRARY_BY_THEME[theme] ?? ENEMY_LIBRARY
);

export const getTrueBossByTheme = (theme: VisualThemeId = 'elementary') => (
  TRUE_BOSS_BY_THEME[theme] ?? TRUE_BOSS
);

export const getEnemyNamesByAct = (
  theme: VisualThemeId,
  act: number,
): string[] => {
  if (theme === 'elementary') {
    return Object.values(ENEMY_LIBRARY)
      .filter(enemy => enemy.tier === Math.max(1, Math.min(3, act)))
      .map(enemy => enemy.name);
  }

  const library = getEnemyLibraryByTheme(theme);
  const tier = Math.max(1, Math.min(3, act)) as 1 | 2 | 3;
  return Object.values(library)
    .filter(enemy => enemy.tier === tier)
    .map(enemy => enemy.name);
};

export const getAllEnemyNamesByTheme = (theme: VisualThemeId = 'elementary'): string[] => (
  Object.values(getEnemyLibraryByTheme(theme)).map(enemy => enemy.name)
);
