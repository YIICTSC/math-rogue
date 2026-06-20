
import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

const MATH_G3_1: GeneralProblem[] = [
        { question: "「12 ÷ 3 ＝ 」 答えは なに？", answer: "4", options: d("4", "3", "5", "6"), hint: "3 × □ ＝ 12 を かんがえよう。" },
        { question: "12この リンゴを 3人に 同じ数ずつ 分けると、1人分は 何こ？", answer: "4個", options: d("4個", "3個", "5個", "15個"), hint: "わり算の もんだいだよ。" },
        { question: "「0 ÷ 5 ＝ 」 答えは なに？", answer: "0", options: d("0", "5", "1", "なし"), hint: "0を 何人で 分けても 0だね。" },
        { question: "ひっ算 「23 × 3」 の 答えは？", answer: "69", options: d("69", "66", "26", "59"), hint: "3×3 と 20×3 を あわせよう。" },
        { question: "「万（まん）」の 10倍の たんいは 何？", answer: "十万（じゅうまん）", options: d("十万", "百万", "千万", "億"), hint: "一つずつ くらいが 上がるよ。" },
        { question: "「2300 ＋ 4500 ＝ 」 答えは？", answer: "6800", options: d("6800", "6500", "2345", "6700"), hint: "大きな 数の たし算。" },
        { question: "時間の たんい。1分は 何秒？", answer: "60秒", options: d("60秒", "100秒", "10秒", "24秒"), hint: "とけいの びょうの はりが 1しゅう する 時間。" },
        { question: "「2分10秒」 は 何秒？", answer: "130秒", options: d("130秒", "120秒", "30秒", "210秒"), hint: "60 × 2 ＋ 10。" },
        { question: "長さの たんい。1km（キロメートル） は 何m？", answer: "1000m", options: d("1000m", "100m", "10m", "10000m"), hint: "「k（キロ）」は 1000倍 という いみ。" },
        { question: "「300m ＋ 800m ＝ 」 答えを km と m で いうと？", answer: "1km 100m", options: d("1km 100m", "1100m", "1km", "2km"), hint: "1000m を こえると km に なるよ。" },
        { question: "円の 中心から、まわりまでの 直線の なまえは？", answer: "半径（はんけい）", options: d("半径", "直径", "円周", "中心線"), hint: "ちょっけい の 半分の ながさだよ。" },
        { question: "円の 「直径（ちょっけい）」は、半径の 何倍？", answer: "2倍", options: d("2倍", "3倍", "1倍", "半分"), hint: "中心を 通る 一番 長い 線。" },
        { question: "10000 を 10こ あつめた 数は？", answer: "十万（100000）", options: d("十万", "一万", "百万", "一億"), hint: "0が 5個 ならぶよ。" },
        { question: "わり算。 わる数よりも、あまりは 必ず どうなる？", answer: "小さくなる", options: d("小さくなる", "大きくなる", "同じになる", "関係ない"), hint: "あまりが わる数 より 大きかったら、まだ 分けられるよね。" },
        { question: "コンパスは 何を かくときに つかう？", answer: "円", options: d("円", "正方形", "三角形", "直線"), hint: "はんけい を きめて くるっと 回すよ。" },
        { question: "「15 ÷ 5 = 」 答えは？", answer: "3", options: d("3", "5", "10", "20"), hint: "5のだんの 九九。" },
        { question: "「18 ÷ 2 = 」 答えは？", answer: "9", options: d("9", "8", "7", "6"), hint: "2 × 9 は？" },
        { question: "「30 ÷ 6 = 」 答えは？", answer: "5", options: d("5", "4", "6", "7"), hint: "6 × □ = 30。" },
        { question: "「28 ÷ 4 = 」 答えは？", answer: "7", options: d("7", "6", "8", "9"), hint: "4のだんの 九九。" },
        { question: "「45 ÷ 9 = 」 答えは？", answer: "5", options: d("5", "6", "4", "9"), hint: "9 × □ = 45。" },
        { question: "32枚の色紙を 4人で 同じ数ずつ 分けると 1人分は何枚？", answer: "8枚", options: d("8枚", "7枚", "9枚", "4枚"), hint: "32 ÷ 4 = ?" },
        { question: "40人の クラスを 5つの グループに 分けると 1チーム何人？", answer: "8人", options: d("8人", "5人", "10人", "7人"), hint: "40 ÷ 5 = ?" },
        { question: "「10 ÷ 1 = 」 答えは？", answer: "10", options: d("10", "1", "0", "11"), hint: "1人で 分けると そのまま。" },
        { question: "「5 ÷ 5 = 」 答えは？", answer: "1", options: d("1", "5", "0", "25"), hint: "自分と同じ数で 割ると？" },
        { question: "一億（いちおく）は 一万（いちまん）の 何倍？", answer: "10000倍", options: d("10000倍", "100倍", "1000倍", "10倍"), hint: "万が 万こで 億。" },
        { question: "「530000」 の 読み方は？", answer: "五十三万", options: d("五十三万", "五万三千", "五百三十", "五億三千"), hint: "4けたずつ 区切る。" },
        { question: "「一千万」 を 数字で 書くと？", answer: "10000000", options: d("10000000", "1000000", "100000", "10000"), hint: "0は 7個。" },
        { question: "「121 × 4 = 」 答えは？", answer: "484", options: d("484", "444", "848", "424"), hint: "ひっ算で 計算。" },
        { question: "「203 × 3 = 」 答えは？", answer: "609", options: d("609", "690", "633", "233"), hint: "0の 位に 注意。" },
        { question: "「312 × 2 = 」 答えは？", answer: "624", options: d("624", "612", "314", "600"), hint: "それぞれの くらいを 2倍に。" },
        { question: "「500 × 4 = 」 答えは？", answer: "2000", options: d("2000", "504", "900", "200"), hint: "5×4の あとに 00。" },
        { question: "「80 × 5 = 」 答えは？", answer: "400", options: d("400", "40", "4000", "85"), hint: "8×5は 40。" },
        { question: "1時間は 何分？", answer: "60分", options: d("60分", "100分", "24分", "12分"), hint: "とけいの 長い はりが 一しゅう。" },
        { question: "「100秒」 を 分と秒で いうと？", answer: "1分40秒", options: d("1分40秒", "1分0秒", "1分60秒", "2分0秒"), hint: "60秒で 1分。" },
        { question: "「80分」 を 時間と分で いうと？", answer: "1時間20分", options: d("1時間20分", "1時間0分", "2時間0分", "1時間40分"), hint: "60分で 1時間。" },
        { question: "「3km」 は 何m？", answer: "3000m", options: d("3000m", "300m", "30m", "30000m"), hint: "1km = 1000m。" },
        { question: "「4500m」 を kmとmで いうと？", answer: "4km 500m", options: d("4km 500m", "45km", "450km", "40km 5m"), hint: "千の 位が km。" },
        { question: "円の 直径が 10cmのとき、半径は 何cm？", answer: "5cm", options: d("5cm", "20cm", "10cm", "2cm"), hint: "直径の 半分。" },
        { question: "円の 半径が 3cmのとき、直径は 何cm？", answer: "6cm", options: d("6cm", "3cm", "9cm", "12cm"), hint: "半径の 2倍。" },
        { question: "コンパスの 針（はり）を さす 場所の なまえは？", answer: "中心", options: d("中心", "端", "半径", "円周"), hint: "ここから きょりが 同じ 点を うつ。" },
        { question: "「48 ÷ 8 = 」 答えは？", answer: "6", options: d("6", "7", "8", "5"), hint: "8×6=48。" },
        { question: "「56 ÷ 7 = 」 答えは？", answer: "8", options: d("8", "7", "9", "6"), hint: "7×8=56。" },
        { question: "「63 ÷ 9 = 」 答えは？", answer: "7", options: d("7", "6", "8", "9"), hint: "9×7=63。" },
        { question: "「72 ÷ 8 = 」 答えは？", answer: "9", options: d("9", "8", "7", "6"), hint: "8×9=72。" },
        { question: "「0 × 123 = 」 答えは？", answer: "0", options: d("0", "123", "1", "なし"), hint: "0に 何を かけても？" },
        { question: "「10000 - 1 = 」 答えは？", answer: "9999", options: d("9999", "999", "1000", "0"), hint: "大きな 数の ひき算。" },
        { question: "「1分30秒 + 40秒 = 」 答えは？", answer: "2分10秒", options: d("2分10秒", "1分70秒", "2分0秒", "1分10秒"), hint: "60秒で くりあがり。" },
        { question: "「3km - 500m = 」 答えは？", answer: "2km 500m", options: d("2km 500m", "2km", "3km 500m", "2500m"), hint: "3000m - 500m。" },
        { question: "「130 × 3 = 」 答えは？", answer: "390", options: d("390", "360", "133", "300"), hint: "あんざんで できるかな？" },
        { question: "「210 ÷ 7 = 」 答えは？", answer: "30", options: d("30", "3", "300", "21"), hint: "21 ÷ 7 を かんがえて。" }
    ];

