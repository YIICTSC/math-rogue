import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card as ICard, CardType, Enemy, EnemyIntentType, LanguageMode, Player, Potion, SelectionState, VisualEffectInstance } from '../types';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { trans } from '../utils/textUtils';
import EnemyIllustration from './EnemyIllustration';
import Card from './Card';
import { BattleFinisherCutinOverlay as StandardBattleFinisherCutinOverlay, FloatingTextOverlay as StandardFloatingTextOverlay, VFXOverlay as StandardVFXOverlay } from './BattleScene';
import { AlertCircle, FlaskConical, Gem, Heart, Keyboard, Shield, Skull, Triangle, Zap, Settings } from 'lucide-react';
import { buildPromptFromLesson, normalizeAnswer, getAcceptedAnswersForPrompt, getWeakKeyEntries, KEY_FINGER_MAP, type FingerId, type TypingPrompt } from '../data/typingPrompts';
import { PotionIcon, RelicIcon } from './ItemIcon';
import { getBattleBackgroundSceneById } from '../data/battleBackgrounds';
import { getThemedCharacterSpritePath, getThemedEnemyDisplayName, type HighSchoolEnemyAction, type VisualThemeId } from '../data/visualThemes';
import { isCardEligibleForCopySelection } from '../utils/cardCopySelection';
import type { BattleUiSettings } from './SettingsModal';

interface TypingBattleSceneProps {
    player: Player;
    enemies: Enemy[];
    selectedEnemyId: string | null;
    onSelectEnemy: (id: string) => void;
    onPlayTypingCard: (card: ICard) => void;
    onEndTurn: () => void;
    turnLog: string;
    narrative: string;
    actingEnemyId: string | null;
    selectionState: SelectionState;
    onHandSelection: (card: ICard) => void;
    onCancelSelection: () => void;
    onUsePotion: (potion: Potion) => void;
    combatLog: string[];
    languageMode: LanguageMode;
    activeEffects: VisualEffectInstance[];
    finisherCutinCard?: ICard | null;
    act: number;
    floor: number;
    lessonId?: string;
    combatExperience?: number;
    battleKey?: string;
    onAbort: () => void;
    hideEnemyIntents?: boolean;
    onOpenSettings?: () => void;
    battleBackgroundId?: string;
    visualTheme?: VisualThemeId;
    battleUiSettings?: BattleUiSettings;
}

const KEYBOARD_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '^'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '@', '['],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ':', ']'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '_'],
    ['space']
];

const FINGER_LABELS: Record<FingerId, string> = {
    'left-pinky': '左小指',
    'left-ring': '左薬指',
    'left-middle': '左中指',
    'left-index': '左人差し指',
    thumbs: '親指',
    'right-index': '右人差し指',
    'right-middle': '右中指',
    'right-ring': '右薬指',
    'right-pinky': '右小指'
};

const FINGER_COLORS: Record<FingerId, string> = {
    'left-pinky': 'bg-pink-500/25 border-pink-400 text-pink-200',
    'left-ring': 'bg-red-500/25 border-red-400 text-red-200',
    'left-middle': 'bg-orange-500/25 border-orange-400 text-orange-200',
    'left-index': 'bg-yellow-500/25 border-yellow-400 text-yellow-100',
    thumbs: 'bg-slate-500/25 border-slate-400 text-slate-100',
    'right-index': 'bg-emerald-500/25 border-emerald-400 text-emerald-100',
    'right-middle': 'bg-cyan-500/25 border-cyan-400 text-cyan-100',
    'right-ring': 'bg-blue-500/25 border-blue-400 text-blue-100',
    'right-pinky': 'bg-violet-500/25 border-violet-400 text-violet-100'
};

const renderIntent = (enemy: Enemy, hideEnemyIntents: boolean) => {
    if (hideEnemyIntents) {
        return <span className="tracking-[0.25em] text-slate-200">???</span>;
    }
    const intent = enemy.nextIntent;
    if (
        intent.type === EnemyIntentType.ATTACK ||
        intent.type === EnemyIntentType.ATTACK_DEBUFF ||
        intent.type === EnemyIntentType.ATTACK_DEFEND ||
        intent.type === EnemyIntentType.PIERCE_ATTACK
    ) {
        return (
            <>
                {intent.type === EnemyIntentType.PIERCE_ATTACK ? (
                    <div className="relative mr-1 flex items-center justify-center">
                        <Triangle size={16} className="fill-yellow-400 text-yellow-400" />
                        <span className="absolute top-[2px] text-[9px] font-black text-red-900">!</span>
                    </div>
                ) : (
                    <Skull size={12} className="mr-1 text-red-600" />
                )}
                {intent.value}
            </>
        );
    }
    if (intent.type === EnemyIntentType.DEFEND) {
        return <><Shield size={12} className="mr-1 text-blue-600" /> {intent.value}</>;
    }
    if (intent.type === EnemyIntentType.BUFF || intent.type === EnemyIntentType.DEBUFF || intent.type === EnemyIntentType.SLEEP) {
        return <><Zap size={12} className="mr-1 fill-yellow-500 text-yellow-500" /> !</>;
    }
    return <span className="text-gray-600">?</span>;
};

