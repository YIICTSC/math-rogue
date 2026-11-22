import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  Compass,
  Flame,
  Map,
  RotateCcw,
  RotateCw,
  Sparkles,
  Swords,
} from 'lucide-react';
import { BIOMES, FOES, GOODS, INTENTS, creatureArt, type Text } from './content';
import {
  RUNES,
  damageNames,
  delveDestination,
  foeIntent,
  recordFor,
  runeClue,
} from './delve';
import { atSource } from './expeditions';
import { ExpeditionProgress } from './JourneyPanel';
import { RuinFixture } from './FieldworkPanel';
import { canEat } from './life';
import { formParty } from './party';
import { MEAL_IDS, mealRecipe } from './provisions';
import { ruinCondition } from './ruinConditions';
import { MECHANISMS, circuitAt, historyTitle, ruinFloor, ruinLayout } from './ruinSystems';
import DungeonCorridor from './DungeonCorridor';
import {
  MAX_PARTY_SIZE,
  maxFocus,
  maxHp,
  missedMeals,
  type Adventure,
  type DelveMove,
  type DungeonVerb,
} from './state';
import {
  DIRECTIONS,
  ENTRY_CELL,
  FEATURES,
  SIDE,
  addressKey,
  neighbor,
  townAt,
  type Feature,
  type Floor,
} from './world';
import { art, FormationChoice, Portrait, ResidentPortrait, type Local, type Send } from './ui';

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
  const dishes = MEAL_IDS.filter((id) => (s.journey.meals[id] ?? 0) > 0);
  return (
    <div className="sa-supplies">
      <button type="button" disabled={!s.goods.tonic || s.hp >= maxHp(s) || missedMeals(s) >= 2}
        onClick={() => send({ type: 'use', good: 'tonic' })}>
        {t(GOODS.tonic.name)} ×{s.goods.tonic}
      </button>
      {s.goods.strongTonic > 0 && <button type="button"
        disabled={(s.hp >= maxHp(s) && s.focus >= maxFocus(s)) || missedMeals(s) >= 2}
        onClick={() => send({ type: 'use', good: 'strongTonic' })}>
        {t(GOODS.strongTonic.name)} ×{s.goods.strongTonic}
      </button>}
      <button type="button" disabled={!s.goods.ration || !canEat(s)}
        onClick={() => send({ type: 'use', good: 'ration' })}>
        {t(['弁当を食べる', 'Eat a packed meal', 'べんとうを たべる'])} ×{s.goods.ration}
      </button>
      {dishes.length > 0 && <details className="sa-trail-food">
        <summary>{t(['携行中の郷土料理', 'Packed regional dishes', 'もちあるく りょうり'])} · {dishes.length}</summary>
        <div className="sa-action-list">
          {dishes.map((id) => <button key={id} type="button" disabled={!canEat(s)} onClick={() => send({ type: 'eat-dish', id })}>
            <span>{t(mealRecipe(id).name)} ×{s.journey.meals[id]}</span><small>{t(mealRecipe(id).benefit)}</small>
          </button>)}
        </div>
      </details>}
      {d && (
        <button type="button" disabled={!s.goods.lantern || d.light >= 14}
          onClick={() => send({ type: 'use', good: 'lantern' })}>
          <Flame size={15} />
          {t(GOODS.lantern.name)} ×{s.goods.lantern}
        </button>
      )}
      {d && s.goods.fieldKit > 0 && <button type="button" disabled={!!d.encounter || missedMeals(s) >= 2}
        onClick={() => send({ type: 'use', good: 'fieldKit' })}>
        {t(['野営する', 'Set up camp', 'やえいする'])} ×{s.goods.fieldKit}
      </button>}
    </div>
  );
}