const MATH_G3_2: GeneralProblem[] = [
        { question: "「24 × 30」 の 答えは？", answer: "720", options: d("720", "72", "240", "600"), hint: "24 × 3 の あとに 0 を つけよう。" },
        { question: "小数（しょうすう）の問題。 0.1 を 10こ あつめると？", answer: "1", options: d("1", "0.10", "10", "0"), hint: "1を 10等分（とうぶん）したのが 0.1だよ。" },
        { question: "「0.3 ＋ 0.5 ＝ 」 答えは？", answer: "0.8", options: d("0.8", "8", "0.08", "3.5"), hint: "小数の たし算。" },
        { question: "「1 － 0.2 ＝ 」 答えは？", answer: "0.8", options: d("0.8", "1.2", "0.2", "0.9"), hint: "10個の中から 2個 取ると？" },
        { question: "重さの たんい. 1kg（キログラム）は 何g？", answer: "1000g", options: d("1000g", "100g", "10g", "10000g"), hint: "キロは 1000倍だよ。" },
        { question: "1t（トン） は 何kg？", answer: "1000kg", options: d("1000kg", "100kg", "10000kg", "1kg"), hint: "ゾウや トラックの 重さを 表す たんい。" },
        { question: "「400g ＋ 700g ＝ 」 答えを kg と g で いうと？", answer: "1kg 100g", options: d("1kg 100g", "1100g", "1kg", "2kg"), hint: "1000g で 1kg に なるよ。" },
        { question: "三角形. 3つの 辺の ながさが すべて 同じなのを 何という？", answer: "正三角形（せいさんかくけい）", options: d("正三角形", "二等辺三角形", "直角三角形", "不等辺三角形"), hint: "「正（せい）」は 整っているという いみ。" },
        { question: "三角形. 2つの 辺の ながさが 同じなのを 何という？", answer: "二等辺三角形（にとうへんさんかくけい）", options: d("二等辺三角形", "正三角形", "直角三角形", "台形"), hint: "「二」つの 「等」しい 「辺」。" },
        { question: "円の中に、一番 長い 直線を 引くと、それは 必ず どこを 通る？", answer: "中心", options: d("中心", "端っこ", "どこでもいい", "通らない"), hint: "その直線を 「直径（ちょっけい）」というよ。" },
        { question: "「360 × 2 ＝ 」 あんざんで 答えは？", answer: "720", options: d("720", "620", "362", "700"), hint: "36 × 2 は？" },
        { question: "分数（ぶんすう）. 1 を 3つに 分けた うちの 1つを 何という？", answer: "3分の1 (1/3)", options: d("3分の1", "1分の3", "2分の1", "4分の1"), hint: "下が 分けた 数、上が もらった 数。" },
        { question: "「1/4 ＋ 2/4 ＝ 」 答えは？", answer: "3/4", options: d("3/4", "3/8", "1/4", "1"), hint: "分母（下）はそのままで、分子（上）を 足そう。" },
        { question: "「1 － 1/3 ＝ 」 答えは？", answer: "2/3", options: d("2/3", "1/3", "0", "1"), hint: "1 は 3/3 と 同じだよ。" },
        { question: "「あまり」の ある わり算. 「17 ÷ 3 ＝ 」 答えは？", answer: "5 あまり 2", options: d("5 あまり 2", "5 あまり 1", "6 あまり 1", "4 あまり 5"), hint: "3 × 5 ＝ 15. のこりは？" },
        { question: "「20 ÷ 4 ＝ 5」 の 計算を たしかめる かけ算の 式は？", answer: "5 × 4 ＝ 20", options: d("5 × 4 ＝ 20", "20 × 4", "20 ＋ 4", "5 － 4"), hint: "ぎゃくから かんがえよう。" },
        { question: "「25 ÷ 4 = 」 答えは？", answer: "6 あまり 1", options: d("6 あまり 1", "6 あまり 2", "5 あまり 1", "7 あまり 1"), hint: "4×6=24。" },
        { question: "「38 ÷ 5 = 」 答えは？", answer: "7 あまり 3", options: d("7 あまり 3", "7 あまり 2", "8 あまり 3", "6 あまり 3"), hint: "5×7=35。" },
        { question: "「44 ÷ 6 = 」 答えは？", answer: "7 あまり 2", options: d("7 あまり 2", "6 あまり 8", "7 あまり 4", "8 あまり 2"), hint: "6×7=42。" },
        { question: "「50 ÷ 7 = 」 答えは？", answer: "7 あまり 1", options: d("7 あまり 1", "8 あまり 1", "6 あまり 8", "7 あまり 0"), hint: "7×7=49。" },
        { question: "「13 × 20 = 」 答えは？", answer: "260", options: d("260", "26", "130", "300"), hint: "13×2の あとに 0。" },
        { question: "「1.2 + 0.9 = 」 答えは？", answer: "2.1", options: d("2.1", "1.1", "2.0", "3.1"), hint: "小数の たし算。" },
        { question: "「3.5 - 0.7 = 」 答えは？", answer: "2.8", options: d("2.8", "3.2", "2.2", "3.0"), hint: "小数の ひき算。" },
        { question: "「0.1」 が 15個 あると？", answer: "1.5", options: d("1.5", "15", "0.15", "1.05"), hint: "10個で 1に なる。" },
        { question: "「2.4」 は 0.1 が 何個分？", answer: "24個", options: d("24個", "2個", "4個", "240個"), hint: "2と 0.4。" },
        { question: "「5000g」 は 何kg？", answer: "5kg", options: d("5kg", "50kg", "500kg", "0.5kg"), hint: "1000g = 1kg。" },
        { question: "「2t 500kg」 は 何kg？", answer: "2500kg", options: d("2500kg", "250kg", "700kg", "2000kg"), hint: "1t = 1000kg。" },
        { question: "「800g + 600g = 」 答えを kg と g で いうと？", answer: "1kg 400g", options: d("1kg 400g", "1400g", "1kg", "2kg"), hint: "1000g を こえると kg。" },
        { question: "「2kg - 300g = 」 答えは？", answer: "1700g", options: d("1700g", "1kg 700g", "2300g", "1300g"), hint: "2000 - 300。" },
        { question: "球（たま）を どこで 切っても、切り口は どんな 形？", answer: "円", options: d("円", "正方形", "長方形", "楕円"), hint: "ボールの かたち。" },
        { question: "球の 真ん中を 通る 一番 長い 直線を 何という？", answer: "直径（ちょっけい）", options: d("直径", "半径", "中心線", "円周"), hint: "球でも 直径 というよ。" },
        { question: "球の 直径は 半径の 何倍？", answer: "2倍", options: d("2倍", "3倍", "4倍", "半分"), hint: "中心を はさむから。" },
        { question: "「21 × 14 = 」 答えは？", answer: "294", options: d("294", "210", "84", "304"), hint: "2けたの かけ算。" },
        { question: "「32 × 12 = 」 答えは？", answer: "384", options: d("384", "320", "64", "400"), hint: "ひっ算で 計算。" },
        { question: "「11 × 11 = 」 答えは？", answer: "121", options: d("121", "22", "111", "122"), hint: "ぞろめの かけ算。" },
        { question: "「40 × 50 = 」 答えは？", answer: "2000", options: d("2000", "200", "90", "20000"), hint: "4×5は 20。" },
        { question: "「あまり」の ある わり算で、あまりは 「わる数」より？", answer: "必ず 小さくなる", options: d("必ず 小さくなる", "大きくなる", "同じになる", "自由"), hint: "割り切れない 残りの こと。" },
        { question: "「26 ÷ 3 = 」 答えは？", answer: "8 あまり 2", options: d("8 あまり 2", "7 あまり 5", "9 あまり 1", "8 あまり 1"), hint: "3×8=24。" },
        { question: "「33 ÷ 4 = 」 答えは？", answer: "8 あまり 1", options: d("8 あまり 1", "7 あまり 5", "8 あまり 2", "9 あまり 1"), hint: "4×8=32。" },
        { question: "「47 ÷ 6 = 」 答えは？", answer: "7 あまり 5", options: d("7 あまり 5", "8 あまり 1", "7 あまり 1", "6 あまり 11"), hint: "6×7=42。" },
        { question: "「58 ÷ 9 = 」 答えは？", answer: "6 あまり 4", options: d("6 あまり 4", "7 あまり 1", "6 あまり 5", "5 あまり 13"), hint: "9×6=54。" },
        { question: "「2/5 + 1/5 = 」 答えは？", answer: "3/5", options: d("3/5", "3/10", "1/5", "1"), hint: "上を たす。" },
        { question: "「4/7 - 2/7 = 」 答えは？", answer: "2/7", options: d("2/7", "2/0", "6/7", "1/7"), hint: "上を ひく。" },
        { question: "「1 - 3/4 = 」 答えは？", answer: "1/4", options: d("1/4", "3/4", "0", "1"), hint: "1は 4/4。" },
        { question: "「10 - 2.5 = 」 答えは？", answer: "7.5", options: d("7.5", "8.5", "7.0", "8.0"), hint: "小数の ひき算。" },
        { question: "「0.5 + 0.5 = 」 答えは？", answer: "1", options: d("1", "0.10", "0.1", "1.1"), hint: "半分と 半分。" },
        { question: "「15 × 3 = 」 答えは？", answer: "45", options: d("45", "30", "18", "60"), hint: "15×2は 30。" },
        { question: "「12 × 5 = 」 答えは？", answer: "60", options: d("60", "50", "17", "70"), hint: "とけいの 数字を おもいだして。" },
        { question: "「25 × 4 = 」 答えは？", answer: "100", options: d("100", "80", "29", "125"), hint: "よく出る 組み合わせ。" },
        { question: "「100 ÷ 4 = 」 答えは？", answer: "25", options: d("25", "20", "50", "30"), hint: "100の 半分、の 半分。" }
    ];

