
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Club, Diamond, Heart, Spade, ShoppingBag, BarChart3, ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutList, Layers, HelpCircle, BookOpen, Flag, Calculator, ArrowRight, Sparkles, Package, Ghost } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';
import { 
    PokerCard, PokerRunState, PokerBlind, PokerSupporter, PokerConsumable, PokerSuit, PokerRank, PokerScoringContext, PokerPack
} from '../types';
import { POKER_HAND_LEVELS, SUPPORTERS_LIBRARY, CONSUMABLES_LIBRARY, PACK_LIBRARY } from '../constants';

// --- Constants & Helpers ---
const SUITS: PokerSuit[] = ['SPADE', 'HEART', 'DIAMOND', 'CLUB'];
const RANKS: PokerRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// --- HAND EXAMPLES FOR RULES ---
const HAND_EXAMPLES: Record<string, { desc: string, cards: {r: string, s: PokerSuit}[] }> = {
    'HIGH_CARD': {
        desc: '役が何もない状態。一番強いカードで勝負。',
        cards: [{r:'A',s:'SPADE'}, {r:'10',s:'HEART'}, {r:'7',s:'CLUB'}, {r:'4',s:'DIAMOND'}, {r:'2',s:'SPADE'}]
    },
    'PAIR': {
        desc: '同じ数字のカードが2枚ある状態。',
        cards: [{r:'8',s:'SPADE'}, {r:'8',s:'HEART'}, {r:'K',s:'CLUB'}, {r:'9',s:'DIAMOND'}, {r:'3',s:'SPADE'}]
    },
    'TWO_PAIR': {
        desc: 'ワンペアが2組ある状態。',
        cards: [{r:'J',s:'SPADE'}, {r:'J',s:'HEART'}, {r:'5',s:'CLUB'}, {r:'5',s:'DIAMOND'}, {r:'A',s:'SPADE'}]
    },
    'THREE_OF_A_KIND': {
        desc: '同じ数字のカードが3枚ある状態。',
        cards: [{r:'7',s:'SPADE'}, {r:'7',s:'HEART'}, {r:'7',s:'CLUB'}, {r:'K',s:'DIAMOND'}, {r:'2',s:'SPADE'}]
    },
    'STRAIGHT': {
        desc: 'マークに関係なく、数字が5枚連続している状態。(Aは2ともKとも繋がります)',
        cards: [{r:'5',s:'SPADE'}, {r:'6',s:'HEART'}, {r:'7',s:'CLUB'}, {r:'8',s:'DIAMOND'}, {r:'9',s:'SPADE'}]
    },
    'FLUSH': {
        desc: '数字に関係なく、同じマークが5枚揃った状態。',
        cards: [{r:'2',s:'HEART'}, {r:'5',s:'HEART'}, {r:'9',s:'HEART'}, {r:'J',s:'HEART'}, {r:'A',s:'HEART'}]
    },
    'FULL_HOUSE': {
        desc: 'スリーカードとワンペアの組み合わせ。',
        cards: [{r:'Q',s:'SPADE'}, {r:'Q',s:'HEART'}, {r:'Q',s:'CLUB'}, {r:'9',s:'DIAMOND'}, {r:'9',s:'SPADE'}]
    },
    'FOUR_OF_A_KIND': {
        desc: '同じ数字のカードが4枚ある状態。',
        cards: [{r:'3',s:'SPADE'}, {r:'3',s:'HEART'}, {r:'3',s:'CLUB'}, {r:'3',s:'DIAMOND'}, {r:'K',s:'SPADE'}]
    },
    'STRAIGHT_FLUSH': {
        desc: '同じマークで、かつ数字が連続している状態。',
        cards: [{r:'8',s:'CLUB'}, {r:'9',s:'CLUB'}, {r:'10',s:'CLUB'}, {r:'J',s:'CLUB'}, {r:'Q',s:'CLUB'}]
    },
    'ROYAL_FLUSH': {
        desc: '同じマークの 10, J, Q, K, A の組み合わせ。最強。',
        cards: [{r:'10',s:'SPADE'}, {r:'J',s:'SPADE'}, {r:'Q',s:'SPADE'}, {r:'K',s:'SPADE'}, {r:'A',s:'SPADE'}]
    }
};

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

