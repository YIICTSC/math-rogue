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
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle, Send, Swords, Terminal } from 'lucide-react';

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
  const [isChallengeSetup, setIsChallengeSetup] = useState<boolean>(false);
  const [showDebugLog, setShowDebugLog] = useState<boolean>(false);
  
  // Debug Logic
  const [isMathDebugSkipped, setIsMathDebugSkipped] = useState<boolean>(false);
  const [titleClickCount, setTitleClickCount] = useState<number>(0);

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
    setIsMathDebugSkipped(storageService.getDebugMathSkip());
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

  // --- Start Player Turn ---
  const startPlayerTurn = () => {
    setTurnLog("プレイヤーターン");
    setGameState(prev => {
      const p = { ...prev.player };
      
      // Process Next Turn Effects
      let carryOverEnergy = 0;
      if (p.relics.find(r => r.id === 'ICE_CREAM')) {
          carryOverEnergy = p.currentEnergy;
      }
      p.currentEnergy = p.maxEnergy + p.nextTurnEnergy + carryOverEnergy;
      
      const drawCount = HAND_SIZE + (p.powers['TOOLS_OF_THE_TRADE'] ? 1 : 0) + p.nextTurnDraw;
      p.nextTurnEnergy = 0;
      p.nextTurnDraw = 0;

      // Powers & Relics Start of Turn
      if (p.powers['DEMON_FORM']) p.strength += p.powers['DEMON_FORM'];
      if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
      // Deva Form Logic Change: Usable energy bonus, not Max Energy increase
      if (p.powers['DEVA_FORM']) {
          p.currentEnergy += p.powers['DEVA_FORM'];
          p.powers['DEVA_FORM']++; // Increase stack for next turn
      }
      
      // Relics
      if (p.relics.find(r => r.id === 'MERCURY_HOURGLASS')) {
          prev.enemies.forEach(e => { e.currentHp -= 3; if (e.currentHp < 0) e.currentHp = 0; });
      }
      if (p.relics.find(r => r.id === 'HORN_CLEAT') && prev.turn === 1) { // Will become turn 2
          p.block += 14;
      }

      if (p.powers['CREATIVE_AI']) {
          const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
          const power = { ...powers[Math.floor(Math.random() * powers.length)], id: `creative-${Date.now()}`, cost: 0 };
          if (p.hand.length < 10) p.hand = [...p.hand, power]; 
      }
      if (p.powers['INFINITE_BLADES']) {
           const shiv = { ...CARDS_LIBRARY['SHIV'], id: `inf-${Date.now()}` };
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

      // Happy Flower Logic
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

      // Reset turn-based counters for Ninja Relics
      ['SHURIKEN', 'KUNAI', 'ORNAMENTAL_FAN'].forEach(id => {
          if (p.relics.find(r => r.id === id)) {
              p.relicCounters[id] = 0;
          }
      });

      // Draw Cards
      let newDrawPile = [...p.drawPile];
      let newDiscardPile = [...p.discardPile];
      let newHand = [...p.hand];
      
      // Snecko Eye Draw Bonus (+2)
      let totalDraw = drawCount;
      if (p.relics.find(r => r.id === 'SNECKO_EYE')) totalDraw += 2;

      // Helper to draw
      const drawCard = () => {
          if (newDrawPile.length === 0) {
              if (newDiscardPile.length === 0) return null;
              newDrawPile = shuffle(newDiscardPile);
              newDiscardPile = [];
          }
          return newDrawPile.pop();
      };

      for (let i = 0; i < totalDraw; i++) {
        if (newHand.length >= 10) break; // Hand limit
        const card = drawCard();
        if (card) {
            if (card.name === '虚無' || card.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
            
            // Snecko Eye Randomization
            if (p.relics.find(r => r.id === 'SNECKO_EYE') && card.cost >= 0) {
                card.cost = Math.floor(Math.random() * 4); // 0-3
            }
            
            newHand.push(card);
        }
      }

      // Reset Block unless Barricade or Calipers
      if (!p.powers['BARRICADE'] && !p.powers['CALIPERS']) p.block = 0;
      else if (p.powers['CALIPERS']) {
          p.block = Math.max(0, p.block - 15);
      }

      p.hand = newHand;
      p.drawPile = newDrawPile;
      p.discardPile = newDiscardPile;
      p.cardsPlayedThisTurn = 0;
      p.attacksPlayedThisTurn = 0;
      p.turnFlags = {}; // Reset turn flags

      return { ...prev, player: p, turn: prev.turn + 1, enemies: prev.enemies.filter(e => e.currentHp > 0) };
    });
  };

  // --- Generators ---
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
                          storageService.saveUnlockedPotion(pot.templateId); // UNLOCK
                          setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - 20, potions: [...prev.player.potions, pot].slice(0, 3) } }));
                          setEventResultLog("ポーションをこっそり受け取った！");
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
                          storageService.saveUnlockedRelic(RELIC_LIBRARY.WARPED_TONGS.id); // UNLOCK
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
                      storageService.saveUnlockedRelic(book.id); // UNLOCK
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
          setGameState(saved);
          audioService.playBGM(saved.screen === GameScreen.BATTLE ? 'battle' : 'menu');
      }
  };

  const startChallengeGame = () => {
      // Challenge Mode Setup
      setGameState(prev => ({ ...prev, challengeMode: '1A1D' }));
      setIsChallengeSetup(true);
      startGame();
  };

  const startGame = async () => {
      try {
          setErrorMessage("");
          setIsLoading(true);
          audioService.init();
          audioService.playSound('select');
          
          if (isChallengeSetup) {
              // Skip mode select if challenge
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
      
      // Load Legacy Card if exists
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
              relics: [] // Will add starting relic in next step
          },
      }));
      
      // Add Character Starting Relic
      const charRelic = RELIC_LIBRARY[char.startingRelicId];
      if (charRelic) {
           storageService.saveUnlockedRelic(charRelic.id); // UNLOCK
           setGameState(prev => ({
               ...prev,
               player: { ...prev.player, relics: [...prev.player.relics, charRelic] }
           }));
      }

      // Generate random starter relics for selection (Bonus)
      // Filter out character starting relic
      const starters = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'STARTER' && r.id !== char.startingRelicId);
      const randomStarters = shuffle(starters).slice(0, 3);
      setStarterRelics(randomStarters);

      setGameState(prev => ({ ...prev, screen: GameScreen.RELIC_SELECTION }));
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
                    const isBoss = node.type === NodeType.BOSS;
                    const type = determineEnemyType(name, isBoss);
                    
                    const enemy: Enemy = {
                        id: `enemy-${node.y}-${i}-${Date.now()}`,
                        enemyType: type,
                        name: isBoss ? `ボス: ${name}` : name,
                        maxHp: Math.floor(baseHp),
                        currentHp: Math.floor(baseHp),
                        block: 0,
                        strength: 0,
                        nextIntent: { type: EnemyIntentType.UNKNOWN, value: 0 }, // Will be set by logic
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
      // ... (Synthesis Logic remains same)
      // For brevity, using logic from existing file
      
      const len1 = Math.floor(Math.random() * 3) + 2; 
      const len2 = Math.floor(Math.random() * 3) + 2; 
      const part1 = c1.name.substring(0, Math.min(len1, c1.name.length));
      const part2 = c2.name.substring(Math.max(0, c2.name.length - len2));
      const newName = part1 + part2;
      const newCost = Math.max(c1.cost, c2.cost);
      const sum = (k: keyof ICard) => ((c1[k] as number) || 0) + ((c2[k] as number) || 0);

      const newDamage = sum('damage');
      const newBlock = sum('block');
      const newDraw = sum('draw');
      const newEnergy = sum('energy');
      const newHeal = sum('heal');
      const newPoison = sum('poison');
      const newWeak = sum('weak');
      const newVulnerable = sum('vulnerable');
      const newSelfDamage = sum('selfDamage');
      const newStrength = sum('strength');
      const newPlayCopies = sum('playCopies'); 
      const newPromptsDiscard = sum('promptsDiscard');
      const newNextTurnEnergy = sum('nextTurnEnergy');
      const newNextTurnDraw = sum('nextTurnDraw');
      const newStrengthScaling = sum('strengthScaling');
      const newPoisonMultiplier = sum('poisonMultiplier');

      const newExhaust = c1.exhaust || c2.exhaust;
      const newInnate = c1.innate || c2.innate;
      const newLifesteal = c1.lifesteal || c2.lifesteal;
      const newDoubleBlock = c1.doubleBlock || c2.doubleBlock;
      const newDoubleStrength = c1.doubleStrength || c2.doubleStrength;
      const newUpgradeHand = c1.upgradeHand || c2.upgradeHand;
      const newShuffleHandToDraw = c1.shuffleHandToDraw || c2.shuffleHandToDraw;
      const newUnplayable = c1.unplayable || c2.unplayable;
      const newCapture = c1.capture || c2.capture;

      let newTarget = TargetType.SELF;
      if (c1.target === TargetType.ALL_ENEMIES || c2.target === TargetType.ALL_ENEMIES) newTarget = TargetType.ALL_ENEMIES;
      else if (c1.target === TargetType.RANDOM_ENEMY || c2.target === TargetType.RANDOM_ENEMY) newTarget = TargetType.RANDOM_ENEMY;
      else if (c1.target === TargetType.ENEMY || c2.target === TargetType.ENEMY) newTarget = TargetType.ENEMY;
      
      const newType = (c1.type === CardType.ATTACK || c2.type === CardType.ATTACK) ? CardType.ATTACK : 
                      (c1.type === CardType.POWER || c2.type === CardType.POWER) ? CardType.POWER : CardType.SKILL;

      let newApplyPower = undefined;
      if (c1.applyPower && !c2.applyPower) newApplyPower = c1.applyPower;
      else if (!c1.applyPower && c2.applyPower) newApplyPower = c2.applyPower;
      else if (c1.applyPower && c2.applyPower) {
          if (c1.applyPower.id === c2.applyPower.id) {
              newApplyPower = { id: c1.applyPower.id, amount: c1.applyPower.amount + c2.applyPower.amount };
          } else {
              newApplyPower = c1.cost > c2.cost ? c1.applyPower : c2.applyPower;
          }
      }

      let newTextureRef = undefined;
      if (c1.textureRef && c2.textureRef) {
          const shapePart = c1.textureRef.split('|')[0];
          const colorPart = c2.textureRef.split('|').pop();
          newTextureRef = `${shapePart}|${colorPart}`;
      } else if (c1.textureRef) {
          newTextureRef = c1.textureRef;
      } else if (c2.textureRef) {
          newTextureRef = c2.textureRef;
      }

      let parts = [];
      if (newTarget === TargetType.ALL_ENEMIES) parts.push("全体");
      if (newTarget === TargetType.RANDOM_ENEMY) parts.push("ランダム");
      if (newDamage > 0) parts.push(`${newDamage}ダメ`);
      if (newPlayCopies > 0) parts.push(`${newPlayCopies + 1}回攻撃`);
      if (newBlock > 0) parts.push(`ブロック${newBlock}`);
      if (newPoison > 0) parts.push(`毒${newPoison}`);
      if (newWeak > 0) parts.push(`弱体${newWeak}`);
      if (newVulnerable > 0) parts.push(`脆弱${newVulnerable}`);
      if (newStrength > 0) parts.push(`筋力${newStrength}`);
      if (newHeal > 0) parts.push(`HP${newHeal}回復`);
      if (newDraw > 0) parts.push(`${newDraw}枚引く`);
      if (newEnergy > 0) parts.push(`E${newEnergy}得る`);
      if (newNextTurnEnergy > 0) parts.push(`次E${newNextTurnEnergy}`);
      if (newNextTurnDraw > 0) parts.push(`次引${newNextTurnDraw}`);
      if (newSelfDamage > 0) parts.push(`自傷${newSelfDamage}`);
      if (newPromptsDiscard > 0) parts.push(`${newPromptsDiscard}枚捨てる`);
      if (newLifesteal) parts.push(`吸収`);
      if (newDoubleBlock) parts.push(`ブロック2倍`);
      if (newDoubleStrength) parts.push(`筋力2倍`);
      if (newUpgradeHand) parts.push(`手札強化`);
      if (newStrengthScaling > 0) parts.push(`筋力効果${newStrengthScaling + 1}倍`);
      if (newPoisonMultiplier > 0) parts.push(`毒${newPoisonMultiplier}倍`);
      if (newExhaust) parts.push(`廃棄`);
      if (newInnate) parts.push(`初期手札`);
      if (newUnplayable) parts.push(`使用不可`);
      if (newCapture) parts.push(`捕獲`);
      if (newApplyPower) parts.push(`${newApplyPower.id}(${newApplyPower.amount})`);

      const newDesc = parts.join('。') + '。';

      const newCard: ICard = {
          id: `synth-${Date.now()}`,
          name: newName,
          type: newType,
          target: newTarget,
          cost: newCost,
          description: newDesc,
          rarity: 'SPECIAL',
          damage: newDamage > 0 ? newDamage : undefined,
          block: newBlock > 0 ? newBlock : undefined,
          draw: newDraw > 0 ? newDraw : undefined,
          energy: newEnergy > 0 ? newEnergy : undefined,
          heal: newHeal > 0 ? newHeal : undefined,
          poison: newPoison > 0 ? newPoison : undefined,
          weak: newWeak > 0 ? newWeak : undefined,
          vulnerable: newVulnerable > 0 ? newVulnerable : undefined,
          selfDamage: newSelfDamage > 0 ? newSelfDamage : undefined,
          strength: newStrength > 0 ? newStrength : undefined,
          playCopies: newPlayCopies > 0 ? newPlayCopies : undefined,
          promptsDiscard: newPromptsDiscard > 0 ? newPromptsDiscard : undefined,
          nextTurnEnergy: newNextTurnEnergy > 0 ? newNextTurnEnergy : undefined,
          nextTurnDraw: newNextTurnDraw > 0 ? newNextTurnDraw : undefined,
          strengthScaling: newStrengthScaling > 0 ? newStrengthScaling : undefined,
          poisonMultiplier: newPoisonMultiplier > 0 ? newPoisonMultiplier : undefined,
          exhaust: newExhaust,
          innate: newInnate,
          unplayable: newUnplayable,
          lifesteal: newLifesteal,
          doubleBlock: newDoubleBlock,
          doubleStrength: newDoubleStrength,
          upgradeHand: newUpgradeHand,
          shuffleHandToDraw: newShuffleHandToDraw,
          applyPower: newApplyPower,
          textureRef: newTextureRef,
          capture: newCapture,
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
                 if (card.name === '作戦' || card.name === 'STRATEGIST') {
                     p.currentEnergy += 2;
                 }
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
              const draw = p.hand.length;
              p.hand = [];
              // Simplistic redraw logic for potion immediately
              // ...
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
      // Ninja Relics Logic
      if (card.type === CardType.ATTACK) {
          if (p.relics.find(r => r.id === 'KUNAI')) {
              p.relicCounters['KUNAI'] = (p.relicCounters['KUNAI'] || 0) + 1;
              if (p.relicCounters['KUNAI'] % 3 === 0) p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1;
          }
          if (p.relics.find(r => r.id === 'SHURIKEN')) {
              p.relicCounters['SHURIKEN'] = (p.relicCounters['SHURIKEN'] || 0) + 1;
              if (p.relicCounters['SHURIKEN'] % 3 === 0) p.strength += 1;
          }
          if (p.relics.find(r => r.id === 'ORNAMENTAL_FAN')) {
              p.relicCounters['ORNAMENTAL_FAN'] = (p.relicCounters['ORNAMENTAL_FAN'] || 0) + 1;
              if (p.relicCounters['ORNAMENTAL_FAN'] % 3 === 0) p.block += 4;
          }
          if (p.relics.find(r => r.id === 'PEN_NIB')) {
              p.relicCounters['PEN_NIB'] = (p.relicCounters['PEN_NIB'] || 0) + 1;
          }
      }

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
                    let strengthBonus = p.strength * (card.strengthScaling || 1);
                    let baseDamage = (card.damage || 0);
                    if (card.damageBasedOnBlock) baseDamage += p.block;
                    if (card.damagePerCardInHand) baseDamage += (p.hand.filter(c => c.id !== card.id).length) * card.damagePerCardInHand!;
                    if (card.damagePerAttackPlayed) baseDamage += (p.attacksPlayedThisTurn - 1) * card.damagePerAttackPlayed!;
                    if (card.damagePerStrike) baseDamage += (p.deck.filter(c => c.name.includes('ストライク') || c.name.includes('STRIKE')).length) * card.damagePerStrike!;

                    let damage = baseDamage + strengthBonus;
                    if (e.vulnerable > 0) damage = Math.floor(damage * 1.5);
                    
                    if (p.relicCounters['PEN_NIB'] >= 10) {
                        damage *= 2;
                        if (act === activations - 1 && h === hits - 1) p.relicCounters['PEN_NIB'] = 0;
                    }

                    if (e.block >= damage) { e.block -= damage; damage = 0; }
                    else { damage -= e.block; e.block = 0; }
                    
                    e.currentHp -= damage;
                    e.floatingText = { id: `dmg-${Date.now()}-${h}`, text: `${damage}`, color: 'text-red-500', iconType: 'sword' };

                    if (card.lifesteal && damage > 0) {
                        p.currentHp = Math.min(p.currentHp + damage, p.maxHp);
                        p.floatingText = { id: `heal-${Date.now()}`, text: `${damage}`, color: 'text-green-500', iconType: 'heart' };
                    }
                    if (e.currentHp <= 0) {
                         // UNLOCK ENEMY
                         storageService.saveDefeatedEnemy(e.name);

                         if (card.fatalEnergy) p.currentEnergy += card.fatalEnergy;
                         if (card.fatalPermanentDamage) {
                             const deckCard = p.deck.find(c => c.id === card.id);
                             if (deckCard) deckCard.damage = (deckCard.damage || 0) + card.fatalPermanentDamage!;
                         }
                         if (card.fatalMaxHp) { p.maxHp += card.fatalMaxHp!; p.currentHp += card.fatalMaxHp!; }
                         if (e.corpseExplosion) enemies.forEach(other => { if (other.id !== e.id) other.currentHp -= e.maxHp; });
                         if (card.capture) {
                             const capturedCard = createCardFromEnemy(e);
                             p.deck.push(capturedCard);
                             p.discardPile.push(capturedCard);
                             storageService.saveUnlockedCard(capturedCard.name);
                         }
                    }
                });
              }

              if (card.block) {
                  let blk = card.block;
                  if (p.powers['DEXTERITY']) blk += p.powers['DEXTERITY'];
                  p.block += blk;
              }
              if (card.doubleBlock) p.block *= 2;
              if (card.heal) p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
              if (card.energy) p.currentEnergy += card.energy;
              if (card.selfDamage) { p.currentHp -= card.selfDamage; if (p.powers['RUPTURE']) p.strength += p.powers['RUPTURE']; }
              if (card.strength) p.strength += card.strength;
              if (card.vulnerable) targets.forEach(e => { if (e.artifact > 0) e.artifact--; else e.vulnerable += card.vulnerable!; });
              if (card.weak) targets.forEach(e => { if (e.artifact > 0) e.artifact--; else e.weak += card.weak!; });
              if (card.poison) targets.forEach(e => { e.poison += card.poison!; }); // Artifact doesn't block poison typically in StS logic for this game, kept simple
              if (card.poisonMultiplier) targets.forEach(e => e.poison *= card.poisonMultiplier!);
              
              if (card.upgradeHand) p.hand = p.hand.map(c => getUpgradedCard(c));
              if (card.upgradeDeck) {
                  p.deck = p.deck.map(c => getUpgradedCard(c));
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  p.discardPile = p.discardPile.map(c => getUpgradedCard(c));
                  p.drawPile = p.drawPile.map(c => getUpgradedCard(c));
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
              if (card.nextTurnEnergy) p.nextTurnEnergy += card.nextTurnEnergy;
              if (card.nextTurnDraw) p.nextTurnDraw += card.nextTurnDraw;

              enemies = enemies.filter(e => e.currentHp > 0);
          }
      }

      p.hand = p.hand.filter(c => c.id !== card.id);
      
      const isCorruption = p.powers['CORRUPTION'] && card.type === CardType.SKILL;
      if (!card.exhaust && !(card.type === CardType.POWER) && !isCorruption) {
          p.discardPile.push(card);
      } else {
          if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
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
               p.hand = [];
          } else if (card.name === '計算' || card.name === 'CALCULATED_GAMBLE') {
               p.discardPile = [...p.discardPile, ...p.hand];
               const draw = p.hand.length;
               p.hand = [];
               // Draw logic omitted for brevity
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
    await wait(300);

    const enemies = [...gameState.enemies];
    for (const enemy of enemies) {
        if (gameState.player.currentHp <= 0) break;
        
        if (enemy.poison > 0) {
            enemy.currentHp -= enemy.poison;
            enemy.floatingText = { id: `psn-${Date.now()}`, text: `${enemy.poison}`, color: 'text-green-500', iconType: 'poison' };
            enemy.poison--;
            setGameState(prev => ({ ...prev, enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, currentHp: enemy.currentHp, poison: enemy.poison, floatingText: enemy.floatingText } : e) }));
            if (enemy.currentHp <= 0) {
                // UNLOCK ENEMY (Poison Death)
                storageService.saveDefeatedEnemy(enemy.name);
                continue;
            }
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

            const intent = e.nextIntent;
            
            if (intent.type === EnemyIntentType.ATTACK || intent.type === EnemyIntentType.ATTACK_DEBUFF || intent.type === EnemyIntentType.ATTACK_DEFEND) {
                let damage = intent.value + (e.strength || 0);
                if (e.weak > 0) damage = Math.floor(damage * 0.75);
                if (p.powers['INTANGIBLE'] > 0) damage = 1;
                if (p.powers['STATIC_DISCHARGE']) {
                    const dmg = p.powers['STATIC_DISCHARGE'];
                    e.currentHp -= dmg; 
                    e.floatingText = { id: `sd-${Date.now()}`, text: `${dmg}`, color: 'text-purple-400', iconType: 'zap' };
                }
                
                if (p.powers['BUFFER'] > 0) { 
                    p.powers['BUFFER']--; 
                    damage = 0; 
                    p.floatingText = { id: `buf-${Date.now()}`, text: 'BLOCKED', color: 'text-blue-300' };
                }

                if (p.block >= damage) { p.block -= damage; damage = 0; }
                else { damage -= p.block; p.block = 0; }
                
                p.currentHp -= damage;
                if (damage > 0) p.floatingText = { id: `pdmg-${Date.now()}`, text: `-${damage}`, color: 'text-red-500', iconType: 'sword' };

                if (p.powers['THORNS']) {
                    e.currentHp -= p.powers['THORNS'];
                    e.floatingText = { id: `thorns-${Date.now()}`, text: `${p.powers['THORNS']}`, color: 'text-orange-500' };
                }

                if (intent.type === EnemyIntentType.ATTACK_DEBUFF && intent.debuffType) {
                    if (intent.debuffType === 'WEAK') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + (intent.secondaryValue || 0);
                    if (intent.debuffType === 'VULNERABLE') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + (intent.secondaryValue || 0);
                }
                if (intent.type === EnemyIntentType.ATTACK_DEFEND) {
                    e.block += (intent.secondaryValue || 0);
                }

            } else if (intent.type === EnemyIntentType.DEFEND) {
                e.block = intent.value;
            } else if (intent.type === EnemyIntentType.BUFF) {
                e.strength += (intent.secondaryValue || 2);
                e.floatingText = { id: `buff-${Date.now()}`, text: 'Strength UP', color: 'text-red-400' };
            } else if (intent.type === EnemyIntentType.DEBUFF) {
                if (intent.debuffType === 'WEAK') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + (intent.secondaryValue || 0);
                if (intent.debuffType === 'POISON') p.powers['POISON'] = (p.powers['POISON'] || 0) + (intent.secondaryValue || 0);
            }
            
            if (e.vulnerable > 0) e.vulnerable--;
            if (e.weak > 0) e.weak--;

            e.nextIntent = getNextEnemyIntent(e, prev.turn + 1);

            return { ...prev, player: p, enemies: newEnemies };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    setGameState(prev => {
        const p = { ...prev.player };
        if (p.powers['INTANGIBLE'] > 0) p.powers['INTANGIBLE']--;
        
        p.hand.forEach(c => {
            if (c.name === 'やけど' || c.name === 'BURN') p.currentHp -= 2;
            if (c.name === '虫歯' || c.name === 'DECAY') p.currentHp -= 2;
            if (c.name === '不安' || c.name === 'DOUBT') p.powers['WEAK'] = (p.powers['WEAK'] || 0) + 1; 
            if (c.name === '恥' || c.name === 'SHAME') p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + 1;
            if (c.name === '後悔' || c.name === 'REGRET') p.currentHp -= p.hand.length;
        });

        let retainedCardId: string | null = null;
        if (p.relics.find(r => r.id === 'BOOKMARK') && p.hand.length > 0) {
            const randomIdx = Math.floor(Math.random() * p.hand.length);
            retainedCardId = p.hand[randomIdx].id;
        }

        const cardsToDiscard = p.hand.filter(c => c.id !== retainedCardId);
        const retainedCards = p.hand.filter(c => c.id === retainedCardId);

        p.discardPile = [...p.discardPile, ...cardsToDiscard];
        p.hand = retainedCards; 

        return { ...prev, player: p };
    });
    
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

  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            audioService.playSound('win');
            audioService.stopBGM();
            
            let hpRegen = 0;
            if (gameState.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;
            if (gameState.player.relics.find(r => r.id === 'MEAT_ON_THE_BONE') && gameState.player.currentHp <= gameState.player.maxHp / 2) hpRegen += 12;
            
            setGameState(prev => ({ 
                ...prev, 
                player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) },
            }));

            if (gameState.act === 4) {
                 storageService.saveScore({
                     id: Date.now().toString(),
                     playerName: 'Hero',
                     characterName: selectedCharName,
                     score: calculateScore(gameState, true),
                     act: gameState.act,
                     floor: gameState.floor,
                     victory: true,
                     date: Date.now(),
                     challengeMode: gameState.challengeMode
                 });
                 storageService.incrementClearCount();
                 setGameState(prev => ({ ...prev, screen: GameScreen.ENDING }));
            } else {
                 if (isMathDebugSkipped) {
                     goToRewardPhase(); 
                 } else {
                     setGameState(prev => ({ ...prev, screen: GameScreen.MATH_CHALLENGE }));
                 }
            }
        } else if (gameState.player.currentHp <= 0) {
            const hasLizardTail = gameState.player.relics.find(r => r.id === 'LIZARD_TAIL');
            const hasGhostInJar = gameState.player.potions.find(p => p.templateId === 'GHOST_IN_JAR');

            if (hasLizardTail) {
                setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, currentHp: Math.floor(prev.player.maxHp * 0.5), relics: prev.player.relics.filter(r => r.id !== 'LIZARD_TAIL') }
                }));
                audioService.playSound('win'); 
            } else if (hasGhostInJar) {
                setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, currentHp: Math.floor(prev.player.maxHp * 0.1), potions: prev.player.potions.filter(p => p.id !== hasGhostInJar.id) }
                }));
                audioService.playSound('win');
            } else {
                audioService.playSound('lose');
                audioService.stopBGM();
                storageService.saveScore({
                     id: Date.now().toString(),
                     playerName: 'Hero',
                     characterName: selectedCharName,
                     score: calculateScore(gameState, false),
                     act: gameState.act,
                     floor: gameState.floor,
                     victory: false,
                     date: Date.now(),
                     challengeMode: gameState.challengeMode
                 });
                storageService.clearSave(); 
                setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
            }
        }
    }
  }, [gameState.enemies, gameState.player.currentHp, gameState.screen]);

  const goToRewardPhase = () => {
    const rewards: RewardItem[] = [];
    const allCards = Object.values(CARDS_LIBRARY).filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL');
    
    while(rewards.length < 3) {
        const roll = Math.random() * 100;
        let targetRarity = 'COMMON';
        if (roll > 93) targetRarity = 'LEGENDARY'; else if (roll > 60) targetRarity = 'RARE'; else if (roll > 25) targetRarity = 'UNCOMMON';
        
        const pool = allCards.filter(c => c.rarity === targetRarity).length > 0 ? allCards.filter(c => c.rarity === targetRarity) : allCards;
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
              storageService.saveUnlockedRelic(item.value.id); // UNLOCK
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
              if (p.potions.length < 3) {
                  p.potions = [...p.potions, item.value];
                  storageService.saveUnlockedPotion(item.value.templateId); // UNLOCK
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

  const advanceAct = () => {
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
      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.currentHp + Math.floor(prev.player.maxHp * 0.3), prev.player.maxHp) } }));
  };
  const handleUpgradeCard = (card: ICard) => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.map(c => c.id === card.id ? getUpgradedCard(c) : c) } }));
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
    setShopCards([]);
    setEventData(null);
    setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }));
  };

  const handleLegacyCardSelect = (card: ICard) => {
      storageService.saveLegacyCard(card);
      setLegacyCardSelected(true);
  };

  const handleRetry = () => {
      setLegacyCardSelected(false);
      startGame();
  };

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
                            <div className="text-red-500 font-bold mb-6 text-sm bg-black/50 px-2 py-1 inline-block rounded border border-red-500 animate-pulse">
                                (デバッグ: 計算スキップ ON)
                            </div>
                        )}
                        {!isMathDebugSkipped && <div className="mb-8 h-6"></div>}

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

                            <button onClick={() => setShowDebugLog(true)} className="text-gray-600 text-[10px] hover:text-gray-400 mt-2 flex items-center justify-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <Terminal size={10}/> v2.2.1
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDebugLog && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowDebugLog(false)}>
                    <div className="bg-gray-900 border-2 border-green-500 p-6 rounded-lg max-w-lg w-full shadow-[0_0_20px_rgba(34,197,94,0.3)]" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 text-green-400 font-mono border-b border-green-800 pb-2">
                            System Update Log v2.2.2
                        </h2>
                        <div className="space-y-4 text-sm font-mono text-gray-300 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <section>
                                <h3 className="text-white font-bold mb-1">■ 図鑑システムの拡張 (Compendium Update)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>カードだけでなく、レリック、ポーション、敵の図鑑を追加しました。</li>
                                    <li>獲得、または撃破することで図鑑に記録されます。</li>
                                    <li>アイテムをタッチすると詳細な説明が表示されます。</li>
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

            {/* ... (Other screens logic unchanged except passed down props) ... */}
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
                <RestScreen player={gameState.player} onRest={handleRestAction} onUpgrade={handleUpgradeCard} onSynthesize={handleSynthesizeCard} onLeave={handleNodeComplete} />
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
                    onOpen={() => { 
                        setGameState(prev => {
                            let p = { ...prev.player };
                            treasureRewards.forEach(r => {
                                if (r.type === 'GOLD') p.gold += r.value;
                                if (r.type === 'RELIC') {
                                    p.relics.push(r.value);
                                    storageService.saveUnlockedRelic(r.value.id); // UNLOCK
                                    if (r.value.id === 'CURSED_KEY') p.deck.push({...CURSE_CARDS.PAIN, id: `curse-${Date.now()}`});
                                }
                            });
                            if (p.relics.find(r => r.id === 'CURSED_KEY')) {
                                const curse = Object.values(CURSE_CARDS)[Math.floor(Math.random() * Object.values(CURSE_CARDS).length)];
                                p.deck.push({ ...curse, id: `chest-curse-${Date.now()}` });
                            }
                            return { ...prev, player: p };
                        });
                    }}
                    onLeave={handleNodeComplete} 
                    rewards={treasureRewards}
                    hasCursedKey={!!gameState.player.relics.find(r => r.id === 'CURSED_KEY')}
                />
            )}

            {gameState.screen === GameScreen.GAME_OVER && (
                 <div className="w-full h-full bg-red-900 flex flex-col items-center justify-center text-center text-white p-4 overflow-hidden relative">
                    <div className="z-10 w-full max-w-4xl flex flex-col items-center">
                        <h1 className="text-5xl md:text-6xl mb-2 font-bold tracking-widest text-red-500 drop-shadow-md whitespace-nowrap">補習決定...</h1>
                        <p className="mb-4 text-xl">Act {gameState.act} - Floor {gameState.floor}</p>
                        
                        {!legacyCardSelected && gameState.player.deck.length > 0 && !gameState.challengeMode ? (
                            <div className="w-full bg-black/60 p-4 rounded-lg border-2 border-red-500 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <h2 className="text-xl font-bold text-yellow-400 mb-2 flex items-center justify-center">
                                    <Send size={24} className="mr-2"/> 後輩に「伝説のノート」を託す
                                </h2>
                                <p className="text-sm text-gray-300 mb-4">選ばれたカードは次の冒険の初期デッキに追加されます（1枚のみ）</p>
                                
                                <div className="flex flex-wrap justify-center gap-2 overflow-y-auto max-h-64 custom-scrollbar p-2">
                                    {gameState.player.deck.map(card => (
                                        <div key={card.id} className="scale-75 origin-center cursor-pointer hover:scale-90 transition-transform" onClick={() => handleLegacyCardSelect(card)}>
                                            <Card card={card} onClick={() => handleLegacyCardSelect(card)} disabled={false} />
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setLegacyCardSelected(true)}
                                    className="mt-4 text-gray-400 underline hover:text-white text-sm"
                                >
                                    何も残さず下校する
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 items-center animate-in zoom-in duration-300">
                                {legacyCardSelected && <p className="text-yellow-400 mb-4 font-bold">想いは託された！</p>}
                                <button onClick={handleRetry} className="bg-black border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-800 flex items-center justify-center rounded text-xl font-bold"><RotateCcw className="mr-2" size={20} /> 再挑戦</button>
                                <button onClick={returnToTitle} className="bg-gray-700 border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-600 flex items-center justify-center rounded text-xl font-bold"><Home className="mr-2" size={20} /> タイトルへ戻る</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.ENDING && (
                 <div className="w-full h-full bg-yellow-900 flex items-center justify-center text-center text-white p-4">
                    <div className="bg-black/50 p-8 rounded-xl border-4 border-yellow-500">
                        <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-pulse" />
                        <h1 className="text-4xl md:text-6xl mb-4 font-bold text-yellow-200">完全下校！</h1>
                        <p className="mb-8 text-lg md:text-xl">あなたは校長先生との激闘を制し、<br/>伝説の小学生として名を刻みました。</p>
                        <div className="mb-8 text-2xl font-bold text-white">SCORE: {calculateScore(gameState, true)}</div>
                        <button onClick={returnToTitle} className="bg-blue-600 border-2 border-white px-8 py-4 cursor-pointer text-xl hover:bg-blue-500 font-bold rounded shadow-lg">卒業アルバムに載る</button>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default App;