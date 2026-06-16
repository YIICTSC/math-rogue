import { CardType, TargetType, type Card, type MagicRuleState, type Relic } from '../types';
import { getMagicCardsForHero } from './magicCards';

export interface MagicRuleConfig {
  heroId: string;
  ruleId: string;
  name: string;
  shortName: string;
  description: string;
  completionCondition: string;
  completionEffect: string;
  slotLabels: [string, string, string];
  relic: Relic;
}

const CONFIG_ROWS: Array<Omit<MagicRuleConfig, 'relic' | 'completionCondition'> & {
  completionCondition?: string;
  relicName: string;
  relicDescription: string;
}> = [
  { heroId: 'AKARI', ruleId: 'CONSTELLATION', name: '星座配置', shortName: '星座盤', description: '異なる種類のカードを3枚使うと星座が完成し、敵全体へ星光を放ってブロックを得る。', slotLabels: ['一番星', '導き星', '結び星'], relicName: '星冠のペンダント', relicDescription: '星座配置を有効化する。星座完成時の星光とブロックが強化される。' },
  { heroId: 'SHIZUKU', ruleId: 'MOON_MIRROR', name: '月鏡反射', shortName: '月鏡', description: '専用カードを3回使うと月鏡が反射し、敵1体へ追加攻撃してブロックを得る。2枚目の専用カードは追加ブロックも得る。', slotLabels: ['観測', '記録', '反射'], relicName: '月鏡の計算盤', relicDescription: '月鏡反射を有効化する。反射時に敵をびくびくにする。' },
  { heroId: 'HIYORI', ruleId: 'MAGIC_GARDEN', name: '魔法栽培', shortName: '命花壇', description: '専用カードで種を植え、育て、収穫する。収穫時に回復と全体攻撃が発生する。', slotLabels: ['種', 'つぼみ', '開花'], relicName: '命花の種子', relicDescription: '魔法栽培を有効化する。収穫時の回復量が増える。' },
  { heroId: 'TSUBASA', ruleId: 'MAGIC_FORGE', name: '魔法鍛造', shortName: '神鍛炉', description: '専用カードを使うたび炉熱が上がる。炉熱3で手札を強化し、ムキムキを得る。', slotLabels: ['加熱', '鍛打', '焼入れ'], relicName: '神鍛の火床', relicDescription: '魔法鍛造を有効化する。鍛造完成時に追加エナジーを得る。' },
  { heroId: 'REI', ruleId: 'SEAL_TALISMAN', name: '封印札', shortName: '禁札陣', description: '専用カードで封印札を重ねる。3枚揃うと敵全体を弱体化し、ドクドクを与える。', slotLabels: ['壱ノ札', '弐ノ札', '参ノ札'], relicName: '深紅の禁札', relicDescription: '封印札を有効化する。封印完成時に追加ブロックを得る。' },
  { heroId: 'MADOKA', ruleId: 'TIME_SAVE', name: '時間保存', shortName: '時環記録', description: '専用カードを3回使うと時環が完成し、カード補充・エナジー・ブロックをまとめて得る。順番は自由。', slotLabels: ['記録', '待機', '再演'], relicName: '時環の懐中時計', relicDescription: '時間保存を有効化する。再演時にカードを追加で引く。' },
  { heroId: 'KOHARU', ruleId: 'SPIRIT_CONTRACT', name: '精霊契約', shortName: '精霊樹', description: '専用カードの種類に応じて風・葉・樹の精霊と契約し、3種揃うと全効果を発動する。', slotLabels: ['風精霊', '葉精霊', '樹精霊'], relicName: '精霊樹の若枝', relicDescription: '精霊契約を有効化する。契約完成時にカードを引く。' },
  { heroId: 'MIRAI', ruleId: 'MAGIC_SHOW', name: '魔法公演', shortName: '夢幻舞台', description: '専用カードを演目枠へ置く。3演目が揃うとフィナーレで全体攻撃と弱体化を行う。', slotLabels: ['開演', '転調', '終幕'], relicName: '夢幻の仮面', relicDescription: '魔法公演を有効化する。フィナーレ時にエナジーを得る。' },
  { heroId: 'SERA', ruleId: 'MAGIC_ANALYSIS', name: '魔法解析', shortName: '星界記録', description: '専用カードを3回使うと解析が完了し、カード補充・ブロック・ムキムキを得る。順番は自由。', slotLabels: ['攻撃記録', '防御記録', '補助記録'], relicName: '星界の記録書', relicDescription: '魔法解析を有効化する。解析完了時に生成カードを強化する。' },
  { heroId: 'REN', ruleId: 'GUARD_DESIGNATION', name: '守護指定', shortName: '蒼風護陣', description: '専用スキルで守護を蓄積し、専用攻撃で守護を消費して追加攻撃する。', slotLabels: ['警戒', '庇護', '反撃'], relicName: '蒼風の護符', relicDescription: '守護指定を有効化する。反撃時にブロックを残す。' },
  { heroId: 'SOMA', ruleId: 'ACTION_PLAN', name: '行動計画', shortName: '氷律計画', description: '専用カードを番号順に使うと計画達成。順序が崩れると最初から組み直す。', slotLabels: ['第一手', '第二手', '最終手'], relicName: '氷律の校章', relicDescription: '行動計画を有効化する。計画達成時に敵全体を凍結させる。' },
  { heroId: 'MINATO', ruleId: 'HEALING_BLEND', name: '治癒調合', shortName: '清流調合', description: '専用カードから治癒水を3滴集め、回復・ブロック・攻撃へ一度に変換する。', slotLabels: ['清水', '薬草', '星雫'], relicName: '清流の小瓶', relicDescription: '治癒調合を有効化する。調合完成時の回復が増える。' },
  { heroId: 'RIKU', ruleId: 'FUTURE_BRANCH', name: '未来分岐', shortName: '分岐盤', description: '専用カードで未来候補を3つ観測する。3候補が揃うと手札補充とエナジーを得る。', slotLabels: ['現在', '分岐A', '分岐B'], relicName: '時詠の羅針盤', relicDescription: '未来分岐を有効化する。観測完了時に追加ブロックを得る。' },
  { heroId: 'YAMATO', ruleId: 'DUEL', name: '決闘宣言', shortName: '紅蓮決闘', description: '専用カード使用で闘気を蓄積する。闘気3で敵単体へ大ダメージを与える。', slotLabels: ['挑発', '応酬', '決着'], relicName: '紅蓮の手甲', relicDescription: '決闘宣言を有効化する。決着時にムキムキを得る。' },
  { heroId: 'LEON', ruleId: 'ILLUSION_SCORE', name: '幻奏譜', shortName: '幻奏譜', description: '専用カードを音符として並べる。3音揃うと全体へ幻奏フィナーレを放つ。', slotLabels: ['主旋律', '対旋律', '終止音'], relicName: '幻奏の指揮棒', relicDescription: '幻奏譜を有効化する。フィナーレ時にカードを引く。' },
  { heroId: 'ELLIOT', ruleId: 'ASTRAL_SUMMON', name: '星界召喚', shortName: '星界門', description: '専用カードで星界門を3段階開く。開門完了で星界の加護を召喚する。', slotLabels: ['座標', '接続', '開門'], relicName: '星界の鍵', relicDescription: '星界召喚を有効化する。開門時に回復とブロックを得る。' },
  { heroId: 'SAKUYA', ruleId: 'FORBIDDEN_PACT', name: '禁術契約', shortName: '常夜契約', description: '専用カードで代償を支払い契約を進める。3段階で強力な封印術を発動する。', slotLabels: ['血印', '影印', '終印'], relicName: '宵闇の封印鎖', relicDescription: '禁術契約を有効化する。契約完成時の自傷を抑える。' },
];

