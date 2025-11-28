
import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, GameScreen, Enemy, Card as ICard, 
  CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion, Player, EnemyIntent, Character, FloatingText, RankingEntry
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
import MathChallengeScreen from './components/MathChallengeScreen'; // New Import
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText } from 'lucide-react';

// --- HELPERS ---
export const getUpgradedCard = (card: ICard): ICard => {
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
interface EnemyDefinition {
    type: string;
    minHp: number;
    maxHp: number;
}

const ENEMY_TYPES: Record<string, EnemyDefinition> = {
    'SLIME_ACID': { type: 'SLIME_ACID', minHp: 28, maxHp: 32 },
    'SLIME_SPIKE': { type: 'SLIME_SPIKE', minHp: 40, maxHp: 44 },
    'CULTIST': { type: 'CULTIST', minHp: 48, maxHp: 54 },
    'LOOTER': { type: 'LOOTER', minHp: 44, maxHp: 48 },
    'GUARDIAN': { type: 'GUARDIAN', minHp: 200, maxHp: 200 }, // Boss
    'GENERIC': { type: 'GENERIC', minHp: 20, maxHp: 30 }
};

const determineEnemyType = (name: string, isBoss: boolean): string => {
    if (isBoss) return 'GUARDIAN'; 
    if (name.includes('酸') || name.includes('鼻水')) return 'SLIME_ACID';
    if (name.includes('トゲ') || name.includes('画鋲')) return 'SLIME_SPIKE';
    if (name.includes('狂信者') || name.includes('悪魔')) return 'CULTIST';
    if (name.includes('強盗') || name.includes('泥棒')) return 'LOOTER';
    return 'GENERIC';
};

const getNextEnemyIntent = (enemy: Enemy, turn: number): EnemyIntent => {
    const type = enemy.enemyType;
    const localTurn = turn % 3; 

    switch (type) {
        case 'CULTIST':
            if (turn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 3 }; 
            return { type: EnemyIntentType.ATTACK, value: 6 }; 
        
        case 'SLIME_ACID':
            if (localTurn === 0) return { type: EnemyIntentType.ATTACK_DEBUFF, value: 8, secondaryValue: 2, debuffType: 'POISON' }; 
            if (localTurn === 1) return { type: EnemyIntentType.ATTACK, value: 10 };
            return { type: EnemyIntentType.DEBUFF, value: 0, secondaryValue: 1, debuffType: 'WEAK' }; 

        case 'SLIME_SPIKE':
            if (localTurn === 0) return { type: EnemyIntentType.ATTACK, value: 12 };
            return { type: EnemyIntentType.ATTACK_DEBUFF, value: 8, secondaryValue: 2, debuffType: 'VULNERABLE' }; 

        case 'LOOTER':
            if (turn === 1) return { type: EnemyIntentType.ATTACK_DEFEND, value: 10, secondaryValue: 6 }; 
            if (turn === 2) return { type: EnemyIntentType.DEFEND, value: 12 }; 
            return { type: EnemyIntentType.ATTACK, value: 14 }; 

        case 'GUARDIAN':
            const bossTurn = turn % 4;
            if (bossTurn === 1) return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 9 }; 
            if (bossTurn === 2) return { type: EnemyIntentType.ATTACK, value: 30 }; 
            if (bossTurn === 3) return { type: EnemyIntentType.ATTACK_DEBUFF, value: 10, secondaryValue: 2, debuffType: 'VULNERABLE' }; 
            return { type: EnemyIntentType.DEFEND, value: 20 };

        case 'THE_HEART':
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
          gameState.screen !== GameScreen.CHARACTER_SELECTION
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
        
        // Go to character selection first
        setGameState(prev => ({
            ...prev,
            screen: GameScreen.CHARACTER_SELECTION
        }));

    } catch (e) {
        console.error("Start Game Error:", e);
        setErrorMessage("エラーが発生しました。");
    } finally {
        setIsLoading(false);
    }
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

  const generateEvent = (player: Player) => {
      const random = Math.random();
      const events = [
          {
              title: "大きな魚",
              description: "巨大な魚が吊るされている。「バナナ」「ドーナツ」「箱」、どれか一つを持って行けと書いてある。",
              options: [
                  { label: "バナナ", text: "HPを20回復。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } })); handleNodeComplete(); } },
                  { label: "ドーナツ", text: "最大HP+5。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } })); handleNodeComplete(); } },
                  { label: "箱", text: "レリックを得る。呪いを受ける。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.WARPED_TONGS], deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `curse-${Date.now()}` }] } })); handleNodeComplete(); } }
              ]
          },
          {
              title: "聖職者",
              description: "青いローブを着た男が立っている。「不浄なものを浄化しましょうか？」",
              options: [
                  { label: "浄化", text: "カードを1枚削除 (50G)", action: () => { if(player.gold >= 50) { setGameState(prev => ({...prev, screen: GameScreen.SHOP, player: {...prev.player, gold: prev.player.gold - 50 }})); } else { handleNodeComplete(); } } },
                  { label: "治療", text: "HP全回復 (35G)", action: () => { if(player.gold >= 35) { setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - 35, currentHp: prev.player.maxHp } })); handleNodeComplete(); } else handleNodeComplete(); } },
                  { label: "立ち去る", text: "", action: () => handleNodeComplete() }
              ]
          },
          // ... (simplified event list for brevity, can be expanded back if needed)
          {
              title: "変化の輪",
              description: "グレムリンが巨大なルーレットを回している。「さあ、運試しだ！」",
              options: [
                  { label: "回す", text: "ランダムな結果。", action: () => {
                      const r = Math.random();
                      let log = "";
                      if (r < 0.2) { // Heal
                          setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                          log = "HPが全回復した！";
                      } else if (r < 0.4) { // Damage
                          setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10) } }));
                          log = "ダメージを受けた...";
                      } else if (r < 0.6) { // Gold
                          setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                          log = "100ゴールドを手に入れた！";
                      } else if (r < 0.8) { // Curse
                          setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...CURSE_CARDS.DECAY, id: `curse-${Date.now()}` }] } }));
                          log = "呪われてしまった...";
                      } else { // Remove
                          setGameState(prev => {
                              const deck = [...prev.player.deck];
                              const removed = deck.splice(Math.floor(Math.random()*deck.length), 1)[0];
                              return { ...prev, player: { ...prev.player, deck } };
                          });
                          log = "カードが1枚消滅した。";
                      }
                      setEventResultLog(log);
                  }}
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
                p.hand.push({ ...power, id: `ench-${Date.now()}`, cost: 0 }); // Free first time
            }
            if (p.relics.find(r => r.id === 'RED_MASK')) enemies.forEach(e => e.weak += 1);

            p.echoes = 0;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;

            // Relic: Vajra
            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            // Relic: Bag of Prep / Snake Ring (Starter)
            let drawCount = HAND_SIZE;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
            // Relic: Anchor
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = 3; 
            // Relic: Happy Flower
            if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) {
                p.relicCounters['HAPPY_FLOWER'] = (p.relicCounters['HAPPY_FLOWER'] || 0) + 1;
                if (p.relicCounters['HAPPY_FLOWER'] >= 3) {
                    p.currentEnergy += 1;
                    p.relicCounters['HAPPY_FLOWER'] = 0;
                }
            }

            for(let i=0; i<drawCount; i++) {
                const c = p.drawPile.pop();
                if(c) p.hand.push(c);
            }
            
            // Innate Cards
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
                turn: 1 // Reset turn count
            });
            setCurrentNarrative(flavor);
            audioService.playBGM('battle');
            setTurnLog("あなたのターン");

        } else if (node.type === NodeType.REST) {
            setGameState({ ...nextState, screen: GameScreen.REST });
            audioService.playBGM('menu');

        } else if (node.type === NodeType.SHOP) {
            // Generate Shop Cards
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

            // Generate Shop Relics
            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'SHOP' || r.rarity === 'COMMON' || r.rarity === 'UNCOMMON' || r.rarity === 'RARE');
            const relicOptions = shuffle(allRelics).slice(0, 2);
            setShopRelics(relicOptions);

            // Generate Shop Potions
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

  // --- Battle Logic ---
  const startPlayerTurn = () => {
    setTurnLog("あなたのターン");
    setGameState(prev => {
      const p = { ...prev.player };
      
      // Powers
      if (p.powers['DEMON_FORM']) p.strength += p.powers['DEMON_FORM'];
      if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
      if (p.powers['DEVA_FORM']) p.maxEnergy += p.powers['DEVA_FORM']; 
      if (p.powers['METALLICIZE']) p.block += p.powers['METALLICIZE'];
      if (p.powers['REGEN']) { p.currentHp = Math.min(p.maxHp, p.currentHp + p.powers['REGEN']); p.floatingText = createDamageText(p.powers['REGEN'], 'HEAL'); p.powers['REGEN']--; }
      if (p.powers['NOXIOUS_FUMES']) { prev.enemies.forEach(e => { e.poison += p.powers['NOXIOUS_FUMES']; }); }
      if (p.powers['INFINITE_BLADES']) p.hand.push({ ...CARDS_LIBRARY['SLICE'], id: `blade-${Date.now()}`, cost: 0 });
      if (p.powers['CREATIVE_AI']) { 
          const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
          const power = powers[Math.floor(Math.random() * powers.length)];
          p.hand.push({ ...power, id: `ai-${Date.now()}` });
      }
      if (p.powers['TOOLS_OF_THE_TRADE']) { /* Draw handled below, discard separate */ }

      // Relic: Mutagenic Strength (Lose)
      if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH') && prev.turn === 1) p.strength -= 3;
      // Relic: Warped Tongs
      if (p.relics.find(r => r.id === 'WARPED_TONGS') && p.hand.length > 0) {
          const c = p.hand[Math.floor(Math.random() * p.hand.length)];
          c.upgraded = true; c.damage = (c.damage ? Math.floor(c.damage*1.3)+2 : undefined); c.block = (c.block ? Math.floor(c.block*1.3)+2 : undefined);
      }
      // Relic: Happy Flower
      if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) {
          p.relicCounters['HAPPY_FLOWER'] = (p.relicCounters['HAPPY_FLOWER'] || 0) + 1;
          if (p.relicCounters['HAPPY_FLOWER'] >= 3) {
              p.currentEnergy += 1;
              p.relicCounters['HAPPY_FLOWER'] = 0;
          }
      }

      // Draw
      let drawCount = HAND_SIZE;
      if (p.powers['TOOLS_OF_THE_TRADE']) drawCount += 1;
      if (p.relics.find(r => r.id === 'SNECKO_EYE')) drawCount += 2;

      let newDrawPile = [...p.drawPile];
      let newDiscardPile = [...p.discardPile];
      let newHand: ICard[] = [];
      
      for (let i = 0; i < drawCount; i++) {
        if (newDrawPile.length === 0) {
          if (newDiscardPile.length === 0) break;
          newDrawPile = shuffle(newDiscardPile);
          newDiscardPile = [];
        }
        const card = newDrawPile.pop();
        if (card) {
            if (card.name === '虚無') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
            if (p.relics.find(r => r.id === 'SNECKO_EYE')) card.cost = Math.floor(Math.random() * 4);
            newHand.push(card);
        }
      }
      
      p.currentEnergy = p.maxEnergy;
      if (!p.powers['BARRICADE'] && !p.relics.find(r => r.id === 'CALIPERS')) p.block = 0;
      if (p.relics.find(r => r.id === 'CALIPERS') && p.block > 15) p.block -= 15;
      
      p.hand = newHand;
      p.drawPile = newDrawPile;
      p.discardPile = newDiscardPile;
      p.cardsPlayedThisTurn = 0;
      p.attacksPlayedThisTurn = 0;
      p.turnFlags = {};

      return { ...prev, player: p };
    });
  };

  const handleSelectEnemy = (id: string) => {
    setGameState(prev => ({ ...prev, selectedEnemyId: id }));
  };

  const applyDebuff = (target: any, type: 'WEAK' | 'VULNERABLE' | 'POISON', amount: number) => {
      if (target.artifact > 0) {
          target.artifact--;
          return;
      }
      if (target.powers && target.powers['ARTIFACT'] > 0) {
          target.powers['ARTIFACT']--;
          return;
      }

      if (type === 'WEAK') target.weak = (target.weak || 0) + amount;
      if (type === 'VULNERABLE') target.vulnerable = (target.vulnerable || 0) + amount;
      if (type === 'POISON') target.poison = (target.poison || 0) + amount;
      if (target.powers) target.powers[type] = (target.powers[type] || 0) + amount;
  };

  const handleHandSelection = (card: ICard) => {
      setGameState(prev => {
          const p = { ...prev.player };
          const mode = prev.selectionState;
          
          if (mode.type === 'DISCARD' || mode.type === 'EXHAUST') {
              p.hand = p.hand.filter(c => c.id !== card.id);
              if (mode.type === 'DISCARD') {
                 p.discardPile.push(card);
                 if (p.powers['STRATEGIST']) p.currentEnergy += 2; // Rough impl
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
      if (gameState.player.relics.find(r => r.id === 'SOZU')) return; // Sozu blocks potions
      
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
          } else if (potion.templateId === 'HEALTH_POTION') {
              const heal = Math.min(p.maxHp - p.currentHp, 15);
              p.currentHp += heal;
              p.floatingText = createDamageText(heal, 'HEAL');
          } else if (potion.templateId === 'POISON_POTION' && target) {
              applyDebuff(target, 'POISON', 6);
          } else if (potion.templateId === 'LIQUID_BRONZE') {
              p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
          } else if (potion.templateId === 'ENTROPIC_BREW') {
              const slots = 3 - p.potions.length;
              for(let i=0; i<slots; i++) {
                  const newPot = Object.values(POTION_LIBRARY)[Math.floor(Math.random()*Object.values(POTION_LIBRARY).length)];
                  p.potions.push({...newPot, id: `pot-${Date.now()}-${i}`});
              }
          } else if (potion.templateId === 'GAMBLERS_BREW') {
              const discardCount = p.hand.length;
              p.discardPile.push(...p.hand);
              p.hand = [];
              for(let i=0; i<discardCount; i++) {
                  if (p.drawPile.length === 0) { p.drawPile = shuffle(p.discardPile); p.discardPile = []; }
                  const c = p.drawPile.pop();
                  if (c) p.hand.push(c);
              }
          }

          // Clean up dead enemies
          const remainingEnemies = enemies.filter(e => e.currentHp > 0);

          return { ...prev, player: p, enemies: remainingEnemies };
      });
  };

  const handleOpenTreasure = () => {
      setGameState(prev => {
          const p = { ...prev.player };
          const rewards: RewardItem[] = [];
          
          let relicCount = 1;
          if ((p.relicCounters['MATRYOSHKA'] || 0) > 0) {
              relicCount = 2;
              p.relicCounters['MATRYOSHKA']--;
          }

          if (p.relics.find(r => r.id === 'CURSED_KEY')) {
              const curses = Object.values(CURSE_CARDS);
              const curse = curses[Math.floor(Math.random() * curses.length)];
              p.deck = [...p.deck, { ...curse, id: `curse-${Date.now()}` }];
              rewards.push({ type: 'CARD', value: { ...curse, name: `呪い: ${curse.name}` }, id: `curse-${Date.now()}` });
          }

          const availableRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity !== 'STARTER' && r.rarity !== 'BOSS' && !p.relics.find(have => have.id === r.id));
          const shuffledRelics = shuffle(availableRelics);
          
          for(let i=0; i<relicCount; i++) {
              if (shuffledRelics[i]) {
                  rewards.push({ type: 'RELIC', value: shuffledRelics[i], id: `relic-${Date.now()}-${i}` });
                  p.relics = [...p.relics, shuffledRelics[i]];
                  if (shuffledRelics[i].id === 'MATRYOSHKA') p.relicCounters['MATRYOSHKA'] = 2;
                  if (shuffledRelics[i].id === 'PEN_NIB') p.relicCounters['PEN_NIB'] = 0;
                  if (shuffledRelics[i].id === 'OLD_COIN') p.gold += 300;
              }
          }

          if (Math.random() > 0.5) {
              const gold = Math.floor(Math.random() * 50) + 20;
              p.gold += gold;
              rewards.push({ type: 'GOLD', value: gold, id: `gold-${Date.now()}` });
          }

          setTreasureRewards(rewards);
          return { ...prev, player: p };
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
          if (p.relicCounters['PEN_NIB'] === 10) { p.relicCounters['PEN_NIB'] = 0; } // Effect applies before damage calc usually, simplified here
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
          
          // --- Multi-hit Loop ---
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
                    if (card.damagePerStrike) baseDamage += (p.deck.filter(c => c.name.includes('攻撃') || c.name.includes('STRIKE')).length) * card.damagePerStrike!;
                    if (p.relics.find(r => r.id === 'PEN_NIB') && p.relicCounters['PEN_NIB'] === 9 && act === 0 && h === 0) baseDamage *= 2; 
                    if (p.powers['ACCURACY'] && (card.name === 'ナイフ' || card.name === 'SLICE')) baseDamage += p.powers['ACCURACY'];

                    let damage = baseDamage + strengthBonus;
                    if (e.vulnerable > 0) damage = Math.floor(damage * 1.5);
                    if (p.powers['ENVENOM']) applyDebuff(e, 'POISON', p.powers['ENVENOM']);
                    
                    if (e.block >= damage) { e.block -= damage; damage = 0; }
                    else { damage -= e.block; e.block = 0; }
                    
                    e.currentHp -= damage;
                    if (damage > 0) e.floatingText = createDamageText(damage, 'DAMAGE');

                    if (card.lifesteal && damage > 0) { p.currentHp = Math.min(p.currentHp + damage, p.maxHp); p.floatingText = createDamageText(damage, 'HEAL'); }
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

              let blockAmount = card.block || 0;
              if (blockAmount > 0) {
                  blockAmount += (p.powers['DEXTERITY'] || 0);
                  p.block += blockAmount;
                  p.floatingText = createDamageText(blockAmount, 'BLOCK');
              }
              
              if (card.doubleBlock) p.block *= 2;
              if (card.heal) p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
              if (card.energy) p.currentEnergy += card.energy;
              if (card.selfDamage) { p.currentHp -= card.selfDamage; if (p.powers['RUPTURE']) p.strength += p.powers['RUPTURE']; }
              if (card.strength) p.strength += card.strength;
              if (card.vulnerable) targets.forEach(e => applyDebuff(e, 'VULNERABLE', card.vulnerable!));
              if (card.weak) targets.forEach(e => applyDebuff(e, 'WEAK', card.weak!));
              if (card.poison) targets.forEach(e => applyDebuff(e, 'POISON', card.poison!));
              
              if (card.upgradeHand || p.powers['APOTHEOSIS']) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  if (p.powers['APOTHEOSIS']) { p.drawPile = p.drawPile.map(c => getUpgradedCard(c)); p.discardPile = p.discardPile.map(c => getUpgradedCard(c)); p.deck = p.deck.map(c => getUpgradedCard(c)); }
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
                      if (p.relics.find(r => r.id === 'SNECKO_EYE')) newCard.cost = Math.floor(Math.random() * 4);
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

      p.hand = p.hand.filter(c => c.id !== card.id);
      if (!card.exhaust && !(card.type === CardType.POWER) && !(card.promptsExhaust === 99) && !(p.powers['CORRUPTION'] && card.type === CardType.SKILL)) {
          p.discardPile.push(card);
      } else if (p.powers['FEEL_NO_PAIN']) {
           p.block += p.powers['FEEL_NO_PAIN'];
      }

      let nextSelectionState = { ...prev.selectionState };
      if (card.promptsDiscard) nextSelectionState = { active: true, type: 'DISCARD', amount: card.promptsDiscard };
      if (card.promptsCopy) nextSelectionState = { active: true, type: 'COPY', amount: card.promptsCopy };
      if (card.promptsExhaust === 99) {
          if (card.name === '断捨離' || card.name === 'SEVER_SOUL') {
              const cardsToExhaust = p.hand.filter(c => c.type !== CardType.ATTACK);
              if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
              p.hand = p.hand.filter(c => c.type === CardType.ATTACK);
          } else if (card.name === '焚き火' || card.name === 'FIEND_FIRE') {
               if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * p.hand.length;
               // dmg logic handled above
               p.hand = [];
          }
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
            let poisonDmg = enemy.poison;
            if (gameState.player.powers['DOUBLE_POISON']) poisonDmg *= 3; // Catalyst effect is stack application, but for damage calc we simulate
            // Actually Catalyst just triples stacks. Damage is just stack count.
            enemy.currentHp -= enemy.poison;
            enemy.floatingText = createDamageText(enemy.poison, 'DAMAGE');
            enemy.poison--;
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
            e.block = 0; 
            e.floatingText = null;

            // Execute Intent
            const intent = e.nextIntent;
            if (intent.type === EnemyIntentType.ATTACK || intent.type === EnemyIntentType.ATTACK_DEBUFF || intent.type === EnemyIntentType.ATTACK_DEFEND) {
                let damage = intent.value + (e.strength || 0);
                if (e.weak > 0) damage = Math.floor(damage * 0.75);
                if (p.powers['INTANGIBLE'] > 0) damage = 1;
                
                // Multi-hit logic not fully implemented in intent struct, assuming single hit mostly
                if (p.powers['STATIC_DISCHARGE']) { e.currentHp -= p.powers['STATIC_DISCHARGE']; e.floatingText = createDamageText(p.powers['STATIC_DISCHARGE'], 'DAMAGE'); }
                if (p.powers['BUFFER'] > 0) { 
                    p.powers['BUFFER']--; 
                    damage = 0; 
                }
                
                let blocked = false;
                if (p.block >= damage) { p.block -= damage; damage = 0; blocked = true; }
                else { damage -= p.block; p.block = 0; }
                
                p.currentHp -= damage;
                if (damage > 0) p.floatingText = createDamageText(damage, 'DAMAGE');
                
                if (p.powers['THORNS'] && !blocked) {
                    e.currentHp -= p.powers['THORNS'];
                    e.floatingText = createDamageText(p.powers['THORNS'], 'DAMAGE');
                }

                if (intent.secondaryValue && intent.type === EnemyIntentType.ATTACK_DEFEND) e.block += intent.secondaryValue;
                if (intent.secondaryValue && intent.type === EnemyIntentType.ATTACK_DEBUFF && intent.debuffType) {
                    // Apply debuff to player
                    // Simplified: Assuming player doesn't have complex debuff struct, using existing weak/vuln/poison
                    // Usually player debuffs are handled via Artifact check too
                    if (p.relics.find(r=>r.id==='ORANGE_PELLETS')) { /* logic to clear handled in card play */ }
                    // Apply logic
                }
            } else if (intent.type === EnemyIntentType.DEFEND) {
                e.block = intent.value;
            } else if (intent.type === EnemyIntentType.BUFF) {
                e.strength += (intent.secondaryValue || 2);
            } else if (intent.type === EnemyIntentType.DEBUFF) {
                // Apply debuff
            }
            
            if (e.vulnerable > 0) e.vulnerable--;
            if (e.weak > 0) e.weak--;

            // Determine Next Intent
            e.nextIntent = getNextEnemyIntent(e, prev.turn + 1);

            return { ...prev, player: p, enemies: newEnemies, turn: prev.turn + 1 };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    // Process End of Turn Curses/Statuses
    setGameState(prev => {
        const p = { ...prev.player };
        if (p.powers['INTANGIBLE'] > 0) p.powers['INTANGIBLE']--;
        if (p.powers['METALLICIZE']) {/* handled start turn */}
        
        // Curse Logic
        p.hand.forEach(c => {
            if (c.name === 'やけど') { p.currentHp -= 2; p.floatingText = createDamageText(2, 'DAMAGE'); }
            if (c.name === '虫歯') { p.currentHp -= 2; p.floatingText = createDamageText(2, 'DAMAGE'); }
            if (c.name === '後悔') { p.currentHp -= p.hand.length; p.floatingText = createDamageText(p.hand.length, 'DAMAGE'); }
        });

        p.discardPile = [...p.discardPile, ...p.hand];
        p.hand = [];
        return { ...prev, player: p };
    });
    startPlayerTurn();
  };

  // --- Battle End Check & Rewards (Update) ---
  const goToMathChallenge = () => {
      setGameState(prev => ({ ...prev, screen: GameScreen.MATH_CHALLENGE }));
  };

  const handleMathComplete = (correctCount: number) => {
      audioService.playSound(correctCount === 3 ? 'win' : 'select');
      goToRewardPhase(correctCount);
  };

  const goToRewardPhase = (mathScore: number = 3) => {
    const rewards: RewardItem[] = [];
    const allCards = Object.values(CARDS_LIBRARY).filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL');
    
    // Adjust Rarity based on Math Score (0-3)
    while(rewards.length < 3) {
        const roll = Math.random() * 100;
        let targetRarity = 'COMMON';
        
        if (mathScore === 3) {
            if (roll > 93) targetRarity = 'LEGENDARY'; else if (roll > 60) targetRarity = 'RARE'; else if (roll > 25) targetRarity = 'UNCOMMON';
        } else if (mathScore === 2) {
            if (roll > 95) targetRarity = 'LEGENDARY'; else if (roll > 75) targetRarity = 'RARE'; else if (roll > 40) targetRarity = 'UNCOMMON';
        } else if (mathScore === 1) {
            if (roll > 90) targetRarity = 'UNCOMMON';
        }

        const pool = allCards.filter(c => c.rarity === targetRarity).length > 0 ? allCards.filter(c => c.rarity === targetRarity) : allCards.filter(c => c.rarity === 'COMMON');
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        if (!rewards.some(r => r.value.name === candidate.name)) {
            rewards.push({ type: 'CARD', value: { ...candidate, id: `reward-${Date.now()}-${rewards.length}` }, id: `rew-${Date.now()}-${rewards.length}` });
        }
    }

    const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
    if (currentNode && currentNode.type === NodeType.BOSS) {
        const bossRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'BOSS');
        const relic = bossRelics[Math.floor(Math.random() * bossRelics.length)];
        rewards.push({ type: 'RELIC', value: relic, id: `rew-relic-${Date.now()}` });
        rewards.push({ type: 'GOLD', value: 100, id: `rew-gold-${Date.now()}` });
    }

    if (Math.random() < 0.4 && !gameState.player.relics.find(r => r.id === 'SOZU')) {
        const allPotions = Object.values(POTION_LIBRARY);
        const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
        rewards.push({ type: 'POTION', value: { ...potion, id: `rew-pot-${Date.now()}` }, id: `rew-pot-${Date.now()}` });
    }

    setGameState(prev => ({ ...prev, screen: GameScreen.REWARD, rewards: rewards }));
    audioService.playSound('select');
  };

  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            audioService.playSound('win');
            audioService.stopBGM();
            let hpRegen = 0;
            if (gameState.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;
            if (gameState.player.relics.find(r => r.id === 'MEAT_ON_THE_BONE') && (gameState.player.currentHp / gameState.player.maxHp <= 0.5)) hpRegen += 12;
            
            setGameState(prev => ({ 
                ...prev, 
                player: { ...prev.player, gold: prev.player.gold + VICTORY_GOLD, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) },
                screen: GameScreen.VICTORY 
            }));

            if (gameState.act === 4 && !gameState.isEndless) {
                 storageService.clearSave(); 
                 storageService.incrementClearCount(); 
                 recordScore(true); 
                 setClearCount(storageService.getClearCount()); 
                 setGameState(prev => ({ ...prev, screen: GameScreen.ENDING }));
            }
        } else if (gameState.player.currentHp <= 0) {
            if (gameState.player.relics.find(r => r.id === 'LIZARD_TAIL') && (gameState.player.relicCounters['LIZARD_TAIL'] === undefined || gameState.player.relicCounters['LIZARD_TAIL'] === 0)) {
                // Revive Logic
                setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.floor(prev.player.maxHp * 0.5), relicCounters: { ...prev.player.relicCounters, 'LIZARD_TAIL': 1 } } }));
                return;
            }
            if (gameState.player.potions.find(p => p.templateId === 'GHOST_IN_JAR')) {
                 setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.floor(prev.player.maxHp * 0.1), potions: prev.player.potions.filter(p => p.templateId !== 'GHOST_IN_JAR') } })); // Simplified consume
                 return;
            }

            audioService.playSound('lose');
            audioService.stopBGM();
            storageService.clearSave();
            recordScore(false); 
            setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
        }
    }
  }, [gameState.enemies, gameState.player.currentHp, gameState.screen]);

  // --- Reward Selection & Completion ---
  const handleRewardSelection = (item: RewardItem) => {
      if (isLoading) return;
      audioService.playSound('select');

      setGameState(prev => {
          let p = { ...prev.player };
          let nextRewards = [...prev.rewards];

          if (item.type === 'CARD') {
              p.deck = [...p.deck, item.value];
              unlockCards([item.value]);
              nextRewards = nextRewards.filter(r => r.type !== 'CARD');
          } else if (item.type === 'RELIC') {
              p.relics = [...p.relics, item.value];
              if (item.value.id === 'SOZU') p.maxEnergy += 1;
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

  const handleRestAction = () => { setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.currentHp + Math.floor(prev.player.maxHp * 0.3), prev.player.maxHp) } })); };
  const handleUpgradeCard = (card: ICard) => { setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.map(c => c.id === card.id ? getUpgradedCard(c) : c) } })); };
  const handleRemoveCard = (cardId: string, cost: number) => { setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - cost, deck: prev.player.deck.filter(c => c.id !== cardId) } })); };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[600px] border-[10px] md:border-[20px] border-gray-800 rounded-xl relative overflow-hidden shadow-2xl bg-black crt-scanline">
            
            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center p-8 relative w-full h-full flex flex-col justify-center items-center">
                        <div className="absolute bottom-4 right-4 text-gray-600 text-xs font-mono">v2.0.1</div>
                        <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-blue-600 mb-8 font-bold animate-pulse tracking-widest">
                            かけ算ローグ<br/><span className="text-2xl text-white">小学校の伝説</span>
                        </h1>
                        <div className="flex flex-col gap-4 items-center w-64">
                            {hasSave && (
                                <button onClick={continueGame} className="bg-green-700 text-white px-8 py-4 text-xl font-bold border-4 border-green-500 hover:bg-green-600 cursor-pointer w-full flex items-center justify-center animate-bounce">
                                    <Play className="mr-2" /> 続きから
                                </button>
                            )}
                            <button onClick={startGame} disabled={isLoading} className="bg-white text-black px-8 py-4 text-xl font-bold border-4 border-gray-500 hover:bg-gray-200 cursor-pointer w-full">
                                {isLoading ? "生成中..." : "はじめから"}
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.RANKING }))} className="bg-blue-900 text-yellow-400 px-8 py-3 text-lg font-bold border-4 border-blue-500 hover:bg-blue-800 cursor-pointer w-full flex items-center justify-center">
                                <ScrollText className="mr-2"/> 冒険ログ
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.COMPENDIUM }))} className="bg-gray-800 text-amber-500 px-8 py-3 text-lg font-bold border-4 border-amber-600 hover:bg-gray-700 cursor-pointer w-full flex items-center justify-center">
                                <BookOpen className="mr-2"/> カード図鑑
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.HELP }))} className="bg-gray-700 text-white px-8 py-3 text-lg font-bold border-4 border-gray-500 hover:bg-gray-600 cursor-pointer w-full flex items-center justify-center">
                                <HelpCircle className="mr-2"/> 遊び方
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.HELP && <HelpScreen onBack={returnToTitle} />}
            {gameState.screen === GameScreen.RANKING && <RankingScreen onBack={returnToTitle} />}
            {gameState.screen === GameScreen.CHARACTER_SELECTION && <CharacterSelectionScreen characters={CHARACTERS} unlockedCount={clearCount + 1} onSelect={handleCharacterSelect} />}
            {gameState.screen === GameScreen.RELIC_SELECTION && <RelicSelectionScreen relics={starterRelics} onSelect={handleRelicSelect} />}
            {gameState.screen === GameScreen.COMPENDIUM && <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={returnToTitle} />}
            {gameState.screen === GameScreen.MAP && <MapScreen nodes={gameState.map} currentNodeId={gameState.currentMapNodeId} onNodeSelect={handleNodeSelect} player={gameState.player} />}
            
            {gameState.screen === GameScreen.BATTLE && (
                <BattleScene 
                    player={gameState.player} enemies={gameState.enemies} selectedEnemyId={gameState.selectedEnemyId} onSelectEnemy={handleSelectEnemy} onPlayCard={handlePlayCard} onEndTurn={handleEndTurn} turnLog={turnLog} narrative={currentNarrative} lastActionTime={lastActionTime} lastActionType={lastActionType} actingEnemyId={actingEnemyId} selectionState={gameState.selectionState} onHandSelection={handleHandSelection}
                    onUsePotion={handleUsePotion}
                />
            )}

            {gameState.screen === GameScreen.VICTORY && (
                 <div className="w-full h-full bg-green-900 flex items-center justify-center text-center text-white">
                    <div>
                        <h1 className="text-4xl mb-4 text-yellow-400 font-bold">勝利！</h1>
                        <div className="text-yellow-400 text-2xl font-bold mb-4 flex items-center justify-center"><Coins className="mr-2"/> +{VICTORY_GOLD} 円</div>
                        <button onClick={goToMathChallenge} className="bg-blue-600 px-8 py-4 border-2 border-white font-bold animate-bounce cursor-pointer">
                            かけ算チャレンジへ！
                        </button>
                    </div>
                 </div>
            )}

            {gameState.screen === GameScreen.MATH_CHALLENGE && (
                <MathChallengeScreen onComplete={handleMathComplete} />
            )}

            {gameState.screen === GameScreen.REWARD && <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} />}
            {gameState.screen === GameScreen.TREASURE && <TreasureScreen onOpen={handleOpenTreasure} onLeave={handleNodeComplete} rewards={treasureRewards} hasCursedKey={!!gameState.player.relics.find(r => r.id === 'CURSED_KEY')} />}
            {gameState.screen === GameScreen.REST && <RestScreen player={gameState.player} onRest={handleRestAction} onUpgrade={handleUpgradeCard} onLeave={handleNodeComplete} />}
            
            {gameState.screen === GameScreen.SHOP && (
                <ShopScreen 
                    player={gameState.player} shopCards={shopCards} shopRelics={shopRelics} shopPotions={shopPotions} onBuyCard={(card) => { setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((card.price||50)*0.5) : (card.price||50)), deck: [...prev.player.deck, { ...card, id: `buy-${Date.now()}` }], discardPile: [...prev.player.discardPile, { ...card, id: `buy-${Date.now()}` }] } })); }} onBuyRelic={(relic) => { setGameState(prev => { const counters = { ...prev.player.relicCounters }; if (relic.id === 'PEN_NIB') counters['PEN_NIB'] = 0; if (relic.id === 'HAPPY_FLOWER') counters['HAPPY_FLOWER'] = 1; return { ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((relic.price||150)*0.5) : (relic.price||150)), relics: [...prev.player.relics, relic], relicCounters: counters } }; }); }} onBuyPotion={(potion) => { if (gameState.player.potions.length < 3) { setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((potion.price||50)*0.5) : (potion.price||50)), potions: [...prev.player.potions, { ...potion, id: `buy-pot-${Date.now()}` }] } })); } }} onRemoveCard={handleRemoveCard} onLeave={handleNodeComplete}
                />
            )}

            {gameState.screen === GameScreen.EVENT && eventData && <EventScreen title={eventData.title} description={eventData.description} options={eventData.options} resultLog={eventResultLog} onContinue={handleNodeComplete} />}
            {gameState.screen === GameScreen.GAME_OVER && <div className="w-full h-full bg-red-900 flex items-center justify-center text-center text-white"><div><h1 className="text-6xl mb-4 font-bold">保健室送り...</h1><p className="mb-8 text-2xl">Act {gameState.act} - Floor {gameState.floor}</p><div className="flex flex-col gap-4 items-center"><button onClick={startGame} className="bg-black border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-800 flex items-center justify-center"><RotateCcw className="mr-2" size={20} /> 再挑戦</button><button onClick={returnToTitle} className="bg-gray-700 border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-600 flex items-center justify-center"><Home className="mr-2" size={20} /> タイトルへ戻る</button></div></div></div>}
            
            {gameState.screen === GameScreen.ENDING && (
                 <div className="w-full h-full bg-yellow-900 flex items-center justify-center text-center text-white">
                    <div>
                        <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-pulse" />
                        <h1 className="text-6xl mb-4 font-bold text-yellow-200">卒業おめでとう！</h1>
                        <p className="mb-4 text-xl">あなたは校長先生を打ち破り、<br/>最強の小学生になりました。</p>
                        <p className="mb-8 text-md text-yellow-300 font-bold">新たな友達がアンロックされました！</p>
                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={returnToTitle} className="bg-blue-600 border-2 border-white px-8 py-4 cursor-pointer text-xl hover:bg-blue-500 font-bold w-64">伝説となる</button>
                            <button onClick={startEndlessMode} className="bg-purple-800 border-2 border-purple-400 px-8 py-4 cursor-pointer text-xl hover:bg-purple-700 font-bold w-64 flex items-center justify-center">
                                <Infinity className="mr-2" /> 中学校編 (エンドレス)
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
