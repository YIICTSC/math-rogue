import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Coins, Heart, RefreshCcw, Shuffle, Sparkles } from 'lucide-react';
import { CARDS_LIBRARY, HERO_IMAGE_DATA, STARTING_DECK_TEMPLATE } from '../constants';
import { DODOMEDESU_BOSS_READY_FLAG, DODOMEDESU_EVENT_STAGES } from '../data/dodomedesuBoss';
import { MAGIC_ENDLESS_EVENTS, MAGIC_ENDLESS_MALE_EVENTS } from '../data/magicEndlessEvents';
import { HIGH_SCHOOL_SUPPORTER_NPC_EVENTS } from '../data/supporterNpcEvents';
import { HIGH_SCHOOL_EVENT_THEMES, MAGIC_EVENT_THEMES, type VisualThemeId } from '../data/visualThemes';
import { ELEMENTARY_EVENT_TITLES, generateEvent, generateLegacyEvent, generateMagicEndlessEvent } from '../services/eventService';
import { GameMode, GameScreen, type GameState, type LanguageMode, type Player } from '../types';
import { applyMagicEndlessEventEffects } from '../utils/magicEndlessEventEffects';
import EventScreen from './EventScreen';
import TranslatedUiTree from './TranslatedUiTree';

interface EventSimulationScreenProps {
  theme: VisualThemeId;
  languageMode: LanguageMode;
  onBack: () => void;
}

type SimulationEvent = ReturnType<typeof generateEvent>;
type SimulationMode = 'normal' | 'endless';
type MagicEndlessGender = 'female' | 'male';

const NORMAL_EVENT_TITLES: Record<VisualThemeId, string[]> = {
  elementary: [...ELEMENTARY_EVENT_TITLES],
  'high-school': HIGH_SCHOOL_EVENT_THEMES.map(event => event.title),
  magic: MAGIC_EVENT_THEMES.map(event => event.title),
};

const ENDLESS_SHARED_EVENT_TITLES = [
  'あずきとの出会い',
  ...DODOMEDESU_EVENT_STAGES.map(stage => stage.title),
];

const getEndlessEventTitles = (
  theme: VisualThemeId,
  magicGender: MagicEndlessGender,
  chapter: number,
): string[] => {
  if (theme === 'magic') {
    const source = magicGender === 'male' ? MAGIC_ENDLESS_MALE_EVENTS : MAGIC_ENDLESS_EVENTS;
    return [
      ...source.filter(event => event.availableFrom <= chapter).map(event => event.title),
      ...ENDLESS_SHARED_EVENT_TITLES,
    ];
  }
  if (theme === 'high-school') {
    return [
      ...HIGH_SCHOOL_SUPPORTER_NPC_EVENTS.map(event => event.title),
      ...ENDLESS_SHARED_EVENT_TITLES,
    ];
  }
  return ENDLESS_SHARED_EVENT_TITLES;
};

const isSharedEndlessEvent = (title: string) => ENDLESS_SHARED_EVENT_TITLES.includes(title);

const THEME_LABELS: Record<VisualThemeId, string> = {
  elementary: '小学生編',
  'high-school': '高校編',
  magic: 'マジック編',
};

const THEME_ACCENTS: Record<VisualThemeId, { border: string; text: string; button: string }> = {
  elementary: {
    border: 'border-emerald-500/50',
    text: 'text-emerald-200',
    button: 'border-emerald-300 bg-emerald-700 hover:bg-emerald-600',
  },
  'high-school': {
    border: 'border-sky-500/50',
    text: 'text-sky-200',
    button: 'border-sky-300 bg-sky-700 hover:bg-sky-600',
  },
  magic: {
    border: 'border-fuchsia-500/50',
    text: 'text-fuchsia-200',
    button: 'border-fuchsia-300 bg-fuchsia-800 hover:bg-fuchsia-700',
  },
};

