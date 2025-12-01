
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Play, X, Trophy, AlertCircle, Club, Diamond, Heart, Spade, HelpCircle, ArrowUpDown, Layers } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

// --- Types ---
type Suit = 'SPADE' | 'HEART' | 'DIAMOND' | 'CLUB';
type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 14 is Ace

interface PokerCard {
  id: string;
  suit: Suit;
  rank: Rank;
  isSelected: boolean;
  bonusChips: number;
  multMultiplier: number;
}

interface HandResult {
  name: string;
  baseChips: number;
  baseMult: number;
}

interface Supporter {
  id: string;
  name: string;
  description: string;
  effect: (ctx: ScoringContext) => void;
  icon: string;
}

interface ScoringContext {
  chips: number;
  mult: number;
  handType: string;
  cards: PokerCard[];
  handsPlayed: number;
  discardsUsed: number;
}

// --- Constants ---
const SUITS: Suit[] = ['SPADE', 'HEART', 'DIAMOND', 'CLUB'];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const HAND_TYPES: Record<string, HandResult> = {
  'HIGH_CARD': { name: 'ハイカード', baseChips: 5, baseMult: 1 },
  'PAIR': { name: 'ワンペア', baseChips: 10, baseMult: 2 },
  'TWO_PAIR': { name: 'ツーペア', baseChips: 20, baseMult: 2 },
  'THREE_OF_A_KIND': { name: 'スリーカード', baseChips: 30, baseMult: 3 },
  'STRAIGHT': { name: 'ストレート', baseChips: 30, baseMult: 4 },
  'FLUSH': { name: 'フラッシュ', baseChips: 35, baseMult: 4 },
  'FULL_HOUSE': { name: 'フルハウス', baseChips: 40, baseMult: 4 },
  'FOUR_OF_A_KIND': { name: 'フォーカード', baseChips: 60, baseMult: 7 },
  'STRAIGHT_FLUSH': { name: 'ストレートフラッシュ', baseChips: 100, baseMult: 8 },
  'ROYAL_FLUSH': { name: 'ロイヤルストレートフラッシュ', baseChips: 200, baseMult: 20 }, // New rare hand
};

// Supporters (Jokers)
const SUPPORTERS_LIST: Supporter[] = [
  { id: 'TEACHER', name: '担任の先生', description: '倍率+4', effect: (ctx) => ctx.mult += 4, icon: 'TEACHER|#f44336' },
  { id: 'PRINCIPAL', name: '校長先生', description: '倍率x2', effect: (ctx) => ctx.mult *= 2, icon: 'BOSS|#FFD700' },
  { id: 'COOK', name: '給食のおばちゃん', description: 'チップ+50', effect: (ctx) => ctx.chips += 50, icon: 'CHEF|#ffccbc' },
  { id: 'ATHLETE', name: '体育会系', description: 'フラッシュで倍率+10', effect: (ctx) => { if(ctx.handType === 'FLUSH' || ctx.handType === 'STRAIGHT_FLUSH') ctx.mult += 10; }, icon: 'MUSCLE|#2196f3' },
  { id: 'NERD', name: 'ガリ勉君', description: 'ストレートでチップ+100', effect: (ctx) => { if(ctx.handType === 'STRAIGHT' || ctx.handType === 'STRAIGHT_FLUSH') ctx.chips += 100; }, icon: 'LIBRARIAN|#4caf50' },
  { id: 'DELINQUENT', name: '不良の先輩', description: '役を作るたび倍率+1 (現在値に加算)', effect: (ctx) => {}, icon: 'SENIOR|#607d8b' }, // Special logic elsewhere or persistent
  { id: 'IDOL', name: '学園のアイドル', description: '手札のハート1枚につき倍率+2', effect: (ctx) => { const hearts = ctx.cards.filter(c => c.suit === 'HEART').length; ctx.mult += hearts * 2; }, icon: 'GIRL|#e91e63' },
  { id: 'DOG', name: '迷い犬', description: '手札のスペード1枚につきチップ+20', effect: (ctx) => { const spades = ctx.cards.filter(c => c.suit === 'SPADE').length; ctx.chips += spades * 20; }, icon: 'DOG|#795548' },
  { id: 'GHOST', name: 'トイレの幽霊', description: 'ペア系役の倍率x1.5', effect: (ctx) => { if(['PAIR', 'TWO_PAIR', 'THREE_OF_A_KIND', 'FULL_HOUSE', 'FOUR_OF_A_KIND'].includes(ctx.handType)) ctx.mult = Math.floor(ctx.mult * 1.5); }, icon: 'GHOST|#9c27b0' },
  { id: 'ALIEN', name: '転校生(宇宙人)', description: '奇数ランクのカードのチップ+30', effect: (ctx) => { const odds = ctx.cards.filter(c => c.rank % 2 !== 0).length; ctx.chips += odds * 30; }, icon: 'ALIEN|#00bcd4' },
];