const MATH_G3_3: GeneralProblem[] = [
        { question: "「48 ÷ 4 ＝ 」 あんざんで 答えは？", answer: "12", options: d("12", "10", "11", "14"), hint: "40÷4 と 8÷4 に 分けよう。" },
        { question: "「630 ÷ 3 ＝ 」 答えは？", answer: "210", options: d("210", "21", "230", "310"), hint: "63 ÷ 3 は？" },
        { question: "一億（いちおく）は、一万（いちまん）を 何こ あつめた 数？", answer: "10000こ", options: d("10000こ", "100こ", "1000こ", "10こ"), hint: "万が 万こで 億に なるよ。" },
        { question: "「1.2 ＋ 0.8 ＝ 」 答えは？", answer: "2", options: d("2", "1.10", "2.0", "1.28"), hint: "くりあがり が あるよ。" },
        { question: "分数. 「4/5」 と 「3/5」、どっちが 大きい？", answer: "4/5", options: d("4/5", "3/5", "同じ", "比べられない"), hint: "分子（上）の 数を くらべよう。" },
        { question: "「1km」 を 「m」 に なおすと？", answer: "1000m", options: d("1000m", "100m", "10000m", "10m"), hint: "何度も 出てきたね。大事な たんい。" },
        { question: "正三角形の 1つの 角の 大きさは 何度？", answer: "60度", options: d("60度", "90度", "45度", "30度"), hint: "全部で 180度. それを 3で 割ると？" },
        { question: "2つの 二等辺三角形を あわせると、どんな 形に なる？", answer: "ひし形 や 長方形 など", options: d("ひし形 など", "正三角形", "円", "台形"), hint: "あわせ方によるね。" },
        { question: "「560000」 の 読み方は？", answer: "五十六万", options: d("五十六万", "五万六千", "五百六十", "五億六千万"), hint: "4けたずつ 区切って 読もう。" },
        { question: "「3 × 400 ＝ 」 答えは？", answer: "1200", options: d("1200", "120", "12000", "700"), hint: "3 × 4 は 12. そのあとに 00。" },
        { question: "計算の きまり. 「( )」 が あるときは どこから 計算する？", answer: "( ) の 中から", options: d("( ) の 中", "左から", "右から", "かけ算から"), hint: "カッコを さきに 計算するのが ルールだよ。" },
        { question: "「100 － (30 ＋ 20) ＝ 」 答えは？", answer: "50", options: d("50", "90", "70", "150"), hint: "カッコの 中は 50。" },
        { question: "そろばん. 「1」の 玉が 4つ、上の 「5」の 玉が 1つ. いくつ？", answer: "9", options: d("9", "5", "4", "1"), hint: "全部 あわせよう。" },
        { question: "ぼうグラフで、一番 長い ぼうは 何を 表している？", answer: "一番 数が 多いもの", options: d("数が多い", "数が少ない", "平均", "合計"), hint: "パッと 見て わかりやすいね。" },
        { question: "「あまり」 が 0 の わり算の ことを 何という？", answer: "わりきれる", options: d("わりきれる", "わりきれない", "わりすぎ", "わりあて"), hint: "ぴったり 分けられた じょうたい。" },
        { question: "「1/3 + 1/3 = 」 答えは？", answer: "2/3", options: d("2/3", "2/6", "1/3", "1"), hint: "分母は そのまま。" },
        { question: "「1 - 2/5 = 」 答えは？", answer: "3/5", options: d("3/5", "2/5", "1/5", "1"), hint: "1 = 5/5。" },
        { question: "「5/8」 と 「7/8」、小さいのは どっち？", answer: "5/8", options: d("5/8", "7/8", "同じ", "比べられない"), hint: "分子を くらべる。" },
        { question: "「2/2」 は 整数で 書くと いくつ？", answer: "1", options: d("1", "2", "0", "22"), hint: "全部 ある じょうたい。" },
        { question: "二等辺三角形の、ながさが 同じ 辺は いくつ？", answer: "2つ", options: d("2つ", "3つ", "1つ", "全部"), hint: "なまえに ヒントが ある。" },
        { question: "正三角形の 辺の 数は いくつ？", answer: "3つ", options: d("3つ", "2つ", "4つ", "0つ"), hint: "三角形だもんね。" },
        { question: "三角形の 3つの 角の 和は 何度？", answer: "180度", options: d("180度", "360度", "90度", "100度"), hint: "きまった 数字だよ。" },
        { question: "「180度 - 60度 - 60度 = 」 答えは？", answer: "60度", options: d("60度", "90度", "30度", "0度"), hint: "正三角形の 角。" },
        { question: "「180度 - 90度 - 45度 = 」 答えは？", answer: "45度", options: d("45度", "90度", "30度", "60度"), hint: "直角（ちょっかく）二等辺三角形。" },
        { question: "そろばんの 「5の玉」 は いくつ分？", answer: "5", options: d("5", "1", "10", "50"), hint: "上に ある 玉。" },
        { question: "そろばんの 「1の玉」 は いくつ分？", answer: "1", options: d("1", "5", "10", "0"), hint: "下に ある 4つの 玉。" },
        { question: "ぼうグラフの 「1めもり」 が 5のとき、3めもり分は？", answer: "15", options: d("15", "3", "5", "10"), hint: "5×3。" },
        { question: "表に まとめるとき、正の字 「正」 は 何を 表す？", answer: "5", options: d("5", "1", "10", "正解"), hint: "かくすう を 数えて。" },
        { question: "「24 × 5 = 」 あんざんで 答えは？", answer: "120", options: d("120", "100", "70", "245"), hint: "24×10 の 半分。" },
        { question: "「16 × 4 = 」 答えは？", answer: "64", options: d("64", "40", "20", "164"), hint: "16×2 の 2倍。" },
        { question: "「99 × 2 = 」 答えは？", answer: "198", options: d("198", "200", "188", "992"), hint: "100×2 より 2 小さい。" },
        { question: "「80 ÷ 4 = 」 答えは？", answer: "20", options: d("20", "2", "200", "84"), hint: "8÷4 は 2。" },
        { question: "「150 ÷ 5 = 」 答えは？", answer: "30", options: d("30", "3", "300", "15"), hint: "15÷5 を かんがえて。" },
        { question: "「400 ÷ 2 = 」 答えは？", answer: "200", options: d("200", "20", "2", "402"), hint: "半分に する。" },
        { question: "「(2 + 3) × 4 = 」 答えは？", answer: "20", options: d("20", "14", "10", "234"), hint: "カッコから 計算。" },
        { question: "「10 - 2 × 3 = 」 答えは？", answer: "4", options: d("4", "24", "8", "6"), hint: "かけ算が さき。" },
        { question: "「30 + 10 ÷ 2 = 」 答えは？", answer: "35", options: d("35", "20", "40", "15"), hint: "わり算が さき。" },
        { question: "一億の 1つ 下の くらいは？", answer: "千万", options: d("千万", "百万", "十万", "一万"), hint: "千、万、億。" },
        { question: "「45000000」 の 読み方は？", answer: "四千五百万", options: d("四千五百万", "四億五千万", "四百五十万", "四千五百"), hint: "0の 数を 数える。" },
        { question: "「0.1 + 0.1 + 0.1 = 」 答えは？", answer: "0.3", options: d("0.3", "3", "0.111", "0.03"), hint: "0.1 が 3つ。" },
        { question: "「1.5 - 0.5 = 」 答えは？", answer: "1", options: d("1", "0.5", "1.0", "1.1"), hint: "半分 ひく。" },
        { question: "1kg は 何g？", answer: "1000g", options: d("1000g", "100g", "10g", "1g"), hint: "大事な たんい。" },
        { question: "「500g」 は 1kgの 何分の一？", answer: "2分の一", options: d("2分の一", "4分の一", "10分の一", "1分の一"), hint: "半分だね。" },
        { question: "「250g」 は 1kgの 何分の一？", answer: "4分の一", options: d("4分の一", "2分の一", "8分の一", "5分の一"), hint: "半分の 半分。" },
        { question: "「1/10」 を 小数で 書くと？", answer: "0.1", options: d("0.1", "1.1", "0.01", "10"), hint: "10等分。" },
        { question: "「0.7」 を 分数で 書くと？", answer: "7/10", options: d("7/10", "1/7", "7/1", "0/7"), hint: "0.1 が 7つ。" },
        { question: "「36 ÷ 3 = 」 あんざんで？", answer: "12", options: d("12", "10", "33", "36"), hint: "30÷3 と 6÷3。" },
        { question: "「84 ÷ 4 = 」 答えは？", answer: "21", options: d("21", "20", "80", "4"), hint: "80÷4 と 4÷4。" },
        { question: "「66 ÷ 6 = 」 答えは？", answer: "11", options: d("11", "6", "60", "10"), hint: "10倍と 1倍。" },
        { question: "「□ ＋ 5 ＝ 12」 □ は いくつ？", answer: "7", options: d("7", "17", "5", "60"), hint: "12 － 5 ＝ ?" },
        { question: "「□ × 4 ＝ 32」 □ は いくつ？", answer: "8", options: d("8", "36", "28", "128"), hint: "32 ÷ 4 ＝ ?" },
    ];

const splitIntoUnitsByCounts = (problems: GeneralProblem[], counts: number[]): GeneralProblem[][] => {
    const totalWeight = counts.reduce((sum, c) => sum + c, 0);
    const totalProblems = problems.length;
    const targetSizes = counts.map((count) => Math.floor((totalProblems * count) / totalWeight));
    let rest = totalProblems - targetSizes.reduce((sum, n) => sum + n, 0);
    let idx = 0;
    while (rest > 0) {
        targetSizes[idx % targetSizes.length] += 1;
        rest -= 1;
        idx += 1;
    }

    const units: GeneralProblem[][] = [];
    let start = 0;
    targetSizes.forEach((size) => {
        units.push(problems.slice(start, start + size));
        start += size;
    });
    return units;
};

const g3Term1Units = splitIntoUnitsByCounts(MATH_G3_1, [1, 1, 1, 1, 1]);
const g3Term2Units = splitIntoUnitsByCounts(MATH_G3_2, [1, 1, 1, 1, 1]);
const g3Term3Units = splitIntoUnitsByCounts(MATH_G3_3, [1, 1, 1, 1]);

