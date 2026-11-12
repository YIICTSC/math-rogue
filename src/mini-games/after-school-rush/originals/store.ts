import { TOAST_READY, TOAST_BURNT } from '../sceneSignals';
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
  swap,
} from './model';
import type { Prop } from '../rules';

const snacks: Prop[] = ['orange', 'raspberry', 'drumstick', 'egg'];
const checkout = L('会計', 'Checkout');

export const store = [
  O(
    'exact-wallet',
    'お財布ぴったり',
    'Exact Wallet',
    L('2品でちょうど7枚使え！', 'Buy two items for exactly seven coins!'),
    'strategy',
    'coin',
    field(
      'counter',
      [],
      (s) => ({
        props: [piece(n(`${sum(s.map((i) => [2, 3, 4, 6][i]))}/7`))],
        buttons: [
          ...snacks.map((art, i) => sprite(art, s.includes(i) ? 'good' : undefined, n([2, 3, 4, 6][i]))),
          checkout,
        ],
      }),
      (s, i) =>
        i === 4
          ? s.length === 2 && sum(s.map((j) => [2, 3, 4, 6][j])) === 7
            ? 'clear'
            : 'mistake'
          : s.includes(i)
            ? s.filter((j) => j !== i)
            : s.length < 2
              ? [...s, i]
              : undefined,
    ),
  ),
  O(
    'receipt-change',
    'レジの小銭箱',
    'Coin Tray Change',
    L('おつり6枚を、2種類の硬貨で返せ！', 'Make six in change using two coin types!'),
    'math',
    'coin',
    operate(
      'counter',
      [0, 0, 0],
      ['+1', '+2', '+5', L('渡す', 'Give')],
      (s) => ({ props: s.map((v, i) => piece(n(`${[1, 2, 5][i]} × ${v}`))) }),
      (s, i) =>
        i === 3
          ? s.filter((v) => v > 0).length === 2 && sum(s.map((v, j) => v * [1, 2, 5][j])) === 6
            ? 'clear'
            : 'mistake'
          : s[i] < 4
            ? set(s, i, s[i] + 1)
            : undefined,
    ),
  ),
  O(
    'shelf-rotation',
    '先入れおやつ',
    'Front of the Shelf',
    L('期限が近いものから取り出せ！', 'Take the earliest expiries first!'),
    'simulation',
    'raspberry',
    field(
      'stack',
      [0, 0],
      (s) => ({
        buttons: [
          sprite('raspberry', undefined, n(['4', '1', '—'][s[0]])),
          sprite('orange', undefined, n(['2', '3', '—'][s[1]])),
        ],
        note: L(
          '各列の手前しか取れない。手前を取ると奥が見える',
          'Only the front of either shelf is reachable',
        ),
      }),
      (s, i) =>
        s[i] >= 2
          ? undefined
          : i !== [1, 1, 0, 0][sum(s)]
            ? 'mistake'
            : sum(s) === 3
              ? 'clear'
              : set(s, i, s[i] + 1),
    ),
  ),
  O(
    'toast-flip',
    '両面こんがり',
    'Two-Sided Toast',
    L('両面を焼き、焦げる前に皿へ！', 'Toast both sides and serve before they burn!'),
    'simulation',
    'egg',
    operate(
      'machine',
      [0, 0, 0],
      [L('返す', 'Flip'), L('皿へ', 'Serve')],
      (s) => ({
        props: [
          piece(n(`A ${Math.floor(s[0] / 10)}% `), s[2] === 0 ? 'hot' : undefined),
          piece(n(`B ${Math.floor(s[1] / 10)}%`), s[2] === 1 ? 'hot' : undefined),
        ],
        meter: Math.min(...s.slice(0, 2)) / 1000,
      }),
      (s, i) => (i === 0 ? set(s, 2, 1 - s[2]) : Math.min(...s.slice(0, 2)) >= TOAST_READY ? 'clear' : 'mistake'),
      (s, t) => (s[s[2]] + t.dt > TOAST_BURNT ? 'mistake' : set(s, s[2], s[s[2]] + t.dt)),
    ),
  ),
  O(
    'lemon-squeeze',
    'しぼり加減',
    'Juice Press',
    L('種を入れずに3杯ぶんしぼれ！', 'Squeeze three servings without seeds!'),
    'reflex',
    'orange',
    operate(
      'machine',
      [0, -1],
      [L('しぼる', 'Press')],
      (s, t) => ({
        props: [sprite('orange', slot(t.now, 460, 4) === 2 ? 'warn' : 'good')],
        note: slot(t.now, 460, 4) === 2 ? L('種', 'SEEDS') : L('果肉', 'PULP'),
        meter: s[0] / 3,
      }),
      (s, i, t) => {
        const k = Math.floor(t.now / 460);
        return k === s[1] ? undefined : k % 4 === 2 ? 'mistake' : s[0] === 2 ? 'clear' : [s[0] + 1, k];
      },
    ),
  ),
  O(
    'paper-bag',
    '紙袋の底',
    'Bag Packing',
    L('重いものを下に、割れ物を上に！', 'Put heavy items below and fragile ones on top!'),
    'craft',
    'egg',
    sequence(
      'stack',
      [sprite('egg'), sprite('drumstick'), sprite('orange')],
      [1, 2, 0],
      L('下から順に詰める', 'Pack from the bottom up'),
    ),
  ),
  O(
    'fruit-scale',
    '量り売りフルーツ',
    'Fruit by Weight',
    L('はかりを500gに合わせろ！', 'Bring the scale to 500 grams!'),
    'math',
    'orange',
    operate(
      'counter',
      [250],
      ['+150', '+100', '−50', L('量る', 'Weigh')],
      (s) => ({ props: [piece(n(`${s[0]} g`))], meter: s[0] / 650 }),
      (s, i) => (i === 3 ? (s[0] === 500 ? 'clear' : 'mistake') : [Math.max(0, s[0] + [150, 100, -50][i])]),
    ),
  ),
  O(
    'allergy-order',
    'アレルギー注文票',
    'Allergy Order',
    L('注文に合うお弁当を選べ！', 'Choose the lunch that matches the order!'),
    'logic',
    'drumstick',
    choice(
      'counter',
      L('卵なし、果物2種類、チキンあり', 'No egg, two fruits, and chicken'),
      ['🍊＋🍗＋🥚', '🍊＋🍓', '🍊＋🍓＋🍗', '🍓＋🍗＋🥚'],
      2,
    ),
  ),
  O(
    'conveyor-divert',
    '注文レーンの分岐',
    'Snack Diverter',
    L('流れてくる品を正しいかごへ！', 'Divert each snack into its proper basket!'),
    'reflex',
    'raspberry',
    operate(
      'track',
      [0],
      [L('冷蔵', 'Chill'), L('常温', 'Shelf')],
      (s, t) => ({
        props: [sprite(snacks[[2, 0, 3, 1][s[0]]], t.now > 750 + s[0] * 1280 ? 'good' : 'muted')],
        meter: s[0] / 4,
      }),
      (s, i, t) =>
        t.now < 450 + s[0] * 1280
          ? undefined
          : i !== [0, 1, 0, 1][s[0]]
            ? 'mistake'
            : s[0] === 3
              ? 'clear'
              : [s[0] + 1],
      (s, t) => (t.now > 1800 + s[0] * 1280 ? 'mistake' : undefined),
    ),
  ),
  O(
    'stack-order',
    '冷蔵箱の積み替え',
    'Chilled Crates',
    L(
      '中箱を冷蔵棚へ。小箱と大箱は出荷棚へ！',
      'Chill the medium crate; ship the small and large crates!',
      'ちゅうばこを れいぞうだなへ。こばこと おおばこは しゅっかだなへ！',
    ),
    'logic',
    'egg',
    field(
      'stack',
      [0, 0, 0, -1],
      (s) => ({
        note: L(
          '手前の小箱から運ぶ。大きい箱は小さい箱の上に置けない。中箱は冷蔵後に固定。',
          'Move the top crate first. No larger crate on a smaller one. The chilled middle crate locks in place.',
          'てまえの こばこから はこぶ。おおきい はこは ちいさい はこの うえに おけない。ちゅうばこは れいぞうごに こてい。',
        ),
        buttons: [
          L('荷受け', 'Intake', 'にうけ'),
          L('冷蔵', 'Chill', 'れいぞう'),
          L('出荷', 'Ship', 'しゅっか'),
        ].map((label, i) => {
          const sizes = s.slice(0, 3).flatMap((shelf, index) => (shelf === i ? [index + 1] : []));
          const crates = sizes.join(' · ') || '—';
          return piece(
            L(`${label[0]} ${crates}`, `${label[1]} ${crates}`, `${label[2]} ${crates}`),
            s[3] === i ? 'good' : undefined,
          );
        }),
      }),
      (s, i) => {
        if (s[3] < 0) return set(s, 3, i);
        const source = s[3];
        const crate = s.slice(0, 3).indexOf(source);
        const top = s.slice(0, 3).indexOf(i);
        const blocked = crate < 0 || i === source || (crate === 1 && source === 1) || (top >= 0 && top < crate);
        if (blocked) return set(s, 3, -1);
        const next = set(set(s, crate, i), 3, -1);
        return next[0] === 2 && next[1] === 1 && next[2] === 2 ? 'clear' : next;
      },
    ),
    13,
  ),
  O(
    'stamp-card',
    'ポイントカードの穴',
    'Loyalty Punch',
    L('たて・よこで隣り合わずに3個押せ！', 'Place three stamps with no side-by-side pair!'),
    'logic',
    'target',
    field(
      'grid',
      [],
      (s) => ({
        buttons: Array.from({ length: 9 }, (_, i) =>
          piece(n(s.includes(i) ? '★' : '□'), s.includes(i) ? 'good' : undefined),
        ),
        meter: s.length / 3,
      }),
      (s, i) =>
        s.includes(i)
          ? undefined
          : s.some((j) => Math.abs((i % 3) - (j % 3)) + Math.abs(((i / 3) | 0) - ((j / 3) | 0)) === 1)
            ? 'mistake'
            : s.length === 2
              ? 'clear'
              : [...s, i],
    ),
  ),
  O(
    'price-trace',
    '値札の割引跡',
    'Discount Trail',
    L('3割引き後に7枚になる値札は？', 'Which price becomes seven after a 30% discount?'),
    'math',
    'coin',
    choice('counter', L('値引き前の価格を選ぶ', 'Pick the original price'), ['8', '9', '10', '12'], 2),
  ),
  O(
    'oven-queue',
    'オーブンの空き時間',
    'Oven Booking',
    L('2分つづけて空く枠を押せ！', 'Find two uninterrupted free slots!'),
    'strategy',
    'hourglass',
    choice(
      'track',
      L('1分ごとに × ○ × ○ ○ ×', 'Each slot is one minute: × ○ × ○ ○ ×'),
      ['1', '2', '4', '5'],
      2,
    ),
  ),
  O(
    'fruit-pair-swap',
    'くだもの隣接便',
    'Fruit Neighbors',
    L('同じ果物どうしを隣に並べろ！', 'Put each matching fruit pair side by side!'),
    'logic',
    'raspberry',
    edit(
      'counter',
      [0, 1, 0, 1],
      (v) => sprite(snacks[v]),
      (s, i) => (i < 3 ? swap(s, i, i + 1) : undefined),
      (s) => s[0] === s[1] && s[2] === s[3],
      L('押すと右隣と交換', 'Tap to swap with the next item'),
    ),
  ),
  O(
    'hot-cold-order',
    '冷やしてから出す',
    'Cool Before Serving',
    L('熱いプリンをちょうどよく冷ませ！', 'Chill the hot pudding to serving temperature!'),
    'simulation',
    'egg',
    operate(
      'machine',
      [78],
      [L('氷 −15', 'Ice −15'), L('風 −4', 'Fan −4'), L('出す', 'Serve')],
      (s) => ({
        props: [piece(n(`${s[0]}°`), s[0] > 45 ? 'hot' : 'cool')],
        zone: [0.37, 0.42],
        marker: s[0] / 100,
      }),
      (s, i) =>
        i === 2
          ? s[0] >= 37 && s[0] <= 42
            ? 'clear'
            : 'mistake'
          : s[0] < 37
            ? 'mistake'
            : [s[0] - [15, 4][i]],
    ),
  ),
  O(
    'recipe-audit',
    '材料の混入',
    'Ingredient Audit',
    L('レシピにないものだけ取り除け！', 'Remove only what is missing from the recipe!'),
    'logic',
    'drumstick',
    collect(
      'counter',
      ['orange', 'raspberry', 'egg', 'slime', 'orange', 'gem', 'egg'].map((v) => sprite(v as Prop)),
      [3, 5],
      L('材料はオレンジ、ラズベリー、卵', 'Recipe: orange, raspberry, egg'),
    ),
  ),
  O(
    'refund-loop',
    '返品の三つ巴',
    'Refund Loop',
    L('在庫を A=2・B=1・C=1 に！', 'Set stock to A=2, B=1, C=1!'),
    'simulation',
    'coin',
    edit(
      'counter',
      [4, 0, 0],
      (v, i) => n(`${'ABC'[i]} ${v} →`),
      (s, i) => (s[i] ? s.map((v, j) => v - Number(j === i) + Number(j === (i + 1) % 3)) : undefined),
      (s) => equal(s, [2, 1, 1]),
      L('1個を右へ送る。Cの次はA', 'Send one item right; C wraps to A'),
    ),
  ),
  O(
    'queue-memory',
    '聞き取り注文',
    'Counter Recall',
    L('最初に頼まれた品と最後の品を選べ！', 'Select the first and last orders!'),
    'memory',
    'raspberry',
    sequence(
      'story',
      snacks.map((x) => sprite(x)),
      [2, 0],
      L('順番どおり', 'First, then last'),
      (_, t) => (t.now < 2300 ? [sprite(snacks[[2, 1, 0][slot(t.now, 770, 3)]])] : []),
    ),
  ),
  O(
    'sticker-align',
    '値札をまっすぐ',
    'Straight Label',
    L('貼り付ける前に角度を0°へ！', 'Straighten the label to zero degrees!'),
    'craft',
    'target',
    operate(
      'orbit',
      [60],
      [L('左に45°', 'Left 45°'), L('右に30°', 'Right 30°'), L('貼る', 'Stick')],
      (s) => ({ props: [piece(n(`${s[0]}°`))], marker: s[0] / 360, zone: [0, 0.03] }),
      (s, i) => (i === 2 ? (s[0] === 0 ? 'clear' : 'mistake') : [(s[0] + [315, 30][i]) % 360]),
    ),
  ),
  boss(
    'last-call',
    L('3件の注文を、オーブン1台で時間内にさばけ！', 'Complete three orders with one oven!'),
    'drumstick',
    field(
      'machine',
      [0, 0, 0],
      (s, t) => ({
        buttons: [
          sprite('egg', s[0] ? 'good' : undefined, L('卵 2秒', 'Egg 2s')),
          sprite('drumstick', s[1] ? 'good' : undefined, L('チキン 3秒', 'Chicken 3s')),
          sprite('orange', s[2] ? 'good' : undefined, L('オレンジ 1秒', 'Orange 1s')),
        ],
        props: [piece(n(`EGG 0–5s / CHICKEN 0–7s / ORANGE 4–8s`))],
        meter: s.filter((v) => v > 0 && v <= t.now).length / 3,
      }),
      (s, i, t) =>
        s[i] || s.some((v) => v > t.now)
          ? undefined
          : t.now < [0, 0, 4000][i] || t.now + [2000, 3000, 1000][i] > [5000, 7000, 8000][i]
            ? 'mistake'
            : set(s, i, t.now + [2000, 3000, 1000][i]),
      (s, t) => (s.every((v) => v > 0 && v <= t.now) ? 'clear' : undefined),
    ),
  ),
];
