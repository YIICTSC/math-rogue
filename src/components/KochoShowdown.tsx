
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, X, RotateCcw, Swords, Shield, RefreshCw, Zap, Trophy, Skull, ChevronsRight, ChevronLeft, ChevronRight, Clock, Ghost, ShoppingBag, Plus, ArrowUpCircle, Heart, Coins, Forward, ArrowLeftRight } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

// --- TYPES ---
type Facing = 1 | -1; // 1: Right, -1: Left

interface KCard {
    id: string;
    name: string;
    type: 'ATTACK' | 'MOVE' | 'UTILITY';
    range: number[]; // Relative range
    damage: number;
    cooldown: number; 
    currentCooldown: number;
    color: string;
    icon: React.ReactNode;
    description: string;
    level: number; // For upgrades
}

interface KEntity {
    id: string;
    type: 'PLAYER' | 'ENEMY';
    name: string;
    pos: number; // 0-6
    facing: Facing;
    maxHp: number;
    hp: number;
    spriteName: string;
    
    // Enemy AI
    intent?: {
        type: 'ATTACK' | 'MOVE' | 'WAIT' | 'SUMMON' | 'HEAL';
        damage?: number;
        range?: number[];
        targetPos?: number;
        timer: number;
    };
    
    // Status
    shield: number;
    goldDrop: number;
    isBoss?: boolean;
    bossPhase?: number; // 1, 2, 3
}

type GamePhase = 'STORY' | 'BATTLE' | 'REWARD' | 'SHOP' | 'GAME_OVER' | 'VICTORY';

interface KochoGameState {
    stage: number; // 1-5
    wave: number; // 1-3 (3 is Boss usually)
    turn: number;
    gridSize: number;
    
    player: KEntity;
    enemies: KEntity[];
    
    hand: KCard[]; // Active skills
    queue: KCard[]; // Action queue
    
    gold: number;
    
    phase: GamePhase;
    logs: string[];
    specialActionCooldown: number;
}

// --- DATA ---
const CARD_DB: Omit<KCard, 'id' | 'currentCooldown' | 'level'>[] = [
    { name: '定規スラッシュ', type: 'ATTACK', range: [1], damage: 4, cooldown: 2, color: 'bg-red-600', icon: <Swords size={16}/>, description: '目の前の敵を斬る' },
    { name: 'コンパス突き', type: 'ATTACK', range: [2], damage: 3, cooldown: 2, color: 'bg-orange-600', icon: <Zap size={16}/>, description: '2マス先を攻撃' },
    { name: 'ダッシュ', type: 'MOVE', range: [2], damage: 0, cooldown: 3, color: 'bg-blue-600', icon: <ChevronsRight size={16}/>, description: '前方に2マス移動' },
    { name: 'バックステップ', type: 'UTILITY', range: [-1], damage: 0, cooldown: 2, color: 'bg-gray-600', icon: <RotateCcw size={16}/>, description: '1マス下がる' },
    { name: '大声', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 4, color: 'bg-yellow-600', icon: <Zap size={16}/>, description: '前方3マスに音波攻撃' },
    { name: 'お辞儀', type: 'UTILITY', range: [0], damage: 0, cooldown: 3, color: 'bg-green-600', icon: <Shield size={16}/>, description: '待機してシールド+3' },
    { name: '回し蹴り', type: 'ATTACK', range: [-1, 1], damage: 4, cooldown: 2, color: 'bg-purple-600', icon: <RefreshCw size={16}/>, description: '前後1マスを攻撃' },
    { name: 'チョーク投げ', type: 'ATTACK', range: [1, 2, 3, 4], damage: 3, cooldown: 3, color: 'bg-cyan-600', icon: <Zap size={16}/>, description: '遠距離攻撃' },
    { name: '給食当番', type: 'ATTACK', range: [1], damage: 2, cooldown: 4, color: 'bg-pink-600', icon: <Heart size={16}/>, description: '攻撃してHP1回復' },
    { name: '居残り', type: 'UTILITY', range: [0], damage: 0, cooldown: 5, color: 'bg-indigo-600', icon: <Clock size={16}/>, description: '全CDを1短縮' },
];

const STAGE_CONFIG = [
    { id: 1, name: "校門 (The Gate)", bg: "bg-slate-900", enemies: ['SLIME', 'BAT'], boss: 'SENIOR', waves: 3 },
    { id: 2, name: "廊下 (Hallway)", bg: "bg-stone-900", enemies: ['BAT', 'SKELETON'], boss: 'TEACHER', waves: 3 },
    { id: 3, name: "理科室 (Science Room)", bg: "bg-teal-950", enemies: ['SLIME', 'GHOST'], boss: 'MAGE', waves: 4 },
    { id: 4, name: "職員室 (Staff Room)", bg: "bg-blue-950", enemies: ['TEACHER', 'MUSCLE'], boss: 'VICE_PRINCIPAL', waves: 4 },
    { id: 5, name: "校長室 (Final Showdown)", bg: "bg-red-950", enemies: ['GHOST', 'ROBOT'], boss: 'PRINCIPAL', waves: 3 },
];

