import React, { useState } from 'react';
import { ArrowRight, BookOpen, Check, Compass, MapPin, Sparkles, Utensils } from 'lucide-react';
import { BIOMES, BIOME_IDS, FOES, GOODS, STATS, creatureArt } from './content';
import { damageNames } from './delve';
import { atSource, atStation, canReportExpedition, expeditionDone, expeditionStageCopy, localRoutes, objectiveCost, scoutCost } from './expeditions';
import { OBJECTIVES, RELICS, ROUTE_BY_ID, ROUTES } from './journeyContent';
import { maxExpeditionRank, regionalMastery, totalRoutes, type Expedition } from './journeyState';
import { MEAL_IDS, mealRecipe } from './provisions';
import type { Adventure } from './state';
import { realmName, townAt } from './world';
import { art, type Local, type Send } from './ui';

type PanelProps = { s: Adventure; t: Local; send: Send };
type BoardProps = PanelProps & { showMap: () => void; showLife: () => void };

export function ExpeditionProgress({ s, e, t }: { s: Adventure; e: Expedition; t: Local }) {
  const route = ROUTE_BY_ID[e.id];
  const stage = e.stage === 'scout' ? 'scout' : expeditionDone(s, e) ? 'report' : 'task';
  return (
    <div className="sa-expedition-progress">
      <b>{t(expeditionStageCopy[stage])}</b>
      {stage === 'task' && (
        <span>
          {t(OBJECTIVES[route.objective])} · {route.objective === 'warden'
            ? 'B' + e.floor
            : route.objective === 'supply'
              ? t(GOODS[route.material].name) + ' ' + s.goods[route.material] + '/' + objectiveCost(e)
              : e.progress + '/' + e.target}
        </span>
      )}
      {stage !== 'task' && <span>{t(townAt(stage === 'scout' ? e.station : e.source).name)}</span>}
    </div>
  );
}

function ActiveExpedition({ s, e, send, t, showMap, showLife }: BoardProps & { e: Expedition }) {
  const route = ROUTE_BY_ID[e.id];
  const canScout = e.stage === 'scout' && atStation(s, e);
  const canReport = canReportExpedition(s, e);
  const canMove = e.stage === 'scout' ? !atStation(s, e) : !atSource(s, e);
  const destination = e.stage === 'scout' ? e.station : e.source;
  const townObjective = route.objective === 'craft' || route.objective === 'fieldwork' || route.objective === 'supply';
  const steps = [expeditionStageCopy.scout, expeditionStageCopy.task, expeditionStageCopy.report];
  const step = e.stage === 'scout' ? 0 : expeditionDone(s, e) ? 2 : 1;
  return (
    <section className="sa-panel sa-active-expedition">
      <img src={art('expedition/route-' + route.id)} alt="" />
      <div className="sa-stack">
        <div className="sa-section-row">
          <h2>{t(route.name)}</h2>
          <b className="sa-gold">{t(['遠征ランク', 'Expedition rank', 'えんせいランク'])} {e.rank}</b>
        </div>
        <p>{t(e.stage === 'scout' ? route.brief : route.discovery)}</p>
        <ol className="sa-expedition-steps">
          {steps.map((label, i) => (
            <li key={label[1]} aria-current={i === step ? 'step' : undefined}>
              {i < step && <Check size={15} aria-label={t(['完了', 'Complete'])} />}{t(label)}
            </li>
          ))}
        </ol>
        <div className="sa-expedition-location">
          <MapPin size={20} aria-hidden="true" />
          <div>
            <strong>{t(townAt(destination).name)}</strong>
            <span className="sa-hint">{' '}{destination.x}, {destination.y}{destination.world !== s.location.world && ' · ' + t(realmName(destination.world))}</span>
            {step === 1 && <ExpeditionProgress s={s} e={e} t={t} />}
          </div>
        </div>
        {canScout && (
          <>
            <div className="sa-inline">
              <button type="button" className="sa-primary" onClick={() => send({ type: 'expedition-scout', approach: 'test' })}>
                {t(['聞き込みで調べる', 'Investigate the clue', 'ききこみで しらべる'])} · {t(STATS[route.stat])}
              </button>
              <button type="button" disabled={s.goods[route.material] < scoutCost(e)} onClick={() => send({ type: 'expedition-scout', approach: 'supply' })}>
                {t(['素材を渡して協力を頼む', 'Ask for help with materials', 'そざいを わたして たのむ'])} · {t(GOODS[route.material].name)} ×{scoutCost(e)}
              </button>
            </div>
            <p className="sa-hint">{t(['聞き込みに成功するか素材を渡すと、遠征の報酬が増えます。', 'A successful check or gift of materials improves the expedition reward.', 'ききこみの せいこうか、そざいで ほうしゅうが ふえます。'])}</p>
          </>
        )}
        {canMove && <button type="button" className="sa-primary" onClick={showMap}><Compass size={17} />{t(['地図で確かめる', 'Find it on the map', 'ちずで たしかめる'])}</button>}
        {canReport && <button type="button" className="sa-primary" onClick={() => send({ type: 'expedition-finish' })}>{t(['遠征を報告する', 'Report expedition', 'えんせいを ほうこくする'])}</button>}
        {!canMove && step === 1 && (townObjective ? (
          <button type="button" className="sa-primary" onClick={showLife}>{t(['町の施設へ', 'Town facilities', 'まちの しせつへ'])}</button>
        ) : (
          <div className="sa-inline">
            <button type="button" className="sa-primary" onClick={() => send({ type: 'enter', floor: route.objective === 'warden' ? e.floor : 1 })}>
              {t(['遠征先の遺跡へ', 'Enter the expedition ruins', 'えんせいさきの いせきへ'])}
            </button>
            {route.objective === 'accord' && s.journey.formation !== 'envoy' && (
              <button type="button" onClick={() => send({ type: 'formation', id: 'envoy' })}>{t(['戦闘方針を「和解」にする', 'Set formation to Negotiate', 'せんとうの ほうしんを わかいにする'])}</button>
            )}
          </div>
        ))}
        <details className="sa-expedition-abandon">
          <summary>{t(['依頼を取り下げる', 'Withdraw this expedition', 'いらいを とりさげる'])}</summary>
          <button type="button" onClick={() => send({ type: 'expedition-abandon' })}>
            {t(['この遠征を終了する', 'End this expedition', 'この えんせいを おわる'])}
          </button>
        </details>
      </div>
    </section>
  );
}

