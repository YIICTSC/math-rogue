import React, { useState } from 'react';
import ScreenDialog from './ScreenDialog';
import PanelNavigation from './PanelNavigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Compass,
  DoorOpen,
  Hammer,
  Home,
  Leaf,
  MapPin,
  Moon,
  MoveUpRight,
  Sparkles,
  Sun,
  Utensils,
} from 'lucide-react';
import {
  BIOMES,
  COMPANION_ROLES,
  GOODS,
  GOOD_IDS,
  MASTERWORKS,
  RECIPES,
  RESIDENT_ROLES,
  SLOT_NAMES,
  STATS,
  type Goods,
  type Text,
} from './content';
import {
  ACTIVITIES,
  INN_MEAL_PRICE,
  activityHours,
  canActivity,
  canEat,
  canClaimMission,
  equipmentCost,
  homePrice,
  marketPrice,
  missionProgress,
  nextHarvest,
  ownDwelling,
  knowsMeal,
  residentStory,
  travelHours,
} from './life';
import { BLUEPRINT_IDS, BUILDINGS, HOUSE_MATERIALS, IMPROVEMENTS, MAX_HOME_LEVEL, blueprint, hasImprovement } from './building';
import { FACTIONS, favorAvailable, residentFaction, standing, standingName } from './factions';
import type { FieldView } from './FrontierPanel';
import { FOLLOWER_ORDERS, type FollowerOrder } from './frontierContent';
import { ROUTE_BY_ID, seasonAt } from './journeyContent';
import { regionalMastery } from './journeyState';
import { MEAL_IDS, mealRecipe } from './provisions';
import { gearName, SLOT_IDS } from './inventory';
import { MAX_PARTY_SIZE, affordable, freshWorldCode, hungerPenalty, worldCode, type Adventure, type LifeActivity } from './state';
import {
  DIRECTIONS,
  addressKey,
  atOffset,
  dayAt,
  isNight,
  missionsAt,
  realmName,
  residentRoutine,
  residentsAt,
  roadBetween,
  sameAddress,
  townArt,
  townAt,
  type Address,
  type Mission,
} from './world';
import { BOONS, TALES } from './tales';
import { art, FormationChoice, ResidentPortrait, type Local, type Send } from './ui';

type PanelProps = { state: Adventure; send: Send; t: Local };
const directionIcons = [ArrowUp, ArrowRight, ArrowDown, ArrowLeft];

function missionSummary(mission: Mission, t: Local) {
  const name = t(townAt(mission.target).name);
  switch (mission.kind) {
    case 'supply':
    case 'craft':
      return (
        t([name + 'に品物を届ける', 'Bring supplies to ' + name]) +
        ' · ' +
        t(GOODS[mission.good!].name) +
        ' ×' +
        mission.goal
      );
    case 'delivery':
      return t([name + 'へ向かう', 'Travel to ' + name]);
    case 'service':
      return (
        t(['この町で仕事・手伝いをする', 'Work or assist a resident here']) + ' ×' + mission.goal
      );
    case 'survey':
      return (
        t(['地下1階の見取り図を作る', 'Map the first floor']) +
        ' · ' +
        mission.goal +
        ' ' +
        t(['マス', 'tiles'])
      );
    case 'guardian':
      return (
        t(['守護者を越えて通行の証を得る', 'Earn passage beyond the guardian']) +
        ' · ' +
        t(['地下', 'Floor ']) +
        mission.depth +
        t(['階', ''])
      );
  }
}