const createSimulationPlayer = (magicGender: MagicEndlessGender = 'female'): Player => ({
  id: 'WARRIOR',
  magicProtagonistId: magicGender === 'male' ? 'REN' : 'AKARI',
  magicProtagonistGender: magicGender,
  maxHp: 100,
  currentHp: 100,
  maxEnergy: 3,
  currentEnergy: 3,
  block: 0,
  strength: 0,
  gold: 300,
  deck: STARTING_DECK_TEMPLATE.map((key, index) => ({
    ...CARDS_LIBRARY[key],
    id: `event-sim-${key}-${index}`,
  })),
  hand: [],
  discardPile: [],
  drawPile: [],
  relics: [],
  potions: [],
  powers: {},
  echoes: 0,
  cardsPlayedThisTurn: 0,
  cardsPlayedThisBattle: 0,
  attacksPlayedThisTurn: 0,
  typesPlayedThisTurn: [],
  relicCounters: {},
  turnFlags: {},
  imageData: HERO_IMAGE_DATA,
  floatingText: null,
  nextTurnEnergy: 0,
  nextTurnDraw: 0,
  codexBuffer: [],
  garden: Array.from({ length: 6 }, () => ({ plantedCard: null, growth: 0, maxGrowth: 3 })),
  magicRomance: {
    affection: {},
    stages: {},
    selectedCounts: {},
    completedEventIds: [],
  },
});

const createSimulationState = (theme: VisualThemeId, magicGender: MagicEndlessGender = 'female'): GameState => ({
  screen: GameScreen.EVENT_SIMULATION,
  mode: GameMode.MULTIPLICATION,
  visualTheme: theme,
  answerMode: 'CHOICE',
  difficultyLevel: 1,
  shopRemoveCount: 0,
  act: 1,
  floor: 1,
  turn: 0,
  map: [],
  currentMapNodeId: null,
  player: createSimulationPlayer(magicGender),
  enemies: [],
  selectedEnemyId: null,
  narrativeLog: [],
  combatLog: [],
  rewards: [],
  selectionState: { active: false, type: 'DISCARD', amount: 0 },
  isEndless: false,
  activeEffects: [],
  currentStoryIndex: 0,
  actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 },
  coopBattleState: null,
});

