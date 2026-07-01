import type { Character, Enemy } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { HIGH_SCHOOL_STARTER_REPLACEMENTS } from './highSchoolCards';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from './magicHeroes';

export type VisualThemeId = 'elementary' | 'high-school' | 'magic';
export type HighSchoolHeroAction = 'idle' | 'attack' | 'skill';
export type HighSchoolEnemyAction = HighSchoolHeroAction;

const HIGH_SCHOOL_CHARACTER_NAMES = [
  '反逆の高校生',
  '生物部の先輩',
  '謎めく転入生',
  '化学研究会長',
  'バスケ部エース',
  '放送部ディレクター',
  '文芸部書記',
  '学食の料理長',
  '園芸部部長',
];

const HIGH_SCHOOL_CHARACTER_DESCRIPTIONS = [
  '【攻撃タイプ】高い体力と正面突破の攻撃で戦う、扱いやすい高校編の主人公。',
  '【捕獲タイプ】生物部で培った観察眼を活かし、倒した敵をカード化して戦う。',
  '【テクニカル】毒による継続ダメージが得意。反逆の高校生が最初からパートナーとして参戦する。',
  '【実験タイプ】3枚のカードを合成し、複数効果を持つキメラカードを作成できる。',
  '【スピード】ドローとディスカードを軸に動き、ドッジボールで先制攻撃を狙える。',
  '【デバフ・反射】敵を弱体化し、応答で攻撃を跳ね返す放送部の戦術家。',
  '【戦略・保留】手札を残す保留と物語カードで、戦局をじっくり組み立てる。',
  '【パワー】開始時に解放済みカードから初期デッキを組み、重い一撃で押し切る。',
  '【育成タイプ】菜園で種を育て、強力な植物カードへ成長させて戦う大器晩成型。',
];

export const getThemedCharacters = (characters: Character[], theme: VisualThemeId): Character[] => {
  if (theme === 'high-school') {
    return characters.map((character, index) => ({
      ...character,
      name: HIGH_SCHOOL_CHARACTER_NAMES[index] ?? character.name,
      description: HIGH_SCHOOL_CHARACTER_DESCRIPTIONS[index] ?? character.description,
      imageData: assetUrl(`sprites/high-school/characters/${index % 9}.webp`),
      deckTemplate: character.deckTemplate.map(cardId => HIGH_SCHOOL_STARTER_REPLACEMENTS[cardId] ?? cardId),
    }));
  }
  if (theme === 'magic') {
    return characters.map((character, index) => {
      const heroId = MAGIC_HERO_ID_BY_CHARACTER_ID[character.id] ?? MAGIC_HEROES[index % MAGIC_HEROES.length]?.id;
      const hero = MAGIC_HEROES.find((entry) => entry.id === heroId) ?? MAGIC_HEROES[0];
      return {
        ...character,
        name: hero?.name ?? character.name,
        description: `【${hero.attribute}の魔法】${hero.personality}。得意分野は${hero.specialty}。固有能力「${hero.ability}」を軸に戦う${hero.transformedTitle}。`,
        imageData: assetUrl(`sprites/magic/characters/heroine-${String((hero?.index ?? index + 1)).padStart(2, '0')}-before.webp`),
        magicProtagonistId: hero.id,
        magicProtagonistGender: 'female' as const,
      };
    });
  }
  return characters;
};

const HIGH_SCHOOL_CHARACTER_INDEX_BY_ID: Record<string, number> = {
  WARRIOR: 0,
  CARETAKER: 1,
  ASSASSIN: 2,
  MAGE: 3,
  DODGEBALL: 4,
  BARD: 5,
  LIBRARIAN: 6,
  CHEF: 7,
  GARDENER: 8,
};

export const getHighSchoolCharacterSpritePath = (
  characterId: string | undefined,
  action: HighSchoolHeroAction,
) => {
  const imageIndex = HIGH_SCHOOL_CHARACTER_INDEX_BY_ID[characterId ?? 'WARRIOR'] ?? 0;
  const folder = action === 'idle' ? 'characters' : `characters-${action}`;
  return assetUrl(`sprites/high-school/${folder}/${imageIndex}.webp`);
};

export const MAGIC_HERO_ID_BY_CHARACTER_ID: Record<string, string> = {
  WARRIOR: 'AKARI',
  CARETAKER: 'SHIZUKU',
  ASSASSIN: 'HIYORI',
  MAGE: 'TSUBASA',
  DODGEBALL: 'REI',
  BARD: 'MADOKA',
  LIBRARIAN: 'KOHARU',
  CHEF: 'MIRAI',
  GARDENER: 'SERA',
};

