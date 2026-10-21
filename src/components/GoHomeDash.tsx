import React, { useState, useEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { Heart, Star, Skull, Brain, Book, Flame, Wind, Target, RotateCcw, ArrowLeft, Play, Sparkles, ChevronRight, AlertTriangle, Zap, Crosshair, Shield, Move, FastForward, Repeat, Search, Ghost, Music, Activity, Rocket, FlaskConical, Globe, MapPin, CheckCircle2, ChevronDown, Check, Languages, Home } from 'lucide-react';
import { audioService } from '../services/audioService';
import { SPRITE_TEMPLATES } from './PixelSprite';
import { storageService } from '../services/storageService';
import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, LanguageMode, MiniGameDebugPreview } from '../types';
import MiniGameProblemChallenge from './MiniGameProblemChallenge';
import { assetUrl } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';
import { DashLobby, DASH_HEROES, DEFAULT_DASH_HERO } from '../mini-games/go-home-dash/Lobby';
import { DASH_HERO_ART } from '../mini-games/go-home-dash/heroes';
import { routeAt, floorAt, routeCopy, ROUTE_LENGTH, DISTANCE_SCALE, routeTransition, type RouteId } from '../mini-games/go-home-dash/routes';
import { drawRoute, drawTerrain, drawRunner } from '../mini-games/go-home-dash/render';
import { stairRects, flightGateRects, isStair, overlapsSolid } from '../mini-games/go-home-dash/obstacles';
import { ArcadeHud } from '../mini-games/go-home-dash/ArcadeHud';
import { createArcade, beginArcade, endArcade, activateOrb, arcadePlatform, hitArcade, dashArcade, dailySeed, seededRandom, saveArcadeRun, loadArcadeProfile, trailColor, announce, type RunMode } from '../mini-games/go-home-dash/arcade';
import { drawArcade, drawArcadeRunner } from '../mini-games/go-home-dash/arcadeRender';
import { isProtagonistUnlocked } from '../utils/protagonistUnlocks';
import { multiTouchAction, multiTouchHold } from '../utils/multiTouchAction';

// --- CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 340;
const GRAVITY = 0.6; 
const JUMP_FORCE = -14.0; 
const BASE_SPEED = 4.5; 
const PLAYER_DEFAULT_X = 120;
const MAX_PARTICLES = 60; 
const MIN_OBSTACLE_GAP = 500; 
const PLAYER_DASH_FRAME_COUNT = 4;
const GO_HOME_DASH_ENEMY_SPRITE_SRC = assetUrl('sprites/go-home-dash-enemies.webp');
const GO_HOME_DASH_PROJECTILE_SPRITE_SRC = assetUrl('sprites/go-home-dash-projectiles.webp');

type ObstacleType =
    | 'BACKPACK' | 'VAULTING' | 'CHALKBOARD' | 'BIRD' | 'IRON_BARRIER' | 'HOLE'
    | 'STEPS' | 'HIGH_STEPS' | 'MOUNTAIN_STEPS' | 'JUMPING_SLIME' | 'DRONE' | 'TEACHER_RUNNER'
    | 'FLIGHT_GATE' | 'ELEVATOR' | 'SPRING' | 'PAPER_WYVERN' | 'WATER_SLIME' | 'FIRE_FLY' | 'WIND_SPIRIT'
    | 'HALL_MONITOR' | 'CURRICULUM_BOOK' | 'LAB_BOTTLE' | 'BASKETBALL_TURRET' | 'CLOCK_GHOST' | 'SHOE_ROLLER';

type ProjectileSpriteKey = 'PLAYER_PENCIL' | 'CHALK' | 'LASER' | 'BOOK' | 'BASKETBALL' | 'ALARM' | 'ERASER' | 'CHEMICAL' | 'WHISTLE';

interface SpriteCell {
    col: number;
    row: number;
    cell: number;
}

const ENEMY_SPRITE_CELLS: Partial<Record<ObstacleType, SpriteCell>> = {
    BACKPACK: { col: 0, row: 0, cell: 64 },
    VAULTING: { col: 1, row: 0, cell: 64 },
    CHALKBOARD: { col: 2, row: 0, cell: 64 },
    BIRD: { col: 3, row: 0, cell: 64 },
    IRON_BARRIER: { col: 0, row: 1, cell: 64 },
    JUMPING_SLIME: { col: 1, row: 1, cell: 64 },
    DRONE: { col: 2, row: 1, cell: 64 },
    TEACHER_RUNNER: { col: 3, row: 1, cell: 64 },
    HALL_MONITOR: { col: 0, row: 2, cell: 64 },
    CURRICULUM_BOOK: { col: 1, row: 2, cell: 64 },
    LAB_BOTTLE: { col: 2, row: 2, cell: 64 },
    BASKETBALL_TURRET: { col: 3, row: 2, cell: 64 },
    CLOCK_GHOST: { col: 0, row: 3, cell: 64 },
    SHOE_ROLLER: { col: 1, row: 3, cell: 64 },
};

const PROJECTILE_SPRITE_CELLS: Record<ProjectileSpriteKey, SpriteCell> = {
    PLAYER_PENCIL: { col: 0, row: 0, cell: 32 },
    CHALK: { col: 1, row: 0, cell: 32 },
    LASER: { col: 2, row: 0, cell: 32 },
    BOOK: { col: 3, row: 0, cell: 32 },
    BASKETBALL: { col: 4, row: 0, cell: 32 },
    ALARM: { col: 0, row: 1, cell: 32 },
    ERASER: { col: 1, row: 1, cell: 32 },
    CHEMICAL: { col: 2, row: 1, cell: 32 },
    WHISTLE: { col: 3, row: 1, cell: 32 },
};

interface Obstacle {
    id: string;
    x: number;
    y: number;
    vy: number; // 垂直速度（ジャンプ用）
    width: number;
    height: number;
    type: ObstacleType;
    speedMult: number;
    isHard?: boolean;
    shootCooldown?: number;
    baseY?: number;
    phase?: number;
}

interface Projectile {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    isHoming?: boolean;
    isLarge?: boolean;
    isPierce?: boolean;
    isEnemy?: boolean; // 敵の弾かどうか
    spriteKey?: ProjectileSpriteKey;
    gravity?: number;
    radius?: number;
}

interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface DashCardEffect {
    id: string;
    name: string;
    description: string;
    iconType: 'MATH' | 'SCIENCE' | 'JAPANESE' | 'PE' | 'SOCIAL';
    isWeaponBase?: boolean; 
    requiresWeapon?: boolean; 
    apply: (p: any, setHp: any, setMaxHp: any) => void;
}

type DashGameState = 'START' | 'PLAYING' | 'CHALLENGE' | 'LEVEL_UP' | 'GAME_OVER';

const drawSpriteCell = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | null,
    cell: SpriteCell | undefined,
    x: number,
    y: number,
    width: number,
    height: number,
    flipX = false
) => {
    if (!image || !cell || !image.complete || image.naturalWidth <= 0) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flipX) {
        ctx.translate(x + width / 2, y + height / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(image, cell.col * cell.cell, cell.row * cell.cell, cell.cell, cell.cell, -width / 2, -height / 2, width, height);
    } else {
        ctx.drawImage(image, cell.col * cell.cell, cell.row * cell.cell, cell.cell, cell.cell, x, y, width, height);
    }
    ctx.restore();
    return true;
};

