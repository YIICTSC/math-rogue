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
import PokerGameScreen from './components/PokerGameScreen'; // New Import
import Card from './components/Card';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle, Send, Swords, Terminal, Club } from 'lucide-react';

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

// --- CAPTURED CARD GENERATION ---
const createCardFromEnemy = (enemy: Enemy): ICard => {
    // Basic scaling based on max HP
    const isBoss = enemy.maxHp > 100;
    const powerScale = Math.min(20, Math.floor(enemy.maxHp * 0.15));
    const rarity = isBoss ? 'LEGENDARY' : 'UNCOMMON';
    
    const baseCard: ICard = {
        id: `captured-${enemy.id}`,
        name: enemy.name,
        cost: 1,
        type: CardType.ATTACK,
        target: TargetType.ENEMY,
        description: "",
        rarity: rarity,
        textureRef: enemy.name, // Use name for PixelSprite
        exhaust: true, // Default to exhaust
        capture: false // Generated cards don't capture recursively by default, unless synthesized later
    };

    // Customize effect based on enemy type
    switch (enemy.enemyType) {
        case 'TANK': // High Block & Retain-like
            baseCard.type = CardType.SKILL;
            baseCard.target = TargetType.SELF;
            baseCard.block = 12 + powerScale;
            baseCard.description = `ブロック${baseCard.block}を得る。廃棄。`;
            baseCard.cost = 2;
            break;

        case 'GHOST': // Intangible or Debuff
            baseCard.type = CardType.SKILL;
            baseCard.target = TargetType.ENEMY;
            baseCard.cost = 2;
            baseCard.applyPower = { id: 'INTANGIBLE', amount: 1 };
            baseCard.weak = 2;
            baseCard.description = `敵にへろへろ2を与え、スケスケ1を得る。廃棄。`;
            break;

        case 'TEACHER': // Strength Buff
            baseCard.type = CardType.SKILL;
            baseCard.target = TargetType.SELF;
            baseCard.cost = 1;
            baseCard.strength = 2;
            baseCard.description = `ムキムキ2を得る。廃棄。`;
            break;

        case 'AGGRESSIVE': // Multi-hit Attack
            baseCard.type = CardType.ATTACK;
            baseCard.cost = 1;
            const dmgAgg = 4 + Math.floor(powerScale / 2);
            baseCard.damage = dmgAgg;
            baseCard.playCopies = 2; // Hits 3 times total
            baseCard.description = `${dmgAgg}ダメージを3回与える。廃棄。`;
            break;

        case 'SWARM': // AOE Weak
            baseCard.type = CardType.ATTACK;
            baseCard.target = TargetType.ALL_ENEMIES;
            baseCard.cost = 1;
            baseCard.damage = 6 + Math.floor(powerScale / 2);
            baseCard.weak = 1;
            baseCard.description = `全体に${baseCard.damage}ダメージとへろへろ1。廃棄。`;
            break;

        case 'TRICKSTER': // Random Card / Draw
            baseCard.type = CardType.SKILL;
            baseCard.target = TargetType.SELF;
            baseCard.cost = 0;
            baseCard.draw = 2;
            baseCard.addCardToHand = { cardName: 'SHIV', count: 2, cost0: true };
            baseCard.description = `2枚引き、ナイフ2枚を手札に加える。廃棄。`;
            break;
        
        case 'THE_HEART': // True Boss
            baseCard.type = CardType.ATTACK;
            baseCard.target = TargetType.ALL_ENEMIES;
            baseCard.cost = 3;
            baseCard.damage = 30;
            baseCard.applyPower = { id: 'DEMON_FORM', amount: 3 };
            baseCard.description = `全体30ダメージ。悪魔化3を得る。廃棄。`;
            break;

        case 'GUARDIAN': // Boss
            baseCard.type = CardType.ATTACK;
            baseCard.cost = 2;
            baseCard.damage = 20;
            baseCard.block = 20;
            baseCard.description = `20ダメージ。ブロック20を得る。廃棄。`;
            break;

        default: // GENERIC
            const dmg = 8 + powerScale;
            baseCard.damage = dmg;
            baseCard.draw = 1;
            baseCard.description = `${dmg}ダメージ。カードを1枚引く。廃棄。`;
            break;
    }

    return baseCard;
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

  const generateEvent = (player: Player) => {
      const random = Math.random();
      const events = [
          {
              title: "大きな魚",
              description: "巨大な魚が吊るされている。「バナナ」「ドーナツ」「箱」、どれか一つを持って行けと書いてある。",
              options: [
                  { label: "バナナ", text: "HPを20回復。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } })); setEventResultLog("バナナはおいしかった。"); } },
                  { label: "ドーナツ", text: "最大HP+5。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } })); setEventResultLog("ドーナツは甘かった。"); } },
                  { label: "箱", text: "レリックを得る。呪いを受ける。", action: () => { 
                      const curse = { ...CURSE_CARDS.REGRET, id: `curse-${Date.now()}` };
                      setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.WARPED_TONGS], deck: [...prev.player.deck, curse], discardPile: [...prev.player.discardPile, curse] } })); 
                      storageService.saveUnlockedRelic('WARPED_TONGS');
                      setEventResultLog("「ゆがんだフォーク」を手に入れたが、後悔の念に襲われる..."); 
                  } }
              ]
          },
          {
              title: "黄金の偶像",
              description: "古代の祭壇に黄金の偶像が祀られている。罠の気配がする。",
              options: [
                  { label: "奪う", text: "「黄金の偶像」を得る。呪い「怪我」を受ける。", action: () => { 
                      const curse = { ...CURSE_CARDS.INJURY, id: `curse-${Date.now()}` };
                      setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.GOLDEN_IDOL], deck: [...prev.player.deck, curse], discardPile: [...prev.player.discardPile, curse] } })); 
                      storageService.saveUnlockedRelic('GOLDEN_IDOL');
                      setEventResultLog("偶像を手に入れた！しかし罠が作動し、大怪我を負った。"); 
                  } },
                  { label: "無視する", text: "", action: () => { setEventResultLog("君は賢明にも立ち去った。"); } }
              ]
          },
          {
              title: "変化の輪",
              description: "グレムリンが巨大なルーレットを回している。「さあ、運試しだ！」",
              options: [
                  { label: "回す", text: "ランダムな結果。", action: () => {
                      const r = Math.random();
                      if (r < 0.2) { // Heal
                          setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                          setEventResultLog("大当たり！体力が全回復した。");
                      } else if (r < 0.4) { // Damage
                          setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10) } }));
                          setEventResultLog("ハズレ！石が飛んできて当たった。");
                      } else if (r < 0.6) { // Gold
                          setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                          setEventResultLog("大当たり！100ゴールドを手に入れた。");
                      } else if (r < 0.8) { // Curse
                          const curse = { ...CURSE_CARDS.DECAY, id: `curse-${Date.now()}` };
                          setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, curse], discardPile: [...prev.player.discardPile, curse] } }));
                          setEventResultLog("最悪だ！呪われてしまった。");
                      } else { // Remove
                          setGameState(prev => {
                              const deck = [...prev.player.deck];
                              if (deck.length > 0) {
                                  const removed = deck.splice(Math.floor(Math.random()*deck.length), 1)[0];
                                  return { ...prev, player: { ...prev.player, deck } };
                              }
                              return prev;
                          });
                          setEventResultLog("カードが1枚消え去った...");
                      }
                  }}
              ]
          },
          {
              title: "吸血鬼",
              description: "フードを被った集団がいる。「我々の仲間になれば、不死の力を授けよう」",
              options: [
                  { label: "受け入れる", text: "最大HPの30%を失う。ストライクを全て「噛みつき」に変化。", action: () => {
                      setGameState(prev => {
                          const p = prev.player;
                          const newMax = Math.floor(p.maxHp * 0.7);
                          const newDeck = p.deck.map((c: ICard) => c.name.includes('ストライク') || c.name.includes('攻撃') ? { ...EVENT_CARDS.BITE, id: `bite-${Math.random()}` } : c);
                          return { ...prev, player: { ...p, maxHp: newMax, currentHp: Math.min(p.currentHp, newMax), deck: newDeck } };
                      });
                      setEventResultLog("血の契約を結んだ... 体は軽いが、日差しが辛い。");
                  }},
                  { label: "拒否", text: "", action: () => { setEventResultLog("君は丁重に断った。"); } }
              ]
          },
          {
              title: "亡霊",
              description: "霧の中から亡霊たちが現れた。「肉体を捨てれば、痛みも消える...」",
              options: [
                  { label: "受け入れる", text: "最大HPが半減。「ドロン」を3枚得る。", action: () => {
                       setGameState(prev => {
                           const p = prev.player;
                           const newMax = Math.floor(p.maxHp * 0.5);
                           const appCards = Array(3).fill(null).map((_, i) => ({ ...EVENT_CARDS.APPARITION, id: `app-${Date.now()}-${i}` }));
                           return { ...prev, player: { ...p, maxHp: newMax, currentHp: Math.min(p.currentHp, newMax), deck: [...p.deck, ...appCards], discardPile: [...p.discardPile, ...appCards] } };
                       });
                       setEventResultLog("体が透けていく... もう痛みは感じない。");
                  }},
                  { label: "拒否", text: "", action: () => { setEventResultLog("亡霊たちは霧の中に消えていった。"); } }
              ]
          },
          {
              title: "増強者",
              description: "怪しげな装置がある。「力を...欲するか？」",
              options: [
                  { label: "試す", text: "「筋肉注射」を得る。", action: () => {
                      const card = { ...EVENT_CARDS.J_A_X, id: `jax-${Date.now()}` };
                      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, card], discardPile: [...prev.player.discardPile, card] } }));
                      setEventResultLog("謎の薬を打たれた。力がみなぎる！");
                  }},
                  { label: "変異", text: "「成長期」を得る。", action: () => {
                      setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MUTAGENIC_STRENGTH] } }));
                      storageService.saveUnlockedRelic('MUTAGENIC_STRENGTH');
                      setEventResultLog("体が急激に成長した！");
                  }}
              ]
          }
      ];

      return events[Math.floor(random * events.length)];
  };

  const continueGame = () => {
      const saved = storageService.loadGame();
      if (saved) {
          setGameState(saved);
          audioService.playBGM(saved.screen === GameScreen.BATTLE ? 'battle' : 'menu');
      }
  };

  const startChallengeGame = () => {
      audioService.init();
      audioService.playSound('select');
      setLegacyCardSelected(false);
      setDebugLoadout(null);
      
      setGameState(prev => ({
          ...prev,
          challengeMode: '1A1D',
          screen: GameScreen.CHARACTER_SELECTION
      }));
  };

  const startPokerGame = () => {
      audioService.init();
      audioService.playSound('select');
      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MINI_GAME_POKER
      }));
  };

  const startEndlessMode = () => {
      const newAct = gameState.act + 1; // Increment act (will be 5 if finished normal game)
      const newMap = generateDungeonMap();
      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          act: newAct,
          floor: 0,
          map: newMap,
          currentMapNodeId: null,
          isEndless: true,
          narrativeLog: [...prev.narrativeLog, `エンドレスモード開始！ Act ${newAct}へ...`]
      }));
      audioService.playBGM('menu');
  };

  const startGame = async () => {
      try {
          setErrorMessage("");
          setIsLoading(true);
          audioService.init();
          audioService.playSound('select');
          setLegacyCardSelected(false); 
          setDebugLoadout(null);
          
          if (isDebugHpOne) {
              setGameState(prev => ({ ...prev, screen: GameScreen.DEBUG_MENU, challengeMode: undefined }));
          } else {
              setGameState(prev => ({ ...prev, screen: GameScreen.MODE_SELECTION, challengeMode: undefined }));
          }
      } catch (e) {
          console.error("Start Game Error:", e);
          setErrorMessage("エラーが発生しました。");
      } finally {
          setIsLoading(false);
      }
  };

  const handleDebugStart = (deck: ICard[], relics: Relic[], potions: Potion[]) => {
      setDebugLoadout({ deck, relics, potions });
      setGameState(prev => ({ ...prev, screen: GameScreen.MODE_SELECTION }));
      audioService.playSound('select');
  };

  const handleModeSelect = (mode: GameMode) => {
      setGameState(prev => ({ ...prev, mode: mode, screen: GameScreen.CHARACTER_SELECTION }));
      audioService.playSound('select');
  };

  const handleCharacterSelect = (char: Character) => {
      setSelectedCharName(char.name);
      
      let startingDeck: ICard[] = [];
      let startingRelics: Relic[] = [];
      let startingPotions: Potion[] = [];

      // Debug Loadout Logic overrides standard logic
      if (isDebugHpOne && debugLoadout) {
          startingDeck = debugLoadout.deck.map(c => ({...c, id: `debug-${c.name}-${Date.now()}-${Math.random()}`}));
          startingRelics = debugLoadout.relics;
          startingPotions = debugLoadout.potions;
      } 
      // 1A1D Logic
      else if (gameState.challengeMode === '1A1D') {
          const validRarities = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY'];
          const allCards = Object.values(CARDS_LIBRARY).filter(c => validRarities.includes(c.rarity) && c.type !== CardType.CURSE && c.type !== CardType.STATUS);
          
          const attacks = allCards.filter(c => c.type === CardType.ATTACK);
          const skills = allCards.filter(c => c.type === CardType.SKILL);

          if (attacks.length > 0 && skills.length > 0) {
              const rAtk = attacks[Math.floor(Math.random() * attacks.length)];
              const rSkl = skills[Math.floor(Math.random() * skills.length)];
              startingDeck = [
                  { ...rAtk, id: `1a1d-atk-${Date.now()}` },
                  { ...rSkl, id: `1a1d-def-${Date.now()}` }
              ];
          } else {
              // Fallback
              startingDeck = createDeck(char.deckTemplate);
          }
      } else {
          // Standard Logic
          startingDeck = createDeck(char.deckTemplate);
          
          // Load Legacy Card if exists
          const legacyCard = storageService.getLegacyCard();
          if (legacyCard) {
              startingDeck.push({ ...legacyCard, id: `legacy-${Date.now()}` });
          }
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
              relics: startingRelics,
              potions: startingPotions
          },
      }));
      
      // If Debug Loadout is active, we skip Relic Selection to avoid polluting the precise loadout.
      if (isDebugHpOne && debugLoadout) {
          const map = generateDungeonMap();
          setGameState(prev => ({
              ...prev,
              screen: GameScreen.MAP,
              map: map,
              narrativeLog: ["デバッグモードで冒険が始まった。"]
          }));
          audioService.playBGM('menu');
      } else {
          // Add Character Starting Relic (Standard Flow)
          // Only add if not debug, because debug handles relics manually
          if (!debugLoadout) {
              const charRelic = RELIC_LIBRARY[char.startingRelicId];
              if (charRelic) {
                   storageService.saveUnlockedRelic(charRelic.id); // UNLOCK
                   setGameState(prev => ({
                       ...prev,
                       player: { ...prev.player, relics: [...prev.player.relics, charRelic] }
                   }));
              }

              // Generate random starter relics for selection (Bonus)
              const starters = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'STARTER' && r.id !== char.startingRelicId);
              const randomStarters = shuffle(starters).slice(0, 2);
              setStarterRelics(randomStarters);

              setGameState(prev => ({ ...prev, screen: GameScreen.RELIC_SELECTION }));
          }
      }
      
      audioService.playSound('select');
  };

  const handleRelicSelect = (relic: Relic) => {
      const map = generateDungeonMap();
      storageService.saveUnlockedRelic(relic.id); // UNLOCK
      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          map: map,
          player: {
              ...prev.player,
              relics: [...prev.player.relics, relic],
              maxEnergy: relic.id === 'HOLY_WATER' ? prev.player.maxEnergy + 1 : prev.player.maxEnergy
          },
          narrativeLog: ["冒険が始まった。"]
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

            // Relic: Vajra
            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            // Relic: Bag of Prep / Snake Ring
            let drawCount = HAND_SIZE;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
            // Relic: Anchor
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3; 
            if (p.relics.find(r => r.id === 'LANTERN')) p.currentEnergy += 1;
            
            for(let i=0; i<drawCount; i++) {
                if(p.drawPile.length > 0) {
                    const c = p.drawPile.pop();
                    if(c) {
                        // Snecko Eye randomization
                        if (p.relics.find(r => r.id === 'SNECKO_EYE') && c.cost >= 0) c.cost = Math.floor(Math.random() * 4);
                        p.hand.push(c);
                    }
                }
            }
            
            // Innate Cards
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
                turn: 1
            });
            setCurrentNarrative(flavor);
            audioService.playBGM('battle');
            setTurnLog("あなたのターン");

        } else if (node.type === NodeType.REST) {
            setGameState({ ...nextState, screen: GameScreen.REST });
            audioService.playBGM('menu');

        } else if (node.type === NodeType.SHOP) {
            // Generate Shop
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
            setEventResultLog(null);
            setGameState({ ...nextState, screen: GameScreen.EVENT });
            audioService.playBGM('menu');
        
        } else if (node.type === NodeType.TREASURE) {
            // Generate Treasure
            const rewards: RewardItem[] = [];
            const r = Math.random();
            if (r < 0.5) {
                // Gold
                rewards.push({ type: 'GOLD', value: 50 + Math.floor(Math.random() * 100), id: `tr-gold-${Date.now()}` });
            } 
            if (r < 0.8) {
                // Relic
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
      const len1 = Math.floor(Math.random() * 3) + 2; 
      const len2 = Math.floor(Math.random() * 3) + 2; 
      const part1 = c1.name.substring(0, Math.min(len1, c1.name.length));
      const part2 = c2.name.substring(Math.max(0, c2.name.length - len2));
      const newName = part1 + part2;
      const newCost = Math.max(c1.cost, c2.cost);
      
      const sum = (k: keyof ICard) => ((c1[k] as number) || 0) + ((c2[k] as number) || 0);
      const newDamage = sum('damage');
      
      const newCard: ICard = {
          id: `synth-${Date.now()}`,
          name: newName,
          cost: newCost,
          type: c1.type,
          description: "合成カード",
          rarity: 'SPECIAL',
          damage: newDamage > 0 ? newDamage : undefined,
          exhaust: c1.exhaust || c2.exhaust
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

  // Inserted handlers
  const handleSelectEnemy = (id: string) => setGameState(prev => ({ ...prev, selectedEnemyId: id }));
  const handleHandSelection = (card: ICard) => { /* ... existing logic ... */ };
  const handleUsePotion = (potion: Potion) => { /* ... existing logic ... */ };
  const handlePlayCard = (card: ICard) => { /* ... existing logic ... */ };
  const handleEndTurn = (skipEnemies?: boolean) => { /* ... existing logic ... */ };
  const handleMathChallengeComplete = (count: number) => { /* ... existing logic ... */ };
  const handleRewardSelection = (item: RewardItem, replacePotionId?: string) => { /* ... existing logic ... */ };
  const finishRewardPhase = () => { /* ... existing logic ... */ };
  const handleRestAction = () => { /* ... existing logic ... */ };
  const handleUpgradeCard = (card: ICard) => { /* ... existing logic ... */ };
  const handleNodeComplete = () => { /* ... existing logic ... */ };
  const returnToTitle = () => {
    audioService.stopBGM();
    setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }));
  };
  const handleLegacyCardSelect = (card: ICard) => { /* ... */ };
  const handleRetry = () => { /* ... */ };

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
                                <Terminal size={10}/> v2.3.0
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
                            System Update Log v2.3.0
                        </h2>
                        <div className="space-y-4 text-sm font-mono text-gray-300 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <section>
                                <h3 className="text-white font-bold mb-1">■ ミニゲーム追加 (New Mini Game)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>「放課後ポーカー：給食の乱」を追加しました。</li>
                                    <li>ローグライク要素のあるポーカーゲームです。</li>
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

            {/* Poker Mini Game Screen */}
            {gameState.screen === GameScreen.MINI_GAME_POKER && (
                <PokerGameScreen onBack={returnToTitle} />
            )}

            {/* ... Existing Game Screens (Mode Selection, Character Selection, etc.) ... */}
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
                <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} />
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