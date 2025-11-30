

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
  playCopies?: number;            
  addCardToHand?: { cardName: string, count: number, cost0?: boolean }; 
  addCardToDraw?: { cardName: string, count: number }; 
  
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
  debuffType?: 'WEAK' | 'VULNERABLE' | 'POISON'; // Added to specify debuff
}

export interface FloatingText {
    id: string; // Unique ID to trigger animation (e.g. timestamp)
    text: string;
    color: string; // Tailwind text color class
    iconType?: 'sword' | 'shield' | 'heart' | 'poison' | 'zap';
}

export interface Enemy {
  id: string;
  enemyType: string; // For AI Logic (e.g., 'CULTIST', 'SLIME_ACID')
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

export interface Player {
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
  
  // Next Turn State
  nextTurnEnergy: number;
  nextTurnDraw: number;
  
  // Relic & Turn Counters
  relicCounters: Record<string, number>; // Persists across battles (e.g. Pen Nib)
  turnFlags: Record<string, boolean>;    // Resets each turn (e.g. Necronomicon)

  floatingText: FloatingText | null;
}

export enum GameScreen {
  START_MENU = 'START_MENU',
  MODE_SELECTION = 'MODE_SELECTION', // New: Arithmetic mode selection
  CHARACTER_SELECTION = 'CHARACTER_SELECTION',
  RELIC_SELECTION = 'RELIC_SELECTION', 
  MAP = 'MAP',
  BATTLE = 'BATTLE',
  MATH_CHALLENGE = 'MATH_CHALLENGE', 
  REWARD = 'REWARD',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  REST = 'REST',
  SHOP = 'SHOP',
  EVENT = 'EVENT',
  COMPENDIUM = 'COMPENDIUM',
  ENDING = 'ENDING',
  HELP = 'HELP',
  TREASURE = 'TREASURE',
  RANKING = 'RANKING'
}

export enum GameMode {
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
  MULTIPLICATION = 'MULTIPLICATION',
  DIVISION = 'DIVISION',
  MIXED = 'MIXED'
}

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
  rewards: RewardItem[]; 
  selectionState: SelectionState; 
  isEndless?: boolean;
}