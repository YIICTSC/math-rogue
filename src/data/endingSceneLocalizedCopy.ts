export type EndingPageLocalizedCopy = readonly [readonly [string, string, string], readonly [string, string, string]];

type ThemeEndingPageLocalizedCopy = Record<string, Record<string, EndingPageLocalizedCopy>>;

export const ENDING_PAGE_LOCALIZED_COPY: Record<'elementary' | 'high-school', ThemeEndingPageLocalizedCopy> = 
{
  "elementary": {
    "WARRIOR": {
      "serious": [
        [
          "__NAME__はあかいぼうしをかぶり、こわれたこうしゃのろうかでこぶしをにぎった。",
          "くずれたきょうしつをみわたし、なかまがあんしんしてもどれるばしょをどうつくるかかんがえる。",
          "あさひのこうもんをまえに、__NAME__はふりかえった。「つぎは、みんながわらってかえれるがっこうにする」。ちいさなこぶしが、あしたへのやくそくになった。"
        ],
        [
          "__NAME__ wore a red cap and clenched a fist in the ruined school hallway.",
          "Looking across the collapsed classroom, __NAME__ thought about how to make a safe place for friends to return to.",
          "At the school gate in the morning sun, __NAME__ looked back. “Next, I’ll make this a school where everyone can go home smiling.” The small fist became a promise for tomorrow."
        ]
      ],
      "funny": [
        [
          "__NAME__がこぶしをつきあげると、あかいぼうしがいきおいよくそらへとんでいった。",
          "にげたぼうしをおって、__NAME__はなかまとこうていをぜんりょくではしりまわる。",
          "なかまとならんでわらいながら、__NAME__はぼうしをかぶりなおした。「しょうりのぼうし、ちゃんとかえってきたぞ！」。おおさわぎのいちにちが、たのしいおもいでになった。"
        ],
        [
          "When __NAME__ raised a fist, the red cap flew high into the air.",
          "Chasing the runaway cap, __NAME__ and the friends raced around the schoolyard at full speed.",
          "Laughing beside the friends, __NAME__ put the cap back on. “The victory cap came back!” The noisy day became a happy memory."
        ]
      ],
      "cool": [
        [
          "__NAME__はランドセルをせおい、はがまうあおぞらのしたでまっすぐまえをみた。",
          "ひかりのきらめくこうしゃをせに、__NAME__はだれよりさきにはしりだす。",
          "こうもんのまえで__NAME__はいちどだけふりかえった。「きょうそうなら、もちろんぼくがさき！」。ひらいたもんのむこうへ、かるいあしどりがつづいた。"
        ],
        [
          "__NAME__ carried a school bag and looked straight ahead beneath a blue sky filled with falling leaves.",
          "With the sparkling school behind, __NAME__ ran out ahead of everyone else.",
          "At the gate, __NAME__ looked back just once. “If it’s a race, of course I’ll be first!” Light footsteps continued beyond the open gate."
        ]
      ],
      "cute": [
        [
          "ほしのかざりにかこまれ、__NAME__はなかまといっしょにこぶしをあげた。",
          "みんなにみられててれながら、あかいぼうしのつばをそっとなおす。",
          "なかまぜんいんのきねんしゃしんで、__NAME__はいちばんまえにたった。「はい、ぼくがまんなかね！」。えがおのわが、ほうもつのいちまいになった。"
        ],
        [
          "Surrounded by star decorations, __NAME__ raised a fist together with the friends.",
          "Feeling shy under everyone’s gaze, __NAME__ gently adjusted the brim of the red cap.",
          "In the group photo, __NAME__ stood at the very front. “I’m in the middle, right?” The circle of smiles became a treasured picture."
        ]
      ],
      "heartfelt": [
        [
          "しずかなきょうしつで、__NAME__はあかいぼうしをてにしてつくえへむかった。",
          "まどのむこうになかまたちのきおくをかさね、まもったにちじょうをむねにいだく。",
          "__NAME__はきょうしつのとびらをひらき、あさのひかりへふみだした。「ただいまっていえるばしょ、これからもまもるよ」。ちいさなせなかがあしたへむかった。"
        ],
        [
          "In a quiet classroom, __NAME__ held the red cap and walked toward the desk.",
          "Through the window, __NAME__ layered memories of the friends over the view and held the everyday life they had protected close to the heart.",
          "__NAME__ opened the classroom door and stepped into the morning light. “I’ll keep protecting the place where we can say, ‘I’m home.’” The small back moved toward tomorrow."
        ]
      ]
    },
    "CARETAKER": {
      "serious": [
        [
          "__NAME__はこわれたしいくこやでウサギをいだき、のこったちいさないのちをたしかめた。",
          "どうぶつたちをいちひきずつみまもり、あれたこやをもういちどあんしんできるばしょにするほうほうをかんがえる。",
          "ゆうひのしいくこやで__NAME__はどうぶつたちへいった。「ここを、みんながねむれるばしょにもどそう」。まもるてが、あしたのせわをはじめた。"
        ],
        [
          "In the ruined animal hut, __NAME__ held a rabbit and checked on the small lives that remained.",
          "Watching the animals one by one, __NAME__ thought about how to make the damaged hut a safe place again.",
          "At the animal hut in the evening sun, __NAME__ told the animals, “Let’s make this a place where everyone can sleep peacefully again.” The protecting hands began tomorrow’s care."
        ]
      ],
      "funny": [
        [
          "__NAME__がしいくこやのとびらをあけると、ウサギやいぬたちがいっせいにはしりだした。",
          "どうぶつたちにおいかけられ、__NAME__はなかまといっしょにこうていをかけまわる。",
          "みんなでどうぶつたちをいだきとめ、__NAME__はいきをきらしてわらった。「まって、じゅんばんにただいましよう！」。こやはわらいごえでいっぱいになった。"
        ],
        [
          "When __NAME__ opened the animal-hut door, rabbits and dogs all ran out at once.",
          "Chased by the animals, __NAME__ and the friends dashed around the schoolyard together.",
          "After everyone caught the animals, __NAME__ laughed out of breath. “Wait, let’s say welcome home one at a time!” The hut filled with laughter."
        ]
      ],
      "cool": [
        [
          "__NAME__はランタンをかかげ、くらいもりのなかでどうぶつたちのすすむみちをてらした。",
          "いわばのむこうへてをのばし、まいごのウサギをなかまのところへみちびく。",
          "ウサギといっしょにこうもんをぬけながら、__NAME__はふりかえった。「みんな、ちゃんとついてきてね」。まもるあしどりが、つぎのばしょへつづいた。"
        ],
        [
          "__NAME__ held up a lantern and lit the animals’ path through the dark forest.",
          "Reaching beyond the rocks, __NAME__ guided the lost rabbit back to the friends.",
          "Passing through the school gate with the rabbit, __NAME__ looked back. “Everyone, stay close behind me.” The protecting footsteps continued toward the next place."
        ]
      ],
      "cute": [
        [
          "なかまとどうぶつたちにかこまれ、__NAME__はにくだまのかざりをりょうてにもった。",
          "いぬにほおをなめられ、__NAME__はくすぐったそうにめをほそめる。",
          "どうぶつたちとなかまがならぶと、__NAME__はカメラへてをふった。「はい、みんなでかわいくとろう！」。こやのきねんしゃしんがのこった。"
        ],
        [
          "Surrounded by friends and animals, __NAME__ held paw-print decorations in both hands.",
          "A dog licked the cheek, and __NAME__ narrowed the eyes with a ticklish smile.",
          "When the animals and friends lined up, __NAME__ waved at the camera. “All right, everyone look cute!” The hut’s group photo was saved as a keepsake."
        ]
      ],
      "heartfelt": [
        [
          "くらいしいくこやで、__NAME__はそらのねどこをまえにしずかにしゃがんだ。",
          "ゆうひのなかにどうぶつたちのすがたをおもいうかべ、もどってきたいのちをたいせつにかかえる。",
          "__NAME__はこやのとびらをひらき、ウサギとそとへでた。「おかえり。もう、ひとりにしないよ」。ひらいたとびらにあたらしいあさがさしこんだ。"
        ],
        [
          "In the dark animal hut, __NAME__ quietly crouched before an empty bed.",
          "In the evening light, __NAME__ imagined the animals’ figures and held the returning lives close.",
          "__NAME__ opened the hut door and went outside with the rabbit. “Welcome home. I won’t leave you alone anymore.” A new morning shone through the open door."
        ]
      ]
    },
    "ASSASSIN": {
      "serious": [
        [
          "__NAME__はこわれたろうかでくろいスカーフをまき、ひとりでたちどまった。",
          "みどりのわんしょうをたしかめながら、かくれていたじぶんもなかまのまえへでるときめる。",
          "あさのろうかで__NAME__はかおをあげた。「ここにいていいなら、ぼくもいっしょにあるく」。ながいろうかのさきが、いばしょになった。"
        ],
        [
          "In the ruined hallway, __NAME__ wrapped a dark scarf around the neck and stood alone.",
          "Checking the green armband, __NAME__ decided to step out from hiding and stand before the friends.",
          "In the morning hallway, __NAME__ raised the face. “If I’m allowed to be here, I’ll walk with everyone.” The long hallway became a place to belong."
        ]
      ],
      "funny": [
        [
          "かっこうよくはしりだした__NAME__は、ゆかのみずにあしをとられてころんだ。",
          "バケツやモップのそばでたちあがろうとするたび、またすべってしまう。",
          "なかまにかこまれた__NAME__は、びしょぬれのままつぶやいた。「いまのは、みなかったことに……できないよね」。はじめてのしっぱいがわらいばなしになった。"
        ],
        [
          "After dashing off stylishly, __NAME__ slipped on water on the floor and fell.",
          "Every time __NAME__ tried to stand beside the bucket and mop, another slip followed.",
          "Surrounded by friends and soaking wet, __NAME__ muttered, “We can’t pretend you didn’t see that, can we?” The first failure became a funny story."
        ]
      ],
      "cool": [
        [
          "__NAME__はくろいスカーフをひるがえし、しへんがまうろうかをかろやかにかけぬけた。",
          "なかまのてをとり、ひかりのさすつうろをいっしょにはしる。",
          "よるのこうもんへむかって__NAME__はふりかえった。「こんどは、ひとりできえたりしない」。なかまとすすむかげが、もんのむこうへのびた。"
        ],
        [
          "__NAME__ swept the dark scarf behind and ran lightly through the hallway where scraps of paper danced.",
          "Taking a friend’s hand, __NAME__ ran together through the passage where the light came in.",
          "On the way to the school gate at night, __NAME__ looked back. “I won’t disappear alone again.” The shadow moving with friends stretched beyond the gate."
        ]
      ],
      "cute": [
        [
          "ほしのかざりとなかまにかこまれ、__NAME__はくろいスカーフをすこしだけゆるめた。",
          "てれながらスカーフをひきあげ、かくしたかおのおくでわらう。",
          "なかまとならんでしゃしんをとり、__NAME__はちいさくてをあわせた。「きょうだけは、ちゃんとわらってもいいかな」。しずかなえがおがわのなかにのこった。"
        ],
        [
          "Surrounded by star decorations and friends, __NAME__ loosened the dark scarf just a little.",
          "Blushing, __NAME__ pulled the scarf up again and smiled behind the hidden face.",
          "Taking a photo with the friends, __NAME__ brought the hands together. “Can I really smile today?” The quiet smile remained inside the circle."
        ]
      ],
      "heartfelt": [
        [
          "よるのつくえで、__NAME__はなかまへわたすことばをいちにんでかきつづけた。",
          "ページのむこうになかまたちのおもいでをみつめ、くろいスカーフにそっとふれる。",
          "あさのきょうしつのそとで__NAME__はたちどまった。「ここを、かえってきてもいいばしょにする」。えらんだいばしょへ、しずかにあるきだした。"
        ],
        [
          "At a desk at night, __NAME__ kept writing words to give to the friends.",
          "Looking at the memories of the friends beyond the page, __NAME__ gently touched the dark scarf.",
          "Outside the classroom in the morning, __NAME__ stopped. “I’ll make this a place we can come back to.” The chosen home awaited quiet footsteps."
        ]
      ]
    },
    "DODGEBALL": {
      "serious": [
        [
          "__NAME__はきずののこるたいいくかんでオレンジしょくのボールをにぎり、まっすぐまえをみた。",
          "ゆかにすわってボールをかかえ、なかまとさいごまでたたかったじかんをむねにきざむ。",
          "たいいくかんのでぐちで__NAME__はボールをかかえた。「つぎは、みんなでさいごまでたっていよう」。いちきゅうが、つぎのやくそくになった。"
        ],
        [
          "In the scarred gym, __NAME__ gripped an orange ball and looked straight ahead.",
          "Sitting on the floor and holding the ball, __NAME__ engraved the time spent fighting to the end with the friends.",
          "At the gym exit, __NAME__ held the ball. “Next time, let’s all stay standing until the end.” One ball became a promise for the next game."
        ]
      ],
      "funny": [
        [
          "__NAME__がなげたボールは、ねらいをはずれてかべへいきおいよくはねかえった。",
          "はねかえったボールをおいかけ、__NAME__はゆかにすべりこんでしまう。",
          "なかまにかこまれて__NAME__はボールをかかえた。「いまのはさくせん！……たぶん！」。たいいくかんにおおわらいがひびいた。"
        ],
        [
          "The ball __NAME__ threw missed the target and bounced hard against the wall.",
          "Chasing the rebounding ball, __NAME__ slid across the floor.",
          "Surrounded by friends, __NAME__ hugged the ball. “That was strategy! …Probably!” Loud laughter echoed through the gym."
        ]
      ],
      "cool": [
        [
          "__NAME__はひかりのなかでボールをなげ、くうちゅうへおおきくとびあがった。",
          "きらめくボールをおってからだをひねり、さいごのいちきゅうをきめる。",
          "たいいくかんのとびらへむかい、__NAME__はボールをかかえてわらった。「つぎのいちきゅうも、ぼくがとる！」。しょうぶのつづきが、そとのひかりへつながった。"
        ],
        [
          "__NAME__ threw the ball in the light and leaped high into the air.",
          "Twisting after the glittering ball, __NAME__ made the final throw.",
          "Walking toward the gym door, __NAME__ hugged the ball and smiled. “I’ll catch the next one too!” The match continued into the light outside."
        ]
      ],
      "cute": [
        [
          "オレンジしょくのかざりとボールにかこまれ、__NAME__はなかまのちゅうおうでむねをはった。",
          "みんなにほめられててれくさそうにあたまをかき、ボールをかかえなおす。",
          "なかまとかたをくんでしゃしんをとり、__NAME__はわらった。「このチーム、ずっといちばんだよ！」。たいいくかんのえがおがきねんになった。"
        ],
        [
          "Surrounded by orange decorations and balls, __NAME__ proudly stood in the center of the friends.",
          "Praised by everyone, __NAME__ scratched the head shyly and hugged the ball again.",
          "Taking a photo with arms around the friends, __NAME__ smiled. “This team will always be number one!” The gym’s smiles became a keepsake."
        ]
      ],
      "heartfelt": [
        [
          "しずかなたいいくかんで、__NAME__はひとりオレンジしょくのボールをかかえた。",
          "ボールのむこうになかまたちのすがたをおもいだし、つないだいちきゅうのおもさをかんじる。",
          "あさのたいいくかんで__NAME__はボールをみつめた。「また、このばしょでみんなとなげたい」。しずかなコートにつぎのしあいがのこった。"
        ],
        [
          "In the quiet gym, __NAME__ held an orange ball alone.",
          "Beyond the ball, __NAME__ remembered the friends and felt the weight of the one pass they had connected.",
          "In the morning gym, __NAME__ looked at the ball. “I want to throw it here with everyone again.” The quiet court held the next game."
        ]
      ]
    },
    "BARD": {
      "serious": [
        [
          "__NAME__はこわれたぶたいのうえでくろいマイクをにぎり、なかまのことばをとどけた。",
          "ゆうひのさすマイクへこえをかさね、がっこうちゅうへきこえるようにひとことずつはなす。",
          "あさのこうどうで__NAME__はかんきゃくせきをみわたした。「あしたも、みんなのこえをここからとどけるね」。しずかなぶたいがほうそうしつになった。"
        ],
        [
          "On the broken stage, __NAME__ held a black microphone and delivered the friends’ words.",
          "Adding a voice to the microphone in the evening light, __NAME__ spoke one sentence at a time so the whole school could hear.",
          "In the morning auditorium, __NAME__ looked across the seats. “Tomorrow, I’ll keep delivering everyone’s voices from here.” The quiet stage became a broadcast room."
        ]
      ],
      "funny": [
        [
          "__NAME__はマイクのケーブルにあしをとられ、ぶたいのうえでころがった。",
          "からまったケーブルをほどこうとして、さらにおおきくころびそうになる。",
          "なかまのわらいごえをうけて__NAME__はマイクをにぎりなおした。「ほんじつのほうそう、てんとうもなまほうそうです！」。ぶたいがわらいでゆれた。"
        ],
        [
          "__NAME__ caught a foot on the microphone cable and rolled across the stage.",
          "Trying to untangle the cable, __NAME__ nearly fell even more dramatically.",
          "Hearing the friends laugh, __NAME__ gripped the microphone again. “Today’s broadcast includes a live tumble!” The stage shook with laughter."
        ]
      ],
      "cool": [
        [
          "__NAME__はおんぷとひかりのなみにつつまれ、マイクをたかくかかげてうたった。",
          "まばゆいぶたいのちゅうおうで、なかまへとどくこえをさいごまでひびかせる。",
          "カーテンのむこうへあるきだし、__NAME__はふりかえった。「つぎのほうそうまで、こえをみがいておくね」。ぶたいのそとへあたらしいおとがつづいた。"
        ],
        [
          "Surrounded by notes and waves of light, __NAME__ raised the microphone high and sang.",
          "At the center of the dazzling stage, __NAME__ let a voice reach the friends until the very end.",
          "Walking beyond the curtain, __NAME__ looked back. “I’ll polish my voice before the next broadcast.” A new sound continued beyond the stage."
        ]
      ],
      "cute": [
        [
          "なかまがかかげるハートとおんぷのかざりにかこまれ、__NAME__はマイクをもった。",
          "てれながらマイクへちかづき、なかまのおうえんにこえをはずませる。",
          "ぜんいんでぶたいにならび、__NAME__はあいずをおくった。「せーの、みんなだいすき！」。うたごえとえがおがきねんほうそうになった。"
        ],
        [
          "Surrounded by heart and music-note decorations held by the friends, __NAME__ held the microphone.",
          "Approaching the microphone shyly, __NAME__ let the voice bounce with the friends’ support.",
          "Everyone lined up on stage, and __NAME__ gave the signal. “Ready, set, we love you all!” The song and smiles became a commemorative broadcast."
        ]
      ],
      "heartfelt": [
        [
          "くらいぶたいで、__NAME__はひとりマイクをにぎり、きゃくせきをみつめた。",
          "なかまたちのおもいでをぶたいのひかりのなかにかさね、もどってきたこえをたしかめる。",
          "カーテンのすきまからかんきゃくせきをみて、__NAME__はほほえんだ。「また、みんなにうたをとどけられるね」。ぶたいのあしたがはじまった。"
        ],
        [
          "On the dark stage, __NAME__ held the microphone alone and looked at the audience seats.",
          "Layering memories of the friends into the stage light, __NAME__ made sure the returned voice was still there.",
          "Peeking through the curtain at the seats, __NAME__ smiled. “I can sing for everyone again.” A new tomorrow began on the stage."
        ]
      ]
    },
    "LIBRARIAN": {
      "serious": [
        [
          "__NAME__はこわれたとしょしつであおいほんをかかえ、ちらばったほんだなをみわたした。",
          "ほんをいちさつずつひろい、つぎによむひとへものがたりをわたせるようにととのえる。",
          "ひかりのもどったとしょしつで__NAME__はほんをたなへもどした。「このものがたりを、つぎのひとにもよんでもらおう」。ページがあしたへつづいた。"
        ],
        [
          "In the ruined library, __NAME__ held a blue book and looked across the scattered shelves.",
          "Picking up the books one by one, __NAME__ arranged them so the next reader could receive each story.",
          "In the library where the light had returned, __NAME__ put a book back on the shelf. “Let the next person read this story too.” The pages continued into tomorrow."
        ]
      ],
      "funny": [
        [
          "__NAME__がほんのやまへてをのばすと、つみあがったほんがいっきにくずれた。",
          "ほんとかみのまをはいながら、たいせつないちさつをどうにかつかまえる。",
          "なかまとほんのやまからかおをだし、__NAME__はめがねをなおした。「ほんはとばないっておもってたのに！」。としょしつがわらいごえでみたされた。"
        ],
        [
          "When __NAME__ reached toward a pile of books, the stack collapsed all at once.",
          "Crawling through books and paper, __NAME__ somehow managed to grab one important volume.",
          "Poking a face out of the pile with the friends, __NAME__ adjusted the glasses. “I thought books couldn’t fly!” The library filled with laughter."
        ]
      ],
      "cool": [
        [
          "__NAME__はあおいひかりをはなつほんをひらき、うかぶページをしずかによみといた。",
          "ほんのまわりをまわるひかりをととのえ、ばらばらだったものがたりをひとつにつなげる。",
          "しょくぶつのあるとしょしつで__NAME__はほんをとじた。「つぎのページは、わたしがえらびます」。あたらしいものがたりがしずかにはじまった。"
        ],
        [
          "__NAME__ opened a book shining with blue light and quietly deciphered the floating pages.",
          "Straightening the light circling the book, __NAME__ joined the scattered stories into one.",
          "In the plant-filled library, __NAME__ closed the book. “I’ll choose the next page.” A new story began quietly."
        ]
      ],
      "cute": [
        [
          "なかまからてづくりのほんやしおりをうけとり、__NAME__はうれしそうにめがねをかがやかせた。",
          "めをほそめてめがねをなおし、みんなのおくりものをほんのそばへたいせつにおく。",
          "なかまとわになってほんをよみ、__NAME__はページをひらいた。「このおはなし、みんなでよもうね」。としょしつがちいさなどくしょかいになった。"
        ],
        [
          "Receiving handmade books and bookmarks from the friends, __NAME__’s glasses shone with happiness.",
          "With narrowed eyes, __NAME__ adjusted the glasses and carefully placed everyone’s gifts beside the book.",
          "Reading in a circle with the friends, __NAME__ opened a page. “Let’s read this story together.” The library became a little reading club."
        ]
      ],
      "heartfelt": [
        [
          "ランプのもとで、__NAME__はしずかなとしょしつのほんをいちにんでめくった。",
          "ひらいたほんのむこうになかまたちのきおくをみつめ、もどってきたにちじょうをかんじる。",
          "まどべでさいごのページをひらき、__NAME__はほほえんだ。「つぎのものがたりも、みんなといっしょによもう」。ひかりがほんのうえにひろがった。"
        ],
        [
          "Under a lamp, __NAME__ quietly turned the pages of the library book alone.",
          "Beyond the open book, __NAME__ watched memories of the friends and felt everyday life return.",
          "By the window, __NAME__ opened the last page and smiled. “Let’s read the next story together too.” Light spread across the book."
        ]
      ]
    },
    "CHEF": {
      "serious": [
        [
          "__NAME__はこわれたちゅうぼうでしゃくしをにぎり、なかまのためになべをみつめた。",
          "なべのなかみをたしかめ、もどってくるみんなへあたたかなきゅうしょくをよういする。",
          "あさひのちゅうぼうで__NAME__はしゃくしをかかげた。「たべたら、またげんきになれるよ」。いちさらががっこうのあしたをささえた。"
        ],
        [
          "In the ruined kitchen, __NAME__ gripped a ladle and watched the pot for the friends.",
          "Checking the pot, __NAME__ prepared a warm school meal for everyone coming back.",
          "In the kitchen at sunrise, __NAME__ raised the ladle. “Eat this and you’ll feel strong again.” One dish supported the school’s tomorrow."
        ]
      ],
      "funny": [
        [
          "__NAME__がまぜたりょうりはなべからあふれ、あわとしょくざいがおおきくはねあがった。",
          "こなまみれのゆかでたちあがろうとし、__NAME__はまたすべってしまう。",
          "なかまとわらいながら__NAME__はなべをかかえた。「あじはだいせいこう、みためは……これから！」。ちゅうぼうがたのしいしょくたくへかわった。"
        ],
        [
          "The dish __NAME__ stirred overflowed from the pot, sending foam and ingredients flying.",
          "Trying to stand on the flour-covered floor, __NAME__ slipped again.",
          "Laughing with the friends, __NAME__ hugged the pot. “The taste is a success; the appearance is …still in progress!” The kitchen became a joyful table."
        ]
      ],
      "cool": [
        [
          "__NAME__はほのおのうずのなかでしゃくしをふり、りょうりをあざやかにしあげた。",
          "かんせいしたいちさらへさいごのあじつけをくわえ、なかまへさしだす。",
          "りょうりのはいったかごをもってちゅうぼうのそとへでた__NAME__はいった。「つぎのきゅうしょくも、ぼくにまかせて！」。かおりがあたらしいいちにちへつづいた。"
        ],
        [
          "In a swirl of flame, __NAME__ swung the ladle and finished the dish brilliantly.",
          "Adding the final seasoning to the completed plate, __NAME__ offered it to the friends.",
          "Carrying a basket of food outside the kitchen, __NAME__ said, “I’ll handle the next school lunch too!” The aroma continued into a new day."
        ]
      ],
      "cute": [
        [
          "ハートやほしのりょうりをなかまとかこみ、__NAME__はしろいコックぼうでむねをはった。",
          "りょうりをほめられててれながらほおにてをあて、うれしそうにわらう。",
          "みんなでしょくたくをかこみ、__NAME__はしゃくしをもちあげた。「おかわり、まだあるよ！」。おいわいのこえがきょうしついっぱいにひろがった。"
        ],
        [
          "Surrounded by heart- and star-shaped food, __NAME__ stood proudly in a white chef’s hat.",
          "Praised for the cooking, __NAME__ touched the cheek shyly and smiled with delight.",
          "Around the table, __NAME__ lifted the ladle. “There’s still more if you want seconds!” Celebration voices filled the classroom."
        ]
      ],
      "heartfelt": [
        [
          "しずかなちゅうぼうで、__NAME__はしゃくしをてに、もどってくるなかまをまった。",
          "ゆうひのきおくのなかにみんなのえがおをおもいうかべ、あたたかないちさらをじゅんびする。",
          "まどをあけて__NAME__はしゃくしをふった。「またいっしょにたべようね」。ちゅうぼうにあかるいかぜがはいってきた。"
        ],
        [
          "In the quiet kitchen, __NAME__ held the ladle and waited for the friends to return.",
          "In the memory of the evening sun, __NAME__ pictured everyone’s smiles and prepared a warm dish.",
          "Opening the window, __NAME__ waved the ladle. “Let’s eat together again.” A bright breeze entered the kitchen."
        ]
      ]
    },
    "GARDENER": {
      "serious": [
        [
          "__NAME__はあれたこうていにしゃがみ、ちいさななえをりょうてでまもった。",
          "どをととのえ、のこったしょくぶつがそだてるように、なえのそばをていねいにていれする。",
          "ゆうひのにわで__NAME__はなえへいった。「ゆっくりでいいよ。あしたまでいっしょにそだとう」。ちいさなめがみらいをささえた。"
        ],
        [
          "Crouching in the wild schoolyard, __NAME__ protected a small seedling with both hands.",
          "Preparing the soil, __NAME__ carefully tended the area around the seedling so the remaining plants could grow.",
          "In the garden at sunset, __NAME__ told the seedling, “Take your time. Let’s grow together until tomorrow.” A small sprout supported the future."
        ]
      ],
      "funny": [
        [
          "__NAME__はホースをひらいたしゅんかん、いきおいよくとびだしたみずをぜんしんにあびた。",
          "なかまとみずたまりをはしりまわり、みんなのふくもながぐつもびしょぬれになる。",
          "はっぱだらけのなかまをみて__NAME__はわらった。「みずやりはだいせいこう！　でも、ぼくたちもみずやりされたね！」。にわにわらいごえがさいた。"
        ],
        [
          "The moment __NAME__ opened the hose, a powerful spray soaked the whole body.",
          "The friends ran through puddles together, leaving everyone’s clothes and boots drenched.",
          "Looking at the leaf-covered friends, __NAME__ laughed. “Watering succeeded! But we got watered too!” Laughter bloomed in the garden."
        ]
      ],
      "cool": [
        [
          "__NAME__がてをのばすと、はなとつるがあれたにわいっぱいにひろがった。",
          "はなはたのちゅうおうでりょうてをひろげ、もどったけしきをなかまへみせる。",
          "じょうろをもってにわのもんへすすみ、__NAME__はふりかえった。「つぎにそだてるばしょへいこう」。みどりのみちがさきへつづいた。"
        ],
        [
          "When __NAME__ reached out, flowers and vines spread across the wild garden.",
          "In the middle of the flower field, __NAME__ opened both arms and showed the returned view to the friends.",
          "Carrying a watering can toward the garden gate, __NAME__ looked back. “Let’s go to the next place to grow.” The green path continued ahead."
        ]
      ],
      "cute": [
        [
          "なかまからちいさなはちうえをてわたされ、__NAME__はむぎわらぼうしのしたでわらった。",
          "はなびらにかこまれててれながらぼうしのつばをなおし、なえをたいせつにかかえる。",
          "なかまといっしょになえをうえ、__NAME__はどへてをそえた。「このこも、みんなでそだてようね」。にわにあたらしいやくそくがうまれた。"
        ],
        [
          "Given a little potted plant by the friends, __NAME__ smiled beneath the straw hat.",
          "Surrounded by petals, __NAME__ shyly adjusted the brim and carefully hugged the seedling.",
          "Planting the seedling with the friends, __NAME__ placed a hand on the soil. “Let’s grow this one together too.” A new promise was born in the garden."
        ]
      ],
      "heartfelt": [
        [
          "あれたどのなかで、__NAME__はちいさななえとじょうろをしずかにみつめた。",
          "なえをかかえながら、なかまとまもってきたきせつのきおくをおもいかえす。",
          "おおきなひまわりのそばで__NAME__はそらをみあげた。「このはなを、つぎのこにもみせたい」。そだったけしきが、みらいへてわたされた。"
        ],
        [
          "In the wild soil, __NAME__ quietly looked at the small seedling and watering can.",
          "Holding the seedling, __NAME__ remembered the seasons protected with the friends.",
          "Beside the tall sunflower, __NAME__ looked up at the sky. “I want the next child to see this flower too.” The grown view was handed to the future."
        ]
      ]
    },
    "MAGE": {
      "serious": [
        [
          "__NAME__はこわれたじっけんしつでみどりのフラスコをかかげ、はんのうのへんかをたしかめた。",
          "フラスコとしけんかんをひとつずつみなおし、しっぱいもつぎのじっけんへつなげる。",
          "あさひのじっけんしつで__NAME__はフラスコをおいた。「つぎのじっけんは、もっとみんなのやくにたてるよ」。まなびがあしたへつづいた。"
        ],
        [
          "In the ruined laboratory, __NAME__ raised a green flask and checked the changes in the reaction.",
          "Reviewing the flask and test tubes one by one, __NAME__ connected both failures and successes to the next experiment.",
          "In the morning laboratory, __NAME__ set down the flask. “The next experiment will help everyone even more.” Learning continued into tomorrow."
        ]
      ],
      "funny": [
        [
          "__NAME__のじっけんしつからにじしょくのあわがあふれ、ゆかもつくえもあわだらけになった。",
          "ほうきではこうとするたびにあわがふえ、なかまといっしょにおおさわぎになる。",
          "あわのなかからかおをだし、__NAME__はフラスコをかかげた。「じっけんはせいこう！　そうじは……みんなでがんばろう！」。わらいごえがあわとひけた。"
        ],
        [
          "Rainbow-colored foam overflowed from __NAME__’s laboratory, covering the floor and desks.",
          "Every attempt to sweep made more foam appear, turning cleanup into a commotion with the friends.",
          "Popping out of the foam, __NAME__ raised the flask. “The experiment worked! …Now everyone help with the cleaning!” Laughter burst with the bubbles."
        ]
      ],
      "cool": [
        [
          "__NAME__はみどりのフラスコとほし・げんしのづけいにかこまれ、さいごのはんのうをかんせいさせた。",
          "みどりのひかりがひろがるじっけんしつで、けっかをたしかめながらどうどうとあるく。",
          "フラスコをてにじっけんしつのとびらをでて、__NAME__はいった。「つぎのこたえは、そとでみつけよう」。けんきゅうのつづきがひかりのさきへすすんだ。"
        ],
        [
          "Surrounded by a green flask and star and atom shapes, __NAME__ completed the final reaction.",
          "In the laboratory filled with green light, __NAME__ walked confidently while checking the result.",
          "Leaving the laboratory with the flask, __NAME__ said, “Let’s find the next answer outside.” The research continued beyond the light."
        ]
      ],
      "cute": [
        [
          "ほしやげんしのかざりにかこまれ、__NAME__はなかまとフラスコをかこんだ。",
          "めがねをなおしながら、せいこうをいわうかざりをうれしそうにみわたす。",
          "みんなでフラスコをかこみ、__NAME__はわらった。「このじっけん、みんなのなまえをつけよう！」。じっけんしつがおいわいのばしょになった。"
        ],
        [
          "Surrounded by star and atom decorations, __NAME__ gathered with the friends around the flask.",
          "Adjusting the glasses, __NAME__ happily looked over the decorations celebrating the success.",
          "Gathered around the flask, __NAME__ smiled. “Let’s name this experiment after everyone!” The laboratory became a celebration space."
        ]
      ],
      "heartfelt": [
        [
          "しずかなじっけんしつで、__NAME__はみどりのフラスコをてにちいさなへんかをみつめた。",
          "ほしのようなきおくのなかになかまたちのすがたをかさね、つみかさねたまなびをおもいかえす。",
          "__NAME__はまどのカーテンをひらき、フラスコをひかりへかざした。「まなんだことを、つぎのだれかへわたそう」。あたらしいあさがじっけんしつをてらした。"
        ],
        [
          "In the quiet laboratory, __NAME__ held a green flask and watched a small change.",
          "In memories like stars, __NAME__ layered the friends’ figures together and thought back over the learning built step by step.",
          "__NAME__ opened the window curtain and held the flask up to the light. “Let’s pass what we learned to someone next.” A new morning lit the laboratory."
        ]
      ]
    }
  },
  "high-school": {
    "WARRIOR": {
      "serious": [
        [
          "__NAME__はくずれたこうどうのちゅうおうでたちどまり、がれきのむこうにのこったがくえんをみつめた。",
          "なかまがあつまるこうどうで、__NAME__はつぎにすすむほうこうをしずかにさししめした。こぶしをおろしても、いしだけはゆらがない。",
          "ゆうぐれのこうもんへあるきだした__NAME__は、ふりかえらずにいった。「このばしょは、おれたちのてでとりもどす」。とおざかるうわぎが、あしたへのせなかをしめした。"
        ],
        [
          "__NAME__ stopped in the center of the ruined auditorium and looked at the academy remaining beyond the rubble.",
          "In the auditorium where the friends gathered, __NAME__ quietly pointed toward the next direction. Lowering the fist did not shake the will.",
          "Walking toward the school gate at dusk, __NAME__ said without looking back, “We’ll take this place back with our own hands.” The departing jacket showed the way to tomorrow."
        ]
      ],
      "funny": [
        [
          "しょうりのこぶしをつきあげた__NAME__は、くずれたこうどうのなかでなかまのかんせいをうけとめた。",
          "ほんもぬのもバケツもいちどにかかえ、「おれがせんとうにたつ」といったほんにんが、いちばんおおきなにもつをかかえることになる。",
          "ぜんいんでモップをうごかしおえると、__NAME__はいきをきらしてわらった。「なあ、だれかバケツもってくれ！　おれがリーダーだぞ！」。はんぎゃくのいちにちは、だいそうじのおもいでになった。"
        ],
        [
          "After raising a victorious fist, __NAME__ took in the friends’ cheers inside the ruined auditorium.",
          "Trying to carry books, cloth, and a bucket at once, __NAME__ ended up with the biggest load despite saying, “I’ll lead the way.”",
          "After everyone finished moving the mops, __NAME__ laughed breathlessly. “Hey, someone carry the bucket! I’m the leader!” The rebellion became a memory of a huge cleanup."
        ]
      ],
      "cool": [
        [
          "しへんがまうなか、__NAME__はひるがえるうわぎをおさえ、くずれたこうどうのさきをみすえた。",
          "なかまのかんせいをせに、__NAME__はひかりのさすこうどうでつぎのみちをさししめした。",
          "ゆうぐれのこうもんで__NAME__はいちどだけふりかえった。「さきにいく。みちはおれがあける」。そのせなかを、なかまのこえがおいかけた。"
        ],
        [
          "Amid flying scraps of paper, __NAME__ held down the fluttering jacket and stared beyond the ruined auditorium.",
          "With the friends’ cheers behind, __NAME__ pointed toward the next path in the light-filled auditorium.",
          "At the school gate at dusk, __NAME__ looked back once. “I’ll go first. I’ll open the way.” The friends’ voices followed that back."
        ]
      ],
      "cute": [
        [
          "つよがっていた__NAME__も、かざりつけたきょうしつでなかまにかこまれると、すこしだけめをそらした。",
          "なかまからてわたされたおおきなよせがきにしせんをおとし、てれかくしにせいふくのえりをなおす。",
          "はなたばをかこんだなかまのなかで、__NAME__はこぶしをあげた。「わらうなよ……いや、きょうはわらっていい」。はんぎゃくのきねんしゃしんが、えがおのままのこった。"
        ],
        [
          "Even __NAME__, who had acted tough, looked away a little when surrounded by friends in the decorated classroom.",
          "Looking down at the large message board from the friends, __NAME__ adjusted the uniform collar to hide the embarrassment.",
          "Among friends around the bouquet, __NAME__ raised a fist. “Don’t laugh …actually, it’s okay to laugh today.” The rebellion photo remained full of smiles."
        ]
      ],
      "heartfelt": [
        [
          "がれきののこるきょうしつで、__NAME__はあさのひかりにてらされたつくえへしずかにちかづいた。",
          "つくえにてをおいた__NAME__は、まもったのはたてものではなく、なかまがあんしんしてわらえるじかんだとしった。",
          "__NAME__はきょうしつのとびらをひらき、あかるいそとへふみだした。「ここは、おれたちのいばしょだ。あしたももどってこよう」。まもったにちじょうが、つぎのやくそくになった。"
        ],
        [
          "In the classroom still filled with rubble, __NAME__ quietly approached a desk lit by morning light.",
          "With a hand on the desk, __NAME__ realized that what had been protected was not a building, but time for friends to laugh safely.",
          "__NAME__ opened the classroom door and stepped into the bright outside. “This is our place. Let’s come back tomorrow too.” Protected everyday life became the next promise."
        ]
      ]
    },
    "CARETAKER": {
      "serious": [
        [
          "こわれたしいくしつで、__NAME__はウサギをいだき、あれたばしょにもどってきたちいさないのちをたしかめた。",
          "つくえのうえのきろくをひらき、ウサギのそばでひつようなせわとこれからのしいくばしょをかんがえた。",
          "ゆうぐれのこうもんへあるきだした__NAME__は、ウサギをだいていった。「このこたちがあんしんできるばしょにしよう」。あしたのさいしょのしごとが、もうみえていた。"
        ],
        [
          "In the broken animal room, __NAME__ held a rabbit and checked the small life that had returned to the ruined place.",
          "Opening the records on the desk, __NAME__ thought beside the rabbit about the care it needed and its next home.",
          "Walking toward the school gate at dusk with the rabbit in the arms, __NAME__ said, “Let’s make a place where these lives can feel safe.” Tomorrow’s first task was already clear."
        ]
      ],
      "funny": [
        [
          "おいわいのかみふぶきのなか、__NAME__はウサギをいだき、なかまのはくしゅにすこしこまったかおをした。",
          "しいくかごのまわりではみずがはね、どうぶつたちもなかまもげんきいっぱい。せわをするそくがさきにびしょぬれになる。",
          "どうぶつとなかまがかこむしょくたくで、__NAME__はぬれたまえがみをはらいながらわらった。「まって、そっちはえさじゃないよ！」。ぶしつはわらいごえでいっぱいになった。"
        ],
        [
          "Amid celebratory confetti, __NAME__ held a rabbit and looked a little troubled by the friends’ applause.",
          "Water splashed around the animal cage; animals and friends were full of energy, and the caretaker got soaked first.",
          "At the table surrounded by animals and friends, __NAME__ brushed wet bangs aside and laughed. “Wait, that isn’t food!” The clubroom filled with laughter."
        ]
      ],
      "cool": [
        [
          "ゆうやけをせに、__NAME__はウサギをだいてしずかにたった。まもるべきいのちは、うでのなかにいる。",
          "なかまのみおくりをうけながら、__NAME__はウサギとどうぶつがらのバッグをつれてあるきだした。",
          "こうもんをぬけるまえに__NAME__はいちどだけふりかえった。「だいじょうぶ。わたしがさきにいくから」。どうぶつたちをまもるあしどりが、つぎのしいくばしょへつづいていった。"
        ],
        [
          "With the sunset behind, __NAME__ stood quietly holding a rabbit. The life to protect was in the arms.",
          "As the friends saw them off, __NAME__ walked away with the rabbit and an animal-patterned bag.",
          "Before leaving through the school gate, __NAME__ looked back once. “It’s all right. I’ll go ahead.” The footsteps protecting the animals continued toward their next home."
        ]
      ],
      "cute": [
        [
          "かざりつけられたぶしつで、__NAME__はウサギをだいたままなかまのはくしゅをうけた。",
          "ウサギをむねにだいてめをとじると、__NAME__のひょうじょうにもちいさなえがおがうかんだ。",
          "どうぶつたちをかこんでぜんいんがならび、__NAME__はカメラへてをふった。「はい、みんなでこっちむいて」。ちいさないのちとなかまのえがおが、いちまいのきねんになった。"
        ],
        [
          "In the decorated clubroom, __NAME__ received the friends’ applause while still holding the rabbit.",
          "When __NAME__ closed the eyes with the rabbit held to the chest, a small smile appeared on the face.",
          "Everyone lined up around the animals, and __NAME__ waved at the camera. “All right, everyone look this way.” Small lives and friends’ smiles became one keepsake."
        ]
      ],
      "heartfelt": [
        [
          "くらいしいくしつで、__NAME__はつくえにむかい、もどってきたちいさないのちのきろくをかきはじめた。",
          "ちいさなきろくをてに、__NAME__はどうぶつたちのけはいをたしかめ、まもるべきひびをしずかにおもいかえした。",
          "__NAME__はウサギをだいてぶしつのとびらをあけた。「きょうもげんきでいてくれて、ありがとう」。このばしょをつぎのせだいへわたすけついが、あさのひかりにのこった。"
        ],
        [
          "In the dark animal room, __NAME__ sat at the desk and began recording the small life that had returned.",
          "Holding the little record, __NAME__ checked for the animals’ presence and quietly remembered the days that had to be protected.",
          "__NAME__ opened the clubroom door with the rabbit in the arms. “Thank you for being well today too.” The resolve to pass this place to the next generation remained in the morning light."
        ]
      ]
    },
    "ASSASSIN": {
      "serious": [
        [
          "くずれたこうどうで、__NAME__はかわのかばんをてにたち、ちらばったきろくのさきをみつめた。",
          "なかまとむきあった__NAME__は、かばんのなかのきろくをとじ、これからはなすべきことをえらびとった。",
          "こうしゃをみおろすばしょで、__NAME__はなかまのいるほうへしせんをもどした。「このばしょにのこる。こんどは、じぶんのいしで」。てんにゅうせいのみらいは、にんむではなくせんたくになった。"
        ],
        [
          "In the collapsed auditorium, __NAME__ stood with a leather bag and looked beyond the scattered records.",
          "Facing the friends, __NAME__ closed the records in the bag and chose what needed to be said next.",
          "From a place overlooking the school, __NAME__ turned the gaze back toward the friends. “I’ll stay here, this time by my own choice.” The transfer student’s future became a choice, not a mission."
        ]
      ],
      "funny": [
        [
          "かっこうよくたっていた__NAME__がかばんをあけたとたん、しょるいとぶんぼうぐがこうどうちゅうへとびちった。",
          "なぜかころがってきたバスケットボールまでおいかけることになり、れいせいなてんにゅうせいのけいかくはかんぜんにくずれる。",
          "ゆかいっぱいのぶんぼうぐをひろいおえ、__NAME__はなかまにかこまれた。「みなかったことにしてくれる？……だめか」。かくしきれないえがおが、そうどうのさいごにこぼれた。"
        ],
        [
          "The moment __NAME__ opened the bag while standing stylishly, papers and stationery flew across the auditorium.",
          "A basketball somehow rolled in too, forcing a chase and completely ruining the calm transfer student’s plan.",
          "After picking up the stationery scattered across the floor, __NAME__ was surrounded by friends. “Can you pretend you didn’t see that? …No?” A smile impossible to hide slipped out at the end."
        ]
      ],
      "cool": [
        [
          "しへんがまうしずかなくうかんで、__NAME__はかわのかばんをてに、かこのきろくをみおろした。",
          "なかまのかんせいをせに、__NAME__はかばんをかかえたまま、みんなのいるほうへあゆみよった。",
          "ゆうぐれのこうもんで__NAME__はいちどだけふりかえった。「もうかくれない。ここからさきは、ぼくのみちだ」。いちにんできえるみちは、もうえらばなかった。"
        ],
        [
          "In the quiet space where scraps of paper drifted, __NAME__ held a leather bag and looked down at records of the past.",
          "With the friends’ cheers behind, __NAME__ walked toward everyone while still holding the bag.",
          "At the school gate at dusk, __NAME__ looked back once. “I won’t hide anymore. From here on, this is my road.” The road of disappearing alone was no longer chosen."
        ]
      ],
      "cute": [
        [
          "なかまとウサギにかこまれたかざりつけのへやで、__NAME__はへいせいをよそおいながらめをそらした。",
          "むなもとのみどりのリボンをそっとなおし、なかまのきもちをうけとったことをかくしきれなくなる。",
          "なかまのわのなかで__NAME__はすこしだけわらった。「これ、ぼくのぶん？……ありがとう」。なぞめいたてんにゅうせいのひみつが、はじめてわのなかにのこった。"
        ],
        [
          "In a decorated room surrounded by friends and a rabbit, __NAME__ looked away while pretending to stay calm.",
          "Touching the green ribbon at the chest, __NAME__ could no longer hide having accepted the friends’ feelings.",
          "Inside the circle of friends, __NAME__ smiled a little. “Is this for me? …Thank you.” The mysterious transfer student’s secret finally remained inside the circle."
        ]
      ],
      "heartfelt": [
        [
          "ほうかごのひかりがさすきょうしつで、__NAME__はひとりつくえにむかい、しずかにかこをみつめた。",
          "むなもとのみどりのリボンにふれながら、なかまとすごしたきおくをあたらしいページとしてうけいれる。",
          "__NAME__はきょうしつのとびらをひらき、あかるいそとへふみだした。「かえるばしょは、えらんでもいいんだな」。ここですごすじかんを、じぶんのいばしょにしていく。"
        ],
        [
          "In a classroom touched by after-school light, __NAME__ sat alone at a desk and quietly faced the past.",
          "Touching the green ribbon, __NAME__ accepted the time with the friends as a new page.",
          "__NAME__ opened the classroom door and stepped into the bright outside. “I’m allowed to choose where I return.” Time spent here would become a place to belong."
        ]
      ]
    },
    "DODGEBALL": {
      "serious": [
        [
          "__NAME__はきずののこるたいいくかんでしゃがみ、バスケットボールをにぎりなおした。",
          "けついをこめたよこがおでボールをみつめ、なんどもたちあがったじかんをむねにきざむ。",
          "だれもいないたいいくかんで、__NAME__はボールをかかえた。「つぎもぜんいんで、おなじコートにたとう」。しずかなコートに、つぎのしあいへのやくそくがのこった。"
        ],
        [
          "In the scarred gym, __NAME__ crouched and gripped the basketball again.",
          "With a determined profile, __NAME__ stared at the ball and engraved the time spent standing up again and again.",
          "In the empty gym, __NAME__ hugged the ball. “Next time, let’s all stand on the same court again.” A promise for the next game remained on the quiet court."
        ]
      ],
      "funny": [
        [
          "ゆうしょうカップをかかげた__NAME__のよこで、なかまたちがしょうりのポーズをきめた。",
          "コートへとびこむいきおいでボールをおいかけ、__NAME__もなかまもゆかへころがりこんだ。",
          "ゆかにすわりこんだなかまをみて、__NAME__もわらいながらてをさしだした。「かったのに、なんでおれたちがゆかにころがってんだよ！」。さいごまで、さいこうのチームプレーだった。"
        ],
        [
          "Beside the trophy raised by __NAME__, the friends struck victory poses.",
          "Chasing the ball with enough momentum to dive onto the court, __NAME__ and the friends rolled across the floor.",
          "Looking at the friends sitting on the floor, __NAME__ laughed and offered a hand. “We won, so why are we rolling around on the floor?” It was the best team play to the very end."
        ]
      ],
      "cool": [
        [
          "スポットライトのもとで、__NAME__はバスケットボールをてにコートへたった。",
          "ゴールへとびあがるいっしゅんに、なかまからたくされたボールをかくじつにきめる。",
          "ゆうぐれのこうもんへあるきだした__NAME__は、ボールをかかえてふりかえった。「まだおわってねえ。つぎのいちほん、とりにいくぜ！」。つぎのえんちょうせんは、もうはじまっていた。"
        ],
        [
          "Under the spotlight, __NAME__ stood on the court with a basketball.",
          "In the instant of leaping toward the goal, __NAME__ made the ball entrusted by the friends count.",
          "Walking toward the school gate at dusk, __NAME__ looked back with the ball in the arms. “It’s not over. I’m going after the next shot!” The next overtime had already begun."
        ]
      ],
      "cute": [
        [
          "おおきなよせがきのまえになかまがあつまり、__NAME__はすこしてれながらそのわにはいった。",
          "しょうりのポーズをきめようとして、__NAME__はてれかくしにあたまをかき、なかまにわらわれる。",
          "きねんしゃしんのまえで__NAME__はなかまへこえをかけた。「そのポーズ、もういちかい！　こんどはぜんいんそろえてな！」。コートのわらいごえまで、チームのほうもつになった。"
        ],
        [
          "The friends gathered before a large message board, and __NAME__ joined the circle a little shyly.",
          "Trying to make a victory pose, __NAME__ scratched the head to hide the embarrassment and made the friends laugh.",
          "Before the commemorative photo, __NAME__ called to the friends. “That pose again! This time everyone get in!” Even the court’s laughter became a team treasure."
        ]
      ],
      "heartfelt": [
        [
          "しずかなたいいくかんで、__NAME__はひとりボールをかかえ、そらになったコートをみつめた。",
          "ボールのむこうになかまたちのきおくがかさなり、あせとくやしさのじかんがむねによみがえる。",
          "__NAME__はボールをかかえてたいいくかんのとびらをあけた。「またこのコートで、みんなとはしりたい」。あさのひかりが、つぎのしあいへのみちをてらした。"
        ],
        [
          "In the quiet gym, __NAME__ held the ball alone and looked across the empty court.",
          "The friends’ memories overlapped beyond the ball, and the time of sweat and frustration returned to the heart.",
          "__NAME__ opened the gym door with the ball in the arms. “I want to run on this court with everyone again.” Morning light showed the way to the next game."
        ]
      ]
    },
    "BARD": {
      "serious": [
        [
          "__NAME__はほうそうしつのマイクとクリップボードをてに、がくえんへなかまのほんとうのこえをとどけた。",
          "ミキサーときざいのじょうたいをたしかめ、だれのこえもとぎれないしんこうをくみなおす。",
          "あさのほうそうしつで__NAME__はマイクをなかまへむけ、さいごのこえをうけとった。「このこえを、つぎのあしたまでとどけます」。ほうそうはがくえんをつなぐこえへかわった。"
        ],
        [
          "With a broadcast-room microphone and clipboard, __NAME__ delivered the friends’ true voices across the academy.",
          "Checking the mixer and equipment, __NAME__ rebuilt a schedule so no one’s voice would be cut off.",
          "In the morning broadcast room, __NAME__ held the microphone toward a friend and received the final voice. “I’ll carry this voice into the next tomorrow.” The broadcast became a voice connecting the academy."
        ]
      ],
      "funny": [
        [
          "いきおいよくほうそうをはじめた__NAME__は、マイクのケーブルにあしをとられた。",
          "ミキサーとあかいランプがいっせいにはんのうし、ほうそうしつはおおさわぎのなまほうそうになる。",
          "ケーブルをほどきおえた__NAME__は、あかいランプをみてマイクをにぎりなおした。「ほんじつのほうそう、よていがいのばくしょうでおおくりします！」。そうどうそのものが、さいこうのきねんほうそうになった。"
        ],
        [
          "When __NAME__ started the broadcast with enthusiasm, a foot caught on the microphone cable.",
          "The mixer and red lights reacted all at once, turning the broadcast room into a chaotic live show.",
          "After untangling the cable, __NAME__ looked at the red light and gripped the microphone again. “Today’s broadcast comes to you with unexpected comedy!” The whole commotion became the best commemorative show."
        ]
      ],
      "cool": [
        [
          "__NAME__はヘッドホンとマイクをてに、おとのなみがひろがるほうそうしつでひつようなこえだけをせいかくにひろいあげた。",
          "ミキサーへてをのばし、なかまのこえがとどくおんりょうをいっしゅんでととのえる。ここからさきは、だれかにきめられたほうそうではない。",
          "ほうそうしつのとびらへむかった__NAME__はヘッドホンをはずした。「オンエアはおわり。けど、このこえはとめない」。つぎのばんぐみへ、しずかにあるきだした。"
        ],
        [
          "With headphones and a microphone, __NAME__ precisely picked up only the needed voices in the sound-filled broadcast room.",
          "Reaching for the mixer, __NAME__ instantly balanced the volume so the friends’ voices could reach everyone. This was no longer a broadcast decided by someone else.",
          "At the broadcast-room door, __NAME__ took off the headphones. “The broadcast is over, but this voice won’t stop.” Quiet footsteps began toward the next program."
        ]
      ],
      "cute": [
        [
          "__NAME__はなかまからうけとったてづくりのカードをよみあげ、いつもよりすこしだけこえをはずませた。",
          "マイクをかこんでいちにんずつおいわいのことばをろくおんし、ほうそうしつをちいさなぶたいにかえる。",
          "なかまぜんいんがマイクのまえにならび、__NAME__はてであいずをおくった。「せーの、そつぎょうおめでとう！」。かさなったこえとえがおが、ほうそうしつのさいごのいちきょくになった。"
        ],
        [
          "Reading a handmade card from the friends, __NAME__ let the voice bounce a little more than usual.",
          "Around the microphone, __NAME__ recorded one congratulatory message at a time and turned the broadcast room into a little stage.",
          "Everyone lined up at the microphone, and __NAME__ gave a hand signal. “Ready, set, congratulations on graduation!” The overlapping voices and smiles became the room’s final song."
        ]
      ],
      "heartfelt": [
        [
          "ほうそうしつで、__NAME__はなかまといっしょにろくおんへむかい、はいごのきねんしゃしんをみつめた。",
          "スタジオのまどごしに、ろくおんをつづけるなかまのわらいごえをたしかめる。",
          "__NAME__はマイクをてにほうそうしつのとびらをでた。「このわらいごえがもどったことを、ずっとわすれません」。あしたもこのこえをまもるため、ほうそうしつへもどるときめた。"
        ],
        [
          "In the broadcast room, __NAME__ headed to the recording with the friends and looked at the commemorative photo behind them.",
          "Through the studio window, __NAME__ listened for the friends’ laughter continuing in the recording.",
          "__NAME__ left the broadcast room with the microphone. “I’ll never forget that this laughter returned.” __NAME__ decided to come back and protect the voice tomorrow too."
        ]
      ]
    },
    "LIBRARIAN": {
      "serious": [
        [
          "__NAME__はくずれたとしょしつでほんをいちさつずつひろい、いたんだページをたしかめた。",
          "たたかいのきろくをつぎによむひとへわたせるよう、できごととなかまのことばをていねいにかきのこす。",
          "まどべのもどったとしょしつで、__NAME__はさいごのきろくをたなへしまった。「きろくします。わたしたちは、ここからはじめたと」。ものがたりはつぎのどくしゃへうけわたされた。"
        ],
        [
          "In the collapsed library, __NAME__ picked up the books one by one and checked their damaged pages.",
          "To pass the record of the battle to the next reader, __NAME__ carefully wrote down what happened and the friends’ words.",
          "In the restored library by the window, __NAME__ put the final record on the shelf. “I record this: we began here.” The story passed to the next reader."
        ]
      ],
      "funny": [
        [
          "__NAME__がほんをてにしたしゅんかん、つみあげたほんがなだれのようにおちてきて、あわてててをのばした。",
          "ほんとかみのやまにうずもれながらも、たいせつなきろくだけはしっかりまもる。",
          "かみまみれのなかまとかおをみあわせ、__NAME__はおちたほんをかかえたままいった。「ほんはにげませんけど、いまのやまはにげます！」。としょしつのそうどうは、みんなのわらいばなしになった。"
        ],
        [
          "The instant __NAME__ took a book, the stacked books fell like an avalanche.",
          "Even while buried in books and paper, __NAME__ firmly protected the important record.",
          "Facing the paper-covered friends, __NAME__ held the fallen books and said, “Books don’t run, but this pile does!” The library commotion became everyone’s funny story."
        ]
      ],
      "cool": [
        [
          "__NAME__はむらさきのひかりをはなつほんをひらき、としょしつにのこったものがたりのながれをしずかによみなおした。",
          "うかぶページとむらさきのひかりをひとつずつととのえると、ばらばらだったきろくがひとつのけつまつへつながっていく。",
          "むらさきのひかりがひらいたとしょしつのいりぐちで、__NAME__はほんをとじた。「つぎのしょうは、わたしがかきます」。あたらしいものがたりのはじまりへ、あしおとがつづいた。"
        ],
        [
          "__NAME__ opened a book glowing with purple light and quietly reread the flow of stories left in the library.",
          "Straightening the floating pages and purple light one by one, __NAME__ connected the scattered records to a single ending.",
          "At the entrance opened by purple light, __NAME__ closed the book. “I’ll write the next chapter.” Footsteps continued toward a new story."
        ]
      ],
      "cute": [
        [
          "なかまがよういしたカードとほんをみて、__NAME__のめがねのおくのめがやわらかくほそまった。",
          "なかまからうけとったカードをほんのそばにおき、てれながらめがねをなおす。",
          "ほんをかこんだなかまたちへ、__NAME__はあたらしいページをひらいた。「このページ、みんなのなまえでいっぱいにしましょう」。えがおのわが、いちばんかわいいさしえになった。"
        ],
        [
          "Seeing the card and book prepared by the friends, the eyes behind __NAME__’s glasses softened.",
          "Placing the card from the friends beside the book, __NAME__ adjusted the glasses shyly.",
          "Opening a new page for the friends around the book, __NAME__ said, “Let’s fill this page with everyone’s names.” The smiling circle became the cutest illustration."
        ]
      ],
      "heartfelt": [
        [
          "しずかなとしょしつで、__NAME__はランプのしたにすわり、ひとりでページをめくった。",
          "ほんのむこうになかまたちのきおくがかさなり、まもりぬいたにちじょうがしずかによみがえる。",
          "まどべのとしょしつで__NAME__はさいごのいっこうをかきおえ、ペンをおいた。「さいごのいっこうは、ひとりではかけません」。つぎのページは、みんなといっしょにはじまる。"
        ],
        [
          "In the quiet library, __NAME__ sat beneath the lamp and turned the pages alone.",
          "The friends’ memories overlapped beyond the book, and the everyday life they had protected quietly returned.",
          "In the library by the window, __NAME__ finished writing the last line and set down the pen. “I can’t write the last line alone.” The next page began with everyone."
        ]
      ]
    },
    "CHEF": {
      "serious": [
        [
          "__NAME__はこわれたがくしょくのちゅうぼうをみわたし、きえていたひをもういちどつけた。",
          "しゃくしとちょうりきぐをてに、もどってくるなかまのためのあたたかなりょうりをしこんでいく。",
          "ゆうぐれのちゅうぼうで__NAME__はさいしょのさらをなかまのまえへおいた。「たべて、やすんで、またあしたをむかえよう」。がくしょくのいちさらが、かえるばしょのあいずになった。"
        ],
        [
          "__NAME__ looked across the broken cafeteria kitchen and lit the extinguished stove again.",
          "With a ladle and cooking tools, __NAME__ prepared a warm dish for the friends coming back.",
          "In the kitchen at dusk, __NAME__ placed the first plate before the friends. “Eat, rest, and welcome tomorrow again.” One cafeteria dish became a sign of home."
        ]
      ],
      "funny": [
        [
          "おいわいりょうりをはりきりすぎて、__NAME__のまえにはやまもりのりょうりがたかくつみあがった。",
          "フライパンからしょくざいがとび、ゆげのむこうでちゅうぼうはりょうりのあらしになる。",
          "きょだいなさらをかこみ、__NAME__はしゃくしをかかげた。「あじみはいちかいのはずだったんだけどな！」。しっぱいしかけたりょうりは、ぜんいんでわらえるおいわいになった。"
        ],
        [
          "After trying too hard with the celebration meal, __NAME__ piled a mountain of food high in front.",
          "Ingredients flew from the frying pan, and the kitchen became a storm of cooking through the steam.",
          "Around the enormous plate, __NAME__ raised the ladle. “I thought I was only tasting it once!” The almost-failed meal became a celebration everyone could laugh about."
        ]
      ],
      "cool": [
        [
          "__NAME__はしゃくしをてに、ほのおのあがるちゅうぼうでしょくざいのうごきとひかげんをみきわめた。",
          "フライパンをふり、こうばしいほのおとゆげのむこうになかまのためのいちさらをかんせいさせる。",
          "__NAME__はしゃくしをてにちゅうぼうのでぐちへむかった。「ひはおとさねえ。あしたのしこみまで、おれのしごとだ」。がくしょくのあかりが、つぎのあさをむかえる。"
        ],
        [
          "Holding the ladle, __NAME__ judged the ingredients’ movement and the heat in the flaming kitchen.",
          "Swinging the frying pan, __NAME__ finished a dish for the friends through fragrant flame and steam.",
          "With the ladle in hand, __NAME__ headed for the kitchen exit. “I won’t let the fire go out. Preparing tomorrow’s meal is my job.” The cafeteria light welcomed the next morning."
        ]
      ],
      "cute": [
        [
          "__NAME__はなかまといっしょに、ほしやハートのかざりがついたおおきなさらをかこんだ。",
          "かざりつけたりょうりをてに、__NAME__はてれながらなかまのはんのうをまった。",
          "しょくたくをかこむなかまをみわたし、__NAME__はしゃくしをたかくかかげた。「おかわりはあるぞ。えがおのぶんだけな！」。いわいのせきは、もういちどかんせいにつつまれた。"
        ],
        [
          "Together with the friends, __NAME__ gathered around a large plate decorated with stars and hearts.",
          "Holding the decorated dish, __NAME__ waited shyly for the friends’ reactions.",
          "Looking across the friends around the table, __NAME__ raised the ladle. “There are seconds. As many as there are smiles!” The celebration filled with cheers once more."
        ]
      ],
      "heartfelt": [
        [
          "__NAME__はしょくたくにすわり、レシピやりょうりのきろくをまえに、もどってくるにちじょうをおもいえがいた。",
          "なかまたちのきおくをむねに、__NAME__はあたたかないちさらをよういできるよろこびをかみしめる。",
          "__NAME__はしゃくしをてにちゅうぼうのとびらをあけた。「かえってこられるばしょを、これからもつくる」。あさのひかりが、あたたかなしょくどうのあしたをむかえた。"
        ],
        [
          "Sitting at the table before recipes and cooking records, __NAME__ imagined everyday life returning.",
          "With memories of the friends in the heart, __NAME__ savored the joy of preparing a warm dish again.",
          "Opening the kitchen door with the ladle, __NAME__ said, “I’ll keep making a place you can come home to.” Morning light welcomed tomorrow in the warm cafeteria."
        ]
      ]
    },
    "GARDENER": {
      "serious": [
        [
          "__NAME__はふみあらされたなかにわにしゃがみ、のこったちいさななえをりょうてでたしかめた。",
          "えんげいエプロンをととのえ、なえのそばでおれたくきやどのじょうたいをひとつずつみなおす。",
          "__NAME__はちいさななえをまもるようにどへてをそえた。「じかんはかかっても、かならずそだてるよ」。めをまもるてが、つぎのきせつへみらいをわたした。"
        ],
        [
          "Crouching in the trampled courtyard, __NAME__ checked the small seedling that remained with both hands.",
          "Straightening the gardening apron, __NAME__ examined each broken stem and the soil beside the seedling.",
          "__NAME__ placed a hand on the soil as if protecting the small seedling. “It may take time, but I’ll make it grow.” The hand guarding the sprout carried the future to the next season."
        ]
      ],
      "funny": [
        [
          "ホースをひらいたしゅんかん、みずがおもったいじょうのいきおいでふきだし、__NAME__はなかにわをはしりまわった。",
          "なかままでみずしぶきにまきこまれ、えんげいエプロンもせいふくもはっぱだらけになる。",
          "ずぶぬれのなかまとかおをみあわせ、__NAME__はホースをとじた。「みずやりはせいこう！　ただし、ぜんいんずぶぬれだね！」。あれたなかにわには、わらいごえとあたらしいみずのあとがのこった。"
        ],
        [
          "The moment __NAME__ opened the hose, water burst out much harder than expected and sent the gardener running around the courtyard.",
          "The friends were caught in the spray too, leaving gardening aprons, uniforms, and leaves everywhere.",
          "Looking at the drenched friends, __NAME__ shut off the hose. “Watering succeeded! Though now everyone is soaked!” The ruined courtyard kept laughter and fresh water tracks."
        ]
      ],
      "cool": [
        [
          "__NAME__ははなとつるがひろがるにわのちゅうおうで、のびはじめたみどりのいきおいをしずかにみきわめた。",
          "いろとりどりのはなにかこまれ、__NAME__はてをのばして、あれたなかにわにもどったけしきをたしかめる。",
          "はなのにわをせに、__NAME__はなかまへてをふった。「めはもううごきはじめてる。つぎは、おれたちがすすむばんだ」。みどりのみちが、つぎにそだてるばしょへつづいていた。"
        ],
        [
          "In the center of the garden where flowers and vines spread, __NAME__ quietly judged the force of the young green growth.",
          "Surrounded by colorful flowers, __NAME__ reached out and confirmed the view returned to the ruined courtyard.",
          "With the flower garden behind, __NAME__ waved to the friends. “The buds have started moving. Now it’s our turn to go.” The green path continued toward the next place to grow."
        ]
      ],
      "cute": [
        [
          "なかまからちいさなはちうえをてわたされ、__NAME__はてれながらそのなえをうけとった。",
          "なえをむなもとにかかえ、なかまのまえではずかしそうにわらう。",
          "はなのなかでなかまとならび、__NAME__はちいさなはちうえをみせた。「このこも、みんなでそだてようね」。なかにわのわらいごえまで、そだてたじかんのきろくになった。"
        ],
        [
          "Given a little potted plant by the friends, __NAME__ shyly accepted the seedling.",
          "Holding the seedling close to the chest, __NAME__ smiled bashfully before the friends.",
          "Standing with the friends among the flowers, __NAME__ showed the little pot. “Let’s grow this one together too.” Even the courtyard’s laughter became a record of time spent growing."
        ]
      ],
      "heartfelt": [
        [
          "ゆうぐれのにわで、__NAME__はちいさななえとみずやりどうぐをそばにおき、ふたたびいきをしはじめたなかにわをみわたした。",
          "なかまたちのきおくをかさねながら、みずとていれをつづけたばしょにあらわれたちいさなきざしをたしかめる。",
          "ひまわりのそばで__NAME__はみずやりどうぐをてに、なかまへしずかにつげた。「またきせつがめぐったら、ここであおう」。まもったけしきが、つぎのきせつへのやくそくになった。"
        ],
        [
          "In the evening garden, __NAME__ set a small seedling and watering tools nearby and looked across the courtyard beginning to breathe again.",
          "Layering the friends’ memories over the view, __NAME__ checked the small signs appearing where water and care had continued.",
          "Beside the sunflower, __NAME__ held the watering tools and quietly told the friends, “When the seasons turn again, let’s meet here.” The protected view became a promise for the next season."
        ]
      ]
    },
    "MAGE": {
      "serious": [
        [
          "__NAME__はあれたじっけんしつであおいフラスコをてにとり、はんのうのきろくをひとつずつたしかめた。",
          "フラスコとしけんかんをまえに、しっぱいもせいこうもつぎのかせつへつなげていく。",
          "__NAME__はあおいフラスコをなかまへみせた。「このけっかは、つぎのかせつのしゅっぱつてんね」。まなびは、みらいをかえるほうほうをさがすためにつづいていく。"
        ],
        [
          "In the ruined laboratory, __NAME__ picked up a blue flask and checked each reaction record.",
          "Before the flask and test tubes, __NAME__ connected every failure and success to the next hypothesis.",
          "__NAME__ showed the blue flask to the friends. “This result is the starting point for the next hypothesis.” Learning continued as a way to find how to change the future."
        ]
      ],
      "funny": [
        [
          "せいこうのあいずとどうじに、じっけんしつへいろとりどりのあわがあふれだした。",
          "__NAME__はあわをはこうとして、けっきょくはあたまからあわをかぶる。じっけんしつはにじしょくのおおさわぎになる。",
          "あわだらけのじっけんしつでなかまとフラスコをかこみ、__NAME__はきろくようしをかかげた。「だいせいこう！……たぶん、そうじがおわるまではじっけんちゅう！」。にじしょくのそうどうが、さいこうのじっけんきろくになった。"
        ],
        [
          "At the signal of success, colorful foam flooded into the laboratory.",
          "__NAME__ tried to sweep the foam, only to end up covered from head to toe. The laboratory became a rainbow-colored commotion.",
          "Surrounded by the friends and flasks in the foamy laboratory, __NAME__ raised the record sheet. “A great success! …It’s still an experiment until cleanup is finished!” The rainbow disturbance became the best experiment record."
        ]
      ],
      "cool": [
        [
          "__NAME__はあおいえきたいのはいったフラスコをかかげ、ほしがたのづけいとともにさいごのはんのうのへんかをみのがさなかった。",
          "フラスコときろくようしをてに、すうちとけっかをよみきり、みらいへすすむこたえをくみたてる。",
          "__NAME__はあおいフラスコをてにじっけんしつをでた。「はんのうはあんていした。みらいのこたえも、ここからくみたてる」。しょうめいのつづきへ、あゆみがはじまった。"
        ],
        [
          "Holding up a flask of blue liquid, __NAME__ watched every change in the final reaction beside star-shaped patterns.",
          "With the flask and record sheet, __NAME__ read through the numbers and results and assembled an answer for the future.",
          "Leaving the laboratory with the blue flask, __NAME__ said, “The reaction is stable. I’ll build the answer to the future from here too.” The walk toward the proof continued."
        ]
      ],
      "cute": [
        [
          "__NAME__はなかまといっしょに、じっけんしつへほしのかざりをならべておいわいのばをつくった。",
          "フラスコをてに、__NAME__はめがねをなおしながらせいこうきろくをなかまへみせる。",
          "なかまとフラスコをかこみ、__NAME__はわらった。「あおいフラスコに、みんなのせいこうをとじこめよう！」。じっけんしつはえがおのきねんてんじになった。"
        ],
        [
          "Together with the friends, __NAME__ lined star decorations around the laboratory to make a place for celebration.",
          "Holding the flask, __NAME__ adjusted the glasses and happily showed the success record to the friends.",
          "Gathered around the flask, __NAME__ smiled. “Let’s put everyone’s names on this blue flask’s success!” The laboratory became a smiling display."
        ]
      ],
      "heartfelt": [
        [
          "あさのじっけんしつで、__NAME__はあおいえきたいのへんかをしずかにみつめた。",
          "なかまとすごしたきおくをせに、しっぱいをかさねたきろくもつぎのはっけんのためのまなびへかえていく。",
          "__NAME__はまどべのカーテンをひらき、あたらしいひかりをじっけんしつへまねいた。「まなんだことは、だれかのあしたをてらせる」。ちいさなはんのうが、つぎのけんきゅうとみらいをあかるくした。"
        ],
        [
          "In the morning laboratory, __NAME__ quietly watched the change in the blue liquid.",
          "With memories of time spent with the friends behind, __NAME__ turned even the records of repeated failures into learning for the next discovery.",
          "__NAME__ opened the window curtain and welcomed new light into the laboratory. “What we learned can light someone’s tomorrow.” A small reaction brightened the next research and future."
        ]
      ]
    }
  }
}
;

