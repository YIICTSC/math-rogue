import { c, type Copy } from "./catalog";
import { GIFT_FOLLOWUPS } from "./giftDialogue";
export const CHAT_TOPICS: Copy[] = [
  {
    ja: "花壇に新しい芽を見つけたよ。どんな花になるかな？",
    en: "I found a new sprout. What flower will it become?",
    hi: "かだんにあたらしいめをみつけたよ。どんなはなになるかな？",
  },
  {
    ja: "川で逃した魚、次は釣れる気がする！",
    en: "I think I can catch the fish that escaped next time!",
    hi: "かわでにがしたさかな、つぎはつれるきがする！",
  },
  {
    ja: "昨日のスープ、隠し味は何だったと思う？",
    en: "What do you think was the secret ingredient in yesterday’s soup?",
    hi: "きのうのすーぷ、かくしあじはなんだったとおもう？",
  },
  {
    ja: "ペットが私の靴を枕にして寝ていたんだ。",
    en: "My pet fell asleep using my shoe as a pillow.",
    hi: "ぺっとがわたしのくつをまくらにしてねていたんだ。",
  },
  {
    ja: "畑の水やりのあと、虹が見えたよ。",
    en: "I saw a rainbow after watering the field.",
    hi: "はたけのみずやりのあと、にじがみえたよ。",
  },
  {
    ja: "街の道が増えると、知らない近道もできるね。",
    en: "New streets also bring new shortcuts to discover.",
    hi: "まちのみちがふえると、しらないちかみちもできるね。",
  },
  {
    ja: "家に空いている場所があるんだ。何を飾ろう？",
    en: "There is an empty space at home. What should I put there?",
    hi: "いえにあいているばしょがあるんだ。なにをかざろう？",
  },
  {
    ja: "昨夜、しゃべるニンジンの夢を見たよ。",
    en: "Last night I dreamed of a talking carrot.",
    hi: "さくや、しゃべるにんじんのゆめをみたよ。",
  },
  {
    ja: "本の間から、昔の押し花が出てきたんだ。",
    en: "An old pressed flower fell out of my book.",
    hi: "ほんのあいだから、むかしのおしばながでてきたんだ。",
  },
  {
    ja: "音楽を聴くと、歩くリズムまで変わるね。",
    en: "Music even changes the rhythm of my walk.",
    hi: "おんがくをきくと、あるくりずむまでかわるね。",
  },
  {
    ja: "今日は雲がパンみたいな形だった。",
    en: "Today the clouds looked like bread.",
    hi: "きょうはくもがぱんみたいなかたちだった。",
  },
  {
    ja: "家畜の名前を呼ぶと、ちゃんと振り向いてくれるね。",
    en: "The animals turn around when I call their names.",
    hi: "かちくのなまえをよぶと、ちゃんとふりむいてくれるね。",
  },
  {
    ja: "遠くの遺跡には、まだ知らない物語がありそう。",
    en: "There must be untold stories in those distant ruins.",
    hi: "とおくのいせきには、まだしらないものがたりがありそう。",
  },
  {
    ja: "休むのも冒険の準備のうち、だよね。",
    en: "Resting is part of preparing for an adventure, right?",
    hi: "やすむのもぼうけんのじゅんびのうち、だよね。",
  },
  {
    ja: "贈り物を選ぶ時間って、相手のことを考える時間だね。",
    en: "Choosing a gift is time spent thinking about someone.",
    hi: "おくりものをえらぶじかんって、あいてのことをかんがえるじかんだね。",
  },
  {
    ja: "釣り図鑑の空白を、少しずつ埋めたいな。",
    en: "I want to fill the empty pages in my fish journal.",
    hi: "つりずかんのくうはくを、すこしずつうめたいな。",
  },
  {
    ja: "今日は市場で、見たことのない料理を見つけたよ。",
    en: "I discovered an unfamiliar dish at the market today.",
    hi: "きょうはいちばで、みたことのないりょうりをみつけたよ。",
  },
  {
    ja: "夜の街の灯り、ひとつひとつが誰かの暮らしなんだね。",
    en: "Every light in town at night is someone’s life.",
    hi: "よるのまちのあかり、ひとつひとつがだれかのくらしなんだね。",
  },
  {
    ja: "失敗した料理も、次のレシピのヒントになるかな？",
    en: "Could a failed dish inspire the next recipe?",
    hi: "しっぱいしたりょうりも、つぎのれしぴのひんとになるかな？",
  },
  {
    ja: "お気に入りの景色を、あなたにも見せたいな。",
    en: "I want to show you my favorite view.",
    hi: "おきにいりのけしきを、あなたにもみせたいな。",
  },
  {
    ja: "春の風には、始まりの匂いがするね。",
    en: "The spring breeze smells like a new beginning.",
    hi: "はるのかぜには、はじまりのにおいがするね。",
  },
  {
    ja: "夏は川辺で涼みながら話したくなる。",
    en: "Summer makes me want to chat beside the cool river.",
    hi: "なつはかわべですずみながらはなしたくなる。",
  },
  {
    ja: "秋の葉っぱを並べたら、地図みたいになったよ。",
    en: "Autumn leaves arranged together looked like a map.",
    hi: "あきのはっぱをならべたら、ちずみたいになったよ。",
  },
  {
    ja: "冬は温かい飲み物を半分こしたいね。",
    en: "In winter, I want to share a warm drink.",
    hi: "ふゆはあたたかいのみものをはんぶんこしたいね。",
  },
];
export const PERSONALITY_REPLIES: Copy[][] = [
  [
    {
      ja: "それなら、お茶を用意してゆっくり聞きたいな。",
      en: "Let me make tea and hear all about it.",
      hi: "それなら、おちゃをよういしてゆっくりききたいな。",
    },
    {
      ja: "小さな発見を教えてくれてありがとう。",
      en: "Thank you for sharing that little discovery.",
      hi: "ちいさなはっけんをおしえてくれてありがとう。",
    },
    {
      ja: "ふたりで楽しめると、いつもの日も特別だね。",
      en: "Sharing it makes an ordinary day special.",
      hi: "ふたりでたのしめると、いつものひもとくべつだね。",
    },
  ],
  [
    {
      ja: "見に行こう！ 道の途中にも発見がありそう。",
      en: "Let’s go see it! There may be discoveries along the way.",
      hi: "みにいこう！みちのとちゅうにもはっけんがありそう。",
    },
    {
      ja: "どうしてそうなるんだろう？ もっと知りたい！",
      en: "Why does that happen? I want to know more!",
      hi: "どうしてそうなるんだろう？もっとしりたい！",
    },
    {
      ja: "次は違う場所でも試してみようよ。",
      en: "Let’s try a different place next time.",
      hi: "つぎはちがうばしょでもためしてみようよ。",
    },
  ],
  [
    {
      ja: "記録を残して、明日と比べてみたいね。",
      en: "Let’s record it and compare with tomorrow.",
      hi: "きろくをのこして、あしたとくらべてみたいね。",
    },
    {
      ja: "ひとつずつ確かめたら、理由がわかるかも。",
      en: "Checking step by step might reveal the reason.",
      hi: "ひとつずつたしかめたら、りゆうがわかるかも。",
    },
    {
      ja: "結論を急がず、もう少し観察してみよう。",
      en: "Let’s observe a little more before deciding.",
      hi: "けつろんをいそがず、もうすこしかんさつしてみよう。",
    },
  ],
  [
    {
      ja: "その話、みんなで聞いたら盛り上がりそう！",
      en: "That story would be fun to share with everyone!",
      hi: "そのはなし、みんなできいたらもりあがりそう！",
    },
    {
      ja: "続きが気になる！ 次の食事会で聞かせて。",
      en: "I want to hear more at our next dinner party!",
      hi: "つづきがきになる！つぎのしょくじかいできかせて。",
    },
    {
      ja: "今のあなたの顔、すごく楽しそうだったよ。",
      en: "Your face looked so happy just now.",
      hi: "いまのあなたのかお、すごくたのしそうだったよ。",
    },
  ],
  [
    {
      ja: "道具を整えておくと、次はもっと上手にできるね。",
      en: "Preparing our tools will help us do better next time.",
      hi: "どうぐをととのえておくと、つぎはもっとうまくできるね。",
    },
    {
      ja: "細かいところに気づくのって楽しいね。",
      en: "It is fun to notice the tiny details.",
      hi: "こまかいところにきづくのってたのしいね。",
    },
    {
      ja: "大切に手入れして、長く楽しもう。",
      en: "Let’s take care of it and enjoy it for a long time.",
      hi: "たいせつにていれして、ながくたのしもう。",
    },
  ],
  [
    {
      ja: "夢の中なら、それに翼が生えていたかも。",
      en: "In a dream, it might have grown wings.",
      hi: "ゆめのなかなら、それにつばさがはえていたかも。",
    },
    {
      ja: "想像すると、空の色まで変わりそう。",
      en: "Imagining it almost changes the color of the sky.",
      hi: "そうぞうすると、そらのいろまでかわりそう。",
    },
    {
      ja: "物語にしたら、不思議な旅が始まりそうだね。",
      en: "As a story, that could start a curious journey.",
      hi: "ものがたりにしたら、ふしぎなたびがはじまりそうだね。",
    },
  ],
  [
    {
      ja: "一緒にやってみよう！ まずは小さな一歩から。",
      en: "Let’s try together! Start with one small step.",
      hi: "いっしょにやってみよう！まずはちいさないっぽから。",
    },
    {
      ja: "失敗しても大丈夫。次の工夫が見つかるよ！",
      en: "Mistakes are fine. They lead to the next idea!",
      hi: "しっぱいしてもだいじょうぶ。つぎのくふうがみつかるよ！",
    },
    {
      ja: "私も負けていられないな。練習しよう！",
      en: "I should keep up too. Let’s practice!",
      hi: "わたしもまけていられないな。れんしゅうしよう！",
    },
  ],
  [
    {
      ja: "その瞬間の色を、絵に残しておきたいな。",
      en: "I would like to paint the colors of that moment.",
      hi: "そのしゅんかんのいろを、えにのこしておきたいな。",
    },
    {
      ja: "静かに眺めると、違う表情が見えるね。",
      en: "Looking quietly reveals another side.",
      hi: "しずかにながめると、ちがうひょうじょうがみえるね。",
    },
    {
      ja: "言葉にしきれないけど、心に残る景色だね。",
      en: "Words cannot capture it, but the scene stays with me.",
      hi: "ことばにしきれないけど、こころにのこるけしきだね。",
    },
  ],
];
export { RESIDENT_STORIES } from "./storyDialogue";
export const OUTING_BACKGROUNDS = Array.from(
  { length: 6 },
  (_, i) => `sprites/rpg/outing/route-${i}.webp`,
);
export const STORY_ENDINGS = [
  c(
    "その選択に、住人はうれしそうにうなずいた。ふたりの小さな思い出が増えた。",
    "Your friend nods happily. Another small memory joins your story.",
    "そのせんたくに、じゅうにんはうれしそうにうなずいた。ふたりのちいさなおもいでがふえた。",
  ),
  c(
    "思いがけない発見に、ふたりで顔を見合わせて笑った。",
    "An unexpected discovery makes you look at each other and laugh.",
    "おもいがけないはっけんに、ふたりでかおをみあわせてわらった。",
  ),
  c(
    "急がず話し合って、ふたりらしい答えが見つかった。",
    "Taking time to talk reveals an answer that suits you both.",
    "いそがずはなしあって、ふたりらしいこたえがみつかった。",
  ),
];
export function giftReaction(
  name: Copy,
  personality: number,
  taste: number,
  variant: number,
  kind: "food" | "flower",
  special = false,
): Copy[] {
  const lead =
    kind === "flower"
      ? c(
          `${name.ja}を贈るよ。あなたに似合うと思って。`,
          `Here is ${name.en}. I thought it would suit you.`,
          `${name.hi}をおくるよ。あなたににあうとおもって。`,
        )
      : c(
          `${name.ja}を作ったよ。一緒に味わおう。`,
          `I made ${name.en}. Let’s enjoy it together.`,
          `${name.hi}をつくったよ。いっしょにあじわおう。`,
        );
  const responses =
    kind === "flower"
      ? FLOWER_REACTIONS
      : taste === 2
        ? FAVORITE_REACTIONS
        : taste < 0
          ? DISLIKED_REACTIONS
          : MEAL_REACTIONS;
  const reply = responses[(personality + variant) % responses.length];
  const category = kind === "flower" ? 0 : taste === 2 ? 1 : taste < 0 ? 3 : 2;
  const followup = GIFT_FOLLOWUPS[category][variant % GIFT_FOLLOWUPS[category].length];
  return [lead, reply, followup[0], special && taste >= 0
    ? c("こんな日の贈り物だから、今日のことも一緒に覚えておきたいな。", "A gift on a day like this makes me want to remember the whole day.", "こんなひのおくりものだから、きょうのこともいっしょにおぼえておきたいな。")
    : followup[1]];
}
export const FLOWER_REACTIONS: Copy[] = [
  {
    ja: "窓辺に飾ろう。明日の朝が楽しみになったよ。",
    en: "I will put it by the window. Now I look forward to tomorrow morning.",
    hi: "まどべにかざろう。あしたのあさがたのしみになったよ。",
  },
  {
    ja: "花びらの形、よく見ると小さな地図みたい！",
    en: "The petals look like a tiny map up close!",
    hi: "はなびらのかたち、よくみるとちいさなちずみたい！",
  },
  {
    ja: "この色の名前を調べて、日記に書いておこう。",
    en: "I will look up this color and write it in my diary.",
    hi: "このいろのなまえをしらべて、にっきにかいておこう。",
  },
  {
    ja: "あなたが選んでくれた花だって、みんなに自慢したい！",
    en: "I want to tell everyone you chose this flower for me!",
    hi: "あなたがえらんでくれたはなだって、みんなにじまんしたい！",
  },
  {
    ja: "茎を少し切って、水を替えて、大切に育てるね。",
    en: "I will trim the stem, change the water, and care for it.",
    hi: "くきをすこしきって、みずをかえて、たいせつにそだてるね。",
  },
  {
    ja: "花の妖精が、贈り物を届けてくれた気分だよ。",
    en: "It feels as though a flower fairy delivered a gift.",
    hi: "はなのようせいが、おくりものをとどけてくれたきぶんだよ。",
  },
  {
    ja: "元気の出る色だね！ 今日も頑張れそう。",
    en: "What an energizing color! I feel ready for the day.",
    hi: "げんきのでるいろだね！きょうもがんばれそう。",
  },
  {
    ja: "今の光の中で描きたい。花瓶を探してくるね。",
    en: "I want to paint it in this light. Let me find a vase.",
    hi: "いまのひかりのなかでえがきたい。かびんをさがしてくるね。",
  },
  {
    ja: "押し花にすれば、この気持ちを長く残せるかな。",
    en: "Pressing it might preserve this feeling for a long time.",
    hi: "おしばなにすれば、このきもちをながくのこせるかな。",
  },
  {
    ja: "香りがやさしいね。少し肩の力が抜けたよ。",
    en: "It smells gentle. I feel a little more relaxed.",
    hi: "かおりがやさしいね。すこしかたのちからがぬけたよ。",
  },
  {
    ja: "花を受け取るの、ちょっと照れる。でもうれしい。",
    en: "Receiving flowers makes me a little shy, but happy.",
    hi: "はなをうけとるの、ちょっとてれる。でもうれしい。",
  },
  {
    ja: "この花を見るたび、今日のおしゃべりを思い出すね。",
    en: "Whenever I see it, I will remember today’s conversation.",
    hi: "このはなをみるたび、きょうのおしゃべりをおもいだすね。",
  },
];
export const FAVORITE_REACTIONS: Copy[] = [
  {
    ja: "この味、大好き！ 私の好みを覚えてくれていたんだね。",
    en: "I love this flavor! You remembered what I like.",
    hi: "このあじ、だいすき！わたしのこのみをおぼえてくれていたんだね。",
  },
  {
    ja: "ひと口で元気になった。次も同じ料理をお願いしていい？",
    en: "One bite energizes me. May I ask for this again?",
    hi: "ひとくちでげんきになった。つぎもおなじりょうりをおねがいしていい？",
  },
  {
    ja: "好きな味を、好きな人と食べる。ぜいたくな時間だね。",
    en: "A favorite meal with a dear friend. What a lovely moment.",
    hi: "すきなあじを、すきなひととたべる。ぜいたくなじかんだね。",
  },
  {
    ja: "香りだけでわかったよ！ 今日はごちそうの日だ。",
    en: "I recognized it by the aroma! Today is a feast.",
    hi: "かおりだけでわかったよ！きょうはごちそうのひだ。",
  },
  {
    ja: "レシピを教えてほしいな。あなたの味を覚えたい。",
    en: "Please teach me the recipe. I want to remember your cooking.",
    hi: "れしぴをおしえてほしいな。あなたのあじをおぼえたい。",
  },
  {
    ja: "食べ終わるのが惜しいくらい、おいしい！",
    en: "It is so delicious I almost do not want to finish it!",
    hi: "たべおわるのがおしいくらい、おいしい！",
  },
  {
    ja: "うれしくて、足が勝手にリズムを取ってる。",
    en: "I am so happy my feet are keeping a beat.",
    hi: "うれしくて、あしがかってにりずむをとってる。",
  },
  {
    ja: "この味に名前をつけるなら、幸せのひと皿かな。",
    en: "I would name this flavor a plate of happiness.",
    hi: "このあじになまえをつけるなら、しあわせのひとさらかな。",
  },
];
export const DISLIKED_REACTIONS: Copy[] = [
  {
    ja: "少し苦手な味だけど、作ってくれた気持ちはうれしいよ。",
    en: "It is not quite my taste, but I appreciate your care.",
    hi: "すこしにがてなあじだけど、つくってくれたきもちはうれしいよ。",
  },
  {
    ja: "私には強い味かも。次は少しやさしい味だといいな。",
    en: "It is a little strong for me. A milder flavor next time would be nice.",
    hi: "わたしにはつよいあじかも。つぎはすこしやさしいあじだといいな。",
  },
  {
    ja: "好みは違っても、一緒の食卓は好きだよ。",
    en: "Our tastes differ, but I enjoy sharing a table with you.",
    hi: "このみはちがっても、いっしょのしょくたくはすきだよ。",
  },
  {
    ja: "びっくりする味！ お茶をひと口もらっていい？",
    en: "What a surprising flavor! May I have a sip of tea?",
    hi: "びっくりするあじ！おちゃをひとくちもらっていい？",
  },
  {
    ja: "全部は難しいけど、少しずつ味わってみるね。",
    en: "I may not finish it, but I will try a little at a time.",
    hi: "ぜんぶはむずかしいけど、すこしずつあじわってみるね。",
  },
  {
    ja: "正直に言うと得意じゃない。でもありがとう。",
    en: "Honestly, it is not a favorite. But thank you.",
    hi: "しょうじきにいうととくいじゃない。でもありがとう。",
  },
  {
    ja: "新しい味への挑戦だったね。私の好みも覚えてくれる？",
    en: "That was a new flavor to try. Will you remember my tastes too?",
    hi: "あたらしいあじへのちょうせんだったね。わたしのこのみもおぼえてくれる？",
  },
  {
    ja: "香りはきれいだね。味は、私には少し難しかった。",
    en: "The aroma is lovely, though the flavor is a little difficult for me.",
    hi: "かおりはきれいだね。あじは、わたしにはすこしむずかしかった。",
  },
];
export const MEAL_REACTIONS: Copy[] = [
  {
    ja: "一緒に食べると、いつもの料理も特別になるね。",
    en: "Sharing a meal makes ordinary cooking special.",
    hi: "いっしょにたべると、いつものりょうりもとくべつになるね。",
  },
  {
    ja: "食感が面白い！ 何を使ったの？",
    en: "What an interesting texture! What did you use?",
    hi: "しょっかんがおもしろい！なにをつかったの？",
  },
  {
    ja: "丁寧に作ってあるね。材料の味がわかるよ。",
    en: "It is carefully made. I can taste the ingredients.",
    hi: "ていねいにつくってあるね。ざいりょうのあじがわかるよ。",
  },
  {
    ja: "話しながら食べたら、もうお皿が空っぽ！",
    en: "We chatted while eating, and now my plate is empty!",
    hi: "はなしながらたべたら、もうおさらがからっぽ！",
  },
  {
    ja: "盛り付けもいいね。食卓が明るくなったよ。",
    en: "Lovely presentation. It brightens the table.",
    hi: "もりつけもいいね。しょくたくがあかるくなったよ。",
  },
  {
    ja: "この料理を持って、雲の上でピクニックしたいな。",
    en: "I would take this on a picnic above the clouds.",
    hi: "このりょうりをもって、くものうえでぴくにっくしたいな。",
  },
  {
    ja: "腹ごしらえ完了！ また一緒に冒険できるね。",
    en: "All fueled up! We can adventure together again.",
    hi: "はらごしらえかんりょう！またいっしょにぼうけんできるね。",
  },
  {
    ja: "湯気まで絵になるね。ごちそうさま。",
    en: "Even the steam is picturesque. Thank you for the meal.",
    hi: "ゆげまでえになるね。ごちそうさま。",
  },
];

