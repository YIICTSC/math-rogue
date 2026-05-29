
export enum CardType {
  ATTACK = 'ATTACK',
  SKILL = 'SKILL',
  POWER = 'POWER',
  SUMMON = 'SUMMON',
  STATUS = 'STATUS',
  CURSE = 'CURSE'
}

export enum TargetType {
  ENEMY = 'ENEMY',
  SELF = 'SELF',
  ALL_ENEMIES = 'ALL_ENEMIES',
  RANDOM_ENEMY = 'RANDOM_ENEMY'
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  target?: TargetType;
  description: string;

  // Values
  damage?: number;
  block?: number;
  draw?: number;
  heal?: number;
  energy?: number;
  selfDamage?: number;
  poison?: number;
  gold?: number; // 追加: ゴールド獲得量
  addPotion?: boolean; // 追加: ポーション獲得フラグ
  blockMultiplier?: number; // 追加: ブロック倍率 (1.5倍など)

  // Basic Mechanics
  exhaust?: boolean;
  strength?: number;
  vulnerable?: number;
  weak?: number;
  upgraded?: boolean;
  unplayable?: boolean;

  // Advanced Effects
  strengthScaling?: number;
  lifesteal?: boolean;
  upgradeHand?: boolean;
  upgradeDeck?: boolean;
  fatalEnergy?: number;
  fatalPermanentDamage?: number;
  shuffleHandToDraw?: boolean;
  doubleStrength?: boolean;
  applyPower?: { id: string, amount: number };
  poisonMultiplier?: number;

  damageBasedOnBlock?: boolean;
  doubleBlock?: boolean;
  fatalMaxHp?: number;
  innate?: boolean;

  capture?: boolean;
  textureRef?: string;
  illustrationRefs?: string[];
  illustrationRefWriteIndex?: number;
  enemyIllustrationName?: string;
  enemyIllustrationNames?: string[];
  enemyIllustrationEnemyType?: string;
  enemyIllustrationPhase?: number;
  visualTheme?: 'elementary' | 'high-school';
  highSchoolCardArtIndex?: number;
  familiarSummon?: FamiliarSummonSpec;

  nextTurnEnergy?: number;
  nextTurnDraw?: number;

  promptsDiscard?: number;
  promptsCopy?: number;
  promptsExhaust?: number;
  damagePerAttackPlayed?: number;
  damagePerCardInHand?: number;
  damagePerStrike?: number;
  damagePerCardInDraw?: number;
  playCopies?: number;
  hitsPerSkillInHand?: number;
  hitsPerAttackPlayed?: number;
  addCardToHand?: { cardName: string, count: number, cost0?: boolean };
  addCardToDraw?: { cardName: string, count: number };
  addCardToDiscard?: { cardName: string, count: number };

  playCondition?: 'DRAW_PILE_EMPTY' | 'HAND_ONLY_ATTACKS';

  isSeed?: boolean;
  growthRequired?: number;
  grownCardId?: string;

  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'SPECIAL';
  price?: number;
  originalNames?: string[]; // 合成前のカード名を保持する (特殊効果継承用)

  battleBaseCost?: number;
  battleBaseDamage?: number;
  battleBaseBlock?: number;
  battleBaseDescription?: string;
  battleBaseExhaust?: boolean;
  battleBonusDrawOnPlay?: number;
  battleRestore?: Partial<Card>;
  eraserOnly?: boolean;
}

export type FamiliarTrigger =
  | 'ONCE_END_TURN'
  | 'END_TURN'
  | 'EVERY_OTHER_TURN'
  | 'LOW_HP_END_TURN'
  | 'NO_BLOCK_END_TURN';

export type FamiliarActionKind =
  | 'DAMAGE'
  | 'RANDOM_HITS'
  | 'AOE_DAMAGE'
  | 'BLOCK'
  | 'HEAL'
  | 'DRAW'
  | 'ENERGY_NEXT'
  | 'POISON'
  | 'AOE_POISON'
  | 'WEAK'
  | 'VULNERABLE'
  | 'STRENGTH'
  | 'GOLD'
  | 'CHAOS_SURGE';

export interface FamiliarEffect {
  kind: FamiliarActionKind;
  amount: number;
}

export interface FamiliarSummonSpec {
  id: string;
  name: string;
  hpCost: number;
  imageIndex: number;
  duration: number | 'BATTLE';
  trigger: FamiliarTrigger;
  effect: FamiliarEffect;
}

export interface ActiveFamiliar extends FamiliarSummonSpec {
  instanceId: string;
  turnsActive: number;
  used?: boolean;
  actionPulse?: number;
}

export enum EnemyIntentType {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  UNKNOWN = 'UNKNOWN',
  ATTACK_DEBUFF = 'ATTACK_DEBUFF',
  ATTACK_DEFEND = 'ATTACK_DEFEND',
  SLEEP = 'SLEEP',
  PIERCE_ATTACK = 'PIERCE_ATTACK'
}


export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
  secondaryValue?: number;
  debuffType?: 'WEAK' | 'VULNERABLE' | 'POISON' | 'CONFUSED';
}

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  iconType?: 'sword' | 'shield' | 'heart' | 'poison' | 'zap' | 'skull';
}

export interface Enemy {
  id: string;
  enemyType: string;
  name: string;
  maxHp: number;
  currentHp: number;
  block: number;
  nextIntent: EnemyIntent;
  strength: number;
  vulnerable: number;
  weak: number;
  poison: number;
  artifact: number;
  corpseExplosion: boolean;
  floatingText: FloatingText | null;
  familiars?: ActiveFamiliar[];
  sleepTurns?: number;
  phase?: number;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: 'STARTER' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'BOSS' | 'SHOP';
  price?: number;
  effectType?: 'START_BATTLE' | 'END_TURN' | 'END_BATTLE' | 'PASSIVE';
}

