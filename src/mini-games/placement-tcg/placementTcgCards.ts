import { CARDS_LIBRARY } from '../../constants';

export type PlacementCardKind = 'UNIT' | 'SUPPORT' | 'EVENT';
export type PlacementCardTier = 'STARTER' | 'COMMON' | 'UNCOMMON' | 'RARE';
export type PlacementEffectKey =
  | 'DEPLOY_DAMAGE'
  | 'RUSH'
  | 'REGEN'
  | 'THORNS'
  | 'CENTER_POWER'
  | 'KILL_DRAW'
  | 'SUPPORT_BOND'
  | 'PIERCE'
  | 'DIRECT_HEAL'
  | 'DEPLOY_HEAL'
  | 'ATTACK_AURA'
  | 'HEALTH_AURA'
  | 'TURN_HEAL'
  | 'DAMAGE_WARD'
  | 'DRAW_ON_DEFEAT'
  | 'EVENT_DAMAGE'
  | 'EVENT_DRAW'
  | 'EVENT_HEAL'
  | 'EVENT_BUFF'
  | 'EVENT_MOVE'
  | 'EVENT_STUN'
  | 'EVENT_BREAK'
  | 'EVENT_BOUNCE'
  | 'EVENT_ENERGY'
  | 'EVENT_SHIELD';

export interface PlacementCardDefinition {
  id: string;
  sourceCardId: string;
  name: string;
  textureRef: string;
  kind: PlacementCardKind;
  tier: PlacementCardTier;
  spCost: number;
  attack?: number;
  health?: number;
  durability?: number;
  effect: PlacementEffectKey;
  amount: number;
  rulesText: { jp: string; en: string };
}

