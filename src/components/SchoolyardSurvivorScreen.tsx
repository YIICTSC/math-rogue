

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { ArrowLeft, RotateCcw, Heart, Pause } from 'lucide-react';
import { HERO_IMAGE_DATA } from '../constants';
import PixelSprite, { SPRITE_TEMPLATES } from './PixelSprite';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';

// --- GAME CONSTANTS ---
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const PLAYER_SPEED = 4;
const BASE_XP_REQUIREMENT = 10;
const ZOOM_SCALE = 1.25;

// --- TYPES ---
type WeaponType = 
    'PENCIL' | 'ERASER' | 'RULER' | 'HIGHLIGHTER' | 'FLASK' | 'RECORDER' | 
    'SOCCER' | 'UWABAKI' | 'CURRY' | 'COMPASS' | 'MOP' | 'MAGNIFIER';

type PassiveType = 
    'PROTEIN' | 'DRILL' | 'PROTRACTOR' | 'SHOES' | 'PAD' | 'LUNCHBOX' | 
    'MAGNET' | 'TEXTBOOK' | 'ABACUS' | 'CONSOLE' | 'MILK' | 'ORIGAMI';

interface ItemSpriteConfig {
    template: string;
    color: string;
    highlight: string;
}

interface WeaponDef {
    id: WeaponType;
    name: string;
    desc: string;
    evolvedName: string;
    evolvedDesc: string;
    synergy: PassiveType;
    sprite: ItemSpriteConfig;
}

interface PassiveDef {
    id: PassiveType;
    name: string;
    desc: string;
    sprite: ItemSpriteConfig;
}

const WEAPONS: Record<WeaponType, WeaponDef> = {
    PENCIL: { 
        id: 'PENCIL', name: 'ロケット鉛筆', desc: '近くの敵を攻撃', 
        evolvedName: 'ガトリング・シャープ', evolvedDesc: '超高速連射', synergy: 'LUNCHBOX',
        sprite: { template: 'SWORD', color: '#fbbf24', highlight: '#fcd34d' } 
    },
    ERASER: { 
        id: 'ERASER', name: '消しゴムシールド', desc: '周囲を回転', 
        evolvedName: '修正液バリア', evolvedDesc: '触れた敵を消滅', synergy: 'PAD',
        sprite: { template: 'SHIELD', color: '#f3f4f6', highlight: '#ffffff' } 
    },
    RULER: { 
        id: 'RULER', name: '30cm定規', desc: '横なぎ払い', 
        evolvedName: '三角定規ブーメラン', evolvedDesc: '画面端で跳ね返る', synergy: 'PROTRACTOR',
        sprite: { template: 'SWORD', color: '#22c55e', highlight: '#86efac' }
    },
    HIGHLIGHTER: { 
        id: 'HIGHLIGHTER', name: '蛍光ペン', desc: '直線ビーム', 
        evolvedName: 'レーザーポインター', evolvedDesc: '天からの極太レーザー', synergy: 'TEXTBOOK',
        sprite: { template: 'SWORD', color: '#f0abfc', highlight: '#fae8ff' }
    },
    FLASK: { 
        id: 'FLASK', name: '理科室のフラスコ', desc: '爆発する瓶を投げる', 
        evolvedName: '実験失敗', evolvedDesc: '毒の霧を撒き散らす', synergy: 'MAGNET',
        sprite: { template: 'POTION', color: '#3b82f6', highlight: '#93c5fd' }
    },
    RECORDER: { 
        id: 'RECORDER', name: 'リコーダー', desc: '音波で押し返す', 
        evolvedName: '校内放送(メタル)', evolvedDesc: '画面全体攻撃＆スタン', synergy: 'DRILL',
        sprite: { template: 'SWORD', color: '#fca5a5', highlight: '#ffe4e6' }
    },
    SOCCER: { 
        id: 'SOCCER', name: 'サッカーボール', desc: '跳ね返るボール', 
        evolvedName: 'ドッジボールの神', evolvedDesc: '超高速乱反射', synergy: 'SHOES',
        sprite: { template: 'SLIME', color: '#ffffff', highlight: '#d1d5db' } // Round shape
    },
    UWABAKI: { 
        id: 'UWABAKI', name: '上履きミサイル', desc: '強敵を追尾', 
        evolvedName: 'ドローン配送', evolvedDesc: '編隊爆撃', synergy: 'CONSOLE',
        sprite: { template: 'SHOE', color: '#ef4444', highlight: '#fca5a5' }
    },
    CURRY: { 
        id: 'CURRY', name: '給食のカレー', desc: 'ダメージ床生成', 
        evolvedName: '激辛麻婆豆腐', evolvedDesc: 'マグマ地帯を生成', synergy: 'MILK',
        sprite: { template: 'SLIME', color: '#d97706', highlight: '#fbbf24' }
    },
    COMPASS: { 
        id: 'COMPASS', name: 'コンパス針', desc: '進行方向へ突き', 
        evolvedName: 'ドリルスパイラル', evolvedDesc: '無敵突進', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#94a3b8', highlight: '#cbd5e1' }
    },
    MOP: { 
        id: 'MOP', name: '掃除モップ', desc: '広範囲なぎ払い', 
        evolvedName: '聖なるハタキ', evolvedDesc: '弾消し＆衝撃波', synergy: 'ORIGAMI',
        sprite: { template: 'PLANT', color: '#a8a29e', highlight: '#e7e5e4' }
    },
    MAGNIFIER: { 
        id: 'MAGNIFIER', name: '虫眼鏡', desc: '定点照射攻撃', 
        evolvedName: '天体望遠鏡', evolvedDesc: '巨大な光の柱', synergy: 'ABACUS',
        sprite: { template: 'EYE', color: '#60a5fa', highlight: '#bfdbfe' }
    },
};

