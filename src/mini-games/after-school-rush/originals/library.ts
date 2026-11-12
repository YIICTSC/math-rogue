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
  slot,
  sprite,
  sum,
} from './model';

export const library = [
  O(
    'shelf-cipher',
    '背表紙の並び',
    'Spine Cipher',
    L('巻数の飛びを見つけろ！', 'Find the missing volume!'),
    'logic',
    'books',
    choice('stack', L('2 · 4 · 8 · ? · 32', '2 · 4 · 8 · ? · 32'), ['10', '12', '16', '24'], 2),
  ),
  O(
    'bookend-balance',
    '倒れない本棚',
    'Shelf Balance',
    L('本の高さの差を1以下に！', 'Keep adjacent books within one height!'),
    'craft',
    'books',
    edit(
      'stack',
      [1, 4, 2, 4],
      (v) => piece(n('▰'.repeat(v))),
      (s, i) => (s[i] > 1 ? set(s, i, s[i] - 1) : undefined),
      (s) => s.every((v, i) => i === 0 || Math.abs(v - s[i - 1]) <= 1) && s.some((v) => v >= 3),
      L(
        '押した本を1段だけ下げる。高さ3以上の本を残す',
        'Lower a book one level. Keep at least one height three or higher',
      ),
    ),
  ),
  O(
    'genre-cross',
    '分類札の交差',
    'Shelf Cross Index',
    L('動物で、空を飛び、夜に出る本は？', 'Which animal flies and comes out at night?'),
    'logic',
    'ghost-cat',
    choice(
      'grid',
      L('3つの条件すべてに合う本を選ぶ', 'Find the book satisfying all three clues'),
      [L('スズメ', 'Sparrow'), L('コウモリ', 'Bat'), L('ネコ', 'Cat'), L('カブトムシの標本', 'Beetle model')],
      1,
    ),
  ),
  O(
    'roman-paging',
    'ローマ数字の栞',
    'Roman Bookmark',
    L('12ページを開け！', 'Open page twelve!'),
    'language',
    'books',
    choice('counter', L('I=1 · V=5 · X=10', 'I=1 · V=5 · X=10'), ['VIII', 'XI', 'XII', 'XIV'], 2),
  ),
  O(
    'whisper-watch',
    '小声の司書',
    'Whisper Watch',
    L('司書が見ていない間に、しおりを2枚回収！', 'Collect two bookmarks while the librarian looks away!'),
    'reflex',
    'ghost-cat',
    field(
      'story',
      [0, -1],
      (s, t) => ({
        props: [
          sprite('ghost-cat', slot(t.now, 600, 2) ? 'muted' : 'warn'),
          piece(slot(t.now, 600, 2) ? L('後ろ向き', 'LOOKING AWAY') : L('見ている', 'WATCHING')),
        ],
        buttons: [L('回収', 'Take')],
        meter: s[0] / 2,
      }),
      (s, i, t) => {
        const k = Math.floor(t.now / 600);
        return !(k % 2) ? 'mistake' : s[1] === k ? undefined : s[0] === 1 ? 'clear' : [1, k];
      },
    ),
  ),
  O(
    'torn-index',
    '破れた目次',
    'Torn Index',
    L('重なる文字で3片をつなげ！', 'Join three strips by their shared edge letters!'),
    'craft',
    'books',
    sequence(
      'stack',
      ['BC', 'AB', 'CD'],
      [1, 0, 2],
      L('Aから始め、末尾と頭を重ねる', 'Start with A and overlap the end letters'),
    ),
  ),
  O(
    'off-by-page',
    'ページ送りのくせ',
    'Sticky Pages',
    L('飛びやすいページを避けて9へ！', 'Reach page 9 despite the skipped pages!'),
    'logic',
    'hourglass',
    operate(
      'stack',
      [1],
      [L('1枚めくる', 'Turn one'), L('2枚めくる', 'Turn two')],
      (s) => ({
        props: [piece(n(`PAGE ${s[0]}`))],
        note: L('4と7はくっついており、次まで飛ぶ', 'Pages 4 and 7 stick to the next page'),
      }),
      (s, i) => {
        let v = s[0] + i + 1;
        if (v === 4 || v === 7) v++;
        return v === 9 ? 'clear' : v > 9 ? 'mistake' : [v];
      },
    ),
  ),
  O(
    'borrow-chain',
    '貸出の伝言',
    'Borrowing Chain',
    L('同じ人に戻らず、伝言を3人に渡せ！', 'Pass the note to three people without revisiting!'),
    'strategy',
    'books',
    operate(
      'story',
      [0, 1],
      ['A', 'B', 'C', 'D'],
      (s) => ({
        props: [piece(n(`NOW ${'ABCD'[s[0]]}`))],
        note: L('A→B/C · B→D · C→B · D→C', 'A→B/C · B→D · C→B · D→C'),
      }),
      (s, i) =>
        ![[1, 2], [3], [1], [2]][s[0]].includes(i) || s[1] & (1 << i)
          ? 'mistake'
          : (s[1] | (1 << i)) === 15
            ? 'clear'
            : [i, s[1] | (1 << i)],
    ),
  ),
  O(
    'double-copy',
    '写本の取り違え',
    'Scribe’s Slip',
    L('左右で違う行だけ直せ！', 'Correct only the mismatched rows!'),
    'logic',
    'books',
    collect(
      'stack',
      ['AB | AB', 'BC | CB', 'DD | DD', 'EF | EE', 'FG | FG'].map((v) => piece(n(v))),
      [1, 3],
    ),
  ),
  O(
    'catalogue-order',
    '棚番号の辞書順',
    'Call Number Sort',
    L('棚で最初に来る番号は？', 'Which call number comes first?'),
    'language',
    'books',
    choice(
      'stack',
      L('最初に英字、次に数の小さい順', 'Sort by letter, then by number'),
      ['B02', 'A12', 'A03', 'C01'],
      2,
    ),
  ),
  O(
    'memory-cover',
    '閉じた本の表紙',
    'Under the Jacket',
    L('中央の本にあった印を覚えろ！', 'Remember the mark on the middle book!'),
    'memory',
    'gem',
    field(
      'stack',
      [],
      (_, t) => ({
        props: t.now < 1600 ? [sprite('egg'), sprite('gem'), sprite('books')] : [piece(n('▰ ▰ ▰'))],
        buttons: [sprite('egg'), sprite('books'), sprite('gem')].map((p) => ({ ...p, disabled: t.now < 1600 })),
      }),
      (_, i, t) => (t.now < 1600 ? undefined : i === 2 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'hidden-shelf',
    '奥の棚を引き出す',
    'Pull-Out Shelf',
    L('重なりを崩さずに鍵を取り出せ！', 'Extract the key without toppling the pile!'),
    'strategy',
    'gem',
    operate(
      'stack',
      [2, 1],
      [L('左から外す', 'Remove left'), L('右から外す', 'Remove right'), L('鍵を取る', 'Take key')],
      (s) => ({ props: [piece(n(`L ${s[0]}`)), sprite('gem'), piece(n(`R ${s[1]}`))] }),
      (s, i) =>
        i === 2
          ? sum(s) === 0
            ? 'clear'
            : 'mistake'
          : !s[i]
            ? undefined
            : Math.abs(s[0] - s[1] - (i ? -1 : 1)) > 1
              ? 'mistake'
              : set(s, i, s[i] - 1),
    ),
  ),
  O(
    'spine-riddle',
    '書名の頭文字',
    'Spine Acrostic',
    L('背表紙の頭をつなぐと？', 'Read the first letter of every book!'),
    'language',
    'books',
    choice(
      'stack',
      L('Wind / Island / Note / Door', 'Wind / Island / Note / Door'),
      ['WIND', 'WIDE', 'WINE', 'WING'],
      0,
    ),
  ),
  O(
    'overdue-date',
    '日付をまたぐ返却',
    'Midnight Return',
    L('次の日に入って何時間遅れ？', 'How many hours late after midnight?'),
    'math',
    'hourglass',
    choice(
      'counter',
      L('締切23時。実際は翌日の2時', 'Due at 23:00. Returned at 02:00 next day.'),
      ['2', '3', '5', '21'],
      1,
    ),
  ),
  O(
    'shelf-dial',
    '二重しおり',
    'Double Bookmark',
    L('2枚のしおりを別の指定ページに！', 'Place both bookmarks on their own pages!'),
    'craft',
    'gem',
    operate(
      'stack',
      [1, 1],
      [L('赤＋1 / 青＋2', 'Red +1 / Blue +2'), L('青＋1', 'Blue +1'), L('閉じる', 'Close')],
      (s) => ({
        props: [piece(n(`RED ${s[0]}`)), piece(n(`BLUE ${s[1]}`))],
        note: L('赤は3、青は4。ページは5で1に戻る', 'Red goes to 3, blue to 4; page 5 wraps to 1'),
      }),
      (s, i) =>
        i === 2
          ? equal(s, [3, 4])
            ? 'clear'
            : 'mistake'
          : i === 0
            ? [(s[0] % 5) + 1, ((s[1] + 1) % 5) + 1]
            : [s[0], (s[1] % 5) + 1],
    ),
  ),
  O(
    'book-queue',
    '先頭に予約本',
    'Reserved First',
    L('予約の赤い本を先頭に回せ！', 'Rotate the reserved book to the front!'),
    'logic',
    'books',
    edit(
      'track',
      [0, 0, 1, 0, 0],
      (v) => sprite(v ? 'gem' : 'books'),
      (s, i) => [...s.slice(i), ...s.slice(0, i)],
      (s) => s[0] === 1,
      L('選んだ本から後ろを先頭へ回す', 'Bring the chosen book and those after it to the front'),
    ),
  ),
  O(
    'word-shelf',
    '読みが同じ札',
    'Sound-Alike Shelf',
    L('読みが同じ英単語を2枚取れ！', 'Collect the two words that sound like “sea”!'),
    'language',
    'books',
    collect(
      'counter',
      ['SAY', 'SEE', 'SHE', 'SEA', 'SAW'].map((v) => piece(n(v))),
      [1, 3],
      L('「海」と同じ音', 'Match the sound of “sea”'),
    ),
  ),
  O(
    'paper-trim',
    '本の天地そろえ',
    'Trim the Pages',
    L('ページ端を同じ高さに切りそろえろ！', 'Trim the page edges to the same height!'),
    'craft',
    'books',
    operate(
      'stack',
      [4, 5, 4],
      [L('左2列を切る', 'Cut left pair'), L('右2列を切る', 'Cut right pair')],
      (s) => ({
        props: s.map((v) => piece(n('▌'.repeat(v)))),
        note: L(
          '刃は隣り合う2列を同時に切る。3段にそろえる',
          'Each cut lowers two adjacent stacks. Leave all three at height 3.',
        ),
      }),
      (s, i) => {
        const v = s.map((v, j) => v - Number(j === i || j === i + 1));
        return v.some((n) => n < 3) ? 'mistake' : v.every((n) => n === 3) ? 'clear' : v;
      },
    ),
  ),
  O(
    'vanishing-letter',
    '抜け落ちた一文字',
    'Vanishing Letter',
    L('消えた一文字を選べ！', 'Select the letter that disappeared!'),
    'memory',
    'books',
    field(
      'counter',
      [],
      (_, t) => ({
        props: [piece(n(t.now < 1450 ? 'S H E L F' : 'S H _ L F'))],
        buttons: ['H', 'E', 'L', 'S'].map((v) => piece(n(v), undefined, t.now < 1450)),
      }),
      (_, i, t) => (t.now < 1450 ? undefined : i === 1 ? 'clear' : 'mistake'),
    ),
  ),
  boss(
    'vanishing-index',
    L('点灯した目録を覚え、消えたら逆順で追え！', 'Watch the index light up, then retrace it backwards!'),
    'books',
    field(
      'stack',
      [0],
      (s, t) => ({
        props: [piece(t.now < 4250 ? L('覚える', 'WATCH') : L('逆順で入力', 'REVERSE IT'))],
        buttons: Array.from({ length: 6 }, (_, i) =>
          piece(
            n(i + 1),
            t.now < 4200 && [1, 5, 2, 4, 0, 3][slot(t.now, 700, 6)] === i ? 'good' : undefined,
            t.now < 4250,
          ),
        ),
        meter: s[0] / 6,
      }),
      (s, i, t) =>
        t.now < 4250
          ? undefined
          : i !== [3, 0, 4, 2, 5, 1][s[0]]
            ? 'mistake'
            : s[0] === 5
              ? 'clear'
              : [s[0] + 1],
    ),
  ),
];
