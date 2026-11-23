import React, { useState } from 'react';
import { Lock, Swords } from 'lucide-react';
import { ADVANCED_IDS } from './advancedTechniques';
import {
  MAX_MASTERY_USES,
  USES_PER_MASTERY_RANK,
  meetsTechniqueUnlock,
  techniqueFits,
  techniqueFor,
  weaponRank,
  weaponUses,
  type Technique,
  type TechniqueId,
} from './battleTechniques';
import {
  CALLINGS,
  MASTERWORKS,
  RESIDENT_ROLES,
  STATS,
  STAT_IDS,
  WEAPONS,
  type ResidentRole,
  type Text,
  type Weapon,
} from './content';
import { damageNames } from './delve';
import { FOLLOWER_ORDERS } from './frontierContent';
import { gearName } from './inventory';
import { companionLoan, companionParameters } from './party';
import ScreenDialog from './ScreenDialog';
import {
  armor,
  checkBonus,
  equipped,
  maxFocus,
  maxHp,
  scoreFor,
  xpGoal,
  type Adventure,
} from './state';
import { art, CompanionPortrait, Portrait, type Local } from './ui';

export const PARAMETERS_TITLE: Text = [
  '能力・戦闘技',
  'Abilities and techniques',
  'のうりょく・せんとうの わざ',
];
const TABS = {
  hero: ['主人公', 'Hero', 'しゅじんこう'],
  party: ['仲間', 'Companions', 'なかま'],
  techniques: ['技の習得', 'Learn techniques', 'わざを おぼえる'],
} satisfies Record<string, Text>;

export function techniqueImage(id: TechniqueId) {
  const tech = techniqueFor(id)!;
  return art(tech.unlock ? 'techniques/' + id : 'combat/' + tech.art);
}

export function techniqueRequirement(s: Adventure, tech: Technique, t: Local): string {
  const unlock = tech.unlock;
  if (!unlock) return tech.weapon ? t(WEAPONS[tech.weapon].name) : t(CALLINGS[tech.calling!].name);
  switch (unlock.kind) {
    case 'level':
      return (
        t(['必要レベル', 'Required level', 'ひつよう レベル']) +
        ' ' +
        unlock.value +
        ' · Lv. ' +
        s.level
      );
    case 'victories':
      return (
        t(['戦闘勝利', 'Battle victories', 'せんとうの かち']) +
        ' ' +
        Math.min(unlock.value, s.counters.combats) +
        '/' +
        unlock.value
      );
    case 'mastery': {
      const id = tech.weapon!;
      return (
        t(WEAPONS[id].name) +
        ' · ' +
        t(['熟練度', 'Mastery rank', 'じゅくれんど']) +
        ' ' +
        Math.min(unlock.value, weaponRank(s, id)) +
        '/' +
        unlock.value +
        ' (' +
        Math.min(weaponUses(s, id), unlock.value * USES_PER_MASTERY_RANK) +
        '/' +
        unlock.value * USES_PER_MASTERY_RANK +
        ')'
      );
    }
    case 'equipment':
      return (
        t(['装備が必要', 'Equip to use', 'そうびが ひつよう']) +
        ' · ' +
        t(MASTERWORKS[unlock.item].name)
      );
  }
}

