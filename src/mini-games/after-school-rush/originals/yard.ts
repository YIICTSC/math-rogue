import { ROPE_FIRST, ROPE_INTERVAL, ROPE_MARGIN } from '../sceneSignals';
import {
  boss,
  choice,
  edit,
  field,
  loc as L,
  n,
  operate,
  original as O,
  piece,
  pulse,
  set,
  slot,
  sprite,
  swap,
  timed,
} from './model';

export const yard = [
  O(
    'crosswind-lap',
    '横風レーン',
    'Crosswind Lane',
    L('横風で押される前に内側へ！', 'Shift inward before the gust pushes you out!'),
    'motion',
    'wind',
    operate(
      'track',
      [1, 0],
      ['←', '→'],
      (s, t) => ({
        props: [
          piece(n(['L', 'MID', 'R'][s[0]])),
          sprite('wind', undefined, n(slot(t.now, 1150, 2) ? '←' : '→')),
        ],
        meter: s[1] / 4,
      }),
      (s, i) => [Math.max(0, Math.min(2, s[0] + (i ? 1 : -1))), s[1]],
      (s, t) => {
        const k = s[1],
          at = 950 + k * 1150;
        if (!pulse(t, at)) return;
        const lane = s[0] + (k % 2 ? -1 : 1);
        return lane < 0 || lane > 2 ? 'mistake' : k === 3 ? 'clear' : [lane, k + 1];
      },
    ),
  ),
  O(
    'jump-rope-gap',
    '二段のなわをかわす',
    'High and Low Rope',
    L(
      '低いなわは跳び、高いなわはくぐれ！',
      'Jump the low rope and duck the high rope!',
      'ひくい なわは とび、たかい なわは くぐれ！',
    ),
    'motion',
    'wind',
    operate(
      'track',
      [0],
      [L('跳ぶ', 'Jump', 'とぶ'), L('くぐる', 'Duck', 'くぐる')],
      (s, t) => {
        const arrival = ROPE_FIRST + s[0] * ROPE_INTERVAL;
        const high = s[0] % 2 === 1;
        return {
          props: [
            sprite(
              'wind',
              high ? 'warn' : 'cool',
              high ? L('高いなわ', 'High rope', 'たかい なわ') : L('低いなわ', 'Low rope', 'ひくい なわ'),
            ),
          ],
          marker: (t.now - arrival + 1150) / 1400,
          zone: [0.68, 0.96],
          meter: s[0] / 3,
        };
      },
      (s, i, t) =>
        Math.abs(t.now - (ROPE_FIRST + s[0] * ROPE_INTERVAL)) > ROPE_MARGIN || i !== s[0] % 2
          ? 'mistake'
          : s[0] === 2
            ? 'clear'
            : [s[0] + 1],
      (s, t) => (t.now > ROPE_FIRST + ROPE_MARGIN + s[0] * ROPE_INTERVAL ? 'mistake' : undefined),
    ),
  ),
  O(
    'chalk-course',
    '白線つなぎ',
    'Chalk Course',
    L('切れ目を埋め、スタートからゴールをつなげ！', 'Close the gaps from start to finish!'),
    'craft',
    'target',
    edit(
      'track',
      [1, 0, 1, 0, 0],
      (v) => (v ? '━' : '┄'),
      (s, i) => set(s, i, 1 - s[i]),
      (s) => s.every(Boolean),
      L('空いている区間だけを塗る', 'Fill only the gaps in the track'),
    ),
  ),
  O(
    'high-five',
    'すれ違いのハイタッチ',
    'Passing High Five',
    L('2人が会うときだけ手を上げろ！', 'High-five only when the two runners meet!'),
    'reflex',
    'ghost-cat',
    timed(
      'track',
      L('矢印が中央の二人に重なるとき', 'Press when the runner reaches the meeting zone'),
      [L('タッチ', 'Touch')],
      1800,
      (x) => ({ marker: x, zone: [0.48, 0.58], props: [sprite('ghost-cat'), sprite('slime')] }),
      (_, x) => x >= 0.48 && x <= 0.58,
      2,
    ),
  ),
  O(
    'relay-colors',
    'バトンの持ち替え',
    'Relay Hand-Off',
    L('次の走者が空けた手にバトンを渡せ！', 'Pass into the next runner’s free hand!'),
    'reflex',
    'shield',
    field(
      'track',
      [0, 0],
      (s) => ({
        props: [
          piece(n(`RUNNER ${s[0] + 1}`)),
          piece(s[0] % 2 ? L('右手が空き', 'Right hand free') : L('左手が空き', 'Left hand free')),
          piece(s[1] ? L('握りを直す', 'Switch grip') : L('渡せる', 'Grip ready')),
        ],
        buttons: [L('左手', 'Left hand'), L('右手', 'Right hand'), L('持ち替え', 'Switch grip')],
      }),
      (s, i) =>
        i === 2
          ? [s[0], 1 - s[1]]
          : i !== s[0] % 2 || s[1] !== 0
            ? 'mistake'
            : s[0] === 3
              ? 'clear'
              : [s[0] + 1, 1],
    ),
  ),
  O(
    'umbrella-wind',
    '傘の向き合わせ',
    'Windward Umbrella',
    L('風と反対に傘を向けて4秒しのげ！', 'Face against the wind until it passes!'),
    'simulation',
    'wind',
    operate(
      'orbit',
      [0, 0],
      ['←', '→'],
      (s, t) => ({
        props: [sprite('wind', undefined, n(slot(t.now, 940, 2) ? '←' : '→')), piece(n(s[0] ? '→' : '←'))],
        meter: s[1] / 2100,
      }),
      (s, i) => [i, s[1]],
      (s, t) =>
        s[0] !== slot(t.now, 940, 2) ? (s[1] + t.dt >= 2100 ? 'clear' : [s[0], s[1] + t.dt]) : undefined,
    ),
  ),
  O(
    'ball-corner',
    'はね返るボール',
    'Bounce Corner',
    L('壁で反射したボールの出口を当てろ！', 'Predict the exit after the bounce!'),
    'logic',
    'target',
    choice(
      'track',
      L('位置2から右へ6歩。通路は1〜5で端ではね返る', 'Start at 2, move right six steps, bounce at 1 and 5'),
      ['1', '2', '3', '4', '5'],
      1,
    ),
  ),
  O(
    'shoe-grid',
    '運動靴の足跡',
    'Shoeprint Course',
    L('足あとに合わせて踏み、石だけ飛ばせ！', 'Match the footprints and skip the rock!'),
    'motion',
    'target',
    field(
      'track',
      [0],
      (s) => ({
        props: [
          piece(
            [
              L('左足', 'Left print'),
              L('右足', 'Right print'),
              L('石', 'Rock'),
              L('左足', 'Left print'),
              L('右足', 'Right print'),
              L('左足', 'Left print'),
            ][s[0]],
          ),
        ],
        buttons: [L('左', 'Left'), L('右', 'Right'), L('とばす', 'Skip')],
        meter: s[0] / 6,
      }),
      (s, i) => (i !== [0, 1, 2, 0, 1, 0][s[0]] ? 'mistake' : s[0] === 5 ? 'clear' : [s[0] + 1]),
    ),
  ),
  O(
    'seed-lines',
    '三列まき',
    'Three Seed Rows',
    L('3列の畑に種を1個ずつ植えろ！', 'Plant one seed in each of the three rows!'),
    'craft',
    'egg',
    field(
      'grid',
      [],
      (s) => ({
        buttons: Array.from({ length: 9 }, (_, i) =>
          s.includes(i)
            ? sprite('egg', 'good')
            : piece(n(i % 3 === 1 ? '石 / Rock' : '土 / Soil'), i % 3 === 1 ? 'warn' : undefined),
        ),
      }),
      (s, i) =>
        i % 3 === 1 || s.some((j) => Math.floor(j / 3) === Math.floor(i / 3))
          ? 'mistake'
          : s.length === 2
            ? 'clear'
            : [...s, i],
    ),
  ),
  O(
    'puddle-skip',
    '水たまり幅くらべ',
    'Puddle Long Jump',
    L('幅5を越え、幅7の地点までに着地！', 'Clear width five and land by seven!'),
    'motion',
    'slime',
    operate(
      'track',
      [0],
      [L('助走', 'Run'), L('跳ぶ', 'Jump')],
      (s) => ({ props: [piece(n(`JUMP ${s[0] * 2} · 5 < d ≤ 7`))], meter: s[0] / 5 }),
      (s, i) => (i === 0 ? (s[0] < 5 ? [s[0] + 1] : undefined) : s[0] === 3 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'kite-tension',
    'たこの糸を守れ',
    'Kite Tension',
    L('強風でゆるめ、弱風で巻いて糸を守れ！', 'Release in gusts and reel in lulls!'),
    'simulation',
    'wind',
    operate(
      'machine',
      [50, 0],
      [L('巻く +12', 'Reel +12'), L('ゆるめる −12', 'Release −12')],
      (s, t) => ({
        marker: s[0] / 100,
        zone: [0.18, 0.82],
        props: [sprite('wind', slot(t.now, 950, 2) ? 'cool' : 'hot')],
        meter: t.now / 3600,
      }),
      (s, i) => [s[0] + (i ? -12 : 12), s[1]],
      (s, t) => {
        const v = s[0] + (t.dt / 22) * (slot(t.now, 950, 2) ? -1 : 1);
        return v < 18 || v > 82 ? 'mistake' : t.now >= 3600 ? 'clear' : [v, s[1]];
      },
    ),
  ),
  O(
    'target-radius',
    '同心円の得点',
    'Bullseye Totals',
    L('2投でちょうど8点を取れ！', 'Score exactly eight in two throws!'),
    'strategy',
    'target',
    operate(
      'orbit',
      [],
      ['1', '3', '5', '6'],
      (s) => ({ props: [piece(n(`${s.length}/2 · ${s.reduce((a, b) => a + b, 0)} / 8`))] }),
      (s, i) => (s.length === 0 ? [[1, 3, 5, 6][i]] : s[0] + [1, 3, 5, 6][i] === 8 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'cone-slalom',
    'コーン間のスラローム',
    'Cone Slalom',
    L('コーンと反対の列へジグザグ！', 'Zigzag away from the cones!'),
    'motion',
    'target',
    field(
      'track',
      [0, 1],
      (s) => ({
        buttons: [0, 1, 2].map((i) =>
          i === (s[0] % 2) * 2 ? sprite('target', 'warn') : piece(n(i === s[1] ? '●' : '·')),
        ),
        meter: s[0] / 4,
      }),
      (s, i) =>
        i === (s[0] % 2) * 2 || Math.abs(i - s[1]) > 1
          ? 'mistake'
          : i === s[1]
            ? undefined
            : s[0] === 3
              ? 'clear'
              : [s[0] + 1, i],
    ),
  ),
  O(
    'bench-shadow',
    'ベンチの日時計',
    'Yard Sundial',
    L('朝から昼にかけての影はどれ？', 'How does the shadow change from morning to noon?'),
    'logic',
    'hourglass',
    choice(
      'story',
      L('日が高くなっていく', 'The sun rises higher'),
      [L('長くなる', 'Longer'), L('短くなる', 'Shorter'), L('増える', 'More shadows')],
      1,
    ),
  ),
  O(
    'bag-toss',
    '砂袋のはかり',
    'Sandbag Arc',
    L('投げる角度と強さを合わせろ！', 'Set both angle and power for the toss!'),
    'motion',
    'egg',
    operate(
      'machine',
      [0, 0],
      [L('角度', 'Angle'), L('強さ', 'Power'), L('投げる', 'Throw')],
      (s) => ({
        props: [piece(n(`${[15, 30, 45][s[0]]}°`)), piece(n(`P ${s[1] + 1}`))],
        note: L('目標は30°・強さ3', 'Target: angle 30°, power 3'),
      }),
      (s, i) => (i === 2 ? (s[0] === 1 && s[1] === 2 ? 'clear' : 'mistake') : set(s, i, (s[i] + 1) % 3)),
    ),
  ),
  O(
    'spilled-seeds',
    '飛んだ種の進路',
    'Scattered Seeds',
    L('着地する列を風向きから選べ！', 'Use the wind to predict the landing lane!'),
    'logic',
    'egg',
    choice(
      'track',
      L('列2から右に2つ、左に1つ', 'From lane 2: two right, then one left'),
      ['1', '2', '3', '4'],
      2,
    ),
  ),
  O(
    'clean-track',
    '水引きレース',
    'Dry the Track',
    L('水たまりを左右に押し、排水口へ！', 'Push the puddles into the drains!'),
    'craft',
    'slime',
    edit(
      'track',
      [0, 1, 0, 1, 0],
      (v) => (v ? sprite('slime') : piece(n('·'))),
      (s, i) =>
        s[i] === 0
          ? undefined
          : i === 0 || i === 4
            ? set(s, i, 0)
            : i < 2
              ? swap(s, i, i - 1)
              : swap(s, i, i + 1),
      (s) => !s.some(Boolean),
      L(
        '左半分は左、右半分は右へ動く。端で排水',
        'Left puddles move left; right puddles move right. Drain at the ends',
      ),
    ),
  ),
  O(
    'flag-rotation',
    '校庭の四方旗',
    'Compass Flags',
    L('風向きが変わったら旗を逆へ！', 'Flip the flag opposite the new wind!'),
    'reflex',
    'wind',
    field(
      'orbit',
      [0, -1],
      (s, t) => ({
        props: [piece(n(['↑', '→', '↓', '←'][slot(t.now, 920, 4)]))],
        buttons: ['↑', '→', '↓', '←'],
        meter: s[0] / 4,
      }),
      (s, i, t) => {
        const k = Math.floor(t.now / 920);
        return k === s[1] ? undefined : i !== (k + 2) % 4 ? 'mistake' : s[0] === 3 ? 'clear' : [s[0] + 1, k];
      },
    ),
  ),
  O(
    'tag-safety',
    '安全地帯おにごっこ',
    'Tag Safe Zone',
    L('鬼と逆の列で安全札を2枚取れ！', 'Collect two safe tokens in lanes away from the tagger!'),
    'motion',
    'ghost-cat',
    field(
      'track',
      [0, -1],
      (s, t) => {
        const k = slot(t.now, 820, 3);
        return {
          buttons: [0, 1, 2].map((i) =>
            i === k
              ? sprite('ghost-cat', 'warn')
              : i === (k + 1) % 3
                ? sprite('shield', 'good')
                : piece(n('·')),
          ),
          meter: s[0] / 2,
        };
      },
      (s, i, t) => {
        const k = Math.floor(t.now / 820);
        return i === k % 3
          ? 'mistake'
          : i !== (k + 1) % 3 || k === s[1]
            ? undefined
            : s[0] === 1
              ? 'clear'
              : [s[0] + 1, k];
      },
    ),
  ),
  boss(
    'whirlwind-crossing',
    L('突風で散る苗を押さえ、3つの鉢へ届けろ！', 'Anchor the seedlings against gusts and deliver all three!'),
    'wind',
    operate(
      'track',
      [1, 0, 0],
      [L('左', 'Left'), L('右', 'Right'), L('固定', 'Anchor'), L('植える', 'Plant')],
      (s, t) => ({
        props: [
          sprite('egg', s[2] ? 'good' : undefined, n(['L', 'MID', 'R'][s[0]])),
          sprite('wind', undefined, n(slot(t.now, 1200, 2) ? '←' : '→')),
        ],
        note: n(`POT ${['L', 'R', 'MID'][s[1]]}`),
        meter: s[1] / 3,
      }),
      (s, i) =>
        i < 2
          ? [Math.max(0, Math.min(2, s[0] + (i ? 1 : -1))), s[1], s[2]]
          : i === 2
            ? [s[0], s[1], 1]
            : s[0] !== [0, 2, 1][s[1]]
              ? 'mistake'
              : s[1] === 2
                ? 'clear'
                : [s[0], s[1] + 1, 0],
      (s, t) =>
        Math.floor(t.before / 1200) !== Math.floor(t.now / 1200)
          ? s[2]
            ? [s[0], s[1], 0]
            : [Math.max(0, Math.min(2, s[0] + (slot(t.now - 1, 1200, 2) ? -1 : 1))), s[1], 0]
          : undefined,
    ),
  ),
];
