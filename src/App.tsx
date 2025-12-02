
import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, GameScreen, Enemy, Card as ICard, 
  CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion, Player, EnemyIntent, Character, FloatingText, RankingEntry, GameMode
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
import Card from './components/Card';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle, Send, Swords, Terminal, Club, Zap } from 'lucide-react';

// --- HELPERS ---
export const getUpgradedCard = (card: ICard): ICard => {
    if (card.upgraded) return card; // Prevent double upgrade

    const newCard = { ...card, upgraded: true };
    
    const hasDamage = (card.damage !== undefined && card.damage > 0);
    const hasBlock = (card.block !== undefined && card.block > 0);
    
    if (hasDamage) {
        newCard.damage = Math.floor(card.damage! * 1.3) + 2;
    }
    if (hasBlock) {
        newCard.block = Math.floor(card.block! * 1.3) + 2;
    }

    if (!hasDamage && !hasBlock && card.cost > 0) {
        newCard.cost = Math.max(0, card.cost - 1);
    } else if (card.cost === 0 && !hasDamage && !hasBlock) {
        if (newCard.draw) newCard.draw += 1;
        if (newCard.energy) newCard.energy += 1;
        if (newCard.vulnerable) newCard.vulnerable += 1;
        if (newCard.weak) newCard.weak += 1;
        if (newCard.poison) newCard.poison += 2;
        if (newCard.strength) newCard.strength += 1;
        if (newCard.poisonMultiplier) newCard.poisonMultiplier += 1;
        // Next turn effects
        if (newCard.nextTurnEnergy) newCard.nextTurnEnergy += 1;
        if (newCard.nextTurnDraw) newCard.nextTurnDraw += 1;
    }

    // Specific Card Upgrade Logic overrides
    if (card.name === 'ボディスラム' || card.name === 'BODY_SLAM') newCard.cost = 0; 
    if (card.name === '限界突破' || card.name === 'LIMIT_BREAK') newCard.exhaust = false;
    
    return newCard;
};

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
    return score;
};

// --- ENEMY DEFINITIONS & AI ---
const determineEnemyType = (name: string, isBoss: boolean): string => {
    if (isBoss) return 'GUARDIAN'; 
    if (name.includes('先生') || name.includes('用務員') || name.includes('教頭')) return 'TEACHER'; // High dmg, Buffs
    if (name.includes('ゴーレム') || name.includes('主') || name.includes('守護者') || name.includes('模型')) return 'TANK'; // High block
    if (name.includes('亡霊') || name.includes('幽霊') || name.includes('花子') || name.includes('影')) return 'GHOST'; // Intangible/Debuff
    if (name.includes('悪魔') || name.includes('不良') || name.includes('カラス') || name.includes('狂信者')) return 'AGGRESSIVE'; // Multi-hit
    if (name.includes('宿題') || name.includes('ミミック') || name.includes('泥棒') || name.includes('妖精')) return 'TRICKSTER'; // Debuff/Special
    if (name.includes('虫') || name.includes('カス') || name.includes('スライム') || name.includes('ハチ')) return 'SWARM'; // Low HP, Group
    return 'GENERIC';
};

