
import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

const MATH_G1_1: GeneralProblem[] = [
        { question: "1、2、3、の つぎの かずは なに？", answer: "4", options: d("4", "0", "5", "6"), hint: "ひとつ ずつ ふえていくよ。" },
        { question: "5 と 3、 どっちが おおきい？", answer: "5", options: d("5", "3", "おなじ", "わからない"), hint: "ゆびを つかって かぞえてみよう。" },
        { question: "10 は 7 と なに？", answer: "3", options: d("3", "2", "4", "5"), hint: "10に なる 組み合わせだよ。" },
        { question: "「3 ＋ 2 ＝ 」 こたえは なに？", answer: "5", options: d("5", "4", "6", "1"), hint: "あわせると いくつかな？" },
        { question: "「5 － 1 ＝ 」 こたえは なに？", answer: "4", options: d("4", "5", "6", "3"), hint: "ひとつ ヘルと いくつかな？" },
        { question: "しかくい かたちは どれ？", answer: "ノート", options: d("ノート", "ボール", "えんぴつ", "ドーナツ"), hint: "かどが 4つ あるよ。" },
        { question: "「7 ＋ 3 ＝ 」 こたえは なに？", answer: "10", options: d("10", "9", "8", "7"), hint: "ちょうど 10に なるよ。" },
        { question: "リンゴが 4こ あります。2こ たべると のこりは？", answer: "2こ", options: d("2こ", "6こ", "4こ", "0こ"), hint: "4から 2を ひこう。" },
        { question: "「8 － 3 ＝ 」 こたえは なに？", answer: "5", options: d("5", "4", "6", "3"), hint: "ひきざん だよ。" },
        { question: "0 は なにを あらわす？", answer: "なにも ない", options: d("なにも ない", "1つ ある", "たくさん ある", "まるい もの"), hint: "空っぽ（からっぽ）の ことだよ。" },
        { question: "2 と 2 を あわせると？", answer: "4", options: d("4", "2", "0", "22"), hint: "たしざん だよ。" },
        { question: "9 は 4 と なに？", answer: "5", options: d("5", "6", "3", "4"), hint: "あわせて 9に なる かず。" },
        { question: "「10 － 5 ＝ 」 こたえは？", answer: "5", options: d("5", "0", "10", "6"), hint: "はんぶんこだね。" },
        { question: "5に 1を たすと？", answer: "6", options: d("6", "4", "51", "7"), hint: "ひとつ ふえるよ。" },
        { question: "1、2、3、4、5。 3ばんめの かずは？", answer: "3", options: d("3", "2", "4", "5"), hint: "じゅんばんを かぞえよう。" },
        { question: "まるい かたちは どれ？", answer: "ボール", options: d("ボール", "ノート", "つくえ", "はさみ"), hint: "ころころ ころがるよ。" },
        { question: "5 は 2 と なに？", answer: "3", options: d("3", "2", "1", "4"), hint: "5に なる 組み合わせだよ。" },
        { question: "4 は 1 と なに？", answer: "3", options: d("3", "1", "2", "4"), hint: "4を 分けてみよう。" },
        { question: "「2 ＋ 1 ＝ 」 こたえは？", answer: "3", options: d("3", "2", "1", "4"), hint: "かんたんな たしざん。" },
        { question: "「4 － 2 ＝ 」 こたえは？", answer: "2", options: d("2", "4", "1", "3"), hint: "はんぶんこ だね。" },
        { question: "「0 ＋ 5 ＝ 」 こたえは？", answer: "5", options: d("5", "0", "6", "50"), hint: "0は なにも ないよ。" },
        { question: "「3 － 0 ＝ 」 こたえは？", answer: "3", options: d("3", "0", "2", "30"), hint: "ひいても かわらないよ。" },
        { question: "6 は 3 と なに？", answer: "3", options: d("3", "2", "4", "1"), hint: "おなじ かず だね。" },
        { question: "8 は 4 と なに？", answer: "4", options: d("4", "2", "6", "8"), hint: "4 と 4 を あわせると？" },
        { question: "7 は 2 と なに？", answer: "5", options: d("5", "4", "6", "3"), hint: "ゆびを 使ってみよう。" },
        { question: "「10 － 9 ＝ 」 こたえは？", answer: "1", options: d("1", "0", "9", "2"), hint: "あと 1つで 10になるよ。" },
        { question: "5つの リンゴを 5人で 1つずつ 食べると のこりは？", answer: "0こ", options: d("0こ", "5こ", "1こ", "10こ"), hint: "ぜんぶ なくなったよ。" },
        { question: "3に 2を たすと？", answer: "5", options: d("5", "1", "6", "4"), hint: "あわせるよ。" },
        { question: "9から 1を ひくと？", answer: "8", options: d("8", "10", "7", "9"), hint: "1つ へるよ。" },
        { question: "「1 ＋ 4 ＝ 」 こたえは？", answer: "5", options: d("5", "4", "3", "6"), hint: "5に なるよ。" },
        { question: "「6 － 2 ＝ 」 こたえは？", answer: "4", options: d("4", "6", "8", "2"), hint: "ひきざん だよ。" },
        { question: "10は 1と なに？", answer: "9", options: d("9", "1", "8", "10"), hint: "とっても 大きい かずだね。" },
        { question: "2に なにを たすと 5に なる？", answer: "3", options: d("3", "2", "1", "5"), hint: "のこりは いくつかな。" },
        { question: "4から なにを ひくと 1に なる？", answer: "3", options: d("3", "2", "1", "4"), hint: "ひく かずを かんがえよう。" },
        { question: "「2 ＋ 2 ＝ 」 こたえは？", answer: "4", options: d("4", "2", "0", "22"), hint: "おなじ かずを たすよ。" },
        { question: "「5 － 5 ＝ 」 こたえは？", answer: "0", options: d("0", "5", "10", "1"), hint: "ぜんぶ ひいちゃった。" },
        { question: "「3 ＋ 4 ＝ 」 こたえは？", answer: "7", options: d("7", "6", "8", "1"), hint: "たしざん。" },
        { question: "「10 － 2 ＝ 」 こたえは？", answer: "8", options: d("8", "7", "9", "2"), hint: "10から 2つ とるよ。" },
        { question: "「1 ＋ 1 ＝ 」 こたえは？", answer: "2", options: d("2", "1", "0", "11"), hint: "いちばん かんたんな たしざん。" },
        { question: "「6 － 6 ＝ 」 こたえは？", answer: "0", options: d("0", "6", "1", "12"), hint: "からっぽ。" },
        { question: "10は 5と なに？", answer: "5", options: d("5", "10", "0", "4"), hint: "はんぶんこ。" },
        { question: "3つ かずを かぞえます。 1、2、？", answer: "3", options: d("3", "0", "4", "5"), hint: "じゅんばん。" },
        { question: "「2 ＋ 3 ＝ 」 こたえは？", answer: "5", options: d("5", "4", "6", "1"), hint: "あわせよう。" },
        { question: "「8 － 1 ＝ 」 こたえは？", answer: "7", options: d("7", "8", "9", "6"), hint: "1つ まえの かず。" },
        { question: "4は 2と なに？", answer: "2", options: d("2", "1", "3", "4"), hint: "2 と 2 で？" },
        { question: "5は 0と なに？", answer: "5", options: d("5", "0", "4", "1"), hint: "かわらないよ。" },
        { question: "10は 8と なに？", answer: "2", options: d("2", "1", "3", "8"), hint: "あと すこし。" },
        { question: "「9 ＋ 1 ＝ 」 こたえは？", answer: "10", options: d("10", "9", "11", "0"), hint: "キリが いいね。" },
        { question: "「10 － 10 ＝ 」 こたえは？", answer: "0", options: d("0", "10", "1", "20"), hint: "なにも なくなる。" },
    ];

const MATH_G1_2: GeneralProblem[] = [
        { question: "10 よりも 1 おおきい かずは？", answer: "11", options: d("11", "9", "10", "12"), hint: "10の つぎの かず。" },
        { question: "「10 ＋ 5 ＝ 」 こたえは？", answer: "15", options: d("15", "10", "5", "20"), hint: "10と 5で いくつ？" },
        { question: "とけいの ながい はりが 12、みじかい はりが 3 のとき、なんじ？", answer: "3じ", options: d("3じ", "12じ", "6じ", "9じ"), hint: "みじかい はりを みてね。" },
        { question: "「8 ＋ 4 ＝ 」 こたえは？", answer: "12", options: d("12", "10", "11", "13"), hint: "10を つくって 考えよう。" },
        { question: "「13 － 3 ＝ 」 こたえは？", answer: "10", options: d("10", "13", "3", "16"), hint: "3を ひくと？" },
        { question: "10が 2つで いくつ？", answer: "20", options: d("20", "10", "2", "12"), hint: "じゅう、にじゅう…。" },
        { question: "「9 ＋ 6 ＝ 」 こたえは？", answer: "15", options: d("15", "14", "16", "13"), hint: "くりあがり が あるよ。" },
        { question: "「15 － 7 ＝ 」 こたえは？", answer: "8", options: d("8", "9", "7", "6"), hint: "くりさがり が あるよ。" },
        { question: "とけいの ながい はりが 6 のとき、なんという？", answer: "～じはん", options: d("～じはん", "～じ", "30ぷん", "6じ"), hint: "1年生は「半（はん）」という読み方をならうよ。" },
        { question: "「10 ＋ 10 ＝ 」 こたえは？", answer: "20", options: d("20", "10", "0", "100"), hint: "10が 2つ。" },
        { question: "「12 － 4 ＝ 」 こたえは？", answer: "8", options: d("8", "7", "9", "4"), hint: "10から 4を ひいて 2を たそう。" },
        { question: "「7 ＋ 7 ＝ 」 こたえは？", answer: "14", options: d("14", "7", "0", "10"), hint: "おなじ かずを たすよ。" },
        { question: "14 は 10 と なに？", answer: "4", options: d("4", "14", "10", "1"), hint: "くらい を 考えよう。" },
        { question: "とけいの みじかい はりが 10 と 11 の あいだ、ながい はりが 6。なんじ？", answer: "10じ はん", options: d("10じ はん", "11じ はん", "10じ", "11じ"), hint: "10じを すぎた ところ。" },
        { question: "「20 － 1 ＝ 」 こたえは？", answer: "19", options: d("19", "10", "21", "20"), hint: "ひとつ ヘルよ。" },
        { question: "3つ かずを あわせます。「1 ＋ 2 ＋ 3 ＝ 」", answer: "6", options: d("6", "5", "7", "123"), hint: "じゅんに たしていこう。" },
        { question: "「10 － 2 － 3 ＝ 」 こたえは？", answer: "5", options: d("5", "8", "7", "0"), hint: "どんどん ひいていこう。" },
        { question: "10と 2で いくつ？", answer: "12", options: d("12", "10", "2", "20"), hint: "10の つぎは 11、そのつぎ。" },
        { question: "10と 8で いくつ？", answer: "18", options: d("18", "10", "8", "28"), hint: "10と 8を あわせるよ。" },
        { question: "「10 ＋ 1 ＝ 」 こたえは？", answer: "11", options: d("11", "10", "1", "21"), hint: "11。" },
        { question: "「11 － 1 ＝ 」 こたえは？", answer: "10", options: d("10", "1", "11", "12"), hint: "1つ ひくよ。" },
        { question: "15は 10と なに？", answer: "5", options: d("5", "10", "15", "1"), hint: "5。" },
        { question: "「9 ＋ 2 ＝ 」 こたえは？", answer: "11", options: d("11", "10", "9", "12"), hint: "くりあがり。" },
        { question: "「8 ＋ 5 ＝ 」 こたえは？", answer: "13", options: d("13", "12", "14", "11"), hint: "10をつくろう。" },
        { question: "「7 ＋ 6 ＝ 」 こたえは？", answer: "13", options: d("13", "12", "14", "10"), hint: "くりあがり。" },
        { question: "「11 － 2 ＝ 」 こたえは？", answer: "9", options: d("9", "10", "8", "7"), hint: "くりさがり。" },
        { question: "「14 － 5 ＝ 」 こたえは？", answer: "9", options: d("9", "8", "10", "5"), hint: "くりさがり。" },
        { question: "「16 － 8 ＝ 」 こたえは？", answer: "8", options: d("8", "7", "9", "10"), hint: "はんぶんこ。" },
        { question: "10が 1つと 1が 7つ。 いくつ？", answer: "17", options: d("17", "10", "7", "71"), hint: "17。" },
        { question: "「10 ＋ 3 ＝ 」 こたえは？", answer: "13", options: d("13", "10", "3", "30"), hint: "13。" },
        { question: "「19 － 9 ＝ 」 こたえは？", answer: "10", options: d("10", "9", "19", "0"), hint: "9を とるよ。" },
        { question: "とけい。 みじかい はりが 6、 ながい はりが 12。 なんじ？", answer: "6じ", options: d("6じ", "12じ", "12じはん", "6じはん"), hint: "6。" },
        { question: "とけい。 みじかい はりが 1、 ながい はりが 6。 なんじ？", answer: "1じはん", options: d("1じはん", "1じ", "6じ", "2じ"), hint: "1じ 30ぷん。" },
        { question: "「2 ＋ 8 ＝ 」 こたえは？", answer: "10", options: d("10", "9", "8", "11"), hint: "10に なるよ。" },
        { question: "「5 ＋ 7 ＝ 」 こたえは？", answer: "12", options: d("12", "11", "13", "10"), hint: "くりあがり。" },
        { question: "「12 － 9 ＝ 」 こたえは？", answer: "3", options: d("3", "2", "4", "1"), hint: "くりさがり。" },
        { question: "「15 － 6 ＝ 」 こたえは？", answer: "9", options: d("9", "8", "7", "6"), hint: "くりさがり。" },
        { question: "20は 10が いくつ？", answer: "2つ", options: d("2つ", "10つ", "1つ", "20つ"), hint: "じゅう、にじゅう。" },
        { question: "10が 1つと 1が 0。 いくつ？", answer: "10", options: d("10", "1", "0", "100"), hint: "10。" },
        { question: "「8 ＋ 8 ＝ 」 こたえは？", answer: "16", options: d("16", "14", "18", "10"), hint: "くりあがり。" },
        { question: "「17 － 7 ＝ 」 こたえは？", answer: "10", options: d("10", "7", "17", "0"), hint: "7を とるよ。" },
        { question: "「9 ＋ 9 ＝ 」 こたえは？", answer: "18", options: d("18", "17", "19", "10"), hint: "くりあがり。" },
        { question: "「11 － 5 ＝ 」 こたえは？", answer: "6", options: d("6", "5", "7", "4"), hint: "くりさがり。" },
        { question: "「14 － 8 ＝ 」 こたえは？", answer: "6", options: d("6", "7", "5", "8"), hint: "くりさがり。" },
        { question: "「13 － 4 ＝ 」 こたえは？", answer: "9", options: d("9", "8", "10", "7"), hint: "くりさがり。" },
        { question: "10と 10を あわせると？", answer: "20", options: d("20", "10", "100", "0"), hint: "にじゅう。" },
        { question: "「10 ＋ 4 ＋ 1 ＝ 」 こたえは？", answer: "15", options: d("15", "14", "16", "10"), hint: "じゅんに たそう。" },
        { question: "「18 － 8 － 2 ＝ 」 こたえは？", answer: "8", options: d("8", "10", "18", "6"), hint: "じゅんに ひこう。" },
        { question: "「6 ＋ 4 ＋ 5 ＝ 」 こたえは？", answer: "15", options: d("15", "10", "14", "16"), hint: "10をつくろう。" },
    ];

