
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { ArrowLeft, RotateCcw, Sparkles, Zap, Wind, Pause, Play } from 'lucide-react';
import SurvivorBurstCutin, { BURST_CUTIN_FRAMES, preloadSurvivorBurst } from '../mini-games/schoolyard-survivor/SurvivorBurstCutin';
import SurvivorLobby, { HeroPortrait } from '../mini-games/schoolyard-survivor/SurvivorLobby';
import { HEROES, FIELDS, SCENERY_KEYS, FX_KEYS, localize, createObstacles, createFieldCanvas, moveActor, spawnPoint, type SurvivorHero, type Field } from '../mini-games/schoolyard-survivor/world';
import '../mini-games/schoolyard-survivor/survivor.css';
import PixelSprite, { SPRITE_TEMPLATES, createPixelSpriteCanvas } from './PixelSprite';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, LanguageMode, MiniGameDebugPreview } from '../types';
import MiniGameProblemChallenge from './MiniGameProblemChallenge';
import { assetUrl } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';

// --- GAME CONSTANTS ---
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const PLAYER_SPEED = 4;
const BASE_XP_REQUIREMENT = 10;
const ZOOM_SCALE = 1.25;
const FIXED_STEP_MS = 1000 / 60;

// --- TYPES ---
type WeaponType = 
    'PENCIL' | 'ERASER' | 'RULER' | 'HIGHLIGHTER' | 'FLASK' | 'RECORDER' | 
    'SOCCER' | 'UWABAKI' | 'CURRY' | 'COMPASS' | 'MOP' | 'MAGNIFIER' |
    'STAPLER' | 'CUTTER' | 'ART_BRUSH' | 'GLOBE' | 'PROTRACTOR_SWING' | 'CHALK_SMOKE' |
    'SCISSORS' | 'TAPE' | 'DICTIONARY' | 'PAPER_PLANE_S' | 'GLUE_STICK' | 'HAND_BELL' | 
    'COMPASS_SPIKE' | 'WHISTLE_S' | 'MAGNET_U' | 'TRIANGLE_RULER_S' | 'STAPLE_REMOVER' | 'JUMP_ROPE' |
    'PRISM' | 'TROWEL' | 'LUNCH_TRAY' | 'BASKETBALL' | 'DUSTER' | 'FOUNTAIN_PEN' | 
    'SCHOOL_CHIME' | 'TRUMPET' | 'CLAY' | 'BROADCAST_MIC';

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
    animType: 'PROJECTILE' | 'SWING' | 'STAY' | 'BEAM' | 'BLAST' | 'STAB' | 'CIRCLE' | 'SPLATTER' | 'RAINBOW';
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
        sprite: { template: 'SWORD', color: '#fbbf24', highlight: '#fcd34d' },
        animType: 'PROJECTILE'
    },
    ERASER: { 
        id: 'ERASER', name: '消しゴムシールド', desc: '周囲を回転', 
        evolvedName: '修正液バリア', evolvedDesc: '触れた敵を消滅', synergy: 'PAD',
        sprite: { template: 'SHIELD', color: '#f3f4f6', highlight: '#ffffff' },
        animType: 'STAY'
    },
    RULER: { 
        id: 'RULER', name: '30cm定規', desc: '手元からのなぎ払い', 
        evolvedName: '三角定規ブーメラン', evolvedDesc: '全方位への衝撃波', synergy: 'PROTRACTOR',
        sprite: { template: 'SWORD', color: '#22c55e', highlight: '#86efac' },
        animType: 'SWING'
    },
    HIGHLIGHTER: { 
        id: 'HIGHLIGHTER', name: '蛍光ペン', desc: '直線ビーム', 
        evolvedName: 'レーザーポインター', evolvedDesc: '天からの極太レーザー', synergy: 'TEXTBOOK',
        sprite: { template: 'SWORD', color: '#f0abfc', highlight: '#fae8ff' },
        animType: 'BEAM'
    },
    FLASK: { 
        id: 'FLASK', name: '理科室のフラスコ', desc: '爆発する瓶を投げる', 
        evolvedName: '実験失敗', evolvedDesc: '毒の霧を撒き散らす', synergy: 'MAGNET',
        sprite: { template: 'POTION', color: '#3b82f6', highlight: '#93c5fd' },
        animType: 'PROJECTILE'
    },
    RECORDER: { 
        id: 'RECORDER', name: 'リコーダー', desc: '音波で押し返す', 
        evolvedName: '校内放送(メタル)', evolvedDesc: '画面全体攻撃＆スタン', synergy: 'DRILL',
        sprite: { template: 'SWORD', color: '#fca5a5', highlight: '#ffe4e6' },
        animType: 'BLAST'
    },
    SOCCER: { 
        id: 'SOCCER', name: 'サッカーボール', desc: '跳ね返るボール', 
        evolvedName: 'ドッジボールの神', evolvedDesc: '超高速乱反射', synergy: 'SHOES',
        sprite: { template: 'SLIME', color: '#ffffff', highlight: '#d1d5db' },
        animType: 'PROJECTILE'
    },
    UWABAKI: { 
        id: 'UWABAKI', name: '上履きミサイル', desc: '強敵を追尾', 
        evolvedName: 'ドローン配送', evolvedDesc: '編隊爆撃', synergy: 'CONSOLE',
        sprite: { template: 'SHOE', color: '#ef4444', highlight: '#fca5a5' },
        animType: 'PROJECTILE'
    },
    CURRY: { 
        id: 'CURRY', name: '給食のカレー', desc: 'ダメージ床生成', 
        evolvedName: '激辛麻婆豆腐', evolvedDesc: 'マグマ地帯を生成', synergy: 'MILK',
        sprite: { template: 'SLIME', color: '#d97706', highlight: '#fbbf24' },
        animType: 'STAY'
    },
    COMPASS: { 
        id: 'COMPASS', name: 'コンパス針', desc: '進行方向へ突き', 
        evolvedName: 'ドリルスパイラル', evolvedDesc: '無敵突進', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#94a3b8', highlight: '#cbd5e1' },
        animType: 'PROJECTILE'
    },
    MOP: { 
        id: 'MOP', name: '掃除モップ', desc: '広範囲なぎ払い', 
        evolvedName: '聖なるハタキ', evolvedDesc: '弾消し＆衝撃波', synergy: 'ORIGAMI',
        sprite: { template: 'PLANT', color: '#a8a29e', highlight: '#e7e5e4' },
        animType: 'SWING'
    },
    MAGNIFIER: { 
        id: 'MAGNIFIER', name: '虫眼鏡', desc: '定点照射攻撃', 
        evolvedName: '天体望遠鏡', evolvedDesc: '巨大な光の柱', synergy: 'ABACUS',
        sprite: { template: 'EYE', color: '#60a5fa', highlight: '#bfdbfe' },
        animType: 'BEAM'
    },
    STAPLER: { 
        id: 'STAPLER', name: 'ホッチキス', desc: '正面に針を連射', 
        evolvedName: '全自動製本機', evolvedDesc: '全方位に針を連射', synergy: 'DRILL',
        sprite: { template: 'ROBOT', color: '#4b5563', highlight: '#cbd5e1' },
        animType: 'PROJECTILE'
    },
    CUTTER: { 
        id: 'CUTTER', name: 'カッターナイフ', desc: '超近距離の鋭い一撃', 
        evolvedName: '断罪の刃', evolvedDesc: '画面を切り裂く絶技', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#334155', highlight: '#94a3b8' },
        animType: 'SWING'
    },
    ART_BRUSH: { 
        id: 'ART_BRUSH', name: '美術の筆', desc: '色鮮やかな絵の具を撒く', 
        evolvedName: '巨匠のキャンバス', evolvedDesc: '色彩の暴力', synergy: 'ORIGAMI',
        sprite: { template: 'PLANT', color: '#f43f5e', highlight: '#fb7185' },
        animType: 'STAY'
    },
    GLOBE: { 
        id: 'GLOBE', name: '地球儀', desc: '公転して敵を弾く', 
        evolvedName: 'ブラックホール', evolvedDesc: '敵を吸い寄せ消滅させる', synergy: 'MAGNET',
        sprite: { template: 'SLIME', color: '#0369a1', highlight: '#38bdf8' },
        animType: 'STAY'
    },
    PROTRACTOR_SWING: { 
        id: 'PROTRACTOR_SWING', name: '分度器', desc: '完璧な角度で薙ぎ払う', 
        evolvedName: '黄金比の円舞', evolvedDesc: '全方位を完璧に防御', synergy: 'PROTRACTOR',
        sprite: { template: 'SHIELD', color: '#d946ef', highlight: '#f5d0fe' },
        animType: 'SWING'
    },
    CHALK_SMOKE: { 
        id: 'CHALK_SMOKE', name: 'チョークの粉', desc: '敵を混乱させる煙', 
        evolvedName: 'ホワイトアウト', evolvedDesc: '画面上の敵を停止させる', synergy: 'TEXTBOOK',
        sprite: { template: 'SLIME', color: '#f8fafc', highlight: '#ffffff' },
        animType: 'STAY'
    },
    SCISSORS: { 
        id: 'SCISSORS', name: 'ハサミ', desc: '二本の刃で切り裂く', 
        evolvedName: '神の裁断', evolvedDesc: '敵を二分する', synergy: 'PAD',
        sprite: { template: 'SWORD', color: '#475569', highlight: '#f1f5f9' },
        animType: 'SWING'
    },
    TAPE: { 
        id: 'TAPE', name: 'セロハンテープ', desc: '敵の動きを封じる', 
        evolvedName: '蜘蛛の巣の牢獄', evolvedDesc: '広範囲の敵を完全拘束', synergy: 'LUNCHBOX',
        sprite: { template: 'SLIME', color: '#e2e8f0', highlight: '#f8fafc' },
        animType: 'PROJECTILE'
    },
    DICTIONARY: { 
        id: 'DICTIONARY', name: '分厚い辞書', desc: '重い辞書を投げつける', 
        evolvedName: '百科事典プレス', evolvedDesc: '巨大な本が敵を圧殺', synergy: 'PAD',
        sprite: { template: 'NOTEBOOK', color: '#7c2d12', highlight: '#9a3412' },
        animType: 'PROJECTILE'
    },
    PAPER_PLANE_S: { 
        id: 'PAPER_PLANE_S', name: '紙飛行機', desc: 'ジグザグに飛ぶ貫通攻撃', 
        evolvedName: 'ステルス戦闘機', evolvedDesc: '超高速で敵を貫く', synergy: 'SHOES',
        sprite: { template: 'FLIER', color: '#ffffff', highlight: '#e2e8f0' },
        animType: 'PROJECTILE'
    },
    GLUE_STICK: { 
        id: 'GLUE_STICK', name: 'スティックのり', desc: 'ネバネバの足場を作る', 
        evolvedName: '超強力接着剤', evolvedDesc: '敵の動きを完全に止める床', synergy: 'MILK',
        sprite: { template: 'POTION', color: '#3b82f6', highlight: '#60a5fa' },
        animType: 'STAY'
    },
    HAND_BELL: { 
        id: 'HAND_BELL', name: 'ハンドベル', desc: '一定時間ごとに周囲を攻撃', 
        evolvedName: '大聖堂の鐘', evolvedDesc: '強力な衝撃波を放つ', synergy: 'TEXTBOOK',
        sprite: { template: 'LIGHTNING', color: '#facc15', highlight: '#fef08a' },
        animType: 'BLAST'
    },
    COMPASS_SPIKE: { 
        id: 'COMPASS_SPIKE', name: 'コンパスの針', desc: '前方に高速で突きを放つ', 
        evolvedName: '千本針', evolvedDesc: '超範囲の連続突き', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#cbd5e1', highlight: '#f8fafc' },
        animType: 'STAB'
    },
    WHISTLE_S: { 
        id: 'WHISTLE_S', name: '先生の笛', desc: '音圧で敵を弾き飛ばす', 
        evolvedName: '超音波カッター', evolvedDesc: '全方位に殺傷音波', synergy: 'DRILL',
        sprite: { template: 'LIGHTNING', color: '#ef4444', highlight: '#fca5a5' },
        animType: 'BLAST'
    },
    MAGNET_U: { 
        id: 'MAGNET_U', name: 'U字磁石', desc: '敵を中央に吸い寄せる', 
        evolvedName: '電磁波地獄', evolvedDesc: '強力に敵を集め粉砕する', synergy: 'MAGNET',
        sprite: { template: 'SHIELD', color: '#ef4444', highlight: '#3b82f6' },
        animType: 'CIRCLE'
    },
    TRIANGLE_RULER_S: { 
        id: 'TRIANGLE_RULER_S', name: '三角定規', desc: '回転しながら飛ぶカッター', 
        evolvedName: 'プラズマカッター', evolvedDesc: '敵を切り裂く光輪', synergy: 'PROTRACTOR',
        sprite: { template: 'SWORD', color: '#4ade80', highlight: '#bbf7d0' },
        animType: 'PROJECTILE'
    },
    STAPLE_REMOVER: { 
        id: 'STAPLE_REMOVER', name: '針抜き', desc: '近距離に高威力の噛みつき', 
        evolvedName: 'デストラクター', evolvedDesc: '敵の防御を無視して粉砕', synergy: 'LUNCHBOX',
        sprite: { template: 'FIST', color: '#475569', highlight: '#94a3b8' },
        animType: 'STAB'
    },
    JUMP_ROPE: { 
        id: 'JUMP_ROPE', name: 'なわとび', desc: '周囲を円状になぎ払う', 
        evolvedName: '光の鎖', evolvedDesc: '広い範囲を拘束・攻撃', synergy: 'ORIGAMI',
        sprite: { template: 'FIST', color: '#facc15', highlight: '#ffffff' },
        animType: 'CIRCLE'
    },
    PRISM: { 
        id: 'PRISM', name: 'プリズム', desc: '虹色の光を放つ', 
        evolvedName: 'オーロラ・カノン', evolvedDesc: '画面を焼き尽くす七色の光', synergy: 'TEXTBOOK',
        sprite: { template: 'GEM', color: '#ffffff', highlight: '#fdf4ff' },
        animType: 'RAINBOW'
    },
    TROWEL: { 
        id: 'TROWEL', name: '移植ゴテ', desc: '地面からトゲを出す', 
        evolvedName: '大地の怒り', evolvedDesc: '無数の岩の槍を突き出す', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#78350f', highlight: '#b45309' },
        animType: 'STAB'
    },
    LUNCH_TRAY: { 
        id: 'LUNCH_TRAY', name: '給食用トレイ', desc: '回転して敵を弾く', 
        evolvedName: '鋼鉄の円盤', evolvedDesc: '触れた敵を切り刻む', synergy: 'PAD',
        sprite: { template: 'SHIELD', color: '#94a3b8', highlight: '#e2e8f0' },
        animType: 'STAY'
    },
    BASKETBALL: { 
        id: 'BASKETBALL', name: 'バスケットボール', desc: 'ドリブルで衝撃波', 
        evolvedName: 'ダンク・インパクト', evolvedDesc: '爆発的な衝撃波を連続発生', synergy: 'SHOES',
        sprite: { template: 'SLIME', color: '#f97316', highlight: '#fdba74' },
        animType: 'BLAST'
    },
    DUSTER: { 
        id: 'DUSTER', name: '黒板消し', desc: '粉塵を撒き散らす', 
        evolvedName: 'ダスト・ノヴァ', evolvedDesc: '画面中を煙に包み爆破', synergy: 'DRILL',
        sprite: { template: 'NOTEBOOK', color: '#1e40af', highlight: '#60a5fa' },
        animType: 'BLAST'
    },
    FOUNTAIN_PEN: { 
        id: 'FOUNTAIN_PEN', name: '万年筆', desc: 'インクの跡を残す', 
        evolvedName: 'インクの海', evolvedDesc: '敵を溺れさせる巨大インク溜まり', synergy: 'MAGNET',
        sprite: { template: 'SWORD', color: '#000000', highlight: '#424242' },
        animType: 'SPLATTER'
    },
    SCHOOL_CHIME: { 
        id: 'SCHOOL_CHIME', name: '学校のチャイム', desc: '音圧リングで攻撃', 
        evolvedName: '終焉の鐘', evolvedDesc: '画面中の敵の魂を削る', synergy: 'TEXTBOOK',
        sprite: { template: 'HAND_BELL', color: '#fbbf24', highlight: '#ffffff' },
        animType: 'CIRCLE'
    },
    TRUMPET: { 
        id: 'TRUMPET', name: 'トランペット', desc: '前方に音の壁', 
        evolvedName: '凱旋のファンファーレ', evolvedDesc: '敵を消し飛ばす黄金の波動', synergy: 'ORIGAMI',
        sprite: { template: 'TRUMPET', color: '#fbbf24', highlight: '#fef3c7' },
        animType: 'BEAM'
    },
    CLAY: { 
        id: 'CLAY', name: '図工の粘土', desc: '粘着弾を投げる', 
        evolvedName: 'クレイ・ゴーレム', evolvedDesc: '敵を拘束し続ける巨人の手', synergy: 'MILK',
        sprite: { template: 'SLIME', color: '#8d6e63', highlight: '#d7ccc8' },
        animType: 'PROJECTILE'
    },
    BROADCAST_MIC: { 
        id: 'BROADCAST_MIC', name: '放送用マイク', desc: '広範囲にエコー攻撃', 
        evolvedName: '神の宣告', evolvedDesc: '敵を跪かせる聖なる叫び', synergy: 'ABACUS',
        sprite: { template: 'MIC', color: '#475569', highlight: '#94a3b8' },
        animType: 'CIRCLE'
    }
};

