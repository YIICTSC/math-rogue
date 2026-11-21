import type { LanguageMode } from '../../types';
import { DOMINO_GAMES, EXTRA_DOMINO_GAMES, type TableGame } from './model';
import { EXTRA_DOMINO_CATALOG } from './dominoCatalog';

export type Copy = [ja: string, en: string, kana?: string];
export const say = (language: LanguageMode, [ja, en, kana]: Copy) =>
  language === 'ENGLISH' ? en : language === 'HIRAGANA' ? (kana ?? ja) : ja;

interface Entry {
  title: Copy;
  tagline: Copy;
  instructions: Copy[];
  source: string;
}
const dominoSource = (id: string) => `https://gamefarm.jp/rule/${id}.html`;
const extraDominoEntries = Object.fromEntries(
  EXTRA_DOMINO_GAMES.map((id): [typeof id, Entry] => {
    const [title, page, , , ...instructions]: [Copy, string, string, number, ...Copy[]] =
      EXTRA_DOMINO_CATALOG[id];
    if (page === 'clarke') {
      instructions.push([
        '5局を行い、勝った局数が最も多い人が勝ちます。',
        'Play five deals. Win the most deals to win the match.',
        '5きょくを おこない、かった きょくすうが もっとも おおい ひとが かちです。',
      ]);
    } else if (id === 'buki') {
      instructions.push([
        '2・4・6チップから選び、5局の獲得チップで競います。',
        'Choose a stake of two, four or six chips. Compare chip winnings after five deals.',
        '2・4・6チップから えらび、5きょくの かくとくチップで きそいます。',
      ]);
    }
    return [
      id,
      {
        title,
        tagline: instructions[0],
        instructions,
        source: dominoSource(page),
      },
    ];
  }),
) as Record<(typeof EXTRA_DOMINO_GAMES)[number], Entry>;
export const TABLE_GAMES: Record<TableGame, Entry> = {
  ...extraDominoEntries,
  competitive: {
    title: ['コンペティティブ・ドミノ', 'Competitive Dominoes'],
    tagline: [
      'ペアで場を読み、手を使い切る',
      'Read the ends and go out for your team',
      'ペアでばをよみ、てをつかいきる',
    ],
    instructions: [
      [
        '4人のペア戦。向かいの人が味方で、全員7枚を取ります。',
        'Four seats in teams of two. Your partner sits opposite you. Deal seven tiles each.',
        '4にんのペアせん。むかいのひとがみかたで、ぜんいん7まいをとります。',
      ],
      [
        '端と同じ目をつなぎ、出せなければパス。山札はありません。',
        'Match either end. Pass only when you cannot play. There is no draw pile.',
        'はじとおなじめをつなぎ、だせなければパス。やまふだはありません。',
      ],
      [
        '上がった組は残った全員の目を得点。全員パスなら、残り目が少ない組が得点。先に200点で勝ちです。',
        'The first team to go out scores all remaining pips. If blocked, the team with fewer pips scores. Reach 200 to win.',
        'あがったくみはのこったぜんいんのめをとくてん。ぜんいんパスなら、のこりめがすくないくみがとくてん。さきに200てんでかちです。',
      ],
    ],
    source: dominoSource('compdomino'),
  },
  cyprus: {
    title: ['キプロス', 'Cyprus'],
    tagline: [
      '中心から八方向へ道をのばす',
      'Build all eight arms from the center',
      'ちゅうしんからはっぽうこうへみちをのばす',
    ],
    instructions: [
      [
        '0〜9の牌を使用。手の中にある最大のダブルを中心に置き、八方向すべての根元を埋めます。',
        'Use a double-nine set. Open with the highest double held, then fill the roots of all eight arms.',
        '0〜9のぱいをしよう。てのなかにあるさいだいのダブルをちゅうしんにおき、はっぽうこうすべてのねもとをうめます。',
      ],
      [
        '根元がそろうと列端を伸ばせます。置けないときは1枚引き、まだ置けなければパス。',
        'Once the roots are filled, extend any matching arm. If blocked, draw one tile and play it if possible.',
        'ねもとがそろうとれつはじをのばせます。おけないときは1まいひき、まだおけなければパス。',
      ],
      [
        '上がれば他の人の残り目を得点。全員パスなら残り目が最小の人が得点。60点で勝負が決まります。',
        'Going out earns the others’ remaining pips. On a block the lowest hand earns the others’ pips minus their own. Play to 60.',
        'あがればほかのひとののこりめをとくてん。ぜんいんパスならのこりめがさいしょうのひとがとくてん。60てんでしょうぶがきまります。',
      ],
    ],
    source: dominoSource('cyprus'),
  },
  chicken: {
    title: ['チキンフット', 'Chicken Foot'],
    tagline: [
      'ダブルに三本の足をつなぐ',
      'Give every new double three toes',
      'ダブルにさんぼんのあしをつなぐ',
    ],
    instructions: [
      [
        '9のダブルから0のダブルまで全10局。各局の中心ダブルに最初は4本つなぎます。',
        'Play ten rounds from double nine to double zero. Fill the first four branches of the center double.',
        '9のダブルから0のダブルまでぜん10きょく。かっきょくのちゅうしんダブルにさいしょは4ほんつなぎます。',
      ],
      [
        '新しいダブルが出たら、そのダブルに3枚つなぐまで他の列は伸ばせません。',
        'After another double is placed, play on its three branches before playing anywhere else.',
        'あたらしいダブルがでたら、そのダブルに3まいつなぐまでほかのれつはのばせません。',
      ],
      [
        '出せなければ1枚引く。手の残り目は罰点、0–0だけは50点。全局を終えて最も少ない人が勝ち。',
        'Draw once when blocked. Remaining pips are penalties and 0–0 costs 50. Lowest total after ten rounds wins.',
        'だせなければ1まいひく。てののこりめはばってん、0–0だけは50てん。ぜんきょくをおえてもっともすくないひとがかち。',
      ],
    ],
    source: dominoSource('chickenfoot'),
  },
  mexican: {
    title: ['メキシカントレイン', 'Mexican Train'],
    tagline: [
      '自分の列車と開放列を伸ばす',
      'Extend your train and watch the public track',
      'じぶんのれっしゃとかいほうれつをのばす',
    ],
    instructions: [
      [
        '12のダブルから0のダブルまで全13局。最初の手番だけは自分の列に置けるだけ置きます。',
        'Play thirteen rounds from double twelve to double zero. Build as much of your own train as possible on your first turn.',
        '12のダブルから0のダブルまでぜん13きょく。さいしょのてばんだけはじぶんのれつにおけるだけおきます。',
      ],
      [
        '以降は自分の列、共有列、開放列へ。引いても置けずパスした人の列は開放されます。自分でつなぐと閉じます。',
        'Later, place on your own train, the shared train, or an open train. Passing opens your train. Playing on it closes it again.',
        'いこうはじぶんのれつ、きょうゆうれつ、かいほうれつへ。ひいてもおけずパスしたひとのれつはかいほうされます。じぶんでつなぐととじます。',
      ],
      [
        'ダブルを置いたら追加で一手。次の手番から未処理ダブルの列が優先です。13局の罰点が最少なら勝利。',
        'A double earns one extra play. Uncovered doubles take priority on subsequent turns. Lowest remaining-pip total across thirteen rounds wins.',
        'ダブルをおいたらついかでいって。つぎのてばんからみしょりダブルのれつがゆうせんです。13きょくのばってんがさいしょうならしょうり。',
      ],
    ],
    source: dominoSource('mexicantrain'),
  },
  'five-up': {
    title: ['ファイブアップ（カンテット）', 'Five Up'],
    tagline: [
      '列端の合計を5の倍数にする',
      'Build exposed totals that divide by five',
      'れつはじのごうけいを5のばいすうにする',
    ],
    instructions: [
      [
        '端と同じ目をつなぎます。両側が埋まったダブルはさらに2方向に枝分かれします。',
        'Match an end. A double with both sides connected can branch in two extra directions.',
        'はじとおなじめをつなぎます。りょうがわがうまったダブルはさらに2ほうこうにえだわかれします。',
      ],
      [
        '端の目を足し、5の倍数なら合計÷5を得点。端にある未接続ダブルは両面を数えます。',
        'Add the exposed pips and divide by five when the total is a multiple of five. Count both halves of a double at an end.',
        'はじのめをたし、5のばいすうならごうけい÷5をとくてん。はじにあるみせつぞくダブルはりょうめんをかぞえます。',
      ],
      [
        '局の終わりにも残り目から得点し、61点を超えた局で勝負が決まります。',
        'Remaining tiles also score at round end. The match ends after someone goes above 61.',
        'きょくのおわりにものこりめからとくてんし、61てんをこえたきょくでしょうぶがきまります。',
      ],
    ],
    source: dominoSource('fiveup'),
  },
  sniff: {
    title: ['スニッフ', 'Sniff'],
    tagline: [
      '最初のダブルの脇でも得点を狙う',
      'Make the first double count',
      'さいしょのダブルのわきでもとくてんをねらう',
    ],
    instructions: [
      [
        '最初のダブルだけが枝分かれします。両側をつないだ後、未使用の脇も端の目に含めます。',
        'Only the first double branches. Once both sides are filled, count its unused side arms in the exposed total.',
        'さいしょのダブルだけがえだわかれします。りょうがわをつないだのち、みしようのわきもはじのめにふくめます。',
      ],
      [
        '端の目の合計が5の倍数なら、その合計を得点。置けなければ、1手番で2枚まで引けます。',
        'Score the full exposed total if divisible by five. When blocked, draw up to two tiles per turn.',
        'はじのめのごうけいが5のばいすうなら、そのごうけいをとくてん。おけなければ、1てばんで2まいまでひけます。',
      ],
      [
        '上がりやブロックでは相手の残り目を5点単位に丸めます。250点で勝負が決まります。',
        'Going out or winning a block scores opponents’ remaining pips rounded to the nearest five. Play to 250.',
        'あがりやブロックではあいてののこりめを5てんたんいにまるめます。250てんでしょうぶがきまります。',
      ],
    ],
    source: dominoSource('sniff'),
  },
  'seven-rocks': {
    title: ['セブン・ロックス', 'Seven Rocks'],
    tagline: [
      '全員7枚。一本の分岐を奪い合う',
      'Seven tiles each and just one spinner',
      'ぜんいん7まい。いっぽんのぶんきをうばいあう',
    ],
    instructions: [
      [
        '人数を問わず7枚ずつ。最初のダブルだけが両側をつないだ後に枝分かれします。',
        'Deal seven tiles each. Only the first double can branch, once both main sides are connected.',
        'にんずうをとわず7まいずつ。さいしょのダブルだけがりょうがわをつないだのちにえだわかれします。',
      ],
      [
        '新しい端の合計が5の倍数なら、その合計を得点。置けなければ山の最後まで引けます。',
        'Score the full exposed total whenever it is divisible by five. Draw until playable or the stock is empty.',
        'あたらしいはじのごうけいが5のばいすうなら、そのごうけいをとくてん。おけなければやまのさいごまでひけます。',
      ],
      [
        '局末の残り目は5点単位で精算。250点で勝負が決まります。',
        'Round leftover scoring to the nearest five. Play to 250.',
        'きょくまつののこりめは5てんたんいでせいさん。250てんでしょうぶがきまります。',
      ],
    ],
    source: dominoSource('sevenrocks'),
  },
  bergen: {
    title: ['バーゲン', 'Bergen'],
    tagline: [
      '並びの両端に同じ目を作る',
      'Make both ends show the same number',
      'ならびのりょうたんにおなじめをつくる',
    ],
    instructions: [
      [
        '最大のダブルで開始すると2点。枝分かれを作らず左右に牌を足します。',
        'The highest double opens for two points. Extend either end without branching.',
        'さいだいのダブルでかいしすると2てん。えだわかれをつくらずさゆうにぱいをたします。',
      ],
      [
        '両端が同じ目になれば2点。片方の端がダブルなら3点です。置けないときは山に2枚残るまで引けます。',
        'Equal ends score two, or three when a double is on an end. Draw if blocked, leaving two tiles in stock.',
        'りょうたんがおなじめになれば2てん。かたほうのはじがダブルなら3てんです。おけないときはやまに2まいのこるまでひけます。',
      ],
      [
        '上がりは2点。全員パスではダブルが少ない人が優先です。2人は15点、3・4人は10点が目標。',
        'Going out gives two points. When blocked, the fewest doubles wins the hand, then the fewest pips. Play to 15 with two seats or 10 with more.',
        'あがりは2てん。ぜんいんパスではダブルがすくないひとがゆうせんです。2にんは15てん、3・4にんは10てんがもくひょう。',
      ],
    ],
    source: dominoSource('bergen'),
  },
  'fives-threes': {
    title: ['ファイブ・アンド・スリー', 'Fives and Threes'],
    tagline: [
      '3と5の倍数で61点ぴったりを狙う',
      'Reach exactly 61 with multiples of three and five',
      '3と5のばいすうで61てんぴったりをねらう',
    ],
    instructions: [
      [
        '端の目を足し、5で割り切れたら÷5、3で割り切れたら÷3を得点。両方なら足します。',
        'Score total ÷ 5 when divisible by five, plus total ÷ 3 when divisible by three.',
        'はじのめをたし、5でわりきれたら÷5、3でわりきれたら÷3をとくてん。りょうほうならたします。',
      ],
      [
        '山札は使わず、置けなければパス。最後の牌には上がりの1点も足します。',
        'Pass when blocked. There is no drawing. Include a one-point bonus for playing your last tile.',
        'やまふだはつかわず、おけなければパス。さいごのぱいにはあがりの1てんもたします。',
      ],
      [
        '累計61点ちょうどで勝利。それを超える一手の得点は入りません。',
        'Win at exactly 61. Any move that would go above 61 scores zero.',
        'るいけい61てんちょうどでしょうり。それをこえるいってのとくてんはいりません。',
      ],
    ],
    source: dominoSource('fivesandthrees'),
  },
  'forty-two': {
    title: ['42（フォーティーツー）', 'Forty-Two'],
    tagline: [
      'ビッドと切り札でペアの42点を競う',
      'Bid, name trumps, and take tricks with a partner',
      'ビッドときりふだでペアの42てんをきそう',
    ],
    instructions: [
      [
        '4人のペア戦。30点からビッドして、最高額の人が切り札の目を指定します。全員パスになりそうなら親が宣言。',
        'Four seats in two teams. Bid from 30 points and let the highest bidder name the trump number. Dealer must bid after three passes.',
        '4にんのペアせん。30てんからビッドして、さいこうがくのひとがきりふだのめをしていします。ぜんいんパスになりそうならおやがせんげん。',
      ],
      [
        '最初の牌の大きい目が指定された目。切り札を含む牌は切り札に属します。同じ目があれば出し、強い牌が1トリックを取ります。',
        'Follow the higher pip of the lead tile if possible. Trump tiles belong only to trump. Highest trump or highest tile of the led suit wins. Doubles rank highest in their suit.',
        'さいしょのぱいのおおきいめがしていされため。きりふだをふくむぱいはきりふだにぞくします。おなじめがあればだし、つよいぱいが1トリックをとります。',
      ],
      [
        '1トリックは1点。合計5・10の牌にはその点が付きます。契約を達成した組、または阻止した組がマークを獲得。7マークで勝利。',
        'Each trick is one point and tiles totaling five or ten score that many pips. Make or set the bid to earn marks. First to seven marks wins.',
        '1トリックは1てん。ごうけい5・10のぱいにはそのてんがつきます。けいやくをたっせいしたくみ、またはそししたくみがマークをかくとく。7マークでしょうり。',
      ],
    ],
    source: dominoSource('42'),
  },
  peeper: {
    title: ['ピーパー', 'Peeper'],
    tagline: [
      '韓国の牌で役を重ね、ボムで流れを変える',
      'Climb with Korean tiles and change the lead with bombs',
      'かんこくのぱいでやくをおもね、ボムでながれをかえる',
    ],
    instructions: [
      [
        '1〜15とXで、1枚、ペア、3連以上の階段、3組以上のペア階段を作れます。Xは穴埋めにも最強の16にもなります。',
        'Use ranks 1–15 and X to play singles, pairs, runs of three or more, and runs of three or more pairs. X can fill gaps or act as rank 16.',
        '1〜15とXで、1まい、ペア、3れんいじょうのかいだん、3くみいじょうのペアかいだんをつくれます。Xはあなうめにもさいきょうの16にもなります。',
      ],
      [
        '前と同じ役・枚数で数字を上げます。同じ牌3枚のボム、4枚の強いボムは普通の役を破れます。Xと数字はボムで混ぜられません。',
        'Beat the latest play with the same pattern and length at a higher rank. Three or four identical tiles form bombs. X cannot combine with other ranks in a bomb.',
        'まえとおなじやく・まいすうですうじをあげます。おなじぱい3まいのボム、4まいのつよいボムはふつうのやくをやぶれます。Xとすうじはボムでまぜられません。',
      ],
      [
        '1枚出しに同じ目2枚でマイン。さらに同じ目1枚でリターン。どちらも手番外で宣言できます。最後まで出した人が残り牌の点を受け取り、3局で集計します。',
        'Interrupt a single with a matching pair to call Mine. Interrupt a Mine with the last matching tile to call Return. First out collects the other hands’ penalties. Compare totals after three rounds.',
        '1まいだしにおなじめ2まいでマイン。さらにおなじめ1まいでリターン。どちらもてばんそとでせんげんできます。さいごまでだしたひとがのこりぱいのてんをうけとり、3きょくでしゅうけいします。',
      ],
    ],
    source: 'https://sekaiyugi.com/2020/10/18/peeper/',
  },
  crokinole: {
    title: ['クロキノール', 'Crokinole'],
    tagline: [
      'カナダの木盤でディスクを弾く',
      'Flick wooden discs across a Canadian board',
      'カナダのきのばんでディスクをはじく',
    ],
    instructions: [
      [
        '手前の区画内で発射位置を決めます。自分の円盤を後ろへ引き、指を離すと反対方向へ発射。大きく引くほど強く弾けます。',
        'Set your launch point within your quadrant. Pull your disc back and release to shoot in the opposite direction. Pull farther for more power.',
        'じぶんの えんばんを うしろへ ひき、はなすと はんたいへ はっしゃ。おおきく ひくほど つよく はじけます。',
      ],
      [
        '相手の円盤がある時は接触が必要。相手がいなければ、動かした自分側の円盤を15点線まで届けます。条件を満たさない一手は反則です。',
        'If opposing discs are in play, touch one, directly or through a friendly disc. With no opponents in play, bring an involved disc to the 15 ring.',
        'あいてのえんばんがあるときはせっしょくがひつよう。あいてがいなければ、うごかしたじぶんがわのえんばんを15てんせんまでとどけます。じょうけんをみたさないいってははんそくです。',
      ],
      [
        '中央穴は20点、内側から15・10・5点。境界線に触れると低い側の点です。1局の勝者に2点、引き分けは各1点。4局で競います。',
        'The center hole is 20. Rings score 15, 10, and 5, using the lower value on a line. A round win pays two match points. A tie gives one each. Play four rounds and break any tie.',
        'ちゅうおうあなは20てん、うちがわから15・10・5てん。きょうかいせんにふれるとひくいがわのてんです。1きょくのしょうしゃに2てん、ひきわけはかく1てん。4きょくできそいます。',
      ],
    ],
    source: 'https://worldcrokinole.com/thegame.html',
  },
  goita: {
    title: ['ごいた', 'Goita', 'ごいた'],
    tagline: [
      '能登の竹駒で息を合わせる4人ペア戦',
      'Work as a pair in the bamboo tile game of Noto',
      'のとのたけこまでいきをあわせる4にんペアせん',
    ],
    instructions: [
      [
        '向かいの人が味方。最初は受けを1枚伏せ、攻めを1枚表にします。次の人は同じ駒で受けて攻めるか、パスできます。',
        'Your partner is opposite you. Lead with a hidden cover and a face-up attack. Respond to an attack with its matching piece, then attack or pass.',
        'むかいのひとがみかた。さいしょはうけを1まいふせ、せめを1まいおもてにします。つぎのひとはおなじこまでうけてせめるか、パスできます。',
      ],
      [
        '全員がパスすると攻めた人が受けを伏せて続けます。王は「し」と「香」を受けられません。最後の攻め、王が場に見えた時、王を2枚持つ時に王で攻められます。',
        'If all others pass, the attacker leads again with a hidden cover. King cannot cover a pawn or lance. You can attack with King on your last pair, if a King is visible, or if you hold both.',
        'ぜんいんがパスするとせめたにんがうけをふせてつづけます。おうは「し」と「きょう」をうけられません。さいごのせめ、おうがばにみえたとき、おうを2まいもつときにおうでせめられます。',
      ],
      [
        '駒を出し切ると最後の攻めの点が入ります。最後が同じ駒の伏せ受けと攻めなら2倍。五しは味方が続行か配り直しを選び、六し以上は配牌で得点。150点が目標。',
        'Going out scores your final attacker. Double it if paired with a matching hidden cover. Five pawns lets your partner choose play or redeal. Six or more score at the deal. First to 150 wins.',
        'こまをだしきるとさいごのせめのてんがはいります。さいごがおなじこまのふせうけとせめなら2ばい。ごしはみかたがぞっこうかくばりなおしをえらび、ろくしいじょうははいぱいでとくてん。150てんがもくひょう。',
      ],
    ],
    source: 'https://goita.jp/rule/',
  },
};

export const WORLD_GAME_IDS = [...DOMINO_GAMES, 'peeper', 'crokinole', 'goita'] as const;
export type TableFamily = 'domino' | 'peeper' | 'crokinole' | 'goita';
export const familyFor = (game: TableGame): TableFamily =>
  game === 'peeper' || game === 'crokinole' || game === 'goita' ? game : 'domino';
