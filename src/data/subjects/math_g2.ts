
import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

const MATH_G2_1: GeneralProblem[] = [
        { question: "「25 ＋ 38」のひっ算。一のくらいの 計算は？", answer: "5 ＋ 8 ＝ 13", options: d("5 ＋ 8 ＝ 13", "2 ＋ 3 ＝ 5", "5 － 8", "1 ＋ 2 ＋ 3"), hint: "まずは 右のはし（一のくらい）から 計算するよ。" },
        { question: "長さの たんい。10mm（ミリメートル）は 何cm？", answer: "1cm", options: d("1cm", "10cm", "100cm", "0.1cm"), hint: "ものさしの 小さい 1めもりが 1mmだよ。" },
        { question: "1メートル(m)は 何センチメートル(cm)？", answer: "100cm", options: d("100cm", "10cm", "1000cm", "1cm"), hint: "大きな ものさし 1本分くらいだね。" },
        { question: "「82 － 45」のひっ算。十のくらいから 1かりると 一のくらいは いくつになる？", answer: "12", options: d("12", "10", "2", "8"), hint: "10 ＋ 2 だね。ひき算の ときに つかうよ。" },
        { question: "三角形には、かど（角）が いくつある？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "まわりの 線の 数と おなじだよ。" },
        { question: "四角形には、辺（へん）が いくつある？", answer: "4本", options: d("4本", "3本", "5本", "1本"), hint: "まわりを かこんでいる まっすぐな 線の 数だよ。" },
        { question: "「5 ＋ 5 ＋ 5 ＋ 5」を かけ算の 式にすると？", answer: "5 × 4", options: d("5 × 4", "4 × 5", "5 ＋ 4", "5 × 5"), hint: "「5」が「4つ」あるね。" },
        { question: "とけいの もんだい。1時間は 何分？", answer: "60分", options: d("60分", "100分", "24分", "10分"), hint: "長い はりが 1しゅう する じかんだよ。" },
        { question: "午前10時の 2時間後は 何時？", answer: "午後12時（正午）", options: d("午後12時", "午前12時", "午後2時", "午前8時"), hint: "10 ＋ 2 ＝ 12。お昼ごはんに なるよ。" },
        { question: "15cmの ものさし。3cm みじかくすると 何cm？", answer: "12cm", options: d("12cm", "18cm", "15cm", "10cm"), hint: "ひき算を しよう。" },
        { question: "「300 ＋ 400 ＝ 」 答えは？", answer: "700", options: d("700", "304", "100", "340"), hint: "100の かたまりが 3＋4 こ。" },
        { question: "水のかさ。1リットル(L)は 何デシリットル(dL)？", answer: "10dL", options: d("10dL", "100dL", "1dL", "1000dL"), hint: "L（リットル）の 下の たんいだよ。" },
        { question: "1dL は 何ミリリットル(mL)？", answer: "100mL", options: d("100mL", "10mL", "1000mL", "1mL"), hint: "ヤクルト1本分くらい。" },
        { question: "まっすぐな 線だけで かこまれた 形を 何という？", answer: "図形（ずけい）", options: d("図形", "きょくせん", "まる", "点"), hint: "三角形や 四角形のことだよ。" },
        { question: "「0 × 8 ＝ 」 答えは？", answer: "0", options: d("0", "8", "80", "1"), hint: "なにもないのを かけても 答えは...？" },
        { question: "5のだんの 九九。 5 × 7 ＝ ？", answer: "35", options: d("35", "30", "40", "25"), hint: "ごしち...？" },
        { question: "「34 ＋ 52 ＝ 」 答えは？", answer: "86", options: d("86", "84", "76", "96"), hint: "ひっ算で かんがえてみよう。" },
        { question: "「67 － 24 ＝ 」 答えは？", answer: "43", options: d("43", "41", "33", "53"), hint: "一のくらいから ひこう。" },
        { question: "「48 ＋ 16 ＝ 」 くりあがりは ある？", answer: "ある", options: d("ある", "ない", "わからない", "半分だけ"), hint: "8 ＋ 6 は 10より 大きいかな？" },
        { question: "「50 － 18 ＝ 」 答えは？", answer: "32", options: d("32", "42", "38", "48"), hint: "十のくらいから 1かりてくるよ。" },
    ];

const MATH_G2_2: GeneralProblem[] = [
        { question: "九九。 3 × 6 ＝ ？", answer: "18", options: d("18", "15", "21", "12"), hint: "さぶろく...？" },
        { question: "九九。 4 × 8 ＝ ？", answer: "32", options: d("32", "36", "28", "40"), hint: "しは...？" },
        { question: "九九。 6 × 7 ＝ ？", answer: "42", options: d("42", "36", "48", "49"), hint: "ろくしち...？" },
        { question: "九九。 7 × 9 ＝ ？", answer: "63", options: d("63", "56", "70", "49"), hint: "しちく...？" },
        { question: "九九。 8 × 6 ＝ ？", answer: "48", options: d("48", "42", "54", "64"), hint: "はちろく...？" },
        { question: "九九。 9 × 4 ＝ ？", answer: "36", options: d("36", "32", "45", "40"), hint: "くし...？" },
        { question: "1000 より 1 小さい 数は？", answer: "999", options: d("999", "1001", "900", "990"), hint: "千（せん）の 前の 数。" },
        { question: "100 を 10 こ あつめると？", answer: "1000", options: d("1000", "100", "10000", "200"), hint: "「千（せん）」という たんいに なるよ。" },
        { question: "ながさの 計算。 5cm4mm ＋ 2cm3mm ＝ ？", answer: "7cm7mm", options: d("7cm7mm", "7cm", "7mm", "8cm"), hint: "おなじ たんい どうしで たそう。" },
        { question: "「3時50分」の 10分後は 何時？", answer: "4時", options: d("4時", "3時60分", "3時40分", "5時"), hint: "60分で 1時間 ふえるよ。" },
        { question: "正方形（せいほうけい）の 4つの かどは すべて何？", answer: "直角（ちょっかく）", options: d("直角", "まるい", "とがっている", "ちがう"), hint: "ノートの かどと おなじ かたち。" },
        { question: "正方形の 4つの 辺（へん）の ながさは？", answer: "すべて おなじ", options: d("すべて おなじ", "ぜんぶ バラバラ", "むかいあう 辺だけ おなじ", "わからない"), hint: "ましかくな かたちだよ。" },
        { question: "「800 － 200 ＝ 」 答えは？", answer: "600", options: d("600", "820", "1000", "400"), hint: "8 － 2 は？" },
        { question: "1dLの いれもので 1Lの 水を くむには 何回 ひつよう？", answer: "10回", options: d("10回", "100回", "1回", "5回"), hint: "1L ＝ 10dL だよ。" },
        { question: "九九で、答えが「24」に なるのは？", answer: "3×8, 4×6, 6×4, 8×3", options: d("3×8など", "5×5", "7×3", "2×10"), hint: "たくさん あるよ。さがしてみて。" },
        { question: "「120 ＋ 50 ＝ 」 答えは？", answer: "170", options: d("170", "125", "105", "200"), hint: "10の かたまりで かんがえよう。" },
        { question: "「180 － 90 ＝ 」 答えは？", answer: "90", options: d("90", "100", "80", "189"), hint: "18 － 9 は？" },
        { question: "1000は 10が なにこ？", answer: "100こ", options: d("100こ", "10こ", "1000こ", "1こ"), hint: "とっても たくさん！" },
        { question: "「705」の 読み方は？", answer: "ななひゃくご", options: d("ななひゃくご", "ななじゅうご", "ななひゃくじゅうご", "ななご"), hint: "十のくらいは 「れい」だね。" },
        { question: "九九。 2 × 7 ＝ ？", answer: "14", options: d("14", "16", "12", "18"), hint: "にし...？" },
    ];

const MATH_G2_3: GeneralProblem[] = [
        { question: "「1000 － 400 ＝ 」 答えは？", answer: "600", options: d("600", "1400", "400", "0"), hint: "100が 10こ から 4こ ひく。" },
        { question: "5000 と 300 と 20 と 7 で？", answer: "5327", options: d("5327", "5000327", "532", "50327"), hint: "くらいの じゅんばんに ならべよう。" },
        { question: "「150 ＋ 70 ＝ 」 答えは？", answer: "220", options: d("220", "210", "120", "1570"), hint: "15 ＋ 7 は？" },
        { question: "「210 － 50 ＝ 」 答えは？", answer: "160", options: d("160", "150", "260", "110"), hint: "ひき算だよ。" },
        { question: "午前と 午後を あわせると、1日は 何時間？", answer: "24時間", options: d("24時間", "12時間", "60時間", "10時間"), hint: "1日の ながさだよ。" },
        { question: "1L 5dL を すべて dL で いうと？", answer: "15dL", options: d("15dL", "6dL", "105dL", "1.5dL"), hint: "1L ＝ 10dL を つかおう。" },
        { question: "「2000 ＋ 8000 ＝ 」 答えは？", answer: "10000", options: d("10000", "1000", "8200", "100000"), hint: "一万（いちまん）に なるよ。" },
        { question: "九九の ひょうで、答えが 「81」 なのは？", answer: "9 × 9", options: d("9 × 9", "8 × 1", "7 × 7", "9 × 8"), hint: "九九の さいごの ほうだね。" },
        { question: "長方形（ちょうほうけい）の むかいあう 辺の ながさは？", answer: "おなじ", options: d("おなじ", "ちがう", "3ばい", "半分"), hint: "上の 辺と 下の 辺を くらべてみて。" },
        { question: "10cmの テープが 9本 あります。ぜんぶで 何cm？", answer: "90cm", options: d("90cm", "19cm", "109cm", "1m"), hint: "10 × 9 ＝ ?" },
        { question: "3時から 5時までは 何時間？", answer: "2時間", options: d("2時間", "2時", "5時間", "3時間"), hint: "5 － 3 ＝ ?" },
        { question: "「3200」は、100を 何こ あつめた 数？", answer: "32こ", options: d("32こ", "3こ", "2こ", "320こ"), hint: "100が 10こで 1000だね。" },
        { question: "一万（いちまん）より 1 小さい 数は？", answer: "9999", options: d("9999", "10001", "9000", "9990"), hint: "ぜんぶ 9 に なるよ。" },
        { question: "「8500」は、8000 と なに？", answer: "500", options: d("500", "50", "5", "85"), hint: "あわせると 8500に なる 数。" },
        { question: "「1/2」 の 読み方は？", answer: "にぶんのいち", options: d("にぶんのいち", "いちぶんのに", "半分", "にのいち"), hint: "「2つに 分けた 1つ」だよ。" },
        { question: "「1/4」 は 1を 何等分（なんとうぶん）した もの？", answer: "4等分", options: d("4等分", "1等分", "2等分", "40等分"), hint: "下の 数を みてね。" },
        { question: "「1/2」 と 「1/4」、大きいのは どっち？", answer: "1/2", options: d("1/2", "1/4", "おなじ", "わからない"), hint: "半分に わけるのと、4つに わけるの、どっちが 1きれ 大きい？" },
        { question: "直角三角形（ちょっかくさんかくけい）には、直角が いくつある？", answer: "1つ", options: d("1つ", "2つ", "3つ", "ない"), hint: "「直角」が あるから その なまえだよ。" },
        { question: "長方形（ちょうほうけい）には、直角が いくつある？", answer: "4つ", options: d("4つ", "2つ", "0つ", "3つ"), hint: "ぜんぶの かどが 直角だよ。" },
        { question: "10円玉が 100こ あると、ぜんぶで いくら？", answer: "1000円", options: d("1000円", "100円", "10000円", "10円"), hint: "10 × 100 ＝ ?" },
    ];

const splitIntoUnits = (problems: GeneralProblem[], unitCount: number): GeneralProblem[][] => {
    const chunkSize = Math.ceil(problems.length / unitCount);
    return Array.from({ length: unitCount }, (_, i) => problems.slice(i * chunkSize, (i + 1) * chunkSize));
};

const g2Term1Units = splitIntoUnits(MATH_G2_1, 4);
const g2Term2Units = splitIntoUnits(MATH_G2_2, 4);
const g2Term3Units = splitIntoUnits(MATH_G2_3, 4);

export const MATH_G2_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G2_U01: [
        { question: "ひょうで、ねこ 8、いぬ 5。おおいのは？", answer: "ねこ", options: d("ねこ", "いぬ", "おなじ", "うさぎ"), hint: "8と5をくらべよう。", visual: { kind: 'bar_chart', values: [8, 5], labels: ["ねこ", "いぬ"] } },
        { question: "ひょうで、あか 6、あお 6。くらべると？", answer: "おなじ", options: d("おなじ", "あか", "あお", "きいろ"), hint: "6と6はおなじ。" },
        { question: "ぼうグラフで、りんご 7こ、みかん 3こ。ちがいは？", answer: "4こ", options: d("4こ", "7こ", "3こ", "10こ"), hint: "7と3のちがい。" },
        { question: "ぼうグラフで、くるま 4だい、ばす 9だい。おおいのは？", answer: "ばす", options: d("ばす", "くるま", "おなじ", "でんしゃ"), hint: "9のほうがおおい。" },
        { question: "ひょうで、A 2、B 5、C 8。いちばんおおいのは？", answer: "C", options: d("C", "A", "B", "おなじ"), hint: "8がいちばんおおい。" },
        { question: "ひょうで、A 2、B 5、C 8。いちばんすくないのは？", answer: "A", options: d("A", "B", "C", "おなじ"), hint: "2がいちばんすくない。" },
        { question: "ぼうがいちばんたかいところは、どんなところ？", answer: "かずがいちばんおおい", options: d("かずがいちばんおおい", "かずがいちばんすくない", "かずが0", "よめない"), hint: "ぼうのたかさはかずをあらわす。" },
        { question: "ぼうグラフで、あさがお 10、ひまわり 4。あわせて？", answer: "14", options: d("14", "10", "6", "4"), hint: "10と4をあわせる。" },
        { question: "ひょうで、えんぴつ 12、けしごむ 7。えんぴつはなんこおおい？", answer: "5こ", options: d("5こ", "7こ", "12こ", "19こ"), hint: "12と7のちがい。" },
        { question: "ひょうで、月 3、火 6、水 9。1日ごとにいくつふえている？", answer: "3", options: d("3", "6", "9", "2"), hint: "3、6、9のふえかた。" },
        { question: "ひょうをつくるとき、まずそろえるとよいものは？", answer: "なまえとかず", options: d("なまえとかず", "いろだけ", "おとだけ", "じゅんばんなし"), hint: "なにがいくつかをかく。" },
        { question: "ぼうグラフで、同じたかさのぼうは、かずが？", answer: "おなじ", options: d("おなじ", "ちがう", "ふえる", "へる"), hint: "同じたかさは同じかず。" },
        { question: "ひょうで、さかな 15、えび 9。すくないのは？", answer: "えび", options: d("えび", "さかな", "おなじ", "かに"), hint: "9のほうがすくない。" },
        { question: "ぼうグラフで、0このところのぼうは？", answer: "ない", options: d("ない", "いちばんたかい", "2本", "10本"), hint: "0はぼうがない。" },
        { question: "ひょうで、A 11、B 11、C 4。AとBは？", answer: "おなじ", options: d("おなじ", "Aがおおい", "Bがおおい", "Cがおおい"), hint: "11と11はおなじ。" },
        { question: "ぼうグラフで、9こと6このちがいは？", answer: "3こ", options: d("3こ", "6こ", "9こ", "15こ"), hint: "9から6をひく。" },
        { question: "ひょうで、4、8、12とならぶとき、つぎは？", answer: "16", options: d("16", "14", "12", "20"), hint: "4ずつふえている。" },
        { question: "ぼうグラフをみると、なにがわかりやすい？", answer: "おおいすくない", options: d("おおいすくない", "おとの大きさ", "におい", "あじ"), hint: "かずをくらべる。" },
        { question: "ひょうで、右のかずをよむときに気をつけることは？", answer: "けたをよくみる", options: d("けたをよくみる", "いろだけみる", "上だけみる", "よまない"), hint: "12と21はちがう。" },
        { question: "ひょうとグラフのどちらも、かずをどうするもの？", answer: "くらべやすくする", options: d("くらべやすくする", "かくす", "へらす", "ふやすだけ"), hint: "見てわかるようにする。" },
    ], // 表 と グラフ
    MATH_G2_U02: [
        { question: "23 + 14 = ?", answer: "37", options: d("37", "36", "27", "47"), hint: "一のくらい、十のくらいでたそう。" },
        { question: "35 + 22 = ?", answer: "57", options: d("57", "55", "47", "67"), hint: "30と20、5と2。" },
        { question: "46 + 18 = ?", answer: "64", options: d("64", "54", "63", "74"), hint: "6+8でくりあがる。" },
        { question: "58 + 27 = ?", answer: "85", options: d("85", "75", "84", "95"), hint: "8+7でくりあがる。" },
        { question: "12 + 49 = ?", answer: "61", options: d("61", "51", "60", "71"), hint: "2+9でくりあがる。" },
        { question: "67 + 25 = ?", answer: "92", options: d("92", "82", "91", "102"), hint: "7+5でくりあがる。" },
        { question: "34 + 36 = ?", answer: "70", options: d("70", "60", "69", "80"), hint: "4+6で10。" },
        { question: "41 + 29 = ?", answer: "70", options: d("70", "60", "69", "80"), hint: "1+9で10。" },
        { question: "28 + 33 = ?", answer: "61", options: d("61", "51", "60", "71"), hint: "8+3でくりあがる。" },
        { question: "19 + 44 = ?", answer: "63", options: d("63", "53", "62", "73"), hint: "9+4でくりあがる。" },
        { question: "こたえが 56 になるしきは？", answer: "24 + 32", options: d("24 + 32", "24 + 22", "34 + 32", "56 - 10"), hint: "たして56になるもの。" },
        { question: "こたえが 83 になるしきは？", answer: "56 + 27", options: d("56 + 27", "56 + 17", "46 + 27", "83 - 1"), hint: "6+7でくりあがる。" },
        { question: "45に 18をたすと？", answer: "63", options: d("63", "53", "62", "73"), hint: "45+18。" },
        { question: "27に 46をたすと？", answer: "73", options: d("73", "63", "72", "83"), hint: "27+46。" },
        { question: "ひっさんで、はじめに見るくらいは？", answer: "一のくらい", options: d("一のくらい", "十のくらいだけ", "百のくらい", "なまえ"), hint: "右から計算する。" },
        { question: "一のくらいが 8+5 のとき、くりあがりは？", answer: "ある", options: d("ある", "ない", "いつも0", "わからない"), hint: "8+5は13。" },
        { question: "一のくらいが 3+4 のとき、くりあがりは？", answer: "ない", options: d("ない", "ある", "いつもある", "10になる"), hint: "3+4は7。" },
        { question: "32 + 48 の一のくらいは 2+8。どうなる？", answer: "10になりくりあがる", options: d("10になりくりあがる", "0だけかく", "2になる", "8になる"), hint: "10になったら十のくらいへ。" },
        { question: "24 + 35 と 35 + 24。こたえは？", answer: "おなじ", options: d("おなじ", "24+35が大きい", "35+24が大きい", "どちらも0"), hint: "たすじゅんをかえても同じ。" },
        { question: "2けたのたし算で、たしかめに使えることは？", answer: "もう一度ひっさんする", options: d("もう一度ひっさんする", "けたを見ない", "答えだけ先に書く", "一のくらいを消す"), hint: "たしかめは大切。" },
    ], // たし算（2けた＋2けた）
    MATH_G2_U03: [
        { question: "48 - 23 = ?", answer: "25", options: d("25", "21", "35", "71"), hint: "一のくらい、十のくらいでひく。" },
        { question: "76 - 34 = ?", answer: "42", options: d("42", "32", "44", "110"), hint: "6-4、7-3。" },
        { question: "52 - 18 = ?", answer: "34", options: d("34", "44", "30", "70"), hint: "くりさがりに気をつける。" },
        { question: "61 - 27 = ?", answer: "34", options: d("34", "44", "36", "88"), hint: "1から7はひけない。" },
        { question: "90 - 45 = ?", answer: "45", options: d("45", "55", "35", "135"), hint: "くりさがりがある。" },
        { question: "83 - 56 = ?", answer: "27", options: d("27", "37", "33", "139"), hint: "13から6をひく。" },
        { question: "74 - 29 = ?", answer: "45", options: d("45", "55", "43", "103"), hint: "4から9はひけない。" },
        { question: "65 - 38 = ?", answer: "27", options: d("27", "37", "33", "103"), hint: "15から8をひく。" },
        { question: "39 - 12 = ?", answer: "27", options: d("27", "21", "37", "51"), hint: "くりさがりなし。" },
        { question: "58 - 19 = ?", answer: "39", options: d("39", "49", "37", "77"), hint: "8から9はひけない。" },
        { question: "こたえが 26 になるしきは？", answer: "54 - 28", options: d("54 - 28", "54 - 18", "44 - 28", "26 + 1"), hint: "ひいて26になるもの。" },
        { question: "こたえが 47 になるしきは？", answer: "82 - 35", options: d("82 - 35", "82 - 25", "72 - 35", "47 + 10"), hint: "くりさがりがある。" },
        { question: "73から 26をひくと？", answer: "47", options: d("47", "57", "49", "99"), hint: "73-26。" },
        { question: "64から 18をひくと？", answer: "46", options: d("46", "56", "44", "82"), hint: "64-18。" },
        { question: "ひっさんのひき算で、上の一のくらいが小さいときは？", answer: "十のくらいからかりる", options: d("十のくらいからかりる", "そのままひく", "答えを0にする", "たし算にする"), hint: "くりさがり。" },
        { question: "42 - 17 で、一のくらいは 2から7をひく。どうする？", answer: "かりる", options: d("かりる", "そのまま2", "7を書く", "たす"), hint: "2から7はひけない。" },
        { question: "68 - 24 で、くりさがりは？", answer: "ない", options: d("ない", "ある", "いつもある", "答えがない"), hint: "8から4はひける。" },
        { question: "50 - 23 で、くりさがりは？", answer: "ある", options: d("ある", "ない", "いつもない", "23になる"), hint: "0から3はひけない。" },
        { question: "ひき算のたしかめに使えるしきは？ 64 - 28 = 36", answer: "36 + 28", options: d("36 + 28", "36 - 28", "64 + 28", "28 - 36"), hint: "答えとひいた数をたす。" },
        { question: "2けたのひき算で大切なのは？", answer: "くらいをそろえる", options: d("くらいをそろえる", "ななめに書く", "一のくらいを消す", "大きい数だけ見る"), hint: "一のくらいと十のくらい。" },
    ], // ひき算（2けた−2けた）
    MATH_G2_U04: [
        { question: "10mmは なんcm？", answer: "1cm", options: d("1cm", "10cm", "100cm", "0cm"), hint: "10mmで1cm。" },
        { question: "3cmは なんmm？", answer: "30mm", options: d("30mm", "3mm", "300mm", "13mm"), hint: "1cmは10mm。" },
        { question: "2cm5mmは なんmm？", answer: "25mm", options: d("25mm", "20mm", "7mm", "250mm"), hint: "2cmは20mm。" },
        { question: "47mmは なんcmなんmm？", answer: "4cm7mm", options: d("4cm7mm", "47cm", "4cm", "7cm4mm"), hint: "10mmで1cm。" },
        { question: "5cm + 3cm = ?", answer: "8cm", options: d("8cm", "2cm", "15cm", "53cm"), hint: "同じたんいでたす。" },
        { question: "9cm - 4cm = ?", answer: "5cm", options: d("5cm", "13cm", "4cm", "6cm"), hint: "同じたんいでひく。" },
        { question: "6cm2mm + 1cm3mm = ?", answer: "7cm5mm", options: d("7cm5mm", "7cm", "6cm5mm", "8cm5mm"), hint: "cmどうし、mmどうし。" },
        { question: "8cm6mm - 3cm2mm = ?", answer: "5cm4mm", options: d("5cm4mm", "5cm8mm", "4cm4mm", "11cm8mm"), hint: "同じたんいでひく。" },
        { question: "ものさしで長さをはかるとき、はしをどこにあわせる？", answer: "0", options: d("0", "1", "10", "どこでもよい"), hint: "0からはかる。" },
        { question: "1mは なんcm？", answer: "100cm", options: d("100cm", "10cm", "1000cm", "1cm"), hint: "1mは100cm。" },
        { question: "120cmは なんmなんcm？", answer: "1m20cm", options: d("1m20cm", "12m", "120m", "2m10cm"), hint: "100cmで1m。" },
        { question: "1m30cmは なんcm？", answer: "130cm", options: d("130cm", "103cm", "30cm", "13cm"), hint: "1mは100cm。" },
        { question: "34cmと43cm。長いのは？", answer: "43cm", options: d("43cm", "34cm", "おなじ", "9cm"), hint: "数の大きさでくらべる。" },
        { question: "72mmと7cm。長いのは？", answer: "72mm", options: d("72mm", "7cm", "おなじ", "2mm"), hint: "7cmは70mm。" },
        { question: "5cm8mmと58mm。くらべると？", answer: "おなじ", options: d("おなじ", "5cm8mmが長い", "58mmが長い", "くらべられない"), hint: "5cm8mmは58mm。" },
        { question: "2cm9mmに1mmたすと？", answer: "3cm", options: d("3cm", "2cm10mm", "2cm9mm", "30cm"), hint: "10mmで1cm。" },
        { question: "長さのたんいで、cmより小さいものは？", answer: "mm", options: d("mm", "m", "L", "dL"), hint: "こまかくはかる。" },
        { question: "長さのたんいで、cmより大きいものは？", answer: "m", options: d("m", "mm", "mL", "こ"), hint: "長いものをはかる。" },
        { question: "ものさしで、0から6cmまでの長さは？", answer: "6cm", options: d("6cm", "5cm", "7cm", "0cm"), hint: "0から読む。" },
        { question: "ものさしで、2cmから8cmまでの長さは？", answer: "6cm", options: d("6cm", "8cm", "10cm", "2cm"), hint: "8-2。" },
    ], // 長さ（ものさし）
    MATH_G2_U05: [
        { question: "57のつぎの数は？", answer: "58", options: d("58", "57", "59", "56"), hint: "ひとつ大きい数。" },
        { question: "80のひとつ前の数は？", answer: "79", options: d("79", "80", "81", "70"), hint: "ひとつ小さい数。" },
        { question: "10を6こあつめた数は？", answer: "60", options: d("60", "16", "6", "100"), hint: "10、20、30..." },
        { question: "10を9こあつめた数は？", answer: "90", options: d("90", "19", "9", "99"), hint: "十が9こ。" },
        { question: "47は、10が4こと 1がいくつ？", answer: "7こ", options: d("7こ", "4こ", "47こ", "3こ"), hint: "一のくらいを見る。" },
        { question: "83は、10がいくつ？", answer: "8こ", options: d("8こ", "3こ", "83こ", "10こ"), hint: "十のくらいを見る。" },
        { question: "70と5でできる数は？", answer: "75", options: d("75", "705", "57", "70"), hint: "70に5をあわせる。" },
        { question: "90と9でできる数は？", answer: "99", options: d("99", "909", "90", "19"), hint: "90に9をあわせる。" },
        { question: "45、54、49の中でいちばん大きい数は？", answer: "54", options: d("54", "45", "49", "44"), hint: "十のくらいから見る。" },
        { question: "62、26、60の中でいちばん小さい数は？", answer: "26", options: d("26", "62", "60", "20"), hint: "十のくらいをくらべる。" },
        { question: "30、40、50、？。？に入る数は？", answer: "60", options: d("60", "55", "70", "40"), hint: "10ずつふえる。" },
        { question: "100のひとつ前の数は？", answer: "99", options: d("99", "100", "98", "101"), hint: "100の前。" },
        { question: "1から100までで、いちばん大きい数は？", answer: "100", options: d("100", "99", "10", "1"), hint: "100までのさいご。" },
        { question: "68の十のくらいの数は？", answer: "6", options: d("6", "8", "68", "60"), hint: "十が6こ。" },
        { question: "68の一のくらいの数は？", answer: "8", options: d("8", "6", "68", "60"), hint: "一が8こ。" },
        { question: "4、40、44の中で、十が4こある数は？", answer: "40", options: d("40", "4", "44", "14"), hint: "十のくらいが4。" },
        { question: "100は10がいくつ？", answer: "10こ", options: d("10こ", "1こ", "100こ", "0こ"), hint: "10が10こで100。" },
        { question: "88は80といくつ？", answer: "8", options: d("8", "80", "88", "10"), hint: "一のくらい。" },
        { question: "52より大きく、55より小さい数は？", answer: "53", options: d("53", "52", "55", "56"), hint: "52、53、54、55。" },
        { question: "100までの数をくらべるとき、まず見るのは？", answer: "十のくらい", options: d("十のくらい", "一のくらいだけ", "色", "名前"), hint: "大きいくらいから見る。" },
    ], // 100までの 数
    MATH_G2_U06: [
        { question: "1Lは なんdL？", answer: "10dL", options: d("10dL", "100dL", "1dL", "1000dL"), hint: "1Lは10dL。" },
        { question: "1dLは なんmL？", answer: "100mL", options: d("100mL", "10mL", "1mL", "1000mL"), hint: "1dLは100mL。" },
        { question: "3dLは なんmL？", answer: "300mL", options: d("300mL", "30mL", "3mL", "100mL"), hint: "100mLが3こ。" },
        { question: "500mLは なんdL？", answer: "5dL", options: d("5dL", "50dL", "500dL", "1dL"), hint: "100mLで1dL。" },
        { question: "2Lは なんdL？", answer: "20dL", options: d("20dL", "2dL", "200dL", "12dL"), hint: "1Lは10dL。" },
        { question: "1L5dLは なんdL？", answer: "15dL", options: d("15dL", "6dL", "105dL", "10dL"), hint: "10dLと5dL。" },
        { question: "8dL + 4dL = ?", answer: "12dL", options: d("12dL", "8dL", "4dL", "14dL"), hint: "同じたんいでたす。" },
        { question: "1L + 3dL = ?", answer: "13dL", options: d("13dL", "4dL", "10dL", "30dL"), hint: "1Lは10dL。" },
        { question: "9dL - 2dL = ?", answer: "7dL", options: d("7dL", "9dL", "2dL", "11dL"), hint: "同じたんいでひく。" },
        { question: "1L - 4dL = ?", answer: "6dL", options: d("6dL", "4dL", "10dL", "14dL"), hint: "10dLから4dLをひく。" },
        { question: "700mLと6dL。多いのは？", answer: "700mL", options: d("700mL", "6dL", "おなじ", "70mL"), hint: "6dLは600mL。" },
        { question: "4dLと400mL。くらべると？", answer: "おなじ", options: d("おなじ", "4dLが多い", "400mLが多い", "くらべられない"), hint: "4dLは400mL。" },
        { question: "かさをはかるものは？", answer: "ます", options: d("ます", "ものさし", "とけい", "はさみ"), hint: "水のりょうをはかる。" },
        { question: "水とうに 1L、こっぷに 2dL。多いのは？", answer: "水とう", options: d("水とう", "こっぷ", "おなじ", "わからない"), hint: "1Lは10dL。" },
        { question: "3Lは なんdL？", answer: "30dL", options: d("30dL", "3dL", "300dL", "13dL"), hint: "10dLが3こ。" },
        { question: "1200mLは なんLなんmL？", answer: "1L200mL", options: d("1L200mL", "12L", "120L", "2L100mL"), hint: "1000mLで1L。" },
        { question: "1Lは なんmL？", answer: "1000mL", options: d("1000mL", "100mL", "10mL", "1mL"), hint: "10dLで1000mL。" },
        { question: "250mLを4こで？", answer: "1000mL", options: d("1000mL", "500mL", "750mL", "250mL"), hint: "250を4つ。" },
        { question: "かさのたんいで、Lより小さいものは？", answer: "dL", options: d("dL", "m", "cm", "kg"), hint: "リットルより小さい。" },
        { question: "かさをくらべるとき、たんいがちがうなら？", answer: "同じたんいにする", options: d("同じたんいにする", "色でくらべる", "名前でくらべる", "くらべない"), hint: "dLやmLにそろえる。" },
    ], // かさ（リットル・デシリットル）
    MATH_G2_U07: [
        { question: "1時間は なん分？", answer: "60分", options: d("60分", "100分", "30分", "10分"), hint: "長いはりが1まわり。" },
        { question: "30分は、なん時間の半分？", answer: "1時間", options: d("1時間", "2時間", "30時間", "10分"), hint: "1時間は60分。" },
        { question: "2時の3時間後は？", answer: "5時", options: d("5時", "4時", "6時", "3時"), hint: "2+3。" },
        { question: "9時の2時間後は？", answer: "11時", options: d("11時", "10時", "12時", "7時"), hint: "9+2。" },
        { question: "5時の1時間前は？", answer: "4時", options: d("4時", "5時", "6時", "3時"), hint: "ひとつ前。" },
        { question: "12時の2時間前は？", answer: "10時", options: d("10時", "11時", "12時", "2時"), hint: "12から2。" },
        { question: "3時20分の10分後は？", answer: "3時30分", options: d("3時30分", "3時10分", "4時20分", "3時20分"), hint: "分を10ふやす。" },
        { question: "4時50分の10分後は？", answer: "5時", options: d("5時", "4時60分", "4時40分", "6時"), hint: "60分で1時間。" },
        { question: "7時15分の15分後は？", answer: "7時30分", options: d("7時30分", "7時15分", "7時45分", "8時"), hint: "15分たす。" },
        { question: "8時30分の30分後は？", answer: "9時", options: d("9時", "8時60分", "8時", "9時30分"), hint: "30分と30分で1時間。" },
        { question: "10時から12時までは なん時間？", answer: "2時間", options: d("2時間", "10時間", "12時間", "1時間"), hint: "12-10。" },
        { question: "1時から4時までは なん時間？", answer: "3時間", options: d("3時間", "4時間", "1時間", "5時間"), hint: "4-1。" },
        { question: "午前と午後をあわせた1日は？", answer: "24時間", options: d("24時間", "12時間", "60時間", "10時間"), hint: "1日の長さ。" },
        { question: "長いはりが12、短いはりが6。時こくは？", answer: "6時", options: d("6時", "12時", "6時半", "3時"), hint: "ちょうどの時こく。" },
        { question: "長いはりが6、短いはりが6と7の間。時こくは？", answer: "6時半", options: d("6時半", "6時", "7時", "12時半"), hint: "長いはりが6は半。" },
        { question: "2時半の30分後は？", answer: "3時", options: d("3時", "2時", "2時半", "3時半"), hint: "半から30分でちょうど。" },
        { question: "4時10分から4時40分までは？", answer: "30分", options: d("30分", "40分", "10分", "1時間"), hint: "40-10。" },
        { question: "5時25分から5時35分までは？", answer: "10分", options: d("10分", "25分", "35分", "1時間"), hint: "35-25。" },
        { question: "時こくをよむとき、時をあらわすはりは？", answer: "短いはり", options: d("短いはり", "長いはりだけ", "色", "数字なし"), hint: "短いはりが時。" },
        { question: "時間をくらべるとき、1時間と50分ではどちらが長い？", answer: "1時間", options: d("1時間", "50分", "おなじ", "くらべられない"), hint: "1時間は60分。" },
    ], // 時こく と 時かん
    MATH_G2_U08: [
        { question: "100を3こ、10を2こ、1を5こ。数は？", answer: "325", options: d("325", "352", "235", "3025"), hint: "百、十、一のじゅん。" },
        { question: "100を7こ、10を0こ、1を4こ。数は？", answer: "704", options: d("704", "740", "74", "7004"), hint: "十のくらいは0。" },
        { question: "486の百のくらいは？", answer: "4", options: d("4", "8", "6", "486"), hint: "いちばん左。" },
        { question: "486の十のくらいは？", answer: "8", options: d("8", "4", "6", "80"), hint: "まんなか。" },
        { question: "486の一のくらいは？", answer: "6", options: d("6", "4", "8", "600"), hint: "いちばん右。" },
        { question: "350は、100がいくつ？", answer: "3こ", options: d("3こ", "5こ", "0こ", "35こ"), hint: "百のくらい。" },
        { question: "902をことばでいうと？", answer: "九百二", options: d("九百二", "九十二", "九百二十", "二百九"), hint: "十のくらいは0。" },
        { question: "六百三十を数字で書くと？", answer: "630", options: d("630", "603", "63", "60030"), hint: "百、十、一。" },
        { question: "248、284、428。いちばん大きいのは？", answer: "428", options: d("428", "284", "248", "824"), hint: "百のくらいからくらべる。" },
        { question: "519、591、159。いちばん小さいのは？", answer: "159", options: d("159", "519", "591", "951"), hint: "百のくらいを見る。" },
        { question: "300、400、500、？。？は？", answer: "600", options: d("600", "550", "700", "500"), hint: "100ずつふえる。" },
        { question: "780、770、760、？。？は？", answer: "750", options: d("750", "760", "740", "700"), hint: "10ずつへる。" },
        { question: "999のつぎの数は？", answer: "1000", options: d("1000", "998", "9999", "900"), hint: "999のつぎ。" },
        { question: "1000のひとつ前は？", answer: "999", options: d("999", "1001", "990", "900"), hint: "1000の前。" },
        { question: "100を10こあつめた数は？", answer: "1000", options: d("1000", "100", "10000", "10"), hint: "千になる。" },
        { question: "5千、2百、0十、9一。数は？", answer: "5209", options: d("5209", "5290", "5029", "520"), hint: "十のくらいは0。" },
        { question: "704と740。大きいのは？", answer: "740", options: d("740", "704", "おなじ", "700"), hint: "十のくらいを見る。" },
        { question: "1000までの数で、くらべるときまず見るくらいは？", answer: "千や百のくらい", options: d("千や百のくらい", "一のくらいだけ", "色", "名前"), hint: "大きいくらいから。" },
        { question: "608は600といくつ？", answer: "8", options: d("8", "6", "60", "608"), hint: "一のくらい。" },
        { question: "810は800といくつ？", answer: "10", options: d("10", "1", "800", "810"), hint: "十が1こ。" },
    ], // 3けたの 数
    MATH_G2_U09: [
        { question: "3こずつのさらが4まい。しきは？", answer: "3 × 4", options: d("3 × 4", "3 + 4", "4 - 3", "3 × 3"), hint: "3こが4つ。" },
        { question: "2人ずつのれつが5つ。しきは？", answer: "2 × 5", options: d("2 × 5", "2 + 5", "5 - 2", "2 × 4"), hint: "2人が5つ。" },
        { question: "4 + 4 + 4 をかけ算にすると？", answer: "4 × 3", options: d("4 × 3", "3 × 4", "4 + 3", "4 × 4"), hint: "4が3つ。" },
        { question: "6 + 6 をかけ算にすると？", answer: "6 × 2", options: d("6 × 2", "2 × 6", "6 + 2", "6 × 6"), hint: "6が2つ。" },
        { question: "5 × 3 は、どんな意味？", answer: "5が3つ", options: d("5が3つ", "3が5つだけ", "5+3だけ", "5-3"), hint: "前の数がいくつずつ。" },
        { question: "7が4つあるしきは？", answer: "7 × 4", options: d("7 × 4", "4 × 7", "7 + 4", "7 - 4"), hint: "7が4つ。" },
        { question: "2 × 6 のこたえは？", answer: "12", options: d("12", "8", "10", "6"), hint: "2が6つ。" },
        { question: "3 × 5 のこたえは？", answer: "15", options: d("15", "8", "12", "10"), hint: "3が5つ。" },
        { question: "4こ入りのふくろが3つ。ぜんぶで？", answer: "12こ", options: d("12こ", "7こ", "9こ", "16こ"), hint: "4×3。" },
        { question: "5本ずつのたばが2つ。ぜんぶで？", answer: "10本", options: d("10本", "7本", "5本", "12本"), hint: "5×2。" },
        { question: "同じ数をくりかえしてたすとき、使えるのは？", answer: "かけ算", options: d("かけ算", "ひき算だけ", "時こく", "長さ"), hint: "同じ数がならぶ。" },
        { question: "3 + 3 + 3 + 3 + 3 の、同じ数は？", answer: "3", options: d("3", "5", "15", "4"), hint: "3がくりかえし。" },
        { question: "3 + 3 + 3 + 3 + 3 の、いくつ分？", answer: "5つ分", options: d("5つ分", "3つ分", "15こ", "2つ分"), hint: "3が5つ。" },
        { question: "2 × 4 と 2 + 2 + 2 + 2。こたえは？", answer: "おなじ", options: d("おなじ", "2×4が大きい", "たし算が大きい", "どちらも0"), hint: "2が4つ。" },
        { question: "6 × 1 は？", answer: "6", options: d("6", "1", "7", "0"), hint: "6が1つ。" },
        { question: "8 × 0 は？", answer: "0", options: d("0", "8", "80", "1"), hint: "0こ分は0。" },
        { question: "5が4つで？", answer: "20", options: d("20", "9", "15", "25"), hint: "5×4。" },
        { question: "4が5つで？", answer: "20", options: d("20", "9", "16", "25"), hint: "4×5。" },
        { question: "3こずつを6つ分。しきは？", answer: "3 × 6", options: d("3 × 6", "6 × 3 + 1", "3 + 6", "6 - 3"), hint: "3こずつが6つ。" },
        { question: "かけ算のしきで、うしろの数があらわすことは？", answer: "いくつ分", options: d("いくつ分", "いろ", "長さだけ", "時こく"), hint: "何こ分か。" },
    ], // かけ算（かけ算のいみ）
    MATH_G2_U10: [
        { question: "2 × 7 = ?", answer: "14", options: d("14", "12", "16", "9"), hint: "にしち14。" },
        { question: "3 × 6 = ?", answer: "18", options: d("18", "15", "21", "9"), hint: "さぶろく18。" },
        { question: "4 × 8 = ?", answer: "32", options: d("32", "28", "36", "12"), hint: "しは32。" },
        { question: "5 × 9 = ?", answer: "45", options: d("45", "40", "50", "14"), hint: "ごっく45。" },
        { question: "6 × 7 = ?", answer: "42", options: d("42", "36", "48", "13"), hint: "ろくしち42。" },
        { question: "7 × 8 = ?", answer: "56", options: d("56", "49", "64", "15"), hint: "しちは56。" },
        { question: "8 × 9 = ?", answer: "72", options: d("72", "64", "81", "17"), hint: "はっく72。" },
        { question: "9 × 9 = ?", answer: "81", options: d("81", "72", "90", "18"), hint: "くく81。" },
        { question: "答えが24になる九九は？", answer: "3 × 8", options: d("3 × 8", "5 × 5", "7 × 3", "2 × 10"), hint: "さんぱ24。" },
        { question: "答えが36になる九九は？", answer: "4 × 9", options: d("4 × 9", "5 × 7", "6 × 5", "8 × 4"), hint: "しく36。" },
        { question: "□ × 6 = 30。□は？", answer: "5", options: d("5", "4", "6", "30"), hint: "ごろく30。" },
        { question: "7 × □ = 63。□は？", answer: "9", options: d("9", "8", "7", "6"), hint: "しちく63。" },
        { question: "8 × □ = 40。□は？", answer: "5", options: d("5", "4", "8", "6"), hint: "はちご40。" },
        { question: "9 × □ = 54。□は？", answer: "6", options: d("6", "5", "9", "7"), hint: "くろく54。" },
        { question: "6 × 4 と 4 × 6。こたえは？", answer: "おなじ", options: d("おなじ", "6×4が大きい", "4×6が大きい", "どちらも0"), hint: "どちらも24。" },
        { question: "1のだんで、1 × 8 = ?", answer: "8", options: d("8", "1", "9", "0"), hint: "1が8つ。" },
        { question: "10のだんで、10 × 6 = ?", answer: "60", options: d("60", "16", "10", "600"), hint: "10が6つ。" },
        { question: "九九で答えが49になるのは？", answer: "7 × 7", options: d("7 × 7", "6 × 8", "8 × 8", "9 × 5"), hint: "しちし49。" },
        { question: "九九で答えが64になるのは？", answer: "8 × 8", options: d("8 × 8", "7 × 9", "6 × 9", "9 × 9"), hint: "はっぱ64。" },
        { question: "九九を使うと、なにが早くできる？", answer: "同じ数のたし算", options: d("同じ数のたし算", "時計のよみだけ", "長さの色分け", "名前を書くこと"), hint: "くりかえしのたし算。" },
    ], // かけ算（九九）
    MATH_G2_U11: [
        { question: "さいころの形で、たいらな面はいくつ？", answer: "6つ", options: d("6つ", "8つ", "12本", "4つ"), hint: "まわりの面をかぞえる。", visual: { kind: 'cube' } },
        { question: "さいころの形で、かどはいくつ？", answer: "8つ", options: d("8つ", "6つ", "12本", "4つ"), hint: "かどをかぞえる。" },
        { question: "さいころの形で、へんはなん本？", answer: "12本", options: d("12本", "8本", "6本", "10本"), hint: "ほねぐみの線。" },
        { question: "はこの形の面は、どんな形が多い？", answer: "しかく", options: d("しかく", "まる", "さんかく", "せん"), hint: "たいらな四角い面。" },
        { question: "同じ大きさのしかくい面だけのはこに近いものは？", answer: "さいころ", options: d("さいころ", "ボール", "コップ", "円すい"), hint: "さいころを思い出す。" },
        { question: "はこの形をひらいたものを何という？", answer: "ひらいた図", options: d("ひらいた図", "時計", "ものさし", "ひょう"), hint: "組み立てる前の形。" },
        { question: "はこの形で、1つのかどにあつまるへんは？", answer: "3本", options: d("3本", "2本", "4本", "6本"), hint: "たて、よこ、高さ。" },
        { question: "はこの形で、向かいあう面は？", answer: "同じ大きさ", options: d("同じ大きさ", "いつもまる", "なくなる", "1つだけ"), hint: "向かいあう面をくらべる。" },
        { question: "はこの形を作るとき、面をつなぐところは？", answer: "へん", options: d("へん", "まんなか", "色", "数字"), hint: "面と面のさかい。" },
        { question: "ボールのようにころがる形は、はこの形？", answer: "ちがう", options: d("ちがう", "同じ", "面が6つ", "へんが12本"), hint: "はこはたいらな面がある。" },
        { question: "はこの形をつむとき、つみやすいわけは？", answer: "たいらな面がある", options: d("たいらな面がある", "まるいから", "水が入るから", "時こくがあるから"), hint: "たいらな面で止まる。" },
        { question: "はこの形で、面をかぞえるときに見るものは？", answer: "たいらなところ", options: d("たいらなところ", "かげ", "おと", "におい"), hint: "面はたいらなところ。" },
        { question: "はこの形で、へんをかぞえるときに見るものは？", answer: "面と面のさかい", options: d("面と面のさかい", "まんなか", "色", "重さ"), hint: "線のようなところ。" },
        { question: "はこの形で、かどをかぞえるときに見るものは？", answer: "へんがあつまるところ", options: d("へんがあつまるところ", "面のまんなか", "色のところ", "空気"), hint: "かどは先のところ。" },
        { question: "同じ大きさのはこを2つならべると、できる形は？", answer: "長いはこ", options: d("長いはこ", "まる", "さんかく", "時計"), hint: "はこが横に長くなる。" },
        { question: "はこの形を写すとき、まず写しやすいのは？", answer: "面", options: d("面", "音", "におい", "時間"), hint: "たいらな面をなぞる。" },
        { question: "さいころの向かいあう面は、となりあっている？", answer: "いいえ", options: d("いいえ", "はい", "いつも上", "いつも下"), hint: "向かいあう面ははなれている。" },
        { question: "はこの形で、上の面と下の面は？", answer: "向かいあう", options: d("向かいあう", "となりあう", "同じ場所", "なくなる"), hint: "上と下。" },
        { question: "はこの形で、となりあう面はどこでつながる？", answer: "へん", options: d("へん", "かどだけ", "まんなか", "水"), hint: "面と面のさかい。" },
        { question: "はこの形の学しゅうで、かぞえるものは？", answer: "面・へん・かど", options: d("面・へん・かど", "色だけ", "時こくだけ", "あじ"), hint: "立体のつくりを見る。" },
    ], // はこの 形
    MATH_G2_U12: [
        { question: "えんぴつが24本あります。13本もらうと、ぜんぶで？", answer: "37本", options: d("37本", "27本", "11本", "47本"), hint: "24+13。" },
        { question: "クッキーが45こあります。18こ食べると、のこりは？", answer: "27こ", options: d("27こ", "37こ", "63こ", "23こ"), hint: "45-18。" },
        { question: "カードが32まい、あとから29まいふえました。ぜんぶで？", answer: "61まい", options: d("61まい", "51まい", "60まい", "71まい"), hint: "32+29。" },
        { question: "あめが70こあります。25こくばると、のこりは？", answer: "45こ", options: d("45こ", "55こ", "35こ", "95こ"), hint: "70-25。" },
        { question: "4こずつ入ったふくろが6つ。ぜんぶで？", answer: "24こ", options: d("24こ", "10こ", "20こ", "28こ"), hint: "4×6。" },
        { question: "7人ずつのはんが3つ。ぜんぶで？", answer: "21人", options: d("21人", "10人", "24人", "18人"), hint: "7×3。" },
        { question: "2Lの水と5dLの水。あわせてなんdL？", answer: "25dL", options: d("25dL", "7dL", "20dL", "52dL"), hint: "2Lは20dL。" },
        { question: "1m20cmのリボンから30cm使いました。のこりは？", answer: "90cm", options: d("90cm", "110cm", "80cm", "150cm"), hint: "1m20cmは120cm。" },
        { question: "3時から5時30分までは？", answer: "2時間30分", options: d("2時間30分", "3時間", "5時間30分", "1時間30分"), hint: "3時から5時で2時間、あと30分。" },
        { question: "9時40分の20分後は？", answer: "10時", options: d("10時", "9時60分", "9時20分", "10時20分"), hint: "60分で1時間。" },
        { question: "ひもAは45cm、ひもBは28cm。Aはなんcm長い？", answer: "17cm", options: d("17cm", "73cm", "27cm", "13cm"), hint: "45-28。" },
        { question: "水が8dLあります。3dL飲むと、のこりは？", answer: "5dL", options: d("5dL", "11dL", "3dL", "8dL"), hint: "8-3。" },
        { question: "100円もっています。65円使うと、のこりは？", answer: "35円", options: d("35円", "45円", "65円", "165円"), hint: "100-65。" },
        { question: "36円のものと47円のものを買います。ぜんぶで？", answer: "83円", options: d("83円", "73円", "82円", "93円"), hint: "36+47。" },
        { question: "5cmのテープが8本あります。ぜんぶの長さは？", answer: "40cm", options: d("40cm", "13cm", "35cm", "45cm"), hint: "5×8。" },
        { question: "48このみかんを6こずつふくろに入れます。ふくろはいくつ分？", answer: "8つ分", options: d("8つ分", "6つ分", "42つ分", "54つ分"), hint: "6のだんを使う。" },
        { question: "ぶんしょうで「ぜんぶで」と聞かれたら、まず考えるのは？", answer: "たすかかけるか", options: d("たすかかけるか", "いつもひく", "色だけ", "時こくだけ"), hint: "ふえる・あわせる。" },
        { question: "ぶんしょうで「のこり」と聞かれたら、まず考えるのは？", answer: "ひき算", options: d("ひき算", "かけ算だけ", "表だけ", "長さだけ"), hint: "へる場面。" },
        { question: "同じ数ずつある場面で使いやすいのは？", answer: "かけ算", options: d("かけ算", "時計", "ものさし", "ひょうだけ"), hint: "同じ数のくりかえし。" },
        { question: "ぶんしょうだいで、はじめにすることは？", answer: "何を聞かれているか見る", options: d("何を聞かれているか見る", "答えだけ書く", "数字を全部たす", "読まない"), hint: "聞かれていることをつかむ。" },
    ], // ぶんしょうだい
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G2_U01': {
            const a = (n % 6) + 2;
            const b = (n % 5) + 1;
            const c = (n % 4) + 1;
            const p = n % 4;
            if (p === 0) {
                const answer = a === b ? "おなじ" : (a > b ? "あか" : "あお");
                const wrongs = ["あか", "あお", "おなじ", "わからない"].filter((label) => label !== answer).slice(0, 3);
                return { question: `ぼうグラフで いちばん おおいのは？`, answer, options: d(answer, ...wrongs), hint: "たかい ぼうを みよう。", visual: { kind: 'bar_chart', values: [a, b], labels: ["あか", "あお"] } };
            }
            if (p === 1) {
                return { question: `あか と あおを あわせると いくつ？`, answer: `${a + b}`, options: d(`${a + b}`, `${a - b}`, `${a + b + 1}`, `${a}`), hint: "たしざんで もとめる。", visual: { kind: 'bar_chart', values: [a, b], labels: ["あか", "あお"] } };
            }
            if (p === 2) {
                const min = Math.min(a, b, c);
                const winners = [["あか", a], ["あお", b], ["みどり", c]].filter(([, v]) => v === min).map(([label]) => label);
                const answer = winners.length === 1 ? winners[0] : "おなじ";
                const wrongs = ["あか", "あお", "みどり", "おなじ"].filter((label) => label !== answer).slice(0, 3);
                return { question: `みどりは ${c}こ。 いちばん すくない いろは？`, answer, options: d(answer, ...wrongs), hint: "ひくい ぼうを さがそう。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["あか", "あお", "みどり"] } };
            }
            return { question: `あおは あかより いくつ ちがう？`, answer: `${Math.abs(a - b)}`, options: d(`${Math.abs(a - b)}`, `${a + b}`, `${Math.max(a, b)}`, `${Math.min(a, b)}`), hint: "おおいほう と すくないほう の さ。", visual: { kind: 'bar_chart', values: [a, b], labels: ["あか", "あお"] } };
        }
        case 'MATH_G2_U02': {
            const a = 20 + (n % 60);
            const b = 10 + (n % 30);
            const s = a + b;
            if (n % 3 === 0) return { question: `${a} + ${b} = ?`, answer: `${s}`, options: d(`${s}`, `${s + 1}`, `${s - 1}`, `${a}`), hint: "2けたどうしの たし算だよ。" };
            if (n % 3 === 1) return { question: `${a} に ${b} を たすと？`, answer: `${s}`, options: d(`${s}`, `${s + 10}`, `${s - 10}`, `${b}`), hint: "くりあがりにも 気をつけよう。" };
            return { question: `こたえが ${s} に なる しきは？`, answer: `${a} + ${b}`, options: d(`${a} + ${b}`, `${a} + ${b + 1}`, `${a - 1} + ${b}`, `${a} - ${b}`), hint: "しきを えらぼう。" };
        }
        case 'MATH_G2_U03': {
            const b = 10 + (n % 30);
            const a = b + 20 + (n % 20);
            const dff = a - b;
            if (n % 3 === 0) return { question: `${a} - ${b} = ?`, answer: `${dff}`, options: d(`${dff}`, `${dff + 1}`, `${dff - 1}`, `${a}`), hint: "2けたどうしの ひき算だよ。" };
            if (n % 3 === 1) return { question: `${a} から ${b} を ひくと？`, answer: `${dff}`, options: d(`${dff}`, `${a + b}`, `${b}`, `${dff + 10}`), hint: "くりさがりにも 気をつけよう。" };
            return { question: `こたえが ${dff} に なる しきは？`, answer: `${a} - ${b}`, options: d(`${a} - ${b}`, `${a} + ${b}`, `${b} - ${a}`, `${a} - ${b + 1}`), hint: "しきを えらぼう。" };
        }
        case 'MATH_G2_U04': {
            const a = (n % 9) + 1;
            const b = (n % 8) + 2;
            const answer = a === b ? "おなじ" : `${Math.max(a, b)}cm`;
            return { question: `${a}cm と ${b}cm。 ながいのは？`, answer, options: d(answer, a === b ? `${a + 1}cm` : `${Math.min(a, b)}cm`, a === b ? `${Math.max(1, a - 1)}cm` : "おなじ", "わからない"), hint: "ものさしで くらべる イメージ。" };
        }
        case 'MATH_G2_U05': {
            const a = 10 + (n % 90);
            if (n % 2 === 0) return { question: `${a}の つぎの かずは？`, answer: `${a + 1}`, options: d(`${a + 1}`, `${a}`, `${a - 1}`, `${a + 2}`), hint: "100までの かずを ならべよう。" };
            return { question: `${a}の まえの かずは？`, answer: `${a - 1}`, options: d(`${a - 1}`, `${a}`, `${a + 1}`, `${a - 2}`), hint: "ひとつ まえを かんがえよう。" };
        }
        case 'MATH_G2_U06': {
            const dl = (n % 9) + 1;
            if (n % 2 === 0) return { question: `${dl}dL は なんmL？`, answer: `${dl * 100}mL`, options: d(`${dl * 100}mL`, `${dl * 10}mL`, `${dl}mL`, `${dl * 1000}mL`), hint: "1dL = 100mL。" };
            return { question: `${dl * 100}mL は なんdL？`, answer: `${dl}dL`, options: d(`${dl}dL`, `${dl * 10}dL`, `1dL`, `${dl + 1}dL`), hint: "100mLで 1dL。" };
        }
        case 'MATH_G2_U07': {
            const h = (n % 10) + 1;
            const add = (n % 4) + 1;
            const ans = ((h + add - 1) % 12) + 1;
            const wrong1 = (ans % 12) + 1;
            return {
                question: `この とけいの ${add}じかんご は？`,
                answer: `${ans}じ`,
                options: d(`${ans}じ`, `${wrong1}じ`, `${h}じ`, `${add}じ`),
                hint: "じかんを たそう。",
                visual: { kind: 'clock', hour: h, minute: 0 }
            };
        }
        case 'MATH_G2_U08': {
            const h = (n % 9) + 1;
            const t = n % 10;
            const o = (n * 3) % 10;
            const value = `${h}${t}${o}`;
            if (n % 2 === 0) return { question: `${h}ひゃく ${t}じゅう ${o} を 数字で かくと？`, answer: value, options: d(value, `${h}${o}${t}`, `${t}${h}${o}`, `${h}${t}`), hint: "100の くらいから ならべよう。" };
            return { question: `${value} を ことばで いうと？`, answer: `${h}ひゃく ${t}じゅう ${o}`, options: d(`${h}ひゃく ${t}じゅう ${o}`, `${h}ひゃく ${o}じゅう ${t}`, `${t}ひゃく ${h}じゅう ${o}`, `${h}じゅう ${t}`), hint: "百、十、一のくらい。" };
        }
        case 'MATH_G2_U09': {
            const a = (n % 4) + 2;
            const b = (n % 5) + 2;
            if (n % 2 === 0) return { question: `${a} が ${b}こ。 かけ算の 式は？`, answer: `${a} × ${b}`, options: d(`${a} × ${b}`, `${a} + ${b}`, `${b} - ${a}`, `${b} × ${a} + 1`), hint: "おなじ数の くりかえしは かけ算。" };
            const repeatedAdd = Array.from({ length: b }, () => `${a}`).join(' + ');
            return { question: `${repeatedAdd} を かけ算の 式にすると？`, answer: `${a} × ${b}`, options: d(`${a} × ${b}`, `${b} × ${a}`, `${a} + ${b}`, `${a} × ${b - 1}`), hint: "たしざんを かけざんに。" };
        }
        case 'MATH_G2_U10': {
            const a = (n % 9) + 1;
            const b = (Math.floor(n / 9) % 9) + 1;
            const p = a * b;
            if (n % 3 === 0) return { question: `九九。 ${a} × ${b} = ?`, answer: `${p}`, options: d(`${p}`, `${p + 1}`, `${p - 1}`, `${a + b}`), hint: "九九を おもいだそう。" };
            if (n % 3 === 1) return { question: `${p} に なる かけ算は？`, answer: `${a} × ${b}`, options: d(`${a} × ${b}`, `${a} + ${b}`, `${p} × 1`, `${a} × ${b + 1}`), hint: "しきを えらぼう。" };
            return { question: `${a} × □ = ${p}。 □ は？`, answer: `${b}`, options: d(`${b}`, `${a}`, `${p}`, `${b + 1}`), hint: "九九を つかって さがそう。" };
        }
        case 'MATH_G2_U11': {
            const p = n % 6;
            if (p === 0) {
                return { question: "この はこの 形で、たいらな 面は いくつ？", answer: "6つ", options: d("6つ", "4つ", "8つ", "12つ"), hint: "サイコロを おもいだそう。", visual: { kind: 'cube' } };
            }
            if (p === 1) {
                return { question: "この はこの 形で、かど（頂点）は いくつ？", answer: "8つ", options: d("8つ", "6つ", "4つ", "12つ"), hint: "かどの 数を かぞえよう。", visual: { kind: 'cube' } };
            }
            if (p === 2) {
                return { question: "この はこの 形で、へんは なん本？", answer: "12本", options: d("12本", "8本", "6本", "10本"), hint: "ほねぐみ を かぞえよう。", visual: { kind: 'cube' } };
            }
            if (p === 3) {
                return { question: "1つの かどに あつまる へんは 何本？", answer: "3本", options: d("3本", "2本", "4本", "6本"), hint: "たて・よこ・高さ。", visual: { kind: 'cube' } };
            }
            if (p === 4) {
                return { question: "この はこの 形を ひらくと 面は いくつ？", answer: "6つ", options: d("6つ", "5つ", "7つ", "8つ"), hint: "組み立てても 面の数は同じ。", visual: { kind: 'cube' } };
            }
            return { question: "サイコロの 形と おなじ 立体は？", answer: "立方体", options: d("立方体", "球", "円柱", "三角柱"), hint: "ぜんぶ 正方形の面。", visual: { kind: 'cube' } };
        }
        case 'MATH_G2_U12': {
            const a = 20 + (n % 30);
            const b = (n % 9) + 1;
            if (n % 3 === 0) return { question: `えんぴつが ${a}本。 ${b}本 もらうと なん本？`, answer: `${a + b}本`, options: d(`${a + b}本`, `${a - b}本`, `${a}本`, `${b}本`), hint: "もらうは たし算。" };
            if (n % 3 === 1) return { question: `クッキーが ${a}こ。 ${b}こ たべると のこりは？`, answer: `${a - b}こ`, options: d(`${a - b}こ`, `${a + b}こ`, `${a}こ`, `${b}こ`), hint: "たべると ひき算。" };
            return { question: `はこに ${a}こ あります。 ${b}こ ふやすと ぜんぶで？`, answer: `${a + b}こ`, options: d(`${a + b}こ`, `${a - b}こ`, `${b}こ`, `${a}こ`), hint: "ぶんしょうを しきにしよう。" };
        }
        default:
            return { question: "2 + 2 = ?", answer: "4", options: d("4", "3", "5", "2"), hint: "たし算だよ。" };
    }
};

fillGeneratedUnitProblems(MATH_G2_UNIT_DATA, makeUnitProblem);

export const MATH_G2_DATA: Record<string, GeneralProblem[]> = {
    MATH_G2_1,
    MATH_G2_2,
    MATH_G2_3,
    ...MATH_G2_UNIT_DATA,
};
