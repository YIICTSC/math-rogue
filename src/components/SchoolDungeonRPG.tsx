
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Circle, Menu, X, Check, Search, LogOut, Shield, Sword, Target, Trash2, Hammer, FlaskConical, Info, Zap, Skull, Ghost, Award, RotateCcw, Send, Edit3, HelpCircle, Umbrella, Crosshair, FastForward, Coins, ShoppingBag, DollarSign } from 'lucide-react';
import { audioService } from '../services/audioService';
import { createPixelSpriteCanvas } from './PixelSprite';
import { storageService } from '../services/storageService';

interface SchoolDungeonRPGProps {
  onBack: () => void;
}

// --- GBC PALETTE ---
const C0 = '#0f380f'; // Blackest
const C1 = '#306230'; // Dark
const C2 = '#8bac0f'; // Light
const C3 = '#9bbc0f'; // White

// --- CONSTANTS ---
const MAP_W = 40; 
const MAP_H = 40; 
const VIEW_W = 11; 
const VIEW_H = 9;
const TILE_SIZE = 16; 
const SCALE = 3; 
const MAX_INVENTORY = 20;

const HUNGER_INTERVAL = 10;
const REGEN_INTERVAL = 5;
const ENEMY_SPAWN_RATE = 25;

// Unidentified names for STAFF items (Umbrellas)
const UNIDENTIFIED_NAMES = [
    "赤い傘", "青い傘", "黄色い傘", "ビニール傘", "黒い傘", "壊れた傘", 
    "高級な傘", "水玉の傘", "花柄の傘", "透明な傘", "和傘", "レースの傘"
];

// --- TYPES ---
type TileType = 'WALL' | 'FLOOR' | 'STAIRS' | 'HALLWAY';
type Direction = { x: 0 | 1 | -1, y: 0 | 1 | -1 };
type ItemCategory = 'WEAPON' | 'ARMOR' | 'RANGED' | 'CONSUMABLE' | 'SYNTH' | 'STAFF';
type EnemyType = 'SLIME' | 'GHOST' | 'DRAIN' | 'DRAGON' | 'METAL' | 'FLOATING' | 'THIEF' | 'BAT' | 'BOSS' | 'MANDRAKE' | 'GOLEM' | 'NINJA' | 'MAGE' | 'SHOPKEEPER';
type VisualEffectType = 'SLASH' | 'THUNDER' | 'EXPLOSION' | 'TEXT' | 'FLASH' | 'PROJECTILE' | 'WARP' | 'BEAM' | 'MAGIC_PROJ';

interface VisualEffect {
  id: number;
  type: VisualEffectType;
  x: number; 
  y: number; 
  duration: number;
  maxDuration: number;
  value?: string;
  color?: string;
  dir?: Direction;
  scale?: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
}

interface Item {
  id: string;
  category: ItemCategory;
  type: string; 
  name: string;
  desc: string;
  value?: number; // Base price / effect value
  power?: number; 
  range?: number;
  count?: number; 
  plus?: number;
  charges?: number; 
  maxCharges?: number;
  price?: number; // Calculated price for shop
}

interface EquipmentSlots {
  weapon: Item | null;
  armor: Item | null;
  ranged: Item | null;
}

interface Entity {
  id: number;
  type: 'PLAYER' | 'ENEMY' | 'ITEM' | 'GOLD';
  x: number;
  y: number;
  char: string;
  name: string;
  
  hp: number;
  maxHp: number;
  baseAttack: number; 
  baseDefense: number;
  attack: number;     
  defense: number;
  
  xp: number;
  gold?: number; // For GOLD entities or Player gold
  dir: Direction;
  
  status: {
      sleep: number;
      confused: number;
      frozen: number;
      blind: number;
      speed: number;
  };
  
  dead?: boolean;
  offset?: { x: number, y: number }; 
  itemData?: Item; 
  equipment?: EquipmentSlots;
  enemyType?: EnemyType;
  shopItems?: Item[]; // For Shopkeeper
}

interface Log {
  message: string;
  color?: string;
  id: number;
}

// --- ITEM DATABASE ---
const ITEM_DB: Record<string, Omit<Item, 'id'>> = {
    // WEAPONS
    'PENCIL_SWORD': { category: 'WEAPON', type: 'PENCIL_SWORD', name: 'えんぴつソード', desc: '削りたて。攻撃+4', power: 4, value: 200 },
    'METAL_BAT': { category: 'WEAPON', type: 'METAL_BAT', name: '金属バット', desc: 'どうたぬき級。攻撃+8', power: 8, value: 500 },
    'PROTRACTOR_EDGE': { category: 'WEAPON', type: 'PROTRACTOR_EDGE', name: '分度器エッジ', desc: '前方3方向を攻撃できる。攻撃+3', power: 3, value: 400 },
    'OFUDA_RULER': { category: 'WEAPON', type: 'OFUDA_RULER', name: 'お札定規', desc: 'ゴースト系に大ダメージ。攻撃+4', power: 4, value: 350 },
    'VITAMIN_INJECT': { category: 'WEAPON', type: 'VITAMIN_INJECT', name: 'ビタミン注射', desc: 'ドレイン系に大ダメージ。攻撃+5', power: 5, value: 350 },
    'LADLE': { category: 'WEAPON', type: 'LADLE', name: '給食のおたま', desc: '敵を肉(回復)に変えることがある。攻撃+2', power: 2, value: 600 },
    'STAINLESS_PEN': { category: 'WEAPON', type: 'STAINLESS_PEN', name: 'ステンレスペン', desc: 'サビの罠にかからない。攻撃+6', power: 6, value: 450 },
    'RICH_WATCH': { category: 'WEAPON', type: 'RICH_WATCH', name: '金持ちの時計', desc: 'お金を消費して大ダメージ。攻撃+10', power: 10, value: 800 },

    // ARMOR
    'GYM_CLOTHES': { category: 'ARMOR', type: 'GYM_CLOTHES', name: '体操服', desc: '動きやすい。回避率UP。防御+3', power: 3, value: 200 },
    'RANDO_SERU': { category: 'ARMOR', type: 'RANDO_SERU', name: 'ランドセル', desc: '硬いが重い。腹減りが早まる。防御+12', power: 12, value: 500 },
    'PRINCIPAL_SHIELD': { category: 'ARMOR', type: 'PRINCIPAL_SHIELD', name: '校長の盾', desc: '最強の盾。防御+15', power: 15, value: 1000 },
    'VINYL_APRON': { category: 'ARMOR', type: 'VINYL_APRON', name: 'ビニールエプロン', desc: 'サビや汚れを防ぐ。防御+4', power: 4, value: 300 },
    'NAME_TAG': { category: 'ARMOR', type: 'NAME_TAG', name: '名札', desc: '盗難を防ぐ。防御+5', power: 5, value: 250 },
    'DISASTER_HOOD': { category: 'ARMOR', type: 'DISASTER_HOOD', name: '防災頭巾', desc: '爆発ダメージ減少。防御+6', power: 6, value: 350 },
    'FIREFIGHTER': { category: 'ARMOR', type: 'FIREFIGHTER', name: '防火ヘルメット', desc: '炎ダメージ減少。防御+7', power: 7, value: 400 },
    'GOLD_BADGE': { category: 'ARMOR', type: 'GOLD_BADGE', name: '純金の校章', desc: 'サビない。防御+8', power: 8, value: 600 },

    // RANGED
    'CHALK': { category: 'RANGED', type: 'CHALK', name: 'チョーク', desc: '普通の飛び道具。', power: 3, range: 5, count: 8, value: 100 },
    'STONES': { category: 'RANGED', type: 'STONES', name: '石ころ', desc: '必中。範囲攻撃。', power: 2, range: 4, count: 5, value: 80 },
    'SHADOW_PIN': { category: 'RANGED', type: 'SHADOW_PIN', name: '影縫いの画鋲', desc: '当たると移動不可にする。', power: 1, range: 5, count: 3, value: 150 },

    // STAFF (UMBRELLAS) - Requires ID
    'UMB_FIRE': { category: 'STAFF', type: 'UMB_FIRE', name: '火炎放射傘', desc: '振ると前方に炎を放つ。', maxCharges: 5, value: 400 },
    'UMB_THUNDER': { category: 'STAFF', type: 'UMB_THUNDER', name: '避雷針の傘', desc: '振ると前方の敵に雷ダメージ。', maxCharges: 5, value: 400 },
    'UMB_SLEEP': { category: 'STAFF', type: 'UMB_SLEEP', name: '子守唄の傘', desc: '振ると前方の敵を眠らせる。', maxCharges: 5, value: 400 },
    'UMB_BLOW': { category: 'STAFF', type: 'UMB_BLOW', name: '突風の傘', desc: '振ると敵を吹き飛ばす。', maxCharges: 6, value: 350 },
    'UMB_WARP': { category: 'STAFF', type: 'UMB_WARP', name: '早退の傘', desc: '振ると敵をどこかへワープさせる。', maxCharges: 5, value: 350 },
    'UMB_CHANGE': { category: 'STAFF', type: 'UMB_CHANGE', name: '席替えの傘', desc: '振ると敵と場所を入れ替わる。', maxCharges: 6, value: 350 },
    'UMB_BIND': { category: 'STAFF', type: 'UMB_BIND', name: '金縛りの傘', desc: '振ると敵を動けなくする。', maxCharges: 5, value: 400 },
    'UMB_HEAL': { category: 'STAFF', type: 'UMB_HEAL', name: '回復の傘', desc: '振るとHPを回復する(敵に当てると敵が回復)。', maxCharges: 5, value: 500 },

    // CONSUMABLE (Notebooks)
    'SCROLL_SLEEP': { category: 'CONSUMABLE', type: 'SCROLL_SLEEP', name: '居眠りノート', desc: '部屋の敵が眠る。', value: 300 },
    'SCROLL_THUNDER': { category: 'CONSUMABLE', type: 'SCROLL_THUNDER', name: '理科の実験ノート', desc: 'フロア全体の敵に雷ダメージ。', value: 400 },
    'SCROLL_CRISIS': { category: 'CONSUMABLE', type: 'SCROLL_CRISIS', name: '先生への反省文', desc: '困った時の神頼み(全回復等)。', value: 500 },
    'SCROLL_BERSERK': { category: 'CONSUMABLE', type: 'SCROLL_BERSERK', name: '学級崩壊ノート', desc: '敵が暴走する。', value: 200 },
    'SCROLL_MAP': { category: 'CONSUMABLE', type: 'SCROLL_MAP', name: '学校の案内図', desc: 'フロア構造がわかる。', value: 300 },
    'SCROLL_UP_W': { category: 'CONSUMABLE', type: 'SCROLL_UP_W', name: '表彰状(武)', desc: '武器を強化する(+1)。', value: 400 },
    'SCROLL_UP_A': { category: 'CONSUMABLE', type: 'SCROLL_UP_A', name: '表彰状(防)', desc: '防具を強化する(+1)。', value: 400 },
    'SCROLL_BLANK': { category: 'CONSUMABLE', type: 'SCROLL_BLANK', name: '白紙のノート', desc: '一度読んだノートの効果を書き込める。', value: 800 },
    'SCROLL_WARP': { category: 'CONSUMABLE', type: 'SCROLL_WARP', name: '早退届', desc: 'フロアのどこかへワープする。', value: 100 },
    'SCROLL_CONFUSE': { category: 'CONSUMABLE', type: 'SCROLL_CONFUSE', name: '学級閉鎖ノート', desc: '部屋の敵が混乱する。', value: 300 },
    'SCROLL_IDENTIFY': { category: 'CONSUMABLE', type: 'SCROLL_IDENTIFY', name: '解法のノート', desc: '所持しているアイテムを全て識別する。', value: 300 },

    // FOOD/OTHERS
    'FOOD_ONIGIRI': { category: 'CONSUMABLE', type: 'FOOD_ONIGIRI', name: 'おにぎり', desc: 'お腹が50回復。', value: 50 },
    'FOOD_MEAT': { category: 'CONSUMABLE', type: 'FOOD_MEAT', name: '謎の肉', desc: 'お腹100、HP50回復。', value: 100 },
    'GRASS_HEAL': { category: 'CONSUMABLE', type: 'GRASS_HEAL', name: '給食の残り', desc: 'HP100回復。', value: 100 },
    'GRASS_LIFE': { category: 'CONSUMABLE', type: 'GRASS_LIFE', name: '命の野菜', desc: '最大HP+5。', value: 500 },
    'GRASS_SPEED': { category: 'CONSUMABLE', type: 'GRASS_SPEED', name: 'エナドリ', desc: '倍速になる。', value: 200 },
    'GRASS_EYE': { category: 'CONSUMABLE', type: 'GRASS_EYE', name: '目薬', desc: '罠が見える。', value: 200 },
    'GRASS_POISON': { category: 'CONSUMABLE', type: 'GRASS_POISON', name: '腐ったパン', desc: '毒を受ける/敵に投げると毒。', value: 50 },
    'POT_GLUE': { category: 'SYNTH', type: 'POT_GLUE', name: '工作のり', desc: '装備を合成する。', value: 500 },
    'POT_CHANGE': { category: 'CONSUMABLE', type: 'POT_CHANGE', name: 'びっくり箱', desc: '中身を別のアイテムに変化させる。', value: 400 },
    'BOMB': { category: 'CONSUMABLE', type: 'BOMB', name: '爆弾', desc: '周囲を爆破する。', value: 200 },
};