export const PLACEMENT_TCG_SOURCE_CARD_IDS = [
  'GON_GITSUNE',
  'GON_KURU',
  'HYOJU_RIFLE',
  'HASHIRE_MELOS',
  'JACHI_BOGYAKU',
  'MELOS_TRUST',
  'KUMO_NO_ITO',
  'GOKURAKU_HASU',
  'SANGETSUKI',
  'TORA_HO',
  'BOKKO_CHAN',
  'OI_DETEKOI',
  'KOROSHIYA',
  'HOSHI_PRESENT',
  'KAGAMI_HOSHI',
  'YOSEI_HOSHI',
  'LIFE_MAINTENANCE',
  'SPACE_GREETING',
  'KAIKETSU_ZORORI',
  'ZENITEN_DO',
  'HOSHI_NO_OJI',
  'MOMO_TIME',
  'TIME_THIEF',
  'NEVERENDING_STORY',
  'TOTTO_CHAN',
  'GALAXY_EXPRESS',
  'YODAKA_NO_HOSHI',
  'MANY_ORDERS',
  'BUY_GLOVES',
  'GAUCHE_CELLO',
  'MINE_BLAST_G',
  'RASHOMON',
  'KUMO_NO_ITO_D',
  'OSAMU_NIGHT',
  'GOSHI_REVENGE',
  'KOKORO_SOSEKI',
  'BOTCHAN',
  'WAGAHAI_NEKO',
  'DOKKO_CHAN',
  'KITSUNE_NO_MADO',
  'KACHIKACHI_YAMA',
  'URASHIMA_TARO',
  'MOMOTARO',
  'KAGUYA_HIME',
  'HANASAKA_JIISAN',
  'KASA_JIZO',
  'ISSUN_BOSHI',
  'TSURU_ONGAESHI',
  'OMUSUBI_KORORIN',
  'NEZUMI_NO_YOMEIRI',
  'SUNFLOWER',
  'CACTUS',
  'ROSE',
  'GIANT_VINE',
  'MANDRAKE_ROOT',
  'PEA_SHOOTER',
  'RIPE_TOMATO',
  'IRON_PUMPKIN',
  'HOT_CHILI',
  'GOLDEN_WHEAT',
  'SACRED_LOTUS',
  'LUCKY_CLOVER',
  'POISON_IVY',
  'TULIP_DRAW',
  'STURDY_BAMBOO',
  'SAKURA_STORM',
  'ETERNAL_PINE',
  'CRIMSON_MAPLE',
  'HOLY_GARLIC',
  'HEALING_GINGER',
  'CALM_LAVENDER',
  'GREAT_OAK',
  'MORNING_GLORY',
  'RAINBOW_HYDRANGEA',
  'ECHO_BLUEBELL',
  'FORBIDDEN_APPLE',
  'SOLAR_ORANGE',
  'RICH_GRAPE',
  'LAYERED_CABBAGE',
  'SWORD_DAIKON',
  'MYSTIC_MUSHROOM',
  'SACRED_LILY',
  'WINTER_CAMELLIA',
  'AUTUMN_COSMOS',
  'FLUFFY_DANDELION',
  'WISDOM_GINKGO',
  'CAUSTIC_WASABI',
  'POWER_SHIITAKE',
  'BOUNTY_PERSIMMON',
  'EARLY_PLUM',
  'AWAKE_COFFEE',
  'SWEET_CACAO',
  'EXPLOSIVE_PEPPER',
  'WILLOW_WIND',
  'IRON_CYPRESS',
  'MEDICINAL_ALOE',
  'REFRESH_MINT',
  'FRAGRANT_JASMINE',
  'ULTIMATE_BONSAI',
  'YGGDRASIL',
  'KOKUGO_SYUKUGO',
  'KOKUGO_KOTOWAZA',
  'KOKUGO_GOKAN',
  'KOKUGO_KANJI_TEST',
  'KOKUGO_MANYO',
  'KOKUGO_NIKKI',
  'KOKUGO_SYODO',
  'KOKUGO_DICTIONARY',
  'KOKUGO_SYOSETSU',
  'KOKUGO_SYUJI',
  'KOKUGO_KOTONOHA',
  'KOKUGO_HAIKU',
  'KOKUGO_RITOKU',
  'KOKUGO_BUNPO',
  'KOKUGO_RODOKU',
  'KOKUGO_GOKO',
  'KOKUGO_SAKUBUN',
  'KOKUGO_MOJI',
  'KOKUGO_YOMITOKI',
  'KOKUGO_TENREI',
  'SANSU_CALC_SPEED',
  'SANSU_TRIANGLE',
  'SANSU_COMPASS',
  'SANSU_PROTRACTOR',
  'SANSU_KUKU',
  'SANSU_SOROBAN',
  'SANSU_DIVISION',
  'SANSU_MULTIPLICATION',
  'SANSU_ZERO',
  'SANSU_INFINITY',
  'SANSU_PERCENT',
  'SANSU_GEOMETRY',
  'SANSU_AREA',
  'SANSU_CHART',
  'SANSU_UNIT',
  'SANSU_FORMULA',
  'SANSU_GRID',
  'SANSU_LOGIC',
  'SANSU_FRACTION',
  'SANSU_ABACUS_MASTER',
  'RIKA_EXPERIMENTAL',
  'RIKA_MICROSCOPE',
  'RIKA_MAGNET',
  'RIKA_PHOTOSYNTHESIS',
  'RIKA_PLANETS',
  'RIKA_VOLCANO',
  'RIKA_LITMUS',
  'RIKA_ELECTRIC',
  'RIKA_ECLIPSE',
  'RIKA_EVOLUTION',
  'RIKA_BACTERIA',
  'RIKA_RAINBOW',
  'RIKA_GRAVITY',
  'RIKA_FOSSIL',
  'RIKA_ANATOMY',
  'RIKA_SPRING',
  'RIKA_WEATHER',
  'RIKA_ALCOHOL',
  'RIKA_CONSTELLATION',
  'RIKA_ROBOT',
  'SYAKAI_GEOGRAPHY',
  'SYAKAI_HISTORY',
  'SYAKAI_COIN',
  'SYAKAI_LAW',
  'SYAKAI_MARKET',
  'SYAKAI_CITY',
  'SYAKAI_TRADE',
  'SYAKAI_VOTE',
  'SYAKAI_FACTORY',
  'SYAKAI_TEMPLE',
  'SYAKAI_RICE',
  'SYAKAI_EXPLORER',
  'SYAKAI_CASTLE',
  'SYAKAI_NEWS',
  'SYAKAI_BANK',
  'SYAKAI_REVOLUTION',
  'SYAKAI_GLOBAL',
  'SYAKAI_CULTURE',
  'SYAKAI_COIN_BAG',
  'SYAKAI_HERITAGE',
  'PE_DASH',
  'PE_JUMP',
  'PE_BALL',
  'PE_SWIM',
  'PE_TEAM',
  'PE_CHEER',
  'PE_GYM_MAT',
  'EVENT_CLEANING',
  'EVENT_LUNCH',
  'EVENT_FESTIVAL',
  'PE_HORIZONTAL_BAR',
  'PE_VAULTING',
  'PE_SOCCER',
  'PE_MARATHON',
  'PE_DANCE',
  'EVENT_MORNING',
  'EVENT_HOME',
  'EVENT_TRIP',
  'PE_BASKET',
  'PE_CHAMPION',
] as const;