export function Commission({ state: s, send, t }: PanelProps) {
  const active = s.mission;
  const orders = missionsAt(s.location, s.time).filter(
    (mission) => !s.fulfilled.includes(mission.id),
  );
  return (
    <section className="sa-panel sa-commission">
      <div className="sa-section-row">
        <h2>
          <BookOpen size={18} />
          {t(['依頼掲示板', 'Commissions', 'いらいけいじばん'])}
        </h2>
      </div>
      {active ? (
        <div className="sa-order sa-order-active">
          <strong>{t(active.title)}</strong>
          <p>{missionSummary(active, t)}</p>
          <div className="sa-section-row">
            <b className="sa-gold">
              {Math.min(missionProgress(s, active), active.goal)} / {active.goal}
            </b>
            <span>{active.reward} G</span>
          </div>
          <div className="sa-inline">
            <button
              className="sa-primary"
              type="button"
              disabled={!canClaimMission(s, active)}
              onClick={() => send({ type: 'claim-mission' })}
            >
              {t(['報酬を受け取る', 'Collect reward'])}
            </button>
            <button type="button" onClick={() => send({ type: 'cancel-mission' })}>
              {t(['依頼を返す', 'Drop commission'])}
            </button>
          </div>
        </div>
      ) : (
        <div className="sa-orders">
          {orders.map((mission) => (
            <article className="sa-order" key={mission.id}>
              <div>
                <strong>{t(mission.title)}</strong>
                <p>{missionSummary(mission, t)}</p>
              </div>
              <button
                type="button"
                aria-label={t(['引き受ける', 'Accept']) + ' · ' + t(mission.title)}
                onClick={() => send({ type: 'mission', id: mission.id })}
              >
                {mission.reward} G <MoveUpRight size={14} />
              </button>
            </article>
          ))}
          {!orders.length && (
            <p className="sa-hint">
              {t(['今日の依頼は完了しました。', 'Today’s commissions are complete.'])}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export function TownOverview({
  state: s,
  send,
  t,
  declare,
  showMap,
  showRoutes,
  showField,
}: PanelProps & {
  declare: () => void;
  showMap: () => void;
  showRoutes: () => void;
  showField: (view: FieldView) => void;
}) {
  const town = townAt(s.location),
    biome = BIOMES[town.biome];
  const deep = s.deepest[addressKey(s.location)] ?? 0;
  const key = addressKey(s.location);
  const seenLandmark = s.exploredLandmarks[key];
  const tale = TALES[town.biome];
  const taleRecord = s.townTales[key];
  const season = seasonAt(s.time);
  const expedition = s.journey.expedition;
  const [panel, setPanel] = useState<'landmark' | 'commissions' | null>(null);
  const ruinTitle = t(biome.ruin);
  return (
    <div className="sa-town-hub">
      <section className="sa-town-banner" data-night={isNight(s.time) || undefined}>
        <img src={art(townArt(s.location))} alt="" decoding="async" />
        <div>
          <span>
            {t(realmName(s.location.world))} · {t(biome.name)}
          </span>
          <h1>{t(town.name)}</h1>
          <span className="sa-town-season">
            <Leaf size={14} />
            {t(season.name)}
          </span>
        </div>
      </section>
      <section
        className="sa-town-hub-actions"
        aria-label={t(['町からできること', 'Town activities', 'まちで できること'])}
      >
        <button
          className="sa-primary"
          type="button"
          onClick={() => send({ type: 'enter' })}
          title={ruinTitle}
        >
          <DoorOpen size={19} />
          {t(['遺跡へ入る', 'Enter the ruins', 'いせきへ はいる'])}
        </button>
        <button type="button" onClick={showMap}>
          <Compass size={19} />
          {t(['街道を行く', 'Take the road', 'かいどうを いく'])}
        </button>
        {deep > 0 && (
          <button type="button" onClick={() => send({ type: 'enter', floor: deep + 1 })}>
            <DoorOpen size={19} />
            {t(['開通済みの階段', 'Cleared stairwell', 'かいつうずみの かいだん'])} B{deep + 1}
          </button>
        )}
        <button
          type="button"
          className="sa-town-expedition"
          onClick={showRoutes}
          title={expedition ? t(ROUTE_BY_ID[expedition.id].name) : undefined}
        >
          <Compass size={19} />
          {t(['遠征掲示板', 'Expedition board', 'えんせい けいじばん'])}
          {expedition && (
            <span
              className="sa-active-dot"
              aria-label={t(['進行中', 'In progress', 'しんこうちゅう'])}
            />
          )}
        </button>
        <button type="button" className="sa-town-field" onClick={() => showField('sites')}>
          <BookOpen size={19} />
          {t(['史跡へ行く', 'Explore historic sites', 'しせきへ いく'])}
        </button>
        <button type="button" onClick={() => setPanel('commissions')}>
          <BookOpen size={19} />
          {t(['依頼掲示板', 'Commissions', 'いらいけいじばん'])}
          {s.mission && (
            <span
              className="sa-active-dot"
              aria-label={t(['進行中', 'In progress', 'しんこうちゅう'])}
            />
          )}
        </button>
        <button type="button" onClick={() => setPanel('landmark')}>
          <MapPin size={19} />
          {t(['町の名所と物語', 'Town sights and story', 'まちの めいしょと ものがたり'])}
        </button>
        <button type="button" onClick={declare}>
          <Sparkles size={19} />
          {t(['自由宣言', 'Declare an action', 'じゆうせんげん'])}
        </button>
      </section>
      {panel && (
        <ScreenDialog
          title={
            panel === 'commissions'
              ? t(['依頼掲示板', 'Commissions', 'いらいけいじばん'])
              : t(town.name)
          }
          t={t}
          close={() => setPanel(null)}
        >
          {panel === 'commissions' ? (
            <Commission state={s} send={send} t={t} />
          ) : (
            <div className="sa-stack">
              <p>{t(town.lead)}</p>
              <p className="sa-hint">
                {t(season.name)} · {t(season.hint)}
              </p>
              <section className="sa-panel sa-landmark">
                <div>
                  <span className="sa-hint">{t(['町の名所', 'Local landmark'])}</span>
                  <h2>{t(town.landmark)}</h2>
                </div>
                <button
                  type="button"
                  disabled={seenLandmark}
                  onClick={() => send({ type: 'life', activity: 'survey' })}
                >
                  <MapPin size={16} />
                  {seenLandmark ? t(['発見済み', 'Discovered']) : t(['調べる', 'Survey'])}
                </button>
              </section>
              <section className="sa-panel sa-tale">
                <h2>{t(tale.name)}</h2>
                {taleRecord?.boon ? (
                  <>
                    <p>
                      {t(
                        tale.options.find((option) => option.boon === taleRecord.boon)!.resolution,
                      )}
                    </p>
                    <p className="sa-gold">
                      {t(BOONS[taleRecord.boon].name)} · {t(BOONS[taleRecord.boon].benefit)}
                    </p>
                  </>
                ) : (
                  <>
                    <p>{t(tale.opening)}</p>
                    <div className="sa-action-list">
                      {tale.options.map((option, index) => (
                        <button
                          type="button"
                          key={option.boon}
                          disabled={taleRecord?.day === dayAt(s.time)}
                          onClick={() => send({ type: 'tale', option: index })}
                        >
                          <span>{t(option.choice)}</span>
                          <small>{t(BOONS[option.boon].name)}</small>
                        </button>
                      ))}
                    </div>
                    {taleRecord?.day === dayAt(s.time) && (
                      <p className="sa-hint">
                        {t(['明日、また取り組めます。', 'You can try again tomorrow.'])}
                      </p>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </ScreenDialog>
      )}
    </div>
  );
}

export function WorldMap({ state: s, send, t }: PanelProps) {
  const [code, setCode] = useState('');
  const [detail, setDetail] = useState<Address | null>(null);
  const [mark, setMark] = useState('');
  const [panel, setPanel] = useState<'roads' | 'realms' | null>(null);
  const location = s.location;
  const expedition = s.journey.expedition;
  const target =
    expedition && (expedition.stage === 'scout' ? expedition.station : expedition.source);
  const targetNearby =
    target?.world === location.world &&
    Math.abs(target.x - location.x) + Math.abs(target.y - location.y) <= 1;
  const cells = Array.from({ length: 25 }, (_, index) => ({
    world: location.world,
    x: location.x + (index % 5) - 2,
    y: location.y + Math.floor(index / 5) - 2,
  }));
  const selected = detail?.world === location.world ? detail : targetNearby ? target : location;
  const town = townAt(selected);
  const selectedKey = addressKey(selected);
  const rumor = s.frontier.rumors[selectedKey];
  const observed = s.knownTowns[selectedKey];
  const rumors = Object.values(s.frontier.rumors).filter((place) => place.world === location.world);
  const direction = DIRECTIONS.findIndex((_, index) =>
    sameAddress(atOffset(location, index), selected),
  );
  const gate = worldCode(code);
  const ownWorld = realmName(location.world);
  const currentRealmTownCount = Object.values(s.knownTowns).filter(
    (place) => place.world === location.world,
  ).length;
  return (
    <div className="sa-travel-screen">
      <section className="sa-panel sa-map-board">
        <div className="sa-section-row">
          <h1>
            <Compass size={22} />
            {t(ownWorld)}
          </h1>
          <span className="sa-gold">
            {t(['訪れた町', 'Towns visited'])} {currentRealmTownCount}
          </span>
        </div>
        <div className="sa-atlas" role="group" aria-label={t(['世界地図', 'World map'])}>
          {cells.map((cell) => {
            const key = addressKey(cell);
            const here = sameAddress(cell, location);
            const rumored = Boolean(s.frontier.rumors[key]);
            const known = here || Boolean(s.knownTowns[key]) || rumored;
            const near = Math.abs(cell.x - location.x) + Math.abs(cell.y - location.y) === 1;
            const place = townAt(cell);
            const marked = target && sameAddress(target, cell) && (known || near);
            const researched = Boolean(s.fieldwork.histories[key]);
            const label =
              (marked
                ? t(['遠征の目的地', 'Expedition destination', 'えんせいの もくてきち']) + ' · '
                : '') +
              t(place.name) +
              ' · ' +
              cell.x +
              ', ' +
              cell.y +
              (researched
                ? ' · ' + t(['刻印を発見済み', 'Inscriptions found', 'こくいんを はっけんずみ'])
                : '');
            return (
              <button
                type="button"
                key={key}
                className="sa-map-tile"
                data-known={known || near || undefined}
                data-biome={known || near ? place.biome : undefined}
                data-here={here || undefined}
                data-expedition={marked || undefined}
                data-surveyed={researched || undefined}
                data-rumored={rumored || undefined}
                aria-pressed={sameAddress(selected, cell)}
                disabled={!known && !near}
                aria-label={known || near ? label : t(['未踏', 'Uncharted'])}
                onClick={() => {
                  setDetail(cell);
                  setMark(s.frontier.marks[key]?.label ?? '');
                }}
              >
                {here ? (
                  <MapPin size={18} />
                ) : known || near ? (
                  <span>
                    {marked ? (
                      <Compass size={12} aria-hidden="true" />
                    ) : s.frontier.marks[key] ? (
                      <MapPin size={12} aria-hidden="true" />
                    ) : researched || rumored ? (
                      <BookOpen size={12} aria-hidden="true" />
                    ) : null}
                    {t(place.name)}
                  </span>
                ) : (
                  <span aria-hidden="true">·</span>
                )}
                {(here || near) && (
                  <small>
                    {cell.x}, {cell.y}
                  </small>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <section className="sa-panel sa-travel-actions">
        <div className="sa-atlas-place">
          <div className="sa-atlas-visit">
            <strong>
              {t(town.name)} · {selected.x}, {selected.y}
            </strong>
            <small>
              {t(FACTIONS[town.biome].name)} · {t(standingName(standing(s, town.biome)))}
            </small>
            {s.frontier.marks[selectedKey] && <small>{s.frontier.marks[selectedKey].label}</small>}
          </div>
          {direction >= 0 ? (
            <button
              type="button"
              className="sa-primary"
              onClick={() => {
                if (send({ type: 'travel', direction })) setDetail(null);
              }}
            >
              {t(['ここへ向かう', 'Travel here'])} · {travelHours(s, selected)}h
            </button>
          ) : (
            <span>
              {sameAddress(selected, location)
                ? t(['現在地', 'You are here'])
                : t(['街道をたどって移動', 'Follow the roads to reach it'])}
            </span>
          )}
        </div>
        <div className="sa-inline">
          <button type="button" onClick={() => setPanel('roads')}>
            {t(['街道と目印', 'Roads and notes', 'かいどうと めじるし'])}
          </button>
          <button type="button" onClick={() => setPanel('realms')}>
            {t(['別の世界へ', 'Cross into another realm', 'べつの せかいへ'])}
          </button>
        </div>
      </section>
      {panel && (
        <ScreenDialog
          title={t(
            panel === 'roads'
              ? ['街道と目印', 'Roads and notes', 'かいどうと めじるし']
              : ['別の世界へ', 'Cross into another realm', 'べつの せかいへ'],
          )}
          t={t}
          close={() => setPanel(null)}
        >
          {panel === 'roads' ? (
            <div className="sa-stack">
              {(observed || rumor) && (
                <form
                  className="sa-inline sa-map-mark"
                  onSubmit={(event) => {
                    event.preventDefault();
                    send({
                      type: 'field',
                      operation: { kind: 'mark', place: selected, label: mark },
                    });
                  }}
                >
                  <label className="sa-field">
                    <span>{t(['地図にメモ', 'Map note', 'ちずに メモ'])}</span>
                    <input
                      value={mark}
                      maxLength={42}
                      onChange={(event) => setMark(event.target.value)}
                    />
                  </label>
                  <button type="submit" disabled={!mark.trim() && !s.frontier.marks[selectedKey]}>
                    {t(['記録する', 'Save map note', 'きろくする'])}
                  </button>
                </form>
              )}
              {rumors.length > 0 && (
                <label className="sa-field sa-rumor-list">
                  <span>{t(['聞き取った史跡', 'Historic site leads', 'きいた しせき'])}</span>
                  <select
                    value={rumor ? selectedKey : ''}
                    onChange={(event) => {
                      const next = s.frontier.rumors[event.target.value];
                      setDetail(next ?? null);
                      setMark(next ? (s.frontier.marks[addressKey(next)]?.label ?? '') : '');
                    }}
                  >
                    <option value="">
                      {t(['行き先を選ぶ', 'Choose a destination', 'いきさきを えらぶ'])}
                    </option>
                    {rumors.map((place) => (
                      <option key={addressKey(place)} value={addressKey(place)}>
                        {t(townAt(place).name)} · {place.x}, {place.y}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="sa-road-list">
                {directionIcons.map((Icon, index) => {
                  const destination = atOffset(location, index);
                  const next = townAt(destination),
                    road = roadBetween(location, destination);
                  return (
                    <button
                      type="button"
                      key={index}
                      onClick={() => {
                        if (send({ type: 'travel', direction: index })) {
                          setDetail(null);
                          setPanel(null);
                        }
                      }}
                    >
                      <Icon size={16} />
                      <span>
                        {t(DIRECTIONS[index])} · {t(next.name)}
                        <small>
                          {t(road.name)} · {travelHours(s, destination)}h
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="sa-stack">
              <p className="sa-hint">
                {t([
                  '世界コードで新しい世界を開きます。同じコードへ戻ると、以前の旅の記録が残っています。',
                  'Open a realm with a world code. Return to the same code to find your previous discoveries.',
                ])}
              </p>
              <div className="sa-inline">
                <label className="sa-field">
                  <span>{t(['世界コード', 'World code'])}</span>
                  <input
                    value={code}
                    maxLength={28}
                    onChange={(event) => setCode(event.target.value)}
                    autoComplete="off"
                    placeholder={t(['例・星雲の海', 'e.g. star-sea'])}
                  />
                </label>
                <button type="button" onClick={() => setCode(freshWorldCode())}>
                  {t(['生成', 'Generate'])}
                </button>
                <button
                  className="sa-primary"
                  type="button"
                  disabled={!gate || gate === s.location.world}
                  onClick={() => {
                    if (send({ type: 'gate', world: gate })) {
                      setCode('');
                      setDetail(null);
                    }
                  }}
                >
                  {t(['渡る', 'Cross'])}
                </button>
              </div>
              <div className="sa-world-list">
                {!sameAddress(s.location, s.homeGate) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (send({ type: 'return-home' })) setDetail(null);
                    }}
                  >
                    <strong>{t(['本拠地へ帰る', 'Return to your home base'])}</strong>
                    <small>{t(townAt(s.homeGate).name)}</small>
                  </button>
                )}
                {Object.entries(s.gates)
                  .filter(([world]) => world !== s.location.world)
                  .map(([world, arrival]) => (
                    <button
                      type="button"
                      key={world}
                      onClick={() => {
                        if (send({ type: 'gate', world })) setDetail(null);
                      }}
                    >
                      <strong>{t(realmName(world))}</strong>
                      <small>
                        {world} · {t(townAt(arrival).name)}
                      </small>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </ScreenDialog>
      )}
    </div>
  );
}

const WORK_ICONS = {
  work: Hammer,
  gather: Leaf,
  fish: Leaf,
  practice: BookOpen,
  performance: Sparkles,
  forage: Leaf,
} as const;
const costList = (cost: Partial<Goods>, t: Local) =>
  GOOD_IDS.flatMap((good) => (cost[good] ? [t(GOODS[good].name) + ' ×' + cost[good]] : [])).join(
    ' · ',
  );

function WorkshopBlueprints({ state: s, send, t }: PanelProps) {
  const categories = [
    ['weapon', ['武器の製作', 'Weapons', 'ぶきの せいさく']],
    ['coat', ['防具の製作', 'Armor', 'ぼうぐの せいさく']],
    ['charm', ['護符の製作', 'Charms', 'ごふの せいさく']],
    ['supply', ['料理と道具', 'Meals and supplies', 'りょうりと どうぐ']],
  ] as const;
  return <div className="sa-blueprints">
    {categories.map(([category, label]) => (
      <details key={category} open={category === 'supply' || undefined}>
        <summary>{t(label)}</summary>
        <div className="sa-action-list">
          {BLUEPRINT_IDS.filter((id) => {
            const output = blueprint(id).output;
            return ('slot' in output ? output.slot : 'supply') === category;
          }).map((id) => {
            const plan = blueprint(id);
            const missing = plan.requires && !hasImprovement(s, plan.requires) ? plan.requires : null;
            const needMastery = plan.mastery && regionalMastery(s, plan.mastery) < 2;
            const masterwork = 'masterwork' in plan.output && plan.output.masterwork && MASTERWORKS[plan.output.masterwork];
            return <button type="button" key={id} disabled={Boolean(missing || needMastery) || !affordable(s, plan.cost)}
              onClick={() => send({ type: 'fabricate', recipe: id })}>
              {masterwork && <img className="sa-blueprint-art" src={art('expedition/' + masterwork.art)} alt="" loading="lazy" />}
              <span>{t(plan.name)}{masterwork && <small>{t(masterwork.hint)}</small>}{missing && <small>{t(BUILDINGS[missing].name)}</small>}
                {needMastery && plan.mastery && <small>{t(BIOMES[plan.mastery].name)} · {t(['遠征2種類を報告', 'Complete two distinct routes', 'えんせい 2しゅるいを ほうこく'])}</small>}
              </span>
              <small>{costList(plan.cost, t)} · {plan.hours}h</small>
            </button>;
          })}
        </div>
      </details>
    ))}
  </div>;
}

function RegionalKitchen({ state: s, send, t }: PanelProps) {
  const dishes = MEAL_IDS.filter((id) => knowsMeal(s, id) || (s.journey.meals[id] ?? 0) > 0);
  const meal = s.journey.meal;
  const current = meal && meal.until > s.time ? mealRecipe(meal.id) : null;
  return (
    <div className="sa-kitchen">
      {meal && current && <p className="sa-meal-active"><Sparkles size={16} aria-hidden="true" />
        <span><strong>{t(current.name)} · {meal.until - s.time}h</strong><small>{t(current.benefit)}</small></span>
      </p>}
      <details className="sa-blueprints">
        <summary>{t(['郷土料理を作る', 'Cook regional dishes', 'ふるさとの りょうりを つくる'])} · {dishes.length}/{MEAL_IDS.length}</summary>
        <p className="sa-hint">{t(['旅先の町で覚えられます。地方の遠征を報告すると、その料理をどこでも作れます。', 'Learn dishes in local towns. Complete a region’s expedition to cook its dishes anywhere.', 'その ちほうの まちで おぼえます。えんせいを ほうこくすると どこでも つくれます。'])}</p>
        <div className="sa-dish-list">
          {dishes.map((id) => {
            const recipe = mealRecipe(id);
            const portions = s.journey.meals[id] ?? 0;
            return (
              <article key={id} className="sa-dish">
                <img src={art('expedition/' + id)} alt="" loading="lazy" />
                <div><strong>{t(recipe.name)} · ×{portions}</strong><small>{t(recipe.benefit)} · {recipe.hours}h</small><small>{costList(recipe.cost, t)}</small></div>
                <div className="sa-inline">
                  <button type="button" disabled={!knowsMeal(s, id) || portions >= 20 || !affordable(s, recipe.cost)} onClick={() => send({ type: 'cook-dish', id })}>{t(['作る', 'Cook', 'つくる'])} · 1h</button>
                  <button type="button" disabled={!portions || !canEat(s)} onClick={() => send({ type: 'eat-dish', id })}>{t(['食べる', 'Eat', 'たべる'])}</button>
                </div>
              </article>
            );
          })}
        </div>
      </details>
    </div>
  );
}

const LIFE_PANELS = {
  work: ['仕事', 'Work', 'しごと'],
  meals: ['食事', 'Meals', 'しょくじ'],
  home: ['住まい', 'Home', 'すまい'],
  market: ['市場', 'Market', 'いちば'],
  craft: ['工房', 'Workshop', 'こうぼう'],
} satisfies Record<string, Text>;

export function LifePanel({ state: s, send, t, lesson }: PanelProps & { lesson: () => void }) {
  const [panel, setPanel] = useState<keyof typeof LIFE_PANELS>('work');
  const home = ownDwelling(s);
  const harvest = nextHarvest(s);
  const days = dayAt(s.time);
  return (
    <div className="sa-workspace">
      <PanelNavigation
        labels={LIFE_PANELS}
        current={panel}
        select={setPanel}
        t={t}
        name={['暮らしの項目', 'Town life panels', 'くらしの こうもく']}
      />
      <div className="sa-workspace-body" key={panel}>
        {panel === 'work' && (
          <section className="sa-panel">
            <h2>
              <Sun size={19} />
              {t(['町で過ごす', 'Life in town', 'まちで すごす'])}
            </h2>
            <div className="sa-action-list">
              {(Object.keys(WORK_ICONS) as Array<keyof typeof WORK_ICONS>).map((activity) => {
                const { name, hours } = ACTIVITIES[activity];
                const Icon = WORK_ICONS[activity];
                return (
                  <button
                    type="button"
                    key={activity}
                    disabled={!canActivity(s, activity as LifeActivity)}
                    onClick={() => send({ type: 'life', activity })}
                  >
                    <Icon size={16} />
                    <span>{t(name)}</span>
                    <small>{activityHours(s, hours)}h</small>
                  </button>
                );
              })}
              <button type="button" disabled={s.inspirationLessonDay === days} onClick={lesson}>
                <BookOpen size={16} />
                <span>{t(['学園の復習', 'Review a lesson', 'がくえんの ふくしゅう'])}</span>
                <small>{t(['任意', 'Optional'])}</small>
              </button>
            </div>
          </section>
        )}
        {panel === 'meals' && (
          <section className="sa-panel">
            <h2>
              <Utensils size={19} /> {t(['食事', 'Meals', 'しょくじ'])}
            </h2>
            <p className="sa-hint">
              {t([
                '一日に一食。空腹が続くと体力と集中が減り、移動や判定に響きます。',
                'Eat once per day. Ongoing hunger drains HP and Focus, slows travel and makes checks harder.',
                'いちにち いっしょく。くうふくが つづくと たいりょくと しゅうちゅうが へります。',
              ])}
            </p>
            {hungerPenalty(s) > 0 && (
              <p className="sa-hunger" data-hungry="true">
                {t([
                  '空腹が解消するまで回復しづらい状態です。',
                  'Recovery is weaker until you eat.',
                  'たべるまで かいふくしづらい じょうたいです。',
                ])}
              </p>
            )}
            <div className="sa-action-list">
              <button
                type="button"
                disabled={!s.goods.ration || !canEat(s)}
                onClick={() => send({ type: 'use', good: 'ration' })}
              >
                <span>
                  {t(['携行する弁当を食べる', 'Eat a packed meal', 'おべんとうを たべる'])}
                </span>
                <small>×{s.goods.ration}</small>
              </button>
              <button
                type="button"
                disabled={s.gold < INN_MEAL_PRICE || !canEat(s)}
                onClick={() => send({ type: 'inn-meal' })}
              >
                <span>
                  {t([
                    '宿で温かい食事を取る',
                    'Get a hot meal at the inn',
                    'やどで あたたかい しょくじを とる',
                  ])}
                </span>
                <small>{INN_MEAL_PRICE} G · 1h</small>
              </button>
            </div>
            <RegionalKitchen state={s} send={send} t={t} />
          </section>
        )}
        {panel === 'home' && (
          <section className="sa-panel">
            <h2>
              <Home size={19} />
              {t(['住まいと庭', 'Home and garden', 'すまいと にわ'])}
            </h2>
            {home ? (
              <>
                <p>
                  {t(['作業場', 'Workshop'])} Lv. {home.level} · {t(['畑', 'Plots'])}{' '}
                  {home.planted.length}/{home.level * 2}
                </p>
                {home.planted.length > 0 && (
                  <p className="sa-hint">
                    {harvest
                      ? t(['収穫できる区画', 'Ready to harvest']) + ' ' + harvest
                      : t(['次の収穫まで', 'Next harvest in']) +
                        ' ' +
                        (Math.min(...home.planted) - s.time) +
                        'h'}
                  </p>
                )}
                <div className="sa-action-list">
                  <button type="button" onClick={() => send({ type: 'rest', rest: 'home' })}>
                    <Moon size={16} />
                    {t(['家で眠る', 'Sleep at home'])}
                  </button>
                  <button
                    type="button"
                    disabled={sameAddress(s.location, s.homeGate)}
                    onClick={() => send({ type: 'set-home' })}
                  >
                    <MapPin size={16} />
                    {sameAddress(s.location, s.homeGate)
                      ? t(['本拠地', 'Home base'])
                      : t(['ここを本拠地にする', 'Make this your home base'])}
                  </button>
                  <button
                    type="button"
                    disabled={!s.goods.seed || home.planted.length >= home.level * 2}
                    onClick={() => send({ type: 'build', mode: 'plant' })}
                  >
                    <Leaf size={16} />
                    {t(['種をまく', 'Plant seeds'])} · {t(GOODS.seed.name)} ×1
                  </button>
                  <button
                    type="button"
                    disabled={!harvest}
                    onClick={() => send({ type: 'build', mode: 'harvest' })}
                  >
                    <Leaf size={16} />
                    {t(['収穫する', 'Harvest'])}
                  </button>
                  <button
                    type="button"
                    disabled={
                      home.level >= MAX_HOME_LEVEL ||
                      s.gold < home.level * 24 ||
                      s.goods.timber < home.level * 2 ||
                      !s.goods.ore
                    }
                    onClick={() => send({ type: 'build', mode: 'upgrade' })}
                  >
                    <Hammer size={16} />
                    {t(['作業場を広げる', 'Upgrade workshop'])}
                    <small>
                      {home.level < MAX_HOME_LEVEL
                        ? home.level * 24 +
                          ' G · ' +
                          costList({ timber: home.level * 2, ore: 1 }, t)
                        : t(['最大', 'Max'])}
                    </small>
                  </button>
                </div>
                <details className="sa-blueprints" open>
                  <summary>
                    {t([
                      '拠点に設備を建てる',
                      'Build base facilities',
                      'きょてんに せつびを たてる',
                    ])}
                  </summary>
                  <div className="sa-action-list">
                    {IMPROVEMENTS.map((id) => {
                      const plan = BUILDINGS[id],
                        built = hasImprovement(s, id);
                      return (
                        <button
                          type="button"
                          key={id}
                          disabled={built || home.level < plan.level || !affordable(s, plan.cost)}
                          onClick={() => send({ type: 'build-improvement', improvement: id })}
                        >
                          <span>
                            <strong>{t(plan.name)}</strong>
                            <small>{t(plan.benefit)}</small>
                          </span>
                          <small>
                            {built
                              ? t(['設置済み', 'Built', 'せっちずみ'])
                              : (home.level < plan.level ? 'Lv. ' + plan.level + ' · ' : '') +
                                costList(plan.cost, t)}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                </details>
              </>
            ) : (
              <div className="sa-action-list">
                <button
                  type="button"
                  disabled={!affordable(s, HOUSE_MATERIALS)}
                  onClick={() => send({ type: 'build', mode: 'raise' })}
                >
                  <span>
                    {t([
                      '素材で家を建てる',
                      'Build a house from materials',
                      'そざいで いえを たてる',
                    ])}
                  </span>
                  <small>{costList(HOUSE_MATERIALS, t)} · 5h</small>
                </button>
                <button
                  type="button"
                  disabled={s.gold < homePrice(s)}
                  onClick={() => send({ type: 'build', mode: 'buy' })}
                >
                  <Home size={16} />
                  {t(['庭付きの家を買う', 'Buy a house with a garden'])} · {homePrice(s)} G
                </button>
              </div>
            )}
            <div className="sa-section-row">
              <button type="button" onClick={() => send({ type: 'rest', rest: 'bench' })}>
                <Sun size={16} />
                {t(['ベンチで休む', 'Rest on a bench'])} · 2h
              </button>
              <button
                type="button"
                disabled={s.gold < 7}
                onClick={() => send({ type: 'rest', rest: 'inn' })}
              >
                <Moon size={16} />
                {t(['宿で眠る', 'Stay at the inn'])} · 7 G
              </button>
            </div>
            <button
              className="sa-text-button"
              type="button"
              onClick={() => send({ type: 'rest', rest: 'bench', hours: 8 })}
            >
              {t(['8時間、時間を進める', 'Wait eight hours'])}
            </button>
          </section>
        )}
        {panel === 'market' && (
          <section className="sa-panel">
            <h2>
              <Leaf size={19} />
              {t(['市場', 'Market', 'いちば'])}
            </h2>
            <div className="sa-market">
              {GOOD_IDS.map((good) => {
                const buy = marketPrice(s, good, false),
                  sell = marketPrice(s, good, true);
                return (
                  <div key={good}>
                    <span>
                      {t(GOODS[good].name)} <b>×{s.goods[good]}</b>
                    </span>
                    <button
                      type="button"
                      disabled={s.gold < buy}
                      onClick={() => send({ type: 'trade', good, sell: false })}
                    >
                      {t(['買う', 'Buy'])} {buy} G
                    </button>
                    <button
                      type="button"
                      disabled={!s.goods[good]}
                      onClick={() => send({ type: 'trade', good, sell: true })}
                    >
                      {t(['売る', 'Sell'])} {sell} G
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {panel === 'craft' && (
          <section className="sa-panel">
            <h2>
              <Hammer size={19} />
              {t(['料理・工房', 'Kitchen and workshop', 'りょうり・こうぼう'])}
            </h2>
            <div className="sa-action-list">
              {Object.values(RECIPES).map((recipe) => (
                <button
                  type="button"
                  key={recipe.good}
                  disabled={!affordable(s, recipe.cost)}
                  onClick={() => send({ type: 'craft', recipe: recipe.good })}
                >
                  <span>{t(recipe.name)}</span>
                  <small>{costList(recipe.cost, t)}</small>
                </button>
              ))}
              {SLOT_IDS.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  disabled={!affordable(s, equipmentCost(s, slot))}
                  onClick={() => send({ type: 'craft', recipe: slot })}
                >
                  <span>
                    {t(SLOT_NAMES[slot])} ·{' '}
                    {t(['おまかせ製作', 'Forge a random design', 'おまかせ せいさく'])}
                  </span>
                  <small>{costList(equipmentCost(s, slot), t)}</small>
                </button>
              ))}
            </div>
            <WorkshopBlueprints state={s} send={send} t={t} />
          </section>
        )}
      </div>
    </div>
  );
}

const PEOPLE_PANELS = {
  residents: ['住民', 'Residents', 'じゅうみん'],
  party: ['仲間と陣形', 'Party and formation', 'なかまと じんけい'],
} satisfies Record<string, Text>;

export function PeoplePanel({ state: s, send, t }: PanelProps) {
  const people = residentsAt(s.location);
  const [picked, setPicked] = useState(people[0].id);
  const [panel, setPanel] = useState<keyof typeof PEOPLE_PANELS>('residents');
  const subject = people.find((person) => person.id === picked) ?? people[0];
  const friend = s.friends[subject.id];
  const role = RESIDENT_ROLES[subject.role];
  const trust = friend?.trust ?? 0;
  const day = dayAt(s.time);
  const isFollower = s.followers.includes(subject.id);
  const routine = residentRoutine(subject, s.time);
  const present = isFollower || routine.present;
  const memory = residentStory(s, subject);
  const affiliation = residentFaction(s.location, subject);
  const faction = FACTIONS[affiliation];
  const influence = standing(s, affiliation);
  return (
    <div className="sa-workspace sa-people">
      <PanelNavigation
        labels={PEOPLE_PANELS}
        current={panel}
        select={setPanel}
        t={t}
        name={['交流の項目', 'People panels', 'こうりゅうの こうもく']}
      />
      <div className="sa-workspace-body" key={panel}>
        {panel === 'residents' ? (
          <section className="sa-panel">
            <label className="sa-field sa-resident-picker">
              <span>{t(['話す相手', 'Choose a resident', 'はなす あいて'])}</span>
              <select value={subject.id} onChange={(event) => setPicked(event.target.value)}>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {t(person.name)} ·{' '}
                    {t(
                      s.followers.includes(person.id) || residentRoutine(person, s.time).present
                        ? ['話せる', 'Available', 'はなせる']
                        : ['不在', 'Away', 'ふざい'],
                    )}
                  </option>
                ))}
              </select>
            </label>
            <div className="sa-npc-head">
              <ResidentPortrait role={subject.role} />
              <div>
                <h2>{t(subject.name)}</h2>
                <p>{t(role.job)}</p>
                <p>
                  {isFollower
                    ? t(['同行中', 'Traveling with you', 'どうこうちゅう'])
                    : t(routine.activity) +
                      ' · ' +
                      String(routine.until).padStart(2, '0') +
                      ':00 ' +
                      t(['まで', 'change', 'まで'])}
                </p>
                <b className="sa-gold">
                  {t(['親しさ', 'Trust'])} {trust}/8
                </b>
              </div>
            </div>
            <blockquote>
              {present
                ? t(role.lines[Math.min(2, Math.floor(trust / 3))])
                : t([
                    '起きる時間を待つと会えます。',
                    'Come back after they wake up.',
                    'おきる じかんまで まつと あえます。',
                  ])}
            </blockquote>
            <div className="sa-action-list">
              <button
                type="button"
                disabled={!present || friend?.visitedDay === day}
                onClick={() => send({ type: 'social', id: subject.id, verb: 'talk' })}
              >
                {t(['話す', 'Talk', 'はなす'])}
              </button>
              <button
                type="button"
                disabled={!present || friend?.offeredDay === day || !s.goods[role.gift]}
                onClick={() => send({ type: 'social', id: subject.id, verb: 'gift' })}
              >
                {t(['贈り物', 'Give a gift'])}
                <small>{t(GOODS[role.gift].name)} ×1</small>
              </button>
              <button
                type="button"
                disabled={!present || friend?.offeredDay === day}
                onClick={() => send({ type: 'social', id: subject.id, verb: 'assist' })}
              >
                {t(['仕事を手伝う', 'Help with work'])}
              </button>
              <button
                className="sa-primary"
                type="button"
                disabled={
                  !present || trust < 4 || isFollower || s.followers.length >= MAX_PARTY_SIZE - 1
                }
                onClick={() => send({ type: 'social', id: subject.id, verb: 'recruit' })}
              >
                {isFollower
                  ? t(['旅の仲間', 'In your party'])
                  : t(['旅に誘う', 'Invite to travel'])}
                <small>{t(COMPANION_ROLES[subject.role].copy)}</small>
              </button>
            </div>
            <section className="sa-affiliation">
              <img src={art('expedition/faction-' + affiliation)} alt="" loading="lazy" />
              <div>
                <strong>
                  {t(faction.name)} · {t(standingName(influence))}
                </strong>
                <p className="sa-hint">{t(faction.line)}</p>
                <button
                  type="button"
                  disabled={
                    !present ||
                    influence >= 12 ||
                    !favorAvailable(s, affiliation) ||
                    !s.goods[faction.gift]
                  }
                  onClick={() => send({ type: 'faction-favor', resident: subject.id })}
                >
                  {t([
                    '組織に品物を届ける',
                    'Deliver faction supplies',
                    'そしきに しなものを とどける',
                  ])}{' '}
                  · {t(GOODS[faction.gift].name)} ×1
                </button>
                <small>
                  {t(faction.name)} +2 · {t(FACTIONS[faction.rival].name)} −1
                </small>
                <button
                  type="button"
                  disabled={
                    !present ||
                    influence <= -3 ||
                    Boolean(s.frontier.pacts[subject.id]) ||
                    s.frontier.liquids.water < 2
                  }
                  onClick={() =>
                    send({ type: 'field', operation: { kind: 'pact', id: subject.id } })
                  }
                >
                  {s.frontier.pacts[subject.id]
                    ? t(['盟約済み', 'Water pact sworn', 'めいやくずみ'])
                    : t([
                        '水を分けて盟約を結ぶ',
                        'Share water and make a pact',
                        'みずを わけて めいやくを むすぶ',
                      ]) + ' · ×2'}
                </button>
              </div>
            </section>
            {memory && (
              <section className="sa-memory">
                <h3>
                  {t(memory.title)} <small>{(friend?.memories ?? 0) + 1}/2</small>
                </h3>
                <p>{t(memory.ask)}</p>
                <div className="sa-inline">
                  <button
                    type="button"
                    disabled={!present || friend?.bondDay === day}
                    onClick={() => send({ type: 'bond', id: subject.id, approach: 'talk' })}
                  >
                    {t(['話を聞く', 'Listen to their story', 'はなしを きく'])} ·{' '}
                    {t(STATS[memory.stat])}
                  </button>
                  <button
                    type="button"
                    disabled={!present || friend?.bondDay === day || !s.goods[memory.item]}
                    onClick={() => send({ type: 'bond', id: subject.id, approach: 'give' })}
                  >
                    {t(['品物を届ける', 'Bring what they need', 'しなものを とどける'])} ·{' '}
                    {t(GOODS[memory.item].name)}
                  </button>
                </div>
              </section>
            )}
          </section>
        ) : (
          <section className="sa-panel sa-party">
            <h3>
              {t(['パーティ', 'Party', 'パーティ'])} {s.followers.length + 1}/{MAX_PARTY_SIZE}
            </h3>
            {s.followers.map((id) => {
              const member = s.friends[id]?.resident;
              return (
                member && (
                  <div key={id} className="sa-companion-order">
                    <div className="sa-section-row">
                      <span>
                        {t(member.name)} · {t(COMPANION_ROLES[member.role].copy)}
                        {(s.friends[id].memories ?? 0) > 0 &&
                          ' · ' +
                            t(['思い出', 'Memories', 'おもいで']) +
                            ' ' +
                            s.friends[id].memories +
                            '/2'}
                      </span>
                      <button
                        type="button"
                        onClick={() => send({ type: 'social', id, verb: 'dismiss' })}
                      >
                        {t(['別行動', 'Dismiss'])}
                      </button>
                    </div>
                    <div className="sa-inline">
                      <label className="sa-field">
                        <span>{t(['仲間の役割', 'Companion order', 'なかまの やくわり'])}</span>
                        <select
                          value={s.frontier.orders[id] ?? ''}
                          onChange={(event) =>
                            send({
                              type: 'field',
                              operation: {
                                kind: 'order',
                                id,
                                order: event.target.value
                                  ? (event.target.value as FollowerOrder)
                                  : null,
                              },
                            })
                          }
                        >
                          <option value="">{t(['自動', 'Automatic', 'じどう'])}</option>
                          {Object.entries(FOLLOWER_ORDERS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {t(label)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="sa-field">
                        <span>{t(['持たせる装備', 'Loaned equipment', 'もたせる そうび'])}</span>
                        <select
                          value={s.frontier.lent[id] ?? ''}
                          onChange={(event) =>
                            send({
                              type: 'field',
                              operation: { kind: 'lend', id, gear: event.target.value || null },
                            })
                          }
                        >
                          <option value="">{t(['装備なし', 'No loan', 'そうびなし'])}</option>
                          {s.gear
                            .filter(
                              (gear) =>
                                gear.id === s.frontier.lent[id] ||
                                (gear.id !== s.frontier.offhand &&
                                  !Object.values(s.equipment).includes(gear.id) &&
                                  !Object.values(s.frontier.lent).includes(gear.id)),
                            )
                            .map((gear) => (
                              <option key={gear.id} value={gear.id}>
                                {t(gearName(gear))} +{gear.power}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                  </div>
                )
              );
            })}
            {s.followers.length === 0 && (
              <p className="sa-hint">
                {t([
                  '親しさ4以上の人を誘えます。',
                  'You can invite residents with at least 4 Trust.',
                ])}
              </p>
            )}
            <FormationChoice s={s} t={t} send={send} />
          </section>
        )}
      </div>
    </div>
  );
}