export const getMagicCharacterSpritePath = (
  characterId: string | undefined,
  action: HighSchoolHeroAction,
  transformed = false,
  magicProtagonistId?: string,
  magicProtagonistGender?: 'female' | 'male',
) => {
  if (magicProtagonistGender === 'male') {
    const protagonist = MAGIC_MALE_PROTAGONISTS.find((entry) => entry.id === magicProtagonistId)
      ?? MAGIC_MALE_PROTAGONISTS[0];
    const folder = action === 'idle' ? 'male-characters' : `male-characters-${action}`;
    const form = transformed ? 'after' : 'before';
    return assetUrl(`sprites/magic/${folder}/${protagonist.assetId}-${form}.webp`);
  }
  const imageIndex = (HIGH_SCHOOL_CHARACTER_INDEX_BY_ID[characterId ?? 'WARRIOR'] ?? 0) + 1;
  const folder = action === 'idle' ? 'characters' : `characters-${action}`;
  const form = transformed ? 'after' : 'before';
  return assetUrl(`sprites/magic/${folder}/heroine-${String(imageIndex).padStart(2, '0')}-${form}.webp`);
};

export const getThemedCharacterSpritePath = (
  theme: VisualThemeId,
  characterId: string | undefined,
  action: HighSchoolHeroAction,
  fallbackImageData: string,
  transformed = false,
  magicProtagonistId?: string,
  magicProtagonistGender?: 'female' | 'male',
) => {
  if (theme === 'high-school') return getHighSchoolCharacterSpritePath(characterId, action);
  if (theme === 'magic') return getMagicCharacterSpritePath(
    characterId,
    action,
    transformed,
    magicProtagonistId,
    magicProtagonistGender,
  );
  return fallbackImageData;
};

export const HIGH_SCHOOL_ENEMY_VARIANTS = [
  { name: '予備校の亡霊', imageIndex: 0 },
  { name: '風紀委員の騎士', imageIndex: 1 },
  { name: '模試答案の怪物', imageIndex: 2 },
  { name: '噂話の影', imageIndex: 3 },
  { name: '部活主将の残像', imageIndex: 4 },
  { name: 'スマホの幽鬼', imageIndex: 5 },
  { name: '化学室の異常体', imageIndex: 6 },
  { name: '奨学金の死神', imageIndex: 7 },
  { name: '期末試験の覇王', imageIndex: 8 },
  { name: '進路相談の小鬼', imageIndex: 9 },
  { name: '宿題運搬ロボ', imageIndex: 10 },
  { name: '保健室の鏡怪', imageIndex: 11 },
  { name: '補習時間の亡霊', imageIndex: 12 },
  { name: '赤点竜', imageIndex: 13 },
  { name: '購買機の魔物', imageIndex: 14 },
  { name: '黒板鳥', imageIndex: 15 },
  { name: '居残りの影', imageIndex: 16 },
  { name: '終業ベルの番人', imageIndex: 17 },
  { name: '答案紙の魔人', imageIndex: 18 },
  { name: 'スマホ依存の影', imageIndex: 19 },
  { name: 'ロッカーの亡霊', imageIndex: 20 },
  { name: '購買パンの怪物', imageIndex: 21 },
  { name: 'チョーク粉の雲', imageIndex: 22 },
  { name: '内申点の秤', imageIndex: 23 },
  { name: '黒板消しゴーレム', imageIndex: 24 },
  { name: '模試時計の悪霊', imageIndex: 25 },
  { name: '進路プリントの渦', imageIndex: 26 },
  { name: '赤ペンの槍兵', imageIndex: 27 },
  { name: '実験フラスコ怪', imageIndex: 28 },
  { name: '体育倉庫のマット', imageIndex: 29 },
  { name: '弁当箱ミミック', imageIndex: 30 },
  { name: '補習ベルの亡霊', imageIndex: 31 },
  { name: 'コピー機の怨念', imageIndex: 32 },
  { name: '掲示板ピンの群れ', imageIndex: 33 },
  { name: '雨傘の影武者', imageIndex: 34 },
  { name: '成績表スライム', imageIndex: 35 },
  { name: '体育館ライトの怪', imageIndex: 36 },
  { name: '化学薬品の泡', imageIndex: 37 },
  { name: '古い参考書の壁', imageIndex: 38 },
  { name: '部室のラジカセ', imageIndex: 39 },
  { name: '階段踊り場の影', imageIndex: 40 },
  { name: '卒業証書の亡霊', imageIndex: 41 },
  { name: '昼休みチャイム獣', imageIndex: 42 },
  { name: '校則ファイルの魔物', imageIndex: 43 },
  { name: 'USBメモリの怪', imageIndex: 44 },
  { name: 'ロボ掃除機の反乱', imageIndex: 45 },
  { name: '欠席届の怨霊', imageIndex: 46 },
  { name: '文化祭看板の魔物', imageIndex: 47 },
  { name: '試験監視カメラ', imageIndex: 48 },
  { name: '放課後ノイズ', imageIndex: 49 },
] as const;

