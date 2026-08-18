import React, { useEffect, useState } from 'react';
import { ArrowLeft, CircleHelp, Trophy } from 'lucide-react';
import { CARDS_LIBRARY } from '../constants';
import { Card as CardType, GameScreen, LanguageMode } from '../types';
import Card from './Card';
import { audioService } from '../services/audioService';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';

interface TriviaMiniGameProps {
  onBack: () => void;
  onFinish?: (result: 'WIN' | 'LOSE') => void;
  languageMode?: LanguageMode;
  gameScreen?: GameScreen;
}

const text = (languageMode: LanguageMode, japanese: string, english: string) =>
  languageMode === 'ENGLISH' ? english : trans(japanese, languageMode);

type LocalCopy = { jp: string; en: string };
type MiniGameRules = {
  summary: LocalCopy;
  goal: LocalCopy;
  steps: LocalCopy[];
  tip: LocalCopy;
};

const GameShell: React.FC<{
  scope: string;
  title: string;
  subtitle: string;
  languageMode: LanguageMode;
  backgroundAsset?: string;
  badgeAsset?: string;
  foregroundAsset?: string;
  rules?: MiniGameRules;
  onBack: () => void;
  children: React.ReactNode;
}> = ({ scope, title, subtitle, languageMode, backgroundAsset, badgeAsset, foregroundAsset, rules, onBack, children }) => {
  const rulesStorageKey = `learning_rogue_mini_game_rules_v2_${scope}`;
  const gameRules = rules || MINI_GAME_RULES[scope];
  const gameForegroundAsset = foregroundAsset || `sprites/backgrounds/mini-games/foreground/${scope}.png`;
  const [showRules, setShowRules] = useState(() => {
    if (!gameRules || typeof window === 'undefined') return false;
    return window.localStorage.getItem(rulesStorageKey) !== 'seen';
  });
  const closeRules = () => {
    if (typeof window !== 'undefined') window.localStorage.setItem(rulesStorageKey, 'seen');
    setShowRules(false);
  };

  return (
    <div
      data-gamepad-navigation-root
      data-gamepad-initial-scope={scope}
      data-mini-game-scope={scope}
      className={`mini-game-shell mini-game-scope-${scope} relative h-full w-full overflow-y-auto bg-slate-950 bg-cover bg-center text-white`}
      style={backgroundAsset ? { backgroundImage: `url("${assetUrl(backgroundAsset)}")` } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-950/55" />
      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-3 py-3 sm:px-5 sm:py-5">
        <header className="mini-game-header mb-3 flex items-center gap-3 rounded-2xl border border-cyan-300/25 bg-slate-900/90 p-3 shadow-xl">
          <button
            type="button"
            onClick={onBack}
            data-gamepad-zone="game-header"
            data-gamepad-order={0}
            data-gamepad-back="true"
            aria-label={text(languageMode, '戻る', 'Back')}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          >
            <ArrowLeft size={22} />
          </button>
          {badgeAsset && <img src={assetUrl(badgeAsset)} alt="" aria-hidden="true" className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_0_14px_rgba(103,232,249,0.45)] sm:h-16 sm:w-16" />}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-black tracking-wide text-cyan-100 sm:text-2xl">{title}</h1>
            <p className="text-xs text-slate-300 sm:text-sm">{subtitle}</p>
          </div>
          {gameForegroundAsset && <img src={assetUrl(gameForegroundAsset)} alt="" aria-hidden="true" className="mini-game-foreground-art hidden h-16 w-16 shrink-0 object-contain mix-blend-screen drop-shadow-[0_0_16px_rgba(103,232,249,0.45)] sm:block" />}
          {gameRules && <button type="button" onClick={() => setShowRules(true)} data-gamepad-zone="game-header" data-gamepad-order={1} aria-label={text(languageMode, 'ルールを見る', 'View rules')} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 transition hover:bg-cyan-300/20"><CircleHelp size={22} /></button>}
        </header>
        <main className="mini-game-main flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
      {gameRules && showRules && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm" data-gamepad-modal="true" data-gamepad-navigation-root="true">
        <section role="dialog" aria-modal="true" aria-labelledby={`${scope}-rules-title`} className="mini-game-rules-modal max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-cyan-200/40 bg-slate-900 p-5 shadow-2xl shadow-cyan-950/50">
          <div className="mb-4 flex items-start gap-3"><div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200"><CircleHelp size={24} /></div><div className="min-w-0 flex-1"><h2 id={`${scope}-rules-title`} className="text-xl font-black text-cyan-100">{text(languageMode, 'はじめてのルール', 'How to play')}</h2><p className="mt-1 text-sm leading-6 text-slate-300">{copyText(languageMode, gameRules.summary)}</p></div></div>
          <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-950/35 p-3"><div className="text-xs font-black uppercase tracking-wider text-amber-200">{text(languageMode, '目標', 'Goal')}</div><div className="mt-1 text-sm leading-6 text-amber-50">{copyText(languageMode, gameRules.goal)}</div></div>
          <ol className="mb-4 space-y-2">{gameRules.steps.map((step, index) => <li key={`${scope}-step-${index}`} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-100"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-black text-slate-950">{index + 1}</span><span>{copyText(languageMode, step)}</span></li>)}</ol>
          <div className="mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-950/35 p-3 text-sm leading-6 text-emerald-50"><span className="font-black text-emerald-200">{text(languageMode, 'コツ：', 'Tip: ')}</span>{copyText(languageMode, gameRules.tip)}</div>
          <button type="button" onClick={closeRules} data-gamepad-zone="game-rules" data-gamepad-order={0} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-black text-slate-950 transition hover:bg-cyan-300">{text(languageMode, 'ゲームを始める', 'Start game')}</button>
        </section>
      </div>}
    </div>
  );
};

const ResultBanner: React.FC<{ result: 'WIN' | 'LOSE' | null; onRestart: () => void; languageMode: LanguageMode }> = ({ result, onRestart, languageMode }) => {
  if (!result) return null;
  return (
    <div className="mb-3 rounded-2xl border border-yellow-300/50 bg-yellow-950/70 p-4 text-center shadow-lg">
      <Trophy className="mx-auto mb-1 text-yellow-300" size={28} />
      <div className="text-lg font-black text-yellow-100">{result === 'WIN' ? text(languageMode, '勝利！', 'Victory!') : text(languageMode, 'ゲーム終了', 'Game over')}</div>
      <button type="button" onClick={onRestart} data-gamepad-zone="result" data-gamepad-order={0} className="mt-3 rounded-lg bg-yellow-400 px-4 py-2 font-black text-slate-950 hover:bg-yellow-300">
        {text(languageMode, 'もう一度遊ぶ', 'Play again')}
      </button>
    </div>
  );
};

type StoneColor = 'ruby' | 'sapphire' | 'emerald' | 'amber';
const STONE_COLORS: Array<{ id: StoneColor; label: string; className: string }> = [
  { id: 'ruby', label: '赤', className: 'bg-rose-500' },
  { id: 'sapphire', label: '青', className: 'bg-sky-500' },
  { id: 'emerald', label: '緑', className: 'bg-emerald-500' },
  { id: 'amber', label: '黄', className: 'bg-amber-400' },
];
const STONE_BONUS_CARD_CLASSES: Record<StoneColor, string> = {
  ruby: 'border-rose-300/45 bg-rose-950/30',
  sapphire: 'border-sky-300/45 bg-sky-950/30',
  emerald: 'border-emerald-300/45 bg-emerald-950/30',
  amber: 'border-amber-300/45 bg-amber-950/30',
};
type StoneCard = { id: string; name: string; cost: Partial<Record<StoneColor, number>>; bonus: StoneColor; points: number; tier: 1 | 2 | 3 };
const STONE_MARKET_DECK: StoneCard[] = [
  { id: 'quartz', name: '水晶の小径', cost: { ruby: 2, sapphire: 1 }, bonus: 'ruby', points: 1, tier: 1 },
  { id: 'amethyst', name: '紫水晶の棚', cost: { sapphire: 2, emerald: 1 }, bonus: 'sapphire', points: 1, tier: 1 },
  { id: 'moss', name: '苔むす坑道', cost: { emerald: 2, amber: 1 }, bonus: 'emerald', points: 1, tier: 1 },
  { id: 'sunstone', name: '陽だまり鉱脈', cost: { amber: 2, ruby: 1 }, bonus: 'amber', points: 1, tier: 1 },
  { id: 'ruby-path', name: '赤玉の採掘点', cost: { ruby: 1, sapphire: 2 }, bonus: 'ruby', points: 1, tier: 1 },
  { id: 'blue-stream', name: '青晶の水路', cost: { sapphire: 1, emerald: 2 }, bonus: 'sapphire', points: 1, tier: 1 },
  { id: 'green-cave', name: '緑苔の洞', cost: { emerald: 1, amber: 2 }, bonus: 'emerald', points: 1, tier: 1 },
  { id: 'gold-slope', name: '黄砂の鉱床', cost: { amber: 1, ruby: 2 }, bonus: 'amber', points: 1, tier: 1 },
  { id: 'fire-vein', name: '火花の坑道', cost: { ruby: 2, emerald: 1 }, bonus: 'ruby', points: 1, tier: 1 },
  { id: 'ice-cavern', name: '氷河の採掘場', cost: { sapphire: 2, amber: 1 }, bonus: 'sapphire', points: 1, tier: 1 },
  { id: 'forest-shadow', name: '森影の小路', cost: { emerald: 2, ruby: 1 }, bonus: 'emerald', points: 1, tier: 1 },
  { id: 'golden-sand', name: '砂金の鉱脈', cost: { amber: 2, sapphire: 1 }, bonus: 'amber', points: 1, tier: 1 },
  { id: 'red-workshop', name: '紅玉の工房', cost: { ruby: 1, sapphire: 1, amber: 1 }, bonus: 'ruby', points: 1, tier: 1 },
  { id: 'blue-workshop', name: '藍石の工房', cost: { sapphire: 1, emerald: 1, ruby: 1 }, bonus: 'sapphire', points: 1, tier: 1 },
  { id: 'green-workshop', name: '翠石の工房', cost: { emerald: 1, amber: 1, sapphire: 1 }, bonus: 'emerald', points: 1, tier: 1 },
  { id: 'yellow-workshop', name: '金石の工房', cost: { amber: 1, ruby: 1, emerald: 1 }, bonus: 'amber', points: 1, tier: 1 },
  { id: 'moon', name: '月のかけら', cost: { emerald: 2, amber: 2 }, bonus: 'sapphire', points: 2, tier: 2 },
  { id: 'star', name: '星砂の採掘場', cost: { ruby: 2, sapphire: 1, emerald: 1 }, bonus: 'emerald', points: 2, tier: 2 },
  { id: 'forge', name: '鍛冶屋の炉', cost: { ruby: 3, amber: 2 }, bonus: 'ruby', points: 3, tier: 2 },
  { id: 'four-seasons', name: '四季の採石場', cost: { ruby: 2, sapphire: 2, amber: 1 }, bonus: 'emerald', points: 2, tier: 2 },
  { id: 'aurora', name: '星明かりの坑道', cost: { sapphire: 2, emerald: 2, ruby: 1 }, bonus: 'amber', points: 2, tier: 2 },
  { id: 'deep-forest', name: '深林の鉱脈', cost: { emerald: 2, amber: 2, sapphire: 1 }, bonus: 'ruby', points: 2, tier: 2 },
  { id: 'golden-range', name: '黄金連峰', cost: { amber: 2, ruby: 2, emerald: 1 }, bonus: 'sapphire', points: 2, tier: 2 },
  { id: 'red-vault', name: '紅玉の宝庫', cost: { ruby: 3, sapphire: 1, amber: 1 }, bonus: 'ruby', points: 3, tier: 2 },
  { id: 'blue-vault', name: '蒼玉の宝庫', cost: { sapphire: 3, emerald: 1, ruby: 1 }, bonus: 'sapphire', points: 3, tier: 2 },
  { id: 'green-vault', name: '翠玉の宝庫', cost: { emerald: 3, amber: 1, sapphire: 1 }, bonus: 'emerald', points: 3, tier: 2 },
  { id: 'yellow-vault', name: '琥珀の宝庫', cost: { amber: 3, ruby: 1, emerald: 1 }, bonus: 'amber', points: 3, tier: 2 },
  { id: 'four-winds', name: '四方風の採掘場', cost: { ruby: 2, sapphire: 1, emerald: 2 }, bonus: 'amber', points: 3, tier: 2 },
  { id: 'crystal-bridge', name: '結晶の橋', cost: { sapphire: 2, amber: 1, ruby: 2 }, bonus: 'emerald', points: 3, tier: 2 },
  { id: 'rainbow', name: '七色の鉱脈', cost: { sapphire: 3, amber: 3 }, bonus: 'amber', points: 4, tier: 3 },
  { id: 'world-core', name: '世界樹の芯', cost: { ruby: 4, sapphire: 2, emerald: 1 }, bonus: 'ruby', points: 4, tier: 3 },
  { id: 'blue-crown', name: '蒼い王冠', cost: { sapphire: 4, emerald: 2, ruby: 1 }, bonus: 'sapphire', points: 4, tier: 3 },
  { id: 'green-crown', name: '翠の王冠', cost: { emerald: 4, amber: 2, sapphire: 1 }, bonus: 'emerald', points: 4, tier: 3 },
  { id: 'amber-crown', name: '琥珀の王冠', cost: { amber: 4, ruby: 2, emerald: 1 }, bonus: 'amber', points: 4, tier: 3 },
  { id: 'celestial', name: '天球の鉱脈', cost: { ruby: 3, sapphire: 3, emerald: 2 }, bonus: 'sapphire', points: 5, tier: 3 },
  { id: 'forest-crystal', name: '森晶の聖域', cost: { sapphire: 3, emerald: 3, amber: 2 }, bonus: 'emerald', points: 5, tier: 3 },
  { id: 'sun-core', name: '太陽の核', cost: { emerald: 3, amber: 3, ruby: 2 }, bonus: 'amber', points: 5, tier: 3 },
  { id: 'molten', name: '熔岩の心臓', cost: { amber: 3, ruby: 3, sapphire: 2 }, bonus: 'ruby', points: 5, tier: 3 },
  { id: 'four-color', name: '四色の大鉱脈', cost: { ruby: 3, sapphire: 2, emerald: 2, amber: 1 }, bonus: 'sapphire', points: 5, tier: 3 },
  { id: 'ancient', name: '古代王の採掘場', cost: { ruby: 2, sapphire: 2, emerald: 2, amber: 2 }, bonus: 'emerald', points: 5, tier: 3 },
];
const emptyStones = (): Record<StoneColor, number> => ({ ruby: 0, sapphire: 0, emerald: 0, amber: 0 });
const fullStoneSupply = (): Record<StoneColor, number> => ({ ruby: 5, sapphire: 5, emerald: 5, amber: 5 });
type StoneGlowState = {
  stones: Record<StoneColor, number>;
  supply: Record<StoneColor, number>;
  cpuStones: Record<StoneColor, number>;
  market: StoneCard[];
  deck: StoneCard[];
  owned: StoneCard[];
  cpuOwned: StoneCard[];
  reserved: StoneCard[];
  score: number;
  cpuScore: number;
  wild: number;
  round: number;
  selectedTake: StoneColor[];
  actionLog: LocalCopy[];
  result: 'WIN' | 'LOSE' | null;
};
const createStoneGlowState = (): StoneGlowState => {
  const shuffled = [...STONE_MARKET_DECK].sort(() => Math.random() - 0.5);
  return {
    stones: emptyStones(), supply: fullStoneSupply(), cpuStones: emptyStones(), market: shuffled.slice(0, 4), deck: shuffled.slice(4),
    owned: [], cpuOwned: [], reserved: [], score: 0, cpuScore: 0, wild: 0, round: 1, selectedTake: [],
    actionLog: [{ jp: 'あなたの手番です。石を2個取るか、カードを購入できます。', en: 'Your turn. Take two stones or buy a card.' }], result: null,
  };
};
const stoneDiscount = (owned: StoneCard[], color: StoneColor) => owned.filter(card => card.bonus === color).length;
const stoneCanPay = (card: StoneCard, stones: Record<StoneColor, number>, owned: StoneCard[], wild: number) => {
  let wildNeeded = 0;
  for (const color of STONE_COLORS) wildNeeded += Math.max(0, (card.cost[color.id] || 0) - stoneDiscount(owned, color.id) - stones[color.id]);
  return wildNeeded <= wild;
};
const stonePay = (card: StoneCard, stones: Record<StoneColor, number>, owned: StoneCard[], wild: number, supply: Record<StoneColor, number>) => {
  const next = { ...stones };
  const nextSupply = { ...supply };
  let wildLeft = wild;
  for (const color of STONE_COLORS) {
    const amount = Math.max(0, (card.cost[color.id] || 0) - stoneDiscount(owned, color.id));
    const paid = Math.min(next[color.id], amount);
    next[color.id] -= paid;
    nextSupply[color.id] += paid;
    wildLeft -= amount - paid;
  }
  return { stones: next, supply: nextSupply, wild: wildLeft };
};
const refillStoneMarket = (market: StoneCard[], deck: StoneCard[]) => {
  const nextMarket = [...market];
  const nextDeck = [...deck];
  if (nextDeck.length > 0 && nextMarket.length < 4) nextMarket.push(nextDeck.shift()!);
  return { market: nextMarket, deck: nextDeck };
};
const advanceStoneCpu = (state: StoneGlowState): StoneGlowState => {
  const next: StoneGlowState = { ...state, stones: { ...state.stones }, supply: { ...state.supply }, cpuStones: { ...state.cpuStones }, selectedTake: [], actionLog: [...state.actionLog] };
  const affordable = next.market.filter(card => stoneCanPay(card, next.cpuStones, next.cpuOwned, 0));
  const chosen = affordable.sort((a, b) => b.points - a.points || b.tier - a.tier)[0];
  if (chosen) {
    const payment = stonePay(chosen, next.cpuStones, next.cpuOwned, 0, next.supply);
    next.cpuStones = payment.stones;
    next.supply = payment.supply;
    next.cpuOwned = [...next.cpuOwned, chosen];
    next.cpuScore += chosen.points;
    next.market = next.market.filter(card => card.id !== chosen.id);
    const refilled = refillStoneMarket(next.market, next.deck);
    next.market = refilled.market; next.deck = refilled.deck;
    next.actionLog.push({ jp: `CPUは「${chosen.name}」を購入しました。`, en: `CPU bought "${chosen.name}".` });
  } else {
    const available = STONE_COLORS.filter(color => next.supply[color.id] > 0).slice(0, 2);
    available.forEach(color => { next.supply[color.id] -= 1; next.cpuStones[color.id] += 1; });
    const labels = available.map(color => color.label).join('・');
    const englishLabels = available.map(color => color.id).join(' and ');
    next.actionLog.push({ jp: `CPUは${labels || '石'}の石を取りました。`, en: `CPU took ${englishLabels || 'stones'}.` });
  }
  next.round += 1;
  if (next.score >= 8) next.result = 'WIN';
  else if (next.cpuScore >= 8 || next.round > 18) next.result = next.score > next.cpuScore ? 'WIN' : 'LOSE';
  if (!next.result) next.actionLog.push({ jp: `ラウンド${next.round}。あなたの手番です。`, en: `Round ${next.round}. Your turn.` });
  next.actionLog = next.actionLog.slice(-20);
  return next;
};

const StoneGlowGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [game, setGame] = useState<StoneGlowState>(createStoneGlowState);
  const restart = () => setGame(createStoneGlowState());
  const canBuy = (card: StoneCard) => stoneCanPay(card, game.stones, game.owned, game.wild);
  const canBuyReserved = (card: StoneCard) => stoneCanPay(card, game.stones, game.owned, game.wild);
  const takeStone = (color: StoneColor) => {
    if (game.result || game.selectedTake.length >= 2 || game.supply[color] <= 0) return;
    if (game.selectedTake[0] === color && game.supply[color] < 4) return;
    setGame(previous => ({ ...previous, selectedTake: [...previous.selectedTake, color] }));
  };
  const cancelTake = () => {
    if (game.result || game.selectedTake.length === 0) return;
    setGame(previous => ({ ...previous, selectedTake: [] }));
  };
  const confirmTake = () => {
    if (game.result || game.selectedTake.length === 0) return;
    setGame(previous => {
      const selectedLabels = previous.selectedTake.map(color => STONE_COLORS.find(item => item.id === color)?.label || color).join('・');
      const selectedEnglishLabels = previous.selectedTake.join(' and ');
      const next: StoneGlowState = {
        ...previous,
        stones: { ...previous.stones },
        supply: { ...previous.supply },
        actionLog: [...previous.actionLog, { jp: `あなたは${selectedLabels}の石を取りました。`, en: `You took ${selectedEnglishLabels} stones.` }],
      };
      previous.selectedTake.forEach(color => { next.supply[color] -= 1; next.stones[color] += 1; });
      return advanceStoneCpu(next);
    });
  };
  const buy = (index: number) => {
    const marketCard = game.market[index];
    if (game.result || !marketCard || !canBuy(marketCard)) return;
    setGame(previous => {
      const card = previous.market[index];
      if (!card || !stoneCanPay(card, previous.stones, previous.owned, previous.wild)) return previous;
      const payment = stonePay(card, previous.stones, previous.owned, previous.wild, previous.supply);
      const next: StoneGlowState = {
        ...previous,
        stones: payment.stones,
        supply: payment.supply,
        wild: payment.wild,
        owned: [...previous.owned, card],
        score: previous.score + card.points,
        actionLog: [...previous.actionLog, { jp: `あなたは「${card.name}」を購入しました。`, en: `You bought "${card.name}".` }],
      };
      next.market = previous.market.filter((_, cardIndex) => cardIndex !== index);
      const refilled = refillStoneMarket(next.market, previous.deck);
      next.market = refilled.market; next.deck = refilled.deck;
      return advanceStoneCpu(next);
    });
    audioService.playSound('select');
  };
  const reserve = (index: number) => {
    if (game.result || game.reserved.length >= 3) return;
    setGame(previous => {
      const card = previous.market[index];
      if (!card || previous.reserved.length >= 3) return previous;
      const gainedWild = previous.wild < 3;
      const next: StoneGlowState = {
        ...previous,
        reserved: [...previous.reserved, card],
        wild: Math.min(3, previous.wild + 1),
        actionLog: [...previous.actionLog, { jp: `あなたは「${card.name}」を予約しました${gainedWild ? '。ワイルド石を1個得ました。' : '。'}`, en: `You reserved "${card.name}"${gainedWild ? ' and gained one wild stone.' : '.'}` }],
      };
      next.market = previous.market.filter((_, cardIndex) => cardIndex !== index);
      const refilled = refillStoneMarket(next.market, previous.deck);
      next.market = refilled.market; next.deck = refilled.deck;
      return advanceStoneCpu(next);
    });
    audioService.playSound('select');
  };
  const buyReserved = (index: number) => {
    if (game.result || !game.reserved[index] || !canBuyReserved(game.reserved[index])) return;
    setGame(previous => {
      const card = previous.reserved[index];
      if (!card || !stoneCanPay(card, previous.stones, previous.owned, previous.wild)) return previous;
      const payment = stonePay(card, previous.stones, previous.owned, previous.wild, previous.supply);
      const next: StoneGlowState = {
        ...previous,
        stones: payment.stones,
        supply: payment.supply,
        wild: payment.wild,
        owned: [...previous.owned, card],
        reserved: previous.reserved.filter((_, cardIndex) => cardIndex !== index),
        score: previous.score + card.points,
        actionLog: [...previous.actionLog, { jp: `予約した「${card.name}」を購入しました。`, en: `You bought your reserved card "${card.name}".` }],
      };
      return advanceStoneCpu(next);
    });
    audioService.playSound('select');
  };
  return (
    <GameShell scope="stone-glow" title={text(languageMode, '石ころの煌めき', 'Stone Glow')} subtitle={text(languageMode, '共通の鉱山から石を取り、割引を育てて先に8点。予約とワイルド石が逆転の鍵。', 'Take stones from a shared mine, build discounts, and reach 8 points first. Reserve cards and wild stones can turn the game around.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/stone-glow.png" badgeAsset="sprites/backgrounds/mini-games/badges/stone-glow.png" onBack={onBack}>
      <ResultBanner result={game.result} onRestart={restart} languageMode={languageMode} />
      <div className="stone-glow-scoreboard mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-950/70 p-2"><div className="text-xs text-emerald-200">{text(languageMode, 'あなた', 'You')}</div><div className="text-2xl font-black">{game.score}<span className="ml-1 text-xs">{text(languageMode, '点', 'pts')}</span></div></div>
        <div className="rounded-xl border border-rose-300/30 bg-rose-950/70 p-2"><div className="text-xs text-rose-200">{text(languageMode, '相手', 'CPU')}</div><div className="text-2xl font-black">{game.cpuScore}<span className="ml-1 text-xs">{text(languageMode, '点', 'pts')}</span></div></div>
        <div className="col-span-2 rounded-xl border border-white/10 bg-slate-900/75 p-2"><div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-300"><span>{text(languageMode, '手持ちの石ころ', 'Your stones')}</span><span className="flex shrink-0 items-center gap-2"><span className="inline-flex items-center gap-1" title={text(languageMode, '獲得カードの割引', 'Owned card discounts')}><span>{text(languageMode, '割引', 'Discounts')}</span>{STONE_COLORS.map(color => <span key={`discount-${color.id}`} className="inline-flex items-center gap-0.5"><span className={`h-2.5 w-2.5 rounded-full ${color.className} shadow`} />{stoneDiscount(game.owned, color.id)}</span>)}</span><span>{text(languageMode, 'ワイルド', 'Wild')} {game.wild}</span></span></div><div className="flex flex-wrap gap-x-3 gap-y-1">{STONE_COLORS.map(color => <div key={color.id} className="flex items-center gap-1 text-sm"><span className={`h-3.5 w-3.5 rounded-full ${color.className} shadow`} />{text(languageMode, color.label, color.id)} {game.stones[color.id]}<span className="text-[10px] text-slate-500">({game.supply[color.id]})</span></div>)}</div></div>
      </div>
      <div className="stone-glow-main-grid mb-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_220px]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/85 p-2 shadow-xl sm:p-3">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-black text-emerald-200">{text(languageMode, '公開鉱山カード', 'Open mine cards')}</h2><span className="text-xs text-slate-400">{text(languageMode, 'ラウンド', 'Round')} {game.round}</span></div>
          <div className="stone-glow-market grid gap-2 sm:grid-cols-2">
            {game.market.map((card, index) => <article key={card.id} className={`stone-glow-market-card rounded-xl border p-2 transition ${STONE_BONUS_CARD_CLASSES[card.bonus]} ${canBuy(card) && !game.result ? 'ring-1 ring-emerald-200/65' : ''}`}>
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-black">{card.name}</div><div className="text-[10px] text-slate-400">{text(languageMode, `レベル${card.tier}`, `Tier ${card.tier}`)}</div></div><span className="shrink-0 text-yellow-300">★{card.points}</span></div>
              <div className="my-1.5 flex flex-wrap gap-x-2 gap-y-1">{STONE_COLORS.map(color => card.cost[color.id] ? <span key={color.id} className="text-xs"><span className={`mr-1 inline-block h-3 w-3 rounded-full ${color.className}`} />{Math.max(0, (card.cost[color.id] || 0) - stoneDiscount(game.owned, color.id))}</span> : null)}</div>
              <div className="mb-2 flex items-center gap-1 text-[11px] text-slate-200"><span className={`inline-block h-2.5 w-2.5 rounded-full ${STONE_COLORS.find(color => color.id === card.bonus)?.className || ''}`} />{text(languageMode, '割引：', 'Bonus: ')}{text(languageMode, STONE_COLORS.find(color => color.id === card.bonus)?.label || '', card.bonus)}</div>
              <div className="flex gap-2"><button type="button" onClick={() => buy(index)} disabled={!!game.result || !canBuy(card)} data-gamepad-zone="stone-market" data-gamepad-order={index * 2} className="flex-1 rounded-lg bg-emerald-600/80 px-2 py-1.5 text-xs font-black hover:bg-emerald-500 disabled:opacity-35">{text(languageMode, '購入', 'Buy')}</button><button type="button" onClick={() => reserve(index)} disabled={!!game.result || game.reserved.length >= 3} data-gamepad-zone="stone-market" data-gamepad-order={index * 2 + 1} className="rounded-lg border border-amber-300/40 px-2 py-1.5 text-xs font-black text-amber-100 hover:bg-amber-900/60 disabled:opacity-35">{text(languageMode, '予約', 'Reserve')}</button></div>
            </article>)}
          </div>
        </section>
        <aside className="flex flex-col gap-2 rounded-2xl border border-sky-300/20 bg-slate-900/85 p-3">
          <div className="text-sm font-black text-sky-200">{text(languageMode, 'あなたの手番', 'Your turn')}</div>
          <div className="text-xs leading-5 text-slate-300">{text(languageMode, '異なる色を2個、または同じ色を2個選びます。同じ色は供給が4個以上の時だけ取れます。', 'Take two different colors, or two of the same color when at least four remain in the mine.')}</div>
          <div className="grid grid-cols-2 gap-2">{STONE_COLORS.map(color => <button key={color.id} type="button" onClick={() => takeStone(color.id)} disabled={!!game.result || game.selectedTake.length >= 2 || game.supply[color.id] <= 0} data-gamepad-zone="stone-take" data-gamepad-order={STONE_COLORS.indexOf(color)} className={`rounded-lg border px-2 py-2 text-xs font-black transition ${game.selectedTake.includes(color.id) ? `${color.className} border-white text-slate-950` : 'border-white/15 bg-white/5 hover:bg-white/10'} disabled:opacity-35`}>{text(languageMode, color.label, color.id)} +1</button>)}</div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-2 text-center text-sm">{text(languageMode, '選択中：', 'Selected: ')}{game.selectedTake.length ? game.selectedTake.map(color => text(languageMode, STONE_COLORS.find(item => item.id === color)?.label || '', color)).join('・') : text(languageMode, 'なし', 'none')}</div>
          <div className="flex gap-2"><button type="button" onClick={confirmTake} disabled={!!game.result || game.selectedTake.length === 0} data-gamepad-zone="stone-actions" data-gamepad-order={0} className="flex-1 rounded-xl border border-sky-300/40 bg-sky-700/80 px-2 py-2.5 text-sm font-black hover:bg-sky-600 disabled:opacity-35">{text(languageMode, '石を確定して取る', 'Confirm take')}</button><button type="button" onClick={cancelTake} disabled={!!game.result || game.selectedTake.length === 0} data-gamepad-zone="stone-actions" data-gamepad-order={1} className="rounded-xl border border-white/20 bg-white/10 px-2 py-2.5 text-xs font-black text-slate-100 hover:bg-white/20 disabled:opacity-35">{text(languageMode, 'キャンセル', 'Cancel')}</button></div>
          <section className="stone-glow-log rounded-lg border border-white/10 bg-black/20 p-2"><div className="mb-1 text-xs font-black text-slate-200">{text(languageMode, '行動ログ', 'Action log')}</div><div className="space-y-1">{game.actionLog.slice(-7).reverse().map((entry, index) => <div key={`${entry.jp}-${index}`} className="text-[11px] leading-4 text-slate-300">{copyText(languageMode, entry)}</div>)}</div></section>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-slate-300">{text(languageMode, '予約は最大3枚。予約時にワイルド石を1個得ます。', 'You may reserve up to 3 cards. Reserving grants one wild stone.')}</div>
        </aside>
      </div>
      <section className="stone-glow-reserved mb-2 rounded-2xl border border-amber-300/25 bg-amber-950/35 p-2 sm:p-3"><div className="mb-2 flex items-center justify-between"><h2 className="font-black text-amber-100">{text(languageMode, '予約中の鉱山カード', 'Reserved mine cards')}</h2><span className="text-xs text-amber-200">{game.reserved.length}/3</span></div>{game.reserved.length ? <div className="grid gap-2 sm:grid-cols-3">{game.reserved.map((card, index) => <article key={card.id} className={`rounded-xl border p-2 ${STONE_BONUS_CARD_CLASSES[card.bonus]}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0 truncate text-sm font-black">{card.name}</div><span className="shrink-0 text-yellow-300">★{card.points}</span></div><div className="my-1 flex flex-wrap gap-2">{STONE_COLORS.map(color => card.cost[color.id] ? <span key={color.id} className="text-[11px]"><span className={`mr-1 inline-block h-2.5 w-2.5 rounded-full ${color.className}`} />{Math.max(0, (card.cost[color.id] || 0) - stoneDiscount(game.owned, color.id))}</span> : null)}</div><button type="button" onClick={() => buyReserved(index)} disabled={!!game.result || !canBuyReserved(card)} data-gamepad-zone="stone-reserved" data-gamepad-order={index} className="w-full rounded-lg bg-amber-500/80 px-2 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400 disabled:opacity-35">{text(languageMode, '予約カードを購入（1ターン）', 'Buy reserved card (1 turn)')}</button></article>)}</div> : <div className="rounded-xl border border-white/10 bg-black/15 p-2 text-xs text-amber-100/75">{text(languageMode, '予約したカードはここに表示され、あなたの手番に購入できます。', 'Reserved cards appear here and can be bought during your turn.')}</div>}</section>
      <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs text-slate-300">{text(languageMode, '獲得カード：', 'Owned cards: ')}{game.owned.length ? game.owned.map(card => card.name).join('、') : text(languageMode, 'まだありません', 'None yet')}</div><div className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs text-slate-400">{text(languageMode, '山札残り：', 'Cards remaining: ')}{game.deck.length}</div></div>
    </GameShell>
  );
};

const copy = (jp: string, en: string): LocalCopy => ({ jp, en });
const copyText = (languageMode: LanguageMode, value: LocalCopy) => text(languageMode, value.jp, value.en);
const MINI_GAME_RULES: Record<string, MiniGameRules> = {
  'stone-glow': {
    summary: copy('石ころを集めて鉱山カードを購入し、割引を育てる対戦ゲームです。', 'Collect stones, buy mine cards, and grow permanent discounts.'),
    goal: copy('先に8点を取る。18ラウンドで決着しない時は、点数の高い方が勝ち。', 'Reach 8 points first. If 18 rounds pass, the higher score wins.'),
    steps: [copy('公開カードのコストを確認する。色ごとの丸は必要な石の数です。', 'Check the open cards. Each colored gem shows a cost.'), copy('異なる色を2個、または供給が4個以上残る色を同じ2個取る。', 'Take two different colors, or two of one color when at least four remain.'), copy('購入カードは次から割引として働く。取れないカードは予約でき、ワイルド石を1個得る。', 'Purchased cards become discounts. Reserve an unreachable card to gain one wild stone.'), copy('「購入」または「石を確定して取る」で手番を終える。', 'End your turn with Buy or Confirm take.')],
    tip: copy('まず同じ色の割引がつながるカードを選ぶと、後半に高得点カードを買いやすくなります。', 'Build one color of discounts early so expensive cards become easier later.'),
  },
  'school-trpg': {
    summary: copy('放課後の学校を探索し、能力と運命ポイントを使って謎を解くダイスTRPGです。', 'Explore school after hours and solve a mystery with stats, dice, and Fate points.'),
    goal: copy('5つの場面を乗り越え、手がかりを3つ集めて真相にたどり着く。', 'Clear five scenes and collect three clues to reach the truth.'),
    steps: [copy('場面ごとに行動を選ぶ。表示された能力値に1d6を足して判定する。', 'Choose an action. Add 1d6 to the shown stat for the check.'), copy('判定に成功すると手がかりや能力成長を得る。失敗するとストレスが増える。', 'Success grants clues or growth; failure increases stress.'), copy('運命ポイントを使うと判定に+2。ここぞという場面まで温存できる。', 'Spend a Fate point for +2, or save it for a crucial scene.'), copy('最後は手がかりとストレスに応じて結末が分岐する。', 'Your ending branches based on clues and stress.')],
    tip: copy('友情と勇気は物語を進め、学力は暗号、体力は無理のある行動を支えます。', 'Friendship and courage advance the story; study cracks codes, while energy supports risky actions.'),
  },
  'learning-tcg': {
    summary: copy('学習ローグのカードを使い、エナジー配分と防御の判断で敵を倒す1人用TCG風バトルです。', 'Use Learning Rogue cards in a solo TCG-style battle built around energy and defense.'),
    goal: copy('敵のHPを0にする。自分のHPが0になる前に、攻撃と防御の順番を組み立てる。', 'Reduce the enemy HP to 0 while keeping your own HP above 0.'),
    steps: [copy('ターン開始時に5枚引き、左上のエナジーを確認する。', 'Draw five cards at the start of a turn and check your energy.'), copy('手札を複数枚使える。攻撃は敵HP、防御は自分のブロックを増やす。', 'Play multiple cards. Attacks reduce enemy HP; defense adds block.'), copy('カードごとのエナジーを支払って、残りエナジーを0に近づける。', 'Pay each card’s energy cost and use the turn efficiently.'), copy('「ターン終了」で敵の意図に対応し、次の5枚へ進む。', 'End the turn to resolve the enemy intent and draw the next five.')],
    tip: copy('敵の攻撃予定が大きい時は防御を先に。弱体・脆弱を重ねると少ないエナジーでも伸びます。', 'Block first when the enemy intent is high. Weak and Vulnerable make small energy budgets go further.'),
  },
  shogi: {
    summary: copy('5×5の盤で駒を動かし、取った駒を持ち駒として打てるミニ将棋です。', 'Move pieces on a 5x5 board and drop captured pieces back into play.'),
    goal: copy('相手の玉を取る。相手陣の2段に入った駒は一部が自動で成る。', 'Capture the enemy king. Some pieces auto-promote in the enemy camp.'),
    steps: [copy('自分の駒を選び、動けるマスを選ぶ。相手の駒を取ると持ち駒になる。', 'Select a piece and a legal destination. Captured pieces go to your hand.'), copy('持ち駒を選ぶと、空いたマスへ打てる。', 'Select a held piece to drop it on an empty square.'), copy('歩は同じ筋に2枚置けず、歩・銀・角・飛は敵陣で成る。', 'Two unpromoted pawns cannot share a file; pawn, silver, bishop, and rook promote in the camp.'), copy('玉を詰める前に、相手の次の攻め筋も確認する。', 'Watch the opponent’s next attack before committing to a capture.')],
    tip: copy('持ち駒は盤上の駒よりも自由度が高いので、取った駒をすぐに打たず攻めの形を考えます。', 'Held pieces are flexible; consider the attacking shape before dropping them immediately.'),
  },
  go: {
    summary: copy('9路盤に黒と白の石を交互に置き、石のつながりと陣地を競う囲碁です。', 'Place black and white stones on a 9x9 board and compete for groups and territory.'),
    goal: copy('2回連続パスで終局。取った石と囲んだ陣地の合計が高い方が勝ち。', 'Two consecutive passes end the game. Captures plus surrounded territory decide the winner.'),
    steps: [copy('空いている交点に石を置く。上下左右でつながる石の呼吸点がなくなると取られる。', 'Place a stone on an empty intersection. A group is captured when it has no adjacent liberties.'), copy('自分の石を自殺させる手と、直前の盤面に戻るコウは禁止。', 'Suicide moves and immediate repetition of the previous board (ko) are illegal.'), copy('置けない時はパス。お互いにパスすると終局して簡易地計算を行う。', 'Pass when needed. Two passes end the game and trigger simplified territory scoring.')],
    tip: copy('最初は中央を広げ、相手の石を囲むより自分の石の呼吸点を増やすことを意識します。', 'Start by expanding toward the center and keep your own groups connected with liberties.'),
  },
  chess: {
    summary: copy('駒の動きと王の安全を学びながら、合法手で相手のキングを詰ませるチェスです。', 'Learn piece movement and king safety while checkmating the enemy king with legal moves.'),
    goal: copy('相手のキングをチェックメイトする。ポーンは最奥段でクイーンに昇格する。', 'Checkmate the enemy king. Pawns promote to a queen on the last rank.'),
    steps: [copy('自分の駒を選び、移動先を選ぶ。自分のキングが攻撃される手は選べない。', 'Select a piece and destination. A move leaving your king attacked is illegal.'), copy('ナイトは飛び越え、ビショップは斜め、ルークは縦横、クイーンは両方に動く。', 'Knights jump; bishops move diagonally; rooks move straight; queens do both.'), copy('相手のキングに攻撃が届くとチェック。逃げ道がなければ勝利。', 'An attacked king is in check; no legal escape means victory.'), copy('相手の攻撃予定を見て、駒をただ取るだけでなく王の安全を優先する。', 'Read the opponent’s threats and prioritize king safety over casual captures.')],
    tip: copy('序盤は中央のポーンとナイトを動かし、キングの周りに逃げ道を残します。', 'Develop central pawns and knights early, and keep escape squares around your king.'),
  },
  mahjong: {
    summary: copy('牌を入れ替えながら、順子・刻子の面子と対子をそろえる学習向け麻雀です。', 'Swap tiles to build sequences, triplets, and a pair in this learning mahjong game.'),
    goal: copy('8枚の手牌で面子2つ＋対子1つを完成させる。役の知識は次の一手を選ぶヒントになる。', 'Complete two melds plus one pair with eight tiles. Yaku knowledge guides your next discard.'),
    steps: [copy('捨てたい牌を選ぶと、1枚引いて手牌が入れ替わる。', 'Select a tile to discard, then draw one replacement.'), copy('順子は同じ種類の連番3枚、刻子は同じ牌3枚、対子は同じ牌2枚。', 'A sequence is three consecutive tiles; a triplet is three identical tiles; a pair is two identical tiles.'), copy('「牌を整理」で種類・数字順に並べ替え、「役を見る」で役の意味を確認する。', 'Use Sort tiles to order the hand and View yaku to learn yaku meanings.'), copy('おすすめ役のヒントを見て、不要な字牌や端牌から整理する。', 'Follow the recommended-yaku hint and trim isolated honors or terminals first.')],
    tip: copy('まずはタンヤオ風に2〜8の数牌を集めると、順子が作りやすくなります。', 'Start with a Tanyao-style plan: keep number tiles 2–8 to make sequences more easily.'),
  },
};
type TrpgStat = 'study' | 'energy' | 'friendship' | 'courage';
const TRPG_STATS: Array<{ id: TrpgStat; label: LocalCopy; className: string }> = [
  { id: 'study', label: copy('学力', 'Study'), className: 'text-cyan-200' },
  { id: 'energy', label: copy('体力', 'Energy'), className: 'text-rose-200' },
  { id: 'friendship', label: copy('友情', 'Friendship'), className: 'text-emerald-200' },
  { id: 'courage', label: copy('勇気', 'Courage'), className: 'text-amber-200' },
];
type TrpgChoice = { label: LocalCopy; stat: TrpgStat; difficulty: number; success: LocalCopy; failure: LocalCopy; clue: number; stress: number };
type TrpgScene = { title: LocalCopy; text: LocalCopy; choices: TrpgChoice[] };
const TRPG_SCENES: TrpgScene[] = [
  { title: copy('朝の教室', 'Morning Classroom'), text: copy('黒板に見慣れない暗号が残っている。始業ベルまであと少し。', 'A strange code is left on the blackboard. The first bell is almost here.'), choices: [{ label: copy('ノートを開いて読み解く', 'Decode it with your notebook'), stat: 'study', difficulty: 5, success: copy('暗号の規則が見えた！', 'You spot the code pattern!'), failure: copy('文字が踊って見える……。', 'The letters dance on the page...'), clue: 1, stress: 0 }, { label: copy('クラスメイトに声をかける', 'Ask a classmate for help'), stat: 'friendship', difficulty: 4, success: copy('二人なら手がかりを見つけられた！', 'Together, you find a clue!'), failure: copy('みんな急いでいて話を聞けなかった。', 'Everyone is too busy to listen.'), clue: 1, stress: 0 }] },
  { title: copy('昼休みの廊下', 'Lunch-Break Hallway'), text: copy('屋上へ続く鍵を拾った。そこには立入禁止の張り紙がある。', 'You find a key to the roof beneath a no-entry sign.'), choices: [{ label: copy('先生に正直に届ける', 'Hand it to a teacher'), stat: 'courage', difficulty: 4, success: copy('先生から秘密の依頼を受けた！', 'The teacher gives you a secret assignment!'), failure: copy('先生は忙しそうで、出直すことになった。', 'The teacher is too busy; you must try again later.'), clue: 1, stress: 0 }, { label: copy('友だちと屋上を調べる', 'Investigate the roof with friends'), stat: 'energy', difficulty: 5, success: copy('風に飛ばされた手紙をつかんだ！', 'You catch a letter before the wind takes it!'), failure: copy('階段を上るだけで息が切れた。', 'The stairs leave you out of breath.'), clue: 0, stress: 1 }] },
  { title: copy('図書室の隠し棚', 'Hidden Shelf in the Library'), text: copy('手紙には「最後の答えは音楽室」とある。閉館時間が迫る。', 'The letter says, “The final answer is in the music room.” Closing time is near.'), choices: [{ label: copy('資料を調べて裏を取る', 'Verify it in the archives'), stat: 'study', difficulty: 6, success: copy('古い校歌に答えの場所が記されていた！', 'An old school song reveals the location!'), failure: copy('本の山に埋もれて時間を使った。', 'The pile of books eats up your time.'), clue: 1, stress: 1 }, { label: copy('仲間を信じて走る', 'Trust your friends and run'), stat: 'friendship', difficulty: 5, success: copy('みんなが先回りして道を開けてくれた！', 'Your friends clear a path ahead!'), failure: copy('集合場所を間違えてしまった。', 'You go to the wrong meeting spot.'), clue: 1, stress: 0 }] },
  { title: copy('音楽室の謎', 'The Music-Room Mystery'), text: copy('ピアノの上に、学校の七不思議を解く最後の箱がある。', 'The final box for solving the school mystery rests on the piano.'), choices: [{ label: copy('箱の仕掛けに挑戦する', 'Try the box mechanism'), stat: 'courage', difficulty: 6, success: copy('カチリ。箱の中から校章が現れた！', 'Click. The school emblem appears inside!'), failure: copy('仕掛けが固くて開かない。', 'The mechanism will not budge.'), clue: 1, stress: 1 }, { label: copy('みんなで合唱してみる', 'Sing together'), stat: 'friendship', difficulty: 5, success: copy('歌声に反応して箱が開いた！', 'The box opens to your singing!'), failure: copy('声がそろわず、作戦を練り直す。', 'The voices do not match, so you regroup.'), clue: 1, stress: 0 }] },
  { title: copy('放課後の校庭', 'After-School Courtyard'), text: copy('校章を元の場所へ戻せば、今日の謎は解決する。最後の一歩だ。', 'Return the emblem to its place to solve the mystery. One last step.'), choices: [{ label: copy('校長室へ正面から向かう', 'Walk straight to the principal’s office'), stat: 'courage', difficulty: 6, success: copy('校長は笑って、君たちを探偵団に任命した！', 'The principal smiles and names you the school detective club!'), failure: copy('廊下で呼び止められ、時間を失った。', 'You are stopped in the hall and lose precious time.'), clue: 1, stress: 1 }, { label: copy('みんなで作戦を分担する', 'Split the plan among everyone'), stat: 'friendship', difficulty: 5, success: copy('役割分担が完璧で、秘密を守りきった！', 'Perfect teamwork keeps the secret safe!'), failure: copy('作戦が重なり、少し混乱してしまった。', 'The plans overlap and cause confusion.'), clue: 1, stress: 0 }] },
];
type TrpgLog = { stat: TrpgStat; statValue: number; fateBonus: number; roll: number; total: number; success: boolean; copy: LocalCopy };
type TrpgState = { sceneIndex: number; stats: Record<TrpgStat, number>; clues: number; stress: number; fate: number; lastRoll: number | null; logs: TrpgLog[]; result: 'WIN' | 'LOSE' | null; ending: LocalCopy | null };
const createTrpgState = (): TrpgState => ({ sceneIndex: 0, stats: { study: 2, energy: 2, friendship: 2, courage: 2 }, clues: 0, stress: 0, fate: 2, lastRoll: null, logs: [], result: null, ending: null });

const SchoolTrpgGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [game, setGame] = useState<TrpgState>(createTrpgState);
  const [useFate, setUseFate] = useState(false);
  const restart = () => { setGame(createTrpgState()); setUseFate(false); };
  const choose = (choice: TrpgChoice) => {
    if (game.result) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    const fateBonus = useFate && game.fate > 0 ? 2 : 0;
    const total = roll + game.stats[choice.stat] + fateBonus;
    const success = total >= choice.difficulty;
    const nextStats = { ...game.stats, [choice.stat]: game.stats[choice.stat] + (success ? 1 : 0) };
    const nextClues = Math.min(5, game.clues + (success ? choice.clue : 0));
    const nextStress = Math.min(6, game.stress + (success ? 0 : choice.stress + 1));
    const nextScene = game.sceneIndex + 1;
    const isFinal = game.sceneIndex >= TRPG_SCENES.length - 1;
    const cleared = nextClues >= 3 && nextStress <= 5;
    const ending = isFinal ? (cleared ? copy('学校の謎を解き、放課後探偵団が始まった！', 'You solve the school mystery and establish the After-School Detective Club!') : copy('謎は残ったが、仲間と過ごした一日は忘れられない。', 'The mystery remains, but the day with your friends is unforgettable.')) : null;
    setGame(previous => ({ ...previous, sceneIndex: Math.min(nextScene, TRPG_SCENES.length - 1), stats: nextStats, clues: nextClues, stress: nextStress, fate: Math.max(0, previous.fate - (useFate ? 1 : 0)) + (success ? 0 : 1), lastRoll: roll, logs: [...previous.logs.slice(-3), { stat: choice.stat, statValue: game.stats[choice.stat], fateBonus, roll, total, success, copy: success ? choice.success : choice.failure }], result: isFinal ? (cleared ? 'WIN' : 'LOSE') : null, ending }));
    setUseFate(false);
    audioService.playSound(success ? 'correct' : 'wrong');
  };
  const scene = TRPG_SCENES[game.sceneIndex];
  return (
    <GameShell scope="school-trpg" title={text(languageMode, '放課後スクールTRPG', 'After-School School TRPG')} subtitle={text(languageMode, 'd6判定、成長、運命ポイント、分岐する結末で学校の謎を解こう。', 'Solve a school mystery with d6 checks, growth, fate points, and branching outcomes.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/school-trpg.png" badgeAsset="sprites/backgrounds/mini-games/badges/school-trpg.png" onBack={onBack}>
      <ResultBanner result={game.result} onRestart={restart} languageMode={languageMode} />
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{TRPG_STATS.map(stat => <div key={stat.id} className="rounded-xl border border-amber-300/20 bg-amber-950/55 p-2 text-center"><div className={`text-[11px] ${stat.className}`}>{copyText(languageMode, stat.label)}</div><div className="text-xl font-black">{game.stats[stat.id]}</div></div>)}</div>
      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg border border-cyan-300/20 bg-cyan-950/50 p-2">{text(languageMode, '手がかり', 'Clues')}<strong className="ml-1 text-cyan-100">{game.clues} / 3</strong></div><div className="rounded-lg border border-rose-300/20 bg-rose-950/50 p-2">{text(languageMode, '疲労', 'Stress')}<strong className="ml-1 text-rose-100">{game.stress} / 6</strong></div><div className="rounded-lg border border-violet-300/20 bg-violet-950/50 p-2">{text(languageMode, '運命', 'Fate')}<strong className="ml-1 text-violet-100">{game.fate}</strong></div></div>
      <section className="flex flex-1 flex-col rounded-2xl border border-amber-300/25 bg-slate-900/85 p-4 shadow-xl"><div className="mb-2 flex items-center justify-between"><h2 className="text-xl font-black text-amber-100">{copyText(languageMode, scene.title)}</h2><span className="text-xs text-slate-400">{text(languageMode, '場面', 'Scene')} {game.sceneIndex + 1} / {TRPG_SCENES.length}</span></div><p className="mb-4 rounded-xl bg-black/25 p-4 leading-7 text-slate-100">{copyText(languageMode, scene.text)}</p><div className="mb-3 flex items-center justify-between rounded-xl border border-violet-300/20 bg-violet-950/35 p-3 text-xs text-violet-100"><span>{text(languageMode, '判定前に運命を使うと+2。失敗すると運命が1戻る。', 'Spend Fate before a check for +2. Failed checks restore one Fate.')}</span><button type="button" onClick={() => setUseFate(previous => !previous)} disabled={game.fate <= 0 || !!game.result} data-gamepad-zone="trpg-tools" data-gamepad-order={0} className={`ml-2 shrink-0 rounded-lg px-3 py-2 font-black ${useFate ? 'bg-violet-400 text-slate-950' : 'border border-violet-300/40 bg-violet-900/50'} disabled:opacity-35`}>{useFate ? text(languageMode, '使用中', 'Ready') : text(languageMode, '運命+2', 'Use Fate')}</button></div><div className="grid gap-2 sm:grid-cols-2">{scene.choices.map((choice, index) => <button key={choice.label.jp} type="button" onClick={() => choose(choice)} disabled={!!game.result} data-gamepad-zone="trpg-choices" data-gamepad-order={index} className="rounded-xl border border-amber-300/30 bg-amber-900/30 p-3 text-left font-bold transition hover:bg-amber-800/50 disabled:opacity-40"><span className="mr-2 text-amber-300">{index + 1}.</span>{copyText(languageMode, choice.label)}<span className="mt-1 block text-xs font-normal text-slate-300">{text(languageMode, '使う力：', 'Check: ')}{copyText(languageMode, TRPG_STATS.find(stat => stat.id === choice.stat)!.label)} / {text(languageMode, '目標', 'Target')} {choice.difficulty}</span></button>)}</div>{game.lastRoll !== null && <div className="mt-4 text-sm text-amber-200">{text(languageMode, '直前のダイス：', 'Last roll: ')}{game.lastRoll}</div>}{game.ending && <div className={`mt-4 rounded-xl border p-3 font-black ${game.result === 'WIN' ? 'border-emerald-300/40 bg-emerald-950/45 text-emerald-100' : 'border-rose-300/40 bg-rose-950/45 text-rose-100'}`}>{copyText(languageMode, game.ending)}</div>}<div className="mt-4 space-y-1 text-xs text-slate-300">{game.logs.map((log, index) => <div key={`${log.roll}-${index}`}>🎲 {copyText(languageMode, TRPG_STATS.find(stat => stat.id === log.stat)!.label)} {log.roll} + {log.statValue}{log.fateBonus ? ` + ${log.fateBonus}` : ''} = {log.total} ／ {copyText(languageMode, log.copy)}</div>)}</div></section>
    </GameShell>
  );
};

const TCG_CARD_IDS = ['STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'BASH', 'NEUTRALIZE', 'IRON_WAVE', 'HEADBUTT', 'THUNDERCLAP', 'SHRUG_IT_OFF', 'DEFLECT', 'CHARGE_BATTERY', 'TWIN_STRIKE', 'QUICK_SLASH'];
const createTcgCard = (id: string, index: number): CardType => ({ ...CARDS_LIBRARY[id], id: `trivia-tcg-${id}-${index}` } as CardType);
const shuffleTcg = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
type TcgLog = LocalCopy;
type LearningTcgState = {
  deck: CardType[];
  hand: CardType[];
  discard: CardType[];
  energy: number;
  playerHp: number;
  cpuHp: number;
  block: number;
  cpuBlock: number;
  enemyIntent: number;
  enemyVulnerable: number;
  enemyWeak: number;
  playerWeak: number;
  nextEnergy: number;
  turn: number;
  logs: TcgLog[];
  result: 'WIN' | 'LOSE' | null;
};
const drawTcgCards = (deck: CardType[], hand: CardType[], discard: CardType[], amount: number) => {
  const nextDeck = [...deck]; const nextHand = [...hand]; let nextDiscard = [...discard];
  for (let index = 0; index < amount; index += 1) {
    if (nextHand.length >= 10) break;
    if (nextDeck.length === 0 && nextDiscard.length > 0) { nextDeck.push(...shuffleTcg(nextDiscard)); nextDiscard = []; }
    const card = nextDeck.shift(); if (card) nextHand.push(card);
  }
  return { deck: nextDeck, hand: nextHand, discard: nextDiscard };
};
const createLearningTcgState = (): LearningTcgState => {
  const cards = shuffleTcg(TCG_CARD_IDS.map((id, index) => createTcgCard(id, index)));
  const drawn = drawTcgCards(cards, [], [], 5);
  return { deck: drawn.deck, hand: drawn.hand, discard: [], energy: 3, playerHp: 45, cpuHp: 45, block: 0, cpuBlock: 0, enemyIntent: 7, enemyVulnerable: 0, enemyWeak: 0, playerWeak: 0, nextEnergy: 0, turn: 1, logs: [copy('戦闘開始。手札からカードを何枚でも使い、最後にターン終了を押そう。', 'Battle start. Play as many cards as you can, then press End Turn.')], result: null };
};

const LearningTcgGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [game, setGame] = useState<LearningTcgState>(createLearningTcgState);
  const restart = () => setGame(createLearningTcgState());
  const playCard = (card: CardType) => {
    if (game.result || card.cost > game.energy) return;
    setGame(previous => {
      const nextHand = previous.hand.filter(item => item.id !== card.id);
      let nextDiscard = card.exhaust ? previous.discard : [...previous.discard, card];
      const next = { ...previous, hand: nextHand, discard: nextDiscard, energy: Math.min(3, previous.energy - card.cost + (card.energy || 0)), block: previous.block + (card.block || 0), enemyVulnerable: Math.max(previous.enemyVulnerable, card.vulnerable || 0), enemyWeak: Math.max(previous.enemyWeak, card.weak || 0), nextEnergy: previous.nextEnergy + (card.nextTurnEnergy || 0) };
      let rawDamage = card.damage || 0;
      if (card.damageBasedOnBlock) rawDamage = previous.block;
      const hits = 1 + (card.playCopies || 0);
      rawDamage *= hits;
      if (previous.playerWeak > 0) rawDamage = Math.floor(rawDamage * 0.75);
      if (previous.enemyVulnerable > 0) rawDamage = Math.ceil(rawDamage * 1.5);
      const dealt = Math.max(0, rawDamage - next.cpuBlock);
      next.cpuBlock = Math.max(0, next.cpuBlock - rawDamage);
      next.cpuHp = Math.max(0, previous.cpuHp - dealt);
      const drawn = drawTcgCards(previous.deck, next.hand, nextDiscard, card.draw || 0);
      next.deck = drawn.deck; next.hand = drawn.hand; nextDiscard = drawn.discard; next.discard = nextDiscard;
      next.logs = [...previous.logs.slice(-3), copy(`${card.name}を使い、${dealt}ダメージ。`, `A card deals ${dealt} damage.`)];
      if (next.cpuHp <= 0) next.result = 'WIN';
      return next;
    });
    audioService.playSound('select');
  };
  const endTurn = () => {
    if (game.result) return;
    setGame(previous => {
      const incomingBase = previous.enemyWeak > 0 ? Math.floor(previous.enemyIntent * 0.75) : previous.enemyIntent;
      const incoming = Math.max(0, incomingBase - previous.block);
      const nextPlayerHp = Math.max(0, previous.playerHp - incoming);
      const discard = [...previous.discard, ...previous.hand];
      const drawn = drawTcgCards(previous.deck, [], discard, 5);
      const nextTurn = previous.turn + 1;
      const next = { ...previous, deck: drawn.deck, hand: drawn.hand, discard: drawn.discard, energy: 3 + previous.nextEnergy, playerHp: nextPlayerHp, block: 0, enemyIntent: 6 + ((nextTurn * 3) % 6), enemyVulnerable: Math.max(0, previous.enemyVulnerable - 1), enemyWeak: Math.max(0, previous.enemyWeak - 1), playerWeak: Math.max(0, previous.playerWeak - 1), nextEnergy: 0, turn: nextTurn, logs: [...previous.logs.slice(-3), copy(`相手の攻撃${incomingBase}を受け、${incoming}ダメージ。`, `The enemy attacks for ${incomingBase}; you take ${incoming} damage.`)] };
      if (next.playerHp <= 0) next.result = 'LOSE';
      return next;
    });
    audioService.playSound('select');
  };
  return (
    <GameShell scope="learning-tcg" title={text(languageMode, '学習ローグTCG', 'Learning Rogue TCG')} subtitle={text(languageMode, '毎ターン5枚を引き、エナジーを配分して攻撃と防御を組み立てる。', 'Draw five cards each turn and spend energy to balance offense and defense.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/learning-tcg.png" badgeAsset="sprites/backgrounds/mini-games/badges/learning-tcg.png" onBack={onBack}>
      <ResultBanner result={game.result} onRestart={restart} languageMode={languageMode} />
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl border border-cyan-300/30 bg-cyan-950/70 p-3"><div className="text-xs text-cyan-200">{text(languageMode, 'あなた HP', 'Your HP')}</div><div className="text-2xl font-black">{game.playerHp} <span className="text-xs">/ 45</span></div><div className="text-xs text-slate-300">{text(languageMode, 'ブロック', 'Block')} {game.block}</div></div><div className="rounded-xl border border-rose-300/30 bg-rose-950/70 p-3"><div className="text-xs text-rose-200">{text(languageMode, '相手 HP', 'CPU HP')}</div><div className="text-2xl font-black">{game.cpuHp} <span className="text-xs">/ 45</span></div><div className="text-xs text-slate-300">{text(languageMode, '相手ブロック', 'Enemy block')} {game.cpuBlock}</div></div><div className="rounded-xl border border-violet-300/30 bg-violet-950/60 p-3"><div className="text-xs text-violet-200">{text(languageMode, 'エナジー', 'Energy')}</div><div className="text-2xl font-black">{game.energy} / 3</div><div className="text-xs text-slate-300">{text(languageMode, 'ターン', 'Turn')} {game.turn}</div></div><div className="rounded-xl border border-amber-300/30 bg-amber-950/60 p-3"><div className="text-xs text-amber-200">{text(languageMode, '次の攻撃', 'Next attack')}</div><div className="text-2xl font-black">{game.enemyIntent}</div><div className="text-xs text-slate-300">{text(languageMode, '弱体化', 'Weak')} {game.enemyWeak}</div></div></div>
      <section className="flex flex-1 flex-col rounded-2xl border border-violet-300/25 bg-slate-900/85 p-3"><div className="mb-2 flex items-center justify-between gap-2"><h2 className="font-black text-violet-100">{text(languageMode, 'あなたの手札', 'Your hand')} <span className="text-xs font-normal text-slate-400">{game.hand.length} / 10</span></h2><button type="button" onClick={endTurn} disabled={!!game.result} data-gamepad-zone="tcg-actions" data-gamepad-order={0} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black hover:bg-violet-500 disabled:opacity-35">{text(languageMode, 'ターン終了', 'End turn')}</button></div><p className="mb-3 text-xs text-slate-300">{text(languageMode, 'カードは何枚でも使用可能。ブロックは相手の攻撃を防ぎ、弱体・びくびくは次の数ターンに効く。', 'Play multiple cards. Block stops the next attack; Weak and Vulnerable affect upcoming turns.')}</p><div className="flex flex-wrap justify-center gap-2 pb-2">{game.hand.map((card, index) => <Card key={card.id} card={card} onClick={() => playCard(card)} disabled={!!game.result || card.cost > game.energy} languageMode={languageMode} gamepadZone="tcg-hand" gamepadOrder={index + 1} />)}</div><div className="mt-2 space-y-1 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">{game.logs.map((log, index) => <div key={`${log.jp}-${index}`}>{copyText(languageMode, log)}</div>)}</div></section>
    </GameShell>
  );
};

type ShogiBaseKind = 'K' | 'R' | 'B' | 'G' | 'S' | 'P';
type ShogiPiece = { kind: ShogiBaseKind; side: 'P' | 'C'; promoted?: boolean };
type ShogiBoard = Array<Array<ShogiPiece | null>>;
type ShogiHands = Record<'P' | 'C', Partial<Record<ShogiBaseKind, number>>>;
type ShogiSelection = { board: [number, number] } | { hand: ShogiBaseKind } | null;
const createShogiHands = (): ShogiHands => ({ P: {}, C: {} });
const createShogiBoard = (): ShogiBoard => {
  const board: ShogiBoard = Array.from({ length: 5 }, () => Array<ShogiPiece | null>(5).fill(null));
  board[0] = [null, { kind: 'R', side: 'C' }, { kind: 'K', side: 'C' }, { kind: 'B', side: 'C' }, null];
  board[1] = [null, { kind: 'G', side: 'C' }, { kind: 'S', side: 'C' }, { kind: 'P', side: 'C' }, null];
  board[3] = [null, { kind: 'P', side: 'P' }, { kind: 'S', side: 'P' }, { kind: 'G', side: 'P' }, null];
  board[4] = [null, { kind: 'B', side: 'P' }, { kind: 'K', side: 'P' }, { kind: 'R', side: 'P' }, null];
  return board;
};
const cloneShogiHands = (hands: ShogiHands): ShogiHands => ({ P: { ...hands.P }, C: { ...hands.C } });
const shogiDirections = (piece: ShogiPiece): Array<[number, number, boolean]> => {
  const dir = piece.side === 'P' ? -1 : 1;
  const gold = [[dir, -1, false], [dir, 0, false], [dir, 1, false], [0, -1, false], [0, 1, false], [-dir, 0, false]] as Array<[number, number, boolean]>;
  if (piece.promoted && piece.kind !== 'K' && piece.kind !== 'G') return piece.kind === 'R'
    ? [...gold, [-1, -1, false], [-1, 1, false], [1, -1, false], [1, 1, false]]
    : piece.kind === 'B'
      ? [...gold.slice(1, 2), [0, -1, false], [0, 1, false], ...([[-1, -1, true], [-1, 1, true], [1, -1, true], [1, 1, true]] as Array<[number, number, boolean]>)]
      : gold;
  if (piece.kind === 'K') return [[-1, -1, false], [-1, 0, false], [-1, 1, false], [0, -1, false], [0, 1, false], [1, -1, false], [1, 0, false], [1, 1, false]];
  if (piece.kind === 'R') return [[-1, 0, true], [1, 0, true], [0, -1, true], [0, 1, true]];
  if (piece.kind === 'B') return [[-1, -1, true], [-1, 1, true], [1, -1, true], [1, 1, true]];
  if (piece.kind === 'G') return gold;
  if (piece.kind === 'S') return [[dir, -1, false], [dir, 0, false], [dir, 1, false], [-dir, -1, false], [-dir, 1, false]];
  return [[dir, 0, false]];
};
const shogiMoves = (board: ShogiBoard, row: number, col: number): Array<[number, number]> => {
  const piece = board[row][col]; if (!piece) return [];
  const moves: Array<[number, number]> = [];
  shogiDirections(piece).forEach(([dr, dc, slide]) => {
    for (let step = 1; step <= (slide ? 5 : 1); step += 1) {
      const r = row + dr * step; const c = col + dc * step;
      if (r < 0 || r >= 5 || c < 0 || c >= 5 || board[r][c]?.side === piece.side) break;
      moves.push([r, c]); if (board[r][c]) break;
    }
  });
  return moves;
};
const shogiGlyph = (piece: ShogiPiece | null) => {
  if (!piece) return '';
  const glyph: Record<ShogiBaseKind, string> = { K: piece.side === 'P' ? '王' : '玉', R: '飛', B: '角', G: '金', S: '銀', P: '歩' };
  if (piece.promoted) return piece.kind === 'R' ? '龍' : piece.kind === 'B' ? '馬' : piece.kind === 'S' || piece.kind === 'P' ? '全' : glyph[piece.kind];
  return glyph[piece.kind];
};
const shogiCanPromote = (piece: ShogiPiece, toRow: number) => piece.side === 'P' ? toRow <= 1 : toRow >= 3;
const shogiPromote = (piece: ShogiPiece, toRow: number): ShogiPiece => ({ ...piece, promoted: piece.promoted || (piece.kind !== 'K' && piece.kind !== 'G' && shogiCanPromote(piece, toRow)) });
const shogiDropAllowed = (board: ShogiBoard, hands: ShogiHands, side: 'P' | 'C', kind: ShogiBaseKind, row: number, col: number) => {
  if (!hands[side][kind] || board[row][col]) return false;
  if (kind === 'P' && (side === 'P' ? row === 0 : row === 4)) return false;
  if (kind === 'P' && board.some(line => line[col]?.side === side && line[col]?.kind === 'P' && !line[col]?.promoted)) return false;
  return true;
};

const ShogiGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [board, setBoard] = useState<ShogiBoard>(createShogiBoard);
  const [hands, setHands] = useState<ShogiHands>(createShogiHands);
  const [selected, setSelected] = useState<ShogiSelection>(null);
  const [turn, setTurn] = useState(1);
  const [result, setResult] = useState<'WIN' | 'LOSE' | null>(null);
  const restart = () => { setBoard(createShogiBoard()); setHands(createShogiHands()); setSelected(null); setTurn(1); setResult(null); };
  const move = (row: number, col: number) => {
    if (result) return;
    setBoard(previousBoard => {
      let next = previousBoard.map(line => line.slice());
      let nextHands = cloneShogiHands(hands);
      if (!selected) { if (next[row][col]?.side === 'P') setSelected({ board: [row, col] }); return previousBoard; }
      if ('hand' in selected) {
        if (!shogiDropAllowed(next, nextHands, 'P', selected.hand, row, col)) return previousBoard;
        next[row][col] = { kind: selected.hand, side: 'P' }; nextHands.P[selected.hand] = Math.max(0, (nextHands.P[selected.hand] || 0) - 1);
      } else {
        const [fromRow, fromCol] = selected.board;
        if (next[row][col]?.side === 'P') { setSelected({ board: [row, col] }); return previousBoard; }
        if (!shogiMoves(next, fromRow, fromCol).some(([r, c]) => r === row && c === col)) { setSelected(null); return previousBoard; }
        const captured = next[row][col]; const moving = next[fromRow][fromCol]; if (!moving) return previousBoard;
        if (captured) nextHands.P[captured.kind] = (nextHands.P[captured.kind] || 0) + 1;
        next[row][col] = shogiPromote(moving, row); next[fromRow][fromCol] = null;
        if (captured?.kind === 'K') { setResult('WIN'); setHands(nextHands); setSelected(null); return next; }
      }
      const cpuMoves = next.flatMap((line, r) => line.flatMap((piece, c) => piece?.side === 'C' ? shogiMoves(next, r, c).map(to => ({ from: [r, c] as [number, number], to, capture: !!next[to[0]][to[1]] })) : []));
      const cpuMove = cpuMoves.sort((a, b) => Number(b.capture) - Number(a.capture))[0];
      if (cpuMove) {
        const cpuPiece = next[cpuMove.from[0]][cpuMove.from[1]]; const cpuCaptured = next[cpuMove.to[0]][cpuMove.to[1]];
        if (cpuCaptured) nextHands.C[cpuCaptured.kind] = (nextHands.C[cpuCaptured.kind] || 0) + 1;
        if (cpuPiece) { next[cpuMove.to[0]][cpuMove.to[1]] = shogiPromote(cpuPiece, cpuMove.to[0]); next[cpuMove.from[0]][cpuMove.from[1]] = null; }
        if (cpuCaptured?.kind === 'K') setResult('LOSE');
      } else {
        const cpuDrops = (Object.keys(nextHands.C) as ShogiBaseKind[]).flatMap(kind => { for (let rowIndex = 0; rowIndex < 5; rowIndex += 1) for (let colIndex = 0; colIndex < 5; colIndex += 1) if (shogiDropAllowed(next, nextHands, 'C', kind, rowIndex, colIndex)) return [{ kind, row: rowIndex, col: colIndex }]; return []; });
        const cpuDrop = cpuDrops[0];
        if (cpuDrop) { next[cpuDrop.row][cpuDrop.col] = { kind: cpuDrop.kind, side: 'C' }; nextHands.C[cpuDrop.kind] = Math.max(0, (nextHands.C[cpuDrop.kind] || 0) - 1); }
      }
      setHands(nextHands); setSelected(null); setTurn(value => value + 1); return next;
    });
  };
  const selectHand = (kind: ShogiBaseKind) => { if (!result && (hands.P[kind] || 0) > 0) setSelected({ hand: kind }); };
  const playerHandKinds = (Object.keys(hands.P) as ShogiBaseKind[]).filter(kind => (hands.P[kind] || 0) > 0);
  return <GameShell scope="shogi" title={text(languageMode, 'ミニ将棋', 'Mini Shogi')} subtitle={text(languageMode, '駒を取り、成り、持ち駒を打つ5×5将棋。相手の玉を取れば勝ち。', 'Capture, promote, and drop pieces in a 5x5 shogi duel. Capture the enemy king to win.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/shogi.png" badgeAsset="sprites/backgrounds/mini-games/badges/shogi.png" onBack={onBack}><ResultBanner result={result} onRestart={restart} languageMode={languageMode} /><div className="mb-3 flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-950/55 p-3 text-sm"><span>{text(languageMode, '手番', 'Turn')} {turn}</span><span>{selected && ('hand' in selected ? text(languageMode, '持ち駒を打つ場所を選択', 'Choose a drop square') : text(languageMode, '移動先を選択', 'Choose a destination'))}</span></div><div className="flex flex-1 flex-col items-center"><div className="mb-3 grid w-full max-w-md grid-cols-5 gap-1 rounded-xl border-4 border-amber-700/70 bg-amber-900/60 p-2">{board.flatMap((line, row) => line.map((piece, col) => <button key={`${row}-${col}`} type="button" onClick={() => move(row, col)} data-gamepad-zone="shogi-board" data-gamepad-order={row * 5 + col} className={`aspect-square rounded-md border text-xl font-black shadow-inner transition sm:text-3xl ${selected && 'board' in selected && selected.board[0] === row && selected.board[1] === col ? 'border-cyan-300 bg-cyan-400/30' : 'border-amber-200/25 bg-amber-100/90 text-slate-900 hover:bg-amber-50'} ${piece?.side === 'C' ? 'rotate-180' : ''}`}>{shogiGlyph(piece)}</button>))}</div><div className="mb-3 flex flex-wrap justify-center gap-2">{playerHandKinds.length ? playerHandKinds.map(kind => <button key={kind} type="button" onClick={() => selectHand(kind)} data-gamepad-zone="shogi-hand" data-gamepad-order={playerHandKinds.indexOf(kind)} className={`rounded-lg border border-amber-200/40 bg-amber-100 px-3 py-2 font-black text-slate-900 ${selected && 'hand' in selected && selected.hand === kind ? 'ring-2 ring-cyan-300' : ''}`}>{shogiGlyph({ kind, side: 'P' })} × {hands.P[kind]}</button>) : <span className="text-xs text-slate-400">{text(languageMode, '持ち駒はありません', 'No pieces in hand')}</span>}</div><div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">{text(languageMode, '相手陣2段に入ると、飛・角・銀・歩が自動で成ります。取った駒は自分の持ち駒になり、同じ筋に歩を2枚置く二歩はできません。', 'Rook, bishop, silver, and pawn pieces auto-promote in the enemy camp. Captured pieces become drops; two unpromoted pawns may not share a file.')}</div></div></GameShell>;
};

type GoCell = 'B' | 'W' | null;
type GoBoard = GoCell[][];
const emptyGoBoard = (): GoBoard => Array.from({ length: 9 }, () => Array<GoCell>(9).fill(null));
const goGroup = (board: GoBoard, row: number, col: number) => {
  const color = board[row][col]; if (!color) return { stones: [] as Array<[number, number]>, liberties: new Set<string>() };
  const stones: Array<[number, number]> = []; const liberties = new Set<string>(); const queue: Array<[number, number]> = [[row, col]]; const seen = new Set<string>();
  while (queue.length) { const [r, c] = queue.pop()!; const key = `${r},${c}`; if (seen.has(key)) continue; seen.add(key); if (board[r][c] !== color) continue; stones.push([r, c]); [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => { if (nr < 0 || nr >= 9 || nc < 0 || nc >= 9) return; if (!board[nr][nc]) liberties.add(`${nr},${nc}`); else if (board[nr][nc] === color && !seen.has(`${nr},${nc}`)) queue.push([nr, nc]); }); }
  return { stones, liberties };
};
const putGoStone = (board: GoBoard, row: number, col: number, color: 'B' | 'W') => {
  if (board[row][col]) return null;
  const next = board.map(line => line.slice()); next[row][col] = color; let captured = 0;
  [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].forEach(([r, c]) => { if (r < 0 || r >= 9 || c < 0 || c >= 9 || next[r][c] !== (color === 'B' ? 'W' : 'B')) return; const group = goGroup(next, r, c); if (group.liberties.size === 0) { group.stones.forEach(([sr, sc]) => { next[sr][sc] = null; captured += 1; }); } });
  if (goGroup(next, row, col).liberties.size === 0) return null;
  return { board: next, captured };
};
const goBoardKey = (board: GoBoard) => board.map(line => line.map(cell => cell || '.').join('')).join('/');
const scoreGo = (board: GoBoard) => {
  let black = 0; let white = 0; const seen = new Set<string>();
  board.forEach(line => line.forEach(cell => { if (cell === 'B') black += 1; if (cell === 'W') white += 1; }));
  for (let row = 0; row < 9; row += 1) for (let col = 0; col < 9; col += 1) {
    if (board[row][col] || seen.has(`${row},${col}`)) continue;
    const region: Array<[number, number]> = []; const bordering = new Set<GoCell>(); const queue: Array<[number, number]> = [[row, col]];
    while (queue.length) { const [r, c] = queue.pop()!; const key = `${r},${c}`; if (seen.has(key)) continue; seen.add(key); if (board[r][c]) { bordering.add(board[r][c]); continue; } region.push([r, c]); [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => { if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && !seen.has(`${nr},${nc}`)) queue.push([nr, nc]); }); }
    if (bordering.size === 1) { if (bordering.has('B')) black += region.length; if (bordering.has('W')) white += region.length; }
  }
  return { black, white };
};

const GoGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [board, setBoard] = useState<GoBoard>(emptyGoBoard);
  const [captures, setCaptures] = useState(0); const [cpuCaptures, setCpuCaptures] = useState(0); const [passes, setPasses] = useState(0); const [moves, setMoves] = useState(0); const [koKey, setKoKey] = useState(''); const [finalScore, setFinalScore] = useState<{ black: number; white: number } | null>(null); const [result, setResult] = useState<'WIN' | 'LOSE' | null>(null);
  const restart = () => { setBoard(emptyGoBoard()); setCaptures(0); setCpuCaptures(0); setPasses(0); setMoves(0); setKoKey(''); setFinalScore(null); setResult(null); };
  const finish = (finalBoard: GoBoard) => {
    const score = scoreGo(finalBoard); setFinalScore(score); setResult(score.black >= score.white ? 'WIN' : 'LOSE');
  };
  const cpuTurn = (current: GoBoard, forbiddenKey: string) => {
    const candidates: Array<{ row: number; col: number; captured: number; distance: number; board: GoBoard }> = [];
    for (let row = 0; row < 9; row += 1) for (let col = 0; col < 9; col += 1) if (!current[row][col]) {
      const placed = putGoStone(current, row, col, 'W'); if (placed && goBoardKey(placed.board) !== forbiddenKey) candidates.push({ row, col, captured: placed.captured, distance: Math.abs(row - 4) + Math.abs(col - 4), board: placed.board });
    }
    candidates.sort((a, b) => b.captured - a.captured || a.distance - b.distance);
    return candidates[0] || null;
  };
  const place = (row: number, col: number) => {
    if (result) return;
    const placed = putGoStone(board, row, col, 'B'); if (!placed || goBoardKey(placed.board) === koKey) return;
    const cpu = cpuTurn(placed.board, goBoardKey(board)); const nextMoves = moves + 1;
    if (!cpu) { setBoard(placed.board); setCaptures(captures + placed.captured); setPasses(previous => previous + 1); setMoves(nextMoves); if (passes + 1 >= 2 || nextMoves >= 45) finish(placed.board); return; }
    const nextPasses = 0; setBoard(cpu.board); setCaptures(captures + placed.captured); setCpuCaptures(cpuCaptures + cpu.captured); setPasses(nextPasses); setMoves(nextMoves); setKoKey(goBoardKey(placed.board)); if (nextMoves >= 45) finish(cpu.board);
  };
  const pass = () => {
    if (result) return;
    const nextPasses = passes + 1;
    if (nextPasses >= 2) { finish(board); setPasses(nextPasses); return; }
    const cpu = cpuTurn(board, koKey);
    if (!cpu) { finish(board); setPasses(2); return; }
    setBoard(cpu.board); setCpuCaptures(cpuCaptures + cpu.captured); setPasses(0); setKoKey(goBoardKey(board)); setMoves(value => value + 1);
  };
  return <GameShell scope="go" title={text(languageMode, '九路盤 囲碁', 'Nine-Ring Go')} subtitle={text(languageMode, 'コウ・自殺手・パス・陣地計算を使う9路盤。2回連続パスで終局します。', 'A 9x9 Go board with ko, suicide, passing, and territory scoring. Two consecutive passes end the game.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/go.png" badgeAsset="sprites/backgrounds/mini-games/badges/go.png" onBack={onBack}><ResultBanner result={result} onRestart={restart} languageMode={languageMode} /><div className="mb-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4"><div className="rounded-xl border border-slate-400/30 bg-slate-950/65 p-2 text-sm">{text(languageMode, '黒の捕獲', 'Black captures')}<strong className="ml-1">{captures}</strong></div><div className="rounded-xl border border-white/20 bg-white/15 p-2 text-sm">{text(languageMode, '白の捕獲', 'White captures')}<strong className="ml-1">{cpuCaptures}</strong></div><div className="rounded-xl border border-amber-300/25 bg-amber-950/55 p-2 text-sm">{text(languageMode, '手数', 'Moves')}<strong className="ml-1">{moves} / 45</strong></div><div className="rounded-xl border border-cyan-300/25 bg-cyan-950/55 p-2 text-sm">{text(languageMode, '連続パス', 'Passes')}<strong className="ml-1">{passes} / 2</strong></div></div><div className="flex flex-1 flex-col items-center"><div className="mb-3 grid aspect-square w-full max-w-[min(90vw,540px)] grid-cols-9 rounded-xl border-4 border-amber-700 bg-amber-200/90 p-2">{board.flatMap((line, row) => line.map((cell, col) => <button key={`${row}-${col}`} type="button" onClick={() => place(row, col)} data-gamepad-zone="go-board" data-gamepad-order={row * 9 + col} className="relative flex aspect-square items-center justify-center border border-amber-900/35 text-xl sm:text-2xl">{(row === 2 || row === 4 || row === 6) && (col === 2 || col === 4 || col === 6) && <span className="absolute h-1.5 w-1.5 rounded-full bg-amber-900" />}{cell && <span className={`relative z-10 h-[80%] w-[80%] rounded-full shadow-lg ${cell === 'B' ? 'bg-slate-950' : 'bg-white'}`} />}</button>))}</div><div className="mb-3 flex gap-2"><button type="button" onClick={pass} disabled={!!result} data-gamepad-zone="go-actions" data-gamepad-order={0} className="rounded-xl border border-cyan-300/40 bg-cyan-700/80 px-5 py-3 font-black hover:bg-cyan-600 disabled:opacity-35">{text(languageMode, 'パス', 'Pass')}</button></div>{finalScore && <div className="mb-3 rounded-xl border border-amber-300/30 bg-amber-950/55 p-3 text-center text-sm text-amber-100">{text(languageMode, '終局スコア 黒：', 'Final score Black: ')}{finalScore.black} ／ {text(languageMode, '白：', 'White: ')}{finalScore.white}</div>}<div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">{text(languageMode, '相手の石を取るだけでなく、空点を囲むと陣地になります。自殺手と直前の盤面への再現（コウ）は置けません。', 'Surrounding empty points scores territory. Suicide moves and immediate repetition of the previous board (ko) are illegal.')}</div></div></GameShell>;
};

type ChessPiece = { kind: 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'; side: 'P' | 'C' };
type ChessBoard = Array<Array<ChessPiece | null>>;
const createChessBoard = (): ChessBoard => {
  const board: ChessBoard = Array.from({ length: 8 }, () => Array<ChessPiece | null>(8).fill(null));
  const back: ChessPiece['kind'][] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  back.forEach((kind, col) => { board[0][col] = { kind, side: 'C' }; board[1][col] = { kind: 'P', side: 'C' }; board[6][col] = { kind: 'P', side: 'P' }; board[7][col] = { kind, side: 'P' }; });
  return board;
};
const chessMoves = (board: ChessBoard, row: number, col: number): Array<[number, number]> => {
  const piece = board[row][col]; if (!piece) return []; const moves: Array<[number, number]> = []; const add = (r: number, c: number) => { if (r < 0 || r >= 8 || c < 0 || c >= 8 || board[r][c]?.side === piece.side) return false; moves.push([r, c]); return !board[r][c]; };
  if (piece.kind === 'P') { const dir = piece.side === 'P' ? -1 : 1; if (row + dir >= 0 && row + dir < 8 && !board[row + dir][col]) add(row + dir, col); [[row + dir, col - 1], [row + dir, col + 1]].forEach(([r, c]) => { if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.side !== piece.side && board[r][c]) moves.push([r, c]); }); return moves; }
  const jumps: Record<'K' | 'N', Array<[number, number]>> = { K: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]], N: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]] };
  if (piece.kind === 'K' || piece.kind === 'N') jumps[piece.kind].forEach(([dr, dc]) => add(row + dr, col + dc));
  const slide: Record<'R' | 'B' | 'Q', Array<[number, number]>> = { R: [[-1, 0], [1, 0], [0, -1], [0, 1]], B: [[-1, -1], [-1, 1], [1, -1], [1, 1]], Q: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]] };
  if (piece.kind === 'R' || piece.kind === 'B' || piece.kind === 'Q') slide[piece.kind].forEach(([dr, dc]) => { for (let step = 1; step < 8; step += 1) if (!add(row + dr * step, col + dc * step)) break; });
  return moves;
};
const chessGlyph = (piece: ChessPiece | null) => !piece ? '' : ({ P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚' }[piece.kind]);
const chessApplyMove = (board: ChessBoard, from: [number, number], to: [number, number]) => {
  const next = board.map(line => line.slice()); next[to[0]][to[1]] = next[from[0]][from[1]]; next[from[0]][from[1]] = null;
  if (next[to[0]][to[1]]?.kind === 'P' && (to[0] === 0 || to[0] === 7)) next[to[0]][to[1]] = { ...next[to[0]][to[1]]!, kind: 'Q' };
  return next;
};
const chessKingPosition = (board: ChessBoard, side: 'P' | 'C') => {
  for (let row = 0; row < 8; row += 1) for (let col = 0; col < 8; col += 1) if (board[row][col]?.side === side && board[row][col]?.kind === 'K') return [row, col] as [number, number];
  return null;
};
const isChessSquareAttacked = (board: ChessBoard, row: number, col: number, bySide: 'P' | 'C') => {
  for (let fromRow = 0; fromRow < 8; fromRow += 1) for (let fromCol = 0; fromCol < 8; fromCol += 1) {
    const piece = board[fromRow][fromCol]; if (!piece || piece.side !== bySide) continue;
    if (piece.kind === 'P') { const direction = bySide === 'P' ? -1 : 1; if (fromRow + direction === row && Math.abs(fromCol - col) === 1) return true; }
    else if (chessMoves(board, fromRow, fromCol).some(([toRow, toCol]) => toRow === row && toCol === col)) return true;
  }
  return false;
};
const isChessInCheck = (board: ChessBoard, side: 'P' | 'C') => { const king = chessKingPosition(board, side); return !king || isChessSquareAttacked(board, king[0], king[1], side === 'P' ? 'C' : 'P'); };
const legalChessMoves = (board: ChessBoard, row: number, col: number) => chessMoves(board, row, col).filter(to => !isChessInCheck(chessApplyMove(board, [row, col], to), board[row][col]!.side));
const allChessMoves = (board: ChessBoard, side: 'P' | 'C') => board.flatMap((line, row) => line.flatMap((piece, col) => piece?.side === side ? legalChessMoves(board, row, col).map(to => ({ from: [row, col] as [number, number], to, capture: !!board[to[0]][to[1]] })) : []));

const ChessGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [board, setBoard] = useState<ChessBoard>(createChessBoard); const [selected, setSelected] = useState<[number, number] | null>(null); const [turn, setTurn] = useState(1); const [lastCapture, setLastCapture] = useState<ChessPiece['kind'] | null>(null); const [result, setResult] = useState<'WIN' | 'LOSE' | null>(null);
  const restart = () => { setBoard(createChessBoard()); setSelected(null); setTurn(1); setLastCapture(null); setResult(null); };
  const move = (row: number, col: number) => {
    if (result) return;
    if (!selected) { if (board[row][col]?.side === 'P') setSelected([row, col]); return; }
    const [fromRow, fromCol] = selected;
    if (board[row][col]?.side === 'P') { setSelected([row, col]); return; }
    if (!legalChessMoves(board, fromRow, fromCol).some(([toRow, toCol]) => toRow === row && toCol === col)) { setSelected(null); return; }
    const captured = board[row][col]; let next = chessApplyMove(board, selected, [row, col]);
    if (captured?.kind === 'K') { setBoard(next); setLastCapture(captured.kind); setSelected(null); setResult('WIN'); return; }
    const cpuMoves = allChessMoves(next, 'C');
    if (cpuMoves.length === 0) { setBoard(next); setSelected(null); setResult('WIN'); return; }
    cpuMoves.sort((a, b) => Number(b.capture) - Number(a.capture)); const cpuMove = cpuMoves[0]; const cpuCaptured = next[cpuMove.to[0]][cpuMove.to[1]]; next = chessApplyMove(next, cpuMove.from, cpuMove.to);
    setBoard(next); setSelected(null); setTurn(value => value + 1); setLastCapture(cpuCaptured?.kind || captured?.kind || null);
    if (cpuCaptured?.kind === 'K' || allChessMoves(next, 'P').length === 0 && isChessInCheck(next, 'P')) setResult('LOSE');
  };
  const playerInCheck = isChessInCheck(board, 'P');
  return <GameShell scope="chess" title={text(languageMode, 'スクールチェス', 'School Chess')} subtitle={text(languageMode, '合法手・チェック・チェックメイト・昇格を含む、学習向けの簡易チェス。', 'A learning-focused chess duel with legal moves, check, checkmate, and promotion.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/chess.png" badgeAsset="sprites/backgrounds/mini-games/badges/chess.png" onBack={onBack}><ResultBanner result={result} onRestart={restart} languageMode={languageMode} /><div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-xl border border-cyan-300/25 bg-cyan-950/60 p-2">{text(languageMode, '手番', 'Turn')} {turn}</div><div className={`rounded-xl border p-2 ${playerInCheck ? 'border-rose-300/60 bg-rose-950/70 text-rose-100' : 'border-emerald-300/25 bg-emerald-950/55'}`}>{playerInCheck ? text(languageMode, 'チェックされています', 'You are in check') : text(languageMode, '自分のキングは安全', 'King is safe')}</div><div className="rounded-xl border border-amber-300/25 bg-amber-950/55 p-2">{text(languageMode, '最後の捕獲', 'Last capture')} {lastCapture || '-'}</div></div><div className="flex flex-1 flex-col items-center"><div className="grid w-full max-w-[min(90vw,560px)] grid-cols-8 gap-0.5 rounded-xl border-4 border-sky-900 bg-sky-950 p-2">{board.flatMap((line, boardRow) => line.map((piece, boardCol) => <button key={`${boardRow}-${boardCol}`} type="button" onClick={() => move(boardRow, boardCol)} data-gamepad-zone="chess-board" data-gamepad-order={boardRow * 8 + boardCol} className={`aspect-square text-2xl font-black sm:text-4xl ${selected?.[0] === boardRow && selected?.[1] === boardCol ? 'bg-cyan-400 text-slate-950' : (boardRow + boardCol) % 2 === 0 ? 'bg-sky-100 text-slate-900' : 'bg-sky-700 text-white'}`}>{piece && <span className={piece.side === 'P' ? 'text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]' : 'text-slate-950'}>{chessGlyph(piece)}</span>}</button>))}</div><div className="mt-3 max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">{text(languageMode, '駒を選んで合法なマスへ移動。相手のキングを詰ませると勝利です。ポーンは最奥段でクイーンに昇格します。', 'Select a piece and move it to a legal square. Checkmate wins; pawns promote to queens on the last rank.')}</div></div></GameShell>;
};

type MahjongTile = { key: string; id: string; suit: 'm' | 'p' | 's' | 'z'; value: number; label: string };
const createMahjongTiles = () => {
  const tiles: MahjongTile[] = [];
  (['m', 'p', 's'] as const).forEach(suit => { for (let value = 1; value <= 9; value += 1) for (let copyIndex = 0; copyIndex < 4; copyIndex += 1) tiles.push({ key: `${suit}${value}`, id: `${suit}${value}-${copyIndex}`, suit, value, label: `${value}${suit === 'm' ? '萬' : suit === 'p' ? '筒' : '索'}` }); });
  [['z1', '東'], ['z2', '南'], ['z3', '西'], ['z4', '北'], ['z5', '白'], ['z6', '發'], ['z7', '中']].forEach(([key, label], index) => { for (let copyIndex = 0; copyIndex < 4; copyIndex += 1) tiles.push({ key, id: `${key}-${copyIndex}`, suit: 'z', value: index + 1, label }); });
  return tiles;
};
const MAHJONG_TILE_POOL = createMahjongTiles();
const shuffleMahjong = (tiles: MahjongTile[]) => [...tiles].sort(() => Math.random() - 0.5);
const mahjongTileText = (languageMode: LanguageMode, tile: MahjongTile) => languageMode === 'ENGLISH' ? (tile.suit === 'z' ? ['East', 'South', 'West', 'North', 'White', 'Green', 'Red'][tile.value - 1] : `${tile.value}${tile.suit === 'm' ? 'M' : tile.suit === 'p' ? 'P' : 'S'}`) : trans(tile.label, languageMode);
type MahjongYaku = { name: LocalCopy; description: LocalCopy; recommended?: boolean };
const MAHJONG_YAKU: MahjongYaku[] = [
  { name: copy('タンヤオ', 'Tanyao'), description: copy('2〜8の数牌だけでそろえる役。字牌と1・9を使わないので、順子を作りやすい。', 'A hand made only of number tiles 2–8. Avoiding honors and 1/9 makes sequences easier.'), recommended: true },
  { name: copy('役牌', 'Value tiles'), description: copy('白・發・中、または場風／自風を3枚そろえる役。刻子を作る目印になる。', 'A triplet of dragons or relevant winds. It is a clear target when you already have a pair of honors.'), recommended: true },
  { name: copy('平和', 'Pinfu'), description: copy('順子中心で、待ちや対子にも条件がある役。まずは数牌を連番でつなげる練習になる。', 'A sequence-focused yaku with extra conditions on the pair and wait. It is a good sequence-building exercise.'), recommended: true },
  { name: copy('一盃口', 'Pure double sequence'), description: copy('同じ順子を2組そろえる役。似た形が2つ見えた時に狙える。', 'Two identical sequences. Consider it when two matching sequence shapes appear.') },
  { name: copy('七対子', 'Seven pairs'), description: copy('7組の対子で作る役。本作の8枚ルールでは練習用の知識として紹介。', 'Seven pairs. In this eight-tile mini-game it is shown as a learning reference.') },
];
type MahjongQuality = { groups: number; pairs: number; complete: boolean };
const mahjongCounts = (hand: MahjongTile[]) => hand.reduce<Record<string, number>>((counts, tile) => ({ ...counts, [tile.key]: (counts[tile.key] || 0) + 1 }), {});
const canMahjongMelds = (counts: Record<string, number>, groups: number): boolean => {
  if (groups === 0) return true;
  const first = Object.keys(counts).find(key => counts[key] > 0); if (!first) return false;
  const countNext = { ...counts, [first]: counts[first] - 1 };
  if (countNext[first] >= 2 && canMahjongMelds({ ...countNext, [first]: countNext[first] - 2 }, groups - 1)) return true;
  const suit = first[0]; const value = Number(first.substring(1));
  if (suit !== 'z' && value <= 7 && countNext[`${suit}${value + 1}`] > 0 && countNext[`${suit}${value + 2}`] > 0) {
    const sequenceCounts = { ...countNext, [`${suit}${value + 1}`]: countNext[`${suit}${value + 1}`] - 1, [`${suit}${value + 2}`]: countNext[`${suit}${value + 2}`] - 1 };
    if (canMahjongMelds(sequenceCounts, groups - 1)) return true;
  }
  return false;
};
const analyzeMahjongHand = (hand: MahjongTile[]): MahjongQuality => {
  const counts = mahjongCounts(hand); let bestGroups = 0; let bestPairs = 0;
  Object.keys(counts).forEach(pairKey => { if (counts[pairKey] < 2) return; const remaining = { ...counts, [pairKey]: counts[pairKey] - 2 }; for (let groups = 2; groups >= 0; groups -= 1) if (canMahjongMelds(remaining, groups)) { bestGroups = Math.max(bestGroups, groups); bestPairs = Math.max(bestPairs, 1); break; } });
  if (bestPairs === 0) bestGroups = Math.max(bestGroups, canMahjongMelds(counts, 2) ? 2 : canMahjongMelds(counts, 1) ? 1 : 0);
  return { groups: bestGroups, pairs: bestPairs, complete: bestGroups >= 2 && bestPairs >= 1 };
};
type MahjongState = { hand: MahjongTile[]; deck: MahjongTile[]; cpuHand: MahjongTile[]; cpuDeck: MahjongTile[]; turn: number; quality: MahjongQuality; cpuQuality: MahjongQuality; lastDraw: MahjongTile | null; result: 'WIN' | 'LOSE' | null };
const takeMahjongKeys = (pool: MahjongTile[], keys: string[]) => {
  const remaining = [...pool]; const taken: MahjongTile[] = [];
  keys.forEach(key => { const index = remaining.findIndex(tile => tile.key === key); if (index >= 0) taken.push(remaining.splice(index, 1)[0]); });
  return { taken, remaining };
};
const createMahjongState = (): MahjongState => {
  const startPool = shuffleMahjong(MAHJONG_TILE_POOL); const player = takeMahjongKeys(startPool, ['m1', 'm2', 'm3', 'p4', 'p5', 's7', 's7', 'z1']); const cpu = takeMahjongKeys(player.remaining, ['p1', 'p2', 'p3', 's4', 's5', 'm9', 'm9', 'z2']);
  const quality = analyzeMahjongHand(player.taken); const cpuQuality = analyzeMahjongHand(cpu.taken);
  return { hand: player.taken, deck: cpu.remaining, cpuHand: cpu.taken, cpuDeck: [], turn: 1, quality, cpuQuality, lastDraw: null, result: null };
};
const mahjongSortTiles = (hand: MahjongTile[]) => [...hand].sort((a, b) => {
  const suitOrder: Record<MahjongTile['suit'], number> = { m: 0, p: 1, s: 2, z: 3 };
  return suitOrder[a.suit] - suitOrder[b.suit] || a.value - b.value || a.id.localeCompare(b.id);
});
const mahjongRecommendation = (hand: MahjongTile[]) => {
  const hasTerminalOrHonor = hand.some(tile => tile.suit === 'z' || tile.value === 1 || tile.value === 9);
  return hasTerminalOrHonor ? MAHJONG_YAKU[0] : MAHJONG_YAKU[2];
};

const MahjongGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [game, setGame] = useState<MahjongState>(createMahjongState);
  const [selected, setSelected] = useState<number | null>(null);
  const [showYaku, setShowYaku] = useState(false);
  const restart = () => { setGame(createMahjongState()); setSelected(null); };
  const organizeTiles = () => { setGame(previous => ({ ...previous, hand: mahjongSortTiles(previous.hand) })); setSelected(null); audioService.playSound('select'); };
  const recommendedYaku = mahjongRecommendation(game.hand);
  const discard = () => {
    if (game.result || selected === null) return;
    setGame(previous => {
      const drawn = previous.deck[0] || MAHJONG_TILE_POOL[(previous.turn * 7) % MAHJONG_TILE_POOL.length];
      const nextHand = previous.hand.filter((_, index) => index !== selected).concat(drawn); const quality = analyzeMahjongHand(nextHand);
      const cpuDraw = previous.cpuDeck[0] || MAHJONG_TILE_POOL[(previous.turn * 11 + 13) % MAHJONG_TILE_POOL.length]; const cpuWithDraw = [...previous.cpuHand, cpuDraw];
      const cpuChoice = cpuWithDraw.map((_, index) => ({ index, quality: analyzeMahjongHand(cpuWithDraw.filter((__, tileIndex) => tileIndex !== index)) })).sort((a, b) => b.quality.groups * 3 + b.quality.pairs - (a.quality.groups * 3 + a.quality.pairs))[0];
      const nextCpuHand = cpuWithDraw.filter((_, index) => index !== cpuChoice.index); const cpuQuality = analyzeMahjongHand(nextCpuHand); const nextTurn = previous.turn + 1;
      const result = quality.complete ? 'WIN' : cpuQuality.complete ? 'LOSE' : nextTurn > 12 ? (quality.groups * 3 + quality.pairs >= cpuQuality.groups * 3 + cpuQuality.pairs ? 'WIN' : 'LOSE') : null;
      return { ...previous, hand: nextHand, deck: previous.deck.slice(1), cpuHand: nextCpuHand, cpuDeck: previous.cpuDeck.slice(1), turn: nextTurn, quality, cpuQuality, lastDraw: drawn, result };
    });
    setSelected(null); audioService.playSound('select');
  };
  return (
    <GameShell scope="mahjong" title={text(languageMode, 'まなび麻雀', 'Learning Mahjong')} subtitle={text(languageMode, '1枚捨てて1枚引き、順子・刻子と対子をそろえる8枚の学習麻雀。', 'Discard and draw to build sequences, triplets, and a pair in this eight-tile learning mahjong game.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/mahjong.png" badgeAsset="sprites/backgrounds/mini-games/badges/mahjong.png" onBack={onBack}>
      <ResultBanner result={game.result} onRestart={restart} languageMode={languageMode} />
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-300/25 bg-teal-950/60 p-3 text-center"><div className="text-xs text-teal-200">{text(languageMode, 'あなた', 'You')}</div><div className="text-xl font-black">{game.quality.groups} {text(languageMode, '面子', 'melds')}</div><div className="text-xs text-slate-300">{text(languageMode, '対子', 'Pair')} {game.quality.pairs}</div></div>
        <div className="rounded-xl border border-rose-300/25 bg-rose-950/60 p-3 text-center"><div className="text-xs text-rose-200">{text(languageMode, '相手', 'CPU')}</div><div className="text-xl font-black">{game.cpuQuality.groups} {text(languageMode, '面子', 'melds')}</div><div className="text-xs text-slate-300">{text(languageMode, '対子', 'Pair')} {game.cpuQuality.pairs}</div></div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"><div className="text-xs text-slate-300">{text(languageMode, '巡目', 'Turn')}</div><div className="text-xl font-black">{game.turn} / 12</div></div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-950/50 p-3 text-center"><div className="text-xs text-amber-200">{text(languageMode, '山牌', 'Tiles left')}</div><div className="text-xl font-black">{game.deck.length}</div></div>
      </div>
      <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-teal-300/25 bg-slate-900/85 p-4">
        <div className="mb-2 text-sm text-slate-300">{text(languageMode, '捨てる牌を選び、捨てるボタンで手番を進めます。', 'Select a tile, then press Discard to advance.')}</div>
        <div className="mb-3 flex max-w-full flex-wrap justify-center gap-2">{game.hand.map((tile, index) => <button key={tile.id} type="button" onClick={() => setSelected(index)} data-gamepad-zone="mahjong-hand" data-gamepad-order={index} disabled={!!game.result} className={`flex h-20 w-14 items-center justify-center rounded-lg border-2 bg-slate-50 text-lg font-black text-slate-900 shadow-lg transition hover:-translate-y-2 hover:border-teal-400 disabled:opacity-40 sm:h-24 sm:w-16 ${selected === index ? 'border-cyan-400 ring-2 ring-cyan-300' : 'border-slate-300'}`}>{mahjongTileText(languageMode, tile)}</button>)}</div>
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={discard} disabled={!!game.result || selected === null} data-gamepad-zone="mahjong-actions" data-gamepad-order={0} className="rounded-xl border border-teal-300/40 bg-teal-700/80 px-4 py-3 font-black hover:bg-teal-600 disabled:opacity-35">{text(languageMode, 'この牌を捨てる', 'Discard selected')}</button>
          <button type="button" onClick={organizeTiles} disabled={!!game.result} data-gamepad-zone="mahjong-actions" data-gamepad-order={1} className="rounded-xl border border-cyan-300/40 bg-cyan-700/70 px-4 py-3 font-black hover:bg-cyan-600 disabled:opacity-35">{text(languageMode, '牌を整理', 'Sort tiles')}</button>
          <button type="button" onClick={() => setShowYaku(true)} data-gamepad-zone="mahjong-actions" data-gamepad-order={2} className="rounded-xl border border-amber-300/40 bg-amber-700/70 px-4 py-3 font-black hover:bg-amber-600">{text(languageMode, '役を見る', 'View yaku')}</button>
        </div>
        {game.lastDraw && <div className="mb-3 text-xs text-teal-200">{text(languageMode, '引いた牌：', 'Drawn tile: ')}{mahjongTileText(languageMode, game.lastDraw)}</div>}
        <div className="mb-3 w-full max-w-xl rounded-2xl border border-amber-300/30 bg-amber-950/35 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-black uppercase tracking-wider text-amber-200">{text(languageMode, 'おすすめ役', 'Recommended yaku')}</div><span className="rounded-full bg-amber-300/20 px-2 py-1 text-xs font-black text-amber-100">{copyText(languageMode, recommendedYaku.name)}</span></div>
          <p className="mt-2 text-sm leading-6 text-amber-50">{copyText(languageMode, recommendedYaku.description)}</p>
          <p className="mt-2 text-xs leading-5 text-amber-100/70">{text(languageMode, 'まずは面子2つ＋対子1つの完成を優先し、役は次の捨て牌を選ぶヒントとして使います。', 'Prioritize two melds plus a pair first; use yaku as a guide for your next discard.')}</p>
        </div>
        <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">{text(languageMode, '順子は同じ種類の連番3枚、刻子は同じ牌3枚、対子は同じ牌2枚です。面子2つ＋対子1つで完成。', 'A sequence is three consecutive tiles of one suit; a triplet is three identical tiles; a pair is two identical tiles. Complete two melds plus one pair.')}</div>
      </section>
      {showYaku && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm" data-gamepad-modal="true" data-gamepad-navigation-root="true">
        <section role="dialog" aria-modal="true" aria-labelledby="mahjong-yaku-title" className="mini-game-rules-modal max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-200/40 bg-slate-900 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="mahjong-yaku-title" className="text-xl font-black text-amber-100">{text(languageMode, '麻雀の役を知る', 'Learn mahjong yaku')}</h2><p className="mt-1 text-xs text-slate-400">{text(languageMode, '役は手牌の特徴を表すボーナス条件です。', 'Yaku are bonus conditions that describe a hand’s pattern.')}</p></div><button type="button" onClick={() => setShowYaku(false)} data-gamepad-zone="mahjong-yaku" data-gamepad-order={0} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black">{text(languageMode, '閉じる', 'Close')}</button></div>
          <div className="space-y-2">{MAHJONG_YAKU.map(yaku => <article key={yaku.name.jp} className={`rounded-xl border p-3 ${yaku.name.jp === recommendedYaku.name.jp ? 'border-amber-300/60 bg-amber-950/40' : 'border-white/10 bg-white/5'}`}><div className="flex items-center gap-2"><span className="text-sm font-black text-amber-100">{copyText(languageMode, yaku.name)}</span>{yaku.name.jp === recommendedYaku.name.jp && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-black text-emerald-200">{text(languageMode, 'おすすめ', 'Recommended')}</span>}</div><p className="mt-1 text-xs leading-5 text-slate-300">{copyText(languageMode, yaku.description)}</p></article>)}</div>
          <button type="button" onClick={() => setShowYaku(false)} data-gamepad-zone="mahjong-yaku" data-gamepad-order={1} className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950">{text(languageMode, '役を確認した', 'Got it')}</button>
        </section>
      </div>}
    </GameShell>
  );
};

const TriviaMiniGameScreen: React.FC<TriviaMiniGameProps> = ({ gameScreen = GameScreen.MINI_GAME_STONE_GLOW, ...props }) => {
  useEffect(() => {
    void audioService.playBGM('poker_play');
  }, [gameScreen]);

  switch (gameScreen) {
    case GameScreen.MINI_GAME_SCHOOL_TRPG: return <SchoolTrpgGame {...props} />;
    case GameScreen.MINI_GAME_LEARNING_TCG: return <LearningTcgGame {...props} />;
    case GameScreen.MINI_GAME_SHOGI: return <ShogiGame {...props} />;
    case GameScreen.MINI_GAME_GO: return <GoGame {...props} />;
    case GameScreen.MINI_GAME_CHESS: return <ChessGame {...props} />;
    case GameScreen.MINI_GAME_MAHJONG: return <MahjongGame {...props} />;
    case GameScreen.MINI_GAME_STONE_GLOW:
    default: return <StoneGlowGame {...props} />;
  }
};

export default TriviaMiniGameScreen;
