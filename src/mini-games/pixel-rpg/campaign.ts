export type Copy = readonly [ja: string, en: string];
export type Climate = 'meadow' | 'machine' | 'crystal' | 'tide' | 'sky' | 'ruin' | 'night';
export type Vehicle = 'foot' | 'canoe' | 'ship' | 'submarine' | 'airship' | 'skyship';
export type Feature = 'lever' | 'water' | 'ice' | 'mirror' | 'rotor' | 'warp' | 'rock' | 'pit';
export type Service = 'inn' | 'armory' | 'forge' | 'cards' | 'items' | 'library' | 'guild' | 'tavern' | 'notice' | 'home';
export type LocationType = 'town' | 'wild' | 'dungeon' | 'sanctuary';
export type Location = { name: Copy; type: LocationType; feature?: Feature };
export type Region = {
  name: Copy; chapter: Copy; place: readonly [number, number]; climate: Climate; sites: readonly Location[];
  keeper: Copy; opening: Copy; aftermath: Copy; rumor: Copy; quest: Copy; questDone: Copy;
  book: Copy; core: Copy; boss: Copy; signature: Copy; required: Vehicle; grant?: Vehicle;
};

export const TITLE: Copy = ['知識の旅人と失われた世界', 'Knowledge Travelers and the Lost World'];
export const PROLOGUE: readonly Copy[] = [
  ['放課後、どこからともなく教室の鐘が鳴った。白紙の地図に、知らない世界の海岸線がにじんでいく。', 'After school, a bell rings in an empty classroom. The coast of an unfamiliar world seeps into a blank map.'],
  ['同じ鐘を聞いたのは、同じ学校の子だけではなかった。地図の向こうで、名前も道順も忘れかけた人々が、旅人を待っていた。', 'The bell was heard beyond your school. On the other side of the map, people about to forget their names and roads are waiting for travelers.'],
];
export const ENDING: readonly Copy[] = [
  ['最後の核が戻ると、いちばん先に戻ったのは、竜の名前でも王国の歴史でもなかった。村で朝食を分けてくれた人の、焼きたてのパンの作り方だった。', 'When the final core returns, neither a dragon’s name nor a royal history is first to come back. It is the recipe of the villager who shared breakfast with you.'],
  ['記憶を守るのは、何でも覚えている誰かではない。知っていることを、必要な相手に手渡す人の数だ。', 'Memory is kept by the many people who pass on what they know when someone needs it.'],
  ['それぞれの放課後へ帰る前に、仲間は地図の余白を残した。次に世界を歩く人が、自分のことばで書き込めるように。', 'Before heading back to their own afternoons, the party leaves the margin of the map blank, for the next traveler to write in their own words.'],
];