export const HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS = [
  { name: '監督官の先輩', imageIndex: 0 },
  { name: '剣道部の風紀委員', imageIndex: 1 },
  { name: '白衣の査問官', imageIndex: 2 },
  { name: '禁書管理の書記', imageIndex: 3 },
  { name: '銀髪の審査員', imageIndex: 4 },
  { name: '鎖の執行部員', imageIndex: 5 },
  { name: '赤章の副会長', imageIndex: 6 },
  { name: '実験区画の主任', imageIndex: 7 },
  { name: '表彰台の王子', imageIndex: 8 },
  { name: '紅衣の監察官', imageIndex: 9 },
  { name: '冬制服の支配者', imageIndex: 10 },
  { name: '紫扇の評議員', imageIndex: 11 },
  { name: '黒翼の番長', imageIndex: 12 },
  { name: '校長', imageIndex: 13 },
  { name: '真・校長', imageIndex: 14 },
  { name: '新米風紀委員', imageIndex: 15 },
  { name: '竹刀の体育係', imageIndex: 16 },
  { name: '赤ペン監督生', imageIndex: 17 },
  { name: '図書委員の番人', imageIndex: 18 },
  { name: '購買部の用心棒', imageIndex: 19 },
  { name: '軽音部の刺客', imageIndex: 20 },
  { name: 'バスケ部の壁', imageIndex: 21 },
  { name: '化学部の実験兵', imageIndex: 22 },
  { name: '新聞部の追跡者', imageIndex: 23 },
  { name: '生徒会の斥候', imageIndex: 24 },
  { name: '剣道場の門番', imageIndex: 25 },
  { name: '応援団の番長', imageIndex: 26 },
  { name: '保健委員の執行者', imageIndex: 27 },
  { name: '美術部の幻術師', imageIndex: 28 },
  { name: '吹奏楽部の号令手', imageIndex: 29 },
  { name: '放送部の支配者', imageIndex: 30 },
  { name: '進路指導の補佐', imageIndex: 31 },
  { name: '数学研究会の刺客', imageIndex: 32 },
  { name: '白手袋の監察員', imageIndex: 33 },
  { name: '文化祭実行委員', imageIndex: 34 },
  { name: '風紀委員副隊長', imageIndex: 35 },
  { name: '剣道部の主将', imageIndex: 36 },
  { name: '赤ペン試験官', imageIndex: 37 },
  { name: '禁書庫の司書', imageIndex: 38 },
  { name: '購買部の番人', imageIndex: 39 },
  { name: '軽音部ギタリスト', imageIndex: 40 },
  { name: 'バスケ部エース', imageIndex: 41 },
  { name: '化学部の白衣兵', imageIndex: 42 },
  { name: '新聞部カメラマン', imageIndex: 43 },
  { name: '生徒会の策士', imageIndex: 44 },
  { name: '茶道部の令嬢', imageIndex: 45 },
  { name: '弓道部の射手', imageIndex: 46 },
  { name: '陸上部の疾走者', imageIndex: 47 },
  { name: '演劇部の仮面役者', imageIndex: 48 },
  { name: '電算部ハッカー', imageIndex: 49 },
  { name: '天文部の予言者', imageIndex: 50 },
  { name: '園芸委員の剪定者', imageIndex: 51 },
  { name: '試験女王', imageIndex: 52 },
] as const;

const getStableIndex = (text: string, size: number) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash % size;
};

export const getHighSchoolEnemyVariant = (enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>) => {
  const humanoid = getHighSchoolHumanoidEnemyVariant(enemy);
  if (humanoid) return humanoid;
  const direct = HIGH_SCHOOL_ENEMY_VARIANTS.find(variant => variant.name === enemy.name || `ボス: ${variant.name}` === enemy.name);
  if (direct) return direct;
  if (enemy.enemyType === 'THE_HEART') {
    return enemy.phase === 2
      ? { name: '真・校長', imageIndex: 8 }
      : { name: '校長', imageIndex: 8 };
  }
  return HIGH_SCHOOL_ENEMY_VARIANTS[getStableIndex(enemy.name, HIGH_SCHOOL_ENEMY_VARIANTS.length)];
};

export const getHighSchoolHumanoidEnemyVariant = (enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>) => {
  if (enemy.enemyType === 'THE_HEART') {
    return enemy.phase === 2
      ? HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[14]
      : HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[13];
  }
  const direct = HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS.find(variant => variant.name === enemy.name || `ボス: ${variant.name}` === enemy.name);
  if (direct) return direct;
  if (enemy.enemyType === 'GUARDIAN') {
    return HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[20 + getStableIndex(enemy.name, 33)];
  }
  if (enemy.enemyType === 'ELITE_FORCE') {
    return HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[5 + getStableIndex(enemy.name, 48)];
  }
  if (enemy.enemyType === 'TEACHER') {
    return HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[getStableIndex(enemy.name, 25)];
  }
  if (enemy.enemyType === 'GENERIC' && getStableIndex(enemy.name, 3) === 0) {
    return HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[15 + getStableIndex(enemy.name, 38)];
  }
  return null;
};

