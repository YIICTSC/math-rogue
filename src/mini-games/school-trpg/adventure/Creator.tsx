import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Dice5, Minus, Plus } from 'lucide-react';
import {
  CALLINGS,
  IDEALS,
  ORIGINS,
  STATS,
  STAT_IDS,
  type Calling,
  type Ideal,
  type Origin,
  type Stat,
} from './content';
import {
  CREATION_POINTS,
  PORTRAIT_IDS,
  defaultCharacter,
  freshWorldCode,
  validCharacter,
  type Character,
} from './state';
import { Portrait, type Local } from './ui';
import { ADDRESS_NAMES, DISCIPLINES, ENCOUNTER_RULES, type AddressName, type Discipline, type RunKind } from './frontierContent';
import { FRONTIER_RULES, RULE_LABELS, standardRules } from './frontierState';
import { ACADEMY_WORLD, realmName } from './world';

export default function Creator({
  t,
  onBack,
  onBegin,
}: {
  t: Local;
  onBack: () => void;
  onBegin: (character: Character) => void;
}) {
  const [draft, setDraft] = useState(defaultCharacter);
  const [category, setCategory] = useState<'f' | 'm'>('f');
  const [worldOpen, setWorldOpen] = useState(false);
  const remaining =
    CREATION_POINTS - STAT_IDS.reduce((sum, stat) => sum + draft.stats[stat] - 1, 0);
  const portraits = PORTRAIT_IDS.filter((id) => id.startsWith(category));
  const choose = <K extends keyof Character>(key: K, value: Character[K]) =>
    setDraft((before) => ({ ...before, [key]: value }));
  function adjust(stat: Stat, amount: number) {
    setDraft((before) => {
      const next = before.stats[stat] + amount;
      const spent = STAT_IDS.reduce((sum, key) => sum + before.stats[key] - 1, 0);
      if (next < 1 || next > 4 || (amount > 0 && spent >= CREATION_POINTS)) return before;
      return { ...before, stats: { ...before.stats, [stat]: next } };
    });
  }
  function randomize() {
    const callingIds = Object.keys(CALLINGS) as Calling[];
    const originIds = Object.keys(ORIGINS) as Origin[];
    const idealIds = Object.keys(IDEALS) as Ideal[];
    const sample = <T,>(choices: readonly T[]) =>
      choices[Math.floor(Math.random() * choices.length)];
    const calling = sample(callingIds);
    const stats = { might: 1, finesse: 1, insight: 1, presence: 1 };
    stats[CALLINGS[calling].stat] += 2;
    for (let i = 0; i < CREATION_POINTS - 2; i++)
      stats[sample(STAT_IDS.filter((stat) => stats[stat] < 4))]++;
    setDraft((before) => ({
      ...before,
      stats,
      calling,
      origin: sample(originIds),
      ideal: sample(idealIds),
      portrait: sample(portraits),
    }));
  }
  const calling = CALLINGS[draft.calling];
  const discipline = draft.discipline ?? 'explorer';
  const run = draft.runKind ?? 'classic';
  const rules = draft.fieldRules ?? standardRules();
  return (
    <>
      <header className="sa-top sa-top-simple">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={18} />
          {t(['戻る', 'Back', 'もどる'])}
        </button>
        <h1>{t(['主人公をつくる', 'Create a character', 'しゅじんこうを つくる'])}</h1>
        <button type="button" onClick={randomize}>
          <Dice5 size={18} />
          {t(['おまかせ', 'Randomize', 'おまかせ'])}
        </button>
      </header>
      <form
        className="sa-create"
        onSubmit={(event) => {
          event.preventDefault();
          if (validCharacter(draft)) onBegin(draft);
        }}
      >
        <div className="sa-create-art">
          <figure className="sa-create-preview">
            <Portrait
              id={draft.portrait}
              alt={t(['選択した主人公の立ち絵', 'Selected character portrait'])}
            />
            <figcaption>
              <strong>{draft.name.trim() || t(['旅の主人公', 'Your adventurer'])}</strong>
              <span>{t(calling.name)}</span>
            </figcaption>
          </figure>
          <section className="sa-panel">
            <div className="sa-section-row">
              <h2>{t(['外見', 'Appearance', 'がいけん'])}</h2>
              <div className="sa-segment">
                <button
                  type="button"
                  aria-pressed={category === 'f'}
                  onClick={() => setCategory('f')}
                >
                  {t(['女性', 'Women', 'じょせい'])}
                </button>
                <button
                  type="button"
                  aria-pressed={category === 'm'}
                  onClick={() => setCategory('m')}
                >
                  {t(['男性', 'Men', 'だんせい'])}
                </button>
              </div>
            </div>
            <div
              className="sa-portraits"
              role="group"
              aria-label={t(['主人公イラスト', 'Character portraits'])}
            >
              {portraits.map((id, index) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={draft.portrait === id}
                  aria-label={
                    t(
                      category === 'f'
                        ? ['女性の外見', 'Woman portrait']
                        : ['男性の外見', 'Man portrait'],
                    ) +
                    ' ' +
                    (index + 1)
                  }
                  onClick={() => choose('portrait', id)}
                >
                  <Portrait id={id} lazy />
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="sa-create-fields">
          <section className="sa-panel">
            <h2>{t(['主人公の来歴', 'Your character', 'しゅじんこうの らいれき'])}</h2>
            <label className="sa-field">
              <span>{t(['名前', 'Name', 'なまえ'])}</span>
              <input
                autoComplete="off"
                required
                value={draft.name}
                maxLength={24}
                placeholder={t(['例・アオ', 'e.g. Aoi'])}
                onChange={(e) => choose('name', e.target.value)}
              />
            </label>
            <div className="sa-fields-grid">
              <label className="sa-field">
                <span>{t(['出身', 'Background', 'しゅっしん'])}</span>
                <select
                  value={draft.origin}
                  onChange={(e) => choose('origin', e.target.value as Origin)}
                >
                  {Object.entries(ORIGINS).map(([id, option]) => (
                    <option value={id} key={id}>
                      {t(option.name)}
                    </option>
                  ))}
                </select>
                <small>{t(ORIGINS[draft.origin].hint)}</small>
              </label>
              <label className="sa-field">
                <span>{t(['大切にすること', 'Ideal', 'たいせつに すること'])}</span>
                <select
                  value={draft.ideal}
                  onChange={(e) => choose('ideal', e.target.value as Ideal)}
                >
                  {Object.entries(IDEALS).map(([id, option]) => (
                    <option value={id} key={id}>
                      {t(option.name)}
                    </option>
                  ))}
                </select>
                <small>{t(IDEALS[draft.ideal].hint)}</small>
              </label>
            </div>
            <h3>{t(['得意な立ち回り', 'Calling', 'とくいな たちまわり'])}</h3>
            <div className="sa-calling-list">
              {Object.entries(CALLINGS).map(([id, option]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={draft.calling === id}
                  onClick={() => choose('calling', id as Calling)}
                >
                  {t(option.name)}
                </button>
              ))}
            </div>
            <p className="sa-hint">{t(calling.hint)}</p>
            <details className="sa-field-detail">
              <summary>{t(['流派と旅の設定', 'Discipline and journey rules', 'りゅうはと たびの せってい'])}</summary>
              <div className="sa-fields-grid">
                <label className="sa-field"><span>{t(['流派', 'Discipline', 'りゅうは'])}</span>
                  <select value={discipline} onChange={(e) => choose('discipline', e.target.value as Discipline)}>{Object.entries(DISCIPLINES).map(([id, spec]) => <option key={id} value={id}>{t(spec.name)}</option>)}</select>
                  <small>{t(DISCIPLINES[discipline].hint)}</small>
                </label>
                <label className="sa-field"><span>{t(['冒険の種類', 'Journey type', 'ぼうけんの しゅるい'])}</span>
                  <select value={run} onChange={(e) => choose('runKind', e.target.value as RunKind)}>{Object.entries(ENCOUNTER_RULES).map(([id, spec]) => <option key={id} value={id}>{t(spec.name)}</option>)}</select>
                  <small>{t(ENCOUNTER_RULES[run].hint)}</small>
                </label>
                <label className="sa-field"><span>{t(['呼ばれ方', 'How to address you', 'よばれかた'])}</span>
                  <select value={draft.addressedAs ?? 'name'} onChange={(e) => choose('addressedAs', e.target.value as AddressName)}>{Object.entries(ADDRESS_NAMES).map(([id, name]) => <option key={id} value={id}>{t(name)}</option>)}</select>
                </label>
              </div>
              {FRONTIER_RULES.map((id) => <label key={id} className="sa-checkbox"><input type="checkbox" checked={rules[id]}
                onChange={(e) => choose('fieldRules', { ...rules, [id]: e.target.checked })} />{t(RULE_LABELS[id])}</label>)}
            </details>
          </section>
          <section className="sa-panel">
            <div className="sa-section-row">
              <h2>{t(['能力値', 'Attributes', 'のうりょくち'])}</h2>
              <strong className="sa-gold">
                {t(['残り', 'Points left', 'のこり'])} {remaining}
              </strong>
            </div>
            <div className="sa-ability-grid">
              {STAT_IDS.map((stat) => (
                <div className="sa-ability" key={stat}>
                  <strong>{t(STATS[stat])}</strong>
                  <button
                    type="button"
                    disabled={draft.stats[stat] <= 1}
                    onClick={() => adjust(stat, -1)}
                    aria-label={t(STATS[stat]) + ' −'}
                  >
                    <Minus size={16} />
                  </button>
                  <b>{draft.stats[stat]}</b>
                  <button
                    type="button"
                    disabled={remaining <= 0 || draft.stats[stat] >= 4}
                    onClick={() => adjust(stat, 1)}
                    aria-label={t(STATS[stat]) + ' ＋'}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="sa-hint">
              {t([
                '判定では、20面ダイスの出目に能力などを足し、目標値と比べます。',
                'Checks add your attribute and other bonuses to a twenty-sided die, then compare the total to a target.',
              ])}
            </p>
            <fieldset className="sa-death-options">
              <legend>{t(['倒れたとき', 'When you fall', 'たおれたとき'])}</legend>
              <label>
                <input type="radio" name="death-rule" checked={draft.deathRule === 'permadeath'}
                  onChange={() => choose('deathRule', 'permadeath')} />
                <span><strong>{t(['一度きりの旅', 'One life', 'いちどきりの たび'])}</strong>
                  <small>{t(['力尽きると旅は終了。記録は読み返せます。', 'Falling ends the run. Your journal stays available.', 'ちからつきると たびは おわり。きろくは よみかえせます。'])}</small></span>
              </label>
              <label>
                <input type="radio" name="death-rule" checked={draft.deathRule === 'return-town'}
                  onChange={() => choose('deathRule', 'return-town')} />
                <span><strong>{t(['町から再開', 'Return to town', 'まちから さいかい'])}</strong>
                  <small>{t(['町で手当てを受け、救助費を払って続けます。', 'Recover in town and continue after paying a rescue fee.', 'まちで てあてを うけ、きゅうじょひを はらって つづけます。'])}</small></span>
              </label>
            </fieldset>
            <button
              type="button"
              className="sa-text-button"
              aria-expanded={worldOpen}
              onClick={() => setWorldOpen(!worldOpen)}
            >
              {t(['新しい世界を生成', 'Generate a new world', 'あたらしい せかいを つくる'])} · {t(realmName(draft.world || ACADEMY_WORLD))}
            </button>
            {worldOpen && (
              <div className="sa-inline">
                <label className="sa-field">
                  <span>{t(['世界コードの元', 'World seed', 'せかいコードの もと'])}</span>
                  <input
                    value={draft.world}
                    maxLength={28}
                    onChange={(e) => choose('world', e.target.value)}
                  />
                </label>
                <button type="button" onClick={() => choose('world', freshWorldCode())}>
                  {t(['生成', 'Generate'])}
                </button>
                <button type="button" onClick={() => choose('world', ACADEMY_WORLD)}>
                  {t(['鐘灯領', 'Bellreach'])}
                </button>
              </div>
            )}
          </section>
          <button className="sa-primary sa-begin" type="submit" disabled={!validCharacter(draft)}>
            {t(['この主人公で冒険を始める', 'Begin the adventure', 'ぼうけんを はじめる'])}
            <ArrowRight size={19} />
          </button>
        </div>
      </form>
    </>
  );
}
