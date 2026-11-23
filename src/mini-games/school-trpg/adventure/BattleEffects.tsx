import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { audioService } from '../../../services/audioService';
import { battleCueDelay, type BattleArt, type BattleCue, type BattleEvent, type BattlePoint } from './battleFeedback';
import { art } from './ui';
import { SIDE } from './world';

export const BATTLE_CUE_MS = 640;
const ATTACK_SOUNDS = {
  slash: 'slash',
  thrust: 'projectile',
  crush: 'impact',
  arrow: 'projectile',
  arcane: 'flash',
  wind: 'wind',
  collision: 'shockwave',
  shock: 'lightning',
  fire: 'fire',
  snare: 'plant',
} satisfies Record<
  Exclude<BattleArt, 'guard' | 'heal'>,
  Parameters<typeof audioService.playAttackEffectSound>[0]
>;

const incomingDamage = (event: BattleEvent) => event.to.side !== 'foe' && (event.hp ?? 0) < 0;

export function useBattleSound(cue: BattleCue | null) {
  useEffect(() => {
    if (!cue) return;
    const chosen = new Set<string>();
    const timers: number[] = [];
    const response = cue.events.findIndex(incomingDamage);
    const order = new Set([0, response, ...cue.events.keys()]);
    for (const index of order) {
      const event = cue.events[index];
      if (!event || event.outcome === 'push') continue;
      const incoming = incomingDamage(event);
      const key = event.outcome === 'block' || event.art === 'guard' ? 'block' : event.art;
      const group = incoming ? 'incoming' : key;
      if (chosen.has(group)) continue;
      chosen.add(group);
      const play = () => {
        if (key === 'block' || key === 'heal') audioService.playStatusEffectSound(key);
        else audioService.playAttackEffectSound(incoming ? 'impact' : ATTACK_SOUNDS[key]);
      };
      timers.push(window.setTimeout(play, battleCueDelay(index) + (incoming ? 110 : 5)));
      if (timers.length === 3) break;
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [cue]);
}

type Point = { x: number; y: number };
const gridAnchor = (point: BattlePoint): Point => ({
  x: (((point.cell ?? 40) % SIDE) + 0.5) * (100 / SIDE),
  y: (Math.floor((point.cell ?? 40) / SIDE) + 0.5) * (100 / SIDE),
});

function Impact({
  event,
  index,
  from,
  to,
  sprite,
}: {
  event: BattleEvent;
  index: number;
  from: Point;
  to: Point;
  sprite?: string;
}) {
  const { art: effect, outcome, hp } = event;
  const flies = from.x !== to.x || from.y !== to.y;
  const angle = flies ? (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI : 0;
  const style = {
    '--from-x': from.x + '%',
    '--from-y': from.y + '%',
    '--to-x': to.x + '%',
    '--to-y': to.y + '%',
    '--angle': angle + 'deg',
    '--delay': battleCueDelay(index) + 'ms',
  } as React.CSSProperties;
  return (
    <div
      className="sa-strike"
      style={style}
      data-battle-art={effect}
      data-outcome={outcome}
      data-hit-cell={event.to.cell}
      data-hit-side={event.to.side}
    >
      {flies && (
        <img
          className={'sa-strike-travel' + (sprite ? ' sa-strike-shoved' : '')}
          src={sprite ?? art('combat/' + effect)}
          alt=""
        />
      )}
      {outcome !== 'push' && (
        <div className="sa-strike-landing" data-travel={flies || undefined}>
          {outcome !== 'miss' && (
            <img src={art('combat/' + (outcome === 'block' ? 'guard' : effect))} alt="" />
          )}
          {hp !== undefined && hp !== 0 && (
            <strong data-heal={hp > 0 || undefined}>{hp > 0 ? '+' + hp : '−' + -hp}</strong>
          )}
        </div>
      )}
    </div>
  );
}

export function BattleEffects({
  cue,
  grid,
  creatures,
}: {
  cue: BattleCue;
  grid?: boolean;
  creatures: string[];
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const [foes, setFoes] = useState<Point[]>([]);
  useLayoutEffect(() => {
    if (grid) return;
    const stage = overlay.current?.parentElement;
    if (!stage) return;
    const measure = () => {
      const area = stage.getBoundingClientRect();
      if (!area.width || !area.height) return;
      setFoes(
        creatures.map((_, index) => {
          const bounds = stage
            .querySelector(`[data-battle-foe="${index}"] img`)
            ?.getBoundingClientRect();
          if (!bounds) return { x: 100 * ((index + 1) / (creatures.length + 1)), y: 48 };
          return {
            x: ((bounds.left - area.left + bounds.width / 2) / area.width) * 100,
            y: ((bounds.top - area.top + bounds.height / 2) / area.height) * 100,
          };
        }),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [grid, creatures]);
  const anchor = (point: BattlePoint): Point => {
    if (grid) return gridAnchor(point);
    if (point.side === 'foe') return foes[point.index] ?? { x: 50, y: 48 };
    return { x: point.side === 'hero' ? 50 : 33, y: 94 };
  };
  return (
    <div className="sa-battle-effects" aria-hidden="true" ref={overlay}>
      {cue.events.map((event, index) => (
        <Impact
          key={index}
          event={event}
          index={index}
          from={anchor(event.from)}
          to={anchor(event.to)}
          sprite={
            event.outcome === 'push' && event.from.side === 'foe'
              ? creatures[event.from.index]
              : undefined
          }
        />
      ))}
    </div>
  );
}