const UNIT_EFFECTS: PlacementEffectKey[] = [
  'DEPLOY_DAMAGE',
  'RUSH',
  'REGEN',
  'THORNS',
  'CENTER_POWER',
  'KILL_DRAW',
  'SUPPORT_BOND',
  'PIERCE',
  'DIRECT_HEAL',
  'DEPLOY_HEAL',
];

const SUPPORT_EFFECTS: PlacementEffectKey[] = [
  'ATTACK_AURA',
  'HEALTH_AURA',
  'TURN_HEAL',
  'DAMAGE_WARD',
  'DRAW_ON_DEFEAT',
];

const EVENT_EFFECTS: PlacementEffectKey[] = [
  'EVENT_DAMAGE',
  'EVENT_DRAW',
  'EVENT_HEAL',
  'EVENT_BUFF',
  'EVENT_MOVE',
  'EVENT_STUN',
  'EVENT_BREAK',
  'EVENT_BOUNCE',
  'EVENT_ENERGY',
  'EVENT_SHIELD',
];

const cardKindFor = (index: number): PlacementCardKind =>
  (['UNIT', 'UNIT', 'EVENT', 'SUPPORT', 'EVENT'] as const)[index % 5];

const cardTierFor = (index: number): PlacementCardTier => {
  if (index < 20) return 'STARTER';
  if ((index + 1) % 10 === 0) return 'RARE';
  if ((index + 1) % 3 === 0) return 'UNCOMMON';
  return 'COMMON';
};

const rulesTextFor = (effect: PlacementEffectKey, amount: number): PlacementCardDefinition['rulesText'] => {
  const copy: Record<PlacementEffectKey, PlacementCardDefinition['rulesText']> = {
    DEPLOY_DAMAGE: { jp: `登場時：同じレーンの敵ユニットに${amount}ダメージ。`, en: `Deploy: Deal ${amount} damage to the opposing unit.` },
    RUSH: { jp: '速攻。配置したターンでも攻撃できる。', en: 'Rush. This unit can attack on the turn it is deployed.' },
    REGEN: { jp: `再生${amount}。自分のターン終了時、体力を${amount}回復。`, en: `Regenerate ${amount} at the end of your turn.` },
    THORNS: { jp: `戦闘ダメージを受けた時、攻撃した敵に${amount}ダメージ。`, en: `When damaged in combat, deal ${amount} damage back.` },
    CENTER_POWER: { jp: `中央レーンにいる間、攻撃力と最大体力+${amount}。`, en: `In the center lane, gain +${amount} Attack and Health.` },
    KILL_DRAW: { jp: '敵ユニットを退場させた時、カードを1枚引く。各ターン1回。', en: 'Once each turn, draw a card after defeating an enemy unit.' },
    SUPPORT_BOND: { jp: `同じレーンにサポートがある間、攻撃力+${amount}。`, en: `Gain +${amount} Attack while you control support in this lane.` },
    PIERCE: { jp: `貫通${amount}。超過戦闘ダメージを相手ライフへ与える。`, en: `Pierce ${amount}: excess combat damage hits enemy Life.` },
    DIRECT_HEAL: { jp: `直接攻撃に成功した時、自分のライフを${amount}回復。`, en: `After a direct attack, restore ${amount} Life.` },
    DEPLOY_HEAL: { jp: `登場時：味方ユニット1体の体力を${amount}回復。`, en: `Deploy: Restore ${amount} Health to an allied unit.` },
    ATTACK_AURA: { jp: `同じレーンの味方ユニットの攻撃力+${amount}。`, en: `The allied unit in this lane gains +${amount} Attack.` },
    HEALTH_AURA: { jp: `同じレーンの味方ユニットの最大体力+${amount}。`, en: `The allied unit in this lane gains +${amount} Health.` },
    TURN_HEAL: { jp: `自分のターン開始時、同じレーンの味方を${amount}回復。`, en: `At the start of your turn, heal the allied unit here for ${amount}.` },
    DAMAGE_WARD: { jp: `各相手ターン、同じレーンの味方が最初に受けるダメージを${amount}減らす。`, en: `Reduce the first damage to the allied unit here by ${amount} each enemy turn.` },
    DRAW_ON_DEFEAT: { jp: '同じレーンの味方が退場した時、カードを1枚引き、この耐久を1減らす。', en: 'When the allied unit here falls, draw a card and lose 1 Durability.' },
    EVENT_DAMAGE: { jp: `敵ユニット1体に${amount + 1}ダメージ。`, en: `Deal ${amount + 1} damage to an enemy unit.` },
    EVENT_DRAW: { jp: `カードを${Math.min(2, amount)}枚引く。`, en: `Draw ${Math.min(2, amount)} card(s).` },
    EVENT_HEAL: { jp: `味方ユニット1体の体力を${amount + 2}回復。`, en: `Restore ${amount + 2} Health to an allied unit.` },
    EVENT_BUFF: { jp: `味方ユニット1体の攻撃力と最大体力+${amount}。`, en: `Give an allied unit +${amount} Attack and Health.` },
    EVENT_MOVE: { jp: '味方ユニット1体を空いている隣接レーンへ移動し、再行動状態にする。', en: 'Move an allied unit to an adjacent empty lane and ready it.' },
    EVENT_STUN: { jp: '敵ユニット1体を気絶させる。次の手番に攻撃できない。', en: 'Stun an enemy unit. It cannot attack on its next turn.' },
    EVENT_BREAK: { jp: `敵サポート1枚の耐久を${amount}減らす。`, en: `Deal ${amount} damage to enemy Support.` },
    EVENT_BOUNCE: { jp: 'SP3以下の敵ユニット1体を相手の手札に戻す。', en: 'Return an enemy unit costing 3 SP or less to its hand.' },
    EVENT_ENERGY: { jp: `SPを${amount}回復する。`, en: `Restore ${amount} SP.` },
    EVENT_SHIELD: { jp: `味方ユニット1体にシールド${amount + 1}を与える。`, en: `Give an allied unit Shield ${amount + 1}.` },
  };
  return copy[effect];
};

