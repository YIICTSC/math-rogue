
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Circle, Menu, X, Check, Search, LogOut, Shield, Sword, Target, Trash2, Hammer, FlaskConical, Info } from 'lucide-react';
import { audioService } from '../services/audioService';
import { createPixelSpriteCanvas } from './PixelSprite';

interface SchoolDungeonRPGProps {
  onBack: () => void;
}

// --- GBC PALETTE ---
const C0 = '#0f380f'; // Blackest
const C1 = '#306230'; // Dark
const C2 = '#8bac0f'; // Light
const C3 = '#9bbc0f'; // White

// --- CONSTANTS ---
const MAP_W = 20;
const MAP_H = 20;
const VIEW_W = 11; 
const VIEW_H = 9;
const TILE_SIZE = 16; 
const SCALE = 3; 
const MAX_INVENTORY = 20;

// Balance Constants
const HUNGER_INTERVAL = 10; // Turns per belly decrease
const REGEN_INTERVAL = 5;   // Turns per 1 HP regen

// --- TYPES ---
type TileType = 'WALL' | 'FLOOR' | 'STAIRS' | 'HALLWAY';
type Direction = { x: 0 | 1 | -1, y: 0 | 1 | -1 };
type ItemCategory = 'WEAPON' | 'ARMOR' | 'RANGED' | 'CONSUMABLE' | 'SYNTH';

interface Item {
  id: string;
  category: ItemCategory;
  type: string; // Internal ID like 'RULER'
  name: string;
  desc: string;
  value?: number; // Heal amount, etc.
  power?: number; // Atk or Def bonus
  range?: number;
  count?: number; // For ammo
  effects?: string[]; // Special effects strings
  plus?: number; // Upgrade value (+1, +2...)
}

interface EquipmentSlots {
  weapon: Item | null;
  armor: Item | null;
  ranged: Item | null;
}

interface Entity {
  id: number;
  type: 'PLAYER' | 'ENEMY' | 'ITEM';
  x: number;
  y: number;
  char: string;
  name: string;
  
  // Stats
  hp: number;
  maxHp: number;
  baseAttack: number; // Base stats without gear
  baseDefense: number;
  attack: number;     // Calculated stats
  defense: number;
  
  xp: number;
  dir: Direction;
  
  // Item specific
  itemData?: Item; 
  
  // Player specific
  equipment?: EquipmentSlots;
  
  // Enemy specific
  enemyType?: 'SLIME' | 'GHOST' | 'BAT' | 'BOOK';
}

interface Log {
  message: string;
  color?: string;
  id: number;
}

// --- ITEM DATABASE ---
const ITEM_DB: Record<string, Omit<Item, 'id'>> = {
    // Weapons
    'PENCIL_SWORD': { category: 'WEAPON', type: 'PENCIL_SWORD', name: 'えんぴつソード', desc: '削りたて。攻撃+4', power: 4, effects: [] },
    'IRON_BAR': { category: 'WEAPON', type: 'IRON_BAR', name: '鉄棒こん棒', desc: '重いが強い。攻撃+8', power: 8, effects: ['重'] },
    'BROOM_BLADE': { category: 'WEAPON', type: 'BROOM_BLADE', name: '竹ぼうきブレード', desc: '鋭く割れた柄。攻撃+6', power: 6, effects: ['連'] },
    'TEXTBOOK_HAMMER': { category: 'WEAPON', type: 'TEXTBOOK_HAMMER', name: '九九の教科書', desc: '知識の重み。攻撃+5', power: 5, effects: ['算'] },
    'RANDO_CRUSHER': { category: 'WEAPON', type: 'RANDO_CRUSHER', name: 'ランドセル槌', desc: '角が痛い。攻撃+7', power: 7, effects: ['守'] },

    // Armor
    'GYM_CLOTHES': { category: 'ARMOR', type: 'GYM_CLOTHES', name: 'あつでの体育着', desc: '動きやすい。防御+3', power: 3, effects: ['速'] },
    'APRON_ARMOR': { category: 'ARMOR', type: 'APRON_ARMOR', name: '給食エプロン', desc: '汚れが固い。防御+5', power: 5, effects: ['汚'] },
    'SOFT_HELMET': { category: 'ARMOR', type: 'SOFT_HELMET', name: '防災頭巾', desc: 'ふかふか。防御+4', power: 4, effects: ['集'] },
    'CARPET_CAPE': { category: 'ARMOR', type: 'CARPET_CAPE', name: '校長室の絨毯', desc: '高級な守り。防御+7', power: 7, effects: ['魔'] },

    // Ranged
    'CHALK': { category: 'RANGED', type: 'CHALK', name: 'チョーク', desc: '粉が目に入る。', power: 3, range: 4, count: 5 },
    'ERASER': { category: 'RANGED', type: 'ERASER', name: '消しゴム', desc: '角で狙う。', power: 5, range: 5, count: 3 },

    // Consumables
    'ONIGIRI': { category: 'CONSUMABLE', type: 'ONIGIRI', name: 'おにぎり', desc: '満腹度50回復', value: 50 },
    'POTION': { category: 'CONSUMABLE', type: 'POTION', name: '牛乳', desc: 'HP30回復', value: 30 },
    'NOTE': { category: 'CONSUMABLE', type: 'NOTE', name: '宿題のメモ帳', desc: 'マップ構造がわかる', value: 0 },
    'BOMB': { category: 'CONSUMABLE', type: 'BOMB', name: 'チョーク手榴弾', desc: '部屋全体攻撃', value: 20 },
    'SCROLL_SLEEP': { category: 'CONSUMABLE', type: 'SCROLL_SLEEP', name: '議事録の巻物', desc: '敵全体が眠くなる', value: 0 },
    'SCROLL_POWER': { category: 'CONSUMABLE', type: 'SCROLL_POWER', name: '通知表の巻物', desc: '武器か防具を強化', value: 1 },

    // Synthesis
    'GLUE': { category: 'SYNTH', type: 'GLUE', name: '図工用のり', desc: '2つの装備を合成する', value: 0 },
};

