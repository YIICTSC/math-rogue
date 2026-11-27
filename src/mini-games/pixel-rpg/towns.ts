import type { Copy, Service } from './campaign';

export const TOWN_SHOPS = ['inn','armory','cards','items','library','guild','forge','tavern','notice','home'] as const satisfies readonly Service[];
export type TownNpc = { name: Copy; line: Copy; portrait?: string };
type Town = { keeperPortrait: string; keeper?: TownNpc; square: TownNpc; rooms: Record<Service,TownNpc> };

function npc(ja: string, en: string, line: string, english: string, portrait?: string): TownNpc {
  return { name: [ja,en], line: [line,english], portrait: portrait && `chronicle-${portrait}` };
}

const towns: Record<string,Town> = {
  '0:0': {
    keeperPortrait:'chronicle-story',
    square:npc('水やりのソヨ','Soyo the Waterer','迷子の子が草原で道しるべを見つけたよ。夕方までに戻れたら、二人で村の花に水をやる約束なんだ。','A lost child found a marker in the meadow. If they make it back before dusk, we promised to water the village flowers together.','verdant'),
    rooms:{
      inn:npc('宿屋のコムギ','Komugi the Innkeeper','焼きたての丸パンは窓辺に置くよ。匂いをたどれば、初めてのお客でも食堂に着けるからね。','I leave the fresh rolls by the window. Even a first-time guest can follow the smell to breakfast.'),
      armory:npc('仕立屋のフネ','Fune the Outfitter','木の盾には傷の数だけ持ち主がいる。いちばん古い傷は、ノノさんが転んだ跡なんだ。','The old wooden shield has had as many owners as scars. Nono left the oldest mark by tripping.'),
      cards:npc('札売りのマト','Mato the Card Seller','一歩目の札は、旅に出そびれた人から買ったんだ。今度は使ってもらえるといいな。','I bought First Step from someone who never set out. It would be nice if someone got to use it this time.','cards'),
      items:npc('籠売りツヅラ','Tsuzura the Basket Seller','薬草の包みは紐が二重。暗い洞窟でも、手探りで見分けられるようにしたよ。','Ration bundles have one knot and herbs have two, so you can tell them apart in the dark.'),
      library:npc('読書係のシオリ','Shiori the Reader','帰り道を覚える本には、道順よりも目印がたくさん書いてあるよ。根っこが机みたいな木、見つけられるかな。','Finding Your Way Home is full of landmarks. Can you find the tree with roots shaped like a desk?'),
      guild:npc('教え手サク','Saku the Instructor','初めての稽古は、相手の靴を見るところから。剣の先より、次の一歩がよく見える。','For your first lesson, watch your partner’s shoes. They tell you more about the next step than the point of a sword.'),
      forge:npc('綴じ師イト','Ito the Binder','札を重ねたら、先にやりたい方を表に。糸は結び直せても、使う順番は戦いで覚えるしかないよ。','Stack the card you want to act first on top. Thread can be retied, but timing comes with practice.'),
      tavern:npc('鍋番トワ','Towa the Cook','豆の煮込みはおかわり自由。最初の一杯は、旅で何を見つけたか聞かせてくれた人から。','Bean stew comes with seconds. First bowls go to those with a discovery to share.'),
      notice:npc('木札係のクイ','Kui the Signpost Keeper','草原から戻った人は、木札の矢印を裏返しておくれ。まだ帰っていない人の数がわかるんだ。','Turn your marker over when you return from the meadow. This is how we know how many travelers are still out.'),
      home:npc('根っこの家のミツ','Mitsu of the Root House','戸棚の取っ手は木の根っこ。子どもの頃に隠した貝殻が、まだ奥にある気がする。','The drawer pull is a tree root. I think the shell I hid as a child is still in there.'),
    },
  },
  '1:0': {
    keeperPortrait:'chronicle-archive',
    square:npc('歯車の検品師マルク','Mark the Cog Inspector','噴水の時計だけは一分遅らせてある。水路の向こうの子が、門限に間に合うようにね。','Only the fountain clock runs a minute late, so the children across the canal can make curfew.','clockwork'),
    rooms:{
      inn:npc('時鐘宿のソネット','Sonnet of the Clock Inn','部屋の目覚ましは全部違う音。昨日、音で部屋に戻れた旅人がいたから残してあるの。','Each room has a different alarm. Yesterday a traveler found their room by its sound, so the bells are staying.'),
      armory:npc('鎧師ブラフ','Bruf the Armorer','古い兜の留め金には左右の印を彫る。急いで直すと、前後を間違えたまま出荷するからな。','I engrave left and right on old helmet clasps. Repair them in a hurry and you can ship one backwards.'),
      cards:npc('札刷りのパル','Pal the Card Printer','版を変えると札の色も変わる。余った朱色で、機械の停止ボタンにも印を付けたよ。','Change the printing plate and you change the ink. I used the leftover red to mark the engine’s stop button.'),
      items:npc('部品商のネジカ','Nejika the Parts Dealer','棚の引き出しは重い順。細かいねじほど奥にしまう。水路の振動で飛び出すと探すのが大変でね。','Drawers go heavy to light, with the smallest screws farthest back. The canal vibrations shake them loose otherwise.'),
      library:npc('目次係レミル','Remil the Indexer','題名だけ残る本は、目次を色鉛筆で直している。私の青は、もう一度読んでほしい頁の印。','We pencil in lost contents by color. Blue marks a page I want someone to read twice.'),
      guild:npc('時計塔の師匠デン','Den of the Clocktower','回転台では行きたい方を覚えておくんだ。床の向きと自分の向きは、いつの間にか違ってくる。','Remember where you want to go on a turntable. The floor’s direction and yours soon disagree.'),
      forge:npc('調律師メルタ','Melta the Tuner','強い札を試す前に、鈍った道具で一度たたく。高く響いたら、金床のほうが修理どきだ。','Before testing a strong card, tap the anvil with a dull tool. A high ring means the anvil itself needs fixing.','foundry'),
      tavern:npc('食堂のポット','Pott the Meal Keeper','歯車の焼き菓子は、溝に蜂蜜を流すと割れにくい。工場の人には黙っていてね。','Pour honey into the grooves and our cog biscuits stop breaking. Keep that between us and the factory hands.'),
      notice:npc('水路便のコール','Kohl the Canal Courier','鐘が二度鳴ったら水門が開く。掲示板の紙は濡れる前に、下の留め具へ移しておいてくれ。','Two bells open the sluice. Move the notices to the lower clips before they get wet.'),
      home:npc('置時計の家のエル','Ell of the Clock House','止まった時計を直しても、あの日とは違う音がする。今の家の音だと思うことにしたよ。','The clock sounds different now that I fixed it. I think of it as the sound of our home today.'),
    },
  },
  '2:0': {
    keeperPortrait:'chronicle-constellation',
    square:npc('見習いのピリカ','Apprentice Pirika','あの精霊は「紫」と呼ばれると隠れるの。「すみれ」と呼ぶと、教室の後ろまでついてくるよ。','That spirit hides when you say purple. Call it violet and it follows you to the back of class.','puzzle'),
    rooms:{
      inn:npc('寮監マーナ','Marna the Dorm Keeper','寝る前の点呼では、精霊の分も空席を数えるの。窓に影があれば、まだ帰ってきていない合図よ。','At bedtime roll call, we count empty seats for spirits too. A shadow at a window means one is still out.'),
      armory:npc('制服係ディア','Dea the Uniform Keeper','授業用の盾は光を通すけれど熱は止める。前で構えると、後ろの子も観察を続けられるの。','Our training shields let light through and stop heat. Pupils in back can keep watching while one pupil guards.'),
      cards:npc('札の実習係ミネット','Minette the Card Tutor','精霊の札は色を見て覚えると困るよ。氷の明かりと雷の明かり、曇りの日はそっくりだから。','Don’t memorize spirit cards by color alone. Ice light and lightning look alike on an overcast day.'),
      items:npc('薬棚番のティコ','Tico the Supply Keeper','眠気覚ましは午後の棚。午前に使うと、夜の天体観測まで寝られなくなっちゃう。','The wakefulness tonic goes on the afternoon shelf. Take it in the morning and you won’t sleep before the night observations.'),
      library:npc('呼び名集めのベルン','Bern the Name Collector','精霊の辞書は一つの名前に何頁も割く。どの呼び方で振り向くか、土地で違うからね。','The spirit dictionary gives each name several pages. Which word makes a spirit turn around depends where you are.'),
      guild:npc('教師オーフ','Instructor Oph','武闘家にも魔法陣を読ませるよ。足を置く場所がわかるなら、それも大事な武の学びだ。','Even our martial artists read sigils. Knowing where to place your feet is part of their craft.'),
      forge:npc('光学室のリト','Rito of the Optics Room','鏡は合わせてみてから磨くんだ。まだ道が決まっていない光に、型を押しつけたくない。','Align the mirrors before polishing them. I don’t like forcing light down a path before it has found one.'),
      tavern:npc('給仕フルル','Fleur the Cafeteria Host','今日のプリンは三色。味は同じだけど、精霊たちはそれぞれ別の名前をつけているよ。','Today’s pudding comes in three colors. They taste the same, but the spirits have given them different names.'),
      notice:npc('当番ウルカ','Urka on Notice Duty','明日の塔の実習、鏡の向きを最初に記録。帰る時に元の角度へ戻すのを忘れずに。','Before tomorrow’s tower exercise, write down the mirror angles. Put them back before leaving.'),
      home:npc('窓辺のラシェ','Rache by the Window','この家の精霊は、私が本を逆さに開くと笑う。だから疲れた日はわざと逆さに読むの。','Our house spirit laughs when I open a book upside down. I do it on purpose when I’m tired.'),
    },
  },
  '2:3': {
    keeperPortrait:'chronicle-mirror',
    keeper:npc('街灯師イネット','Inette the Lamplighter','学園が精霊の名前を授業で教えるなら、ルクスはその名前で灯りを呼ぶ街。橋の灯だけは、まだ名前を忘れたままなの。','The academy teaches spirit names. Here in Lux we speak those names to light the streets. Only the bridge light has forgotten its own.'),
    square:npc('硝子吹きのニレ','Nire the Glassblower','噴水が夜だけ七色になるのは、空の欠片を一枚ずつ沈めたから。最後は誰でも知っている色を入れたいな。','The fountain turns seven colors at night. I sank a piece of sky for each color. I want the last one to be a color everyone knows.'),
    rooms:{
      inn:npc('灯り宿のリュネ','Lune of the Lantern Inn','部屋を暗くするには、枕元の灯りにおやすみと言ってごらん。命令には、ちょっと機嫌を損ねるから。','Say good night to the bedside lamp to dim it. It gets a little grumpy about orders.'),
      armory:npc('細工師オパル','Opal the Engraver','街灯で試すと、本物の銀は影が少し青い。安物には、影を染めるところまではできないね。','Try it under a streetlamp. True silver casts a slightly blue shadow. Cheap silver can’t quite manage that.'),
      cards:npc('透かし札のゼフィ','Zephy the Watermark Artist','街の札は窓にかざすと裏にも絵が出るよ。外に向けるか内に向けるかで物語が変わるんだ。','Hold a Lux card to a window and a picture appears on the back. Which way you face it changes the story.'),
      items:npc('照明商のアマル','Amal the Lamp Merchant','橋には小さな灯りを持って行くといい。橋の精霊が、道を思い出す手がかりにするんだ。','Carry a small light onto the bridge. It gives the bridge spirit a clue to remember the way.'),
      library:npc('光譜係フィオル','Fior the Light Archivist','古い星図の空欄には、ガラス屋の名が入るんだ。星を読むのも、望遠鏡を作るのも、同じくらい大事だから。','The gaps on the old star chart are for glassworkers’ names. Making telescopes matters as much as reading the stars.'),
      guild:npc('職人長マティス','Guildmaster Matis','職替えの最初の仕事は、前の職人に道具の使い方を聞くこと。手順ごと残せば次の子が困らない。','Your first task in a new trade is to ask the last worker about their tools. Leave the method for the next pupil.'),
      forge:npc('彩箔職人ノーヴ','Nove the Foilworker','薄い箔なら、元の札の名前まで消さずに重ねられる。誰が先に作ったか、ちゃんと残しておきたいから。','A thin foil keeps the original name readable under the new layer. I want to remember who made it first.'),
      tavern:npc('星灯亭のクレム','Crem of the Starlit Table','同じスープでも窓際で飲むと甘く感じる。夕暮れの色で舌がだまされるんだってさ。','The same soup tastes sweeter by the window. I hear the evening colors play a trick on your tongue.'),
      notice:npc('灯柱係パスカ','Paska the Lamppost Keeper','赤い目印は灯りの点検、青い目印は水路の掃除。両方ある日は橋を先に渡ってね。','A red mark means lamp repairs and blue means canal cleaning. If you see both, cross the bridge early.'),
      home:npc('橋畔のネネア','Nenea by the Bridge','子どもの頃は橋が怖くて、灯りの数を数えて歩いたの。今も九つまで数えると、向こう岸に着くわ。','As a child I counted lamps to cross the bridge without fear. Even now, nine lights get me to the other bank.'),
    },
  },
  '3:0': {
    keeperPortrait:'chronicle-tidal',
    square:npc('瓶拾いのラル','Rall the Bottle Finder','宛て名が同じ瓶でも、届いた日を消さないで。書き直した手紙の間に、何年も空くことがあるから。','Keep the arrival date even when two bottles have the same addressee. Years can pass before a letter is rewritten.','rescue'),
    rooms:{
      inn:npc('潮待ち宿のバナ','Bana of the Tide Inn','窓は少し開けて眠るといい。潮が返る音で、朝の便に乗り遅れずにすむよ。','Sleep with the window cracked. The turning tide should wake you in time for the morning ferry.'),
      armory:npc('船具屋のオルン','Orn the Ship Fitter','海の装備には浮く目印を付ける。強い剣でも、落とした時に見つからなければ役に立たない。','Tie a float to gear you take to sea. A fine sword is little use if you can’t find it after dropping it.'),
      cards:npc('船札のレッカ','Rekka the Deck Dealer','船員の札だけ角を丸くした。甲板で滑っても、隙間に刺さって転ばないようにね。','I round the corners on sailors’ cards. If one slides across the deck, it won’t jam between the boards.'),
      items:npc('帆布屋ウキ','Uki the Canvas Seller','手紙袋に空気を入れたまま縛れば浮くよ。水に濡らせないものを先にしまいな。','A letter bag floats if tied with air inside. Put anything that must stay dry in first.'),
      library:npc('宛て名係テーラ','Tera of the Addresses','海流図に沿って郵便を並べている。住所を忘れた人でも、流れなら覚えていることがあるから。','We sort mail by currents. Someone who has forgotten their address may still remember the current near home.'),
      guild:npc('浜の教官グン','Gunn the Shore Instructor','弓は風下で引いてごらん。揺れる船では、狙った所よりも足を動かしたくなる瞬間が大事だ。','Draw the bow downwind. On a boat, the moment you want to shift your feet matters as much as where you aim.'),
      forge:npc('いかり職人カポ','Kapo the Anchor Smith','海風に強い留め具は、引っ張るより先にねじってみる。札の継ぎ目にも、同じ弱い方向があるんだ。','Twist a sea-worthy fastener before you pull it. A joined card has a weak direction too.'),
      tavern:npc('潮鍋のサナ','Sana of the Tide Pot','行きの船の人には薄いスープ、帰りの人には濃いスープ。港について息をつけば、塩の味が違うのよ。','Light broth before a voyage, rich broth after. Salt tastes different once you can breathe easy on shore.'),
      notice:npc('潮汐係のパール','Pearl the Tide Clerk','潜るなら沈鐘の時刻を書いていって。風が変わっても、迎えの船を出せるように。','If you dive, leave the time you expect to reach the bell. We can send a boat even if the wind changes.'),
      home:npc('舟窓のアーニ','Arni of the Porthole House','家の窓を丸くしたら、帰ったことに気づかず家族が船酔いしたよ。今は壁に陸の絵を描いている。','Round windows made my family forget they were home and feel seasick. Now I’ve painted dry land on the wall.'),
    },
  },
  '4:0': {
    keeperPortrait:'chronicle-storm',
    square:npc('風観測のレータ','Reta the Windwatcher','午後の鳥が南へ回ったら、夜に雲が下りてくる。古い予報には鳥の行き先まで書いていなかったの。','If the afternoon birds turn south, cloud will come down tonight. The old forecast never recorded where the birds went.'),
    rooms:{
      inn:npc('浮床宿のコハク','Kohaku of the Floating Inn','揺れたら寝台の枠を押さえて。床の揺れが止まったあと、枕の鈴が一度だけ鳴れば晴れの合図。','Hold the bed frame when the floor rocks. One ring from the pillow bell after it stops means clear weather.'),
      armory:npc('翼留めのブラーナ','Brana the Harness Maker','腰紐は服の上から締めるんだ。見栄で内側に隠すと、着地で金具が外れても気づかない。','Wear the harness outside your coat. Hide it for looks and you may miss a loose buckle when you land.'),
      cards:npc('雲札問屋シェード','Shade the Cloud Card Dealer','札は風を受ける面を下に向けて出すといい。勝敗は風任せでいいが、手札まで飛ばすなよ。','Lay a card windward side down. Let the wind decide who wins if you like, but keep hold of your hand.'),
      items:npc('気圧売りのポポル','Popol the Pressure Merchant','空瓶の栓を抜くと、買った高さの音がするよ。地上に持ち帰ると驚く人が多い。','Open an empty bottle and it sounds like the altitude you bought it at. People down below are often surprised.'),
      library:npc('観測誌のイーノ','Ino of the Weather Logs','去年の同じ日の雲を探したら、まずその日の風も読んでね。似た空でも、進む方は違うから。','If you look up clouds on this date last year, read the winds too. Similar skies can be headed different ways.'),
      guild:npc('飛翔教官ハレク','Harek the Flight Instructor','飛空艇の稽古は降りる場所を決めるところから。飛べる人より、戻る場所を選べる人が頼られる。','Flight practice starts by picking where to land. A good landing place matters even more than keeping aloft.'),
      forge:npc('翼板工のデロ','Dero the Wingwright','翼板の傷に細い線を引く。広がっていない傷は模様のまま残して、その板の旅を覚えておく。','I draw a fine line beside each wing scar. A scar that isn’t spreading can stay as a record of its travels.'),
      tavern:npc('空皿亭のソフ','Sof of the Sky Plate','湯気が横に逃げる日は、窓辺の席から順に配るよ。いちばん早く冷める席だからね。','When the steam blows sideways, I serve the window seats first. Those bowls cool fastest.'),
      notice:npc('発着係のラーネ','Rane the Dock Steward','発着表を書き直した。昨日の空の影を避ける便は、北の足場から出るよ。','I’ve updated departures. Ships avoiding yesterday’s shadow leave from the northern platform.'),
      home:npc('雲綿の家のベリル','Beryl of the Cloud House','雲綿を干すと、屋根より上までふくらむの。小さい頃は、それで隣の島まで行けると思っていた。','Cloud cotton puffs higher than the roof when it dries. As a child, I thought it could carry me to the next island.'),
    },
  },
  '5:0': {
    keeperPortrait:'chronicle-void',
    square:npc('頁を運ぶタネ','Tane the Page Runner','人の思い出を運ぶときは、宛て名が読めても開かないようにしている。返ってくるまで、誰の話でもないから。','I never open the memories I carry, even when I can read the name. The story belongs to the person who gets it back.'),
    rooms:{
      inn:npc('余白宿のリオット','Riot of the Margin Inn','眠れないなら、戸口の紙に明日したいことを一つだけ。昨日のことは、無理に思い出さなくていい。','If you can’t sleep, write one thing you want to do tomorrow on the door paper. There’s no need to force yesterday back.'),
      armory:npc('修繕師ルーク','Rook the Repairer','傷のない新品より、この鎧を直して着たい人が多い。誰かを守ったへこみは、消す必要がないってさ。','Most people want this armor repaired instead of a new one. They say a dent earned protecting someone can stay.'),
      cards:npc('旧札のエニス','Ennis the Old Card Dealer','札の名前がかすれていたら、使い手に聞いて書き足す。私の名前で勝手に埋めることはしないよ。','When a card name fades, I ask its owner and write it back. I don’t fill it in with a name of my own.'),
      items:npc('栞紐商のミモ','Mimo the Bookmark Seller','記憶を閉じる本には紐を一本、返す本には二本。手がかりを持ったまま行き先を間違えないように。','One string closes a memory book and two mark a return. That way we don’t carry a clue to the wrong place.'),
      library:npc('写本係ヴァン','Vann the Copyist','何も書かれていない点検票も保存している。どの問いに答えなかったか、それ自体が記録なんだ。','We keep blank inspection forms too. Which questions went unanswered is part of the record.','chronicle'),
      guild:npc('無銘道場のヨナ','Yona of the Nameless Hall','師匠の名を忘れても、教わった型は残った。今日は君の名前を、稽古帳に自分で書いておくれ。','I forgot my teacher’s name but kept the form. Write your own name in today’s practice book.'),
      forge:npc('継ぎ目職人ボロ','Boro the Joiner','ここでは接ぎ目をひとつ見せておく。直したことを思い出せるように、小さな金の目印を打つよ。','Here we leave one join visible. A little gold mark helps the owner remember what was mended.'),
      tavern:npc('再開亭のメリ','Meri of the Reopened Table','献立を思い出せないお客とは、一緒に作り直すよ。今日は塩を最後に入れた煮込みだ。','When a guest forgets a dish, we make it together from scratch. Today we added the salt last.'),
      notice:npc('壁新聞のクォル','Quol of the Wall Paper','紙がはがれた跡をなぞると、前の文章の長さがわかる。新しい告知の余白にも、その幅を残している。','Trace an old notice’s outline and you can tell how long it was. I leave that space in the margins of the new notices.'),
      home:npc('住み直しのメナ','Mena of the Rebuilt House','この家は入口を少しずらして直したの。前と違う家でも、同じ場所でおかえりと言っていいと思う。','I moved the entrance a little when I rebuilt. A different house can still say welcome home in the same place.'),
    },
  },
  '6:0': {
    keeperPortrait:'chronicle-infinite',
    square:npc('岬帰りのリーファ','Rifa from the Cape','岬で見つけた星砂を一袋だけ持って帰ったよ。残りは、初めて来る人にも見つけてほしいから。','I brought one bag of star sand home from the cape. I left the rest for first-time visitors to discover.'),
    rooms:{
      inn:npc('しおり宿のオユ','Oyu of the Bookmark Inn','ここでは部屋の札が、前の旅で使ったしおりなんだ。知っている形なら同じ部屋を選んでごらん。','Room tags are bookmarks from earlier journeys. If you recognize one, take the same room.'),
      armory:npc('貸し装備のゼン','Zen of the Loan Armor','使い古した装備は次の旅人に貸すよ。持ち主が変わるたび、紐の結び方が少しずつ変わる。','We lend old gear to the next traveler. Every new owner ties the straps a little differently.'),
      cards:npc('再旅札のユル','Yuru of the Return Deck','同じ手札でも、旅の順番を変えると違う使い方が見つかる。初めの一枚を替えてから出てみない？','Even with the same hand, a different route teaches you new uses. Try swapping your first card before you go.'),
      items:npc('荷造り屋ピン','Pin the Packer','行きに必要な物を半分、誰かに渡したい物を半分。空いたところには帰りの土産が入るよ。','Pack half for the road and half to give away. The space you free up is for what you bring home.'),
      library:npc('余談集めレニ','Reni the Anecdote Keeper','攻略を書いた巻の横に、道草だけを書いた巻を置いている。よく借りられるのは道草のほうだよ。','Beside the guides, I shelve a volume of detours. The detours get borrowed more often.'),
      guild:npc('旅稽古のイサラ','Isara the Journey Mentor','覚えた技を次の旅に持って行くなら、一つだけ説明できるようにしておいで。連れが困る時、言葉でも助けられる。','If you bring an old skill on a new journey, learn to explain one clearly. Then you can help a companion with words too.'),
      forge:npc('栞細工のマヤ','Maya the Bookmark Smith','最初に勝った時の札は、合成しても見分けられるように裏へ小さな刻印を残してあげる。','I can stamp the card from your first victory so you’ll still recognize it after fusing it.'),
      tavern:npc('旅話亭のノアン','Noan of the Story Table','一番遠くへ行った話より、帰る途中で寄った店の話が聞きたい。次の休日に行けるかもしれないから。','Tell me about a shop you stopped at on the way home. That’s a place I might visit on my next day off.'),
      notice:npc('余生帖のセラド','Cerad the Notice Keeper','番人の試練を終えたら、戦いの記録の横に今日の目標も書いてくれ。それが次の人の道しるべになる。','After the trial, write what you meant to accomplish beside the battle record. That may guide the next traveler.'),
      home:npc('古地図の家のミリナ','Mirina of the Old Charts','皆が持ち帰った地図は、少しずつ岸の形が違うの。私は重ねずに、壁に並べて眺めることにした。','Everyone brings home a slightly different shoreline. I hang the charts side by side instead of making them agree.'),
    },
  },
};

export const townProfile = (region:number,site:number) => towns[`${region}:${site}`];
