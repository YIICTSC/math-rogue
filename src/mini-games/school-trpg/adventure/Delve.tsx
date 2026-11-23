import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  Backpack,
  BookOpen,
  Footprints,
  List,
  Compass,
  Flame,
  Map,
  RotateCcw,
  RotateCw,
  Sparkles,
  Swords,
} from 'lucide-react';
import { BIOMES, FOES, GOODS, INTENTS, creatureArt, type Text } from './content';
import { BattleEffects } from './BattleEffects';
import { BATTLE_ART, battleCueDelay, type BattleCue } from './battleFeedback';
import { BattleTechniqueMenu, BattleTutorial, TECHNIQUES_TITLE, readCombatIntro, rememberCombatIntro } from './BattleHelp';
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
import { FieldStatus, FieldSupplies } from './FrontierPanel';
import { TERRAIN } from './frontierContent';
import { fieldSkill } from './frontierState';
import { fieldFloor, glancingSight, plannedWalk, terrainAt } from './frontierWorld';
import { actionPosition, borrowedCreature } from './fieldTactics';
import { canEat } from './life';
import { formParty } from './party';
import { MEAL_IDS, mealRecipe } from './provisions';
import { ruinCondition } from './ruinConditions';
import { MECHANISMS, circuitAt, historyTitle, ruinLayout } from './ruinSystems';
import { TacticalMoves, TacticalTarget, TacticalView } from './TacticalView';
import ScreenDialog from './ScreenDialog';
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

function explorationChoices(s: Adventure, floor: Floor) {
  const d = s.delve!;
  const record = recordFor(s, d.floor);
  const type = floor.features[d.cell];
  const locked = type === 'stairs' && !record.cleared.includes(floor.seal);
  const cleared = record.cleared.includes(d.cell);
  const inspected = record.inspected.includes(d.cell);
  const options: Array<{ verb: DungeonVerb; name: Text; primary?: boolean; symbol?: number }> = [];
  if (d.cell === ENTRY_CELL && d.floor > 1)
    options.push({ verb: 'ascend', name: ['上の階へ', 'Ascend', 'うえの かいへ'], primary: true });
  if (type === 'stairs' && !locked)
    options.push({
      verb: 'descend',
      name: ['次の階へ', 'Descend', 'つぎの かいへ'],
      primary: true,
    });
  if (type && type !== 'stairs' && !cleared) {
    if (!inspected) options.push({ verb: 'inspect', name: ['調べる', 'Inspect', 'しらべる'] });
    if (type === 'cache')
      options.push({
        verb: 'open',
        name: ['宝箱を開ける', 'Open chest', 'たからばこを あける'],
        primary: true,
      });
    if (type === 'sanctum')
      options.push({
        verb: 'meditate',
        name: ['祭壇で休む', 'Rest at altar', 'さいだんで やすむ'],
        primary: true,
      });
    if (type === 'vein')
      options.push({
        verb: 'harvest',
        name: ['素材を採る', 'Take materials', 'そざいを とる'],
        primary: true,
      });
    if (type === 'pack')
      options.push({ verb: 'sneak', name: ['気づかれず通る', 'Sneak past', 'きづかれず とおる'] });
    if (type === 'pack' || type === 'guardian')
      options.push({
        verb: 'confront',
        name: ['対峙する', 'Confront', 'たいじする'],
        primary: true,
      });
    if (type === 'runes' || type === 'trap') {
      options.push(
        { verb: 'pick', name: ['仕掛けを解除', 'Disarm mechanism', 'しかけを かいじょ'] },
        { verb: 'force', name: ['力で突破', 'Force through', 'ちからで とっぱ'] },
      );
    }
    if (type === 'runes' && inspected) {
      RUNES.forEach((name, symbol) => options.push({ verb: 'open', name, symbol }));
    }
  }
  const location: Text =
    d.cell === ENTRY_CELL
      ? ['地下の入口', 'Stairwell', 'ちかの いりぐち']
      : type
        ? FEATURES[type]
        : ['通路', 'Passage', 'つうろ'];
  const hint: Text | null = locked
    ? [
        '守護者から通行の証を得ると、階段が開きます。',
        'Earn passage from the guardian to open the stairs.',
      ]
    : type === 'runes' && inspected && !cleared
      ? runeClue(floor)
      : null;
  const preferred = options.find((option) => option.primary) ?? options[0];
  return { options, location, hint, preferred };
}