export interface Potion {
  id: string;
  templateId: string;
  name: string;
  description: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'SHOP';
  price?: number;
  color: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  gold: number;
  startingRelicId: string;
  deckTemplate: string[];
  color: string;
  imageData: string;
}

export interface Partner {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  imageData: string;
  floatingText: FloatingText | null;
}

export interface GardenSlot {
  plantedCard: Card | null;
  growth: number;
  maxGrowth: number;
}

export interface Player {
  id?: string;
  maxHp: number;
  currentHp: number;
  maxEnergy: number;
  currentEnergy: number;
  block: number;
  strength: number;
  gold: number;
  deck: Card[];
  hand: Card[];
  discardPile: Card[];
  drawPile: Card[];
  relics: Relic[];
  potions: Potion[];
  imageData: string;
  powers: Record<string, number>;
  echoes: number;
  cardsPlayedThisTurn: number;
  attacksPlayedThisTurn: number;
  typesPlayedThisTurn: CardType[];
  nextTurnEnergy: number;
  nextTurnDraw: number;
  relicCounters: Record<string, number>;
  turnFlags: Record<string, boolean>;
  floatingText: FloatingText | null;
  hpLostThisTurn?: number;
  partner?: Partner;
  garden?: GardenSlot[];
  codexBuffer?: Card[]; // 秘密の攻略本用
  familiarActionQueue?: ActiveFamiliar[];
}

export interface CoopBattlePlayerState {
  peerId: string;
  name: string;
  player: Player;
  selectedEnemyId?: string | null;
  isDown?: boolean;
}

export interface CoopBattleTurnSlot {
  id: string;
  type: 'SELF' | 'ALLY' | 'ENEMY';
  label: string;
  peerId?: string;
}

export interface CoopBattleState {
  battleKey: string;
  battleMode: 'TURN_BASED' | 'REALTIME';
  players: CoopBattlePlayerState[];
  turnQueue: CoopBattleTurnSlot[];
  turnCursor: number;
  enemyTurnCursor: number;
  roundEndedPeerIds?: string[];
}

export interface ActStats {
  enemiesDefeated: number;
  goldGained: number;
  mathCorrect: number;
}

export enum GameScreen {
  START_MENU = 'START_MENU',
  DEBUG_MENU = 'DEBUG_MENU',
  MODE_SELECTION = 'MODE_SELECTION',
  DIFFICULTY_SELECTION = 'DIFFICULTY_SELECTION',
  CHARACTER_SELECTION = 'CHARACTER_SELECTION',
  RELIC_SELECTION = 'RELIC_SELECTION',
  DECK_CONSTRUCTION = 'DECK_CONSTRUCTION',
  MAP = 'MAP',
  BATTLE = 'BATTLE',
  VS_SETUP = 'VS_SETUP',
  VS_BATTLE = 'VS_BATTLE',
  RACE_SETUP = 'RACE_SETUP',
  COOP_SETUP = 'COOP_SETUP',
  DODGEBALL_SHOOTING = 'DODGEBALL_SHOOTING',
  MATH_CHALLENGE = 'MATH_CHALLENGE',
  KANJI_CHALLENGE = 'KANJI_CHALLENGE',
  ENGLISH_CHALLENGE = 'ENGLISH_CHALLENGE',
  GENERAL_CHALLENGE = 'GENERAL_CHALLENGE', // 教科汎用クイズ用
  REWARD = 'REWARD',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  REST = 'REST',
  SHOP = 'SHOP',
  EVENT = 'EVENT',
  FINAL_BRIDGE = 'FINAL_BRIDGE',
  COMPENDIUM = 'COMPENDIUM',
  ENDING = 'ENDING',
  HELP = 'HELP',
  TREASURE = 'TREASURE',
  RANKING = 'RANKING',
  MINI_GAME_SELECT = 'MINI_GAME_SELECT',
  MINI_GAME_MODE_SELECTION = 'MINI_GAME_MODE_SELECTION',
  MINI_GAME_POKER = 'MINI_GAME_POKER',
  MINI_GAME_SURVIVOR = 'MINI_GAME_SURVIVOR',
  MINI_GAME_DUNGEON = 'MINI_GAME_DUNGEON',
  MINI_GAME_DUNGEON_2 = 'MINI_GAME_DUNGEON_2',
  MINI_GAME_KOCHO = 'MINI_GAME_KOCHO',
  MINI_GAME_PAPER_PLANE = 'MINI_GAME_PAPER_PLANE',
  MINI_GAME_GO_HOME = 'MINI_GAME_GO_HOME',
  PROBLEM_CHALLENGE = 'PROBLEM_CHALLENGE',
  TYPING_MODE_SELECTION = 'TYPING_MODE_SELECTION',
  GARDEN = 'GARDEN',
  FLOOR_RESULT = 'FLOOR_RESULT'
}

export enum GameMode {
  // 算数（動的生成）
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
  MULTIPLICATION = 'MULTIPLICATION',
  DIVISION = 'DIVISION',
  MIXED = 'MIXED',
  // 追加の基礎計算モード
  ADD_1DIGIT = 'ADD_1DIGIT',
  ADD_1DIGIT_CARRY = 'ADD_1DIGIT_CARRY',
  SUB_1DIGIT = 'SUB_1DIGIT',
  SUB_1DIGIT_BORROW = 'SUB_1DIGIT_BORROW',

