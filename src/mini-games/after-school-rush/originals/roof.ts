import { GLIDER_ALTITUDE, GLIDER_WIND } from '../sceneSignals';
import {
  boss,
  choice,
  edit,
  equal,
  field,
  loc as L,
  n,
  operate,
  original as O,
  piece,
  phaseIntegral,
  pulse,
  set,
  slot,
  sprite,
  sum,
} from './model';

export const roof = [
  O(
    'weathervane-freeze',
    '風見計の針',
    'Weather Vane Lock',
    L('回る針を北で止めろ！', 'Lock the spinning vane on north!'),
    'reflex',
    'wind',
    field(
      'orbit',
      [],
      (_, t) => ({
        props: [piece(n(['N', 'E', 'S', 'W'][slot(t.now, 430, 4)]))],
        buttons: [L('固定', 'Lock')],
      }),
      (_, i, t) =>
        t.now >= 1720 && slot(t.now, 430, 4) === 0 ? 'clear' : t.now < 1720 ? undefined : 'mistake',
    ),
  ),
  O(
    'sun-panel',
    '傾ける太陽電池',
    'Solar Tilt',
    L('影を避けながら電力を3目盛りためろ！', 'Collect three charges without facing shadow!'),
    'simulation',
    'crystal',
    field(
      'orbit',
      [1, 0],
      (s, t) => ({
        props: [
          piece(
            [
              L('☀ 左', '☀ Left', '☀ ひだり'),
              L('☀ 直上', '☀ Center', '☀ まうえ'),
              L('☀ 右', '☀ Right', '☀ みぎ'),
            ][s[1]],
          ),
          piece(n(`PANEL ${s[0] + 1}`)),
        ],
        buttons: ['←', '↑', '→'],
        meter: s[1] / 3,
      }),
      (s, i) => [i, s[1]],
      (s, t) =>
        pulse(t, 1250 + s[1] * 1250)
          ? s[0] !== s[1]
            ? 'mistake'
            : s[1] === 2
              ? 'clear'
              : [s[0], s[1] + 1]
          : undefined,
    ),
  ),
  O(
    'vent-fan',
    '通気口の吸い込み',
    'Vent Backflow',
    L('吸うときは閉め、吐くときだけ開けろ！', 'Close on suction and open only on exhaust!'),
    'simulation',
    'wind',
    operate(
      'machine',
      [0, 0],
      [L('開く', 'Open'), L('閉じる', 'Close')],
      (s, t) => ({
        props: [
          sprite(
            'wind',
            slot(t.now, 760, 2) ? 'cool' : 'hot',
            slot(t.now, 760, 2) ? L('排気', 'OUT') : L('吸気', 'IN'),
          ),
          piece(n(s[0] ? 'OPEN' : 'CLOSED')),
        ],
        meter: s[1] / 1500,
      }),
      (s, i) => [1 - i, s[1]],
      (s, t) => {
        const out = slot(t.now, 760, 2);
        const c = s[1] + phaseIntegral(t, 760, 2, (phase) => phase * s[0]);
        return !out && s[0] && t.now % 760 > 225 ? 'mistake' : c >= 1500 ? 'clear' : [s[0], c];
      },
    ),
  ),
  O(
    'antenna-grid',
    '屋上アンテナの死角',
    'Antenna Blind Spot',
    L(
      '遮蔽物を避け、電池2個までで受信機をつなげ！',
      'Route the signal around obstacles with at most two batteries!',
      'じゃまな ものを よけ、でんち2こまでで じゅしんきを つなげ！',
    ),
    'strategy',
    'target',
    field(
      'grid',
      [0],
      (s) => ({
        note: L(
          '▲は高い信号だけ通す。受信機は低い位置。電池で高さが反転。',
          '▲ passes only a high signal. The receiver is low. Each battery flips the signal height.',
          '▲は たかい しんごうだけ とおす。じゅしんきは ひくい いち。でんちで たかさが はんてん。',
        ),
        props: [
          piece(n('TX → ↗ → ▲ → RX')),
          piece(n(`BATTERY ${s[0].toString(2).replaceAll('0', '').length}/2`)),
        ],
        buttons: ['↗', '▲', 'RX']
          .map((v, i) => piece(n(v), s[0] & (1 << i) ? 'good' : undefined))
          .concat(piece(L('送信', 'Send', 'そうしん'))),
      }),
      (s, i) => {
        if (i < 3) return [s[0] ^ (1 << i)];
        const beforeObstacle = Boolean(s[0] & 1);
        const atObstacle = beforeObstacle !== Boolean(s[0] & 2);
        const atReceiver = atObstacle !== Boolean(s[0] & 4);
        const batteries = s[0].toString(2).replaceAll('0', '').length;
        return atObstacle && !atReceiver && batteries <= 2 ? 'clear' : 'mistake';
      },
    ),
  ),
  O(
    'edge-tether',
    '命綱の長さ',
    'Tether Length',
    L('端に届かず、道具には届く長さへ！', 'Reach the tools without reaching the edge!'),
    'strategy',
    'shield',
    operate(
      'track',
      [1],
      [L('伸ばす +2', 'Extend +2'), L('結ぶ −1', 'Tie −1'), L('固定', 'Secure')],
      (s) => ({ props: [piece(n(`LENGTH ${s[0]}`))], note: L('道具まで4、端まで6', 'Tools at 4; edge at 6') }),
      (s, i) => (i === 2 ? (s[0] >= 4 && s[0] < 6 ? 'clear' : 'mistake') : [Math.max(1, s[0] + [2, -1][i])]),
    ),
  ),
  O(
    'launch-glider',
    '紙の翼の迎え角',
    'Glider Angle',
    L('3歩の間、高度を上げすぎず飛べ！', 'Glide three steps without flying too high!'),
    'motion',
    'wind',
    operate(
      'track',
      [3, 0, 0],
      [L('上げる', 'Nose up'), L('下げる', 'Nose down'), L('進む', 'Glide')],
      (s) => ({ props: [piece(n(`ALT ${s[0]} · TRIM ${s[1]}`))], meter: s[2] / 3 }),
      (s, i) => {
        if (i < 2) return [s[0], Math.max(-1, Math.min(1, s[1] + (i ? -1 : 1))), s[2]];
        const v = s[0] + s[1] + GLIDER_WIND[s[2]];
        return v < GLIDER_ALTITUDE[0] || v > GLIDER_ALTITUDE[1] ? 'mistake' : s[2] === 2 ? 'clear' : [v, s[1], s[2] + 1];
      },
    ),
  ),
  O(
    'cable-sag',
    'たるむケーブル',
    'Cable Sag',
    L('ケーブルの一番低い点を上げろ！', 'Raise the lowest point on the cable!'),
    'craft',
    'wind',
    edit(
      'track',
      [5, 1, 2, 5],
      (v, i) => n(`${'ABCD'[i]} ${v}`),
      (s, i) => set(s, i, Math.min(5, s[i] + 1)),
      (s) => Math.min(...s) >= 4,
      L('各点を高さ4以上に', 'Bring every point to height four or above'),
    ),
  ),
  O(
    'gust-compass',
    '風速の読み替え',
    'Wind Speed Mix',
    L('北向きの力3と南向きの力5を合わせると？', 'Combine northward force 3 and southward force 5!'),
    'math',
    'wind',
    choice(
      'orbit',
      L('向きが逆なら、強さの差が残る', 'Opposite forces subtract'),
      [L('北へ2', 'North 2'), L('南へ2', 'South 2'), L('南へ8', 'South 8'), L('止まる', 'Calm')],
      1,
    ),
  ),
  O(
    'cloud-shade',
    '影が通るとき',
    'Passing Shadow',
    L('一瞬の影に合わせて写真を撮れ！', 'Take the photo while the shadow passes!'),
    'reflex',
    'target',
    operate(
      'track',
      [],
      [L('撮る', 'Snap')],
      (_, t) => ({
        props: [sprite('wind', t.now >= 1850 && t.now < 2220 ? 'muted' : 'hot')],
        marker: Math.min(1, t.now / 2700),
        zone: [1850 / 2700, 2220 / 2700],
      }),
      (_, i, t) => (t.now >= 1850 && t.now < 2220 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'air-mail',
    '風まかせの伝書',
    'Wind Mail',
    L('風でずれる分を先に見越して投函！', 'Lead the wind when dropping the mail!'),
    'logic',
    'books',
    choice(
      'track',
      L('届く列は4。紙は落ちる間に右へ2列ずれる', 'Target lane 4. Paper drifts two lanes right while falling.'),
      ['1', '2', '3', '4', '5'],
      1,
    ),
  ),
  O(
    'water-tank',
    '屋上タンクの漏れ',
    'Leaking Tank',
    L('流入を合わせて水位を保て！', 'Match the leak and hold the water level!'),
    'simulation',
    'slime',
    operate(
      'machine',
      [50, 0],
      [L('弱', 'Low'), L('中', 'Medium'), L('強', 'High')],
      (s, t) => ({
        props: [piece(n(`WATER ${Math.round(s[0])}%`)), piece(n(`LEAK ${1 + slot(t.now, 1050, 3)}`))],
        marker: s[0] / 100,
        zone: [0.32, 0.68],
        meter: t.now / 4050,
      }),
      (s, i) => [s[0], i],
      (s, t) => {
        const v = s[0] + phaseIntegral(t, 1050, 3, (phase) => s[1] - phase) / 34;
        return v < 32 || v > 68 ? 'mistake' : t.now >= 4050 ? 'clear' : [v, s[1]];
      },
    ),
  ),
  O(
    'twilight-stars',
    '最初の星',
    'First Evening Star',
    L('最初に光った星を覚えろ！', 'Remember which star lit first!'),
    'memory',
    'gem',
    field(
      'grid',
      [],
      (_, t) => ({
        buttons: ['A', 'B', 'C', 'D'].map((v, i) =>
          piece(n(v), t.now >= [990, 330, 800, 1210][i] && t.now < 1700 ? 'good' : undefined, t.now < 1700),
        ),
      }),
      (_, i, t) => (t.now < 1700 ? undefined : i === 1 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'rotate-sign',
    '標識の見え方',
    'Side-On Sign',
    L('反対側から見える文字の並び順は？', 'What order are the letters in from the other side?'),
    'language',
    'target',
    choice(
      'orbit',
      L('透明な板のこちら側から ABC と読める', 'This side of the clear sign reads ABC'),
      ['ABC', 'CBA', 'BAC', 'BCA'],
      1,
    ),
  ),
  O(
    'line-drying',
    '洗濯ばさみの配分',
    'Peg Budget',
    L('4枚の布を落とさず、ばさみ6個を分けろ！', 'Secure four cloths with just six pegs!'),
    'strategy',
    'shield',
    operate(
      'track',
      [0, 0, 0, 0],
      ['A', 'B', 'C', 'D', L('干す', 'Hang')],
      (s) => ({
        props: s.map((v, i) => piece(n(`${'ABCD'[i]} ${v}`))),
        note: L('両端A・Dは2個、真ん中は1個ずつ', 'Outer cloths A and D need two; each center cloth needs one'),
      }),
      (s, i) =>
        i === 4 ? (equal(s, [2, 1, 1, 2]) ? 'clear' : 'mistake') : sum(s) < 6 ? set(s, i, s[i] + 1) : undefined,
    ),
  ),
  O(
    'compass-calibration',
    'ずれた方位磁針',
    'Compass Calibration',
    L('東と南の観測値から方位磁針を直せ！', 'Calibrate the compass using east and south readings!'),
    'craft',
    'target',
    field(
      'orbit',
      [0, 0],
      (s) => ({
        props: [piece(n(`EAST ${115 - s[0]}°`)), piece(n(`SOUTH ${205 - s[0]}°`))],
        note: L(
          '東90°・南180°に一致する補正を掛け、両方で確認',
          'Apply an offset, then check both east 90° and south 180°',
        ),
        buttons: ['−15°', '−25°', '−35°', L('東を照合', 'Verify east'), L('南を照合', 'Verify south')],
      }),
      (s, i) =>
        i < 3
          ? [[15, 25, 35][i], 0]
          : s[0] !== 25
            ? 'mistake'
            : (s[1] | (1 << (i - 3))) === 3
              ? 'clear'
              : [s[0], s[1] | (1 << (i - 3))],
    ),
  ),
  O(
    'roof-drum',
    '風音の反射',
    'Rooftop Echo',
    L('壁から返るまでの時間を求めろ！', 'Find how long the echo takes to return!'),
    'math',
    'hourglass',
    choice(
      'score',
      L('壁まで6m、音は1秒に3m進む。往復する', 'Wall is 6 m away; sound goes 3 m/s here. Count both ways.'),
      ['1 s', '2 s', '3 s', '4 s'],
      3,
    ),
  ),
  O(
    'string-walk',
    '張り綱をまたぐ',
    'Guy Line Crossing',
    L('線をまたがずに点検路を一周しろ！', 'Walk the inspection loop without crossing a cable!'),
    'motion',
    'shield',
    operate(
      'orbit',
      [0, 0],
      ['←', '→'],
      (s) => ({
        props: [piece(n(`AT ${s[0] + 1}/6`)), piece(n(`CHECK ${s[1]}/6`))],
        note: L('線は2→3と5→6。逆方向に迂回', 'Cables block 2→3 and 5→6. Circle the other way.'),
      }),
      (s, i) =>
        i === 1 && [1, 4].includes(s[0])
          ? 'mistake'
          : i === 0
            ? s[1] === 5
              ? 'clear'
              : [(s[0] + 5) % 6, s[1] + 1]
            : [(s[0] + 1) % 6, 0],
    ),
  ),
  O(
    'window-signal',
    '向かいの窓へ合図',
    'Across the Roof',
    L('見えている窓へ光を返せ！', 'Flash back to the windows you can see!'),
    'rhythm',
    'crystal',
    field(
      'grid',
      [0, -1],
      (s, t) => ({
        buttons: [0, 1, 2, 3].map((i) =>
          piece(n(i + 1), i === [2, 0, 3, 1][slot(t.now, 740, 4)] ? 'good' : 'muted'),
        ),
        meter: s[0] / 4,
      }),
      (s, i, t) => {
        const b = Math.floor(t.now / 740);
        return b === s[1]
          ? undefined
          : i !== [2, 0, 3, 1][b % 4]
            ? 'mistake'
            : s[0] === 3
              ? 'clear'
              : [s[0] + 1, b];
      },
    ),
  ),
  O(
    'thermal-updraft',
    '上昇気流の二択',
    'Thermal Lift',
    L('暖かい方を選び、高度を失わず上昇！', 'Choose warm air and climb without losing altitude!'),
    'motion',
    'wind',
    operate(
      'track',
      [0, 0],
      [L('日なた', 'Sun'), L('日陰', 'Shade')],
      (s) => ({
        props: [piece(n(`ALT ${s[0]} · ${['☀', '☁', '☀'][s[1]]}`))],
        note: L('雲の下では日なた側にも冷気', 'Under a cloud, cool air spills into the sunny lane'),
      }),
      (s, i) => (i !== [0, 1, 0][s[1]] ? 'mistake' : s[1] === 2 ? 'clear' : [s[0] + [2, 1, 2][s[1]], s[1] + 1]),
    ),
  ),
  boss(
    'storm-vane',
    L(
      '強風の屋上で、3本の綱を順に固定し風見計を止めろ！',
      'Secure three ropes in the storm and lock the vane!',
    ),
    'wind',
    operate(
      'orbit',
      [0, 1, 0],
      [L('左', 'Left'), L('右', 'Right'), L('綱を固定', 'Tie'), L('風見計を止める', 'Lock vane')],
      (s, t) => ({
        props: [
          sprite('wind', slot(t.now, 950, 2) ? 'hot' : 'cool', n(`YOU ${['L', 'M', 'R'][s[1]]}`)),
          piece(n(`ROPE ${['R', 'L', 'M', '✓'][s[0]]}`)),
        ],
        note: slot(t.now, 950, 2) ? L('突風', 'GUST') : L('風が弱い', 'CALM'),
        meter: s[0] / 3,
      }),
      (s, i, t) =>
        i < 2
          ? [s[0], Math.min(2, Math.max(0, s[1] + (i ? 1 : -1))), s[2]]
          : i === 2
            ? s[0] >= 3 || s[1] !== [2, 0, 1][s[0]] || slot(t.now, 950, 2)
              ? 'mistake'
              : [s[0] + 1, s[1], t.now]
            : s[0] === 3 && s[1] === 1 && !slot(t.now, 950, 2) && t.now > s[2] + 350
              ? 'clear'
              : 'mistake',
    ),
  ),
];
