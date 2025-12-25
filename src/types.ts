
export enum CardType {
  ATTACK = 'ATTACK',
  SKILL = 'SKILL',
  POWER = 'POWER',
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
  upgradeDeck?: boolean; // New: Apotheosis
  fatalEnergy?: number;     
  fatalPermanentDamage?: number; 
  shuffleHandToDraw?: boolean;   
  doubleStrength?: boolean;      
  applyPower?: { id: string, amount: number }; 
  poisonMultiplier?: number; // New: Catalyst
  
  // Even More Advanced Effects
  damageBasedOnBlock?: boolean; 
  doubleBlock?: boolean;        
  fatalMaxHp?: number;
  innate?: boolean;
  
  // Special Mechanics
  capture?: boolean; // If fatal, adds enemy as card to deck
  textureRef?: string; // Seed/Name for generating PixelSprite on card
  
  // Next Turn Effects
  nextTurnEnergy?: number;
  nextTurnDraw?: number;          

  // Complex Interactions
  promptsDiscard?: number;      
  promptsCopy?: number;         
  promptsExhaust?: number;      
  damagePerAttackPlayed?: number; 
  damagePerCardInHand?: number;   
  damagePerStrike?: number;
  damagePerCardInDraw?: number; // New: Mind Blast
  playCopies?: number;            
  addCardToHand?: { cardName: string, count: number, cost0?: boolean }; 
  addCardToDraw?: { cardName: string, count: number }; 
  addCardToDiscard?: { cardName: string, count: number };
  
  playCondition?: 'DRAW_PILE_EMPTY' | 'HAND_ONLY_ATTACKS';

  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'SPECIAL';
  price?: number;       
}

export enum EnemyIntentType {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  UNKNOWN = 'UNKNOWN',
  ATTACK_DEBUFF = 'ATTACK_DEBUFF',
  ATTACK_DEFEND = 'ATTACK_DEFEND',
  SLEEP = 'SLEEP'
}

export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
  secondaryValue?: number; // For debuff amount or block amount in mixed moves
  debuffType?: 'WEAK' | 'VULNERABLE' | 'POISON' | 'CONFUSED'; // Added to specify debuff
}

export interface FloatingText {
    id: string; // Unique ID to trigger animation (e.g. timestamp)
    text: string;
    color: string; // Tailwind text color class
    iconType?: 'sword' | 'shield' | 'heart' | 'poison' | 'zap' | 'skull';
}

export interface Enemy {
  id: string;
  enemyType: string; // For AI Logic (eg. 'CULTIST', 'SLIME_ACID')
  name: string;
  maxHp: number;
  currentHp: number;
  block: number;
  nextIntent: EnemyIntent;
  strength: number;
  
  // Status Effects
  vulnerable: number; 
  weak: number;       
  poison: number;     
  artifact: number;   
  corpseExplosion: boolean; 
  
  floatingText: FloatingText | null;
  phase?: number; // ボスの形態管理用（追加）
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
    id: string; // Instance ID
    templateId: string;
    name: string;
    description: string;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'SHOP';
    price?: number;
    color: string; // Hex color for UI
}

export interface Character {
    id: string;
    name: string;
    description: string;
    maxHp: number;
    gold: number;
    startingRelicId: string;
    deckTemplate: string[];
    color: string; // Tailwind color class prefix (e.g. 'red', 'green')
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

export interface Player {
  id?: string; // Character identifier (e.g. 'MAGE')
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
  potions: Potion[]; // New: Max 3
  imageData: string;
  
  // Advanced State
  powers: Record<string, number>; 
  echoes: number; 
  cardsPlayedThisTurn: number; 
  attacksPlayedThisTurn: number;
  typesPlayedThisTurn: CardType[]; // New: For Orange Pellets etc.
  
  // Next Turn State
  nextTurnEnergy: number;
  nextTurnDraw: number;
  
  // Relic & Turn Counters
  relicCounters: Record<string, number>; // Persists across battles (e.g. Pen Nib)
  turnFlags: Record<string, boolean>;    // Resets each turn (e.g. Necronomicon)

