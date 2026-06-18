import { CardType, TargetType, type Card } from '../types';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from './magicHeroes';

export interface MagicCard extends Card {
  magicHeroId: string;
  transformedOnly: boolean;
  magicCardArtIndex: number;
}

interface MagicCardSpec {
  name: string;
  cost: number;
  type: CardType;
  target: TargetType;
  description: string;
  damage?: number;
  block?: number;
  draw?: number;
  energy?: number;
  heal?: number;
  selfDamage?: number;
  weak?: number;
  vulnerable?: number;
  poison?: number;
  strength?: number;
  playCopies?: number;
  applyPower?: { id: string; amount: number };
  exhaust?: boolean;
}

const MAGIC_CARD_SPECS_BY_HERO: Record<string, MagicCardSpec[]> = {
  AKARI: [
    { name: 'スターリィ・ブレイザー', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '18ダメージ。', damage: 18 },
    { name: 'コメット・ハグシールド', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック14。カードを1枚引く。', block: 14, draw: 1 },
    { name: 'ミラクル・スターリンク', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'ブロック6。カード使用時、ブロック1を得る。廃棄。', block: 6, applyPower: { id: 'AFTER_IMAGE', amount: 1 }, exhaust: true },
  ],
  SHIZUKU: [
    { name: 'ルナミラー・スラッシュ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '14ダメージ。対象をびくびく2にする。', damage: 14, vulnerable: 2 },
    { name: 'ムーンリボン・ガード', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック16。', block: 16 },
    { name: 'ルミナス・リフレクト', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: 'ブロック8。ターン終了時、ブロック5を得る。廃棄。', block: 8, applyPower: { id: 'METALLICIZE', amount: 5 }, exhaust: true },
  ],
  HIYORI: [
    { name: 'ブルーム・ペタルショット', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に10ダメージ。', damage: 10 },
    { name: 'フローラル・メディカ', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'HPを8回復。カードを1枚引く。', heal: 8, draw: 1 },
    { name: 'ハートフル・ブルーム', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: 'カードを1枚引く。ターン開始時、カードを1枚追加で引く。廃棄。', draw: 1, applyPower: { id: 'DRAW_POWER', amount: 1 }, exhaust: true },
  ],
  TSUBASA: [
    { name: 'ブレイズ・ハンマースター', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '22ダメージ。自分に2ダメージ。', damage: 22, selfDamage: 2 },
    { name: 'フレア・アクセル', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'エナジー1を得る。カードを1枚引く。', energy: 1, draw: 1 },
    { name: 'バーニング・ハートギア', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '毎ターンエナジー1を得る。廃棄。', applyPower: { id: 'BERSERK_POWER', amount: 1 }, exhaust: true },
  ],
  REI: [
    { name: 'ノワール・ルーンエッジ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '15ダメージ。対象にドクドク5。', damage: 15, poison: 5 },
    { name: 'シャドウ・チャームバインド', cost: 1, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体をへろへろ2にする。ブロック8。', weak: 2, block: 8 },
    { name: 'クリムゾン・ナイトシール', cost: 1, type: CardType.POWER, target: TargetType.ALL_ENEMIES, description: '敵全体にドクドク4。攻撃時、ドクドク1を付与する。廃棄。', poison: 4, applyPower: { id: 'ENVENOM', amount: 1 }, exhaust: true },
  ],
  MADOKA: [
    { name: 'クロック・スパークループ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。カードを2枚引く。', damage: 12, draw: 2 },
    { name: 'タイム・キャンディリロード', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。エナジー1を得る。', block: 10, energy: 1 },
    { name: 'トワイライト・クロノコード', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン最初のカードを2回発動する。廃棄。', applyPower: { id: 'ECHO_FORM', amount: 1 }, exhaust: true },
  ],
  KOHARU: [
    { name: 'ゲイル・リーフアロー', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージを3回与える。', damage: 8, playCopies: 2 },
    { name: 'シルフィ・スキップガード', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック12。カードを2枚引く。', block: 12, draw: 2 },
    { name: 'エメラルド・ウィンドベル', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カードを2枚引く。状態異常カードを引いた時、カードを1枚引く。廃棄。', draw: 2, applyPower: { id: 'EVOLVE', amount: 1 }, exhaust: true },
  ],
  MIRAI: [
    { name: 'ドリーミィ・ステージビート', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に9ダメージ。へろへろ1。', damage: 9, weak: 1 },
    { name: 'プチナイトメア・アンコール', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'カードを3枚引き、エナジー1を得る。', draw: 3, energy: 1 },
    { name: 'ファンシー・ドリームショー', cost: 1, type: CardType.POWER, target: TargetType.ALL_ENEMIES, description: '敵全体に6ダメージ。カード使用時、敵全体に1ダメージ。廃棄。', damage: 6, applyPower: { id: 'THOUSAND_CUTS', amount: 1 }, exhaust: true },
  ],
  SERA: [
    { name: 'セレスティア・ライトノヴァ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '20ダメージ。', damage: 20 },
    { name: 'ホーリー・シュガーコード', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。HPを6回復。', block: 10, heal: 6 },
    { name: 'エンジェル・スターブート', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カードを2枚引く。生成カードを強化する。廃棄。', draw: 2, applyPower: { id: 'MASTER_REALITY', amount: 1 }, exhaust: true },
  ],
  REN: [
    { name: 'ゲイル・セイバー', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '16ダメージ。カードを1枚引く。', damage: 16, draw: 1 },
    { name: 'テンペスト・イージス', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック15。カードを1枚引く。', block: 15, draw: 1 },
    { name: '蒼龍天翔破', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'ブロック6。カード使用時、ブロック1を得る。廃棄。', block: 6, applyPower: { id: 'AFTER_IMAGE', amount: 1 }, exhaust: true },
  ],
  SOMA: [
    { name: 'グレイシャル・ヴァーディクト', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '15ダメージ。びくびく2。', damage: 15, vulnerable: 2 },
    { name: 'アブソリュート・プロトコル', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック18。', block: 18 },
    { name: '氷律絶界', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: 'ブロック8。ターン終了時、ブロック6を得る。廃棄。', block: 8, applyPower: { id: 'METALLICIZE', amount: 6 }, exhaust: true },
  ],
  MINATO: [
    { name: 'アクア・リッパー', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '13ダメージ。HPを3回復。', damage: 13, heal: 3 },
    { name: 'セラフィック・スプリング', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'HPを9回復。カードを1枚引く。', heal: 9, draw: 1 },
    { name: '蒼海神リヴァイア・グレイス', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: 'カードを1枚引く。ターン開始時、カードを1枚追加で引く。廃棄。', draw: 1, applyPower: { id: 'DRAW_POWER', amount: 1 }, exhaust: true },
  ],
  RIKU: [
    { name: 'クロノ・アーク', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。カードを2枚引く。', damage: 12, draw: 2 },
    { name: 'リワインド・ウォード', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック11。エナジー1を得る。', block: 11, energy: 1 },
    { name: '運命選択・フォーチュンセレクター', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン最初のカードを2回発動する。廃棄。', applyPower: { id: 'ECHO_FORM', amount: 1 }, exhaust: true },
  ],
  YAMATO: [
    { name: 'クリムゾン・ナックル', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '23ダメージ。自分に2ダメージ。', damage: 23, selfDamage: 2 },
    { name: 'ブレイズ・ブルワーク', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック13。ムキムキ1。', block: 13, strength: 1 },
    { name: '獄炎獅子王撃', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '毎ターンエナジー1を得る。廃棄。', applyPower: { id: 'BERSERK_POWER', amount: 1 }, exhaust: true },
  ],
  LEON: [
    { name: 'ソニック・ミラージュ', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に10ダメージ。へろへろ1。', damage: 10, weak: 1 },
    { name: 'ファントム・ステージ', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。カードを2枚引く。', block: 10, draw: 2 },
    { name: 'グランド・ノクターン', cost: 1, type: CardType.POWER, target: TargetType.ALL_ENEMIES, description: '敵全体に6ダメージ。カード使用時、敵全体に1ダメージ。廃棄。', damage: 6, applyPower: { id: 'THOUSAND_CUTS', amount: 1 }, exhaust: true },
  ],
  ELLIOT: [
    { name: 'アストラル・ランサー', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '20ダメージ。', damage: 20 },
    { name: 'セレスティアル・アーカイブ', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック12。HPを5回復。', block: 12, heal: 5 },
    { name: '世界門審判・ワールドゲート', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カードを2枚引く。生成カードを強化する。廃棄。', draw: 2, applyPower: { id: 'MASTER_REALITY', amount: 1 }, exhaust: true },
  ],
  SAKUYA: [
    { name: 'エクリプス・エッジ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '16ダメージ。ドクドク4。', damage: 16, poison: 4 },
    { name: 'オブシディアン・チェイン', cost: 1, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体をへろへろ2にする。ブロック9。', weak: 2, block: 9 },
    { name: '常夜零式封印', cost: 1, type: CardType.POWER, target: TargetType.ALL_ENEMIES, description: '敵全体にドクドク4。攻撃時、ドクドク1を付与する。廃棄。', poison: 4, applyPower: { id: 'ENVENOM', amount: 1 }, exhaust: true },
  ],
};

const RULE_PROGRESS_NOTES_BY_HERO: Record<string, [string, string, string]> = {
  AKARI: [
    '専用ルール: 攻撃枠を埋める。同じ種類が埋まっている場合、星座盤は進まない。',
    '専用ルール: スキル枠を埋める。同じ種類が埋まっている場合、星座盤は進まない。',
    '専用ルール: パワー枠を埋める。攻撃・スキル・パワーが揃うと完成効果が発動する。',
  ],
  SHIZUKU: [
    '専用ルール: 月鏡を1段階進める。3回目の専用カード使用後に反射が発動する。',
    '専用ルール: 月鏡を1段階進め、追加でブロック4を得る。3回目の専用カード使用後に反射が発動する。',
    '専用ルール: 月鏡を1段階進める。3回目の専用カード使用後に反射が発動する。',
  ],
  HIYORI: [
    '専用ルール: 命花壇を1段階進める。3回目の専用カード使用後に収穫が発動する。',
    '専用ルール: 命花壇を1段階進め、追加でHPを2回復する。3回目の専用カード使用後に収穫が発動する。',
    '専用ルール: 命花壇を1段階進める。3回目の専用カード使用後に収穫が発動する。',
  ],
  TSUBASA: [
    '専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。',
    '専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。',
    '専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。',
  ],
  REI: [
    '専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。',
    '専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。',
    '専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。',
  ],
  MADOKA: [
    '専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。',
    '専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。',
    '専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。',
  ],
  KOHARU: [
    '専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。',
    '専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。',
    '専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。',
  ],
  MIRAI: [
    '専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。',
    '専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。',
    '専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。',
  ],
  SERA: [
    '専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。',
    '専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。',
    '専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。',
  ],
  REN: [
    '専用ルール: 蒼風護陣を1段階進める。3回目の専用カード使用後に反撃が発動する。',
    '専用ルール: 蒼風護陣を1段階進め、追加でブロック4を得る。3回目の専用カード使用後に反撃が発動する。',
    '専用ルール: 蒼風護陣を1段階進める。3回目の専用カード使用後に反撃が発動する。',
  ],
  SOMA: [
    '専用ルール: 第一手。最初に使うと計画が1段階進む。',
    '専用ルール: 第二手。第一手の次に使うと計画が2段階目へ進む。先に使うとリセット。',
    '専用ルール: 最終手。第二手の次に使うと完成効果が発動する。先に使うとリセット。',
  ],
  MINATO: [
    '専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。',
    '専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。',
    '専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。',
  ],
  RIKU: [
    '専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。',
    '専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。',
    '専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。',
  ],
  YAMATO: [
    '専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。',
    '専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。',
    '専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。',
  ],
  LEON: [
    '専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。',
    '専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。',
    '専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。',
  ],
  ELLIOT: [
    '専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。',
    '専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。',
    '専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。',
  ],
  SAKUYA: [
    '専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。',
    '専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。',
    '専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。',
  ],
};

const getRuleProgressNote = (heroId: string, cardIndex: number) =>
  RULE_PROGRESS_NOTES_BY_HERO[heroId]?.[cardIndex]
  ?? '専用ルール: この主人公の専用UIを1段階進める。3回目の専用カード使用後に完成効果が発動する。';

const MAGIC_PLAYABLES = [
  ...MAGIC_HEROES.map((hero) => hero.id),
  ...MAGIC_MALE_PROTAGONISTS.map((hero) => hero.id),
];

export const MAGIC_CARDS: MagicCard[] = MAGIC_PLAYABLES.flatMap((heroId, heroIndex) =>
  MAGIC_CARD_SPECS_BY_HERO[heroId].map((spec, cardIndex) => ({
    id: `MAGIC_${heroId}_${cardIndex + 1}`,
    ...spec,
    description: `${spec.description}\n${getRuleProgressNote(heroId, cardIndex)}`,
    rarity: 'SPECIAL',
    visualTheme: 'magic',
    magicHeroId: heroId,
    transformedOnly: true,
    magicRuleCardIndex: cardIndex,
    magicCardArtIndex: heroIndex * 3 + cardIndex,
  })),
);

export const getMagicCardsForHero = (heroId: string) =>
  MAGIC_CARDS.filter((card) => card.magicHeroId === heroId);

export const applyTransformationMultiplier = (value: number | undefined, transformed: boolean) =>
  (value ?? 0) * (transformed ? 2 : 1);

const MAGIC_DYNAMIC_NUMERIC_FIELDS = [
  'damage',
  'block',
  'heal',
  'energy',
  'weak',
  'vulnerable',
  'poison',
  'strength',
  'draw',
] as const;

const scalePositiveInteger = (value: number | undefined, multiplier: number) => {
  if (value === undefined) return undefined;
  if (value === 0) return 0;
  return Math.max(1, Math.floor(value * multiplier));
};

const replaceFirstEffectNumber = (description: string, baseValue: number | undefined, displayValue: number | undefined, suffix: string) => {
  if (baseValue === undefined || displayValue === undefined || baseValue === displayValue) return description;
  return description.replace(new RegExp(`${baseValue}${suffix}`), `${displayValue}${suffix}`);
};

export const getMagicDynamicBoostMultiplier = (gold: number, deckSize: number) => {
  const goldBonusPercent = Math.floor(Math.max(0, gold) / 100) * 10;
  const deckBonusPercent = Math.floor(Math.max(0, deckSize) / 10) * 10;
  return 1 + (goldBonusPercent + deckBonusPercent) / 100;
};

export const boostMagicCardForTransformation = (card: Card, gold: number, deckSize: number): Card => {
  const dynamicMultiplier = getMagicDynamicBoostMultiplier(gold, deckSize);
  const transformedDisplayMultiplier = 2;
  const nextCard: Card = {
    ...card,
    applyPower: card.applyPower ? { ...card.applyPower } : undefined,
    magicBoostedEffectText: true,
    magicDynamicBoostMultiplier: dynamicMultiplier,
  };

  for (const field of MAGIC_DYNAMIC_NUMERIC_FIELDS) {
    const scaled = scalePositiveInteger(card[field], dynamicMultiplier);
    if (scaled !== undefined) {
      nextCard[field] = scaled as never;
    }
  }

  if (nextCard.strength !== undefined) {
    nextCard.strength *= transformedDisplayMultiplier;
  }

  if (card.applyPower) {
    nextCard.applyPower = {
      ...card.applyPower,
      amount: (scalePositiveInteger(card.applyPower.amount, dynamicMultiplier) ?? card.applyPower.amount) * transformedDisplayMultiplier,
    };
  }

  let description = card.description;
  description = replaceFirstEffectNumber(description, card.damage, (nextCard.damage ?? 0) * transformedDisplayMultiplier, 'ダメージ');
  description = replaceFirstEffectNumber(description, card.block, (nextCard.block ?? 0) * transformedDisplayMultiplier, '。');
  description = replaceFirstEffectNumber(description, card.heal, (nextCard.heal ?? 0) * transformedDisplayMultiplier, '回復');
  description = replaceFirstEffectNumber(description, card.energy, (nextCard.energy ?? 0) * transformedDisplayMultiplier, 'を得る');
  description = replaceFirstEffectNumber(description, card.draw, (nextCard.draw ?? 0) * transformedDisplayMultiplier, '枚引く');
  description = replaceFirstEffectNumber(description, card.weak, (nextCard.weak ?? 0) * transformedDisplayMultiplier, 'にする');
  description = replaceFirstEffectNumber(description, card.vulnerable, (nextCard.vulnerable ?? 0) * transformedDisplayMultiplier, 'にする');
  description = replaceFirstEffectNumber(description, card.poison, (nextCard.poison ?? 0) * transformedDisplayMultiplier, '。');
  description = replaceFirstEffectNumber(description, card.strength, nextCard.strength, '。');
  if (card.applyPower) {
    const powerAmount = nextCard.applyPower?.amount;
    description = replaceFirstEffectNumber(description, card.applyPower.amount, powerAmount, 'を得る');
    description = replaceFirstEffectNumber(description, card.applyPower.amount, powerAmount, 'ダメージ');
    description = replaceFirstEffectNumber(description, card.applyPower.amount, powerAmount, 'を付与');
    description = replaceFirstEffectNumber(description, card.applyPower.amount, powerAmount, '枚追加で引く');
  }
  nextCard.description = description;

  return nextCard;
};
