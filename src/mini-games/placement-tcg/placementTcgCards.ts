import { CARDS_LIBRARY, CHARACTERS } from '../../constants';
import {
  HIGH_SCHOOL_ENEMY_VARIANTS,
  HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS,
  MAGIC_ENEMY_VARIANTS,
  MAGIC_HUMANOID_ENEMY_VARIANTS,
} from '../../data/visualThemes';
import { ENEMY_LIBRARY_BY_THEME } from '../../data/enemyCatalogs';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from '../../data/magicHeroes';
import { getEnemyIllustrationPaths } from '../../utils/enemyIllustration';
import { assetUrl } from '../../utils/assetPaths';
import {
  buildPlacementEffectProgram,
  renderPlacementEffectProgram,
  type PlacementEffectProgram,
} from './placementTcgEffectDsl';

export type PlacementCardKind = 'UNIT' | 'SUPPORT' | 'EVENT';
export type PlacementCardTier = 'STARTER' | 'COMMON' | 'UNCOMMON' | 'RARE';
export type PlacementTcgEdition = 'ELEMENTARY' | 'HIGH_SCHOOL' | 'MAGIC';
export type PlacementCardVoiceProfile =
  | { type: 'HIGH_SCHOOL_HERO'; id: string }
  | { type: 'MAGIC_HERO'; id: string; transformed: boolean }
  | { type: 'HUMANOID_ENEMY'; theme: 'high-school' | 'magic'; name: string };
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
  /** Internal artwork lookup key. The UI deliberately presents the current TCG art source instead of this legacy card ID. */
  artSourceType: 'CHARACTER_ART' | 'CARD_ART';
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
  /** Stable per-card effect identity used by the catalog/audit. The engine effect key is a runtime family. */
  effectId: string;
  effectProgram: PlacementEffectProgram;
  rulesText: { jp: string; en: string };
  edition: PlacementTcgEdition;
  artAsset?: string;
  attackArtAsset?: string;
  /** Per-source crop alignment so transparent portrait margins do not push a bust-up below the card frame. */
  artObjectPosition?: string;
  voiceProfile?: PlacementCardVoiceProfile;
  signatureCode: number;
}

type CharacterCardBlueprint = {
  id: string;
  name: string;
  edition: PlacementTcgEdition;
  artAsset: string;
  attackArtAsset?: string;
  artObjectPosition?: string;
  voiceProfile?: PlacementCardVoiceProfile;
};

type EnemyTheme = 'ELEMENTARY' | 'HIGH_SCHOOL' | 'MAGIC';

const themeToEdition: Record<EnemyTheme, PlacementTcgEdition> = {
  ELEMENTARY: 'ELEMENTARY',
  HIGH_SCHOOL: 'HIGH_SCHOOL',
  MAGIC: 'MAGIC',
};

const getThemedEnemyAsset = (theme: EnemyTheme, name: string): { artAsset: string; attackArtAsset: string } => {
  if (theme === 'ELEMENTARY') {
    const artAsset = getEnemyIllustrationPaths(name)[0];
    return { artAsset, attackArtAsset: artAsset };
  }
  const isHighSchool = theme === 'HIGH_SCHOOL';
  const humanoidVariants = isHighSchool ? HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS : MAGIC_HUMANOID_ENEMY_VARIANTS;
  const monsterVariants = isHighSchool ? HIGH_SCHOOL_ENEMY_VARIANTS : MAGIC_ENEMY_VARIANTS;
  const humanoid = humanoidVariants.find(variant => variant.name === name);
  const monster = monsterVariants.find(variant => variant.name === name);
  if (humanoid) {
    const root = isHighSchool ? 'high-school' : 'magic';
    return {
      artAsset: assetUrl(`sprites/${root}/humanoid-enemies/${humanoid.imageIndex}.webp`),
      attackArtAsset: assetUrl(`sprites/${root}/humanoid-enemies-attack/${humanoid.imageIndex}.webp`),
    };
  }
  if (monster) {
    const root = isHighSchool ? 'high-school' : 'magic';
    const artAsset = assetUrl(`sprites/${root}/enemies/${monster.imageIndex}.webp`);
    return { artAsset, attackArtAsset: artAsset };
  }
  throw new Error(`Missing named enemy artwork mapping: ${theme}:${name}`);
};