export const getHighSchoolHumanoidEnemySpritePath = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  action: HighSchoolEnemyAction,
) => {
  const variant = getHighSchoolHumanoidEnemyVariant(enemy);
  if (!variant) return null;
  const folder = action === 'idle' ? 'humanoid-enemies' : `humanoid-enemies-${action}`;
  return assetUrl(`sprites/high-school/${folder}/${variant.imageIndex}.webp`);
};

export const MAGIC_ENEMY_VARIANTS = [
  { name: '星屑の使い魔', imageIndex: 0 },
  { name: '月影スライム', imageIndex: 1 },
  { name: '花迷宮の芽獣', imageIndex: 2 },
  { name: '火花コウモリ', imageIndex: 3 },
  { name: '影縫いの欠片', imageIndex: 4 },
  { name: '時計塔の歯車霊', imageIndex: 5 },
  { name: '風読みの小竜', imageIndex: 6 },
  { name: '夢喰いの泡', imageIndex: 7 },
  { name: '光膜のクラゲ', imageIndex: 8 },
  { name: '魔導書の幼体', imageIndex: 9 },
  { name: '結晶ネズミ', imageIndex: 10 },
  { name: '黒板魔法陣', imageIndex: 11 },
  { name: '星砂ミミック', imageIndex: 12 },
  { name: '月輪ガーゴイル', imageIndex: 13 },
  { name: '蔓薔薇の怪', imageIndex: 14 },
  { name: '炎冠の小鬼', imageIndex: 15 },
  { name: '闇インクの影', imageIndex: 16 },
  { name: '時砂の亡霊', imageIndex: 17 },
  { name: '旋風ケットシー', imageIndex: 18 },
  { name: '悪夢の仮面', imageIndex: 19 },
  { name: '聖灯の羽虫', imageIndex: 20 },
  { name: '魔石ゴーレム', imageIndex: 21 },
  { name: '封印リボン', imageIndex: 22 },
  { name: '彗星の尾獣', imageIndex: 23 },
  { name: '月読の鏡片', imageIndex: 24 },
  { name: '花粉の幻霧', imageIndex: 25 },
  { name: '火球の精', imageIndex: 26 },
  { name: '影絵の騎獣', imageIndex: 27 },
  { name: '遅刻ベルの霊', imageIndex: 28 },
  { name: '風鈴の魔物', imageIndex: 29 },
  { name: '夢色キャンディ怪', imageIndex: 30 },
  { name: '光輪の番犬', imageIndex: 31 },
  { name: '星図の蛇', imageIndex: 32 },
  { name: '月蝕ランタン', imageIndex: 33 },
  { name: '花冠の毒蜂', imageIndex: 34 },
  { name: '炎筆の魔獣', imageIndex: 35 },
  { name: '闇劇場の人形', imageIndex: 36 },
  { name: '時針の蜘蛛', imageIndex: 37 },
  { name: '風札の狐面', imageIndex: 38 },
  { name: '夢頁の蝶', imageIndex: 39 },
  { name: '光晶の盾獣', imageIndex: 40 },
  { name: '魔力試験の残滓', imageIndex: 41 },
  { name: '星鍵の守り手', imageIndex: 42 },
  { name: '月光庭園の影花', imageIndex: 43 },
  { name: '深淵図書館の栞獣', imageIndex: 44 },
] as const;

export const MAGIC_HUMANOID_ENEMY_VARIANTS = [
  { name: '見習い魔女の反逆者', imageIndex: 0 },
  { name: '仮面の魔法剣士', imageIndex: 1 },
  { name: 'ルーン図書委員', imageIndex: 2 },
  { name: '水晶錬金術師', imageIndex: 3 },
  { name: '影舞台の奇術師', imageIndex: 4 },
  { name: '月社の祓い手', imageIndex: 5 },
  { name: '茨庭の魔導士', imageIndex: 6 },
  { name: '鐘鎧の召喚士', imageIndex: 7 },
  { name: '呪い人形の操者', imageIndex: 8 },
  { name: '炎厨房の魔法使い', imageIndex: 9 },
  { name: '重盾の魔法騎士', imageIndex: 10 },
  { name: '紙嵐の忍術士', imageIndex: 11 },
  { name: '鏡界の幻術師', imageIndex: 12 },
  { name: '雷指揮のコンダクター', imageIndex: 13 },
  { name: '氷鏡の槍術士', imageIndex: 14 },
  { name: '獣面の地脈術師', imageIndex: 15 },
  { name: '時計塔の時術師', imageIndex: 16 },
  { name: '蝋燭の死霊学徒', imageIndex: 17 },
  { name: '星見台の弓術士', imageIndex: 18 },
  { name: '禁術学園の風紀長', imageIndex: 19 },
  { name: '大魔女校長', imageIndex: 20 },
  { name: '星災の女王', imageIndex: 21 },
] as const;

