import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { audioService } from '../../../services/audioService';
import {
  battleCueDelay,
  type BattleArt,
  type BattleCue,
  type BattleEvent,
  type BattlePoint,
} from './battleFeedback';
import type { Adventure, Ally } from './state';
import { art, CompanionPortrait, Portrait, type Local } from './ui';
import { SIDE } from './world';

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
  riposte: 'finisher',
  command: 'soundwave',
  breach: 'impact',
  secondWind: 'wind',
  frostLattice: 'flash',
  cometfall: 'explosion',
  whirlwind: 'wind',
  shadowStrike: 'slash',
  prismBolt: 'flash',
  faultLine: 'shockwave',
  galePike: 'wind',
  splitArrow: 'projectile',
  stormCircle: 'lightning',
  kilnBurst: 'fire',
  archiveRay: 'laser',
  tideWard: 'wind',
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
      if (!event || event.outcome === 'push' || event.outcome === 'move') continue;
      const incoming = incomingDamage(event);
      const key = event.outcome === 'block' || event.art === 'guard' ? 'block' : event.art;
      const group = incoming
        ? 'incoming'
        : event.from.side === 'party'
          ? event.from.id + '/' + key
          : key;
      if (chosen.has(group)) continue;
      chosen.add(group);
      const play = () => {
        if (key === 'block' || key === 'heal') audioService.playStatusEffectSound(key);
        else audioService.playAttackEffectSound(incoming ? 'impact' : ATTACK_SOUNDS[key]);
      };
      timers.push(window.setTimeout(play, battleCueDelay(cue, index) + (incoming ? 110 : 5)));
      if (timers.length === (cue.alliesAct ? 6 : 3)) break;
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [cue]);
}

type Point = { x: number; y: number };
const gridAnchor = (cell: number): Point => ({
  x: ((cell % SIDE) + 0.5) * (100 / SIDE),
  y: (Math.floor(cell / SIDE) + 0.5) * (100 / SIDE),
});
const HERO_ANCHOR = { x: 50, y: 94 };

function Impact({
  event,
  delay,
  from,
  to,
  sprite,
}: {
  event: BattleEvent;
  delay: number;
  from: Point;
  to: Point;
  sprite?: React.ReactNode;
}) {
  const { art: effect, outcome, hp } = event;
  const flies = from.x !== to.x || from.y !== to.y;
  const angle = flies ? (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI : 0;
  const movement = outcome === 'push' || outcome === 'move';
  const style = {
    '--from-x': from.x + '%',
    '--from-y': from.y + '%',
    '--to-x': to.x + '%',
    '--to-y': to.y + '%',
    '--angle': angle + 'deg',
    '--delay': delay + 'ms',
  } as React.CSSProperties;
  return (
    <div
      className="sa-strike"
      style={style}
      data-battle-art={effect}
      data-outcome={outcome}
      data-hit-cell={event.to.cell}
      data-hit-side={event.to.side}
      data-acting-ally={event.from.side === 'party' ? event.from.id : undefined}
      data-hit-ally={event.to.side === 'party' ? event.to.id : undefined}
    >
      {flies &&
        (movement ? (
          <span className="sa-strike-travel sa-strike-shoved">{sprite}</span>
        ) : (
          <img className="sa-strike-travel" src={art('combat/' + effect)} alt="" />
        ))}
      {!movement && (
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

export function allyAction(cue: BattleCue | null | undefined, id: string) {
  const index =
    cue?.events.findIndex(
      (event) => !event.sharedStep && event.from.side === 'party' && event.from.id === id,
    ) ?? -1;
  return index < 0 ? undefined : battleCueDelay(cue, index);
}

export function BattleEffects({
  s,
  cue,
  grid,
  creatures,
}: {
  s: Adventure;
  cue: BattleCue;
  grid?: boolean;
  creatures: string[];
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const [anchors, setAnchors] = useState<Record<string, Point>>({});
  useLayoutEffect(() => {
    const stage = overlay.current?.parentElement;
    if (!stage || grid) return;
    const measure = () => {
      const area = stage.getBoundingClientRect();
      if (!area.width || !area.height) return;
      const next: Record<string, Point> = {};
      for (const member of stage.querySelectorAll<HTMLElement>(
        '[data-battle-foe], [data-battle-ally]',
      )) {
        const bounds = (
          member.querySelector('.sa-portrait, img') ?? member
        ).getBoundingClientRect();
        const id = member.dataset.battleFoe ?? member.dataset.battleAlly;
        if (id === undefined) continue;
        next[id] = {
          x: ((bounds.left - area.left + bounds.width / 2) / area.width) * 100,
          y: ((bounds.top - area.top + bounds.height / 2) / area.height) * 100,
        };
      }
      setAnchors(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [grid, creatures]);
  const anchor = (point: BattlePoint): Point => {
    if (grid && point.cell !== undefined) return gridAnchor(point.cell);
    if (point.side === 'foe') return anchors[point.index] ?? { x: 50, y: 48 };
    if (point.side === 'party') return anchors[point.id] ?? { x: 33, y: 93 };
    return HERO_ANCHOR;
  };
  return (
    <div className="sa-battle-effects" aria-hidden="true" ref={overlay}>
      {cue.events.map((event, index) => {
        const user = event.from;
        const sprite =
          event.outcome === 'move' || event.outcome === 'push' ? (
            user.side === 'foe' ? (
              <img src={creatures[user.index]} alt="" />
            ) : user.side === 'party' ? (
              <CompanionPortrait s={s} id={user.id} />
            ) : (
              <Portrait id={s.character.portrait} />
            )
          ) : undefined;
        return (
          <Impact
            key={index}
            event={event}
            delay={battleCueDelay(cue, index)}
            from={anchor(user)}
            to={anchor(event.to)}
            sprite={sprite}
          />
        );
      })}
    </div>
  );
}

export function BattleCompanions({
  s,
  t,
  cue,
  showStats,
  allies,
}: {
  s: Adventure;
  t: Local;
  cue?: BattleCue | null;
  showStats: (id: string) => void;
  allies: Ally[];
}) {
  if (!allies.length) return null;
  return (
    <div
      className="sa-battle-allies"
      role="group"
      aria-label={t(['戦闘中の仲間', 'Companions in battle', 'せんとうちゅうの なかま'])}
    >
      {allies.map((ally) => {
        const name = t(s.friends[ally.id].resident.name);
        const delay = allyAction(cue, ally.id);
        return (
          <button
            key={ally.id}
            type="button"
            data-battle-ally={ally.id}
            data-down={ally.hp <= 0 || undefined}
            data-acting={delay !== undefined ? cue?.revision : undefined}
            style={{ '--ally-delay': (delay ?? 0) + 'ms' } as React.CSSProperties}
            aria-label={name + ' · HP ' + ally.hp + '/' + ally.max}
            title={name}
            onClick={() => showStats(ally.id)}
          >
            <CompanionPortrait s={s} id={ally.id} />
            <progress max={ally.max} value={ally.hp} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
