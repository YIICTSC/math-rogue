import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Sword } from 'lucide-react';
import { CARDS_LIBRARY, CHARACTERS, ENEMY_LIBRARY } from '../constants';
import { CardType, Character } from '../types';
import EnemyIllustration from './EnemyIllustration';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { getCardIllustrationPaths } from '../utils/cardIllustration';

interface MiniBattleBannerProps {
  streak: number;
}

interface FinisherCardView {
  id: string;
  name: string;
  damageLabel: string;
}

interface CutInCardView {
  id: string;
  name: string;
}

type CutInLayout = 'stack_left' | 'stack_right' | 'strips' | 'grid' | 'tiles' | 'bars';

const MAX_CUTIN_CARDS = 8;
const ENEMY_POOL = Object.values(ENEMY_LIBRARY);
const FINISHER_CARDS: FinisherCardView[] = Object.entries(CARDS_LIBRARY)
  .filter(([, card]) => card.type === CardType.ATTACK)
  .map(([id, card]) => ({
    id,
    name: card.name,
    damageLabel: card.damage ? `${card.damage} DMG` : 'FINISH',
  }));

const CUTIN_LAYOUTS: CutInLayout[] = ['stack_left', 'stack_right', 'strips', 'grid', 'tiles', 'bars'];

const pickRandom = <T,>(items: T[], exclude?: T): T => {
  if (items.length === 0) throw new Error('pickRandom requires at least one item');
  if (items.length === 1) return items[0];
  let candidate = items[Math.floor(Math.random() * items.length)];
  while (exclude !== undefined && candidate === exclude) {
    candidate = items[Math.floor(Math.random() * items.length)];
  }
  return candidate;
};

const CardCutInArt: React.FC<{ card: CutInCardView }> = ({ card }) => {
  const [pathIndex, setPathIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const imagePaths = useMemo(
    () => getCardIllustrationPaths(card.id, card.name, [card.name]),
    [card.id, card.name]
  );

  useEffect(() => {
    setPathIndex(0);
    setFailed(false);
  }, [card.id, card.name]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400/25 via-rose-500/25 to-cyan-400/20 px-2 text-center text-[10px] font-black text-white">
        {card.name}
      </div>
    );
  }

  return (
    <img
      src={imagePaths[pathIndex]}
      alt={card.name}
      className="h-full w-full object-cover"
      draggable={false}
      onError={() => {
        const nextIndex = pathIndex + 1;
        if (nextIndex < imagePaths.length) {
          setPathIndex(nextIndex);
          return;
        }
        setFailed(true);
      }}
    />
  );
};