const createDefinition = (sourceCardId: string, index: number): PlacementCardDefinition => {
  const source = CARDS_LIBRARY[sourceCardId];
  if (!source) throw new Error(`Missing placement TCG source card: ${sourceCardId}`);

  const kind = cardKindFor(index);
  const spCost = kind === 'UNIT'
    ? 1 + ((index * 3) % 5)
    : kind === 'SUPPORT'
      ? 1 + ((index * 5) % 4)
      : 1 + ((index * 7) % 4);
  const amount = 1 + (index % 2);
  const effect = kind === 'UNIT'
    ? UNIT_EFFECTS[index % UNIT_EFFECTS.length]
    : kind === 'SUPPORT'
      ? SUPPORT_EFFECTS[index % SUPPORT_EFFECTS.length]
      : EVENT_EFFECTS[index % EVENT_EFFECTS.length];

  return {
    id: `MTCG_${sourceCardId}`,
    sourceCardId,
    name: source.name,
    textureRef: source.textureRef || 'NOTEBOOK|青|SKILL',
    kind,
    tier: cardTierFor(index),
    spCost,
    attack: kind === 'UNIT' ? Math.max(1, spCost + (index % 3) - 1) : undefined,
    health: kind === 'UNIT' ? spCost + 2 + ((index * 2) % 4) : undefined,
    durability: kind === 'SUPPORT' ? 2 + ((index * 3) % 4) : undefined,
    effect,
    amount,
    rulesText: rulesTextFor(effect, amount),
  };
};

export const PLACEMENT_TCG_CARDS: PlacementCardDefinition[] =
  PLACEMENT_TCG_SOURCE_CARD_IDS.map(createDefinition);

export const PLACEMENT_TCG_CARD_MAP = new Map(
  PLACEMENT_TCG_CARDS.map(card => [card.id, card]),
);

export const PLACEMENT_TCG_STARTER_DECK = PLACEMENT_TCG_CARDS
  .filter(card => card.tier === 'STARTER')
  .map(card => card.id);

export const PLACEMENT_TCG_REWARD_POOL = PLACEMENT_TCG_CARDS
  .filter(card => card.tier !== 'STARTER')
  .map(card => card.id);
