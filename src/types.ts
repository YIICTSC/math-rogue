
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
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'SPECIAL' | 'STARTER';
  
  damage?: number;
  block?: number;
  draw?: number;
  heal?: number;
  energy?: number;
  selfDamage?: number;
  poison?: number;
  
  exhaust?: boolean;
  strength?: number;
  vulnerable?: number;
  weak?: number;
  upgraded?: boolean;
  unplayable?: boolean;
  innate?: boolean;
  
  // Advanced
  strengthScaling?: number;
  lifesteal?: boolean;
  upgradeHand?: boolean;
  upgradeDeck?: boolean;
  fatalEnergy?: number;
  fatalPermanentDamage?: number;
  fatalMaxHp?: number;
  shuffleHandToDraw?: boolean;
  doubleStrength?: boolean;
  applyPower?: { id: string, amount: number };
  
  damageBasedOnBlock?: boolean;
  doubleBlock?: boolean;
  
  promptsDiscard?: number;
  promptsCopy?: number;
  promptsExhaust?: number;
  damagePerAttackPlayed?: number;
  damagePerCardInHand?: number;
  damagePerStrike?: number;
  playCopies?: number;
  addCardToHand?: { cardName: string, count: number, cost0?: boolean };
  addCardToDraw?: { cardName: string, count: number };
  
  poisonMultiplier?: number;
  nextTurnEnergy?: number;
  nextTurnDraw?: number;
  capture?: boolean;
  
  textureRef?: string;
  price?: number;
}

export enum EnemyIntentType {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  ATTACK_DEBUFF = 'ATTACK_DEBUFF',
  ATTACK_DEFEND = 'ATTACK_DEFEND',
  UNKNOWN = 'UNKNOWN'
}

export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
  secondaryValue?: number;
  debuffType?: string;
}

export interface FloatingText {
    id: string;
    text: string;
    color: string;
    iconType?: 'sword' | 'shield' | 'zap' | 'poison';
}

export interface Enemy {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  block: number;
  strength: number;
  nextIntent: EnemyIntent;
  
  vulnerable: number;
  weak: number;
  poison: number;
  artifact: number;
  corpseExplosion: boolean;
  
  floatingText: FloatingText | null;
  enemyType: string;
  tier?: number;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: 'STARTER' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'BOSS' | 'SHOP';
  price?: number;
  effectType?: string;
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
  potions: Potion[];
  
  powers: Record<string, number>; 
  echoes: number; 
  cardsPlayedThisTurn: number; 
  attacksPlayedThisTurn: number;
  
  relicCounters: Record<string, number>;
  turnFlags: Record<string, boolean>;
  imageData: string;
  floatingText: FloatingText | null;
  
  nextTurnEnergy: number;
  nextTurnDraw: number;
}

export enum GameScreen {
  START_MENU = 'START_MENU',
  MODE_SELECTION = 'MODE_SELECTION',
  CHARACTER_SELECTION = 'CHARACTER_SELECTION',
  RELIC_SELECTION = 'RELIC_SELECTION', 
  MAP = 'MAP',
  BATTLE = 'BATTLE',
  REWARD = 'REWARD',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  REST = 'REST',
  SHOP = 'SHOP',
  EVENT = 'EVENT',
  TREASURE = 'TREASURE',
  COMPENDIUM = 'COMPENDIUM',
  RANKING = 'RANKING',
  HELP = 'HELP',
  ENDING = 'ENDING',
  MATH_CHALLENGE = 'MATH_CHALLENGE'
}

export enum GameMode {
    ADDITION = 'ADDITION',
    SUBTRACTION = 'SUBTRACTION',
    MULTIPLICATION = 'MULTIPLICATION',
    DIVISION = 'DIVISION',
    MIXED = 'MIXED'
}

export enum NodeType {
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  REST = 'REST',
  SHOP = 'SHOP',
  EVENT = 'EVENT',
  TREASURE = 'TREASURE',
  BOSS = 'BOSS',
  START = 'START'
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
    value?: any; 
    id: string;
}

export interface RankingEntry {
    date: number;
    score: number;
    characterName: string;
    act: number;
    floor: number;
    victory: boolean;
}

export interface GameState {
  screen: GameScreen;
  mode: GameMode; 
  challengeMode?: string;
  act: number;
  floor: number;
  turn: number;
  map: MapNode[];
  currentMapNodeId: string | null;
  player: Player;
  enemies: Enemy[];
  selectedEnemyId: string | null;
  narrativeLog: string[];
  battleLog: string[];
  rewards: RewardItem[]; 
  selectionState: SelectionState; 
  isEndless?: boolean;
}

export interface Character {
    id: string;
    name: string;
    description: string;
    maxHp: number;
    gold: number;
    startingRelicId: string;
    color: string;
    deckTemplate: string[];
    imageData: string;
}
