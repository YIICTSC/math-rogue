import React from 'react';
import { Compass, Crosshair, Shield, Sparkles, Swords } from 'lucide-react';
import { CALLINGS, FOES, WEAPONS, type Text } from './content';
import { COMBAT_MOVES, canCombatMove } from './delve';
import { loadoutTechniques, techniqueFor } from './battleTechniques';
import { moveRange, tacticalTarget } from './fieldTactics';
import ScreenDialog from './ScreenDialog';
import { equipped, type Adventure, type CombatMove } from './state';
import { art, type Local, type Send } from './ui';
import type { Floor } from './world';

const COMBAT_INTRO_KEY = 'learning_rogue_school_frontier_combat_intro_v1';

export function readCombatIntro() {
  try {
    return localStorage.getItem(COMBAT_INTRO_KEY) === 'seen';
  } catch {
    return false;
  }
}

export function rememberCombatIntro() {
  try {
    localStorage.setItem(COMBAT_INTRO_KEY, 'seen');
  } catch {
    // The current session still records that it was shown.
  }
}

export const TECHNIQUES_TITLE: Text = ['戦闘の技', 'Combat techniques', 'せんとうの わざ'];

export function BattleTutorial({
  manual,
  t,
  close,
}: {
  manual: boolean;
  t: Local;
  close: () => void;
}) {
  return (
    <ScreenDialog
      title={t([
        'フロンティアの戦い方',
        'Your first Frontier battle',
        'フロンティアの たたかいかた',
      ])}
      t={t}
      close={close}
    >
      <ol className="sa-combat-lesson">
        <li>
          <Compass size={20} />
          <div>
            <strong>
              {t(
                manual
                  ? [
                      '敵を選び、間合いを取る',
                      'Pick a target and find your range',
                      'てきを えらび、きょりを はかる',
                    ]
                  : ['相手を選ぶ', 'Pick a target', 'あいてを えらぶ'],
              )}
            </strong>
            <p>
              {t(
                manual
                  ? [
                      '敵の絵をタップして狙いを選びます。隣の通路をタップすると移動でき、技には射程と射線があります。移動も1手です。',
                      'Tap a creature to target it. Tap an adjacent passage to move. Moving takes a turn. Techniques require range and a clear line of sight.',
                      'てきの えを タッチして ねらいます。となりに いどうすると 1ターン。わざは とどく きょりで つかいます。',
                    ]
                  : [
                      '相手を選ぶと、主人公と仲間が自動で戦います。「一時停止」や「戦闘の技」で手を選ぶ時間を取れます。',
                      'Choose a target and your party fights automatically. Pause or open Combat techniques to plan your next move.',
                      'あいてを えらぶと じどうで たたかいます。「いちじていし」や「せんとうの わざ」で つぎの てを えらべます。',
                    ],
              )}
            </p>
          </div>
        </li>
        <li>
          <Swords size={20} />
          <div>
            <strong>
              {t([
                '武器と得意技を合わせる',
                'Use your weapon and calling',
                'ぶきと とくいわざを あわせる',
              ])}
            </strong>
            <p>
              {t(
                manual
                  ? [
                      '武器と立ち回りごとの技は集中を使います。槍や鎚で押し出し、敵同士をぶつけたり、火や帯電床へ追い込んだりできます。',
                      'Weapon and calling techniques spend Focus. Use a pike or hammer to push foes into each other, into fire, or onto electrified terrain.',
                      'ぶきと とくいわざは しゅうちゅうを つかいます。やりや つちで てきを おして、ほかの てきや ひに ぶつけられます。',
                    ]
                  : [
                      '「戦闘の技」から、武器と立ち回りの技を使えます。攻撃のほかにも、ひるませる、弱点を見つける、回復するなどの技があります。',
                      'Combat techniques lists moves from your weapon and calling. Some can stagger, reveal weaknesses, or heal.',
                      '「せんとうの わざ」から、ぶきや とくいわざを つかいます。ひるませたり、かいふく したりする わざも あります。',
                    ],
              )}
            </p>
          </div>
        </li>
        <li>
          <Shield size={20} />
          <div>
            <strong>
              {t(['大技の前に備える', 'Prepare for heavy attacks', 'おおわざの まえに そなえる'])}
            </strong>
            <p>
              {t([
                '敵の構えを読み、防御で集中を回復。危ないときは戦闘メニューから退却できます。',
                'Read enemy intent and guard to regain Focus. Retreat from Battle options if you are in trouble.',
                'てきの かまえを みて、ぼうぎょで しゅうちゅうを かいふく。あぶないときは「せんとう メニュー」から にげられます。',
              ])}
            </p>
          </div>
        </li>
      </ol>
      <button type="button" className="sa-primary sa-battle-continue" onClick={close}>
        {t(['戦闘を始める', 'Continue to battle', 'せんとうを はじめる'])}
      </button>
    </ScreenDialog>
  );
}

