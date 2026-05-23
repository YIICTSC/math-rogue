import { CardType, TargetType, type Card } from '../types';

const FAMILIAR_NAMES = [
  '暁狐アルカ', '白竜レイヴン', '黒羽クロウリー', '虎神ラセツ', '月兎ミカヅキ',
  '鬼面カグラ', '鶴姫シラユキ', '幸運猫ノワール', '海月巫女ルミナ', '蛾天使モルフォ',
  '九尾シグレ', '錦蛇コハク', '紙影ヌエ', '青提灯アオイ', '鹿角セフィラ',
  '髑髏小鬼ボニー', '彗星魚コメット', '鈴人形リンネ', '仮面詩神ミューズ', '墨魔インクス',
  '歯車天使クロノ', '鏡女王ミラ', '嵐天狗ハヤテ', '緋爵ヴラド', '夢喰バクシン',
  '白火サラマ', '札式ゴーレム', '紅傘アマネ', '骨琴ヴィオラ', '電脳犬神ケン',
  '水晶人魚セレネ', '影馬ケンタウロ', '星麒麟ステラ', '人形女王ドロシー', '墨鯨オルカ',
  '炉心イフリート', '雪騎士ユキノ', '笑火ジャック', '黒角ユニコ', '蒼鬼ラピス',
  '太陽烏ヒノカ', '月狼ルーナ', '赤糸アラクネ', '数式スフィンクス', '鐘天使ベル',
  '硝子孔雀パヴォ', '黒蓮ドリアード', '雷麒麟ライカ', '落書精ジン', '扇天狗サヤ',
  'ネオン蛇ネイラ', '黄昏フェニクス', '人形託宣マネキン', '紫牛ミノス', '淡海リヴァ',
  '紅蟷螂マンティス', '白墨スピリット', '輪蛇ウロボロ', '羊魔メリー', '銀蛾シスター',
  '蝕翼グリフォン', '化狸ブローカー', '象牙バジリスク', '紅槍ヴァルキュリア', '螺旋カタツムリ',
  '黒翼ケルブ', '蒼炎キツネ', '黄金仮面ゴーレム', '灰樹アッシュ', '雨衣ゴースト',
  '折鶴レギオン', '黒曜シャーク', '実験ホムンクルス', '桜怨サクラ', '銀狐モンク',
  '緋烏プリースト', '黒板クラーケン', '極光サーペント', '夜蝙蝠ナイト', '真夜獅子レオン',
  '曙キメラ', '紅天狗バイカー', '蒼鱗ラミア', '陶器花嫁ゴーレム', '幼火フェニィ',
  '王虎ビャッコ', '深淵蛸ノーブル', '仮面雷神ドラム', '月影ワーウルフ', '彩小鬼キャンディ',
  '砂王スフィンクス', '骨竜スカラー', '雨狐アンブレラ', '蝕蛾クイーン', '緋河童ローグ',
  '水晶鹿クリスタ', '黒天馬ノクス', '禁書梟オウル', '鏡鳥ハーピィ', '赤点大魔王アーク',
] as const;

const EFFECTS = [
  ['DAMAGE', 16],
  ['AOE_DAMAGE', 10],
  ['BLOCK', 15],
  ['HEAL', 10],
  ['DRAW', 2],
  ['ENERGY_NEXT', 2],
  ['POISON', 8],
  ['WEAK', 2],
  ['VULNERABLE', 2],
  ['STRENGTH', 2],
  ['GOLD', 22],
  ['RANDOM_HITS', 20],
  ['AOE_POISON', 6],
  ['CHAOS_SURGE', 2],
] as const;

const TRIGGERS = [
  ['END_TURN', '毎ターン終了時'],
  ['ONCE_END_TURN', 'このターン終了時に一度だけ'],
  ['EVERY_OTHER_TURN', '2ターンに1回'],
  ['LOW_HP_END_TURN', 'HPが半分以下ならターン終了時'],
  ['NO_BLOCK_END_TURN', 'ブロック0ならターン終了時'],
] as const;

const buildFamiliarEffectText = (kind: (typeof EFFECTS)[number][0], amount: number) => {
  switch (kind) {
    case 'DAMAGE':
      return `ランダムな敵に${amount}ダメージ。`;
    case 'RANDOM_HITS':
      return `ランダムな敵に1ダメージを${amount}回与える。`;
    case 'AOE_DAMAGE':
      return `敵全体に${amount}ダメージ。`;
    case 'BLOCK':
      return `ブロック${amount}。`;
    case 'HEAL':
      return `HPを${amount}回復。`;
    case 'DRAW':
      return `カードを${amount}枚引く。`;
    case 'ENERGY_NEXT':
      return `次ターンのエナジー+${amount}。`;
    case 'POISON':
      return `ランダムな敵にドクドク${amount}。`;
    case 'AOE_POISON':
      return `敵全体にドクドク${amount}。`;
    case 'WEAK':
      return `敵全体にへろへろ${amount}。`;
    case 'VULNERABLE':
      return `敵全体にびくびく${amount}。`;
    case 'STRENGTH':
      return `ムキムキ+${amount}。`;
    case 'GOLD':
      return `ゴールド${amount}を得る。`;
    case 'CHAOS_SURGE':
      return `カードを${amount}枚引き、ムキムキ+${amount}、次ターンのエナジー+${Math.max(1, amount - 1)}。`;
    default:
      return '';
  }
};