export const getMagicHumanoidEnemyVariant = (enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>) => {
  if (enemy.enemyType === 'THE_HEART') {
    return enemy.phase === 2
      ? MAGIC_HUMANOID_ENEMY_VARIANTS[21]
      : MAGIC_HUMANOID_ENEMY_VARIANTS[20];
  }
  const direct = MAGIC_HUMANOID_ENEMY_VARIANTS.find(variant => variant.name === enemy.name || `ボス: ${variant.name}` === enemy.name);
  if (direct) return direct;
  if (enemy.enemyType === 'GUARDIAN') return MAGIC_HUMANOID_ENEMY_VARIANTS[getStableIndex(enemy.name, 20)];
  if (enemy.enemyType === 'ELITE_FORCE') return MAGIC_HUMANOID_ENEMY_VARIANTS[getStableIndex(enemy.name, 20)];
  if (enemy.enemyType === 'TEACHER') return MAGIC_HUMANOID_ENEMY_VARIANTS[getStableIndex(enemy.name, 20)];
  if (enemy.enemyType === 'GENERIC' && getStableIndex(enemy.name, 4) === 0) {
    return MAGIC_HUMANOID_ENEMY_VARIANTS[getStableIndex(enemy.name, 20)];
  }
  return null;
};

export const getMagicEnemyVariant = (enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>) => {
  const humanoid = getMagicHumanoidEnemyVariant(enemy);
  if (humanoid) return humanoid;
  const direct = MAGIC_ENEMY_VARIANTS.find(variant => variant.name === enemy.name || `ボス: ${variant.name}` === enemy.name);
  if (direct) return direct;
  return MAGIC_ENEMY_VARIANTS[getStableIndex(enemy.name, MAGIC_ENEMY_VARIANTS.length)];
};

export const getMagicHumanoidEnemySpritePath = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  action: HighSchoolEnemyAction,
) => {
  const variant = getMagicHumanoidEnemyVariant(enemy);
  if (!variant) return null;
  const folder = action === 'idle' ? 'humanoid-enemies' : `humanoid-enemies-${action}`;
  return assetUrl(`sprites/magic/${folder}/${variant.imageIndex}.webp`);
};

export const getThemedEnemyVariant = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  theme: VisualThemeId,
) => {
  if (theme === 'high-school') return getHighSchoolEnemyVariant(enemy);
  if (theme === 'magic') return getMagicEnemyVariant(enemy);
  return null;
};

export const getThemedHumanoidEnemyVariant = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  theme: VisualThemeId,
) => {
  if (theme === 'high-school') return getHighSchoolHumanoidEnemyVariant(enemy);
  if (theme === 'magic') return getMagicHumanoidEnemyVariant(enemy);
  return null;
};

export const getThemedHumanoidEnemySpritePath = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  theme: VisualThemeId,
  action: HighSchoolEnemyAction,
) => {
  if (theme === 'high-school') return getHighSchoolHumanoidEnemySpritePath(enemy, action);
  if (theme === 'magic') return getMagicHumanoidEnemySpritePath(enemy, action);
  return null;
};

export const getThemedMonsterEnemySpritePath = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  theme: VisualThemeId,
) => {
  if (theme === 'high-school') return assetUrl(`sprites/high-school/enemies/${getHighSchoolEnemyVariant(enemy).imageIndex}.webp`);
  if (theme === 'magic') return assetUrl(`sprites/magic/enemies/${getMagicEnemyVariant(enemy).imageIndex}.webp`);
  return null;
};

export const getThemedEnemyDisplayName = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  theme: VisualThemeId,
) => {
  if (theme === 'high-school') return getHighSchoolEnemyVariant(enemy).name;
  if (theme === 'magic') return getMagicEnemyVariant(enemy).name;
  return enemy.name;
};

export interface HighSchoolEventTheme {
  title: string;
  description: string;
  imageIndex: number;
}

export type ThemedEventTheme = HighSchoolEventTheme;

