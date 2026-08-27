import React, { useEffect, useState } from 'react';
import { ArrowLeft, CircleHelp, Trophy } from 'lucide-react';
import { CARDS_LIBRARY } from '../constants';
import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, Card as CardType, GameMode, GameScreen, LanguageMode } from '../types';
import Card from './Card';
import MiniGameProblemChallenge from './MiniGameProblemChallenge';
import { audioService } from '../services/audioService';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';
import { resolveStoneGlowRound, type StoneGlowOutcome } from '../mini-games/stone-glow/stoneGlowRules';

interface TriviaMiniGameProps {
  onBack: () => void;
  onFinish?: (result: 'WIN' | 'LOSE') => void;
  languageMode?: LanguageMode;
  gameScreen?: GameScreen;
  problemMode?: GameMode;
  problemModePool?: string[];
  answerMode?: AnswerMode;
  assignment?: AssignmentPayload | null;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
  onMissionClear?: () => void;
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

const MiniGameMissionClearContext = React.createContext<(() => void) | null>(null);

const ResultBanner: React.FC<{ result: 'WIN' | 'LOSE' | 'DRAW' | null; onRestart: () => void; languageMode: LanguageMode; onWin?: () => void }> = ({ result, onRestart, languageMode, onWin }) => {
  const missionClear = React.useContext(MiniGameMissionClearContext);
  useEffect(() => {
    if (result === 'WIN') (onWin || missionClear)?.();
  }, [missionClear, onWin, result]);
  if (!result) return null;
  return (
    <div className="mini-game-result-banner mb-3 rounded-2xl border border-yellow-300/50 bg-yellow-950/70 p-4 text-center shadow-lg">
      <Trophy className="mx-auto mb-1 text-yellow-300" size={28} />
      <div className="text-lg font-black text-yellow-100">{result === 'WIN' ? text(languageMode, '勝利！', 'Victory!') : result === 'DRAW' ? text(languageMode, '引き分け', 'Draw') : text(languageMode, 'ゲーム終了', 'Game over')}</div>
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
  result: StoneGlowOutcome | null;
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
  next.result = resolveStoneGlowRound({
    playerScore: next.score,
    cpuScore: next.cpuScore,
    playerCardCount: next.owned.length,
    cpuCardCount: next.cpuOwned.length,
    round: next.round,
  });
  if (next.result) {
    next.actionLog.push({
      jp: `後手番まで完了。最終得点はあなた${next.score}点、CPU${next.cpuScore}点です。`,
      en: `The second turn is complete. Final score: You ${next.score}, CPU ${next.cpuScore}.`,
    });
  }
  if (!next.result) next.actionLog.push({ jp: `ラウンド${next.round}。あなたの手番です。`, en: `Round ${next.round}. Your turn.` });
  next.actionLog = next.actionLog.slice(-20);
  return next;
};

const StoneGlowGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE', onMissionClear }) => {
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
    <GameShell scope="stone-glow" title={text(languageMode, '石ころの煌めき', 'Stone Glow')} subtitle={text(languageMode, '8点に達したラウンドは後手番まで進行。同じ手番数で得点を競います。', 'When either side reaches 8, finish the round so both sides receive the same number of turns.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/stone-glow.png" badgeAsset="sprites/backgrounds/mini-games/badges/stone-glow.png" onBack={onBack}>
      <ResultBanner result={game.result} onRestart={restart} languageMode={languageMode} onWin={onMissionClear} />
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
      <div className="stone-glow-summary grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs text-slate-300">{text(languageMode, '獲得カード：', 'Owned cards: ')}{game.owned.length ? game.owned.map(card => card.name).join('、') : text(languageMode, 'まだありません', 'None yet')}</div><div className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs text-slate-400">{text(languageMode, '山札残り：', 'Cards remaining: ')}{game.deck.length}</div></div>
    </GameShell>
  );
};

const copy = (jp: string, en: string): LocalCopy => ({ jp, en });
const copyText = (languageMode: LanguageMode, value: LocalCopy) => text(languageMode, value.jp, value.en);
const MINI_GAME_RULES: Record<string, MiniGameRules> = {
  'stone-glow': {
    summary: copy('石ころを集めて鉱山カードを購入し、割引を育てる対戦ゲームです。', 'Collect stones, buy mine cards, and grow permanent discounts.'),
    goal: copy('どちらかが8点に達したラウンドを後手番まで行い、点数の高い方が勝ち。同点は獲得カードが少ない方、それも同じなら引き分け。', 'After either side reaches 8, finish the round and compare scores. A tie goes to the side with fewer cards; an exact tie is a draw.'),
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
    summary: copy('5×5の盤で駒本来の動きを自由に試し、悪手による敗北から王の守り方を学ぶミニ将棋です。', 'Try every piece-movement destination on a 5x5 board and learn king safety from losing after a mistake.'),
    goal: copy('相手の玉を取る。相手陣の2段に入った駒は一部が自動で成る。', 'Capture the enemy king. Some pieces auto-promote in the enemy camp.'),
    steps: [copy('自分の駒を選び、駒本来の動きで進めるマスを選ぶ。相手の駒を取ると持ち駒になる。', 'Select a piece and any destination allowed by its movement. Captured pieces go to your hand.'), copy('王を危険にする手も実行できる。CPUに王を取られると敗北し、その局面から守り方を学ぶ。', 'Moves exposing your king are allowed. If the CPU captures it, use the defeat to learn how it should have been defended.'), copy('持ち駒を選ぶと、空いたマスへ打てる。', 'Select a held piece to drop it on an empty square.'), copy('歩は同じ筋に2枚置けず、歩・銀・角・飛は敵陣で成る。', 'Two unpromoted pawns cannot share a file; pawn, silver, bishop, and rook promote in the camp.')],
    tip: copy('持ち駒は盤上の駒よりも自由度が高いので、取った駒をすぐに打たず攻めの形を考えます。', 'Held pieces are flexible; consider the attacking shape before dropping them immediately.'),
  },
  go: {
    summary: copy('9路盤に黒と白の石を交互に置き、石のつながりと陣地を競う囲碁です。', 'Place black and white stones on a 9x9 board and compete for groups and territory.'),
    goal: copy('2回連続パスで終局。取った石と囲んだ陣地の合計が高い方が勝ち。', 'Two consecutive passes end the game. Captures plus surrounded territory decide the winner.'),
    steps: [copy('空いている交点に石を置く。上下左右でつながる石の呼吸点がなくなると取られる。', 'Place a stone on an empty intersection. A group is captured when it has no adjacent liberties.'), copy('自分の石を自殺させる手と、直前の盤面に戻るコウは禁止。', 'Suicide moves and immediate repetition of the previous board (ko) are illegal.'), copy('置けない時はパス。お互いにパスすると終局して簡易地計算を行う。', 'Pass when needed. Two passes end the game and trigger simplified territory scoring.')],
    tip: copy('最初は中央を広げ、相手の石を囲むより自分の石の呼吸点を増やすことを意識します。', 'Start by expanding toward the center and keep your own groups connected with liberties.'),
  },
  chess: {
    summary: copy('駒本来の動きを自由に試し、キングを取られる敗北から安全な指し方を学ぶチェスです。', 'Try every piece-movement destination and learn safe play from defeats where your king is captured.'),
    goal: copy('相手のキングを取る。ポーンは最奥段でクイーンに昇格する。', 'Capture the enemy king. Pawns promote to a queen on the last rank.'),
    steps: [copy('自分の駒を選び、駒本来の動きで進めるマスを選ぶ。キングを危険にする手も実行できる。', 'Select a piece and any destination allowed by its movement, including moves that expose your king.'), copy('ナイトは飛び越え、ビショップは斜め、ルークは縦横、クイーンは両方に動く。', 'Knights jump; bishops move diagonally; rooks move straight; queens do both.'), copy('CPUにキングを取られると敗北。取られた局面を見て、どの駒で守るべきだったか学ぶ。', 'If the CPU captures your king, study the losing position and identify the defense you missed.'), copy('相手の攻撃予定を見て、駒をただ取るだけでなく王の安全を優先する。', 'Read the opponent’s threats and prioritize king safety over casual captures.')],
    tip: copy('序盤は中央のポーンとナイトを動かし、キングの周りに逃げ道を残します。', 'Develop central pawns and knights early, and keep escape squares around your king.'),
  },
  mahjong: {
    summary: copy('プラクティスは8枚で形を学び、スタンダードは13枚の手牌でツモ・捨て牌・鳴きを体験する2人対戦麻雀です。', 'Practice teaches hand shapes with eight tiles; Standard is a two-player game with 13-tile hands, draws, discards, and calls.'),
    goal: copy('スタンダードは14枚から1枚を捨て、面子4つ＋対子1つを先に完成させる。プラクティスとアドバンスは短縮手牌で練習する。', 'In Standard, discard from 14 tiles and complete four melds plus a pair first. Practice and Advance use shorter learning hands.'),
    steps: [copy('スタンダードでは13枚からツモって14枚にし、1枚を捨てる。相手の捨て牌にはチー・ポン・ロンで関われる。', 'In Standard, draw from 13 to 14 tiles, then discard one. You can respond to an opponent discard with Chi, Pon, or Ron.'), copy('順子は同じ種類の連番3枚、刻子は同じ牌3枚、対子は同じ牌2枚。', 'A sequence is three consecutive tiles; a triplet is three identical tiles; a pair is two identical tiles.'), copy('「役を見る」と「用語を見る」で、役・鳴き・捨て牌のルールをいつでも確認する。', 'Use View yaku and Glossary to check yaku, calls, and discard rules at any time.'), copy('アドバンスでは短縮局を重ねて報酬を選び、5局目を勝ち抜く。', 'In Advance, clear short rounds, choose rewards, and finish after five rounds.')],
    tip: copy('スタンダードでは孤立した字牌を先に捨てるか、相手の捨て牌からチー・ポンできる形を残すかを考えます。', 'In Standard, decide whether to discard an isolated honor or keep shapes that can call Chi or Pon from an opponent discard.'),
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

const SchoolTrpgGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE', onMissionClear }) => {
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
      <ResultBanner result={game.result} onRestart={restart} languageMode={languageMode} onWin={onMissionClear} />
      <div className="school-trpg-stats mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{TRPG_STATS.map(stat => <div key={stat.id} className="rounded-xl border border-amber-300/20 bg-amber-950/55 p-2 text-center"><div className={`text-[11px] ${stat.className}`}>{copyText(languageMode, stat.label)}</div><div className="text-xl font-black">{game.stats[stat.id]}</div></div>)}</div>
      <div className="school-trpg-objectives mb-3 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg border border-cyan-300/20 bg-cyan-950/50 p-2">{text(languageMode, '手がかり', 'Clues')}<strong className="ml-1 text-cyan-100">{game.clues} / 3</strong></div><div className="rounded-lg border border-rose-300/20 bg-rose-950/50 p-2">{text(languageMode, '疲労', 'Stress')}<strong className="ml-1 text-rose-100">{game.stress} / 6</strong></div><div className="rounded-lg border border-violet-300/20 bg-violet-950/50 p-2">{text(languageMode, '運命', 'Fate')}<strong className="ml-1 text-violet-100">{game.fate}</strong></div></div>
      <section className="school-trpg-panel flex flex-1 flex-col rounded-2xl border border-amber-300/25 bg-slate-900/85 p-4 shadow-xl"><div className="school-trpg-panel-heading mb-2 flex items-center justify-between"><h2 className="text-xl font-black text-amber-100">{copyText(languageMode, scene.title)}</h2><span className="text-xs text-slate-400">{text(languageMode, '場面', 'Scene')} {game.sceneIndex + 1} / {TRPG_SCENES.length}</span></div><p className="school-trpg-scene mb-4 rounded-xl bg-black/25 p-4 leading-7 text-slate-100">{copyText(languageMode, scene.text)}</p><div className="school-trpg-fate mb-3 flex items-center justify-between rounded-xl border border-violet-300/20 bg-violet-950/35 p-3 text-xs text-violet-100"><span>{text(languageMode, '判定前に運命を使うと+2。失敗すると運命が1戻る。', 'Spend Fate before a check for +2. Failed checks restore one Fate.')}</span><button type="button" onClick={() => setUseFate(previous => !previous)} disabled={game.fate <= 0 || !!game.result} data-gamepad-zone="trpg-tools" data-gamepad-order={0} className={`ml-2 shrink-0 rounded-lg px-3 py-2 font-black ${useFate ? 'bg-violet-400 text-slate-950' : 'border border-violet-300/40 bg-violet-900/50'} disabled:opacity-35`}>{useFate ? text(languageMode, '使用中', 'Ready') : text(languageMode, '運命+2', 'Use Fate')}</button></div><div className="school-trpg-choices grid gap-2 sm:grid-cols-2">{scene.choices.map((choice, index) => <button key={choice.label.jp} type="button" onClick={() => choose(choice)} disabled={!!game.result} data-gamepad-zone="trpg-choices" data-gamepad-order={index} className="rounded-xl border border-amber-300/30 bg-amber-900/30 p-3 text-left font-bold transition hover:bg-amber-800/50 disabled:opacity-40"><span className="mr-2 text-amber-300">{index + 1}.</span>{copyText(languageMode, choice.label)}<span className="mt-1 block text-xs font-normal text-slate-300">{text(languageMode, '使う力：', 'Check: ')}{copyText(languageMode, TRPG_STATS.find(stat => stat.id === choice.stat)!.label)} / {text(languageMode, '目標', 'Target')} {choice.difficulty}</span></button>)}</div>{game.lastRoll !== null && <div className="school-trpg-last-roll mt-4 text-sm text-amber-200">{text(languageMode, '直前のダイス：', 'Last roll: ')}{game.lastRoll}</div>}{game.ending && <div className={`school-trpg-ending mt-4 rounded-xl border p-3 font-black ${game.result === 'WIN' ? 'border-emerald-300/40 bg-emerald-950/45 text-emerald-100' : 'border-rose-300/40 bg-rose-950/45 text-rose-100'}`}>{copyText(languageMode, game.ending)}</div>}<div className="school-trpg-log mt-4 space-y-1 text-xs text-slate-300">{game.logs.map((log, index) => <div key={`${log.roll}-${index}`}>🎲 {copyText(languageMode, TRPG_STATS.find(stat => stat.id === log.stat)!.label)} {log.roll} + {log.statValue}{log.fateBonus ? ` + ${log.fateBonus}` : ''} = {log.total} ／ {copyText(languageMode, log.copy)}</div>)}</div></section>
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

const LearningTcgGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE', onMissionClear }) => {
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
      <ResultBanner result={game.result} onRestart={restart} languageMode={languageMode} onWin={onMissionClear} />
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

const ShogiGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE', onMissionClear }) => {
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

const GO_TERMS: Array<{ term: LocalCopy; description: LocalCopy }> = [
  { term: copy('呼吸点', 'Liberty'), description: copy('石またはつながった石の上下左右にある空き交点。すべて塞がれると取られます。', 'An empty adjacent intersection. A connected group is captured when all liberties are filled.') },
  { term: copy('連', 'Chain'), description: copy('上下左右でつながった同じ色の石の集まり。呼吸点を共有します。', 'A group of same-color stones joined vertically or horizontally. The group shares its liberties.') },
  { term: copy('アタリ', 'Atari'), description: copy('あと1つ呼吸点を塞がれると取られる状態。チェスのチェックに近い警告です。', 'A group with only one liberty left, meaning it can be captured on the next move.') },
  { term: copy('地', 'Territory'), description: copy('自分の石だけで囲んだ空き交点。終局時の得点になります。', 'Empty intersections surrounded only by your stones. They score at the end of the game.') },
  { term: copy('コウ', 'Ko'), description: copy('直前と同じ盤面をすぐに作り直す取り返し。無限反復を防ぐため禁止です。', 'An immediate recapture that would recreate the previous board. It is forbidden to prevent an endless loop.') },
  { term: copy('自殺手', 'Suicide'), description: copy('相手を取らず、置いた石の呼吸点が0になる手。このミニゲームでは置けません。', 'A move leaving the played stone with no liberty without capturing. This mini-game disallows it.') },
  { term: copy('パス', 'Pass'), description: copy('石を置かずに手番を渡すこと。2人が連続でパスすると終局です。', 'Yield the turn without playing a stone. Two consecutive passes end the game.') },
];

const GoGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [board, setBoard] = useState<GoBoard>(emptyGoBoard);
  const [playMode, setPlayMode] = useState<'CPU' | 'LOCAL'>('CPU');
  const [side, setSide] = useState<'B' | 'W'>('B');
  const [showTerms, setShowTerms] = useState(false);
  const [captures, setCaptures] = useState(0); const [cpuCaptures, setCpuCaptures] = useState(0); const [passes, setPasses] = useState(0); const [moves, setMoves] = useState(0); const [koKey, setKoKey] = useState(''); const [finalScore, setFinalScore] = useState<{ black: number; white: number } | null>(null); const [result, setResult] = useState<'WIN' | 'LOSE' | 'DRAW' | null>(null);
  const restart = (nextMode = playMode) => { setPlayMode(nextMode); setBoard(emptyGoBoard()); setSide('B'); setCaptures(0); setCpuCaptures(0); setPasses(0); setMoves(0); setKoKey(''); setFinalScore(null); setResult(null); };
  const finish = (finalBoard: GoBoard) => {
    const score = scoreGo(finalBoard); setFinalScore(score); setResult(score.black === score.white ? 'DRAW' : score.black > score.white ? 'WIN' : 'LOSE');
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
    const placed = putGoStone(board, row, col, playMode === 'LOCAL' ? side : 'B'); if (!placed || goBoardKey(placed.board) === koKey) return;
    if (playMode === 'LOCAL') {
      const nextMoves = moves + 1;
      setBoard(placed.board);
      if (side === 'B') setCaptures(value => value + placed.captured); else setCpuCaptures(value => value + placed.captured);
      setKoKey(goBoardKey(board));
      setPasses(0);
      setMoves(nextMoves);
      setSide(side === 'B' ? 'W' : 'B');
      if (nextMoves >= 90) finish(placed.board);
      return;
    }
    const cpu = cpuTurn(placed.board, goBoardKey(board)); const nextMoves = moves + 1;
    if (!cpu) { setBoard(placed.board); setCaptures(captures + placed.captured); setPasses(previous => previous + 1); setMoves(nextMoves); if (passes + 1 >= 2 || nextMoves >= 45) finish(placed.board); return; }
    const nextPasses = 0; setBoard(cpu.board); setCaptures(captures + placed.captured); setCpuCaptures(cpuCaptures + cpu.captured); setPasses(nextPasses); setMoves(nextMoves); setKoKey(goBoardKey(placed.board)); if (nextMoves >= 45) finish(cpu.board);
  };
  const pass = () => {
    if (result) return;
    const nextPasses = passes + 1;
    if (nextPasses >= 2) { finish(board); setPasses(nextPasses); return; }
    if (playMode === 'LOCAL') {
      setPasses(nextPasses);
      setSide(side === 'B' ? 'W' : 'B');
      setMoves(value => value + 1);
      return;
    }
    const cpu = cpuTurn(board, koKey);
    if (!cpu) { finish(board); setPasses(2); return; }
    setBoard(cpu.board); setCpuCaptures(cpuCaptures + cpu.captured); setPasses(0); setKoKey(goBoardKey(board)); setMoves(value => value + 1);
  };
  return <GameShell scope="go" title={text(languageMode, '九路盤 囲碁', 'Nine-Ring Go')} subtitle={text(languageMode, 'コウ・自殺手・パス・陣地計算を使う9路盤。2回連続パスで終局します。', 'A 9x9 Go board with ko, suicide, passing, and territory scoring. Two consecutive passes end the game.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/go.png" badgeAsset="sprites/backgrounds/mini-games/badges/go.png" onBack={onBack}>
    {playMode === 'CPU' ? <ResultBanner result={result} onRestart={() => restart()} languageMode={languageMode} /> : result && <div className="mini-game-result-banner mb-3 rounded-2xl border border-yellow-300/50 bg-yellow-950/70 p-3 text-center font-black text-yellow-100">{result === 'DRAW' ? text(languageMode, '引き分け', 'Draw') : result === 'WIN' ? text(languageMode, '黒の勝利！', 'Black wins!') : text(languageMode, '白の勝利！', 'White wins!')}<button type="button" onClick={() => restart()} className="ml-3 rounded-lg bg-yellow-400 px-3 py-2 text-slate-950">{text(languageMode, 'もう一局', 'Play again')}</button></div>}
    <div className="mini-game-local-mode mb-3 grid grid-cols-2 gap-2"><button type="button" className={playMode === 'CPU' ? 'active' : ''} onClick={() => restart('CPU')}>{text(languageMode, 'CPU対戦', 'VS CPU')}</button><button type="button" className={playMode === 'LOCAL' ? 'active' : ''} onClick={() => restart('LOCAL')}>{text(languageMode, '対面対戦', 'Face-to-face')}</button></div>
    <div className="go-scoreboard mb-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4"><div className="rounded-xl border border-slate-400/30 bg-slate-950/65 p-2 text-sm">{text(languageMode, '黒の捕獲', 'Black captures')}<strong className="ml-1">{captures}</strong></div><div className="rounded-xl border border-white/20 bg-white/15 p-2 text-sm">{text(languageMode, '白の捕獲', 'White captures')}<strong className="ml-1">{cpuCaptures}</strong></div><div className="rounded-xl border border-amber-300/25 bg-amber-950/55 p-2 text-sm">{playMode === 'LOCAL' ? text(languageMode, side === 'B' ? '黒の手番' : '白の手番', side === 'B' ? 'Black turn' : 'White turn') : text(languageMode, '手数', 'Moves')}<strong className="ml-1">{moves} / {playMode === 'LOCAL' ? 90 : 45}</strong></div><div className="rounded-xl border border-cyan-300/25 bg-cyan-950/55 p-2 text-sm">{text(languageMode, '連続パス', 'Passes')}<strong className="ml-1">{passes} / 2</strong></div></div>
    <div className="go-board-area flex flex-1 flex-col items-center"><div className="go-board mb-3 grid aspect-square w-full max-w-[min(90vw,540px)] grid-cols-9 rounded-xl border-4 border-amber-700 bg-amber-200/90 p-2">{board.flatMap((line, row) => line.map((cell, col) => <button key={`${row}-${col}`} type="button" onClick={() => place(row, col)} data-gamepad-zone="go-board" data-gamepad-order={row * 9 + col} className="relative flex aspect-square items-center justify-center border border-amber-900/35 text-xl sm:text-2xl">{(row === 2 || row === 4 || row === 6) && (col === 2 || col === 4 || col === 6) && <span className="absolute h-1.5 w-1.5 rounded-full bg-amber-900" />}{cell && <span className={`relative z-10 h-[80%] w-[80%] rounded-full shadow-lg ${cell === 'B' ? 'bg-slate-950' : 'bg-white'}`} />}</button>))}</div><div className="go-actions mb-3 flex flex-wrap justify-center gap-2"><button type="button" onClick={pass} disabled={!!result} data-gamepad-zone="go-actions" data-gamepad-order={0} className="rounded-xl border border-cyan-300/40 bg-cyan-700/80 px-5 py-3 font-black hover:bg-cyan-600 disabled:opacity-35">{text(languageMode, 'パス', 'Pass')}</button><button type="button" onClick={() => setShowTerms(true)} className="rounded-xl border border-amber-300/40 bg-amber-900/70 px-5 py-3 font-black text-amber-100">{text(languageMode, '用語・初心者ガイド', 'Terms & beginner guide')}</button></div>{finalScore && <div className="go-final-score mb-3 rounded-xl border border-amber-300/30 bg-amber-950/55 p-3 text-center text-sm text-amber-100">{text(languageMode, '終局スコア 黒：', 'Final score Black: ')}{finalScore.black} ／ {text(languageMode, '白：', 'White: ')}{finalScore.white}</div>}<div className="go-guide max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">{text(languageMode, '相手の石を取るだけでなく、空点を囲むと地になります。まず呼吸点を残し、石を上下左右につなげましょう。', 'Surrounded empty points become territory. Start by preserving liberties and connecting stones vertically or horizontally.')}</div></div>
    {showTerms && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3" data-gamepad-modal="true"><section role="dialog" aria-modal="true" className="mini-game-rules-modal max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-200/40 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-amber-100">{text(languageMode, '囲碁の用語と初心者ルール', 'Go terms and beginner rules')}</h2><p className="mt-1 text-xs text-slate-300">{text(languageMode, '黒が先手。空いた交点に1手ずつ置き、地と盤上の石の合計を競います。', 'Black moves first. Place one stone per turn and compete by stones plus surrounded territory.')}</p></div><button type="button" onClick={() => setShowTerms(false)} className="rounded-lg border border-white/20 px-3 py-2">{text(languageMode, '閉じる', 'Close')}</button></div><div className="space-y-2">{GO_TERMS.map(entry => <article key={entry.term.jp} className="rounded-xl border border-white/10 bg-white/5 p-3"><h3 className="font-black text-cyan-100">{copyText(languageMode, entry.term)}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{copyText(languageMode, entry.description)}</p></article>)}</div></section></div>}
  </GameShell>;
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
const allChessMoves = (board: ChessBoard, side: 'P' | 'C') => board.flatMap((line, row) => line.flatMap((piece, col) => piece?.side === side ? chessMoves(board, row, col).map(to => ({ from: [row, col] as [number, number], to, captured: board[to[0]][to[1]] })) : []));

const CHESS_PIECE_GUIDE: Array<{ kind: ChessPiece['kind']; name: LocalCopy; move: LocalCopy }> = [
  { kind: 'K', name: copy('キング', 'King'), move: copy('縦・横・斜めの隣のマスへ1マス。本作では危険なマスへも動かせ、取られた失敗から学びます。', 'One square vertically, horizontally, or diagonally. This learning mode allows risky moves so a captured king teaches the consequence.') },
  { kind: 'Q', name: copy('クイーン', 'Queen'), move: copy('縦・横・斜めへ、他の駒にぶつかるまで何マスでも。', 'Any number of squares vertically, horizontally, or diagonally until blocked.') },
  { kind: 'R', name: copy('ルーク', 'Rook'), move: copy('縦・横へ、他の駒にぶつかるまで何マスでも。', 'Any number of squares vertically or horizontally until blocked.') },
  { kind: 'B', name: copy('ビショップ', 'Bishop'), move: copy('斜めへ、他の駒にぶつかるまで何マスでも。', 'Any number of squares diagonally until blocked.') },
  { kind: 'N', name: copy('ナイト', 'Knight'), move: copy('縦2マス＋横1マス、または縦1マス＋横2マス。間の駒を跳び越えます。', 'Two squares in one direction plus one perpendicular square. It jumps over pieces.') },
  { kind: 'P', name: copy('ポーン', 'Pawn'), move: copy('前へ1マス。相手の駒は斜め前の1マスで取り、最奥段でクイーンに成ります。', 'One square forward; captures one square diagonally forward and promotes to a queen on the last rank.') },
];

const ChessGame: React.FC<TriviaMiniGameProps> = ({ onBack, languageMode = 'JAPANESE' }) => {
  const [board, setBoard] = useState<ChessBoard>(createChessBoard); const [selected, setSelected] = useState<[number, number] | null>(null); const [turn, setTurn] = useState(1); const [lastCapture, setLastCapture] = useState<ChessPiece['kind'] | null>(null); const [result, setResult] = useState<'WIN' | 'LOSE' | null>(null);
  const [playMode, setPlayMode] = useState<'CPU' | 'LOCAL'>('CPU');
  const [side, setSide] = useState<'P' | 'C'>('P');
  const [showMoves, setShowMoves] = useState(false);
  const [lesson, setLesson] = useState(text(languageMode, '駒を選ぶと、駒本来の移動先を表示します。', 'Select a piece to show every destination allowed by its movement.'));
  const restart = (nextMode = playMode) => { setPlayMode(nextMode); setBoard(createChessBoard()); setSelected(null); setSide('P'); setTurn(1); setLastCapture(null); setResult(null); setLesson(text(languageMode, '駒を選ぶと、駒本来の移動先を表示します。', 'Select a piece to show every destination allowed by its movement.')); };
  const move = (row: number, col: number) => {
    if (result) return;
    const movingSide = playMode === 'LOCAL' ? side : 'P';
    if (!selected) { if (board[row][col]?.side === movingSide) { setSelected([row, col]); setLesson(text(languageMode, '駒本来の移動先です。キングが危険になる手も実行できます。', 'These are the piece-movement destinations. Moves exposing your king are playable.')); } return; }
    const [fromRow, fromCol] = selected;
    if (board[row][col]?.side === movingSide) { setSelected([row, col]); setLesson(text(languageMode, '別の駒の移動先を表示しました。', 'Showing the newly selected piece movement.')); return; }
    const movementAllowed = chessMoves(board, fromRow, fromCol).some(([toRow, toCol]) => toRow === row && toCol === col);
    if (!movementAllowed) { setSelected(null); setLesson(text(languageMode, 'そのマスは、この駒の動きでは移動できません。駒の進み方を確認しましょう。', 'That square is outside this piece movement. Review how the piece travels.')); return; }
    const captured = board[row][col]; let next = chessApplyMove(board, selected, [row, col]);
    if (captured?.kind === 'K') { setBoard(next); setLastCapture(captured.kind); setSelected(null); setResult(movingSide === 'P' ? 'WIN' : 'LOSE'); return; }
    if (playMode === 'LOCAL') {
      const nextSide = movingSide === 'P' ? 'C' : 'P';
      setBoard(next); setSelected(null); setTurn(value => value + 1); setLastCapture(captured?.kind || null); setSide(nextSide);
      setLesson(text(languageMode, nextSide === 'P' ? '白の手番です。' : '黒の手番です。端末を相手へ渡してください。', nextSide === 'P' ? 'White to move.' : 'Black to move. Pass the device to the other player.'));
      return;
    }
    const cpuMoves = allChessMoves(next, 'C');
    if (cpuMoves.length === 0) { setBoard(next); setSelected(null); setResult('WIN'); return; }
    const values: Record<ChessPiece['kind'], number> = { K: 100, Q: 9, R: 5, B: 3, N: 3, P: 1 };
    cpuMoves.sort((a, b) => (b.captured ? values[b.captured.kind] : 0) - (a.captured ? values[a.captured.kind] : 0)); const cpuMove = cpuMoves[0]; const cpuCaptured = next[cpuMove.to[0]][cpuMove.to[1]]; next = chessApplyMove(next, cpuMove.from, cpuMove.to);
    setBoard(next); setSelected(null); setTurn(value => value + 1); setLastCapture(cpuCaptured?.kind || captured?.kind || null); setLesson(cpuCaptured?.kind === 'K' ? text(languageMode, 'CPUにキングを取られました。この敗北局面から、直前の守り方を確認しましょう。', 'The CPU captured your king. Study this position and find the defense you missed.') : text(languageMode, 'CPUが指しました。キングへの攻撃筋を確認しましょう。', 'The CPU replied. Check every attack line toward your king.'));
    if (cpuCaptured?.kind === 'K') setResult('LOSE');
  };
  const checkedSide = playMode === 'LOCAL' ? side : 'P';
  const playerInCheck = isChessInCheck(board, checkedSide);
  const movementTargets = selected ? chessMoves(board, selected[0], selected[1]) : [];
  const isMovementTarget = (row: number, col: number) => movementTargets.some(([targetRow, targetCol]) => targetRow === row && targetCol === col);
  return <GameShell scope="chess" title={text(languageMode, 'スクールチェス', 'School Chess')} subtitle={text(languageMode, '悪手も実行し、キングを取られる敗北から安全を学ぶ簡易チェス。', 'A learning chess duel where losing your king teaches safe play.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/chess.png" badgeAsset="sprites/backgrounds/mini-games/badges/chess.png" onBack={onBack}>
    {playMode === 'CPU' ? <ResultBanner result={result} onRestart={() => restart()} languageMode={languageMode} /> : result && <div className="mini-game-result-banner mb-3 rounded-2xl border border-yellow-300/50 bg-yellow-950/70 p-3 text-center font-black text-yellow-100">{result === 'WIN' ? text(languageMode, '白の勝利！', 'White wins!') : text(languageMode, '黒の勝利！', 'Black wins!')}<button type="button" onClick={() => restart()} className="ml-3 rounded-lg bg-yellow-400 px-3 py-2 text-slate-950">{text(languageMode, 'もう一局', 'Play again')}</button></div>}
    <div className="mini-game-local-mode mb-3 grid grid-cols-2 gap-2"><button type="button" className={playMode === 'CPU' ? 'active' : ''} onClick={() => restart('CPU')}>{text(languageMode, 'CPU対戦', 'VS CPU')}</button><button type="button" className={playMode === 'LOCAL' ? 'active' : ''} onClick={() => restart('LOCAL')}>{text(languageMode, '対面対戦', 'Face-to-face')}</button></div>
    <div className="chess-scoreboard mb-3 grid grid-cols-3 gap-2 text-center text-sm">
      <div className="rounded-xl border border-cyan-300/25 bg-cyan-950/60 p-2">{text(languageMode, '手番', 'Turn')} {turn}</div>
      <div className={`rounded-xl border p-2 ${playerInCheck ? 'border-rose-300/60 bg-rose-950/70 text-rose-100' : 'border-emerald-300/25 bg-emerald-950/55'}`}>{playMode === 'LOCAL' ? text(languageMode, side === 'P' ? '白の手番' : '黒の手番', side === 'P' ? 'White turn' : 'Black turn') : playerInCheck ? text(languageMode, 'チェックされています', 'You are in check') : text(languageMode, '自分のキングは安全', 'King is safe')}</div>
      <div className="rounded-xl border border-amber-300/25 bg-amber-950/55 p-2">{text(languageMode, '最後の捕獲', 'Last capture')} {lastCapture || '-'}</div>
    </div>
    <div className="chess-lesson mb-2 w-full rounded-lg border border-cyan-300/25 bg-slate-950/80 px-3 py-2 text-center text-xs text-cyan-100">{lesson}</div>
    <div className="chess-board-area flex flex-1 flex-col items-center">
      <div className="chess-board grid w-full max-w-[min(90vw,560px)] grid-cols-8 gap-0.5 rounded-xl border-4 border-sky-900 bg-sky-950 p-2">
        {board.flatMap((line, boardRow) => line.map((piece, boardCol) => {
          const selectedHere = selected?.[0] === boardRow && selected?.[1] === boardCol;
          const movementTarget = isMovementTarget(boardRow, boardCol);
          const captureTarget = movementTarget && Boolean(piece);
          return <button key={`${boardRow}-${boardCol}`} type="button" onClick={() => move(boardRow, boardCol)} data-gamepad-zone="chess-board" data-gamepad-order={boardRow * 8 + boardCol} aria-label={movementTarget ? text(languageMode, captureTarget ? '駒の動きで取れるマス' : '駒の動きで移動できるマス', captureTarget ? 'Capture by piece movement' : 'Piece-movement destination') : undefined} className={`relative aspect-square text-2xl font-black sm:text-4xl ${selectedHere ? 'bg-cyan-400 text-slate-950' : (boardRow + boardCol) % 2 === 0 ? 'bg-sky-100 text-slate-900' : 'bg-sky-700 text-white'} ${movementTarget ? captureTarget ? 'ring-4 ring-inset ring-rose-400/90' : 'ring-4 ring-inset ring-cyan-400/90' : ''}`}>
            {piece && <span className={`relative z-10 ${piece.side === 'P' ? 'text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]' : 'text-slate-950'}`}>{chessGlyph(piece)}</span>}
            {movementTarget && <span aria-hidden="true" className={captureTarget ? 'pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-2xl font-black text-rose-500/90' : 'pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-3xl font-black text-cyan-900/75'}>{captureTarget ? '×' : '•'}</span>}
          </button>;
        }))}
      </div>
      <div className="chess-guide mt-3 flex max-w-md flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300"><span>{text(languageMode, '青い点は駒本来の移動先、赤い×は捕獲先です。キングが取られる手も実行できます。', 'Blue dots show movement destinations; red × marks captures. Moves that expose the king remain playable.')}</span><button type="button" onClick={() => setShowMoves(true)} className="rounded-lg border border-cyan-300/40 bg-cyan-900/70 px-3 py-2 font-black text-cyan-100">{text(languageMode, '駒の動きを確認', 'Piece movement')}</button></div>
    </div>
    {showMoves && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3" data-gamepad-modal="true"><section role="dialog" aria-modal="true" className="mini-game-rules-modal max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-cyan-200/40 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-cyan-100">{text(languageMode, 'チェス駒の動き', 'Chess piece movement')}</h2><button type="button" onClick={() => setShowMoves(false)} className="rounded-lg border border-white/20 px-3 py-2">{text(languageMode, '閉じる', 'Close')}</button></div><div className="space-y-2">{CHESS_PIECE_GUIDE.map(entry => <article key={entry.kind} className="grid grid-cols-[52px_1fr] gap-3 rounded-xl border border-white/10 bg-white/5 p-3"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-4xl text-slate-950">{chessGlyph({ kind: entry.kind, side: 'P' })}</span><div><h3 className="font-black text-cyan-100">{copyText(languageMode, entry.name)}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{copyText(languageMode, entry.move)}</p></div></article>)}</div></section></div>}
  </GameShell>;
};

type MahjongTile = { key: string; id: string; suit: 'm' | 'p' | 's' | 'z'; value: number; label: string };
const createMahjongTiles = () => {
  const tiles: MahjongTile[] = [];
  (['m', 'p', 's'] as const).forEach(suit => { for (let value = 1; value <= 9; value += 1) for (let copyIndex = 0; copyIndex < 4; copyIndex += 1) tiles.push({ key: `${suit}${value}`, id: `${suit}${value}-${copyIndex}`, suit, value, label: `${value}${suit === 'm' ? '萬' : suit === 'p' ? '筒' : '索'}` }); });
  [['z1', '東'], ['z2', '南'], ['z3', '西'], ['z4', '北'], ['z5', '白'], ['z6', '發'], ['z7', '中']].forEach(([key, label], index) => { for (let copyIndex = 0; copyIndex < 4; copyIndex += 1) tiles.push({ key, id: `${key}-${copyIndex}`, suit: 'z', value: index + 1, label }); });
  return tiles;
};
const MAHJONG_TILE_POOL = createMahjongTiles();
const shuffleMahjong = (tiles: MahjongTile[]) => {
  const shuffled = [...tiles];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};
const MAHJONG_SUIT_ORDER: MahjongTile['suit'][] = ['m', 'p', 's', 'z'];
const MAHJONG_SUIT_META: Record<MahjongTile['suit'], { jp: string; en: string; shortJp: string; shortEn: string }> = {
  m: { jp: '萬子', en: 'Characters', shortJp: '萬', shortEn: 'M' },
  p: { jp: '筒子', en: 'Dots', shortJp: '筒', shortEn: 'P' },
  s: { jp: '索子', en: 'Bamboo', shortJp: '索', shortEn: 'S' },
  z: { jp: '字牌', en: 'Honors', shortJp: '字', shortEn: 'Z' },
};
const mahjongTileText = (languageMode: LanguageMode, tile: MahjongTile) => languageMode === 'ENGLISH'
  ? (tile.suit === 'z' ? ['East', 'South', 'West', 'North', 'White', 'Green', 'Red'][tile.value - 1] : `${tile.value}${MAHJONG_SUIT_META[tile.suit].shortEn}`)
  : trans(tile.label, languageMode);
const mahjongTileSuitLabel = (languageMode: LanguageMode, tile: MahjongTile) => {
  if (tile.suit === 'z') return text(languageMode, tile.value <= 4 ? '風牌' : '三元牌', tile.value <= 4 ? 'Winds' : 'Dragons');
  return text(languageMode, MAHJONG_SUIT_META[tile.suit].jp, MAHJONG_SUIT_META[tile.suit].en);
};
const mahjongTileAria = (languageMode: LanguageMode, tile: MahjongTile) => languageMode === 'ENGLISH'
  ? `${mahjongTileText(languageMode, tile)} tile, ${mahjongTileSuitLabel(languageMode, tile)}`
  : `${mahjongTileText(languageMode, tile)}・${mahjongTileSuitLabel(languageMode, tile)}`;
const MahjongTileFace: React.FC<{ tile: MahjongTile; languageMode: LanguageMode }> = ({ tile, languageMode }) => {
  const meta = MAHJONG_SUIT_META[tile.suit];
  const isHonor = tile.suit === 'z';
  return (
    <span className={`mahjong-tile-face mahjong-tile-suit-${tile.suit}`}>
      <span className="mahjong-tile-suit-label">{mahjongTileSuitLabel(languageMode, tile)}</span>
      <span className="mahjong-tile-value">{isHonor ? mahjongTileText(languageMode, tile) : tile.value}</span>
      <span className={`mahjong-tile-suit-mark ${isHonor ? 'mahjong-tile-suit-mark-empty' : ''}`} aria-hidden={isHonor}>{isHonor ? '\u00a0' : text(languageMode, meta.shortJp, meta.shortEn)}</span>
    </span>
  );
};
type MahjongYaku = { name: LocalCopy; description: LocalCopy; recommended?: boolean };
const MAHJONG_YAKU: MahjongYaku[] = [
  { name: copy('タンヤオ', 'Tanyao'), description: copy('2〜8の数牌だけでそろえる役。字牌と1・9を使わないので、順子を作りやすい。', 'A hand made only of number tiles 2–8. Avoiding honors and 1/9 makes sequences easier.'), recommended: true },
  { name: copy('役牌', 'Value tiles'), description: copy('白・發・中、または場風／自風を3枚そろえる役。刻子を作る目印になる。', 'A triplet of dragons or relevant winds. It is a clear target when you already have a pair of honors.'), recommended: true },
  { name: copy('平和', 'Pinfu'), description: copy('順子中心で、待ちや対子にも条件がある役。まずは数牌を連番でつなげる練習になる。', 'A sequence-focused yaku with extra conditions on the pair and wait. It is a good sequence-building exercise.'), recommended: true },
  { name: copy('一盃口', 'Pure double sequence'), description: copy('同じ順子を2組そろえる役。似た形が2つ見えた時に狙える。', 'Two identical sequences. Consider it when two matching sequence shapes appear.') },
  { name: copy('七対子', 'Seven pairs'), description: copy('7組の対子で作る役。本作の8枚ルールでは練習用の知識として紹介。', 'Seven pairs. In this eight-tile mini-game it is shown as a learning reference.') },
];
type MahjongGlossaryEntry = { term: LocalCopy; description: LocalCopy; example: LocalCopy };
const MAHJONG_GLOSSARY: MahjongGlossaryEntry[] = [
  { term: copy('数牌', 'Number tiles'), description: copy('萬子・筒子・索子の1〜9。数字の連続を作る材料です。', 'The 1–9 tiles in Characters, Dots, and Bamboo. They form number sequences.'), example: copy('萬子の2・3・4は順子の候補。', 'Characters 2-3-4 can form a sequence.') },
  { term: copy('字牌', 'Honor tiles'), description: copy('東南西北の風牌と、白發中の三元牌。数字の順子は作れません。', 'Wind tiles East, South, West, North and dragon tiles White, Green, Red. They cannot form sequences.'), example: copy('字牌は同じ3枚で刻子を作る。', 'Three identical honors form a triplet.') },
  { term: copy('面子', 'Meld'), description: copy('順子または刻子の3枚組。完成形を作る基本単位です。', 'A three-tile group that is either a sequence or a triplet.'), example: copy('本作では面子2つを目指す。', 'This game asks you to build two melds.') },
  { term: copy('順子', 'Sequence'), description: copy('同じスートの連続した数字3枚。字牌では作れません。', 'Three consecutive numbers in the same suit. Honors cannot make sequences.'), example: copy('筒子の4・5・6が順子。', 'Dots 4-5-6 is a sequence.') },
  { term: copy('刻子', 'Triplet'), description: copy('まったく同じ牌を3枚そろえた面子です。', 'A meld of three identical tiles.'), example: copy('中・中・中は刻子。', 'Red dragon x3 is a triplet.') },
  { term: copy('対子', 'Pair'), description: copy('同じ牌2枚の組。完成形の最後の土台になります。', 'Two identical tiles. It is the pair that completes the hand shape.'), example: copy('索子の7・7が対子。', 'Bamboo 7-7 is a pair.') },
  { term: copy('待ち', 'Wait'), description: copy('あと1枚で面子や完成形になる、欲しい牌の候補です。', 'The tile or tiles that would complete a meld or hand shape.'), example: copy('2・3を持っていれば4や1が待ちになることがある。', 'With 2-3, a 1 or 4 may complete the sequence.') },
  { term: copy('ツモ', 'Tsumo'), description: copy('山から牌を1枚引くこと。スタンダードでは13枚の手牌を14枚にしてから捨て牌を選びます。', 'Drawing one tile from the wall. In Standard, draw from 13 to 14 tiles before choosing a discard.'), example: copy('山牌から1枚ツモって、手牌の形を見直す。', 'Draw one tile from the wall and reassess the hand.') },
  { term: copy('捨て牌', 'Discard'), description: copy('手牌から場に出す牌。自分の捨て牌は相手のチー・ポン・ロンの対象にもなります。', 'A tile placed from your hand into the discard area. Your discard can also become an opponent’s Chi, Pon, or Ron target.'), example: copy('相手の待ちを助けない牌を選んで捨てる。', 'Choose a tile that is less likely to help the opponent.') },
  { term: copy('鳴き', 'Call'), description: copy('相手の捨て牌を使って面子を作ること。チーとポンがあり、鳴いた後は手牌の自由度が下がります。', 'Using an opponent discard to make an open meld. Chi and Pon are calls that reduce the flexibility of the concealed hand.'), example: copy('急いで鳴く前に、完成形と残りの待ちを確認する。', 'Check the target hand and remaining waits before calling.') },
  { term: copy('チー', 'Chi'), description: copy('相手の捨て牌を使い、同じ種類の連番3枚を作ること。本作は2人用のため、相手の捨て牌を対象にします。', 'Calling a sequence with an opponent discard. This two-player version uses the opponent discard as the call target.'), example: copy('萬子の2・3を持っている時、相手の萬子4でチー。', 'With Characters 2-3, call Chi on an opponent’s Characters 4.') },
  { term: copy('ポン', 'Pon'), description: copy('相手の捨て牌と同じ牌を手牌から2枚出して、刻子を作ること。', 'Calling a triplet by combining an opponent discard with two identical tiles from your hand.'), example: copy('發を2枚持っている時、相手の發でポン。', 'With two Green dragons, call Pon on an opponent’s Green dragon.') },
  { term: copy('ロン', 'Ron'), description: copy('相手の捨て牌で完成形になる時に宣言する和了。自分のツモより早く決着できます。', 'Declaring a win when an opponent discard completes your hand. It can end the hand before your next draw.'), example: copy('最後の待ち牌が相手から捨てられたらロン。', 'Call Ron when the opponent discards your final waiting tile.') },
  { term: copy('副露', 'Open meld'), description: copy('チー・ポンなどで公開した面子。公開した面子は手牌とは別に表示されます。', 'A revealed meld made through Chi or Pon. Revealed melds are displayed separately from the concealed hand.'), example: copy('ポンした刻子は副露として場に残る。', 'A Pon triplet stays visible as an open meld.') },
  { term: copy('2人麻雀', 'Two-player mahjong'), description: copy('本作のスタンダードはCPUとの2人対戦。山を共有し、先に完成した側が勝ちます。', 'Standard is a two-player match against the CPU. Both players share the wall, and the first completed hand wins.'), example: copy('相手の捨て牌と自分の待ちを同時に観察する。', 'Watch both the opponent’s discards and your own waits.') },
  { term: copy('役', 'Yaku'), description: copy('手牌の形や条件によるボーナス。まず完成形を作り、次に役を意識します。', 'A bonus pattern or condition. Build the hand shape first, then pursue yaku.'), example: copy('タンヤオは2〜8の数牌だけを使う役。', 'Tanyao uses only number tiles 2–8.') },
];
type MahjongRelic = { id: 'tile-compass' | 'long-notes' | 'score-seal' | 'honor-guard'; name: LocalCopy; description: LocalCopy };
const MAHJONG_RELICS: MahjongRelic[] = [
  { id: 'tile-compass', name: copy('牌効率の羅針盤', 'Tile Efficiency Compass'), description: copy('アドバンス中、捨て牌の後に山の上位2枚から手牌の形が良い方を引く。', 'In Advance mode, compare the top two wall tiles after a discard and draw the better hand shape.') },
  { id: 'long-notes', name: copy('長考ノート', 'Deep Thought Notes'), description: copy('各局の制限巡目が2増える。焦らず待ちを探せる。', 'Each round gains two extra turns, giving you more time to find a wait.') },
  { id: 'score-seal', name: copy('得点の封印', 'Score Seal'), description: copy('完成しなかった最終巡目でも、比較点に+1。僅差の勝負を支える。', 'Adds +1 to the tiebreak score when the final turn decides an unfinished hand.') },
  { id: 'honor-guard', name: copy('字牌の守り札', 'Honor Guard Talisman'), description: copy('CPUの完成を1局につき1度だけ1巡遅らせる。', 'Once per round, delay a CPU completion by one turn.') },
];
type MahjongCpuProfile = 'COLLECTOR' | 'SEQUENCE' | 'DEFENDER' | 'GAMBLER';
type MahjongEventEffect = 'OBSERVE' | 'SCORE_BOOST' | 'HONOR_FOCUS' | 'SHAPE_HINT' | 'WAIT_PEEK' | 'SAFE_ROUTE' | 'BOLD_ROUTE' | 'RELIC_LINK';
type MahjongDiscardRisk = 'SAFE' | 'CAUTION' | 'DANGER';
type MahjongAdvanceEventChoice = { id: MahjongEventEffect; label: LocalCopy; description: LocalCopy };
type MahjongAdvanceEvent = { title: LocalCopy; description: LocalCopy; choices: MahjongAdvanceEventChoice[] };
type MahjongAdvanceStage = {
  stage: number;
  title: LocalCopy;
  objective: LocalCopy;
  rule: LocalCopy;
  eventTurn: number;
  cpuProfile: MahjongCpuProfile;
  event: MahjongAdvanceEvent;
};
const MAHJONG_CPU_PROFILE_META: Record<MahjongCpuProfile, { name: LocalCopy; description: LocalCopy }> = {
  COLLECTOR: { name: copy('収集家', 'Collector'), description: copy('対子と字牌を残し、刻子を狙います。', 'Keeps pairs and honors, aiming for triplets.') },
  SEQUENCE: { name: copy('連番職人', 'Sequence Crafter'), description: copy('同じスートの連番を優先します。', 'Prioritizes connected tiles in one suit.') },
  DEFENDER: { name: copy('守備型', 'Defender'), description: copy('安全な形を残し、終盤の比較に強い相手です。', 'Keeps safe shapes and performs well in late comparisons.') },
  GAMBLER: { name: copy('勝負師', 'Risk Taker'), description: copy('高得点を狙う代わりに、完成が不安定です。', 'Chases high scores at the cost of consistency.') },
};
const MAHJONG_ADVANCE_STAGES: MahjongAdvanceStage[] = [
  {
    stage: 1,
    title: copy('第1局：手ならし', 'Round 1: Warm-up'),
    objective: copy('面子2つ＋対子1つを作り、牌のつながりを見つける。', 'Build two melds and a pair while learning tile connections.'),
    rule: copy('最初の3巡は、補充候補の形評価が表示されます。', 'For the first three turns, the replacement choice shows a shape hint.'),
    eventTurn: 3,
    cpuProfile: 'COLLECTOR',
    event: {
      title: copy('山の気配', 'Read the wall'),
      description: copy('次の補充を読みます。形の安定を取るか、得点を伸ばすか選びましょう。', 'Read the next draw. Choose stability or a small score boost.'),
      choices: [
        { id: 'OBSERVE', label: copy('山を読む', 'Read the wall'), description: copy('次の補充候補を2枚比較し、形が良い方を選びます。', 'Compare two replacement candidates and keep the better shape.') },
        { id: 'SCORE_BOOST', label: copy('形を磨く', 'Polish the shape'), description: copy('この局の比較点に+1。完成を急がず形を整えます。', '+1 comparison point this round. Refine the shape instead of rushing.') },
      ],
    },
  },
  {
    stage: 2,
    title: copy('第2局：字牌の使い道', 'Round 2: Honor tiles'),
    objective: copy('字牌の刻子または対子を1組含めて完成を目指す。', 'Aim to finish with one honor pair or triplet.'),
    rule: copy('字牌を含む完成形には、比較点ボーナスが入ります。', 'A completed shape containing honors receives a comparison bonus.'),
    eventTurn: 3,
    cpuProfile: 'SEQUENCE',
    event: {
      title: copy('字牌の分岐', 'Honor fork'),
      description: copy('字牌を守るか、数牌の連番を伸ばすかを選びます。', 'Choose whether to protect honors or extend a number sequence.'),
      choices: [
        { id: 'HONOR_FOCUS', label: copy('字牌を守る', 'Protect honors'), description: copy('字牌の対子・刻子を比較点に加点します。', 'Add a bonus for an honor pair or triplet.') },
        { id: 'SHAPE_HINT', label: copy('連番を伸ばす', 'Extend a sequence'), description: copy('次の補充で形が良くなる候補を優先します。', 'Prefer a replacement that improves the shape.') },
      ],
    },
  },
  {
    stage: 3,
    title: copy('第3局：待ちの読み合い', 'Round 3: Read the wait'),
    objective: copy('2種類以上の待ち候補を残し、相手の捨て牌も観察する。', 'Keep at least two wait candidates and read the opponent discard.'),
    rule: copy('相手の捨て牌から、危険度の目安を確認できます。', 'A danger hint appears for the opponent discard.'),
    eventTurn: 4,
    cpuProfile: 'DEFENDER',
    event: {
      title: copy('静かな一打', 'A quiet discard'),
      description: copy('次の一手で情報を取るか、安全に巡目を延ばすかを選びます。', 'Choose information for the next draw or a safer extra turn.'),
      choices: [
        { id: 'WAIT_PEEK', label: copy('待ちを覗く', 'Peek at the wait'), description: copy('山の先頭牌を確認し、待ちの候補として表示します。', 'Reveal the top wall tile as a wait clue.') },
        { id: 'SAFE_ROUTE', label: copy('安全に進む', 'Take the safe route'), description: copy('制限巡目を1つ延長し、焦らず判断します。', 'Gain one extra turn and make a calmer decision.') },
      ],
    },
  },
  {
    stage: 4,
    title: copy('第4局：決断の分岐', 'Round 4: The decision'),
    objective: copy('安全重視か高得点重視かを選び、制限巡目までに勝負を決める。', 'Choose safety or high score and settle the match before the limit.'),
    rule: copy('途中イベントの選択が、終盤の勝ち筋を変えます。', 'The event choice changes your endgame route.'),
    eventTurn: 4,
    cpuProfile: 'GAMBLER',
    event: {
      title: copy('勝負の分岐', 'Fork in the road'),
      description: copy('安定して1巡増やすか、得点を伸ばして一気に決めるかを選びます。', 'Choose one safe extra turn or a burst of comparison points.'),
      choices: [
        { id: 'SAFE_ROUTE', label: copy('安全重視', 'Play safe'), description: copy('制限巡目を1つ延長します。', 'Gain one extra turn.') },
        { id: 'BOLD_ROUTE', label: copy('高得点重視', 'Play bold'), description: copy('未完成時の比較点に+2。ただし巡目は増えません。', '+2 comparison points if unfinished, with no extra turns.') },
      ],
    },
  },
  {
    stage: 5,
    title: copy('第5局：最終局', 'Round 5: Final round'),
    objective: copy('これまでのレリックを組み合わせ、最終局を制覇する。', 'Combine your relics and clear the final round.'),
    rule: copy('レリックを2つ以上持つと、組み合わせボーナスが発生します。', 'Owning two or more relics unlocks a combination bonus.'),
    eventTurn: 5,
    cpuProfile: 'GAMBLER',
    event: {
      title: copy('最後の作戦会議', 'Final strategy meeting'),
      description: copy('レリックの連携を信じるか、形を整えて確実に進むかを選びます。', 'Trust your relic synergy or take a steady route.'),
      choices: [
        { id: 'RELIC_LINK', label: copy('連携を発動', 'Link the relics'), description: copy('レリックの組み合わせ点を上げます。', 'Increase the relic combination bonus.') },
        { id: 'SCORE_BOOST', label: copy('形を整える', 'Stabilize the shape'), description: copy('未完成時の比較点に+1。', '+1 comparison point if unfinished.') },
      ],
    },
  },
];
const getMahjongAdvanceStage = (stage: number) => MAHJONG_ADVANCE_STAGES[Math.max(0, Math.min(MAHJONG_ADVANCE_STAGES.length - 1, stage - 1))];
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
const analyzeMahjongHand = (hand: MahjongTile[], openGroups = 0, targetGroups = 2): MahjongQuality => {
  const counts = mahjongCounts(hand); let bestGroups = 0; let bestPairs = 0;
  const groupsNeeded = Math.max(0, targetGroups - openGroups);
  Object.keys(counts).forEach(pairKey => { if (counts[pairKey] < 2) return; const remaining = { ...counts, [pairKey]: counts[pairKey] - 2 }; for (let groups = groupsNeeded; groups >= 0; groups -= 1) if (canMahjongMelds(remaining, groups)) { bestGroups = Math.max(bestGroups, groups); bestPairs = Math.max(bestPairs, 1); break; } });
  if (bestPairs === 0) bestGroups = Math.max(bestGroups, canMahjongMelds(counts, groupsNeeded) ? groupsNeeded : groupsNeeded > 0 && canMahjongMelds(counts, groupsNeeded - 1) ? groupsNeeded - 1 : 0);
  return { groups: bestGroups + openGroups, pairs: bestPairs, complete: bestGroups + openGroups >= targetGroups && bestPairs >= 1 };
};
const mahjongHasHonorSet = (hand: MahjongTile[]) => Object.entries(mahjongCounts(hand)).some(([key, count]) => key.startsWith('z') && count >= 2);
const mahjongConnectedPairs = (hand: MahjongTile[]) => {
  const counts = mahjongCounts(hand);
  return Object.entries(counts).reduce((total, [key, count]) => {
    if (key.startsWith('z') || count < 1) return total;
    const suit = key[0]; const value = Number(key.substring(1));
    return total + (counts[suit + String(value + 1)] ? 1 : 0);
  }, 0);
};
const mahjongUsefulTileCount = (hand: MahjongTile[]) => {
  const current = analyzeMahjongHand(hand);
  return new Set(MAHJONG_TILE_POOL.filter(tile => {
    const next = analyzeMahjongHand([...hand, tile]);
    return next.groups > current.groups || next.pairs > current.pairs;
  }).map(tile => tile.key)).size;
};
const mahjongDiscardRisk = (hand: MahjongTile[], tile: MahjongTile): MahjongDiscardRisk => {
  const current = analyzeMahjongHand(hand);
  const afterDiscard = analyzeMahjongHand([...hand, tile]);
  if (afterDiscard.groups > current.groups || afterDiscard.pairs > current.pairs) return 'DANGER';
  if (tile.suit !== 'z' && hand.some(other => other.suit === tile.suit && Math.abs(other.value - tile.value) <= 2)) return 'CAUTION';
  return 'SAFE';
};
const mahjongRelicSynergyCount = (relics: MahjongRelic[]) => {
  const ids = new Set(relics.map(relic => relic.id));
  return Number(ids.has('tile-compass') && ids.has('long-notes'))
    + Number(ids.has('tile-compass') && ids.has('score-seal'))
    + Number(ids.has('honor-guard') && ids.has('score-seal'));
};
const mahjongAdvanceScore = (quality: MahjongQuality, hand: MahjongTile[], stage: number, relics: MahjongRelic[], eventEffect: MahjongEventEffect | null, includeTieBonus = false) => {
  let score = mahjongShapeScore(quality, relics, includeTieBonus);
  if (stage === 2 && mahjongHasHonorSet(hand)) score += 2;
  if (stage === 3 && mahjongUsefulTileCount(hand) >= 2) score += 1;
  if (stage === 5) score += Math.min(2, mahjongRelicSynergyCount(relics));
  if (eventEffect === 'HONOR_FOCUS' && mahjongHasHonorSet(hand)) score += 2;
  if (eventEffect === 'BOLD_ROUTE') score += 2;
  if (eventEffect === 'SCORE_BOOST') score += 1;
  if (eventEffect === 'RELIC_LINK') score += relics.length >= 2 ? 2 : 0;
  return score;
};
const mahjongAdvanceAdvice = (hand: MahjongTile[], quality: MahjongQuality, stage: number): LocalCopy => {
  if (quality.complete) return copy('完成形です。次局は、完成を急ぐか報酬の組み合わせを育てるかを選べます。', 'You completed the shape. Next round, choose between a quick finish and building relic synergy.');
  if (stage === 2 && !mahjongHasHonorSet(hand)) return copy('字牌の対子・刻子がありません。孤立した端牌から整理し、字牌を1組残す作戦を試しましょう。', 'There is no honor pair or triplet. Trim isolated terminals and try keeping one honor set.');
  if (stage === 3 && mahjongUsefulTileCount(hand) < 2) return copy('待ちの候補が少ない形です。隣り合う数牌を残し、複数の補充牌につながる形を探しましょう。', 'This shape has few waits. Keep connected numbers and look for multiple useful draws.');
  if (quality.pairs === 0) return copy('対子が不足しています。同じ牌を2枚残せるかを確認してから、順子候補を整理しましょう。', 'You are missing a pair. Check whether two identical tiles can be kept before trimming sequence candidates.');
  return copy('面子候補はあります。次の巡目は、孤立した牌を捨てて待ちを広げることを試しましょう。', 'You have meld candidates. On the next turn, trim an isolated tile to widen your waits.');
};
const mahjongCpuCandidateScore = (hand: MahjongTile[], quality: MahjongQuality, profile: MahjongCpuProfile) => {
  let score = quality.groups * 3 + quality.pairs;
  const counts = mahjongCounts(hand);
  if (profile === 'COLLECTOR') score += Object.values(counts).filter(count => count >= 2).length * 1.5 + Number(mahjongHasHonorSet(hand));
  if (profile === 'SEQUENCE') score += mahjongConnectedPairs(hand) * 1.5;
  if (profile === 'DEFENDER') score += quality.groups * 1.5 + Object.values(counts).filter(count => count === 2).length;
  if (profile === 'GAMBLER') score += mahjongConnectedPairs(hand) * 2 + Math.random() * 0.4;
  return score;
};
const chooseMahjongCpuCandidate = (candidates: Array<{ index: number; quality: MahjongQuality; hand: MahjongTile[] }>, profile: MahjongCpuProfile, stage: number) => {
  const ranked = [...candidates].sort((a, b) => mahjongCpuCandidateScore(b.hand, b.quality, profile) - mahjongCpuCandidateScore(a.hand, a.quality, profile));
  if (stage <= 2) return ranked[Math.floor(Math.random() * Math.min(2, ranked.length))] || ranked[0];
  if (profile === 'GAMBLER') return ranked[Math.floor(Math.random() * Math.min(3, ranked.length))] || ranked[0];
  return ranked[0];
};
type MahjongMode = 'PRACTICE' | 'STANDARD' | 'ADVANCE';
type MahjongMeld = { kind: 'CHI' | 'PON'; tiles: MahjongTile[] };
type MahjongCallOption = 'CHI' | 'PON' | 'RON';
const MAHJONG_ADVANCE_ROUNDS = 5;
const mahjongHandSize = (mode: MahjongMode) => mode === 'STANDARD' ? 13 : 8;
const mahjongTargetGroups = (mode: MahjongMode) => mode === 'STANDARD' ? 4 : 2;
const hasMahjongRelic = (relics: MahjongRelic[], id: MahjongRelic['id']) => relics.some(relic => relic.id === id);
const mahjongShapeScore = (quality: MahjongQuality, relics: MahjongRelic[], includeTieBonus = false) => (
  quality.groups * 3
  + quality.pairs
  + (includeTieBonus && hasMahjongRelic(relics, 'score-seal') ? 1 : 0)
);
const chooseMahjongRewards = (owned: MahjongRelic[]) => {
  const available = MAHJONG_RELICS.filter(relic => !owned.some(current => current.id === relic.id));
  const pool = available.length >= 3 ? available : MAHJONG_RELICS;
  return shuffleMahjong(pool).slice(0, 3);
};
const dealMahjongTiles = (pool: MahjongTile[], count: number) => {
  const taken = pool.slice(0, count);
  return { taken, remaining: pool.slice(count) };
};
const fallbackMahjongTile = (turn: number, offset: number) => MAHJONG_TILE_POOL[(turn * 7 + offset) % MAHJONG_TILE_POOL.length];
const findMahjongChi = (hand: MahjongTile[], discarded: MahjongTile) => {
  if (discarded.suit === 'z') return null;
  for (let start = Math.max(1, discarded.value - 2); start <= Math.min(discarded.value, 7); start += 1) {
    const neededValues = [start, start + 1, start + 2].filter(value => value !== discarded.value);
    const indexes = neededValues.map(value => hand.findIndex(tile => tile.suit === discarded.suit && tile.value === value));
    if (indexes.every(index => index >= 0) && new Set(indexes).size === indexes.length) return indexes;
  }
  return null;
};
const mahjongCallOptions = (hand: MahjongTile[], discarded: MahjongTile, openGroups: number, targetGroups: number): MahjongCallOption[] => {
  const options: MahjongCallOption[] = [];
  if (hand.filter(tile => tile.key === discarded.key).length >= 2) options.push('PON');
  if (findMahjongChi(hand, discarded)) options.push('CHI');
  if (analyzeMahjongHand([...hand, discarded], openGroups, targetGroups).complete) options.push('RON');
  return options;
};
const selectMahjongDraw = (hand: MahjongTile[], discardIndex: number, deck: MahjongTile[], relics: MahjongRelic[], turn: number, offset: number, eventEffect: MahjongEventEffect | null = null) => {
  const candidateCount = hasMahjongRelic(relics, 'tile-compass') || eventEffect === 'OBSERVE' || eventEffect === 'SHAPE_HINT' ? 2 : 1;
  const candidates = deck.slice(0, candidateCount);
  if (candidates.length === 0) return fallbackMahjongTile(turn, offset);
  return candidates.map(tile => ({ tile, quality: analyzeMahjongHand(hand.filter((_, index) => index !== discardIndex).concat(tile)) }))
    .sort((a, b) => mahjongAdvanceScore(a.quality, hand.filter((_, index) => index !== discardIndex).concat(a.tile), 1, relics, eventEffect) - mahjongAdvanceScore(b.quality, hand.filter((_, index) => index !== discardIndex).concat(b.tile), 1, relics, eventEffect))[candidates.length - 1].tile;
};
type MahjongState = {
  hand: MahjongTile[];
  deck: MahjongTile[];
  cpuHand: MahjongTile[];
  cpuDeck: MahjongTile[];
  discardPile: MahjongTile[];
  cpuDiscardPile: MahjongTile[];
  turn: number;
  turnLimit: number;
  quality: MahjongQuality;
  cpuQuality: MahjongQuality;
  lastDraw: MahjongTile | null;
  lastDiscard: MahjongTile | null;
  lastCpuDiscard: MahjongTile | null;
  pendingCall: { tile: MahjongTile; options: MahjongCallOption[] } | null;
  drawnForDiscard: boolean;
  mustDiscard: boolean;
  melds: MahjongMeld[];
  cpuMelds: MahjongMeld[];
  result: 'WIN' | 'LOSE' | null;
  mode: MahjongMode;
  stage: number;
  runScore: number;
  relics: MahjongRelic[];
  rewardOptions: MahjongRelic[] | null;
  guardUsed: boolean;
  cpuProfile: MahjongCpuProfile | null;
  pendingEvent: MahjongAdvanceEvent | null;
  eventUsed: boolean;
  eventEffect: MahjongEventEffect | null;
  eventPreview: MahjongTile | null;
  lastCpuRisk: MahjongDiscardRisk | null;
  drawHint: LocalCopy | null;
  lastAdvice: LocalCopy | null;
};
const createMahjongState = (mode: MahjongMode = 'PRACTICE', stage = 1, relics: MahjongRelic[] = [], runScore = 0): MahjongState => {
  const startPool = shuffleMahjong(MAHJONG_TILE_POOL);
  const startingTiles = mahjongHandSize(mode);
  const player = dealMahjongTiles(startPool, startingTiles);
  const cpu = dealMahjongTiles(player.remaining, startingTiles);
  const quality = analyzeMahjongHand(player.taken, 0, mahjongTargetGroups(mode)); const cpuQuality = analyzeMahjongHand(cpu.taken, 0, mahjongTargetGroups(mode));
  const turnLimit = mode === 'STANDARD' ? 36 : mode === 'ADVANCE' ? 12 + (hasMahjongRelic(relics, 'long-notes') ? 2 : 0) : 12;
  return { hand: player.taken, deck: player.remaining, cpuHand: cpu.taken, cpuDeck: cpu.remaining, discardPile: [], cpuDiscardPile: [], turn: 1, turnLimit, quality, cpuQuality, lastDraw: null, lastDiscard: null, lastCpuDiscard: null, pendingCall: null, drawnForDiscard: mode !== 'STANDARD', mustDiscard: false, melds: [], cpuMelds: [], result: null, mode, stage, runScore, relics, rewardOptions: null, guardUsed: false, cpuProfile: mode === 'ADVANCE' ? getMahjongAdvanceStage(stage).cpuProfile : null, pendingEvent: null, eventUsed: false, eventEffect: null, eventPreview: null, lastCpuRisk: null, drawHint: null, lastAdvice: null };
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
  const [game, setGame] = useState<MahjongState>(() => createMahjongState('PRACTICE'));
  const [selected, setSelected] = useState<number | null>(null);
  const [showYaku, setShowYaku] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const restart = () => { setGame(createMahjongState(game.mode)); setSelected(null); };
  const chooseMode = (mode: MahjongMode) => { setGame(createMahjongState(mode)); setSelected(null); setShowGlossary(false); setShowYaku(false); audioService.playSound('select'); };
  const chooseReward = (relic: MahjongRelic) => {
    if (game.mode !== 'ADVANCE' || !game.rewardOptions || game.stage >= MAHJONG_ADVANCE_ROUNDS) return;
    setGame(createMahjongState('ADVANCE', game.stage + 1, [...game.relics, relic], game.runScore));
    setSelected(null); audioService.playSound('buff');
  };
  const resolveAdvanceEvent = (choice: MahjongAdvanceEventChoice) => {
    if (game.mode !== 'ADVANCE' || !game.pendingEvent || game.result) return;
    setGame(previous => {
      if (!previous.pendingEvent) return previous;
      const preview = choice.id === 'WAIT_PEEK' || choice.id === 'OBSERVE' ? previous.deck[0] || null : null;
      return { ...previous, pendingEvent: null, eventUsed: true, eventEffect: choice.id, eventPreview: preview, turnLimit: previous.turnLimit + (choice.id === 'SAFE_ROUTE' ? 1 : 0) };
    });
    setSelected(null);
    audioService.playSound('buff');
  };
  const organizeTiles = () => { if (game.pendingEvent) return; setGame(previous => ({ ...previous, hand: mahjongSortTiles(previous.hand) })); setSelected(null); audioService.playSound('select'); };
  const recommendedYaku = mahjongRecommendation(game.hand);
  const advanceStage = game.mode === 'ADVANCE' ? getMahjongAdvanceStage(game.stage) : null;
  const cpuProfileMeta = game.cpuProfile ? MAHJONG_CPU_PROFILE_META[game.cpuProfile] : null;
  const drawStandard = () => {
    if (game.mode !== 'STANDARD' || game.result || game.pendingCall || game.drawnForDiscard || game.mustDiscard) return;
    setGame(previous => {
      const drawn = previous.deck[0] || fallbackMahjongTile(previous.turn, 31);
      const nextHand = [...previous.hand, drawn];
      return { ...previous, hand: nextHand, deck: previous.deck.length > 0 ? previous.deck.slice(1) : previous.deck, lastDraw: drawn, drawnForDiscard: true, quality: analyzeMahjongHand(nextHand, previous.melds.length, 4) };
    });
    audioService.playSound('select');
  };
  const passCall = () => {
    if (game.mode !== 'STANDARD' || !game.pendingCall || game.result) return;
    setGame(previous => ({ ...previous, pendingCall: null, drawnForDiscard: false, mustDiscard: false }));
    setSelected(null); audioService.playSound('select');
  };
  const callDiscard = (option: MahjongCallOption) => {
    if (game.mode !== 'STANDARD' || !game.pendingCall || game.result) return;
    setGame(previous => {
      const pending = previous.pendingCall;
      if (!pending || !pending.options.includes(option)) return previous;
      if (option === 'RON') {
        return { ...previous, quality: analyzeMahjongHand([...previous.hand, pending.tile], previous.melds.length, 4), pendingCall: null, result: 'WIN', drawnForDiscard: false, mustDiscard: false };
      }
      if (option === 'PON') {
        const matchingIndexes = previous.hand.map((tile, index) => tile.key === pending.tile.key ? index : -1).filter(index => index >= 0).slice(0, 2);
        if (matchingIndexes.length < 2) return previous;
        const nextHand = previous.hand.filter((_, index) => !matchingIndexes.includes(index));
        const melds = [...previous.melds, { kind: 'PON' as const, tiles: [pending.tile, ...matchingIndexes.map(index => previous.hand[index])] }];
        return { ...previous, hand: nextHand, melds, quality: analyzeMahjongHand(nextHand, melds.length, 4), pendingCall: null, drawnForDiscard: true, mustDiscard: true, lastDraw: null };
      }
      const chiIndexes = findMahjongChi(previous.hand, pending.tile);
      if (!chiIndexes) return previous;
      const nextHand = previous.hand.filter((_, index) => !chiIndexes.includes(index));
      const melds = [...previous.melds, { kind: 'CHI' as const, tiles: [pending.tile, ...chiIndexes.map(index => previous.hand[index])] }];
      return { ...previous, hand: nextHand, melds, quality: analyzeMahjongHand(nextHand, melds.length, 4), pendingCall: null, drawnForDiscard: true, mustDiscard: true, lastDraw: null };
    });
    setSelected(null); audioService.playSound(option === 'RON' ? 'success' : 'buff');
  };
  const discard = () => {
    if (game.result || selected === null || game.pendingEvent) return;
    setGame(previous => {
      if (previous.mode === 'STANDARD') {
        if (!previous.drawnForDiscard || previous.pendingCall || selected >= previous.hand.length) return previous;
        const discarded = previous.hand[selected];
        const nextHand = previous.hand.filter((_, index) => index !== selected);
        const quality = analyzeMahjongHand(nextHand, previous.melds.length, 4);
        const cpuDraw = previous.cpuDeck[0] || fallbackMahjongTile(previous.turn, 47);
        const cpuWithDraw = [...previous.cpuHand, cpuDraw];
        const cpuCandidates = cpuWithDraw.map((_, index) => ({ index, quality: analyzeMahjongHand(cpuWithDraw.filter((__, tileIndex) => tileIndex !== index), previous.cpuMelds.length, 4) })).sort((a, b) => mahjongShapeScore(b.quality, []) - mahjongShapeScore(a.quality, []));
        const cpuChoice = cpuCandidates[0] || { index: 0, quality: analyzeMahjongHand(cpuWithDraw, previous.cpuMelds.length, 4) };
        const cpuDiscard = cpuWithDraw[cpuChoice.index];
        const nextCpuHand = cpuWithDraw.filter((_, index) => index !== cpuChoice.index);
        const cpuQuality = analyzeMahjongHand(nextCpuHand, previous.cpuMelds.length, 4);
        const nextTurn = previous.turn + 1;
        const callOptions = quality.complete ? [] : mahjongCallOptions(nextHand, cpuDiscard, previous.melds.length, 4);
        const limitReached = nextTurn > previous.turnLimit;
        const finalPlayerScore = mahjongShapeScore(quality, previous.relics, true);
        const finalCpuScore = mahjongShapeScore(cpuQuality, []);
        const result = quality.complete ? 'WIN' : (cpuQuality.complete && !callOptions.includes('RON')) ? 'LOSE' : (!callOptions.length && limitReached ? (finalPlayerScore >= finalCpuScore ? 'WIN' : 'LOSE') : null);
        return { ...previous, hand: nextHand, cpuHand: nextCpuHand, deck: previous.deck, cpuDeck: previous.cpuDeck.length > 0 ? previous.cpuDeck.slice(1) : previous.cpuDeck, discardPile: [...previous.discardPile, discarded], cpuDiscardPile: [...previous.cpuDiscardPile, cpuDiscard], turn: nextTurn, quality, cpuQuality, lastDraw: previous.lastDraw, lastDiscard: discarded, lastCpuDiscard: cpuDiscard, pendingCall: result ? null : callOptions.length > 0 ? { tile: cpuDiscard, options: callOptions } : null, drawnForDiscard: false, mustDiscard: false, result };
      }
      const stageDefinition = previous.mode === 'ADVANCE' ? getMahjongAdvanceStage(previous.stage) : null;
      const drawn = selectMahjongDraw(previous.hand, selected, previous.deck, previous.mode === 'ADVANCE' ? previous.relics : [], previous.turn, 0, previous.mode === 'ADVANCE' ? previous.eventEffect : null);
      const discarded = previous.hand[selected];
      const nextHand = previous.hand.filter((_, index) => index !== selected).concat(drawn); const quality = analyzeMahjongHand(nextHand, 0, mahjongTargetGroups(previous.mode));
      const cpuDraw = previous.cpuDeck[0] || fallbackMahjongTile(previous.turn, 13); const cpuWithDraw = [...previous.cpuHand, cpuDraw];
      const cpuCandidates = cpuWithDraw.map((_, index) => {
        const hand = cpuWithDraw.filter((__, tileIndex) => tileIndex !== index);
        return { index, hand, quality: analyzeMahjongHand(hand, 0, mahjongTargetGroups(previous.mode)) };
      });
      const cpuChoice = previous.mode === 'ADVANCE'
        ? chooseMahjongCpuCandidate(cpuCandidates, previous.cpuProfile || stageDefinition?.cpuProfile || 'COLLECTOR', previous.stage)
        : cpuCandidates.sort((a, b) => mahjongShapeScore(b.quality, []) - mahjongShapeScore(a.quality, []))[0];
      const nextCpuHand = cpuWithDraw.filter((_, index) => index !== cpuChoice.index); const cpuQuality = analyzeMahjongHand(nextCpuHand, 0, mahjongTargetGroups(previous.mode)); const nextTurn = previous.turn + 1;
      const lastCpuRisk = previous.mode === 'ADVANCE' ? mahjongDiscardRisk(nextHand, cpuDiscard) : previous.lastCpuRisk;
      const drawHint = previous.mode === 'ADVANCE' && (previous.stage === 1 && nextTurn <= 4 || previous.eventEffect === 'OBSERVE' || previous.eventEffect === 'SHAPE_HINT')
        ? copy('補充牌は、面子と対子が伸びる形を優先して選びました。', 'The replacement prioritizes a shape that improves melds or the pair.')
        : previous.drawHint;
      const guardTriggered = previous.mode === 'ADVANCE' && hasMahjongRelic(previous.relics, 'honor-guard') && cpuQuality.complete && !previous.guardUsed && !quality.complete;
      const cpuFinishes = cpuQuality.complete && !guardTriggered;
      const limitReached = nextTurn > previous.turnLimit;
      const finalPlayerScore = previous.mode === 'ADVANCE' ? mahjongAdvanceScore(quality, nextHand, previous.stage, previous.relics, previous.eventEffect, true) : mahjongShapeScore(quality, previous.relics, true);
      const finalCpuScore = mahjongShapeScore(cpuQuality, []) + (previous.mode === 'ADVANCE' ? Math.max(0, previous.stage - 2) : 0);
      const result = quality.complete ? 'WIN' : cpuFinishes ? 'LOSE' : limitReached ? (finalPlayerScore >= finalCpuScore ? 'WIN' : 'LOSE') : null;
      const rewardOptions = result === 'WIN' && previous.mode === 'ADVANCE' && previous.stage < MAHJONG_ADVANCE_ROUNDS ? chooseMahjongRewards(previous.relics) : null;
      const eventDue = previous.mode === 'ADVANCE' && !!stageDefinition && !previous.eventUsed && !result && nextTurn === stageDefinition.eventTurn;
      const lastAdvice = previous.mode === 'ADVANCE' && result ? mahjongAdvanceAdvice(nextHand, quality, previous.stage) : previous.lastAdvice;
      return { ...previous, hand: nextHand, deck: previous.deck.slice(previous.mode === 'ADVANCE' && (hasMahjongRelic(previous.relics, 'tile-compass') || previous.eventEffect === 'OBSERVE' || previous.eventEffect === 'SHAPE_HINT') ? 2 : 1), cpuHand: nextCpuHand, cpuDeck: previous.cpuDeck.slice(1), discardPile: [...previous.discardPile, discarded], cpuDiscardPile: previous.cpuDiscardPile, turn: nextTurn, quality, cpuQuality, lastDraw: drawn, lastDiscard: discarded, result, runScore: previous.runScore + (result === 'WIN' ? 1 : 0), rewardOptions, guardUsed: previous.guardUsed || guardTriggered, pendingEvent: eventDue ? stageDefinition?.event || null : previous.pendingEvent, lastCpuRisk, drawHint, lastAdvice };
    });
    setSelected(null); audioService.playSound('select');
  };
  return (
    <GameShell scope="mahjong" title={text(languageMode, 'まなび麻雀', 'Learning Mahjong')} subtitle={text(languageMode, game.mode === 'STANDARD' ? '13枚の手牌でツモ・捨て牌・チー・ポン・ロンを学ぶ2人対戦。' : game.mode === 'ADVANCE' ? '短縮手牌で局を重ね、報酬を選ぶアドバンス麻雀。' : '8枚の手牌で順子・刻子と対子を学ぶプラクティス。', game.mode === 'STANDARD' ? 'A two-player match with 13-tile hands, draws, discards, Chi, Pon, and Ron.' : game.mode === 'ADVANCE' ? 'A short-hand advance run with round rewards.' : 'Practice sequences, triplets, and pairs with an eight-tile hand.')} languageMode={languageMode} backgroundAsset="sprites/backgrounds/mini-games/mahjong.png" badgeAsset="sprites/backgrounds/mini-games/badges/mahjong.png" onBack={onBack}>
      <ResultBanner result={game.result} onRestart={restart} languageMode={languageMode} />
      <div className="mahjong-scoreboard mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-300/25 bg-teal-950/60 p-3 text-center"><div className="text-xs text-teal-200">{text(languageMode, 'あなた', 'You')} {game.mode === 'ADVANCE' && <span className="text-amber-200">// ADVANCE</span>}</div><div className="text-xl font-black">{game.quality.groups} {text(languageMode, '面子', 'melds')}</div><div className="text-xs text-slate-300">{text(languageMode, '対子', 'Pair')} {game.quality.pairs} ・ {text(languageMode, '副露', 'open')} {game.melds.length}</div></div>
        <div className="rounded-xl border border-rose-300/25 bg-rose-950/60 p-3 text-center"><div className="text-xs text-rose-200">{text(languageMode, '相手', 'CPU')}</div><div className="text-xl font-black">{game.cpuQuality.groups} {text(languageMode, '面子', 'melds')}</div><div className="text-xs text-slate-300">{text(languageMode, '対子', 'Pair')} {game.cpuQuality.pairs} ・ {text(languageMode, '副露', 'open')} {game.cpuMelds.length}</div></div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"><div className="text-xs text-slate-300">{text(languageMode, '巡目', 'Turn')}</div><div className="text-xl font-black">{game.turn} / {game.turnLimit}</div></div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-950/50 p-3 text-center"><div className="text-xs text-amber-200">{text(languageMode, '山牌', 'Tiles left')}</div><div className="text-xl font-black">{game.deck.length}</div></div>
      </div>
      <section className="mahjong-play-area flex flex-1 flex-col items-center justify-center rounded-2xl border border-teal-300/25 bg-slate-900/85 p-4">
        <div className="mahjong-mode-switch mb-3 flex w-full max-w-xl flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-300/20 bg-slate-950/70 p-2">
          <div className="text-xs font-black uppercase tracking-wider text-cyan-200">{text(languageMode, '対局モード', 'Game mode')}</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => chooseMode('PRACTICE')} data-gamepad-zone="mahjong-mode" data-gamepad-order={0} className={`rounded-lg px-3 py-2 text-xs font-black transition ${game.mode === 'PRACTICE' ? 'bg-teal-300 text-slate-950' : 'border border-white/15 bg-white/5 text-slate-300'}`}>{text(languageMode, 'プラクティス', 'Practice')}</button>
            <button type="button" onClick={() => chooseMode('STANDARD')} data-gamepad-zone="mahjong-mode" data-gamepad-order={1} className={`rounded-lg px-3 py-2 text-xs font-black transition ${game.mode === 'STANDARD' ? 'bg-cyan-300 text-slate-950' : 'border border-cyan-300/30 bg-cyan-950/30 text-cyan-100'}`}>{text(languageMode, 'スタンダード', 'Standard')}</button>
            <button type="button" onClick={() => chooseMode('ADVANCE')} data-gamepad-zone="mahjong-mode" data-gamepad-order={2} className={`rounded-lg px-3 py-2 text-xs font-black transition ${game.mode === 'ADVANCE' ? 'bg-amber-300 text-slate-950' : 'border border-amber-300/30 bg-amber-950/30 text-amber-100'}`}>{text(languageMode, 'アドバンス', 'Advance')}</button>
          </div>
        </div>
        {game.mode === 'ADVANCE' && <div className="mahjong-advance-status mb-3 w-full max-w-xl rounded-xl border border-amber-300/30 bg-amber-950/25 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-black uppercase tracking-wider text-amber-200">{text(languageMode, `アドバンス局 ${game.stage} / ${MAHJONG_ADVANCE_ROUNDS}`, `ADVANCE ROUND ${game.stage} / ${MAHJONG_ADVANCE_ROUNDS}`)}</span><span className="text-amber-100">{text(languageMode, `制覇ポイント ${game.runScore}`, `Run points ${game.runScore}`)}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${Math.min(100, ((game.stage - 1) / MAHJONG_ADVANCE_ROUNDS) * 100)}%` }} /></div>
          {game.relics.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{game.relics.map(relic => <span key={relic.id} title={copyText(languageMode, relic.description)} className="mahjong-relic-chip rounded-full border border-cyan-300/30 bg-cyan-950/50 px-2 py-1 text-[10px] font-black text-cyan-100">{copyText(languageMode, relic.name)}</span>)}</div>}
          {mahjongRelicSynergyCount(game.relics) > 0 && <div className="mt-2 text-[11px] font-black text-emerald-200">{text(languageMode, 'レリック連携', 'Relic links')} × {mahjongRelicSynergyCount(game.relics)}</div>}
        </div>}
        {game.mode === 'ADVANCE' && advanceStage && <div className="mahjong-advance-objective mb-3 w-full max-w-xl rounded-2xl border border-cyan-300/30 bg-cyan-950/35 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><div className="text-xs font-black uppercase tracking-wider text-cyan-200">{copyText(languageMode, advanceStage.title)}</div><p className="mt-1 text-sm font-black text-cyan-50">{copyText(languageMode, advanceStage.objective)}</p></div>
            {cpuProfileMeta && <div className="rounded-lg border border-rose-200/25 bg-rose-950/40 px-2 py-1 text-right"><div className="text-[10px] uppercase tracking-wider text-rose-200">{text(languageMode, 'CPU方針', 'CPU style')}</div><div className="text-xs font-black text-rose-50">{copyText(languageMode, cpuProfileMeta.name)}</div></div>}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300">{copyText(languageMode, advanceStage.rule)}</p>
          {cpuProfileMeta && <p className="mt-1 text-[11px] leading-5 text-rose-100/75">{copyText(languageMode, cpuProfileMeta.description)}</p>}
        </div>}
        {game.mode === 'ADVANCE' && game.pendingEvent && <section className="mahjong-advance-event mb-3 w-full max-w-xl rounded-2xl border border-violet-300/50 bg-violet-950/55 p-3" aria-live="polite">
          <div className="text-xs font-black uppercase tracking-wider text-violet-200">{text(languageMode, '途中イベント', 'MID-ROUND EVENT')}</div>
          <h3 className="mt-1 text-base font-black text-violet-50">{copyText(languageMode, game.pendingEvent.title)}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-200">{copyText(languageMode, game.pendingEvent.description)}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{game.pendingEvent.choices.map((choice, index) => <button key={choice.id} type="button" onClick={() => resolveAdvanceEvent(choice)} data-gamepad-zone="mahjong-advance-event" data-gamepad-order={index} className="rounded-xl border border-violet-200/30 bg-slate-950/60 p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-900/45"><div className="text-sm font-black text-violet-50">{copyText(languageMode, choice.label)}</div><p className="mt-1 text-xs leading-5 text-slate-300">{copyText(languageMode, choice.description)}</p></button>)}</div>
        </section>}
        {game.mode === 'ADVANCE' && game.eventPreview && <div className="mahjong-advance-preview mb-3 w-full max-w-xl rounded-xl border border-emerald-300/30 bg-emerald-950/35 p-2 text-center text-xs text-emerald-100" aria-live="polite">{text(languageMode, 'イベントで見えた山の先頭：', 'Event preview — top of the wall: ')}<strong>{mahjongTileText(languageMode, game.eventPreview)}</strong></div>}
        {game.mode === 'ADVANCE' && game.drawHint && <div className="mahjong-advance-draw-hint mb-3 w-full max-w-xl rounded-xl border border-cyan-300/25 bg-cyan-950/30 p-2 text-center text-xs text-cyan-100" aria-live="polite">{copyText(languageMode, game.drawHint)}</div>}
        {game.mode === 'ADVANCE' && game.stage >= 3 && game.lastCpuRisk && <div className="mahjong-advance-risk mb-3 w-full max-w-xl rounded-xl border border-rose-300/25 bg-rose-950/30 p-2 text-center text-xs" aria-live="polite"><span className="mr-1 font-black text-rose-200">{text(languageMode, '相手の捨て牌の危険度：', 'Opponent discard risk:')}</span><strong className={game.lastCpuRisk === 'DANGER' ? 'text-rose-200' : game.lastCpuRisk === 'CAUTION' ? 'text-amber-200' : 'text-emerald-200'}>{text(languageMode, game.lastCpuRisk === 'DANGER' ? '危険' : game.lastCpuRisk === 'CAUTION' ? '注意' : '比較的安全', game.lastCpuRisk === 'DANGER' ? 'Danger' : game.lastCpuRisk === 'CAUTION' ? 'Caution' : 'Relatively safe')}</strong></div>}
        {game.mode === 'ADVANCE' && game.lastAdvice && game.result && <div className="mahjong-advance-advice mb-3 w-full max-w-xl rounded-xl border border-amber-300/30 bg-amber-950/35 p-3 text-sm leading-5 text-amber-50" aria-live="polite"><span className="mr-1 font-black text-amber-200">{text(languageMode, '振り返り：', 'Review:')}</span>{copyText(languageMode, game.lastAdvice)}</div>}
        <div className="mahjong-instruction mb-2 text-sm text-slate-300">{text(languageMode, game.mode === 'STANDARD' ? 'ツモるボタンで14枚にし、捨てる牌を選びます。相手の捨て牌にはチー・ポン・ロンで応じられます。' : '捨てる牌を選び、捨てるボタンで手番を進めます。', game.mode === 'STANDARD' ? 'Draw to 14 tiles, then choose a discard. Respond to an opponent discard with Chi, Pon, or Ron.' : 'Select a tile, then press Discard to advance.')}</div>
        <div className="mahjong-suit-legend mb-2 flex flex-wrap justify-center gap-2" aria-label={text(languageMode, '牌の種類', 'Tile suits')}>
          {MAHJONG_SUIT_ORDER.map(suit => <span key={suit} className={`mahjong-suit-chip mahjong-suit-chip-${suit}`}><b>{text(languageMode, MAHJONG_SUIT_META[suit].shortJp, MAHJONG_SUIT_META[suit].shortEn)}</b>{text(languageMode, MAHJONG_SUIT_META[suit].jp, MAHJONG_SUIT_META[suit].en)}</span>)}
        </div>
        <div className={`mahjong-hand mahjong-hand-count-${game.hand.length} mb-3 flex max-w-full flex-wrap justify-center gap-2`}>{game.hand.map((tile, index) => <button key={tile.id} type="button" onClick={() => setSelected(index)} data-gamepad-zone="mahjong-hand" data-gamepad-order={index} disabled={!!game.result || (game.mode === 'STANDARD' && !game.drawnForDiscard)} aria-label={mahjongTileAria(languageMode, tile)} className={`mahjong-tile-button mahjong-tile-button-${tile.suit} flex h-20 w-14 items-center justify-center rounded-lg border-2 bg-slate-50 text-lg font-black text-slate-900 shadow-lg transition hover:-translate-y-2 hover:border-teal-400 disabled:opacity-40 sm:h-24 sm:w-16 ${selected === index ? 'border-cyan-400 ring-2 ring-cyan-300' : 'border-slate-300'}`}><MahjongTileFace tile={tile} languageMode={languageMode} /></button>)}</div>
        <div className="mahjong-actions mb-3 flex flex-wrap justify-center gap-2">
          {game.mode === 'STANDARD' && <button type="button" onClick={drawStandard} disabled={!!game.result || game.drawnForDiscard || !!game.pendingCall || game.mustDiscard} data-gamepad-zone="mahjong-actions" data-gamepad-order={0} className="rounded-xl border border-cyan-300/40 bg-cyan-700/80 px-4 py-3 font-black hover:bg-cyan-600 disabled:opacity-35">{text(languageMode, 'ツモる', 'Draw')}</button>}
          <button type="button" onClick={discard} disabled={!!game.result || selected === null || (game.mode === 'STANDARD' && !game.drawnForDiscard)} data-gamepad-zone="mahjong-actions" data-gamepad-order={1} className="rounded-xl border border-teal-300/40 bg-teal-700/80 px-4 py-3 font-black hover:bg-teal-600 disabled:opacity-35">{text(languageMode, game.mode === 'STANDARD' ? 'この牌を捨てる' : 'この牌を捨てる', 'Discard selected')}</button>
          <button type="button" onClick={organizeTiles} disabled={!!game.result} data-gamepad-zone="mahjong-actions" data-gamepad-order={2} className="rounded-xl border border-cyan-300/40 bg-cyan-700/70 px-4 py-3 font-black hover:bg-cyan-600 disabled:opacity-35">{text(languageMode, '牌を整理', 'Sort tiles')}</button>
          <button type="button" onClick={() => setShowYaku(true)} data-gamepad-zone="mahjong-actions" data-gamepad-order={3} className="rounded-xl border border-amber-300/40 bg-amber-700/70 px-4 py-3 font-black hover:bg-amber-600">{text(languageMode, '役を見る', 'View yaku')}</button>
          <button type="button" onClick={() => setShowGlossary(true)} data-gamepad-zone="mahjong-actions" data-gamepad-order={4} className="rounded-xl border border-violet-300/40 bg-violet-700/70 px-4 py-3 font-black hover:bg-violet-600">{text(languageMode, '用語を見る', 'Glossary')}</button>
        </div>
        {game.mode === 'STANDARD' && game.pendingCall && <div className="mahjong-call-panel mb-3 w-full max-w-xl rounded-2xl border border-cyan-300/50 bg-cyan-950/55 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-black text-cyan-100">{text(languageMode, '相手の捨て牌', 'Opponent discard')}: {mahjongTileText(languageMode, game.pendingCall.tile)}</span><span className="text-xs text-cyan-200">{text(languageMode, 'この牌に応じる', 'Respond to this discard')}</span></div><div className="mt-2 flex flex-wrap gap-2">{game.pendingCall.options.map(option => <button key={option} type="button" onClick={() => callDiscard(option)} data-gamepad-zone="mahjong-calls" data-gamepad-order={option === 'CHI' ? 0 : option === 'PON' ? 1 : 2} className={`rounded-lg px-3 py-2 text-xs font-black ${option === 'RON' ? 'bg-rose-400 text-slate-950' : 'border border-cyan-200/40 bg-cyan-800/80 text-cyan-50'}`}>{text(languageMode, option === 'CHI' ? 'チー' : option === 'PON' ? 'ポン' : 'ロン', option)}</button>)}<button type="button" onClick={passCall} data-gamepad-zone="mahjong-calls" data-gamepad-order={3} className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-black text-slate-200">{text(languageMode, '見送る', 'Pass')}</button></div></div>}
        {game.lastDraw && <div className="mahjong-drawn mb-3 text-xs text-teal-200">{text(languageMode, '引いた牌：', 'Drawn tile: ')}{mahjongTileText(languageMode, game.lastDraw)}</div>}
        {game.mode === 'STANDARD' && <div className="mahjong-discard-area mb-3 grid w-full max-w-xl gap-2 sm:grid-cols-2"><div className="rounded-xl border border-teal-300/20 bg-teal-950/30 p-2"><div className="text-[10px] font-black uppercase tracking-wider text-teal-200">{text(languageMode, 'あなたの捨て牌', 'Your discards')}</div><div className="mt-1 flex min-h-7 flex-wrap gap-1">{game.discardPile.slice(-12).map(tile => <span key={tile.id} className="rounded border border-teal-200/20 bg-slate-950/60 px-1.5 py-1 text-[10px] text-teal-50">{mahjongTileText(languageMode, tile)}</span>)}</div></div><div className="rounded-xl border border-rose-300/20 bg-rose-950/30 p-2"><div className="text-[10px] font-black uppercase tracking-wider text-rose-200">{text(languageMode, '相手の捨て牌', 'Opponent discards')}</div><div className="mt-1 flex min-h-7 flex-wrap gap-1">{game.cpuDiscardPile.slice(-12).map(tile => <span key={tile.id} className={`rounded border px-1.5 py-1 text-[10px] ${tile.id === game.lastCpuDiscard?.id ? 'border-cyan-300 bg-cyan-900/70 text-cyan-50' : 'border-rose-200/20 bg-slate-950/60 text-rose-50'}`}>{mahjongTileText(languageMode, tile)}</span>)}</div></div></div>}
        {game.mode === 'STANDARD' && game.melds.length > 0 && <div className="mahjong-open-melds mb-3 w-full max-w-xl rounded-xl border border-violet-300/25 bg-violet-950/25 p-2"><div className="text-[10px] font-black uppercase tracking-wider text-violet-200">{text(languageMode, 'あなたの副露', 'Your open melds')}</div><div className="mt-1 flex flex-wrap gap-2">{game.melds.map((meld, index) => <span key={`${meld.kind}-${index}`} className="rounded-lg border border-violet-200/25 bg-slate-950/60 px-2 py-1 text-[10px] text-violet-50">{meld.kind === 'CHI' ? text(languageMode, 'チー', 'CHI') : text(languageMode, 'ポン', 'PON')}：{meld.tiles.map(tile => mahjongTileText(languageMode, tile)).join('・')}</span>)}</div></div>}
        <div className="mahjong-recommendation mb-3 w-full max-w-xl rounded-2xl border border-amber-300/30 bg-amber-950/35 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-black uppercase tracking-wider text-amber-200">{text(languageMode, 'おすすめ役', 'Recommended yaku')}</div><span className="rounded-full bg-amber-300/20 px-2 py-1 text-xs font-black text-amber-100">{copyText(languageMode, recommendedYaku.name)}</span></div>
          <p className="mt-2 text-sm leading-6 text-amber-50">{copyText(languageMode, recommendedYaku.description)}</p>
          <p className="mt-2 text-xs leading-5 text-amber-100/70">{text(languageMode, 'まずは面子2つ＋対子1つの完成を優先し、役は次の捨て牌を選ぶヒントとして使います。', 'Prioritize two melds plus a pair first; use yaku as a guide for your next discard.')}</p>
        </div>
        <div className="mahjong-info max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">{text(languageMode, game.mode === 'STANDARD' ? 'スタンダードは2人対戦です。双方13枚から開始し、ツモで14枚、1枚捨てて13枚に戻します。相手の捨て牌はチー（連番）・ポン（同牌3枚）・ロン（完成形）で使えます。先に面子4つ＋対子1つを完成させた側が勝ちです。' : '順子は同じ種類の連番3枚、刻子は同じ牌3枚、対子は同じ牌2枚です。プラクティス／アドバンスは面子2つ＋対子1つで完成。', game.mode === 'STANDARD' ? 'Standard is a two-player match. Both start with 13 tiles, draw to 14, then discard back to 13. An opponent discard can be used for Chi (sequence), Pon (triplet), or Ron (complete hand). The first player to complete four melds plus a pair wins.' : 'A sequence is three consecutive tiles of one suit; a triplet is three identical tiles; a pair is two identical tiles. Practice and Advance complete with two melds plus one pair.')}</div>
        {game.mode === 'ADVANCE' && game.result === 'WIN' && game.stage < MAHJONG_ADVANCE_ROUNDS && game.rewardOptions && <div className="mahjong-reward-panel mt-3 w-full max-w-xl rounded-2xl border border-amber-300/50 bg-amber-950/60 p-3">
          <div className="text-center"><div className="text-xs font-black uppercase tracking-wider text-amber-200">{text(languageMode, '局クリア報酬', 'ROUND CLEAR REWARD')}</div><p className="mt-1 text-sm font-black text-amber-50">{text(languageMode, '次の局へ持ち込む道具を1つ選んでください。', 'Choose one tool to carry into the next round.')}</p></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">{game.rewardOptions.map(relic => <button type="button" key={relic.id} onClick={() => chooseReward(relic)} data-gamepad-zone="mahjong-rewards" data-gamepad-order={game.rewardOptions?.indexOf(relic) ?? 0} className="rounded-xl border border-amber-200/30 bg-slate-950/70 p-3 text-left transition hover:-translate-y-1 hover:border-amber-200 hover:bg-amber-900/40"><div className="text-sm font-black text-amber-100">{copyText(languageMode, relic.name)}</div><p className="mt-1 text-xs leading-5 text-slate-300">{copyText(languageMode, relic.description)}</p></button>)}</div>
        </div>}
        {game.mode === 'ADVANCE' && game.result === 'WIN' && game.stage >= MAHJONG_ADVANCE_ROUNDS && <div className="mahjong-run-complete mt-3 w-full max-w-xl rounded-2xl border border-emerald-300/50 bg-emerald-950/55 p-3 text-center"><div className="text-xs font-black uppercase tracking-wider text-emerald-200">{text(languageMode, 'アドバンス制覇', 'ADVANCE RUN COMPLETE')}</div><p className="mt-1 text-sm font-black text-emerald-50">{text(languageMode, '5局を勝ち抜きました。もう一度遊ぶと新しい配牌でランを始められます。', 'You cleared all five rounds. Play again to start a new run with a fresh random deal.')}</p></div>}
        {game.mode === 'ADVANCE' && game.result === 'LOSE' && <div className="mahjong-run-failed mt-3 w-full max-w-xl rounded-2xl border border-rose-300/40 bg-rose-950/50 p-3 text-center"><div className="text-xs font-black uppercase tracking-wider text-rose-200">{text(languageMode, 'ラン終了', 'RUN ENDED')}</div><p className="mt-1 text-sm text-rose-50">{text(languageMode, 'このランはここで終了です。もう一度遊ぶと配牌と報酬が変わります。', 'This run is over. Play again to reroll the deal and rewards.')}</p></div>}
      </section>
      {showYaku && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm" data-gamepad-modal="true" data-gamepad-navigation-root="true">
        <section role="dialog" aria-modal="true" aria-labelledby="mahjong-yaku-title" className="mini-game-rules-modal max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-200/40 bg-slate-900 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="mahjong-yaku-title" className="text-xl font-black text-amber-100">{text(languageMode, '麻雀の役を知る', 'Learn mahjong yaku')}</h2><p className="mt-1 text-xs text-slate-400">{text(languageMode, '役は手牌の特徴を表すボーナス条件です。', 'Yaku are bonus conditions that describe a hand’s pattern.')}</p></div><button type="button" onClick={() => setShowYaku(false)} data-gamepad-zone="mahjong-yaku" data-gamepad-order={0} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black">{text(languageMode, '閉じる', 'Close')}</button></div>
          <div className="space-y-2">{MAHJONG_YAKU.map(yaku => <article key={yaku.name.jp} className={`rounded-xl border p-3 ${yaku.name.jp === recommendedYaku.name.jp ? 'border-amber-300/60 bg-amber-950/40' : 'border-white/10 bg-white/5'}`}><div className="flex items-center gap-2"><span className="text-sm font-black text-amber-100">{copyText(languageMode, yaku.name)}</span>{yaku.name.jp === recommendedYaku.name.jp && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-black text-emerald-200">{text(languageMode, 'おすすめ', 'Recommended')}</span>}</div><p className="mt-1 text-xs leading-5 text-slate-300">{copyText(languageMode, yaku.description)}</p></article>)}</div>
          <button type="button" onClick={() => setShowYaku(false)} data-gamepad-zone="mahjong-yaku" data-gamepad-order={1} className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950">{text(languageMode, '役を確認した', 'Got it')}</button>
        </section>
      </div>}
      {showGlossary && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm" data-gamepad-modal="true" data-gamepad-navigation-root="true">
        <section role="dialog" aria-modal="true" aria-labelledby="mahjong-glossary-title" className="mini-game-rules-modal max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-violet-200/40 bg-slate-900 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="mahjong-glossary-title" className="text-xl font-black text-violet-100">{text(languageMode, '麻雀用語ミニ辞典', 'Mahjong glossary')}</h2><p className="mt-1 text-xs text-slate-400">{text(languageMode, '牌を選ぶ前に、意味と具体例を確認できます。', 'Check the meaning and example before choosing a tile.')}</p></div><button type="button" onClick={() => setShowGlossary(false)} data-gamepad-zone="mahjong-glossary" data-gamepad-order={0} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black">{text(languageMode, '閉じる', 'Close')}</button></div>
          <div className="grid gap-2 sm:grid-cols-2">{MAHJONG_GLOSSARY.map((entry, index) => <article key={entry.term.jp} className="rounded-xl border border-violet-200/15 bg-white/5 p-3"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-300 font-black text-slate-950">{index + 1}</span><h3 className="font-black text-violet-100">{copyText(languageMode, entry.term)}</h3></div><p className="mt-2 text-xs leading-5 text-slate-300">{copyText(languageMode, entry.description)}</p><p className="mt-2 rounded-lg border border-white/10 bg-slate-950/50 p-2 text-xs leading-5 text-violet-50">{copyText(languageMode, entry.example)}</p></article>)}</div>
          <button type="button" onClick={() => setShowGlossary(false)} data-gamepad-zone="mahjong-glossary" data-gamepad-order={1} className="mt-4 w-full rounded-xl bg-violet-300 px-4 py-3 font-black text-slate-950">{text(languageMode, '用語を確認した', 'Got it')}</button>
        </section>
      </div>}
    </GameShell>
  );
};

const TriviaMiniGameScreen: React.FC<TriviaMiniGameProps> = ({
  gameScreen = GameScreen.MINI_GAME_STONE_GLOW,
  problemMode = GameMode.MIXED,
  problemModePool,
  answerMode = 'CHOICE',
  assignment,
  onAnswerResult,
  ...props
}) => {
  const [showMissionQuiz, setShowMissionQuiz] = useState(false);
  const handleMissionClear = React.useCallback(() => setShowMissionQuiz(true), []);
  useEffect(() => {
    void audioService.playBGM(gameScreen === GameScreen.MINI_GAME_LEARNING_TCG ? 'battle' : 'poker_play');
  }, [gameScreen]);

  const game = (() => {
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
  })();

  return (
    <MiniGameMissionClearContext.Provider value={handleMissionClear}>
      {game}
      {showMissionQuiz && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/95 p-2 sm:p-4" data-gamepad-modal="true">
          <MiniGameProblemChallenge
            mode={problemMode}
            modePool={problemModePool}
            answerMode={answerMode}
            assignment={assignment}
            onAnswerResult={onAnswerResult}
            onComplete={() => setShowMissionQuiz(false)}
            languageMode={props.languageMode}
            rewardHint={props.languageMode === 'ENGLISH' ? 'Mission clear quiz complete' : 'ミッションクリア問題を完了しました'}
          />
        </div>
      )}
    </MiniGameMissionClearContext.Provider>
  );
};

export default TriviaMiniGameScreen;