const PASSIVES: Record<PassiveType, PassiveDef> = {
    PROTEIN: { id: 'PROTEIN', name: 'ムキムキプロテイン', desc: 'ダメージ +10%', sprite: { template: 'MUSCLE', color: '#ef4444', highlight: '#fca5a5' } },
    DRILL: { id: 'DRILL', name: '計算ドリル', desc: 'クールダウン -5%', sprite: { template: 'NOTEBOOK', color: '#fcd34d', highlight: '#fef08a' } },
    PROTRACTOR: { id: 'PROTRACTOR', name: '分度器', desc: '攻撃範囲 +10%', sprite: { template: 'SHIELD', color: '#60a5fa', highlight: '#bfdbfe' } },
    SHOES: { id: 'SHOES', name: '瞬足シューズ', desc: '移動速度 +10%', sprite: { template: 'SHOE', color: '#3b82f6', highlight: '#93c5fd' } },
    PAD: { id: 'PAD', name: '硬い下敷き', desc: '被ダメ -1', sprite: { template: 'SHIELD', color: '#a855f7', highlight: '#d8b4fe' } },
    LUNCHBOX: { id: 'LUNCHBOX', name: '早弁セット', desc: '弾速 +10%', sprite: { template: 'BACKPACK', color: '#f97316', highlight: '#fdba74' } },
    MAGNET: { id: 'MAGNET', name: 'U字磁石', desc: '回収範囲拡大', sprite: { template: 'SHIELD', color: '#ef4444', highlight: '#d1d5db' } }, // Red/Grey
    TEXTBOOK: { id: 'TEXTBOOK', name: '教科書', desc: '効果時間 +10%', sprite: { template: 'NOTEBOOK', color: '#22c55e', highlight: '#86efac' } },
    ABACUS: { id: 'ABACUS', name: 'そろばん', desc: '発射数 +1', sprite: { template: 'NOTEBOOK', color: '#78350f', highlight: '#b45309' } },
    CONSOLE: { id: 'CONSOLE', name: 'ゲーム機', desc: 'クリティカル率UP', sprite: { template: 'ROBOT', color: '#4b5563', highlight: '#9ca3af' } },
    MILK: { id: 'MILK', name: '牛乳', desc: 'HP自然回復', sprite: { template: 'POTION', color: '#ffffff', highlight: '#e5e7eb' } },
    ORIGAMI: { id: 'ORIGAMI', name: '金ピカ折り紙', desc: '獲得ゴールドUP', sprite: { template: 'FLIER', color: '#eab308', highlight: '#fef08a' } },
};

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
    flashTime: number;
    frozen?: number;
    knockback?: { x: number, y: number, time: number };
}

interface Projectile {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    damage: number;
    type: WeaponType | 'EVOLVED';
    subType?: string; // For evolved distinct visuals
    duration: number;
    penetration: number;
    rotation: number;
    scale: number;
    knockback: number;
    ownerId?: number; // For orbiting
    hitIds: number[]; // IDs of enemies already hit (for limited penetration)
    speed?: number; // Added
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
    value: number | string;
    color: string;
    life: number;
}

interface SchoolyardSurvivorScreenProps {
    onBack: () => void;
}

// --- UTILS ---
const createFlashSprite = (source: HTMLCanvasElement): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext('2d');
    if (ctx) {
        ctx.drawImage(source, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, c.width, c.height);
    }
    return c;
};

// Generate Schoolyard Background
const createSchoolyardBackground = (): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = WORLD_WIDTH;
    c.height = WORLD_HEIGHT;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    // Dirt base
    ctx.fillStyle = '#5d4037'; // Earthy brown
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Random pebbles and grass tufts
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_HEIGHT;
        const size = Math.random() * 4 + 1;
        const type = Math.random();
        
        if (type < 0.6) {
            // Darker dirt spec
            ctx.fillStyle = '#4e342e'; 
        } else if (type < 0.9) {
            // Lighter pebble
            ctx.fillStyle = '#8d6e63';
        } else {
            // Grass
            ctx.fillStyle = '#33691e';
        }
        ctx.fillRect(x, y, size, size);
    }

    // Track Lines (White Chalk)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    // Outer Track
    ctx.beginPath();
    const margin = 200;
    const r = 300;
    ctx.roundRect(margin, margin, WORLD_WIDTH - margin * 2, WORLD_HEIGHT - margin * 2, r);
    ctx.stroke();

    // Inner markings
    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH / 2, margin);
    ctx.lineTo(WORLD_WIDTH / 2, margin + 200);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH / 2, WORLD_HEIGHT - margin);
    ctx.lineTo(WORLD_WIDTH / 2, WORLD_HEIGHT - margin - 200);
    ctx.stroke();

    // Center Circle
    ctx.beginPath();
    ctx.arc(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 150, 0, Math.PI * 2);
    ctx.stroke();

    return c;
};