function DungeonScene({
  s,
  floor,
  t,
  target,
  select,
  fixture,
  cue,
}: {
  s: Adventure;
  floor: Floor;
  t: Local;
  target: number;
  select: (id: number) => void;
  fixture: 'device' | 'inscription' | null;
  cue?: BattleCue | null;
}) {
  const d = s.delve!;
  const battle = d.encounter;
  const biome = townAt(s.location).biome;
  const front = floor.open.has(neighbor(d.cell, d.direction));
  const ahead = front && fieldSkill(s, 'wayfinding') ? terrainAt(s, neighbor(d.cell, d.direction), d.floor, floor) : 'floor';
  const record = recordFor(s, d.floor);
  const feature = record.cleared.includes(d.cell) ? undefined : floor.features[d.cell];
  const creatures = battle?.enemies.map((enemy) => art(creatureArt(FOES[enemy.template]))) ?? [];
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
                  ? ahead === 'floor' ? ['道が続く', 'Passage ahead'] : TERRAIN[ahead].name
                  : ['行き止まり', 'Wall ahead'],
            )}
          </span>
        )}
      </div>
      {battle ? (
        <div className="sa-foes" role="group" aria-label={t(['攻撃対象', 'Combat targets'])}>
          {battle.enemies.map((enemy, index) => {
            const down = enemy.hp <= 0;
            if (down && !cue?.events.some((event) => (event.hp ?? 0) < 0 &&
              event.to.side === 'foe' && event.to.index === index)) return null;
            const template = FOES[enemy.template];
            const name = t(enemy.epithets ?? template.name);
            const hurt = cue?.events.findIndex((event) =>
              event.to.side === 'foe' && event.to.index === index && event.outcome === 'hit',
            ) ?? -1;
            return (
              <button
                key={index}
                type="button"
                aria-pressed={index === target}
                onClick={() => select(index)}
                className="sa-foe"
                disabled={down}
                data-down={down || undefined}
                data-battle-foe={index}
                data-hurt={hurt >= 0 ? cue?.revision : undefined}
                style={{ '--hit-delay': battleCueDelay(hurt) + 110 + 'ms' } as React.CSSProperties}
              >
                <span className="sa-intent">
                  {enemy.stagger
                    ? t(['ひるみ', 'Staggered'])
                    : t(INTENTS[foeIntent(battle, enemy)])}
                </span>
                <img
                  src={creatures[index]}
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
                {(enemy.markedUntil ?? 0) >= battle.turn && <small>{t(['目印あり', 'Marked', 'めじるし あり'])}</small>}
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
      {battle && cue && <BattleEffects key={cue.revision} cue={cue} creatures={creatures} />}
    </section>
  );
}

export default function DelveView({
  state: s,
  cue,
  send,
  t,
  declare,
  modalOpen,
}: {
  state: Adventure;
  cue?: BattleCue | null;
  send: Send;
  t: Local;
  declare: () => void;
  modalOpen: boolean;
}) {
  const d = s.delve!;
  const address = addressKey(s.location);
  const setting = circuitAt(s)?.mode;
  const carved = s.frontier.alterations[`${address}/${d.floor}`]?.dug.length ?? 0;
  const floor = useMemo(() => fieldFloor(s), [address, d.floor, setting, carved]);
  const layout = useMemo(() => ruinLayout(s.location, d.floor), [address, d.floor]);
  const fixture =
    d.cell === layout.device ? 'device' : d.cell === layout.inscription ? 'inscription' : null;
  const battle = d.encounter;
  const manual = Boolean(battle?.tactics);
  const [picked, setPicked] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sheet, setSheet] = useState<'actions' | 'map' | 'supplies' | 'techniques' | 'tutorial' | null>(null);
  const [introSeen, setIntroSeen] = useState(readCombatIntro);
  const combatOpen = !!battle;
  const ending = Boolean(cue?.ending);
  const tutorial = combatOpen && (!introSeen || sheet === 'tutorial') && !ending && !modalOpen;
  const blocked = modalOpen || sheet !== null || tutorial || (combatOpen && !introSeen) || ending;
  const validTarget = (index: number) => {
    if (!battle || (battle.enemies[index]?.hp ?? 0) <= 0) return false;
    return !battle.tactics || (index !== borrowedCreature(battle) &&
      glancingSight(floor, actionPosition(s), battle.tactics.cells[index], 6));
  };
  const target = validTarget(picked) ? picked
    : Math.max(0, battle?.enemies.findIndex((_, index) => validTarget(index)) ?? 0);
  useEffect(() => {
    setPicked(0);
    setPaused(false);
  }, [battle?.cell, battle?.bound]);
  useEffect(() => setSheet(null), [d.floor, d.cell, combatOpen]);
  useEffect(() => {
    if (!combatOpen) return;
    for (const effect of BATTLE_ART) {
      const image = new Image();
      image.src = art('combat/' + effect);
    }
  }, [combatOpen]);
  useEffect(() => {
    if (!battle || manual || blocked || paused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') send({ type: 'auto-combat', target });
    }, 850);
    return () => window.clearInterval(timer);
  }, [battle, manual, blocked, paused, target, send]);
  useEffect(() => {
    if (battle || blocked) return;
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
  }, [battle, blocked, send]);
  const town = townAt(s.location);
  const biome = BIOMES[town.biome];
  const condition = ruinCondition(s.location, d.floor);
  const expedition = s.journey.expedition;
  const explore = battle ? null : explorationChoices(s, floor);
  const auto = !battle && plannedWalk(s).length > 0;
  const actionLabel = t(
    battle
      ? ['戦闘メニュー', 'Battle options', 'せんとう メニュー']
      : ['探索メニュー', 'Explore options', 'たんさく メニュー'],
  );
  const mapLabel = t(['見取り図', 'Automap', 'みとりず']);
  const kitLabel = t(['道具と能力', 'Supplies and powers', 'どうぐと のうりょく']);
  const techniquesLabel = t(TECHNIQUES_TITLE);
  const groundTitle =
    fixture === 'device'
      ? MECHANISMS[town.biome].name
      : fixture === 'inscription'
        ? historyTitle(s.location)
        : explore?.location;
  const declareFromMenu = () => {
    setSheet(null);
    declare();
  };
  const move = (direction: DelveMove) => send({ type: 'move', direction });
  const interact = (option: NonNullable<typeof explore>['options'][number]) =>
    send({ type: 'feature', verb: option.verb, symbol: option.symbol });

  return (
    <div className="sa-delve" data-mode={manual ? 'tactical' : battle ? 'battle' : 'explore'} inert={ending || undefined}>
      <header className="sa-delve-head">
        <h1>
          {t(biome.ruin)} <strong>B{d.floor}</strong>
        </h1>
        <div className="sa-delve-tools">
          <button
            type="button"
            className="sa-lamp"
            aria-label={t(GOODS.lantern.name) + ' ×' + s.goods.lantern}
            title={t(['灯油を補充', 'Refill the lamp', 'あぶらを たす'])}
            disabled={!s.goods.lantern || d.light >= 14}
            onClick={() => send({ type: 'use', good: 'lantern' })}
          >
            <Flame size={16} />
            <span>{d.light}</span>
          </button>
          <button
            type="button"
            onClick={() => setSheet('supplies')}
            aria-label={kitLabel}
            title={kitLabel}
          >
            <Backpack size={17} />
          </button>
          <button
            type="button"
            aria-label={mapLabel}
            title={mapLabel}
            onClick={() => setSheet('map')}
          >
            <Map size={17} />
          </button>
          {!battle && (
            <button
              type="button"
              aria-label={t(['地上へ戻る', 'Return to town', 'ちじょうへ もどる'])}
              title={t(['地上へ戻る', 'Return to town', 'ちじょうへ もどる'])}
              onClick={() => send({ type: 'leave-delve' })}
            >
              <ArrowUpToLine size={17} />
            </button>
          )}
        </div>
      </header>
      <div className="sa-delve-view">
        {manual ? (
          <TacticalView
            s={s}
            floor={floor}
            t={t}
            target={target}
            select={setPicked}
            send={send}
            modalOpen={blocked}
            cue={cue}
          />
        ) : (
          <DungeonScene
            s={s}
            floor={floor}
            t={t}
            target={target}
            select={setPicked}
            fixture={fixture}
            cue={cue}
          />
        )}
        {!battle && (
          <aside className="sa-delve-overview" aria-hidden="true">
            <LabyrinthMap s={s} floor={floor} t={t} layout={layout} />
          </aside>
        )}
      </div>

      {!battle && (
        <div className="sa-delve-movement">
          <div
            className="sa-dpad"
            role="group"
            aria-label={t(['移動操作', 'Movement controls', 'いどう そうさ'])}
          >
            <button
              className="sa-step-front"
              type="button"
              disabled={delveDestination(s, floor) < 0}
              aria-label={t(['前進', 'Step forward', 'ぜんしん'])}
              onClick={() => move('forward')}
            >
              <ArrowUp size={22} />
            </button>
            <button
              className="sa-turn-left"
              type="button"
              aria-label={t(['左を向く', 'Turn left', 'ひだりを むく'])}
              onClick={() => move('left')}
            >
              <RotateCcw size={20} />
            </button>
            <button
              className="sa-turn-right"
              type="button"
              aria-label={t(['右を向く', 'Turn right', 'みぎを むく'])}
              onClick={() => move('right')}
            >
              <RotateCw size={20} />
            </button>
            <button
              className="sa-step-back"
              type="button"
              disabled={delveDestination(s, floor, true) < 0}
              aria-label={t(['後退', 'Step backward', 'こうたい'])}
              onClick={() => move('backward')}
            >
              <ArrowDown size={22} />
            </button>
          </div>
        </div>
      )}

      <section
        className="sa-delve-actions"
        aria-label={t(
          battle ? ['戦闘操作', 'Battle controls'] : ['探索操作', 'Exploration controls'],
        )}
      >
        {battle ? (
          <>
            {manual && (
              <>
                <TacticalTarget s={s} t={t} target={target} floor={floor} send={send} />
                <TacticalMoves s={s} t={t} target={target} floor={floor} send={send} />
              </>
            )}
            <div className="sa-delve-quick">
              {!manual && (
                <button
                  type="button"
                  aria-pressed={paused}
                  onClick={() => setPaused((value) => !value)}
                >
                  {paused
                    ? t(['戦闘を再開', 'Resume combat', 'せんとうを さいかい'])
                    : t(['一時停止', 'Pause', 'いちじていし'])}
                </button>
              )}
              <button type="button" onClick={() => setSheet('techniques')}>
                <Swords size={16} />
                {techniquesLabel}
              </button>
              <button type="button" onClick={() => setSheet('actions')}>
                <List size={16} />
                {actionLabel}
              </button>
            </div>
          </>
        ) : (
          <>
            {fixture ? (
              <button className="sa-primary" type="button" onClick={() => setSheet('actions')}>
                {t(
                  fixture === 'device'
                    ? ['仕掛けを見る', 'Examine mechanism', 'しかけを みる']
                    : ['刻印を見る', 'Examine inscription', 'こくいんを みる'],
                )}
              </button>
            ) : explore?.preferred ? (
              <button
                className="sa-primary"
                type="button"
                onClick={() => interact(explore.preferred!)}
              >
                {t(explore.preferred.name)}
              </button>
            ) : (
              <button type="button" disabled={!auto} onClick={() => send({ type: 'auto-walk' })}>
                <Footprints size={17} />
                {t(['自動探索', 'Auto-explore', 'じどう たんさく'])}
              </button>
            )}
            <button type="button" onClick={() => setSheet('actions')}>
              <List size={16} />
              {actionLabel}
            </button>
          </>
        )}
      </section>

      {tutorial && (
        <BattleTutorial manual={manual} t={t} close={() => {
          rememberCombatIntro();
          setIntroSeen(true);
          setSheet(null);
        }} />
      )}
      {sheet && sheet !== 'tutorial' && !tutorial && !ending && (
        <ScreenDialog
          title={sheet === 'map' ? mapLabel : sheet === 'supplies' ? kitLabel : sheet === 'techniques' ? techniquesLabel : actionLabel}
          t={t}
          close={() => setSheet(null)}
        >
          {sheet === 'map' ? (
            <div className="sa-delve-map-detail">
              <LabyrinthMap s={s} floor={floor} t={t} layout={layout} />
              <div className="sa-stack">
                <span>
                  {t(town.name)} · {t(groundTitle ?? biome.ruin)}
                </span>
                <span className="sa-gold">
                  {t(DIRECTIONS[d.direction])} · {t(['灯り', 'Light', 'あかり'])} {d.light}
                </span>
                <FieldStatus s={s} t={t} />
                {d.floor > 1 && (
                  <p>
                    <strong>{t(condition.name)}</strong> · {t(condition.hint)}
                  </p>
                )}
                {setting && (
                  <p>
                    <strong>{t(MECHANISMS[town.biome].name)}</strong> ·{' '}
                    {t(MECHANISMS[town.biome][setting].name)}
                  </p>
                )}
                {expedition && atSource(s, expedition) && expedition.stage === 'task' && (
                  <ExpeditionProgress s={s} e={expedition} t={t} />
                )}
              </div>
            </div>
          ) : sheet === 'supplies' ? (
            <div className="sa-stack">
              <Supplies state={s} t={t} send={send} />
              <FieldSupplies
                s={s}
                t={t}
                send={send}
                target={battle?.tactics?.cells[target]}
                foe={battle?.tactics ? target : undefined}
              />
            </div>
          ) : sheet === 'techniques' ? (
            <BattleTechniqueMenu s={s} t={t} floor={manual ? floor : undefined} send={send}
              target={target} close={() => setSheet(null)} />
          ) : battle ? (
            <div className="sa-stack">
              <h3>
                {t(['仲間', 'Party', 'なかま'])} · {s.followers.length + 1}/{MAX_PARTY_SIZE}
              </h3>
              <CombatParty s={s} t={t} />
              <div className="sa-inline">
                {!manual && (
                  <button
                    type="button"
                    onClick={() => send({ type: 'combat', move: 'parley', target })}
                  >
                    {t(['交渉する', 'Parley', 'こうしょうする'])}
                  </button>
                )}
                {!manual &&
                  !battle.guardian &&
                  (battle.enemies[target]?.epithets || fieldSkill(s, 'diplomacy')) && (
                    <button
                      type="button"
                      disabled={
                        s.frontier.liquids.water < 2 || s.followers.length >= MAX_PARTY_SIZE - 1
                      }
                      onClick={() => send({ type: 'combat', move: 'befriend', target })}
                    >
                      {t(['水で勧誘する', 'Offer water and recruit', 'みずで さそう'])}
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => send({ type: 'combat', move: 'retreat', target })}
                >
                  {t(['退却を試みる', 'Try to retreat', 'たいきゃくを こころみる'])}
                </button>
                <button type="button" onClick={declareFromMenu}>
                  <Sparkles size={16} />
                  {t(['自由宣言', 'Declare', 'じゆうせんげん'])}
                </button>
                <button type="button" onClick={() => setSheet('tutorial')}>
                  <BookOpen size={16} />
                  {t(['戦い方', 'Combat tutorial', 'たたかいかた'])}
                </button>
              </div>
              <FormationChoice s={s} t={t} send={send} />
            </div>
          ) : (
            <div className="sa-stack">
              {fixture ? (
                <RuinFixture
                  s={s}
                  t={t}
                  send={send}
                  fixture={fixture}
                  shortcut={layout.shortcut >= 0}
                  declare={declareFromMenu}
                />
              ) : (
                <section className="sa-find">
                  <h3>{t(explore!.location)}</h3>
                  {explore!.hint && <p className="sa-hint">{t(explore!.hint)}</p>}
                  <div className="sa-inline">
                    {explore!.options.map((option) => (
                      <button
                        key={option.verb + (option.symbol ?? '')}
                        className={option.primary ? 'sa-primary' : undefined}
                        type="button"
                        onClick={() => interact(option)}
                      >
                        {t(option.name)}
                      </button>
                    ))}
                    <button type="button" onClick={declareFromMenu}>
                      <Sparkles size={16} />
                      {t(['自由宣言', 'Declare an action', 'じゆうせんげん'])}
                    </button>
                  </div>
                </section>
              )}
              <div className="sa-inline">
                <button type="button" disabled={!auto} onClick={() => send({ type: 'auto-walk' })}>
                  {t(['未踏の道を探す', 'Auto-explore', 'まだの みちを さがす'])}
                </button>
                <button
                  type="button"
                  disabled={!plannedWalk(s, ENTRY_CELL).length}
                  onClick={() => send({ type: 'auto-walk', target: ENTRY_CELL })}
                >
                  {t(['入口への道をたどる', 'Follow the way back', 'いりぐちへ もどる'])}
                </button>
              </div>
            </div>
          )}
        </ScreenDialog>
      )}
    </div>
  );
}

function CombatParty({ s, t }: { s: Adventure; t: Local }) {
  const battle = s.delve!.encounter!;
  return (
    <div
      className="sa-combat-party"
      aria-label={t(['戦闘中の仲間', 'Combat party', 'せんとうちゅうの なかま'])}
    >
      <article>
        <Portrait id={s.character.portrait} />
        <span>
          <strong>{s.character.name}</strong>
          <small>
            HP {s.hp}/{maxHp(s)}
          </small>
          <progress value={s.hp} max={maxHp(s)} aria-label={s.character.name + ' HP'} />
        </span>
      </article>
      {(battle.allies ?? formParty(s)).map((ally) => {
        const { resident } = s.friends[ally.id];
        const name = t(resident.name);
        return (
          <article key={ally.id} data-down={ally.hp <= 0 || undefined}>
            <ResidentPortrait role={resident.role} />
            <span>
              <strong>{name}</strong>
              <small>
                {ally.hp <= 0
                  ? t(['戦闘不能', 'Knocked out', 'せんとうふのう'])
                  : 'HP ' + ally.hp + '/' + ally.max}
              </small>
              <progress value={ally.hp} max={ally.max} aria-label={name + ' HP'} />
            </span>
          </article>
        );
      })}
    </div>
  );
}
