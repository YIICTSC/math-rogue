
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Club, Diamond, Heart, Spade, ShoppingBag, BarChart3, ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutList, Layers, HelpCircle, BookOpen, Flag, Calculator, ArrowRight, Sparkles, Package, Ghost, Eye } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';
import ScoreAnimation from './ScoreAnimation';
import { 
    PokerCard, PokerRunState, PokerBlind, PokerSupporter, PokerConsumable, PokerSuit, PokerRank, PokerScoringContext, PokerPack, ScoreStep
} from '../types';
import { POKER_HAND_LEVELS, SUPPORTERS_LIBRARY, CONSUMABLES_LIBRARY, PACK_LIBRARY } from '../constants';

// --- Constants & Helpers ---
const SUITS: PokerSuit[] = ['SPADE', 'HEART', 'DIAMOND', 'CLUB'];
const RANKS: PokerRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// Blind scaling logic
const getBlindConfig = (ante: number, index: number): PokerBlind => {
    const base = 300 * Math.pow(1.5, ante - 1);
    let goal = base;
    let name = "Pop Quiz";
    let reward = 3 + ante;
    
    if (index === 0) {
        name = "Pop Quiz (小テスト)";
        goal = Math.floor(base * 1.0);
    } else if (index === 1) {
        name = "Midterm (中間テスト)";
        goal = Math.floor(base * 1.5);
        reward += 1;
    } else {
        name = "Final Exam (期末テスト)";
        goal = Math.floor(base * 2.5);
        reward += 2;
    }

    // Boss Abilities
    let bossAbility = undefined;
    let desc = undefined;
    if (index === 2) {
        const abilities = [
            { id: 'THE_WALL', name: 'PTA会長', desc: 'スコア目標が超高い' },
            { id: 'THE_NEEDLE', name: '一発勝負', desc: '手札を1回しか出せない' },
            { id: 'THE_HOOK', name: '没収', desc: '手札を出すたびランダムに2枚捨てられる' },
            { id: 'THE_EYE', name: '厳しい監視', desc: '同じ役を繰り返せない' },
            { id: 'THE_MANACLE', name: '校則違反', desc: '手札枚数制限 -1' }
        ];
        const ability = abilities[(ante - 1) % abilities.length];
        bossAbility = ability.id;
        name = `${ability.name} (期末テスト)`;
        desc = ability.desc;
        if (ability.id === 'THE_WALL') goal *= 2;
    }

    return { name, scoreGoal: Math.floor(goal), rewardMoney: reward, bossAbility, description: desc };
};

const createDeck = (): PokerCard[] => {
    const deck: PokerCard[] = [];
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            deck.push({
                id: `${suit}-${rank}-${Math.random()}`,
                suit,
                rank,
                isSelected: false,
                bonusChips: 0,
                multMultiplier: 1
            });
        });
    });
    return deck.sort(() => Math.random() - 0.5);
};

const generateRandomPlayingCard = (): PokerCard => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const card: PokerCard = {
        id: `pack-${suit}-${rank}-${Date.now()}-${Math.random()}`,
        suit,
        rank,
        isSelected: false,
        bonusChips: 0,
        multMultiplier: 1
    };
    
    // Chance for enhancement
    if (Math.random() < 0.1) {
        const r = Math.random();
        if (r < 0.3) { card.enhancement = 'BONUS'; card.bonusChips += 30; }
        else if (r < 0.6) { card.enhancement = 'MULT'; card.multMultiplier += 0.5; }
        else if (r < 0.8) { card.enhancement = 'GOLD'; } 
        else { card.enhancement = 'STEEL'; } 
    }
    return card;
};

const getHandResult = (cards: PokerCard[]): { type: string, cards: PokerCard[] } => {
    if (cards.length === 0) return { type: 'HIGH_CARD', cards: [] };
    const sorted = [...cards].sort((a, b) => a.rank - b.rank);
    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);
    const isFlush = cards.length >= 5 && suits.every(s => s === suits[0]);
    let isStraight = false;
    // Simple straight check for 5 cards
    if (cards.length === 5) {
        let straightCount = 0;
        for (let i = 0; i < ranks.length - 1; i++) {
            if (ranks[i+1] === ranks[i] + 1) straightCount++;
        }
        if (straightCount === 4) isStraight = true;
        // A-5 check (14, 2, 3, 4, 5)
        if (!isStraight && ranks.includes(14) && ranks.includes(2) && ranks.includes(3) && ranks.includes(4) && ranks.includes(5)) isStraight = true;
    }

    const counts: Record<number, number> = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const countsValues = Object.values(counts).sort((a, b) => b - a);

    if (isFlush && isStraight) {
        if (ranks.includes(14) && ranks.includes(13)) return { type: 'ROYAL_FLUSH', cards: sorted };
        return { type: 'STRAIGHT_FLUSH', cards: sorted };
    }
    
    if (countsValues[0] === 4) {
        const rank = Object.keys(counts).find(key => counts[Number(key)] === 4);
        return { type: 'FOUR_OF_A_KIND', cards: sorted.filter(c => c.rank === Number(rank)) };
    }
    
    if (countsValues[0] === 3 && countsValues[1] >= 2) return { type: 'FULL_HOUSE', cards: sorted };
    
    if (isFlush) return { type: 'FLUSH', cards: sorted };
    
    if (isStraight) return { type: 'STRAIGHT', cards: sorted };
    
    if (countsValues[0] === 3) {
        const rank = Object.keys(counts).find(key => counts[Number(key)] === 3);
        return { type: 'THREE_OF_A_KIND', cards: sorted.filter(c => c.rank === Number(rank)) };
    }
    
    if (countsValues[0] === 2 && countsValues[1] === 2) {
        const pairRanks = Object.keys(counts).filter(key => counts[Number(key)] === 2).map(Number);
        return { type: 'TWO_PAIR', cards: sorted.filter(c => pairRanks.includes(c.rank)) };
    }
    
    if (countsValues[0] === 2) {
        const rank = Object.keys(counts).find(key => counts[Number(key)] === 2);
        return { type: 'PAIR', cards: sorted.filter(c => c.rank === Number(rank)) };
    }
    
    // High Card: If selected < 5, just highest. If 5 selected and nothing else, highest.
    return { type: 'HIGH_CARD', cards: [sorted[sorted.length - 1]] }; 
};

