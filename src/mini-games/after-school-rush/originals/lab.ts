import { CYLINDER_CAPACITY } from '../sceneSignals';
import {
  boss,
  choice,
  collect,
  edit,
  loc as L,
  n,
  operate,
  original as O,
  piece,
  sequence,
  set,
  sprite,
  sum,
  timed,
  triangle,
} from './model';

export const lab = [
  O(
    'water-divider',
    '2本のメスシリンダー',
    'Graduated Cylinders',
    L('片方に水を4目盛りだけ量れ！', 'Measure exactly four units in one cylinder!'),
    'logic',
    'slime',
    operate(
      'machine',
      [0, 0],
      [L('Aを満たす', 'Fill A'), L('Bを空に', 'Empty B'), L('AからBへ', 'Pour A → B')],
      (s) => ({ props: [piece(n(`A ${s[0]} / 5`)), piece(n(`B ${s[1]} / 3`))] }),
      (s, i) => {
        const d = Math.min(s[0], CYLINDER_CAPACITY[1] - s[1]);
        const v = i === 0 ? [CYLINDER_CAPACITY[0], s[1]] : i === 1 ? [s[0], 0] : [s[0] - d, s[1] + d];
        return v[0] === 4 ? 'clear' : v;
      },
    ),
  ),
  O(
    'thermostat',
    '温度の行き止まり',
    'Thermostat Trap',
    L('40度でヒーターを止めろ！', 'Stop the heater at 40 degrees!'),
    'simulation',
    'crystal',
    operate(
      'machine',
      [22],
      [L('加熱 +9', 'Heat +9'), L('冷却 −5', 'Cool −5'), L('停止', 'Stop')],
      (s) => ({
        marker: s[0] / 60,
        zone: [39 / 60, 41 / 60],
        props: [piece(n(`${s[0]}°`), s[0] > 40 ? 'hot' : 'cool')],
      }),
      (s, i) =>
        i === 2
          ? s[0] === 40
            ? 'clear'
            : 'mistake'
          : s[0] + [9, -5][i] > 60
            ? 'mistake'
            : [s[0] + [9, -5][i]],
    ),
  ),
  O(
    'magnet-poles',
    '磁石の向き',
    'Magnetic Chain',
    L('どの磁石も隣と引き合うように！', 'Make every neighboring magnet attract!'),
    'logic',
    'crystal',
    edit(
      'track',
      [0, 1, 0, 1],
      (v) => (v ? 'S·N' : 'N·S'),
      (s, i) => set(s, i, 1 - s[i]),
      (s) => s.every((v) => v === s[0]),
      L('同じ極は反発、異なる極は引き合う', 'Like poles repel; unlike poles attract'),
    ),
  ),
  O(
    'lens-focus',
    'レンズの焦点',
    'Lens Focus',
    L('像が最も小さくなる位置で止めろ！', 'Stop where the image is smallest!'),
    'reflex',
    'target',
    timed(
      'machine',
      L('中心から離れるほど像が大きい', 'The image grows away from focus'),
      [L('固定', 'Lock')],
      2100,
      (x) => ({
        marker: x,
        zone: [0.44, 0.56],
        props: [piece(n('◉'.repeat(1 + Math.round(Math.abs(x - 0.5) * 7))))],
      }),
      (_, x) => Math.abs(x - 0.5) <= 0.06,
    ),
  ),
  O(
    'parallel-lamps',
    '電池の分配',
    'Parallel Lamps',
    L('電力を余さず、3灯を点けろ！', 'Power three lamps and use all the energy!'),
    'strategy',
    'crystal',
    operate(
      'grid',
      [0, 0, 0],
      ['A +1', 'B +1', 'C +1', L('通電', 'Connect')],
      (s) => ({
        props: s.map((v, i) => piece(n(`${'ABC'[i]} ${v}`))),
        note: L('電力6。各灯は最低1、BはAの2倍', 'Budget 6. Each lamp needs at least 1; B uses twice A'),
      }),
      (s, i) =>
        i === 3
          ? sum(s) === 6 && s.every((v) => v > 0) && s[1] === 2 * s[0]
            ? 'clear'
            : 'mistake'
          : sum(s) < 6
            ? set(s, i, s[i] + 1)
            : undefined,
    ),
  ),
  O(
    'ink-chromatogram',
    'ろ紙のにじみ',
    'Ink Separation',
    L('青より進み、黄より手前の色は？', 'Which ink lies farther than blue but before yellow?'),
    'logic',
    'gem',
    choice(
      'track',
      L('青 2cm · 赤 4cm · 緑 7cm · 黄 6cm', 'Blue 2 cm · Red 4 cm · Green 7 cm · Yellow 6 cm'),
      [L('青', 'Blue'), L('赤', 'Red'), L('緑', 'Green'), L('黄', 'Yellow')],
      1,
    ),
  ),
  O(
    'binary-fuses',
    '3ビットのスイッチ',
    'Binary Fuse',
    L('2進数で5をつくれ！', 'Build the number five in binary!'),
    'math',
    'target',
    edit(
      'machine',
      [0, 1, 0],
      (v, i) => n(`${[4, 2, 1][i]} : ${v ? 'ON' : 'OFF'}`),
      (s, i) => set(s, i, 1 - s[i]),
      (s) => s[0] * 4 + s[1] * 2 + s[2] === 5,
    ),
  ),
  O(
    'circuit-path',
    '迷走する回路',
    'Stray Circuit',
    L('1回だけ曲がって端子に着け！', 'Reach the terminal with exactly one turn!'),
    'logic',
    'crystal',
    sequence(
      'track',
      ['→', '↓', '←', '↑'],
      [0, 0, 1, 1],
      L(
        '始点は左上、端子は右下。初手は右のみ',
        'Start top-left. Finish bottom-right. First move must go right',
      ),
    ),
  ),
  O(
    'acid-counter',
    '中和の一滴',
    'Neutral Drops',
    L('色が変わる中性に合わせろ！', 'Add drops to reach neutral!'),
    'simulation',
    'slime',
    operate(
      'machine',
      [3],
      [L('塩基 ＋2', 'Base +2'), L('酸 −1', 'Acid −1'), L('試験紙', 'Test')],
      (s) => ({ props: [piece(n(`pH ${s[0]}`), s[0] === 7 ? 'good' : 'warn')] }),
      (s, i) =>
        i === 2 ? (s[0] === 7 ? 'clear' : 'mistake') : s[0] + [2, -1][i] < 0 ? 'mistake' : [s[0] + [2, -1][i]],
    ),
  ),
  O(
    'gas-bubble',
    '逃げる泡',
    'Escaping Gas',
    L('泡が割れる前に蓋を3回閉じろ！', 'Seal three bubbles before they burst!'),
    'reflex',
    'slime',
    operate(
      'machine',
      [0],
      [L('蓋を閉じる', 'Seal')],
      (s, t) => ({
        meter: (t.now - s[0] * 1480) / 1480,
        props: [sprite('slime', t.now - s[0] * 1480 > 900 ? 'hot' : 'cool')],
      }),
      (s, i, t) => (t.now - s[0] * 1480 < 650 ? 'mistake' : s[0] === 2 ? 'clear' : [s[0] + 1]),
      (s, t) => (t.now > (s[0] + 1) * 1480 ? 'mistake' : undefined),
    ),
  ),
  O(
    'tuning-fork',
    '音叉の周波数',
    'Tuning Fork Frequency',
    L('2倍の振動数になる音叉は？', 'Which fork doubles the vibration rate?'),
    'math',
    'hourglass',
    choice(
      'score',
      L('元の音叉は220Hz', 'The original fork is 220 Hz'),
      ['110 Hz', '220 Hz', '330 Hz', '440 Hz'],
      3,
    ),
  ),
  O(
    'spark-sort',
    '導体だけを集めろ',
    'Conductors Only',
    L('電気を通す試料だけ選べ！', 'Collect only samples that conduct electricity!'),
    'logic',
    'crystal',
    collect(
      'grid',
      [
        L('銅', 'Copper'),
        L('紙', 'Paper'),
        L('鉄', 'Iron'),
        L('ゴム', 'Rubber'),
        L('アルミ', 'Aluminum'),
        L('木', 'Wood'),
      ].map((v) => piece(v)),
      [0, 2, 4],
    ),
  ),
  O(
    'microbe-culture',
    '培地の境界',
    'Culture Boundary',
    L('中央の菌を残し、外周への増殖を止めろ！', 'Contain the culture but preserve its center!'),
    'strategy',
    'slime',
    edit(
      'grid',
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      (v) => (v === 1 ? sprite('slime') : n(v === 2 ? '■' : '·')),
      (s, i) => (s[i] === 1 ? 'mistake' : set(s, i, s[i] === 2 ? 0 : 2)),
      (s) => [1, 3, 5, 7].every((i) => s[i] === 2),
      L('菌の上下左右に壁を置く', 'Wall off the four neighbors'),
    ),
  ),
  O(
    'experiment-order',
    '安全な実験順',
    'Safe Lab Order',
    L('混ぜる前に安全確認！', 'Make the experiment safe before mixing!'),
    'strategy',
    'shield',
    sequence(
      'story',
      [L('混ぜる', 'Mix'), L('記録する', 'Record'), L('保護眼鏡', 'Goggles'), L('量る', 'Measure')],
      [2, 3, 0, 1],
      L('保護→計量→混合→記録', 'Protect → measure → mix → record'),
    ),
  ),
  O(
    'laser-reflect',
    '反射鏡の一角',
    'Mirror Corner',
    L('右へ来る光を上に反射させろ！', 'Reflect a beam going right upward!'),
    'logic',
    'target',
    choice('machine', L('光は →、出口は ↑', 'Incoming beam →, exit ↑'), ['／', '＼', '—', '│'], 0),
  ),
  O(
    'dye-dilution',
    '色水の濃度',
    'Dye Dilution',
    L('水を足して濃さを半分に！', 'Dilute the dye to half its strength!'),
    'math',
    'gem',
    operate(
      'counter',
      [3],
      ['+1', '+2', '+4', L('測る', 'Measure')],
      (s) => ({
        props: [piece(n(`DYE 3 / WATER ${s[0]}`))],
        note: L('色素3＋水3から開始。色素は増えない', 'Start with 3 dye and 3 water; dye stays fixed'),
      }),
      (s, i) => (i === 3 ? (s[0] === 9 ? 'clear' : 'mistake') : s[0] < 9 ? [s[0] + [1, 2, 4][i]] : undefined),
    ),
  ),
  O(
    'sample-contamination',
    '混ざったラベル',
    'Sample Contamination',
    L('同じ番号で色が食い違う札は？', 'Find the matching number with conflicting colors!'),
    'logic',
    'gem',
    choice(
      'counter',
      L('A: 1赤 / 2青 / 3緑。B: 1赤 / 2緑 / 3緑', 'A: 1 red / 2 blue / 3 green. B: 1 red / 2 green / 3 green'),
      ['1', '2', '3'],
      1,
    ),
  ),
  O(
    'pendulum-count',
    '振り子の片道',
    'Pendulum Return',
    L('振り子が出発点に2回戻ったら押せ！', 'Press when the pendulum returns home twice!'),
    'rhythm',
    'hourglass',
    operate(
      'orbit',
      [],
      [L('記録', 'Record')],
      (_, t) => ({ marker: triangle(t.now, 1250), props: [piece(n(`${Math.floor(t.now / 1250)} ↺`))] }),
      (_, i, t) => (t.now >= 2475 && t.now <= 2800 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'cooling-cycle',
    '加熱と冷却の逆転',
    'Thermal Inversion',
    L('温度の増減が逆になる前に切り替えろ！', 'Reverse the thermostat before the temperature escapes!'),
    'simulation',
    'crystal',
    operate(
      'machine',
      [0.5, 0],
      [L('加熱', 'Heat'), L('冷却', 'Cool')],
      (s, t) => ({
        marker: s[0],
        zone: [0.24, 0.76],
        meter: t.now / 4000,
        props: [piece(n(s[1] ? '−' : '+'))],
      }),
      (s, i) => [s[0], i],
      (s, t) => {
        const v = s[0] + ((s[1] ? -1 : 1) * t.dt) / 2050;
        return v < 0.24 || v > 0.76 ? 'mistake' : t.now >= 4000 ? 'clear' : [v, s[1]];
      },
    ),
  ),
  boss(
    'runaway-circuit',
    L('暴走回路の3系統を、電圧を守りながら切り離せ！', 'Isolate three runaway lines without losing voltage!'),
    'crystal',
    operate(
      'machine',
      [0, 60, 0],
      [L('逃がす −12', 'Vent −12'), L('給電 +12', 'Feed +12'), L('遮断', 'Isolate')],
      (s, t) => ({
        props: [
          sprite('crystal', s[1] > 74 ? 'hot' : 'good', n(`LINE ${s[0] + 1}`)),
          piece(n(`${Math.round(s[1])}V`)),
        ],
        zone: [0.4, 0.7],
        marker: s[1] / 100,
        meter: s[0] / 3,
      }),
      (s, i, t) =>
        i === 2
          ? s[1] < 40 || s[1] > 70 || t.now < s[2] + 750
            ? 'mistake'
            : s[0] === 2
              ? 'clear'
              : [s[0] + 1, s[1] + 16, t.now]
          : set(s, 1, s[1] + (i === 0 ? -12 : 12)),
      (s, t) => {
        const v = s[1] + (t.dt * (s[0] % 2 ? -1 : 1)) / 115;
        return v < 22 || v > 95 ? 'mistake' : set(s, 1, v);
      },
    ),
  ),
];
