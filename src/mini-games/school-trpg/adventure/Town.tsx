import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Compass,
  DoorOpen,
  Hammer,
  HeartHandshake,
  Home,
  Leaf,
  MapPin,
  Moon,
  MoveUpRight,
  Sparkles,
  Sun,
} from 'lucide-react';
import {
  BIOMES,
  GOODS,
  GOOD_IDS,
  RECIPES,
  RESIDENT_ROLES,
  SLOT_NAMES,
  type Goods,
  type Text,
} from './content';
import {
  ACTIVITIES,
  canActivity,
  canClaimMission,
  equipmentCost,
  homePrice,
  marketPrice,
  missionProgress,
  nextHarvest,
  ownDwelling,
} from './life';
import { SLOT_IDS } from './inventory';
import { affordable, freshWorldCode, worldCode, type Adventure, type LifeActivity } from './state';
import {
  DIRECTIONS,
  addressKey,
  atOffset,
  dayAt,
  isNight,
  missionsAt,
  realmName,
  residentPresent,
  residentsAt,
  sameAddress,
  townArt,
  townAt,
  type Address,
  type Mission,
} from './world';
import { BOONS, TALES } from './tales';
import { art, Portrait, type Local, type Send } from './ui';

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
}: PanelProps & { declare: () => void; showMap: () => void }) {
  const town = townAt(s.location),
    biome = BIOMES[town.biome];
  const deep = s.deepest[addressKey(s.location)] ?? 0;
  const key = addressKey(s.location);
  const seenLandmark = s.exploredLandmarks[key];
  const tale = TALES[town.biome];
  const taleRecord = s.townTales[key];
  return (
    <div className="sa-town-grid">
      <div>
        <section className="sa-town-banner" data-night={isNight(s.time) || undefined}>
          <img src={art(townArt(s.location))} alt="" decoding="async" />
          <div>
            <span>
              {t(realmName(s.location.world))} · {t(biome.name)}
            </span>
            <h1>{t(town.name)}</h1>
            <p>{t(town.lead)}</p>
          </div>
        </section>
        <div className="sa-town-actions">
          <button className="sa-primary" type="button" onClick={() => send({ type: 'enter' })}>
            <DoorOpen size={21} />
            <span>
              <strong>{t(['遺跡へ入る', 'Enter the ruins', 'いせきへ はいる'])}</strong>
              <small>{t(biome.ruin)}</small>
            </span>
          </button>
          <button type="button" onClick={showMap}>
            <Compass size={21} />
            <span>
              <strong>{t(['街道を行く', 'Take the road', 'かいどうを いく'])}</strong>
              <small>{t(['地図で行き先を選ぶ', 'Choose where to travel'])}</small>
            </span>
          </button>
          <button type="button" onClick={declare}>
            <Sparkles size={20} />
            <span>
              <strong>{t(['自由宣言', 'Declare an action', 'じゆうせんげん'])}</strong>
              <small>
                {t(['行動を書き、やり方を選ぶ', 'Describe an action and choose an approach'])}
              </small>
            </span>
          </button>
        </div>
        {deep > 0 && (
          <button
            className="sa-text-button"
            type="button"
            onClick={() => send({ type: 'enter', floor: deep + 1 })}
          >
            {t([
              `開通済みの階段から地下${deep + 1}階へ`,
              `Use the cleared stairwell to floor ${deep + 1}`,
            ])}
          </button>
        )}
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
              <p>{t(tale.options.find((option) => option.boon === taleRecord.boon)!.resolution)}</p>
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
      <Commission state={s} send={send} t={t} />
    </div>
  );
}

