import React, { useState } from 'react';
import { BookOpen, Cog, Landmark, MapPin } from 'lucide-react';
import { BIOME_IDS, BIOMES, GOODS, STATS, type Biome, type Text } from './content';
import { FACTIONS, standing, standingName } from './factions';
import { ARCHIVE_CHOICES, CIRCUIT_MODES, type CircuitMode } from './fieldworkState';
import { MECHANISMS, canSetCircuit, circuitAt, historyParts, historyTitle, localHistoryChapter, type CircuitMethod } from './ruinSystems';
import type { Adventure } from './state';
import { addressKey, realmName, townAt } from './world';
import { art, type Local, type Send } from './ui';

const MODIFIER_COPY = {
  light: ['移動時の灯油消費', 'Oil use per step', 'いどうの あぶらの しょうひ'],
  patrol: ['魔物の巡回', 'Creature patrols', 'まものの みまわり'],
  checks: ['仕掛けの判定難度', 'Mechanism check difficulty', 'しかけの はんていの むずかしさ'],
  shards: ['宝箱の遺物片', 'Relic shards in chests', 'たからばこの いぶつへん'],
} satisfies Record<string, Text>;

type PanelProps = { s: Adventure; send: Send; t: Local };

export function RuinFixture({ s, send, t, fixture, shortcut, declare }: PanelProps & { fixture: 'device' | 'inscription'; shortcut: boolean; declare: () => void }) {
  const [picked, setPicked] = useState<CircuitMode>('channel');
  const town = townAt(s.location);
  const declaration = <button type="button" className="sa-text-button" onClick={declare}>{t(['自由宣言', 'Declare', 'じゆうせんげん'])}</button>;
  if (fixture === 'inscription') {
    const part = historyParts(s.location)[localHistoryChapter(s.delve!.floor)];
    const known = (s.fieldwork.histories[addressKey(s.location)]?.chapters ?? 0) & part.bit;
    return <section className="sa-panel sa-find sa-fixture">
      <h2><BookOpen size={18} />{t(historyTitle(s.location))}</h2>
      <p>{known ? t(part.copy) : t(['壁の刻印を読めば、この土地の過去と仕掛けの知識が手に入ります。', 'Read the wall to learn about this place and its mechanisms.', 'かべの きろくを よむと、れきしと しかけが わかります。'])}</p>
      <button type="button" className="sa-primary" disabled={Boolean(known)} onClick={() => send({ type: 'read-inscription' })}>
        {known ? t(['記録済み', 'Recorded', 'きろくずみ']) : t(['刻印を読む', 'Read inscription', 'こくいんを よむ'])} · {t(part.title)}
      </button>
      {declaration}
    </section>;
  }
  const mechanism = MECHANISMS[town.biome];
  const record = circuitAt(s);
  const option = mechanism[picked];
  const approaches = [
    ['history', ['土地の記録を使う', 'Use local history', 'とちの きろくを つかう']],
    ['alliance', ['盟友の技術を借りる', 'Use allied techniques', 'めいゆうの わざを かりる']],
    ['materials', [t(GOODS[mechanism.good].name) + ' ×1', t(GOODS[mechanism.good].name) + ' ×1']],
    ['check', ['能力で試す', 'Attempt a check', 'はんていで ためす']],
  ] satisfies [CircuitMethod, Text][];
  return <section className="sa-panel sa-find sa-fixture">
    <h2><Cog size={18} />{t(mechanism.name)}</h2>
    {!record ? (
      <button type="button" className="sa-primary" onClick={() => send({ type: 'inspect-circuit' })}>
        {t(['配線を調べる', 'Inspect connections', 'はいせんを しらべる'])}
      </button>
    ) : (
      <>
        {record.mode && <p className="sa-gold">{t(['現在', 'Current setting', 'いまの せってい'])} · {t(mechanism[record.mode].name)}</p>}
        <div className="sa-fixture-options" role="group" aria-label={t(['仕掛けの設定', 'Mechanism settings', 'しかけの せってい'])}>
          {CIRCUIT_MODES.map((mode) => <button key={mode} type="button" aria-pressed={picked === mode} onClick={() => setPicked(mode)}>{t(mechanism[mode].name)}</button>)}
        </div>
        <ul className="sa-fixture-effects">
          {Object.entries(option.effects).map(([effect, value]) => <li key={effect}>{t(MODIFIER_COPY[effect as keyof typeof MODIFIER_COPY])} {value > 0 ? '+' : ''}{value}</li>)}
          {shortcut && <li>{picked === 'channel' ? t(['抜け道が開く', 'Opens a shortcut', 'ぬけみちが ひらく']) : t(['抜け道を閉じる', 'Closes the shortcut', 'ぬけみちを とじる'])}</li>}
        </ul>
        {record.mode ? (
          <button type="button" disabled={record.mode === picked} className="sa-primary" onClick={() => send({ type: 'set-circuit', mode: picked, method: 'check' })}>
            {t(['切り替える', 'Change setting', 'きりかえる'])} · 1h
          </button>
        ) : (
          <div className="sa-fixture-options">
            {approaches.map(([method, copy]) => <button key={method} type="button" disabled={!canSetCircuit(s, method)} onClick={() => send({ type: 'set-circuit', mode: picked, method })}>
              {t(copy)}{method === 'check' && ' · ' + t(STATS[mechanism.stat])}
            </button>)}
          </div>
        )}
      </>
    )}
    {declaration}
  </section>;
}

