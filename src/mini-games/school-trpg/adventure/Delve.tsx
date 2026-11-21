import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  Compass,
  Eye,
  Flame,
  Map,
  RotateCcw,
  RotateCw,
  Sparkles,
  Swords,
} from 'lucide-react';
import { BIOMES, FOES, GOODS, INTENTS, type Text } from './content';
import {
  COMBAT_MOVES,
  RUNES,
  damageNames,
  delveDestination,
  foeIntent,
  recordFor,
  runeClue,
} from './delve';
import { enemyName } from './inventory';
import {
  maxFocus,
  maxHp,
  type Adventure,
  type CombatMove,
  type DelveMove,
  type DungeonVerb,
} from './state';
import {
  DIRECTIONS,
  ENTRY_CELL,
  FEATURES,
  SIDE,
  addressKey,
  generateFloor,
  neighbor,
  townAt,
  type Feature,
  type Floor,
} from './world';
import { art, type Local, type Send } from './ui';

const SYMBOLS: Record<Feature, string> = {
  pack: '!',
  cache: '◆',
  runes: '＋',
  trap: '×',
  sanctum: '✶',
  vein: '◇',
  guardian: '♜',
  stairs: '↓',
};

export function Supplies({ state: s, send, t }: { state: Adventure; send: Send; t: Local }) {
  const d = s.delve;
  return (
    <div className="sa-supplies">
      <button
        type="button"
        disabled={!s.goods.tonic || s.hp >= maxHp(s)}
        onClick={() => send({ type: 'use', good: 'tonic' })}
      >
        {t(GOODS.tonic.name)} ×{s.goods.tonic}
      </button>
      <button
        type="button"
        disabled={
          !s.goods.ration || (s.fatigue === 0 && s.hp >= maxHp(s) && s.focus >= maxFocus(s))
        }
        onClick={() => send({ type: 'use', good: 'ration' })}
      >
        {t(GOODS.ration.name)} ×{s.goods.ration}
      </button>
      {d && (
        <button
          type="button"
          disabled={!s.goods.lantern || d.light >= 14}
          onClick={() => send({ type: 'use', good: 'lantern' })}
        >
          <Flame size={15} />
          {t(GOODS.lantern.name)} ×{s.goods.lantern}
        </button>
      )}
    </div>
  );
}

function LabyrinthMap({ s, floor, t }: { s: Adventure; floor: Floor; t: Local }) {
  const d = s.delve!;
  const record = recordFor(s, d.floor);
  const seen = new Set(record.seen);
  const mapped = new Set(
    record.seen.flatMap((cell) => [
      cell,
      ...Array.from({ length: 4 }, (_, i) => neighbor(cell, i)),
    ]),
  );
  const arrows = ['↑', '→', '↓', '←'];
  return (
    <div className="sa-minimap">
      <div className="sa-section-row">
        <b>
          <Map size={16} />
          {t(['見取り図', 'Automap', 'みとりず'])}
        </b>
        <small>{record.seen.length}</small>
      </div>
      <div
        className="sa-maze"
        role="img"
        aria-label={t(['探索済みのマス', 'Mapped tiles']) + ' ' + seen.size}
      >
        {Array.from({ length: SIDE * SIDE }, (_, i) => {
          const feature = floor.features[i];
          const here = i === d.cell;
          return (
            <span
              key={i}
              data-cell={
                here
                  ? 'current'
                  : seen.has(i)
                    ? 'seen'
                    : mapped.has(i)
                      ? floor.open.has(i)
                        ? 'path'
                        : 'wall'
                      : 'fog'
              }
              data-feature={
                seen.has(i) && feature && !record.cleared.includes(i) ? feature : undefined
              }
            >
              {here
                ? arrows[d.direction]
                : seen.has(i) && feature && !record.cleared.includes(i)
                  ? SYMBOLS[feature]
                  : i === ENTRY_CELL
                    ? '↑'
                    : ''}
            </span>
          );
        })}
      </div>
      <small>
        {t(['入口', 'Entrance'])} ↑ · {t(['守護者', 'Guardian'])} ♜ · {t(['階段', 'Stairs'])} ↓
      </small>
    </div>
  );
}

