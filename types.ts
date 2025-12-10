
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
  fatalEnergy?: number;     
  fatalPermanentDamage?: number; 
  shuffleHandToDraw?: boolean;   
  doubleStrength?: boolean;      
  applyPower?: { id: string, amount: number }; 
  
  // Even More Advanced Effects
  damageBasedOnBlock?: boolean; 
  doubleBlock?: boolean;        
  fatalMaxHp?: number;
  innate?: boolean;          

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
  
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY' | 'SPECIAL';
  price?: number;       
}

export enum EnemyIntentType {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  UNKNOWN = 'UNKNOWN'
}

export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
}

export interface Enemy {
  id: string;
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
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: 'STARTER' | 'COMMON' | 'RARE' | 'BOSS' | 'SHOP';
  price?: number;
  effectType?: 'START_BATTLE' | 'END_TURN' | 'END_BATTLE' | 'PASSIVE';
}

export interface Potion {
    id: string; // Instance ID
    templateId: string;
    name: string;
    description: string;
    rarity: 'COMMON' | 'RARE' | 'SHOP';
    price?: number;
    color: string; // Hex color for UI
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
  
  // Advanced State
  powers: Record<string, number>; 
  echoes: number; 
  cardsPlayedThisTurn: number; 
  attacksPlayedThisTurn: number;
}

export enum GameScreen {
  START_MENU = 'START_MENU',
  RELIC_SELECTION = 'RELIC_SELECTION', 
  MAP = 'MAP',
  BATTLE = 'BATTLE',
  REWARD = 'REWARD',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  REST = 'REST',
  SHOP = 'SHOP',
  EVENT = 'EVENT',
  COMPENDIUM = 'COMPENDIUM',
  ENDING = 'ENDING'
}

// --- Map Types ---
export enum NodeType {
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  REST = 'REST',
  SHOP = 'SHOP',
  EVENT = 'EVENT',
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
    value?: any; // Card object, Relic object, Potion object, or number
    id: string;
}

export interface GameState {
  screen: GameScreen;
  act: number;
  floor: number;
  map: MapNode[];
  currentMapNodeId: string | null;
  player: Player;
  enemies: Enemy[];
  selectedEnemyId: string | null;
  narrativeLog: string[];
  rewards: RewardItem[]; 
  selectionState: SelectionState; 
}