// --- DIJKSTRA PATHFINDING HELPER ---
// Calculates distance map from target (Player) to all accessible tiles
const computeDijkstraMap = (map: TileType[][], targetX: number, targetY: number): number[][] => {
    const dMap = Array(MAP_H).fill(0).map(() => Array(MAP_W).fill(9999));
    const queue: {x: number, y: number}[] = [{x: targetX, y: targetY}];
    dMap[targetY][targetX] = 0;

    while(queue.length > 0) {
        const {x, y} = queue.shift()!;
        const dist = dMap[y][x];

        // 8 Neighbors (Cardinal + Diagonal)
        const neighbors = [
            {x:x, y:y-1}, {x:x, y:y+1}, {x:x-1, y:y}, {x:x+1, y:y},
            {x:x-1, y:y-1}, {x:x+1, y:y-1}, {x:x-1, y:y+1}, {x:x+1, y:y+1}
        ];

        for(const n of neighbors) {
            if(n.x >= 0 && n.x < MAP_W && n.y >= 0 && n.y < MAP_H) {
                // Treat Walls as impassable
                if (map[n.y][n.x] !== 'WALL') {
                    if (dMap[n.y][n.x] > dist + 1) {
                        dMap[n.y][n.x] = dist + 1;
                        queue.push(n);
                    }
                }
            }
        }
    }
    return dMap;
};