  // 算数・数学（静的データ）
  MATH_G1_1 = 'MATH_G1_1', MATH_G1_2 = 'MATH_G1_2', MATH_G1_3 = 'MATH_G1_3',
  MATH_G2_1 = 'MATH_G2_1', MATH_G2_2 = 'MATH_G2_2', MATH_G2_3 = 'MATH_G2_3',
  MATH_G3_1 = 'MATH_G3_1', MATH_G3_2 = 'MATH_G3_2', MATH_G3_3 = 'MATH_G3_3',
  MATH_G4_1 = 'MATH_G4_1', MATH_G4_2 = 'MATH_G4_2', MATH_G4_3 = 'MATH_G4_3',
  MATH_G5_1 = 'MATH_G5_1', MATH_G5_2 = 'MATH_G5_2', MATH_G5_3 = 'MATH_G5_3',
  MATH_G6_1 = 'MATH_G6_1', MATH_G6_2 = 'MATH_G6_2', MATH_G6_3 = 'MATH_G6_3',
  MATH_G7_1 = 'MATH_G7_1', MATH_G7_2 = 'MATH_G7_2', MATH_G7_3 = 'MATH_G7_3',
  MATH_G8_1 = 'MATH_G8_1', MATH_G8_2 = 'MATH_G8_2', MATH_G8_3 = 'MATH_G8_3',
  MATH_G9_1 = 'MATH_G9_1', MATH_G9_2 = 'MATH_G9_2', MATH_G9_3 = 'MATH_G9_3',

  // 国語
  KOKUGO_G1_1 = 'KOKUGO_G1_1', KOKUGO_G2_1 = 'KOKUGO_G2_1', KOKUGO_G3_1 = 'KOKUGO_G3_1',
  KOKUGO_G4_1 = 'KOKUGO_G4_1', KOKUGO_G5_1 = 'KOKUGO_G5_1', KOKUGO_G6_1 = 'KOKUGO_G6_1',
  KOKUGO_G7_1 = 'KOKUGO_G7_1', KOKUGO_G8_1 = 'KOKUGO_G8_1', KOKUGO_G9_1 = 'KOKUGO_G9_1',