const COMMON_MOVES: CombatMove[] = [
  'strike',
  'heavy',
  'quick',
  'spark',
  'guard',
  'study',
  'parley',
  'befriend',
];

export function BattleTechniqueMenu({
  s,
  t,
  floor,
  send,
  target,
  close,
}: {
  s: Adventure;
  t: Local;
  floor?: Floor;
  send: Send;
  target: number;
  close: () => void;
}) {
  const weapon = equipped(s, 'weapon')?.weapon;
  const foe = s.delve?.encounter?.enemies[target];
  const name = t(
    foe ? (foe.epithets ?? FOES[foe.template].name) : ['周囲', 'Surroundings', 'まわり'],
  );
  const personal: CombatMove[] = loadoutTechniques(s);
  const sections = [
    {
      title: [
        '武器・立ち回りの技',
        'Weapon and calling techniques',
        'ぶきと たちまわりの わざ',
      ] as Text,
      moves: personal,
    },
    { title: ['基本の行動', 'Basic actions', 'きほんの こうどう'] as Text, moves: COMMON_MOVES },
  ];
  return (
    <div className="sa-techniques">
      <p className="sa-technique-loadout">
        {weapon ? t(WEAPONS[weapon].name) + ' · ' : ''}
        {t(CALLINGS[s.character.calling].name)}
        <small>
          {t(['対象', 'Target', 'たいしょう'])} · {name}
        </small>
      </p>
      {sections.map(({ title, moves }) => (
        <section key={title[0]}>
          <h3>{t(title)}</h3>
          <div className="sa-technique-list">
            {moves.map((move) => {
              const technique = COMBAT_MOVES[move];
              const special = techniqueFor(move);
              const range = floor && move !== 'guard' ? moveRange(s, move) : 0;
              const enabled = canCombatMove(s, move, target, floor);
              const reason = enabled
                ? null
                : s.focus < technique.cost
                  ? (['集中が足りない', 'Not enough Focus', 'しゅうちゅうが たりない'] as Text)
                  : special?.needsKnown && !foe?.known
                    ? ([
                        '先に弱点を調べる',
                        'Study the weakness first',
                        'さきに じゃくてんを しらべる',
                      ] as Text)
                    : floor && !tacticalTarget(s, move, target, floor)
                      ? (['射程外・射線なし', 'Out of range or sight', 'とどかない ばしょ'] as Text)
                      : ([
                          '条件を満たしていない',
                          'Requirements unmet',
                          'じょうけんが たりない',
                        ] as Text);
              return (
                <article key={move}>
                  {special && <img src={art('combat/' + special.art)} alt="" />}
                  <div>
                    <h4>{t(technique.name)}</h4>
                    <p>{t(technique.hint)}</p>
                    <small>
                      {range > 0 && (
                        <span>
                          <Crosshair size={12} />
                          {t(['射程', 'Range', 'しゃてい'])} {range}
                        </span>
                      )}
                      <span>
                        <Sparkles size={12} />
                        {t(['集中', 'Focus', 'しゅうちゅう'])} {technique.cost}
                      </span>
                    </small>
                    {reason && <p className="sa-technique-lock">{t(reason)}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={!enabled}
                    data-technique={move}
                    aria-label={t(['技を使う', 'Use', 'わざを つかう']) + ' · ' + t(technique.name)}
                    onClick={() => {
                      if (send({ type: 'combat', move, target })) close();
                    }}
                  >
                    {t(['使う', 'Use', 'つかう'])}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