const MATH_G1_3: GeneralProblem[] = [
        { question: "10が 10こで いくつ？", answer: "100", options: d("100", "10", "1000", "20"), hint: "とっても おおきな かず。" },
        { question: "「30 ＋ 20 ＝ 」 こたえは？", answer: "50", options: d("50", "32", "10", "100"), hint: "10の かたまりで 考えよう。" },
        { question: "「80 － 30 ＝ 」 こたえは？", answer: "50", options: d("50", "83", "30", "110"), hint: "8から 3を ひくるのと にてるよ。" },
        { question: "「100 － 1 ＝ 」 こたえは？", answer: "99", options: d("99", "100", "90", "0"), hint: "100の ひとつ まえ。" },
        { question: "50円と 10円 3こ。 あわせて いくら？", answer: "80円", options: d("80円", "60円", "40円", "53円"), hint: "50 ＋ 30 は？" },
        { question: "「12 ＋ 2 ＝ 」 こたえは？", answer: "14", options: d("14", "10", "12", "16"), hint: "2つ ふえるよ。" },
        { question: "「18 － 5 ＝ 」 こたえは？", answer: "13", options: d("13", "18", "5", "8"), hint: "8から 5を ひこう。" },
        { question: "ずけい。 さんかくの かどは いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "「さん」かく、だよ。" },
        { question: "しかくの かどは いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "0つ"), hint: "「しかく」だね。" },
        { question: "「50 ＋ 50 ＝ 」 こたえは？", answer: "100", options: d("100", "50", "0", "10"), hint: "5と 5を あわせると？" },
        { question: "40 は 10が なにこ？", answer: "4こ", options: d("4こ", "40こ", "1こ", "10こ"), hint: "じゅう、にじゅう、さんじゅう…。" },
        { question: "「25 ＋ 4 ＝ 」 こたえは？", answer: "29", options: d("29", "21", "20", "30"), hint: "5 ＋ 4 は？" },
        { question: "「37 － 7 ＝ 」 こたえは？", answer: "30", options: d("30", "37", "7", "44"), hint: "7を ひくと きりがいいね。" },
        { question: "とけいの ながい はりと みじかい はりが 12 の ところで かさなると なんじ？", answer: "12じ", options: d("12じ", "6じ", "0じ", "12じはん"), hint: "お昼のチャイムが鳴る時間だね。" },
        { question: "「6 ＋ 8 ＝ 」 こたえは？", answer: "14", options: d("14", "12", "16", "2"), hint: "くりあがり の れんしゅう。" },
        { question: "「15 － 9 ＝ 」 こたえは？", answer: "6", options: d("6", "5", "4", "7"), hint: "くりさがりの れんしゅう。" },
        { question: "100より 10 ちいさい かずは？", answer: "90", options: d("90", "100", "80", "10"), hint: "じゅう、にじゅう…きゅうじゅう。" },
        { question: "「10 ＋ 70 ＝ 」 こたえは？", answer: "80", options: d("80", "17", "70", "90"), hint: "10と 70。" },
        { question: "「90 － 40 ＝ 」 こたえは？", answer: "50", options: d("50", "94", "40", "130"), hint: "9-4 は 5。" },
        { question: "100は 10が いくつ？", answer: "10こ", options: d("10こ", "1こ", "100こ", "0こ"), hint: "たくさんだね。" },
        { question: "「20 ＋ 80 ＝ 」 こたえは？", answer: "100", options: d("100", "28", "80", "10"), hint: "100になるよ。" },
        { question: "「60 － 60 ＝ 」 こたえは？", answer: "0", options: d("0", "60", "120", "1"), hint: "なにも なくなる。" },
        { question: "10円玉が 10こ。 いくら？", answer: "100円", options: d("100円", "10円", "1000円", "50円"), hint: "100。" },
        { question: "「14 ＋ 5 ＝ 」 こたえは？", answer: "19", options: d("19", "14", "5", "20"), hint: "19。" },
        { question: "「17 － 4 ＝ 」 こたえは？", answer: "13", options: d("13", "17", "4", "11"), hint: "13。" },
        { question: "さんかくの 辺（へん）は いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "「さん」かく。" },
        { question: "しかくの 辺（へん）は いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "1つ"), hint: "「しかく」。" },
        { question: "「40 ＋ 40 ＝ 」 こたえは？", answer: "80", options: d("80", "44", "40", "100"), hint: "80。" },
        { question: "「100 － 50 ＝ 」 こたえは？", answer: "50", options: d("50", "100", "0", "150"), hint: "半分こだね。" },
        { question: "70は 10が いくつ？", answer: "7こ", options: d("7こ", "70こ", "1こ", "10こ"), hint: "ななこ。" },
        { question: "「22 ＋ 3 ＝ 」 こたえは？", answer: "25", options: d("25", "22", "23", "30"), hint: "25。" },
        { question: "「28 － 6 ＝ 」 こたえは？", answer: "22", options: d("22", "28", "6", "20"), hint: "22。" },
        { question: "100円で 80円の 消しゴムを 買いました。 おつりは？", answer: "20円", options: d("20円", "80円", "100円", "0円"), hint: "100 - 80。" },
        { question: "10円が 5こと 50円が 1こ。 あわせて いくら？", answer: "100円", options: d("100円", "50円", "60円", "51円"), hint: "50 + 50。" },
        { question: "「4 ＋ 9 ＝ 」 こたえは？", answer: "13", options: d("13", "12", "14", "15"), hint: "くりあがり。" },
        { question: "「12 － 7 ＝ 」 こたえは？", answer: "5", options: d("5", "4", "6", "3"), hint: "くりさがり。" },
        { question: "「8 ＋ 7 ＝ 」 こたえは？", answer: "15", options: d("15", "14", "16", "13"), hint: "くりあがり。" },
        { question: "「11 － 3 ＝ 」 こたえは？", answer: "8", options: d("8", "9", "7", "10"), hint: "くりさがり。" },
        { question: "「20 ＋ 30 ＋ 40 ＝ 」 こたえは？", answer: "90", options: d("90", "50", "70", "100"), hint: "じゅんに たそう。" },
        { question: "「100 － 20 － 30 ＝ 」 こたえは？", answer: "50", options: d("50", "80", "70", "0"), hint: "じゅんに ひこう。" },
        { question: "90は 10が いくつ？", answer: "9こ", options: d("9こ", "10こ", "1こ", "90こ"), hint: "きゅうこ。" },
        { question: "「5 ＋ 5 ＋ 5 ＝ 」 こたえは？", answer: "15", options: d("15", "10", "20", "555"), hint: "15。" },
        { question: "「10 ＋ 10 ＋ 10 ＝ 」 こたえは？", answer: "30", options: d("30", "10", "20", "100"), hint: "さんじゅう。" },
        { question: "「100 － 10 ＝ 」 こたえは？", answer: "90", options: d("90", "100", "80", "10"), hint: "90。" },
        { question: "「10 ＋ 90 ＝ 」 こたえは？", answer: "100", options: d("100", "90", "110", "10"), hint: "100。" },
        { question: "「55 － 5 ＝ 」 こたえは？", answer: "50", options: d("50", "55", "5", "60"), hint: "50。" },
        { question: "「42 ＋ 7 ＝ 」 こたえは？", answer: "49", options: d("49", "42", "40", "50"), hint: "49。" },
        { question: "「100 － 0 ＝ 」 こたえは？", answer: "100", options: d("100", "0", "99", "10"), hint: "かわらないよ。" },
        { question: "「1 ＋ 99 ＝ 」 こたえは？", answer: "100", options: d("100", "99", "1", "0"), hint: "100。" },
    ];

const splitIntoUnits = (problems: GeneralProblem[], unitCount: number): GeneralProblem[][] => {
    const chunkSize = Math.ceil(problems.length / unitCount);
    return Array.from({ length: unitCount }, (_, i) => problems.slice(i * chunkSize, (i + 1) * chunkSize));
};

const g1Term1Units = splitIntoUnits(MATH_G1_1, 6);
const g1Term2Units = splitIntoUnits(MATH_G1_2, 6);
const g1Term3Units = splitIntoUnits(MATH_G1_3, 6);

export const MATH_G1_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G1_U01: [
        { question: "まるが 3こ あります。かずで いうと？", answer: "3", options: d("3", "2", "4", "0"), hint: "ひとつずつ かぞえよう。", visual: { kind: 'dots', counts: [3], labels: ["まる"] } },
        { question: "おさらの うえに クッキーが ありません。かずで いうと？", answer: "0", options: d("0", "1", "10", "3"), hint: "なにも ない ときは 0。" },
        { question: "りんごが 5こ あります。さいごに よむ かずは？", answer: "5", options: d("5", "4", "6", "1"), hint: "さいごに よんだ かずが、ぜんぶの かず。", visual: { kind: 'dots', counts: [5], labels: ["りんご"] } },
        { question: "1、2、3、4、5 と ならんでいます。5の ひとつ まえは？", answer: "4", options: d("4", "5", "6", "3"), hint: "ひとつ もどって よもう。", visual: { kind: 'number_sequence', values: [1, 2, 3, 4, 5] } },
        { question: "あかい まるが 3こ、あおい まるが 2こ。おおいのは どちら？", answer: "あか", options: d("あか", "あお", "おなじ", "どちらでもない"), hint: "3こと 2こを くらべよう。", visual: { kind: 'dots', counts: [3, 2], labels: ["あか", "あお"] } },
        { question: "カードに 7 と かいてあります。7の つぎの かずは？", answer: "8", options: d("8", "6", "7", "9"), hint: "7のあとに よむ かず。" },
        { question: "4こ ある みかんを、1、2、3、4 と かぞえます。さいごの かずは？", answer: "4", options: d("4", "3", "5", "1"), hint: "かぞえた さいごの かずを えらぼう。", visual: { kind: 'dots', counts: [4], labels: ["みかん"] } },
        { question: "ゆびを 6ぽん かぞえました。かずで えらぶと？", answer: "6", options: d("6", "5", "4", "7"), hint: "ろく は 6。" },
        { question: "ほしが 9こ あります。かずで えらぶと？", answer: "9", options: d("9", "8", "10", "6"), hint: "ひとつずつ かぞえるよ。", visual: { kind: 'dots', counts: [9], labels: ["ほし"] } },
        { question: "1、3、5、7 の なかで、いちばん おおきい かずは？", answer: "7", options: d("7", "5", "3", "1"), hint: "あとに よむ かずほど おおきいよ。" },
        { question: "8、6、4、2 の なかで、いちばん ちいさい かずは？", answer: "2", options: d("2", "4", "6", "8"), hint: "すくない かずを えらぼう。" },
        { question: "さいころの めが 3、もうひとつも 3。くらべると？", answer: "おなじ", options: d("おなじ", "ちがう", "ひとつ おおい", "ひとつ すくない"), hint: "3と3は おなじ。" },
        { question: "1から 10まで かぞえるとき、6の つぎに よむ かずは？", answer: "7", options: d("7", "5", "6", "8"), hint: "6、7、8 と つづくよ。" },
        { question: "まるが 10こ あります。かずで えらぶと？", answer: "10", options: d("10", "9", "8", "1"), hint: "じゅう は 10。", visual: { kind: 'dots', counts: [10], labels: ["まる"] } },
        { question: "あさがおが 4つ、ひまわりが 4つ。どちらが おおい？", answer: "おなじ", options: d("おなじ", "あさがお", "ひまわり", "わからない"), hint: "4つと4つは おなじ。" },
        { question: "1、2、3、4 と ならんでいます。4の ひとつ まえは？", answer: "3", options: d("3", "4", "2", "5"), hint: "4の まえを みよう。", visual: { kind: 'number_sequence', values: [1, 2, 3, 4] } },
        { question: "まるが 2こ あります。かずで えらぶと？", answer: "2", options: d("2", "1", "3", "0"), hint: "ひとつ、ふたつ。", visual: { kind: 'dots', counts: [2], labels: ["まる"] } },
        { question: "バスに 5にん のっています。いまの にんずうは？", answer: "5にん", options: d("5にん", "0にん", "6にん", "4にん"), hint: "いま いる かずを えらぼう。" },
        { question: "1、2、3、4、5、6、7、8、9、10。10までに でてこない かずは？", answer: "11", options: d("11", "8", "10", "1"), hint: "10までの かずか みよう。" },
        { question: "はなが 6ぽん あります。かぞえる ときに たいせつな ことは？", answer: "1ぽんずつ じゅんに かぞえる", options: d("1ぽんずつ じゅんに かぞえる", "いそいで とばす", "さいごだけ よむ", "いろだけ みる"), hint: "とばさずに かぞえるよ。" },
    ], // かずとすうじ（10までのかず）
    MATH_G1_U02: [
        { question: "5は 2と なに？", answer: "3", options: d("3", "2", "4", "5"), hint: "2から かぞえて 5に なる かず。", visual: { kind: 'dots', counts: [2, 3], labels: ["2", "？"] } },
        { question: "6は 1と なに？", answer: "5", options: d("5", "4", "6", "1"), hint: "1と いくつで 6かな。", visual: { kind: 'dots', counts: [1, 5], labels: ["1", "？"] } },
        { question: "7は 3と なに？", answer: "4", options: d("4", "3", "5", "7"), hint: "3と 4で 7。" },
        { question: "8は 5と なに？", answer: "3", options: d("3", "2", "4", "5"), hint: "5から 8まで かぞえよう。" },
        { question: "9は 4と なに？", answer: "5", options: d("5", "4", "6", "9"), hint: "4と 5で 9。" },
        { question: "10は 6と なに？", answer: "4", options: d("4", "3", "5", "6"), hint: "10に なる くみあわせ。" },
        { question: "4は 1と なに？", answer: "3", options: d("3", "2", "1", "4"), hint: "1と 3で 4。" },
        { question: "3は 2と なに？", answer: "1", options: d("1", "2", "3", "0"), hint: "2の つぎが 3。" },
        { question: "10は 8と なに？", answer: "2", options: d("2", "1", "3", "8"), hint: "8から 10まで かぞえよう。" },
        { question: "9は 7と なに？", answer: "2", options: d("2", "1", "3", "7"), hint: "7、8、9 と かぞえるよ。" },
        { question: "6は 3と なに？", answer: "3", options: d("3", "2", "4", "6"), hint: "3と 3で 6。" },
        { question: "8は 4と なに？", answer: "4", options: d("4", "3", "5", "8"), hint: "4と 4で 8。" },
        { question: "7は 1と なに？", answer: "6", options: d("6", "5", "7", "1"), hint: "1と 6で 7。" },
        { question: "5は 0と なに？", answer: "5", options: d("5", "0", "4", "1"), hint: "0と あわせても かわらない。" },
        { question: "10は 5と なに？", answer: "5", options: d("5", "4", "6", "10"), hint: "5と 5で 10。" },
        { question: "2は 1と なに？", answer: "1", options: d("1", "2", "0", "3"), hint: "1と 1で 2。" },
        { question: "8は 2と なに？", answer: "6", options: d("6", "5", "7", "2"), hint: "2から 8まで かぞえよう。" },
        { question: "9は 6と なに？", answer: "3", options: d("3", "2", "4", "6"), hint: "6と 3で 9。" },
        { question: "7は 5と なに？", answer: "2", options: d("2", "1", "3", "5"), hint: "5の つぎを かぞえよう。" },
        { question: "10は 9と なに？", answer: "1", options: d("1", "0", "2", "9"), hint: "9の つぎは 10。" },
    ], // いくつといくつ
    MATH_G1_U03: [
        { question: "ころころ ころがる かたちは どれ？", answer: "ぼーる", options: d("ぼーる", "のーと", "つみきの はこ", "さんかくじょうぎ"), hint: "まるい かたちは ころがるよ。" },
        { question: "かどが ある かたちは どれ？", answer: "しかくい はこ", options: d("しかくい はこ", "ぼーる", "みかん", "びーだま"), hint: "かどを さがそう。" },
        { question: "さんかくに にている ものは？", answer: "さんかくじょうぎ", options: d("さんかくじょうぎ", "ぼーる", "こっぷ", "まるい さら"), hint: "3つの かどが あるよ。" },
        { question: "まるに にている ものは？", answer: "びーだま", options: d("びーだま", "のーと", "つくえ", "えんぴつの はこ"), hint: "まるくて ころがるよ。" },
        { question: "しかくに にている ものは？", answer: "のーと", options: d("のーと", "ぼーる", "みかん", "わっか"), hint: "かどが 4つ ある かたち。" },
        { question: "たいらな ところに すわりやすい かたちは？", answer: "はこ", options: d("はこ", "ぼーる", "びーだま", "たま"), hint: "ころがらない かたちを えらぼう。" },
        { question: "つみやすい かたちは どれ？", answer: "しかくい つみき", options: d("しかくい つみき", "ぼーる", "みかん", "びーだま"), hint: "たいらな ところが あると つみやすい。" },
        { question: "ころがりやすい ものは どれ？", answer: "たま", options: d("たま", "のーと", "はこ", "つくえ"), hint: "まるい ものを えらぼう。" },
        { question: "ながくて ころがる ものは？", answer: "えんぴつ", options: d("えんぴつ", "のーと", "けしごむ", "おりがみ"), hint: "まるい ところが あるよ。" },
        { question: "しかくい かみは どれ？", answer: "おりがみ", options: d("おりがみ", "ぼーる", "びーだま", "みかん"), hint: "かどが 4つ あるよ。" },
        { question: "まるい さらの かたちに ちかいのは？", answer: "まる", options: d("まる", "さんかく", "しかく", "ぎざぎざ"), hint: "さらの ふちは まるいね。" },
        { question: "やねの えに よく つかう かたちは？", answer: "さんかく", options: d("さんかく", "まる", "ながい まる", "ばつ"), hint: "おうちの やねを おもいうかべよう。" },
        { question: "はこの めんに よく ある かたちは？", answer: "しかく", options: d("しかく", "まる", "さんかく", "せん"), hint: "はこの ひらたい ところ。" },
        { question: "ぼーるを つみきの うえに おくと どうなりやすい？", answer: "ころがる", options: d("ころがる", "ぴったり とまる", "しかくに なる", "なくなる"), hint: "まるい ものは ころがるよ。" },
        { question: "はこを つくえに おくと どうなりやすい？", answer: "とまりやすい", options: d("とまりやすい", "すぐ ころがる", "まるくなる", "うく"), hint: "たいらな ところが あるよ。" },
        { question: "こっぷの くちの かたちに ちかいのは？", answer: "まる", options: d("まる", "さんかく", "しかく", "ほし"), hint: "うえから みると まるいね。" },
        { question: "さんかくの かどは いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "さんかくの さんは 3。" },
        { question: "しかくの かどは いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "0つ"), hint: "かどを かぞえよう。" },
        { question: "まるの かどは いくつ？", answer: "0つ", options: d("0つ", "1つ", "3つ", "4つ"), hint: "まるには かどが ないよ。" },
        { question: "かたちを くらべる とき、まず みると よいのは？", answer: "まるいか かどがあるか", options: d("まるいか かどがあるか", "いろだけ", "なまえの ながさ", "おと"), hint: "かたちの とくちょうを みよう。" },
    ], // かたちあそび
    MATH_G1_U04: [
        { question: "ねこ、いぬ、うさぎ。まえから 2ばんめは？", answer: "いぬ", options: d("いぬ", "ねこ", "うさぎ", "2"), hint: "まえから 1、2 と かぞえよう。" },
        { question: "あか、あお、きいろ、みどり。3ばんめは？", answer: "きいろ", options: d("きいろ", "あか", "あお", "みどり"), hint: "じゅんばんに よもう。" },
        { question: "1、2、3、4、5。4ばんめの かずは？", answer: "4", options: d("4", "3", "5", "2"), hint: "4ばんめまで かぞえよう。", visual: { kind: 'number_sequence', values: [1, 2, 3, 4, 5] } },
        { question: "りんご、みかん、ばなな。さいしょは？", answer: "りんご", options: d("りんご", "みかん", "ばなな", "なし"), hint: "いちばん まえを みよう。" },
        { question: "りんご、みかん、ばなな。さいごは？", answer: "ばなな", options: d("ばなな", "りんご", "みかん", "なし"), hint: "いちばん うしろを みよう。" },
        { question: "まる、さんかく、しかく、ほし。2ばんめは？", answer: "さんかく", options: d("さんかく", "まる", "しかく", "ほし"), hint: "まえから 2ばんめ。" },
        { question: "まる、さんかく、しかく、ほし。4ばんめは？", answer: "ほし", options: d("ほし", "しかく", "さんかく", "まる"), hint: "まえから 4ばんめ。" },
        { question: "あ、い、う、え、お。3ばんめは？", answer: "う", options: d("う", "い", "え", "お"), hint: "あ、い、う。" },
        { question: "あ、い、う、え、お。5ばんめは？", answer: "お", options: d("お", "え", "う", "あ"), hint: "さいごまで かぞえよう。" },
        { question: "1、2、3、4。1ばんめの かずは？", answer: "1", options: d("1", "2", "3", "4"), hint: "さいしょの かず。" },
        { question: "1、2、3、4。さいごの かずは？", answer: "4", options: d("4", "3", "2", "1"), hint: "いちばん うしろ。" },
        { question: "あか、あお、あか、あお。2ばんめの いろは？", answer: "あお", options: d("あお", "あか", "きいろ", "みどり"), hint: "2つめを みよう。" },
        { question: "くるま、ばす、でんしゃ、ひこうき。でんしゃは なんばんめ？", answer: "3ばんめ", options: d("3ばんめ", "2ばんめ", "4ばんめ", "1ばんめ"), hint: "まえから かぞえよう。" },
        { question: "さくら、うめ、もも。うめは なんばんめ？", answer: "2ばんめ", options: d("2ばんめ", "1ばんめ", "3ばんめ", "4ばんめ"), hint: "さくらの つぎ。" },
        { question: "いすが 5こ ならんでいます。まえから 5ばんめは どこ？", answer: "いちばん うしろ", options: d("いちばん うしろ", "いちばん まえ", "まんなか", "2ばんめ"), hint: "5こならんだ さいご。" },
        { question: "4にん ならんでいます。まえから 1ばんめは どこ？", answer: "いちばん まえ", options: d("いちばん まえ", "いちばん うしろ", "3ばんめ", "4ばんめ"), hint: "1ばんめは さいしょ。" },
        { question: "あか、しろ、くろ。くろは なんばんめ？", answer: "3ばんめ", options: d("3ばんめ", "2ばんめ", "1ばんめ", "4ばんめ"), hint: "さいごまで かぞえよう。" },
        { question: "はと、からす、すずめ、つばめ。からすは なんばんめ？", answer: "2ばんめ", options: d("2ばんめ", "1ばんめ", "3ばんめ", "4ばんめ"), hint: "はとの つぎ。" },
        { question: "1、3、5、7。5は なんばんめ？", answer: "3ばんめ", options: d("3ばんめ", "2ばんめ", "4ばんめ", "5ばんめ"), hint: "ならびの じゅんばんを かぞえよう。" },
        { question: "なんばんめを きく ときに たいせつなのは？", answer: "どこから かぞえるか", options: d("どこから かぞえるか", "いろだけ", "おおきさだけ", "おとだけ"), hint: "まえからか、うしろからかを みよう。" },
    ], // なんばんめ
    MATH_G1_U05: [
        { question: "りんごが 2こ、みかんが 3こ。あわせて いくつ？", answer: "5こ", options: d("5こ", "4こ", "6こ", "3こ"), hint: "2と 3を あわせよう。", visual: { kind: 'dots', counts: [2, 3], labels: ["りんご", "みかん"] } },
        { question: "あかい まるが 1こ、あおい まるが 4こ。あわせて いくつ？", answer: "5こ", options: d("5こ", "4こ", "6こ", "1こ"), hint: "1と 4で 5。", visual: { kind: 'dots', counts: [1, 4], labels: ["あか", "あお"] } },
        { question: "えんぴつが 3ぼん、ぺんが 2ほん。あわせて なんぼん？", answer: "5ほん", options: d("5ほん", "4ほん", "6ほん", "3ぼん"), hint: "3と 2を あわせるよ。" },
        { question: "あめが 4こ、ぐみが 1こ。あわせて いくつ？", answer: "5こ", options: d("5こ", "4こ", "6こ", "1こ"), hint: "4の つぎが 5。" },
        { question: "はなが 2ほん、はっぱが 2まい。あわせて いくつ？", answer: "4つ", options: d("4つ", "2つ", "3つ", "5つ"), hint: "2と 2で 4。" },
        { question: "ぼーるが 5こ、ぼーるが 1こ。あわせて いくつ？", answer: "6こ", options: d("6こ", "5こ", "4こ", "7こ"), hint: "5の つぎは 6。" },
        { question: "しろい いしが 3こ、くろい いしが 3こ。あわせて いくつ？", answer: "6こ", options: d("6こ", "5こ", "3こ", "7こ"), hint: "3と 3で 6。" },
        { question: "ねこが 1ぴき、いぬが 2ひき。あわせて なんびき？", answer: "3びき", options: d("3びき", "2ひき", "1ぴき", "4ひき"), hint: "1、2、3 と かぞえるよ。" },
        { question: "まるが 6こ、さんかくが 2こ。あわせて いくつ？", answer: "8こ", options: d("8こ", "6こ", "7こ", "9こ"), hint: "6から 2つ かぞえたすよ。" },
        { question: "あかが 5こ、あおが 5こ。あわせて いくつ？", answer: "10こ", options: d("10こ", "9こ", "5こ", "8こ"), hint: "5と 5で 10。" },
        { question: "きのこが 2こ、どんぐりが 6こ。あわせて いくつ？", answer: "8こ", options: d("8こ", "7こ", "6こ", "9こ"), hint: "2と 6を あわせよう。" },
        { question: "おはじきが 4こ、びーだまが 4こ。あわせて いくつ？", answer: "8こ", options: d("8こ", "7こ", "4こ", "9こ"), hint: "4と 4で 8。" },
        { question: "くるまが 3だい、ばすが 1だい。あわせて なんだい？", answer: "4だい", options: d("4だい", "3だい", "5だい", "2だい"), hint: "3の つぎが 4。" },
        { question: "さらが 2まい、こっぷが 5こ。あわせて いくつ？", answer: "7つ", options: d("7つ", "6つ", "5つ", "8つ"), hint: "2と 5で 7。" },
        { question: "つみきが 1こ、つみきが 8こ。あわせて いくつ？", answer: "9こ", options: d("9こ", "8こ", "10こ", "7こ"), hint: "8の つぎは 9。" },
        { question: "かえるが 4ひき、かめが 2ひき。あわせて なんびき？", answer: "6ぴき", options: d("6ぴき", "5ひき", "4ひき", "7ひき"), hint: "4と 2で 6。" },
        { question: "みどりの まるが 7こ、きいろの まるが 1こ。あわせて いくつ？", answer: "8こ", options: d("8こ", "7こ", "9こ", "6こ"), hint: "7の つぎは 8。" },
        { question: "みかんが 3こ、りんごが 4こ。あわせて いくつ？", answer: "7こ", options: d("7こ", "6こ", "8こ", "4こ"), hint: "3と 4で 7。" },
        { question: "どんぐりが 2こ、まつぼっくりが 7こ。あわせて いくつ？", answer: "9こ", options: d("9こ", "8こ", "7こ", "10こ"), hint: "2と 7で 9。" },
        { question: "あわせて いくつを きく とき、することは？", answer: "ぜんぶ かぞえる", options: d("ぜんぶ かぞえる", "すくない ほうだけ みる", "いろだけ みる", "さいごを けす"), hint: "2つの かずを あわせるよ。" },
    ], // あわせていくつ（たしざん）
    MATH_G1_U06: [
        { question: "あめが 3こ あります。2こ ふえると いくつ？", answer: "5こ", options: d("5こ", "3こ", "2こ", "6こ"), hint: "ふえると たしざん。", visual: { kind: 'dots', counts: [3, 2], labels: ["はじめ", "ふえる"] } },
        { question: "りんごが 4こ あります。1こ ふえると いくつ？", answer: "5こ", options: d("5こ", "4こ", "6こ", "1こ"), hint: "4の つぎは 5。" },
        { question: "ぼーるが 2こ あります。3こ ふえると いくつ？", answer: "5こ", options: d("5こ", "4こ", "2こ", "6こ"), hint: "2から 3つ かぞえたすよ。" },
        { question: "はなが 5ほん あります。2ほん ふえると なんぼん？", answer: "7ほん", options: d("7ほん", "6ほん", "5ほん", "8ほん"), hint: "5、6、7。" },
        { question: "ねこが 1ぴき います。3びき ふえると なんびき？", answer: "4ひき", options: d("4ひき", "3びき", "1ぴき", "5ひき"), hint: "1と 3で 4。" },
        { question: "まるが 6こ あります。1こ ふえると いくつ？", answer: "7こ", options: d("7こ", "6こ", "8こ", "5こ"), hint: "6の つぎは 7。" },
        { question: "おはじきが 4こ あります。4こ ふえると いくつ？", answer: "8こ", options: d("8こ", "7こ", "4こ", "9こ"), hint: "4と 4で 8。" },
        { question: "つみきが 7こ あります。2こ ふえると いくつ？", answer: "9こ", options: d("9こ", "8こ", "7こ", "10こ"), hint: "7から 2つ かぞえたすよ。" },
        { question: "こいしが 8こ あります。1こ ふえると いくつ？", answer: "9こ", options: d("9こ", "8こ", "10こ", "7こ"), hint: "8の つぎは 9。" },
        { question: "ほしが 5こ あります。5こ ふえると いくつ？", answer: "10こ", options: d("10こ", "9こ", "5こ", "8こ"), hint: "5と 5で 10。" },
        { question: "えんぴつが 2ほん あります。1ぽん ふえると なんぼん？", answer: "3ぼん", options: d("3ぼん", "2ほん", "1ぽん", "4ほん"), hint: "2の つぎは 3。" },
        { question: "こっぷが 3こ あります。4こ ふえると いくつ？", answer: "7こ", options: d("7こ", "6こ", "3こ", "8こ"), hint: "3と 4で 7。" },
        { question: "いすが 6こ あります。2こ ふえると いくつ？", answer: "8こ", options: d("8こ", "7こ", "6こ", "9こ"), hint: "6、7、8。" },
        { question: "さかなが 1ぴき います。5ひき ふえると なんびき？", answer: "6ぴき", options: d("6ぴき", "5ひき", "1ぴき", "7ひき"), hint: "1と 5で 6。" },
        { question: "みかんが 7こ あります。3こ ふえると いくつ？", answer: "10こ", options: d("10こ", "9こ", "7こ", "8こ"), hint: "7から 3つ かぞえるよ。" },
        { question: "あかい まるが 2こ あります。6こ ふえると いくつ？", answer: "8こ", options: d("8こ", "7こ", "6こ", "9こ"), hint: "2と 6で 8。" },
        { question: "けしごむが 4こ あります。3こ ふえると いくつ？", answer: "7こ", options: d("7こ", "6こ", "4こ", "8こ"), hint: "4、5、6、7。" },
        { question: "はっぱが 5まい あります。3まい ふえると なんまい？", answer: "8まい", options: d("8まい", "7まい", "5まい", "9まい"), hint: "5から 3つ かぞえたすよ。" },
        { question: "びーだまが 6こ あります。4こ ふえると いくつ？", answer: "10こ", options: d("10こ", "9こ", "8こ", "6こ"), hint: "6と 4で 10。" },
        { question: "ふえると いくつを きく とき、することは？", answer: "ふえた ぶんを たす", options: d("ふえた ぶんを たす", "ふえた ぶんを けす", "はじめの かずだけ みる", "いろだけ みる"), hint: "ふえる は たす。" },
    ], // ふえるといくつ（たしざん）
    MATH_G1_U07: [
        { question: "あめが 5こ あります。2こ たべると のこりは？", answer: "3こ", options: d("3こ", "2こ", "5こ", "7こ"), hint: "たべると へるよ。" },
        { question: "りんごが 6こ あります。1こ とると のこりは？", answer: "5こ", options: d("5こ", "6こ", "1こ", "7こ"), hint: "6の ひとつ まえ。" },
        { question: "ぼーるが 4こ あります。3こ つかうと のこりは？", answer: "1こ", options: d("1こ", "3こ", "4こ", "7こ"), hint: "4こから 3こ へるよ。" },
        { question: "はなが 8ほん あります。2ほん あげると のこりは？", answer: "6ぽん", options: d("6ぽん", "8ほん", "2ほん", "10ぽん"), hint: "8から 2つ もどるよ。" },
        { question: "おはじきが 7こ あります。4こ しまうと のこりは？", answer: "3こ", options: d("3こ", "4こ", "7こ", "2こ"), hint: "のこりを かぞえよう。" },
        { question: "みかんが 9こ あります。5こ たべると のこりは？", answer: "4こ", options: d("4こ", "5こ", "9こ", "14こ"), hint: "9こから 5こ へるよ。" },
        { question: "つみきが 10こ あります。1こ とると のこりは？", answer: "9こ", options: d("9こ", "10こ", "1こ", "8こ"), hint: "10の ひとつ まえ。" },
        { question: "こっぷが 6こ あります。6こ つかうと のこりは？", answer: "0こ", options: d("0こ", "6こ", "1こ", "12こ"), hint: "ぜんぶ つかうと 0。" },
        { question: "まるが 3こ あります。1こ けすと のこりは？", answer: "2こ", options: d("2こ", "3こ", "1こ", "4こ"), hint: "3の ひとつ まえではなく、1こ へった のこり。" },
        { question: "びーだまが 8こ あります。3こ しまうと のこりは？", answer: "5こ", options: d("5こ", "3こ", "8こ", "6こ"), hint: "8から 3つ もどるよ。" },
        { question: "えんぴつが 5ほん あります。5ほん しまうと のこりは？", answer: "0ほん", options: d("0ほん", "5ほん", "1ぽん", "10ぽん"), hint: "ぜんぶ なくなるよ。" },
        { question: "さかなが 7ひき います。2ひき にげると のこりは？", answer: "5ひき", options: d("5ひき", "7ひき", "2ひき", "9ひき"), hint: "にげると へるよ。" },
        { question: "どんぐりが 10こ あります。4こ ひろうのを やめると のこりは？", answer: "6こ", options: d("6こ", "4こ", "10こ", "14こ"), hint: "10こから 4こ へるよ。" },
        { question: "けしごむが 4こ あります。1こ なくなると のこりは？", answer: "3こ", options: d("3こ", "4こ", "1こ", "5こ"), hint: "4から 1つ へるよ。" },
        { question: "いすが 9こ あります。2こ かたづけると のこりは？", answer: "7こ", options: d("7こ", "9こ", "2こ", "11こ"), hint: "9から 2つ もどるよ。" },
        { question: "くるまが 6だい あります。3だい でかけると のこりは？", answer: "3だい", options: d("3だい", "6だい", "2だい", "9だい"), hint: "6から 3つ へるよ。" },
        { question: "ねこが 5ひき います。1ぴき かえると のこりは？", answer: "4ひき", options: d("4ひき", "5ひき", "1ぴき", "6ぴき"), hint: "5から 1つ へるよ。" },
        { question: "はっぱが 8まい あります。8まい とると のこりは？", answer: "0まい", options: d("0まい", "8まい", "1まい", "16まい"), hint: "ぜんぶ とると 0。" },
        { question: "あかい まるが 7こ あります。6こ けすと のこりは？", answer: "1こ", options: d("1こ", "6こ", "7こ", "13こ"), hint: "ひとつ だけ のこるよ。" },
        { question: "のこりを きく とき、することは？", answer: "へった あとを かぞえる", options: d("へった あとを かぞえる", "ふえた ぶんを たす", "いろだけ みる", "さいしょだけ いう"), hint: "のこりは へった あと。" },
    ], // のこりはいくつ（ひきざん）
    MATH_G1_U08: [
        { question: "りんごが 5こ、みかんが 3こ。ちがいは なんこ？", answer: "2こ", options: d("2こ", "3こ", "5こ", "8こ"), hint: "おおい ほうから すくない ほうを くらべよう。" },
        { question: "あかが 4こ、あおが 1こ。ちがいは？", answer: "3こ", options: d("3こ", "4こ", "1こ", "5こ"), hint: "4こと 1この ちがい。" },
        { question: "ねこが 6ひき、いぬが 2ひき。ねこは なんびき おおい？", answer: "4ひき", options: d("4ひき", "6ひき", "2ひき", "8ひき"), hint: "6と 2の ちがい。" },
        { question: "まるが 7こ、さんかくが 5こ。ちがいは？", answer: "2こ", options: d("2こ", "5こ", "7こ", "12こ"), hint: "ならべて くらべよう。" },
        { question: "つみきが 9こ、はこが 4こ。つみきは なんこ おおい？", answer: "5こ", options: d("5こ", "4こ", "9こ", "13こ"), hint: "9と 4の ちがい。" },
        { question: "あめが 3こ、ぐみが 3こ。ちがいは？", answer: "0こ", options: d("0こ", "3こ", "6こ", "1こ"), hint: "おなじ かずの ちがいは 0。" },
        { question: "いすが 8こ、つくえが 6こ。ちがいは？", answer: "2こ", options: d("2こ", "6こ", "8こ", "14こ"), hint: "8と 6を くらべよう。" },
        { question: "はなが 10ぽん、はっぱが 7まい。ちがいは？", answer: "3つ", options: d("3つ", "7つ", "10つ", "17つ"), hint: "10と 7の ちがい。" },
        { question: "ぼーるが 5こ、こっぷが 2こ。ぼーるは なんこ おおい？", answer: "3こ", options: d("3こ", "2こ", "5こ", "7こ"), hint: "5から 2を くらべよう。" },
        { question: "しろが 1こ、くろが 6こ。くろは なんこ おおい？", answer: "5こ", options: d("5こ", "6こ", "1こ", "7こ"), hint: "6と 1の ちがい。" },
        { question: "さかなが 4ひき、かめが 4ひき。ちがいは？", answer: "0ひき", options: d("0ひき", "4ひき", "8ひき", "1ぴき"), hint: "おなじ かず。" },
        { question: "えんぴつが 9ほん、けしごむが 8こ。ちがいは？", answer: "1つ", options: d("1つ", "8つ", "9つ", "17つ"), hint: "9の ひとつ まえが 8。" },
        { question: "ばすが 2だい、くるまが 7だい。くるまは なんだい おおい？", answer: "5だい", options: d("5だい", "7だい", "2だい", "9だい"), hint: "7と 2の ちがい。" },
        { question: "ほしが 10こ、つきが 1こ。ちがいは？", answer: "9こ", options: d("9こ", "10こ", "1こ", "11こ"), hint: "10と 1の ちがい。" },
        { question: "みどりが 6こ、きいろが 4こ。ちがいは？", answer: "2こ", options: d("2こ", "4こ", "6こ", "10こ"), hint: "おおい ぶんを みよう。" },
        { question: "うさぎが 8ひき、とりが 5わ。うさぎは なんびき おおい？", answer: "3びき", options: d("3びき", "5わ", "8ひき", "13びき"), hint: "8と 5の ちがい。" },
        { question: "おはじきが 7こ、びーだまが 7こ。ちがいは？", answer: "0こ", options: d("0こ", "7こ", "14こ", "1こ"), hint: "おなじ かずなら ちがいは 0。" },
        { question: "あかい はなが 9ほん、しろい はなが 6ぽん。ちがいは？", answer: "3ぼん", options: d("3ぼん", "6ぽん", "9ほん", "15ほん"), hint: "9と 6を くらべよう。" },
        { question: "たまごが 4こ、からが 2こ。たまごは なんこ おおい？", answer: "2こ", options: d("2こ", "4こ", "6こ", "1こ"), hint: "4と 2の ちがい。" },
        { question: "ちがいを きく とき、することは？", answer: "おおい ほうと すくない ほうを くらべる", options: d("おおい ほうと すくない ほうを くらべる", "ぜんぶ あわせる", "いろだけ みる", "なまえだけ よむ"), hint: "ちがいは くらべて みつけるよ。" },
    ], // ちがいはいくつ（ひきざん）
    MATH_G1_U09: [
        { question: "10の つぎの かずは？", answer: "11", options: d("11", "10", "12", "9"), hint: "10、11、12 と つづくよ。" },
        { question: "12の つぎの かずは？", answer: "13", options: d("13", "12", "14", "11"), hint: "ひとつ おおきい かず。" },
        { question: "15の ひとつ まえは？", answer: "14", options: d("14", "15", "16", "13"), hint: "ひとつ もどろう。" },
        { question: "19の つぎの かずは？", answer: "20", options: d("20", "19", "18", "21"), hint: "20までの さいごの かず。" },
        { question: "11、12、13、？。？に はいる かずは？", answer: "14", options: d("14", "13", "15", "12"), hint: "じゅんに かぞえよう。", visual: { kind: 'number_sequence', values: [11, 12, 13, 14] } },
        { question: "16、17、18、？。？に はいる かずは？", answer: "19", options: d("19", "18", "20", "17"), hint: "18の つぎ。" },
        { question: "20の ひとつ まえは？", answer: "19", options: d("19", "20", "18", "21"), hint: "20から ひとつ もどるよ。" },
        { question: "13と 15の あいだの かずは？", answer: "14", options: d("14", "13", "15", "16"), hint: "13、14、15。" },
        { question: "17と 19の あいだの かずは？", answer: "18", options: d("18", "17", "19", "20"), hint: "17、18、19。" },
        { question: "10と 1で できる かずは？", answer: "11", options: d("11", "10", "1", "12"), hint: "じゅういち。" },
        { question: "10と 5で できる かずは？", answer: "15", options: d("15", "10", "5", "14"), hint: "じゅうご。" },
        { question: "10と 8で できる かずは？", answer: "18", options: d("18", "10", "8", "19"), hint: "じゅうはち。" },
        { question: "14は 10と なに？", answer: "4", options: d("4", "10", "14", "5"), hint: "じゅう と 4。" },
        { question: "16は 10と なに？", answer: "6", options: d("6", "10", "16", "5"), hint: "じゅう と 6。" },
        { question: "18は 10と なに？", answer: "8", options: d("8", "10", "18", "9"), hint: "じゅう と 8。" },
        { question: "20までの かずで、いちばん おおきいのは？", answer: "20", options: d("20", "19", "10", "11"), hint: "20までの さいご。" },
        { question: "11、13、15 の なかで いちばん ちいさいのは？", answer: "11", options: d("11", "13", "15", "10"), hint: "はじめに でてくる かず。" },
        { question: "12、18、16 の なかで いちばん おおきいのは？", answer: "18", options: d("18", "16", "12", "20"), hint: "くらべて みよう。" },
        { question: "20までに でてくる かずは どれ？", answer: "17", options: d("17", "21", "30", "100"), hint: "20より ちいさい かず。" },
        { question: "20までの かずを よむ とき、たいせつな ことは？", answer: "じゅんに よむ", options: d("じゅんに よむ", "とばして よむ", "おおきい かずだけ よむ", "いろを よむ"), hint: "10の あとの かずも じゅんに。" },
    ], // 20までのかず
    MATH_G1_U10: [
        { question: "ながい はりが 12、みじかい はりが 3。なんじ？", answer: "3じ", options: d("3じ", "12じ", "3じはん", "6じ"), hint: "みじかい はりを みよう。", visual: { kind: 'clock', hour: 3, minute: 0 } },
        { question: "ながい はりが 12、みじかい はりが 8。なんじ？", answer: "8じ", options: d("8じ", "12じ", "8じはん", "6じ"), hint: "12は ちょうど。" },
        { question: "ながい はりが 6、みじかい はりが 2の あたり。なんじはん？", answer: "2じはん", options: d("2じはん", "2じ", "6じ", "3じ"), hint: "ながい はりが 6は はん。", visual: { kind: 'clock', hour: 2, minute: 30 } },
        { question: "ながい はりが 6、みじかい はりが 9の あたり。なんじはん？", answer: "9じはん", options: d("9じはん", "9じ", "6じ", "10じ"), hint: "はんは 30ぷん。" },
        { question: "おひるごはんを たべる ころの 12じ。ながい はりは どこ？", answer: "12", options: d("12", "6", "3", "9"), hint: "ちょうどの ときは 12。" },
        { question: "1じ ちょうど。ながい はりは どこ？", answer: "12", options: d("12", "1", "6", "3"), hint: "ちょうどは ながい はりが 12。" },
        { question: "4じはん。ながい はりは どこ？", answer: "6", options: d("6", "12", "4", "3"), hint: "はんは ながい はりが 6。" },
        { question: "7じはん。みじかい はりは どの あたり？", answer: "7と8の あいだ", options: d("7と8の あいだ", "12の ところ", "6の ところ", "1と2の あいだ"), hint: "7じを すぎて 8じに むかうよ。" },
        { question: "5じ ちょうど。みじかい はりは どこ？", answer: "5", options: d("5", "12", "6", "4"), hint: "みじかい はりが じを しめすよ。" },
        { question: "10じ ちょうど。みじかい はりは どこ？", answer: "10", options: d("10", "12", "6", "11"), hint: "みじかい はりを みよう。" },
        { question: "ながい はりが 12なら、よみかたは？", answer: "ちょうど", options: d("ちょうど", "はん", "すこし まえ", "わからない"), hint: "12は ちょうど。" },
        { question: "ながい はりが 6なら、よみかたは？", answer: "はん", options: d("はん", "ちょうど", "おひる", "よる"), hint: "6は はん。" },
        { question: "6じ ちょうど。ながい はりは？", answer: "12", options: d("12", "6", "3", "9"), hint: "ちょうどは 12。" },
        { question: "6じはん。ながい はりは？", answer: "6", options: d("6", "12", "3", "9"), hint: "はんは 6。" },
        { question: "2じと 2じはん。ながい はりが 12なのは？", answer: "2じ", options: d("2じ", "2じはん", "どちらも", "どちらでもない"), hint: "ちょうどの とき。" },
        { question: "3じと 3じはん。ながい はりが 6なのは？", answer: "3じはん", options: d("3じはん", "3じ", "どちらも", "1じ"), hint: "はんの とき。" },
        { question: "とけいで なんじを みる とき、まず みる はりは？", answer: "みじかい はり", options: d("みじかい はり", "ながい はりだけ", "いろ", "おと"), hint: "みじかい はりが じを しめすよ。" },
        { question: "とけいで はんを みる とき、ながい はりは どこ？", answer: "6", options: d("6", "12", "3", "9"), hint: "はんは 6。" },
        { question: "11じ ちょうど。ながい はりは 12、みじかい はりは？", answer: "11", options: d("11", "12", "6", "10"), hint: "じは みじかい はり。" },
        { question: "なんじ ちょうどを よむ とき、ながい はりは どこに ある？", answer: "12", options: d("12", "6", "3", "9"), hint: "ちょうどは 12。" },
    ], // なんじ（とけい）
    MATH_G1_U11: [
        { question: "えんぴつAは 5cm、えんぴつBは 3cm。ながいのは？", answer: "A", options: d("A", "B", "おなじ", "わからない"), hint: "5と 3を くらべよう。" },
        { question: "ひもAは 2cm、ひもBは 6cm。ながいのは？", answer: "B", options: d("B", "A", "おなじ", "どちらでもない"), hint: "6の ほうが ながい。" },
        { question: "くれよんAは 4cm、くれよんBは 4cm。ながさは？", answer: "おなじ", options: d("おなじ", "Aが ながい", "Bが ながい", "くらべられない"), hint: "4と 4は おなじ。" },
        { question: "5cmと 7cm。ながいのは？", answer: "7cm", options: d("7cm", "5cm", "おなじ", "2cm"), hint: "おおきい かずが ながい。" },
        { question: "8cmと 3cm。みじかいのは？", answer: "3cm", options: d("3cm", "8cm", "おなじ", "5cm"), hint: "ちいさい かずが みじかい。" },
        { question: "はしから はしまで そろえて くらべるのは なぜ？", answer: "ながさが わかりやすいから", options: d("ながさが わかりやすいから", "いろが かわるから", "おとが でるから", "かずが ふえるから"), hint: "はじを そろえるよ。" },
        { question: "ひもAは 9cm、ひもBは 6cm。Aは Bより？", answer: "ながい", options: d("ながい", "みじかい", "おなじ", "まるい"), hint: "9は 6より おおきい。" },
        { question: "りぼんAは 1cm、りぼんBは 5cm。Aは Bより？", answer: "みじかい", options: d("みじかい", "ながい", "おなじ", "ふとい"), hint: "1は 5より ちいさい。" },
        { question: "3cm、6cm、2cm。いちばん ながいのは？", answer: "6cm", options: d("6cm", "3cm", "2cm", "おなじ"), hint: "いちばん おおきい かず。" },
        { question: "3cm、6cm、2cm。いちばん みじかいのは？", answer: "2cm", options: d("2cm", "3cm", "6cm", "おなじ"), hint: "いちばん ちいさい かず。" },
        { question: "ながさを くらべる とき、まず そろえるのは？", answer: "はじ", options: d("はじ", "いろ", "なまえ", "おと"), hint: "はしから くらべよう。" },
        { question: "ぼうAは 7cm、ぼうBは 7cm。どちらが ながい？", answer: "おなじ", options: d("おなじ", "A", "B", "どちらでもない"), hint: "7と 7は おなじ。" },
        { question: "Aは 10cm、Bは 8cm。ながいのは？", answer: "A", options: d("A", "B", "おなじ", "8cm"), hint: "10は 8より おおきい。" },
        { question: "Aは 4cm、Bは 9cm。みじかいのは？", answer: "A", options: d("A", "B", "おなじ", "9cm"), hint: "4は 9より ちいさい。" },
        { question: "ながい じゅんに ならべる とき、さいしょは？ 2cm、5cm、8cm", answer: "8cm", options: d("8cm", "5cm", "2cm", "おなじ"), hint: "ながい じゅんは おおきい かずから。" },
        { question: "みじかい じゅんに ならべる とき、さいしょは？ 2cm、5cm、8cm", answer: "2cm", options: d("2cm", "5cm", "8cm", "おなじ"), hint: "みじかい じゅんは ちいさい かずから。" },
        { question: "けしごむAは 3cm、けしごむBは 5cm。Bは Aより？", answer: "ながい", options: d("ながい", "みじかい", "おなじ", "まるい"), hint: "5は 3より おおきい。" },
        { question: "ながさを くらべる とき、みるものは？", answer: "どちらが ながいか", options: d("どちらが ながいか", "どちらが あかいか", "どちらが おいしいか", "どちらが うるさいか"), hint: "ながさの くらべかた。" },
        { question: "Aは 6cm、Bは 2cm、Cは 4cm。いちばん ながいのは？", answer: "A", options: d("A", "B", "C", "おなじ"), hint: "6cmが いちばん ながい。" },
        { question: "Aは 6cm、Bは 2cm、Cは 4cm。いちばん みじかいのは？", answer: "B", options: d("B", "A", "C", "おなじ"), hint: "2cmが いちばん みじかい。" },
    ], // ながさくらべ
    MATH_G1_U12: [
        { question: "こっぷAは 3はい、こっぷBは 5はい はいります。たくさん はいるのは？", answer: "B", options: d("B", "A", "おなじ", "わからない"), hint: "5はいの ほうが おおい。" },
        { question: "いれものAは 6ぱい、いれものBは 2はい。たくさん はいるのは？", answer: "A", options: d("A", "B", "おなじ", "2はい"), hint: "6は 2より おおきい。" },
        { question: "Aも Bも 4はい はいります。かさは？", answer: "おなじ", options: d("おなじ", "Aが おおい", "Bが おおい", "くらべられない"), hint: "4と 4は おなじ。" },
        { question: "2はいと 7はい。たくさん はいるのは？", answer: "7はい", options: d("7はい", "2はい", "おなじ", "5はい"), hint: "おおきい かず。" },
        { question: "8はいと 3はい。すくないのは？", answer: "3はい", options: d("3はい", "8はい", "おなじ", "5はい"), hint: "ちいさい かず。" },
        { question: "かさを くらべる とき、みるものは？", answer: "どちらが たくさん はいるか", options: d("どちらが たくさん はいるか", "どちらが ながいか", "どちらが あかいか", "どちらが おもいか"), hint: "みずが どれだけ はいるか。" },
        { question: "ばけつAは 9はい、ばけつBは 5はい。Aは Bより？", answer: "たくさん はいる", options: d("たくさん はいる", "すくない", "おなじ", "みじかい"), hint: "9は 5より おおい。" },
        { question: "こっぷAは 1ぱい、こっぷBは 6ぱい。Aは Bより？", answer: "すくない", options: d("すくない", "たくさん はいる", "おなじ", "ながい"), hint: "1は 6より すくない。" },
        { question: "3はい、6ぱい、2はい。いちばん たくさん はいるのは？", answer: "6ぱい", options: d("6ぱい", "3はい", "2はい", "おなじ"), hint: "いちばん おおきい かず。" },
        { question: "3はい、6ぱい、2はい。いちばん すくないのは？", answer: "2はい", options: d("2はい", "3はい", "6ぱい", "おなじ"), hint: "いちばん ちいさい かず。" },
        { question: "おなじ こっぷで くらべると よいのは なぜ？", answer: "かさが わかりやすいから", options: d("かさが わかりやすいから", "いろが かわるから", "みずが ふえるから", "おとが でるから"), hint: "おなじ こっぷなら くらべやすい。" },
        { question: "Aは 7はい、Bは 7はい。どちらが たくさん はいる？", answer: "おなじ", options: d("おなじ", "A", "B", "どちらでもない"), hint: "7と 7は おなじ。" },
        { question: "Aは 10ぱい、Bは 8ぱい。たくさん はいるのは？", answer: "A", options: d("A", "B", "おなじ", "8ぱい"), hint: "10は 8より おおい。" },
        { question: "Aは 4はい、Bは 9はい。すくないのは？", answer: "A", options: d("A", "B", "おなじ", "9はい"), hint: "4は 9より すくない。" },
        { question: "たくさん はいる じゅんに ならべる とき、さいしょは？ 2はい、5はい、8はい", answer: "8はい", options: d("8はい", "5はい", "2はい", "おなじ"), hint: "おおい じゅん。" },
        { question: "すくない じゅんに ならべる とき、さいしょは？ 2はい、5はい、8はい", answer: "2はい", options: d("2はい", "5はい", "8はい", "おなじ"), hint: "すくない じゅん。" },
        { question: "びんAは 3はい、びんBは 5はい。Bは Aより？", answer: "たくさん はいる", options: d("たくさん はいる", "すくない", "おなじ", "みじかい"), hint: "5は 3より おおい。" },
        { question: "かさを くらべる とき、たいせつなのは？", answer: "おなじ こっぷで かぞえる", options: d("おなじ こっぷで かぞえる", "いろだけ みる", "なまえだけ よむ", "はやく いれる"), hint: "おなじ もので くらべよう。" },
        { question: "Aは 6ぱい、Bは 2はい、Cは 4はい。いちばん たくさん はいるのは？", answer: "A", options: d("A", "B", "C", "おなじ"), hint: "6ぱいが いちばん おおい。" },
        { question: "Aは 6ぱい、Bは 2はい、Cは 4はい。いちばん すくないのは？", answer: "B", options: d("B", "A", "C", "おなじ"), hint: "2はいが いちばん すくない。" },
    ], // かさくらべ
    MATH_G1_U13: [
        { question: "えぐらふで、あかが 5こ、あおが 3こ。おおいのは？", answer: "あか", options: d("あか", "あお", "おなじ", "みどり"), hint: "かずが おおい ほうを みよう。", visual: { kind: 'bar_chart', values: [5, 3], labels: ["あか", "あお"] } },
        { question: "えぐらふで、ねこが 2ひき、いぬが 4ひき。おおいのは？", answer: "いぬ", options: d("いぬ", "ねこ", "おなじ", "うさぎ"), hint: "4の ほうが おおい。" },
        { question: "えぐらふで、りんごが 3こ、みかんが 3こ。くらべると？", answer: "おなじ", options: d("おなじ", "りんご", "みかん", "わからない"), hint: "3と 3は おなじ。" },
        { question: "えぐらふで、あかが 6こ、あおが 1こ。ちがいは？", answer: "5こ", options: d("5こ", "6こ", "1こ", "7こ"), hint: "6と 1の ちがい。" },
        { question: "えぐらふで、はなが 4ほん、はっぱが 2まい。あわせると？", answer: "6つ", options: d("6つ", "4つ", "2つ", "8つ"), hint: "4と 2を あわせるよ。" },
        { question: "えぐらふで、いちばん たかい ぼうは なにを あらわす？", answer: "いちばん おおい もの", options: d("いちばん おおい もの", "いちばん すくない もの", "さいごの もの", "いろ"), hint: "たかい ぼうは かずが おおい。" },
        { question: "あか 2こ、あお 5こ、きいろ 4こ。いちばん おおいのは？", answer: "あお", options: d("あお", "あか", "きいろ", "おなじ"), hint: "5こが いちばん おおい。" },
        { question: "あか 2こ、あお 5こ、きいろ 4こ。いちばん すくないのは？", answer: "あか", options: d("あか", "あお", "きいろ", "おなじ"), hint: "2こが いちばん すくない。" },
        { question: "えぐらふで、ほしが 7こ、つきが 2こ。ほしは なんこ おおい？", answer: "5こ", options: d("5こ", "7こ", "2こ", "9こ"), hint: "7と 2の ちがい。" },
        { question: "えぐらふで、くるまが 3だい、ばすが 4だい。あわせて？", answer: "7だい", options: d("7だい", "4だい", "3だい", "8だい"), hint: "3と 4を あわせよう。" },
        { question: "えぐらふで、いすが 8こ、つくえが 8こ。どちらが おおい？", answer: "おなじ", options: d("おなじ", "いす", "つくえ", "わからない"), hint: "8と 8は おなじ。" },
        { question: "えぐらふを みる とき、まず くらべるのは？", answer: "かず", options: d("かず", "なまえの ながさ", "おと", "におい"), hint: "かずを みるよ。" },
        { question: "ぼうが みじかい ものは、かずが？", answer: "すくない", options: d("すくない", "おおい", "おなじ", "ふえる"), hint: "みじかい ぼうは すくない。" },
        { question: "ぼうが ながい ものは、かずが？", answer: "おおい", options: d("おおい", "すくない", "0", "へる"), hint: "ながい ぼうは おおい。" },
        { question: "あか 1こ、あお 4こ。あおは あかより？", answer: "おおい", options: d("おおい", "すくない", "おなじ", "ない"), hint: "4は 1より おおい。" },
        { question: "あか 6こ、あお 9こ。ちがいは？", answer: "3こ", options: d("3こ", "6こ", "9こ", "15こ"), hint: "9と 6の ちがい。" },
        { question: "ねこ 5ひき、いぬ 1ぴき。あわせて？", answer: "6ぴき", options: d("6ぴき", "5ひき", "1ぴき", "4ひき"), hint: "5と 1で 6。" },
        { question: "えぐらふで、0こなら ぼうは どうなる？", answer: "ない", options: d("ない", "いちばん ながい", "2ほん", "まるい"), hint: "0こは ぼうが ない。" },
        { question: "えぐらふは、なにを わかりやすく する？", answer: "かずの くらべかた", options: d("かずの くらべかた", "おとの ききかた", "におい", "はしりかた"), hint: "かずを くらべる ための え。" },
        { question: "えぐらふで、あか 4こ、あお 6こ。すくないのは？", answer: "あか", options: d("あか", "あお", "おなじ", "きいろ"), hint: "4は 6より すくない。" },
    ], // えぐらふ
    MATH_G1_U14: [
        { question: "ひょうで、ねこ 3、いぬ 5。おおいのは？", answer: "いぬ", options: d("いぬ", "ねこ", "おなじ", "うさぎ"), hint: "5の ほうが おおい。" },
        { question: "ひょうで、あか 4、あお 4。くらべると？", answer: "おなじ", options: d("おなじ", "あか", "あお", "わからない"), hint: "4と 4は おなじ。" },
        { question: "ひょうで、りんご 6、みかん 2。ちがいは？", answer: "4こ", options: d("4こ", "6こ", "2こ", "8こ"), hint: "6と 2の ちがい。" },
        { question: "ひょうで、まる 1、さんかく 7。おおいのは？", answer: "さんかく", options: d("さんかく", "まる", "おなじ", "しかく"), hint: "7の ほうが おおい。" },
        { question: "ひょうで、A 3、B 4。あわせると？", answer: "7", options: d("7", "4", "3", "8"), hint: "3と 4を あわせるよ。" },
        { question: "ひょうを みる とき、なにを くらべる？", answer: "かず", options: d("かず", "おと", "におい", "はやさ"), hint: "ひょうには かずが あるよ。" },
        { question: "ひょうで、0と かいてある ものは？", answer: "ない", options: d("ない", "1こ", "10こ", "おおい"), hint: "0は ない こと。" },
        { question: "ひょうで、ほし 8、つき 5。ほしは なんこ おおい？", answer: "3こ", options: d("3こ", "5こ", "8こ", "13こ"), hint: "8と 5の ちがい。" },
        { question: "ひょうで、くるま 2、ばす 6。すくないのは？", answer: "くるま", options: d("くるま", "ばす", "おなじ", "でんしゃ"), hint: "2は 6より すくない。" },
        { question: "ひょうで、いちばん おおい ものを さがすには？", answer: "かずが おおきい ところを みる", options: d("かずが おおきい ところを みる", "いろだけ みる", "なまえだけ よむ", "さいごだけ みる"), hint: "おおきい かずを さがそう。" },
        { question: "ひょうで、はな 9、はっぱ 1。あわせると？", answer: "10", options: d("10", "9", "1", "8"), hint: "9と 1で 10。" },
        { question: "ひょうで、かえる 4、かめ 3。おおいのは？", answer: "かえる", options: d("かえる", "かめ", "おなじ", "さかな"), hint: "4は 3より おおい。" },
        { question: "ひょうで、さかな 7、えび 7。ちがいは？", answer: "0", options: d("0", "7", "14", "1"), hint: "おなじ かず。" },
        { question: "ひょうで、A 10、B 6。すくないのは？", answer: "B", options: d("B", "A", "おなじ", "10"), hint: "6は 10より すくない。" },
        { question: "ひょうで、A 2、B 8。Bは Aより？", answer: "おおい", options: d("おおい", "すくない", "おなじ", "ない"), hint: "8は 2より おおい。" },
        { question: "ひょうは、なにを せいりする もの？", answer: "かず", options: d("かず", "おと", "におい", "あじ"), hint: "かずを みやすく するよ。" },
        { question: "ひょうで、あめ 5、ぐみ 4、がむ 3。いちばん おおいのは？", answer: "あめ", options: d("あめ", "ぐみ", "がむ", "おなじ"), hint: "5が いちばん おおい。" },
        { question: "ひょうで、あめ 5、ぐみ 4、がむ 3。いちばん すくないのは？", answer: "がむ", options: d("がむ", "ぐみ", "あめ", "おなじ"), hint: "3が いちばん すくない。" },
        { question: "ひょうで、りす 2、うさぎ 2。どちらが おおい？", answer: "おなじ", options: d("おなじ", "りす", "うさぎ", "わからない"), hint: "2と 2は おなじ。" },
        { question: "ひょうを つかうと、なにが わかりやすい？", answer: "どれが おおいか", options: d("どれが おおいか", "どれが あまいか", "どれが はやいか", "どれが あついか"), hint: "かずを くらべるよ。" },
    ], // ひょう
    MATH_G1_U15: [
        { question: "さんかくの かどは いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "さんかくは 3つ。", visual: { kind: 'polygon', sides: 3 } },
        { question: "しかくの かどは いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "0つ"), hint: "しかくは 4つ。", visual: { kind: 'polygon', sides: 4 } },
        { question: "さんかくの へんは いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "へんも 3つ。" },
        { question: "しかくの へんは いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "1つ"), hint: "まわりの せんを かぞえるよ。" },
        { question: "かどが 3つの かたちは？", answer: "さんかく", options: d("さんかく", "しかく", "まる", "せん"), hint: "3つの かど。" },
        { question: "かどが 4つの かたちは？", answer: "しかく", options: d("しかく", "さんかく", "まる", "てん"), hint: "4つの かど。" },
        { question: "まるには かどが ある？", answer: "ない", options: d("ない", "3つ ある", "4つ ある", "1つ ある"), hint: "まるは かどが ない。" },
        { question: "さんかくと しかくで、かどが おおいのは？", answer: "しかく", options: d("しかく", "さんかく", "おなじ", "まる"), hint: "4つと 3つを くらべよう。" },
        { question: "さんかくと しかくで、へんが すくないのは？", answer: "さんかく", options: d("さんかく", "しかく", "おなじ", "まる"), hint: "3つと 4つを くらべよう。" },
        { question: "おりがみに にている かたちは？", answer: "しかく", options: d("しかく", "さんかく", "まる", "ほし"), hint: "かどが 4つ。" },
        { question: "さんかくじょうぎに にている かたちは？", answer: "さんかく", options: d("さんかく", "しかく", "まる", "せん"), hint: "さんかくじょうぎは さんかく。" },
        { question: "やねの えに よく つかう かたちは？", answer: "さんかく", options: d("さんかく", "しかく", "まる", "ばつ"), hint: "おうちの やね。" },
        { question: "まどの えに よく つかう かたちは？", answer: "しかく", options: d("しかく", "さんかく", "まる", "なみ"), hint: "まどは しかくい ことが おおい。" },
        { question: "3つの へんで かこまれた かたちは？", answer: "さんかく", options: d("さんかく", "しかく", "まる", "ひょう"), hint: "3つの へん。" },
        { question: "4つの へんで かこまれた かたちは？", answer: "しかく", options: d("しかく", "さんかく", "まる", "とけい"), hint: "4つの へん。" },
        { question: "さんかくの かどを 1つずつ かぞえると、さいごは？", answer: "3", options: d("3", "2", "4", "1"), hint: "1、2、3。" },
        { question: "しかくの かどを 1つずつ かぞえると、さいごは？", answer: "4", options: d("4", "3", "5", "2"), hint: "1、2、3、4。" },
        { question: "かたちを みわける とき、みるものは？", answer: "かどや へん", options: d("かどや へん", "おと", "におい", "あじ"), hint: "かたちの とくちょう。" },
        { question: "さんかくは、しかくより かどが？", answer: "すくない", options: d("すくない", "おおい", "おなじ", "ない"), hint: "3つと 4つ。" },
        { question: "しかくは、さんかくより かどが？", answer: "おおい", options: d("おおい", "すくない", "おなじ", "ない"), hint: "4つと 3つ。" },
    ], // さんかくとしかく
    MATH_G1_U16: [
        { question: "ぼうを 3ぼん ならべて つくりやすい かたちは？", answer: "さんかく", options: d("さんかく", "しかく", "まる", "せん"), hint: "3ぼんで 3つの へん。" },
        { question: "ぼうを 4ほん ならべて つくりやすい かたちは？", answer: "しかく", options: d("しかく", "さんかく", "まる", "てん"), hint: "4ほんで 4つの へん。" },
        { question: "まるい かたちを つくる とき、えらぶと よいのは？", answer: "ひも", options: d("ひも", "まっすぐな ぼうだけ", "しかくの はこ", "さんかくじょうぎ"), hint: "ひもは まげやすい。" },
        { question: "さんかくを つくる とき、ひつような へんは？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "さんかくは へんが 3つ。" },
        { question: "しかくを つくる とき、ひつような へんは？", answer: "4つ", options: d("4つ", "3つ", "5つ", "1つ"), hint: "しかくは へんが 4つ。" },
        { question: "さんかくと さんかくを あわせると、できることが ある かたちは？", answer: "しかく", options: d("しかく", "まる", "せん", "てん"), hint: "2つの さんかくで しかくが できることが あるよ。" },
        { question: "しかくの かみを ななめに おると、よく できる かたちは？", answer: "さんかく", options: d("さんかく", "まる", "しかく 2つ", "せんだけ"), hint: "おりがみを おもいだそう。" },
        { question: "かたちづくりで、すきまを あけないように ならべるには？", answer: "へんを あわせる", options: d("へんを あわせる", "いろだけ みる", "はなして おく", "かぞえない"), hint: "へんと へんを あわせよう。" },
        { question: "まるい ものだけでは つくりにくいのは？", answer: "しかく", options: d("しかく", "ころがる かたち", "たま", "わ"), hint: "しかくは かどが ある。" },
        { question: "ぼう 1ぽんだけで つくれるのは？", answer: "せん", options: d("せん", "さんかく", "しかく", "まる"), hint: "1ぽんは せん。" },
        { question: "ぼう 2ほんだけでは、かこまれた かたちは？", answer: "できない", options: d("できない", "さんかく", "しかく", "まる"), hint: "かこむには たりないよ。" },
        { question: "つみきで たかく つむ とき、つかいやすいのは？", answer: "しかくい つみき", options: d("しかくい つみき", "ぼーる", "みかん", "びーだま"), hint: "たいらな ところが ある。" },
        { question: "ぼーるを ならべると、どうなりやすい？", answer: "ころがる", options: d("ころがる", "ぴったり とまる", "しかくに なる", "さんかくに なる"), hint: "まるい ものは ころがる。" },
        { question: "さんかくの いたを ならべる とき、みるものは？", answer: "かどと へん", options: d("かどと へん", "おと", "におい", "あじ"), hint: "かたちの とくちょう。" },
        { question: "しかくの いたを 2まい ならべると、ながい しかくが できることが ある？", answer: "ある", options: d("ある", "ない", "まるに なる", "かずが へる"), hint: "へんを あわせるよ。" },
        { question: "かたちを つくる とき、まねして よいものは？", answer: "みほん", options: d("みほん", "おと", "におい", "あしあと"), hint: "みほんを よく みよう。" },
        { question: "さんかくを つくる ぼうが 1ぽん たりない。いま ある ぼうは？", answer: "2ほん", options: d("2ほん", "3ぼん", "4ほん", "1ぽん"), hint: "さんかくは 3ぼん。" },
        { question: "しかくを つくる ぼうが 1ぽん たりない。いま ある ぼうは？", answer: "3ぼん", options: d("3ぼん", "4ほん", "2ほん", "1ぽん"), hint: "しかくは 4ほん。" },
        { question: "かたちづくりで、まわしても よいのは？", answer: "かたちの むき", options: d("かたちの むき", "かずの こたえ", "なまえ", "おと"), hint: "むきを かえると あうことが ある。" },
        { question: "かたちを あわせる とき、たいせつなのは？", answer: "よく みて ならべる", options: d("よく みて ならべる", "めを とじる", "いそいで とばす", "かぞえない"), hint: "みほんと くらべよう。" },
    ], // かたちづくり
    MATH_G1_U17: [
        { question: "1 + 2 + 3 = ?", answer: "6", options: d("6", "5", "7", "3"), hint: "1と 2で 3、3と 3で 6。" },
        { question: "2 + 2 + 2 = ?", answer: "6", options: d("6", "4", "8", "2"), hint: "2を 3つ あわせるよ。" },
        { question: "3 + 1 + 4 = ?", answer: "8", options: d("8", "7", "9", "4"), hint: "3と 1で 4、4と 4で 8。" },
        { question: "5 + 2 + 1 = ?", answer: "8", options: d("8", "7", "9", "6"), hint: "じゅんに たそう。" },
        { question: "4 + 3 + 2 = ?", answer: "9", options: d("9", "8", "7", "10"), hint: "4と 3で 7、2を たす。" },
        { question: "10 - 2 - 3 = ?", answer: "5", options: d("5", "8", "7", "4"), hint: "じゅんに ひこう。" },
        { question: "9 - 1 - 4 = ?", answer: "4", options: d("4", "8", "5", "3"), hint: "9から 1、つぎに 4。" },
        { question: "8 - 3 - 2 = ?", answer: "3", options: d("3", "5", "6", "2"), hint: "8から 3、つぎに 2。" },
        { question: "2 + 3 + 5 = ?", answer: "10", options: d("10", "9", "8", "5"), hint: "2と 3で 5、5と 5で 10。" },
        { question: "1 + 4 + 4 = ?", answer: "9", options: d("9", "8", "10", "4"), hint: "1と 4で 5、4を たす。" },
        { question: "7 - 2 + 1 = ?", answer: "6", options: d("6", "5", "7", "8"), hint: "まず 7から 2を ひくよ。" },
        { question: "6 + 1 - 3 = ?", answer: "4", options: d("4", "7", "3", "5"), hint: "まず 6と 1を あわせるよ。" },
        { question: "3 + 3 + 3 = ?", answer: "9", options: d("9", "6", "10", "3"), hint: "3を 3つ。" },
        { question: "10 - 5 - 1 = ?", answer: "4", options: d("4", "5", "6", "3"), hint: "10から 5、つぎに 1。" },
        { question: "4 + 1 + 2 = ?", answer: "7", options: d("7", "6", "5", "8"), hint: "じゅんに たそう。" },
        { question: "9 - 3 + 2 = ?", answer: "8", options: d("8", "6", "7", "9"), hint: "9から 3、つぎに 2を たす。" },
        { question: "1 + 1 + 8 = ?", answer: "10", options: d("10", "9", "8", "2"), hint: "1と 1で 2、8を たす。" },
        { question: "5 + 3 - 2 = ?", answer: "6", options: d("6", "8", "5", "7"), hint: "5と 3で 8、2を ひく。" },
        { question: "3つの かずの けいさんで たいせつなのは？", answer: "じゅんに けいさんする", options: d("じゅんに けいさんする", "さいごだけ みる", "いろだけ みる", "よまない"), hint: "まえから じゅんに。" },
        { question: "2 + 4 + 1 = ?", answer: "7", options: d("7", "6", "8", "5"), hint: "2と 4で 6、1を たす。" },
    ], // 3つのかずのけいさん
    MATH_G1_U18: [
        { question: "りんごが 3こ あります。2こ もらうと ぜんぶで？", answer: "5こ", options: d("5こ", "3こ", "2こ", "6こ"), hint: "もらうと ふえるよ。" },
        { question: "あめが 6こ あります。2こ たべると のこりは？", answer: "4こ", options: d("4こ", "6こ", "2こ", "8こ"), hint: "たべると へるよ。" },
        { question: "ねこが 2ひき、いぬが 3びき。あわせて なんびき？", answer: "5ひき", options: d("5ひき", "3びき", "2ひき", "6ぴき"), hint: "2と 3を あわせよう。" },
        { question: "えんぴつが 5ほん あります。1ぽん なくなると のこりは？", answer: "4ほん", options: d("4ほん", "5ほん", "1ぽん", "6ぽん"), hint: "1ぽん へるよ。" },
        { question: "はなが 4ほん あります。3ぼん ふえると なんぼん？", answer: "7ほん", options: d("7ほん", "4ほん", "3ぼん", "8ぽん"), hint: "4と 3で 7。" },
        { question: "つみきが 8こ あります。5こ しまうと のこりは？", answer: "3こ", options: d("3こ", "5こ", "8こ", "13こ"), hint: "8から 5を ひくよ。" },
        { question: "くるまが 3だい、ばすが 1だい。あわせて なんだい？", answer: "4だい", options: d("4だい", "3だい", "1だい", "5だい"), hint: "3の つぎは 4。" },
        { question: "みかんが 10こ あります。4こ たべると のこりは？", answer: "6こ", options: d("6こ", "4こ", "10こ", "14こ"), hint: "10から 4を ひくよ。" },
        { question: "さかなが 5ひき います。2ひき ふえると なんびき？", answer: "7ひき", options: d("7ひき", "5ひき", "2ひき", "3びき"), hint: "5から 2つ かぞえたすよ。" },
        { question: "おはじきが 7こ あります。7こ つかうと のこりは？", answer: "0こ", options: d("0こ", "7こ", "1こ", "14こ"), hint: "ぜんぶ つかうと 0。" },
        { question: "あかい まるが 4こ、あおい まるが 4こ。あわせて？", answer: "8こ", options: d("8こ", "4こ", "7こ", "9こ"), hint: "4と 4で 8。" },
        { question: "ぼーるが 9こ あります。1こ とると のこりは？", answer: "8こ", options: d("8こ", "9こ", "1こ", "10こ"), hint: "9の ひとつ まえ。" },
        { question: "こっぷが 2こ あります。6こ ふえると いくつ？", answer: "8こ", options: d("8こ", "6こ", "2こ", "7こ"), hint: "2と 6で 8。" },
        { question: "はっぱが 6まい あります。3まい とると のこりは？", answer: "3まい", options: d("3まい", "6まい", "9まい", "2まい"), hint: "6から 3を ひくよ。" },
        { question: "どんぐりが 1こ、まつぼっくりが 8こ。あわせて？", answer: "9こ", options: d("9こ", "8こ", "1こ", "10こ"), hint: "1と 8で 9。" },
        { question: "いすが 10こ あります。2こ かたづけると のこりは？", answer: "8こ", options: d("8こ", "10こ", "2こ", "12こ"), hint: "10から 2を ひくよ。" },
        { question: "けしごむが 3こ あります。3こ ふえると いくつ？", answer: "6こ", options: d("6こ", "3こ", "5こ", "7こ"), hint: "3と 3で 6。" },
        { question: "うさぎが 8ひき います。1ぴき かえると のこりは？", answer: "7ひき", options: d("7ひき", "8ひき", "1ぴき", "9ひき"), hint: "8から 1を ひくよ。" },
        { question: "ぶんを よんで、ふえる ときは？", answer: "たす", options: d("たす", "ひく", "くらべるだけ", "よまない"), hint: "ふえる は たしざん。" },
        { question: "ぶんを よんで、へる ときは？", answer: "ひく", options: d("ひく", "たす", "あわせる", "ふやす"), hint: "へる は ひきざん。" },
    ], // ぶんしょうだい
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G1_U01': {
            const a = (n % 9) + 1;
            return { question: `${a}の つぎの かずは？`, answer: `${a + 1}`, options: d(`${a + 1}`, `${a}`, `${a + 2}`, `${a - 1}`), hint: "1つ おおきい かずだよ。", visual: { kind: 'dots', counts: [a], labels: ["かず"] } };
        }
        case 'MATH_G1_U02': {
            const a = (n % 9) + 1;
            const b = 10 - a;
            return { question: `10は ${a} と なに？`, answer: `${b}`, options: d(`${b}`, `${b + 1}`, `${a}`, `${Math.max(0, b - 1)}`), hint: "10に なる くみあわせを かんがえよう。", visual: { kind: 'dots', counts: [a, b], labels: ["その1", "その2"] } };
        }
        case 'MATH_G1_U03': {
            const p = n % 3;
            if (p === 0) return { question: "まるい かたちは どれ？", answer: "ボール", options: d("ボール", "ノート", "つくえ", "ほん"), hint: "ころころ ころがるよ。" };
            if (p === 1) return { question: "しかくい かたちは どれ？", answer: "ノート", options: d("ノート", "ボール", "みかん", "ビー玉"), hint: "かどが 4つ あるよ。" };
            return { question: "さんかくに にている ものは？", answer: "さんかく じょうぎ", options: d("さんかく じょうぎ", "ボール", "ノート", "コップ"), hint: "3つの かどが あるよ。" };
        }
        case 'MATH_G1_U04': {
            const pos = (n % 5) + 1;
            return { question: `1、2、3、4、5。 ${pos}ばんめの かずは？`, answer: `${pos}`, options: d(`${pos}`, `${Math.max(1, pos - 1)}`, `${Math.min(5, pos + 1)}`, "5"), hint: "じゅんばんに よんでみよう。", visual: { kind: 'number_sequence', values: [1, 2, 3, 4, 5] } };
        }
        case 'MATH_G1_U05': {
            const a = (n % 6) + 1;
            const b = (n % (10 - a)) + 1;
            const sum = a + b;
            if (n % 2 === 0) return { question: `${a} + ${b} = ?`, answer: `${sum}`, options: d(`${sum}`, `${sum + 1}`, `${sum - 1}`, `${a}`), hint: "あわせて いくつか かぞえよう。" };
            return { question: `${a} と ${b} を あわせると？`, answer: `${sum}`, options: d(`${sum}`, `${sum + 1}`, `${sum - 1}`, `${b}`), hint: "たしざんの もんだい。" };
        }
        case 'MATH_G1_U06': {
            const a = (n % 7) + 2;
            const b = (n % 3) + 1;
            if (n % 2 === 0) return { question: `${a}こ ありました。 ${b}こ ふえると なんこ？`, answer: `${a + b}こ`, options: d(`${a + b}こ`, `${a}こ`, `${b}こ`, `${a + b + 1}こ`), hint: "ふえると たしざんだよ。" };
            return { question: `${a}こ に ${b}こ たすと？`, answer: `${a + b}こ`, options: d(`${a + b}こ`, `${a - b}こ`, `${b}こ`, `${a}こ`), hint: "ふえる は たす。" };
        }
        case 'MATH_G1_U07': {
            const a = (n % 7) + 4;
            const b = (n % 3) + 1;
            if (n % 2 === 0) return { question: `${a}こ あります。 ${b}こ つかうと のこりは？`, answer: `${a - b}こ`, options: d(`${a - b}こ`, `${a + b}こ`, `${b}こ`, `${a}こ`), hint: "のこりは ひきざん。" };
            return { question: `${a}こ から ${b}こ へると？`, answer: `${a - b}こ`, options: d(`${a - b}こ`, `${a}こ`, `${b}こ`, `${a + b}こ`), hint: "へる は ひく。" };
        }
        case 'MATH_G1_U08': {
            const small = (n % 6) + 1;
            const diff = (n % 3) + 1;
            const big = small + diff;
            if (n % 2 === 0) return { question: `${big}こと ${small}こ。 ちがいは なんこ？`, answer: `${diff}こ`, options: d(`${diff}こ`, `${big}こ`, `${small}こ`, `${diff + 1}こ`), hint: "おおい ほう から すくない ほうを ひくよ。" };
            return { question: `${small}こ より ${big}こ は なんこ おおい？`, answer: `${diff}こ`, options: d(`${diff}こ`, `${big}こ`, `${small}こ`, `${diff + 1}こ`), hint: "ちがいを しらべる。" };
        }
        case 'MATH_G1_U09': {
            const a = (n % 10) + 10;
            return { question: `${a}の つぎの かずは？`, answer: `${a + 1}`, options: d(`${a + 1}`, `${a - 1}`, `${a}`, `${a + 2}`), hint: "20までの かずを よんでみよう。", visual: { kind: 'number_sequence', values: [Math.max(1, a - 1), a, a + 1, a + 2] } };
        }
        case 'MATH_G1_U10': {
            const hour = (n % 12) + 1;
            if (n % 2 === 0) {
                return {
                    question: `この とけいは なんじ？`,
                    answer: `${hour}じ`,
                    options: d(`${hour}じ`, `${(hour % 12) + 1}じ`, `${hour}じはん`, "12じ"),
                    hint: "ながい はりが12は ちょうど。",
                    visual: { kind: 'clock', hour, minute: 0 }
                };
            }
            return {
                question: `この とけいは なんじ？`,
                answer: `${hour}じはん`,
                options: d(`${hour}じはん`, `${hour}じ`, `${(hour % 12) + 1}じ`, "12じ"),
                hint: "ながい はりが6は はん。",
                visual: { kind: 'clock', hour, minute: 30 }
            };
        }
        case 'MATH_G1_U11': {
            const a = (n % 8) + 2;
            const b = (n % 5) + 1;
            const answer = a === b ? "おなじ" : `${Math.max(a, b)}cm`;
            return { question: `${a}cm と ${b}cm。 ながいのは どっち？`, answer, options: d(answer, a === b ? `${a + 1}cm` : `${Math.min(a, b)}cm`, a === b ? `${Math.max(1, a - 1)}cm` : "おなじ", "わからない"), hint: "おおきい かずが ながいよ。", visual: { kind: 'bar_chart', values: [a, b], labels: ["A", "B"] } };
        }
        case 'MATH_G1_U12': {
            const a = (n % 5) + 1;
            const b = (n % 4) + 1;
            return { question: `コップAは ${a}はい、コップBは ${a + b}はい。 たくさん はいるのは？`, answer: "コップB", options: d("コップB", "コップA", "おなじ", "どちらでもない"), hint: "かずが おおきい ほうが たくさん。", visual: { kind: 'bar_chart', values: [a, a + b], labels: ["A", "B"] } };
        }
        case 'MATH_G1_U13': {
            const r = (n % 5) + 1;
            const b = (n % 4) + 1;
            const answer = r === b ? "おなじ" : (r > b ? "あか" : "あお");
            const wrongs = ["あか", "あお", "おなじ", "わからない"].filter((label) => label !== answer).slice(0, 3);
            return { question: `えグラフ。 あか ${r}こ、あお ${b}こ。 おおいのは？`, answer, options: d(answer, ...wrongs), hint: "かずを くらべよう。", visual: { kind: 'bar_chart', values: [r, b], labels: ["あか", "あお"] } };
        }
        case 'MATH_G1_U14': {
            const cat = (n % 4) + 1;
            return { question: `ひょう。 ねこ:${cat} いぬ:${cat + 1} うさぎ:${cat - 1}。 いちばん おおいのは？`, answer: "いぬ", options: d("いぬ", "ねこ", "うさぎ", "おなじ"), hint: "ひょうの かずを くらべるよ。", visual: { kind: 'bar_chart', values: [cat, cat + 1, cat - 1], labels: ["ねこ", "いぬ", "うさぎ"] } };
        }
        case 'MATH_G1_U15': {
            if (n % 2 === 0) {
                return { question: "この ずけいの かどは いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "さんかくは 3つだよ。", visual: { kind: 'polygon', sides: 3 } };
            }
            return { question: "この ずけいの へんは いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "2つ"), hint: "しかくは 4つだよ。", visual: { kind: 'polygon', sides: 4 } };
        }
        case 'MATH_G1_U16': {
            const sticks = (n % 3) + 3;
            const ans = sticks === 3 ? "さんかく" : (sticks === 4 ? "しかく" : "ごかくけい");
            return { question: "この ずけいの なまえは？", answer: ans, options: d(ans, "まる", "わからない", "かたちに ならない"), hint: "へんの かずと おなじだよ。", visual: { kind: 'polygon', sides: sticks } };
        }
        case 'MATH_G1_U17': {
            const a = (n % 4) + 1;
            const b = (n % 3) + 1;
            const c = (n % 2) + 1;
            const sum = a + b + c;
            if (n % 2 === 0) return { question: `${a} + ${b} + ${c} = ?`, answer: `${sum}`, options: d(`${sum}`, `${sum + 1}`, `${sum - 1}`, `${a + b}`), hint: "2つずつ たしていこう。" };
            return { question: `${a}こと ${b}こと ${c}こ。 あわせて いくつ？`, answer: `${sum}`, options: d(`${sum}`, `${a + b}`, `${b + c}`, `${sum + 1}`), hint: "じゅんに たそう。" };
        }
        case 'MATH_G1_U18': {
            const a = (n % 6) + 4;
            const b = (n % 3) + 1;
            if (n % 3 === 0) {
                return { question: `りんごが ${a}こ。 ${b}こ もらいました。 ぜんぶで？`, answer: `${a + b}こ`, options: d(`${a + b}こ`, `${a - b}こ`, `${b}こ`, `${a}こ`), hint: "もらうは たしざん。" };
            }
            if (n % 3 === 1) return { question: `あめが ${a}こ。 ${b}こ たべました。 のこりは？`, answer: `${a - b}こ`, options: d(`${a - b}こ`, `${a + b}こ`, `${a}こ`, `${b}こ`), hint: "たべると へるから ひきざん。" };
            return { question: `えんぴつが ${a}ほん。 ${b}ほん ふえると なんぼん？`, answer: `${a + b}ほん`, options: d(`${a + b}ほん`, `${a - b}ほん`, `${a}ほん`, `${b}ほん`), hint: "ぶんしょうを しきにしよう。" };
        }
        default:
            return { question: "1 + 1 = ?", answer: "2", options: d("2", "1", "3", "0"), hint: "たしざんだよ。" };
    }
};

fillGeneratedUnitProblems(MATH_G1_UNIT_DATA, makeUnitProblem);

const buildReviewProblems = (unitIds: string[], perUnit: number): GeneralProblem[] =>
    unitIds.flatMap((unitId) => MATH_G1_UNIT_DATA[unitId].slice(0, perUnit));

const MATH_G1_REVIEW_1 = buildReviewProblems([
    'MATH_G1_U01',
    'MATH_G1_U02',
    'MATH_G1_U03',
    'MATH_G1_U04',
    'MATH_G1_U05',
    'MATH_G1_U06',
], 9);

const MATH_G1_REVIEW_2 = buildReviewProblems([
    'MATH_G1_U07',
    'MATH_G1_U08',
    'MATH_G1_U09',
    'MATH_G1_U10',
    'MATH_G1_U11',
    'MATH_G1_U12',
], 9);

const MATH_G1_REVIEW_3 = buildReviewProblems([
    'MATH_G1_U13',
    'MATH_G1_U14',
    'MATH_G1_U15',
    'MATH_G1_U16',
    'MATH_G1_U17',
    'MATH_G1_U18',
], 9);

export const MATH_G1_DATA: Record<string, GeneralProblem[]> = {
    MATH_G1_1: MATH_G1_REVIEW_1,
    MATH_G1_2: MATH_G1_REVIEW_2,
    MATH_G1_3: MATH_G1_REVIEW_3,
    ...MATH_G1_UNIT_DATA,
};