  // 漢字
  KANJI_1 = 'KANJI_1', KANJI_2 = 'KANJI_2', KANJI_3 = 'KANJI_3',
  KANJI_4 = 'KANJI_4', KANJI_5 = 'KANJI_5', KANJI_6 = 'KANJI_6',
  KANJI_7 = 'KANJI_7', KANJI_8 = 'KANJI_8', KANJI_9 = 'KANJI_9',
  KANJI_10 = 'KANJI_10', KANJI_11 = 'KANJI_11', KANJI_12 = 'KANJI_12',
  KANJI_MIXED = 'KANJI_MIXED',
  KANKEN_10 = 'KANKEN_10', KANKEN_9 = 'KANKEN_9', KANKEN_8 = 'KANKEN_8',
  KANKEN_7 = 'KANKEN_7', KANKEN_6 = 'KANKEN_6', KANKEN_5 = 'KANKEN_5',
  KANKEN_4 = 'KANKEN_4', KANKEN_3 = 'KANKEN_3', KANKEN_PRE2 = 'KANKEN_PRE2',
  KANKEN_2 = 'KANKEN_2', KANKEN_PRE1 = 'KANKEN_PRE1', KANKEN_1 = 'KANKEN_1',
  KANKEN_MIXED = 'KANKEN_MIXED',
  HARD_KANJI_JUKUJIKUN = 'HARD_KANJI_JUKUJIKUN',
  HARD_KANJI_FLORA_FAUNA = 'HARD_KANJI_FLORA_FAUNA',
  HARD_KANJI_ATEJI = 'HARD_KANJI_ATEJI',
  HARD_KANJI_PLACE_NAMES = 'HARD_KANJI_PLACE_NAMES',
  HARD_KANJI_KOKUJI = 'HARD_KANJI_KOKUJI',
  HARD_KANJI_CLASSICS = 'HARD_KANJI_CLASSICS',
  HARD_KANJI_YOJUKUGO = 'HARD_KANJI_YOJUKUGO',
  HARD_KANJI_HISTORY = 'HARD_KANJI_HISTORY',
  HARD_KANJI_MIXED = 'HARD_KANJI_MIXED',
  UPPER_MODERN_VOCAB = 'UPPER_MODERN_VOCAB',
  UPPER_CLASSICS = 'UPPER_CLASSICS',
  UPPER_ENGLISH = 'UPPER_ENGLISH',
  UPPER_INFORMATION = 'UPPER_INFORMATION',
  UPPER_TRIVIA = 'UPPER_TRIVIA',
  UPPER_MATH_NUM_EXPR = 'UPPER_MATH_NUM_EXPR',
  UPPER_MATH_QUADRATIC = 'UPPER_MATH_QUADRATIC',
  UPPER_MATH_GEOMETRY = 'UPPER_MATH_GEOMETRY',
  UPPER_MATH_PROB_STATS = 'UPPER_MATH_PROB_STATS',
  UPPER_SCIENCE_PHYSICS = 'UPPER_SCIENCE_PHYSICS',
  UPPER_SCIENCE_CHEMISTRY = 'UPPER_SCIENCE_CHEMISTRY',
  UPPER_SCIENCE_BIOLOGY = 'UPPER_SCIENCE_BIOLOGY',
  UPPER_SCIENCE_EARTH = 'UPPER_SCIENCE_EARTH',
  UPPER_SOCIETY_JAPAN_HISTORY = 'UPPER_SOCIETY_JAPAN_HISTORY',
  UPPER_SOCIETY_WORLD_HISTORY = 'UPPER_SOCIETY_WORLD_HISTORY',
  UPPER_SOCIETY_GEOGRAPHY = 'UPPER_SOCIETY_GEOGRAPHY',
  UPPER_SOCIETY_CIVICS = 'UPPER_SOCIETY_CIVICS',
  UPPER_ESSAY_VOCAB = 'UPPER_ESSAY_VOCAB',
  UPPER_ESSAY_LOGIC = 'UPPER_ESSAY_LOGIC',
  UPPER_ESSAY_DATA_READING = 'UPPER_ESSAY_DATA_READING',
  UPPER_ESSAY_RESEARCH = 'UPPER_ESSAY_RESEARCH',
  UPPER_PRACTICAL_MONEY = 'UPPER_PRACTICAL_MONEY',
  UPPER_PRACTICAL_LAW = 'UPPER_PRACTICAL_LAW',
  UPPER_PRACTICAL_HEALTH = 'UPPER_PRACTICAL_HEALTH',
  UPPER_PRACTICAL_SAFETY = 'UPPER_PRACTICAL_SAFETY',
  UPPER_MATH_TRIGONOMETRY = 'UPPER_MATH_TRIGONOMETRY',
  UPPER_MATH_SEQUENCE = 'UPPER_MATH_SEQUENCE',
  UPPER_MATH_VECTOR = 'UPPER_MATH_VECTOR',
  UPPER_MATH_CALCULUS = 'UPPER_MATH_CALCULUS',
  UPPER_SCIENCE_MECHANICS = 'UPPER_SCIENCE_MECHANICS',
  UPPER_SCIENCE_ELECTROMAGNETISM = 'UPPER_SCIENCE_ELECTROMAGNETISM',
  UPPER_SCIENCE_ORGANIC = 'UPPER_SCIENCE_ORGANIC',
  UPPER_SCIENCE_GENETICS = 'UPPER_SCIENCE_GENETICS',
  UPPER_SOCIETY_MODERN_JAPAN = 'UPPER_SOCIETY_MODERN_JAPAN',
  UPPER_SOCIETY_MODERN_WORLD = 'UPPER_SOCIETY_MODERN_WORLD',
  UPPER_SOCIETY_GIS_MAP = 'UPPER_SOCIETY_GIS_MAP',
  UPPER_SOCIETY_ETHICS_PUBLIC = 'UPPER_SOCIETY_ETHICS_PUBLIC',
  UPPER_ESSAY_ISSUE_FINDING = 'UPPER_ESSAY_ISSUE_FINDING',
  UPPER_ESSAY_DATA_ANALYSIS = 'UPPER_ESSAY_DATA_ANALYSIS',
  UPPER_ESSAY_PRESENTATION = 'UPPER_ESSAY_PRESENTATION',
  UPPER_ESSAY_REPORT_WRITING = 'UPPER_ESSAY_REPORT_WRITING',
  UPPER_PRACTICAL_TAX_SOCIAL = 'UPPER_PRACTICAL_TAX_SOCIAL',
  UPPER_PRACTICAL_WORK_CAREER = 'UPPER_PRACTICAL_WORK_CAREER',
  UPPER_PRACTICAL_HOUSING_CONTRACT = 'UPPER_PRACTICAL_HOUSING_CONTRACT',
  UPPER_PRACTICAL_NET_SAFETY = 'UPPER_PRACTICAL_NET_SAFETY',
  UPPER_MATH_EXP_LOG = 'UPPER_MATH_EXP_LOG',
  UPPER_MATH_COMPLEX = 'UPPER_MATH_COMPLEX',
  UPPER_MATH_ADV_PROB = 'UPPER_MATH_ADV_PROB',
  UPPER_MATH_STAT_INFERENCE = 'UPPER_MATH_STAT_INFERENCE',
  UPPER_MATH_MATH_HISTORY = 'UPPER_MATH_MATH_HISTORY',
  UPPER_SCIENCE_ENVIRONMENT = 'UPPER_SCIENCE_ENVIRONMENT',
  UPPER_SCIENCE_ASTRONOMY = 'UPPER_SCIENCE_ASTRONOMY',
  UPPER_SCIENCE_LAB = 'UPPER_SCIENCE_LAB',
  UPPER_SCIENCE_MEDICAL = 'UPPER_SCIENCE_MEDICAL',
  UPPER_SCIENCE_ENGINEERING = 'UPPER_SCIENCE_ENGINEERING',
  UPPER_SOCIETY_LAW_RIGHTS = 'UPPER_SOCIETY_LAW_RIGHTS',
  UPPER_SOCIETY_ECONOMICS_ADV = 'UPPER_SOCIETY_ECONOMICS_ADV',
  UPPER_SOCIETY_INTL_RELATIONS = 'UPPER_SOCIETY_INTL_RELATIONS',
  UPPER_SOCIETY_REGIONAL_STUDIES = 'UPPER_SOCIETY_REGIONAL_STUDIES',
  UPPER_SOCIETY_CURRENT_AFFAIRS = 'UPPER_SOCIETY_CURRENT_AFFAIRS',
  UPPER_ESSAY_DEBATE = 'UPPER_ESSAY_DEBATE',
  UPPER_ESSAY_DESIGN_THINKING = 'UPPER_ESSAY_DESIGN_THINKING',
  UPPER_ESSAY_MEDIA_LITERACY = 'UPPER_ESSAY_MEDIA_LITERACY',
  UPPER_ESSAY_ACADEMIC_WORDS = 'UPPER_ESSAY_ACADEMIC_WORDS',
  UPPER_ESSAY_INTERVIEW_FIELD = 'UPPER_ESSAY_INTERVIEW_FIELD',
  UPPER_PRACTICAL_COOK_NUTRITION = 'UPPER_PRACTICAL_COOK_NUTRITION',
  UPPER_PRACTICAL_COMMUNICATION = 'UPPER_PRACTICAL_COMMUNICATION',
  UPPER_PRACTICAL_DIGITAL_PRODUCTIVITY = 'UPPER_PRACTICAL_DIGITAL_PRODUCTIVITY',
  UPPER_PRACTICAL_CHILD_WELFARE = 'UPPER_PRACTICAL_CHILD_WELFARE',
  UPPER_PRACTICAL_ENTREPRENEURSHIP = 'UPPER_PRACTICAL_ENTREPRENEURSHIP',
  UPPER_MATH_DERIVATIVE_APP = 'UPPER_MATH_DERIVATIVE_APP',
  UPPER_MATH_INTEGRAL_APP = 'UPPER_MATH_INTEGRAL_APP',
  UPPER_MATH_PROOF_ADV = 'UPPER_MATH_PROOF_ADV',
  UPPER_MATH_FUNCTION_MIX = 'UPPER_MATH_FUNCTION_MIX',
  UPPER_MATH_DATA_SCIENCE = 'UPPER_MATH_DATA_SCIENCE',
  UPPER_SCIENCE_ATOMIC_QUANTUM = 'UPPER_SCIENCE_ATOMIC_QUANTUM',
  UPPER_SCIENCE_MATERIALS = 'UPPER_SCIENCE_MATERIALS',
  UPPER_SCIENCE_FOOD = 'UPPER_SCIENCE_FOOD',
  UPPER_SCIENCE_OCEAN = 'UPPER_SCIENCE_OCEAN',
  UPPER_SCIENCE_DISASTER = 'UPPER_SCIENCE_DISASTER',
  UPPER_SOCIETY_WORLD_GEO_ADV = 'UPPER_SOCIETY_WORLD_GEO_ADV',
  UPPER_SOCIETY_JAPAN_POLITICS = 'UPPER_SOCIETY_JAPAN_POLITICS',
  UPPER_SOCIETY_LOCAL_GOV = 'UPPER_SOCIETY_LOCAL_GOV',
  UPPER_SOCIETY_MEDIA_SOCIAL = 'UPPER_SOCIETY_MEDIA_SOCIAL',
  UPPER_SOCIETY_ENV_POLICY = 'UPPER_SOCIETY_ENV_POLICY',
  UPPER_ESSAY_LOGIC_PUZZLE = 'UPPER_ESSAY_LOGIC_PUZZLE',
  UPPER_ESSAY_BOOK_READING = 'UPPER_ESSAY_BOOK_READING',
  UPPER_ESSAY_SUMMARY = 'UPPER_ESSAY_SUMMARY',
  UPPER_ESSAY_COMPARATIVE_CULTURE = 'UPPER_ESSAY_COMPARATIVE_CULTURE',
  UPPER_ESSAY_PROJECT_MANAGEMENT = 'UPPER_ESSAY_PROJECT_MANAGEMENT',
  UPPER_PRACTICAL_BUDGET_ADV = 'UPPER_PRACTICAL_BUDGET_ADV',
  UPPER_PRACTICAL_INVESTMENT = 'UPPER_PRACTICAL_INVESTMENT',
  UPPER_PRACTICAL_TRAVEL_TRANSPORT = 'UPPER_PRACTICAL_TRAVEL_TRANSPORT',
  UPPER_PRACTICAL_CEREMONY_MANNERS = 'UPPER_PRACTICAL_CEREMONY_MANNERS',
  UPPER_PRACTICAL_CARE_NURSING = 'UPPER_PRACTICAL_CARE_NURSING',
  UPPER_MATH_LINEAR_ALGEBRA = 'UPPER_MATH_LINEAR_ALGEBRA',
  UPPER_MATH_ANALYTIC_GEOMETRY = 'UPPER_MATH_ANALYTIC_GEOMETRY',
  UPPER_MATH_OPTIMIZATION = 'UPPER_MATH_OPTIMIZATION',
  UPPER_MATH_DISCRETE = 'UPPER_MATH_DISCRETE',
  UPPER_MATH_FINANCE = 'UPPER_MATH_FINANCE',
  UPPER_SCIENCE_THERMODYNAMICS = 'UPPER_SCIENCE_THERMODYNAMICS',
  UPPER_SCIENCE_WAVES_OPTICS = 'UPPER_SCIENCE_WAVES_OPTICS',
  UPPER_SCIENCE_INORGANIC = 'UPPER_SCIENCE_INORGANIC',
  UPPER_SCIENCE_ECOLOGY_ADV = 'UPPER_SCIENCE_ECOLOGY_ADV',
  UPPER_SCIENCE_GEO_WEATHER = 'UPPER_SCIENCE_GEO_WEATHER',
  UPPER_SOCIETY_ANCIENT_WORLD = 'UPPER_SOCIETY_ANCIENT_WORLD',
  UPPER_SOCIETY_MEDIEVAL_WORLD = 'UPPER_SOCIETY_MEDIEVAL_WORLD',
  UPPER_SOCIETY_CULTURE_HISTORY = 'UPPER_SOCIETY_CULTURE_HISTORY',
  UPPER_SOCIETY_POLITICAL_THOUGHT = 'UPPER_SOCIETY_POLITICAL_THOUGHT',
  UPPER_SOCIETY_JAPAN_GEOGRAPHY = 'UPPER_SOCIETY_JAPAN_GEOGRAPHY',
  UPPER_ESSAY_CREATIVE_WRITING = 'UPPER_ESSAY_CREATIVE_WRITING',
  UPPER_ESSAY_POLICY_PROPOSAL = 'UPPER_ESSAY_POLICY_PROPOSAL',
  UPPER_ESSAY_SOURCE_CRITIQUE = 'UPPER_ESSAY_SOURCE_CRITIQUE',
  UPPER_ESSAY_CAREER_ADMISSION = 'UPPER_ESSAY_CAREER_ADMISSION',
  UPPER_ESSAY_STATEMENT_LOGIC = 'UPPER_ESSAY_STATEMENT_LOGIC',
  UPPER_PRACTICAL_TIME_MANAGEMENT = 'UPPER_PRACTICAL_TIME_MANAGEMENT',
  UPPER_PRACTICAL_EMERGENCY_FIRSTAID = 'UPPER_PRACTICAL_EMERGENCY_FIRSTAID',
  UPPER_PRACTICAL_CONSUMER_TROUBLE = 'UPPER_PRACTICAL_CONSUMER_TROUBLE',
  UPPER_PRACTICAL_PUBLIC_SERVICES = 'UPPER_PRACTICAL_PUBLIC_SERVICES',
  UPPER_PRACTICAL_RELATIONSHIP = 'UPPER_PRACTICAL_RELATIONSHIP',
  // 英語
  ENGLISH_ES = 'ENGLISH_ES',
  ENGLISH_J1 = 'ENGLISH_J1', ENGLISH_J2 = 'ENGLISH_J2', ENGLISH_J3 = 'ENGLISH_J3',
  ENGLISH_MIXED = 'ENGLISH_MIXED',
  ENGLISH_CONV_1 = 'ENGLISH_CONV_1', ENGLISH_CONV_2 = 'ENGLISH_CONV_2', ENGLISH_CONV_3 = 'ENGLISH_CONV_3',
  ENGLISH_CONV_4 = 'ENGLISH_CONV_4', ENGLISH_CONV_5 = 'ENGLISH_CONV_5',
  ENGLISH_G3_1 = 'ENGLISH_G3_1',
  ENGLISH_G4_1 = 'ENGLISH_G4_1',
  ENGLISH_G5_1 = 'ENGLISH_G5_1',
  ENGLISH_G6_1 = 'ENGLISH_G6_1',
  ENGLISH_G7_1 = 'ENGLISH_G7_1',
  ENGLISH_G8_1 = 'ENGLISH_G8_1',
  ENGLISH_G9_1 = 'ENGLISH_G9_1',