const SchoolyardSurvivorScreen: React.FC<SchoolyardSurvivorScreenProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
    
    // Viewport
    const [viewSize, setViewSize] = useState({ width: 800, height: 600 });
    const viewSizeRef = useRef({ width: 800, height: 600 }); // Ref for loop access
    const camera = useRef({ x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2 }); // Start centered

    // Game State
    const gameState = useRef<'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_UP'>('PLAYING');
    const player = useRef<Entity>({ id: 0, x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, type: 'WARRIOR', width: 24, height: 24, hp: 100, maxHp: 100, speed: PLAYER_SPEED, damage: 0, vx: 0, vy: 0, dead: false, flashTime: 0 });
    const enemies = useRef<Entity[]>([]);
    const projectiles = useRef<Projectile[]>([]);
    const gems = useRef<Gem[]>([]);
    const damageTexts = useRef<DamageText[]>([]);
    
    const frameCount = useRef(0);
    const score = useRef(0);
    const time = useRef(0);
    const level = useRef(1);
    const xp = useRef(0);
    const nextLevelXp = useRef(BASE_XP_REQUIREMENT);
    
    // Inventory
    const [weapons, setWeapons] = useState<Record<WeaponType, { level: number, cooldownTimer: number } | undefined>>({
        PENCIL: { level: 1, cooldownTimer: 0 },
        ERASER: undefined, RULER: undefined, HIGHLIGHTER: undefined, FLASK: undefined, RECORDER: undefined,
        SOCCER: undefined, UWABAKI: undefined, CURRY: undefined, COMPASS: undefined, MOP: undefined, MAGNIFIER: undefined
    });
    const [passives, setPassives] = useState<Record<PassiveType, number>>({
        PROTEIN: 0, DRILL: 0, PROTRACTOR: 0, SHOES: 0, PAD: 0, LUNCHBOX: 0,
        MAGNET: 0, TEXTBOOK: 0, ABACUS: 0, CONSOLE: 0, MILK: 0, ORIGAMI: 0
    });

    const [upgradeOptions, setUpgradeOptions] = useState<any[]>([]);
    const [uiState, setUiState] = useState({ hp: 100, maxHp: 100, level: 1, time: 0, score: 0, xpPercent: 0, gameOver: false });

    // Input & Cache
    const keys = useRef<Record<string, boolean>>({});
    const joystickRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const [joystickUI, setJoystickUI] = useState<{ active: boolean, startX: number, startY: number, curX: number, curY: number } | null>(null);
    const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});
    const lastDir = useRef<{x:number, y:number}>({x:1, y:0}); // For directional attacks

    // --- Resize Logic ---
    useLayoutEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth;
                const h = containerRef.current.clientHeight;
                setViewSize({ width: w, height: h });
                viewSizeRef.current = { width: w, height: h };
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // --- HELPER: Template Gen ---
    const generateFromTemplate = (templateName: string, mainColor: string, highlightColor: string): HTMLCanvasElement => {
        const template = SPRITE_TEMPLATES[templateName] || SPRITE_TEMPLATES['SLIME'];
        const size = 16;
        const scale = 2; // Base texture scale
        const c = document.createElement('canvas');
        c.width = size * scale;
        c.height = size * scale;
        const ctx = c.getContext('2d');
        if(!ctx) return c;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const char = template[y][x];
                if (char === '.') continue;
                ctx.fillStyle = char === '%' ? highlightColor : (char === '@' ? 'black' : mainColor);
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        return c;
    };

    // --- SETUP ---
    useEffect(() => {
        audioService.playBGM('survivor_metal');

        // Prepare Background
        bgCanvasRef.current = createSchoolyardBackground();

        const playerImg = new Image();
        playerImg.src = HERO_IMAGE_DATA;
        playerImg.onload = () => {
             const c = document.createElement('canvas'); c.width = 32; c.height = 32;
             const ctx = c.getContext('2d');
             if(ctx) { ctx.drawImage(playerImg, 0, 0, 32, 32); spriteCache.current['PLAYER'] = c; spriteCache.current['PLAYER_FLASH'] = createFlashSprite(c); }
        };

        // Enemy Sprites Generation
        // ENEMY_1: Slime (Blue)
        const e1 = generateFromTemplate('SLIME', '#3b82f6', '#60a5fa');
        spriteCache.current['ENEMY_1'] = e1; spriteCache.current['ENEMY_1_FLASH'] = createFlashSprite(e1);
        
        // ENEMY_2: Bat (Purple)
        const e2 = generateFromTemplate('BAT', '#a855f7', '#c084fc');
        spriteCache.current['ENEMY_2'] = e2; spriteCache.current['ENEMY_2_FLASH'] = createFlashSprite(e2);

        // ENEMY_3: Skeleton (White/Grey)
        const e3 = generateFromTemplate('SKELETON', '#e5e7eb', '#f3f4f6');
        spriteCache.current['ENEMY_3'] = e3; spriteCache.current['ENEMY_3_FLASH'] = createFlashSprite(e3);

        // ENEMY_4: Ghost (Cyan/Translucent look)
        const e4 = generateFromTemplate('GHOST', '#a5f3fc', '#cffafe');
        spriteCache.current['ENEMY_4'] = e4; spriteCache.current['ENEMY_4_FLASH'] = createFlashSprite(e4);

        // ENEMY_5: Robot (Metal Grey)
        const e5 = generateFromTemplate('ROBOT', '#6b7280', '#9ca3af');
        spriteCache.current['ENEMY_5'] = e5; spriteCache.current['ENEMY_5_FLASH'] = createFlashSprite(e5);

        // ENEMY_6: Teacher (Boss, Red)
        const e6 = generateFromTemplate('TEACHER', '#ef4444', '#fca5a5');
        spriteCache.current['ENEMY_6'] = e6; spriteCache.current['ENEMY_6_FLASH'] = createFlashSprite(e6);
        
        // Item Sprites (Generated from WEAPONS config)
        Object.values(WEAPONS).forEach(w => {
            spriteCache.current[w.id] = generateFromTemplate(w.sprite.template, w.sprite.color, w.sprite.highlight);
        });
        
        // Gem Sprite
        spriteCache.current['GEM'] = generateFromTemplate('EYE', '#eab308', '#fde047');

        const loop = () => {
            if (gameState.current === 'PLAYING') update();
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
            audioService.stopBGM();
        };
    }, []); 

    // Sync state refs for loop
    const weaponsRef = useRef(weapons);
    useEffect(() => { weaponsRef.current = weapons; }, [weapons]);
    const passivesRef = useRef(passives);
    useEffect(() => { passivesRef.current = passives; }, [passives]);

    const saveRecord = () => {
        // Collect weapons for record
        const ownedWeapons = (Object.keys(weaponsRef.current) as WeaponType[]).filter(k => weaponsRef.current[k] !== undefined);
        storageService.saveSurvivorScore({
            id: `survivor-${Date.now()}`,
            date: Date.now(),
            timeSurvived: time.current,
            levelReached: level.current,
            weapons: ownedWeapons
        });
    };

    // --- GAME LOGIC ---
    const update = () => {
        frameCount.current++;
        if (frameCount.current % 60 === 0) {
            time.current++;
            // Passive Regen
            if (passivesRef.current.MILK > 0) {
                const regen = passivesRef.current.MILK * 1; 
                player.current.hp = Math.min(player.current.maxHp, player.current.hp + regen);
            }
            setUiState(prev => ({ ...prev, time: time.current, hp: player.current.hp }));
        }

        // Stats Calculation
        const might = 1 + (passivesRef.current.PROTEIN * 0.1);
        const cooldownReduc = 1 - (passivesRef.current.DRILL * 0.05);
        const area = 1 + (passivesRef.current.PROTRACTOR * 0.1);
        const speed = 1 + (passivesRef.current.SHOES * 0.1);
        const defense = passivesRef.current.PAD * 1;
        const projSpeed = 1 + (passivesRef.current.LUNCHBOX * 0.1);
        const magnet = 50 + (passivesRef.current.MAGNET * 20);
        const duration = 1 + (passivesRef.current.TEXTBOOK * 0.1);
        const amount = passivesRef.current.ABACUS;
        const luck = 1 + (passivesRef.current.CONSOLE * 0.1);

        // Player Move
        let dx = 0; let dy = 0;
        if (keys.current['ArrowUp'] || keys.current['KeyW']) dy = -1;
        if (keys.current['ArrowDown'] || keys.current['KeyS']) dy = 1;
        if (keys.current['ArrowLeft'] || keys.current['KeyA']) dx = -1;
        if (keys.current['ArrowRight'] || keys.current['KeyD']) dx = 1;
        if (joystickRef.current.x !== 0 || joystickRef.current.y !== 0) { dx = joystickRef.current.x; dy = joystickRef.current.y; }
        
        if (dx !== 0 || dy !== 0) {
            // Normalize
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len > 0) { dx /= len; dy /= len; }
            lastDir.current = { x: dx, y: dy };
        }

        player.current.x += dx * player.current.speed * speed;
        player.current.y += dy * player.current.speed * speed;
        player.current.x = Math.max(16, Math.min(WORLD_WIDTH - 16, player.current.x));
        player.current.y = Math.max(16, Math.min(WORLD_HEIGHT - 16, player.current.y));
        if (player.current.flashTime > 0) player.current.flashTime--;

        // Camera Follow (Use viewSizeRef to prevent stale closure)
        const vw = viewSizeRef.current.width / ZOOM_SCALE;
        const vh = viewSizeRef.current.height / ZOOM_SCALE;

        // X Axis Camera
        if (vw >= WORLD_WIDTH) {
            camera.current.x = WORLD_WIDTH / 2;
        } else {
            camera.current.x = Math.max(vw/2, Math.min(WORLD_WIDTH - vw/2, player.current.x));
        }

        // Y Axis Camera
        if (vh >= WORLD_HEIGHT) {
            camera.current.y = WORLD_HEIGHT / 2;
        } else {
            camera.current.y = Math.max(vh/2, Math.min(WORLD_HEIGHT - vh/2, player.current.y));
        }

        // Weapon Firing
        Object.keys(weaponsRef.current).forEach((key) => {
            const wType = key as WeaponType;
            const wData = weaponsRef.current[wType];
            if (!wData) return;

            wData.cooldownTimer--;
            if (wData.cooldownTimer <= 0) {
                const isEvolved = wData.level >= 8 && passivesRef.current[WEAPONS[wType].synergy] > 0;
                // Basic stats
                const dmg = 10 * wData.level * might;
                const sz = 1 * area;
                const spd = 5 * projSpeed;
                
                fireWeapon(wType, wData.level, isEvolved, dmg, sz, spd, duration, amount, luck);
                
                // Base CD
                let baseCd = 60;
                if (wType === 'ERASER') baseCd = 120;
                if (wType === 'RULER') baseCd = 50;
                if (wType === 'HIGHLIGHTER') baseCd = 10; // Rapid
                if (wType === 'COMPASS') baseCd = 40;
                if (wType === 'UWABAKI') baseCd = 80;
                
                // Fire rate increase with level
                baseCd = Math.max(5, baseCd * Math.pow(0.9, wData.level-1) * cooldownReduc);
                wData.cooldownTimer = baseCd;
            }
        });

        // Entity Logic
        enemies.current.forEach(e => {
            if (e.knockback && e.knockback.time > 0) {
                e.x += e.knockback.x;
                e.y += e.knockback.y;
                e.knockback.time--;
            } else {
                const angle = Math.atan2(player.current.y - e.y, player.current.x - e.x);
                e.x += Math.cos(angle) * e.speed;
                e.y += Math.sin(angle) * e.speed;
            }

            const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
            if (dist < 20 && player.current.flashTime <= 0) {
                const finalDmg = Math.max(1, e.damage - defense);
                player.current.hp -= finalDmg;
                player.current.flashTime = 30;
                damageTexts.current.push({ id: Math.random(), x: player.current.x, y: player.current.y - 20, value: `-${Math.floor(finalDmg)}`, color: 'red', life: 60 });
                if (player.current.hp <= 0) { 
                    gameState.current = 'GAME_OVER'; 
                    saveRecord();
                    setUiState(prev => ({ ...prev, gameOver: true })); 
                    audioService.playSound('lose');
                }
                setUiState(prev => ({ ...prev, hp: player.current.hp }));
            }
            if (e.flashTime > 0) e.flashTime--;
        });

        // Projectiles
        for (let i = projectiles.current.length - 1; i >= 0; i--) {
            const p = projectiles.current[i];
            p.duration--;
            
            // Movement Logic
            if (p.type === 'ERASER') {
                const t = frameCount.current * 0.05 + (p.id * 10);
                const radius = 60 * p.scale;
                p.x = player.current.x + Math.cos(t) * radius;
                p.y = player.current.y + Math.sin(t) * radius;
            } else if (p.type === 'HIGHLIGHTER') {
                p.x = player.current.x + Math.cos(p.rotation) * 40; 
                p.y = player.current.y + Math.sin(p.rotation) * 40;
            } else if (p.type === 'UWABAKI') {
                // Homing
                let target = null;
                let maxHp = -1;
                // Only target visible/close enemies for performance
                enemies.current.forEach(e => { 
                    if(Math.abs(e.x - p.x) < 400 && Math.abs(e.y - p.y) < 300) {
                        if(e.hp > maxHp){ maxHp = e.hp; target = e; } 
                    }
                });
                if (target) {
                    const angle = Math.atan2((target as Entity).y - p.y, (target as Entity).x - p.x);
                    p.dx = Math.cos(angle) * (p.speed || 0);
                    p.dy = Math.sin(angle) * (p.speed || 0);
                }
                p.x += p.dx; p.y += p.dy;
            } else if (p.type === 'CURRY') {
                // Static
            } else {
                p.x += p.dx; p.y += p.dy;
                // Bounce Logic for Soccer
                if (p.type === 'SOCCER') {
                    if (p.x < 0 || p.x > WORLD_WIDTH) p.dx *= -1;
                    if (p.y < 0 || p.y > WORLD_HEIGHT) p.dy *= -1;
                }
                if (p.type === 'RULER') {
                    p.rotation += 0.2; // Spin
                }
            }

            // Hit Detect
            let hit = false;
            for (const e of enemies.current) {
                if (p.hitIds.includes(e.id)) continue;
                
                // Only check if close enough
                if (Math.abs(p.x - e.x) > 100 || Math.abs(p.y - e.y) > 100) continue;

                const range = (p.type === 'MOP' || p.type === 'RECORDER' || p.type === 'FLASK') ? 60 : 20;
                const dist = Math.hypot(p.x - e.x, p.y - e.y);
                
                if (dist < range * p.scale) {
                    if (p.type === 'HIGHLIGHTER' || p.type === 'CURRY' || p.type === 'MAGNIFIER') {
                        if (frameCount.current % 10 === 0) {
                            applyDamage(e, p);
                        }
                    } else {
                        applyDamage(e, p);
                        p.penetration--;
                        if (p.penetration <= 0) hit = true;
                    }
                    
                    if (p.type === 'SOCCER') {
                        // Bounce off enemy
                        p.dx = (Math.random() - 0.5) * (p.speed || 0) * 2;
                        p.dy = (Math.random() - 0.5) * (p.speed || 0) * 2;
                    }
                }
            }
            if (hit || p.duration <= 0) projectiles.current.splice(i, 1);
        }

        // Spawn Logic (Enhanced)
        const spawnRate = Math.max(5, 60 - Math.floor(time.current / 5));
        if (frameCount.current % spawnRate === 0) {
            // Spawn around player, just outside view
            const angle = Math.random() * Math.PI * 2;
            const dist = 600; // Adjusted for zoom
            const ex = player.current.x + Math.cos(angle) * dist;
            const ey = player.current.y + Math.sin(angle) * dist;
            
            // Keep within world bounds
            const clampX = Math.max(0, Math.min(WORLD_WIDTH, ex));
            const clampY = Math.max(0, Math.min(WORLD_HEIGHT, ey));

            const timeSec = time.current;
            let enemyType = 'ENEMY_1';
            let hp = 10;
            let speed = 1;
            let width = 24;
            let height = 24;

            // Progression Logic
            if (timeSec < 30) {
                // 0-30s: Slimes (Easy)
                hp = 10; speed = 1 + Math.random() * 0.5;
            } else if (timeSec < 60) {
                // 30-60s: Slimes + Bats (Fast)
                enemyType = Math.random() < 0.5 ? 'ENEMY_1' : 'ENEMY_2';
                hp = 15; speed = enemyType === 'ENEMY_2' ? 2.5 : 1.5;
            } else if (timeSec < 120) {
                // 60-120s: Skeletons (Tough) + Bats
                enemyType = Math.random() < 0.4 ? 'ENEMY_2' : 'ENEMY_3';
                hp = enemyType === 'ENEMY_3' ? 35 : 20; 
                speed = 1.5;
            } else if (timeSec < 180) {
                // 120-180s: Ghosts (Fast) & Robots (Very Fast)
                const r = Math.random();
                enemyType = r < 0.3 ? 'ENEMY_3' : (r < 0.6 ? 'ENEMY_4' : 'ENEMY_5');
                hp = 50; 
                speed = enemyType === 'ENEMY_5' ? 3.5 : (enemyType === 'ENEMY_4' ? 2 : 1.5);
            } else {
                // 180s+: All + Teacher (Boss)
                const r = Math.random();
                if (r < 0.05) {
                    enemyType = 'ENEMY_6'; // Teacher
                    hp = 300 + (timeSec - 180) * 2; // Scaling Boss HP
                    speed = 0.8;
                    width = 48; height = 48; // Big
                } else if (r < 0.4) {
                    enemyType = 'ENEMY_5';
                    hp = 70; speed = 3.5;
                } else {
                    enemyType = 'ENEMY_4';
                    hp = 60; speed = 2.5;
                }
            }

            enemies.current.push({
                id: Math.random(), x: clampX, y: clampY, type: enemyType,
                width: width, height: height, hp: hp, maxHp: hp,
                speed: speed, damage: 5 + Math.floor(timeSec/60), vx: 0, vy: 0, dead: false, flashTime: 0
            });
        }

        // Gems & Cleanup
        enemies.current = enemies.current.filter(e => !e.dead);
        for (let i = gems.current.length - 1; i >= 0; i--) {
            const g = gems.current[i];
            const dist = Math.hypot(g.x - player.current.x, g.y - player.current.y);
            if (dist < magnet) {
                g.x += (player.current.x - g.x) * 0.1;
                g.y += (player.current.y - g.y) * 0.1;
            }
            if (dist < 20) {
                xp.current += g.value;
                gems.current.splice(i, 1);
                if (xp.current >= nextLevelXp.current) {
                    gameState.current = 'LEVEL_UP';
                    xp.current -= nextLevelXp.current;
                    level.current++;
                    nextLevelXp.current = Math.floor(nextLevelXp.current * 1.2);
                    generateUpgrades();
                    audioService.playSound('win');
                }
                setUiState(prev => ({ ...prev, level: level.current, xpPercent: (xp.current/nextLevelXp.current)*100 }));
            }
        }
        damageTexts.current.forEach(d => { d.y -= 0.5; d.life--; });
        damageTexts.current = damageTexts.current.filter(d => d.life > 0);
    };

    const applyDamage = (e: Entity, p: Projectile) => {
        let dmg = p.damage;
        // Critical Hit (Luck)
        if (Math.random() < (0.05 * (passivesRef.current.CONSOLE ? 1.5 : 1))) {
            dmg *= 2;
            damageTexts.current.push({ id: Math.random(), x: e.x, y: e.y-10, value: `${Math.floor(dmg)}!`, color: 'yellow', life: 40 });
        } else {
            damageTexts.current.push({ id: Math.random(), x: e.x, y: e.y-10, value: Math.floor(dmg), color: 'white', life: 30 });
        }
        
        e.hp -= dmg;
        e.flashTime = 5;
        p.hitIds.push(e.id);
        
        // Knockback
        const kbForce = p.knockback;
        if (kbForce > 0) {
            const angle = Math.atan2(e.y - p.y, e.x - p.x);
            e.knockback = { x: Math.cos(angle)*kbForce, y: Math.sin(angle)*kbForce, time: 5 };
        }

        if (e.hp <= 0 && !e.dead) {
            e.dead = true;
            score.current += 10;
            if (Math.random() < 0.7) {
                gems.current.push({ id: Math.random(), x: e.x, y: e.y, value: 1, collected: false });
            }
        }
    };

    const fireWeapon = (type: WeaponType, level: number, evolved: boolean, dmg: number, scale: number, speed: number, duration: number, amount: number, luck: number) => {
        const p = player.current;
        const count = 1 + amount + Math.floor(level/3); // Base count increases with level + passive
        
        if (Math.random() < 0.3) audioService.playSound('attack'); // SFX Limiter

        switch (type) {
            case 'PENCIL':
                let target = null;
                let min = 9999;
                enemies.current.forEach(e => { const d = Math.hypot(e.x-p.x, e.y-p.y); if(d<min){ min=d; target=e; } });
                if (target) {
                    const angle = Math.atan2((target as Entity).y - p.y, (target as Entity).x - p.x);
                    const volleys = evolved ? 3 : 1; 
                    for(let v=0; v<volleys; v++) {
                        setTimeout(() => {
                            projectiles.current.push({
                                id: Math.random(), x: p.x, y: p.y,
                                dx: Math.cos(angle + (Math.random()-0.5)*0.2) * speed * (evolved?2:1), 
                                dy: Math.sin(angle + (Math.random()-0.5)*0.2) * speed * (evolved?2:1),
                                damage: dmg, type: evolved ? 'EVOLVED' : 'PENCIL', subType: 'PENCIL',
                                duration: 60, penetration: evolved ? 3 : 1 + Math.floor(level/4),
                                rotation: angle, scale: scale, knockback: 2, hitIds: []
                            });
                        }, v * 100);
                    }
                }
                break;
            case 'ERASER':
                for (let i=0; i<count; i++) {
                    const angle = (Math.PI * 2 / count) * i;
                    projectiles.current.push({
                        id: i, x: p.x, y: p.y, dx: 0, dy: 0,
                        damage: dmg, type: evolved ? 'EVOLVED' : 'ERASER', subType: 'ERASER',
                        duration: 120 * duration, penetration: 999, rotation: 0, scale: scale * (evolved?1.5:1), knockback: 5, hitIds: []
                    });
                }
                break;
            case 'RULER':
                // Slash area
                const facing = Math.atan2(lastDir.current.y, lastDir.current.x);
                projectiles.current.push({
                    id: Math.random(), x: p.x, y: p.y, 
                    dx: Math.cos(facing)*2, dy: Math.sin(facing)*2,
                    damage: dmg, type: evolved ? 'EVOLVED' : 'RULER', subType: 'RULER',
                    duration: 15, penetration: 999, rotation: facing, scale: scale * 2, knockback: 8, hitIds: []
                });
                break;
            case 'HIGHLIGHTER':
                const beamAngle = Math.atan2(lastDir.current.y, lastDir.current.x);
                projectiles.current.push({
                    id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0,
                    damage: dmg/5, type: evolved ? 'EVOLVED' : 'HIGHLIGHTER', subType: 'HIGHLIGHTER',
                    duration: 30 * duration, penetration: 999, rotation: beamAngle, scale: scale * (evolved?2:1), knockback: 0, hitIds: []
                });
                break;
            case 'FLASK':
                const tx = p.x + (Math.random()-0.5)*300;
                const ty = p.y + (Math.random()-0.5)*300;
                projectiles.current.push({
                    id: Math.random(), x: tx, y: ty, dx: 0, dy: 0,
                    damage: dmg * 3, type: evolved ? 'EVOLVED' : 'FLASK', subType: 'FLASK',
                    duration: 20, penetration: 999, rotation: 0, scale: scale * 3, knockback: 2, hitIds: []
                });
                break;
            case 'RECORDER':
                projectiles.current.push({
                    id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0,
                    damage: dmg, type: evolved ? 'EVOLVED' : 'RECORDER', subType: 'RECORDER',
                    duration: 10, penetration: 999, rotation: 0, scale: scale * 5, knockback: 10, hitIds: []
                });
                break;
            case 'SOCCER':
                for(let i=0; i<count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    projectiles.current.push({
                        id: Math.random(), x: p.x, y: p.y,
                        dx: Math.cos(angle)*speed, dy: Math.sin(angle)*speed,
                        damage: dmg, type: evolved ? 'EVOLVED' : 'SOCCER', subType: 'SOCCER',
                        duration: 120 * duration, penetration: evolved ? 999 : 3 + Math.floor(level/2),
                        rotation: 0, scale: scale, knockback: 5, hitIds: [],
                        speed: speed
                    });
                }
                break;
            case 'UWABAKI':
                projectiles.current.push({
                    id: Math.random(), x: p.x, y: p.y,
                    dx: 0, dy: 0,
                    damage: dmg * 2, type: evolved ? 'EVOLVED' : 'UWABAKI', subType: 'UWABAKI',
                    speed: speed * (evolved?2:1),
                    duration: 300, penetration: 1, rotation: 0, scale: scale, knockback: 2, hitIds: []
                });
                break;
            case 'CURRY':
                projectiles.current.push({
                    id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0,
                    damage: dmg/10, type: evolved ? 'EVOLVED' : 'CURRY', subType: 'CURRY',
                    duration: 300 * duration, penetration: 999, rotation: 0, scale: scale * 2, knockback: 0, hitIds: []
                });
                break;
            case 'COMPASS':
                const cAngle = Math.atan2(lastDir.current.y, lastDir.current.x);
                for(let i=0; i<count+2; i++) {
                    setTimeout(() => {
                        projectiles.current.push({
                            id: Math.random(), x: p.x, y: p.y, 
                            dx: Math.cos(cAngle)*4, dy: Math.sin(cAngle)*4,
                            damage: dmg, type: evolved ? 'EVOLVED' : 'COMPASS', subType: 'COMPASS',
                            duration: 5, penetration: 999, rotation: cAngle, scale: scale, knockback: 2, hitIds: []
                        });
                    }, i * 100);
                }
                break;
            case 'MOP':
                const mAngle = Math.atan2(lastDir.current.y, lastDir.current.x);
                projectiles.current.push({
                    id: Math.random(), x: p.x, y: p.y, dx: Math.cos(mAngle), dy: Math.sin(mAngle),
                    damage: dmg, type: evolved ? 'EVOLVED' : 'MOP', subType: 'MOP',
                    duration: 30, penetration: 999, rotation: mAngle, scale: scale * 3, knockback: 5, hitIds: []
                });
                break;
            case 'MAGNIFIER':
                const mx = p.x + (Math.random()-0.5)*400;
                const my = p.y + (Math.random()-0.5)*400;
                projectiles.current.push({
                    id: Math.random(), x: mx, y: my, dx: 0, dy: 0,
                    damage: dmg * 5, type: evolved ? 'EVOLVED' : 'MAGNIFIER', subType: 'MAGNIFIER',
                    duration: 40, penetration: 999, rotation: 0, scale: scale * 2, knockback: 0, hitIds: []
                });
                break;
        }
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use ref for view size to avoid stale closures
        const { width: viewW, height: viewH } = viewSizeRef.current;

        // Clear
        ctx.fillStyle = '#111827'; 
        ctx.fillRect(0, 0, viewW, viewH);

        ctx.save();
        
        // Camera Transform (Center on screen)
        // Move to center of screen
        ctx.translate(viewW/2, viewH/2);
        // Apply Zoom
        ctx.scale(ZOOM_SCALE, ZOOM_SCALE);
        // Translate camera (inverted) to center player
        ctx.translate(-camera.current.x, -camera.current.y);

        // Draw Background (Cached)
        if (bgCanvasRef.current) {
            ctx.drawImage(bgCanvasRef.current, 0, 0);
        } else {
            // Fallback
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        }

        // Gems
        gems.current.forEach(g => {
            // Cull
            if (Math.abs(g.x - camera.current.x) > (viewW/ZOOM_SCALE) || Math.abs(g.y - camera.current.y) > (viewH/ZOOM_SCALE)) return;
            const sprite = spriteCache.current['GEM'];
            if(sprite) ctx.drawImage(sprite, g.x-8, g.y-8, 16, 16);
        });

        // Projectiles
        projectiles.current.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            let spriteKey = p.type === 'EVOLVED' ? (p.subType || 'PENCIL') : p.type;
            const sprite = spriteCache.current[spriteKey];
            
            if (p.type === 'HIGHLIGHTER' || p.subType === 'HIGHLIGHTER') {
                ctx.fillStyle = p.type === 'EVOLVED' ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,0,0.3)';
                ctx.fillRect(0, -10 * p.scale, 800, 20 * p.scale); // Beam
            } else if (p.type === 'RECORDER' || p.subType === 'RECORDER') {
                ctx.beginPath();
                ctx.arc(0, 0, 10 * p.scale, 0, Math.PI*2);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (p.type === 'CURRY' || p.subType === 'CURRY') {
                ctx.fillStyle = p.type === 'EVOLVED' ? 'rgba(255,50,0,0.6)' : 'rgba(200,100,0,0.5)';
                ctx.beginPath(); ctx.arc(0,0, 20*p.scale, 0, Math.PI*2); ctx.fill();
            } else if (sprite) {
                const size = 16 * p.scale;
                ctx.drawImage(sprite, -size/2, -size/2, size, size);
            }
            
            ctx.restore();
        });

        // Enemies
        enemies.current.forEach(e => {
            // Cull
            if (Math.abs(e.x - camera.current.x) > (viewW/ZOOM_SCALE + 50) || Math.abs(e.y - camera.current.y) > (viewH/ZOOM_SCALE + 50)) return;
            const baseKey = e.type; // ENEMY_1, ENEMY_2 etc.
            const spriteKey = e.flashTime > 0 ? `${baseKey}_FLASH` : baseKey;
            const sprite = spriteCache.current[spriteKey] || spriteCache.current['ENEMY_1'];
            
            if (sprite) {
                const size = Math.max(e.width, e.height);
                ctx.drawImage(sprite, e.x - size/2, e.y - size/2, size * 1.3, size * 1.3);
            }
        });

        // Player
        const pKey = player.current.flashTime > 0 ? 'PLAYER_FLASH' : 'PLAYER';
        const pSprite = spriteCache.current[pKey];
        if (pSprite) {
            ctx.save();
            ctx.translate(player.current.x, player.current.y);
            if (lastDir.current.x < 0) ctx.scale(-1, 1); // Flip
            ctx.drawImage(pSprite, -16, -16, 32, 32);
            ctx.restore();
        }

        // Damage Text
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        damageTexts.current.forEach(d => {
            ctx.fillStyle = d.color;
            ctx.fillText(d.value.toString(), d.x, d.y);
        });

        ctx.restore();
    };

    // --- LEVEL UP ---
    const generateUpgrades = () => {
        const candidates: any[] = [];
        const wKeys = Object.keys(WEAPONS) as WeaponType[];
        const pKeys = Object.keys(PASSIVES) as PassiveType[];

        // Evolution Check
        wKeys.forEach(key => {
            const wData = weaponsRef.current[key];
            if (wData && wData.level >= 8) {
                const synergy = WEAPONS[key].synergy;
                if (passivesRef.current[synergy] > 0) {
                    if (wData.level === 8) {
                        candidates.push({ type: 'WEAPON', id: key, isEvo: true });
                    }
                }
            }
        });

        // Weapons
        wKeys.forEach(key => {
            const wData = weaponsRef.current[key];
            if (!wData) {
                // New Weapon
                if (Object.values(weaponsRef.current).filter(v => v !== undefined).length < 6) {
                    candidates.push({ type: 'WEAPON', id: key, isNew: true });
                }
            } else if (wData.level < 8) {
                candidates.push({ type: 'WEAPON', id: key, level: wData.level + 1 });
            }
        });

        // Passives
        pKeys.forEach(key => {
            const level = passivesRef.current[key];
            if (level === 0) {
                if (Object.values(passivesRef.current).filter((v: number) => v > 0).length < 6) {
                    candidates.push({ type: 'PASSIVE', id: key, isNew: true });
                }
            } else if (level < 5) {
                candidates.push({ type: 'PASSIVE', id: key, level: level + 1 });
            }
        });

        // Pick 3 or 4
        const picks = [];
        const count = Math.min(3, candidates.length);
        for(let i=0; i<count; i++) {
            const idx = Math.floor(Math.random() * candidates.length);
            picks.push(candidates[idx]);
            candidates.splice(idx, 1);
        }
        
        if (picks.length < 3) {
            picks.push({ type: 'HEAL', id: 'HEAL' });
        }

        setUpgradeOptions(picks);
    };

    const selectUpgrade = (opt: any) => {
        if (opt.type === 'WEAPON') {
            const key = opt.id as WeaponType;
            const current = weapons[key];
            setWeapons(prev => ({
                ...prev,
                [key]: current ? { ...current, level: current.level + 1 } : { level: 1, cooldownTimer: 0 }
            }));
        } else if (opt.type === 'PASSIVE') {
            const key = opt.id as PassiveType;
            setPassives(prev => ({ ...prev, [key]: prev[key] + 1 }));
        } else if (opt.type === 'HEAL') {
            player.current.hp = Math.min(player.current.maxHp, player.current.hp + 30);
        }
        audioService.playSound('buff');
        gameState.current = 'PLAYING';
    };

    const handleRestart = () => {
        player.current = { ...player.current, x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, hp: 100, dead: false };
        camera.current = { x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2 };
        enemies.current = []; projectiles.current = []; gems.current = []; damageTexts.current = [];
        score.current = 0; time.current = 0; frameCount.current = 0; level.current = 1; xp.current = 0; nextLevelXp.current = BASE_XP_REQUIREMENT;
        setWeapons({ PENCIL: { level: 1, cooldownTimer: 0 }, ERASER: undefined, RULER: undefined, HIGHLIGHTER: undefined, FLASK: undefined, RECORDER: undefined, SOCCER: undefined, UWABAKI: undefined, CURRY: undefined, COMPASS: undefined, MOP: undefined, MAGNIFIER: undefined });
        setPassives({ PROTEIN: 0, DRILL: 0, PROTRACTOR: 0, SHOES: 0, PAD: 0, LUNCHBOX: 0, MAGNET: 0, TEXTBOOK: 0, ABACUS: 0, CONSOLE: 0, MILK: 0, ORIGAMI: 0 });
        setUiState({ hp: 100, maxHp: 100, level: 1, time: 0, score: 0, xpPercent: 0, gameOver: false });
        gameState.current = 'PLAYING';
        audioService.playBGM('survivor_metal');
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col h-full w-full bg-black text-white relative items-center justify-center font-mono overflow-hidden touch-none" ref={containerRef}
            onTouchStart={(e) => {
                if (gameState.current !== 'PLAYING') return;
                const t = e.touches[0];
                setJoystickUI({ active: true, startX: t.clientX, startY: t.clientY, curX: t.clientX, curY: t.clientY });
                joystickRef.current = { x: 0, y: 0 };
            }}
            onTouchMove={(e) => {
                if (!joystickUI?.active) return;
                const t = e.touches[0];
                const dx = t.clientX - joystickUI.startX;
                const dy = t.clientY - joystickUI.startY;
                const dist = Math.hypot(dx, dy);
                const max = 50;
                setJoystickUI(prev => prev ? ({ ...prev, curX: prev.startX + (dist>max ? dx/dist*max : dx), curY: prev.startY + (dist>max ? dy/dist*max : dy) }) : null);
                joystickRef.current = { x: dx/max, y: dy/max };
            }}
            onTouchEnd={() => { setJoystickUI(null); joystickRef.current = { x: 0, y: 0 }; }}
        >
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start pointer-events-none z-10 text-shadow-md">
                <div className="flex flex-col gap-1 w-1/3">
                    <div className="bg-black/60 p-1.5 rounded border border-gray-600 backdrop-blur-sm">
                        <div className="text-xl font-bold text-yellow-400 leading-none">LV {uiState.level}</div>
                        <div className="w-full h-2 bg-gray-700 rounded-full mt-1 overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-200" style={{width: `${uiState.xpPercent}%`}}></div></div>
                    </div>
                    <div className="bg-black/60 p-1.5 rounded border border-gray-600 text-red-400 font-bold flex items-center backdrop-blur-sm">
                        <Heart size={16} className="mr-1 fill-current"/> {Math.ceil(uiState.hp)}
                    </div>
                </div>
                
                <div className="bg-black/60 p-1.5 rounded border border-gray-600 text-center backdrop-blur-sm">
                    <div className="text-2xl font-black text-white tracking-widest">{Math.floor(uiState.time/60).toString().padStart(2,'0')}:{(uiState.time%60).toString().padStart(2,'0')}</div>
                    <div className="text-[10px] text-gray-300">SCORE: {score.current}</div>
                </div>

                <div className="w-1/3 flex flex-col items-end gap-1 opacity-90 pt-12">
                    <div className="flex flex-wrap justify-end gap-0.5 max-w-[140px]">
                        {(Object.keys(weapons) as WeaponType[]).map((k) => {
                            const v = weapons[k];
                            return v && (
                            <div key={k} className={`w-7 h-7 bg-slate-800 border ${v.level>=8?'border-yellow-400':'border-gray-500'} flex items-center justify-center relative p-0.5`}>
                                <PixelSprite 
                                    seed={k} 
                                    name={`${WEAPONS[k].sprite.template}|${WEAPONS[k].sprite.color}`} 
                                    className="w-full h-full"
                                />
                                <div className="absolute -bottom-1 -right-1 text-[6px] bg-black px-0.5 rounded leading-none text-white border border-gray-700">{v.level}</div>
                            </div>
                        )})}
                    </div>
                    <div className="flex flex-wrap justify-end gap-0.5 max-w-[140px]">
                        {(Object.keys(passives) as PassiveType[]).map((k) => {
                            const v = passives[k];
                            return v > 0 && (
                            <div key={k} className="w-6 h-6 bg-slate-900 border border-gray-600 flex items-center justify-center relative p-0.5">
                                <PixelSprite 
                                    seed={k} 
                                    name={`${PASSIVES[k].sprite.template}|${PASSIVES[k].sprite.color}`} 
                                    className="w-full h-full"
                                />
                                <div className="absolute -bottom-1 -right-1 text-[6px] bg-black px-0.5 rounded leading-none text-white border border-gray-700">{v}</div>
                            </div>
                        )})}
                    </div>
                </div>
            </div>

            <canvas ref={canvasRef} width={viewSize.width} height={viewSize.height} className="block w-full h-full bg-[#111827]" style={{ imageRendering: 'pixelated' }} />

            {/* Level Up Overlay */}
            {gameState.current === 'LEVEL_UP' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 animate-in zoom-in duration-200 pointer-events-auto p-4">
                    <h2 className="text-4xl font-bold text-yellow-400 mb-6 animate-pulse text-shadow-lg">LEVEL UP!</h2>
                    <div className="grid grid-cols-1 gap-4 w-full max-w-sm max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {upgradeOptions.map((opt, idx) => {
                            let itemDef: any = opt.type === 'WEAPON' ? WEAPONS[opt.id as WeaponType] : (opt.type === 'PASSIVE' ? PASSIVES[opt.id as PassiveType] : { name: '給食', desc: 'HP 30回復', sprite: { template: 'POTION', color: '#f472b6' } });
                            let isEvo = opt.isEvo;
                            return (
                                <button key={idx} onClick={() => selectUpgrade(opt)} className={`bg-slate-800 border-2 ${isEvo ? 'border-yellow-400 bg-yellow-900/30' : 'border-slate-600'} hover:bg-slate-700 p-3 rounded-xl flex items-center text-left transition-all group relative overflow-hidden shadow-lg`}>
                                    <div className={`w-12 h-12 bg-black/40 mr-4 ${isEvo ? 'animate-bounce' : ''} shrink-0 p-1 border border-slate-600 rounded`}>
                                        <PixelSprite 
                                            seed={opt.id} 
                                            name={`${itemDef.sprite.template}|${itemDef.sprite.color}`} 
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className={`text-lg font-bold leading-tight ${isEvo ? 'text-yellow-300' : 'text-white'}`}>{isEvo ? itemDef.evolvedName : itemDef.name}</div>
                                            <div className="text-xs text-blue-300 font-bold bg-blue-900/50 px-2 py-0.5 rounded">{opt.isNew ? 'New!' : (opt.type === 'HEAL' ? '' : `Lv ${opt.level || 'Max'}`)}</div>
                                        </div>
                                        <div className="text-xs text-gray-400 leading-tight">{isEvo ? itemDef.evolvedDesc : itemDef.desc}</div>
                                        {opt.type === 'WEAPON' && !isEvo && <div className="text-[10px] text-gray-500 mt-1">Syn: {PASSIVES[itemDef.synergy as PassiveType].name}</div>}
                                    </div>
                                    {isEvo && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5">EVOLUTION</div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Joystick UI */}
            {joystickUI && joystickUI.active && <div className="absolute z-30 pointer-events-none" style={{ left: joystickUI.startX, top: joystickUI.startY, transform: 'translate(-50%, -50%)' }}><div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/10"></div><div className="absolute w-12 h-12 rounded-full bg-white/50 shadow-lg" style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${joystickUI.curX - joystickUI.startX}px), calc(-50% + ${joystickUI.curY - joystickUI.startY}px))` }}></div></div>}

            {uiState.gameOver && (
                <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center z-20 pointer-events-auto">
                    <h2 className="text-6xl font-bold text-white mb-4">GAME OVER</h2>
                    <div className="text-2xl text-yellow-300 mb-8 font-mono">Time: {Math.floor(uiState.time/60)}:{(uiState.time%60).toString().padStart(2,'0')}</div>
                    <div className="flex flex-col gap-4 w-64">
                        <button onClick={handleRestart} className="bg-white text-black px-8 py-4 rounded font-bold text-xl hover:bg-gray-200 flex items-center justify-center shadow-xl"><RotateCcw className="mr-2"/> Retry</button>
                        <button onClick={onBack} className="bg-black text-white px-8 py-4 rounded font-bold text-xl border-2 border-white hover:bg-gray-800 flex items-center justify-center shadow-xl"><ArrowLeft className="mr-2"/> Exit</button>
                    </div>
                </div>
            )}
            
            {/* Pause/Back Button - Moved to prevent overlap, but still accessible */}
            {gameState.current === 'PLAYING' && (
                <button 
                    onClick={onBack} 
                    className="absolute top-2 right-2 bg-gray-800/80 hover:bg-gray-700 text-white p-2 rounded-full border border-gray-500 z-50 pointer-events-auto shadow-lg backdrop-blur-md"
                >
                    <Pause size={20} />
                </button>
            )}
        </div>
    );
};

export default SchoolyardSurvivorScreen;