function FeatureActions({
  s,
  floor,
  t,
  send,
  declare,
}: {
  s: Adventure;
  floor: Floor;
  t: Local;
  send: Send;
  declare: () => void;
}) {
  const d = s.delve!;
  const record = recordFor(s, d.floor);
  const type = floor.features[d.cell];
  const locked = type === 'stairs' && !record.cleared.includes(floor.seal);
  const cleared = record.cleared.includes(d.cell);
  const inspected = record.inspected.includes(d.cell);
  const action = (verb: DungeonVerb, copy: Text, primary = false) => (
    <button
      type="button"
      className={primary ? 'sa-primary' : undefined}
      onClick={() => send({ type: 'feature', verb })}
    >
      {t(copy)}
    </button>
  );
  return (
    <section className="sa-panel sa-find">
      <div className="sa-section-row">
        <h2>
          {t(
            d.cell === ENTRY_CELL
              ? ['地下の入口', 'Stairwell']
              : type
                ? FEATURES[type]
                : ['通路', 'Passage'],
          )}
        </h2>
        {type && cleared && <span>{t(['調査済み', 'Resolved'])}</span>}
      </div>
      {type === 'runes' && inspected && !cleared && <p className="sa-hint">{t(runeClue(floor))}</p>}
      {locked && (
        <p className="sa-hint">
          {t([
            '守護者から通行の証を得ると、階段が開きます。',
            'Earn passage from the guardian to open the stairs.',
          ])}
        </p>
      )}
      <div className="sa-inline">
        {d.cell === ENTRY_CELL && d.floor > 1 && action('ascend', ['上の階へ', 'Ascend'])}
        {type === 'stairs' && !locked && action('descend', ['次の階へ', 'Descend'], true)}
        {type && type !== 'stairs' && !cleared && (
          <>
            {!inspected && action('inspect', ['調べる', 'Inspect'])}
            {type === 'cache' && action('open', ['宝箱を開ける', 'Open chest'], true)}
            {type === 'sanctum' && action('meditate', ['祭壇で休む', 'Rest at altar'], true)}
            {type === 'vein' && action('harvest', ['素材を採る', 'Take materials'], true)}
            {type === 'pack' && action('sneak', ['気づかれず通る', 'Sneak past'])}
            {(type === 'pack' || type === 'guardian') &&
              action('confront', ['対峙する', 'Confront'], true)}
            {(type === 'runes' || type === 'trap') && (
              <>
                {action('pick', ['仕掛けを解除', 'Disarm mechanism'])}
                {action('force', ['力で突破', 'Force through'])}
              </>
            )}
            {type === 'runes' &&
              inspected &&
              RUNES.map((rune, symbol) => (
                <button
                  type="button"
                  key={symbol}
                  onClick={() => send({ type: 'feature', verb: 'open', symbol })}
                >
                  {t(rune)}
                </button>
              ))}
          </>
        )}
        <button type="button" onClick={declare}>
          <Sparkles size={16} />
          {t(['自由宣言', 'Declare an action', 'じゆうせんげん'])}
        </button>
      </div>
    </section>
  );
}

