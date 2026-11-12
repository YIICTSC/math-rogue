import { PASSAGE_COST } from '../sceneSignals';
import type { Prop } from '../rules';
import {
  boss,
  choice,
  collect,
  edit,
  equal,
  field,
  loc as L,
  n,
  operate,
  original as O,
  piece,
  pulse,
  sequence,
  set,
  slot,
  sprite,
  swap,
  timed,
  triangle,
} from './model';

export const gate = [
  O(
    'lost-pass',
    '落とし物の通行証',
    'Lost Gate Pass',
    L('金の通行証だけ拾え！', 'Pick up only the gold passes!'),
    'reflex',
    'coin',
    collect(
      'grid',
      ['coin', 'egg', 'coin', 'mimic', 'shield', 'coin', 'slime', 'books'].map((x) => sprite(x as Prop)),
      [0, 2, 5],
    ),
  ),
  O(
    'forklight',
    '路地の誘導灯',
    'Forklight',
    L('矢印の向きへ進め！', 'Follow the arrows!'),
    'motion',
    'target',
    sequence('track', ['←', '↑', '→'], [2, 0, 2, 1], L('分かれ道を4つ通る', 'Take four turns'), (s) => [
      piece(n(['→', '←', '→', '↑'][s[0]]), 'good'),
    ]),
  ),
  O(
    'counterweight',
    '門の釣り合い',
    'Gate Counterweight',
    L('左右の重さをそろえろ！', 'Balance the two sides!'),
    'math',
    'shield',
    edit(
      'machine',
      [3, 1, 2, 1],
      (v, i) => n(`${i < 2 ? 'L' : 'R'} ${v}`),
      (s, i) => (s[i] ? set(swap(s, i, (i + 2) % 4), i, s[(i + 2) % 4] + 1) : undefined),
      (s) => s[0] + s[1] === s[2] + s[3],
      L(
        '押すと向かいの箱と入れ替え、元の位置に重り1個を足す',
        'Swap with the opposite box and add one weight here',
      ),
    ),
  ),
  O(
    'pedestrian',
    '渡り番のひと呼吸',
    'Crossing Pause',
    L('ひとが通り終えたら渡れ！', 'Cross once the pedestrian has passed!'),
    'motion',
    'ghost-cat',
    timed(
      'track',
      L('足あとが帯から出た瞬間', 'Go as the footsteps leave the lane'),
      [L('渡る', 'Cross')],
      2300,
      (x) => ({ marker: x, zone: [0.68, 0.92], props: [sprite('ghost-cat')] }),
      (_, x) => x >= 0.68 && x <= 0.92,
    ),
  ),
  O(
    'knock-code',
    '門番への合図',
    'Gate Knock',
    L('強・弱・強でノック！', 'Knock hard, soft, hard!'),
    'rhythm',
    'mimic',
    sequence('score', [L('強', 'Hard'), L('弱', 'Soft')], [0, 1, 0], L('強 → 弱 → 強', 'Hard → soft → hard')),
  ),
  O(
    'keyhole',
    '欠けた鍵穴',
    'Missing Notch',
    L('鍵穴を埋める歯はどれ？', 'Which teeth fill the keyhole?'),
    'logic',
    'gem',
    choice(
      'machine',
      L('□■□■■ の白だけ埋める', 'Fill only the empty slots in □■□■■'),
      ['■□□■□', '■□■□□', '□□■□■', '□■□■■'],
      1,
    ),
  ),
  O(
    'quiet-zone',
    '静かな抜け道',
    'Quiet Passage',
    L('足音の合計を3以下にして出口へ！', 'Reach the exit with at most 3 noise!'),
    'strategy',
    'egg',
    operate(
      'track',
      [0, 0],
      [L('砂利 +2', 'Gravel +2'), L('草 +0', 'Grass +0'), L('石板 +1', 'Slab +1')],
      (s) => ({
        note: n(`STEP ${s[0]}/3 · NOISE ${s[1]}/3`),
        props: [
          sprite('ghost-cat'),
          piece(
            [
              L('砂利 NG', 'No gravel', 'じゃり NG'),
              L('草 NG', 'No grass', 'くさ NG'),
              L('石板 NG', 'No slabs', 'せきばん NG'),
            ][s[0]],
          ),
        ],
      }),
      (s, i) =>
        i === s[0]
          ? 'mistake'
          : s[1] + PASSAGE_COST[i] > 3
            ? 'mistake'
            : s[0] === 2
              ? 'clear'
              : [s[0] + 1, s[1] + PASSAGE_COST[i]],
    ),
  ),
  O(
    'umbrella-flip',
    '傘を返せ',
    'Umbrella Flip',
    L('ぬれた面を全部上に！', 'Turn every wet side upward!'),
    'craft',
    'wind',
    edit(
      'stack',
      [1, 0, 0, 1],
      (v) => (v ? '☂' : '∪'),
      (s, i) => s.map((v, k) => (k === i || k === (i + 1) % 4 ? 1 - v : v)),
      (s) => s.every(Boolean),
      L('押すと自分と右隣が反転。端はつながる', 'Flip this and the next umbrella; ends wrap'),
    ),
  ),
  O(
    'two-stamps',
    '二印の検札',
    'Double Stamp',
    L('丸と角を1個ずつ押せ！', 'Stamp one circle and one square!'),
    'craft',
    'target',
    field(
      'counter',
      [],
      (s) => ({
        buttons: [
          piece(n('○'), s.includes(0) ? 'good' : undefined),
          piece(n('△')),
          piece(n('□'), s.includes(2) ? 'good' : undefined),
          L('提出', 'Submit'),
        ],
      }),
      (s, i) =>
        i === 3
          ? equal([...s].sort(), [0, 2])
            ? 'clear'
            : 'mistake'
          : s.includes(i)
            ? s.filter((v) => v !== i)
            : [...s, i],
    ),
  ),
  O(
    'turnstile',
    '回転柵の間',
    'Turnstile Gap',
    L('空いている方を通れ！', 'Step through the open side!'),
    'reflex',
    'shield',
    field(
      'orbit',
      [0, -1],
      (s, t) => {
        const side = slot(t.now, 560, 4);
        return {
          buttons: ['↑', '→', '↓', '←'].map((v, i) => piece(n(v), i === side ? 'good' : 'muted')),
          meter: s[0] / 3,
        };
      },
      (s, i, t) => {
        const pass = Math.floor(t.now / 560);
        if (s[1] === pass) return;
        return i !== pass % 4 ? 'mistake' : s[0] === 2 ? 'clear' : [s[0] + 1, pass];
      },
    ),
  ),
  O(
    'lost-name',
    '名札の落とし主',
    'Name Tag Owner',
    L('名札の特徴から持ち主を選べ！', 'Find the owner of the name tag!'),
    'logic',
    'books',
    choice(
      'story',
      L('★を持つ。丸い帽子はかぶらない。', 'Has a star. No round hat.'),
      ['★ ○', '★ △', '◆ △', '◆ ○'],
      1,
    ),
  ),
  O(
    'traffic-relay',
    '一方通行の旗',
    'One-Way Flags',
    L('両端を外向きにして中央を閉じろ！', 'Point ends out and close the middle!'),
    'logic',
    'shield',
    edit(
      'track',
      [1, 0, 0],
      (v) => ['←', '→', '×'][v],
      (s, i) => s.map((v, k) => (k === i || k === 1 ? (v + 1) % 3 : v)),
      (s) => equal(s, [0, 2, 1]),
      L('押した旗と中央の旗が切り替わる', 'Turn the selected flag and the middle flag'),
    ),
  ),
  O(
    'queue-trade',
    '行列のゆずりあい',
    'Queue Courtesy',
    L('高い番号を後ろに並べろ！', 'Put the higher numbers at the back!'),
    'strategy',
    'books',
    edit(
      'track',
      [2, 3, 1, 4],
      (v, i) => (i === 3 ? piece(n(v), 'muted', true) : n(`${v} ↔`)),
      (s, i) => (i < 3 ? swap(s, i, i + 1) : undefined),
      (s) => s.every((v, i) => !i || s[i - 1] < v),
      L('右隣と交代する', 'Swap with the person to the right'),
    ),
  ),
  O(
    'barrier-gap',
    '柵のすき間',
    'Barrier Fit',
    L('ぴったり幅7になる柵を組め！', 'Build a barrier exactly 7 wide!'),
    'math',
    'shield',
    operate(
      'stack',
      [0],
      ['+2', '+3', '+5', L('組む', 'Build')],
      (s) => ({ props: [piece(n(`${s[0]} / 7`))], meter: s[0] / 7 }),
      (s, i) =>
        i === 3
          ? s[0] === 7
            ? 'clear'
            : 'mistake'
          : s[0] + [2, 3, 5][i] > 7
            ? 'mistake'
            : [s[0] + [2, 3, 5][i]],
    ),
  ),
  O(
    'shadow-step',
    '影ふみ検問',
    'Shadow Checkpoint',
    L('足もとの影が重なるまで待て！', 'Wait until both shadows overlap!'),
    'reflex',
    'slime',
    operate(
      'orbit',
      [],
      [L('踏む', 'Step')],
      (_, t) => {
        const a = triangle(t.now, 2200),
          b = triangle(t.now + 400, 1600);
        return { marker: a, zone: [b - 0.07, b + 0.07], props: [sprite('slime')] };
      },
      (_, i, t) =>
        i === 0 && Math.abs(triangle(t.now, 2200) - triangle(t.now + 400, 1600)) <= 0.07 ? 'clear' : 'mistake',
    ),
  ),
  O(
    'message-fold',
    '折り返し暗号',
    'Folded Message',
    L('左右を折ると重なる印は？', 'Which marks overlap when folded?'),
    'logic',
    'books',
    choice(
      'stack',
      L('左から ★ ○ ◆ ｜ ◆ △ ★', 'From left: ★ ○ ◆ | ◆ △ ★'),
      ['★ + ○', '◆ + ○', '★ + ◆', '△ + ○'],
      2,
    ),
  ),
  O(
    'gate-fuse',
    '門灯の遅延回路',
    'Gate Lamp Delay',
    L('2つの灯を同時に点けろ！', 'Make both lamps light together!'),
    'simulation',
    'crystal',
    operate(
      'machine',
      [-1, -1],
      [L('早い灯', 'Fast lamp'), L('遅い灯', 'Slow lamp')],
      (s, t) => ({
        props: s.map((v, i) => piece(n(i === 0 ? 'A' : 'B'), v >= 0 && t.now >= v ? 'good' : 'muted')),
      }),
      (s, i, t) => (s[i] < 0 ? set(s, i, t.now + [300, 850][i]) : undefined),
      (s, t) => {
        if (s[0] >= 0 && s[1] >= 0 && Math.abs(s[0] - s[1]) <= 310 && t.now >= Math.max(...s)) return 'clear';
        if (s.some((v) => v >= 0 && t.now > v + 620)) return 'mistake';
      },
    ),
  ),
  O(
    'ticket-window',
    '伝票一枚ぶん',
    'One Ticket Slot',
    L('一番早く着く切符を選べ！', 'Pick the ticket with the earliest arrival!'),
    'math',
    'hourglass',
    choice(
      'counter',
      L('出発時刻＋所要時間で比べる', 'Compare departure plus travel time'),
      ['4 + 8', '7 + 3', '1 + 12', '6 + 5'],
      1,
    ),
  ),
  O(
    'lamp-memory',
    '門灯の消える順',
    'Last Gate Light',
    L('最後まで点いていた色は？', 'Which light stayed on the longest?'),
    'memory',
    'crystal',
    field(
      'machine',
      [],
      (_, t) => ({
        props: ['○', '△', '□'].map((v, i) => piece(n(v), t.now < [900, 1500, 1100][i] ? 'good' : 'muted')),
        buttons: ['○', '△', '□'].map((v) => piece(n(v), undefined, t.now < 1500)),
      }),
      (_, i, t) => (t.now >= 1500 ? (i === 1 ? 'clear' : 'mistake') : undefined),
    ),
  ),
  boss(
    'mimic-gate',
    L('ミミックの口をかわして、鐘を3回鳴らせ！', 'Dodge the mimic’s bite and ring the bell three times!'),
    'mimic',
    operate(
      'machine',
      [0, 0],
      [L('よける', 'Dodge'), L('鐘を鳴らす', 'Ring')],
      (s, t) => {
        const phase = slot(t.now, 420, 5);
        return {
          props: [
            sprite('mimic', phase === 2 ? 'hot' : phase === 3 ? 'good' : 'muted'),
            piece(
              phase === 2
                ? L('かみつく！', 'BITE!')
                : phase === 3
                  ? L('鐘を鳴らせ！', 'RING!')
                  : L('待て', 'WAIT'),
            ),
          ],
          meter: s[0] / 3,
        };
      },
      (s, i, t) => {
        const cycle = Math.floor(t.now / 2100),
          phase = slot(t.now, 420, 5);
        if (i === 0) return phase === 2 ? [s[0], cycle + 1] : undefined;
        if (s[1] !== cycle + 1 || phase !== 3) return 'mistake';
        return s[0] === 2 ? 'clear' : [s[0] + 1, 0];
      },
      (s, t) =>
        pulse(t, Math.floor(t.now / 2100) * 2100 + 1260) && s[1] !== Math.floor(t.now / 2100) + 1
          ? 'mistake'
          : undefined,
    ),
  ),
];
