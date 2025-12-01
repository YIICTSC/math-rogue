
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
import Card from './components/Card';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle, Send, Swords, Terminal, FlaskConical, ArrowRight, Trash2 } from 'lucide-react';

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
            if (localTurn === 0) return { type: EnemyIntentType.ATTACK, value: isAct2Plus ? 5 : 3 }; 
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
    battleLog: [], // Initialize
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
  const [isChallengeSetup, setIsChallengeSetup] = useState<boolean>(false);
  const [showDebugLog, setShowDebugLog] = useState<boolean>(false);
  
  // Potion Management State
  const [pendingPotion, setPendingPotion] = useState<{item: Potion, cost?: number} | null>(null);
  
  // Debug Logic
  const [isMathDebugSkipped, setIsMathDebugSkipped] = useState<boolean>(false);
  const [isDebugHpOne, setIsDebugHpOne] = useState<boolean>(false);
  const [titleClickCount, setTitleClickCount] = useState<number>(0);
  const [logClickCount, setLogClickCount] = useState<number>(0);

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
      if (gameState.screen !== GameScreen.START_MENU && 
          gameState.screen !== GameScreen.GAME_OVER && 
          gameState.screen !== GameScreen.ENDING &&
          gameState.screen !== GameScreen.VICTORY &&
          gameState.screen !== GameScreen.MATH_CHALLENGE && 
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

  const addToBattleLog = (msg: string) => {
      setGameState(prev => ({
          ...prev,
          battleLog: [...prev.battleLog, `[T${prev.turn}] ${msg}`]
      }));
  };

  const handleAcquirePotion = (potion: Potion, cost?: number) => {
      if (gameState.player.potions.length < 3) {
          setGameState(prev => ({
              ...prev,
              player: {
                  ...prev.player,
                  gold: cost ? prev.player.gold - cost : prev.player.gold,
                  potions: [...prev.player.potions, { ...potion, id: `pot-${Date.now()}` }]
              }
          }));
          storageService.saveUnlockedPotion(potion.templateId);
          audioService.playSound('select');
      } else {
          setPendingPotion({ item: potion, cost });
          audioService.playSound('select');
      }
  };

  const handleReplacePotion = (oldPotionId: string) => {
      if (!pendingPotion) return;
      
      setGameState(prev => {
          const p = { ...prev.player };
          if (pendingPotion.cost && p.gold < pendingPotion.cost) return prev; 

          if (pendingPotion.cost) p.gold -= pendingPotion.cost;
          
          p.potions = p.potions.map(pot => {
              if (pot.id === oldPotionId) {
                  return { ...pendingPotion.item, id: `pot-${Date.now()}` };
              }
              return pot;
          });
          
          return { ...prev, player: p };
      });
      storageService.saveUnlockedPotion(pendingPotion.item.templateId);
      audioService.playSound('select');
      setPendingPotion(null);
  };

  const startPlayerTurn = () => {
    setTurnLog("プレイヤーターン");
    setGameState(prev => {
      const p = { ...prev.player };
      
      let carryOverEnergy = 0;
      if (p.relics.find(r => r.id === 'ICE_CREAM')) {
          carryOverEnergy = p.currentEnergy;
      }
      p.currentEnergy = p.maxEnergy + p.nextTurnEnergy + carryOverEnergy;
      
      const drawCount = HAND_SIZE + (p.powers['TOOLS_OF_THE_TRADE'] ? 1 : 0) + p.nextTurnDraw;
      p.nextTurnEnergy = 0;
      p.nextTurnDraw = 0;

      if (p.powers['DEMON_FORM']) p.strength += p.powers['DEMON_FORM'];
      if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
      if (p.powers['DEVA_FORM']) {
          p.currentEnergy += p.powers['DEVA_FORM'];
          p.powers['DEVA_FORM']++; 
      }
      
      if (p.relics.find(r => r.id === 'MERCURY_HOURGLASS')) {
          prev.enemies.forEach(e => { e.currentHp -= 3; if (e.currentHp < 0) e.currentHp = 0; });
      }
      if (p.relics.find(r => r.id === 'HORN_CLEAT') && prev.turn === 1) { 
          p.block += 14;
      }

      if (p.powers['CREATIVE_AI']) {
          const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
          const power = { ...powers[Math.floor(Math.random() * powers.length)], id: `creative-${Date.now()}`, cost: 0 };
          if (p.hand.length < 10) p.hand = [...p.hand, power]; 
      }
      if (p.powers['INFINITE_BLADES']) {
           const shiv: ICard = { ...CARDS_LIBRARY['SHIV'], id: `inf-${Date.now()}` };
           if (p.powers['ACCURACY']) shiv.damage = (shiv.damage || 4) + p.powers['ACCURACY'];
           if (p.hand.length < 10) p.hand = [...p.hand, shiv];
      }
      
      if (p.relics.find(r => r.id === 'WARPED_TONGS') && p.hand.length > 0) {
          const idx = Math.floor(Math.random() * p.hand.length);
          const c = p.hand[idx];
          if (!c.upgraded) {
              p.hand[idx] = getUpgradedCard(c);
          }
      }

      if (p.relics.find(r => r.id === 'HAPPY_FLOWER')) {
          const current = (p.relicCounters['HAPPY_FLOWER'] || 0) + 1;
          if (current >= 3) {
              p.currentEnergy += 1;
              p.relicCounters['HAPPY_FLOWER'] = 0;
              p.floatingText = { id: `hf-${Date.now()}`, text: '+1 Energy', color: 'text-yellow-400', iconType: 'zap' };
          } else {
              p.relicCounters['HAPPY_FLOWER'] = current;
          }
      }

      ['SHURIKEN', 'KUNAI', 'ORNAMENTAL_FAN'].forEach(id => {
          if (p.relics.find(r => r.id === id)) {
              p.relicCounters[id] = 0;
          }
      });

      let newDrawPile = [...p.drawPile];
      let newDiscardPile = [...p.discardPile];
      let newHand = [...p.hand];
      
      let totalDraw = drawCount;
      if (p.relics.find(r => r.id === 'SNECKO_EYE')) totalDraw += 2;

      const drawCard = () => {
          if (newDrawPile.length === 0) {
              if (newDiscardPile.length === 0) return null;
              newDrawPile = shuffle(newDiscardPile);
              newDiscardPile = [];
          }
          return newDrawPile.pop();
      };

      for (let i = 0; i < totalDraw; i++) {
        if (newHand.length >= 10) break;
        const card = drawCard();
        if (card) {
            if (card.name === '虚無' || card.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
            if (p.relics.find(r => r.id === 'SNECKO_EYE') && card.cost >= 0) {
                card.cost = Math.floor(Math.random() * 4);
            }
            newHand.push(card);
        }
      }

      if (!p.powers['BARRICADE'] && !p.powers['CALIPERS']) p.block = 0;
      else if (p.powers['CALIPERS']) {
          p.block = Math.max(0, p.block - 15);
      }

      p.hand = newHand;
      p.drawPile = newDrawPile;
      p.discardPile = newDiscardPile;
      p.cardsPlayedThisTurn = 0;
      p.attacksPlayedThisTurn = 0;
      p.turnFlags = {}; 

      return { ...prev, player: p, turn: prev.turn + 1, enemies: prev.enemies.filter(e => e.currentHp > 0) };
    });
  };

  const generateEvent = (player: Player) => {
      const events = [
          {
              title: "不審な上級生",
              description: "廊下の隅で、怪しい上級生が手招きしている。「いいもんあるぜ...」",
              options: [
                  { label: "買う", text: "20G支払ってポーションを得る。", action: () => {
                      if (player.gold >= 20) {
                          const pots = Object.values(POTION_LIBRARY);
                          const pot = { ...pots[Math.floor(Math.random() * pots.length)], id: `pot-${Date.now()}` };
                          
                          setGameState(prev => {
                              let newPots = [...prev.player.potions];
                              if (newPots.length >= 3) newPots.shift();
                              newPots.push(pot);
                              storageService.saveUnlockedPotion(pot.templateId);
                              return { ...prev, player: { ...prev.player, gold: prev.player.gold - 20, potions: newPots } };
                          });
                          setEventResultLog("ポーションをこっそり受け取った！(満杯なら古いものを捨てた)");
                      } else {
                          setEventResultLog("お金が足りないとわかると、上級生は舌打ちをした。");
                      }
                  }},
                  { label: "無視", text: "何もせず立ち去る。", action: () => setEventResultLog("君は目を合わせずに通り過ぎた。") }
              ]
          },
          {
              title: "冷水機",
              description: "冷たくて美味しそうな水が出る冷水機だ。喉が渇いている。",
              options: [
                  { label: "飲む", text: "HPを20回復。", action: () => {
                      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } }));
                      setEventResultLog("冷たい水が体に染み渡る！体力が回復した。");
                  }},
                  { label: "顔を洗う", text: "呪いを全て消す。", action: () => {
                      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.filter(c => c.type !== CardType.CURSE) } }));
                      setEventResultLog("気分がスッキリして、悪い予感が消え去った！");
                  }}
              ]
          },
          {
              title: "忘れ物ボックス",
              description: "誰かの忘れ物がたくさん入った箱がある。役立ちそうなものがあるかも？",
              options: [
                  { label: "探す", text: "カードを1枚強化。", action: () => {
                      setGameState(prev => {
                          const p = { ...prev.player };
                          const upgradable = p.deck.filter(c => !c.upgraded);
                          if (upgradable.length > 0) {
                              const target = upgradable[Math.floor(Math.random() * upgradable.length)];
                              p.deck = p.deck.map(c => c.id === target.id ? getUpgradedCard(c) : c);
                              setEventResultLog(`使えそうな部品を見つけた！${target.name} が強化された！`);
                          } else {
                              setEventResultLog("ガラクタしかなかった...");
                          }
                          return { ...prev, player: p };
                      });
                  }},
                  { label: "深く探る", text: "レリックを探す (ダメージを受けるかも)", action: () => {
                      const r = Math.random();
                      if (r < 0.7) {
                          storageService.saveUnlockedRelic(RELIC_LIBRARY.WARPED_TONGS.id); 
                          setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.WARPED_TONGS] } }));
                          setEventResultLog("底の方から「ゆがんだフォーク」を見つけた！");
                      } else {
                          setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                          setEventResultLog("痛っ！画鋲が刺さってしまった...");
                      }
                  }}
              ]
          },
          {
              title: "図書室の主",
              description: "静かな図書室で、不思議な雰囲気の生徒が本を読んでいる。",
              options: [
                  { label: "教えてもらう", text: "HPを10失う。特別な本(レリック)を得る。", action: () => {
                      const books = [RELIC_LIBRARY.NECRONOMICON, RELIC_LIBRARY.ENCHIRIDION, RELIC_LIBRARY.NILRYS_CODEX];
                      const book = books[Math.floor(Math.random() * books.length)];
                      storageService.saveUnlockedRelic(book.id); 
                      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10), relics: [...prev.player.relics, book] } }));
                      setEventResultLog("厳しい指導を受けたが、秘伝の書を譲り受けた！");
                  }},
                  { label: "立ち去る", text: "", action: () => setEventResultLog("静かにその場を離れた。") }
              ]
          }
      ];
      return events[Math.floor(Math.random() * events.length)];
  };

  const continueGame = () => {
      const saved = storageService.loadGame();
      if (saved) {
          if (!saved.battleLog) saved.battleLog = [];
          setGameState(saved);
          audioService.playBGM(saved.screen === GameScreen.BATTLE ? 'battle' : 'menu');
      }
  };

  const startChallengeGame = () => {
      setGameState(prev => ({ ...prev, challengeMode: '1A1D' }));
      setIsChallengeSetup(true);
      startGame();
  };

  const startEndlessMode = () => {
      const newAct = gameState.act + 1; 
      const newMap = generateDungeonMap();
      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          act: newAct,
          floor: 0,
          map: newMap,
          currentMapNodeId: null,
          isEndless: true,
          narrativeLog: [...prev.narrativeLog, `エンドレスモード開始！ Act ${newAct}へ...`],
          battleLog: []
      }));
      audioService.playBGM('menu');
  };

  const startGame = async () => {
      try {
          setErrorMessage("");
          setIsLoading(true);
          audioService.init();
          audioService.playSound('select');
          
          if (isChallengeSetup) {
              setGameState(prev => ({ ...prev, screen: GameScreen.CHARACTER_SELECTION }));
          } else {
              setGameState(prev => ({ ...prev, screen: GameScreen.MODE_SELECTION }));
          }
      } catch (e) {
          console.error("Start Game Error:", e);
          setErrorMessage("エラーが発生しました。");
      } finally {
          setIsLoading(false);
      }
  };

  const handleModeSelect = (mode: GameMode) => {
      setGameState(prev => ({ ...prev, mode: mode, screen: GameScreen.CHARACTER_SELECTION }));
      audioService.playSound('select');
  };

  const handleCharacterSelect = (char: Character) => {
      setSelectedCharName(char.name);
      const startingDeck = createDeck(char.deckTemplate);
      
      const legacyCard = storageService.getLegacyCard();
      if (legacyCard) {
          startingDeck.push({ ...legacyCard, id: `legacy-${Date.now()}` });
      }

      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              maxHp: char.maxHp,
              currentHp: char.maxHp,
              gold: char.gold,
              deck: startingDeck,
              imageData: char.imageData,
              relics: [] 
          },
      }));
      
      const charRelic = RELIC_LIBRARY[char.startingRelicId];
      if (charRelic) {
           storageService.saveUnlockedRelic(charRelic.id);
           setGameState(prev => ({
               ...prev,
               player: { ...prev.player, relics: [...prev.player.relics, charRelic] }
           }));
      }

      const starters = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'STARTER' && r.id !== char.startingRelicId);
      const randomStarters = shuffle(starters).slice(0, 2);
      setStarterRelics(randomStarters);

      setGameState(prev => ({ ...prev, screen: GameScreen.RELIC_SELECTION }));
      audioService.playSound('select');
  };

  const handleRelicSelect = (relic: Relic) => {
      const map = generateDungeonMap();
      storageService.saveUnlockedRelic(relic.id);
      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          map: map,
          player: {
              ...prev.player,
              relics: [...prev.player.relics, relic],
              maxEnergy: relic.id === 'HOLY_WATER' ? prev.player.maxEnergy + 1 : prev.player.maxEnergy
          },
          narrativeLog: ["冒険が始まった。"],
          battleLog: []
      }));
      audioService.playBGM('menu');
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
            
            if (gameState.act === 4 && node.type === NodeType.BOSS && !gameState.isEndless) {
                const boss: Enemy = {
                    id: 'true-boss',
                    enemyType: 'THE_HEART',
                    name: TRUE_BOSS.name,
                    maxHp: isDebugHpOne ? 1 : TRUE_BOSS.maxHp,
                    currentHp: isDebugHpOne ? 1 : TRUE_BOSS.maxHp,
                    block: 0,
                    strength: 0,
                    nextIntent: { type: EnemyIntentType.UNKNOWN, value: 0 },
                    vulnerable: 0, weak: 0, poison: 0, artifact: 2, corpseExplosion: false,
                    floatingText: null
                };
                boss.nextIntent = getNextEnemyIntent(boss, 1);
                enemies.push(boss);
                audioService.playBGM('battle');
            } else {
                const numEnemies = node.type === NodeType.BOSS ? 1 : Math.floor(Math.random() * Math.min(3, 1 + Math.floor(node.y / 3))) + 1;
                for (let i = 0; i < numEnemies; i++) {
                    const baseHp = (node.type === NodeType.BOSS ? 100 : 15) * actMultiplier + floorDifficulty + (node.type === NodeType.ELITE ? 20 : 0);
                    const name = await generateEnemyName(node.y);
                    const isBoss = node.type === NodeType.BOSS;
                    const type = determineEnemyType(name, isBoss);
                    
                    const enemy: Enemy = {
                        id: `enemy-${node.y}-${i}-${Date.now()}`,
                        enemyType: type,
                        name: isBoss ? `ボス: ${name}` : name,
                        maxHp: isDebugHpOne ? 1 : Math.floor(baseHp),
                        currentHp: isDebugHpOne ? 1 : Math.floor(baseHp),
                        block: 0,
                        strength: 0,
                        nextIntent: { type: EnemyIntentType.UNKNOWN, value: 0 }, 
                        vulnerable: 0, weak: 0, poison: 0, artifact: 0, corpseExplosion: false,
                        floatingText: null
                    };
                    enemy.nextIntent = getNextEnemyIntent(enemy, 1);
                    enemies.push(enemy);
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
            
            if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) p.strength += 3;

            p.powers = {};
            
            if (p.relics.find(r => r.id === 'ENCHIRIDION')) {
                const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
                const power = powers[Math.floor(Math.random() * powers.length)];
                p.hand.push({ ...power, id: `ench-${Date.now()}`, cost: 0 }); 
            }
            if (p.relics.find(r => r.id === 'RED_MASK')) enemies.forEach(e => e.weak += 1);
            if (p.relics.find(r => r.id === 'MEGAPHONE')) enemies.forEach(e => e.vulnerable += 1);
            if (p.relics.find(r => r.id === 'HACHIMAKI')) p.powers['DEXTERITY'] = 1;
            if (p.relics.find(r => r.id === 'BIG_LADLE')) { p.maxHp += 4; p.currentHp += 4; } 
            if (p.relics.find(r => r.id === 'WHISTLE')) {
                 const attacks = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.ATTACK);
                 const atk = attacks[Math.floor(Math.random() * attacks.length)];
                 p.hand.push({ ...atk, id: `whistle-${Date.now()}`, cost: 0 });
            }
            if (p.relics.find(r => r.id === 'SEED_PACK')) p.powers['THORNS'] = 3;

            p.echoes = 0;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;

            
            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            
            let drawCount = HAND_SIZE;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
            
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3; 
            if (p.relics.find(r => r.id === 'LANTERN')) p.currentEnergy += 1;
            
            for(let i=0; i<drawCount; i++) {
                if(p.drawPile.length > 0) {
                    const c = p.drawPile.pop();
                    if(c) {
                        if (p.relics.find(r => r.id === 'SNECKO_EYE') && c.cost >= 0) c.cost = Math.floor(Math.random() * 4);
                        p.hand.push(c);
                    }
                }
            }
            
            const innateIndices = p.drawPile.map((c, i) => c.innate ? i : -1).filter(i => i !== -1).reverse();
            innateIndices.forEach(idx => {
                 const c = p.drawPile.splice(idx, 1)[0];
                 p.hand.push(c);
            });

            setGameState({
                ...nextState,
                screen: GameScreen.BATTLE,
                player: p,
                enemies: enemies,
                selectedEnemyId: enemies[0].id,
                narrativeLog: [...nextState.narrativeLog, flavor],
                battleLog: [`戦闘開始: ${enemies.map(e => e.name).join(', ')}`],
                turn: 1
            });
            setCurrentNarrative(flavor);
            audioService.playBGM('battle');
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

            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'SHOP' || r.rarity === 'COMMON' || r.rarity === 'RARE' || r.rarity === 'UNCOMMON');
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
            setEventResultLog(null);
            setGameState({ ...nextState, screen: GameScreen.EVENT });
            audioService.playBGM('menu');
        
        } else if (node.type === NodeType.TREASURE) {
            const rewards: RewardItem[] = [];
            const r = Math.random();
            if (r < 0.5) {
                rewards.push({ type: 'GOLD', value: 50 + Math.floor(Math.random() * 100), id: `tr-gold-${Date.now()}` });
            } 
            if (r < 0.8) {
                const relics = Object.values(RELIC_LIBRARY).filter(rel => rel.rarity !== 'BOSS' && rel.rarity !== 'STARTER');
                const relic = relics[Math.floor(Math.random() * relics.length)];
                rewards.push({ type: 'RELIC', value: relic, id: `tr-relic-${Date.now()}` });
            }
            rewards.push({ type: 'CARD', value: { ...CURSE_CARDS.DOUBT, id: 'temp' }, id: 'placeholder' });
            setTreasureRewards(rewards.filter(r => r.id !== 'placeholder'));
            setGameState({ ...nextState, screen: GameScreen.TREASURE });
            audioService.playBGM('menu');
        }

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSynthesizeCard = (c1: ICard, c2: ICard) => {
      const newName = c1.name.substring(0, 2) + c2.name.substring(c2.name.length - 2);
      const newCard: ICard = {
          ...c1,
          id: `synth-${Date.now()}`,
          name: newName,
          cost: Math.max(c1.cost, c2.cost),
          damage: (c1.damage||0) + (c2.damage||0) || undefined,
          block: (c1.block||0) + (c2.block||0) || undefined,
          description: "合成されたカード",
          rarity: 'SPECIAL'
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

  const handleSelectEnemy = (id: string) => {
    setGameState(prev => ({ ...prev, selectedEnemyId: id }));
  };

  const handleHandSelection = (card: ICard) => {
      setGameState(prev => {
          const p = { ...prev.player };
          const mode = prev.selectionState;
          
          if (mode.type === 'DISCARD' || mode.type === 'EXHAUST') {
              p.hand = p.hand.filter(c => c.id !== card.id);
              if (mode.type === 'DISCARD') {
                 p.discardPile.push(card);
                 addToBattleLog(`捨てた: ${card.name}`);
                 if (card.name === '作戦' || card.name === 'STRATEGIST') {
                     p.currentEnergy += 2;
                 }
              } else if (mode.type === 'EXHAUST') {
                 addToBattleLog(`廃棄: ${card.name}`);
                 if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
              }
              const newAmount = mode.amount - 1;
              return { ...prev, player: p, selectionState: { ...mode, active: newAmount > 0, amount: newAmount } };
          }
          if (mode.type === 'COPY') {
             const copy = { ...card, id: `copy-${Date.now()}` };
             p.hand.push(copy);
             addToBattleLog(`コピー: ${card.name}`);
             const newAmount = mode.amount - 1;
             return { ...prev, player: p, selectionState: { ...mode, active: newAmount > 0, amount: newAmount } };
          }
          return prev;
      });
  };

  const handleUsePotion = (potion: Potion) => {
      if (gameState.screen !== GameScreen.BATTLE) return;
      audioService.playSound('select');
      addToBattleLog(`ポーション使用: ${potion.name}`);
      
      setGameState(prev => {
          const p = { ...prev.player };
          const enemies = [...prev.enemies];
          p.potions = p.potions.filter(pt => pt.id !== potion.id);
          const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];

          if (potion.templateId === 'FIRE_POTION' && target) {
              target.currentHp -= 20;
              target.floatingText = { id: `dmg-${Date.now()}`, text: '20', color: 'text-red-500' };
          } else if (potion.templateId === 'BLOCK_POTION') {
              p.block += 12;
          } else if (potion.templateId === 'STRENGTH_POTION') {
              p.strength += 2;
          } else if (potion.templateId === 'ENERGY_POTION') {
              p.currentEnergy += 2;
          } else if (potion.templateId === 'WEAK_POTION' && target) {
              if (target.artifact > 0) target.artifact--;
              else target.weak += 3;
          } else if (potion.templateId === 'POISON_POTION' && target) {
              target.poison += 6;
          } else if (potion.templateId === 'HEALTH_POTION') {
              p.currentHp = Math.min(p.maxHp, p.currentHp + 15);
          } else if (potion.templateId === 'LIQUID_BRONZE') {
              p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
          } else if (potion.templateId === 'GAMBLERS_BREW') {
              p.discardPile = [...p.discardPile, ...p.hand];
              p.hand = [];
          }

          const remainingEnemies = enemies.filter(e => e.currentHp > 0);
          return { ...prev, player: p, enemies: remainingEnemies };
      });
  };

  const handlePlayCard = (card: ICard) => {
    if (gameState.player.currentEnergy < card.cost) return;
    if (gameState.enemies.length === 0) return;
    if (actingEnemyId) return; 
    if (gameState.selectionState.active) return;
    if (card.unplayable) return;

    audioService.playSound(card.type === CardType.ATTACK ? 'attack' : 'block');
    setLastActionType(card.type);
    setLastActionTime(Date.now());
    addToBattleLog(`使用: ${card.name}`);

    setGameState(prev => {
      const p = { ...prev.player, hand: [...prev.player.hand], drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile], deck: [...prev.player.deck], powers: { ...prev.player.powers } };
      let enemies = prev.enemies.map(e => ({ ...e }));
      
      p.currentEnergy -= card.cost;
      p.cardsPlayedThisTurn++;
      if (card.type === CardType.ATTACK) p.attacksPlayedThisTurn++;

      if (p.powers['AFTER_IMAGE']) p.block += p.powers['AFTER_IMAGE'];
      if (p.powers['THOUSAND_CUTS']) enemies.forEach(e => {
          e.currentHp -= p.powers['THOUSAND_CUTS'];
          e.floatingText = { id: `tc-${Date.now()}`, text: `${p.powers['THOUSAND_CUTS']}`, color: 'text-purple-400', iconType: 'zap' };
      });
      
      let activations = 1;
      if (p.echoes > 0) { activations++; p.echoes--; }
      
      for (let act = 0; act < activations; act++) {
          let hits = 1;
          if (card.playCopies) hits += card.playCopies;
          for (let h = 0; h < hits; h++) {
              if (enemies.length === 0) break;
              let targets: Enemy[] = [];
              if (card.target === TargetType.ALL_ENEMIES) targets = enemies;
              else {
                  const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];
                  if (target) targets = [target];
              }
              
              if (card.damage) {
                  targets.forEach(e => {
                      let dmg = card.damage! + p.strength;
                      if (e.vulnerable) dmg = Math.floor(dmg * 1.5);
                      if (e.block >= dmg) { e.block -= dmg; dmg = 0; }
                      else { dmg -= e.block; e.block = 0; }
                      e.currentHp -= dmg;
                      if (dmg > 0) e.floatingText = { id: `d-${Date.now()}`, text: `${dmg}`, color: 'text-red-500' };
                  });
              }
              if (card.block) p.block += card.block;
          }
      }

      p.hand = p.hand.filter(c => c.id !== card.id);
      if (!card.exhaust) p.discardPile.push(card);

      return { ...prev, player: p, enemies: enemies.filter(e => e.currentHp > 0) };
    });
  };

  const handleEndTurn = async () => {
    audioService.playSound('select');
    setTurnLog("敵のターン...");
    setLastActionType(null);
    addToBattleLog("ターン終了");
    await wait(300);

    const enemies = [...gameState.enemies];
    for (const enemy of enemies) {
        if (gameState.player.currentHp <= 0) break;
        
        if (enemy.poison > 0) {
            enemy.currentHp -= enemy.poison;
            enemy.floatingText = { id: `psn-${Date.now()}`, text: `${enemy.poison}`, color: 'text-green-500', iconType: 'poison' };
            enemy.poison--;
            addToBattleLog(`${enemy.name}に毒ダメージ: ${enemy.poison + 1}`);
            setGameState(prev => ({ ...prev, enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, currentHp: enemy.currentHp, poison: enemy.poison, floatingText: enemy.floatingText } : e) }));
            if (enemy.currentHp <= 0) {
                storageService.saveDefeatedEnemy(enemy.name);
                continue;
            }
        }

        setActingEnemyId(enemy.id);
        await wait(300); 

        if (enemy.nextIntent.type === EnemyIntentType.ATTACK) audioService.playSound('attack');
        else audioService.playSound('select');

        setGameState(prev => {
            const currentEnemyIndex = prev.enemies.findIndex(e => e.id === enemy.id);
            if (currentEnemyIndex === -1) return prev;
            const p = { ...prev.player };
            const newEnemies = [...prev.enemies];
            const e = { ...newEnemies[currentEnemyIndex] };
            newEnemies[currentEnemyIndex] = e;
            e.block = 0; 

            const intent = e.nextIntent;
            
            if (intent.type === EnemyIntentType.ATTACK) {
                let damage = intent.value + (e.strength || 0);
                if (e.weak > 0) damage = Math.floor(damage * 0.75);
                if (p.block >= damage) { p.block -= damage; damage = 0; }
                else { damage -= p.block; p.block = 0; }
                p.currentHp -= damage;
                if (damage > 0) {
                    p.floatingText = { id: `pdmg-${Date.now()}`, text: `-${damage}`, color: 'text-red-500', iconType: 'sword' };
                    addToBattleLog(`${e.name}の攻撃: ${damage}ダメージ`);
                } else {
                    addToBattleLog(`${e.name}の攻撃をブロック`);
                }
            } else if (intent.type === EnemyIntentType.DEFEND) {
                e.block = intent.value;
                addToBattleLog(`${e.name}は防御した`);
            } else if (intent.type === EnemyIntentType.BUFF) {
                e.strength += 2;
                addToBattleLog(`${e.name}は強化した`);
            }
            
            e.nextIntent = getNextEnemyIntent(e, prev.turn + 1);
            return { ...prev, player: p, enemies: newEnemies };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    startPlayerTurn();
  };

  const handleMathChallengeComplete = (correctCount: number) => {
      audioService.stopBGM();
      audioService.playSound('win');
      
      const bonusGold = correctCount * 25; 
      
      setGameState(prev => ({ 
          ...prev, 
          player: { ...prev.player, gold: prev.player.gold + bonusGold },
          screen: GameScreen.REWARD,
          narrativeLog: [...prev.narrativeLog, `算数ボーナス: ${bonusGold}G 獲得!`]
      }));
      goToRewardPhase();
  };

  // --- Battle End Check ---
  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            audioService.playSound('win');
            audioService.stopBGM();
            
            let hpRegen = 0;
            if (gameState.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;
            if (gameState.player.relics.find(r => r.id === 'MEAT_ON_THE_BONE') && gameState.player.currentHp <= gameState.player.maxHp * 0.5) hpRegen += 12;
            
            if (gameState.act === 4 && !gameState.isEndless && gameState.enemies.some(e => e.id === 'true-boss')) {
                 setGameState(prev => ({ ...prev, screen: GameScreen.ENDING }));
                 storageService.incrementClearCount();
                 storageService.saveScore({
                     date: Date.now(),
                     score: calculateScore(gameState, true),
                     characterName: selectedCharName,
                     act: gameState.act,
                     floor: gameState.floor,
                     victory: true
                 });
                 storageService.clearSave(); 
            } else {
                 setGameState(prev => ({ 
                    ...prev, 
                    player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) },
                    screen: isMathDebugSkipped ? GameScreen.VICTORY : GameScreen.MATH_CHALLENGE
                }));
            }
        } else if (gameState.player.currentHp <= 0) {
            if (gameState.player.relics.find(r => r.id === 'LIZARD_TAIL')) {
                setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, currentHp: Math.floor(prev.player.maxHp * 0.5), relics: prev.player.relics.filter(r => r.id !== 'LIZARD_TAIL') },
                    narrativeLog: [...prev.narrativeLog, "トカゲの尻尾が身代わりになった！"]
                }));
                return;
            }
            
            if (gameState.player.potions.find(p => p.templateId === 'GHOST_IN_JAR')) {
                 setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, currentHp: Math.floor(prev.player.maxHp * 0.1), potions: prev.player.potions.filter(p => p.templateId !== 'GHOST_IN_JAR'), powers: { ...prev.player.powers, 'INTANGIBLE': (prev.player.powers['INTANGIBLE'] || 0) + 1 } },
                    narrativeLog: [...prev.narrativeLog, "お守りが輝き、復活した！"]
                }));
                return;
            }

            audioService.playSound('lose');
            audioService.stopBGM();
            storageService.saveScore({
                 date: Date.now(),
                 score: calculateScore(gameState, false),
                 characterName: selectedCharName,
                 act: gameState.act,
                 floor: gameState.floor,
                 victory: false
            });
            storageService.clearSave();
            setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
        }
    }
  }, [gameState.enemies, gameState.player.currentHp, gameState.screen]);

  const returnToTitle = () => {
    audioService.stopBGM();
    setShopCards([]);
    setEventData(null);
    setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }));
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

  const goToRewardPhase = () => {
    const rewards: RewardItem[] = [];
    
    // 1. Card Reward
    const allCards = Object.values(CARDS_LIBRARY).filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL');
    while(rewards.length < 3) {
        const roll = Math.random() * 100;
        let targetRarity = 'COMMON';
        if (roll > 93) targetRarity = 'LEGENDARY'; else if (roll > 60) targetRarity = 'RARE'; else if (roll > 30) targetRarity = 'UNCOMMON';
        
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
    } else {
        // Normal combat gold
        const goldAmt = 15 + Math.floor(Math.random() * 15) + (gameState.player.relics.find(r => r.id === 'GOLDEN_IDOL') ? 5 : 0);
        rewards.push({ type: 'GOLD', value: goldAmt, id: `rew-gold-${Date.now()}` });
        
        // Potion chance
        if (Math.random() < 0.4 && !gameState.player.relics.find(r => r.id === 'SOZU')) {
             const allPotions = Object.values(POTION_LIBRARY);
             const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
             rewards.push({ type: 'POTION', value: { ...potion, id: `rew-pot-${Date.now()}` }, id: `rew-pot-${Date.now()}` });
        }
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
              storageService.saveUnlockedCard(item.value.name);
              nextRewards = nextRewards.filter(r => r.type !== 'CARD');
          } else if (item.type === 'RELIC') {
              p.relics = [...p.relics, item.value];
              storageService.saveUnlockedRelic(item.value.id);
              if (item.value.id === 'SOZU') p.maxEnergy += 1;
              if (item.value.id === 'CURSED_KEY') p.maxEnergy += 1;
              if (item.value.id === 'PHILOSOPHER_STONE') p.maxEnergy += 1;
              if (item.value.id === 'WAFFLE') { p.maxHp += 7; p.currentHp = p.maxHp; }
              nextRewards = nextRewards.filter(r => r.id !== item.id);
          } else if (item.type === 'GOLD') {
              p.gold += item.value;
              nextRewards = nextRewards.filter(r => r.id !== item.id);
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
          // Advance Act
          if (gameState.act >= 3 && !gameState.isEndless) {
               // Act 4 Logic
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
          } else {
               const nextAct = gameState.act + 1;
               const newMap = generateDungeonMap();
               setGameState(prev => ({
                  ...prev,
                  act: nextAct,
                  floor: 0,
                  map: newMap,
                  currentMapNodeId: null,
                  screen: GameScreen.MAP,
                  narrativeLog: [...prev.narrativeLog, `Act ${nextAct}へ進んだ。`]
               }));
          }
      } else {
          handleNodeComplete();
      }
  };

  const handleRestAction = () => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.currentHp + Math.floor(prev.player.maxHp * 0.3), prev.player.maxHp) } }));
  };
  
  const handleUpgradeCard = (card: ICard) => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.map(c => c.id === card.id ? getUpgradedCard(c) : c) } }));
  };

  const handleRewardSelectionDelegate = (item: RewardItem) => {
      if (item.type === 'POTION') {
          handleAcquirePotion(item.value);
          setGameState(prev => ({
              ...prev,
              rewards: prev.rewards.filter(r => r.id !== item.id)
          }));
          setGameState(prev => {
              if (prev.rewards.length === 0) setTimeout(finishRewardPhase, 500);
              return prev;
          });
      } else {
          handleRewardSelection(item);
      }
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[600px] border-[10px] md:border-[20px] border-gray-800 rounded-xl relative overflow-hidden shadow-2xl bg-black crt-scanline">
            
            {/* Potion Replacement Modal */}
            {pendingPotion && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gray-800 border-4 border-yellow-500 p-6 rounded-lg max-w-md w-full shadow-2xl text-center">
                        <h3 className="text-xl font-bold text-yellow-400 mb-4">ポーションが一杯です！</h3>
                        <p className="text-white mb-6">新しいポーションを手に入れるには、<br/>持っているポーションを1つ捨てる必要があります。</p>
                        
                        <div className="flex justify-center gap-4 mb-6">
                            <div className="flex flex-col items-center">
                                <div className="text-xs text-green-400 mb-1">NEW</div>
                                <div className="w-16 h-16 bg-gray-700 border-2 border-green-500 rounded-full flex items-center justify-center">
                                    <FlaskConical size={32} style={{color: pendingPotion.item.color}} />
                                </div>
                                <div className="text-sm font-bold mt-1 text-white">{pendingPotion.item.name}</div>
                            </div>
                            <div className="flex items-center justify-center">
                                <ArrowRight size={32} className="text-white"/>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-2">捨てるポーションを選択してください:</p>
                        <div className="flex justify-center gap-4 mb-8">
                            {gameState.player.potions.map(p => (
                                <div 
                                    key={p.id} 
                                    className="relative group cursor-pointer"
                                    onClick={() => handleReplacePotion(p.id)}
                                >
                                    <div className="w-12 h-12 bg-gray-900 border-2 border-white group-hover:border-red-500 rounded-full flex items-center justify-center transition-colors">
                                        <FlaskConical size={20} style={{color: p.color}} />
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={12} className="text-white" />
                                    </div>
                                    <div className="text-xs mt-1 text-gray-300 max-w-[60px] truncate">{p.name}</div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => setPendingPotion(null)}
                            className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded font-bold border border-gray-400 w-full"
                        >
                            あきらめる
                        </button>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center p-8 w-full flex flex-col items-center">
                        <h1 
                            className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-600 mb-2 font-bold animate-pulse tracking-widest leading-tight cursor-pointer select-none"
                            onClick={handleTitleClick}
                        >
                            算数ローグ<br/><span className="text-4xl">伝説の小学生</span>
                        </h1>
                        <div className="flex flex-col gap-3 items-center w-full max-w-[280px] mt-8">
                            {hasSave && (
                                <button onClick={continueGame} className="w-full bg-blue-900 text-white py-3 px-4 text-lg font-bold border-2 border-blue-400 hover:bg-blue-800 cursor-pointer flex items-center justify-center shadow-lg relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                    <Play className="mr-2 fill-current" /> つづきから
                                </button>
                            )}
                            <button onClick={startGame} disabled={isLoading} className="w-full bg-gray-100 text-black py-3 px-4 text-lg font-bold border-b-4 border-r-4 border-gray-500 hover:bg-white hover:border-gray-400 hover:translate-x-[1px] hover:translate-y-[1px] active:border-0 active:translate-y-[4px] active:translate-x-[4px] transition-all cursor-pointer shadow-lg flex items-center justify-center">
                                {isLoading ? "生成中..." : "冒険を始める"}
                            </button>
                            
                            <button onClick={startChallengeGame} disabled={isLoading} className="w-full bg-red-900/80 text-red-100 py-2 px-4 text-sm font-bold border border-red-500 hover:bg-red-800 cursor-pointer flex items-center justify-center mb-2 shadow-md hover:shadow-red-900/50">
                                <Swords className="mr-2" size={16}/> 1A1Dモード (高難易度)
                            </button>

                            <div className="flex gap-2 w-full justify-between">
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
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.MODE_SELECTION && (
                <div className="w-full h-full bg-gray-900 flex flex-col items-center text-white p-4 overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-2xl flex flex-col items-center my-auto">
                        <h2 className="text-3xl font-bold mb-2 text-yellow-400 mt-4">計算モード選択</h2>
                        {gameState.challengeMode === '1A1D' && <p className="text-red-400 mb-6 font-bold animate-pulse">※1A1Dチャレンジモード適用中</p>}
                        
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
                <CharacterSelectionScreen characters={CHARACTERS} unlockedCount={Math.min(CHARACTERS.length, clearCount + 2)} onSelect={handleCharacterSelect} />
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
                    battleLog={gameState.battleLog} 
                />
            )}

            {gameState.screen === GameScreen.VICTORY && (
                 <div className="w-full h-full bg-green-900 flex items-center justify-center text-center text-white p-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl mb-4 text-yellow-400 font-bold">勝利！</h1>
                        <div className="text-yellow-400 text-2xl font-bold mb-8 flex items-center justify-center"><Coins className="mr-2"/> +{VICTORY_GOLD} G</div>
                        <button onClick={() => handleMathChallengeComplete(0)} className="bg-blue-600 px-8 py-4 border-2 border-white font-bold animate-bounce cursor-pointer rounded-lg text-xl">
                            報酬を確認
                        </button>
                    </div>
                 </div>
            )}

            {gameState.screen === GameScreen.MATH_CHALLENGE && (
                <MathChallengeScreen mode={gameState.mode} onComplete={handleMathChallengeComplete} />
            )}

            {gameState.screen === GameScreen.REWARD && (
                <RewardScreen 
                    rewards={gameState.rewards} 
                    onSelectReward={handleRewardSelectionDelegate} 
                    onSkip={finishRewardPhase} 
                    isLoading={isLoading} 
                />
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
                    onBuyPotion={(potion) => {
                        let price = potion.price || 50;
                        if (gameState.player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
                        handleAcquirePotion(potion, price);
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
                 <div className="w-full h-full bg-red-900 flex items-center justify-center text-center text-white p-4">
                    <div>
                        <h1 className="text-6xl mb-4 font-bold">死亡</h1>
                        <p className="mb-8 text-2xl">Act {gameState.act} - Floor {gameState.floor}</p>
                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={() => startGame()} className="bg-black border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-800 flex items-center justify-center"><RotateCcw className="mr-2" size={20} /> 再挑戦</button>
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
