import type { LanguageMode } from '../types';
import type { VisualThemeId } from './visualThemes';

export type EndlessEndingKind = 'OPENING' | 'TRUE';

export interface EndlessEndingPage {
  title: string;
  titleHiragana: string;
  titleEnglish: string;
  text: string;
  textHiragana: string;
  textEnglish: string;
  imagePath: string;
}

export interface EndlessEndingSequence {
  id: string;
  characterId: string;
  characterName: string;
  kind: EndlessEndingKind;
  pages: [EndlessEndingPage, EndlessEndingPage, EndlessEndingPage];
}

type Line = { ja: string; hira: string; en: string };
type HeroEndingCopy = {
  opening: [Line, Line, Line];
  true: [Line, Line, Line];
};

const HERO_ENDING_COPY: Record<string, HeroEndingCopy> = {
  WARRIOR: {
    opening: [
      { ja: '校門の向こうの朝', hira: 'こうもんの むこうの あさ', en: 'Morning Beyond the Gate' },
      { ja: '開いた道へ', hira: 'ひらいた みちへ', en: 'Toward the Open Road' },
      { ja: '次の階層へ', hira: 'つぎの かいそうへ', en: 'To the Next Floor' },
    ],
    true: [
      { ja: '海辺の作戦会議', hira: 'うみべの さくせんかいぎ', en: 'A Strategy Meeting by the Sea' },
      { ja: '勝利のかき氷', hira: 'しょうりの かきごおり', en: 'Victory Shaved Ice' },
      { ja: 'また走り出す', hira: 'また はしりだす', en: 'Running Again' },
    ],
  },
  CARETAKER: {
    opening: [
      { ja: '飼育小屋の夜明け', hira: 'しいくごやの よあけ', en: 'Dawn at the Animal Shed' },
      { ja: '羽根が示す道', hira: 'はねが しめす みち', en: 'The Feather’s Path' },
      { ja: '命の記録を胸に', hira: 'いのちの きろくを むねに', en: 'Carrying a Record of Life' },
    ],
    true: [
      { ja: '海辺の保護区', hira: 'うみべの ほごく', en: 'The Seaside Sanctuary' },
      { ja: '観察ノートの休日', hira: 'かんさつのおとの きゅうじつ', en: 'A Holiday for the Notebook' },
      { ja: 'ただいま、みんな', hira: 'ただいま、みんな', en: 'I’m Home, Everyone' },
    ],
  },
  ASSASSIN: {
    opening: [
      { ja: '静かなホーム', hira: 'しずかな ホーム', en: 'A Quiet Platform' },
      { ja: '影をほどく', hira: 'かげを ほどく', en: 'Unraveling the Shadow' },
      { ja: '自分で選ぶ道', hira: 'じぶんで えらぶ みち', en: 'A Road Chosen Alone' },
    ],
    true: [
      { ja: '午後の小さなカフェ', hira: 'ごごの ちいさな カフェ', en: 'A Small Café in the Afternoon' },
      { ja: '秘密ではない笑顔', hira: 'ひみつでは ない えがお', en: 'A Smile That Is No Secret' },
      { ja: '光のほうへ', hira: 'ひかりの ほうへ', en: 'Toward the Light' },
    ],
  },
  DODGEBALL: {
    opening: [
      { ja: '体育館の朝練', hira: 'たいいくかんの あされん', en: 'Morning Practice' },
      { ja: 'オレンジの軌道', hira: 'オレンジの きどう', en: 'The Orange Trajectory' },
      { ja: 'ブザーの先へ', hira: 'ブザーの さきへ', en: 'Beyond the Buzzer' },
    ],
    true: [
      { ja: '浜辺の延長戦', hira: 'はまべの えんちょうせん', en: 'Overtime on the Beach' },
      { ja: '夕暮れのパス', hira: 'ゆうぐれの パス', en: 'A Pass at Dusk' },
      { ja: 'まだ終わらない', hira: 'まだ おわらない', en: 'It’s Not Over Yet' },
    ],
  },
  BARD: {
    opening: [
      { ja: '放送室のスイッチ', hira: 'ほうそうしつの スイッチ', en: 'The Broadcast Switch' },
      { ja: '声が届く場所', hira: 'こえが とどく ばしょ', en: 'Where Voices Reach' },
      { ja: 'オンエア開始', hira: 'オンエア かいし', en: 'On Air' },
    ],
    true: [
      { ja: '海辺のラジオ局', hira: 'うみべの ラジオきょく', en: 'A Radio Station by the Sea' },
      { ja: 'マイクを置く休日', hira: 'マイクを おく きゅうじつ', en: 'A Day Off the Mic' },
      { ja: '本当の声で', hira: 'ほんとうの こえで', en: 'In Our True Voices' },
    ],
  },
  LIBRARIAN: {
    opening: [
      { ja: '図書室の始発', hira: 'としょしつの しはつ', en: 'The Library’s First Train' },
      { ja: 'しおりを挟んで', hira: 'しおりを はさんで', en: 'Place the Bookmark' },
      { ja: '次の一冊へ', hira: 'つぎの いっさつへ', en: 'Toward the Next Book' },
    ],
    true: [
      { ja: '海風とページ', hira: 'うみかぜと ページ', en: 'Sea Breeze and Pages' },
      { ja: '書店カフェの午後', hira: 'しょてんカフェの ごご', en: 'An Afternoon at the Book Café' },
      { ja: '物語は続く', hira: 'ものがたりは つづく', en: 'The Story Continues' },
    ],
  },
  CHEF: {
    opening: [
      { ja: '厨房の一番星', hira: 'ちゅうぼうの いちばんぼし', en: 'The First Star in the Kitchen' },
      { ja: '仕込みは完了', hira: 'しこみは かんりょう', en: 'Prep Is Complete' },
      { ja: '熱々の旅へ', hira: 'あつあつの たびへ', en: 'A Hot-Blooded Journey' },
    ],
    true: [
      { ja: '浜辺のバーベキュー', hira: 'はまべの バーベキュー', en: 'A Beachside Barbecue' },
      { ja: '市場でひと休み', hira: 'いちばで ひとやすみ', en: 'A Break at the Market' },
      { ja: 'いただきます！', hira: 'いただきます！', en: 'Let’s Eat!' },
    ],
  },
  GARDENER: {
    opening: [
      { ja: '温室の朝露', hira: 'おんしつの あさつゆ', en: 'Dew in the Greenhouse' },
      { ja: '芽吹く階段', hira: 'めぶく かいだん', en: 'The Stairway in Bloom' },
      { ja: '種を風に乗せて', hira: 'たねを かぜに のせて', en: 'Let the Seeds Ride the Wind' },
    ],
    true: [
      { ja: 'ひまわりの海', hira: 'ひまわりの うみ', en: 'A Sea of Sunflowers' },
      { ja: '森のピクニック', hira: 'もりの ピクニック', en: 'A Picnic in the Woods' },
      { ja: '次の季節を育てる', hira: 'つぎの きせつを そだてる', en: 'Growing the Next Season' },
    ],
  },
  MAGE: {
    opening: [
      { ja: '実験室の青い光', hira: 'じっけんしつの あおい ひかり', en: 'Blue Light in the Lab' },
      { ja: '星型の仮説', hira: 'ほしがたの かせつ', en: 'A Star-Shaped Hypothesis' },
      { ja: '未知への反応', hira: 'みちへの はんのう', en: 'A Reaction to the Unknown' },
    ],
    true: [
      { ja: '星空観測の休日', hira: 'ほしぞら かんそくの きゅうじつ', en: 'A Holiday Under the Stars' },
      { ja: '流星とフラスコ', hira: 'りゅうせいと フラスコ', en: 'Meteors and Flasks' },
      { ja: '学びは自由', hira: 'まなびは じゆう', en: 'Learning Is Freedom' },
    ],
  },
};

