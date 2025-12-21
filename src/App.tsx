import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, GameScreen, Enemy, Card as ICard, 
  CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion, Player, EnemyIntent, Character, FloatingText, RankingEntry, GameMode, LanguageMode
} from './types';
import { 
  INITIAL_HP, INITIAL_ENERGY, HAND_SIZE, 
  CARDS_LIBRARY, STARTING_DECK_TEMPLATE, STATUS_CARDS, CURSE_CARDS, EVENT_CARDS, RELIC_LIBRARY, TRUE_BOSS, POTION_LIBRARY, CHARACTERS, HERO_IMAGE_DATA, ENEMY_LIBRARY
} from './constants';
import BattleScene from './components/BattleScene';
import RewardScreen from './components/RewardScreen';
import MapScreen from './components/MapScreen';
import RestScreen from './components/RestScreen';
import ShopScreen from './components/ShopScreen';
import EventScreen from './components/EventScreen';
import CompendiumScreen from './components/CompendiumScreen';
import RelicSelectionScreen from './components/RelicSelectionScreen';
import HelpScreen from './components/HelpScreen';
import TreasureScreen from './components/TreasureScreen';
import CharacterSelectionScreen from './components/CharacterSelectionScreen';
import RankingScreen from './components/RankingScreen';
import MathChallengeScreen from './components/MathChallengeScreen';
import DebugMenuScreen from './components/DebugMenuScreen';
import PokerGameScreen from './components/PokerGameScreen';
import SchoolyardSurvivorScreen from './components/SchoolyardSurvivorScreen';
import SchoolDungeonRPG from './components/SchoolDungeonRPG'; 
import SchoolDungeonRPG2 from './components/SchoolDungeonRPG2'; 
import KochoShowdown from './components/KochoShowdown'; 
import PaperPlaneBattle from './components/PaperPlaneBattle';
import MiniGameSelectScreen from './components/MiniGameSelectScreen';
import Card from './components/Card';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { generateEvent } from './services/eventService';
import { getUpgradedCard, synthesizeCars } from './utils/cardUtils';
import { trans } from './utils/textUtils';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle, Send, Swords, Terminal, Club, Zap, Gamepad2, Brain, Languages, Music } from 'lucide-react';

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
    // Spirit Poop penalty
    if (state.player.relics.find(r => r.id === 'SPIRIT_POOP')) {
        score -= 1;
    }
    return score;
};

// --- ENEMY DEFINITIONS & AI ---
const determineEnemyType = (name: string, isBoss: boolean): string => {
    if (isBoss) return 'GUARDIAN'; 
    if (name.includes('先生') || name.includes('用務員') || name.includes('教頭')) return 'TEACHER';
    if (name.includes('ゴーレム') || name.includes('主') || name.includes('守護者') || name.includes('模型')) return 'TANK';
    if (name.includes('亡霊') || name.includes('幽霊') || name.includes('花子') || name.includes('影')) return 'GHOST';
    if (name.includes('悪魔') || name.includes('不良') || name.includes('カラス') || name.includes('狂信者')) return 'AGGRESSIVE';
    if (name.includes('宿題') || name.includes('ミミック') || name.includes('泥棒') || name.includes('妖精')) return 'TRICKSTER';
    if (name.includes('虫') || name.includes('カス') || name.includes('スライム') || name.includes('ハチ')) return 'SWARM';
    return 'GENERIC';
};

const getNextEnemyIntent = (enemy: Enemy, turn: number): EnemyIntent => {
    const type = enemy.enemyType;
    const localTurn = turn % 3; 
    const isAct2Plus = (enemy.maxHp > 60);

    switch (type) {
        case 'TEACHER':
            if (turn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: isAct2Plus ? 3 : 2 }; 
            if (localTurn === 2) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 18 : 12 };
            return { type: EnemyIntentType.ATTACK_DEBUFF, value: 8, secondaryValue: 2, debuffType: 'VULNERABLE' };

        case 'TANK':
            if (localTurn === 0) return { type: EnemyIntentType.DEFEND, value: isAct2Plus ? 20 : 12 };
            if (localTurn === 1) return { type: EnemyIntentType.ATTACK_DEFEND, value: 10, secondaryValue: 10 };
            return { type: EnemyIntentType.ATTACK, value: 15 };

        case 'GHOST':
            if (localTurn === 0) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'WEAK' };
            if (localTurn === 1) return { type: EnemyIntentType.ATTACK, value: 6 };
            return { type: EnemyIntentType.ATTACK_DEBUFF, value: 5, secondaryValue: 1, debuffType: 'VULNERABLE' };

        case 'AGGRESSIVE':
            if (turn === 1) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 10 : 6 };
            if (localTurn === 0) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 5 : 3 };
            return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 14 : 9 };

        case 'TRICKSTER':
            if (localTurn === 0) {
                 if (Math.random() < 0.5) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'CONFUSED' };
                 return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'POISON' };
            }
            if (localTurn === 1) return { type: EnemyIntentType.DEFEND, value: 8 };
            return { type: EnemyIntentType.ATTACK, value: 7 };

        case 'SWARM':
            if (turn % 2 === 0) return { type: EnemyIntentType.ATTACK, value: 5 };
            return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 1, debuffType: 'WEAK' };

        case 'GUARDIAN':
            const bossTurn = turn % 4;
            if (bossTurn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 9 }; 
            if (bossTurn === 2) return { type: EnemyIntentType.ATTACK, value: 20 }; 
            if (bossTurn === 3) return { type: EnemyIntentType.ATTACK_DEBUFF, value: 8, secondaryValue: 2, debuffType: 'VULNERABLE' }; 
            return { type: EnemyIntentType.DEFEND, value: 15 };

        case 'THE_HEART':
             const heartTurn = turn % 3;
             if (heartTurn === 1) return { type: EnemyIntentType.ATTACK, value: 45 }; 
             if (heartTurn === 2) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 2 }; 
             return { type: EnemyIntentType.ATTACK_DEBUFF, value: 2, secondaryValue: 12, debuffType: 'VULNERABLE' }; 

        default:
            const r = Math.random();
            if (r < 0.6) return { type: EnemyIntentType.ATTACK, value: 9 + Math.floor(turn/2) };
            if (r < 0.9) return { type: EnemyIntentType.DEFEND, value: 8 };
            return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 2 }; 
    }
};