  // 生活 (小1-2)
  LIFE_1_1 = 'LIFE_1_1', LIFE_1_2 = 'LIFE_1_2', LIFE_1_3 = 'LIFE_1_3',
  LIFE_2_1 = 'LIFE_2_1', LIFE_2_2 = 'LIFE_2_2', LIFE_2_3 = 'LIFE_2_3',

  // 理科 (小3-6)
  SCIENCE_3_1 = 'SCIENCE_3_1', SCIENCE_3_2 = 'SCIENCE_3_2', SCIENCE_3_3 = 'SCIENCE_3_3',
  SCIENCE_4_1 = 'SCIENCE_4_1', SCIENCE_4_2 = 'SCIENCE_4_2', SCIENCE_4_3 = 'SCIENCE_4_3',
  SCIENCE_5_1 = 'SCIENCE_5_1', SCIENCE_5_2 = 'SCIENCE_5_2', SCIENCE_5_3 = 'SCIENCE_5_3',
  SCIENCE_6_1 = 'SCIENCE_6_1', SCIENCE_6_2 = 'SCIENCE_6_2', SCIENCE_6_3 = 'SCIENCE_6_3',

  // 理科 (中1-3)
  SCIENCE_7_1 = 'SCIENCE_7_1', SCIENCE_7_2 = 'SCIENCE_7_2', SCIENCE_7_3 = 'SCIENCE_7_3',
  SCIENCE_8_1 = 'SCIENCE_8_1', SCIENCE_8_2 = 'SCIENCE_8_2', SCIENCE_8_3 = 'SCIENCE_8_3',
  SCIENCE_9_1 = 'SCIENCE_9_1', SCIENCE_9_2 = 'SCIENCE_9_2', SCIENCE_9_3 = 'SCIENCE_9_3',

