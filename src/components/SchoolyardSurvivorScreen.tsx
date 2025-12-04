
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, RotateCcw, Swords, Zap, Shield, Heart } from 'lucide-react';
import { HERO_IMAGE_DATA } from '../constants';
import { SPRITE_TEMPLATES } from './PixelSprite';

// --- GAME CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 3;
const ENEMY_SPAWN_RATE = 60; // Frames per spawn (decreases over time)
const XP_DROP_CHANCE = 0.5;

interface Entity {
    id: number;
    x: number;
    y: number;
    type: string;
    width: number;
    height: number;
    hp: number;
    maxHp: number;
    speed: number;
    damage: number;
    vx: number;
    vy: number;
    dead: boolean;
    flashTime: number; // Flash on hit
}

interface Projectile {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    speed: number;
    damage: number;
    type: 'PENCIL' | 'ERASER' | 'RULER';
    duration: number; // Frames to live
    penetration: number; // Enemies to hit before dying
    rotation: number;
    scale: number;
}

interface Gem {
    id: number;
    x: number;
    y: number;
    value: number;
    collected: boolean;
}

interface DamageText {
    id: number;
    x: number;
    y: number;
    value: number;
    life: number;
}

interface SchoolyardSurvivorScreenProps {
    onBack: () => void;
}