export const HIGH_SCHOOL_EVENT_THEMES: HighSchoolEventTheme[] = [
  {
    title: '深夜の自習室',
    description: '誰もいない自習室に、まだ消えていないスタンドライトが一つだけ残っている。',
    imageIndex: 0,
  },
  {
    title: '屋上の夕焼け',
    description: '夕焼けの屋上に風だけが通る。少し立ち止まるにはちょうどいい。',
    imageIndex: 1,
  },
  {
    title: '模試の返却',
    description: '赤い丸が並ぶ答案が返ってきた。次の一手を考える時間だ。',
    imageIndex: 2,
  },
  {
    title: '文化祭の準備',
    description: '教室は装飾と段ボールでいっぱいだ。手伝えば何か得るものがありそうだ。',
    imageIndex: 3,
  },
  {
    title: '掲示板の廊下',
    description: '放課後の廊下に、色とりどりの部活ポスターが並んでいる。',
    imageIndex: 4,
  },
  {
    title: '化学室の事故',
    description: 'フラスコから光が噴き上がった。危険だが、珍しい成果も期待できる。',
    imageIndex: 5,
  },
  {
    title: 'コンビニ休憩',
    description: '帰り道のコンビニで少しだけ息をつく。補給するか、先を急ぐか。',
    imageIndex: 6,
  },
  {
    title: '生徒会室の資料',
    description: '生徒会室の机に、未整理の資料が高く積まれている。',
    imageIndex: 7,
  },
  {
    title: '雨の校門',
    description: '雨に煙る校門で、帰るべきか、もう少しだけ残るべきか迷う。',
    imageIndex: 8,
  },
  {
    title: '放課後の教室',
    description: '人気のない教室に、夕方の光だけが静かに残っている。',
    imageIndex: 9,
  },
  {
    title: '音楽室の夕暮れ',
    description: '人気のない音楽室で、譜面台だけが夕日を受けている。',
    imageIndex: 10,
  },
  {
    title: '体育館の忘れ物',
    description: '静かな体育館に、水筒とタオルだけが残されている。',
    imageIndex: 11,
  },
  {
    title: '図書室の灯り',
    description: '閉館後の図書室に、読みかけの本と灯りが一つ残っている。',
    imageIndex: 12,
  },
  {
    title: '雨上がりの駐輪場',
    description: '濡れた自転車が並ぶ駐輪場に、雨上がりの光が差している。',
    imageIndex: 13,
  },
  {
    title: '保健室の午後',
    description: '白いベッドとカーテンの向こうで、時間だけがゆっくり進んでいる。',
    imageIndex: 14,
  },
  {
    title: '美術室のキャンバス',
    description: '描きかけのキャンバスが、誰かの途中の決意を映している。',
    imageIndex: 15,
  },
  {
    title: '靴箱の夕風',
    description: '開け放たれた昇降口を、放課後の風が静かに抜けていく。',
    imageIndex: 16,
  },
  {
    title: '駅のベンチ',
    description: '終電前のホームに、人の気配だけが薄く残っている。',
    imageIndex: 17,
  },
  { title: '入学式の桜道', description: '桜が舞う校門に、新しい制服のざわめきが満ちている。', imageIndex: 18 },
  { title: '勧誘の中庭', description: '先輩たちの声が飛び交い、部活のチラシが春風に揺れる。', imageIndex: 19 },
  { title: '席替えのくじ', description: '教室の真ん中で、次の景色を決める小さなくじが回っている。', imageIndex: 20 },
  { title: '屋上の昼休み', description: '弁当を広げた友人たちの笑い声が、青空へ抜けていく。', imageIndex: 21 },
  { title: '相合い傘の校門', description: '雨粒の向こうで、一本の傘を分け合う二人が立ち止まる。', imageIndex: 22 },
  { title: '廊下の返却ノート', description: '教師が差し出したノートに、赤字の助言が丁寧に並んでいる。', imageIndex: 23 },
  { title: '生徒会オリエンテーション', description: '長机を囲む声の中に、学校を動かす空気が少しだけ見える。', imageIndex: 24 },
  { title: '桜掃きの放課後', description: '花びらを掃く手元に、春の終わりが静かに積もっていく。', imageIndex: 25 },
  { title: '靴箱の手紙', description: '開いた靴箱の奥に、差出人のない封筒が一通だけ残されている。', imageIndex: 26 },
  { title: '体育祭のリレー', description: '乾いた土を蹴る足音と声援が、真夏の校庭を震わせる。', imageIndex: 27 },
  { title: 'かき氷の準備室', description: '部室では氷とシロップが並び、祭り前の熱気が立ちのぼる。', imageIndex: 28 },
  { title: '試験前の勉強会', description: '図書室の机に参考書が積まれ、眠気より焦りが勝っている。', imageIndex: 29 },
  { title: '蝉時雨の窓辺', description: '窓の外の蝉と扇風機だけが、午後の時間を進めている。', imageIndex: 30 },
  { title: '水泳部の休憩', description: 'プールサイドに水滴が光り、練習後の息が少しずつ整う。', imageIndex: 31 },
  { title: '屋上の花火', description: '夜空に開く光を、言葉少なに見上げる影が並ぶ。', imageIndex: 32 },
  { title: '吹奏楽の合奏', description: '音楽室に重なる音が、まだ未完成の曲を少しずつ形にする。', imageIndex: 33 },
  { title: '夏のコンビニ前', description: '湿った夕方、買ったばかりの飲み物が手のひらを冷やす。', imageIndex: 34 },
  { title: '夕立の駐輪場', description: '屋根を打つ雨音の下で、帰れない生徒たちが空を見上げる。', imageIndex: 35 },
  { title: '文化祭の怪物づくり', description: '段ボールと絵の具の匂いの中、教室が別の世界へ変わっていく。', imageIndex: 36 },
  { title: '落葉の写生会', description: '赤い葉を追う鉛筆の線が、静かな秋を紙に留めていく。', imageIndex: 37 },
  { title: '進路相談室', description: '教師の問いかけの前で、未来が少しだけ具体的な形を持つ。', imageIndex: 38 },
  { title: '修学旅行のホーム', description: '大きな鞄と期待を抱えた列が、発車ベルを待っている。', imageIndex: 39 },
  { title: '夕焼けの野球部', description: '長い影の中で、最後の一球まで声が途切れない。', imageIndex: 40 },
  { title: '家庭科室の焼き菓子', description: '甘い香りが広がり、失敗も笑いに変わる午後になる。', imageIndex: 41 },
  { title: '新聞部の取材', description: '廊下の片隅で、質問の一つひとつが相手の輪郭を映していく。', imageIndex: 42 },
  { title: '紅葉の裏道', description: '体育館裏の道を、友人との会話がゆっくり進んでいく。', imageIndex: 43 },
  { title: '掲示板の結果発表', description: '張り出された紙の前に、人の波とため息が重なっている。', imageIndex: 44 },
  { title: '雪の朝の校門', description: '白く染まった通学路で、足音だけがいつもより柔らかい。', imageIndex: 45 },
  { title: 'ストーブ前の教室', description: '登校直後の教室に、人が少しずつ温まりに集まってくる。', imageIndex: 46 },
  { title: '冬のチャリティー', description: '飾り付けられた廊下で、手渡す品物に小さな善意が混じる。', imageIndex: 47 },
  { title: '初詣の寄り道', description: '冬休み明けの仲間たちが、境内でそれぞれの願いを結ぶ。', imageIndex: 48 },
  { title: '模試面談', description: '机の上の数字を前に、焦りと覚悟が同じ椅子に座っている。', imageIndex: 49 },
  { title: '靴箱のバレンタイン', description: '夕方の昇降口で、小さな箱が思い切りの証になる。', imageIndex: 50 },
  { title: '卒業式の花道', description: '花束と拍手の間を、三年間の時間が静かに通り過ぎていく。', imageIndex: 51 },
  { title: '卒業後の教室', description: '誰もいない教室に、夕日だけが最後まで残っている。', imageIndex: 52 },
  { title: '深夜のファミレス', description: '参考書とドリンクバーの明かりの中で、友人たちがまだ粘っている。', imageIndex: 53 },
];