  // 社会 (小3-6)
  SOCIAL_3_1 = 'SOCIAL_3_1', SOCIAL_3_2 = 'SOCIAL_3_2', SOCIAL_3_3 = 'SOCIAL_3_3',
  SOCIAL_4_1 = 'SOCIAL_4_1', SOCIAL_4_2 = 'SOCIAL_4_2', SOCIAL_4_3 = 'SOCIAL_4_3',
  SOCIAL_5_1 = 'SOCIAL_5_1', SOCIAL_5_2 = 'SOCIAL_5_2', SOCIAL_5_3 = 'SOCIAL_5_3',
  SOCIAL_6_1 = 'SOCIAL_6_1', SOCIAL_6_2 = 'SOCIAL_6_2', SOCIAL_6_3 = 'SOCIAL_6_3',

  // 社会 (中1-3)
  SOCIAL_7_1 = 'SOCIAL_7_1', SOCIAL_7_2 = 'SOCIAL_7_2', SOCIAL_7_3 = 'SOCIAL_7_3',
  SOCIAL_8_1 = 'SOCIAL_8_1', SOCIAL_8_2 = 'SOCIAL_8_2', SOCIAL_8_3 = 'SOCIAL_8_3',
  SOCIAL_9_1 = 'SOCIAL_9_1', SOCIAL_9_2 = 'SOCIAL_9_2', SOCIAL_9_3 = 'SOCIAL_9_3',