const SchoolyardSurvivorScreen: React.FC<SchoolyardSurvivorScreenProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Game State Refs (Mutable for loop)
    const gameState = useRef<'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_UP'>('PLAYING');
    const player = useRef<Entity>({ id: 0, x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2, type: 'WARRIOR', width: 24, height: 24, hp: 100, maxHp: 100, speed: PLAYER_SPEED, damage: 0, vx: 0, vy: 0, dead: false, flashTime: 0 });
    const enemies = useRef<Entity[]>([]);
    const projectiles = useRef<Projectile[]>([]);
    const gems = useRef<Gem[]>([]);
    const damageTexts = useRef<DamageText[]>([]);
    
    const frameCount = useRef(0);
    const score = useRef(0);
    const time = useRef(0); // Seconds
    const level = useRef(1);
    const xp = useRef(0);
    const nextLevelXp = useRef(5);
    
    // Upgrade State
    const [upgradeOptions, setUpgradeOptions] = useState<{id: string, name: string, desc: string, icon: any}[]>([]);
    const [weapons, setWeapons] = useState<{type: 'PENCIL'|'ERASER'|'RULER', level: number, cooldown: number, timer: number}[]>([
        { type: 'PENCIL', level: 1, cooldown: 60, timer: 0 }
    ]);
    const [stats, setStats] = useState({ might: 1, speed: 1, cooldownReduction: 0, area: 1 });

    // React State for UI
    const [uiState, setUiState] = useState({ hp: 100, maxHp: 100, level: 1, time: 0, score: 0, xpPercent: 0, gameOver: false });

    // Input
    const keys = useRef<Record<string, boolean>>({});
    
    // Sprite Cache
    const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});

    // --- SPRITE GENERATION (Updated to use templates) ---
    const generateFromTemplate = (templateName: string, mainColor: string, highlightColor: string): HTMLCanvasElement => {
        const template = SPRITE_TEMPLATES[templateName] || SPRITE_TEMPLATES['SLIME'];
        const size = 16;
        const scale = 2; 
        const c = document.createElement('canvas');
        c.width = size * scale;
        c.height = size * scale;
        const ctx = c.getContext('2d');
        if(!ctx) return c;
        
        const outlineColor = 'black';

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const char = template[y][x];
                if (char === '.') continue;
                
                let color = mainColor;
                if (char === '%') color = highlightColor;
                if (char === '@') color = outlineColor;
                
                ctx.fillStyle = color;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        return c;
    };

    useEffect(() => {
        // Pre-render sprites
        
        // 1. Player: Load from SVG
        const playerImg = new Image();
        playerImg.src = HERO_IMAGE_DATA;
        playerImg.onload = () => {
             const c = document.createElement('canvas');
             c.width = 32; c.height = 32;
             const ctx = c.getContext('2d');
             if(ctx) {
                 ctx.drawImage(playerImg, 0, 0, 32, 32);
                 spriteCache.current['PLAYER'] = c;
             }
        };

        // 2. Enemies: Use Templates
        // Slime (Blue)
        spriteCache.current['ENEMY_1'] = generateFromTemplate('SLIME', '#3b82f6', '#60a5fa');
        // Bat (Purple)
        spriteCache.current['ENEMY_2'] = generateFromTemplate('BAT', '#a855f7', '#c084fc');
        
        // 3. Items/Weapons
        // Pencil (Sword shape, yellow)
        spriteCache.current['PENCIL'] = generateFromTemplate('SWORD', '#fbbf24', '#fcd34d');
        // Eraser (Shield shape, white/gray)
        spriteCache.current['ERASER'] = generateFromTemplate('SHIELD', '#e5e7eb', '#ffffff');
        // Ruler (Notebook/Rect shape, green)
        spriteCache.current['RULER'] = generateFromTemplate('NOTEBOOK', '#22c55e', '#4ade80');
        // Gem (Diamond/Eye, yellow)
        spriteCache.current['GEM'] = generateFromTemplate('EYE', '#eab308', '#fde047');

        const loop = () => {
            if (gameState.current === 'PLAYING') {
                update();
            }
            draw();
            requestAnimationFrame(loop);
        };
        const animId = requestAnimationFrame(loop);

        const handleKeyDown = (e: KeyboardEvent) => keys.current[e.code] = true;
        const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [weapons, stats]); 
    
    const weaponsRef = useRef(weapons);
    useEffect(() => { weaponsRef.current = weapons; }, [weapons]);
    
    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);

    const update = () => {
        frameCount.current++;
        if (frameCount.current % 60 === 0) {
            time.current++;
            setUiState(prev => ({ ...prev, time: time.current }));
        }

        // --- Player Movement ---
        let dx = 0; let dy = 0;
        if (keys.current['ArrowUp'] || keys.current['KeyW']) dy = -1;
        if (keys.current['ArrowDown'] || keys.current['KeyS']) dy = 1;
        if (keys.current['ArrowLeft'] || keys.current['KeyA']) dx = -1;
        if (keys.current['ArrowRight'] || keys.current['KeyD']) dx = 1;
        
        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            dx /= len; dy /= len;
        }
        
        player.current.x += dx * player.current.speed * statsRef.current.speed;
        player.current.y += dy * player.current.speed * statsRef.current.speed;
        
        // Bounds
        player.current.x = Math.max(10, Math.min(CANVAS_WIDTH - 10, player.current.x));
        player.current.y = Math.max(10, Math.min(CANVAS_HEIGHT - 10, player.current.y));

        // --- Spawning ---
        // Spawn rate increases with time
        const currentSpawnRate = Math.max(10, ENEMY_SPAWN_RATE - Math.floor(time.current / 10));
        if (frameCount.current % currentSpawnRate === 0) {
            const side = Math.floor(Math.random() * 4); // 0:top, 1:right, 2:bottom, 3:left
            let ex = 0, ey = 0;
            if (side === 0) { ex = Math.random() * CANVAS_WIDTH; ey = -20; }
            else if (side === 1) { ex = CANVAS_WIDTH + 20; ey = Math.random() * CANVAS_HEIGHT; }
            else if (side === 2) { ex = Math.random() * CANVAS_WIDTH; ey = CANVAS_HEIGHT + 20; }
            else { ex = -20; ey = Math.random() * CANVAS_HEIGHT; }
            
            const type = Math.random() > 0.8 ? 'ENEMY_2' : 'ENEMY_1'; // Simple variety
            const hp = type === 'ENEMY_2' ? 30 + (time.current * 0.5) : 10 + (time.current * 0.2);
            const speed = type === 'ENEMY_2' ? 1.5 : 1;

            enemies.current.push({
                id: Math.random(),
                x: ex, y: ey,
                type,
                width: 20, height: 20,
                hp, maxHp: hp,
                speed,
                damage: 5,
                vx: 0, vy: 0,
                dead: false,
                flashTime: 0
            });
        }

        // --- Weapons ---
        weaponsRef.current.forEach(w => {
            w.timer++;
            const cd = Math.max(10, w.cooldown * (1 - statsRef.current.cooldownReduction));
            
            if (w.timer >= cd) {
                w.timer = 0;
                if (w.type === 'PENCIL') {
                    // Find nearest
                    let nearest = null;
                    let minDist = 9999;
                    enemies.current.forEach(e => {
                        const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
                        if (dist < minDist) { minDist = dist; nearest = e; }
                    });
                    
                    if (nearest) {
                        const angle = Math.atan2(nearest.y - player.current.y, nearest.x - player.current.x);
                        projectiles.current.push({
                            id: Math.random(),
                            x: player.current.x, y: player.current.y,
                            dx: Math.cos(angle) * 6, dy: Math.sin(angle) * 6,
                            speed: 6, damage: 10 * w.level * statsRef.current.might,
                            type: 'PENCIL', duration: 60, penetration: 1, rotation: angle, scale: 1
                        });
                    }
                } else if (w.type === 'ERASER') {
                    // Spawn orbiting projectile
                    projectiles.current.push({
                        id: Math.random(),
                        x: player.current.x, y: player.current.y,
                        dx: 0, dy: 0, // Logic handled in projectile update
                        speed: 0, damage: 5 * w.level * statsRef.current.might,
                        type: 'ERASER', duration: 120, penetration: 999, rotation: 0, scale: 1
                    });
                } else if (w.type === 'RULER') {
                    // Slash in random direction or facing
                    const angle = Math.random() * Math.PI * 2;
                    projectiles.current.push({
                        id: Math.random(),
                        x: player.current.x, y: player.current.y,
                        dx: Math.cos(angle) * 3, dy: Math.sin(angle) * 3,
                        speed: 3, damage: 15 * w.level * statsRef.current.might,
                        type: 'RULER', duration: 20, penetration: 999, rotation: angle, scale: 2 * statsRef.current.area
                    });
                }
            }
        });

        // --- Entities Logic ---
        enemies.current.forEach(e => {
            // Move towards player
            const angle = Math.atan2(player.current.y - e.y, player.current.x - e.x);
            e.x += Math.cos(angle) * e.speed;
            e.y += Math.sin(angle) * e.speed;
            
            // Collision with Player
            const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
            if (dist < 20) {
                if (frameCount.current % 30 === 0) { // IFrames roughly
                    player.current.hp -= e.damage;
                    player.current.flashTime = 10;
                    setUiState(prev => ({ ...prev, hp: player.current.hp }));
                    if (player.current.hp <= 0) {
                        gameState.current = 'GAME_OVER';
                        setUiState(prev => ({ ...prev, gameOver: true }));
                    }
                }
            }
            if (e.flashTime > 0) e.flashTime--;
        });

        // --- Projectiles ---
        for (let i = projectiles.current.length - 1; i >= 0; i--) {
            const p = projectiles.current[i];
            p.duration--;
            
            if (p.type === 'ERASER') {
                // Orbit Logic
                const radius = 60 * statsRef.current.area;
                const speed = 0.1;
                const angle = frameCount.current * speed + (p.id * 10); // Offset based on ID
                p.x = player.current.x + Math.cos(angle) * radius;
                p.y = player.current.y + Math.sin(angle) * radius;
            } else {
                p.x += p.dx;
                p.y += p.dy;
            }

            // Hit Detection
            enemies.current.forEach(e => {
                const dist = Math.hypot(p.x - e.x, p.y - e.y);
                if (dist < 20 * p.scale) {
                    e.hp -= p.damage;
                    e.flashTime = 5;
                    damageTexts.current.push({ id: Math.random(), x: e.x, y: e.y - 10, value: Math.floor(p.damage), life: 30 });
                    
                    if (p.type === 'PENCIL') p.penetration--;
                    
                    if (e.hp <= 0 && !e.dead) {
                        e.dead = true;
                        score.current += 10;
                        if (Math.random() < XP_DROP_CHANCE) {
                            gems.current.push({ id: Math.random(), x: e.x, y: e.y, value: 1, collected: false });
                        }
                    }
                }
            });

            if (p.duration <= 0 || p.penetration <= 0) {
                projectiles.current.splice(i, 1);
            }
        }

        // Cleanup Dead Enemies
        enemies.current = enemies.current.filter(e => !e.dead);

        // --- Gems ---
        for (let i = gems.current.length - 1; i >= 0; i--) {
            const g = gems.current[i];
            const dist = Math.hypot(g.x - player.current.x, g.y - player.current.y);
            
            // Magnet range
            if (dist < 50) {
                g.x += (player.current.x - g.x) * 0.1;
                g.y += (player.current.y - g.y) * 0.1;
            }
            
            if (dist < 15) {
                xp.current += g.value;
                gems.current.splice(i, 1);
                
                // Level Up Check
                if (xp.current >= nextLevelXp.current) {
                    xp.current -= nextLevelXp.current;
                    level.current++;
                    nextLevelXp.current = Math.floor(nextLevelXp.current * 1.5);
                    gameState.current = 'LEVEL_UP';
                    generateUpgrades();
                }
                setUiState(prev => ({ ...prev, level: level.current, xpPercent: (xp.current / nextLevelXp.current) * 100 }));
            }
        }

        // Damage Text
        damageTexts.current.forEach(d => { d.y -= 0.5; d.life--; });
        damageTexts.current = damageTexts.current.filter(d => d.life > 0);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#111827'; // Tailwind gray-900
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Grid Lines
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for(let x=0; x<=CANVAS_WIDTH; x+=gridSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_HEIGHT); ctx.stroke(); }
        for(let y=0; y<=CANVAS_HEIGHT; y+=gridSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_WIDTH,y); ctx.stroke(); }

        // Gems
        gems.current.forEach(g => {
            const sprite = spriteCache.current['GEM'];
            if (sprite) ctx.drawImage(sprite, g.x - 8, g.y - 8, 16, 16);
            else { ctx.fillStyle = '#fbbf24'; ctx.fillRect(g.x-4, g.y-4, 8, 8); }
        });

        // Enemies
        enemies.current.forEach(e => {
            const sprite = e.type === 'ENEMY_2' ? spriteCache.current['ENEMY_2'] : spriteCache.current['ENEMY_1'];
            if (e.flashTime > 0) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(e.x - e.width/2, e.y - e.height/2, e.width, e.height);
            } else {
                if (sprite) ctx.drawImage(sprite, e.x - 16, e.y - 16, 32, 32);
                else { ctx.fillStyle = 'red'; ctx.fillRect(e.x - 10, e.y - 10, 20, 20); }
            }
        });

        // Player
        if (player.current.flashTime > 0) {
             ctx.fillStyle = 'white';
             ctx.fillRect(player.current.x - 16, player.current.y - 16, 32, 32);
        } else {
             const pSprite = spriteCache.current['PLAYER'];
             if(pSprite) ctx.drawImage(pSprite, player.current.x - 16, player.current.y - 16, 32, 32);
             else { ctx.fillStyle = 'blue'; ctx.fillRect(player.current.x-16, player.current.y-16, 32, 32); }
        }

        // Projectiles
        projectiles.current.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            const sprite = spriteCache.current[p.type];
            const size = 16 * p.scale;
            if(sprite) ctx.drawImage(sprite, -size/2, -size/2, size, size);
            else { ctx.fillStyle = 'yellow'; ctx.fillRect(-5,-5,10,10); }
            ctx.restore();
        });

        // Damage Text
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        damageTexts.current.forEach(d => {
            ctx.fillText(d.value.toString(), d.x, d.y);
        });
        
        // Pause Overlay
        if (gameState.current === 'PAUSED' || gameState.current === 'LEVEL_UP') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
        }
    };

    const generateUpgrades = () => {
        const options = [
            { id: 'WEAPON_PENCIL', name: '鉛筆ミサイル', desc: '近くの敵を攻撃', icon: Swords },
            { id: 'WEAPON_ERASER', name: '消しゴムシールド', desc: '周囲を回転して守る', icon: Shield },
            { id: 'WEAPON_RULER', name: '定規スラッシュ', desc: '範囲攻撃', icon: Zap },
            { id: 'STAT_MIGHT', name: 'ムキムキ', desc: 'ダメージ +10%', icon: Swords },
            { id: 'STAT_SPEED', name: 'ダッシュ', desc: '移動速度 +10%', icon: Zap },
            { id: 'STAT_AREA', name: '広範囲', desc: '攻撃範囲 +20%', icon: Zap },
            { id: 'HEAL', name: '給食', desc: 'HP 30回復', icon: Heart }
        ];
        
        // Pick 3 random
        const picks = [];
        for(let i=0; i<3; i++) {
            picks.push(options[Math.floor(Math.random() * options.length)]);
        }
        setUpgradeOptions(picks);
    };

    const selectUpgrade = (opt: any) => {
        if (opt.id.startsWith('WEAPON_')) {
            const type = opt.id.split('_')[1];
            const existing = weapons.find(w => w.type === type);
            if (existing) {
                setWeapons(prev => prev.map(w => w.type === type ? { ...w, level: w.level + 1 } : w));
            } else {
                setWeapons(prev => [...prev, { type, level: 1, cooldown: 60, timer: 0 }]);
            }
        } else if (opt.id === 'STAT_MIGHT') {
            setStats(prev => ({ ...prev, might: prev.might + 0.1 }));
        } else if (opt.id === 'STAT_SPEED') {
            setStats(prev => ({ ...prev, speed: prev.speed + 0.1 }));
        } else if (opt.id === 'STAT_AREA') {
            setStats(prev => ({ ...prev, area: prev.area + 0.2 }));
        } else if (opt.id === 'HEAL') {
            player.current.hp = Math.min(player.current.maxHp, player.current.hp + 30);
            setUiState(prev => ({ ...prev, hp: player.current.hp }));
        }
        
        gameState.current = 'PLAYING';
    };

    const handleRestart = () => {
        player.current = { id: 0, x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2, type: 'WARRIOR', width: 24, height: 24, hp: 100, maxHp: 100, speed: PLAYER_SPEED, damage: 0, vx: 0, vy: 0, dead: false, flashTime: 0 };
        enemies.current = [];
        projectiles.current = [];
        gems.current = [];
        damageTexts.current = [];
        score.current = 0;
        time.current = 0;
        level.current = 1;
        xp.current = 0;
        nextLevelXp.current = 5;
        setWeapons([{ type: 'PENCIL', level: 1, cooldown: 60, timer: 0 }]);
        setStats({ might: 1, speed: 1, cooldownReduction: 0, area: 1 });
        setUiState({ hp: 100, maxHp: 100, level: 1, time: 0, score: 0, xpPercent: 0, gameOver: false });
        gameState.current = 'PLAYING';
    };

    return (
        <div className="flex flex-col h-full w-full bg-black text-white relative items-center justify-center font-mono">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
                <div className="flex flex-col gap-2">
                    <div className="bg-black/50 p-2 rounded border border-gray-600">
                        <div className="text-xl font-bold text-yellow-400">LV {uiState.level}</div>
                        <div className="w-32 h-2 bg-gray-700 rounded-full mt-1">
                            <div className="h-full bg-blue-500" style={{width: `${uiState.xpPercent}%`}}></div>
                        </div>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-gray-600 text-red-400 font-bold flex items-center">
                        <Heart size={16} className="mr-2 fill-current"/> {Math.ceil(uiState.hp)} / {uiState.maxHp}
                    </div>
                </div>
                <div className="bg-black/50 p-2 rounded border border-gray-600 text-center">
                    <div className="text-2xl font-mono text-white">
                        {Math.floor(uiState.time / 60).toString().padStart(2, '0')}:{(uiState.time % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-400">SCORE: {score.current}</div>
                </div>
            </div>

            {/* Canvas */}
            <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT} 
                className="border-4 border-gray-700 rounded-lg shadow-2xl bg-gray-900 max-w-full max-h-full aspect-video"
                style={{ imageRendering: 'pixelated' }}
            />

            {/* Level Up Modal */}
            {gameState.current === 'LEVEL_UP' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 animate-in zoom-in duration-200">
                    <h2 className="text-4xl font-bold text-yellow-400 mb-8 animate-pulse">LEVEL UP!</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                        {upgradeOptions.map((opt, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => selectUpgrade(opt)}
                                className="bg-slate-800 border-2 border-slate-600 hover:border-yellow-500 hover:bg-slate-700 p-6 rounded-xl flex flex-col items-center text-center transition-all group"
                            >
                                <opt.icon size={48} className="text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
                                <div className="text-xl font-bold text-white mb-2">{opt.name}</div>
                                <div className="text-sm text-gray-400">{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Game Over Modal */}
            {uiState.gameOver && (
                <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center z-20 animate-in zoom-in duration-300">
                    <h2 className="text-6xl font-bold text-white mb-4">GAME OVER</h2>
                    <div className="text-2xl text-yellow-300 mb-8">Survived: {Math.floor(uiState.time / 60)}:{(uiState.time % 60).toString().padStart(2, '0')}</div>
                    <div className="flex gap-4">
                        <button onClick={handleRestart} className="bg-white text-black px-8 py-3 rounded font-bold text-xl hover:bg-gray-200 flex items-center">
                            <RotateCcw className="mr-2"/> Retry
                        </button>
                        <button onClick={onBack} className="bg-black text-white px-8 py-3 rounded font-bold text-xl border-2 border-white hover:bg-gray-800 flex items-center">
                            <ArrowLeft className="mr-2"/> Exit
                        </button>
                    </div>
                </div>
            )}

            {/* Back Button (Only visible if not game over/level up) */}
            {gameState.current === 'PLAYING' && (
                <button onClick={onBack} className="absolute top-4 right-4 bg-gray-800/50 hover:bg-gray-700 text-white p-2 rounded border border-gray-500 z-10">
                    <ArrowLeft size={20} />
                </button>
            )}
            
            {/* Mobile Controls Hint */}
            <div className="absolute bottom-4 text-xs text-gray-500 pointer-events-none opacity-50">
                WASD / Arrows to Move
            </div>
        </div>
    );
};

export default SchoolyardSurvivorScreen;
