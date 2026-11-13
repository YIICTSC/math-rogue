"""Authored variety questions. Emit Japanese/English/hiragana from these source rows."""
import json
from pathlib import Path
from pykakasi import kakasi
kana=kakasi()
def hi(s):return ''.join(x['hira'] for x in kana.convert(s))
def row(category,ja,en,choices,english,correct=0,opinion=False):
 a=choices.split('|') if choices else [];b=english.split('|') if english else []
 return dict(category=category,prompt=[ja,en,hi(ja)],answer=['','',''] if opinion else [a[correct],b[correct],hi(a[correct])],aliases=[],options=[a,b,list(map(hi,a))],difficulty='NORMAL')
facts=[];social=[];draw=[];nearest=[]
def f(c,ja,en,a,b):facts.append(row(c,ja,en,a,b))
def o(c,ja,en,a,b):social.append(row(c,ja,en,a,b,opinion=True))
# Every factual question has one defensible answer and three related distractors.
f('ANIMALS','タコの心臓はいくつある？','How many hearts does an octopus have?','3つ|1つ|2つ|4つ','Three|One|Two|Four')
f('ANIMALS','コアラが主に食べる植物は？','What plant makes up most of a koala’s diet?','ユーカリ|アカシア|バオバブ|竹','Eucalyptus|Acacia|Baobab|Bamboo')
f('ANIMALS','野生のペンギンが自然分布しない場所は？','Where do wild penguins not naturally live?','北極圏|南極大陸|南アフリカ|ガラパゴス諸島','The Arctic|Antarctica|South Africa|The Galápagos')
f('ANIMALS','カモノハシの繁殖方法は？','How do platypuses reproduce?','卵を産む|胎内で子を育てて産む|体が分かれる|芽から増える','Laying eggs|Giving live birth|Splitting in two|Budding')
f('ANIMALS','シロナガスクジラの食べ物の中心は？','What is the main food of blue whales?','オキアミ|マグロ|海藻|クラゲ','Krill|Tuna|Seaweed|Jellyfish')
f('ANIMALS','タコの血液が青く見える主な理由は？','Why does octopus blood appear blue?','銅を含むヘモシアニン|鉄を含むヘモグロビン|青い色の食べ物|海水に含まれる塩','Copper-based hemocyanin|Iron-based hemoglobin|Blue food|Salt in seawater')
f('ANIMALS','イルカが呼吸に使うのは？','What do dolphins use to breathe?','肺|えら|皮膚だけ|浮き袋','Lungs|Gills|Only their skin|A swim bladder')
f('ANIMALS','動物学上、クモと同じ仲間に最も近いのは？','Which is most closely related to spiders?','サソリ|アリ|ムカデ|エビ','Scorpions|Ants|Centipedes|Shrimp')
f('FOOD','トマトの赤い色の主な色素は？','What pigment gives ripe red tomatoes their color?','リコピン|クロロフィル|アントシアニン|クルクミン','Lycopene|Chlorophyll|Anthocyanin|Curcumin')
f('FOOD','豆腐の主な原料は？','What is tofu mainly made from?','大豆|小豆|ひよこ豆|そら豆','Soybeans|Adzuki beans|Chickpeas|Broad beans')
f('FOOD','落花生の実が主に育つ場所は？','Where do peanut pods mainly develop?','土の中|枝の先|葉の付け根の上|水面','Underground|At branch tips|Above leaf bases|On the water surface')
f('FOOD','パンの生地をふくらませる酵母の働きで出る気体は？','Which gas from yeast makes bread dough rise?','二酸化炭素|酸素|窒素|水素','Carbon dioxide|Oxygen|Nitrogen|Hydrogen')
f('FOOD','納豆作りに主に使われる微生物は？','What microorganism is mainly used to make natto?','納豆菌|乳酸菌|酢酸菌|パン酵母','Bacillus subtilis natto|Lactic acid bacteria|Acetic acid bacteria|Baker’s yeast')
f('FOOD','ジャガイモで主に食べている部分は？','Which part of a potato plant do we mainly eat?','地下の茎|根|種|花のつぼみ','An underground stem|A root|A seed|A flower bud')
f('FOOD','バニラの香りの原料となる植物は何の仲間？','Vanilla comes from a plant in which family?','ラン|バラ|ミント|マメ','Orchid|Rose|Mint|Pea')
f('FOOD','次のうちカフェインを通常含まないお茶は？','Which drink is naturally caffeine-free?','麦茶|紅茶|緑茶|ウーロン茶','Barley tea|Black tea|Green tea|Oolong tea')
f('LOVE','七夕の織姫星にあたる星は？','Which star represents Orihime in Tanabata?','ベガ|アルタイル|シリウス|デネブ','Vega|Altair|Sirius|Deneb')
f('LOVE','バラ科の植物は次のうちどれ？','Which plant belongs to the rose family?','イチゴ|アサガオ|ヒマワリ|ユリ','Strawberry|Morning glory|Sunflower|Lily')
f('LOVE','『源氏物語』の作者は？','Who wrote The Tale of Genji?','紫式部|清少納言|和泉式部|赤染衛門','Murasaki Shikibu|Sei Shonagon|Izumi Shikibu|Akazome Emon')
f('LOVE','「相手の気持ちに共感する」に最も近い意味は？','Which best describes empathy?','相手の立場から気持ちを理解する|必ず相手と同じ意見にする|相手の行動をすべてまねる|相手に答えを指示する','Understand another person’s perspective|Always hold the same opinion|Copy all their actions|Tell them what to think')
f('LOVE','彦星にあたるアルタイルがある星座は？','Which constellation contains Altair, the Tanabata star?','わし座|はくちょう座|こと座|オリオン座','Aquila|Cygnus|Lyra|Orion')
f('LOVE','百人一首の『ちはやぶる』で始まる和歌の作者は？','Who wrote the Hyakunin Isshu poem beginning Chihayaburu?','在原業平|小野小町|紀貫之|藤原定家','Ariwara no Narihira|Ono no Komachi|Ki no Tsurayuki|Fujiwara no Teika')
f('LOVE','結婚式などで使う「ブーケ」はフランス語で何のこと？','What does the French word bouquet mean?','花束|指輪|祝福|約束','A bunch of flowers|A ring|A blessing|A promise')
f('LOVE','七夕で織姫と彦星の間にあるとされるのは？','What separates Orihime and Hikoboshi in the Tanabata story?','天の川|北極星|月の海|オーロラ','The Milky Way|The North Star|A lunar sea|The aurora')
f('DAILY','日本で住所の郵便番号は何桁？','How many digits are in a Japanese postal code?','7桁|5桁|6桁|8桁','Seven|Five|Six|Eight')
f('DAILY','冷蔵庫の扉を開けたまま密室で動かすと、部屋全体は基本どうなる？','What generally happens to a closed room if a running fridge door stays open?','暖まる|冷える|変わらない|必ず凍る','It warms up|It cools down|It stays unchanged|It must freeze')
f('DAILY','鏡で左右が逆に感じられる主な理由は？','What does a plane mirror actually reverse?','鏡に垂直な前後の向き|上下の向き|地球の自転|光の色の順序','The direction perpendicular to it|Up and down|Earth’s rotation|The order of colors')
f('DAILY','一般的な乾電池に表示されるVは何の単位？','What does V on a household battery measure?','電圧|電流|電力|電気抵抗','Voltage|Current|Power|Resistance')
f('DAILY','濡れた洗濯物が乾く主な仕組みは？','What mainly makes wet laundry dry?','水の蒸発|水の分解|水の凝固|布の発酵','Evaporation|Decomposition|Freezing|Fermentation')
f('DAILY','日本の1円硬貨1枚の重さは？','How much does one Japanese one-yen coin weigh?','1グラム|0.5グラム|1.5グラム|2グラム','1 gram|0.5 grams|1.5 grams|2 grams')
f('DAILY','石けんが油汚れを落としやすくするのは？','Why does soap help wash away grease?','水と油の両方になじむ部分がある|油をすべて蒸発させる|水を酸素に変える|油を金属に変える','It has water-loving and oil-loving parts|It evaporates all oil|It turns water into oxygen|It turns oil into metal')
f('DAILY','うるう年でない1年のうち31日ある月はいくつ？','How many months have 31 days in a common year?','7つ|5つ|6つ|8つ','Seven|Five|Six|Eight')
f('WORLD','世界で面積が最も大きい海洋は？','Which ocean has the largest surface area?','太平洋|大西洋|インド洋|北極海','Pacific|Atlantic|Indian|Arctic')
f('WORLD','エッフェル塔がある都市は？','Which city is home to the Eiffel Tower?','パリ|リヨン|ローマ|ブリュッセル','Paris|Lyon|Rome|Brussels')
f('WORLD','憲法上の首都がスクレ、政府所在地がラパスで知られる国は？','Which country has Sucre as its constitutional capital and La Paz as its seat of government?','ボリビア|ペルー|エクアドル|パラグアイ','Bolivia|Peru|Ecuador|Paraguay')
f('WORLD','赤道が通る国は？','Which country is crossed by the equator?','エクアドル|メキシコ|スペイン|ニュージーランド','Ecuador|Mexico|Spain|New Zealand')
f('WORLD','エジプトのギザにある有名な建造物は？','What famous structures are found at Giza in Egypt?','ピラミッド|コロッセオ|タージマハル|アンコールワット','Pyramids|The Colosseum|The Taj Mahal|Angkor Wat')
f('WORLD','大陸を除き、世界で面積が最大の島は？','Excluding continents, what is the world’s largest island?','グリーンランド|ニューギニア島|ボルネオ島|マダガスカル島','Greenland|New Guinea|Borneo|Madagascar')
f('WORLD','時差が生まれる主な理由は？','What is the main reason places have different local solar times?','地球が自転するから|月が満ち欠けするから|海の深さが違うから|山の高さが違うから','Earth rotates|The Moon changes phase|Oceans differ in depth|Mountains differ in height')
f('WORLD','マチュピチュがある国は？','In which country is Machu Picchu?','ペルー|チリ|ボリビア|コロンビア','Peru|Chile|Bolivia|Colombia')
f('NATURE','雷の光が音より先に届くのはなぜ？','Why do we see lightning before hearing thunder?','光のほうが速いから|音が上に進むから|雲が音を吸うから|雷は音より前に発生するから','Light travels faster|Sound only travels upward|Clouds absorb all sound|Lightning happens before its own sound')
f('NATURE','氷が水に浮く主な理由は？','Why does ice float on liquid water?','水より密度が小さいから|水より温度が高いから|空気を必ず大量に含むから|磁力で浮くから','It is less dense|It is warmer|It must contain lots of air|Magnetism lifts it')
f('NATURE','大気の主成分が二酸化炭素で、地球と逆向きに自転する惑星は？','Which planet has a mostly carbon-dioxide atmosphere and rotates opposite to Earth?','金星|火星|水星|木星','Venus|Mars|Mercury|Jupiter')
f('NATURE','太陽系で最も大きい惑星は？','Which is the largest planet in our solar system?','木星|土星|海王星|天王星','Jupiter|Saturn|Neptune|Uranus')
f('NATURE','月面で音が空気中のようには伝わらないのは？','Why does sound not travel across the Moon as it does through air?','音を伝える大気がほぼないから|重力が全くないから|月が光るから|音の速さが無限だから','There is almost no atmosphere|There is no gravity at all|The Moon shines|Sound speed is infinite')
f('NATURE','虹の外側に見えることが多い色は？','Which color is on the outside of a primary rainbow?','赤|紫|青|緑','Red|Violet|Blue|Green')
f('NATURE','真空でも伝わるものは？','Which can travel through a vacuum?','光|人の声|笛の音|太鼓の音','Light|A human voice|A whistle sound|A drum sound')
f('NATURE','地球の大気で最も多い気体は？','Which gas is most abundant in Earth’s atmosphere?','窒素|酸素|二酸化炭素|アルゴン','Nitrogen|Oxygen|Carbon dioxide|Argon')
f('CULTURE','ピアノの標準的な鍵盤の数は？','How many keys does a standard full-size piano have?','88|76|85|96','88|76|85|96')
f('CULTURE','俳句の基本の音の並びは？','What is the usual Japanese syllabic pattern of a haiku?','5・7・5|5・5・7|7・5・7|7・7・5','5-7-5|5-5-7|7-5-7|7-7-5')
f('CULTURE','金属製のサックスが、通常分類される楽器の種類は？','Although made of metal, a saxophone belongs to which instrument family?','木管楽器|金管楽器|打楽器|弦楽器','Woodwind|Brass|Percussion|Strings')
f('CULTURE','絵の具で青と黄色を混ぜると基本何色？','What color do blue and yellow paint usually make?','緑|紫|橙|白','Green|Purple|Orange|White')
f('CULTURE','「竹取物語」の主人公として知られるのは？','Who is the heroine of The Tale of the Bamboo Cutter?','かぐや姫|乙姫|織姫|白雪姫','Princess Kaguya|Otohime|Orihime|Snow White')
f('CULTURE','印象派の名前の由来となった『印象・日の出』を描いたのは？','Who painted Impression, Sunrise, which gave Impressionism its name?','モネ|マネ|ルノワール|ドガ','Monet|Manet|Renoir|Degas')
f('CULTURE','「モナ・リザ」を描いたのは？','Who painted the Mona Lisa?','レオナルド・ダ・ビンチ|ミケランジェロ|ラファエロ|ボッティチェリ','Leonardo da Vinci|Michelangelo|Raphael|Botticelli')
f('CULTURE','楽譜でだんだん強く演奏する指示は？','Which musical term means gradually louder?','クレッシェンド|デクレッシェンド|リタルダンド|スタッカート','Crescendo|Decrescendo|Ritardando|Staccato')
f('FANTASY','チェスで縦・横・斜めに何マスでも進める駒は？','Which chess piece can move any distance straight or diagonally?','クイーン|キング|ナイト|ポーン','Queen|King|Knight|Pawn')
f('FANTASY','ギリシャ神話で翼のある馬として知られるのは？','Which creature is the winged horse of Greek myth?','ペガサス|ケンタウロス|ミノタウロス|ケルベロス','Pegasus|Centaur|Minotaur|Cerberus')
f('FANTASY','十二支で実在しない動物は？','Which animal in the East Asian zodiac is mythical?','竜|虎|蛇|猿','Dragon|Tiger|Snake|Monkey')
f('FANTASY','北欧神話でトールが持つ武器として有名なのは？','Which weapon is associated with Thor in Norse mythology?','ハンマー|弓|三つ又の槍|大きな盾','A hammer|A bow|A trident|A large shield')
f('FANTASY','不死鳥は一般にどのような姿で描かれる？','What form is a phoenix usually depicted in?','鳥|鹿|魚|ヘビ','A bird|A deer|A fish|A snake')
f('FANTASY','一般的なチェスで、ほかの駒を飛び越えて移動できるのは？','Which chess piece can jump over other pieces in a normal move?','ナイト|ビショップ|ルーク|クイーン','Knight|Bishop|Rook|Queen')
f('FANTASY','人魚は一般に上半身が人、下半身は何として描かれる？','A mermaid is usually depicted with a human upper body and what lower body?','魚|イルカ|タコ|クラゲ','A fish|A dolphin|An octopus|A jellyfish')
f('FANTASY','「アラジン」の物語で魔人が現れる道具は？','What object summons the genie in the story of Aladdin?','ランプ|鏡|砂時計|王冠','A lamp|A mirror|An hourglass|A crown')
o('ANIMALS','一日だけ動物の力を借りるなら、どれ？','Which animal ability would you borrow for a day?','鳥の飛行|イルカの水泳|犬の嗅覚|猫の身軽さ','Bird flight|Dolphin swimming|Dog smell|Cat agility')
o('ANIMALS','動物園で一つだけ特別体験。どれにする？','Choose one special zoo experience.','飼育員の仕事を手伝う|閉園後に観察する|動物の食事を作る|研究者の話を聞く','Help a keeper|Observe after closing|Prepare animal meals|Talk with a researcher')
o('ANIMALS','動物の言葉が分かるなら、最初に聞きたいのは？','If you understood animals, what would you ask first?','何をすると楽しい？|人間をどう思う？|何が一番こわい？|夢は見る？','What makes you happy?|What do you think of humans?|What scares you most?|Do you dream?')
o('ANIMALS','新しい島の自然を守るなら、まず何を調べる？','What would you study first to protect an island’s wildlife?','住む動物の種類|水と食べ物|人間の活動|季節ごとの変化','Species living there|Water and food|Human activity|Seasonal changes')
o('ANIMALS','家族で動物を迎える前、一番話し合いたいのは？','What should a family discuss most before adopting a pet?','毎日の世話の分担|長く暮らすための費用|住む環境|困ったときの相談先','Daily care duties|Long-term costs|Living space|Where to get help')
o('ANIMALS','動物を主人公にした映画。どんな冒険が見たい？','What animal adventure film would you watch?','迷子が家へ帰る|違う種類が仲間になる|小さな命が森を守る|人間を助けに行く','A lost animal returns home|Different species become friends|A tiny hero saves a forest|Animals rescue humans')
o('ANIMALS','自然観察の遠足で大事にしたいのは？','What matters most on a wildlife field trip?','遠くから静かに見る|詳しい人に教わる|見つけたことを記録する|ごみを残さず帰る','Watch quietly from a distance|Learn from a guide|Record discoveries|Leave no litter')
o('ANIMALS','動物の魅力を一つだけ展示するなら？','Which animal quality would you feature in an exhibition?','驚く体の仕組み|仲間との暮らし|生き延びる工夫|かわいい日常','Amazing anatomy|Social lives|Survival strategies|Charming daily life')
o('FOOD','好きな料理を一生一つだけ無料にできるなら？','Which meal would you make free for life?','毎日の定食|特別な日のごちそう|大好きなデザート|世界各国の一品','An everyday set meal|A celebration feast|A favorite dessert|One international dish')
o('FOOD','初めての街で昼ごはん。どの店に入る？','Where would you eat in a new town?','地元の人が並ぶ店|静かな小さな店|名物の専門店|市場の食堂','A local favorite|A quiet small restaurant|A regional specialty shop|A market diner')
o('FOOD','同じ値段の食べ放題。最も心が動くのは？','Which buffet would tempt you most at the same price?','少量ずつ多種類|一品の質がとても高い|できたてを作ってくれる|珍しい料理に挑戦できる','Many small dishes|Exceptional quality|Freshly cooked to order|Unusual foods to try')
o('FOOD','料理チームで任されたい役割は？','Which role would you take in a cooking team?','献立を考える|調理を進める|盛り付ける|みんなの段取りを整える','Plan the menu|Do the cooking|Plate the food|Coordinate the team')
o('FOOD','最後の一口のケーキ。どう分けたい？','How would you share the last bite of cake?','小さく分ける|まだ食べていない人へ|じゃんけんで決める|次に買う人へ譲る','Divide it into tiny pieces|Give it to someone who had none|Play rock-paper-scissors|Give it to the next person buying')
o('FOOD','未来の給食に加えたい仕組みは？','Which feature would you add to future school lunches?','好きな量を選べる|世界の料理を学べる|地域の食材を知れる|自分で盛り付けられる','Choose your portion|Discover world cuisines|Learn local ingredients|Serve your own plate')
o('FOOD','雨の日に食べたいもの、みんなならどれ？','What would everyone want to eat on a rainy day?','温かいスープ|焼きたてのパン|具だくさんの麺|甘いおやつ','Hot soup|Fresh bread|Noodles with toppings|A sweet snack')
o('FOOD','新しいお菓子の魅力を一つ選ぶなら？','Which quality should a new snack focus on?','食感の楽しさ|香りの良さ|見た目の驚き|後味の心地よさ','Fun texture|Wonderful aroma|Surprising appearance|A pleasant aftertaste')
o('LOVE','大切な人に気持ちを伝えるなら、一番自分らしいのは？','Which way of showing care feels most like you?','言葉でまっすぐ伝える|小さな手助けを重ねる|一緒の時間を作る|相手の話をよく聞く','Say it directly|Offer small acts of help|Make time together|Listen carefully')
o('LOVE','初めて二人で出かけるなら、どこが話しやすい？','Where would you feel most at ease on a first outing together?','公園を散歩|落ち着いたカフェ|水族館|一緒に体験できる教室','A park walk|A quiet café|An aquarium|A hands-on workshop')
o('LOVE','友達からのうれしい贈り物。心に残るのは？','Which gift from a friend would mean most?','自分をよく知った品|手作りのもの|一緒に過ごす約束|気持ちを書いた手紙','Something chosen just for you|Something handmade|Time promised together|A thoughtful letter')
o('LOVE','意見が合わず気まずくなったとき、最初にしたいことは？','What would you do first after a disagreement?','自分の気持ちを整理する|相手の話を聞く|落ち着く時間を置く|誤解がないか確かめる','Sort out your feelings|Hear the other person out|Take time to cool down|Check for misunderstandings')
o('LOVE','久しぶりに会う友達と、一番したいのは？','What would you most like to do with a friend after a long time apart?','最近の話をする|思い出の場所へ行く|新しい体験をする|何も決めず一緒に過ごす','Share recent news|Visit an old favorite place|Try something new|Spend unplanned time together')
o('LOVE','好きな人や友達の誕生日。準備で最も悩むのは？','What is hardest when planning a birthday for someone special?','喜ぶ品を選ぶ|驚かせ方を考える|過ごし方を決める|気持ちを言葉にする','Choosing a gift|Planning a surprise|Deciding how to spend the day|Finding the right words')
o('LOVE','長く仲良くいるために、一番大切にしたいのは？','What matters most for a lasting relationship?','違いを尊重する|感謝を伝える|約束を守る|困ったとき助け合う','Respect differences|Express gratitude|Keep promises|Help each other in hard times')
o('LOVE','物語で心が動く関係は？','Which relationship in a story moves you most?','ライバルから仲間へ|離れても信じ合う二人|不器用に支え合う二人|長い誤解が解ける瞬間','Rivals becoming allies|Trust across distance|Awkward but mutual support|A long misunderstanding resolved')
o('DAILY','自由な一時間ができたら、何を優先する？','What would you prioritize with a free hour?','しっかり休む|好きなことに集中|気になっていた用事|誰かと話す','Rest properly|Enjoy a hobby|Finish a pending task|Talk with someone')
o('DAILY','朝を少し快適にするなら、何を変える？','What would make your morning better?','前夜に準備する|余裕を持って起きる|好きな朝食を用意|短い楽しみを作る','Prepare the night before|Wake with time to spare|Have a favorite breakfast|Plan a small treat')
o('DAILY','引っ越し先で一つだけ条件を選ぶなら？','Which single feature would you prioritize in a new home?','通いやすさ|静けさ|日当たり|身近な自然','Easy travel|Quiet surroundings|Sunlight|Nearby nature')
o('DAILY','落とし物を探すとき、どこから始める？','Where would you start when looking for a lost item?','最後に使った場所|いつもの置き場所|歩いた順番をたどる|誰かに心当たりを聞く','Where you last used it|Its usual spot|Retrace your steps|Ask someone for clues')
o('DAILY','予定のない休日、理想に近いのは？','Which is closest to your ideal unplanned day off?','家でのんびり|近所を探索|友達と集まる|気になった場所へ遠出','Relax at home|Explore nearby|Meet friends|Take a spontaneous trip')
o('DAILY','便利な家電が一つ増えるなら、どの仕事を任せる？','Which chore would you give to one new appliance?','掃除|洗濯物をたたむ|料理の下ごしらえ|片付け','Cleaning|Folding laundry|Preparing ingredients|Tidying up')
o('DAILY','急に予定が変わったとき、頼りになるのは？','What helps most when plans change suddenly?','代案を考える力|周りに相談する力|落ち着いて待つ力|楽しみを見つける力','Finding alternatives|Asking others for ideas|Waiting calmly|Finding something to enjoy')
o('DAILY','暮らしの中で一つだけ増やしたいものは？','What would you add to everyday life?','何もしない余白|新しい発見|会話の時間|体を動かす機会','Unscheduled time|New discoveries|Time for conversation|Chances to move')
o('WORLD','旅行で一つだけ特別体験。選ぶなら？','Choose one special travel experience.','地元の家庭料理|静かな絶景|歴史ある街歩き|自然の中で宿泊','A local home-cooked meal|A peaceful view|A historic town walk|A night in nature')
o('WORLD','初めての国で一番知りたいことは？','What would you most want to learn in a new country?','日常の暮らし|食べ物の文化|言葉の面白さ|昔からの物語','Everyday life|Food culture|Language quirks|Traditional stories')
o('WORLD','旅の移動時間、どう過ごしたい？','How would you spend travel time?','窓の景色を見る|行き先を調べる|一緒の人と話す|音楽を聴いて休む','Watch the scenery|Read about the destination|Talk with companions|Rest with music')
o('WORLD','お土産を一つ選ぶなら、何を重視する？','What matters most in a souvenir?','その土地らしさ|使いやすさ|思い出とのつながり|渡す人の好み','Local character|Practical use|A personal memory|The recipient’s taste')
o('WORLD','言葉が通じない相手と、まず何で伝える？','How would you first communicate without a shared language?','絵を描く|身ぶりで示す|翻訳を使う|写真を見せる','Draw a picture|Use gestures|Use translation|Show a photo')
o('WORLD','旅先で予定が半日空いたら？','What would you do with an unexpected free afternoon on a trip?','地図なしで散歩|地元のおすすめを聞く|有名な場所を再訪|ゆっくり休む','Wander without a map|Ask for local recommendations|Revisit a highlight|Take a proper rest')
o('WORLD','同じ場所へもう一度旅する理由は？','Why would you revisit the same place?','別の季節を見たい|会いたい人がいる|前回の続きを楽しむ|安心して過ごせる','See another season|Meet someone again|Explore what you missed|Enjoy a familiar refuge')
o('WORLD','世界の街と交換できる一日。何をして過ごす？','How would you spend a day swapped with someone in another city?','市場を歩く|学校や仕事を体験|地域の祭りへ|普段の暮らしをまねる','Explore a market|Try school or work|Join a local festival|Live an ordinary day')
o('NATURE','宇宙で一つだけ見られるなら、どの景色？','Which space view would you choose?','地球全体|土星の輪|月からの日の出|遠い星雲','The whole Earth|Saturn’s rings|Sunrise from the Moon|A distant nebula')
o('NATURE','科学の実験を一つ体験するなら？','Which science experience would you try?','小さな生き物を観察|光で色を作る|音の形を見る|結晶を育てる','Observe tiny life|Make colors with light|See sound patterns|Grow crystals')
o('NATURE','自然の中で一日過ごすなら？','Where would you spend a day in nature?','海辺|森の中|山の上|広い草原','By the sea|In a forest|On a mountain|In open grassland')
o('NATURE','未来の発明で一番期待したいのは？','Which future invention would you most welcome?','きれいな水を安く作る|捨てる物を資源に戻す|病気を早く見つける|少ない電力で暮らせる','Affordable clean water|Turning waste into resources|Earlier disease detection|Living with less energy')
o('NATURE','夜空を見て一番知りたくなるのは？','What do you most wonder about under the night sky?','宇宙の始まり|ほかの生命|星の最期|宇宙の果て','How the universe began|Life elsewhere|How stars end|The edge of space')
o('NATURE','一つだけ季節の音を選ぶなら？','Which seasonal sound would you choose?','春の鳥の声|夏の波の音|秋の虫の声|冬の雪を踏む音','Spring birdsong|Summer waves|Autumn insects|Footsteps in winter snow')
o('NATURE','身近な環境をよくする活動なら、どれを続けたい？','Which local environmental activity would you keep doing?','川や海のごみ拾い|植物を育てる|物を修理して使う|自然の変化を記録','Clean rivers or beaches|Grow plants|Repair and reuse things|Record changes in nature')
o('NATURE','新しい星を調べる探査機に、一つだけ追加するなら？','Which extra tool would you put on a space probe?','鮮明なカメラ|地下を調べる装置|生命の痕跡を探す装置|音や振動を測る装置','A sharp camera|A subsurface scanner|A search for life traces|A vibration sensor')
o('CULTURE','好きな物語の世界に入るなら、どんな役？','What role would you take in a favorite story?','仲間を集める人|謎を解く人|みんなを支える人|世界を記録する人','Gather companions|Solve mysteries|Support everyone|Record the world')
o('CULTURE','ライブで一曲だけ特別演出。選ぶのは？','Choose a special performance for one concert song.','生のアコースティック|会場みんなで合唱|映像と音の共演|即興で変わる演奏','Live acoustic|Everyone sings together|Music with visuals|An improvised version')
o('CULTURE','映画を選ぶとき、一番ひかれるのは？','What draws you most to a film?','心に残る人物|先が読めない展開|世界の美しさ|見終わった後の余韻','Memorable characters|Unpredictable turns|A beautiful world|A lasting afterglow')
o('CULTURE','自分の作品を展示するなら、どの形？','How would you exhibit your own work?','小さな個展|みんなで作る展示|街の中の展示|オンラインの作品集','A small solo show|A group creation|An exhibit in town|An online collection')
o('CULTURE','物語の結末で好きなのは？','Which kind of ending do you prefer?','きれいにまとまる|考える余地がある|次の冒険を予感|最初の場面につながる','Everything comes together|Room for interpretation|A new adventure awaits|It echoes the beginning')
o('CULTURE','好きな音楽の魅力を伝えるなら？','How would you explain a favorite piece of music?','歌詞を紹介|一緒に聴く|思い出を話す|演奏を見せる','Share its lyrics|Listen together|Tell a personal story|Show a performance')
o('CULTURE','一冊だけ本を旅に持っていくなら？','Which one book would you take on a trip?','短編小説集|旅先の歴史|お気に入りの再読|美しい写真集','Short stories|Local history|A familiar favorite|A beautiful photo book')
o('CULTURE','新しい祭りを作るなら、中心にしたいのは？','What would be at the heart of a new festival?','音楽と踊り|地域の食べ物|光と景色|みんなで作る作品','Music and dance|Local food|Light and scenery|A shared artwork')
o('FANTASY','魔法を一つ覚えるなら、どれを選ぶ？','Which one magic spell would you learn?','傷を少しずつ癒やす|小さな物を直す|短い距離を移動|植物を元気にする','Heal wounds gradually|Repair small objects|Travel short distances|Revive plants')
o('FANTASY','冒険の仲間に求める力は？','Which strength matters most in an adventuring companion?','困っても諦めない|危険を見抜く|みんなを励ます|新しい道を探す','Never give up|Spot danger|Encourage the team|Find a new way')
o('FANTASY','一度だけ時間を使う道具。どう使う？','How would you use a one-time time device?','大切な一日をもう一度|未来を少しだけ見る|一時間ゆっくり考える|消えた景色を見る','Relive a precious day|Glimpse the future|Have an extra hour to think|See a vanished landscape')
o('FANTASY','空に浮かぶ町で暮らすなら、一番ほしい場所は？','What would you want most in a floating town?','雲を眺める庭|空の図書館|風を使う市場|地上とつながる港','A cloud-view garden|A sky library|A wind-powered market|A port to the ground')
o('FANTASY','勇者への報酬を一つ選ぶなら？','Which reward would you choose as a hero?','安心して帰れる家|世界を旅する切符|仲間と過ごす休暇|何でも一つ学べる本','A safe home|A ticket around the world|A holiday with friends|A book teaching one skill')
o('FANTASY','人の心を一つだけ色で見られるなら？','Which feeling would you want to see as a color?','うれしさ|不安|好奇心|感謝','Joy|Worry|Curiosity|Gratitude')
o('FANTASY','小さな竜と暮らすなら、最初に教えたいことは？','What would you first teach a small dragon?','火を安全に使う|気持ちを伝える|一緒に片付ける|迷ったら帰る場所','Use fire safely|Communicate feelings|Tidy up together|Know the way home')
o('FANTASY','どんな魔法の店を開きたい？','What magical shop would you open?','思い出を料理にする|失くした物を探す|夢の景色を描く|疲れに合う音楽を選ぶ','Cook memories into meals|Find lost belongings|Paint dream landscapes|Choose music for tired hearts')
# Drawing and numerical surveys retain their distinct rules, rather than forced choices.
subjects={
'ANIMALS':[('月で跳ぶウサギ','A rabbit jumping on the Moon'),('傘を差すペンギン','A penguin with an umbrella'),('読書するフクロウ','An owl reading'),('風船に驚く猫','A cat surprised by a balloon')],
'FOOD':[('王冠をかぶるプリン','A pudding wearing a crown'),('宇宙を飛ぶおにぎり','A rice ball in space'),('雨宿りするパン','Bread sheltering from rain'),('歌うニンジン','A singing carrot')],
'LOVE':[('花束を持つロボット','A robot with flowers'),('橋で再会する二人','Two friends reuniting on a bridge'),('ハート形の雲','A heart-shaped cloud'),('手紙を届ける鳥','A bird delivering a letter')],
'DAILY':[('寝坊した目覚まし時計','An alarm clock that overslept'),('散歩するカバン','A bag taking a walk'),('踊る掃除機','A dancing vacuum'),('空飛ぶ自転車','A flying bicycle')],
'WORLD':[('雲の上の空港','An airport above clouds'),('砂漠の図書館','A library in a desert'),('海底の駅','An underwater station'),('山頂のパン屋','A mountaintop bakery')],
'NATURE':[('星を釣る人','Someone fishing for stars'),('虹を渡る船','A ship crossing a rainbow'),('雪だるまの海水浴','A snowman at the beach'),('木に実る月','Moons growing on a tree')],
'CULTURE':[('音符の形の遊園地','A music-note theme park'),('絵から出てくる竜','A dragon leaving a painting'),('踊る本棚','A dancing bookshelf'),('映画を見る月','The Moon watching a film')],
'FANTASY':[('小さな竜の料理教室','A small dragon’s cooking class'),('魔法使いの洗濯','A wizard doing laundry'),('空を掃除するほうき','A broom cleaning the sky'),('星でできた城','A castle made of stars')]}
surveys={
'ANIMALS':[('動物観察の散歩、何分歩きたい？','How many minutes would you walk to watch wildlife?'),('動物の写真展、何枚見たい？','How many photos would you want in a wildlife exhibition?'),('動物と話せる時間、一日に何分ほしい？','How many minutes a day would you want to talk with animals?'),('理想の水族館見学は何分？','How many minutes is an ideal aquarium visit?')],
'FOOD':[('理想のおやつ休憩は何分？','How many minutes should a snack break last?'),('一つの料理を極めるなら何回練習する？','How many times would you practice to master a dish?'),('お弁当に何種類のおかずがほしい？','How many side dishes would you like in a lunch box?'),('評判のランチ、何分まで並べる？','How many minutes would you queue for a famous lunch?')],
'LOVE':[('久しぶりの友達と、何時間話したい？','How many hours would you chat with a long-lost friend?'),('大切な手紙、何文字くらい書きたい？','About how many characters would you write in a special letter?'),('待ち合わせには何分前に着きたい？','How many minutes early would you arrive for a meeting?'),('一年に何回、友達と特別なお出かけをしたい？','How many special outings with friends would you want each year?')],
'DAILY':[('一日の自由時間は何分ほしい？','How many free minutes would you want each day?'),('理想の昼寝は何分？','How many minutes is an ideal nap?'),('朝の準備に何分ほしい？','How many minutes would you want to get ready in the morning?'),('一週間に何時間、趣味に使いたい？','How many hours a week would you devote to hobbies?')],
'WORLD':[('一度の旅で何都市巡りたい？','How many cities would you visit on one trip?'),('景色のいい列車に何時間乗りたい？','How many hours would you spend on a scenic train?'),('一生で何か国を訪ねたい？','How many countries would you like to visit in a lifetime?'),('旅の写真を一日何枚残したい？','How many travel photos would you keep per day?')],
'NATURE':[('星空を何分眺めたい？','How many minutes would you spend stargazing?'),('自分の庭に何種類の植物を育てたい？','How many plant species would you grow in your garden?'),('自然の中で何日過ごしたい？','How many days would you spend in nature?'),('科学館の体験展示、一つに何分使いたい？','How many minutes would you spend at one science exhibit?')],
'CULTURE':[('理想のライブ公演は何分？','How many minutes is an ideal concert?'),('一年に何冊、本を読みたい？','How many books would you like to read in a year?'),('お気に入りの映画を何回見たい？','How many times would you rewatch a favorite film?'),('展示で一作品を何分見たい？','How many minutes would you spend with one artwork?')],
'FANTASY':[('冒険パーティーは何人が理想？','How many people make an ideal adventuring party?'),('魔法を一つ覚えるのに何日練習できる？','How many days would you practice to learn a spell?'),('空飛ぶ町には何人くらい住んでほしい？','How many people should live in a floating town?'),('小さな竜との散歩は何分が理想？','How many minutes is an ideal walk with a small dragon?')]}
for category,items in subjects.items():
 for ja,en in items:
  q=row(category,'絵で伝えよう：'+ja,'Draw: '+en,'','',opinion=True);q['answer']=[ja,en,hi(ja)];draw.append(q)
for category,items in surveys.items():
 for ja,en in items:nearest.append(row(category,ja,en,'','',opinion=True))
for items in [facts,social,draw,nearest]:
 counts={}
 for q in items:
  i=counts.get(q['category'],0);counts[q['category']]=i+1;q['difficulty']=['EASY','NORMAL','HARD'][i%3]
 assert len({q['prompt'][0] for q in items})==len(items)
banks={mode:facts for mode in ['STANDARD','BUZZER','SURVIVAL','TEAMS']}
banks.update({mode:social for mode in ['CONSENSUS','MAJORITY','WOLF','VOTE']});banks.update(DRAW=draw,NEAREST=nearest)
output=Path(__file__).resolve().parents[2]/'src/quiz-show/varietyPrompts.json'
output.write_text(json.dumps(banks,ensure_ascii=False,indent=2)+'\n')
print('Authored',sum(map(len,[facts,social,draw,nearest])),'new prompts;',sum(map(len,banks.values())),'mode entries')
