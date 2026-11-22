import React, { useState } from 'react';
import { BookOpen, Compass, Droplets, Hammer, MapPin, Sparkles } from 'lucide-react';
import { BIOME_IDS, BIOMES, GOODS, GOOD_IDS, STATS, type Good, type Text } from './content';
import { residentFaction, standing } from './factions';
import {
  canStudy,
  deviceSocketAvailable,
  fieldChapterCount,
  giftReady,
  learningCost,
  PAPER_SENTINEL,
  siteRequirement,
  type FieldOperation,
} from './frontierActions';
import {
  BLEND_BASES,
  BLEND_SPICES,
  BODY_ZONES,
  CONDITIONS,
  DEVICES,
  DEVICE_IDS,
  DEVICE_MODS,
  DISCIPLINES,
  EQUIPMENT_SOCKETS,
  FIELD_SKILLS,
  GIFTS,
  LIQUIDS,
  LIQUID_IDS,
  RECIPES_LAB,
  REGION_EPISODES,
  TERRAIN,
  type BlendBase,
  type BlendSpice,
  type DeviceMod,
  type FieldSkill,
  type Gift,
  type LabMeal,
  type Liquid,
  type Socket,
} from './frontierContent';
import {
  FRONTIER_RULES,
  RULE_LABELS,
  alertLevel,
  bodyInjured,
  carriedWeight,
  carryCapacity,
  deviceCapacity,
  deviceCost,
  deviceEquipped,
  encodeFieldRules,
  fieldCondition,
  fieldRecipe,
  fieldSkill,
  hasAuxiliaryMount,
  thirst,
  totalLiquid,
  vesselCapacity,
  type DeviceItem,
} from './frontierState';
import {
  fieldFloor,
  glancingSight,
  liquidMix,
  SITE_GOALS,
  surveySite,
  terrainAt,
} from './frontierWorld';
import { marketPrice } from './life';
import { affordable, maxHp, MAX_PARTY_SIZE, type Adventure } from './state';
import { addressKey, residentPresent, residentsAt, townAt } from './world';
import { art, type Local, type Send } from './ui';

type Props = { s: Adventure; send: Send; t: Local };
const command = (send: Send, operation: FieldOperation) => send({ type: 'field', operation });
const SKILLS = Object.keys(FIELD_SKILLS) as FieldSkill[];
const TALENTS = Object.keys(GIFTS) as Gift[];
const MODS = Object.keys(DEVICE_MODS) as DeviceMod[];

