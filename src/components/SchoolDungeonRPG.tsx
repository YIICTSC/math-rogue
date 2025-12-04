
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Circle, Menu, X, Check } from 'lucide-react';

interface SchoolDungeonRPGProps {
  onBack: () => void;
}

// --- GBC PALETTE ---
const C0 = '#0f380f'; // Black
const C1 = '#306230'; // Dark
const C2 = '#8bac0f'; // Light
const C3 = '#9bbc0f'; // White

// --- TYPES ---
type TileType = 'WALL' | 'FLOOR' | 'STAIRS' | 'HALLWAY';
type EntityType = 'PLAYER' | 'ENEMY' | 'ITEM';
type EnemyType = 'SLIME' | 'GHOST' | 'BAT' | 'BOOK';
type ItemType = 'ONIGIRI' | 'STICK' | 'BOMB' | 'BAG' | 'POTION';

interface Position { x: number; y: number; }

interface Entity {
  id: number;
  type: EntityType;
  pos: Position;
  char: string; // For ASCII fallback or logic
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  xp?: number; // Enemies give XP
  itemType?: ItemType; // For items
}

interface Log {
  message: string;
  id: number;
}

// --- SPRITES (16x16 Binary Maps 0=Transparent, 1=C0, 2=C1, 3=C2) ---
// Simplified representation for code compactness.
// Using a helper to draw pixel art on canvas.

// --- GAME LOGIC ---
const MAP_W = 20;
const MAP_H = 20;
const VIEW_W = 11; // Odd number to center player
const VIEW_H = 9;
const TILE_SIZE = 16; // 16px tiles
const SCALE = 3; // Upscale for visibility