function DungeonScene({
  s,
  floor,
  t,
  target,
  select,
}: {
  s: Adventure;
  floor: Floor;
  t: Local;
  target: number;
  select: (id: number) => void;
}) {
  const d = s.delve!;
  const battle = d.encounter;
  const biome = townAt(s.location).biome;
  const front = floor.open.has(neighbor(d.cell, d.direction));
  const port = floor.open.has(neighbor(d.cell, (d.direction + 3) % 4));
  const starboard = floor.open.has(neighbor(d.cell, (d.direction + 1) % 4));
  const record = recordFor(s, d.floor);
  const feature = record.cleared.includes(d.cell) ? undefined : floor.features[d.cell];
  return (
    <section
      className="sa-dungeon-scene"
      data-combat={!!battle || undefined}
      data-dark={d.light <= 0 || undefined}
    >
      <img className="sa-dungeon-art" src={art('dungeon-' + biome)} alt="" />
      {!battle && (
        <>
          {!port && <div className="sa-wall sa-wall-left" />}
          {!starboard && <div className="sa-wall sa-wall-right" />}
          {!front && <div className="sa-wall sa-wall-front" />}
        </>
      )}
      <div className="sa-scene-line">
        <span>
          <Compass size={17} />
          {t(DIRECTIONS[d.direction])}
        </span>
        {battle ? (
          <span>
            <Swords size={17} />
            {t(['ターン', 'Turn'])} {battle.turn} · {t(['連携', 'Combo'])} {battle.combo}
          </span>
        ) : (
          <span>
            {t(
              feature
                ? FEATURES[feature]
                : front
                  ? ['道が続く', 'Passage ahead']
                  : ['行き止まり', 'Wall ahead'],
            )}
          </span>
        )}
      </div>
      {battle ? (
        <div className="sa-foes" role="group" aria-label={t(['攻撃対象', 'Combat targets'])}>
          {battle.enemies.map((enemy, index) => {
            if (enemy.hp <= 0) return null;
            const name = t(enemyName(enemy.template, battle.guardian));
            const template = FOES[enemy.template];
            return (
              <button
                key={index}
                type="button"
                aria-pressed={index === target}
                onClick={() => select(index)}
                className="sa-foe"
              >
                <span className="sa-intent">
                  {enemy.stagger
                    ? t(['ひるみ', 'Staggered'])
                    : t(INTENTS[foeIntent(battle, enemy)])}
                </span>
                <img
                  src={art(template.image === 12 ? 'foe-5' : 'bestiary-' + template.image)}
                  alt=""
                />
                <span className="sa-foe-name">
                  <strong>{name}</strong>
                  <span>
                    {enemy.hp}/{enemy.max}
                  </span>
                </span>
                <progress value={enemy.hp} max={enemy.max} aria-label={name + ' HP'} />
                {enemy.known && (
                  <small>
                    {t(['弱点', 'Weak'])} {t(damageNames[template.weak])} · {t(['耐性', 'Resist'])}{' '}
                    {t(damageNames[template.resist])}
                  </small>
                )}
              </button>
            );
          })}
        </div>
      ) : feature ? (
        <div className="sa-scene-marker" aria-hidden="true">
          {SYMBOLS[feature]}
        </div>
      ) : null}
    </section>
  );
}