interface PokerGameScreenProps {
  onBack: () => void;
}

const PokerGameScreen: React.FC<PokerGameScreenProps> = ({ onBack }) => {
  // Game State
  const [deck, setDeck] = useState<PokerCard[]>([]);
  const [hand, setHand] = useState<PokerCard[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  
  const [round, setRound] = useState(1);
  const [targetScore, setTargetScore] = useState(300);
  const [currentScore, setCurrentScore] = useState(0);
  const [handsRemaining, setHandsRemaining] = useState(4);
  const [discardsRemaining, setDiscardsRemaining] = useState(3);
  
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRoundClear, setIsRoundClear] = useState(false);
  const [lastHandScore, setLastHandScore] = useState<{chips: number, mult: number, total: number, name: string} | null>(null);
  
  // Animation State
  const [animatingScore, setAnimatingScore] = useState(false);
  const [rewardOption, setRewardOption] = useState<Supporter | null>(null);
  
  // UI State
  const [showHandList, setShowHandList] = useState(false);

  // --- Initialization ---
  const initDeck = () => {
    const newDeck: PokerCard[] = [];
    SUITS.forEach((suit) => {
      RANKS.forEach(rank => {
        newDeck.push({
          id: `${suit}-${rank}-${Math.random()}`,
          suit,
          rank,
          isSelected: false,
          bonusChips: 0,
          multMultiplier: 1,
        });
      });
    });
    return shuffle(newDeck);
  };

  const shuffle = (array: PokerCard[]) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const drawCards = (currentHand: PokerCard[], currentDeck: PokerCard[], count: number) => {
    const newHand = [...currentHand];
    const newDeck = [...currentDeck];
    for (let i = 0; i < count; i++) {
      if (newDeck.length > 0) {
        newHand.push(newDeck.pop()!);
      }
    }
    return { newHand, newDeck };
  };

  const startGame = () => {
    const d = initDeck();
    const { newHand, newDeck } = drawCards([], d, 8);
    setDeck(newDeck);
    setHand(newHand);
    setSupporters([]);
    setRound(1);
    setTargetScore(300);
    setCurrentScore(0);
    setHandsRemaining(4);
    setDiscardsRemaining(3);
    setIsGameOver(false);
    setIsRoundClear(false);
    setLastHandScore(null);
    setRewardOption(null);
  };

  useEffect(() => {
    startGame();
    audioService.playBGM('math'); // Use math bgm as closest generic bgm
  }, []);

  // --- Logic ---
  const toggleSelect = (id: string) => {
    if (animatingScore || isGameOver || isRoundClear) return;
    
    const cardToToggle = hand.find(c => c.id === id);
    if (!cardToToggle) return;

    // Check limit if selecting a new card
    if (!cardToToggle.isSelected) {
        const selectedCount = hand.filter(c => c.isSelected).length;
        if (selectedCount >= 5) {
            audioService.playSound('wrong'); // Feedback for limit reached
            return;
        }
    }

    setHand(prev => prev.map(c => c.id === id ? { ...c, isSelected: !c.isSelected } : c));
    audioService.playSound('select');
  };

  const sortByRank = () => {
    setHand(prev => {
        const sorted = [...prev].sort((a, b) => b.rank - a.rank || b.suit.localeCompare(a.suit));
        return sorted;
    });
    audioService.playSound('select');
  };

  const sortBySuit = () => {
    setHand(prev => {
        // Suit order: Spades, Hearts, Diamonds, Clubs
        const suitOrder: Record<string, number> = { 'SPADE': 0, 'HEART': 1, 'DIAMOND': 2, 'CLUB': 3 };
        const sorted = [...prev].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || b.rank - a.rank);
        return sorted;
    });
    audioService.playSound('select');
  };

  const getSelectedCards = () => hand.filter(c => c.isSelected);

  const evaluateHand = (cards: PokerCard[]): { type: string, cards: PokerCard[] } => {
    if (cards.length === 0) return { type: 'HIGH_CARD', cards: [] };
    
    // Sort by rank for easier eval
    const sorted = [...cards].sort((a, b) => a.rank - b.rank);
    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);
    
    const isFlush = cards.length === 5 && suits.every(s => s === suits[0]);
    
    // Check Straight (5 cards only)
    let isStraight = true;
    if (cards.length !== 5) {
        isStraight = false;
    } else {
        for (let i = 0; i < ranks.length - 1; i++) {
            if (ranks[i+1] !== ranks[i] + 1) {
                isStraight = false;
                break;
            }
        }
        // Special case A, 2, 3, 4, 5 (14, 2, 3, 4, 5)
        if (!isStraight && ranks.length === 5 && ranks.includes(14) && ranks.includes(2) && ranks.includes(3) && ranks.includes(4) && ranks.includes(5)) {
            isStraight = true;
        }
    }

    const counts: Record<number, number> = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const countsValues = Object.values(counts).sort((a, b) => b - a);

    if (isFlush && isStraight) {
        if (ranks.includes(14) && ranks.includes(13)) return { type: 'ROYAL_FLUSH', cards: sorted };
        return { type: 'STRAIGHT_FLUSH', cards: sorted };
    }
    if (countsValues[0] === 4) return { type: 'FOUR_OF_A_KIND', cards: sorted };
    if (countsValues[0] === 3 && countsValues[1] === 2) return { type: 'FULL_HOUSE', cards: sorted };
    if (isFlush) return { type: 'FLUSH', cards: sorted };
    if (isStraight) return { type: 'STRAIGHT', cards: sorted };
    if (countsValues[0] === 3) return { type: 'THREE_OF_A_KIND', cards: sorted };
    if (countsValues[0] === 2 && countsValues[1] === 2) return { type: 'TWO_PAIR', cards: sorted };
    if (countsValues[0] === 2) return { type: 'PAIR', cards: sorted };
    
    return { type: 'HIGH_CARD', cards: sorted };
  };

  const handlePlayHand = async () => {
    if (handsRemaining <= 0 || animatingScore) return;
    
    const selected = getSelectedCards();
    if (selected.length === 0 || selected.length > 5) {
        return;
    }

    const { type, cards } = evaluateHand(selected);
    const handData = HAND_TYPES[type];
    
    // Scoring
    let chips = handData.baseChips;
    let mult = handData.baseMult;

    // Card Chips
    cards.forEach(c => {
        let rankValue = c.rank;
        if (rankValue > 10 && rankValue < 14) rankValue = 10; // JQK = 10
        if (rankValue === 14) rankValue = 11; // A = 11
        chips += rankValue + c.bonusChips;
    });

    // Supporter Effects
    const context: ScoringContext = {
        chips, mult, handType: type, cards, handsPlayed: 4 - handsRemaining, discardsUsed: 3 - discardsRemaining
    };
    supporters.forEach(s => s.effect(context));
    
    // Result
    chips = context.chips;
    mult = context.mult;
    const score = chips * mult;

    setLastHandScore({ chips, mult, total: score, name: handData.name });
    setAnimatingScore(true);
    audioService.playSound('attack');

    // Animation Delay
    await new Promise(r => setTimeout(r, 1000));
    
    const newScore = currentScore + score;
    setCurrentScore(newScore);
    setHandsRemaining(prev => prev - 1);
    
    // Remove played cards and draw
    const remainingHand = hand.filter(c => !c.isSelected);
    const { newHand: drawnHand, newDeck } = drawCards(remainingHand, deck, selected.length);
    setHand(drawnHand);
    setDeck(newDeck);
    setAnimatingScore(false);

    // Check Win/Lose
    if (newScore >= targetScore) {
        audioService.playSound('win');
        setIsRoundClear(true);
        // Generate Reward
        const availableSupporters = SUPPORTERS_LIST.filter(s => !supporters.find(own => own.id === s.id));
        if (availableSupporters.length > 0) {
            setRewardOption(availableSupporters[Math.floor(Math.random() * availableSupporters.length)]);
        }
    } else if (handsRemaining - 1 <= 0) {
        audioService.playSound('lose');
        setIsGameOver(true);
    }
  };

  const handleDiscard = () => {
      if (discardsRemaining <= 0 || animatingScore) return;
      const selected = getSelectedCards();
      if (selected.length === 0 || selected.length > 5) return;

      audioService.playSound('select');
      const remainingHand = hand.filter(c => !c.isSelected);
      const { newHand, newDeck } = drawCards(remainingHand, deck, selected.length);
      
      setHand(newHand);
      setDeck(newDeck);
      setDiscardsRemaining(prev => prev - 1);
  };

  const handleNextRound = () => {
      const nextRound = round + 1;
      const nextTarget = Math.floor(targetScore * 1.5 + 500);
      
      // Reset Deck
      const d = initDeck();
      const { newHand, newDeck } = drawCards([], d, 8);
      
      setDeck(newDeck);
      setHand(newHand);
      setRound(nextRound);
      setTargetScore(nextTarget);
      setCurrentScore(0);
      setHandsRemaining(4);
      setDiscardsRemaining(3);
      setIsRoundClear(false);
      setLastHandScore(null);
      setRewardOption(null);
      
      // Add supporter if selected
      if (rewardOption && supporters.length < 5) {
          setSupporters([...supporters, rewardOption]);
      }
  };

  const getSuitIcon = (suit: Suit) => {
      switch(suit) {
          case 'SPADE': return <Spade className="text-blue-400 fill-current" />;
          case 'HEART': return <Heart className="text-red-500 fill-current" />;
          case 'DIAMOND': return <Diamond className="text-yellow-400 fill-current" />;
          case 'CLUB': return <Club className="text-green-500 fill-current" />;
      }
  };

  const getRankDisplay = (rank: Rank) => {
      if (rank === 14) return 'A';
      if (rank === 13) return 'K';
      if (rank === 12) return 'Q';
      if (rank === 11) return 'J';
      return rank.toString();
  };

  const getSuitLabel = (suit: Suit) => {
      switch(suit) {
          case 'SPADE': return '算数';
          case 'HEART': return '国語';
          case 'DIAMOND': return '理科';
          case 'CLUB': return '社会';
      }
  };

  // Preview Score
  const selectedCards = getSelectedCards();
  const previewHand = selectedCards.length > 0 ? evaluateHand(selectedCards) : null;
  const previewName = previewHand ? HAND_TYPES[previewHand.type].name : '役なし';

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-white relative font-mono">
      {/* Header */}
      <div className="bg-slate-800 p-2 border-b border-slate-600 flex justify-between items-center z-10 shrink-0 shadow-lg">
          <div className="flex items-center">
              <button onClick={onBack} className="mr-2 md:mr-4 text-gray-400 hover:text-white"><ArrowLeft/></button>
              <h2 className="text-base md:text-xl font-bold text-yellow-400 truncate">放課後ポーカー</h2>
              <span className="ml-2 md:ml-4 text-xs md:text-sm bg-slate-700 px-2 py-1 rounded text-white whitespace-nowrap">Round {round}</span>
          </div>
          <div className="text-right flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setShowHandList(true)}
                className="bg-slate-700 hover:bg-slate-600 text-blue-300 px-2 py-1 md:px-3 rounded border border-blue-500/50 text-xs flex items-center"
              >
                  <HelpCircle size={14} className="mr-1"/> <span className="hidden md:inline">役一覧</span>
              </button>
              <div>
                <div className="text-[9px] md:text-[10px] text-gray-400">目標</div>
                <div className="text-sm md:text-lg font-bold text-red-400">{targetScore.toLocaleString()}</div>
              </div>
          </div>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/felt.png')] bg-green-900/30">
          
          {/* Hand List Modal */}
          {showHandList && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowHandList(false)}>
                  <div className="bg-slate-800 border-2 border-white p-6 rounded-xl max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowHandList(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                      <h3 className="text-2xl font-bold text-yellow-400 mb-4 border-b border-gray-600 pb-2">役とスコア</h3>
                      
                      <div className="space-y-2 text-sm">
                          <p className="text-gray-300 text-xs mb-4">
                              スコア = (役のチップ + カードの数値) × 倍率<br/>
                              ※J, Q, K = 10点, A = 11点
                          </p>
                          <div className="grid grid-cols-3 gap-2 font-bold text-gray-400 border-b border-gray-700 pb-1 mb-2">
                              <div>役名</div>
                              <div className="text-center">チップ</div>
                              <div className="text-center">倍率</div>
                          </div>
                          {Object.values(HAND_TYPES).sort((a,b) => b.baseChips * b.baseMult - a.baseChips * a.baseMult).map((h) => (
                              <div key={h.name} className="grid grid-cols-3 gap-2 items-center py-1 border-b border-gray-700/50 last:border-0">
                                  <div className="text-white text-xs">{h.name}</div>
                                  <div className="text-center text-blue-400">{h.baseChips}</div>
                                  <div className="text-center text-red-400">x{h.baseMult}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* Score Board */}
          <div className="flex justify-center items-center py-2 md:py-4 space-x-8 bg-black/20 shrink-0">
              <div className="bg-slate-800 border-4 border-slate-600 rounded-xl p-2 md:p-4 w-48 md:w-64 text-center shadow-2xl relative">
                  <div className="text-[10px] md:text-xs text-gray-400 mb-1">現在のスコア</div>
                  <div className="text-2xl md:text-3xl font-bold text-white tracking-widest">{currentScore.toLocaleString()}</div>
                  {animatingScore && lastHandScore && (
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-yellow-100 text-black px-4 py-2 rounded-full border-2 border-yellow-500 shadow-xl whitespace-nowrap animate-bounce z-50">
                          <div className="font-bold text-base md:text-lg">{lastHandScore.name}</div>
                          <div className="text-xs md:text-sm font-bold flex items-center justify-center gap-2">
                              <span className="text-blue-700">{lastHandScore.chips}</span>
                              <span className="text-gray-500">x</span>
                              <span className="text-red-600">{lastHandScore.mult}</span>
                              <span className="text-gray-500">=</span>
                              <span className="text-lg md:text-xl">{lastHandScore.total}</span>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* Supporters */}
          <div className="flex justify-center gap-2 mb-1 px-2 overflow-x-auto min-h-[50px] md:min-h-[64px] shrink-0">
              {supporters.map((s, idx) => (
                  <div key={idx} className="w-10 h-10 md:w-12 md:h-12 bg-slate-700 border-2 border-yellow-500 rounded flex items-center justify-center relative group shrink-0" title={s.description}>
                      <PixelSprite seed={s.icon} name={s.icon} className="w-8 h-8 md:w-10 md:h-10" />
                      <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs p-2 rounded z-50 w-32 text-center pointer-events-none border border-white/20">
                          <div className="font-bold text-yellow-300">{s.name}</div>
                          <div>{s.description}</div>
                      </div>
                  </div>
              ))}
              {[...Array(5 - supporters.length)].map((_, i) => (
                  <div key={i} className="w-10 h-10 md:w-12 md:h-12 bg-black/20 border-2 border-slate-600 border-dashed rounded shrink-0"></div>
              ))}
          </div>

          {/* Play Area */}
          <div className="flex-grow flex flex-col items-center justify-center min-h-0">
              <div className="text-white/20 text-2xl md:text-4xl font-bold select-none pointer-events-none rotate-[-5deg] mb-2 md:mb-8">
                  {previewName}
              </div>
              
              {/* Sort Buttons */}
              <div className="flex gap-2 md:gap-4 mb-2">
                  <button onClick={sortByRank} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 md:px-3 rounded text-[10px] md:text-xs flex items-center border border-slate-500">
                      <ArrowUpDown size={12} className="mr-1"/> ランク順
                  </button>
                  <button onClick={sortBySuit} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 md:px-3 rounded text-[10px] md:text-xs flex items-center border border-slate-500">
                      <Layers size={12} className="mr-1"/> スート順
                  </button>
              </div>
          </div>

          {/* Hand Area - Responsive Sizing */}
          <div className="pb-2 pt-2 md:pt-10 px-4 flex justify-center items-end h-32 md:h-48 relative shrink-0 overflow-visible">
              {hand.map((card, idx) => (
                  <div 
                    key={card.id}
                    onClick={() => toggleSelect(card.id)}
                    className={`
                        w-16 h-24 md:w-24 md:h-36 bg-gray-100 rounded-lg border-2 shadow-xl flex flex-col items-center justify-between p-1 md:p-2 cursor-pointer transition-transform duration-200 select-none -ml-6 md:-ml-8 first:ml-0 hover:z-20 relative shrink-0
                        ${card.isSelected ? '-translate-y-4 md:-translate-y-6 border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-300 hover:-translate-y-2'}
                    `}
                  >
                      {/* Top Left */}
                      <div className="self-start flex flex-col items-center leading-none">
                          <span className={`text-base md:text-lg font-bold ${['HEART','DIAMOND'].includes(card.suit) ? 'text-red-600' : 'text-slate-800'}`}>{getRankDisplay(card.rank)}</span>
                          <span className="scale-75">{getSuitIcon(card.suit)}</span>
                      </div>
                      
                      {/* Center */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                          {getSuitIcon(card.suit)}
                      </div>
                      <div className="text-[8px] md:text-[10px] text-gray-500 font-bold hidden md:block">{getSuitLabel(card.suit)}</div>

                      {/* Bottom Right */}
                      <div className="self-end flex flex-col items-center leading-none rotate-180">
                          <span className={`text-base md:text-lg font-bold ${['HEART','DIAMOND'].includes(card.suit) ? 'text-red-600' : 'text-slate-800'}`}>{getRankDisplay(card.rank)}</span>
                          <span className="scale-75">{getSuitIcon(card.suit)}</span>
                      </div>
                  </div>
              ))}
          </div>

          {/* Controls - Compact */}
          <div className="bg-slate-800 p-2 md:p-4 border-t border-slate-600 flex justify-between items-center gap-2 md:gap-4 shrink-0">
              <div className="flex flex-col items-center min-w-[50px]">
                  <div className="text-[10px] md:text-xs text-gray-400">残り手数</div>
                  <div className="text-base md:text-xl font-bold text-blue-400">{handsRemaining}</div>
              </div>
              
              <div className="flex gap-2 md:gap-4">
                  <button 
                    onClick={handlePlayHand}
                    disabled={selectedCards.length === 0 || handsRemaining <= 0 || animatingScore}
                    className={`
                        px-4 py-2 md:px-8 md:py-3 rounded-lg font-bold text-sm md:text-lg shadow-lg transition-all transform active:scale-95 flex items-center
                        ${selectedCards.length > 0 && handsRemaining > 0 && !animatingScore ? 'bg-orange-600 hover:bg-orange-500 text-white border-b-4 border-orange-800' : 'bg-gray-600 text-gray-400 border-b-4 border-gray-700 cursor-not-allowed'}
                    `}
                  >
                      PLAY
                  </button>
                  <button 
                    onClick={handleDiscard}
                    disabled={selectedCards.length === 0 || discardsRemaining <= 0 || animatingScore}
                    className={`
                        px-3 py-2 md:px-6 md:py-3 rounded-lg font-bold text-xs md:text-sm shadow-lg transition-all transform active:scale-95 flex flex-col items-center justify-center
                        ${selectedCards.length > 0 && discardsRemaining > 0 && !animatingScore ? 'bg-red-900 hover:bg-red-800 text-white border-b-4 border-red-950' : 'bg-gray-700 text-gray-500 border-b-4 border-gray-800 cursor-not-allowed'}
                    `}
                  >
                      <span>DISCARD</span>
                      <span className="text-[9px] md:text-[10px] opacity-70">残: {discardsRemaining}</span>
                  </button>
              </div>
          </div>
      </div>

      {/* Result Overlay */}
      {(isRoundClear || isGameOver) && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 border-4 border-white p-8 rounded-xl max-w-md w-full text-center shadow-2xl animate-in zoom-in">
                  {isRoundClear ? (
                      <>
                        <h3 className="text-3xl font-bold text-yellow-400 mb-2">ROUND CLEAR!</h3>
                        <p className="text-gray-300 mb-6">ノルマ達成！次の学年へ進級しますか？</p>
                        
                        {rewardOption && supporters.length < 5 && (
                            <div className="mb-6 bg-slate-700 p-4 rounded border border-yellow-500">
                                <div className="text-sm text-yellow-200 mb-2">ボーナス獲得！</div>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-12 h-12 bg-black rounded border border-white flex items-center justify-center">
                                        <PixelSprite seed={rewardOption.icon} name={rewardOption.icon} className="w-10 h-10" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">{rewardOption.name}</div>
                                        <div className="text-xs text-gray-300">{rewardOption.description}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button onClick={handleNextRound} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-bold text-xl border-b-4 border-blue-800 active:border-0 active:translate-y-1 cursor-pointer">
                            次へ進む
                        </button>
                      </>
                  ) : (
                      <>
                        <h3 className="text-4xl font-bold text-red-500 mb-2">GAME OVER</h3>
                        <p className="text-gray-300 mb-6">ノルマ未達成... 補習決定。</p>
                        <div className="text-2xl font-bold text-white mb-8">到達: Round {round}</div>
                        <button onClick={startGame} className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded font-bold border-b-4 border-gray-800 mb-4 cursor-pointer">
                            リトライ
                        </button>
                        <button onClick={onBack} className="text-gray-400 hover:text-white underline">
                            タイトルへ
                        </button>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default PokerGameScreen;
