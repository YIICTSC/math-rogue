import type { Copy } from './catalog';
import type { DominoGame, ExtraDominoGame } from './model';

export const DOMINO_CATEGORIES = {
  block: ['ブロック系', 'Blocking', 'ブロックけい'],
  points: ['点数系', 'Point scoring', 'てんすうけい'],
  tricks: ['トリックテイキング', 'Trick-taking'],
  layout: ['盤面・配置', 'Tile placement', 'はいち'],
  sets: ['組み合わせ', 'Set building', 'くみあわせ'],
} satisfies Record<string, Copy>;
export type DominoCategory = keyof typeof DOMINO_CATEGORIES;
export const DOMINO_LEVELS = [
  ['初心者向け', 'Beginner', 'しょしんしゃむけ'],
  ['中級', 'Intermediate', 'ちゅうきゅう'],
  ['上級', 'Advanced', 'じょうきゅう'],
] satisfies Copy[];

type Listing = readonly [
  title: Copy,
  source: string,
  category: DominoCategory,
  level: 0 | 1 | 2,
  ...instructions: Copy[],
];
export const EXTRA_DOMINO_CATALOG = {
  buki: [
    ['ブキドミノ', 'Bukidomino'],
    'buki',
    'block',
    1,
    [
      'ダブルを除いた0〜8の牌で両端をつなぎます。',
      'Match either end with a double-eight set without doubles.',
    ],
    [
      'バンカー以外は対局用チップを賭け、手牌をなくすか、全員が詰まったときに残り目が最少なら勝ちです。',
      'Non-bankers stake match chips. Go out or have the lowest pip total on a block.',
    ],
  ],
  pulle: [
    ['プレ', 'Pulle'],
    'buki',
    'block',
    1,
    [
      'ダブルのない牌をつなぎ、手に残った目を罰点にします。',
      'Play with no doubles and count your leftover pips as penalties.',
    ],
    [
      '101点で脱落。最後の1人がプールのチップを受け取ります。全員が残っている間はチップを使って罰点を買い戻せます。',
      'Reach 101 and you are eliminated. Last player left wins the pot. Buy back penalties with chips while all four players remain.',
    ],
  ],
  'austrian-block': [
    ['オーストリア式ブロック', 'Austrian Block'],
    'buki',
    'block',
    0,
    [
      'ダブルのない牌を両端につなぎ、出せなければパス。',
      'Match either end with non-doubles. Pass if blocked.',
    ],
    [
      '出し切るか、全員パスのときに残り目が最少なら勝ち。',
      'Go out or have the lowest pip total when everyone passes.',
    ],
  ],
  'austrian-draw': [
    ['オーストリア式ドロー', 'Austrian Draw'],
    'buki',
    'block',
    0,
    [
      '出せる牌がなければ、山から1枚ずつ引きます。',
      'When you cannot play, draw one tile at a time until you can.',
    ],
    [
      '出し切るか、山も尽きて全員パスのときに残り目が最少なら勝ち。',
      'Go out, or have the lowest pip total when the stock is empty and everyone passes.',
    ],
  ],
  nos: [
    ['ノス', 'Nos'],
    'nos',
    'block',
    2,
    [
      '親がその局のつなぎ方を宣言。同じ目や、合計7になる目を列に応じてつなぎます。',
      'The dealer declares how the arms connect. Depending on the arm, match the end or make seven.',
    ],
    [
      'ダブルや最初の上がりでチップを獲得。局末に残り目の差を精算します。5局で勝負します。',
      'Earn chips with doubles and the first exit. Settle leftover pips after each deal. Play five deals.',
    ],
  ],
  billitonnen: [
    ['ビリトンネン', 'Billitonnen'],
    'nos',
    'block',
    1,
    [
      '伏せた手牌を右からめくります。めくる前につなぐ側を決めます。',
      'Choose an end before revealing the rightmost tile in your concealed hand.',
    ],
    [
      'つながれば続行。失敗した牌は左に戻して手番を交代します。',
      'Keep playing on a match. On a miss, move the tile to the left and pass the turn.',
    ],
  ],
  bluffing: [
    ['ブラフィング', 'Bluffing'],
    'clarke',
    'block',
    2,
    [
      '牌を伏せ、つながる目を宣言します。宣言は実際の目と違っていてもかまいません。',
      'Play a tile face down and claim a matching face. You may bluff.',
    ],
    [
      '見破られたら出した人が、宣言が本当なら疑った人が場の牌を全部引き取ります。',
      'A caught bluffer takes the layout. If the claim was true, the challenger takes it.',
    ],
  ],
  'double-edged': [
    ['ダブル・エッジ', 'Double Edged'],
    'clarke',
    'block',
    1,
    [
      '左右の端に1枚ずつ、またはダブルを片側に1枚出します。',
      'Play one tile on each end or play a single double on either end.',
    ],
    [
      '出せないときは山から2枚。詰まったら枚数の少なさ、次に残り目を比べます。',
      'Draw up to two if stuck. On a block, fewest tiles wins, then fewest pips.',
    ],
  ],
  request: [
    ['リクエスト', 'Request'],
    'clarke',
    'block',
    1,
    [
      '出せないときは順にほかの人に頼みます。誰も出せなければ、元の手番の人は目を問わず出せます。',
      'If stuck, ask others in turn. If nobody can help, the original player may play without matching.',
    ],
  ],
  'keep-left': [
    ['キープ・レフト', 'Keep Left'],
    'clarke',
    'block',
    2,
    [
      'ダブルの先は進行方向から見て左に曲がります。牌がぶつかる側には置けません。',
      'Turn left after a double. A crowded end cannot be extended.',
    ],
  ],
  'give-or-take': [
    ['ギブ・オア・テイク', 'Give or Take'],
    'clarke',
    'block',
    1,
    [
      '出せなければ端の牌を1枚取り、手番を交代します。',
      'If you are blocked, take a tile from either end and end your turn.',
    ],
  ],
  speed: [
    ['スピード', 'Speed'],
    'clarke',
    'block',
    1,
    [
      '最も重い牌からスタート。1手番に3枚までつなげます。制限時間は20秒です。',
      'Start with the heaviest tile. Play up to three tiles in a turn of twenty seconds.',
    ],
  ],
  'dead-space': [
    ['デッド・スペース', 'Dead Space'],
    'clarke',
    'block',
    1,
    [
      '0を含む牌は出せません。置いたあと、または出せないときは山から1枚引き、交代します。',
      'Tiles containing zero cannot be played. Draw one after playing or when blocked, then end your turn.',
    ],
  ],
  'one-up': [
    ['ワン・アップ', 'One Up'],
    'clarke',
    'block',
    0,
    [
      '端より1大きな目をつなぎます。6の次は0です。',
      'Connect a pip one higher than the end. Zero follows six.',
    ],
  ],
  'pick-up': [
    ['ピック・アップ', 'Pick Up'],
    'clarke',
    'block',
    1,
    [
      'ダブルを出すと、その前に牌を出した人が同じ目を含む場の牌を引き取ります。',
      'A double forces the previous player who laid a tile to collect all other board tiles with that pip.',
    ],
  ],
  'flower-scorpion': [
    ['フラワー・アンド・スコーピオン', 'Flower & Scorpion'],
    'flowerscorpion',
    'points',
    1,
    [
      '花のサイコロと同じ目は加点、サソリと同じ目は減点。出した牌と両端の組み合わせを見ます。',
      'Flower dice score and scorpion dice deduct. Check both the played tile and the two ends.',
    ],
    [
      '両端を同じ目にそろえても得点。先に20点で勝ちます。',
      'Matching the two ends also scores. Reach 20 to win.',
    ],
  ],
  'eleven-point': [
    ['イレブンポイント・ブラックタイル', 'Eleven Point Black Tile'],
    'elevenpoint',
    'tricks',
    1,
    [
      '3枚を左隣へ渡してから開始。出されたスートを持っていれば従います。',
      'Pass three tiles left, then follow the led suit if possible.',
    ],
    [
      '0–0と3の牌は罰点。全罰点を取ると逆に相手が失点します。',
      'Avoid double zero and tiles containing three, unless you take every penalty tile.',
    ],
  ],
  'twenty-one-point': [
    ['トゥエンティーワンポイント・ブラックタイル', 'Twenty-One Point Black Tile'],
    'elevenpoint',
    'tricks',
    1,
    [
      '手牌3枚を交換し、出されたスートに従います。',
      'Exchange three tiles and follow suit if you can.',
    ],
    [
      '0–0と目の合計が5〜7の牌が罰点。罰点が少ない人が勝ちます。',
      'Double zero and tiles totaling five through seven carry penalties. Low score wins.',
    ],
  ],
  bingo: [
    ['ビンゴ', 'Bingo'],
    'bingo',
    'tricks',
    2,
    [
      '前半は自由に出して補充。山が尽きるかクローズすると、スートや切札に従います。',
      'Play freely and draw in the first phase. Follow suit and trump after closing or exhausting the stock.',
    ],
    [
      'ダブルを宣言して加点し、70点を取ったら勝利を宣言。先に7ゲーム点で勝ちです。',
      'Declare doubles for points and claim the deal at 70. Reach seven game points.',
    ],
  ],
  sidominos: [
    ['シドミノ', 'Sidominos'],
    'sidominos',
    'layout',
    2,
    [
      '縦横の並びが、異なる目か、同じ並びの繰り返しになるよう配置します。',
      'Extend rows and columns of distinct pips or repeating patterns.',
    ],
    [
      '伸ばした列の長さを掛け合わせて得点。ダブルなら2倍です。',
      'Multiply the lengths of the lines you extend. Doubles score twice.',
    ],
  ],
  broadway: [
    ['ブロードウェイ', 'Broadway'],
    'broadway',
    'layout',
    1,
    [
      '向かいが味方。席ごとに決められた方向で置き、隣にある同じ目を数えます。',
      'Play in teams across the table. Place in your seat’s direction and count matching neighbors.',
    ],
    [
      '一致が2・3・4組以上で1・5・10点。残った牌は1枚1点の失点です。',
      'Two, three or at least four contacts score one, five or ten. Each leftover tile costs one.',
    ],
  ],
  skyscraper: [
    ['摩天楼', 'Skyscraper'],
    'skyscraper',
    'layout',
    1,
    [
      '4×4の土台を埋めたら、高さがそろい目が合う場所に積みます。0はどの目にも合います。',
      'Fill the 4×4 base, then stack on same-height matching pips. Zero is wild.',
    ],
    [
      '置けないと脱落。最後まで残った人が勝ちです。',
      'No legal placement means elimination. Last player standing wins.',
    ],
  ],
  shanghai: [
    ['上海', 'Shanghai'],
    'shanghai',
    'sets',
    1,
    [
      'サイコロ2個の目を連結する鎖を手牌で作ります。0はどの目にもつながります。',
      'Build a chain between two dice values. Zero matches any pip.',
    ],
    [
      '成功すると同じ手番でもう一度振れます。出した枚数から残り枚数を引いて得点。',
      'Roll again after a successful chain. Score tiles played minus tiles held.',
    ],
  ],
  rummicube: [
    ['ラミーキューブ・ドミノ', 'Rummikub Dominoes'],
    'rummidomino',
    'sets',
    2,
    [
      '共通の目か同じ合計の牌で、3枚以上の組を作ります。0–0と6–6はワイルド。',
      'Build groups of three or more with a shared pip or equal total. Double zero and double six are wild.',
    ],
    [
      '初回は自分の3枚で出し、その後は場の組を組み替えて手牌を足せます。',
      'Open with exactly three of your own tiles, then rearrange public groups to add more.',
    ],
  ],
} satisfies Record<ExtraDominoGame, Listing>;

const classic: Record<Exclude<DominoGame, ExtraDominoGame>, [DominoCategory, 0 | 1 | 2]> = {
  competitive: ['block', 0],
  cyprus: ['block', 0],
  chicken: ['block', 0],
  mexican: ['block', 1],
  'five-up': ['points', 1],
  sniff: ['points', 1],
  'seven-rocks': ['points', 1],
  bergen: ['points', 0],
  'fives-threes': ['points', 1],
  'forty-two': ['tricks', 2],
};
export function dominoListing(game: DominoGame) {
  const entry = EXTRA_DOMINO_CATALOG[game as ExtraDominoGame];
  const [category, level] = entry ? [entry[2], entry[3]] : classic[game as keyof typeof classic];
  return { category, level };
}
