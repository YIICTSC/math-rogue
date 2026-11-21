import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Backpack,
  BookOpen,
  Compass,
  Dice5,
  Heart,
  HeartHandshake,
  Home,
  Map,
  Plus,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import type {
  AnswerMode,
  AssignmentAnswerResult,
  AssignmentPayload,
  GameMode,
  LanguageMode,
} from '../../../types';
import MiniGameProblemChallenge from '../../../components/MiniGameProblemChallenge';
import { audioService } from '../../../services/audioService';
import {
  AFFIXES,
  CALLINGS,
  DECLARATIONS,
  GOODS,
  GOOD_IDS,
  SLOT_NAMES,
  STATS,
  STAT_IDS,
  type Stat,
  type Text,
} from './content';
import DelveView, { Supplies } from './Delve';
import { declarationDifficulty } from './delve';
import { BADGES, badgeProgress, type BadgeId } from './guild';
import { gearName, gearType, gearValue, SLOT_IDS } from './inventory';
import { LifePanel, PeoplePanel, TownOverview, WorldMap } from './Town';
import { checkBonus, equipped, maxFocus, maxHp, scoreFor, xpGoal, type Adventure } from './state';
import type { SaveResult } from './save';
import { addressKey, dayAt, hourAt, townAt, weatherAt } from './world';
import { DiceResult, Portrait, type Local, type Send } from './ui';

export interface PlayProps {
  state: Adventure;
  send: Send;
  t: Local;
  language: LanguageMode;
  mode: GameMode;
  modePool?: string[];
  answerMode?: AnswerMode;
  assignment?: AssignmentPayload | null;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
  back: () => void;
  saveResult: SaveResult;
  retrySave: () => void;
}

const NAV = {
  town: { name: ['探索', 'Explore', 'たんさく'], icon: Compass },
  map: { name: ['地図', 'Map', 'ちず'], icon: Map },
  life: { name: ['暮らし', 'Town life', 'くらし'], icon: Home },
  people: { name: ['交流', 'People', 'こうりゅう'], icon: HeartHandshake },
  gear: { name: ['持ち物', 'Gear', 'もちもの'], icon: Backpack },
  journal: { name: ['旅日誌', 'Journal', 'たびにっし'], icon: BookOpen },
} satisfies Record<string, { name: Text; icon: typeof Compass }>;
type Tab = keyof typeof NAV;

const SAVE_COPY: Record<Exclude<SaveResult, 'saved'>, Text> = {
  changed: [
    '別の画面でセーブが更新されました。この画面の進行は一時データです。',
    'This save changed in another window. Progress here is temporary.',
  ],
  full: [
    '記録欄がいっぱいです。この冒険はまだ保存されていません。',
    'No save slots are free. This adventure has not been saved yet.',
  ],
  unavailable: [
    'セーブできませんでした。進行を残すには、保存を再試行してください。',
    'Could not save. Retry saving to keep your progress.',
  ],
};

function CharacterStatus({ s, t, back }: { s: Adventure; t: Local; back: () => void }) {
  const day = dayAt(s.time),
    hour = String(hourAt(s.time)).padStart(2, '0');
  return (
    <header className="sa-top sa-status">
      <button type="button" onClick={back}>
        <ArrowLeft size={18} />
        {t(['タイトルへ', 'Title', 'タイトルへ'])}
      </button>
      <div className="sa-hero-status">
        <Portrait id={s.character.portrait} />
        <span>
          <strong>{s.character.name}</strong>
          <small>
            Lv. {s.level} · {t(CALLINGS[s.character.calling].name)}
          </small>
        </span>
      </div>
      <div className="sa-health" aria-label={t(['主人公の状態', 'Character status'])}>
        <span>
          <Heart size={15} />
          HP{' '}
          <b>
            {s.hp}/{maxHp(s)}
          </b>
          <progress value={s.hp} max={maxHp(s)} aria-label="HP" />
        </span>
        <span>
          <Sparkles size={15} />
          {t(['集中', 'Focus'])}{' '}
          <b>
            {s.focus}/{maxFocus(s)}
          </b>
          <progress value={s.focus} max={maxFocus(s)} aria-label={t(['集中', 'Focus'])} />
        </span>
      </div>
      <div className="sa-clock">
        <strong>{s.gold} G</strong>
        <span>
          {t(['日', 'Day'])} {day} · {hour}:00
        </span>
        <small>
          {t(weatherAt(s.location, s.time))} · {t(['疲労', 'Fatigue'])} {s.fatigue}/9
        </small>
      </div>
    </header>
  );
}

