import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Coins, Heart, RefreshCcw, Shuffle, Sparkles } from 'lucide-react';
import { CARDS_LIBRARY, HERO_IMAGE_DATA, STARTING_DECK_TEMPLATE } from '../constants';
import { HIGH_SCHOOL_SUPPORTER_NPC_EVENTS } from '../data/supporterNpcEvents';
import { HIGH_SCHOOL_EVENT_THEMES, MAGIC_EVENT_THEMES, type VisualThemeId } from '../data/visualThemes';
import { ELEMENTARY_EVENT_TITLES, generateEvent, generateLegacyEvent } from '../services/eventService';
import { GameMode, GameScreen, type GameState, type LanguageMode, type Player } from '../types';
import EventScreen from './EventScreen';
import TranslatedUiTree from './TranslatedUiTree';

interface EventSimulationScreenProps {
  theme: VisualThemeId;
  languageMode: LanguageMode;
  onBack: () => void;
}

type SimulationEvent = ReturnType<typeof generateEvent>;

const EVENT_TITLES: Record<VisualThemeId, string[]> = {
  elementary: [...ELEMENTARY_EVENT_TITLES],
  'high-school': [
    ...HIGH_SCHOOL_EVENT_THEMES.map(event => event.title),
    ...HIGH_SCHOOL_SUPPORTER_NPC_EVENTS.map(event => event.title),
  ],
  magic: MAGIC_EVENT_THEMES.map(event => event.title),
};

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

const createSimulationPlayer = (): Player => ({
  id: 'WARRIOR',
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

const createSimulationState = (theme: VisualThemeId): GameState => ({
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
  player: createSimulationPlayer(),
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
  const titles = EVENT_TITLES[theme];
  const accent = THEME_ACCENTS[theme];
  const [simulationState, setSimulationState] = useState<GameState>(() => createSimulationState(theme));
  const [selectedTitle, setSelectedTitle] = useState(titles[0] ?? '');
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
    if (theme === 'elementary' && title === '忘れ物') {
      return generateLegacyEvent(
        { ...CARDS_LIBRARY.STRIKE, id: `event-sim-legacy-${serial}` },
        setSimulationState,
        setResultLog,
        languageMode,
      );
    }

    return generateEvent(
      state.player,
      setSimulationState,
      () => undefined,
      setResultLog,
      languageMode,
      unlockedCardNames,
      title,
      theme,
      targetAct,
      targetFloor,
      false,
      serial,
    );
  }, [languageMode, theme, unlockedCardNames]);

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
    const initialState = createSimulationState(theme);
    const initialTitle = EVENT_TITLES[theme][0] ?? '';
    setSimulationState(initialState);
    setSelectedTitle(initialTitle);
    setAct(1);
    setFloor(1);
    setEventSerial(1);
    setResultLog(null);
    setEventData(initialTitle ? buildEvent(initialState, initialTitle, 1, 1, 1) : null);
  }, [buildEvent, theme]);

  const handleReset = useCallback(() => {
    const resetState = createSimulationState(theme);
    setSimulationState(resetState);
    setResultLog(null);
    openEvent(selectedTitle || titles[0] || '', resetState);
  }, [openEvent, selectedTitle, theme, titles]);

  const handleContinue = useCallback(() => {
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
              <div className="mt-1 text-[10px] text-slate-400">実イベント処理 / {titles.length}件</div>
            </div>
            <button onClick={onBack} className="rounded-lg border border-slate-600 bg-slate-800 p-2 text-slate-200 hover:bg-slate-700" title="デバッグへ戻る">
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="mb-4 space-y-2">
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
