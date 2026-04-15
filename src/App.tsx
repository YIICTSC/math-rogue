import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    GameState, GameScreen, Enemy, Card as ICard,
    CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion, Player, EnemyIntent, Character, FloatingText, RankingEntry, GameMode, LanguageMode, VisualEffectInstance, GardenSlot, VFXType, ActStats, RaceTrickCard, RaceTrickEffectId, CoopSupportCard, CoopBattleState, CoopBattleTurnSlot, CoopBattlePlayerState, CoopSharedState, CoopTreasurePool
} from './types';
import {
    INITIAL_HP, INITIAL_ENERGY, HAND_SIZE,
    CARDS_LIBRARY, STARTING_DECK_TEMPLATE, STATUS_CARDS, CURSE_CARDS, EVENT_CARDS, RELIC_LIBRARY, TRUE_BOSS, POTION_LIBRARY, CHARACTERS, HERO_IMAGE_DATA, ENEMY_LIBRARY, LIBRARIAN_CARDS, GROWN_PLANTS, GARDEN_SEEDS
} from './constants';
import { ADDITIONAL_CARDS } from './constants1';
import { GAME_STORIES } from './data/stories';
import { getChallengeScreenForMode } from './subjectConfig'; // New Utility
import BattleScene from './components/BattleScene';
import TypingBattleScene from './components/TypingBattleScene';
import RewardScreen from './components/RewardScreen';
import FloorResultScreen from './components/FloorResultScreen';
import MapScreen from './components/MapScreen';
import RestScreen from './components/RestScreen';
import ShopScreen from './components/ShopScreen';
import EventScreen from './components/EventScreen';
import CompendiumScreen from './components/CompendiumScreen';
import RelicSelectionScreen from './components/RelicSelectionScreen';
import HelpScreen from './components/HelpScreen';
import TreasureScreen from './components/TreasureScreen';
import CharacterSelectionScreen from './components/CharacterSelectionScreen';
import TypingModeSelectionScreen from './components/TypingModeSelectionScreen';
import RankingScreen from './components/RankingScreen';
import MathChallengeScreen from './components/MathChallengeScreen';
import KanjiChallengeScreen from './components/KanjiChallengeScreen';
import EnglishChallengeScreen from './components/EnglishChallengeScreen';
import GeneralChallengeScreen from './components/GeneralChallengeScreen';
import DebugMenuScreen from './components/DebugMenuScreen';
import MiniGameSelectScreen from './components/MiniGameSelectScreen';
import MiniGameRouter from './components/MiniGameRouter'; // Added
import { MINI_GAMES } from './miniGameConfig'; // Added
import DodgeballShooting from './components/DodgeballShooting';
import FinalBridgeScreen from './components/FinalBridgeScreen';
import ProblemChallengeScreen from './components/ProblemChallengeScreen';
import ChefDeckSelectionScreen from './components/ChefDeckSelectionScreen';
import GardenScreen from './components/GardenScreen';
import P2PBattleSetup from './components/P2PBattleSetup';
import VSBattleScene from './components/VSBattleScene';
import P2PVSBattleScene from './components/P2PVSBattleScene';
import P2PRaceSetup from './components/P2PRaceSetup';
import CoopSetupScreen, { CoopParticipantPayload, CoopStartPayload } from './components/CoopSetupScreen';
import ModeSelectionScreen from './components/ModeSelectionScreen';
import SettingsModal, { AppSettings, SettingsTab } from './components/SettingsModal';
import Card from './components/Card';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { generateEvent, generateLegacyEvent } from './services/eventService';
import { getUpgradedCard, synthesizeCards } from './utils/cardUtils';
import { trans } from './utils/textUtils';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle, Send, Swords, Terminal, Club, Zap, Gamepad2, Brain, Languages, Music, Book, MessageSquare, GraduationCap, Clock, AlertTriangle, TimerOff, X, Check, FlaskConical, Globe, MapPin, ChevronDown, ArrowLeft, Sparkles, Wifi, Flag, Keyboard, Users, Mic, MicOff, Settings } from 'lucide-react';
import { applyAdditionalCardLogic } from './services/cardEffectLogic';
import { p2pService } from './services/p2pService';
import { TypingLessonId } from './data/typingLessonConfig';
import { getRandomRaceTrickCard, getRaceTrickCard } from './raceTricks';
import { getRandomCoopSupportCard } from './coopSupportCards';

const calculateScore = (state: GameState, victory: boolean): number => {
    let score = 0;
    const floorPoints = (state.act - 1) * 150 + state.floor * 10;
    score += floorPoints;
    if (victory) score += 1000;
    if (state.act >= 4) score += 500;
    score += state.player.gold;
    score += state.player.relics.length * 25;
    const rares = state.player.deck.filter(c => c.rarity === 'RARE' || c.rarity === 'LEGENDARY').length;
    score += rares * 20;
    if (victory) {
        score += Math.floor((state.player.currentHp / state.player.maxHp) * 200);
    }
    if (state.player.relics.find(r => r.id === 'SPIRIT_POOP')) {
        score -= 1;
    }
    return score;
};

type RaceEntry = {
    peerId: string;
    name: string;
    imageData?: string;
    floor: number;
    maxDamage: number;
    gameOverCount: number;
    score: number;
    updatedAt: number;
};

type RaceSession = {
    isHost: boolean;
    name: string;
    roomCode?: string;
    durationSec: number;
    endAt: number;
    startedAt: number;
    participants: Array<{ peerId: string; name: string; imageData?: string }>;
    entries: RaceEntry[];
    ended: boolean;
};

type CoopParticipant = CoopParticipantPayload;

type CoopSession = {
    isHost: boolean;
    name: string;
    roomCode?: string;
    startedAt: number;
    battleMode: 'TURN_BASED' | 'REALTIME';
    participants: CoopParticipant[];
    decisionOwnerIndex: number;
};

const createCoopSupportInstance = (card: CoopSupportCard): CoopSupportCard => ({
    ...card,
    id: `${card.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
});

const shouldClearAllCardRewards = (item: RewardItem) => item.type === 'CARD';
const LEGACY_VERCEL_HOST = 'math-rogue.vercel.app';
const PRIMARY_SITE_URL = 'https://yiictsc.github.io/math-rogue/';
const COOP_VFX_DEBUG_STORAGE_KEY = 'mr.coopVfxDebug';
const COOP_FINISHER_DISPLAY_MS = 1800;

type GalaxyExpressModalState = {
    cards: ICard[];
};

type SingleCardPickModalState = {
    title: string;
    description: string;
    cards: ICard[];
};

type RelicCardChoiceModalState = {
    title: string;
    description: string;
    cards: ICard[];
    allowSkip?: boolean;
};

type DataTransferStatus = {
    type: 'success' | 'error' | 'info';
    message: string;
};

type CoopVfxDebugEntry = {
    ts: number;
    role: 'HOST' | 'GUEST';
    kind: 'CARD' | 'VFX' | 'LAG';
    detail: string;
};

const compareRaceEntries = (a: RaceEntry, b: RaceEntry) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name, 'ja');
};

type RaceEffectState = {
    paperStormUntil: number;
    chalkDustUntil: number;
    deskShakeUntil: number;
    upsideDownUntil: number;
    sleepyVignetteUntil: number;
    slowBellUntil: number;
    scoreMistUntil: number;
    fakeSignboardUntil: number;
    detentionTaxUntil: number;
    shopMarkupUntil: number;
    shoeLaceUntil: number;
    nextBattleDamage: number;
    nextBattleHandPenalty: number;
    nextQuestionDelayCount: number;
    rewardDummyCount: number;
    forgottenHomeworkCount: number;
    hideEnemyIntentsOnce: boolean;
};

const EMPTY_RACE_EFFECTS: RaceEffectState = {
    paperStormUntil: 0,
    chalkDustUntil: 0,
    deskShakeUntil: 0,
    upsideDownUntil: 0,
    sleepyVignetteUntil: 0,
    slowBellUntil: 0,
    scoreMistUntil: 0,
    fakeSignboardUntil: 0,
    detentionTaxUntil: 0,
    shopMarkupUntil: 0,
    shoeLaceUntil: 0,
    nextBattleDamage: 0,
    nextBattleHandPenalty: 0,
    nextQuestionDelayCount: 0,
    rewardDummyCount: 0,
    forgottenHomeworkCount: 0,
    hideEnemyIntentsOnce: false
};

const DEFAULT_APP_SETTINGS: AppSettings = {
    bgmMode: 'STUDY',
    bgmVolume: 0.4,
    seVolume: 0.6,
    micEnabled: false,
    micSensitivity: 0.5,
    pushToTalk: false,
    selectedInputDeviceId: '',
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    remoteVoiceVolume: 1,
    joinMuted: true,
    networkMode: 'quality',
    reduceScreenShake: false,
    effectIntensity: 'mid',
    fontSize: 'normal',
    colorAssist: false,
    keyLayout: 'default',
    longPressMs: 500,
    vibration: false,
    readAloud: false,
    emphasizeJudgeSE: false,
    hintLevel: 'normal',
    parentLockEnabled: false,
    parentPin: '',
    lowDataMode: false
};

const RACE_TRICK_SCREEN_SET = new Set<GameScreen>([
    GameScreen.MAP,
    GameScreen.BATTLE,
    GameScreen.MATH_CHALLENGE,
    GameScreen.KANJI_CHALLENGE,
    GameScreen.ENGLISH_CHALLENGE,
    GameScreen.GENERAL_CHALLENGE,
    GameScreen.REWARD,
    GameScreen.REST,
    GameScreen.SHOP,
    GameScreen.EVENT
]);

const CHALLENGE_SCREEN_SET = new Set<GameScreen>([
    GameScreen.MATH_CHALLENGE,
    GameScreen.KANJI_CHALLENGE,
    GameScreen.ENGLISH_CHALLENGE,
    GameScreen.GENERAL_CHALLENGE
]);

const COOP_DECISION_HUD_SCREEN_SET = new Set<GameScreen>([
    GameScreen.MAP
]);

const COOP_PARTY_HUD_SCREEN_SET = new Set<GameScreen>([
    GameScreen.MATH_CHALLENGE,
    GameScreen.KANJI_CHALLENGE,
    GameScreen.ENGLISH_CHALLENGE,
    GameScreen.GENERAL_CHALLENGE,
    GameScreen.MAP,
    GameScreen.EVENT,
    GameScreen.REST,
    GameScreen.SHOP,
    GameScreen.REWARD,
    GameScreen.TREASURE
]);

const COOP_LOCAL_SETUP_SCREEN_SET = new Set<GameScreen>([
    GameScreen.CHARACTER_SELECTION,
    GameScreen.DECK_CONSTRUCTION,
    GameScreen.RELIC_SELECTION
]);

const shouldPreserveLocalCoopScreen = (localScreen: GameScreen, incomingScreen: GameScreen) => {
    if (COOP_LOCAL_SETUP_SCREEN_SET.has(localScreen) && localScreen !== incomingScreen) {
        return true;
    }
    if (CHALLENGE_SCREEN_SET.has(localScreen) && !CHALLENGE_SCREEN_SET.has(incomingScreen)) {
        return true;
    }
    if (localScreen === GameScreen.REWARD && CHALLENGE_SCREEN_SET.has(incomingScreen)) {
        return true;
    }
    return false;
};

const determineEnemyType = (name: string, isBoss: boolean): string => {
    if (isBoss) return 'GUARDIAN';
    if (name.includes('先生') || name.includes('用務員') || name.includes('教頭') || name.includes('実習生')) return 'TEACHER';
    if (name.includes('ゴーレム') || name.includes('主') || name.includes('守護者') || name.includes('模型') || name.includes('守衛')) return 'TANK';
    if (name.includes('亡霊') || name.includes('幽霊') || name.includes('花子') || name.includes('影') || name.includes('鏡') || name.includes('残滓')) return 'GHOST';
    if (name.includes('悪魔') || name.includes('不良') || name.includes('カラス') || name.includes('狂信者') || name.includes('怪物') || name.includes('王')) return 'AGGRESSIVE';
    if (name.includes('宿題') || name.includes('ミミック') || name.includes('泥棒') || name.includes('妖精') || name.includes('精') || name.includes('怪')) return 'TRICKSTER';
    if (name.includes('虫') || name.includes('カス') || name.includes('スライム') || name.includes('ハチ') || name.includes('雑草')) return 'SWARM';
    if (name.includes('権化') || name.includes('絶望') || name.includes('偏差値')) return 'ELITE_FORCE';
    return 'GENERIC';
};

const estimateBossScalingSingleCardDamage = (deck: ICard[]): number => {
    const strikeCount = deck.filter(c => c.name === 'えんぴつ攻撃' || c.originalNames?.includes('えんぴつ攻撃')).length;
    const attackCount = deck.filter(c => c.type === CardType.ATTACK).length;
    const skillCount = deck.filter(c => c.type === CardType.SKILL).length;
    const deckSize = deck.length;

    const assumedHand = Math.min(5, Math.max(1, deckSize));
    const assumedDrawPile = Math.max(0, deckSize - assumedHand);
    const assumedBlock = 12;
    const assumedPriorAttacks = Math.max(0, Math.min(2, attackCount - 1));
    const assumedSkillsInHand = Math.max(0, Math.min(4, skillCount));

    const damageCards = deck.filter(card =>
        card.target !== TargetType.SELF &&
        (
            card.damage !== undefined ||
            card.damageBasedOnBlock ||
            card.damagePerCardInHand ||
            card.damagePerAttackPlayed ||
            card.damagePerStrike ||
            card.damagePerCardInDraw
        )
    );

    return Math.max(0, ...damageCards.map(card => {
        let perHit = card.damage || 0;

        if (card.damageBasedOnBlock) perHit += assumedBlock;
        if (card.damagePerCardInHand) perHit += Math.max(0, assumedHand - 1) * card.damagePerCardInHand;
        if (card.damagePerAttackPlayed) perHit += assumedPriorAttacks * card.damagePerAttackPlayed;
        if (card.damagePerStrike) perHit += strikeCount * card.damagePerStrike;
        if (card.damagePerCardInDraw) perHit += assumedDrawPile * card.damagePerCardInDraw;

        let hits = 1 + (card.playCopies || 0);
        if (card.hitsPerSkillInHand) hits = Math.max(1, assumedSkillsInHand);
        if (card.hitsPerAttackPlayed) hits = Math.max(1, assumedPriorAttacks);

        return Math.max(0, perHit * Math.min(hits, 100));
    }));
};

const getNamedEnemyIntent = (enemy: Enemy, turn: number, isAct2Plus: boolean): EnemyIntent | null => {
    const name = enemy.name;
    const cycle = turn % 3;

    if (name.includes('傘')) {
        if (cycle === 1) return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 7 : 4, secondaryValue: isAct2Plus ? 12 : 8 };
        if (cycle === 2) return isAct2Plus
            ? { type: EnemyIntentType.DEFEND, value: 16 }
            : { type: EnemyIntentType.ATTACK_DEFEND, value: 5, secondaryValue: 10 };
        return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 12 : 8 };
    }
    if (name.includes('リコーダー')) {
        if (cycle === 1) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'CONFUSED' };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK_DEBUFF, value: isAct2Plus ? 9 : 6, secondaryValue: 1, debuffType: 'WEAK' };
        return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 14 : 9 };
    }
    if (name.includes('三輪車')) {
        if (cycle === 1) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 16 : 10 };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 8 : 5, secondaryValue: isAct2Plus ? 8 : 5 };
        return { type: EnemyIntentType.PIERCE_ATTACK, value: isAct2Plus ? 12 : 7 };
    }
    if (name.includes('幽霊') || name.includes('亡霊')) {
        if (cycle === 1) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'WEAK' };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK_DEBUFF, value: isAct2Plus ? 8 : 5, secondaryValue: 2, debuffType: 'VULNERABLE' };
        return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 5 : 3, secondaryValue: isAct2Plus ? 10 : 6 };
    }
    if (name.includes('カラス')) {
        if (cycle === 1) return { type: EnemyIntentType.ATTACK_DEBUFF, value: isAct2Plus ? 10 : 6, secondaryValue: 1, debuffType: 'CONFUSED' };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 13 : 8 };
        return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 6 : 4, secondaryValue: isAct2Plus ? 7 : 4 };
    }
    if (name.includes('ハチ') || name.includes('スズメバチ')) {
        if (cycle === 1) return { type: EnemyIntentType.ATTACK_DEBUFF, value: isAct2Plus ? 7 : 4, secondaryValue: 2, debuffType: 'POISON' };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 11 : 7 };
        return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 9 : 5 };
    }
    if (name.includes('画鋲')) {
        if (cycle === 1) return { type: EnemyIntentType.PIERCE_ATTACK, value: isAct2Plus ? 11 : 6 };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK_DEBUFF, value: isAct2Plus ? 7 : 4, secondaryValue: 1, debuffType: 'VULNERABLE' };
        return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 4 : 3, secondaryValue: isAct2Plus ? 8 : 5 };
    }
    if (name.includes('ミミズ') || name.includes('雑草') || name.includes('埃')) {
        if (cycle === 1) return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 7 : 4, secondaryValue: isAct2Plus ? 14 : 8 };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 6 : 4, secondaryValue: isAct2Plus ? 9 : 6 };
        return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 10 : 6 };
    }
    if (name.includes('先生') || name.includes('教頭')) {
        if (cycle === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: isAct2Plus ? 4 : 2 };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 10 : 6, secondaryValue: isAct2Plus ? 12 : 8 };
        return { type: EnemyIntentType.ATTACK_DEBUFF, value: isAct2Plus ? 11 : 7, secondaryValue: 2, debuffType: 'VULNERABLE' };
    }
    if (name.includes('ノート')) {
        if (cycle === 1) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'CONFUSED' };
        if (cycle === 2) return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 7 : 4, secondaryValue: isAct2Plus ? 10 : 6 };
        return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 12 : 7 };
    }
    return null;
};

const getNextEnemyIntent = (enemy: Enemy, turn: number): EnemyIntent => {
    const type = enemy.enemyType;
    const localTurn = turn % 3;
    const isAct2Plus = (enemy.maxHp > 60);
    const namedIntent = getNamedEnemyIntent(enemy, turn, isAct2Plus);
    if (namedIntent) return namedIntent;

    switch (type) {
        case 'TEACHER':
            if (turn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: isAct2Plus ? 3 : 2 };
            if (localTurn === 2) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 18 : 12 };
            return { type: EnemyIntentType.ATTACK_DEBUFF, value: 8, secondaryValue: 2, debuffType: 'VULNERABLE' };

        case 'TANK':
            if (localTurn === 0) return isAct2Plus
                ? { type: EnemyIntentType.DEFEND, value: 20 }
                : { type: EnemyIntentType.ATTACK_DEFEND, value: 6, secondaryValue: 12 };
            if (localTurn === 1) return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 9 : 6, secondaryValue: isAct2Plus ? 14 : 10 };
            return { type: EnemyIntentType.ATTACK, value: 15 };

        case 'GHOST':
            if (localTurn === 0) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'WEAK' };
            if (localTurn === 1) return { type: EnemyIntentType.ATTACK, value: 6 };
            return { type: EnemyIntentType.ATTACK_DEBUFF, value: 5, secondaryValue: 3, debuffType: 'VULNERABLE' };

        case 'AGGRESSIVE':
            if (turn === 1) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 10 : 6 };
            if (localTurn === 0) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 3 : 3 };
            return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 14 : 9 };

        case 'TRICKSTER':
            if (localTurn === 0) {
                if (Math.random() < 0.5) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'CONFUSED' };
                return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'POISON' };
            }
            if (localTurn === 1) return { type: EnemyIntentType.ATTACK_DEFEND, value: isAct2Plus ? 6 : 4, secondaryValue: isAct2Plus ? 10 : 8 };
            return { type: EnemyIntentType.ATTACK, value: 7 };

        case 'ELITE_FORCE':
            const eliteTurn = turn % 4;
            if (eliteTurn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 5 };
            if (eliteTurn === 2) return { type: EnemyIntentType.PIERCE_ATTACK, value: isAct2Plus ? 25 : 15 };
            if (eliteTurn === 3) return { type: EnemyIntentType.ATTACK_DEBUFF, value: 10, secondaryValue: 2, debuffType: 'WEAK' };
            return { type: EnemyIntentType.DEFEND, value: 20 };

        case 'SWARM':
            if (turn % 3 === 0) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 12 : 5 };
            if (turn % 3 === 1) return { type: EnemyIntentType.ATTACK_DEBUFF, value: 4, secondaryValue: 1, debuffType: 'POISON' };
            return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'WEAK' };

        case 'GUARDIAN':
            const bossTurn = turn % 6;
            if (bossTurn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 10 };
            if (bossTurn === 2) return { type: EnemyIntentType.ATTACK, value: 25 };
            if (bossTurn === 3) return { type: EnemyIntentType.PIERCE_ATTACK, value: 20 };
            if (bossTurn === 4) return { type: EnemyIntentType.ATTACK_DEFEND, value: 15, secondaryValue: 15 };
            if (bossTurn === 5) return { type: EnemyIntentType.ATTACK_DEBUFF, value: 10, secondaryValue: 2, debuffType: 'VULNERABLE' };
            return { type: EnemyIntentType.DEFEND, value: 20 };

        case 'THE_HEART':
            if (enemy.phase === 1) {
                const heartTurn = turn % 4;
                if (heartTurn === 1) return { type: EnemyIntentType.ATTACK, value: 45 };
                if (heartTurn === 2) return { type: EnemyIntentType.PIERCE_ATTACK, value: 25 };
                if (heartTurn === 3) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 2 };
                return { type: EnemyIntentType.ATTACK_DEBUFF, value: 2, secondaryValue: 12, debuffType: 'VULNERABLE' };
            } else {
                const heartTurn = turn % 5;
                if (heartTurn === 1) return { type: EnemyIntentType.ATTACK_DEBUFF, value: 12, secondaryValue: 15, debuffType: 'CONFUSED' };
                if (heartTurn === 2) return { type: EnemyIntentType.ATTACK, value: 60 };
                if (heartTurn === 3) return { type: EnemyIntentType.PIERCE_ATTACK, value: 35 };
                if (heartTurn === 4) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 5 };
                return { type: EnemyIntentType.ATTACK_DEBUFF, value: 10, secondaryValue: 3, debuffType: 'WEAK' };
            }


        default:
            const r = Math.random();
            if (r < 0.6) return { type: EnemyIntentType.ATTACK, value: 9 + Math.floor(turn / 2) };
            if (r < 0.8) return { type: EnemyIntentType.ATTACK_DEFEND, value: 4, secondaryValue: 8 };
            if (r < 0.95) return { type: EnemyIntentType.ATTACK_DEFEND, value: 5 + Math.floor(turn / 3), secondaryValue: 7 + Math.floor(turn / 3) };
            return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 2 };
    }
};

const App: React.FC = () => {
    const detectMobilePortrait = () => {
        if (typeof window === 'undefined') return false;
        const isTouchLike = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
        const isPortrait = window.matchMedia('(orientation: portrait)').matches || window.innerHeight > window.innerWidth;
        return isTouchLike && isPortrait;
    };

    const createDeck = (template: string[] = STARTING_DECK_TEMPLATE): ICard[] => {
        return template.map((key, index) => {
            const cardTemplate = CARDS_LIBRARY[key];
            if (!cardTemplate) {
                console.warn(`Card template not found: ${key}, using Strike`);
                return {
                    id: `deck-${index}-${Math.random()}`,
                    ...CARDS_LIBRARY['STRIKE']
                }
            }
            return {
                id: `deck-${index}-${Math.random().toString(36).substr(2, 9)}`,
                ...cardTemplate
            };
        });
    };

    const shuffle = (array: any[]) => {
        return array.sort(() => Math.random() - 0.5);
    };
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const getFilteredCardPool = (playerId: string | undefined, includeSpecial: boolean = false): ICard[] => {
        const isLibrarian = playerId === 'LIBRARIAN';
        const isGardener = playerId === 'GARDENER';

        // Get currently unlocked cards from storage
        const unlockedCards = new Set(storageService.getUnlockedCards().map(name => name.trim()));
        // Get all additional card names as a Set for fast lookup
        const additionalNames = new Set(Object.values(ADDITIONAL_CARDS).map(ac => ac.name.trim()));

        return Object.values(CARDS_LIBRARY).filter(c => {
            // Basic type filtering
            if (c.type === CardType.STATUS || c.type === CardType.CURSE) return false;

            const cleanName = c.name.trim();

            // IMPORTANT: If this card is an additional card, only include it if it's unlocked
            if (additionalNames.has(cleanName)) {
                if (!unlockedCards.has(cleanName)) {
                    return false;
                }
            }

            // Special character-specific filtering
            const isLibCard = Object.values(LIBRARIAN_CARDS).some(lc => lc.name === c.name);
            if (c.isSeed && !isGardener) return false;
            if (isLibCard && !isLibrarian) return false;

            if (c.rarity === 'SPECIAL') {
                if (!includeSpecial) return false;
                if (isGardener && (c.isSeed || Object.values(GROWN_PLANTS).some(gp => gp.name === c.name))) return true;
                if (isLibrarian && isLibCard) return true;
                return false;
            }
            return true;
        }).map((c, i) => ({ ...c, id: `pool-${i}-${Math.random()}` } as ICard));
    };

    const clearCombatDebuffs = (player: Player): Player => {
        const nextPowers = { ...player.powers };
        ['WEAK', 'VULNERABLE', 'FRAIL', 'CONFUSED'].forEach(powerId => {
            if (nextPowers[powerId] > 0) nextPowers[powerId] = 0;
        });
        return { ...player, powers: nextPowers };
    };

    const reviveWithTailEffect = (player: Player): Player | null => {
        const hasTailRelic = player.relics.some(r => r.id === 'LIZARD_TAIL') && !player.relicCounters['LIZARD_TAIL_USED'];
        const hasTailPower = (player.powers['LIZARD_TAIL'] || 0) > 0;
        if (!hasTailRelic && !hasTailPower) return null;

        const nextPlayer: Player = {
            ...player,
            powers: { ...player.powers },
            relicCounters: { ...player.relicCounters },
            currentHp: Math.max(1, Math.floor(player.maxHp * 0.5)),
            floatingText: { id: `revive-${Date.now()}`, text: '復活！', color: 'text-green-500', iconType: 'heart' }
        };

        if (hasTailRelic) {
            nextPlayer.relicCounters['LIZARD_TAIL_USED'] = 1;
        } else {
            nextPlayer.powers['LIZARD_TAIL'] = Math.max(0, (nextPlayer.powers['LIZARD_TAIL'] || 0) - 1);
        }

        return nextPlayer;
    };

    const [gameState, setGameState] = useState<GameState>({
        screen: GameScreen.START_MENU,
        mode: GameMode.MULTIPLICATION,
        act: 1,
        floor: 0,
        turn: 0,
        map: [],
        currentMapNodeId: null,
        player: {
            maxHp: INITIAL_HP,
            currentHp: INITIAL_HP,
            maxEnergy: INITIAL_ENERGY,
            currentEnergy: INITIAL_ENERGY,
            block: 0,
            strength: 0,
            gold: 99,
            deck: createDeck(),
            hand: [],
            discardPile: [],
            drawPile: [],
            relics: [],
            potions: [],
            powers: {},
            echoes: 0,
            cardsPlayedThisTurn: 0,
            attacksPlayedThisTurn: 0,
            typesPlayedThisTurn: [],
            relicCounters: {},
            turnFlags: {},
            imageData: HERO_IMAGE_DATA,
            floatingText: null,
            nextTurnEnergy: 0,
            nextTurnDraw: 0,
            codexBuffer: []
        },
        enemies: [],
        selectedEnemyId: null,
        narrativeLog: [],
        combatLog: [],
        rewards: [],
        selectionState: { active: false, type: 'DISCARD', amount: 0 },
        isEndless: false,
        parryState: { active: false, enemyId: null, success: false },
        activeEffects: [],
        coopBattleState: null,
        currentStoryIndex: 0,
        actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
    });
    const [isMobilePortrait, setIsMobilePortrait] = useState(false);
    const previousScreenRef = useRef<GameScreen>(GameScreen.START_MENU);
    const isLegacyVercelHost = typeof window !== 'undefined' && window.location.hostname === LEGACY_VERCEL_HOST;
    const [showMigrationNotice, setShowMigrationNotice] = useState<boolean>(() => isLegacyVercelHost);

    useEffect(() => {
        const syncMobilePortrait = () => setIsMobilePortrait(detectMobilePortrait());
        syncMobilePortrait();
        window.addEventListener('resize', syncMobilePortrait);
        return () => window.removeEventListener('resize', syncMobilePortrait);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const hasVsPin = ((params.get('vsPin') || '').normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6)).length === 6;
        const hasCoopPin = ((params.get('coopPin') || '').normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6)).length === 6;
        const hasRacePin = ((params.get('racePin') || '').normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6)).length === 6;
        const targetScreen = hasVsPin
            ? GameScreen.VS_SETUP
            : hasCoopPin
                ? GameScreen.COOP_SETUP
                : hasRacePin
                    ? GameScreen.RACE_SETUP
                    : null;
        if (!targetScreen) return;
        setGameState(prev => (
            prev.screen === GameScreen.START_MENU
                ? { ...prev, screen: targetScreen }
                : prev
        ));
    }, []);

    const [languageMode, setLanguageMode] = useState<LanguageMode>(() => storageService.getLanguageMode() || 'JAPANESE');
    const [currentNarrative, setCurrentNarrative] = useState<string>("...");
    const [turnLog, setTurnLog] = useState<string>("あなたのターン");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [lastActionTime, setLastActionTime] = useState<number>(0);
    const [lastActionType, setLastActionType] = useState<CardType | null>(null);
    const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);
    const [hasSave, setHasSave] = useState<boolean>(false);
    const [showStartOverConfirm, setShowStartOverConfirm] = useState<boolean>(false);
    const [selectedCharName, setSelectedCharName] = useState<string>("わんぱく小学生");
    const [legacyCardSelected, setLegacyCardSelected] = useState<boolean>(false);
    const [newlyUnlockedCard, setNewlyUnlockedCard] = useState<ICard | null>(null); // New State
    const [newlyUnlockedCharacters, setNewlyUnlockedCharacters] = useState<Character[]>([]);
    const [newlyUnlockedMiniGames, setNewlyUnlockedMiniGames] = useState<(typeof MINI_GAMES)[number][]>([]);
    const [unlockCheckStartMathCorrect, setUnlockCheckStartMathCorrect] = useState<number>(0);
    const [debugMenuStartClearCount, setDebugMenuStartClearCount] = useState<number>(0);
    const [debugMenuStartMathCorrect, setDebugMenuStartMathCorrect] = useState<number>(0);
    const [showDebugLog, setShowDebugLog] = useState<boolean>(false);
    const [showDataTransferModal, setShowDataTransferModal] = useState<boolean>(false);
    const [transferExportText, setTransferExportText] = useState<string>('');
    const [transferExportCount, setTransferExportCount] = useState<number>(0);
    const [transferImportText, setTransferImportText] = useState<string>('');
    const [transferStatus, setTransferStatus] = useState<DataTransferStatus | null>(null);
    const [bgmMode, setBgmMode] = useState<'OSCILLATOR' | 'MP3' | 'STUDY'>(() => {
        const saved = storageService.getBgmMode() as 'OSCILLATOR' | 'MP3' | 'STUDY' | null;
        return saved || 'STUDY';
    });
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsTab, setSettingsTab] = useState<SettingsTab>('AUDIO');
    const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings>(() => {
        const saved = storageService.getAppSettings<AppSettings>();
        return { ...DEFAULT_APP_SETTINGS, ...(saved || {}) };
    });
    const [totalMathCorrect, setTotalMathCorrect] = useState<number>(0);
    const [nextThreshold, setNextThreshold] = useState<number | null>(null);
    const [battleFinisherCutinCard, setBattleFinisherCutinCard] = useState<ICard | null>(null);
    const battleFinisherCutinCardRef = useRef<ICard | null>(null);

    const [isMathDebugSkipped, setIsMathDebugSkipped] = useState<boolean>(false);
    const [isDebugHpOne, setIsDebugHpOne] = useState<boolean>(false);
    const [titleClickCount, setTitleCount] = useState<number>(0);
    const [logClickCount, setLogClickCount] = useState<number>(0);
    const [debugLoadout, setDebugLoadout] = useState<{ deck: ICard[], relics: Relic[], potions: Potion[] } | null>(null);

    const [shopCards, setShopCards] = useState<ICard[]>([]);
    const [shopRelics, setShopRelics] = useState<Relic[]>([]);
    const [shopPotions, setShopPotions] = useState<Potion[]>([]);
    const [weatherScryModal, setWeatherScryModal] = useState<{ cards: ICard[]; keepMap: Record<string, boolean> } | null>(null);
    const [galaxyExpressModal, setGalaxyExpressModal] = useState<GalaxyExpressModalState | null>(null);
    const [goldFishModal, setGoldFishModal] = useState<SingleCardPickModalState | null>(null);
    const [dreamCatcherModal, setDreamCatcherModal] = useState<SingleCardPickModalState | null>(null);
    const [orreryModal, setOrreryModal] = useState<RelicCardChoiceModalState | null>(null);
    const [peacePipeModal, setPeacePipeModal] = useState<RelicCardChoiceModalState | null>(null);
    const [eventData, setEventData] = useState<any>(null);
    const [eventResultLog, setEventResultLog] = useState<string | null>(null);
    const [unlockedCardNames, setUnlockedCardNames] = useState<string[]>([]);
    const [starterRelics, setStarterRelics] = useState<Relic[]>([]);
    const [treasureRewards, setTreasureRewards] = useState<RewardItem[]>([]);
    const [treasureOpened, setTreasureOpened] = useState(false);
    const [treasurePools, setTreasurePools] = useState<CoopTreasurePool[]>([]);
    const [clearCount, setClearCount] = useState<number>(0);
    const [raceSession, setRaceSession] = useState<RaceSession | null>(null);
    const [coopSession, setCoopSession] = useState<CoopSession | null>(null);
    const [raceResultOpen, setRaceResultOpen] = useState(false);
    const [raceMaxDamage, setRaceMaxDamage] = useState(0);
    const [raceGameOverCount, setRaceGameOverCount] = useState(0);
    const [raceNow, setRaceNow] = useState(Date.now());
    const [raceRemainingSec, setRaceRemainingSec] = useState(0);
    const [raceSelfPeerId, setRaceSelfPeerId] = useState<string>('host');
    const [raceTrickCards, setRaceTrickCards] = useState<RaceTrickCard[]>([]);
    const [raceEffects, setRaceEffects] = useState<RaceEffectState>(EMPTY_RACE_EFFECTS);
    const [raceHudOpen, setRaceHudOpen] = useState(false);
    const [raceToast, setRaceToast] = useState<string | null>(null);
    const [raceEffectNow, setRaceEffectNow] = useState(Date.now());
    const [raceRewardDummyDisplay, setRaceRewardDummyDisplay] = useState(0);
    const [coopSupportCards, setCoopSupportCards] = useState<CoopSupportCard[]>([]);
    const [coopPartyHudOpen, setCoopPartyHudOpen] = useState(true);
    const [coopVoiceEnabled, setCoopVoiceEnabled] = useState(false);
    const [coopPlayerSnapshots, setCoopPlayerSnapshots] = useState<Record<string, Player>>({});
    const [coopRewardSets, setCoopRewardSets] = useState<Record<string, RewardItem[]>>({});
    const [coopAwaitingRewardSync, setCoopAwaitingRewardSync] = useState(false);
    const [coopAwaitingMapSync, setCoopAwaitingMapSync] = useState(false);
    const [coopNeedsInitialMapSync, setCoopNeedsInitialMapSync] = useState(false);
    const [coopMapPendingNodeId, setCoopMapPendingNodeId] = useState<string | null>(null);
    const [coopBattleQueue, setCoopBattleQueue] = useState<CoopBattleTurnSlot[]>([]);
    const [coopBattleKey, setCoopBattleKey] = useState<string | null>(null);
    const [coopEnemyTurnCursor, setCoopEnemyTurnCursor] = useState(0);
    const isCoopVfxDebugEnabled = useMemo(() => {
        if (typeof window === 'undefined') return false;
        const queryEnabled = new URLSearchParams(window.location.search).get('coopVfxDebug') === '1';
        const storageEnabled = window.localStorage.getItem(COOP_VFX_DEBUG_STORAGE_KEY) === '1';
        return queryEnabled || storageEnabled;
    }, []);
    const prevScreenRef = useRef<GameScreen>(GameScreen.START_MENU);
    const coopRewardScreenRef = useRef<GameScreen>(GameScreen.START_MENU);
    const raceToastTimerRef = useRef<number | null>(null);
    const coopEnemyTurnCursorRef = useRef(0);
    const coopStartedTurnSlotRef = useRef<string | null>(null);
    const coopApplyingRemoteBattleSyncRef = useRef(false);
    const coopLastBattleActionSignatureRef = useRef<string | null>(null);
    const coopPendingVoiceSyncRef = useRef<boolean | null>(null);
    const coopRemoteFinisherShownAtRef = useRef<number | null>(null);
    const coopRemoteFinisherClearTimerRef = useRef<number | null>(null);
    const coopRemoteEffectClearTimerRef = useRef<number | null>(null);
    const coopLastBattleCardEventAtRef = useRef<number | null>(null);
    const coopObservedEffectIdsRef = useRef<Set<string>>(new Set());
    const coopVfxDebugLogRef = useRef<CoopVfxDebugEntry[]>([]);
    const coopChainTrackerRef = useRef<{ lastActorPeerId: string | null; lastAt: number; chainCount: number }>({ lastActorPeerId: null, lastAt: 0, chainCount: 0 });
    const queuedCoopBattleEventRef = useRef<{ type: 'COOP_BATTLE_PLAY_CARD' | 'COOP_BATTLE_USE_POTION' | 'COOP_BATTLE_TURN_START' | 'COOP_BATTLE_SELECTION_STATE' | 'COOP_BATTLE_MODAL_RESOLVE' | 'COOP_BATTLE_CODEX_SELECT', cardId?: string, potionId?: string, playedCard?: ICard } | null>(null);
    const [queuedCoopBattleEventTick, setQueuedCoopBattleEventTick] = useState(0);
    const coopMapPendingTimerRef = useRef<number | null>(null);
    const transferFileInputRef = useRef<HTMLInputElement | null>(null);

    const showRaceToast = useCallback((message: string) => {
        setRaceToast(message);
        if (raceToastTimerRef.current) {
            window.clearTimeout(raceToastTimerRef.current);
        }
        raceToastTimerRef.current = window.setTimeout(() => setRaceToast(null), 2200);
    }, []);
    useEffect(() => {
        battleFinisherCutinCardRef.current = battleFinisherCutinCard;
    }, [battleFinisherCutinCard]);
    useEffect(() => {
        return () => {
            if (coopRemoteFinisherClearTimerRef.current) {
                window.clearTimeout(coopRemoteFinisherClearTimerRef.current);
                coopRemoteFinisherClearTimerRef.current = null;
            }
            if (coopRemoteEffectClearTimerRef.current) {
                window.clearTimeout(coopRemoteEffectClearTimerRef.current);
                coopRemoteEffectClearTimerRef.current = null;
            }
        };
    }, []);
    const appendCoopVfxDebugLog = useCallback((kind: CoopVfxDebugEntry['kind'], detail: string) => {
        if (!isCoopVfxDebugEnabled || typeof window === 'undefined') return;
        const role: CoopVfxDebugEntry['role'] = coopSession?.isHost ? 'HOST' : 'GUEST';
        const nextEntry: CoopVfxDebugEntry = { ts: Date.now(), role, kind, detail };
        const nextLog = [...coopVfxDebugLogRef.current, nextEntry].slice(-120);
        coopVfxDebugLogRef.current = nextLog;
        (window as any).__MR_COOP_VFX_DEBUG__ = {
            logs: nextLog,
            latest: nextEntry,
            lagCount: nextLog.filter((entry: CoopVfxDebugEntry) => entry.kind === 'LAG').length,
            clear: () => {
                coopVfxDebugLogRef.current = [];
                (window as any).__MR_COOP_VFX_DEBUG__.logs = [];
                (window as any).__MR_COOP_VFX_DEBUG__.latest = null;
                (window as any).__MR_COOP_VFX_DEBUG__.lagCount = 0;
            }
        };
    }, [coopSession?.isHost, isCoopVfxDebugEnabled]);
    const registerCoopChain = useCallback((actorPeerId: string) => {
        const now = Date.now();
        const tracker = coopChainTrackerRef.current;
        const isWithinWindow = (now - tracker.lastAt) <= 2600;
        const isAlternating = tracker.lastActorPeerId !== null && tracker.lastActorPeerId !== actorPeerId;
        const nextChainCount = (isWithinWindow && isAlternating) ? tracker.chainCount + 1 : 1;
        coopChainTrackerRef.current = {
            lastActorPeerId: actorPeerId,
            lastAt: now,
            chainCount: nextChainCount
        };
        return nextChainCount;
    }, []);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.BATTLE) {
            coopObservedEffectIdsRef.current.clear();
            return;
        }
        if (!isCoopVfxDebugEnabled) return;

        const roleLabel = coopSession?.isHost ? 'HOST' : 'GUEST';
        const now = Date.now();
        const seenIds = coopObservedEffectIdsRef.current;
        const newEffects = gameState.activeEffects.filter(effect => !seenIds.has(effect.id));
        if (newEffects.length === 0) return;

        newEffects.forEach(effect => seenIds.add(effect.id));
        const sinceLastCardEventMs = coopLastBattleCardEventAtRef.current
            ? Math.max(0, now - coopLastBattleCardEventAtRef.current)
            : null;
        const summary = newEffects
            .map(effect => `${effect.type}:${effect.targetId}`)
            .join(', ');
        console.log(`[COOP_VFX_DEBUG] ${roleLabel} ${newEffects.length} effect(s) +${sinceLastCardEventMs ?? 'n/a'}ms :: ${summary}`);
        appendCoopVfxDebugLog('VFX', `${newEffects.length} effect(s) +${sinceLastCardEventMs ?? 'n/a'}ms :: ${summary}`);
        if (sinceLastCardEventMs !== null && sinceLastCardEventMs > 300) {
            const lagMessage = `lag>${sinceLastCardEventMs}ms (${summary})`;
            console.warn(`[COOP_VFX_DEBUG] ${roleLabel} ${lagMessage}`);
            appendCoopVfxDebugLog('LAG', lagMessage);
        }
    }, [appendCoopVfxDebugLog, coopSession?.isHost, gameState.activeEffects, gameState.challengeMode, gameState.screen, isCoopVfxDebugEnabled]);
    const clearCoopMapPending = useCallback(() => {
        setCoopMapPendingNodeId(null);
        if (coopMapPendingTimerRef.current) {
            window.clearTimeout(coopMapPendingTimerRef.current);
            coopMapPendingTimerRef.current = null;
        }
    }, []);
    const handleMoveToPrimarySite = useCallback(() => {
        if (typeof window === 'undefined') return;
        window.location.replace(PRIMARY_SITE_URL);
    }, []);
    const refreshTransferExport = useCallback(() => {
        const payload = storageService.exportTransferData();
        setTransferExportText(JSON.stringify(payload, null, 2));
        setTransferExportCount(Object.keys(payload.entries).length);
    }, []);
    const openDataTransferModal = useCallback(() => {
        refreshTransferExport();
        setTransferImportText('');
        setTransferStatus(null);
        setShowDataTransferModal(true);
    }, [refreshTransferExport]);
    const handleCopyTransferData = useCallback(async () => {
        const text = transferExportText || JSON.stringify(storageService.exportTransferData(), null, 2);
        try {
            await navigator.clipboard.writeText(text);
            setTransferStatus({ type: 'success', message: trans("エクスポートデータをコピーしました。", languageMode) });
        } catch {
            setTransferStatus({ type: 'error', message: trans("コピーに失敗しました。下の欄から手動でコピーしてください。", languageMode) });
        }
    }, [languageMode, transferExportText]);
    const handleDownloadTransferData = useCallback(() => {
        const text = transferExportText || JSON.stringify(storageService.exportTransferData(), null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.href = url;
        link.download = `math-rogue-save-${stamp}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setTransferStatus({ type: 'success', message: trans("エクスポート用ファイルをダウンロードしました。", languageMode) });
    }, [languageMode, transferExportText]);
    const handleTransferFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            setTransferImportText(text);
            setTransferStatus({ type: 'info', message: trans("ファイルを読み込みました。内容を確認してインポートを実行してください。", languageMode) });
        } catch {
            setTransferStatus({ type: 'error', message: trans("ファイルの読み込みに失敗しました。", languageMode) });
        } finally {
            event.target.value = '';
        }
    }, [languageMode]);
    const handleImportTransferData = useCallback(() => {
        if (!transferImportText.trim()) {
            setTransferStatus({ type: 'error', message: trans("インポートするデータを貼り付けるか、ファイルを読み込んでください。", languageMode) });
            return;
        }
        if (!window.confirm(trans("現在の保存データを上書きしてインポートします。よろしいですか？", languageMode))) {
            return;
        }
        try {
            const result = storageService.importTransferData(transferImportText);
            setTransferStatus({
                type: 'success',
                message: `${trans("保存データを取り込みました。", languageMode)} (${result.importedKeys}${trans("件", languageMode)}) ${trans("ページを再読み込みします。", languageMode)}`
            });
            window.setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            setTransferStatus({
                type: 'error',
                message: error instanceof Error ? error.message : trans("インポートに失敗しました。", languageMode)
            });
        }
    }, [languageMode, transferImportText]);

    const getRaceTargetEntries = useCallback(() => {
        if (!raceSession) return [];
        return [...raceSession.entries]
            .filter(entry => entry.peerId !== raceSelfPeerId)
            .sort(compareRaceEntries);
    }, [raceSession, raceSelfPeerId]);
    const coopSelfPeerId = useMemo(() => {
        const directPeerId = p2pService.getMyId();
        if (directPeerId) return directPeerId;
        if (!coopSession) return 'host';

        const selfByCharacter = coopSession.participants.find(participant =>
            participant.selectedCharacterId &&
            participant.selectedCharacterId === gameState.player.id &&
            (!!participant.imageData ? participant.imageData === gameState.player.imageData : true)
        );
        if (selfByCharacter) return selfByCharacter.peerId;

        const selfByImage = coopSession.participants.find(participant =>
            participant.imageData &&
            participant.imageData === gameState.player.imageData
        );
        if (selfByImage) return selfByImage.peerId;

        return coopSession.isHost
            ? (coopSession.participants[0]?.peerId || 'host')
            : 'self';
    }, [coopSession, gameState.player.id, gameState.player.imageData]);
    const coopCompanions = useMemo(() => {
        if (!coopSession) return [];
        return coopSession.participants
            .filter(participant => participant.peerId !== coopSelfPeerId)
            .slice(0, 3)
            .map(participant => ({
                id: participant.peerId,
                name: participant.name,
                maxHp: participant.maxHp || 100,
                currentHp: participant.currentHp ?? participant.maxHp ?? 100,
                imageData: participant.imageData || HERO_IMAGE_DATA,
                floatingText: null
            }));
    }, [coopSession, coopSelfPeerId]);
    const coopEffectOwnerPeerId = useMemo(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.BATTLE || !gameState.coopBattleState) return null;
        if (gameState.coopBattleState.battleMode === 'REALTIME') {
            return coopSelfPeerId || null;
        }
        const activeTurn = gameState.coopBattleState.turnQueue[gameState.coopBattleState.turnCursor];
        if (!activeTurn) return null;
        if ((activeTurn.type === 'PLAYER' || activeTurn.type === 'ALLY') && activeTurn.peerId) return activeTurn.peerId;
        return null;
    }, [coopSelfPeerId, gameState.challengeMode, gameState.coopBattleState, gameState.screen]);
    const attachCoopEffectOwner = useCallback((effects: VisualEffectInstance[], ownerPeerId?: string | null) => {
        if (!ownerPeerId) return effects;
        return effects.map(effect => (
            effect.targetId === 'player' && !effect.ownerPeerId
                ? { ...effect, ownerPeerId }
                : effect
        ));
    }, []);
    const getCoopVfxInferencePolicy = useCallback((playedCard?: ICard | null) => {
        if (!playedCard) {
            return {
                allowPlayerBlock: true,
                allowPlayerHeal: true,
                allowPlayerBuff: true,
                allowPlayerDebuff: true,
                allowEnemyHit: true,
                allowEnemyHeal: true,
                allowEnemyBlock: true,
                allowEnemyBuff: true,
                allowEnemyDebuff: true
            };
        }
        const targetsEnemy = playedCard.target === TargetType.ENEMY || playedCard.target === TargetType.ALL_ENEMIES || playedCard.target === TargetType.RANDOM_ENEMY;
        const targetsSelf = playedCard.target === TargetType.SELF || !playedCard.target;
        const hasEnemyDebuff = !!(playedCard.vulnerable || playedCard.weak || playedCard.poison || playedCard.poisonMultiplier || (playedCard.strength && playedCard.strength < 0));
        const hasSelfDebuff = targetsSelf && !!(playedCard.vulnerable || playedCard.weak || (playedCard.strength && playedCard.strength < 0));
        const hasSelfBuff = !!(
            (playedCard.strength && playedCard.strength > 0) ||
            playedCard.upgradeHand ||
            playedCard.upgradeDeck ||
            playedCard.doubleStrength ||
            playedCard.nextTurnEnergy ||
            playedCard.nextTurnDraw ||
            playedCard.energy ||
            playedCard.addCardToHand ||
            playedCard.addCardToDraw ||
            playedCard.addCardToDiscard ||
            playedCard.applyPower ||
            playedCard.type === CardType.POWER
        );
        const hasEnemyBuff = targetsEnemy && !!((playedCard.strength && playedCard.strength > 0) || playedCard.applyPower);
        const hasEnemyHit = playedCard.type === CardType.ATTACK || !!playedCard.damage || !!playedCard.damageBasedOnBlock || !!playedCard.playCopies || !!playedCard.hitsPerAttackPlayed || !!playedCard.hitsPerSkillInHand;
        return {
            allowPlayerBlock: !!(targetsSelf && (playedCard.block || playedCard.doubleBlock || playedCard.blockMultiplier)),
            allowPlayerHeal: !!(targetsSelf && (playedCard.heal || playedCard.fatalMaxHp)),
            allowPlayerBuff: !!(targetsSelf && hasSelfBuff),
            allowPlayerDebuff: !!hasSelfDebuff,
            allowEnemyHit: !!(targetsEnemy && hasEnemyHit),
            allowEnemyHeal: false,
            allowEnemyBlock: false,
            allowEnemyBuff: !!hasEnemyBuff,
            allowEnemyDebuff: !!(targetsEnemy && hasEnemyDebuff)
        };
    }, []);
    const inferRemoteCoopBattleEffects = useCallback((
        previousPlayer: Player | undefined,
        nextPlayer: Player,
        ownerPeerId: string,
        playedCard?: ICard | null,
        previousEnemies: Enemy[] = [],
        nextEnemies: Enemy[] = []
    ): VisualEffectInstance[] => {
        if (!previousPlayer) return [];
        const inferred: VisualEffectInstance[] = [];
        const policy = getCoopVfxInferencePolicy(playedCard);
        const pushUnique = (effect: VisualEffectInstance) => {
            if (inferred.some(existing => existing.type === effect.type && existing.targetId === effect.targetId && existing.ownerPeerId === effect.ownerPeerId)) {
                return;
            }
            inferred.push(effect);
        };
        const previousPowers = previousPlayer.powers || {};
        const nextPowers = nextPlayer.powers || {};
        const playerDebuffIncreased =
            (nextPowers['WEAK'] || 0) > (previousPowers['WEAK'] || 0) ||
            (nextPowers['VULNERABLE'] || 0) > (previousPowers['VULNERABLE'] || 0) ||
            (nextPowers['FRAIL'] || 0) > (previousPowers['FRAIL'] || 0) ||
            (nextPowers['CONFUSED'] || 0) > (previousPowers['CONFUSED'] || 0) ||
            (nextPowers['LOSE_STRENGTH'] || 0) > (previousPowers['LOSE_STRENGTH'] || 0);
        const playerBuffIncreased =
            nextPlayer.strength > previousPlayer.strength ||
            nextPlayer.maxHp > previousPlayer.maxHp ||
            nextPlayer.maxEnergy > previousPlayer.maxEnergy ||
            (nextPowers['DEXTERITY'] || 0) > (previousPowers['DEXTERITY'] || 0) ||
            (nextPowers['ARTIFACT'] || 0) > (previousPowers['ARTIFACT'] || 0) ||
            (nextPowers['BUFFER'] || 0) > (previousPowers['BUFFER'] || 0) ||
            (nextPowers['THORNS'] || 0) > (previousPowers['THORNS'] || 0) ||
            (nextPowers['METALLICIZE'] || 0) > (previousPowers['METALLICIZE'] || 0) ||
            (nextPowers['REGEN'] || 0) > (previousPowers['REGEN'] || 0);
        if (policy.allowPlayerBlock && (nextPlayer.block || 0) > (previousPlayer.block || 0)) {
            pushUnique({
                id: `vfx-coop-remote-block-${Date.now()}-${ownerPeerId}`,
                type: 'BLOCK',
                targetId: 'player',
                ownerPeerId
            });
        }
        if (policy.allowPlayerHeal && (nextPlayer.currentHp || 0) > (previousPlayer.currentHp || 0)) {
            pushUnique({
                id: `vfx-coop-remote-heal-${Date.now()}-${ownerPeerId}`,
                type: 'HEAL',
                targetId: 'player',
                ownerPeerId
            });
        }
        if (policy.allowPlayerBuff && playerBuffIncreased) {
            pushUnique({
                id: `vfx-coop-remote-buff-${Date.now()}-${ownerPeerId}`,
                type: 'BUFF',
                targetId: 'player',
                ownerPeerId
            });
        }
        if (policy.allowPlayerDebuff && (playerDebuffIncreased || nextPlayer.strength < previousPlayer.strength)) {
            pushUnique({
                id: `vfx-coop-remote-debuff-${Date.now()}-${ownerPeerId}`,
                type: 'DEBUFF',
                targetId: 'player',
                ownerPeerId
            });
        }

        const previousEnemyMap = new Map(previousEnemies.map(enemy => [enemy.id, enemy]));
        nextEnemies.forEach(enemy => {
            const previousEnemy = previousEnemyMap.get(enemy.id);
            if (!previousEnemy) return;
            if (policy.allowEnemyHit && enemy.currentHp < previousEnemy.currentHp) {
                pushUnique({
                    id: `vfx-coop-remote-hit-${Date.now()}-${enemy.id}`,
                    type: 'SLASH',
                    targetId: enemy.id
                });
            }
            if (policy.allowEnemyHeal && enemy.currentHp > previousEnemy.currentHp) {
                pushUnique({
                    id: `vfx-coop-remote-enemy-heal-${Date.now()}-${enemy.id}`,
                    type: 'HEAL',
                    targetId: enemy.id
                });
            }
            if (policy.allowEnemyBlock && enemy.block > previousEnemy.block) {
                pushUnique({
                    id: `vfx-coop-remote-enemy-block-${Date.now()}-${enemy.id}`,
                    type: 'BLOCK',
                    targetId: enemy.id
                });
            }
            const enemyDebuffed =
                enemy.vulnerable > previousEnemy.vulnerable ||
                enemy.weak > previousEnemy.weak ||
                enemy.poison > previousEnemy.poison ||
                enemy.corpseExplosion !== previousEnemy.corpseExplosion ||
                enemy.strength < previousEnemy.strength;
            if (policy.allowEnemyDebuff && enemyDebuffed) {
                pushUnique({
                    id: `vfx-coop-remote-enemy-debuff-${Date.now()}-${enemy.id}`,
                    type: 'DEBUFF',
                    targetId: enemy.id
                });
            }
            const enemyBuffed =
                enemy.strength > previousEnemy.strength ||
                enemy.artifact > previousEnemy.artifact;
            if (policy.allowEnemyBuff && enemyBuffed) {
                pushUnique({
                    id: `vfx-coop-remote-enemy-buff-${Date.now()}-${enemy.id}`,
                    type: 'BUFF',
                    targetId: enemy.id
                });
            }
        });
        return inferred;
    }, [getCoopVfxInferencePolicy]);
    const coopDecisionOwner = useMemo(() => {
        if (!coopSession || coopSession.participants.length === 0) return null;
        return coopSession.participants[coopSession.decisionOwnerIndex] || coopSession.participants[0] || null;
    }, [coopSession]);
    const coopCanDecide = useMemo(() => {
        if (!coopDecisionOwner) return false;
        return coopDecisionOwner.peerId === coopSelfPeerId;
    }, [coopDecisionOwner, coopSelfPeerId]);
    const coopEnemyHpMultiplier = useMemo(() => {
        if (gameState.challengeMode !== 'COOP') return 1;
        const participantCount = coopSession?.participants.length || 1;
        return Math.max(1, Math.min(4, participantCount));
    }, [coopSession, gameState.challengeMode]);
    const coopInteractionDisabled = gameState.challengeMode === 'COOP' && !coopCanDecide;
    const coopInteractionDisabledMessage = coopDecisionOwner
        ? `${coopDecisionOwner.name} が選択しています`
        : '他のプレイヤーの選択を待っています';
    const coopMapSelectionPending = gameState.challengeMode === 'COOP'
        && gameState.screen === GameScreen.MAP
        && !!coopSession
        && !coopSession.isHost
        && !!coopMapPendingNodeId;
    const coopMapPendingMessage = coopMapSelectionPending
        ? 'ホスト承認待ち...'
        : `${coopDecisionOwner?.name || '他のプレイヤー'} が進行先を選択しています`;
    const coopSelfDisplayName = useMemo(() => {
        if (!coopSession) return selectedCharName || 'あなた';
        return coopSession.participants.find(participant => participant.peerId === coopSelfPeerId)?.name
            || coopSession.name
            || selectedCharName
            || 'あなた';
    }, [coopSelfPeerId, coopSession, selectedCharName]);
    const getSelfTurnLogLabel = useCallback(() => {
        if (gameState.challengeMode === 'COOP') {
            return `${coopSelfDisplayName}: ${trans("あなたのターン", languageMode)}`;
        }
        return trans("あなたのターン", languageMode);
    }, [coopSelfDisplayName, gameState.challengeMode, languageMode]);
    const coopAllRewardsResolved = useMemo(() => {
        if (!coopSession || gameState.screen !== GameScreen.REWARD) return false;
        return coopSession.participants.length > 0 && coopSession.participants.every(participant => participant.rewardResolved);
    }, [coopSession, gameState.screen]);
    const coopAllRestResolved = useMemo(() => {
        if (!coopSession || gameState.screen !== GameScreen.REST) return false;
        return coopSession.participants.length > 0 && coopSession.participants.every(participant => participant.restResolved);
    }, [coopSession, gameState.screen]);
    const coopRewardSkipDisabled = gameState.challengeMode === 'COOP' && gameState.screen === GameScreen.REWARD && gameState.rewards.length === 0 && !coopAllRewardsResolved;
    const coopBattleState = gameState.coopBattleState || null;
    const coopBattleQueueView = useMemo(() => {
        const sourceQueue = coopBattleState?.turnQueue || coopBattleQueue;
        return sourceQueue.map(slot => {
            if (slot.type === 'ENEMY') return slot;
            return {
                ...slot,
                type: slot.peerId === coopSelfPeerId ? 'SELF' : 'ALLY'
            } as CoopBattleTurnSlot;
        });
    }, [coopBattleQueue, coopBattleState, coopSelfPeerId]);
    const activeCoopTurnSlot = useMemo(() => {
        if (!coopBattleState || coopBattleState.turnQueue.length === 0) return null;
        return coopBattleState.turnQueue[coopBattleState.turnCursor] || null;
    }, [coopBattleState]);
    const coopBattleCanAct = useMemo(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.BATTLE) return true;
        if (!activeCoopTurnSlot) return true;
        if (coopBattleState?.battleMode === 'REALTIME') {
            if (activeCoopTurnSlot.type === 'ENEMY') return false;
            return !!coopSelfPeerId && !(coopBattleState.roundEndedPeerIds || []).includes(coopSelfPeerId);
        }
        return activeCoopTurnSlot.type !== 'ENEMY' && activeCoopTurnSlot.peerId === coopSelfPeerId;
    }, [activeCoopTurnSlot, coopBattleState, coopSelfPeerId, gameState.challengeMode, gameState.screen]);
    const isCoopHost = gameState.challengeMode === 'COOP' && !!coopSession?.isHost;
    const coopBattleTurnOwnerLabel = activeCoopTurnSlot?.type === 'ENEMY'
        ? '敵の行動'
        : (coopBattleState?.battleMode === 'REALTIME' ? 'みんなのターン' : activeCoopTurnSlot?.label || '');
    const coopBattlePlan = useMemo(() => {
        if (!coopBattleState || coopBattleState.turnQueue.length === 0) {
            return { enemyActions: 0, nextCursor: 0 };
        }
        const queue = coopBattleState.turnQueue;
        const currentCursor = coopBattleState.turnCursor;
        const currentSlot = queue[currentCursor];
        let enemyActions = currentSlot?.type === 'ENEMY' ? 1 : 0;
        let nextCursor = currentCursor;
        for (let offset = 1; offset <= queue.length; offset++) {
            const index = (currentCursor + offset) % queue.length;
            const slot = queue[index];
            if (slot.type === 'ENEMY') {
                enemyActions++;
                continue;
            }
            nextCursor = index;
            break;
        }
        if (currentSlot?.type === 'ENEMY' && enemyActions === 1) {
            const livingEnemyCount = gameState.enemies.filter(enemy =>
                enemy.currentHp > 0 || (enemy.enemyType === 'THE_HEART' && enemy.phase === 1)
            ).length;
            enemyActions = livingEnemyCount;
        }
        return { enemyActions, nextCursor };
    }, [coopBattleState, gameState.enemies]);
    const getAliveCoopCompanions = useCallback(() => {
        if (!coopSession) return [];
        return coopSession.participants.filter(participant => participant.peerId !== coopSelfPeerId && (participant.currentHp ?? participant.maxHp ?? 0) > 0);
    }, [coopSession, coopSelfPeerId]);
    useEffect(() => {
        coopEnemyTurnCursorRef.current = coopEnemyTurnCursor;
    }, [coopEnemyTurnCursor]);
    const updateCoopParticipantState = useCallback((peerId: string, updater: (participant: CoopParticipant) => CoopParticipant) => {
        setCoopSession(prev => {
            if (!prev) return prev;
            const nextParticipants = prev.participants.map(participant => participant.peerId === peerId ? updater(participant) : participant);
            if (prev.isHost) {
                p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
            }
            return { ...prev, participants: nextParticipants };
        });
    }, []);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP') return;
        if (!appSettings.joinMuted) return;
        if (coopVoiceEnabled) {
            setCoopVoiceEnabled(false);
        }
    }, [appSettings.joinMuted, gameState.challengeMode, coopVoiceEnabled]);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || !coopSession || !coopSelfPeerId) return;
        let cancelled = false;
        const syncVoice = async () => {
            const targetVoiceEnabled = coopVoiceEnabled;
            if (!coopSession.isHost) {
                coopPendingVoiceSyncRef.current = targetVoiceEnabled;
            }
            try {
                await p2pService.setVoiceEnabled(targetVoiceEnabled);
                if (targetVoiceEnabled) {
                    await p2pService.startVoiceChatForAll();
                }
                if (cancelled) return;
                if (coopSession.isHost) {
                    setCoopSession(prev => {
                        if (!prev) return prev;
                        let changed = false;
                        const nextParticipants = prev.participants.map(participant => {
                            if (participant.peerId !== coopSelfPeerId) return participant;
                            if (participant.voiceEnabled === targetVoiceEnabled) return participant;
                            changed = true;
                            return { ...participant, voiceEnabled: targetVoiceEnabled };
                        });
                        if (!changed) return prev;
                        p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                        return { ...prev, participants: nextParticipants };
                    });
                } else {
                    p2pService.send({ type: 'COOP_SELF_STATE', voiceEnabled: targetVoiceEnabled });
                }
            } catch (err) {
                console.warn('Failed to toggle coop voice:', err);
                if (!cancelled) {
                    setCoopVoiceEnabled(false);
                    coopPendingVoiceSyncRef.current = null;
                    p2pService.setVoiceEnabled(false).catch(() => undefined);
                }
            }
        };
        syncVoice();
        return () => {
            cancelled = true;
        };
    }, [coopSelfPeerId, coopSession, coopVoiceEnabled, gameState.challengeMode]);
    useEffect(() => {
        if (gameState.challengeMode === 'COOP') return;
        p2pService.setVoiceEnabled(false).catch(() => undefined);
    }, [gameState.challengeMode]);
    useEffect(() => {
        if (!coopSession || !coopSelfPeerId || coopSession.isHost) return;
        const selfParticipant = coopSession.participants.find(participant => participant.peerId === coopSelfPeerId);
        if (typeof selfParticipant?.voiceEnabled !== 'boolean') return;
        if (coopPendingVoiceSyncRef.current !== null) {
            if (selfParticipant.voiceEnabled === coopPendingVoiceSyncRef.current) {
                coopPendingVoiceSyncRef.current = null;
            } else {
                return;
            }
        }
        if (coopVoiceEnabled && !selfParticipant.voiceEnabled) {
            return;
        }
        if (selfParticipant.voiceEnabled !== coopVoiceEnabled) {
            setCoopVoiceEnabled(selfParticipant.voiceEnabled);
        }
    }, [coopSelfPeerId, coopSession, coopVoiceEnabled]);
    const mergeLocalPeerIntoCoopBattleState = useCallback((battleState: CoopBattleState | null): CoopBattleState | null => {
        if (!battleState || !coopSelfPeerId) return battleState;
        const currentPlayer = stateRef.current.player;
        const currentSelectedEnemyId = stateRef.current.selectedEnemyId;
        return {
            ...battleState,
            players: battleState.players.map(entry =>
                entry.peerId === coopSelfPeerId
                    ? {
                        ...entry,
                        player: currentPlayer,
                        selectedEnemyId: currentSelectedEnemyId,
                        isDown: currentPlayer.currentHp <= 0
                    }
                    : entry
            )
        };
    }, [coopSelfPeerId]);
    const preserveLocalBattleCardZones = useCallback((nextPlayer: Player, currentPlayer: Player, options?: { preserveZones?: boolean }): Player => {
        const preserveZones = options?.preserveZones ?? true;
        const pickZone = <T,>(nextZone: T[], currentZone: T[]): T[] => {
            if (!preserveZones) {
                return [...nextZone];
            }
            if (currentZone.length > 0 || nextZone.length === 0) {
                return [...currentZone];
            }
            return [...nextZone];
        };
        const preservedPlayer: Player = {
            ...nextPlayer,
            hand: pickZone(nextPlayer.hand, currentPlayer.hand),
            drawPile: pickZone(nextPlayer.drawPile, currentPlayer.drawPile),
            discardPile: pickZone(nextPlayer.discardPile, currentPlayer.discardPile)
        };
        const currentExhaustPile = (currentPlayer as any).exhaustPile;
        const nextExhaustPile = (nextPlayer as any).exhaustPile;
        if (Array.isArray(currentExhaustPile)) {
            if (currentExhaustPile.length > 0 || !Array.isArray(nextExhaustPile) || nextExhaustPile.length === 0) {
                (preservedPlayer as any).exhaustPile = [...currentExhaustPile];
            } else {
                (preservedPlayer as any).exhaustPile = [...nextExhaustPile];
            }
        } else if (Array.isArray(nextExhaustPile)) {
            (preservedPlayer as any).exhaustPile = [...nextExhaustPile];
        }
        return preservedPlayer;
    }, []);
    const preserveLocalPlayerInCoopBattleState = useCallback((battleState: CoopBattleState | null): CoopBattleState | null => {
        if (!battleState || !coopSelfPeerId) return battleState;
        const currentPlayer = stateRef.current.player;
        const currentSelectedEnemyId = stateRef.current.selectedEnemyId;
        const currentBattleKey = stateRef.current.coopBattleState?.battleKey;
        const shouldPreserveZones = currentBattleKey === battleState.battleKey;
        return {
            ...battleState,
            players: battleState.players.map(entry =>
                entry.peerId === coopSelfPeerId
                    ? {
                        ...entry,
                        player: preserveLocalBattleCardZones(entry.player, currentPlayer, { preserveZones: shouldPreserveZones }),
                        selectedEnemyId: currentSelectedEnemyId ?? entry.selectedEnemyId,
                        isDown: currentPlayer.currentHp <= 0
                    }
                    : entry
            )
        };
    }, [coopSelfPeerId, preserveLocalBattleCardZones]);
    const updateCoopBattleStateForLocalPlayer = useCallback((
        battleState: CoopBattleState | null | undefined,
        nextPlayer: Player,
        selectedEnemyId?: string | null
    ): CoopBattleState | null | undefined => {
        if (!battleState || !coopSelfPeerId) return battleState;
        return {
            ...battleState,
            players: battleState.players.map(entry =>
                entry.peerId === coopSelfPeerId
                    ? {
                        ...entry,
                        player: nextPlayer,
                        selectedEnemyId: selectedEnemyId ?? entry.selectedEnemyId,
                        isDown: nextPlayer.currentHp <= 0
                    }
                    : entry
            )
        };
    }, [coopSelfPeerId]);
    const setCoopBattleState = useCallback((battleState: CoopBattleState | null) => {
        const normalizedBattleState = coopSession?.isHost
            ? mergeLocalPeerIntoCoopBattleState(battleState)
            : preserveLocalPlayerInCoopBattleState(battleState);
        setGameState(prev => ({ ...prev, coopBattleState: normalizedBattleState }));
        setCoopBattleQueue(normalizedBattleState?.turnQueue || []);
        setCoopBattleKey(normalizedBattleState?.battleKey || null);
        setCoopEnemyTurnCursor(normalizedBattleState?.enemyTurnCursor || 0);
    }, [coopSession?.isHost, mergeLocalPeerIntoCoopBattleState, preserveLocalPlayerInCoopBattleState]);
    const buildCoopSharedState = useCallback((state: GameState): CoopSharedState => ({
        screen: state.screen,
        mode: state.mode,
        modePool: state.modePool,
        challengeMode: state.challengeMode,
        typingLessonId: state.typingLessonId,
        act: state.act,
        floor: state.floor,
        turn: state.turn,
        map: state.map,
        currentMapNodeId: state.currentMapNodeId,
        enemies: state.enemies,
        selectedEnemyId: state.selectedEnemyId,
        narrativeLog: state.narrativeLog,
        combatLog: state.combatLog,
        selectionState: state.selectionState,
        isEndless: state.isEndless,
        parryState: state.parryState,
        activeEffects: state.activeEffects,
        currentStoryIndex: state.currentStoryIndex,
        actStats: state.actStats,
        currentEventTitle: state.currentEventTitle,
        newlyUnlockedCardName: state.newlyUnlockedCardName,
        coopBattleState: state.coopBattleState ?? null
    }), []);
    const getBgmForCoopScreen = useCallback((state: Pick<GameState, 'screen' | 'map' | 'currentMapNodeId' | 'enemies'>) => {
        switch (state.screen) {
            case GameScreen.MAP:
            case GameScreen.GARDEN:
                return 'map' as const;
            case GameScreen.BATTLE: {
                if (state.enemies.some(enemy => enemy.enemyType === 'THE_HEART')) {
                    return 'final_boss' as const;
                }
                const currentNode = state.currentMapNodeId
                    ? state.map.find(node => node.id === state.currentMapNodeId)
                    : null;
                if (currentNode?.type === NodeType.BOSS) return 'boss' as const;
                if (currentNode?.type === NodeType.ELITE) return 'mid_boss' as const;
                return 'battle' as const;
            }
            case GameScreen.SHOP:
                return 'shop' as const;
            case GameScreen.REST:
                return 'rest' as const;
            case GameScreen.EVENT:
                return 'event' as const;
            case GameScreen.REWARD:
            case GameScreen.TREASURE:
                return 'reward' as const;
            case GameScreen.FLOOR_RESULT:
            case GameScreen.ENDING:
                return 'victory' as const;
            case GameScreen.GAME_OVER:
                return 'game_over' as const;
            default:
                return null;
        }
    }, []);
    const preparePlayerForBattle = useCallback((sourcePlayer: Player, nodeType: NodeType) => {
        const p: Player = {
            ...sourcePlayer,
            hand: [],
            discardPile: [],
            drawPile: shuffle(sourcePlayer.deck.map(c => ({ ...c }))),
            currentEnergy: sourcePlayer.maxEnergy,
            block: 0,
            strength: 0,
            powers: {},
            relicCounters: { ...sourcePlayer.relicCounters },
            turnFlags: {},
            typesPlayedThisTurn: [],
            echoes: 0,
            cardsPlayedThisTurn: 0,
            attacksPlayedThisTurn: 0,
            codexBuffer: [],
            floatingText: null
        };

        const eventStrengthBonus = p.relicCounters['EVENT_STRENGTH_BONUS'] || 0;
        if (eventStrengthBonus > 0) p.strength += eventStrengthBonus;
        if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) p.relicCounters['HAPPY_FLOWER'] = 0;
        if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
        if (p.relics.find(r => r.id === 'HACHIMAKI')) p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1;
        if (p.relics.find(r => r.id === 'SEED_PACK')) p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
        if (p.relics.find(r => r.id === 'HOLY_WATER')) p.currentEnergy += 1;
        if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
        if (p.relics.find(r => r.id === 'LANTERN')) p.currentEnergy += 1;
        if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
        if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
        if (p.relics.find(r => r.id === 'BIG_LADLE')) {
            p.maxHp += 4;
            p.currentHp += 4;
            p.relicCounters['BIG_LADLE_ACTIVE'] = 1;
        }
        if (nodeType === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) {
            p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
        }
        if (p.turnFlags['STREET_DOG_NEXT_BATTLE']) {
            p.nextTurnEnergy += 3;
            delete p.turnFlags['STREET_DOG_NEXT_BATTLE'];
        }
        if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) p.strength += 3;

        syncRedSkullState(p);

        let drawCount = HAND_SIZE;
        if (p.relics.find(r => r.id === 'BAG_OF_PREP') || p.relics.find(r => r.id === 'BAG_OF_PREPARATION')) drawCount += 2;
        if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;

        for (let i = 0; i < drawCount; i++) {
            const drawn = p.drawPile.pop();
            if (drawn) p.hand.push(drawn);
        }

        if (p.relics.find(r => r.id === 'ENCHIRIDION')) {
            const powerPool = getFilteredCardPool(p.id).filter(c => c.type === CardType.POWER);
            if (powerPool.length > 0) {
                const power = powerPool[Math.floor(Math.random() * powerPool.length)];
                p.hand.push({ ...power, id: `ench-${Date.now()}`, cost: 0 });
            }
        }

        if (p.relics.find(r => r.id === 'WHISTLE')) {
            const attacks = p.drawPile.filter(c => c.type === CardType.ATTACK);
            if (attacks.length > 0) {
                const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
                p.hand.push({ ...randomAttack, cost: 0, id: `whistle-${Date.now()}` });
            } else {
                p.hand.push({ ...CARDS_LIBRARY['STRIKE'], cost: 0, id: `whistle-fallback-${Date.now()}` });
            }
        }

        const innateCards = p.drawPile.filter(c => c.innate);
        innateCards.forEach(c => {
            p.drawPile = p.drawPile.filter(dc => dc.id !== c.id);
            p.hand.push(c);
        });

        p.hpLostThisTurn = 0;
        return p;
    }, []);
    const applyCoopSharedState = useCallback((prev: GameState, sharedState: CoopSharedState): GameState => ({
        ...prev,
        screen: sharedState.screen,
        mode: sharedState.mode,
        modePool: sharedState.modePool,
        challengeMode: 'COOP',
        typingLessonId: sharedState.typingLessonId,
        act: sharedState.act,
        floor: sharedState.floor,
        turn: sharedState.turn,
        map: sharedState.map,
        currentMapNodeId: sharedState.currentMapNodeId,
        enemies: sharedState.enemies,
        selectedEnemyId: sharedState.selectedEnemyId,
        narrativeLog: sharedState.narrativeLog,
        combatLog: sharedState.combatLog,
        selectionState: sharedState.selectionState,
        isEndless: sharedState.isEndless,
        parryState: sharedState.parryState,
        activeEffects: sharedState.activeEffects,
        currentStoryIndex: sharedState.currentStoryIndex,
        actStats: sharedState.actStats,
        currentEventTitle: sharedState.currentEventTitle,
        newlyUnlockedCardName: sharedState.newlyUnlockedCardName,
        coopBattleState: sharedState.coopBattleState ?? null,
        vsOpponent: undefined,
        vsIsHost: undefined
    }), []);
    const broadcastCoopBattleState = useCallback((battleState: CoopBattleState | null, syncOverrides?: {
        activeEffects?: VisualEffectInstance[],
        enemies?: Enemy[],
        selectedEnemyId?: string | null,
        combatLog?: string[],
        turnLog?: string,
        actingEnemyId?: string | null,
        finisherCutinCard?: ICard | null
    }) => {
        if (!coopSession?.isHost) return;
        const normalizedBattleState = mergeLocalPeerIntoCoopBattleState(battleState);
        p2pService.send({
            type: 'COOP_BATTLE_SYNC',
            battleState: normalizedBattleState,
            activeEffects: syncOverrides?.activeEffects ?? gameState.activeEffects,
            enemies: syncOverrides?.enemies ?? gameState.enemies,
            selectedEnemyId: syncOverrides?.selectedEnemyId ?? gameState.selectedEnemyId,
            combatLog: syncOverrides?.combatLog ?? gameState.combatLog,
            turnLog: syncOverrides?.turnLog ?? turnLog,
            actingEnemyId: syncOverrides?.actingEnemyId ?? actingEnemyId,
            finisherCutinCard: syncOverrides?.finisherCutinCard ?? battleFinisherCutinCard
        });
    }, [actingEnemyId, battleFinisherCutinCard, coopSession, gameState.activeEffects, gameState.combatLog, gameState.enemies, gameState.selectedEnemyId, mergeLocalPeerIntoCoopBattleState, turnLog]);
    const upsertCoopPlayerSnapshot = useCallback((peerId: string, player: Player) => {
        setCoopPlayerSnapshots(prev => ({ ...prev, [peerId]: player }));
    }, []);
    const applyCoopPlayerStateToPeer = useCallback((peerId: string, player: Player) => {
        upsertCoopPlayerSnapshot(peerId, player);
        updateCoopParticipantState(peerId, participant => ({
            ...participant,
            selectedCharacterId: player.id,
            imageData: player.imageData,
            maxHp: player.maxHp,
            currentHp: player.currentHp
        }));
        if (peerId === coopSelfPeerId) {
            setGameState(prev => ({ ...prev, player }));
        }
    }, [coopSelfPeerId, updateCoopParticipantState, upsertCoopPlayerSnapshot]);
    const queueCoopBattleEvent = useCallback((event: { type: 'COOP_BATTLE_PLAY_CARD' | 'COOP_BATTLE_USE_POTION' | 'COOP_BATTLE_TURN_START' | 'COOP_BATTLE_SELECTION_STATE' | 'COOP_BATTLE_MODAL_RESOLVE' | 'COOP_BATTLE_CODEX_SELECT', cardId?: string, potionId?: string, playedCard?: ICard }) => {
        queuedCoopBattleEventRef.current = event;
        setQueuedCoopBattleEventTick(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || !coopSession || !coopSelfPeerId || !gameState.player.id) return;
        const selfParticipantName = coopSession.participants.find(participant => participant.peerId === coopSelfPeerId)?.name;
        const selfState: CoopParticipant = {
            peerId: coopSelfPeerId,
            name: selfParticipantName || coopSession.name || selectedCharName,
            imageData: gameState.player.imageData,
            selectedCharacterId: gameState.player.id,
            maxHp: gameState.player.maxHp,
            currentHp: gameState.player.currentHp,
            block: gameState.player.block,
            nextTurnEnergy: gameState.player.nextTurnEnergy,
            strength: gameState.player.strength,
            buffer: gameState.player.powers['BUFFER'] || 0,
            revivedThisBattle: false,
            voiceEnabled: coopVoiceEnabled
        };

        if (coopSession.isHost) {
            setCoopSession(prev => {
                if (!prev) return prev;
                const exists = prev.participants.some(participant => participant.peerId === coopSelfPeerId);
                let changed = !exists;
                const nextParticipants = exists
                    ? prev.participants.map(participant => {
                        if (participant.peerId !== coopSelfPeerId) return participant;
                        const merged = { ...participant, ...selfState };
                        changed = changed || JSON.stringify(merged) !== JSON.stringify(participant);
                        return merged;
                    })
                    : [...prev.participants, selfState];
                if (!changed) return prev;
                p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                return { ...prev, participants: nextParticipants };
            });
            return;
        }

        p2pService.send({
            type: 'COOP_SELF_STATE',
            name: selfState.name,
            imageData: selfState.imageData,
            selectedCharacterId: selfState.selectedCharacterId,
            maxHp: selfState.maxHp,
            currentHp: selfState.currentHp,
            block: selfState.block,
            nextTurnEnergy: selfState.nextTurnEnergy,
            strength: selfState.strength,
            buffer: selfState.buffer,
            revivedThisBattle: selfState.revivedThisBattle,
            voiceEnabled: selfState.voiceEnabled
        });
    }, [coopSelfPeerId, coopSession, coopVoiceEnabled, gameState.challengeMode, gameState.player.block, gameState.player.currentHp, gameState.player.id, gameState.player.imageData, gameState.player.maxHp, gameState.player.nextTurnEnergy, gameState.player.powers, gameState.player.strength, selectedCharName]);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || !coopSession || !coopSelfPeerId || !gameState.player.id) return;
        upsertCoopPlayerSnapshot(coopSelfPeerId, gameState.player);
        if (!coopSession.isHost) {
            p2pService.send({ type: 'COOP_PLAYER_SNAPSHOT', player: gameState.player });
        }
    }, [coopSelfPeerId, coopSession, gameState.challengeMode, gameState.player, upsertCoopPlayerSnapshot]);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || !coopSelfPeerId || !gameState.coopBattleState) return;
        setGameState(prev => {
            if (!prev.coopBattleState) return prev;
            const currentEntry = prev.coopBattleState.players.find(entry => entry.peerId === coopSelfPeerId);
            if (currentEntry && currentEntry.player === prev.player && currentEntry.selectedEnemyId === prev.selectedEnemyId && currentEntry.isDown === (prev.player.currentHp <= 0)) {
                return prev;
            }
            return {
                ...prev,
                coopBattleState: {
                    ...prev.coopBattleState,
                    players: prev.coopBattleState.players.map(entry =>
                        entry.peerId === coopSelfPeerId
                            ? { ...entry, player: prev.player, selectedEnemyId: prev.selectedEnemyId, isDown: prev.player.currentHp <= 0 }
                            : entry
                    )
                }
            };
        });
    }, [coopSelfPeerId, gameState.challengeMode, gameState.player, gameState.selectedEnemyId, gameState.coopBattleState]);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || !coopSession || coopSession.isHost) return;
        const bgmType = getBgmForCoopScreen(gameState);
        if (!bgmType) return;
        void audioService.playBGM(bgmType);
    }, [coopSession, gameState, getBgmForCoopScreen]);

    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.BATTLE || !coopSession || !coopSession.isHost) return;
        // Keep the coop battle identity stable for the whole encounter.
        // Tying it to the alive-enemy list causes a full battle-state rebuild whenever an enemy dies.
        const battleKey = coopBattleState?.battleKey ?? `${gameState.currentMapNodeId ?? 'debug'}:${Date.now()}`;
        if (coopBattleState?.battleKey === battleKey) return;

        const playerSlots: CoopBattleTurnSlot[] = coopSession.participants.map(participant => ({
            id: `coop-turn-player-${battleKey}-${participant.peerId}`,
            type: 'ALLY',
            label: participant.name,
            peerId: participant.peerId
        }));
        const randomizedPlayerSlots = shuffle([...playerSlots]) as CoopBattleTurnSlot[];
        const enemySlot: CoopBattleTurnSlot = {
            id: `coop-turn-enemy-${battleKey}`,
            type: 'ENEMY',
            label: '敵'
        };
        const queue: CoopBattleTurnSlot[] = coopSession.battleMode === 'REALTIME'
            ? [{
                id: `coop-turn-realtime-allies-${battleKey}`,
                type: 'ALLY',
                label: '全員',
            }, enemySlot]
            : [...randomizedPlayerSlots, enemySlot];
        const battlePlayers: CoopBattlePlayerState[] = coopSession.participants.map(participant => {
            const snapshot = coopPlayerSnapshots[participant.peerId] || (participant.peerId === coopSelfPeerId ? gameState.player : null);
            const basePlayer = snapshot ? { ...snapshot } : {
                ...gameState.player,
                id: participant.selectedCharacterId || gameState.player.id,
                imageData: participant.imageData || gameState.player.imageData,
                maxHp: participant.maxHp || gameState.player.maxHp,
                currentHp: participant.currentHp ?? participant.maxHp ?? gameState.player.currentHp,
                block: participant.block || 0,
                hand: [],
                discardPile: [],
                drawPile: [],
                codexBuffer: []
            };
            const player = preparePlayerForBattle(
                basePlayer,
                (gameState.map.find(node => node.id === gameState.currentMapNodeId)?.type || NodeType.COMBAT)
            );
            return {
                peerId: participant.peerId,
                name: participant.name,
                player,
                selectedEnemyId: gameState.selectedEnemyId,
                isDown: player.currentHp <= 0
            };
        });
        const nextBattleState: CoopBattleState = {
            battleKey,
            battleMode: coopSession.battleMode,
            players: battlePlayers,
            turnQueue: queue,
            turnCursor: 0,
            enemyTurnCursor: 0,
            roundEndedPeerIds: []
        };
        setCoopBattleState(nextBattleState);
        broadcastCoopBattleState(nextBattleState);
    }, [broadcastCoopBattleState, coopBattleState, coopPlayerSnapshots, coopSelfPeerId, coopSession, gameState.challengeMode, gameState.currentMapNodeId, gameState.enemies, gameState.map, gameState.player, gameState.screen, gameState.selectedEnemyId, preparePlayerForBattle, setCoopBattleState]);

    useEffect(() => {
        if (gameState.screen === GameScreen.BATTLE) return;
        if (coopBattleQueue.length === 0 && coopBattleKey === null && coopEnemyTurnCursor === 0 && !gameState.coopBattleState) return;
        coopStartedTurnSlotRef.current = null;
        setCoopBattleState(null);
    }, [coopBattleKey, coopBattleQueue.length, coopEnemyTurnCursor, gameState.coopBattleState, gameState.screen, setCoopBattleState]);
    const getDefaultRaceTarget = useCallback(() => {
        const targets = getRaceTargetEntries();
        return targets[0] || null;
    }, [getRaceTargetEntries]);

    const applyRaceDamageToLocalPlayer = useCallback((amount: number, label: string) => {
        if (amount <= 0) return;
        setGameState(prev => {
            const nextHp = Math.max(0, prev.player.currentHp - amount);
            const nextState: GameState = {
                ...prev,
                player: {
                    ...prev.player,
                    currentHp: nextHp,
                    floatingText: { id: `race-hit-${Date.now()}`, text: `-${amount} HP`, color: 'text-red-400', iconType: 'skull' }
                }
            };
            if (nextHp <= 0 && prev.screen !== GameScreen.GAME_OVER) {
                audioService.playBGM('game_over');
                return { ...nextState, screen: GameScreen.GAME_OVER };
            }
            return nextState;
        });
        showRaceToast(label);
    }, [showRaceToast]);

    const applyRaceGoldDelta = useCallback((delta: number, label: string) => {
        if (delta === 0) return;
        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                gold: Math.max(0, prev.player.gold + delta),
                floatingText: { id: `race-gold-${Date.now()}`, text: `${delta > 0 ? '+' : ''}${delta}G`, color: delta > 0 ? 'text-yellow-300' : 'text-amber-400', iconType: 'zap' }
            }
        }));
        showRaceToast(label);
    }, [showRaceToast]);

    const applyRaceTrickEffectLocal = useCallback((effectId: RaceTrickEffectId, sourceName: string, sourceGold: number) => {
        const now = Date.now();
        switch (effectId) {
            case 'LATE_DAMAGE':
                applyRaceDamageToLocalPlayer(5, `${sourceName} の遅刻ダメージ`);
                break;
            case 'RETEST_DAMAGE':
                setRaceEffects(prev => ({ ...prev, nextBattleDamage: prev.nextBattleDamage + 8 }));
                showRaceToast(`${sourceName} の追試ダメージ`);
                break;
            case 'WALLET_SWAP': {
                const targetGoldBefore = stateRef.current.player.gold;
                setGameState(prev => ({ ...prev, player: { ...prev.player, gold: sourceGold, floatingText: { id: `wallet-swap-${Date.now()}`, text: `${sourceGold}G`, color: 'text-yellow-300', iconType: 'zap' } } }));
                showRaceToast(`${sourceName} とお財布交換`);
                return targetGoldBefore;
            }
            case 'GOLD_SIPHON': {
                const targetGoldBefore = stateRef.current.player.gold;
                const stolen = Math.max(1, Math.floor(targetGoldBefore * 0.15));
                setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - stolen), floatingText: { id: `gold-siphon-${Date.now()}`, text: `-${stolen}G`, color: 'text-amber-300', iconType: 'zap' } } }));
                showRaceToast(`${sourceName} に ${stolen}G 奪われた`);
                return stolen;
            }
            case 'SHOP_MARKUP':
                setRaceEffects(prev => ({ ...prev, shopMarkupUntil: Math.max(prev.shopMarkupUntil, now + 12000) }));
                showRaceToast(`${sourceName} の購買部値上げ`);
                break;
            case 'PAPER_STORM':
                setRaceEffects(prev => ({ ...prev, paperStormUntil: Math.max(prev.paperStormUntil, now + 8000) }));
                showRaceToast(`${sourceName} のプリント散乱`);
                break;
            case 'CHALK_DUST':
                setRaceEffects(prev => ({ ...prev, chalkDustUntil: Math.max(prev.chalkDustUntil, now + 8000) }));
                showRaceToast(`${sourceName} のチョークの粉`);
                break;
            case 'DESK_SHAKE':
                setRaceEffects(prev => ({ ...prev, deskShakeUntil: Math.max(prev.deskShakeUntil, now + 5000) }));
                showRaceToast(`${sourceName} のぐらぐら机`);
                break;
            case 'UPSIDE_DOWN_NOTES':
                setRaceEffects(prev => ({ ...prev, upsideDownUntil: Math.max(prev.upsideDownUntil, now + 6000) }));
                showRaceToast(`${sourceName} のさかさノート`);
                break;
            case 'SLEEPY_VIGNETTE':
                setRaceEffects(prev => ({ ...prev, sleepyVignetteUntil: Math.max(prev.sleepyVignetteUntil, now + 10000) }));
                showRaceToast(`${sourceName} の居眠りフィルタ`);
                break;
            case 'SLOW_BELL':
                setRaceEffects(prev => ({ ...prev, slowBellUntil: Math.max(prev.slowBellUntil, now + 2500) }));
                showRaceToast(`${sourceName} のろのろチャイム`);
                break;
            case 'SCORE_MIST':
                setRaceEffects(prev => ({ ...prev, scoreMistUntil: Math.max(prev.scoreMistUntil, now + 12000) }));
                showRaceToast(`${sourceName} のスコア減衰ミスト`);
                break;
            case 'FAKE_SIGNBOARD':
                setRaceEffects(prev => ({ ...prev, fakeSignboardUntil: Math.max(prev.fakeSignboardUntil, now + 8000) }));
                showRaceToast(`${sourceName} のにせ案内板`);
                break;
            case 'DETENTION_TAX':
                setRaceEffects(prev => ({ ...prev, detentionTaxUntil: Math.max(prev.detentionTaxUntil, now + 12000) }));
                showRaceToast(`${sourceName} の居残りペナルティ`);
                break;
            case 'SLEEP_GLASSES':
                setRaceEffects(prev => ({ ...prev, nextBattleHandPenalty: Math.max(prev.nextBattleHandPenalty, 1) }));
                showRaceToast(`${sourceName} のねむけメガネ`);
                break;
            case 'BLACKBOARD_SMOKE':
                setRaceEffects(prev => ({ ...prev, hideEnemyIntentsOnce: true }));
                showRaceToast(`${sourceName} の黒板けむり`);
                break;
            case 'POP_QUIZ_HURRY':
                setRaceEffects(prev => ({ ...prev, nextQuestionDelayCount: prev.nextQuestionDelayCount + 1 }));
                showRaceToast(`${sourceName} の抜き打ち小テスト`);
                break;
            case 'PRINT_AVALANCHE':
                setRaceEffects(prev => ({ ...prev, rewardDummyCount: Math.max(prev.rewardDummyCount, 2) }));
                showRaceToast(`${sourceName} のプリント雪崩`);
                break;
            case 'SHOE_LACE':
                setRaceEffects(prev => ({ ...prev, shoeLaceUntil: Math.max(prev.shoeLaceUntil, now + 12000) }));
                showRaceToast(`${sourceName} のくつひもトラップ`);
                break;
            case 'FORGOTTEN_HOMEWORK':
                setRaceEffects(prev => ({ ...prev, forgottenHomeworkCount: prev.forgottenHomeworkCount + 1 }));
                showRaceToast(`${sourceName} の忘れもの通知`);
                break;
        }
        return undefined;
    }, [applyRaceDamageToLocalPlayer, showRaceToast]);

    const isEndingTurnRef = useRef(false);

    const [totalPlaySeconds, setTotalPlaySeconds] = useState(() => storageService.getTotalPlayTime());
    const [dailyPlaySeconds, setDailyPlaySeconds] = useState(() => storageService.getDailyPlayTime());
    const [modeCorrectCounts, setModeCorrectCounts] = useState<Record<string, number>>(() => storageService.getModeCorrectCounts());
    const [masteredModes, setMasteredModes] = useState<string[]>(() => storageService.getMasteredModes());
    const [masteryRewardModal, setMasteryRewardModal] = useState<{ mode: string } | null>(null);
    const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
    const BASE_PLAY_LIMIT_SECONDS = 3600; // 1 Hour
    const isTypingMasteryMode = (modeKey: string) => modeKey.startsWith('TYPING_') || modeKey.startsWith('typing:');
    const masteryBonusSeconds = masteredModes.filter(modeKey => !isTypingMasteryMode(modeKey)).length * 300;
    const PLAY_LIMIT_SECONDS = BASE_PLAY_LIMIT_SECONDS + masteryBonusSeconds;

    const formatTime = (total: number) => {
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isDailyLimitReached = dailyPlaySeconds >= PLAY_LIMIT_SECONDS;

    const VICTORY_GOLD = 25;

    const UNLOCK_THRESHOLDS = [500, 1000, 1500, 2000, 2500, 3000, 3500];
    const getRaceSyncIntervalMs = (participantsCount: number) => {
        if (participantsCount >= 30) return 10000;
        if (participantsCount >= 20) return 7000;
        return 5000;
    };
    const raceScore = (floor: number, maxDamage: number, gameOverCount: number) => {
        const base = floor * 100 + maxDamage - gameOverCount * 30;
        return raceEffects.scoreMistUntil > raceEffectNow ? Math.floor(base * 0.8) : base;
    };
    const raceFloorProgress = (act: number, floor: number) => (Math.max(1, act) - 1) * 17 + Math.max(0, floor);
    const formatRaceRemaining = (sec: number) => {
        const remain = Math.max(0, sec);
        const m = Math.floor(remain / 60);
        const s = remain % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const addLog = useCallback((msg: string, color: string = 'white') => {
        setGameState(prev => ({
            ...prev,
            combatLog: [...prev.combatLog, msg].slice(-100)
        }));
    }, []);

    const unlockRandomAdditionalCard = useCallback(() => {
        const unlocked = storageService.getUnlockedCards();
        const allAdditional = Object.values(ADDITIONAL_CARDS);
        const lockedAdditional = allAdditional.filter(c => !unlocked.includes(c.name));

        if (lockedAdditional.length > 0) {
            const randomCardTemplate = lockedAdditional[Math.floor(Math.random() * lockedAdditional.length)];
            storageService.saveUnlockedCard(randomCardTemplate.name);
            return { ...randomCardTemplate, id: `unlocked-${Date.now()}` } as ICard;
        }
        return null;
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTotalPlaySeconds(prev => {
                const next = prev + 1;
                storageService.saveTotalPlayTime(next);
                return next;
            });

            if (gameState.challengeMode === 'TYPING') {
                return;
            }

            if (gameState.screen !== GameScreen.START_MENU && gameState.screen !== GameScreen.PROBLEM_CHALLENGE) {
                const currentFromStorage = storageService.getDailyPlayTime();

                setDailyPlaySeconds(prev => {
                    if (currentFromStorage === 0 && prev > 0) {
                        return 0;
                    }

                    if (prev >= PLAY_LIMIT_SECONDS) return prev;

                    const next = prev + 1;
                    storageService.saveDailyPlayTime(next);

                    if (next >= PLAY_LIMIT_SECONDS) {
                        setGameState(curr => {
                            if (curr.screen === GameScreen.START_MENU) return curr;
                            storageService.saveGame(curr);
                            audioService.playBGM('menu');
                            setShowTimeLimitModal(true);
                            return { ...curr, screen: GameScreen.START_MENU };
                        });
                    }
                    return next;
                });
            } else if (gameState.screen === GameScreen.START_MENU) {
                const currentFromStorage = storageService.getDailyPlayTime();
                setDailyPlaySeconds(prev => {
                    if (currentFromStorage === 0 && prev > 0) return 0;
                    return prev;
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState.screen, PLAY_LIMIT_SECONDS, gameState.challengeMode]);

    useEffect(() => {
        if (gameState.challengeMode === 'RACE' || gameState.challengeMode === 'COOP') {
            return;
        }
        if (gameState.screen !== GameScreen.START_MENU &&
            gameState.screen !== GameScreen.GAME_OVER &&
            gameState.screen !== GameScreen.ENDING &&
            gameState.screen !== GameScreen.VICTORY &&
            gameState.screen !== GameScreen.COMPENDIUM &&
            gameState.screen !== GameScreen.HELP &&
            gameState.screen !== GameScreen.CHARACTER_SELECTION &&
            gameState.screen !== GameScreen.RELIC_SELECTION &&
            gameState.screen !== GameScreen.MODE_SELECTION &&
            gameState.screen !== GameScreen.DEBUG_MENU &&
            gameState.screen !== GameScreen.MINI_GAME_SELECT &&
            gameState.screen === GameScreen.MINI_GAME_POKER ||
            gameState.screen === GameScreen.MINI_GAME_SURVIVOR ||
            gameState.screen === GameScreen.MINI_GAME_DUNGEON ||
            gameState.screen === GameScreen.MINI_GAME_DUNGEON_2 ||
            gameState.screen === GameScreen.MINI_GAME_KOCHO ||
            gameState.screen === GameScreen.MINI_GAME_PAPER_PLANE ||
            gameState.screen === GameScreen.MINI_GAME_GO_HOME ||
            gameState.screen !== GameScreen.PROBLEM_CHALLENGE &&
            gameState.screen !== GameScreen.VS_SETUP &&
            gameState.screen !== GameScreen.VS_BATTLE &&
            gameState.screen !== GameScreen.RACE_SETUP &&
            gameState.screen !== GameScreen.FLOOR_RESULT
        ) {
            storageService.saveGame(gameState);
        }

        if (gameState.screen === GameScreen.START_MENU) {
            setHasSave(storageService.hasSaveFile());
        }
    }, [gameState]);

    useEffect(() => {
        if (!raceSession || gameState.challengeMode !== 'RACE' || gameState.screen === GameScreen.RACE_SETUP) return;

        const previousOnData = p2pService.onData;
        p2pService.onData = (data, fromPeerId) => {
            if (data.type === 'RACE_JOIN' && raceSession.isHost && fromPeerId) {
                setRaceSession(prev => {
                    if (!prev) return prev;
                    const nextParticipants = prev.participants.some(p => p.peerId === fromPeerId)
                        ? prev.participants.map(p => p.peerId === fromPeerId ? { ...p, name: data.name, imageData: data.imageData } : p)
                        : [...prev.participants, { peerId: fromPeerId, name: data.name, imageData: data.imageData }];
                    const nextEntries = prev.entries.some(e => e.peerId === fromPeerId)
                        ? prev.entries
                        : [...prev.entries, { peerId: fromPeerId, name: data.name, imageData: data.imageData, floor: 0, maxDamage: 0, gameOverCount: 0, score: 0, updatedAt: Date.now() }];
                    const sortedEntries = [...nextEntries].sort(compareRaceEntries);
                    p2pService.sendTo(fromPeerId, { type: 'RACE_PARTICIPANTS', participants: nextParticipants });
                    p2pService.sendTo(fromPeerId, { type: 'RACE_START', endAt: prev.endAt, durationSec: prev.durationSec, mode: gameState.mode });
                    p2pService.sendTo(fromPeerId, { type: 'RACE_MODE_SET', mode: gameState.mode });
                    p2pService.sendTo(fromPeerId, { type: 'RACE_LEADERBOARD', entries: sortedEntries });
                    if (prev.ended) {
                        p2pService.sendTo(fromPeerId, { type: 'RACE_END', entries: sortedEntries });
                    }
                    return { ...prev, participants: nextParticipants, entries: sortedEntries };
                });
                return;
            }

            if (data.type === 'RACE_MODE_SET' && !raceSession.isHost) {
                setGameState(prev => ({ ...prev, mode: data.mode, screen: GameScreen.CHARACTER_SELECTION }));
                return;
            }

            if (data.type === 'RACE_PROGRESS' && raceSession.isHost && fromPeerId) {
                setRaceSession(prev => {
                    if (!prev || prev.ended) return prev;
                    const nextEntry: RaceEntry = { peerId: fromPeerId, ...data };
                    const nextEntries = [...prev.entries.filter(e => e.peerId !== fromPeerId), nextEntry].sort(compareRaceEntries);
                    return { ...prev, entries: nextEntries };
                });
                return;
            }

            if (data.type === 'RACE_LEADERBOARD' && !raceSession.isHost) {
                setRaceSession(prev => prev ? { ...prev, entries: [...data.entries].sort(compareRaceEntries) } : prev);
                return;
            }

            if (data.type === 'RACE_TRICK_PLAY' && raceSession.isHost && fromPeerId) {
                if (data.effectId !== 'WALLET_SWAP') {
                    applyRaceTrickEffectLocal(data.effectId, data.sourceName, data.sourceGold);
                    p2pService.getConnectedPeerIds()
                        .filter(peerId => peerId !== fromPeerId)
                        .forEach(peerId => {
                            p2pService.sendTo(peerId, { type: 'RACE_TRICK_APPLY', cardId: data.cardId, effectId: data.effectId, sourcePeerId: fromPeerId, sourceName: data.sourceName, sourceGold: data.sourceGold });
                        });
                } else if (data.targetPeerId === 'host') {
                    const localResult = applyRaceTrickEffectLocal(data.effectId, data.sourceName, data.sourceGold);
                    if (data.effectId === 'WALLET_SWAP') {
                        p2pService.sendTo(fromPeerId, { type: 'RACE_TRICK_RESULT', effectId: data.effectId, sourcePeerId: fromPeerId, targetPeerId: 'host', sourceGoldAfter: Number(localResult || 0) });
                    } else if (data.effectId === 'GOLD_SIPHON') {
                        p2pService.sendTo(fromPeerId, { type: 'RACE_TRICK_RESULT', effectId: data.effectId, sourcePeerId: fromPeerId, targetPeerId: 'host', goldDelta: Number(localResult || 0) });
                    }
                } else {
                    p2pService.sendTo(data.targetPeerId, { type: 'RACE_TRICK_APPLY', cardId: data.cardId, effectId: data.effectId, sourcePeerId: fromPeerId, sourceName: data.sourceName, sourceGold: data.sourceGold });
                }
                return;
            }

            if (data.type === 'RACE_TRICK_APPLY') {
                const localResult = applyRaceTrickEffectLocal(data.effectId, data.sourceName, data.sourceGold);
                if (data.effectId === 'WALLET_SWAP' || data.effectId === 'GOLD_SIPHON') {
                    if (raceSession.isHost) {
                        if (data.effectId === 'WALLET_SWAP') {
                            if (data.sourcePeerId === 'host') {
                                setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Number(localResult || 0) } }));
                            } else {
                                p2pService.sendTo(data.sourcePeerId, { type: 'RACE_TRICK_RESULT', effectId: data.effectId, sourcePeerId: data.sourcePeerId, targetPeerId: 'host', sourceGoldAfter: Number(localResult || 0) });
                            }
                        } else {
                            if (data.sourcePeerId === 'host') {
                                applyRaceGoldDelta(Number(localResult || 0), 'おつりミスでゴールド獲得');
                            } else {
                                p2pService.sendTo(data.sourcePeerId, { type: 'RACE_TRICK_RESULT', effectId: data.effectId, sourcePeerId: data.sourcePeerId, targetPeerId: raceSelfPeerId, goldDelta: Number(localResult || 0) });
                            }
                        }
                    } else {
                        p2pService.send({ type: 'RACE_TRICK_RESULT', effectId: data.effectId, sourcePeerId: data.sourcePeerId, targetPeerId: raceSelfPeerId, sourceGoldAfter: data.effectId === 'WALLET_SWAP' ? Number(localResult || 0) : undefined, goldDelta: data.effectId === 'GOLD_SIPHON' ? Number(localResult || 0) : undefined });
                    }
                }
                return;
            }

            if (data.type === 'RACE_TRICK_RESULT') {
                if (raceSession.isHost && data.sourcePeerId !== 'host') {
                    p2pService.sendTo(data.sourcePeerId, data);
                    return;
                }
                if (data.effectId === 'WALLET_SWAP' && data.sourceGoldAfter !== undefined) {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, gold: data.sourceGoldAfter!, floatingText: { id: `wallet-back-${Date.now()}`, text: `${data.sourceGoldAfter}G`, color: 'text-yellow-300', iconType: 'zap' } } }));
                    showRaceToast('お財布交換が成立');
                }
                if (data.effectId === 'GOLD_SIPHON' && data.goldDelta) {
                    applyRaceGoldDelta(data.goldDelta, 'おつりミスでゴールド獲得');
                }
                return;
            }

            if (data.type === 'RACE_END') {
                setRaceSession(prev => prev ? { ...prev, ended: true, entries: [...data.entries].sort(compareRaceEntries) } : prev);
                setRaceResultOpen(true);
            }
        };

        return () => {
            p2pService.onData = previousOnData;
        };
    }, [raceSession, gameState.challengeMode, gameState.screen, gameState.mode, applyRaceTrickEffectLocal, applyRaceGoldDelta, showRaceToast, raceSelfPeerId]);

    const sendCoopStateSync = useCallback(() => {
        if (!isCoopHost) return;
        p2pService.send({
            type: 'COOP_STATE_SYNC',
            state: buildCoopSharedState(gameState),
            aux: {
                shopCards,
                shopRelics,
                shopPotions,
                treasureRewards,
                treasureOpened,
                treasurePools,
                eventData: eventData ? {
                    title: eventData.title,
                    description: eventData.description,
                    image: eventData.image,
                    imageKey: eventData.imageKey,
                    options: (eventData.options || []).map((option: any) => ({
                        label: option.label,
                        text: option.text
                    }))
                } : null,
                eventResultLog
            }
        });
    }, [buildCoopSharedState, eventData, eventResultLog, gameState, isCoopHost, shopCards, shopPotions, shopRelics, treasureOpened, treasurePools, treasureRewards]);
    const sendCoopRewardSyncToPeer = useCallback((peerId: string) => {
        if (!coopSession?.isHost || gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.REWARD) return;
        const participant = coopSession.participants.find(entry => entry.peerId === peerId);
        if (!participant) return;
        const rewardSet = coopRewardSets[peerId];
        if (!rewardSet) return;

        p2pService.sendTo(peerId, { type: 'COOP_REWARD_SYNC', rewards: rewardSet });
    }, [coopRewardSets, coopSession, gameState.challengeMode, gameState.screen]);
    const requestCoopStateSync = useCallback(() => {
        if (!coopSession || coopSession.isHost || gameState.challengeMode !== 'COOP') return;
        p2pService.send({ type: 'COOP_STATE_SYNC_REQUEST' });
        if (gameState.screen === GameScreen.REWARD) {
            p2pService.send({ type: 'COOP_REWARD_SYNC_REQUEST' });
        }
    }, [coopSession, gameState.challengeMode, gameState.screen]);
    useEffect(() => {
        if (!isCoopHost) return;
        if (gameState.screen === GameScreen.COOP_SETUP || gameState.screen === GameScreen.START_MENU) return;

        const syncableScreens = new Set<GameScreen>([
            GameScreen.MODE_SELECTION,
            GameScreen.CHARACTER_SELECTION,
            GameScreen.RELIC_SELECTION,
            GameScreen.MAP,
            GameScreen.BATTLE,
            GameScreen.REWARD,
            GameScreen.REST,
            GameScreen.SHOP,
            GameScreen.TREASURE,
            GameScreen.FLOOR_RESULT,
            GameScreen.EVENT,
            GameScreen.GAME_OVER,
            GameScreen.ENDING
        ]);

        if (!syncableScreens.has(gameState.screen)) return;
        if (
            gameState.challengeMode === 'COOP' &&
            coopNeedsInitialMapSync &&
            prevScreenRef.current === GameScreen.RELIC_SELECTION &&
            gameState.screen === GameScreen.MAP
        ) {
            return;
        }
        const timeout = window.setTimeout(() => {
            sendCoopStateSync();
        }, 80);

        return () => window.clearTimeout(timeout);
    }, [coopNeedsInitialMapSync, gameState.challengeMode, gameState.screen, isCoopHost, sendCoopStateSync]);
    useEffect(() => {
        if (!coopSession?.isHost || gameState.challengeMode !== 'COOP') return;
        if (prevScreenRef.current !== GameScreen.BATTLE || gameState.screen === GameScreen.BATTLE) return;
        p2pService.send({
            type: 'COOP_BATTLE_FINISH',
            screen: gameState.screen,
            enemies: gameState.enemies,
            selectedEnemyId: gameState.selectedEnemyId,
            combatLog: gameState.combatLog
        });
        sendCoopStateSync();
        broadcastCoopBattleState(null);
    }, [broadcastCoopBattleState, coopSession, gameState, sendCoopStateSync]);
    useEffect(() => {
        if (!coopSession?.isHost || gameState.challengeMode !== 'COOP' || !gameState.coopBattleState) return;
        const timeout = window.setTimeout(() => {
            broadcastCoopBattleState(gameState.coopBattleState || null);
        }, 50);
        return () => window.clearTimeout(timeout);
    }, [broadcastCoopBattleState, coopSession, gameState.challengeMode, gameState.coopBattleState]);
    useEffect(() => {
        if (
            !coopSession?.isHost ||
            gameState.challengeMode !== 'COOP' ||
            gameState.screen !== GameScreen.BATTLE ||
            !gameState.coopBattleState
        ) {
            return;
        }
        broadcastCoopBattleState(gameState.coopBattleState);
    }, [battleFinisherCutinCard, broadcastCoopBattleState, coopSession, gameState.challengeMode, gameState.coopBattleState, gameState.screen]);
    useEffect(() => {
        if (
            queuedCoopBattleEventTick === 0 ||
            gameState.challengeMode !== 'COOP' ||
            gameState.screen !== GameScreen.BATTLE ||
            !coopSession ||
            coopSession.isHost ||
            coopApplyingRemoteBattleSyncRef.current
        ) {
            return;
        }
        const queuedEvent = queuedCoopBattleEventRef.current;
        if (!queuedEvent) {
            return;
        }
        const latestState = stateRef.current;
        const actionSignature = JSON.stringify({
            eventType: queuedEvent.type,
            cardId: queuedEvent.cardId ?? null,
            potionId: queuedEvent.potionId ?? null,
            playedCardId: queuedEvent.playedCard?.id ?? null,
            battleKey: latestState.coopBattleState?.battleKey ?? null,
            turnCursor: latestState.coopBattleState?.turnCursor ?? 0,
            enemyTurnCursor: latestState.coopBattleState?.enemyTurnCursor ?? 0,
            selectedEnemyId: latestState.selectedEnemyId,
            player: latestState.player,
            enemies: latestState.enemies,
            combatLog: latestState.combatLog,
            turnLog,
            actingEnemyId
        });
        if (coopLastBattleActionSignatureRef.current === actionSignature) {
            queuedCoopBattleEventRef.current = null;
            return;
        }
        const timeout = window.setTimeout(() => {
            const latestState = stateRef.current;
            coopLastBattleActionSignatureRef.current = actionSignature;
            p2pService.send({
                type: queuedEvent.type,
                ...(queuedEvent.cardId ? { cardId: queuedEvent.cardId } : {}),
                ...(queuedEvent.potionId ? { potionId: queuedEvent.potionId } : {}),
                ...(queuedEvent.playedCard ? { playedCard: queuedEvent.playedCard } : {}),
                player: latestState.player,
                activeEffects: latestState.activeEffects,
                enemies: latestState.enemies,
                selectedEnemyId: latestState.selectedEnemyId,
                combatLog: latestState.combatLog,
                turnLog,
                actingEnemyId,
                battleState: latestState.coopBattleState || null
            } as any);
            queuedCoopBattleEventRef.current = null;
        }, 40);
        return () => window.clearTimeout(timeout);
    }, [actingEnemyId, coopSession, gameState.challengeMode, gameState.coopBattleState, gameState.combatLog, gameState.enemies, gameState.player, gameState.screen, gameState.selectedEnemyId, queuedCoopBattleEventTick, turnLog]);
    useEffect(() => {
        if (gameState.screen !== GameScreen.BATTLE) {
            coopLastBattleActionSignatureRef.current = null;
        }
    }, [gameState.screen]);

    useEffect(() => {
        if (!raceSession || raceSession.ended || gameState.challengeMode !== 'RACE') return;
        const syncIntervalMs = getRaceSyncIntervalMs(raceSession.participants.length);

        const tick = () => {
            const floor = raceFloorProgress(gameState.act, gameState.floor);
            const score = raceScore(floor, raceMaxDamage, raceGameOverCount);
            const payload = {
                name: raceSession.name,
                imageData: gameState.player.imageData,
                floor,
                maxDamage: raceMaxDamage,
                gameOverCount: raceGameOverCount,
                score,
                updatedAt: Date.now()
            };

            if (raceSession.isHost) {
                setRaceSession(prev => {
                    if (!prev || prev.ended) return prev;
                    const selfEntry: RaceEntry = { peerId: 'host', ...payload };
                    const nextEntries = [...prev.entries.filter(e => e.peerId !== 'host'), selfEntry].sort(compareRaceEntries);
                    return { ...prev, entries: nextEntries };
                });
            } else {
                p2pService.send({ type: 'RACE_PROGRESS', ...payload });
            }
        };

        tick();
        const interval = setInterval(tick, syncIntervalMs);
        return () => clearInterval(interval);
    }, [raceSession, gameState.challengeMode, gameState.act, gameState.floor, gameState.player.imageData, raceMaxDamage, raceGameOverCount]);

    useEffect(() => {
        if (!raceSession || raceSession.ended || !raceSession.isHost || gameState.challengeMode !== 'RACE') return;
        const syncIntervalMs = getRaceSyncIntervalMs(raceSession.participants.length);
        const broadcast = () => {
            const entries = [...raceSession.entries].sort(compareRaceEntries);
            p2pService.send({ type: 'RACE_LEADERBOARD', entries });
        };
        broadcast();
        const interval = setInterval(broadcast, syncIntervalMs);
        return () => clearInterval(interval);
    }, [raceSession, gameState.challengeMode]);

    useEffect(() => {
        if (!raceSession || raceSession.ended) return;
        if (raceNow < raceSession.endAt) return;

        setRaceSession(prev => {
            if (!prev || prev.ended) return prev;
            const finalEntries = [...prev.entries].sort(compareRaceEntries);
            if (prev.isHost) {
                p2pService.send({ type: 'RACE_END', entries: finalEntries });
            }
            return { ...prev, ended: true, entries: finalEntries };
        });
        setRaceResultOpen(true);
    }, [raceSession, raceNow]);

    useEffect(() => {
        if (!raceSession || raceSession.ended) return;
        const updateRemaining = () => {
            const now = Date.now();
            setRaceNow(now);
            const remainSec = Math.max(0, Math.ceil((raceSession.endAt - now) / 1000));
            setRaceRemainingSec(remainSec);
        };
        updateRemaining();
        const interval = setInterval(updateRemaining, 1000);
        return () => clearInterval(interval);
    }, [raceSession]);

    useEffect(() => {
        if (gameState.challengeMode !== 'RACE') return;
        const tick = () => setRaceEffectNow(Date.now());
        tick();
        const interval = window.setInterval(tick, 200);
        return () => window.clearInterval(interval);
    }, [gameState.challengeMode]);

    useEffect(() => {
        if (gameState.challengeMode !== 'RACE') return;
        const isChallengeScreen =
            gameState.screen === GameScreen.MATH_CHALLENGE ||
            gameState.screen === GameScreen.KANJI_CHALLENGE ||
            gameState.screen === GameScreen.ENGLISH_CHALLENGE ||
            gameState.screen === GameScreen.GENERAL_CHALLENGE;
        if (!isChallengeScreen) return;
        setRaceEffects(prev => {
            if (prev.nextQuestionDelayCount <= 0) return prev;
            return {
                ...prev,
                nextQuestionDelayCount: prev.nextQuestionDelayCount - 1,
                slowBellUntil: Math.max(prev.slowBellUntil, Date.now() + 2500)
            };
        });
    }, [gameState.challengeMode, gameState.screen]);

    useEffect(() => {
        if (gameState.challengeMode !== 'RACE') return;
        if (gameState.screen !== GameScreen.BATTLE || prevScreenRef.current === GameScreen.BATTLE) return;
        const now = Date.now();
        if (raceEffects.nextBattleDamage > 0) {
            applyRaceDamageToLocalPlayer(raceEffects.nextBattleDamage, '追試ダメージが発動');
            setRaceEffects(prev => ({ ...prev, nextBattleDamage: 0 }));
        }
        if (raceEffects.nextBattleHandPenalty > 0 || raceEffects.forgottenHomeworkCount > 0) {
            setGameState(prev => {
                const p = {
                    ...prev.player,
                    hand: [...prev.player.hand],
                    discardPile: [...prev.player.discardPile]
                };
                for (let i = 0; i < raceEffects.nextBattleHandPenalty; i++) {
                    const removed = p.hand.pop();
                    if (removed) p.discardPile.unshift(removed);
                }
                for (let i = 0; i < raceEffects.forgottenHomeworkCount; i++) {
                    const status = STATUS_CARDS['DAZED'] || STATUS_CARDS['SLIME'] || CURSE_CARDS['CLUMSY'];
                    if (status) {
                        p.discardPile.unshift({ ...status, id: `race-status-${now}-${i}` });
                    }
                }
                return { ...prev, player: p };
            });
            setRaceEffects(prev => ({ ...prev, nextBattleHandPenalty: 0, forgottenHomeworkCount: 0 }));
        }
    }, [gameState.challengeMode, gameState.screen, raceEffects.nextBattleDamage, raceEffects.nextBattleHandPenalty, raceEffects.forgottenHomeworkCount, applyRaceDamageToLocalPlayer]);

    useEffect(() => {
        if (gameState.challengeMode !== 'RACE') return;
        if (gameState.screen !== GameScreen.REWARD) return;
        if (raceEffects.detentionTaxUntil <= Date.now()) return;
        const interval = window.setInterval(() => {
            if (stateRef.current.screen !== GameScreen.REWARD) return;
            if (Date.now() > raceEffects.detentionTaxUntil) return;
            applyRaceDamageToLocalPlayer(1, '居残りペナルティ');
        }, 1000);
        return () => window.clearInterval(interval);
    }, [gameState.challengeMode, gameState.screen, raceEffects.detentionTaxUntil, applyRaceDamageToLocalPlayer]);

    useEffect(() => {
        if (gameState.challengeMode !== 'RACE') return;
        if (gameState.screen === GameScreen.REWARD && prevScreenRef.current !== GameScreen.REWARD) {
            setRaceRewardDummyDisplay(raceEffects.rewardDummyCount);
            if (raceEffects.rewardDummyCount > 0) {
                setRaceEffects(prev => ({ ...prev, rewardDummyCount: 0 }));
            }
        } else if (gameState.screen !== GameScreen.REWARD && prevScreenRef.current === GameScreen.REWARD) {
            setRaceRewardDummyDisplay(0);
        }
        if (prevScreenRef.current === GameScreen.BATTLE && gameState.screen !== GameScreen.BATTLE && raceEffects.hideEnemyIntentsOnce) {
            setRaceEffects(prev => ({ ...prev, hideEnemyIntentsOnce: false }));
        }
    }, [gameState.challengeMode, gameState.screen, raceEffects.rewardDummyCount, raceEffects.hideEnemyIntentsOnce]);

    useEffect(() => {
        if (!raceSession || !raceResultOpen) return;
        audioService.playBGM('victory');
    }, [raceSession, raceResultOpen]);

    useEffect(() => {
        if (!raceSession || gameState.challengeMode !== 'RACE') {
            prevScreenRef.current = gameState.screen;
            return;
        }
        if (gameState.screen === GameScreen.GAME_OVER && prevScreenRef.current !== GameScreen.GAME_OVER) {
            setRaceGameOverCount(prev => prev + 1);
        }
        prevScreenRef.current = gameState.screen;
    }, [gameState.screen, gameState.challengeMode, raceSession]);

    useEffect(() => {
        const unlocked = storageService.getUnlockedCards();
        setUnlockedCardNames(unlocked);
        setHasSave(storageService.hasSaveFile());
        setClearCount(storageService.getClearCount());
        setIsMathDebugSkipped(storageService.getDebugMathSkip());
        setIsDebugHpOne(storageService.getDebugHpOne());
        setTotalMathCorrect(storageService.getMathCorrectCount());

        audioService.setBgmMode(appSettings.bgmMode);
        audioService.setBgmVolume(appSettings.bgmVolume);
        audioService.setSfxVolume(appSettings.seVolume);

        if (gameState.screen === GameScreen.START_MENU) {
            audioService.init();
            audioService.playBGM('menu');
        }
    }, []);

    useEffect(() => {
        storageService.saveAppSettings(appSettings);
        audioService.setBgmVolume(appSettings.bgmVolume);
        audioService.setSfxVolume(appSettings.seVolume);
    }, [appSettings]);

    useEffect(() => {
        if (bgmMode === appSettings.bgmMode) return;
        setBgmMode(appSettings.bgmMode);
        audioService.setBgmMode(appSettings.bgmMode);
        storageService.saveBgmMode(appSettings.bgmMode);
    }, [appSettings.bgmMode, bgmMode]);

    useEffect(() => {
        const loadDevices = async () => {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setInputDevices(devices.filter(device => device.kind === 'audioinput'));
            } catch {
                setInputDevices([]);
            }
        };
        loadDevices();
    }, [showSettingsModal]);

    useEffect(() => {
        const next = UNLOCK_THRESHOLDS.find(t => t > totalMathCorrect);
        setNextThreshold(next || null);
    }, [totalMathCorrect]);

    const handleTitleClick = () => {
        const next = titleClickCount + 1;
        setTitleCount(next);
        if (next >= 10) {
            const newState = !isMathDebugSkipped;
            setIsMathDebugSkipped(newState);
            storageService.saveDebugMathSkip(newState);
            setTitleCount(0);
            audioService.playSound('select');
        }
    };

    const handleLogClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = logClickCount + 1;
        setLogClickCount(next);
        if (next >= 10) {
            const newState = !isDebugHpOne;
            setIsDebugHpOne(newState);
            storageService.saveDebugHpOne(newState);
            setLogClickCount(0);
            audioService.playSound('select');
        }
    };

    const disableMathDebugSkip = () => {
        if (!isMathDebugSkipped) return;
        setIsMathDebugSkipped(false);
        storageService.saveDebugMathSkip(false);
        setTitleCount(0);
        audioService.playSound('select');
    };

    const disableDebugHpOne = () => {
        if (!isDebugHpOne) return;
        setIsDebugHpOne(false);
        storageService.saveDebugHpOne(false);
        setLogClickCount(0);
        audioService.playSound('select');
    };

    const toggleLanguage = () => {
        const nextMode = languageMode === 'JAPANESE' ? 'HIRAGANA' : 'JAPANESE';
        setLanguageMode(nextMode);
        storageService.saveLanguageMode(nextMode);
        audioService.playSound('select');
    };

    const toggleBgmMode = () => {
        let nextMode: 'OSCILLATOR' | 'MP3' | 'STUDY';
        if (bgmMode === 'STUDY') nextMode = 'MP3';
        else if (bgmMode === 'MP3') nextMode = 'OSCILLATOR';
        else nextMode = 'STUDY';

        setBgmMode(nextMode);
        setAppSettings(prev => ({ ...prev, bgmMode: nextMode }));
        audioService.setBgmMode(nextMode);
        storageService.saveBgmMode(nextMode);
        audioService.playSound('select');
    };

    const handleUseRaceTrickCard = (card: RaceTrickCard, targetPeerId: string) => {
        if (!raceSession || raceSession.ended || gameState.challengeMode !== 'RACE') return;
        setRaceTrickCards(prev => prev.filter(c => c.id !== card.id));
        audioService.playSound('select');
        if (raceSession.isHost) {
            if (card.effectId !== 'WALLET_SWAP') {
                p2pService.getConnectedPeerIds().forEach(peerId => {
                    p2pService.sendTo(peerId, { type: 'RACE_TRICK_APPLY', cardId: card.id, effectId: card.effectId, sourcePeerId: 'host', sourceName: raceSession.name, sourceGold: gameState.player.gold });
                });
            } else if (targetPeerId === 'host') {
                const localResult = applyRaceTrickEffectLocal(card.effectId, raceSession.name, gameState.player.gold);
                if (card.effectId === 'WALLET_SWAP' && localResult !== undefined) {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Number(localResult) } }));
                }
                if (card.effectId === 'GOLD_SIPHON' && localResult !== undefined) {
                    applyRaceGoldDelta(Number(localResult), 'おつりミスでゴールド獲得');
                }
            } else {
                p2pService.sendTo(targetPeerId, { type: 'RACE_TRICK_APPLY', cardId: card.id, effectId: card.effectId, sourcePeerId: 'host', sourceName: raceSession.name, sourceGold: gameState.player.gold });
            }
        } else {
            p2pService.send({ type: 'RACE_TRICK_PLAY', cardId: card.id, effectId: card.effectId, targetPeerId: card.effectId === 'WALLET_SWAP' ? targetPeerId : 'ALL', sourceName: raceSession.name, sourceGold: gameState.player.gold });
        }
        showRaceToast(`${card.name} を使用`);
    };

    const returnToTitle = () => {
        const isEndingReturn = stateRef.current.screen === GameScreen.ENDING;
        const isGameOverReturn = stateRef.current.screen === GameScreen.GAME_OVER;
        const isVictoryReturn = stateRef.current.screen === GameScreen.VICTORY;
        const isDebugReturn = stateRef.current.screen === GameScreen.DEBUG_MENU;
        const shouldCheckMiniGameUnlocks =
            stateRef.current.screen === GameScreen.ENDING ||
            stateRef.current.screen === GameScreen.GAME_OVER ||
            stateRef.current.screen === GameScreen.VICTORY ||
            stateRef.current.screen === GameScreen.PROBLEM_CHALLENGE ||
            stateRef.current.screen === GameScreen.DEBUG_MENU;

        if (isEndingReturn || isGameOverReturn || isVictoryReturn) {
            storageService.clearSave();
        }

        if (isEndingReturn) {
            const previousClearCount = storageService.getClearCount();
            storageService.incrementClearCount();
            const nextClearCount = previousClearCount + 1;
            const previousUnlockedCount = Math.min(CHARACTERS.length, previousClearCount + 2);
            const nextUnlockedCount = Math.min(CHARACTERS.length, nextClearCount + 2);
            setClearCount(nextClearCount);
            setNewlyUnlockedCharacters(CHARACTERS.slice(previousUnlockedCount, nextUnlockedCount));
        } else if (isDebugReturn) {
            const nextClearCount = storageService.getClearCount();
            const previousUnlockedCount = Math.min(CHARACTERS.length, debugMenuStartClearCount + 2);
            const nextUnlockedCount = Math.min(CHARACTERS.length, nextClearCount + 2);
            setClearCount(nextClearCount);
            setNewlyUnlockedCharacters(CHARACTERS.slice(previousUnlockedCount, nextUnlockedCount));
        } else {
            setNewlyUnlockedCharacters([]);
        }

        if (shouldCheckMiniGameUnlocks) {
            const currentMathCorrect = isDebugReturn ? storageService.getMathCorrectCount() : totalMathCorrect;
            const previousMathCorrect = isDebugReturn ? debugMenuStartMathCorrect : unlockCheckStartMathCorrect;
            const previousUnlockedMiniGames = MINI_GAMES.filter(game => previousMathCorrect >= game.threshold);
            const nextUnlockedMiniGames = MINI_GAMES.filter(game => currentMathCorrect >= game.threshold);
            if (isDebugReturn) {
                setTotalMathCorrect(currentMathCorrect);
            }
            setNewlyUnlockedMiniGames(nextUnlockedMiniGames.filter(game => !previousUnlockedMiniGames.some(prev => prev.id === game.id)));
        } else {
            setNewlyUnlockedMiniGames([]);
        }

        setShopCards([]);
        setEventData(null);
        setRaceSession(null);
        setCoopSession(null);
        setRaceResultOpen(false);
        setRaceSelfPeerId('host');
        setRaceTrickCards([]);
        setRaceEffects(EMPTY_RACE_EFFECTS);
        setRaceHudOpen(false);
        setRaceToast(null);
        setRaceRewardDummyDisplay(0);
        setCoopSupportCards([]);
        setCoopPartyHudOpen(true);
        setCoopBattleQueue([]);
        setCoopBattleKey(null);
        setCoopEnemyTurnCursor(0);
        p2pService.close();
        setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU, challengeMode: undefined, typingLessonId: undefined, vsOpponent: undefined }));
        setHasSave(storageService.hasSaveFile());
        audioService.playBGM('menu');
    };

    const openDebugMenu = useCallback(() => {
        setDebugMenuStartClearCount(storageService.getClearCount());
        setDebugMenuStartMathCorrect(storageService.getMathCorrectCount());
        setGameState(prev => ({ ...prev, screen: GameScreen.DEBUG_MENU }));
    }, []);

    const handleDebugAddClearCount = useCallback(() => {
        storageService.incrementClearCount();
        setClearCount(storageService.getClearCount());
    }, []);

    const handleDebugBoostMathCorrect = useCallback(() => {
        const current = storageService.getMathCorrectCount();
        const nextUnlock = MINI_GAMES.find(game => game.threshold > current);
        const nextCount = nextUnlock ? nextUnlock.threshold : current + 100;
        storageService.saveMathCorrectCount(nextCount);
        setTotalMathCorrect(nextCount);
    }, []);

    const hasRelic = (player: Player, relicId: string) => player.relics.some(r => r.id === relicId);
    const getPotionCapacity = (player: Player) => hasRelic(player, 'CAULDRON') ? 5 : 3;

    const drawOneCard = (player: Player): ICard | null => {
        if (player.drawPile.length === 0) {
            if (player.discardPile.length === 0) return null;
            player.drawPile = shuffle(player.discardPile);
            player.discardPile = [];
        }
        const card = player.drawPile.pop();
        return card ? { ...card } : null;
    };

    const syncRedSkullState = (player: Player) => {
        if (!hasRelic(player, 'RED_SKULL')) return;
        const isActive = (player.relicCounters['RED_SKULL_ACTIVE'] || 0) === 1;
        const shouldBeActive = player.currentHp <= Math.floor(player.maxHp / 2);
        if (shouldBeActive && !isActive) {
            player.strength += 3;
            player.relicCounters['RED_SKULL_ACTIVE'] = 1;
        } else if (!shouldBeActive && isActive) {
            player.strength = Math.max(0, player.strength - 3);
            player.relicCounters['RED_SKULL_ACTIVE'] = 0;
        }
    };

    const addCardToDeckWithRelics = (player: Player, card: ICard, options?: { addToDiscard?: boolean }) => {
        const addToDiscard = options?.addToDiscard ?? false;
        const base = { ...card, id: card.id || `gain-${Date.now()}-${Math.random()}` };
        player.deck = [...player.deck, base];
        if (addToDiscard) player.discardPile = [...player.discardPile, { ...base, id: `discard-${Date.now()}-${Math.random()}` }];

        if (hasRelic(player, 'CERAMIC_FISH')) {
            player.gold += 9;
        }

        const mirrorCharges = player.relicCounters['DOLLYS_MIRROR_CHARGES'] || 0;
        if (mirrorCharges > 0) {
            const copy = { ...base, id: `mirror-copy-${Date.now()}-${Math.random()}` };
            player.deck = [...player.deck, copy];
            if (addToDiscard) player.discardPile = [...player.discardPile, { ...copy, id: `mirror-discard-${Date.now()}-${Math.random()}` }];
            player.relicCounters['DOLLYS_MIRROR_CHARGES'] = mirrorCharges - 1;
        }
    };

    const applyExtendedRelicAcquireEffects = (player: Player, relic: Relic) => {
        if (relic.id === 'DOLLYS_MIRROR') {
            player.relicCounters['DOLLYS_MIRROR_CHARGES'] = 1;
        }
        if (relic.id === 'TINY_HOUSE') {
            player.maxHp += 5;
            player.currentHp = Math.min(player.maxHp, player.currentHp + 5);
            player.gold += 50;
            if (player.potions.length < getPotionCapacity(player)) {
                const allPotions = Object.values(POTION_LIBRARY);
                const potion = { ...allPotions[Math.floor(Math.random() * allPotions.length)], id: `tiny-house-pot-${Date.now()}` };
                player.potions = [...player.potions, potion];
            }
            const upgradeable = player.deck.filter(c => !c.upgraded);
            if (upgradeable.length > 0) {
                const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                player.deck = player.deck.map(c => c.id === target.id ? getUpgradedCard(c) : c);
            }
        }
        if (relic.id === 'ORRERY') {
            player.relicCounters['ORRERY_PENDING'] = 1;
        }
    };

    const clearBigLadleTemp = (player: Player): Player => {
        const counters = { ...player.relicCounters };
        if (!counters['BIG_LADLE_ACTIVE']) return player;
        delete counters['BIG_LADLE_ACTIVE'];
        const nextMaxHp = Math.max(1, player.maxHp - 4);
        return {
            ...player,
            maxHp: nextMaxHp,
            currentHp: Math.min(player.currentHp, nextMaxHp),
            relicCounters: counters
        };
    };

    const restoreBattleOnlyCard = (card: ICard): ICard => {
        let nextCard = { ...card };
        if (nextCard.battleRestore) {
            nextCard = { ...nextCard, ...nextCard.battleRestore };
            delete nextCard.battleRestore;
        }
        if (nextCard.battleBaseCost !== undefined) {
            nextCard.cost = nextCard.battleBaseCost;
            delete nextCard.battleBaseCost;
        }
        if (nextCard.battleBaseDamage !== undefined) {
            nextCard.damage = nextCard.battleBaseDamage;
            delete nextCard.battleBaseDamage;
        }
        if (nextCard.battleBaseBlock !== undefined) {
            nextCard.block = nextCard.battleBaseBlock;
            delete nextCard.battleBaseBlock;
        }
        if (nextCard.battleBaseDescription !== undefined) {
            nextCard.description = nextCard.battleBaseDescription;
            delete nextCard.battleBaseDescription;
        }
        if (nextCard.battleBaseExhaust !== undefined) {
            nextCard.exhaust = nextCard.battleBaseExhaust;
            delete nextCard.battleBaseExhaust;
        }
        delete nextCard.battleBonusDrawOnPlay;
        return nextCard;
    };

    const clearBattleOnlyCardState = (player: Player): Player => ({
        ...player,
        currentEnergy: player.maxEnergy,
        block: 0,
        strength: 0,
        hand: [],
        drawPile: [],
        discardPile: [],
        powers: {},
        echoes: 0,
        cardsPlayedThisTurn: 0,
        attacksPlayedThisTurn: 0,
        typesPlayedThisTurn: [],
        turnFlags: {},
        nextTurnEnergy: 0,
        nextTurnDraw: 0,
        codexBuffer: [],
        floatingText: null,
        relicCounters: Object.fromEntries(
            Object.entries(player.relicCounters).filter(([key]) =>
                key !== 'OUT_SUPER_HERO_POSE_ACTIVE' && key !== 'OUT_STAMP_QUEST_REMAINING'
            )
        ),
        deck: player.deck.map(restoreBattleOnlyCard)
    });
    const buildPostBattlePlayer = (player: Player, withVictoryRecovery: boolean): Player => {
        let hpRegen = 0;
        if (withVictoryRecovery) {
            if (player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;
            if (player.relics.find(r => r.id === 'MEAT_ON_THE_BONE') && player.currentHp <= player.maxHp / 2) hpRegen += 12;
        }
        const nextPlayer = clearBattleOnlyCardState(clearBigLadleTemp({ ...player }));
        if (withVictoryRecovery && hpRegen > 0) {
            nextPlayer.currentHp = Math.min(nextPlayer.maxHp, nextPlayer.currentHp + hpRegen);
        }
        if (withVictoryRecovery && nextPlayer.partner) {
            nextPlayer.partner = {
                ...nextPlayer.partner,
                currentHp: Math.min(nextPlayer.partner.maxHp, nextPlayer.partner.currentHp + 5)
            };
        }
        return nextPlayer;
    };

    const appendBattleOnlyText = (card: ICard, text: string): ICard => {
        if (card.description.includes(text)) return card;
        return {
            ...card,
            battleBaseDescription: card.battleBaseDescription ?? card.description,
            description: `${card.description} ${text}`
        };
    };

    const makeBattleCostZero = (card: ICard, extraText: string): ICard =>
        appendBattleOnlyText({
            ...card,
            battleRestore: card.battleRestore ?? {
                cost: card.cost,
                damage: card.damage,
                block: card.block,
                description: card.description,
                exhaust: card.exhaust,
                upgraded: card.upgraded,
                draw: card.draw,
                energy: card.energy,
                weak: card.weak,
                vulnerable: card.vulnerable,
                strength: card.strength,
                poison: card.poison,
                applyPower: card.applyPower ? { ...card.applyPower } : undefined,
                addCardToHand: card.addCardToHand ? { ...card.addCardToHand } : undefined
            },
            battleBaseCost: card.battleBaseCost ?? card.cost,
            cost: 0
        }, extraText);

    useEffect(() => {
        setGameState(prev => {
            const p = { ...prev.player, relicCounters: { ...prev.player.relicCounters }, deck: [...prev.player.deck], potions: [...prev.player.potions], discardPile: [...prev.player.discardPile] };
            let changed = false;
            if (hasRelic(p, 'DOLLYS_MIRROR') && !p.relicCounters['DOLLYS_MIRROR_INIT']) {
                p.relicCounters['DOLLYS_MIRROR_CHARGES'] = Math.max(1, p.relicCounters['DOLLYS_MIRROR_CHARGES'] || 0);
                p.relicCounters['DOLLYS_MIRROR_INIT'] = 1;
                changed = true;
            }
            if (hasRelic(p, 'TINY_HOUSE') && !p.relicCounters['TINY_HOUSE_APPLIED']) {
                applyExtendedRelicAcquireEffects(p, RELIC_LIBRARY.TINY_HOUSE);
                p.relicCounters['TINY_HOUSE_APPLIED'] = 1;
                changed = true;
            }
            if (hasRelic(p, 'ORRERY') && !p.relicCounters['ORRERY_APPLIED']) {
                applyExtendedRelicAcquireEffects(p, RELIC_LIBRARY.ORRERY);
                p.relicCounters['ORRERY_APPLIED'] = 1;
                changed = true;
            }
            return changed ? { ...prev, player: p } : prev;
        });
    }, [gameState.player.relics]);

    useEffect(() => {
        if (orreryModal || gameState.player.relicCounters['ORRERY_PENDING'] !== 1) return;
        const pool = getFilteredCardPool(gameState.player.id);
        const cards: ICard[] = [];
        for (let i = 0; i < 5; i++) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            cards.push({ ...pick, id: `orrery-choice-${Date.now()}-${i}-${Math.random()}` });
        }
        setOrreryModal({
            title: '天球儀',
            description: '候補から1枚選んでデッキに追加してください',
            cards
        });
    }, [gameState.player.id, gameState.player.relicCounters, orreryModal]);

    useEffect(() => {
        if (gameState.screen !== GameScreen.REST) return;
        if (peacePipeModal || !hasRelic(gameState.player, 'PEACE_PIPE')) return;
        if (gameState.player.relicCounters['PEACE_PIPE_READY'] !== 1) return;
        setPeacePipeModal({
            title: '和解のパイプ',
            description: '削除するカードを1枚選ぶか、使わずに休憩を続けてください',
            cards: [...gameState.player.deck],
            allowSkip: true
        });
    }, [gameState.player, gameState.screen, peacePipeModal]);

    const handleNodeComplete = () => {
        setGameState(prev => {
            const newMap = prev.map.map(n => {
                if (n.id === prev.currentMapNodeId) return { ...n, completed: true };
                return n;
            });
            return {
                ...prev,
                map: newMap,
                screen: GameScreen.MAP,
                currentEventTitle: undefined
            };
        });
        if (gameState.challengeMode === 'COOP') {
            setCoopSession(prev => {
                if (!prev || prev.participants.length === 0) return prev;
                const next = {
                    ...prev,
                    decisionOwnerIndex: (prev.decisionOwnerIndex + 1) % prev.participants.length
                };
                if (prev.isHost) {
                p2pService.send({ type: 'COOP_PARTICIPANTS', participants: next.participants, decisionOwnerIndex: next.decisionOwnerIndex });
                }
                return next;
            });
        }
        audioService.playBGM('map');
    };

    const continueGame = () => {
        if (isDailyLimitReached) {
            audioService.playSound('wrong');
            setShowTimeLimitModal(true);
            return;
        }
        setShowStartOverConfirm(false);
        const saved = storageService.loadGame();
        if (saved) {
            // セーブ破損対策: HPが0以下ならセーブを無効化
            if (saved.player.currentHp <= 0) {
                storageService.clearSave();
                addLog("セーブデータが無効だったため削除しました。", "red");
                return;
            }

            if (saved.screen === GameScreen.EVENT) {
                const currentNode = saved.map.find(n => n.id === saved.currentMapNodeId);
                const canRestoreEvent = !!currentNode && currentNode.type === NodeType.EVENT;

                if (canRestoreEvent) {
                    const unlockedCards = storageService.getUnlockedCards();
                    const restoredEvent = generateEvent(
                        saved.player,
                        setGameState,
                        handleNodeComplete,
                        setEventResultLog,
                        languageMode,
                        unlockedCards,
                        saved.currentEventTitle
                    );
                    setEventData(restoredEvent);
                    setEventResultLog(null);
                } else {
                    // イベントを復元できない場合は安全にマップへ戻す
                    saved.screen = saved.map.length > 0 ? GameScreen.MAP : GameScreen.RELIC_SELECTION;
                    setEventData(null);
                    setEventResultLog(null);
                    addLog(trans("イベントを復元できなかったためマップに戻りました。", languageMode), "yellow");
                }
            } else {
                setEventData(null);
                setEventResultLog(null);
                saved.currentEventTitle = undefined;
            }

            setGameState(saved);
            if (saved.screen === GameScreen.BATTLE) {
                audioService.playBGM('battle');
            } else if (saved.screen === GameScreen.MAP) {
                audioService.playBGM('map');
            } else if (saved.screen === GameScreen.SHOP) {
                audioService.playBGM('shop');
            } else {
                audioService.playBGM('map');
            }
            addLog(trans("続きから再開しました。", languageMode), "blue");
        }
    };

    const launchNewAdventure = () => {
        if (isDailyLimitReached) {
            audioService.playSound('wrong');
            setShowTimeLimitModal(true);
            return;
        }
        audioService.playSound('select');
        setIsLoading(false); // Ensure loading is reset
        setGameState({
            screen: GameScreen.MODE_SELECTION,
            mode: GameMode.MULTIPLICATION,
            act: 1,
            floor: 0,
            turn: 0,
            map: [],
            currentMapNodeId: null,
            player: {
                maxHp: INITIAL_HP,
                currentHp: INITIAL_HP,
                maxEnergy: INITIAL_ENERGY,
                currentEnergy: INITIAL_ENERGY,
                block: 0,
                strength: 0,
                gold: 99,
                deck: createDeck(),
                hand: [],
                discardPile: [],
                drawPile: [],
                relics: [],
                potions: [],
                powers: {},
                echoes: 0,
                cardsPlayedThisTurn: 0,
                attacksPlayedThisTurn: 0,
                typesPlayedThisTurn: [],
                relicCounters: {},
                turnFlags: {},
                imageData: HERO_IMAGE_DATA,
                floatingText: null,
                nextTurnEnergy: 0,
                nextTurnDraw: 0,
                codexBuffer: []
            },
            enemies: [],
            selectedEnemyId: null,
            narrativeLog: [trans("冒険が始まった。", languageMode)],
            combatLog: [],
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 },
            isEndless: false,
            parryState: { active: false, enemyId: null, success: false },
            activeEffects: [],
            currentStoryIndex: Math.floor(Math.random() * GAME_STORIES.length),
            actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
        });
    };

    const startChallengeGame = () => {
        if (isDailyLimitReached) {
            audioService.playSound('wrong');
            setShowTimeLimitModal(true);
            return;
        }
        audioService.playSound('select');
        setIsLoading(false);
        setGameState({
            screen: GameScreen.MODE_SELECTION,
            mode: GameMode.MULTIPLICATION,
            act: 1,
            floor: 0,
            turn: 0,
            map: [],
            currentMapNodeId: null,
            player: {
                maxHp: INITIAL_HP,
                currentHp: INITIAL_HP,
                maxEnergy: INITIAL_ENERGY,
                currentEnergy: INITIAL_ENERGY,
                block: 0,
                strength: 0,
                gold: 99,
                deck: createDeck(),
                hand: [],
                discardPile: [],
                drawPile: [],
                relics: [],
                potions: [],
                powers: {},
                echoes: 0,
                cardsPlayedThisTurn: 0,
                attacksPlayedThisTurn: 0,
                typesPlayedThisTurn: [],
                relicCounters: {},
                turnFlags: {},
                imageData: HERO_IMAGE_DATA,
                floatingText: null,
                nextTurnEnergy: 0,
                nextTurnDraw: 0,
                codexBuffer: []
            },
            enemies: [],
            selectedEnemyId: null,
            narrativeLog: [trans("1A1Dチャレンジ開始！", languageMode)],
            combatLog: [],
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 },
            isEndless: false,
            parryState: { active: false, enemyId: null, success: false },
            activeEffects: [],
            challengeMode: '1A1D',
            currentStoryIndex: Math.floor(Math.random() * GAME_STORIES.length),
            actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
        });
    };

    const startGame = () => {
        if (hasSave) {
            audioService.playSound('wrong');
            setShowStartOverConfirm(true);
            return;
        }
        launchNewAdventure();
    };

    const confirmStartOver = () => {
        storageService.clearSave();
        setHasSave(false);
        setShowStartOverConfirm(false);
        launchNewAdventure();
    };

    const startTypingGame = () => {
        audioService.playSound('select');
        setIsLoading(false);
        setGameState({
            screen: GameScreen.TYPING_MODE_SELECTION,
            mode: GameMode.MULTIPLICATION,
            act: 1,
            floor: 0,
            turn: 0,
            map: [],
            currentMapNodeId: null,
            player: {
                maxHp: INITIAL_HP,
                currentHp: INITIAL_HP,
                maxEnergy: INITIAL_ENERGY,
                currentEnergy: INITIAL_ENERGY,
                block: 0,
                strength: 0,
                gold: 99,
                deck: createDeck(),
                hand: [],
                discardPile: [],
                drawPile: [],
                relics: [],
                potions: [],
                powers: {},
                echoes: 0,
                cardsPlayedThisTurn: 0,
                attacksPlayedThisTurn: 0,
                typesPlayedThisTurn: [],
                relicCounters: {},
                turnFlags: {},
                imageData: HERO_IMAGE_DATA,
                floatingText: null,
                nextTurnEnergy: 0,
                nextTurnDraw: 0,
                codexBuffer: []
            },
            enemies: [],
            selectedEnemyId: null,
            narrativeLog: [trans("タイピングモード開始！", languageMode)],
            combatLog: [],
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 },
            isEndless: false,
            parryState: { active: false, enemyId: null, success: false },
            activeEffects: [],
            challengeMode: 'TYPING',
            typingLessonId: undefined,
            currentStoryIndex: Math.floor(Math.random() * GAME_STORIES.length),
            actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
        });
    };

    const handleTypingLessonSelect = (lessonId: TypingLessonId) => {
        audioService.playSound('select');
        setGameState(prev => ({
            ...prev,
            typingLessonId: lessonId,
            screen: GameScreen.CHARACTER_SELECTION
        }));
    };

    const startProblemChallenge = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        audioService.playSound('select');
        setUnlockCheckStartMathCorrect(totalMathCorrect);
        setGameState(prev => ({
            ...prev,
            screen: GameScreen.PROBLEM_CHALLENGE,
            challengeMode: undefined
        }));
    };

    const handleMiniGameSelect = (screen: GameScreen) => {
        if (isDailyLimitReached) {
            audioService.playSound('wrong');
            setShowTimeLimitModal(true);
            return;
        }
        audioService.playSound('select');
        setGameState(prev => ({ ...prev, screen }));
    };

    const startEndlessMode = () => {
        audioService.playSound('select');
        setGameState(prev => ({
            ...prev,
            act: prev.act + 1,
            floor: 0,
            map: generateDungeonMap(),
            currentMapNodeId: null,
            screen: GameScreen.MAP,
            isEndless: true,
            player: {
                ...prev.player,
                currentHp: prev.player.maxHp
            },
            narrativeLog: [...prev.narrativeLog, trans("終わらない冒険が始まる...", languageMode)],
            actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
        }));
    };

    const handleModeSelect = (mode: GameMode, modePool?: string[]) => {
        if (isDailyLimitReached) {
            audioService.playSound('wrong');
            setShowTimeLimitModal(true);
            return;
        }
        if (gameState.challengeMode === 'RACE' && raceSession && !raceSession.isHost) {
            return;
        }
        audioService.playSound('select');
        if (gameState.challengeMode === 'RACE' && raceSession?.isHost) {
            p2pService.send({ type: 'RACE_MODE_SET', mode });
        }
        if (gameState.challengeMode === 'COOP') {
            if (coopSession && !coopSession.isHost) {
                return;
            }
            if (coopSession?.isHost) {
                p2pService.send({ type: 'COOP_MODE_SET', mode });
            }
        }
        setGameState(prev => ({ ...prev, mode, modePool, screen: GameScreen.CHARACTER_SELECTION }));
    };

    const handleDebugStart = (deck: ICard[], relics: Relic[], potions: Potion[]) => {
        const map = generateDungeonMap();
        setDebugLoadout({ deck, relics, potions });

        setGameState(prev => ({
            ...prev,
            screen: GameScreen.MAP,
            act: 1,
            floor: 0,
            turn: 0,
            map,
            currentMapNodeId: null,
            player: {
                ...prev.player,
                deck: deck.length > 0 ? deck : createDeck(),
                relics: relics.length > 0 ? relics : [],
                potions: potions.length > 0 ? potions : [],
                maxHp: 999,
                currentHp: isDebugHpOne ? 1 : 999,
                maxEnergy: 9,
                currentEnergy: 9,
                gold: 9999,
                hand: [],
                discardPile: [],
                drawPile: [],
                powers: {},
                relicCounters: {},
                turnFlags: {},
                typesPlayedThisTurn: [],
                floatingText: null,
                nextTurnEnergy: 0,
                nextTurnDraw: 0,
                echoes: 0,
                cardsPlayedThisTurn: 0,
                attacksPlayedThisTurn: 0,
                codexBuffer: []
            },
            narrativeLog: ["デバッグモード開始"],
            combatLog: [],
            enemies: [],
            selectedEnemyId: null,
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 },
            activeEffects: [],
            currentStoryIndex: 0,
            actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
        }));
        audioService.playBGM('map');
    };

    const handleDebugStartAct3Boss = async (deck: ICard[], relics: Relic[], potions: Potion[]) => {
        const map = generateDungeonMap();
        setDebugLoadout({ deck, relics, potions });

        const bossNode = map.find(n => n.type === NodeType.BOSS);
        if (!bossNode) return;

        const playerBase = {
            ...gameState.player,
            deck: deck.length > 0 ? deck : createDeck(),
            relics: relics.length > 0 ? relics : [],
            potions: potions.length > 0 ? potions : [],
            maxHp: 999,
            currentHp: isDebugHpOne ? 1 : 999,
            maxEnergy: 4,
            currentEnergy: 4,
            gold: 999,
            hand: [],
            discardPile: [],
            powers: {},
            relicCounters: {},
            turnFlags: {},
            typesPlayedThisTurn: [],
            floatingText: null,
            nextTurnEnergy: 0,
            nextTurnDraw: 0,
            echoes: 0,
            cardsPlayedThisTurn: 0,
            attacksPlayedThisTurn: 0,
            codexBuffer: []
        };

        const bossName = await generateEnemyName(15);
        const bossEnemy: Enemy = {
            id: `debug-boss-${Date.now()}`,
            enemyType: 'GUARDIAN',
            name: `ボス: ${bossName}`,
            maxHp: 300,
            currentHp: isDebugHpOne ? 1 : 300,
            block: 0,
            strength: 0,
            nextIntent: { type: EnemyIntentType.UNKNOWN, value: 0 },
            vulnerable: 0, weak: 0, poison: 0, artifact: 0, corpseExplosion: false,
            floatingText: null,
            phase: 1
        };
        bossEnemy.nextIntent = getNextEnemyIntent(bossEnemy, 1);

        playerBase.drawPile = shuffle(playerBase.deck.map(c => ({ ...c })));
        for (let i = 0; i < HAND_SIZE; i++) {
            const drawn = playerBase.drawPile.pop();
            if (drawn) playerBase.hand.push(drawn);
        }

        const combatState: GameState = {
            ...gameState,
            screen: GameScreen.BATTLE,
            act: 3,
            floor: 16,
            turn: 1,
            map,
            currentMapNodeId: bossNode.id,
            player: playerBase,
            enemies: [bossEnemy],
            selectedEnemyId: bossEnemy.id,
            narrativeLog: ["デバッグ: ACT3 BOSS 直通開始"],
            combatLog: ["> ボスとの決戦開始！"],
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 },
            activeEffects: [],
            actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
        };

        setGameState(combatState);
        audioService.playBGM('boss');
        setTurnLog(getSelfTurnLogLabel());
    };

    const handleCharacterSelect = (char: Character) => {
        audioService.playSound('select');
        setSelectedCharName(char.name);
        setUnlockCheckStartMathCorrect(totalMathCorrect);

        let initialDeck: ICard[] = [];
        let logs = [trans("旅の支度をしている...", languageMode)];

        if (gameState.challengeMode === '1A1D') {
            const attacks = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.ATTACK && c.rarity === 'COMMON');
            const skills = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.SKILL && c.rarity === 'COMMON');
            const a = attacks[Math.floor(Math.random() * attacks.length)];
            const s = skills[Math.floor(Math.random() * skills.length)];
            initialDeck = [
                { ...a, id: `start-0` },
                { ...s, id: `start-1` }
            ];
        } else {
            initialDeck = createDeck(char.deckTemplate);
        }

        const startingCardNames = initialDeck.map(c => c.name);
        storageService.saveUnlockedCards(startingCardNames);

        const starterRelic = RELIC_LIBRARY[char.startingRelicId];
        const relics = starterRelic ? [starterRelic] : [];

        const commonRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON');
        const bonusOptions = shuffle(commonRelics).slice(0, 3);
        setStarterRelics(bonusOptions);

        const garden = char.id === 'GARDENER' ? Array(9).fill(null).map(() => ({ plantedCard: null, growth: 0, maxGrowth: 0 })) : undefined;

        const initialPlayerState = {
            ...gameState.player,
            id: char.id,
            maxHp: char.maxHp,
            currentHp: char.maxHp,
            gold: char.gold,
            deck: initialDeck,
            relics: relics,
            potions: [],
            imageData: char.imageData,
            maxEnergy: INITIAL_ENERGY,
            currentEnergy: INITIAL_ENERGY,
            block: 0,
            strength: 0,
            hand: [],
            discardPile: [],
            drawPile: [],
            powers: {},
            relicCounters: {},
            turnFlags: {},
            typesPlayedThisTurn: [],
            floatingText: null,
            nextTurnEnergy: 0,
            nextTurnDraw: 0,
            attacksPlayedThisTurn: 0,
            cardsPlayedThisTurn: 0,
            echoes: 0,
            partner: undefined,
            garden: garden,
            codexBuffer: []
        };

        if (gameState.challengeMode === 'COOP' && coopSession) {
            const participantDisplayName =
                coopSession.participants.find(participant => participant.peerId === coopSelfPeerId)?.name ||
                coopSession.name ||
                char.name;
            const nextSelfParticipant: CoopParticipant = {
                peerId: coopSelfPeerId,
                name: participantDisplayName,
                imageData: char.imageData,
                selectedCharacterId: char.id,
                maxHp: char.maxHp,
                currentHp: char.maxHp
            };

            setCoopSession(prev => {
                if (!prev) return prev;
                const exists = prev.participants.some(participant => participant.peerId === coopSelfPeerId);
                const nextParticipants = exists
                    ? prev.participants.map(participant => participant.peerId === coopSelfPeerId ? { ...participant, ...nextSelfParticipant } : participant)
                    : [...prev.participants, nextSelfParticipant];
                return { ...prev, participants: nextParticipants };
            });

            if (coopSession.isHost) {
                const nextParticipants = coopSession.participants.some(participant => participant.peerId === coopSelfPeerId)
                    ? coopSession.participants.map(participant => participant.peerId === coopSelfPeerId ? { ...participant, ...nextSelfParticipant } : participant)
                    : [...coopSession.participants, nextSelfParticipant];
                p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: coopSession.decisionOwnerIndex });
            } else {
                p2pService.send({
                    type: 'COOP_CHARACTER_SELECT',
                    characterId: char.id,
                    name: participantDisplayName,
                    imageData: char.imageData,
                    maxHp: char.maxHp,
                    currentHp: char.maxHp
                });
            }
        }

        if (char.id === 'CHEF' && gameState.challengeMode !== '1A1D') {
            setGameState(prev => ({
                ...prev,
                screen: GameScreen.DECK_CONSTRUCTION,
                act: 1,
                floor: 0,
                turn: 0,
                map: [],
                currentMapNodeId: null,
                combatLog: [],
                player: { ...initialPlayerState, deck: [] },
                narrativeLog: [trans("本日の献立を考えている...", languageMode)]
            }));
            return;
        }

        if (char.id === 'ASSASSIN') {
            const warrior = CHARACTERS.find(c => c.id === 'WARRIOR');

            const specialEvent = {
                title: "放課後の勧誘",
                description: "新しい学校、知らないクラスメート...。\n不安な気持ちで校庭の隅に立っていると、赤い帽子の少年が走ってきた。\n\n「よう！ お前、転校生だろ？\n俺と組んで『伝説の小学生』を目指さないか？」\n\n強引だが、悪い気はしない。彼の目は冒険への期待で輝いている。",
                options: [
                    {
                        label: "手を取る",
                        text: "わんぱく小学生と友達になる",
                        action: () => {
                            const newPartner = warrior ? {
                                id: 'WARRIOR',
                                name: warrior.name,
                                maxHp: warrior.maxHp,
                                currentHp: warrior.maxHp,
                                imageData: warrior.imageData,
                                floatingText: null
                            } : undefined;

                            const unlockedCards = storageService.getUnlockedCards();
                            const ev = generateEvent(
                                initialPlayerState,
                                setGameState,
                                handleNodeComplete,
                                setEventResultLog,
                                languageMode,
                                unlockedCards
                            );
                            setEventData(ev);
                            setEventResultLog(null);

                            setGameState(prev => ({
                                ...prev,
                                screen: GameScreen.RELIC_SELECTION,
                                player: { ...prev.player, partner: newPartner },
                                narrativeLog: [
                                    trans("わんぱく小学生がパートナーになった！", languageMode),
                                    trans("【TIPS】種類が同じカードを2枚選ぶと『友情コンボ』が発動します！", languageMode)
                                ]
                            }));
                            audioService.playSound('buff');
                        }
                    }
                ]
            };

            setEventData(specialEvent);
            setEventResultLog(null);
            if (gameState.challengeMode === 'COOP') {
                setCoopSession(prev => {
                    if (!prev) return prev;
                    const nextParticipants = prev.participants.map(participant => ({ ...participant, eventResolved: false }));
                    if (prev.isHost) {
                        p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                    }
                    return { ...prev, participants: nextParticipants };
                });
            }

            setGameState(prev => ({
                ...prev,
                screen: GameScreen.EVENT,
                currentEventTitle: specialEvent.title,
                act: 1,
                floor: 0,
                turn: 0,
                map: [],
                currentMapNodeId: null,
                combatLog: [],
                player: initialPlayerState,
                narrativeLog: logs,
                activeEffects: []
            }));
            audioService.playBGM('event');
            return;
        }

        setGameState(prev => ({
            ...prev,
            screen: GameScreen.RELIC_SELECTION,
            act: 1,
            floor: 0,
            turn: 0,
            map: [],
            currentMapNodeId: null,
            player: initialPlayerState,
            narrativeLog: logs,
            combatLog: [],
            activeEffects: []
        }));
    };

    const handleChefDeckSelection = (selectedCards: ICard[]) => {
        const cardNames = selectedCards.map(c => c.name);
        storageService.saveUnlockedCards(cardNames);

        setGameState(prev => ({
            ...prev,
            screen: GameScreen.RELIC_SELECTION,
            player: {
                ...prev.player,
                deck: selectedCards
            }
        }));
    };

    const handleRelicSelect = (relic: Relic) => {
        audioService.playSound('buff');
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            setCoopAwaitingMapSync(true);
            setGameState(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    relics: [...prev.player.relics, relic]
                }
            }));
            return;
        }
        if (gameState.challengeMode === 'COOP' && coopSession?.isHost) {
            setCoopNeedsInitialMapSync(true);
        }
        const map = generateDungeonMap();
        const unlockedCards = storageService.getUnlockedCards();

        const legacyCard = (gameState.challengeMode === 'RACE' || gameState.challengeMode === 'COOP')
            ? null
            : storageService.getLegacyCard();
        if (legacyCard) {
            const ev = generateLegacyEvent(
                legacyCard,
                setGameState,
                setEventResultLog,
                languageMode
            );
            setEventData(ev);
            setEventResultLog(null);
            if (gameState.challengeMode === 'COOP') {
                setCoopSession(prev => {
                    if (!prev) return prev;
                    const nextParticipants = prev.participants.map(participant => ({ ...participant, eventResolved: false }));
                    if (prev.isHost) {
                        p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                    }
                    return { ...prev, participants: nextParticipants };
                });
            }

            setGameState(prev => ({
                ...prev,
                screen: GameScreen.EVENT,
                currentEventTitle: ev.title,
                map: map,
                player: {
                    ...prev.player,
                    relics: [...prev.player.relics, relic]
                },
                narrativeLog: [...prev.narrativeLog, trans("冒険が始まった。", languageMode)]
            }));
            audioService.playBGM('event');
        } else {
            setGameState(prev => ({
                ...prev,
                screen: GameScreen.MAP,
                map: map,
                player: {
                    ...prev.player,
                    relics: [...prev.player.relics, relic]
                },
                narrativeLog: [...prev.narrativeLog, trans("冒険が始まった。", languageMode)]
            }));
            audioService.playBGM('map');
        }
    };

    const handleNodeSelect = async (node: MapNode, allowRemoteCoopSelection = false) => {
        if (gameState.challengeMode === 'COOP' && coopSession) {
            if (!coopSession.isHost) {
                setCoopMapPendingNodeId(node.id);
                if (coopMapPendingTimerRef.current) {
                    window.clearTimeout(coopMapPendingTimerRef.current);
                }
                coopMapPendingTimerRef.current = window.setTimeout(() => {
                    setCoopMapPendingNodeId(null);
                    coopMapPendingTimerRef.current = null;
                }, 2500);
                p2pService.send({ type: 'COOP_NODE_SELECT', nodeId: node.id });
                audioService.playSound('select');
                return;
            }
            if (!coopCanDecide && !allowRemoteCoopSelection) return;
        }
        setIsLoading(true);
        audioService.playSound('select');

        const nextFloor = node.y + 1;
        const nextState = { ...gameState, currentMapNodeId: node.id, floor: nextFloor };

        try {
            if (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS || node.type === NodeType.START) {

                const actMultiplier = gameState.act;
                const floorDifficulty = node.y * (1 + (actMultiplier * 0.5));

                let enemies: Enemy[] = [];
                let bgmType: 'battle' | 'mid_boss' | 'boss' | 'final_boss' = 'battle';

                const maxAtkDmg = estimateBossScalingSingleCardDamage(nextState.player.deck);
                const enemyHpMultiplier = coopEnemyHpMultiplier;

                if (gameState.act === 4 && node.type === NodeType.BOSS) {
                    let finalHeartHp = TRUE_BOSS.maxHp;
                    if (maxAtkDmg > finalHeartHp) {
                        finalHeartHp = Math.ceil(maxAtkDmg * 6);
                    }
                    finalHeartHp = Math.ceil(finalHeartHp * enemyHpMultiplier);

                    enemies.push({
                        id: 'true-boss',
                        enemyType: 'THE_HEART',
                        name: TRUE_BOSS.name,
                        maxHp: finalHeartHp,
                        currentHp: isDebugHpOne ? 1 : finalHeartHp,
                        block: 0,
                        strength: 0,
                        nextIntent: { type: EnemyIntentType.BUFF, value: 0 },
                        vulnerable: 0, weak: 0, poison: 0, artifact: 2, corpseExplosion: false,
                        floatingText: null,
                        phase: 1
                    });
                    bgmType = 'final_boss';
                } else if (node.type === NodeType.BOSS) {
                    bgmType = 'boss';
                } else if (node.type === NodeType.ELITE) {
                    bgmType = 'mid_boss';
                } else {
                    bgmType = 'battle';
                }

                if (enemies.length === 0) {
                    const numEnemies = node.type === NodeType.BOSS ? 1 : Math.floor(Math.random() * Math.min(3, 1 + Math.floor(node.y / 3))) + 1;
                    const hpOffsets = numEnemies > 1
                        ? Array.from({ length: numEnemies }, (_, idx) => idx - (numEnemies - 1) / 2)
                            .sort(() => Math.random() - 0.5)
                        : [0];
                    for (let i = 0; i < numEnemies; i++) {
                        let baseHp = (node.type === NodeType.BOSS ? 150 : 20) * actMultiplier + floorDifficulty * 2 + (node.type === NodeType.ELITE ? 40 : 0);

                        if (node.type === NodeType.BOSS && maxAtkDmg > baseHp) {
                            const multiplier = 2 + gameState.act;
                            baseHp = Math.ceil(maxAtkDmg * multiplier);
                        }
                        baseHp *= enemyHpMultiplier;
                        // 複数体出現時は個体ごとにHP差を付ける
                        const hpStep = Math.max(2, Math.floor(baseHp * 0.08));
                        const hpAdjusted = Math.max(1, Math.floor(baseHp + hpOffsets[i] * hpStep));

                        const name = await generateEnemyName(node.y, gameState.act);
                        const isBoss = node.type === NodeType.BOSS;

                        enemies.push({
                            id: `enemy-${node.y}-${i}-${Date.now()}`,
                            enemyType: 'GENERIC',
                            name: isBoss ? `ボス: ${name}` : name,
                            maxHp: hpAdjusted,
                            currentHp: isDebugHpOne ? 1 : hpAdjusted,
                            block: 0,
                            strength: 0,
                            nextIntent: { type: EnemyIntentType.UNKNOWN, value: 0 },
                            vulnerable: 0, weak: 0, poison: 0, artifact: 0, corpseExplosion: false,
                            floatingText: null
                        });
                    }

                    enemies = enemies.map(e => {
                        const type = determineEnemyType(e.name, node.type === NodeType.BOSS);
                        storageService.saveDefeatedEnemy(e.name);
                        return { ...e, enemyType: type, nextIntent: getNextEnemyIntent({ ...e, enemyType: type }, 1) };
                    });
                }

                const flavor = await generateFlavorText(node.type === NodeType.BOSS ? "ボスが現れた！" : "敵と遭遇した。");

                const p = preparePlayerForBattle(nextState.player, node.type);

                if (gameState.challengeMode === 'COOP') {
                    setCoopSession(prev => {
                        if (!prev) return prev;
                        const nextParticipants = prev.participants.map(participant => ({
                            ...participant,
                            block: 0,
                            nextTurnEnergy: 0,
                            strength: 0,
                            buffer: 0,
                            revivedThisBattle: false,
                            quizResolved: false,
                            quizCorrectCount: 0,
                            floatingText: null
                        }));
                        if (prev.isHost) {
                            p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                        }
                        return { ...prev, participants: nextParticipants };
                    });
                }

                if (p.relics.find(r => r.id === 'PHILOSOPHER_STONE')) {
                    enemies.forEach(e => e.strength += 1);
                }

                if (p.relics.find(r => r.id === 'MEGAPHONE')) {
                    enemies.forEach(e => {
                        e.vulnerable += 1;
                        e.floatingText = { id: `rel-mega-${Date.now()}-${e.id}`, text: 'びくびく', color: 'text-pink-400' };
                    });
                }
                if (p.relics.find(r => r.id === 'RED_MASK')) {
                    enemies.forEach(e => {
                        e.weak += 1;
                        e.floatingText = { id: `rel-mask-${Date.now()}-${e.id}`, text: 'へろへろ', color: 'text-gray-400' };
                    });
                }

                const nextGameState = {
                    ...nextState,
                    player: p,
                    enemies: enemies,
                    selectedEnemyId: enemies[0].id,
                    narrativeLog: [...nextState.narrativeLog, flavor],
                    combatLog: [],
                    turn: 1,
                    parryState: { active: false, enemyId: null, success: false },
                    activeEffects: []
                };

                if (p.id === 'DODGEBALL' && (node.type === NodeType.COMBAT || node.type === NodeType.START)) {
                    setGameState({ ...nextGameState, screen: GameScreen.DODGEBALL_SHOOTING });
                } else {
                    setGameState({ ...nextGameState, screen: GameScreen.BATTLE });
                    setCurrentNarrative(flavor);
                    audioService.playBGM(bgmType);
                    setTurnLog(getSelfTurnLogLabel());
                }

            } else if (node.type === NodeType.REST) {
                if (gameState.challengeMode === 'COOP') {
                    setCoopSession(prev => {
                        if (!prev) return prev;
                        const nextParticipants = prev.participants.map(participant => ({
                            ...participant,
                            restResolved: false
                        }));
                        if (prev.isHost) {
                            p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                        }
                        return { ...prev, participants: nextParticipants };
                    });
                }
                setGameState(prev => {
                    const p = { ...prev.player };
                    let restLog = [...nextState.narrativeLog];
                    if (p.relics.find(r => r.id === 'LUXURY_FUTON')) {
                        const heal = Math.floor(p.currentHp / 5) * 2;
                        if (heal > 0) {
                            p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                        }
                    }
                    if (p.relics.find(r => r.id === 'ANCIENT_TEA_SET')) {
                        p.relicCounters['ANCIENT_TEA_SET_ACTIVE'] = 1;
                    }
                    if (p.relics.find(r => r.id === 'PEACE_PIPE') && p.deck.length > 0) {
                        p.relicCounters['PEACE_PIPE_READY'] = 1;
                    }
                    return { ...nextState, player: p, narrativeLog: restLog, screen: GameScreen.REST };
                });
                audioService.playBGM('rest');

            } else if (node.type === NodeType.SHOP) {
                if (gameState.challengeMode === 'COOP') {
                    setCoopSession(prev => {
                        if (!prev) return prev;
                        const nextParticipants = prev.participants.map(participant => ({
                            ...participant,
                            shopResolved: false
                        }));
                        if (prev.isHost) {
                            p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                        }
                        return { ...prev, participants: nextParticipants };
                    });
                }
                const isGardener = nextState.player.id === 'GARDENER';
                const allPossibleCards = getFilteredCardPool(nextState.player.id);

                const cards: ICard[] = [];
                for (let i = 0; i < 5; i++) {
                    if (allPossibleCards.length === 0) break;
                    let candidatePool = allPossibleCards;
                    if (isGardener && i < 2) {
                        candidatePool = Object.values(GARDEN_SEEDS).map(s => ({ ...s, id: `shop-seed-${i}-${Date.now()}` }) as ICard);
                    }

                    const cTemplate = candidatePool[Math.floor(Math.random() * candidatePool.length)];
                    const c = { ...cTemplate };
                    let price = 40 + Math.floor(Math.random() * 60);
                    if (c.rarity === 'UNCOMMON') price += 25;
                    if (c.rarity === 'RARE') price += 50;
                    if (c.rarity === 'LEGENDARY') price += 100;
                    if (c.rarity === 'SPECIAL') price += 30;
                    cards.push({ id: `shop-${i}-${Date.now()}`, ...c, price });
                }
                setShopCards(cards);

                const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'SHOP' || r.rarity === 'COMMON' || r.rarity === 'UNCOMMON' || r.rarity === 'RARE');
                const relicOptions = shuffle(allRelics).slice(0, 2);
                setShopRelics(relicOptions);

                const allPotions = Object.values(POTION_LIBRARY);
                const potionOptions: Potion[] = shuffle(allPotions).slice(0, 3).map(p => ({ ...p, id: `shop-pot-${Date.now()}-${Math.random()}` }));
                setShopPotions(potionOptions);

                setGameState({ ...nextState, screen: GameScreen.SHOP });
                audioService.playBGM('shop');

            } else if (node.type === NodeType.EVENT) {
                const p = nextState.player;
                if (hasRelic(p, 'TINY_CHEST')) {
                    const tinyChestProgress = (p.relicCounters['TINY_CHEST_PROGRESS'] || 0) + 1;
                    if (tinyChestProgress >= 4) {
                        p.relicCounters['TINY_CHEST_PROGRESS'] = 0;
                        if (gameState.challengeMode === 'COOP' && coopSession) {
                            setTreasurePools(buildCoopTreasurePools(coopSession.participants.length));
                            setCoopSession(prev => {
                                if (!prev) return prev;
                                const nextParticipants = prev.participants.map(participant => ({ ...participant, treasureResolved: false }));
                                if (prev.isHost) {
                                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                                }
                                return { ...prev, participants: nextParticipants };
                            });
                        } else {
                            const rewards: RewardItem[] = [];
                            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON' || r.rarity === 'UNCOMMON' || r.rarity === 'RARE');
                            rewards.push({ type: 'RELIC', value: shuffle([...allRelics])[0], id: `tiny-chest-relic-${Date.now()}` });
                            rewards.push({ type: 'GOLD', value: 50 + Math.floor(Math.random() * 50), id: `tiny-chest-gold-${Date.now()}` });
                            setTreasureRewards(rewards);
                        }
                        setTreasureOpened(false);
                        setGameState({ ...nextState, player: p, screen: GameScreen.TREASURE });
                        audioService.playBGM('reward');
                        return;
                    }
                    p.relicCounters['TINY_CHEST_PROGRESS'] = tinyChestProgress;
                }
                const unlockedCards = storageService.getUnlockedCards();
                const ev = generateEvent(
                    nextState.player,
                    setGameState,
                    handleNodeComplete,
                    setEventResultLog,
                    languageMode,
                    unlockedCards
                );
                setEventData(ev);
                setEventResultLog(null);
                if (gameState.challengeMode === 'COOP') {
                    setCoopSession(prev => {
                        if (!prev) return prev;
                        const nextParticipants = prev.participants.map(participant => ({ ...participant, eventResolved: false }));
                        if (prev.isHost) {
                            p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                        }
                        return { ...prev, participants: nextParticipants };
                    });
                }
                setGameState({ ...nextState, screen: GameScreen.EVENT, currentEventTitle: ev.title });
                audioService.playBGM('event');
            } else if (node.type === NodeType.TREASURE) {
                const p = nextState.player;
                if (gameState.challengeMode === 'COOP' && coopSession) {
                    setTreasurePools(buildCoopTreasurePools(coopSession.participants.length));
                    setCoopSession(prev => {
                        if (!prev) return prev;
                        const nextParticipants = prev.participants.map(participant => ({ ...participant, treasureResolved: false }));
                        if (prev.isHost) {
                            p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                        }
                        return { ...prev, participants: nextParticipants };
                    });
                } else {
                    const matryoshkaCharges = p.relicCounters['MATRYOSHKA'] || 0;
                    const numRelics = matryoshkaCharges > 0 ? 2 : 1;
                    if (matryoshkaCharges > 0) {
                        p.relicCounters['MATRYOSHKA'] = matryoshkaCharges - 1;
                    }

                    const rewards: RewardItem[] = [];
                    const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON' || r.rarity === 'UNCOMMON' || r.rarity === 'RARE');

                    for (let i = 0; i < numRelics; i++) {
                        rewards.push({ type: 'RELIC', value: shuffle([...allRelics])[0], id: `tr-relic-${Date.now()}-${i}` });
                    }

                    rewards.push({ type: 'GOLD', value: 50 + Math.floor(Math.random() * 50), id: `tr-gold-${Date.now()}` });
                    setTreasureRewards(rewards);
                }
                setTreasureOpened(false);
                setGameState({ ...nextState, player: p, screen: GameScreen.TREASURE });
                audioService.playBGM('reward');
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDodgeballResult = (hit: boolean) => {
        if (hit) {
            audioService.playSound('win');
            setGameState(prev => ({
                ...prev,
                screen: GameScreen.BATTLE,
                enemies: [],
                narrativeLog: [...prev.narrativeLog, "ドッジボールで撃破！戦闘をスキップします。"]
            }));
        } else {
            setGameState(prev => ({ ...prev, screen: GameScreen.BATTLE }));
            audioService.playBGM('battle');
            setTurnLog(getSelfTurnLogLabel());
        }
    };

    const handleSelectEnemy = (id: string) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_BATTLE_SELECT_ENEMY', enemyId: id });
        }
        setGameState(prev => ({
            ...prev,
            selectedEnemyId: id,
            coopBattleState: prev.coopBattleState ? {
                ...prev.coopBattleState,
                players: prev.coopBattleState.players.map(entry =>
                    entry.peerId === coopSelfPeerId ? { ...entry, selectedEnemyId: id } : entry
                )
            } : prev.coopBattleState
        }));
    };

    const applyDebuff = (enemy: Enemy, type: 'WEAK' | 'VULNERABLE' | 'POISON', amount: number) => {
        if (enemy.artifact > 0 && type !== 'POISON') {
            enemy.artifact--;
            return;
        }
        if (type === 'WEAK') enemy.weak += amount;
        if (type === 'VULNERABLE') enemy.vulnerable += amount;
        if (type === 'POISON') enemy.poison += amount;
    };

    const handleHandSelection = (card: ICard) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost && gameState.screen === GameScreen.BATTLE) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_SELECTION_STATE' });
        }
        setGameState(prev => {
            const p = { ...prev.player };
            const mode = prev.selectionState;
            if (mode.type === 'DISCARD' || mode.type === 'EXHAUST') {
                p.hand = p.hand.filter(c => c.id !== card.id);
                if (mode.type === 'DISCARD') {
                    p.discardPile.push(card);
                    if (card.name === 'カンニングペーパー' || card.name === 'STRATEGIST') {
                        p.nextTurnEnergy += 2;
                        p.floatingText = { id: `strat-${Date.now()}-${Math.random()}`, text: '+2 Next Turn', color: 'text-yellow-400', iconType: 'zap' };
                    }
                } else if (mode.type === 'EXHAUST') {
                    if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
                }
                const newAmount = mode.amount - 1;
                return { ...prev, player: p, selectionState: { ...mode, active: newAmount > 0, amount: newAmount } };
            }
            if (mode.type === 'COPY') {
                const copy = { ...card, id: `copy-${Date.now()}` };
                if (p.hand.length < HAND_SIZE + 5) p.hand.push(copy);
                const newAmount = mode.amount - 1;
                return { ...prev, player: p, selectionState: { ...mode, active: newAmount > 0, amount: newAmount } };
            }
            return prev;
        });
    };

    const handleCancelSelection = () => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost && gameState.screen === GameScreen.BATTLE) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_SELECTION_STATE' });
        }
        setGameState(prev => ({
            ...prev,
            selectionState: { ...prev.selectionState, active: false }
        }));
        audioService.playSound('select');
    };

    const toggleWeatherScryCard = (cardId: string, keep: boolean) => {
        setWeatherScryModal(prev => {
            if (!prev) return prev;
            return { ...prev, keepMap: { ...prev.keepMap, [cardId]: keep } };
        });
    };

    const applyWeatherScrySelection = () => {
        if (!weatherScryModal) return;
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost && gameState.screen === GameScreen.BATTLE) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_MODAL_RESOLVE' });
        }
        const modal = weatherScryModal;
        setGameState(prev => {
            const p = { ...prev.player, drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile] };
            const targetIds = new Set(modal.cards.map(c => c.id));
            const keepCards = modal.cards.filter(c => modal.keepMap[c.id] !== false);
            const discardCards = modal.cards.filter(c => modal.keepMap[c.id] === false);

            // モーダル対象カードを山札から除外してから、選択結果を反映する
            p.drawPile = p.drawPile.filter(c => !targetIds.has(c.id));
            p.discardPile.push(...discardCards);
            keepCards.slice().reverse().forEach(c => p.drawPile.push(c));

            const combatLog = [
                ...prev.combatLog,
                trans(`天気予報：${keepCards.length}枚を山札に戻し、${discardCards.length}枚を捨て札に送った`, languageMode)
            ].slice(-100);

            return { ...prev, player: p, combatLog };
        });
        setWeatherScryModal(null);
    };

    const applyGalaxyExpressSelection = (selectedCardId: string) => {
        if (!galaxyExpressModal) return;
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost && gameState.screen === GameScreen.BATTLE) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_MODAL_RESOLVE' });
        }
        const modal = galaxyExpressModal;
        setGameState(prev => {
            const p = { ...prev.player, hand: [...prev.player.hand], drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile] };
            const targetIds = new Set(modal.cards.map(c => c.id));
            const selectedCard = modal.cards.find(c => c.id === selectedCardId);
            const discardCards = modal.cards.filter(c => c.id !== selectedCardId);

            p.drawPile = p.drawPile.filter(c => !targetIds.has(c.id));
            if (selectedCard) {
                const picked = { ...selectedCard };
                if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && picked.cost >= 0) {
                    picked.cost = Math.floor(Math.random() * 4);
                }
                if (p.hand.length < HAND_SIZE + 5) p.hand.push(picked);
                else p.discardPile.push(picked);
            }
            p.discardPile.push(...discardCards);

            const combatLog = [
                ...prev.combatLog,
                selectedCard
                    ? trans(`銀河鉄道の夜：${selectedCard.name}を手札に加え、残り${discardCards.length}枚を捨て札に送った`, languageMode)
                    : trans("銀河鉄道の夜：選択できるカードがなかった", languageMode)
            ].slice(-100);

            return { ...prev, player: p, combatLog };
        });
        setGalaxyExpressModal(null);
    };

    const applyGoldFishSelection = (selectedCardId: string) => {
        if (!goldFishModal) return;
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost && gameState.screen === GameScreen.BATTLE) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_MODAL_RESOLVE' });
        }
        setGameState(prev => {
            const applyEnchant = (zoneCard: ICard) => {
                if (zoneCard.id !== selectedCardId) return zoneCard;
                const originalCard = { ...zoneCard };
                const upgraded = getUpgradedCard(zoneCard);
                const battleText = 'この戦闘中: +6ダメージ。廃棄。';
                return appendBattleOnlyText({
                    ...upgraded,
                    battleRestore: {
                        cost: originalCard.cost,
                        damage: originalCard.damage,
                        block: originalCard.block,
                        description: originalCard.description,
                        exhaust: originalCard.exhaust,
                        upgraded: originalCard.upgraded,
                        draw: originalCard.draw,
                        energy: originalCard.energy,
                        weak: originalCard.weak,
                        vulnerable: originalCard.vulnerable,
                        strength: originalCard.strength,
                        poison: originalCard.poison,
                        applyPower: originalCard.applyPower ? { ...originalCard.applyPower } : undefined,
                        addCardToHand: originalCard.addCardToHand ? { ...originalCard.addCardToHand } : undefined
                    },
                    battleBaseCost: upgraded.battleBaseCost ?? upgraded.cost,
                    battleBaseDamage: upgraded.battleBaseDamage ?? upgraded.damage,
                    battleBaseExhaust: upgraded.battleBaseExhaust ?? upgraded.exhaust,
                    cost: 0,
                    damage: (upgraded.damage || 0) + 6,
                    exhaust: true
                }, battleText);
            };
            return {
                ...prev,
                player: {
                    ...prev.player,
                    deck: prev.player.deck.map(applyEnchant),
                    hand: prev.player.hand.map(applyEnchant),
                    drawPile: prev.player.drawPile.map(applyEnchant),
                    discardPile: prev.player.discardPile.map(applyEnchant)
                },
                combatLog: [...prev.combatLog, trans("金魚すくい：選んだアタックを戦闘中強化した", languageMode)].slice(-100)
            };
        });
        setGoldFishModal(null);
    };

    const applyDreamCatcherSelection = (selectedCardId: string) => {
        if (!dreamCatcherModal) return;
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost && gameState.screen === GameScreen.BATTLE) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_MODAL_RESOLVE' });
        }
        setGameState(prev => {
            const p = { ...prev.player, hand: [...prev.player.hand], drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile] };
            const index = p.drawPile.findIndex(c => c.id === selectedCardId);
            if (index >= 0) {
                const [picked] = p.drawPile.splice(index, 1);
                const chosen = { ...picked };
                if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && chosen.cost >= 0) {
                    chosen.cost = Math.floor(Math.random() * 4);
                }
                if (p.hand.length < HAND_SIZE + 5) p.hand.push(chosen);
                else p.discardPile = [...p.discardPile, chosen];
                return {
                    ...prev,
                    player: p,
                    combatLog: [...prev.combatLog, trans(`ドリーム・キャッチャー：${picked.name}を手札に加えた`, languageMode)].slice(-100)
                };
            }
            return prev;
        });
        setDreamCatcherModal(null);
    };

    const applyOrrerySelection = (selectedCardId: string) => {
        if (!orreryModal) return;
        setGameState(prev => {
            const p = { ...prev.player, deck: [...prev.player.deck], discardPile: [...prev.player.discardPile], relicCounters: { ...prev.player.relicCounters } };
            const picked = orreryModal.cards.find(card => card.id === selectedCardId);
            if (picked) {
                addCardToDeckWithRelics(p, { ...picked, id: `orrery-picked-${Date.now()}` });
            }
            p.relicCounters['ORRERY_PENDING'] = 0;
            return {
                ...prev,
                player: p,
                narrativeLog: picked ? [...prev.narrativeLog, `${trans("天球儀", languageMode)}: ${trans(picked.name, languageMode)} を選んだ。`] : prev.narrativeLog
            };
        });
        setOrreryModal(null);
    };

    const applyPeacePipeSelection = (selectedCardId: string | null) => {
        if (!peacePipeModal) return;
        setGameState(prev => {
            const p = { ...prev.player, deck: [...prev.player.deck], relicCounters: { ...prev.player.relicCounters } };
            let narrativeLog = [...prev.narrativeLog];
            if (selectedCardId) {
                const removed = p.deck.find(card => card.id === selectedCardId);
                p.deck = p.deck.filter(card => card.id !== selectedCardId);
                if (removed) {
                    narrativeLog.push(`和解のパイプで「${trans(removed.name, languageMode)}」を取り除いた。`);
                }
            } else {
                narrativeLog.push(`和解のパイプは使わなかった。`);
            }
            p.relicCounters['PEACE_PIPE_READY'] = 0;
            return { ...prev, player: p, narrativeLog };
        });
        setPeacePipeModal(null);
    };

    const handleUsePotion = (potion: Potion) => {
        if (gameState.screen !== GameScreen.BATTLE) return;
        if (weatherScryModal || galaxyExpressModal || goldFishModal || dreamCatcherModal) return;
        audioService.playSound('select');
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_USE_POTION', potionId: potion.id });
        }

        setGameState(prev => {
            const p = { ...prev.player };
            const enemies = [...prev.enemies];
            const newLogs = [`${trans("ポーション使用", languageMode)}: ${trans(potion.name, languageMode)}`];
            const nextActiveEffects: VisualEffectInstance[] = [];

            p.potions = p.potions.filter(pt => pt.id !== potion.id);
            const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];
            const drawCards = (count: number) => {
                for (let i = 0; i < count; i++) {
                    if (p.drawPile.length === 0) {
                        if (p.discardPile.length === 0) break;
                        p.drawPile = shuffle(p.discardPile);
                        p.discardPile = [];
                    }
                    const c = p.drawPile.pop();
                    if (c) p.hand.push(c);
                }
            };

            if (p.relics.find(r => r.id === 'TAKETOMBO')) {
                p.currentHp = Math.min(p.maxHp, p.currentHp + 5);
                p.floatingText = { id: `heal-taketombo-${Date.now()}`, text: `+5`, color: 'text-green-500', iconType: 'heart' };
                newLogs.push(trans("竹とんぼでHP5回復", languageMode));
                nextActiveEffects.push({ id: `vfx-pot-heal-${Date.now()}`, type: 'HEAL', targetId: 'player' });
            }

            if (potion.templateId === 'FIRE_POTION' && target) {
                target.currentHp -= 20;
                target.floatingText = { id: `dmg-${Date.now()}`, text: '20', color: 'text-red-500', iconType: 'sword' };
                newLogs.push(`${trans(target.name, languageMode)}に20${trans("ダメージ", languageMode)}`);
                nextActiveEffects.push({ id: `vfx-pot-fire-${Date.now()}`, type: 'FIRE', targetId: target.id });
            } else if (potion.templateId === 'BLOCK_POTION') {
                p.block += 12;
                newLogs.push(`${trans("ブロック", languageMode)}12を${trans("獲得", languageMode)}`);
                nextActiveEffects.push({ id: `vfx-pot-blk-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
            } else if (potion.templateId === 'STRENGTH_POTION') {
                p.strength += 2;
                newLogs.push(`${trans("ムキムキ", languageMode)}+2`);
                nextActiveEffects.push({ id: `vfx-pot-zap-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            } else if (potion.templateId === 'ENERGY_POTION') {
                p.currentEnergy += 2;
                newLogs.push(`${trans("エネルギー", languageMode)}+2`);
                nextActiveEffects.push({ id: `vfx-pot-zap-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            } else if (potion.templateId === 'WEAK_POTION' && target) {
                applyDebuff(target, 'WEAK', 3);
                newLogs.push(`${trans(target.name, languageMode)}に${trans("へろへろ", languageMode)}3を${trans("付与", languageMode)}`);
                nextActiveEffects.push({ id: `vfx-pot-dbuff-${Date.now()}`, type: 'DEBUFF', targetId: target.id });
            } else if (potion.templateId === 'POISON_POTION') {
                if (target) {
                    applyDebuff(target, 'POISON', 6);
                    newLogs.push(`${trans(target.name, languageMode)}に${trans("ドクドク", languageMode)}6を${trans("付与", languageMode)}`);
                    nextActiveEffects.push({ id: `vfx-pot-psn-${Date.now()}`, type: 'DEBUFF', targetId: target.id });
                }
            } else if (potion.templateId === 'HEALTH_POTION') {
                const heal = 15;
                p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                p.floatingText = { id: `heal-${Date.now()}`, text: `+${heal}`, color: 'text-green-500', iconType: 'heart' };
                newLogs.push(`HP${heal}${trans("回復", languageMode)}`);
                nextActiveEffects.push({ id: `vfx-pot-h-${Date.now()}`, type: 'HEAL', targetId: 'player' });
            } else if (potion.templateId === 'LIQUID_BRONZE') {
                p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
                newLogs.push(`${trans("トゲトゲ", languageMode)}+3`);
                nextActiveEffects.push({ id: `vfx-pot-t-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            } else if (potion.templateId === 'GAMBLE' || potion.templateId === 'GAMBLERS_BREW') {
                const cardsToDiscard = [...p.hand];
                const discardCount = cardsToDiscard.length;
                cardsToDiscard.forEach(c => {
                    p.discardPile.push(c);
                    if (c.name === 'カンニングペーパー' || c.name === 'STRATEGIST') {
                        p.nextTurnEnergy += 2;
                        p.floatingText = { id: `strat-pot-${Date.now()}`, text: '+2 Next Turn', color: 'text-yellow-400', iconType: 'zap' };
                    }
                });
                p.hand = [];
                for (let i = 0; i < discardCount; i++) {
                    if (p.drawPile.length === 0) {
                        if (p.discardPile.length === 0) break;
                        p.drawPile = shuffle(p.discardPile);
                        p.discardPile = [];
                    }
                    const c = p.drawPile.pop();
                    if (c) p.hand.push(c);
                }
                newLogs.push(trans("手札を交換", languageMode));
            } else if (potion.templateId === 'ENTROPIC_BREW') {
                const capacity = getPotionCapacity(p);
                for (let i = p.potions.length; i < capacity; i++) {
                    const allPotions = Object.values(POTION_LIBRARY);
                    const randomPot = { ...allPotions[Math.floor(Math.random() * allPotions.length)], id: `entropy-${Date.now()}-${i}` };
                    p.potions.push(randomPot);
                }
                newLogs.push(trans("小箱からポーション充填", languageMode));
            } else if (potion.templateId === 'STUDY_SESSION_DRINK') {
                p.currentEnergy += 1;
                drawCards(2);
                newLogs.push('Energy +1, Draw +2');
                nextActiveEffects.push({ id: `vfx-pot-study-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            } else if (potion.templateId === 'MORNING_DRILL_JUICE') {
                p.echoes = Math.max(p.echoes, 1);
                newLogs.push('Echo +1 for next card');
                nextActiveEffects.push({ id: `vfx-pot-drill-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            } else if (potion.templateId === 'NURSE_ROOM_GEL') {
                p.block += 15;
                p.turnFlags = { ...p.turnFlags, NURSE_ROOM_GEL_NEXT_BLOCK: true };
                newLogs.push('Block +15, next turn Block +8');
                nextActiveEffects.push({ id: `vfx-pot-nurse-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
            } else if (potion.templateId === 'PROTEIN_MILK') {
                p.currentHp = Math.min(p.maxHp, p.currentHp + 10);
                p.strength += 1;
                p.floatingText = { id: `pot-protein-${Date.now()}`, text: '+10 / +1', color: 'text-green-500', iconType: 'heart' };
                newLogs.push('HP +10, Strength +1');
                nextActiveEffects.push({ id: `vfx-pot-protein-${Date.now()}`, type: 'HEAL', targetId: 'player' });
            } else if (potion.templateId === 'GARGLE_SYRUP') {
                p.powers['WEAK'] = 0;
                p.powers['VULNERABLE'] = 0;
                p.powers['FRAIL'] = 0;
                p.powers['CONFUSED'] = 0;
                drawCards(1);
                newLogs.push('Cleanse debuffs, Draw +1');
                nextActiveEffects.push({ id: `vfx-pot-gargle-${Date.now()}`, type: 'HEAL', targetId: 'player' });
            } else if (potion.templateId === 'CHALK_DUST_VIAL') {
                enemies.forEach(e => applyDebuff(e, 'VULNERABLE', 2));
                newLogs.push('All enemies Vulnerable +2');
                nextActiveEffects.push({ id: `vfx-pot-chalk-${Date.now()}`, type: 'DEBUFF', targetId: target ? target.id : 'player' });
            } else if (potion.templateId === 'TIMETABLE_ELIXIR') {
                p.nextTurnEnergy += 1;
                p.nextTurnDraw += 2;
                newLogs.push('Next turn: Energy +1, Draw +2');
                nextActiveEffects.push({ id: `vfx-pot-time-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            } else if (potion.templateId === 'LAB_FLASK') {
                const upgradable = p.hand.filter(c => !c.upgraded);
                if (upgradable.length > 0) {
                    const selected = upgradable[Math.floor(Math.random() * upgradable.length)];
                    p.hand = p.hand.map(c => c.id === selected.id ? getUpgradedCard(c) : c);
                    newLogs.push(`Upgraded: ${trans(selected.name, languageMode)}`);
                } else {
                    newLogs.push('No upgradable card in hand');
                }
                nextActiveEffects.push({ id: `vfx-pot-lab-${Date.now()}`, type: 'LIGHTNING', targetId: 'player' });
            } else if (potion.templateId === 'COPY_PAPER_FLUID') {
                if (p.hand.length === 0) {
                    newLogs.push('No card to copy');
                } else {
                    newLogs.push('Select 1 card to copy');
                    const nextCoopBattleState = prev.challengeMode === 'COOP'
                        ? updateCoopBattleStateForLocalPlayer(prev.coopBattleState, p, prev.selectedEnemyId)
                        : prev.coopBattleState;
                    return {
                        ...prev,
                        player: p,
                        enemies,
                        coopBattleState: nextCoopBattleState,
                        selectionState: { active: true, type: 'COPY', amount: 1 },
                        combatLog: [...prev.combatLog, ...newLogs].slice(-100),
                        activeEffects: [...prev.activeEffects, ...nextActiveEffects]
                    };
                }
            } else if (potion.templateId === 'DETENTION_ENERGY_DRINK') {
                p.currentHp = Math.max(1, p.currentHp - 8);
                p.strength += 3;
                p.currentEnergy += 1;
                p.floatingText = { id: `pot-risk-${Date.now()}`, text: '-8 / +3 / +1', color: 'text-red-500', iconType: 'zap' };
                newLogs.push('HP -8, Strength +3, Energy +1');
                nextActiveEffects.push({ id: `vfx-pot-risk-${Date.now()}`, type: 'CRITICAL', targetId: 'player' });
            }


            const remainingEnemies = enemies.filter(e => e.currentHp > 0);
            const nextSelectedEnemyId =
                remainingEnemies.find(e => e.id === prev.selectedEnemyId)?.id
                ?? remainingEnemies[0]?.id
                ?? prev.selectedEnemyId;
            const nextCoopBattleState = prev.challengeMode === 'COOP'
                ? updateCoopBattleStateForLocalPlayer(prev.coopBattleState, p, nextSelectedEnemyId)
                : prev.coopBattleState;
            return {
                ...prev,
                player: p,
                enemies: remainingEnemies,
                selectedEnemyId: nextSelectedEnemyId,
                coopBattleState: nextCoopBattleState,
                combatLog: [...prev.combatLog, ...newLogs].slice(-100),
                activeEffects: [...prev.activeEffects, ...nextActiveEffects]
            };
        });
    };

    const handlePlayCard = (card: ICard) => {
        if (weatherScryModal || galaxyExpressModal || goldFishModal || dreamCatcherModal) return;
        if (gameState.challengeMode === 'COOP' && gameState.player.currentHp <= 0) return;
        let effectiveCost = card.cost;
        if (gameState.player.powers['CORRUPTION'] && card.type === CardType.SKILL) {
            effectiveCost = 0;
        }
        if (card.type === CardType.ATTACK && gameState.player.turnFlags['NEXT_ATTACK_COST_DOWN']) {
            effectiveCost = Math.max(0, effectiveCost - 1);
        }

        if (gameState.player.currentEnergy < effectiveCost && !gameState.player.partner) return;
        if (gameState.enemies.length === 0) return;
        if (actingEnemyId) return;
        if (gameState.selectionState.active) return;
        if (card.unplayable) return;

        const hasChoker = !!gameState.player.relics.find(r => r.id === 'VELVET_CHOKER');
        if (hasChoker && gameState.player.cardsPlayedThisTurn >= 6) {
            audioService.playSound('wrong');
            return;
        }

        const hasNormality = gameState.player.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY');
        if (hasNormality && gameState.player.attacksPlayedThisTurn + (gameState.player.cardsPlayedThisTurn - gameState.player.attacksPlayedThisTurn) >= 3) {
            audioService.playSound('wrong');
            return;
        }

        audioService.playSound(card.type === CardType.ATTACK ? 'attack' : 'block');
        setLastActionType(card.type);
        setLastActionTime(Date.now());
        const localCoopChainCount = (gameState.challengeMode === 'COOP' && coopSession?.isHost && coopSelfPeerId)
            ? registerCoopChain(coopSelfPeerId)
            : 0;
        if (gameState.challengeMode === 'COOP') {
            coopLastBattleCardEventAtRef.current = Date.now();
            appendCoopVfxDebugLog('CARD', `local:${card.name}`);
            if (localCoopChainCount >= 2) {
                appendCoopVfxDebugLog('CARD', `chain:x${localCoopChainCount}`);
            }
        }
        lastPlayedCardRef.current = card;
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_PLAY_CARD', cardId: card.id, playedCard: { ...card } });
        }

        setGameState(prev => {
            let p = { ...prev.player, hand: [...prev.player.hand], drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile], deck: [...prev.player.deck], powers: { ...prev.player.powers } };
            let enemies = prev.enemies.map(e => ({ ...e }));
            const currentLogs: string[] = [`> ${trans(card.name, languageMode)} ${trans("を使用", languageMode)}`];
            const nextActiveEffects: VisualEffectInstance[] = [];
            const effectOwnerPeerId = prev.challengeMode === 'COOP' && prev.screen === GameScreen.BATTLE
                ? coopSelfPeerId
                : undefined;
            let nextSelectionState = { ...prev.selectionState };
            const nextActStats = prev.actStats ? { ...prev.actStats } : { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 };

            // --- カード固有の拡張ロジック ---
            // ここに外部サービスからの呼び出しを追加
            const additionalResult = applyAdditionalCardLogic(card, p, enemies, languageMode, currentLogs, nextActiveEffects);
            Object.assign(p, additionalResult.player);
            enemies = additionalResult.enemies;
            if (localCoopChainCount >= 2) {
                currentLogs.push(`🤝 連携 x${localCoopChainCount}！`);
                nextActiveEffects.push({ id: `vfx-coop-chain-${Date.now()}`, type: 'SHOCKWAVE', targetId: 'player' });
            }

            const isGalaxyExpressCard =
                card.name === '銀河鉄道の夜' ||
                card.originalNames?.includes('銀河鉄道の夜') ||
                card.id?.includes('GALAXY_EXPRESS') ||
                card.description.includes('山札の上から5枚を見る');
            const isGiftBoxCard =
                card.name === '秘密のプレゼント' ||
                card.originalNames?.includes('秘密のプレゼント') ||
                card.id?.includes('GIRLS_GIFT_BOX');

            if (card.gold) {
                p.gold += card.gold;
                currentLogs.push(`${card.gold}ゴールドをゲット！`);
                audioService.playSound('buff');
            }

            if (card.addPotion && !isGiftBoxCard) {
                const allPotions = Object.values(POTION_LIBRARY);
                const potion = { ...allPotions[Math.floor(Math.random() * allPotions.length)], id: `event-pot-${Date.now()}` };
                if (p.potions.length < getPotionCapacity(p)) p.potions.push(potion);
                currentLogs.push(`${trans(potion.name, languageMode)}をゲット！`);
            }

            if (card.blockMultiplier) {
                p.block = Math.floor(p.block * card.blockMultiplier);
                nextActiveEffects.push({ id: `vfx-blkmul-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
            }

            if (card.name === 'スタンプラリー' || card.originalNames?.includes('スタンプラリー') || card.id?.includes('OUT_STAMP_COLLECT')) {
                p.relicCounters['OUT_STAMP_QUEST_REMAINING'] = 5;
                currentLogs.push('クエスト開始: あと5枚カードを使う');
            }

            if (card.name === '戦隊ヒーローのポーズ' || card.originalNames?.includes('戦隊ヒーローのポーズ') || card.id?.includes('OUT_SUPER_HERO_POSE')) {
                const battleText = 'この戦闘中: 使用後に1枚引く。';
                p.relicCounters['OUT_SUPER_HERO_POSE_ACTIVE'] = 1;
                const applyAttackText = (zoneCard: ICard) => {
                    if (zoneCard.type !== CardType.ATTACK) return zoneCard;
                    return appendBattleOnlyText({
                        ...zoneCard,
                        battleBonusDrawOnPlay: Math.max(zoneCard.battleBonusDrawOnPlay || 0, 1)
                    }, battleText);
                };
                p.deck = p.deck.map(applyAttackText);
                p.hand = p.hand.map(applyAttackText);
                p.drawPile = p.drawPile.map(applyAttackText);
                p.discardPile = p.discardPile.map(applyAttackText);
                currentLogs.push('この戦闘中、アタックに追加テキストが付与された');
            }

            if (card.name === '磁石の力' || card.name === 'RIKA_MAGNET' || card.name === '鉄棒の逆上がり' || card.name === 'PE_HORIZONTAL_BAR' || card.originalNames?.some(n => ['磁石の力', 'RIKA_MAGNET', '鉄棒の逆上がり', 'PE_HORIZONTAL_BAR'].includes(n))) {
                if (p.discardPile.length > 0) {
                    const idx = Math.floor(Math.random() * p.discardPile.length);
                    const retrieved = p.discardPile.splice(idx, 1)[0];
                    p.hand.push(retrieved);
                    currentLogs.push(`${trans(retrieved.name, languageMode)}を捨て札から回収した！`);
                }
            }

            if (card.name === '虹のプリズム' || card.name === 'RIKA_RAINBOW' || card.originalNames?.includes('虹のプリズム') || card.originalNames?.includes('RIKA_RAINBOW')) {
                const handToUpgrade = p.hand.filter(c => c.id !== card.id && !c.upgraded);
                if (handToUpgrade.length > 0) {
                    const shuffled = shuffle([...handToUpgrade]);
                    const targets = shuffled.slice(0, 2);
                    p.hand = p.hand.map(hc => {
                        if (targets.some(t => t.id === hc.id)) return getUpgradedCard(hc);
                        return hc;
                    });
                    currentLogs.push("手札のカードを2枚強化した！");
                }
            }

            if (isGiftBoxCard) {
                const allPotions = Object.values(POTION_LIBRARY);
                for (let i = 0; i < 2; i++) {
                    if (p.potions.length >= getPotionCapacity(p)) break;
                    const potion = { ...allPotions[Math.floor(Math.random() * allPotions.length)], id: `gift-pot-${Date.now()}-${i}` };
                    p.potions.push(potion);
                    currentLogs.push(`${trans(potion.name, languageMode)}をゲット！`);
                }
            }

            if (card.name === '学習アルゴリズム' || card.name === 'GENETIC_ALGORITHM' || card.originalNames?.includes('学習アルゴリズム') || card.originalNames?.includes('GENETIC_ALGORITHM')) {
                p.deck = p.deck.map(c => {
                    if (c.id === card.id) {
                        const newBlock = (c.block || 0) + 2;
                        return {
                            ...c,
                            block: newBlock,
                            description: c.description.replace(/ブロック(\d+)/, `ブロック${newBlock}`)
                        };
                    }
                    return c;
                });
            }

            const painCards = p.hand.filter(c => c.name === '腹痛' || c.name === 'PAIN');
            if (painCards.length > 0) {
                const dmg = painCards.length;
                p.currentHp -= dmg;
                currentLogs.push(`腹痛ダメージ: -${dmg}`);
                p.floatingText = { id: `pain-${Date.now()}`, text: `-${dmg}`, color: 'text-purple-500', iconType: 'skull' };
                nextActiveEffects.push({ id: `vfx-pain-${Date.now()}`, type: 'SLASH', targetId: 'player' });
            }

            p.currentEnergy -= effectiveCost;
            if (card.type === CardType.ATTACK && p.turnFlags['NEXT_ATTACK_COST_DOWN']) {
                delete p.turnFlags['NEXT_ATTACK_COST_DOWN'];
            }
            p.cardsPlayedThisTurn++;
            if (hasRelic(p, 'INK_BOTTLE')) {
                const inkCount = (p.relicCounters['INK_BOTTLE_COUNT'] || 0) + 1;
                if (inkCount >= 10) {
                    p.relicCounters['INK_BOTTLE_COUNT'] = 0;
                    const drawn = drawOneCard(p);
                    if (drawn) {
                        p.hand.push(drawn);
                        currentLogs.push(trans("インク瓶：カードを1枚引いた", languageMode));
                    }
                } else {
                    p.relicCounters['INK_BOTTLE_COUNT'] = inkCount;
                }
            }

            if (!p.typesPlayedThisTurn.includes(card.type)) {
                p.typesPlayedThisTurn.push(card.type);
            }

            if (card.type === CardType.ATTACK) {
                p.attacksPlayedThisTurn++;
            }

            if (p.relics.find(r => r.id === 'ORANGE_PELLETS')) {
                if (p.typesPlayedThisTurn.includes(CardType.ATTACK) &&
                    p.typesPlayedThisTurn.includes(CardType.SKILL) &&
                    p.typesPlayedThisTurn.includes(CardType.POWER)) {

                    if (p.powers['WEAK'] > 0) { p.powers['WEAK'] = 0; currentLogs.push(trans("へろろから回復した", languageMode)); }
                    if (p.powers['VULNERABLE'] > 0) { p.powers['VULNERABLE'] = 0; currentLogs.push(trans("びくびくから回復した", languageMode)); }
                    if (p.powers['FRAIL'] > 0) { p.powers['FRAIL'] = 0; currentLogs.push(trans("もろい解除！", languageMode)); }

                    p.typesPlayedThisTurn = [];
                    p.floatingText = { id: `pellets-${Date.now()}`, text: 'デバフ解除', color: 'text-white', iconType: 'shield' };
                    nextActiveEffects.push({ id: `vfx-pellets-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
            }

            if (card.name === '錬金術' || card.name === 'ALCHEMIZE' || card.originalNames?.includes('錬金術') || card.originalNames?.includes('ALCHEMIZE')) {
                const possibleCards = getFilteredCardPool(p.id).filter(c => c.rarity !== 'SPECIAL');
                const randomCardTemplate = possibleCards[Math.floor(Math.random() * possibleCards.length)];
                let newC = { ...randomCardTemplate, id: `alch-${Date.now()}`, cost: 0 } as ICard;
                if (p.powers['MASTER_REALITY']) newC = getUpgradedCard(newC);

                if (p.hand.length < HAND_SIZE + 5) {
                    p.hand.push(newC);
                } else {
                    p.discardPile.push(newC);
                }
                currentLogs.push(`${trans("錬金術", languageMode)}: ${trans(newC.name, languageMode)}を生成`);
                nextActiveEffects.push({ id: `vfx-alch-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            }

            if (
                card.name === '発見' ||
                card.name === 'DISCOVERY' ||
                card.name === 'ゼロの発見' ||
                card.name === 'SANSU_ZERO' ||
                card.originalNames?.includes('発見') ||
                card.originalNames?.includes('DISCOVERY') ||
                card.originalNames?.includes('ゼロの発見') ||
                card.originalNames?.includes('SANSU_ZERO')
            ) {
                const possibleCards = getFilteredCardPool(p.id);
                if (possibleCards.length > 0) {
                    for (let i = 0; i < 3; i++) {
                        let newCard = { ...possibleCards[Math.floor(Math.random() * possibleCards.length)], id: `disc-${Date.now()}-${i}` } as ICard;
                        if (p.powers['MASTER_REALITY']) newCard = getUpgradedCard(newCard);
                        if (p.hand.length < HAND_SIZE + 5) {
                            p.hand.push(newCard);
                        } else {
                            p.discardPile.push(newCard);
                        }
                        currentLogs.push(`${trans(newCard.name, languageMode)}を手札に加えた！`);
                    }
                }
                nextActiveEffects.push({ id: `vfx-disc-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            }

            if (
                card.name === '山勘' ||
                card.name === 'CALCULATED_GAMBLE' ||
                card.name === '単位変換' ||
                card.name === 'SANSU_UNIT' ||
                card.originalNames?.includes('山勘') ||
                card.originalNames?.includes('CALCULATED_GAMBLE') ||
                card.originalNames?.includes('単位変換') ||
                card.originalNames?.includes('SANSU_UNIT')
            ) {
                const cardsToDiscard = p.hand.filter(c => c.id !== card.id);
                const count = cardsToDiscard.length;
                cardsToDiscard.forEach(c => {
                    p.discardPile.push(c);
                    if (c.name === 'カンニングペーパー' || c.name === 'STRATEGIST') {
                        p.nextTurnEnergy += 2;
                        currentLogs.push(`${trans("カンニングペーパー", languageMode)}: +2 Next Turn Energy`);
                        p.floatingText = { id: `strat-${Date.now()}-${Math.random()}`, text: '+2 Next Turn', color: 'text-yellow-400', iconType: 'zap' };
                    }
                });
                p.hand = [];
                for (let i = 0; i < count; i++) {
                    if (p.drawPile.length === 0) {
                        if (p.discardPile.length === 0) break;
                        p.drawPile = shuffle(p.discardPile);
                        p.discardPile = [];
                    }
                    const newCard = p.drawPile.pop();
                    if (newCard) {
                        const card = { ...newCard };
                        if (card.name === '虚無' || card.name === 'VOID') {
                            p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                            p.floatingText = { id: `void-turn-${Date.now()}-${i}`, text: '-1 Energy', color: 'text-red-500', iconType: 'zap' };
                        }
                        if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && card.cost >= 0) {
                            card.cost = Math.floor(Math.random() * 4);
                        }
                        p.hand.push(card);
                    }
                }
                currentLogs.push(`${trans("手札を交換", languageMode)} (${count})`);
                nextActiveEffects.push({ id: `vfx-gamble-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            }

            if (p.powers['AFTER_IMAGE']) {
                p.block += p.powers['AFTER_IMAGE'];
                nextActiveEffects.push({ id: `vfx-after-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
            }
            if (p.powers['HEAL_ON_PLAY']) {
                const healAmount = p.powers['HEAL_ON_PLAY'];
                const beforeHp = p.currentHp;
                p.currentHp = Math.min(p.maxHp, p.currentHp + healAmount);
                if (p.currentHp > beforeHp) {
                    p.floatingText = { id: `heal-on-play-${Date.now()}`, text: `+${p.currentHp - beforeHp}`, color: 'text-green-500', iconType: 'heart' };
                    nextActiveEffects.push({ id: `vfx-heal-play-${Date.now()}`, type: 'HEAL', targetId: 'player' });
                }
            }
            if (card.type === CardType.SKILL && p.powers['SKILL_BLOCK']) {
                p.block += p.powers['SKILL_BLOCK'];
                nextActiveEffects.push({ id: `vfx-skill-block-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
            }
            if (p.powers['THOUSAND_CUTS']) {
                enemies.forEach(e => {
                    e.currentHp -= p.powers['THOUSAND_CUTS'];
                    e.floatingText = { id: `cut-${Date.now()}-${e.id}`, text: `${p.powers['THOUSAND_CUTS']}`, color: 'text-purple-400' };
                    nextActiveEffects.push({ id: `vfx-cut-${Date.now()}-${e.id}`, type: 'FIRE', targetId: e.id });
                });
            }

            let activations = 1;
            if (p.echoes > 0) { activations++; p.echoes--; currentLogs.push(trans("反響で再発動！", languageMode)); }
            if (card.type === CardType.SKILL && p.powers['BURST'] > 0) { activations++; p.powers['BURST']--; currentLogs.push(trans("バーストで再発動！", languageMode)); }
            if (card.type === CardType.ATTACK && p.relics.find(r => r.id === 'NECRONOMICON') && card.cost >= 2 && !p.turnFlags['NECRONOMICON_USED']) {
                activations++;
                p.turnFlags['NECRONOMICON_USED'] = true;
                currentLogs.push(trans("ネクロノミコンで再発動！", languageMode));
            }
            let attackDamageMultiplier = 1;
            if (card.type === CardType.ATTACK && p.turnFlags['NEXT_ATTACK_DOUBLE_DAMAGE']) {
                attackDamageMultiplier *= 2;
                delete p.turnFlags['NEXT_ATTACK_DOUBLE_DAMAGE'];
                currentLogs.push(trans("次のアタック強化が発動！", languageMode));
            }
            if (card.type === CardType.ATTACK && p.turnFlags['NEXT_ATTACK_EXTRA_ACTIVATION']) {
                activations += 1;
                delete p.turnFlags['NEXT_ATTACK_EXTRA_ACTIVATION'];
                currentLogs.push(trans("次のアタックが追加発動！", languageMode));
            }
            if (card.type === CardType.ATTACK && p.turnFlags['NEXT_ATTACK_TRIPLE']) {
                activations += 2;
                delete p.turnFlags['NEXT_ATTACK_TRIPLE'];
                currentLogs.push(trans("次のアタックが3連発動！", languageMode));
            }

            let baseVfx = 'SLASH';
            if (card.type === CardType.ATTACK) {
                if (card.name.includes('火') || card.name.includes('炎') || card.name === '焼却炉' || card.name === 'IMMOLATE') baseVfx = 'FIRE';
                else if (card.name.includes('雷') || card.name === '静電気' || card.name === 'BALL_LIGHTNING') baseVfx = 'LIGHTNING';
                else if (card.name === '大掃除' || card.name === 'FIEND_FIRE') baseVfx = 'EXPLOSION';
            }

            for (let act = 0; act < activations; act++) {
                if (enemies.every(e => e.currentHp <= 0)) break;
                let hits = 1;
                if (card.playCopies) hits += card.playCopies;
                if (card.hitsPerSkillInHand) hits = p.hand.filter(c => c.type === CardType.SKILL && c.id !== card.id).length;
                if (card.hitsPerAttackPlayed) hits = p.attacksPlayedThisTurn;
                const maxHits = 100;
                if (hits > maxHits) hits = maxHits;
                const hitsToLog = Math.min(hits, 10);

                for (let h = 0; h < hits; h++) {
                    const hitDelay = (act * hits + h) * 80;

                    if (enemies.every(e => e.currentHp <= 0)) break;
                    let targets: Enemy[] = [];
                    if (card.target === TargetType.ALL_ENEMIES) targets = enemies.filter(e => e.currentHp > 0);
                    else if (card.target === TargetType.RANDOM_ENEMY) {
                        const alive = enemies.filter(e => e.currentHp > 0);
                        targets = alive.length > 0 ? [alive[Math.floor(Math.random() * alive.length)]] : [];
                    }
                    else {
                        const target = enemies.find(e => e.id === prev.selectedEnemyId && e.currentHp > 0) || enemies.find(e => e.currentHp > 0);
                        if (target) targets = [target];
                    }

                    if (card.damage || card.damageBasedOnBlock || card.damagePerCardInHand || card.damagePerAttackPlayed || card.damagePerStrike || card.damagePerCardInDraw) {
                        targets.forEach(e => {
                            if (e.currentHp <= 0) return;
                            let baseDamage = (card.damage || 0);
                            let logParts: string[] = [`${baseDamage}`];
                            if (card.damageBasedOnBlock) { baseDamage += p.block; logParts[0] = `${baseDamage}(Block)`; }
                            if (card.damagePerCardInHand) baseDamage += (p.hand.filter(c => c.id !== card.id).length) * card.damagePerCardInHand!;
                            if (card.damagePerAttackPlayed) baseDamage += (p.attacksPlayedThisTurn) * card.damagePerAttackPlayed!;
                            if (card.damagePerStrike) baseDamage += (p.deck.filter(c => c.name === 'えんぴつ攻撃' || c.originalNames?.includes('えんぴつ攻撃')).length) * card.damagePerStrike!;
                            if (card.damagePerCardInDraw) baseDamage += p.drawPile.length * card.damagePerCardInDraw!;
                            if ((card.name === 'えんぴつの削りかす' || card.name === 'SHIV') && p.powers['ACCURACY']) {
                                baseDamage += p.powers['ACCURACY'];
                                logParts.push(`+${p.powers['ACCURACY']}(精度)`);
                            }
                            if (p.strength !== 0) {
                                const bonus = p.strength * (card.strengthScaling || 1);
                                baseDamage += bonus;
                                logParts.push(`${bonus >= 0 ? '+' : ''}${bonus}(${trans("ムキムキ", languageMode)})`);
                            }
                            let multiplier = 1;
                            if (act === 0 && h === 0 && card.type === CardType.ATTACK && p.relics.find(r => r.id === 'PEN_NIB')) {
                                p.relicCounters['ATTACK_COUNT_NIB'] = (p.relicCounters['ATTACK_COUNT_NIB'] || 0) + 1;
                                if (p.relicCounters['ATTACK_COUNT_NIB'] === 10) {
                                    multiplier = 2;
                                    p.relicCounters['ATTACK_COUNT_NIB'] = 0;
                                    logParts.push(`x2(ペン先)`);
                                }
                            }
                            let damage = Math.floor(baseDamage * multiplier * attackDamageMultiplier);
                            if (p.powers['WEAK'] > 0) {
                                damage = Math.floor(damage * 0.75);
                                logParts.push(`x0.75(${trans("へろへろ", languageMode)})`);
                            }
                            if (e.vulnerable > 0) {
                                damage = Math.floor(damage * 1.5);
                                logParts.push(`x1.5(${trans("びくびく", languageMode)})`);
                            }
                            if (p.powers['ENVENOM']) applyDebuff(e, 'POISON', p.powers['ENVENOM']);
                            if (e.block >= damage) { e.block -= damage; damage = 0; }
                            else { damage -= e.block; e.block = 0; }
                            e.currentHp -= damage;

                            let finalVfx = baseVfx;
                            if (damage > 15 && finalVfx === 'SLASH') finalVfx = 'CRITICAL';
                            if (e.currentHp <= 0 && (finalVfx === 'SLASH' || finalVfx === 'CRITICAL')) finalVfx = 'EXPLOSION';

                            nextActiveEffects.push({
                                id: `vfx-${Date.now()}-${Math.random()}`,
                                type: finalVfx as VFXType,
                                targetId: e.id,
                                delay: hitDelay,
                                rotation: Math.random() * 360
                            });

                            if (e.currentHp <= 0 && e.enemyType === 'THE_HEART' && e.phase === 1) {
                                e.currentHp = e.maxHp;
                                e.phase = 2;
                                e.name = "真・校長先生";
                                e.poison = 0; e.weak = 0; e.vulnerable = 0;
                                e.floatingText = { id: `phase-evo-${Date.now()}`, text: '本気モード！', color: 'text-yellow-500' };
                                currentLogs.push("校長先生が真の姿を現した！");
                                nextActiveEffects.push({ id: `vfx-evo-${Date.now()}`, type: 'BUFF', targetId: e.id, delay: hitDelay + 200 });
                            }
                            if (damage > 0 || logParts.length > 1) {
                                if (h % 5 === 0 || h === hits - 1) {
                                    e.floatingText = { id: `dmg-${Date.now()}-${e.id}-${h}`, text: `${damage}`, color: 'text-white', iconType: 'sword' };
                                }
                                const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                                if (h < hitsToLog) {
                                    currentLogs.push(`${trans(e.name, languageMode)}に${formula}${damage}${trans("ダメージ", languageMode)}`);
                                } else if (h === hitsToLog) {
                                    currentLogs.push("...さらに多数の攻撃！");
                                }
                            }
                            if (card.lifesteal && damage > 0) {
                                p.currentHp = Math.min(p.currentHp + damage, p.maxHp);
                                nextActiveEffects.push({ id: `vfx-heal-ls-${Date.now()}`, type: 'HEAL', targetId: 'player', delay: hitDelay });
                            }
                            if (e.currentHp <= 0) {
                                currentLogs.push(`${trans(e.name, languageMode)}${trans("を倒した！", languageMode)}`);
                                nextActStats.enemiesDefeated++;

                                if (card.fatalEnergy) p.currentEnergy += card.fatalEnergy;
                                if (card.fatalPermanentDamage) {
                                    p.deck = p.deck.map(dc => {
                                        if (dc.id === card.id) {
                                            const newDmg = (dc.damage || 0) + card.fatalPermanentDamage!;
                                            return {
                                                ...dc,
                                                damage: newDmg,
                                                description: dc.description.replace(/(\d+)(ダメージ)/, `${newDmg}$2`)
                                            };
                                        }
                                        return dc;
                                    });
                                    currentLogs.push(`${trans(card.name, languageMode)} の威力が上がった！`);
                                }
                                if (card.fatalMaxHp) { p.maxHp += card.fatalMaxHp!; p.currentHp += card.fatalMaxHp!; }
                                if (e.corpseExplosion) {
                                    enemies.forEach(other => {
                                        if (other.id !== e.id && other.currentHp > 0) {
                                            other.currentHp -= e.maxHp;
                                            other.floatingText = { id: `expl-${Date.now()}`, text: `${e.maxHp}`, color: 'text-green-400' };
                                            currentLogs.push(`${trans("衝撃のうわさ", languageMode)}: ${trans(other.name, languageMode)}に${e.maxHp}${trans("ダメージ", languageMode)}`);
                                            nextActiveEffects.push({ id: `vfx-expl-${Date.now()}-${other.id}`, type: 'FIRE', targetId: other.id, delay: hitDelay + 100 });
                                        }
                                    });
                                }
                                if (card.capture) {
                                    // 1. ダメージ計算 (最大HPの1/4)
                                    const damageVal = Math.max(5, Math.floor(e.maxHp * 0.25));

                                    // 2. ランダムなカード効果の抽選 (コスト3以下、アンロック済み、特定キャラ専用除外)
                                    const unlockedCardNames = storageService.getUnlockedCards();
                                    const forbiddenNames = new Set([
                                        ...Object.values(LIBRARIAN_CARDS).map(c => c.name),
                                        ...Object.values(GARDEN_SEEDS).map(c => c.name),
                                        ...Object.values(GROWN_PLANTS).map(c => c.name)
                                    ]);

                                    const allPossibleCards = Object.values(CARDS_LIBRARY).filter(c => {
                                        // 基本フィルタ
                                        if (c.type === CardType.CURSE || c.type === CardType.STATUS || c.rarity === 'SPECIAL') return false;
                                        if (c.cost > 3) return false;

                                        // 除外カードフィルタ
                                        if (forbiddenNames.has(c.name)) return false;

                                        // アンロックフィルタ (リストがある場合のみ適用)
                                        if (unlockedCardNames.length > 0 && !unlockedCardNames.includes(c.name)) {
                                            // ただし、BASIC/COMMONなカードがアンロックリストに含まれていない場合の救済が必要な場合は調整
                                            // ここではユーザー要望通り「アンロックされていないカードを除外」とする
                                            return false;
                                        }

                                        return true;
                                    });

                                    // 候補がない場合のフォールバック (基本カード)
                                    const fallbackPool = Object.values(CARDS_LIBRARY).filter(c => c.name === 'えんぴつ攻撃' || c.name === 'ノートで防御');
                                    const pool = allPossibleCards.length > 0 ? allPossibleCards : fallbackPool;

                                    const randomCardTemplate = pool[Math.floor(Math.random() * pool.length)];

                                    // 3. ハイブリッドカードの作成
                                    const totalDamage = (randomCardTemplate.damage || 0) + damageVal;

                                    const captured: ICard = {
                                        ...randomCardTemplate, // ランダムカードのプロパティをベースにする
                                        id: `captured-${e.id}-${Date.now()}`,
                                        name: e.name,
                                        textureRef: randomCardTemplate.textureRef,
                                        enemyIllustrationName: e.name,
                                        enemyIllustrationNames: Array.from(new Set([
                                            e.name,
                                            e.enemyType,
                                            e.phase === 2 ? `${e.enemyType}_2` : undefined,
                                            e.enemyType === 'THE_HEART' && e.phase === 2 ? 'THE_HEART_PHASE2' : undefined,
                                        ].filter(Boolean) as string[])),
                                        rarity: 'SPECIAL',
                                        exhaust: true,

                                        // ダメージを追加 (元々攻撃カードなら加算、そうでなければ新規設定)
                                        damage: totalDamage,
                                        target: randomCardTemplate.target === TargetType.SELF ? TargetType.ENEMY : randomCardTemplate.target, // 自分のみ対象なら敵単体に変更
                                        type: totalDamage > 0 ? CardType.ATTACK : randomCardTemplate.type // ダメージがあるなら攻撃タイプ優先
                                    };

                                    // 説明文の合成
                                    const exhaustText = trans("廃棄", languageMode);
                                    const damageLabel = trans("ダメージ", languageMode);
                                    let baseDesc = randomCardTemplate.description;
                                    let descriptionUpdated = false;

                                    // 元が攻撃カードで、かつ固定ダメージ記述がある場合、数値を合算値に置換して重複を防ぐ
                                    if ((randomCardTemplate.damage || 0) > 0) {
                                        // "Xダメージ" のパターンを探す
                                        const regex = new RegExp(`(\\d+)${damageLabel}`);
                                        const match = baseDesc.match(regex);
                                        if (match) {
                                            const numInDesc = parseInt(match[1]);
                                            // 記述されている数値がデータ上のダメージと一致する場合のみ置換 (「2回」などの回数や他数値を誤爆しないため)
                                            if (numInDesc === randomCardTemplate.damage) {
                                                captured.description = baseDesc.replace(regex, `${totalDamage}${damageLabel}`);
                                                descriptionUpdated = true;
                                            }
                                        }
                                    }

                                    // 置換できなかった場合（スキルカードや特殊な記述）は、先頭にダメージ文言を追加
                                    if (!descriptionUpdated) {
                                        const damageDesc = `${damageVal}${damageLabel}。`;
                                        captured.description = `${damageDesc} ${baseDesc}`;
                                    }

                                    if (!captured.description.includes(exhaustText) && !captured.description.includes('Exhaust')) {
                                        captured.description += ` ${exhaustText}。`;
                                    }

                                    p.deck.push(captured);
                                    p.discardPile.push(captured);
                                    e.floatingText = { id: `cap-${Date.now()}`, text: 'GET!', color: 'text-yellow-400' };
                                    currentLogs.push(`${trans(e.name, languageMode)}を${trans("捕獲した！", languageMode)} (${trans(randomCardTemplate.name, languageMode)}の効果付与)`);
                                    nextActiveEffects.push({ id: `vfx-cap-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                                }
                                if (card.name === '羅生門' || (card.id && card.id.includes('RASHOMON'))) {
                                    nextSelectionState = { active: true, type: 'EXHAUST', amount: 1 };
                                    currentLogs.push(trans("羅生門：手札1枚を廃棄してください。", languageMode));
                                }
                            }
                            if (card.name === '時間どろぼう' || card.name === 'TIME_THIEF') {
                                e.nextIntent = { type: EnemyIntentType.SLEEP, value: 0 };
                                currentLogs.push(`${trans(e.name, languageMode)}の行動を遅らせた！`);
                                e.floatingText = { id: `delay-${Date.now()}`, text: '遅延', color: 'text-blue-400' };
                                nextActiveEffects.push({ id: `vfx-delay-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id, delay: hitDelay });
                            }
                        });
                    }

                    if (card.block) {
                        let blk = card.block;
                        let logParts = [`${blk}`];
                        if (p.powers['DEXTERITY']) {
                            blk += p.powers['DEXTERITY'];
                            logParts.push(`${p.powers['DEXTERITY'] >= 0 ? '+' : ''}${p.powers['DEXTERITY']}(${trans("カチカチ", languageMode)})`);
                        }
                        if (p.powers['FRAIL'] > 0) {
                            blk = Math.floor(blk * 0.75);
                            logParts.push(`x0.75(${trans("もろい", languageMode)})`);
                        }
                        p.block += blk;
                        nextActiveEffects.push({ id: `vfx-blk-${Date.now()}`, type: 'BLOCK', targetId: 'player', delay: hitDelay });
                        const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                        if (h < hitsToLog) {
                            currentLogs.push(`${trans("ブロック", languageMode)}${formula}${blk}を${trans("獲得", languageMode)}`);
                        }
                    }
                    if (card.doubleBlock) {
                        p.block *= 2;
                        nextActiveEffects.push({ id: `vfx-dblblk-${Date.now()}`, type: 'BLOCK', targetId: 'player', delay: hitDelay });
                    }
                    if (card.heal) {
                        p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
                        if (p.partner) {
                            p.partner.currentHp = Math.min(p.partner.maxHp, p.partner.currentHp + card.heal);
                            p.partner.floatingText = { id: `heal-p-${Date.now()}`, text: `+${card.heal}`, color: 'text-green-500' };
                        }
                        nextActiveEffects.push({ id: `vfx-heal-${Date.now()}`, type: 'HEAL', targetId: 'player', delay: hitDelay });
                    }
                    if (card.energy) p.currentEnergy += card.energy;
                    if (card.selfDamage) {
                        p.currentHp -= card.selfDamage;
                        p.hpLostThisTurn = (p.hpLostThisTurn || 0) + card.selfDamage;
                        currentLogs.push(`${trans("自分に", languageMode)}${card.selfDamage}${trans("ダメージ", languageMode)}`);
                        if (p.powers['RUPTURE']) {
                            p.strength += p.powers['RUPTURE'];
                            nextActiveEffects.push({ id: `vfx-rup-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                        }
                        nextActiveEffects.push({ id: `vfx-sd-${Date.now()}`, type: 'SLASH', targetId: 'player', delay: hitDelay });
                    }

                    // --- FIX: fatalMaxHp as instant boost for non-attack Skills (target: SELF) ---
                    if (card.fatalMaxHp && card.type === CardType.SKILL && card.target === TargetType.SELF) {
                        p.maxHp += card.fatalMaxHp;
                        p.currentHp += card.fatalMaxHp;
                        p.floatingText = { id: `maxhp-${Date.now()}`, text: `MaxHP+${card.fatalMaxHp}`, color: 'text-green-400', iconType: 'heart' };
                        nextActiveEffects.push({ id: `vfx-mhp-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                    }

                    if (card.strength) {
                        if (card.target === TargetType.ENEMY || card.target === TargetType.ALL_ENEMIES) {
                            targets.forEach(e => {
                                e.strength += card.strength!;
                                e.floatingText = { id: `str-${Date.now()}-${e.id}`, text: `${card.strength > 0 ? '+' : ''}${card.strength}`, color: card.strength > 0 ? 'text-red-500' : 'text-gray-400', iconType: 'sword' };
                            });
                            currentLogs.push(`${trans("敵のムキムキ", languageMode)}${card.strength > 0 ? '+' : ''}${card.strength}`);
                        } else {
                            p.strength += card.strength;
                            nextActiveEffects.push({ id: `vfx-buff-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                            currentLogs.push(`${trans("ムキムキ", languageMode)}+${card.strength}`);
                        }
                    }
                    if (card.vulnerable) {
                        if (card.target === TargetType.SELF) {
                            p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + card.vulnerable;
                            p.floatingText = { id: `self-vuln-${Date.now()}`, text: `${trans("びくびく", languageMode)}+${card.vulnerable}`, color: 'text-pink-400' };
                            nextActiveEffects.push({ id: `vfx-self-dbuff-${Date.now()}`, type: 'DEBUFF', targetId: 'player', delay: hitDelay });
                        } else {
                            targets.forEach(e => {
                                applyDebuff(e, 'VULNERABLE', card.vulnerable!);
                                nextActiveEffects.push({ id: `vfx-dbuff-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id, delay: hitDelay });
                            });
                        }
                    }
                    if (card.weak) targets.forEach(e => {
                        applyDebuff(e, 'WEAK', card.weak!);
                        nextActiveEffects.push({ id: `vfx-dbuff-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id, delay: hitDelay });
                    });
                    if (card.poison) {
                        let amt = card.poison;
                        if (p.relics.find(r => r.id === 'SNAKE_SKULL')) amt += 1;
                        targets.forEach(e => {
                            applyDebuff(e, 'POISON', amt);
                            nextActiveEffects.push({ id: `vfx-dbuff-p-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id, delay: hitDelay });
                        });
                        if (h < hitsToLog) currentLogs.push(`${trans("ドクドク", languageMode)}${amt}${trans("を付与", languageMode)}`);
                    }
                    if (card.poisonMultiplier && targets.length > 0) {
                        targets.forEach(e => {
                            if (e.poison > 0) {
                                e.poison *= card.poisonMultiplier!;
                                currentLogs.push(`${trans(e.name, languageMode)}の${trans("毒", languageMode)}が${card.poisonMultiplier}倍になった！`);
                                nextActiveEffects.push({ id: `vfx-dbuff-pm-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id, delay: hitDelay });
                            }
                        });
                    }
                    if (card.upgradeHand) {
                        p.hand = p.hand.map(c => getUpgradedCard(c));
                        currentLogs.push(trans("手札を強化", languageMode));
                        nextActiveEffects.push({ id: `vfx-uh-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                    }
                    if (card.upgradeDeck) {
                        p.hand = p.hand.map(c => getUpgradedCard(c));
                        p.drawPile = p.drawPile.map(c => getUpgradedCard(c));
                        p.discardPile = p.discardPile.map(c => getUpgradedCard(c));
                        currentLogs.push(trans("デッキ全体を強化", languageMode));
                        nextActiveEffects.push({ id: `vfx-ud-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                    }
                    if (card.doubleStrength) {
                        p.strength *= 2;
                        nextActiveEffects.push({ id: `vfx-ds-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                    }
                    const isWeatherForecastCard =
                        card.name === '天気予報' ||
                        card.originalNames?.includes('天気予報') ||
                        card.description.includes('山札のトップ3枚');
                    if (isWeatherForecastCard) {
                        const peekCards: ICard[] = [];
                        for (let j = 0; j < 3; j++) {
                            if (p.drawPile.length === 0) {
                                if (p.discardPile === undefined || p.discardPile.length === 0) break;
                                p.drawPile = shuffle(p.discardPile);
                                p.discardPile = [];
                            }
                            const top = p.drawPile.pop();
                            if (top) peekCards.push(top);
                        }
                        // 一旦そのまま山札へ戻し、次の描画で専用モーダルを開く
                        peekCards.slice().reverse().forEach(c => p.drawPile.push(c));
                        p.turnFlags = { ...p.turnFlags, WEATHER_PENDING_MODAL: true };
                        if (peekCards.length > 0) {
                            currentLogs.push(trans("天気予報：カード選択を開始", languageMode));
                        } else {
                            currentLogs.push(trans("天気予報：並べ替えるカードがなかった", languageMode));
                        }
                        nextActiveEffects.push({ id: `vfx-weather-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                    }
                    if (isGalaxyExpressCard) {
                        const peekCards: ICard[] = [];
                        for (let j = 0; j < 5; j++) {
                            if (p.drawPile.length === 0) {
                                if (p.discardPile === undefined || p.discardPile.length === 0) break;
                                p.drawPile = shuffle(p.discardPile);
                                p.discardPile = [];
                            }
                            const top = p.drawPile.pop();
                            if (top) peekCards.push(top);
                        }
                        peekCards.slice().reverse().forEach(c => p.drawPile.push(c));
                        p.turnFlags = { ...p.turnFlags, GALAXY_PENDING_MODAL: true };
                        currentLogs.push(
                            peekCards.length > 0
                                ? trans("銀河鉄道の夜：カード選択を開始", languageMode)
                                : trans("銀河鉄道の夜：見られるカードがなかった", languageMode)
                        );
                        nextActiveEffects.push({ id: `vfx-galaxy-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                    }
                    if (card.name === '金魚すくい' || card.originalNames?.includes('金魚すくい') || card.id?.includes('OUT_GOLD_FISH')) {
                        p.turnFlags = { ...p.turnFlags, GOLD_FISH_PENDING_MODAL: true };
                        currentLogs.push(trans("金魚すくい：強化する手札を選んでください", languageMode));
                    }
                    if (card.name === '夢のおもちゃ屋' || card.originalNames?.includes('夢のおもちゃ屋') || card.id?.includes('OUT_TOY_STORE')) {
                        const legendaryPool = getFilteredCardPool(p.id).filter(c => c.rarity === 'LEGENDARY');
                        if (legendaryPool.length > 0) {
                            let newCard = { ...legendaryPool[Math.floor(Math.random() * legendaryPool.length)], id: `toy-store-${Date.now()}` };
                            if (p.powers['MASTER_REALITY']) newCard = getUpgradedCard(newCard);
                            if (p.hand.length < HAND_SIZE + 5) p.hand.push(newCard);
                            else p.discardPile.push(newCard);
                            currentLogs.push(`${trans(newCard.name, languageMode)}を生成した！`);
                        }
                    }
                    if (card.name === '幻覚キノコ' || card.originalNames?.includes('幻覚キノコ') || card.id?.includes('MYSTIC_MUSHROOM')) {
                        const pool = getFilteredCardPool(p.id).filter(c => c.type !== CardType.CURSE && c.type !== CardType.STATUS);
                        for (let j = 0; j < 2; j++) {
                            if (pool.length === 0) break;
                            let newCard = { ...pool[Math.floor(Math.random() * pool.length)], id: `mystic-mushroom-${Date.now()}-${j}` };
                            if (p.powers['MASTER_REALITY']) newCard = getUpgradedCard(newCard);
                            if (p.hand.length < HAND_SIZE + 5) p.hand.push(newCard);
                            else p.discardPile.push(newCard);
                        }
                        currentLogs.push(trans("ランダムなカード2枚を手札に加えた！", languageMode));
                    }
                    if (card.name === 'お年玉の誘惑' || card.originalNames?.includes('お年玉の誘惑') || card.id?.includes('OUT_NEW_YEAR_GOLD')) {
                        const candidates = p.hand.filter(c => c.id !== card.id);
                        if (candidates.length > 0) {
                            const target = candidates[Math.floor(Math.random() * candidates.length)];
                            p.hand = p.hand.map(hc => hc.id === target.id ? makeBattleCostZero(hc, 'この戦闘中: 0コスト。') : hc);
                            currentLogs.push(`${trans(target.name, languageMode)}のコストを0にした！`);
                        }
                    }
                    if (card.name === 'ガチャの神引き' || card.originalNames?.includes('ガチャの神引き') || card.id?.includes('OUT_GACHA_LUCK')) {
                        const deckLegendaries = p.deck.filter(c => c.rarity === 'LEGENDARY');
                        if (deckLegendaries.length > 0) {
                            const target = deckLegendaries[Math.floor(Math.random() * deckLegendaries.length)];
                            const copy = { ...target, id: `gacha-luck-${Date.now()}` };
                            if (p.hand.length < HAND_SIZE + 5) p.hand.push(copy);
                            else p.discardPile.push(copy);
                            currentLogs.push(`${trans(copy.name, languageMode)}を手札に加えた！`);
                        }
                    }
                    if (card.name === '図書室での昼寝' || card.originalNames?.includes('図書室での昼寝') || card.id?.includes('OUT_LIBRARY_SLEEP')) {
                        p.currentHp = p.maxHp;
                        if (p.powers['WEAK'] > 0) p.powers['WEAK'] = 0;
                        if (p.powers['VULNERABLE'] > 0) p.powers['VULNERABLE'] = 0;
                        if (p.powers['FRAIL'] > 0) p.powers['FRAIL'] = 0;
                        if (p.powers['CONFUSED'] > 0) p.powers['CONFUSED'] = 0;
                        currentLogs.push(trans("全デバフを解除し、HPを全回復した！", languageMode));
                    }
                    if (card.name === '手作りの宝地図' || card.originalNames?.includes('手作りの宝地図') || card.id?.includes('OUT_TREASURE_MAP')) {
                        const relicPool = Object.values(RELIC_LIBRARY).filter(r => ['COMMON', 'UNCOMMON', 'RARE', 'SHOP'].includes(r.rarity));
                        const relic = relicPool[Math.floor(Math.random() * relicPool.length)];
                        if (relic) {
                            p.relics = [...p.relics, relic];
                            applyExtendedRelicAcquireEffects(p, relic);
                            currentLogs.push(`${trans(relic.name, languageMode)}を入手した！`);
                        }
                    }
                    if (card.name === '初詣の願い事' || card.originalNames?.includes('初詣の願い事') || card.id?.includes('OUT_SHRINE_PRAY')) {
                        p.hand = p.hand.map(hc => hc.id === card.id ? hc : { ...hc, cost: 0 });
                        currentLogs.push(trans("手札の全カードのコストを0にした！", languageMode));
                    }
                    if (card.name === 'ローラーシューズ' || card.originalNames?.includes('ローラーシューズ') || card.id?.includes('OUT_ROLLER_BLADE')) {
                        p.hand = p.hand.map(hc => hc.id === card.id ? hc : makeBattleCostZero(hc, 'この戦闘中: 0コスト。'));
                        currentLogs.push(trans("このターン、全手札のコストを0にした！", languageMode));
                    }
                    if (card.name === '虫かごの秘密' || card.originalNames?.includes('虫かごの秘密') || card.id?.includes('OUT_BUG_BOX')) {
                        const capturedCards = p.deck.filter(c => c.id.startsWith('captured-') || c.rarity === 'SPECIAL' && !!c.enemyIllustrationName);
                        if (capturedCards.length > 0) {
                            const target = capturedCards[Math.floor(Math.random() * capturedCards.length)];
                            const copy = { ...target, id: `bug-box-${Date.now()}` };
                            if (p.hand.length < HAND_SIZE + 5) p.hand.push(copy);
                            else p.discardPile.push(copy);
                            currentLogs.push(`${trans(copy.name, languageMode)}を手札に加えた！`);
                        }
                    }
                    if (card.name === '出前ピザパーティー' || card.originalNames?.includes('出前ピザパーティー') || card.id?.includes('OUT_PIZZA_PARTY')) {
                        p.currentHp = p.maxHp;
                        if (p.partner) {
                            p.partner.currentHp = p.partner.maxHp;
                            p.partner.floatingText = { id: `partner-pizza-heal-${Date.now()}`, text: 'FULL', color: 'text-pink-400', iconType: 'heart' };
                        }
                        currentLogs.push(trans("自分とパートナーのHPを全回復した！", languageMode));
                    }
                    if (card.name === '虹を追いかけて' || card.originalNames?.includes('虹を追いかけて') || card.id?.includes('OUT_RAINBOW_CHASE')) {
                        const upgradeTargets = shuffle([...p.deck]).slice(0, 5);
                        const targetIds = new Set(upgradeTargets.map(c => c.id));
                        p.deck = p.deck.map(dc => targetIds.has(dc.id) ? getUpgradedCard(dc) : dc);
                        currentLogs.push(trans("デッキのランダムなカード5枚を強化した！", languageMode));
                    }
                    if (card.name === '迷い犬の恩返し' || card.originalNames?.includes('迷い犬の恩返し') || card.id?.includes('OUT_STREET_DOG')) {
                        p.turnFlags = { ...p.turnFlags, STREET_DOG_NEXT_BATTLE: true };
                        currentLogs.push(trans("次の戦闘開始時、エネルギー+3", languageMode));
                    }
                    if (card.name === '究極の10連ガチャ' || card.originalNames?.includes('究極の10連ガチャ') || card.id?.includes('OUT_SUPER_GACHA')) {
                        const pool = getFilteredCardPool(p.id).filter(c => c.type !== CardType.CURSE && c.type !== CardType.STATUS);
                        for (let j = 0; j < 10; j++) {
                            if (pool.length === 0) break;
                            let newCard = { ...pool[Math.floor(Math.random() * pool.length)], id: `super-gacha-${Date.now()}-${j}` };
                            if (p.powers['MASTER_REALITY']) newCard = getUpgradedCard(newCard);
                            if (p.hand.length < HAND_SIZE + 5) p.hand.push(newCard);
                            else p.discardPile.push(newCard);
                        }
                        currentLogs.push(trans("ランダムなカード10枚を加えた！", languageMode));
                    }
                    if (card.name === 'いつかの卒業式' || card.originalNames?.includes('いつかの卒業式') || card.id?.includes('OUT_GRADUATION_DAY')) {
                        p.strength += 20;
                        p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 20;
                        p.powers['ARTIFACT'] = (p.powers['ARTIFACT'] || 0) + 5;
                        currentLogs.push(trans("ムキムキ20、カチカチ20、キラキラ5を得た！", languageMode));
                    }
                    if (
                        card.name === '田んぼのかかし' ||
                        card.originalNames?.includes('田んぼのかかし') ||
                        card.id?.includes('OUT_SCARE_CROW') ||
                        card.name === 'おやすみスウィート' ||
                        card.originalNames?.includes('おやすみスウィート') ||
                        card.id?.includes('GIRLS_SWEET_DREAM')
                    ) {
                        targets.forEach(e => {
                            e.sleepTurns = Math.max(e.sleepTurns || 0, 2);
                            e.nextIntent = { type: EnemyIntentType.SLEEP, value: 0 };
                        });
                        currentLogs.push(trans("敵全体を2ターン眠らせた！", languageMode));
                    }
                    if (card.name === 'ドリーム・キャッチャー' || card.originalNames?.includes('ドリーム・キャッチャー') || card.id?.includes('GIRLS_DREAM_CATCHER')) {
                        p.turnFlags = { ...p.turnFlags, DREAM_CATCHER_PENDING_MODAL: true };
                        currentLogs.push(trans("ドリーム・キャッチャー：山札からカードを選んでください", languageMode));
                    }
                    if (card.name === 'なないろマジック' || card.originalNames?.includes('なないろマジック') || card.id?.includes('GIRLS_RAINBOW_MAGIC')) {
                        const candidates = p.hand.filter(c => c.id !== card.id && c.cost > 0);
                        if (candidates.length > 0) {
                            const target = candidates[Math.floor(Math.random() * candidates.length)];
                            p.hand = p.hand.map(hc => hc.id === target.id ? { ...hc, cost: 0 } : hc);
                            currentLogs.push(`${trans(target.name, languageMode)}のコストを0にした！`);
                        }
                    }
                    if (card.name === 'お姫様の呼び声' || card.originalNames?.includes('お姫様の呼び声') || card.id?.includes('GIRLS_PRINCESS_CALL')) {
                        const skills = p.drawPile.filter(c => c.type === CardType.SKILL);
                        if (skills.length > 0) {
                            const target = skills[Math.floor(Math.random() * skills.length)];
                            p.drawPile = p.drawPile.filter(c => c.id !== target.id);
                            p.hand.push(target);
                            currentLogs.push(`${trans(target.name, languageMode)}を山札から手札に加えた！`);
                        }
                    }
                    if (card.name === 'おとぎ話の扉' || card.originalNames?.includes('おとぎ話の扉') || card.id?.includes('GIRLS_FAIRY_TALE')) {
                        const specialPool = getFilteredCardPool(p.id).filter(c => c.rarity === 'SPECIAL');
                        for (let j = 0; j < 3; j++) {
                            if (specialPool.length === 0) break;
                            let newCard = { ...specialPool[Math.floor(Math.random() * specialPool.length)], id: `fairy-tale-${Date.now()}-${j}` };
                            if (p.powers['MASTER_REALITY']) newCard = getUpgradedCard(newCard);
                            if (p.hand.length < HAND_SIZE + 5) p.hand.push(newCard);
                            else p.discardPile.push(newCard);
                        }
                        currentLogs.push(trans("ランダムなスペシャルカードを3枚加えた！", languageMode));
                    }
                    if (card.name === '親友との約束' || card.originalNames?.includes('親友との約束') || card.id?.includes('OUT_FRIEND_FOREVER')) {
                        if (p.partner) {
                            p.partner.maxHp += 20;
                            p.partner.currentHp = p.partner.maxHp;
                            p.partner.floatingText = { id: `partner-fullheal-${Date.now()}`, text: 'FULL', color: 'text-pink-400', iconType: 'heart' };
                            currentLogs.push(trans("パートナーの最大HP+20、全回復！", languageMode));
                        }
                    }
                    if (card.name === 'ずっと友達だよ' || card.originalNames?.includes('ずっと友達だよ') || card.id?.includes('GIRLS_FRIENDSHIP')) {
                        if (p.partner) {
                            p.partner.currentHp = p.partner.maxHp;
                            p.partner.floatingText = { id: `partner-heal-${Date.now()}`, text: 'FULL', color: 'text-pink-400', iconType: 'heart' };
                            currentLogs.push(trans("パートナーのHPを全回復した！", languageMode));
                        }
                    }
                    if (card.name === '雷神の鉄拳' || card.originalNames?.includes('雷神の鉄拳') || card.id?.includes('BOYS_THUNDER_FIST')) {
                        p.turnFlags = { ...p.turnFlags, NEXT_ATTACK_COST_DOWN: true };
                        currentLogs.push(trans("次のアタックのコストが1下がる", languageMode));
                    }
                    if (card.name === 'リベンジ・バースト' || card.originalNames?.includes('リベンジ・バースト') || card.id?.includes('BOYS_REVENGE')) {
                        card.damage = Math.max(0, (p.hpLostThisTurn || 0) * 2);
                        currentLogs.push(trans(`今ターン失ったHPを力に変えた！ (${card.damage}ダメージ)`, languageMode));
                    }
                    if (card.name === '修羅の構え' || card.originalNames?.includes('修羅の構え') || card.id?.includes('BOYS_BATTLE_STANCE')) {
                        p.turnFlags = { ...p.turnFlags, NEXT_ATTACK_EXTRA_ACTIVATION: true };
                        currentLogs.push(trans("次のアタックが2回発動する", languageMode));
                    }
                    if (card.name === '路地裏の野良猫' || card.originalNames?.includes('路地裏の野良猫') || card.id?.includes('OUT_STRAY_CAT')) {
                        p.turnFlags = { ...p.turnFlags, NEXT_ATTACK_TRIPLE: true };
                        currentLogs.push(trans("次のアタックが3回発動する", languageMode));
                    }
                    if (card.name === 'バネの弾力' || card.originalNames?.includes('バネの弾力') || card.id?.includes('RIKA_SPRING')) {
                        p.turnFlags = { ...p.turnFlags, NEXT_ATTACK_DOUBLE_DAMAGE: true };
                        currentLogs.push(trans("次の攻撃ダメージが2倍になる", languageMode));
                    }
                    if (card.name === '華麗な舞' || card.originalNames?.includes('華麗な舞') || card.id?.includes('GIRLS_BALLERINA')) {
                        p.turnFlags = { ...p.turnFlags, NEXT_ATTACK_DOUBLE_DAMAGE: true };
                        currentLogs.push(trans("次のアタックが強化された", languageMode));
                    }
                    if (card.name === '本命チョコ' || card.originalNames?.includes('本命チョコ') || card.id?.includes('GIRLS_CHOCO_VALENTINE')) {
                        targets.forEach(e => {
                            e.sleepTurns = Math.max(e.sleepTurns || 0, 1);
                            e.nextIntent = { type: EnemyIntentType.SLEEP, value: 0 };
                        });
                        currentLogs.push(trans("相手を1ターン行動不能にした！", languageMode));
                    }
                    if (card.name === 'カラフル・レインボー' || card.originalNames?.includes('カラフル・レインボー') || card.id?.includes('GIRLS_COLORFUL_RAIN')) {
                        enemies.forEach(e => {
                            if (e.currentHp > 0) e.block = 0;
                        });
                        currentLogs.push(trans("敵全体のブロックを解除した！", languageMode));
                    }
                    if (card.name === '川での魚つかみ' || card.originalNames?.includes('川での魚つかみ') || card.id?.includes('OUT_FISH_CATCH')) {
                        const allPotions = Object.values(POTION_LIBRARY);
                        for (let i = 0; i < 2; i++) {
                            if (p.potions.length >= getPotionCapacity(p)) break;
                            const potion = { ...allPotions[Math.floor(Math.random() * allPotions.length)], id: `fish-catch-${Date.now()}-${i}` };
                            p.potions.push(potion);
                            currentLogs.push(`${trans(potion.name, languageMode)}をゲット！`);
                        }
                    }
                    if (card.shuffleHandToDraw) {
                        p.drawPile = shuffle([...p.drawPile, ...p.discardPile]);
                        p.discardPile = [];
                        currentLogs.push(trans("捨て札を山札に戻した", languageMode));
                    }
                    if (card.applyPower) {
                        if (card.applyPower.id === 'CLEAR_DEBUFFS') {
                            p = clearCombatDebuffs(p);
                        } else {
                            p.powers[card.applyPower.id] = (p.powers[card.applyPower.id] || 0) + card.applyPower.amount;
                        }
                        if (card.applyPower.id === 'CORPSE_EXPLOSION' && targets.length > 0) {
                            targets.forEach(e => e.corpseExplosion = true);
                            currentLogs.push(trans("衝撃のうわさを付与", languageMode));
                            nextActiveEffects.push({ id: `vfx-ce-${Date.now()}`, type: 'DEBUFF', targetId: targets[0].id, delay: hitDelay });
                        }
                        nextActiveEffects.push({ id: `vfx-ap-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                    }
                    if (
                        (card.name === '奇跡のリボン' || card.originalNames?.includes('奇跡のリボン') || card.id?.includes('GIRLS_MIRACLE_RIBBON'))
                    ) {
                        p.currentEnergy = p.maxEnergy;
                        currentLogs.push(trans("エネルギーを全回復した！", languageMode));
                    }
                    if (card.name === 'おじいちゃんの古民家' || card.originalNames?.includes('おじいちゃんの古民家') || card.id?.includes('OUT_OLD_HOUSE')) {
                        p.currentHp = p.maxHp;
                        currentLogs.push(trans("HPを全回復した！", languageMode));
                    }
                    if (card.draw && !isGalaxyExpressCard) {
                        for (let j = 0; j < card.draw; j++) {
                            if (p.drawPile.length === 0) {
                                if (p.discardPile === undefined || p.discardPile.length === 0) break;
                                p.drawPile = shuffle(p.discardPile);
                                p.discardPile = [];
                            }
                            const newCard = p.drawPile.pop();
                            if (newCard) {
                                const card = { ...newCard };
                                if (card.name === '虚無' || card.name === 'VOID') {
                                    p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                                    p.floatingText = { id: `void-turn-${Date.now()}-${j}`, text: '-1 Energy', color: 'text-red-500', iconType: 'zap' };
                                }
                                if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && card.cost >= 0) {
                                    card.cost = Math.floor(Math.random() * 4);
                                }
                                p.hand.push(card);
                                if (p.powers['EVOLVE'] && (card.type === CardType.STATUS || card.type === CardType.CURSE)) {
                                    for (let k = 0; k < p.powers['EVOLVE']; k++) {
                                        if (p.drawPile.length === 0) {
                                            if (p.discardPile === undefined || p.discardPile.length === 0) break;
                                            p.drawPile = shuffle(p.discardPile);
                                            p.discardPile = [];
                                        }
                                        const extraCardRaw = p.drawPile.pop();
                                        if (extraCardRaw) {
                                            const extraCard = { ...extraCardRaw };
                                            if (extraCard.name === '虚無' || extraCard.name === 'VOID') {
                                                p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                                                p.floatingText = { id: `void-evolve-${Date.now()}-${k}`, text: '-1 Energy', color: 'text-red-500', iconType: 'zap' };
                                            }
                                            if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && extraCard.cost >= 0) {
                                                extraCard.cost = Math.floor(Math.random() * 4);
                                            }
                                            p.hand.push(extraCard);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (card.name === 'あがく' || card.name === 'SCRAPE' || card.originalNames?.includes('あがく') || card.originalNames?.includes('SCRAPE')) {
                        const cardsToScrape = p.hand.filter(c => c.id !== card.id && c.cost > 0);
                        cardsToScrape.forEach(c => {
                            p.hand = p.hand.filter(h => h.id !== c.id);
                            p.discardPile.push(c);
                            if (c.name === 'カンニングペーパー' || c.name === 'STRATEGIST') {
                                p.nextTurnEnergy += 2;
                                currentLogs.push(`${trans("カンニングペーパー", languageMode)}: +2 Next Turn Energy`);
                                p.floatingText = { id: `strat-${Date.now()}-${Math.random()}`, text: '+2 Next Turn', color: 'text-yellow-400', iconType: 'zap' };
                            }
                        });
                        if (cardsToScrape.length > 0) {
                            currentLogs.push(trans("コスト0以外のカードを捨てた", languageMode));
                        }
                    }

                    if (card.addCardToHand && !(card.name === '幻覚キノコ' || card.originalNames?.includes('幻覚キノコ') || card.id?.includes('MYSTIC_MUSHROOM'))) {
                        for (let c = 0; c < card.addCardToHand.count; c++) {
                            const template = CARDS_LIBRARY[card.addCardToHand.cardName];
                            if (template) {
                                let newC = { ...template, id: `gen-hand-${Date.now()}-${act}-${h}-${c}-${Math.random()}` };
                                if (card.addCardToHand.cost0) newC.cost = 0;
                                if (p.powers['MASTER_REALITY']) newC = getUpgradedCard(newC);
                                if (p.hand.length < HAND_SIZE + 5) {
                                    p.hand.push(newC);
                                } else {
                                    p.discardPile.push(newC);
                                }
                            }
                        }
                    }
                    if (card.addCardToDraw) {
                        for (let c = 0; c < card.addCardToDraw.count; c++) {
                            const template = CARDS_LIBRARY[card.addCardToDraw.cardName];
                            if (template) p.drawPile.push({ ...template, id: `gen-draw-${Date.now()}-${act}-${h}-${c}-${Math.random()}` });
                        }
                        p.drawPile = shuffle(p.drawPile);
                    }
                    if (card.addCardToDiscard) {
                        for (let c = 0; c < card.addCardToDiscard.count; c++) {
                            const template = CARDS_LIBRARY[card.addCardToDiscard.cardName];
                            if (template) p.discardPile.push({ ...template, id: `gen-discard-${Date.now()}-${act}-${h}-${c}-${Math.random()}` });
                        }
                    }
                    if (card.nextTurnDraw) p.nextTurnDraw += card.nextTurnDraw;
                    if (card.nextTurnEnergy) p.nextTurnEnergy += card.nextTurnEnergy;

                    if (card.name === '早退' || card.name === 'EXPULSION' || card.originalNames?.includes('早退') || card.originalNames?.includes('EXPULSION')) {
                        const threshold = card.upgraded ? 40 : 30;
                        targets.forEach(e => {
                            if (e.currentHp <= threshold) {
                                e.currentHp = 0;
                                currentLogs.push(`${trans(e.name, languageMode)}は${trans("早退", languageMode)}になった！`);
                                e.floatingText = { id: `kill-${Date.now()}`, text: '早退!', color: 'text-red-600', iconType: 'skull' };
                                nextActiveEffects.push({ id: `vfx-exp-${Date.now()}`, type: 'SLASH', targetId: e.id, delay: hitDelay });
                            } else {
                                currentLogs.push(`${trans(e.name, languageMode)}は${trans("早退", languageMode)}を免れた`);
                            }
                        });
                    }

                    if (card.name === '大ジャンプ' || card.name === 'VAULT' || card.originalNames?.includes('大ジャンプ') || card.originalNames?.includes('VAULT')) {
                        p.turnFlags['VAULT_EXTRA_TURN'] = true;
                        currentLogs.push(trans("追加ターンを得る！", languageMode));
                        nextActiveEffects.push({ id: `vfx-vault-${Date.now()}`, type: 'BUFF', targetId: 'player', delay: hitDelay });
                    }
                }
            }

            if (card.type === CardType.ATTACK) {
                p.relicCounters['ATTACK_COUNT'] = (p.relicCounters['ATTACK_COUNT'] || 0) + 1;
                if (p.relicCounters['ATTACK_COUNT'] % 3 === 0) {
                    if (p.relics.find(r => r.id === 'KUNAI')) { p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1; p.floatingText = { id: `kunai-${Date.now()}`, text: `${trans("カチカチ", languageMode)}+1`, color: 'text-blue-400', iconType: 'shield' }; nextActiveEffects.push({ id: `vfx-kunai-${Date.now()}`, type: 'BLOCK', targetId: 'player' }); }
                    if (p.relics.find(r => r.id === 'SHURIKEN')) { p.strength += 1; p.floatingText = { id: `shuri-${Date.now()}`, text: `${trans("ムキムキ", languageMode)}+1`, color: 'text-red-400', iconType: 'sword' }; nextActiveEffects.push({ id: `vfx-shuri-${Date.now()}`, type: 'BUFF', targetId: 'player' }); }
                    if (p.relics.find(r => r.id === 'ORNAMENTAL_FAN')) { p.block += 4; p.floatingText = { id: `fan-${Date.now()}`, text: '+4 Block', color: 'text-blue-400', iconType: 'shield' }; nextActiveEffects.push({ id: `vfx-fan-${Date.now()}`, type: 'BLOCK', targetId: 'player' }); }
                    // Compass (Calipers) Effect: Draw 1 card every 3 attacks
                    if (p.relics.find(r => r.id === 'CALIPERS')) {
                        if (p.drawPile.length === 0) {
                            if (p.discardPile.length !== 0) {
                                p.drawPile = shuffle(p.discardPile);
                                p.discardPile = [];
                            }
                        }
                        const drawn = p.drawPile.pop();
                        if (drawn) {
                            p.hand.push(drawn);
                            currentLogs.push(trans("コンパス：カードを1枚引いた", languageMode));
                            nextActiveEffects.push({ id: `vfx-calip-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                        }
                    }
                }
            }

            const consumedIds = (card as any)._consumedIds;
            if (consumedIds && Array.isArray(consumedIds)) {
                const cardsToRemove = p.hand.filter(c => consumedIds.includes(c.id));
                p.hand = p.hand.filter(c => !consumedIds.includes(c.id));

                cardsToRemove.forEach(c => {
                    let shouldExhaust = c.exhaust;
                    if (c.type === CardType.SKILL && p.powers['CORRUPTION']) shouldExhaust = true;

                    if (!shouldExhaust && !(c.type === CardType.POWER) && !(c.promptsExhaust === 99)) {
                        p.discardPile.push(c);
                    } else if (shouldExhaust || c.promptsExhaust === 99) {
                        if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
                    }
                });
            } else {
                p.hand = p.hand.filter(c => c.id !== card.id);
                let shouldExhaust = card.exhaust;
                if (card.type === CardType.SKILL && p.powers['CORRUPTION']) shouldExhaust = true;
                if (card.name === 'むしゃくしゃ' || card.name === 'YATSUATARI' || card.originalNames?.includes('むしゃくしゃ') || card.originalNames?.includes('YATSUATARI')) {
                    card.damage = (card.damage || 0) + 5;
                    currentLogs.push("むしゃくしゃの怒りが増した！");
                    nextActiveEffects.push({ id: `vfx-metric-${Date.now()}`, type: 'FIRE', targetId: 'player' });
                }
                if (!shouldExhaust && !(card.type === CardType.POWER) && !(card.promptsExhaust === 99)) {
                    p.discardPile.push(card);
                } else if (shouldExhaust || card.promptsExhaust === 99) {
                    if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
                }
                if (card.promptsDiscard) nextSelectionState = { active: true, type: 'DISCARD', amount: card.promptsDiscard, originCardId: card.id };
                if (card.promptsCopy) nextSelectionState = { active: true, type: 'COPY', amount: card.promptsCopy, originCardId: card.id };
                if (card.promptsExhaust && card.promptsExhaust !== 99) {
                    nextSelectionState = { active: true, type: 'EXHAUST', amount: card.promptsExhaust, originCardId: card.id };
                    currentLogs.push(trans("廃棄するカードを選択してください。", languageMode));
                }
                if (card.promptsExhaust === 99) {
                    if (
                        card.name === '断捨離' ||
                        card.name === 'SEVER_SOUL' ||
                        card.name === '読書感想文' ||
                        card.name === 'KOKUGO_BOOK_REPORT' ||
                        card.originalNames?.includes('断捨離') ||
                        card.originalNames?.includes('SEVER_SOUL') ||
                        card.originalNames?.includes('読書感想文') ||
                        card.originalNames?.includes('KOKUGO_BOOK_REPORT')
                    ) {
                        const cardsToExhaust = p.hand.filter(c => c.type !== CardType.ATTACK);
                        if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
                        p.hand = p.hand.filter(c => c.type === CardType.ATTACK);
                        currentLogs.push(trans("非攻撃カードを廃棄した", languageMode));
                    } else if (card.name === '大掃除' || card.name === 'FIEND_FIRE' || card.originalNames?.includes('大掃除') || card.originalNames?.includes('FIEND_FIRE')) {
                        const count = p.hand.length;
                        if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * count;
                        p.hand = [];
                    }
                }
            }

            if ((card.battleBonusDrawOnPlay || 0) > 0) {
                for (let i = 0; i < (card.battleBonusDrawOnPlay || 0); i++) {
                    if (p.drawPile.length === 0 && p.discardPile.length > 0) {
                        p.drawPile = shuffle(p.discardPile);
                        p.discardPile = [];
                    }
                    const drawn = p.drawPile.pop();
                    if (!drawn) break;
                    p.hand.push(drawn);
                }
                currentLogs.push('追加テキスト: カードを1枚引いた');
            }

            if ((p.relicCounters['OUT_STAMP_QUEST_REMAINING'] || 0) > 0 &&
                !(card.name === 'スタンプラリー' || card.originalNames?.includes('スタンプラリー') || card.id?.includes('OUT_STAMP_COLLECT'))) {
                p.relicCounters['OUT_STAMP_QUEST_REMAINING'] -= 1;
                const remaining = p.relicCounters['OUT_STAMP_QUEST_REMAINING'];
                if (remaining <= 0) {
                    p.currentEnergy += 1;
                    for (let i = 0; i < 2; i++) {
                        if (p.drawPile.length === 0 && p.discardPile.length > 0) {
                            p.drawPile = shuffle(p.discardPile);
                            p.discardPile = [];
                        }
                        const drawn = p.drawPile.pop();
                        if (!drawn) break;
                        p.hand.push(drawn);
                    }
                    currentLogs.push('クエスト達成: エネルギー1、2ドロー');
                    delete p.relicCounters['OUT_STAMP_QUEST_REMAINING'];
                    nextActiveEffects.push({ id: `vfx-quest-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                } else {
                    currentLogs.push(`クエスト進行: あと${remaining}枚`);
                }
            }

            let nextSelectedId = prev.selectedEnemyId;
            const aliveEnemies = enemies.filter(e => e.currentHp > 0);
            const defeatedCount = enemies.length - aliveEnemies.length;
            if (defeatedCount > 0 && hasRelic(p, 'BIRD_FACED_URN')) {
                const healAmount = defeatedCount * 2;
                p.currentHp = Math.min(p.maxHp, p.currentHp + healAmount);
                currentLogs.push(`鳥の壺: HPを${healAmount}回復`);
            }
            syncRedSkullState(p);
            if (!aliveEnemies.find(e => e.id === nextSelectedId) && aliveEnemies.length > 0) nextSelectedId = aliveEnemies[0].id;
            const nextCoopBattleState = prev.challengeMode === 'COOP'
                ? updateCoopBattleStateForLocalPlayer(prev.coopBattleState, p, nextSelectedId)
                : prev.coopBattleState;

            return {
                ...prev,
                player: p,
                enemies: aliveEnemies,
                selectedEnemyId: nextSelectedId,
                coopBattleState: nextCoopBattleState,
                selectionState: nextSelectionState,
                actStats: nextActStats,
                combatLog: [...prev.combatLog, ...currentLogs].slice(-100),
                activeEffects: [...prev.activeEffects, ...attachCoopEffectOwner(nextActiveEffects, effectOwnerPeerId)]
            };
        });

        setTimeout(() => {
            setGameState(prev => ({ ...prev, activeEffects: [] }));
        }, 1200);
    };

    const startPlayerTurn = () => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost && gameState.screen === GameScreen.BATTLE) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_TURN_START' });
        }
        setTurnLog(getSelfTurnLogLabel());
        setGameState(prev => {
            const p = { ...prev.player };
            const currentLogs: string[] = [];
            const nextActiveEffects: VisualEffectInstance[] = [];
            let extraEnergy = 0;

            // --- ターン開始時ドロー強化ロジック ---
            let drawBonus = 0;
            if (p.powers['DRAW_POWER']) drawBonus += p.powers['DRAW_POWER'];
            if (p.powers['DRAW_POWER_2']) drawBonus += p.powers['DRAW_POWER_2'];
            if (p.powers['ENERGY_DRAW_POWER']) {
                drawBonus += p.powers['ENERGY_DRAW_POWER'];
                extraEnergy += p.powers['ENERGY_DRAW_POWER'];
            }
            if (hasRelic(p, 'POCKETWATCH') && (p.relicCounters['POCKETWATCH_PENDING'] || 0) > 0) {
                drawBonus += 3;
                p.relicCounters['POCKETWATCH_PENDING'] = 0;
            }

            if (p.turnFlags['NURSE_ROOM_GEL_NEXT_BLOCK']) {
                p.block += 8;
                p.floatingText = { id: `nurse-gel-${Date.now()}`, text: '+8', color: 'text-blue-400', iconType: 'shield' };
                delete p.turnFlags['NURSE_ROOM_GEL_NEXT_BLOCK'];
            }

            if (p.powers['DEMON_FORM']) {
                p.strength += p.powers['DEMON_FORM'];
                p.floatingText = { id: `pow-demon-${Date.now()}`, text: '反抗期', color: 'text-red-500' };
                nextActiveEffects.push({ id: `vfx-demon-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            }
            if (p.powers['BERSERK_POWER']) {
                extraEnergy += p.powers['BERSERK_POWER'];
                p.floatingText = { id: `pow-berserk-${Date.now()}`, text: '+1 Energy', color: 'text-yellow-400', iconType: 'zap' };
                nextActiveEffects.push({ id: `vfx-berserk-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            }
            if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
            let devaBonus = 0;
            if (p.powers['DEVA_FORM']) {
                devaBonus = p.powers['DEVA_FORM'];
                p.powers['DEVA_FORM']++;
                p.floatingText = { id: `pow-deva-${Date.now()}`, text: `受験勉強(+${devaBonus})`, color: 'text-purple-400' };
                nextActiveEffects.push({ id: `vfx-deva-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            }
            if (p.powers['NOXIOUS_FUMES']) {
                const enemies = prev.enemies.map(e => {
                    const newPoison = e.poison + p.powers['NOXIOUS_FUMES'];
                    nextActiveEffects.push({ id: `vfx-fumes-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id });
                    return { ...e, poison: newPoison };
                });
                prev.enemies = enemies;
            }
            if (prev.turn === 1 && p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) {
                p.strength -= 3;
                p.floatingText = { id: `relic-mutagen-${Date.now()}`, text: '筋力低下', color: 'text-gray-400' };
                nextActiveEffects.push({ id: `vfx-mutagen-${Date.now()}`, type: 'DEBUFF', targetId: 'player' });
            }
            if (p.relics.find(r => r.id === 'MERCURY_HOURGLASS')) {
                prev.enemies.forEach(e => {
                    e.currentHp -= 3;
                    e.floatingText = { id: `dmg-hg-${Date.now()}-${e.id}`, text: '3', color: 'text-gray-400', iconType: 'sword' };
                    nextActiveEffects.push({ id: `vfx-hg-${Date.now()}-${e.id}`, type: 'SLASH', targetId: e.id });
                });
                prev.enemies = prev.enemies.filter(e => e.currentHp > 0);
            }
            if (prev.turn === 1 && p.relics.find(r => r.id === 'HORN_CLEAT')) {
                p.block += 14;
                p.floatingText = { id: `relic-horn-${Date.now()}`, text: '+14 Block', color: 'text-blue-400', iconType: 'shield' };
                nextActiveEffects.push({ id: `vfx-horn-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
            }
            if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) {
                const current = (p.relicCounters['HAPPY_FLOWER'] || 0) + 1;
                if (current === 3) {
                    extraEnergy += 1;
                    p.floatingText = { id: `relic-flower-${Date.now()}`, text: '+1 Energy', color: 'text-yellow-400', iconType: 'zap' };
                    p.relicCounters['HAPPY_FLOWER'] = 0;
                    nextActiveEffects.push({ id: `vfx-happy-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                } else {
                    p.relicCounters['HAPPY_FLOWER'] = current;
                }
            }
            let baseEnergy = p.maxEnergy + p.nextTurnEnergy + devaBonus + extraEnergy;
            if (p.relics.find(r => r.id === 'ICE_CREAM')) {
                baseEnergy += p.currentEnergy;
            }
            p.currentEnergy = baseEnergy;
            p.nextTurnEnergy = 0;
            p.hpLostThisTurn = 0;

            let newDrawPile = [...p.drawPile];
            let newDiscardPile = [...p.discardPile];
            let newHand: ICard[] = [];
            if (p.relics.find(r => r.id === 'BOOKMARK') && p.hand.length > 0) {
                newHand.push(p.hand[0]);
                newDiscardPile = [...newDiscardPile, ...p.hand.slice(1)];
            } else {
                newDiscardPile = [...newDiscardPile, ...p.hand];
            }
            let drawCount = HAND_SIZE + (p.powers['TOOLS_OF_THE_TRADE'] ? 1 : 0) + p.nextTurnDraw + drawBonus;
            p.nextTurnDraw = 0;
            for (let i = 0; i < drawCount; i++) {
                if (newDrawPile.length === 0) {
                    if (newDiscardPile === undefined || newDiscardPile.length === 0) break;
                    newDrawPile = shuffle(newDiscardPile);
                    newDiscardPile = [];
                }
                const drawnCard = newDrawPile.pop();
                if (drawnCard) {
                    const card = { ...drawnCard };
                    if (card.name === '虚無' || card.name === 'VOID') {
                        p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                        p.floatingText = { id: `void-turn-${Date.now()}-${i}`, text: '-1 Energy', color: 'text-red-500', iconType: 'zap' };
                    }
                    if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && card.cost >= 0) {
                        card.cost = Math.floor(Math.random() * 4);
                    }
                    newHand.push(card);
                    if (p.powers['EVOLVE'] && (card.type === CardType.STATUS || card.type === CardType.CURSE)) {
                        for (let k = 0; k < p.powers['EVOLVE']; k++) {
                            if (newDrawPile.length === 0) {
                                if (newDiscardPile === undefined || newDiscardPile.length === 0) break;
                                newDrawPile = shuffle(newDiscardPile);
                                newDiscardPile = [];
                            }
                            const extraCardRaw = newDrawPile.pop();
                            if (extraCardRaw) {
                                const extraCard = { ...extraCardRaw };
                                if (extraCard.name === '虚無' || extraCard.name === 'VOID') {
                                    p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                                    p.floatingText = { id: `void-evolve-${Date.now()}-${k}`, text: '-1 Energy', color: 'text-red-500', iconType: 'zap' };
                                }
                                if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && extraCard.cost >= 0) {
                                    extraCard.cost = Math.floor(Math.random() * 4);
                                }
                                newHand.push(extraCard);
                            }
                        }
                    }
                }
            }

            if (p.codexBuffer && p.codexBuffer.length > 0) {
                const uniqueCodexCards = [...p.codexBuffer];
                p.codexBuffer = [];
                uniqueCodexCards.forEach(c => {
                    const newCard = { ...c, id: `codex-hand-${Date.now()}-${Math.random()}` };
                    newHand.push(newCard);
                    currentLogs.push(`${trans(newCard.name, languageMode)} を手札に加えた！`);
                });
            }

            if (p.powers['CREATIVE_AI']) {
                const powerPool = getFilteredCardPool(p.id).filter(c => c.type === CardType.POWER);
                const power = { ...powerPool[Math.floor(Math.random() * powerPool.length)], id: `ai-${Date.now()}`, cost: 0 };
                newHand.push(power);
                nextActiveEffects.push({ id: `vfx-ai-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            }
            if (p.powers['INFINITE_BLADES']) {
                const shiv = { ...CARDS_LIBRARY['SHIV'], id: `inf-${Date.now()}` };
                newHand.push(shiv);
            }
            if (p.relics.find(r => r.id === 'WARPED_TONGS') && newHand.length > 0) {
                const upgradeable = newHand.filter(c => !c.upgraded);
                if (upgradeable.length > 0) {
                    const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                    const upgraded = getUpgradedCard(c);
                    const idx = newHand.findIndex(x => x.id === c.id);
                    if (idx !== -1) newHand[idx] = upgraded;
                    nextActiveEffects.push({ id: `vfx-tongs-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
            }
            if (p.powers['COST_REDUCTION']) {
                newHand = newHand.map(c => {
                    if (c.cost > 0) {
                        return { ...c, cost: Math.max(0, c.cost - p.powers['COST_REDUCTION']) };
                    }
                    return c;
                });
            }
            if (!p.powers['BARRICADE']) {
                p.block = 0;
            }
            p.hand = newHand;
            p.drawPile = newDrawPile;
            p.discardPile = newDiscardPile;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;
            p.turnFlags = {};
            p.typesPlayedThisTurn = [];
            p.relicCounters['ATTACK_COUNT'] = 0;
            syncRedSkullState(p);
            let nextSelection = { ...prev.selectionState };
            if (p.powers['TOOLS_OF_THE_TRADE']) {
                nextSelection = { active: true, type: 'DISCARD', amount: 1 };
            }
            const nextCoopBattleState = prev.challengeMode === 'COOP'
                ? updateCoopBattleStateForLocalPlayer(prev.coopBattleState, p, prev.selectedEnemyId)
                : prev.coopBattleState;

            isEndingTurnRef.current = false;

            return {
                ...prev,
                player: p,
                coopBattleState: nextCoopBattleState,
                selectionState: nextSelection,
                turn: prev.turn + 1,
                activeEffects: [...prev.activeEffects, ...nextActiveEffects],
                combatLog: [...prev.combatLog, ...currentLogs].slice(-100)
            };
        });
        setTimeout(() => {
            setGameState(prev => ({ ...prev, activeEffects: [] }));
        }, 600);
    };

    const handleTimeUpdate = (newDailySeconds: number) => {
        setDailyPlaySeconds(newDailySeconds);
    };

    const handleParryClick = () => {
        setGameState(prev => ({
            ...prev,
            parryState: { ...prev.parryState!, success: true }
        }));
        audioService.playSound('block');
    };

    const executeEndTurn = async (enemyActionCountOverride?: number) => {
        if (isEndingTurnRef.current) return;
        isEndingTurnRef.current = true;

        const currentState = stateRef.current;
        if (currentState.enemies.length === 0) {
            isEndingTurnRef.current = false;
            if (currentState.challengeMode !== 'COOP') {
                startPlayerTurn();
            }
            return;
        }

        const pCurrent = stateRef.current.player;
        if (pCurrent.turnFlags['VAULT_EXTRA_TURN']) {
            setGameState(prev => ({
                ...prev,
                combatLog: [...prev.combatLog, trans("> 追加ターン獲得！敵の行動をスキップします", languageMode)].slice(-100)
            }));
            isEndingTurnRef.current = false;
            if (currentState.challengeMode !== 'COOP') {
                startPlayerTurn();
            }
            return;
        }
        audioService.playSound('select');
        setTurnLog(trans("敵のターン", languageMode));
        setLastActionType(null);
        setGameState(prev => {
            const p = { ...prev.player };
            const newLogs: string[] = [];
            if (hasRelic(p, 'POCKETWATCH')) {
                p.relicCounters['POCKETWATCH_PENDING'] = p.cardsPlayedThisTurn <= 3 ? 1 : 0;
            }
            const discardedCards = p.relics.find(r => r.id === 'BOOKMARK') ? p.hand.slice(1) : p.hand;
            discardedCards.forEach(c => {
                if (c.name === 'カンニングペーパー' || c.name === 'STRATEGIST') {
                    p.nextTurnEnergy += 2;
                }
            });
            if (hasRelic(p, 'ORICHALCUM') && p.block <= 0) {
                p.block = 6;
                newLogs.push("オリハルコン: ブロック+6");
            }
            if (p.powers['METALLICIZE']) {
                p.block += p.powers['METALLICIZE'];
                p.floatingText = { id: `pow-metal-${Date.now()}`, text: `+${p.powers['METALLICIZE']}`, color: 'text-blue-400', iconType: 'shield' };
            }
            if (p.powers['WEAK'] > 0) {
                p.powers['WEAK']--;
                if (p.powers['WEAK'] === 0) newLogs.push(trans("へろろから回復した", languageMode));
            }
            if (p.powers['VULNERABLE'] > 0) {
                p.powers['VULNERABLE']--;
                if (p.powers['VULNERABLE'] === 0) newLogs.push(trans("びくびくから回復した", languageMode));
            }
            if (p.powers['CONFUSED'] > 0) {
                p.powers['CONFUSED']--;
                if (p.powers['CONFUSED'] === 0) newLogs.push(trans("こんらんから回復した", languageMode));
            }
            return { ...prev, player: p, combatLog: [...prev.combatLog, ...newLogs].slice(-100) };
        });
        await wait(400);
        await new Promise<void>(resolve => {
                setGameState(prev => {
                    let nextEnemies = prev.enemies.map(e => ({ ...e }));
                    const p = { ...prev.player };
                    const nextActiveEffects: VisualEffectInstance[] = [];
                    const nextLogs: string[] = [];
                nextEnemies = nextEnemies.map(enemy => {
                    if (enemy.poison > 0) {
                        const poisonDmg = enemy.poison;
                        enemy.currentHp -= poisonDmg;
                        enemy.poison--;
                        enemy.floatingText = { id: `psn-${Date.now()}-${enemy.id}`, text: `${poisonDmg}`, color: 'text-green-500', iconType: 'poison' };
                        nextLogs.push(`${trans(enemy.name, languageMode)}に毒ダメージ${poisonDmg}`);
                        nextActiveEffects.push({ id: `vfx-psn-${Date.now()}-${enemy.id}`, type: 'FIRE', targetId: enemy.id });
                        if (enemy.currentHp <= 0 && enemy.enemyType === 'THE_HEART' && enemy.phase === 1) {
                            enemy.currentHp = enemy.maxHp;
                            enemy.phase = 2;
                            enemy.name = "真・校長先生";
                            enemy.poison = 0; enemy.weak = 0; enemy.vulnerable = 0;
                            enemy.floatingText = { id: `phase-evo-${Date.now()}`, text: '本気モード！', color: 'text-yellow-500' };
                            nextLogs.push("校長先生が真の姿を現した！");
                        }
                    }
                    return enemy;
                }).filter(e => e.currentHp > 0 || (e.enemyType === 'THE_HEART' && e.phase === 1));
                if (hasRelic(p, 'BIRD_FACED_URN')) {
                    const defeatedByPoison = prev.enemies.length - nextEnemies.length;
                    if (defeatedByPoison > 0) {
                        p.currentHp = Math.min(p.maxHp, p.currentHp + defeatedByPoison * 2);
                        nextLogs.push(`鳥の壺: HPを${defeatedByPoison * 2}回復`);
                    }
                }
                return {
                    ...prev,
                    player: p,
                    enemies: nextEnemies,
                    combatLog: [...prev.combatLog, ...nextLogs].slice(-100),
                    activeEffects: [...prev.activeEffects, ...nextActiveEffects]
                };
            });
            setTimeout(resolve, 600);
        });
        const livingEnemiesAtStart = stateRef.current.enemies.filter(enemy => enemy.currentHp > 0);
        let enemiesToAct = [...stateRef.current.enemies];
        if (enemyActionCountOverride !== undefined) {
            enemiesToAct = [];
            if (livingEnemiesAtStart.length > 0) {
                const startCursor = coopEnemyTurnCursorRef.current % livingEnemiesAtStart.length;
                for (let i = 0; i < enemyActionCountOverride; i++) {
                    enemiesToAct.push(livingEnemiesAtStart[(startCursor + i) % livingEnemiesAtStart.length]);
                }
                setCoopEnemyTurnCursor((startCursor + enemyActionCountOverride) % livingEnemiesAtStart.length);
            }
        }
        setGameState(prev => ({
            ...prev,
            enemies: prev.enemies.map(enemy =>
                (enemy.currentHp > 0 || (enemy.enemyType === 'THE_HEART' && enemy.phase === 1))
                    ? { ...enemy, block: 0 }
                    : enemy
            )
        }));
        for (const enemyTemplate of enemiesToAct) {
            if (stateRef.current.player.currentHp <= 0) break;
            const enemy = stateRef.current.enemies.find(e => e.id === enemyTemplate.id);
            if (!enemy || enemy.currentHp <= 0) continue;
            setActingEnemyId(enemy.id);
            const isBard = stateRef.current.player.id === 'BARD';
            const isAttackIntent =
                enemy.nextIntent.type === EnemyIntentType.ATTACK ||
                enemy.nextIntent.type === EnemyIntentType.ATTACK_DEBUFF ||
                enemy.nextIntent.type === EnemyIntentType.ATTACK_DEFEND;
            if (isBard && isAttackIntent) {
                setGameState(prev => ({
                    ...prev,
                    parryState: { active: true, enemyId: enemy.id, success: false }
                }));
                await wait(350);
            } else {
                await wait(300);
            }
            const parrySuccess = stateRef.current.parryState?.success || false;
            if (stateRef.current.parryState?.active) {
                setGameState(prev => ({ ...prev, parryState: { active: false, enemyId: null, success: false } }));
            }
            if (enemy.nextIntent.type === EnemyIntentType.ATTACK) audioService.playSound('attack');
            else if (enemy.nextIntent.type === EnemyIntentType.DEFEND) audioService.playSound('block');
            else audioService.playSound('select');
            await new Promise<void>(resolve => {
                setGameState(prev => {
                    const currentEnemyIndex = prev.enemies.findIndex(e => e.id === enemy.id);
                    if (currentEnemyIndex === -1) return prev;
                    const p = { ...prev.player };
                    const newEnemies = [...prev.enemies];
                    const e = { ...newEnemies[currentEnemyIndex] };
                    newEnemies[currentEnemyIndex] = e;
                    const newLogs: string[] = [];
                    const nextActiveEffects: VisualEffectInstance[] = [];
                    let nextCoopBattleState = prev.coopBattleState
                        ? {
                            ...prev.coopBattleState,
                            players: prev.coopBattleState.players.map(entry => ({
                                ...entry,
                                player: {
                                    ...entry.player,
                                    powers: { ...entry.player.powers },
                                    discardPile: [...entry.player.discardPile]
                                }
                            }))
                        }
                        : null;
                    const intent = e.nextIntent;
                    if (e.sleepTurns && e.sleepTurns > 0) {
                        const remainingSleep = e.sleepTurns - 1;
                        newLogs.push(`${trans(e.name, languageMode)}は眠っている...`);
                        e.sleepTurns = remainingSleep;
                        e.nextIntent = remainingSleep > 0
                            ? { type: EnemyIntentType.SLEEP, value: 0 }
                            : getNextEnemyIntent(e, prev.turn + 1);
                        return {
                            ...prev,
                            player: p,
                            enemies: newEnemies,
                            combatLog: [...prev.combatLog, ...newLogs].slice(-100),
                            activeEffects: [...prev.activeEffects, ...nextActiveEffects]
                        };
                    }
                    if (intent.type === EnemyIntentType.ATTACK || intent.type === EnemyIntentType.ATTACK_DEBUFF || intent.type === EnemyIntentType.ATTACK_DEFEND || intent.type === EnemyIntentType.PIERCE_ATTACK) {
                        let baseDamage = intent.value;
                        let logParts = [`${baseDamage}`];
                        if (e.strength !== 0) {
                            baseDamage += e.strength;
                            logParts.push(`${e.strength >= 0 ? '+' : ''}${e.strength}(${trans("筋力", languageMode)})`);
                        }
                        let damage = baseDamage;
                        if (e.weak > 0) {
                            damage = Math.floor(damage * 0.75);
                            logParts.push(`x0.75(${trans("へろへろ", languageMode)})`);
                        }
                        if (p.powers['VULNERABLE'] > 0) {
                            damage = Math.floor(damage * 1.5);
                            logParts.push(`x1.5(${trans("びくびく", languageMode)})`);
                        }
                        if (p.powers['INTANGIBLE'] > 0) {
                            damage = 1;
                            logParts.push(`= 1(${trans("スケスケ", languageMode)})`);
                        }
                        if (parrySuccess) {
                            const reflectedDmg = damage;
                            damage = 0;
                            e.currentHp -= reflectedDmg;
                            e.floatingText = { id: `refl-${Date.now()}`, text: `${reflectedDmg}`, color: 'text-cyan-400', iconType: 'zap' };
                            newLogs.push(trans("ナイス応答！音波を跳ね返した！", languageMode));
                            newLogs.push(`${trans(e.name, languageMode)}に${reflectedDmg}の反射ダメージ`);
                            audioService.playSound('buff');
                            nextActiveEffects.push({ id: `vfx-parry-${Date.now()}`, type: 'FIRE', targetId: e.id });
                        }
                        if (damage > 0) {
                            if (p.powers['BUFFER'] > 0) {
                                p.powers['BUFFER']--;
                                damage = 0;
                                newLogs.push(trans("バッファーでダメージ無効化", languageMode));
                                nextActiveEffects.push({ id: `vfx-buffer-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
                            } else {
                                if (p.powers['STATIC_DISCHARGE']) {
                                    const livingEnemies = newEnemies.filter(le => le.currentHp > 0);
                                    const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
                                    if (target) {
                                        target.currentHp -= p.powers['STATIC_DISCHARGE'];
                                        newLogs.push(trans("静電放電発動！", languageMode));
                                        nextActiveEffects.push({ id: `vfx-static-${Date.now()}`, type: 'FIRE', targetId: target.id });
                                    }
                                }
                            }
                        }
                        const isPierce = intent.type === EnemyIntentType.PIERCE_ATTACK;
                        const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                        const resolveDamageAgainstDefense = (
                            incomingDamage: number,
                            currentBlock: number,
                            currentBuffer: number
                        ): { unblockedDamage: number; nextBlock: number; nextBuffer: number; blocked: boolean } => {
                            if (incomingDamage <= 0) return { unblockedDamage: 0, nextBlock: currentBlock, nextBuffer: currentBuffer, blocked: false };
                            if (currentBuffer > 0) return { unblockedDamage: 0, nextBlock: currentBlock, nextBuffer: currentBuffer - 1, blocked: true };
                            if (isPierce) return { unblockedDamage: incomingDamage, nextBlock: currentBlock, nextBuffer: currentBuffer, blocked: false };
                            if (currentBlock >= incomingDamage) return { unblockedDamage: 0, nextBlock: currentBlock - incomingDamage, nextBuffer: currentBuffer, blocked: true };
                            return { unblockedDamage: incomingDamage - currentBlock, nextBlock: 0, nextBuffer: currentBuffer, blocked: currentBlock > 0 };
                        };

                        if (prev.challengeMode === 'COOP' && coopSession?.isHost && nextCoopBattleState) {
                            const aliveTargets = nextCoopBattleState.players.filter(entry => entry.player.currentHp > 0);
                            if (aliveTargets.length > 0) {
                                if (isPierce) {
                                    newLogs.push(`${trans(e.name, languageMode)}の防御貫通攻撃！ ${formula}${damage} ${trans("ダメージを受けた", languageMode)}（全員）`);
                                } else {
                                    newLogs.push(`${trans(e.name, languageMode)}の全体攻撃！ ${formula}${damage}`);
                                }
                            }
                            for (const targetEntry of aliveTargets) {
                                const isSelfTarget = targetEntry.peerId === coopSelfPeerId;
                                const targetName = targetEntry.name || coopSelfDisplayName;
                                if (isSelfTarget) {
                                    const resolved = resolveDamageAgainstDefense(damage, p.block, p.powers['BUFFER'] || 0);
                                    p.block = resolved.nextBlock;
                                    p.powers['BUFFER'] = resolved.nextBuffer;
                                    const unblockedDamage = resolved.unblockedDamage;
                                    if (!isPierce && unblockedDamage <= 0 && damage > 0) {
                                        newLogs.push(`${targetName}は${trans("ブロック", languageMode)}した！`);
                                        nextActiveEffects.push({ id: `vfx-eblk-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
                                    } else if (unblockedDamage > 0) {
                                        newLogs.push(`${targetName}が${unblockedDamage}ダメージを受けた！`);
                                        nextActiveEffects.push({ id: `vfx-eslash-${Date.now()}`, type: 'SLASH', targetId: 'player' });
                                    }
                                    if (isPierce && damage > 0) {
                                        nextActiveEffects.push({ id: `vfx-pierce-${Date.now()}`, type: 'CRITICAL', targetId: 'player' });
                                    }
                                    p.currentHp = Math.max(0, p.currentHp - unblockedDamage);
                                    p.hpLostThisTurn = (p.hpLostThisTurn || 0) + unblockedDamage;
                                    if (unblockedDamage > 0) p.floatingText = { id: `dmg-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                                    targetEntry.player.currentHp = p.currentHp;
                                    targetEntry.player.block = p.block;
                                    targetEntry.player.powers['BUFFER'] = p.powers['BUFFER'] || 0;
                                    targetEntry.player.hpLostThisTurn = p.hpLostThisTurn;
                                    targetEntry.player.floatingText = p.floatingText;
                                    targetEntry.isDown = p.currentHp <= 0;
                                    if (p.currentHp <= 0) newLogs.push(`${targetName}が倒れた...`);
                                } else {
                                    const targetPlayer = targetEntry.player;
                                    const resolved = resolveDamageAgainstDefense(damage, targetPlayer.block, targetPlayer.powers['BUFFER'] || 0);
                                    const unblockedDamage = resolved.unblockedDamage;
                                    const nextHp = Math.max(0, targetPlayer.currentHp - unblockedDamage);
                                    targetPlayer.currentHp = nextHp;
                                    targetPlayer.block = resolved.nextBlock;
                                    targetPlayer.powers['BUFFER'] = resolved.nextBuffer;
                                    targetPlayer.hpLostThisTurn = (targetPlayer.hpLostThisTurn || 0) + unblockedDamage;
                                    targetPlayer.floatingText = unblockedDamage > 0
                                        ? { id: `coop-dmg-${Date.now()}-${targetEntry.peerId}`, text: `-${unblockedDamage}`, color: 'text-red-500' }
                                        : targetPlayer.floatingText;
                                    targetEntry.isDown = nextHp <= 0;
                                    updateCoopParticipantState(targetEntry.peerId, current => ({
                                        ...current,
                                        currentHp: nextHp,
                                        block: resolved.nextBlock,
                                        buffer: resolved.nextBuffer
                                    }));
                                    if (!isPierce && unblockedDamage <= 0 && damage > 0) {
                                        newLogs.push(`${targetName}は${trans("ブロック", languageMode)}した！`);
                                    } else if (unblockedDamage > 0) {
                                        newLogs.push(`${targetName}が${unblockedDamage}ダメージを受けた！`);
                                    }
                                    if (nextHp <= 0) newLogs.push(`${targetName}が倒れた...`);
                                }
                            }
                        } else if (p.partner && p.partner.currentHp > 0) {
                            const resolved = resolveDamageAgainstDefense(damage, p.block, p.powers['BUFFER'] || 0);
                            p.block = resolved.nextBlock;
                            p.powers['BUFFER'] = resolved.nextBuffer;
                            const unblockedDamage = resolved.unblockedDamage;
                            if (isPierce) {
                                newLogs.push(`${trans(e.name, languageMode)}の防御貫通攻撃！ ${formula}${damage} ${trans("ダメージを受けた", languageMode)}`);
                                nextActiveEffects.push({ id: `vfx-pierce-${Date.now()}`, type: 'CRITICAL', targetId: 'player' });
                            } else if (unblockedDamage <= 0 && damage > 0) {
                                newLogs.push(`${trans(e.name, languageMode)}の攻撃 ${formula}${damage} を${trans("ブロック", languageMode)}`);
                                nextActiveEffects.push({ id: `vfx-eblk-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
                            } else if (unblockedDamage > 0) {
                                newLogs.push(`${trans(e.name, languageMode)}から ${formula}${damage} ${trans("ダメージを受けた", languageMode)}`);
                                nextActiveEffects.push({ id: `vfx-eslash-${Date.now()}`, type: 'SLASH', targetId: 'player' });
                            }
                            if (unblockedDamage > 0 && Math.random() < 0.5) {
                                p.partner.currentHp = Math.max(0, p.partner.currentHp - unblockedDamage);
                                p.partner.floatingText = { id: `dmg-partner-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                                newLogs.push(`${p.partner.name}がダメージを受けた！`);
                                if (p.partner.currentHp <= 0) {
                                    newLogs.push(`${p.partner.name}が倒れた...`);
                                    p.partner = undefined;
                                }
                            } else {
                                p.currentHp = Math.max(0, p.currentHp - unblockedDamage);
                                p.hpLostThisTurn = (p.hpLostThisTurn || 0) + unblockedDamage;
                                if (unblockedDamage > 0) p.floatingText = { id: `dmg-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                            }
                        } else {
                            const resolved = resolveDamageAgainstDefense(damage, p.block, p.powers['BUFFER'] || 0);
                            p.block = resolved.nextBlock;
                            p.powers['BUFFER'] = resolved.nextBuffer;
                            const unblockedDamage = resolved.unblockedDamage;
                            if (isPierce) {
                                newLogs.push(`${trans(e.name, languageMode)}の防御貫通攻撃！ ${formula}${damage} ${trans("ダメージを受けた", languageMode)}`);
                                nextActiveEffects.push({ id: `vfx-pierce-${Date.now()}`, type: 'CRITICAL', targetId: 'player' });
                            } else if (unblockedDamage <= 0 && damage > 0) {
                                newLogs.push(`${trans(e.name, languageMode)}の攻撃 ${formula}${damage} を${trans("ブロック", languageMode)}`);
                                nextActiveEffects.push({ id: `vfx-eblk-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
                            } else if (unblockedDamage > 0) {
                                newLogs.push(`${trans(e.name, languageMode)}から ${formula}${damage} ${trans("ダメージを受けた", languageMode)}`);
                                nextActiveEffects.push({ id: `vfx-eslash-${Date.now()}`, type: 'SLASH', targetId: 'player' });
                            }
                            p.currentHp = Math.max(0, p.currentHp - unblockedDamage);
                            p.hpLostThisTurn = (p.hpLostThisTurn || 0) + unblockedDamage;
                            if (unblockedDamage > 0) p.floatingText = { id: `dmg-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                        }
                        if (p.powers['THORNS'] && damage > 0) {
                            e.currentHp -= p.powers['THORNS'];
                            e.floatingText = { id: `thorns-${Date.now()}`, text: `${p.powers['THORNS']}`, color: 'text-orange-500', iconType: 'sword' };
                            newLogs.push(`${trans("トゲトゲ", languageMode)}で${p.powers['THORNS']}反撃ダメージ`);
                            nextActiveEffects.push({ id: `vfx-thn-${Date.now()}`, type: 'SLASH', targetId: e.id });
                        }
                        if (e.currentHp <= 0 && e.enemyType === 'THE_HEART' && e.phase === 1) {
                            e.currentHp = e.maxHp;
                            e.phase = 2;
                            e.name = "真・校長先生";
                            enemy.poison = 0; enemy.weak = 0; enemy.vulnerable = 0;
                            enemy.floatingText = { id: `phase-evo-${Date.now()}`, text: '本気モード！', color: 'text-yellow-500' };
                            newLogs.push("校長先生が真の姿を現した！");
                            nextActiveEffects.push({ id: `vfx-evo2-${Date.now()}`, type: 'BUFF', targetId: e.id });
                        }
                    }
                    if (intent.type === EnemyIntentType.DEFEND || intent.type === EnemyIntentType.ATTACK_DEFEND) {
                        e.block += intent.value;
                        if (intent.type === EnemyIntentType.ATTACK_DEFEND && intent.secondaryValue) e.block = intent.secondaryValue;
                        newLogs.push(`${trans(e.name, languageMode)}は防御を固めた (ブロック${e.block})`);
                        nextActiveEffects.push({ id: `vfx-eblk-self-${Date.now()}`, type: 'BLOCK', targetId: e.id });
                    }
                    if (intent.type === EnemyIntentType.BUFF) {
                        e.strength += (intent.secondaryValue || 2);
                        newLogs.push(`${trans(e.name, languageMode)}は力を溜めた (ムキムキ+${intent.secondaryValue || 2})`);
                        nextActiveEffects.push({ id: `vfx-ebuff-${Date.now()}`, type: 'BUFF', targetId: e.id });
                    }
                    if (intent.type === EnemyIntentType.DEBUFF || intent.type === EnemyIntentType.ATTACK_DEBUFF) {
                        const debuffAmt = intent.secondaryValue || 1;
                        const type = intent.debuffType;
                        const applyDebuff = (target: Player, targetName: string) => {
                            if (target.powers['ARTIFACT'] > 0) {
                                target.powers['ARTIFACT']--;
                                newLogs.push(`${targetName}は${trans("アーティファクトでデバフを防いだ", languageMode)}`);
                                return;
                            }
                            if (type === 'WEAK') {
                                target.powers['WEAK'] = (target.powers['WEAK'] || 0) + debuffAmt;
                                newLogs.push(`${targetName}は${trans("へろへろ", languageMode)}${debuffAmt}`);
                            }
                            if (type === 'VULNERABLE') {
                                target.powers['VULNERABLE'] = (target.powers['VULNERABLE'] || 0) + debuffAmt;
                                newLogs.push(`${targetName}は${trans("びくびく", languageMode)}${debuffAmt}`);
                            }
                            if (type === 'CONFUSED') {
                                target.powers['CONFUSED'] = (target.powers['CONFUSED'] || 0) + debuffAmt;
                                newLogs.push(`${targetName}は${trans("混乱", languageMode)}${debuffAmt}`);
                            }
                            if (type === 'POISON') {
                                const status = { ...STATUS_CARDS.SLIMED, id: `slime-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
                                target.discardPile.push(status);
                                newLogs.push(`${targetName}に${trans("粘液を混ぜられた", languageMode)}`);
                            }
                        };
                        if (prev.challengeMode === 'COOP' && coopSession?.isHost && nextCoopBattleState) {
                            nextCoopBattleState.players
                                .filter(entry => entry.player.currentHp > 0)
                                .forEach(entry => {
                                    const isSelfTarget = entry.peerId === coopSelfPeerId;
                                    const targetName = entry.name || coopSelfDisplayName;
                                    const targetPlayer = isSelfTarget ? p : entry.player;
                                    applyDebuff(targetPlayer, targetName);
                                    entry.isDown = targetPlayer.currentHp <= 0;
                                });
                        } else {
                            applyDebuff(p, trans("あなた", languageMode));
                            nextActiveEffects.push({ id: `vfx-edbuff-${Date.now()}`, type: 'DEBUFF', targetId: 'player' });
                        }
                    }
                    e.nextIntent = getNextEnemyIntent(e, prev.turn + 1);
                    const aliveEnemies = newEnemies.filter(en => en.currentHp > 0 || (en.enemyType === 'THE_HEART' && en.phase === 1));
                    if (hasRelic(p, 'BIRD_FACED_URN')) {
                        const defeatedNow = newEnemies.length - aliveEnemies.length;
                        if (defeatedNow > 0) {
                            p.currentHp = Math.min(p.maxHp, p.currentHp + defeatedNow * 2);
                            newLogs.push(`鳥の壺: HPを${defeatedNow * 2}回復`);
                        }
                    }
                    syncRedSkullState(p);
                    return {
                        ...prev,
                        player: p,
                        enemies: aliveEnemies,
                        coopBattleState: nextCoopBattleState,
                        combatLog: [...prev.combatLog, ...newLogs].slice(-100),
                        activeEffects: [...prev.activeEffects, ...nextActiveEffects]
                    };
                });
                setTimeout(resolve, 500);
            });
            await wait(100);
        }
        setGameState(prev => ({
            ...prev,
            enemies: prev.enemies.map(enemy => {
                if (enemy.currentHp <= 0 && !(enemy.enemyType === 'THE_HEART' && enemy.phase === 1)) return enemy;
                const nextEnemy = { ...enemy };
                if (nextEnemy.vulnerable > 0) nextEnemy.vulnerable--;
                if (nextEnemy.weak > 0) nextEnemy.weak--;
                return nextEnemy;
            })
        }));
        setActingEnemyId(null);
        setGameState(prev => {
            const p = { ...prev.player };
            const newLogs: string[] = [];
            const nextActiveEffects: VisualEffectInstance[] = [];
            if (p.powers['REGEN'] > 0) {
                const heal = p.powers['REGEN'];
                p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                p.powers['REGEN']--;
                p.floatingText = { id: `pow-regen-${Date.now()}`, text: `+${heal}`, color: 'text-green-500', iconType: 'heart' };
                newLogs.push(`再生で${heal}回復`);
                nextActiveEffects.push({ id: `vfx-regen-${Date.now()}`, type: 'HEAL', targetId: 'player' });
            }
            if (p.powers['INTANGIBLE'] > 0) p.powers['INTANGIBLE']--;
            if (p.powers['STRENGTH_DOWN']) {
                p.strength -= p.powers['STRENGTH_DOWN'];
                delete p.powers['STRENGTH_DOWN'];
            }
            if (p.powers['LOSE_STRENGTH'] > 0) {
                const loss = p.powers['LOSE_STRENGTH'];
                p.strength -= loss;
                p.floatingText = { id: `lose-str-${Date.now()}`, text: `-${loss} STR`, color: 'text-red-400', iconType: 'sword' };
                newLogs.push("反動で筋力が戻った");
                delete p.powers['LOSE_STRENGTH'];
                nextActiveEffects.push({ id: `vfx-lose-str-${Date.now()}`, type: 'DEBUFF', targetId: 'player' });
            }
            p.hand.forEach(c => {
                if (c.name === 'やけど' || c.name === 'やほど' || c.name === 'BURN') { p.currentHp -= 2; newLogs.push("やけどダメージ"); nextActiveEffects.push({ id: `vfx-burn-${Date.now()}`, type: 'FIRE', targetId: 'player' }); }
                if (c.name === '虫歯' || c.name === 'DECAY') { p.currentHp -= 2; newLogs.push("虫歯ダメージ"); nextActiveEffects.push({ id: `vfx-decay-${Date.now()}`, type: 'DEBUFF', targetId: 'player' }); }
                if (c.name === '不安' || c.name === 'DOUBT') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + 1;
                if (c.name === '恥' || c.name === 'SHAME') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + 1;
                if (c.name === '後悔' || c.name === 'REGRET') { p.currentHp -= p.hand.length; newLogs.push("後悔ダメージ"); nextActiveEffects.push({ id: `vfx-reg-${Date.now()}`, type: 'SLASH', targetId: 'player' }); }
            });
            syncRedSkullState(p);
            return { ...prev, player: p, combatLog: [...prev.combatLog, ...newLogs].slice(-100), activeEffects: [...prev.activeEffects, ...nextActiveEffects] };
        });
        setTimeout(() => {
            setGameState(prev => ({ ...prev, activeEffects: [] }));
        }, 600);
        if (stateRef.current.challengeMode !== 'COOP') {
            startPlayerTurn();
        } else {
            isEndingTurnRef.current = false;
        }
    };

    const resolveCoopAllySupport = useCallback(async (slot: CoopBattleTurnSlot) => {
        if (slot.type !== 'ALLY') return;
        const participant = slot.peerId ? coopSession?.participants.find(entry => entry.peerId === slot.peerId) : undefined;
        if (!participant || (participant.currentHp ?? participant.maxHp ?? 0) <= 0) return;
        setTurnLog(`${slot.label} の支援`);
        audioService.playSound('buff');
        setGameState(prev => {
            const p = { ...prev.player };
            const nextEnemies = prev.enemies.map(enemy => ({ ...enemy }));
            const nextActiveEffects: VisualEffectInstance[] = [];
            const nextLogs = [...prev.combatLog];
            const playerNeedsHeal = p.currentHp < p.maxHp * 0.7;
            const roll = Math.random();
            const supportBoost = Math.max(0, participant.nextTurnEnergy ?? 0);
            const strengthBonus = Math.max(0, participant.strength ?? 0);

            if (playerNeedsHeal && roll < 0.45) {
                const heal = 6 + supportBoost * 3;
                p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                p.floatingText = { id: `coop-heal-${Date.now()}-${slot.id}`, text: `+${heal}`, color: 'text-green-400', iconType: 'heart' };
                nextActiveEffects.push({ id: `coop-vfx-heal-${Date.now()}-${slot.id}`, type: 'HEAL', targetId: 'player' });
                nextLogs.push(`${slot.label} が回復で支援した`);
            } else if (roll < 0.8) {
                const block = 8 + supportBoost * 4;
                p.block += block;
                p.floatingText = { id: `coop-block-${Date.now()}-${slot.id}`, text: `+${block}`, color: 'text-blue-300', iconType: 'shield' };
                nextActiveEffects.push({ id: `coop-vfx-block-${Date.now()}-${slot.id}`, type: 'BLOCK', targetId: 'player' });
                nextLogs.push(`${slot.label} が防御で支援した`);
            } else if (nextEnemies.length > 0) {
                const targetIndex = Math.floor(Math.random() * nextEnemies.length);
                const target = nextEnemies[targetIndex];
                const damage = 5 + supportBoost * 2 + strengthBonus;
                target.currentHp -= damage;
                target.floatingText = { id: `coop-dmg-${Date.now()}-${slot.id}`, text: `${damage}`, color: 'text-emerald-300', iconType: 'sword' };
                nextActiveEffects.push({ id: `coop-vfx-dmg-${Date.now()}-${slot.id}`, type: 'SLASH', targetId: target.id });
                nextLogs.push(`${slot.label} が ${trans(target.name, languageMode)} を援護攻撃した`);
            }

            return {
                ...prev,
                player: p,
                enemies: nextEnemies.filter(enemy => enemy.currentHp > 0 || (enemy.enemyType === 'THE_HEART' && enemy.phase === 1)),
                combatLog: nextLogs.slice(-100),
                activeEffects: [...prev.activeEffects, ...nextActiveEffects]
            };
        });

        if (slot.peerId) {
            updateCoopParticipantState(slot.peerId, participant => ({
                ...participant,
                nextTurnEnergy: 0,
                floatingText: { id: `coop-support-${Date.now()}-${slot.peerId}`, text: '援護', color: 'text-emerald-300' }
            }));
            window.setTimeout(() => {
                updateCoopParticipantState(slot.peerId!, participant => ({ ...participant, floatingText: null }));
            }, 650);
        }
        await wait(350);
    }, [coopSession, languageMode, updateCoopParticipantState]);

    const executeQueuedTurnTransition = useCallback(async () => {
        if (gameState.challengeMode === 'COOP' && coopBattleState) {
            await executeEndTurn(coopBattlePlan.enemyActions);
            if (coopSession?.isHost) {
                const latestBattleState = stateRef.current.coopBattleState || coopBattleState;
                const nextCursor = coopBattlePlan.nextCursor;
                const nextSlot = latestBattleState.turnQueue[nextCursor];
                const nextBattleState: CoopBattleState = {
                    ...latestBattleState,
                    turnCursor: nextCursor,
                    enemyTurnCursor: latestBattleState.enemyTurnCursor + coopBattlePlan.enemyActions,
                    roundEndedPeerIds: nextSlot?.type === 'ENEMY' ? (latestBattleState.roundEndedPeerIds || []) : []
                };
                setCoopBattleState(nextBattleState);
                broadcastCoopBattleState(nextBattleState);
            }
            return;
        }
        await executeEndTurn();
    }, [broadcastCoopBattleState, coopBattlePlan.enemyActions, coopBattlePlan.nextCursor, coopBattleState, coopSession, gameState.challengeMode, setCoopBattleState]);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.BATTLE || !coopBattleState || !activeCoopTurnSlot) return;
        const turnKey = `${coopBattleState.battleKey}:${coopBattleState.turnCursor}:${coopBattleState.enemyTurnCursor}:${activeCoopTurnSlot.id}`;
        if (activeCoopTurnSlot.type === 'ENEMY') {
            if (!coopSession?.isHost || coopStartedTurnSlotRef.current === turnKey) return;
            coopStartedTurnSlotRef.current = turnKey;
            window.setTimeout(() => {
                void executeQueuedTurnTransition();
            }, 0);
            return;
        }
        if (coopBattleState.battleMode !== 'REALTIME' && activeCoopTurnSlot.peerId !== coopSelfPeerId) return;
        if (coopStartedTurnSlotRef.current === turnKey) return;
        if (gameState.turn === 1 && gameState.player.hand.length > 0 && coopStartedTurnSlotRef.current === null) {
            coopStartedTurnSlotRef.current = turnKey;
            return;
        }
        coopStartedTurnSlotRef.current = turnKey;
        startPlayerTurn();
    }, [activeCoopTurnSlot, coopBattleState, coopSelfPeerId, coopSession, executeQueuedTurnTransition, gameState.challengeMode, gameState.player.hand.length, gameState.screen, gameState.turn]);

    const handleEndTurnClick = () => {
        if (isEndingTurnRef.current) return;
        if (weatherScryModal || galaxyExpressModal || goldFishModal || dreamCatcherModal) return;
        lastPlayedCardRef.current = null;
        const isRealtimeCoopTurn = gameState.challengeMode === 'COOP'
            && gameState.coopBattleState?.battleMode === 'REALTIME'
            && gameState.coopBattleState.turnQueue[gameState.coopBattleState.turnCursor]?.type !== 'ENEMY';
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({
                type: 'COOP_END_TURN',
                player: gameState.player,
                selectedEnemyId: gameState.selectedEnemyId,
                battleState: gameState.coopBattleState || null
            });
            return;
        }
        if (isRealtimeCoopTurn && coopSession?.isHost && coopSelfPeerId && gameState.coopBattleState) {
            const alreadyEnded = (gameState.coopBattleState.roundEndedPeerIds || []).includes(coopSelfPeerId);
            if (!alreadyEnded) {
                const nextEnded = [...(gameState.coopBattleState.roundEndedPeerIds || []), coopSelfPeerId];
                const nextBattleState: CoopBattleState = { ...gameState.coopBattleState, roundEndedPeerIds: nextEnded };
                setCoopBattleState(nextBattleState);
                const alivePeerIds = nextBattleState.players.filter(entry => entry.player.currentHp > 0).map(entry => entry.peerId);
                const allEnded = alivePeerIds.every(peerId => nextEnded.includes(peerId));
                if (allEnded) {
                    window.setTimeout(() => {
                        void executeQueuedTurnTransition();
                    }, 0);
                } else {
                    broadcastCoopBattleState(nextBattleState);
                }
            }
            return;
        }

        if (gameState.player.relics.find(r => r.id === 'NILRYS_CODEX')) {
            const pool = getFilteredCardPool(gameState.player.id);
            const options = [];
            const ts = Date.now();
            for (let i = 0; i < 3; i++) {
                options.push({ ...pool[Math.floor(Math.random() * pool.length)], id: `codex-${ts}-${i}` });
            }
            setGameState(prev => ({ ...prev, codexOptions: options }));
        } else {
            executeQueuedTurnTransition();
        }
    }

    useEffect(() => {
        if (gameState.screen !== GameScreen.BATTLE) return;
        if (weatherScryModal || galaxyExpressModal || goldFishModal || dreamCatcherModal) return;
        if (!gameState.player.turnFlags['WEATHER_PENDING_MODAL']) return;

        const cards = [...gameState.player.drawPile].slice(-3).reverse();
        const keepMap: Record<string, boolean> = {};
        cards.forEach(c => { keepMap[c.id] = true; });
        setWeatherScryModal({ cards, keepMap });

        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                turnFlags: { ...prev.player.turnFlags, WEATHER_PENDING_MODAL: false }
            }
        }));
    }, [dreamCatcherModal, galaxyExpressModal, gameState.player.drawPile, gameState.player.turnFlags, gameState.screen, goldFishModal, weatherScryModal]);

    useEffect(() => {
        if (gameState.screen !== GameScreen.BATTLE) return;
        if (weatherScryModal || galaxyExpressModal || goldFishModal || dreamCatcherModal) return;
        if (!gameState.player.turnFlags['GALAXY_PENDING_MODAL']) return;

        const cards = [...gameState.player.drawPile].slice(-5).reverse();
        if (cards.length > 0) {
            setGalaxyExpressModal({ cards });
        }
        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                turnFlags: { ...prev.player.turnFlags, GALAXY_PENDING_MODAL: false }
            }
        }));
    }, [dreamCatcherModal, galaxyExpressModal, gameState.player.drawPile, gameState.player.turnFlags, gameState.screen, goldFishModal, weatherScryModal]);

    useEffect(() => {
        if (gameState.screen !== GameScreen.BATTLE) return;
        if (weatherScryModal || galaxyExpressModal || goldFishModal || dreamCatcherModal) return;
        if (!gameState.player.turnFlags['GOLD_FISH_PENDING_MODAL']) return;

        const cards = [...gameState.player.hand].filter(c => c.type === CardType.ATTACK && c.type !== CardType.STATUS && c.type !== CardType.CURSE);
        if (cards.length > 0) {
            setGoldFishModal({
                title: '金魚すくい',
                description: '戦闘中強化するアタックを1枚選んでください',
                cards
            });
        }
        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                turnFlags: { ...prev.player.turnFlags, GOLD_FISH_PENDING_MODAL: false }
            }
        }));
    }, [dreamCatcherModal, galaxyExpressModal, gameState.player.hand, gameState.player.turnFlags, gameState.screen, goldFishModal, weatherScryModal]);

    useEffect(() => {
        if (gameState.screen !== GameScreen.BATTLE) return;
        if (!gameState.player.relicCounters['OUT_SUPER_HERO_POSE_ACTIVE']) return;

        const battleText = 'この戦闘中: 使用後に1枚引く。';
        const applyAttackText = (zoneCard: ICard) => {
            if (zoneCard.type !== CardType.ATTACK) return zoneCard;
            return appendBattleOnlyText({
                ...zoneCard,
                battleBonusDrawOnPlay: Math.max(zoneCard.battleBonusDrawOnPlay || 0, 1)
            }, battleText);
        };

        const hasMissingText = [...gameState.player.hand, ...gameState.player.drawPile, ...gameState.player.discardPile]
            .some(c => c.type === CardType.ATTACK && (!c.battleBonusDrawOnPlay || !c.description.includes(battleText)));
        if (!hasMissingText) return;

        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                deck: prev.player.deck.map(applyAttackText),
                hand: prev.player.hand.map(applyAttackText),
                drawPile: prev.player.drawPile.map(applyAttackText),
                discardPile: prev.player.discardPile.map(applyAttackText)
            }
        }));
    }, [gameState.player.deck, gameState.player.discardPile, gameState.player.drawPile, gameState.player.hand, gameState.player.relicCounters, gameState.screen]);

    useEffect(() => {
        if (gameState.screen !== GameScreen.BATTLE) return;
        if (weatherScryModal || galaxyExpressModal || goldFishModal || dreamCatcherModal) return;
        if (!gameState.player.turnFlags['DREAM_CATCHER_PENDING_MODAL']) return;

        const cards = [...gameState.player.drawPile].slice().reverse();
        if (cards.length > 0) {
            setDreamCatcherModal({
                title: 'ドリーム・キャッチャー',
                description: '山札から手札に加えるカードを1枚選んでください',
                cards
            });
        }
        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                turnFlags: { ...prev.player.turnFlags, DREAM_CATCHER_PENDING_MODAL: false }
            }
        }));
    }, [dreamCatcherModal, galaxyExpressModal, gameState.player.drawPile, gameState.player.turnFlags, gameState.screen, goldFishModal, weatherScryModal]);

    const onCodexSelect = (card: ICard | null) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost && gameState.screen === GameScreen.BATTLE) {
            queueCoopBattleEvent({ type: 'COOP_BATTLE_TURN_START' });
        }
        setGameState(prev => {
            const nextPlayer = { ...prev.player };
            if (card) {
                const bufferedCard = { ...card, id: `codex-hand-${Date.now()}-${Math.random()}` };
                nextPlayer.codexBuffer = [bufferedCard];
            }
            return {
                ...prev,
                player: nextPlayer,
                codexOptions: undefined
            };
        });
        setTimeout(() => {
            executeQueuedTurnTransition();
        }, 50);
    }

    const applySynthesizeCard = (cards: ICard[]) => {
        const [c1, c2, c3] = cards;
        const newCard = synthesizeCards(c1, c2, c3);
        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                deck: [...prev.player.deck.filter(c => !cards.some(target => target.id === c.id)), newCard]
            }
        }));
        return newCard;
    };

    const handleSynthesizeCard = (cards: ICard[]) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_REST_ACTION', action: 'SYNTHESIZE', cardIds: cards.map(card => card.id) });
            return applySynthesizeCard(cards);
        }
        return applySynthesizeCard(cards);
    };

    const handlePlaySynthesizedCard = async (card: ICard) => {
        handlePlayCard(card);
    };

    const handleTypingAutoPlayCard = (card: ICard) => {
        handlePlayCard({ ...card, cost: 0, unplayable: false });
    };

    useEffect(() => {
        if (gameState.screen !== GameScreen.BATTLE) return;
        if (gameState.challengeMode !== 'TYPING') return;
        if (!gameState.selectionState.active) return;
        if (actingEnemyId) return;

        const timer = window.setTimeout(() => {
            const current = stateRef.current;
            if (current.screen !== GameScreen.BATTLE || current.challengeMode !== 'TYPING') return;
            if (!current.selectionState.active) return;

            const nextCard = current.player.hand[0];
            const { selectionState } = current;

            if (selectionState.type === 'DISCARD') {
                if (!selectionState.originCardId || !nextCard) {
                    handleCancelSelection();
                    return;
                }
                handleHandSelection(nextCard);
                return;
            }

            if ((selectionState.type === 'COPY' || selectionState.type === 'EXHAUST') && nextCard) {
                handleHandSelection(nextCard);
                return;
            }

            handleCancelSelection();
        }, 180);

        return () => window.clearTimeout(timer);
    }, [
        actingEnemyId,
        gameState.challengeMode,
        gameState.player.hand.length,
        gameState.screen,
        gameState.selectionState.active,
        gameState.selectionState.amount,
        gameState.selectionState.originCardId,
        gameState.selectionState.type,
    ]);

    const resolveCoopEventOptionForPlayer = useCallback((basePlayer: Player, optionIndex: number, onResolved: (player: Player, resultLog: string | null) => void) => {
        if (!eventData) return;

        let simulatedState: GameState = { ...gameState, player: { ...basePlayer } };
        let nextPlayer: Player = simulatedState.player;
        let nextResultLog: string | null = null;

        const fakeSetGameState: React.Dispatch<React.SetStateAction<GameState>> = (updater) => {
            const updatedState = typeof updater === 'function' ? updater(simulatedState) : updater;
            simulatedState = {
                ...simulatedState,
                ...updatedState,
                player: updatedState.player ?? simulatedState.player
            };
            nextPlayer = simulatedState.player;
        };

        const fakeSetEventResultLog = (log: string | null) => {
            nextResultLog = log;
        };

        let regeneratedEvent = null as ReturnType<typeof generateEvent> | ReturnType<typeof generateLegacyEvent> | null;
        if (eventData.title === '忘れ物') {
            const legacyCard = storageService.getLegacyCard();
            if (legacyCard) {
                regeneratedEvent = generateLegacyEvent(
                    legacyCard,
                    fakeSetGameState,
                    fakeSetEventResultLog,
                    languageMode
                );
            }
        }
        if (!regeneratedEvent) {
            regeneratedEvent = generateEvent(
                basePlayer,
                fakeSetGameState,
                () => { },
                fakeSetEventResultLog,
                languageMode,
                unlockedCardNames,
                eventData.title
            );
        }

        const option = regeneratedEvent.options[optionIndex];
        if (!option) return;
        option.action();
        window.setTimeout(() => onResolved(nextPlayer, nextResultLog), 90);
    }, [eventData, gameState, languageMode, unlockedCardNames]);

    const handleEventComplete = useCallback(() => {
        if (gameState.challengeMode === 'COOP' && coopSession && coopSelfPeerId) {
            setCoopSession(prev => {
                if (!prev) return prev;
                const nextParticipants = prev.participants.map(participant =>
                    participant.peerId === coopSelfPeerId ? { ...participant, eventResolved: true } : participant
                );
                if (prev.isHost) {
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                } else {
                    p2pService.send({ type: 'COOP_SELF_STATE', eventResolved: true });
                }
                return { ...prev, participants: nextParticipants };
            });
            return;
        }
        handleNodeComplete();
    }, [coopSelfPeerId, coopSession, gameState.challengeMode, handleNodeComplete]);

    const handleCoopEventOptionSelect = useCallback((optionIndex: number) => {
        if (gameState.challengeMode === 'COOP' && coopSession && coopSelfPeerId) {
            if (!coopSession.isHost) {
                p2pService.send({ type: 'COOP_EVENT_OPTION', optionIndex });
                return;
            }
            resolveCoopEventOptionForPlayer(gameState.player, optionIndex, (nextPlayer, resultLog) => {
                applyCoopPlayerStateToPeer(coopSelfPeerId, nextPlayer);
                setEventResultLog(resultLog);
            });
            return;
        }
        eventData?.options?.[optionIndex]?.action?.();
    }, [applyCoopPlayerStateToPeer, coopSelfPeerId, coopSession, eventData, gameState.challengeMode, gameState.player, resolveCoopEventOptionForPlayer]);

    const handleLegacyCardSelect = (card: ICard) => {
        storageService.saveLegacyCard(card);
        setLegacyCardSelected(true);
    };

    const handleRetry = () => {
        setLegacyCardSelected(false);
        if (gameState.challengeMode === 'TYPING') {
            startTypingGame();
            return;
        }
        if (gameState.challengeMode === 'RACE') {
            audioService.playSound('select');
            setIsLoading(false);
            setRaceEffects(EMPTY_RACE_EFFECTS);
            setRaceRewardDummyDisplay(0);
            setGameState(prev => ({
                screen: GameScreen.CHARACTER_SELECTION,
                mode: prev.mode,
                modePool: prev.modePool,
                challengeMode: prev.challengeMode,
                act: 1,
                floor: 0,
                turn: 0,
                map: [],
                currentMapNodeId: null,
                player: {
                    maxHp: INITIAL_HP,
                    currentHp: INITIAL_HP,
                    maxEnergy: INITIAL_ENERGY,
                    currentEnergy: INITIAL_ENERGY,
                    block: 0,
                    strength: 0,
                    gold: 99,
                    deck: createDeck(),
                    hand: [],
                    discardPile: [],
                    drawPile: [],
                    relics: [],
                    potions: [],
                    powers: {},
                    echoes: 0,
                    cardsPlayedThisTurn: 0,
                    attacksPlayedThisTurn: 0,
                    typesPlayedThisTurn: [],
                    relicCounters: {},
                    turnFlags: {},
                    imageData: HERO_IMAGE_DATA,
                    floatingText: null,
                    nextTurnEnergy: 0,
                    nextTurnDraw: 0,
                    codexBuffer: []
                },
                enemies: [],
                selectedEnemyId: null,
                narrativeLog: [trans("レース再挑戦！", languageMode)],
                combatLog: [],
                rewards: [],
                selectionState: { active: false, type: 'DISCARD', amount: 0 },
                isEndless: false,
                parryState: { active: false, enemyId: null, success: false },
                activeEffects: [],
                currentStoryIndex: Math.floor(Math.random() * GAME_STORIES.length),
                actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
            }));
            return;
        }
        startGame();
    };

    const handleFinalBridgeComplete = (upgradeType: 'HEAL' | 'APOTHEOSIS' | 'STRENGTH') => {
        setGameState(prev => {
            const p = { ...prev.player };
            let newDeck = [...p.deck];
            let newPowers = { ...p.powers };
            let newStrength = p.strength;
            let newMaxHp = p.maxHp;
            let newCurrentHp = p.maxHp;
            if (upgradeType === 'HEAL') {
                newMaxHp += 10;
                newCurrentHp = newMaxHp;
            } else if (upgradeType === 'APOTHEOSIS') {
                newDeck = newDeck.map(c => getUpgradedCard(c));
            } else if (upgradeType === 'STRENGTH') {
                p.relicCounters['FINAL_BUFF_STRENGTH'] = 3;
            }
            const bossNode: MapNode = { id: 'true-boss-node', x: 3, y: 0, type: NodeType.BOSS, nextNodes: [], completed: false };
            return {
                ...prev,
                act: 4,
                floor: 1,
                map: [bossNode],
                currentMapNodeId: null,
                screen: GameScreen.MAP,
                player: {
                    ...p,
                    deck: newDeck,
                    maxHp: newMaxHp,
                    currentHp: newCurrentHp,
                    powers: newPowers,
                    strength: newStrength
                }
            };
        });
        audioService.playBGM('map');
    };

    const handlePlantSeed = (slotIdx: number, card: ICard) => {
        setGameState(prev => {
            const p = { ...prev.player };
            const garden = [...(p.garden || [])];
            garden[slotIdx] = {
                plantedCard: card,
                growth: 0,
                maxGrowth: card.growthRequired || 1
            };
            const newDeck = p.deck.filter(c => c.id !== card.id);
            return { ...prev, player: { ...p, garden, deck: newDeck } };
        });
    };

    const handleHarvestPlant = (slotIdx: number) => {
        setGameState(prev => {
            const p = { ...prev.player };
            const garden = [...(p.garden || [])];
            const slot = garden[slotIdx];
            if (!slot.plantedCard) return prev;
            const grownTemplate = GROWN_PLANTS[slot.plantedCard.grownCardId || 'SUNFLOWER'];
            const grownCard: ICard = {
                ...grownTemplate,
                id: `grown-${Date.now()}-${slotIdx}`
            };
            garden[slotIdx] = { plantedCard: null, growth: 0, maxGrowth: 0 };
            return { ...prev, player: { ...p, garden, deck: [...p.deck, grownCard] } };
        });
    };

    const stateRef = useRef(gameState);
    const lastPlayedCardRef = useRef<ICard | null>(null);
    const victorySequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const battleVictoryResolvingRef = useRef(false);
    useEffect(() => { stateRef.current = gameState; }, [gameState]);

    const resolveBattleVictory = useCallback(() => {
        if (battleVictoryResolvingRef.current) return;
        battleVictoryResolvingRef.current = true;
        const shouldKeepBattleBgm =
            stateRef.current.challengeMode === 'COOP' &&
            stateRef.current.coopBattleState?.battleMode === 'REALTIME';
        if (!shouldKeepBattleBgm) {
            audioService.stopBGM();
        }
        audioService.playSound('win');
        setGameState(prev => {
            const nextPlayer = buildPostBattlePlayer(prev.player, true);

            if (prev.act === 4 && !prev.isEndless) {
                const score = calculateScore(prev, true);
                storageService.saveScore({
                    id: `victory-${Date.now()}`,
                    playerName: 'Player',
                    characterName: selectedCharName,
                    score: score,
                    act: prev.act,
                    floor: prev.floor,
                    victory: true,
                    date: Date.now(),
                    challengeMode: prev.challengeMode
                });

                setLegacyCardSelected(false);
                audioService.playBGM('victory');
                return { ...prev, player: nextPlayer, screen: GameScreen.ENDING };
            } else {
                if (prev.challengeMode === 'TYPING') {
                    return { ...prev, player: nextPlayer, screen: GameScreen.REWARD, rewards: [] };
                }
                const challengeScreen = getChallengeScreenForMode(prev.mode);
                return { ...prev, player: nextPlayer, screen: challengeScreen };
            }
        });
    }, [coopSelfPeerId, coopSession, selectedCharName]);

    useEffect(() => {
        if (gameState.screen !== GameScreen.BATTLE) {
            battleVictoryResolvingRef.current = false;
        }
        if (gameState.screen === GameScreen.BATTLE) {
            if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
                return;
            }
            const isHeartTransforming = gameState.enemies.some(e => e.enemyType === 'THE_HEART' && e.phase === 1 && e.currentHp <= 0);
            if (gameState.enemies.length === 0 && !isHeartTransforming) {
                if (battleFinisherCutinCard) return;

                if (lastPlayedCardRef.current) {
                    const finisherCard = { ...lastPlayedCardRef.current };
                    lastPlayedCardRef.current = null;
                    setBattleFinisherCutinCard(finisherCard);

                    if (victorySequenceTimerRef.current) {
                        clearTimeout(victorySequenceTimerRef.current);
                    }
                    victorySequenceTimerRef.current = setTimeout(() => {
                        setBattleFinisherCutinCard(null);
                        resolveBattleVictory();
                        victorySequenceTimerRef.current = null;
                    }, COOP_FINISHER_DISPLAY_MS);
                } else {
                    resolveBattleVictory();
                }
            } else if (gameState.player.currentHp <= 0) {
                const ghostPotIndex = gameState.player.potions.findIndex(p => p.templateId === 'GHOST_IN_JAR');
                const revivedPlayer = reviveWithTailEffect(gameState.player);
                if (revivedPlayer) {
                    audioService.playSound('buff');
                    setGameState(prev => ({
                        ...prev,
                        player: reviveWithTailEffect(prev.player) || prev.player
                    }));
                    return;
                }
                if (ghostPotIndex !== -1) {
                    audioService.playSound('buff');
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.floor(prev.player.maxHp * 0.1),
                            potions: prev.player.potions.filter((_, i) => i !== ghostPotIndex),
                            floatingText: { id: `revive-${Date.now()}`, text: 'お守り！', color: 'text-yellow-400', iconType: 'heart' }
                        }
                    }));
                    return;
                }

                if (gameState.challengeMode === 'COOP' && coopSession) {
                    const aliveCompanions = coopSession.participants.filter(
                        participant => participant.peerId !== coopSelfPeerId && (participant.currentHp ?? participant.maxHp ?? 0) > 0
                    );
                    if (aliveCompanions.length > 0) {
                        return;
                    }
                }

                // --- FIXED: Immediate save deletion to prevent repeat unlocks ---
                storageService.clearSave();

                // --- NEW UNLOCK LOGIC ON GAME OVER ---
                const unlockedCard = unlockRandomAdditionalCard();
                if (unlockedCard) setNewlyUnlockedCard(unlockedCard);

                setLegacyCardSelected(false);
                audioService.playSound('lose');
                audioService.playBGM('game_over');
                const score = calculateScore(gameState, false);
                storageService.saveScore({
                    id: `run-${Date.now()}`,
                    playerName: 'Player',
                    characterName: selectedCharName,
                    score: score,
                    act: gameState.act,
                    floor: gameState.floor,
                    victory: false,
                    date: Date.now(),
                    challengeMode: gameState.challengeMode
                });
                setGameState(prev => ({ ...prev, player: clearBattleOnlyCardState(clearBigLadleTemp(prev.player)), screen: GameScreen.GAME_OVER }));
            }
        }
    }, [gameState.enemies, gameState.player.currentHp, gameState.screen, gameState.act, gameState.challengeMode, coopSession, unlockRandomAdditionalCard, battleFinisherCutinCard, resolveBattleVictory]);

    useEffect(() => {
        return () => {
            if (victorySequenceTimerRef.current) {
                clearTimeout(victorySequenceTimerRef.current);
            }
        };
    }, []);

    const finishRewardPhase = () => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            if (coopSelfPeerId) {
                setCoopSession(prev => prev ? {
                    ...prev,
                    participants: prev.participants.map(participant =>
                        participant.peerId === coopSelfPeerId ? { ...participant, rewardResolved: true } : participant
                    )
                } : prev);
                p2pService.send({ type: 'COOP_SELF_STATE', rewardResolved: true });
            }
            setGameState(prev => ({ ...prev, rewards: [] }));
            return;
        }
        if (gameState.challengeMode === 'COOP' && coopSession && coopSession.isHost) {
            const selfResolved = coopSession.participants.find(participant => participant.peerId === coopSelfPeerId)?.rewardResolved;
            if (!selfResolved && coopSelfPeerId) {
                setCoopSession(prev => {
                    if (!prev) return prev;
                    const nextParticipants = prev.participants.map(participant =>
                        participant.peerId === coopSelfPeerId ? { ...participant, rewardResolved: true } : participant
                    );
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                    return { ...prev, participants: nextParticipants };
                });
                setCoopRewardSets(prev => ({
                    ...prev,
                    [coopSelfPeerId]: []
                }));
                setGameState(prev => ({ ...prev, rewards: [] }));
                return;
            }
            if (!coopSession.participants.every(participant => participant.rewardResolved)) {
                return;
            }
        }
        if (gameState.challengeMode === 'COOP') {
            setCoopRewardSets({});
        }
        setGameState(prev => {
            const currentNode = prev.map.find(n => n.id === prev.currentMapNodeId);
            let nextPlayer = { ...prev.player };
            if (nextPlayer.id === 'GARDENER' && nextPlayer.garden) {
                nextPlayer.garden = nextPlayer.garden.map(slot =>
                    slot.plantedCard ? { ...slot, growth: Math.min(slot.maxGrowth, slot.growth + 1) } : slot
                );
            }

            if (currentNode && currentNode.type === NodeType.BOSS) {
                if (prev.isEndless) {
                    const nextAct = prev.act + 1;
                    const newMap = generateDungeonMap();
                    audioService.playBGM('map');
                    const isGardener = nextPlayer.id === 'GARDENER';

                    return {
                        ...prev,
                        act: nextAct,
                        floor: 0,
                        map: newMap,
                        currentMapNodeId: null,
                        screen: isGardener ? GameScreen.GARDEN : GameScreen.MAP,
                        player: {
                            ...nextPlayer,
                            currentHp: nextPlayer.maxHp
                        },
                        narrativeLog: [...prev.narrativeLog, trans(`第${nextAct}章へ進んだ。体力が全回復した！`, languageMode)],
                        actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 }
                    };
                }

                // --- ACT CLEAR: Unlock additional card ---
                const unlockedCard = unlockRandomAdditionalCard();

                return {
                    ...prev,
                    player: nextPlayer,
                    screen: GameScreen.FLOOR_RESULT,
                    newlyUnlockedCardName: unlockedCard?.name // Passing unlocked card name to display in result screen
                };
            } else {
                const newMap = prev.map.map(n => {
                    if (n.id === prev.currentMapNodeId) return { ...n, completed: true };
                    return n;
                });
                audioService.playBGM('map');
                const isGardener = nextPlayer.id === 'GARDENER';
                return {
                    ...prev,
                    player: nextPlayer,
                    map: newMap,
                    screen: isGardener ? GameScreen.GARDEN : GameScreen.MAP
                };
            }
        });
        if (gameState.challengeMode === 'COOP') {
            setCoopSession(prev => {
                if (!prev || prev.participants.length === 0) return prev;
                const nextParticipants = prev.participants.map(participant => ({
                    ...participant,
                    quizResolved: false,
                    quizCorrectCount: 0,
                    rewardResolved: false
                }));
                const next = {
                    ...prev,
                    participants: nextParticipants,
                    decisionOwnerIndex: (prev.decisionOwnerIndex + 1) % prev.participants.length
                };
                if (prev.isHost) {
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: next.participants, decisionOwnerIndex: next.decisionOwnerIndex });
                }
                return next;
            });
        }
    };

    const goToRewardPhase = (bonusGold: number = 0) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            const hasBufferedRewards = gameState.rewards.length > 0;
            setCoopAwaitingRewardSync(!hasBufferedRewards);
            setGameState(prev => ({
                ...prev,
                screen: GameScreen.REWARD,
                rewards: hasBufferedRewards ? prev.rewards : []
            }));
            audioService.playBGM('reward');
            return;
        }
        const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
        const nodeType = currentNode?.type;
        const selfRewardBundle = buildRewardBundleForPlayer(gameState.player, nodeType, gameState.challengeMode, bonusGold, `self-${coopSelfPeerId || 'host'}`);

        if (gameState.challengeMode === 'COOP') {
            const nextRewardSets: Record<string, RewardItem[]> = {};
            setCoopSession(prev => {
                if (!prev) return prev;
                const nextParticipants = prev.participants.map(participant => ({
                    ...participant,
                    currentHp: (participant.currentHp ?? participant.maxHp ?? 0) > 0
                        ? participant.currentHp
                        : Math.max(1, Math.floor((participant.maxHp ?? 1) * 0.3)),
                    block: 0,
                    nextTurnEnergy: 0,
                    strength: 0,
                    buffer: 0,
                    revivedThisBattle: false,
                    rewardResolved: false,
                    floatingText: null
                }));
                if (prev.isHost) {
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                }
                return { ...prev, participants: nextParticipants };
            });
            if (coopSession) {
                coopSession.participants.forEach(participant => {
                    const rewardPlayer = participant.peerId === coopSelfPeerId ? gameState.player : getCoopRewardSourcePlayer(participant);
                    const bundle = participant.peerId === coopSelfPeerId
                        ? selfRewardBundle
                        : buildRewardBundleForPlayer(rewardPlayer, nodeType, gameState.challengeMode, bonusGold, `peer-${participant.peerId}`);
                    nextRewardSets[participant.peerId] = bundle.rewards;
                    if (participant.peerId !== coopSelfPeerId) {
                        p2pService.sendTo(participant.peerId, { type: 'COOP_REWARD_SYNC', rewards: bundle.rewards });
                    }
                });
            }
            setCoopRewardSets(nextRewardSets);
        }
        setGameState(prev => ({
            ...prev,
            screen: GameScreen.REWARD,
            rewards: gameState.challengeMode === 'COOP'
                ? (coopSelfPeerId ? (selfRewardBundle.rewards || []) : prev.rewards)
                : selfRewardBundle.rewards,
            actStats: selfRewardBundle.goldGained > 0
                ? { ...prev.actStats!, goldGained: prev.actStats!.goldGained + selfRewardBundle.goldGained }
                : prev.actStats
        }));
        audioService.playBGM('reward');
    };

    useEffect(() => {
        const previousScreen = previousScreenRef.current;
        if (
            gameState.challengeMode === 'TYPING' &&
            gameState.screen === GameScreen.REWARD &&
            previousScreen !== GameScreen.REWARD &&
            gameState.rewards.length === 0 &&
            gameState.enemies.length === 0
        ) {
            goToRewardPhase(0);
        }
        previousScreenRef.current = gameState.screen;
    }, [gameState.challengeMode, gameState.screen, gameState.rewards.length, gameState.enemies.length]);

    const handleMathChallengeComplete = (correctCount: number) => {
        if (gameState.challengeMode === 'COOP' && coopSession && coopSelfPeerId) {
            setCoopSession(prev => {
                if (!prev) return prev;
                const nextParticipants = prev.participants.map(participant =>
                    participant.peerId === coopSelfPeerId
                        ? { ...participant, quizResolved: true, quizCorrectCount: correctCount }
                        : participant
                );
                if (prev.isHost) {
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                }
                return { ...prev, participants: nextParticipants };
            });
            if (!coopSession.isHost) {
                p2pService.send({ type: 'COOP_QUIZ_RESULT', correctCount });
            }
        }
        let bonusGold = 0;
        if (correctCount === 1) bonusGold = 15;
        else if (correctCount === 2) bonusGold = 30;
        else if (correctCount === 3) bonusGold = 50;
        if (gameState.player.relics.find(r => r.id === 'CALCULATOR')) {
            const healAmount = correctCount * 2;
            if (healAmount > 0) {
                setGameState(prev => ({
                    ...prev,
                    player: {
                        ...prev.player,
                        currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + healAmount),
                        floatingText: { id: `calc-heal-${Date.now()}`, text: `+${healAmount} HP`, color: 'text-green-500', iconType: 'heart' }
                    }
                }));
            }
        }
        if (!gameState.modePool || gameState.modePool.length === 0) {
            handleModeCorrectProgress(gameState.mode, correctCount);
        }
        setTotalMathCorrect(prev => prev + correctCount);
        setGameState(prev => ({ ...prev, actStats: { ...prev.actStats!, mathCorrect: prev.actStats!.mathCorrect + correctCount } }));
        goToRewardPhase(bonusGold);
    };

    useEffect(() => {
        const previousScreen = coopRewardScreenRef.current;
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            if (gameState.screen === GameScreen.REWARD && previousScreen !== GameScreen.REWARD && gameState.rewards.length === 0) {
                setCoopAwaitingRewardSync(true);
            } else if (gameState.screen === GameScreen.REWARD && gameState.rewards.length > 0 && coopAwaitingRewardSync) {
                setCoopAwaitingRewardSync(false);
            } else if (gameState.screen !== GameScreen.REWARD && previousScreen === GameScreen.REWARD) {
                setCoopAwaitingRewardSync(false);
            }
        } else if (gameState.screen !== GameScreen.REWARD && coopAwaitingRewardSync) {
            setCoopAwaitingRewardSync(false);
        }
        coopRewardScreenRef.current = gameState.screen;
    }, [coopAwaitingRewardSync, coopSession, gameState.challengeMode, gameState.rewards.length, gameState.screen]);
    useEffect(() => {
        if (gameState.challengeMode === 'COOP' && coopSession?.isHost) return;
        if (coopNeedsInitialMapSync) {
            setCoopNeedsInitialMapSync(false);
        }
    }, [coopNeedsInitialMapSync, coopSession, gameState.challengeMode]);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || !coopSession || coopSession.isHost) {
            if (coopAwaitingMapSync) setCoopAwaitingMapSync(false);
            return;
        }
        if (gameState.screen !== GameScreen.RELIC_SELECTION) {
            if (coopAwaitingMapSync) setCoopAwaitingMapSync(false);
        }
    }, [coopAwaitingMapSync, coopSession, gameState.challengeMode, gameState.screen]);
    useEffect(() => {
        if (gameState.screen !== GameScreen.MAP) {
            clearCoopMapPending();
            return;
        }
        if (coopMapPendingNodeId && gameState.currentMapNodeId === coopMapPendingNodeId) {
            clearCoopMapPending();
        }
    }, [clearCoopMapPending, coopMapPendingNodeId, gameState.currentMapNodeId, gameState.screen]);
    useEffect(() => () => {
        if (coopMapPendingTimerRef.current) {
            window.clearTimeout(coopMapPendingTimerRef.current);
            coopMapPendingTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.REWARD || !coopSession || !coopSelfPeerId) return;
        if (coopAwaitingRewardSync) return;
        if (gameState.rewards.length > 0) return;
        const selfParticipant = coopSession.participants.find(participant => participant.peerId === coopSelfPeerId);
        if (selfParticipant?.rewardResolved) return;

        setCoopSession(prev => {
            if (!prev) return prev;
            const nextParticipants = prev.participants.map(participant =>
                participant.peerId === coopSelfPeerId ? { ...participant, rewardResolved: true } : participant
            );
            if (prev.isHost) {
                p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
            } else {
                p2pService.send({ type: 'COOP_SELF_STATE', rewardResolved: true });
            }
            return { ...prev, participants: nextParticipants };
        });
    }, [coopAwaitingRewardSync, coopSelfPeerId, coopSession, gameState.challengeMode, gameState.rewards.length, gameState.screen]);

    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.REWARD || !coopSession?.isHost) return;
        if (gameState.rewards.length > 0) return;
        if (!coopSession.participants.length || !coopSession.participants.every(participant => participant.rewardResolved)) return;
        finishRewardPhase();
    }, [coopSession, gameState.challengeMode, gameState.rewards.length, gameState.screen]);
    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.REWARD || !coopSession?.isHost) return;
        const pendingPeers = coopSession.participants.filter(participant =>
            participant.peerId !== coopSelfPeerId &&
            !participant.rewardResolved &&
            (coopRewardSets[participant.peerId]?.length ?? 0) > 0
        );
        if (pendingPeers.length === 0) return;

        const timer = window.setInterval(() => {
            pendingPeers.forEach(participant => {
                sendCoopRewardSyncToPeer(participant.peerId);
            });
        }, 2500);

        return () => window.clearInterval(timer);
    }, [coopRewardSets, coopSelfPeerId, coopSession, gameState.challengeMode, gameState.screen, sendCoopRewardSyncToPeer]);

    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.REST || !coopSession?.isHost) return;
        if (!coopSession.participants.length || !coopSession.participants.every(participant => participant.restResolved)) return;
        handleNodeComplete();
    }, [coopSession, gameState.challengeMode, gameState.screen]);

    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.SHOP || !coopSession?.isHost) return;
        if (!coopSession.participants.length || !coopSession.participants.every(participant => participant.shopResolved)) return;
        handleNodeComplete();
    }, [coopSession, gameState.challengeMode, gameState.screen]);

    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.EVENT || !coopSession?.isHost) return;
        if (!coopSession.participants.length || !coopSession.participants.every(participant => participant.eventResolved)) return;
        handleNodeComplete();
    }, [coopSession, gameState.challengeMode, gameState.screen]);

    useEffect(() => {
        if (gameState.challengeMode !== 'COOP' || gameState.screen !== GameScreen.TREASURE || !coopSession?.isHost) return;
        if (!coopSession.participants.length || !coopSession.participants.every(participant => participant.treasureResolved)) return;
        handleNodeComplete();
    }, [coopSession, gameState.challengeMode, gameState.screen]);

    const buildRewardBundleForPlayer = useCallback((player: Player, nodeType?: NodeType, challengeMode?: string, bonusGold: number = 0, rewardScope: string = 'reward') => {
        const rewards: RewardItem[] = [];
        let goldGained = 0;
        const isLibrarian = player.id === 'LIBRARIAN';
        const isGardener = player.id === 'GARDENER';
        const rewardPrefix = `${rewardScope}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const pickedCardTemplateIds = new Set<string>();

        if (bonusGold > 0) {
            let goldReward = bonusGold;
            if (player.relics.find(r => r.id === 'GOLDEN_IDOL')) goldReward = Math.floor(goldReward * 1.25);
            rewards.push({ type: 'GOLD', value: goldReward, id: `${rewardPrefix}-gold` });
            goldGained += goldReward;
        }

        const allPossibleCards = getFilteredCardPool(player.id);

        for (let i = 0; i < 3; i++) {
            const roll = Math.random() * 100;
            let targetRarity = 'COMMON';
            if (roll > 95) targetRarity = 'LEGENDARY'; else if (roll > 80) targetRarity = 'RARE'; else if (roll > 50) targetRarity = 'UNCOMMON';

            let pool;
            if (isLibrarian && i === 0 && Math.random() < 0.7) {
                pool = Object.values(LIBRARIAN_CARDS);
            } else if (isGardener && i === 0 && Math.random() < 0.7) {
                pool = Object.values(GARDEN_SEEDS);
            } else {
                pool = allPossibleCards.filter(c => c.rarity === targetRarity);
            }

            const uniquePool = pool.filter(card => !pickedCardTemplateIds.has(card.id));
            const fallbackUniquePool = allPossibleCards.filter(card => !pickedCardTemplateIds.has(card.id));
            const pickSource =
                uniquePool.length > 0
                    ? uniquePool
                    : fallbackUniquePool.length > 0
                        ? fallbackUniquePool
                        : pool.length > 0
                            ? pool
                            : allPossibleCards;
            const candidate = pickSource[Math.floor(Math.random() * pickSource.length)];
            pickedCardTemplateIds.add(candidate.id);
            rewards.push({ type: 'CARD', value: { ...candidate, id: `${rewardPrefix}-card-value-${i}` }, id: `${rewardPrefix}-card-${i}` });
        }

        if (challengeMode === 'RACE' && Math.random() < 0.3) {
            rewards.push({ type: 'RACE_TRICK', value: { ...getRandomRaceTrickCard(), id: `${rewardPrefix}-race-trick-value` }, id: `${rewardPrefix}-race-trick` });
        }
        if (challengeMode === 'COOP' && Math.random() < 0.35) {
            rewards.push({ type: 'COOP_SUPPORT', value: { ...getRandomCoopSupportCard(), id: `${rewardPrefix}-coop-support-value` }, id: `${rewardPrefix}-coop-support` });
        }

        const hasSozu = player.relics.find(r => r.id === 'SOZU');
        const hasKinjiro = player.relics.find(r => r.id === 'KINJIRO_STATUE');
        if (!hasSozu && (hasKinjiro || Math.random() < 0.4)) {
            const allPotions = Object.values(POTION_LIBRARY);
            const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
            rewards.push({ type: 'POTION', value: { ...potion, id: `${rewardPrefix}-potion-value` }, id: `${rewardPrefix}-potion` });
        }

        if (nodeType === NodeType.ELITE || nodeType === NodeType.BOSS) {
            const rarity = nodeType === NodeType.BOSS ? 'RARE' : 'UNCOMMON';
            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === rarity || r.rarity === 'COMMON' || r.rarity === 'RARE');
            const owned = player.relics.map(r => r.id);
            const available = allRelics.filter(r => !owned.includes(r.id));
            if (available.length > 0) {
                const relic = available[Math.floor(Math.random() * available.length)];
                rewards.push({ type: 'RELIC', value: relic, id: `${rewardPrefix}-relic` });
            }
            if (nodeType === NodeType.BOSS) {
                const goldBoss = 100;
                rewards.push({ type: 'GOLD', value: goldBoss, id: `${rewardPrefix}-gold-boss` });
                goldGained += goldBoss;
            }
        }

        return { rewards, goldGained };
    }, []);

    const getCoopRewardSourcePlayer = useCallback((participant: CoopParticipant) => {
        const snapshot = coopPlayerSnapshots[participant.peerId];
        if (snapshot) return { ...snapshot };
        if (participant.peerId === coopSelfPeerId) return { ...gameState.player };
        return {
            ...gameState.player,
            id: participant.selectedCharacterId || gameState.player.id,
            imageData: participant.imageData || gameState.player.imageData,
            maxHp: participant.maxHp || gameState.player.maxHp,
            currentHp: participant.currentHp ?? participant.maxHp ?? gameState.player.currentHp,
            block: participant.block ?? 0
        };
    }, [coopPlayerSnapshots, coopSelfPeerId, gameState.player]);

    const handleModeCorrectProgress = (mode: string, correctCount: number) => {
        if (correctCount <= 0) return;
        const modeKey = mode;
        const prevModeCount = modeCorrectCounts[modeKey] || 0;
        const nextModeCount = prevModeCount + correctCount;
        const alreadyMastered = masteredModes.includes(modeKey);
        const canGrantMasteryBonus = gameState.challengeMode !== 'TYPING' && !isTypingMasteryMode(modeKey);
        setModeCorrectCounts(prev => {
            const next = { ...prev, [modeKey]: (prev[modeKey] || 0) + correctCount };
            storageService.saveModeCorrectCounts(next);
            return next;
        });
        if (canGrantMasteryBonus && !alreadyMastered && prevModeCount < 100 && nextModeCount >= 100) {
            setMasteredModes(prev => {
                if (prev.includes(modeKey)) return prev;
                const next = [...prev, modeKey];
                storageService.saveMasteredModes(next);
                return next;
            });
            setMasteryRewardModal({ mode: modeKey });
        }
    };

    const removeRewardFromList = useCallback((rewards: RewardItem[], item: RewardItem) => {
        if (shouldClearAllCardRewards(item)) {
            return rewards.filter(reward => reward.type !== 'CARD');
        }
        return rewards.filter(reward => reward.id !== item.id);
    }, []);

    const applyRewardToLocalPlayer = useCallback((item: RewardItem, replacePotionId?: string, nextRewardsOverride?: RewardItem[]) => {
        if (item.type === 'RACE_TRICK') {
            setRaceTrickCards(prevCards => [...prevCards, item.value as RaceTrickCard]);
        }
        if (item.type === 'COOP_SUPPORT') {
            setCoopSupportCards(prevCards => [...prevCards, createCoopSupportInstance(item.value as CoopSupportCard)]);
        }
        setGameState(prev => {
            let p = { ...prev.player };
            const nextRewards = nextRewardsOverride ?? removeRewardFromList(prev.rewards, item);
            if (item.type === 'CARD') {
                addCardToDeckWithRelics(p, item.value);
                storageService.saveUnlockedCard(item.value.name);
            } else if (item.type === 'RELIC') {
                p.relics = [...p.relics, item.value];
                if (item.value.id === 'SOZU') p.maxEnergy += 1;
                if (item.value.id === 'CURSED_KEY') p.maxEnergy += 1;
                if (item.value.id === 'PHILOSOPHER_STONE') p.maxEnergy += 1;
                if (item.value.id === 'VELVET_CHOKER') p.maxEnergy += 1;
                if (item.value.id === 'WAFFLE') { p.maxHp += 7; p.currentHp = p.maxHp; }
                if (item.value.id === 'OLD_COIN') p.gold += 300;
                if (item.value.id === 'MATRYOSHKA') p.relicCounters['MATRYOSHKA'] = 2;
                if (item.value.id === 'HAPPY_FLOWER') p.relicCounters['HAPPY_FLOWER'] = 0;
                applyExtendedRelicAcquireEffects(p, item.value);
                storageService.saveUnlockedRelic(item.value.id);
            } else if (item.type === 'GOLD') {
                p.gold += item.value;
            } else if (item.type === 'POTION') {
                if (p.potions.length < getPotionCapacity(p) || replacePotionId) {
                    if (replacePotionId) p.potions = p.potions.filter(pt => pt.id !== replacePotionId);
                    p.potions = [...p.potions, item.value];
                    storageService.saveUnlockedPotion(item.value.templateId);
                } else {
                    return prev;
                }
            }
            return { ...prev, player: p, rewards: nextRewards };
        });
    }, [removeRewardFromList]);
    const applyTreasureRewardsToPlayer = useCallback((player: Player, rewards: RewardItem[], addCurse: boolean): Player => {
        const nextPlayer = { ...player, relicCounters: { ...player.relicCounters } };
        rewards.forEach(item => {
            if (item.type === 'GOLD') {
                nextPlayer.gold += item.value;
                return;
            }
            if (item.type === 'RELIC') {
                nextPlayer.relics = [...nextPlayer.relics, item.value];
                storageService.saveUnlockedRelic(item.value.id);
                if (item.value.id === 'SOZU') nextPlayer.maxEnergy += 1;
                if (item.value.id === 'CURSED_KEY') nextPlayer.maxEnergy += 1;
                if (item.value.id === 'PHILOSOPHER_STONE') nextPlayer.maxEnergy += 1;
                if (item.value.id === 'VELVET_CHOKER') nextPlayer.maxEnergy += 1;
                if (item.value.id === 'WAFFLE') {
                    nextPlayer.maxHp += 7;
                    nextPlayer.currentHp = nextPlayer.maxHp;
                }
                if (item.value.id === 'OLD_COIN') nextPlayer.gold += 300;
                if (item.value.id === 'MATRYOSHKA') nextPlayer.relicCounters['MATRYOSHKA'] = 2;
                if (item.value.id === 'HAPPY_FLOWER') nextPlayer.relicCounters['HAPPY_FLOWER'] = 0;
                applyExtendedRelicAcquireEffects(nextPlayer, item.value);
            }
        });
        if (addCurse) {
            const curse = { ...CURSE_CARDS.PAIN, id: `curse-${Date.now()}` };
            addCardToDeckWithRelics(nextPlayer, curse, { addToDiscard: true });
        }
        return nextPlayer;
    }, []);
    const buildTreasureRewardBundle = useCallback((): RewardItem[] => {
        const rewards: RewardItem[] = [];
        const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON' || r.rarity === 'UNCOMMON' || r.rarity === 'RARE');
        rewards.push({ type: 'RELIC', value: shuffle([...allRelics])[0], id: `tr-relic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
        rewards.push({ type: 'GOLD', value: 50 + Math.floor(Math.random() * 50), id: `tr-gold-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
        return rewards;
    }, []);
    const buildCoopTreasurePools = useCallback((count: number): CoopTreasurePool[] => (
        Array.from({ length: count }, (_, index) => ({
            id: `coop-treasure-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
            rewards: buildTreasureRewardBundle(),
            claimedByPeerId: null,
            claimedByName: null
        }))
    ), [buildTreasureRewardBundle]);
    const claimCoopTreasurePoolForPeer = useCallback((targetPeerId: string, poolId: string) => {
        if (!coopSession?.isHost) return;
        const pool = treasurePools.find(entry => entry.id === poolId);
        if (!pool || pool.claimedByPeerId) return;

        const sourcePlayer = targetPeerId === coopSelfPeerId
            ? gameState.player
            : coopPlayerSnapshots[targetPeerId];
        if (!sourcePlayer) return;

        const workingPlayer: Player = {
            ...sourcePlayer,
            relicCounters: { ...sourcePlayer.relicCounters }
        };
        const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON' || r.rarity === 'UNCOMMON' || r.rarity === 'RARE');
        const claimRewards = [...pool.rewards];
        const matryoshkaCharges = workingPlayer.relicCounters['MATRYOSHKA'] || 0;
        if (matryoshkaCharges > 0) {
            workingPlayer.relicCounters['MATRYOSHKA'] = matryoshkaCharges - 1;
            claimRewards.push({
                type: 'RELIC',
                value: shuffle([...allRelics])[0],
                id: `coop-tr-matryoshka-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            });
        }
        const addCurse = !!workingPlayer.relics.find(relic => relic.id === 'CURSED_KEY');
        const nextPlayer = applyTreasureRewardsToPlayer(workingPlayer, claimRewards, addCurse);

        setTreasurePools(prev => prev.map(entry => entry.id === poolId ? {
            ...entry,
            claimedByPeerId: targetPeerId,
            claimedByName: coopSession.participants.find(participant => participant.peerId === targetPeerId)?.name || null,
            rewards: claimRewards
        } : entry));
        applyCoopPlayerStateToPeer(targetPeerId, nextPlayer);

        if (targetPeerId !== coopSelfPeerId) {
            p2pService.sendTo(targetPeerId, {
                type: 'COOP_TREASURE_GRANT',
                poolId,
                rewards: claimRewards,
                player: nextPlayer,
                addCurse
            });
        }
    }, [applyCoopPlayerStateToPeer, applyTreasureRewardsToPlayer, coopPlayerSnapshots, coopSelfPeerId, coopSession, gameState.player, treasurePools]);
    const handleTreasureOpen = useCallback(() => {
        if (gameState.challengeMode === 'COOP') return;
        if (treasureOpened) return;
        const hasCursedKey = !!gameState.player.relics.find(r => r.id === 'CURSED_KEY');
        setTreasureOpened(true);
        setGameState(prev => ({
            ...prev,
            player: applyTreasureRewardsToPlayer(prev.player, treasureRewards, hasCursedKey)
        }));
    }, [applyTreasureRewardsToPlayer, gameState.challengeMode, gameState.player.relics, treasureOpened, treasureRewards]);
    const handleTreasureClaim = useCallback((poolId: string) => {
        if (gameState.challengeMode !== 'COOP' || !coopSession) return;
        if (!coopSession.isHost) {
            p2pService.send({ type: 'COOP_TREASURE_CLAIM', poolId });
            return;
        }
        claimCoopTreasurePoolForPeer(coopSelfPeerId, poolId);
    }, [claimCoopTreasurePoolForPeer, coopSelfPeerId, coopSession, gameState.challengeMode]);
    const handleTreasureLeave = useCallback(() => {
        if (gameState.challengeMode === 'COOP' && coopSession && coopSelfPeerId) {
            setCoopSession(prev => {
                if (!prev) return prev;
                const nextParticipants = prev.participants.map(participant =>
                    participant.peerId === coopSelfPeerId ? { ...participant, treasureResolved: true } : participant
                );
                if (prev.isHost) {
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                } else {
                    p2pService.send({ type: 'COOP_SELF_STATE', treasureResolved: true });
                }
                return { ...prev, participants: nextParticipants };
            });
            return;
        }
        handleNodeComplete();
    }, [coopSelfPeerId, coopSession, gameState.challengeMode, handleNodeComplete]);

    const handleRewardSelection = (item: RewardItem, replacePotionId?: string) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_REWARD_SELECT', rewardId: item.id, item, replacePotionId });
            return;
        }
        if (gameState.challengeMode === 'COOP' && coopSession?.isHost && coopSelfPeerId) {
            setCoopRewardSets(prev => ({
                ...prev,
                [coopSelfPeerId]: removeRewardFromList(prev[coopSelfPeerId] || [], item)
            }));
        }
        applyRewardToLocalPlayer(item, replacePotionId);
    };

    const applyCoopSupportEffect = useCallback((card: CoopSupportCard, targetPeerId?: string, sourcePeerId?: string) => {
        if (gameState.challengeMode === 'COOP' && gameState.screen === GameScreen.BATTLE && gameState.coopBattleState && sourcePeerId) {
            const revivedPeerIds = new Set(
                (coopSession?.participants || [])
                    .filter(participant => participant.revivedThisBattle)
                    .map(participant => participant.peerId)
            );
            const revivedThisEffect = new Set<string>();
            const nextBattleState: CoopBattleState = {
                ...gameState.coopBattleState,
                players: gameState.coopBattleState.players.map(entry => ({
                    ...entry,
                    player: {
                        ...entry.player,
                        powers: { ...entry.player.powers },
                        turnFlags: { ...entry.player.turnFlags },
                        hand: [...entry.player.hand],
                        drawPile: [...entry.player.drawPile],
                        discardPile: [...entry.player.discardPile]
                    }
                }))
            };
            const sourceEntry = nextBattleState.players.find(entry => entry.peerId === sourcePeerId);
            if (!sourceEntry) return;
            const singleTargetPeerId = targetPeerId || sourcePeerId;
            const singleTargetEntry = nextBattleState.players.find(entry => entry.peerId === singleTargetPeerId) || sourceEntry;
            const sourcePlayer = sourceEntry.player;
            const targetPlayer = singleTargetEntry.player;
            const otherEntries = nextBattleState.players.filter(entry => entry.peerId !== sourcePeerId);
            const lowestHpCompanion = otherEntries
                .filter(entry => entry.player.currentHp > 0)
                .slice()
                .sort((a, b) => a.player.currentHp - b.player.currentHp)[0];
            const downedTargetEntry = (
                singleTargetEntry.player.currentHp <= 0 &&
                !revivedPeerIds.has(singleTargetEntry.peerId)
            )
                ? singleTargetEntry
                : nextBattleState.players.find(entry => entry.player.currentHp <= 0 && !revivedPeerIds.has(entry.peerId));

            switch (card.effectId) {
                case 'ALLY_HEAL': {
                    const healEntry = targetPeerId ? singleTargetEntry : (lowestHpCompanion || sourceEntry);
                    healEntry.player.currentHp = Math.min(healEntry.player.maxHp, healEntry.player.currentHp + 10);
                    healEntry.player.floatingText = { id: `coop-heal-${Date.now()}-${healEntry.peerId}`, text: '+10', color: 'text-green-400', iconType: 'heart' };
                    if (healEntry.peerId !== sourcePeerId) {
                        sourcePlayer.floatingText = { id: `coop-heal-source-${Date.now()}-${sourcePeerId}`, text: healEntry.name, color: 'text-emerald-300', iconType: 'heart' };
                    }
                    break;
                }
                case 'ALLY_BLOCK':
                    targetPlayer.block += 20;
                    targetPlayer.floatingText = { id: `coop-block-${Date.now()}-${singleTargetEntry.peerId}`, text: '+20', color: 'text-blue-300', iconType: 'shield' };
                    if (singleTargetEntry.peerId !== sourcePeerId) {
                        sourcePlayer.floatingText = { id: `coop-block-source-${Date.now()}-${sourcePeerId}`, text: singleTargetEntry.name, color: 'text-emerald-300', iconType: 'shield' };
                    }
                    break;
                case 'ALLY_NEXT_ENERGY':
                    targetPlayer.nextTurnEnergy += 1;
                    targetPlayer.floatingText = { id: `coop-energy-${Date.now()}-${singleTargetEntry.peerId}`, text: 'NEXT+1', color: 'text-yellow-300', iconType: 'zap' };
                    if (singleTargetEntry.peerId !== sourcePeerId) {
                        sourcePlayer.floatingText = { id: `coop-energy-source-${Date.now()}-${sourcePeerId}`, text: singleTargetEntry.name, color: 'text-emerald-300', iconType: 'zap' };
                    }
                    break;
                case 'ALLY_DRAW': {
                    const drawAmount = Math.min(2, sourcePlayer.drawPile.length);
                    for (let i = 0; i < drawAmount; i++) {
                        const drawn = sourcePlayer.drawPile.shift();
                        if (drawn) sourcePlayer.hand.push(drawn);
                    }
                    sourcePlayer.floatingText = { id: `coop-draw-${Date.now()}-${sourcePeerId}`, text: `+${drawAmount}枚`, color: 'text-cyan-300' };
                    break;
                }
                case 'ALLY_ATTACK_BOOST':
                    targetPlayer.strength += 3;
                    targetPlayer.floatingText = { id: `coop-boost-${Date.now()}-${singleTargetEntry.peerId}`, text: 'ATK+', color: 'text-red-300', iconType: 'sword' };
                    if (singleTargetEntry.peerId !== sourcePeerId) {
                        sourcePlayer.floatingText = { id: `coop-boost-source-${Date.now()}-${sourcePeerId}`, text: singleTargetEntry.name, color: 'text-emerald-300', iconType: 'sword' };
                    }
                    break;
                case 'ALLY_BUFFER':
                    targetPlayer.powers['BUFFER'] = (targetPlayer.powers['BUFFER'] || 0) + 1;
                    targetPlayer.floatingText = { id: `coop-buffer-${Date.now()}-${singleTargetEntry.peerId}`, text: '0 DMG', color: 'text-yellow-200', iconType: 'shield' };
                    if (singleTargetEntry.peerId !== sourcePeerId) {
                        sourcePlayer.floatingText = { id: `coop-buffer-source-${Date.now()}-${sourcePeerId}`, text: singleTargetEntry.name, color: 'text-emerald-300', iconType: 'shield' };
                    }
                    break;
                case 'TEAM_CLEANSE':
                    nextBattleState.players.forEach(entry => {
                        entry.player.block += 8;
                        entry.player.floatingText = { id: `coop-team-cleanse-${Date.now()}-${entry.peerId}`, text: '+8', color: 'text-emerald-300', iconType: 'shield' };
                    });
                    break;
                case 'TEAM_HEAL':
                    nextBattleState.players.forEach(entry => {
                        entry.player.currentHp = Math.min(entry.player.maxHp, entry.player.currentHp + 5);
                        entry.player.floatingText = { id: `coop-team-heal-${Date.now()}-${entry.peerId}`, text: '+5', color: 'text-green-400', iconType: 'heart' };
                    });
                    break;
                case 'REVIVE_BANDAGE':
                    if (downedTargetEntry) {
                        downedTargetEntry.player.currentHp = 15;
                        downedTargetEntry.player.floatingText = { id: `coop-revive-bandage-${Date.now()}-${downedTargetEntry.peerId}`, text: '復活', color: 'text-green-300', iconType: 'heart' };
                        revivedThisEffect.add(downedTargetEntry.peerId);
                    }
                    break;
                case 'REVIVE_NURSE':
                    if (downedTargetEntry) {
                        downedTargetEntry.player.currentHp = Math.max(1, Math.floor(downedTargetEntry.player.maxHp * 0.25));
                        downedTargetEntry.player.block += 10;
                        downedTargetEntry.player.floatingText = { id: `coop-revive-nurse-${Date.now()}-${downedTargetEntry.peerId}`, text: '奇跡', color: 'text-pink-300', iconType: 'heart' };
                        revivedThisEffect.add(downedTargetEntry.peerId);
                    }
                    break;
            }

            const finalizedBattleState: CoopBattleState = {
                ...nextBattleState,
                players: nextBattleState.players.map(entry => ({
                    ...entry,
                    isDown: entry.player.currentHp <= 0
                }))
            };
            const selfBattlePlayer = finalizedBattleState.players.find(entry => entry.peerId === coopSelfPeerId);
            setGameState(prev => ({
                ...prev,
                player: selfBattlePlayer?.player || prev.player,
                coopBattleState: finalizedBattleState
            }));
            setCoopBattleState(finalizedBattleState);
            finalizedBattleState.players.forEach(entry => {
                upsertCoopPlayerSnapshot(entry.peerId, entry.player);
            });
            setCoopSession(prev => {
                if (!prev) return prev;
                const nextParticipants = prev.participants.map(participant => {
                    const battleEntry = finalizedBattleState.players.find(entry => entry.peerId === participant.peerId);
                    if (!battleEntry) return participant;
                    return {
                        ...participant,
                        maxHp: battleEntry.player.maxHp,
                        currentHp: battleEntry.player.currentHp,
                        block: battleEntry.player.block,
                        nextTurnEnergy: battleEntry.player.nextTurnEnergy,
                        strength: battleEntry.player.strength,
                        buffer: battleEntry.player.powers['BUFFER'] || 0,
                        revivedThisBattle: revivedPeerIds.has(participant.peerId) || revivedThisEffect.has(participant.peerId)
                    };
                });
                if (prev.isHost) {
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                }
                return { ...prev, participants: nextParticipants };
            });
            if (coopSession?.isHost) {
                broadcastCoopBattleState(finalizedBattleState);
            }
            return;
        }
        const targetedCompanion = targetPeerId
            ? coopSession?.participants.find(participant => participant.peerId === targetPeerId)
            : undefined;
        const downedCompanion = targetedCompanion && (targetedCompanion.currentHp ?? 0) <= 0 && !targetedCompanion.revivedThisBattle
            ? targetedCompanion
            : coopSession?.participants.find(participant => participant.peerId !== coopSelfPeerId && (participant.currentHp ?? 0) <= 0 && !participant.revivedThisBattle);
        const healCompanion = targetedCompanion && targetedCompanion.peerId !== coopSelfPeerId
            ? targetedCompanion
            : coopSession?.participants
                .filter(participant => participant.peerId !== coopSelfPeerId)
                .slice()
                .sort((a, b) => (a.currentHp ?? a.maxHp ?? 0) - (b.currentHp ?? b.maxHp ?? 0))[0];
        setGameState(prev => {
            const p = {
                ...prev.player,
                powers: { ...prev.player.powers },
                turnFlags: { ...prev.player.turnFlags },
                hand: [...prev.player.hand],
                drawPile: [...prev.player.drawPile],
                discardPile: [...prev.player.discardPile]
            };

            switch (card.effectId) {
                case 'ALLY_HEAL':
                    if (healCompanion && healCompanion.peerId !== coopSelfPeerId) {
                        updateCoopParticipantState(healCompanion.peerId, current => ({
                            ...current,
                            currentHp: Math.min(current.maxHp ?? 0, (current.currentHp ?? 0) + 10),
                            floatingText: { id: `coop-heal-target-${Date.now()}-${healCompanion.peerId}`, text: '+10', color: 'text-green-400', iconType: 'heart' }
                        }));
                        p.floatingText = { id: `coop-heal-ally-${Date.now()}`, text: healCompanion.name, color: 'text-emerald-300', iconType: 'heart' };
                        break;
                    }
                    p.currentHp = Math.min(p.maxHp, p.currentHp + 10);
                    p.floatingText = { id: `coop-heal-${Date.now()}`, text: '+10', color: 'text-green-400', iconType: 'heart' };
                    break;
                case 'ALLY_BLOCK':
                    if (targetedCompanion && targetedCompanion.peerId !== coopSelfPeerId) {
                        updateCoopParticipantState(targetedCompanion.peerId, current => ({
                            ...current,
                            block: (current.block ?? 0) + 20,
                            floatingText: { id: `coop-block-target-${Date.now()}-${targetedCompanion.peerId}`, text: '+20', color: 'text-blue-300', iconType: 'shield' }
                        }));
                        p.floatingText = { id: `coop-block-self-${Date.now()}`, text: targetedCompanion.name, color: 'text-emerald-300', iconType: 'shield' };
                    } else {
                        p.block += 20;
                        p.floatingText = { id: `coop-block-${Date.now()}`, text: '+20', color: 'text-blue-300', iconType: 'shield' };
                    }
                    break;
                case 'ALLY_NEXT_ENERGY':
                    if (targetedCompanion && targetedCompanion.peerId !== coopSelfPeerId) {
                        updateCoopParticipantState(targetedCompanion.peerId, current => ({
                            ...current,
                            nextTurnEnergy: (current.nextTurnEnergy ?? 0) + 1,
                            floatingText: { id: `coop-energy-target-${Date.now()}-${targetedCompanion.peerId}`, text: 'NEXT+1', color: 'text-yellow-300', iconType: 'zap' }
                        }));
                        p.floatingText = { id: `coop-energy-self-${Date.now()}`, text: targetedCompanion.name, color: 'text-emerald-300', iconType: 'zap' };
                    } else {
                        p.nextTurnEnergy += 1;
                        p.floatingText = { id: `coop-energy-${Date.now()}`, text: 'NEXT+1', color: 'text-yellow-300', iconType: 'zap' };
                    }
                    break;
                case 'ALLY_DRAW': {
                    const drawAmount = Math.min(2, p.drawPile.length);
                    for (let i = 0; i < drawAmount; i++) {
                        const drawn = p.drawPile.shift();
                        if (drawn) p.hand.push(drawn);
                    }
                    p.floatingText = { id: `coop-draw-${Date.now()}`, text: `+${drawAmount}枚`, color: 'text-cyan-300' };
                    break;
                }
                case 'ALLY_ATTACK_BOOST':
                    if (targetedCompanion && targetedCompanion.peerId !== coopSelfPeerId) {
                        updateCoopParticipantState(targetedCompanion.peerId, current => ({
                            ...current,
                            strength: (current.strength ?? 0) + 3,
                            floatingText: { id: `coop-boost-target-${Date.now()}-${targetedCompanion.peerId}`, text: 'ATK+', color: 'text-red-300', iconType: 'sword' }
                        }));
                        p.floatingText = { id: `coop-boost-self-${Date.now()}`, text: targetedCompanion.name, color: 'text-emerald-300', iconType: 'sword' };
                    } else {
                        p.strength += 3;
                        p.floatingText = { id: `coop-boost-${Date.now()}`, text: 'ATK+', color: 'text-red-300', iconType: 'sword' };
                    }
                    break;
                case 'ALLY_BUFFER':
                    if (targetedCompanion && targetedCompanion.peerId !== coopSelfPeerId) {
                        updateCoopParticipantState(targetedCompanion.peerId, current => ({
                            ...current,
                            buffer: (current.buffer ?? 0) + 1,
                            floatingText: { id: `coop-buffer-target-${Date.now()}-${targetedCompanion.peerId}`, text: '0 DMG', color: 'text-yellow-200', iconType: 'shield' }
                        }));
                        p.floatingText = { id: `coop-buffer-self-${Date.now()}`, text: targetedCompanion.name, color: 'text-emerald-300', iconType: 'shield' };
                    } else {
                        p.powers['BUFFER'] = (p.powers['BUFFER'] || 0) + 1;
                        p.floatingText = { id: `coop-buffer-${Date.now()}`, text: '0 DMG', color: 'text-yellow-200', iconType: 'shield' };
                    }
                    break;
                case 'TEAM_CLEANSE':
                    p.block += 8;
                    p.floatingText = { id: `coop-cleanse-${Date.now()}`, text: 'RESET', color: 'text-emerald-300', iconType: 'shield' };
                    if (coopSession) {
                        coopSession.participants
                            .filter(participant => participant.peerId !== coopSelfPeerId)
                            .forEach(participant => {
                                updateCoopParticipantState(participant.peerId, current => ({
                                    ...current,
                                    buffer: Math.max(0, (current.buffer ?? 0) - 1)
                                }));
                            });
                    }
                    break;
                case 'TEAM_HEAL':
                    p.currentHp = Math.min(p.maxHp, p.currentHp + 5);
                    p.floatingText = { id: `coop-team-heal-${Date.now()}`, text: '+5', color: 'text-green-400', iconType: 'heart' };
                    if (coopSession) {
                        coopSession.participants
                            .filter(participant => participant.peerId !== coopSelfPeerId)
                            .forEach(participant => {
                                updateCoopParticipantState(participant.peerId, current => ({
                                    ...current,
                                    currentHp: Math.min(current.maxHp ?? 0, (current.currentHp ?? 0) + 5),
                                    floatingText: { id: `coop-team-heal-target-${Date.now()}-${participant.peerId}`, text: '+5', color: 'text-green-400', iconType: 'heart' }
                                }));
                            });
                    }
                    break;
                case 'REVIVE_BANDAGE':
                    if (p.currentHp <= 0) {
                        p.currentHp = 15;
                        p.floatingText = { id: `coop-revive-bandage-${Date.now()}`, text: '復活', color: 'text-green-300', iconType: 'heart' };
                    } else if (downedCompanion) {
                        updateCoopParticipantState(downedCompanion.peerId, current => ({
                            ...current,
                            currentHp: 15,
                            revivedThisBattle: true,
                            floatingText: { id: `coop-revive-bandage-target-${Date.now()}-${downedCompanion.peerId}`, text: '復活', color: 'text-green-300', iconType: 'heart' }
                        }));
                    }
                    break;
                case 'REVIVE_NURSE':
                    if (p.currentHp <= 0) {
                        p.currentHp = Math.max(1, Math.floor(p.maxHp * 0.25));
                        p.block += 10;
                        p.floatingText = { id: `coop-revive-nurse-${Date.now()}`, text: '奇跡', color: 'text-pink-300', iconType: 'heart' };
                    } else if (downedCompanion) {
                        updateCoopParticipantState(downedCompanion.peerId, current => ({
                            ...current,
                            currentHp: Math.max(1, Math.floor((current.maxHp ?? 1) * 0.25)),
                            revivedThisBattle: true,
                            floatingText: { id: `coop-revive-nurse-target-${Date.now()}-${downedCompanion.peerId}`, text: '奇跡', color: 'text-pink-300', iconType: 'heart' }
                        }));
                    }
                    break;
            }

            return { ...prev, player: p };
        });
        if (targetedCompanion?.peerId) {
            window.setTimeout(() => {
                updateCoopParticipantState(targetedCompanion.peerId, current => ({ ...current, floatingText: null }));
            }, 900);
        }
        if (card.effectId === 'TEAM_HEAL' && coopSession) {
            window.setTimeout(() => {
                coopSession.participants
                    .filter(participant => participant.peerId !== coopSelfPeerId)
                    .forEach(participant => {
                        updateCoopParticipantState(participant.peerId, current => ({ ...current, floatingText: null }));
                    });
            }, 900);
        }
    }, [broadcastCoopBattleState, coopSelfPeerId, coopSession, gameState.challengeMode, gameState.coopBattleState, gameState.screen, setCoopBattleState, updateCoopParticipantState, upsertCoopPlayerSnapshot]);

    const handleUseCoopSupport = useCallback((card: CoopSupportCard, targetPeerId?: string) => {
        setCoopSupportCards(prevCards => prevCards.filter(entry => entry.id !== card.id));
        if (coopSession && !coopSession.isHost) {
            p2pService.send({
                type: 'COOP_SUPPORT_USE',
                cardId: card.id,
                effectId: card.effectId,
                name: card.name,
                description: card.description,
                rarity: card.rarity,
                targetPeerId
            });
            return;
        }
        applyCoopSupportEffect(card, targetPeerId, coopSelfPeerId || undefined);
    }, [applyCoopSupportEffect, coopSelfPeerId, coopSession]);
    const applyRestAction = () => {
        const heal = Math.floor(gameState.player.maxHp * 0.3);
        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + heal) } }));
    };

    const handleRestAction = () => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_REST_ACTION', action: 'REST' });
            applyRestAction();
            return;
        }
        applyRestAction();
    };

    const applyUpgradeCard = (card: ICard) => {
        const upgraded = getUpgradedCard(card);
        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                deck: prev.player.deck.map(c => c.id === card.id ? upgraded : c)
            }
        }));
    };

    const handleUpgradeCard = (card: ICard) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_REST_ACTION', action: 'UPGRADE', cardId: card.id });
            applyUpgradeCard(card);
            return;
        }
        applyUpgradeCard(card);
    };

    const handleRestLeave = () => {
        if (gameState.challengeMode === 'COOP' && coopSession && coopSelfPeerId) {
            setCoopSession(prev => {
                if (!prev) return prev;
                const nextParticipants = prev.participants.map(participant =>
                    participant.peerId === coopSelfPeerId ? { ...participant, restResolved: true } : participant
                );
                if (prev.isHost) {
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                } else {
                    p2pService.send({ type: 'COOP_SELF_STATE', restResolved: true });
                }
                return { ...prev, participants: nextParticipants };
            });
            return;
        }
        handleNodeComplete();
    };

    const handleNextActFromStory = () => {
        setGameState(prev => {
            if (prev.act === 3 && !prev.isEndless) {
                return { ...prev, screen: GameScreen.FINAL_BRIDGE };
            }
            const nextAct = prev.act + 1;
            const newMap = generateDungeonMap();
            audioService.playBGM('map');
            const isGardener = prev.player.id === 'GARDENER';
            return {
                ...prev,
                act: nextAct,
                floor: 0,
                map: newMap,
                currentMapNodeId: null,
                screen: isGardener ? GameScreen.GARDEN : GameScreen.MAP,
                player: {
                    ...prev.player,
                    currentHp: prev.player.maxHp
                },
                narrativeLog: [...prev.narrativeLog, trans(`第${nextAct}章へ進んだ。体力が全回復した！`, languageMode)],
                actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 },
                newlyUnlockedCardName: undefined // 次のアクトへ行くときにリセット
            };
        });
    };

    const handleShopBuyCard = (card: ICard) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_SHOP_ACTION', action: 'BUY_CARD', itemId: card.id });
            setGameState(prev => {
                let price = card.price || 50;
                if (prev.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
                if (raceEffects.shopMarkupUntil > raceEffectNow) price = Math.floor(price * 1.25);
                const newP = { ...prev.player, gold: prev.player.gold - price };
                addCardToDeckWithRelics(newP, { ...card, id: `buy-${Date.now()}` }, { addToDiscard: true });
                return { ...prev, player: newP };
            });
            setShopCards(prev => prev.filter(entry => entry.id !== card.id));
            storageService.saveUnlockedCard(card.name);
            return;
        }
        setGameState(prev => {
            let price = card.price || 50;
            if (prev.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
            if (raceEffects.shopMarkupUntil > raceEffectNow) price = Math.floor(price * 1.25);
            const newP = { ...prev.player, gold: prev.player.gold - price };
            addCardToDeckWithRelics(newP, { ...card, id: `buy-${Date.now()}` }, { addToDiscard: true });
            return { ...prev, player: newP };
        });
        if (gameState.challengeMode === 'COOP') {
            setShopCards(prev => prev.filter(entry => entry.id !== card.id));
        }
        storageService.saveUnlockedCard(card.name);
    };

    const handleShopBuyRelic = (relic: Relic) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_SHOP_ACTION', action: 'BUY_RELIC', itemId: relic.id });
            setGameState(prev => {
                let price = relic.price || 150;
                if (prev.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
                if (raceEffects.shopMarkupUntil > raceEffectNow) price = Math.floor(price * 1.25);
                const newP = { ...prev.player, gold: prev.player.gold - price, relics: [...prev.player.relics, relic] };
                if (relic.id === 'SOZU') newP.maxEnergy += 1;
                if (relic.id === 'CURSED_KEY') newP.maxEnergy += 1;
                if (relic.id === 'PHILOSOPHER_STONE') newP.maxEnergy += 1;
                if (relic.id === 'VELVET_CHOKER') newP.maxEnergy += 1;
                if (relic.id === 'WAFFLE') { newP.maxHp += 7; newP.currentHp = newP.maxHp; }
                if (relic.id === 'OLD_COIN') newP.gold += 300;
                if (relic.id === 'MATRYOSHKA') newP.relicCounters['MATRYOSHKA'] = 2;
                if (relic.id === 'HAPPY_FLOWER') newP.relicCounters['HAPPY_FLOWER'] = 0;
                applyExtendedRelicAcquireEffects(newP, relic);
                return { ...prev, player: newP };
            });
            setShopRelics(prev => prev.filter(entry => entry.id !== relic.id));
            storageService.saveUnlockedRelic(relic.id);
            return;
        }
        setGameState(prev => {
            let price = relic.price || 150;
            if (prev.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
            if (raceEffects.shopMarkupUntil > raceEffectNow) price = Math.floor(price * 1.25);
            const newP = { ...prev.player, gold: prev.player.gold - price, relics: [...prev.player.relics, relic] };
            if (relic.id === 'SOZU') newP.maxEnergy += 1;
            if (relic.id === 'CURSED_KEY') newP.maxEnergy += 1;
            if (relic.id === 'PHILOSOPHER_STONE') newP.maxEnergy += 1;
            if (relic.id === 'VELVET_CHOKER') newP.maxEnergy += 1;
            if (relic.id === 'WAFFLE') { newP.maxHp += 7; newP.currentHp = newP.maxHp; }
            if (relic.id === 'OLD_COIN') newP.gold += 300;
            if (relic.id === 'MATRYOSHKA') newP.relicCounters['MATRYOSHKA'] = 2;
            if (relic.id === 'HAPPY_FLOWER') newP.relicCounters['HAPPY_FLOWER'] = 0;
            applyExtendedRelicAcquireEffects(newP, relic);
            return { ...prev, player: newP };
        });
        if (gameState.challengeMode === 'COOP') {
            setShopRelics(prev => prev.filter(entry => entry.id !== relic.id));
        }
        storageService.saveUnlockedRelic(relic.id);
    };

    const handleShopBuyPotion = (potion: Potion, replacePotionId?: string) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_SHOP_ACTION', action: 'BUY_POTION', itemId: potion.id, replacePotionId });
            setGameState(prev => {
                if (prev.player.potions.length < getPotionCapacity(prev.player) || replacePotionId) {
                    let price = potion.price || 50;
                    if (prev.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
                    if (raceEffects.shopMarkupUntil > raceEffectNow) price = Math.floor(price * 1.25);
                    let newPotions = [...prev.player.potions];
                    if (replacePotionId) {
                        newPotions = newPotions.filter(pt => pt.id !== replacePotionId);
                    }
                    return { ...prev, player: { ...prev.player, gold: prev.player.gold - price, potions: [...newPotions, { ...potion, id: `buy-pot-${Date.now()}` }] } };
                }
                return prev;
            });
            setShopPotions(prev => prev.filter(entry => entry.id !== potion.id));
            storageService.saveUnlockedPotion(potion.templateId);
            return;
        }
        setGameState(prev => {
            if (prev.player.potions.length < getPotionCapacity(prev.player) || replacePotionId) {
                let price = potion.price || 50;
                if (prev.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
                if (raceEffects.shopMarkupUntil > raceEffectNow) price = Math.floor(price * 1.25);
                let newPotions = [...prev.player.potions];
                if (replacePotionId) {
                    newPotions = newPotions.filter(pt => pt.id !== replacePotionId);
                }
                return { ...prev, player: { ...prev.player, gold: prev.player.gold - price, potions: [...newPotions, { ...potion, id: `buy-pot-${Date.now()}` }] } };
            }
            return prev;
        });
        if (gameState.challengeMode === 'COOP') {
            setShopPotions(prev => prev.filter(entry => entry.id !== potion.id));
        }
        storageService.saveUnlockedPotion(potion.templateId);
    };

    const handleShopRemoveCard = (cardId: string, cost: number) => {
        if (gameState.challengeMode === 'COOP' && coopSession && !coopSession.isHost) {
            p2pService.send({ type: 'COOP_SHOP_ACTION', action: 'REMOVE_CARD', cardId, cost });
            setGameState(prev => {
                const p = prev.player;
                const card = p.deck.find(c => c.id === cardId);
                let newMaxHp = p.maxHp;
                if (card && (card.name === '寄生虫' || card.name === 'PARASITE')) {
                    newMaxHp -= 3;
                }
                const newDeck = p.deck.filter(c => c.id !== cardId);
                const newHp = Math.min(p.currentHp, newMaxHp);
                return { ...prev, player: { ...p, gold: p.gold - cost, deck: newDeck, maxHp: newMaxHp, currentHp: newHp } };
            });
            return;
        }
        setGameState(prev => {
            const p = prev.player;
            const card = p.deck.find(c => c.id === cardId);
            let newMaxHp = p.maxHp;
            if (card && (card.name === '寄生虫' || card.name === 'PARASITE')) {
                newMaxHp -= 3;
            }
            const newDeck = p.deck.filter(c => c.id !== cardId);
            const newHp = Math.min(p.currentHp, newMaxHp);
            return { ...prev, player: { ...p, gold: p.gold - cost, deck: newDeck, maxHp: newMaxHp, currentHp: newHp } };
        });
    };

    const handleShopLeave = () => {
        if (gameState.challengeMode === 'COOP' && coopSession && coopSelfPeerId) {
            setCoopSession(prev => {
                if (!prev) return prev;
                const nextParticipants = prev.participants.map(participant =>
                    participant.peerId === coopSelfPeerId ? { ...participant, shopResolved: true } : participant
                );
                if (prev.isHost) {
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                } else {
                    p2pService.send({ type: 'COOP_SELF_STATE', shopResolved: true });
                }
                return { ...prev, participants: nextParticipants };
            });
            return;
        }
        handleNodeComplete();
    };
    const applyHostCoopBattleSnapshot = useCallback((fromPeerId: string, payload: {
        player: Player,
        cardId?: string,
        playedCard?: ICard,
        enemies?: Enemy[],
        selectedEnemyId?: string | null,
        combatLog?: string[],
        turnLog?: string,
        actingEnemyId?: string | null,
        battleState?: CoopBattleState | null,
        activeEffects?: VisualEffectInstance[]
    }, options?: { advanceTurn?: boolean }) => {
        const activeTurn = gameState.coopBattleState?.turnQueue[gameState.coopBattleState.turnCursor];
        const isRealtimeTurn = gameState.coopBattleState?.battleMode === 'REALTIME' && activeTurn?.type !== 'ENEMY';
        if (!activeTurn || activeTurn.type === 'ENEMY' || (!isRealtimeTurn && activeTurn.peerId !== fromPeerId)) {
            return;
        }
        const previousRemotePlayer = gameState.coopBattleState?.players.find(entry => entry.peerId === fromPeerId)?.player;
        const previousEnemies = gameState.enemies;
        const remoteCoopChainCount = (payload.cardId || payload.playedCard) ? registerCoopChain(fromPeerId) : 0;
        if (remoteCoopChainCount >= 2) {
            appendCoopVfxDebugLog('CARD', `chain:x${remoteCoopChainCount}`);
        }
        upsertCoopPlayerSnapshot(fromPeerId, payload.player);
        const remoteEffects = payload.activeEffects && payload.activeEffects.length > 0
            ? payload.activeEffects
            : inferRemoteCoopBattleEffects(previousRemotePlayer, payload.player, fromPeerId, payload.playedCard, previousEnemies, payload.enemies ?? gameState.enemies);
        const chainEffects = remoteCoopChainCount >= 2
            ? [{ id: `vfx-coop-chain-${Date.now()}`, type: 'SHOCKWAVE' as const, targetId: 'player' as const, ownerPeerId: fromPeerId }]
            : [];
        const nextBattleState = payload.battleState
            ? {
                ...payload.battleState,
                players: payload.battleState.players.map(entry =>
                    entry.peerId === fromPeerId
                        ? { ...entry, player: payload.player, selectedEnemyId: payload.selectedEnemyId ?? entry.selectedEnemyId, isDown: payload.player.currentHp <= 0 }
                        : entry
                )
            }
            : gameState.coopBattleState
                ? {
                    ...gameState.coopBattleState,
                    players: gameState.coopBattleState.players.map(entry =>
                        entry.peerId === fromPeerId
                            ? { ...entry, player: payload.player, selectedEnemyId: payload.selectedEnemyId ?? entry.selectedEnemyId, isDown: payload.player.currentHp <= 0 }
                            : entry
                    )
                }
                : null;
        setGameState(prev => {
            const baseLog = payload.combatLog ?? prev.combatLog;
            const nextCombatLog = remoteCoopChainCount >= 2
                ? [...baseLog, `🤝 連携 x${remoteCoopChainCount}！`].slice(-100)
                : baseLog;
            const nextEffects = [
                ...prev.activeEffects,
                ...remoteEffects,
                ...chainEffects
            ];
            return {
                ...prev,
                enemies: payload.enemies ?? prev.enemies,
                combatLog: nextCombatLog,
                activeEffects: nextEffects,
                coopBattleState: nextBattleState ?? prev.coopBattleState
            };
        });
        if (payload.turnLog !== undefined) setTurnLog(payload.turnLog);
        if (payload.actingEnemyId !== undefined) setActingEnemyId(payload.actingEnemyId ?? null);
        setCoopBattleState(nextBattleState);
        if (remoteEffects.length > 0 || chainEffects.length > 0) {
            if (coopRemoteEffectClearTimerRef.current) {
                window.clearTimeout(coopRemoteEffectClearTimerRef.current);
            }
            coopRemoteEffectClearTimerRef.current = window.setTimeout(() => {
                coopRemoteEffectClearTimerRef.current = null;
                setGameState(prev => ({ ...prev, activeEffects: [] }));
            }, 1200);
        }

        if (payload.enemies) {
            const isHeartTransforming = payload.enemies.some(enemy => enemy.enemyType === 'THE_HEART' && enemy.phase === 1 && enemy.currentHp <= 0);
            if (payload.enemies.length === 0 && !isHeartTransforming) {
                const finisherCard = payload.cardId
                    ? (
                        payload.player.discardPile.find(card => card.id === payload.cardId)
                        || payload.player.exhaustPile.find(card => card.id === payload.cardId)
                        || payload.player.hand.find(card => card.id === payload.cardId)
                        || payload.player.drawPile.find(card => card.id === payload.cardId)
                        || payload.player.deck.find(card => card.id === payload.cardId)
                        || payload.playedCard
                    )
                    : payload.playedCard ?? null;
                if (finisherCard && !battleFinisherCutinCard) {
                    setBattleFinisherCutinCard({ ...finisherCard });
                    if (nextBattleState) {
                        p2pService.send({
                            type: 'COOP_BATTLE_SYNC',
                            battleState: nextBattleState,
                            enemies: payload.enemies,
                            selectedEnemyId: payload.selectedEnemyId,
                            combatLog: payload.combatLog,
                            activeEffects: [...remoteEffects, ...chainEffects],
                            turnLog: payload.turnLog,
                            actingEnemyId: payload.actingEnemyId,
                            finisherCutinCard: { ...finisherCard }
                        });
                    }
                    if (victorySequenceTimerRef.current) {
                        clearTimeout(victorySequenceTimerRef.current);
                    }
                    victorySequenceTimerRef.current = setTimeout(() => {
                        setBattleFinisherCutinCard(null);
                        resolveBattleVictory();
                        victorySequenceTimerRef.current = null;
                    }, COOP_FINISHER_DISPLAY_MS);
                } else {
                    window.setTimeout(() => {
                        resolveBattleVictory();
                    }, 0);
                }
                return;
            }
        }

        if (options?.advanceTurn) {
            if (isRealtimeTurn && nextBattleState) {
                const nextEnded = Array.from(new Set([...(nextBattleState.roundEndedPeerIds || []), fromPeerId]));
                const updatedBattleState: CoopBattleState = { ...nextBattleState, roundEndedPeerIds: nextEnded };
                setCoopBattleState(updatedBattleState);
                const alivePeerIds = updatedBattleState.players.filter(entry => entry.player.currentHp > 0).map(entry => entry.peerId);
                const allEnded = alivePeerIds.every(peerId => nextEnded.includes(peerId));
                if (allEnded) {
                    window.setTimeout(() => {
                        void executeQueuedTurnTransition();
                    }, 0);
                } else {
                    broadcastCoopBattleState(updatedBattleState, {
                        activeEffects: [...gameState.activeEffects, ...remoteEffects, ...chainEffects],
                        enemies: payload.enemies ?? gameState.enemies,
                        selectedEnemyId: payload.selectedEnemyId ?? gameState.selectedEnemyId,
                        combatLog: remoteCoopChainCount >= 2
                            ? [...(payload.combatLog ?? gameState.combatLog), `🤝 連携 x${remoteCoopChainCount}！`].slice(-100)
                            : (payload.combatLog ?? gameState.combatLog),
                        turnLog: payload.turnLog,
                        actingEnemyId: payload.actingEnemyId ?? null
                    });
                }
                return;
            }
            window.setTimeout(() => {
                void executeQueuedTurnTransition();
            }, 0);
        } else if (nextBattleState) {
            broadcastCoopBattleState(nextBattleState, {
                activeEffects: [...gameState.activeEffects, ...remoteEffects, ...chainEffects],
                enemies: payload.enemies ?? gameState.enemies,
                selectedEnemyId: payload.selectedEnemyId ?? gameState.selectedEnemyId,
                combatLog: remoteCoopChainCount >= 2
                    ? [...(payload.combatLog ?? gameState.combatLog), `🤝 連携 x${remoteCoopChainCount}！`].slice(-100)
                    : (payload.combatLog ?? gameState.combatLog),
                turnLog: payload.turnLog,
                actingEnemyId: payload.actingEnemyId ?? null
            });
        }
    }, [appendCoopVfxDebugLog, battleFinisherCutinCard, broadcastCoopBattleState, executeQueuedTurnTransition, gameState.activeEffects, gameState.coopBattleState, gameState.combatLog, gameState.enemies, gameState.selectedEnemyId, inferRemoteCoopBattleEffects, registerCoopChain, resolveBattleVictory, setCoopBattleState, upsertCoopPlayerSnapshot]);
    useEffect(() => {
        if (!coopSession || gameState.challengeMode !== 'COOP' || gameState.screen === GameScreen.COOP_SETUP) return;

        const previousOnData = p2pService.onData;
        p2pService.onData = (data, fromPeerId) => {
            if (data.type === 'COOP_STATE_SYNC_REQUEST' && coopSession.isHost && fromPeerId) {
                sendCoopStateSync();
                return;
            }
            if (data.type === 'COOP_REWARD_SYNC_REQUEST' && coopSession.isHost && fromPeerId) {
                sendCoopRewardSyncToPeer(fromPeerId);
                return;
            }

            if (data.type === 'COOP_STATE_SYNC' && !coopSession.isHost) {
                if (data.aux) {
                    setShopCards(data.aux.shopCards || []);
                    setShopRelics(data.aux.shopRelics || []);
                    setShopPotions(data.aux.shopPotions || []);
                    setTreasureRewards(data.aux.treasureRewards || []);
                    setTreasureOpened(data.aux.treasureOpened || false);
                    setTreasurePools(data.aux.treasurePools || []);
                    if (data.aux.eventData) {
                        setEventData({
                            ...data.aux.eventData,
                            options: (data.aux.eventData.options || []).map(option => ({
                                ...option,
                                action: () => { }
                            }))
                        });
                    } else {
                        setEventData(null);
                    }
                    if (gameState.screen !== GameScreen.EVENT || data.state.screen !== GameScreen.EVENT) {
                        setEventResultLog(data.aux.eventResultLog ?? null);
                    }
                }
                setGameState(prev => {
                    const shouldReleaseInitialMapWait =
                        coopAwaitingMapSync &&
                        COOP_LOCAL_SETUP_SCREEN_SET.has(prev.screen) &&
                        !COOP_LOCAL_SETUP_SCREEN_SET.has(data.state.screen);
                    const preserveLocalScreen =
                        (!shouldReleaseInitialMapWait && shouldPreserveLocalCoopScreen(prev.screen, data.state.screen)) ||
                        (prev.screen === GameScreen.REWARD && prev.rewards.length > 0 && data.state.screen !== GameScreen.REWARD);
                    const preserveLocalRewards =
                        prev.screen === GameScreen.REWARD &&
                        data.state.screen === GameScreen.REWARD &&
                        prev.rewards.length > 0;
                    if (shouldReleaseInitialMapWait) {
                        setCoopAwaitingMapSync(false);
                    }
                    const nextSharedState = applyCoopSharedState(prev, data.state);
                    const normalizedSharedBattleState =
                        data.state.screen === GameScreen.BATTLE
                            ? preserveLocalPlayerInCoopBattleState(nextSharedState.coopBattleState ?? null)
                            : nextSharedState.coopBattleState ?? null;
                    const selfBattleEntry =
                        data.state.screen === GameScreen.BATTLE && coopSelfPeerId
                            ? normalizedSharedBattleState?.players.find(entry => entry.peerId === coopSelfPeerId)
                            : null;
                    const isSameBattle =
                        data.state.screen === GameScreen.BATTLE &&
                        normalizedSharedBattleState?.battleKey === prev.coopBattleState?.battleKey;
                    const nextPlayer =
                        data.state.screen === GameScreen.BATTLE && selfBattleEntry
                            ? preserveLocalBattleCardZones(selfBattleEntry.player, prev.player, { preserveZones: !!isSameBattle })
                            : prev.player;
                    return {
                        ...nextSharedState,
                        player: nextPlayer,
                        selectedEnemyId: selfBattleEntry?.selectedEnemyId ?? nextSharedState.selectedEnemyId,
                        coopBattleState: normalizedSharedBattleState,
                        screen: preserveLocalScreen ? prev.screen : data.state.screen,
                        rewards: (preserveLocalScreen || preserveLocalRewards)
                            ? prev.rewards
                            : (data.state.screen === GameScreen.REWARD ? prev.rewards : [])
                    };
                });
                return;
            }

            if (data.type === 'COOP_PARTICIPANTS') {
                setCoopSession(prev => prev ? { ...prev, participants: data.participants, decisionOwnerIndex: data.decisionOwnerIndex ?? prev.decisionOwnerIndex } : prev);
                return;
            }

            if (data.type === 'COOP_MODE_SET' && !coopSession.isHost) {
                setGameState(prev => ({ ...prev, mode: data.mode, screen: GameScreen.CHARACTER_SELECTION }));
                return;
            }

            if (data.type === 'COOP_CHARACTER_SELECT' && coopSession.isHost && fromPeerId) {
                setCoopSession(prev => {
                    if (!prev) return prev;
                    const nextParticipants = prev.participants.map(participant =>
                        participant.peerId === fromPeerId
                            ? {
                                ...participant,
                                selectedCharacterId: data.characterId,
                                name: data.name,
                                imageData: data.imageData,
                                maxHp: data.maxHp,
                                currentHp: data.currentHp
                            }
                            : participant
                    );
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                    return { ...prev, participants: nextParticipants };
                });
                return;
            }

            if (data.type === 'COOP_SELF_STATE' && coopSession.isHost && fromPeerId) {
                setCoopSession(prev => {
                    if (!prev) return prev;
                    let changed = false;
                    const nextParticipants = prev.participants.map(participant => {
                        if (participant.peerId !== fromPeerId) return participant;
                        const nextParticipant = {
                            ...participant,
                            name: data.name ?? participant.name,
                            imageData: data.imageData ?? participant.imageData,
                            selectedCharacterId: data.selectedCharacterId ?? participant.selectedCharacterId,
                            maxHp: data.maxHp ?? participant.maxHp,
                            currentHp: data.currentHp ?? participant.currentHp,
                            block: data.block ?? participant.block,
                            nextTurnEnergy: data.nextTurnEnergy ?? participant.nextTurnEnergy,
                            strength: data.strength ?? participant.strength,
                            buffer: data.buffer ?? participant.buffer,
                            revivedThisBattle: data.revivedThisBattle ?? participant.revivedThisBattle,
                            quizResolved: data.quizResolved ?? participant.quizResolved,
                            quizCorrectCount: data.quizCorrectCount ?? participant.quizCorrectCount,
                            eventResolved: data.eventResolved ?? participant.eventResolved,
                            restResolved: data.restResolved ?? participant.restResolved,
                            shopResolved: data.shopResolved ?? participant.shopResolved,
                            rewardResolved: data.rewardResolved ?? participant.rewardResolved,
                            treasureResolved: data.treasureResolved ?? participant.treasureResolved,
                            voiceEnabled: data.voiceEnabled ?? participant.voiceEnabled
                        };
                        changed = changed || JSON.stringify(nextParticipant) !== JSON.stringify(participant);
                        return nextParticipant;
                    });
                    if (!changed) return prev;
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                    return { ...prev, participants: nextParticipants };
                });
                return;
            }

            if (data.type === 'COOP_QUIZ_RESULT' && coopSession.isHost && fromPeerId) {
                setCoopSession(prev => {
                    if (!prev) return prev;
                    const nextParticipants = prev.participants.map(participant =>
                        participant.peerId === fromPeerId
                            ? { ...participant, quizResolved: true, quizCorrectCount: data.correctCount }
                            : participant
                    );
                    p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                    return { ...prev, participants: nextParticipants };
                });
                return;
            }

            if (data.type === 'COOP_PLAYER_SNAPSHOT' && coopSession.isHost && fromPeerId) {
                upsertCoopPlayerSnapshot(fromPeerId, data.player);
                setGameState(prev => {
                    if (!prev.coopBattleState) return prev;
                    if (prev.screen === GameScreen.BATTLE) return prev;
                    const hasTargetEntry = prev.coopBattleState.players.some(entry => entry.peerId === fromPeerId);
                    if (!hasTargetEntry) return prev;
                    return {
                        ...prev,
                        coopBattleState: {
                            ...prev.coopBattleState,
                            players: prev.coopBattleState.players.map(entry =>
                                entry.peerId === fromPeerId
                                    ? {
                                        ...entry,
                                        player: data.player,
                                        isDown: data.player.currentHp <= 0
                                    }
                                    : entry
                            )
                        }
                    };
                });
                return;
            }

            if (data.type === 'COOP_BATTLE_FINISH' && !coopSession.isHost) {
                const applyBattleFinish = () => {
                    coopApplyingRemoteBattleSyncRef.current = true;
                    queuedCoopBattleEventRef.current = null;
                    setCoopBattleState(null);
                    setBattleFinisherCutinCard(null);
                    coopRemoteFinisherShownAtRef.current = null;
                    setGameState(prev => ({
                        ...prev,
                        player: buildPostBattlePlayer(prev.player, data.screen !== GameScreen.GAME_OVER),
                        screen: shouldPreserveLocalCoopScreen(prev.screen, data.screen) ? prev.screen : data.screen,
                        enemies: data.enemies ?? prev.enemies,
                        selectedEnemyId: data.selectedEnemyId ?? prev.selectedEnemyId,
                        combatLog: data.combatLog ?? prev.combatLog,
                        coopBattleState: null
                    }));
                    window.setTimeout(() => {
                        coopApplyingRemoteBattleSyncRef.current = false;
                        coopLastBattleActionSignatureRef.current = null;
                        if (queuedCoopBattleEventRef.current) {
                            setQueuedCoopBattleEventTick(prev => prev + 1);
                        }
                    }, 80);
                };
                const finisherShownAt = coopRemoteFinisherShownAtRef.current;
                const finisherActive = !!battleFinisherCutinCardRef.current;
                const elapsed = finisherShownAt ? Date.now() - finisherShownAt : Number.MAX_SAFE_INTEGER;
                const remainingMs = Math.max(0, COOP_FINISHER_DISPLAY_MS - elapsed);
                if (finisherActive && remainingMs > 0) {
                    if (coopRemoteFinisherClearTimerRef.current) {
                        window.clearTimeout(coopRemoteFinisherClearTimerRef.current);
                    }
                    coopRemoteFinisherClearTimerRef.current = window.setTimeout(() => {
                        coopRemoteFinisherClearTimerRef.current = null;
                        applyBattleFinish();
                    }, remainingMs);
                    return;
                }
                applyBattleFinish();
                return;
            }

            if (data.type === 'COOP_BATTLE_SYNC') {
                coopApplyingRemoteBattleSyncRef.current = true;
                const pendingQueuedBattleEvent = queuedCoopBattleEventRef.current;
                setCoopBattleState(data.battleState);
                if (data.battleState) {
                    setCoopSession(prev => {
                        if (!prev) return prev;
                        const nextParticipants = prev.participants.map(participant => {
                            const battleEntry = data.battleState?.players.find(entry => entry.peerId === participant.peerId);
                            if (!battleEntry) return participant;
                            return {
                                ...participant,
                                selectedCharacterId: battleEntry.player.id,
                                imageData: battleEntry.player.imageData,
                                maxHp: battleEntry.player.maxHp,
                                currentHp: battleEntry.player.currentHp,
                                block: battleEntry.player.block,
                                nextTurnEnergy: battleEntry.player.nextTurnEnergy,
                                strength: battleEntry.player.strength,
                                buffer: battleEntry.player.powers['BUFFER'] || 0
                            };
                        });
                        return { ...prev, participants: nextParticipants };
                    });
                }
                if (data.finisherCutinCard) {
                    if (coopRemoteFinisherClearTimerRef.current) {
                        window.clearTimeout(coopRemoteFinisherClearTimerRef.current);
                        coopRemoteFinisherClearTimerRef.current = null;
                    }
                    coopRemoteFinisherShownAtRef.current = Date.now();
                    setBattleFinisherCutinCard(data.finisherCutinCard);
                } else if (battleFinisherCutinCardRef.current && coopRemoteFinisherShownAtRef.current) {
                    const elapsed = Date.now() - coopRemoteFinisherShownAtRef.current;
                    const remainingMs = Math.max(0, COOP_FINISHER_DISPLAY_MS - elapsed);
                    if (remainingMs > 0) {
                        if (coopRemoteFinisherClearTimerRef.current) {
                            window.clearTimeout(coopRemoteFinisherClearTimerRef.current);
                        }
                        coopRemoteFinisherClearTimerRef.current = window.setTimeout(() => {
                            coopRemoteFinisherClearTimerRef.current = null;
                            coopRemoteFinisherShownAtRef.current = null;
                            setBattleFinisherCutinCard(null);
                        }, remainingMs);
                    } else {
                        coopRemoteFinisherShownAtRef.current = null;
                        setBattleFinisherCutinCard(null);
                    }
                } else {
                    coopRemoteFinisherShownAtRef.current = null;
                    setBattleFinisherCutinCard(null);
                }
                if (data.battleState && coopSelfPeerId) {
                    const normalizedBattleState = preserveLocalPlayerInCoopBattleState(data.battleState);
                    const selfBattlePlayer = normalizedBattleState?.players.find(entry => entry.peerId === coopSelfPeerId);
                    if (selfBattlePlayer) {
                        const isRealtimeRound =
                            normalizedBattleState?.battleMode === 'REALTIME' &&
                            normalizedBattleState?.turnQueue[normalizedBattleState.turnCursor]?.type !== 'ENEMY';
                        const isLocalPlayersTurn =
                            !!normalizedBattleState &&
                            (
                                isRealtimeRound ||
                                normalizedBattleState?.turnQueue[normalizedBattleState.turnCursor]?.peerId === coopSelfPeerId
                            );
                        const shouldPreserveLocalPlayer =
                            isLocalPlayersTurn;
                        setGameState(prev => {
                            const isSameBattle = normalizedBattleState?.battleKey === prev.coopBattleState?.battleKey;
                            const canKeepQueuedLocalPlayer = shouldPreserveLocalPlayer && isSameBattle;
                            const mergedLocalPlayer = canKeepQueuedLocalPlayer
                                ? prev.player
                                : preserveLocalBattleCardZones(selfBattlePlayer.player, prev.player, { preserveZones: isSameBattle });
                            return {
                                ...prev,
                                player: mergedLocalPlayer,
                                enemies: data.enemies ?? prev.enemies,
                                selectedEnemyId: selfBattlePlayer.selectedEnemyId ?? prev.selectedEnemyId,
                                combatLog: data.combatLog ?? prev.combatLog,
                                activeEffects: data.activeEffects ?? prev.activeEffects,
                                coopBattleState: normalizedBattleState
                            };
                        });
                    }
                }
                if (data.turnLog !== undefined) setTurnLog(data.turnLog);
                if (data.actingEnemyId !== undefined) setActingEnemyId(data.actingEnemyId);
                window.setTimeout(() => {
                    coopApplyingRemoteBattleSyncRef.current = false;
                    coopLastBattleActionSignatureRef.current = null;
                    if (queuedCoopBattleEventRef.current) {
                        setQueuedCoopBattleEventTick(prev => prev + 1);
                    }
                }, 80);
                return;
            }

            if (data.type === 'COOP_BATTLE_SELECT_ENEMY' && coopSession.isHost && fromPeerId && gameState.screen === GameScreen.BATTLE) {
                const activeTurn = gameState.coopBattleState?.turnQueue[gameState.coopBattleState.turnCursor];
                const isRealtimeTurn = gameState.coopBattleState?.battleMode === 'REALTIME' && activeTurn?.type !== 'ENEMY';
                if (!activeTurn || activeTurn.type === 'ENEMY' || (!isRealtimeTurn && activeTurn.peerId !== fromPeerId)) {
                    return;
                }
                const nextBattleState = gameState.coopBattleState
                    ? {
                        ...gameState.coopBattleState,
                        players: gameState.coopBattleState.players.map(entry =>
                            entry.peerId === fromPeerId
                                ? { ...entry, selectedEnemyId: data.enemyId }
                                : entry
                        )
                    }
                    : null;
                setGameState(prev => ({
                    ...prev,
                    coopBattleState: nextBattleState ?? prev.coopBattleState
                }));
                if (nextBattleState) {
                    setCoopBattleState(nextBattleState);
                    p2pService.send({
                        type: 'COOP_BATTLE_SYNC',
                        battleState: nextBattleState,
                        selectedEnemyId: gameState.selectedEnemyId
                    });
                }
                return;
            }

            if (data.type === 'COOP_BATTLE_PLAY_CARD' && coopSession.isHost && fromPeerId && gameState.screen === GameScreen.BATTLE) {
                coopLastBattleCardEventAtRef.current = Date.now();
                appendCoopVfxDebugLog('CARD', `remote:${data.playedCard?.name ?? data.cardId}`);
                applyHostCoopBattleSnapshot(fromPeerId, data);
                return;
            }

            if (data.type === 'COOP_BATTLE_USE_POTION' && coopSession.isHost && fromPeerId && gameState.screen === GameScreen.BATTLE) {
                applyHostCoopBattleSnapshot(fromPeerId, data);
                return;
            }

            if ((data.type === 'COOP_BATTLE_TURN_START' || data.type === 'COOP_BATTLE_SELECTION_STATE' || data.type === 'COOP_BATTLE_MODAL_RESOLVE' || data.type === 'COOP_BATTLE_CODEX_SELECT') && coopSession.isHost && fromPeerId && gameState.screen === GameScreen.BATTLE) {
                applyHostCoopBattleSnapshot(fromPeerId, data);
                return;
            }

            if (data.type === 'COOP_END_TURN' && coopSession.isHost && fromPeerId && gameState.screen === GameScreen.BATTLE) {
                applyHostCoopBattleSnapshot(fromPeerId, data, { advanceTurn: true });
                return;
            }

            if (data.type === 'COOP_NODE_SELECT' && coopSession.isHost && fromPeerId && gameState.screen === GameScreen.MAP) {
                const sender = coopSession.participants.find(participant => participant.peerId === fromPeerId);
                const requestedNode = gameState.map.find(node => node.id === data.nodeId);
                const currentNode = gameState.currentMapNodeId
                    ? gameState.map.find(node => node.id === gameState.currentMapNodeId)
                    : null;
                const allowedNodeIds = currentNode
                    ? currentNode.nextNodes
                    : gameState.map.filter(node => node.y === 0).map(node => node.id);

                if (sender && requestedNode && allowedNodeIds.includes(requestedNode.id)) {
                    void handleNodeSelect(requestedNode, true);
                }
                return;
            }

            if (data.type === 'COOP_REWARD_SELECT' && coopSession.isHost && gameState.screen === GameScreen.REWARD) {
                const rewardSet = fromPeerId ? coopRewardSets[fromPeerId] || [] : gameState.rewards;
                const targetReward = rewardSet.find(reward => reward.id === data.rewardId) ?? data.item;
                if (targetReward) {
                    if (fromPeerId) {
                        const nextRewardSet = removeRewardFromList(rewardSet, targetReward);
                        setCoopRewardSets(prev => ({
                            ...prev,
                            [fromPeerId]: nextRewardSet
                        }));
                        const rewardResolved = nextRewardSet.length === 0;
                        if (rewardResolved) {
                            setCoopSession(prev => {
                                if (!prev) return prev;
                                const nextParticipants = prev.participants.map(participant =>
                                    participant.peerId === fromPeerId
                                        ? { ...participant, rewardResolved: true }
                                        : participant
                                );
                                p2pService.send({ type: 'COOP_PARTICIPANTS', participants: nextParticipants, decisionOwnerIndex: prev.decisionOwnerIndex });
                                return { ...prev, participants: nextParticipants };
                            });
                        }
                        const grantedItem = targetReward.type === 'COOP_SUPPORT'
                            ? { ...targetReward, value: createCoopSupportInstance(targetReward.value as CoopSupportCard) }
                            : targetReward;
                        if (targetReward.type === 'COOP_SUPPORT') {
                            p2pService.sendTo(fromPeerId, {
                                type: 'COOP_SUPPORT_GRANT',
                                rewardId: targetReward.id,
                                card: grantedItem.value as CoopSupportCard,
                                rewards: nextRewardSet,
                                rewardResolved
                            });
                        } else {
                            p2pService.sendTo(fromPeerId, {
                                type: 'COOP_REWARD_GRANT',
                                item: grantedItem,
                                replacePotionId: data.replacePotionId,
                                rewards: nextRewardSet,
                                rewardResolved
                            });
                        }
                        return;
                    }
                    handleRewardSelection(targetReward, data.replacePotionId);
                }
                return;
            }

            if (data.type === 'COOP_REWARD_SYNC') {
                setCoopAwaitingRewardSync(false);
                if (coopSelfPeerId) {
                    setCoopSession(prev => prev ? {
                        ...prev,
                        participants: prev.participants.map(participant =>
                            participant.peerId === coopSelfPeerId
                                ? { ...participant, rewardResolved: false }
                                : participant
                        )
                    } : prev);
                }
                setGameState(prev => ({
                    ...prev,
                    rewards: data.rewards
                }));
                return;
            }

            if (data.type === 'COOP_REWARD_SKIP' && coopSession.isHost && gameState.screen === GameScreen.REWARD) {
                finishRewardPhase();
                return;
            }

            if (data.type === 'COOP_SUPPORT_GRANT') {
                setCoopSupportCards(prevCards => [...prevCards, data.card]);
                setGameState(prev => ({
                    ...prev,
                    rewards: data.rewards ?? prev.rewards.filter(reward => reward.id !== data.rewardId)
                }));
                if (typeof data.rewardResolved === 'boolean' && coopSelfPeerId) {
                    setCoopSession(prev => prev ? {
                        ...prev,
                        participants: prev.participants.map(participant =>
                            participant.peerId === coopSelfPeerId
                                ? { ...participant, rewardResolved: data.rewardResolved }
                                : participant
                        )
                    } : prev);
                }
                return;
            }

            if (data.type === 'COOP_REWARD_GRANT') {
                applyRewardToLocalPlayer(data.item, data.replacePotionId, data.rewards);
                if (typeof data.rewardResolved === 'boolean' && coopSelfPeerId) {
                    setCoopSession(prev => prev ? {
                        ...prev,
                        participants: prev.participants.map(participant =>
                            participant.peerId === coopSelfPeerId
                                ? { ...participant, rewardResolved: data.rewardResolved }
                                : participant
                        )
                    } : prev);
                }
                return;
            }

            if (data.type === 'COOP_TREASURE_GRANT') {
                if (data.player) {
                    applyCoopPlayerStateToPeer(coopSelfPeerId, data.player);
                } else {
                    setGameState(prev => ({
                        ...prev,
                        player: applyTreasureRewardsToPlayer(prev.player, data.rewards, !!data.addCurse)
                    }));
                }
                return;
            }

            if (data.type === 'COOP_TREASURE_CLAIM' && coopSession.isHost && gameState.screen === GameScreen.TREASURE && fromPeerId) {
                claimCoopTreasurePoolForPeer(fromPeerId, data.poolId);
                return;
            }

            if (data.type === 'COOP_EVENT_OPTION' && coopSession.isHost && gameState.screen === GameScreen.EVENT && eventData) {
                if (!fromPeerId) return;
                const sourcePlayer = fromPeerId === coopSelfPeerId
                    ? gameState.player
                    : coopPlayerSnapshots[fromPeerId];
                if (!sourcePlayer) return;
                resolveCoopEventOptionForPlayer(sourcePlayer, data.optionIndex, (nextPlayer, resultLog) => {
                    if (fromPeerId === coopSelfPeerId) {
                        applyCoopPlayerStateToPeer(coopSelfPeerId, nextPlayer);
                        setEventResultLog(resultLog);
                        return;
                    }
                    applyCoopPlayerStateToPeer(fromPeerId, nextPlayer);
                    p2pService.sendTo(fromPeerId, { type: 'COOP_EVENT_RESULT', player: nextPlayer, resultLog });
                });
                return;
            }

            if (data.type === 'COOP_EVENT_RESULT' && !coopSession.isHost) {
                applyCoopPlayerStateToPeer(coopSelfPeerId, data.player);
                setEventResultLog(data.resultLog);
                return;
            }

            if (data.type === 'COOP_REST_ACTION' && coopSession.isHost && gameState.screen === GameScreen.REST) {
                // Intentional no-op:
                // REST choices are local to each player and only completion state (restResolved) is synchronized.
                // If future requirements need cross-player visualization of selected rest actions, implement handling here.
                return;
            }

            if (data.type === 'COOP_SHOP_ACTION' && coopSession.isHost && gameState.screen === GameScreen.SHOP) {
                if (data.action === 'BUY_CARD' && data.itemId) {
                    setShopCards(prev => prev.filter(entry => entry.id !== data.itemId));
                }
                if (data.action === 'BUY_RELIC' && data.itemId) {
                    setShopRelics(prev => prev.filter(entry => entry.id !== data.itemId));
                }
                if (data.action === 'BUY_POTION' && data.itemId) {
                    setShopPotions(prev => prev.filter(entry => entry.id !== data.itemId));
                }
                return;
            }

            if (data.type === 'COOP_SUPPORT_USE' && coopSession.isHost && fromPeerId && gameState.screen === GameScreen.BATTLE) {
                applyCoopSupportEffect({
                    id: data.cardId,
                    effectId: data.effectId,
                    name: data.name,
                    description: data.description,
                    rarity: data.rarity as CoopSupportCard['rarity']
                }, data.targetPeerId, fromPeerId);
            }
        };

        return () => {
            p2pService.onData = previousOnData;
        };
    }, [applyCoopPlayerStateToPeer, applyCoopSharedState, applyCoopSupportEffect, applyHostCoopBattleSnapshot, applyRestAction, applyRewardToLocalPlayer, applySynthesizeCard, applyTreasureRewardsToPlayer, applyUpgradeCard, broadcastCoopBattleState, claimCoopTreasurePoolForPeer, coopPlayerSnapshots, coopRewardSets, coopSelfPeerId, coopSession, eventData, executeQueuedTurnTransition, gameState.challengeMode, gameState.coopBattleState, gameState.map, gameState.player, gameState.rewards, gameState.screen, handleNodeComplete, handleNodeSelect, handleShopBuyCard, handleShopBuyPotion, handleShopBuyRelic, handleShopLeave, handleShopRemoveCard, handleTreasureOpen, preserveLocalBattleCardZones, preserveLocalPlayerInCoopBattleState, removeRewardFromList, resolveBattleVictory, resolveCoopEventOptionForPlayer, sendCoopRewardSyncToPeer, sendCoopStateSync, setCoopBattleState, shopCards, shopPotions, shopRelics, treasurePools, turnLog, upsertCoopPlayerSnapshot]);

    const goToFloorResult = () => {
        // 未解放のカードがあれば1枚解放する
        const unlockedCard = unlockRandomAdditionalCard();
        setGameState(prev => ({
            ...prev,
            screen: GameScreen.FLOOR_RESULT,
            newlyUnlockedCardName: unlockedCard?.name
        }));
    };

    // 既存の finishRewardPhase を修正して goToFloorResult を呼ぶようにする
    const handleRewardSelectionAndFinish = (item: RewardItem, replacePotionId?: string) => {
        handleRewardSelection(item, replacePotionId);
        // カードを選択し終えたらチェック
        const nextState = stateRef.current;
        if (nextState.rewards.every(r => r.type === 'CARD')) {
            // すべて選択済みなら
            // ... (App.tsxの他の箇所でfinishRewardPhaseが呼ばれる想定)
        }
    };

    const miniGame = MINI_GAMES.find(g => g.screen === gameState.screen);
    const showGlobalSettingsGear = false;

    const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
        if (key === 'bgmMode') {
            const mode = value as AppSettings['bgmMode'];
            setBgmMode(mode);
            audioService.setBgmMode(mode);
            storageService.saveBgmMode(mode);
        }
        if (key === 'micEnabled') {
            const enabled = value as boolean;
            setCoopVoiceEnabled(enabled);
            p2pService.setVoiceEnabled(enabled).catch(() => undefined);
        }
        if (key === 'remoteVoiceVolume') {
            const volume = Math.max(0, Math.min(1, value as number));
            document.querySelectorAll('audio[data-peer-id]').forEach(element => {
                (element as HTMLAudioElement).volume = volume;
            });
        }
        if (key === 'selectedInputDeviceId' || key === 'echoCancellation' || key === 'noiseSuppression' || key === 'autoGainControl') {
            const next = {
                ...appSettings,
                [key]: value
            };
            p2pService.configureVoice({
                deviceId: next.selectedInputDeviceId || undefined,
                echoCancellation: next.echoCancellation,
                noiseSuppression: next.noiseSuppression,
                autoGainControl: next.autoGainControl
            }).catch(() => undefined);
        }
    }, []);

    const resetAudioSettings = useCallback(() => {
        setAppSettings(prev => ({
            ...prev,
            bgmMode: DEFAULT_APP_SETTINGS.bgmMode,
            bgmVolume: DEFAULT_APP_SETTINGS.bgmVolume,
            seVolume: DEFAULT_APP_SETTINGS.seVolume,
            micEnabled: DEFAULT_APP_SETTINGS.micEnabled,
            micSensitivity: DEFAULT_APP_SETTINGS.micSensitivity,
            pushToTalk: DEFAULT_APP_SETTINGS.pushToTalk,
            selectedInputDeviceId: DEFAULT_APP_SETTINGS.selectedInputDeviceId,
            noiseSuppression: DEFAULT_APP_SETTINGS.noiseSuppression,
            echoCancellation: DEFAULT_APP_SETTINGS.echoCancellation,
            autoGainControl: DEFAULT_APP_SETTINGS.autoGainControl
        }));
        setCoopVoiceEnabled(false);
        p2pService.setVoiceEnabled(false).catch(() => undefined);
    }, []);

    const resetAllSettings = useCallback(() => {
        setAppSettings(DEFAULT_APP_SETTINGS);
        setCoopVoiceEnabled(DEFAULT_APP_SETTINGS.micEnabled);
        setBgmMode(DEFAULT_APP_SETTINGS.bgmMode);
        audioService.setBgmMode(DEFAULT_APP_SETTINGS.bgmMode);
        audioService.setBgmVolume(DEFAULT_APP_SETTINGS.bgmVolume);
        audioService.setSfxVolume(DEFAULT_APP_SETTINGS.seVolume);
        p2pService.setVoiceEnabled(DEFAULT_APP_SETTINGS.micEnabled).catch(() => undefined);
    }, []);

    return (
        <div className={`w-full h-[100dvh] bg-black overflow-hidden ${appSettings.fontSize === 'large' ? 'text-[105%]' : ''}`}>
            <div className={`w-full h-full relative overflow-hidden bg-black ${appSettings.lowDataMode ? '' : 'crt-scanline'} ${raceEffects.upsideDownUntil > raceEffectNow ? 'scale-x-[-1]' : ''} ${(raceEffects.deskShakeUntil > raceEffectNow && !appSettings.reduceScreenShake) ? 'animate-[race-desk-shake_0.18s_linear_infinite]' : ''}`}>
                <style>{`
                    @keyframes race-desk-shake {
                        0% { transform: translate(0, 0); }
                        20% { transform: translate(-3px, 1px); }
                        40% { transform: translate(2px, -1px); }
                        60% { transform: translate(-2px, 2px); }
                        80% { transform: translate(3px, -1px); }
                        100% { transform: translate(0, 0); }
                    }
                `}</style>

                {showGlobalSettingsGear && gameState.screen !== GameScreen.START_MENU && (
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="absolute top-2 right-2 z-[10010] bg-black/60 hover:bg-black/85 text-white border border-white/50 p-2 rounded-lg shadow-lg"
                        title="セッティング"
                    >
                        <Settings size={16} />
                    </button>
                )}

                {showTimeLimitModal && (
                    <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-gray-900 border-4 border-red-600 p-8 rounded-2xl max-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.5)] text-center transform scale-110">
                            <TimerOff size={64} className="text-red-500 mx-auto mb-6 animate-pulse" />
                            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">時間切れ！</h2>
                            <p className="text-gray-300 mb-8 leading-relaxed font-bold">
                                本日の冒険時間は終了しました。<br />
                                勉強の時間です！<br />
                                <span className="text-emerald-400">「問題チャレンジ」</span>で脳を鍛えましょう。
                            </p>
                            <button
                                onClick={() => setShowTimeLimitModal(false)}
                                className="bg-white text-black w-full py-4 rounded-xl font-black text-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={24} /> わかった！
                            </button>
                        </div>
                    </div>
                )}

                {showStartOverConfirm && (
                    <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-gray-900 border-4 border-yellow-500 p-8 rounded-2xl max-sm w-full max-w-md shadow-[0_0_50px_rgba(234,179,8,0.35)] text-center">
                            <AlertTriangle size={64} className="text-yellow-400 mx-auto mb-6 animate-pulse" />
                            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">{trans("続きデータがあります", languageMode)}</h2>
                            <p className="text-gray-300 mb-8 leading-relaxed font-bold">
                                {trans("冒険を最初から始めると、", languageMode)}<br />
                                {trans("今の続きデータは上書きされます。", languageMode)}<br />
                                {trans("本当に新しく始めますか？", languageMode)}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={continueGame}
                                    className="bg-blue-600 text-white w-full py-4 rounded-xl font-black text-lg hover:bg-blue-500 transition-all"
                                >
                                    {trans("続きから遊ぶ", languageMode)}
                                </button>
                                <button
                                    onClick={confirmStartOver}
                                    className="bg-yellow-400 text-black w-full py-4 rounded-xl font-black text-lg hover:bg-yellow-300 transition-all"
                                >
                                    {trans("最初から始める", languageMode)}
                                </button>
                                <button
                                    onClick={() => setShowStartOverConfirm(false)}
                                    className="bg-gray-700 text-white w-full py-3 rounded-xl font-bold hover:bg-gray-600 transition-all"
                                >
                                    {trans("やめる", languageMode)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {gameState.screen === GameScreen.START_MENU && (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        {isLegacyVercelHost && showMigrationNotice && (
                            <div className="fixed inset-0 z-[10001] bg-black/80 flex items-center justify-center p-3 sm:p-4">
                                <div
                                    className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-2xl border-4 border-cyan-400 bg-slate-950 text-center shadow-[0_0_60px_rgba(34,211,238,0.3)] overscroll-contain"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="px-4 py-5 sm:px-6 sm:py-7">
                                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-500/10 sm:mb-4 sm:h-16 sm:w-16">
                                            <Globe size={isMobilePortrait ? 28 : 34} className="text-cyan-300" />
                                        </div>
                                        <h2 className="mb-3 text-xl font-black tracking-tight text-white sm:text-2xl">
                                            {trans("サイト移転のお知らせ", languageMode)}
                                        </h2>
                                        <p className="mb-3 text-sm font-bold leading-6 text-slate-200 sm:leading-7">
                                            {trans("現在のVercel版ではなく、新しい公開先からアクセスしてください。", languageMode)}
                                        </p>
                                        <p className="mb-4 text-sm leading-6 text-slate-300 sm:mb-5 sm:leading-7">
                                            {trans("今後は下記URLが最新の公開先です。ブックマークの更新をお願いします。", languageMode)}
                                        </p>
                                        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-3 text-left sm:mb-5 sm:px-4 sm:py-4">
                                            <div className="mb-2 text-sm font-black text-amber-200">
                                                {trans("データを引き継ぐ場合は、次の手順で移行してください。", languageMode)}
                                            </div>
                                            <div className="text-sm leading-6 text-amber-50 sm:leading-7">
                                                <div>{trans("1. このサイトで「データ移行」を開き、エクスポートします。", languageMode)}</div>
                                                <div>{trans("2. 新しいサイトへ移動して、「データ移行」でインポートします。", languageMode)}</div>
                                            </div>
                                            <div className="mt-2 text-xs font-bold leading-5 text-amber-300">
                                                {trans("旧サイトのデータは新サイトへ自動では引き継がれません。", languageMode)}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-cyan-500/40 bg-black/40 px-3 py-3 text-left text-[11px] font-mono text-cyan-200 break-all sm:px-4 sm:text-xs">
                                            {PRIMARY_SITE_URL}
                                        </div>
                                        <div className="mt-4 border-t border-slate-800 pt-4 sm:mt-5 sm:pt-5">
                                            <div className="flex flex-col gap-2 sm:gap-3">
                                                <button
                                                    onClick={() => {
                                                        setShowMigrationNotice(false);
                                                        openDataTransferModal();
                                                    }}
                                                    className="w-full rounded-xl border border-amber-400 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-100 transition-colors hover:bg-amber-500/20"
                                                >
                                                    {trans("データ移行を開く", languageMode)}
                                                </button>
                                                <button
                                                    onClick={handleMoveToPrimarySite}
                                                    className="w-full rounded-xl border-b-4 border-r-4 border-cyan-300 bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-cyan-400 sm:py-4 sm:text-base"
                                                >
                                                    {trans("新しいサイトへ移動する", languageMode)}
                                                </button>
                                                <button
                                                    onClick={() => setShowMigrationNotice(false)}
                                                    className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700"
                                                >
                                                    {trans("このまま続ける", languageMode)}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="absolute top-2 right-2 z-[10010] flex items-center gap-1.5 sm:gap-2">
                            <button
                                onClick={toggleBgmMode}
                                className={`flex h-9 items-center border-t-2 border-l-2 border-r-4 border-b-4 px-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.08em] shadow-[0_0_0_1px_rgba(0,0,0,0.45)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:border-r-2 active:border-b-2 ${
                                    bgmMode === 'STUDY'
                                        ? 'bg-indigo-950/95 text-indigo-200 border-t-indigo-300 border-l-indigo-300 border-r-indigo-700 border-b-indigo-700'
                                        : bgmMode === 'MP3'
                                            ? 'bg-emerald-950/95 text-emerald-200 border-t-emerald-300 border-l-emerald-300 border-r-emerald-700 border-b-emerald-700'
                                            : 'bg-cyan-950/95 text-cyan-100 border-t-cyan-300 border-l-cyan-300 border-r-cyan-700 border-b-cyan-700'
                                }`}
                                title="BGMモード切替"
                            >
                                <Music size={13} className="mr-1 shrink-0" />
                                {trans(
                                    bgmMode === 'STUDY'
                                        ? 'BGM: 学習'
                                        : bgmMode === 'MP3'
                                            ? 'BGM: MP3'
                                            : 'BGM: 電子音',
                                    languageMode
                                )}
                            </button>
                            <button
                                onClick={toggleLanguage}
                                className="flex h-9 items-center border-t-2 border-l-2 border-r-4 border-b-4 border-t-amber-200 border-l-amber-200 border-r-amber-700 border-b-amber-700 bg-amber-950/95 px-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.08em] text-amber-100 shadow-[0_0_0_1px_rgba(0,0,0,0.45)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:border-r-2 active:border-b-2"
                                title="言語切替"
                            >
                                <Languages size={13} className="mr-1 shrink-0" />
                                {languageMode === 'JAPANESE' ? 'にほんご' : '日本語'}
                            </button>
                            <button
                                onClick={() => setShowSettingsModal(true)}
                                className="flex h-9 w-9 items-center justify-center border-t-2 border-l-2 border-r-4 border-b-4 border-t-slate-200 border-l-slate-200 border-r-slate-700 border-b-slate-700 bg-slate-900/95 text-slate-100 shadow-[0_0_0_1px_rgba(0,0,0,0.45)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:border-r-2 active:border-b-2"
                                title="セッティング"
                            >
                                <Settings size={16} />
                            </button>
                        </div>

                        <div className="absolute bottom-2 left-2 z-9999 text-gray-500 text-[10px] font-mono flex flex-col gap-0.5">
                            <div>TOTAL TIME: {formatTime(totalPlaySeconds)}</div>
                            <div className={isDailyLimitReached ? "text-red-500 font-bold" : ""}>
                                DAILY: {formatTime(dailyPlaySeconds)} / {formatTime(PLAY_LIMIT_SECONDS)}
                            </div>
                        </div>

                        <div className="text-center p-8 w-full flex flex-col items-center">
                            <h1
                                className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-600 mb-8 font-bold animate-pulse tracking-widest leading-tight cursor-pointer select-none"
                                onClick={handleTitleClick}
                            >
                                {trans("学習ローグ", languageMode)}
                            </h1>

                            <div className="mb-6 bg-black/40 px-4 py-2 rounded-lg border border-gray-600">
                                {isDailyLimitReached ? (
                                    <div className="text-red-500 text-xs md:text-sm font-bold animate-pulse flex items-center gap-2">
                                        <AlertTriangle size={16} /> {trans("本日のプレイ制限に達しました。問題チャレンジで勉強しましょう！", languageMode)}
                                    </div>
                                ) : nextThreshold ? (
                                    <div className="text-yellow-300 text-xs md:text-sm font-bold">
                                        {trans("次のミニゲーム開放まで", languageMode)}: <span className="text-xl md:text-2xl text-white mx-1">{Math.max(0, nextThreshold - totalMathCorrect)}</span> {trans("問正解", languageMode)}
                                    </div>
                                ) : (
                                    <div className="text-green-400 text-xs md:text-sm font-bold animate-pulse">{trans("全ミニゲーム開放済み！", languageMode)}</div>
                                )}
                                <div className="text-gray-500 text-[10px] mt-1">{trans("累計正解数", languageMode)}: {totalMathCorrect}{trans("問", languageMode)}</div>
                            </div>

                            {isMathDebugSkipped && (
                                <button
                                    type="button"
                                    onClick={disableMathDebugSkip}
                                    className="text-red-500 font-bold mb-1 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse cursor-pointer"
                                >
                                    {trans("(デバッグ: けいさん スキップ ON)", languageMode)}
                                </button>
                            )}
                            {isDebugHpOne && (
                                <button
                                    type="button"
                                    onClick={disableDebugHpOne}
                                    className="text-red-500 font-bold mb-6 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse cursor-pointer"
                                >
                                    {trans("(デバッグ: てきHP1 & ぜんかいほう ON)", languageMode)}
                                </button>
                            )}
                            {(!isMathDebugSkipped && !isDebugHpOne) && <div className="mb-2 h-2"></div>}

                            <div className="flex flex-col gap-3 items-center w-full max-w-[320px]">
                                {hasSave && (
                                    <>
                                        <div className="text-[10px] text-red-400 font-bold animate-pulse mb-[-8px]">
                                            ※ゲームがフリーズする場合、冒険を始めるからやり直してください
                                        </div>
                                        <button
                                            onClick={continueGame}
                                            className={`w-full py-2 px-4 text-lg font-bold border-b-4 border-r-4 rounded-none cursor-pointer flex items-center justify-center shadow-lg relative group overflow-hidden animate-in fade-in ${isDailyLimitReached ? 'bg-gray-800 border-gray-700 text-gray-500 grayscale opacity-70' : 'bg-blue-900 text-white border-blue-400 hover:bg-blue-800'}`}
                                        >
                                            {!isDailyLimitReached && <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>}
                                            <Play className="mr-2 fill-current" /> {trans("つづきから", languageMode)}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={startGame}
                                    disabled={isLoading}
                                    className={`w-full py-2 px-4 text-lg font-bold border-b-4 border-r-4 rounded-none transition-all shadow-lg flex items-center justify-center ${isDailyLimitReached ? 'bg-gray-800 border-gray-700 text-gray-500 grayscale opacity-70' : 'bg-gray-100 text-black border-gray-500 hover:bg-white hover:border-gray-400 hover:translate-x-[1px] hover:translate-y-[1px] active:border-0 active:translate-y-[4px] active:translate-x-[4px]'}`}
                                >
                                    {isLoading ? trans("じゅんびちゅう...", languageMode) : trans("冒険を始める", languageMode)}
                                </button>

                                <div className={`grid w-full ${isMobilePortrait ? 'grid-cols-4 gap-1' : 'grid-cols-2 sm:grid-cols-4 gap-2'}`}>
                                    <button
                                        onClick={startChallengeGame}
                                        className={`min-w-0 border-b-4 border-r-4 rounded-none transition-all shadow-md flex items-center justify-center ${isMobilePortrait ? 'py-1.5 px-0.5 text-[10px]' : 'py-2 px-1 text-xs'} font-bold ${isDailyLimitReached ? 'bg-gray-800 border-gray-700 text-gray-500 grayscale opacity-70' : 'bg-red-900/80 text-red-100 border-red-500 hover:bg-red-800 hover:shadow-red-900/50'}`}
                                    >
                                        <Swords className={isMobilePortrait ? 'mr-0.5' : 'mr-1'} size={isMobilePortrait ? 12 : 14} /> {trans("1A1D", languageMode)}
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (isDailyLimitReached) {
                                                audioService.playSound('wrong');
                                                setShowTimeLimitModal(true);
                                                return;
                                            }
                                            setGameState(prev => ({ ...prev, screen: GameScreen.VS_SETUP }));
                                        }}
                                        className={`min-w-0 border-b-4 border-r-4 rounded-none bg-indigo-600/80 text-white border-indigo-400 hover:bg-indigo-700 cursor-pointer flex items-center justify-center shadow-md ${isMobilePortrait ? 'py-1.5 px-0.5 text-[10px]' : 'py-2 px-1 text-xs'} font-bold ${isDailyLimitReached ? 'grayscale opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Wifi className={isMobilePortrait ? 'mr-0.5' : 'mr-1'} size={isMobilePortrait ? 12 : 14} /> {trans("VS", languageMode)}
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (isDailyLimitReached) {
                                                audioService.playSound('wrong');
                                                setShowTimeLimitModal(true);
                                                return;
                                            }
                                            setGameState(prev => ({ ...prev, screen: GameScreen.COOP_SETUP }));
                                        }}
                                        className={`min-w-0 border-b-4 border-r-4 rounded-none bg-emerald-700/80 text-emerald-100 border-emerald-400 hover:bg-emerald-700 cursor-pointer flex items-center justify-center shadow-md ${isMobilePortrait ? 'py-1.5 px-0.5 text-[10px]' : 'py-2 px-1 text-xs'} font-bold ${isDailyLimitReached ? 'grayscale opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Users className={isMobilePortrait ? 'mr-0.5' : 'mr-1'} size={isMobilePortrait ? 12 : 14} /> {trans("協力", languageMode)}
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (isDailyLimitReached) {
                                                audioService.playSound('wrong');
                                                setShowTimeLimitModal(true);
                                                return;
                                            }
                                            setGameState(prev => ({ ...prev, screen: GameScreen.RACE_SETUP }));
                                        }}
                                        className={`min-w-0 border-b-4 border-r-4 rounded-none bg-cyan-700/80 text-cyan-100 border-cyan-400 hover:bg-cyan-700 cursor-pointer flex items-center justify-center shadow-md ${isMobilePortrait ? 'py-1.5 px-0.5 text-[10px]' : 'py-2 px-1 text-xs'} font-bold ${isDailyLimitReached ? 'grayscale opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Flag className={isMobilePortrait ? 'mr-0.5' : 'mr-1'} size={isMobilePortrait ? 12 : 14} /> {trans("レース", languageMode)}
                                    </button>
                                </div>

                                {!isMobilePortrait && (
                                    <button
                                        onClick={startTypingGame}
                                        className="w-full py-2 px-4 text-sm font-bold border-b-4 border-r-4 rounded-none transition-all shadow-md flex items-center justify-center bg-amber-900/80 text-amber-100 border-amber-500 hover:bg-amber-800 hover:shadow-amber-900/50"
                                    >
                                        <Keyboard className="mr-2" size={18} /> {trans("タイピングモード", languageMode)}
                                    </button>
                                )}

                                <div className="flex gap-3 w-full">
                                    <button onClick={startProblemChallenge} className="flex-1 py-2 px-2 text-sm font-bold border-b-4 border-r-4 rounded-none bg-emerald-900/80 text-emerald-100 border-emerald-500 hover:bg-emerald-800 cursor-pointer flex items-center justify-center shadow-md hover:shadow-emerald-900/50">
                                        <GraduationCap className="mr-1.5" size={18} /> {trans("問題", languageMode)}
                                    </button>

                                    <button
                                        onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_SELECT }))}
                                        className={`flex-1 py-2 px-2 text-sm font-bold border-b-4 border-r-4 rounded-none transition-all shadow-md flex items-center justify-center ${isDailyLimitReached ? 'bg-gray-800 border-gray-700 text-gray-500 grayscale opacity-70' : 'bg-indigo-900/80 text-indigo-100 border-indigo-500 hover:bg-indigo-800 hover:shadow-indigo-900/50'}`}
                                    >
                                        <Gamepad2 className="mr-1.5" size={18} /> {trans("ミニゲーム", languageMode)}
                                    </button>
                                </div>

                                {isDebugHpOne && (
                                    <button onClick={openDebugMenu} className="w-full py-2 px-4 text-base font-bold border-b-4 border-r-4 rounded-none bg-gray-800 text-red-400 border-red-500 hover:bg-gray-700 cursor-pointer flex items-center justify-center shadow-md mb-2">
                                        <Zap size={18} className="mr-2" /> {trans("デバッグメニュー", languageMode)}
                                    </button>
                                )}

                                <div className="flex gap-2 w-full justify-between mt-2">
                                    <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.COMPENDIUM }))} className="flex-1 bg-gray-800 text-amber-500 text-xs font-bold border-b-4 border-r-4 border-gray-600 hover:border-amber-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                        <BookOpen className="mb-1" size={20} /> {trans("図鑑", languageMode)}
                                    </button>
                                    <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.RANKING }))} className="flex-1 bg-gray-800 text-green-500 text-xs font-bold border-b-4 border-r-4 border-gray-600 border-green-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                        <Trophy className="mb-1" size={20} /> {trans("記録", languageMode)}
                                    </button>
                                    <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.HELP }))} className="flex-1 bg-gray-800 text-blue-400 text-xs font-bold border-b-4 border-r-4 border-gray-600 border-blue-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                        <HelpCircle className="mb-1" size={20} /> {trans("遊び方", languageMode)}
                                    </button>
                                </div>

                                <button onClick={openDataTransferModal} className="w-full bg-gray-800 text-cyan-300 py-2 text-sm font-bold border-b-4 border-r-4 border-gray-600 border-cyan-500 hover:bg-gray-700 cursor-pointer flex items-center justify-center rounded mt-2">
                                    <Globe className="mr-2" size={18} /> {trans("データ移行", languageMode)}
                                </button>

                                <button onClick={() => setShowDebugLog(true)} className="text-gray-600 text-[10px] hover:text-gray-400 mt-2 flex items-center justify-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                    <Terminal size={10} /> v1.0.4 YUSUKE ISHIGE
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showDataTransferModal && (
                    <div className="fixed inset-0 z-[10001] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowDataTransferModal(false)}>
                        <div className="w-full max-w-5xl rounded-2xl border-2 border-cyan-500 bg-slate-950 p-5 shadow-[0_0_30px_rgba(34,211,238,0.25)] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-2xl font-black text-white">{trans("データ移行", languageMode)}</h2>
                                    <p className="text-sm text-slate-300 mt-1">{trans("Vercel版とGitHub版のあいだで保存データを移せます。", languageMode)}</p>
                                </div>
                                <button
                                    onClick={() => setShowDataTransferModal(false)}
                                    className="rounded-full border border-slate-600 p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {transferStatus && (
                                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold ${
                                    transferStatus.type === 'success'
                                        ? 'border-emerald-500/50 bg-emerald-900/30 text-emerald-200'
                                        : transferStatus.type === 'error'
                                            ? 'border-red-500/50 bg-red-900/30 text-red-200'
                                            : 'border-cyan-500/50 bg-cyan-900/30 text-cyan-200'
                                }`}>
                                    {transferStatus.message}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <section className="rounded-2xl border border-slate-700 bg-black/30 p-4">
                                    <h3 className="text-lg font-black text-white mb-2">{trans("エクスポート", languageMode)}</h3>
                                    <p className="text-sm text-slate-300 mb-3">
                                        {trans("この端末の保存データをJSONとして出力します。", languageMode)}
                                    </p>
                                    <div className="mb-3 text-xs font-mono text-cyan-200">
                                        {trans("保存キー数", languageMode)}: {transferExportCount}
                                    </div>
                                    <textarea
                                        value={transferExportText}
                                        readOnly
                                        className="w-full h-64 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-xs text-slate-200 font-mono"
                                    />
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <button
                                            onClick={handleCopyTransferData}
                                            className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400"
                                        >
                                            {trans("コピー", languageMode)}
                                        </button>
                                        <button
                                            onClick={handleDownloadTransferData}
                                            className="flex-1 rounded-xl border border-cyan-500 bg-slate-900 px-4 py-3 text-sm font-black text-cyan-200 hover:bg-slate-800"
                                        >
                                            {trans("ダウンロード", languageMode)}
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-700 bg-black/30 p-4">
                                    <h3 className="text-lg font-black text-white mb-2">{trans("インポート", languageMode)}</h3>
                                    <p className="text-sm text-slate-300 mb-3">
                                        {trans("別の端末で出力したJSONを貼り付けるか、保存ファイルを読み込んでください。", languageMode)}
                                    </p>
                                    <textarea
                                        value={transferImportText}
                                        onChange={e => setTransferImportText(e.target.value)}
                                        placeholder={trans("ここにエクスポートしたJSONを貼り付けます。", languageMode)}
                                        className="w-full h-64 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-xs text-slate-200 font-mono placeholder:text-slate-500"
                                    />
                                    <input
                                        ref={transferFileInputRef}
                                        type="file"
                                        accept=".json,application/json"
                                        className="hidden"
                                        onChange={handleTransferFileChange}
                                    />
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <button
                                            onClick={() => transferFileInputRef.current?.click()}
                                            className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-black text-slate-200 hover:bg-slate-700"
                                        >
                                            {trans("ファイルを読み込む", languageMode)}
                                        </button>
                                        <button
                                            onClick={handleImportTransferData}
                                            className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400"
                                        >
                                            {trans("インポートを実行", languageMode)}
                                        </button>
                                    </div>
                                    <p className="mt-3 text-xs text-amber-200">
                                        {trans("インポートを実行すると、この端末の既存データは取り込んだ内容で上書きされます。", languageMode)}
                                    </p>
                                </section>
                            </div>
                        </div>
                    </div>
                )}

                {gameState.screen === GameScreen.FLOOR_RESULT && (
                    <div className="absolute inset-0">
                        <FloorResultScreen
                            act={gameState.act}
                            stats={gameState.actStats!}
                            storyIndex={gameState.currentStoryIndex || 0}
                            onNext={handleNextActFromStory}
                            languageMode={languageMode}
                            newlyUnlockedCardName={gameState.newlyUnlockedCardName}
                            typingMode={gameState.challengeMode === 'TYPING'}
                        />
                    </div>
                )}

                {showDebugLog && (
                    <div className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowDebugLog(false)}>
                        <div className="bg-gray-900 border-2 border-green-500 p-6 rounded-lg max-w-lg w-full shadow-[0_0_20px_rgba(34,197,94,0.3)]" onClick={e => e.stopPropagation()}>
                            <h2
                                className="text-xl font-bold mb-4 text-green-400 font-mono border-b border-green-800 pb-2 select-none active:text-green-200"
                                onClick={handleLogClick}
                            >
                                System Update Log v1.0.4
                            </h2>
                            <div className="space-y-4 text-sm font-mono text-gray-300 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <section>
                                    <h3 className="text-white font-bold mb-1">■ v1.0.4 アップデート</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>協力モードの進行、報酬、イベント同期を改善</li>
                                        <li>協力専用UIに参加者名表示を追加</li>
                                        <li>細かなバグ修正と安定性向上</li>
                                    </ul>
                                </section>
                            </div>
                            <button
                                onClick={() => setShowDebugLog(false)}
                                className="mt-6 bg-green-900/50 hover:bg-green-800 text-green-300 border border-green-600 px-6 py-2 rounded w-full font-mono transition-colors cursor-pointer"
                            >
                                CLOSE TERMINAL
                            </button>
                        </div>
                    </div>
                )}

                {gameState.screen === GameScreen.DEBUG_MENU && (
                    <div className="absolute inset-0">
                        <DebugMenuScreen
                            onStart={handleDebugStart}
                            onStartAct3Boss={handleDebugStartAct3Boss}
                            onBack={returnToTitle}
                            onTimeUpdate={handleTimeUpdate}
                            onAddClearCount={handleDebugAddClearCount}
                            onBoostMathCorrect={handleDebugBoostMathCorrect}
                            clearCount={clearCount}
                            totalMathCorrect={totalMathCorrect}
                            nextMiniGameThreshold={nextThreshold}
                            languageMode={languageMode}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.PROBLEM_CHALLENGE && (
                    <div className="absolute inset-0">
                        <ProblemChallengeScreen
                            onBack={returnToTitle}
                            languageMode={languageMode}
                            onCorrectAnswers={handleModeCorrectProgress}
                            modeCorrectCounts={modeCorrectCounts}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.VS_SETUP && (
                    <div className="absolute inset-0">
                        <P2PBattleSetup
                            player={gameState.player}
                            onBattleStart={(opp, isHost, myName) => {
                                setGameState(prev => ({
                                    ...prev,
                                    player: { ...prev.player, name: myName },
                                    vsOpponent: opp,
                                    screen: GameScreen.VS_BATTLE,
                                    vsIsHost: isHost
                                }));
                            }}
                            onClose={returnToTitle}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.RACE_SETUP && (
                    <div className="absolute inset-0">
                        <P2PRaceSetup
                            player={gameState.player}
                            onRaceStart={(payload) => {
                                const baseEntries: RaceEntry[] = payload.participants.map(p => ({
                                    peerId: p.peerId,
                                    name: p.name,
                                    imageData: p.imageData,
                                    floor: 0,
                                    maxDamage: 0,
                                    gameOverCount: 0,
                                    score: 0,
                                    updatedAt: Date.now()
                                }));
                                setRaceSession({
                                    isHost: payload.isHost,
                                    name: payload.name,
                                    roomCode: payload.roomCode,
                                    durationSec: payload.durationSec,
                                    endAt: payload.endAt,
                                    startedAt: payload.endAt - payload.durationSec * 1000,
                                    participants: payload.participants,
                                    entries: baseEntries,
                                    ended: false
                                });
                                setRaceRemainingSec(payload.durationSec);
                                setRaceResultOpen(false);
                                setRaceMaxDamage(0);
                                setRaceGameOverCount(0);
                                setRaceSelfPeerId(payload.isHost ? 'host' : (p2pService.getMyId() || 'guest'));
                                setRaceTrickCards([]);
                                setRaceEffects(EMPTY_RACE_EFFECTS);
                                setRaceHudOpen(false);
                                setRaceRewardDummyDisplay(0);
                                setGameState(prev => ({
                                    ...prev,
                                    challengeMode: 'RACE',
                                    mode: payload.mode ?? prev.mode,
                                    screen: payload.mode ? GameScreen.CHARACTER_SELECTION : GameScreen.MODE_SELECTION
                                }));
                            }}
                            onClose={returnToTitle}
                        />
                    </div>
                )}

                {raceSession && !raceSession.ended && raceSession.isHost && gameState.challengeMode === 'RACE' && gameState.screen !== GameScreen.RACE_SETUP && raceSession.roomCode && (
                    <div className="absolute left-1/2 top-3 z-40 -translate-x-1/2">
                        <div className="bg-slate-900/90 border border-cyan-500 rounded-lg px-3 py-2 text-cyan-100 shadow-lg">
                            <div className="text-center text-[10px] font-bold tracking-wide text-cyan-200">参加コード</div>
                            <div className="text-center text-lg font-black tracking-widest tabular-nums">{raceSession.roomCode}</div>
                        </div>
                    </div>
                )}

                {gameState.challengeMode === 'COOP' && coopSession && COOP_PARTY_HUD_SCREEN_SET.has(gameState.screen) && (
                    <div className="absolute left-1/2 top-[60px] sm:top-[72px] z-30 -translate-x-1/2">
                        <button
                            onClick={coopSession.isHost ? sendCoopStateSync : requestCoopStateSync}
                            className="rounded-md border border-slate-300/40 bg-slate-900/80 px-2 py-1 text-[10px] sm:text-xs font-bold text-slate-100 shadow-lg hover:bg-slate-800/90"
                            title={coopSession.isHost ? '参加者へ現在のゲーム状態を再送信します' : 'ホストへ最新のゲーム状態を再受信します'}
                        >
                            {coopSession.isHost ? '状態を送信' : '状態を受信'}
                        </button>
                    </div>
                )}

                {gameState.challengeMode === 'COOP' && coopSession && COOP_DECISION_HUD_SCREEN_SET.has(gameState.screen) && coopDecisionOwner && (
                    <div className="absolute right-2 sm:right-3 top-[60px] sm:top-[72px] z-30">
                        <div className="bg-slate-900/90 border border-cyan-500 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-cyan-100 shadow-lg min-w-[116px] sm:min-w-[168px] max-w-[42vw] sm:max-w-none">
                            <div className="text-[9px] sm:text-[10px] font-bold tracking-wide text-cyan-200">決定役</div>
                            <div className="truncate text-[11px] sm:text-sm font-black">{coopDecisionOwner.name}</div>
                            <div className="text-[9px] sm:text-[11px] text-cyan-100/80">{coopCanDecide ? 'あなたの番です' : '進行待ち'}</div>
                        </div>
                    </div>
                )}

                {gameState.challengeMode === 'COOP' && coopSession && COOP_PARTY_HUD_SCREEN_SET.has(gameState.screen) && (
                    <div className="absolute left-2 sm:left-3 top-[60px] sm:top-[72px] z-30 w-[min(240px,calc(100vw-16px))] sm:w-[min(320px,calc(100vw-24px))]">
                        <div className="bg-slate-950/88 border border-emerald-500/60 rounded-xl shadow-2xl backdrop-blur px-2 py-1.5 sm:px-3 sm:py-2 text-white">
                            <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-2">
                                <div>
                                    <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-emerald-200">Coop Party</div>
                                    <div className="text-[9px] sm:text-[10px] text-emerald-100/80">{coopSession.participants.length}人</div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCoopVoiceEnabled(prev => !prev)}
                                        className={`rounded border px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] font-bold ${coopVoiceEnabled ? 'border-cyan-300/60 bg-cyan-600/30 text-cyan-100 hover:bg-cyan-500/30' : 'border-slate-500/50 bg-slate-800/70 text-slate-200 hover:bg-slate-700/70'}`}
                                        title={coopVoiceEnabled ? '音声通信をオフ' : '音声通信をオン'}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {coopVoiceEnabled ? <Mic size={11} /> : <MicOff size={11} />}
                                            <span>{coopVoiceEnabled ? '通話ON' : '通話OFF'}</span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setCoopPartyHudOpen(prev => !prev)}
                                        className="rounded border border-emerald-400/40 bg-emerald-950/30 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] font-bold text-emerald-100 hover:bg-emerald-900/40"
                                    >
                                        {coopPartyHudOpen ? '非表示' : '表示'}
                                    </button>
                                </div>
                            </div>
                            {coopPartyHudOpen && (
                            <div className="space-y-1.5 sm:space-y-2">
                                {coopSession.participants.map(participant => {
                                    const isSelf = participant.peerId === coopSelfPeerId;
                                    const isDecisionOwner = participant.peerId === coopDecisionOwner?.peerId;
                                    const hpValue = participant.currentHp ?? participant.maxHp ?? 0;
                                    const maxHpValue = participant.maxHp ?? hpValue;
                                    return (
                                        <div key={participant.peerId} className={`rounded-lg border px-2 py-1.5 sm:px-2 sm:py-2 ${isDecisionOwner ? 'border-cyan-400/70 bg-cyan-950/20' : 'border-white/10 bg-black/20'}`}>
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="truncate text-[11px] sm:text-xs font-black text-white flex items-center gap-1">
                                                        {participant.name}{isSelf ? ' (あなた)' : ''}
                                                        {(isSelf ? coopVoiceEnabled : participant.voiceEnabled)
                                                            ? <Mic size={10} className="text-cyan-300 shrink-0" />
                                                            : <MicOff size={10} className="text-slate-500 shrink-0" />}
                                                    </div>
                                                    <div className="hidden sm:block text-[10px] text-slate-300">
                                                        {isDecisionOwner ? '決定役' : '同行中'}
                                                    </div>
                                                </div>
                                                <div className={`text-[9px] sm:text-[10px] font-bold ${hpValue > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                                    {hpValue > 0 ? '生存' : 'ダウン'}
                                                </div>
                                            </div>
                                            <div className="mb-1 h-1 sm:h-1.5 overflow-hidden rounded-full bg-slate-800">
                                                <div
                                                    className={`h-full rounded-full ${hpValue > 0 ? 'bg-emerald-400' : 'bg-red-500'}`}
                                                    style={{ width: `${maxHpValue > 0 ? Math.max(0, Math.min(100, (hpValue / maxHpValue) * 100)) : 0}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between gap-2 text-[9px] sm:text-[10px] text-slate-300">
                                                <span className="shrink-0">HP {hpValue}/{maxHpValue}</span>
                                                {gameState.screen === GameScreen.REWARD ? (
                                                    <span className={`truncate text-right ${participant.rewardResolved ? 'text-yellow-300' : 'text-slate-300'}`}>
                                                        {participant.rewardResolved ? '報酬完了' : '報酬中'}
                                                    </span>
                                                ) : gameState.screen === GameScreen.SHOP ? (
                                                    <span className={`truncate text-right ${participant.shopResolved ? 'text-yellow-300' : 'text-slate-300'}`}>
                                                        {participant.shopResolved ? '買い物完了' : '買い物中'}
                                                    </span>
                                                ) : gameState.screen === GameScreen.REST ? (
                                                    <span className={`truncate text-right ${participant.restResolved ? 'text-yellow-300' : 'text-slate-300'}`}>
                                                        {participant.restResolved ? '休憩完了' : '休憩中'}
                                                    </span>
                                                ) : gameState.screen === GameScreen.EVENT ? (
                                                    <span className={`truncate text-right ${participant.eventResolved ? 'text-yellow-300' : 'text-slate-300'}`}>
                                                        {participant.eventResolved ? 'イベント完了' : 'イベント中'}
                                                    </span>
                                                ) : gameState.screen === GameScreen.TREASURE ? (
                                                    <span className={`truncate text-right ${participant.treasureResolved ? 'text-yellow-300' : 'text-slate-300'}`}>
                                                        {participant.treasureResolved ? '宝確認完了' : '宝確認中'}
                                                    </span>
                                                ) : CHALLENGE_SCREEN_SET.has(gameState.screen) ? (
                                                    <span className={`truncate text-right ${participant.quizResolved ? 'text-yellow-300' : 'text-slate-300'}`}>
                                                        {participant.quizResolved ? `クイズ ${participant.quizCorrectCount ?? 0}` : 'クイズ中'}
                                                    </span>
                                                ) : (
                                                    <span className={`truncate text-right ${isDecisionOwner ? 'text-cyan-300' : 'text-slate-400'}`}>
                                                        {isDecisionOwner ? '進行中' : '待機'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            )}
                        </div>
                    </div>
                )}

                {raceSession && !raceSession.ended && gameState.challengeMode === 'RACE' && RACE_TRICK_SCREEN_SET.has(gameState.screen) && (
                    <>
                        <div className="absolute left-3 bottom-3 z-40 w-[min(360px,calc(100vw-24px))]">
                            <div className="bg-slate-950/88 border border-fuchsia-500/70 rounded-xl shadow-2xl backdrop-blur px-3 py-2 text-white">
                                <button
                                    onClick={() => setRaceHudOpen(prev => !prev)}
                                    className="w-full flex items-center justify-between text-left"
                                >
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-200">Race Trick</div>
                                        <div className="text-sm font-black">妨害カード {raceTrickCards.length} 枚</div>
                                    </div>
                                    <ChevronDown className={`transition-transform ${raceHudOpen ? 'rotate-180' : ''}`} size={16} />
                                </button>
                                {raceHudOpen && (
                                    <div className="mt-3 space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                                        {raceTrickCards.length === 0 && (
                                            <div className="rounded border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
                                                戦闘報酬でたまに手に入るレース専用カードです。
                                            </div>
                                        )}
                                        {raceTrickCards.map((card, index) => {
                                            const targets = getRaceTargetEntries().slice(0, 3);
                                            return (
                                                <div key={`${card.id}-${index}`} className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/25 p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="font-black text-fuchsia-100">{card.name}</div>
                                                            <div className="text-[11px] text-fuchsia-100/80 leading-relaxed">{card.description}</div>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-fuchsia-200">{card.rarity}</div>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {card.effectId === 'WALLET_SWAP' ? (
                                                            <>
                                                                {targets.length === 0 && <div className="text-[11px] text-slate-400">対象なし</div>}
                                                                {targets.map(target => (
                                                                    <button
                                                                        key={`${card.id}-${target.peerId}`}
                                                                        onClick={() => handleUseRaceTrickCard(card, target.peerId)}
                                                                        className="rounded border border-fuchsia-300/50 bg-fuchsia-700/40 px-2 py-1 text-[11px] font-bold hover:bg-fuchsia-600/60"
                                                                    >
                                                                        {target.name} に使う
                                                                    </button>
                                                                ))}
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUseRaceTrickCard(card, 'ALL')}
                                                                className="rounded border border-fuchsia-300/50 bg-fuchsia-700/40 px-2 py-1 text-[11px] font-bold hover:bg-fuchsia-600/60"
                                                            >
                                                                全員に使う
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        {raceToast && (
                            <div className="absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded-full border border-fuchsia-300/60 bg-slate-950/90 px-4 py-2 text-sm font-black text-fuchsia-100 shadow-xl">
                                {raceToast}
                            </div>
                        )}
                        {raceEffects.fakeSignboardUntil > raceEffectNow && (
                            <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
                                {Array.from({ length: 12 }).map((_, index) => (
                                    <div
                                        key={`fake-sign-${index}`}
                                        className="absolute text-cyan-200/80 font-black text-xs"
                                        style={{
                                            left: `${(index * 17) % 90}%`,
                                            top: `${(index * 23) % 86}%`,
                                            transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (10 + index * 3)}deg)`
                                        }}
                                    >
                                        ← こっち
                                    </div>
                                ))}
                            </div>
                        )}
                        {raceEffects.paperStormUntil > raceEffectNow && (
                            <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
                                {Array.from({ length: 18 }).map((_, index) => (
                                    <div
                                        key={`paper-${index}`}
                                        className="absolute h-8 w-6 rounded bg-white/80 shadow-md animate-bounce"
                                        style={{ left: `${(index * 11) % 100}%`, top: `${(index * 19) % 100}%`, transform: `rotate(${index * 17}deg)` }}
                                    />
                                ))}
                            </div>
                        )}
                        {raceEffects.chalkDustUntil > raceEffectNow && <div className="pointer-events-none absolute inset-0 z-40 bg-white/18 backdrop-blur-[1px]" />}
                        {raceEffects.sleepyVignetteUntil > raceEffectNow && <div className="pointer-events-none absolute inset-0 z-40 shadow-[inset_0_0_120px_rgba(0,0,0,0.92)]" />}
                        {raceEffects.slowBellUntil > raceEffectNow && (
                            <div className="absolute inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center text-white font-black text-xl">
                                しばらく操作できません
                            </div>
                        )}
                    </>
                )}

                {gameState.screen === GameScreen.VS_BATTLE && gameState.vsOpponent && (
                    <div className="absolute inset-0">
                        <P2PVSBattleScene
                            player1={gameState.player}
                            player2={gameState.vsOpponent}
                            isHost={gameState.vsIsHost || false}
                            onFinish={(winner) => {
                                alert(trans(winner === 1 ? "あなたの勝利！" : "対戦相手の勝利！", languageMode));
                                setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU, vsOpponent: undefined, vsIsHost: undefined }));
                            }}
                            languageMode={languageMode}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.MINI_GAME_SELECT && (
                    <div className="absolute inset-0">
                        <MiniGameSelectScreen
                            onSelect={handleMiniGameSelect}
                            onBack={returnToTitle}
                            totalMathCorrect={totalMathCorrect}
                            isDebug={isDebugHpOne}
                        />
                    </div>
                )}

                {/* Generic Mini-Game Router */}
                {miniGame && (
                    <div className="absolute inset-0">
                        <MiniGameRouter screen={gameState.screen} onBack={returnToTitle} />
                    </div>
                )}

                {gameState.screen === GameScreen.MODE_SELECTION && (
                    <div className="absolute inset-0">
                        <ModeSelectionScreen
                            onSelectMode={handleModeSelect}
                            onBack={returnToTitle}
                            languageMode={languageMode}
                            modeMasteryMap={Object.fromEntries(Object.entries(modeCorrectCounts).map(([mode, count]) => [mode, count >= 100]))}
                            modeCorrectCounts={modeCorrectCounts}
                        />
                        {raceSession && !raceSession.ended && !raceSession.isHost && gameState.challengeMode === 'RACE' && (
                            <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex items-center justify-center p-4 z-20">
                                <div className="bg-slate-900 border-2 border-cyan-500 rounded-xl p-6 text-white text-center max-w-md w-full">
                                    <div className="text-xl font-black mb-2">レースモード準備中</div>
                                    <div className="text-sm text-cyan-200">ホストのモード選択を待っています...</div>
                                </div>
                            </div>
                        )}
                        {coopSession && !coopSession.isHost && gameState.challengeMode === 'COOP' && (
                            <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex items-center justify-center p-4 z-20">
                                <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-6 text-white text-center max-w-md w-full">
                                    <div className="text-xl font-black mb-2">協力モード準備中</div>
                                    <div className="text-sm text-emerald-200">ホストのモード選択を待っています...</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {gameState.screen === GameScreen.CHARACTER_SELECTION && (
                    <div className="absolute inset-0">
                        <CharacterSelectionScreen
                            characters={CHARACTERS}
                            unlockedCount={isDebugHpOne ? CHARACTERS.length : Math.min(CHARACTERS.length, clearCount + 2)}
                            onSelect={handleCharacterSelect}
                            challengeMode={gameState.challengeMode}
                            languageMode={languageMode}
                            coopParticipants={gameState.challengeMode === 'COOP' ? coopSession?.participants : undefined}
                            coopSelfPeerId={gameState.challengeMode === 'COOP' ? coopSelfPeerId : undefined}
                            coopDecisionOwnerPeerId={gameState.challengeMode === 'COOP' ? coopDecisionOwner?.peerId : undefined}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.DECK_CONSTRUCTION && (
                    <div className="absolute inset-0">
                        <ChefDeckSelectionScreen
                            onComplete={handleChefDeckSelection}
                            languageMode={languageMode}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.RELIC_SELECTION && (
                    <div className="absolute inset-0">
                        <RelicSelectionScreen relics={starterRelics} onSelect={handleRelicSelect} languageMode={languageMode} typingMode={gameState.challengeMode === 'TYPING'} />
                        {gameState.challengeMode === 'COOP' && coopAwaitingMapSync && coopSession && !coopSession.isHost && (
                            <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex items-center justify-center p-4 z-20">
                                <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-6 text-white text-center max-w-md w-full">
                                    <div className="text-xl font-black mb-2">協力モード準備中</div>
                                    <div className="text-sm text-emerald-200">ホストが初回マップを確定するまで待っています...</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {gameState.screen === GameScreen.COMPENDIUM && (
                    <div className="absolute inset-0">
                        <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={returnToTitle} languageMode={languageMode} isDebug={isDebugHpOne} />
                    </div>
                )}

                {gameState.screen === GameScreen.RANKING && (
                    <div className="absolute inset-0">
                        <RankingScreen onBack={returnToTitle} />
                    </div>
                )}

                {gameState.screen === GameScreen.HELP && (
                    <div className="absolute inset-0">
                        <HelpScreen onBack={returnToTitle} languageMode={languageMode} />
                    </div>
                )}

                {gameState.screen === GameScreen.MAP && (
                    <div className="absolute inset-0">
                        <MapScreen
                            nodes={gameState.map}
                            currentNodeId={gameState.currentMapNodeId}
                            onNodeSelect={handleNodeSelect}
                            onReturnToTitle={returnToTitle}
                            onOpenSettings={() => setShowSettingsModal(true)}
                            player={gameState.player}
                            languageMode={languageMode}
                            narrative={currentNarrative}
                            act={gameState.act}
                            floor={gameState.floor}
                            typingMode={gameState.challengeMode === 'TYPING'}
                            selectionHoldMs={raceEffects.shoeLaceUntil > raceEffectNow ? 400 : 0}
                            selectionDisabled={(gameState.challengeMode === 'COOP' && !!coopSession?.isHost && !coopCanDecide) || coopMapSelectionPending}
                            selectionDisabledMessage={gameState.challengeMode === 'COOP' ? coopMapPendingMessage : undefined}
                        />
                        {gameState.challengeMode === 'COOP' && coopSession?.isHost && coopNeedsInitialMapSync && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-[72px] z-30">
                                <button
                                    onClick={() => {
                                        sendCoopStateSync();
                                        setCoopNeedsInitialMapSync(false);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-lg shadow-lg border border-emerald-300"
                                >
                                    参加者にマップを同期
                                </button>
                            </div>
                        )}
                        {raceSession && !raceSession.ended && (
                            <>
                                <div className="absolute left-3 top-[72px] z-30">
                                    <div className="bg-slate-900/90 border border-cyan-500 rounded-lg px-3 py-2 text-cyan-100 shadow-lg min-w-[136px]">
                                        <div className="text-[10px] font-bold tracking-wide text-cyan-200">レース残り時間</div>
                                        <div className="text-xl font-black tabular-nums">{formatRaceRemaining(raceRemainingSec)}</div>
                                    </div>
                                </div>
                                <div className="absolute right-3 top-[72px] z-30 w-[180px]">
                                    <div className="bg-slate-900/90 border border-cyan-500 rounded-lg p-2 text-cyan-100 shadow-lg">
                                        <div className="text-[10px] font-bold tracking-wide text-cyan-200 mb-1">ランキング</div>
                                        <div className="space-y-1">
                                            {(raceSession.entries || []).slice().sort(compareRaceEntries).slice(0, 5).map((entry, idx) => (
                                                <div key={entry.peerId} className="flex items-center justify-between text-[11px]">
                                                    <span className="truncate pr-2">{idx + 1}. {entry.name}</span>
                                                    <span className="tabular-nums">{entry.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {gameState.screen === GameScreen.BATTLE && (
                    <div className="absolute inset-0">
                        {gameState.challengeMode === 'TYPING' ? (
                            <TypingBattleScene
                                player={gameState.player}
                                enemies={gameState.enemies}
                                selectedEnemyId={gameState.selectedEnemyId}
                                onSelectEnemy={handleSelectEnemy}
                                onPlayTypingCard={handleTypingAutoPlayCard}
                                onEndTurn={handleEndTurnClick}
                                turnLog={turnLog}
                                narrative={currentNarrative}
                                actingEnemyId={actingEnemyId}
                                selectionState={gameState.selectionState}
                                onHandSelection={handleHandSelection}
                                onCancelSelection={handleCancelSelection}
                                onUsePotion={handleUsePotion}
                                combatLog={gameState.combatLog}
                                languageMode={languageMode}
                                activeEffects={gameState.activeEffects}
                                finisherCutinCard={battleFinisherCutinCard}
                                act={gameState.act}
                                floor={gameState.floor}
                                lessonId={gameState.typingLessonId}
                                onAbort={returnToTitle}
                                hideEnemyIntents={raceEffects.hideEnemyIntentsOnce}
                                onOpenSettings={() => setShowSettingsModal(true)}
                            />
                        ) : (
                            <BattleScene
                                player={gameState.player} companions={gameState.challengeMode === 'COOP' ? coopCompanions : undefined} coopSelfPeerId={gameState.challengeMode === 'COOP' ? coopSelfPeerId : undefined} coopEffectOwnerPeerId={gameState.challengeMode === 'COOP' ? coopEffectOwnerPeerId : undefined} coopTurnQueue={gameState.challengeMode === 'COOP' ? coopBattleQueueView : undefined} coopCanAct={gameState.challengeMode === 'COOP' ? coopBattleCanAct : true} coopTurnOwnerLabel={gameState.challengeMode === 'COOP' ? coopBattleTurnOwnerLabel : undefined} coopSupportCards={gameState.challengeMode === 'COOP' ? coopSupportCards : undefined} onUseCoopSupport={gameState.challengeMode === 'COOP' ? handleUseCoopSupport : undefined} selfDown={gameState.challengeMode === 'COOP' && gameState.player.currentHp <= 0} enemies={gameState.enemies} selectedEnemyId={gameState.selectedEnemyId} onSelectEnemy={handleSelectEnemy} onPlayCard={handlePlayCard} onEndTurn={handleEndTurnClick} turnLog={turnLog} narrative={currentNarrative} lastActionTime={lastActionTime} lastActionType={lastActionType} actingEnemyId={actingEnemyId} selectionState={gameState.selectionState} onHandSelection={handleHandSelection}
                                onUsePotion={handleUsePotion} combatLog={gameState.combatLog} languageMode={languageMode} codexOptions={gameState.codexOptions} onCodexSelect={onCodexSelect} onPlaySynthesizedCard={handlePlaySynthesizedCard}
                                parryState={gameState.parryState} onParry={handleParryClick} activeEffects={gameState.activeEffects}
                                onCancelSelection={handleCancelSelection}
                                finisherCutinCard={battleFinisherCutinCard}
                                hideEnemyIntents={raceEffects.hideEnemyIntentsOnce}
                                onOpenSettings={() => setShowSettingsModal(true)}
                            />
                        )}
                    </div>
                )}

                {gameState.screen === GameScreen.DODGEBALL_SHOOTING && (
                    <div className="absolute inset-0">
                        < DodgeballShooting
                            enemy={gameState.enemies[0]}
                            playerImage={gameState.player.imageData}
                            onComplete={handleDodgeballResult}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.MATH_CHALLENGE && (
                    <div className="absolute inset-0">
                        <MathChallengeScreen
                            mode={gameState.mode}
                            onComplete={handleMathChallengeComplete}
                            debugSkip={isMathDebugSkipped}
                            isChallenge={false}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.KANJI_CHALLENGE && (
                    <div className="absolute inset-0">
                        <KanjiChallengeScreen
                            mode={gameState.mode}
                            onComplete={handleMathChallengeComplete}
                            debugSkip={isMathDebugSkipped}
                            isChallenge={false}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.ENGLISH_CHALLENGE && (
                    <div className="absolute inset-0">
                        <EnglishChallengeScreen
                            mode={gameState.mode}
                            onComplete={handleMathChallengeComplete}
                            debugSkip={isMathDebugSkipped}
                            isChallenge={false}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.GENERAL_CHALLENGE && (
                    <div className="absolute inset-0">
                        <GeneralChallengeScreen
                            mode={gameState.mode}
                            modePool={gameState.modePool}
                            onModeCorrect={handleModeCorrectProgress}
                            onComplete={handleMathChallengeComplete}
                            debugSkip={isMathDebugSkipped}
                            isChallenge={false}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.COOP_SETUP && (
                    <div className="absolute inset-0">
                        <CoopSetupScreen
                            player={gameState.player}
                            onStart={(payload: CoopStartPayload) => {
                                setCoopSession({
                                    isHost: payload.isHost,
                                    name: payload.name,
                                    roomCode: payload.roomCode,
                                    startedAt: Date.now(),
                                    battleMode: payload.battleMode,
                                    participants: payload.participants,
                                    decisionOwnerIndex: 0
                                });
                                setGameState(prev => ({
                                    ...prev,
                                    challengeMode: 'COOP',
                                    screen: GameScreen.MODE_SELECTION
                                }));
                            }}
                            onClose={returnToTitle}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.TYPING_MODE_SELECTION && (
                    <div className="absolute inset-0">
                        <TypingModeSelectionScreen
                            selectedLessonId={gameState.typingLessonId}
                            onSelect={handleTypingLessonSelect}
                            onBack={returnToTitle}
                            languageMode={languageMode}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.REWARD && (
                    <div className="absolute inset-0">
                        <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading || coopAwaitingRewardSync} currentPotions={gameState.player.potions} potionCapacity={getPotionCapacity(gameState.player)} languageMode={languageMode} typingMode={gameState.challengeMode === 'TYPING'} dummyRewards={raceRewardDummyDisplay} autoSkipWhenEmpty={gameState.challengeMode !== 'COOP'} skipDisabled={coopRewardSkipDisabled} skipDisabledMessage={coopAwaitingRewardSync ? 'ホストが報酬を確定するまで待っています' : (coopRewardSkipDisabled ? '他のプレイヤーの報酬完了を待っています' : undefined)} interactionDisabled={gameState.challengeMode === 'COOP' ? false : coopInteractionDisabled} interactionDisabledMessage={coopInteractionDisabledMessage} />
                    </div>
                )}

                {gameState.screen === GameScreen.REST && (
                    <div className="absolute inset-0">
                        <RestScreen
                            player={gameState.player}
                            onRest={handleRestAction}
                            onUpgrade={handleUpgradeCard}
                            onSynthesize={handleSynthesizeCard}
                            onLeave={handleRestLeave}
                            languageMode={languageMode}
                            typingMode={gameState.challengeMode === 'TYPING'}
                            interactionDisabled={gameState.challengeMode === 'COOP' ? false : coopInteractionDisabled}
                            interactionDisabledMessage={coopInteractionDisabledMessage}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.SHOP && (
                    <div className="absolute inset-0">
                        <ShopScreen
                            player={gameState.player}
                            shopCards={shopCards}
                            shopRelics={shopRelics}
                            shopPotions={shopPotions}
                            onBuyCard={handleShopBuyCard}
                            onBuyRelic={handleShopBuyRelic}
                            onBuyPotion={handleShopBuyPotion}
                            onRemoveCard={handleShopRemoveCard}
                            onLeave={handleShopLeave}
                            potionCapacity={getPotionCapacity(gameState.player)}
                            languageMode={languageMode}
                            typingMode={gameState.challengeMode === 'TYPING'}
                            priceMultiplier={raceEffects.shopMarkupUntil > raceEffectNow ? 1.25 : 1}
                            interactionDisabled={gameState.challengeMode === 'COOP' ? false : coopInteractionDisabled}
                            interactionDisabledMessage={coopInteractionDisabledMessage}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.GARDEN && (
                    <div className="absolute inset-0">
                        <GardenScreen
                            player={gameState.player}
                            onPlant={handlePlantSeed}
                            onHarvest={handleHarvestPlant}
                            onLeave={() => {
                                const seedKeys = Object.keys(GARDEN_SEEDS);
                                const randomKey = seedKeys[Math.floor(Math.random() * seedKeys.length)];
                                const seedTemplate = GARDEN_SEEDS[randomKey];
                                const newSeed: ICard = {
                                    ...seedTemplate,
                                    id: `seed-drop-${Date.now()}`
                                };
                                const msg = trans(`新しい種「${newSeed.name}」を手に入れた！`, languageMode);
                                setGameState(prev => {
                                    return {
                                        ...prev,
                                        screen: GameScreen.MAP,
                                        player: {
                                            ...prev.player,
                                            deck: [...prev.player.deck, newSeed]
                                        },
                                        narrativeLog: [...prev.narrativeLog, msg]
                                    };
                                });
                                setCurrentNarrative(msg);
                                audioService.playSound('buff');
                            }}
                            languageMode={languageMode}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.EVENT && eventData && (
                    <div className="absolute inset-0">
                        <EventScreen
                            title={trans(eventData.title, languageMode)}
                            description={trans(eventData.description, languageMode)}
                            options={eventData.options.map((o: any, idx: number) => ({ ...o, action: () => handleCoopEventOptionSelect(idx), label: trans(o.label, languageMode), text: trans(o.text, languageMode) }))}
                            imageKey={eventData.title}
                            image={gameState.player.imageData}
                            resultLog={eventResultLog ? trans(eventResultLog, languageMode) : null}
                            onContinue={handleEventComplete}
                            typingMode={gameState.challengeMode === 'TYPING'}
                            interactionDisabled={gameState.challengeMode === 'COOP'
                                ? !!coopSession?.participants.find(participant => participant.peerId === coopSelfPeerId)?.eventResolved
                                : coopInteractionDisabled}
                            interactionDisabledMessage={gameState.challengeMode === 'COOP'
                                ? '他のプレイヤーの結果を待っています'
                                : coopInteractionDisabledMessage}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.FINAL_BRIDGE && (
                    <div className="absolute inset-0">
                        <FinalBridgeScreen
                            player={gameState.player}
                            onComplete={handleFinalBridgeComplete}
                            languageMode={languageMode}
                        />
                    </div>
                )}

                {gameState.screen === GameScreen.TREASURE && (
                    <div className="absolute inset-0">
                        <TreasureScreen
                            rewards={treasureRewards}
                            onOpen={handleTreasureOpen}
                            onLeave={gameState.challengeMode === 'COOP' ? handleTreasureLeave : handleNodeComplete}
                            hasCursedKey={!!gameState.player.relics.find(r => r.id === 'CURSED_KEY')}
                            languageMode={languageMode}
                            typingMode={gameState.challengeMode === 'TYPING'}
                            opened={gameState.challengeMode === 'COOP' ? treasureOpened : undefined}
                            pools={gameState.challengeMode === 'COOP' ? treasurePools : undefined}
                            onClaimPool={gameState.challengeMode === 'COOP' ? handleTreasureClaim : undefined}
                            resolved={gameState.challengeMode === 'COOP' ? !!coopSession?.participants.find(participant => participant.peerId === coopSelfPeerId)?.treasureResolved : false}
                            waitingForOthers={gameState.challengeMode === 'COOP' ? !!coopSession?.participants.some(participant => !participant.treasureResolved) : false}
                        />
                    </div>
                )}

                {masteryRewardModal && (
                    <div className="fixed inset-0 z-[2147483647] bg-black/80 flex items-center justify-center p-4 pointer-events-auto">
                        <div className="w-full max-w-md bg-slate-900 border-2 border-yellow-400 rounded-xl p-6 text-center">
                            <div className="text-2xl font-black text-yellow-300 mb-3">◎ マスター達成</div>
                            <div className="text-white font-bold leading-relaxed mb-5">
                                この種類の問題のマスターおめでとう！<br />
                                ゲームの制限時間が5分延長されました！
                            </div>
                            <button
                                onClick={() => setMasteryRewardModal(null)}
                                className="w-full bg-yellow-400 text-black font-black py-3 rounded-lg hover:bg-yellow-300 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}

                {(newlyUnlockedCharacters.length > 0 || newlyUnlockedMiniGames.length > 0) && (
                    <div className="fixed inset-0 z-[2147483646] bg-black/80 flex items-center justify-center p-4">
                        <div className="flex max-h-[min(88vh,960px)] w-full max-w-4xl flex-col rounded-2xl border-2 border-yellow-400 bg-slate-900 p-4 sm:p-6 text-center shadow-[0_0_40px_rgba(250,204,21,0.25)]">
                            <div className="mb-4 flex items-center justify-center gap-2 text-yellow-300 font-black text-2xl shrink-0">
                                <Sparkles size={24} />
                                NEW UNLOCKS
                                <Sparkles size={24} />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                                {newlyUnlockedCharacters.length > 0 && (
                                    <section className="flex flex-col">
                                        <p className="text-white font-bold mb-4 shrink-0">新しい主人公が使えるようになりました</p>
                                        <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6">
                                            {newlyUnlockedCharacters.map((character) => (
                                                <div key={character.id} className="flex w-full max-w-[16rem] flex-col rounded-xl border border-yellow-300/40 bg-slate-800/80 p-4">
                                                    <img src={character.imageData} alt={character.name} className="mx-auto mb-3 h-28 w-28 object-contain pixelated" />
                                                    <div className="text-xl font-black text-yellow-100">{character.name}</div>
                                                    <div className="mt-2 text-sm text-slate-300 leading-relaxed">{character.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                {newlyUnlockedMiniGames.length > 0 && (
                                    <section className="flex flex-col">
                                        <p className="text-white font-bold mb-4 shrink-0">新しいミニゲームが解禁されました</p>
                                        <div className="flex flex-wrap items-stretch justify-center gap-4">
                                            {newlyUnlockedMiniGames.map((game) => (
                                                <div key={game.id} className="flex w-full max-w-[16rem] flex-col rounded-xl border border-cyan-300/40 bg-slate-800/80 p-4">
                                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/20">
                                                        <game.icon size={28} className="text-cyan-200" />
                                                    </div>
                                                    <div className="text-xl font-black text-cyan-100">{game.name}</div>
                                                    <div className="mt-2 text-sm text-slate-300 leading-relaxed">{game.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setNewlyUnlockedCharacters([]);
                                    setNewlyUnlockedMiniGames([]);
                                }}
                                className="mt-4 w-full shrink-0 rounded-lg bg-yellow-400 py-3 font-black text-black hover:bg-yellow-300 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}

                {weatherScryModal && (
                    <div className="fixed inset-0 z-[230] bg-black/70 flex items-center justify-center p-4">
                        <div className="w-full max-w-lg rounded-xl border-2 border-cyan-400 bg-slate-900 text-white p-4">
                            <h3 className="text-xl font-bold mb-2">{trans("天気予報", languageMode)}</h3>
                            <p className="text-sm text-slate-300 mb-3">山札に戻すか、捨て札に送るかを選択してください</p>
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                {weatherScryModal.cards.map((card, idx) => {
                                    const keep = weatherScryModal.keepMap[card.id] !== false;
                                    return (
                                        <div key={card.id} className="rounded border border-slate-600 bg-slate-800/80 p-2">
                                            <div className="text-sm font-bold mb-2">{idx + 1}. {trans(card.name, languageMode)}</div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleWeatherScryCard(card.id, true)}
                                                    className={`flex-1 rounded px-2 py-1 text-sm ${keep ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                                                >
                                                    山札に戻す
                                                </button>
                                                <button
                                                    onClick={() => toggleWeatherScryCard(card.id, false)}
                                                    className={`flex-1 rounded px-2 py-1 text-sm ${!keep ? 'bg-rose-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                                                >
                                                    捨て札へ送る
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                onClick={applyWeatherScrySelection}
                                className="mt-4 w-full rounded bg-cyan-700 hover:bg-cyan-600 py-2 font-bold"
                            >
                                決定
                            </button>
                        </div>
                    </div>
                )}

                {galaxyExpressModal && (
                    <div className="fixed inset-0 z-[231] bg-black/70 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl rounded-xl border-2 border-sky-400 bg-slate-950 text-white p-4">
                            <h3 className="text-xl font-bold mb-2">{trans("銀河鉄道の夜", languageMode)}</h3>
                            <p className="text-sm text-slate-300 mb-3">1枚選んで手札に加え、残りは捨て札に送ります</p>
                            <div className="grid gap-2 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
                                {galaxyExpressModal.cards.map((card, idx) => (
                                    <button
                                        key={card.id}
                                        onClick={() => applyGalaxyExpressSelection(card.id)}
                                        className="rounded border border-slate-600 bg-slate-800/80 p-3 text-left hover:border-sky-400 hover:bg-slate-700/80 transition-colors"
                                    >
                                        <div className="text-xs text-slate-400 mb-1">{idx + 1}</div>
                                        <div className="font-bold">{trans(card.name, languageMode)}</div>
                                        <div className="text-xs text-slate-300 mt-1 line-clamp-2">{trans(card.description, languageMode)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {goldFishModal && (
                    <div className="fixed inset-0 z-[231] bg-black/70 flex items-center justify-center p-4">
                        <div className="w-full max-w-xl rounded-xl border-2 border-rose-400 bg-slate-950 text-white p-4">
                            <h3 className="text-xl font-bold mb-2">{trans(goldFishModal.title, languageMode)}</h3>
                            <p className="text-sm text-slate-300 mb-3">{goldFishModal.description}</p>
                            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                                {goldFishModal.cards.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => applyGoldFishSelection(card.id)}
                                        className="w-full rounded border border-slate-600 bg-slate-800/80 p-3 text-left hover:border-rose-400 hover:bg-slate-700/80 transition-colors"
                                    >
                                        <div className="font-bold">{trans(card.name, languageMode)}</div>
                                        <div className="text-xs text-slate-300 mt-1">{trans(card.description, languageMode)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {dreamCatcherModal && (
                    <div className="fixed inset-0 z-[231] bg-black/70 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl rounded-xl border-2 border-violet-400 bg-slate-950 text-white p-4">
                            <h3 className="text-xl font-bold mb-2">{trans(dreamCatcherModal.title, languageMode)}</h3>
                            <p className="text-sm text-slate-300 mb-3">{dreamCatcherModal.description}</p>
                            <div className="grid gap-2 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
                                {dreamCatcherModal.cards.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => applyDreamCatcherSelection(card.id)}
                                        className="rounded border border-slate-600 bg-slate-800/80 p-3 text-left hover:border-violet-400 hover:bg-slate-700/80 transition-colors"
                                    >
                                        <div className="font-bold">{trans(card.name, languageMode)}</div>
                                        <div className="text-xs text-slate-300 mt-1 line-clamp-2">{trans(card.description, languageMode)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {orreryModal && (
                    <div className="fixed inset-0 z-[231] bg-black/70 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl rounded-xl border-2 border-amber-400 bg-slate-950 text-white p-4">
                            <h3 className="text-xl font-bold mb-2">{trans(orreryModal.title, languageMode)}</h3>
                            <p className="text-sm text-slate-300 mb-3">{orreryModal.description}</p>
                            <div className="grid gap-2 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
                                {orreryModal.cards.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => applyOrrerySelection(card.id)}
                                        className="rounded border border-slate-600 bg-slate-800/80 p-3 text-left hover:border-amber-400 hover:bg-slate-700/80 transition-colors"
                                    >
                                        <div className="font-bold">{trans(card.name, languageMode)}</div>
                                        <div className="text-xs text-slate-300 mt-1 line-clamp-2">{trans(card.description, languageMode)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {peacePipeModal && (
                    <div className="fixed inset-0 z-[231] bg-black/70 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl rounded-xl border-2 border-emerald-400 bg-slate-950 text-white p-4">
                            <h3 className="text-xl font-bold mb-2">{trans(peacePipeModal.title, languageMode)}</h3>
                            <p className="text-sm text-slate-300 mb-3">{peacePipeModal.description}</p>
                            <div className="grid gap-2 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
                                {peacePipeModal.cards.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => applyPeacePipeSelection(card.id)}
                                        className="rounded border border-slate-600 bg-slate-800/80 p-3 text-left hover:border-emerald-400 hover:bg-slate-700/80 transition-colors"
                                    >
                                        <div className="font-bold">{trans(card.name, languageMode)}</div>
                                        <div className="text-xs text-slate-300 mt-1 line-clamp-2">{trans(card.description, languageMode)}</div>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => applyPeacePipeSelection(null)}
                                className="mt-4 w-full rounded bg-slate-700 hover:bg-slate-600 py-2 font-bold"
                            >
                                使わない
                            </button>
                        </div>
                    </div>
                )}

                {raceSession && raceResultOpen && (
                    <div className="fixed inset-0 z-[220] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_rgba(2,6,23,0.96)_55%)] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                            {Array.from({ length: 18 }).map((_, index) => (
                                <div
                                    key={`race-result-spark-${index}`}
                                    className="absolute rounded-full bg-cyan-300/40 blur-sm animate-pulse"
                                    style={{
                                        width: `${10 + (index % 4) * 8}px`,
                                        height: `${10 + (index % 4) * 8}px`,
                                        left: `${(index * 13) % 100}%`,
                                        top: `${(index * 19) % 100}%`,
                                        animationDelay: `${index * 120}ms`
                                    }}
                                />
                            ))}
                        </div>
                        <div className="relative w-full max-w-5xl rounded-[28px] border border-cyan-400/40 bg-slate-950/90 p-4 sm:p-6 text-white shadow-[0_0_60px_rgba(6,182,212,0.28)] backdrop-blur-xl">
                            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                            <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(135deg,rgba(34,211,238,0.08),transparent_30%,transparent_70%,rgba(250,204,21,0.08))] pointer-events-none" />
                            {(() => {
                                const sortedEntries = [...raceSession.entries].sort(compareRaceEntries);
                                const winner = sortedEntries[0];
                                const podium = [sortedEntries[1], winner, sortedEntries[2]];
                                const podiumStyles = [
                                    'sm:pt-10 sm:pb-4 sm:order-1 border-slate-500/40 bg-slate-900/70',
                                    'sm:pt-4 sm:pb-8 sm:order-2 border-yellow-400/60 bg-gradient-to-b from-yellow-500/20 to-cyan-500/10 shadow-[0_0_30px_rgba(250,204,21,0.2)]',
                                    'sm:pt-14 sm:pb-2 sm:order-3 border-amber-700/50 bg-slate-900/70'
                                ];
                                const podiumRanks = [2, 1, 3];
                                const podiumHeights = ['sm:h-[220px]', 'sm:h-[260px]', 'sm:h-[200px]'];
                                return (
                                    <>
                                        <div className="text-center mb-6">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1 text-xs font-black tracking-[0.35em] text-cyan-200 uppercase">
                                                <Trophy size={14} />
                                                Race Result
                                            </div>
                                            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-yellow-200">
                                                結果発表
                                            </h2>
                                            {winner && (
                                                <p className="mt-2 text-sm sm:text-base text-cyan-100/85">
                                                    優勝は <span className="font-black text-yellow-300">{winner.name}</span> ・ {winner.score} pt
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 mb-6">
                                            {podium.map((entry, index) => (
                                                <div
                                                    key={entry?.peerId || `podium-empty-${index}`}
                                                    className={`relative rounded-3xl border p-4 ${podiumStyles[index]} ${podiumHeights[index]} flex-1 flex flex-col justify-end overflow-hidden`}
                                                >
                                                    {entry ? (
                                                        <>
                                                            {podiumRanks[index] === 1 && (
                                                                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-yellow-400/15 px-2 py-1 text-[10px] font-black text-yellow-200">
                                                                    <Sparkles size={12} />
                                                                    WINNER
                                                                </div>
                                                            )}
                                                            <div className={`mb-3 text-center ${podiumRanks[index] === 1 ? 'text-yellow-300' : podiumRanks[index] === 2 ? 'text-slate-200' : 'text-amber-500'}`}>
                                                                <div className="text-4xl sm:text-5xl font-black">{podiumRanks[index]}</div>
                                                                <div className="text-[11px] tracking-[0.25em] uppercase">Place</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-lg sm:text-xl font-black truncate">{entry.name}</div>
                                                                <div className="mt-1 text-2xl sm:text-3xl font-black tabular-nums text-cyan-200">{entry.score}</div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-slate-500 font-bold">-</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-3 sm:p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="text-sm font-black tracking-[0.25em] uppercase text-cyan-200">Leaderboard</div>
                                                <div className="text-xs text-slate-400">参加者 {sortedEntries.length} 人</div>
                                            </div>
                                            <div className="flex flex-col gap-2 max-h-[34vh] overflow-y-auto custom-scrollbar pr-1">
                                                {sortedEntries.map((entry, index) => (
                                                    <div
                                                        key={entry.peerId}
                                                        className={`flex items-center gap-2 rounded-2xl px-3 py-3 ${index === 0 ? 'bg-yellow-400/10 border border-yellow-400/30' : 'bg-slate-800/70 border border-white/5'}`}
                                                    >
                                                        <div className={`w-14 shrink-0 text-center text-lg font-black ${index === 0 ? 'text-yellow-300' : 'text-slate-300'}`}>#{index + 1}</div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate font-black text-white">{entry.name}</div>
                                                            <div className="text-[11px] text-slate-400">更新: {new Date(entry.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </div>
                                                        <div className="w-24 shrink-0 text-right text-cyan-200 font-black tabular-nums">{entry.score}</div>
                                                    </div>
                                                ))}
                                            </div>
                                    </div>

                                        <button
                                            onClick={() => {
                                                setRaceResultOpen(false);
                                                returnToTitle();
                                            }}
                                            className="mt-5 w-full rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-700 to-sky-600 py-3 font-black tracking-wide hover:from-cyan-600 hover:to-sky-500 shadow-lg shadow-cyan-900/30"
                                        >
                                            タイトルへ戻る
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {gameState.screen === GameScreen.GAME_OVER && (
                    <div className="w-full h-full bg-red-900 flex flex-col items-center justify-start text-center text-white p-4 overflow-y-auto custom-scrollbar">
                        <div className="my-auto w-full max-w-2xl py-8">
                            <h1 className="text-6xl mb-4 font-bold">しゅくだいがふえた…</h1>
                            <p className="mb-8 text-2xl">Act {gameState.act} - Floor {gameState.floor}</p>

                            {/* Newly Unlocked Card Section */}
                            {newlyUnlockedCard && (
                                <div className="mb-8 p-6 bg-yellow-600/20 border-2 border-yellow-400 rounded-2xl animate-in zoom-in duration-500 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                    <div className="flex items-center justify-center gap-2 text-yellow-400 font-black text-xl mb-4 italic tracking-widest">
                                        <Sparkles size={24} /> NEW CARD UNLOCKED! <Sparkles size={24} />
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="scale-100">
                                            <Card card={newlyUnlockedCard} onClick={() => { }} disabled={false} languageMode={languageMode} />
                                        </div>
                                        <p className="text-sm text-yellow-100 font-bold">新しい学習の成果が、次回の冒険から現れるようになります！</p>
                                    </div>
                                </div>
                            )}

                            {!legacyCardSelected ? (
                                <div className="mb-8 shrink-0">
                                    <p className="mb-4 text-sm text-red-200 font-bold">次回の冒険に持っていくカードを1枚選んでください</p>
                                    <div className="flex flex-wrap justify-center gap-2 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-black/30 rounded border border-red-700/50">
                                        {gameState.player.deck.map(card => (
                                            <div key={card.id} className="scale-75 cursor-pointer hover:scale-90 transition-transform" onClick={() => handleLegacyCardSelect(card)}>
                                                <Card card={card} onClick={() => handleLegacyCardSelect(card)} disabled={false} languageMode={languageMode} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8 p-4 bg-black/50 border border-gray-500 rounded-lg animate-in zoom-in duration-150 shrink-0">
                                    <p className="text-gray-300 font-bold text-xl">遺志は継がれた...</p>
                                    <p className="text-sm text-gray-500 mt-1">次の児童が拾うことになる。</p>
                                </div>
                            )}
                            <div className="flex flex-col gap-4 items-center">
                                <button onClick={handleRetry} className="bg-black border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-800 flex items-center justify-center"><RotateCcw className="mr-2" size={20} /> {trans("再挑戦", languageMode)}</button>
                                <button
                                    onClick={returnToTitle}
                                    disabled={gameState.challengeMode === 'RACE'}
                                    className={`border-2 border-white px-8 py-3 w-64 flex items-center justify-center ${gameState.challengeMode === 'RACE'
                                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-70'
                                        : 'bg-gray-700 cursor-pointer hover:bg-gray-600'
                                        }`}
                                >
                                    <Home className="mr-2" size={20} /> {trans("タイトルへ戻る", languageMode)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {gameState.screen === GameScreen.ENDING && (
                    <div className="w-full h-full bg-yellow-900 flex flex-col items-center justify-start text-center text-white p-4 overflow-y-auto custom-scrollbar">
                        <div className="my-auto w-full max-w-2xl py-8">
                            <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-pulse shrink-0" />
                            <h1 className="text-4xl md:text-6xl mb-4 font-bold text-yellow-200 shrink-0">ゲームクリア！</h1>
                            <p className="mb-8 text-lg md:text-xl shrink-0">あなたは校長先生をせっとくし、<br />でんせつの しょうがくせいとして かたりつがれることでしょう。</p>

                            {/* Newly Unlocked Card Section */}
                            {newlyUnlockedCard && (
                                <div className="mb-8 p-6 bg-white/20 border-2 border-white rounded-2xl animate-in zoom-in duration-500 shadow-xl">
                                    <div className="flex items-center justify-center gap-2 text-white font-black text-xl mb-4 italic tracking-widest">
                                        <Sparkles size={24} /> NEW CARD UNLOCKED! <Sparkles size={24} />
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="scale-100">
                                            <Card card={newlyUnlockedCard} onClick={() => { }} disabled={false} languageMode={languageMode} />
                                        </div>
                                        <p className="text-sm text-yellow-100 font-bold">新しい学習の成果が、次回の冒険から現れるようになります！</p>
                                    </div>
                                </div>
                            )}

                            {!legacyCardSelected ? (
                                <div className="mb-8 shrink-0">
                                    <p className="mb-4 text-sm text-yellow-100 font-bold">次回の冒険に持っていくカードを1枚選んでください</p>
                                    <div className="flex flex-wrap justify-center gap-2 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-black/30 rounded border border-yellow-700/50">
                                        {gameState.player.deck.map(card => (
                                            <div key={card.id} className="scale-75 cursor-pointer hover:scale-90 transition-transform" onClick={() => handleLegacyCardSelect(card)}>
                                                <Card card={card} onClick={() => handleLegacyCardSelect(card)} disabled={false} languageMode={languageMode} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8 p-4 bg-green-900/50 border-green-500 rounded-lg animate-in zoom-in duration-150 shrink-0">
                                    <p className="text-green-400 font-bold text-xl">カードを継承しました！</p>
                                    <p className="text-sm text-green-200 mt-1">次の冒険の初期デッキに追加されます。</p>
                                </div>
                            )}
                            <div className="flex flex-col gap-4 items-center mt-4 pb-8 shrink-0">
                                <button onClick={startEndlessMode} className="bg-purple-900 border-4 border-purple-500 px-8 py-4 cursor-pointer text-xl hover:bg-purple-800 font-bold w-full max-sm shadow-[0_0_20px_rgba(168,85,247,0.5)] transform transition-transform hover:scale-105 active:scale-95 flex items-center justify-center animate-pulse">
                                    <Infinity className="mr-2" /> エンドレスモードへ (Act {gameState.act + 1})
                                </button>
                                <button onClick={returnToTitle} className="bg-blue-600 border-2 border-white px-8 py-4 cursor-pointer text-xl hover:bg-blue-500 font-bold w-full max-sm shadow-lg transform transition-transform hover:scale-105 active:scale-95">
                                    伝説となる ({trans("タイトルへ戻る", languageMode)})
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <SettingsModal
                    open={showSettingsModal}
                    tab={settingsTab}
                    settings={appSettings}
                    inputDevices={inputDevices}
                    onClose={() => setShowSettingsModal(false)}
                    onChangeTab={setSettingsTab}
                    onChange={updateSetting}
                    onResetAudio={resetAudioSettings}
                    onResetAll={resetAllSettings}
                />
            </div>
        </div>
    );
};

export default App;