function GearPanel({ s, send, t }: { s: Adventure; send: Send; t: Local }) {
  const [filter, setFilter] = useState<'all' | 'weapon' | 'coat' | 'charm'>('all');
  return (
    <div className="sa-town-grid">
      <div className="sa-stack">
        <section className="sa-panel">
          <h2>{t(['装備中', 'Equipped', 'そうびちゅう'])}</h2>
          <dl className="sa-equipment">
            {SLOT_IDS.map((slot) => {
              const gear = equipped(s, slot);
              return (
                <div key={slot}>
                  <dt>{t(SLOT_NAMES[slot])}</dt>
                  <dd>{gear ? t(gearName(gear)) + ' +' + gear.power : '–'}</dd>
                </div>
              );
            })}
          </dl>
        </section>
        <section className="sa-panel">
          <h2>{t(['能力と成長', 'Attributes and growth'])}</h2>
          <div className="sa-section-row">
            <b>
              Lv. {s.level} · XP {s.xp}/{xpGoal(s.level)}
            </b>
            <span className="sa-gold">
              {t(['成長ポイント', 'Growth points'])} {s.talent}
            </span>
          </div>
          <div className="sa-action-list">
            {STAT_IDS.map((stat) => (
              <div key={stat} className="sa-section-row">
                <div>
                  <strong>
                    {t(STATS[stat])} {scoreFor(s, stat)}
                  </strong>
                  <small className="sa-hint">
                    {' '}
                    · {t(['判定補正', 'Check bonus'])} {checkBonus(s, stat) >= 0 ? '+' : ''}
                    {checkBonus(s, stat)}
                  </small>
                </div>
                <button
                  type="button"
                  disabled={!s.talent || s.character.stats[stat] >= 12}
                  onClick={() => send({ type: 'train', stat })}
                  aria-label={t(['伸ばす', 'Train']) + ' · ' + t(STATS[stat])}
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="sa-panel">
          <h2>{t(['素材と道具', 'Supplies and materials'])}</h2>
          <Supplies state={s} send={send} t={t} />
          <div className="sa-goods-grid">
            {GOOD_IDS.filter((id) => s.goods[id] > 0).map((id) => (
              <span key={id}>
                {t(GOODS[id].name)} <b>×{s.goods[id]}</b>
              </span>
            ))}
          </div>
        </section>
      </div>
      <section className="sa-panel">
        <div className="sa-section-row">
          <h2>
            {t(['装備袋', 'Gear bag'])} <small>{s.gear.length}/120</small>
          </h2>
          <label className="sa-field">
            <span>{t(['種類', 'Type'])}</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
            >
              <option value="all">{t(['すべて', 'All gear'])}</option>
              {SLOT_IDS.map((slot) => (
                <option key={slot} value={slot}>
                  {t(SLOT_NAMES[slot])}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="sa-gear-list">
          {s.gear
            .filter((gear) => filter === 'all' || filter === gear.slot)
            .map((gear) => {
              const worn = s.equipment[gear.slot] === gear.id;
              return (
                <div className="sa-gear" key={gear.id} data-rarity={gear.rarity}>
                  <div>
                    <strong>
                      {t(gearName(gear))} +{gear.power}
                    </strong>
                    <p>
                      {t(gearType(gear))}
                      {gear.affix && ' · ' + t(AFFIXES[gear.affix].hint)}
                    </p>
                  </div>
                  {worn ? (
                    <small>{t(['装備中', 'Equipped'])}</small>
                  ) : (
                    <div className="sa-inline">
                      <button type="button" onClick={() => send({ type: 'equip', id: gear.id })}>
                        {t(['装備', 'Equip'])}
                      </button>
                      <button type="button" onClick={() => send({ type: 'salvage', id: gear.id })}>
                        {t(['分解', 'Salvage'])}
                      </button>
                      <button
                        type="button"
                        onClick={() => send({ type: 'sell-gear', id: gear.id })}
                      >
                        {t(['売却', 'Sell'])} {gearValue(gear)} G
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}

function TravelJournal({ s, send, t }: { s: Adventure; send: Send; t: Local }) {
  const [draft, setDraft] = useState('');
  const metrics: Array<[Text, number]> = [
    [['世界', 'Realms'], Object.keys(s.gates).length],
    [['訪れた町', 'Towns visited'], Object.keys(s.knownTowns).length],
    [['発見した名所', 'Landmarks discovered'], s.counters.landmarks],
    [['友達', 'Friends'], Object.values(s.friends).filter((person) => person.trust >= 4).length],
    [['終えた依頼', 'Commissions fulfilled'], s.counters.contracts],
    [['仕事', 'Jobs done'], s.counters.jobs],
    [['収穫', 'Garden plots harvested'], s.counters.harvests],
    [['製作', 'Items made'], s.counters.crafted],
    [['勝利', 'Battles won'], s.counters.combats],
    [['話し合いで解決', 'Conflicts resolved by parley'], s.counters.pacified],
    [['通行の証', 'Guardian passages earned'], s.counters.guardians],
    [['最深階', 'Deepest floor cleared'], Math.max(0, ...Object.values(s.deepest))],
  ];
  return (
    <div className="sa-town-grid">
      <div className="sa-stack">
        <section className="sa-panel">
          <h2>{t(['自分の目標', 'Personal goals', 'じぶんの もくひょう'])}</h2>
          <form
            className="sa-inline"
            onSubmit={(event) => {
              event.preventDefault();
              if (send({ type: 'goal', text: draft })) setDraft('');
            }}
          >
            <input
              value={draft}
              maxLength={100}
              onChange={(event) => setDraft(event.target.value)}
              autoComplete="off"
              aria-label={t(['自分の目標', 'Personal goal'])}
              placeholder={t(['例・海辺に庭付きの家を持つ', 'e.g. Own a house by the sea'])}
            />
            <button className="sa-primary" type="submit" disabled={!draft.trim()}>
              {t(['書き留める', 'Add goal'])}
            </button>
          </form>
          <ul className="sa-goals">
            {s.goals.map((goal) => (
              <li key={goal.id} data-complete={goal.complete || undefined}>
                <span>{goal.text}</span>
                {goal.complete ? (
                  <small>{t(['達成', 'Complete'])}</small>
                ) : (
                  <button
                    type="button"
                    onClick={() => send({ type: 'complete-goal', id: goal.id })}
                  >
                    {t(['達成を記録', 'Mark complete'])}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className="sa-panel">
          <h2>{t(['旅の称号', 'Adventurer titles', 'たびの しょうごう'])}</h2>
          <div className="sa-badges">
            {(Object.keys(BADGES) as BadgeId[]).map((id) => {
              const badge = BADGES[id];
              const { rank, current, target } = badgeProgress(s, id);
              return (
                <div key={id}>
                  <span>
                    <strong>{t(badge.name)}</strong>
                    <small>{t(badge.goal)}</small>
                    <small>
                      {t(['次の段', 'Next rank'])} {rank} · {Math.min(current, target)}/{target}
                    </small>
                  </span>
                  <button
                    type="button"
                    disabled={current < target}
                    onClick={() => send({ type: 'badge', id })}
                  >
                    {t(['報酬', 'Claim'])}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        <section className="sa-panel">
          <h2>{t(['これまでの旅', 'Travel record'])}</h2>
          <dl className="sa-metrics">
            {metrics.map(([label, count]) => (
              <div key={label[1]}>
                <dt>{t(label)}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <section className="sa-panel">
        <h2>{t(['最近のできごと', 'Recent events'])}</h2>
        <ol className="sa-event-list">
          {s.journal.map((entry, index) => (
            <li key={index} data-tone={entry.tone}>
              <small>
                {t(['日', 'Day'])} {dayAt(entry.dayHour)} ·{' '}
                {String(hourAt(entry.dayHour)).padStart(2, '0')}:00
              </small>
              <p>{t(entry.text)}</p>
              {entry.check && <DiceResult check={entry.check} t={t} />}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Declaration({
  s,
  send,
  t,
  close,
}: {
  s: Adventure;
  send: Send;
  t: Local;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [statement, setStatement] = useState('');
  const [stat, setStat] = useState<Stat>(CALLINGS[s.character.calling].stat);
  const [inspiration, setInspiration] = useState(false);
  useEffect(() => {
    const windowDialog = dialog.current;
    windowDialog?.showModal();
    return () => windowDialog?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="sa-dialog"
      aria-labelledby="sa-declare-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.currentTarget === event.target) close();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (send({ type: 'declare', statement, stat, inspiration })) close();
        }}
      >
        <div className="sa-section-row">
          <h2 id="sa-declare-title">{t(['自由宣言', 'Declare an action', 'じゆうせんげん'])}</h2>
          <button type="button" onClick={close} aria-label={t(['閉じる', 'Close'])}>
            <X size={18} />
          </button>
        </div>
        <label className="sa-field">
          <span>{t(['何を試す？', 'What will you try?'])}</span>
          <textarea
            required
            autoFocus
            value={statement}
            maxLength={120}
            rows={2}
            onChange={(event) => setStatement(event.target.value)}
            placeholder={t(
              s.delve
                ? ['例・守護者に通路の由来を尋ねる', 'e.g. Ask the guardian who built this passage']
                : ['例・工匠の荷物を広場まで運ぶ', 'e.g. Carry the smith’s supplies to the square'],
            )}
          />
        </label>
        <div className="sa-approaches" role="group" aria-label={t(['試すやり方', 'Approach'])}>
          {STAT_IDS.map((id) => (
            <button type="button" key={id} aria-pressed={stat === id} onClick={() => setStat(id)}>
              <strong>{t(DECLARATIONS[id].name)}</strong>
              <small>
                {t(STATS[id])} · {t(s.delve ? DECLARATIONS[id].dungeon : DECLARATIONS[id].town)}
              </small>
            </button>
          ))}
        </div>
        <p className="sa-hint">
          {t([
            '宣言文を旅日誌に記録し、選んだやり方で結果を判定します。',
            'Your statement goes in the journal. The approach you choose determines the mechanical result.',
          ])}
        </p>
        <div className="sa-section-row">
          <label className="sa-checkbox">
            <input
              type="checkbox"
              checked={inspiration}
              disabled={!s.inspiration}
              onChange={(event) => setInspiration(event.target.checked)}
            />
            {t(['ひらめきを使う', 'Spend Inspiration'])} ({s.inspiration})
          </label>
          <span className="sa-gold">
            DC {declarationDifficulty(s, stat)} · {checkBonus(s, stat) >= 0 ? '+' : ''}
            {checkBonus(s, stat)}
          </span>
        </div>
        {inspiration && (
          <p className="sa-hint">
            {t(['2個振って、大きい出目を使います。', 'Roll twice and keep the higher result.'])}
          </p>
        )}
        <button className="sa-primary sa-begin" type="submit" disabled={!statement.trim()}>
          <Dice5 size={18} />
          {t(['ダイスを振る', 'Roll the dice', 'ダイスを ふる'])}
        </button>
      </form>
    </dialog>
  );
}

export default function AdventurePlay(props: PlayProps) {
  const {
    state: s,
    t,
    send,
    back,
    saveResult,
    retrySave,
    language,
    mode,
    modePool,
    answerMode,
    assignment,
    onAnswerResult,
  } = props;
  const [tab, setTab] = useState<Tab>('town');
  const [declare, setDeclare] = useState(false);
  const [lesson, setLesson] = useState(false);
  const delving = !!s.delve;
  const bgm = lesson ? 'math' : s.delve?.encounter ? 'battle' : delving ? 'dungeon_library' : 'map';
  useEffect(() => audioService.acquireBgmScene(bgm, undefined, 24), [bgm]);
  const latest = s.journal[0];
  const recentCheck = s.journal.slice(0, 3).find((entry) => entry.check)?.check;
  const main = useRef<HTMLDivElement>(null);
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [tab, delving, lesson]);
  const openDeclaration = () => setDeclare(true);
  return (
    <>
      <CharacterStatus s={s} t={t} back={back} />
      {!delving && !lesson && (
        <nav className="sa-nav" aria-label={t(['冒険メニュー', 'Adventure menu'])}>
          {(Object.keys(NAV) as Tab[]).map((id) => {
            const { name, icon: Icon } = NAV[id];
            return (
              <button type="button" aria-pressed={tab === id} key={id} onClick={() => setTab(id)}>
                <Icon size={19} />
                <span>{t(name)}</span>
              </button>
            );
          })}
        </nav>
      )}
      <div className="sa-main" ref={main}>
        {saveResult !== 'saved' && (
          <div className="sa-save-error" role="alert">
            <span>{t(SAVE_COPY[saveResult])}</span>
            {saveResult === 'unavailable' && (
              <button type="button" onClick={retrySave}>
                {t(['保存を再試行', 'Retry saving'])}
              </button>
            )}
          </div>
        )}
        {lesson ? (
          <section className="sa-panel sa-lesson">
            <button type="button" onClick={() => setLesson(false)}>
              <ArrowLeft size={16} />
              {t(['復習をやめる', 'Leave lesson'])}
            </button>
            <div className="sa-lesson-board">
              <MiniGameProblemChallenge
                mode={mode}
                modePool={modePool}
                answerMode={answerMode}
                assignment={assignment}
                languageMode={language}
                onAnswerResult={onAnswerResult}
                onComplete={(correct) => {
                  send({ type: 'lesson', correct });
                  setLesson(false);
                }}
                isChallenge
                rewardHint={t(['正解でひらめきを獲得', 'Correct answers grant Inspiration'])}
              />
            </div>
          </section>
        ) : delving ? (
          <DelveView state={s} t={t} send={send} declare={openDeclaration} modalOpen={declare} />
        ) : tab === 'town' ? (
          <TownOverview
            state={s}
            t={t}
            send={send}
            declare={openDeclaration}
            showMap={() => setTab('map')}
          />
        ) : tab === 'map' ? (
          <WorldMap state={s} t={t} send={send} />
        ) : tab === 'life' ? (
          <LifePanel state={s} t={t} send={send} lesson={() => setLesson(true)} />
        ) : tab === 'people' ? (
          <PeoplePanel state={s} t={t} send={send} key={addressKey(s.location)} />
        ) : tab === 'gear' ? (
          <GearPanel s={s} t={t} send={send} />
        ) : (
          <TravelJournal s={s} t={t} send={send} />
        )}
      </div>
      {!lesson && latest && (
        <footer className="sa-feed" role="status">
          <p>{t(latest.text)}</p>
          {recentCheck && <DiceResult check={recentCheck} t={t} />}
        </footer>
      )}
      {declare && <Declaration s={s} t={t} send={send} close={() => setDeclare(false)} />}
    </>
  );
}