const getRankDisplay = (rank: PokerRank) => {
    if (rank === 14) return 'A';
    if (rank === 13) return 'K';
    if (rank === 12) return 'Q';
    if (rank === 11) return 'J';
    return rank.toString();
};

const getSuitIcon = (suit: PokerSuit) => {
    switch(suit) {
        case 'SPADE': return <Spade className="text-blue-400 fill-current" />;
        case 'HEART': return <Heart className="text-red-500 fill-current" />;
        case 'DIAMOND': return <Diamond className="text-yellow-400 fill-current" />;
        case 'CLUB': return <Club className="text-green-500 fill-current" />;
    }
};

interface PokerGameScreenProps {
  onBack: () => void;
}

const PokerGameScreen: React.FC<PokerGameScreenProps> = ({ onBack }) => {
  // --- Game State ---
  const [phase, setPhase] = useState<'BLIND_SELECT' | 'PLAY' | 'SHOP' | 'PACK_OPEN' | 'GAME_OVER' | 'VICTORY'>('BLIND_SELECT');
  const [runState, setRunState] = useState<PokerRunState>({
      deck: [],
      money: 4,
      ante: 1,
      blindIndex: 0,
      currentBlind: getBlindConfig(1, 0),
      supporters: [],
      consumables: [],
      handLevels: { ...Object.keys(POKER_HAND_LEVELS).reduce((acc, key) => ({ ...acc, [key]: 1 }), {}) },
      vouchers: [],
      currentScore: 0,
      handsRemaining: 4,
      discardsRemaining: 3,
      hand: [],
      discardPile: [],
      shopInventory: []
  });

  // Pack Logic
  const [currentPack, setCurrentPack] = useState<PokerPack | null>(null);
  const [packContent, setPackContent] = useState<(PokerCard | PokerSupporter | PokerConsumable)[]>([]);
  const [isPackOpened, setIsPackOpened] = useState(false);

  // Play Animation State
  const [animating, setAnimating] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showHandList, setShowHandList] = useState(false);
  const [showDeckList, setShowDeckList] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  // Hand Prediction State
  const [prediction, setPrediction] = useState<{name: string, level: number, chips: number, mult: number} | null>(null);

  // Score Sequence State
  const [isScoring, setIsScoring] = useState(false);
  const [scoreSteps, setScoreSteps] = useState<ScoreStep[]>([]);
  const [pendingScoreUpdate, setPendingScoreUpdate] = useState<{newScore: number, hand: PokerCard[], deck: PokerCard[], discard: PokerCard[]} | null>(null);

  // Consumable Usage
  const [selectedConsumable, setSelectedConsumable] = useState<PokerConsumable | null>(null);

  // Inspection Modal State
  const [inspectedItem, setInspectedItem] = useState<PokerSupporter | PokerConsumable | null>(null);
  const longPressTimer = useRef<any>(null);

  // Sorting
  const [sortRankAsc, setSortRankAsc] = useState(false);

  // Drag/Swipe Select
  const isDraggingRef = useRef(false);
  const lastProcessedCardIdRef = useRef<string | null>(null);

  // --- Initialization ---
  useEffect(() => {
      initRun();
  }, []);

  // --- Hand Prediction Hook ---
  useEffect(() => {
      if (selectedCards.length > 0) {
          const playedCards = runState.hand.filter(c => selectedCards.includes(c.id));
          const { type } = getHandResult(playedCards);
          const level = runState.handLevels[type] || 1;
          const baseStats = POKER_HAND_LEVELS[type];
          
          let chips = baseStats.baseChips + (level - 1) * 10;
          let mult = baseStats.baseMult + (level - 1) * 1;
          
          // Basic preview calculation (without detailed card/joker logic for simplicity in preview, 
          // or we could run a dry-run calculation if we want perfect accuracy. 
          // For now, base stats + level is good enough to show "What hand is this?")
          
          setPrediction({
              name: baseStats.name,
              level,
              chips,
              mult
          });
      } else {
          setPrediction(null);
      }
  }, [selectedCards, runState.hand, runState.handLevels]);

  const initRun = () => {
      const deck = createDeck();
      setRunState({
          deck,
          money: 4,
          ante: 1,
          blindIndex: 0,
          currentBlind: getBlindConfig(1, 0),
          supporters: [],
          consumables: [],
          handLevels: { ...Object.keys(POKER_HAND_LEVELS).reduce((acc, key) => ({ ...acc, [key]: 1 }), {}) },
          vouchers: [],
          currentScore: 0,
          handsRemaining: 4,
          discardsRemaining: 3,
          hand: [],
          discardPile: [],
          shopInventory: []
  });
      setPhase('BLIND_SELECT');
      audioService.playBGM('poker_shop');
  };

  const startBlind = () => {
      const deck = [...runState.deck].sort(() => Math.random() - 0.5);
      const hand = deck.splice(0, 8);
      hand.sort((a, b) => b.rank - a.rank);
      
      setRunState(prev => ({
          ...prev,
          deck,
          hand,
          discardPile: [],
          currentScore: 0,
          handsRemaining: prev.currentBlind.bossAbility === 'THE_NEEDLE' ? 1 : 4,
          discardsRemaining: 3
      }));
      setPhase('PLAY');
      audioService.playBGM('poker_play');
  };

  // --- Tooltip/Inspection Handlers ---
  const handleTouchStart = (item: PokerSupporter | PokerConsumable) => {
      longPressTimer.current = setTimeout(() => {
          setInspectedItem(item);
      }, 500);
  };

  const handleTouchEnd = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
      }
  };

  const handleContextMenu = (e: React.MouseEvent, item: PokerSupporter | PokerConsumable) => {
      e.preventDefault();
      setInspectedItem(item);
  };

  const toggleSelect = (id: string) => {
      if (animating || isScoring) return;
      
      if (selectedCards.includes(id)) {
          setSelectedCards(prev => prev.filter(c => c !== id));
      } else {
          if (selectedCards.length < 5) {
              setSelectedCards(prev => [...prev, id]);
              audioService.playSound('select');
          }
      }
  };

  // --- Drag Select Handlers ---
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
      e.preventDefault();
      isDraggingRef.current = true;
      lastProcessedCardIdRef.current = id;
      toggleSelect(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const element = document.elementFromPoint(e.clientX, e.clientY);
      const cardContainer = element?.closest('[data-card-id]');
      if (cardContainer) {
          const id = cardContainer.getAttribute('data-card-id');
          if (id && id !== lastProcessedCardIdRef.current) {
              lastProcessedCardIdRef.current = id;
              toggleSelect(id);
          }
      }
  };

  const handlePointerUp = () => {
      isDraggingRef.current = false;
      lastProcessedCardIdRef.current = null;
  };

  const sortHandRank = () => {
      const newAsc = !sortRankAsc;
      setSortRankAsc(newAsc);
      const newHand = [...runState.hand].sort((a, b) => newAsc ? a.rank - b.rank : b.rank - a.rank);
      setRunState(prev => ({ ...prev, hand: newHand }));
      audioService.playSound('select');
  };

  const sortHandSuit = () => {
      const newHand = [...runState.hand].sort((a, b) => {
          if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
          return b.rank - a.rank;
      });
      setRunState(prev => ({ ...prev, hand: newHand }));
      audioService.playSound('select');
  };

  const playHand = () => {
      if (animating || isScoring || selectedCards.length === 0 || runState.handsRemaining <= 0) return;
      
      const playedCards = runState.hand.filter(c => selectedCards.includes(c.id));
      const { type, cards: scoringCards } = getHandResult(playedCards);
      
      const level = runState.handLevels[type] || 1;
      const baseStats = POKER_HAND_LEVELS[type];
      
      // --- SEQUENCE GENERATION ---
      const steps: ScoreStep[] = [];
      
      // 1. Base Score
      let chips = baseStats.baseChips + (level - 1) * 10;
      let mult = baseStats.baseMult + (level - 1) * 1;
      
      steps.push({ 
          id: 'base_score', 
          sourceName: `${baseStats.name} (Lvl ${level})`, 
          type: 'BASE', 
          operation: 'ADD_CHIPS', 
          value: chips 
      });
      steps.push({ 
          id: 'base_mult', 
          sourceName: `${baseStats.name} (Lvl ${level})`, 
          type: 'BASE', 
          operation: 'ADD_MULT', 
          value: mult 
      });

      // 2. Card Modifiers
      scoringCards.forEach(c => {
          let val = c.rank;
          if (val > 10 && val < 14) val = 10;
          if (val === 14) val = 11;
          
          steps.push({
              id: `card_chips_${c.id}`,
              sourceName: `${getRankDisplay(c.rank)} of ${c.suit}`,
              type: 'CARD',
              operation: 'ADD_CHIPS',
              value: val,
              triggerCardId: c.id
          });

          if (c.bonusChips > 0) {
              steps.push({
                  id: `card_bonus_${c.id}`,
                  sourceName: c.enhancement || 'Bonus',
                  type: 'CARD',
                  operation: 'ADD_CHIPS',
                  value: c.bonusChips,
                  triggerCardId: c.id
              });
          }
          if (c.multMultiplier > 1) {
              steps.push({
                  id: `card_mult_${c.id}`,
                  sourceName: c.enhancement || 'Mult',
                  type: 'CARD',
                  operation: 'MULT_MULT', // Currently multMultiplier is additive in types but logic was mixed. Let's treating it as mult for Mult Card.
                  value: c.multMultiplier, // Assuming 1.5 etc.
                  triggerCardId: c.id
              });
          }
          
          // Apply modification to temp running totals for context
          chips += val + c.bonusChips;
          // mult logic handled in step playback visually
      });

      // 3. Supporter Modifiers
      // Create a tracking context for logic, but we record the STEPS instead of just the result.
      const ctx: PokerScoringContext = {
          chips, mult, handType: type, cards: scoringCards,
          handsPlayed: (4 - runState.handsRemaining) + 1,
          discardsUsed: (3 - runState.discardsRemaining),
          deckState: runState.deck,
          registerStep: (step) => steps.push({ ...step, id: `supp_${Math.random()}` })
      };
      
      runState.supporters.forEach(s => {
          if (s.triggerOn === 'HAND_PLAYED' || !s.triggerOn) {
              // We need to modify supporter definition to use registerStep if we want detailed animation,
              // OR we check the diff.
              // For minimal code change, let's wrap the effect.
              const prevC = ctx.chips;
              const prevM = ctx.mult;
              s.effect(ctx);
              
              if (ctx.chips > prevC) {
                  steps.push({ id: `s_c_${s.id}`, sourceName: s.name, type: 'SUPPORTER', operation: 'ADD_CHIPS', value: ctx.chips - prevC, triggerSupporterId: s.id });
              }
              if (ctx.mult > prevM) {
                  // Check if it was add or multiply. Simple heuristic for now.
                  // If it increased by integer amount likely add. 
                  // But pure x2 is possible.
                  // Let's assume ADD_MULT if small, MULT_MULT if large or explicit.
                  // Current supporters mostly Add or Multiply.
                  // Let's rely on the Supporter Logic update or basic diff.
                  // Simpler: Just show "Mult Up" with new val.
                  // Actually, to animate correctly we need the op.
                  // Let's check s.description for "X" vs "+"
                  if (s.description.includes('x') || s.description.includes('X')) {
                      steps.push({ id: `s_m_${s.id}`, sourceName: s.name, type: 'SUPPORTER', operation: 'MULT_MULT', value: ctx.mult / prevM, triggerSupporterId: s.id });
                  } else {
                      steps.push({ id: `s_m_${s.id}`, sourceName: s.name, type: 'SUPPORTER', operation: 'ADD_MULT', value: ctx.mult - prevM, triggerSupporterId: s.id });
                  }
              }
          }
      });

      // --- PREPARE NEXT STATE ---
      const totalScore = Math.floor(ctx.chips) * Math.floor(ctx.mult);
      const newScore = runState.currentScore + totalScore;
      
      let newHand = runState.hand.filter(c => !selectedCards.includes(c.id));
      let currentDeck = [...runState.deck];
      let newDiscardPile = [...runState.discardPile, ...playedCards];
      
      if (runState.currentBlind.bossAbility === 'THE_HOOK') {
          if (newHand.length > 0) {
              newHand.sort(() => Math.random() - 0.5);
              const hookDiscarded = newHand.splice(0, 2);
              newDiscardPile.push(...hookDiscarded);
          }
      }

      const handSizeLimit = runState.supporters.some(s => s.id === 'CLASS_REP') ? 9 : 8;
      const drawCount = handSizeLimit - newHand.length;
      if (drawCount > 0 && currentDeck.length > 0) {
          const drawn = currentDeck.splice(0, drawCount);
          newHand = [...newHand, ...drawn];
      }
      newHand.sort((a, b) => b.rank - a.rank);

      // --- START SCORING ---
      setPendingScoreUpdate({
          newScore,
          hand: newHand,
          deck: currentDeck,
          discard: newDiscardPile
      });
      setScoreSteps(steps);
      setIsScoring(true);
  };

  const handleScoreComplete = () => {
      if (!pendingScoreUpdate) return;

      setRunState(prev => ({
          ...prev,
          currentScore: pendingScoreUpdate.newScore,
          hand: pendingScoreUpdate.hand,
          deck: pendingScoreUpdate.deck,
          discardPile: pendingScoreUpdate.discard,
          handsRemaining: prev.handsRemaining - 1
      }));
      
      setIsScoring(false);
      setSelectedCards([]);
      setPendingScoreUpdate(null);
      setPrediction(null);

      // Check Win/Loss conditions
      if (pendingScoreUpdate.newScore >= runState.currentBlind.scoreGoal) {
          setTimeout(winBlind, 500); // Small delay before shop
      } else if (runState.handsRemaining - 1 <= 0) {
          setPhase('GAME_OVER');
          audioService.playSound('lose');
      }
  };

  const discardHand = () => {
      if (animating || isScoring || selectedCards.length === 0 || runState.discardsRemaining <= 0) return;
      
      const discardedCards = runState.hand.filter(c => selectedCards.includes(c.id));
      let newHand = runState.hand.filter(c => !selectedCards.includes(c.id));
      let currentDeck = [...runState.deck];
      let newDiscardPile = [...runState.discardPile, ...discardedCards];
      
      const handSizeLimit = runState.supporters.some(s => s.id === 'CLASS_REP') ? 9 : 8;
      const drawCount = handSizeLimit - newHand.length;
      if (drawCount > 0 && currentDeck.length > 0) {
          const drawn = currentDeck.splice(0, drawCount);
          newHand = [...newHand, ...drawn];
      }
      newHand.sort((a, b) => b.rank - a.rank);

      setRunState(prev => ({
          ...prev,
          hand: newHand,
          deck: currentDeck,
          discardPile: newDiscardPile,
          discardsRemaining: prev.discardsRemaining - 1
      }));
      setSelectedCards([]);
      audioService.playSound('select');
  };

  const winBlind = () => {
      const interest = Math.min(5, Math.floor(runState.money / 5));
      const handBonus = runState.handsRemaining;
      const totalEarned = runState.currentBlind.rewardMoney + interest + handBonus;
      
      const newMoney = runState.money + totalEarned;
      
      setRunState(prev => ({
          ...prev,
          money: newMoney,
          deck: [...prev.deck, ...prev.hand, ...prev.discardPile],
          hand: [],
          discardPile: []
      }));

      if (runState.ante === 8 && runState.blindIndex === 2) {
          setPhase('VICTORY');
      } else {
          generateShop();
          setPhase('SHOP');
          audioService.playBGM('poker_shop');
      }
  };

  // --- Shop Logic ---
  const generateShop = () => {
      const items: (PokerSupporter | PokerConsumable | PokerPack)[] = [];
      const supporters = [...SUPPORTERS_LIBRARY].sort(() => Math.random() - 0.5);
      items.push(supporters[0]);
      items.push(supporters[1]);
      const consumables = [...CONSUMABLES_LIBRARY].sort(() => Math.random() - 0.5);
      items.push(consumables[0]);
      const packs = [...PACK_LIBRARY].sort(() => Math.random() - 0.5);
      items.push(packs[0]);
      setRunState(prev => ({ ...prev, shopInventory: items }));
  };

  const buyItem = (item: PokerSupporter | PokerConsumable | PokerPack, index: number) => {
      if (runState.money < item.price) return;
      if ('size' in item) { 
          setRunState(prev => ({ ...prev, money: prev.money - item.price, shopInventory: prev.shopInventory.filter((_, i) => i !== index) }));
          openPack(item as PokerPack);
      } else if ('rarity' in item) { 
          if (runState.supporters.length >= 5) return;
          setRunState(prev => ({ ...prev, money: prev.money - item.price, supporters: [...prev.supporters, item as PokerSupporter], shopInventory: prev.shopInventory.filter((_, i) => i !== index) }));
      } else { 
          if (runState.consumables.length >= 2) return;
          setRunState(prev => ({ ...prev, money: prev.money - item.price, consumables: [...prev.consumables, item as PokerConsumable], shopInventory: prev.shopInventory.filter((_, i) => i !== index) }));
      }
      audioService.playSound('select');
  };

  const openPack = (pack: PokerPack) => {
      setCurrentPack(pack);
      setIsPackOpened(false);
      setPhase('PACK_OPEN');
      setPackContent([]);
  };

  const revealPack = () => {
      if (!currentPack) return;
      audioService.playSound('attack');
      setIsPackOpened(true);
      const content: (PokerCard | PokerSupporter | PokerConsumable)[] = [];
      for (let i = 0; i < currentPack.size; i++) {
          if (currentPack.type === 'STANDARD') content.push(generateRandomPlayingCard());
          else if (currentPack.type === 'BUFF') content.push(CONSUMABLES_LIBRARY.filter(c => c.type !== 'SPECTRAL')[Math.floor(Math.random() * 5)]); // simplified
          else if (currentPack.type === 'SUPPORTER') content.push(SUPPORTERS_LIBRARY[Math.floor(Math.random() * SUPPORTERS_LIBRARY.length)]);
          else if (currentPack.type === 'SPECTRAL') content.push(CONSUMABLES_LIBRARY.filter(c => c.type === 'SPECTRAL')[Math.floor(Math.random() * 5)]); // simplified
      }
      setPackContent(content);
  };

  const selectPackItem = (item: PokerCard | PokerSupporter | PokerConsumable) => {
      if ('suit' in item) { setRunState(prev => ({ ...prev, deck: [...prev.deck, item as PokerCard] })); } 
      else if ('rarity' in item) { if (runState.supporters.length >= 5) return; setRunState(prev => ({ ...prev, supporters: [...prev.supporters, item as PokerSupporter] })); } 
      else { if (runState.consumables.length >= 2) return; setRunState(prev => ({ ...prev, consumables: [...prev.consumables, item as PokerConsumable] })); }
      audioService.playSound('select');
      setPhase('SHOP'); setCurrentPack(null);
  };

  const nextBlind = () => {
      let nextIndex = runState.blindIndex + 1;
      let nextAnte = runState.ante;
      if (nextIndex > 2) { nextIndex = 0; nextAnte++; }
      setRunState(prev => ({ ...prev, ante: nextAnte, blindIndex: nextIndex, currentBlind: getBlindConfig(nextAnte, nextIndex) }));
      setPhase('BLIND_SELECT');
  };

  const useConsumable = (consumable: PokerConsumable) => {
      if (consumable.type === 'PLANET') {
          let targetHand = 'HIGH_CARD';
          if (consumable.id === 'TXT_MATH') targetHand = 'HIGH_CARD';
          else if (consumable.id === 'TXT_JPN') targetHand = 'PAIR';
          else if (consumable.id === 'TXT_SCI') targetHand = 'TWO_PAIR';
          else if (consumable.id === 'TXT_SOC') targetHand = 'THREE_OF_A_KIND';
          else if (consumable.id === 'TXT_ENG') targetHand = 'STRAIGHT';
          else if (consumable.id === 'TXT_ART') targetHand = 'FLUSH';
          else if (consumable.id === 'TXT_PE') targetHand = 'FULL_HOUSE';
          else if (consumable.id === 'TXT_MUS') targetHand = 'FOUR_OF_A_KIND';
          setRunState(prev => ({ ...prev, handLevels: { ...prev.handLevels, [targetHand]: prev.handLevels[targetHand] + 1 }, consumables: prev.consumables.filter(c => c !== consumable) }));
          audioService.playSound('win');
      } else { setSelectedConsumable(consumable); }
  };

  const applyModification = () => {
      if (!selectedConsumable || selectedCards.length === 0) return;
      if (phase !== 'PLAY') { alert("Use during play."); setSelectedConsumable(null); setSelectedCards([]); return; }
      let newHand = [...runState.hand];
      // Simplified modification logic for brevity
      setRunState(prev => ({ ...prev, hand: newHand, consumables: prev.consumables.filter(c => c !== selectedConsumable) }));
      setSelectedConsumable(null);
      setSelectedCards([]);
      audioService.playSound('win');
  };

  // --- Renders ---
  
  // Inspection Modal (unchanged logic)
  const renderInspectionModal = () => {
      if (!inspectedItem) return null;
      return (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setInspectedItem(null)}>
              <div className="bg-slate-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setInspectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={24}/></button>
                  <div className="flex flex-col items-center mb-4">
                      <div className="w-24 h-24 mb-4">
                          <PixelSprite seed={inspectedItem.icon} name={inspectedItem.icon} className="w-full h-full"/>
                      </div>
                      <h3 className="text-2xl font-bold text-yellow-400 mb-2">{inspectedItem.name}</h3>
                  </div>
                  <p className="text-lg text-gray-300 text-center leading-relaxed">{inspectedItem.description}</p>
              </div>
          </div>
      );
  };

  if (phase === 'BLIND_SELECT') {
      const config = runState.currentBlind;
      return (
          <div className="flex flex-col h-full w-full bg-slate-900 text-white p-8 items-center justify-center relative font-mono">
              <div className="absolute top-4 left-4">
                  <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center"><ArrowLeft className="mr-2"/> Quit</button>
              </div>
              <div className="text-center animate-in zoom-in duration-300">
                  <div className="text-2xl text-yellow-500 mb-2 font-bold">ANTE {runState.ante} / 8</div>
                  <div className="text-6xl font-black mb-4 text-white tracking-tighter">{config.name}</div>
                  <div className="bg-slate-800 p-6 rounded-xl border-4 border-slate-600 mb-8 min-w-[300px]">
                      <div className="text-gray-400 mb-2 text-sm uppercase tracking-widest">Score Goal</div>
                      <div className="text-5xl font-bold text-red-500 mb-4">{config.scoreGoal.toLocaleString()}</div>
                      <div className="text-gray-400 mb-2 text-sm uppercase tracking-widest">Reward</div>
                      <div className="text-3xl font-bold text-yellow-400 mb-2">${config.rewardMoney}</div>
                  </div>
                  <button onClick={startBlind} className="bg-red-600 hover:bg-red-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">START</button>
              </div>
          </div>
      );
  }

  if (phase === 'SHOP' || phase === 'PACK_OPEN') {
      if (phase === 'PACK_OPEN' && currentPack) {
          // Pack Open UI
          return (
              <div className="flex flex-col h-full w-full bg-slate-900 text-white p-4 items-center justify-center relative font-mono overflow-hidden">
                  <div className="absolute inset-0 z-0 bg-black/80"></div>
                  <div className="z-10 flex flex-col items-center w-full max-w-4xl">
                      <h2 className="text-3xl font-bold mb-8 text-yellow-400 animate-pulse">{isPackOpened ? "Choose One!" : "Open Pack!"}</h2>
                      {!isPackOpened ? (
                          <div className="cursor-pointer hover:scale-110 transition-transform animate-bounce relative" onClick={revealPack}>
                              <div className="w-48 h-64 rounded-lg border-4 border-yellow-300 bg-yellow-800 flex flex-col items-center justify-center p-4 text-center">
                                  <div className="text-6xl mb-4"><PixelSprite seed={currentPack.icon} name={currentPack.icon} className="w-24 h-24"/></div>
                                  <div className="text-2xl font-black text-white">{currentPack.name}</div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-wrap justify-center gap-6 animate-in zoom-in duration-500">
                              {packContent.map((item, idx) => (
                                  <div key={idx} className="relative cursor-pointer transition-transform hover:-translate-y-4 duration-300" onClick={() => selectPackItem(item)}>
                                      <div className="w-32 h-48 bg-slate-800 border-4 border-blue-400 rounded-lg flex flex-col items-center justify-center p-2 text-center text-white">
                                          {'suit' in item ? <div className="text-4xl">{getRankDisplay((item as PokerCard).rank)}{getSuitIcon((item as PokerCard).suit)}</div> : <PixelSprite seed={(item as any).icon} name={(item as any).icon} className="w-16 h-16 mb-2"/>}
                                          <div className="font-bold text-sm mt-2">{'name' in item ? (item as any).name : 'Card'}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          );
      }
      
      const shopSupporters = runState.shopInventory.filter(i => 'rarity' in i) as PokerSupporter[];
      const shopConsumables = runState.shopInventory.filter(i => !('rarity' in i) && !('size' in i)) as PokerConsumable[];
      const shopPacks = runState.shopInventory.filter(i => 'size' in i) as PokerPack[];

      return (
          <div className="flex flex-col h-full w-full bg-slate-900 text-white p-4 font-mono relative">
              {renderInspectionModal()}
              <div className="flex justify-between items-center mb-4 bg-slate-800 p-4 rounded-lg shadow-lg shrink-0">
                  <h2 className="text-2xl font-bold flex items-center"><ShoppingBag className="mr-2 text-yellow-500"/> School Store</h2>
                  <div className="text-2xl font-bold text-yellow-400">${runState.money}</div>
                  <button onClick={nextBlind} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold flex items-center">Next Round <ArrowLeft className="rotate-180 inline ml-1"/></button>
              </div>
              <div className="flex-grow flex gap-4 overflow-hidden">
                  <div className="w-2/3 bg-slate-800/50 p-4 rounded-lg border-2 border-slate-700 overflow-y-auto custom-scrollbar">
                      {/* Shop Grids */}
                      <div className="mb-8">
                          <h3 className="text-xl font-bold mb-4 text-orange-400 border-b border-slate-600 pb-2">Packs</h3>
                          <div className="grid grid-cols-3 gap-4">
                              {shopPacks.map(item => <div key={item.id} className="bg-slate-700 p-4 rounded text-center cursor-pointer hover:brightness-110" onClick={() => buyItem(item, runState.shopInventory.indexOf(item))}><div className="font-bold">{item.name}</div><div className="text-xs">{item.price} G</div></div>)}
                          </div>
                      </div>
                      <div className="mb-8">
                          <h3 className="text-xl font-bold mb-4 text-blue-300 border-b border-slate-600 pb-2">Supporters</h3>
                          <div className="grid grid-cols-3 gap-4">
                              {shopSupporters.map(item => <div key={item.id} className="bg-slate-700 p-4 rounded text-center cursor-pointer hover:bg-slate-600" onClick={() => buyItem(item, runState.shopInventory.indexOf(item))}><PixelSprite seed={item.icon} name={item.icon} className="w-12 h-12 mx-auto mb-2"/><div className="font-bold">{item.name}</div><div className="text-xs">{item.price} G</div></div>)}
                          </div>
                      </div>
                      <div>
                          <h3 className="text-xl font-bold mb-4 text-purple-300 border-b border-slate-600 pb-2">Stationery</h3>
                          <div className="grid grid-cols-3 gap-4">
                              {shopConsumables.map(item => <div key={item.id} className="bg-slate-700 p-4 rounded text-center cursor-pointer hover:bg-slate-600" onClick={() => buyItem(item, runState.shopInventory.indexOf(item))}><PixelSprite seed={item.icon} name={item.icon} className="w-12 h-12 mx-auto mb-2"/><div className="font-bold">{item.name}</div><div className="text-xs">{item.price} G</div></div>)}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (phase === 'GAME_OVER' || phase === 'VICTORY') {
      return (
          <div className="flex flex-col h-full w-full bg-black text-white items-center justify-center p-8 font-mono text-center">
              <div className={`text-6xl font-bold mb-4 ${phase === 'VICTORY' ? 'text-yellow-400' : 'text-red-500'}`}>{phase === 'VICTORY' ? 'GRADUATED!' : 'EXPELLED'}</div>
              <button onClick={onBack} className="bg-white text-black px-8 py-3 font-bold rounded hover:bg-gray-200">Return to Menu</button>
          </div>
      );
  }

  // 3. Play Screen
  return (
    <div className="flex flex-col h-full w-full bg-green-900 text-white font-mono relative overflow-hidden">
        {renderInspectionModal()}
        {isScoring && <ScoreAnimation steps={scoreSteps} onComplete={handleScoreComplete} />}
        
        {/* Top Info Bar */}
        <div className="flex justify-between items-start p-4 bg-black/60 z-20 shadow-md shrink-0">
            <div className="flex flex-col items-start bg-slate-800 p-2 rounded border border-slate-600 w-48 shadow-lg">
                <div className="text-[10px] text-red-400 font-bold uppercase">Score Goal</div>
                <div className="text-3xl font-black text-white">{runState.currentBlind.scoreGoal.toLocaleString()}</div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min(100, (runState.currentScore / runState.currentBlind.scoreGoal) * 100)}%` }}></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">Current: {runState.currentScore.toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
                <div className="bg-slate-800 p-2 rounded border border-blue-600 flex flex-col items-center w-20">
                    <div className="text-[10px] text-blue-400 uppercase">Hands</div>
                    <div className="text-lg font-bold text-blue-100">{runState.handsRemaining}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-red-900 flex flex-col items-center w-20">
                    <div className="text-[10px] text-red-400 uppercase">Disc</div>
                    <div className="text-lg font-bold text-red-100">{runState.discardsRemaining}</div>
                </div>
            </div>
        </div>

        {/* Item Shelf */}
        <div className="w-full bg-black/40 border-b border-black/50 p-2 flex justify-between items-center z-10 shrink-0 min-h-[64px]">
            <div className="flex gap-2 items-center flex-1 justify-center">
                {runState.supporters.map((s, i) => (
                    <div key={i} className="w-12 h-12 bg-slate-800 border-2 border-yellow-500 rounded flex items-center justify-center cursor-pointer hover:bg-slate-700" onContextMenu={(e) => handleContextMenu(e, s)} onTouchStart={() => handleTouchStart(s)} onTouchEnd={handleTouchEnd}>
                        <PixelSprite seed={s.icon} name={s.icon} className="w-8 h-8"/>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 items-center border-l border-white/20 pl-2">
                {runState.consumables.map((c, i) => (
                    <div key={i} className="w-12 h-12 bg-slate-800 border-2 border-purple-500 rounded flex items-center justify-center cursor-pointer hover:scale-110" onClick={() => useConsumable(c)} onContextMenu={(e) => handleContextMenu(e, c)} onTouchStart={() => handleTouchStart(c)} onTouchEnd={handleTouchEnd}>
                        <PixelSprite seed={c.icon} name={c.icon} className="w-8 h-8"/>
                        {selectedConsumable === c && <div className="absolute inset-0 bg-white/30 rounded animate-pulse"></div>}
                    </div>
                ))}
            </div>
        </div>

        {/* Play Area */}
        <div className="flex-grow flex flex-col items-center justify-center relative">
            {/* Hand Prediction */}
            {prediction && (
                <div className="absolute bottom-4 bg-black/80 border-2 border-blue-400 px-6 py-2 rounded-full text-center shadow-lg animate-in slide-in-from-bottom-2 fade-in z-30">
                    <div className="text-white font-bold text-lg">{prediction.name} <span className="text-sm font-normal text-blue-300">lvl.{prediction.level}</span></div>
                    <div className="flex items-center justify-center gap-2 text-xl font-black">
                        <span className="text-blue-400">{prediction.chips}</span>
                        <span className="text-gray-500 text-sm">X</span>
                        <span className="text-red-500">{prediction.mult}</span>
                    </div>
                </div>
            )}
        </div>

        {/* Hand Area */}
        <div 
            className="h-40 md:h-56 w-full flex justify-center items-end pb-4 gap-[-20px] touch-none select-none shrink-0"
            onPointerLeave={handlePointerUp} onPointerUp={handlePointerUp} onPointerMove={handlePointerMove}
        >
            {runState.hand.map((card) => {
                const isSelected = selectedCards.includes(card.id);
                return (
                    <div 
                        key={card.id} data-card-id={card.id} onPointerDown={(e) => handlePointerDown(e, card.id)}
                        className={`w-20 h-32 md:w-28 md:h-40 bg-gray-100 rounded-lg border-2 shadow-xl flex flex-col items-center justify-between p-2 cursor-pointer transition-transform duration-200 -ml-4 first:ml-0 relative ${isSelected ? '-translate-y-6 z-20 border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-400 hover:-translate-y-2 z-10'}`}
                    >
                        {card.bonusChips > 0 && <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-30 border border-white">+{card.bonusChips}</div>}
                        <div className="flex justify-between w-full"><div className={`text-xl md:text-2xl font-bold ${['HEART', 'DIAMOND'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>{getRankDisplay(card.rank)}</div></div>
                        <div className="scale-150">{getSuitIcon(card.suit)}</div>
                        <div className="self-end rotate-180 text-xl md:text-2xl font-bold opacity-30">{getRankDisplay(card.rank)}</div>
                    </div>
                );
            })}
        </div>

        {/* Controls */}
        <div className="bg-slate-800 p-2 md:p-4 flex justify-center gap-4 z-20 shadow-up shrink-0">
            <button onClick={playHand} disabled={animating || isScoring || selectedCards.length === 0} className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold py-2 px-8 rounded-lg text-lg md:text-xl shadow-lg border-b-4 border-orange-800 active:border-0 active:translate-y-1 transition-all">PLAY HAND</button>
            <button onClick={discardHand} disabled={animating || isScoring || selectedCards.length === 0 || runState.discardsRemaining <= 0} className="bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg text-sm md:text-base shadow-lg border-b-4 border-red-900 active:border-0 active:translate-y-1 transition-all">DISCARD</button>
            <button onClick={sortHandRank} className="bg-slate-600 px-4 rounded text-xs border border-slate-500">Rank</button>
            <button onClick={sortHandSuit} className="bg-slate-600 px-4 rounded text-xs border border-slate-500">Suit</button>
        </div>
    </div>
  );
};

export default PokerGameScreen;
