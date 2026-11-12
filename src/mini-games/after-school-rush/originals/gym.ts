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
  set,
  slot,
  sprite,
  swap,
  timed,
  triangle,
} from './model';

export const gym = [
  O(
    'serve-angle',
    'サーブの角度',
    'Banked Serve',
    L('床の線に当たる角度でサーブ！', 'Serve at the angle that hits the floor line!'),
    'motion',
    'target',
    timed(
      'orbit',
      L('狙う角度は表示された帯', 'Aim for the marked angle'),
      [L('サーブ', 'Serve')],
      2300,
      (x) => ({ marker: x, zone: [0.7, 0.85] }),
      (_, x) => x >= 0.7 && x <= 0.85,
    ),
  ),
  O(
    'rebound-race',
    'こぼれ球争い',
    'Rebound Race',
    L('跳ね返る列へ先回りしろ！', 'Move to the lane where the ball will rebound!'),
    'reflex',
    'target',
    operate(
      'track',
      [1, 0],
      ['←', '→'],
      (s, t) => ({
        props: [piece(n(['L', 'MID', 'R'][s[0]])), sprite('target', undefined, n(['←', '→', '←'][s[1]]))],
        note: L('球は表示の反対側へはね返る', 'The ball rebounds to the side opposite the arrow'),
        meter: s[1] / 3,
      }),
      (s, i) => [Math.max(0, Math.min(2, s[0] + (i ? 1 : -1))), s[1]],
      (s, t) =>
        pulse(t, 1450 + s[1] * 1450)
          ? s[0] !== [2, 0, 2][s[1]]
            ? 'mistake'
            : s[1] === 2
              ? 'clear'
              : [s[0], s[1] + 1]
          : undefined,
    ),
  ),
  O(
    'passing-triangle',
    '三角パス',
    'Triangle Pass',
    L('守備を避けて3人にパスを回せ！', 'Pass around the defender to all three teammates!'),
    'strategy',
    'shield',
    field(
      'orbit',
      [0],
      (s) => ({
        props: [piece(n(`AT ${['A', 'C', 'A'][s[0]]}`)), piece(n(`DEFENDER ${['B', 'B', 'C'][s[0]]}`))],
        buttons: ['A', 'B', 'C'],
        meter: s[0] / 3,
      }),
      (s, i) => (i !== [2, 0, 1][s[0]] ? 'mistake' : s[0] === 2 ? 'clear' : [s[0] + 1]),
    ),
  ),
  O(
    'floor-mat-fit',
    'マットの継ぎ目',
    'Mat Fit',
    L('切れ目の向きを見本とそろえろ！', 'Turn the mats to match the pattern!'),
    'craft',
    'shield',
    edit(
      'grid',
      [0, 1, 2, 0],
      (v) => ['◧', '◨', '◩'][v],
      (s, i) => set(s, i, (s[i] + 1) % 3),
      (s) => equal(s, [0, 2, 1, 0]),
      L('見本 ◧ ◩ / ◨ ◧', 'Pattern: ◧ ◩ / ◨ ◧'),
    ),
  ),
  O(
    'score-inversion',
    '得点板の裏面',
    'Reverse Scoreboard',
    L('裏返した札から合計点を読め！', 'Read the score after flipping the cards!'),
    'math',
    'books',
    choice(
      'counter',
      L(
        '手前は 6・6・2。裏では6と9が入れ替わり、2はそのまま',
        'Front: 6, 6, 2. On the back 6 and 9 swap; 2 stays.',
      ),
      ['16', '17', '18', '20'],
      3,
    ),
  ),
  O(
    'pacer',
    'ペースメーカー',
    'Pacer',
    L('先頭を抜かず、1歩差を保て！', 'Stay one step behind the pacer!'),
    'motion',
    'hourglass',
    operate(
      'track',
      [0, 0],
      [L('進む', 'Step'), L('待つ', 'Wait')],
      (s, t) => ({
        props: [piece(n(`YOU ${s[0]} / LEADER ${Math.min(5, 1 + Math.floor(t.now / 850))}`))],
        meter: s[0] / 4,
      }),
      (s, i, t) =>
        i === 1
          ? undefined
          : s[0] + 1 >= Math.min(5, 1 + Math.floor(t.now / 850))
            ? 'mistake'
            : s[0] === 3
              ? 'clear'
              : [s[0] + 1, 0],
    ),
  ),
  O(
    'whistle-gap',
    '笛のすき間',
    'Whistle Gap',
    L('笛が鳴っていない区間だけ走れ！', 'Run only during the silent interval!'),
    'rhythm',
    'hourglass',
    field(
      'score',
      [0, -1],
      (s, t) => ({
        props: [
          piece(
            slot(t.now, 660, 3) === 1 ? L('無音', 'SILENT') : L('笛', 'WHISTLE'),
            slot(t.now, 660, 3) === 1 ? 'good' : 'warn',
          ),
        ],
        buttons: [L('走る', 'Run')],
        meter: s[0] / 2,
      }),
      (s, i, t) => {
        const k = Math.floor(t.now / 660);
        return k % 3 !== 1 ? 'mistake' : s[1] === k ? undefined : s[0] === 1 ? 'clear' : [1, k];
      },
    ),
  ),
  O(
    'bleacher-steps',
    '観客席の二段跳び',
    'Bleacher Steps',
    L('段差を飛ばし、残りちょうど0段に！', 'Jump steps to land exactly at the top!'),
    'motion',
    'wind',
    operate(
      'stack',
      [0, 0],
      ['2 ↑', '3 ↑'],
      (s) => ({ props: [piece(n(`STEP ${s[0]} / 8`))], meter: s[0] / 8 }),
      (s, i) => {
        const d = i + 2;
        if (s[1] === d || s[0] + d > 8) return 'mistake';
        return s[0] + d === 8 ? 'clear' : [s[0] + d, d];
      },
    ),
  ),
  O(
    'equipment-draft',
    '道具の取り合い',
    'Equipment Draft',
    L('相手より多く点を取れ！', 'Draft more points than your opponent!'),
    'strategy',
    'coin',
    field(
      'counter',
      [0, 0, 0],
      (s) => ({
        props: [piece(n(`YOU ${s[1]} · RIVAL ${s[2]}`))],
        buttons: [2, 5, 7, 9].map((v, i) =>
          piece(n(v), s[0] & (1 << i) ? 'muted' : undefined, Boolean(s[0] & (1 << i))),
        ),
      }),
      (s, i) => {
        if (s[0] & (1 << i)) return;
        const values = [2, 5, 7, 9],
          mask = s[0] | (1 << i);
        const j = values.findIndex((_, k) => !(mask & (1 << k)));
        const next = mask | (1 << j),
          a = s[1] + values[i],
          b = s[2] + values[j];
        return next === 15 ? (a > b ? 'clear' : 'mistake') : [next, a, b];
      },
    ),
  ),
  O(
    'scoreboard-timeout',
    '残り時間の申告',
    'Time-Out Call',
    L('前半と後半を足した時間を選べ！', 'Select the total playing time!'),
    'math',
    'hourglass',
    choice(
      'score',
      L('前半 2:40 ＋ 後半 1:35', 'First half 2:40 plus second half 1:35'),
      ['3:75', '4:05', '4:15', '4:25'],
      2,
    ),
  ),
  O(
    'cracked-shuttle',
    '羽根を見分ける',
    'Shuttle Inspection',
    L('左右の羽根が同数のものだけ選べ！', 'Collect only shuttles with symmetric feathers!'),
    'logic',
    'wind',
    collect(
      'orbit',
      ['≪◆≫', '≪◆›', '‹◆›', '‹◆≫', '≪◆≫'].map((v) => piece(n(v))),
      [0, 2, 4],
    ),
  ),
  O(
    'team-capacity',
    'チームの人数調整',
    'Roster Limit',
    L('1人ずつ交換して人数差を1に！', 'Trade one player at a time until the gap is one!'),
    'strategy',
    'books',
    operate(
      'counter',
      [2, 7],
      [L('BからAへ', 'B → A'), L('AからBへ', 'A → B')],
      (s) => ({ props: [piece(n(`A ${s[0]}`)), piece(n(`B ${s[1]}`))] }),
      (s, i) => {
        const a = s[0] + (i ? -1 : 1),
          b = 9 - a;
        return a < 0 || b < 0 ? 'mistake' : Math.abs(a - b) === 1 ? 'clear' : [a, b];
      },
    ),
  ),
  O(
    'basket-orbit',
    '回るリング',
    'Orbit Shot',
    L('輪が正面に来た瞬間を狙え！', 'Shoot when the hoop faces forward!'),
    'reflex',
    'target',
    operate(
      'orbit',
      [],
      [L('投げる', 'Shoot')],
      (_, t) => ({ props: [piece(n(['○', '◇', '|', '◇'][slot(t.now, 460, 4)]))] }),
      (_, i, t) => (slot(t.now, 460, 4) === 0 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'net-repair',
    'ネットの破れ目',
    'Net Repair',
    L('点線だけ結んでネットを直せ！', 'Tie only the loose knots!'),
    'craft',
    'target',
    collect(
      'grid',
      ['✕', '┼', '┆', '┼', '┆', '✕', '┼', '┼', '┆'].map((v) => piece(n(v))),
      [2, 4, 8],
    ),
  ),
  O(
    'crane-team',
    '逆向きの連携',
    'Counter-Steer Lift',
    L('左右を同時に同じ高さへ持ち上げろ！', 'Lift both sides to the same height together!'),
    'simulation',
    'shield',
    operate(
      'machine',
      [0, 0],
      [L('左右＋1', 'Both +1'), L('左＋2 / 右−1', 'Left +2 / right −1'), L('右＋2', 'Right +2')],
      (s) => ({
        props: [piece(n(`L ${s[0]}`)), piece(n(`R ${s[1]}`))],
        note: L('目標は左右5', 'Target: five on both sides'),
      }),
      (s, i) => {
        const v = [s[0] + [1, 2, 0][i], s[1] + [1, -1, 2][i]];
        return equal(v, [5, 5]) ? 'clear' : v.some((x) => x < 0 || x > 5) ? 'mistake' : v;
      },
    ),
  ),
  O(
    'racket-grip',
    'ラケットの表裏',
    'Racket Sides',
    L('色の合う面で3球返せ！', 'Return three shots with matching racket faces!'),
    'motion',
    'shield',
    operate(
      'score',
      [0, 0],
      [L('返す', 'Hit'), L('面を返す', 'Flip face')],
      (s) => ({ props: [piece(n(`FACE ${['○', '◆'][s[1]]}`)), piece(n(`BALL ${['◆', '○', '○'][s[0]]}`))] }),
      (s, i) =>
        i === 1
          ? [s[0], 1 - s[1]]
          : s[1] !== [1, 0, 0][s[0]]
            ? 'mistake'
            : s[0] === 2
              ? 'clear'
              : [s[0] + 1, s[1]],
    ),
  ),
  O(
    'false-start',
    'フライングを我慢',
    'False Start',
    L('「位置」「用意」の後、スタートだけ反応！', 'Ignore READY and SET. React only to GO!'),
    'reflex',
    'hourglass',
    field(
      'story',
      [],
      (_, t) => ({
        props: [
          piece(t.now < 700 ? L('位置', 'READY') : t.now < 1820 ? L('用意', 'SET') : L('スタート！', 'GO!')),
        ],
        buttons: [L('走る', 'Run')],
      }),
      (_, i, t) => (t.now >= 1820 && t.now < 2200 ? 'clear' : 'mistake'),
    ),
  ),
  O(
    'ladder-sets',
    'セット差の逆転',
    'Set Difference',
    L('2勝差になる得点を選べ！', 'Pick the score with a lead of two wins!'),
    'logic',
    'target',
    choice(
      'counter',
      L('勝利数が左、敗北数が右', 'Wins on the left; losses on the right'),
      ['4–1', '5–3', '4–4', '3–4'],
      1,
    ),
  ),
  O(
    'floor-curl',
    'モップの折り返し',
    'Mop Curl',
    L('止まる力も使い、中央ぴったりで止めろ！', 'Use both push and brake to stop at center!'),
    'simulation',
    'wind',
    operate(
      'track',
      [0, 0],
      [L('押す', 'Push'), L('止める', 'Brake')],
      (s) => ({ marker: s[0] / 9, zone: [5.5 / 9, 6.5 / 9], props: [piece(n(`X ${s[0]} · V ${s[1]}`))] }),
      (s, i) => {
        const speed = Math.max(0, s[1] + (i ? -1 : 1)),
          x = s[0] + speed;
        return x === 6 && speed === 0 ? 'clear' : x > 6 ? 'mistake' : [x, speed];
      },
    ),
  ),
  boss(
    'three-lane-tournament',
    L('照準を合わせ、盾を割ってから得点を3回決めろ！', 'Aim, break each shield, and score three times!'),
    'target',
    operate(
      'track',
      [1, 0, 0],
      [L('左', 'Left'), L('右', 'Right'), L('打つ', 'Shoot')],
      (s, t) => {
        const lane = slot(t.now + s[1] * 530, 1400, 3);
        return {
          props: [
            piece(n(`AIM ${s[0] + 1}`)),
            sprite(s[2] ? 'target' : 'shield', s[2] ? 'good' : 'warn', n(lane + 1)),
          ],
          meter: s[1] / 3,
        };
      },
      (s, i, t) =>
        i < 2
          ? [Math.max(0, Math.min(2, s[0] + (i ? 1 : -1))), s[1], s[2]]
          : s[0] !== slot(t.now + s[1] * 530, 1400, 3)
            ? 'mistake'
            : s[2] === 0
              ? [s[0], s[1], 1]
              : s[1] === 2
                ? 'clear'
                : [s[0], s[1] + 1, 0],
    ),
  ),
];