const SchoolDungeonRPG: React.FC<SchoolDungeonRPGProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- STATE ---
  const [map, setMap] = useState<TileType[][]>([]);
  const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});
  
  const [player, setPlayer] = useState<Entity>({
    id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
    hp: 50, maxHp: 50, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, gold: 0, dir: {x:0, y:1},
    equipment: { weapon: null, armor: null, ranged: null },
    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0 },
    offset: { x: 0, y: 0 }
  });

  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [floorItems, setFloorItems] = useState<Entity[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  
  // Game Status
  const [floor, setFloor] = useState(1);
  const [level, setLevel] = useState(1);
  const [belly, setBelly] = useState(100);
  const [maxBelly, setMaxBelly] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameClear, setGameClear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMap, setShowMap] = useState(false); 
  const [showHelp, setShowHelp] = useState(false);
  const turnCounter = useRef(0);
  const [isEndless, setIsEndless] = useState(false);
  
  // Shop State
  const [shopState, setShopState] = useState<{ active: boolean, merchantId: number | null, mode: 'BUY' | 'SELL' }>({ active: false, merchantId: null, mode: 'BUY' });

  // VFX State
  const visualEffects = useRef<VisualEffect[]>([]);
  const shake = useRef<{x: number, y: number, duration: number}>({x: 0, y: 0, duration: 0});
  
  // Synthesis/Change/Blank State
  const [synthState, setSynthState] = useState<{ 
      active: boolean, 
      mode: 'SYNTH' | 'CHANGE' | 'BLANK',
      step: 'SELECT_BASE' | 'SELECT_MAT' | 'SELECT_TARGET' | 'SELECT_EFFECT', 
      baseIndex: number | null 
  }>({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null });

  // Identification State
  const [idMap, setIdMap] = useState<Record<string, string>>({}); // RealType -> RandomName
  const [identifiedTypes, setIdentifiedTypes] = useState<Set<string>>(new Set());

  // Menu Navigation
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [blankScrollSelectionIndex, setBlankScrollSelectionIndex] = useState(0);
  const menuListRef = useRef<HTMLDivElement>(null);

  // Inspection
  const [inspectedItem, setInspectedItem] = useState<Item | null>(null);
  const longPressTimer = useRef<any>(null);
  
  // Fast Forward State
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const fastForwardInterval = useRef<any>(null);

  // Init
  useEffect(() => {
    // Generate Sprites
    spriteCache.current['PLAYER_FRONT'] = createPixelSpriteCanvas('P_FRONT', 'HERO_FRONT|赤'); 
    spriteCache.current['PLAYER_SIDE'] = createPixelSpriteCanvas('P_SIDE', 'HERO_SIDE|赤'); 
    spriteCache.current['PLAYER_BACK'] = createPixelSpriteCanvas('P_BACK', 'HERO_BACK|赤');
    spriteCache.current['SLIME'] = createPixelSpriteCanvas('SLIME', 'SLIME|#1565C0'); 
    spriteCache.current['GHOST'] = createPixelSpriteCanvas('GHOST', 'GHOST|#a5f3fc'); 
    spriteCache.current['BAT'] = createPixelSpriteCanvas('BAT', 'BAT|#212121'); 
    spriteCache.current['DRAIN'] = createPixelSpriteCanvas('DRAIN', 'GHOST|#6A1B9A'); 
    spriteCache.current['DRAGON'] = createPixelSpriteCanvas('DRAGON', 'BEAST|#ef4444'); 
    spriteCache.current['METAL'] = createPixelSpriteCanvas('METAL', 'SLIME|#FFD700'); 
    spriteCache.current['THIEF'] = createPixelSpriteCanvas('THIEF', 'FLIER|#5D4037'); 
    spriteCache.current['BOSS'] = createPixelSpriteCanvas('BOSS', 'BOSS|#FFD700'); 
    spriteCache.current['WEAPON'] = createPixelSpriteCanvas('WPN', 'SWORD');
    spriteCache.current['ARMOR'] = createPixelSpriteCanvas('ARM', 'SHIELD');
    spriteCache.current['RANGED'] = createPixelSpriteCanvas('RNG', 'POTION'); 
    spriteCache.current['CONSUMABLE'] = createPixelSpriteCanvas('CON', 'NOTEBOOK');
    spriteCache.current['SYNTH'] = createPixelSpriteCanvas('SYNTH', 'POTION|#FFFFFF'); 
    spriteCache.current['STAFF'] = createPixelSpriteCanvas('STAFF', 'UMBRELLA|#00BCD4'); 
    spriteCache.current['MANDRAKE'] = createPixelSpriteCanvas('MANDRAKE', 'PLANT|#33691e');
    spriteCache.current['GOLEM'] = createPixelSpriteCanvas('GOLEM', 'SKELETON|#b0bec5');
    spriteCache.current['NINJA'] = createPixelSpriteCanvas('NINJA', 'FLIER|#1a237e');
    spriteCache.current['MAGE'] = createPixelSpriteCanvas('MAGE', 'WIZARD|#7b1fa2');
    
    // New Sprites
    spriteCache.current['COIN'] = createPixelSpriteCanvas('COIN', 'GEM|#FFD700');
    spriteCache.current['SHOPKEEPER'] = createPixelSpriteCanvas('SHOPKEEPER', 'HUMANOID|#33691e'); // Green merchant
    spriteCache.current['GOLD_BAG'] = createPixelSpriteCanvas('GOLD_BAG', 'GOLD_BAG|#FFD700');
    spriteCache.current['MAGIC_BULLET'] = createPixelSpriteCanvas('MAGIC_BULLET', 'MAGIC_BULLET|#00BCD4');

    startNewGame();
  }, []);

  // Update Stats
  useEffect(() => {
      setPlayer(p => {
          const wItem = p.equipment?.weapon;
          const aItem = p.equipment?.armor;
          const wPow = (wItem?.power || 0) + (wItem?.plus || 0);
          const aPow = (aItem?.power || 0) + (aItem?.plus || 0);
          return {
              ...p,
              attack: p.baseAttack + wPow,
              defense: p.baseDefense + aPow
          };
      });
  }, [player.equipment]);

  // Scroll effect
  useEffect(() => {
    if ((menuOpen || shopState.active) && menuListRef.current) {
        const idx = synthState.mode === 'BLANK' ? blankScrollSelectionIndex : selectedItemIndex;
        const itemEl = menuListRef.current.children[idx] as HTMLElement;
        if (itemEl) {
            const container = menuListRef.current;
            if (itemEl.offsetTop < container.scrollTop) {
                container.scrollTop = itemEl.offsetTop;
            } else if (itemEl.offsetTop + itemEl.offsetHeight > container.scrollTop + container.clientHeight) {
                container.scrollTop = itemEl.offsetTop + itemEl.offsetHeight - container.clientHeight;
            }
        }
    }
  }, [selectedItemIndex, menuOpen, shopState.active, blankScrollSelectionIndex, synthState.mode]);

  const addVisualEffect = (type: VisualEffectType, x: number, y: number, options: Partial<VisualEffect> = {}) => {
      visualEffects.current.push({
          id: Date.now() + Math.random(),
          type, x, y,
          duration: type === 'TEXT' ? 30 : 15,
          maxDuration: type === 'TEXT' ? 30 : 15,
          ...options
      });
  };

  const triggerShake = (duration: number) => {
      shake.current.duration = duration;
  };

  const addLog = (msg: string, color?: string) => {
    setLogs(prev => {
        const nextLogs = [...prev, { message: msg, color, id: Date.now() + Math.random() }];
        if (nextLogs.length > 20) return nextLogs.slice(nextLogs.length - 20);
        return nextLogs;
    });
  };

  const saveDungeonScore = (reason: string) => {
      const score = floor * 100 + level * 50 + (inventory.length * 10) + (player.gold || 0);
      storageService.saveDungeonScore({
          id: `dungeon-${Date.now()}`,
          date: Date.now(),
          floor: floor,
          level: level,
          score: score,
          reason: reason
      });
  };

  const startNewGame = () => {
    setFloor(1);
    setLevel(1);
    setBelly(100);
    setMaxBelly(100);
    setGameOver(false);
    setGameClear(false);
    setMenuOpen(false);
    setShopState({ active: false, merchantId: null, mode: 'BUY' });
    setIsEndless(false);
    turnCounter.current = 0;
    visualEffects.current = [];
    setIsFastForwarding(false);
    
    // Init ID Map for Staffs (Umbrellas)
    const shuffledNames = [...UNIDENTIFIED_NAMES].sort(() => Math.random() - 0.5);
    const staffTypes = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].category === 'STAFF');
    const newIdMap: Record<string, string> = {};
    staffTypes.forEach((t, i) => {
        newIdMap[t] = shuffledNames[i] || "謎の傘";
    });
    setIdMap(newIdMap);
    setIdentifiedTypes(new Set());

    const initItem: Item = { ...ITEM_DB['FOOD_ONIGIRI'], id: `start-${Date.now()}` };
    const initWeapon: Item = { ...ITEM_DB['PENCIL_SWORD'], id: `start-w-${Date.now()}` };
    setInventory([initItem, initWeapon]);
    
    setPlayer({
        id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
        hp: 50, maxHp: 50, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, gold: 0, dir: {x:0, y:1},
        equipment: { weapon: null, armor: null, ranged: null },
        status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0 },
        offset: { x: 0, y: 0 }
    });
    setLogs([]);
    generateFloor(1);
    addLog("風来の旅が始まった！");
  };

  const spawnEnemy = (x: number, y: number, floorLevel: number): Entity => {
      const r = Math.random();
      let t: EnemyType = 'SLIME';
      let name="敵", hp=10, atk=2, xp=5, def=0;
      const scaling = Math.floor((floorLevel - 1) * 2); 
      const hpScale = Math.floor(floorLevel * 3);
      const xpScale = Math.floor(floorLevel * 1.5);

      if (floorLevel === 1) {
          if (r < 0.6) { t = 'SLIME'; name="スライム"; hp=10; atk=3; xp=5; }
          else { t = 'BAT'; name="コウモリ"; hp=8; atk=4; xp=6; }
      } else {
          if (r < 0.05 && !isEndless) { t = 'SHOPKEEPER'; name="購買部員"; hp=1000; atk=50; xp=0; def=20; }
          else if (r < 0.20) { t = 'SLIME'; name="スライム"; hp=10+hpScale; atk=3+scaling; xp=5+xpScale; }
          else if (r < 0.35) { t = 'BAT'; name="コウモリ"; hp=8+hpScale; atk=5+scaling; xp=7+xpScale; }
          else if (r < 0.45 && floorLevel > 2) { t = 'MANDRAKE'; name="人食い植物"; hp=20+hpScale; atk=5+scaling; xp=12+xpScale; }
          else if (r < 0.60) { t = 'GHOST'; name="浮遊霊"; hp=15+hpScale; atk=4+scaling; xp=10+xpScale; def=2+Math.floor(floorLevel/2); }
          else if (r < 0.70) { t = 'THIEF'; name="トド"; hp=20+hpScale; atk=2+scaling; xp=15+xpScale; }
          else if (r < 0.80) { t = 'DRAIN'; name="くさった死体"; hp=30+hpScale; atk=6+scaling; xp=20+xpScale; }
          else if (r < 0.85 && floorLevel > 5) { t = 'NINJA'; name="忍者ごっこ"; hp=25+hpScale; atk=8+scaling; xp=25+xpScale; }
          else if (r < 0.90 && floorLevel > 7) { t = 'GOLEM'; name="人体模型"; hp=60+hpScale*1.5; atk=12+scaling; xp=40+xpScale; def=5; }
          else if (r < 0.95 && floorLevel > 10) { t = 'MAGE'; name="魔法使い"; hp=30+hpScale; atk=10+scaling; xp=35+xpScale; }
          else if (r < 0.98 && floorLevel > 4) { t = 'DRAGON'; name="ドラゴン"; hp=50+hpScale*2; atk=10+scaling*1.5; xp=50+xpScale*2; }
          else if (floorLevel > 6) { t = 'METAL'; name="メタル生徒"; hp=4+Math.floor(floorLevel/5); atk=1+scaling; xp=100+xpScale*3; def=999; }
      }

      // Generate Shop Items if Shopkeeper
      let shopItems: Item[] = [];
      if (t === 'SHOPKEEPER') {
          for(let i=0; i<5; i++) {
              const keys = Object.keys(ITEM_DB);
              const key = keys[Math.floor(Math.random() * keys.length)];
              const template = ITEM_DB[key];
              const price = (template.value || 100) * (Math.random() * 0.5 + 0.8);
              shopItems.push({ 
                  ...template, 
                  id: `shop-${Date.now()}-${i}`, 
                  price: Math.floor(price),
                  plus: 0, charges: template.maxCharges
              });
          }
      }

      return {
          id: Date.now() + Math.random(), type: 'ENEMY', x, y, char: t[0], 
          name, hp, maxHp: hp, baseAttack: Math.floor(atk), baseDefense: Math.floor(def), attack: Math.floor(atk), defense: Math.floor(def), xp: Math.floor(xp), dir: {x:0, y:0}, enemyType: t,
          status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0 },
          offset: { x: 0, y: 0 },
          shopItems
      };
  };

  const generateFloor = (f: number) => {
    const newMap: TileType[][] = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill('WALL'));
    const rooms: {x:number, y:number, w:number, h:number}[] = [];
    
    let attempts = 0;
    while(rooms.length < 8 && attempts < 200) {
        attempts++;
        const w = Math.floor(Math.random() * 4) + 4;
        const h = Math.floor(Math.random() * 4) + 4;
        const x = Math.floor(Math.random() * (MAP_W - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_H - h - 2)) + 1;
        const overlap = rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y);
        if(!overlap) {
            rooms.push({x, y, w, h});
            for(let ry=y; ry<y+h; ry++) { for(let rx=x; rx<x+w; rx++) newMap[ry][rx] = 'FLOOR'; }
        }
    }
    rooms.sort((a,b) => (a.x + a.y) - (b.x + b.y));

    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i]; const r2 = rooms[i+1];
        let cx = Math.floor(r1.x + r1.w/2); let cy = Math.floor(r1.y + r1.h/2);
        const tx = Math.floor(r2.x + r2.w/2); const ty = Math.floor(r2.y + r2.h/2);
        while(cx !== tx) { newMap[cy][cx] = 'FLOOR'; cx += (tx > cx) ? 1 : -1; }
        while(cy !== ty) { newMap[cy][cx] = 'FLOOR'; cy += (ty > cy) ? 1 : -1; }
    }

    const startRoom = rooms[0];
    const px = Math.floor(startRoom.x + startRoom.w/2);
    const py = Math.floor(startRoom.y + startRoom.h/2);
    setPlayer(prev => ({ ...prev, x: px, y: py }));

    const newEnemies: Entity[] = [];
    const newItems: Entity[] = [];
    const lastRoom = rooms[rooms.length - 1];
    const sx = Math.floor(lastRoom.x + lastRoom.w/2);
    const sy = Math.floor(lastRoom.y + lastRoom.h/2);

    if (f === 20 && !isEndless) {
        addLog("強烈な殺気を感じる...", "red");
        triggerShake(20);
        newEnemies.push({
            id: Date.now(), type: 'ENEMY', x: sx, y: sy, char: 'B',
            name: "校長先生(真)", hp: 500, maxHp: 500, baseAttack: 30, baseDefense: 10, attack: 30, defense: 10, xp: 5000, 
            dir: {x:0, y:0}, enemyType: 'BOSS',
            status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0 },
            offset: { x: 0, y: 0 }
        });
    } else {
        newMap[sy][sx] = 'STAIRS';
    }
    
    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            if(newMap[y][x] === 'FLOOR' && (x !== px || y !== py) && (x !== sx || y !== sy)) {
                if(Math.random() < 0.06) {
                    newEnemies.push(spawnEnemy(x, y, f));
                } else if(Math.random() < 0.04) {
                    const r = Math.random();
                    if (r < 0.2) {
                        // Gold
                        newItems.push({
                            id: Date.now() + Math.random(), type: 'GOLD', x, y, char: '$', name: 'お金',
                            hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                            status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0 },
                            gold: Math.floor(Math.random() * 50 + 10 * f)
                        });
                    } else {
                        // Items
                        const keys = Object.keys(ITEM_DB);
                        const key = keys[Math.floor(Math.random() * keys.length)];
                        const template = ITEM_DB[key];
                        let plus = 0;
                        let charges = template.maxCharges || 0;
                        if ((template.category === 'WEAPON' || template.category === 'ARMOR') && Math.random() < 0.2) {
                            plus = Math.floor(Math.random() * 2) + 1;
                        }
                        if (template.category === 'STAFF') {
                            charges = Math.floor(Math.random() * 4) + 2; 
                        }
                        newItems.push({
                            id: Date.now() + Math.random(), type: 'ITEM', x, y, char: '!', 
                            name: template.name, hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                            status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0 },
                            itemData: { 
                                ...template, 
                                id: `item-${Date.now()}-${Math.random()}`, 
                                plus,
                                charges,
                                name: plus > 0 ? `${template.name}+${plus}` : template.name,
                                price: Math.floor((template.value || 100) * 0.5) // Sell price is usually half base
                            }
                        });
                    }
                }
            }
        }
    }

    setMap(newMap);
    setEnemies(newEnemies);
    setFloorItems(newItems);
    setShowMap(false);
    addVisualEffect('FLASH', 0, 0, {duration: 10, maxDuration: 10});
};

  const movePlayer = (dx: 0|1|-1, dy: 0|1|-1) => {
      if(gameOver || gameClear) return;

      if (shopState.active) {
          if (dy !== 0) {
              const shopkeeper = enemies.find(e => e.id === shopState.merchantId);
              const listLength = shopState.mode === 'BUY' ? (shopkeeper?.shopItems?.length || 0) : inventory.length;
              setSelectedItemIndex(prev => Math.max(0, Math.min(listLength - 1, prev + dy)));
              audioService.playSound('select');
          }
          return;
      }

      if (menuOpen) {
          if (synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
              const known = Array.from(identifiedTypes);
              if (known.length === 0) return;
              if (dy !== 0) {
                  setBlankScrollSelectionIndex(prev => Math.max(0, Math.min(known.length - 1, prev + dy)));
                  audioService.playSound('select');
              }
          } else {
              if (dy !== 0) {
                  setSelectedItemIndex(prev => Math.max(0, Math.min(inventory.length - 1, prev + dy)));
                  audioService.playSound('select');
              }
          }
          return;
      }

      if(dx === 0 && dy === 0) {
          addLog("足踏みした。");
          processTurn(player.x, player.y);
          return;
      }

      setPlayer(p => ({ ...p, dir: {x: dx, y: dy} }));

      let tx = player.x + dx;
      let ty = player.y + dy;

      if (player.status.confused > 0) {
          if (Math.random() < 0.5) {
              const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
              const r = dirs[Math.floor(Math.random()*4)];
              tx = player.x + r[0]; ty = player.y + r[1];
              addLog("混乱してふらついた！", "yellow");
          }
      }

      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H || map[ty][tx] === 'WALL') return;

      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) {
          if (target.enemyType === 'SHOPKEEPER') {
              addLog("「へいらっしゃい！何にする？」", C2);
              setShopState({ active: true, merchantId: target.id, mode: 'BUY' });
              setSelectedItemIndex(0);
              audioService.playSound('select');
          } else {
              attackEnemy(target);
              processTurn(player.x, player.y); 
          }
          return;
      }

      let finalX = tx; let finalY = ty;
      setPlayer(p => ({ ...p, x: finalX, y: finalY }));
      
      // Item Pickup
      const itemIdx = floorItems.findIndex(i => i.x === finalX && i.y === finalY);
      if (itemIdx !== -1) {
          const itemEntity = floorItems[itemIdx];
          
          if (itemEntity.type === 'GOLD') {
              const amount = itemEntity.gold || 0;
              setPlayer(p => ({ ...p, gold: (p.gold || 0) + amount }));
              addLog(`${amount}円を拾った！`, "yellow");
              setFloorItems(prev => prev.filter((_, i) => i !== itemIdx));
              audioService.playSound('select');
          } else if (itemEntity.itemData) {
              const item = itemEntity.itemData;
              if (inventory.length < MAX_INVENTORY) {
                  setInventory(prev => [...prev, item]);
                  addLog(`${getItemName(item)}を拾った！`);
                  setFloorItems(prev => prev.filter((_, i) => i !== itemIdx));
                  audioService.playSound('select');
              } else {
                  addLog("持ち物がいっぱいで拾えない！", "red");
              }
          }
      }
      
      if (map[ty][tx] === 'STAIRS') addLog("階段がある。", C2);
      processTurn(finalX, finalY);
  };

  const handleShopAction = () => {
      const shopkeeper = enemies.find(e => e.id === shopState.merchantId);
      if (!shopkeeper) { setShopState(prev => ({ ...prev, active: false })); return; }

      if (shopState.mode === 'BUY') {
          if (!shopkeeper.shopItems || shopkeeper.shopItems.length === 0) return;
          const item = shopkeeper.shopItems[selectedItemIndex];
          if (!item) return;
          
          if ((player.gold || 0) >= (item.price || 0)) {
              if (inventory.length < MAX_INVENTORY) {
                  setPlayer(p => ({ ...p, gold: (p.gold || 0) - (item.price || 0) }));
                  setInventory(prev => [...prev, item]);
                  
                  // Remove from shop
                  const newShopItems = shopkeeper.shopItems.filter((_, i) => i !== selectedItemIndex);
                  setEnemies(prev => prev.map(e => e.id === shopkeeper.id ? { ...e, shopItems: newShopItems } : e));
                  
                  addLog(`${getItemName(item)}を買った！`, C2);
                  audioService.playSound('buff');
                  if (newShopItems.length === 0) setShopState(prev => ({ ...prev, active: false }));
                  else setSelectedItemIndex(prev => Math.min(prev, newShopItems.length - 1));
              } else {
                  addLog("持ち物がいっぱいだ！", "red");
                  audioService.playSound('wrong');
              }
          } else {
              addLog("お金が足りない！", "red");
              audioService.playSound('wrong');
          }
      } else {
          // SELL
          if (inventory.length === 0) return;
          const item = inventory[selectedItemIndex];
          if (!item) return;
          
          // Cannot sell equipped items directly (simple safeguard)
          if (player.equipment?.weapon === item || player.equipment?.armor === item || player.equipment?.ranged === item) {
              addLog("装備中のアイテムは売れません。", "red");
              audioService.playSound('wrong');
              return;
          }

          const sellPrice = Math.max(1, Math.floor((item.value || 100) / 2));
          setPlayer(p => ({ ...p, gold: (p.gold || 0) + sellPrice }));
          setInventory(prev => prev.filter((_, i) => i !== selectedItemIndex));
          addLog(`${getItemName(item)}を${sellPrice}円で売った。`, C2);
          audioService.playSound('select');
          setSelectedItemIndex(prev => Math.max(0, Math.min(prev, inventory.length - 2)));
      }
  };

  const triggerPlayerAttackAnim = (dir: Direction) => {
      const shift = 6; 
      setPlayer(p => ({ ...p, offset: { x: dir.x * shift, y: dir.y * shift } }));
      setTimeout(() => setPlayer(p => ({ ...p, offset: { x: 0, y: 0 } })), 100);
  };

  const attackEnemy = (target: Entity) => {
      triggerPlayerAttackAnim(player.dir);
      const targets = [target];
      addVisualEffect('SLASH', target.x, target.y, { dir: player.dir });

      // 3-Way Attack Logic (Inherited from Type)
      if (player.equipment?.weapon?.type === 'PROTRACTOR_EDGE') {
          const {x: dx, y: dy} = player.dir;
          const others = [];
          if (dx === 0 && dy === -1) { others.push({x: -1, y: -1}, {x: 1, y: -1}); } 
          else if (dx === 0 && dy === 1) { others.push({x: 1, y: 1}, {x: -1, y: 1}); } 
          else if (dx === -1 && dy === 0) { others.push({x: -1, y: 1}, {x: -1, y: -1}); } 
          else if (dx === 1 && dy === 0) { others.push({x: 1, y: -1}, {x: 1, y: 1}); } 
          else if (dx === -1 && dy === -1) { others.push({x: 0, y: -1}, {x: -1, y: 0}); } 
          else if (dx === 1 && dy === -1) { others.push({x: 0, y: -1}, {x: 1, y: 0}); } 
          else if (dx === -1 && dy === 1) { others.push({x: -1, y: 0}, {x: 0, y: 1}); } 
          else if (dx === 1 && dy === 1) { others.push({x: 1, y: 0}, {x: 0, y: 1}); } 

          others.forEach(offset => {
              const tx = player.x + offset.x;
              const ty = player.y + offset.y;
              addVisualEffect('SLASH', tx, ty, { dir: offset as Direction }); 
              addVisualEffect('EXPLOSION', tx, ty, { duration: 10, maxDuration: 10, scale: 0.5 });
              const t = enemies.find(e => e.x === tx && e.y === ty);
              if (t) targets.push(t);
          });
      }

      let newEnemies = [...enemies];
      targets.forEach(t => {
          let dmg = Math.max(1, player.attack - t.defense);
          
          const wType = player.equipment?.weapon?.type;
          if (wType === 'OFUDA_RULER' && t.enemyType === 'GHOST') { dmg = Math.floor(dmg * 1.5); addLog("成仏！", "yellow"); }
          if (wType === 'VITAMIN_INJECT' && t.enemyType === 'DRAIN') { dmg = Math.floor(dmg * 1.5); addLog("特効！", "yellow"); }
          if (wType === 'STAINLESS_PEN' && t.enemyType === 'METAL') { dmg = 1; }
          if (wType === 'RICH_WATCH' && player.gold && player.gold >= 10) { dmg += 10; setPlayer(p => ({...p, gold: (p.gold||0) - 10})); } 
          
          if (Math.random() < 0.1) { dmg *= 2; addLog("会心の一撃！", "red"); triggerShake(5); }

          newEnemies = newEnemies.map(e => {
              if (e.id === t.id) {
                  const nhp = e.hp - dmg;
                  addLog(`${e.name}に${dmg}ダメージ！`);
                  addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'white' });
                  if (nhp <= 0 && wType === 'LADLE' && Math.random() < 0.3) {
                      const meat = { ...ITEM_DB['FOOD_MEAT'], name: `${e.name}の肉`, value: 100, id: `meat-${Date.now()}` };
                      setFloorItems(prev => [...prev, { id: Date.now()+Math.random(), type:'ITEM', x: e.x, y: e.y, char: '!', name: meat.name, hp:0,maxHp:0,baseAttack:0,baseDefense:0,attack:0,defense:0,xp:0,dir:{x:0,y:0}, status:e.status, itemData: meat }]);
                      addLog(`${e.name}を肉に変えた！`, C2);
                  }
                  return { ...e, hp: nhp };
              }
              return e;
          });
      });

      const deads = newEnemies.filter(e => e.hp <= 0);
      deads.forEach(d => {
          if (d.enemyType === 'BOSS') {
              setGameClear(true);
              audioService.playSound('win');
              saveDungeonScore("Cleared");
              addVisualEffect('FLASH', 0, 0, { duration: 30, maxDuration: 30 });
          } else {
              addLog(`${d.name}を倒した！ (${d.xp} XP)`);
              gainXp(d.xp);
          }
      });
      setEnemies(newEnemies.filter(e => e.hp > 0));
      audioService.playSound('attack');
  };

  const gainXp = (amount: number) => {
      let nextXp = player.xp + amount;
      let nextLv = level;
      let nextMaxHp = player.maxHp;
      let nextAtk = player.baseAttack;
      const needed = nextLv * 10;
      if (nextXp >= needed) {
          nextXp -= needed; nextLv++; nextMaxHp += 5; nextAtk += 1;
          setPlayer(p => ({ ...p, hp: nextMaxHp, baseAttack: nextAtk, maxHp: nextMaxHp })); 
          addLog(`レベルが${nextLv}に上がった！`);
          audioService.playSound('buff');
          addVisualEffect('FLASH', 0, 0);
          addVisualEffect('TEXT', player.x, player.y, { value: 'LEVEL UP!', color: 'yellow' });
      }
      setPlayer(p => ({ ...p, xp: nextXp }));
      setLevel(nextLv);
  };

  const processTurn = (px: number, py: number) => {
      turnCounter.current += 1;
      let nextBelly = belly;
      let nextHp = player.hp;
      let nextStatus = { ...player.status };
      
      const aType = player.equipment?.armor?.type;
      const heavy = aType === 'RANDO_SERU';
      
      if (turnCounter.current % (heavy ? HUNGER_INTERVAL/2 : HUNGER_INTERVAL) === 0) {
          nextBelly -= 1;
          if (nextBelly <= 0) {
              nextBelly = 0; nextHp -= 1;
              if (nextHp <= 0) { setGameOver(true); saveDungeonScore("Starved"); addLog("空腹で倒れた...", "red"); return; }
              addLog("お腹が空いて倒れそうだ...", "red");
          }
      }
      if (turnCounter.current % REGEN_INTERVAL === 0 && nextBelly > 0 && nextHp < player.maxHp) nextHp += 1;
      if (nextStatus.sleep > 0) { nextStatus.sleep--; if (nextStatus.sleep<=0) addLog("目が覚めた！"); }
      if (nextStatus.confused > 0) nextStatus.confused--;
      if (nextStatus.blind > 0) nextStatus.blind--;
      if (nextStatus.frozen > 0) nextStatus.frozen--;
      
      setBelly(nextBelly);
      setPlayer(p => ({ ...p, hp: nextHp, status: nextStatus }));

      if (turnCounter.current % ENEMY_SPAWN_RATE === 0) {
          let attempts = 0;
          while (attempts < 5) {
              attempts++;
              const rx = Math.floor(Math.random() * MAP_W);
              const ry = Math.floor(Math.random() * MAP_H);
              if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry) && (rx !== px || ry !== py)) {
                  setEnemies(prev => [...prev, spawnEnemy(rx, ry, floor)]);
                  break;
              }
          }
      }

      // Compute Dijkstra Map for enemy pathfinding
      const dMap = computeDijkstraMap(map, px, py);

      setEnemies(prevEnemies => {
          const nextEnemies: Entity[] = [];
          const occupied = new Set<string>();
          occupied.add(`${px},${py}`);
          const attackingEnemyIds: number[] = [];

          for (const e of prevEnemies) {
              if (e.enemyType === 'SHOPKEEPER') { occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); continue; }

              if (e.status.sleep > 0) { e.status.sleep--; nextEnemies.push(e); occupied.add(`${e.x},${e.y}`); addVisualEffect('TEXT', e.x, e.y, {value:'Zzz', color:'blue'}); continue; }
              if (e.status.frozen > 0) { e.status.frozen--; nextEnemies.push(e); occupied.add(`${e.x},${e.y}`); continue; }
              
              const dx = px - e.x; const dy = py - e.y;
              const dist = Math.abs(dx) + Math.abs(dy);
              
              // Special Attacks
              if (e.enemyType === 'DRAGON' && dist <= 2 && dist > 0 && Math.random() < 0.3) {
                  addLog(`${e.name}の炎！`, "red");
                  let dmg = 15;
                  if (player.equipment?.armor?.type === 'FIREFIGHTER') dmg = Math.floor(dmg / 2);
                  setPlayer(p => { const nhp = p.hp - dmg; if(nhp<=0) { setGameOver(true); saveDungeonScore(`Killed by ${e.name}`); } return {...p, hp:nhp}; });
                  occupied.add(`${e.x},${e.y}`); nextEnemies.push(e);
                  addVisualEffect('EXPLOSION', px, py); addVisualEffect('TEXT', px, py, { value: `${dmg}`, color: 'red' });
                  continue;
              }

              if (e.enemyType === 'MAGE' && dist <= 4 && dist > 0 && Math.random() < 0.2) {
                  addLog(`${e.name}の魔法！混乱した！`, "yellow");
                  setPlayer(p => ({ ...p, status: { ...p.status, confused: 5 } }));
                  occupied.add(`${e.x},${e.y}`); nextEnemies.push(e);
                  addVisualEffect('FLASH', px, py);
                  continue;
              }

              let tx = e.x;
              let ty = e.y;
              let moved = false;

              // Confused Movement
              if (e.status.confused > 0) {
                  e.status.confused--;
                  const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                  const r = dirs[Math.floor(Math.random()*4)];
                  tx = e.x + r[0]; ty = e.y + r[1];
                  moved = true; // Attempt random move
              } 
              // Standard Pathfinding (Dijkstra) if "awake"
              else if (dist <= 15) {
                  // If adjacent to player, attack logic below will handle it, but pathfinding leads there too
                  const neighbors = [
                      {x:e.x, y:e.y-1}, {x:e.x, y:e.y+1}, {x:e.x-1, y:e.y}, {x:e.x+1, y:e.y},
                      {x:e.x-1, y:e.y-1}, {x:e.x+1, y:e.y-1}, {x:e.x-1, y:e.y+1}, {x:e.x+1, y:e.y+1}
                  ];
                  
                  let bestDist = dMap[e.y][e.x];
                  let bestMove = null;

                  for (const n of neighbors) {
                      if (n.x >= 0 && n.x < MAP_W && n.y >= 0 && n.y < MAP_H && map[n.y][n.x] !== 'WALL') {
                          // Allow moving to player tile to trigger attack logic
                          if (!occupied.has(`${n.x},${n.y}`) || (n.x === px && n.y === py)) {
                              if (dMap[n.y][n.x] < bestDist) {
                                  bestDist = dMap[n.y][n.x];
                                  bestMove = n;
                              }
                          }
                      }
                  }

                  if (bestMove) {
                      tx = bestMove.x;
                      ty = bestMove.y;
                      moved = true;
                  }
              }

              // Attack or Move Execution
              if (tx === px && ty === py) {
                  // Attack
                  let dmg = Math.max(1, e.attack - player.defense);
                  if (player.equipment?.armor?.type === 'GYM_CLOTHES' && Math.random() < 0.3) { addLog("ひらりと身をかわした！", C2); dmg = 0; addVisualEffect('TEXT', px, py, { value: 'MISS', color: 'blue' }); }
                  if (player.equipment?.armor?.type === 'NAME_TAG' && e.enemyType === 'THIEF') addLog("名札が盗みを防いだ！");
                  else if (e.enemyType === 'THIEF' && dmg > 0 && Math.random() < 0.3 && inventory.length > 0) { addLog("アイテムを盗まれた！", "red"); const idx = Math.floor(Math.random() * inventory.length); setInventory(inv => inv.filter((_, i) => i !== idx)); }

                  if (dmg > 0) {
                      addLog(`${e.name}の攻撃！${dmg}ダメージ！`, "red");
                      setPlayer(p => { const newHp = p.hp - dmg; if (newHp <= 0) { setGameOver(true); saveDungeonScore(`Killed by ${e.name}`); } return { ...p, hp: newHp }; });
                      nextEnemies.push({ ...e, offset: { x: (tx - e.x) * 6, y: (ty - e.y) * 6 } });
                      attackingEnemyIds.push(e.id);
                      triggerShake(5);
                      addVisualEffect('TEXT', px, py, { value: `${dmg}`, color: 'red' });
                  } else { nextEnemies.push(e); }
                  occupied.add(`${e.x},${e.y}`);
              } else if (moved) {
                  // Attempt Move
                  if (!map[ty][tx] || map[ty][tx] === 'WALL' || occupied.has(`${tx},${ty}`) || prevEnemies.some(o => o.id !== e.id && o.x === tx && o.y === ty)) {
                      occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); // Blocked
                  } else {
                      occupied.add(`${tx},${ty}`); nextEnemies.push({ ...e, x: tx, y: ty });
                  }
              } else {
                  // Idle
                  occupied.add(`${e.x},${e.y}`); nextEnemies.push(e);
              }
          }
          if (attackingEnemyIds.length > 0) setTimeout(() => setEnemies(curr => curr.map(en => attackingEnemyIds.includes(en.id) ? { ...en, offset: { x: 0, y: 0 } } : en)), 150);
          return nextEnemies;
      });
  };

  const getItemName = (item: Item) => {
      if (item.category === 'WEAPON' || item.category === 'ARMOR' || item.category === 'RANGED' || item.category === 'SYNTH' || item.category === 'CONSUMABLE') return item.name;
      // Staffs are now the only thing needing identification
      if (item.type.includes('MEAT')) return item.name;
      if (identifiedTypes.has(item.type)) return item.name;
      return idMap[item.type] || item.name;
  };

  // --- ACTIONS ---
  
  const fireRangedWeapon = () => {
      if (menuOpen || shopState.active) return;
      const rangedItem = player.equipment?.ranged;
      if (!rangedItem) {
          addLog("飛び道具を装備していない！");
          return;
      }
      if ((rangedItem.count || 0) <= 0) {
          addLog(`${rangedItem.name}が無くなった！`);
          // Unequip/Remove
          setPlayer(p => ({ ...p, equipment: { ...p.equipment!, ranged: null } }));
          return;
      }

      // Decrement
      const newRanged = { ...rangedItem, count: (rangedItem.count || 0) - 1 };
      setPlayer(p => ({ ...p, equipment: { ...p.equipment!, ranged: newRanged } }));
      
      const { x: dx, y: dy } = player.dir;
      let lx = player.x, ly = player.y;
      let hitEntity: Entity | null = null;

      for (let i=1; i<=8; i++) {
          const tx = player.x + dx * i;
          const ty = player.y + dy * i;
          lx = tx; ly = ty;
          if (map[ty][tx] === 'WALL') { addLog("壁に当たった。"); break; }
          const target = enemies.find(e => e.x === tx && e.y === ty);
          if (target) { hitEntity = target; break; }
      }

      addVisualEffect('PROJECTILE', lx, ly, { dir: player.dir, duration: 10 });
      triggerPlayerAttackAnim(player.dir);

      if (hitEntity) {
          let dmg = 5 + (newRanged.power || 0);
          if (newRanged.type === 'SHADOW_PIN') { hitEntity.status.frozen = 5; addLog("影を縫いつけた！"); }
          
          const newEnemies = enemies.map(e => {
              if (e.id === hitEntity!.id) {
                  const nhp = e.hp - dmg;
                  return { ...e, hp: nhp };
              }
              return e;
          });
          const dead = newEnemies.find(e => e.id === hitEntity!.id && e.hp <= 0);
          if(dead) { gainXp(dead.xp); addLog(`${dead.name}を倒した！`); }
          else { addLog(`${hitEntity.name}に${dmg}ダメージ！`); addVisualEffect('TEXT', hitEntity.x, hitEntity.y, {value:`${dmg}`}); }
          setEnemies(newEnemies.filter(e => e.hp > 0));
          audioService.playSound('attack');
      } else {
          addLog("外した！");
      }
      processTurn(player.x, player.y);
  };

  const handleActionBtn = () => {
      if (gameOver) { startNewGame(); return; }
      if (gameClear) return;
      if (shopState.active) { handleShopAction(); return; }
      if (menuOpen) {
          if (synthState.active) handleSynthesisStep();
          else if (inventory.length > 0) handleItemAction(selectedItemIndex);
          return;
      }
      const tx = player.x + player.dir.x;
      const ty = player.y + player.dir.y;
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) { 
          if (target.enemyType === 'SHOPKEEPER') {
              addLog("「へいらっしゃい！何にする？」", C2);
              setShopState({ active: true, merchantId: target.id, mode: 'BUY' });
              setSelectedItemIndex(0);
              audioService.playSound('select');
          } else {
              attackEnemy(target);
              processTurn(player.x, player.y);
          }
          return;
      }
      if (map[player.y][player.x] === 'STAIRS') { addLog("階段を降りた！"); setFloor(f => f + 1); generateFloor(floor + 1); return; }
      triggerPlayerAttackAnim(player.dir);
      addVisualEffect('SLASH', tx, ty, { dir: player.dir });
      addLog("素振りをした。");
      audioService.playSound('select');
      processTurn(player.x, player.y);
  };

  // --- LONG PRESS LOGIC (FAST FORWARD) ---
  const handlePressStart = () => {
      if (menuOpen || shopState.active || gameOver || gameClear) return;
      // Start waiting detection
      fastForwardInterval.current = setTimeout(() => {
          setIsFastForwarding(true);
      }, 400); // 400ms hold to trigger
  };

  const handlePressEnd = () => {
      if (fastForwardInterval.current) {
          clearTimeout(fastForwardInterval.current);
          fastForwardInterval.current = null;
      }
      
      if (!isFastForwarding) {
          handleActionBtn();
      } else {
          setIsFastForwarding(false);
      }
  };

  // Fast Forward Loop
  useEffect(() => {
      let interval: any = null;
      if (isFastForwarding && !gameOver && !gameClear && !menuOpen && !shopState.active) {
          interval = setInterval(() => {
              // Safety check: Stop if enemies nearby
              const nearby = enemies.some(e => Math.abs(e.x - player.x) <= 2 && Math.abs(e.y - player.y) <= 2);
              if (nearby) {
                  setIsFastForwarding(false);
                  addLog("敵が近くにいる！", "red");
                  return;
              }
              // Stop if full HP and hunger is ok
              if (player.hp >= player.maxHp && belly > 20) {
                  if (player.hp === player.maxHp) {
                      setIsFastForwarding(false);
                      addLog("HPが回復した。", C2);
                      return;
                  }
              }
              // Stop if starving
              if (belly <= 0) {
                  setIsFastForwarding(false);
                  return;
              }

              processTurn(player.x, player.y);
          }, 50); // Fast speed
      }
      return () => {
          if (interval) clearInterval(interval);
      };
  }, [isFastForwarding, enemies, player.hp, belly, gameOver, gameClear]);


  const toggleMenu = () => {
      if (shopState.active) {
          setShopState(prev => ({ ...prev, active: false }));
          return;
      }
      if (menuOpen) {
          setMenuOpen(false);
          setSynthState({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null });
      } else {
          setMenuOpen(true);
          setSelectedItemIndex(0);
      }
      audioService.playSound('select');
  };

  const startEndlessMode = () => { setIsEndless(true); setGameClear(false); setFloor(f => f + 1); generateFloor(floor + 1); addLog("中学生編(エンドレス)開始！"); };

  const handleSynthesisStep = () => {
      const idx = synthState.mode === 'BLANK' ? blankScrollSelectionIndex : selectedItemIndex;
      const item = inventory[idx];
      
      if (synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
          // Identify known scrolls
          const knownTypes = Array.from(identifiedTypes).filter(t => t.startsWith('SCROLL'));
          const targetType = knownTypes[idx];
          const template = ITEM_DB[targetType];
          
          if (template) {
              const blankIdx = synthState.baseIndex!;
              // Replace Blank with target scroll
              const newItem = { ...template, id: `scribed-${Date.now()}` };
              const newInv = [...inventory];
              newInv[blankIdx] = newItem;
              setInventory(newInv);
              addLog("名前を書き込んだ！");
              setSynthState({ ...synthState, active: false });
              setMenuOpen(false);
              processTurn(player.x, player.y);
          }
          return;
      }

      if (synthState.step === 'SELECT_BASE') {
          if (synthState.mode === 'SYNTH') {
              if (['WEAPON', 'ARMOR'].includes(item.category)) {
                  setSynthState({ ...synthState, step: 'SELECT_MAT', baseIndex: idx });
                  addLog("合成する素材を選んでください");
                  audioService.playSound('select');
              } else { addLog("それはベースにできません", "red"); audioService.playSound('wrong'); }
          } else if (synthState.mode === 'CHANGE') {
              setSynthState({ ...synthState, step: 'SELECT_TARGET', baseIndex: idx });
              addLog("変化させるアイテムを選んでください");
          }
      } else if (synthState.step === 'SELECT_MAT') {
          if (idx === synthState.baseIndex) { addLog("同じアイテムは選べません", "red"); audioService.playSound('wrong'); return; }
          if (['WEAPON', 'ARMOR'].includes(item.category)) {
              const baseIdx = synthState.baseIndex!;
              const baseItem = inventory[baseIdx];
              const matItem = item;
              if (baseItem.category !== matItem.category) { addLog("種類が違うと合成できません", "red"); audioService.playSound('wrong'); return; }
              
              // Synthesis Logic: Base Type determines nature. Adds Plus values.
              const newPlus = (baseItem.plus || 0) + (matItem.plus || 0) + 1;
              const newItem: Item = { ...baseItem, plus: newPlus, name: `${baseItem.name.split('+')[0]}+${newPlus}` };
              
              const glueIdx = inventory.findIndex(i => i.type === 'POT_GLUE');
              if (glueIdx === -1) { setSynthState({ ...synthState, active: false }); return; }
              let newInv = inventory.map((it, i) => i === baseIdx ? newItem : it).filter((_, i) => i !== idx && i !== glueIdx);
              setInventory(newInv);
              addLog(`合成成功！${newItem.name}になった！`, "yellow");
              addVisualEffect('FLASH', 0, 0);
              audioService.playSound('buff');
              setSynthState({ ...synthState, active: false });
              setMenuOpen(false);
              processTurn(player.x, player.y);
          } else { addLog("それは素材にできません", "red"); audioService.playSound('wrong'); }
      } else if (synthState.step === 'SELECT_TARGET') {
          const potIdx = synthState.baseIndex!;
          if (idx === potIdx) { addLog("壺自身は選べません", "red"); return; }
          const keys = Object.keys(ITEM_DB);
          const key = keys[Math.floor(Math.random() * keys.length)];
          const template = ITEM_DB[key];
          const newItem: Item = { ...template, id: `changed-${Date.now()}`, plus: 0 };
          let newInv = inventory.map((it, i) => i === idx ? newItem : it).filter((_, i) => i !== potIdx);
          setInventory(newInv);
          addLog(`アイテムが${newItem.name}に変化した！`, "yellow");
          addVisualEffect('FLASH', 0, 0);
          audioService.playSound('buff');
          setSynthState({ ...synthState, active: false });
          setMenuOpen(false);
          processTurn(player.x, player.y);
      }
  };

  const executeStaffEffect = (item: Item, target: Entity | null, x: number, y: number): { hit: boolean, msg?: string } => {
      let hit = false;
      let msg = "";

      // Visual Effect for Staff: Moving Projectile
      addVisualEffect('MAGIC_PROJ', 0, 0, {
          startX: player.x,
          startY: player.y,
          targetX: target ? target.x : x, 
          targetY: target ? target.y : y,
          duration: 5,
          maxDuration: 5
      });

      if (item.type === 'UMB_FIRE') {
          addVisualEffect('BEAM', x, y, { color: 'red' });
          if (target) {
              const dmg = 20;
              const nhp = target.hp - dmg;
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: nhp } : e).filter(e => e.hp > 0));
              if (nhp <= 0) { gainXp(target.xp); msg = `${target.name}を燃やした！`; }
              else { msg = `${target.name}に${dmg}ダメージ！`; }
              hit = true;
          }
      } else if (item.type === 'UMB_THUNDER') {
          addVisualEffect('THUNDER', x, y);
          if (target) {
              const dmg = 25;
              const nhp = target.hp - dmg;
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: nhp } : e).filter(e => e.hp > 0));
              if (nhp <= 0) { gainXp(target.xp); msg = `${target.name}に落雷！`; }
              else { msg = `${target.name}に${dmg}ダメージ！`; }
              hit = true;
          }
      } else if (item.type === 'UMB_SLEEP') {
          addVisualEffect('TEXT', x, y, {value: 'Zzz', color: 'blue'});
          if (target) {
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, status: { ...e.status, sleep: 10 } } : e));
              msg = `${target.name}は眠ってしまった。`;
              hit = true;
          }
      } else if (item.type === 'UMB_BLOW') {
          if (target) {
              // Knockback 5 tiles
              let tx = target.x; let ty = target.y;
              const dx = target.x - player.x; const dy = target.y - player.y; // Simplified dir
              const dist = Math.max(1, Math.abs(dx) + Math.abs(dy)); // Manhattan
              const ndx = Math.sign(dx); const ndy = Math.sign(dy);
              
              for (let i=0; i<5; i++) {
                  if (map[ty+ndy][tx+ndx] !== 'WALL' && !enemies.some(e=>e.x===tx+ndx && e.y===ty+ndy)) {
                      tx += ndx; ty += ndy;
                  } else { break; }
              }
              if (tx !== target.x || ty !== target.y) {
                  setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: tx, y: ty } : e));
                  msg = `${target.name}を吹き飛ばした！`;
                  hit = true;
              } else { msg = "吹き飛ばなかった。"; hit = true; }
          }
      } else if (item.type === 'UMB_WARP') {
          if (target) {
              let attempts = 0;
              while (attempts < 20) {
                  attempts++;
                  const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H);
                  if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry) && (rx !== player.x || ry !== player.y)) {
                      setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: rx, y: ry } : e));
                      msg = `${target.name}はどこかへ消えた。`; hit = true; break;
                  }
              }
          }
      } else if (item.type === 'UMB_CHANGE') {
          if (target) {
              const px = player.x; const py = player.y;
              setPlayer(p => ({...p, x: target.x, y: target.y }));
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: px, y: py } : e));
              msg = `${target.name}と入れ替わった！`; hit = true;
          }
      } else if (item.type === 'UMB_BIND') {
          if (target) {
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, status: { ...e.status, frozen: 10 } } : e));
              msg = `${target.name}は金縛りにあった！`; hit = true;
          }
      } else if (item.type === 'UMB_HEAL') {
          if (target) {
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: e.maxHp } : e));
              msg = `${target.name}が回復してしまった！`; hit = true;
          } else {
              // Self heal if no target? But staff usually target enemy. 
              // Standard rogue: wave hits front. 
              // Let's say if no enemy, wave fails to do anything special (waste charge).
          }
      }

      // Self target staffs (Unusual but possible for Warp/Heal if logic allowed, but staying classic)
      return { hit, msg };
  };

  const handleThrowItem = (index: number) => {
      const item = inventory[index];
      if (!item) return;
      
      const { x: dx, y: dy } = player.dir;
      let lx = player.x, ly = player.y;
      let hitEntity: Entity | null = null;

      for (let i=1; i<=10; i++) {
          const tx = player.x + dx * i;
          const ty = player.y + dy * i;
          lx = tx; ly = ty;
          if (map[ty][tx] === 'WALL') { addLog("壁に当たった。"); break; }
          const target = enemies.find(e => e.x === tx && e.y === ty);
          if (target) { hitEntity = target; break; }
      }

      addVisualEffect('PROJECTILE', lx, ly, { dir: player.dir, duration: 10 });
      setInventory(prev => prev.filter((_, i) => i !== index));

      if (hitEntity) {
          // Effect on Hit
          let dmg = 2; // Base throw dmg
          let msg = "";
          
          if (item.category === 'WEAPON' || item.category === 'RANGED') dmg = 5 + (item.power || 0);
          if (item.category === 'ARMOR') dmg = 3 + (item.power || 0);
          if (item.type === 'POT_GLUE') { hitEntity.status.frozen = 10; addLog(`${hitEntity.name}はのりで固まった！`); }
          if (item.type.includes('POISON')) { addLog(`${hitEntity.name}に毒を与えた！`); dmg += 10; }
          if (item.type === 'SCROLL_SLEEP') { hitEntity.status.sleep = 10; addLog(`${hitEntity.name}は眠ってしまった！`); }
          
          if (item.category === 'STAFF') {
              // Thrown staff activates effect
              const res = executeStaffEffect(item, hitEntity, hitEntity.x, hitEntity.y);
              if (res.msg) addLog(res.msg);
              // Identify if hit
              if (!identifiedTypes.has(item.type)) {
                  setIdentifiedTypes(prev => new Set(prev).add(item.type));
                  addLog(`${idMap[item.type]}は${item.name}だった！`, "yellow");
              }
          } else {
              const newEnemies = enemies.map(e => {
                  if (e.id === hitEntity!.id) {
                      const nhp = e.hp - dmg;
                      return { ...e, hp: nhp };
                  }
                  return e;
              });
              const dead = newEnemies.find(e => e.id === hitEntity!.id && e.hp <= 0);
              if(dead) { gainXp(dead.xp); addLog(`${dead.name}を倒した！`); }
              else { addLog(`${hitEntity.name}に${dmg}ダメージ！`); addVisualEffect('TEXT', hitEntity.x, hitEntity.y, {value:`${dmg}`}); }
              setEnemies(newEnemies.filter(e => e.hp > 0));
          }
          
          audioService.playSound('attack');
      } else {
          // Drop on floor at lx, ly
          if (map[ly][lx] !== 'WALL' && !floorItems.find(i=>i.x===lx && i.y===ly)) {
              setFloorItems(prev => [...prev, {
                  id: Date.now() + Math.random(), type: 'ITEM', x: lx, y: ly, char: '!', name: item.name, 
                  hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                  status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0 },
                  itemData: item
              }]);
              addLog("飛んでいった。");
          } else {
              addLog("彼方へ消え去った。");
          }
      }
      setMenuOpen(false);
      processTurn(player.x, player.y);
  };

  const handleItemAction = (index: number) => {
      const item = inventory[index];
      if (!item) return;

      // Staff (Umbrella) Logic
      if (item.category === 'STAFF') {
          // Action is "Wave" (振る)
          // Find target in front
          const { x: dx, y: dy } = player.dir;
          let target: Entity | null = null;
          // Simple beam range? Standard is usually unlimited or visible range. Let's do 10 tiles.
          let tx = player.x, ty = player.y;
          for(let i=1; i<=10; i++) {
              tx += dx; ty += dy;
              if (map[ty][tx] === 'WALL') break;
              const e = enemies.find(en => en.x === tx && en.y === ty);
              if (e) { target = e; break; }
          }

          // Decrease charge
          if ((item.charges || 0) > 0) {
              const res = executeStaffEffect(item, target, player.x + dx, player.y + dy); // Visual start from adj
              if (res.msg) addLog(res.msg);
              else addLog("しかし何も起こらなかった。"); // Missed or resisted

              // Decrement charge
              const newCharges = (item.charges || 0) - 1;
              const newItem = { ...item, charges: newCharges };
              setInventory(prev => prev.map((it, i) => i === index ? newItem : it));
              
              if (!identifiedTypes.has(item.type)) {
                  setIdentifiedTypes(prev => new Set(prev).add(item.type));
                  addLog(`${idMap[item.type]}は${item.name}だった！`, "yellow");
              }
              
              audioService.playSound('buff');
              setMenuOpen(false);
              processTurn(player.x, player.y);
          } else {
              addLog("魔力が尽きている！"); // No turn passed
          }
          return;
      }

      if (item.type === 'POT_GLUE') {
          setSynthState({ active: true, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null });
          addLog("合成のベースとなる装備を選んでください");
          audioService.playSound('select');
          return; 
      }
      if (item.type === 'POT_CHANGE') {
          setSynthState({ active: true, mode: 'CHANGE', step: 'SELECT_BASE', baseIndex: index }); 
          setSynthState(prev => ({...prev, step: 'SELECT_TARGET'}));
          addLog("変化させるアイテムを選んでください");
          audioService.playSound('select');
          return;
      }
      if (item.type === 'SCROLL_BLANK') {
          if (identifiedTypes.size === 0) {
              addLog("書き込める内容を知らない...", "red");
              return;
          }
          setSynthState({ active: true, mode: 'BLANK', step: 'SELECT_EFFECT', baseIndex: index });
          addLog("何を書き込みますか？");
          audioService.playSound('select');
          return;
      }

      let actionDone = false;

      if (item.category === 'WEAPON' || item.category === 'ARMOR') {
          setPlayer(p => {
              const slot = item.category === 'WEAPON' ? 'weapon' : 'armor';
              const currentEquip = p.equipment ? p.equipment[slot] : null;
              const newEquipment = { ...p.equipment!, [slot]: item };
              const newInv = [...inventory];
              newInv.splice(index, 1); 
              if (currentEquip) newInv.push(currentEquip); 
              setInventory(newInv);
              addLog(`${getItemName(item)}を装備した。`);
              return { ...p, equipment: newEquipment };
          });
          actionDone = true;
      } else if (item.category === 'CONSUMABLE') {
          if (item.type.includes('ONIGIRI') || item.type.includes('MEAT')) { 
              setBelly(Math.min(maxBelly, belly + (item.value || 50)));
              if (item.type.includes('MEAT')) {
                  // Meat Bonus Effect
                  setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 50) }));
                  addLog(`${item.name}を食べた。元気が出た！`); 
              } else {
                  addLog(`${item.name}を食べた。満腹！`); 
              }
              actionDone = true; 
          }
          else if (item.type.includes('HEAL')) { setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + (item.value || 30)) })); addLog("HPが回復した！"); actionDone = true; addVisualEffect('TEXT', player.x, player.y, {value: 'Heal', color: 'green'}); }
          else if (item.type === 'SCROLL_MAP') { setShowMap(true); addLog("校内図が頭に入った！"); actionDone = true; addVisualEffect('FLASH', 0, 0); }
          else if (item.type === 'SCROLL_THUNDER' || item.type === 'BOMB') {
              const isBomb = item.type === 'BOMB';
              if (isBomb) { addVisualEffect('EXPLOSION', player.x, player.y); } else { addVisualEffect('THUNDER', 0, 0); triggerShake(10); }
              setEnemies(prev => prev.map(e => {
                  const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                  if (item.type === 'BOMB' && dist > 2) return e;
                  const nhp = e.hp - (item.value || 20);
                  addVisualEffect('TEXT', e.x, e.y, {value: `${item.value||20}`, color:'yellow'});
                  if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; }
                  return { ...e, hp: nhp };
              }).filter(e => !e.dead));
              addLog(item.type === 'BOMB' ? "爆発した！" : "雷が落ちた！");
              actionDone = true;
          } else if (item.type === 'SCROLL_SLEEP') {
              setEnemies(prev => prev.map(e => { addVisualEffect('TEXT', e.x, e.y, {value: 'Zzz', color:'blue'}); return { ...e, status: { ...e.status, sleep: 10 } }; }));
              addLog("魔物が眠りについた。"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_WARP') {
              let attempts = 0;
              while (attempts < 20) {
                  attempts++;
                  const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H);
                  if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry)) {
                      setPlayer(p => ({ ...p, x: rx, y: ry }));
                      addLog("ワープした！"); addVisualEffect('FLASH', 0, 0); break;
                  }
              }
              actionDone = true;
          } else if (item.type === 'SCROLL_CONFUSE') {
              setEnemies(prev => prev.map(e => ({ ...e, status: { ...e.status, confused: 10 } })));
              addLog("魔物が混乱した！"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_IDENTIFY') {
              setIdentifiedTypes(prev => {
                  const next = new Set(prev);
                  inventory.forEach(i => next.add(i.type));
                  return next;
              });
              addLog("持ち物が識別された！"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_UP_W') {
              if (player.equipment?.weapon) {
                  const w = player.equipment.weapon;
                  const newW = { ...w, plus: (w.plus || 0) + 1, name: w.name.split('+')[0] + '+' + ((w.plus || 0) + 1) };
                  setPlayer(p => ({ ...p, equipment: { ...p.equipment!, weapon: newW } }));
                  addLog("武器が強化された！"); actionDone = true;
              } else { addLog("武器を装備していない。"); }
          } else if (item.type === 'SCROLL_UP_A') {
              if (player.equipment?.armor) {
                  const a = player.equipment.armor;
                  const newA = { ...a, plus: (a.plus || 0) + 1, name: a.name.split('+')[0] + '+' + ((a.plus || 0) + 1) };
                  setPlayer(p => ({ ...p, equipment: { ...p.equipment!, armor: newA } }));
                  addLog("防具が強化された！"); actionDone = true;
              } else { addLog("防具を装備していない。"); }
          }
          
          if (actionDone) {
              setInventory(prev => prev.filter((_, i) => i !== index));
              setSelectedItemIndex(prev => Math.min(prev, inventory.length - 2)); 
          }
      } else if (item.category === 'RANGED') {
          // Equip Logic for Ranged
          setPlayer(p => {
              const currentEquip = p.equipment ? p.equipment.ranged : null;
              const newEquipment = { ...p.equipment!, ranged: item };
              const newInv = [...inventory];
              newInv.splice(index, 1); 
              if (currentEquip) newInv.push(currentEquip); 
              setInventory(newInv);
              addLog(`${item.name}を装備した。`);
              return { ...p, equipment: newEquipment };
          });
          actionDone = true;
      }

      if (actionDone) {
          setMenuOpen(false);
          processTurn(player.x, player.y);
          audioService.playSound('select');
      }
  };

  const handleDropItem = (index: number) => {
      const item = inventory[index];
      if (!item || synthState.active) return;
      let newEquip = player.equipment;
      let changed = false;
      if (player.equipment?.weapon === item) { newEquip = { ...newEquip!, weapon: null }; changed = true; }
      else if (player.equipment?.armor === item) { newEquip = { ...newEquip!, armor: null }; changed = true; }
      else if (player.equipment?.ranged === item) { newEquip = { ...newEquip!, ranged: null }; changed = true; }
      if (changed) setPlayer(p => ({ ...p, equipment: newEquip }));
      const newInv = inventory.filter((_, i) => i !== index);
      setInventory(newInv);
      const droppedEntity: Entity = {
          id: Date.now() + Math.random(), type: 'ITEM', x: player.x, y: player.y, char: '!', name: item.name,
          hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: { x: 0, y: 0 },
          status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0 },
          itemData: item
      };
      setFloorItems(prev => [...prev, droppedEntity]);
      addLog(`${getItemName(item)}を足元に置いた。`);
      audioService.playSound('select');
      setSelectedItemIndex(prev => Math.min(prev, newInv.length - 1));
      if (newInv.length === 0) setMenuOpen(false);
  };

  const handleUnequip = (slot: 'weapon'|'armor'|'ranged') => {
      const item = player.equipment?.[slot];
      if (item) {
          if (inventory.length < MAX_INVENTORY) {
              setPlayer(p => ({ ...p, equipment: { ...p.equipment!, [slot]: null } }));
              setInventory(prev => [...prev, item]);
              addLog(`${getItemName(item)}を外した。`);
              processTurn(player.x, player.y);
          } else { addLog("持ち物がいっぱいで外せない！"); }
      }
  };

  const handleTouchStart = (item: Item) => { longPressTimer.current = setTimeout(() => { setInspectedItem(item); }, 500); };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  // --- KEYBOARD ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) { e.preventDefault(); }
        if (gameOver) { if (['z', 'Enter', ' '].includes(e.key)) startNewGame(); return; }
        if (gameClear) { if (['z', 'Enter', ' '].includes(e.key)) startEndlessMode(); return; }
        if (['x', 'c', 'Escape'].includes(e.key)) { toggleMenu(); return; }
        if ((menuOpen || shopState.active) && (e.key === 'Backspace' || e.key === 'x')) {
            if (shopState.active) { setShopState(prev => ({...prev, active: false})); return; }
            if (synthState.active) { setSynthState({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null }); } else { setMenuOpen(false); }
            return;
        }
        if (menuOpen || shopState.active) {
            const listLength = shopState.active && shopState.mode === 'BUY' 
                ? (enemies.find(e=>e.id===shopState.merchantId)?.shopItems?.length||0) 
                : inventory.length;
            if (e.key === 'ArrowUp') setSelectedItemIndex(prev => Math.max(0, prev - 1));
            if (e.key === 'ArrowDown') setSelectedItemIndex(prev => Math.min(listLength - 1, prev + 1));
            if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') handleActionBtn();
            return;
        }
        switch(e.key) {
            case 'ArrowUp': case 'w': case '8': case 'k': movePlayer(0, -1); break;
            case 'ArrowDown': case 's': case '2': case 'j': movePlayer(0, 1); break;
            case 'ArrowLeft': case 'a': case '4': case 'h': movePlayer(-1, 0); break;
            case 'ArrowRight': case 'd': case '6': case 'l': movePlayer(1, 0); break;
            case 'Home': case '7': case 'y': movePlayer(-1, -1); break;
            case 'PageUp': case '9': case 'u': movePlayer(1, -1); break;
            case 'End': case '1': case 'b': movePlayer(-1, 1); break;
            case 'PageDown': case '3': case 'n': movePlayer(1, 1); break;
            case 'z': case ' ': case 'Enter': handleActionBtn(); break;
            case 'r': fireRangedWeapon(); break; // Keyboard shortcut for ranged
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, map, enemies, floorItems, menuOpen, gameOver, gameClear, inventory, selectedItemIndex, synthState, shopState]);

  // --- RENDER LOOP ---
  const frameCountRef = useRef(0);
  useEffect(() => {
      const loop = setInterval(() => {
          frameCountRef.current++;
          renderGame();
      }, 50); 
      return () => clearInterval(loop);
  }, [map, player, enemies, floorItems, menuOpen]);

  const renderGame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (!map || map.length === 0) return;

      const w = canvas.width;
      const h = canvas.height;
      const ts = TILE_SIZE * SCALE;

      // FIX: Fill background FIRST to prevent artifacts during shake
      ctx.fillStyle = C0;
      ctx.fillRect(0, 0, w, h);

      ctx.save();

      if (shake.current.duration > 0) {
          const mag = 4;
          const sx = (Math.random() - 0.5) * mag;
          const sy = (Math.random() - 0.5) * mag;
          ctx.translate(sx, sy);
          shake.current.duration--;
      }

      const startX = player.x - Math.floor(VIEW_W/2);
      const startY = player.y - Math.floor(VIEW_H/2);

      for (let y = 0; y < VIEW_H; y++) {
          for (let x = 0; x < VIEW_W; x++) {
              const mx = startX + x;
              const my = startY + y;
              const sx = x * ts;
              const sy = y * ts;

              if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) {
                  ctx.fillStyle = C0;
                  ctx.fillRect(sx, sy, ts, ts);
                  continue;
              }

              const tile = map[my][mx];
              
              if (tile === 'WALL') {
                  ctx.fillStyle = C1;
                  ctx.fillRect(sx, sy, ts, ts);
                  ctx.fillStyle = C0;
                  ctx.fillRect(sx+ts/4, sy+ts/4, ts/2, ts/2);
              } else {
                  ctx.fillStyle = C3;
                  ctx.fillRect(sx, sy, ts, ts);
                  if (tile === 'STAIRS') {
                      ctx.fillStyle = C1;
                      for(let i=0; i<3; i++) ctx.fillRect(sx, sy + i*(ts/3), ts, 2);
                  }
              }

              const item = floorItems.find(i => i.x === mx && i.y === my);
              if (item) {
                  let spriteKey = 'CONSUMABLE';
                  if (item.type === 'GOLD') {
                      spriteKey = 'GOLD_BAG';
                  } else if (item.itemData) {
                      const cat = item.itemData.category;
                      if (cat === 'WEAPON') spriteKey = 'WEAPON';
                      if (cat === 'ARMOR') spriteKey = 'ARMOR';
                      if (cat === 'RANGED') spriteKey = 'RANGED';
                      if (cat === 'STAFF') spriteKey = 'STAFF';
                      if (item.itemData.type === 'POT_GLUE') spriteKey = 'SYNTH';
                  }
                  
                  const sprite = spriteCache.current[spriteKey];
                  if (sprite) {
                      ctx.drawImage(sprite, sx, sy, ts, ts);
                  } else {
                      ctx.fillStyle = C1;
                      ctx.fillRect(sx + 4*SCALE, sy + 4*SCALE, 8*SCALE, 8*SCALE);
                  }
              }

              const enemy = enemies.find(e => e.x === mx && e.y === my);
              if (enemy) {
                  const spriteKey = enemy.enemyType || 'SLIME';
                  const sprite = spriteCache.current[spriteKey];
                  const offX = (enemy.offset?.x || 0) * SCALE;
                  const offY = (enemy.offset?.y || 0) * SCALE;

                  if (sprite) {
                      if (enemy.status.sleep > 0) ctx.globalAlpha = 0.5;
                      ctx.drawImage(sprite, sx + offX, sy + offY, ts, ts);
                      ctx.globalAlpha = 1.0;
                      if (enemy.status.sleep > 0) { ctx.fillStyle='white'; ctx.font='10px monospace'; ctx.fillText('Zzz', sx, sy); }
                  } else {
                      ctx.fillStyle = C1;
                      ctx.fillRect(sx + 2*SCALE + offX, sy + 2*SCALE + offY, 12*SCALE, 12*SCALE);
                  }
              }

              if (mx === player.x && my === player.y) {
                  let spriteKey = 'PLAYER_FRONT';
                  let flip = false;
                  if (player.dir.y === -1) spriteKey = 'PLAYER_BACK';
                  else if (player.dir.x !== 0) {
                      spriteKey = 'PLAYER_SIDE';
                      if (player.dir.x === -1) flip = true;
                  }
                  const sprite = spriteCache.current[spriteKey];
                  const offX = (player.offset?.x || 0) * SCALE;
                  const offY = (player.offset?.y || 0) * SCALE;

                  if (sprite) {
                      if (flip) {
                          ctx.save();
                          ctx.translate(sx + ts + offX, sy + offY);
                          ctx.scale(-1, 1);
                          ctx.drawImage(sprite, 0, 0, ts, ts);
                          ctx.restore();
                      } else {
                          ctx.drawImage(sprite, sx + offX, sy + offY, ts, ts);
                      }
                  } else {
                      ctx.fillStyle = C0;
                      ctx.fillRect(sx + 3*SCALE + offX, sy + 3*SCALE + offY, 10*SCALE, 10*SCALE);
                  }
              }
          }
      }

      visualEffects.current.forEach((fx, i) => {
          fx.duration--;
          
          let currentX = fx.x;
          let currentY = fx.y;

          // Moving Projectile Logic
          if (fx.type === 'MAGIC_PROJ' && fx.startX !== undefined && fx.targetX !== undefined && fx.startY !== undefined && fx.targetY !== undefined) {
              const progress = 1 - (fx.duration / fx.maxDuration);
              currentX = fx.startX + (fx.targetX - fx.startX) * progress;
              currentY = fx.startY + (fx.targetY - fx.startY) * progress;
              
              const sprite = spriteCache.current['MAGIC_BULLET'];
              const sx = (currentX - startX) * ts;
              const sy = (currentY - startY) * ts;
              
              if (sprite) {
                   if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                       ctx.drawImage(sprite, sx, sy, ts, ts);
                   }
              }
              return; // Skip standard rendering for this special type
          }

          const sx = (fx.x - startX) * ts;
          const sy = (fx.y - startY) * ts;
          
          if (fx.type === 'FLASH' || fx.type === 'THUNDER') {
              ctx.fillStyle = fx.type === 'THUNDER' ? 'yellow' : 'white';
              ctx.globalAlpha = fx.duration / (fx.maxDuration || 20);
              ctx.fillRect(0, 0, w, h);
              ctx.globalAlpha = 1.0;
          }
          else if (fx.type === 'SLASH') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.strokeStyle = 'white';
                  ctx.lineWidth = 4;
                  ctx.beginPath();
                  const d = fx.dir || {x:1, y:0};
                  const cx = sx + ts/2;
                  const cy = sy + ts/2;
                  ctx.moveTo(cx - d.y*10 - d.x*10, cy - d.x*10 + d.y*10);
                  ctx.lineTo(cx + d.y*10 + d.x*10, cy + d.x*10 - d.y*10);
                  ctx.stroke();
              }
          }
          else if (fx.type === 'EXPLOSION') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.fillStyle = ['white', 'orange', 'red'][Math.floor(Math.random()*3)];
                  const rad = (1 - fx.duration / fx.maxDuration) * ts * (fx.scale || 2);
                  ctx.beginPath();
                  ctx.arc(sx + ts/2, sy + ts/2, rad, 0, Math.PI*2);
                  ctx.fill();
              }
          }
          else if (fx.type === 'BEAM') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.strokeStyle = fx.color || 'red';
                  ctx.lineWidth = 5;
                  ctx.beginPath();
                  ctx.moveTo(sx + ts/2, sy + ts/2);
                  ctx.arc(sx + ts/2, sy + ts/2, 20, 0, Math.PI*2);
                  ctx.stroke();
              }
          }
          else if (fx.type === 'PROJECTILE') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.fillStyle = '#9bbc0f';
                  ctx.beginPath();
                  ctx.arc(sx + ts/2, sy + ts/2, 4 * SCALE, 0, Math.PI*2);
                  ctx.fill();
              }
          }
          else if (fx.type === 'TEXT') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.fillStyle = fx.color || 'white';
                  ctx.font = 'bold 16px monospace';
                  ctx.strokeStyle = 'black';
                  ctx.lineWidth = 2;
                  const lift = (1 - fx.duration / fx.maxDuration) * 20;
                  ctx.strokeText(fx.value || '', sx + ts/2, sy - lift + ts);
                  ctx.fillText(fx.value || '', sx + ts/2, sy - lift + ts);
              }
          }
      });
      visualEffects.current = visualEffects.current.filter(fx => fx.duration > 0);

      ctx.restore();
  };

  const getInspectedDescription = (item: Item) => {
      if (item.category === 'STAFF' && !identifiedTypes.has(item.type)) {
          return "振ってみるまで分からない。";
      }
      return item.desc;
  };

  return (
    <div className="w-full h-full bg-[#101010] flex flex-col md:flex-row items-center justify-center font-mono select-none overflow-hidden touch-none relative p-4 gap-4">
        
        {inspectedItem && (
            <div className="absolute inset-0 z-50 bg-[#0f380f]/95 flex items-center justify-center p-4" onClick={() => setInspectedItem(null)}>
                <div className="w-full max-w-xs bg-[#9bbc0f] border-4 border-[#306230] p-4 shadow-xl text-[#0f380f]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-2 border-b-2 border-[#306230] pb-1">
                        <h3 className="font-bold text-lg">{getItemName(inspectedItem)} {inspectedItem.plus ? `+${inspectedItem.plus}` : ''} {inspectedItem.count ? `(${inspectedItem.count})` : ''} {inspectedItem.category === 'STAFF' ? `[${inspectedItem.charges}]` : ''}</h3>
                        <button onClick={() => setInspectedItem(null)}><X size={20}/></button>
                    </div>
                    <div className="text-sm mb-4 min-h-[3rem]">{getInspectedDescription(inspectedItem)}</div>
                    <div className="text-xs font-bold grid grid-cols-2 gap-2">
                        <div>分類: {inspectedItem.category}</div>
                        {inspectedItem.power && <div>威力: {inspectedItem.power}</div>}
                        {inspectedItem.value && <div>効果: {inspectedItem.value}</div>}
                    </div>
                </div>
            </div>
        )}

        {/* Help Screen */}
        {showHelp && (
            <div className="absolute inset-0 z-50 bg-[#0f380f]/95 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
                <div className="w-full max-w-md bg-[#9bbc0f] border-4 border-[#306230] p-6 shadow-xl text-[#0f380f] overflow-y-auto max-h-[80vh] custom-scrollbar" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b-2 border-[#306230] pb-2">
                        <h2 className="font-bold text-xl flex items-center"><HelpCircle className="mr-2"/> 遊び方</h2>
                        <button onClick={() => setShowHelp(false)}><X size={24}/></button>
                    </div>
                    <div className="space-y-4 text-sm">
                        <section>
                            <h3 className="font-bold border-b border-[#306230] mb-1">目的</h3>
                            <p>地下20階を目指し、校長先生を説得(撃破)してください。<br/>道中で落ちている武器や道具を駆使して生き残りましょう。</p>
                        </section>
                        <section>
                            <h3 className="font-bold border-b border-[#306230] mb-1">操作方法</h3>
                            <ul className="list-disc pl-5">
                                <li><strong>移動:</strong> 十字キー または 画面パッド</li>
                                <li><strong>攻撃:</strong> Aボタン または Zキー</li>
                                <li><strong>メニュー:</strong> Bボタン または Xキー</li>
                                <li><strong>飛び道具:</strong> <Crosshair size={12} className="inline"/>ボタン または Rキー</li>
                                <li><strong>早送り:</strong> Aボタン長押し (敵がいない時)</li>
                            </ul>
                        </section>
                        <section>
                            <h3 className="font-bold border-b border-[#306230] mb-1">ヒント</h3>
                            <ul className="list-disc pl-5">
                                <li>お腹が減るとHPが減ります。おにぎりやパンを食べましょう。</li>
                                <li><strong className="text-red-700">傘(杖)</strong>は振ると魔法が出ますが、回数制限があります。使い切ったら投げましょう。</li>
                                <li>「工作のり」を使うと、装備を合成して強くできます。</li>
                                <li>敵に囲まれたら通路に逃げ込みましょう。</li>
                                <li>まれに購買部員(店)が現れます。アイテム売買が可能です。</li>
                            </ul>
                        </section>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="mt-6 w-full py-2 bg-[#306230] text-[#9bbc0f] font-bold rounded">閉じる</button>
                </div>
            </div>
        )}

        <div className="w-full max-w-md flex flex-col items-center gap-2">
            <div className="w-full aspect-[11/9] relative shrink-0">
                <div className="w-full h-full bg-[#9bbc0f] border-4 border-[#0f380f] relative overflow-hidden shadow-lg rounded-sm">
                    
                    <div className="absolute top-0 left-0 w-full h-8 bg-[#0f380f] text-[#9bbc0f] flex justify-between items-center px-2 text-[10px] z-10 border-b border-[#306230]">
                        <div className="flex gap-2">
                            <span className="flex items-center"><Sword size={8} className="mr-1"/>{player.equipment?.weapon ? getItemName(player.equipment.weapon) : '-'}</span>
                            <span className="flex items-center"><Shield size={8} className="mr-1"/>{player.equipment?.armor ? getItemName(player.equipment.armor) : '-'}</span>
                            <span className="flex items-center"><Target size={8} className="mr-1"/>{player.equipment?.ranged ? getItemName(player.equipment.ranged) : '-'}</span>
                        </div>
                        <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 hover:text-white"><HelpCircle size={10}/> Help</button>
                    </div>

                    <div className="absolute top-8 left-0 w-full h-5 bg-[#306230] text-[#9bbc0f] flex justify-between items-center px-2 text-xs font-bold z-10">
                        <span>{floor}F</span>
                        <span>Lv{level}</span>
                        <span>HP{player.hp}/{player.maxHp}</span>
                        <span className="flex items-center"><Coins size={10} className="mr-0.5"/>{player.gold}</span>
                        <span>🍙{belly}%</span>
                    </div>

                    <canvas ref={canvasRef} width={VIEW_W * TILE_SIZE * SCALE} height={VIEW_H * TILE_SIZE * SCALE} className="w-full h-full object-contain pixel-art mt-6" style={{ imageRendering: 'pixelated' }} />

                    {/* Fast Forward Indicator */}
                    {isFastForwarding && (
                        <div className="absolute top-16 right-2 text-[#9bbc0f] animate-pulse flex items-center bg-[#0f380f]/50 rounded px-2">
                            <FastForward size={16} className="mr-1"/> 早送り中
                        </div>
                    )}

                    {showMap && map.length > 0 && (
                        <div className="absolute inset-0 bg-[#0f380f]/90 z-20 flex items-center justify-center p-8 mt-12">
                            <div className="w-full h-full border border-[#9bbc0f] grid" style={{ gridTemplateColumns: `repeat(${MAP_W}, 1fr)` }}>
                                {map.map((row, y) => row.map((tile, x) => (
                                    <div key={`${x}-${y}`} className={`${tile === 'WALL' ? 'bg-transparent' : (tile === 'STAIRS' ? 'bg-[#9bbc0f]' : 'bg-[#306230]')}`}>
                                        {x === player.x && y === player.y && <div className="w-full h-full bg-white rounded-full animate-pulse"></div>}
                                    </div>
                                )))}
                            </div>
                            <button onClick={() => setShowMap(false)} className="absolute bottom-4 text-[#9bbc0f] border border-[#9bbc0f] px-2 rounded hover:bg-[#306230]">Close</button>
                        </div>
                    )}

                    {/* Shop Menu */}
                    {shopState.active && (
                        <div className="absolute right-0 top-0 bottom-0 w-3/4 bg-[#0f380f] border-l-2 border-[#9bbc0f] z-30 p-2 text-[#9bbc0f] text-xs flex flex-col">
                            <div className="flex justify-between items-center border-b border-[#9bbc0f] mb-2 pb-1">
                                <h3 className="font-bold flex items-center"><ShoppingBag size={12} className="mr-1"/> 購買部</h3>
                                <button onClick={() => setShopState(prev => ({...prev, active: false}))}><X size={12}/></button>
                            </div>
                            
                            <div className="flex gap-2 mb-2">
                                <button 
                                    className={`flex-1 py-1 text-center border ${shopState.mode === 'BUY' ? 'bg-[#9bbc0f] text-[#0f380f]' : 'border-[#9bbc0f]'}`}
                                    onClick={() => { setShopState(prev => ({ ...prev, mode: 'BUY' })); setSelectedItemIndex(0); }}
                                >
                                    買う
                                </button>
                                <button 
                                    className={`flex-1 py-1 text-center border ${shopState.mode === 'SELL' ? 'bg-[#9bbc0f] text-[#0f380f]' : 'border-[#9bbc0f]'}`}
                                    onClick={() => { setShopState(prev => ({ ...prev, mode: 'SELL' })); setSelectedItemIndex(0); }}
                                >
                                    売る
                                </button>
                            </div>

                            <div className="flex justify-end mb-2 border-b border-[#306230] pb-1">
                                <span className="flex items-center"><Coins size={10} className="mr-1"/> {player.gold} G</span>
                            </div>

                            <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar">
                                {shopState.mode === 'BUY' ? (
                                    enemies.find(e => e.id === shopState.merchantId)?.shopItems?.map((item, i) => (
                                        <div 
                                            key={i} 
                                            className={`flex items-center border ${selectedItemIndex === i ? 'bg-[#8bac0f] text-[#0f380f] border-[#9bbc0f]' : 'border-transparent hover:border-[#9bbc0f]'}`}
                                            onMouseEnter={() => setSelectedItemIndex(i)}
                                        >
                                            <button 
                                                className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center"
                                                onClick={() => handleShopAction()}
                                            >
                                                <span>{getItemName(item)}</span>
                                                <span className="flex items-center gap-1">
                                                    {item.price} G
                                                </span>
                                            </button>
                                            <button 
                                                className="px-2 py-1 border-l border-[#306230] hover:bg-[#306230] hover:text-[#9bbc0f] flex items-center justify-center"
                                                onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }}
                                            >
                                                <Info size={10} />
                                            </button>
                                        </div>
                                    )) || <div className="text-center">売り切れ</div>
                                ) : (
                                    inventory.map((item, i) => (
                                        <div 
                                            key={i} 
                                            className={`flex items-center border ${selectedItemIndex === i ? 'bg-[#8bac0f] text-[#0f380f] border-[#9bbc0f]' : 'border-transparent hover:border-[#9bbc0f]'}`}
                                            onMouseEnter={() => setSelectedItemIndex(i)}
                                        >
                                            <button 
                                                className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center"
                                                onClick={() => handleShopAction()}
                                            >
                                                <span>{getItemName(item)}</span>
                                                <span className="flex items-center gap-1">
                                                    {Math.floor((item.price || (item.value || 100)) / 2)} G
                                                </span>
                                            </button>
                                            <button 
                                                className="px-2 py-1 border-l border-[#306230] hover:bg-[#306230] hover:text-[#9bbc0f] flex items-center justify-center"
                                                onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }}
                                            >
                                                <Info size={10} />
                                            </button>
                                        </div>
                                    ))
                                )}
                                {shopState.mode === 'SELL' && inventory.length === 0 && <div className="text-center">持ち物なし</div>}
                            </div>
                        </div>
                    )}

                    {menuOpen && (
                        <div className="absolute right-0 top-0 bottom-0 w-3/4 bg-[#0f380f] border-l-2 border-[#9bbc0f] z-30 p-2 text-[#9bbc0f] text-xs flex flex-col">
                            <div className="flex justify-between items-center border-b border-[#9bbc0f] mb-2 pb-1">
                                <h3 className="font-bold">
                                    {synthState.active 
                                        ? (synthState.mode === 'BLANK' ? '書き込む内容を選択' : (synthState.step === 'SELECT_BASE' ? (synthState.mode==='CHANGE'?'変化させる物':'ベースを選択') : (synthState.mode==='CHANGE'?'変化':'素材を選択')))
                                        : `MOCHIMONO (${inventory.length}/${MAX_INVENTORY})`
                                    }
                                </h3>
                                <button onClick={toggleMenu}><X size={12}/></button>
                            </div>
                            
                            {synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT' ? (
                                <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar">
                                    {Array.from(identifiedTypes).filter(t => t.startsWith('SCROLL')).map((type, i) => (
                                        <div key={i} className={`flex items-center border ${blankScrollSelectionIndex === i ? 'bg-[#8bac0f] text-[#0f380f] border-[#9bbc0f]' : 'border-transparent'}`}>
                                            <button className="flex-grow text-left px-2 py-1 cursor-pointer" onClick={() => handleSynthesisStep()} onMouseEnter={() => setBlankScrollSelectionIndex(i)}>
                                                {ITEM_DB[type].name}
                                            </button>
                                        </div>
                                    ))}
                                    {Array.from(identifiedTypes).filter(t => t.startsWith('SCROLL')).length === 0 && <div className="text-red-500">識別済みのノートがありません</div>}
                                </div>
                            ) : (
                                <>
                                    {!synthState.active && (
                                        <div className="mb-2 border-b border-[#306230] pb-2">
                                            <div className="text-[#8bac0f] mb-1">装備中:</div>
                                            {player.equipment?.weapon && <div onClick={()=>handleUnequip('weapon')} className="cursor-pointer hover:text-white">[武] {getItemName(player.equipment.weapon)}</div>}
                                            {player.equipment?.armor && <div onClick={()=>handleUnequip('armor')} className="cursor-pointer hover:text-white">[防] {getItemName(player.equipment.armor)}</div>}
                                            {player.equipment?.ranged && <div onClick={()=>handleUnequip('ranged')} className="cursor-pointer hover:text-white">[投] {getItemName(player.equipment.ranged)}</div>}
                                        </div>
                                    )}

                                    <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar">
                                        {inventory.map((item, i) => {
                                            const isSynthTarget = synthState.active && (
                                                (synthState.step === 'SELECT_BASE' && synthState.mode === 'SYNTH' && !['WEAPON','ARMOR'].includes(item.category)) ||
                                                (synthState.step === 'SELECT_MAT' && synthState.baseIndex === i)
                                            );
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`flex items-center border ${selectedItemIndex === i ? 'bg-[#8bac0f] text-[#0f380f] border-[#9bbc0f]' : 'border-transparent hover:border-[#9bbc0f]'} ${isSynthTarget ? 'opacity-30' : ''}`}
                                                    onContextMenu={(e) => { e.preventDefault(); setInspectedItem(item); }}
                                                    onTouchStart={() => handleTouchStart(item)}
                                                    onTouchEnd={handleTouchEnd}
                                                >
                                                    <button 
                                                        className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center"
                                                        onClick={() => !isSynthTarget && (synthState.active ? handleSynthesisStep() : handleItemAction(i))}
                                                        onMouseEnter={() => setSelectedItemIndex(i)}
                                                    >
                                                        <span>
                                                            {getItemName(item)} 
                                                            {item.plus ? `+${item.plus}` : ''} 
                                                            {item.count ? `(${item.count})` : ''}
                                                            {item.category === 'STAFF' ? `[${item.charges}]` : ''}
                                                        </span>
                                                        <span className={`text-[9px] ${selectedItemIndex === i ? 'text-[#0f380f]' : 'text-[#8bac0f]'}`}>
                                                            {synthState.active 
                                                                ? '選択' 
                                                                : (['WEAPON','ARMOR','RANGED'].includes(item.category) ? '装備' : (item.category==='STAFF' ? '振る' : '使う'))
                                                            }
                                                        </span>
                                                    </button>
                                                    {!synthState.active && (
                                                        <button 
                                                            className="px-2 py-1 border-l border-[#306230] hover:bg-[#306230] hover:text-[#9bbc0f] flex items-center justify-center"
                                                            onClick={(e) => { e.stopPropagation(); handleThrowItem(i); }}
                                                            title="投げる"
                                                        >
                                                            <Send size={10} />
                                                        </button>
                                                    )}
                                                    {!synthState.active && (
                                                        <button 
                                                            className="px-2 py-1 border-l border-[#306230] hover:bg-[#306230] hover:text-[#9bbc0f] flex items-center justify-center"
                                                            onClick={(e) => { e.stopPropagation(); handleDropItem(i); }}
                                                            title="足元に置く"
                                                        >
                                                            <ArrowDown size={10} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="px-2 py-1 border-l border-[#306230] hover:bg-[#306230] hover:text-[#9bbc0f] flex items-center justify-center"
                                                        onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }}
                                                        title="詳細"
                                                    >
                                                        <Info size={10} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {inventory.length === 0 && <span className="text-[#306230] text-center">Empty</span>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {gameClear && (
                        <div className="absolute inset-0 bg-[#0f380f]/95 flex flex-col items-center justify-center text-[#9bbc0f] z-40 p-4 text-center">
                            <Award size={48} className="mb-4 text-[#8bac0f]"/>
                            <h2 className="text-2xl font-bold mb-4">GRADUATION!</h2>
                            <p className="mb-2">ついに校長を説得した！</p>
                            <p className="mb-8">君は伝説の小学生となった。</p>
                            <div className="flex flex-col gap-4 w-full">
                                <button onClick={startEndlessMode} className="border-2 border-[#9bbc0f] px-4 py-3 hover:bg-[#306230] animate-pulse font-bold">
                                    中学生編へ (エンドレス)
                                </button>
                                <button onClick={onBack} className="border-2 border-[#306230] px-4 py-2 hover:bg-[#306230] text-sm">
                                    タイトルへ戻る
                                </button>
                            </div>
                        </div>
                    )}

                    {gameOver && (
                        <div className="absolute inset-0 bg-[#0f380f]/90 flex flex-col items-center justify-center text-[#9bbc0f] z-40">
                            <Skull size={48} className="mb-4 text-[#306230]"/>
                            <h2 className="text-2xl font-bold mb-4">GAME OVER</h2>
                            <p>Floor: {floor}</p>
                            <p>Level: {level}</p>
                            <button onClick={startNewGame} className="mt-6 border-2 border-[#9bbc0f] px-4 py-2 hover:bg-[#306230] animate-pulse flex items-center">
                                <RotateCcw size={16} className="mr-2"/> RETRY
                            </button>
                            <button onClick={onBack} className="mt-4 text-sm hover:underline">
                                EXIT
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full bg-[#0f380f] text-[#9bbc0f] h-24 p-1 text-[10px] mb-2 rounded border-2 border-[#306230] font-mono leading-tight flex flex-col justify-end shrink-0 shadow-inner overflow-hidden">
                {logs.slice(-6).map((l) => (
                    <div key={l.id} style={{ color: l.color || '#9bbc0f' }} className="truncate">{l.message}</div>
                ))}
            </div>
        </div>

        <div className="w-full max-w-md md:w-64 md:h-[400px] flex-grow md:flex-grow-0 relative min-h-[220px] bg-[#1a1a1a] rounded-t-xl md:rounded-xl border-t-2 md:border-2 border-[#333]">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-32 h-32 md:left-1/2 md:-translate-x-1/2 md:top-1/4 flex items-center justify-center">
                <div className="w-10 h-10 bg-[#333] z-10"></div>
                <div className="absolute top-0 w-10 h-16 bg-[#333] rounded-t-md border-t border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center pt-2 z-0 touch-none select-none" onClick={() => movePlayer(0, -1)}><ArrowUp className="text-[#666]" size={20}/></div>
                <div className="absolute bottom-0 w-10 h-16 bg-[#333] rounded-b-md border-b border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center items-end pb-2 z-0 touch-none select-none" onClick={() => movePlayer(0, 1)}><ArrowDown className="text-[#666]" size={20}/></div>
                <div className="absolute left-0 w-16 h-10 bg-[#333] rounded-l-md border-l border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center pl-2 z-0 touch-none select-none" onClick={() => movePlayer(-1, 0)}><ArrowLeft className="text-[#666]" size={20}/></div>
                <div className="absolute right-0 w-16 h-10 bg-[#333] rounded-r-md border-r border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-end pr-2 z-0 touch-none select-none" onClick={() => movePlayer(1, 0)}><ArrowRight className="text-[#666]" size={20}/></div>
                <div className="absolute top-0 left-0 w-10 h-10 bg-[#333] rounded-tl-xl border-t border-l border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-center z-0 touch-none select-none" onClick={() => movePlayer(-1, -1)}><ArrowUpLeft className="text-[#666]" size={20}/></div>
                <div className="absolute top-0 right-0 w-10 h-10 bg-[#333] rounded-tr-xl border-t border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-center z-0 touch-none select-none" onClick={() => movePlayer(1, -1)}><ArrowUpRight className="text-[#666]" size={20}/></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-[#333] rounded-bl-xl border-b border-l border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-center z-0 touch-none select-none" onClick={() => movePlayer(-1, 1)}><ArrowDownLeft className="text-[#666]" size={20}/></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#333] rounded-br-xl border-b border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-center z-0 touch-none select-none" onClick={() => movePlayer(1, 1)}><ArrowDownRight className="text-[#666]" size={20}/></div>
                <div className="absolute w-8 h-8 bg-[#2a2a2a] rounded-full z-20 shadow-inner"></div>
            </div>

            {/* Ranged Button - Adjusted Position */}
            <div className="absolute right-20 top-1/2 -translate-y-[100px] md:right-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 flex flex-col items-center z-10 group">
                <button 
                    className="w-10 h-10 bg-[#333] rounded-full shadow-[0_2px_0_#111] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-white border border-[#555] touch-none select-none" 
                    onClick={fireRangedWeapon}
                >
                    <Crosshair size={16}/>
                </button>
                <span className="text-[#666] text-[10px] font-bold mt-1">SHOOT</span>
            </div>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 md:right-auto md:left-1/2 md:-translate-x-1/2 md:top-3/4 flex gap-4 transform -rotate-12 md:rotate-0">
                <div className="flex flex-col items-center group">
                    <button className="w-14 h-14 bg-[#8b0000] rounded-full shadow-[0_4px_0_#500000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#a00000] touch-none select-none" onClick={toggleMenu}>B</button>
                    <span className="text-[#666] text-xs font-bold mt-1">MENU</span>
                </div>
                <div className="flex flex-col items-center mt-[-15px] md:mt-0 group">
                    <button 
                        className="w-14 h-14 bg-[#ff0000] rounded-full shadow-[0_4px_0_#8b0000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#cc0000] touch-none select-none" 
                        onMouseDown={handlePressStart} 
                        onMouseUp={handlePressEnd} 
                        onMouseLeave={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                    >
                        A
                    </button>
                    <span className="text-[#666] text-xs font-bold mt-1">ACT</span>
                </div>
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:bottom-4">
                 <button onClick={onBack} className="text-[#555] text-[10px] font-bold border border-[#333] px-3 py-1 rounded bg-[#222] hover:text-white hover:border-gray-500 flex items-center gap-1"><LogOut size={10}/> QUIT</button>
            </div>
        </div>
    </div>
  );
};

export default SchoolDungeonRPG;
