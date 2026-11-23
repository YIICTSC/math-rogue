import React, { useEffect } from 'react';
import { Anchor, Crosshair, Sparkles, Swords } from 'lucide-react';
import { FOES, INTENTS, creatureArt, type Text } from './content';
import { COMBAT_MOVES, canCombatMove, damageNames, foeIntent, recordFor } from './delve';
import { allyAction, BattleCompanions, BattleEffects } from './BattleEffects';
import { battleCueDelay, type BattleCue } from './battleFeedback';
import { loadoutTechniques, techniqueFor } from './battleTechniques';
import { TERRAIN } from './frontierContent';
import {
  actionPosition,
  borrowedCreature,
  canTacticalStep,
  distanceToTarget,
  moveRange,
  partyAt,
  partyPositions,
  tacticalTarget,
} from './fieldTactics';
import { glancingSight, terrainAt } from './frontierWorld';
import { type Adventure, type CombatMove } from './state';
import { neighbor, SIDE, type Floor } from './world';
import { formParty } from './party';
import { art, CompanionPortrait, Portrait, type Local, type Send } from './ui';

type Props = {
  s: Adventure;
  floor: Floor;
  target: number;
  select: (index: number) => void;
  send: Send;
  t: Local;
  modalOpen: boolean;
  busy?: boolean;
  showStats: (id: string) => void;
  cue?: BattleCue | null;
};
const ATTACKS: readonly CombatMove[] = ['strike', 'spark', 'guard', 'study'];
const MOVE_LABELS: Partial<Record<CombatMove, Text>> = {
  heavy: ['崩し', 'Break', 'くずし'],
  spark: ['星灯', 'Spell', 'ほしあかり'],
  guard: ['防御', 'Guard', 'ぼうぎょ'],
  study: ['弱点', 'Study', 'じゃくてん'],
  befriend: ['勧誘', 'Recruit', 'かんゆう'],
};

