// Physical and social challenges for one-off scene cards. Each card selects just
// one challenge, so the same scene cannot return at a different difficulty.
const challenges = [
  ['「%」を手ぶりで伝える。演じる時間を何秒にする？','How many seconds would you give someone to mime “%”?','「%」をてぶりでつたえる。えんじるじかんをなんびょうにする？'],
  ['「%」を小さな舞台で再現する。使う小道具は最大いくつ？','How many props would you allow to stage “%”?','「%」をちいさなぶたいでさいげんする。つかうこどうぐはさいだいいくつ？'],
  ['「%」の大きな絵を二枚並べ、一か所だけ変えた。見つけるには何秒ほしい？','Two large pictures show “%” with one difference. How many seconds to find it?','「%」のおおきなえを2まいならべ、1かしょだけかえた。みつけるにはなんびょうほしい？'],
  ['「%」を見本に、影だけで当てるゲームをする。明かりを回すのは何度まで？','For a shadow guessing game about “%”, how many degrees should you turn the light?','「%」をみほんに、かげだけであてるゲームをする。あかりをまわすのはなんどまで？'],
  ['「%」を一コマの漫画にする。ふき出しは何文字までなら画面をじゃましない？','How many letters could fit in a speech bubble without hiding your one-panel comic of “%”?','「%」をひとこまのまんがにする。ふきだしはなんもじまでならがめんをじゃましない？'],
  ['「%」を寝る前に一度だけ見た。次の朝、細部を何か所説明できそう？','After seeing “%” once before bed, how many details could you name in the morning?','「%」をねるまえにいちどだけみた。つぎのあさ、さいぶをなんかしょせつめいできそう？'],
  ['「%」の写真を黒い紙でかくす。面積の何％見えたら、何の場面か気づけそう？','What percent of a photo of “%” could you reveal before people identify it?','「%」のしゃしんをくろいかみでかくす。めんせきのなんパーセントみえたら、なんのばめんかきづけそう？'],
  ['「%」を紙芝居にする。最初の絵から何枚先で思わず笑う場面を作る？','How many cards into a paper theater show about “%” should the first laugh occur?','「%」をかみしばいにする。さいしょのえからなんまいさきでおもわずわらうばめんをつくる？'],
  ['「%」を30秒で紹介する人が順番に登場する。何人目まで最初から聞いた話を覚えていそう？','How many 30-second talks about “%” could you remember in order?','「%」を30びょうでしょうかいするひとがじゅんばんにとうじょうする。なんにんめまでさいしょからきいたはなしをおぼえていそう？'],
  ['「%」の立て看板を入口に置く。横から見て読める題名は、何文字まで？','How many characters can a title for “%” have and stay legible on a sign seen from the side?','「%」のたてかんばんをいりぐちにおく。よこからみてよめるだいめいは、なんもじまで？'],
  ['「%」を選んでから、何を選んだか客席には内緒にする。ヒントを何個出してよい？','How many hints should the audience get before guessing you picked “%”?','「%」をえらんでから、なにをえらんだかきゃくせきにはないしょにする。ヒントをなんこだしてよい？'],
  ['「%」の動きを止めたように写す集合写真。みんなの用意に何秒数える？','How many seconds would you count down for a group freeze-frame photo of “%”?','「%」のうごきをとめたようにうつすしゅうごうしゃしん。みんなのよういになんびょうかぞえる？'],
  ['「%」に一つだけ効果音を当てて動画にする。候補を何種類聞いたら選べる？','How many sound effects would you audition before choosing one for “%”?','「%」にひとつだけこうかおんをあててどうがにする。こうほをなんしゅるいきいたらえらべる？'],
  ['「%」をまねた人を舞台の奥から見る。何メートル以内なら仕草まで分かりそう？','Within how many meters could you still see nuanced gestures in an imitation of “%”?','「%」をまねたひとをぶたいのおくからみる。なんメートルいないならしぐさまでわかりそう？'],
  ['「%」を色紙の切り絵で伝える。紙を何色までにしぼる？','How many colors are enough for a paper cutout of “%”?','「%」をいろがみのきりえでつたえる。かみをなんしょくまでにしぼる？'],
  ['「%」を粘土で作る対決。手直しを認めるのは何回まで？','How many revisions should be allowed in a clay-model challenge for “%”?','「%」をねんどでつくるたいけつ。てなおしをみとめるのはなんかいまで？'],
  ['「%」を表す紙片をパズルにした。何ピースなら初めての人が気軽に手に取れる？','How many pieces would make a puzzle of “%” welcoming for a beginner?', '「%」をあらわすかみをパズルにした。なんピースならはじめてのひとがきがるにてにとれる？'],
  ['「%」について絵と短い文を一つずつ用意する。並べて話す机は横何センチあれば落ち着く？','How many centimeters wide would a desk need to be to lay out a picture and a caption for “%”?','「%」についてえとみじかいぶんをひとつずつよういする。ならべてはなすつくえはよこなんセンチあればおちつく？'],
  ['「%」と分かる最短の音声ガイドを作る。説明は何秒あればよい？','How many seconds should the shortest recognizable audio guide for “%” last?','「%」とわかるさいたんのおんせいガイドをつくる。せつめいはなんびょうあればよい？'],
  ['「%」の場面の続きを一人一行ずつ書く。何人分までなら筋がつながりそう？','How many people could add one line to a story starting with “%” before it goes off track?','「%」のばめんのつづきをひとりいちぎょうずつかく。なんにんぶんまでならすじがつながりそう？'],
  ['「%」を表したひみつのポーズを、一組が離れた組に伝える。何組目まで同じ形がのこりそう？','How many groups could pass along a secret pose for “%” without changing it?','「%」をあらわしたひみつのポーズを、はなれたくみにおくる。なんくみめまでおなじかたちがのこりそう？'],
  ['「%」を題材にした手のひらサイズのおみやげを作る。持ちやすい重さの上限は何グラム？','What’s the heaviest an easy-to-carry souvenir based on “%” should be, in grams?','「%」をだいざいにしたてのひらサイズのおみやげをつくる。もちやすいおもさのうえげんはなんグラム？'],
  ['「%」の映像を何コマずつ区切ると、次の動きを想像する遊びにちょうどいい？','How many frames per clip would make it fun to guess the next movement in “%”?','「%」のえいぞうをなんコマずつくぎると、つぎのうごきをそうぞうするあそびにちょうどいい？'],
  ['「%」を表す札を手の上で伏せて渡す。落とさないと思うのは何センチ離れた相手まで？','How far in centimeters would you pass a face-down card of “%” without dropping it?','「%」をあらわすふだをてのうえでふせてわたす。おとさないとおもうのはなんセンチはなれたあいてまで？'],
  ['「%」に似せた祝いの飾りを持ち帰る。組み立てて外すまで何分なら負担に感じない？','How many minutes of assembly and teardown for a party decoration shaped like “%” would still be fun?','「%」ににせたいわいのかざりをもちかえる。くみたててはずすまでなんぷんならふたんにかんじない？'],
  ['「%」を思い出してスケッチし、別の人と絵を比べる。共通して描く特徴は何個ありそう？','How many details would match if two people sketched “%” from memory?','「%」をおもいだしてスケッチし、べつのひととえをくらべる。きょうつうしてかくとくちょうはなんこありそう？'],
  ['「%」を表す絵文字を別々に紙へ書く。絵文字は最大何個で伝えたい？','What maximum number of emoji would you allow to describe “%” on paper?','「%」をあらわすえもじをべつべつにかみにかく。えもじはさいだいなんこでつたえたい？'],
  ['「%」を見たことがない人向けの見本を作る。何段階で説明できたら分かりやすい？','How many steps would make a demonstration of “%” clear to someone new to it?','「%」をみたことがないひとむけのみほんをつくる。なんだんかいでせつめいできたらわかりやすい？'],
  ['「%」を10秒で表すなら、真似する物の位置を何回変えると動きが伝わる？','How many position changes would convey “%” in a ten-second prop sketch?','「%」を10びょうであらわすなら、まねするもののいちをなんかいかえるとうごきがつたわる？'],
  ['「%」の絵を模様の集まりにして、元の形を探す。紙いっぱいに模様を何個入れる？','How many scattered motifs would you use to hide “%” in a pattern-search game?','「%」のえをもようのあつまりにして、もとのかたちをさがす。かみいっぱいにもようをなんこいれる？'],
  ['「%」を机の上で再現して小さなカードに写真を印刷する。縦の長さは何センチ？','How many centimeters tall should a photo card of a tabletop “%” be?','「%」をつくえのうえでさいげんしてちいさなカードにしゃしんをいんさつする。たてのながさはなんセンチ？'],
  ['「%」が一瞬だけ見えた動画を、途中を止めずに見る。何回の再生までなら当てられそう？','How many uninterrupted replays of a glimpse of “%” would you need to identify it?','「%」がいっしゅんだけみえたどうがを、とちゅうをとめずにみる。なんかいのさいせいまでならあてられそう？'],
] as const;

export function estimateScenario(theme: readonly string[], index: number, locale: number) {
  return challenges[index % challenges.length][locale].replace('%', theme[locale]);
}