export default function DelveView({
  state: s,
  send,
  t,
  declare,
  modalOpen,
}: {
  state: Adventure;
  send: Send;
  t: Local;
  declare: () => void;
  modalOpen: boolean;
}) {
  const d = s.delve!;
  const address = addressKey(s.location);
  const floor = useMemo(() => generateFloor(s.location, d.floor), [address, d.floor]);
  const battle = d.encounter;
  const [picked, setPicked] = useState(0);
  const target =
    battle?.enemies[picked]?.hp && battle.enemies[picked].hp > 0
      ? picked
      : Math.max(0, battle?.enemies.findIndex((enemy) => enemy.hp > 0) ?? 0);
  useEffect(() => setPicked(0), [battle?.cell, battle?.bound]);
  useEffect(() => {
    if (battle || modalOpen) return;
    const keys: Record<string, DelveMove> = {
      arrowup: 'forward',
      w: 'forward',
      arrowdown: 'backward',
      s: 'backward',
      arrowleft: 'left',
      a: 'left',
      arrowright: 'right',
      d: 'right',
    };
    const move = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest('input, textarea, select, [contenteditable]'))
      )
        return;
      const key = event.key.toLowerCase();
      if (!Object.hasOwn(keys, key)) return;
      event.preventDefault();
      send({ type: 'move', direction: keys[key] });
    };
    window.addEventListener('keydown', move);
    return () => window.removeEventListener('keydown', move);
  }, [battle, modalOpen, send]);
  const town = townAt(s.location);
  const biome = BIOMES[town.biome];
  return (
    <div className="sa-delve">
      <div className="sa-section-row sa-delve-head">
        <div>
          <span className="sa-hint">{t(town.name)}</span>
          <h1>
            {t(biome.ruin)} · B{d.floor}
          </h1>
        </div>
        <div className="sa-inline">
          <span className="sa-lamp">
            <Flame size={17} />
            {t(['灯り', 'Light'])} {d.light}
          </span>
          <button type="button" disabled={!!battle} onClick={() => send({ type: 'leave-delve' })}>
            <ArrowUpToLine size={17} />
            {t(['地上へ戻る', 'Return to town', 'ちじょうへ もどる'])}
          </button>
        </div>
      </div>
      <div className="sa-delve-view">
        <DungeonScene s={s} floor={floor} t={t} target={target} select={setPicked} />
        <aside className="sa-delve-side">
          <LabyrinthMap s={s} floor={floor} t={t} />
          {!battle && (
            <div
              className="sa-dpad"
              role="group"
              aria-label={t(['探索操作', 'Exploration controls'])}
            >
              <button
                className="sa-step-front"
                type="button"
                disabled={delveDestination(s, floor) < 0}
                aria-label={t(['前進', 'Step forward'])}
                onClick={() => send({ type: 'move', direction: 'forward' })}
              >
                <ArrowUp size={20} />
              </button>
              <button
                className="sa-turn-left"
                type="button"
                aria-label={t(['左を向く', 'Turn left'])}
                onClick={() => send({ type: 'move', direction: 'left' })}
              >
                <RotateCcw size={20} />
              </button>
              <button
                className="sa-step-back"
                type="button"
                disabled={delveDestination(s, floor, true) < 0}
                aria-label={t(['後退', 'Step backward'])}
                onClick={() => send({ type: 'move', direction: 'backward' })}
              >
                <ArrowDown size={20} />
              </button>
              <button
                className="sa-turn-right"
                type="button"
                aria-label={t(['右を向く', 'Turn right'])}
                onClick={() => send({ type: 'move', direction: 'right' })}
              >
                <RotateCw size={20} />
              </button>
            </div>
          )}
        </aside>
      </div>
      {battle ? (
        <section className="sa-panel sa-techniques">
          <div className="sa-section-row">
            <h2>
              <Swords size={18} />
              {t(['戦闘', 'Combat', 'せんとう'])}
            </h2>
            <button
              type="button"
              onClick={declare}
              aria-label={t(['自由宣言', 'Declare an action'])}
            >
              <Sparkles size={16} />
              {t(['自由宣言', 'Declare'])}
            </button>
          </div>
          <div className="sa-technique-grid">
            {(Object.keys(COMBAT_MOVES) as CombatMove[]).map((move) => {
              const technique = COMBAT_MOVES[move];
              return (
                <button
                  type="button"
                  disabled={s.focus < technique.cost}
                  key={move}
                  onClick={() => send({ type: 'combat', move, target })}
                  title={t(technique.hint)}
                >
                  <strong>{t(technique.name)}</strong>
                  {technique.cost > 0 && (
                    <small>
                      {t(['集中', 'Focus'])} −{technique.cost}
                    </small>
                  )}
                </button>
              );
            })}
          </div>
          <span className="sa-hint">
            <Eye size={15} />
            {t([
              '敵の構えを見て、攻撃・防御・交渉を選べます。',
              'Read the enemy’s intent before you attack, guard, or bargain.',
            ])}
          </span>
        </section>
      ) : (
        <FeatureActions s={s} floor={floor} t={t} send={send} declare={declare} />
      )}
      <Supplies state={s} t={t} send={send} />
    </div>
  );
}