export function TacticalView({
  s,
  floor,
  target,
  select,
  send,
  t,
  modalOpen,
  busy,
  cue,
  showStats,
}: Props) {
  const d = s.delve!;
  const battle = d.encounter!;
  const grid = battle.tactics!;
  const seen = new Set(recordFor(s, d.floor).seen);
  const hero = d.cell;
  const from = actionPosition(s);
  const linked = borrowedCreature(battle);
  const allies = battle.allies ?? formParty(s);
  const positions = partyPositions(s, battle, floor);
  const reserve = allies.filter((member) => positions[member.id] === undefined || member.hp <= 0);
  const creatures = battle.enemies.map((enemy) => art(creatureArt(FOES[enemy.template])));
  const casualties = new Set(
    cue?.events.flatMap((event) =>
      event.hp && event.hp < 0 && event.to.side === 'foe' ? [event.to.index] : [],
    ),
  );
  const canSee = (cell: number) => glancingSight(floor, from, cell, 6);
  useEffect(() => {
    if (modalOpen) return;
    const directions: Record<string, number> = {
      arrowup: 0,
      w: 0,
      arrowright: 1,
      d: 1,
      arrowdown: 2,
      s: 2,
      arrowleft: 3,
      a: 3,
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest('input, select, textarea, [contenteditable]'))
      )
        return;
      const key = event.key.toLowerCase();
      if (!Object.hasOwn(directions, key)) return;
      event.preventDefault();
      const cell = neighbor(from, directions[key]);
      if (canTacticalStep(s, cell, floor)) send({ type: 'tactical-step', cell });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [from, s, floor, send, modalOpen]);

  return (
    <section
      className="sa-panel sa-tactical"
      aria-label={t(['戦術マップ', 'Tactical map', 'せんじゅつ マップ'])}
    >
      <div className="sa-section-row">
        <h2>
          <Swords size={18} />
          {t(['戦術戦闘', 'Tactical combat', 'せんじゅつせんとう'])}
        </h2>
        {reserve.length > 0 && (
          <BattleCompanions s={s} t={t} cue={cue} showStats={showStats} allies={reserve} />
        )}
        <b className="sa-gold">
          {t(['手番', 'Turn', 'てばん'])} {battle.turn}
        </b>
      </div>
      {linked >= 0 && (
        <p className="sa-gold">
          {t(['影渡しで操作中', 'Steering via Shadow Steering', 'かげわたしで そうさちゅう'])} ·{' '}
          {t(battle.enemies[linked].epithets ?? FOES[battle.enemies[linked].template].name)}
        </p>
      )}
      <div
        className="sa-tactical-grid"
        role="group"
        aria-label={t(['戦闘中の位置', 'Combat positions', 'せんとうの いち'])}
      >
        {Array.from({ length: SIDE * SIDE }, (_, cell) => {
          const open = floor.open.has(cell);
          const visible = canSee(cell);
          const unit = visible
            ? grid.cells.findIndex((value, index) => value === cell && battle.enemies[index].hp > 0)
            : -1;
          const allyId = partyAt(battle, positions, cell);
          const ally =
            allies.find((member) => member.id === allyId) ??
            (unit < 0 && cell !== hero
              ? allies.find(
                  (member) =>
                    member.hp <= 0 &&
                    positions[member.id] === cell &&
                    cue?.events.some(
                      (event) =>
                        event.to.side === 'party' &&
                        event.to.id === member.id &&
                        (event.hp ?? 0) < 0,
                    ),
                )
              : undefined);
          const down =
            visible && cell !== hero && unit < 0 && !ally
              ? grid.cells.findIndex((value, index) => value === cell && casualties.has(index))
              : -1;
          const shown = unit >= 0 ? unit : down;
          const borrowed = unit >= 0 && unit === linked;
          const step = !busy && canTacticalStep(s, cell, floor);
          const terrain =
            open && (visible || seen.has(cell)) ? terrainAt(s, cell, d.floor, floor) : null;
          const name =
            unit >= 0
              ? t(battle.enemies[unit].epithets ?? FOES[battle.enemies[unit].template].name)
              : '';
          const pinned = unit >= 0 && (battle.enemies[unit].pinnedUntil ?? 0) >= battle.turn;
          const marked = unit >= 0 && (battle.enemies[unit].markedUntil ?? 0) >= battle.turn;
          const motion =
            cue?.events.findIndex(
              ({ outcome, to }) =>
                (outcome === 'push' || outcome === 'move') &&
                to.cell === cell &&
                ((to.side === 'foe' && to.index === shown) ||
                  (to.side === 'party' && to.id === ally?.id) ||
                  (to.side === 'hero' && cell === hero)),
            ) ?? -1;
          const active = ally ? allyAction(cue, ally.id) : undefined;
          const hurt =
            cue?.events.findIndex(
              (event) =>
                event.to.cell === cell && (event.outcome === 'hit' || event.outcome === 'block'),
            ) ?? -1;
          const mark =
            cell === hero ? (
              <Portrait id={s.character.portrait} />
            ) : ally ? (
              <span
                className="sa-tactical-unit sa-tactical-ally"
                data-down={ally.hp <= 0 || undefined}
              >
                <CompanionPortrait s={s} id={ally.id} />
                <progress max={ally.max} value={ally.hp} aria-hidden="true" />
              </span>
            ) : shown >= 0 ? (
              <span className="sa-tactical-unit" data-down={down >= 0 || undefined}>
                <img src={creatures[shown]} alt="" draggable={false} />
                {unit >= 0 && (
                  <progress
                    max={battle.enemies[unit].max}
                    value={battle.enemies[unit].hp}
                    aria-hidden="true"
                  />
                )}
                {(pinned || marked) && (
                  <span className="sa-unit-status" aria-hidden="true">
                    {pinned && <Anchor size={11} />}
                    {marked && <Crosshair size={11} />}
                  </span>
                )}
              </span>
            ) : terrain ? (
              TERRAIN[terrain].mark
            ) : (
              ' '
            );
          const coords = (cell % SIDE) + 1 + ',' + (Math.floor(cell / SIDE) + 1);
          const label =
            cell === hero
              ? t(['主人公', 'Hero', 'しゅじんこう'])
              : ally
                ? t(s.friends[ally.id].resident.name) + ' · HP ' + ally.hp + '/' + ally.max
                : unit >= 0
                  ? name
                  : step
                    ? t(['移動先', 'Step to', 'いどうさき'])
                    : terrain
                      ? t(['通路', 'Passage', 'つうろ'])
                      : t(['未確認', 'Unseen', 'みかくにん']);
          return (
            <button
              type="button"
              key={cell}
              tabIndex={step || ally || (unit >= 0 && !borrowed) ? 0 : -1}
              disabled={!step && !ally && (unit < 0 || borrowed)}
              data-tile={cell}
              data-hero={cell === hero || undefined}
              data-foe={unit >= 0 || undefined}
              data-tactical-ally={ally?.id}
              data-acting={active !== undefined ? cue?.revision : undefined}
              data-motion={motion >= 0 ? cue?.revision : undefined}
              data-borrowed={borrowed || undefined}
              data-fog={!terrain || undefined}
              data-step={step || undefined}
              data-hurt={
                hurt >= 0 && (cell === hero || shown >= 0 || ally) ? cue?.revision : undefined
              }
              aria-pressed={unit >= 0 ? unit === target : undefined}
              aria-label={label + ' ' + coords + (terrain ? ' · ' + t(TERRAIN[terrain].name) : '')}
              style={
                {
                  '--terrain': terrain ? TERRAIN[terrain].color : undefined,
                  '--hit-delay': battleCueDelay(cue, hurt) + 110 + 'ms',
                  '--movement-delay': battleCueDelay(cue, motion) + 'ms',
                  '--ally-delay': (active ?? 0) + 'ms',
                } as React.CSSProperties
              }
              onClick={() => {
                if (unit >= 0) select(unit);
                else if (step) send({ type: 'tactical-step', cell });
                else if (ally) showStats(ally.id);
              }}
            >
              {mark}
            </button>
          );
        })}
        {cue && <BattleEffects key={cue.revision} s={s} cue={cue} creatures={creatures} grid />}
      </div>
    </section>
  );
}

