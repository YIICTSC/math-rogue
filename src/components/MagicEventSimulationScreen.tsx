import React, { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Heart, RotateCcw, Sparkles, Users } from 'lucide-react';
import type { GameState, LanguageMode, Player } from '../types';
import { CardType, TargetType } from '../types';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS, isMagicMaleProtagonist } from '../data/magicHeroes';
import { ROMANCE_TARGETS } from '../data/romanceTargets';
import { getMagicFriendshipRoutesForHero } from '../data/magicFriendshipRoutes';
import {
  generateMagicRomanceSelectionEvent,
  type MagicRomanceGameEvent,
} from '../services/magicRomanceEventService';
import EventScreen from './EventScreen';
import MagicRomanceEndingScreen from './MagicRomanceEndingScreen';
import { assetUrl } from '../utils/assetPaths';

interface MagicEventSimulationScreenProps {
  languageMode: LanguageMode;
  onBack: () => void;
}

interface ProtagonistOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  image: string;
}

const PROTAGONISTS: ProtagonistOption[] = [
  ...MAGIC_HEROES.map((hero) => ({
    id: hero.id,
    name: hero.name,
    gender: 'female' as const,
    image: assetUrl(`sprites/magic/characters/heroine-${String(hero.index).padStart(2, '0')}-before.png`),
  })),
  ...MAGIC_MALE_PROTAGONISTS.map((hero) => ({
    id: hero.id,
    name: hero.name,
    gender: 'male' as const,
    image: assetUrl(`sprites/magic/male-characters/${hero.assetId}-before.png`),
  })),
];

const EVENTS_PER_ACT = 4;
const TOTAL_EVENTS = EVENTS_PER_ACT * 3;

const createSimulationPlayer = (protagonist: ProtagonistOption): Player => ({
  id: 'WARRIOR',
  magicProtagonistId: protagonist.id,
  magicProtagonistGender: protagonist.gender,
  maxHp: 100,
  currentHp: 100,
  maxEnergy: 3,
  currentEnergy: 3,
  block: 0,
  strength: 0,
  gold: 100,
  deck: [
    {
      id: 'sim-attack',
      name: 'シミュレーション攻撃',
      description: 'デバッグ用カード',
      cost: 1,
      type: CardType.ATTACK,
      target: TargetType.ENEMY,
      rarity: 'COMMON',
      damage: 6,
    },
    {
      id: 'sim-skill',
      name: 'シミュレーション防御',
      description: 'デバッグ用カード',
      cost: 1,
      type: CardType.SKILL,
      target: TargetType.SELF,
      rarity: 'COMMON',
      block: 5,
    },
  ],
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
  imageData: protagonist.image,
  floatingText: null,
  nextTurnEnergy: 0,
  nextTurnDraw: 0,
  codexBuffer: [],
  magicRomance: {
    affection: {},
    stages: {},
    selectedCounts: {},
    completedEventIds: [],
  },
});