export function FieldNotes({ s, send, t }: PanelProps) {
  const [place, select] = useState(addressKey(s.location));
  const entries = Object.values(s.fieldwork.histories).reverse();
  const entry = s.fieldwork.histories[place] ?? entries[0];
  const biome = entry ? townAt(entry.place).biome : townAt(s.location).biome;
  return (
    <div className="sa-town-grid">
      <section className="sa-panel sa-field-notes">
        <h2><BookOpen size={20} />{t(['遺跡調査録', 'Ruin survey', 'いせき ちょうさろく'])}</h2>
        {!entry ? <p>{t(['遺跡には、三つの深さにまたがる刻印があります。見つけて読むと手掛かりがここに残り、その土地の仕掛けを動かせるようになります。', 'Each ruin preserves inscriptions across three depths. Reading one records a clue here and helps you operate its mechanisms.', 'いせきでは 3つの ふかさで こくいんを さがします。よむと しかけの てがかりを きろくします。'])}</p> : (
          <>
            <label className="sa-field">
              <span>{t(['調査地点', 'Survey site', 'ちょうさ ちてん'])}</span>
              <select value={addressKey(entry.place)} onChange={(event) => select(event.target.value)}>
                {entries.map(({ place: address }) => <option key={addressKey(address)} value={addressKey(address)}>{t(townAt(address).name)} · {t(realmName(address.world))} · {address.x}, {address.y}</option>)}
              </select>
            </label>
            <article className="sa-history-summary">
              <img src={art('expedition/history-' + biome)} alt="" loading="lazy" />
              <div><strong>{t(historyTitle(entry.place))}</strong><small>{t(BIOMES[biome].ruin)}</small></div>
            </article>
            <ol className="sa-history-chapters">
              {historyParts(entry.place).map((part, index) => (
                <li key={part.bit}><strong>B{index + 1} · {t(part.title)}</strong>
                  <p>{entry.chapters & part.bit ? t(part.copy) : t(['断片を探す', 'Find the inscription', 'だんぺんを さがす'])}</p></li>
              ))}
            </ol>
            {entry.chapters === 7 && (entry.filed ? (
              <p className="sa-gold">{entry.filed === 'publish' ? t(['閲覧棚で公開済み', 'Published in the archive', 'こうかいずみ']) : t(['土地へ返却済み', 'Returned to its custodians', 'へんきゃくずみ'])}</p>
            ) : (
              <div className="sa-fixture-options">
                {ARCHIVE_CHOICES.map((choice) => <button type="button" key={choice} onClick={() => send({ type: 'file-history', key: addressKey(entry.place), choice })}>
                  {choice === 'publish' ? t(['記録院で公開する · 評判＋3・経験値', 'Publish · Archive standing +3 and XP', 'こうかいする · ひょうばん＋3・けいけんち']) : t(['土地に返す · 地元の評判＋3・遺物片', 'Return · Local standing +3 and relic shards', 'かえす · ひょうばん＋3・いぶつへん'])}
                </button>)}
              </div>
            ))}
          </>
        )}
      </section>
      <section className="sa-panel sa-field-notes">
        <h2><Landmark size={20} />{t(['各組織との関係', 'Faction relations', 'そしきとの かんけい'])}</h2>
        <p className="sa-hint">{t(['遠征の報告、住民への協力、守護者との交渉で評判が変わります。友好以上は商店が値引きし、盟友は街道の案内や遺跡の修繕にも力を貸します。', 'Expeditions, favors and dealings with wardens change your standing. Friendly groups offer discounts. Allies guide you on roads and help with ancient mechanisms.', 'えんせい、てつだい、こうしょうで ひょうばんが かわります。なかよくなると みちや しかけで たすけて くれます。'])}</p>
        <div className="sa-faction-list">
          {BIOME_IDS.map((id) => <FactionCard key={id} id={id} s={s} t={t} />)}
        </div>
      </section>
    </div>
  );
}

function FactionCard({ id, s, t }: { id: Biome; s: Adventure; t: Local }) {
  const faction = FACTIONS[id];
  const rep = standing(s, id);
  return <article className="sa-faction-card" data-wary={rep <= -3 || undefined}>
    <img src={art('expedition/faction-' + id)} alt="" loading="lazy" />
    <div><strong>{t(faction.name)}</strong><small>{t(faction.line)}</small></div>
    <span className="sa-faction-standing"><MapPin size={13} aria-hidden="true" />{t(standingName(rep))} {rep}</span>
  </article>;
}