const ENEMY_TEMPLATES: Record<string, any> = {
    'SLIME': { name: 'スライム', maxHp: 6, sprite: 'SLIME|#3b82f6', dmg: 2, range: [1], speed: 3, gold: 2 },
    'BAT': { name: 'コウモリ', maxHp: 4, sprite: 'BAT|#a855f7', dmg: 2, range: [1, 2], speed: 5, gold: 3 },
    'SENIOR': { name: '不良生徒', maxHp: 15, sprite: 'SENIOR|#5d4037', dmg: 3, range: [1], speed: 3, gold: 10 },
    'SKELETON': { name: '理科室の骨', maxHp: 10, sprite: 'SKELETON|#e5e7eb', dmg: 4, range: [1], speed: 3, gold: 5 },
    'TEACHER': { name: '熱血教師', maxHp: 20, sprite: 'TEACHER|#ef4444', dmg: 5, range: [1], speed: 4, gold: 8 },
    'GHOST': { name: '浮遊霊', maxHp: 8, sprite: 'GHOST|#a5f3fc', dmg: 3, range: [1, 2, 3], speed: 4, gold: 6 },
    'MUSCLE': { name: '体育教師', maxHp: 30, sprite: 'MUSCLE|#f97316', dmg: 6, range: [1], speed: 3, gold: 12 },
    'ROBOT': { name: '警備ロボ', maxHp: 25, sprite: 'ROBOT|#64748b', dmg: 4, range: [1, 2], speed: 2, gold: 15 },
    'MAGE': { name: '実験狂', maxHp: 40, sprite: 'WIZARD|#a21caf', dmg: 5, range: [2, 3], speed: 2, gold: 20 },
    'VICE_PRINCIPAL': { name: '教頭先生', maxHp: 60, sprite: 'BOSS|#1e40af', dmg: 7, range: [1, 2], speed: 4, gold: 50 },
    'PRINCIPAL': { name: '校長先生', maxHp: 100, sprite: 'BOSS|#FFD700', dmg: 8, range: [1, 2, 3], speed: 3, gold: 100 },
};

const GRID_SIZE = 7;