  // 地理・歴史・公民 (中1-3) - Legacy/Generic
  GEOGRAPHY_1 = 'GEOGRAPHY_1', GEOGRAPHY_2 = 'GEOGRAPHY_2', GEOGRAPHY_3 = 'GEOGRAPHY_3',
  HISTORY_1 = 'HISTORY_1', HISTORY_2 = 'HISTORY_2', HISTORY_3 = 'HISTORY_3',
  CIVICS_1 = 'CIVICS_1', CIVICS_2 = 'CIVICS_2', CIVICS_3 = 'CIVICS_3',

  // 地図・都道府県
  MAP_SYMBOLS = 'MAP_SYMBOLS',
  PREFECTURES = 'PREFECTURES',
  PREF_CAPITALS = 'PREF_CAPITALS',

  // ICT・情報
  IT_WINDOWS = 'IT_WINDOWS',
  IT_IPAD = 'IT_IPAD',
  IT_CHROMEBOOK = 'IT_CHROMEBOOK',
  IT_INTERNET = 'IT_INTERNET',
  IT_LITERACY = 'IT_LITERACY',
  IT_PROGRAMMING = 'IT_PROGRAMMING',
  IT_SECURITY = 'IT_SECURITY'
}

export type LanguageMode = 'JAPANESE' | 'HIRAGANA' | 'ENGLISH';
export type AnswerMode = 'CHOICE' | 'INPUT';

export enum NodeType {
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  REST = 'REST',
  SHOP = 'SHOP',
  EVENT = 'EVENT',
  BOSS = 'BOSS',
  START = 'START',
  TREASURE = 'TREASURE'
}

export interface MapNode {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  nextNodes: string[];
  completed: boolean;
}

export interface SelectionState {
  active: boolean;
  type: 'DISCARD' | 'COPY' | 'EXHAUST';
  amount: number;
  originCardId?: string;
}

export type RaceTrickEffectId =
  | 'LATE_DAMAGE'
  | 'RETEST_DAMAGE'
  | 'WALLET_SWAP'
  | 'GOLD_SIPHON'
  | 'SHOP_MARKUP'
  | 'PAPER_STORM'
  | 'CHALK_DUST'
  | 'DESK_SHAKE'
  | 'UPSIDE_DOWN_NOTES'
  | 'SLEEPY_VIGNETTE'
  | 'SLOW_BELL'
  | 'SCORE_MIST'
  | 'FAKE_SIGNBOARD'
  | 'DETENTION_TAX'
  | 'SLEEP_GLASSES'
  | 'BLACKBOARD_SMOKE'
  | 'POP_QUIZ_HURRY'
  | 'PRINT_AVALANCHE'
  | 'SHOE_LACE'
  | 'FORGOTTEN_HOMEWORK';

export type CoopSupportEffectId =
  | 'ALLY_HEAL'
  | 'ALLY_BLOCK'
  | 'ALLY_NEXT_ENERGY'
  | 'ALLY_DRAW'
  | 'ALLY_ATTACK_BOOST'
  | 'ALLY_BUFFER'
  | 'TEAM_CLEANSE'
  | 'TEAM_HEAL'
  | 'REVIVE_BANDAGE'
  | 'REVIVE_NURSE';

export interface RaceTrickCard {
  id: string;
  effectId: RaceTrickEffectId;
  name: string;
  description: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE';
}

export interface CoopSupportCard {
  id: string;
  effectId: CoopSupportEffectId;
  name: string;
  description: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE';
}

export interface RewardItem {
  type: 'CARD' | 'RELIC' | 'GOLD' | 'POTION' | 'RACE_TRICK' | 'COOP_SUPPORT';
  value?: any;
  id: string;
}

export interface CoopTreasurePool {
  id: string;
  rewards: RewardItem[];
  claimedByPeerId?: string | null;
  claimedByName?: string | null;
}

export interface RankingEntry {
  id: string;
  playerName: string;
  characterName: string;
  score: number;
  act: number;
  floor: number;
  victory: boolean;
  date: number;
  challengeMode?: string;
}

export interface VSRecord {
  id: string;
  date: number;
  opponentName: string;
  playerCharName: string;
  opponentCharName: string;
  victory: boolean;
  turns: number;
}

export type PokerSuit = 'SPADE' | 'HEART' | 'DIAMOND' | 'CLUB';
export type PokerRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface PokerCard {
  id: string;
  suit: PokerSuit;
  rank: PokerRank;
  isSelected: boolean;
  bonusChips: number;
  multMultiplier: number;
  enhancement?: 'BONUS' | 'MULT' | 'WILD' | 'STONE' | 'GLASS' | 'GOLD' | 'STEEL';
  edition?: 'FOIL' | 'HOLOGRAPHIC' | 'POLYCHROME';
}

export interface PokerHandResult {
  name: string;
  baseChips: number;
  baseMult: number;
  level: number;
}

export interface PokerScoringContext {
  chips: number;
  mult: number;
  handType: string;
  cards: PokerCard[];
  handCards: PokerCard[];
  handsPlayed: number;
  handsRemaining: number;
  discardsUsed: number;
  discardsRemaining: number;
  consumablesCount: number;
  moneyDelta: number;
  deckState: PokerCard[];
  money: number;
  persistentCounters: Record<string, number>;
}

export interface PokerSupporter {
  id: string;
  name: string;
  description: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  price: number;
  effect: (ctx: PokerScoringContext) => void;
  getDynamicDescription?: (state: PokerRunState) => string;
  icon: string;
  triggerOn?: 'HAND_PLAYED' | 'DISCARD' | 'HELD_IN_HAND' | 'PASSIVE';
  edition?: 'FOIL' | 'HOLOGRAPHIC' | 'POLYCHROME';
}

