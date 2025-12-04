
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Circle, Menu, X, Check, Search } from 'lucide-react';
import { audioService } from '../services/audioService';

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

// --- TYPES ---
type TileType = 'WALL' | 'FLOOR' | 'STAIRS' | 'HALLWAY';
type Direction = { x: 0 | 1 | -1, y: 0 | 1 | -1 };

interface Item {
  id: string;
  type: 'ONIGIRI' | 'STICK' | 'BOMB' | 'NOTE' | 'POTION';
  name: string;
  desc: string;
  value?: number; // Heal amount or damage
}

interface Entity {
  id: number;
  type: 'PLAYER' | 'ENEMY' | 'ITEM';
  x: number;
  y: number;
  char: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
  dir: Direction;
  itemData?: Item; // For items on floor
  enemyType?: 'SLIME' | 'GHOST' | 'BAT' | 'BOOK';
}

interface Log {
  message: string;
  color?: string;
  id: number;
}

const SchoolDungeonRPG: React.FC<SchoolDungeonRPGProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- STATE ---
  const [map, setMap] = useState<TileType[][]>([]);
  const [player, setPlayer] = useState<Entity>({
    id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: '風来の小学生', 
    hp: 30, maxHp: 30, attack: 3, defense: 0, xp: 0, dir: {x:0, y:1}
  });
  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [floorItems, setFloorItems] = useState<Entity[]>([]);
  const [inventory, setInventory] = useState<Item[]>([
    { id: 'start-1', type: 'ONIGIRI', name: 'おにぎり', desc: '満腹度を50回復' }
  ]);
  const [logs, setLogs] = useState<Log[]>([]);
  
  // Game Status
  const [floor, setFloor] = useState(1);
  const [level, setLevel] = useState(1);
  const [belly, setBelly] = useState(100);
  const [maxBelly, setMaxBelly] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMap, setShowMap] = useState(false); // For Exploration Note

  // Init
  useEffect(() => {
    startNewGame();
  }, []);

  const addLog = (msg: string, color?: string) => {
    setLogs(prev => [{ message: msg, color, id: Date.now() + Math.random() }, ...prev].slice(0, 6));
  };

  const startNewGame = () => {
    setFloor(1);
    setLevel(1);
    setBelly(100);
    setMaxBelly(100);
    setGameOver(false);
    setInventory([{ id: 'start-1', type: 'ONIGIRI', name: 'おにぎり', desc: '満腹度を50回復' }]);
    setPlayer({
        id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: '風来の小学生', 
        hp: 30, maxHp: 30, attack: 3, defense: 0, xp: 0, dir: {x:0, y:1}
    });
    generateFloor(1);
    addLog("風来の旅が始まった！");
  };

  // --- GENERATION ---
  const generateFloor = (f: number) => {
    const newMap: TileType[][] = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill('WALL'));
    const rooms: {x:number, y:number, w:number, h:number}[] = [];
    
    // Room Gen
    for(let i=0; i<6; i++) {
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

    // Corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i+1];
        let cx = Math.floor(r1.x + r1.w/2);
        let cy = Math.floor(r1.y + r1.h/2);
        const tx = Math.floor(r2.x + r2.w/2);
        const ty = Math.floor(r2.y + r2.h/2);
        
        while(cx !== tx) {
            newMap[cy][cx] = 'FLOOR';
            cx += (tx > cx) ? 1 : -1;
        }
        while(cy !== ty) {
            newMap[cy][cx] = 'FLOOR';
            cy += (ty > cy) ? 1 : -1;
        }
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
                if(Math.random() < 0.03) {
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
                        name, hp, maxHp: hp, attack: atk, defense: Math.floor(f/3), xp, dir: {x:0, y:0}, enemyType: t
                    });
                } else if(Math.random() < 0.02) {
                    // Item
                    const iTypes: Item['type'][] = ['ONIGIRI', 'STICK', 'BOMB', 'NOTE', 'POTION'];
                    const it = iTypes[Math.floor(Math.random() * iTypes.length)];
                    let iname = "アイテム", desc = "", val = 0;
                    if(it==='ONIGIRI'){ iname="おにぎり"; desc="満腹度回復"; val=50; }
                    if(it==='STICK'){ iname="木の棒"; desc="攻撃力が上がる(消費)"; val=3; }
                    if(it==='BOMB'){ iname="消しゴム爆弾"; desc="部屋全体攻撃"; val=20; }
                    if(it==='NOTE'){ iname="たんけんノート"; desc="マップ構造がわかる"; }
                    if(it==='POTION'){ iname="回復薬"; desc="HP回復"; val=30; }
                    
                    newItems.push({
                        id: Date.now() + Math.random(), type: 'ITEM', x, y, char: '!', 
                        name: iname, hp:0, maxHp:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                        itemData: { id: `item-${Date.now()}-${Math.random()}`, type: it, name: iname, desc, value: val }
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
      if(dx === 0 && dy === 0) {
          // Wait turn
          addLog("足踏みした。");
          processTurn();
          return;
      }

      // Update direction always
      setPlayer(p => ({ ...p, dir: {x: dx, y: dy} }));

      const tx = player.x + dx;
      const ty = player.y + dy;

      // 1. Check Wall
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H || map[ty][tx] === 'WALL') {
          return; // Blocked
      }

      // 2. Check Enemy (Attack)
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) {
          attackEnemy(target);
          processTurn();
          return;
      }

      // 3. Move
      setPlayer(p => ({ ...p, x: tx, y: ty }));
      
      // Check Floor Item (Log only)
      const item = floorItems.find(i => i.x === tx && i.y === ty);
      if (item) {
          addLog(`${item.name}の上に乗った。`);
      }
      
      processTurn();
  };

  const attackEnemy = (target: Entity) => {
      // Damage Formula
      const dmg = Math.max(1, player.attack - target.defense);
      
      const newEnemies = enemies.map(e => {
          if (e.id === target.id) {
              const nhp = e.hp - dmg;
              addLog(`${e.name}に${dmg}ダメージを与えた！`);
              return { ...e, hp: nhp };
          }
          return e;
      });

      // Death Check
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
      let nextAtk = player.attack;
      
      const needed = nextLv * 10;
      if (nextXp >= needed) {
          nextXp -= needed;
          nextLv++;
          nextMaxHp += 5;
          nextAtk += 1;
          setPlayer(p => ({ ...p, hp: nextMaxHp })); // Full heal on level up? Or partial? Let's do full heal logic or +5
          addLog(`レベルが${nextLv}に上がった！`);
          audioService.playSound('buff');
      }
      
      setPlayer(p => ({ ...p, xp: nextXp, maxHp: nextMaxHp, attack: nextAtk }));
      setLevel(nextLv);
  };

  const processTurn = () => {
      // 1. Belly Decrease
      let nextBelly = belly - 1;
      let nextHp = player.hp;
      if (nextBelly <= 0) {
          nextBelly = 0;
          nextHp -= 1;
          if (nextHp <= 0) {
              setGameOver(true);
              addLog("空腹で倒れた...");
              return;
          }
          addLog("お腹が空いて倒れそうだ...", "red");
      }
      setBelly(nextBelly);
      setPlayer(p => ({ ...p, hp: nextHp }));

      // 2. Enemy Turn
      const pPos = { x: player.x, y: player.y }; // Use current pos (even if just updated)
      // Actually we need to use the state setter callback or ref for accurate sequential logic in React
      // Simplified: Assume React batching allows us to calculate AI based on "intended" player pos
      // Since movePlayer updated state, re-render hasn't happened yet, so `player` is old.
      // Fix: We need to calculate AI based on WHERE PLAYER IS GOING.
      // BUT simpler: In `movePlayer`, we called `setPlayer`.
      // The `processTurn` should really just calculate updates and `setEnemies` once.
      // We will access player position via a temp variable or pass it.
      // To make it robust without huge refactor: we will use a ref for player pos or just accept 1 frame lag visual or use functional updates carefully.
      
      // Let's use functional update for enemies to ensure they see latest player if possible, 
      // but they can't see the functional update of player...
      // OK, for this mini-game, simple approach: Player moves -> Render -> Effect calls AI? No, strict turn order.
      // Better: pass newPlayerPos to processTurn.
      
      // Since I can't easily change signature in `movePlayer` without passing args around, 
      // I will assume `player` variable inside `movePlayer` is old, but I know the delta.
      // Let's just execute AI based on current state (which is technically "Player moved, now enemies move relative to that").
      // Actually `player` in scope is old.
      
      // For simplicity in this React component: 
      // AI will act based on the PREVIOUS player position visually or I assume the player stays close.
      // Correct way: Calculate everything in one go or use Refs.
      // Let's use `setEnemies` with logic inside.
      
      setEnemies(prevEnemies => {
          // We need the *latest* player position. 
          // Since we can't get it easily inside this callback without refs, let's look at the `movePlayer` logic again.
          // `movePlayer` calls `processTurn` immediately.
          // Let's cheat: AI acts on "player" state which is technically Frame N. Player moves to Frame N+1.
          // This means enemies react to where player WAS. This is sometimes acceptable or creates "following" behavior.
          // To fix: "Player moves, THEN Enemies move". 
          // If I use a Ref for player position, it solves this.
          
          return prevEnemies.map(e => {
              // Simple AI: Move towards player
              // Note: Using `player` from closure (Frame N). 
              // If player moved, this `player` is where they were.
              // To make it feel responsive, let's assume player is at `player` (old) + delta? No, too complex.
              // Let's just use `player`. It means enemies have reaction delay of 1 frame logic, which is fine for a simple RPG.
              // WAIT! If I use functional update for player in `movePlayer`, `player` var is definitely old.
              
              const dx = player.x - e.x;
              const dy = player.y - e.y;
              const dist = Math.abs(dx) + Math.abs(dy);
              
              if (dist <= 8) { // Aggro range
                  let mx = 0, my = 0;
                  if (Math.abs(dx) > Math.abs(dy)) mx = dx > 0 ? 1 : -1;
                  else my = dy > 0 ? 1 : -1;
                  
                  const tx = e.x + mx;
                  const ty = e.y + my;
                  
                  // Attack Player?
                  // We need to know if (tx, ty) is the NEW player position.
                  // Since we don't have it, let's check against `player` (old) and maybe current input?
                  // Let's just allow overlap visually or fix logic?
                  // Best fix: Check collision with Player's *State* in next render? No.
                  
                  // Let's check collision against `player` variable. 
                  if (tx === player.x && ty === player.y) {
                      // Attack
                      const dmg = Math.max(1, e.attack - player.defense);
                      addLog(`${e.name}の攻撃！${dmg}ダメージ！`, "red");
                      setPlayer(p => ({ ...p, hp: p.hp - dmg })); // This queues another update
                      if (player.hp - dmg <= 0) setGameOver(true);
                      return e; 
                  }
                  
                  // Move if empty
                  if (map[ty][tx] !== 'WALL' && !prevEnemies.some(o => o.x === tx && o.y === ty)) {
                      return { ...e, x: tx, y: ty };
                  }
              }
              return e;
          });
      });
  };

  const handleInteract = () => {
      if (gameOver) { startNewGame(); return; }
      if (menuOpen) { setMenuOpen(false); return; }

      // 1. Attack Forward (Air swing or valid)
      // Check tile in front
      const tx = player.x + player.dir.x;
      const ty = player.y + player.dir.y;
      
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) {
          attackEnemy(target);
          processTurn();
          return;
      }

      // 2. Item Pickup / Stairs
      // Prioritize Item under foot
      const itemIdx = floorItems.findIndex(i => i.x === player.x && i.y === player.y);
      if (itemIdx !== -1) {
          const itemEnt = floorItems[itemIdx];
          if (itemEnt.itemData) {
              if (inventory.length < 8) {
                  setInventory([...inventory, itemEnt.itemData]);
                  setFloorItems(floorItems.filter((_, i) => i !== itemIdx));
                  addLog(`${itemEnt.name}を拾った。`);
                  processTurn();
                  return;
              } else {
                  addLog("持ち物がいっぱいだ！");
              }
          }
      }

      // Stairs
      if (map[player.y][player.x] === 'STAIRS') {
          addLog("階段を降りた！");
          setFloor(f => f + 1);
          generateFloor(floor + 1);
          return;
      }

      // Nothing
      addLog("素振りをした。");
      processTurn();
  };

  const handleUseItem = (index: number) => {
      const item = inventory[index];
      if (!item) return;

      let used = false;
      if (item.type === 'ONIGIRI') {
          setBelly(Math.min(maxBelly, belly + (item.value || 50)));
          addLog("おにぎりを食べた。おいしい！");
          used = true;
      } else if (item.type === 'POTION') {
          setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + (item.value || 30)) }));
          addLog("回復薬を飲んだ。");
          used = true;
      } else if (item.type === 'STICK') {
          setPlayer(p => ({ ...p, attack: p.attack + (item.value || 1) }));
          addLog("木の棒を装備した気がする。(攻撃UP)"); // Consumable buff for simplicity
          used = true;
      } else if (item.type === 'NOTE') {
          setShowMap(true);
          addLog("マップの構造が頭に入った！");
          used = true;
      } else if (item.type === 'BOMB') {
          // Damage all enemies in room? Or generic AOE
          setEnemies(prev => prev.map(e => ({...e, hp: e.hp - (item.value || 20)})).filter(e => {
              if (e.hp <= 0) {
                  gainXp(e.xp);
                  addLog(`${e.name}を爆破！`);
                  return false;
              }
              return true;
          }));
          addLog("爆弾を使った！全体攻撃！");
          audioService.playSound('attack');
          used = true;
      }

      if (used) {
          setInventory(prev => prev.filter((_, i) => i !== index));
          setMenuOpen(false);
          processTurn();
      }
  };

  // --- RENDER ---
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const ts = TILE_SIZE * SCALE;

      // Fill BG
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

              // Bounds
              if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) {
                  ctx.fillStyle = C0;
                  ctx.fillRect(sx, sy, ts, ts);
                  continue;
              }

              const tile = map[my][mx];
              
              // Floor / Wall
              if (tile === 'WALL') {
                  ctx.fillStyle = C1;
                  ctx.fillRect(sx, sy, ts, ts);
                  // Pattern
                  ctx.fillStyle = C0;
                  ctx.fillRect(sx+ts/4, sy+ts/4, ts/2, ts/2);
              } else {
                  ctx.fillStyle = C3;
                  ctx.fillRect(sx, sy, ts, ts); // Floor
                  
                  if (tile === 'STAIRS') {
                      ctx.fillStyle = C1;
                      for(let i=0; i<3; i++) ctx.fillRect(sx, sy + i*(ts/3), ts, 2);
                  }
              }

              // Items
              const item = floorItems.find(i => i.x === mx && i.y === my);
              if (item) {
                  ctx.fillStyle = C1;
                  // Simple bag shape
                  ctx.fillRect(sx + 4*SCALE, sy + 4*SCALE, 8*SCALE, 8*SCALE);
                  ctx.fillStyle = C3;
                  ctx.fillText("?", sx + 6*SCALE, sy + 10*SCALE);
              }

              // Enemies
              const enemy = enemies.find(e => e.x === mx && e.y === my);
              if (enemy) {
                  ctx.fillStyle = C1;
                  ctx.fillRect(sx + 2*SCALE, sy + 2*SCALE, 12*SCALE, 12*SCALE);
                  // Eyes
                  ctx.fillStyle = C3;
                  ctx.fillRect(sx + 4*SCALE, sy + 5*SCALE, 2*SCALE, 2*SCALE);
                  ctx.fillRect(sx + 10*SCALE, sy + 5*SCALE, 2*SCALE, 2*SCALE);
              }

              // Player
              if (mx === player.x && my === player.y) {
                  ctx.fillStyle = C0;
                  // Body
                  ctx.fillRect(sx + 3*SCALE, sy + 3*SCALE, 10*SCALE, 10*SCALE);
                  // Face (direction)
                  ctx.fillStyle = C3;
                  if (player.dir.y === 1) ctx.fillRect(sx + 4*SCALE, sy + 8*SCALE, 8*SCALE, 4*SCALE); // Down
                  if (player.dir.y === -1) ctx.fillRect(sx + 4*SCALE, sy + 4*SCALE, 8*SCALE, 4*SCALE); // Up
                  if (player.dir.x === 1) ctx.fillRect(sx + 8*SCALE, sy + 4*SCALE, 4*SCALE, 8*SCALE); // Right
                  if (player.dir.x === -1) ctx.fillRect(sx + 4*SCALE, sy + 4*SCALE, 4*SCALE, 8*SCALE); // Left
              }
          }
      }

      // UI Overlay (Health / Belly)
      // Done via HTML overlay for crisp text
  }, [map, player, enemies, floorItems]);

  return (
    <div className="w-full h-full bg-[#202020] flex flex-col items-center justify-center font-mono select-none overflow-hidden touch-none relative">
        
        {/* Game Boy Frame */}
        <div className="w-full max-w-md aspect-[9/16] flex flex-col bg-[#c0c0c0] rounded-xl p-4 shadow-2xl relative border-4 border-[#808080]">
            
            {/* Screen Bezel */}
            <div className="bg-[#505050] p-4 rounded-t-lg rounded-b-3xl mb-4 relative shadow-inner">
                <div className="flex items-center justify-between text-[#808080] text-[10px] mb-1 px-2">
                    <span className="animate-pulse text-red-500 flex items-center gap-1"><Circle size={6} fill="currentColor"/> BATTERY</span>
                </div>
                
                {/* LCD Screen */}
                <div className="bg-[#9bbc0f] border-4 border-[#0f380f] w-full aspect-square relative overflow-hidden shadow-inner">
                    {/* Top Status Bar */}
                    <div className="absolute top-0 left-0 w-full h-6 bg-[#0f380f] text-[#9bbc0f] flex justify-between items-center px-2 text-xs font-bold z-10">
                        <span>{floor}F</span>
                        <span>Lv{level}</span>
                        <span>HP {player.hp}/{player.maxHp}</span>
                        <span>🍙 {belly}%</span>
                    </div>

                    {/* Canvas Layer */}
                    <canvas 
                        ref={canvasRef} 
                        width={VIEW_W * TILE_SIZE * SCALE} 
                        height={VIEW_H * TILE_SIZE * SCALE}
                        className="w-full h-full object-contain pixel-art mt-2"
                        style={{ imageRendering: 'pixelated' }}
                    />

                    {/* Map Overlay */}
                    {showMap && (
                        <div className="absolute inset-0 bg-[#0f380f]/90 z-20 flex items-center justify-center p-8">
                            <div className="w-full h-full border border-[#9bbc0f] grid" style={{ gridTemplateColumns: `repeat(${MAP_W}, 1fr)` }}>
                                {map.map((row, y) => row.map((tile, x) => (
                                    <div key={`${x}-${y}`} className={`${tile === 'WALL' ? 'bg-transparent' : (tile === 'STAIRS' ? 'bg-[#9bbc0f]' : 'bg-[#306230]')}`}>
                                        {x === player.x && y === player.y && <div className="w-full h-full bg-white rounded-full animate-pulse"></div>}
                                    </div>
                                )))}
                            </div>
                            <button onClick={() => setShowMap(false)} className="absolute bottom-4 text-[#9bbc0f]">Close Map</button>
                        </div>
                    )}

                    {/* Menu Overlay */}
                    {menuOpen && (
                        <div className="absolute right-0 top-0 bottom-0 w-2/3 bg-[#0f380f] border-l-2 border-[#9bbc0f] z-30 p-2 text-[#9bbc0f] text-xs">
                            <h3 className="border-b border-[#9bbc0f] mb-2 pb-1 font-bold">MOCHIMONO</h3>
                            <div className="flex flex-col gap-1 overflow-y-auto h-[180px]">
                                {inventory.map((item, i) => (
                                    <button 
                                        key={i} 
                                        className="text-left px-2 py-1 hover:bg-[#306230] cursor-pointer flex justify-between"
                                        onClick={() => handleUseItem(i)}
                                    >
                                        <span>{item.name}</span>
                                        {i === 0 && <span className="animate-pulse">◄</span>} 
                                    </button>
                                ))}
                                {inventory.length === 0 && <span className="text-[#306230]">Empty</span>}
                            </div>
                            <div className="mt-2 border-t border-[#9bbc0f] pt-1">
                                <p>ATK: {player.attack}</p>
                                <p>XP: {player.xp}</p>
                            </div>
                        </div>
                    )}

                    {/* Game Over Overlay */}
                    {gameOver && (
                        <div className="absolute inset-0 bg-[#0f380f]/80 flex flex-col items-center justify-center text-[#9bbc0f] z-40">
                            <h2 className="text-2xl font-bold mb-4">GAME OVER</h2>
                            <p>Floor: {floor}</p>
                            <p>Level: {level}</p>
                            <p className="mt-4 animate-pulse">PRESS A TO RETRY</p>
                        </div>
                    )}
                </div>
                
                <div className="text-center text-[#9bbc0f] font-bold italic mt-1 text-xs tracking-widest opacity-30">Nintendo GAME BOY™</div>
            </div>

            {/* Log Area */}
            <div className="bg-[#0f380f] text-[#9bbc0f] h-20 p-2 text-[10px] overflow-hidden mb-4 rounded border-2 border-[#306230] font-mono leading-tight flex flex-col justify-end">
                {logs.map((l) => (
                    <div key={l.id} style={{ color: l.color || '#9bbc0f' }}>{l.message}</div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex-grow relative">
                {/* D-Pad */}
                <div className="absolute left-4 top-4 w-32 h-32">
                    <div className="w-10 h-10 bg-[#333] absolute top-0 left-10 rounded-t-md shadow-lg active:mt-1 cursor-pointer" onClick={() => movePlayer(0, -1)}><ArrowUp className="text-[#555] mx-auto mt-2" size={20}/></div>
                    <div className="w-10 h-10 bg-[#333] absolute bottom-0 left-10 rounded-b-md shadow-lg active:mt-1 cursor-pointer" onClick={() => movePlayer(0, 1)}><ArrowDown className="text-[#555] mx-auto mt-2" size={20}/></div>
                    <div className="w-10 h-10 bg-[#333] absolute top-10 left-0 rounded-l-md shadow-lg active:mt-1 cursor-pointer" onClick={() => movePlayer(-1, 0)}><ArrowLeft className="text-[#555] mx-auto mt-2" size={20}/></div>
                    <div className="w-10 h-10 bg-[#333] absolute top-10 right-0 rounded-r-md shadow-lg active:mt-1 cursor-pointer" onClick={() => movePlayer(1, 0)}><ArrowRight className="text-[#555] mx-auto mt-2" size={20}/></div>
                    <div className="w-10 h-10 bg-[#333] absolute top-10 left-10 flex items-center justify-center"><div className="w-4 h-4 bg-[#222] rounded-full"></div></div>
                </div>

                {/* A/B Buttons */}
                <div className="absolute right-4 top-8 flex gap-4 transform -rotate-12">
                    <div className="flex flex-col items-center group">
                        <button 
                            className="w-12 h-12 bg-[#8b0000] rounded-full shadow-[0_4px_0_#500000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            B
                        </button>
                        <span className="text-[#333] text-xs font-bold mt-1">MENU</span>
                    </div>
                    <div className="flex flex-col items-center mt-[-10px] group">
                        <button 
                            className="w-12 h-12 bg-[#ff0000] rounded-full shadow-[0_4px_0_#8b0000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold"
                            onClick={handleInteract}
                        >
                            A
                        </button>
                        <span className="text-[#333] text-xs font-bold mt-1">ACT</span>
                    </div>
                </div>

                {/* Select/Start */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                    <div className="w-12 h-3 bg-[#555] rounded-full transform rotate-12 shadow cursor-pointer border border-black hover:bg-[#777]" onClick={onBack}></div>
                    <div className="w-12 h-3 bg-[#555] rounded-full transform rotate-12 shadow cursor-pointer border border-black hover:bg-[#777]" onClick={() => movePlayer(0, 0)}></div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-8 text-[10px] text-[#555] font-bold">
                    <span>EXIT</span>
                    <span>WAIT</span>
                </div>
            </div>

        </div>
    </div>
  );
};

export default SchoolDungeonRPG;