  floatingText: FloatingText | null;
  
  // Dual Protagonist
  partner?: Partner;
}

export enum GameScreen {
  START_MENU = 'START_MENU',
  DEBUG_MENU = 'DEBUG_MENU', 
  MODE_SELECTION = 'MODE_SELECTION', 
  CHARACTER_SELECTION = 'CHARACTER_SELECTION',
  RELIC_SELECTION = 'RELIC_SELECTION', 
  MAP = 'MAP',
  BATTLE = 'BATTLE',
  DODGEBALL_SHOOTING = 'DODGEBALL_SHOOTING',
  MATH_CHALLENGE = 'MATH_CHALLENGE', 
  KANJI_CHALLENGE = 'KANJI_CHALLENGE',
  ENGLISH_CHALLENGE = 'ENGLISH_CHALLENGE',
  REWARD = 'REWARD',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  REST = 'REST',
  SHOP = 'SHOP',
  EVENT = 'EVENT',
  FINAL_BRIDGE = 'FINAL_BRIDGE', // ACT3終了後の決戦前イベント（追加）
  COMPENDIUM = 'COMPENDIUM',
  ENDING = 'ENDING',
  HELP = 'HELP',
  TREASURE = 'TREASURE',
  RANKING = 'RANKING',
  MINI_GAME_SELECT = 'MINI_GAME_SELECT', 
  MINI_GAME_POKER = 'MINI_GAME_POKER',
  MINI_GAME_SURVIVOR = 'MINI_GAME_SURVIVOR',
  MINI_GAME_DUNGEON = 'MINI_GAME_DUNGEON',
  MINI_GAME_DUNGEON_2 = 'MINI_GAME_DUNGEON_2',
  MINI_GAME_KOCHO = 'MINI_GAME_KOCHO',
  MINI_GAME_PAPER_PLANE = 'MINI_GAME_PAPER_PLANE'
}

export enum GameMode {
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
  MULTIPLICATION = 'MULTIPLICATION',
  DIVISION = 'DIVISION',
  MIXED = 'MIXED',
  KANJI_1 = 'KANJI_1', // 小1
  KANJI_2 = 'KANJI_2', // 小2
  KANJI_3 = 'KANJI_3', // 小3
  KANJI_4 = 'KANJI_4', // 小4
  KANJI_5 = 'KANJI_5', // 小5
  KANJI_6 = 'KANJI_6', // 小6
  KANJI_7 = 'KANJI_7', // 中1
  KANJI_8 = 'KANJI_8', // 中2
  KANJI_9 = 'KANJI_9',  // 中3
  KANJI_MIXED = 'KANJI_MIXED', // 全学年ミックス
  ENGLISH_ES = 'ENGLISH_ES', // 小学校
  ENGLISH_J1 = 'ENGLISH_J1', // 中1
  ENGLISH_J2 = 'ENGLISH_J2', // 中2
  ENGLISH_J3 = 'ENGLISH_J3', // 中3
  ENGLISH_MIXED = 'ENGLISH_MIXED', // 全ミックス
  ENGLISH_CONV_1 = 'ENGLISH_CONV_1', // 会話Lv1
  ENGLISH_CONV_2 = 'ENGLISH_CONV_2', // 会話Lv2
  ENGLISH_CONV_3 = 'ENGLISH_CONV_3', // 会話Lv3
  ENGLISH_CONV_4 = 'ENGLISH_CONV_4', // 会話Lv4
  ENGLISH_CONV_5 = 'ENGLISH_CONV_5'  // 会話Lv5
}

export type LanguageMode = 'JAPANESE' | 'HIRAGANA';

// --- Map Types ---
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

export interface RewardItem {
    type: 'CARD' | 'RELIC' | 'GOLD' | 'POTION';
    value?: any; // Card object, Relic object, Potion object, or number
    id: string;
}

export interface RankingEntry {
    id: string;
    playerName: string;
    characterName: string;
    score: number;
    act: number;
    floor: number;
    victory: boolean;
    date: number; // timestamp
    challengeMode?: string;
}

// --- Poker Mini Game Types ---
export type PokerSuit = 'SPADE' | 'HEART' | 'DIAMOND' | 'CLUB';
export type PokerRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 14 is Ace

export interface PokerCard {
  id: string;
  suit: PokerSuit;
  rank: PokerRank;
  isSelected: boolean;
  bonusChips: number;
  multMultiplier: number;
  enhancement?: 'BONUS' | 'MULT' | 'WILD' | 'STONE' | 'GLASS' | 'GOLD' | 'STEEL';
  edition?: 'FOIL' | 'HOLOGRAPHIC' | 'POLYCHROME'; // Visual effect & small bonus
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
  handsPlayed: number;
  discardsUsed: number;
  deckState: PokerCard[];
  money: number; // Added to calculate interest/jokers based on gold
  persistentCounters: Record<string, number>; // New: Track actions across runs
}

export interface PokerSupporter { // Joker
  id: string;
  name: string;
  description: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  price: number;
  effect: (ctx: PokerScoringContext) => void;
  getDynamicDescription?: (state: PokerRunState) => string; // Returns dynamic stats like "(Currently: +200)"
  icon: string;
  triggerOn?: 'HAND_PLAYED' | 'DISCARD' | 'HELD_IN_HAND' | 'PASSIVE';
  edition?: 'FOIL' | 'HOLOGRAPHIC' | 'POLYCHROME';
}

export interface PokerConsumable { // Tarot / Planet / Spectral
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
    size: number; // How many cards revealed
    choose: number; // How many to pick
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
    name: string; // e.g. "Small Blind", "Big Blind", "The Wall"
    scoreGoal: number;
    rewardMoney: number;
    bossAbility?: string; // Special effect for Boss Blinds
    description?: string;
}

export interface PokerRunState {
    deck: PokerCard[];
    money: number;
    ante: number;
    blindIndex: number; // 0=Small, 1=Big, 2=Boss
    currentBlind: PokerBlind;
    supporters: PokerSupporter[];
    consumables: PokerConsumable[];
    handLevels: Record<string, number>;
    vouchers: string[]; // IDs of bought vouchers
    isEndless?: boolean; // New: Endless Mode flag
    persistentCounters: Record<string, number>; // New: Track actions like "Cards Sold"
    handSizeModifier: number; // Track permanent hand size changes (e.g. Spectral)
    