type ActionProps = Omit<Props, 'select' | 'modalOpen' | 'cue' | 'showStats'>;

export function TacticalTarget({ s, send, t, target, floor, busy }: ActionProps) {
  const battle = s.delve!.encounter!;
  const grid = battle.tactics!;
  const enemy = battle.enemies[target];
  const targetCell = grid.cells[target];
  const template = enemy && enemy.hp > 0 && FOES[enemy.template];
  const status: Text =
    (enemy?.pinnedUntil ?? 0) >= battle.turn
      ? ['足止め', 'Pinned', 'あしどめ']
      : (enemy?.markedUntil ?? 0) >= battle.turn
        ? ['目印あり', 'Marked', 'めじるし あり']
        : enemy?.stagger
          ? ['ひるみ', 'Staggered', 'ひるみ']
          : enemy
            ? INTENTS[foeIntent(battle, enemy)]
            : ['不明', 'Unknown', 'ふめい'];
  return template && enemy && glancingSight(floor, actionPosition(s), targetCell, 6) ? (
    <div className="sa-tactical-target">
      <img src={art(creatureArt(template))} alt="" />
      <span>
        <span className="sa-tactical-vitals">
          <strong title={t(enemy.epithets ?? template.name)}>
            {t(enemy.epithets ?? template.name)}
          </strong>
          <b aria-label={'HP ' + enemy.hp + '/' + enemy.max}>
            {enemy.hp}/{enemy.max}
          </b>
        </span>
        <small>
          {t(status)}{' '}
          <span className="sa-tactical-distance">
            · {t(['距離', 'Distance'])} {distanceToTarget(s, target)}
          </span>
        </small>
        {enemy.known && (
          <small>
            {t(['弱点', 'Weakness'])} · {t(damageNames[template.weak])}
          </small>
        )}
      </span>
      <button
        type="button"
        disabled={busy || grid.aim === target || !tacticalTarget(s, 'spark', target, floor)}
        onClick={() => send({ type: 'tactical-aim', target })}
      >
        <Crosshair size={16} />
        {t(['狙いを定める', 'Aim', 'ねらいを さだめる'])}
      </button>
    </div>
  ) : (
    <p className="sa-hint">
      {t([
        '射線に入ると相手を選べます。',
        'Move into sight to select a foe.',
        'みえる ばしょに いどうしよう。',
      ])}
    </p>
  );
}

export function TacticalMoves({ s, send, t, target, floor, busy }: ActionProps) {
  const moves: CombatMove[] = [...ATTACKS, ...loadoutTechniques(s, true)];
  return (
    <div className="sa-tactical-moves">
      {moves.map((move) => {
        const technique = COMBAT_MOVES[move];
        const special = techniqueFor(move);
        const range = special || move === 'strike' || move === 'spark' ? moveRange(s, move) : 0;
        const rangeLabel = t(['射程', 'Range', 'しゃてい']);
        const focusLabel = t(['集中', 'Focus', 'しゅうちゅう']);
        return (
          <button
            key={move}
            type="button"
            aria-label={t(technique.name)}
            title={t(technique.hint)}
            data-technique={special ? move : undefined}
            disabled={busy || !canCombatMove(s, move, target, floor)}
            onClick={() => send({ type: 'combat', move, target })}
          >
            <span>
              {t(special?.short ?? MOVE_LABELS[move] ?? technique.name)}
              {(range > 0 || technique.cost > 0) && (
                <small
                  className="sa-tactical-range"
                  aria-label={rangeLabel + ' ' + range + ' · ' + focusLabel + ' ' + technique.cost}
                >
                  {range > 0 && (
                    <span title={rangeLabel}>
                      <Crosshair size={11} aria-hidden="true" />
                      {range}
                    </span>
                  )}
                  {technique.cost > 0 && (
                    <span title={focusLabel}>
                      <Sparkles size={11} aria-hidden="true" />
                      {technique.cost}
                    </span>
                  )}
                </small>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