export function WorldMap({ state: s, send, t }: PanelProps) {
  const [code, setCode] = useState('');
  const [detail, setDetail] = useState<Address | null>(null);
  const location = s.location;
  const cells = Array.from({ length: 25 }, (_, index) => ({
    world: location.world,
    x: location.x + (index % 5) - 2,
    y: location.y + Math.floor(index / 5) - 2,
  }));
  const selected = detail?.world === location.world ? detail : location;
  const town = townAt(selected);
  const direction = DIRECTIONS.findIndex((_, index) =>
    sameAddress(atOffset(location, index), selected),
  );
  const gate = worldCode(code);
  const ownWorld = realmName(location.world);
  const currentRealmTownCount = Object.values(s.knownTowns).filter(
    (place) => place.world === location.world,
  ).length;
  return (
    <div className="sa-town-grid">
      <div>
        <section className="sa-panel">
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
              const known = here || Boolean(s.knownTowns[key]);
              const near = Math.abs(cell.x - location.x) + Math.abs(cell.y - location.y) === 1;
              const place = townAt(cell);
              const label = t(place.name) + ' · ' + cell.x + ', ' + cell.y;
              return (
                <button
                  type="button"
                  key={key}
                  className="sa-map-tile"
                  data-known={known || near || undefined}
                  data-biome={known || near ? place.biome : undefined}
                  data-here={here || undefined}
                  aria-pressed={sameAddress(selected, cell)}
                  disabled={!known && !near}
                  aria-label={known || near ? label : t(['未踏', 'Uncharted'])}
                  onClick={() => setDetail(cell)}
                >
                  {here ? (
                    <MapPin size={18} />
                  ) : known || near ? (
                    <span>{t(place.name)}</span>
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
          <div className="sa-atlas-place">
            <strong>
              {t(town.name)} · {selected.x}, {selected.y}
            </strong>
            {direction >= 0 ? (
              <button
                type="button"
                className="sa-primary"
                onClick={() => {
                  if (send({ type: 'travel', direction })) setDetail(null);
                }}
              >
                {t(['ここへ向かう', 'Travel here'])}
              </button>
            ) : (
              <span>
                {sameAddress(selected, location)
                  ? t(['現在地', 'You are here'])
                  : t(['街道をたどって移動', 'Follow the roads to reach it'])}
              </span>
            )}
          </div>
          <div className="sa-road-list">
            {directionIcons.map((Icon, index) => {
              const next = townAt(atOffset(location, index));
              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => {
                    if (send({ type: 'travel', direction: index })) setDetail(null);
                  }}
                >
                  <Icon size={16} />
                  <span>
                    {t(DIRECTIONS[index])} · {t(next.name)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <section className="sa-panel">
        <h2>{t(['別の世界へ', 'Cross into another realm'])}</h2>
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
      </section>
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

export function LifePanel({ state: s, send, t, lesson }: PanelProps & { lesson: () => void }) {
  const home = ownDwelling(s);
  const harvest = nextHarvest(s);
  const days = dayAt(s.time);
  return (
    <div className="sa-life-grid">
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
                <small>{hours}h</small>
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
                  home.level >= 3 ||
                  s.gold < home.level * 24 ||
                  s.goods.timber < home.level * 2 ||
                  !s.goods.ore
                }
                onClick={() => send({ type: 'build', mode: 'upgrade' })}
              >
                <Hammer size={16} />
                {t(['作業場を広げる', 'Upgrade workshop'])}
                <small>
                  {home.level < 3
                    ? home.level * 24 + ' G · ' + costList({ timber: home.level * 2, ore: 1 }, t)
                    : t(['最大', 'Max'])}
                </small>
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={s.gold < homePrice(s)}
            onClick={() => send({ type: 'build', mode: 'buy' })}
          >
            <Home size={16} />
            {t(['庭付きの家を買う', 'Buy a house with a garden'])} · {homePrice(s)} G
          </button>
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
                {t(SLOT_NAMES[slot])} · {t(['製作', 'Forge'])}
              </span>
              <small>{costList(equipmentCost(s, slot), t)}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

const SUPPORT = {
  host: ['戦闘中に仲間を回復', 'Heals during combat'],
  broker: ['交渉を支援', 'Aids Presence checks'],
  smith: ['攻撃を受け止める', 'Reduces damage'],
  keeper: ['攻撃を受け止める', 'Reduces damage'],
  reader: ['調査を支援', 'Aids Insight checks'],
  grower: ['戦闘中に仲間を回復', 'Heals during combat'],
} satisfies Record<keyof typeof RESIDENT_ROLES, Text>;

export function PeoplePanel({ state: s, send, t }: PanelProps) {
  const people = residentsAt(s.location);
  const [picked, setPicked] = useState(people[0].id);
  const subject = people.find((person) => person.id === picked) ?? people[0];
  const friend = s.friends[subject.id];
  const role = RESIDENT_ROLES[subject.role];
  const trust = friend?.trust ?? 0;
  const day = dayAt(s.time),
    present = residentPresent(subject, s.time);
  const isFollower = s.followers.includes(subject.id);
  return (
    <div className="sa-town-grid sa-people">
      <section className="sa-panel">
        <h2>
          <HeartHandshake size={19} />
          {t(['町の人々', 'Town residents', 'まちの ひとびと'])}
        </h2>
        <div className="sa-people-list">
          {people.map((person) => (
            <button
              type="button"
              key={person.id}
              aria-pressed={subject.id === person.id}
              onClick={() => setPicked(person.id)}
            >
              <Portrait id={'resident-' + person.art} lazy />
              <span>
                <strong>{t(person.name)}</strong>
                <small>{t(RESIDENT_ROLES[person.role].job)}</small>
                <small>{t(person.site)}</small>
              </span>
              <small>
                {residentPresent(person, s.time) ? t(['在席', 'Here']) : t(['不在', 'Away'])}
              </small>
            </button>
          ))}
        </div>
      </section>
      <section className="sa-panel">
        <div className="sa-npc-head">
          <Portrait id={'resident-' + subject.art} />
          <div>
            <h2>{t(subject.name)}</h2>
            <p>{t(role.job)}</p>
            <p>{t(subject.site)}</p>
            <b className="sa-gold">
              {t(['親しさ', 'Trust'])} {trust}/8
            </b>
          </div>
        </div>
        <blockquote>
          {present
            ? t(role.lines[Math.min(2, Math.floor(trust / 3))])
            : t(
                subject.shift === 'night'
                  ? ['夜に会えます。', 'Come back at night.']
                  : ['昼に会えます。', 'Come back during the day.'],
              )}
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
            disabled={!present || trust < 4 || isFollower || s.followers.length >= 2}
            onClick={() => send({ type: 'social', id: subject.id, verb: 'recruit' })}
          >
            {isFollower ? t(['旅の仲間', 'In your party']) : t(['旅に誘う', 'Invite to travel'])}
            <small>{t(SUPPORT[subject.role])}</small>
          </button>
        </div>
        <div className="sa-party">
          <h3>
            {t(['旅の仲間', 'Travel companions'])} {s.followers.length}/2
          </h3>
          {s.followers.map((id) => {
            const member = s.friends[id]?.resident;
            return (
              member && (
                <div key={id} className="sa-section-row">
                  <span>
                    {t(member.name)} · {t(SUPPORT[member.role])}
                  </span>
                  <button
                    type="button"
                    onClick={() => send({ type: 'social', id, verb: 'dismiss' })}
                  >
                    {t(['別行動', 'Dismiss'])}
                  </button>
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
        </div>
      </section>
    </div>
  );
}