const HIGH_SCHOOL_NEUTRAL_EVENT_INDICES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 53,
];
const HIGH_SCHOOL_SPRING_EVENT_INDICES = [18, 19, 20, 21, 22, 23, 24, 25, 26];
const HIGH_SCHOOL_SUMMER_EVENT_INDICES = [27, 28, 29, 30, 31, 32, 33, 34, 35];
const HIGH_SCHOOL_AUTUMN_EVENT_INDICES = [36, 37, 38, 39, 40, 41, 42, 43, 44];
const HIGH_SCHOOL_WINTER_EVENT_INDICES = [45, 46, 47, 48, 49, 50];
const HIGH_SCHOOL_FINALE_EVENT_INDICES = [51, 52];

const themesFromIndices = (indices: number[]) =>
  indices.map(index => HIGH_SCHOOL_EVENT_THEMES[index]).filter(Boolean);

const getSeasonalHighSchoolEventPool = (act = 1, floor = 1): HighSchoolEventTheme[] => {
  const safeAct = Math.max(1, act);
  const safeFloor = Math.max(1, floor);
  const neutral = themesFromIndices(HIGH_SCHOOL_NEUTRAL_EVENT_INDICES);

  if (safeAct <= 1) {
    if (safeFloor <= 6) {
      return [...themesFromIndices(HIGH_SCHOOL_SPRING_EVENT_INDICES), ...neutral];
    }
    if (safeFloor <= 10) {
      return [
        ...themesFromIndices(HIGH_SCHOOL_SPRING_EVENT_INDICES),
        ...themesFromIndices(HIGH_SCHOOL_SUMMER_EVENT_INDICES),
        ...neutral,
      ];
    }
    return [...themesFromIndices(HIGH_SCHOOL_SUMMER_EVENT_INDICES), ...neutral];
  }

  if (safeAct === 2) {
    if (safeFloor <= 7) {
      return [...themesFromIndices(HIGH_SCHOOL_SUMMER_EVENT_INDICES), ...neutral];
    }
    return [...themesFromIndices(HIGH_SCHOOL_AUTUMN_EVENT_INDICES), ...neutral];
  }

  if (safeAct === 3) {
    if (safeFloor <= 5) {
      return [
        ...themesFromIndices(HIGH_SCHOOL_AUTUMN_EVENT_INDICES),
        ...themesFromIndices(HIGH_SCHOOL_WINTER_EVENT_INDICES),
        ...neutral,
      ];
    }
    if (safeFloor <= 10) {
      return [...themesFromIndices(HIGH_SCHOOL_WINTER_EVENT_INDICES), ...neutral];
    }
    return [
      ...themesFromIndices(HIGH_SCHOOL_FINALE_EVENT_INDICES),
      ...themesFromIndices(HIGH_SCHOOL_WINTER_EVENT_INDICES),
      ...neutral,
    ];
  }

  return HIGH_SCHOOL_EVENT_THEMES;
};