    // Play state
    currentScore: number;
    handsRemaining: number;
    discardsRemaining: number;
    hand: PokerCard[];
    discardPile: PokerCard[]; // Add discardPile to track cards during blind
    
    // Shop state
    shopInventory: (PokerSupporter | PokerConsumable | PokerPack)[];
    shopVoucher: PokerVoucher | null; // The voucher available in the current shop
    voucherRestockedAnte: number; // Tracks when the voucher was last restocked (per Ante)
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
    timeSurvived: number; // seconds
    levelReached: number;
    weapons: string[]; // IDs of weapons
}

export interface DungeonScoreEntry {
    id: string;
    date: number;
    floor: number;
    level: number;
    score: number;
    reason: string; // "Cleared", "Starved", "Killed by X"
}

// New Score Types for additional mini-games
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
    rank: number; // Ascension/Difficulty level
    score: number; // Calculated score
}

export interface ParryState {
    active: boolean;
    enemyId: string | null;
    success: boolean;
}

export interface GameState {
  screen: GameScreen;
  mode: GameMode; 
  challengeMode?: string; // e.g. '1A1D'
  act: number;
  floor: number;
  turn: number;
  map: MapNode[];
  currentMapNodeId: string | null;
  player: Player;
  enemies: Enemy[];
  selectedEnemyId: string | null;
  narrativeLog: string[];
  combatLog: string[]; // New: Combat Log
  rewards: RewardItem[]; 
  selectionState: SelectionState; 
  isEndless?: boolean;
  pokerState?: PokerRunState; // Added: Auto-save state for Poker Mini Game
  codexOptions?: Card[]; // Added: For Nilry's Codex selection
  parryState?: ParryState; // New: Parry state for Bard
}