export const HIGH_SCHOOL_STARTER_REPLACEMENTS: Record<string, string> = {
  BASH: 'HS_STARTER_BREAK',
};

export const HIGH_SCHOOL_REMOVED_ELEMENTARY_STARTERS = [
  'ランドセルタックル',
];

export const HIGH_SCHOOL_STARTER_CARDS: Record<string, Omit<Card, 'id'>> = {
  HS_STARTER_EDGE: { name: 'ペンブレード', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージを与える。', damage: 7, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'SWORD|黒|ATTACK' },
  HS_STARTER_GUARD: { name: '参考書ガード', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック6を得る。', block: 6, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'NOTEBOOK|白|SKILL' },
  HS_STARTER_BREAK: { name: '校章ブレイク', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。対象にびくびく2。', damage: 9, vulnerable: 2, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'FIST|赤|ATTACK' },
  HS_STARTER_FOCUS: { name: '放課後フォーカス', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。カード1枚を引く。', block: 5, draw: 1, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'EYE|青|SKILL' },
  HS_STARTER_BIND: { name: '黒リボン拘束', cost: 1, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体にびくびく1。ブロック3。', vulnerable: 1, block: 3, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'SHIELD|黒|SKILL' },
  HS_STARTER_FAINT: { name: 'フェイントレポート', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '4ダメージ。対象にへろへろ1。', damage: 4, weak: 1, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'DAGGER|黒|ATTACK' },
  HS_STARTER_SPARK: { name: '実験スパーク', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。エナジー1回復。', damage: 7, energy: 1, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'LIGHTNING|青|ATTACK' },
  HS_STARTER_THROW: { name: 'サイドスロー', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。1枚引き、1枚捨てる。', damage: 9, draw: 1, promptsDiscard: 1, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'DAGGER|白|ATTACK' },
  HS_STARTER_STEP: { name: 'ステップイン', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。ブロック6。', damage: 5, block: 6, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'SHOE|黒|ATTACK' },
  HS_STARTER_RESONANCE: { name: '反響チューニング', cost: 1, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体にへろへろ1。カード1枚を引く。', weak: 1, draw: 1, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'LIGHTNING|白|SKILL' },
  HS_STARTER_PREP: { name: '禁書の栞', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック7。1枚引き、1枚捨てる。', block: 7, draw: 1, promptsDiscard: 1, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'NOTEBOOK|黒|SKILL' },
  HS_STARTER_HEAT: { name: '鉄板ヒート', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。次ターンのエナジー+1。', damage: 8, nextTurnEnergy: 1, rarity: 'COMMON', visualTheme: 'high-school', textureRef: 'FLAME|赤|ATTACK' },
};

export const HIGH_SCHOOL_FAMILIAR_CARDS: Record<string, Omit<Card, 'id'>> = Object.fromEntries(
  FAMILIAR_NAMES.map((name, index) => {
    const [kind, baseAmount] = EFFECTS[index % EFFECTS.length];
    const [trigger, triggerText] = TRIGGERS[index % TRIGGERS.length];
    const isOneShot = trigger === 'ONCE_END_TURN';
    const rarity = index >= 95 ? 'LEGENDARY' : index >= 72 ? 'RARE' : index >= 36 ? 'UNCOMMON' : 'COMMON';
    const rarityBoost = rarity === 'LEGENDARY' ? 1.9 : rarity === 'RARE' ? 1.55 : rarity === 'UNCOMMON' ? 1.25 : 1;
    const oneShotBoost = isOneShot ? 1.4 : 1;
    const scaled = Math.round(baseAmount * rarityBoost * oneShotBoost);
    const amount = kind === 'DAMAGE' || kind === 'AOE_DAMAGE' || kind === 'RANDOM_HITS'
      ? Math.min(50, scaled)
      : scaled;
    const effectText = buildFamiliarEffectText(kind, amount);
    const duration = isOneShot ? 1 : 'BATTLE';
    return [`HS_FAMILIAR_${String(index).padStart(3, '0')}`, {
      name: `${name}の契約`,
      cost: isOneShot ? 3 : (index % 11 === 0 ? 0 : index % 4 === 0 ? 2 : 1),
      type: CardType.SUMMON,
      target: TargetType.SELF,
      description: `${name}を召喚。${triggerText}、${effectText}廃棄。`,
      exhaust: true,
      rarity,
      visualTheme: 'high-school',
      highSchoolCardArtIndex: index,
      textureRef: `FAMILIAR|${index}|SUMMON`,
      familiarSummon: {
        id: `fam-${index}`,
        name,
        imageIndex: index,
        duration,
        trigger,
        effect: { kind, amount },
      },
    }];
  })
) as Record<string, Omit<Card, 'id'>>;

export const HIGH_SCHOOL_CARDS: Record<string, Omit<Card, 'id'>> = {
  ...HIGH_SCHOOL_STARTER_CARDS,
  ...HIGH_SCHOOL_FAMILIAR_CARDS,
};