const EventSimulationScreen: React.FC<EventSimulationScreenProps> = ({ theme, languageMode, onBack }) => {
  const accent = THEME_ACCENTS[theme];
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('normal');
  const [magicGender, setMagicGender] = useState<MagicEndlessGender>('female');
  const [endlessChapter, setEndlessChapter] = useState(51);
  const titles = useMemo(
    () => simulationMode === 'normal'
      ? NORMAL_EVENT_TITLES[theme]
      : getEndlessEventTitles(theme, magicGender, endlessChapter),
    [endlessChapter, magicGender, simulationMode, theme],
  );
  const [simulationState, setSimulationState] = useState<GameState>(() => createSimulationState(theme, magicGender));
  const [selectedTitle, setSelectedTitle] = useState(NORMAL_EVENT_TITLES[theme][0] ?? '');
  const [eventData, setEventData] = useState<SimulationEvent | null>(null);
  const [resultLog, setResultLog] = useState<string | null>(null);
  const [act, setAct] = useState(1);
  const [floor, setFloor] = useState(1);
  const [eventSerial, setEventSerial] = useState(0);

  const unlockedCardNames = useMemo(() => Object.values(CARDS_LIBRARY).map(card => card.name), []);

  const buildEvent = useCallback((
    state: GameState,
    title: string,
    targetAct: number,
    targetFloor: number,
    serial: number,
  ): SimulationEvent => {
    if (simulationMode === 'normal' && theme === 'elementary' && title === '忘れ物') {
      return generateLegacyEvent(
        { ...CARDS_LIBRARY.STRIKE, id: `event-sim-legacy-${serial}` },
        setSimulationState,
        setResultLog,
        languageMode,
      );
    }

    if (simulationMode === 'endless' && theme === 'magic' && !isSharedEndlessEvent(title)) {
      return generateMagicEndlessEvent(
        state.player,
        setSimulationState,
        setResultLog,
        languageMode,
        endlessChapter,
        title,
      );
    }

    const endlessAct = simulationMode === 'endless'
      ? (isSharedEndlessEvent(title) && endlessChapter % 5 === 0 ? endlessChapter + 1 : endlessChapter)
      : targetAct;

    const eventPlayer = simulationMode === 'endless' && title === 'あずきとの出会い'
      ? {
          ...state.player,
          turnFlags: {
            ...state.player.turnFlags,
            [DODOMEDESU_BOSS_READY_FLAG]: true,
          },
        }
      : state.player;

    return generateEvent(
      eventPlayer,
      setSimulationState,
      () => undefined,
      setResultLog,
      languageMode,
      unlockedCardNames,
      title,
      theme,
      endlessAct,
      targetFloor,
      simulationMode === 'endless',
      serial,
    );
  }, [endlessChapter, languageMode, simulationMode, theme, unlockedCardNames]);

  const openEvent = useCallback((
    title: string,
    state: GameState = simulationState,
    targetAct: number = act,
    targetFloor: number = floor,
  ) => {
    if (!title) return;
    const nextSerial = eventSerial + 1;
    setEventSerial(nextSerial);
    setSelectedTitle(title);
    setResultLog(null);
    setEventData(buildEvent(state, title, targetAct, targetFloor, nextSerial));
  }, [act, buildEvent, eventSerial, floor, simulationState]);

  useEffect(() => {
    const initialState = createSimulationState(theme, magicGender);
    const initialTitle = titles[0] ?? '';
    setSimulationState(initialState);
    setSelectedTitle(initialTitle);
    setAct(1);
    setFloor(1);
    setEventSerial(1);
    setResultLog(null);
    setEventData(initialTitle ? buildEvent(initialState, initialTitle, 1, 1, 1) : null);
  }, [buildEvent, magicGender, theme, titles]);

  const handleReset = useCallback(() => {
    const resetState = createSimulationState(theme, magicGender);
    setSimulationState(resetState);
    setResultLog(null);
    openEvent(selectedTitle || titles[0] || '', resetState);
  }, [magicGender, openEvent, selectedTitle, theme, titles]);

  const handleContinue = useCallback(() => {
    if (titles.length === 0) return;
    const currentIndex = Math.max(0, titles.indexOf(selectedTitle));
    const nextTitle = titles[(currentIndex + 1) % titles.length];
    openEvent(nextTitle);
  }, [openEvent, selectedTitle, titles]);

  const handleRandom = useCallback(() => {
    if (titles.length === 0) return;
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    openEvent(randomTitle);
  }, [openEvent, titles]);

  const handleActChange = useCallback((nextAct: number) => {
    const normalizedAct = Math.max(1, Math.min(3, nextAct));
    setAct(normalizedAct);
    openEvent(selectedTitle, simulationState, normalizedAct, floor);
  }, [floor, openEvent, selectedTitle, simulationState]);

  const handleFloorChange = useCallback((nextFloor: number) => {
    const normalizedFloor = Math.max(1, Math.min(15, nextFloor));
    setFloor(normalizedFloor);
    openEvent(selectedTitle, simulationState, act, normalizedFloor);
  }, [act, openEvent, selectedTitle, simulationState]);

  const handleLearningResult = useCallback((success: boolean) => {
    const pending = simulationState.eventLearningPending;
    if (!pending) return;
    const effects = success ? pending.successEffects : pending.failureEffects;
    const preview = applyMagicEndlessEventEffects(simulationState.player, effects);
    setSimulationState(prev => {
      const result = applyMagicEndlessEventEffects(prev.player, effects);
      return {
        ...prev,
        player: result.player,
        screen: GameScreen.EVENT_SIMULATION,
        eventLearningPending: undefined,
      };
    });
    const summary = preview.messages.length > 0 ? preview.messages.join('。') : '変化はなかった';
    setResultLog(`学習判定：${success ? '成功' : '失敗'}。${summary}。`);
  }, [simulationState.eventLearningPending, simulationState.player]);

  return (
    <TranslatedUiTree mode={languageMode}>
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white md:flex-row">
        <div className="min-h-0 min-w-0 flex-1">
          {eventData && (
            <EventScreen
              title={eventData.title}
              description={eventData.description}
              options={eventData.options}
              imageKey={eventData.imageKey}
              resultLog={resultLog}
              onContinue={handleContinue}
              languageMode={languageMode}
              visualTheme={theme}
              imageZoomEnabled
            />
          )}
        </div>

        <aside className={`relative z-20 h-72 w-full shrink-0 overflow-y-auto border-t bg-slate-950/95 p-4 custom-scrollbar md:h-full md:w-80 md:border-l md:border-t-0 ${accent.border}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className={`text-xs font-black ${accent.text}`}>EVENT SIMULATOR</div>
              <h1 className="text-lg font-black">{THEME_LABELS[theme]}</h1>
              <div className="mt-1 text-[10px] text-slate-400">
                {simulationMode === 'normal' ? '通常イベント' : 'エンドレス専用イベント'} / {titles.length}件
              </div>
            </div>
            <button onClick={onBack} className="rounded-lg border border-slate-600 bg-slate-800 p-2 text-slate-200 hover:bg-slate-700" title="デバッグへ戻る">
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSimulationMode('normal')}
                className={`rounded-lg border px-3 py-2 text-xs font-black ${simulationMode === 'normal' ? accent.button : 'border-slate-600 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                通常
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode('endless')}
                className={`rounded-lg border px-3 py-2 text-xs font-black ${simulationMode === 'endless' ? 'border-violet-300 bg-violet-800 text-white hover:bg-violet-700' : 'border-slate-600 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                エンドレス
              </button>
            </div>

            {simulationMode === 'endless' && theme === 'magic' && (
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-bold text-slate-400">
                  主人公
                  <select
                    value={magicGender}
                    onChange={(event) => setMagicGender(event.target.value as MagicEndlessGender)}
                    className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  >
                    <option value="female">女子主人公 90件</option>
                    <option value="male">男子主人公 90件</option>
                  </select>
                </label>
                <label className="text-[10px] font-bold text-slate-400">
                  CHAPTER
                  <input
                    type="number"
                    min={1}
                    value={endlessChapter}
                    onChange={(event) => setEndlessChapter(Math.max(1, Number(event.target.value) || 1))}
                    className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  />
                </label>
              </div>
            )}

            {simulationMode === 'endless' && theme !== 'magic' && (
              <label className="block text-[10px] font-bold text-slate-400">
                ENDLESS CHAPTER
                <input
                  type="number"
                  min={1}
                  value={endlessChapter}
                  onChange={(event) => setEndlessChapter(Math.max(1, Number(event.target.value) || 1))}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white"
                />
              </label>
            )}

            <label className="block text-[10px] font-bold text-slate-400">
              イベント
              <select
                value={selectedTitle}
                onChange={(event) => setSelectedTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-white"
              >
                {titles.map(title => <option key={title} value={title}>{title}</option>)}
              </select>
            </label>
            <button onClick={() => openEvent(selectedTitle)} className={`w-full rounded-lg border px-3 py-2 text-xs font-black text-white ${accent.button}`}>
              このイベントを開始
            </button>
            <button onClick={handleRandom} className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-400 bg-violet-900 px-3 py-2 text-xs font-black text-white hover:bg-violet-800">
              <Shuffle size={15} /> ランダムイベント
            </button>
          </div>

          {simulationMode === 'normal' && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-400">
              ACT
              <select value={act} onChange={(event) => handleActChange(Number(event.target.value))} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white">
                {[1, 2, 3].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-400">
              FLOOR
              <input
                type="number"
                min={1}
                max={15}
                value={floor}
                onChange={(event) => handleFloorChange(Number(event.target.value) || 1)}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white"
              />
            </label>
          </div>
          )}

          {simulationState.eventLearningPending && (
            <div className="mb-4 rounded-xl border border-amber-400/70 bg-amber-950/30 p-3">
              <div className="mb-2 text-xs font-black text-amber-200">学習判定イベント</div>
              <div className="mb-2 text-[10px] text-slate-300">{simulationState.eventLearningPending.eventTitle}</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleLearningResult(true)} className="rounded border border-emerald-300 bg-emerald-800 px-2 py-2 text-xs font-black hover:bg-emerald-700">成功を適用</button>
                <button type="button" onClick={() => handleLearningResult(false)} className="rounded border border-rose-300 bg-rose-900 px-2 py-2 text-xs font-black hover:bg-rose-800">失敗を適用</button>
              </div>
            </div>
          )}

          <div className={`mb-4 rounded-xl border bg-white/5 p-3 ${accent.border}`}>
            <div className="mb-2 flex items-center gap-2 text-xs font-black text-slate-200">
              <Sparkles size={15} /> シミュレーション状態
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-black/30 p-2"><Heart size={14} className="mr-1 inline text-rose-400" />HP {simulationState.player.currentHp}/{simulationState.player.maxHp}</div>
              <div className="rounded bg-black/30 p-2"><Coins size={14} className="mr-1 inline text-yellow-300" />{simulationState.player.gold}G</div>
              <div className="rounded bg-black/30 p-2">カード {simulationState.player.deck.length}枚</div>
              <div className="rounded bg-black/30 p-2">レリック {simulationState.player.relics.length}</div>
              <div className="rounded bg-black/30 p-2">ポーション {simulationState.player.potions.length}</div>
              <div className="rounded bg-black/30 p-2">イベント #{eventSerial}</div>
            </div>
          </div>

          <button onClick={handleReset} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 text-xs font-black hover:bg-slate-700">
            <RefreshCcw size={15} /> 状態をリセット
          </button>
        </aside>
      </div>
    </TranslatedUiTree>
  );
};

export default EventSimulationScreen;