const COMPLETION_CONDITIONS: Record<string, string> = {
  AKARI: '攻撃・スキル・パワーを各1種類使う。順番は自由で、同じ種類を重ねても進行しない。専用カード以外も対象。',
  SOMA: '専用カードを左から順に1枚目→2枚目→3枚目と使う。途中で違う順番の専用カードを使うと進行がリセットされる。',
};

const COMPLETION_EFFECTS: Record<string, string> = {
  AKARI: '敵全体に10ダメージを与え、自分はブロック10を得る。その後、星座盤は空に戻る。',
  SHIZUKU: '生存している敵1体に18ダメージとびくびく1を与え、自分はブロック12を得る。その後、月鏡は空に戻る。',
  HIYORI: '敵全体に8ダメージを与え、自分のHPを10回復する。その後、命花壇は空に戻る。',
  TSUBASA: '手札をすべて強化し、ムキムキ2とエナジー1を得る。その後、神鍛炉は空に戻る。',
  REI: '敵全体にへろへろ2とドクドク6を与え、自分はブロック8を得る。その後、禁札陣は空に戻る。',
  MADOKA: 'カードを2枚引き、エナジー1とブロック8を得る。その後、時環記録は空に戻る。',
  KOHARU: '敵全体に7ダメージを与え、ブロック12を得てカードを1枚引く。その後、精霊樹は空に戻る。',
  MIRAI: '敵全体に12ダメージとへろへろ1を与え、エナジー1を得る。その後、夢幻舞台は空に戻る。',
  SERA: 'カードを2枚引き、ブロック10とムキムキ1を得る。その後、星界記録は空に戻る。',
  REN: '生存している敵1体に20ダメージを与え、自分はブロック12を得る。その後、蒼風護陣は空に戻る。',
  SOMA: '敵全体に9ダメージ、へろへろ1、びくびく1を与え、自分はブロック10を得る。その後、氷律計画は空に戻る。',
  MINATO: 'HPを12回復し、ブロック12を得て、生存している敵1体に10ダメージを与える。その後、清流調合は空に戻る。',
  RIKU: 'カードを3枚引き、エナジー1とブロック6を得る。その後、分岐盤は空に戻る。',
  YAMATO: '生存している敵1体に30ダメージを与え、ムキムキ1を得る。その後、紅蓮決闘は空に戻る。',
  LEON: '敵全体に13ダメージを与え、カードを1枚引く。その後、幻奏譜は空に戻る。',
  ELLIOT: 'HPを6回復し、ブロック16とムキムキ1を得る。その後、星界門は空に戻る。',
  SAKUYA: 'HPを3支払い、敵全体にドクドク9とへろへろ2を与える。HPは1未満にならない。その後、常夜契約は空に戻る。',
};