const GoHomeDash: React.FC<{
    onBack: () => void;
    problemMode?: GameMode;
    problemModePool?: string[];
    answerMode?: AnswerMode;
    assignment?: AssignmentPayload | null;
    onAnswerResult?: (result: AssignmentAnswerResult) => void;
    languageMode?: LanguageMode;
    debugPreview?: MiniGameDebugPreview;
    initialHp?: number;
    initialMaxHp?: number;
    compact?: boolean;
    exitEnabled?: boolean;
}> = ({ onBack, problemMode = GameMode.MIXED, problemModePool, answerMode = 'CHOICE', assignment, onAnswerResult, languageMode = 'JAPANESE', debugPreview, initialHp = 3, initialMaxHp = 3, compact = false, exitEnabled = true }) => {
    const arcadeRef = useRef(createArcade(1));
    const [arcadeView, setArcadeView] = useState(() => createArcade(1));
    const [runMode, setRunMode] = useState<RunMode>('classic');
    const runModeRef = useRef<RunMode>('classic');
    const randomRef = useRef<() => number>(Math.random);
    const savedRunRef = useRef(false);
    const checkpointRef = useRef<{distance:number;seed:number;level:number;score:number}|null>(null);
    const pausedRef = useRef(false);
    const [paused, setPaused] = useState(false);
    const profileRef = useRef(loadArcadeProfile());
    const reducedMotionRef = useRef(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    const togglePause = () => { if (gameStateRef.current !== 'PLAYING') return; stopInputs(); pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); };
    const selectRunMode = (mode: RunMode) => { runModeRef.current=mode;setRunMode(mode);checkpointRef.current=null; };
    const [selectedHero, setSelectedHero] = useState<string>(DEFAULT_DASH_HERO);
    const heroRef = useRef(DEFAULT_DASH_HERO);
    const heroFallbackRef = useRef<HTMLImageElement | null>(null);
    const extraEnemiesRef = useRef<HTMLImageElement | null>(null);
    const routeArtRef = useRef<Partial<Record<RouteId, HTMLImageElement>>>({});
    const routeSeedRef = useRef(1);
    const distanceRef = useRef(0);
    const lastVoiceRef = useRef(-Infinity);
    const [travelled, setTravelled] = useState(0);
    const [route, setRoute] = useState<RouteId>('school');
    const [dashReady, setDashReady] = useState(true);
    const [flight, setFlight] = useState(false);
    const pointerIds = useRef(new Set<number>());
    const keysHeld = useRef(new Set<string>());
    const jumpButtonHeld = useRef(false);
    const refreshPressing = () => { playerRef.current.isPressing = pointerIds.current.size > 0 || keysHeld.current.size > 0 || jumpButtonHeld.current; };
    const voice = (event: 'jump' | 'dash' | 'flight' | 'damage' | 'upgrade' | 'defeat') => {
        const now = performance.now();
        if (event === 'jump' && now - lastVoiceRef.current < 2300) return;
        if (!audioService.canPlayConversationVoice()) return;
        lastVoiceRef.current = now;
        void audioService.playHomeDashVoice(heroRef.current, event);
    };
    const stopInputs = () => { pointerIds.current.clear(); keysHeld.current.clear(); jumpButtonHeld.current = false; playerRef.current.isPressing = false; };
    const returnToTitle = () => { checkpointRef.current=null;pausedRef.current=false;setPaused(false);stopInputs(); audioService.stopHomeDashVoices(); gameStateRef.current = 'START'; setGameState('START'); };
    const L = (ja: string, en: string, hi: string) => languageMode === 'ENGLISH' ? en : languageMode === 'HIRAGANA' ? hi : ja;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const focusCanvasRef = useRef<HTMLCanvasElement>(null);
    const playerSpriteRef = useRef<HTMLImageElement | null>(null);
    const enemySpriteSheetRef = useRef<HTMLImageElement | null>(null);
    const projectileSpriteSheetRef = useRef<HTMLImageElement | null>(null);
    const [gameState, setGameState] = useState<DashGameState>('START');
    const gameStateRef = useRef<DashGameState>('START');
    
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        if (debugPreview === 'GAME_OVER') {
            gameStateRef.current = 'GAME_OVER';
            setGameState('GAME_OVER');
        }
    }, [debugPreview]);

    useEffect(() => {
        let active = true;
        playerSpriteRef.current = null;
        heroFallbackRef.current = null;
        const sheet = new Image(), fallback = new Image();
        sheet.onload = () => { if (active) playerSpriteRef.current = sheet; };
        fallback.onload = () => { if (active) heroFallbackRef.current = fallback; };
        sheet.src = assetUrl(`sprites/go-home-dash/heroes/${selectedHero}.webp`);
        fallback.src = assetUrl(DASH_HERO_ART[selectedHero]);
        return () => { active = false; sheet.onload = null; fallback.onload = null; };
    }, [selectedHero]);

    useEffect(() => {
        const image = new Image();
        image.onload = () => { extraEnemiesRef.current = image; };
        image.src = assetUrl('sprites/go-home-dash/enemies.webp');
        return () => { image.onload = null; };
    }, []);

    useEffect(() => {
        let active = true;
        for (const id of ['school', 'rooftops', 'canal', 'garden', 'clockwork', 'skyway', 'storm'] as const) {
            const image = new Image();
            image.onload = () => { if (active) routeArtRef.current[id] = image; };
            image.src = assetUrl(`sprites/go-home-dash/routes/${id}.webp`);
        }
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const enemyImage = new Image();
        const projectileImage = new Image();
        enemyImage.onload = () => {
            enemySpriteSheetRef.current = enemyImage;
        };
        enemyImage.onerror = () => {
            enemySpriteSheetRef.current = null;
        };
        projectileImage.onload = () => {
            projectileSpriteSheetRef.current = projectileImage;
        };
        projectileImage.onerror = () => {
            projectileSpriteSheetRef.current = null;
        };
        enemyImage.src = GO_HOME_DASH_ENEMY_SPRITE_SRC;
        projectileImage.src = GO_HOME_DASH_PROJECTILE_SPRITE_SRC;

        return () => {
            enemyImage.onload = null;
            enemyImage.onerror = null;
            projectileImage.onload = null;
            projectileImage.onerror = null;
        };
    }, []);

    const t = (text: string) => trans(text, languageMode);
    
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [hp, setHp] = useState(initialHp);
    const [maxHp, setMaxHp] = useState(initialMaxHp);
    const [exp, setExp] = useState(0);
    const [nextLevelExp, setNextLevelExp] = useState(200);

    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const hpRef = useRef(initialHp);
    const maxHpRef = useRef(initialMaxHp);
    const expRef = useRef(0);
    const nextLevelExpRef = useRef(200);
    const frameCount = useRef(0);
    const shakeRef = useRef(0);

    useEffect(() => {
        hpRef.current = hp;
    }, [hp]);

    useEffect(() => {
        maxHpRef.current = maxHp;
    }, [maxHp]);

    useEffect(() => () => {
        audioService.stopHomeDashVoices();
        if (compact) audioService.stopBGM();
    }, [compact]);

    const playerRef = useRef({
        x: PLAYER_DEFAULT_X,
        y: GROUND_Y,
        vy: 0,
        isJumping: false,
        isFalling: false,
        isPressing: false, 
        jumpCount: 0,
        maxJumps: 1,
        invulFrame: 0,
        speedBoost: 1,
        shootingRate: 0,
        shootingTimer: 0,
        barrier: false,
        barrierRegen: false,
        barrierTimer: 0,
        expMult: 1,
        animFrame: 0,
        animTimer: 0,
        jumpActionFrame: 0,
        autoHeal: false,
        autoHealTimer: 0,
        pierceShot: false,
        doubleShot: false,
        tripleShot: false,
        homingShot: false,
        largeShot: false,
        landShockwave: false,
        stompAbility: false,
        airStall: false,
        reflectShield: false,
        lifesteal: false,
        trailFire: false,
        jumpBoom: false,
        scoreBonus: 1,
        cleaningDuty: 0,
        animFrameTimer: 0, dashFrames: 0, dashCooldown: 0, flying: false, flapCooldown: 0
    });

    const obstaclesRef = useRef<Obstacle[]>([]);
    const projectilesRef = useRef<Projectile[]>([]);
    const enemyProjectilesRef = useRef<Projectile[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const frameIdRef = useRef<number>(null);

    // --- UPGRADE POOL ---
    const UPGRADE_POOL: DashCardEffect[] = useMemo(() => [
        { id: 'STRIKE_1', name: 'えんぴつミサイル', description: '前方にえんぴつを発射！', iconType: 'MATH', isWeaponBase: true, apply: (p) => { p.shootingRate = p.shootingRate === 0 ? 100 : Math.max(30, p.shootingRate - 20); } },
        { id: 'STRIKE_2', name: '2連装えんぴつ', description: '弾を2発同時に発射する。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.doubleShot = true; } },
        { id: 'STRIKE_3', name: '3方向ショット', description: '扇状に3発の弾を発射。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.tripleShot = true; } },
        { id: 'STRIKE_4', name: '貫通えんぴつ', description: '弾が敵を貫通するようになる。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.pierceShot = true; } },
        { id: 'STRIKE_5', name: '巨大えんぴつ', description: '弾のサイズと当たり判定がアップ。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.largeShot = true; } },
        { id: 'STRIKE_6', name: '追尾誘導弾', description: '一番近い敵を自動で追いかける。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.homingShot = true; } },
        { id: 'STRIKE_7', name: '連射力UP', description: 'ミサイルの発射速度が大幅に上昇。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.shootingRate = Math.max(15, (p.shootingRate || 100) - 30); } },
        { id: 'STRIKE_8', name: '着地衝撃波', description: '着地時に周囲の敵をなぎ倒す。', iconType: 'PE', apply: (p) => { p.landShockwave = true; } },
        { id: 'STRIKE_9', name: 'ソニックブーム', description: 'ジャンプ時に前方の敵を攻撃。', iconType: 'PE', apply: (p) => { p.jumpBoom = true; } },
        { id: 'STRIKE_10', name: '火炎の足跡', description: '走りながら背後に炎を置いていく。', iconType: 'SCIENCE', apply: (p) => { p.trailFire = true; } },
        { id: 'STRIKE_11', name: '辞書プレッシャー', description: '定期的に巨大な辞書を投げつける。', iconType: 'JAPANESE', requiresWeapon: true, apply: (p) => { p.largeShot = true; p.shootingRate = Math.max(40, (p.shootingRate || 120) - 10); } },
        { id: 'STRIKE_12', name: '反射バリア', description: 'バリア消失時に敵にダメージ。', iconType: 'SCIENCE', apply: (p) => { p.reflectShield = true; p.barrier = true; } },
        { id: 'STRIKE_13', name: '吸血攻撃', description: '敵を倒すと稀にHPが1回復する。', iconType: 'SCIENCE', apply: (p) => { p.lifesteal = true; } },
        { id: 'STRIKE_14', name: 'コンパス針', description: '弾が回転しながら飛び、多段ヒット。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.pierceShot = true; p.shootingRate = Math.max(30, (p.shootingRate || 100) - 5); } },
        { id: 'STRIKE_15', name: 'フルバースト', description: '弾数が一気に増えるが、少し遅くなる。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.doubleShot = true; p.tripleShot = true; p.speedBoost *= 0.95; } },
        { id: 'MOVE_1', name: '上履きブースト', description: '移動速度が常時アップ。', iconType: 'PE', apply: (p) => { p.speedBoost += 0.2; } },
        { id: 'MOVE_2', name: '空中2段ジャンプ', description: '空中でさらにもう一度飛べる。', iconType: 'PE', apply: (p) => { p.maxJumps = Math.max(p.maxJumps, 2); } },
        { id: 'MOVE_3', name: '3段ジャンプ', description: '驚異の3段ジャンプが可能に。', iconType: 'PE', apply: (p) => { p.maxJumps = Math.max(p.maxJumps, 3); } },
        { id: 'MOVE_4', name: 'マ〇オステップ', description: '敵を踏んで倒せるようになる！', iconType: 'PE', apply: (p) => { p.stompAbility = true; } },
        { id: 'MOVE_5', name: 'ホバリング', description: 'ジャンプ中に長押しで滞空できる。', iconType: 'SCIENCE', apply: (p) => { p.airStall = true; } },
        { id: 'MOVE_6', name: 'ロケットスタート', description: '初期位置から少し前に進む。', iconType: 'PE', apply: (p) => { p.x = Math.min(p.x + 50, 300); } },
        { id: 'MOVE_8', name: '瞬足の極意', description: '速度が大幅アップし、無敵時間増加。', iconType: 'PE', apply: (p) => { p.speedBoost += 0.3; } },
        { id: 'DEF_1', name: 'ノートバリア', description: '衝突を防ぐバリアを展開。', iconType: 'JAPANESE', apply: (p) => { p.barrier = true; } },
        { id: 'DEF_2', name: '給食おかわり', description: '最大HPが+1され、全回復。', iconType: 'SOCIAL', apply: (p, setHp, setMaxHp) => { setMaxHp((prev:number)=>prev+1); setHp((prev:number)=>prev+1); } },
        { id: 'DEF_3', name: '自動修復ノート', description: '一定時間ごとにバリアが自動復活。', iconType: 'JAPANESE', apply: (p) => { p.barrierRegen = true; } },
        { id: 'DEF_4', name: '保健室の飴', description: '一定時間ごとにHPが1回復する。', iconType: 'SOCIAL', apply: (p) => { p.autoHeal = true; } },
        { id: 'DEF_7', name: 'カルシウム摂取', description: '最大HP+2。', iconType: 'SOCIAL', apply: (p, setHp, setMaxHp) => { setMaxHp((prev:number)=>prev+2); } },
        { id: 'DEF_10', name: 'ビタミン補給', description: 'HPを2回復し、加速。', iconType: 'SOCIAL', apply: (p, setHp) => { setHp((prev:number)=>Math.min(5, prev+2)); p.speedBoost += 0.1; } },
        { id: 'UTIL_1', name: '進級パワー', description: '獲得EXPが常時1.5倍に。', iconType: 'SCIENCE', apply: (p) => { p.expMult += 0.5; } },
        { id: 'UTIL_2', name: 'お年玉ボーナス', description: 'スコアの増加速度がアップ。', iconType: 'SOCIAL', apply: (p) => { p.scoreBonus += 0.5; } },
        { id: 'UTIL_4', name: '大掃除', description: '画面内の敵をすべて消去する。', iconType: 'SOCIAL', apply: (p) => { p.cleaningDuty = 1; } },
        { id: 'UTIL_7', name: '委員長の号令', description: 'すべてのクールダウンを短縮。', iconType: 'JAPANESE', apply: (p) => { p.shootingRate = Math.max(20, (p.shootingRate || 100) - 20); } },
        { id: 'UTIL_10', name: '卒業証明書', description: 'すべてのステータスを少しずつ強化。', iconType: 'SOCIAL', apply: (p) => { p.maxJumps = 2; p.speedBoost += 0.1; p.shootingRate = 60; p.expMult += 0.2; } },
    ], [setHp, setMaxHp]);

    const [upgradeOptions, setUpgradeOptions] = useState<DashCardEffect[]>([]);

    const addVfxRing = (x: number, y: number, color: string) => {
        for(let i=0; i<8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            particlesRef.current.push({
                id: Math.random().toString(), x, y,
                vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5,
                life: 15, color, size: 4
            });
        }
    };

    const triggerShake = () => {
        shakeRef.current = 10;
    };

    const selectUpgrade = (card: DashCardEffect) => {
        const p = playerRef.current;
        card.apply(p, setHp, setMaxHp);
        // 報酬獲得後2秒間（120フレーム）無敵にする
        p.invulFrame = 120;
        stopInputs();
        gameStateRef.current = 'PLAYING';
        setGameState('PLAYING');
        audioService.playBGM('survivor_metal');
        audioService.playSound('buff');
        voice('upgrade');
    };

    const initGame = () => {
        // Re-check at the action boundary so stale selections cannot bypass a
        // reset or a main-story save imported while the lobby was open.
        const id = isProtagonistUnlocked(selectedHero) && DASH_HEROES.some(h => h.id === selectedHero) ? selectedHero : DEFAULT_DASH_HERO;
        setSelectedHero(id); heroRef.current = id;
        stopInputs(); audioService.stopHomeDashVoices(); lastVoiceRef.current = -Infinity;
        const mode = runModeRef.current, checkpoint = mode === 'practice' ? checkpointRef.current : null;
        routeSeedRef.current = checkpoint?.seed ?? (mode === 'daily' ? dailySeed() : crypto.getRandomValues(new Uint32Array(1))[0]);
        distanceRef.current = checkpoint?.distance ?? 0; frameCount.current = 0; shakeRef.current = 0;
        randomRef.current = mode === 'daily' ? seededRandom(routeSeedRef.current) : () => Math.random();
        arcadeRef.current = createArcade(routeSeedRef.current, mode, distanceRef.current);
        setArcadeView({...arcadeRef.current});savedRunRef.current=false;pausedRef.current=false;setPaused(false);
        setTravelled(0); setRoute('school'); setFlight(false); setDashReady(true);
        gameStateRef.current = 'PLAYING';
        scoreRef.current = 0; levelRef.current = 1; hpRef.current = initialHp; maxHpRef.current = initialMaxHp; expRef.current = 0; nextLevelExpRef.current = 200;
        setScore(0); setLevel(1); setExp(0); setHp(initialHp); setMaxHp(initialMaxHp); setNextLevelExp(200);
        playerRef.current = {
            x: PLAYER_DEFAULT_X, y: GROUND_Y, vy: 0, isJumping: false, isFalling: false, isPressing: false, jumpCount: 0, maxJumps: 1, invulFrame: 0,
            speedBoost: 1, shootingRate: 0, shootingTimer: 0, barrier: false, barrierRegen: false, barrierTimer: 0, expMult: 1,
            animFrame: 0, animTimer: 0, jumpActionFrame: 0, autoHeal: false, autoHealTimer: 0, 
            pierceShot: false, doubleShot: false, tripleShot: false, homingShot: false, largeShot: false, landShockwave: false, 
            stompAbility: false, airStall: false, reflectShield: false, lifesteal: false, trailFire: false, jumpBoom: false,
            scoreBonus: 1, cleaningDuty: 0, animFrameTimer: 0, dashFrames: 0, dashCooldown: 0, flying: false, flapCooldown: 0
        };
        obstaclesRef.current = []; projectilesRef.current = []; enemyProjectilesRef.current = []; particlesRef.current = [];
        if (checkpoint) {
            playerRef.current.y=floorAt(routeSeedRef.current,distanceRef.current+120);playerRef.current.invulFrame=120;
            levelRef.current=checkpoint.level;scoreRef.current=checkpoint.score;nextLevelExpRef.current=100+checkpoint.level*100;
            setLevel(checkpoint.level);setScore(checkpoint.score);setTravelled(Math.floor(distanceRef.current/DISTANCE_SCALE));setRoute(routeAt(routeSeedRef.current,distanceRef.current+120).id);
        }
        setGameState('PLAYING');
        audioService.playBGM('survivor_metal');
    };

    const addParticle = (x: number, y: number, color: string) => {
        if (particlesRef.current.length > MAX_PARTICLES) return;
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 2 + 1;
        particlesRef.current.push({
            id: Math.random().toString(),
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 20,
            color,
            size: Math.random() * 3 + 1
        });
    };

    const triggerJump = () => {
        if (gameStateRef.current !== 'PLAYING') return;
        const p = playerRef.current, arcade=arcadeRef.current;
        if (pausedRef.current) return;
        arcade.slide=0;
        if (activateOrb(arcade,p,distanceRef.current)) { voice('jump'); audioService.playSound('jump'); return; }
        if (arcade.vehicle === 'gravity') { arcade.gravity *= -1;p.vy=arcade.gravity*4;voice('jump');return; }
        if (arcade.vehicle === 'wave') return;
        if (p.flying) { p.vy = -4.6; p.flapCooldown = 18; voice('jump'); addParticle(p.x, p.y, '#befcff'); return; }
        if (!p.flying && !p.isFalling && p.jumpCount < p.maxJumps) {
            p.vy = JUMP_FORCE * (arcade.sneakers>0?1.3:1); p.isJumping = true; p.jumpCount++; p.jumpActionFrame = 12;
            voice('jump');
            audioService.playSound('jump'); addParticle(p.x, p.y, '#ffffff');
            if (p.jumpBoom) {
                 addVfxRing(p.x, p.y, '#ffffff');
                 obstaclesRef.current = obstaclesRef.current.filter(obs => {
                     const dx = obs.x - p.x;
                     if (dx > 0 && dx < 150 && Math.abs(obs.y - p.y) < 100) {
                         if (['FLIGHT_GATE', 'HOLE', 'STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS', 'IRON_BARRIER', 'VAULTING', 'CHALKBOARD', 'ELEVATOR', 'SPRING'].includes(obs.type)) {
                             addParticle(obs.x, obs.y, '#94a3b8');
                             return true;
                         }
                         addParticle(obs.x, obs.y, '#ffeb3b');
                         scoreRef.current += 10;
                         return false;
                     }
                     return true;
                 });
            }
        }
    };

    const triggerDash = () => {
        if (gameStateRef.current !== 'PLAYING') return;
        const p = playerRef.current;
        if (pausedRef.current || p.dashCooldown > 0 || p.isFalling) return;
        p.dashFrames = 90; p.dashCooldown = 240;
        p.invulFrame = Math.max(p.invulFrame, 94);
        if (p.isJumping) p.vy = Math.min(p.vy, -2);
        voice('dash'); audioService.playSound('buff'); addVfxRing(p.x, p.y - 30, '#83f3eb');
        dashArcade(arcadeRef.current,p);
        setDashReady(false);
    };
    const triggerSlide = () => {
        if (gameStateRef.current !== 'PLAYING' || pausedRef.current) return;
        const p=playerRef.current;if(p.flying)return;
        arcadeRef.current.slide=52;
        if(p.isJumping){p.vy=12;addVfxRing(p.x,p.y-24,'#8cecff');}
    };
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (gameStateRef.current !== 'PLAYING' || e.button !== 0) return;
        e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
        pointerIds.current.add(e.pointerId); refreshPressing(); triggerJump();
    };
    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        pointerIds.current.delete(e.pointerId); refreshPressing();
    };
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameStateRef.current !== 'PLAYING') return;
            if (e.code === 'KeyP' || e.key.toLowerCase() === 'p') { e.preventDefault();if(!e.repeat)togglePause();return; }
            if (pausedRef.current) return;
            if (['ArrowDown','KeyS'].includes(e.code)||e.key==='ArrowDown'||e.key.toLowerCase()==='s') {e.preventDefault();if(!e.repeat)triggerSlide();return;}
            if (e.code === 'Escape') { e.preventDefault(); if (exitEnabled) onBack(); return; }
            if (['ShiftLeft', 'ShiftRight', 'KeyX'].includes(e.code) || e.key === 'Shift' || e.key === 'x') {
                e.preventDefault(); if (!e.repeat) triggerDash(); return;
            }
            if (!['Space', 'ArrowUp', 'KeyW'].includes(e.code) && e.key !== ' ') return;
            e.preventDefault(); if (e.repeat) return;
            keysHeld.current.add(e.code || e.key); refreshPressing(); triggerJump();
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysHeld.current.delete(e.code || e.key); refreshPressing(); };
        const loseFocus = () => { stopInputs(); audioService.stopHomeDashVoices();if(gameStateRef.current==='PLAYING'){pausedRef.current=true;setPaused(true);} };
        const hide = () => { if (document.hidden) loseFocus(); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', loseFocus);
        document.addEventListener('visibilitychange', hide);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', loseFocus);
            document.removeEventListener('visibilitychange', hide);
        };
    }, [onBack, exitEnabled]);

    const isDestroyable = (type: string) => !['FLIGHT_GATE', 'HOLE', 'STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS', 'IRON_BARRIER', 'VAULTING', 'CHALKBOARD', 'CURRICULUM_BOOK', 'BASKETBALL_TURRET', 'ELEVATOR', 'SPRING'].includes(type);

    const getObstaclePool = (): ObstacleType[] => {
        const level = levelRef.current;
        const pool: ObstacleType[] = ['BACKPACK', 'VAULTING', 'CHALKBOARD', 'BIRD', 'IRON_BARRIER', 'HOLE', 'STEPS', 'JUMPING_SLIME'];
        if (level >= 2) pool.push('DRONE', 'SHOE_ROLLER');
        if (level >= 3) pool.push('TEACHER_RUNNER', 'HALL_MONITOR', 'HIGH_STEPS');
        if (level >= 4) pool.push('LAB_BOTTLE', 'CURRICULUM_BOOK');
        if (level >= 5) pool.push('BASKETBALL_TURRET', 'CLOCK_GHOST', 'MOUNTAIN_STEPS');
        const stage = routeAt(routeSeedRef.current, distanceRef.current + 120);
        if (stage.id !== 'school') {
            const themed: ObstacleType[] = stage.id === 'garden' ? ['SPRING', 'PAPER_WYVERN', 'BACKPACK', 'JUMPING_SLIME'] : stage.id === 'clockwork' ? ['ELEVATOR', 'FIRE_FLY', 'CLOCK_GHOST', 'BACKPACK'] : stage.id === 'canal' ? ['WATER_SLIME', 'BIRD', 'BACKPACK', 'PAPER_WYVERN'] : stage.id === 'skyway' || stage.id === 'storm' ? ['PAPER_WYVERN', 'FIRE_FLY', 'WIND_SPIRIT'] : ['ELEVATOR', 'PAPER_WYVERN', 'BACKPACK', 'SHOE_ROLLER'];
            return stage.flight ? [] : [...themed, 'STEPS', 'HIGH_STEPS'];
        }
        return pool;
    };

    const updateLogic = () => {
        if (gameStateRef.current !== 'PLAYING' || pausedRef.current) return;
        const p = playerRef.current, arcade=arcadeRef.current;
        const currentSpeed = Math.min(9, (BASE_SPEED + ((levelRef.current - 1) * 0.4)) * p.speedBoost) * (p.dashFrames > 0 ? 1.45 : arcade.boost>0?1.2:1);
        const previousFloor = floorAt(routeSeedRef.current, distanceRef.current + p.x);
        const previousY = p.y;
        distanceRef.current += currentSpeed;
        const stage = routeAt(routeSeedRef.current, distanceRef.current + p.x);
        const floor = floorAt(routeSeedRef.current, distanceRef.current + p.x);
        beginArcade(arcade,distanceRef.current,stage.flight);
        if(arcade.clearAhead){obstaclesRef.current=obstaclesRef.current.filter(o=>o.x<300);enemyProjectilesRef.current=enemyProjectilesRef.current.filter(o=>o.x<300);}
        const shouldFly = stage.flight || arcade.vehicle !== 'normal';
        if (shouldFly && !p.flying) { p.isFalling = false; p.y = Math.min(p.y, 280); p.vy = -4; p.flapCooldown = 18; voice('flight'); addVfxRing(p.x, p.y - 30, '#befcff'); }
        if (!shouldFly && p.flying) { p.isJumping = true; p.jumpCount = 0; p.vy = Math.max(0, p.vy); }
        p.flying = shouldFly;
        if (p.dashFrames > 0) p.dashFrames--;
        if (p.dashCooldown > 0) p.dashCooldown--;
        if (!p.isJumping && !p.isFalling && !p.flying && Math.abs(p.y - previousFloor) < 12) p.y = floor;

        frameCount.current++;

        if (p.x < PLAYER_DEFAULT_X) p.x += 0.8;

        p.animFrameTimer = (p.animFrameTimer || 0) + 1;
        const animThreshold = Math.max(2, 6 - Math.floor(currentSpeed * 0.5));
        if (p.animFrameTimer > animThreshold) {
            if (!p.isJumping && !p.isFalling) p.animFrame = (p.animFrame + 1) % PLAYER_DASH_FRAME_COUNT;
            p.animFrameTimer = 0;
            if (!p.isJumping && !p.isFalling) addParticle(p.x - 10, p.y, '#8d6e63');
        }
        if (p.jumpActionFrame > 0) p.jumpActionFrame--;

        if (!p.flying && p.airStall && p.isPressing && p.vy > 0) {
            p.vy *= 0.8; 
            addParticle(p.x, p.y + 10, '#00ffff');
        }

        if (!p.flying && p.isJumping && !p.isPressing && p.vy < -2) p.vy *= 0.85;
        if (p.flying && arcade.vehicle === 'gravity') {
            p.vy=Math.max(-6,Math.min(6,p.vy+arcade.gravity*.6));p.y=Math.max(84,Math.min(floor,p.y+p.vy));
            if(p.y===84||p.y===floor)p.vy=0;p.isJumping=true;p.isFalling=false;
        } else if (p.flying && arcade.vehicle === 'wave') {
            p.vy=p.isPressing?-3.6:3.6;p.y=Math.max(84,Math.min(floor-8,p.y+p.vy));p.isJumping=true;p.isFalling=false;
        } else if (p.flying && arcade.vehicle === 'rocket') {
            p.vy=Math.max(-5,Math.min(5,p.vy+(p.isPressing?-.38:.25)));p.y=Math.max(84,Math.min(floor-8,p.y+p.vy));p.isJumping=true;p.isFalling=false;
        } else if (p.flying) {
            p.flapCooldown = Math.max(0, (p.flapCooldown || 0) - 1);
            if (p.isPressing && p.flapCooldown === 0) { p.vy = -4.6; p.flapCooldown = 18; addParticle(p.x - 12, p.y, '#befcff'); }
            p.vy += .28;
            if (stage.id === 'storm') p.vy -= .06 * (1 + Math.sin(distanceRef.current * .004));
            p.vy = Math.max(-4.8, Math.min(4.8, p.vy));
            p.y += p.vy;
            if (p.y < 84 || p.y > 334) {
                if (p.invulFrame <= 0) handlePlayerDamage(false);
                p.y = Math.max(84, Math.min(334, p.y)); p.vy = p.y <= 84 ? 2 : -3;
            }
            p.isJumping = true; p.isFalling = false;
        } else { p.vy += GRAVITY * (arcade.lowGravity>0?.55:1); p.y += p.vy; }

        if (p.isFalling && p.y > CANVAS_HEIGHT + 20) { handlePlayerDamage(true); return; }

        const railTop=arcadePlatform(arcade,p,distanceRef.current,previousY);
        let currentGroundLevel = Math.min(floor,railTop);
        let isOnObject = Number.isFinite(railTop);

        if (p.cleaningDuty > 0) {
            addVfxRing(p.x, p.y, '#ffffff');
            obstaclesRef.current = obstaclesRef.current.filter(obs => !isDestroyable(obs.type));
            p.cleaningDuty = 0;
            audioService.playSound('win');
        }

        const obstacles = obstaclesRef.current;
        for (const obs of obstacles) {
            if (obs.type === 'ELEVATOR' && !p.flying) {
                const top = obs.y - obs.height / 2;
                const previousTop = top - (obs.vy || 0);
                const wasOnTop = Math.abs(previousY - previousTop) < 6 && !p.isJumping;
                if (Math.abs(p.x - obs.x) < obs.width / 2 - 5 && p.vy >= 0 && (wasOnTop || previousY <= previousTop + 4) && p.y >= top - 6) {
                    currentGroundLevel = Math.min(currentGroundLevel, top); isOnObject = true;
                }
            }
            if (isStair(obs.type) && !p.flying) {
                const base = floorAt(routeSeedRef.current, distanceRef.current + obs.x);
                for (const rect of stairRects(obs, base)) {
                    // Sweep the incoming face over this frame as well as current overlap.
                    const left = rect.left - currentSpeed;
                    if (p.x + 15 <= left || p.x - 15 >= rect.left + rect.width) continue;
                    if (p.vy >= 0 && previousY <= rect.top + 5 && p.y >= rect.top) {
                        currentGroundLevel = Math.min(currentGroundLevel, rect.top); isOnObject = true;
                    } else if (p.y > rect.top + 5 && p.y - 64 < base && p.x < rect.left + rect.width) {
                        p.x = Math.min(p.x, left - 15);
                        if (p.x <= 24) {
                            if (p.invulFrame <= 0) handlePlayerDamage(false);
                            // Recover above the wall instead of an unavoidable instant death.
                            p.x = PLAYER_DEFAULT_X; p.y = base - obs.height - 8;
                            p.vy = -6; p.isJumping = true; p.isFalling = false; p.jumpCount = 0;
                        }
                    }
                }
            }
        }

        const overHole = !isOnObject && obstacles.some(obs => obs.type === 'HOLE' && Math.abs(obs.x - p.x) < obs.width / 2);

        if (!p.flying && p.y >= currentGroundLevel) {
            if (overHole || p.isFalling) p.isFalling = true;
            else {
                if (p.isFalling) p.isFalling = false;
                if (p.isJumping) {
                    for (let i = 0; i < 5; i++) addParticle(p.x - 8 + i * 4, currentGroundLevel, '#cbd5e1');
                    if (p.landShockwave) {
                        addVfxRing(p.x, currentGroundLevel, '#ffeb3b');
                        audioService.playSound('block');
                        obstaclesRef.current = obstaclesRef.current.filter(obs => {
                            if (!isDestroyable(obs.type)) return true;
                            return Math.abs(obs.x - p.x) > 120;
                        });
                    }
                }
                p.y = currentGroundLevel; p.vy = 0; p.isJumping = false; p.jumpCount = 0;
            }
        }

        if (!p.flying && p.y < currentGroundLevel - 3 && p.vy > 0) p.isJumping = true;

        if (p.invulFrame > 0) p.invulFrame--;
        
        if (p.barrierRegen && !p.barrier) {
            p.barrierTimer++;
            if (p.barrierTimer > 600) { p.barrier = true; p.barrierTimer = 0; audioService.playSound('buff'); }
        }

        if (p.autoHeal) {
            p.autoHealTimer++;
            if (p.autoHealTimer > 1200) { setHp(h => Math.min(maxHpRef.current, h + 1)); p.autoHealTimer = 0; audioService.playSound('buff'); }
        }

        if (p.trailFire && frameCount.current % 10 === 0) {
            addParticle(p.x - 20, p.y, '#ff4500');
            obstaclesRef.current = obstaclesRef.current.filter(obs => {
                if (!isDestroyable(obs.type)) return true;
                return Math.abs(obs.x - (p.x - 40)) > 40;
            });
        }

        if (p.shootingRate > 0) {
            p.shootingTimer++;
            if (p.shootingTimer >= p.shootingRate) {
                const angles = p.tripleShot ? [-0.2, 0, 0.2] : [0];
                const count = p.doubleShot ? 2 : 1;
                for (const angle of angles) {
                    for (let i = 0; i < count; i++) {
                        projectilesRef.current.push({ 
                            id: randomRef.current().toString(), x: p.x + 20, y: p.y - 25 - (i * 12),
                            vx: (currentSpeed + 12) * Math.cos(angle), 
                            vy: (currentSpeed + 12) * Math.sin(angle),
                            isHoming: p.homingShot, isLarge: p.largeShot, isPierce: p.pierceShot,
                            spriteKey: 'PLAYER_PENCIL',
                            radius: p.largeShot ? 12 : 7
                        });
                    }
                }
                p.shootingTimer = 0; audioService.playSound('attack');
            }
        }

        // プレイヤーの弾更新
        const projs = projectilesRef.current;
        for (let i = projs.length - 1; i >= 0; i--) {
            const pr = projs[i];
            if (pr.isHoming) {
                const target = obstaclesRef.current.find(o => o.x > pr.x && isDestroyable(o.type));
                if (target) {
                    const ang = Math.atan2(target.y - 20 - pr.y, target.x - pr.x);
                    pr.vx += Math.cos(ang) * 0.5; pr.vy += Math.sin(ang) * 0.5;
                }
            }
            pr.x += pr.vx; pr.y += pr.vy;
            if (pr.x > CANVAS_WIDTH + 50 || pr.y < -50 || pr.y > CANVAS_HEIGHT + 50) projs.splice(i, 1);
        }

        // 敵の弾更新
        const enemyProjs = enemyProjectilesRef.current;
        for (let i = enemyProjs.length - 1; i >= 0; i--) {
            const ep = enemyProjs[i];
            ep.vy += ep.gravity || 0;
            ep.x += ep.vx; ep.y += ep.vy;
            
            // プレイヤーとの当たり判定
            const dx = ep.x - p.x;
            const dy = ep.y - (p.y - 20);
            if (Math.sqrt(dx*dx + dy*dy) < 18 + (ep.radius || 7) && p.invulFrame <= 0) {
                handlePlayerDamage(false);
                enemyProjs.splice(i, 1);
                continue;
            }

            if (ep.x < -50 || ep.y < -50 || ep.y > CANVAS_HEIGHT + 50) enemyProjs.splice(i, 1);
        }

        const parts = particlesRef.current;
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i]; part.x += part.vx; part.y += part.vy; part.life--;
            if (part.life <= 0) parts.splice(i, 1);
        }

        const lastObs = obstacles.length > 0 ? obstacles[obstacles.length - 1] : null;
        const spawnX = CANVAS_WIDTH + 150;
        
        const spawnProb = 0.02 + (levelRef.current * 0.005) + (scoreRef.current * 0.00001);
        const dynamicGap = Math.max(440, currentSpeed * 105, MIN_OBSTACLE_GAP - (levelRef.current * 20));

        const incoming = routeAt(routeSeedRef.current, distanceRef.current + spawnX);
        const lastGate = [...obstacles].reverse().find(o => o.type === 'FLIGHT_GATE');
        if (stage.flight && incoming.flight && stage.index === incoming.index && incoming.progress < ROUTE_LENGTH - 1200 && (!lastGate || spawnX - lastGate.x > Math.max(520, currentSpeed * 110))) {
            const center = 175 + Math.sin(Math.floor((distanceRef.current + spawnX) / 700) * 1.7 + routeSeedRef.current) * 30;
            obstacles.push({id:crypto.randomUUID(),type:'FLIGHT_GATE',x:spawnX,y:center,width:72,height:340,vy:0,speedMult:1,isHard:true});
        }
        const arcadeHazardAhead=arcade.entities.some(e=>!e.taken&&!['coin','star'].includes(e.kind)&&e.d-distanceRef.current>100&&e.d-distanceRef.current<1350);
        if (!p.flying && arcade.vehicle === 'normal' && !arcadeHazardAhead && !arcade.boss && (!lastObs || (spawnX - lastObs.x) > dynamicGap) && randomRef.current() < spawnProb && obstacles.length < 8) {
            const types = getObstaclePool();
            let type = types[Math.floor(randomRef.current() * types.length)];
            if (lastObs?.type === 'HOLE' && ['HOLE', 'STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS'].includes(type)) type = 'BACKPACK';
            
            if (isStair(type) && (incoming.id !== stage.id || incoming.flight)) type = 'BACKPACK';
            const isAir = ['BIRD', 'DRONE', 'CLOCK_GHOST', 'PAPER_WYVERN', 'FIRE_FLY', 'WIND_SPIRIT'].includes(type);
            const isHard = !isDestroyable(type);
            const speedMult = type === 'TEACHER_RUNNER' ? 1.8 : type === 'HALL_MONITOR' ? 1.65 : type === 'SHOE_ROLLER' ? 1.9 : (isAir ? 1.25 : 1.0);
            
            let width = 40;
            let height = 40;
            if (type === 'ELEVATOR') { width = 170; height = 18; }
            else if (type === 'SPRING') { width = 70; height = 15; }
            else if (type === 'STEPS') { width = 200; height = 60; }
            else if (type === 'HIGH_STEPS') { width = 320; height = 110; }
            else if (type === 'MOUNTAIN_STEPS') { width = 480; height = 160; }
            else if (type === 'HOLE') { width = 70; }
            else if (type === 'BASKETBALL_TURRET' || type === 'CURRICULUM_BOOK') { width = 52; height = 52; }
            else if (type === 'CLOCK_GHOST') { width = 48; height = 48; }
            else if (type === 'SHOE_ROLLER') { width = 46; height = 34; }

            obstaclesRef.current.push({ 
                id: randomRef.current().toString(),
                x: spawnX, 
                y: isAir ? (stage.flight ? 115 + randomRef.current() * 135 : floorAt(routeSeedRef.current, distanceRef.current + spawnX) - 110 - randomRef.current() * 50) : floorAt(routeSeedRef.current, distanceRef.current + spawnX) - height / 2,
                baseY: 0, phase: randomRef.current() * Math.PI * 2,
                vy: 0,
                width, 
                height, 
                type, 
                speedMult, 
                isHard,
                shootCooldown: ['DRONE', 'TEACHER_RUNNER', 'LAB_BOTTLE', 'BASKETBALL_TURRET', 'CLOCK_GHOST', 'HALL_MONITOR', 'FIRE_FLY', 'WIND_SPIRIT'].includes(type) ? 80 + randomRef.current() * 70 : 0
            });
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i]; 
            obs.x -= currentSpeed * obs.speedMult;
            const obsFloor = floorAt(routeSeedRef.current, distanceRef.current + obs.x);
            if (obs.type === 'FLIGHT_GATE') {
                if (!stage.flight) { obstacles.splice(i, 1); continue; }
                if (p.invulFrame <= 0 && flightGateRects(obs.x, obs.width, obs.y).some(r => overlapsSolid(p.x, p.y, r))) handlePlayerDamage(false);
                if (obs.x < -obs.width) obstacles.splice(i, 1);
                continue;
            }
            if (obs.type === 'ELEVATOR') {
                const nextY = obsFloor - 56 - (1 + Math.sin(frameCount.current * .025 + (obs.phase || 0))) * 24;
                obs.vy = nextY - obs.y; obs.y = nextY;
            } else if (obs.type === 'SPRING') {
                obs.y = obsFloor - 7;
                if (!p.flying && Math.abs(p.x - obs.x) < 36 && p.y >= obsFloor - 15 && p.vy >= 0) {
                    p.vy = -17; p.isJumping = true; p.jumpCount = 0;
                    voice('jump'); audioService.playSound('jump'); addVfxRing(p.x, p.y, '#c9ff8a');
                }
            } else if (['PAPER_WYVERN', 'FIRE_FLY', 'WIND_SPIRIT'].includes(obs.type)) {
                if (!obs.baseY) obs.baseY = obs.y;
                obs.y = obs.baseY + Math.sin(frameCount.current * (obs.type === 'FIRE_FLY' ? .09 : .035) + (obs.phase || 0)) * (obs.type === 'WIND_SPIRIT' ? 28 : 16);
            } else if (obs.vy === 0 && !['BIRD', 'DRONE', 'CLOCK_GHOST', 'HOLE'].includes(obs.type)) obs.y = obsFloor - obs.height / 2;

            // 特殊挙動: ジャンプ
            if ((obs.type === 'JUMPING_SLIME' || obs.type === 'WATER_SLIME') && obs.y >= obsFloor - 20 && obs.x < 500 && randomRef.current() < 0.05) {
                obs.vy = -12;
            }
            if (obs.type !== 'ELEVATOR' && (obs.type === 'JUMPING_SLIME' || obs.type === 'WATER_SLIME' || obs.vy !== 0)) {
                obs.vy += 0.5; // 敵用重力
                obs.y += obs.vy;
                if (obs.y > obsFloor - 20) {
                    obs.y = obsFloor - 20;
                    obs.vy = 0;
                    addParticle(obs.x, GROUND_Y, '#8d6e63');
                }
            }

            // 特殊挙動: 射撃
            if (['DRONE', 'TEACHER_RUNNER', 'LAB_BOTTLE', 'BASKETBALL_TURRET', 'CLOCK_GHOST', 'HALL_MONITOR', 'FIRE_FLY', 'WIND_SPIRIT'].includes(obs.type)) {
                obs.shootCooldown = (obs.shootCooldown || 0) - 1;
                if (obs.shootCooldown <= 0) {
                    const dx = p.x - obs.x;
                    const dy = (p.y - 24) - obs.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    let projectile: Projectile = {
                        id: randomRef.current().toString(),
                        x: obs.x - obs.width / 2,
                        y: obs.y,
                        vx: -8,
                        vy: 0,
                        isEnemy: true,
                        spriteKey: 'CHALK',
                        radius: 7
                    };
                    if (obs.type === 'FIRE_FLY') {
                        projectile = { ...projectile, vx: -5.2, vy: 0, spriteKey: 'LASER', radius: 7 };
                    } else if (obs.type === 'WIND_SPIRIT') {
                        projectile = { ...projectile, vx: -3.8, vy: Math.max(-1.8, Math.min(1.8, dy / dist * 2)), spriteKey: 'ALARM', radius: 9 };
                    } else if (obs.type === 'TEACHER_RUNNER') {
                        projectile = { ...projectile, vx: -6.2, vy: -1.2, spriteKey: randomRef.current() < 0.5 ? 'BOOK' : 'ERASER', radius: 9 };
                    } else if (obs.type === 'LAB_BOTTLE') {
                        projectile = { ...projectile, vx: -4.8, vy: -4.2, gravity: 0.16, spriteKey: 'CHEMICAL', radius: 10 };
                    } else if (obs.type === 'BASKETBALL_TURRET') {
                        projectile = { ...projectile, vx: -5.5, vy: -6.4, gravity: 0.22, spriteKey: 'BASKETBALL', radius: 12, isLarge: true };
                    } else if (obs.type === 'CLOCK_GHOST') {
                        projectile = { ...projectile, vx: (dx / dist) * 3.4, vy: (dy / dist) * 3.4, spriteKey: 'ALARM', radius: 11, isLarge: true };
                    } else if (obs.type === 'HALL_MONITOR') {
                        projectile = { ...projectile, vx: -7.3, vy: Math.sin(frameCount.current * 0.15) * 1.6, spriteKey: 'WHISTLE', radius: 8 };
                    }
                    enemyProjectilesRef.current.push({
                        ...projectile
                    });
                    const baseCooldown = obs.type === 'BASKETBALL_TURRET' ? 150 : obs.type === 'CLOCK_GHOST' ? 135 : obs.type === 'LAB_BOTTLE' ? 125 : obs.type === 'HALL_MONITOR' ? 95 : 110;
                    obs.shootCooldown = baseCooldown - Math.min(70, levelRef.current * 5);
                    audioService.playSound('attack');
                }
            }
            
            if (p.stompAbility && p.vy > 0 && isDestroyable(obs.type) && obs.type !== 'HOLE') {
                const dx = p.x - obs.x;
                const dy = obs.y - p.y;
                if (Math.abs(dx) < 40 && dy > 0 && dy < 40) {
                    p.vy = JUMP_FORCE * 0.7; 
                    obstacles.splice(i, 1);
                    audioService.playSound('attack');
                    scoreRef.current += 100;
                    addVfxRing(obs.x, obs.y, '#ffffff');
                    continue;
                }
            }

            if(p.dashFrames>0&&isDestroyable(obs.type)&&Math.abs(p.x-obs.x)<60&&Math.abs(p.y-30-obs.y)<65){
                obstacles.splice(i,1);arcade.score+=80;arcade.stats.breaks++;announce(arcade,'smash');addVfxRing(obs.x,obs.y,'#ffdf9b');continue;
            }
            if (obs.type !== 'HOLE' && !['STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS', 'ELEVATOR', 'SPRING'].includes(obs.type)) {
                const pdx = p.x - obs.x; const pdy = (p.y - (arcade.slide>0?13:30)) - obs.y;
                if (Math.sqrt(pdx * pdx + pdy * pdy) < (arcade.slide>0?23:35) && p.invulFrame <= 0) { handlePlayerDamage(false, i); continue; }
            }

            for (let j = projs.length - 1; j >= 0; j--) {
                const proj = projs[j]; const rdx = proj.x - obs.x; const rdy = proj.y - obs.y;
                const hitDist = proj.isLarge ? 50 : 35;
                if (Math.sqrt(rdx * rdx + rdy * rdy) < hitDist) {
                    if (!isDestroyable(obs.type)) {
                        projs.splice(j, 1); 
                        addParticle(proj.x, proj.y, '#94a3b8'); 
                    } 
                    else if (obs.type !== 'HOLE') {
                        if (!proj.isPierce) projs.splice(j, 1);
                        obstacles.splice(i, 1); audioService.playSound('attack');
                        scoreRef.current += 50; addParticle(obs.x, obs.y, '#ffeb3b');
                        if (p.lifesteal && randomRef.current() < 0.1) setHp(h => Math.min(maxHpRef.current, h + 1));
                    }
                    break;
                }
            }
            if (obs.x < -400) obstacles.splice(i, 1);
        }

        if(gameStateRef.current!=='PLAYING')return;
        const oldCoins=arcade.stats.coins,oldNotice=arcade.notice,oldNoticeTime=arcade.noticeTime;
        const arcadeDamage=endArcade(arcade,p,distanceRef.current);
        if(arcade.score){scoreRef.current+=arcade.score;arcade.score=0;}
        if(arcade.stats.coins>oldCoins&&arcade.frame%6===0)audioService.playSound('select');
        if(arcade.noticeTime>oldNoticeTime||arcade.notice!==oldNotice){
            if(['star','mission','fever','bossWin'].includes(arcade.notice))audioService.playSound('correct');
            else if(['magnet','shield','double','sneakers','board','rocket','gravity','wave','lowGravity','charge'].includes(arcade.notice))audioService.playSound('buff');
            else if(['smash','bossHit'].includes(arcade.notice))audioService.playSound('attack');
        }
        if(arcadeDamage)handlePlayerDamage(false);
        if(gameStateRef.current!=='PLAYING')return;
        if(arcade.changedVehicle){obstaclesRef.current=[];enemyProjectilesRef.current=[];p.invulFrame=Math.max(p.invulFrame,45);}
        if(arcade.runMode==='practice'){
            const checkpointDistance=Math.floor(distanceRef.current/ROUTE_LENGTH)*ROUTE_LENGTH;
            if(checkpointDistance>0&&checkpointDistance>(checkpointRef.current?.distance??0)){
                checkpointRef.current={distance:checkpointDistance,seed:routeSeedRef.current,level:levelRef.current,score:scoreRef.current};announce(arcade,'checkpoint');
            }
        }
        const addExp = 0.1 * (currentSpeed / BASE_SPEED) * p.expMult;
        expRef.current += addExp;
        if (expRef.current >= nextLevelExpRef.current) {
            levelRef.current++; expRef.current = 0; nextLevelExpRef.current += 100;
            const hasWeapon = p.shootingRate > 0;
            const availableUpgrades = UPGRADE_POOL.filter(card => {
                if (card.requiresWeapon && !hasWeapon) return false;
                return true;
            });
            const shuffled = [...availableUpgrades].sort(() => randomRef.current() - 0.5);
            setUpgradeOptions(shuffled.slice(0, 3)); 
            stopInputs(); audioService.stopHomeDashVoices();
            gameStateRef.current = 'CHALLENGE';
            setGameState('CHALLENGE'); 
            audioService.playBGM('math');
        }
        scoreRef.current += (currentSpeed * 0.1 * p.scoreBonus);
        if (frameCount.current % 10 === 0) { setArcadeView({...arcade,stats:{...arcade.stats},missionDone:[...arcade.missionDone]}); setTravelled(Math.floor(distanceRef.current / DISTANCE_SCALE)); setRoute(stage.id); setFlight(p.flying); setDashReady(p.dashCooldown === 0); setScore(Math.floor(scoreRef.current)); setExp(expRef.current); setLevel(levelRef.current); setNextLevelExp(nextLevelExpRef.current); }
    };

    const setGameOverState = () => {
        if (gameStateRef.current === 'GAME_OVER') return;
        const finalScore = Math.floor(scoreRef.current);
        const finalLevel = levelRef.current;
        const finalRunMode = runModeRef.current;
        const finalDistance = Math.floor(distanceRef.current / DISTANCE_SCALE);
        setTravelled(finalDistance);
        if(!savedRunRef.current){saveArcadeRun(arcadeRef.current,finalScore);savedRunRef.current=true;profileRef.current=loadArcadeProfile();}
        setArcadeView({...arcadeRef.current,stats:{...arcadeRef.current.stats}});
        stopInputs(); audioService.stopHomeDashVoices(); voice('defeat');
        gameStateRef.current = 'GAME_OVER';
        flushSync(() => {
            setScore(finalScore);
            setGameState('GAME_OVER');
        });
        window.setTimeout(() => {
            audioService.playSound('lose');
            if(finalRunMode!=='practice')storageService.saveGoHomeScore({
                id: `gohome-${Date.now()}`,
                date: Date.now(),
                score: finalScore,
                level: finalLevel,
                distance: finalDistance
            });
        }, 0);
    };

    const handleChallengeComplete = (correctCount: number) => {
        if (correctCount >= 3) {
            setHp(h => Math.min(maxHpRef.current, h + 1));
            audioService.playSound('buff');
        }
        gameStateRef.current = 'LEVEL_UP';
        setGameState('LEVEL_UP');
        audioService.playSound('win');
    };

    const handlePlayerDamage = (isFall: boolean, obsIdx?: number) => {
        if (gameStateRef.current !== 'PLAYING') return;
        const p = playerRef.current;
        if (isFall) obstaclesRef.current = obstaclesRef.current.filter(o => o.type !== 'HOLE' || Math.abs(o.x - p.x) > o.width / 2 + 30);
        if(hitArcade(arcadeRef.current)){
            p.invulFrame=90;
            if(isFall){p.y=floorAt(routeSeedRef.current,distanceRef.current+p.x);p.vy=-10;p.isFalling=false;}
            if(obsIdx!==undefined)obstaclesRef.current.splice(obsIdx,1);audioService.playSound('block');return;
        }
        if (p.barrier) {
            p.barrier = false;
            p.invulFrame = 45;
            if (isFall) { p.y = floorAt(routeSeedRef.current, distanceRef.current + p.x); p.vy = -10; p.isFalling = false; }
            else if (obsIdx !== undefined) obstaclesRef.current.splice(obsIdx, 1);
            if (p.reflectShield) {
                addVfxRing(p.x, p.y, '#00ffff');
                obstaclesRef.current = obstaclesRef.current.filter(o => Math.abs(o.x - p.x) > 200);
            }
            audioService.playSound('block'); return;
        }
        const nextHp = Math.max(0, hpRef.current - 1);
        hpRef.current = nextHp;
        setHp(nextHp);
        if (nextHp <= 0) {
            setGameOverState();
            return;
        }
        voice('damage');
        p.invulFrame = 60; audioService.playSound('damage'); triggerShake();
        if (isFall) { p.y = floorAt(routeSeedRef.current, distanceRef.current + p.x); p.vy = 0; p.isFalling = false; }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        if (shakeRef.current > 0 && !reducedMotionRef.current) {
            ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
            shakeRef.current *= 0.9;
        }

        const obstacles = obstaclesRef.current;
        const holes = obstacles.filter(o => o.type === 'HOLE');

        drawRoute(ctx, routeSeedRef.current, distanceRef.current, frameCount.current, routeArtRef.current);
        drawTerrain(ctx, routeSeedRef.current, distanceRef.current, holes);
        drawArcade(ctx,arcadeRef.current,distanceRef.current,reducedMotionRef.current);
        holes.forEach(hole => { ctx.fillStyle = '#ffcc80'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', hole.x, floorAt(routeSeedRef.current, distanceRef.current + hole.x) + 30); });

        const parts = particlesRef.current;
        for (const p of parts) { ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 30; ctx.fillRect(p.x, p.y, p.size, p.size); }
        ctx.globalAlpha = 1.0;

        const projectileSheet = projectileSpriteSheetRef.current;
        const projs = projectilesRef.current;
        for (const proj of projs) {
            const sz = proj.isLarge ? 24 : 14;
            const drew = drawSpriteCell(ctx, projectileSheet, PROJECTILE_SPRITE_CELLS[proj.spriteKey || 'PLAYER_PENCIL'], proj.x - sz / 2, proj.y - sz / 2, sz, sz);
            if (!drew) {
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(proj.x, proj.y, sz * 1.4, sz * 0.5);
            }
        }
        
        // 敵の弾の描画
        const enemyProjs = enemyProjectilesRef.current;
        for (const ep of enemyProjs) {
            const sz = ep.isLarge ? 28 : 20;
            const drew = drawSpriteCell(ctx, projectileSheet, PROJECTILE_SPRITE_CELLS[ep.spriteKey || 'CHALK'], ep.x - sz / 2, ep.y - sz / 2, sz, sz);
            if (!drew) {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(ep.x, ep.y, ep.radius || 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.stroke();
            }
        }

        for (const obs of obstacles) {
            if (obs.type === 'HOLE') continue;
            if (obs.type === 'FLIGHT_GATE') {
                for (const rect of flightGateRects(obs.x, obs.width, obs.y)) {
                    ctx.fillStyle = '#273859'; ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                    ctx.strokeStyle = '#a7f3ff'; ctx.lineWidth = 3; ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                    ctx.fillStyle = '#5a8ba0';
                    for (let y = rect.top + 12; y < rect.top + rect.height - 8; y += 22) ctx.fillRect(rect.left + 10, y, rect.width - 20, 5);
                }
                continue;
            }
            if (obs.type === 'ELEVATOR' || obs.type === 'SPRING') {
                const color = obs.type === 'SPRING' ? '#c9ff8a' : '#ffc77b';
                ctx.fillStyle = '#1d3549'; ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
                ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
                ctx.fillStyle = color; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.fillText(obs.type === 'SPRING' ? '↑↑' : '↕', obs.x, obs.y - 12);
                continue;
            }
            const extraIndex = ['PAPER_WYVERN', 'WATER_SLIME', 'FIRE_FLY', 'WIND_SPIRIT'].indexOf(obs.type);
            const extraSheet = extraEnemiesRef.current;
            if (extraIndex >= 0 && extraSheet?.complete && extraSheet.naturalWidth > 0) {
                const w = extraSheet.naturalWidth / 4, h = extraSheet.naturalHeight / 2;
                ctx.drawImage(extraSheet, extraIndex * w, (Math.floor(frameCount.current / 15) % 2) * h, w, h, obs.x - 33, obs.y - 33, 66, 66);
                continue;
            }
            if (obs.type === 'STEPS' || obs.type === 'HIGH_STEPS' || obs.type === 'MOUNTAIN_STEPS') {
                ctx.fillStyle = '#8d6e63'; ctx.strokeStyle = '#2d1b0e'; ctx.lineWidth = 3;
                for (const rect of stairRects(obs, floorAt(routeSeedRef.current, distanceRef.current + obs.x))) {
                    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                    ctx.fillStyle = '#ffcf92'; ctx.fillRect(rect.left, rect.top, rect.width, 3); ctx.fillStyle = '#8d6e63';
                }
            } else if (obs.type === 'IRON_BARRIER') {
                ctx.shadowBlur = 10; ctx.shadowColor = "#00ffff";
                const drew = drawSpriteCell(ctx, enemySpriteSheetRef.current, ENEMY_SPRITE_CELLS[obs.type], obs.x - obs.width / 2, GROUND_Y - obs.height, obs.width, obs.height);
                if (!drew) {
                    ctx.fillStyle = '#e2e8f0';
                    ctx.fillRect(obs.x - obs.width/2, GROUND_Y - obs.height, obs.width, obs.height);
                }
                ctx.shadowBlur = 0;
            } else {
                const drew = drawSpriteCell(
                    ctx,
                    enemySpriteSheetRef.current,
                    ENEMY_SPRITE_CELLS[obs.type],
                    obs.x - obs.width / 2,
                    obs.y - obs.height / 2,
                    obs.width,
                    obs.height,
                    obs.type === 'TEACHER_RUNNER' || obs.type === 'HALL_MONITOR'
                );
                if (drew) continue;
                const spriteMap: any = { 
                    BACKPACK: 'BACKPACK', 
                    VAULTING: 'VAULTING', 
                    CHALKBOARD: 'NOTEBOOK', 
                    BIRD: 'BAT',
                    JUMPING_SLIME: 'SLIME',
                    DRONE: 'ROBOT',
                    TEACHER_RUNNER: 'TEACHER',
                    HALL_MONITOR: 'TEACHER',
                    CURRICULUM_BOOK: 'NOTEBOOK',
                    LAB_BOTTLE: 'POTION',
                    BASKETBALL_TURRET: 'ROBOT',
                    CLOCK_GHOST: 'GHOST',
                    SHOE_ROLLER: 'SLIME'
                };
                const size = 40; const pixelSize = size / 16;
                const template = SPRITE_TEMPLATES[spriteMap[obs.type] || 'SLIME'] || SPRITE_TEMPLATES.SLIME;
                for (let row = 0; row < 16; row++) { 
                    for (let col = 0; col < 16; col++) { 
                        const char = template[row][col]; if (char === '.') continue; 
                        let color = obs.isHard ? '#cbd5e1' : '#ef4444';
                        if (obs.type === 'JUMPING_SLIME') color = '#22c55e';
                        if (obs.type === 'DRONE') color = '#3b82f6';
                        if (obs.type === 'TEACHER_RUNNER') color = '#dc2626';

                        ctx.fillStyle = char === '%' ? "#ffffff" : (char === '@' ? '#000000' : color); 
                        ctx.fillRect(obs.x - 20 + col * pixelSize, obs.y - 20 + row * pixelSize, pixelSize + 0.5, pixelSize + 0.5); 
                    } 
                }
            }
        }

        const pl = playerRef.current;
        drawArcadeRunner(ctx,arcadeRef.current,pl,trailColor(profileRef.current));
        ctx.save();
        if(arcadeRef.current.vehicle==='gravity'&&arcadeRef.current.gravity<0){ctx.translate(0,2*pl.y-64);ctx.scale(1,-1);}
        if(arcadeRef.current.slide>0&&!pl.flying){ctx.translate(pl.x,pl.y);ctx.scale(1.18,.42);ctx.translate(-pl.x,-pl.y);}
        if (pl.invulFrame % 4 < 2 || arcadeRef.current.fever>0 || pl.dashFrames>0) drawRunner(ctx, playerSpriteRef.current, heroFallbackRef.current, {...pl,flying:pl.flying&&arcadeRef.current.vehicle==='normal'}, frameCount.current);
        ctx.restore();
        ctx.restore();
        if (focusCanvasRef.current && window.innerWidth <= 700 && window.innerHeight >= 700) {
            const focus = focusCanvasRef.current.getContext('2d');
            focus?.drawImage(ctx.canvas, 0, 0, 400, 400, 0, 0, 400, 400);
        }
    };

    useEffect(() => {
        const fixedStep = 1000 / 60; 
        let lastTime = performance.now();
        let accumulator = 0;

        const loop = (currentTime: number) => {
            if (gameStateRef.current === 'PLAYING') {
                const deltaTime = currentTime - lastTime;
                lastTime = currentTime;
                accumulator += Math.min(deltaTime, 100);
                while (accumulator >= fixedStep) {
                    updateLogic();
                    accumulator -= fixedStep;
                }
            } else {
                lastTime = currentTime;
                accumulator = 0;
            }

            if (gameStateRef.current !== 'GAME_OVER' && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) draw(ctx);
            }
            frameIdRef.current = requestAnimationFrame(loop);
        };
        
        frameIdRef.current = requestAnimationFrame(loop);
        return () => { if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current); };
    }, []);

    const getSubjectIcon = (type: DashCardEffect['iconType']) => {
        switch(type) {
            case 'MATH': return <Brain className="text-emerald-400" />;
            case 'SCIENCE': return <Flame className="text-orange-400" />;
            case 'JAPANESE': return <Book className="text-blue-400" />;
            case 'PE': return <Wind className="text-cyan-400" />;
            case 'SOCIAL': return <Target className="text-yellow-400" />;
        }
    };

    const backdrop = routeTransition(routeSeedRef.current, distanceRef.current + 120);
    return (
        <div className={`mini-game-go-home-screen dash-shell w-full h-full text-white font-mono relative overflow-hidden select-none${compact ? ' rpg-go-home-compact' : ''}`}
            style={{
                '--dash-backdrop': `url("${assetUrl(`sprites/go-home-dash/${gameState === 'START' ? 'title' : `routes/${backdrop.to}`}.webp`)}")`,
                '--dash-backdrop-prev': `url("${assetUrl(`sprites/go-home-dash/${gameState === 'START' ? 'title' : `routes/${backdrop.from}`}.webp`)}")`,
                '--dash-backdrop-opacity': gameState === 'START' ? 1 : backdrop.mix,
            } as React.CSSProperties}
            data-gamepad-go-home-live={gameState === 'PLAYING' && !paused ? 'true' : undefined}>
            <div className="go-home-hud pointer-events-none">
                <div className="go-home-hud-left"><div className="flex gap-1">{Array.from({length: Math.min(12, maxHp)}, (_, i) => <Heart key={i} className={i < hp ? 'text-red-400 fill-current' : 'text-slate-700'} />)}</div>
                    <div className="dash-rank">RANK {level}<i><b style={{width: `${exp / nextLevelExp * 100}%`}} /></i></div>
                </div>
                <div className="go-home-distance"><div className="text-3xl font-black italic">{travelled.toLocaleString()}</div><small>DISTANCE</small></div>
            </div>
            {gameState==='PLAYING'&&<ArcadeHud state={arcadeView} languageMode={languageMode} paused={paused} onPause={togglePause}/>}
            <div className="dash-stage touch-none" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onLostPointerCapture={handlePointerUp}>
                <canvas className="dash-overview" ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} aria-label={L('帰宅ダッシュのコース', 'Home Dash course', 'きたくダッシュのコース')} />
                <canvas className="dash-focus" ref={focusCanvasRef} width={400} height={400} aria-hidden="true" />
            </div>
            {gameState === 'PLAYING' && <>
                <div className="dash-route" aria-live="polite"><strong>{flight ? '✦ ' : '→ '}{routeCopy(route, languageMode)}</strong><small>{routeCopy(route, languageMode, true)}</small></div>
                <div className="dash-controls">
                    <button className="dash-boost" {...multiTouchAction(triggerDash)} disabled={!dashReady}><small>SHIFT / X</small>{dashReady ? L('ダッシュ', 'DASH', 'ダッシュ') : L('チャージ中', 'CHARGING', 'チャージちゅう')}</button>
                    <button className="dash-slide" disabled={flight} {...multiTouchAction(triggerSlide)}><small>↓ / S / B</small>{L('スライド','SLIDE','スライド')}</button>
                    <button className="dash-jump" {...multiTouchHold(held => { const wasHeld = jumpButtonHeld.current; jumpButtonHeld.current = held; refreshPressing(); if (held && !wasHeld) triggerJump(); })}
                        onClick={e => { if (e.detail === 0) triggerJump(); }}><small>SPACE / A · HOLD</small>{arcadeView.vehicle==='gravity'?L('重力反転','FLIP','じゅうりょくはんてん'):arcadeView.vehicle==='wave'?L('ウェーブ','WAVE','ウェーブ'):arcadeView.vehicle==='rocket'?L('上昇','RISE','じょうしょう'):flight ? L('羽ばたき', 'FLAP', 'はばたき') : L('ジャンプ', 'JUMP', 'ジャンプ')}</button>
                </div>
            </>}
            {gameState === 'START' && <DashLobby hero={selectedHero} onHero={setSelectedHero} onStart={() => { initGame(); audioService.playSound('select'); }} onBack={onBack} languageMode={languageMode} runMode={runMode} onRunMode={selectRunMode} profile={profileRef.current} oneHit={initialHp === 1 && initialMaxHp === 1} exitEnabled={exitEnabled} />}

            {paused&&gameState==='PLAYING'&&<div className="dash-pause-overlay" data-gamepad-modal data-gamepad-initial-scope="dash-paused">
                <h2>{L('ひと休み','PAUSED','ひとやすみ')}</h2><button data-gamepad-initial-choice onClick={togglePause}>{L('走り続ける','RESUME RUN','はしりつづける')}</button><button onClick={returnToTitle}>{L('タイトルへ','Back to title','タイトルへ')}</button>
            </div>}
            {gameState === 'CHALLENGE' && (
                <div className="absolute inset-0 z-[100] w-full h-full pointer-events-auto">
                    <MiniGameProblemChallenge mode={problemMode} modePool={problemModePool} answerMode={answerMode} assignment={assignment} onAnswerResult={onAnswerResult} onComplete={handleChallengeComplete} isChallenge={false} streak={0} rewardHint={t('全問正解でHP+1')} languageMode={languageMode} />
                </div>
            )}

            {gameState === 'LEVEL_UP' && (
                <div data-gamepad-modal data-gamepad-initial-scope={`go-home-level-up-${level}`} className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-indigo-950/95 p-4 backdrop-blur-md animate-in fade-in" onPointerDown={e => e.stopPropagation()}>
                    <div className="flex items-center gap-4 mb-10 animate-bounce"><Star size={40} className="text-yellow-400 fill-current" /><h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Grade Up!</h2><Star size={40} className="text-yellow-400 fill-current" /></div>
                    <div className="grid grid-cols-1 gap-4 w-full max-sm overflow-y-auto max-h-[60vh] p-2 custom-scrollbar" data-gamepad-navigation-root>
                        {upgradeOptions.map((card, index) => (
                            <div key={card.id} data-gamepad-initial-choice={index === 0 ? true : undefined} data-gamepad-zone="go-home-upgrades" data-gamepad-order={index} role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); selectUpgrade(card); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectUpgrade(card); } }} className="bg-slate-800 border-2 border-slate-600 rounded-3xl p-4 flex items-center text-left transition-all transform hover:scale-102 hover:border-yellow-400 shadow-xl group">
                                <div className="p-3 bg-black/40 rounded-2xl mr-4 border border-slate-700 group-hover:border-yellow-500/50">{getSubjectIcon(card.iconType)}</div>
                                <div className="flex-grow"><h3 className="text-lg font-black text-white leading-tight">{t(card.name)}</h3><p className="text-[10px] text-slate-400 font-bold leading-tight mt-1">{t(card.description)}</p></div>
                                <ChevronRight size={20} className="text-slate-600 group-hover:text-yellow-400 transition-colors ml-2"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {gameState === 'GAME_OVER' && (
                <div data-gamepad-modal data-gamepad-initial-scope="go-home-game-over" className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-red-950/98 animate-in fade-in backdrop-blur-lg" onPointerDown={e => e.stopPropagation()}>
                    <Skull size={80} className="text-red-600 mb-6 animate-pulse" /><h2 className="text-7xl font-black text-white mb-2 italic tracking-tighter uppercase">Failed</h2><div className="text-2xl text-yellow-400 mb-12 font-black bg-black/60 px-8 py-3 rounded-full border-2 border-yellow-500/50 italic shadow-xl">DISTANCE: {travelled.toLocaleString()}m</div>
                    <div className="dash-run-summary">◉ {arcadeView.stats.coins} · ✦ {arcadeView.stats.stars} · {arcadeView.bestCombo} COMBO · {arcadeView.stats.missions}/3 MISSIONS<br/>SCORE {score.toLocaleString()}{runMode==='practice'&&<small>{L('練習・記録対象外','PRACTICE · NOT RANKED','れんしゅう・きろくたいしょうがい')}</small>}</div>
                    <div className="flex flex-col gap-4 w-64">
                        <button data-gamepad-initial-choice onClick={(e) => { e.stopPropagation(); initGame(); audioService.playSound('select'); }} className="w-full bg-white text-black py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_#ccc] hover:bg-slate-200 transition-all active:translate-y-1 active:shadow-none">TRY AGAIN</button>
                        <button className="dash-result-change" onClick={returnToTitle}>{L('主人公を選び直す', 'Choose another runner', 'しゅじんこうをえらびなおす')}</button>
                        {exitEnabled && <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-xl border-2 border-white/10 hover:bg-slate-700 transition-colors">EXIT</button>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoHomeDash;