const HERO_LINES: Record<string, { opening: [Line, Line, Line]; true: [Line, Line, Line] }> = {
  WARRIOR: {
    opening: [
      { ja: '赤い帽子を直し、朝日の校門で仲間を待つ。勝利の先にも、まだ知らない階層が続いている。', hira: 'あかい ぼうしを なおし、あさひの こうもんで なかまを まつ。しょうりの さきにも、まだ しらない かいそうが つづいている。', en: 'Adjusting the red cap, the hero waits at the sunlit gate. Unknown floors still stretch beyond victory.' },
      { ja: '昨日までの教室を背に、靴ひもを結び直す。今度は自分たちの足で、終わらない道を進む。', hira: 'きのうまでの きょうしつを せに、くつひもを むすびなおす。こんどは じぶんたちの あしで、おわらない みちを すすむ。', en: 'With yesterday’s classroom behind them, the hero reties their laces and steps onto an endless road.' },
      { ja: '「よーし、次も一番乗りだ！」 笑い声とともに、最初の階層へ駆け出した。', hira: '「よーし、つぎも いちばんのりだ！」 わらいごえと ともに、さいしょの かいそうへ かけだした。', en: '“All right, I’m first again!” With a laugh, the hero races toward the first floor.' },
    ],
    true: [
      { ja: '深層を越えたごほうびは、潮風の中の作戦会議。戦いのない海を、仲間と眺める。', hira: 'しんそうを こえた ごほうびは、しおかぜの なかの さくせんかいぎ。たたかいの ない うみを、なかまと ながめる。', en: 'The reward for conquering the depths is a strategy meeting in the sea breeze, watching a peaceful ocean with friends.' },
      { ja: 'かき氷を頬張りながら、次の冒険の話で盛り上がる。「休むのも作戦だよな！」', hira: 'かきごおりを ほおばりながら、つぎの ぼうけんの はなしで もりあがる。「やすむのも さくせんだよな！」', en: 'Over shaved ice, everyone plans the next adventure. “Resting is part of the strategy!”' },
      { ja: '「俺たちの道は、まだ続く！」 赤い帽子が夕日にきらめき、自由な明日へ走り出す。', hira: '「おれたちの みちは、まだ つづく！」 あかい ぼうしが ゆうひに きらめき、じゆうな あしたへ はしりだす。', en: '“Our road is still going!” The red cap glints at sunset as the hero runs toward a free tomorrow.' },
    ],
  },
  CARETAKER: {
    opening: [
      { ja: '飼育小屋の扉を開けると、羽根を揺らす仲間たちが朝を知らせた。', hira: 'しいくごやの とびらを あけると、はねを ゆらす なかまたちが あさを しらせた。', en: 'When the animal shed opens, feathered friends greet the morning.' },
      { ja: '観察ノートに新しいページを開き、命の気配をたどる旅へ出る。', hira: 'かんさつのおとに あたらしい ページを ひらき、いのちの けはいを たどる たびへ でる。', en: 'A new page opens in the observation notebook, beginning a journey that follows every sign of life.' },
      { ja: '「みんな、行ってきます。帰ったら、今日の発見を聞かせてね」', hira: '「みんな、いってきます。かえったら、きょうの はっけんを きかせてね」', en: '“I’ll be back. Tell me what you discover today.”' },
    ],
    true: [
      { ja: '深層の向こうで見つけたのは、海辺の小さな保護区。傷ついた命に、そっと手を差し出す。', hira: 'しんそうの むこうで みつけたのは、うみべの ちいさな ほごく。きずついた いのちに、そっと てを さしだす。', en: 'Beyond the depths lies a small seaside sanctuary where a gentle hand reaches for a wounded life.' },
      { ja: '波音を聞きながらノートを開く。今日の記録は、助かった命と笑った仲間のこと。', hira: 'なみおとを ききながら ノートを ひらく。きょうの きろくは、たすかった いのちと わらった なかまの こと。', en: 'With waves in the background, the notebook records rescued lives and laughing friends.' },
      { ja: '「ただいま、みんな」 羽根が舞う夕暮れに、新しい一日を抱きしめた。', hira: '「ただいま、みんな」 はねが まう ゆうぐれに、あたらしい いちにちを だきしめた。', en: '“I’m home, everyone.” In the feather-filled dusk, the hero embraces a new day.' },
    ],
  },
  ASSASSIN: {
    opening: [
      { ja: '誰もいないホームで、黒いスカーフが風に揺れる。もう隠れる必要はない。', hira: 'だれも いない ホームで、くろい スカーフが かぜに ゆれる。もう かくれる ひつようは ない。', en: 'On an empty platform, a dark scarf catches the wind. There is no need to hide anymore.' },
      { ja: '影のように静かでも、進む先は自分で選べる。足音が新しい道を刻む。', hira: 'かげの ように しずかでも、すすむ さきは じぶんで えらべる。あしおとが あたらしい みちを きざむ。', en: 'Even in silence like a shadow, the hero can choose where to go. Footsteps mark a new path.' },
      { ja: '「次は、私が決める」 朝の列車が、終わらない階層へ走り出す。', hira: '「つぎは、わたしが きめる」 あさの れっしゃが、おわらない かいそうへ はしりだす。', en: '“This time, I decide.” The morning train moves toward the endless floors.' },
    ],
    true: [
      { ja: '深層を越えた休日は、静かなカフェの窓際。誰にも追われない午後を味わう。', hira: 'しんそうを こえた きゅうじつは、しずかな カフェの まどぎわ。だれにも おわれない ごごを あじわう。', en: 'After the depths, a quiet café window offers an afternoon with no one chasing.' },
      { ja: 'カメラに残すのは、仲間と交わす柔らかな笑顔。秘密ではない日常が、少しずつ増えていく。', hira: 'カメラに のこすのは、なかまと かわす やわらかな えがお。ひみつでは ない にちじょうが、すこしずつ ふえていく。', en: 'The camera captures a soft smile shared with friends; an ordinary life grows, free of secrets.' },
      { ja: '「過去は消えなくても、行き先は選べる」 夕暮れの光へ、まっすぐ歩いた。', hira: '「かこは きえなくても、いきさきは えらべる」 ゆうぐれの ひかりへ、まっすぐ あるいた。', en: '“The past stays, but I choose where I go.” The hero walks straight into the evening light.' },
    ],
  },
  DODGEBALL: {
    opening: [
      { ja: '体育館の床に朝日が伸びる。オレンジのボールを握り、次の試合を待つ。', hira: 'たいいくかんの ゆかに あさひが のびる。オレンジの ボールを にぎり、つぎの しあいを まつ。', en: 'Sunlight stretches across the gym floor as the ace grips an orange ball and awaits the next match.' },
      { ja: '走り込むたび、足跡が終わらない階段を描く。仲間の声が背中を押す。', hira: 'はしりこむ たび、あしあとが おわらない かいだんを えがく。なかまの こえが せなかを おす。', en: 'Every sprint draws a staircase without end; teammates’ voices push the ace onward.' },
      { ja: '「ブザーの先が本番だ！」 ボールを高く掲げ、最初の階層へ駆ける。', hira: '「ブザーの さきが ほんばんだ！」 ボールを たかく かかげ、さいしょの かいそうへ かける。', en: '“The real game starts beyond the buzzer!” The ace raises the ball and races to floor one.' },
    ],
    true: [
      { ja: '深層クリアのごほうびは、波打ち際の延長戦。砂浜に新しいコートを描く。', hira: 'しんそう クリアの ごほうびは、なみうちぎわの えんちょうせん。すなはまに あたらしい コートを えがく。', en: 'The reward for clearing the depths is overtime by the waves, with a fresh court drawn in the sand.' },
      { ja: '夕暮れのパスは、勝ち負けよりも仲間の笑顔へ。ボールが空を何度も往復する。', hira: 'ゆうぐれの パスは、かちまけよりも なかまの えがおへ。ボールが そらを なんども おうふくする。', en: 'At dusk, every pass aims for a teammate’s smile; the ball crosses the sky again and again.' },
      { ja: '「まだ終わらない。次の一球も、みんなで決めよう！」', hira: '「まだ おわらない。つぎの いっきゅうも、みんなで きめよう！」', en: '“It’s not over. Let’s decide the next shot together!”' },
    ],
  },
  BARD: {
    opening: [
      { ja: '放送室のスイッチを入れると、黄色いマイクが朝の光を返した。', hira: 'ほうそうしつの スイッチを いれると、きいろい マイクが あさの ひかりを かえした。', en: 'The yellow microphone catches the morning light as the broadcast switch turns on.' },
      { ja: '声が届く場所を探し、校内放送の先にある終わらない舞台へ向かう。', hira: 'こえが とどく ばしょを さがし、こうない ほうそうの さきに ある おわらない ぶたいへ むかう。', en: 'Searching for places where voices can reach, the broadcaster heads toward an endless stage.' },
      { ja: '「オンエア開始！ 次のニュースは、ぼくらの冒険です！」', hira: '「オンエア かいし！ つぎの ニュースは、ぼくらの ぼうけんです！」', en: '“On air! The next headline is our adventure!”' },
    ],
    true: [
      { ja: '深層の後は、海辺の小さなラジオ局。潮騒と一緒に、のんびり番組を届ける。', hira: 'しんそうの あとは、うみべの ちいさな ラジオきょく。しおさいと いっしょに、のんびり ばんぐみを とどける。', en: 'After the depths, a tiny seaside radio station sends a relaxed show out with the surf.' },
      { ja: 'マイクを置いた休日、仲間と歌う声がそのまま番組になる。笑い声も大切な音だ。', hira: 'マイクを おいた きゅうじつ、なかまと うたう こえが そのまま ばんぐみに なる。わらいごえも たいせつな おとだ。', en: 'On a day off the mic, friends’ singing becomes the show; laughter is an important sound too.' },
      { ja: '「この声は切らない。次は、学園の本当の明日を放送するよ」', hira: '「この こえは きらない。つぎは、がくえんの ほんとうの あしたを ほうそうするよ」', en: '“This voice stays live. Next, we broadcast the academy’s true tomorrow.”' },
    ],
  },
  LIBRARIAN: {
    opening: [
      { ja: '朝一番の図書室で、開いた本に光が落ちる。しおりは新しい章の合図だ。', hira: 'あさ いちばんの としょしつで、ひらいた ほんに ひかりが おちる。しおりは あたらしい しょうの あいずだ。', en: 'Morning light falls on an open book; the bookmark signals a new chapter.' },
      { ja: '記録を鞄にしまい、誰も読んだことのない階層へページをめくるように進む。', hira: 'きろくを かばんに しまい、だれも よんだ ことの ない かいそうへ ページを めくる ように すすむ。', en: 'The librarian packs the records and advances into unread floors like turning pages.' },
      { ja: '「次の一冊は、みんなで書こう」 しおりが風に揺れ、旅が始まる。', hira: '「つぎの いっさつは、みんなで かこう」 しおりが かぜに ゆれ、たびが はじまる。', en: '“Let’s write the next book together.” The bookmark flutters and the journey begins.' },
    ],
    true: [
      { ja: '深層を越えた先、海風の中でページを開く。戦いのない静けさが、文字を鮮やかにする。', hira: 'しんそうを こえた さき、うみかぜの なかで ページを ひらく。たたかいの ない しずけさが、もじを あざやかに する。', en: 'Beyond the depths, sea air turns a quiet, battle-free page vivid.' },
      { ja: '書店カフェで仲間の旅を聞き、余白に小さな挿絵を描き足す。', hira: 'しょてん カフェで なかまの たびを きき、よはくに ちいさな さしえを かきたす。', en: 'At a book café, the librarian hears each friend’s journey and adds a small illustration in the margin.' },
      { ja: '「この物語は終章じゃない。次のページを、私たちで開こう」', hira: '「この ものがたりは しゅうしょうじゃない。つぎの ページを、わたしたちで ひらこう」', en: '“This story is not the final chapter. Let’s open the next page ourselves.”' },
    ],
  },
  CHEF: {
    opening: [
      { ja: '厨房の一番星が消えるころ、ピンクのおたまが鍋を軽く叩く。仕込みは完了だ。', hira: 'ちゅうぼうの いちばんぼしが きえる ころ、ピンクの おたまが なべを かるく たたく。しこみは かんりょうだ。', en: 'As the first kitchen star fades, the pink ladle taps the pot: prep is complete.' },
      { ja: '湯気の向こうに新しい階層が見える。仲間のための一皿を、旅の途中で作る。', hira: 'ゆげの むこうに あたらしい かいそうが みえる。なかまの ための ひとさらを、たびの とちゅうで つくる。', en: 'New floors appear beyond the steam; along the journey, the chef will cook a plate for the team.' },
      { ja: '「熱いうちに行こう！」 エプロンを結び、終わらない厨房へ駆け出す。', hira: '「あついうちに いこう！」 エプロンを むすび、おわらない ちゅうぼうへ かけだす。', en: '“Let’s go while it’s hot!” The chef ties the apron and runs into the endless kitchen.' },
    ],
    true: [
      { ja: '深層クリアの休日は、浜辺のバーベキュー。炭火の香りが、勝利の余韻を包む。', hira: 'しんそう クリアの きゅうじつは、はまべの バーベキュー。すみびの かおりが、しょうりの よいんを つつむ。', en: 'The day off after clearing the depths is a beach barbecue, charcoal scent wrapping the afterglow of victory.' },
      { ja: '市場で食材を選びながら、仲間の好みを覚えていく。料理は、思い出を盛りつけること。', hira: 'いちばで しょくざいを えらびながら、なかまの このみを おぼえて いく。りょうりは、おもいでを もりつける こと。', en: 'Choosing ingredients at the market, the chef learns each friend’s tastes. Cooking serves memories.' },
      { ja: '「いただきます！ 自由の味は、みんなで食べるともっとおいしいよ」', hira: '「いただきます！ じゆうの あじは、みんなで たべると もっと おいしいよ」', en: '“Let’s eat! Freedom tastes better when we share it.”' },
    ],
  },
  GARDENER: {
    opening: [
      { ja: '温室の朝露が若葉をきらめかせる。小さな種をポケットに入れ、土を踏む。', hira: 'おんしつの あさつゆが わかばを きらめかせる。ちいさな たねを ポケットに いれ、つちを ふむ。', en: 'Dew makes young leaves sparkle. The gardener pockets a seed and steps onto the soil.' },
      { ja: '一段進むたび、足元に芽が出る。終わらない階段にも、季節は育つ。', hira: 'いちだん すすむ たび、あしもとに めが でる。おわらない かいだんにも、きせつは そだつ。', en: 'With every step, a sprout appears. Even an endless staircase can grow a season.' },
      { ja: '「行ってきます。帰るころには、もっと緑にするね」 種を風に放った。', hira: '「いってきます。かえる ころには、もっと みどりに するね」 たねを かぜに はなった。', en: '“I’ll be back. I’ll make it greener by then.” The seed rides the wind.' },
    ],
    true: [
      { ja: '深層の向こうは、ひまわりが波のように揺れる丘。光の中で仲間と昼寝をする。', hira: 'しんそうの むこうは、ひまわりが なみの ように ゆれる おか。ひかりの なかで なかまと ひるねを する。', en: 'Beyond the depths, sunflowers ripple across a hill where friends nap in the light.' },
      { ja: '森のピクニックで拾った種を、次の季節の鉢へ。休むことも、育てる時間だ。', hira: 'もりの ピクニックで ひろった たねを、つぎの きせつの はちへ。やすむ ことも、そだてる じかんだ。', en: 'Seeds gathered on a woodland picnic go into pots for the next season. Rest is growing time too.' },
      { ja: '「荒れた場所にも根は残っている。次に咲く景色を、私が育てる」', hira: '「あれた ばしょにも ねは のこっている。つぎに さく けしきを、わたしが そだてる」', en: '“Roots survive even in ruined places. I’ll grow the view that blooms next.”' },
    ],
  },
  MAGE: {
    opening: [
      { ja: '青いフラスコの光が、静かな実験室を照らす。新しい反応式をノートに記す。', hira: 'あおい フラスコの ひかりが、しずかな じっけんしつを てらす。あたらしい はんのうしきを ノートに しるす。', en: 'Blue flask-light fills the quiet laboratory as a new reaction is written in the notebook.' },
      { ja: '星型の火花が空中に道を描く。未知を怖がらず、仮説を一歩ずつ試す。', hira: 'ほしがたの ひばなが くうちゅうに みちを えがく。みちを こわがらず、かせつを いっぽずつ ためす。', en: 'Star-shaped sparks sketch a path through the air. The mage tests each hypothesis without fearing the unknown.' },
      { ja: '「反応開始。次の答えは、次の階層で見つけよう」 光の扉をくぐった。', hira: '「はんのう かいし。つぎの こたえは、つぎの かいそうで みつけよう」 ひかりの とびらを くぐった。', en: '“Reaction start. We’ll find the next answer on the next floor.” The mage steps through the light.' },
    ],
    true: [
      { ja: '深層を越えた休日は、丘の観測所。望遠鏡の向こうに、まだ知らない星がある。', hira: 'しんそうを こえた きゅうじつは、おかの かんそくじょ。ぼうえんきょうの むこうに、まだ しらない ほしが ある。', en: 'After the depths, an observatory hill reveals unknown stars beyond the telescope.' },
      { ja: '流星が落ちるたび、フラスコの火花も弾ける。研究も休暇も、好奇心から始まる。', hira: 'りゅうせいが おちる たび、フラスコの ひばなも はじける。けんきゅうも きゅうかも、こうきしんから はじまる。', en: 'Each meteor makes the flask spark. Research and vacation both begin with curiosity.' },
      { ja: '「学びは檻じゃない。未来を変える、自由な反応だよ」', hira: '「まなびは おりじゃない。みらいを かえる、じゆうな はんのうだよ」', en: '“Learning is not a cage. It is a free reaction that changes the future.”' },
    ],
  },
};