const HAND_FINGER_SEGMENTS: Record<'left' | 'right', Array<{ id: FingerId; path: string }>> = {
    left: [
        { id: 'left-pinky', path: 'M26 18 C18 20, 16 34, 20 49 C22 57, 29 57, 31 50 C34 39, 33 29, 36 18 Z' },
        { id: 'left-ring', path: 'M40 12 C33 12, 31 29, 33 48 C34 59, 42 61, 46 50 C49 38, 49 24, 50 13 Z' },
        { id: 'left-middle', path: 'M55 9 C48 9, 46 27, 47 50 C48 61, 57 63, 61 51 C64 36, 63 22, 64 9 Z' },
        { id: 'left-index', path: 'M71 12 C64 14, 62 31, 63 49 C64 58, 72 60, 76 51 C81 39, 81 25, 80 14 Z' },
        { id: 'thumbs', path: 'M68 56 C59 57, 51 63, 46 71 C42 77, 47 84, 55 83 C66 82, 76 74, 80 66 C83 60, 77 55, 68 56 Z' },
    ],
    right: [
        { id: 'right-pinky', path: 'M74 18 C82 20, 84 34, 80 49 C78 57, 71 57, 69 50 C66 39, 67 29, 64 18 Z' },
        { id: 'right-ring', path: 'M60 12 C67 12, 69 29, 67 48 C66 59, 58 61, 54 50 C51 38, 51 24, 50 13 Z' },
        { id: 'right-middle', path: 'M45 9 C52 9, 54 27, 53 50 C52 61, 43 63, 39 51 C36 36, 37 22, 36 9 Z' },
        { id: 'right-index', path: 'M29 12 C36 14, 38 31, 37 49 C36 58, 28 60, 24 51 C19 39, 19 25, 20 14 Z' },
        { id: 'thumbs', path: 'M32 56 C41 57, 49 63, 54 71 C58 77, 53 84, 45 83 C34 82, 24 74, 20 66 C17 60, 23 55, 32 56 Z' },
    ]
};