function LabyrinthMap({ s, floor, t, layout }: { s: Adventure; floor: Floor; t: Local; layout: ReturnType<typeof ruinLayout> }) {
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
  const powered = circuitAt(s)?.mode === 'channel';
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
          const fixture = i === layout.device ? '⚙' : i === layout.inscription ? '◈' : '';
          const shortcut = powered && i === layout.shortcut;
          return (
            <span
              key={i}
              data-cell={
                here
                  ? 'current'
                  : seen.has(i) && floor.open.has(i)
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
              data-fixture={mapped.has(i) && (fixture || shortcut) ? (shortcut ? 'shortcut' : fixture) : undefined}
            >
              {here
                ? arrows[d.direction]
                : seen.has(i) && feature && !record.cleared.includes(i)
                  ? SYMBOLS[feature]
                  : mapped.has(i) && fixture
                    ? fixture
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
      {mapped.has(layout.device) || mapped.has(layout.inscription) ? <small className="sa-map-fixture-key">⚙ {t(['仕掛け', 'Mechanism', 'しかけ'])} · ◈ {t(['刻印', 'Inscription', 'こくいん'])}</small> : null}
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
  fixture,
}: {
  s: Adventure;
  floor: Floor;
  t: Local;
  target: number;
  select: (id: number) => void;
  fixture: 'device' | 'inscription' | null;
}) {
  const d = s.delve!;
  const battle = d.encounter;
  const biome = townAt(s.location).biome;
  const front = floor.open.has(neighbor(d.cell, d.direction));
  const record = recordFor(s, d.floor);
  const feature = record.cleared.includes(d.cell) ? undefined : floor.features[d.cell];
  return (
    <section
      className="sa-dungeon-scene"
      data-combat={!!battle || undefined}
      data-dark={d.light <= 0 || undefined}
      data-circuit={circuitAt(s)?.mode ?? undefined}
    >
      <DungeonCorridor floor={floor} cell={d.cell} direction={d.direction} biome={biome} />
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
                : fixture === 'device' ? MECHANISMS[biome].name
                : fixture === 'inscription' ? historyTitle(s.location)
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
            const template = FOES[enemy.template];
            const name = t(template.name);
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
                  src={art(creatureArt(template))}
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
      ) : fixture ? (
        <img className="sa-scene-fixture" src={art('expedition/' + (fixture === 'device' ? 'mechanism-' : 'history-') + biome)} alt="" />
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
  const setting = circuitAt(s)?.mode;
  const floor = useMemo(() => ruinFloor(s.location, d.floor, setting), [address, d.floor, setting]);
  const layout = useMemo(() => ruinLayout(s.location, d.floor), [address, d.floor]);
  const fixture = d.cell === layout.device ? 'device' : d.cell === layout.inscription ? 'inscription' : null;
  const battle = d.encounter;
  const [picked, setPicked] = useState(0);
  const [paused, setPaused] = useState(false);
  const target =
    battle?.enemies[picked]?.hp && battle.enemies[picked].hp > 0
      ? picked
      : Math.max(0, battle?.enemies.findIndex((enemy) => enemy.hp > 0) ?? 0);
  useEffect(() => {
    setPicked(0);
    setPaused(false);
  }, [battle?.cell, battle?.bound]);
  useEffect(() => {
    if (!battle || modalOpen || paused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') send({ type: 'auto-combat', target });
    }, 850);
    return () => window.clearInterval(timer);
  }, [battle, modalOpen, paused, target, send]);
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
  const condition = ruinCondition(s.location, d.floor);
  const expedition = s.journey.expedition;
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
      {(d.floor > 1 || setting || (expedition && atSource(s, expedition) && expedition.stage === 'task')) && (
        <div className="sa-delve-context">
          {d.floor > 1 && <span><strong>{t(condition.name)}</strong><small>{t(condition.hint)}</small></span>}
          {setting && <span><strong>{t(MECHANISMS[town.biome].name)}</strong><small>{t(MECHANISMS[town.biome][setting].name)}</small></span>}
          {expedition && atSource(s, expedition) && expedition.stage === 'task' && <ExpeditionProgress s={s} e={expedition} t={t} />}
        </div>
      )}
      <div className="sa-delve-view">
        <DungeonScene s={s} floor={floor} t={t} target={target} select={setPicked} fixture={fixture} />
        <aside className="sa-delve-side">
          <LabyrinthMap s={s} floor={floor} t={t} layout={layout} />
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
              {t(['自動戦闘', 'Auto combat', 'じどうせんとう'])} · {s.followers.length + 1}/{MAX_PARTY_SIZE}
            </h2>
            <button type="button" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
              {paused ? t(['戦闘を再開', 'Resume combat', 'せんとうを さいかい']) : t(['一時停止', 'Pause', 'いちじていし'])}
            </button>
          </div>
          <div className="sa-combat-party" aria-label={t(['戦闘中の仲間', 'Combat party', 'せんとうちゅうの なかま'])}>
            <article>
              <Portrait id={s.character.portrait} />
              <span><strong>{s.character.name}</strong><small>HP {s.hp}/{maxHp(s)}</small>
                <progress value={s.hp} max={maxHp(s)} aria-label={s.character.name + ' HP'} /></span>
            </article>
            {(battle.allies ?? formParty(s)).map((ally) => {
              const { resident } = s.friends[ally.id];
              const name = t(resident.name);
              return <article key={ally.id} data-down={ally.hp <= 0 || undefined}>
                <ResidentPortrait role={resident.role} />
                <span><strong>{name}</strong>
                  <small>{ally.hp <= 0 ? t(['戦闘不能', 'Knocked out', 'せんとうふのう']) : 'HP ' + ally.hp + '/' + ally.max}</small>
                  <progress value={ally.hp} max={ally.max} aria-label={name + ' HP'} /></span>
              </article>;
            })}
          </div>
          <div className="sa-inline">
            <button type="button" onClick={() => send({ type: 'combat', move: 'parley', target })}>
              {t(['交渉する', 'Parley', 'こうしょうする'])}
            </button>
            <button type="button" onClick={() => send({ type: 'combat', move: 'retreat', target })}>
              {t(['退却を試みる', 'Try to retreat', 'たいきゃくを こころみる'])}
            </button>
            <button type="button" onClick={declare}>
              <Sparkles size={16} />{t(['自由宣言', 'Declare', 'じゆうせんげん'])}
            </button>
          </div>
          <FormationChoice s={s} t={t} send={send} />
          <span className="sa-hint">
            {t(['攻撃と援護は自動で進みます。狙う敵はタップで変更できます。', 'Attacks and support are automatic. Tap an enemy to change targets.', 'こうげきと えんごは じどうです。てきを タップして ねらいを かえられます。'])}
          </span>
        </section>
      ) : fixture ? (
        <RuinFixture s={s} t={t} send={send} fixture={fixture} shortcut={layout.shortcut >= 0} declare={declare} />
      ) : (
        <FeatureActions s={s} floor={floor} t={t} send={send} declare={declare} />
      )}
      <Supplies state={s} t={t} send={send} />
    </div>
  );
}