const town = (ja: string, en: string): Location => ({ name: [ja, en], type: 'town' });
const wild = (ja: string, en: string, feature?: Feature): Location => ({ name: [ja, en], type: 'wild', feature });
const sanctuary = (ja: string, en: string, feature: Feature): Location => ({ name: [ja, en], type: 'sanctuary', feature });
const dungeon = (ja: string, en: string, feature: Feature): Location => ({ name: [ja, en], type: 'dungeon', feature });
export const REGIONS: readonly Region[] = [
  {
    name: ['はじまりの大地', 'Firstlight Reach'], chapter: ['第1章 はじまりの仲間', 'Chapter 1 · First companions'], place: [15, 17], climate: 'meadow',
    sites: [town('灯ノ根村', 'Lamproot'), wild('学びの草原', 'Meadow of Lessons'), sanctuary('木漏れ日の集落', 'Sunleaf Hamlet', 'rock'), sanctuary('綴りの神殿', 'Sanctuary of Threads', 'mirror'), dungeon('忘れられた洞窟', 'The Forgotten Cave', 'lever')],
    keeper: ['灯守のノノ', 'Nono the Lamplighter'],
    opening: ['村の鐘は空っぽの音しかしない。洞窟へ入った子が、帰る道だけ忘れたんだ。草原に落ちていた地図の切れ端を見ておくれ。', 'The village bell sounds hollow. A child came out of the cave remembering everything except the road home. Look for the torn map in the meadow.'],
    aftermath: ['帰り道を思い出せない子が、今度は誰かに道を教えている。これで対岸にも灯りが届くね。', 'The child who forgot the road home is now giving someone directions. Our light can reach the far bank again.'],
    rumor: ['草原に一冊、神殿の横道に一冊。本は帰ってきたら宿にも見せておくれ。', 'One book lies in the meadow and one off the sanctuary path. Show them to the innkeeper on your return.'],
    quest: ['草原の道しるべを訪ね、旅の記録を持ち帰る。', 'Bring back the travel record from the meadow.'],
    questDone: ['地図の余白に、新しい帰り道が書き足された。', 'A new road home is drawn in the margin of the map.'],
    book: ['帰り道を覚える本', 'Finding Your Way Home'], core: ['道の核', 'Road Core'], boss: ['石灯の番人', 'Stone-Lamp Keeper'], signature: ['灯芯を抱え込む', 'Shelters the wick'], required: 'foot', grant: 'canoe',
  },
  {
    name: ['機工と学問の王国', 'Kingdom of Clockwork and Letters'], chapter: ['第2章 忘れられた知識', 'Chapter 2 · Forgotten knowledge'], place: [43, 16], climate: 'machine',
    sites: [town('歯車の城下町', 'Cogcourt'), sanctuary('王立図書館', 'Royal Library', 'mirror'), sanctuary('地下水路', 'Undercroft Canals', 'water'), sanctuary('回想時計塔', 'Recollection Clocktower', 'rotor'), dungeon('古代機械遺跡', 'First Engine Ruins', 'rock')],
    keeper: ['司書ヴェルク', 'Archivist Verk'],
    opening: ['蔵書の題名は残っているのに、目次だけが消えた。機械が「もう一度読む」を「消す」に取り違えている。', 'The library still has its titles, but the contents have vanished. The engine is mistaking “read again” for “erase.”'],
    aftermath: ['図書館の目次は市民が一行ずつ書き直す。帆船は君たちが使ってくれ。次の町にも本の便りを。', 'The citizens will rewrite the contents a line at a time. Take the sailing ship and carry word to the next town.'],
    rumor: ['書庫は鏡、時計塔は回転床、水路は水門が手がかり。どれも同じ本の別の版らしい。', 'Try the library mirrors, the clocktower turntables, and the canal sluice. Each seems to hold an edition of the same book.'],
    quest: ['王立図書館に残された写本を持ち帰る。', 'Recover the manuscript in the Royal Library.'],
    questDone: ['消えた目次を、だれでも読める場所に出した。', 'The missing contents are displayed where everyone can read them.'],
    book: ['二度読むための目次', 'Contents for a Second Reading'], core: ['時の核', 'Clock Core'], boss: ['目次蒐集機オルガ', 'Orga, Index Collector'], signature: ['空白行を呼び出す', 'Summons a blank line'], required: 'canoe', grant: 'ship',
  },
  {
    name: ['魔法と精霊の大陸', 'Continent of Spirits'], chapter: ['第3章 魔法と機械の王国', 'Chapter 3 · Magic and machines'], place: [76, 16], climate: 'crystal',
    sites: [town('プリズム魔法学園', 'Prism Academy'), wild('精霊の森', 'Spiritwood', 'rock'), sanctuary('水晶洞窟', 'Quartz Cavern', 'ice'), town('魔法都市ルクス', 'Lux the Spell City'), dungeon('属性試練の塔', 'Tower of Seven Colors', 'mirror')],
    keeper: ['学長ルエッタ', 'Rector Luetta'],
    opening: ['精霊の名を覚えた機械と、魔法を怖がる子がいる。どちらかを追い出す前に、塔の色が変わるわけを聞いてみて。', 'An engine has learned the spirits’ names, and a child is afraid of magic. Before anyone is sent away, find out why the tower changes color.'],
    aftermath: ['違う名前で呼んでも、同じ相手を見つけられる。あの子も機械も、やっと同じ教室に入れそうよ。', 'You can call someone by different names and still find the same person. The child and the engine may finally share a classroom.'],
    rumor: ['水晶の氷は壁で止まる。精霊の森では、邪魔に見える岩が扉の鍵だよ。', 'In the quartz caverns, ice stops at a wall. In Spiritwood, the boulder that seems in the way is the key.'],
    quest: ['精霊の森で、魔法と機械に共通する言葉を探す。', 'Find the word that magic and machines share in Spiritwood.'],
    questDone: ['機械がはじめて、精霊を命令でなく名前で呼んだ。', 'For the first time, the engine addresses a spirit by name instead of command.'],
    book: ['七つの色、ひとつの声', 'Seven Colors, One Voice'], core: ['彩の核', 'Prism Core'], boss: ['七彩の反照竜', 'Sevenfold Mirror Drake'], signature: ['鱗の色が変わる', 'Its scales shift hue'], required: 'ship', grant: 'submarine',
  },
  {
    name: ['大海原と群島', 'The Soundless Archipelago'], chapter: ['第4章 大海原の向こう側', 'Chapter 4 · Beyond the ocean'], place: [105, 27], climate: 'tide',
    sites: [town('凪待ちの港', 'Stillwatch Harbor'), sanctuary('海賊の隠れ家', 'Smugglers’ Refuge', 'pit'), sanctuary('沈没船ベルカ', 'Wreck of the Belka', 'water'), wild('外れの珊瑚島', 'Far Coral Island', 'warp'), dungeon('沈鐘の海底神殿', 'Sunken Bell Shrine', 'water')],
    keeper: ['船大工テト', 'Teto the Shipwright'],
    opening: ['沈んだ船に積まれていたのは宝じゃない。大事な人へ出しそびれた手紙だ。潮が引けば、夢の中でも届けられるかな。', 'The wreck carried no treasure. It carried letters never sent. When the tide goes out, could someone deliver them, even in a dream?'],
    aftermath: ['手紙は届く先がなくても、読んだ人の手元に残る。飛空艇なら、次の手紙は雲の上まで届けてくれるさ。', 'Even an undeliverable letter stays with its reader. The airship can carry the next one above the clouds.'],
    rumor: ['ベルカの水門を切り替えると、乾いていた部屋にも道ができる。海底神殿へは潜水艇で。', 'Turn the Belka’s sluice to open a way through a dry room. Use the submarine for the shrine.'],
    quest: ['沈没船に取り残された手紙の束を届ける。', 'Bring back the letters stranded in the wreck.'],
    questDone: ['港の掲示板には、宛て名と違う筆跡の返事が貼られた。', 'A reply in a different hand is pinned to the harbor board.'],
    book: ['潮待ちの手紙', 'Letters Waiting for Tide'], core: ['潮の核', 'Tide Core'], boss: ['深潮の双鐘', 'Twin Bells of the Deep'], signature: ['波の底で鐘を鳴らす', 'Rings beneath the waves'], required: 'submarine', grant: 'airship',
  },
  {
    name: ['天空世界', 'The Windborne Archives'], chapter: ['第5章 天空に眠る記憶', 'Chapter 5 · Memories above the clouds'], place: [77, 59], climate: 'sky',
    sites: [town('天空都市オルネ', 'Sky City Orne'), wild('渡り雲の浮遊島', 'Migrant-Cloud Isles', 'ice'), sanctuary('空中庭園', 'Hanging Garden', 'rotor'), sanctuary('飛空艇の発着場', 'Cloud Aerodrome', 'lever'), dungeon('雲海の遺跡', 'Ruins of the Cloudsea', 'warp')],
    keeper: ['庭師のエダ', 'Eda the Skypotter'],
    opening: ['下にいたときは、雲が何を隠すかばかり考えた。上に来ると、雲に何を預けていたかの方が気になってね。', 'Below, I wondered what clouds hid. Up here, I wonder what we entrusted to them.'],
    aftermath: ['風向きを教える子が、昨日の風を覚えている。今の風ばかり読んでいた私には、なかなかまねできないよ。', 'The child reading the wind remembers yesterday’s breeze. I’ve watched only today’s wind for so long that I can hardly imitate them.'],
    rumor: ['庭園の回転床は上から入ると迷いやすい。発着場の制御盤は上空から来たときに調べてごらん。', 'The garden’s turntable can be disorienting from the north. Try inspecting the aerodrome panel from the sky.'],
    quest: ['浮遊島の渡り鳥を記した、庭師の観察記録を探す。', 'Find the gardener’s record of migrating skybirds.'],
    questDone: ['庭師は次の春のために、観察記録の写しを三冊に増やした。', 'The gardener makes three copies of the record for next spring.'],
    book: ['渡り雲を植える', 'Planting Migrant Clouds'], core: ['風の核', 'Wind Core'], boss: ['雲弦の災翼', 'Cloudstring Roc'], signature: ['弦を張りつめる', 'Draws the cloudstrings taut'], required: 'airship', grant: 'skyship',
  },
  {
    name: ['失われた世界', 'The Lost World'], chapter: ['第6章 世界の真実', 'Chapter 6 · Truth of the world'], place: [39, 58], climate: 'ruin',
    sites: [town('余白の廃都', 'The Marginal City'), sanctuary('時空の迷宮', 'Labyrinth of Intervals', 'warp'), sanctuary('記憶の回廊', 'Gallery of Memory', 'mirror'), sanctuary('世界の中枢', 'The Meridian', 'rock'), dungeon('白紙の書庫', 'The Unwritten Archive', 'rotor')],
    keeper: ['記録番イタ', 'Ita of the Record'],
    opening: ['忘れたくても忘れられない人を助けるために、核をつくった。いつのまにか私たちは、何を忘れてよいかまで機械に決めさせた。', 'We built the cores for people who wished they could forget. In time, we let them decide what was allowed to be forgotten at all.'],
    aftermath: ['これで忘れることも、思い出すことも、私たちのものだ。余白に何を書くかは、次の旅人に任せよう。', 'Forgetting and remembering are ours again. What to write in the margin belongs to the next traveler.'],
    rumor: ['中枢で岩を運ぶ順に気をつけて。白紙の書庫は、これまでの仕掛けをひとつずつ思い出させる。', 'Mind the order of the stones in the Meridian. The archive will make you remember each kind of puzzle in turn.'],
    quest: ['迷宮に落ちた、核が生まれた日の手記を探す。', 'Recover the journal from the day the cores were created.'],
    questDone: ['記録番は手記の最後に、ひとりで判断しないこと、と書いた。', 'Ita writes one last thing in the journal: decide together.'],
    book: ['白紙に書かなかったこと', 'What We Left Unwritten'], core: ['未来の核', 'Future Core'], boss: ['忘却機関ノン・リーブル', 'Null Librum, Engine of Oblivion'], signature: ['余白をすべて塗りつぶす', 'Blots out the margins'], required: 'skyship',
  },
  {
    name: ['しおりの外海', 'The Unbound Sea'], chapter: ['クリア後 未知なる世界の探究', 'Afterstory · Uncharted worlds'], place: [108, 67], climate: 'night',
    sites: [town('しおりの隠れ里', 'Bookmark Haven'), wild('星砂の岬', 'Star-Sand Cape', 'rock'), sanctuary('失伝の祠', 'Shrine of Lost Arts', 'ice'), sanctuary('観測窓の離宮', 'Palace of the Last Window', 'mirror'), dungeon('忘却の裏庭', 'The Oblivion Garden', 'warp')],
    keeper: ['旅人のミオ', 'Mio the Wayfarer'],
    opening: ['余白から来た旅人をずっと待っていた。遠い世界より、近いのに地図にない場所のほうが、意外に広いよ。', 'I’ve been waiting for someone from the margins. A nearby place left off the map can be bigger than a distant world.'],
    aftermath: ['さあ、地図を折り直そう。前と同じ道でも、連れが違えば見つけるものも違うから。', 'Fold the map anew. Even along the same road, new companions will find different things.'],
    rumor: ['庭園の王を破ったら、里で記憶の試練に挑める。かつての番人たちが順番に相手をする。', 'Defeat the garden’s ruler, then come here for the Trial of Memory. The old guardians will face you in turn.'],
    quest: ['星砂の岬で、初代の旅人のしおりを探す。', 'Find the first traveler’s bookmark at Star-Sand Cape.'],
    questDone: ['最後だと思ったしおりには、まだ続きがあった。', 'The bookmark you thought would be the last still has more to show.'],
    book: ['しおりの向こう側', 'Beyond the Bookmark'], core: ['余白の核', 'Margin Core'], boss: ['頁裏の星喰い', 'Star-Eater of the Underside'], signature: ['星の灯りをひとつずつ消す', 'Snuffs the stars one by one'], required: 'skyship',
  },
];

