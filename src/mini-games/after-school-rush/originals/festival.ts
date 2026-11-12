import { FESTIVAL_ORDER } from '../sceneSignals';
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
  sequence,
  set,
  sprite,
  swap,
  timed,
} from './model';

export const festival = [
  O(
    'lantern-circuit',
    '提灯の点灯順',
    'Lantern Cascade',
    L('両側の提灯から中央へ点けろ！', 'Light lanterns from the ends inward!'),
    'craft',
    'gem',
    field(
      'track',
      [],
      (s) => ({
        buttons: Array.from({ length: 5 }, (_, i) => sprite('gem', s.includes(i) ? 'good' : 'muted')),
        meter: s.length / 5,
      }),
      (s, i) =>
        s.includes(i)
          ? undefined
          : i !== Math.floor(s.length / 2) && i !== 4 - Math.floor(s.length / 2)
            ? 'mistake'
            : s.length === 4
              ? 'clear'
              : [...s, i],
    ),
  ),
  O(
    'booth-map',
    '屋台地図の一方通行',
    'Festival Map',
    L('一方通行で食べ物と出口を通れ！', 'Take the one-way path through food and exit!'),
    'motion',
    'orange',
    operate(
      'grid',
      [0, 0],
      [L('食べ物', 'Food'), L('演奏', 'Music'), L('出口', 'Exit')],
      (s) => ({
        props: [piece(n(`AT ${['GATE', 'FOOD', 'MUSIC'][s[0]]}`))],
        note: L('入口→演奏。演奏→食べ物。食べ物→出口', 'Gate → music. Music → food. Food → exit.'),
      }),
      (s, i) => (i !== [1, 2, 0][s[0]] ? 'mistake' : i === 2 ? 'clear' : [i + 1, s[1] + 1]),
    ),
  ),
  O(
    'lantern-shadow',
    '灯りの影合わせ',
    'Lantern Silhouette',
    L('光に重ねて同じ影を作れ！', 'Choose the cutout that matches the shadow!'),
    'logic',
    'crystal',
    choice(
      'orbit',
      L('影は「上に◇、下に○」', 'The shadow has ◇ above ○'),
      ['○ / ◇', '◇ / □', '◇ / ○', '□ / ○'],
      2,
    ),
  ),
  O(
    'stage-cue',
    '舞台袖の切り替え',
    'Stage Cues',
    L('幕・照明・登場の順を守れ！', 'Run curtain, lights and entrance in order!'),
    'strategy',
    'books',
    sequence(
      'story',
      [L('登場', 'Entrance'), L('照明', 'Lights'), L('幕を上げる', 'Curtain')],
      [2, 1, 0],
      L('幕を上げ、照明を合わせ、出演者を出す', 'Raise the curtain, set the lights, then cue the cast'),
    ),
  ),
  O(
    'crowd-lane',
    '観客の波を分けろ',
    'Crowd Flow',
    L('列の人数を3・3・3に分けろ！', 'Split the crowd into three groups of three!'),
    'strategy',
    'shield',
    operate(
      'track',
      [0, 0, 0, 0],
      ['A', 'B', 'C'],
      (s) => ({
        props: s.slice(0, 3).map((v, i) => piece(n(`${'ABC'[i]} ${v}/3`))),
        note: L(
          `次のグループは${[2, 1, 2, 1, 3][s[3]]}人。分けずに通す`,
          `Next party: ${[2, 1, 2, 1, 3][s[3]]}. Keep them together.`,
          `つぎの グループは${[2, 1, 2, 1, 3][s[3]]}にん。わけずに とおす`,
        ),
      }),
      (s, i) => {
        const v = s[i] + [2, 1, 2, 1, 3][s[3]];
        return v > 3 ? 'mistake' : s[3] === 4 ? 'clear' : set(set(s, i, v), 3, s[3] + 1);
      },
    ),
  ),
  O(
    'seal-press',
    '招待状の押し型',
    'Invitation Seal',
    L('印を傾けず、ちょうど真ん中に押せ！', 'Stamp the invitation dead center!'),
    'craft',
    'target',
    timed(
      'counter',
      L('紙が中央の帯を通るとき', 'Stamp when the paper crosses the center'),
      [L('押印', 'Stamp')],
      1680,
      (x) => ({ marker: x, zone: [0.43, 0.56], props: [sprite('books')] }),
      (_, x) => x >= 0.43 && x <= 0.56,
    ),
  ),
  O(
    'ribbon-weave',
    '三色リボン編み',
    'Ribbon Weave',
    L('隣り合う色を変え、中央だけ赤に！', 'Alternate colors and put red in the center!'),
    'craft',
    'gem',
    edit(
      'track',
      [0, 0, 1, 0, 0],
      (v) => ['R', 'B', 'Y'][v],
      (s, i) => set(s, i, (s[i] + 1) % 3),
      (s) =>
        s[2] === 0 && s.filter((v) => v === 0).length === 1 && s.every((v, i) => i === 0 || v !== s[i - 1]),
    ),
  ),
  O(
    'firework-shells',
    '花火の打ち上げ筒',
    'Firework Shells',
    L('色と高さが合う筒で花火を打ち上げろ！', 'Choose a tube matching both color and height!'),
    'simulation',
    'gem',
    operate(
      'orbit',
      [0, 0],
      [
        L('赤・低', 'Red · low'),
        L('青・高', 'Blue · high'),
        L('赤・高', 'Red · high'),
        L('上下反転', 'Flip height'),
      ],
      (s) => ({
        props: [
          sprite(
            'gem',
            s[0] === 1 ? 'cool' : 'hot',
            [L('赤・高', 'Red · high'), L('青・低', 'Blue · low'), L('赤・低', 'Red · low')][s[0]],
          ),
          piece(s[1] ? L('反転中', 'INVERTED') : L('通常', 'NORMAL')),
        ],
        note: L('反転中は筒の高さだけが逆になる', 'Inverted mode reverses the tube’s height only'),
        meter: s[0] / 3,
      }),
      (s, i) => {
        if (i === 3) return [s[0], 1 - s[1]];
        const matchesColor = (i === 1) === (s[0] === 1),
          matchesHeight = (i > 0 !== Boolean(s[1])) === (s[0] === 0);
        if (!matchesColor || !matchesHeight) return 'mistake';
        return s[0] === 2 ? 'clear' : [s[0] + 1, s[1]];
      },
    ),
  ),
  O(
    'raffle-gap',
    'くじ箱の重複',
    'Raffle Duplicate',
    L('二重に入った番号だけ見抜け！', 'Spot the duplicate raffle number!'),
    'logic',
    'coin',
    choice(
      'counter',
      L('箱の中は 17, 41, 29, 18, 41, 71', 'Tickets: 17, 41, 29, 18, 41, 71'),
      ['17', '41', '18', '71'],
      1,
    ),
  ),
  O(
    'confetti-wind',
    '紙吹雪の高さ',
    'Confetti Drift',
    L('雲の高さで紙吹雪を広げろ！', 'Release the confetti at cloud height!'),
    'motion',
    'wind',
    operate(
      'track',
      [0],
      [L('送風 +3', 'Blow +3'), L('吸う −2', 'Draw −2'), L('放つ', 'Release')],
      (s) => ({ props: [sprite('wind', undefined, n(`ALT ${s[0]}`))], meter: s[0] / 10 }),
      (s, i) =>
        i === 2
          ? s[0] === 7
            ? 'clear'
            : 'mistake'
          : s[0] + [3, -2][i] > 10
            ? 'mistake'
            : [Math.max(0, s[0] + [3, -2][i])],
    ),
  ),
  O(
    'banner-order',
    '横断幕の文字',
    'Banner Letters',
    L('4枚の文字を正しくつなげろ！', 'Build the four-letter banner!'),
    'language',
    'books',
    sequence(
      'stack',
      ['T', 'S', 'A', 'R'],
      [1, 0, 2, 3],
      L('夜空の「星」を英語で', 'Make the word for a point of light in the night sky'),
    ),
  ),
  O(
    'dual-stage',
    '二つの舞台の休演',
    'Two Stages',
    L('両方が空く時間帯を探せ！', 'Find when both stages are free!'),
    'strategy',
    'hourglass',
    choice(
      'track',
      L('A: 1・4が空き、B: 2・4が空き', 'A is free at 1 and 4. B is free at 2 and 4.'),
      ['1', '2', '3', '4'],
      3,
    ),
  ),
  O(
    'lantern-perimeter',
    '提灯の長さ',
    'Lantern Perimeter',
    L('縦3、横5の会場に必要な長さは？', 'How much string surrounds a 3 by 5 venue?'),
    'math',
    'gem',
    choice('grid', L('会場を一周する', 'Go around the outside'), ['8', '12', '15', '16'], 3),
  ),
  O(
    'mask-signal',
    '仮面の見分け',
    'Mask Signal',
    L('口が弧を描いた笑顔だけ選べ！', 'Choose only masks with an upward-curving mouth!'),
    'reflex',
    'ghost-cat',
    collect(
      'story',
      ['^‿^', '•_•', '•‿•', '^_^', '•⌢•', '^‿^'].map((v) => piece(n(v))),
      [0, 2, 5],
    ),
  ),
  O(
    'festival-refund',
    'チケット束の交換',
    'Ticket Exchange',
    L('小券を大券にまとめ、指定枚数を渡せ！', 'Bundle small tickets and deliver the exact order!'),
    'math',
    'coin',
    operate(
      'counter',
      [8, 0],
      [L('小3→大1', '3 small → 1 large'), L('大1→小2', '1 large → 2 small'), L('渡す', 'Deliver')],
      (s) => ({
        props: [piece(n(`S ${s[0]}`)), piece(n(`L ${s[1]}`))],
        note: L('目標は小4、大1', 'Goal: four small and one large'),
      }),
      (s, i) =>
        i === 2
          ? equal(s, [4, 1])
            ? 'clear'
            : 'mistake'
          : i === 0
            ? s[0] >= 3
              ? [s[0] - 3, s[1] + 1]
              : undefined
            : s[1]
              ? [s[0] + 2, s[1] - 1]
              : undefined,
    ),
  ),
  O(
    'final-light-mix',
    '色の重ね合わせ',
    'Festival Light Mix',
    L('赤と緑を重ねて黄色に！', 'Overlap red and green to make yellow!'),
    'craft',
    'crystal',
    field(
      'machine',
      [0, 0, 1],
      (s) => ({
        buttons: [L('赤', 'Red'), L('緑', 'Green'), L('青', 'Blue')].map((v, i) =>
          piece(v, s[i] ? 'good' : undefined),
        ),
        props: [piece(n(`RGB ${s.join('')}`))],
      }),
      (s, i) => {
        const v = set(s, i, 1 - s[i]);
        return equal(v, [1, 1, 0]) ? 'clear' : v;
      },
    ),
  ),
  O(
    'opening-cheer',
    '開幕の掛け声',
    'Opening Cheer',
    L('掛け声の最後だけ全員で合わせろ！', 'Join the cheer only on the last syllable!'),
    'rhythm',
    'ghost-cat',
    operate(
      'story',
      [],
      [L('声を合わせる', 'Cheer')],
      (_, t) => ({
        props: [
          piece(
            ['い', 'っ', 'せー', 'の！', ''][Math.min(4, Math.floor(t.now / 670))] === ''
              ? L('…', '…')
              : L(
                  ['い', 'っ', 'せー', 'の！'][Math.floor(t.now / 670)],
                  ['Get', 'set', 'and', 'GO!'][Math.floor(t.now / 670)],
                ),
          ),
        ],
      }),
      (_, i, t) => (t.now >= 2010 && t.now < 2680 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'handbill-match',
    '案内ビラの迷子',
    'Handbill Match',
    L('上の案内と同じ屋台番号を探せ！', 'Find the booth number shown in the handbill!'),
    'memory',
    'books',
    field(
      'counter',
      [],
      (_, t) => ({
        props: [piece(n(t.now < 1200 ? 'N-4 · A-7 · F-3' : 'N-4 · ____ · F-3'))],
        buttons: ['A-4', 'F-7', 'A-7', 'N-7'].map((v) => piece(n(v), undefined, t.now < 1200)),
      }),
      (_, i, t) => (t.now < 1200 ? undefined : i === 2 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'photo-group',
    '集合写真の立ち位置',
    'Group Photo',
    L('背の高い人を後ろ、低い人を前へ！', 'Seat shorter people in front and taller people behind!'),
    'logic',
    'target',
    edit(
      'grid',
      [4, 2, 1, 3],
      (v) => n(v),
      (s, i) => swap(s, i, (i + 2) % 4),
      (s) => Math.max(...s.slice(0, 2)) < Math.min(...s.slice(2)),
      L('上の段が前。上下の位置を交換できる', 'The top row is front. Swap vertically.'),
    ),
  ),
  boss(
    'festival-lighting',
    L(
      '鐘の音に合わせて、会場の3灯を順に灯し、最後に一斉点灯！',
      'Light the three lanterns to the chime, then switch them on together!',
    ),
    'gem',
    operate(
      'machine',
      [0, 0],
      [L('赤', 'Red'), L('青', 'Blue'), L('金', 'Gold'), L('一斉点灯', 'All lights')],
      (s, t) => ({
        props: [0, 1, 2].map((i) => sprite('gem', s[0] & (1 << i) ? 'good' : undefined, n(['R', 'B', 'G'][i]))),
        note:
          s[1] === 3
            ? L('鐘が鳴ったら一斉点灯', 'Light all on the next chime')
            : L('青→赤→金。合図の間だけ押す', 'Blue → red → gold. Press only in the signal band'),
        meter: s[1] / 3,
        marker: (t.now % 1850) / 1850,
        zone: [0.38, 0.65],
      }),
      (s, i, t) => {
        const phase = (t.now % 1850) / 1850,
          k = Math.floor(t.now / 1850) + 1;
        if (phase < 0.38 || phase > 0.65) return 'mistake';
        if ((s[2] || 0) === k) return;
        if (s[1] === 3) return i === 3 ? 'clear' : 'mistake';
        if (i !== FESTIVAL_ORDER[s[1]]) return 'mistake';
        return [s[0] | (1 << i), s[1] + 1, k];
      },
    ),
  ),
];