export function ExpeditionBoard({ s, send, t, showMap, showLife }: BoardProps) {
  const routes = localRoutes(s);
  const [choice, choose] = useState(routes[0].id);
  const [difficulty, setDifficulty] = useState(1);
  const selected = routes.find((route) => route.id === choice) ?? routes[0];
  const maximum = maxExpeditionRank(s);
  const rank = Math.min(difficulty, maximum);
  if (s.journey.expedition) return <ActiveExpedition s={s} t={t} send={send} e={s.journey.expedition} showMap={showMap} showLife={showLife} />;
  return (
    <section className="sa-panel sa-expedition-board">
      <div className="sa-section-row">
        <h2><Compass size={21} />{t(['遠征掲示板', 'Expedition board', 'えんせい けいじばん'])}</h2>
        <span className="sa-gold">{t(['報告済み', 'Reports filed', 'ほうこくずみ'])} {totalRoutes(s)}</span>
      </div>
      <div className="sa-expedition-cards" role="group" aria-label={t(['地元の遠征', 'Local expeditions', 'この まちの えんせい'])}>
        {routes.map((route) => {
          const record = s.journey.expeditions[route.id];
          return (
            <button key={route.id} className="sa-expedition-card" aria-pressed={selected.id === route.id} type="button" onClick={() => choose(route.id)}>
              <img src={art('expedition/route-' + route.id)} alt="" />
              <span>
                <strong>{t(route.name)}</strong>
                <small className="sa-card-objective">{t(OBJECTIVES[route.objective])}</small>
                {record && <small>{t(['最高ランク', 'Best rank', 'さいこうランク'])} {record.best} · ×{record.clears}</small>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="sa-expedition-accept">
        <div><strong>{t(selected.name)}</strong><small className="sa-selected-objective">{t(OBJECTIVES[selected.objective])}</small><p>{t(selected.brief)}</p></div>
        <div className="sa-inline">
          <label className="sa-field">
            <span>{t(['遠征ランク', 'Expedition rank', 'えんせいランク'])}</span>
            <select value={rank} onChange={(event) => setDifficulty(Number(event.target.value))}>
              {Array.from({ length: maximum }, (_, i) => <option value={i + 1} key={i}>{i + 1}</option>)}
            </select>
          </label>
          <button className="sa-primary" type="button" onClick={() => send({ type: 'expedition-start', id: selected.id, rank })}>
            {t(['遠征を引き受ける', 'Accept expedition', 'えんせいを ひきうける'])}<ArrowRight size={17} />
          </button>
        </div>
      </div>
      <p className="sa-hint">{t(['遠征を3回報告するごとに、新しいランクが解禁されます。', 'Every three reports unlock a higher rank.', '3かい ほうこくするごとに ランクが ひらきます。'])}</p>
    </section>
  );
}

export function JourneyCollection({ s, send, t }: PanelProps) {
  const [region, setRegion] = useState(townAt(s.location).biome);
  const creatures = FOES.flatMap((foe, index) => {
    const record = s.journey.bestiary[index];
    return foe.warden && !foe.artKey && !record ? [] : [{ foe, index, record }];
  });
  const known = creatures.filter(({ record }) => record?.encounters).length;
  const cleared = Object.keys(s.journey.expeditions).length;
  return (
    <div className="sa-stack">
      <section className="sa-panel">
        <div className="sa-section-row">
          <h2><Sparkles size={20} />{t(['遠征の遺物', 'Expedition relics', 'えんせいの いぶつ'])}</h2>
          <span className="sa-gold">{t(['踏破', 'Routes completed', 'とうは'])} {cleared}/{ROUTES.length}</span>
        </div>
        <p className="sa-hint">{t(['地方の遠征を1種類報告すると遺物を獲得し、3種類達成で効果が強くなります。装備できる遺物は1つです。', 'Complete one distinct route in a region to gain its relic, and three to strengthen it. Equip one relic at a time.', 'ちほうで 1しゅるい ほうこくすると いぶつを もらい、3しゅるいで つよくなる。そうびは ひとつ。'])}</p>
        <div className="sa-collection-grid">
          {BIOME_IDS.map((id) => {
            const relic = RELICS[id];
            const mastery = regionalMastery(s, id);
            const worn = s.journey.relic === id;
            return (
              <article key={id} className="sa-collection-card" data-equipped={worn || undefined}>
                <img src={art('expedition/' + relic.art)} alt="" loading="lazy" />
                <span><strong>{t(relic.name)}</strong><small>{t(BIOMES[id].name)} · {mastery}/4</small><small>{t(relic.effect)}</small></span>
                <button type="button" disabled={!mastery} aria-pressed={worn} onClick={() => send({ type: 'equip-relic', biome: worn ? null : id })}>
                  {worn ? t(['外す', 'Unequip', 'はずす']) : mastery ? t(['装備する', 'Equip', 'そうびする']) : t(['未獲得', 'Locked', 'みかくとく'])}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="sa-panel">
        <div className="sa-section-row">
          <h2><BookOpen size={20} />{t(['魔物図鑑', 'Bestiary', 'まもの ずかん'])} {known}/{creatures.length}</h2>
          <label className="sa-field"><span>{t(['地方', 'Region', 'ちほう'])}</span>
            <select value={region} onChange={(event) => setRegion(event.target.value as typeof region)}>
              {BIOME_IDS.map((id) => <option key={id} value={id}>{t(BIOMES[id].name)}</option>)}
            </select>
          </label>
        </div>
        <div className="sa-collection-grid">
          {creatures.filter(({ foe }) => foe.theme === region).map(({ foe: creature, index, record }) => {
            return (
              <article className="sa-collection-card" key={index}>
                {record?.encounters ? <img src={art(creatureArt(creature))} alt="" loading="lazy" /> : <span className="sa-unseen-creature" aria-hidden="true">?</span>}
                {record?.encounters ? (
                  <span>
                    <strong>{t(creature.name)}</strong>
                    <small>{t(['遭遇', 'Encounters', 'そうぐう'])} {record.encounters} · {t(['勝利', 'Victories', 'しょうり'])} {record.victories} · {t(['和解', 'Accords', 'わかい'])} {record.accords}</small>
                    <small>{t(['弱点', 'Weakness', 'じゃくてん'])} {t(damageNames[creature.weak])} · {t(['耐性', 'Resistance', 'たいせい'])} {t(damageNames[creature.resist])}</small>
                  </span>
                ) : <span>{t(['未遭遇', 'Unseen', 'みそうぐう'])}</span>}
              </article>
            );
          })}
        </div>
      </section>
      <section className="sa-panel">
        <h2><Utensils size={20} />{t(['旅の味覚録', 'Regional dishes', 'たびの あじの きろく'])} {s.journey.tasted.length}/{MEAL_IDS.length}</h2>
        <div className="sa-collection-grid">
          {MEAL_IDS.map((id) => {
            const recipe = mealRecipe(id);
            return <article className="sa-collection-card" key={id}>
              <img src={art('expedition/' + id)} alt="" loading="lazy" />
              <span><strong>{t(recipe.name)}</strong><small>{t(BIOMES[recipe.biome].name)} · {s.journey.tasted.includes(id) ? t(['食べた', 'Tasted', 'たべた']) : t(['まだ', 'Untasted', 'まだ'])}</small></span>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}
