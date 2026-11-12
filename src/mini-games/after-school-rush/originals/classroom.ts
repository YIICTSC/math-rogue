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
  sum,
  swap,
} from './model';

export const classroom = [
  O(
    'chalk-borrow',
    'くり下がりの白線',
    'Borrowed Chalk',
    L('52−18をくり下げて解け！', 'Borrow to solve 52−18!'),
    'math',
    'books',
    operate(
      'machine',
      [5, 2],
      [L('十を1つ借りる', 'Borrow one ten'), L('18を引く', 'Subtract 18')],
      (s) => ({ props: [piece(n(`10 × ${s[0]}`)), piece(n(`1 × ${s[1]}`))] }),
      (s, i) =>
        i === 0
          ? s[0] > 1
            ? [s[0] - 1, s[1] + 10]
            : undefined
          : s[1] >= 8 && s[0] >= 1 && 10 * (s[0] - 1) + s[1] - 8 === 34
            ? 'clear'
            : 'mistake',
    ),
  ),
  O(
    'mirror-letter',
    '黒板の鏡文字',
    'Mirror Chalk',
    L('鏡に映した並びを選べ！', 'Pick the mirrored row!'),
    'language',
    'books',
    choice('stack', L('← ○ △ →', '← ○ △ →'), ['← △ ○ →', '→ △ ○ ←', '← ○ △ →', '→ ○ △ ←'], 0),
  ),
  O(
    'after-class-roll',
    '欠席者の席',
    'Roll Call Gap',
    L('来なかった番号の席を選べ！', 'Pick the missing student number!'),
    'memory',
    'ghost-cat',
    field(
      'story',
      [],
      (_, t) => ({
        props: [piece(n(t.now < 850 ? '1' : t.now < 1700 ? '3' : t.now < 2550 ? '4' : '?'))],
        buttons: [1, 2, 3, 4].map((i) => piece(n(i), undefined, t.now < 2550)),
      }),
      (_, i, t) => (t.now >= 2550 ? (i === 1 ? 'clear' : 'mistake') : undefined),
    ),
  ),
  O(
    'fraction-tear',
    '分数の切り取り',
    'Paper Fractions',
    L('8枚のうち4分の3を切り取れ！', 'Cut off three quarters of eight pieces!'),
    'math',
    'gem',
    field(
      'grid',
      [0],
      (s) => ({
        buttons: Array.from({ length: 8 }, (_, i) =>
          piece(n(i < s[0] ? '✂' : '□'), i < s[0] ? 'good' : undefined, i !== s[0]),
        ),
        props: [piece(n(`${s[0]} / 8`)), piece(n('¾'))],
      }),
      (s, i) => (i !== s[0] ? undefined : s[0] === 5 ? 'clear' : [s[0] + 1]),
    ),
  ),
  O(
    'seating-cross',
    '交差しない席替え',
    'Desk Crossing',
    L('2人とも向かいの席へ！', 'Move both students to the opposite seats!'),
    'logic',
    'egg',
    edit(
      'grid',
      [1, 0, 0, 2],
      (v) => ['□', 'A', 'B'][v],
      (s, i) => {
        if (s[i]) return;
        const from = [0, 1, 2, 3].find(
          (j) => s[j] && Math.abs((j % 2) - (i % 2)) + Math.abs((j >> 1) - (i >> 1)) === 1,
        );
        return from === undefined ? undefined : swap(s, i, from);
      },
      (s) => equal(s, [2, 0, 0, 1]),
      L('空席を選ぶと、隣の人が移動', 'Tap an empty seat to move a neighbor'),
    ),
  ),
  O(
    'one-letter',
    '一文字の置き換え',
    'One-Letter Switch',
    L('最後の文字だけ替えて別の単語に！', 'Change just the last letter to form a word!'),
    'language',
    'books',
    choice(
      'counter',
      L('PEN → PE_。意味は「豆」', 'PEN → PE_. The new word means a bean.'),
      ['T', 'A', 'K', 'S'],
      1,
    ),
  ),
  O(
    'sum-columns',
    '消えた行合計',
    'Desk Totals',
    L('2行の合計を両方6にそろえろ！', 'Make both rows total six!'),
    'math',
    'target',
    edit(
      'grid',
      [1, 2, 1, 3, 1, 1],
      (v) => n(v),
      (s, i) => set(s, i, s[i] === 3 ? 1 : s[i] + 1),
      (s) => sum(s.slice(0, 3)) === 6 && sum(s.slice(3)) === 6,
      L('数字は1→2→3→1', 'Numbers cycle 1 → 2 → 3 → 1'),
    ),
  ),
  O(
    'syllable-sort',
    '教室の音節仕分け',
    'Syllable Sweep',
    L('母音がAの札だけ取れ！', 'Collect only cards with vowel A!'),
    'language',
    'books',
    collect(
      'grid',
      ['KA', 'KI', 'SO', 'TA', 'MI', 'RA', 'TO', 'NA'].map((x) => piece(n(x))),
      [0, 3, 5, 7],
    ),
  ),
  O(
    'paper-plane-proof',
    '紙飛行機の対称線',
    'Fold the Wing',
    L('折り目の反対に同じ形を作れ！', 'Mirror the three left-hand squares!'),
    'craft',
    'wind',
    edit(
      'grid',
      [0, 0, 0, 0, 0, 0],
      (v) => (v ? '◆' : '·'),
      (s, i) => set(s, i, 1 - s[i]),
      (s) => equal(s, [0, 1, 1, 1, 1, 0]),
      L('見本は ◆◆·。上の行に鏡写し、下の行に元の模様を作る', 'Copy ◆◆· mirrored on top, original below'),
    ),
  ),
  O(
    'punctuation',
    '最後の記号',
    'Last Punctuation',
    L('問いかけになる記号を選べ！', 'Choose the mark that makes a question!'),
    'language',
    'books',
    choice('story', L('Where is the bell _', 'Where is the bell _'), ['!', '.', ',', '?'], 3),
  ),
  O(
    'timer-tens',
    '十秒目のチャイム',
    'Tenth Tick',
    L('0から数えて10のときに押せ！', 'Press on the tenth tick!'),
    'rhythm',
    'hourglass',
    operate(
      'score',
      [],
      [L('押す', 'Press')],
      (_, t) => ({ props: [piece(n(Math.floor(t.now / 350)))] }),
      (_, i, t) => (Math.floor(t.now / 350) === 10 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'geometry-bridge',
    '直角だけの橋',
    'Right Angle Bridge',
    L('直角をつくる向きをつなげ！', 'Connect turns that make right angles!'),
    'logic',
    'target',
    sequence(
      'track',
      ['↑', '→', '↓', '←'],
      [1, 2, 1],
      L('始点 ↑。右折、右折、左折', 'Start ↑. Turn right, right, then left'),
    ),
  ),
  O(
    'fraction-scale',
    '等しい分数の天びん',
    'Fraction Balance',
    L('1/2と同じ分数を全部選べ！', 'Collect all fractions equal to 1/2!'),
    'math',
    'gem',
    collect(
      'grid',
      ['2/3', '2/4', '4/6', '5/10', '3/6', '1/3'].map((x) => piece(n(x))),
      [1, 3, 4],
    ),
  ),
  O(
    'blackboard-frame',
    '黒板の点線',
    'Dotted Border',
    L('黒板の角だけ囲め！', 'Frame only the four corners!'),
    'craft',
    'crystal',
    edit(
      'grid',
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      (v) => (v ? '■' : '□'),
      (s, i) => set(s, i, 1 - s[i]),
      (s) => equal(s, [1, 0, 1, 0, 0, 0, 1, 0, 1]),
    ),
  ),
  O(
    'group-pencil',
    '余った鉛筆',
    'Spare Pencils',
    L('17本を3人に同じ数だけ配り、余りを選べ！', 'Split 17 equally among 3. Select the remainder!'),
    'math',
    'books',
    choice(
      'counter',
      L('全員にできるだけ多く渡す', 'Give everyone as many as possible'),
      ['1', '2', '3', '5'],
      1,
    ),
  ),
  O(
    'chalk-one-stroke',
    'チョークの一筆',
    'Chalk in One Stroke',
    L('離さず、線を一度ずつたどれ！', 'Travel every edge once!'),
    'logic',
    'wind',
    operate(
      'track',
      [0, 0],
      [n('A'), n('B'), n('C'), n('D')],
      (s) => ({
        note: n(`AT ${'ABCD'[s[0]]} · ${s[1].toString(2).replaceAll('0', '').length}/4`),
        props: [piece(n('A—B—C—D—A'))],
      }),
      (s, i) => {
        const edges = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
          ],
          edge = edges.findIndex((a) => a.includes(i) && a.includes(s[0]) && i !== s[0]);
        if (edge < 0 || s[1] & (1 << edge)) return 'mistake';
        const mask = s[1] | (1 << edge);
        return mask === 15 ? 'clear' : [i, mask];
      },
    ),
  ),
  O(
    'blueprint-count',
    '教室の窓の面積',
    'Window Area',
    L('色がついたマスの数を答えろ！', 'Count the filled window squares!'),
    'math',
    'target',
    choice('grid', L('■■□ / ■□□ / ■■■', '■■□ / ■□□ / ■■■'), ['4', '5', '6', '7'], 2),
  ),
  O(
    'word-tail',
    'ことばのしっぽ',
    'Word Tail',
    L('終わりの文字を次の頭につなげ！', 'Chain words by their last letter!'),
    'language',
    'books',
    sequence(
      'counter',
      ['BELL', 'LAMP', 'MAP', 'PEN'],
      [0, 1, 2, 3],
      L('B → L → M → P。各札は一回ずつ', 'Start with B; use each card once'),
    ),
  ),
  O(
    'absence-parity',
    '点呼の偶奇',
    'Attendance Parity',
    L('出席を動かして、偶数列を作れ！', 'Make each row have an even count!'),
    'logic',
    'shield',
    edit(
      'grid',
      [1, 1, 1, 1, 0, 0],
      (v) => (v ? '●' : '○'),
      (s, i) => swap(s, i, (i + 3) % 6),
      (s) => sum(s.slice(0, 3)) % 2 === 0 && sum(s.slice(3)) % 2 === 0,
      L('押すと向かいの列と交代', 'Swap with the opposite row'),
    ),
  ),
  boss(
    'blackboard-cipher',
    L('3つの数字で黒板の式を成立させろ！', 'Place three digits to balance the equation!'),
    'books',
    operate(
      'machine',
      [],
      ['1', '2', '3', '4', '5', L('消す', 'Erase'), L('確定', 'Submit')],
      (s) => ({
        props: [piece(n(`${s[0] ?? '□'} × ${s[1] ?? '□'} + ${s[2] ?? '□'} = 13`))],
        note: L('3つは別の数。左から小さい順', 'Use three distinct digits in increasing order'),
      }),
      (s, i) =>
        i === 5
          ? s.slice(0, -1)
          : i === 6
            ? s.length === 3 && s[0] < s[1] && s[1] < s[2] && s[0] * s[1] + s[2] === 13
              ? 'clear'
              : 'mistake'
            : s.length < 3
              ? [...s, i + 1]
              : undefined,
    ),
  ),
];