function Parameters({ values, t }: { values: Array<[Text, React.ReactNode]>; t: Local }) {
  return (
    <dl className="sa-parameter-grid">
      {values.map(([label, value]) => (
        <div key={label[0]}>
          <dt>{t(label)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type ResidentSummary = { id: string; name: Text; role: ResidentRole };

export function CompanionStats({
  s,
  resident,
  t,
}: {
  s: Adventure;
  resident: ResidentSummary;
  t: Local;
}) {
  const spec = companionParameters(s, resident.id, resident.role);
  const ally = s.delve?.encounter?.allies?.find((member) => member.id === resident.id);
  const gear = companionLoan(s, resident.id);
  const description = spec.healer
    ? (['手当て', 'Healing', 'てあて'] as Text)
    : (['得意属性', 'Attack element', 'とくい ぞくせい'] as Text);
  return (
    <div className="sa-parameters">
      <div className="sa-parameters-head">
        <CompanionPortrait s={s} id={resident.id} role={resident.role} />
        <div>
          <h3>{t(resident.name)}</h3>
          <p>{t(RESIDENT_ROLES[resident.role].job)}</p>
        </div>
      </div>
      <Parameters
        t={t}
        values={[
          [['体力', 'HP', 'たいりょく'], (ally?.hp ?? spec.max) + '/' + (ally?.max ?? spec.max)],
          [['攻撃の基礎威力', 'Base attack', 'こうげきの きそ いりょく'], spec.power],
          [['防御', 'Defense', 'ぼうぎょ'], spec.defense],
          [['射程', 'Attack range', 'しゃてい'], spec.range],
          [description, spec.healer ? spec.healing : t(damageNames[spec.style])],
          [['親しさ', 'Trust', 'したしさ'], spec.trust + '/8'],
          [['思い出', 'Shared memories', 'おもいで'], spec.memories + '/2'],
          [
            ['戦闘での指示', 'Battle order', 'せんとうの しじ'],
            t(
              spec.order === 'balance'
                ? ['おまかせ', 'Automatic', 'おまかせ']
                : FOLLOWER_ORDERS[spec.order],
            ),
          ],
          [
            ['貸し出し装備', 'Loaned gear', 'かしだし そうび'],
            gear ? t(gearName(gear)) : t(['なし', 'None', 'なし']),
          ],
        ]}
      />
    </div>
  );
}

function HeroParameters({ s, t }: { s: Adventure; t: Local }) {
  const weapon = equipped(s, 'weapon');
  return (
    <div className="sa-parameters">
      <div className="sa-parameters-head">
        <Portrait id={s.character.portrait} />
        <div>
          <h3>{s.character.name}</h3>
          <p>
            Lv. {s.level} · {t(CALLINGS[s.character.calling].name)}
          </p>
        </div>
      </div>
      <Parameters
        t={t}
        values={[
          [['体力', 'HP', 'たいりょく'], s.hp + '/' + maxHp(s)],
          [['集中', 'Focus', 'しゅうちゅう'], s.focus + '/' + maxFocus(s)],
          [['経験値', 'Experience', 'けいけんち'], s.xp + '/' + xpGoal(s.level)],
          [['能力ポイント', 'Attribute points', 'のうりょく ポイント'], s.talent],
          [['武器の威力', 'Weapon power', 'ぶきの いりょく'], weapon?.power ?? 0],
          [['防御', 'Defense', 'ぼうぎょ'], armor(s)],
          [['ひらめき', 'Inspiration', 'ひらめき'], s.inspiration],
          [['疲労', 'Fatigue', 'ひろう'], s.fatigue + '/9'],
        ]}
      />
      <div className="sa-parameter-table">
        <table>
          <thead>
            <tr>
              <th scope="col">{t(['能力', 'Attribute', 'のうりょく'])}</th>
              <th scope="col">{t(['基礎', 'Base', 'きそ'])}</th>
              <th scope="col">{t(['装備込み', 'With gear', 'そうびこみ'])}</th>
              <th scope="col">{t(['判定補正', 'Check bonus', 'はんてい ほせい'])}</th>
            </tr>
          </thead>
          <tbody>
            {STAT_IDS.map((id) => (
              <tr key={id}>
                <th scope="row">{t(STATS[id])}</th>
                <td>{s.character.stats[id]}</td>
                <td>{scoreFor(s, id)}</td>
                <td>{checkBonus(s, id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const UNLOCK_GROUPS = {
  victories: ['戦闘の勝利', 'Win battles', 'せんとうに かつ'],
  level: ['レベルアップ', 'Gain levels', 'レベルを あげる'],
  mastery: ['武器の熟練', 'Master weapons', 'ぶきを きわめる'],
  equipment: ['特別な装備', 'Special equipment', 'とくべつな そうび'],
} satisfies Record<string, Text>;

function TechniqueJournal({ s, t }: { s: Adventure; t: Local }) {
  return (
    <div className="sa-techniques sa-learn-techniques">
      <p>
        {t([
          '武器の攻撃を当てると熟練が1、装備した武器で戦闘に勝つと2増えます。熟練6につきランクが1上がります。',
          'Land a weapon attack to gain 1 mastery point. Win with a weapon equipped to gain 2. Every 6 points raises its rank.',
          'ぶきの こうげきが あたると 1ポイント、かつと 2ポイント。6ポイントで ランクが 1あがります。',
        ])}
      </p>
      <div className="sa-mastery">
        {(Object.keys(WEAPONS) as Weapon[]).map((weapon) => {
          const uses = weaponUses(s, weapon),
            rank = weaponRank(s, weapon);
          const full = uses === MAX_MASTERY_USES;
          return (
            <div key={weapon} data-equipped={equipped(s, 'weapon')?.weapon === weapon || undefined}>
              <span>{t(WEAPONS[weapon].name)}</span>
              <b>
                R{rank} · {full ? USES_PER_MASTERY_RANK : uses % USES_PER_MASTERY_RANK}/
                {USES_PER_MASTERY_RANK}
              </b>
            </div>
          );
        })}
      </div>
      {Object.entries(UNLOCK_GROUPS).map(([kind, heading]) => (
        <section key={kind}>
          <h3>{t(heading)}</h3>
          <div className="sa-technique-list">
            {ADVANCED_IDS.filter((id) => techniqueFor(id)?.unlock?.kind === kind).map((id) => {
              const tech = techniqueFor(id)!;
              const learned = meetsTechniqueUnlock(s, tech);
              const usable = learned && techniqueFits(s, tech);
              return (
                <article key={id} data-learned={learned} data-technique-entry={id}>
                  <img src={techniqueImage(id)} alt="" loading="lazy" />
                  <div>
                    <h4>{t(tech.name)}</h4>
                    <p>{t(tech.hint)}</p>
                    <small>{techniqueRequirement(s, tech, t)}</small>
                  </div>
                  <span className="sa-learning-state">
                    {usable ? <Swords size={15} /> : !learned ? <Lock size={15} /> : null}
                    {t(
                      usable
                        ? ['使用可能', 'Available', 'つかえる']
                        : learned
                          ? ['習得済み', 'Learned', 'おぼえた']
                          : ['未解放', 'Locked', 'まだの わざ'],
                    )}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function CharacterParameters({
  s,
  initial,
  t,
  close,
}: {
  s: Adventure;
  initial: string;
  t: Local;
  close: () => void;
}) {
  const [tab, setTab] = useState<keyof typeof TABS>(
    initial === 'hero' || initial === 'techniques' ? initial : 'party',
  );
  const [picked, setPicked] = useState(initial);
  const resident = s.friends[picked]?.resident ?? s.friends[s.followers[0]]?.resident;
  return (
    <ScreenDialog title={t(PARAMETERS_TITLE)} t={t} close={close}>
      <div className="sa-parameter-tabs">
        {(Object.keys(TABS) as Array<keyof typeof TABS>).map((id) => (
          <button key={id} type="button" aria-pressed={id === tab} onClick={() => setTab(id)}>
            {t(TABS[id])}
          </button>
        ))}
      </div>
      {tab === 'hero' ? (
        <HeroParameters s={s} t={t} />
      ) : tab === 'techniques' ? (
        <TechniqueJournal s={s} t={t} />
      ) : resident ? (
        <>
          <label className="sa-field">
            <span>{t(TABS.party)}</span>
            <select value={resident.id} onChange={(event) => setPicked(event.target.value)}>
              {s.followers.map((id) => (
                <option key={id} value={id}>
                  {t(s.friends[id].resident.name)}
                </option>
              ))}
            </select>
          </label>
          <CompanionStats s={s} resident={resident} t={t} />
        </>
      ) : (
        <p className="sa-hint">
          {t([
            '同行者はまだいません。',
            'You are traveling alone.',
            'どうこうしゃは まだ いません。',
          ])}
        </p>
      )}
    </ScreenDialog>
  );
}
