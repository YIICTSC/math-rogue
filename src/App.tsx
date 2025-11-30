
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
import Card, { KEYWORD_DEFINITIONS } from './components/Card';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Coins, Trophy, HelpCircle, Infinity, Play, ScrollText, Plus, Minus, X as MultiplyIcon, Divide, Shuffle, Send, Swords, Terminal, FlaskConical, X } from 'lucide-react';

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

const getNextEnemyIntent = (enemy: Enemy, turn: number): EnemyIntent => {
    const r = Math.random();
    if (r < 0.6) return { type: EnemyIntentType.ATTACK, value: 8 + Math.floor(turn/2) };
    if (r < 0.9) return { type: EnemyIntentType.DEFEND, value: 8 };
    return { type: EnemyIntentType.BUFF, value: 0, secondaryValue: 2 };
};

const App: React.FC = () => {
  const createDeck = (template: string[] = STARTING_DECK_TEMPLATE): ICard[] => {
    return template.map((key, index) => {
        const cardTemplate = CARDS_LIBRARY[key];
        if (!cardTemplate) {
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [lastActionType, setLastActionType] = useState<CardType | null>(null);
  const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);
  const [hasSave, setHasSave] = useState<boolean>(false);
  const [selectedCharName, setSelectedCharName] = useState<string>("戦士");
  const [showDebugLog, setShowDebugLog] = useState<boolean>(false);
  
  // New States
  const [inspectedCard, setInspectedCard] = useState<ICard | null>(null);
  const [potionToReplace, setPotionToReplace] = useState<Potion | null>(null);
  
  // Debug Logic
  const [isMathDebugSkipped, setIsMathDebugSkipped] = useState<boolean>(false);
  const [titleClickCount, setTitleClickCount] = useState<number>(0);

  // Shop & Event
  const [shopCards, setShopCards] = useState<ICard[]>([]);
  const [shopRelics, setShopRelics] = useState<Relic[]>([]);
  const [shopPotions, setShopPotions] = useState<Potion[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [unlockedCardNames, setUnlockedCardNames] = useState<string[]>([]);
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

  // --- Game State Transitions ---
  const startGame = () => {
      audioService.init();
      audioService.playSound('select');
      setGameState(prev => ({ ...prev, screen: GameScreen.MODE_SELECTION }));
  };

  const handleModeSelect = (mode: GameMode) => {
      audioService.playSound('select');
      setGameState(prev => ({ ...prev, mode, screen: GameScreen.CHARACTER_SELECTION }));
  };

  const handleCharacterSelect = (char: Character) => {
      audioService.playSound('select');
      
      const deck = createDeck(char.deckTemplate);
      const startingRelic = RELIC_LIBRARY[char.startingRelicId];
      const initialMap = generateDungeonMap();

      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          act: 1,
          floor: 0,
          turn: 0,
          map: initialMap,
          currentMapNodeId: null,
          player: {
              ...prev.player,
              maxHp: char.maxHp,
              currentHp: char.maxHp,
              maxEnergy: INITIAL_ENERGY,
              currentEnergy: INITIAL_ENERGY,
              block: 0,
              strength: 0,
              gold: char.gold,
              deck: deck,
              relics: [startingRelic],
              imageData: char.imageData,
              hand: [], discardPile: [], drawPile: [], potions: [], powers: {}, echoes: 0, 
              cardsPlayedThisTurn: 0, attacksPlayedThisTurn: 0, relicCounters: {}, turnFlags: {}, 
              nextTurnEnergy: 0, nextTurnDraw: 0, floatingText: null
          },
          narrativeLog: ["冒険が始まった。"],
          selectedCharName: char.name
      }));
      setSelectedCharName(char.name);
      
      audioService.playBGM('menu');
  };

  const handleLoadGame = () => {
      const loaded = storageService.loadGame();
      if (loaded) {
          audioService.init();
          audioService.playSound('select');
          audioService.playBGM(loaded.screen === GameScreen.BATTLE ? 'battle' : 'menu');
          setGameState(loaded);
      }
  };

  const returnToTitle = () => {
    audioService.stopBGM();
    setShopCards([]);
    setEventData(null);
    setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }));
  };

  // --- Battle Logic ---
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

  const handlePlayCard = (card: ICard) => {
    let effectiveCost = card.cost;
    if (gameState.player.powers['CORRUPTION'] && card.type === CardType.SKILL) {
        effectiveCost = 0;
    }

    if (gameState.player.currentEnergy < effectiveCost) return;
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
      let extraTurn = prev.extraTurn;
      
      p.currentEnergy -= effectiveCost;
      p.cardsPlayedThisTurn++;
      if (card.type === CardType.ATTACK) p.attacksPlayedThisTurn++;

      if (p.powers['AFTER_IMAGE']) p.block += p.powers['AFTER_IMAGE'];
      if (p.powers['THOUSAND_CUTS']) enemies.forEach(e => {
          e.currentHp -= p.powers['THOUSAND_CUTS'];
          e.floatingText = { id: `tc-${Date.now()}`, text: `${p.powers['THOUSAND_CUTS']}`, color: 'text-purple-400', iconType: 'zap' };
      });

      if (card.extraTurn) {
          extraTurn = true;
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

              if (card.damage || card.damageBasedOnBlock || card.damagePerCardInHand || card.damagePerAttackPlayed || card.damagePerStrike || card.damagePerDrawPile) {
                targets.forEach(e => {
                    let strengthBonus = p.strength * (card.strengthScaling || 1);
                    let baseDamage = (card.damage || 0);
                    if (card.damageBasedOnBlock) baseDamage += p.block;
                    if (card.damagePerCardInHand) baseDamage += (p.hand.filter(c => c.id !== card.id).length) * card.damagePerCardInHand!;
                    if (card.damagePerAttackPlayed) baseDamage += (p.attacksPlayedThisTurn - 1) * card.damagePerAttackPlayed!;
                    if (card.damagePerStrike) baseDamage += (p.deck.filter(c => c.name.includes('ストライク') || c.name.includes('STRIKE')).length) * card.damagePerStrike!;
                    if (card.damagePerDrawPile) baseDamage += p.drawPile.length * card.damagePerDrawPile;

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
                         storageService.saveDefeatedEnemy(e.name);
                         if (card.fatalEnergy) p.currentEnergy += card.fatalEnergy;
                         if (card.fatalPermanentDamage) {
                             const deckCard = p.deck.find(c => c.id === card.id);
                             if (deckCard) deckCard.damage = (deckCard.damage || 0) + card.fatalPermanentDamage!;
                         }
                         if (card.fatalMaxHp) { p.maxHp += card.fatalMaxHp!; p.currentHp += card.fatalMaxHp!; }
                    }
                });
              }

              if (card.block) {
                  let blk = card.block;
                  if (p.powers['DEXTERITY']) blk += p.powers['DEXTERITY'];
                  p.block += blk;
              }
              if (card.doubleBlock) p.block *= 2;
              if (card.energy) p.currentEnergy += card.energy;
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
              if (card.addCardToDiscard) {
                   for (let c=0; c<card.addCardToDiscard.count; c++) { 
                       let newC = { ...CARDS_LIBRARY[card.addCardToDiscard.cardName], id: `gen-${Date.now()}-${c}` };
                       p.discardPile.push(newC);
                   }
              }

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
      
      let nextSelectedId = prev.selectedEnemyId;
      if (!enemies.find(e => e.id === nextSelectedId) && enemies.length > 0) nextSelectedId = enemies[0].id;

      return { ...prev, player: p, enemies: enemies, selectedEnemyId: nextSelectedId, selectionState: nextSelectionState, extraTurn: extraTurn };
    });
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
                 if (card.name === '作戦' || card.name === 'STRATEGIST') p.currentEnergy += 2;
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
              target.floatingText = { id: `pot-${Date.now()}`, text: '20', color: 'text-red-500', iconType: 'sword' };
          } else if (potion.templateId === 'BLOCK_POTION') {
              p.block += 12;
          } else if (potion.templateId === 'STRENGTH_POTION') {
              p.strength += 2;
          } else if (potion.templateId === 'ENERGY_POTION') {
              p.currentEnergy += 2;
          } else if (potion.templateId === 'WEAK_POTION' && target) {
              target.weak += 3;
          } else if (potion.templateId === 'POISON_POTION' && target) {
              target.poison += 6;
          } else if (potion.templateId === 'HEALTH_POTION') {
              p.currentHp = Math.min(p.maxHp, p.currentHp + 15);
          } else if (potion.templateId === 'LIQUID_BRONZE') {
              p.powers['THORNS'] = (p.powers['THORNS'] || 0) + 3;
          } else if (potion.templateId === 'GHOST_IN_JAR') {
              p.powers['INTANGIBLE'] = (p.powers['INTANGIBLE'] || 0) + 1;
          } else if (potion.templateId === 'GAMBLERS_BREW') {
              const count = p.hand.length;
              p.discardPile.push(...p.hand);
              p.hand = [];
              let newHand = [];
              let newDraw = [...p.drawPile];
              let newDiscard = [...p.discardPile];
              for(let i=0; i<count; i++) {
                  if(newDraw.length === 0) {
                      if(newDiscard.length === 0) break;
                      newDraw = shuffle(newDiscard);
                      newDiscard = [];
                  }
                  newHand.push(newDraw.pop()!);
              }
              p.hand = newHand; p.drawPile = newDraw; p.discardPile = newDiscard;
          } else if (potion.templateId === 'ENTROPIC_BREW') {
               const slots = 3 - p.potions.length;
               const all = Object.values(POTION_LIBRARY);
               for(let i=0; i<slots; i++) {
                   p.potions.push({...all[Math.floor(Math.random()*all.length)], id: `ent-${Date.now()}-${i}`});
               }
          }

          const remainingEnemies = enemies.filter(e => e.currentHp > 0);
          return { ...prev, player: p, enemies: remainingEnemies };
      });
  };

  const handleEndTurn = async () => {
    if (gameState.extraTurn) {
        audioService.playSound('select');
        setTurnLog("追加ターン！");
        setGameState(prev => ({ ...prev, extraTurn: false }));
        await wait(500);
        startPlayerTurn();
        return;
    }

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
                
                if (p.block >= damage) { p.block -= damage; damage = 0; }
                else { damage -= p.block; p.block = 0; }
                
                p.currentHp -= damage;
                if (damage > 0) p.floatingText = { id: `pdmg-${Date.now()}`, text: `-${damage}`, color: 'text-red-500', iconType: 'sword' };
            } else if (intent.type === EnemyIntentType.DEFEND) {
                e.block = intent.value;
            } else if (intent.type === EnemyIntentType.BUFF) {
                e.strength += (intent.secondaryValue || 2);
                e.floatingText = { id: `buff-${Date.now()}`, text: 'Strength UP', color: 'text-red-400' };
            }
            
            e.nextIntent = getNextEnemyIntent(e, prev.turn + 1);
            return { ...prev, player: p, enemies: newEnemies };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    setGameState(prev => {
        const p = { ...prev.player };
        if (p.powers['INTANGIBLE'] > 0) p.powers['INTANGIBLE']--;
        p.discardPile = [...p.discardPile, ...p.hand];
        p.hand = []; 
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
            audioService.playSound('lose');
            audioService.stopBGM();
            storageService.clearSave(); 
            setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
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
    } else {
        const gold = 10 + Math.floor(Math.random() * 10);
        rewards.push({ type: 'GOLD', value: gold, id: `rew-gold-${Date.now()}` });
    }

    if (Math.random() < 0.4 && !gameState.player.relics.find(r => r.id === 'SOZU')) {
        const allPotions = Object.values(POTION_LIBRARY);
        const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
        rewards.push({ type: 'POTION', value: { ...potion, id: `rew-pot-${Date.now()}` }, id: `rew-pot-${Date.now()}` });
    }

    setGameState(prev => ({ ...prev, screen: GameScreen.REWARD, rewards: rewards }));
    audioService.playSound('select');
  };

  const attemptAddPotion = (newPotion: Potion) => {
      const p = gameState.player;
      if (p.potions.length < 3) {
          setGameState(prev => ({
              ...prev,
              player: { ...prev.player, potions: [...prev.player.potions, newPotion] }
          }));
          return true;
      } else {
          setPotionToReplace(newPotion);
          return false;
      }
  };

  const confirmPotionReplace = (indexToReplace: number) => {
      if (!potionToReplace) return;
      setGameState(prev => {
          const newPotions = [...prev.player.potions];
          newPotions[indexToReplace] = potionToReplace;
          return { ...prev, player: { ...prev.player, potions: newPotions } };
      });
      setPotionToReplace(null);
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
          } else if (item.type === 'POTION') {
              const added = attemptAddPotion(item.value);
              if (added) {
                  storageService.saveUnlockedPotion(item.value.templateId);
                  nextRewards = nextRewards.filter(r => r.id !== item.id);
              }
          }
          
          if (nextRewards.length === 0 && !potionToReplace) {
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

  const handleNodeSelect = async (node: MapNode) => {
      if (node.type === NodeType.TREASURE) {
            setIsLoading(true);
            const nextState = { ...gameState, currentMapNodeId: node.id, floor: node.y + 1 };
            const rewards: RewardItem[] = [];
            const r = Math.random();
            if (r < 0.5) {
                rewards.push({ type: 'GOLD', value: 50 + Math.floor(Math.random() * 100), id: `tr-gold-${Date.now()}` });
            } else {
                const relics = Object.values(RELIC_LIBRARY).filter(rel => rel.rarity !== 'BOSS' && rel.rarity !== 'STARTER');
                const relic = relics[Math.floor(Math.random() * relics.length)];
                rewards.push({ type: 'RELIC', value: relic, id: `tr-relic-${Date.now()}` });
            }
            if (rewards.length === 0) rewards.push({ type: 'GOLD', value: 25, id: `tr-gold-fallback` });

            setTreasureRewards(rewards);
            setGameState({ ...nextState, screen: GameScreen.TREASURE });
            audioService.playBGM('menu');
            setIsLoading(false);
            return;
      }
      
      setIsLoading(true);
      audioService.playSound('select');
      
      const nextState = { ...gameState, currentMapNodeId: node.id, floor: node.y + 1 };
      
      try {
        if (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS || node.type === NodeType.START) {
            const actMultiplier = gameState.act; 
            const floorDifficulty = node.y * (1 + (actMultiplier * 0.5));
            let enemies: Enemy[] = [];
            
            if (gameState.act === 4 && node.type === NodeType.BOSS) {
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
                    enemies.push({
                        id: `enemy-${node.y}-${i}-${Date.now()}`,
                        enemyType: 'GENERIC',
                        name: isBoss ? `ボス: ${name}` : name,
                        maxHp: Math.floor(baseHp),
                        currentHp: Math.floor(baseHp),
                        block: 0,
                        strength: 0,
                        nextIntent: { type: EnemyIntentType.ATTACK, value: 5 },
                        vulnerable: 0, weak: 0, poison: 0, artifact: 0, corpseExplosion: false,
                        floatingText: null
                    });
                }
            }
            
            const p = { ...nextState.player };
            p.drawPile = shuffle([...p.deck]);
            p.hand = [];
            p.discardPile = [];
            p.currentEnergy = p.maxEnergy;
            p.block = 0;
            p.strength = 0;
            
            for(let i=0; i<HAND_SIZE; i++) {
                if(p.drawPile.length > 0) p.hand.push(p.drawPile.pop()!);
            }

            setGameState({
                ...nextState,
                screen: GameScreen.BATTLE,
                player: p,
                enemies: enemies,
                selectedEnemyId: enemies[0].id,
                narrativeLog: [...nextState.narrativeLog, "戦闘開始"],
                turn: 1
            });
            audioService.playBGM('battle');
            setTurnLog("あなたのターン");

        } else if (node.type === NodeType.REST) {
            setGameState({ ...nextState, screen: GameScreen.REST });
            audioService.playBGM('menu');
        } else if (node.type === NodeType.SHOP) {
            setShopCards([]); // Simplified generation for brevity, assume ShopScreen handles or it's done elsewhere
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
            setShopRelics(shuffle(Object.values(RELIC_LIBRARY).filter(r => r.rarity !== 'BOSS')).slice(0, 2));
            setShopPotions(shuffle(Object.values(POTION_LIBRARY)).slice(0, 3).map(p => ({ ...p, id: `shop-pot-${Date.now()}-${Math.random()}` })));
            setGameState({ ...nextState, screen: GameScreen.SHOP });
            audioService.playBGM('menu');
        } else if (node.type === NodeType.EVENT) {
            setGameState({ ...nextState, screen: GameScreen.EVENT });
            audioService.playBGM('menu');
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleRestAction = () => setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.currentHp + Math.floor(prev.player.maxHp * 0.3), prev.player.maxHp) } }));
  const handleUpgradeCard = (card: ICard) => setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.map(c => c.id === card.id ? getUpgradedCard(c) : c) } }));
  const handleSynthesizeCard = (c1: ICard, c2: ICard) => {
      // Simplified synthesis: Sum stats, avg cost
      const newCost = Math.floor((c1.cost + c2.cost) / 2);
      const newCard: ICard = {
          ...c1,
          id: `syn-${Date.now()}`,
          name: `${c1.name.slice(0,2)}${c2.name.slice(-2)}`,
          cost: newCost,
          damage: (c1.damage || 0) + (c2.damage || 0),
          block: (c1.block || 0) + (c2.block || 0),
          description: `合成: ${c1.name} + ${c2.name}`,
          textureRef: c2.name // Inherit sprite from second
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
          return { ...prev, map: newMap, screen: GameScreen.MAP };
      });
      audioService.playBGM('menu');
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[600px] border-[10px] md:border-[20px] border-gray-800 rounded-xl relative overflow-hidden shadow-2xl bg-black crt-scanline">
            
            {inspectedCard && (
                <div className="fixed inset-0 z-[150] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setInspectedCard(null)}>
                    <div className="scale-150 mb-8 transform transition-transform" onClick={(e) => e.stopPropagation()}>
                         <Card card={inspectedCard} onClick={() => {}} disabled={false} />
                    </div>
                    <div className="bg-gray-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setInspectedCard(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                            <X size={24} />
                        </button>
                        <h3 className="text-2xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2">{inspectedCard.name}</h3>
                        <p className="text-lg text-white mb-6 leading-relaxed whitespace-pre-wrap font-bold bg-black/30 p-3 rounded">
                            {inspectedCard.description}
                        </p>
                    </div>
                </div>
            )}

            {potionToReplace && (
                <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4" onClick={() => setPotionToReplace(null)}>
                    <div className="bg-gray-800 border-2 border-white p-6 rounded-lg max-w-md w-full text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">ポーションがいっぱいです！</h3>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {gameState.player.potions.map((p, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => confirmPotionReplace(idx)}
                                    className="flex flex-col items-center cursor-pointer hover:bg-red-900/50 p-2 rounded border border-gray-600 hover:border-red-500 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mb-1">
                                        <FlaskConical size={20} style={{ color: p.color }} />
                                    </div>
                                    <span className="text-xs text-gray-300">{p.name}</span>
                                    <span className="text-[10px] text-red-400 mt-1">捨てる</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setPotionToReplace(null)} className="text-gray-400 underline hover:text-white">
                            交換をやめる
                        </button>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center p-8 w-full flex flex-col items-center">
                        <h1 onClick={handleTitleClick} className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-600 mb-8 font-bold animate-pulse tracking-widest cursor-pointer select-none">
                            算数ローグ<br/><span className="text-4xl">伝説の小学生</span>
                        </h1>
                        <div className="flex flex-col gap-4">
                            <button onClick={startGame} className="bg-gray-100 text-black py-3 px-8 text-lg font-bold border-b-4 border-r-4 border-gray-500 hover:translate-x-[1px] hover:translate-y-[1px] active:border-0 active:translate-y-[4px] active:translate-x-[4px] transition-all cursor-pointer shadow-lg flex items-center justify-center">
                                <Play className="mr-2" /> 冒険を始める
                            </button>
                            {hasSave && (
                                <button onClick={() => {
                                    const loaded = storageService.loadGame();
                                    if(loaded) {
                                        setGameState(loaded);
                                        audioService.init();
                                        audioService.playBGM(loaded.screen === GameScreen.BATTLE ? 'battle' : 'menu');
                                    }
                                }} className="bg-blue-600 text-white py-2 px-8 font-bold border-b-4 border-blue-800 hover:bg-blue-500 cursor-pointer">
                                    続きから
                                </button>
                            )}
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.COMPENDIUM }))} className="text-gray-400 hover:text-white flex items-center justify-center">
                                <BookOpen className="mr-2" size={16} /> 図鑑
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.RANKING }))} className="text-gray-400 hover:text-white flex items-center justify-center">
                                <Trophy className="mr-2" size={16} /> ランキング
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.HELP }))} className="text-gray-400 hover:text-white flex items-center justify-center">
                                <HelpCircle className="mr-2" size={16} /> 遊び方
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.MODE_SELECTION && (
                <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-8 text-white">
                    <h2 className="text-3xl font-bold mb-8">モード選択</h2>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                        <button onClick={() => handleModeSelect(GameMode.ADDITION)} className="bg-blue-600 p-6 rounded-xl font-bold text-2xl flex flex-col items-center hover:bg-blue-500 transition-colors border-4 border-blue-800">
                            <Plus size={48} className="mb-2"/> たしざん
                        </button>
                        <button onClick={() => handleModeSelect(GameMode.SUBTRACTION)} className="bg-red-600 p-6 rounded-xl font-bold text-2xl flex flex-col items-center hover:bg-red-500 transition-colors border-4 border-red-800">
                            <Minus size={48} className="mb-2"/> ひきざん
                        </button>
                        <button onClick={() => handleModeSelect(GameMode.MULTIPLICATION)} className="bg-green-600 p-6 rounded-xl font-bold text-2xl flex flex-col items-center hover:bg-green-500 transition-colors border-4 border-green-800">
                            <MultiplyIcon size={48} className="mb-2"/> かけざん
                        </button>
                        <button onClick={() => handleModeSelect(GameMode.DIVISION)} className="bg-yellow-600 p-6 rounded-xl font-bold text-2xl flex flex-col items-center hover:bg-yellow-500 transition-colors border-4 border-yellow-800">
                            <Divide size={48} className="mb-2"/> わりざん
                        </button>
                    </div>
                    <button onClick={() => handleModeSelect(GameMode.MIXED)} className="mt-4 bg-purple-600 px-12 py-4 rounded-xl font-bold text-xl flex items-center hover:bg-purple-500 transition-colors border-4 border-purple-800 w-full max-w-lg justify-center">
                        <Shuffle size={24} className="mr-2"/> ミックス
                    </button>
                    <button onClick={returnToTitle} className="mt-8 text-gray-400 hover:text-white">戻る</button>
                </div>
            )}

            {gameState.screen === GameScreen.CHARACTER_SELECTION && (
                <CharacterSelectionScreen 
                    characters={CHARACTERS} 
                    unlockedCount={Math.min(CHARACTERS.length, clearCount + 1)} // Unlock 1 char per clear
                    onSelect={handleCharacterSelect}
                />
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

            {gameState.screen === GameScreen.SHOP && (
                <ShopScreen 
                    player={gameState.player}
                    shopCards={shopCards}
                    shopRelics={shopRelics}
                    shopPotions={shopPotions}
                    onBuyCard={(card) => {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (card.price||50), deck: [...prev.player.deck, { ...card, id: `buy-${Date.now()}` }], discardPile: [...prev.player.discardPile, { ...card, id: `buy-${Date.now()}` }] } }));
                    }}
                    onBuyRelic={(relic) => {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (relic.price||150), relics: [...prev.player.relics, relic] } }));
                    }}
                    onBuyPotion={(potion) => {
                        const added = attemptAddPotion(potion);
                        if (added) {
                             setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (potion.price||50) } }));
                        }
                    }}
                    onRemoveCard={(cardId, cost) => {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - cost, deck: prev.player.deck.filter(c => c.id !== cardId) } }));
                    }}
                    onLeave={handleNodeComplete}
                />
            )}

            {gameState.screen === GameScreen.REWARD && (
                <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} />
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

            {gameState.screen === GameScreen.REST && (
                <RestScreen player={gameState.player} onRest={handleRestAction} onUpgrade={handleUpgradeCard} onSynthesize={handleSynthesizeCard} onLeave={handleNodeComplete} />
            )}
            
            {gameState.screen === GameScreen.COMPENDIUM && (
                <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MATH_CHALLENGE && (
                <MathChallengeScreen mode={gameState.mode} onComplete={handleMathChallengeComplete} />
            )}

            {gameState.screen === GameScreen.RANKING && (
                <RankingScreen onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.HELP && (
                <HelpScreen onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.EVENT && (
                <EventScreen 
                    title="不思議な出来事" 
                    description="何かが起こりそうだ..." 
                    options={[{ label: "立ち去る", text: "何もしない", action: handleNodeComplete }]} 
                    resultLog={null}
                    onContinue={handleNodeComplete}
                />
            )}

            {gameState.screen === GameScreen.GAME_OVER && (
                 <div className="w-full h-full bg-red-900 flex items-center justify-center text-center text-white">
                    <div>
                        <h1 className="text-6xl mb-4 font-bold">敗北...</h1>
                        <p className="mb-8 text-2xl">Act {gameState.act} - Floor {gameState.floor}</p>
                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={returnToTitle} className="bg-gray-700 border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-600 flex items-center justify-center"><Home className="mr-2" size={20} /> タイトルへ戻る</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.ENDING && (
                 <div className="w-full h-full bg-yellow-900 flex items-center justify-center text-center text-white">
                    <div>
                        <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-pulse" />
                        <h1 className="text-6xl mb-4 font-bold text-yellow-200">完全クリア！</h1>
                        <p className="mb-8 text-xl">伝説の小学生として語り継がれるでしょう。</p>
                        <button onClick={returnToTitle} className="bg-blue-600 border-2 border-white px-8 py-4 cursor-pointer text-xl hover:bg-blue-500 font-bold">タイトルへ</button>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default App;