const App: React.FC = () => {
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

  // --- State ---
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
      nextTurnDraw: 0
    },
    enemies: [],
    selectedEnemyId: null,
    narrativeLog: [],
    combatLog: [],
    rewards: [],
    selectionState: { active: false, type: 'DISCARD', amount: 0 },
    isEndless: false,
  });

  const [languageMode, setLanguageMode] = useState<LanguageMode>('JAPANESE');
  const [currentNarrative, setCurrentNarrative] = useState<string>("...");
  const [turnLog, setTurnLog] = useState<string>("プレイヤーターン");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [lastActionType, setLastActionType] = useState<CardType | null>(null);
  const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);
  const [hasSave, setHasSave] = useState<boolean>(false);
  const [selectedCharName, setSelectedCharName] = useState<string>("戦士");
  const [legacyCardSelected, setLegacyCardSelected] = useState<boolean>(false);
  const [showDebugLog, setShowDebugLog] = useState<boolean>(false);
  const [bgmMode, setBgmMode] = useState<'OSCILLATOR' | 'MP3'>('MP3');
  const [totalMathCorrect, setTotalMathCorrect] = useState<number>(0);
  
  // Debug Logic
  const [isMathDebugSkipped, setIsMathDebugSkipped] = useState<boolean>(false);
  const [isDebugHpOne, setIsDebugHpOne] = useState<boolean>(false);
  const [titleClickCount, setTitleClickCount] = useState<number>(0);
  const [logClickCount, setLogClickCount] = useState<number>(0);
  const [debugLoadout, setDebugLoadout] = useState<{deck: ICard[], relics: Relic[], potions: Potion[]} | null>(null);

  // Shop & Event
  const [shopCards, setShopCards] = useState<ICard[]>([]);
  const [shopRelics, setShopRelics] = useState<Relic[]>([]);
  const [shopPotions, setShopPotions] = useState<Potion[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [eventResultLog, setEventResultLog] = useState<string | null>(null); 
  const [unlockedCardNames, setUnlockedCardNames] = useState<string[]>([]);
  const [starterRelics, setStarterRelics] = useState<Relic[]>([]);
  const [treasureRewards, setTreasureRewards] = useState<RewardItem[]>([]);
  
  // Progression
  const [clearCount, setClearCount] = useState<number>(0);

  const VICTORY_GOLD = 25;
  
  const UNLOCK_THRESHOLDS = [1000, 1500, 2000, 2500, 3000, 3500];

  // --- Auto Save Logic ---
  useEffect(() => {
      if (gameState.screen !== GameScreen.START_MENU && 
          gameState.screen !== GameScreen.GAME_OVER && 
          gameState.screen !== GameScreen.ENDING &&
          gameState.screen !== GameScreen.VICTORY &&
          gameState.screen !== GameScreen.MATH_CHALLENGE && 
          gameState.screen !== GameScreen.COMPENDIUM && 
          gameState.screen !== GameScreen.HELP &&
          gameState.screen !== GameScreen.RANKING &&
          gameState.screen !== GameScreen.CHARACTER_SELECTION &&
          gameState.screen !== GameScreen.RELIC_SELECTION &&
          gameState.screen !== GameScreen.MODE_SELECTION &&
          gameState.screen !== GameScreen.DEBUG_MENU &&
          gameState.screen !== GameScreen.MINI_GAME_SELECT &&
          gameState.screen !== GameScreen.MINI_GAME_POKER && 
          gameState.screen !== GameScreen.MINI_GAME_SURVIVOR &&
          gameState.screen !== GameScreen.MINI_GAME_DUNGEON &&
          gameState.screen !== GameScreen.MINI_GAME_DUNGEON_2 &&
          gameState.screen !== GameScreen.MINI_GAME_KOCHO &&
          gameState.screen !== GameScreen.MINI_GAME_PAPER_PLANE
      ) {
          storageService.saveGame(gameState);
      }
  }, [gameState]);

  useEffect(() => {
    const unlocked = storageService.getUnlockedCards();
    setUnlockedCardNames(unlocked);
    setHasSave(storageService.hasSaveFile());
    setClearCount(storageService.getClearCount());
    setIsMathDebugSkipped(storageService.getDebugMathSkip());
    setIsDebugHpOne(storageService.getDebugHpOne());
    setTotalMathCorrect(storageService.getMathCorrectCount());
    
    // Play Menu BGM on initial load if on title screen
    if (gameState.screen === GameScreen.START_MENU) {
        audioService.init();
        audioService.playBGM('menu');
    }
  }, []);

  const handleTitleClick = () => {
      const next = titleClickCount + 1;
      setTitleClickCount(next);
      if (next >= 10) {
          const newState = !isMathDebugSkipped;
          setIsMathDebugSkipped(newState);
          storageService.saveDebugMathSkip(newState);
          setTitleClickCount(0);
          audioService.playSound('select');
      }
  };

  const handleLogTitleClick = (e: React.MouseEvent) => {
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

  const toggleLanguage = () => {
      setLanguageMode(prev => prev === 'JAPANESE' ? 'HIRAGANA' : 'JAPANESE');
      audioService.playSound('select');
  };

  const toggleBgmMode = () => {
      const newMode = bgmMode === 'OSCILLATOR' ? 'MP3' : 'OSCILLATOR';
      setBgmMode(newMode);
      audioService.setBgmMode(newMode);
      audioService.playSound('select');
  };

  const returnToTitle = () => {
      setShopCards([]);
      setEventData(null);
      setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU, challengeMode: undefined }));
      audioService.playBGM('menu'); // Play Menu BGM
  };

  const handleNodeComplete = () => {
      setGameState(prev => {
          const newMap = prev.map.map(n => {
              if (n.id === prev.currentMapNodeId) return { ...n, completed: true };
              return n;
          });
          return {
              ...prev,
              map: newMap,
              screen: GameScreen.MAP
          };
      });
      audioService.playBGM('map');
  };

  const continueGame = () => {
      const saved = storageService.loadGame();
      if (saved) {
          setGameState(saved);
          audioService.playBGM('map'); 
      }
  };

  const startGame = () => {
      audioService.playSound('select');
      setGameState(prev => ({ 
          ...prev, 
          screen: GameScreen.MODE_SELECTION,
          challengeMode: undefined 
      }));
  };

  const startChallengeGame = () => {
      audioService.playSound('select');
      setGameState(prev => ({ ...prev, screen: GameScreen.MODE_SELECTION, challengeMode: '1A1D' }));
  };

  const openMiniGameMenu = () => {
      audioService.playSound('select');
      setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_SELECT }));
  };

  const handleMiniGameSelect = (gameId: string) => {
      audioService.playSound('select');
      if (gameId === 'POKER') {
          setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_POKER }));
      } else if (gameId === 'SURVIVOR') {
          setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_SURVIVOR }));
      } else if (gameId === 'DUNGEON') {
          setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_DUNGEON }));
      } else if (gameId === 'DUNGEON_2') {
          setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_DUNGEON_2 }));
      } else if (gameId === 'KOCHO') {
          setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_KOCHO }));
      } else if (gameId === 'PAPER_PLANE') {
          setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_PAPER_PLANE }));
      }
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
          narrativeLog: [...prev.narrativeLog, trans("終わらない冒険が始まる...", languageMode)]
      }));
  };

  const handleModeSelect = (mode: GameMode) => {
      audioService.playSound('select');
      setGameState(prev => ({ ...prev, mode, screen: GameScreen.CHARACTER_SELECTION }));
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
            },
            narrativeLog: ["デバッグモード開始"],
            combatLog: [],
            enemies: [],
            selectedEnemyId: null,
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 }
        }));
        audioService.playBGM('map');
  };

  const handleCharacterSelect = (char: Character) => {
      audioService.playSound('select');
      setSelectedCharName(char.name);
      
      let initialDeck: ICard[] = [];
      let partner = undefined;
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

      // Partner Logic for Assassin (Transfer Student)
      if (char.id === 'ASSASSIN') {
          const warrior = CHARACTERS.find(c => c.id === 'WARRIOR');
          if (warrior) {
              partner = {
                  id: 'WARRIOR',
                  name: warrior.name,
                  maxHp: warrior.maxHp,
                  currentHp: warrior.maxHp,
                  imageData: warrior.imageData,
                  floatingText: null
              };
              logs.push(trans("わんぱく小学生が友達になった！(2人プレイモード)", languageMode));
              logs.push(trans("【パートナーコンボ】", languageMode));
              logs.push(trans("同タイプのカードを2枚選ぶと合体技が発動！", languageMode));
              logs.push(trans("コストは高い方のみ消費します。", languageMode));
          }
      }

      const legacyCard = storageService.getLegacyCard();
      if (legacyCard) {
          initialDeck.push({ ...legacyCard, id: `legacy-${Date.now()}` });
          storageService.clearLegacyCard();
      }

      const starterRelic = RELIC_LIBRARY[char.startingRelicId];
      const relics = starterRelic ? [starterRelic] : [];

      // Generate Bonus Relic Options
      const commonRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON');
      const bonusOptions = shuffle(commonRelics).slice(0, 3);
      setStarterRelics(bonusOptions);

      setGameState(prev => ({
          ...prev,
          screen: GameScreen.RELIC_SELECTION,
          act: 1,
          floor: 0,
          map: [], // Map is generated after relic selection
          currentMapNodeId: null,
          player: {
              ...prev.player,
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
              partner: partner,
          },
          narrativeLog: logs,
          combatLog: [],
      }));
  };

  const handleRelicSelect = (relic: Relic) => {
        audioService.playSound('buff');
        const map = generateDungeonMap();
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
  };

  const handleNodeSelect = async (node: MapNode) => {
      // ... existing node select logic ...
      setIsLoading(true);
      audioService.playSound('select');
      
      const nextFloor = node.y + 1;
      const nextState = { ...gameState, currentMapNodeId: node.id, floor: nextFloor };
      
      try {
        if (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS || node.type === NodeType.START) {
            
            // ... (Enemy Generation Logic) ...
            const actMultiplier = gameState.act; 
            const floorDifficulty = node.y * (1 + (actMultiplier * 0.5));
            
            let enemies: Enemy[] = [];
            let bgmType: 'battle' | 'mid_boss' | 'boss' | 'final_boss' = 'battle'; 

            if (gameState.act === 4 && node.type === NodeType.BOSS) {
                // Final Boss
                enemies.push({
                    id: 'true-boss',
                    enemyType: 'THE_HEART',
                    name: TRUE_BOSS.name,
                    maxHp: TRUE_BOSS.maxHp,
                    currentHp: isDebugHpOne ? 1 : TRUE_BOSS.maxHp,
                    block: 0,
                    strength: 0,
                    nextIntent: { type: EnemyIntentType.BUFF, value: 0 },
                    vulnerable: 0, weak: 0, poison: 0, artifact: 2, corpseExplosion: false,
                    floatingText: null
                });
                bgmType = 'final_boss';
            } else if (node.type === NodeType.BOSS) {
                 // Act Boss
                 bgmType = 'boss';
            } else if (node.type === NodeType.ELITE) {
                 // Elite
                 bgmType = 'mid_boss';
            } else {
                 // Normal Combat
                 bgmType = 'battle';
            }

            if (enemies.length === 0) {
                const numEnemies = node.type === NodeType.BOSS ? 1 : Math.floor(Math.random() * Math.min(3, 1 + Math.floor(node.y / 3))) + 1;
                for (let i = 0; i < numEnemies; i++) {
                    const baseHp = (node.type === NodeType.BOSS ? 150 : 20) * actMultiplier + floorDifficulty * 2 + (node.type === NodeType.ELITE ? 40 : 0);
                    const name = await generateEnemyName(node.y);
                    const isBoss = node.type === NodeType.BOSS;
                    
                    enemies.push({
                        id: `enemy-${node.y}-${i}-${Date.now()}`,
                        enemyType: 'GENERIC', 
                        name: isBoss ? `ボス: ${name}` : name,
                        maxHp: Math.floor(baseHp),
                        currentHp: isDebugHpOne ? 1 : Math.floor(baseHp),
                        block: 0,
                        strength: 0,
                        nextIntent: { type: EnemyIntentType.UNKNOWN, value: 0 }, 
                        vulnerable: 0, weak: 0, poison: 0, artifact: 0, corpseExplosion: false,
                        floatingText: null
                    });
                }
                
                enemies = enemies.map(e => {
                    const type = determineEnemyType(e.name, node.type === NodeType.BOSS);
                    return { ...e, enemyType: type, nextIntent: getNextEnemyIntent({ ...e, enemyType: type }, 1) };
                });
            }

            const flavor = await generateFlavorText(node.type === NodeType.BOSS ? "ボスが現れた！" : "敵と遭遇した。");
            
            const p = { ...nextState.player };
            // ... (rest of battle setup)
            p.drawPile = shuffle(p.deck.map(c => ({ ...c })));
            p.hand = [];
            p.discardPile = [];
            p.currentEnergy = p.maxEnergy;
            p.block = 0;
            p.strength = 0;
            p.powers = {};
            p.relicCounters = { ...p.relicCounters }; 
            
            // RESET HAPPY FLOWER COUNTER AT START OF BATTLE
            if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) {
                p.relicCounters['HAPPY_FLOWER'] = 0;
            }

            p.turnFlags = {};
            p.typesPlayedThisTurn = [];
            p.echoes = 0;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;

            // Relic Effects
            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            if (p.relics.find(r => r.id === 'HACHIMAKI')) p.powers['DEXTERITY'] = 1;
            if (p.relics.find(r => r.id === 'SEED_PACK')) p.powers['THORNS'] = 3;
            if (p.relics.find(r => r.id === 'HOLY_WATER')) p.currentEnergy += 1; 
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'LANTERN')) p.currentEnergy += 1;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = 3;
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (p.relics.find(r => r.id === 'BIG_LADLE')) p.currentHp = Math.min(p.maxHp, p.currentHp + 4);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
            if (p.relics.find(r => r.id === 'TEA_SERVER') && p.relicCounters['TEA_SERVER_ACTIVE']) {
                p.currentEnergy += 2;
                p.relicCounters['TEA_SERVER_ACTIVE'] = 0; 
                p.floatingText = { id: `tea-${Date.now()}`, text: 'お茶パワー！', color: 'text-green-400', iconType: 'zap' };
            }
            if (p.relics.find(r => r.id === 'ANCIENT_TEA_SET') && p.relicCounters['ANCIENT_TEA_SET_ACTIVE']) {
                p.currentEnergy += 2;
                p.relicCounters['ANCIENT_TEA_SET_ACTIVE'] = 0;
                p.floatingText = { id: `tea-ancient-${Date.now()}`, text: 'お茶パワー！', color: 'text-green-400', iconType: 'zap' };
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
            if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) p.strength += 3;
            
            let drawCount = HAND_SIZE;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;

            for(let i=0; i<drawCount; i++) {
                const c = p.drawPile.pop();
                if(c) p.hand.push(c);
            }
            
            if (p.relics.find(r => r.id === 'ENCHIRIDION')) {
                const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
                const power = powers[Math.floor(Math.random() * powers.length)];
                p.hand.push({ ...power, id: `ench-${Date.now()}`, cost: 0 });
            }
            if (p.relics.find(r => r.id === 'WHISTLE')) {
                const attacks = p.drawPile.filter(c => c.type === CardType.ATTACK);
                if (attacks.length > 0) {
                    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
                    const freeAttack = { ...randomAttack, cost: 0, id: `whistle-${Date.now()}` };
                    p.hand.push(freeAttack);
                } else {
                    const strike = { ...CARDS_LIBRARY['STRIKE'], cost: 0, id: `whistle-fallback-${Date.now()}` };
                    p.hand.push(strike);
                }
            }

            const innateCards = p.drawPile.filter(c => c.innate);
            innateCards.forEach(c => {
                 p.drawPile = p.drawPile.filter(dc => dc.id !== c.id);
                 p.hand.push(c);
            });

            setGameState({
                ...nextState,
                screen: GameScreen.BATTLE,
                player: p,
                enemies: enemies,
                selectedEnemyId: enemies[0].id,
                narrativeLog: [...nextState.narrativeLog, flavor],
                combatLog: [],
                turn: 1
            });
            setCurrentNarrative(flavor);
            audioService.playBGM(bgmType);
            setTurnLog(trans("あなたのターン", languageMode));

        } else if (node.type === NodeType.REST) {
            // ... (Rest logic same) ...
            setGameState(prev => {
                const p = { ...prev.player };
                if (p.relics.find(r => r.id === 'LUXURY_FUTON')) {
                    const heal = Math.floor(p.deck.length / 5) * 2;
                    if (heal > 0) {
                        p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                    }
                }
                if (p.relics.find(r => r.id === 'TEA_SERVER')) {
                    p.relicCounters['TEA_SERVER_ACTIVE'] = 1;
                }
                if (p.relics.find(r => r.id === 'ANCIENT_TEA_SET')) {
                    p.relicCounters['ANCIENT_TEA_SET_ACTIVE'] = 1;
                }
                return { ...nextState, player: p, screen: GameScreen.REST };
            });
            audioService.playBGM('rest');

        } else if (node.type === NodeType.SHOP) {
            // ... (Shop logic same) ...
            const shopCandidates = Object.values(CARDS_LIBRARY).filter(c => 
                c.type !== CardType.STATUS && 
                c.type !== CardType.CURSE && 
                c.rarity !== 'SPECIAL'
            );

            const cards: ICard[] = [];
            for(let i=0; i<5; i++) {
                if (shopCandidates.length === 0) break;
                const cTemplate = shopCandidates[Math.floor(Math.random() * shopCandidates.length)];
                const c = { ...cTemplate };
                
                let price = 40 + Math.floor(Math.random() * 60);
                if (c.rarity === 'UNCOMMON') price += 25;
                if (c.rarity === 'RARE') price += 50;
                if (c.rarity === 'LEGENDARY') price += 100;
                
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
            // イベント生成ロジックを eventService に委譲
            const ev = generateEvent(
                nextState.player,
                setGameState,
                handleNodeComplete,
                setEventResultLog,
                languageMode
            );
            setEventData(ev);
            setEventResultLog(null);
            setGameState({ ...nextState, screen: GameScreen.EVENT });
            audioService.playBGM('event');
        } else if (node.type === NodeType.TREASURE) {
            // ... (Treasure logic same) ...
            const p = nextState.player;
            const matryoshkaCharges = p.relicCounters['MATRYOSHKA'] || 0;
            const numRelics = matryoshkaCharges > 0 ? 2 : 1;
            if (matryoshkaCharges > 0) {
                 p.relicCounters['MATRYOSHKA'] = matryoshkaCharges - 1;
            }

            const rewards: RewardItem[] = [];
            const allRelics = Object.values(RELIC_LIBRARY).filter(r => ['COMMON', 'UNCOMMON', 'RARE'].includes(r.rarity));
            
            for(let i=0; i<numRelics; i++) {
                rewards.push({ type: 'RELIC', value: shuffle([...allRelics])[0], id: `tr-relic-${Date.now()}-${i}` });
            }
            
            rewards.push({ type: 'GOLD', value: 50 + Math.floor(Math.random() * 50), id: `tr-gold-${Date.now()}` });
            setTreasureRewards(rewards);
            setGameState({ ...nextState, player: p, screen: GameScreen.TREASURE });
            audioService.playBGM('reward');
        }

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSelectEnemy = (id: string) => setGameState(prev => ({ ...prev, selectedEnemyId: id }));

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
      setGameState(prev => {
          const p = { ...prev.player };
          const mode = prev.selectionState;
          if (mode.type === 'DISCARD' || mode.type === 'EXHAUST') {
              p.hand = p.hand.filter(c => c.id !== card.id);
              if (mode.type === 'DISCARD') {
                 p.discardPile.push(card);
                 if (card.name === 'カンニングペーパー' || card.name === 'STRATEGIST') {
                     p.currentEnergy += 2;
                     p.floatingText = { id: `strat-${Date.now()}-${Math.random()}`, text: '+2 Energy', color: 'text-yellow-400', iconType: 'zap' };
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

  const handleUsePotion = (potion: Potion) => {
      if (gameState.screen !== GameScreen.BATTLE) return;
      audioService.playSound('select');
      
      setGameState(prev => {
          const p = { ...prev.player };
          const enemies = [...prev.enemies];
          const newLogs = [`${trans("ポーション使用", languageMode)}: ${trans(potion.name, languageMode)}`];
          
          p.potions = p.potions.filter(pt => pt.id !== potion.id);
          const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];

          if (p.relics.find(r => r.id === 'TAKETOMBO')) {
              p.currentHp = Math.min(p.maxHp, p.currentHp + 5);
              p.floatingText = { id: `heal-taketombo-${Date.now()}`, text: `+5`, color: 'text-green-500', iconType: 'heart' };
              newLogs.push(trans("竹とんぼでHP5回復", languageMode));
          }

          if (potion.templateId === 'FIRE_POTION' && target) {
              target.currentHp -= 20;
              target.floatingText = { id: `dmg-${Date.now()}`, text: '20', color: 'text-red-500', iconType: 'sword' };
              newLogs.push(`${trans(target.name, languageMode)}に20${trans("ダメージ", languageMode)}`);
          } else if (potion.templateId === 'BLOCK_POTION') {
              p.block += 12;
              newLogs.push(`${trans("ブロック", languageMode)}12を${trans("獲得", languageMode)}`);
          } else if (potion.templateId === 'STRENGTH_POTION') {
              p.strength += 2;
              newLogs.push(`${trans("ムキムキ", languageMode)}+2`);
          } else if (potion.templateId === 'ENERGY_POTION') {
              p.currentEnergy += 2;
              newLogs.push(`${trans("エネルギー", languageMode)}+2`);
          } else if (potion.templateId === 'WEAK_POTION' && target) {
              applyDebuff(target, 'WEAK', 3);
              newLogs.push(`${trans(target.name, languageMode)}に${trans("へろへろ", languageMode)}3を${trans("付与", languageMode)}`);
          } else if (potion.templateId === 'POISON_POTION' && target) {
              applyDebuff(target, 'POISON', 6);
              newLogs.push(`${trans(target.name, languageMode)}に${trans("ドクドク", languageMode)}6を${trans("付与", languageMode)}`);
          } else if (potion.templateId === 'HEALTH_POTION') {
              const heal = 15;
              p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
              p.floatingText = { id: `heal-${Date.now()}`, text: `+${heal}`, color: 'text-green-500', iconType: 'heart' };
              newLogs.push(`HP${heal}${trans("回復", languageMode)}`);
          } else if (potion.templateId === 'LIQUID_BRONZE') {
              p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
              newLogs.push(`${trans("トゲトゲ", languageMode)}+3`);
          } else if (potion.templateId === 'GAMBLERS_BREW') {
              const discardCount = p.hand.length;
              p.discardPile = [...p.discardPile, ...p.hand];
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
              for (let i = 0; i < 3; i++) {
                  if (p.potions.length < 3) {
                      const allPotions = Object.values(POTION_LIBRARY);
                      const randomPot = { ...allPotions[Math.floor(Math.random() * allPotions.length)], id: `entropy-${Date.now()}-${i}` };
                      p.potions.push(randomPot);
                  }
              }
              newLogs.push(trans("闇鍋ジュースでポーション充填", languageMode));
          }

          const remainingEnemies = enemies.filter(e => e.currentHp > 0);
          return { ...prev, player: p, enemies: remainingEnemies, combatLog: [...prev.combatLog, ...newLogs] };
      });
  };

  const handlePlayCard = (card: ICard, consumedIds?: string[]) => {
    // Determine effective cost
    let effectiveCost = card.cost;
    if (gameState.player.powers['CORRUPTION'] && card.type === CardType.SKILL) {
        effectiveCost = 0;
    }

    // Double Character Mode check - energy cost might be tricky if handled outside
    // For normal play, check energy. Synthesized card is already energy checked or handles cost differently?
    // We assume if it's a combo, energy was checked in BattleScene.
    if (!consumedIds && gameState.player.currentEnergy < effectiveCost && !gameState.player.partner) return; 
    if (gameState.enemies.length === 0) return;
    if (actingEnemyId) return; 
    if (gameState.selectionState.active) return;
    if (card.unplayable) return; 

    // Normality Check
    const hasNormality = gameState.player.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY');
    if (hasNormality && gameState.player.cardsPlayedThisTurn >= 3) {
         audioService.playSound('wrong'); 
         return; 
    }

    audioService.playSound(card.type === CardType.ATTACK ? 'attack' : 'block');
    setLastActionType(card.type);
    setLastActionTime(Date.now());

    if (card.name === '学習アルゴリズム' || card.name === 'GENETIC_ALGORITHM') {
         setGameState(prev => {
             const newDeck = prev.player.deck.map(c => {
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
             return { ...prev, player: { ...prev.player, deck: newDeck } };
         });
    }

    setGameState(prev => {
      const p = { ...prev.player, hand: [...prev.player.hand], drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile], deck: [...prev.player.deck], powers: { ...prev.player.powers } };
      let enemies = prev.enemies.map(e => ({ ...e }));
      const currentLogs: string[] = [`> ${trans(card.name, languageMode)} ${trans("を使用", languageMode)}`];
      
      // Pain Logic
      const painCards = p.hand.filter(c => c.name === '腹痛' || c.name === 'PAIN');
      if (painCards.length > 0) {
          const dmg = painCards.length;
          p.currentHp -= dmg;
          currentLogs.push(`腹痛ダメージ: -${dmg}`);
          p.floatingText = { id: `pain-${Date.now()}`, text: `-${dmg}`, color: 'text-purple-500', iconType: 'skull' };
      }

      p.currentEnergy -= effectiveCost;
      p.cardsPlayedThisTurn++;
      if (card.type === CardType.ATTACK) p.attacksPlayedThisTurn++;
      
      if (!p.typesPlayedThisTurn.includes(card.type)) {
          p.typesPlayedThisTurn.push(card.type);
      }

      // ORANGE PELLETS
      if (p.relics.find(r => r.id === 'ORANGE_PELLETS')) {
          if (p.typesPlayedThisTurn.includes(CardType.ATTACK) && 
              p.typesPlayedThisTurn.includes(CardType.SKILL) && 
              p.typesPlayedThisTurn.includes(CardType.POWER)) {
              
              if (p.powers['WEAK'] > 0) { p.powers['WEAK'] = 0; currentLogs.push(trans("へろへろ解除！", languageMode)); }
              if (p.powers['VULNERABLE'] > 0) { p.powers['VULNERABLE'] = 0; currentLogs.push(trans("びくびく解除！", languageMode)); }
              if (p.powers['FRAIL'] > 0) { p.powers['FRAIL'] = 0; currentLogs.push(trans("もろい解除！", languageMode)); } 
              
              p.typesPlayedThisTurn = []; 
              p.floatingText = { id: `pellets-${Date.now()}`, text: 'デバフ解除', color: 'text-white', iconType: 'shield' };
          }
      }

      // DISCOVERY
      if (card.name === '発見' || card.name === 'DISCOVERY') {
          for (let i = 0; i < 3; i++) {
              const keys = Object.keys(CARDS_LIBRARY).filter(k => !STATUS_CARDS[k] && !CURSE_CARDS[k]);
              const key = keys[Math.floor(Math.random() * keys.length)];
              const newCard = { ...CARDS_LIBRARY[key], id: `disc-${Date.now()}-${i}`, cost: 0, exhaust: true };
              if (p.hand.length < HAND_SIZE + 5) {
                  p.hand.push(newCard);
              } else {
                  p.discardPile.push(newCard);
              }
          }
          currentLogs.push(trans("発見！カードを3枚生成", languageMode));
      }

      // Calculated Gamble Logic
      if (card.name === '山勘' || card.name === 'CALCULATED_GAMBLE') {
          const cardsToDiscard = p.hand.filter(c => c.id !== card.id);
          const count = cardsToDiscard.length;
          
          cardsToDiscard.forEach(c => {
              p.discardPile.push(c);
              // Strategist check
              if (c.name === 'カンニングペーパー' || c.name === 'STRATEGIST') {
                  p.currentEnergy += 2;
                  currentLogs.push(`${trans("カンニングペーパー", languageMode)}: +2 Energy`);
                  p.floatingText = { id: `strat-${Date.now()}-${Math.random()}`, text: '+2 Energy', color: 'text-yellow-400', iconType: 'zap' };
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
                  if (newCard.name === '虚無' || newCard.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                  p.hand.push(newCard);
              }
          }
          currentLogs.push(`${trans("手札を交換", languageMode)} (${count})`);
      }

      if (p.powers['AFTER_IMAGE']) p.block += p.powers['AFTER_IMAGE'];
      if (p.powers['THOUSAND_CUTS']) {
          enemies.forEach(e => {
              e.currentHp -= p.powers['THOUSAND_CUTS'];
              e.floatingText = { id: `cut-${Date.now()}-${e.id}`, text: `${p.powers['THOUSAND_CUTS']}`, color: 'text-purple-400' };
          });
      }

      // Activations Loop
      let activations = 1;
      if (p.echoes > 0) { activations++; p.echoes--; currentLogs.push(trans("反響で再発動！", languageMode)); }
      if (card.type === CardType.SKILL && p.powers['BURST'] > 0) { activations++; p.powers['BURST']--; currentLogs.push(trans("バーストで再発動！", languageMode)); }
      if (card.type === CardType.ATTACK && p.relics.find(r => r.id === 'NECRONOMICON') && card.cost >= 2 && !p.turnFlags['NECRONOMICON_USED']) {
          activations++;
          p.turnFlags['NECRONOMICON_USED'] = true;
          currentLogs.push(trans("ネクロノミコンで再発動！", languageMode));
      }

      for (let act = 0; act < activations; act++) {
          let hits = 1;
          if (card.playCopies) hits += card.playCopies;

          for (let h = 0; h < hits; h++) {
              let targets: Enemy[] = [];
              if (card.target === TargetType.ALL_ENEMIES) targets = enemies;
              else if (card.target === TargetType.RANDOM_ENEMY) targets = [enemies[Math.floor(Math.random() * enemies.length)]];
              else {
                  const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];
                  if (target) targets = [target];
              }

              // Damage Logic
              if (card.damage || card.damageBasedOnBlock || card.damagePerCardInHand || card.damagePerAttackPlayed || card.damagePerStrike || card.damagePerCardInDraw) {
                targets.forEach(e => {
                    const strengthBonus = p.strength * (card.strengthScaling || 1);
                    let baseDamage = (card.damage || 0);
                    let logParts: string[] = [`${baseDamage}`];
                    
                    if (card.damageBasedOnBlock) { baseDamage += p.block; logParts[0] = `${baseDamage}(Block)`; }
                    if (card.damagePerCardInHand) baseDamage += (p.hand.filter(c => c.id !== card.id).length) * card.damagePerCardInHand!;
                    if (card.damagePerAttackPlayed) baseDamage += (p.attacksPlayedThisTurn - 1) * card.damagePerAttackPlayed!;
                    if (card.damagePerStrike) baseDamage += (p.deck.filter(c => c.name.includes('えんぴつ攻撃') || c.name.includes('攻撃')).length) * card.damagePerStrike!;
                    if (card.damagePerCardInDraw) baseDamage += p.drawPile.length * card.damagePerCardInDraw!;

                    if ((card.name === 'ナイフ' || card.name === 'SHIV') && p.powers['ACCURACY']) {
                        baseDamage += p.powers['ACCURACY'];
                        logParts.push(`+${p.powers['ACCURACY']}(精度)`);
                    }

                    if (p.strength !== 0) {
                        const bonus = p.strength * (card.strengthScaling || 1);
                        baseDamage += bonus;
                        logParts.push(`${bonus >= 0 ? '+' : ''}${bonus}(${trans("ムキムキ", languageMode)})`);
                    }

                    // Pen Nib Logic
                    let multiplier = 1;
                    if (card.type === CardType.ATTACK) {
                        p.relicCounters['PEN_NIB'] = (p.relicCounters['PEN_NIB'] || 0) + 1;
                        // Trigger on 10th attack
                        if (p.relicCounters['PEN_NIB'] === 10) {
                            multiplier = 2;
                            p.relicCounters['PEN_NIB'] = 0;
                            logParts.push(`x2(ペン先)`);
                        }
                    }

                    let damage = Math.floor(baseDamage * multiplier);

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
                    if (damage > 0 || logParts.length > 1) {
                        e.floatingText = { id: `dmg-${Date.now()}-${e.id}-${h}`, text: `${damage}`, color: 'text-white', iconType: 'sword' };
                        const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                        currentLogs.push(`${trans(e.name, languageMode)}に${formula}${damage}${trans("ダメージ", languageMode)}`);
                    }

                    if (card.lifesteal && damage > 0) {
                        p.currentHp = Math.min(p.currentHp + damage, p.maxHp);
                    }
                    
                    if (e.currentHp <= 0) {
                         currentLogs.push(`${trans(e.name, languageMode)}${trans("を倒した！", languageMode)}`);
                         if (card.fatalEnergy) p.currentEnergy += card.fatalEnergy;
                         if (card.fatalPermanentDamage) {
                             const deckCard = p.deck.find(c => c.id === card.id);
                             if (deckCard) deckCard.damage = (deckCard.damage || 0) + card.fatalPermanentDamage!;
                         }
                         if (card.fatalMaxHp) { p.maxHp += card.fatalMaxHp!; p.currentHp += card.fatalMaxHp!; }
                         if (e.corpseExplosion) {
                             enemies.forEach(other => { 
                                 if (other.id !== e.id) {
                                     other.currentHp -= e.maxHp; 
                                     other.floatingText = { id: `expl-${Date.now()}`, text: `${e.maxHp}`, color: 'text-green-400' };
                                     currentLogs.push(`${trans("死体爆破", languageMode)}: ${trans(other.name, languageMode)}に${e.maxHp}${trans("ダメージ", languageMode)}`);
                                 }
                             });
                         }
                         if (card.capture) {
                             const damageVal = Math.max(5, Math.floor(e.maxHp * 0.5));
                             const captured: ICard = {
                                 id: `captured-${e.id}-${Date.now()}`,
                                 name: e.name,
                                 type: CardType.ATTACK,
                                 target: TargetType.ENEMY,
                                 cost: 1,
                                 damage: damageVal,
                                 description: `${damageVal}${trans("ダメージ", languageMode)}。${trans("廃棄", languageMode)}。`,
                                 rarity: 'SPECIAL',
                                 textureRef: e.name, 
                                 exhaust: true
                             };
                             p.deck.push(captured);
                             p.discardPile.push(captured);
                             e.floatingText = { id: `cap-${Date.now()}`, text: 'GET!', color: 'text-yellow-400' };
                             currentLogs.push(`${trans(e.name, languageMode)}を${trans("捕獲した！", languageMode)}`);
                         }
                    }
                });
              }

              // Effects Logic
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
                  const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                  currentLogs.push(`${trans("ブロック", languageMode)}${formula}${blk}を${trans("獲得", languageMode)}`);
              }
              if (card.doubleBlock) p.block *= 2;
              if (card.heal) p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
              if (card.energy) p.currentEnergy += card.energy;
              if (card.selfDamage) { 
                  p.currentHp -= card.selfDamage; 
                  currentLogs.push(`${trans("自分に", languageMode)}${card.selfDamage}${trans("ダメージ", languageMode)}`);
                  if (p.powers['RUPTURE']) p.strength += p.powers['RUPTURE']; 
              }
              if (card.strength) {
                  p.strength += card.strength;
                  currentLogs.push(`${trans("ムキムキ", languageMode)}+${card.strength}`);
              }
              if (card.vulnerable) targets.forEach(e => applyDebuff(e, 'VULNERABLE', card.vulnerable!));
              if (card.weak) targets.forEach(e => applyDebuff(e, 'WEAK', card.weak!));
              if (card.poison) {
                  let amt = card.poison;
                  if (p.relics.find(r => r.id === 'SNAKE_SKULL')) amt += 1; 
                  targets.forEach(e => applyDebuff(e, 'POISON', amt));
                  currentLogs.push(`${trans("ドクドク", languageMode)}${amt}${trans("を付与", languageMode)}`);
              }
              
              if (card.poisonMultiplier && targets.length > 0) {
                  targets.forEach(e => {
                      if (e.poison > 0) {
                          e.poison *= card.poisonMultiplier!;
                          currentLogs.push(`${trans(e.name, languageMode)}の${trans("毒", languageMode)}が${card.poisonMultiplier}倍になった！`);
                      }
                  });
              }
              
              if (card.upgradeHand) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  currentLogs.push(trans("手札を強化", languageMode));
              }
              if (card.upgradeDeck) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  p.drawPile = p.drawPile.map(c => getUpgradedCard(c));
                  p.discardPile = p.discardPile.map(c => getUpgradedCard(c));
                  currentLogs.push(trans("デッキ全体を強化", languageMode));
              }
              if (card.doubleStrength) p.strength *= 2;
              if (card.shuffleHandToDraw) { p.drawPile = shuffle([...p.drawPile, ...p.hand]); p.hand = []; }
              if (card.applyPower) {
                  p.powers[card.applyPower.id] = (p.powers[card.applyPower.id] || 0) + card.applyPower.amount;
                  if (card.applyPower.id === 'CORPSE_EXPLOSION' && targets.length > 0) {
                      targets.forEach(e => e.corpseExplosion = true);
                      currentLogs.push(trans("死体爆破を付与", languageMode));
                  }
              }
              if (card.draw) {
                for (let j = 0; j < card.draw; j++) {
                  if (p.drawPile.length === 0) {
                    if (p.discardPile.length === 0) break;
                    p.drawPile = shuffle(p.discardPile);
                    p.discardPile = [];
                  }
                  const newCard = p.drawPile.pop();
                  if (newCard) { 
                      if (newCard.name === '虚無' || newCard.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1); 
                      p.hand.push(newCard); 
                  }
                }
              }
              if (card.addCardToHand) {
                  for (let c=0; c<card.addCardToHand.count; c++) {
                      const template = CARDS_LIBRARY[card.addCardToHand.cardName];
                      if (template) {
                          let newC = { ...template, id: `gen-${Date.now()}-${c}-${Math.random()}` };
                          if (card.addCardToHand.cost0) newC.cost = 0;
                          if (p.powers['MASTER_REALITY']) newC = getUpgradedCard(newC);
                          if (p.hand.length < HAND_SIZE + 5) p.hand.push(newC);
                      }
                  }
              }
              if (card.addCardToDraw) {
                   for (let c=0; c<card.addCardToDraw.count; c++) { 
                       const template = CARDS_LIBRARY[card.addCardToDraw.cardName];
                       if (template) p.drawPile.push({ ...template, id: `gen-${Date.now()}-${c}` }); 
                   }
                   p.drawPile = shuffle(p.drawPile);
              }
              if (card.addCardToDiscard) {
                   for (let c=0; c<card.addCardToDiscard.count; c++) { 
                       const template = CARDS_LIBRARY[card.addCardToDiscard.cardName];
                       if (template) p.discardPile.push({ ...template, id: `gen-${Date.now()}-${c}` }); 
                   }
              }
              if (card.nextTurnDraw) p.nextTurnDraw += card.nextTurnDraw;
              if (card.nextTurnEnergy) p.nextTurnEnergy += card.nextTurnEnergy;

              if (card.name === '退学処分' || card.name === 'EXPULSION') {
                  const threshold = card.upgraded ? 40 : 30;
                  targets.forEach(e => {
                      if (e.currentHp <= threshold) {
                          e.currentHp = 0;
                          currentLogs.push(`${trans(e.name, languageMode)}は${trans("退学", languageMode)}になった！`);
                          e.floatingText = { id: `kill-${Date.now()}`, text: '退学!', color: 'text-red-600', iconType: 'skull' };
                      } else {
                          currentLogs.push(`${trans(e.name, languageMode)}は${trans("退学", languageMode)}を免れた`);
                      }
                  });
              }

              if (card.type === CardType.ATTACK) {
                  p.relicCounters['ATTACK_COUNT'] = (p.relicCounters['ATTACK_COUNT'] || 0) + 1;
                  if (p.relicCounters['ATTACK_COUNT'] % 3 === 0) {
                      if (p.relics.find(r => r.id === 'KUNAI')) { p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1; p.floatingText = { id: `kunai-${Date.now()}`, text: `${trans("カチカチ", languageMode)}+1`, color: 'text-blue-400', iconType: 'shield' }; }
                      if (p.relics.find(r => r.id === 'SHURIKEN')) { p.strength += 1; p.floatingText = { id: `shuri-${Date.now()}`, text: `${trans("ムキムキ", languageMode)}+1`, color: 'text-red-400', iconType: 'sword' }; }
                      if (p.relics.find(r => r.id === 'ORNAMENTAL_FAN')) { p.block += 4; p.floatingText = { id: `fan-${Date.now()}`, text: '+4 Block', color: 'text-blue-400', iconType: 'shield' }; }
                  }
              }

              enemies = enemies.filter(e => e.currentHp > 0);
          }
      }

      // Consumed Cards Handling (for Partner Combo)
      if (consumedIds) {
          const consumedCards = p.hand.filter(c => consumedIds.includes(c.id));
          p.discardPile = [...p.discardPile, ...consumedCards];
          p.hand = p.hand.filter(c => !consumedIds.includes(c.id));
      } else {
          // Standard Card Play
          p.hand = p.hand.filter(c => c.id !== card.id);
          
          let shouldExhaust = card.exhaust;
          if (card.type === CardType.SKILL && p.powers['CORRUPTION']) shouldExhaust = true;

          // Temporary Combo cards from synthesis (consumedIds was false but it's a synth result)
          // actually this block handles the "played" card.
          // If it was a temporary synthesized card (indicated by consumedIds being passed to handlePlaySynthesizedCard, which calls this)
          // we need to distinguish. 
          // The cleanest way is if the card has a flag.
          const isTemporaryCombo = (card as any).isTemporaryCombo;
          
          if (!isTemporaryCombo) {
              if (card.name === '八つ当たり' || card.name === 'YATSUATARI') {
                  card.damage = (card.damage || 0) + 5;
                  currentLogs.push("八つ当たりの怒りが増した！");
              }

              if (!shouldExhaust && !(card.type === CardType.POWER) && !(card.promptsExhaust === 99)) {
                  p.discardPile.push(card);
              } else if (shouldExhaust || card.promptsExhaust === 99) {
                  if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
              }
          }
      }

      let nextSelectionState = { ...prev.selectionState };
      if (card.promptsDiscard) nextSelectionState = { active: true, type: 'DISCARD', amount: card.promptsDiscard, originCardId: card.id };
      if (card.promptsCopy) nextSelectionState = { active: true, type: 'COPY', amount: card.promptsCopy, originCardId: card.id };
      if (card.promptsExhaust === 99) {
          if (card.name === '断捨離' || card.name === 'SEVER_SOUL') {
              const cardsToExhaust = p.hand.filter(c => c.type !== CardType.ATTACK);
              if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
              p.hand = p.hand.filter(c => c.type === CardType.ATTACK);
          } else if (card.name === '焚き火' || card.name === 'FIEND_FIRE') {
               if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * p.hand.length;
               p.hand = [];
          }
      }

      let nextSelectedId = prev.selectedEnemyId;
      if (!enemies.find(e => e.id === nextSelectedId) && enemies.length > 0) nextSelectedId = enemies[0].id;

      return { ...prev, player: p, enemies: enemies, selectedEnemyId: nextSelectedId, selectionState: nextSelectionState, combatLog: [...prev.combatLog, ...currentLogs] };
    });
  };

  const startPlayerTurn = () => {
    setTurnLog(trans("あなたのターン", languageMode));
    setGameState(prev => {
      const p = { ...prev.player };
      
      if (p.powers['DEMON_FORM']) { 
          p.strength += p.powers['DEMON_FORM']; 
          p.floatingText = { id: `pow-demon-${Date.now()}`, text: '反抗期', color: 'text-red-500' }; 
      }
      if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
      
      let devaBonus = 0;
      if (p.powers['DEVA_FORM']) {
          devaBonus = p.powers['DEVA_FORM'];
          p.powers['DEVA_FORM']++; 
          p.floatingText = { id: `pow-deva-${Date.now()}`, text: `受験勉強(+${devaBonus})`, color: 'text-purple-400' };
      }

      if (p.powers['NOXIOUS_FUMES']) {
          const enemies = prev.enemies.map(e => {
              const newPoison = e.poison + p.powers['NOXIOUS_FUMES'];
              return { ...e, poison: newPoison };
          });
          prev.enemies = enemies; 
      }
      
      if (prev.turn === 1 && p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) {
          p.strength -= 3;
          p.floatingText = { id: `relic-mutagen-${Date.now()}`, text: '筋力低下', color: 'text-gray-400' };
      }

      if (p.relics.find(r => r.id === 'MERCURY_HOURGLASS')) {
          prev.enemies.forEach(e => {
              e.currentHp -= 3;
              e.floatingText = { id: `dmg-hg-${Date.now()}-${e.id}`, text: '3', color: 'text-gray-400', iconType: 'sword' };
          });
          prev.enemies = prev.enemies.filter(e => e.currentHp > 0);
      }

      if (prev.turn === 1 && p.relics.find(r => r.id === 'HORN_CLEAT')) {
          p.block += 14;
          p.floatingText = { id: `relic-horn-${Date.now()}`, text: '+14 Block', color: 'text-blue-400', iconType: 'shield' };
      }

      // --- HAPPY FLOWER Logic ---
      if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) {
          const current = (p.relicCounters['HAPPY_FLOWER'] || 0) + 1;
          if (current === 3) {
              p.currentEnergy += 1; 
              p.floatingText = { id: `relic-flower-${Date.now()}`, text: '+1 Energy', color: 'text-yellow-400', iconType: 'zap' };
              p.relicCounters['HAPPY_FLOWER'] = 0;
          } else {
              p.relicCounters['HAPPY_FLOWER'] = current;
          }
      }

      let newDrawPile = [...p.drawPile];
      let newDiscardPile = [...p.discardPile];
      let newHand: ICard[] = [];

      if (p.relics.find(r => r.id === 'BOOKMARK') && p.hand.length > 0) {
          newHand.push(p.hand[0]); 
          newDiscardPile = [...newDiscardPile, ...p.hand.slice(1)];
      } else {
          newDiscardPile = [...newDiscardPile, ...p.hand];
      }

      let drawCount = HAND_SIZE + (p.powers['TOOLS_OF_THE_TRADE'] ? 1 : 0) + p.nextTurnDraw;
      p.nextTurnDraw = 0;

      for (let i = 0; i < drawCount; i++) {
        if (newDrawPile.length === 0) {
          if (newDiscardPile.length === 0) break;
          newDrawPile = shuffle(newDiscardPile);
          newDiscardPile = [];
        }
        const card = newDrawPile.pop();
        if (card) {
            if (card.name === '虚無' || card.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
            // Snecko Eye OR Confusion
            if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && card.cost >= 0) {
                card.cost = Math.floor(Math.random() * 4);
            }
            newHand.push(card);

            if (p.powers['EVOLVE'] && (card.type === CardType.STATUS || card.type === CardType.CURSE)) {
                for (let k=0; k<p.powers['EVOLVE']; k++) {
                    if (newDrawPile.length === 0) {
                        if (newDiscardPile.length === 0) break;
                        newDrawPile = shuffle(newDiscardPile);
                        newDiscardPile = [];
                    }
                    const extraCard = newDrawPile.pop();
                    if (extraCard) {
                        if (extraCard.name === '虚無' || extraCard.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                        // Snecko Eye OR Confusion for extra drawn cards too
                        if ((p.relics.find(r => r.id === 'SNECKO_EYE') || p.powers['CONFUSED'] > 0) && extraCard.cost >= 0) {
                            extraCard.cost = Math.floor(Math.random() * 4);
                        }
                        newHand.push(extraCard);
                    }
                }
            }
        }
      }

      if (p.powers['CREATIVE_AI']) {
          const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
          const power = powers[Math.floor(Math.random() * powers.length)];
          newHand.push({ ...power, id: `ai-${Date.now()}`, cost: 0 });
      }
      if (p.powers['INFINITE_BLADES']) {
          newHand.push({ ...CARDS_LIBRARY['SHIV'], id: `inf-${Date.now()}` });
      }
      
      if (p.relics.find(r => r.id === 'WARPED_TONGS') && newHand.length > 0) {
          const upgradeable = newHand.filter(c => !c.upgraded);
          if (upgradeable.length > 0) {
              const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
              const upgraded = getUpgradedCard(c);
              const idx = newHand.findIndex(x => x.id === c.id);
              if (idx !== -1) newHand[idx] = upgraded;
          }
      }

      let baseEnergy = p.maxEnergy + p.nextTurnEnergy + devaBonus;
      if (p.relics.find(r => r.id === 'ICE_CREAM')) {
          baseEnergy += p.currentEnergy;
      }
      p.currentEnergy = baseEnergy;
      p.nextTurnEnergy = 0;

      if (!p.powers['BARRICADE']) {
          if (p.relics.find(r => r.id === 'CALIPERS')) {
              p.block = Math.max(0, p.block - 15);
          } else {
              p.block = 0;
          }
      }
      
      p.hand = newHand;
      p.drawPile = newDrawPile;
      p.discardPile = newDiscardPile;
      p.cardsPlayedThisTurn = 0;
      p.attacksPlayedThisTurn = 0;
      p.turnFlags = {};
      p.typesPlayedThisTurn = []; 
      p.relicCounters['ATTACK_COUNT'] = 0; 

      let nextSelection = { ...prev.selectionState };
      if (p.powers['TOOLS_OF_THE_TRADE']) {
          nextSelection = { active: true, type: 'DISCARD', amount: 1 };
      }

      return { ...prev, player: p, enemies: prev.enemies, selectionState: nextSelection, turn: prev.turn + 1 };
    });
  };

  const executeEndTurn = async (cardToAdd?: ICard) => {
    audioService.playSound('select');
    setTurnLog(trans("敵のターン", languageMode));
    setLastActionType(null);
    
    setGameState(prev => {
        const p = { ...prev.player };
        const newLogs: string[] = [];

        if (cardToAdd) {
            if (p.hand.length < HAND_SIZE + 5) {
                p.hand = [...p.hand, cardToAdd];
            } else {
                p.discardPile = [...p.discardPile, cardToAdd];
            }
        }
        
        if (p.powers['METALLICIZE']) {
            p.block += p.powers['METALLICIZE'];
            p.floatingText = { id: `pow-metal-${Date.now()}`, text: `+${p.powers['METALLICIZE']}`, color: 'text-blue-400', iconType: 'shield' };
        }

        if (p.powers['WEAK'] > 0) {
            p.powers['WEAK']--;
            if (p.powers['WEAK'] === 0) newLogs.push(trans("へろへろから回復した", languageMode));
        }
        if (p.powers['VULNERABLE'] > 0) {
            p.powers['VULNERABLE']--;
            if (p.powers['VULNERABLE'] === 0) newLogs.push(trans("びくびくから回復した", languageMode));
        }
        if (p.powers['CONFUSED'] > 0) {
            p.powers['CONFUSED']--;
            if (p.powers['CONFUSED'] === 0) newLogs.push(trans("混乱から回復した", languageMode));
        }
        
        return { ...prev, player: p, combatLog: [...prev.combatLog, ...newLogs] };
    });

    await wait(500);

    const enemies = [...gameState.enemies];
    for (const enemy of enemies) {
        if (gameState.player.currentHp <= 0) break;
        
        if (enemy.poison > 0) {
            enemy.currentHp -= enemy.poison;
            enemy.poison--;
            enemy.floatingText = { id: `psn-${Date.now()}-${enemy.id}`, text: `${enemy.poison + 1}`, color: 'text-green-500', iconType: 'poison' };
            setGameState(prev => ({ 
                ...prev, 
                enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, currentHp: enemy.currentHp, poison: enemy.poison, floatingText: enemy.floatingText } : e),
                combatLog: [...prev.combatLog, `${trans(enemy.name, languageMode)}に毒ダメージ${enemy.poison + 1}`]
            }));
            if (enemy.currentHp <= 0) continue;
        }

        setActingEnemyId(enemy.id);
        await wait(300); 

        if (enemy.nextIntent.type === EnemyIntentType.ATTACK) audioService.playSound('attack');
        else if (enemy.nextIntent.type === EnemyIntentType.DEFEND) audioService.playSound('block');
        else audioService.playSound('select');

        setGameState(prev => {
            const currentEnemyIndex = prev.enemies.findIndex(e => e.id === enemy.id);
            if (currentEnemyIndex === -1) return prev;
            const p = { ...prev.player };
            const newEnemies = [...prev.enemies];
            const e = { ...newEnemies[currentEnemyIndex] };
            newEnemies[currentEnemyIndex] = e;
            const newLogs: string[] = [];
            
            const intent = e.nextIntent;
            e.block = 0; 

            if (intent.type === EnemyIntentType.ATTACK || intent.type === EnemyIntentType.ATTACK_DEBUFF || intent.type === EnemyIntentType.ATTACK_DEFEND) {
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
                
                if (damage > 0) {
                    if (p.powers['BUFFER'] > 0) { 
                        p.powers['BUFFER']--; 
                        damage = 0; 
                        newLogs.push(trans("バッファーでダメージ無効化", languageMode));
                    } else {
                        if (p.powers['STATIC_DISCHARGE']) {
                            const target = newEnemies[Math.floor(Math.random() * newEnemies.length)];
                            target.currentHp -= p.powers['STATIC_DISCHARGE'];
                            newLogs.push(trans("静電放電発動！", languageMode));
                        }
                    }
                }

                let unblockedDamage = 0;
                if (p.block >= damage) { 
                    p.block -= damage; 
                    const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                    newLogs.push(`${trans(e.name, languageMode)}の攻撃 ${formula}${damage} を${trans("ブロック", languageMode)}`);
                } else { 
                    unblockedDamage = damage - p.block; 
                    p.block = 0; 
                    const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                    newLogs.push(`${trans(e.name, languageMode)}から ${formula}${damage} ${trans("ダメージを受けた", languageMode)}`);
                }
                
                // --- Partner Damage Logic ---
                if (p.partner && p.partner.currentHp > 0) {
                     // Randomly decide if player or partner takes damage
                     // 50/50 chance for unblocked damage
                     if (unblockedDamage > 0 && Math.random() < 0.5) {
                         p.partner.currentHp -= unblockedDamage;
                         p.partner.floatingText = { id: `dmg-partner-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                         newLogs.push(`${p.partner.name}がダメージを受けた！`);
                         if (p.partner.currentHp <= 0) {
                             newLogs.push(`${p.partner.name}が倒れた...`);
                             // Partner doesn't revive
                             p.partner = undefined; 
                         }
                     } else {
                         p.currentHp -= unblockedDamage;
                         if (unblockedDamage > 0) p.floatingText = { id: `dmg-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                     }
                } else {
                     p.currentHp -= unblockedDamage;
                     if (unblockedDamage > 0) p.floatingText = { id: `dmg-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                }

                if (p.powers['THORNS'] && damage > 0) { 
                    e.currentHp -= p.powers['THORNS'];
                    e.floatingText = { id: `thorns-${Date.now()}`, text: `${p.powers['THORNS']}`, color: 'text-orange-500', iconType: 'sword' };
                    newLogs.push(`${trans("トゲトゲ", languageMode)}で${p.powers['THORNS']}反撃ダメージ`);
                }
            }

            if (intent.type === EnemyIntentType.DEFEND || intent.type === EnemyIntentType.ATTACK_DEFEND) {
                e.block += intent.value; 
                if (intent.type === EnemyIntentType.ATTACK_DEFEND && intent.secondaryValue) e.block = intent.secondaryValue;
                newLogs.push(`${trans(e.name, languageMode)}は防御を固めた`);
            }

            if (intent.type === EnemyIntentType.BUFF) {
                e.strength += (intent.secondaryValue || 2);
                newLogs.push(`${trans(e.name, languageMode)}は力を溜めた`);
            }

            if (intent.type === EnemyIntentType.DEBUFF || intent.type === EnemyIntentType.ATTACK_DEBUFF) {
                if (p.powers['ARTIFACT'] > 0) {
                    p.powers['ARTIFACT']--;
                    newLogs.push(trans("アーティファクトでデバフを防いだ", languageMode));
                } else {
                    const debuffAmt = intent.secondaryValue || 1;
                    const type = intent.debuffType;
                    if (type === 'WEAK') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + debuffAmt;
                    if (type === 'VULNERABLE') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + debuffAmt;
                    if (type === 'CONFUSED') p.powers['CONFUSED'] = (p.powers['CONFUSED'] || 0) + debuffAmt;
                    if (type === 'POISON') {
                        const status = { ...STATUS_CARDS.SLIMED, id: `slime-${Date.now()}` };
                        p.discardPile.push(status);
                        newLogs.push(trans("粘液を混ぜられた", languageMode));
                    }
                    if (type) {
                        let jpType = type;
                        if (type === 'WEAK') jpType = 'へろへろ';
                        else if (type === 'VULNERABLE') jpType = 'びくびく';
                        else if (type === 'CONFUSED') jpType = '混乱';
                        newLogs.push(`${trans(jpType, languageMode)}を${debuffAmt}受けました`);
                    }
                }
            }
            
            if (e.vulnerable > 0) e.vulnerable--;
            if (e.weak > 0) e.weak--;

            e.nextIntent = getNextEnemyIntent(e, gameState.turn + 1);

            return { ...prev, player: p, enemies: newEnemies, combatLog: [...prev.combatLog, ...newLogs] };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    setGameState(prev => {
        const p = { ...prev.player };
        const newLogs: string[] = [];
        
        if (p.powers['REGEN'] > 0) {
            const heal = p.powers['REGEN'];
            p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
            p.powers['REGEN']--;
            p.floatingText = { id: `pow-regen-${Date.now()}`, text: `+${heal}`, color: 'text-green-500', iconType: 'heart' };
            newLogs.push(`再生で${heal}回復`);
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
        }
        
        p.hand.forEach(c => {
            if (c.name === 'やけど' || c.name === 'BURN') { p.currentHp -= 2; newLogs.push("やけどダメージ"); }
            if (c.name === '虫歯' || c.name === 'DECAY') { p.currentHp -= 2; newLogs.push("虫歯ダメージ"); }
            if (c.name === '不安' || c.name === 'DOUBT') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + 1;
            if (c.name === '恥' || c.name === 'SHAME') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + 1;
            if (c.name === '後悔' || c.name === 'REGRET') { p.currentHp -= p.hand.length; newLogs.push("後悔ダメージ"); }
        });

        return { ...prev, player: p, combatLog: [...prev.combatLog, ...newLogs] };
    });
    
    startPlayerTurn();
  };
  
  const handleEndTurnClick = () => {
       if (gameState.player.relics.find(r => r.id === 'NILRYS_CODEX')) {
           const pool = Object.values(CARDS_LIBRARY).filter(c => !STATUS_CARDS[c.name] && !CURSE_CARDS[c.name] && c.rarity !== 'SPECIAL');
           const options = [];
           for(let i=0; i<3; i++) {
                options.push({...pool[Math.floor(Math.random() * pool.length)], id: `codex-${Date.now()}-${i}`});
           }
           setGameState(prev => ({ ...prev, codexOptions: options }));
       } else {
           executeEndTurn();
       }
  }
  
  const onCodexSelect = (card: ICard | null) => {
      setGameState(prev => ({ ...prev, codexOptions: undefined }));
      executeEndTurn(card || undefined);
  }

  const handleSynthesizeCard = (cards: ICard[]) => {
      // 3枚まで対応。引数は可変長だが、synthesizeCardsの実装に合わせて展開する。
      const [c1, c2, c3] = cards;
      const newCard = synthesizeCards(c1, c2, c3);
      
      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              // 元のカードを除外
              deck: [...prev.player.deck.filter(c => !cards.some(target => target.id === c.id)), newCard]
          }
      }));
      
      return newCard;
  };
  
  const handlePlaySynthesizedCard = (card: ICard) => {
       // Extract _consumedIds
       const consumedIds = (card as any)._consumedIds;
       if (consumedIds) {
           handlePlayCard(card, consumedIds);
       } else {
           handlePlayCard(card);
       }
  };

  const handleEventContinue = () => {
      handleNodeComplete();
  };

  const handleLegacyCardSelect = (card: ICard) => {
      storageService.saveLegacyCard(card);
      setLegacyCardSelected(true);
  };

  const handleRetry = () => {
      setLegacyCardSelected(false);
      startGame(); 
  };

  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            audioService.stopBGM();
            audioService.playSound('win');
            
            let hpRegen = 0;
            if (gameState.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;
            if (gameState.player.relics.find(r => r.id === 'MEAT_ON_THE_BONE') && gameState.player.currentHp <= gameState.player.maxHp / 2) hpRegen += 12;
            
            if (hpRegen > 0) {
                setGameState(prev => ({ 
                    ...prev, 
                    player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) }
                }));
            }
            
            // Partner also regens slightly?
            if (gameState.player.partner) {
                setGameState(prev => prev.player.partner ? ({
                    ...prev,
                    player: {
                        ...prev.player,
                        partner: {
                            ...prev.player.partner,
                            currentHp: Math.min(prev.player.partner.maxHp, prev.player.partner.currentHp + 5) // Small regen
                        }
                    }
                }) : prev);
            }

            if (gameState.act === 4) {
                 setGameState(prev => ({ ...prev, screen: GameScreen.ENDING }));
                 audioService.playBGM('victory');
            } else {
                 // Skip VICTORY screen, go directly to math challenge
                 setGameState(prev => ({ ...prev, screen: GameScreen.MATH_CHALLENGE }));
            }
        } else if (gameState.player.currentHp <= 0) {
            if (gameState.player.relics.find(r => r.id === 'LIZARD_TAIL') && !gameState.player.relicCounters['LIZARD_TAIL_USED']) {
                audioService.playSound('buff');
                setGameState(prev => ({ 
                    ...prev, 
                    player: { 
                        ...prev.player, 
                        currentHp: Math.floor(prev.player.maxHp * 0.5),
                        relicCounters: { ...prev.player.relicCounters, 'LIZARD_TAIL_USED': 1 },
                        floatingText: { id: `revive-${Date.now()}`, text: '復活！', color: 'text-green-500', iconType: 'heart' }
                    }
                }));
                return;
            }
            
            const ghostPotIndex = gameState.player.potions.findIndex(p => p.templateId === 'GHOST_IN_JAR');
            if (ghostPotIndex !== -1) {
                 audioService.playSound('buff');
                 setGameState(prev => ({
                     ...prev,
                     player: {
                         ...prev.player,
                         currentHp: Math.floor(prev.player.maxHp * 0.1),
                         potions: prev.player.potions.filter((_, i) => i !== ghostPotIndex),
                         floatingText: { id: `revive-${Date.now()}`, text: 'お守り！', color: 'text-yellow-500', iconType: 'heart' }
                     }
                 }));
                 return;
            }

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

            setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
        }
    }
  }, [gameState.enemies, gameState.player.currentHp, gameState.screen, gameState.act, selectedCharName, gameState.challengeMode]);

  const goToRewardPhase = (mathGold: number = 0) => {
      const rewards: RewardItem[] = [];
      
      if (mathGold > 0) {
          let goldReward = mathGold;
          if (gameState.player.relics.find(r => r.id === 'GOLDEN_IDOL')) goldReward = Math.floor(goldReward * 1.25);
          rewards.push({ type: 'GOLD', value: goldReward, id: `rew-gold-${Date.now()}` });
      }

      const allCards = Object.values(CARDS_LIBRARY).filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL');
      for(let i=0; i<3; i++) {
          const roll = Math.random() * 100;
          let targetRarity = 'COMMON';
          if (roll > 95) targetRarity = 'LEGENDARY'; else if (roll > 80) targetRarity = 'RARE'; else if (roll > 50) targetRarity = 'UNCOMMON';
          
          const pool = allCards.filter(c => c.rarity === targetRarity);
          const candidate = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : allCards[Math.floor(Math.random() * allCards.length)];
          rewards.push({ type: 'CARD', value: { ...candidate, id: `reward-${Date.now()}-${i}` }, id: `rew-card-${i}` });
      }

      const hasSozu = gameState.player.relics.find(r => r.id === 'SOZU');
      const hasKinjiro = gameState.player.relics.find(r => r.id === 'KINJIRO_STATUE');
      if (!hasSozu && (hasKinjiro || Math.random() < 0.4)) {
          const allPotions = Object.values(POTION_LIBRARY);
          const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
          rewards.push({ type: 'POTION', value: { ...potion, id: `rew-pot-${Date.now()}` }, id: `rew-pot` });
      }

      const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
      if (currentNode && (currentNode.type === NodeType.ELITE || currentNode.type === NodeType.BOSS)) {
          const rarity = currentNode.type === NodeType.BOSS ? 'RARE' : 'UNCOMMON';
          const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === rarity || r.rarity === 'COMMON' || r.rarity === 'RARE');
          const owned = gameState.player.relics.map(r => r.id);
          const available = allRelics.filter(r => !owned.includes(r.id));
          
          if (available.length > 0) {
              const relic = available[Math.floor(Math.random() * available.length)];
              rewards.push({ type: 'RELIC', value: relic, id: `rew-relic-${Date.now()}` });
          }
          if (currentNode.type === NodeType.BOSS) {
               rewards.push({ type: 'GOLD', value: 100, id: `rew-gold-boss-${Date.now()}` });
          }
      }

      setGameState(prev => ({ ...prev, screen: GameScreen.REWARD, rewards }));
      audioService.playBGM('reward');
  };

  const handleMathChallengeComplete = (correctCount: number) => {
      let bonusGold = 0;
      if (correctCount === 1) bonusGold = 15;
      else if (correctCount === 2) bonusGold = 30;
      else if (correctCount === 3) bonusGold = 50;
      
      // Update Total Math Count (UI Only, storage updated inside component)
      setTotalMathCorrect(prev => prev + correctCount);

      goToRewardPhase(bonusGold);
  };

  const handleRewardSelection = (item: RewardItem, replacePotionId?: string) => {
      setGameState(prev => {
          let p = { ...prev.player };
          let nextRewards = [...prev.rewards];

          if (item.type === 'CARD') {
              p.deck = [...p.deck, item.value];
              nextRewards = nextRewards.filter(r => r.type !== 'CARD');
              storageService.saveUnlockedCard(item.value.name);
          } else if (item.type === 'RELIC') {
              p.relics = [...p.relics, item.value];
              nextRewards = nextRewards.filter(r => r.id !== item.id);
              if (item.value.id === 'SOZU') p.maxEnergy += 1;
              if (item.value.id === 'CURSED_KEY') p.maxEnergy += 1;
              if (item.value.id === 'PHILOSOPHER_STONE') p.maxEnergy += 1;
              if (item.value.id === 'WAFFLE') { p.maxHp += 7; p.currentHp = p.maxHp; }
              if (item.value.id === 'OLD_COIN') p.gold += 300;
              if (item.value.id === 'VELVET_CHOKER') p.maxEnergy += 1;
              if (item.value.id === 'MATRYOSHKA') p.relicCounters['MATRYOSHKA'] = 2; // Init Counter
              if (item.value.id === 'HAPPY_FLOWER') p.relicCounters['HAPPY_FLOWER'] = 0; // Init Counter
              storageService.saveUnlockedRelic(item.value.id);
          } else if (item.type === 'GOLD') {
              p.gold += item.value;
              nextRewards = nextRewards.filter(r => r.id !== item.id);
          } else if (item.type === 'POTION') {
              if (p.potions.length < 3 || replacePotionId) {
                  if (replacePotionId) p.potions = p.potions.filter(pt => pt.id !== replacePotionId);
                  p.potions = [...p.potions, item.value];
                  nextRewards = nextRewards.filter(r => r.id !== item.id);
                  storageService.saveUnlockedPotion(item.value.templateId);
              }
          }
          
          return { ...prev, player: p, rewards: nextRewards };
      });
  };

  const finishRewardPhase = () => {
      const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
      if (currentNode && currentNode.type === NodeType.BOSS) {
          const nextAct = gameState.act + 1;
          if (nextAct > 4) return;
          
          const newMap = generateDungeonMap();
          setGameState(prev => ({
              ...prev,
              act: nextAct,
              floor: 0,
              map: newMap,
              currentMapNodeId: null,
              screen: GameScreen.MAP,
              narrativeLog: [...prev.narrativeLog, trans(`第${nextAct}章へ進んだ。`, languageMode)]
          }));
          audioService.playBGM('map');
      } else {
          handleNodeComplete();
      }
  };

  const handleRestAction = () => {
      const heal = Math.floor(gameState.player.maxHp * 0.3);
      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + heal) } }));
  };

  const handleUpgradeCard = (card: ICard) => {
      const upgraded = getUpgradedCard(card);
      setGameState(prev => ({ 
          ...prev, 
          player: { 
              ...prev.player, 
              deck: prev.player.deck.map(c => c.id === card.id ? upgraded : c) 
          } 
      }));
  };

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden">
        <div className="w-full h-full relative overflow-hidden bg-black crt-scanline">
            
            {/* Language Toggle Button (Only visible on START_MENU) */}
            {gameState.screen === GameScreen.START_MENU && (
                <div className="absolute top-2 right-2 z-[9999] flex gap-2">
                    <button 
                        onClick={toggleBgmMode} 
                        className={`bg-black/50 hover:bg-black/80 text-white border border-white/50 px-2 py-1 rounded text-xs flex items-center shadow-lg transition-colors font-bold ${bgmMode === 'MP3' ? 'border-green-500 text-green-400' : ''}`}
                    >
                        <Music size={14} className="mr-1"/>
                        {bgmMode === 'OSCILLATOR' ? 'BGM: 電子音' : 'BGM: MP3'}
                    </button>
                    <button 
                        onClick={toggleLanguage} 
                        className="bg-black/50 hover:bg-black/80 text-white border border-white/50 px-2 py-1 rounded text-xs flex items-center shadow-lg transition-colors font-bold"
                    >
                        <Languages size={14} className="mr-1"/>
                        {languageMode === 'JAPANESE' ? 'にほんご' : '日本語'}
                    </button>
                </div>
            )}

            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center p-8 w-full flex flex-col items-center">
                        <h1 
                            className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-600 mb-2 font-bold animate-pulse tracking-widest leading-tight cursor-pointer select-none"
                            onClick={handleTitleClick}
                        >
                            {trans("算数ローグ", languageMode)}<br/><span className="text-4xl">{trans("伝説の小学生", languageMode)}</span>
                        </h1>
                        
                        {/* UNLOCK STATUS DISPLAY */}
                        <div className="mb-6 bg-black/40 px-4 py-2 rounded-lg border border-gray-600">
                             {nextThreshold ? (
                                <div className="text-yellow-300 text-xs md:text-sm font-bold">
                                    次のミニゲーム開放まで: <span className="text-xl md:text-2xl text-white mx-1">{Math.max(0, nextThreshold - totalMathCorrect)}</span> 問正解
                                </div>
                             ) : (
                                <div className="text-green-400 text-xs md:text-sm font-bold animate-pulse">全ミニゲーム開放済み！</div>
                             )}
                             <div className="text-gray-500 text-[10px] mt-1">累計正解数: {totalMathCorrect}問</div>
                        </div>

                        {isMathDebugSkipped && (
                            <div className="text-red-500 font-bold mb-1 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse">
                                (デバッグ: 計算スキップ ON)
                            </div>
                        )}
                        {isDebugHpOne && (
                            <div className="text-red-500 font-bold mb-6 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse">
                                (デバッグ: 敵HP1 & Loadout & 全開放 ON)
                            </div>
                        )}
                        {(!isMathDebugSkipped && !isDebugHpOne) && <div className="mb-2 h-2"></div>}

                        <div className="flex flex-col gap-3 items-center w-full max-w-[280px]">
                            {hasSave && (
                                <button onClick={continueGame} className="w-full bg-blue-900 text-white py-3 px-4 text-lg font-bold border-2 border-blue-400 hover:bg-blue-800 cursor-pointer flex items-center justify-center shadow-lg relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                    <Play className="mr-2 fill-current" /> {trans("つづきから", languageMode)}
                                </button>
                            )}
                            <button onClick={startGame} disabled={isLoading} className="w-full bg-gray-100 text-black py-3 px-4 text-lg font-bold border-b-4 border-r-4 border-gray-500 hover:bg-white hover:border-gray-400 hover:translate-x-[1px] hover:translate-y-[1px] active:border-0 active:translate-y-[4px] active:translate-x-[4px] transition-all cursor-pointer shadow-lg flex items-center justify-center">
                                {isLoading ? trans("生成中...", languageMode) : trans("冒険を始める", languageMode)}
                            </button>
                            
                            <button onClick={startChallengeGame} disabled={isLoading} className="w-full bg-red-900/80 text-red-100 py-2 px-4 text-sm font-bold border border-red-500 hover:bg-red-800 cursor-pointer flex items-center justify-center shadow-md hover:shadow-red-900/50">
                                <Swords className="mr-2" size={16}/> {trans("1A1Dモード", languageMode)}
                            </button>

                            <button onClick={openMiniGameMenu} className="w-full bg-indigo-900/80 text-indigo-100 py-2 px-4 text-sm font-bold border border-indigo-500 hover:bg-indigo-800 cursor-pointer flex items-center justify-center shadow-md hover:shadow-indigo-900/50">
                                <Gamepad2 className="mr-2" size={16}/> {trans("ミニゲーム", languageMode)}
                            </button>
                            
                            {isDebugHpOne && (
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.DEBUG_MENU }))} className="w-full bg-gray-800 text-red-400 py-2 px-4 text-sm font-bold border border-red-500 hover:bg-gray-700 cursor-pointer flex items-center justify-center shadow-md mb-2">
                                    <Zap className="mr-2" size={16}/> {trans("デバッグメニュー", languageMode)}
                                </button>
                            )}

                            <div className="flex gap-2 w-full justify-between mt-2">
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.COMPENDIUM }))} className="flex-1 bg-gray-800 text-amber-500 py-2 text-[10px] font-bold border border-gray-600 hover:border-amber-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                    <BookOpen className="mb-1" size={18}/> {trans("図鑑", languageMode)}
                                </button>
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.RANKING }))} className="flex-1 bg-gray-800 text-green-500 py-2 text-[10px] font-bold border border-gray-600 hover:border-green-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                    <Trophy className="mb-1" size={18}/> {trans("記録", languageMode)}
                                </button>
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.HELP }))} className="flex-1 bg-gray-800 text-blue-400 py-2 text-[10px] font-bold border border-gray-600 hover:border-blue-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                    <HelpCircle className="mb-1" size={18}/> {trans("遊び方", languageMode)}
                                </button>
                            </div>

                            <button onClick={() => setShowDebugLog(true)} className="text-gray-600 text-[10px] hover:text-gray-400 mt-2 flex items-center justify-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <Terminal size={10}/> v1.0.0
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDebugLog && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowDebugLog(false)}>
                    <div className="bg-gray-900 border-2 border-green-500 p-6 rounded-lg max-w-lg w-full shadow-[0_0_20px_rgba(34,197,94,0.3)]" onClick={e => e.stopPropagation()}>
                        <h2 
                            className="text-xl font-bold mb-4 text-green-400 font-mono border-b border-green-800 pb-2 select-none active:text-green-200"
                            onClick={handleLogTitleClick}
                        >
                            System Update Log v1.0.0
                        </h2>
                        <div className="space-y-4 text-sm font-mono text-gray-300 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <section>
                                <h3 className="text-white font-bold mb-1">■ リリース (Release)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>正式版 v1.0.0 リリース</li>
                                    <li>全ミニゲーム実装完了</li>
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
                <DebugMenuScreen onStart={handleDebugStart} onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MINI_GAME_SELECT && (
                <MiniGameSelectScreen 
                    onSelect={handleMiniGameSelect} 
                    onBack={returnToTitle} 
                    totalMathCorrect={totalMathCorrect}
                    isDebug={isDebugHpOne}
                />
            )}
            
            {/* ... other screens ... */}
            {gameState.screen === GameScreen.MINI_GAME_POKER && (
                <PokerGameScreen 
                    onBack={returnToTitle} 
                />
            )}

            {gameState.screen === GameScreen.MINI_GAME_SURVIVOR && (
                <SchoolyardSurvivorScreen onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MINI_GAME_DUNGEON && (
                <SchoolDungeonRPG onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MINI_GAME_DUNGEON_2 && (
                <SchoolDungeonRPG2 onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MINI_GAME_KOCHO && (
                <KochoShowdown onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MINI_GAME_PAPER_PLANE && (
                <PaperPlaneBattle onBack={returnToTitle} />
            )}
            
            {gameState.screen === GameScreen.MODE_SELECTION && (
                <div className="w-full h-full bg-gray-900 flex flex-col items-center text-white p-4 overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-2xl flex flex-col items-center my-auto">
                        <h2 className="text-3xl font-bold mb-2 text-yellow-400 mt-4">{trans("計算モード選択", languageMode)}</h2>
                        {gameState.challengeMode === '1A1D' && <p className="text-red-400 mb-6 font-bold animate-pulse">※{trans("1A1Dモード", languageMode)}</p>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <button onClick={() => handleModeSelect(GameMode.ADDITION)} className="bg-red-900 border-2 border-red-500 p-4 md:p-6 rounded-xl hover:bg-red-800 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <Plus size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">{trans("たし算", languageMode)}</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.SUBTRACTION)} className="bg-blue-900 border-2 border-blue-500 p-4 md:p-6 rounded-xl hover:bg-blue-800 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <Minus size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">{trans("ひき算", languageMode)}</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.MULTIPLICATION)} className="bg-green-900 border-2 border-green-500 p-4 md:p-6 rounded-xl hover:bg-green-800 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <MultiplyIcon size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">{trans("かけ算", languageMode)}</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.DIVISION)} className="bg-yellow-700 border-2 border-yellow-500 p-4 md:p-6 rounded-xl hover:bg-yellow-600 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <Divide size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">{trans("わり算", languageMode)}</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.MIXED)} className="bg-purple-900 border-2 border-purple-500 p-4 md:p-6 rounded-xl hover:bg-purple-800 flex flex-col items-center sm:col-span-2 transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <Shuffle size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">{trans("ミックス", languageMode)}</span>
                            </button>
                        </div>
                        <button onClick={returnToTitle} className="mt-8 text-gray-400 hover:text-white underline mb-8">{trans("戻る", languageMode)}</button>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.CHARACTER_SELECTION && (
                <CharacterSelectionScreen 
                    characters={CHARACTERS} 
                    unlockedCount={Math.min(CHARACTERS.length, clearCount + 2)} 
                    onSelect={handleCharacterSelect} 
                    challengeMode={gameState.challengeMode}
                    languageMode={languageMode}
                />
            )}

            {gameState.screen === GameScreen.RELIC_SELECTION && (
                <RelicSelectionScreen relics={starterRelics} onSelect={handleRelicSelect} languageMode={languageMode} />
            )}

            {gameState.screen === GameScreen.COMPENDIUM && (
                <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={returnToTitle} languageMode={languageMode} />
            )}

            {gameState.screen === GameScreen.RANKING && (
                <RankingScreen onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.HELP && (
                <HelpScreen onBack={returnToTitle} languageMode={languageMode} />
            )}

            {gameState.screen === GameScreen.MAP && (
                <MapScreen nodes={gameState.map} currentNodeId={gameState.currentMapNodeId} onNodeSelect={handleNodeSelect} player={gameState.player} languageMode={languageMode} />
            )}

            {gameState.screen === GameScreen.BATTLE && (
                <BattleScene 
                    player={gameState.player} enemies={gameState.enemies} selectedEnemyId={gameState.selectedEnemyId} onSelectEnemy={handleSelectEnemy} onPlayCard={handlePlayCard} onEndTurn={handleEndTurnClick} turnLog={turnLog} narrative={currentNarrative} lastActionTime={lastActionTime} lastActionType={lastActionType} actingEnemyId={actingEnemyId} selectionState={gameState.selectionState} onHandSelection={handleHandSelection}
                    onUsePotion={handleUsePotion} combatLog={gameState.combatLog} languageMode={languageMode} codexOptions={gameState.codexOptions} onCodexSelect={onCodexSelect} onPlaySynthesizedCard={handlePlaySynthesizedCard}
                />
            )}

            {gameState.screen === GameScreen.MATH_CHALLENGE && (
                <MathChallengeScreen 
                    mode={gameState.mode} 
                    onComplete={handleMathChallengeComplete} 
                    debugSkip={isMathDebugSkipped}
                />
            )}

            {gameState.screen === GameScreen.REWARD && (
                <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} currentPotions={gameState.player.potions} languageMode={languageMode} />
            )}

            {gameState.screen === GameScreen.REST && (
                <RestScreen 
                    player={gameState.player} 
                    onRest={handleRestAction} 
                    onUpgrade={handleUpgradeCard} 
                    onSynthesize={handleSynthesizeCard}
                    onLeave={handleNodeComplete} 
                    languageMode={languageMode}
                />
            )}

            {gameState.screen === GameScreen.SHOP && (
                <ShopScreen 
                    player={gameState.player}
                    shopCards={shopCards}
                    shopRelics={shopRelics}
                    shopPotions={shopPotions}
                    onBuyCard={(card) => {
                        let price = card.price || 50;
                        if (gameState.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - price, deck: [...prev.player.deck, { ...card, id: `buy-${Date.now()}` }], discardPile: [...prev.player.discardPile, { ...card, id: `buy-${Date.now()}` }] } }));
                        storageService.saveUnlockedCard(card.name);
                    }}
                    onBuyRelic={(relic) => {
                         let price = relic.price || 150;
                         if (gameState.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
                         setGameState(prev => {
                             const newP = { ...prev.player, gold: prev.player.gold - price, relics: [...prev.player.relics, relic] };
                             if (relic.id === 'SOZU') newP.maxEnergy += 1;
                             if (relic.id === 'CURSED_KEY') newP.maxEnergy += 1;
                             if (relic.id === 'PHILOSOPHER_STONE') newP.maxEnergy += 1;
                             if (relic.id === 'WAFFLE') { newP.maxHp += 7; newP.currentHp = newP.maxHp; }
                             if (relic.id === 'OLD_COIN') newP.gold += 300;
                             if (relic.id === 'MATRYOSHKA') newP.relicCounters['MATRYOSHKA'] = 2; // Init Counter
                             if (relic.id === 'HAPPY_FLOWER') newP.relicCounters['HAPPY_FLOWER'] = 0; // Init Counter
                             return { ...prev, player: newP };
                         });
                         storageService.saveUnlockedRelic(relic.id);
                    }}
                    onBuyPotion={(potion, replacePotionId) => {
                        if (gameState.player.potions.length < 3 || replacePotionId) {
                             let price = potion.price || 50;
                             if (gameState.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
                             setGameState(prev => {
                                 let newPotions = [...prev.player.potions];
                                 if (replacePotionId) {
                                     newPotions = newPotions.filter(pt => pt.id !== replacePotionId);
                                 }
                                 return { ...prev, player: { ...prev.player, gold: prev.player.gold - price, potions: [...newPotions, { ...potion, id: `buy-pot-${Date.now()}` }] } }
                             });
                             storageService.saveUnlockedPotion(potion.templateId);
                        }
                    }}
                    onRemoveCard={(cardId, cost) => {
                         setGameState(prev => {
                             const p = prev.player;
                             const card = p.deck.find(c => c.id === cardId);
                             let newMaxHp = p.maxHp;
                             if (card && (card.name === '寄生虫' || card.name === 'PARASITE')) {
                                 newMaxHp -= 3;
                             }
                             const newDeck = p.deck.filter(c => c.id !== cardId);
                             const newHp = Math.min(p.currentHp, newMaxHp); // Clamp HP
                             
                             return { ...prev, player: { ...p, gold: p.gold - cost, deck: newDeck, maxHp: newMaxHp, currentHp: newHp } };
                         });
                    }}
                    onLeave={handleNodeComplete}
                    languageMode={languageMode}
                />
            )}

            {gameState.screen === GameScreen.EVENT && eventData && (
                <EventScreen 
                    title={trans(eventData.title, languageMode)} 
                    description={trans(eventData.description, languageMode)} 
                    options={eventData.options.map((o: any) => ({ ...o, label: trans(o.label, languageMode), text: trans(o.text, languageMode) }))} 
                    resultLog={eventResultLog ? trans(eventResultLog, languageMode) : null}
                    onContinue={handleEventContinue}
                />
            )}

            {/* Treasure, Victory, GameOver, Ending Screens... (Same as before) */}
            {gameState.screen === GameScreen.TREASURE && (
                <TreasureScreen 
                    rewards={treasureRewards}
                    onOpen={() => {
                        const hasCursedKey = !!gameState.player.relics.find(r => r.id === 'CURSED_KEY');
                        setGameState(prev => {
                            const newP = { ...prev.player };
                            
                            // Grant Rewards
                            treasureRewards.forEach(r => {
                                if (r.type === 'GOLD') newP.gold += r.value;
                                if (r.type === 'RELIC') {
                                    newP.relics = [...newP.relics, r.value];
                                    storageService.saveUnlockedRelic(r.value.id);
                                    if (r.value.id === 'SOZU') newP.maxEnergy += 1;
                                    if (r.value.id === 'CURSED_KEY') newP.maxEnergy += 1;
                                    if (r.value.id === 'PHILOSOPHER_STONE') newP.maxEnergy += 1;
                                    if (r.value.id === 'WAFFLE') { newP.maxHp += 7; newP.currentHp = newP.maxHp; }
                                    if (r.value.id === 'OLD_COIN') newP.gold += 300;
                                    if (r.value.id === 'MATRYOSHKA') newP.relicCounters['MATRYOSHKA'] = 2; // Init Counter
                                    if (r.value.id === 'HAPPY_FLOWER') newP.relicCounters['HAPPY_FLOWER'] = 0; // Init Counter
                                }
                            });

                            // Cursed Key Effect
                            if (hasCursedKey) {
                                const curse = { ...CURSE_CARDS.PAIN, id: `curse-${Date.now()}` }; 
                                newP.deck = [...newP.deck, curse];
                                newP.discardPile = [...newP.discardPile, curse];
                            }
                            return { ...prev, player: newP };
                        });
                    }}
                    onLeave={handleNodeComplete}
                    hasCursedKey={!!gameState.player.relics.find(r => r.id === 'CURSED_KEY')}
                />
            )}

            {gameState.screen === GameScreen.VICTORY && (
                 <div className="w-full h-full bg-green-900 flex items-center justify-center text-center text-white p-4">
                    <div className="max-w-xs w-full bg-black/60 p-8 border-4 border-yellow-500 rounded-xl shadow-2xl animate-in zoom-in duration-300">
                        <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                        <h1 className="text-4xl mb-4 text-yellow-400 font-bold tracking-widest">{trans("勝利", languageMode)}！</h1>
                        <p className="text-gray-300 mb-8 font-bold leading-relaxed">放課後の試練を一つ乗り越えた。<br/>次はボーナステストだ！</p>
                        <button 
                            onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.MATH_CHALLENGE }))} 
                            className="bg-yellow-600 hover:bg-yellow-500 px-8 py-4 border-2 border-white font-bold animate-pulse cursor-pointer w-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95"
                        >
                            <Brain className="mr-2" /> テストを受ける
                        </button>
                    </div>
                 </div>
            )}

            {gameState.screen === GameScreen.GAME_OVER && (
                 <div className="w-full h-full bg-red-900 flex flex-col items-center justify-start text-center text-white p-4 overflow-y-auto custom-scrollbar">
                    <div className="my-auto w-full max-w-2xl py-8">
                        <h1 className="text-6xl mb-4 font-bold">宿題がふえた…</h1>
                        <p className="mb-8 text-2xl">Act {gameState.act} - Floor {gameState.floor}</p>
                        
                        {!legacyCardSelected ? (
                            <div className="mb-8 shrink-0">
                                <p className="mb-4 text-sm text-red-200 font-bold">次回の冒険に持っていくカードを1枚選んでください</p>
                                <div className="flex flex-wrap justify-center gap-2 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-black/30 rounded border border-red-700/50">
                                    {gameState.player.deck.map(card => (
                                        <div key={card.id} className="scale-75 cursor-pointer hover:scale-90 transition-transform" onClick={() => handleLegacyCardSelect(card)}>
                                            <Card card={card} onClick={() => handleLegacyCardSelect(card)} disabled={false} languageMode={languageMode}/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8 p-4 bg-black/50 border border-gray-500 rounded-lg animate-in zoom-in shrink-0">
                                <p className="text-gray-300 font-bold text-xl">遺志は継がれた...</p>
                                <p className="text-sm text-gray-500 mt-1">次の児童が拾うことになる。</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={handleRetry} className="bg-black border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-800 flex items-center justify-center"><RotateCcw className="mr-2" size={20} /> {trans("再挑戦", languageMode)}</button>
                            <button onClick={returnToTitle} className="bg-gray-700 border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-600 flex items-center justify-center"><Home className="mr-2" size={20} /> {trans("タイトルへ戻る", languageMode)}</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.ENDING && (
                 <div className="w-full h-full bg-yellow-900 flex flex-col items-center justify-start text-center text-white p-4 overflow-y-auto custom-scrollbar">
                    <div className="my-auto w-full max-w-2xl py-8">
                        <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-pulse shrink-0" />
                        <h1 className="text-4xl md:text-6xl mb-4 font-bold text-yellow-200 shrink-0">ゲームクリア！</h1>
                        <p className="mb-8 text-lg md:text-xl shrink-0">あなたは校長先生を説得し、<br/>伝説の小学生として語り継がれることでしょう。</p>
                        
                        {!legacyCardSelected ? (
                            <div className="mb-8 shrink-0">
                                <p className="mb-4 text-sm text-yellow-100 font-bold">次回の冒険に持っていくカードを1枚選んでください</p>
                                <div className="flex flex-wrap justify-center gap-2 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-black/30 rounded border border-yellow-700/50">
                                    {gameState.player.deck.map(card => (
                                        <div key={card.id} className="scale-75 cursor-pointer hover:scale-90 transition-transform" onClick={() => handleLegacyCardSelect(card)}>
                                            <Card card={card} onClick={() => handleLegacyCardSelect(card)} disabled={false} languageMode={languageMode}/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8 p-4 bg-green-900/50 border border-green-500 rounded-lg animate-in zoom-in shrink-0">
                                <p className="text-green-400 font-bold text-xl">カードを継承しました！</p>
                                <p className="text-sm text-green-200 mt-1">次の冒険の初期デッキに追加されます。</p>
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-4 items-center mt-4 pb-8 shrink-0">
                            <button onClick={startEndlessMode} className="bg-purple-900 border-4 border-purple-500 px-8 py-4 cursor-pointer text-xl hover:bg-purple-800 font-bold w-full max-w-sm shadow-[0_0_20px_rgba(168,85,247,0.5)] transform transition-transform hover:scale-105 active:scale-95 flex items-center justify-center animate-pulse">
                                <Infinity className="mr-2" /> エンドレスモードへ (Act {gameState.act + 1})
                            </button>
                            <button onClick={returnToTitle} className="bg-blue-600 border-2 border-white px-8 py-4 cursor-pointer text-xl hover:bg-blue-500 font-bold w-full max-w-sm shadow-lg transform transition-transform hover:scale-105 active:scale-95">
                                伝説となる ({trans("タイトルへ戻る", languageMode)})
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default App;