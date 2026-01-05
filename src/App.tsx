
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, GameScreen, Enemy, Card as ICard, 
  CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion, Player, EnemyIntent, Character, FloatingText, RankingEntry, GameMode, LanguageMode, VisualEffectInstance, GardenSlot
} from './types';
import { 
  INITIAL_HP, INITIAL_ENERGY, HAND_SIZE, 
  CARDS_LIBRARY, STARTING_DECK_TEMPLATE, STATUS_CARDS, CURSE_CARDS, EVENT_CARDS, RELIC_LIBRARY, TRUE_BOSS, POTION_LIBRARY, CHARACTERS, HERO_IMAGE_DATA, ENEMY_LIBRARY, LIBRARIAN_CARDS, GROWN_PLANTS, GARDEN_SEEDS
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
import KanjiChallengeScreen from './components/KanjiChallengeScreen';
import EnglishChallengeScreen from './components/EnglishChallengeScreen';
import DebugMenuScreen from './components/DebugMenuScreen';
import PokerGameScreen from './components/PokerGameScreen';
import SchoolyardSurvivorScreen from './components/SchoolyardSurvivorScreen';
import SchoolDungeonRPG from './components/SchoolDungeonRPG'; 
import SchoolDungeonRPG2 from './components/SchoolDungeonRPG2'; 
import KochoShowdown from './components/KochoShowdown'; 
import PaperPlaneBattle from './components/PaperPlaneBattle';
import MiniGameSelectScreen from './components/MiniGameSelectScreen';
import DodgeballShooting from './components/DodgeballShooting';
import FinalBridgeScreen from './components/FinalBridgeScreen';
import ProblemChallengeScreen from './components/ProblemChallengeScreen';
import ChefDeckSelectionScreen from './components/ChefDeckSelectionScreen';
import GardenScreen from './components/GardenScreen';
import Card from './components/Card';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { generateEvent } from './services/eventService';
import { getUpgradedCard, synthesizeCards } from './utils/cardUtils';
import { trans } from './utils/textUtils';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle, Send, Swords, Terminal, Club, Zap, Gamepad2, Brain, Languages, Music, Book, MessageSquare, GraduationCap } from 'lucide-react';

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
            if (localTurn === 0) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 3 : 3 };
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
             if (enemy.phase === 1) {
                 const heartTurn = turn % 3;
                 if (heartTurn === 1) return { type: EnemyIntentType.ATTACK, value: 45 }; 
                 if (heartTurn === 2) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 2 }; 
                 return { type: EnemyIntentType.ATTACK_DEBUFF, value: 2, secondaryValue: 12, debuffType: 'VULNERABLE' }; 
             } else {
                 const heartTurn = turn % 4;
                 if (heartTurn === 1) return { type: EnemyIntentType.ATTACK, value: 12, secondaryValue: 15, debuffType: 'CONFUSED' }; 
                 if (heartTurn === 2) return { type: EnemyIntentType.ATTACK, value: 60 }; 
                 if (heartTurn === 3) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 5 }; 
                 return { type: EnemyIntentType.ATTACK_DEBUFF, value: 10, secondaryValue: 3, debuffType: 'WEAK' };
             }

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
    parryState: { active: false, enemyId: null, success: false },
    activeEffects: []
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
  const [bgmMode, setBgmMode] = useState<'OSCILLATOR' | 'MP3' | 'STUDY'>(() => {
    const saved = storageService.getBgmMode() as 'OSCILLATOR' | 'MP3' | 'STUDY' | null;
    return saved || 'STUDY';
  });
  const [totalMathCorrect, setTotalMathCorrect] = useState<number>(0);
  const [nextThreshold, setNextThreshold] = useState<number | null>(null);
  
  const [isMathDebugSkipped, setIsMathDebugSkipped] = useState<boolean>(false);
  const [isDebugHpOne, setIsDebugHpOne] = useState<boolean>(false);
  const [titleClickCount, setTitleClickCount] = useState<number>(0);
  const [logClickCount, setLogClickCount] = useState<number>(0);
  const [debugLoadout, setDebugLoadout] = useState<{deck: ICard[], relics: Relic[], potions: Potion[]} | null>(null);

  const [shopCards, setShopCards] = useState<ICard[]>([]);
  const [shopRelics, setShopRelics] = useState<Relic[]>([]);
  const [shopPotions, setShopPotions] = useState<Potion[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [eventResultLog, setEventResultLog] = useState<string | null>(null); 
  const [unlockedCardNames, setUnlockedCardNames] = useState<string[]>([]);
  const [starterRelics, setStarterRelics] = useState<Relic[]>([]);
  const [treasureRewards, setTreasureRewards] = useState<RewardItem[]>([]);
  
  const [clearCount, setClearCount] = useState<number>(0);

  const VICTORY_GOLD = 25;
  
  const UNLOCK_THRESHOLDS = [1000, 1500, 2000, 2500, 3000, 3500];

  useEffect(() => {
      // 重要な遷移時やプレイ中にオートセーブを実行
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
          gameState.screen !== GameScreen.PROBLEM_CHALLENGE
      ) {
          storageService.saveGame(gameState);
      }
      
      // タイトル画面の時、セーブデータの有無を再チェック
      if (gameState.screen === GameScreen.START_MENU) {
          setHasSave(storageService.hasSaveFile());
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
    
    // Sync loaded BGM mode with service
    audioService.setBgmMode(bgmMode);

    if (gameState.screen === GameScreen.START_MENU) {
        audioService.init();
        audioService.playBGM('menu');
    }
  }, []);

  useEffect(() => {
    const next = UNLOCK_THRESHOLDS.find(t => t > totalMathCorrect);
    setNextThreshold(next || null);
  }, [totalMathCorrect]);

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
      let nextMode: 'OSCILLATOR' | 'MP3' | 'STUDY';
      if (bgmMode === 'STUDY') nextMode = 'MP3';
      else if (bgmMode === 'MP3') nextMode = 'OSCILLATOR';
      else nextMode = 'STUDY';
      
      setBgmMode(nextMode);
      audioService.setBgmMode(nextMode);
      storageService.saveBgmMode(nextMode); // Save to local storage
      audioService.playSound('select');
  };

  const returnToTitle = () => {
      setShopCards([]);
      setEventData(null);
      setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU, challengeMode: undefined }));
      setHasSave(storageService.hasSaveFile()); // タイトルに戻る際にセーブ確認
      audioService.playBGM('menu'); 
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
          // 画面に応じたBGMの復帰
          if (saved.screen === GameScreen.BATTLE) {
              audioService.playBGM('battle');
          } else if (saved.screen === GameScreen.MAP) {
              audioService.playBGM('map');
          } else if (saved.screen === GameScreen.SHOP) {
              audioService.playBGM('shop');
          } else {
              audioService.playBGM('map');
          }
          addLog("冒険を再開した。", "blue");
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

  const startProblemChallenge = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      audioService.playSound('select');
      setGameState(prev => ({ 
          ...prev, 
          screen: GameScreen.PROBLEM_CHALLENGE,
          challengeMode: undefined 
      }));
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
          player: {
              ...prev.player,
              currentHp: prev.player.maxHp
          },
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
            selectionState: { active: false, type: 'DISCARD', amount: 0 },
            activeEffects: []
        }));
        audioService.playBGM('map');
  };

  const handleDebugStartAct3Boss = async (deck: ICard[], relics: Relic[], potions: Potion[]) => {
      const map = generateDungeonMap();
      setDebugLoadout({ deck, relics, potions });

      const bossNode = map.find(n => n.type === NodeType.BOSS);
      if (!bossNode) return;

      // 1. 基本的な初期ステートを作成 (Act 3, Floor 15)
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
      };

      // 2. ボスエンティティの生成
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
          floatingText: null
      };
      bossEnemy.nextIntent = getNextEnemyIntent(bossEnemy, 1);

      // 3. 山札と手札の初期化
      playerBase.drawPile = shuffle(playerBase.deck.map(c => ({ ...c })));
      for(let i=0; i<HAND_SIZE; i++) {
          const drawn = playerBase.drawPile.pop();
          if(drawn) playerBase.hand.push(drawn);
      }

      // 4. ステートを一括更新 (直接BATTLE画面へ)
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
          activeEffects: []
      };

      setGameState(combatState);
      audioService.playBGM('boss');
      setTurnLog(trans("あなたのターン", languageMode));
  };

  const handleCharacterSelect = (char: Character) => {
      audioService.playSound('select');
      setSelectedCharName(char.name);
      
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

      // NEW: Unlock starting deck in compendium
      const startingCardNames = initialDeck.map(c => c.name);
      storageService.saveUnlockedCards(startingCardNames);

      const legacyCard = storageService.getLegacyCard();
      if (legacyCard) {
          initialDeck.push({ ...legacyCard, id: `legacy-${Date.now()}` });
          storageService.clearLegacyCard();
      }

      const starterRelic = RELIC_LIBRARY[char.startingRelicId];
      const relics = starterRelic ? [starterRelic] : [];

      const commonRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON');
      const bonusOptions = shuffle(commonRelics).slice(0, 3);
      setStarterRelics(bonusOptions);

      // --- Gardener System Init ---
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
          garden: garden // Set garden array
      };

      // 特殊処理: 給食当番リーダー (CHEF) はデッキ構築画面へ
      if (char.id === 'CHEF' && gameState.challengeMode !== '1A1D') {
        setGameState(prev => ({
            ...prev,
            screen: GameScreen.DECK_CONSTRUCTION,
            act: 1, // BUG FIX: Reset progression state
            floor: 0,
            turn: 0,
            map: [],
            currentMapNodeId: null,
            combatLog: [],
            player: { ...initialPlayerState, deck: [] }, // デッキなしで開始
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
          
          setGameState(prev => ({
              ...prev,
              screen: GameScreen.EVENT,
              act: 1, // Ensure reset
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
      // NEW: Unlock selected cards in compendium
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

            if (gameState.act === 4 && node.type === NodeType.BOSS) {
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
                    // 図鑑に登録
                    storageService.saveDefeatedEnemy(e.name);
                    return { ...e, enemyType: type, nextIntent: getNextEnemyIntent({ ...e, enemyType: type }, 1) };
                });
            }

            const flavor = await generateFlavorText(node.type === NodeType.BOSS ? "ボスが現れた！" : "敵と遭遇した。");
            
            const p = { ...nextState.player };
            p.drawPile = shuffle(p.deck.map(c => ({ ...c })));
            p.hand = [];
            p.discardPile = [];
            p.currentEnergy = p.maxEnergy;
            p.block = 0;
            p.strength = 0;
            p.powers = {}; 
            p.relicCounters = { ...p.relicCounters }; 
            
            if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) {
                p.relicCounters['HAPPY_FLOWER'] = 0;
            }

            p.turnFlags = {};
            p.typesPlayedThisTurn = [];
            p.echoes = 0;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;

            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            if (p.relics.find(r => r.id === 'HACHIMAKI')) p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1;
            if (p.relics.find(r => r.id === 'SEED_PACK')) p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
            if (p.relics.find(r => r.id === 'HOLY_WATER')) p.currentEnergy += 1; 
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'LANTERN')) p.currentEnergy += 1;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (p.relics.find(r => r.id === 'BIG_LADLE')) p.currentHp = Math.min(p.maxHp, p.currentHp + 4);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
            
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
                const drawn = p.drawPile.pop();
                if(drawn) p.hand.push(drawn);
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
                setTurnLog(trans("あなたのターン", languageMode));
            }

        } else if (node.type === NodeType.REST) {
            setGameState(prev => {
                const p = { ...prev.player };
                if (p.relics.find(r => r.id === 'LUXURY_FUTON')) {
                    const heal = Math.floor(p.currentHp / 5) * 2; // BUG FIXED: typo from p.deck
                    if (heal > 0) {
                        p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                    }
                }
                if (p.relics.find(r => r.id === 'ANCIENT_TEA_SET')) {
                    p.relicCounters['ANCIENT_TEA_SET_ACTIVE'] = 1;
                }
                return { ...nextState, player: p, screen: GameScreen.REST };
            });
            audioService.playBGM('rest');

        } else if (node.type === NodeType.SHOP) {
            const isLibrarian = nextState.player.id === 'LIBRARIAN';
            const isGardener = nextState.player.id === 'GARDENER';
            
            const shopCandidates = Object.values(CARDS_LIBRARY).filter(c => {
                if (c.type === CardType.STATUS || c.type === CardType.CURSE) return false;
                
                // 種カードは園芸委員のみ
                if (c.isSeed && !isGardener) return false;
                
                // 特定職のSPECIALカード（図書委員用物語、園芸用種）の制限
                const isLibrarianCard = Object.values(LIBRARIAN_CARDS).some(lc => lc.name === c.name);
                if (c.rarity === 'SPECIAL') {
                    if (isLibrarian && isLibrarianCard) return true;
                    if (isGardener && c.isSeed) return true;
                    return false;
                }
                
                return true;
            });

            const cards: ICard[] = [];
            for(let i=0; i<5; i++) {
                if (shopCandidates.length === 0) break;
                // Gardener specific: boost seeds in shop
                let candidatePool = shopCandidates;
                if (isGardener && i < 2) candidatePool = Object.values(GARDEN_SEEDS);
                
                const cTemplate = candidatePool[Math.floor(Math.random() * candidatePool.length)] || shopCandidates[Math.floor(Math.random() * shopCandidates.length)];
                const c = { ...cTemplate };
                
                let price = 40 + Math.floor(Math.random() * 60);
                if (c.rarity === 'UNCOMMON') price += 25;
                if (c.rarity === 'RARE') price += 50;
                if (c.rarity === 'LEGENDARY') price += 100;
                if (c.rarity === 'SPECIAL') price += 30; // Librarian special cards
                
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
          setTurnLog(trans("あなたのターン", languageMode));
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
          const nextActiveEffects: VisualEffectInstance[] = [];
          
          p.potions = p.potions.filter(pt => pt.id !== potion.id);
          const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];

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
              nextActiveEffects.push({ id: `vfx-pot-buff-${Date.now()}`, type: 'BUFF', targetId: 'player' });
          } else if (potion.templateId === 'ENERGY_POTION') {
              p.currentEnergy += 2;
              newLogs.push(`${trans("エネルギー", languageMode)}+2`);
              nextActiveEffects.push({ id: `vfx-pot-zap-${Date.now()}`, type: 'BUFF', targetId: 'player' });
          } else if (potion.templateId === 'WEAK_POTION' && target) {
              applyDebuff(target, 'WEAK', 3);
              newLogs.push(`${trans(target.name, languageMode)}に${trans("へろへろ", languageMode)}3を${trans("付与", languageMode)}`);
              nextActiveEffects.push({ id: `vfx-pot-dbuff-${Date.now()}`, type: 'DEBUFF', targetId: target.id });
          } else if (potion.templateId === 'POISON_POTION' && target) {
              applyDebuff(target, 'POISON', 6);
              newLogs.push(`${trans(target.name, languageMode)}に${trans("ドクドク", languageMode)}6を${trans("付与", languageMode)}`);
              nextActiveEffects.push({ id: `vfx-pot-psn-${Date.now()}`, type: 'DEBUFF', targetId: target.id });
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
          } else if (potion.templateId === 'GAMBLE') {
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
          return { ...prev, player: p, enemies: remainingEnemies, combatLog: [...prev.combatLog, ...newLogs].slice(-100), activeEffects: [...prev.activeEffects, ...nextActiveEffects] };
      });
  };

  const handlePlayCard = (card: ICard) => {
    let effectiveCost = card.cost;
    if (gameState.player.powers['CORRUPTION'] && card.type === CardType.SKILL) {
        effectiveCost = 0;
    }

    if (gameState.player.currentEnergy < effectiveCost && !gameState.player.partner) return; 
    if (gameState.enemies.length === 0) return;
    if (actingEnemyId) return; 
    if (gameState.selectionState.active) return;
    if (card.unplayable) return; 

    const hasNormality = gameState.player.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY');
    if (hasNormality && gameState.player.attacksPlayedThisTurn + (gameState.player.cardsPlayedThisTurn - gameState.player.attacksPlayedThisTurn) >= 3) {
         audioService.playSound('wrong'); 
         return; 
    }

    audioService.playSound(card.type === CardType.ATTACK ? 'attack' : 'block');
    setLastActionType(card.type);
    setLastActionTime(Date.now());

    setGameState(prev => {
      const p = { ...prev.player, hand: [...prev.player.hand], drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile], deck: [...prev.player.deck], powers: { ...prev.player.powers } };
      let enemies = prev.enemies.map(e => ({ ...e }));
      const currentLogs: string[] = [`> ${trans(card.name, languageMode)} ${trans("を使用", languageMode)}`];
      const nextActiveEffects: VisualEffectInstance[] = [];
      let nextSelectionState = { ...prev.selectionState };

      // 学習アルゴリズム処理の統合
      if (card.name === '学習アルゴリズム' || card.name === 'GENETIC_ALGORITHM') {
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
      p.cardsPlayedThisTurn++;
      
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
              
              if (p.powers['WEAK'] > 0) { p.powers['WEAK'] = 0; currentLogs.push(trans("へろろから解除！", languageMode)); }
              if (p.powers['VULNERABLE'] > 0) { p.powers['VULNERABLE'] = 0; currentLogs.push(trans("びくびく解除！", languageMode)); }
              if (p.powers['FRAIL'] > 0) { p.powers['FRAIL'] = 0; currentLogs.push(trans("もろい解除！", languageMode)); } 
              
              p.typesPlayedThisTurn = []; 
              p.floatingText = { id: `pellets-${Date.now()}`, text: 'デバフ解除', color: 'text-white', iconType: 'shield' };
              nextActiveEffects.push({ id: `vfx-pellets-${Date.now()}`, type: 'BUFF', targetId: 'player' });
          }
      }

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
          nextActiveEffects.push({ id: `vfx-disc-${Date.now()}`, type: 'BUFF', targetId: 'player' });
      }

      if (card.name === '山勘' || card.name === 'CALCULATED_GAMBLE') {
          const cardsToDiscard = p.hand.filter(c => c.id !== card.id);
          const count = cardsToDiscard.length;
          
          cardsToDiscard.forEach(c => {
              p.discardPile.push(c);
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
                  if (newCard.name === '虚無' || newCard.name === 'VOID') {
                      p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                      p.floatingText = { id: `void-${Date.now()}`, text: '-1 Energy', color: 'text-red-500', iconType: 'zap' };
                  }
                  p.hand.push(newCard);
              }
          }
          currentLogs.push(`${trans("手札を交換", languageMode)} (${count})`);
          nextActiveEffects.push({ id: `vfx-gamble-${Date.now()}`, type: 'BUFF', targetId: 'player' });
      }

      if (p.powers['AFTER_IMAGE']) {
          p.block += p.powers['AFTER_IMAGE'];
          nextActiveEffects.push({ id: `vfx-after-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
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

                    let multiplier = 1;
                    if (act === 0 && h === 0 && card.type === CardType.ATTACK && p.relics.find(r => r.id === 'PEN_NIB')) {
                        p.relicCounters['PEN_NIB'] = (p.relicCounters['PEN_NIB'] || 0) + 1;
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
                    
                    // VFX TRIGGER
                    nextActiveEffects.push({ id: `vfx-${Date.now()}-${Math.random()}`, type: 'SLASH', targetId: e.id });

                    if (e.currentHp <= 0 && e.enemyType === 'THE_HEART' && e.phase === 1) {
                         e.currentHp = e.maxHp; 
                         e.phase = 2; 
                         e.name = "真・校長先生"; 
                         e.vulnerable = 0; e.weak = 0; e.poison = 0; 
                         e.floatingText = { id: `phase-evo-${Date.now()}`, text: '本気モード！', color: 'text-yellow-500' };
                         currentLogs.push("校長先生が真の姿を現した！");
                         nextActiveEffects.push({ id: `vfx-evo-${Date.now()}`, type: 'BUFF', targetId: e.id });
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
                        nextActiveEffects.push({ id: `vfx-heal-ls-${Date.now()}`, type: 'HEAL', targetId: 'player' });
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
                                 if (other.id !== e.id && other.currentHp > 0) {
                                     other.currentHp -= e.maxHp; 
                                     other.floatingText = { id: `expl-${Date.now()}`, text: `${e.maxHp}`, color: 'text-green-400' };
                                     currentLogs.push(`${trans("衝撃のうわさ", languageMode)}: ${trans(other.name, languageMode)}に${e.maxHp}${trans("ダメージ", languageMode)}`);
                                     nextActiveEffects.push({ id: `vfx-expl-${Date.now()}-${other.id}`, type: 'FIRE', targetId: other.id });
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
                             nextActiveEffects.push({ id: `vfx-cap-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                         }
                    }

                    // --- 時間どろぼう効果の実装 ---
                    if (card.name === '時間どろぼう' || card.name === 'TIME_THIEF') {
                        e.nextIntent = { type: EnemyIntentType.SLEEP, value: 0 };
                        currentLogs.push(`${trans(e.name, languageMode)}の行動を遅らせた！`);
                        e.floatingText = { id: `delay-${Date.now()}`, text: '遅延', color: 'text-blue-400' };
                        nextActiveEffects.push({ id: `vfx-delay-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id });
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
                  nextActiveEffects.push({ id: `vfx-blk-${Date.now()}`, type: 'BLOCK', targetId: 'player' });

                  const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                  if (h < hitsToLog) {
                      currentLogs.push(`${trans("ブロック", languageMode)}${formula}${blk}を${trans("獲得", languageMode)}`);
                  }
              }
              if (card.doubleBlock) {
                  p.block *= 2;
                  nextActiveEffects.push({ id: `vfx-dblblk-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
              }
              if (card.heal) {
                  p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
                  nextActiveEffects.push({ id: `vfx-heal-${Date.now()}`, type: 'HEAL', targetId: 'player' });
              }
              if (card.energy) p.currentEnergy += card.energy;
              if (card.selfDamage) { 
                  p.currentHp -= card.selfDamage; 
                  currentLogs.push(`${trans("自分に", languageMode)}${card.selfDamage}${trans("ダメージ", languageMode)}`);
                  if (p.powers['RUPTURE']) {
                      p.strength += p.powers['RUPTURE']; 
                      nextActiveEffects.push({ id: `vfx-rup-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                  }
                  nextActiveEffects.push({ id: `vfx-sd-${Date.now()}`, type: 'SLASH', targetId: 'player' });
              }
              if (card.strength) {
                  p.strength += card.strength;
                  nextActiveEffects.push({ id: `vfx-buff-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                  currentLogs.push(`${trans("ムキムキ", languageMode)}+${card.strength}`);
              }
              if (card.vulnerable) targets.forEach(e => {
                  applyDebuff(e, 'VULNERABLE', card.vulnerable!);
                  nextActiveEffects.push({ id: `vfx-dbuff-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id });
              });
              if (card.weak) targets.forEach(e => {
                  applyDebuff(e, 'WEAK', card.weak!);
                  nextActiveEffects.push({ id: `vfx-dbuff-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id });
              });
              if (card.poison) {
                  let amt = card.poison;
                  if (p.relics.find(r => r.id === 'SNAKE_SKULL')) amt += 1; 
                  targets.forEach(e => {
                      applyDebuff(e, 'POISON', amt);
                      nextActiveEffects.push({ id: `vfx-dbuff-p-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id });
                  });
                  if (h < hitsToLog) currentLogs.push(`${trans("ドクドク", languageMode)}${amt}${trans("を付与", languageMode)}`);
              }
              
              if (card.poisonMultiplier && targets.length > 0) {
                  targets.forEach(e => {
                      if (e.poison > 0) {
                          e.poison *= card.poisonMultiplier!;
                          currentLogs.push(`${trans(e.name, languageMode)}の${trans("毒", languageMode)}が${card.poisonMultiplier}倍になった！`);
                          nextActiveEffects.push({ id: `vfx-dbuff-pm-${Date.now()}-${e.id}`, type: 'DEBUFF', targetId: e.id });
                      }
                  });
              }
              
              if (card.upgradeHand) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  currentLogs.push(trans("手札を強化", languageMode));
                  nextActiveEffects.push({ id: `vfx-uh-${Date.now()}`, type: 'BUFF', targetId: 'player' });
              }
              if (card.upgradeDeck) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  p.drawPile = p.drawPile.map(c => getUpgradedCard(c));
                  p.discardPile = p.discardPile.map(c => getUpgradedCard(c));
                  currentLogs.push(trans("デッキ全体を強化", languageMode));
                  nextActiveEffects.push({ id: `vfx-ud-${Date.now()}`, type: 'BUFF', targetId: 'player' });
              }
              if (card.doubleStrength) {
                  p.strength *= 2;
                  nextActiveEffects.push({ id: `vfx-ds-${Date.now()}`, type: 'BUFF', targetId: 'player' });
              }
              if (card.shuffleHandToDraw) { p.drawPile = shuffle([...p.drawPile, ...p.hand]); p.hand = []; }
              if (card.applyPower) {
                  p.powers[card.applyPower.id] = (p.powers[card.applyPower.id] || 0) + card.applyPower.amount;
                  if (card.applyPower.id === 'CORPSE_EXPLOSION' && targets.length > 0) {
                      targets.forEach(e => e.corpseExplosion = true);
                      currentLogs.push(trans("衝撃のうわさを付与", languageMode));
                      nextActiveEffects.push({ id: `vfx-ce-${Date.now()}`, type: 'DEBUFF', targetId: targets[0].id });
                  }
                  nextActiveEffects.push({ id: `vfx-ap-${Date.now()}`, type: 'BUFF', targetId: 'player' });
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
                      if (newCard.name === '虚無' || newCard.name === 'VOID') {
                          p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                          p.floatingText = { id: `void-draw-${Date.now()}-${j}`, text: '-1 Energy', color: 'text-red-500', iconType: 'zap' };
                      }
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
                          if (p.hand.length < HAND_SIZE + 5) {
                              p.hand.push(newC);
                          } else {
                              p.discardPile.push(newC);
                          }
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

              if (card.name === '早退' || card.name === 'EXPULSION') {
                  const threshold = card.upgraded ? 40 : 30;
                  targets.forEach(e => {
                      if (e.currentHp <= threshold) {
                          e.currentHp = 0;
                          currentLogs.push(`${trans(e.name, languageMode)}は${trans("早退", languageMode)}になった！`);
                          e.floatingText = { id: `kill-${Date.now()}`, text: '早退!', color: 'text-red-600', iconType: 'skull' };
                          nextActiveEffects.push({ id: `vfx-exp-${Date.now()}`, type: 'SLASH', targetId: e.id });
                      } else {
                          currentLogs.push(`${trans(e.name, languageMode)}は${trans("早退", languageMode)}を免れた`);
                      }
                  });
              }
          }
      }

      if (card.type === CardType.ATTACK) {
          p.relicCounters['ATTACK_COUNT'] = (p.relicCounters['ATTACK_COUNT'] || 0) + 1;
          if (p.relicCounters['ATTACK_COUNT'] % 3 === 0) {
              if (p.relics.find(r => r.id === 'KUNAI')) { p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1; p.floatingText = { id: `kunai-${Date.now()}`, text: `${trans("カチカチ", languageMode)}+1`, color: 'text-blue-400', iconType: 'shield' }; nextActiveEffects.push({ id: `vfx-kunai-${Date.now()}`, type: 'BLOCK', targetId: 'player' }); }
              if (p.relics.find(r => r.id === 'SHURIKEN')) { p.strength += 1; p.floatingText = { id: `shuri-${Date.now()}`, text: `${trans("ムキムキ", languageMode)}+1`, color: 'text-red-400', iconType: 'sword' }; nextActiveEffects.push({ id: `vfx-shuri-${Date.now()}`, type: 'BUFF', targetId: 'player' }); }
              if (p.relics.find(r => r.id === 'ORNAMENTAL_FAN')) { p.block += 4; p.floatingText = { id: `fan-${Date.now()}`, text: '+4 Block', color: 'text-blue-400', iconType: 'shield' }; nextActiveEffects.push({ id: `vfx-fan-${Date.now()}`, type: 'BLOCK', targetId: 'player' }); }
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
    
          if (card.name === 'むしゃくしゃ' || card.name === 'YATSUATARI') {
              card.damage = (card.damage || 0) + 5;
              currentLogs.push("むしゃくしゃの怒りが増した！");
              nextActiveEffects.push({ id: `vfx-yatsu-${Date.now()}`, type: 'FIRE', targetId: 'player' });
          }
    
          if (!shouldExhaust && !(card.type === CardType.POWER) && !(card.promptsExhaust === 99)) {
              p.discardPile.push(card);
          } else if (shouldExhaust || card.promptsExhaust === 99) {
              if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
          }
    
          if (card.promptsDiscard) nextSelectionState = { active: true, type: 'DISCARD', amount: card.promptsDiscard, originCardId: card.id };
          if (card.promptsCopy) nextSelectionState = { active: true, type: 'COPY', amount: card.promptsCopy, originCardId: card.id };
          if (card.promptsExhaust === 99) {
              if (card.name === '魂の切断' || card.name === 'SEVER_SOUL') {
                  const cardsToExhaust = p.hand.filter(c => c.type !== CardType.ATTACK);
                  if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
                  p.hand = p.hand.filter(c => c.type === CardType.ATTACK);
              } else if (card.name === '鬼火' || card.name === 'FIEND_FIRE') {
                   if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * p.hand.length;
                   p.hand = [];
              }
          }
      }

      let nextSelectedId = prev.selectedEnemyId;
      const aliveEnemies = enemies.filter(e => e.currentHp > 0);
      if (!aliveEnemies.find(e => e.id === nextSelectedId) && aliveEnemies.length > 0) nextSelectedId = aliveEnemies[0].id;

      return { 
        ...prev, 
        player: p, 
        enemies: aliveEnemies, 
        selectedEnemyId: nextSelectedId, 
        selectionState: nextSelectionState, 
        combatLog: [...prev.combatLog, ...currentLogs].slice(-100),
        activeEffects: [...prev.activeEffects, ...nextActiveEffects]
      };
    });
    
    // Clear effects after duration
    setTimeout(() => {
        setGameState(prev => ({ ...prev, activeEffects: [] }));
    }, 600);
  };

  const startPlayerTurn = () => {
    setTurnLog(trans("あなたのターン", languageMode));
    setGameState(prev => {
      const p = { ...prev.player };
      const nextActiveEffects: VisualEffectInstance[] = [];
      
      let extraEnergy = 0; 

      if (p.powers['DEMON_FORM']) { 
          p.strength += p.powers['DEMON_FORM']; 
          p.floatingText = { id: `pow-demon-${Date.now()}`, text: '反抗期', color: 'text-red-500' }; 
          nextActiveEffects.push({ id: `vfx-demon-${Date.now()}`, type: 'BUFF', targetId: 'player' });
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
      p.currentEnergy = baseEnergy; // BUG FIX: Set current energy before draw loop to avoid overwriting energy loss from Void
      p.nextTurnEnergy = 0;

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
          if (newDiscardPile === undefined || newDiscardPile.length === 0) break;
          newDrawPile = shuffle(newDiscardPile);
          newDiscardPile = [];
        }
        const card = newDrawPile.pop();
        if (card) {
            if (card.name === '虚無' || card.name === 'VOID') {
                p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                p.floatingText = { id: `void-turn-${Date.now()}-${i}`, text: '-1 Energy', color: 'text-red-500', iconType: 'zap' };
            }
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

      if (p.powers['CREATIVE_AI']) {
          const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
          const power = powers[Math.floor(Math.random() * powers.length)];
          newHand.push({ ...power, id: `ai-${Date.now()}`, cost: 0 });
          nextActiveEffects.push({ id: `vfx-ai-${Date.now()}`, type: 'BUFF', targetId: 'player' });
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
              nextActiveEffects.push({ id: `vfx-tongs-${Date.now()}`, type: 'BUFF', targetId: 'player' });
          }
      }

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

      return { ...prev, player: p, selectionState: nextSelection, turn: prev.turn + 1, activeEffects: [...prev.activeEffects, ...nextActiveEffects] };
    });

    setTimeout(() => {
        setGameState(prev => ({ ...prev, activeEffects: [] }));
    }, 600);
  };

  const handleParryClick = () => {
      setGameState(prev => ({
          ...prev,
          parryState: { ...prev.parryState!, success: true }
      }));
      audioService.playSound('block');
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

    await wait(500);

    const enemies = [...gameState.enemies];
    for (const enemy of enemies) {
        if (gameState.player.currentHp <= 0) break;
        
        if (enemy.poison > 0) {
            const poisonDmg = enemy.poison;
            enemy.currentHp -= poisonDmg;
            enemy.poison--;
            
            const floatText: FloatingText = { id: `psn-${Date.now()}-${enemy.id}`, text: `${poisonDmg}`, color: 'text-green-500', iconType: 'poison' };
            const logMsg = `${trans(enemy.name, languageMode)}に毒ダメージ${poisonDmg}`;

            if (enemy.currentHp <= 0 && enemy.enemyType === 'THE_HEART' && enemy.phase === 1) {
                enemy.currentHp = enemy.maxHp;
                enemy.phase = 2;
                enemy.name = "真・校長先生";
                enemy.poison = 0; enemy.weak = 0; enemy.vulnerable = 0;
                setGameState(prev => ({ 
                    ...prev, 
                    enemies: prev.enemies.map(e => e.id === enemy.id ? { ...enemy, floatingText: { id: `phase-evo-${Date.now()}`, text: '本気モード！', color: 'text-yellow-500' } } : e),
                    combatLog: [...prev.combatLog, logMsg, "校長先生が真の姿を現した！"].slice(-100),
                    activeEffects: [...prev.activeEffects, { id: `vfx-psn-${Date.now()}`, type: 'FIRE', targetId: enemy.id }]
                }));
            } else if (enemy.currentHp <= 0) {
                setGameState(prev => ({ 
                    ...prev, 
                    enemies: prev.enemies.filter(e => e.id !== enemy.id),
                    combatLog: [...prev.combatLog, logMsg, `${trans(enemy.name, languageMode)}は力尽きた！`].slice(-100),
                    activeEffects: [...prev.activeEffects, { id: `vfx-psn-${Date.now()}`, type: 'FIRE', targetId: enemy.id }]
                }));
                continue;
            } else {
                setGameState(prev => ({ 
                    ...prev, 
                    enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, currentHp: enemy.currentHp, poison: enemy.poison, floatingText: floatText } : e),
                    combatLog: [...prev.combatLog, logMsg].slice(-100),
                    activeEffects: [...prev.activeEffects, { id: `vfx-psn-${Date.now()}`, type: 'FIRE', targetId: enemy.id }]
                }));
            }
            await wait(300);
            setGameState(prev => ({ ...prev, activeEffects: [] }));
        }

        setActingEnemyId(enemy.id);
        
        const isBard = gameState.player.id === 'BARD';
        const isAttackIntent =
          enemy.nextIntent.type === EnemyIntentType.ATTACK ||
          enemy.nextIntent.type === EnemyIntentType.ATTACK_DEBUFF ||
          enemy.nextIntent.type === EnemyIntentType.ATTACK_DEFEND;

        let parryWindowOpen = false;

        if (isBard && isAttackIntent) {
          setGameState(prev => ({
            ...prev,
            parryState: { active: true, enemyId: enemy.id, success: false }
          }));
          parryWindowOpen = true;
          await wait(300); 
        } else {
          await wait(300);
        }

        const currentState = await new Promise<GameState>(resolve => {
            setGameState(prev => { resolve(prev); return prev; });
        });
        const parrySuccess = currentState.parryState?.success || false;
        
        if (parryWindowOpen) {
            setGameState(prev => ({ ...prev, parryState: { active: false, enemyId: null, success: false } }));
        }

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
            const nextActiveEffects: VisualEffectInstance[] = [];
            
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
                            const target = newEnemies[Math.floor(Math.random() * newEnemies.length)];
                            if (target) {
                                target.currentHp -= p.powers['STATIC_DISCHARGE'];
                                newLogs.push(trans("静電放電発動！", languageMode));
                                nextActiveEffects.push({ id: `vfx-static-${Date.now()}`, type: 'FIRE', targetId: target.id });
                            }
                        }
                    }
                }

                let unblockedDamage = 0;
                if (p.block >= damage) { 
                    p.block -= damage; 
                    if (damage > 0) {
                        const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                        newLogs.push(`${trans(e.name, languageMode)}の攻撃 ${formula}${damage} を${trans("ブロック", languageMode)}`);
                        nextActiveEffects.push({ id: `vfx-eblk-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
                    }
                } else { 
                    unblockedDamage = damage - p.block; 
                    p.block = 0; 
                    const formula = logParts.length > 1 ? `(${logParts.join(' ')}) = ` : '';
                    newLogs.push(`${trans(e.name, languageMode)}から ${formula}${damage} ${trans("ダメージを受けた", languageMode)}`);
                    nextActiveEffects.push({ id: `vfx-eslash-${Date.now()}`, type: 'SLASH', targetId: 'player' });
                }
                
                if (p.partner && p.partner.currentHp > 0) {
                     if (unblockedDamage > 0 && Math.random() < 0.5) {
                         p.partner.currentHp -= unblockedDamage;
                         p.partner.floatingText = { id: `dmg-partner-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                         newLogs.push(`${p.partner.name}がダメージを受けた！`);
                         if (p.partner.currentHp <= 0) {
                             newLogs.push(`${p.partner.name}が倒れた...`);
                             p.partner = undefined; 
                         }
                         nextActiveEffects.push({ id: `vfx-pslash-${Date.now()}`, type: 'SLASH', targetId: 'player' });
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
                    nextActiveEffects.push({ id: `vfx-thn-${Date.now()}`, type: 'SLASH', targetId: e.id });
                }

                if (e.currentHp <= 0 && e.enemyType === 'THE_HEART' && e.phase === 1) {
                     e.currentHp = e.maxHp;
                     e.phase = 2;
                     e.name = "真・校長先生";
                     e.poison = 0; e.weak = 0; e.vulnerable = 0;
                     e.floatingText = { id: `phase-evo-${Date.now()}`, text: '本気モード！', color: 'text-yellow-500' };
                     newLogs.push("校長先生が真の姿を現した！");
                     nextActiveEffects.push({ id: `vfx-evo2-${Date.now()}`, type: 'BUFF', targetId: e.id });
                }
            }

            if (intent.type === EnemyIntentType.DEFEND || intent.type === EnemyIntentType.ATTACK_DEFEND) {
                e.block += intent.value; 
                if (intent.type === EnemyIntentType.ATTACK_DEFEND && intent.secondaryValue) e.block = intent.secondaryValue;
                newLogs.push(`${trans(e.name, languageMode)}は防御を固めた`);
                nextActiveEffects.push({ id: `vfx-eblk-self-${Date.now()}`, type: 'BLOCK', targetId: e.id });
            }

            if (intent.type === EnemyIntentType.BUFF) {
                e.strength += (intent.secondaryValue || 2);
                newLogs.push(`${trans(e.name, languageMode)}は力を溜めた`);
                nextActiveEffects.push({ id: `vfx-ebuff-${Date.now()}`, type: 'BUFF', targetId: e.id });
            }

            if (intent.type === EnemyIntentType.DEBUFF || intent.type === EnemyIntentType.ATTACK_DEBUFF) {
                if (p.powers['ARTIFACT'] > 0) {
                    p.powers['ARTIFACT']--;
                    newLogs.push(trans("アーティファクトでデバフを防いだ", languageMode));
                    nextActiveEffects.push({ id: `vfx-art-f-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
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
                    nextActiveEffects.push({ id: `vfx-edbuff-${Date.now()}`, type: 'DEBUFF', targetId: 'player' });
                }
            }
            
            if (e.vulnerable > 0) e.vulnerable--;
            if (e.weak > 0) e.weak--;

            e.nextIntent = getNextEnemyIntent(e, gameState.turn + 1);

            const aliveEnemies = newEnemies.filter(en => en.currentHp > 0 || (en.enemyType === 'THE_HEART' && en.phase === 1));
            return { ...prev, player: p, enemies: aliveEnemies, combatLog: [...prev.combatLog, ...newLogs].slice(-100), activeEffects: [...prev.activeEffects, ...nextActiveEffects] };
        });
        
        // VFX duration logic for enemy turn
        setTimeout(() => {
            setGameState(prev => ({ ...prev, activeEffects: [] }));
        }, 600);

        await wait(600);
    }
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
            if (c.name === 'やほど' || c.name === 'BURN') { p.currentHp -= 2; newLogs.push("やほどダメージ"); nextActiveEffects.push({ id: `vfx-burn-${Date.now()}`, type: 'FIRE', targetId: 'player' }); }
            if (c.name === '虫歯' || c.name === 'DECAY') { p.currentHp -= 2; newLogs.push("虫歯ダメージ"); nextActiveEffects.push({ id: `vfx-decay-${Date.now()}`, type: 'DEBUFF', targetId: 'player' }); }
            if (c.name === '不安' || c.name === 'DOUBT') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + 1;
            if (c.name === '恥' || c.name === 'SHAME') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + 1;
            if (c.name === '後悔' || c.name === 'REGRET') { p.currentHp -= p.hand.length; newLogs.push("後悔ダメージ"); nextActiveEffects.push({ id: `vfx-reg-${Date.now()}`, type: 'SLASH', targetId: 'player' }); }
        });

        return { ...prev, player: p, combatLog: [...prev.combatLog, ...newLogs].slice(-100), activeEffects: [...prev.activeEffects, ...nextActiveEffects] };
    });

    setTimeout(() => {
        setGameState(prev => ({ ...prev, activeEffects: [] }));
    }, 600);
    
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
  
  const handlePlaySynthesizedCard = async (card: ICard) => {
      handlePlayCard(card);
  };

  const handleEventComplete = () => {
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

  const handleFinalBridgeComplete = (upgradeType: 'HEAL' | 'APOTHEOSIS' | 'STRENGTH') => {
      setGameState(prev => {
          const p = { ...prev.player };
          let newDeck = [...p.deck];
          let newPowers = { ...p.powers };
          let newStrength = p.strength;
          let newMaxHp = p.maxHp;
          let newCurrentHp = p.currentHp;

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

  // --- Gardener System Handlers ---
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

  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            audioService.stopBGM();
            audioService.playSound('win');
            
            setGameState(prev => {
                let hpRegen = 0;
                if (prev.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;
                if (prev.player.relics.find(r => r.id === 'MEAT_ON_THE_BONE') && prev.player.currentHp <= prev.player.maxHp / 2) hpRegen += 12;
                
                const nextPlayer = { ...prev.player };
                if (hpRegen > 0) {
                    nextPlayer.currentHp = Math.min(nextPlayer.maxHp, nextPlayer.currentHp + hpRegen);
                }
                
                if (nextPlayer.partner) {
                    nextPlayer.partner = {
                        ...nextPlayer.partner,
                        currentHp: Math.min(nextPlayer.partner.maxHp, nextPlayer.partner.currentHp + 5) 
                    };
                }

                if (prev.act === 4) {
                    audioService.playBGM('victory');
                    return { ...prev, player: nextPlayer, screen: GameScreen.ENDING };
                } else {
                    const isKanji = prev.mode.startsWith('KANJI');
                    const isEnglish = prev.mode.startsWith('ENGLISH');
                    let targetScreen = GameScreen.MATH_CHALLENGE;
                    if (isKanji) targetScreen = GameScreen.KANJI_CHALLENGE;
                    else if (isEnglish) targetScreen = GameScreen.ENGLISH_CHALLENGE;
                    return { ...prev, player: nextPlayer, screen: targetScreen };
                }
            });
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
                     player: {
                         ...prev.player,
                         currentHp: Math.floor(prev.player.maxHp * 0.1),
                         potions: prev.player.potions.filter((_, i) => i !== ghostPotIndex),
                         floatingText: { id: `revive-${Date.now()}`, text: 'お守り！', color: 'text-yellow-400', iconType: 'heart' }
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

  const finishRewardPhase = () => {
    setGameState(prev => {
        const currentNode = prev.map.find(n => n.id === prev.currentMapNodeId);
        
        // --- Garden Growth Logic ---
        let nextPlayer = { ...prev.player };
        if (nextPlayer.id === 'GARDENER' && nextPlayer.garden) {
            nextPlayer.garden = nextPlayer.garden.map(slot => 
                slot.plantedCard ? { ...slot, growth: Math.min(slot.maxGrowth, slot.growth + 1) } : slot
            );
        }

        if (currentNode && currentNode.type === NodeType.BOSS) {
            if (prev.act === 3) {
                return { ...prev, player: nextPlayer, screen: GameScreen.FINAL_BRIDGE };
            }

            const nextAct = prev.act + 1;
            if (nextAct > 4) return prev;
            
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
                narrativeLog: [...prev.narrativeLog, trans(`第${nextAct}章へ進んだ。体力が全回復した！`, languageMode)]
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
  };

  const goToRewardPhase = (bonusGold: number = 0) => {
      const rewards: RewardItem[] = [];
      const isLibrarian = gameState.player.id === 'LIBRARIAN';
      const isGardener = gameState.player.id === 'GARDENER';
      
      if (bonusGold > 0) {
          let goldReward = bonusGold;
          if (gameState.player.relics.find(r => r.id === 'GOLDEN_IDOL')) goldReward = Math.floor(goldReward * 1.25);
          rewards.push({ type: 'GOLD', value: goldReward, id: `rew-gold-${Date.now()}` });
      }

      // Pool integration
      const allCards = Object.values(CARDS_LIBRARY).filter(c => {
          if (c.type === CardType.STATUS || c.type === CardType.CURSE) return false;
          
          // 種カードは園芸委員のみ
          if (c.isSeed && !isGardener) return false;
          
          // 図書委員用、または園芸委員用のSPECIALカードの出現制御
          const isLibrarianCard = Object.values(LIBRARIAN_CARDS).some(lc => lc.name === c.name);
          if (c.rarity === 'SPECIAL') {
              if (isLibrarian && isLibrarianCard) return true;
              if (isGardener && c.isSeed) return true;
              return false;
          }
          
          return true;
      });

      for(let i=0; i<3; i++) {
          const roll = Math.random() * 100;
          let targetRarity = 'COMMON';
          if (roll > 95) targetRarity = 'LEGENDARY'; else if (roll > 80) targetRarity = 'RARE'; else if (roll > 50) targetRarity = 'UNCOMMON';
          
          let pool;
          if (isLibrarian && i === 0 && Math.random() < 0.7) {
              pool = Object.values(LIBRARIAN_CARDS);
          } else if (isGardener && i === 0 && Math.random() < 0.7) {
              pool = Object.values(GARDEN_SEEDS);
          } else {
              pool = allCards.filter(c => c.rarity === targetRarity);
          }

          const candidate = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : allCards[Math.floor(Math.random() * allCards.length)];
          rewards.push({ type: 'CARD', value: { ...candidate, id: `reward-${Date.now()}-${i}` }, id: `rew-card-${i}` });
      }

      const hasSozu = gameState.player.relics.find(r => r.id === 'SOZU');
      const hasKinjiro = gameState.player.relics.find(r => r.id === 'KINJIRO_STATUE');
      if (!hasSozu && (hasKinjiro || Math.random() < 0.4)) {
          const allPotions = Object.values(POTION_LIBRARY);
          const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
          rewards.push({ type: 'POTION', value: { ...potion, id: `pot-${Date.now()}` }, id: `rew-pot` });
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
      
      if (gameState.player.relics.find(r => r.id === 'CALCULATOR')) {
          const healAmount = correctCount * 2;
          if (healAmount > 0) {
              setGameState(prev => ({
                  ...prev,
                  player: {
                      ...prev.player,
                      currentHp: Math.min(prev.player.currentHp, prev.player.currentHp + healAmount),
                      floatingText: { id: `calc-heal-${Date.now()}`, text: `+${healAmount} HP`, color: 'text-green-500', iconType: 'heart' }
                  }
              }));
          }
      }

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
              if (item.value.id === 'VELVET_CHOKER') p.maxEnergy += 1;
              if (item.value.id === 'WAFFLE') { p.maxHp += 7; p.currentHp = p.maxHp; }
              if (item.value.id === 'OLD_COIN') p.gold += 300;
              if (item.value.id === 'MATRYOSHKA') prev.player.relicCounters['MATRYOSHKA'] = 2; 
              if (item.value.id === 'HAPPY_FLOWER') prev.player.relicCounters['HAPPY_FLOWER'] = 0; 
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
            
            {gameState.screen === GameScreen.START_MENU && (
                <div className="absolute top-2 right-2 z-[9999] flex gap-2">
                    <button 
                        onClick={toggleBgmMode} 
                        className={`bg-black/50 hover:bg-black/80 text-white border border-white/50 px-2 py-1 rounded text-xs flex items-center shadow-lg transition-colors font-bold ${bgmMode !== 'OSCILLATOR' && bgmMode !== 'MP3' ? 'border-indigo-500 text-indigo-400' : (bgmMode === 'MP3' ? 'border-green-500 text-green-400' : '')}`}
                    >
                        <Music size={14} className="mr-1"/>
                        {trans(bgmMode === 'STUDY' ? 'BGM: 学習(SEのみ)' : (bgmMode === 'MP3' ? 'BGM: MP3' : 'BGM: 電子音'), languageMode)}
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
                            className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-600 mb-8 font-bold animate-pulse tracking-widest leading-tight cursor-pointer select-none"
                            onClick={handleTitleClick}
                        >
                            {trans("学習ローグ", languageMode)}
                        </h1>
                        
                        <div className="mb-6 bg-black/40 px-4 py-2 rounded-lg border border-gray-600">
                             {nextThreshold ? (
                                <div className="text-yellow-300 text-xs md:text-sm font-bold">
                                    {trans("次のミニゲーム開放まで", languageMode)}: <span className="text-xl md:text-2xl text-white mx-1">{Math.max(0, nextThreshold - totalMathCorrect)}</span> {trans("問正解", languageMode)}
                                </div>
                             ) : (
                                <div className="text-green-400 text-xs md:text-sm font-bold animate-pulse">{trans("全ミニゲーム開放済み！", languageMode)}</div>
                             )}
                             <div className="text-gray-500 text-[10px] mt-1">{trans("累計正解数", languageMode)}: {totalMathCorrect}{trans("問", languageMode)}</div>
                        </div>

                        {isMathDebugSkipped && (
                            <div className="text-red-500 font-bold mb-1 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse">
                                {trans("(デバッグ: けいさん スキップ ON)", languageMode)}
                            </div>
                        )}
                        {isDebugHpOne && (
                            <div className="text-red-500 font-bold mb-6 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse">
                                {trans("(デバッグ: てきHP1 & ぜんかいほう ON)", languageMode)}
                            </div>
                        )}
                        {(!isMathDebugSkipped && !isDebugHpOne) && <div className="mb-2 h-2"></div>}

                        <div className="flex flex-col gap-3 items-center w-full max-w-[280px]">
                            {hasSave && (
                                <button onClick={continueGame} className="w-full bg-blue-900 text-white py-3 px-4 text-lg font-bold border-2 border-blue-400 hover:bg-blue-800 cursor-pointer flex items-center justify-center shadow-lg relative group overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                    <Play className="mr-2 fill-current" /> {trans("つづきから", languageMode)}
                                </button>
                            )}
                            <button onClick={startGame} disabled={isLoading} className="w-full bg-gray-100 text-black py-3 px-4 text-lg font-bold border-b-4 border-r-4 border-gray-500 hover:bg-white hover:border-gray-400 hover:translate-x-[1px] hover:translate-y-[1px] active:border-0 active:translate-y-[4px] active:translate-x-[4px] transition-all cursor-pointer shadow-lg flex items-center justify-center">
                                {isLoading ? trans("じゅんびちゅう...", languageMode) : trans("冒険を始める", languageMode)}
                            </button>
                            
                            <button onClick={startChallengeGame} disabled={isLoading} className="w-full bg-red-900/80 text-red-100 py-2 px-4 text-sm font-bold border border-red-500 hover:bg-red-800 cursor-pointer flex items-center justify-center shadow-md hover:shadow-red-900/50">
                                <Swords className="mr-2" size={16}/> {trans("1A1Dモード", languageMode)}
                            </button>

                            <button onClick={startProblemChallenge} className="w-full bg-emerald-900/80 text-emerald-100 py-2 px-4 text-sm font-bold border border-emerald-500 hover:bg-emerald-800 cursor-pointer flex items-center justify-center shadow-md hover:shadow-emerald-900/50">
                                <GraduationCap className="mr-2" size={16}/> {trans("問題チャレンジ", languageMode)}
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
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.RANKING }))} className="flex-1 bg-gray-800 text-green-500 py-2 text-[10px] font-bold border border-gray-600 border-green-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                    <Trophy className="mb-1" size={18}/> {trans("記録", languageMode)}
                                </button>
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.HELP }))} className="flex-1 bg-gray-800 text-blue-400 py-2 text-[10px] font-bold border border-gray-600 border-blue-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                    <HelpCircle className="mb-1" size={18}/> {trans("遊び方", languageMode)}
                                </button>
                            </div>

                            <button onClick={() => setShowDebugLog(true)} className="text-gray-600 text-[10px] hover:text-gray-400 mt-2 flex items-center justify-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <Terminal size={10}/> v1.0.1
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
                            System Update Log v1.0.1
                        </h2>
                        <div className="space-y-4 text-sm font-mono text-gray-300 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <section>
                                <h3 className="text-white font-bold mb-1">■ v1.0.1 アップデート</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>問題チャレンジモード実装</li>
                                    <li>BGM選択機能の追加</li>
                                    <li>セーブ・ロード機能の安定性向上</li>
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
                <DebugMenuScreen onStart={handleDebugStart} onStartAct3Boss={handleDebugStartAct3Boss} onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.PROBLEM_CHALLENGE && (
                <ProblemChallengeScreen onBack={returnToTitle} languageMode={languageMode} />
            )}

            {gameState.screen === GameScreen.MINI_GAME_SELECT && (
                <MiniGameSelectScreen 
                    onSelect={handleMiniGameSelect} 
                    onBack={returnToTitle} 
                    totalMathCorrect={totalMathCorrect}
                    isDebug={isDebugHpOne}
                />
            )}
            
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
                    <div className="w-full max-w-4xl flex flex-col items-center my-auto">
                        <h2 className="text-3xl font-bold mb-6 text-yellow-400 mt-4">{trans("モード選択", languageMode)}</h2>
                        
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-blue-400 border-b border-blue-900 pb-2 flex items-center"><Brain className="mr-2" /> さんすう</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleModeSelect(GameMode.ADDITION)} className="bg-red-900/60 border border-red-500 p-3 rounded hover:bg-red-800 transition-colors text-sm font-bold flex items-center justify-center gap-2"><Plus size={14}/> たし算</button>
                                    <button onClick={() => handleModeSelect(GameMode.SUBTRACTION)} className="bg-blue-900/60 border border-blue-500 p-3 rounded hover:bg-blue-800 transition-colors text-sm font-bold flex items-center justify-center gap-2"><Minus size={14}/> ひき算</button>
                                    <button onClick={() => handleModeSelect(GameMode.MULTIPLICATION)} className="bg-green-900/60 border border-green-500 p-3 rounded hover:bg-green-800 transition-colors text-sm font-bold flex items-center justify-center gap-2"><MultiplyIcon size={14}/> かけ算</button>
                                    <button onClick={() => handleModeSelect(GameMode.DIVISION)} className="bg-yellow-700/60 border border-yellow-500 p-3 rounded hover:bg-yellow-600 transition-colors text-sm font-bold flex items-center justify-center gap-2"><Divide size={14}/> わり算</button>
                                    <button onClick={() => handleModeSelect(GameMode.MIXED)} className="col-span-2 bg-purple-900/60 border border-purple-500 p-3 rounded hover:bg-purple-800 transition-colors text-sm font-bold flex items-center justify-center gap-2"><Shuffle size={14}/> ミックス</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-cyan-400 border-b border-cyan-900 pb-2 flex items-center"><Book className="mr-2" /> かんじ (読み)</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6].map(g => (
                                        <button key={g} onClick={() => handleModeSelect(`KANJI_${g}` as GameMode)} className="bg-slate-800 border border-slate-600 p-2 rounded hover:border-cyan-400 hover:bg-slate-700 transition-all text-xs font-bold">小{g}</button>
                                    ))}
                                    {[7, 8, 9].map(g => (
                                        <button key={g} onClick={() => handleModeSelect(`KANJI_${g}` as GameMode)} className="bg-slate-800 border border-slate-600 p-2 rounded hover:border-orange-400 hover:bg-slate-700 transition-all text-xs font-bold">中{g-6}</button>
                                    ))}
                                    <button onClick={() => handleModeSelect(GameMode.KANJI_MIXED)} className="col-span-3 bg-cyan-900/60 border border-cyan-500 p-3 rounded hover:bg-cyan-800 transition-colors text-sm font-bold flex items-center justify-center gap-2"><Shuffle size={14}/> ミックス</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-indigo-400 border-b border-indigo-900 pb-2 flex items-center"><Languages className="mr-2" /> えいたんご (単語)</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleModeSelect(GameMode.ENGLISH_ES)} className="bg-slate-800 border border-slate-600 p-2 rounded hover:border-indigo-400 hover:bg-slate-700 transition-all text-xs font-bold">小学校</button>
                                    <button onClick={() => handleModeSelect(GameMode.ENGLISH_J1)} className="bg-slate-800 border border-slate-600 p-2 rounded hover:border-indigo-400 hover:bg-slate-700 transition-all text-xs font-bold">中学1年</button>
                                    <button onClick={() => handleModeSelect(GameMode.ENGLISH_J2)} className="bg-slate-800 border border-slate-600 p-2 rounded hover:border-indigo-400 hover:bg-slate-700 transition-all text-xs font-bold">中学2年</button>
                                    <button onClick={() => handleModeSelect(GameMode.ENGLISH_J3)} className="bg-slate-800 border border-slate-600 p-2 rounded hover:border-indigo-400 hover:bg-slate-700 transition-all text-xs font-bold">中学3年</button>
                                    <button onClick={() => handleModeSelect(GameMode.ENGLISH_MIXED)} className="col-span-2 bg-indigo-900/60 border border-indigo-500 p-2 rounded hover:bg-indigo-800 transition-all text-xs font-bold flex items-center justify-center gap-1"><Shuffle size={12}/> ミックス</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-pink-400 border-b border-pink-900 pb-2 flex items-center"><MessageSquare className="mr-2" /> えいかいわ (会話)</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5].map(lv => (
                                        <button key={lv} onClick={() => handleModeSelect(`ENGLISH_CONV_${lv}` as GameMode)} className="bg-slate-800 border border-slate-600 p-2 rounded hover:border-pink-400 hover:bg-slate-700 transition-all text-xs font-bold">会話 Lv{lv}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button onClick={returnToTitle} className="mt-12 text-gray-400 hover:text-white underline mb-8">{trans("もどる", languageMode)}</button>
                    </div>
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
                    <RelicSelectionScreen relics={starterRelics} onSelect={handleRelicSelect} languageMode={languageMode} />
                </div>
            )}

            {gameState.screen === GameScreen.COMPENDIUM && (
                <div className="absolute inset-0">
                    <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={returnToTitle} languageMode={languageMode} />
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
                        player={gameState.player} 
                        languageMode={languageMode} 
                        narrative={currentNarrative}
                    />
                </div>
            )}

            {gameState.screen === GameScreen.BATTLE && (
                <div className="absolute inset-0">
                    <BattleScene 
                        player={gameState.player} enemies={gameState.enemies} selectedEnemyId={gameState.selectedEnemyId} onSelectEnemy={handleSelectEnemy} onPlayCard={handlePlayCard} onEndTurn={handleEndTurnClick} turnLog={turnLog} narrative={currentNarrative} lastActionTime={lastActionTime} lastActionType={lastActionType} actingEnemyId={actingEnemyId} selectionState={gameState.selectionState} onHandSelection={handleHandSelection}
                        onUsePotion={handleUsePotion} combatLog={gameState.combatLog} languageMode={languageMode} codexOptions={gameState.codexOptions} onCodexSelect={onCodexSelect} onPlaySynthesizedCard={handlePlaySynthesizedCard}
                        parryState={gameState.parryState} onParry={handleParryClick} activeEffects={gameState.activeEffects}
                    />
                </div>
            )}

            {gameState.screen === GameScreen.DODGEBALL_SHOOTING && (
                <div className="absolute inset-0">
                    <DodgeballShooting 
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
                    />
                </div>
            )}

            {gameState.screen === GameScreen.KANJI_CHALLENGE && (
                <div className="absolute inset-0">
                    <KanjiChallengeScreen 
                        mode={gameState.mode} 
                        onComplete={handleMathChallengeComplete} 
                        debugSkip={isMathDebugSkipped}
                    />
                </div>
            )}

            {gameState.screen === GameScreen.ENGLISH_CHALLENGE && (
                <div className="absolute inset-0">
                    <EnglishChallengeScreen 
                        mode={gameState.mode} 
                        onComplete={handleMathChallengeComplete} 
                        debugSkip={isMathDebugSkipped}
                    />
                </div>
            )}

            {gameState.screen === GameScreen.REWARD && (
                <div className="absolute inset-0">
                    <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} currentPotions={gameState.player.potions} languageMode={languageMode} />
                </div>
            )}

            {gameState.screen === GameScreen.REST && (
                <div className="absolute inset-0">
                    <RestScreen 
                        player={gameState.player} 
                        onRest={handleRestAction} 
                        onUpgrade={handleUpgradeCard} 
                        onSynthesize={handleSynthesizeCard}
                        onLeave={handleNodeComplete} 
                        languageMode={languageMode}
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
                                 if (relic.id === 'VELVET_CHOKER') newP.maxEnergy += 1;
                                 if (relic.id === 'WAFFLE') { newP.maxHp += 7; newP.currentHp = p.maxHp; }
                                 if (relic.id === 'OLD_COIN') newP.gold += 300;
                                 if (relic.id === 'MATRYOSHKA') prev.player.relicCounters['MATRYOSHKA'] = 2; 
                                 if (relic.id === 'HAPPY_FLOWER') prev.player.relicCounters['HAPPY_FLOWER'] = 0; 
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
                                 const newHp = Math.min(p.currentHp, newMaxHp); 
                                 
                                 return { ...prev, player: { ...p, gold: p.gold - cost, deck: newDeck, maxHp: newMaxHp, currentHp: newHp } };
                             });
                        }}
                        onLeave={handleNodeComplete}
                        languageMode={languageMode}
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
                            // Leave garden and possibly get a new seed bonus
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
                        options={eventData.options.map((o: any) => ({ ...o, label: trans(o.label, languageMode), text: trans(o.text, languageMode) }))} 
                        resultLog={eventResultLog ? trans(eventResultLog, languageMode) : null}
                        onContinue={handleEventComplete}
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
                        onOpen={() => {
                            const hasCursedKey = !!gameState.player.relics.find(r => r.id === 'CURSED_KEY');
                            setGameState(prev => {
                                const newP = { ...prev.player };
                                
                                treasureRewards.forEach(r => {
                                    if (r.type === 'GOLD') newP.gold += r.value;
                                    if (r.type === 'RELIC') {
                                        newP.relics = [...newP.relics, r.value];
                                        storageService.saveUnlockedRelic(r.value.id);
                                        if (r.value.id === 'SOZU') newP.maxEnergy += 1;
                                        if (r.value.id === 'CURSED_KEY') newP.maxEnergy += 1;
                                        if (r.value.id === 'PHILOSOPHER_STONE') newP.maxEnergy += 1;
                                        if (r.value.id === 'VELVET_CHOKER') newP.maxEnergy += 1;
                                        if (r.value.id === 'WAFFLE') { newP.maxHp += 7; newP.currentHp = prev.player.maxHp; }
                                        if (r.value.id === 'OLD_COIN') newP.gold += 300;
                                        if (r.value.id === 'MATRYOSHKA') prev.player.relicCounters['MATRYOSHKA'] = 2; 
                                        if (r.value.id === 'HAPPY_FLOWER') prev.player.relicCounters['HAPPY_FLOWER'] = 0; 
                                    }
                                });

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
                        languageMode={languageMode}
                    />
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
                            <div className="mb-8 p-4 bg-black/50 border border-gray-500 rounded-lg animate-in zoom-in duration-150 shrink-0">
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

        </div>
    </div>
  );
};

export default App;
