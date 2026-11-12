import { ENSEMBLE_BEATS, ENSEMBLE_BEAT_MS } from '../sceneSignals';
import {
  boss,
  choice,
  collect,
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
  sum,
  timed,
} from './model';

export const music = [
  O(
    'silent-bar',
    '休符を守れ',
    'Respect the Rest',
    L('休符には触らず、音符だけ鳴らせ！', 'Play the notes and leave the rests silent!'),
    'rhythm',
    'hourglass',
    field(
      'score',
      [0, -1],
      (s, t) => ({
        props: [
          piece(n(['♪', '𝄽', '♪', '♪'][slot(t.now, 620, 4)]), slot(t.now, 620, 4) === 1 ? 'muted' : 'good'),
        ],
        buttons: [L('鳴らす', 'Play')],
        meter: s[0] / 4,
      }),
      (s, i, t) => {
        const k = Math.floor(t.now / 620);
        return s[1] === k ? undefined : k % 4 === 1 ? 'mistake' : s[0] === 3 ? 'clear' : [s[0] + 1, k];
      },
    ),
  ),
  O(
    'tempo-ratchet',
    '加速する拍',
    'Tempo Ratchet',
    L('だんだん速くなる4拍を打て！', 'Hit four beats as the tempo accelerates!'),
    'rhythm',
    'target',
    operate(
      'score',
      [0],
      [L('打つ', 'Tap')],
      (s, t) => {
        const a = [1100, 2050, 2830, 3450][s[0]];
        return {
          marker: Math.max(0, 1 - (a - t.now) / 850),
          zone: [0.8, 1],
          props: [piece(n(`BEAT ${s[0] + 1}`))],
        };
      },
      (s, i, t) =>
        Math.abs(t.now - [1100, 2050, 2830, 3450][s[0]]) > 165 ? 'mistake' : s[0] === 3 ? 'clear' : [s[0] + 1],
      (s, t) => (t.now > [1265, 2215, 2995, 3615][s[0]] ? 'mistake' : undefined),
    ),
  ),
  O(
    'pitch-bend',
    '半音の曲がり',
    'Pitch Bend',
    L('ラを半音上げて、ソを半音下げろ！', 'Raise A one step and lower G one step!'),
    'craft',
    'crystal',
    operate(
      'machine',
      [0, 0],
      [L('ラ ＋1', 'A +1'), L('ソ −1', 'G −1'), L('試聴', 'Play')],
      (s) => ({ props: [piece(n(`A ${s[0]}`)), piece(n(`G ${s[1]}`))] }),
      (s, i) => (i === 2 ? (equal(s, [1, -1]) ? 'clear' : 'mistake') : set(s, i, s[i] + (i ? -1 : 1))),
    ),
  ),
  O(
    'score-path',
    '繰り返し記号',
    'Repeat Sign',
    L('記号に沿って小節を演奏！', 'Play the measures with the repeat sign!'),
    'language',
    'books',
    sequence('score', ['A', 'B', 'C'], [0, 1, 0, 1, 2], L('‖: A B :‖ C', '‖: A B :‖ C')),
  ),
  O(
    'ghost-echo',
    '残響を消せ',
    'Ghost Echo',
    L('残響が次の音に重なる前に止めろ！', 'Mute the echo before it collides with the next note!'),
    'simulation',
    'ghost-cat',
    operate(
      'machine',
      [0, -1],
      [L('消音', 'Mute')],
      (s, t) => ({
        props: [sprite('ghost-cat', t.now >= s[0] * 1480 + 720 ? 'hot' : 'muted')],
        meter: s[0] / 3,
      }),
      (s, i, t) => {
        const time = t.now - s[0] * 1480;
        if (time < 640 || time > 1140) return 'mistake';
        return s[0] === 2 ? 'clear' : [s[0] + 1, t.now];
      },
      (s, t) => (t.now > s[0] * 1480 + 1140 ? 'mistake' : undefined),
    ),
  ),
  O(
    'stereo-balance',
    '音量ミキサー',
    'Stereo Mix',
    L('合計6、右が左の2倍になるよう調整！', 'Set total volume six with right twice left!'),
    'simulation',
    'wind',
    operate(
      'machine',
      [3, 3],
      [L('左から右へ', 'Left → right'), L('右から左へ', 'Right → left')],
      (s) => ({ props: [piece(n(`L ${'▮'.repeat(s[0])}`)), piece(n(`R ${'▮'.repeat(s[1])}`))] }),
      (s, i) =>
        s[i] === 0
          ? undefined
          : s[0] + (i ? 1 : -1) === 2
            ? 'clear'
            : [s[0] + (i ? 1 : -1), s[1] + (i ? -1 : 1)],
    ),
  ),
  O(
    'call-answer',
    '合いの手の高さ',
    'Call and Answer',
    L('上の音には下、下には上で返せ！', 'Answer high notes low and low notes high!'),
    'memory',
    'gem',
    sequence(
      'score',
      ['↑', '↓'],
      [1, 0, 1, 1],
      L('表示された音と反対に答える', 'Answer opposite the shown note'),
      (s) => [piece(n(['↑', '↓', '↑', '↑'][s[0]]), 'good')],
    ),
  ),
  O(
    'dynamics-arc',
    '強弱の山',
    'Crescendo Arc',
    L('強さを1→3→1にして終われ！', 'Build from 1 to 3 and back to 1!'),
    'rhythm',
    'crystal',
    operate(
      'score',
      [1, 0],
      [L('強く', 'Louder'), L('弱く', 'Softer'), L('終止', 'Finish')],
      (s) => ({ meter: s[0] / 4, props: [piece(n(`LEVEL ${s[0]}`), s[0] > 3 ? 'hot' : undefined)] }),
      (s, i) => {
        if (i === 2) return s[0] === 1 && s[1] === 1 ? 'clear' : 'mistake';
        const v = s[0] + (i ? -1 : 1);
        return v < 1 || v > 3 ? 'mistake' : [v, Number(s[1] || v === 3)];
      },
    ),
  ),
  O(
    'bar-count',
    '小節を満たせ',
    'Fill the Measure',
    L('4拍を、異なる長さ2枚で埋めろ！', 'Fill four beats with two different lengths!'),
    'math',
    'books',
    operate(
      'score',
      [],
      ['1', '2', '3'],
      (s) => ({ props: [piece(n(`${sum(s)} / 4`))] }),
      (s, i) => (s.length === 0 ? [i + 1] : s[0] !== i + 1 && s[0] + i + 1 === 4 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'missing-interval',
    '隣の音の間隔',
    'Missing Interval',
    L('跳んだ幅がひとつ違う音を選べ！', 'Find the note that breaks the step pattern!'),
    'logic',
    'target',
    choice(
      'score',
      L('1・3・5・6・9。正しくは2ずつ上がる', '1, 3, 5, 6, 9. Correct pattern rises by two.'),
      ['3', '5', '6', '9'],
      2,
    ),
  ),
  O(
    'broken-record',
    'レコードのループ',
    'Looped Record',
    L('同じ短いフレーズが2回出るまで待て！', 'Wait until the short phrase has played twice!'),
    'memory',
    'hourglass',
    operate(
      'orbit',
      [],
      [L('針を上げる', 'Lift needle')],
      (_, t) => ({
        props: [piece(n(['A', 'B', 'C', 'A', 'B', 'C', 'D'][Math.min(6, Math.floor(t.now / 420))]))],
        marker: (t.now % 1260) / 1260,
      }),
      (_, i, t) => (t.now >= 2290 && t.now < 2800 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'chord-split',
    '和音の組み立て',
    'Build the Chord',
    L('3つの番号の間隔を2ずつに！', 'Build a three-note chord spaced by twos!'),
    'logic',
    'gem',
    field(
      'score',
      [],
      (s) => ({
        buttons: Array.from({ length: 6 }, (_, i) => piece(n(i + 1), s.includes(i) ? 'good' : undefined)),
        meter: s.length / 3,
      }),
      (s, i) => {
        if (s.includes(i)) return;
        const v = [...s, i].sort((a, b) => a - b);
        return v.length < 3 ? v : v[1] - v[0] === 2 && v[2] - v[1] === 2 ? 'clear' : 'mistake';
      },
    ),
  ),
  O(
    'duet-switch',
    '交互の二重奏',
    'Two-Voice Duet',
    L('青と赤を切り替えて最後まで奏でろ！', 'Trade turns between the blue and red voices!'),
    'rhythm',
    'gem',
    operate(
      'score',
      [0, 0],
      [L('演奏', 'Play'), L('交代', 'Switch')],
      (s) => ({
        props: [piece(n(['A', 'B'][s[1]])), piece(n(`NEXT ${['A', 'B', 'B', 'A', 'B'][s[0]]}`))],
        meter: s[0] / 5,
      }),
      (s, i) =>
        i === 1
          ? [s[0], 1 - s[1]]
          : s[1] !== [0, 1, 1, 0, 1][s[0]]
            ? 'mistake'
            : s[0] === 4
              ? 'clear'
              : [s[0] + 1, s[1]],
    ),
  ),
  O(
    'metronome-swing',
    '片寄るメトロノーム',
    'Metronome Swing',
    L('長・短の間で2回うまく打て！', 'Tap the two beats with long-short spacing!'),
    'rhythm',
    'target',
    timed(
      'orbit',
      L('表示される帯に合わせて打つ', 'Play when the marker is inside the band'),
      [L('打つ', 'Tap')],
      1900,
      (x, t) => ({ marker: x, zone: t % 1900 < 950 ? [0.67, 0.87] : [0.23, 0.43] }),
      (_, x, t) => (t % 1900 < 950 ? x >= 0.67 && x <= 0.87 : x >= 0.23 && x <= 0.43),
      2,
    ),
  ),
  O(
    'instrument-family',
    '楽器の奏法',
    'Instrument Actions',
    L('息を使う楽器だけ選べ！', 'Collect only instruments played by blowing!'),
    'logic',
    'wind',
    collect(
      'grid',
      [
        L('笛', 'Flute'),
        L('太鼓', 'Drum'),
        L('ピアノ', 'Piano'),
        L('ラッパ', 'Trumpet'),
        L('ギター', 'Guitar'),
      ].map((v) => piece(v)),
      [0, 3],
    ),
  ),
  O(
    'score-compress',
    '音符のまとめ書き',
    'Compress the Notes',
    L('同じ音の連続を1個にまとめろ！', 'Collapse each run of identical notes!'),
    'language',
    'books',
    choice('score', L('A A B B B A C C', 'A A B B B A C C'), ['ABC', 'ABAC', 'AABAC', 'ABCA'], 1),
  ),
  O(
    'reverse-tape',
    '逆回しのテープ',
    'Reverse Tape',
    L('表示が消えたら音を後ろから選べ！', 'Replay the notes backwards after they vanish!'),
    'memory',
    'wind',
    field(
      'score',
      [0],
      (s, t) => ({
        props: [piece(n(t.now < 1850 ? 'C A D B' : '• • • •'))],
        buttons: ['A', 'B', 'C', 'D'].map((v) => piece(n(v), undefined, t.now < 1850)),
        meter: s[0] / 4,
      }),
      (s, i, t) =>
        t.now < 1850 ? undefined : i !== [1, 3, 0, 2][s[0]] ? 'mistake' : s[0] === 3 ? 'clear' : [s[0] + 1],
    ),
  ),
  O(
    'turn-page-downbeat',
    '譜めくりの拍',
    'Turn on the Downbeat',
    L('小節が終わったところで次のページへ！', 'Turn the page only at the end of a measure!'),
    'reflex',
    'books',
    operate(
      'stack',
      [0],
      [L('めくる', 'Turn')],
      (s, t) => ({
        props: [piece(n(`PAGE ${s[0] + 1}`)), piece(n(['1', '2', '3', '4', '|'][slot(t.now, 420, 5)]))],
        meter: s[0] / 2,
      }),
      (s, i, t) =>
        slot(t.now, 420, 5) !== 4
          ? 'mistake'
          : s[0] === 0
            ? [1, Math.floor(t.now / 2100)]
            : s[1] === Math.floor(t.now / 2100)
              ? undefined
              : 'clear',
    ),
  ),
  O(
    'crowd-damping',
    '響きすぎの客席',
    'Audience Damping',
    L('音量を保ち、響きだけ下げろ！', 'Reduce echo while preserving loudness!'),
    'simulation',
    'ghost-cat',
    operate(
      'machine',
      [6, 5],
      [L('幕を引く', 'Draw curtain'), L('増幅', 'Amplify'), L('確認', 'Check')],
      (s) => ({
        props: [piece(n(`VOLUME ${s[0]}`)), piece(n(`ECHO ${s[1]}`))],
        note: L('音量6、残響1以下', 'Volume 6 and echo at most 1'),
      }),
      (s, i) =>
        i === 2
          ? s[0] === 6 && s[1] <= 1
            ? 'clear'
            : 'mistake'
          : i === 0
            ? [Math.max(0, s[0] - 2), Math.max(0, s[1] - 2)]
            : [Math.min(10, s[0] + 2), s[1]],
    ),
  ),
  boss(
    'fading-ensemble',
    L(
      '拍に合わせて3パートを弾き分けろ。休符は沈黙！',
      'Play the right parts on the beat and stay silent on rests!',
    ),
    'gem',
    operate(
      'score',
      [0, 0],
      ['A', 'B', 'C'],
      (s, t) => {
        const beat = Math.min(8, Math.floor(t.now / ENSEMBLE_BEAT_MS));
        return {
          props: [
            piece(n(['A', 'B', 'C'][ENSEMBLE_BEATS[beat]] ?? '𝄽'), 'good'),
            piece(n(`BAR ${beat + 1}/9`)),
          ],
          meter: s[0] / 7,
          marker: (t.now % ENSEMBLE_BEAT_MS) / ENSEMBLE_BEAT_MS,
          zone: [0.13, 0.8],
        };
      },
      (s, i, t) => {
        const beat = Math.floor(t.now / ENSEMBLE_BEAT_MS);
        if (s[1] === beat + 1) return;
        const key = ENSEMBLE_BEATS[beat];
        if (i !== key || t.now % ENSEMBLE_BEAT_MS < 110 || t.now % ENSEMBLE_BEAT_MS > 680) return 'mistake';
        return s[0] === 6 ? 'clear' : [s[0] + 1, beat + 1];
      },
      (s, t) => {
        const k = Math.floor(t.now / ENSEMBLE_BEAT_MS);
        return k < 9 && pulse(t, k * ENSEMBLE_BEAT_MS + 735) && ENSEMBLE_BEATS[k] !== -1 && s[1] !== k + 1
          ? 'mistake'
          : undefined;
      },
    ),
  ),
];