const PASSIVES: Record<PassiveType, PassiveDef> = {
    PROTEIN: { id: 'PROTEIN', name: 'ムキムキプロテイン', desc: 'ダメージ +15%', sprite: { template: 'MUSCLE', color: '#ef4444', highlight: '#fca5a5' } },
    DRILL: { id: 'DRILL', name: '計算ドリル', desc: 'クールダウン -8%', sprite: { template: 'NOTEBOOK', color: '#fcd34d', highlight: '#fef08a' } },
    PROTRACTOR: { id: 'PROTRACTOR', name: '分度器', desc: '攻撃範囲 +15%', sprite: { template: 'SHIELD', color: '#60a5fa', highlight: '#bfdbfe' } },
    SHOES: { id: 'SHOES', name: '瞬足シューズ', desc: '移動速度 +12%', sprite: { template: 'SHOE', color: '#3b82f6', highlight: '#93c5fd' } },
    PAD: { id: 'PAD', name: '硬い下敷き', desc: '被ダメ -2', sprite: { template: 'SHIELD', color: '#a855f7', highlight: '#d8b4fe' } },
    LUNCHBOX: { id: 'LUNCHBOX', name: '早弁セット', desc: '弾速 +15%', sprite: { template: 'BACKPACK', color: '#f97316', highlight: '#fdba74' } },
    MAGNET: { id: 'MAGNET', name: 'U字磁石', desc: '回収範囲大幅拡大', sprite: { template: 'SHIELD', color: '#ef4444', highlight: '#d1d5db' } }, 
    TEXTBOOK: { id: 'TEXTBOOK', name: '教科書', desc: '効果時間 +15%', sprite: { template: 'NOTEBOOK', color: '#22c55e', highlight: '#86efac' } },
    ABACUS: { id: 'ABACUS', name: 'そろばん', desc: '発射数 +1', sprite: { template: 'NOTEBOOK', color: '#78350f', highlight: '#b45309' } },
    CONSOLE: { id: 'CONSOLE', name: 'ゲーム機', desc: 'クリティカル率UP', sprite: { template: 'ROBOT', color: '#4b5563', highlight: '#9ca3af' } },
    MILK: { id: 'MILK', name: '牛乳', desc: 'HP自然回復量UP', sprite: { template: 'POTION', color: '#ffffff', highlight: '#e5e7eb' } },
    ORIGAMI: { id: 'ORIGAMI', name: '金ピカ折り紙', desc: '獲得ゴールド+20%', sprite: { template: 'FLIER', color: '#eab308', highlight: '#fef08a' } },
};

/** These pools are rendered by both the game and the in-game compendium. */
export const SCHOOLYARD_WEAPON_CATALOG = Object.values(WEAPONS);
export const SCHOOLYARD_PASSIVE_CATALOG = Object.values(PASSIVES);

const SPRITE_ASSET_VERSION = 'schoolyard-survivor-v4';
const SPRITE_SHEET_CELL_SIZE = 32;
const SPRITE_SHEET_COLUMNS = 8;

const SCHOOLYARD_ENEMY_ASSET_KEYS = [
    'ENEMY_1', 'ENEMY_2', 'ENEMY_3', 'ENEMY_4', 'ENEMY_5', 'ENEMY_6', 'ENEMY_7', 'ENEMY_8',
    'ENEMY_9', 'ENEMY_10', 'ENEMY_11', 'ENEMY_12', 'ENEMY_13', 'ENEMY_14', 'ENEMY_15', 'ENEMY_16'
] as const;

const SCHOOLYARD_WEAPON_ASSET_KEYS = [
    'PENCIL', 'ERASER', 'RULER', 'HIGHLIGHTER', 'FLASK', 'RECORDER', 'SOCCER', 'UWABAKI',
    'CURRY', 'COMPASS', 'MOP', 'MAGNIFIER', 'STAPLER', 'CUTTER', 'ART_BRUSH', 'GLOBE',
    'PROTRACTOR_SWING', 'CHALK_SMOKE', 'SCISSORS', 'TAPE', 'DICTIONARY', 'PAPER_PLANE_S', 'GLUE_STICK', 'HAND_BELL',
    'COMPASS_SPIKE', 'WHISTLE_S', 'MAGNET_U', 'TRIANGLE_RULER_S', 'STAPLE_REMOVER', 'JUMP_ROPE', 'PRISM', 'TROWEL',
    'LUNCH_TRAY', 'BASKETBALL', 'DUSTER', 'FOUNTAIN_PEN', 'SCHOOL_CHIME', 'TRUMPET', 'CLAY', 'BROADCAST_MIC'
] as const;

const SCHOOLYARD_EFFECT_ASSET_KEYS = [
    'CHALK_BULLET', 'BALL_BULLET', 'WHISTLE_WAVE', 'DUST_MINE', 'FIRE_POP', 'ICE_POP',
    'HIT_SPARK', 'XP_GEM', 'SHOCK_RING', 'POISON_SPLASH', 'DASH_AFTERIMAGE', 'WARNING_MARK'
] as const;

const getSpriteSheetIconStyle = (fileName: string, keys: readonly string[], key: string): React.CSSProperties | undefined => {
    const index = keys.indexOf(key);
    if (index < 0) return undefined;
    const col = index % SPRITE_SHEET_COLUMNS;
    const row = Math.floor(index / SPRITE_SHEET_COLUMNS);
    const rows = Math.ceil(keys.length / SPRITE_SHEET_COLUMNS);
    return {
        width: '100%',
        height: '100%',
        backgroundImage: `url("${assetUrl(`sprites/${fileName}`)}?v=${SPRITE_ASSET_VERSION}")`,
        backgroundPosition: `${(col / (SPRITE_SHEET_COLUMNS - 1)) * 100}% ${rows === 1 ? 0 : (row / (rows - 1)) * 100}%`,
        backgroundSize: `${SPRITE_SHEET_COLUMNS * 100}% ${rows * 100}%`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
    };
};

type EnemyAttackKind = 'CONTACT' | 'RANGED' | 'BURST' | 'DASH' | 'MINE' | 'ZIGZAG';

interface EnemyDef {
    type: string;
    hp: number;
    speed: number;
    width: number;
    height: number;
    damage: number;
    defense?: number;
    knockbackImmune?: boolean;
    attackKind?: EnemyAttackKind;
    xpValue?: number;
}

const SCHOOLYARD_ENEMY_DEFS: Record<string, EnemyDef> = {
    ENEMY_17: { type:'ENEMY_17', hp:22, speed:1.65, width:36, height:36, damage:6, attackKind:'ZIGZAG' },
    ENEMY_18: { type:'ENEMY_18', hp:42, speed:1.1, width:38, height:38, damage:7, attackKind:'RANGED' },
    ENEMY_19: { type:'ENEMY_19', hp:60, speed:1.25, width:40, height:40, damage:8, attackKind:'BURST', xpValue:3 },
    ENEMY_20: { type:'ENEMY_20', hp:65, speed:1.8, width:40, height:40, damage:9, attackKind:'DASH', defense:1, xpValue:3 },
    ENEMY_21: { type:'ENEMY_21', hp:50, speed:.85, width:42, height:42, damage:7, attackKind:'MINE', xpValue:2 },
    ENEMY_22: { type:'ENEMY_22', hp:1500, speed:.7, width:100, height:100, damage:15, attackKind:'BURST', knockbackImmune:true, xpValue:30 },
    ENEMY_1: { type: 'ENEMY_1', hp: 10, speed: 1.2, width: 24, height: 24, damage: 5, attackKind: 'CONTACT' },
    ENEMY_2: { type: 'ENEMY_2', hp: 16, speed: 2.6, width: 24, height: 24, damage: 5, attackKind: 'ZIGZAG' },
    ENEMY_3: { type: 'ENEMY_3', hp: 35, speed: 1.45, width: 26, height: 26, damage: 6, defense: 1 },
    ENEMY_4: { type: 'ENEMY_4', hp: 70, speed: 2.45, width: 26, height: 26, damage: 7, attackKind: 'DASH' },
    ENEMY_5: { type: 'ENEMY_5', hp: 85, speed: 3.2, width: 28, height: 28, damage: 8, attackKind: 'RANGED', defense: 1 },
    ENEMY_6: { type: 'ENEMY_6', hp: 420, speed: 0.8, width: 48, height: 48, damage: 10, attackKind: 'BURST', knockbackImmune: true, xpValue: 10 },
    ENEMY_7: { type: 'ENEMY_7', hp: 160, speed: 0.55, width: 50, height: 50, damage: 9, defense: 4, knockbackImmune: true, xpValue: 10 },
    ENEMY_8: { type: 'ENEMY_8', hp: 24, speed: 1.8, width: 26, height: 26, damage: 6, attackKind: 'RANGED' },
    ENEMY_9: { type: 'ENEMY_9', hp: 42, speed: 1.1, width: 30, height: 30, damage: 7, attackKind: 'MINE', defense: 1 },
    ENEMY_10: { type: 'ENEMY_10', hp: 55, speed: 2.0, width: 30, height: 30, damage: 8, attackKind: 'DASH' },
    ENEMY_11: { type: 'ENEMY_11', hp: 75, speed: 1.3, width: 32, height: 32, damage: 8, attackKind: 'BURST' },
    ENEMY_12: { type: 'ENEMY_12', hp: 115, speed: 1.0, width: 36, height: 36, damage: 10, attackKind: 'RANGED', defense: 2 },
    ENEMY_13: { type: 'ENEMY_13', hp: 90, speed: 2.2, width: 34, height: 34, damage: 9, attackKind: 'DASH' },
    ENEMY_14: { type: 'ENEMY_14', hp: 180, speed: 1.1, width: 42, height: 42, damage: 11, attackKind: 'BURST', knockbackImmune: true, xpValue: 10 },
    ENEMY_15: { type: 'ENEMY_15', hp: 130, speed: 0.9, width: 38, height: 38, damage: 10, attackKind: 'MINE', defense: 3 },
    ENEMY_16: { type: 'ENEMY_16', hp: 260, speed: 0.75, width: 46, height: 46, damage: 12, attackKind: 'BURST', knockbackImmune: true, xpValue: 12 },
};

const pickEnemyType = (timeSec: number): string => {
    const r = Math.random();
    if (timeSec < 30) return r < 0.82 ? 'ENEMY_1' : 'ENEMY_8';
    if (timeSec < 60) return r < 0.4 ? 'ENEMY_1' : (r < 0.75 ? 'ENEMY_2' : 'ENEMY_8');
    if (timeSec < 120) return r < 0.3 ? 'ENEMY_2' : (r < 0.58 ? 'ENEMY_3' : (r < 0.8 ? 'ENEMY_9' : 'ENEMY_5'));
    if (timeSec < 180) return r < 0.18 ? 'ENEMY_7' : (r < 0.36 ? 'ENEMY_10' : (r < 0.58 ? 'ENEMY_4' : (r < 0.78 ? 'ENEMY_5' : 'ENEMY_11')));
    if (timeSec < 260) return r < 0.07 ? 'ENEMY_6' : (r < 0.18 ? 'ENEMY_12' : (r < 0.33 ? 'ENEMY_13' : (r < 0.5 ? 'ENEMY_7' : (r < 0.72 ? 'ENEMY_11' : 'ENEMY_10'))));
    return r < 0.06 ? 'ENEMY_16' : (r < 0.18 ? 'ENEMY_14' : (r < 0.32 ? 'ENEMY_15' : (r < 0.5 ? 'ENEMY_12' : (r < 0.72 ? 'ENEMY_13' : 'ENEMY_5'))));
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
    knockbackImmune?: boolean; 
    defense?: number; 
    attackKind?: EnemyAttackKind;
    attackCooldown?: number;
    movementPhase?: number;
    xpValue?: number;
    boss?: boolean;
    finalBoss?: boolean;
}

