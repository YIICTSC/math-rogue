import React, { useEffect } from 'react';
import { Crosshair, Sparkles, Swords } from 'lucide-react';
import { FOES, INTENTS, creatureArt, type Text } from './content';
import { COMBAT_MOVES, damageNames, foeIntent, recordFor } from './delve';
import { TERRAIN } from './frontierContent';
import {
  actionPosition,
  borrowedCreature,
  canTacticalStep,
  distanceToTarget,
  moveRange,
  occupied,
  tacticalTarget,
} from './fieldTactics';
import { fieldSkill } from './frontierState';
import { glancingSight, terrainAt } from './frontierWorld';
import { type Adventure, type CombatMove } from './state';
import { neighbor, SIDE, type Floor } from './world';
import { art, Portrait, type Local, type Send } from './ui';

type Props = {
  s: Adventure;
  floor: Floor;
  target: number;
  select: (index: number) => void;
  send: Send;
  t: Local;
  modalOpen: boolean;
};
const ATTACKS: readonly CombatMove[] = [
  'strike',
  'heavy',
  'quick',
  'spark',
  'guard',
  'study',
  'parley',
];
const MOVE_LABELS: Partial<Record<CombatMove, Text>> = {
  heavy: ['崩し', 'Break', 'くずし'],
  spark: ['星灯', 'Spell', 'ほしあかり'],
  guard: ['防御', 'Guard', 'ぼうぎょ'],
  study: ['弱点', 'Study', 'じゃくてん'],
  befriend: ['勧誘', 'Recruit', 'かんゆう'],
};

export function TacticalView({ s, floor, target, select, send, t, modalOpen }: Props) {
  const d = s.delve!;
  const battle = d.encounter!;
  const grid = battle.tactics!;
  const seen = new Set(recordFor(s, d.floor).seen);
  const hero = d.cell;
  const from = actionPosition(s);
  const linked = borrowedCreature(battle);
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
          const unit =
            visible && occupied(battle, cell)
              ? grid.cells.findIndex(
                  (value, index) => value === cell && battle.enemies[index].hp > 0,
                )
              : -1;
          const borrowed = unit >= 0 && unit === linked;
          const step = canTacticalStep(s, cell, floor);
          const terrain =
            open && (visible || seen.has(cell)) ? terrainAt(s, cell, d.floor, floor) : null;
          const name =
            unit >= 0
              ? t(battle.enemies[unit].epithets ?? FOES[battle.enemies[unit].template].name)
              : '';
          const mark =
            cell === hero ? (
              <Portrait id={s.character.portrait} />
            ) : borrowed ? (
              '◆'
            ) : unit >= 0 ? (
              unit + 1
            ) : terrain ? (
              TERRAIN[terrain].mark
            ) : (
              ' '
            );
          const coords = (cell % SIDE) + 1 + ',' + (Math.floor(cell / SIDE) + 1);
          const label =
            cell === hero
              ? t(['主人公', 'Hero', 'しゅじんこう'])
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
              tabIndex={step || (unit >= 0 && !borrowed) ? 0 : -1}
              disabled={!step && (unit < 0 || borrowed)}
              data-tile={cell}
              data-hero={cell === hero || undefined}
              data-foe={unit >= 0 || undefined}
              data-borrowed={borrowed || undefined}
              data-fog={!terrain || undefined}
              data-step={step || undefined}
              aria-pressed={unit >= 0 ? unit === target : undefined}
              aria-label={label + ' ' + coords + (terrain ? ' · ' + t(TERRAIN[terrain].name) : '')}
              style={
                terrain
                  ? ({ '--terrain': TERRAIN[terrain].color } as React.CSSProperties)
                  : undefined
              }
              onClick={() => (unit >= 0 ? select(unit) : send({ type: 'tactical-step', cell }))}
            >
              {mark}
            </button>
          );
        })}
      </div>
    </section>
  );
}

type ActionProps = Omit<Props, 'select' | 'modalOpen'>;

export function TacticalTarget({ s, send, t, target, floor }: ActionProps) {
  const battle = s.delve!.encounter!;
  const grid = battle.tactics!;
  const enemy = battle.enemies[target];
  const targetCell = grid.cells[target];
  const template = enemy && enemy.hp > 0 && FOES[enemy.template];
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
          {t(enemy.stagger ? ['ひるみ', 'Staggered'] : INTENTS[foeIntent(battle, enemy)])}{' '}
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
        disabled={grid.aim === target || !tacticalTarget(s, 'spark', target, floor)}
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

export function TacticalMoves({ s, send, t, target, floor }: ActionProps) {
  const foe = s.delve?.encounter?.enemies[target];
  const moves =
    !s.delve?.encounter?.guardian && (foe?.epithets || fieldSkill(s, 'diplomacy'))
      ? [...ATTACKS, 'befriend' as const]
      : ATTACKS;
  return (
    <div className="sa-tactical-moves">
      {moves.map((move) => {
        const technique = COMBAT_MOVES[move];
        const range = ['strike', 'heavy', 'quick', 'spark'].includes(move) ? moveRange(s, move) : 0;
        const rangeLabel = t(['射程', 'Range', 'しゃてい']);
        const focusLabel = t(['集中', 'Focus', 'しゅうちゅう']);
        return (
          <button
            key={move}
            type="button"
            aria-label={t(technique.name)}
            title={t(technique.hint)}
            disabled={
              !tacticalTarget(s, move, target, floor) ||
              s.focus < technique.cost ||
              (move === 'befriend' && (s.frontier.liquids.water < 2 || s.followers.length >= 5))
            }
            onClick={() => send({ type: 'combat', move, target })}
          >
            <span>
              {t(MOVE_LABELS[move] ?? technique.name)}
              {range > 0 && (
                <small
                  className="sa-tactical-range"
                  aria-label={rangeLabel + ' ' + range + ' · ' + focusLabel + ' ' + technique.cost}
                >
                  <span title={rangeLabel}>
                    <Crosshair size={11} aria-hidden="true" />
                    {range}
                  </span>
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
