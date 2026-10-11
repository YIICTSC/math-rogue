import { c, type Copy } from "./catalog";

export interface ResidentStory { title: Copy; scene: Copy; choices: Copy[]; responses: Copy[] }

// Keep the first twelve indices stable for saved events in progress.
export const RESIDENT_STORIES: ResidentStory[] = [
  {
    title: c("落とし物のリボン", "A lost ribbon", "おとしもののりぼん"),
    scene: c("ねえ、このリボン、誰かの落とし物かな。どうしよう？", "Could this ribbon belong to someone? What shall we do?", "ねえ、このりぼん、だれかのおとしものかな。どうしよう？"),
    choices: [
      c("まずは近くの人に聞いてみよう。", "Let us ask the people nearby first.", "まずはちかくのひとにきいてみよう。"),
      c("町の掲示板で、持ち主を探すのはどう？", "How about looking for the owner through the town noticeboard?", "まちのけいじばんで、もちぬしをさがすのはどう？"),
      c("ふたりで、この辺りを探してみようか。", "Shall we look around here together?", "ふたりで、このあたりをさがしてみようか。"),
    ],
    responses: [
      c("うん。見かけた場所も伝えれば、思い当たる人がいるかも。", "Yes. If we say where we found it, someone might recognize it.", "うん。みかけたばしょもつたえれば、おもいあたるひとがいるかも。"),
      c("それなら、探している人の目に留まりそう。文を一緒に考えよう。", "The person looking for it might notice. Let us write the message together.", "それなら、さがしているひとのめにとまりそう。ぶんをいっしょにかんがえよう。"),
      c("ありがとう。困っている人がいたら、すぐ声をかけようね。", "Thank you. If we see someone looking worried, let us ask them.", "ありがとう。こまっているひとがいたら、すぐこえをかけようね。"),
    ],
  },
  {
    title: c("お弁当の交換", "Lunchbox exchange", "おべんとうのこうかん"),
    scene: c("同じ材料なのに、お弁当の匂いが違うね。ちょっと気になるな。", "We used the same ingredients, but our lunches smell different. I am curious.", "おなじざいりょうなのに、おべんとうのにおいがちがうね。ちょっときになるな。"),
    choices: [
      c("ひと口ずつ、交換してみない？", "Shall we swap a bite?", "ひとくちずつ、こうかんしてみない？"),
      c("何を入れたのか、教えてほしいな。", "I would love to know what you put in yours.", "なにをいれたのか、おしえてほしいな。"),
      c("次は一緒に作って、味を比べようよ。", "Let us cook together next time and compare the flavors.", "つぎはいっしょにつくって、あじをくらべようよ。"),
    ],
    responses: [
      c("いいの？ じゃあ、こっちの一番おいしくできたところをどうぞ。", "May I? Then please take the best part of mine.", "いいの？じゃあ、こっちのいちばんおいしくできたところをどうぞ。"),
      c("少しだけ香草を足したんだ。入れるタイミングも違うのかも。", "I added a little herb. Perhaps the timing made a difference too.", "すこしだけこうそうをたしたんだ。いれるたいみんぐもちがうのかも。"),
      c("賛成。味見ばかりで、お弁当が空にならないようにしようね。", "Agreed. We must not eat it all while tasting.", "さんせい。あじみばかりで、おべんとうがからにならないようにしようね。"),
    ],
  },
  {
    title: c("迷子の小鳥", "A lost little bird", "まいごのことり"),
    scene: c("あの小鳥、枝でずっと鳴いてる。近づきすぎない方がいいかな。", "That little bird keeps calling from the branch. Should we keep our distance?", "あのことり、えだでずっとないてる。ちかづきすぎないほうがいいかな。"),
    choices: [
      c("少し離れて、静かに待ってみよう。", "Let us step back and wait quietly.", "すこしはなれて、しずかにまってみよう。"),
      c("低い枝へ移れそうか、ここから見てみよう。", "Let us see from here whether it can reach a lower branch.", "ひくいえだへうつれそうか、ここからみてみよう。"),
      c("親鳥が近くにいないか、耳を澄ませてみよう。", "Let us listen for its parent nearby.", "おやどりがちかくにいないか、みみをすませてみよう。"),
    ],
    responses: [
      c("うん。私たちが離れたら、安心して動けるかもしれないね。", "Yes. It might feel safer to move once we are farther away.", "うん。わたしたちがはなれたら、あんしんしてうごけるかもしれないね。"),
      c("あ、下にも枝があるね。手を出さずに見守ろう。", "Oh, there is a branch below it. Let us watch without reaching out.", "あ、したにもえだがあるね。てをださずにみまもろう。"),
      c("向こうから返事が聞こえる。呼び合っていたのかもしれないね。", "I hear a call from over there. Perhaps they were calling to each other.", "むこうからへんじがきこえる。よびあっていたのかもしれないね。"),
    ],
  },
  {
    title: c("雨宿り", "Shelter from rain", "あまやどり"),
    scene: c("わっ、急に降ってきた。ここで少し雨宿りしない？", "Oh, sudden rain! Shall we take shelter here?", "わっ、きゅうにふってきた。ここですこしあまやどりしない？"),
    choices: [
      c("屋根に当たる音、少し聞いていこうよ。", "Let us listen to the rain on the roof.", "やねにあたるおと、すこしきいていこうよ。"),
      c("待ってる間、昔の雨の日の話をしようか。", "Shall we share memories of rainy days while we wait?", "まってるあいだ、むかしのあめのひのはなしをしようか。"),
      c("小降りになったら、屋根の多い道で帰ろう。", "When it eases, let us take the route with more shelter.", "こぶりになったら、やねのおおいみちでかえろう。"),
    ],
    responses: [
      c("場所によって音が違うね。雨にも楽器があるみたい。", "It sounds different in each spot. As if rain has its own instruments.", "ばしょによっておとがちがうね。あめにもがっきがあるみたい。"),
      c("小さい頃、水たまりを避けたつもりで真ん中に着地したことがあるよ。", "When I was little, I tried to jump over a puddle and landed in the middle.", "ちいさいころ、みずたまりをさけたつもりでまんなかにちゃくちしたことがあるよ。"),
      c("うん。急いで滑るより、少し遠回りしようね。", "Yes. Better a small detour than slipping in a hurry.", "うん。いそいですべるより、すこしとおまわりしようね。"),
    ],
  },
  {
    title: c("初めての一曲", "A first song", "はじめてのいっきょく"),
    scene: c("練習してる曲、少しだけ聞いてくれる？ まだ途中なんだけど。", "Will you listen to the song I am practicing? It is not finished yet.", "れんしゅうしてるきょく、すこしだけきいてくれる？まだとちゅうなんだけど。"),
    choices: [
      c("手拍子をつけてもいい？", "May I clap along?", "てびょうしをつけてもいい？"),
      c("今の、少し音が上がるところが好きだな。", "I like the part where the notes rise a little.", "いまの、すこしおとがあがるところがすきだな。"),
      c("一緒にリズムを取ろう。ゆっくりからでいいよ。", "Let us keep the beat together. We can start slowly.", "いっしょにりずむをとろう。ゆっくりからでいいよ。"),
    ],
    responses: [
      c("お願い。ひとりで弾くより、落ち着いて続けられそう。", "Please do. It might help me keep going more calmly.", "おねがい。ひとりでひくより、おちついてつづけられそう。"),
      c("そこ、何度も練習したんだ。気づいてくれて、すごくうれしい。", "I practiced that part so often. I am really glad you noticed.", "そこ、なんどもれんしゅうしたんだ。きづいてくれて、すごくうれしい。"),
      c("うん。間違えても、そこからもう一度やってみるね。", "Yes. If I make a mistake, I will try again from there.", "うん。まちがえても、そこからもういちどやってみるね。"),
    ],
  },
  {
    title: c("花壇の相談", "Planning a flowerbed", "かだんのそうだん"),
    scene: c("新しい花壇、花の並べ方で迷ってるんだ。相談に乗ってくれる？", "I cannot decide how to arrange the new flowerbed. Can you help?", "あたらしいかだん、はなのならべかたでまよってるんだ。そうだんにのってくれる？"),
    choices: [
      c("色が少しずつ変わるように並べてみようよ。", "Let us arrange it so the colors change gradually.", "いろがすこしずつかわるようにならべてみようよ。"),
      c("咲く季節ごとに、場所を分けるのはどう？", "How about grouping them by flowering season?", "さくきせつごとに、ばしょをわけるのはどう？"),
      c("好きな花を混ぜて、小道みたいにしてみない？", "Shall we mix our favorites and make a little flower path?", "すきなはなをまぜて、こみちみたいにしてみない？"),
    ],
    responses: [
      c("虹みたいになりそう。間の色を選ぶのも楽しみだね。", "It could look like a rainbow. Choosing the colors between will be fun.", "にじみたいになりそう。あいだのいろをえらぶのもたのしみだね。"),
      c("なるほど。季節が来るたび、違う場所が主役になるんだね。", "I see. A different part will take the spotlight each season.", "なるほど。きせつがくるたび、ちがうばしょがしゅやくになるんだね。"),
      c("いいね。歩くたびに、次の花に会える花壇にしよう。", "Lovely. A flowerbed where each step introduces another flower.", "いいね。あるくたびに、つぎのはなにあえるかだんにしよう。"),
    ],
  },
  {
    title: c("不思議な夢", "A curious dream", "ふしぎなゆめ"),
    scene: c("空飛ぶ鍋の夢を見たんだ。続きが気になって、朝から考えてる。", "I dreamed of a flying pot. I have been wondering what happened next all morning.", "そらとぶなべのゆめをみたんだ。つづきがきになって、あさからかんがえてる。"),
    choices: [
      c("雲の上で、スープを配ってたんじゃない？", "Maybe it was serving soup above the clouds.", "くものうえで、すーぷをくばってたんじゃない？"),
      c("忘れないうちに、絵にしてみようよ。", "Let us draw it before you forget.", "わすれないうちに、えにしてみようよ。"),
      c("まず、その鍋に名前をつけよう。", "First, let us name the pot.", "まず、そのなべになまえをつけよう。"),
    ],
    responses: [
      c("それだ！ 雲が湯気だったら、空じゅうおいしい匂いだね。", "That is it! If the clouds were steam, the whole sky would smell delicious.", "それだ！くもがゆげだったら、そらじゅうおいしいにおいだね。"),
      c("取っ手が羽になってたんだ。そこだけは、はっきり覚えてる。", "Its handles had become wings. I remember that part clearly.", "とってがはねになってたんだ。そこだけは、はっきりおぼえてる。"),
      c("おそらの煮込み号、はどう？ 呼んだら、また夢に来てくれるかな。", "How about the Sky Stew Express? Maybe naming it will bring it back tonight.", "おそらのにこみごう、はどう？よんだら、またゆめにきてくれるかな。"),
    ],
  },
  {
    title: c("釣りの約束", "A fishing promise", "つりのやくそく"),
    scene: c("今度のお休み、川へ行かない？ ふたりで釣りをしてみたいな。", "Shall we go to the river on our next day off? I would like to fish together.", "こんどのおやすみ、かわへいかない？ふたりでつりをしてみたいな。"),
    choices: [
      c("道具は先に点検しておこう。", "Let us check our tackle beforehand.", "どうぐはさきにてんけんしておこう。"),
      c("どんな魚に会いたいか、図鑑を見ようよ。", "Let us use a guidebook to choose which fish we hope to see.", "どんなさかなにあいたいか、ずかんをみようよ。"),
      c("お弁当なら、準備を手伝えるよ。", "I can help prepare lunch.", "おべんとうなら、じゅんびをてつだえるよ。"),
    ],
    responses: [
      c("助かる。糸の結び方、もう一度見てもらっていい？", "That helps. Could you check my knot one more time?", "たすかる。いとのむすびかた、もういちどみてもらっていい？"),
      c("この模様の魚、気になるな。釣れなくても、姿を見てみたい。", "This patterned one interests me. Even if we do not catch it, I would like to see it.", "このもようのさかな、きになるな。つれなくても、すがたをみてみたい。"),
      c("うれしい。お昼が楽しみで、朝から食べないように気をつけるね。", "I am glad. I will try not to eat it all before noon.", "うれしい。おひるがたのしみで、あさからたべないようにきをつけるね。"),
    ],
  },
  {
    title: c("模様替え", "Rearranging a room", "もようがえ"),
    scene: c("部屋の景色を変えたいんだ。どこから動かそうかな。", "I would like my room to look different. Where should I start?", "へやのけしきをかえたいんだ。どこからうごかそうかな。"),
    choices: [
      c("窓辺を少し空けてみよう。", "Let us clear a little space by the window.", "まどべをすこしあけてみよう。"),
      c("お茶を飲める小さな場所を作ろうよ。", "Let us make a little tea corner.", "おちゃをのめるちいさなばしょをつくろうよ。"),
      c("ぬいぐるみを、見えるところに飾ってみない？", "Shall we put the plush toys somewhere easy to see?", "ぬいぐるみを、みえるところにかざってみない？"),
    ],
    responses: [
      c("光が奥まで届きそう。朝、起きるのも楽しみになるね。", "The light could reach farther inside. Mornings might feel nicer too.", "ひかりがおくまでとどきそう。あさ、おきるのもたのしみになるね。"),
      c("椅子はふたつ置きたいな。おしゃべりしに来てくれる？", "I would like two chairs. Will you come over to chat?", "いすはふたつおきたいな。おしゃべりしにきてくれる？"),
      c("うん。帰ってきたとき、迎えてくれる場所にしよう。", "Yes. Somewhere they can greet me when I get home.", "うん。かえってきたとき、むかえてくれるばしょにしよう。"),
    ],
  },
  {
    title: c("名前のない星", "An unnamed star", "なまえのないほし"),
    scene: c("あの星、さっきから気になるんだ。名前を知ってる？", "That star keeps catching my eye. Do you know its name?", "あのほし、さっきからきになるんだ。なまえをしってる？"),
    choices: [
      c("調べるまで、仮の名前をつけておこうか。", "Shall we give it a temporary name until we look it up?", "しらべるまで、かりのなまえをつけておこうか。"),
      c("星図で、この辺りを探してみよう。", "Let us look for this part of the sky on a chart.", "せいずで、このあたりをさがしてみよう。"),
      c("名前は後にして、お願いを話してみない？", "Before we find its name, shall we share a wish?", "なまえはあとにして、おねがいをはなしてみない？"),
    ],
    responses: [
      c("待ち合わせの星、はどう？ 次も見つけやすそう。", "How about the Meeting Star? We could find it again next time.", "まちあわせのほし、はどう？つぎもみつけやすそう。"),
      c("隣の星も目印になるね。ひとつずつ、見比べてみよう。", "The neighboring stars can help. Let us compare them one by one.", "となりのほしもめじるしになるね。ひとつずつ、みくらべてみよう。"),
      c("またこんなふうに、落ち着いて空を見られますように。かな。", "Mine would be to have another peaceful chance to watch the sky like this.", "またこんなふうに、おちついてそらをみられますように。かな。"),
    ],
  },
  {
    title: c("収穫のおすそ分け", "Sharing a harvest", "しゅうかくのおすそわけ"),
    scene: c("野菜が採れたから、小さな食事会をしたいんだ。何から準備しよう？", "I harvested some vegetables and want to host a little dinner. Where should I start?", "やさいがとれたから、ちいさなしょくじかいをしたいんだ。なにからじゅんびしよう？"),
    choices: [
      c("野菜を並べて、献立を考えよう。", "Let us lay out the vegetables and plan the menu.", "やさいをならべて、こんだてをかんがえよう。"),
      c("来られそうな友達に、声をかけてみようよ。", "Let us ask which friends can come.", "こられそうなともだちに、こえをかけてみようよ。"),
      c("食卓に、小さな花を飾るのはどう？", "How about a little flower for the table?", "しょくたくに、ちいさなはなをかざるのはどう？"),
    ],
    responses: [
      c("この色はスープに残したいな。見た目も楽しめる料理にしよう。", "I would like this color in the soup. Let us make the food lovely to look at too.", "このいろはすーぷにのこしたいな。みためもたのしめるりょうりにしよう。"),
      c("そうだね。苦手な食べ物も、先に聞いておきたいな。", "Yes. I would like to ask about foods they dislike beforehand.", "そうだね。にがてなたべものも、さきにきいておきたいな。"),
      c("いいね。料理を置く場所も残して、真ん中に少しだけ飾ろう。", "Lovely. Let us leave room for the dishes and add just a little in the middle.", "いいね。りょうりをおくばしょものこして、まんなかにすこしだけかざろう。"),
    ],
  },
  {
    title: c("秘密の近道", "A secret shortcut", "ひみつのちかみち"),
    scene: c("いつもと違う道を見つけたよ。迷わないように、一緒に覚えてくれる？", "I found a different path. Will you help me remember it so we do not get lost?", "いつもとちがうみちをみつけたよ。まよわないように、いっしょにおぼえてくれる？"),
    choices: [
      c("曲がり角の景色を覚えていこう。", "Let us remember the view at each turn.", "まがりかどのけしきをおぼえていこう。"),
      c("動かない岩を、目印にするのはどう？", "How about using the fixed rocks as landmarks?", "うごかないいわを、めじるしにするのはどう？"),
      c("教えてくれてありがとう。ゆっくり案内してね。", "Thank you for showing me. Please lead the way slowly.", "おしえてくれてありがとう。ゆっくりあんないしてね。"),
    ],
    responses: [
      c("あの大きな木が目印だね。帰りは、反対からも見ておこう。", "That big tree can guide us. Let us look at it from the other side too.", "あのおおきなきがめじるしだね。かえりは、はんたいからもみておこう。"),
      c("いい考え。花だけだと、季節が変わったら迷いそうだものね。", "Good idea. Flowers alone might confuse us when the season changes.", "いいかんがえ。はなだけだと、きせつがかわったらまよいそうだものね。"),
      c("うん。近道だけど、今日は急がず楽しもう。", "I will. It is a shortcut, but today we can take our time.", "うん。ちかみちだけど、きょうはいそがずたのしもう。"),
    ],
  },
  {
    title: c("届かない風鈴", "A wind chime out of reach", "とどかないふうりん"),
    scene: c("風鈴を飾りたいんだけど、高いところは届かないんだ。", "I want to hang this wind chime, but I cannot reach up there.", "ふうりんをかざりたいんだけど、たかいところはとどかないんだ。"),
    choices: [
      c("低い場所でも、風が通るところを探そう。", "Let us find a lower spot with a breeze.", "ひくいばしょでも、かぜがとおるところをさがそう。"),
      c("丈夫な台を用意して、手伝ってもらおう。", "Let us get a sturdy step and ask someone to help.", "じょうぶなだいをよういして、てつだってもらおう。"),
      c("まずは手で持って、音を聞かせてよ。", "First, hold it and let me hear its sound.", "まずはてでもって、おとをきかせてよ。"),
    ],
    responses: [
      c("ここなら手が届くね。音も近くで聞けそう。", "I can reach here. We will hear it nearby too.", "ここならてがとどくね。おともちかくできけそう。"),
      c("そうする。背伸びだけで頑張るより、安心だね。", "I will. That is safer than stretching as far as I can.", "そうする。せのびだけでがんばるより、あんしんだね。"),
      c("ちりん、って優しいね。飾る場所は、音を聞いてから決めよう。", "Such a gentle little ring. We can choose its place after listening.", "ちりん、ってやさしいね。かざるばしょは、おとをきいてからきめよう。"),
    ],
  },
  {
    title: c("焼きすぎたクッキー", "Cookies left in too long", "やきすぎたくっきー"),
    scene: c("クッキー、少し焼きすぎちゃった。楽しみにしてたのにな。", "I baked the cookies a little too long. I was looking forward to them.", "くっきー、すこしやきすぎちゃった。たのしみにしてたのにな。"),
    choices: [
      c("焦げていないところを、少し味見してみよう。", "Let us taste a little of the part that is not burnt.", "こげていないところを、すこしあじみしてみよう。"),
      c("次は焼く時間を、一緒に計ってみよう。", "Next time let us time them together.", "つぎはやくじかんを、いっしょにはかってみよう。"),
      c("今日は休憩して、また作りたくなったら作ろう。", "Let us rest today and try again when you feel like it.", "きょうはきゅうけいして、またつくりたくなったらつくろう。"),
    ],
    responses: [
      c("端は苦いけど、真ん中は大丈夫そう。全部失敗じゃなかったね。", "The edges are bitter, but the middle seems fine. It was not all a failure.", "はしはにがいけど、まんなかはだいじょうぶそう。ぜんぶしっぱいじゃなかったね。"),
      c("お願い。おしゃべりに夢中で、時計を忘れちゃったんだ。", "Please. I got so caught up in talking that I forgot the clock.", "おねがい。おしゃべりにむちゅうで、とけいをわすれちゃったんだ。"),
      c("ありがとう。急いでやり直さなくてもいいって、ほっとした。", "Thank you. It is a relief not to have to fix it immediately.", "ありがとう。いそいでやりなおさなくてもいいって、ほっとした。"),
    ],
  },
  {
    title: c("白紙の手紙", "A blank letter", "はくしのてがみ"),
    scene: c("久しぶりに手紙を書きたいのに、最初の言葉が出てこないんだ。", "I want to write a letter after a long time, but cannot find the first words.", "ひさしぶりにてがみをかきたいのに、さいしょのことばがでてこないんだ。"),
    choices: [
      c("今日見たものから、書いてみたら？", "Why not start with something you saw today?", "きょうみたものから、かいてみたら？"),
      c("元気にしてる？ って聞くだけでもいいと思う。", "I think asking how they are is a good start.", "げんきにしてる？ってきくだけでもいいとおもう。"),
      c("まずは下書きに、思いつくまま書いてみよう。", "Let us start a draft and write whatever comes to mind.", "まずはしたがきに、おもいつくままかいてみよう。"),
    ],
    responses: [
      c("道端の花のことなら書けそう。大きな出来事じゃなくていいんだね。", "I could write about the roadside flowers. It need not be a big event.", "みちばたのはなのことならかけそう。おおきなできごとじゃなくていいんだね。"),
      c("そうだね。一番知りたかったことなのに、忘れてたよ。", "You are right. That is what I most wanted to know.", "そうだね。いちばんしりたかったことなのに、わすれてたよ。"),
      c("消してもいい紙だと、少し気楽になるね。鉛筆を持ってくる。", "A page I can erase feels less daunting. I will get a pencil.", "けしてもいいかみだと、すこしきらくになるね。えんぴつをもってくる。"),
    ],
  },
  {
    title: c("片方だけの手袋", "One lonely glove", "かたほうだけのてぶくろ"),
    scene: c("手袋が片方だけないんだ。どこで外したんだろう。", "One glove is missing. Where did I take it off?", "てぶくろがかたほうだけないんだ。どこではずしたんだろう。"),
    choices: [
      c("歩いた道を、順番に思い出そう。", "Let us remember your route in order.", "あるいたみちを、じゅんばんにおもいだそう。"),
      c("かばんの奥も、もう一度見てみようよ。", "Let us check the bottom of your bag again.", "かばんのおくも、もういちどみてみようよ。"),
      c("見つかるまで、手を冷やさないようにしよう。", "Let us keep your hands warm while we look.", "みつかるまで、てをひやさないようにしよう。"),
    ],
    responses: [
      c("お茶を飲んだベンチかも。カップを持つときに外した気がする。", "Maybe the bench where I had tea. I think I removed it to hold the cup.", "おちゃをのんだべんちかも。かっぷをもつときにはずしたきがする。"),
      c("あ、入ってた！ 奥で丸くなってたんだね。探してくれてありがとう。", "Oh, here it is! Curled up at the bottom. Thank you for helping.", "あ、はいってた！おくでまるくなってたんだね。さがしてくれてありがとう。"),
      c("うん。先に建物の中へ入ろう。慌てると、他の物もなくしそう。", "Yes. Let us go indoors first. Rushing might make me lose something else.", "うん。さきにたてもののなかへはいろう。あわてると、ほかのものもなくしそう。"),
    ],
  },
  {
    title: c("看板の小さな誤字", "A tiny mistake on a sign", "かんばんのちいさなごじ"),
    scene: c("この看板、ひと文字だけ違う気がする。伝えていいのかな。", "I think one letter on this sign is wrong. Should we mention it?", "このかんばん、ひともじだけちがうきがする。つたえていいのかな。"),
    choices: [
      c("お店の人に、そっと聞いてみよう。", "Let us quietly ask the shopkeeper.", "おみせのひとに、そっときいてみよう。"),
      c("もしかしたら、特別な名前かもしれないよ。", "It could be a special name.", "もしかしたら、とくべつななまえかもしれないよ。"),
      c("まず、ふたりで一文字ずつ読んでみよう。", "First, let us read it one letter at a time.", "まず、ふたりでひともじずつよんでみよう。"),
    ],
    responses: [
      c("うん。間違ってるって決めつけずに、確かめてみるね。", "Yes. I will ask without assuming it is a mistake.", "うん。まちがってるってきめつけずに、たしかめてみるね。"),
      c("なるほど。そのまま読む前に、意味も考えてみないとね。", "I see. We should think about what it means too.", "なるほど。そのままよむまえに、いみもかんがえてみないとね。"),
      c("あ、こっちが読み違えてたかも。先に確かめてよかった。", "Oh, perhaps I misread it. I am glad we checked first.", "あ、こっちがよみちがえてたかも。さきにたしかめてよかった。"),
    ],
  },
  {
    title: c("朝の散歩係", "Morning walk companions", "あさのさんぽがかり"),
    scene: c("朝の散歩を続けたいんだけど、ひとりだと寝坊しちゃうんだ。", "I want to keep taking morning walks, but I oversleep when I go alone.", "あさのさんぽをつづけたいんだけど、ひとりだとねぼうしちゃうんだ。"),
    choices: [
      c("まずは短い道を、一緒に歩こうよ。", "Let us start with a short walk together.", "まずはみじかいみちを、いっしょにあるこうよ。"),
      c("散歩の後の楽しみを、決めておかない？", "Shall we plan a little treat for afterward?", "さんぽのあとのたのしみを、きめておかない？"),
      c("毎日じゃなくて、週に少しずつ始めよう。", "Let us start with a few walks each week rather than every day.", "まいにちじゃなくて、しゅうにすこしずつはじめよう。"),
    ],
    responses: [
      c("それならできそう。遠くまで行かなきゃ、って思ってたんだ。", "That sounds manageable. I thought I had to go far.", "それならできそう。とおくまでいかなきゃ、っておもってたんだ。"),
      c("温かい朝ごはんかな。戻ってくるのも楽しみになるね。", "A warm breakfast, perhaps. Then I can look forward to coming back too.", "あたたかいあさごはんかな。もどってくるのもたのしみになるね。"),
      c("うん。休む日があっても、やめたことにはならないものね。", "Yes. Taking a day off does not mean giving up.", "うん。やすむひがあっても、やめたことにはならないものね。"),
    ],
  },
  {
    title: c("秘密のおやつ会議", "A secret snack meeting", "ひみつのおやつかいぎ"),
    scene: c("おやつを選んでたら、どれもおいしそうで決まらなくなった。", "I was choosing a snack, but everything looks too good to decide.", "おやつをえらんでたら、どれもおいしそうできまらなくなった。"),
    choices: [
      c("今日は、まだ食べたことのない味にしよう。", "Let us try a flavor we have never had today.", "きょうは、まだたべたことのないあじにしよう。"),
      c("少しずつ分けられるものを選ぶのは？", "How about something we can share in little portions?", "すこしずつわけられるものをえらぶのは？"),
      c("一番好きな味は、今度の楽しみに取っておこう。", "Let us save our favorite for next time.", "いちばんすきなあじは、こんどのたのしみにとっておこう。"),
    ],
    responses: [
      c("小さな冒険だね。ひと口目の感想、同時に言ってみよう。", "A tiny adventure. Let us share our first impressions together.", "ちいさなぼうけんだね。ひとくちめのかんそう、どうじにいってみよう。"),
      c("それなら、ふたつの味を楽しめるね。大きさも相談して決めよう。", "Then we can try two flavors. Let us agree on the portions too.", "それなら、ふたつのあじをたのしめるね。おおきさもそうだんしてきめよう。"),
      c("なるほど。今日も次も楽しみになる選び方だね。", "I see. That gives us something to enjoy today and next time.", "なるほど。きょうもつぎもたのしみになるえらびかただね。"),
    ],
  },
  {
    title: c("古い箱の整理", "Sorting an old box", "ふるいはこのせいり"),
    scene: c("箱を片づけてたら、懐かしい物が出てきて進まないんだ。", "I found old keepsakes while tidying this box, and now I cannot make progress.", "はこをかたづけてたら、なつかしいものがでてきてすすまないんだ。"),
    choices: [
      c("ひとつだけ、思い出を聞かせてくれる？", "Will you tell me the story of just one thing?", "ひとつだけ、おもいでをきかせてくれる？"),
      c("残す物を決める前に、種類ごとに分けよう。", "Let us sort by type before choosing what to keep.", "のこすものをきめるまえに、しゅるいごとにわけよう。"),
      c("今日は箱ひとつ分だけにしておこう。", "Let us stop after one box today.", "きょうははこひとつぶんだけにしておこう。"),
    ],
    responses: [
      c("この石、初めて川へ行った日に拾ったんだ。小さいのに忘れられないね。", "I found this stone on my first trip to the river. Such a small, lasting memory.", "このいし、はじめてかわへいったひにひろったんだ。ちいさいのにわすれられないね。"),
      c("うん。いきなり手放すか決めなくていいなら、始められそう。", "Yes. I can start if I do not have to decide what to part with yet.", "うん。いきなりてばなすかきめなくていいなら、はじめられそう。"),
      c("そうしよう。全部終わらなくても、置く場所がひとつ空けば十分だね。", "Let us. One clear space is enough, even if we do not finish everything.", "そうしよう。ぜんぶおわらなくても、おくばしょがひとつあけばじゅうぶんだね。"),
    ],
  },
  {
    title: c("眠れない夜の数え歌", "A counting song for a restless night", "ねむれないよるのかぞえうた"),
    scene: c("昨日、眠れなくて羊を数えたら、途中で見失っちゃった。", "Last night I counted sheep to fall asleep, but lost track of them.", "きのう、ねむれなくてひつじをかぞえたら、とちゅうでみうしなっちゃった。"),
    choices: [
      c("羊が寄り道しちゃったのかもね。", "Maybe the sheep took a detour.", "ひつじがよりみちしちゃったのかもね。"),
      c("数えるのをやめて、ゆっくり休むだけでもいいよ。", "You can stop counting and simply rest.", "かぞえるのをやめて、ゆっくりやすむだけでもいいよ。"),
      c("今日は少し日を浴びて、無理せず過ごそう。", "Let us enjoy a little daylight and take things gently today.", "きょうはすこしひをあびて、むりせずすごそう。"),
    ],
    responses: [
      c("ふふ。夜中に草を食べてたのかな。そう思うと、少し気が楽だね。", "Hehe. Perhaps they stopped for grass. That makes me feel better.", "ふふ。よなかにくさをたべてたのかな。そうおもうと、すこしきがらくだね。"),
      c("うん。ちゃんと眠らなきゃって、力が入りすぎてたのかも。", "Yes. Perhaps I was trying too hard to fall asleep properly.", "うん。ちゃんとねむらなきゃって、ちからがはいりすぎてたのかも。"),
      c("ありがとう。おしゃべりも、今日はのんびりがうれしいな。", "Thank you. I would appreciate a slow, easy conversation today.", "ありがとう。おしゃべりも、きょうはのんびりがうれしいな。"),
    ],
  },
  {
    title: c("ふたりの小さな発表会", "A little show for two", "ふたりのちいさなはっぴょうかい"),
    scene: c("新しく覚えたこと、誰かに話したいんだ。聞いてくれる？", "I learned something new and want to tell someone. Will you listen?", "あたらしくおぼえたこと、だれかにはなしたいんだ。きいてくれる？"),
    choices: [
      c("もちろん。まず、一番面白かったところからどうぞ。", "Of course. Start with the part you found most interesting.", "もちろん。まず、いちばんおもしろかったところからどうぞ。"),
      c("絵を描きながら説明してみない？", "Would you like to explain with a drawing?", "えをかきながらせつめいしてみない？"),
      c("途中で質問してもいい？ 一緒に考えたいな。", "May I ask questions along the way? I want to think with you.", "とちゅうでしつもんしてもいい？いっしょにかんがえたいな。"),
    ],
    responses: [
      c("最初から順番じゃなくてもいいんだね。それなら話せそう！", "I do not have to explain in order? Then I think I can do it!", "さいしょからじゅんばんじゃなくてもいいんだね。それならはなせそう！"),
      c("助かる。言葉だけだと迷うところも、線ならつなげられるね。", "That helps. Lines can connect the parts I struggle to explain.", "たすかる。ことばだけだとまようところも、せんならつなげられるね。"),
      c("うん。わからないところがあったら、一緒に調べるところまで付き合ってね。", "Yes. If we get stuck, please join me in looking it up too.", "うん。わからないところがあったら、いっしょにしらべるところまでつきあってね。"),
    ],
  },
  {
    title: c("帰り道の灯り", "A light on the way home", "かえりみちのあかり"),
    scene: c("あの窓の灯り、いつも帰り道に見えるんだ。今日は少し安心した。", "I always see that lit window on my way home. It comforted me today.", "あのまどのあかり、いつもかえりみちにみえるんだ。きょうはすこしあんしんした。"),
    choices: [
      c("知っている景色って、ほっとするよね。", "Familiar sights can be comforting.", "しっているけしきって、ほっとするよね。"),
      c("家に着いたら、最初に何をしたい？", "What would you like to do first when you get home?", "いえについたら、さいしょになにをしたい？"),
      c("もう少し、一緒に歩いて帰ろう。", "Let us walk together a little farther.", "もうすこし、いっしょにあるいてかえろう。"),
    ],
    responses: [
      c("うん。遠くへ行った日ほど、いつもの道がうれしくなる。", "Yes. The farther I travel, the happier I am to see this path.", "うん。とおくへいったひほど、いつものみちがうれしくなる。"),
      c("靴を脱いで、温かいものを飲みたいな。話の続きは、そのあとで。", "Take off my shoes and have something warm. We can keep talking after that.", "くつをぬいで、あたたかいものをのみたいな。はなしのつづきは、そのあとで。"),
      c("ありがとう。最後の曲がり角まで、今日の話を聞かせてね。", "Thank you. Tell me about your day until the last turn.", "ありがとう。さいごのまがりかどまで、きょうのはなしをきかせてね。"),
    ],
  },
  {
    title: c("次の約束のメモ", "A note for next time", "つぎのやくそくのめも"),
    scene: c("今度やりたいこと、話してると増えちゃうね。忘れないかな。", "We keep finding more things to do next time. Will we remember them all?", "こんどやりたいこと、はなしてるとふえちゃうね。わすれないかな。"),
    choices: [
      c("小さなメモに、ひとつずつ書こうよ。", "Let us write each one on a little note.", "ちいさなめもに、ひとつずつかこうよ。"),
      c("次に会った日の気分で、選ぶのはどう？", "How about choosing by our mood when we next meet?", "つぎにあったひのきぶんで、えらぶのはどう？"),
      c("まず、一番楽しみなことを教えて。", "First, tell me what you are most looking forward to.", "まず、いちばんたのしみなことをおしえて。"),
    ],
    responses: [
      c("書いて並べると、楽しみが目に見えるね。全部急がなくてもよさそう。", "Seeing them written out makes our plans feel real. No need to rush them all.", "かいてならべると、たのしみがめにみえるね。ぜんぶいそがなくてもよさそう。"),
      c("いいね。晴れた日と雨の日で、別の楽しみを用意しておこう。", "Good idea. We can have different plans for sunshine and rain.", "いいね。はれたひとあめのひで、べつのたのしみをよういしておこう。"),
      c("また一緒に出かけること。場所は、その次に考えたいな。", "Going out together again. We can decide the place afterward.", "またいっしょにでかけること。ばしょは、そのつぎにかんがえたいな。"),
    ],
  },
];