const createEnemyBlueprints = (theme: EnemyTheme, expectedCount: number): CharacterCardBlueprint[] => {
  const entries = Object.entries(ENEMY_LIBRARY_BY_THEME[theme === 'ELEMENTARY' ? 'elementary' : theme === 'HIGH_SCHOOL' ? 'high-school' : 'magic']);
  if (entries.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} ${theme} enemy cards, found ${entries.length}`);
  }
  const humanoidNames = new Set(
    (theme === 'HIGH_SCHOOL' ? HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS : theme === 'MAGIC' ? MAGIC_HUMANOID_ENEMY_VARIANTS : [])
      .map(variant => variant.name),
  );
  return entries.map(([catalogKey, entry], index) => {
    const elementaryPath = theme === 'ELEMENTARY'
      ? getEnemyIllustrationPaths(entry.name, [catalogKey])[0]
      : null;
    if (theme === 'ELEMENTARY' && !elementaryPath) {
      throw new Error(`Missing named enemy artwork mapping: ${theme}:${catalogKey}`);
    }
    const assets = elementaryPath
      ? { artAsset: elementaryPath, attackArtAsset: elementaryPath }
      : getThemedEnemyAsset(theme, entry.name);
    const isHumanoid = humanoidNames.has(entry.name);
    return {
      id: `${theme}_ENEMY_${String(index + 1).padStart(3, '0')}`,
      name: entry.name,
      edition: themeToEdition[theme],
      artAsset: assets.artAsset,
      attackArtAsset: assets.attackArtAsset,
      voiceProfile: isHumanoid
        ? { type: 'HUMANOID_ENEMY' as const, theme: theme === 'HIGH_SCHOOL' ? 'high-school' as const : 'magic' as const, name: entry.name }
        : undefined,
    };
  });
};

const HIGH_SCHOOL_HERO_NAMES = [
  '反逆の高校生', '生物部の先輩', '謎めく転入生', 'バスケ部エース', '放送部ディレクター',
  '文芸部書記', '学食の料理長', '園芸部部長', '化学研究会長',
] as const;

// The artwork sheet follows the character roster, while the display names are
// intentionally written in story order. Keep the mapping explicit so a card
// name can never silently drift onto another character's portrait when either
// list is edited.
const HIGH_SCHOOL_HERO_ART_INDEX: Record<string, number> = {
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

const CHARACTER_CARD_BLUEPRINTS: CharacterCardBlueprint[] = [
  ...CHARACTERS.map(character => ({
    id: `ELEMENTARY_HERO_${character.id}`,
    name: character.name,
    edition: 'ELEMENTARY' as const,
    artAsset: character.imageData,
  })),
  ...CHARACTERS.map((character, index) => {
    const artIndex = HIGH_SCHOOL_HERO_ART_INDEX[character.id] ?? index;
    return {
      id: `HIGH_SCHOOL_HERO_${character.id}`,
      name: HIGH_SCHOOL_HERO_NAMES[index] || character.name,
      edition: 'HIGH_SCHOOL' as const,
      artAsset: `sprites/high-school/characters/${artIndex}.webp`,
      attackArtAsset: `sprites/high-school/characters-attack/${artIndex}.webp`,
      voiceProfile: { type: 'HIGH_SCHOOL_HERO' as const, id: character.id },
    };
  }),
  ...MAGIC_HEROES.flatMap(hero => ([false, true] as const).map(transformed => ({
    id: `MAGIC_HERO_${hero.id}_${transformed ? 'AFTER' : 'BEFORE'}`,
    name: transformed ? `${hero.name}／${hero.transformedTitle}` : hero.name,
    edition: 'MAGIC' as const,
    artAsset: `sprites/magic/characters/heroine-${String(hero.index).padStart(2, '0')}-${transformed ? 'after' : 'before'}.webp`,
    attackArtAsset: `sprites/magic/characters-attack/heroine-${String(hero.index).padStart(2, '0')}-${transformed ? 'after' : 'before'}.webp`,
    voiceProfile: { type: 'MAGIC_HERO' as const, id: hero.id, transformed },
  }))),
  ...MAGIC_MALE_PROTAGONISTS.flatMap(hero => ([false, true] as const).map(transformed => ({
    id: `MAGIC_HERO_${hero.id}_${transformed ? 'AFTER' : 'BEFORE'}`,
    name: transformed ? `${hero.name}／${hero.transformedTitle}` : hero.name,
    edition: 'MAGIC' as const,
    artAsset: `sprites/magic/male-characters/${hero.assetId}-${transformed ? 'after' : 'before'}.webp`,
    attackArtAsset: `sprites/magic/male-characters-attack/${hero.assetId}-${transformed ? 'after' : 'before'}.webp`,
    artObjectPosition: '50% 60%',
    voiceProfile: { type: 'MAGIC_HERO' as const, id: hero.id, transformed },
  }))),
  ...createEnemyBlueprints('ELEMENTARY', 119),
  ...createEnemyBlueprints('HIGH_SCHOOL', 103),
  ...createEnemyBlueprints('MAGIC', 67),
];

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

const createDefinition = (
  sourceCardId: string,
  index: number,
  blueprint?: CharacterCardBlueprint,
  forcedKind?: PlacementCardKind,
): PlacementCardDefinition => {
  const source = CARDS_LIBRARY[sourceCardId];
  if (!source) throw new Error(`Missing placement TCG source card: ${sourceCardId}`);

  const kind: PlacementCardKind = forcedKind || (blueprint ? 'UNIT' : cardKindFor(index));
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

  const edition: PlacementTcgEdition = blueprint?.edition
    || (index % 3 === 0 ? 'ELEMENTARY' : index % 3 === 1 ? 'HIGH_SCHOOL' : 'MAGIC');
  const baseRules = rulesTextFor(effect, amount);
  const effectProgram = buildPlacementEffectProgram({
    id: blueprint?.id || `${kind}_${sourceCardId}`,
    name: blueprint?.name || source.name,
    index,
    kind,
    edition,
    amount,
    legacyEffect: effect,
  });
  const effectId = `EFFECT_${String(index + 1).padStart(3, '0')}_${kind}`;
  return {
    id: blueprint ? `MTCG_${blueprint.id}` : `MTCG_${kind}_${sourceCardId}`,
    sourceCardId,
    artSourceType: blueprint ? 'CHARACTER_ART' : 'CARD_ART',
    name: blueprint?.name || source.name,
    textureRef: source.textureRef || 'NOTEBOOK|青|SKILL',
    kind,
    tier: cardTierFor(index),
    spCost,
    attack: kind === 'UNIT' ? Math.max(1, spCost + (index % 3) - 1) : undefined,
    health: kind === 'UNIT' ? spCost + 2 + ((index * 2) % 4) : undefined,
    durability: kind === 'SUPPORT' ? 2 + ((index * 3) % 4) : undefined,
    effect,
    amount,
    effectId,
    effectProgram,
    rulesText: renderPlacementEffectProgram(effectProgram, baseRules),
    edition,
    artAsset: blueprint?.artAsset,
    attackArtAsset: blueprint?.attackArtAsset,
    artObjectPosition: blueprint?.artObjectPosition,
    voiceProfile: blueprint?.voiceProfile,
    signatureCode: index,
  };
};

const SUPPORT_EVENT_SOURCES = PLACEMENT_TCG_SOURCE_CARD_IDS;

export const PLACEMENT_TCG_CARDS: PlacementCardDefinition[] = [
  ...CHARACTER_CARD_BLUEPRINTS.map((blueprint, index) => createDefinition(
    PLACEMENT_TCG_SOURCE_CARD_IDS[index % PLACEMENT_TCG_SOURCE_CARD_IDS.length],
    index,
    blueprint,
  )),
  ...SUPPORT_EVENT_SOURCES.map((sourceCardId, offset) => createDefinition(
    sourceCardId,
    CHARACTER_CARD_BLUEPRINTS.length + offset,
    undefined,
    offset < SUPPORT_EVENT_SOURCES.length / 2 ? 'SUPPORT' : 'EVENT',
  )),
];

export const PLACEMENT_TCG_CARD_MAP = new Map(
  PLACEMENT_TCG_CARDS.map(card => [card.id, card]),
);

/**
 * v1 used MTCG_<source id> for the 200-card pool. Those IDs are retained as
 * migration aliases only; the new catalog has separate SUPPORT/EVENT cards.
 */
export const PLACEMENT_TCG_LEGACY_CARD_ID_MAP = new Map(
  PLACEMENT_TCG_SOURCE_CARD_IDS.map((sourceCardId, index) => [
    `MTCG_${sourceCardId}`,
    PLACEMENT_TCG_CARD_MAP.get(`MTCG_${index < PLACEMENT_TCG_SOURCE_CARD_IDS.length / 2 ? 'SUPPORT' : 'EVENT'}_${sourceCardId}`)?.id || '',
  ]),
);

export const normalizePlacementTcgCardId = (cardId: string): string => (
  PLACEMENT_TCG_CARD_MAP.has(cardId)
    ? cardId
    : PLACEMENT_TCG_LEGACY_CARD_ID_MAP.get(cardId) || cardId
);

const starterDeckFor = (edition: PlacementTcgEdition) => {
  const editionCards = PLACEMENT_TCG_CARDS.filter(card => card.edition === edition);
  const units = editionCards.filter(card => card.kind === 'UNIT').slice(0, 10);
  const support = editionCards.filter(card => card.kind === 'SUPPORT').slice(0, 5);
  const events = editionCards.filter(card => card.kind === 'EVENT').slice(0, 5);
  const deck = [...units, ...support, ...events].map(card => card.id);
  const fallback = editionCards.map(card => card.id);
  for (let index = 0; deck.length < 20 && fallback.length > 0; index += 1) deck.push(fallback[index % fallback.length]);
  return deck.slice(0, 20);
};

export const PLACEMENT_TCG_EDITION_DECKS: Record<PlacementTcgEdition, string[]> = {
  ELEMENTARY: starterDeckFor('ELEMENTARY'),
  HIGH_SCHOOL: starterDeckFor('HIGH_SCHOOL'),
  MAGIC: starterDeckFor('MAGIC'),
};

export const PLACEMENT_TCG_STARTER_DECK = PLACEMENT_TCG_EDITION_DECKS.ELEMENTARY;

export const PLACEMENT_TCG_REWARD_POOL = PLACEMENT_TCG_CARDS
  .map(card => card.id);