const getNextEnemyIntent = (enemy: Enemy, turn: number): EnemyIntent => {
    const type = enemy.enemyType;
    const localTurn = turn % 3; 
    const isAct2Plus = (enemy.maxHp > 60); // Roughly check strength

    switch (type) {
        case 'TEACHER': // Buffs then heavy hits
            if (turn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: isAct2Plus ? 3 : 2 }; 
            if (localTurn === 2) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 18 : 12 };
            return { type: EnemyIntentType.ATTACK_DEBUFF, value: 8, secondaryValue: 2, debuffType: 'VULNERABLE' };

        case 'TANK': // Defend and hit
            if (localTurn === 0) return { type: EnemyIntentType.DEFEND, value: isAct2Plus ? 20 : 12 };
            if (localTurn === 1) return { type: EnemyIntentType.ATTACK_DEFEND, value: 10, secondaryValue: 10 };
            return { type: EnemyIntentType.ATTACK, value: 15 };

        case 'GHOST': // Debuffs and annoyance
            if (localTurn === 0) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'WEAK' };
            if (localTurn === 1) return { type: EnemyIntentType.ATTACK, value: 6 };
            return { type: EnemyIntentType.ATTACK_DEBUFF, value: 5, secondaryValue: 1, debuffType: 'VULNERABLE' };

        case 'AGGRESSIVE': // Multi-hits
            if (turn === 1) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 10 : 6 };
            if (localTurn === 0) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 5 : 3 }; // Should mean x2 or x3 in logic if extended, simplified here
            return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 14 : 9 };

        case 'TRICKSTER': // Varied
            if (localTurn === 0) return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 2, debuffType: 'POISON' };
            if (localTurn === 1) return { type: EnemyIntentType.DEFEND, value: 8 };
            return { type: EnemyIntentType.ATTACK, value: 7 };

        case 'SWARM': // Weak but annoying
            if (turn % 2 === 0) return { type: EnemyIntentType.ATTACK, value: 5 };
            return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 1, debuffType: 'WEAK' };

        case 'GUARDIAN': // Boss
            const bossTurn = turn % 4;
            if (bossTurn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 9 }; 
            if (bossTurn === 2) return { type: EnemyIntentType.ATTACK, value: 20 }; 
            if (bossTurn === 3) return { type: EnemyIntentType.ATTACK_DEBUFF, value: 8, secondaryValue: 2, debuffType: 'VULNERABLE' }; 
            return { type: EnemyIntentType.DEFEND, value: 15 };

        case 'THE_HEART': // True Boss
             const heartTurn = turn % 3;
             if (heartTurn === 1) return { type: EnemyIntentType.ATTACK, value: 45 }; 
             if (heartTurn === 2) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 2 }; 
             return { type: EnemyIntentType.ATTACK_DEBUFF, value: 2, secondaryValue: 12, debuffType: 'VULNERABLE' }; 

        default: // GENERIC
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
    rewards: [],
    selectionState: { active: false, type: 'DISCARD', amount: 0 },
    isEndless: false
  });

  const [currentNarrative, setCurrentNarrative] = useState<string>("...");
  const [turnLog, setTurnLog] = useState<string>("プレイヤーターン");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [lastActionType, setLastActionType] = useState<CardType | null>(null);
  const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);
  const [hasSave, setHasSave] = useState<boolean>(false);
  const [selectedCharName, setSelectedCharName] = useState<string>("戦士");
  const [legacyCardSelected, setLegacyCardSelected] = useState<boolean>(false);
  const [showDebugLog, setShowDebugLog] = useState<boolean>(false);
  
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

  // --- Auto Save Logic ---
  useEffect(() => {
      // Save game whenever valid state changes
      if (gameState.screen !== GameScreen.START_MENU && 
          gameState.screen !== GameScreen.GAME_OVER && 
          gameState.screen !== GameScreen.ENDING &&
          gameState.screen !== GameScreen.VICTORY &&
          gameState.screen !== GameScreen.MATH_CHALLENGE && // Don't save during math
          gameState.screen !== GameScreen.COMPENDIUM && 
          gameState.screen !== GameScreen.HELP &&
          gameState.screen !== GameScreen.RANKING &&
          gameState.screen !== GameScreen.CHARACTER_SELECTION &&
          gameState.screen !== GameScreen.MODE_SELECTION &&
          gameState.screen !== GameScreen.DEBUG_MENU &&
          gameState.screen !== GameScreen.MINI_GAME_POKER
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
      e.stopPropagation(); // Prevent closing modal
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

  // --- HANDLERS IMPLEMENTATION ---

  const continueGame = () => {
      const saved = storageService.loadGame();
      if (saved) {
          setGameState(saved);
          audioService.playBGM('menu'); 
      }
  };

  const startGame = () => {
      audioService.playSound('select');
      setGameState(prev => ({ 
          ...prev, 
          screen: GameScreen.MODE_SELECTION,
          challengeMode: undefined // Explicitly clear challenge mode
      }));
  };

  const startChallengeGame = () => {
      audioService.playSound('select');
      setGameState(prev => ({ ...prev, screen: GameScreen.MODE_SELECTION, challengeMode: '1A1D' }));
  };

  const startPokerGame = () => {
      audioService.playSound('select');
      setGameState(prev => ({ ...prev, screen: GameScreen.MINI_GAME_POKER }));
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
          narrativeLog: [...prev.narrativeLog, "終わらない冒険が始まる..."]
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
                deck: deck.length > 0 ? deck : createDeck(), // Use basic deck if none selected
                relics: relics.length > 0 ? relics : [], // No relics if none selected
                potions: potions.length > 0 ? potions : [],
                maxHp: 999, // Debug buff
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
                floatingText: null,
                nextTurnEnergy: 0,
                nextTurnDraw: 0,
                echoes: 0,
                cardsPlayedThisTurn: 0,
                attacksPlayedThisTurn: 0,
            },
            narrativeLog: ["デバッグモード開始"],
            enemies: [],
            selectedEnemyId: null,
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 }
        }));
        audioService.playBGM('menu');
  };

  const handleCharacterSelect = (char: Character) => {
      audioService.playSound('select');
      setSelectedCharName(char.name);
      
      let initialDeck: ICard[] = [];
      
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

      const legacyCard = storageService.getLegacyCard();
      if (legacyCard) {
          initialDeck.push({ ...legacyCard, id: `legacy-${Date.now()}` });
          storageService.clearLegacyCard();
      }

      const starterRelic = RELIC_LIBRARY[char.startingRelicId];
      const relics = starterRelic ? [starterRelic] : [];

      const map = generateDungeonMap();

      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          act: 1,
          floor: 0,
          map,
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
              floatingText: null,
              nextTurnEnergy: 0,
              nextTurnDraw: 0,
              attacksPlayedThisTurn: 0,
              cardsPlayedThisTurn: 0,
              echoes: 0,
          },
          narrativeLog: ["冒険が始まった。"]
      }));
      audioService.playBGM('menu');
  };

  const handleRelicSelect = (relic: Relic) => {
        const map = generateDungeonMap();
        setGameState(prev => ({
            ...prev,
            screen: GameScreen.MAP,
            map: map,
            player: {
                ...prev.player,
                relics: [...prev.player.relics, relic]
            }
        }));
  };

  const generateEvent = (player: Player) => {
      const events = [
          {
              title: "怪しい薬売り",
              description: "路地裏で男が声をかけてきた。「とびきりの薬、あるよ」",
              options: [
                  { label: "買う", text: "20G支払ってポーションを得る。", action: () => {
                      if (player.gold >= 20) {
                          const pots = Object.values(POTION_LIBRARY);
                          const pot = { ...pots[Math.floor(Math.random() * pots.length)], id: `pot-${Date.now()}` };
                          setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - 20, potions: [...prev.player.potions, pot].slice(0, 3) } }));
                          setEventResultLog("怪しい薬を買った。効果はありそうだ。");
                      } else {
                          setEventResultLog("お金が足りなかった...");
                      }
                  }},
                  { label: "無視", text: "何もせず立ち去る。", action: () => { setEventResultLog("怪しい男を無視して先へ進んだ。"); } }
              ]
          },
      ];
      return events[0]; 
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
            let bgmType: 'battle' | 'menu' = 'battle'; 

            if (gameState.act === 4 && node.type === NodeType.BOSS) {
                // TRUE BOSS
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
            } else {
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
            p.drawPile = shuffle([...p.deck]);
            p.hand = [];
            p.discardPile = [];
            p.currentEnergy = p.maxEnergy;
            p.block = 0;
            p.strength = 0;
            p.powers = {};
            p.relicCounters = { ...p.relicCounters }; 
            p.turnFlags = {};
            p.echoes = 0;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;

            // --- START OF BATTLE RELIC EFFECTS ---
            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            if (p.relics.find(r => r.id === 'HACHIMAKI')) p.powers['DEXTERITY'] = 1;
            if (p.relics.find(r => r.id === 'SEED_PACK')) p.powers['THORNS'] = 3;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) p.nextTurnDraw = 2; 
            if (p.relics.find(r => r.id === 'SNAKE_RING')) p.nextTurnDraw = 2; 
            if (p.relics.find(r => r.id === 'HOLY_WATER')) p.currentEnergy += 1; 
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'LANTERN')) p.currentEnergy += 1;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = 3;
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (p.relics.find(r => r.id === 'BIG_LADLE')) p.currentHp = Math.min(p.maxHp, p.currentHp + 4);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
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
            if (p.relics.find(r => r.id === 'ENCHIRIDION')) {
                const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
                const power = powers[Math.floor(Math.random() * powers.length)];
                // Note: Enchiridion usually adds to hand at start of combat
                // We'll process it after draw to ensure hand isn't full/wiped by initial shuffle logic
            }
            
            let drawCount = HAND_SIZE;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;

            for(let i=0; i<drawCount; i++) {
                const c = p.drawPile.pop();
                if(c) p.hand.push(c);
            }
            
            // Post-Draw Relic Effects
            if (p.relics.find(r => r.id === 'ENCHIRIDION')) {
                const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
                const power = powers[Math.floor(Math.random() * powers.length)];
                p.hand.push({ ...power, id: `ench-${Date.now()}`, cost: 0 });
            }
            if (p.relics.find(r => r.id === 'WHISTLE')) {
                const attacks = p.drawPile.filter(c => c.type === CardType.ATTACK);
                if (attacks.length > 0) {
                    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
                    // Remove from draw pile to avoid dupes or logic conflicts? 
                    // Standard Slay the Spire logic usually generates a copy or seeks it.
                    // "Whistle" description says "Add random attack (cost 0) to hand". Implies generation.
                    // We'll generate a fresh copy to avoid messing with deck state directly for this fight instance.
                    const freeAttack = { ...randomAttack, cost: 0, id: `whistle-${Date.now()}` };
                    p.hand.push(freeAttack);
                } else {
                    // Fallback if no attacks in draw (rare)
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
                turn: 1
            });
            setCurrentNarrative(flavor);
            audioService.playBGM(bgmType);
            setTurnLog("あなたのターン");

        } else if (node.type === NodeType.REST) {
            setGameState({ ...nextState, screen: GameScreen.REST });
            audioService.playBGM('menu');

        } else if (node.type === NodeType.SHOP) {
            const keys = Object.keys(CARDS_LIBRARY).filter(k => !STATUS_CARDS[k] && !CURSE_CARDS[k] && !EVENT_CARDS[k]);
            const cards: ICard[] = [];
            for(let i=0; i<5; i++) {
                const k = keys[Math.floor(Math.random() * keys.length)];
                const c = { ...CARDS_LIBRARY[k] };
                let price = 40 + Math.floor(Math.random() * 60);
                if (c.rarity === 'RARE') price += 50;
                if (c.rarity === 'LEGENDARY') price += 100;
                cards.push({ id: `shop-${i}-${Date.now()}`, ...c, price });
            }
            setShopCards(cards);

            const allRelics = Object.values(RELIC_LIBRARY).filter(r => ['SHOP', 'COMMON', 'UNCOMMON', 'RARE'].includes(r.rarity));
            setShopRelics(shuffle(allRelics).slice(0, 2));

            const allPotions = Object.values(POTION_LIBRARY);
            setShopPotions(shuffle(allPotions).slice(0, 3).map(p => ({ ...p, id: `shop-pot-${Date.now()}-${Math.random()}` })));

            setGameState({ ...nextState, screen: GameScreen.SHOP });
            audioService.playBGM('poker_shop');

        } else if (node.type === NodeType.EVENT) {
            const ev = generateEvent(nextState.player);
            setEventData(ev);
            setEventResultLog(null);
            setGameState({ ...nextState, screen: GameScreen.EVENT });
            audioService.playBGM('menu');
        } else if (node.type === NodeType.TREASURE) {
            const rewards: RewardItem[] = [];
            const allRelics = Object.values(RELIC_LIBRARY).filter(r => ['COMMON', 'UNCOMMON', 'RARE'].includes(r.rarity));
            rewards.push({ type: 'RELIC', value: shuffle(allRelics)[0], id: `tr-relic-${Date.now()}` });
            rewards.push({ type: 'GOLD', value: 50 + Math.floor(Math.random() * 50), id: `tr-gold-${Date.now()}` });
            setTreasureRewards(rewards);
            setGameState({ ...nextState, screen: GameScreen.TREASURE });
            audioService.playBGM('menu');
        }

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSelectEnemy = (id: string) => setGameState(prev => ({ ...prev, selectedEnemyId: id }));

  const applyDebuff = (enemy: Enemy, type: 'WEAK' | 'VULNERABLE' | 'POISON', amount: number) => {
      if (enemy.artifact > 0 && type !== 'POISON') { // Poison ignores artifact in some rules, but standard Slay the Spire artifact blocks debuffs. Let's make it block everything.
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
                 if (p.powers['STRATEGIST']) p.currentEnergy += 2; // Strategist Logic
              } else if (mode.type === 'EXHAUST') {
                 if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
              }
              const newAmount = mode.amount - 1;
              
              // Resolve Origin Card Effects if Selection Done
              if (newAmount <= 0 && mode.originCardId) {
                  // e.g. Gambling Chip (discard hand, draw same amount) handled elsewhere or here?
                  // Keeping it simple for now.
              }

              return { ...prev, player: p, selectionState: { ...mode, active: newAmount > 0, amount: newAmount } };
          }
          if (mode.type === 'COPY') {
             const copy = { ...card, id: `copy-${Date.now()}` };
             if (p.hand.length < HAND_SIZE + 5) p.hand.push(copy); // Hand limit
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
          
          // Remove potion
          p.potions = p.potions.filter(pt => pt.id !== potion.id);

          // Apply Effect
          const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];

          if (potion.templateId === 'FIRE_POTION' && target) {
              target.currentHp -= 20;
              target.floatingText = { id: `dmg-${Date.now()}`, text: '20', color: 'text-red-500', iconType: 'sword' };
          } else if (potion.templateId === 'BLOCK_POTION') {
              p.block += 12;
          } else if (potion.templateId === 'STRENGTH_POTION') {
              p.strength += 2;
          } else if (potion.templateId === 'ENERGY_POTION') {
              p.currentEnergy += 2;
          } else if (potion.templateId === 'WEAK_POTION' && target) {
              applyDebuff(target, 'WEAK', 3);
          } else if (potion.templateId === 'POISON_POTION' && target) {
              applyDebuff(target, 'POISON', 6);
          } else if (potion.templateId === 'HEALTH_POTION') {
              const heal = 15;
              p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
              p.floatingText = { id: `heal-${Date.now()}`, text: `+${heal}`, color: 'text-green-500', iconType: 'heart' };
          } else if (potion.templateId === 'LIQUID_BRONZE') {
              p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
          } else if (potion.templateId === 'GAMBLERS_BREW') {
              const discardCount = p.hand.length;
              p.discardPile = [...p.discardPile, ...p.hand];
              p.hand = [];
              // Draw
              for (let i = 0; i < discardCount; i++) {
                  if (p.drawPile.length === 0) {
                      if (p.discardPile.length === 0) break;
                      p.drawPile = shuffle(p.discardPile);
                      p.discardPile = [];
                  }
                  const c = p.drawPile.pop();
                  if (c) p.hand.push(c);
              }
          }

          // Clean up dead enemies
          const remainingEnemies = enemies.filter(e => e.currentHp > 0);

          return { ...prev, player: p, enemies: remainingEnemies };
      });
  };

  const handlePlayCard = (card: ICard) => {
    if (gameState.player.currentEnergy < card.cost) return;
    if (gameState.enemies.length === 0) return;
    if (actingEnemyId) return; 
    if (gameState.selectionState.active) return;
    if (card.unplayable) return; // Curse check

    audioService.playSound(card.type === CardType.ATTACK ? 'attack' : 'block');
    setLastActionType(card.type);
    setLastActionTime(Date.now());

    // --- GENETIC ALGORITHM LOGIC ---
    if (card.name === '学習アルゴリズム' || card.name === 'GENETIC_ALGORITHM') {
         // Find original in deck and upgrade its block permanently
         setGameState(prev => {
             const newDeck = prev.player.deck.map(c => {
                 if (c.id === card.id) {
                     const newBlock = (c.block || 0) + 2;
                     return { 
                         ...c, 
                         block: newBlock,
                         // Update description text roughly
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
      
      p.currentEnergy -= card.cost;
      p.cardsPlayedThisTurn++;
      if (card.type === CardType.ATTACK) p.attacksPlayedThisTurn++;

      if (p.powers['AFTER_IMAGE']) p.block += p.powers['AFTER_IMAGE'];
      if (p.powers['THOUSAND_CUTS']) {
          enemies.forEach(e => {
              e.currentHp -= p.powers['THOUSAND_CUTS'];
              e.floatingText = { id: `cut-${Date.now()}-${e.id}`, text: `${p.powers['THOUSAND_CUTS']}`, color: 'text-purple-400' };
          });
      }

      // --- Activations Loop (Echo Form, Burst) ---
      let activations = 1;
      if (p.echoes > 0) { activations++; p.echoes--; }
      if (card.type === CardType.SKILL && p.powers['BURST'] > 0) { activations++; p.powers['BURST']--; }
      if (card.type === CardType.ATTACK && p.relics.find(r => r.id === 'NECRONOMICON') && card.cost >= 2 && !p.turnFlags['NECRONOMICON_USED']) {
          activations++;
          p.turnFlags['NECRONOMICON_USED'] = true;
      }

      for (let act = 0; act < activations; act++) {
          
          // --- Multi-hit Loop (Twin Strike, Whirlwind, etc.) ---
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
                    
                    if (card.damageBasedOnBlock) baseDamage += p.block;
                    if (card.damagePerCardInHand) baseDamage += (p.hand.filter(c => c.id !== card.id).length) * card.damagePerCardInHand!;
                    if (card.damagePerAttackPlayed) baseDamage += (p.attacksPlayedThisTurn - 1) * card.damagePerAttackPlayed!;
                    if (card.damagePerStrike) baseDamage += (p.deck.filter(c => c.name.includes('ストライク') || c.name.includes('攻撃')).length) * card.damagePerStrike!;
                    if (card.damagePerCardInDraw) baseDamage += p.drawPile.length * card.damagePerCardInDraw!;

                    // Pen Nib Logic
                    let multiplier = 1;
                    if (card.type === CardType.ATTACK) {
                        p.relicCounters['PEN_NIB'] = (p.relicCounters['PEN_NIB'] || 0) + 1;
                        if (p.relicCounters['PEN_NIB'] >= 10) {
                            multiplier = 2;
                            p.relicCounters['PEN_NIB'] = 0;
                        }
                    }

                    let damage = Math.floor((baseDamage + strengthBonus) * multiplier);
                    if (e.vulnerable > 0) damage = Math.floor(damage * 1.5);
                    if (p.powers['ENVENOM']) applyDebuff(e, 'POISON', p.powers['ENVENOM']);
                    
                    if (e.block >= damage) { e.block -= damage; damage = 0; }
                    else { damage -= e.block; e.block = 0; }
                    
                    e.currentHp -= damage;
                    if (damage > 0) {
                        e.floatingText = { id: `dmg-${Date.now()}-${e.id}-${h}`, text: `${damage}`, color: 'text-white', iconType: 'sword' };
                    }

                    if (card.lifesteal && damage > 0) {
                        p.currentHp = Math.min(p.currentHp + damage, p.maxHp);
                    }
                    
                    if (e.currentHp <= 0) {
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
                                 }
                             });
                         }
                         if (card.capture) {
                             // Create card from enemy
                             const damageVal = Math.max(5, Math.floor(e.maxHp * 0.5));
                             const captured: ICard = {
                                 id: `captured-${e.id}-${Date.now()}`,
                                 name: e.name,
                                 type: CardType.ATTACK,
                                 target: TargetType.ENEMY,
                                 cost: 1,
                                 damage: damageVal,
                                 description: `${damageVal}ダメージ。廃棄。`,
                                 rarity: 'SPECIAL',
                                 textureRef: e.name, // Use enemy name to generate sprite on card
                                 exhaust: true
                             };
                             
                             p.deck.push(captured);
                             p.discardPile.push(captured);
                             e.floatingText = { id: `cap-${Date.now()}`, text: 'GET!', color: 'text-yellow-400' };
                         }
                    }
                });
              }

              // Effects Logic
              if (card.block) {
                  let blk = card.block;
                  if (p.powers['DEXTERITY']) blk += p.powers['DEXTERITY'];
                  p.block += blk;
              }
              if (card.doubleBlock) p.block *= 2;
              if (card.heal) p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
              if (card.energy) p.currentEnergy += card.energy;
              if (card.selfDamage) { 
                  p.currentHp -= card.selfDamage; 
                  if (p.powers['RUPTURE']) p.strength += p.powers['RUPTURE']; 
              }
              if (card.strength) p.strength += card.strength;
              if (card.vulnerable) targets.forEach(e => applyDebuff(e, 'VULNERABLE', card.vulnerable!));
              if (card.weak) targets.forEach(e => applyDebuff(e, 'WEAK', card.weak!));
              if (card.poison) {
                  let amt = card.poison;
                  if (p.relics.find(r => r.id === 'SNAKE_SKULL')) amt += 1; // Example relic logic
                  targets.forEach(e => applyDebuff(e, 'POISON', amt));
              }
              if (card.poisonMultiplier && targets.length > 0) {
                  targets.forEach(e => e.poison *= card.poisonMultiplier!);
              }
              
              if (card.upgradeHand) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
              }
              if (card.upgradeDeck) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  p.drawPile = p.drawPile.map(c => getUpgradedCard(c));
                  p.discardPile = p.discardPile.map(c => getUpgradedCard(c));
                  p.deck = p.deck.map(c => getUpgradedCard(c));
              }
              if (card.doubleStrength) p.strength *= 2;
              if (card.shuffleHandToDraw) { p.drawPile = shuffle([...p.drawPile, ...p.hand]); p.hand = []; }
              if (card.applyPower) p.powers[card.applyPower.id] = (p.powers[card.applyPower.id] || 0) + card.applyPower.amount;
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

              // Shuriken / Kunai / Fan Logic
              if (card.type === CardType.ATTACK) {
                  p.relicCounters['ATTACK_COUNT'] = (p.relicCounters['ATTACK_COUNT'] || 0) + 1;
                  if (p.relicCounters['ATTACK_COUNT'] % 3 === 0) {
                      if (p.relics.find(r => r.id === 'KUNAI')) p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1;
                      if (p.relics.find(r => r.id === 'SHURIKEN')) p.strength += 1;
                      if (p.relics.find(r => r.id === 'ORNAMENTAL_FAN')) p.block += 4;
                  }
              }

              // Remove dead enemies
              enemies = enemies.filter(e => e.currentHp > 0);
          }
      }

      // Card movement (Hand -> Discard/Exhaust)
      p.hand = p.hand.filter(c => c.id !== card.id);
      
      let shouldExhaust = card.exhaust;
      // Corruption makes skills exhaust
      if (card.type === CardType.SKILL && p.powers['CORRUPTION']) shouldExhaust = true;

      if (!shouldExhaust && !(card.type === CardType.POWER) && !(card.promptsExhaust === 99)) {
          p.discardPile.push(card);
      } else if (shouldExhaust || card.promptsExhaust === 99) {
          // Triggers on Exhaust
          if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
          // Dark Embrace could draw card here
      }

      let nextSelectionState = { ...prev.selectionState };
      if (card.promptsDiscard) nextSelectionState = { active: true, type: 'DISCARD', amount: card.promptsDiscard, originCardId: card.id };
      if (card.promptsCopy) nextSelectionState = { active: true, type: 'COPY', amount: card.promptsCopy, originCardId: card.id };
      if (card.promptsExhaust === 99) {
          if (card.name === '断捨離' || card.name === 'SEVER_SOUL') {
              // Exhaust non-attacks
              const cardsToExhaust = p.hand.filter(c => c.type !== CardType.ATTACK);
              if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
              p.hand = p.hand.filter(c => c.type === CardType.ATTACK);
          } else if (card.name === '焚き火' || card.name === 'FIEND_FIRE') {
               // Exhaust all
               if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * p.hand.length;
               p.hand = [];
          }
      }

      let nextSelectedId = prev.selectedEnemyId;
      if (!enemies.find(e => e.id === nextSelectedId) && enemies.length > 0) nextSelectedId = enemies[0].id;

      return { ...prev, player: p, enemies: enemies, selectedEnemyId: nextSelectedId, selectionState: nextSelectionState };
    });
  };

  const startPlayerTurn = () => {
    setTurnLog("あなたのターン");
    setGameState(prev => {
      const p = { ...prev.player };
      
      // 1. Start of Turn Stat Updates (Powers)
      if (p.powers['DEMON_FORM']) { 
          p.strength += p.powers['DEMON_FORM']; 
          p.floatingText = { id: `pow-demon-${Date.now()}`, text: '悪魔化', color: 'text-red-500' }; 
      }
      if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
      if (p.powers['DEVA_FORM']) p.maxEnergy += p.powers['DEVA_FORM'];
      if (p.powers['NOXIOUS_FUMES']) {
          const enemies = prev.enemies.map(e => {
              const newPoison = e.poison + p.powers['NOXIOUS_FUMES'];
              return { ...e, poison: newPoison };
          });
          prev.enemies = enemies; // Modify reference for immediate effect in UI if needed, but best return new state
      }
      
      // Relic: Mutagenic Strength (Lose Strength at end of turn 1, processed here as start of turn 2 cleanup)
      if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH') && prev.turn === 1) {
          p.strength -= 3;
          p.floatingText = { id: `relic-mutagen-${Date.now()}`, text: '筋力低下', color: 'text-gray-400' };
      }

      // Relic: Mercury Hourglass (Start of Turn Damage)
      if (p.relics.find(r => r.id === 'MERCURY_HOURGLASS')) {
          prev.enemies.forEach(e => {
              e.currentHp -= 3;
              e.floatingText = { id: `dmg-hg-${Date.now()}-${e.id}`, text: '3', color: 'text-gray-400', iconType: 'sword' };
          });
          prev.enemies = prev.enemies.filter(e => e.currentHp > 0);
      }

      // Relic: Horn Cleat (Turn 2 Start Block)
      if (prev.turn === 1 && p.relics.find(r => r.id === 'HORN_CLEAT')) {
          p.block += 14;
          p.floatingText = { id: `relic-horn-${Date.now()}`, text: '+14 Block', color: 'text-blue-400', iconType: 'shield' };
      }

      // Relic: Happy Flower (Every 3 turns)
      if (p.relics.find(r => r.id === 'HAPPY_FLOWER') && (prev.turn + 1) % 3 === 0) {
          p.currentEnergy += 1; // Will be added to base below
          p.floatingText = { id: `relic-flower-${Date.now()}`, text: '+1 Energy', color: 'text-yellow-400', iconType: 'zap' };
      }

      // 2. Prepare Draw & Discard Piles
      let newDrawPile = [...p.drawPile];
      let newDiscardPile = [...p.discardPile];
      let newHand: ICard[] = [];

      // 3. Discard Old Hand
      // Check for Retain (Bookmark)
      if (p.relics.find(r => r.id === 'BOOKMARK') && p.hand.length > 0) {
          newHand.push(p.hand[0]); // Keep first
          newDiscardPile = [...newDiscardPile, ...p.hand.slice(1)];
      } else {
          newDiscardPile = [...newDiscardPile, ...p.hand];
      }

      // 4. Calculate Draw Count
      let drawCount = HAND_SIZE + (p.powers['TOOLS_OF_THE_TRADE'] ? 1 : 0) + p.nextTurnDraw;
      p.nextTurnDraw = 0;

      // 5. Draw Loop
      for (let i = 0; i < drawCount; i++) {
        if (newDrawPile.length === 0) {
          if (newDiscardPile.length === 0) break;
          newDrawPile = shuffle(newDiscardPile);
          newDiscardPile = [];
        }
        const card = newDrawPile.pop();
        if (card) {
            if (card.name === '虚無' || card.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
            if (p.relics.find(r => r.id === 'SNECKO_EYE') && card.cost >= 0) {
                card.cost = Math.floor(Math.random() * 4);
            }
            newHand.push(card);
        }
      }

      // 6. Post-Draw / Start of Turn Effects (Card Generation/Modification)
      if (p.powers['CREATIVE_AI']) {
          const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
          const power = powers[Math.floor(Math.random() * powers.length)];
          newHand.push({ ...power, id: `ai-${Date.now()}`, cost: 0 });
      }
      if (p.powers['INFINITE_BLADES']) {
          newHand.push({ ...CARDS_LIBRARY['SHIV'], id: `inf-${Date.now()}` });
      }
      
      // Warped Tongs (Upgrade random card in NEW hand)
      if (p.relics.find(r => r.id === 'WARPED_TONGS') && newHand.length > 0) {
          const upgradeable = newHand.filter(c => !c.upgraded);
          if (upgradeable.length > 0) {
              const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
              const upgraded = getUpgradedCard(c);
              const idx = newHand.findIndex(x => x.id === c.id);
              if (idx !== -1) newHand[idx] = upgraded;
          }
      }

      // 7. Update Energy & Block
      // Ice Cream Logic: Keep previous energy
      let baseEnergy = p.maxEnergy + p.nextTurnEnergy;
      if (p.relics.find(r => r.id === 'ICE_CREAM')) {
          baseEnergy += p.currentEnergy;
      }
      p.currentEnergy = baseEnergy;
      p.nextTurnEnergy = 0;

      // Block Reset Logic (Barricade / Calipers)
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

      // Selection State for Tools of the Trade (Discard 1)
      let nextSelection = { ...prev.selectionState };
      if (p.powers['TOOLS_OF_THE_TRADE']) {
          nextSelection = { active: true, type: 'DISCARD', amount: 1 };
      }

      return { ...prev, player: p, enemies: prev.enemies, selectionState: nextSelection, turn: prev.turn + 1 };
    });
  };

  const handleEndTurn = async (skipEnemies?: boolean) => {
    audioService.playSound('select');
    setTurnLog("敵のターン...");
    setLastActionType(null);
    
    // --- Pre-Enemy Turn Player Effects (End of Turn) ---
    setGameState(prev => {
        const p = { ...prev.player };
        
        // Metallicize
        if (p.powers['METALLICIZE']) {
            p.block += p.powers['METALLICIZE'];
            p.floatingText = { id: `pow-metal-${Date.now()}`, text: `+${p.powers['METALLICIZE']}`, color: 'text-blue-400', iconType: 'shield' };
        }
        
        return { ...prev, player: p };
    });

    await wait(500);

    const enemies = [...gameState.enemies];
    for (const enemy of enemies) {
        if (gameState.player.currentHp <= 0) break;
        
        // Enemy Status Effects (Poison)
        if (enemy.poison > 0) {
            enemy.currentHp -= enemy.poison;
            enemy.poison--;
            enemy.floatingText = { id: `psn-${Date.now()}-${enemy.id}`, text: `${enemy.poison + 1}`, color: 'text-green-500', iconType: 'poison' };
            setGameState(prev => ({ ...prev, enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, currentHp: enemy.currentHp, poison: enemy.poison, floatingText: enemy.floatingText } : e) }));
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
            
            // Execute Intent
            const intent = e.nextIntent;
            e.block = 0; 

            if (intent.type === EnemyIntentType.ATTACK || intent.type === EnemyIntentType.ATTACK_DEBUFF || intent.type === EnemyIntentType.ATTACK_DEFEND) {
                let damage = intent.value + (e.strength || 0);
                if (e.weak > 0) damage = Math.floor(damage * 0.75);
                
                // Player defensive powers
                if (p.powers['INTANGIBLE'] > 0) damage = 1;
                
                // Hit check
                if (damage > 0) {
                    if (p.powers['BUFFER'] > 0) { 
                        p.powers['BUFFER']--; 
                        damage = 0; 
                    } else {
                        // Static Discharge
                        if (p.powers['STATIC_DISCHARGE']) {
                            // Damage random enemy
                            const target = newEnemies[Math.floor(Math.random() * newEnemies.length)];
                            target.currentHp -= p.powers['STATIC_DISCHARGE'];
                        }
                    }
                }

                // Block handling
                let unblockedDamage = 0;
                if (p.block >= damage) { 
                    p.block -= damage; 
                } else { 
                    unblockedDamage = damage - p.block; 
                    p.block = 0; 
                }
                
                p.currentHp -= unblockedDamage;
                if (unblockedDamage > 0) {
                    p.floatingText = { id: `dmg-${Date.now()}`, text: `-${unblockedDamage}`, color: 'text-red-500' };
                }

                // Thorns
                if (p.powers['THORNS'] && damage > 0) { // Thorns trigger on attack received
                    e.currentHp -= p.powers['THORNS'];
                    e.floatingText = { id: `thorns-${Date.now()}`, text: `${p.powers['THORNS']}`, color: 'text-orange-500', iconType: 'sword' };
                }
            }

            if (intent.type === EnemyIntentType.DEFEND || intent.type === EnemyIntentType.ATTACK_DEFEND) {
                e.block += intent.value; 
                if (intent.type === EnemyIntentType.ATTACK_DEFEND && intent.secondaryValue) e.block = intent.secondaryValue;
            }

            if (intent.type === EnemyIntentType.BUFF) {
                e.strength += (intent.secondaryValue || 2);
            }

            if (intent.type === EnemyIntentType.DEBUFF || intent.type === EnemyIntentType.ATTACK_DEBUFF) {
                if (p.powers['ARTIFACT'] > 0) {
                    p.powers['ARTIFACT']--;
                } else {
                    const debuffAmt = intent.secondaryValue || 1;
                    const type = intent.debuffType;
                    if (type === 'WEAK') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + debuffAmt;
                    if (type === 'VULNERABLE') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + debuffAmt;
                    if (type === 'POISON') {
                        // Apply Curse/Status card instead? Simple poison for player:
                        // Implemented: Shuffle Status card into deck
                        const status = { ...STATUS_CARDS.SLIMED, id: `slime-${Date.now()}` };
                        p.discardPile.push(status);
                    }
                }
            }
            
            // Enemy Turn End cleanups
            if (e.vulnerable > 0) e.vulnerable--;
            if (e.weak > 0) e.weak--;

            // Plan Next Intent
            e.nextIntent = getNextEnemyIntent(e, gameState.turn + 1);

            return { ...prev, player: p, enemies: newEnemies };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    // --- Post-Enemy Turn Player Effects (End of Round) ---
    setGameState(prev => {
        const p = { ...prev.player };
        
        // End of Battle Relic Checks (Run once per battle end, not turn end) - handled in useEffect
        // End of Turn Relic Checks
        if (p.relics.find(r => r.id === 'BURNING_BLOOD') && prev.enemies.length === 0) { // Safety check, mostly handled in useEffect
             // Logic in useEffect
        }

        // Regen
        if (p.powers['REGEN'] > 0) {
            const heal = p.powers['REGEN'];
            p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
            p.powers['REGEN']--;
            p.floatingText = { id: `pow-regen-${Date.now()}`, text: `+${heal}`, color: 'text-green-500', iconType: 'heart' };
        }

        // Nilry's Codex (Add random card to hand)
        if (p.relics.find(r => r.id === 'NILRYS_CODEX')) {
            const keys = Object.keys(CARDS_LIBRARY).filter(k => !STATUS_CARDS[k] && !CURSE_CARDS[k]);
            const k = keys[Math.floor(Math.random() * keys.length)];
            const c = { ...CARDS_LIBRARY[k], id: `nilry-${Date.now()}` };
            if (p.hand.length < HAND_SIZE + 5) {
                p.hand.push(c); // Add to hand directly for simplicity in this UI
            } else {
                p.discardPile.push(c);
            }
        }

        // Decrement Powers
        if (p.powers['INTANGIBLE'] > 0) p.powers['INTANGIBLE']--;
        if (p.powers['STRENGTH_DOWN']) { 
            p.strength -= p.powers['STRENGTH_DOWN']; 
            delete p.powers['STRENGTH_DOWN']; 
        }
        
        // Curse Logic
        p.hand.forEach(c => {
            if (c.name === 'やけど' || c.name === 'BURN') p.currentHp -= 2;
            if (c.name === '虫歯' || c.name === 'DECAY') p.currentHp -= 2;
            if (c.name === '不安' || c.name === 'DOUBT') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + 1;
            if (c.name === '恥' || c.name === 'SHAME') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + 1;
            if (c.name === '後悔' || c.name === 'REGRET') p.currentHp -= p.hand.length;
        });

        return { ...prev, player: p };
    });
    
    startPlayerTurn();
  };

  // --- Battle End Check ---
  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            audioService.playSound('win');
            audioService.stopBGM();
            
            // Relic: Burning Blood & Meat on the Bone (End of Battle)
            let hpRegen = 0;
            if (gameState.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen += 6;
            if (gameState.player.relics.find(r => r.id === 'MEAT_ON_THE_BONE') && gameState.player.currentHp <= gameState.player.maxHp / 2) hpRegen += 12;
            
            // Check for True Ending condition or Victory
            if (gameState.act >= 4 && !gameState.isEndless) {
                 setGameState(prev => ({ ...prev, screen: GameScreen.ENDING }));
                 storageService.saveScore({ 
                     id: `score-${Date.now()}`, playerName: 'Player', characterName: selectedCharName,
                     score: calculateScore(gameState, true), act: gameState.act, floor: gameState.floor, victory: true, date: Date.now(), challengeMode: gameState.challengeMode 
                 });
                 storageService.incrementClearCount();
            } else {
                 if (isMathDebugSkipped) {
                     // Auto-complete math
                     const bonus = 3 * 10;
                     // Need to apply regen as well since we skip the state update that applies it in the else block below
                     goToRewardPhase(VICTORY_GOLD + bonus, hpRegen);
                 } else {
                     // Go directly to math, applying regen to player state
                     setGameState(prev => ({ 
                        ...prev, 
                        player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) },
                        screen: GameScreen.MATH_CHALLENGE
                    }));
                    audioService.playBGM('math');
                 }
            }
        } else if (gameState.player.currentHp <= 0) {
            // Lizard Tail Check
            if (gameState.player.relics.find(r => r.id === 'LIZARD_TAIL') && !gameState.player.relicCounters['LIZARD_TAIL_USED']) {
                setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, currentHp: Math.floor(prev.player.maxHp * 0.5), relicCounters: { ...prev.player.relicCounters, 'LIZARD_TAIL_USED': 1 } }
                }));
                // Effect sound/anim here ideally
            } else if (gameState.player.potions.find(p => p.templateId === 'GHOST_IN_JAR')) {
                 setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, currentHp: Math.floor(prev.player.maxHp * 0.1), potions: prev.player.potions.filter(p => p.templateId !== 'GHOST_IN_JAR') }
                }));
            } else {
                audioService.playSound('lose');
                audioService.stopBGM();
                storageService.saveScore({ 
                     id: `score-${Date.now()}`, playerName: 'Player', characterName: selectedCharName,
                     score: calculateScore(gameState, false), act: gameState.act, floor: gameState.floor, victory: false, date: Date.now(), challengeMode: gameState.challengeMode
                });
                storageService.clearSave(); // Delete save on death
                setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
            }
        }
    }
  }, [gameState.enemies, gameState.player.currentHp, gameState.screen]);

  // --- Reward Logic ---
  const handleMathChallengeComplete = (count: number) => {
      // Bonus based on math score
      const bonusGold = count * 10;
      goToRewardPhase(VICTORY_GOLD + bonusGold);
  };

  const goToRewardPhase = (guaranteedGold: number = 0, hpRegen: number = 0) => {
    const rewards: RewardItem[] = [];
    
    // 0. Guaranteed Gold (Victory + Math)
    if (guaranteedGold > 0) {
        rewards.push({ type: 'GOLD', value: guaranteedGold, id: `rew-gold-victory-${Date.now()}` });
    }

    // 1. Card Reward
    const allCards = Object.values(CARDS_LIBRARY).filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL');
    while(rewards.length < (guaranteedGold > 0 ? 4 : 3)) { // 3 cards + 1 gold
        const roll = Math.random() * 100;
        let targetRarity = 'COMMON';
        if (roll > 95) targetRarity = 'LEGENDARY'; else if (roll > 65) targetRarity = 'RARE';
        else if (roll > 25) targetRarity = 'UNCOMMON';
        
        const pool = allCards.filter(c => c.rarity === targetRarity).length > 0 ? allCards.filter(c => c.rarity === targetRarity) : allCards;
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        if (!rewards.some(r => r.value.name === candidate.name)) {
            rewards.push({ type: 'CARD', value: { ...candidate, id: `reward-${Date.now()}-${rewards.length}` }, id: `rew-${Date.now()}-${rewards.length}` });
        }
    }

    // 2. Boss Relic Reward (If boss node)
    const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
    if (currentNode && currentNode.type === NodeType.BOSS) {
        const bossRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'BOSS');
        const relic = bossRelics[Math.floor(Math.random() * bossRelics.length)];
        rewards.push({ type: 'RELIC', value: relic, id: `rew-relic-${Date.now()}` });
    }

    // 3. Potion Reward (Chance)
    const potionChance = 0.4 + (gameState.player.relics.find(r => r.id === 'WHITE_BEAST_STATUE') ? 1.0 : 0);
    if (Math.random() < potionChance && !gameState.player.relics.find(r => r.id === 'SOZU')) {
        const allPotions = Object.values(POTION_LIBRARY);
        const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
        rewards.push({ type: 'POTION', value: { ...potion, id: `rew-pot-${Date.now()}` }, id: `rew-pot-${Date.now()}` });
    }

    // Elite Relic
    if (currentNode && currentNode.type === NodeType.ELITE) {
        const rareRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'RARE' || r.rarity === 'UNCOMMON');
        const relic = rareRelics[Math.floor(Math.random() * rareRelics.length)];
        rewards.push({ type: 'RELIC', value: relic, id: `rew-elite-${Date.now()}` });
    }

    setGameState(prev => ({ 
        ...prev, 
        player: hpRegen > 0 ? { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) } : prev.player,
        screen: GameScreen.REWARD, 
        rewards: rewards 
    }));
    audioService.playSound('select');
  };

  const handleRewardSelection = (item: RewardItem, replacePotionId?: string) => {
      if (isLoading) return;
      audioService.playSound('select');

      setGameState(prev => {
          let p = { ...prev.player };
          let nextRewards = [...prev.rewards];

          if (item.type === 'CARD') {
              p.deck = [...p.deck, item.value];
              p.discardPile = [...p.discardPile, item.value];
              storageService.saveUnlockedCard(item.value.name);
              // Remove ALL card rewards to enforce "Pick 1"
              nextRewards = nextRewards.filter(r => r.type !== 'CARD');
          } else if (item.type === 'RELIC') {
              p.relics = [...p.relics, item.value];
              storageService.saveUnlockedRelic(item.value.id);
              if (item.value.id === 'SOZU') p.maxEnergy += 1;
              if (item.value.id === 'CURSED_KEY') p.maxEnergy += 1;
              if (item.value.id === 'PHILOSOPHER_STONE') p.maxEnergy += 1;
              if (item.value.id === 'WAFFLE') { p.maxHp += 7; p.currentHp = p.maxHp; }
              if (item.value.id === 'OLD_COIN') p.gold += 300;
              nextRewards = nextRewards.filter(r => r.id !== item.id);
          } else if (item.type === 'GOLD') {
              p.gold += item.value;
              nextRewards = nextRewards.filter(r => r.id !== item.id);
          } else if (item.type === 'POTION') {
              if (p.potions.length < 3 || replacePotionId) {
                  let newPotions = [...p.potions];
                  if (replacePotionId) {
                      newPotions = newPotions.filter(pt => pt.id !== replacePotionId);
                  }
                  p.potions = [...newPotions, item.value];
                  storageService.saveUnlockedPotion(item.value.templateId);
                  nextRewards = nextRewards.filter(r => r.id !== item.id);
              }
          }
          
          if (nextRewards.length === 0) {
              setTimeout(finishRewardPhase, 500);
          }

          return { ...prev, player: p, rewards: nextRewards };
      });
  };

  const finishRewardPhase = () => {
      const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
      if (currentNode && currentNode.type === NodeType.BOSS && !gameState.isEndless && gameState.act < 4) {
          advanceAct();
      } else {
          handleNodeComplete();
      }
  };

  const advanceAct = () => {
      // Act 4 Logic
      if (gameState.act >= 3) {
          const bossNode: MapNode = { id: 'true-boss', x: 3, y: 0, type: NodeType.BOSS, nextNodes: [], completed: false };
          setGameState(prev => ({
              ...prev,
              act: 4,
              floor: 0,
              map: [bossNode],
              currentMapNodeId: null,
              screen: GameScreen.MAP,
              narrativeLog: [...prev.narrativeLog, "深淵のさらに奥底へ..."]
          }));
          return;
      }

      const nextAct = gameState.act + 1;
      const newMap = generateDungeonMap();
      setGameState(prev => ({
          ...prev,
          act: nextAct,
          floor: 0,
          map: newMap,
          currentMapNodeId: null,
          screen: GameScreen.MAP,
          narrativeLog: [...prev.narrativeLog, `第${nextAct}章へ進んだ。`]
      }));
  };

  const handleRestAction = () => {
      const heal = Math.floor(gameState.player.maxHp * 0.3);
      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.currentHp + heal, prev.player.maxHp) } }));
  };
  
  const handleUpgradeCard = (card: ICard) => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.map(c => c.id === card.id ? getUpgradedCard(c) : c) } }));
  };

  const handleSynthesizeCard = (c1: ICard, c2: ICard) => {
      const len1 = Math.floor(Math.random() * 3) + 2; 
      const len2 = Math.floor(Math.random() * 3) + 2; 
      const part1 = c1.name.substring(0, Math.min(len1, c1.name.length));
      const part2 = c2.name.substring(Math.max(0, c2.name.length - len2));
      const newName = part1 + part2;
      const newCost = Math.max(c1.cost, c2.cost);
      
      // Sum numeric stats
      const sum = (k: keyof ICard) => ((c1[k] as number) || 0) + ((c2[k] as number) || 0);
      const newDamage = sum('damage');
      const newBlock = sum('block');
      const newDraw = sum('draw');
      const newEnergy = sum('energy');
      const newHeal = sum('heal');
      const newPoison = sum('poison');
      const newWeak = sum('weak');
      const newVulnerable = sum('vulnerable');
      const newStrength = sum('strength');
      const newSelfDamage = sum('selfDamage');

      // Merge booleans
      const newExhaust = c1.exhaust || c2.exhaust;
      const newInnate = c1.innate || c2.innate;

      // Determine Type & Target
      let newType = c1.type;
      if (newDamage > 0) newType = CardType.ATTACK;
      else if (c1.type === CardType.POWER || c2.type === CardType.POWER) newType = CardType.POWER;
      else newType = CardType.SKILL;

      let newTarget = TargetType.ENEMY;
      if (c1.target === TargetType.ALL_ENEMIES || c2.target === TargetType.ALL_ENEMIES) newTarget = TargetType.ALL_ENEMIES;
      else if (c1.target === TargetType.RANDOM_ENEMY || c2.target === TargetType.RANDOM_ENEMY) newTarget = TargetType.RANDOM_ENEMY;
      else if (c1.target === TargetType.SELF || c2.target === TargetType.SELF) newTarget = TargetType.SELF;
      
      // If it deals damage or debuffs, force target to ENEMY if currently SELF
      if ((newDamage > 0 || newPoison > 0 || newWeak > 0 || newVulnerable > 0) && newTarget === TargetType.SELF) {
          newTarget = TargetType.ENEMY;
      }

      // Generate Description
      const parts: string[] = [];
      if (newDamage > 0) {
          if (newTarget === TargetType.ALL_ENEMIES) parts.push(`全体に${newDamage}ダメージ`);
          else if (newTarget === TargetType.RANDOM_ENEMY) parts.push(`ランダムな敵に${newDamage}ダメージ`);
          else parts.push(`${newDamage}ダメージ`);
      }
      if (newBlock > 0) parts.push(`ブロック${newBlock}`);
      if (newPoison > 0) parts.push(`ドクドク${newPoison}`);
      if (newWeak > 0) parts.push(`へろへろ${newWeak}`);
      if (newVulnerable > 0) parts.push(`びくびく${newVulnerable}`);
      if (newStrength > 0) parts.push(`ムキムキ${newStrength}`);
      if (newDraw > 0) parts.push(`${newDraw}枚引く`);
      if (newEnergy > 0) parts.push(`E${newEnergy}を得る`);
      if (newHeal > 0) parts.push(`HP${newHeal}回復`);
      if (newSelfDamage > 0) parts.push(`自分に${newSelfDamage}ダメージ`);
      
      let description = parts.join("。") + (parts.length > 0 ? "。" : "");
      if (parts.length === 0) description = "効果なし。";

      const newCard: ICard = {
          id: `synth-${Date.now()}`,
          name: newName,
          cost: newCost,
          type: newType,
          target: newTarget,
          description: description,
          rarity: 'SPECIAL',
          damage: newDamage || undefined,
          block: newBlock || undefined,
          draw: newDraw || undefined,
          energy: newEnergy || undefined,
          heal: newHeal || undefined,
          poison: newPoison || undefined,
          weak: newWeak || undefined,
          vulnerable: newVulnerable || undefined,
          strength: newStrength || undefined,
          selfDamage: newSelfDamage || undefined,
          exhaust: newExhaust,
          innate: newInnate,
          textureRef: c1.textureRef || c1.name 
      };
      
      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              deck: [...prev.player.deck.filter(c => c.id !== c1.id && c.id !== c2.id), newCard]
          }
      }));
      
      return newCard;
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
      audioService.playBGM('menu');
  };

  const returnToTitle = () => {
    audioService.stopBGM();
    // Explicitly reset challengeMode to prevent it from carrying over
    setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU, challengeMode: undefined }));
  };

  const handleLegacyCardSelect = (card: ICard) => {
      storageService.saveLegacyCard(card);
      setLegacyCardSelected(true);
  };

  const handleRetry = () => {
      setLegacyCardSelected(false);
      startGame(); // Or redirect to Character Selection
  };

  // --- Render ---
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[600px] border-[10px] md:border-[20px] border-gray-800 rounded-xl relative overflow-hidden shadow-2xl bg-black crt-scanline">
            
            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center p-8 w-full flex flex-col items-center">
                        <h1 
                            className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-600 mb-2 font-bold animate-pulse tracking-widest leading-tight cursor-pointer select-none"
                            onClick={handleTitleClick}
                        >
                            算数ローグ<br/><span className="text-4xl">伝説の小学生</span>
                        </h1>
                        {isMathDebugSkipped && (
                            <div className="text-red-500 font-bold mb-1 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse">
                                (デバッグ: 計算スキップ ON)
                            </div>
                        )}
                        {isDebugHpOne && (
                            <div className="text-red-500 font-bold mb-6 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse">
                                (デバッグ: 敵HP1 & Loadout ON)
                            </div>
                        )}
                        {(!isMathDebugSkipped && !isDebugHpOne) && <div className="mb-8 h-6"></div>}

                        <div className="flex flex-col gap-3 items-center w-full max-w-[280px]">
                            {hasSave && (
                                <button onClick={continueGame} className="w-full bg-blue-900 text-white py-3 px-4 text-lg font-bold border-2 border-blue-400 hover:bg-blue-800 cursor-pointer flex items-center justify-center shadow-lg relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                    <Play className="mr-2 fill-current" /> つづきから
                                </button>
                            )}
                            <button onClick={startGame} disabled={isLoading} className="w-full bg-gray-100 text-black py-3 px-4 text-lg font-bold border-b-4 border-r-4 border-gray-500 hover:bg-white hover:border-gray-400 hover:translate-x-[1px] hover:translate-y-[1px] active:border-0 active:translate-y-[4px] active:translate-x-[4px] transition-all cursor-pointer shadow-lg flex items-center justify-center">
                                {isLoading ? "生成中..." : "冒険を始める"}
                            </button>
                            
                            <button onClick={startChallengeGame} disabled={isLoading} className="w-full bg-red-900/80 text-red-100 py-2 px-4 text-sm font-bold border border-red-500 hover:bg-red-800 cursor-pointer flex items-center justify-center shadow-md hover:shadow-red-900/50">
                                <Swords className="mr-2" size={16}/> 1A1Dモード
                            </button>

                            {/* New Mini Game Button */}
                            <button onClick={startPokerGame} className="w-full bg-indigo-900/80 text-indigo-100 py-2 px-4 text-sm font-bold border border-indigo-500 hover:bg-indigo-800 cursor-pointer flex items-center justify-center shadow-md hover:shadow-indigo-900/50">
                                <Club className="mr-2" size={16}/> ミニゲーム：放課後ポーカー
                            </button>

                            {isDebugHpOne && (
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.DEBUG_MENU }))} className="w-full bg-gray-800 text-red-400 py-2 px-4 text-sm font-bold border border-red-500 hover:bg-gray-700 cursor-pointer flex items-center justify-center shadow-md mb-2">
                                    <Zap className="mr-2" size={16}/> デバッグメニュー
                                </button>
                            )}

                            <div className="flex gap-2 w-full justify-between mt-2">
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.COMPENDIUM }))} className="flex-1 bg-gray-800 text-amber-500 py-2 text-[10px] font-bold border border-gray-600 hover:border-amber-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                    <BookOpen className="mb-1" size={18}/> 図鑑
                                </button>
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.RANKING }))} className="flex-1 bg-gray-800 text-green-500 py-2 text-[10px] font-bold border border-gray-600 hover:border-green-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                    <Trophy className="mb-1" size={18}/> 記録
                                </button>
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.HELP }))} className="flex-1 bg-gray-800 text-blue-400 py-2 text-[10px] font-bold border border-gray-600 hover:border-blue-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center justify-center h-14 rounded">
                                    <HelpCircle className="mb-1" size={18}/> 遊び方
                                </button>
                            </div>

                            <button onClick={() => setShowDebugLog(true)} className="text-gray-600 text-[10px] hover:text-gray-400 mt-2 flex items-center justify-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <Terminal size={10}/> v2.3.2
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
                            System Update Log v2.3.2
                        </h2>
                        <div className="space-y-4 text-sm font-mono text-gray-300 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <section>
                                <h3 className="text-white font-bold mb-1">■ 修正 (Fix)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>戦闘終了時の報酬画面フローを改善しました。</li>
                                    <li>勝利画面をスキップし、直接算数チャレンジへ移行します。</li>
                                    <li>獲得ゴールドを合算して表示するように変更しました。</li>
                                    <li>カード合成時の効果テキストを詳細に表示するように修正しました。</li>
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

            {gameState.screen === GameScreen.MINI_GAME_POKER && (
                <PokerGameScreen onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MODE_SELECTION && (
                <div className="w-full h-full bg-gray-900 flex flex-col items-center text-white p-4 overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-2xl flex flex-col items-center my-auto">
                        <h2 className="text-3xl font-bold mb-2 text-yellow-400 mt-4">計算モード選択</h2>
                        {gameState.challengeMode === '1A1D' && <p className="text-red-400 mb-6 font-bold animate-pulse">※1A1Dチャレンジモード適用中</p>}
                        {debugLoadout && <p className="text-green-400 mb-6 font-bold animate-pulse font-mono">※DEBUG LOADOUT ACTIVE</p>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <button onClick={() => handleModeSelect(GameMode.ADDITION)} className="bg-red-900 border-2 border-red-500 p-4 md:p-6 rounded-xl hover:bg-red-800 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <Plus size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">たし算</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.SUBTRACTION)} className="bg-blue-900 border-2 border-blue-500 p-4 md:p-6 rounded-xl hover:bg-blue-800 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <Minus size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">ひき算</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.MULTIPLICATION)} className="bg-green-900 border-2 border-green-500 p-4 md:p-6 rounded-xl hover:bg-green-800 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <MultiplyIcon size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">かけ算</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.DIVISION)} className="bg-yellow-700 border-2 border-yellow-500 p-4 md:p-6 rounded-xl hover:bg-yellow-600 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <Divide size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">わり算</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.MIXED)} className="bg-purple-900 border-2 border-purple-500 p-4 md:p-6 rounded-xl hover:bg-purple-800 flex flex-col items-center sm:col-span-2 transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                <Shuffle size={40} className="mb-2"/> <span className="text-lg md:text-xl font-bold">ミックス</span>
                            </button>
                        </div>
                        <button onClick={returnToTitle} className="mt-8 text-gray-400 hover:text-white underline mb-8">戻る</button>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.CHARACTER_SELECTION && (
                <CharacterSelectionScreen 
                    characters={CHARACTERS} 
                    unlockedCount={Math.min(CHARACTERS.length, clearCount + 2)} 
                    onSelect={handleCharacterSelect} 
                    challengeMode={gameState.challengeMode}
                />
            )}

            {gameState.screen === GameScreen.RELIC_SELECTION && (
                <RelicSelectionScreen relics={starterRelics} onSelect={handleRelicSelect} />
            )}

            {gameState.screen === GameScreen.COMPENDIUM && (
                <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.RANKING && (
                <RankingScreen onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.HELP && (
                <HelpScreen onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MAP && (
                <MapScreen nodes={gameState.map} currentNodeId={gameState.currentMapNodeId} onNodeSelect={handleNodeSelect} player={gameState.player} />
            )}

            {gameState.screen === GameScreen.BATTLE && (
                <BattleScene 
                    player={gameState.player} enemies={gameState.enemies} selectedEnemyId={gameState.selectedEnemyId} onSelectEnemy={handleSelectEnemy} onPlayCard={handlePlayCard} onEndTurn={handleEndTurn} turnLog={turnLog} narrative={currentNarrative} lastActionTime={lastActionTime} lastActionType={lastActionType} actingEnemyId={actingEnemyId} selectionState={gameState.selectionState} onHandSelection={handleHandSelection}
                    onUsePotion={handleUsePotion}
                />
            )}

            {/* Victory Screen is removed as per request to skip directly to Math Challenge */}

            {gameState.screen === GameScreen.MATH_CHALLENGE && (
                <MathChallengeScreen mode={gameState.mode} onComplete={handleMathChallengeComplete} />
            )}

            {gameState.screen === GameScreen.REWARD && (
                <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} currentPotions={gameState.player.potions} />
            )}

            {gameState.screen === GameScreen.REST && (
                <RestScreen 
                    player={gameState.player} 
                    onRest={handleRestAction} 
                    onUpgrade={handleUpgradeCard} 
                    onSynthesize={handleSynthesizeCard}
                    onLeave={handleNodeComplete} 
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
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - cost, deck: prev.player.deck.filter(c => c.id !== cardId) } }));
                    }}
                    onLeave={handleNodeComplete}
                />
            )}

            {gameState.screen === GameScreen.EVENT && eventData && (
                <EventScreen 
                    title={eventData.title} 
                    description={eventData.description} 
                    options={eventData.options} 
                    resultLog={eventResultLog}
                    onContinue={handleNodeComplete}
                />
            )}

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
                                            <Card card={card} onClick={() => handleLegacyCardSelect(card)} disabled={false} />
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
                            <button onClick={handleRetry} className="bg-black border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-800 flex items-center justify-center"><RotateCcw className="mr-2" size={20} /> 再挑戦</button>
                            <button onClick={returnToTitle} className="bg-gray-700 border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-600 flex items-center justify-center"><Home className="mr-2" size={20} /> タイトルへ戻る</button>
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
                                            <Card card={card} onClick={() => handleLegacyCardSelect(card)} disabled={false} />
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
                                伝説となる (タイトルへ)
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
