
import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, GameScreen, Enemy, Card as ICard, 
  CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion, Player, EnemyIntent, Character, FloatingText, RankingEntry, GameMode
} from './types';
import { 
  INITIAL_HP, INITIAL_ENERGY, HAND_SIZE, 
  CARDS_LIBRARY, STARTING_DECK_TEMPLATE, STATUS_CARDS, CURSE_CARDS, EVENT_CARDS, RELIC_LIBRARY, TRUE_BOSS, POTION_LIBRARY, CHARACTERS, HERO_IMAGE_DATA
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
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle } from 'lucide-react';

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
    }

    // Specific Card Upgrade Logic overrides
    if (card.name === 'ボディスラム' || card.name === 'BODY_SLAM') newCard.cost = 0; 
    if (card.name === '限界突破' || card.name === 'LIMIT_BREAK') newCard.exhaust = false;
    
    return newCard;
};

const createDamageText = (amount: number, type: 'DAMAGE' | 'HEAL' | 'BLOCK'): FloatingText => {
    return {
        id: Date.now().toString() + Math.random(),
        text: type === 'HEAL' ? `+${amount}` : type === 'BLOCK' ? `+${amount}` : `-${amount}`,
        color: type === 'HEAL' ? 'text-green-500' : type === 'BLOCK' ? 'text-blue-400' : 'text-red-500',
        iconType: type === 'DAMAGE' ? 'sword' : type === 'BLOCK' ? 'shield' : 'heart'
    };
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
    if (name.includes('先生') || name.includes('用務員')) return 'TEACHER'; // High dmg, Buffs
    if (name.includes('ゴーレム') || name.includes('主') || name.includes('守護者')) return 'TANK'; // High block
    if (name.includes('亡霊') || name.includes('幽霊') || name.includes('花子')) return 'GHOST'; // Intangible/Debuff
    if (name.includes('悪魔') || name.includes('不良') || name.includes('カラス')) return 'AGGRESSIVE'; // Multi-hit
    if (name.includes('宿題') || name.includes('ミミック') || name.includes('泥棒')) return 'TRICKSTER'; // Debuff/Special
    if (name.includes('虫') || name.includes('妖精') || name.includes('カス')) return 'SWARM'; // Low HP, Group
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
      floatingText: null
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
          gameState.screen !== GameScreen.MODE_SELECTION
          ) {
          
          storageService.saveGame(gameState);
      }
  }, [gameState]);

  useEffect(() => {
    const unlocked = storageService.getUnlockedCards();
    setUnlockedCardNames(unlocked);
    setHasSave(storageService.hasSaveFile());
    setClearCount(storageService.getClearCount());
  }, []);

  // --- Battle End Check ---
  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            // Victory!
            audioService.stopBGM();
            
            if (gameState.act === 4) {
                 // TRUE ENDING - Skip Math
                 audioService.playSound('win');
                 setGameState(prev => ({ ...prev, screen: GameScreen.ENDING }));
                 recordScore(true);
                 storageService.incrementClearCount();
            } else {
                 // STANDARD VICTORY -> GO TO MATH CHALLENGE
                 setGameState(prev => ({ 
                    ...prev, 
                    screen: GameScreen.MATH_CHALLENGE
                }));
            }
        } else if (gameState.player.currentHp <= 0) {
            if (gameState.player.relics.find(r => r.id === 'LIZARD_TAIL')) {
                // Lizard Tail Revive
                audioService.playSound('block');
                setGameState(prev => ({
                    ...prev,
                    player: {
                        ...prev.player,
                        currentHp: Math.floor(prev.player.maxHp / 2),
                        relics: prev.player.relics.filter(r => r.id !== 'LIZARD_TAIL')
                    }
                }));
                // Force a narrative update to explain
                setTurnLog("トカゲの尻尾が身代わりになった！");
            } else if (gameState.player.potions.find(p => p.templateId === 'GHOST_IN_JAR')) {
                // Ghost in Jar Revive
                audioService.playSound('block');
                const revivePotion = gameState.player.potions.find(p => p.templateId === 'GHOST_IN_JAR');
                setGameState(prev => ({
                    ...prev,
                    player: {
                        ...prev.player,
                        currentHp: Math.floor(prev.player.maxHp * 0.1),
                        potions: prev.player.potions.filter(p => p.id !== revivePotion?.id),
                        powers: { ...prev.player.powers, 'INTANGIBLE': (prev.player.powers['INTANGIBLE'] || 0) + 1 }
                    }
                }));
                setTurnLog("お守りが発動した！");
            } else {
                audioService.playSound('lose');
                audioService.stopBGM();
                recordScore(false);
                storageService.clearSave();
                setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
            }
        }
    }
  }, [gameState.enemies, gameState.player.currentHp, gameState.screen]);

  const handleMathChallengeComplete = (correctCount: number) => {
      audioService.playSound('win');
      
      // Relic: Burning Blood Healing
      let hpRegen = 0;
      if (gameState.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;

      // Bonus gold for correct math answers
      const bonusGold = correctCount * 10; 

      setGameState(prev => ({ 
          ...prev, 
          player: { 
              ...prev.player, 
              gold: prev.player.gold + VICTORY_GOLD + bonusGold, 
              currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) 
          },
          screen: GameScreen.VICTORY
      }));
  };

  const unlockCards = (cards: ICard[]) => {
      let updated = false;
      const currentUnlocked = [...storageService.getUnlockedCards()]; 
      cards.forEach(card => {
          if (!currentUnlocked.includes(card.name)) {
              currentUnlocked.push(card.name);
              storageService.saveUnlockedCard(card.name);
              updated = true;
          }
      });
      if (updated) setUnlockedCardNames(currentUnlocked);
  };

  const recordScore = (victory: boolean) => {
      const score = calculateScore(gameState, victory);
      storageService.saveScore({
          id: Date.now().toString(),
          playerName: 'Player', 
          characterName: selectedCharName,
          score: score,
          act: gameState.act,
          floor: gameState.floor,
          victory: victory,
          date: Date.now()
      });
  };

  // --- Start Game Logic ---
  const startGame = async () => {
    try {
        setErrorMessage("");
        setIsLoading(true);
        audioService.init();
        audioService.playSound('select');
        audioService.playBGM('menu');
        storageService.clearSave(); 
        
        // Go to Mode Selection First
        setGameState(prev => ({
            ...prev,
            screen: GameScreen.MODE_SELECTION
        }));

    } catch (e) {
        console.error("Start Game Error:", e);
        setErrorMessage("エラーが発生しました。");
    } finally {
        setIsLoading(false);
    }
  };

  const handleModeSelect = (mode: GameMode) => {
      audioService.playSound('select');
      setGameState(prev => ({
          ...prev,
          mode: mode,
          screen: GameScreen.CHARACTER_SELECTION
      }));
  };

  const handleCharacterSelect = (char: Character) => {
      audioService.playSound('select');
      setSelectedCharName(char.name);
      
      const initialDeck = createDeck(char.deckTemplate);
      unlockCards(initialDeck);

      const commonRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON');
      const shuffled = shuffle(commonRelics);
      const bonusRelics = shuffled.slice(0, 2);
      setStarterRelics(bonusRelics);

      const startingRelic = RELIC_LIBRARY[char.startingRelicId] || RELIC_LIBRARY.BURNING_BLOOD;

      setGameState(prev => ({
          ...prev,
          screen: GameScreen.RELIC_SELECTION,
          act: 1,
          floor: 0,
          turn: 0,
          map: [],
          currentMapNodeId: null, 
          player: {
              ...prev.player,
              maxHp: char.maxHp,
              currentHp: char.maxHp,
              gold: char.gold,
              deck: initialDeck,
              relics: [startingRelic],
              maxEnergy: INITIAL_ENERGY + (startingRelic.id === 'HOLY_WATER' || startingRelic.id === 'LANTERN' ? 1 : 0), 
              currentEnergy: INITIAL_ENERGY,
              block: 0,
              strength: startingRelic.id === 'VAJRA' ? 1 : 0,
              hand: [],
              discardPile: [],
              drawPile: [],
              potions: [],
              powers: {},
              echoes: 0,
              cardsPlayedThisTurn: 0,
              attacksPlayedThisTurn: 0,
              relicCounters: {},
              turnFlags: {},
              imageData: char.imageData,
              floatingText: null
          },
          enemies: [],
          selectedEnemyId: null,
          narrativeLog: [`${char.name}の冒険が始まった。`],
          rewards: [],
          selectionState: { active: false, type: 'DISCARD', amount: 0 },
          isEndless: false
      }));
  };

  const continueGame = () => {
      const savedState = storageService.loadGame();
      if (savedState) {
          audioService.init();
          audioService.playSound('select');
          
          // Legacy save fix: Add mode if missing
          if (!savedState.mode) {
              savedState.mode = GameMode.MULTIPLICATION;
          }

          setGameState(savedState);
          
          if (savedState.screen === GameScreen.BATTLE) {
              audioService.playBGM('battle');
              setCurrentNarrative("戦闘再開...");
          } else {
              audioService.playBGM('menu');
          }
      }
  };

  const handleRelicSelect = (relic: Relic) => {
      const map = generateDungeonMap();
      setGameState(prev => {
          const counters = { ...prev.player.relicCounters };
          if (relic.id === 'PEN_NIB') counters['PEN_NIB'] = 0;
          
          return {
            ...prev,
            screen: GameScreen.MAP,
            map: map,
            player: {
                ...prev.player,
                relics: [...prev.player.relics, relic],
                maxEnergy: relic.id === 'HOLY_WATER' ? prev.player.maxEnergy + 1 : prev.player.maxEnergy,
                relicCounters: counters
            }
          };
      });
  };

  const startEndlessMode = () => {
      const nextAct = gameState.act + 1;
      const newMap = generateDungeonMap();
      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          act: nextAct,
          floor: 0,
          map: newMap,
          currentMapNodeId: null,
          narrativeLog: [...prev.narrativeLog, `エンドレスモード突入！ Act ${nextAct} 開始。`],
          isEndless: true,
          player: {
              ...prev.player,
              currentHp: prev.player.maxHp 
          }
      }));
      audioService.playBGM('menu');
  };

  const advanceAct = () => {
      if (gameState.act >= 3 && !gameState.isEndless) {
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

  const returnToTitle = () => {
    audioService.stopBGM();
    setShopCards([]);
    setEventData(null);
    setEventResultLog(null);
    setHasSave(storageService.hasSaveFile());
    setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }));
  };

  // --- School Themed Events ---
  const generateEvent = (player: Player) => {
      const random = Math.random();
      const events = [
          {
              title: "給食のおばちゃん",
              description: "「あら、たくさん余っちゃったのよ。食べていく？」",
              options: [
                  { label: "牛乳", text: "HPを20回復。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } })); handleNodeComplete(); } },
                  { label: "揚げパン", text: "最大HP+5。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } })); handleNodeComplete(); } },
                  { label: "謎の袋", text: "レリックを得る。呪いを受ける。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.WARPED_TONGS], deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `curse-${Date.now()}` }] } })); handleNodeComplete(); } }
              ]
          },
          {
              title: "保健室の先生",
              description: "「怪我をしてるの？ 治療してあげるわよ。」",
              options: [
                  { label: "相談", text: "カードを1枚削除 (50円)", action: () => { if(player.gold >= 50) { setGameState(prev => ({...prev, screen: GameScreen.SHOP, player: {...prev.player, gold: prev.player.gold - 50 }})); } else { handleNodeComplete(); } } },
                  { label: "治療", text: "HP全回復 (35円)", action: () => { if(player.gold >= 35) { setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - 35, currentHp: prev.player.maxHp } })); handleNodeComplete(); } else handleNodeComplete(); } },
                  { label: "大丈夫", text: "立ち去る", action: () => handleNodeComplete() }
              ]
          },
          {
              title: "校長先生のカツラ",
              description: "突風が吹き、目の前に校長先生のカツラが落ちてきた！",
              options: [
                  { label: "ネコババ", text: "こっそり売る (100円獲得)", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } })); handleNodeComplete(); } },
                  { label: "届ける", text: "正直に返す (レリック獲得)", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.OLD_COIN] } })); handleNodeComplete(); } },
                  { label: "被る", text: "パワーを得る (最大HP+10, 呪い)", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 10, currentHp: prev.player.currentHp + 10, deck: [...prev.player.deck, { ...CURSE_CARDS.SHAME, id: `wig-${Date.now()}` }] } })); handleNodeComplete(); } }
              ]
          },
          {
              title: "怪しいゲーム機",
              description: "「ゲームボーイ」が落ちている。電源が入っている...",
              options: [
                  { label: "遊ぶ", text: "HP10回復。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } })); handleNodeComplete(); } },
                  { label: "売る", text: "50円獲得。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } })); handleNodeComplete(); } }
              ]
          },
          {
              title: "タイムカプセル",
              description: "誰かが埋めたタイムカプセルを見つけた。",
              options: [
                  { label: "掘り出す", text: "レリックを得るが、呪い「後悔」を受ける。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MATRYOSHKA], deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `regret-${Date.now()}` }] } })); handleNodeComplete(); } },
                  { label: "埋める", text: "カードを1枚削除。", action: () => { setGameState(prev => ({ ...prev, screen: GameScreen.SHOP })); } }
              ]
          }
      ];
      return events[Math.floor(random * events.length)];
  };

  const handleNodeSelect = async (node: MapNode) => {
      setIsLoading(true);
      audioService.playSound('select');
      
      const nextState = { ...gameState, currentMapNodeId: node.id, floor: node.y + 1 };
      
      try {
        if (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS || node.type === NodeType.START) {
            
            const actMultiplier = gameState.act; 
            const floorDifficulty = node.y * (1 + (actMultiplier * 0.5));
            
            let enemies: Enemy[] = [];
            
            if (gameState.act === 4 && node.type === NodeType.BOSS) {
                // TRUE BOSS
                enemies.push({
                    id: 'true-boss',
                    enemyType: 'THE_HEART',
                    name: TRUE_BOSS.name,
                    maxHp: TRUE_BOSS.maxHp,
                    currentHp: TRUE_BOSS.maxHp,
                    block: 0,
                    strength: 0,
                    nextIntent: { type: EnemyIntentType.BUFF, value: 0 },
                    vulnerable: 0, weak: 0, poison: 0, artifact: 2, corpseExplosion: false,
                    floatingText: null
                });
                audioService.playBGM('battle'); 
            } else {
                const numEnemies = node.type === NodeType.BOSS ? 1 : Math.floor(Math.random() * Math.min(3, 1 + Math.floor(node.y / 3))) + 1;
                for (let i = 0; i < numEnemies; i++) {
                    const baseHp = (node.type === NodeType.BOSS ? 100 : 15) * actMultiplier + floorDifficulty + (node.type === NodeType.ELITE ? 20 : 0);
                    const name = await generateEnemyName(node.y);
                    const eType = determineEnemyType(name, node.type === NodeType.BOSS);
                    
                    enemies.push({
                        id: `enemy-${node.y}-${i}-${Date.now()}`,
                        enemyType: eType,
                        name: node.type === NodeType.BOSS ? `ボス: ${name}` : name,
                        maxHp: Math.floor(baseHp),
                        currentHp: Math.floor(baseHp),
                        block: 0,
                        strength: 0,
                        nextIntent: { type: EnemyIntentType.ATTACK, value: Math.floor((5 + node.y) * actMultiplier) },
                        vulnerable: 0, weak: 0, poison: 0, artifact: 0, corpseExplosion: false,
                        floatingText: null
                    });
                }
            }

            const flavor = await generateFlavorText(node.type === NodeType.BOSS ? "ボスが現れた！" : "敵と遭遇した。");
            
            const p = { ...nextState.player };
            p.drawPile = shuffle([...p.deck]);
            p.hand = [];
            p.discardPile = [];
            p.currentEnergy = p.maxEnergy;
            p.block = 0;
            p.strength = 0;
            // Relic: Mutagenic Strength
            if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) p.strength += 3;

            p.powers = {};
            // Relic: Enchiridion
            if (p.relics.find(r => r.id === 'ENCHIRIDION')) {
                const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
                const power = powers[Math.floor(Math.random() * powers.length)];
                p.hand.push({ ...power, id: `ench-${Date.now()}`, cost: 0 }); 
            }
            if (p.relics.find(r => r.id === 'RED_MASK')) enemies.forEach(e => e.weak += 1);
            if (p.relics.find(r => r.id === 'MEGAPHONE')) enemies.forEach(e => e.vulnerable += 1);

            p.echoes = 0;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;
            p.turnFlags = {}; 

            // Relic effects (Vajra, Bag of Prep, etc.)
            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            let drawCount = HAND_SIZE;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNEAKERS')) drawCount += 2;
            
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = 3; 
            
            // Initial Draw
            for(let i=0; i<drawCount; i++) {
                const c = p.drawPile.pop();
                if(c) p.hand.push(c);
            }
            
            // Innate Cards logic
            const innateCards = p.drawPile.filter(c => c.innate);
            innateCards.forEach(c => {
                 p.drawPile = p.drawPile.filter(dc => dc.id !== c.id);
                 p.hand.push(c);
            });

            // Calculate specific intents for the generated enemies
            enemies = enemies.map(e => ({
                ...e,
                nextIntent: getNextEnemyIntent(e, 1)
            }));

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
            audioService.playBGM('battle');
            setTurnLog("あなたのターン");

        } else if (node.type === NodeType.REST) {
            setGameState({ ...nextState, screen: GameScreen.REST });
            audioService.playBGM('menu');

        } else if (node.type === NodeType.SHOP) {
            // Generate Shop Content
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

            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'SHOP' || r.rarity === 'COMMON' || r.rarity === 'UNCOMMON' || r.rarity === 'RARE');
            const relicOptions = shuffle(allRelics).slice(0, 2);
            setShopRelics(relicOptions);

            const allPotions = Object.values(POTION_LIBRARY);
            const potionOptions: Potion[] = shuffle(allPotions).slice(0, 3).map(p => ({ ...p, id: `shop-pot-${Date.now()}-${Math.random()}` }));
            setShopPotions(potionOptions);

            setGameState({ ...nextState, screen: GameScreen.SHOP });
            audioService.playBGM('menu');

        } else if (node.type === NodeType.EVENT) {
            const ev = generateEvent(nextState.player);
            setEventData(ev);
            setGameState({ ...nextState, screen: GameScreen.EVENT });
            audioService.playBGM('menu');
        } else if (node.type === NodeType.TREASURE) {
            setGameState({ ...nextState, screen: GameScreen.TREASURE });
            audioService.playBGM('menu');
        }

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleNodeComplete = () => {
      setEventResultLog(null); 
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

  // --- Battle Logic (Start Player Turn, Play Card, End Turn) ---
  const startPlayerTurn = () => {
    setTurnLog("あなたのターン");
    setGameState(prev => {
      const p = { ...prev.player };
      
      if (p.powers['DEMON_FORM']) p.strength += p.powers['DEMON_FORM'];
      if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
      if (p.powers['DEVA_FORM']) p.maxEnergy += p.powers['DEVA_FORM']; 
      if (p.powers['METALLICIZE']) p.block += p.powers['METALLICIZE'];
      if (p.powers['REGEN']) { p.currentHp = Math.min(p.maxHp, p.currentHp + p.powers['REGEN']); p.floatingText = createDamageText(p.powers['REGEN'], 'HEAL'); p.powers['REGEN']--; }
      
      // NOXIOUS FUMES: Safe mutation
      let currentEnemies = [...prev.enemies];
      if (p.powers['NOXIOUS_FUMES']) { 
          currentEnemies = currentEnemies.map(e => ({
              ...e,
              poison: (e.poison || 0) + p.powers['NOXIOUS_FUMES']
          }));
      }

      if (p.powers['INFINITE_BLADES']) p.hand.push({ ...CARDS_LIBRARY['SLICE'], id: `blade-${Date.now()}`, cost: 0 });
      if (p.powers['CREATIVE_AI']) { 
          const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
          const power = powers[Math.floor(Math.random() * powers.length)];
          p.hand.push({ ...power, id: `ai-${Date.now()}` });
      }
      
      // Relic checks
      if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH') && prev.turn === 1) p.strength -= 3;
      if (p.relics.find(r => r.id === 'WARPED_TONGS') && p.hand.length > 0) {
          const c = p.hand[Math.floor(Math.random() * p.hand.length)];
          p.hand = p.hand.map(card => card.id === c.id ? getUpgradedCard(c) : card);
      }
      if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) {
          p.relicCounters['HAPPY_FLOWER'] = (p.relicCounters['HAPPY_FLOWER'] || 0) + 1;
          if (p.relicCounters['HAPPY_FLOWER'] >= 3) {
              p.currentEnergy += 1;
              p.relicCounters['HAPPY_FLOWER'] = 0;
          }
      }

      // Draw Phase
      let drawCount = HAND_SIZE;
      if (p.powers['TOOLS_OF_THE_TRADE']) drawCount += 1;
      if (p.relics.find(r => r.id === 'SNECKO_EYE')) drawCount += 2;

      let newDrawPile = [...p.drawPile];
      let newDiscardPile = [...p.discardPile];
      let newHand: ICard[] = [];
      
      const drawCard = () => {
          if (newDrawPile.length === 0) {
              if (newDiscardPile.length === 0) return null;
              newDrawPile = shuffle(newDiscardPile);
              newDiscardPile = [];
          }
          return newDrawPile.pop();
      };

      const processDraw = (count: number) => {
          for (let i = 0; i < count; i++) {
              const card = drawCard();
              if (card) {
                  if (p.relics.find(r => r.id === 'SNECKO_EYE')) card.cost = Math.floor(Math.random() * 4);
                  if (card.name === '虚無') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
                  newHand.push(card);
                  if (p.powers['EVOLVE'] && (card.type === CardType.STATUS || card.type === CardType.CURSE)) {
                      const bonusCard = drawCard();
                      if (bonusCard) newHand.push(bonusCard);
                  }
              }
          }
      };

      processDraw(drawCount);
      
      p.currentEnergy = p.maxEnergy;
      if (!p.powers['BARRICADE'] && !p.relics.find(r => r.id === 'CALIPERS')) p.block = 0;
      if (p.relics.find(r => r.id === 'CALIPERS') && p.block > 15) p.block -= 15;
      
      p.hand = newHand;
      p.drawPile = newDrawPile;
      p.discardPile = newDiscardPile;
      p.cardsPlayedThisTurn = 0;
      p.attacksPlayedThisTurn = 0;
      p.turnFlags = {};

      return { ...prev, player: p, enemies: currentEnemies };
    });
  };

  const handleSelectEnemy = (id: string) => {
    setGameState(prev => ({ ...prev, selectedEnemyId: id }));
  };

  // Card Playing Logic
  const handlePlayCard = (card: ICard) => {
    if (gameState.player.currentEnergy < card.cost) return;
    if (gameState.enemies.length === 0) return;
    if (actingEnemyId) return; 
    if (gameState.selectionState.active) return;
    if (card.unplayable) return; 

    audioService.playSound(card.type === CardType.ATTACK ? 'attack' : 'block');
    setLastActionType(card.type);
    setLastActionTime(Date.now());

    setGameState(prev => {
      const p = { ...prev.player, hand: [...prev.player.hand], drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile], deck: [...prev.player.deck], powers: { ...prev.player.powers } };
      let enemies = prev.enemies.map(e => ({ ...e }));
      
      p.currentEnergy -= card.cost;
      p.cardsPlayedThisTurn++;
      if (card.type === CardType.ATTACK) p.attacksPlayedThisTurn++;

      if (p.powers['AFTER_IMAGE']) p.block += p.powers['AFTER_IMAGE'];
      if (p.powers['THOUSAND_CUTS']) enemies.forEach(e => { e.currentHp -= p.powers['THOUSAND_CUTS']; e.floatingText = createDamageText(p.powers['THOUSAND_CUTS'], 'DAMAGE'); });
      if (p.relics.find(r => r.id === 'KUNAI') && p.attacksPlayedThisTurn % 3 === 0) p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1;
      if (p.relics.find(r => r.id === 'SHURIKEN') && p.attacksPlayedThisTurn % 3 === 0) p.strength += 1;
      if (p.relics.find(r => r.id === 'ORNAMENTAL_FAN') && p.attacksPlayedThisTurn % 3 === 0) p.block += 4;
      if (p.relics.find(r => r.id === 'PEN_NIB') && card.type === CardType.ATTACK) {
          p.relicCounters['PEN_NIB'] = (p.relicCounters['PEN_NIB'] || 0) + 1;
      }

      // --- Activations Loop (Echo Form, Burst) ---
      let activations = 1;
      if (p.echoes > 0) { activations++; p.echoes--; }
      if (card.type === CardType.SKILL && p.powers['BURST'] > 0) { activations++; p.powers['BURST']--; }
      if (p.relics.find(r => r.id === 'NECRONOMICON') && card.type === CardType.ATTACK && card.cost >= 2 && !p.turnFlags['NECRONOMICON']) {
          activations++;
          p.turnFlags['NECRONOMICON'] = true;
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

              if (card.damage || card.damageBasedOnBlock || card.damagePerCardInHand || card.damagePerAttackPlayed || card.damagePerStrike) {
                targets.forEach(e => {
                    const strengthBonus = p.strength * (card.strengthScaling || 1);
                    let baseDamage = (card.damage || 0);
                    if (card.damageBasedOnBlock) baseDamage += p.block;
                    if (card.damagePerCardInHand) baseDamage += (p.hand.filter(c => c.id !== card.id).length) * card.damagePerCardInHand!;
                    if (card.damagePerAttackPlayed) baseDamage += (p.attacksPlayedThisTurn - 1) * card.damagePerAttackPlayed!;
                    if (card.damagePerStrike) baseDamage += (p.deck.filter(c => c.name.includes('えんぴつ攻撃')).length) * card.damagePerStrike!;
                    if (p.powers['ACCURACY'] && card.name.includes('ナイフ')) baseDamage += p.powers['ACCURACY'];

                    let damage = baseDamage + strengthBonus;
                    if (e.vulnerable > 0) damage = Math.floor(damage * 1.5);
                    if (p.powers['ENVENOM']) applyDebuff(e, 'POISON', p.powers['ENVENOM']);
                    if (p.relics.find(r => r.id === 'PEN_NIB') && p.relicCounters['PEN_NIB'] === 10) { damage *= 2; p.relicCounters['PEN_NIB'] = 0; }
                    
                    if (e.block >= damage) { e.block -= damage; damage = 0; }
                    else { damage -= e.block; e.block = 0; }
                    
                    e.currentHp -= damage;
                    if (damage > 0) e.floatingText = createDamageText(damage, 'DAMAGE');

                    if (card.lifesteal && damage > 0) {
                        const heal = Math.min(p.currentHp + damage, p.maxHp) - p.currentHp;
                        p.currentHp += heal;
                        p.floatingText = createDamageText(heal, 'HEAL');
                    }
                    if (e.currentHp <= 0) {
                         if (card.fatalEnergy) p.currentEnergy += card.fatalEnergy;
                         if (card.fatalPermanentDamage) {
                             const deckCard = p.deck.find(c => c.id === card.id);
                             if (deckCard) deckCard.damage = (deckCard.damage || 0) + card.fatalPermanentDamage!;
                         }
                         if (card.fatalMaxHp) { p.maxHp += card.fatalMaxHp!; p.currentHp += card.fatalMaxHp!; }
                         if (e.corpseExplosion) enemies.forEach(other => { if (other.id !== e.id) { other.currentHp -= e.maxHp; other.floatingText = createDamageText(e.maxHp, 'DAMAGE'); } });
                    }
                });
              }

              if (card.block) {
                  let blk = card.block;
                  if (p.powers['DEXTERITY']) blk += p.powers['DEXTERITY'];
                  p.block += blk;
                  p.floatingText = createDamageText(blk, 'BLOCK');
              }
              if (card.doubleBlock) p.block *= 2;
              if (card.heal) {
                  p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
                  p.floatingText = createDamageText(card.heal, 'HEAL');
              }
              if (card.energy) p.currentEnergy += card.energy;
              if (card.selfDamage) { p.currentHp -= card.selfDamage; if (p.powers['RUPTURE']) p.strength += p.powers['RUPTURE']; }
              if (card.strength) p.strength += card.strength;
              if (card.vulnerable) targets.forEach(e => applyDebuff(e, 'VULNERABLE', card.vulnerable!));
              if (card.weak) targets.forEach(e => applyDebuff(e, 'WEAK', card.weak!));
              if (card.poison) targets.forEach(e => applyDebuff(e, 'POISON', card.poison!));
              if (card.poisonMultiplier) targets.forEach(e => { if (e.poison) e.poison *= card.poisonMultiplier!; });
              
              if (card.upgradeHand) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
              }
              if (card.upgradeDeck) {
                  p.deck = p.deck.map(c => getUpgradedCard(c));
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  p.drawPile = p.drawPile.map(c => getUpgradedCard(c));
                  p.discardPile = p.discardPile.map(c => getUpgradedCard(c));
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
                      if (newCard.name === '虚無') p.currentEnergy = Math.max(0, p.currentEnergy - 1); 
                      p.hand.push(newCard); 
                  }
                }
              }
              if (card.addCardToHand) {
                  for (let c=0; c<card.addCardToHand.count; c++) {
                      let newC = { ...CARDS_LIBRARY[card.addCardToHand.cardName], id: `gen-${Date.now()}-${c}` };
                      if (card.addCardToHand.cost0) newC.cost = 0;
                      if (p.powers['MASTER_REALITY']) newC = getUpgradedCard(newC);
                      p.hand.push(newC);
                  }
              }
              if (card.addCardToDraw) {
                   for (let c=0; c<card.addCardToDraw.count; c++) { p.drawPile.push({ ...CARDS_LIBRARY[card.addCardToDraw.cardName], id: `gen-${Date.now()}-${c}` }); }
                   p.drawPile = shuffle(p.drawPile);
              }
              enemies = enemies.filter(e => e.currentHp > 0);
          }
      }

      // Exhaust Logic
      p.hand = p.hand.filter(c => c.id !== card.id);
      
      let shouldExhaust = card.exhaust;
      if (p.powers['CORRUPTION'] && card.type === CardType.SKILL) shouldExhaust = true;

      if (!shouldExhaust && !(card.type === CardType.POWER) && !(card.promptsExhaust === 99)) {
          p.discardPile.push(card);
      } else {
          // Exhausted
          if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
      }

      let nextSelectionState = { ...prev.selectionState };
      if (card.promptsDiscard) nextSelectionState = { active: true, type: 'DISCARD', amount: card.promptsDiscard };
      if (card.promptsCopy) nextSelectionState = { active: true, type: 'COPY', amount: card.promptsCopy };
      if (card.name === '断捨離' || card.name === 'SEVER_SOUL') {
          const cardsToExhaust = p.hand.filter(c => c.type !== CardType.ATTACK);
          if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
          p.hand = p.hand.filter(c => c.type === CardType.ATTACK);
      } else if (card.name === '焚き火' || card.name === 'FIEND_FIRE') {
           if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * p.hand.length;
           p.hand = [];
      } else if (card.name === '計算' || card.name === 'CALCULATED_GAMBLE') {
           const count = p.hand.length;
           p.discardPile.push(...p.hand);
           p.hand = [];
           for(let i=0; i<count; i++) {
               if(p.drawPile.length === 0) { p.drawPile = shuffle(p.discardPile); p.discardPile = []; }
               const c = p.drawPile.pop();
               if(c) p.hand.push(c);
           }
      } else if (card.name === '発見' || card.name === 'DISCOVERY') {
           // Simplified: Add 1 random card to hand (0 cost this turn)
           const allCards = Object.values(CARDS_LIBRARY).filter(c => c.rarity !== 'SPECIAL');
           const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
           const newCard = { ...randomCard, id: `disc-${Date.now()}`, cost: 0, exhaust: true };
           p.hand.push(newCard);
      }

      let nextSelectedId = prev.selectedEnemyId;
      if (!enemies.find(e => e.id === nextSelectedId) && enemies.length > 0) nextSelectedId = enemies[0].id;

      return { ...prev, player: p, enemies: enemies, selectedEnemyId: nextSelectedId, selectionState: nextSelectionState };
    });
  };

  const handleEndTurn = async () => {
    audioService.playSound('select');
    setTurnLog("敵のターン...");
    setLastActionType(null);
    await wait(500);

    const enemies = [...gameState.enemies];
    for (const enemy of enemies) {
        if (gameState.player.currentHp <= 0) break;
        if (enemy.poison > 0) {
            enemy.currentHp -= enemy.poison;
            enemy.floatingText = createDamageText(enemy.poison, 'DAMAGE');
            enemy.poison--;
            setGameState(prev => ({ ...prev, enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, currentHp: enemy.currentHp, poison: enemy.poison, floatingText: enemy.floatingText } : e) }));
            await wait(200);
            if (enemy.currentHp <= 0) continue;
        }

        setActingEnemyId(enemy.id);
        await wait(300); 

        if (enemy.nextIntent.type === EnemyIntentType.ATTACK || enemy.nextIntent.type === EnemyIntentType.ATTACK_DEBUFF || enemy.nextIntent.type === EnemyIntentType.ATTACK_DEFEND) audioService.playSound('attack');
        else if (enemy.nextIntent.type === EnemyIntentType.DEFEND) audioService.playSound('block');
        else audioService.playSound('select');

        setGameState(prev => {
            const currentEnemyIndex = prev.enemies.findIndex(e => e.id === enemy.id);
            if (currentEnemyIndex === -1) return prev;
            const p = { ...prev.player };
            const newEnemies = [...prev.enemies];
            const e = { ...newEnemies[currentEnemyIndex] };
            newEnemies[currentEnemyIndex] = e;
            e.block = 0; 

            // AI Action Execution
            if (e.nextIntent.type === EnemyIntentType.ATTACK || e.nextIntent.type === EnemyIntentType.ATTACK_DEBUFF || e.nextIntent.type === EnemyIntentType.ATTACK_DEFEND) {
                let damage = e.nextIntent.value + (e.strength || 0);
                if (e.weak > 0) damage = Math.floor(damage * 0.75);
                if (p.powers['INTANGIBLE'] > 0) damage = 1;
                if (p.powers['STATIC_DISCHARGE']) { e.currentHp -= p.powers['STATIC_DISCHARGE']; e.floatingText = createDamageText(p.powers['STATIC_DISCHARGE'], 'DAMAGE'); }
                
                if (p.powers['BUFFER'] > 0) { 
                    p.powers['BUFFER']--; 
                    damage = 0; 
                }
                
                if (p.block >= damage) { 
                    p.block -= damage; 
                    damage = 0; 
                } else { 
                    damage -= p.block; 
                    p.block = 0; 
                }
                
                p.currentHp -= damage;
                if (damage > 0) p.floatingText = createDamageText(damage, 'DAMAGE');

                // Thorns logic
                if (p.powers['THORNS']) {
                    e.currentHp -= p.powers['THORNS'];
                    e.floatingText = createDamageText(p.powers['THORNS'], 'DAMAGE');
                }

                // Apply debuff if any
                if (e.nextIntent.debuffType && e.nextIntent.secondaryValue) {
                    if (e.nextIntent.debuffType === 'WEAK') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + e.nextIntent.secondaryValue;
                    if (e.nextIntent.debuffType === 'VULNERABLE') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + e.nextIntent.secondaryValue;
                    if (e.nextIntent.debuffType === 'POISON') p.powers['POISON'] = (p.powers['POISON'] || 0) + e.nextIntent.secondaryValue;
                }
                // Apply block if any
                if (e.nextIntent.type === EnemyIntentType.ATTACK_DEFEND && e.nextIntent.secondaryValue) {
                    e.block += e.nextIntent.secondaryValue;
                }

            } else if (e.nextIntent.type === EnemyIntentType.DEFEND) {
                e.block = e.nextIntent.value;
            } else if (e.nextIntent.type === EnemyIntentType.BUFF) {
                if (e.nextIntent.secondaryValue) e.strength += e.nextIntent.secondaryValue;
                else e.strength += 2;
            } else if (e.nextIntent.type === EnemyIntentType.DEBUFF) {
                 if (e.nextIntent.debuffType === 'WEAK') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + (e.nextIntent.secondaryValue || 2);
                 if (e.nextIntent.debuffType === 'VULNERABLE') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + (e.nextIntent.secondaryValue || 2);
                 if (e.nextIntent.debuffType === 'POISON') p.powers['POISON'] = (p.powers['POISON'] || 0) + (e.nextIntent.secondaryValue || 3);
            }
            
            if (e.vulnerable > 0) e.vulnerable--;
            if (e.weak > 0) e.weak--;

            // New Intent Calculation for next turn
            e.nextIntent = getNextEnemyIntent(e, prev.turn + 1);

            return { ...prev, player: p, enemies: newEnemies };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    // Process End of Turn Curses/Statuses
    setGameState(prev => {
        const p = { ...prev.player };
        if (p.powers['INTANGIBLE'] > 0) p.powers['INTANGIBLE']--;
        if (p.powers['LOSE_STRENGTH'] > 0) { p.strength -= p.powers['LOSE_STRENGTH']; p.powers['LOSE_STRENGTH'] = 0; }
        if (p.powers['ORANGE_PELLETS']) { /* Handled on play */ }
        
        // Curse Logic
        p.hand.forEach(c => {
            if (c.name === 'やけど') p.currentHp -= 2;
            if (c.name === '虫歯') p.currentHp -= 2;
            if (c.name === '不安') p.powers['WEAK'] = 1;
            if (c.name === '恥') p.powers['VULNERABLE'] = 1;
            if (c.name === '後悔') p.currentHp -= p.hand.length;
        });

        p.discardPile = [...p.discardPile, ...p.hand];
        p.hand = [];
        return { ...prev, player: p, turn: prev.turn + 1 };
    });
    startPlayerTurn();
  };

  const applyDebuff = (enemy: Enemy, type: 'WEAK' | 'VULNERABLE' | 'POISON', amount: number) => {
      if (enemy.artifact > 0) {
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
                 if (p.powers['STRATEGIST'] && card.name === '戦略家') p.currentEnergy += 2; // Not perfect check but ok
              } else if (mode.type === 'EXHAUST') {
                 if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
              }
              const newAmount = mode.amount - 1;
              return { ...prev, player: p, selectionState: { ...mode, active: newAmount > 0, amount: newAmount } };
          }
          if (mode.type === 'COPY') {
             const copy = { ...card, id: `copy-${Date.now()}` };
             p.hand.push(copy);
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
              target.floatingText = createDamageText(20, 'DAMAGE');
          } else if (potion.templateId === 'BLOCK_POTION') {
              p.block += 12;
              p.floatingText = createDamageText(12, 'BLOCK');
          } else if (potion.templateId === 'STRENGTH_POTION') {
              p.strength += 2;
          } else if (potion.templateId === 'ENERGY_POTION') {
              p.currentEnergy += 2;
          } else if (potion.templateId === 'WEAK_POTION' && target) {
              applyDebuff(target, 'WEAK', 3);
          } else if (potion.templateId === 'POISON_POTION' && target) {
              applyDebuff(target, 'POISON', 6);
          } else if (potion.templateId === 'HEALTH_POTION') {
              p.currentHp = Math.min(p.maxHp, p.currentHp + 15);
              p.floatingText = createDamageText(15, 'HEAL');
          } else if (potion.templateId === 'LIQUID_BRONZE') {
              p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
          } else if (potion.templateId === 'ENTROPIC_BREW') {
              // Fill slots
              while(p.potions.length < 3) {
                  const allPotions = Object.values(POTION_LIBRARY);
                  const newP = allPotions[Math.floor(Math.random() * allPotions.length)];
                  p.potions.push({ ...newP, id: `brew-${Date.now()}-${Math.random()}` });
              }
          } else if (potion.templateId === 'GAMBLERS_BREW') {
               const count = p.hand.length;
               p.discardPile.push(...p.hand);
               p.hand = [];
               for(let i=0; i<count; i++) {
                   if(p.drawPile.length === 0) { p.drawPile = shuffle(p.discardPile); p.discardPile = []; }
                   const c = p.drawPile.pop();
                   if(c) p.hand.push(c);
               }
          }

          // Clean up dead enemies (simple check)
          const remainingEnemies = enemies.filter(e => e.currentHp > 0);

          return { ...prev, player: p, enemies: remainingEnemies };
      });
  };

  // --- Rest & Shop ---
  const handleRestAction = () => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.currentHp + Math.floor(prev.player.maxHp * 0.3), prev.player.maxHp) } }));
  };
  const handleUpgradeCard = (card: ICard) => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.map(c => c.id === card.id ? getUpgradedCard(c) : c) } }));
  };

  // --- Treasure ---
  const handleOpenTreasure = () => {
      // 1. Relic (High chance)
      let reward: RewardItem;
      const r = Math.random();
      if (r < 0.8) {
          const allRelics = Object.values(RELIC_LIBRARY).filter(relic => relic.rarity !== 'BOSS' && relic.rarity !== 'STARTER');
          const relic = allRelics[Math.floor(Math.random() * allRelics.length)];
          reward = { type: 'RELIC', value: relic, id: `tr-relic-${Date.now()}` };
      } else {
          reward = { type: 'GOLD', value: 100 + Math.floor(Math.random()*50), id: `tr-gold-${Date.now()}` };
      }
      
      setTreasureRewards([reward]);
      
      // Apply reward immediately or just show? Apply on leave usually, but let's apply now for simplicity in this strict flow
      setGameState(prev => {
          const p = { ...prev.player };
          if (reward.type === 'RELIC') p.relics.push(reward.value);
          if (reward.type === 'GOLD') p.gold += reward.value;
          
          // Cursed Key check
          if (p.relics.find(rel => rel.id === 'CURSED_KEY')) {
              const curses = Object.values(CURSE_CARDS);
              const curse = curses[Math.floor(Math.random() * curses.length)];
              p.deck.push({ ...curse, id: `curse-${Date.now()}` });
              // Also show as reward for visual
              const curseReward: RewardItem = { type: 'CARD', value: { ...curse, id: `curse-rew-${Date.now()}` }, id: `tr-curse-${Date.now()}` };
              return { ...prev, player: p, rewards: [reward, curseReward] }; // Hack to show both
          }

          return { ...prev, player: p, rewards: [reward] };
      });
  };

  // --- Reward Logic ---
  const goToRewardPhase = () => {
    const rewards: RewardItem[] = [];
    
    // 1. Card Reward
    const allCards = Object.values(CARDS_LIBRARY).filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL');
    while(rewards.length < 3) {
        const roll = Math.random() * 100;
        let targetRarity = 'COMMON';
        if (roll > 93) targetRarity = 'LEGENDARY'; else if (roll > 60) targetRarity = 'RARE';
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
        rewards.push({ type: 'GOLD', value: 100, id: `rew-gold-${Date.now()}` });
    }

    // 3. Potion Reward (Chance)
    if (Math.random() < 0.4 && !gameState.player.relics.find(r => r.id === 'SOZU')) {
        const allPotions = Object.values(POTION_LIBRARY);
        const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
        rewards.push({ type: 'POTION', value: { ...potion, id: `rew-pot-${Date.now()}` }, id: `rew-pot-${Date.now()}` });
    }

    setGameState(prev => ({ ...prev, screen: GameScreen.REWARD, rewards: rewards }));
    audioService.playSound('select');
  };

  const handleRewardSelection = (item: RewardItem) => {
      if (isLoading) return;
      audioService.playSound('select');

      setGameState(prev => {
          let p = { ...prev.player };
          let nextRewards = [...prev.rewards];

          if (item.type === 'CARD') {
              p.deck = [...p.deck, item.value];
              p.discardPile = [...p.discardPile, item.value];
              unlockCards([item.value]);
              // Remove ALL card rewards to enforce "Pick 1"
              nextRewards = nextRewards.filter(r => r.type !== 'CARD');
          } else if (item.type === 'RELIC') {
              p.relics = [...p.relics, item.value];
              if (item.value.id === 'SOZU') p.maxEnergy += 1; // Immediate effect
              if (item.value.id === 'CURSED_KEY') p.maxEnergy += 1;
              if (item.value.id === 'PHILOSOPHER_STONE') p.maxEnergy += 1;
              if (item.value.id === 'VELVET_CHOKER') p.maxEnergy += 1;
              if (item.value.id === 'WAFFLE') { p.maxHp += 7; p.currentHp = p.maxHp; }
              nextRewards = nextRewards.filter(r => r.id !== item.id);
          } else if (item.type === 'GOLD') {
              p.gold += item.value;
              nextRewards = nextRewards.filter(r => r.id !== item.id);
          } else if (item.type === 'POTION') {
              if (p.potions.length < 3) {
                  p.potions = [...p.potions, item.value];
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
      if (currentNode && currentNode.type === NodeType.BOSS) {
          advanceAct();
      } else {
          handleNodeComplete();
      }
  };

  // --- Render ---
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-0 md:p-4 overflow-hidden fixed inset-0 touch-none select-none">
        <div className="w-full max-w-4xl h-full md:h-[600px] border-0 md:border-[10px] border-gray-800 rounded-none md:rounded-xl relative overflow-hidden shadow-2xl bg-black crt-scanline flex flex-col">
            
            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://picsum.photos/800/600?grayscale&blur=2')] opacity-20 bg-cover pointer-events-none"></div>
                    <div className="text-center p-8 z-10">
                        <h1 className="text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 font-bold animate-pulse tracking-widest drop-shadow-lg" style={{fontFamily: "'DotGothic16', sans-serif"}}>
                            算数ローグ
                        </h1>
                        <p className="text-white mb-8 text-lg font-bold tracking-widest">小学校の伝説</p>
                        
                        <div className="flex flex-col gap-4 items-center w-full max-w-xs mx-auto">
                            <button onClick={startGame} disabled={isLoading} className="w-full bg-blue-600 text-white px-8 py-4 text-xl font-bold border-b-4 border-blue-800 hover:bg-blue-500 hover:border-blue-700 active:border-b-0 active:translate-y-1 transition-all rounded shadow-lg flex items-center justify-center">
                                <Play className="mr-2" /> {hasSave ? "最初から" : "冒険を始める"}
                            </button>
                            
                            {hasSave && (
                                <button onClick={continueGame} className="w-full bg-green-600 text-white px-8 py-3 text-lg font-bold border-b-4 border-green-800 hover:bg-green-500 hover:border-green-700 active:border-b-0 active:translate-y-1 transition-all rounded shadow-lg flex items-center justify-center">
                                    <RotateCcw className="mr-2" /> つづきから
                                </button>
                            )}

                            <div className="flex gap-4 w-full">
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.COMPENDIUM }))} className="flex-1 bg-gray-700 text-amber-200 px-4 py-3 text-sm font-bold border-b-4 border-gray-900 hover:bg-gray-600 active:border-b-0 active:translate-y-1 transition-all rounded shadow-lg flex items-center justify-center">
                                    <BookOpen className="mr-1" size={16}/> 図鑑
                                </button>
                                <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.RANKING }))} className="flex-1 bg-gray-700 text-yellow-200 px-4 py-3 text-sm font-bold border-b-4 border-gray-900 hover:bg-gray-600 active:border-b-0 active:translate-y-1 transition-all rounded shadow-lg flex items-center justify-center">
                                    <Trophy className="mr-1" size={16}/> 記録
                                </button>
                            </div>
                            
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.HELP }))} className="text-gray-400 text-sm hover:text-white flex items-center mt-4">
                                <HelpCircle className="mr-1" size={14} /> 遊び方
                            </button>
                        </div>
                    </div>
                    <div className="absolute bottom-4 right-4 text-xs text-gray-500">v1.2.0</div>
                </div>
            )}

            {gameState.screen === GameScreen.MODE_SELECTION && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white relative">
                    <div className="text-center p-8 z-10 w-full max-w-lg">
                        <h2 className="text-3xl font-bold mb-8 text-yellow-400">学習モード選択</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleModeSelect(GameMode.ADDITION)} className="bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 rounded p-4 flex flex-col items-center gap-2 active:translate-y-1 active:border-b-0">
                                <Plus size={32} /> <span className="text-xl font-bold">たし算</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.SUBTRACTION)} className="bg-red-600 hover:bg-red-500 border-b-4 border-red-800 rounded p-4 flex flex-col items-center gap-2 active:translate-y-1 active:border-b-0">
                                <Minus size={32} /> <span className="text-xl font-bold">ひき算</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.MULTIPLICATION)} className="bg-green-600 hover:bg-green-500 border-b-4 border-green-800 rounded p-4 flex flex-col items-center gap-2 active:translate-y-1 active:border-b-0">
                                <MultiplyIcon size={32} /> <span className="text-xl font-bold">かけ算</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.DIVISION)} className="bg-yellow-600 hover:bg-yellow-500 border-b-4 border-yellow-800 rounded p-4 flex flex-col items-center gap-2 active:translate-y-1 active:border-b-0">
                                <Divide size={32} /> <span className="text-xl font-bold">わり算</span>
                            </button>
                            <button onClick={() => handleModeSelect(GameMode.MIXED)} className="col-span-2 bg-purple-600 hover:bg-purple-500 border-b-4 border-purple-800 rounded p-4 flex flex-col items-center gap-2 active:translate-y-1 active:border-b-0">
                                <Shuffle size={32} /> <span className="text-xl font-bold">ミックス</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.CHARACTER_SELECTION && (
                <CharacterSelectionScreen characters={CHARACTERS} unlockedCount={Math.min(clearCount + 1, CHARACTERS.length)} onSelect={handleCharacterSelect} />
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

            {gameState.screen === GameScreen.MATH_CHALLENGE && (
                <MathChallengeScreen 
                    mode={gameState.mode} 
                    onComplete={handleMathChallengeComplete} 
                />
            )}

            {gameState.screen === GameScreen.VICTORY && (
                 <div className="w-full h-full bg-green-900 flex items-center justify-center text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti-doodles.png')] opacity-20 animate-pulse"></div>
                    <div className="z-10">
                        <h1 className="text-6xl mb-4 text-yellow-400 font-bold drop-shadow-[0_5px_0_rgba(0,0,0,0.5)]">勝利！</h1>
                        <div className="text-yellow-200 text-2xl font-bold mb-8 flex items-center justify-center">
                            <Coins className="mr-2"/> +{VICTORY_GOLD} G
                        </div>
                        <button onClick={goToRewardPhase} className="bg-blue-600 px-12 py-4 border-b-8 border-blue-800 rounded-xl font-bold text-2xl animate-bounce shadow-xl active:border-b-0 active:translate-y-2 transition-all">報酬ゲット！</button>
                    </div>
                 </div>
            )}

            {gameState.screen === GameScreen.REWARD && (
                <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} />
            )}

            {gameState.screen === GameScreen.REST && (
                <RestScreen player={gameState.player} onRest={handleRestAction} onUpgrade={handleUpgradeCard} onLeave={handleNodeComplete} />
            )}

            {gameState.screen === GameScreen.SHOP && (
                <ShopScreen 
                    player={gameState.player}
                    shopCards={shopCards}
                    shopRelics={shopRelics}
                    shopPotions={shopPotions}
                    onBuyCard={(card) => {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((card.price||50)*0.5) : (card.price||50)), deck: [...prev.player.deck, { ...card, id: `buy-${Date.now()}` }], discardPile: [...prev.player.discardPile, { ...card, id: `buy-${Date.now()}` }] } }));
                    }}
                    onBuyRelic={(relic) => {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((relic.price||150)*0.5) : (relic.price||150)), relics: [...prev.player.relics, relic] } }));
                    }}
                    onBuyPotion={(potion) => {
                        if (gameState.player.potions.length < 3) {
                             setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((potion.price||50)*0.5) : (potion.price||50)), potions: [...prev.player.potions, { ...potion, id: `buy-pot-${Date.now()}` }] } }));
                        }
                    }}
                    onRemoveCard={(cardId, cost) => {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - cost, deck: prev.player.deck.filter(c => c.id !== cardId) } }));
                    }}
                    onLeave={handleNodeComplete}
                />
            )}

            {gameState.screen === GameScreen.TREASURE && (
                <TreasureScreen 
                    rewards={treasureRewards}
                    hasCursedKey={!!gameState.player.relics.find(r => r.id === 'CURSED_KEY')}
                    onOpen={handleOpenTreasure} 
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

            {gameState.screen === GameScreen.GAME_OVER && (
                 <div className="w-full h-full bg-red-900 flex items-center justify-center text-center text-white relative">
                    <div className="absolute inset-0 bg-black/50"></div>
                    <div className="z-10">
                        <h1 className="text-6xl mb-4 font-bold text-red-500 drop-shadow-md">GAME OVER</h1>
                        <p className="mb-8 text-2xl">Act {gameState.act} - Floor {gameState.floor}</p>
                        <div className="flex flex-col gap-4 items-center w-64 mx-auto">
                            <button onClick={startGame} className="w-full bg-black border-2 border-white px-8 py-3 hover:bg-gray-800 flex items-center justify-center font-bold"><RotateCcw className="mr-2" size={20} /> 再挑戦</button>
                            <button onClick={returnToTitle} className="w-full bg-gray-700 border-2 border-white px-8 py-3 hover:bg-gray-600 flex items-center justify-center font-bold"><Home className="mr-2" size={20} /> タイトルへ</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.ENDING && (
                 <div className="w-full h-full bg-yellow-900 flex items-center justify-center text-center text-white relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="z-10">
                        <Trophy size={100} className="text-yellow-400 mx-auto mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]" />
                        <h1 className="text-6xl mb-4 font-bold text-yellow-200">ゲームクリア！</h1>
                        <p className="mb-8 text-xl font-bold">あなたは伝説となった。<br/>素晴らしい冒険でした！</p>
                        
                        {!gameState.isEndless ? (
                            <button onClick={startEndlessMode} className="bg-purple-600 border-b-4 border-purple-800 px-8 py-4 text-xl hover:bg-purple-500 font-bold rounded-xl active:border-b-0 active:translate-y-1 mb-4 w-full flex items-center justify-center">
                                <Infinity className="mr-2"/> エンドレスモードへ
                            </button>
                        ) : (
                            <p className="text-purple-300 font-bold mb-4">エンドレスモード進行中...</p>
                        )}

                        <button onClick={returnToTitle} className="bg-blue-600 border-b-4 border-blue-800 px-8 py-4 text-xl hover:bg-blue-500 font-bold rounded-xl active:border-b-0 active:translate-y-1 w-full">
                            タイトルへ戻る
                        </button>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default App;