const SchoolDungeonRPG: React.FC<SchoolDungeonRPGProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- STATE ---
  const [map, setMap] = useState<TileType[][]>([]);
  const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});
  
  // Initialize Player
  const [player, setPlayer] = useState<Entity>({
    id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
    hp: 30, maxHp: 30, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, dir: {x:0, y:1},
    equipment: { weapon: null, armor: null, ranged: null }
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMap, setShowMap] = useState(false); 
  const turnCounter = useRef(0); // Track turns for hunger/regen
  
  // Synthesis State
  const [synthState, setSynthState] = useState<{ active: boolean, step: 'SELECT_BASE' | 'SELECT_MAT', baseIndex: number | null }>({ active: false, step: 'SELECT_BASE', baseIndex: null });

  // Menu Navigation
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const menuListRef = useRef<HTMLDivElement>(null);

  // Inspection
  const [inspectedItem, setInspectedItem] = useState<Item | null>(null);
  const longPressTimer = useRef<any>(null);

  // Init
  useEffect(() => {
    // Generate Sprites - Use HERO templates with Red/Skin palette
    // '赤' triggers red clothes, 'HERO' triggers skin face
    spriteCache.current['PLAYER_FRONT'] = createPixelSpriteCanvas('P_FRONT', 'HERO_FRONT|赤'); 
    spriteCache.current['PLAYER_SIDE'] = createPixelSpriteCanvas('P_SIDE', 'HERO_SIDE|赤'); 
    spriteCache.current['PLAYER_BACK'] = createPixelSpriteCanvas('P_BACK', 'HERO_BACK|赤');
    
    // Enemy Sprites from Main Game Palettes
    spriteCache.current['SLIME'] = createPixelSpriteCanvas('SLIME', 'SLIME|#1565C0'); // Blue
    spriteCache.current['GHOST'] = createPixelSpriteCanvas('GHOST', 'GHOST|#6A1B9A'); // Purple
    spriteCache.current['BAT'] = createPixelSpriteCanvas('BAT', 'BAT|#212121'); // Black
    spriteCache.current['BOOK'] = createPixelSpriteCanvas('BOOK', 'NOTEBOOK|#5D4037'); // Brown

    spriteCache.current['WEAPON'] = createPixelSpriteCanvas('WPN', 'SWORD');
    spriteCache.current['ARMOR'] = createPixelSpriteCanvas('ARM', 'SHIELD');
    spriteCache.current['RANGED'] = createPixelSpriteCanvas('RNG', 'POTION'); 
    spriteCache.current['CONSUMABLE'] = createPixelSpriteCanvas('CON', 'NOTEBOOK');
    spriteCache.current['SYNTH'] = createPixelSpriteCanvas('SYNTH', 'POTION|#FFFFFF'); // Glue

    startNewGame();
  }, []);

  // Update Stats whenever Equipment changes
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

  // Scroll effect for menu
  useEffect(() => {
    if (menuOpen && menuListRef.current) {
        const itemEl = menuListRef.current.children[selectedItemIndex] as HTMLElement;
        if (itemEl) {
            // Simple scroll into view logic
            const container = menuListRef.current;
            if (itemEl.offsetTop < container.scrollTop) {
                container.scrollTop = itemEl.offsetTop;
            } else if (itemEl.offsetTop + itemEl.offsetHeight > container.scrollTop + container.clientHeight) {
                container.scrollTop = itemEl.offsetTop + itemEl.offsetHeight - container.clientHeight;
            }
        }
    }
  }, [selectedItemIndex, menuOpen]);

  // Log Logic
  const addLog = (msg: string, color?: string) => {
    setLogs(prev => {
        const nextLogs = [...prev, { message: msg, color, id: Date.now() + Math.random() }];
        if (nextLogs.length > 20) {
            return nextLogs.slice(nextLogs.length - 20);
        }
        return nextLogs;
    });
  };

  const startNewGame = () => {
    setFloor(1);
    setLevel(1);
    setBelly(100);
    setMaxBelly(100);
    setGameOver(false);
    setMenuOpen(false);
    turnCounter.current = 0;
    
    // Initial Items
    const initItem: Item = { ...ITEM_DB['ONIGIRI'], id: `start-${Date.now()}` };
    const initWeapon: Item = { ...ITEM_DB['PENCIL_SWORD'], id: `start-w-${Date.now()}` };
    setInventory([initItem, initWeapon]);
    
    setPlayer({
        id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
        hp: 30, maxHp: 30, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, dir: {x:0, y:1},
        equipment: { weapon: null, armor: null, ranged: null }
    });
    setLogs([]);
    
    generateFloor(1);
    addLog("風来の旅が始まった！");
  };

  // --- GENERATION ---
  const generateFloor = (f: number) => {
    const newMap: TileType[][] = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill('WALL'));
    const rooms: {x:number, y:number, w:number, h:number}[] = [];
    
    // Simple Room Gen
    let attempts = 0;
    while(rooms.length < 3 && attempts < 100) {
        attempts++;
        const w = Math.floor(Math.random() * 4) + 4;
        const h = Math.floor(Math.random() * 4) + 4;
        const x = Math.floor(Math.random() * (MAP_W - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_H - h - 2)) + 1;
        
        const overlap = rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y);
        if(!overlap) {
            rooms.push({x, y, w, h});
            for(let ry=y; ry<y+h; ry++) {
                for(let rx=x; rx<x+w; rx++) newMap[ry][rx] = 'FLOOR';
            }
        }
    }
    rooms.sort((a,b) => (a.x + a.y) - (b.x + b.y));

    // Corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i+1];
        let cx = Math.floor(r1.x + r1.w/2);
        let cy = Math.floor(r1.y + r1.h/2);
        const tx = Math.floor(r2.x + r2.w/2);
        const ty = Math.floor(r2.y + r2.h/2);
        while(cx !== tx) { newMap[cy][cx] = 'FLOOR'; cx += (tx > cx) ? 1 : -1; }
        while(cy !== ty) { newMap[cy][cx] = 'FLOOR'; cy += (ty > cy) ? 1 : -1; }
    }

    // Stairs
    const lastRoom = rooms[rooms.length - 1];
    newMap[Math.floor(lastRoom.y + lastRoom.h/2)][Math.floor(lastRoom.x + lastRoom.w/2)] = 'STAIRS';

    // Player Start
    const startRoom = rooms[0];
    const px = Math.floor(startRoom.x + startRoom.w/2);
    const py = Math.floor(startRoom.y + startRoom.h/2);
    setPlayer(prev => ({ ...prev, x: px, y: py }));

    // Entities
    const newEnemies: Entity[] = [];
    const newItems: Entity[] = [];
    
    // Populate
    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            if(newMap[y][x] === 'FLOOR' && (x !== px || y !== py)) {
                if(Math.random() < 0.05) {
                    // Enemy
                    const types: ('SLIME'|'GHOST'|'BAT'|'BOOK')[] = ['SLIME', 'GHOST', 'BAT', 'BOOK'];
                    const t = types[Math.floor(Math.random() * types.length)];
                    let name="敵", hp=10, atk=2, xp=5;
                    if(t==='SLIME'){ name="スライム"; hp=10+f*2; atk=2+Math.floor(f/2); xp=5+f; }
                    if(t==='GHOST'){ name="おばけ"; hp=15+f*3; atk=4+Math.floor(f/2); xp=8+f; }
                    if(t==='BAT'){ name="コウモリ"; hp=8+f; atk=5+f; xp=6+f; }
                    if(t==='BOOK'){ name="教科書"; hp=20+f*4; atk=3+f; xp=12+f*2; }
                    newEnemies.push({
                        id: Date.now() + Math.random(), type: 'ENEMY', x, y, char: t[0], 
                        name, hp, maxHp: hp, baseAttack: atk, baseDefense: Math.floor(f/3), attack: atk, defense: Math.floor(f/3), xp, dir: {x:0, y:0}, enemyType: t
                    });
                } else if(Math.random() < 0.04) {
                    // Item
                    const keys = Object.keys(ITEM_DB);
                    const key = keys[Math.floor(Math.random() * keys.length)];
                    const template = ITEM_DB[key];
                    
                    newItems.push({
                        id: Date.now() + Math.random(), type: 'ITEM', x, y, char: '!', 
                        name: template.name, hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                        itemData: { ...template, id: `item-${Date.now()}-${Math.random()}`, effects: template.effects ? [...template.effects] : [], plus: 0 }
                    });
                }
            }
        }
    }

    setMap(newMap);
    setEnemies(newEnemies);
    setFloorItems(newItems);
    setShowMap(false);
};

  // --- ACTIONS ---
  const movePlayer = (dx: 0|1|-1, dy: 0|1|-1) => {
      if(gameOver) return;

      // MENU NAVIGATION
      if (menuOpen) {
          if (dy !== 0) {
              setSelectedItemIndex(prev => {
                  const next = prev + dy;
                  return Math.max(0, Math.min(inventory.length - 1, next));
              });
              audioService.playSound('select');
          }
          return;
      }

      // NORMAL MOVEMENT
      if(dx === 0 && dy === 0) {
          addLog("足踏みした。");
          processTurn(player.x, player.y);
          return;
      }

      setPlayer(p => ({ ...p, dir: {x: dx, y: dy} }));

      const tx = player.x + dx;
      const ty = player.y + dy;

      // 1. Check Wall
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H || map[ty][tx] === 'WALL') {
          return;
      }

      // 2. Check Enemy (Attack)
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) {
          attackEnemy(target);
          processTurn(player.x, player.y); 
          return;
      }

      // 3. Move & Pickup Check
      let finalX = tx;
      let finalY = ty;
      
      // Move logic first
      setPlayer(p => ({ ...p, x: finalX, y: finalY }));
      
      // Check for Item Pickup
      const itemIdx = floorItems.findIndex(i => i.x === finalX && i.y === finalY);
      if (itemIdx !== -1) {
          const itemEntity = floorItems[itemIdx];
          if (itemEntity.itemData) {
              const item = itemEntity.itemData;
              
              if (inventory.length < MAX_INVENTORY) {
                  setInventory(prev => [...prev, item]);
                  addLog(`${item.name}を拾った！`);
                  setFloorItems(prev => prev.filter((_, i) => i !== itemIdx));
                  audioService.playSound('select');
              } else {
                  addLog("持ち物がいっぱいで拾えない！", "red");
                  // Item stays on floor
              }
          }
      }
      
      // Check Stairs
      if (map[ty][tx] === 'STAIRS') {
          addLog("階段がある。", C2);
      }

      processTurn(finalX, finalY);
  };

  const attackEnemy = (target: Entity) => {
      let dmg = Math.max(1, player.attack - target.defense);
      
      // Special Effects
      if (player.equipment?.weapon?.effects?.includes('連') && Math.random() < 0.3) {
          dmg = Math.floor(dmg * 1.5);
          addLog("連続攻撃！", "yellow");
      }
      if (player.equipment?.weapon?.effects?.includes('算')) {
          const bonus = Math.floor(Math.random() * 9);
          dmg += bonus;
      }

      const newEnemies = enemies.map(e => {
          if (e.id === target.id) {
              const nhp = e.hp - dmg;
              addLog(`${e.name}に${dmg}ダメージ！`);
              return { ...e, hp: nhp };
          }
          return e;
      });

      const dead = newEnemies.find(e => e.id === target.id && e.hp <= 0);
      if (dead) {
          addLog(`${dead.name}を倒した！ (${dead.xp} XP)`);
          gainXp(dead.xp);
      }

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
          nextXp -= needed;
          nextLv++;
          nextMaxHp += 5;
          nextAtk += 1;
          setPlayer(p => ({ ...p, hp: nextMaxHp, baseAttack: nextAtk, maxHp: nextMaxHp })); 
          addLog(`レベルが${nextLv}に上がった！`);
          audioService.playSound('buff');
      }
      
      setPlayer(p => ({ ...p, xp: nextXp }));
      setLevel(nextLv);
  };

  const processTurn = (px: number, py: number) => {
      turnCounter.current += 1;
      
      let nextBelly = belly;
      let nextHp = player.hp;
      
      // Slower Hunger: Decrease every N turns
      if (turnCounter.current % HUNGER_INTERVAL === 0) {
          nextBelly -= 1;
          if (nextBelly <= 0) {
              nextBelly = 0;
              nextHp -= 1;
              if (nextHp <= 0) {
                  setGameOver(true);
                  addLog("空腹で倒れた...", "red");
                  return;
              }
              addLog("お腹が空いて倒れそうだ...", "red");
          }
      }

      // Natural Regen: Every M turns if belly > 0
      if (turnCounter.current % REGEN_INTERVAL === 0 && nextBelly > 0 && nextHp < player.maxHp) {
          nextHp += 1;
      }
      
      setBelly(nextBelly);
      setPlayer(p => ({ ...p, hp: nextHp }));

      // Enemy Turn
      setEnemies(prevEnemies => {
          const nextEnemies: Entity[] = [];
          const occupied = new Set<string>();
          occupied.add(`${px},${py}`);

          for (const e of prevEnemies) {
              // Enemy Logic (Simple Tracking)
              const dx = px - e.x;
              const dy = py - e.y;
              const dist = Math.abs(dx) + Math.abs(dy);
              
              if (dist <= 8) { 
                  let mx = 0, my = 0;
                  if (Math.abs(dx) > Math.abs(dy)) mx = dx > 0 ? 1 : -1;
                  else my = dy > 0 ? 1 : -1;
                  
                  const tx = e.x + mx;
                  const ty = e.y + my;
                  const targetKey = `${tx},${ty}`;
                  
                  // Attack Player
                  if (tx === px && ty === py) {
                      const dmg = Math.max(1, e.attack - player.defense);
                      addLog(`${e.name}の攻撃！${dmg}ダメージ！`, "red");
                      setPlayer(p => {
                          const newHp = p.hp - dmg;
                          if (newHp <= 0) setGameOver(true);
                          return { ...p, hp: newHp };
                      });
                      occupied.add(`${e.x},${e.y}`);
                      nextEnemies.push(e); // Stay
                      continue;
                  }
                  
                  // Move Check: Not Wall, Not Occupied by another Enemy (Current OR Future)
                  const isWall = map[ty][tx] === 'WALL';
                  const isOccupiedByNew = occupied.has(targetKey);
                  const isOccupiedByOld = prevEnemies.some(o => o.id !== e.id && o.x === tx && o.y === ty); // Check current positions to avoid swapping/stacking
                  
                  if (!isWall && !isOccupiedByNew && !isOccupiedByOld) {
                      occupied.add(targetKey);
                      nextEnemies.push({ ...e, x: tx, y: ty });
                  } else {
                      occupied.add(`${e.x},${e.y}`);
                      nextEnemies.push(e);
                  }
              } else {
                  occupied.add(`${e.x},${e.y}`);
                  nextEnemies.push(e);
              }
          }
          return nextEnemies;
      });
  };

  // --- INTERACTION ---
  const handleActionBtn = () => {
      if (gameOver) { startNewGame(); return; }
      
      // MENU ACTION
      if (menuOpen) {
          if (synthState.active) {
              handleSynthesisStep();
          } else if (inventory.length > 0) {
              handleItemAction(selectedItemIndex);
          }
          return;
      }

      // 1. Attack Forward
      const tx = player.x + player.dir.x;
      const ty = player.y + player.dir.y;
      
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) {
          attackEnemy(target);
          processTurn(player.x, player.y);
          return;
      }

      // 2. Stairs
      if (map[player.y][player.x] === 'STAIRS') {
          addLog("階段を降りた！");
          setFloor(f => f + 1);
          generateFloor(floor + 1);
          return;
      }

      // Air Swing
      addLog("素振りをした。");
      audioService.playSound('select');
      processTurn(player.x, player.y);
  };

  const toggleMenu = () => {
      if (menuOpen) {
          setMenuOpen(false);
          setSynthState({ active: false, step: 'SELECT_BASE', baseIndex: null });
      } else {
          setMenuOpen(true);
          setSelectedItemIndex(0);
      }
      audioService.playSound('select');
  };

  // --- SYNTHESIS LOGIC ---
  const handleSynthesisStep = () => {
      const idx = selectedItemIndex;
      const item = inventory[idx];
      
      if (synthState.step === 'SELECT_BASE') {
          if (['WEAPON', 'ARMOR'].includes(item.category)) {
              setSynthState({ active: true, step: 'SELECT_MAT', baseIndex: idx });
              addLog("合成する素材を選んでください");
              audioService.playSound('select');
          } else {
              addLog("それはベースにできません", "red");
              audioService.playSound('wrong');
          }
      } else if (synthState.step === 'SELECT_MAT') {
          if (idx === synthState.baseIndex) {
              addLog("同じアイテムは選べません", "red");
              audioService.playSound('wrong');
              return;
          }
          if (['WEAPON', 'ARMOR'].includes(item.category)) {
              // Execute Synthesis
              const baseIdx = synthState.baseIndex!;
              const baseItem = inventory[baseIdx];
              const matItem = item;
              
              if (baseItem.category !== matItem.category) {
                  addLog("種類が違うと合成できません", "red");
                  audioService.playSound('wrong');
                  return;
              }

              const newPower = (baseItem.power || 0); 
              const newPlus = (baseItem.plus || 0) + (matItem.plus || 0) + 1;
              const newEffects = Array.from(new Set([...(baseItem.effects || []), ...(matItem.effects || [])]));
              
              const newItem: Item = {
                  ...baseItem,
                  plus: newPlus,
                  effects: newEffects,
                  name: `${baseItem.name.split('+')[0]}+${newPlus}`
              };

              const glueIdx = inventory.findIndex(i => i.type === 'GLUE');
              if (glueIdx === -1) {
                  setSynthState({ active: false, step: 'SELECT_BASE', baseIndex: null });
                  return;
              }

              let newInv = [...inventory];
              const indicesToRemove = [idx, glueIdx].sort((a,b) => b-a);
              indicesToRemove.forEach(i => newInv.splice(i, 1));
              
              newInv = inventory.map((it, i) => {
                  if (i === baseIdx) return newItem;
                  return it;
              }).filter((_, i) => i !== idx && i !== glueIdx);

              setInventory(newInv);
              addLog(`合成成功！${newItem.name}になった！`, "yellow");
              audioService.playSound('buff');
              setSynthState({ active: false, step: 'SELECT_BASE', baseIndex: null });
              setMenuOpen(false);
              processTurn(player.x, player.y);

          } else {
              addLog("それは素材にできません", "red");
              audioService.playSound('wrong');
          }
      }
  };

  // --- INVENTORY ACTIONS ---
  const handleItemAction = (index: number) => {
      const item = inventory[index];
      if (!item) return;

      let actionDone = false;

      // SYNTHESIS TRIGGER
      if (item.type === 'GLUE') {
          setSynthState({ active: true, step: 'SELECT_BASE', baseIndex: null });
          addLog("合成のベースとなる装備を選んでください");
          audioService.playSound('select');
          return; // Stay in menu
      }

      // EQUIP LOGIC
      if (item.category === 'WEAPON' || item.category === 'ARMOR' || item.category === 'RANGED') {
          setPlayer(p => {
              const currentEquip = p.equipment ? p.equipment[item.category === 'WEAPON' ? 'weapon' : item.category === 'ARMOR' ? 'armor' : 'ranged'] : null;
              const newEquipment = { ...p.equipment!, [item.category === 'WEAPON' ? 'weapon' : item.category === 'ARMOR' ? 'armor' : 'ranged']: item };
              
              const newInv = [...inventory];
              newInv.splice(index, 1); 
              if (currentEquip) newInv.push(currentEquip); 
              
              setInventory(newInv);
              addLog(`${item.name}を装備した。`);
              return { ...p, equipment: newEquipment };
          });
          actionDone = true;
      } 
      // CONSUMABLE LOGIC
      else if (item.category === 'CONSUMABLE') {
          if (item.type === 'ONIGIRI') {
              setBelly(Math.min(maxBelly, belly + (item.value || 50)));
              addLog("おにぎりを食べた。");
              actionDone = true;
          } else if (item.type === 'POTION') {
              setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + (item.value || 30)) }));
              addLog("回復薬を飲んだ。");
              actionDone = true;
          } else if (item.type === 'NOTE') {
              setShowMap(true);
              addLog("マップを覚えた！");
              actionDone = true;
          } else if (item.type === 'BOMB') {
              setEnemies(prev => prev.map(e => ({...e, hp: e.hp - (item.value || 20)})).filter(e => {
                  if (e.hp <= 0) { gainXp(e.xp); addLog(`${e.name}を爆破！`); return false; }
                  return true;
              }));
              addLog("爆竹を使った！");
              audioService.playSound('attack');
              actionDone = true;
          } else if (item.type === 'SCROLL_SLEEP') {
              addLog("敵は眠ってしまった！");
              actionDone = true;
          } else if (item.type === 'SCROLL_POWER') {
              if (player.equipment?.weapon) {
                  const w = player.equipment.weapon;
                  const newW = { ...w, plus: (w.plus || 0) + 1, name: `${w.name.split('+')[0]}+${(w.plus||0)+1}` };
                  setPlayer(p => ({ ...p, equipment: { ...p.equipment!, weapon: newW } }));
                  addLog("武器が強化された！");
                  actionDone = true;
              } else {
                  addLog("装備していないと効果がない！");
                  actionDone = true; 
              }
          }
          
          if (actionDone) {
              setInventory(prev => prev.filter((_, i) => i !== index));
              setSelectedItemIndex(prev => Math.min(prev, inventory.length - 2)); 
          }
      }

      if (actionDone) {
          setMenuOpen(false);
          processTurn(player.x, player.y);
          audioService.playSound('select');
      }
  };

  const handleDropItem = (index: number) => {
      const item = inventory[index];
      if (!item) return;

      // Cannot drop while synthesizing
      if (synthState.active) return;

      // Unequip check
      let newEquip = player.equipment;
      let changed = false;
      if (player.equipment?.weapon === item) { newEquip = { ...newEquip!, weapon: null }; changed = true; }
      else if (player.equipment?.armor === item) { newEquip = { ...newEquip!, armor: null }; changed = true; }
      else if (player.equipment?.ranged === item) { newEquip = { ...newEquip!, ranged: null }; changed = true; }

      if (changed) setPlayer(p => ({ ...p, equipment: newEquip }));

      // Drop
      const newInv = inventory.filter((_, i) => i !== index);
      setInventory(newInv);

      // Add to floor
      const droppedEntity: Entity = {
          id: Date.now() + Math.random(),
          type: 'ITEM',
          x: player.x,
          y: player.y,
          char: '!',
          name: item.name,
          hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: { x: 0, y: 0 },
          itemData: item
      };
      setFloorItems(prev => [...prev, droppedEntity]);

      addLog(`${item.name}を足元に置いた。`);
      audioService.playSound('select');
      
      // Adjust cursor
      setSelectedItemIndex(prev => Math.min(prev, newInv.length - 1));
      if (newInv.length === 0) setMenuOpen(false); // Close if empty? Optional.
  };

  const handleUnequip = (slot: 'weapon'|'armor'|'ranged') => {
      const item = player.equipment?.[slot];
      if (item) {
          if (inventory.length < MAX_INVENTORY) {
              setPlayer(p => ({ ...p, equipment: { ...p.equipment!, [slot]: null } }));
              setInventory(prev => [...prev, item]);
              addLog(`${item.name}を外した。`);
              processTurn(player.x, player.y);
          } else {
              addLog("持ち物がいっぱいで外せない！");
          }
      }
  };

  const handleTouchStart = (item: Item) => {
      longPressTimer.current = setTimeout(() => {
          setInspectedItem(item);
      }, 500);
  };

  const handleTouchEnd = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // --- KEYBOARD SUPPORT ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent scrolling
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }

        if (gameOver) {
            if (['z', 'Enter', ' '].includes(e.key)) startNewGame();
            return;
        }

        // Handle B / Menu Toggle
        if (['x', 'c', 'Escape'].includes(e.key)) {
            toggleMenu();
            return;
        }
        
        // Handle Cancel inside menu
        if (menuOpen && (e.key === 'Backspace' || e.key === 'x')) {
            if (synthState.active) {
                setSynthState({ active: false, step: 'SELECT_BASE', baseIndex: null });
            } else {
                setMenuOpen(false);
            }
            return;
        }

        if (menuOpen) {
            if (e.key === 'ArrowUp') setSelectedItemIndex(prev => Math.max(0, prev - 1));
            if (e.key === 'ArrowDown') setSelectedItemIndex(prev => Math.min(inventory.length - 1, prev + 1));
            if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') handleActionBtn();
            return;
        }

        switch(e.key) {
            case 'ArrowUp': case 'w': case '8': case 'k': movePlayer(0, -1); break;
            case 'ArrowDown': case 's': case '2': case 'j': movePlayer(0, 1); break;
            case 'ArrowLeft': case 'a': case '4': case 'h': movePlayer(-1, 0); break;
            case 'ArrowRight': case 'd': case '6': case 'l': movePlayer(1, 0); break;
            // Diagonals
            case 'Home': case '7': case 'y': movePlayer(-1, -1); break;
            case 'PageUp': case '9': case 'u': movePlayer(1, -1); break;
            case 'End': case '1': case 'b': movePlayer(-1, 1); break;
            case 'PageDown': case '3': case 'n': movePlayer(1, 1); break;
            
            case 'z': case ' ': case 'Enter': handleActionBtn(); break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, map, enemies, floorItems, menuOpen, gameOver, inventory, selectedItemIndex, synthState]);

  // --- RENDER ---
  const frameCountRef = useRef(0);
  useEffect(() => {
      const loop = setInterval(() => {
          frameCountRef.current++;
          renderGame();
      }, 100); 
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

      // BG
      ctx.fillStyle = C0;
      ctx.fillRect(0, 0, w, h);

      // Camera
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
              
              // Draw Floor/Wall
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

              // Draw Items
              const item = floorItems.find(i => i.x === mx && i.y === my);
              if (item) {
                  const cat = item.itemData?.category;
                  let spriteKey = 'CONSUMABLE';
                  if (cat === 'WEAPON') spriteKey = 'WEAPON';
                  if (cat === 'ARMOR') spriteKey = 'ARMOR';
                  if (cat === 'RANGED') spriteKey = 'RANGED';
                  if (item.itemData?.type === 'GLUE') spriteKey = 'SYNTH';
                  const sprite = spriteCache.current[spriteKey];
                  if (sprite) {
                      ctx.drawImage(sprite, sx, sy, ts, ts);
                  } else {
                      ctx.fillStyle = C1;
                      ctx.fillRect(sx + 4*SCALE, sy + 4*SCALE, 8*SCALE, 8*SCALE);
                  }
              }

              // Draw Enemies
              const enemy = enemies.find(e => e.x === mx && e.y === my);
              if (enemy) {
                  const spriteKey = enemy.enemyType || 'SLIME';
                  const sprite = spriteCache.current[spriteKey];
                  if (sprite) {
                      ctx.drawImage(sprite, sx, sy, ts, ts);
                  } else {
                      ctx.fillStyle = C1;
                      ctx.fillRect(sx + 2*SCALE, sy + 2*SCALE, 12*SCALE, 12*SCALE);
                  }
              }

              // Draw Player
              if (mx === player.x && my === player.y) {
                  let spriteKey = 'PLAYER_FRONT';
                  let flip = false;
                  
                  if (player.dir.y === -1) spriteKey = 'PLAYER_BACK';
                  else if (player.dir.x !== 0) {
                      spriteKey = 'PLAYER_SIDE';
                      if (player.dir.x === -1) flip = true;
                  } else if (player.dir.y === 1) {
                      spriteKey = 'PLAYER_FRONT';
                  }

                  const sprite = spriteCache.current[spriteKey];
                  if (sprite) {
                      if (flip) {
                          ctx.save();
                          ctx.translate(sx + ts, sy);
                          ctx.scale(-1, 1);
                          ctx.drawImage(sprite, 0, 0, ts, ts);
                          ctx.restore();
                      } else {
                          ctx.drawImage(sprite, sx, sy, ts, ts);
                      }
                  } else {
                      ctx.fillStyle = C0;
                      ctx.fillRect(sx + 3*SCALE, sy + 3*SCALE, 10*SCALE, 10*SCALE);
                  }
              }
          }
      }
  };

  return (
    <div className="w-full h-full bg-[#101010] flex flex-col items-center font-mono select-none overflow-hidden touch-none relative p-4">
        
        {/* Inspection Modal */}
        {inspectedItem && (
            <div className="absolute inset-0 z-50 bg-[#0f380f]/95 flex items-center justify-center p-4" onClick={() => setInspectedItem(null)}>
                <div className="w-full max-w-xs bg-[#9bbc0f] border-4 border-[#306230] p-4 shadow-xl text-[#0f380f]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-2 border-b-2 border-[#306230] pb-1">
                        <h3 className="font-bold text-lg">{inspectedItem.name} {inspectedItem.plus ? `+${inspectedItem.plus}` : ''}</h3>
                        <button onClick={() => setInspectedItem(null)}><X size={20}/></button>
                    </div>
                    <div className="text-sm mb-4 min-h-[3rem]">{inspectedItem.desc}</div>
                    <div className="text-xs font-bold grid grid-cols-2 gap-2">
                        <div>分類: {inspectedItem.category}</div>
                        {inspectedItem.power && <div>威力: {inspectedItem.power}</div>}
                        {inspectedItem.value && <div>効果値: {inspectedItem.value}</div>}
                        {inspectedItem.effects && inspectedItem.effects.length > 0 && <div className="col-span-2">印: [{inspectedItem.effects.join('')}]</div>}
                    </div>
                </div>
            </div>
        )}

        {/* Game Screen Area */}
        <div className="w-full max-w-md aspect-[11/9] relative mb-2 shrink-0">
             {/* LCD Screen (Green) */}
             <div className="w-full h-full bg-[#9bbc0f] border-4 border-[#0f380f] relative overflow-hidden shadow-lg rounded-sm">
                
                {/* Equipment Status Bar (Top) */}
                <div className="absolute top-0 left-0 w-full h-8 bg-[#0f380f] text-[#9bbc0f] flex justify-between items-center px-2 text-[10px] z-10 border-b border-[#306230]">
                    <div className="flex gap-2">
                        <span className="flex items-center"><Sword size={8} className="mr-1"/>{player.equipment?.weapon?.name || '-'}</span>
                        <span className="flex items-center"><Shield size={8} className="mr-1"/>{player.equipment?.armor?.name || '-'}</span>
                        <span className="flex items-center"><Target size={8} className="mr-1"/>{player.equipment?.ranged?.name || '-'}</span>
                    </div>
                </div>

                {/* Main Status Bar (Bottom of Top) */}
                <div className="absolute top-8 left-0 w-full h-5 bg-[#306230] text-[#9bbc0f] flex justify-between items-center px-2 text-xs font-bold z-10">
                    <span>{floor}F</span>
                    <span>Lv{level}</span>
                    <span>HP{player.hp}/{player.maxHp}</span>
                    <span>Atk{player.attack} Def{player.defense}</span>
                    <span>🍙{belly}%</span>
                </div>

                {/* Canvas Layer */}
                <canvas 
                    ref={canvasRef} 
                    width={VIEW_W * TILE_SIZE * SCALE} 
                    height={VIEW_H * TILE_SIZE * SCALE}
                    className="w-full h-full object-contain pixel-art mt-6" 
                    style={{ imageRendering: 'pixelated' }}
                />

                {/* Map Overlay */}
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

                {/* Inventory Menu */}
                {menuOpen && (
                    <div className="absolute right-0 top-0 bottom-0 w-3/4 bg-[#0f380f] border-l-2 border-[#9bbc0f] z-30 p-2 text-[#9bbc0f] text-xs flex flex-col">
                        <div className="flex justify-between items-center border-b border-[#9bbc0f] mb-2 pb-1">
                            <h3 className="font-bold">
                                {synthState.active 
                                    ? (synthState.step === 'SELECT_BASE' ? 'ベースを選択' : '素材を選択')
                                    : `MOCHIMONO (${inventory.length}/${MAX_INVENTORY})`
                                }
                            </h3>
                            <button onClick={toggleMenu}><X size={12}/></button>
                        </div>
                        
                        {!synthState.active && (
                            <div className="mb-2 border-b border-[#306230] pb-2">
                                <div className="text-[#8bac0f] mb-1">装備中:</div>
                                {player.equipment?.weapon && <div onClick={()=>handleUnequip('weapon')} className="cursor-pointer hover:text-white">[武] {player.equipment.weapon.name}</div>}
                                {player.equipment?.armor && <div onClick={()=>handleUnequip('armor')} className="cursor-pointer hover:text-white">[防] {player.equipment.armor.name}</div>}
                                {player.equipment?.ranged && <div onClick={()=>handleUnequip('ranged')} className="cursor-pointer hover:text-white">[投] {player.equipment.ranged.name}</div>}
                            </div>
                        )}

                        <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar">
                            {inventory.map((item, i) => {
                                const isSynthTarget = synthState.active && (
                                    (synthState.step === 'SELECT_BASE' && !['WEAPON','ARMOR'].includes(item.category)) ||
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
                                                {item.name} 
                                                {item.plus ? `+${item.plus}` : ''} 
                                                {item.effects && item.effects.length > 0 && <span className="ml-1 text-[9px]">[{item.effects.join('')}]</span>}
                                            </span>
                                            <span className={`text-[9px] ${selectedItemIndex === i ? 'text-[#0f380f]' : 'text-[#8bac0f]'}`}>
                                                {synthState.active 
                                                    ? '選択' 
                                                    : (['WEAPON','ARMOR','RANGED'].includes(item.category) ? '装備' : '使う')
                                                }
                                            </span>
                                        </button>
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
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-[#0f380f]/90 flex flex-col items-center justify-center text-[#9bbc0f] z-40">
                        <h2 className="text-2xl font-bold mb-4">GAME OVER</h2>
                        <p>Floor: {floor}</p>
                        <p>Level: {level}</p>
                        <button onClick={startNewGame} className="mt-6 border-2 border-[#9bbc0f] px-4 py-2 hover:bg-[#306230] animate-pulse">RETRY</button>
                    </div>
                )}
             </div>
        </div>

        {/* Log Area */}
        <div className="w-full max-w-md bg-[#0f380f] text-[#9bbc0f] h-24 p-1 text-[10px] mb-2 rounded border-2 border-[#306230] font-mono leading-tight flex flex-col justify-end shrink-0 shadow-inner overflow-hidden">
            {logs.slice(-6).map((l) => (
                <div key={l.id} style={{ color: l.color || '#9bbc0f' }} className="truncate">{l.message}</div>
            ))}
        </div>

        {/* Controls Area */}
        <div className="w-full max-w-md flex-grow relative min-h-[180px] bg-[#1a1a1a] rounded-t-xl border-t-2 border-[#333]">
            
            {/* Unified D-Pad */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center">
                {/* Center */}
                <div className="w-10 h-10 bg-[#333] z-10"></div>
                
                {/* UP */}
                <div className="absolute top-0 w-10 h-16 bg-[#333] rounded-t-md border-t border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center pt-2 z-0" onClick={() => movePlayer(0, -1)}><ArrowUp className="text-[#666]" size={20}/></div>
                {/* DOWN */}
                <div className="absolute bottom-0 w-10 h-16 bg-[#333] rounded-b-md border-b border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center items-end pb-2 z-0" onClick={() => movePlayer(0, 1)}><ArrowDown className="text-[#666]" size={20}/></div>
                {/* LEFT */}
                <div className="absolute left-0 w-16 h-10 bg-[#333] rounded-l-md border-l border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center pl-2 z-0" onClick={() => movePlayer(-1, 0)}><ArrowLeft className="text-[#666]" size={20}/></div>
                {/* RIGHT */}
                <div className="absolute right-0 w-16 h-10 bg-[#333] rounded-r-md border-r border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-end pr-2 z-0" onClick={() => movePlayer(1, 0)}><ArrowRight className="text-[#666]" size={20}/></div>
                
                {/* DIAGONALS */}
                {/* UP-LEFT */}
                <div className="absolute top-0 left-0 w-10 h-10 bg-[#333] rounded-tl-xl border-t border-l border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-center z-0" onClick={() => movePlayer(-1, -1)}>
                    <ArrowUpLeft className="text-[#666]" size={20}/>
                </div>
                {/* UP-RIGHT */}
                <div className="absolute top-0 right-0 w-10 h-10 bg-[#333] rounded-tr-xl border-t border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-center z-0" onClick={() => movePlayer(1, -1)}>
                    <ArrowUpRight className="text-[#666]" size={20}/>
                </div>
                {/* DOWN-LEFT */}
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-[#333] rounded-bl-xl border-b border-l border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-center z-0" onClick={() => movePlayer(-1, 1)}>
                    <ArrowDownLeft className="text-[#666]" size={20}/>
                </div>
                {/* DOWN-RIGHT */}
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#333] rounded-br-xl border-b border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-center z-0" onClick={() => movePlayer(1, 1)}>
                    <ArrowDownRight className="text-[#666]" size={20}/>
                </div>

                {/* Center Cap */}
                <div className="absolute w-8 h-8 bg-[#2a2a2a] rounded-full z-20 shadow-inner"></div>
            </div>

            {/* A/B Buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-4 transform -rotate-12">
                <div className="flex flex-col items-center group">
                    <button 
                        className="w-14 h-14 bg-[#8b0000] rounded-full shadow-[0_4px_0_#500000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#a00000]"
                        onClick={toggleMenu}
                    >
                        B
                    </button>
                    <span className="text-[#666] text-xs font-bold mt-1">MENU</span>
                </div>
                <div className="flex flex-col items-center mt-[-15px] group">
                    <button 
                        className="w-14 h-14 bg-[#ff0000] rounded-full shadow-[0_4px_0_#8b0000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#cc0000]"
                        onClick={handleActionBtn}
                    >
                        A
                    </button>
                    <span className="text-[#666] text-xs font-bold mt-1">ACT</span>
                </div>
            </div>

            {/* Quit Button */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                 <button onClick={onBack} className="text-[#555] text-[10px] font-bold border border-[#333] px-3 py-1 rounded bg-[#222] hover:text-white hover:border-gray-500 flex items-center gap-1">
                    <LogOut size={10}/> QUIT
                 </button>
            </div>
        </div>
    </div>
  );
};

export default SchoolDungeonRPG;