export const MATH_G3_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G3_U01: [
        { question: "ぼうグラフで、ねこ12ひき、いぬ8ひき。ねこは何ひき多い？", answer: "4ひき", options: d("4ひき", "8ひき", "12ひき", "20ひき"), hint: "12と8の差。" },
        { question: "表で、月曜15こ、火曜21こ。あわせて何こ？", answer: "36こ", options: d("36こ", "6こ", "26こ", "315こ"), hint: "15+21。" },
        { question: "ぼうグラフで、A18、B18。くらべると？", answer: "同じ", options: d("同じ", "Aが多い", "Bが多い", "差は18"), hint: "同じ高さ。" },
        { question: "表で、赤9、青14、黄7。いちばん多いのは？", answer: "青", options: d("青", "赤", "黄", "同じ"), hint: "14が最大。" },
        { question: "表で、赤9、青14、黄7。いちばん少ないのは？", answer: "黄", options: d("黄", "赤", "青", "同じ"), hint: "7が最小。" },
        { question: "1めもりが5のぼうグラフで、4めもりは？", answer: "20", options: d("20", "9", "15", "25"), hint: "5×4。" },
        { question: "1めもりが10のぼうグラフで、7めもりは？", answer: "70", options: d("70", "17", "700", "60"), hint: "10×7。" },
        { question: "表で、3日間の数が 18、22、20。合計は？", answer: "60", options: d("60", "50", "58", "66"), hint: "18+22+20。" },
        { question: "表で、1組32人、2組29人。1組は何人多い？", answer: "3人", options: d("3人", "29人", "32人", "61人"), hint: "32-29。" },
        { question: "ぼうグラフで数を読み取るとき、まず見るものは？", answer: "めもり", options: d("めもり", "色だけ", "題名だけ", "紙の大きさ"), hint: "1めもりがいくつか。" },
        { question: "表で「正」の字が3つあります。数はいくつ？", answer: "15", options: d("15", "3", "5", "8"), hint: "正は5を表す。" },
        { question: "表で「正正」と記録したら、数はいくつ？", answer: "10", options: d("10", "12", "7", "15"), hint: "正で5として数える。" },
        { question: "ぼうグラフで、ぼうが長いほど何が多い？", answer: "数", options: d("数", "名前", "色", "時間"), hint: "長さが数を表す。" },
        { question: "表で、A25、B19、C6。AとCの差は？", answer: "19", options: d("19", "31", "25", "6"), hint: "25-6。" },
        { question: "表で、A25、B19、C6。BとCの合計は？", answer: "25", options: d("25", "19", "31", "13"), hint: "19+6。" },
        { question: "ぼうグラフで、0の項目のぼうはどうなる？", answer: "出ない", options: d("出ない", "一番長い", "半分だけ", "必ず1めもり"), hint: "0は高さがない。" },
        { question: "表をグラフにするとよいことは？", answer: "多い少ないが見やすい", options: d("多い少ないが見やすい", "答えが変わる", "数が増える", "計算しなくなる"), hint: "見た目でくらべやすい。" },
        { question: "1めもりが2のグラフで、9めもりは？", answer: "18", options: d("18", "11", "16", "20"), hint: "2×9。" },
        { question: "1めもりが4のグラフで、6めもりは？", answer: "24", options: d("24", "10", "20", "28"), hint: "4×6。" },
        { question: "グラフの題名で分かることは？", answer: "何を表したグラフか", options: d("何を表したグラフか", "答えだけ", "次の問題", "紙の色"), hint: "題名は内容を表す。" },
    ], // 表 と グラフ
    MATH_G3_U02: [
        { question: "1000を3こ、100を4こ、10を2こ、1を6こ。数は？", answer: "3426", options: d("3426", "3246", "3462", "300426"), hint: "千・百・十・一の順。" },
        { question: "5080の千のくらいは？", answer: "5", options: d("5", "0", "8", "5080"), hint: "左から2つ目ではなく千の位。" },
        { question: "7204の十のくらいは？", answer: "0", options: d("0", "2", "4", "7"), hint: "十の位は0。" },
        { question: "六千三百二十を数字で書くと？", answer: "6320", options: d("6320", "6032", "632", "63020"), hint: "千、百、十、一。" },
        { question: "4000+500+60+7 は？", answer: "4567", options: d("4567", "40567", "4657", "4576"), hint: "位ごとに合わせる。" },
        { question: "9000+30+2 は？", answer: "9032", options: d("9032", "9320", "90032", "9302"), hint: "百の位は0。" },
        { question: "3480、3840、4380で一番大きいのは？", answer: "4380", options: d("4380", "3840", "3480", "3408"), hint: "千の位からくらべる。" },
        { question: "2050、2500、2005で一番小さいのは？", answer: "2005", options: d("2005", "2050", "2500", "5002"), hint: "千、百、十、一の順。" },
        { question: "9999の次の数は？", answer: "10000", options: d("10000", "9998", "99910", "1000"), hint: "一万になる。" },
        { question: "10000の1つ前は？", answer: "9999", options: d("9999", "10001", "9900", "9000"), hint: "一万の前。" },
        { question: "1000を10こ集めた数は？", answer: "10000", options: d("10000", "1000", "100000", "100"), hint: "千が10こで一万。" },
        { question: "25000は一万が何こ？", answer: "2こ", options: d("2こ", "5こ", "25こ", "250こ"), hint: "二万五千。" },
        { question: "36000は一万が3こと、千が何こ？", answer: "6こ", options: d("6こ", "3こ", "36こ", "0こ"), hint: "三万六千。" },
        { question: "12345を読むと？", answer: "一万二千三百四十五", options: d("一万二千三百四十五", "十二万三千四十五", "千二百三十四", "一億二千三百四十五"), hint: "一万の位がある。" },
        { question: "70000+8000+90 は？", answer: "78090", options: d("78090", "70890", "78900", "7809"), hint: "百と一の位は0。" },
        { question: "56000の1000の位の数字は？", answer: "6", options: d("6", "5", "0", "56"), hint: "千が6こ。" },
        { question: "10000より大きい数はどれ？", answer: "10001", options: d("10001", "9999", "10000", "9090"), hint: "一万をこえている。" },
        { question: "位取り表で、右へ1つ進むと位の大きさは？", answer: "10分の1になる", options: d("10分の1になる", "10倍になる", "同じ", "100倍になる"), hint: "千から百へ。" },
        { question: "位取り表で、左へ1つ進むと位の大きさは？", answer: "10倍になる", options: d("10倍になる", "10分の1になる", "同じ", "0になる"), hint: "百から千へ。" },
        { question: "大きい数をくらべるとき、まず見るのは？", answer: "左の大きい位", options: d("左の大きい位", "一の位だけ", "数字の色", "読みやすさ"), hint: "大きい位から。" },
    ], // 大きい 数（1000より大きい数）
    MATH_G3_U03: [
        { question: "428 + 315 = ?", answer: "743", options: d("743", "733", "843", "713"), hint: "位をそろえてたす。" },
        { question: "679 + 248 = ?", answer: "927", options: d("927", "917", "827", "1027"), hint: "くり上がりに注意。" },
        { question: "1234 + 2567 = ?", answer: "3801", options: d("3801", "3701", "3791", "3901"), hint: "一の位から。" },
        { question: "4086 + 1975 = ?", answer: "6061", options: d("6061", "5961", "6051", "7061"), hint: "0のある位に注意。" },
        { question: "3500 + 2480 = ?", answer: "5980", options: d("5980", "5080", "5880", "6980"), hint: "3500に2480をたす。" },
        { question: "999 + 1 = ?", answer: "1000", options: d("1000", "9991", "990", "100"), hint: "くり上がって1000。" },
        { question: "569 + 431 = ?", answer: "1000", options: d("1000", "990", "900", "1100"), hint: "569+400+31。" },
        { question: "2704 + 809 = ?", answer: "3513", options: d("3513", "3413", "3503", "4513"), hint: "809を位にそろえる。" },
        { question: "答えが756になる式は？", answer: "428 + 328", options: d("428 + 328", "428 + 238", "418 + 328", "756 + 1"), hint: "たして756。" },
        { question: "答えが5000になる式は？", answer: "3750 + 1250", options: d("3750 + 1250", "3750 + 1150", "3650 + 1250", "5000 + 0"), hint: "千・百の位を見る。" },
        { question: "一の位が 8+7 のたし算は、どうなる？", answer: "くり上がる", options: d("くり上がる", "くり上がらない", "答えは8", "答えは7"), hint: "8+7=15。" },
        { question: "十の位が 6+5+1 のとき、十の位に書く数字は？", answer: "2", options: d("2", "12", "1", "6"), hint: "12の2を書き、1くり上げる。" },
        { question: "307 + 58 で、58を書く位置は？", answer: "一の位をそろえる", options: d("一の位をそろえる", "左にそろえる", "百の位にそろえる", "どこでもよい"), hint: "位をそろえる。" },
        { question: "2345 + 0 = ?", answer: "2345", options: d("2345", "0", "23450", "2346"), hint: "0をたしても同じ。" },
        { question: "460 + 540 = ?", answer: "1000", options: d("1000", "900", "1100", "100"), hint: "46+54=100。" },
        { question: "1896 + 2104 = ?", answer: "4000", options: d("4000", "3900", "3990", "4100"), hint: "合わせてきりのよい数。" },
        { question: "たし算のたしかめで、順を入れかえても答えは？", answer: "同じ", options: d("同じ", "必ず大きくなる", "必ず小さくなる", "0になる"), hint: "交換しても和は同じ。" },
        { question: "3けたのたし算で大切なのは？", answer: "位をそろえる", options: d("位をそろえる", "左から適当に書く", "数字を消す", "色で分ける"), hint: "一、十、百。" },
        { question: "695 + 305 = ?", answer: "1000", options: d("1000", "900", "990", "1100"), hint: "695+300+5。" },
        { question: "123 + 456 + 321 = ?", answer: "900", options: d("900", "800", "890", "910"), hint: "3つの数をたす。" },
    ], // たし算（3けた・4けた）
    MATH_G3_U04: [
        { question: "742 - 315 = ?", answer: "427", options: d("427", "437", "327", "1057"), hint: "位をそろえてひく。" },
        { question: "900 - 456 = ?", answer: "444", options: d("444", "544", "454", "356"), hint: "くり下がりに注意。" },
        { question: "5000 - 2784 = ?", answer: "2216", options: d("2216", "2316", "2226", "3216"), hint: "0が続くひき算。" },
        { question: "4032 - 1987 = ?", answer: "2045", options: d("2045", "2145", "2055", "3045"), hint: "くり下がりを続ける。" },
        { question: "1000 - 1 = ?", answer: "999", options: d("999", "1001", "990", "900"), hint: "1000の1つ前。" },
        { question: "10000 - 1 = ?", answer: "9999", options: d("9999", "10001", "9990", "9000"), hint: "一万の前。" },
        { question: "802 - 349 = ?", answer: "453", options: d("453", "553", "463", "1151"), hint: "0の位から借りる。" },
        { question: "6300 - 2750 = ?", answer: "3550", options: d("3550", "3650", "3450", "9050"), hint: "百の位に注意。" },
        { question: "答えが286になる式は？", answer: "734 - 448", options: d("734 - 448", "734 - 438", "724 - 448", "286 + 1"), hint: "差が286。" },
        { question: "答えが4000になる式は？", answer: "7250 - 3250", options: d("7250 - 3250", "7250 - 3150", "7150 - 3250", "4000 - 0"), hint: "千と百の位を見る。" },
        { question: "上の一の位が0で、6をひくときは？", answer: "くり下がる", options: d("くり下がる", "そのまま0", "6を書く", "たす"), hint: "0から6はひけない。" },
        { question: "1004 - 7 で、くり下がりは？", answer: "ある", options: d("ある", "ない", "いつも0", "答えなし"), hint: "4から7はひけない。" },
        { question: "486 - 0 = ?", answer: "486", options: d("486", "0", "480", "487"), hint: "0をひいても同じ。" },
        { question: "ひき算のたしかめで使える式は？ 742-315=427", answer: "427 + 315", options: d("427 + 315", "427 - 315", "742 + 315", "315 - 427"), hint: "答えとひいた数をたす。" },
        { question: "700 - 299 = ?", answer: "401", options: d("401", "411", "399", "1001"), hint: "300をひいて1をたす考えも使える。" },
        { question: "4050 - 2050 = ?", answer: "2000", options: d("2000", "2100", "1000", "6100"), hint: "4050から2050。" },
        { question: "3000 - 1250 = ?", answer: "1750", options: d("1750", "1850", "1650", "4250"), hint: "3000から1250。" },
        { question: "ひき算で大切なのは？", answer: "位をそろえる", options: d("位をそろえる", "数字を左につめる", "大きい位だけ見る", "答えから書く"), hint: "一、十、百、千。" },
        { question: "1000から250を2回ひくと？", answer: "500", options: d("500", "750", "250", "1000"), hint: "1000-250-250。" },
        { question: "9000 - 4500 = ?", answer: "4500", options: d("4500", "5500", "3500", "13500"), hint: "半分になる。" },
    ], // ひき算（3けた・4けた）
    MATH_G3_U05: [
        { question: "2時40分の30分後は？", answer: "3時10分", options: d("3時10分", "2時70分", "3時", "2時10分"), hint: "60分で1時間。" },
        { question: "9時50分の20分後は？", answer: "10時10分", options: d("10時10分", "9時70分", "10時", "9時30分"), hint: "50+20=70分。" },
        { question: "4時15分から5時までは？", answer: "45分", options: d("45分", "15分", "1時間", "60分"), hint: "15分から60分まで。" },
        { question: "7時30分から9時までは？", answer: "1時間30分", options: d("1時間30分", "2時間", "30分", "9時間"), hint: "7時半から9時。" },
        { question: "午前8時から午後1時までは？", answer: "5時間", options: d("5時間", "4時間", "6時間", "9時間"), hint: "8,9,10,11,12,1。" },
        { question: "1時間20分は何分？", answer: "80分", options: d("80分", "120分", "60分", "20分"), hint: "60+20。" },
        { question: "90分は何時間何分？", answer: "1時間30分", options: d("1時間30分", "90時間", "9分", "2時間"), hint: "60分と30分。" },
        { question: "2時間15分は何分？", answer: "135分", options: d("135分", "215分", "120分", "75分"), hint: "120+15。" },
        { question: "150分は何時間何分？", answer: "2時間30分", options: d("2時間30分", "1時間50分", "3時間", "150時間"), hint: "120分と30分。" },
        { question: "3時25分の40分後は？", answer: "4時5分", options: d("4時5分", "3時65分", "4時25分", "3時5分"), hint: "25+40=65分。" },
        { question: "6時10分の50分後は？", answer: "7時", options: d("7時", "6時60分", "6時50分", "7時10分"), hint: "10+50=60分。" },
        { question: "10時5分の25分後は？", answer: "10時30分", options: d("10時30分", "10時20分", "11時", "10時5分"), hint: "5+25。" },
        { question: "12時から午後3時までは？", answer: "3時間", options: d("3時間", "2時間", "4時間", "15時間"), hint: "12から3。" },
        { question: "午後2時の4時間後は？", answer: "午後6時", options: d("午後6時", "午後5時", "午前6時", "午後4時"), hint: "2+4。" },
        { question: "午前11時の2時間後は？", answer: "午後1時", options: d("午後1時", "午前1時", "午後12時", "午前9時"), hint: "正午をまたぐ。" },
        { question: "時刻と時間で、「何時何分」はどちら？", answer: "時刻", options: d("時刻", "時間", "長さ", "重さ"), hint: "そのときの時。" },
        { question: "時刻と時間で、「何分間」はどちら？", answer: "時間", options: d("時間", "時刻", "長さ", "かさ"), hint: "かかった長さ。" },
        { question: "8時45分から9時15分までは？", answer: "30分", options: d("30分", "45分", "15分", "1時間"), hint: "9時まで15分、さらに15分。" },
        { question: "5時55分の10分後は？", answer: "6時5分", options: d("6時5分", "5時65分", "6時55分", "5時45分"), hint: "60分をこえる。" },
        { question: "時間の計算で、60分になったら？", answer: "1時間にする", options: d("1時間にする", "0にして終わり", "100分にする", "消す"), hint: "60分=1時間。" },
    ], // 時こく と 時かん
    MATH_G3_U06: [
        { question: "1kmは何m？", answer: "1000m", options: d("1000m", "100m", "10m", "1m"), hint: "kmとmの関係。" },
        { question: "3kmは何m？", answer: "3000m", options: d("3000m", "300m", "30m", "3m"), hint: "1000mが3つ。" },
        { question: "2km400mは何m？", answer: "2400m", options: d("2400m", "2040m", "2004m", "24m"), hint: "2000m+400m。" },
        { question: "5600mは何km何m？", answer: "5km600m", options: d("5km600m", "56km", "5km60m", "6km500m"), hint: "1000mごとにkm。" },
        { question: "1km200m + 800m = ?", answer: "2km", options: d("2km", "1km1000m", "1km800m", "2000km"), hint: "1200m+800m。" },
        { question: "3km - 500m = ?", answer: "2km500m", options: d("2km500m", "3km500m", "2500km", "2km"), hint: "3000m-500m。" },
        { question: "2km300m + 1km200m = ?", answer: "3km500m", options: d("3km500m", "3km300m", "2km500m", "3500km"), hint: "km同士、m同士。" },
        { question: "4km100m - 2km = ?", answer: "2km100m", options: d("2km100m", "2km", "4km99m", "6km100m"), hint: "4km100mから2km。" },
        { question: "900mと1km。長いのは？", answer: "1km", options: d("1km", "900m", "同じ", "くらべられない"), hint: "1km=1000m。" },
        { question: "1500mと1km400m。長いのは？", answer: "1500m", options: d("1500m", "1km400m", "同じ", "100m"), hint: "1km400m=1400m。" },
        { question: "2kmと2000m。くらべると？", answer: "同じ", options: d("同じ", "2kmが長い", "2000mが長い", "くらべられない"), hint: "2km=2000m。" },
        { question: "道のりを表すとき、学校から駅までのように長い距離に使いやすい単位は？", answer: "km", options: d("km", "mm", "g", "dL"), hint: "長い道のり。" },
        { question: "校庭の長さのような距離に使いやすい単位は？", answer: "m", options: d("m", "kg", "L", "円"), hint: "メートル。" },
        { question: "1km500mは何m？", answer: "1500m", options: d("1500m", "1050m", "1005m", "15m"), hint: "1000+500。" },
        { question: "7200mは何km何m？", answer: "7km200m", options: d("7km200m", "72km", "7km20m", "2km700m"), hint: "7000mと200m。" },
        { question: "3km500mから500m進むと、合わせて？", answer: "4km", options: d("4km", "3km", "3km1000m", "3500m"), hint: "3500m+500m。" },
        { question: "5kmから1km250mをひくと？", answer: "3km750m", options: d("3km750m", "4km750m", "3km250m", "6km250m"), hint: "5000m-1250m。" },
        { question: "kmとmを計算するとき大切なのは？", answer: "同じ単位にする", options: d("同じ単位にする", "色で分ける", "大きい方だけ見る", "小さい方を消す"), hint: "mにそろえると計算しやすい。" },
        { question: "1000mより200m長い道のりは？", answer: "1km200m", options: d("1km200m", "800m", "1km20m", "120km"), hint: "1000m+200m。" },
        { question: "2kmより300m短い道のりは？", answer: "1km700m", options: d("1km700m", "2km300m", "170m", "3km700m"), hint: "2000m-300m。" },
    ], // 長さ（km と m）
    MATH_G3_U07: [
        { question: "23 × 4 = ?", answer: "92", options: d("92", "82", "96", "27"), hint: "20×4と3×4。" },
        { question: "36 × 5 = ?", answer: "180", options: d("180", "150", "170", "41"), hint: "30×5と6×5。" },
        { question: "48 × 6 = ?", answer: "288", options: d("288", "248", "286", "54"), hint: "40×6と8×6。" },
        { question: "72 × 3 = ?", answer: "216", options: d("216", "206", "219", "75"), hint: "70×3と2×3。" },
        { question: "19 × 8 = ?", answer: "152", options: d("152", "142", "151", "27"), hint: "20×8から8をひく。" },
        { question: "25 × 4 = ?", answer: "100", options: d("100", "80", "90", "29"), hint: "25が4つ。" },
        { question: "32 × 7 = ?", answer: "224", options: d("224", "214", "227", "39"), hint: "30×7と2×7。" },
        { question: "56 × 4 = ?", answer: "224", options: d("224", "204", "226", "60"), hint: "50×4と6×4。" },
        { question: "68 × 5 = ?", answer: "340", options: d("340", "300", "330", "73"), hint: "60×5と8×5。" },
        { question: "84 × 2 = ?", answer: "168", options: d("168", "166", "148", "86"), hint: "2倍する。" },
        { question: "答えが144になる式は？", answer: "36 × 4", options: d("36 × 4", "34 × 4", "36 × 3", "144 + 0"), hint: "30×4と6×4。" },
        { question: "答えが270になる式は？", answer: "54 × 5", options: d("54 × 5", "45 × 5", "54 × 4", "270 × 1"), hint: "50×5と4×5。" },
        { question: "ひっ算で一の位が 7×6 のとき、一の位に書く数字は？", answer: "2", options: d("2", "42", "4", "6"), hint: "42の2を書く。" },
        { question: "ひっ算で 8×7=56 のとき、くり上がる数は？", answer: "5", options: d("5", "6", "56", "8"), hint: "6を書いて5くり上げ。" },
        { question: "40 × 6 = ?", answer: "240", options: d("240", "24", "46", "400"), hint: "4×6に0をつける。" },
        { question: "300 × 4 = ?", answer: "1200", options: d("1200", "3004", "120", "700"), hint: "3×4に00。" },
        { question: "12 × 8 と 8 × 12。答えは？", answer: "同じ", options: d("同じ", "12×8が大きい", "8×12が大きい", "どちらも0"), hint: "順を変えても積は同じ。" },
        { question: "15 × 6 = ?", answer: "90", options: d("90", "80", "96", "21"), hint: "10×6と5×6。" },
        { question: "99 × 3 = ?", answer: "297", options: d("297", "300", "287", "993"), hint: "100×3から3。" },
        { question: "2けた×1けたのひっ算で大切なのは？", answer: "位ごとにかける", options: d("位ごとにかける", "左だけかける", "答えを先に決める", "たし算に変える"), hint: "一の位、十の位。" },
    ], // かけ算（2けた×1けた など）
    MATH_G3_U08: [
        { question: "半径が4cmの円。直径は？", answer: "8cm", options: d("8cm", "4cm", "12cm", "16cm"), hint: "直径は半径の2倍。", visual: { kind: 'circle', showRadius: true, showDiameter: true } },
        { question: "直径が12cmの円。半径は？", answer: "6cm", options: d("6cm", "12cm", "24cm", "4cm"), hint: "半径は直径の半分。" },
        { question: "円の中心から円のまわりまでの長さを何という？", answer: "半径", options: d("半径", "直径", "辺", "角"), hint: "中心からまわりまで。" },
        { question: "円のまわりから中心を通って反対側までの長さは？", answer: "直径", options: d("直径", "半径", "辺", "面"), hint: "中心を通る。" },
        { question: "半径が7cmの円。直径は？", answer: "14cm", options: d("14cm", "7cm", "21cm", "49cm"), hint: "7×2。" },
        { question: "直径が20cmの円。半径は？", answer: "10cm", options: d("10cm", "20cm", "40cm", "5cm"), hint: "20の半分。" },
        { question: "コンパスで円をかくとき、はりをさすところは？", answer: "中心", options: d("中心", "直径", "角", "辺"), hint: "円のまんなか。" },
        { question: "コンパスの開きは、円の何を表す？", answer: "半径", options: d("半径", "直径", "角", "重さ"), hint: "中心からまわりまで。" },
        { question: "円の半径は、同じ円の中では？", answer: "どこも同じ長さ", options: d("どこも同じ長さ", "場所で変わる", "直径より長い", "0になる"), hint: "同じ円なら半径は同じ。" },
        { question: "円の直径は、半径の何倍？", answer: "2倍", options: d("2倍", "半分", "3倍", "同じ"), hint: "半径が2つ分。" },
        { question: "ボールのような形を何という？", answer: "球", options: d("球", "円", "三角形", "四角形"), hint: "立体の丸い形。" },
        { question: "紙にかいた丸い形は？", answer: "円", options: d("円", "球", "立方体", "直方体"), hint: "平面の形。" },
        { question: "球をまっすぐ切った切り口に出やすい形は？", answer: "円", options: d("円", "四角形", "三角形", "直線"), hint: "ボールの切り口。" },
        { question: "半径5cmの円をかくとき、コンパスの開きは？", answer: "5cm", options: d("5cm", "10cm", "2cm", "15cm"), hint: "開きは半径。" },
        { question: "直径18cmの円をかくなら、半径は？", answer: "9cm", options: d("9cm", "18cm", "36cm", "6cm"), hint: "18の半分。" },
        { question: "円の中心を通らない、まわりからまわりへの線は直径？", answer: "直径ではない", options: d("直径ではない", "直径", "半径", "中心"), hint: "直径は中心を通る。" },
        { question: "半径3cmの円と半径5cmの円。大きいのは？", answer: "半径5cmの円", options: d("半径5cmの円", "半径3cmの円", "同じ", "くらべられない"), hint: "半径が長いほど大きい。" },
        { question: "直径10cmの円と半径6cmの円。大きいのは？", answer: "半径6cmの円", options: d("半径6cmの円", "直径10cmの円", "同じ", "直径10cmの円が2倍"), hint: "直径10cmの半径は5cm。" },
        { question: "円をきれいにかく道具は？", answer: "コンパス", options: d("コンパス", "はかり", "時計", "分度器だけ"), hint: "中心を決めてかく。" },
        { question: "円の学習で、まず決めるとよい点は？", answer: "中心", options: d("中心", "角", "重さ", "時刻"), hint: "中心から円をかく。" },
    ], // 円 と きゅう
    MATH_G3_U09: [
        { question: "12こを3人で同じ数ずつ分けます。1人分は？", answer: "4こ", options: d("4こ", "3こ", "12こ", "15こ"), hint: "12÷3。" },
        { question: "20まいを5人で同じ数ずつ分けます。1人分は？", answer: "4まい", options: d("4まい", "5まい", "20まい", "25まい"), hint: "20÷5。" },
        { question: "18こを6こずつふくろに入れます。ふくろはいくつ？", answer: "3ふくろ", options: d("3ふくろ", "6ふくろ", "18ふくろ", "24ふくろ"), hint: "18÷6。" },
        { question: "24本を4本ずつたばにします。たばはいくつ？", answer: "6たば", options: d("6たば", "4たば", "24たば", "20たば"), hint: "24÷4。" },
        { question: "15÷3は、どんな場面？", answer: "15こを3人で同じ数ずつ分ける", options: d("15こを3人で同じ数ずつ分ける", "15こと3こを合わせる", "15こから3こだけ見る", "3を15回たす"), hint: "わり算は同じ数ずつ分ける。" },
        { question: "□ × 4 = 28。□は？", answer: "7", options: d("7", "4", "28", "6"), hint: "28÷4。" },
        { question: "6 × □ = 42。□は？", answer: "7", options: d("7", "6", "42", "8"), hint: "42÷6。" },
        { question: "36÷9 = ?", answer: "4", options: d("4", "9", "36", "5"), hint: "9×4=36。" },
        { question: "48÷6 = ?", answer: "8", options: d("8", "6", "7", "9"), hint: "6×8=48。" },
        { question: "56÷7 = ?", answer: "8", options: d("8", "7", "9", "6"), hint: "7×8=56。" },
        { question: "わり算の答えをたしかめるには？", answer: "かけ算を使う", options: d("かけ算を使う", "たし算だけ使う", "単位を消す", "色で見る"), hint: "商×わる数。" },
        { question: "32÷4の答えをたしかめる式は？", answer: "8×4", options: d("8×4", "8+4", "32×4", "4-8"), hint: "答え×わる数。" },
        { question: "同じ数ずつ分ける計算は？", answer: "わり算", options: d("わり算", "たし算", "時刻", "長さ"), hint: "等しく分ける。" },
        { question: "同じ数ずつ入れるときにも使える計算は？", answer: "わり算", options: d("わり算", "小数だけ", "分数だけ", "円"), hint: "何組できるか。" },
        { question: "27こを9こずつ分けると、何組？", answer: "3組", options: d("3組", "9組", "27組", "36組"), hint: "27÷9。" },
        { question: "45人を5人ずつの組にします。何組？", answer: "9組", options: d("9組", "5組", "45組", "40組"), hint: "45÷5。" },
        { question: "30こを6人で同じ数ずつ分けます。1人分は？", answer: "5こ", options: d("5こ", "6こ", "30こ", "36こ"), hint: "30÷6。" },
        { question: "72÷8 = ?", answer: "9", options: d("9", "8", "7", "10"), hint: "8×9=72。" },
        { question: "21÷3 = ?", answer: "7", options: d("7", "3", "6", "8"), hint: "3×7=21。" },
        { question: "わり算で、わける相手の数を表すのは？", answer: "わる数", options: d("わる数", "答え", "あまり", "小数"), hint: "12÷3の3。" },
    ], // わり算（わり算のいみ）
    MATH_G3_U10: [
        { question: "14÷3 = ?", answer: "4あまり2", options: d("4あまり2", "3あまり4", "5あまり1", "4あまり1"), hint: "3×4=12。" },
        { question: "25÷4 = ?", answer: "6あまり1", options: d("6あまり1", "5あまり5", "7あまり1", "6あまり2"), hint: "4×6=24。" },
        { question: "38÷5 = ?", answer: "7あまり3", options: d("7あまり3", "8あまり2", "7あまり2", "6あまり8"), hint: "5×7=35。" },
        { question: "47÷6 = ?", answer: "7あまり5", options: d("7あまり5", "8あまり1", "7あまり1", "6あまり11"), hint: "6×7=42。" },
        { question: "59÷8 = ?", answer: "7あまり3", options: d("7あまり3", "8あまり3", "7あまり4", "6あまり11"), hint: "8×7=56。" },
        { question: "あまりは、わる数より？", answer: "小さい", options: d("小さい", "大きい", "同じか大きい", "いつも0"), hint: "あまりの決まり。" },
        { question: "17÷5で、あまりにできる数は？", answer: "2", options: d("2", "5", "7", "12"), hint: "5×3=15。" },
        { question: "29÷9で、商は？", answer: "3", options: d("3", "2", "4", "9"), hint: "9×3=27。" },
        { question: "29÷9で、あまりは？", answer: "2", options: d("2", "3", "9", "0"), hint: "29-27。" },
        { question: "33÷4で、あまりは？", answer: "1", options: d("1", "4", "8", "2"), hint: "4×8=32。" },
        { question: "20このあめを6こずつふくろに入れると、何ふくろできて何こあまる？", answer: "3ふくろで2こあまる", options: d("3ふくろで2こあまる", "2ふくろで3こあまる", "4ふくろで0こ", "3ふくろで6こあまる"), hint: "6×3=18。" },
        { question: "31人を4人ずつの組にすると、何組できて何人あまる？", answer: "7組で3人あまる", options: d("7組で3人あまる", "8組で1人あまる", "7組で4人あまる", "6組で7人あまる"), hint: "4×7=28。" },
        { question: "あまりが0のとき、そのわり算は？", answer: "わりきれる", options: d("わりきれる", "わりきれない", "あまりが大きい", "計算できない"), hint: "ぴったり分けられる。" },
        { question: "36÷6のあまりは？", answer: "0", options: d("0", "6", "1", "36"), hint: "ぴったり。" },
        { question: "43÷7で、7×6=42。あまりは？", answer: "1", options: d("1", "6", "7", "0"), hint: "43-42。" },
        { question: "あまりのあるわり算のたしかめ式は？ 26÷3=8あまり2", answer: "3×8+2", options: d("3×8+2", "3×8-2", "8×2+3", "26×3"), hint: "わる数×商+あまり。" },
        { question: "52÷9で、9×5=45、9×6=54。商は？", answer: "5", options: d("5", "6", "9", "7"), hint: "54は大きすぎる。" },
        { question: "52÷9のあまりは？", answer: "7", options: d("7", "5", "9", "0"), hint: "52-45。" },
        { question: "あまりがわる数と同じになったら？", answer: "商を1ふやせる", options: d("商を1ふやせる", "そのままでよい", "あまりを消す", "答えなし"), hint: "あまりはわる数より小さい。" },
        { question: "あまりのあるわり算で大切なことは？", answer: "あまりがわる数より小さいか見る", options: d("あまりがわる数より小さいか見る", "あまりをいつも0にする", "商を消す", "たし算だけ見る"), hint: "最後に確認する。" },
    ], // わり算（あまりのある計算）
    MATH_G3_U11: [
        { question: "1kgは何g？", answer: "1000g", options: d("1000g", "100g", "10g", "1g"), hint: "kgとgの関係。" },
        { question: "3kgは何g？", answer: "3000g", options: d("3000g", "300g", "30g", "3g"), hint: "1000gが3つ。" },
        { question: "2kg500gは何g？", answer: "2500g", options: d("2500g", "2050g", "2005g", "25g"), hint: "2000g+500g。" },
        { question: "4800gは何kg何g？", answer: "4kg800g", options: d("4kg800g", "48kg", "4kg80g", "8kg400g"), hint: "1000gごとにkg。" },
        { question: "1kg200g + 300g = ?", answer: "1kg500g", options: d("1kg500g", "1kg200g", "1500kg", "900g"), hint: "1200g+300g。" },
        { question: "2kg - 700g = ?", answer: "1kg300g", options: d("1kg300g", "2kg700g", "1300kg", "1kg700g"), hint: "2000g-700g。" },
        { question: "600gと1kg。重いのは？", answer: "1kg", options: d("1kg", "600g", "同じ", "くらべられない"), hint: "1kg=1000g。" },
        { question: "1500gと1kg400g。重いのは？", answer: "1500g", options: d("1500g", "1kg400g", "同じ", "100g"), hint: "1kg400g=1400g。" },
        { question: "2kgと2000g。くらべると？", answer: "同じ", options: d("同じ", "2kgが重い", "2000gが重い", "くらべられない"), hint: "2kg=2000g。" },
        { question: "はかりで重さをはかるときの単位は？", answer: "gやkg", options: d("gやkg", "cmやm", "LやdL", "時や分"), hint: "重さの単位。" },
        { question: "りんご1こが300g。3こで？", answer: "900g", options: d("900g", "600g", "300g", "1kg"), hint: "300×3。" },
        { question: "500gのふくろが2つで？", answer: "1kg", options: d("1kg", "500g", "2kg", "250g"), hint: "500g+500g。" },
        { question: "1kgから250g使うと、残りは？", answer: "750g", options: d("750g", "250g", "1250g", "1kg250g"), hint: "1000-250。" },
        { question: "3kg200gから1kg100gをひくと？", answer: "2kg100g", options: d("2kg100g", "2kg300g", "4kg300g", "1kg100g"), hint: "kg同士、g同士。" },
        { question: "2kg400g + 600g = ?", answer: "3kg", options: d("3kg", "2kg1000g", "2kg600g", "3000kg"), hint: "400g+600g=1000g。" },
        { question: "750gと800g。重いのは？", answer: "800g", options: d("800g", "750g", "同じ", "50g"), hint: "数をくらべる。" },
        { question: "重さをくらべるとき、単位がちがうなら？", answer: "同じ単位にする", options: d("同じ単位にする", "色でくらべる", "名前でくらべる", "くらべない"), hint: "gにそろえるとよい。" },
        { question: "1000gより200g重いのは？", answer: "1kg200g", options: d("1kg200g", "800g", "1kg20g", "120kg"), hint: "1000g+200g。" },
        { question: "2kgより300g軽いのは？", answer: "1kg700g", options: d("1kg700g", "2kg300g", "170g", "3kg700g"), hint: "2000g-300g。" },
        { question: "重さの学習で、kgはgよりどんな単位？", answer: "大きい単位", options: d("大きい単位", "小さい単位", "長さの単位", "時刻の単位"), hint: "1kg=1000g。" },
    ], // 重さ（g と kg）
    MATH_G3_U12: [
        { question: "0.1が3こで？", answer: "0.3", options: d("0.3", "3", "0.03", "0.13"), hint: "0.1を3こ。" },
        { question: "0.1が10こで？", answer: "1", options: d("1", "0.10", "10", "0.1"), hint: "10こで1。" },
        { question: "1.4は、1と0.1が何こ？", answer: "4こ", options: d("4こ", "1こ", "14こ", "10こ"), hint: "小数第一位を見る。" },
        { question: "2.7の小数第一位の数字は？", answer: "7", options: d("7", "2", "27", "0"), hint: "点の右の数字。" },
        { question: "0.4 + 0.3 = ?", answer: "0.7", options: d("0.7", "0.1", "7", "0.43"), hint: "0.1が7こ。" },
        { question: "0.8 - 0.5 = ?", answer: "0.3", options: d("0.3", "0.13", "3", "0.5"), hint: "0.1が3こ残る。" },
        { question: "1.2 + 0.6 = ?", answer: "1.8", options: d("1.8", "1.6", "0.18", "18"), hint: "0.2+0.6。" },
        { question: "2.5 - 1.3 = ?", answer: "1.2", options: d("1.2", "1.8", "0.12", "12"), hint: "位をそろえる。" },
        { question: "0.9と1.0。大きいのは？", answer: "1.0", options: d("1.0", "0.9", "同じ", "0.1"), hint: "1.0は1。" },
        { question: "1.5と1.2。大きいのは？", answer: "1.5", options: d("1.5", "1.2", "同じ", "0.5"), hint: "小数第一位をくらべる。" },
        { question: "3.0は整数で書くと？", answer: "3", options: d("3", "30", "0.3", "3.1"), hint: ".0は同じ大きさ。" },
        { question: "0.6は0.1が何こ？", answer: "6こ", options: d("6こ", "1こ", "0こ", "10こ"), hint: "小数第一位。" },
        { question: "1より0.2大きい数は？", answer: "1.2", options: d("1.2", "0.8", "1.02", "2"), hint: "1に0.2をたす。" },
        { question: "2より0.4小さい数は？", answer: "1.6", options: d("1.6", "2.4", "0.4", "1.4"), hint: "2.0-0.4。" },
        { question: "0.5mは何cm？", answer: "50cm", options: d("50cm", "5cm", "500cm", "0.5cm"), hint: "1mは100cm。" },
        { question: "0.1Lは何dL？", answer: "1dL", options: d("1dL", "10dL", "0dL", "100dL"), hint: "1Lは10dL。" },
        { question: "小数のたし算で大切なのは？", answer: "小数点をそろえる", options: d("小数点をそろえる", "左につめる", "点を消す", "大きい数だけ見る"), hint: "位をそろえる。" },
        { question: "小数のひき算で、2.0-0.7は？", answer: "1.3", options: d("1.3", "2.7", "1.7", "13"), hint: "20こから7こ。" },
        { question: "0.2、0.5、0.9で一番大きいのは？", answer: "0.9", options: d("0.9", "0.5", "0.2", "同じ"), hint: "9こ分が一番大きい。" },
        { question: "0.2、0.5、0.9で一番小さいのは？", answer: "0.2", options: d("0.2", "0.5", "0.9", "同じ"), hint: "2こ分が一番小さい。" },
    ], // 小数
    MATH_G3_U13: [
        { question: "1/5が3こで？", answer: "3/5", options: d("3/5", "1/15", "5/3", "3"), hint: "分母はそのまま。" },
        { question: "2/7 + 3/7 = ?", answer: "5/7", options: d("5/7", "5/14", "1/7", "6/7"), hint: "分母が同じ。" },
        { question: "5/8 - 2/8 = ?", answer: "3/8", options: d("3/8", "3/0", "7/8", "2/8"), hint: "分子をひく。" },
        { question: "1 - 2/5 = ?", answer: "3/5", options: d("3/5", "2/5", "1/5", "1/3"), hint: "1は5/5。" },
        { question: "3/4と1/4。大きいのは？", answer: "3/4", options: d("3/4", "1/4", "同じ", "くらべられない"), hint: "分母が同じなら分子でくらべる。" },
        { question: "2/6と5/6。小さいのは？", answer: "2/6", options: d("2/6", "5/6", "同じ", "くらべられない"), hint: "2は5より小さい。" },
        { question: "4/4は整数で書くと？", answer: "1", options: d("1", "4", "0", "8"), hint: "全部そろった。" },
        { question: "1/3が3こで？", answer: "1", options: d("1", "3/3", "1/9", "3"), hint: "3/3は1。" },
        { question: "分数で、下の数を何という？", answer: "分母", options: d("分母", "分子", "整数", "小数点"), hint: "いくつに分けたか。" },
        { question: "分数で、上の数を何という？", answer: "分子", options: d("分子", "分母", "整数", "小数"), hint: "そのうち何こか。" },
        { question: "1mの1/10は？", answer: "10cm", options: d("10cm", "1cm", "100cm", "0cm"), hint: "1mは100cm。" },
        { question: "1Lの1/10は？", answer: "1dL", options: d("1dL", "10dL", "1L", "100dL"), hint: "1Lは10dL。" },
        { question: "2/5 + 1/5 = ?", answer: "3/5", options: d("3/5", "3/10", "1/5", "2/10"), hint: "分母はそのまま。" },
        { question: "7/9 - 4/9 = ?", answer: "3/9", options: d("3/9", "3/0", "11/9", "4/9"), hint: "7-4。" },
        { question: "1/2と1/4。大きいのは？", answer: "1/2", options: d("1/2", "1/4", "同じ", "くらべられない"), hint: "同じ大きさを2つに分ける方が1つ分は大きい。" },
        { question: "同じ大きさを8こに分けた1こは？", answer: "1/8", options: d("1/8", "8/1", "1/4", "8"), hint: "8等分の1こ。" },
        { question: "3/6は、1/6が何こ？", answer: "3こ", options: d("3こ", "6こ", "1こ", "9こ"), hint: "分子を見る。" },
        { question: "5/5と4/5。大きいのは？", answer: "5/5", options: d("5/5", "4/5", "同じ", "くらべられない"), hint: "5/5は1。" },
        { question: "分母が同じ分数のたし算で、分母は？", answer: "そのまま", options: d("そのまま", "たす", "ひく", "0にする"), hint: "分子だけたす。" },
        { question: "分母が同じ分数をくらべるとき見るのは？", answer: "分子", options: d("分子", "分母だけ", "小数点", "単位"), hint: "上の数でくらべる。" },
    ], // 分数
    MATH_G3_U14: [
        { question: "□ + 8 = 20。□は？", answer: "12", options: d("12", "28", "8", "10"), hint: "20-8。" },
        { question: "□ - 7 = 15。□は？", answer: "22", options: d("22", "8", "15", "105"), hint: "15+7。" },
        { question: "6 × □ = 42。□は？", answer: "7", options: d("7", "6", "42", "8"), hint: "42÷6。" },
        { question: "□ × 5 = 35。□は？", answer: "7", options: d("7", "5", "35", "6"), hint: "35÷5。" },
        { question: "□ ÷ 4 = 9。□は？", answer: "36", options: d("36", "13", "9", "4"), hint: "9×4。" },
        { question: "48 ÷ □ = 6。□は？", answer: "8", options: d("8", "6", "48", "7"), hint: "48÷6。" },
        { question: "□ + 125 = 400。□は？", answer: "275", options: d("275", "525", "125", "300"), hint: "400-125。" },
        { question: "900 - □ = 350。□は？", answer: "550", options: d("550", "1250", "350", "650"), hint: "900-350。" },
        { question: "□ - 248 = 452。□は？", answer: "700", options: d("700", "204", "452", "600"), hint: "452+248。" },
        { question: "□ × 3 = 96。□は？", answer: "32", options: d("32", "99", "93", "29"), hint: "96÷3。" },
        { question: "24 × □ = 144。□は？", answer: "6", options: d("6", "24", "144", "5"), hint: "144÷24。" },
        { question: "□ ÷ 7 = 8あまり2。□は？", answer: "58", options: d("58", "56", "10", "62"), hint: "7×8+2。" },
        { question: "□ + 0.4 = 1.0。□は？", answer: "0.6", options: d("0.6", "1.4", "0.4", "6"), hint: "1.0-0.4。" },
        { question: "□ - 0.3 = 0.5。□は？", answer: "0.8", options: d("0.8", "0.2", "0.5", "8"), hint: "0.5+0.3。" },
        { question: "□/5 = 3/5。□は？", answer: "3", options: d("3", "5", "8", "2"), hint: "分子を見る。" },
        { question: "□ + 3/7 = 5/7。□は？", answer: "2/7", options: d("2/7", "8/7", "3/7", "5/7"), hint: "5/7-3/7。" },
        { question: "□を使った式で、□は何を表す？", answer: "わからない数", options: d("わからない数", "いつも0", "答えではない数", "単位"), hint: "まだ分からない数。" },
        { question: "□ + 15 = 15。□は？", answer: "0", options: d("0", "15", "30", "1"), hint: "たしても変わらない数。" },
        { question: "□ × 1 = 27。□は？", answer: "27", options: d("27", "1", "28", "0"), hint: "1をかけても同じ。" },
        { question: "□を求めたあとにすることは？", answer: "もとの式に入れてたしかめる", options: d("もとの式に入れてたしかめる", "消す", "別の数字に変える", "読まない"), hint: "たしかめが大切。" },
    ], // □をつかった 式
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G3_U01': {
            const a = (n % 9) + 1;
            const b = (n % 6) + 1;
            const c = (n % 7) + 1;
            const p = n % 4;
            if (p === 0) {
                const max = Math.max(a, b, c);
                const winners = [["ねこ", a], ["いぬ", b], ["うさぎ", c]].filter(([, v]) => v === max).map(([label]) => label);
                const answer = winners.length === 1 ? winners[0] : "おなじ";
                const wrongs = ["ねこ", "いぬ", "うさぎ", "おなじ"].filter((label) => label !== answer).slice(0, 3);
                return { question: `ぼうグラフ。 いちばん おおいの どうぶつは？`, answer, options: d(answer, ...wrongs), hint: "いちばん高いぼう。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["ねこ", "いぬ", "うさぎ"] } };
            }
            if (p === 1) {
                return { question: `ねこ と いぬ の 合計は？`, answer: `${a + b}ひき`, options: d(`${a + b}ひき`, `${a + b + 1}ひき`, `${a - b}ひき`, `${a}ひき`), hint: "2つのぼうを たす。", visual: { kind: 'bar_chart', values: [a, b], labels: ["ねこ", "いぬ"] } };
            }
            if (p === 2) {
                return { question: `ねこは いぬより 何ひき多い？`, answer: `${Math.abs(a - b)}ひき`, options: d(`${Math.abs(a - b)}ひき`, `${a + b}ひき`, `${Math.max(a, b)}ひき`, `${Math.min(a, b)}ひき`), hint: "2本の差をみる。", visual: { kind: 'bar_chart', values: [a, b], labels: ["ねこ", "いぬ"] } };
            }
            return { question: `3しゅるい ぜんぶで 何ひき？`, answer: `${a + b + c}ひき`, options: d(`${a + b + c}ひき`, `${a + b}ひき`, `${b + c}ひき`, `${a + c}ひき`), hint: "3本ともたす。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["ねこ", "いぬ", "うさぎ"] } };
        }
        case 'MATH_G3_U02': {
            const value = 1000 + n * 37;
            if (n % 2 === 0) {
                return { question: `${value} は 1000より おおきい？`, answer: "はい", options: d("はい", "いいえ", "おなじ", "わからない"), hint: "1000を こえているか 見よう。" };
            }
            return { question: `1000 と ${value}。 大きいのは？`, answer: `${value}`, options: d(`${value}`, "1000", "同じ", "わからない"), hint: "1000を こえているか 比べよう。" };
        }
        case 'MATH_G3_U03': {
            const a = 200 + (n % 700);
            const b = 100 + (n % 500);
            const s = a + b;
            if (n % 2 === 0) {
                return { question: `${a} + ${b} = ?`, answer: `${s}`, options: d(`${s}`, `${s + 10}`, `${s - 10}`, `${a}`), hint: "3けた・4けたの たし算。" };
            }
            return { question: `${s} に なる 式は どれ？`, answer: `${a} + ${b}`, options: d(`${a} + ${b}`, `${a} + ${b + 10}`, `${a - 10} + ${b}`, `${s} + ${b}`), hint: "和が ${s} に なる式を えらぼう。" };
        }
        case 'MATH_G3_U04': {
            const b = 100 + (n % 500);
            const a = b + 200 + (n % 400);
            const dff = a - b;
            if (n % 2 === 0) {
                return { question: `${a} - ${b} = ?`, answer: `${dff}`, options: d(`${dff}`, `${dff + 10}`, `${dff - 10}`, `${a}`), hint: "3けた・4けたの ひき算。" };
            }
            return { question: `${dff} に なる 式は どれ？`, answer: `${a} - ${b}`, options: d(`${a} - ${b}`, `${a} - ${b - 10}`, `${a + 10} - ${b}`, `${dff} - ${b}`), hint: "差が ${dff} に なる式を えらぼう。" };
        }
        case 'MATH_G3_U05': {
            const h = (n % 10) + 1;
            const m = (n % 6) * 10;
            const ansH = h + Math.floor((m + 20) / 60);
            const ansM = (m + 20) % 60;
            return {
                question: `この とけいの 20分後は？`,
                answer: `${ansH}時${ansM}分`,
                options: d(`${ansH}時${ansM}分`, `${h}時${m}分`, `${h}時${(m + 40) % 60}分`, `${h + 1}時${m}分`),
                hint: "60分で 1時間 くりあがる。",
                visual: { kind: 'clock', hour: h, minute: m }
            };
        }
        case 'MATH_G3_U06': {
            const km = (n % 5) + 1;
            const m = (n % 9) * 100;
            if (n % 2 === 0) {
                return { question: `${km}km${m}m は 何m？`, answer: `${km * 1000 + m}m`, options: d(`${km * 1000 + m}m`, `${km * 100 + m}m`, `${km * 1000}m`, `${m}m`), hint: "1km=1000m。" };
            }
            return { question: `${km * 1000 + m}m は 何km何m？`, answer: `${km}km${m}m`, options: d(`${km}km${m}m`, `${km}km`, `${m}m`, `${km + 1}km${m}m`), hint: "1000m ごとに km に なおす。" };
        }
        case 'MATH_G3_U07': {
            const a = (n % 8) + 12;
            const b = (n % 7) + 2;
            const p = a * b;
            if (n % 2 === 0) {
                return { question: `${a} × ${b} = ?`, answer: `${p}`, options: d(`${p}`, `${p + b}`, `${p - b}`, `${a + b}`), hint: "2けた×1けた の かけ算。" };
            }
            return { question: `${a} × □ = ${p}。 □ は？`, answer: `${b}`, options: d(`${b}`, `${a}`, `${b + 1}`, `${Math.max(1, b - 1)}`), hint: "かけ算を ぎゃくに見よう。" };
        }
        case 'MATH_G3_U08': {
            if (n % 2 === 0) {
                const r = (n % 9) + 1;
                return { question: `この 円の 半径が ${r}cm。 直径は？`, answer: `${r * 2}cm`, options: d(`${r * 2}cm`, `${r}cm`, `${r * 3}cm`, `${Math.max(1, r - 1)}cm`), hint: "直径は 半径の2倍。", visual: { kind: 'circle', showRadius: true } };
            }
            return { question: "きゅうを どこで 切っても、切り口は 何の形？", answer: "円", options: d("円", "正方形", "長方形", "三角形"), hint: "ボールを 思い出して。", visual: { kind: 'circle' } };
        }
        case 'MATH_G3_U09': {
            const divisor = (n % 8) + 2;
            const q = (n % 6) + 3;
            const nmr = divisor * q;
            if (n % 2 === 0) {
                return { question: `${nmr} ÷ ${divisor} = ?`, answer: `${q}`, options: d(`${q}`, `${divisor}`, `${q + 1}`, `${q - 1}`), hint: "かけ算で たしかめよう。" };
            }
            return { question: `□ × ${divisor} = ${nmr}。 □ は？`, answer: `${q}`, options: d(`${q}`, `${divisor}`, `${q + 1}`, `${Math.max(1, q - 1)}`), hint: "わり算を かけ算に なおそう。" };
        }
        case 'MATH_G3_U10': {
            const divisor = (n % 7) + 3;
            const q = (n % 5) + 2;
            const r = (n % (divisor - 1)) + 1;
            const nmr = divisor * q + r;
            return { question: `${nmr} ÷ ${divisor} = ?`, answer: `${q} あまり ${r}`, options: d(`${q} あまり ${r}`, `${q + 1} あまり ${r}`, `${q} あまり ${Math.max(0, r - 1)}`, `${q - 1} あまり ${r}`), hint: "あまりは わる数より 小さい。" };
        }
        case 'MATH_G3_U11': {
            const kg = (n % 4) + 1;
            const g = (n % 9) * 100;
            if (n % 2 === 0) {
                return { question: `${kg}kg${g}g は 何g？`, answer: `${kg * 1000 + g}g`, options: d(`${kg * 1000 + g}g`, `${kg * 100 + g}g`, `${kg * 1000}g`, `${g}g`), hint: "1kg=1000g。" };
            }
            return { question: `${kg * 1000 + g}g は 何kg何g？`, answer: `${kg}kg${g}g`, options: d(`${kg}kg${g}g`, `${kg}kg`, `${g}g`, `${kg + 1}kg${g}g`), hint: "1000g ごとに kg に なおす。" };
        }
        case 'MATH_G3_U12': {
            const a = (n % 9) + 1;
            const b = (n % 9) + 1;
            const sum = (a + b) / 10;
            if (n % 2 === 0) {
                return { question: `0.${a} + 0.${b} = ?`, answer: `${sum}`, options: d(`${sum}`, `0.${a}`, `0.${b}`, `${a + b}`), hint: "小数第1位どうしを たそう。" };
            }
            return { question: `0.1 が ${a}こ と 0.1 が ${b}こ。 あわせて いくつ？`, answer: `${sum}`, options: d(`${sum}`, `${a + b}`, `0.${a}`, `1.${Math.max(0, a + b - 10)}`), hint: "0.1 を 何こ 集めたかで 考える。" };
        }
        case 'MATH_G3_U13': {
            const den = (n % 6) + 3;
            const num1 = (n % (den - 1)) + 1;
            const num2 = Math.min(den - 1, num1 + 1);
            const p = n % 4;
            if (p === 0) {
                return {
                    question: `${num1}/${den} と ${num2}/${den}。 大きいのは？`,
                    answer: `${num2}/${den}`,
                    options: d(`${num2}/${den}`, `${num1}/${den}`, "おなじ", "くらべられない"),
                    hint: "分母が 同じなら 分子で くらべる。",
                    visual: { kind: 'fraction_operation', left: { n: num1, d: den }, right: { n: num2, d: den }, op: '>' }
                };
            }
            if (p === 1) {
                return {
                    question: `${num1}/${den} と ${num2}/${den}。 小さいのは？`,
                    answer: `${num1}/${den}`,
                    options: d(`${num1}/${den}`, `${num2}/${den}`, "おなじ", "くらべられない"),
                    hint: "分母が 同じなら 分子が 小さいほうが 小さい。",
                    visual: { kind: 'fraction_operation', left: { n: num1, d: den }, right: { n: num2, d: den }, op: '<' }
                };
            }
            if (p === 2) {
                return {
                    question: `${num1}/${den} と ${num1}/${den}。 同じものは？`,
                    answer: "おなじ",
                    options: d("おなじ", `${num1}/${den}`, `${num2}/${den}`, "ちがう"),
                    hint: "まったく 同じ分数なら おなじ。",
                    visual: { kind: 'fraction_operation', left: { n: num1, d: den }, right: { n: num1, d: den }, op: '>' }
                };
            }
            return {
                question: `${num1}/${den} と ${num2}/${den}。 分子が 大きいのは？`,
                answer: `${num2}/${den}`,
                options: d(`${num2}/${den}`, `${num1}/${den}`, "おなじ", "わからない"),
                hint: "分母が 同じなら 分子に 注目。",
                visual: { kind: 'fraction_operation', left: { n: num1, d: den }, right: { n: num2, d: den }, op: '>' }
            };
        }
        case 'MATH_G3_U14': {
            const x = (n % 8) + 2;
            const y = x + (n % 5) + 1;
            if (n % 2 === 0) {
                return { question: `□ + ${x} = ${x + y}。 □ は？`, answer: `${y}`, options: d(`${y}`, `${x}`, `${x + y}`, `${y + 1}`), hint: "逆の計算を しよう。" };
            }
            return { question: `${x} + □ = ${x + y}。 □ は？`, answer: `${y}`, options: d(`${y}`, `${x}`, `${x + y}`, `${y + 1}`), hint: "たされる数が どこにあるかを 見よう。" };
        }
        default:
            return { question: "3 + 4 = ?", answer: "7", options: d("7", "6", "8", "5"), hint: "たし算。" };
    }
};

fillGeneratedUnitProblems(MATH_G3_UNIT_DATA, makeUnitProblem);

export const MATH_G3_DATA: Record<string, GeneralProblem[]> = {
    MATH_G3_1,
    MATH_G3_2,
    MATH_G3_3,
    ...MATH_G3_UNIT_DATA,
};