export interface PokerConsumable {
  id: string;
  type: 'TAROT' | 'PLANET' | 'SPECTRAL';
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface PokerPack {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'STANDARD' | 'BUFF' | 'SUPPORTER' | 'SPECTRAL';
  size: number;
  choose: number;
  icon: string;
}

export interface PokerVoucher {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface PokerBlind {
  name: string;
  rivalId?: string;
  rivalName?: string;
  scoreGoal: number;
  rewardMoney: number;
  bossAbility?: string;
  description?: string;
}

export interface PokerRunState {
  deck: PokerCard[];
  money: number;
  ante: number;
  blindIndex: number;
  currentBlind: PokerBlind;
  supporters: PokerSupporter[];
  consumables: PokerConsumable[];
  handLevels: Record<string, number>;
  vouchers: string[];
  isEndless?: boolean;
  persistentCounters: Record<string, number>;
  handSizeModifier: number;
  currentScore: number;
  handsRemaining: number;
  discardsRemaining: number;
  hand: PokerCard[];
  discardPile: PokerCard[];
  lastHandTypePlayed?: string;
  shopInventory: (PokerSupporter | PokerConsumable | PokerPack)[];
  shopVoucher: PokerVoucher | null;
  voucherRestockedAnte: number;
}

export interface PokerScoreEntry {
  id: string;
  date: number;
  ante: number;
  money: number;
  bestHandScore: number;
}

export interface SurvivorScoreEntry {
  id: string;
  date: number;
  score: number;
  timeSurvived: number;
  levelReached: number;
  weapons: string[];
}

export interface DungeonScoreEntry {
  id: string;
  date: number;
  floor: number;
  level: number;
  score: number;
  reason: string;
}

export interface KochoScoreEntry {
  id: string;
  date: number;
  stage: number;
  victory: boolean;
  turns: number;
}

export interface PaperPlaneScoreEntry {
  id: string;
  date: number;
  stage: number;
  rank: number;
  score: number;
}

export interface GoHomeScoreEntry {
  id: string;
  date: number;
  score: number;
  level: number;
  distance: number;
}

export interface ParryState {
  active: boolean;
  enemyId: string | null;
  success: boolean;
  windowStartedAt?: number;
  windowMs?: number;
  result?: 'perfect' | 'good' | 'miss';
}

export type AttackEffectKey = 'slash' | 'impact' | 'projectile' | 'fire' | 'lightning' | 'poison' | 'shockwave' | 'multihit' | 'drain' | 'finisher' | 'laser' | 'soundwave' | 'wind' | 'plant' | 'graduation' | 'explosion' | 'critical' | 'flash';
export type StatusEffectKey = 'block' | 'heal' | 'buff' | 'strength' | 'debuff' | 'weak' | 'vulnerable' | 'poison';

export type VFXType = 'SLASH' | 'BLOCK' | 'BUFF' | 'DEBUFF' | 'HEAL' | 'FIRE' | 'EXPLOSION' | 'LIGHTNING' | 'CRITICAL' | 'SHOCKWAVE' | 'FLASH' | 'ATTACK_SPRITE';

export interface VisualEffectInstance {
  id: string;
  type: VFXType;
  targetId: string;
  ownerPeerId?: string;
  x?: number;
  y?: number;
  delay?: number;
  rotation?: number;
  attackEffectKey?: AttackEffectKey;
  attackEffectFrame?: number;
  statusEffectKey?: StatusEffectKey;
}

export interface GameState {
  screen: GameScreen;
  mode: GameMode;
  visualTheme?: 'elementary' | 'high-school';
  modePool?: string[];
  answerMode?: AnswerMode;
  difficultyLevel?: number;
  shopRemoveCount?: number;
  challengeMode?: string;
  typingLessonId?: string;
  act: number;
  floor: number;
  turn: number;
  map: MapNode[];
  currentMapNodeId: string | null;
  player: Player;
  enemies: Enemy[];
  selectedEnemyId: string | null;
  narrativeLog: string[];
  combatLog: string[];
  rewards: RewardItem[];
  selectionState: SelectionState;
  isEndless?: boolean;
  pokerState?: PokerRunState;
  codexOptions?: Card[];
  parryState?: ParryState;
  activeEffects: VisualEffectInstance[];
  vsOpponent?: Player; // 対戦相手のデータ
  vsIsHost?: boolean; // P2P対戦でホストかどうか
  currentStoryIndex?: number;
  actStats?: ActStats;
  currentEventTitle?: string;
  newlyUnlockedCardName?: string; // 追加: このアクトで解放されたカード
  coopBattleState?: CoopBattleState | null;
}

export interface CoopSharedState {
  screen: GameScreen;
  mode: GameMode;
  visualTheme?: 'elementary' | 'high-school';
  modePool?: string[];
  answerMode?: AnswerMode;
  difficultyLevel?: number;
  shopRemoveCount?: number;
  challengeMode?: string;
  typingLessonId?: string;
  act: number;
  floor: number;
  turn: number;
  map: MapNode[];
  currentMapNodeId: string | null;
  enemies: Enemy[];
  selectedEnemyId: string | null;
  narrativeLog: string[];
  combatLog: string[];
  selectionState: SelectionState;
  isEndless?: boolean;
  parryState?: ParryState;
  activeEffects: VisualEffectInstance[];
  currentStoryIndex?: number;
  actStats?: ActStats;
  currentEventTitle?: string;
  newlyUnlockedCardName?: string;
  coopBattleState?: CoopBattleState | null;
}