const fallbackCopy = HERO_ENDING_COPY.WARRIOR;
const fallbackLines = HERO_LINES.WARRIOR;

export const getEndlessEndingSequence = (
  kind: EndlessEndingKind,
  characterId: string,
  characterName: string,
  theme: VisualThemeId = 'elementary',
  magicProtagonistId?: string,
): EndlessEndingSequence => {
  const safeId = HERO_ENDING_COPY[characterId] ? characterId : 'WARRIOR';
  const titles = HERO_ENDING_COPY[safeId] ?? fallbackCopy;
  const lines = HERO_LINES[safeId] ?? fallbackLines;
  const pages = (kind === 'OPENING' ? titles.opening : titles.true).map((title, index) => {
    const line = (kind === 'OPENING' ? lines.opening : lines.true)[index];
    const scene = kind === 'OPENING' ? 'opening' : 'true';
    return {
      title: title.ja,
      titleHiragana: title.hira,
      titleEnglish: title.en,
      text: line.ja,
      textHiragana: line.hira,
      textEnglish: line.en,
      imagePath: theme === 'magic' && magicProtagonistId
        ? `sprites/endless-endings/magic/male/${magicProtagonistId.toLowerCase()}/${scene}-${index + 1}.webp`
        : `sprites/endless-endings/${theme === 'elementary' ? '' : `${theme}/`}${safeId.toLowerCase()}/${scene}-${index + 1}.webp`,
    };
  }) as [EndlessEndingPage, EndlessEndingPage, EndlessEndingPage];
  return {
    id: `${kind.toLowerCase()}-${safeId.toLowerCase()}`,
    characterId: safeId,
    characterName,
    kind,
    pages,
  };
};

export const getEndlessEndingLocalizedTitle = (page: EndlessEndingPage, languageMode: LanguageMode): string =>
  languageMode === 'ENGLISH' ? page.titleEnglish : languageMode === 'HIRAGANA' ? page.titleHiragana : page.title;

export const getEndlessEndingLocalizedText = (page: EndlessEndingPage, languageMode: LanguageMode): string =>
  languageMode === 'ENGLISH' ? page.textEnglish : languageMode === 'HIRAGANA' ? page.textHiragana : page.text;