const getSuitColorClass = (suit: PokerSuit) => {
    switch(suit) {
        case 'SPADE': return 'text-blue-900';
        case 'HEART': return 'text-red-600';
        case 'DIAMOND': return 'text-orange-500';
        case 'CLUB': return 'text-green-800';
    }
}

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
  const [lastHandScore, setLastHandScore] = useState<{chips: number, mult: number, total: number, name: string} | null>(null);
  const [animating, setAnimating] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showHandList, setShowHandList] = useState(false);
  const [showDeckList, setShowDeckList] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  
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
      audioService.playBGM('poker_shop'); // Chill start
  };

  const startBlind = () => {
      // Draw initial hand
      const deck = [...runState.deck].sort(() => Math.random() - 0.5);
      const hand = deck.splice(0, 8);
      // Initial Sort (Rank Desc)
      hand.sort((a, b) => b.rank - a.rank);
      
      setRunState(prev => ({
          ...prev,
          deck, // Remaining deck
          hand,
          discardPile: [],
          currentScore: 0,
          handsRemaining: prev.currentBlind.bossAbility === 'THE_NEEDLE' ? 1 : 4,
          discardsRemaining: 3
      }));
      setPhase('PLAY');
      audioService.playBGM('poker_play'); // Swing Play
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

  // --- Play Logic ---
  const toggleSelect = (id: string) => {
      if (animating) return;
      
      if (selectedCards.includes(id)) {
          setSelectedCards(prev => prev.filter(c => c !== id));
      } else {
          if (selectedCards.length < 5) {
              setSelectedCards(prev => [...prev, id]);
              audioService.playSound('select');
          }
      }
  };

  // --- Swipe / Drag Handlers ---
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
      e.preventDefault(); // Prevent text selection etc.
      isDraggingRef.current = true;
      lastProcessedCardIdRef.current = id;
      toggleSelect(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      // Find element under cursor/touch
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

  const playHand = async () => {
      if (animating || selectedCards.length === 0 || runState.handsRemaining <= 0) return;
      
      const playedCards = runState.hand.filter(c => selectedCards.includes(c.id));
      const { type, cards: scoringCards } = getHandResult(playedCards);
      
      const level = runState.handLevels[type] || 1;
      const baseStats = POKER_HAND_LEVELS[type];
      
      // Calculate Base from Level
      let chips = baseStats.baseChips + (level - 1) * 10; // Simple scaling
      let mult = baseStats.baseMult + (level - 1) * 1;

      // Card Scoring
      scoringCards.forEach(c => {
          let val = c.rank;
          if (val > 10 && val < 14) val = 10;
          if (val === 14) val = 11;
          chips += val + c.bonusChips;
          mult += (c.multMultiplier - 1); // e.g. 1.5 -> add 0.5
      });

      // Supporter Effects
      const ctx: PokerScoringContext = {
          chips, mult, handType: type, cards: scoringCards,
          handsPlayed: (4 - runState.handsRemaining) + 1,
          discardsUsed: (3 - runState.discardsRemaining),
          deckState: runState.deck
      };
      
      runState.supporters.forEach(s => {
          if (s.triggerOn === 'HAND_PLAYED' || !s.triggerOn) s.effect(ctx);
      });

      chips = Math.floor(ctx.chips);
      mult = Math.floor(ctx.mult);
      const score = chips * mult;

      setLastHandScore({ chips, mult, total: score, name: baseStats.name });
      setAnimating(true);
      audioService.playSound('attack');

      await new Promise(r => setTimeout(r, 1500)); // Animation

      const newScore = runState.currentScore + score;
      
      // Move played cards to discardPile
      let newHand = runState.hand.filter(c => !selectedCards.includes(c.id));
      let currentDeck = [...runState.deck];
      let newDiscardPile = [...runState.discardPile, ...playedCards];
      
      // Boss: The Hook (Discard random)
      if (runState.currentBlind.bossAbility === 'THE_HOOK') {
          if (newHand.length > 0) {
              newHand.sort(() => Math.random() - 0.5);
              const hookDiscarded = newHand.splice(0, 2);
              newDiscardPile.push(...hookDiscarded);
          }
      }

      // Draw
      const handSizeLimit = runState.supporters.some(s => s.id === 'CLASS_REP') ? 9 : 8;
      const drawCount = handSizeLimit - newHand.length;
      if (drawCount > 0 && currentDeck.length > 0) {
          const drawn = currentDeck.splice(0, drawCount);
          newHand = [...newHand, ...drawn];
      }
      // Auto sort drawn cards
      newHand.sort((a, b) => b.rank - a.rank);

      setRunState(prev => ({
          ...prev,
          currentScore: newScore,
          hand: newHand,
          deck: currentDeck,
          discardPile: newDiscardPile,
          handsRemaining: prev.handsRemaining - 1
      }));
      setSelectedCards([]);
      setAnimating(false);

      if (newScore >= runState.currentBlind.scoreGoal) {
          // Win
          audioService.playSound('win');
          await new Promise(r => setTimeout(r, 1000));
          winBlind();
      } else if (runState.handsRemaining - 1 <= 0) {
          // Lose
          audioService.playSound('lose');
          setPhase('GAME_OVER');
      }
  };

  const discardHand = () => {
      if (animating || selectedCards.length === 0 || runState.discardsRemaining <= 0) return;
      
      // Delinquent Supporter Check
      const delinquent = runState.supporters.find(s => s.id === 'DELINQUENT');
      // Note: Delinquent effect is actually triggered here but applied next hand? 
      // The constant definition applies it on 'DISCARD' trigger, but we need a way to store "temp mult" if it applies to next hand.
      // For now, let's assume it just works if we had a persistent multiplier context, but simplified: 
      // The definition says "ctx.mult += ...". This context is transient.
      // Real Balatro adds a persistent "plus mult" to the joker itself. 
      // Simplified: Just sound effect here.
      
      const discardedCards = runState.hand.filter(c => selectedCards.includes(c.id));
      let newHand = runState.hand.filter(c => !selectedCards.includes(c.id));
      let currentDeck = [...runState.deck];
      let newDiscardPile = [...runState.discardPile, ...discardedCards];
      
      // Draw
      const handSizeLimit = runState.supporters.some(s => s.id === 'CLASS_REP') ? 9 : 8;
      const drawCount = handSizeLimit - newHand.length;
      if (drawCount > 0 && currentDeck.length > 0) {
          const drawn = currentDeck.splice(0, drawCount);
          newHand = [...newHand, ...drawn];
      }
      // Auto sort
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
      
      // 2 Supporters
      const supporters = [...SUPPORTERS_LIBRARY].sort(() => Math.random() - 0.5);
      items.push(supporters[0]);
      items.push(supporters[1]);

      // 1 Consumable
      const consumables = [...CONSUMABLES_LIBRARY].sort(() => Math.random() - 0.5);
      items.push(consumables[0]);

      // 1 Pack
      const packs = [...PACK_LIBRARY].sort(() => Math.random() - 0.5);
      items.push(packs[0]);

      setRunState(prev => ({ ...prev, shopInventory: items }));
  };

  const buyItem = (item: PokerSupporter | PokerConsumable | PokerPack, index: number) => {
      if (runState.money < item.price) return;
      
      if ('size' in item) { // Is Pack
          setRunState(prev => ({
              ...prev,
              money: prev.money - item.price,
              shopInventory: prev.shopInventory.filter((_, i) => i !== index)
          }));
          openPack(item as PokerPack);
      } else if ('rarity' in item) { // Is Supporter
          if (runState.supporters.length >= 5) return;
          setRunState(prev => ({
              ...prev,
              money: prev.money - item.price,
              supporters: [...prev.supporters, item as PokerSupporter],
              shopInventory: prev.shopInventory.filter((_, i) => i !== index)
          }));
      } else { // Is Consumable
          if (runState.consumables.length >= 2) return;
          setRunState(prev => ({
              ...prev,
              money: prev.money - item.price,
              consumables: [...prev.consumables, item as PokerConsumable],
              shopInventory: prev.shopInventory.filter((_, i) => i !== index)
          }));
      }
      audioService.playSound('select');
  };

  // --- Pack Logic ---
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
          if (currentPack.type === 'STANDARD') {
              content.push(generateRandomPlayingCard());
          } else if (currentPack.type === 'BUFF') {
              const pool = CONSUMABLES_LIBRARY.filter(c => c.type !== 'SPECTRAL'); // Normal packs don't have spectral usually
              content.push(pool[Math.floor(Math.random() * pool.length)]);
          } else if (currentPack.type === 'SUPPORTER') {
              const pool = [...SUPPORTERS_LIBRARY];
              content.push(pool[Math.floor(Math.random() * pool.length)]);
          } else if (currentPack.type === 'SPECTRAL') {
              const pool = CONSUMABLES_LIBRARY.filter(c => c.type === 'SPECTRAL');
              content.push(pool[Math.floor(Math.random() * pool.length)]);
          }
      }
      setPackContent(content);
  };

  const selectPackItem = (item: PokerCard | PokerSupporter | PokerConsumable) => {
      if ('suit' in item) {
          setRunState(prev => ({
              ...prev,
              deck: [...prev.deck, item as PokerCard]
          }));
      } else if ('rarity' in item) {
          if (runState.supporters.length >= 5) return;
          setRunState(prev => ({
              ...prev,
              supporters: [...prev.supporters, item as PokerSupporter]
          }));
      } else { // Consumable
          // Immediate use for Spectral? No, adds to inventory usually unless immediate use.
          // Spectral cards behave like Consumables in Balatro, they take up a consumable slot.
          if (runState.consumables.length >= 2) return;
          setRunState(prev => ({
              ...prev,
              consumables: [...prev.consumables, item as PokerConsumable]
          }));
      }
      
      audioService.playSound('select');
      setPhase('SHOP'); 
      setCurrentPack(null);
  };

  const nextBlind = () => {
      let nextIndex = runState.blindIndex + 1;
      let nextAnte = runState.ante;
      if (nextIndex > 2) {
          nextIndex = 0;
          nextAnte++;
      }
      
      setRunState(prev => ({
          ...prev,
          ante: nextAnte,
          blindIndex: nextIndex,
          currentBlind: getBlindConfig(nextAnte, nextIndex)
      }));
      setPhase('BLIND_SELECT');
  };

  // --- Consumable Logic ---
  const useConsumable = (consumable: PokerConsumable) => {
      if (consumable.type === 'PLANET') {
          // Upgrade Hand
          let targetHand = 'HIGH_CARD';
          if (consumable.id === 'TXT_MATH') targetHand = 'HIGH_CARD';
          else if (consumable.id === 'TXT_JPN') targetHand = 'PAIR';
          else if (consumable.id === 'TXT_SCI') targetHand = 'TWO_PAIR';
          else if (consumable.id === 'TXT_SOC') targetHand = 'THREE_OF_A_KIND';
          else if (consumable.id === 'TXT_ENG') targetHand = 'STRAIGHT';
          else if (consumable.id === 'TXT_ART') targetHand = 'FLUSH';
          else if (consumable.id === 'TXT_PE') targetHand = 'FULL_HOUSE';
          else if (consumable.id === 'TXT_MUS') targetHand = 'FOUR_OF_A_KIND';

          setRunState(prev => ({
              ...prev,
              handLevels: { ...prev.handLevels, [targetHand]: prev.handLevels[targetHand] + 1 },
              consumables: prev.consumables.filter(c => c !== consumable)
          }));
          audioService.playSound('win');
      } else if (consumable.type === 'TAROT' || consumable.type === 'SPECTRAL') {
          // Select cards mode
          // Some Spectral might not need selection, but most do (destroy random, create copy of selected)
          if (consumable.id === 'SPC_PIANO') {
              // Immediate Effect: Convert all hand to clubs
              // Only works in play? Or just applies to cards in hand?
              // Assuming consumables are used during play or blind select on "deck"? 
              // Standard Balatro allows using them anytime. If used in shop, it applies to "currently selected cards"? 
              // Actually Balatro consumables in shop apply to selected cards from deck view or are immediate.
              // Here, let's restrict usage to PLAY phase for simplicity, OR if we want shop usage, we need a deck view for selection.
              // For now, let's assume usage in PLAY phase on current HAND.
              if (phase !== 'PLAY') {
                  // If in shop, we can't easily select cards yet without adding complex UI.
                  // Let's restrict usage to PLAY phase for now.
                  alert("Can only use during play in this version.");
                  return;
              }
              
              const newHand = runState.hand.map(c => ({ ...c, suit: 'CLUB' as PokerSuit }));
              setRunState(prev => ({ ...prev, hand: newHand, consumables: prev.consumables.filter(c => c !== consumable) }));
              audioService.playSound('win');
          } else if (consumable.id === 'SPC_ANATOMY') {
              // Destroy non-face cards
              if (phase !== 'PLAY') { alert("Use during play."); return; }
              const newHand = runState.hand.filter(c => c.rank > 10);
              const removedCount = runState.hand.length - newHand.length;
              if (removedCount > 0) {
                  setRunState(prev => ({ ...prev, hand: newHand, money: prev.money + 15, consumables: prev.consumables.filter(c => c !== consumable) }));
                  audioService.playSound('attack');
              }
          } else if (consumable.id === 'SPC_STEPS') {
              // Upgrade random hand
              const hands = Object.keys(POKER_HAND_LEVELS);
              const target = hands[Math.floor(Math.random() * hands.length)];
              setRunState(prev => ({
                  ...prev,
                  handLevels: { ...prev.handLevels, [target]: prev.handLevels[target] + 3 },
                  consumables: prev.consumables.filter(c => c !== consumable)
              }));
              audioService.playSound('win');
          } else if (consumable.id === 'SPC_HANAKO') {
              // Destroy 1 random, Seal 1 random
              if (phase !== 'PLAY') { alert("Use during play."); return; }
              if (runState.hand.length < 1) return;
              
              let hand = [...runState.hand];
              // Destroy
              hand.splice(Math.floor(Math.random() * hand.length), 1);
              
              // Seal
              if (hand.length > 0) {
                  const targetIdx = Math.floor(Math.random() * hand.length);
                  hand[targetIdx] = { ...hand[targetIdx], enhancement: 'LUCKY' }; // Using Lucky as placeholder for Red Seal functionality visual
              }
              setRunState(prev => ({ ...prev, hand, consumables: prev.consumables.filter(c => c !== consumable) }));
              audioService.playSound('attack');
          } else {
              // Requires Selection
              setSelectedConsumable(consumable);
          }
      }
  };

  const applyModification = () => {
      if (!selectedConsumable || selectedCards.length === 0) return;
      if (phase !== 'PLAY') { alert("Use during play."); setSelectedConsumable(null); setSelectedCards([]); return; }

      let newHand = [...runState.hand];
      let newConsumables = runState.consumables.filter(c => c !== selectedConsumable);
      let consumed = true;

      // TAROT Logic
      if (selectedConsumable.type === 'TAROT') {
          newHand = newHand.map(c => {
              if (!selectedCards.includes(c.id)) return c;
              let mod = { ...c };
              if (selectedConsumable.id === 'STA_RULER') mod.rank = Math.min(14, mod.rank + 1) as PokerRank;
              if (selectedConsumable.id === 'STA_STICKER') { mod.bonusChips += 50; mod.enhancement = 'BONUS'; }
              if (selectedConsumable.id === 'STA_MARKER') { mod.multMultiplier = 1.5; mod.enhancement = 'MULT'; }
              if (selectedConsumable.id === 'STA_PAINT') { mod.suit = 'HEART'; mod.enhancement = 'WILD'; }
              if (selectedConsumable.id === 'STA_INK') { mod.suit = 'SPADE'; mod.enhancement = 'WILD'; }
              return mod;
          });

          if (selectedConsumable.id === 'STA_ERASER') {
              newHand = newHand.filter(c => !selectedCards.includes(c.id));
          }
      } 
      // SPECTRAL Logic (Selection based)
      else if (selectedConsumable.type === 'SPECTRAL') {
          if (selectedConsumable.id === 'SPC_MIRROR') {
              // Duplicate selected (limit 1)
              const target = newHand.find(c => c.id === selectedCards[0]);
              if (target) {
                  const copy = { ...target, id: `copy-${Date.now()}-${Math.random()}` };
                  newHand.push(copy);
              }
          }
      }

      setRunState(prev => ({ ...prev, hand: newHand, consumables: newConsumables }));
      setSelectedConsumable(null);
      setSelectedCards([]);
      audioService.playSound('win');
  };

  // --- Renders ---

  // Inspection Modal
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
                      <div className={`text-sm font-bold text-white px-3 py-1 rounded-full ${
                          (inspectedItem as PokerConsumable).type === 'SPECTRAL' ? 'bg-purple-900 border border-purple-500' : 'bg-slate-700'
                      }`}>
                          {'rarity' in inspectedItem ? (inspectedItem as PokerSupporter).rarity : (inspectedItem as PokerConsumable).type}
                      </div>
                  </div>
                  <p className="text-lg text-gray-300 text-center leading-relaxed">
                      {inspectedItem.description}
                  </p>
                  <div className="mt-6 text-center text-yellow-500 font-bold text-xl">
                      ${inspectedItem.price}
                  </div>
              </div>
          </div>
      );
  };

  // 1. Blind Select Screen (Omitted for brevity, same as before)
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
                      {config.description && <div className="text-purple-300 text-sm mt-4 border-t border-slate-600 pt-2">{config.description}</div>}
                  </div>
                  <button onClick={startBlind} className="bg-red-600 hover:bg-red-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
                      START
                  </button>
              </div>
          </div>
      );
  }

  // 2. Shop & Pack Open Screen
  if (phase === 'SHOP' || phase === 'PACK_OPEN') {
      // Pack Open Overlay
      if (phase === 'PACK_OPEN' && currentPack) {
          const isSpectralPack = currentPack.type === 'SPECTRAL';
          return (
              <div className="flex flex-col h-full w-full bg-slate-900 text-white p-4 items-center justify-center relative font-mono overflow-hidden">
                  <div className={`absolute inset-0 z-0 ${isSpectralPack ? 'bg-purple-900/90' : 'bg-black/80'}`}></div>
                  
                  <div className="z-10 flex flex-col items-center w-full max-w-4xl">
                      <h2 className="text-3xl font-bold mb-8 text-yellow-400 animate-pulse">{isPackOpened ? "Choose One!" : "Open Pack!"}</h2>
                      
                      {!isPackOpened ? (
                          <div 
                            className="cursor-pointer hover:scale-110 transition-transform animate-bounce relative"
                            onClick={revealPack}
                          >
                              <div className={`w-48 h-64 rounded-lg border-4 shadow-[0_0_50px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center p-4 text-center ${isSpectralPack ? 'bg-gradient-to-br from-indigo-900 to-black border-purple-400 shadow-purple-500/50' : 'bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-300 shadow-yellow-500/50'}`}>
                                  <div className="text-6xl mb-4">
                                      <PixelSprite seed={currentPack.icon} name={currentPack.icon} className="w-24 h-24"/>
                                  </div>
                                  <div className="text-2xl font-black text-white drop-shadow-md">{currentPack.name}</div>
                                  <div className="text-sm text-yellow-200 mt-2">{currentPack.description}</div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-wrap justify-center gap-6 animate-in zoom-in duration-500">
                              {packContent.map((item, idx) => {
                                  const isCard = 'suit' in item;
                                  const isSupporter = 'rarity' in item;
                                  const isConsumable = !isCard && !isSupporter;
                                  const isSpectral = isConsumable && (item as PokerConsumable).type === 'SPECTRAL';
                                  
                                  let disabled = false;
                                  if (isSupporter && runState.supporters.length >= 5) disabled = true;
                                  if (isConsumable && runState.consumables.length >= 2) disabled = true;

                                  return (
                                      <div 
                                        key={idx} 
                                        className={`
                                            relative cursor-pointer transition-transform hover:-translate-y-4 duration-300
                                            ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                                        `}
                                        onClick={() => !disabled && selectPackItem(item)}
                                        style={{ transitionDelay: `${idx * 100}ms` }}
                                      >
                                          {isCard && (
                                              <div className="w-32 h-48 bg-white text-black rounded-lg border-4 border-slate-300 shadow-xl flex flex-col items-center justify-between p-2">
                                                  <div className={`text-2xl font-bold w-full text-left ${['HEART', 'DIAMOND'].includes((item as PokerCard).suit) ? 'text-red-600' : 'text-black'}`}>
                                                      {getRankDisplay((item as PokerCard).rank)}
                                                  </div>
                                                  <div className="scale-150">{getSuitIcon((item as PokerCard).suit)}</div>
                                                  <div className="text-xs text-center font-bold text-gray-500">
                                                      {(item as PokerCard).enhancement || ''}
                                                  </div>
                                                  <div className={`text-2xl font-bold w-full text-right rotate-180 ${['HEART', 'DIAMOND'].includes((item as PokerCard).suit) ? 'text-red-600' : 'text-black'}`}>
                                                      {getRankDisplay((item as PokerCard).rank)}
                                                  </div>
                                              </div>
                                          )}
                                          {!isCard && (
                                              <div className={`w-32 h-48 rounded-lg border-4 shadow-xl flex flex-col items-center justify-center p-2 text-center ${isSpectral ? 'bg-indigo-950 border-purple-400 text-purple-100' : 'bg-slate-800 border-blue-400 text-white'}`}>
                                                  <PixelSprite seed={(item as any).icon} name={(item as any).icon} className="w-16 h-16 mb-2"/>
                                                  <div className="font-bold text-sm">{(item as any).name}</div>
                                                  <div className="text-[10px] opacity-70 mt-2 leading-tight">{(item as any).description}</div>
                                              </div>
                                          )}
                                          <button 
                                            className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-lg ${disabled ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 text-white animate-pulse'}`}
                                          >
                                              {disabled ? 'FULL' : 'SELECT'}
                                          </button>
                                      </div>
                                  );
                              })}
                          </div>
                      )}

                      <button 
                        onClick={() => { setPhase('SHOP'); setCurrentPack(null); }}
                        className="mt-12 text-gray-400 hover:text-white border-b border-transparent hover:border-white transition-colors"
                      >
                          Skip
                      </button>
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
                  <button onClick={nextBlind} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold flex items-center">
                      Next Round <ArrowLeft className="rotate-180 inline ml-1"/>
                  </button>
              </div>

              <div className="flex-grow flex gap-4 overflow-hidden">
                  <div className="w-2/3 bg-slate-800/50 p-4 rounded-lg border-2 border-slate-700 overflow-y-auto custom-scrollbar">
                      
                      {/* Packs Section */}
                      <div className="mb-8">
                          <h3 className="text-xl font-bold mb-4 text-orange-400 border-b border-slate-600 pb-2 flex items-center">
                              <Package className="mr-2"/> Packs
                          </h3>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                              {shopPacks.map((item) => (
                                  <div 
                                    key={item.id} 
                                    className={`p-4 rounded flex flex-col items-center text-center relative group cursor-pointer hover:brightness-110 transition-all ${item.type === 'SPECTRAL' ? 'bg-indigo-900/80 border border-purple-500' : 'bg-slate-700'}`}
                                    onClick={() => buyItem(item, runState.shopInventory.indexOf(item))}
                                  >
                                      <div className="w-16 h-16 mb-2">
                                          <PixelSprite seed={item.icon} name={item.icon} className="w-full h-full"/>
                                      </div>
                                      <div className={`font-bold text-sm mb-1 ${item.type === 'SPECTRAL' ? 'text-purple-200' : 'text-white'}`}>{item.name}</div>
                                      <div className="text-xs text-gray-400 mb-2 h-8 overflow-hidden">{item.description}</div>
                                      <div className="mt-auto w-full">
                                          <button 
                                            disabled={runState.money < item.price}
                                            className={`w-full py-1 rounded font-bold text-sm ${runState.money >= item.price ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-600 cursor-not-allowed'}`}
                                          >
                                              ${item.price} OPEN
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              {shopPacks.length === 0 && <div className="text-gray-500 italic">No Packs Available</div>}
                          </div>
                      </div>

                      {/* Supporters Section */}
                      <div className="mb-8">
                          <h3 className="text-xl font-bold mb-4 text-blue-300 border-b border-slate-600 pb-2 flex items-center">
                              <PixelSprite seed="SMILE" name="SMILE" className="w-6 h-6 mr-2" />
                              Supporters
                          </h3>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                              {shopSupporters.map((item) => (
                                  <div 
                                    key={item.id} 
                                    className="bg-slate-700 p-4 rounded flex flex-col items-center text-center relative group cursor-pointer hover:bg-slate-600 transition-colors"
                                    onClick={() => buyItem(item, runState.shopInventory.indexOf(item))}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                    onTouchStart={() => handleTouchStart(item)}
                                    onTouchEnd={handleTouchEnd}
                                  >
                                      <div className="w-16 h-16 mb-2">
                                          <PixelSprite seed={item.icon} name={item.icon} className="w-full h-full"/>
                                      </div>
                                      <div className="font-bold text-sm mb-1">{item.name}</div>
                                      <div className="text-xs text-gray-400 mb-2 h-8 overflow-hidden">{item.description}</div>
                                      <div className="mt-auto w-full">
                                          <button 
                                            disabled={runState.money < item.price}
                                            className={`w-full py-1 rounded font-bold text-sm ${runState.money >= item.price ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 cursor-not-allowed'}`}
                                          >
                                              ${item.price} BUY
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              {shopSupporters.length === 0 && <div className="text-gray-500 italic">Sold Out</div>}
                          </div>
                      </div>

                      {/* Consumables Section */}
                      <div>
                          <h3 className="text-xl font-bold mb-4 text-purple-300 border-b border-slate-600 pb-2 flex items-center">
                              <PixelSprite seed="NOTEBOOK" name="NOTEBOOK" className="w-6 h-6 mr-2" />
                              Stationery
                          </h3>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                              {shopConsumables.map((item) => (
                                  <div 
                                    key={item.id} 
                                    className="bg-slate-700 p-4 rounded flex flex-col items-center text-center relative group cursor-pointer hover:bg-slate-600 transition-colors"
                                    onClick={() => buyItem(item, runState.shopInventory.indexOf(item))}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                    onTouchStart={() => handleTouchStart(item)}
                                    onTouchEnd={handleTouchEnd}
                                  >
                                      <div className="w-16 h-16 mb-2">
                                          <PixelSprite seed={item.icon} name={item.icon} className="w-full h-full"/>
                                      </div>
                                      <div className="font-bold text-sm mb-1">{item.name}</div>
                                      <div className="text-xs text-gray-400 mb-2 h-8 overflow-hidden">{item.description}</div>
                                      <div className="mt-auto w-full">
                                          <button 
                                            disabled={runState.money < item.price}
                                            className={`w-full py-1 rounded font-bold text-sm ${runState.money >= item.price ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 cursor-not-allowed'}`}
                                          >
                                              ${item.price} BUY
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              {shopConsumables.length === 0 && <div className="text-gray-500 italic">Sold Out</div>}
                          </div>
                      </div>

                  </div>

                  <div className="w-1/3 flex flex-col gap-4">
                      {/* Inventory */}
                      <div className="bg-slate-800 p-4 rounded-lg border-2 border-slate-700 flex-1">
                          <h3 className="text-lg font-bold mb-2 text-yellow-300">Inventory</h3>
                          <div className="mb-4">
                              <div className="text-xs text-gray-400 mb-1">Supporters ({runState.supporters.length}/5)</div>
                              <div className="grid grid-cols-2 gap-2">
                                  {runState.supporters.map((s, i) => (
                                      <div 
                                        key={i} 
                                        className="bg-slate-900 p-2 rounded flex flex-col items-center text-xs cursor-pointer hover:bg-slate-700"
                                        onContextMenu={(e) => handleContextMenu(e, s)}
                                        onTouchStart={() => handleTouchStart(s)}
                                        onTouchEnd={handleTouchEnd}
                                      >
                                          <PixelSprite seed={s.icon} name={s.icon} className="w-8 h-8"/>
                                          <span className="truncate w-full text-center mt-1">{s.name}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div>
                              <div className="text-xs text-gray-400 mb-1">Stationery ({runState.consumables.length}/2)</div>
                              <div className="grid grid-cols-2 gap-2">
                                  {runState.consumables.map((c, i) => (
                                      <div 
                                        key={i} 
                                        className={`p-2 rounded flex flex-col items-center text-xs cursor-pointer hover:bg-slate-700 ${c.type === 'SPECTRAL' ? 'bg-indigo-950 border border-purple-500' : 'bg-slate-900'}`}
                                        onContextMenu={(e) => handleContextMenu(e, c)}
                                        onTouchStart={() => handleTouchStart(c)}
                                        onTouchEnd={handleTouchEnd}
                                      >
                                          <PixelSprite seed={c.icon} name={c.icon} className="w-8 h-8"/>
                                          <span className="truncate w-full text-center mt-1">{c.name}</span>
                                      </div>
                                  ))}
                              </div>
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
              <div className={`text-6xl font-bold mb-4 ${phase === 'VICTORY' ? 'text-yellow-400' : 'text-red-500'}`}>
                  {phase === 'VICTORY' ? 'GRADUATED!' : 'EXPELLED'}
              </div>
              <p className="text-xl text-gray-400 mb-8">Reached Ante {runState.ante}</p>
              <button onClick={onBack} className="bg-white text-black px-8 py-3 font-bold rounded hover:bg-gray-200">Return to Menu</button>
          </div>
      );
  }

  // 3. Play Screen
  return (
    <div className="flex flex-col h-full w-full bg-green-900 text-white font-mono relative overflow-hidden">
        {renderInspectionModal()}
        
        {/* Rules / Game Info Modal (Same as before) */}
        {showRulesModal && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowRulesModal(false)}>
                <div className="bg-slate-800 border-4 border-yellow-500 rounded-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto relative shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowRulesModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center"><BookOpen className="mr-2"/> 遊び方 (How to Play)</h2>
                    {/* ... (Rules content omitted for brevity, logic unchanged) ... */}
                    <div className="mt-4 text-gray-400 text-sm">
                        Spectral cards (学校の怪談) are rare, high risk/reward items found in Spectral Packs.
                    </div>
                </div>
            </div>
        )}

        {/* Hand Levels & Deck List Modals (Omitted for brevity, logic unchanged) */}
        {showHandList && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowHandList(false)}>
                {/* ... */}
                <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowHandList(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><BarChart3 className="mr-2"/> Hand Levels</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(POKER_HAND_LEVELS).map(([key, def]) => {
                            const level = runState.handLevels[key] || 1;
                            const currentChips = def.baseChips + (level - 1) * 10;
                            const currentMult = def.baseMult + (level - 1) * 1;
                            return (
                                <div key={key} className={`p-3 rounded border flex justify-between items-center ${key === lastHandScore?.name ? 'bg-yellow-900/50 border-yellow-500' : 'bg-slate-900 border-slate-700'}`}>
                                    <div>
                                        <div className="font-bold text-white">{def.name}</div>
                                        <div className="text-xs text-blue-300">Lvl {level}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-blue-400 font-bold">{currentChips}</span>
                                        <span className="text-gray-500 mx-1">X</span>
                                        <span className="text-red-500 font-bold">{currentMult}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}
        {showDeckList && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowDeckList(false)}>
                {/* ... */}
                <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowDeckList(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center"><Layers className="mr-2"/> Deck List ({runState.deck.length} remaining)</h2>
                    {/* ... */}
                </div>
            </div>
        )}

        {/* Top Info Bar (Omitted for brevity, logic unchanged) */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-start p-2 md:p-4 bg-black/60 z-20 shadow-md shrink-0 gap-2">
            <div className="flex gap-2 w-full md:w-auto">
                <div className="flex flex-col items-start bg-slate-800 p-2 rounded border border-slate-600 flex-grow md:w-48 shadow-lg justify-center">
                    <div className="flex justify-between w-full md:block">
                        <div className="text-[10px] text-red-400 font-bold uppercase">Score Goal</div>
                        <div className="text-[10px] text-gray-400 md:mt-1 block md:hidden">Curr: {runState.currentScore.toLocaleString()}</div>
                    </div>
                    <div className="text-xl md:text-3xl font-black text-white leading-tight">{runState.currentBlind.scoreGoal.toLocaleString()}</div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min(100, (runState.currentScore / runState.currentBlind.scoreGoal) * 100)}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 hidden md:block">Current: {runState.currentScore.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-yellow-500 flex flex-col items-center justify-center w-20 md:hidden shrink-0">
                    <div className="text-[10px] text-yellow-400 uppercase">Money</div>
                    <div className="text-lg font-bold text-yellow-400">${runState.money}</div>
                </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setShowRulesModal(true); audioService.playSound('select'); }}
                        className="bg-slate-700 hover:bg-slate-600 p-1 md:p-2 rounded border border-slate-500 text-white flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14"
                    >
                        <HelpCircle size={18} className="md:w-5 md:h-5 text-yellow-400"/>
                        <span className="text-[9px] md:text-[10px] leading-none mt-1">Rules</span>
                    </button>
                    <button 
                        onClick={() => { setShowDeckList(true); audioService.playSound('select'); }}
                        className="bg-slate-700 hover:bg-slate-600 p-1 md:p-2 rounded border border-slate-500 text-white flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14"
                    >
                        <Layers size={18} className="md:w-5 md:h-5"/>
                        <span className="text-[9px] md:text-[10px] leading-none mt-1">Deck</span>
                    </button>
                    <button 
                        onClick={() => { setShowHandList(true); audioService.playSound('select'); }}
                        className="bg-slate-700 hover:bg-slate-600 p-1 md:p-2 rounded border border-slate-500 text-white flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14"
                    >
                        <BarChart3 size={18} className="md:w-5 md:h-5"/>
                        <span className="text-[9px] md:text-[10px] leading-none mt-1">Levels</span>
                    </button>
                </div>
                <div className="flex gap-2">
                    <div className="bg-slate-800 p-1 md:p-2 rounded border border-blue-600 flex flex-col items-center w-14 md:w-20 justify-center">
                        <div className="text-[9px] md:text-[10px] text-blue-400 uppercase">Hands</div>
                        <div className="text-base md:text-lg font-bold text-blue-100">{runState.handsRemaining}</div>
                    </div>
                    <div className="bg-slate-800 p-1 md:p-2 rounded border border-red-900 flex flex-col items-center w-14 md:w-20 justify-center">
                        <div className="text-[9px] md:text-[10px] text-red-400 uppercase">Disc</div>
                        <div className="text-base md:text-lg font-bold text-red-100">{runState.discardsRemaining}</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded border border-yellow-500 hidden md:flex flex-col items-center w-20 justify-center">
                        <div className="text-[10px] text-yellow-400 uppercase">Money</div>
                        <div className="text-lg font-bold text-yellow-400">${runState.money}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Item Shelf */}
        <div className="w-full bg-black/40 border-b border-black/50 p-2 flex justify-between items-center z-10 shrink-0 min-h-[64px]">
            {/* Supporters Rack */}
            <div className="flex gap-2 items-center flex-1 justify-center">
                {runState.supporters.map((s, i) => (
                    <div 
                        key={i} 
                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-800 border-2 border-yellow-500 rounded flex items-center justify-center relative group cursor-pointer hover:bg-slate-700 transition-colors"
                        onContextMenu={(e) => handleContextMenu(e, s)}
                        onTouchStart={() => handleTouchStart(s)}
                        onTouchEnd={handleTouchEnd}
                    >
                        <PixelSprite seed={s.icon} name={s.icon} className="w-8 h-8"/>
                    </div>
                ))}
                {runState.supporters.length === 0 && <div className="text-xs text-gray-500">No Supporters</div>}
            </div>

            {/* Consumables Rack */}
            <div className="flex gap-2 items-center border-l border-white/20 pl-2">
                {runState.consumables.map((c, i) => (
                    <div 
                        key={i} 
                        className={`w-10 h-10 md:w-12 md:h-12 border-2 rounded flex items-center justify-center relative group cursor-pointer hover:scale-110 transition-transform ${c.type === 'SPECTRAL' ? 'bg-indigo-950 border-purple-500' : 'bg-slate-800 border-purple-500'}`}
                        onClick={() => useConsumable(c)}
                        onContextMenu={(e) => handleContextMenu(e, c)}
                        onTouchStart={() => handleTouchStart(c)}
                        onTouchEnd={handleTouchEnd}
                    >
                        <PixelSprite seed={c.icon} name={c.icon} className="w-8 h-8"/>
                        {selectedConsumable === c && <div className="absolute inset-0 bg-white/30 rounded animate-pulse"></div>}
                    </div>
                ))}
                {runState.consumables.length === 0 && <div className="text-xs text-gray-500 w-12 text-center">Empty</div>}
            </div>
        </div>

        {/* Play Area */}
        <div className="flex-grow flex flex-col items-center justify-center relative">
            {/* Score Animation */}
            {animating && lastHandScore && (
                <div className="bg-slate-900/90 border-4 border-yellow-500 p-6 rounded-xl shadow-2xl animate-bounce z-50 text-center">
                    <div className="text-2xl text-white font-bold mb-2">{lastHandScore.name}</div>
                    <div className="flex items-center gap-2 text-3xl font-black">
                        <span className="text-blue-400">{lastHandScore.chips}</span>
                        <span className="text-gray-500">x</span>
                        <span className="text-red-500">{lastHandScore.mult}</span>
                    </div>
                    <div className="text-4xl text-yellow-400 mt-2 font-black">{lastHandScore.total.toLocaleString()}</div>
                </div>
            )}

            {/* Selected Consumable UI */}
            {selectedConsumable && (selectedConsumable.type === 'TAROT' || selectedConsumable.type === 'SPECTRAL') && (
                <div className={`absolute top-4 p-2 rounded text-center border z-40 ${selectedConsumable.type === 'SPECTRAL' ? 'bg-indigo-900/80 border-purple-400' : 'bg-purple-900/80 border-purple-400'}`}>
                    <div className="text-sm font-bold text-white">Using: {selectedConsumable.name}</div>
                    <div className="text-xs mb-2 text-gray-200">Select cards then click USE</div>
                    <div className="flex gap-2 justify-center">
                        <button onClick={applyModification} className="bg-purple-600 px-3 py-1 rounded text-xs font-bold hover:bg-purple-500">USE</button>
                        <button onClick={() => { setSelectedConsumable(null); setSelectedCards([]); }} className="bg-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-500">CANCEL</button>
                    </div>
                </div>
            )}
        </div>

        {/* Hand Area */}
        <div 
            className="h-40 md:h-56 w-full flex justify-center items-end pb-4 gap-[-20px] touch-none select-none shrink-0"
            onPointerLeave={handlePointerUp}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
        >
            {runState.hand.map((card, idx) => {
                const isSelected = selectedCards.includes(card.id);
                return (
                    <div 
                        key={card.id}
                        data-card-id={card.id}
                        onPointerDown={(e) => handlePointerDown(e, card.id)}
                        className={`
                            w-20 h-32 md:w-28 md:h-40 bg-gray-100 rounded-lg border-2 shadow-xl flex flex-col items-center justify-between p-2 cursor-pointer transition-transform duration-200 -ml-4 first:ml-0 relative
                            ${isSelected ? '-translate-y-6 z-20 border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-400 hover:-translate-y-2 z-10'}
                            ${selectedConsumable ? 'hover:ring-2 hover:ring-purple-400' : ''}
                        `}
                    >
                        {card.bonusChips > 0 && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-30 border border-white">
                                +{card.bonusChips}
                            </div>
                        )}
                        {card.multMultiplier > 1 && (
                            <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-30 border border-white">
                                x{card.multMultiplier}
                            </div>
                        )}
                        {card.enhancement === 'LUCKY' && (
                            <div className="absolute top-1 right-1 text-green-500">
                                <Sparkles size={12}/>
                            </div>
                        )}

                        <div className="flex justify-between w-full">
                            <div className={`text-xl md:text-2xl font-bold ${['HEART', 'DIAMOND'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
                                {getRankDisplay(card.rank)}
                            </div>
                        </div>
                        
                        <div className="scale-150">{getSuitIcon(card.suit)}</div>
                        
                        <div className="self-end rotate-180 text-xl md:text-2xl font-bold opacity-30">{getRankDisplay(card.rank)}</div>
                    </div>
                );
            })}
        </div>

        {/* Sort Controls */}
        <div className="flex justify-center gap-4 my-2 z-30 shrink-0">
            <button 
                onClick={sortHandRank}
                className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center shadow-lg border-2 border-orange-800"
            >
                {sortRankAsc ? <ArrowUpNarrowWide size={16} className="mr-1"/> : <ArrowDownWideNarrow size={16} className="mr-1"/>}
                Rank
            </button>
            <button 
                onClick={sortHandSuit}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center shadow-lg border-2 border-blue-800"
            >
                <LayoutList size={16} className="mr-1"/>
                Suit
            </button>
        </div>

        {/* Main Controls */}
        <div className="bg-slate-800 p-2 md:p-4 flex justify-center gap-4 z-20 shadow-up shrink-0">
            <button 
                onClick={playHand} 
                disabled={animating || selectedCards.length === 0}
                className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold py-2 px-8 rounded-lg text-lg md:text-xl shadow-lg border-b-4 border-orange-800 active:border-0 active:translate-y-1 transition-all"
            >
                PLAY HAND
            </button>
            <button 
                onClick={discardHand}
                disabled={animating || selectedCards.length === 0 || runState.discardsRemaining <= 0}
                className="bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg text-sm md:text-base shadow-lg border-b-4 border-red-900 active:border-0 active:translate-y-1 transition-all"
            >
                DISCARD
            </button>
        </div>
    </div>
  );
};

export default PokerGameScreen;