const TypingHandGuide: React.FC<{ side: 'left' | 'right'; activeFinger: FingerId | null }> = ({ side, activeFinger }) => (
    <div className="hidden h-40 w-28 shrink-0 flex-col items-center justify-end gap-1 lg:flex xl:h-44 xl:w-32">
        <div className="text-[9px] font-black tracking-[0.18em] text-slate-400">{side === 'left' ? 'LEFT HAND' : 'RIGHT HAND'}</div>
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_12px_rgba(0,0,0,0.4)]">
            <defs>
                <linearGradient id={`palm-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(241,245,249,0.32)" />
                    <stop offset="100%" stopColor="rgba(148,163,184,0.18)" />
                </linearGradient>
            </defs>
            <path d={side === 'left' ? 'M18 60 C18 43, 31 35, 48 35 H60 C79 35, 88 48, 86 66 C84 81, 74 90, 56 90 H36 C24 90, 18 79, 18 60 Z' : 'M82 60 C82 43, 69 35, 52 35 H40 C21 35, 12 48, 14 66 C16 81, 26 90, 44 90 H64 C76 90, 82 79, 82 60 Z'} fill={`url(#palm-${side})`} stroke="rgba(226,232,240,0.7)" strokeWidth="2.2" />
            {HAND_FINGER_SEGMENTS[side].map(segment => {
                const isActive = activeFinger === segment.id;
                return (
                    <g key={segment.id}>
                        <path
                            d={segment.path}
                            fill={isActive ? 'rgba(251,191,36,0.8)' : 'rgba(248,250,252,0.22)'}
                            stroke={isActive ? 'rgba(254,240,138,1)' : 'rgba(226,232,240,0.68)'}
                            strokeWidth={isActive ? 3.2 : 2}
                        />
                        {isActive && <path d={segment.path} fill="none" stroke="rgba(251,191,36,0.75)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />}
                    </g>
                );
            })}
            <circle cx="50" cy="80" r="16" fill="rgba(15,23,42,0.42)" />
        </svg>
        <div className="rounded border border-slate-600 bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-slate-200">
            {activeFinger ? FINGER_LABELS[activeFinger] : '待機'}
        </div>
    </div>
);

const TypingBattleScene: React.FC<TypingBattleSceneProps> = ({
    player,
    enemies,
    selectedEnemyId,
    onSelectEnemy,
    onPlayTypingCard,
    onEndTurn,
    turnLog,
    narrative,
    actingEnemyId,
    selectionState,
    onHandSelection,
    onCancelSelection,
    onUsePotion,
    combatLog,
    languageMode,
    activeEffects,
    finisherCutinCard,
    act,
    floor,
    lessonId,
    combatExperience = 0,
    battleKey,
    onAbort,
    hideEnemyIntents = false,
    onOpenSettings,
    battleBackgroundId,
    visualTheme = 'elementary',
    battleUiSettings
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autoEndTimerRef = useRef<number | null>(null);
    const rtbIntervalRef = useRef<number | null>(null);
    const prevActingRef = useRef<string | null>(null);
    const mistypeFlashTimerRef = useRef<number | null>(null);
    const mistypeShakeTimerRef = useRef<number | null>(null);
    const seenShakeEffectIdsRef = useRef<Set<string>>(new Set());

    const [input, setInput] = useState('');
    const [promptSequence,setPromptSequence] = useState(0);
    const battleExperience = useMemo(()=>combatExperience,[battleKey,act,floor]);
    const [prompt, setPrompt] = useState<TypingPrompt | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('タイピング準備OK');
    const [rtbDeadline, setRtbDeadline] = useState<number | null>(null);
    const [rtbNow, setRtbNow] = useState(Date.now());
    const [isShaking, setIsShaking] = useState(false);
    const [lastVisibleEnemies, setLastVisibleEnemies] = useState<Enemy[]>([]);
    const [wrongInputStreak, setWrongInputStreak] = useState(0);
    const [mistypeFlashActive, setMistypeFlashActive] = useState(false);
    const [mistypeShakeActive, setMistypeShakeActive] = useState(false);

    const currentCard = useMemo(() => {
        if (player.hand.length === 0) return null;
        return player.hand[0] ?? null;
    }, [player.hand]);
    const queuedHandCards = useMemo(() => player.hand.slice(1), [player.hand]);
    const normalizedAnswers = useMemo(() => getAcceptedAnswersForPrompt(prompt), [prompt]);
    const battleUiStyle = battleUiSettings ? {
        '--typing-battle-enemy-scale': battleUiSettings.enemyScale,
        '--typing-battle-player-scale': battleUiSettings.playerScale,
        '--typing-battle-enemy-offset-y': `${battleUiSettings.enemyOffsetY}px`,
        '--typing-battle-player-offset-y': `${battleUiSettings.playerOffsetY}px`,
        '--typing-battle-stats-scale': battleUiSettings.statsScale
    } as React.CSSProperties : undefined;
    const playerSpriteSource = getThemedCharacterSpritePath(
        visualTheme,
        player.id,
        'idle',
        player.imageData,
        !!player.magicTransformed,
        player.magicProtagonistId,
        player.magicProtagonistGender,
        player.appearanceMode,
    );
    const isMagicMalePlayerSprite = visualTheme === 'magic'
        && player.magicProtagonistGender === 'male';
    const getRelicCounter = (relicId: string) => {
        if (relicId === 'KUNAI' || relicId === 'SHURIKEN' || relicId === 'ORNAMENTAL_FAN') {
            return player.relicCounters['ATTACK_COUNT'];
        }
        return player.relicCounters[relicId];
    };
    const displayedRelics = useMemo(() => {
        return [...player.relics].sort((a, b) => {
            const countA = getRelicCounter(a.id) || 0;
            const countB = getRelicCounter(b.id) || 0;
            if (countA > 0 && countB <= 0) return -1;
            if (countA <= 0 && countB > 0) return 1;
            return 0;
        });
    }, [player.relicCounters, player.relics]);
    const nextExpectedKey = useMemo(() => {
        if (!prompt) return '';
        const typed = normalizeAnswer(input);
        const answer = normalizedAnswers.find(candidate => candidate.startsWith(typed))
            ?? normalizedAnswers[0]
            ?? normalizeAnswer(prompt.answer);
        return answer[typed.length] ?? answer[answer.length - 1] ?? '';
    }, [prompt, input, normalizedAnswers]);
    const currentFinger = (nextExpectedKey && KEY_FINGER_MAP[nextExpectedKey]) || prompt?.finger || null;
    const isWrongPrefix = !!prompt && normalizeAnswer(input).length > 0 && !normalizedAnswers.some(answer => answer.startsWith(normalizeAnswer(input)));
    const weakKeyEntries = useMemo(() => getWeakKeyEntries(lessonId), [lessonId, prompt?.id, input.length]);

    const rtbDurationMs = useMemo(() => {
        const duration = 7000 - act * 700 - floor * 70;
        return Math.max(2800, duration) + Math.min(8000,Math.max(0,(prompt?.answer.length || 0)-12)*90);
    }, [act, floor,prompt?.answer.length]);

    const rtbRatio = useMemo(() => {
        if (!rtbDeadline) return 1;
        return Math.max(0, Math.min(1, (rtbDeadline - rtbNow) / rtbDurationMs));
    }, [rtbDeadline, rtbNow, rtbDurationMs]);
    const isFinisherActive = !!finisherCutinCard;
    const visualEnemies = useMemo(() => (isFinisherActive && enemies.length === 0 ? lastVisibleEnemies : enemies), [isFinisherActive, enemies, lastVisibleEnemies]);

    const promptFillCount = useMemo(() => {
        if (!prompt) return 0;
        const typedLen = normalizeAnswer(input).length;
        const matchedAnswer = normalizedAnswers.find(answer => answer.startsWith(normalizeAnswer(input)))
            ?? normalizedAnswers[0]
            ?? normalizeAnswer(prompt.answer);
        const answerLen = Math.max(1, matchedAnswer.length);
        return Math.min(prompt.text.length, Math.ceil((typedLen / answerLen) * prompt.text.length));
    }, [prompt, input, normalizedAnswers]);

    useEffect(() => {
        if (currentCard) {
            setPrompt(buildPromptFromLesson(lessonId, act, floor, currentCard.name, languageMode,battleExperience));
            setInput('');
            setStatusMessage(`${trans(currentCard.name, languageMode)} をタイピングで起動`);
        } else {
            setPrompt(null);
            setInput('');
            setStatusMessage(selectionState.active ? '手札から必要なカードを選択' : '使えるカードがないためターンを進めます');
        }
    }, [currentCard?.id, currentCard?.name, act, floor, languageMode, selectionState.active, lessonId,battleKey,promptSequence]);

    useEffect(() => {
        const prevActing = prevActingRef.current;
        if (!actingEnemyId && (prevActing || rtbDeadline === null) && !selectionState.active && enemies.length > 0) {
            setRtbDeadline(Date.now() + rtbDurationMs);
        }
        if (actingEnemyId) {
            setRtbDeadline(null);
        }
        prevActingRef.current = actingEnemyId;
    }, [actingEnemyId, enemies.length, selectionState.active, rtbDurationMs, rtbDeadline]);

    useEffect(() => {
        if (rtbIntervalRef.current) window.clearInterval(rtbIntervalRef.current);
        rtbIntervalRef.current = window.setInterval(() => setRtbNow(Date.now()), 100);
        return () => {
            if (rtbIntervalRef.current) window.clearInterval(rtbIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (rtbRatio > 0 || !rtbDeadline || actingEnemyId || selectionState.active) return;
        setRtbDeadline(null);
        onEndTurn();
    }, [rtbRatio, rtbDeadline, actingEnemyId, selectionState.active, onEndTurn]);

    useEffect(() => {
        if (activeEffects.length === 0) {
            seenShakeEffectIdsRef.current.clear();
            setIsShaking(false);
            return;
        }

        const shakeEffects = activeEffects.filter(effect =>
            effect.screenShake !== false &&
            ['SLASH', 'FIRE', 'EXPLOSION', 'LIGHTNING', 'CRITICAL'].includes(effect.type)
        );
        const newShakeEffects = shakeEffects.filter(effect => !seenShakeEffectIdsRef.current.has(effect.id));
        shakeEffects.forEach(effect => seenShakeEffectIdsRef.current.add(effect.id));
        if (newShakeEffects.length === 0) return;

        setIsShaking(true);
        const timer = window.setTimeout(() => setIsShaking(false), 400);
        return () => {
            window.clearTimeout(timer);
            setIsShaking(false);
        };
    }, [activeEffects]);

    useEffect(() => {
        if (enemies.length > 0) {
            setLastVisibleEnemies(enemies.map(enemy => ({ ...enemy })));
        }
    }, [enemies]);

    useEffect(() => {
        if (!selectionState.active && !actingEnemyId) {
            inputRef.current?.focus();
        }
    }, [prompt?.id, selectionState.active, actingEnemyId]);

    useEffect(() => {
        if (wrongInputStreak < 20) return;
        audioService.playBattleSound('wrong');
        setStatusMessage('ミスタイプが続いたため タイトルへ もどります');
        const timer = window.setTimeout(() => {
            onAbort();
        }, 700);
        return () => window.clearTimeout(timer);
    }, [onAbort, wrongInputStreak]);

    useEffect(() => {
        if (autoEndTimerRef.current) {
            window.clearTimeout(autoEndTimerRef.current);
            autoEndTimerRef.current = null;
        }
        if (!currentCard && !selectionState.active && !actingEnemyId && enemies.length > 0) {
            autoEndTimerRef.current = window.setTimeout(() => onEndTurn(), 900);
        }
        return () => {
            if (autoEndTimerRef.current) window.clearTimeout(autoEndTimerRef.current);
        };
    }, [currentCard, selectionState.active, actingEnemyId, enemies.length, onEndTurn]);

    useEffect(() => {
        return () => {
            if (mistypeFlashTimerRef.current) window.clearTimeout(mistypeFlashTimerRef.current);
            if (mistypeShakeTimerRef.current) window.clearTimeout(mistypeShakeTimerRef.current);
        };
    }, []);

    const handleSuccess = () => {
        if (!prompt || !currentCard) return;
        audioService.playBattleSound('attack');
        setStatusMessage(`${trans(currentCard.name, languageMode)} を自動使用`);
        setWrongInputStreak(0);
        if (lessonId && nextExpectedKey) {
            storageService.decayTypingWeakKey(lessonId, nextExpectedKey, 1);
        }
        setInput('');
        setPromptSequence(n=>n+1);
        onPlayTypingCard(currentCard);
    };

    const triggerMistypeFeedback = () => {
        audioService.playBattleSound('wrong');
        setMistypeFlashActive(true);
        setMistypeShakeActive(true);

        if (mistypeFlashTimerRef.current) window.clearTimeout(mistypeFlashTimerRef.current);
        if (mistypeShakeTimerRef.current) window.clearTimeout(mistypeShakeTimerRef.current);

        mistypeFlashTimerRef.current = window.setTimeout(() => setMistypeFlashActive(false), 180);
        mistypeShakeTimerRef.current = window.setTimeout(() => setMistypeShakeActive(false), 220);
    };

    const handleInputChange = (value: string) => {
        if (!prompt) return;
        const normalized = normalizeAnswer(value);
        if (normalized.length === 0) {
            setInput(value);
            return;
        }
        if (!normalizedAnswers.some(answer => answer.startsWith(normalized))) {
            triggerMistypeFeedback();
            setWrongInputStreak(prev => prev + 1);
            if (lessonId && nextExpectedKey) {
                storageService.recordTypingWeakKey(lessonId, nextExpectedKey);
            }
            return;
        }
        setWrongInputStreak(0);
        setInput(value);
        if (normalizedAnswers.includes(normalized)) {
            handleSuccess();
        }
    };

    const focusInput = () => inputRef.current?.focus();
    const battleBackgroundScene = getBattleBackgroundSceneById(
        battleBackgroundId,
        visualTheme as 'elementary' | 'high-school' | 'magic',
        player.appearanceMode,
    );

    return (
        <div className={`flex h-full w-full flex-col overflow-hidden bg-gray-950 text-white ${isShaking ? 'animate-screen-shake' : ''}`} style={battleUiStyle} onClick={focusInput}>
            <input
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
                disabled={!prompt || !!actingEnemyId || selectionState.active}
                className="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
            />

            <div className={`relative shrink-0 border-b-2 border-gray-700 bg-black p-2 shadow-md ${mistypeShakeActive ? 'animate-mistype-jolt' : ''}`}>
                <div className={`pointer-events-none absolute inset-0 bg-red-500/20 transition-opacity duration-150 ${mistypeFlashActive ? 'opacity-100' : 'opacity-0'}`} />
                <div className="flex w-full flex-col overflow-hidden pr-24">
                    <div className="mb-0.5 truncate text-xs font-bold leading-snug text-green-400 drop-shadow-md">
                        <span className="mr-2 animate-pulse">&gt;&gt;</span> {trans(narrative, languageMode)}
                    </div>
                    <div className="truncate text-[10px] leading-snug text-gray-200">{trans(statusMessage, languageMode)}</div>
                </div>
                <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                    <div className="rounded border border-yellow-700 bg-gray-900/80 px-2 py-0.5 text-[10px] font-bold text-yellow-400">{trans(turnLog, languageMode)}</div>
                    <div className="rounded border border-amber-500/50 bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-100">{prompt?.title ?? 'AUTO TURN'}</div>
                    {onOpenSettings && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenSettings();
                            }}
                            className="flex items-center gap-1 border-2 border-slate-500 bg-slate-800 px-2 py-1 text-[10px] font-black text-slate-100 shadow-[2px_2px_0_0_rgba(15,23,42,0.95)] transition-all hover:bg-slate-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            title={trans("セッティング", languageMode)}
                        >
                            <Settings size={10} /> SET
                        </button>
                    )}
                </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-y-auto bg-gray-800/50 p-2 custom-scrollbar">
                <div
                    className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-76"
                    style={{ backgroundImage: `url(${battleBackgroundScene.image})` }}
                />
                <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950/45" />
                <div className="relative z-10 flex min-h-[150px] shrink-0 items-start justify-center gap-3 pt-7 md:min-h-[210px] md:pt-10">
                    {visualEnemies.map(enemy => {
                        const enemyHpPercent = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
                        const isSelected = !isFinisherActive && (selectedEnemyId === enemy.id || (!selectedEnemyId && visualEnemies.length === 1));
                        const enemyName = trans(getThemedEnemyDisplayName(enemy, visualTheme), languageMode);
                        const highSchoolEnemyAction: HighSchoolEnemyAction = actingEnemyId !== enemy.id
                            ? 'idle'
                            : ['ATTACK', 'ATTACK_DEBUFF', 'ATTACK_DEFEND', 'PIERCE_ATTACK'].includes(enemy.nextIntent.type)
                                ? 'attack'
                                : 'skill';
                        const enemySvgAliases = enemy.enemyType === 'THE_HEART' && enemy.phase === 2
                            ? ['THE_HEART_PHASE2', '真ボス2形態目', '真ボス_2', '真ボス第二形態', `${enemy.enemyType}_2`]
                            : [];
                        return (
                            <div
                                key={enemy.id}
                                onClick={() => {
                                    if (!isFinisherActive) onSelectEnemy(enemy.id);
                                }}
                                className={`relative z-10 flex flex-col items-center transition-all duration-200 ${isFinisherActive ? '!z-[300]' : ''} ${isSelected ? 'z-20 scale-105 cursor-pointer' : !isFinisherActive ? 'cursor-pointer hover:scale-105' : ''}`}
                                style={{ transform: `translateY(var(--typing-battle-enemy-offset-y, 0px)) scale(var(--typing-battle-enemy-scale, 1))` }}
                            >
                                {!isFinisherActive && (
                                    <div className="absolute -top-5 left-1/2 z-30 flex min-w-[36px] -translate-x-1/2 items-center justify-center rounded border-2 border-red-600 bg-white px-1 py-0.5 text-[10px] font-extrabold text-black shadow-xl">
                                        {renderIntent(enemy, hideEnemyIntents)}
                                    </div>
                                )}

                                <div className="relative mb-1 h-28 w-28 transition-all duration-300 md:h-40 md:w-40">
                                    <EnemyIllustration
                                        name={enemy.name}
                                        seed={enemy.id}
                                        aliases={enemySvgAliases}
                                        visualTheme={visualTheme}
                                        appearanceMode={player.appearanceMode}
                                        enemyType={enemy.enemyType}
                                        phase={enemy.phase}
                                        action={highSchoolEnemyAction}
                                        className="relative z-10 h-full w-full drop-shadow-lg"
                                    />
                                    {!isFinisherActive && <StandardFloatingTextOverlay data={enemy.floatingText} languageMode={languageMode} />}
                                    {!isFinisherActive && <StandardVFXOverlay effects={activeEffects} targetId={enemy.id} />}
                                </div>

                                {!isFinisherActive && (
                                    <div className="relative z-10 w-28 rounded border-2 border-gray-600 bg-black/90 px-1.5 py-1 text-[9px] text-white shadow-md md:w-36 md:text-[10px]" style={{ transform: `scale(var(--typing-battle-stats-scale, 1))` }}>
                                        {isSelected && (
                                            <div
                                                aria-hidden="true"
                                                className="pointer-events-none absolute -left-1 -top-2 text-base font-black leading-none text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.9)]"
                                            >
                                                ▼
                                            </div>
                                        )}
                                        <div className="mb-0.5 flex h-4 w-full items-center justify-between overflow-hidden">
                                            <div className="min-w-0 flex-1 truncate font-bold text-red-200">{enemyName}</div>
                                            {enemy.block > 0 && (
                                                <span className="ml-1 flex shrink-0 items-center rounded bg-blue-900/80 px-1 text-[8px] font-bold text-blue-300">
                                                    <Shield size={8} className="mr-0.5" /> {enemy.block}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative mb-0.5 h-3 w-full overflow-hidden rounded-full border border-gray-600 bg-gray-800">
                                            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500" style={{ width: `${enemyHpPercent}%` }} />
                                            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                                                {enemy.currentHp}/{enemy.maxHp}
                                            </div>
                                        </div>
                                        <div className="flex min-h-[12px] flex-wrap justify-center gap-0.5">
                                            {enemy.vulnerable > 0 && (
                                                <div className="flex items-center rounded border border-pink-500/50 bg-pink-900/80 px-0.5">
                                                    <AlertCircle size={8} className="text-pink-300" /> <span className="ml-0.5 text-[8px] font-bold">{enemy.vulnerable}</span>
                                                </div>
                                            )}
                                            {enemy.weak > 0 && (
                                                <div className="flex items-center rounded border border-gray-500/50 bg-gray-700/80 px-0.5">
                                                    <span className="text-[8px] font-bold text-gray-300">{trans('弱', languageMode)} {enemy.weak}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-h-[136px] min-w-0 flex-1 items-end gap-2 p-1.5">
                        <div className="relative h-28 w-28 shrink-0 md:h-36 md:w-36" style={{ transform: `translateY(var(--typing-battle-player-offset-y, 0px)) scale(var(--typing-battle-player-scale, 1))` }}>
                            <img
                                src={playerSpriteSource}
                                alt={trans('主人公', languageMode)}
                                className={`h-full w-full drop-shadow-lg ${isMagicMalePlayerSprite ? 'object-contain' : 'pixel-art'}`}
                                style={isMagicMalePlayerSprite ? undefined : { imageRendering: 'pixelated' }}
                            />
                            <StandardVFXOverlay effects={activeEffects} targetId="player" />
                            <StandardFloatingTextOverlay data={player.floatingText} languageMode={languageMode} />
                        </div>
                        <div className="flex min-h-[124px] w-[min(52vw,240px)] min-w-[170px] flex-col rounded border-2 border-white bg-black/85 p-1.5 text-xs text-white shadow-lg" style={{ transform: `scale(var(--typing-battle-stats-scale, 1))`, transformOrigin: 'bottom left' }}>
                            <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-200">Player</div>
                            <div className="mb-1 flex items-center justify-between">
                                <span className="flex items-center font-bold text-red-400"><Heart size={12} className="mr-1" /> {player.currentHp}/{player.maxHp}</span>
                                <span className="flex items-center font-bold text-blue-400"><Shield size={12} className="mr-1" /> {player.block}</span>
                            </div>
                            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full border border-gray-500 bg-gray-700">
                                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.max(0, (player.currentHp / player.maxHp) * 100)}%` }} />
                            </div>
                            <div className="mb-1 flex items-center justify-between border-t border-gray-700 pt-1">
                                <div className="flex min-w-0 flex-1 -space-x-1 overflow-hidden">
                                    {displayedRelics.slice(0, 5).map(relic => {
                                        const counter = getRelicCounter(relic.id);
                                        return (
                                            <div key={relic.id} className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-yellow-600 bg-gray-700 p-0.5">
                                                <RelicIcon id={relic.id} alt={trans(relic.name, languageMode)} />
                                                {counter !== undefined && counter > 0 && (
                                                    <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-red-600 text-[7px] font-bold text-white">
                                                        {counter}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {player.relics.length > 5 && (
                                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-500 bg-gray-800 text-[7px] font-bold text-white">
                                            +{player.relics.length - 5}
                                        </div>
                                    )}
                                    {player.relics.length === 0 && <span className="text-[8px] text-gray-500">{trans("もちものなし", languageMode)}</span>}
                                </div>
                                <div className="ml-2 flex shrink-0 gap-0.5">
                                    {player.potions.map(potion => (
                                        <button
                                            key={potion.id}
                                            onClick={() => {
                                                if (!actingEnemyId && !selectionState.active) onUsePotion(potion);
                                            }}
                                            className="flex h-4 w-4 items-center justify-center rounded border border-white bg-gray-800 hover:scale-110 disabled:opacity-50"
                                            disabled={!!actingEnemyId || selectionState.active}
                                            title={trans(potion.name, languageMode)}
                                        >
                                            <PotionIcon id={potion.templateId} alt={potion.name} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-auto flex items-center justify-between text-[8px] text-gray-300">
                                <span>{trans('手札', languageMode)} {player.hand.length}</span>
                                <span>{trans('山札', languageMode)} {player.drawPile.length}</span>
                                <span>{trans('捨札', languageMode)} {player.discardPile.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-[132px] min-w-[128px] max-w-[180px] shrink-0 flex-col items-center self-end p-1.5">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">Next Card</div>
                        <div className="flex h-full w-full items-center justify-center p-1">
                            {currentCard ? (
                                <div className="relative h-[92px] w-[82px]">
                                    {queuedHandCards.slice(0, 5).map((card, index) => {
                                        const depth = Math.min(queuedHandCards.length - index, 5);
                                        return (
                                            <div
                                                key={card.id}
                                                className="absolute left-1/2 top-1/2 z-0 origin-top -translate-x-1/2 -translate-y-1/2 scale-[0.58] opacity-70 md:scale-[0.64]"
                                                style={{
                                                    marginLeft: `${depth * 3}px`,
                                                    marginTop: `${depth * 1.5}px`,
                                                    zIndex: 10 - depth
                                                }}
                                            >
                                                <Card card={card} onClick={() => {}} disabled={false} appearanceMode={player.appearanceMode} />
                                            </div>
                                        );
                                    })}
                                    <div className="absolute left-1/2 top-1/2 z-10 origin-top -translate-x-1/2 -translate-y-1/2 scale-[0.58] md:scale-[0.64]">
                                        <Card card={currentCard} onClick={() => {}} disabled={false} appearanceMode={player.appearanceMode} />
                                    </div>
                                    {queuedHandCards.length > 0 && (
                                        <div className="absolute -right-1 -top-1 z-20 rounded-full border border-emerald-300/60 bg-emerald-950/90 px-1.5 py-0.5 text-[9px] font-black text-emerald-200">
                                            +{queuedHandCards.length}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="px-2 text-center text-xs font-bold text-slate-400">{trans('使えるカード待機中', languageMode)}</div>
                            )}
                        </div>
                    </div>
                </div>

                {selectionState.active && (
                    <div className="rounded-xl border border-indigo-500/60 bg-indigo-950/30 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-black text-indigo-200">
                            <span>{trans('効果で手札選択が必要です', languageMode)}</span>
                            <button onClick={onCancelSelection} className="rounded border border-rose-500/60 px-2 py-1 text-rose-200 hover:bg-rose-900/30">{trans('選択をやめる', languageMode)}</button>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {player.hand.map(card => {
                                const copyTargetDisabled = selectionState.type === 'COPY'
                                    && !isCardEligibleForCopySelection(card, selectionState, player.hand);
                                return (
                                    <button
                                        key={card.id}
                                        onClick={() => onHandSelection(card)}
                                        disabled={copyTargetDisabled}
                                        className={`shrink-0 rounded border p-1 ${copyTargetDisabled
                                            ? 'cursor-not-allowed border-slate-700 bg-slate-950/40 opacity-35'
                                            : 'border-indigo-400/50 bg-slate-950/70'}`}
                                    >
                                        <div className="origin-top-left scale-[0.75]">
                                            <Card card={card} onClick={() => {}} disabled={copyTargetDisabled} appearanceMode={player.appearanceMode} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="relative flex h-32 shrink-0 items-center justify-between border-t-2 border-white bg-gray-800 px-2 shadow-lg">
                <div className="flex min-w-[150px] items-center gap-2">
                    <div className="flex items-center rounded-full border-2 border-yellow-500 bg-black px-2 py-0.5 text-yellow-400 shadow-lg">
                        <Zap size={14} className="mr-1 fill-yellow-400" />
                        <span className="text-lg font-bold">{player.currentEnergy}/{player.maxEnergy}</span>
                    </div>
                    <div className="rounded border border-slate-600 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-300">ACT {act} / FLOOR {Math.max(1, floor)}</div>
                </div>

                <div className="absolute left-1/2 top-1/2 flex w-[min(52vw,560px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 px-2">
                    <div className={`w-full overflow-hidden rounded-2xl border px-3 py-1.5 text-center text-lg font-black tracking-[0.2em] text-white md:text-xl transition-[transform,border-color,box-shadow,background-color] duration-150 ${mistypeFlashActive ? 'border-red-400/80 bg-red-950/60 shadow-[0_0_22px_rgba(248,113,113,0.28)]' : 'border-cyan-400/40 bg-slate-950/90'} ${mistypeShakeActive ? 'animate-mistype-jolt' : ''}`}>
                        <div className="mb-1.5 flex items-center gap-2">
                            <span className="shrink-0 text-[9px] font-black tracking-[0.22em] text-cyan-300 md:text-[10px]">RTB</span>
                            <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-900/90">
                                <div className={`h-full transition-[width] duration-100 ${rtbRatio > 0.35 ? 'bg-emerald-400' : rtbRatio > 0.15 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${rtbRatio * 100}%` }} />
                            </div>
                        </div>
                        {prompt ? prompt.text.split('').map((char, index) => (
                            <span
                                key={`${prompt.id}-${index}`}
                                className={`inline-block min-w-[0.8em] rounded px-[1px] transition-all duration-200 ${index < promptFillCount ? 'bg-cyan-400 text-slate-950 scale-105 shadow-[0_0_10px_rgba(34,211,238,0.35)]' : 'text-white/90'} ${isWrongPrefix ? 'border-b border-red-400' : ''}`}
                                style={index < promptFillCount ? { animation: 'typing-fill-pop 180ms ease-out' } : undefined}
                            >
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        )) : '...'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-300">
                        <span className={`rounded border px-2 py-0.5 transition-colors duration-150 ${mistypeFlashActive ? 'border-red-400/70 text-red-100' : 'border-slate-600'}`}>{trans('次キー', languageMode)}: {nextExpectedKey || '-'}</span>
                        <span className={`rounded border px-2 py-0.5 transition-colors duration-150 ${mistypeFlashActive ? 'border-red-400/70 text-red-100' : 'border-slate-600'}`}>{trans('担当指', languageMode)}: {currentFinger ? FINGER_LABELS[currentFinger] : trans('IME入力', languageMode)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300">
                        <span className="rounded border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 font-bold text-amber-200">{trans('今の重点練習', languageMode)}</span>
                        {weakKeyEntries.length > 0 ? weakKeyEntries.map(([char, count]) => (
                            <span key={char} className="rounded border border-slate-600 bg-slate-950/70 px-2 py-0.5 font-bold text-slate-200">
                                {char} x{count}
                            </span>
                        )) : (
                            <span className="text-slate-500">{trans('まだ記録なし', languageMode)}</span>
                        )}
                    </div>
                </div>

                <button
                    onClick={!actingEnemyId && !selectionState.active ? onEndTurn : undefined}
                    disabled={!!actingEnemyId || selectionState.active}
                    className={`ml-auto rounded border-2 border-white bg-red-600 px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                        !actingEnemyId && !selectionState.active ? 'cursor-pointer hover:bg-red-500 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none' : 'cursor-not-allowed opacity-50 grayscale'
                    }`}
                >
                    {selectionState.active ? trans('選択', languageMode) : trans('ターン終了', languageMode)}
                </button>
            </div>

            <div className={`relative z-10 h-52 border-t border-gray-700 bg-gray-900 transition-colors duration-150 sm:h-56 md:h-60 lg:h-64 ${selectionState.active ? 'bg-blue-900/20' : ''} ${mistypeFlashActive ? 'bg-red-950/35' : ''}`} onClick={focusInput}>
                <div className="group/keyboard flex h-full w-full items-end justify-center gap-3 overflow-x-auto px-3 pb-3 pt-3 custom-scrollbar sm:px-4 sm:pb-4">
                    <TypingHandGuide side="left" activeFinger={currentFinger} />
                    <div className={`w-full max-w-5xl rounded-xl border bg-slate-950/70 p-2 transition-[transform,border-color,box-shadow] duration-150 sm:p-3 ${mistypeFlashActive ? 'border-red-400/70 shadow-[0_0_18px_rgba(248,113,113,0.18)]' : 'border-slate-700'} ${mistypeShakeActive ? 'animate-mistype-jolt' : ''}`}>
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-yellow-300">
                            <Keyboard size={14} /> JIS Keyboard Guide
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                            {KEYBOARD_ROWS.map((row, rowIndex) => (
                                <div key={`row-${rowIndex}`} className="flex flex-wrap justify-center gap-1">
                                    {row.map(key => {
                                        const finger = KEY_FINGER_MAP[key];
                                        const isActive = nextExpectedKey === key;
                                        const isHome = key === 'f' || key === 'j';
                                        return (
                                            <div
                                                key={key}
                                                className={`flex h-8 min-w-8 items-center justify-center rounded border px-2 text-[11px] font-black uppercase transition-[transform,border-color,background-color,box-shadow] duration-150 sm:h-9 sm:min-w-9 sm:text-xs ${
                                                    isActive ? (mistypeFlashActive ? 'border-red-300 bg-red-500/35 text-white shadow-[0_0_18px_rgba(248,113,113,0.35)]' : 'border-amber-300 bg-amber-500/40 text-white shadow-[0_0_18px_rgba(251,191,36,0.35)]') :
                                                    finger ? `${FINGER_COLORS[finger]} border` :
                                                    'border-slate-700 bg-slate-950/70 text-slate-300'
                                                } ${mistypeShakeActive && isActive ? 'animate-mistype-jolt' : ''} ${key === 'space' ? 'min-w-28 sm:min-w-40' : ''}`}
                                            >
                                                {key}
                                                {isHome && <span className="ml-1 text-[9px] text-amber-200">•</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <TypingHandGuide side="right" activeFinger={currentFinger} />
                </div>
            </div>

            {finisherCutinCard && <StandardBattleFinisherCutinOverlay card={finisherCutinCard} languageMode={languageMode} appearanceMode={player.appearanceMode} />}
            <style>{`
                @keyframes typing-fill-pop {
                    0% { transform: scale(0.85); filter: brightness(1.6); }
                    70% { transform: scale(1.12); filter: brightness(1.15); }
                    100% { transform: scale(1.05); filter: brightness(1); }
                }
                @keyframes mistype-jolt {
                    0% { transform: translate3d(0, 0, 0); }
                    20% { transform: translate3d(-3px, 0, 0); }
                    40% { transform: translate3d(3px, -1px, 0); }
                    60% { transform: translate3d(-2px, 1px, 0); }
                    80% { transform: translate3d(2px, 0, 0); }
                    100% { transform: translate3d(0, 0, 0); }
                }
                .animate-mistype-jolt {
                    animation: mistype-jolt 180ms ease-out;
                }
            `}</style>
        </div>
    );
};

export default TypingBattleScene;