export const OUTING_ACTIONS: Copy[][][] = [
  [
    [
      {
        ja: "木陰に広げる",
        en: "Spread lunch in the shade",
        hi: "こかげにひろげる",
      },
      {
        ja: "花の見える丘へ行く",
        en: "Go to the blossom hill",
        hi: "はなのみえるおかへいく",
      },
      {
        ja: "風を避けた場所にする",
        en: "Find shelter from the wind",
        hi: "かぜをさけたばしょにする",
      },
    ],
    [
      { ja: "花を描く", en: "Sketch flowers", hi: "はなをえがく" },
      { ja: "お互いを描く", en: "Sketch each other", hi: "おたがいをえがく" },
      {
        ja: "空想の動物を描く",
        en: "Draw an imaginary animal",
        hi: "くうそうのどうぶつをえがく",
      },
    ],
    [
      { ja: "押し花にする", en: "Press the flower", hi: "おしばなにする" },
      {
        ja: "花壇へ植える",
        en: "Plant it in the garden",
        hi: "かだんへうえる",
      },
      {
        ja: "思い出を絵に残す",
        en: "Draw the memory",
        hi: "おもいでをえにのこす",
      },
    ],
  ],
  [
    [
      {
        ja: "流れの緩い場所を選ぶ",
        en: "Choose a gentle current",
        hi: "ながれのゆるいばしょをえらぶ",
      },
      {
        ja: "橋の影を探す",
        en: "Find shade under the bridge",
        hi: "はしのかげをさがす",
      },
      {
        ja: "魚の動きを観察する",
        en: "Observe fish movements",
        hi: "さかなのうごきをかんさつする",
      },
    ],
    [
      {
        ja: "水面を静かに見る",
        en: "Watch the surface quietly",
        hi: "すいめんをしずかにみる",
      },
      {
        ja: "ふたりで糸を投げる",
        en: "Cast together",
        hi: "ふたりでいとをなげる",
      },
      {
        ja: "光の正体を想像する",
        en: "Imagine the source of the light",
        hi: "ひかりのしょうたいをそうぞうする",
      },
    ],
    [
      {
        ja: "今日の釣果を振り返る",
        en: "Recall today’s catch",
        hi: "きょうのちょうかをふりかえる",
      },
      {
        ja: "次に釣りたい魚を話す",
        en: "Discuss the next target fish",
        hi: "つぎにつりたいさかなをはなす",
      },
      {
        ja: "夕焼けの色を数える",
        en: "Count sunset colors",
        hi: "ゆうやけのいろをかぞえる",
      },
    ],
  ],
  [
    [
      {
        ja: "最初の星を探す",
        en: "Find the first star",
        hi: "さいしょのほしをさがす",
      },
      {
        ja: "石段でひと休みする",
        en: "Rest on the stone steps",
        hi: "いしだんでひとやすみする",
      },
      {
        ja: "夜空の形を描く",
        en: "Sketch the night sky",
        hi: "よぞらのかたちをえがく",
      },
    ],
    [
      {
        ja: "模様を写し取る",
        en: "Copy the pattern",
        hi: "もようをうつしとる",
      },
      {
        ja: "星図と比べる",
        en: "Compare a star chart",
        hi: "せいずとくらべる",
      },
      {
        ja: "新しい星座を考える",
        en: "Invent a constellation",
        hi: "あたらしいせいざをかんがえる",
      },
    ],
    [
      {
        ja: "冒険の無事を願う",
        en: "Wish for a safe journey",
        hi: "ぼうけんのぶじをねがう",
      },
      {
        ja: "ふたりの未来を願う",
        en: "Wish for your shared future",
        hi: "ふたりのみらいをねがう",
      },
      {
        ja: "願いを秘密にする",
        en: "Keep the wish secret",
        hi: "ねがいをひみつにする",
      },
    ],
  ],
  [
    [
      {
        ja: "木漏れ日の道を選ぶ",
        en: "Take the sunlit path",
        hi: "こもれびのみちをえらぶ",
      },
      {
        ja: "川の音へ向かう",
        en: "Follow the river sound",
        hi: "かわのおとへむかう",
      },
      {
        ja: "足跡を観察する",
        en: "Study footprints",
        hi: "あしあとをかんさつする",
      },
    ],
    [
      {
        ja: "形をスケッチする",
        en: "Sketch the shape",
        hi: "かたちをすけっちする",
      },
      {
        ja: "触らずに調べる",
        en: "Study without touching",
        hi: "さわらずにしらべる",
      },
      {
        ja: "キノコの物語を作る",
        en: "Invent a mushroom story",
        hi: "きのこのものがたりをつくる",
      },
    ],
    [
      { ja: "名前を添える", en: "Add your names", hi: "なまえをそえる" },
      {
        ja: "今日の日付を書く",
        en: "Write today’s date",
        hi: "きょうのひづけをかく",
      },
      {
        ja: "ふたりの印を描く",
        en: "Draw your shared mark",
        hi: "ふたりのしるしをえがく",
      },
    ],
  ],
  [
    [
      {
        ja: "風のない場所を選ぶ",
        en: "Choose a sheltered spot",
        hi: "かぜのないばしょをえらぶ",
      },
      { ja: "日なたを探す", en: "Find the sunlight", hi: "ひなたをさがす" },
      {
        ja: "暖かいお茶を注ぐ",
        en: "Pour warm tea",
        hi: "あたたかいおちゃをそそぐ",
      },
    ],
    [
      { ja: "小石を探す", en: "Find a pebble", hi: "こいしをさがす" },
      { ja: "小枝を使う", en: "Use a twig", hi: "こえだをつかう" },
      {
        ja: "葉っぱの鼻にする",
        en: "Make a leaf nose",
        hi: "はっぱのはなにする",
      },
    ],
    [
      { ja: "雪の音を聞く", en: "Listen to the snow", hi: "ゆきのおとをきく" },
      {
        ja: "カップを持って温まる",
        en: "Warm your hands on the cup",
        hi: "かっぷをもってあたたまる",
      },
      {
        ja: "次の冬の約束をする",
        en: "Promise another winter visit",
        hi: "つぎのふゆのやくそくをする",
      },
    ],
  ],
  [
    [
      {
        ja: "道しるべを探す",
        en: "Look for the trail marker",
        hi: "みちしるべをさがす",
      },
      {
        ja: "地図と景色を比べる",
        en: "Compare map and scenery",
        hi: "ちずとけしきをくらべる",
      },
      {
        ja: "ふたりで安全な道を選ぶ",
        en: "Choose a safe path together",
        hi: "ふたりであんぜんなみちをえらぶ",
      },
    ],
    [
      {
        ja: "砂を丁寧に払う",
        en: "Brush away the sand",
        hi: "すなをていねいにはらう",
      },
      {
        ja: "箱の模様を調べる",
        en: "Study the box pattern",
        hi: "はこのもようをしらべる",
      },
      {
        ja: "宝物の由来を想像する",
        en: "Imagine its origin",
        hi: "たからもののゆらいをそうぞうする",
      },
    ],
    [
      { ja: "ひとつずつ分ける", en: "Share one each", hi: "ひとつずつわける" },
      {
        ja: "家に一緒に飾る",
        en: "Display it at home together",
        hi: "いえにいっしょにかざる",
      },
      {
        ja: "今日の発見を記録する",
        en: "Record today’s discoveries",
        hi: "きょうのはっけんをきろくする",
      },
    ],
  ],
];