const MagicEventSimulationScreen: React.FC<MagicEventSimulationScreenProps> = ({ languageMode, onBack }) => {
  const [protagonist, setProtagonist] = useState<ProtagonistOption | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [eventIndex, setEventIndex] = useState(0);
  const [eventData, setEventData] = useState<MagicRomanceGameEvent | null>(null);
  const [resultLog, setResultLog] = useState<string | null>(null);
  const [endingActive, setEndingActive] = useState(false);

  const act = Math.min(3, Math.floor(eventIndex / EVENTS_PER_ACT) + 1);
  const eventInAct = (eventIndex % EVENTS_PER_ACT) + 1;

  const setSimulationGameState = useCallback<React.Dispatch<React.SetStateAction<GameState>>>((update) => {
    setPlayer((currentPlayer) => {
      if (!currentPlayer) return currentPlayer;
      const baseState = { player: currentPlayer } as GameState;
      const nextState = typeof update === 'function' ? update(baseState) : update;
      return nextState.player;
    });
  }, []);

  const openSelectionEvent = useCallback((currentPlayer: Player, heroId: string, currentAct: number) => {
    setResultLog(null);
    const event = generateMagicRomanceSelectionEvent(
      currentPlayer,
      heroId,
      currentAct,
      setSimulationGameState,
      setEventData,
      setResultLog,
      {
        showAllRomanceCandidates: true,
        showAllFriendshipCandidates: true,
      },
    );
    setEventData(event);
  }, [setSimulationGameState]);

  const startSimulation = useCallback((option: ProtagonistOption) => {
    const nextPlayer = createSimulationPlayer(option);
    setProtagonist(option);
    setPlayer(nextPlayer);
    setEventIndex(0);
    setEndingActive(false);
    openSelectionEvent(nextPlayer, option.id, 1);
  }, [openSelectionEvent]);

  const restart = useCallback(() => {
    setProtagonist(null);
    setPlayer(null);
    setEventData(null);
    setResultLog(null);
    setEventIndex(0);
    setEndingActive(false);
  }, []);

  const handleContinue = useCallback(() => {
    if (!player || !protagonist) return;
    if (eventIndex >= TOTAL_EVENTS - 1) {
      setEndingActive(true);
      setEventData(null);
      setResultLog(null);
      return;
    }
    const nextIndex = eventIndex + 1;
    const nextAct = Math.floor(nextIndex / EVENTS_PER_ACT) + 1;
    setEventIndex(nextIndex);
    openSelectionEvent(player, protagonist.id, nextAct);
  }, [eventIndex, openSelectionEvent, player, protagonist]);

  const affectionRows = useMemo(() => {
    if (!player || !protagonist) return [];
    const romanceCharacters = isMagicMaleProtagonist(protagonist.id)
      ? MAGIC_HEROES.map((hero) => ({ id: hero.id, name: hero.name, kind: '好感度' }))
      : ROMANCE_TARGETS.map((target) => ({ id: target.id, name: target.name, kind: '好感度' }));
    const friendshipCharacters = getMagicFriendshipRoutesForHero(protagonist.id).map((route) => {
      const friendName = MAGIC_HEROES.find((hero) => hero.id === route.friendHeroId)?.name
        ?? MAGIC_MALE_PROTAGONISTS.find((hero) => hero.id === route.friendHeroId)?.name
        ?? route.friendHeroId;
      return { id: route.id, name: friendName, kind: '友情' };
    });
    return [...romanceCharacters, ...friendshipCharacters].map((character) => ({
      ...character,
      value: player.magicRomance?.affection[character.id] ?? 0,
      stage: player.magicRomance?.stages[character.id] ?? 0,
    }));
  }, [player, protagonist]);

  if (!protagonist || !player) {
    return (
      <div className="h-full w-full overflow-y-auto bg-slate-950 p-4 text-white custom-scrollbar">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-fuchsia-200">マジック編 イベントシミュレーション</h1>
              <p className="mt-1 text-sm text-slate-300">各章4回、合計12回の？イベントから恋愛エンディングまで確認します。</p>
            </div>
            <button onClick={onBack} className="flex items-center gap-2 rounded-lg border border-slate-500 bg-slate-800 px-4 py-2 font-bold">
              <ArrowLeft size={18} /> デバッグへ戻る
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PROTAGONISTS.map((option) => (
              <button
                key={option.id}
                onClick={() => startSimulation(option)}
                className="rounded-xl border border-fuchsia-500/40 bg-slate-900 p-3 text-left transition hover:border-fuchsia-300 hover:bg-fuchsia-950/30"
              >
                <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-black/40">
                  <img src={option.image} alt={option.name} className="h-full w-full object-contain" />
                </div>
                <div className="font-black text-white">{option.name}</div>
                <div className="text-xs text-fuchsia-300">{option.gender === 'male' ? '男子主人公' : '女子主人公'}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white md:flex-row">
      <div className="min-h-0 min-w-0 flex-1">
        {endingActive ? (
          <MagicRomanceEndingScreen
            player={player}
            heroId={protagonist.id}
            languageMode={languageMode}
            onComplete={restart}
          />
        ) : eventData ? (
          <EventScreen
            title={eventData.title}
            description={eventData.description}
            options={eventData.options}
            imageKey={eventData.imageKey}
            resultLog={resultLog}
            onContinue={handleContinue}
            languageMode={languageMode}
            visualTheme="magic"
          />
        ) : null}
      </div>

      <aside className="relative z-20 h-52 w-full shrink-0 overflow-y-auto border-t border-fuchsia-500/40 bg-slate-950/95 p-4 custom-scrollbar md:h-full md:w-72 md:border-l md:border-t-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-fuchsia-300">EVENT SIMULATION</div>
            <div className="font-black">{protagonist.name}</div>
          </div>
          <button onClick={restart} title="主人公を選び直す" className="rounded border border-slate-600 p-2 text-slate-300 hover:text-white">
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-fuchsia-400/40 bg-fuchsia-950/20 p-3">
          <div className="flex items-center gap-2 text-fuchsia-200">
            <Sparkles size={17} />
            <span className="font-black">第{act}章 / イベント {eventInAct}/{EVENTS_PER_ACT}</span>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-1">
            {Array.from({ length: TOTAL_EVENTS }, (_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full ${index < eventIndex ? 'bg-emerald-400' : index === eventIndex ? 'bg-fuchsia-400' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-300">{eventIndex + 1}/{TOTAL_EVENTS} イベント</div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-sm font-black text-pink-200">
          <Heart size={16} fill="currentColor" /> 好感度・友情一覧
        </div>
        <div className="space-y-2">
          {affectionRows.map((row) => (
            <div key={row.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-bold">{row.name}</span>
                <span className={row.kind === '友情' ? 'text-cyan-300' : 'text-pink-300'}>{row.kind} {row.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full ${row.kind === '友情' ? 'bg-cyan-400' : 'bg-pink-400'}`}
                  style={{ width: `${Math.min(100, row.value)}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-500">進行段階 {row.stage}</div>
            </div>
          ))}
        </div>

        <button onClick={onBack} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold">
          <Users size={16} /> デバッグへ戻る
        </button>
      </aside>
    </div>
  );
};

export default MagicEventSimulationScreen;