export const VEHICLES: Record<Vehicle, Copy> = {
  foot: ['徒歩', 'On foot'], canoe: ['小型船', 'Skiff'], ship: ['大型帆船', 'Sailing ship'], submarine: ['潜水艇', 'Submarine'],
  airship: ['飛空艇', 'Airship'], skyship: ['高性能飛空艇', 'Skyship'],
};
export const SERVICES: Record<Service, Copy> = {
  inn: ['宿屋', 'Inn'], armory: ['武器・防具屋', 'Armory'], forge: ['カード強化工房', 'Card forge'], cards: ['カードショップ', 'Card shop'],
  items: ['道具屋', 'General store'], library: ['図書館', 'Library'], guild: ['ジョブギルド', 'Job guild'], tavern: ['食堂', 'Tavern'],
  notice: ['依頼掲示板', 'Quest board'], home: ['民家', 'Residence'],
};
export const FEATURES: Record<Feature, Copy> = {
  lever: ['扉を開くレバー', 'Gate lever'], water: ['水位を切り替える水門', 'Water-level sluice'], ice: ['床を凍らせる空調', 'Freezing vent'],
  mirror: ['光を反射する鏡', 'Light mirror'], rotor: ['回転床の切り替え盤', 'Turntable switch'], warp: ['対になる転移陣', 'Paired warp sigils'],
  rock: ['押せる重し', 'Movable counterweight'], pit: ['落とし穴の安全装置', 'Trapdoor safety latch'],
};