const SchoolDungeonRPG: React.FC<SchoolDungeonRPGProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State - Initialize with walls to prevent render crash
  const [map, setMap] = useState<TileType[][]>(
      Array(MAP_H).fill(null).map(() => Array(MAP_W).fill('WALL'))
  );
  const [player, setPlayer] = useState<Entity>({
    id: 0, type: 'PLAYER', pos: {x:0, y:0}, char: '@', name: '風来の小学生', hp: 20, maxHp: 20, attack: 2
  });
  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [items, setItems] = useState<Entity[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [floor, setFloor] = useState(1);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [belly, setBelly] = useState(100);
  const [maxBelly, setMaxBelly] = useState(100);
  const [turn, setTurn] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [inventory, setInventory] = useState<ItemType[]>(['ONIGIRI']);
  const [showInventory, setShowInventory] = useState(false);
  
  // Init
  useEffect(() => {
    generateFloor(1);
    addLog("風来の旅が始まった！");
  }, []);

  // --- LOGIC ---
  const addLog = (msg: string) => {
    setLogs(prev => [{ message: msg, id: Date.now() }, ...prev].slice(0, 5));
  };

  const generateFloor = (newFloor: number) => {
    // Simple Room Generation
    const newMap: TileType[][] = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill('WALL'));
    const rooms: {x:number, y:number, w:number, h:number}[] = [];
    
    // Place 4-6 rooms
    const roomCount = Math.floor(Math.random() * 3) + 4;
    for (let i = 0; i < roomCount; i++) {
        const w = Math.floor(Math.random() * 4) + 4; // 4-7
        const h = Math.floor(Math.random() * 4) + 4;
        const x = Math.floor(Math.random() * (MAP_W - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_H - h - 2)) + 1;
        
        // Check overlap (simple)
        let overlap = false;
        for (const r of rooms) {
            if (x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y) overlap = true;
        }
        if (!overlap) {
            rooms.push({x, y, w, h});
            for(let ry=y; ry<y+h; ry++) {
                for(let rx=x; rx<x+w; rx++) {
                    newMap[ry][rx] = 'FLOOR';
                }
            }
        }
    }

    // Corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i+1];
        const c1 = {x: Math.floor(r1.x + r1.w/2), y: Math.floor(r1.y + r1.h/2)};
        const c2 = {x: Math.floor(r2.x + r2.w/2), y: Math.floor(r2.y + r2.h/2)};
        
        // Horizontal then Vertical
        let cx = c1.x;
        let cy = c1.y;
        let safe = 0;
        while (cx !== c2.x) {
            newMap[cy][cx] = 'FLOOR';
            cx += (c2.x > cx) ? 1 : -1;
            safe++; if(safe > 100) break;
        }
        safe = 0;
        while (cy !== c2.y) {
            newMap[cy][cx] = 'FLOOR';
            cy += (c2.y > cy) ? 1 : -1;
            safe++; if(safe > 100) break;
        }
    }

    // Place Stairs
    if (rooms.length > 0) {
        const lastRoom = rooms[rooms.length - 1];
        newMap[Math.floor(lastRoom.y + lastRoom.h/2)][Math.floor(lastRoom.x + lastRoom.w/2)] = 'STAIRS';
    }

    setMap(newMap);
    setFloor(newFloor);

    // Place Player
    if (rooms.length > 0) {
        const firstRoom = rooms[0];
        setPlayer(prev => ({ ...prev, pos: { x: Math.floor(firstRoom.x + firstRoom.w/2), y: Math.floor(firstRoom.y + firstRoom.h/2) } }));
    }

    // Spawn Enemies
    const newEnemies: Entity[] = [];
    const enemyTypes: EnemyType[] = ['SLIME', 'GHOST', 'BAT', 'BOOK'];
    for (let i = 0; i < rooms.length * 2; i++) {
        const r = rooms[Math.floor(Math.random() * rooms.length)];
        const ex = Math.floor(r.x + Math.random() * r.w);
        const ey = Math.floor(r.y + Math.random() * r.h);
        if (newMap[ey][ex] === 'FLOOR' && (ex !== player.pos.x || ey !== player.pos.y)) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            let name = "机スライム";
            let hp = 5 + newFloor;
            let atk = 1 + Math.floor(newFloor/2);
            if (type === 'GHOST') { name = "黒板おばけ"; hp = 8 + newFloor; atk = 2 + Math.floor(newFloor/2); }
            if (type === 'BAT') { name = "吸血チョーク"; hp = 4 + newFloor; atk = 3 + Math.floor(newFloor/2); }
            if (type === 'BOOK') { name = "呪いの教科書"; hp = 10 + newFloor * 2; atk = 2 + newFloor; }

            newEnemies.push({
                id: Date.now() + i, type: 'ENEMY', pos: {x: ex, y: ey}, 
                char: type[0], name, hp, maxHp: hp, attack: atk, xp: 2 + newFloor
            });
        }
    }
    setEnemies(newEnemies);

    // Spawn Items
    const newItems: Entity[] = [];
    const itemTypes: ItemType[] = ['ONIGIRI', 'STICK', 'POTION'];
    for (let i = 0; i < 3; i++) {
        const r = rooms[Math.floor(Math.random() * rooms.length)];
        const ix = Math.floor(r.x + Math.random() * r.w);
        const iy = Math.floor(r.y + Math.random() * r.h);
        if (newMap[iy][ix] === 'FLOOR') {
            const it = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            let iname = "おにぎり";
            if (it === 'STICK') iname = "木の棒";
            if (it === 'POTION') iname = "牛乳";
            newItems.push({
                id: Date.now() + 100 + i, type: 'ITEM', pos: {x: ix, y: iy}, 
                char: '!', name: iname, hp: 0, maxHp: 0, attack: 0, itemType: it
            });
        }
    }
    setItems(newItems);
  };

  const handleAction = (action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'WAIT') => {
      if (gameOver) return;
      if (showInventory) return;

      let dx = 0; let dy = 0;
      if (action === 'UP') dy = -1;
      if (action === 'DOWN') dy = 1;
      if (action === 'LEFT') dx = -1;
      if (action === 'RIGHT') dx = 1;

      let newX = player.pos.x + dx;
      let newY = player.pos.y + dy;
      let tookTurn = false;

      // Validate Move
      if (newX >= 0 && newX < MAP_W && newY >= 0 && newY < MAP_H) {
          if (map[newY][newX] !== 'WALL') {
              // Check Enemy
              const targetEnemy = enemies.find(e => e.pos.x === newX && e.pos.y === newY);
              if (targetEnemy) {
                  // Attack
                  const dmg = Math.max(1, player.attack + Math.floor(Math.random() * 2));
                  targetEnemy.hp -= dmg;
                  addLog(`${targetEnemy.name}に${dmg}ダメージ！`);
                  if (targetEnemy.hp <= 0) {
                      addLog(`${targetEnemy.name}を倒した！`);
                      setXp(prev => {
                          const next = prev + (targetEnemy.xp || 0);
                          if (next >= level * 10) {
                              setLevel(l => l + 1);
                              setPlayer(p => ({ ...p, maxHp: p.maxHp + 5, hp: p.maxHp, attack: p.attack + 1 }));
                              addLog(`レベル${level+1}になった！`);
                              return next - level * 10;
                          }
                          return next;
                      });
                      setEnemies(prev => prev.filter(e => e.id !== targetEnemy.id));
                  } else {
                      // Trigger update for hit flash etc if implemented
                      setEnemies([...enemies]); 
                  }
                  tookTurn = true;
              } else {
                  // Move
                  setPlayer(prev => ({ ...prev, pos: { x: newX, y: newY } }));
                  // Check Stairs
                  if (map[newY][newX] === 'STAIRS') {
                      addLog("階段がある。進む？(Aボタン)");
                  }
                  // Check Items
                  const itemIndex = items.findIndex(i => i.pos.x === newX && i.pos.y === newY);
                  if (itemIndex !== -1) {
                      const item = items[itemIndex];
                      addLog(`${item.name}の上に乗った。`);
                  }
                  tookTurn = true;
              }
          } else {
              // Wall bump
          }
      }

      if (tookTurn || action === 'WAIT') {
          processTurn();
      }
  };

  const processTurn = () => {
      // Hunger
      setBelly(prev => {
          const next = prev - 1;
          if (next <= 0) {
              setPlayer(p => {
                  const nhp = p.hp - 1;
                  if (nhp <= 0) setGameOver(true);
                  return { ...p, hp: nhp };
              });
              if (turn % 5 === 0) addLog("お腹が空いて倒れそうだ...");
              return 0;
          }
          return next;
      });

      // Enemy Turn
      const pPos = player.pos; 
      
      setEnemies(prevEnemies => prevEnemies.map(e => {
          if (Math.abs(e.pos.x - pPos.x) + Math.abs(e.pos.y - pPos.y) < 6) {
              // Chase
              let edx = 0; let edy = 0;
              if (Math.abs(e.pos.x - pPos.x) > Math.abs(e.pos.y - pPos.y)) {
                  edx = pPos.x > e.pos.x ? 1 : -1;
              } else {
                  edy = pPos.y > e.pos.y ? 1 : -1;
              }
              
              const nextEx = e.pos.x + edx;
              const nextEy = e.pos.y + edy;
              
              // Hit Player
              if (nextEx === pPos.x && nextEy === pPos.y) {
                  const dmg = Math.max(1, e.attack - 0); // No defense stat yet
                  setPlayer(p => {
                      const nhp = p.hp - dmg;
                      if (nhp <= 0) { setGameOver(true); addLog("力尽きた..."); }
                      return { ...p, hp: nhp };
                  });
                  addLog(`${e.name}の攻撃！${dmg}ダメージ！`);
                  return e;
              }
              
              // Move if empty
              if (map[nextEy] && map[nextEy][nextEx] !== 'WALL' && !prevEnemies.find(o => o.pos.x === nextEx && o.pos.y === nextEy)) {
                  return { ...e, pos: { x: nextEx, y: nextEy } };
              }
          }
          return e;
      }));

      setTurn(t => t + 1);
  };

  const handleConfirm = () => {
      if (gameOver) {
          // Reset
          setPlayer({ id: 0, type: 'PLAYER', pos: {x:0, y:0}, char: '@', name: '風来の小学生', hp: 20, maxHp: 20, attack: 2 });
          setLevel(1); setXp(0); setBelly(100); setInventory(['ONIGIRI']); setGameOver(false); setTurn(0);
          generateFloor(1);
          addLog("再挑戦だ！");
          return;
      }

      if (showInventory) {
          // Use Item
          if (inventory.length > 0) {
              const item = inventory[0]; // Simple: use first item
              useItem(item, 0);
          }
          return;
      }

      // Stairs?
      if (map[player.pos.y] && map[player.pos.y][player.pos.x] === 'STAIRS') {
          addLog("階段を降りた！");
          generateFloor(floor + 1);
          return;
      }

      // Pickup?
      const itemIdx = items.findIndex(i => i.pos.x === player.pos.x && i.pos.y === player.pos.y);
      if (itemIdx !== -1) {
          const item = items[itemIdx];
          if (inventory.length < 5) {
              setInventory([...inventory, item.itemType!]);
              setItems(items.filter((_, i) => i !== itemIdx));
              addLog(`${item.name}を拾った。`);
          } else {
              addLog("持ち物がいっぱいだ！");
          }
          processTurn();
          return;
      }

      // Attack if facing enemy? (Simplified: A is just confirm/interact)
      handleAction('WAIT'); // Skip turn if nothing else
  };

  const useItem = (type: ItemType, index: number) => {
      if (type === 'ONIGIRI') {
          setBelly(Math.min(maxBelly, belly + 50));
          addLog("おにぎりを食べた。おいしい！");
      } else if (type === 'POTION') {
          setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 20) }));
          addLog("牛乳を飲んだ。HP回復！");
      } else if (type === 'STICK') {
          setPlayer(p => ({ ...p, attack: p.attack + 1 }));
          addLog("木の棒を装備した。(攻撃+1)");
      } else if (type === 'BOMB') {
          // Damage all enemies
          setEnemies(prev => prev.map(e => ({...e, hp: e.hp - 10})).filter(e => e.hp > 0));
          addLog("消しゴム爆弾が炸裂！全体10ダメージ！");
      }
      
      const newInv = [...inventory];
      newInv.splice(index, 1);
      setInventory(newInv);
      setShowInventory(false);
      processTurn();
  };

  const handleCancel = () => {
      if (showInventory) setShowInventory(false);
      else setShowInventory(true);
  };

  // --- RENDER ---
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw Viewport
      const w = canvas.width;
      const h = canvas.height;
      const ts = TILE_SIZE * SCALE;

      ctx.fillStyle = C3;
      ctx.fillRect(0, 0, w, h);

      const startX = player.pos.x - Math.floor(VIEW_W/2);
      const startY = player.pos.y - Math.floor(VIEW_H/2);

      for (let y = 0; y < VIEW_H; y++) {
          for (let x = 0; x < VIEW_W; x++) {
              const mx = startX + x;
              const my = startY + y;
              
              const screenX = x * ts;
              const screenY = y * ts;

              if (mx >= 0 && mx < MAP_W && my >= 0 && my < MAP_H) {
                  if (!map[my]) continue; // Safety check
                  const tile = map[my][mx];
                  if (tile === 'WALL') {
                      ctx.fillStyle = C1;
                      ctx.fillRect(screenX, screenY, ts, ts);
                      // Dithering for wall texture
                      ctx.fillStyle = C0;
                      ctx.fillRect(screenX + ts/4, screenY + ts/4, ts/2, ts/2);
                  } else if (tile === 'FLOOR') {
                      ctx.fillStyle = C3;
                      ctx.fillRect(screenX, screenY, ts, ts);
                      // Dot
                      ctx.fillStyle = C2;
                      ctx.fillRect(screenX + ts/2 - 2, screenY + ts/2 - 2, 4, 4);
                  } else if (tile === 'STAIRS') {
                      ctx.fillStyle = C3;
                      ctx.fillRect(screenX, screenY, ts, ts);
                      ctx.fillStyle = C0;
                      // Stripes
                      ctx.fillRect(screenX, screenY, ts, ts/3);
                      ctx.fillRect(screenX, screenY + ts/3*2, ts, ts/3);
                  }

                  // Items
                  const item = items.find(i => i.pos.x === mx && i.pos.y === my);
                  if (item) {
                      ctx.fillStyle = C0;
                      ctx.beginPath(); ctx.arc(screenX + ts/2, screenY + ts/2, ts/3, 0, Math.PI*2); ctx.fill();
                  }

                  // Enemies
                  const enemy = enemies.find(e => e.pos.x === mx && e.pos.y === my);
                  if (enemy) {
                      ctx.fillStyle = C0; // Sprite Color
                      // Simple ghost shape
                      ctx.fillRect(screenX + 4, screenY + 4, ts - 8, ts - 8);
                      ctx.fillStyle = C3; // Eyes
                      ctx.fillRect(screenX + 10, screenY + 10, 4, 4);
                      ctx.fillRect(screenX + 20, screenY + 10, 4, 4);
                  }

                  // Player
                  if (mx === player.pos.x && my === player.pos.y) {
                      ctx.fillStyle = C0;
                      // Cap shape
                      ctx.fillRect(screenX + ts/4, screenY + ts/4, ts/2, ts/2);
                      ctx.fillStyle = C3; // Face
                      ctx.fillRect(screenX + ts/3, screenY + ts/3, ts/3, ts/4);
                  }

              } else {
                  // Out of bounds
                  ctx.fillStyle = C0;
                  ctx.fillRect(screenX, screenY, ts, ts);
              }
          }
      }

  }, [map, player, enemies, items]);

  return (
    <div className="w-full h-full bg-[#202020] flex flex-col items-center justify-center font-mono select-none overflow-hidden touch-none relative">
        
        {/* Game Boy Frame Area */}
        <div className="w-full max-w-md aspect-[9/16] flex flex-col bg-[#c0c0c0] rounded-xl p-4 shadow-2xl relative border-4 border-[#808080]">
            
            {/* Screen Bezel */}
            <div className="bg-[#505050] p-4 rounded-t-lg rounded-b-3xl mb-4 relative shadow-inner">
                <div className="flex items-center justify-between text-[#808080] text-[10px] mb-1 px-2">
                    <span className="animate-pulse text-red-500 flex items-center gap-1"><Circle size={6} fill="currentColor"/> BATTERY</span>
                </div>
                
                {/* LCD Screen */}
                <div className="bg-[#8bac0f] border-4 border-[#306230] w-full aspect-square relative overflow-hidden shadow-inner">
                    {/* Top Status Bar */}
                    <div className="absolute top-0 left-0 w-full h-6 bg-[#0f380f] text-[#9bbc0f] flex justify-between items-center px-2 text-xs font-bold z-10">
                        <span>{floor}F</span>
                        <span>Lv{level}</span>
                        <span>HP {player.hp}/{player.maxHp}</span>
                        <span>{belly}%</span>
                    </div>

                    {/* Canvas Layer */}
                    <canvas 
                        ref={canvasRef} 
                        width={VIEW_W * TILE_SIZE * SCALE} 
                        height={VIEW_H * TILE_SIZE * SCALE}
                        className="w-full h-full object-contain pixel-art mt-2"
                        style={{ imageRendering: 'pixelated' }}
                    />

                    {/* Inventory Overlay */}
                    {showInventory && (
                        <div className="absolute top-6 left-0 w-full h-full bg-[#0f380f]/90 text-[#9bbc0f] p-4 z-20">
                            <h3 className="border-b border-[#9bbc0f] mb-2">MOCHIMONO</h3>
                            <ul>
                                {inventory.map((item, i) => (
                                    <li key={i} className="mb-1 cursor-pointer hover:bg-[#306230]" onClick={() => useItem(item, i)}>
                                        {i+1}. {item === 'ONIGIRI' ? 'Onigiri' : item === 'POTION' ? 'Milk' : item === 'STICK' ? 'Stick' : 'Bomb'}
                                    </li>
                                ))}
                                {inventory.length === 0 && <li>(Empty)</li>}
                            </ul>
                            <div className="absolute bottom-10 right-4 text-xs">B: Close</div>
                        </div>
                    )}

                    {/* Game Over Overlay */}
                    {gameOver && (
                        <div className="absolute inset-0 bg-[#0f380f]/80 flex flex-col items-center justify-center text-[#9bbc0f] z-30">
                            <h2 className="text-2xl font-bold mb-4">GAME OVER</h2>
                            <p>Floor: {floor}</p>
                            <p>Level: {level}</p>
                            <p className="mt-4 animate-pulse">PRESS A</p>
                        </div>
                    )}
                </div>
                
                <div className="text-center text-[#9bbc0f] font-bold italic mt-1 text-xs tracking-widest opacity-30">Nintendo GAME BOY™</div>
            </div>

            {/* Log Area */}
            <div className="bg-[#0f380f] text-[#9bbc0f] h-16 p-2 text-xs overflow-hidden mb-4 rounded border-2 border-[#306230] font-mono leading-tight">
                {logs.map((l) => (
                    <div key={l.id} className="mb-0.5">{l.message}</div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex-grow relative">
                {/* D-Pad */}
                <div className="absolute left-4 top-4 w-32 h-32">
                    <div className="w-10 h-10 bg-[#333] absolute top-0 left-10 rounded-t-md shadow-lg active:mt-1 cursor-pointer" onClick={() => handleAction('UP')}><ArrowUp className="text-[#555] mx-auto mt-2" size={20}/></div>
                    <div className="w-10 h-10 bg-[#333] absolute bottom-0 left-10 rounded-b-md shadow-lg active:mt-1 cursor-pointer" onClick={() => handleAction('DOWN')}><ArrowDown className="text-[#555] mx-auto mt-2" size={20}/></div>
                    <div className="w-10 h-10 bg-[#333] absolute top-10 left-0 rounded-l-md shadow-lg active:mt-1 cursor-pointer" onClick={() => handleAction('LEFT')}><ArrowLeft className="text-[#555] mx-auto mt-2" size={20}/></div>
                    <div className="w-10 h-10 bg-[#333] absolute top-10 right-0 rounded-r-md shadow-lg active:mt-1 cursor-pointer" onClick={() => handleAction('RIGHT')}><ArrowRight className="text-[#555] mx-auto mt-2" size={20}/></div>
                    <div className="w-10 h-10 bg-[#333] absolute top-10 left-10"></div> {/* Center */}
                </div>

                {/* A/B Buttons */}
                <div className="absolute right-4 top-8 flex gap-4 transform -rotate-12">
                    <div className="flex flex-col items-center">
                        <button 
                            className="w-12 h-12 bg-[#8b0000] rounded-full shadow-[0_4px_0_#500000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold"
                            onClick={handleCancel}
                        >
                            B
                        </button>
                    </div>
                    <div className="flex flex-col items-center mt-[-10px]">
                        <button 
                            className="w-12 h-12 bg-[#ff0000] rounded-full shadow-[0_4px_0_#8b0000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold"
                            onClick={handleConfirm}
                        >
                            A
                        </button>
                    </div>
                </div>

                {/* Select/Start */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                    <div className="w-12 h-3 bg-[#555] rounded-full transform rotate-12 shadow cursor-pointer border border-black" onClick={onBack}></div>
                    <div className="w-12 h-3 bg-[#555] rounded-full transform rotate-12 shadow cursor-pointer border border-black" onClick={() => handleAction('WAIT')}></div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-8 text-[10px] text-[#555] font-bold">
                    <span>SELECT</span>
                    <span>START</span>
                </div>
            </div>

        </div>
    </div>
  );
};

export default SchoolDungeonRPG;