export const getHighSchoolEventTheme = (title: string, act = 1, floor = 1): HighSchoolEventTheme => {
  const pool = getSeasonalHighSchoolEventPool(act, floor);
  return pool[getStableIndex(title, pool.length)];
};

export const getHighSchoolEventThemeByTitle = (title: string): HighSchoolEventTheme | undefined =>
  HIGH_SCHOOL_EVENT_THEMES.find(theme => theme.title === title);

export const MAGIC_EVENT_THEMES: ThemedEventTheme[] = [
  { title: '星図教室の放課後', description: '黒板に浮かぶ星図が、今日の選択を静かに照らしている。', imageIndex: 0 },
  { title: '月光の中庭', description: '月の光を浴びた噴水の前で、誰かがひとり考え込んでいる。', imageIndex: 1 },
  { title: '花の迷宮演習', description: '訓練場に咲いた魔法の花が、正しい道と危険な道を隠している。', imageIndex: 2 },
  { title: '炎の魔法実技', description: '実技室の結界内で、炎の軌跡が勇気と焦りを映し出す。', imageIndex: 3 },
  { title: '深淵図書館の栞', description: '禁書棚の奥で、見覚えのない栞が小さく光っている。', imageIndex: 4 },
  { title: '時計塔の補習', description: '止まった時計の針が、やり直したい一問を指している。', imageIndex: 5 },
  { title: '風渡りの屋上', description: '屋上を抜ける風に、言えなかった言葉が少しだけ軽くなる。', imageIndex: 6 },
  { title: '夢見の保健室', description: '白いカーテンの向こうで、誰かの悪夢が淡い光になって揺れる。', imageIndex: 7 },
  { title: '光の礼拝堂', description: 'ステンドグラスの下で、使命と願いのどちらを選ぶか問われる。', imageIndex: 8 },
  { title: '魔法陣の廊下', description: '廊下の床に現れた魔法陣が、次の出会いへ導いている。', imageIndex: 9 },
  { title: 'SNSに届いた予兆', description: '端末に届いた短いメッセージが、学園の裏側の異変を告げる。', imageIndex: 10 },
  { title: '購買部の魔法雑貨', description: '棚に並ぶ不思議な小物の中に、今日だけ役立つ品が混じっている。', imageIndex: 11 },
  { title: '寮の作戦会議', description: '夜の共有スペースで、仲間たちが明日の作戦を小声で話し合う。', imageIndex: 12 },
  { title: '水族館の約束', description: '休日の水槽前で、戦いから離れた一瞬の本音がこぼれる。', imageIndex: 13 },
  { title: '夏祭りの結界', description: '屋台の明かりに紛れて、薄い結界のほころびが見えている。', imageIndex: 14 },
  { title: '文化祭の秘密舞台', description: '舞台袖の暗がりで、誰かの魔法と恋心が同時に揺れている。', imageIndex: 15 },
  { title: 'クリスマス街の魔光', description: 'イルミネーションの中に、異世界からの淡い信号が混じっている。', imageIndex: 16 },
  { title: 'バレンタインの魔法包み', description: '小さな包みに込めた気持ちが、魔力より強く胸を鳴らす。', imageIndex: 17 },
  { title: '卒業式前夜の星空', description: '最後の夜、九人の願いが星空の下でひとつの答えに近づく。', imageIndex: 18 },
  { title: '真夜中の変身訓練', description: '誰もいない訓練場で、変身後の自分と向き合う時間が始まる。', imageIndex: 19 },
];

const getMagicEventPool = (act = 1): ThemedEventTheme[] => {
  const safeAct = Math.max(1, act);
  if (safeAct <= 1) return MAGIC_EVENT_THEMES.slice(0, 12);
  if (safeAct === 2) return MAGIC_EVENT_THEMES.slice(4, 18);
  if (safeAct === 3) return MAGIC_EVENT_THEMES.slice(8, 20);
  return MAGIC_EVENT_THEMES;
};

export const getMagicEventTheme = (title: string, act = 1, floor = 1): ThemedEventTheme => {
  const pool = getMagicEventPool(act);
  return pool[getStableIndex(`${title}:${floor}`, pool.length)];
};

export const getMagicEventThemeByTitle = (title: string): ThemedEventTheme | undefined =>
  MAGIC_EVENT_THEMES.find(theme => theme.title === title);

export const getVisualThemeEventTheme = (
  theme: VisualThemeId,
  title: string,
  act = 1,
  floor = 1,
): ThemedEventTheme | null => {
  if (theme === 'high-school') return getHighSchoolEventTheme(title, act, floor);
  if (theme === 'magic') return getMagicEventTheme(title, act, floor);
  return null;
};

export const getVisualThemeEventThemeByTitle = (
  theme: VisualThemeId,
  title: string,
): ThemedEventTheme | undefined => {
  if (theme === 'high-school') return getHighSchoolEventThemeByTitle(title);
  if (theme === 'magic') return getMagicEventThemeByTitle(title);
  return undefined;
};