export const MAGIC_RULE_CONFIGS: Record<string, MagicRuleConfig> = Object.fromEntries(
  CONFIG_ROWS.map((row) => [row.heroId, {
    heroId: row.heroId,
    ruleId: row.ruleId,
    name: row.name,
    shortName: row.shortName,
    description: row.description,
    completionCondition: row.completionCondition
      ?? COMPLETION_CONDITIONS[row.heroId]
      ?? 'この主人公の専用カードを合計3回使う。同じカードを複数回使っても進行する。3回目のカード効果後に完成効果が発動する。',
    completionEffect: COMPLETION_EFFECTS[row.heroId]
      ?? '完成時に主人公ごとの追加効果が発動し、その後専用UIの進行は空に戻る。',
    slotLabels: row.slotLabels,
    relic: {
      id: `MAGIC_RELIC_${row.heroId}`,
      name: row.relicName,
      description: row.relicDescription,
      rarity: 'STARTER',
      effectType: 'PASSIVE',
      magicRelicHeroId: row.heroId,
    },
  }]),
);

const basicCard = (
  heroId: string,
  suffix: string,
  spec: Omit<Card, 'id' | 'rarity' | 'visualTheme'>,
): Card => ({
  id: `MAGIC_BASIC_${heroId}_${suffix}`,
  rarity: 'COMMON',
  visualTheme: 'magic',
  ...spec,
});

export const createMagicStartingDeck = (heroId: string): Card[] => {
  const strike = basicCard(heroId, 'STRIKE', {
    name: '魔導打撃',
    cost: 1,
    type: CardType.ATTACK,
    target: TargetType.ENEMY,
    description: '7ダメージ。',
    damage: 7,
    magicHeroId: heroId,
    magicBasicCardArt: 'strike',
  });
  const guard = basicCard(heroId, 'GUARD', {
    name: '魔力障壁',
    cost: 1,
    type: CardType.SKILL,
    target: TargetType.SELF,
    description: 'ブロック6。',
    block: 6,
    magicHeroId: heroId,
    magicBasicCardArt: 'guard',
  });
  const focus = basicCard(heroId, 'FOCUS', {
    name: '術式集中',
    cost: 1,
    type: CardType.SKILL,
    target: TargetType.SELF,
    description: 'ブロック4。カードを1枚引く。',
    block: 4,
    draw: 1,
    magicHeroId: heroId,
    magicBasicCardArt: 'focus',
  });
  const ruleCards = getMagicCardsForHero(heroId).map((card, index) => ({
    ...card,
    id: `start-${card.id}-${index}`,
    transformedOnly: false as const,
    magicRuleCardIndex: index,
    magicRuleCardArt: true,
  }));
  return [
    { ...strike, id: `${strike.id}-1` },
    { ...strike, id: `${strike.id}-2` },
    { ...guard, id: `${guard.id}-1` },
    { ...guard, id: `${guard.id}-2` },
    focus,
    ...ruleCards,
  ];
};

export const createMagicRuleState = (heroId: string): MagicRuleState => ({
  ruleId: MAGIC_RULE_CONFIGS[heroId]?.ruleId ?? 'CONSTELLATION',
  value: 0,
  secondaryValue: 0,
  sequence: [],
  slots: [],
});

export const getMagicRuleConfig = (heroId: string) =>
  MAGIC_RULE_CONFIGS[heroId] ?? MAGIC_RULE_CONFIGS.AKARI;