function GearCard({ s, send, t, item }: Props & { item: DeviceItem }) {
  const [mod, setMod] = useState<DeviceMod>(item.mod ?? 'reservoir');
  const device = DEVICES[item.id];
  const mounted = deviceEquipped(s, item.serial);
  const slot = (Object.keys(s.frontier.sockets) as Socket[]).find(
    (key) => s.frontier.sockets[key] === item.serial,
  );
  const action = (verb: Extract<FieldOperation, { kind: 'device' }>['verb'], socket?: Socket) =>
    command(send, { kind: 'device', serial: item.serial, verb, socket });
  return (
    <article className="sa-expkit-card">
      {item.known ? (
        <img src={art('frontier/' + device.art)} alt="" loading="lazy" />
      ) : (
        <span className="sa-expkit-unknown" aria-hidden="true">
          ?
        </span>
      )}
      <div>
        <strong>
          {item.known
            ? t(device.name)
            : t(['用途不明の機具', 'Unidentified device', 'ようとふめいの きぐ'])}
        </strong>
        {item.known && (
          <small>
            {slot ? t(EQUIPMENT_SOCKETS[slot]) + ' · ' : ''}
            {t(['電力', 'Charge', 'でんりょく'])} {item.charge}/{deviceCapacity(item)}
            {item.mod && ' · ' + t(DEVICE_MODS[item.mod].name)}
          </small>
        )}
        {item.known && (
          <small>
            {device.power === 'lamp'
              ? t(['遺跡の灯りを補充', 'Refills the ruin lamp', 'いせきの あかりを ほじゅう'])
              : device.power === 'spray'
                ? t([
                    '足元を冷やし、胞子を洗う',
                    'Cools your tile and washes off spores',
                    'ゆかを ひやし、ほうしを あらう',
                  ])
                : t(GIFTS[device.power].hint)}
          </small>
        )}
      </div>
      <div className="sa-inline">
        {!item.known ? (
          <button type="button" onClick={() => action('identify')}>
            {t(['鑑定する', 'Identify device', 'かんていする'])} · 1h
          </button>
        ) : (
          <>
            {mounted ? (
              <button type="button" onClick={() => action('remove')}>
                {t(['義装を外す', 'Remove device', 'ぎそうを はずす'])}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => action('fit')}>
                  {t(['義装を取り付ける', 'Fit device', 'ぎそうを つける'])}
                </button>
                {deviceSocketAvailable(s, item, 'support') && (
                  <button type="button" onClick={() => action('fit', 'support')}>
                    {t(EQUIPMENT_SOCKETS.support)}
                  </button>
                )}
                <button type="button" onClick={() => action('dismantle')}>
                  {t(['部品に分解', 'Dismantle for parts', 'ぶひんに する'])}
                </button>
              </>
            )}
            <button
              type="button"
              disabled={
                item.charge >= deviceCapacity(item) ||
                (!s.frontier.parts && !s.frontier.liquids.oil)
              }
              onClick={() => action('recharge')}
            >
              {t(['充電する', 'Recharge', 'じゅうでんする'])}
            </button>
          </>
        )}
      </div>
      {item.known && fieldSkill(s, 'salvage') && (
        <div className="sa-inline">
          <label className="sa-field">
            <span>{t(['改造', 'Modification', 'かいぞう'])}</span>
            <select value={mod} onChange={(event) => setMod(event.target.value as DeviceMod)}>
              {MODS.map((id) => (
                <option key={id} value={id}>
                  {t(DEVICE_MODS[id].name)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={s.frontier.parts < 3 || item.mod === mod}
            onClick={() => command(send, { kind: 'modify', serial: item.serial, mod })}
          >
            {t(['加工する', 'Apply mod', 'かこうする'])} · 3
          </button>
          <small>{t(DEVICE_MODS[mod].hint)}</small>
        </div>
      )}
    </article>
  );
}

function Workshop({ s, send, t }: Props) {
  return (
    <div className="sa-stack">
      <section className="sa-panel sa-expkit">
        <div className="sa-section-row">
          <h2>
            <Hammer size={19} />
            {t(['古機具と義装', 'Devices and fittings', 'こきぐと ぎそう'])}
          </h2>
          <b className="sa-gold">
            {t(['機具の部品', 'Parts', 'ぶひん'])} {s.frontier.parts}
          </b>
        </div>
        {!s.frontier.devices.length && (
          <p>
            {t([
              '史跡や遺跡の宝箱で古機具を見つけられます。',
              'Find unidentified devices at sites and in ruin chests.',
              'しせきや たからばこで みつけよう。',
            ])}
          </p>
        )}
        <div className="sa-expkit-list">
          {s.frontier.devices.map((item) => (
            <GearCard key={item.serial} s={s} t={t} send={send} item={item} />
          ))}
        </div>
        <p className="sa-hint">
          {hasAuxiliaryMount(s)
            ? t([
                '補助腕を使える。',
                'Your auxiliary mount is available.',
                'ほじょううでを つかえる。',
              ])
            : t([
                'レベル4で分解技術または分身を覚えると、補助腕に義装を追加できます。',
                'At level 4, learn Salvage or Echo Double to unlock an auxiliary mount.',
              ])}
        </p>
      </section>
      <section className="sa-panel">
        <h2>{t(['復元できる機具', 'Known schematics', 'ふくげん できる きぐ'])}</h2>
        <div className="sa-action-list">
          {DEVICE_IDS.filter((id) => s.frontier.discovered[id]).map((id) => {
            const entry = DEVICES[id];
            return (
              <button
                type="button"
                key={id}
                disabled={
                  s.frontier.devices.length >= 32 ||
                  s.frontier.parts < entry.parts ||
                  !s.goods[entry.material] ||
                  (!fieldSkill(s, 'salvage') && s.frontier.discipline !== 'artificer')
                }
                onClick={() => command(send, { kind: 'design', id })}
              >
                <span>{t(entry.name)}</span>
                <small>
                  {t(['部品', 'Parts', 'ぶひん'])} {entry.parts} · {t(GOODS[entry.material].name)}
                </small>
              </button>
            );
          })}
        </div>
        <p className="sa-hint">
          {t([
            '鑑定して仕組みを覚えると、分解技術または機巧士の知識で復元できます。',
            'Identify a device to learn its design. Artificers and anyone trained in Salvage can build it.',
          ])}
        </p>
      </section>
    </div>
  );
}

function Training({ s, send, t }: Props) {
  const mentor =
    s.frontier.sites[addressKey(s.location)]?.read &&
    residentsAt(s.location).find(
      (person) =>
        s.frontier.pacts[person.id] &&
        residentPresent(person, s.time) &&
        standing(s, residentFaction(s.location, person)) >= 3,
    );
  return (
    <div className="sa-town-grid">
      <section className="sa-panel sa-expkit">
        <div className="sa-section-row">
          <h2>{t(['技能', 'Field skills', 'ぎのう'])}</h2>
          <b className="sa-gold">
            {t(['成長点', 'Points', 'せいちょうてん'])} {s.talent}
          </b>
        </div>
        {mentor && (
          <p>
            {t(mentor.name)} ·{' '}
            {t([
              '紀行誌を読んだので、部品2つで技能を教わることができます。',
              'Reading the local book lets you learn skills from this mentor for two parts.',
            ])}
          </p>
        )}
        <div className="sa-exp-training">
          {SKILLS.map((id) => (
            <article key={id}>
              <strong>{t(FIELD_SKILLS[id].name)}</strong>
              <p>{t(FIELD_SKILLS[id].hint)}</p>
              <div className="sa-inline">
                <button
                  type="button"
                  disabled={!canStudy(s, id)}
                  onClick={() => command(send, { kind: 'skill', id })}
                >
                  {s.frontier.skills[id]
                    ? t(['習得済み', 'Learned', 'しゅうとくずみ'])
                    : t(['学ぶ', 'Learn', 'まなぶ']) +
                      ' · ' +
                      t(STATS[FIELD_SKILLS[id].stat]) +
                      ' ' +
                      FIELD_SKILLS[id].minimum}
                </button>
                {!s.frontier.skills[id] && mentor && (
                  <button
                    type="button"
                    disabled={s.frontier.parts < 2}
                    onClick={() => command(send, { kind: 'skill', id, mentor: mentor.id })}
                  >
                    {t(['教わる', 'Ask mentor', 'おそわる'])}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="sa-panel sa-expkit">
        <h2>
          <Sparkles size={19} />
          {t(['響きの力', 'Resonant powers', 'ひびきの ちから'])}
        </h2>
        <p className="sa-hint">{t(DISCIPLINES[s.frontier.discipline].hint)}</p>
        <div className="sa-exp-training">
          {TALENTS.map((id) => {
            const rank = s.frontier.gifts[id] ?? 0;
            return (
              <article key={id}>
                <strong>
                  {t(GIFTS[id].name)} · {rank}/3
                </strong>
                <p>{t(GIFTS[id].hint)}</p>
                <button
                  type="button"
                  disabled={rank >= 3 || s.talent < learningCost(s, id)}
                  onClick={() => command(send, { kind: 'gift', id })}
                >
                  {t(rank ? ['伸ばす', 'Upgrade', 'のばす'] : ['学ぶ', 'Learn', 'まなぶ'])} ·{' '}
                  {learningCost(s, id)}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function FieldStatus({ s, t }: Pick<Props, 's' | 't'>) {
  const conditions = (Object.keys(CONDITIONS) as (keyof typeof CONDITIONS)[]).filter((id) =>
    fieldCondition(s, id),
  );
  const zones = (Object.keys(BODY_ZONES) as (keyof typeof BODY_ZONES)[]).filter((id) =>
    bodyInjured(s, id),
  );
  const resonance = alertLevel(s);
  if (!conditions.length && !zones.length && !resonance && !s.frontier.rules.weather) return null;
  return (
    <div className="sa-field-status">
      {s.frontier.rules.weather && (
        <span>
          <Droplets size={14} />
          {t(['水を飲んでから', 'Since drinking', 'みずを のんでから'])} {thirst(s)}h
        </span>
      )}
      {resonance > 0 && (
        <span
          className={resonance >= 8 ? 'sa-field-wound' : undefined}
          title={t([
            '残響が8以上になると番人に気づかれる。',
            'At eight or more, residual resonance attracts sentinels.',
          ])}
        >
          <Sparkles size={14} />
          {t(['残響', 'Residual resonance', 'ざんきょう'])} {resonance}
        </span>
      )}
      {conditions.map((id) => (
        <span key={id}>{t(CONDITIONS[id])}</span>
      ))}
      {zones.map((id) => (
        <span key={id} className="sa-field-wound">
          {t(BODY_ZONES[id])} · {t(['負傷', 'Injured', 'ふしょう'])}
        </span>
      ))}
    </div>
  );
}

function SiteBook({ s, t, send }: Props) {
  const [selected, setSelected] = useState(addressKey(s.location));
  const key = addressKey(s.location);
  const site = surveySite(s.location);
  const record = s.frontier.sites[key];
  const options = Object.entries(s.frontier.sites).reverse();
  const bookKey = s.frontier.sites[selected] ? selected : options[0]?.[0];
  const book = s.frontier.sites[bookKey];
  const described = book && surveySite(book.place);
  const chapters = fieldChapterCount(s);
  return (
    <div className="sa-town-grid">
      <section className="sa-panel sa-expkit">
        <img className="sa-site-photo" src={art('frontier/site-' + site.biome)} alt="" />
        <h2>
          <MapPin size={18} />
          {t(site.title)}
        </h2>
        <p>
          {t(
            record?.resolved
              ? REGION_EPISODES[site.biome].record
              : REGION_EPISODES[site.biome].inquiry,
          )}
        </p>
        {record ? (
          <>
            {!record.resolved && <strong>{t(SITE_GOALS[site.task])}</strong>}
            {!record.resolved && (
              <div className="sa-action-list">
                <button
                  type="button"
                  onClick={() => command(send, { kind: 'site', method: 'check' })}
                >
                  {t(['能力で試す', 'Attempt a check', 'はんていで ためす'])}
                </button>
                <button
                  type="button"
                  disabled={!siteRequirement(s, 'supplies')}
                  onClick={() => command(send, { kind: 'site', method: 'supplies' })}
                >
                  {t(['現地の素材を使う', 'Use local supplies', 'そざいを つかう'])} ·{' '}
                  {t(GOODS[site.material].name)}
                </button>
                <button
                  type="button"
                  disabled={!siteRequirement(s, 'lore')}
                  onClick={() => command(send, { kind: 'site', method: 'lore' })}
                >
                  {t([
                    '紀行誌か友好関係を頼る',
                    'Use the book or local goodwill',
                    'ほんか なかまを たよる',
                  ])}
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            className="sa-primary"
            type="button"
            onClick={() => command(send, { kind: 'survey' })}
          >
            {t(['史跡を訪れる', 'Visit historic site', 'しせきを おとずれる'])} · 2h
          </button>
        )}
        <div className="sa-field-chapters">
          <strong>
            {t(['六地方の記録', 'Records of the six regions', '6ちほうの きろく'])} · {chapters}/6
          </strong>
          <ul>
            {BIOME_IDS.map((id) => (
              <li key={id} data-found={s.frontier.chapters[id] || undefined}>
                {t(BIOMES[id].name)} {s.frontier.chapters[id] ? '✓' : '·'}
              </li>
            ))}
          </ul>
          {chapters >= 3 && !s.followers.includes(PAPER_SENTINEL) && (
            <button
              type="button"
              disabled={s.frontier.parts < 6 || s.followers.length >= MAX_PARTY_SIZE - 1}
              onClick={() => command(send, { kind: 'construct' })}
            >
              {t(['紙灯の見張り鳥を組む', 'Build a paper sentinel', 'かみあかりの とりを くむ'])} ·
              6
            </button>
          )}
          {chapters === 6 &&
            (s.frontier.ending ? (
              <p>
                {t(
                  s.frontier.ending === 'signal'
                    ? ['六地方に共通の合図を広めた。', 'The shared signal reaches all six regions.']
                    : [
                        '六つの記録を各地の避難所に託した。',
                        'The refuge keepers safeguard the six records.',
                      ],
                )}
              </p>
            ) : (
              <div className="sa-inline">
                <button
                  type="button"
                  onClick={() => command(send, { kind: 'resolve', choice: 'signal' })}
                >
                  {t(['六つの灯りをつなぐ', 'Link the six lights', '6つの あかりを つなぐ'])}
                </button>
                <button
                  type="button"
                  onClick={() => command(send, { kind: 'resolve', choice: 'shelter' })}
                >
                  {t([
                    '避難所に記録を託す',
                    'Share records with refuges',
                    'ひなんじょに きろくを たくす',
                  ])}
                </button>
              </div>
            ))}
        </div>
      </section>
      <section className="sa-panel sa-expkit">
        <h2>
          <BookOpen size={18} />
          {t(['紀行誌', 'Travel books', 'きこうし'])}
        </h2>
        {book && described ? (
          <>
            <label className="sa-field">
              <span>{t(['本を選ぶ', 'Choose a book', 'ほんを えらぶ'])}</span>
              <select value={bookKey} onChange={(event) => setSelected(event.target.value)}>
                {options.map(([id, entry]) => (
                  <option key={id} value={id}>
                    {t(surveySite(entry.place).title)}
                  </option>
                ))}
              </select>
            </label>
            {book.read ? (
              <p>{t(described.tale)}</p>
            ) : (
              <button
                className="sa-primary"
                type="button"
                onClick={() => command(send, { kind: 'book', key: bookKey, verb: 'read' })}
              >
                {t(['紀行誌を読む', 'Read travel book', 'きこうしを よむ'])}
              </button>
            )}
            <button
              type="button"
              disabled={!book.read || book.donated}
              onClick={() => command(send, { kind: 'book', key: bookKey, verb: 'donate' })}
            >
              {book.donated
                ? t(['寄贈済み', 'Donated', 'きぞうずみ'])
                : t(['帳場に寄贈する', 'Donate to the archive', 'きろくいんに わたす'])}
            </button>
          </>
        ) : (
          <p>
            {t([
              '史跡で見つけた本が並びます。読むと地図に目印が増えます。',
              'Books found at historic sites go here. Reading them reveals places on the map.',
            ])}
          </p>
        )}
      </section>
    </div>
  );
}

export function FieldSupplies({
  s,
  send,
  t,
  target,
  foe,
}: Props & { target?: number; foe?: number }) {
  const [liquid, setLiquid] = useState<Liquid>('water');
  const [mixWith, setMixWith] = useState<Liquid>('sap');
  const [base, setBase] = useState<BlendBase>('fish');
  const [spice, setSpice] = useState<BlendSpice>('herb');
  const mixOptions = LIQUID_IDS.filter((id) => id !== liquid);
  const secondLiquid = mixWith === liquid ? mixOptions[0] : mixWith;
  const d = s.delve;
  const battle = d?.encounter;
  const active = fieldRecipe(s);
  const terrain = d ? terrainAt(s, d.cell, d.floor) : null;
  const throwReachable =
    !d || target === undefined || glancingSight(fieldFloor(s), d.cell, target, 3);
  const draw =
    terrain && { puddle: 'water', resin: 'sap', oil: 'oil', ice: 'brine', moss: 'sap' }[terrain];
  const available = s.frontier.liquids[liquid];
  const volume = totalLiquid(s);
  return (
    <div className="sa-expkit">
      <FieldStatus s={s} t={t} />
      {terrain && (
        <p className="sa-hint">
          {t(['足元', 'Underfoot', 'あしもと'])} · {t(TERRAIN[terrain].name)}
        </p>
      )}
      <label className="sa-field">
        <span>
          {t(['水筒と液体', 'Flasks and liquids', 'すいとうと えきたい'])} · {volume}/
          {vesselCapacity(s)}
        </span>
        <select value={liquid} onChange={(e) => setLiquid(e.target.value as Liquid)}>
          {LIQUID_IDS.map((id) => (
            <option key={id} value={id}>
              {t(LIQUIDS[id].name)} ×{s.frontier.liquids[id]}
            </option>
          ))}
        </select>
        <small>{t(LIQUIDS[liquid].hint)}</small>
      </label>
      <div className="sa-inline">
        {['water', 'brine', 'sap'].includes(liquid) && (
          <button
            type="button"
            disabled={!available}
            onClick={() => command(send, { kind: 'drink', id: liquid })}
          >
            {t(['飲む', 'Drink', 'のむ'])}
          </button>
        )}
        {d ? (
          <>
            <button
              type="button"
              disabled={!available || !throwReachable}
              onClick={() => command(send, { kind: 'pour', id: liquid, cell: target ?? d.cell })}
            >
              {target === undefined
                ? t(['足元に注ぐ', 'Pour at your feet', 'あしもとへ そそぐ'])
                : t(['狙った場所に投げる', 'Throw at selected tile', 'ねらった ばしょに なげる'])}
            </button>
            {!battle && draw && (
              <button
                type="button"
                disabled={volume >= vesselCapacity(s)}
                onClick={() => command(send, { kind: 'draw', id: draw })}
              >
                {t(['汲む', 'Collect liquid', 'くむ'])} · {t(LIQUIDS[draw].name)}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={
                liquid === 'resin' ||
                volume >= vesselCapacity(s) ||
                s.gold < (liquid === 'water' ? 2 : 4)
              }
              onClick={() => command(send, { kind: 'fill', id: liquid })}
            >
              {t(['水筒に買い足す', 'Fill a flask', 'すいとうに かいたす'])} ·{' '}
              {liquid === 'water' ? 2 : 4} G
            </button>
            <button
              type="button"
              disabled={s.frontier.hydration === s.time}
              onClick={() => command(send, { kind: 'well' })}
            >
              {t(['井戸で水を飲む', 'Drink from the well', 'いどの みずを のむ'])}
            </button>
          </>
        )}
        {!d && fieldCondition(s, 'lost') && (
          <button type="button" onClick={() => command(send, { kind: 'reorient' })}>
            {t(['方角を確かめる', 'Reorient yourself', 'ほうがくを たしかめる'])}
          </button>
        )}
        <button
          type="button"
          disabled={
            !s.goods.herb ||
            (s.hp >= maxHp(s) &&
              !fieldCondition(s, 'spore') &&
              !Object.values(s.frontier.injuries).some((until) => until > s.time))
          }
          onClick={() => command(send, { kind: 'treat' })}
        >
          {t(['手当てする', 'Treat wounds', 'てあてする'])}
        </button>
      </div>
      {!battle && (
        <div className="sa-inline">
          <label className="sa-field">
            <span>{t(['混ぜる液体', 'Mix with', 'まぜる えきたい'])}</span>
            <select value={secondLiquid} onChange={(e) => setMixWith(e.target.value as Liquid)}>
              {mixOptions.map((id) => (
                <option key={id} value={id}>
                  {t(LIQUIDS[id].name)} ×{s.frontier.liquids[id]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={
              !liquidMix(liquid, secondLiquid) || !available || !s.frontier.liquids[secondLiquid]
            }
            onClick={() => command(send, { kind: 'mix', a: liquid, b: secondLiquid })}
          >
            {t(['調合する', 'Mix liquids', 'ちょうごうする'])}
          </button>
        </div>
      )}
      {active && (
        <p className="sa-gold">
          {active.id === 'blend'
            ? `${t(GOODS[active.base].name)} + ${t(BLEND_SPICES[active.spice].name)} · ${t(BLEND_BASES[active.base].hint)} ${t(BLEND_SPICES[active.spice].hint)}`
            : `${t(RECIPES_LAB[active.id].name)} · ${t(RECIPES_LAB[active.id].hint)}`}
        </p>
      )}
      {!battle && (!d || s.goods.fieldKit > 0) && (
        <details className="sa-field-detail">
          <summary>
            {t([
              '材料を組み合わせて料理',
              'Cook a combination meal',
              'ざいりょうを あわせて りょうり',
            ])}
          </summary>
          <div className="sa-fields-grid">
            <label className="sa-field">
              <span>{t(['主材料', 'Main ingredient', 'おもな ざいりょう'])}</span>
              <select value={base} onChange={(event) => setBase(event.target.value as BlendBase)}>
                {(Object.keys(BLEND_BASES) as BlendBase[]).map((id) => (
                  <option key={id} value={id}>
                    {t(GOODS[id].name)} ×{s.goods[id]}
                  </option>
                ))}
              </select>
              <small>{t(BLEND_BASES[base].hint)}</small>
            </label>
            <label className="sa-field">
              <span>{t(['仕上げの材料', 'Seasoning', 'しあげの ざいりょう'])}</span>
              <select
                value={spice}
                onChange={(event) => setSpice(event.target.value as BlendSpice)}
              >
                {(Object.keys(BLEND_SPICES) as BlendSpice[]).map((id) => (
                  <option key={id} value={id}>
                    {t(BLEND_SPICES[id].name)} ×
                    {id === 'sap' ? s.frontier.liquids.sap : s.goods[id]}
                  </option>
                ))}
              </select>
              <small>{t(BLEND_SPICES[spice].hint)}</small>
            </label>
          </div>
          <button
            type="button"
            disabled={
              !s.goods[base] || !(spice === 'sap' ? s.frontier.liquids.sap : s.goods[spice])
            }
            onClick={() => command(send, { kind: 'blend', base, spice })}
          >
            {t(['選んだ材料で料理する', 'Cook your blend', 'えらんだ ざいりょうで りょうり'])}
          </button>
          <div className="sa-action-list">
            {(Object.keys(RECIPES_LAB) as LabMeal[]).map((id) => (
              <button
                key={id}
                type="button"
                disabled={!affordable(s, RECIPES_LAB[id].cost)}
                onClick={() => command(send, { kind: 'cook', id })}
              >
                <span>
                  {t(RECIPES_LAB[id].name)}
                  <small>{t(RECIPES_LAB[id].hint)}</small>
                </span>
                <small>
                  {Object.keys(RECIPES_LAB[id].cost)
                    .map((good) => t(GOODS[good].name))
                    .join(' · ')}
                </small>
              </button>
            ))}
          </div>
        </details>
      )}
      {(TALENTS.some((id) => s.frontier.gifts[id]) ||
        Object.keys(s.frontier.sockets).length > 0) && (
        <details className="sa-field-detail">
          <summary>
            {t(['響きと装着中の機具', 'Powers and fitted devices', 'ひびきと ぎそう'])}
          </summary>
          <div className="sa-action-list">
            {TALENTS.filter((id) => s.frontier.gifts[id]).map((id) => (
              <button
                type="button"
                key={id}
                disabled={
                  !giftReady(s, id) ||
                  (id === 'stagger' && !battle) ||
                  (id === 'guide' && (!battle?.tactics || foe === undefined || battle.guardian)) ||
                  (['echo', 'chisel', 'phase'].includes(id) && (!d || !!battle))
                }
                onClick={() => command(send, { kind: 'invoke', id, target: foe })}
              >
                <span>
                  {t(GIFTS[id].name)} · {s.frontier.gifts[id]}
                  <small>{t(GIFTS[id].hint)}</small>
                </span>
              </button>
            ))}
            {s.frontier.devices
              .filter((item) => deviceEquipped(s, item.serial))
              .map((item) => (
                <button
                  key={item.serial}
                  type="button"
                  disabled={item.charge < deviceCost(item)}
                  onClick={() =>
                    command(send, { kind: 'device', serial: item.serial, verb: 'use' })
                  }
                >
                  <span>{t(DEVICES[item.id].name)}</span>
                  <small>
                    {item.charge}/{deviceCapacity(item)}
                  </small>
                </button>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Camp({ s, send, t }: Props) {
  const [choice, setChoice] = useState<Good>('ration');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'ready' | 'done' | 'error'>('ready');
  const rate = Math.max(1, Math.ceil(marketPrice(s, choice, false) / 2));
  return (
    <div className="sa-town-grid">
      <section className="sa-panel sa-expkit">
        <h2>
          <Droplets size={19} />
          {t(['補給と野営', 'Supplies and camp', 'ほきゅうと やえい'])}
        </h2>
        <p>
          {t(['荷物の重さ', 'Carried weight', 'にもつの おもさ'])} {carriedWeight(s)}/
          {carryCapacity(s)}
        </p>
        <FieldSupplies s={s} send={send} t={t} />
        <div className="sa-inline">
          <label className="sa-field">
            <span>{t(['水と物資を交換', 'Barter with water', 'みずと こうかん'])}</span>
            <select value={choice} onChange={(e) => setChoice(e.target.value as Good)}>
              {GOOD_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(GOODS[id].name)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={s.frontier.liquids.water < rate}
            onClick={() => command(send, { kind: 'barter', good: choice })}
          >
            {t(LIQUIDS.water.name)} ×{rate}
          </button>
        </div>
      </section>
      <section className="sa-panel sa-expkit">
        <h2>{t(['冒険の設定', 'Journey rules', 'ぼうけんの せってい'])}</h2>
        {FRONTIER_RULES.map((id) => (
          <label className="sa-checkbox" key={id}>
            <input
              type="checkbox"
              checked={s.frontier.rules[id]}
              onChange={(e) =>
                command(send, {
                  kind: 'rules',
                  rules: { ...s.frontier.rules, [id]: e.target.checked },
                })
              }
            />
            {t(RULE_LABELS[id])}
          </label>
        ))}
        <label className="sa-field">
          <span>{t(['共有用の設定コード', 'Shareable rule code', 'きょうゆうコード'])}</span>
          <input readOnly value={encodeFieldRules(s.frontier.rules)} />
        </label>
        <div className="sa-inline">
          <label className="sa-field">
            <span>{t(['設定コードを入力', 'Import rule code', 'コードを いれる'])}</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setStatus('ready');
              }}
              maxLength={10}
            />
          </label>
          <button
            type="button"
            disabled={!code.trim()}
            onClick={() => setStatus(command(send, { kind: 'import', code }) ? 'done' : 'error')}
          >
            {t(['読み込む', 'Load rules', 'よみこむ'])}
          </button>
        </div>
        {status !== 'ready' && (
          <p role="status">
            {t(
              status === 'done'
                ? ['設定を読み込んだ。', 'Rules loaded.', 'よみこんだ。']
                : [
                    'この設定コードは読み込めない。',
                    'This rule code could not be read.',
                    'コードを よめなかった。',
                  ],
            )}
          </p>
        )}
        {s.character.deathRule === 'return-town' && (
          <>
            <button type="button" onClick={() => command(send, { kind: 'checkpoint' })}>
              {t([
                'この町を再開地点にする',
                'Set recovery point here',
                'ここを さいかいちてんに する',
              ])}
            </button>
            {s.frontier.checkpoint && (
              <span className="sa-hint">{t(townAt(s.frontier.anchor).name)}</span>
            )}
          </>
        )}
      </section>
    </div>
  );
}

const VIEWS = {
  sites: ['史跡と紀行誌', 'Sites and books', 'しせきと きこうし'],
  training: ['技能と響き', 'Training', 'ぎのうと ひびき'],
  workshop: ['古機具', 'Devices', 'こきぐ'],
  camp: ['補給と設定', 'Camp and rules', 'ほきゅうと せってい'],
} satisfies Record<string, Text>;
export type FieldView = keyof typeof VIEWS;

export function FrontierPanel({
  s,
  send,
  t,
  view,
  changeView,
}: Props & { view: FieldView; changeView: (view: FieldView) => void }) {
  return (
    <div className="sa-stack">
      <nav
        className="sa-journal-tabs"
        aria-label={t(['野外手帳の項目', 'Field guide tabs', 'やがい てちょう'])}
      >
        {(Object.keys(VIEWS) as FieldView[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => changeView(key)}
          >
            {key === 'sites' && <Compass size={17} />}
            {t(VIEWS[key])}
          </button>
        ))}
      </nav>
      {view === 'training' ? (
        <Training s={s} t={t} send={send} />
      ) : view === 'workshop' ? (
        <Workshop s={s} t={t} send={send} />
      ) : view === 'camp' ? (
        <Camp s={s} t={t} send={send} />
      ) : (
        <SiteBook s={s} t={t} send={send} />
      )}
    </div>
  );
}