interface Projectile {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    damage: number;
    type: WeaponType | 'EVOLVED';
    subType?: WeaponType; 
    duration: number;
    maxDuration: number;
    penetration: number;
    rotation: number;
    scale: number;
    knockback: number;
    hitIds: number[]; 
    speed?: number;
    swingAngle?: number;
}

interface EnemyBullet {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    damage: number;
    radius: number;
    duration: number;
    spriteKey: typeof SCHOOLYARD_EFFECT_ASSET_KEYS[number];
    color: string;
    persistent?: boolean;
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

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
    type: 'SPARK' | 'SMOKE' | 'BUBBLE' | 'SLASH_TRACE' | 'RING' | 'GLOW' | 'RAINBOW';
    scale?: number;
}

interface SchoolyardSurvivorScreenProps {
    onBack: () => void;
    problemMode?: GameMode;
    problemModePool?: string[];
    answerMode?: AnswerMode;
    assignment?: AssignmentPayload | null;
    onAnswerResult?: (result: AssignmentAnswerResult) => void;
    languageMode?: LanguageMode;
    debugPreview?: MiniGameDebugPreview;
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

const SchoolyardSurvivorScreen: React.FC<SchoolyardSurvivorScreenProps> = ({ onBack, problemMode = GameMode.MIXED, problemModePool, answerMode = 'CHOICE', assignment, onAnswerResult, languageMode = 'JAPANESE', debugPreview }) => {
    const tr = (text: string) => trans(text, languageMode);
    const l = (ja:string,en:string,hira?:string) => localize(languageMode,ja,en,hira);
    const [inLobby,setInLobby] = useState(!debugPreview);
    const [paused,setPaused] = useState(false);
    const [burstCutin,setBurstCutin] = useState<{heroId:SurvivorHero['id'];id:number}|null>(null);
    const burstCutinFrames = useRef(0);
    const burstCutinSerial = useRef(0);
    const selectedHero = useRef<SurvivorHero>(HEROES[0]);
    const selectedField = useRef<Field>(FIELDS[0]);
    const obstacles = useRef(createObstacles(FIELDS[0]));
    const heroImages = useRef<Record<string,HTMLImageElement>>({});
    const reducedMotion = useRef(typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const action = useRef({dash:0,dashTime:0,burst:0,burstTime:0,kills:0,wave:1,banner:180,bossSpawn:0,victory:false});
    const [battleUi,setBattleUi] = useState({dash:0,burst:0,kills:0,wave:1,banner:180,boss:0,bossMax:1,victory:false});
    const magicFx = useRef<{x:number;y:number;kind:string;age:number;life:number;size:number;angle:number}[]>([]);
    const hazards = useRef<{x:number;y:number;age:number;radius:number}[]>([]);
    const addFx = (x:number,y:number,kind:string,size=100,life=30,angle=0) => {
        if(magicFx.current.length<70)magicFx.current.push({x,y,kind,size,life,age:0,angle});
    };
    const touchAnchor = useRef<{id:number;x:number;y:number}|null>(null);
    const clearInput = () => {touchAnchor.current=null;keys.current={};joystickRef.current={x:0,y:0};gamepadJoystickRef.current={x:0,y:0};setJoystickUI(null);};
    const pauseBattle = () => {if(gameState.current==='PLAYING'){gameState.current='PAUSED';clearInput();setPaused(true);}};
    const resumeBattle = () => {clearInput();gameState.current='PLAYING';setPaused(false);};
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
    
    const [viewSize, setViewSize] = useState({ width: 800, height: 600 });
    const viewSizeRef = useRef({ width: 800, height: 600 }); 
    const camera = useRef({ x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2 }); 

    const gameState = useRef<'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_UP' | 'MATH_CHALLENGE'>(debugPreview ? 'PLAYING' : 'TITLE');
    const player = useRef<Entity>({ id: 0, x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, type: 'WARRIOR', width: 24, height: 24, hp: 100, maxHp: 100, speed: PLAYER_SPEED, damage: 0, vx: 0, vy: 0, dead: false, flashTime: 0 });
    const enemies = useRef<Entity[]>([]);
    const projectiles = useRef<Projectile[]>([]);
    const enemyBullets = useRef<EnemyBullet[]>([]);
    const gems = useRef<Gem[]>([]);
    const damageTexts = useRef<DamageText[]>([]);
    const particles = useRef<Particle[]>([]);
    
    const frameCount = useRef(0);
    const score = useRef(0);
    const time = useRef(0);
    const level = useRef(1);
    const xp = useRef(0);
    const nextLevelXp = useRef(BASE_XP_REQUIREMENT);
    const shakeAmount = useRef(0);
    const frameRequestRef = useRef<number | null>(null);
    const lastLoopTimeRef = useRef<number | null>(null);
    const accumulatorRef = useRef(0);
    const isLoopActiveRef = useRef(false);
    const activeTimeouts = useRef<{remaining:number;callback:()=>void}[]>([]);
    const scheduleShot = (callback:()=>void,ms:number) => {activeTimeouts.current.push({remaining:Math.ceil(ms/FIXED_STEP_MS),callback});};

    const [weapons, setWeapons] = useState<Record<WeaponType, { level: number, cooldownTimer: number } | undefined>>(() => {
        const initial: any = {};
        Object.keys(WEAPONS).forEach(k => initial[k] = undefined);
        initial.PENCIL = { level: 1, cooldownTimer: 0 };
        return initial;
    });
    const [passives, setPassives] = useState<Record<PassiveType, number>>({
        PROTEIN: 0, DRILL: 0, PROTRACTOR: 0, SHOES: 0, PAD: 0, LUNCHBOX: 0,
        MAGNET: 0, TEXTBOOK: 0, ABACUS: 0, CONSOLE: 0, MILK: 0, ORIGAMI: 0
    });


    const [upgradeOptions, setUpgradeOptions] = useState<any[]>([]);
    const [uiState, setUiState] = useState({ hp: 100, maxHp: 100, level: 1, time: 0, score: 0, xpPercent: 0, gameOver: false });

    useEffect(() => {
        if (debugPreview === 'GAME_OVER') {
            gameState.current = 'GAME_OVER';
            setUiState(prev => ({ ...prev, hp: 0, time: Math.max(prev.time, 185), score: Math.max(prev.score, 12480), gameOver: true }));
        }
    }, [debugPreview]);

    const keys = useRef<Record<string, boolean>>({});
    const joystickRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const gamepadJoystickRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const [joystickUI, setJoystickUI] = useState<{ active: boolean, startX: number, startY: number, curX: number, curY: number } | null>(null);
    const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});
    const lastDir = useRef<{x:number, y:number}>({x:1, y:0}); 

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
        const observer=new ResizeObserver(updateSize);if(containerRef.current)observer.observe(containerRef.current);
        updateSize();
        return () => {window.removeEventListener('resize', updateSize);observer.disconnect();};
    }, []);

    useEffect(() => {
        const handleGamepadAxes = (event: Event) => {
            const detail = (event as CustomEvent<{ x?: number; y?: number }>).detail;
            gamepadJoystickRef.current = {
                x: Math.max(-1, Math.min(1, Number(detail?.x) || 0)),
                y: Math.max(-1, Math.min(1, Number(detail?.y) || 0)),
            };
        };
        window.addEventListener('learning-rogue:gamepad-axes', handleGamepadAxes);
        return () => {
            window.removeEventListener('learning-rogue:gamepad-axes', handleGamepadAxes);
            gamepadJoystickRef.current = { x: 0, y: 0 };
        };
    }, []);

    const generateFromTemplate = (templateName: string, mainColor: string, highlightColor: string): HTMLCanvasElement => {
        const template = SPRITE_TEMPLATES[templateName] || SPRITE_TEMPLATES['SLIME'];
        const size = 16;
        const scale = 2; 
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

    const loadSpriteSheetIntoCache = (
        fileName: string,
        keys: readonly string[],
        options: { makeFlash?: boolean; cellSize?: number } = {}
    ) => {
        const cell = options.cellSize || SPRITE_SHEET_CELL_SIZE;
        const img = new Image();
        img.src = `${assetUrl(`sprites/${fileName}`)}?v=${SPRITE_ASSET_VERSION}`;
        img.onload = () => {
            keys.forEach((key, index) => {
                const c = document.createElement('canvas');
                c.width = cell;
                c.height = cell;
                const ctx = c.getContext('2d');
                if (!ctx) return;
                ctx.imageSmoothingEnabled = false;
                const sx = (index % SPRITE_SHEET_COLUMNS) * cell;
                const sy = Math.floor(index / SPRITE_SHEET_COLUMNS) * cell;
                ctx.drawImage(img, sx, sy, cell, cell, 0, 0, cell, cell);
                spriteCache.current[key] = c;
                if (options.makeFlash) spriteCache.current[`${key}_FLASH`] = createFlashSprite(c);
            });
        };
    };

    const stopSurvivorAudio = () => {
        audioService.stopAllAudio();
    };

    const handleExit = () => {
        stopSurvivorAudio();
        clearAllTimeouts();
        onBack();
    };

    useEffect(() => {
        bgCanvasRef.current = createFieldCanvas(selectedField.current);
        HEROES.forEach(hero => {const image=new Image();image.src=assetUrl(`sprites/wandering-student/${hero.id}.webp`);heroImages.current[hero.id]=image;});
        const sprites = {
            'ENEMY_1': ['SLIME', '#3b82f6', '#60a5fa'],
            'ENEMY_2': ['BAT', '#a855f7', '#c084fc'],
            'ENEMY_3': ['SKELETON', '#e5e7eb', '#f3f4f6'],
            'ENEMY_4': ['GHOST', '#a5f3fc', '#cffafe'],
            'ENEMY_5': ['ROBOT', '#6b7280', '#9ca3af'],
            'ENEMY_6': ['TEACHER', '#ef4444', '#fca5a5'],
            'ENEMY_7': ['GOLEM', '#94a3b8', '#cbd5e1'], 
        };
        Object.entries(sprites).forEach(([key, [t, c1, c2]]) => {
            const s = generateFromTemplate(t, c1, c2);
            spriteCache.current[key] = s;
            spriteCache.current[`${key}_FLASH`] = createFlashSprite(s);
        });
        Object.values(WEAPONS).forEach(w => {
            spriteCache.current[w.id] = generateFromTemplate(w.sprite.template, w.sprite.color, w.sprite.highlight);
        });
        spriteCache.current['GEM'] = generateFromTemplate('EYE', '#eab308', '#fde047');
        loadSpriteSheetIntoCache('schoolyard-survivor-enemies.webp', SCHOOLYARD_ENEMY_ASSET_KEYS, { makeFlash: true });
        loadSpriteSheetIntoCache('schoolyard-survivor/weapons.webp', SCHOOLYARD_WEAPON_ASSET_KEYS, {cellSize:128});
        loadSpriteSheetIntoCache('schoolyard-survivor/scenery.webp', SCENERY_KEYS, {cellSize:128,makeFlash:true});
        loadSpriteSheetIntoCache('schoolyard-survivor/effects.webp', FX_KEYS, {cellSize:128});
        loadSpriteSheetIntoCache('schoolyard-survivor-effects.webp', SCHOOLYARD_EFFECT_ASSET_KEYS);

        isLoopActiveRef.current = true;
        const loop = (now: number) => {
            if (!isLoopActiveRef.current) return;
            if (lastLoopTimeRef.current === null) {
                lastLoopTimeRef.current = now;
            }
            const delta = Math.min(100, now - lastLoopTimeRef.current);
            lastLoopTimeRef.current = now;
            accumulatorRef.current += delta;

            while (accumulatorRef.current >= FIXED_STEP_MS) {
                if (gameState.current === 'PLAYING') {
                    try {
                        update();
                    } catch (e) {
                        console.error("Update loop error", e);
                    }
                }
                accumulatorRef.current -= FIXED_STEP_MS;
            }

            try {
                draw();
            } catch (e) {
                console.error("Draw loop error", e);
            }
            frameRequestRef.current = requestAnimationFrame(loop);
        };
        frameRequestRef.current = requestAnimationFrame(loop);
        const handleKeyDown = (e: KeyboardEvent) => {
            if(e.code==='Escape' && !e.repeat){if(gameState.current==='PAUSED')resumeBattle();else pauseBattle();return;}
            if(gameState.current!=='PLAYING')return;
            if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
            keys.current[e.code]=true;
            if(!e.repeat&&(e.code==='ShiftLeft'||e.code==='ShiftRight'))activateDash();
            if(!e.repeat&&(e.code==='Space'||e.code==='KeyE'))activateBurst();
        };
        const onBlur = () => {clearInput();pauseBattle();};
        const onVisibility = () => {if(document.hidden)onBlur();};
        window.addEventListener('blur',onBlur);
        document.addEventListener('visibilitychange',onVisibility);
        const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            isLoopActiveRef.current = false;
            if (frameRequestRef.current !== null) {
                cancelAnimationFrame(frameRequestRef.current);
                frameRequestRef.current = null;
            }
            lastLoopTimeRef.current = null;
            accumulatorRef.current = 0;
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur',onBlur);
            document.removeEventListener('visibilitychange',onVisibility);
            window.removeEventListener('keyup', handleKeyUp);
            stopSurvivorAudio();
            clearAllTimeouts();
        };
    }, []); 

    const weaponsRef = useRef(weapons);
    useEffect(() => { weaponsRef.current = weapons; }, [weapons]);
    const passivesRef = useRef(passives);
    useEffect(() => { passivesRef.current = passives; }, [passives]);

    const saveRecord = () => {
        try {
            const ownedWeapons = (Object.keys(weaponsRef.current) as WeaponType[]).filter(k => weaponsRef.current[k] !== undefined);
            storageService.saveSurvivorScore({
                id: `survivor-${Date.now()}`,
                date: Date.now(),
                score: Math.floor(score.current),
                timeSurvived: time.current,
                levelReached: level.current,
                weapons: ownedWeapons
            });
        } catch (e) {
            console.error("Failed to save record", e);
        }
    };

    const handleMathComplete = (correctCount: number) => {
        if (correctCount >= 3) { 
            const healAmount = 15;
            player.current.hp = Math.min(player.current.maxHp, player.current.hp + healAmount);
            damageTexts.current.push({ id: Math.random(), x: player.current.x, y: player.current.y - 30, value: `+${healAmount} HP`, color: 'green', life: 60 });
            audioService.playSound('buff');
        }
        generateUpgrades();
        gameState.current = 'LEVEL_UP';
        audioService.playBGM('survivor_metal'); 
        audioService.playSound('win'); 
        setUiState(prev => ({ ...prev })); 
    };

    const addParticle = (x: number, y: number, type: Particle['type'], color: string, options: Partial<Particle> = {}) => {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3 + 1;
        if(particles.current.length>=400)return;
        particles.current.push({
            id: Math.random(),
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: Math.random() * 4 + 2,
            color,
            life: 30,
            maxLife: 30,
            type,
            ...options
        });
    };

    const clearAllTimeouts = () => {
        activeTimeouts.current = [];
    };

    const damagePlayer = (rawDamage: number, defense: number, sourceX: number, sourceY: number, color = 'red') => {
        if (player.current.flashTime > 0 || action.current.dashTime>0 || action.current.burstTime>0) return;
        const finalDmg = Math.max(1, rawDamage - defense);
        player.current.hp -= finalDmg;
        player.current.flashTime = 30;
        damageTexts.current.push({ id: Math.random(), x: player.current.x, y: player.current.y - 20, value: `-${Math.floor(finalDmg)}`, color, life: 60 });
        const angle = Math.atan2(player.current.y - sourceY, player.current.x - sourceX);
        addParticle(player.current.x + Math.cos(angle) * 10, player.current.y + Math.sin(angle) * 10, 'SPARK', color, { life: 20, size: 4 });
        if (player.current.hp <= 0 && gameState.current === 'PLAYING') {
            stopSurvivorAudio();
            gameState.current = 'GAME_OVER';
            saveRecord();
            setUiState(prev => ({ ...prev, gameOver: true, hp: 0 }));
            audioService.playSound('lose');
            clearAllTimeouts();
        }
    };

    const fireEnemyBullet = (
        e: Entity,
        spriteKey: EnemyBullet['spriteKey'],
        speed: number,
        damage: number,
        radius: number,
        color: string,
        angleOffset = 0,
        duration = 180
    ) => {
        const angle = Math.atan2(player.current.y - e.y, player.current.x - e.x) + angleOffset;
        enemyBullets.current.push({
            id: Math.random(),
            x: e.x,
            y: e.y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            damage,
            radius,
            duration,
            spriteKey,
            color
        });
    };

    const spawnEnemy = (type:string,boss=false,finalBoss=false) => {
        if(enemies.current.length>=180&&!boss)return;
        const distance=Math.max(300,Math.min(650,Math.hypot(viewSizeRef.current.width,viewSizeRef.current.height)/ZOOM_SCALE*.52));
        const point=spawnPoint(player.current.x,player.current.y,Math.random()*Math.PI*2,distance,obstacles.current);
        if(!point)return;
        const def=SCHOOLYARD_ENEMY_DEFS[type]||SCHOOLYARD_ENEMY_DEFS.ENEMY_1;
        const hp=Math.round(def.hp*(1+time.current*.004)*(finalBoss?3:boss?1.5:1));
        enemies.current.push({id:Math.random(),...point,type,width:def.width,height:def.height,hp,maxHp:hp,speed:def.speed,
            damage:def.damage+Math.floor(time.current/80),vx:0,vy:0,dead:false,flashTime:0,knockbackImmune:def.knockbackImmune,
            defense:def.defense||0,attackKind:def.attackKind||'CONTACT',attackCooldown:90,movementPhase:Math.random()*6.28,xpValue:def.xpValue,boss,finalBoss});
        addFx(point.x,point.y,'PORTAL',boss?180:75,45);
    };
    const activateDash = () => {
        if(gameState.current!=='PLAYING'||action.current.dash>0)return;
        action.current.dash=240;action.current.dashTime=14;
        addFx(player.current.x,player.current.y,'SLASH',130,22,Math.atan2(lastDir.current.y,lastDir.current.x));
        audioService.playSound('select');
    };
    const activateBurst = () => {
        if(gameState.current!=='PLAYING'||action.current.burst<100)return;
        action.current.burst=0;action.current.burstTime=150;player.current.flashTime=150;
        burstCutinFrames.current=BURST_CUTIN_FRAMES;
        setBurstCutin({heroId:selectedHero.current.id,id:++burstCutinSerial.current});
        enemyBullets.current=[];shakeAmount.current=12;
        addFx(player.current.x,player.current.y,'NOVA',800,55);addFx(player.current.x,player.current.y,'RUNE',400,100);
        enemies.current.forEach(e=>{if(Math.hypot(e.x-player.current.x,e.y-player.current.y)<650)
            applyDamage(e,{damage:200+level.current*35,type:'EVOLVED',scale:2,hitIds:[],knockback:20,x:player.current.x,y:player.current.y} as Projectile);});
        // A burst also vacuums experience, making dense waves rewarding on touch screens.
        gems.current.forEach(g=>{g.x=player.current.x;g.y=player.current.y;});
        audioService.playSound('win');
    };
    const finishVictory = () => {
        action.current.victory=true;gameState.current='GAME_OVER';clearAllTimeouts();clearInput();saveRecord();
        stopSurvivorAudio();audioService.playSound('win');setBattleUi(prev=>({...prev,victory:true}));
        setUiState(prev=>({...prev,gameOver:true,hp:player.current.hp,time:time.current,score:score.current}));
    };
    const update = () => {
        if (gameState.current !== 'PLAYING') return;

        frameCount.current++;
        if(burstCutinFrames.current>0&&--burstCutinFrames.current===0)setBurstCutin(null);
        const scheduled=activeTimeouts.current;activeTimeouts.current=[];
        scheduled.forEach(shot=>{if(--shot.remaining<=0)shot.callback();else activeTimeouts.current.push(shot);});
        const pad=typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()).find(Boolean):undefined;
        if(keys.current.ShiftLeft||keys.current.ShiftRight||pad?.buttons[0]?.pressed)activateDash();
        if(keys.current.Space||keys.current.KeyE||pad?.buttons[2]?.pressed)activateBurst();
        if(pad?.buttons[9]?.pressed){pauseBattle();return;}
        action.current.dash=Math.max(0,action.current.dash-1);
        action.current.dashTime=Math.max(0,action.current.dashTime-1);
        action.current.burstTime=Math.max(0,action.current.burstTime-1);
        action.current.banner=Math.max(0,action.current.banner-1);
        magicFx.current=magicFx.current.filter(fx=>++fx.age<fx.life);
        hazards.current=hazards.current.filter(h=>++h.age<130);
        hazards.current.forEach(h=>{if(h.age===90){addFx(h.x,h.y,'LIGHTNING',h.radius*2,30);if(Math.hypot(player.current.x-h.x,player.current.y-h.y)<h.radius)damagePlayer(15,0,h.x,h.y,'#ff829b');}});
        if(frameCount.current%180===0&&time.current>45&&hazards.current.length<5)hazards.current.push({x:player.current.x+lastDir.current.x*100,y:player.current.y+lastDir.current.y*100,age:0,radius:65});
        if(action.current.burstTime>0&&frameCount.current%8===0){addFx(player.current.x,player.current.y,'SPARK',120,20);fireWeapon('PENCIL',4,true,35,1.5,9,1,3,1);}
        if(frameCount.current%10===0){
            const boss=enemies.current.find(e=>e.boss&&!e.dead);
            setBattleUi({dash:action.current.dash,burst:action.current.burst,kills:action.current.kills,wave:action.current.wave,banner:action.current.banner,boss:boss?.hp||0,bossMax:boss?.maxHp||1,victory:action.current.victory});
        }
        if (frameCount.current % 60 === 0) {
            time.current++;
            if(time.current%30===0&&time.current<=300){action.current.wave++;action.current.banner=180;
                for(let i=0;i<10+Math.floor(time.current/15);i++)spawnEnemy(selectedField.current.enemies[i%3]);}
            if([90,180,300].includes(time.current)){spawnEnemy('ENEMY_22',true,time.current===300);action.current.bossSpawn=time.current;action.current.banner=240;}

            if (passivesRef.current.MILK > 0) {
                player.current.hp = Math.min(player.current.maxHp, player.current.hp + passivesRef.current.MILK);
            }
            setUiState(prev => ({ ...prev, time: time.current, hp: player.current.hp }));
        }

        const might = selectedHero.current.might * (1 + (passivesRef.current.PROTEIN * 0.15)) * (action.current.burstTime>0?1.5:1);
        const cooldownReduc = 1 - (passivesRef.current.DRILL * 0.08);
        const area = selectedHero.current.area * (1 + (passivesRef.current.PROTRACTOR * 0.15));
        const speed = 1 + (passivesRef.current.SHOES * 0.12);
        const defense = passivesRef.current.PAD * 2;
        const projSpeed = 1 + (passivesRef.current.LUNCHBOX * 0.15);
        const magnet = 95 + selectedHero.current.magnet + (passivesRef.current.MAGNET * 30);
        const duration = 1 + (passivesRef.current.TEXTBOOK * 0.15);
        const amount = passivesRef.current.ABACUS;
        const luck = 1 + (passivesRef.current.CONSOLE * 0.15);

        let dx = 0; let dy = 0;
        if (keys.current['ArrowUp'] || keys.current['KeyW']) dy = -1;
        if (keys.current['ArrowDown'] || keys.current['KeyS']) dy = 1;
        if (keys.current['ArrowLeft'] || keys.current['KeyA']) dx = -1;
        if (keys.current['ArrowRight'] || keys.current['KeyD']) dx = 1;
        if (joystickRef.current.x !== 0 || joystickRef.current.y !== 0) {
            dx = joystickRef.current.x; dy = joystickRef.current.y;
        } else if (gamepadJoystickRef.current.x !== 0 || gamepadJoystickRef.current.y !== 0) {
            dx = gamepadJoystickRef.current.x; dy = gamepadJoystickRef.current.y;
        }
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len > 0) { dx /= len; dy /= len; }
            lastDir.current = { x: dx, y: dy };
        }

        const dashing=action.current.dashTime>0;
        moveActor(player.current,(dashing?lastDir.current.x:dx)*player.current.speed*speed*(dashing?3.4:1),(dashing?lastDir.current.y:dy)*player.current.speed*speed*(dashing?3.4:1),12,obstacles.current);
        if(dashing&&frameCount.current%3===0)addFx(player.current.x,player.current.y,'SPARK',55,18);
        if (player.current.flashTime > 0) player.current.flashTime--;

        const vw = viewSizeRef.current.width / ZOOM_SCALE;
        const vh = viewSizeRef.current.height / ZOOM_SCALE;
        camera.current.x = vw >= WORLD_WIDTH ? WORLD_WIDTH / 2 : Math.max(vw/2, Math.min(WORLD_WIDTH - vw/2, player.current.x));
        camera.current.y = vh >= WORLD_HEIGHT ? WORLD_HEIGHT / 2 : Math.max(vh/2, Math.min(WORLD_HEIGHT - vh/2, player.current.y));

        Object.keys(weaponsRef.current).forEach((key) => {
            const wType = key as WeaponType;
            const wData = weaponsRef.current[wType];
            if (!wData) return;
            wData.cooldownTimer--;
            if (wData.cooldownTimer <= 0) {
                const isEvolved = wData.level >= 8 && passivesRef.current[WEAPONS[wType].synergy] > 0;
                const dmg = 10 * wData.level * might;
                const levelScale = 0.7 + (wData.level * 0.15); 
                const sz = levelScale * area;
                const spd = 5 * projSpeed;
                fireWeapon(wType, wData.level, isEvolved, dmg, sz, spd, duration, amount, luck);
                let baseCd = 60;
                if (['ERASER', 'LUNCH_TRAY', 'PRISM'].includes(wType)) baseCd = 100;
                else if (['RULER', 'COMPASS', 'TROWEL'].includes(wType)) baseCd = 40;
                else if (['HIGHLIGHTER', 'FOUNTAIN_PEN'].includes(wType)) baseCd = 12; 
                else if (['STAPLER', 'BASKETBALL'].includes(wType)) baseCd = 45;
                else if (['RECORDER', 'HAND_BELL', 'SCHOOL_CHIME', 'BROADCAST_MIC'].includes(wType)) baseCd = 180;
                wData.cooldownTimer = Math.max(5, baseCd * Math.pow(0.9, wData.level-1) * cooldownReduc);
            }
        });

        enemies.current.forEach(e => {
            if(e.dead)return;
            if (e.knockback && e.knockback.time > 0) {
                e.x += e.knockback.x; e.y += e.knockback.y;
                e.knockback.time--;
            } else if (e.frozen && e.frozen > 0) {
                e.frozen--;
            } else {
                const angle = Math.atan2(player.current.y - e.y, player.current.x - e.x);
                const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
                const phase = e.movementPhase || 0;
                const perp = Math.sin(frameCount.current * 0.06 + phase) * 0.8;
                let moveX = Math.cos(angle);
                let moveY = Math.sin(angle);
                let moveSpeed = e.speed;
                if (e.attackKind === 'RANGED' && dist < 190) {
                    moveX *= -0.7;
                    moveY *= -0.7;
                } else if (e.attackKind === 'ZIGZAG') {
                    moveX += Math.cos(angle + Math.PI / 2) * perp;
                    moveY += Math.sin(angle + Math.PI / 2) * perp;
                } else if (e.attackKind === 'DASH' && (e.attackCooldown || 0) < 18) {
                    moveSpeed *= 3.1;
                    if (frameCount.current % 3 === 0) addParticle(e.x, e.y, 'SMOKE', 'rgba(255,255,255,0.28)', { size: 6, life: 14 });
                } else if (e.attackKind === 'MINE' && dist < 170) {
                    moveSpeed *= 0.35;
                }
                const len = Math.hypot(moveX, moveY) || 1;
                const oldX=e.x,oldY=e.y;
                moveActor(e,(moveX/len)*moveSpeed,(moveY/len)*moveSpeed,Math.min(22,e.width*.3),obstacles.current);
                if(Math.hypot(e.x-oldX,e.y-oldY)<moveSpeed*.3)moveActor(e,Math.cos(angle+Math.PI/2)*moveSpeed,Math.sin(angle+Math.PI/2)*moveSpeed,Math.min(22,e.width*.3),obstacles.current);
            }
            const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
            e.attackCooldown = Math.max(0, (e.attackCooldown || 0) - 1);
            if (e.attackCooldown <= 0 && dist < 520) {
                if (e.attackKind === 'RANGED') {
                    fireEnemyBullet(e, e.type === 'ENEMY_8' ? 'CHALK_BULLET' : 'BALL_BULLET', e.type === 'ENEMY_8' ? 3.4 : 2.7, e.damage, 10, e.type === 'ENEMY_8' ? '#f8fafc' : '#fb923c');
                    e.attackCooldown = e.type === 'ENEMY_8' ? 95 : 120;
                } else if (e.attackKind === 'BURST') {
                    const shots = e.boss ? 16 : e.type === 'ENEMY_6' || e.type === 'ENEMY_16' ? 7 : 5;
                    const spread = e.boss || e.type === 'ENEMY_16' ? Math.PI * 2 : Math.PI * 0.9;
                    for (let i = 0; i < shots; i++) {
                        const offset = spread === Math.PI * 2 ? (Math.PI * 2 / shots) * i : (i - (shots - 1) / 2) * (spread / shots);
                        fireEnemyBullet(e, 'WHISTLE_WAVE', 2.15, e.damage + 1, 12, '#93c5fd', offset, 210);
                    }
                    e.attackCooldown = e.boss ? 110 : e.type === 'ENEMY_16' ? 140 : 180;
                    if(e.boss){hazards.current.push({x:player.current.x,y:player.current.y,age:0,radius:85});addFx(e.x,e.y,'RUNE',180,50);}
                    addParticle(e.x, e.y, 'RING', '#93c5fd', { scale: 1.3, life: 28 });
                } else if (e.attackKind === 'MINE') {
                    const angle = Math.atan2(player.current.y - e.y, player.current.x - e.x);
                    enemyBullets.current.push({
                        id: Math.random(),
                        x: e.x + Math.cos(angle) * 70,
                        y: e.y + Math.sin(angle) * 70,
                        dx: 0,
                        dy: 0,
                        damage: e.damage + 2,
                        radius: 24,
                        duration: 240,
                        spriteKey: 'DUST_MINE',
                        color: '#a8a29e',
                        persistent: true
                    });
                    e.attackCooldown = 210;
                } else if (e.attackKind === 'DASH') {
                    e.attackCooldown = 135;
                }
            }
            if (dist < Math.max(20, Math.max(e.width, e.height) * 0.45)) damagePlayer(e.damage, defense, e.x, e.y);
            if (e.flashTime > 0) e.flashTime--;
        });

        for (let i = enemyBullets.current.length - 1; i >= 0; i--) {
            const b = enemyBullets.current[i];
            b.x += b.dx;
            b.y += b.dy;
            b.duration--;
            if (frameCount.current % 6 === 0) addParticle(b.x, b.y, b.persistent ? 'SMOKE' : 'SPARK', b.color, { size: b.radius * 0.35, life: 12 });
            const dist = Math.hypot(b.x - player.current.x, b.y - player.current.y);
            if (dist < b.radius + 12 && (!b.persistent || b.duration<180)) {
                damagePlayer(b.damage, defense, b.x, b.y, b.color);
                if (!b.persistent) enemyBullets.current.splice(i, 1);
            } else if (b.duration <= 0 || b.x < -50 || b.x > WORLD_WIDTH + 50 || b.y < -50 || b.y > WORLD_HEIGHT + 50) {
                enemyBullets.current.splice(i, 1);
            }
        }

        if (gameState.current !== 'PLAYING') return;

        for (let i = projectiles.current.length - 1; i >= 0; i--) {
            const p = projectiles.current[i];
            p.duration--;
            
            if (frameCount.current % 3 === 0) {
                if (['PENCIL', 'PAPER_PLANE_S', 'TRIANGLE_RULER_S', 'EVOLVED'].includes(p.type)) {
                    addParticle(p.x, p.y, 'SMOKE', 'rgba(255,255,255,0.3)', { size: 2 * p.scale, life: 15 });
                }
                if (p.type === 'TAPE') {
                    addParticle(p.x, p.y, 'SMOKE', 'rgba(255,255,255,0.5)', { size: 4 * p.scale, life: 10 });
                }
                if (p.type === 'PRISM') {
                    const hue = (frameCount.current * 10) % 360;
                    addParticle(p.x, p.y, 'RAINBOW', `hsla(${hue}, 100%, 70%, 0.5)`, { size: 5 * p.scale, life: 20 });
                }
            }

            if (p.type === 'ERASER' || p.subType === 'ERASER' || p.type === 'LUNCH_TRAY' || p.subType === 'LUNCH_TRAY') {
                const t = frameCount.current * 0.05 + (p.id * 10);
                const radius = 70 * p.scale;
                p.x = player.current.x + Math.cos(t) * radius;
                p.y = player.current.y + Math.sin(t) * radius;
            } else if (p.type === 'GLOBE' || p.subType === 'GLOBE') {
                const t = frameCount.current * 0.03 + (p.id * 5);
                const radius = 100 * p.scale;
                p.x = player.current.x + Math.cos(t) * radius;
                p.y = player.current.y + Math.sin(t) * radius;
                addParticle(p.x, p.y, 'GLOW', 'rgba(100,100,255,0.2)', { life: 15, size: 8 * p.scale });
            } else if (p.type === 'JUMP_ROPE' || p.subType === 'JUMP_ROPE') {
                const t = frameCount.current * 0.15;
                const radius = 120 * p.scale;
                p.x = player.current.x + Math.cos(t) * radius;
                p.y = player.current.y + Math.sin(t) * radius;
                p.rotation = t;
                addParticle(p.x, p.y, 'SPARK', '#facc15', { life: 10, size: 2 * p.scale });
            } else if (p.type === 'MAGNET_U' || p.subType === 'MAGNET_U') {
                const radius = 150 * p.scale;
                enemies.current.forEach(e => {
                    const d = Math.hypot(e.x - player.current.x, e.y - player.current.y);
                    if (d < radius) {
                        e.x += (player.current.x - e.x) * 0.05;
                        e.y += (player.current.y - e.y) * 0.05;
                    }
                });
                p.x = player.current.x; p.y = player.current.y;
                if (frameCount.current % 15 === 0) addParticle(p.x, p.y, 'RING', '#ef4444', { scale: p.scale });
            } else if (p.type === 'HIGHLIGHTER') {
                p.x = player.current.x + Math.cos(p.rotation) * 40; 
                p.y = player.current.y + Math.sin(p.rotation) * 40;
            } else if (p.type === 'TRUMPET') {
                p.x = player.current.x; p.y = player.current.y;
            } else if (p.type === 'PAPER_PLANE_S' || p.subType === 'PAPER_PLANE_S') {
                const wave = Math.sin(frameCount.current * 0.2) * 5;
                const perpX = -p.dy; const perpY = p.dx;
                p.x += p.dx; p.y += p.dy;
                p.x += perpX * 0.1 * wave; p.y += perpY * 0.1 * wave;
            } else if (p.type === 'UWABAKI') {
                let target = null; let maxHp = -1;
                enemies.current.forEach(e => { 
                    if(Math.abs(e.x - p.x) < 400 && Math.abs(e.y - p.y) < 300) {
                        if(e.hp > maxHp){ maxHp = e.hp; target = e; } 
                    }
                });
                if (target) {
                    const angle = Math.atan2((target as Entity).y - p.y, (target as Entity).x - p.x);
                    p.dx = Math.cos(angle) * (p.speed || 0); p.dy = Math.sin(angle) * (p.speed || 0);
                }
                p.x += p.dx; p.y += p.dy;
            } else if (['CURRY', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'FOUNTAIN_PEN', 'CLAY'].includes(p.type as string)) {
                if (frameCount.current % 10 === 0) {
                    const color = p.type === 'CURRY' ? '#f97316' : (p.type === 'ART_BRUSH' ? '#f43f5e' : (p.type === 'GLUE_STICK' ? '#60a5fa' : (p.type === 'FOUNTAIN_PEN' ? '#000000' : '#ffffff')));
                    addParticle(p.x + (Math.random()-0.5)*40*p.scale, p.y + (Math.random()-0.5)*40*p.scale, 'BUBBLE', color, { size: 4 * p.scale, life: 20, vy: -1 });
                }
            } else if (WEAPONS[p.type as WeaponType]?.animType === 'SWING' || WEAPONS[p.subType as WeaponType]?.animType === 'SWING') {
                p.x = player.current.x;
                p.y = player.current.y;
            } else if (WEAPONS[p.type as WeaponType]?.animType === 'STAB' || WEAPONS[p.subType as WeaponType]?.animType === 'STAB') {
                const shift = Math.sin(frameCount.current * 0.8) * 30 * p.scale;
                p.x = player.current.x + Math.cos(p.rotation) * (40 * p.scale + shift);
                p.y = player.current.y + Math.sin(p.rotation) * (40 * p.scale + shift);
            } else if (['RECORDER', 'HAND_BELL', 'WHISTLE_S', 'SCHOOL_CHIME', 'BROADCAST_MIC', 'BASKETBALL', 'DUSTER'].includes(p.type as string)) {
                p.x = player.current.x; p.y = player.current.y;
                if (frameCount.current % 20 === 0) {
                    const ringCol = (p.type === 'DUSTER') ? 'gray' : (p.type === 'BROADCAST_MIC' ? '#818cf8' : 'white');
                    addParticle(p.x, p.y, 'RING', ringCol, { scale: p.scale });
                }
            } else {
                p.x += p.dx; p.y += p.dy;
                if (p.type === 'SOCCER') {
                    if (p.x < 0 || p.x > WORLD_WIDTH) { p.dx *= -1; addParticle(p.x, p.y, 'SMOKE', 'white', {size: 8 * p.scale}); }
                    if (p.y < 0 || p.y > WORLD_HEIGHT) { p.dy *= -1; addParticle(p.x, p.y, 'SMOKE', 'white', {size: 8 * p.scale}); }
                }
            }

            let hit = false;
            for (const e of enemies.current) {
                if (p.hitIds.includes(e.id)) continue;
                if (Math.abs(p.x - e.x) > 200 || Math.abs(p.y - e.y) > 200) continue;
                
                let inRange = false;
                const dist = Math.hypot(p.x - e.x, p.y - e.y);

                const animType = WEAPONS[p.type as WeaponType]?.animType || WEAPONS[p.subType as WeaponType]?.animType;

                if (animType === 'SWING') {
                    const range = (p.type === 'CUTTER' || p.subType === 'CUTTER') ? 60 * p.scale : (p.type === 'PROTRACTOR_SWING' || p.subType === 'PROTRACTOR_SWING' ? 90 * p.scale : 100 * p.scale);
                    if (dist < range) {
                        const angleToEnemy = Math.atan2(e.y - p.y, e.x - p.x);
                        let diff = angleToEnemy - p.rotation;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        
                        const arcWidth = (p.type === 'CUTTER' || p.subType === 'CUTTER') ? Math.PI * 0.6 : Math.PI * 1.2;
                        if (Math.abs(diff) < arcWidth / 2) inRange = true;
                    }
                } else if (animType === 'STAB') {
                    if (dist < 50 * p.scale) inRange = true;
                } else if (animType === 'BLAST' || animType === 'CIRCLE') {
                    const blastRange = p.type === 'BROADCAST_MIC' ? 250 : 150;
                    if (dist < blastRange * p.scale) inRange = true;
                } else if (animType === 'BEAM' || p.type === 'TRUMPET') {
                    const angleToEnemy = Math.atan2(e.y - p.y, e.x - p.x);
                    let diff = angleToEnemy - p.rotation;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    const coneWidth = p.type === 'TRUMPET' ? Math.PI * 0.4 : 0.2;
                    if (Math.abs(diff) < coneWidth && dist < 1000) inRange = true;
                } else if (animType === 'RAINBOW') {
                    inRange = true; 
                } else {
                    const range = (p.type === 'RECORDER' || p.type === 'FLASK' || p.type === 'DICTIONARY') ? 60 : 20;
                    if (dist < range * p.scale) inRange = true;
                }

                if (inRange) {
                    if (['HIGHLIGHTER', 'CURRY', 'MAGNIFIER', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'HAND_BELL', 'WHISTLE_S', 'MAGNET_U', 'JUMP_ROPE', 'FOUNTAIN_PEN', 'CLAY', 'PRISM', 'SCHOOL_CHIME', 'BROADCAST_MIC', 'DUSTER'].includes(p.type as string) || ['HIGHLIGHTER', 'CURRY', 'MAGNIFIER', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'HAND_BELL', 'WHISTLE_S', 'MAGNET_U', 'JUMP_ROPE', 'FOUNTAIN_PEN', 'CLAY', 'PRISM', 'SCHOOL_CHIME', 'BROADCAST_MIC', 'DUSTER'].includes(p.subType as string)) {
                        if (frameCount.current % 10 === 0) applyDamage(e, p);
                    } else {
                        applyDamage(e, p);
                        p.penetration--; if (p.penetration <= 0) hit = true;
                    }
                    if (p.type === 'SOCCER') {
                        p.dx = (Math.random() - 0.5) * (p.speed || 0) * 2;
                        p.dy = (Math.random() - 0.5) * (p.speed || 0) * 2;
                        addParticle(p.x, p.y, 'SMOKE', 'white', {size: 10 * p.scale, life: 10});
                    }
                    if (['TAPE', 'GLUE_STICK', 'CLAY'].includes(p.type as string)) { e.frozen = 60; }
                }
            }
            if (hit || p.duration <= 0) projectiles.current.splice(i, 1);
        }

        const spawnRate = Math.max(9,32-Math.floor(time.current/12));
        if(frameCount.current%spawnRate===0&&time.current<300) {
            const fieldEnemy=selectedField.current.enemies[Math.floor(Math.random()*3)];
            spawnEnemy(Math.random()<.8?fieldEnemy:pickEnemyType(time.current));
        }
        projectiles.current=projectiles.current.slice(-450);
        enemyBullets.current=enemyBullets.current.slice(-260);
        damageTexts.current=damageTexts.current.slice(-80);
        // Merge distant XP instead of letting a long run accumulate thousands of objects.
        if(gems.current.length>350){const kept=gems.current.slice(-349);kept[0].value+=gems.current.slice(0,-349).reduce((n,g)=>n+g.value,0);gems.current=kept;}

        enemies.current = enemies.current.filter(e => !e.dead);
        if(gameState.current!=='PLAYING')return;
        for (let i = gems.current.length - 1; i >= 0; i--) {
            const g = gems.current[i];
            const dist = Math.hypot(g.x - player.current.x, g.y - player.current.y);
            if (dist < magnet) { g.x += (player.current.x - g.x) * 0.1; g.y += (player.current.y - g.y) * 0.1; }
            if (dist < 20) {
                xp.current += g.value; gems.current.splice(i, 1);
                if (xp.current >= nextLevelXp.current) { gameState.current = 'MATH_CHALLENGE'; xp.current -= nextLevelXp.current; level.current++; nextLevelXp.current = Math.floor(nextLevelXp.current * 1.25); audioService.playSound('select'); clearInput(); }
                setUiState(prev => ({ ...prev, level: level.current, xpPercent: (xp.current/nextLevelXp.current)*100 }));
                if(gameState.current!=='PLAYING')break;
            }
        }

        damageTexts.current.forEach(d => { d.y -= 1; d.life--; });
        damageTexts.current = damageTexts.current.filter(d => d.life > 0);
        
        particles.current.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.type === 'BUBBLE') p.vx += (Math.random()-0.5)*0.2;
            if (['RING', 'GLOW', 'RAINBOW'].includes(p.type)) { p.size += 2; }
            p.life--;
        });
        particles.current = particles.current.filter(p => p.life > 0);
        if (shakeAmount.current > 0) shakeAmount.current *= 0.85;

        if (frameCount.current % 10 === 0) {
            setUiState(prev => ({ ...prev, hp: player.current.hp }));
        }
    };

    const applyDamage = (e: Entity, p: Projectile) => {
        let dmg = Math.max(1, p.damage - (e.defense || 0));
        const isCrit = Math.random() < (0.05 * (passivesRef.current.CONSOLE ? 2 : 1));
        if (isCrit) {
            dmg *= 2.5;
            damageTexts.current.push({ id: Math.random(), x: e.x, y: e.y-15, value: `${Math.floor(dmg)}!`, color: '#fbbf24', life: 50 });
            shakeAmount.current = 6;
        } else {
            damageTexts.current.push({ id: Math.random(), x: e.x, y: e.y-10, value: Math.floor(dmg), color: 'white', life: 35 });
        }
        
        e.hp -= dmg; e.flashTime = 5; p.hitIds.push(e.id);
        
        if (p.knockback > 0 && !e.knockbackImmune) {
            const angle = Math.atan2(e.y - p.y, e.x - p.x);
            e.knockback = { x: Math.cos(angle)*p.knockback, y: Math.sin(angle)*p.knockback, time: 5 };
        } else if (p.knockback > 0 && e.knockbackImmune) {
            damageTexts.current.push({ id: Math.random(), x: e.x + 10, y: e.y - 5, value: "!", color: '#94a3b8', life: 20 });
        }

        const sparkCount = isCrit ? 7 : 2;
        for(let i=0; i<sparkCount; i++) addParticle(e.x, e.y, 'SPARK', isCrit ? '#fbbf24' : (WEAPONS[p.type as WeaponType]?.sprite.color || 'white'), { life: 25, size: (isCrit ? 5 : 2.5) * p.scale });

        if (e.hp <= 0 && !e.dead) {
            e.dead = true; score.current += e.boss?1500:15;
            action.current.kills++;action.current.burst=Math.min(100,action.current.burst+(e.boss?35:2.5));
            if(action.current.kills%8===0||e.boss)addFx(e.x,e.y,e.boss?'NOVA':'SPARK',e.boss?350:75,e.boss?60:25);
            if(e.boss){player.current.hp=Math.min(player.current.maxHp,player.current.hp+35);enemyBullets.current=[];gems.current.forEach(g=>{g.x=player.current.x;g.y=player.current.y;});}
            if(e.finalBoss)finishVictory();
            const gemVal = e.xpValue || (e.type === 'ENEMY_6' || e.type === 'ENEMY_7' ? 10 : 1);
            if (e.boss || Math.random() < 0.85) gems.current.push({ id: Math.random(), x: e.x, y: e.y, value: gemVal, collected: false });
            for(let i=0; i<5; i++) addParticle(e.x,e.y,'SPARK',WEAPONS[(p.subType||p.type) as WeaponType]?.sprite.color||'#8ee9ea',{size:Math.random()*3+1,life:22,maxLife:22});
            shakeAmount.current = 3;
        }
    };

    const fireWeapon = (type: WeaponType, level: number, evolved: boolean, dmg: number, scale: number, speed: number, duration: number, amount: number, luck: number) => {
        const p = player.current;
        const anim=WEAPONS[type].animType;
        if(['SWING','CIRCLE','BLAST','RAINBOW','BEAM'].includes(anim))addFx(p.x,p.y,anim==='SWING'?'SLASH':anim==='BEAM'?'LIGHTNING':'RUNE',anim==='SWING'?190*scale:120*scale,28,Math.atan2(lastDir.current.y,lastDir.current.x));
        const count = 1 + amount + Math.floor(level/3); 
        if (Math.random() < 0.3 && gameState.current === 'PLAYING') audioService.playSound('attack');
        
        const angleToMove = Math.atan2(lastDir.current.y, lastDir.current.x);

        switch (type) {
            case 'PENCIL':
                let target = null; let min = 9999;
                enemies.current.forEach(e => { const d = Math.hypot(e.x-p.x, e.y-p.y); if(d<min){ min=d; target=e; } });
                if (target) {
                    const angle = Math.atan2((target as Entity).y - p.y, (target as Entity).x - p.x);
                    const volleys = evolved ? 4 : 1; 
                    for(let v=0; v<volleys; v++) {
                        scheduleShot(() => {
                            if (gameState.current === 'PLAYING') {
                                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(angle + (Math.random()-0.5)*0.2) * speed * (evolved?2.5:1), dy: Math.sin(angle + (Math.random()-0.5)*0.2) * speed * (evolved?2.5:1), damage: dmg, type: evolved ? 'EVOLVED' : 'PENCIL', subType: 'PENCIL', duration: 60, maxDuration: 60, penetration: evolved ? 5 : 1 + Math.floor(level/4), rotation: angle, scale: scale, knockback: 2, hitIds: [] });
                            }
                        }, v * 80);

                    }
                }
                break;
            case 'DICTIONARY':
                const dAngle = Math.random() * Math.PI * 2;
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(dAngle)*speed*0.6, dy: Math.sin(dAngle)*speed*0.6, damage: dmg*3, type: evolved ? 'EVOLVED' : 'DICTIONARY', subType: 'DICTIONARY', duration: 100, maxDuration: 100, penetration: 999, rotation: dAngle, scale: scale*2, knockback: 15, hitIds: [] });
                break;
            case 'ERASER':
            case 'LUNCH_TRAY':
                for (let i=0; i<count+2; i++) {
                    projectiles.current.push({ id: i, x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 120 * duration, maxDuration: 120 * duration, penetration: 999, rotation: 0, scale: scale * (evolved?2:1), knockback: 6, hitIds: [] });
                }
                break;
            case 'PAPER_PLANE_S':
                for(let i=0; i<count; i++) {
                    const pAngle = angleToMove + (Math.random()-0.5)*0.8;
                    projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(pAngle)*speed*1.5, dy: Math.sin(pAngle)*speed*1.5, damage: dmg*0.7, type: evolved ? 'EVOLVED' : 'PAPER_PLANE_S', subType: 'PAPER_PLANE_S', duration: 100, maxDuration: 100, penetration: evolved?99:3, rotation: pAngle, scale: scale, knockback: 2, hitIds: [], speed: speed*1.5 });
                }
                break;
            case 'RULER':
            case 'MOP':
            case 'CUTTER':
            case 'PROTRACTOR_SWING':
            case 'SCISSORS':
                const swingCount = (type === 'SCISSORS' || evolved) ? 2 : 1;
                for(let s=0; s<swingCount; s++) {
                    scheduleShot(() => {
                        if (gameState.current === 'PLAYING') {
                            const offset = (s % 2 === 0) ? 0 : Math.PI;
                            projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg * (type==='CUTTER'?2.5:1), type: evolved ? 'EVOLVED' : type, subType: type, duration: 25, maxDuration: 25, penetration: 999, rotation: angleToMove + offset, scale: scale * 1.5, knockback: 10, hitIds: [] });
                        }
                    }, s * 150);

                }
                break;
            case 'HIGHLIGHTER':
            case 'TRUMPET':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg/4, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 40 * duration, maxDuration: 40 * duration, penetration: 999, rotation: angleToMove, scale: scale * (evolved?2.5:1), knockback: 0, hitIds: [] });
                break;
            case 'STAPLER':
                for(let i=0; i<count+3; i++) {
                    scheduleShot(() => {
                        if (gameState.current === 'PLAYING') {
                            const spread = evolved ? Math.PI * 2 * Math.random() : angleToMove + (Math.random()-0.5)*0.5;
                            projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(spread)*speed*2, dy: Math.sin(spread)*speed*2, damage: dmg*0.8, type: evolved ? 'EVOLVED' : 'STAPLER', subType: 'STAPLER', duration: 40, maxDuration: 40, penetration: 1, rotation: spread, scale: scale*0.5, knockback: 1, hitIds: [] });
                        }
                    }, i * 50);

                }
                break;
            case 'GLOBE':
                for (let i=0; i<count+1; i++) {
                    projectiles.current.push({ id: i, x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg * 1.5, type: evolved ? 'EVOLVED' : 'GLOBE', subType: 'GLOBE', duration: 300 * duration, maxDuration: 300 * duration, penetration: 999, rotation: 0, scale: scale * 1.2, knockback: 15, hitIds: [] });
                }
                break;
            case 'MAGNET_U':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg/5, type: evolved ? 'EVOLVED' : 'MAGNET_U', subType: 'MAGNET_U', duration: 150, maxDuration: 150, penetration: 999, rotation: 0, scale: scale, knockback: 0, hitIds: [] });
                break;
            case 'COMPASS_SPIKE':
            case 'STAPLE_REMOVER':
            case 'TROWEL':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg*2, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 30, maxDuration: 30, penetration: 999, rotation: angleToMove, scale: scale, knockback: 5, hitIds: [] });
                break;
            case 'RECORDER':
            case 'HAND_BELL':
            case 'WHISTLE_S':
            case 'SCHOOL_CHIME':
            case 'BROADCAST_MIC':
            case 'BASKETBALL':
            case 'DUSTER':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 20, maxDuration: 20, penetration: 999, rotation: 0, scale: scale, knockback: 20, hitIds: [] });
                break;
            case 'SOCCER':
                for(let i=0; i<count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(angle)*speed, dy: Math.sin(angle)*speed, damage: dmg, type: evolved ? 'EVOLVED' : 'SOCCER', subType: 'SOCCER', duration: 150 * duration, maxDuration: 150 * duration, penetration: evolved ? 999 : 5 + Math.floor(level/2), rotation: 0, scale: scale, knockback: 8, hitIds: [], speed: speed });
                }
                break;
            case 'JUMP_ROPE':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg, type: evolved ? 'EVOLVED' : 'JUMP_ROPE', subType: 'JUMP_ROPE', duration: 200, maxDuration: 200, penetration: 999, rotation: 0, scale: scale, knockback: 5, hitIds: [] });
                break;
            case 'TAPE':
                const tapeAngle = Math.random() * Math.PI * 2;
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(tapeAngle)*speed, dy: Math.sin(tapeAngle)*speed, damage: 5, type: evolved ? 'EVOLVED' : 'TAPE', subType: 'TAPE', duration: 100, maxDuration: 100, penetration: 999, rotation: tapeAngle, scale: scale*2, knockback: 0, hitIds: [] });
                break;
            case 'CHALK_SMOKE':
            case 'ART_BRUSH':
            case 'CURRY':
            case 'GLUE_STICK':
            case 'FOUNTAIN_PEN':
            case 'CLAY':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg/8, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 400 * duration, maxDuration: 400 * duration, penetration: 999, rotation: 0, scale: scale * 2.2, knockback: 0, hitIds: [] });
                break;
            case 'PRISM':
                const prismCount = count + 4;
                for(let i=0; i<prismCount; i++) {
                    const rot = (Math.PI * 2 / prismCount) * i + (frameCount.current * 0.05);
                    projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg/5, type: evolved ? 'EVOLVED' : 'PRISM', subType: 'PRISM', duration: 30 * duration, maxDuration: 30 * duration, penetration: 999, rotation: rot, scale: scale, knockback: 0, hitIds: [] });
                }
                break;
            default:
                const genAngle = Math.random() * Math.PI * 2;
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(genAngle)*speed, dy: Math.sin(genAngle)*speed, damage: dmg, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 60, maxDuration: 60, penetration: 1, rotation: genAngle, scale: scale, knockback: 2, hitIds: [] });
        }
    };

    const draw = () => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const { width: viewW, height: viewH } = viewSizeRef.current;
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, viewW, viewH);
        ctx.save();
        
        if (shakeAmount.current > 0.1 && !reducedMotion.current) {
            ctx.translate((Math.random()-0.5)*shakeAmount.current, (Math.random()-0.5)*shakeAmount.current);
        }

        ctx.translate(viewW/2, viewH/2);
        ctx.scale(ZOOM_SCALE, ZOOM_SCALE);
        ctx.translate(-camera.current.x, -camera.current.y);

        if (bgCanvasRef.current) ctx.drawImage(bgCanvasRef.current, 0, 0);

        obstacles.current.forEach(o=>{
            const sprite=spriteCache.current[o.kind];
            ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(o.x+6,o.y+12,o.w*.62,o.h*.65,0,0,Math.PI*2);ctx.fill();
            if(sprite){const size=o.kind==='TREE'?115:o.kind==='BENCH'?125:105;ctx.drawImage(sprite,o.x-size/2,o.y-size/2-10,size,size);}
        });
        hazards.current.forEach(h=>{ctx.save();ctx.fillStyle=h.age<90?'rgba(255,80,120,.12)':'rgba(255,180,190,.35)';ctx.strokeStyle='#ff7898';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.arc(h.x,h.y,h.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(h.x,h.y,h.radius*Math.min(1,h.age/90),0,Math.PI*2);ctx.stroke();ctx.restore();});
        gems.current.forEach(g => {
            if (Math.abs(g.x - camera.current.x) > (viewW/ZOOM_SCALE) || Math.abs(g.y - camera.current.y) > (viewH/ZOOM_SCALE)) return;
            const sprite = spriteCache.current['XP_GEM'] || spriteCache.current['GEM'];
            if(sprite) ctx.drawImage(sprite, g.x-8, g.y-8, 16, 16);
        });

        enemyBullets.current.forEach(b => {
            if (Math.abs(b.x - camera.current.x) > (viewW/ZOOM_SCALE + 60) || Math.abs(b.y - camera.current.y) > (viewH/ZOOM_SCALE + 60)) return;
            const sprite = spriteCache.current[b.spriteKey];
            ctx.save();
            ctx.translate(b.x, b.y);
            if (!b.persistent) ctx.rotate(Math.atan2(b.dy, b.dx));
            if (sprite) {
                const size = Math.max(16, b.radius * 2);
                ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
            } else {
                ctx.fillStyle = b.color;
                ctx.beginPath();
                ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            if (b.persistent) {
                ctx.globalAlpha = Math.max(0.2, Math.min(0.65, b.duration / 240));
                ctx.strokeStyle = b.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, b.radius + Math.sin(frameCount.current * 0.15) * 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        });

        projectiles.current.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            const weaponKey = p.type === 'EVOLVED' ? (p.subType || 'PENCIL') : p.type;
            const animType = WEAPONS[weaponKey as WeaponType]?.animType;

            if (animType === 'SWING') {
                const lifeRatio = p.duration / p.maxDuration;
                const arcWidth = (weaponKey === 'CUTTER') ? Math.PI * 0.7 : (weaponKey === 'PROTRACTOR_SWING' ? Math.PI * 1.6 : Math.PI * 1.3);
                const range = (weaponKey === 'CUTTER') ? 65 * p.scale : (weaponKey === 'PROTRACTOR_SWING' ? 95 * p.scale : 110 * p.scale);
                
                ctx.globalAlpha = lifeRatio;
                ctx.globalCompositeOperation = 'lighter';
                
                ctx.beginPath();
                ctx.arc(0, 0, range, -arcWidth/2, arcWidth/2);
                
                const grad = ctx.createRadialGradient(0,0, range * 0.3, 0,0, range);
                const baseCol = WEAPONS[weaponKey as WeaponType]?.sprite.color || 'white';
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.7, baseCol + '44');
                grad.addColorStop(1, 'white');
                
                ctx.strokeStyle = grad;
                ctx.lineWidth = ((weaponKey === 'MOP') ? 30 : 18) * p.scale; 
                ctx.lineCap = 'round';
                ctx.stroke();

                if (frameCount.current % 2 === 0) {
                    const sparkAngle = (Math.random() - 0.5) * arcWidth;
                    addParticle(p.x + Math.cos(p.rotation + sparkAngle) * range, p.y + Math.sin(p.rotation + sparkAngle) * range, 'SLASH_TRACE', baseCol, { life: 8, size: 3 * p.scale });
                }
                ctx.globalCompositeOperation = 'source-over';
            } else if (['HIGHLIGHTER', 'TRUMPET', 'PRISM'].includes(animType as string) || ['HIGHLIGHTER', 'TRUMPET', 'PRISM'].includes(weaponKey as string)) {
                const isEv = p.type === 'EVOLVED';
                const pulse = Math.sin(frameCount.current * 0.4) * 0.3 + 0.7;
                
                ctx.globalCompositeOperation = 'lighter';
                const grad = ctx.createLinearGradient(0, -25 * p.scale, 0, 25 * p.scale);
                
                if (weaponKey === 'PRISM') {
                    const hue = (frameCount.current * 15 + p.id * 50) % 360;
                    grad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0)`);
                    grad.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${0.5 * pulse})`);
                    grad.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
                } else {
                    let rgb = isEv ? '255, 100, 255' : '200, 255, 100';
                    if (weaponKey === 'TRUMPET') rgb = '251, 191, 36';
                    grad.addColorStop(0, `rgba(${rgb}, 0)`);
                    grad.addColorStop(0.5, `rgba(${rgb}, ${0.5 * pulse})`);
                    grad.addColorStop(1, `rgba(${rgb}, 0)`);
                }
                
                ctx.fillStyle = grad;
                const beamLen = (weaponKey === 'TRUMPET') ? 300 * p.scale : 1000;
                ctx.fillRect(0, -25 * p.scale, beamLen, 50 * p.scale);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, -3 * p.scale, beamLen, 6 * p.scale);
                ctx.globalCompositeOperation = 'source-over';
            } else if (['RECORDER', 'SCHOOL_CHIME', 'BROADCAST_MIC', 'BASKETBALL', 'DUSTER'].includes(weaponKey as string)) {
                const ringCol = weaponKey === 'BASKETBALL' ? 'rgba(249,115,22,0.5)' : (weaponKey === 'DUSTER' ? 'rgba(150,150,150,0.5)' : 'rgba(255,255,255,0.5)');
                const progress = Math.max(0, 1 - p.duration / p.maxDuration);
                const radius = progress * (weaponKey === 'BROADCAST_MIC' ? 300 : 150) * p.scale; 
                ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2);
                ctx.strokeStyle = ringCol; ctx.lineWidth = 5 * p.scale; ctx.stroke();
            } else if (['CURRY', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'FOUNTAIN_PEN', 'CLAY'].includes(p.type as string) || ['CURRY', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'FOUNTAIN_PEN', 'CLAY'].includes(p.subType as string)) {
                const color = p.type === 'CURRY' ? 'rgba(255,120,0,0.4)' : (p.type === 'ART_BRUSH' ? 'rgba(244,63,94,0.4)' : (p.type === 'GLUE_STICK' ? 'rgba(96,165,250,0.4)' : (p.type === 'FOUNTAIN_PEN' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.3)')));
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(0,0, 30*p.scale, 0, Math.PI*2); ctx.fill();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath(); ctx.arc(0,0, 35*p.scale, 0, Math.PI*2); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            } else {
                let spriteKey = p.type === 'EVOLVED' ? (p.subType || 'PENCIL') : p.type;
                const sprite = spriteCache.current[spriteKey];
                if (sprite) {
                    const size = 36 * p.scale;
                    if (['TRIANGLE_RULER_S', 'LUNCH_TRAY'].includes(p.type as string) || ['TRIANGLE_RULER_S', 'LUNCH_TRAY'].includes(p.subType as string)) {
                        ctx.rotate(frameCount.current * 0.5);
                    }
                    ctx.drawImage(sprite, -size/2, -size/2, size, size);
                }
            }
            // All attacks carry a visible Blender-forged weapon, including beam and melee weapons.
            if(animType!=='PROJECTILE'&&spriteCache.current[weaponKey])ctx.drawImage(spriteCache.current[weaponKey],-18*p.scale,-18*p.scale,36*p.scale,36*p.scale);
            ctx.restore();
        });

        enemies.current.forEach(e => {
            if (Math.abs(e.x - camera.current.x) > (viewW/ZOOM_SCALE + 50) || Math.abs(e.y - camera.current.y) > (viewH/ZOOM_SCALE + 50)) return;
            const spriteKey = e.flashTime > 0 ? `${e.type}_FLASH` : e.type;
            const sprite = spriteCache.current[spriteKey] || spriteCache.current['ENEMY_1'];
            if (sprite) { 
                const size = Math.max(e.width, e.height); 
                ctx.save();
                if (e.frozen) ctx.filter = 'hue-rotate(180deg) brightness(1.5)';
                if(e.attackKind==='DASH'&&(e.attackCooldown||0)<32){ctx.strokeStyle='#ff668d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x,e.y);const a=Math.atan2(player.current.y-e.y,player.current.x-e.x);ctx.lineTo(e.x+Math.cos(a)*120,e.y+Math.sin(a)*120);ctx.stroke();}
                ctx.drawImage(sprite, e.x - size*.65, e.y - size*.65, size * 1.3, size * 1.3);
                if(e.hp<e.maxHp){ctx.fillStyle='#18253b';ctx.fillRect(e.x-size/2,e.y+size*.55,size,3);ctx.fillStyle=e.boss?'#ffc36b':'#ff7a9f';ctx.fillRect(e.x-size/2,e.y+size*.55,size*Math.max(0,e.hp/e.maxHp),3);}
                ctx.restore();
            }
        });

        magicFx.current.forEach(fx=>{const frame=Math.min(7,Math.floor(fx.age/fx.life*8));const sprite=spriteCache.current[`${fx.kind}_${frame}`];if(!sprite)return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,(fx.life-fx.age)/10);ctx.translate(fx.x,fx.y);ctx.rotate(fx.angle);ctx.drawImage(sprite,-fx.size/2,-fx.size/2,fx.size,fx.size);ctx.restore();});

        particles.current.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            if (p.type === 'RING') {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.scale || 1), 0, Math.PI*2);
                ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.stroke();
            } else if (['GLOW', 'RAINBOW'].includes(p.type)) {
                ctx.globalCompositeOperation = 'lighter';
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        });
        const heroImage=heroImages.current[selectedHero.current.id];
        const direction=lastDir.current;const sx=Math.sign(direction.x),sy=Math.sign(direction.y);
        const frame=sy>0?(sx>0?4:sx<0?5:0):sy<0?(sx>0?6:sx<0?7:1):sx>0?2:sx<0?3:0;
        ctx.save();
        ctx.strokeStyle=action.current.burstTime>0?'#ffdb9b':'#8dfff0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(player.current.x,player.current.y+16,19,9,0,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(player.current.x,player.current.y+16,15,6,0,0,Math.PI*2);ctx.fill();
        if(player.current.flashTime>0)ctx.globalAlpha=frameCount.current%6<3?.6:1;
        if(heroImage?.complete&&heroImage.naturalWidth){const cw=heroImage.naturalWidth/4,ch=heroImage.naturalHeight/2;const bob=gameState.current==='PLAYING'?Math.sin(frameCount.current*.2)*1.5:0;ctx.shadowColor='#071d30';ctx.shadowBlur=4;ctx.drawImage(heroImage,frame%4*cw,Math.floor(frame/4)*ch,cw,ch,player.current.x-30,player.current.y-34+bob,60,60);}
        ctx.restore();
        ctx.globalAlpha = 1.0;

        ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
        damageTexts.current.forEach(d => {
            const ratio = d.life / 40;
            const scale = ratio > 0.7 ? 1 + (1 - ratio) * 3 : 1;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.scale(scale, scale);
            ctx.fillStyle = d.color;
            ctx.strokeStyle = 'black'; ctx.lineWidth = 4; ctx.strokeText(d.value.toString(), 0, 0);
            ctx.fillText(d.value.toString(), 0, 0);
            ctx.restore();
        });

        ctx.restore();
    };

    const generateUpgrades = () => {
        const candidates: any[] = [];
        const wKeys = Object.keys(WEAPONS) as WeaponType[];
        const pKeys = Object.keys(PASSIVES) as PassiveType[];
        
        wKeys.forEach(key => {
            const wData = weaponsRef.current[key];
            if (wData && wData.level >= 8 && passivesRef.current[WEAPONS[key].synergy] > 0 && wData.level === 8) candidates.push({ type: 'WEAPON', id: key, isEvo: true });
        });
        wKeys.forEach(key => {
            const wData = weaponsRef.current[key];
            if (!wData) { if (Object.values(weaponsRef.current).filter(v => v !== undefined).length < 8) candidates.push({ type: 'WEAPON', id: key, isNew: true }); }
            else if (wData.level < 8) candidates.push({ type: 'WEAPON', id: key, level: wData.level + 1 });
        });
        pKeys.forEach(key => {
            const level = passivesRef.current[key];
            if (level === 0) { if (Object.values(passivesRef.current).filter((v: number) => v > 0).length < 8) candidates.push({ type: 'PASSIVE', id: key, isNew: true }); }
            else if (level < 5) candidates.push({ type: 'PASSIVE', id: key, level: level + 1 });
        });

        const weightedPool: any[] = [];
        candidates.forEach(opt => {
            const isOwned = (opt.type === 'WEAPON' && weaponsRef.current[opt.id as WeaponType] !== undefined) ||
                          (opt.type === 'PASSIVE' && passivesRef.current[opt.id as PassiveType] > 0);
            
            const weight = isOwned ? 3 : 1; 
            for (let i = 0; i < weight; i++) {
                weightedPool.push(opt);
            }
        });

        const picks = [];
        const count = Math.min(3, candidates.length);
        
        while (picks.length < count && weightedPool.length > 0) {
            const idx = Math.floor(Math.random() * weightedPool.length);
            const selected = weightedPool[idx];
            picks.push(selected);
            for (let i = weightedPool.length - 1; i >= 0; i--) {
                if (weightedPool[i].id === selected.id && weightedPool[i].type === selected.type) {
                    weightedPool.splice(i, 1);
                }
            }
        }

        if (picks.length < 3) picks.push({ type: 'HEAL', id: 'HEAL' });
        if (!debugPreview) {
            picks.forEach(option => {
                if (option.type === 'WEAPON') storageService.markMiniGameDiscovered('SURVIVOR', `survivor-weapon-${option.id}`);
                if (option.type === 'PASSIVE') storageService.markMiniGameDiscovered('SURVIVOR', `survivor-passive-${option.id}`);
            });
        }
        setUpgradeOptions(picks);
    };

    const selectUpgrade = (opt: any) => {
        if (!debugPreview && opt.type === 'WEAPON') storageService.markMiniGameDiscovered('SURVIVOR', `survivor-weapon-${opt.id}`);
        if (!debugPreview && opt.type === 'PASSIVE') storageService.markMiniGameDiscovered('SURVIVOR', `survivor-passive-${opt.id}`);
        if (opt.type === 'WEAPON') { const key = opt.id as WeaponType; const current = weapons[key]; setWeapons(prev => ({ ...prev, [key]: current ? { ...current, level: current.level + 1 } : { level: 1, cooldownTimer: 0 } })); }
        else if (opt.type === 'PASSIVE') { const key = opt.id as PassiveType; setPassives(prev => ({ ...prev, [key]: prev[key] + 1 })); }
        else if (opt.type === 'HEAL') { player.current.hp = Math.min(player.current.maxHp, player.current.hp + 50); }
        audioService.playSound('buff'); gameState.current = 'PLAYING';
    };

    const handleRestart = () => {
        clearAllTimeouts();clearInput();
        burstCutinFrames.current=0;setBurstCutin(null);preloadSurvivorBurst(selectedHero.current.id);
        action.current={dash:0,dashTime:0,burst:0,burstTime:0,kills:0,wave:1,banner:180,bossSpawn:0,victory:false};
        magicFx.current=[];hazards.current=[];shakeAmount.current=0;
        obstacles.current=createObstacles(selectedField.current);bgCanvasRef.current=createFieldCanvas(selectedField.current);
        setBattleUi({dash:0,burst:0,kills:0,wave:1,banner:180,boss:0,bossMax:1,victory:false});
        setPaused(false);setInLobby(false);
        player.current = { ...player.current, x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, hp: selectedHero.current.hp, maxHp:selectedHero.current.hp, speed:selectedHero.current.speed, flashTime:0, dead: false };
        camera.current = { x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2 };
        enemies.current = []; projectiles.current = []; enemyBullets.current = []; gems.current = []; damageTexts.current = []; particles.current = [];
        score.current = 0; time.current = 0; frameCount.current = 0; level.current = 1; xp.current = 0; nextLevelXp.current = BASE_XP_REQUIREMENT;
        setWeapons(() => {
            const initial: any = {};
            Object.keys(WEAPONS).forEach(k => initial[k] = undefined);
            initial[selectedHero.current.starter] = { level: 2, cooldownTimer: 0 };
            initial.ERASER = {level:1,cooldownTimer:0};
            weaponsRef.current=initial;
            return initial;
        });
        passivesRef.current={ PROTEIN:0,DRILL:0,PROTRACTOR:0,SHOES:0,PAD:0,LUNCHBOX:0,MAGNET:0,TEXTBOOK:0,ABACUS:0,CONSOLE:0,MILK:0,ORIGAMI:0 };
        setPassives({ PROTEIN: 0, DRILL: 0, PROTRACTOR: 0, SHOES: 0, PAD: 0, LUNCHBOX: 0, MAGNET: 0, TEXTBOOK: 0, ABACUS: 0, CONSOLE: 0, MILK: 0, ORIGAMI: 0 });
        setUiState({ hp: selectedHero.current.hp, maxHp: selectedHero.current.hp, level: 1, time: 0, score: 0, xpPercent: 0, gameOver: false });
        if(!debugPreview){storageService.markMiniGameDiscovered('SURVIVOR',`survivor-weapon-${selectedHero.current.starter}`);storageService.markMiniGameDiscovered('SURVIVOR','survivor-weapon-ERASER');}
        gameState.current = 'PLAYING'; audioService.playBGM('survivor_metal');
    };

    const onTouchStart = (e:React.TouchEvent) => {
        if(gameState.current!=='PLAYING'||touchAnchor.current||(e.target as Element).closest('button'))return;
        const t=e.changedTouches[0]||e.touches[0];if(!t)return;
        touchAnchor.current={id:t.identifier,x:t.clientX,y:t.clientY};
        const rect=containerRef.current!.getBoundingClientRect(),x=t.clientX-rect.left,y=t.clientY-rect.top;
        setJoystickUI({active:true,startX:x,startY:y,curX:x,curY:y});joystickRef.current={x:0,y:0};
    };
    const onTouchMove = (e:React.TouchEvent) => {
        const anchor=touchAnchor.current;if(!anchor)return;
        const t=Array.from(e.touches).find(t=>t.identifier===anchor.id);if(!t)return;
        const dx=t.clientX-anchor.x,dy=t.clientY-anchor.y,d=Math.hypot(dx,dy),scale=d>50?50/d:1;
        joystickRef.current={x:dx/50,y:dy/50};
        setJoystickUI(prev=>prev?{...prev,curX:prev.startX+dx*scale,curY:prev.startY+dy*scale}:null);
    };
    const onTouchEnd = (e:React.TouchEvent) => {
        if(touchAnchor.current&&Array.from(e.touches).some(t=>t.identifier===touchAnchor.current!.id))return;
        touchAnchor.current=null;setJoystickUI(null);joystickRef.current={x:0,y:0};
    };

    return (
        <div data-gamepad-survivor-live={gameState.current==='PLAYING'?'true':undefined} style={{touchAction:inLobby?'pan-y':'none'}} className="mini-game-survivor-screen sy-screen flex flex-col h-full w-full bg-[#020617] text-white relative items-center justify-center font-mono overflow-hidden touch-none select-none" ref={containerRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
            {!inLobby&&<div className="sy-hud">
                <div className="sy-vitals"><HeroPortrait id={selectedHero.current.id}/><div><strong>LV {uiState.level} <span>HP {Math.max(0,Math.ceil(uiState.hp))}/{uiState.maxHp}</span></strong><div className="sy-meter sy-hp"><i style={{width:`${Math.max(0,uiState.hp/uiState.maxHp*100)}%`}}/></div><div className="sy-meter sy-xp"><i style={{width:`${uiState.xpPercent}%`}}/></div></div></div>
                <div className="sy-clock"><strong>{Math.floor(uiState.time/60).toString().padStart(2,'0')}:{(uiState.time%60).toString().padStart(2,'0')}</strong><small>WAVE {battleUi.wave} · {battleUi.kills} K.O.</small></div>
                <div className="sy-equipment">{(Object.keys(weapons) as WeaponType[]).filter(k=>weapons[k]).map(k=><div key={k} title={tr(WEAPONS[k].name)}><span style={getSpriteSheetIconStyle('schoolyard-survivor/weapons.webp',SCHOOLYARD_WEAPON_ASSET_KEYS,k)}/><small>{weapons[k]!.level}</small></div>)}</div>
            </div>}
            {!inLobby&&battleUi.boss>0&&<div className="sy-bossbar"><strong>{l('終業の鐘・ベルコロッサス','BELL COLOSSUS','しゅうぎょうの かね・ベルコロッサス')}</strong><div className="sy-meter"><i style={{width:`${Math.max(0,battleUi.boss/battleUi.bossMax*100)}%`}}/></div></div>}
            {!inLobby&&battleUi.banner>0&&!uiState.gameOver&&<div className="sy-wave-banner" key={battleUi.wave}>{battleUi.boss>0?'BOSS INCOMING':`WAVE ${battleUi.wave}`}<small>{l(selectedField.current.name[0],selectedField.current.name[1],selectedField.current.name[2])}</small></div>}
            <canvas ref={canvasRef} width={viewSize.width} height={viewSize.height} className="block w-full h-full bg-[#020617]" style={{ imageRendering: 'auto' }} />
            {!inLobby&&!uiState.gameOver&&burstCutin&&<SurvivorBurstCutin key={burstCutin.id} heroId={burstCutin.heroId} paused={gameState.current!=='PLAYING'} languageMode={languageMode}/>}
            {gameState.current === 'MATH_CHALLENGE' && (<div className="absolute inset-0 z-30 pointer-events-auto"><MiniGameProblemChallenge mode={problemMode} modePool={problemModePool} answerMode={answerMode} assignment={assignment} onAnswerResult={onAnswerResult} onComplete={handleMathComplete} rewardHint={tr('全問正解でHP15回復')} languageMode={languageMode} /></div>)}
            {gameState.current === 'LEVEL_UP' && (
                <div data-gamepad-modal data-gamepad-initial-scope={`survivor-level-up-${uiState.level}`} className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-20 animate-in zoom-in duration-250 pointer-events-auto p-4">
                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-orange-500 mb-8 animate-pulse italic">LEVEL UP!</h2>
                    <div className="grid grid-cols-1 gap-4 w-full max-md overflow-y-auto max-h-[70vh] p-2 custom-scrollbar">
                        {upgradeOptions.map((opt, idx) => {
                            let itemDef: any = opt.type === 'WEAPON' ? WEAPONS[opt.id as WeaponType] : (opt.type === 'PASSIVE' ? PASSIVES[opt.id as PassiveType] : { name: '特別給食', desc: 'HP 50回復', sprite: { template: 'POTION', color: '#f472b6' } });
                            let isEvo = opt.isEvo;
                            const weaponIconStyle = opt.type === 'WEAPON'
                                ? getSpriteSheetIconStyle('schoolyard-survivor/weapons.webp', SCHOOLYARD_WEAPON_ASSET_KEYS, opt.id)
                                : undefined;
                            return (
                                <button key={idx} data-gamepad-initial-choice onClick={() => selectUpgrade(opt)} className={`bg-slate-900 border-4 ${isEvo ? 'border-yellow-400 bg-yellow-900/40 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'border-slate-700'} hover:border-blue-400 hover:bg-slate-800 p-4 rounded-2xl flex items-center text-left transition-all group relative overflow-hidden shadow-2xl`}><div className={`w-16 h-16 bg-black/60 mr-4 ${isEvo ? 'animate-bounce' : ''} shrink-0 p-2 border-2 border-slate-600 rounded-xl shadow-inner`}>{weaponIconStyle ? <div className="w-full h-full" style={weaponIconStyle} /> : <PixelSprite seed={opt.id} name={`${itemDef.sprite.template}|${itemDef.sprite.color}`} className="w-full h-full"/>}</div><div className="flex-1"><div className="flex justify-between items-center mb-1"><div className={`text-xl font-black leading-tight ${isEvo ? 'text-yellow-300' : 'text-white'}`}>{tr(isEvo ? itemDef.evolvedName : itemDef.name)}</div><div className="text-[10px] text-blue-300 font-black bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/50 uppercase">{opt.isNew ? tr('New Weapon') : (opt.type === 'HEAL' ? tr('Bonus') : `Lv ${opt.level || 'Master'}`)}</div></div><div className="text-xs text-gray-300 leading-snug font-bold">{tr(isEvo ? itemDef.evolvedDesc : itemDef.desc)}</div>{opt.type === 'WEAPON' && !isEvo && <div className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1 font-black"><Sparkles size={10}/> {tr('SYNERGY')}: {tr(PASSIVES[itemDef.synergy as PassiveType].name)}</div>}</div>{isEvo && <div className="absolute top-0 right-0 bg-gradient-to-b from-yellow-400 to-orange-600 text-black text-[10px] font-black px-4 py-1 rounded-bl-xl shadow-lg">{tr('協助進化')}</div>}</button>
                            );
                        })}
                    </div>
                </div>
            )}
            {joystickUI && joystickUI.active && <div className="absolute z-30 pointer-events-none" style={{ left: joystickUI.startX, top: joystickUI.startY, transform: 'translate(-50%, -50%)' }}><div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-sm"></div><div className="absolute w-12 h-12 rounded-full bg-white/40 shadow-2xl" style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${joystickUI.curX - joystickUI.startX}px), calc(-50% + ${joystickUI.curY - joystickUI.startY}px))` }}></div></div>}
            {uiState.gameOver&&<div className="sy-results" data-gamepad-modal data-gamepad-initial-scope="survivor-game-over"><p className="sy-eyebrow">{battleUi.victory?'THE FINAL BELL HAS FALLEN':'ANOTHER DAY, ANOTHER CHALLENGE'}</p><HeroPortrait id={selectedHero.current.id}/><h2>{battleUi.victory?'STAGE CLEAR!':'GAME OVER'}</h2><p>{tr(selectedHero.current.name)} · {l(selectedField.current.name[0],selectedField.current.name[1],selectedField.current.name[2])}</p><div className="sy-result-stats"><div><small>{l('生存時間','SURVIVED','せいぞん じかん')}</small><strong>{Math.floor(uiState.time/60)}:{(uiState.time%60).toString().padStart(2,'0')}</strong></div><div><small>SCORE</small><strong>{uiState.score||score.current}</strong></div><div><small>K.O.</small><strong>{battleUi.kills}</strong></div></div><button data-gamepad-initial-choice className="sy-primary" onClick={()=>{gameState.current='TITLE';setInLobby(true);setUiState(prev=>({...prev,gameOver:false}));}}><RotateCcw size={18}/>{l('もう一度選ぶ','Choose again','もういちど えらぶ')}</button><button className="sy-secondary" onClick={handleExit}><ArrowLeft size={15}/>{l('ミニゲーム選択へ','Exit to mini-games','ミニゲーム せんたくへ')}</button></div>}
            {gameState.current === 'PLAYING' && <>
                <button onClick={pauseBattle} className="sy-pause" aria-label={l('一時停止','Pause','いちじていし')}><Pause size={20}/></button>
                <div className="sy-actions" onTouchStart={e=>e.stopPropagation()}><button onClick={activateDash} disabled={battleUi.dash>0} aria-label={l('回避ダッシュ','Dash','かいひ ダッシュ')}><Wind size={22}/><strong>{l('回避','DASH','かいひ')}</strong><small>{battleUi.dash>0?`${(battleUi.dash/60).toFixed(1)}s`:'SHIFT'}</small></button><button className={battleUi.burst>=100?'sy-burst-ready':''} onClick={activateBurst} disabled={battleUi.burst<100} aria-label={l('バースト','Burst')} style={{'--charge':`${battleUi.burst}%`} as React.CSSProperties}><Zap size={24}/><strong>{l('バースト','BURST')}</strong><small>{battleUi.burst>=100?'SPACE':`${Math.floor(battleUi.burst)}%`}</small></button></div>
            </>}
            {paused&&<div className="sy-pause-overlay" data-gamepad-modal data-gamepad-initial-scope="survivor-pause"><h2>PAUSED</h2><p>{l('ひと休みして、また戦場へ。','Take a breath. The battlefield can wait.','ひとやすみして、また せんじょうへ。')}</p><button data-gamepad-initial-choice className="sy-primary" onClick={resumeBattle}><Play size={20}/>{l('続ける','Resume','つづける')}</button><button className="sy-secondary" onClick={()=>{setPaused(false);setInLobby(true);gameState.current='TITLE';stopSurvivorAudio();clearAllTimeouts();setUiState(prev=>({...prev,gameOver:false}));}}>{l('主人公を選び直す','Choose another hero','しゅじんこうを えらびなおす')}</button><button className="sy-secondary" onClick={handleExit}>{l('ミニゲーム選択へ','Exit to mini-games','ミニゲーム せんたくへ')}</button></div>}
            {inLobby&&<SurvivorLobby languageMode={languageMode} weaponName={id=>tr(WEAPONS[id as WeaponType].name)} onBack={handleExit} onStart={(hero,field)=>{selectedHero.current=hero;selectedField.current=field;handleRestart();}}/>}

        </div>
    );
};

export default SchoolyardSurvivorScreen;