export const CORE_CHAMBERS: readonly (readonly [Copy,Copy,Copy])[] = [
  [
    ['壁の向こうから鐘が聞こえる。ひとつ鳴るごとに、床に刻まれた足あとがひとつ消える。','A bell sounds behind the wall. Each time it rings, one footprint disappears from the stone floor.'],
    ['あしあとがなくても、ここまで来た順番は覚えてる。帰りは私たちが道しるべになればいい。','Even with no footprints, we remember our way here. On the way back, we can show others the way.'],
    ['そうだな。先頭と最後尾だけで確かめるんじゃなく、間にいる人にも道順を伝えよう。','Then let’s share the route with everyone in between, as well as whoever leads and brings up the rear.'],
  ],
  [
    ['歯車の刻印には「二度目」と書いてある。方向を変えるたび、巻き取った頁が違う棚へ移る。','The cog is marked “second reading.” Every reversal sends a page to a different shelf.'],
    ['町の人が前の目次に書いた順番と、今の順番を重ねてみよう。消去されたページも、機械の中にはある。','Overlay the old contents with the current order. The missing pages may still be inside the machine.'],
    ['なら、機械を止めるだけじゃ駄目だね。戻った頁を、読みたい人が探せるようにしよう。','Stopping it won’t be enough. We should arrange the recovered pages so readers can find them.'],
  ],
  [
    ['色の違う光が同じ水晶からこぼれている。塔は、一つの名前だけを残そうとしているようだ。','Different colors spill from the same crystal. The tower seems determined to keep only one name.'],
    ['呼び方が違うだけで間違いになるなら、私たちも最初の村で会えなかったね。','If different names counted as wrong, we never would have found one another in the first village.'],
    ['鏡を回して、光が分かれるところを見に行こう。きれいに一色にするのは、そのあと考えればいい。','Turn the mirror and see where the light splits. We can worry about unifying the colors afterward.'],
  ],
  [
    ['海底の壁を、手紙が魚のように流れていく。きれいな便箋にも、書き損じた紙にも、同じ宛て名がある。','Letters drift along the seabed wall like fish. Fine stationery and scraps with crossed-out words bear the same name.'],
    ['最初に書いた一通も持ち帰りたい。言い直す前に何を伝えたかったか、残っているから。','I want to bring back the first letter too. It tells us what mattered before they found better words.'],
    ['じゃあ、帰りの船では乾いたくぼみを作っておこう。全員分、入るようにね。','Then make some dry space aboard the boat for the return. Enough for everyone’s letters.'],
  ],
  [
    ['浮島の柱に、昨日の空の影が貼りついている。空を渡る鳥の群れだけが、その影の外へ飛んでいく。','Yesterday’s sky clings to the floating columns. Only the migrating birds fly out beyond its shadow.'],
    ['昨日の風を覚えるのは、今日も同じにできるからじゃないんだ。違いを読めるようにするためだね。','Remembering yesterday’s wind won’t make today the same. It helps us read what changed.'],
    ['新しい予報を書くなら、庭師だけじゃなく、空を渡ってきた人にも話を聞こう。私たちだって、その一人だ。','If they write a new forecast, let’s ask the people who crossed the sky as well as the gardener. We’re among them now.'],
  ],
  [
    ['白紙の書庫に点検票が吊られている。「持ち主は、直してほしいと頼んだか」。その欄だけ、鉛筆で消してある。','An inspection sheet hangs in the unwritten archive. Only one question has been erased: “Did its owner ask for this to be fixed?”'],
    ['あの機械は、誰かの悲しみを減らすために作られたんだね。だからこそ、頼んでいない人まで決められちゃいけない。','It was built to ease someone’s grief. That’s precisely why it shouldn’t decide for people who never asked.'],
    ['六つの核をここでつなごう。最後の頁は自分で書いてもらう。私たちの役目は、その場所を開けることだ。','Join the six cores here. The last page is theirs to write. Our part is opening a place for them to do it.'],
  ],
  [
    ['最後に折った地図の裏を、古い筆跡が走っている。別の旅人も、ここを世界の端と呼んでいた。','Old handwriting crosses the back of the folded chart. A traveler before you called this the edge of the world, too.'],
    ['同じところまで来たのに、地図は違う。あの人が寄った場所を、探してみようか。','They came just as far, but their map is different. Shall we look for the places they stopped?'],
    ['目印を一つ残しておこう。次に来る人も、私たちの地図と見比べられるように。','Leave a marker here so whoever arrives next can compare their chart with ours.'],
  ],
];