// --- COMPONENT ---
const KochoShowdown: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    
    // --- STATE ---
    const [gameState, setGameState] = useState<KochoGameState>({
        stage: 1,
        wave: 0,
        turn: 1,
        gridSize: GRID_SIZE,
        player: { id: 'p1', type: 'PLAYER', name: '勇者', pos: 3, facing: 1, maxHp: 30, hp: 30, spriteName: 'HERO_SIDE|赤', shield: 0, goldDrop: 0 },
        enemies: [],
        hand: [],
        queue: [],
        gold: 0,
        phase: 'STORY',
        logs: [],
        specialActionCooldown: 0
    });

    const stateRef = useRef(gameState);
    useEffect(() => { stateRef.current = gameState; }, [gameState]);

    const [animating, setAnimating] = useState(false);
    const [rewardOptions, setRewardOptions] = useState<KCard[]>([]);
    
    // BGM Control
    useEffect(() => {
        if (gameState.phase === 'BATTLE') {
            const bgm = gameState.stage === 5 ? 'dungeon_boss' : 
                        gameState.stage === 4 ? 'dungeon_music' :
                        gameState.stage === 3 ? 'dungeon_science' : 
                        'dungeon_gym';
            audioService.playBGM(bgm);
        } else if (gameState.phase === 'SHOP' || gameState.phase === 'REWARD') {
            audioService.playBGM('poker_shop');
        } else if (gameState.phase === 'VICTORY') {
            audioService.playBGM('menu');
        }
    }, [gameState.phase, gameState.stage]);

    // Initial Setup
    useEffect(() => {
        // Initial Deck
        const initialCards = [
            CARD_DB.find(c => c.name === '定規スラッシュ')!,
            CARD_DB.find(c => c.name === 'バックステップ')!,
            CARD_DB.find(c => c.name === 'チョーク投げ')!,
        ].map((c, i) => ({ ...c, id: `init_${i}`, currentCooldown: 0, level: 1 }));

        setGameState(prev => ({
            ...prev,
            hand: initialCards,
            logs: ["校長先生の野望を阻止せよ！", "学校の平和を取り戻す戦いが始まる..."]
        }));
    }, []);

    const addLog = (msg: string) => {
        setGameState(prev => ({ ...prev, logs: [msg, ...prev.logs.slice(0, 4)] }));
    };

    // --- GAME LOOP FUNCTIONS ---

    const startStage = (stageNum: number) => {
        setGameState(prev => ({
            ...prev,
            stage: stageNum,
            wave: 0,
            phase: 'STORY',
            logs: [`ステージ ${stageNum}: ${STAGE_CONFIG[stageNum-1].name} に到達！`]
        }));
    };

    const nextWave = () => {
        const currentConfig = STAGE_CONFIG[gameState.stage - 1];
        const nextWaveNum = gameState.wave + 1;

        // Reset Player Position
        const p = { ...gameState.player, pos: 2, facing: 1 as Facing, shield: 0 };

        // Generate Enemies
        const newEnemies: KEntity[] = [];
        
        if (nextWaveNum > currentConfig.waves) {
            // Should not happen if logic is correct, but safety net
            handleStageClear();
            return;
        }

        const isBossWave = nextWaveNum === currentConfig.waves;
        
        if (isBossWave) {
            // Boss Spawn
            const bossKey = currentConfig.boss;
            const t = ENEMY_TEMPLATES[bossKey];
            newEnemies.push({
                id: `boss_${gameState.stage}`,
                type: 'ENEMY',
                name: t.name,
                pos: 6,
                facing: -1,
                maxHp: t.maxHp,
                hp: t.maxHp,
                spriteName: t.sprite,
                shield: 0,
                goldDrop: t.gold,
                isBoss: true,
                bossPhase: 1,
                intent: { type: 'WAIT', timer: 2 }
            });
        } else {
            // Minion Spawn
            const count = 1 + Math.floor(Math.random() * 2); // 1 or 2 enemies
            for(let i=0; i<count; i++) {
                const key = currentConfig.enemies[Math.floor(Math.random() * currentConfig.enemies.length)];
                const t = ENEMY_TEMPLATES[key];
                let pos = 4 + i * 2;
                if (pos >= GRID_SIZE) pos = 5;
                
                newEnemies.push({
                    id: `e_${gameState.stage}_${gameState.wave}_${i}`,
                    type: 'ENEMY',
                    name: t.name,
                    pos: pos,
                    facing: -1,
                    maxHp: t.maxHp,
                    hp: t.maxHp,
                    spriteName: t.sprite,
                    shield: 0,
                    goldDrop: t.gold,
                    intent: { type: 'WAIT', timer: 1 + i }
                });
            }
        }

        setGameState(prev => ({
            ...prev,
            wave: nextWaveNum,
            turn: 1,
            player: p,
            enemies: newEnemies,
            phase: 'BATTLE',
            queue: [],
            hand: prev.hand.map(c => ({ ...c, currentCooldown: 0 })), // Reset cooldowns on new wave
            specialActionCooldown: 0,
            logs: isBossWave ? ["BOSS BATTLE!", `${newEnemies[0].name}が現れた！`] : [`Wave ${nextWaveNum}/${currentConfig.waves} 開始！`]
        }));
    };

    const handleBattleEnd = () => {
        const currentConfig = STAGE_CONFIG[gameState.stage - 1];
        
        if (gameState.wave === currentConfig.waves) {
            // Boss Defeated -> Stage Clear
            handleStageClear();
        } else {
            // Wave Clear
            // Check if mid-stage reward (e.g. after wave 1 or 2)
            if (gameState.wave === 1 || (currentConfig.waves > 3 && gameState.wave === 2)) {
                generateCardRewards();
            } else if (gameState.wave === currentConfig.waves - 1) {
                // Before Boss -> Shop/Rest
                setGameState(prev => ({ ...prev, phase: 'SHOP', logs: ["休憩ポイントに到達した。", "装備を整えよう。"] }));
            } else {
                // Direct to next wave
                nextWave();
            }
        }
    };

    const handleStageClear = () => {
        if (gameState.stage === 5) {
            setGameState(prev => ({ ...prev, phase: 'VICTORY' }));
        } else {
            startStage(gameState.stage + 1);
        }
    };

    // --- REWARD & SHOP ---

    const generateCardRewards = () => {
        const options: KCard[] = [];
        for(let i=0; i<2; i++) {
            const template = CARD_DB[Math.floor(Math.random() * CARD_DB.length)];
            options.push({
                ...template,
                id: `reward_${Date.now()}_${i}`,
                currentCooldown: 0,
                level: 1
            });
        }
        setRewardOptions(options);
        setGameState(prev => ({ ...prev, phase: 'REWARD', logs: ["新たな技を閃いた！"] }));
    };

    const selectReward = (card: KCard) => {
        setGameState(prev => ({
            ...prev,
            hand: [...prev.hand, card],
            phase: 'BATTLE' // Transient state, will trigger nextWave in effect or manually
        }));
        nextWave();
    };

    const upgradeCard = (cardId: string, cost: number) => {
        if (gameState.gold < cost) {
            audioService.playSound('wrong');
            return;
        }
        audioService.playSound('buff');
        setGameState(prev => ({
            ...prev,
            gold: prev.gold - cost,
            hand: prev.hand.map(c => c.id === cardId ? {
                ...c,
                level: c.level + 1,
                damage: c.damage + 1,
                // cooldown: Math.max(1, c.cooldown - (c.level % 2 === 0 ? 1 : 0)) // Every 2 levels reduce CD? Maybe too strong. Just dmg for now.
            } : c)
        }));
    };

    const buyItem = (type: 'HEAL' | 'MAXHP' | 'SHIELD', cost: number) => {
        if (gameState.gold < cost) {
            audioService.playSound('wrong');
            return;
        }
        audioService.playSound('buff');
        setGameState(prev => {
            const p = { ...prev.player };
            if (type === 'HEAL') p.hp = Math.min(p.maxHp, p.hp + 10);
            if (type === 'MAXHP') { p.maxHp += 5; p.hp += 5; }
            if (type === 'SHIELD') { /* Logic handled in battle usually, maybe passive? Skip for now or make it start shield */ }
            return { ...prev, gold: prev.gold - cost, player: p };
        });
    };

    // --- BATTLE LOGIC ---

    const tickCooldowns = (state: KochoGameState): KochoGameState => ({
        ...state,
        hand: state.hand.map(c => ({ ...c, currentCooldown: Math.max(0, c.currentCooldown - 1) })),
        specialActionCooldown: Math.max(0, state.specialActionCooldown - 1)
    });

    const resolveEnemyTurn = (current: KochoGameState): KochoGameState => {
        let nextState = { ...current };
        let enemies = [...nextState.enemies];
        let player = { ...nextState.player };
        let logs = [...nextState.logs];
        let status = nextState.phase;

        // Decrement Enemy Timers
        enemies = enemies.map(e => e.intent ? { ...e, intent: { ...e.intent, timer: Math.max(0, e.intent.timer - 1) } } : e);

        // Resolve Actions
        for (let i = 0; i < enemies.length; i++) {
            let e = { ...enemies[i] };
            if (e.hp <= 0) continue;

            if (e.intent && e.intent.timer === 0) {
                // ACTION EXECUTION
                if (e.intent.type === 'ATTACK') {
                    const range = e.intent.range || [];
                    const attackTiles = range.map(r => e.pos + (r * e.facing));
                    
                    if (attackTiles.includes(player.pos)) {
                        const dmg = e.intent.damage || 0;
                        const blocked = Math.min(dmg, player.shield);
                        const finalDmg = dmg - blocked;
                        player.hp = Math.max(0, player.hp - finalDmg);
                        player.shield -= blocked;
                        logs = [`${e.name}の攻撃！ ${finalDmg}ダメージ！`, ...logs];
                        audioService.playSound('lose');
                        if (player.hp <= 0) status = 'GAME_OVER';
                    } else {
                        logs = [`${e.name}の攻撃は空を切った。`, ...logs];
                    }
                    e.intent = { type: 'WAIT', timer: 1 };
                } else if (e.intent.type === 'HEAL') {
                    e.hp = Math.min(e.maxHp, e.hp + 10);
                    logs = [`${e.name}は回復した！`, ...logs];
                    e.intent = { type: 'WAIT', timer: 2 };
                } else if (e.intent.type === 'SUMMON') {
                    // Only for boss logic usually
                    logs = [`${e.name}は部下を呼んだ！`, ...logs];
                    e.intent = { type: 'WAIT', timer: 2 };
                } 
                // AI DECISION (After Move/Wait)
                else {
                    const template = e.isBoss ? ENEMY_TEMPLATES[e.name === '校長先生' ? 'PRINCIPAL' : 'VICE_PRINCIPAL'] : ENEMY_TEMPLATES[Object.keys(ENEMY_TEMPLATES).find(k => ENEMY_TEMPLATES[k].name === e.name) || 'SLIME'];
                    
                    // Boss Phase Logic
                    if (e.isBoss && e.name === '校長先生') {
                        if (e.bossPhase === 2) template.dmg = 12; // Phase 2 boost
                        if (e.bossPhase === 3) { template.dmg = 15; template.speed = 2; } // Phase 3 boost
                    }

                    const dist = e.pos - player.pos;
                    const absDist = Math.abs(dist);
                    const validRanges = template.range || [1];
                    const inRange = validRanges.includes(absDist);
                    const correctFacing = (dist < 0 && e.facing === 1) || (dist > 0 && e.facing === -1);

                    if (inRange && correctFacing) {
                        e.intent = { type: 'ATTACK', damage: template.dmg, range: template.range, timer: Math.max(1, template.speed - 1) };
                    } else {
                        // Move
                        const dir = dist < 0 ? 1 : -1;
                        if (!enemies.some(other => other.pos === e.pos + dir) && player.pos !== e.pos + dir) {
                            e.pos += dir;
                        }
                        e.facing = dir as Facing;
                        e.intent = { type: 'MOVE', timer: 1 };
                    }
                }
            }
            enemies[i] = e;
            if (status === 'GAME_OVER') break;
        }

        // Clean dead enemies & drop gold
        const livingEnemies = [];
        for (const e of enemies) {
            if (e.hp > 0) {
                livingEnemies.push(e);
            } else {
                // Enemy Died
                // Special: Final Boss Phases
                if (e.isBoss && e.name === '校長先生' && e.bossPhase && e.bossPhase < 3) {
                    e.bossPhase++;
                    e.hp = e.maxHp; // Full Heal
                    e.spriteName = e.bossPhase === 2 ? 'ROBOT|#555' : 'BOSS|#000'; // Change Sprite
                    e.name = e.bossPhase === 2 ? 'メカ校長' : '真・魔王校長';
                    logs = [`${e.name}に変身した！`, ...logs];
                    audioService.playSound('buff');
                    livingEnemies.push(e);
                } else {
                    nextState.gold += e.goldDrop;
                    logs = [`${e.name}を倒した！ ${e.goldDrop}G獲得。`, ...logs];
                    audioService.playSound('win');
                }
            }
        }

        return { ...nextState, enemies: livingEnemies, player, logs: logs.slice(0, 4), phase: status };
    };

    // --- PLAYER ACTION HANDLERS ---

    const handleQueueCard = async (card: KCard, idx: number) => {
        if (stateRef.current.phase !== 'BATTLE' || animating) return;
        if (card.currentCooldown > 0) { audioService.playSound('wrong'); return; }
        if (stateRef.current.queue.length >= 3) return;

        setAnimating(true);
        let current = { ...stateRef.current };
        
        // Move to Queue
        const newHand = [...current.hand];
        newHand.splice(idx, 1);
        current.hand = newHand;
        current.queue = [...current.queue, card];
        audioService.playSound('select');

        // Enemy Reaction
        await new Promise(r => setTimeout(r, 150));
        current = resolveEnemyTurn(current);
        current = tickCooldowns(current);
        
        setGameState(current);
        setAnimating(false);
    };

    const handleMove = async (dir: -1 | 1) => {
        if (stateRef.current.phase !== 'BATTLE' || animating) return;
        setAnimating(true);
        let current = stateRef.current;
        const newPos = current.player.pos + dir;

        if (newPos >= 0 && newPos < GRID_SIZE && !current.enemies.some(e => e.pos === newPos)) {
            current.player.pos = newPos;
            audioService.playSound('select');
            await new Promise(r => setTimeout(r, 200));
            current = resolveEnemyTurn(current);
            current = tickCooldowns(current);
            setGameState(current);
        } else {
            audioService.playSound('wrong');
        }
        setAnimating(false);
    };

    const handleWait = async () => {
        if (stateRef.current.phase !== 'BATTLE' || animating) return;
        setAnimating(true);
        addLog("待機した。");
        audioService.playSound('select');
        let current = resolveEnemyTurn(stateRef.current);
        current = tickCooldowns(current);
        setGameState(current);
        setAnimating(false);
    };

    const handleTurn = async () => {
        if (stateRef.current.phase !== 'BATTLE' || animating) return;
        setGameState(prev => ({ ...prev, player: { ...prev.player, facing: (prev.player.facing * -1) as Facing } }));
    };

    const handleSwapPosition = async () => {
        if (stateRef.current.phase !== 'BATTLE' || animating) return;
        const current = stateRef.current;
        if (current.specialActionCooldown > 0) { audioService.playSound('wrong'); return; }

        const targetPos = current.player.pos + current.player.facing;
        const enemy = current.enemies.find(e => e.pos === targetPos);
        if (!enemy) { audioService.playSound('wrong'); return; }

        setAnimating(true);
        addLog("位置交換！");
        audioService.playSound('select');

        const newEnemies = current.enemies.map(e => e.id === enemy.id ? { ...e, pos: current.player.pos } : e);
        let newState = { ...current, player: { ...current.player, pos: targetPos }, enemies: newEnemies, specialActionCooldown: 4 }; // +1 for tick
        
        await new Promise(r => setTimeout(r, 200));
        newState = resolveEnemyTurn(newState);
        newState = tickCooldowns(newState);
        setGameState(newState);
        setAnimating(false);
    };

    const executeQueue = async () => {
        if (stateRef.current.phase !== 'BATTLE' || animating || stateRef.current.queue.length === 0) return;
        setAnimating(true);
        
        const queue = [...stateRef.current.queue];
        const returnCards: KCard[] = [];

        for (const card of queue) {
            let current = stateRef.current;
            if (current.phase === 'GAME_OVER') break;
            
            addLog(`${card.name}！`);
            
            // Execute Card
            const p = current.player;
            let hits = false;
            
            if (card.type === 'ATTACK') {
                const targets = card.range.map(r => p.pos + (r * p.facing));
                const victims = current.enemies.filter(e => targets.includes(e.pos));
                if (victims.length > 0) {
                    hits = true;
                    victims.forEach(v => {
                        v.hp -= card.damage; // Simple calculation for now
                        addLog(`${v.name}に${card.damage}ダメージ`);
                    });
                    audioService.playSound('attack');
                } else {
                    addLog("空振り...");
                    audioService.playSound('select');
                }
            } else if (card.type === 'MOVE') {
                const target = p.pos + (card.range[0] * p.facing);
                if (target >= 0 && target < GRID_SIZE && !current.enemies.some(e => e.pos === target)) {
                    current.player.pos = target;
                    audioService.playSound('select');
                } else addLog("移動できない");
            } else if (card.type === 'UTILITY') {
                if (card.name === 'バックステップ') {
                    const target = p.pos - p.facing;
                    if (target >= 0 && target < GRID_SIZE && !current.enemies.some(e => e.pos === target)) current.player.pos = target;
                } else if (card.name === 'お辞儀') {
                    current.player.shield += 3;
                    audioService.playSound('block');
                } else if (card.name === '居残り') {
                    returnCards.forEach(c => c.currentCooldown = Math.max(0, c.currentCooldown - 1));
                    current.hand.forEach(c => c.currentCooldown = Math.max(0, c.currentCooldown - 1));
                    audioService.playSound('buff');
                }
            }

            // Sync State
            current.enemies = current.enemies.filter(e => e.hp > 0);
            
            // Return card
            returnCards.push({ ...card, currentCooldown: card.cooldown });
            
            // Wait & Enemy Turn
            await new Promise(r => setTimeout(r, 400));
            current = resolveEnemyTurn(current);
            setGameState(current);
            await new Promise(r => setTimeout(r, 200));
        }

        // Cleanup
        setGameState(prev => {
            if (prev.phase === 'GAME_OVER') return prev;
            // Return cards to hand
            const newHand = [...prev.hand.map(c => ({...c, currentCooldown: Math.max(0, c.currentCooldown - 1)})), ...returnCards];
            
            // Check Win Condition
            if (prev.enemies.length === 0) {
                setTimeout(handleBattleEnd, 1000);
                return { ...prev, queue: [], hand: newHand };
            }
            return { ...prev, queue: [], hand: newHand };
        });
        setAnimating(false);
    };

    const handleUnqueueCard = (idx: number) => {
        if (stateRef.current.phase !== 'BATTLE' || animating) return;
        const card = stateRef.current.queue[idx];
        const newQueue = [...stateRef.current.queue];
        newQueue.splice(idx, 1);
        setGameState(prev => ({ ...prev, queue: newQueue, hand: [...prev.hand, card] }));
    };

    // --- RENDER ---
    const getGridContent = (idx: number) => {
        const p = gameState.player;
        const e = gameState.enemies.find(en => en.pos === idx);
        
        if (p.pos === idx) {
            return (
                <div className="relative w-full h-full flex items-end justify-center">
                    <div className={`transition-transform duration-200 ${p.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                        <PixelSprite seed="HERO" name={p.spriteName} className="w-16 h-16"/>
                    </div>
                    {p.shield > 0 && <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-1 rounded border border-white">{p.shield}</div>}
                    <div className="absolute -bottom-6 w-20 text-center bg-black/50 text-white text-xs rounded border border-green-500">HP {p.hp}/{p.maxHp}</div>
                </div>
            );
        }
        if (e) {
            const isAttacking = e.intent && e.intent.type === 'ATTACK' && e.intent.timer === 1;
            return (
                <div className="relative w-full h-full flex items-end justify-center">
                    <div className={`transition-transform duration-200 ${e.facing === -1 ? 'scale-x-[-1]' : ''} ${e.isBoss ? 'scale-125' : ''}`}>
                        <PixelSprite seed={e.id} name={e.spriteName} className="w-16 h-16"/>
                    </div>
                    {isAttacking && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                            <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center">
                                <Swords size={12} className="mr-1"/> !
                            </div>
                        </div>
                    )}
                    <div className="absolute -bottom-6 w-16 text-center bg-black/50 text-white text-xs rounded border border-red-500">{e.hp}/{e.maxHp}</div>
                </div>
            );
        }
        return null;
    };

    const isDangerZone = (idx: number) => {
        return gameState.enemies.some(e => {
            if (e.intent?.type === 'ATTACK' && e.intent.timer === 1) {
                const range = e.intent.range || [];
                const targets = range.map(r => e.pos + (r * e.facing));
                return targets.includes(idx);
            }
            return false;
        });
    };

    // --- SUB-SCREENS ---

    if (gameState.phase === 'STORY') {
        return (
            <div className="flex flex-col h-full w-full bg-black text-white items-center justify-center p-8 text-center animate-in fade-in">
                <div className="text-2xl font-bold mb-4 text-yellow-400">STAGE {gameState.stage}</div>
                <h1 className="text-4xl font-black mb-8">{STAGE_CONFIG[gameState.stage - 1].name}</h1>
                <p className="text-gray-400 mb-8 max-w-md">{gameState.logs[0]}</p>
                <button onClick={nextWave} className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 flex items-center">
                    <Forward className="mr-2"/> 進む
                </button>
            </div>
        );
    }

    if (gameState.phase === 'REWARD') {
        return (
            <div className="flex flex-col h-full w-full bg-indigo-950 text-white items-center justify-center p-4 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                <h2 className="text-3xl font-bold mb-8 text-yellow-300">スキル習得</h2>
                <div className="flex gap-4 mb-8">
                    {rewardOptions.map((card, i) => (
                        <div key={i} className="bg-slate-800 p-4 rounded-lg border-2 border-slate-600 w-40 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform hover:border-yellow-400" onClick={() => selectReward(card)}>
                            <div className="text-4xl mb-2">{card.icon}</div>
                            <div className="font-bold mb-2 text-center">{card.name}</div>
                            <div className="text-xs text-gray-400 text-center">{card.description}</div>
                            <div className="mt-4 text-xs font-mono bg-black px-2 py-1 rounded">CD: {card.cooldown}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (gameState.phase === 'SHOP') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-900 text-white items-center p-4 relative">
                <div className="w-full max-w-4xl h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <h2 className="text-3xl font-bold flex items-center"><ShoppingBag className="mr-3 text-yellow-500"/> 強化室</h2>
                        <div className="text-2xl font-bold text-yellow-400 flex items-center"><Coins className="mr-2"/> {gameState.gold} G</div>
                    </div>
                    
                    <div className="flex gap-8 h-full overflow-hidden">
                        {/* Upgrades */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <h3 className="font-bold text-gray-400 mb-2">スキル強化 (威力UP)</h3>
                            <div className="space-y-2">
                                {gameState.hand.map((card, i) => {
                                    const cost = 10 * (card.level || 1);
                                    const canAfford = gameState.gold >= cost;
                                    return (
                                        <div key={i} className="bg-slate-800 p-2 rounded flex justify-between items-center border border-slate-700">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-black p-1 rounded">{card.icon}</div>
                                                <div>
                                                    <div className="font-bold text-sm">{card.name} <span className="text-blue-400 text-xs">Lv{card.level}</span></div>
                                                    <div className="text-[10px] text-gray-400">威力: {card.damage}</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => upgradeCard(card.id, cost)} 
                                                disabled={!canAfford}
                                                className={`px-3 py-1 rounded text-xs font-bold ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 text-gray-500'}`}
                                            >
                                                強化 {cost}G
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Items */}
                        <div className="w-1/3 border-l border-gray-700 pl-4">
                            <h3 className="font-bold text-gray-400 mb-2">アイテム購入</h3>
                            <div className="space-y-4">
                                <div className="bg-slate-800 p-4 rounded border border-slate-600 text-center cursor-pointer hover:bg-slate-700" onClick={() => buyItem('HEAL', 15)}>
                                    <div className="font-bold text-green-400 mb-1">HP回復 (+10)</div>
                                    <div className="text-yellow-400 font-mono">15 G</div>
                                </div>
                                <div className="bg-slate-800 p-4 rounded border border-slate-600 text-center cursor-pointer hover:bg-slate-700" onClick={() => buyItem('MAXHP', 30)}>
                                    <div className="font-bold text-red-400 mb-1">最大HPアップ (+5)</div>
                                    <div className="text-yellow-400 font-mono">30 G</div>
                                </div>
                            </div>
                            <button onClick={nextWave} className="mt-8 w-full bg-blue-600 py-3 rounded font-bold hover:bg-blue-500 flex items-center justify-center">
                                <Swords className="mr-2"/> 次へ進む
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState.phase === 'VICTORY') {
        return (
            <div className="flex flex-col h-full w-full bg-black text-white items-center justify-center p-8 text-center animate-in zoom-in">
                <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
                <h1 className="text-5xl font-black text-white mb-4">完全制覇！</h1>
                <p className="text-xl text-gray-300 mb-12">校長先生を説得し、学園に平和が戻った。</p>
                <button onClick={onBack} className="bg-white text-black px-8 py-3 font-bold rounded hover:bg-gray-200">タイトルへ</button>
            </div>
        );
    }

    if (gameState.phase === 'GAME_OVER') {
        return (
            <div className="flex flex-col h-full w-full bg-black text-white items-center justify-center p-8 text-center animate-in zoom-in">
                <Skull size={80} className="text-red-500 mb-6" />
                <h1 className="text-5xl font-black text-red-500 mb-4">停学処分</h1>
                <p className="text-xl text-gray-300 mb-12">Stage {gameState.stage} で力尽きた...</p>
                <button onClick={onBack} className="bg-white text-black px-8 py-3 font-bold rounded hover:bg-gray-200">タイトルへ</button>
            </div>
        );
    }

    // MAIN BATTLE UI
    const currentTheme = STAGE_CONFIG[gameState.stage - 1];

    return (
        <div className={`flex flex-col h-full w-full ${currentTheme.bg} text-white font-mono relative overflow-hidden transition-colors duration-1000`}>
            {/* Header */}
            <div className="flex justify-between items-center p-2 bg-black/40 border-b border-white/10 shrink-0">
                <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white text-xs"><ArrowLeft size={14} className="mr-1"/> 戻る</button>
                <div className="text-sm font-bold tracking-widest">{currentTheme.name} <span className="text-xs text-gray-400">Wave {gameState.wave}/{currentTheme.waves}</span></div>
                <div className="flex items-center text-yellow-400 text-sm font-bold"><Coins size={14} className="mr-1"/> {gameState.gold}</div>
            </div>

            {/* Battle Field */}
            <div className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-y-auto custom-scrollbar">
                {/* Logs */}
                <div className="absolute top-2 w-full text-center pointer-events-none z-10 flex flex-col items-center">
                    {gameState.logs.map((log, i) => (
                        <div key={i} className={`text-xs md:text-sm ${i===0 ? 'text-white font-bold bg-black/50 px-2 rounded' : 'text-gray-400 opacity-70'} transition-all`}>{log}</div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 w-full max-w-4xl px-2 mb-4 shrink-0">
                    {[...Array(GRID_SIZE)].map((_, i) => (
                        <div key={i} className={`aspect-[3/4] md:aspect-square border-b-4 ${isDangerZone(i) ? 'border-red-500 bg-red-900/20' : 'border-slate-600 bg-black/20'} rounded-lg flex items-end justify-center relative`}>
                            {getGridContent(i)}
                            <div className="absolute bottom-0 right-1 text-[8px] text-gray-600">{i}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls Area */}
            <div className="bg-[#0f0f1b] border-t-4 border-slate-700 p-2 shrink-0 flex flex-col gap-2 shadow-up">
                {/* Queue */}
                <div className="flex items-center gap-2 bg-black/30 p-1 rounded border border-white/10 h-16">
                    <div className="text-[10px] text-gray-500 writing-mode-vertical hidden md:block">QUEUE</div>
                    <div className="flex gap-1 flex-grow">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex-1 bg-slate-800 rounded border border-slate-600 flex items-center justify-center relative cursor-pointer" onClick={() => handleUnqueueCard(i)}>
                                {gameState.queue[i] ? (
                                    <>
                                        <div className={`absolute top-0 w-full h-1 ${gameState.queue[i].color}`}></div>
                                        <div className="text-xs text-center">{gameState.queue[i].name}</div>
                                        <X size={10} className="absolute top-1 right-1 opacity-50"/>
                                    </>
                                ) : <div className="text-gray-700 text-xs">Empty</div>}
                            </div>
                        ))}
                    </div>
                    <button onClick={executeQueue} disabled={gameState.queue.length === 0 || animating} className={`w-14 h-full rounded font-bold text-xs flex flex-col items-center justify-center ${gameState.queue.length > 0 ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                        <Play size={16}/> GO
                    </button>
                </div>

                {/* Hand */}
                <div className="flex gap-2 overflow-x-auto pb-1 px-1 custom-scrollbar min-h-[90px] items-center">
                    {gameState.hand.map((card, i) => (
                        <div 
                            key={card.id} 
                            className={`w-20 h-24 bg-slate-800 border-2 rounded flex flex-col justify-between p-1 cursor-pointer relative shrink-0 ${card.currentCooldown > 0 ? 'opacity-50 grayscale' : 'hover:-translate-y-1 border-slate-500'}`}
                            onClick={() => handleQueueCard(card, i)}
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 ${card.color} rounded-t-sm`}></div>
                            <div className="mt-1 text-[9px] font-bold text-center leading-tight truncate">{card.name}</div>
                            <div className="flex justify-center my-0.5 text-slate-400 scale-75">{card.icon}</div>
                            <div className="flex justify-between items-center text-[8px] text-gray-500 mt-auto font-mono w-full">
                                <span>CD:{card.cooldown}</span>
                                {card.damage > 0 && <span className="text-red-400 font-bold">{card.damage}dmg</span>}
                            </div>
                            {card.currentCooldown > 0 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded text-xl font-bold">{card.currentCooldown}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Movement */}
                <div className="flex justify-center items-center gap-4 py-1 border-t border-white/10">
                    <button onClick={() => handleMove(-1)} className="bg-slate-700 p-3 rounded-full active:bg-slate-600"><ChevronLeft size={20}/></button>
                    <div className="flex gap-2">
                        <button onClick={handleTurn} className="bg-slate-700 px-3 py-2 rounded text-xs font-bold w-16">TURN</button>
                        <button onClick={handleSwapPosition} className={`px-2 py-2 rounded border transition-colors w-12 flex items-center justify-center ${gameState.specialActionCooldown > 0 ? 'bg-gray-800 border-gray-600 text-gray-500' : 'bg-cyan-700 border-cyan-400 text-cyan-100'}`}>
                            {gameState.specialActionCooldown > 0 ? <span className="text-xs font-bold">{gameState.specialActionCooldown}</span> : <ArrowLeftRight size={16}/>}
                        </button>
                        <button onClick={handleWait} className="bg-gray-800 px-4 py-2 rounded border border-gray-600 text-xs text-gray-400 w-20">WAIT</button>
                    </div>
                    <button onClick={() => handleMove(1)} className="bg-slate-700 p-3 rounded-full active:bg-slate-600"><ChevronRight size={20}/></button>
                </div>
            </div>
        </div>
    );
};

export default KochoShowdown;