const MiniBattleFinisherOverlay: React.FC<{
  cards: CutInCardView[];
  layout: CutInLayout;
  finisherCard: FinisherCardView | null;
}> = ({ cards, layout, finisherCard }) => {
  const count = Math.max(cards.length, 1);

  const panelAnimationClass = (index: number) => {
    const dir = index % 4;
    if (dir === 0) return 'mini-finish-stack-left';
    if (dir === 1) return 'mini-finish-stack-right';
    if (dir === 2) return 'mini-finish-stack-up';
    return 'mini-finish-stack-down';
  };

  const renderStack = (align: 'left' | 'right') => (
    <div className="absolute inset-0 flex items-center">
      {cards.map((card, index) => {
        const width = Math.max(18, 38 - index * 2.5);
        const offset = align === 'left' ? 5 + index * 7 : 95 - width - index * 7;
        return (
          <div
            key={`${card.id}-${index}`}
            className={`absolute top-[10%] h-[80%] overflow-hidden rounded-lg border border-amber-200/45 shadow-[0_0_26px_rgba(251,191,36,0.24)] ${panelAnimationClass(index)}`}
            style={{
              left: `${offset}%`,
              width: `${width}%`,
              animationDelay: `${index * 70}ms`,
              zIndex: 10 + index,
            }}
          >
            <CardCutInArt card={card} />
          </div>
        );
      })}
    </div>
  );

  const renderStrips = () => {
    const stripWidth = 100 / count;
    return (
      <div className="absolute inset-0">
        {cards.map((card, index) => (
          <div
            key={`${card.id}-${index}`}
            className={`absolute top-0 h-full overflow-hidden border-x border-white/10 ${index % 2 === 0 ? 'mini-finish-multi-up' : 'mini-finish-multi-down'}`}
            style={{
              left: `${stripWidth * index}%`,
              width: `${stripWidth + 0.2}%`,
              animationDelay: `${index * 55}ms`,
            }}
          >
            <CardCutInArt card={card} />
          </div>
        ))}
      </div>
    );
  };

  const renderGrid = () => {
    const cols = Math.min(4, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    return (
      <div className="absolute inset-[10%] grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {cards.map((card, index) => (
          <div
            key={`${card.id}-${index}`}
            className={`overflow-hidden rounded-md border border-white/15 shadow-[0_0_18px_rgba(255,255,255,0.08)] ${panelAnimationClass(index)}`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardCutInArt card={card} />
          </div>
        ))}
      </div>
    );
  };

  const renderTiles = () => {
    const cols = Math.max(2, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    const width = 100 / cols;
    const height = 100 / rows;
    return (
      <div className="absolute inset-0">
        {cards.map((card, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          return (
            <div
              key={`${card.id}-${index}`}
              className={`absolute overflow-hidden border border-black/20 ${index % 2 === 0 ? 'mini-finish-multi-left' : 'mini-finish-multi-right'}`}
              style={{
                left: `${col * width}%`,
                top: `${row * height}%`,
                width: `${width + 0.3}%`,
                height: `${height + 0.3}%`,
                animationDelay: `${index * 45}ms`,
              }}
            >
              <CardCutInArt card={card} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderBars = () => {
    const barCount = Math.max(3, Math.min(MAX_CUTIN_CARDS, count));
    return (
      <div className="absolute inset-0 flex items-stretch gap-[2px] px-2 py-1">
        {Array.from({ length: barCount }).map((_, index) => {
          const card = cards[index % cards.length];
          return (
            <div
              key={`${card.id}-${index}`}
              className={`relative flex-1 overflow-hidden rounded-sm border border-white/10 ${index % 2 === 0 ? 'mini-finish-stack-up' : 'mini-finish-stack-down'}`}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <CardCutInArt card={card} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderLayout = () => {
    switch (layout) {
      case 'stack_left':
        return renderStack('left');
      case 'stack_right':
        return renderStack('right');
      case 'strips':
        return renderStrips();
      case 'grid':
        return renderGrid();
      case 'tiles':
        return renderTiles();
      case 'bars':
      default:
        return renderBars();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/36 to-black/82 mini-finish-dim" />
      <div className="absolute inset-[6%] overflow-hidden rounded-xl border-2 border-orange-300/55 bg-black/25 shadow-[0_0_36px_rgba(251,146,60,0.32)] mini-finish-cutin">
        {renderLayout()}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.18)_46%,transparent_56%)] opacity-70" />
      </div>
      <div className="absolute left-3 top-2 z-30 mini-finish-title">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-300/80">Finisher</div>
        <div className="max-w-[48vw] truncate text-sm font-black text-white md:text-base">{finisherCard?.name ?? 'Special'}</div>
      </div>
      <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
        <div className="h-10 w-10 rounded-full bg-orange-500/90 shadow-[0_0_46px_rgba(249,115,22,0.8)] mini-finish-explosion md:h-14 md:w-14" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-200/90 mini-finish-shockwave md:h-24 md:w-24" />
      </div>
      <style>{`
        @keyframes mini-finish-cutin {
          0% { transform: scale(0.88); opacity: 0; }
          16% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes mini-finish-stack-left {
          0% { transform: translateX(-22%) scale(0.92); opacity: 0; }
          18% { transform: translateX(2%) scale(1); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes mini-finish-stack-right {
          0% { transform: translateX(22%) scale(0.92); opacity: 0; }
          18% { transform: translateX(-2%) scale(1); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes mini-finish-stack-up {
          0% { transform: translateY(-20%) scale(0.9); opacity: 0; }
          18% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes mini-finish-stack-down {
          0% { transform: translateY(20%) scale(0.9); opacity: 0; }
          18% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes mini-finish-multi-left {
          0% { transform: translateX(-100%); opacity: 0; }
          22% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes mini-finish-multi-right {
          0% { transform: translateX(100%); opacity: 0; }
          22% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes mini-finish-multi-up {
          0% { transform: translateY(-100%); opacity: 0; }
          22% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes mini-finish-multi-down {
          0% { transform: translateY(100%); opacity: 0; }
          22% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes mini-finish-dim {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes mini-finish-title {
          0% { transform: translateY(-8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes mini-finish-explosion {
          0% { transform: scale(0.2); opacity: 1; }
          52% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes mini-finish-shockwave {
          0% { transform: translate(-50%, -50%) scale(0.24); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0; }
        }
        .mini-finish-cutin { animation: mini-finish-cutin 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-stack-left { animation: mini-finish-stack-left 0.52s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-stack-right { animation: mini-finish-stack-right 0.52s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-stack-up { animation: mini-finish-stack-up 0.52s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-stack-down { animation: mini-finish-stack-down 0.52s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-multi-left { animation: mini-finish-multi-left 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-multi-right { animation: mini-finish-multi-right 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-multi-up { animation: mini-finish-multi-up 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-multi-down { animation: mini-finish-multi-down 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-dim { animation: mini-finish-dim 0.18s ease-out forwards; }
        .mini-finish-title { animation: mini-finish-title 0.35s ease-out forwards; }
        .mini-finish-explosion { animation: mini-finish-explosion 0.85s ease-out forwards; }
        .mini-finish-shockwave { animation: mini-finish-shockwave 0.85s ease-out forwards; }
      `}</style>
    </div>
  );
};

const MiniBattleBanner: React.FC<MiniBattleBannerProps> = ({ streak }) => {
  const [hero, setHero] = useState<Character>(() => pickRandom(CHARACTERS));
  const [enemy, setEnemy] = useState(() => pickRandom(ENEMY_POOL));
  const [effectText, setEffectText] = useState('Ready');
  const [enemyHpPct, setEnemyHpPct] = useState(100);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isEnemyHit, setIsEnemyHit] = useState(false);
  const [finisherCard, setFinisherCard] = useState<FinisherCardView | null>(null);
  const [cutInCards, setCutInCards] = useState<CutInCardView[]>([]);
  const [cutInLayout, setCutInLayout] = useState<CutInLayout>('stack_left');
  const timeoutsRef = useRef<number[]>([]);
  const prevStreakRef = useRef(0);

  const enemySeed = useMemo(() => `${enemy.name}-${streak}`, [enemy.name, streak]);
  const unlockedCutInCards = useMemo(() => {
    const unlockedNames = new Set(storageService.getUnlockedCards().map((name) => name.trim()));
    return Object.entries(CARDS_LIBRARY)
      .filter(([, card]) => unlockedNames.has(card.name))
      .map(([id, card]) => ({ id, name: card.name }));
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (streak <= 0) {
      prevStreakRef.current = 0;
      setHero(pickRandom(CHARACTERS));
      setEnemy(pickRandom(ENEMY_POOL));
      setEnemyHpPct(100);
      setEffectText('Ready');
      setFinisherCard(null);
      setCutInCards([]);
      setCutInLayout('stack_left');
      setIsAttacking(false);
      setIsEnemyHit(false);
      return;
    }

    if (streak <= prevStreakRef.current) return;
    prevStreakRef.current = streak;

    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];

    const finisher = streak % 5 === 0;
    setIsAttacking(true);
    setIsEnemyHit(true);

    if (finisher) {
      const nextCard = pickRandom(FINISHER_CARDS);
      setFinisherCard(nextCard);
      if (unlockedCutInCards.length > 0) {
        const targetCount = Math.min(MAX_CUTIN_CARDS, Math.floor(streak / 5));
        setCutInCards((prev) => {
          const retained = prev.slice(0, targetCount);
          const candidatePool = unlockedCutInCards.filter((card) => !retained.some((saved) => saved.id === card.id));
          const nextCardForHistory = pickRandom(candidatePool.length > 0 ? candidatePool : unlockedCutInCards);

          if (targetCount <= 0) return [];
          if (retained.length < targetCount) {
            return [...retained, nextCardForHistory];
          }
          return [...retained.slice(1), nextCardForHistory];
        });
        setCutInLayout(pickRandom(CUTIN_LAYOUTS));
      }
      setEnemyHpPct(0);
      setEffectText(`${nextCard.name}!`);
      audioService.playSound(Math.random() < 0.5 ? 'finisher_slash' : 'finisher_explosion');

      timeoutsRef.current.push(window.setTimeout(() => {
        setEnemy(pickRandom(ENEMY_POOL, enemy));
        setEnemyHpPct(100);
        setFinisherCard(null);
        setEffectText('Enemy Change');
      }, 980));
    } else {
      const nextHp = Math.max(10, 100 - ((streak % 5) * 20));
      setEnemyHpPct(nextHp);
      setEffectText('Hit!');
      audioService.playSound('attack');
    }

    timeoutsRef.current.push(window.setTimeout(() => setIsAttacking(false), 260));
    timeoutsRef.current.push(window.setTimeout(() => setIsEnemyHit(false), 360));
    timeoutsRef.current.push(window.setTimeout(() => {
      if (!finisher) setEffectText('Ready');
    }, 700));
  }, [enemy, streak, unlockedCutInCards]);

  return (
    <div className="h-24 md:h-28 border-b border-emerald-900/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-3 py-2 overflow-hidden">
      <div className="relative h-full rounded-xl border border-emerald-900/60 bg-black/35 px-3 py-2">
        {finisherCard && cutInCards.length > 0 && (
          <MiniBattleFinisherOverlay cards={cutInCards} layout={cutInLayout} finisherCard={finisherCard} />
        )}
        <div className="mb-1 flex items-center justify-between text-[9px] md:text-[10px] uppercase tracking-[0.24em] text-emerald-300/80">
          <span>Mini Battle</span>
          <span>{streak} Hits</span>
        </div>
        <div className="grid h-[calc(100%-18px)] grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className={`flex items-center gap-2 transition-transform duration-200 ${isAttacking ? 'translate-x-2 scale-105' : ''}`}>
            <div className="h-12 w-12 md:h-14 md:w-14 overflow-hidden rounded-full border-2 border-sky-400/70 bg-sky-950/40 shadow-[0_0_18px_rgba(56,189,248,0.25)]">
              <img src={hero.imageData} alt={hero.name} className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs md:text-sm font-black text-sky-100">{hero.name}</div>
              <div className="text-[10px] text-sky-300/75">ATK chain x{Math.max(1, streak % 5 || 5)}</div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1 text-[10px] font-black text-amber-300">
              {finisherCard ? <Sparkles size={12} /> : <Sword size={12} />}
              <span>{effectText}</span>
            </div>
            {finisherCard && (
              <div className="rounded-full border border-amber-400/50 bg-amber-300/15 px-2 py-0.5 text-[9px] font-bold text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.18)]">
                {finisherCard.name} / {finisherCard.damageLabel}
              </div>
            )}
          </div>

          <div className={`flex items-center justify-end gap-2 transition-transform duration-200 ${isEnemyHit ? 'translate-x-1 scale-[0.98]' : ''}`}>
            <div className="min-w-0 text-right">
              <div className="truncate text-xs md:text-sm font-black text-rose-100">{enemy.name}</div>
              <div className="mt-1 h-2 w-20 md:w-28 overflow-hidden rounded-full border border-rose-400/30 bg-rose-950/60">
                <div
                  className={`h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-300 ${enemyHpPct === 0 ? 'opacity-40' : ''}`}
                  style={{ width: `${enemyHpPct}%` }}
                />
              </div>
            </div>
            <div className="h-12 w-12 md:h-14 md:w-14 overflow-hidden rounded-full border-2 border-rose-400/70 bg-rose-950/40 shadow-[0_0_18px_rgba(251,113,133,0.25)]">
              <EnemyIllustration name={enemy.name} seed={enemySeed} className="h-full w-full" size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniBattleBanner;
