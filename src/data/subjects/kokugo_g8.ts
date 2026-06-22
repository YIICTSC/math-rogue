import { GeneralProblem, d } from './utils';

export const KOKUGO_G8_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G8_U01: [], KOKUGO_G8_U02: [], KOKUGO_G8_U03: [], KOKUGO_G8_U04: [], KOKUGO_G8_U05: [], KOKUGO_G8_U06: [],
  KOKUGO_G8_U07: [], KOKUGO_G8_U08: [], KOKUGO_G8_U09: [], KOKUGO_G8_U10: [], KOKUGO_G8_U11: [],
};

const choices = (answer: string, pool: string[], index: number) => {
  const values = [answer];
  for (let k = 1; values.length < 4 && k <= pool.length; k++) {
    const value = pool[(index + k) % pool.length];
    if (!values.includes(value)) values.push(value);
  }
  while (values.length < 4) values.push(`当てはまらない説明${values.length}`);
  return d(values[0], values[1], values[2], values[3]);
};

const stories = [
  { title:'雨上がりのベンチ', relation:'同級生の春菜と美緒', cue:'美緒がぬれたベンチを黙って拭いた', change:'春菜は美緒の誤解を解こうと決めた', turn:'美緒が古い手紙を差し出したこと', view:'春菜の一人称視点', theme:'対話が誤解をほどく' },
  { title:'祖父の時計', relation:'祖父と孫の航', cue:'航が止まった時計を何度も見た', change:'航は修理を諦めず技術を学び始めた', turn:'祖父の修理記録を見つけたこと', view:'航に寄り添う三人称視点', theme:'受け継いだ思いを行動へ移す' },
  { title:'最後のリレー', relation:'競争相手の陸と健太', cue:'陸が健太へ無言でバトンを差し出した', change:'健太は勝敗より仲間との信頼を重んじた', turn:'陸が転倒した健太を待ったこと', view:'健太の一人称視点', theme:'競争の中にも友情が育つ' },
  { title:'図書室の窓', relation:'図書委員の葵と転校生の凛', cue:'凛が窓辺の席を毎日空けていた', change:'葵は凛へ自分から話しかけた', turn:'凛の描いた学校の絵を見たこと', view:'葵に寄り添う三人称視点', theme:'小さな関心が孤立を変える' },
  { title:'消えた足跡', relation:'兄の直人と妹の結衣', cue:'直人が雪の上の足跡を避けて歩いた', change:'結衣は兄の慎重さの理由を理解した', turn:'足跡が迷い犬のものだと分かったこと', view:'結衣の一人称視点', theme:'相手の行動の背景を想像する' },
  { title:'夕暮れの舞台', relation:'演劇部員の玲奈と先輩の咲', cue:'咲が空の客席へ深く一礼した', change:'玲奈は脇役にも意味があると気づいた', turn:'咲から古い台本を託されたこと', view:'玲奈に寄り添う三人称視点', theme:'役割への誇りは舞台を支える' },
  { title:'海辺の約束', relation:'幼なじみの蒼と陽介', cue:'蒼が拾った貝殻を握りしめた', change:'陽介は離れても交流を続けようと伝えた', turn:'蒼の引っ越しを知らされたこと', view:'陽介の一人称視点', theme:'別れを越えて関係をつなぐ' },
  { title:'白いスニーカー', relation:'母と娘の紗季', cue:'母が泥の付いた靴ひもだけを替えた', change:'紗季は失敗を隠さず話した', turn:'靴箱に母の短いメモを見つけたこと', view:'紗季に寄り添う三人称視点', theme:'信頼は正直さによって深まる' },
  { title:'坂道の自転車', relation:'近所の老人と中学生の亮', cue:'老人が荷台を押す亮へ何度もうなずいた', change:'亮は地域の人へ自然に声をかけるようになった', turn:'老人が昔の坂道の写真を見せたこと', view:'亮の一人称視点', theme:'世代を越えた交流が地域を結ぶ' },
  { title:'夜の校庭', relation:'天文部員の真琴と顧問', cue:'顧問が曇り空でも望遠鏡を準備した', change:'真琴は結果だけでなく準備を大切にした', turn:'雲の切れ間から星が現れたこと', view:'真琴に寄り添う三人称視点', theme:'地道な備えが機会を生かす' },
];

const storyPassages = [
  '雨上がり、春菜が公園へ行くと、美緒はぬれたベンチを黙って拭いていた。二人は昨日の言い争いから、まだ言葉を交わしていない。美緒が古い手紙を差し出すと、春菜は自分の言葉が誤解されていたことに気づいた。春菜は逃げずに話そうと、美緒の隣へ腰を下ろした。',
  '航は祖父の机で、止まった腕時計を何度も見つめていた。引き出しの奥から、祖父が残した修理記録が見つかった。そこには失敗した箇所まで細かく書かれている。航は時計を捨てず、工具の使い方から学び直すことにした。',
  'リレーの選考で競い合ってきた陸と健太は、最後の記録会でも隣の走路に立った。健太が転倒すると、先を走る陸は足を止め、無言でバトンを差し出した。健太は勝敗だけを見ていた自分に気づいた。二人は並んでゴールへ向かった。',
  '図書委員の葵は、転校生の凛が毎日窓辺の席を一つ空けて座ることを不思議に思っていた。ある日、凛のノートに学校の細かな絵を見つける。葵が絵について尋ねると、凛は初めて笑った。翌日、葵は空いていた席へ自分から座った。',
  '雪道を歩く兄の直人は、点々と続く足跡を踏まないよう遠回りした。妹の結衣は、なぜ急がないのかと不満に思う。やがて足跡の先で震える迷い犬を見つけた。結衣は、兄が小さな跡を見失わないようにしていたのだと理解した。',
  '終演後、先輩の咲は誰もいない客席へ深く一礼した。脇役だった玲奈は、自分の出番が少なかったことを気にしていた。咲から書き込みの多い古い台本を渡され、舞台は一人では作れないと聞く。玲奈は、自分の役も物語を支えていたと気づいた。',
  '蒼の引っ越しを知った陽介は、何を言えばよいか分からず海辺を歩いた。蒼は拾った貝殻を握りしめ、遠くへ行けば会えなくなるとつぶやく。陽介は貝殻を一つ受け取り、離れても手紙を送り合おうと伝えた。二人は波音の中で次に会う日を約束した。',
  '紗季は大会で失敗し、泥の付いた白いスニーカーを靴箱へ隠した。翌朝、母は汚れを責めず、切れかけた靴ひもだけを新しくしていた。靴箱には「話せる時に聞かせて」と短いメモがある。紗季は失敗を隠さず、母へ話すことにした。',
  '急な坂で荷物を積んだ自転車を押す老人を見て、亮は後ろから荷台を支えた。老人は何度もうなずき、昔の坂道を写した写真を見せてくれた。そこには地域の人が互いの荷物を運ぶ姿があった。それから亮は、近所の人へ自然に声をかけるようになった。',
  '観察会の夜、校庭は厚い雲に覆われていた。真琴が中止だと思っている横で、顧問は望遠鏡を組み立て続ける。準備が終わった時、雲の切れ間から星が現れた。真琴は、機会を生かすには結果が見えない時の備えも必要だと知った。',
];

const articles = [
  { title:'都市の緑', issue:'都市部の暑さと緑地の不足', claim:'小さな緑地を地域に分散して増やすべきだ', evidence:'街路樹の多い区画では表面温度が低かった', logic:'緑が日射を遮り蒸散によって周囲を冷やすため', structure:'問題提起・調査結果・提案' },
  { title:'言葉の変化', issue:'新しい言葉への一面的な評価', claim:'言葉の変化を使用場面とともに捉える必要がある', evidence:'同じ表現でも世代により受け止め方が異なった', logic:'言葉の意味は社会と使用者の関係で変わるため', structure:'具体例・比較・考察' },
  { title:'食品ロス', issue:'食べられる食品の大量廃棄', claim:'家庭では購入前の在庫確認を習慣化すべきだ', evidence:'廃棄理由の上位に買い過ぎと期限切れがあった', logic:'不要な購入を減らせば廃棄も抑えられるため', structure:'現状・原因分析・解決策' },
  { title:'地域の交通', issue:'高齢者の移動手段の不足', claim:'小型乗合交通を地域で運用するとよい', evidence:'導入地域では通院や買い物の外出が増えた', logic:'需要に合わせた経路なら少人数でも移動できるため', structure:'課題・事例・提言' },
  { title:'睡眠と記憶', issue:'睡眠不足による学習効率の低下', claim:'学習時間だけでなく睡眠時間も確保すべきだ', evidence:'十分に眠った群は翌日の再生率が高かった', logic:'睡眠中に学習内容の整理が進むため', structure:'問い・実験・結論' },
  { title:'海洋プラスチック', issue:'海へ流出するプラスチックごみ', claim:'回収だけでなく使い捨て製品を減らす必要がある', evidence:'河川調査で生活由来の容器片が多く見つかった', logic:'流出前の使用量を抑える方が発生源対策になるため', structure:'実態・原因・対策' },
  { title:'文化財の保存', issue:'文化財の劣化と担い手不足', claim:'デジタル記録と実物保存を併用すべきだ', evidence:'高精細画像が修復前後の比較に役立った', logic:'記録は情報を残し実物は材質や大きさを伝えるため', structure:'課題・方法比較・主張' },
  { title:'昆虫と農業', issue:'害虫対策による生態系への影響', claim:'天敵を生かす防除方法を組み合わせるべきだ', evidence:'天敵の生息地を残した畑で害虫が減少した', logic:'生物同士の関係を利用すれば薬剤使用を抑えられるため', structure:'観察・因果関係・提案' },
  { title:'情報の確かさ', issue:'根拠不明の情報が拡散すること', claim:'発信元と複数資料を確認してから共有すべきだ', evidence:'誤情報は見出しだけ読んで共有された例が多かった', logic:'情報源を比較すれば誤りや偏りに気づきやすいため', structure:'事例・原因・行動指針' },
  { title:'方言の役割', issue:'地域の方言を使う機会の減少', claim:'方言を生活文化の記録として残す価値がある', evidence:'方言には地域固有の仕事や自然を示す語がある', logic:'語彙を残すことが地域の経験の保存にもなるため', structure:'現状・具体例・価値づけ' },
];

const poems = [
  { text:'春の川ひかりをほどき町へゆく', form:'俳句', device:'擬人法', effect:'川の動きを生き生きと感じさせる', image:'春光の中を流れる川', theme:'春の始まりへの喜び' },
  { text:'駅を出て母の手紙を読み返す遠い灯台海にまたたく', form:'短歌', device:'遠景との取り合わせ', effect:'離れた家族への思いを広い景色に重ねる', image:'夜の海と灯台', theme:'家族への懐かしさ' },
  { text:'風だけがページをめくる昼休み', form:'俳句', device:'擬人法', effect:'静かな時間の中で風の動きを際立たせる', image:'無人の教室と開いた本', theme:'静けさの発見' },
  { text:'できないと言った昨日の声を越え自転車で行く朝焼けの橋', form:'短歌', device:'対比', effect:'昨日の迷いと今朝の決意を鮮明にする', image:'朝焼けの橋を渡る姿', theme:'自分を乗り越える決意' },
  { text:'蝉しぐれ古い校舎の傷を満たす', form:'俳句', device:'聴覚表現', effect:'夏の音で校舎の時間の厚みを表す', image:'蝉の声に包まれた校舎', theme:'積み重なる記憶' },
  { text:'雨粒を窓に数えて待っている言えなかったこと言える夕暮れ', form:'短歌', device:'情景と心情の重なり', effect:'ためらいから決意へ向かう時間を示す', image:'雨の窓辺で待つ人物', theme:'思いを伝える勇気' },
  { text:'初雪や足跡ふたつ門を出る', form:'俳句', device:'省略', effect:'二人の関係を説明せず想像させる', image:'初雪に続く二人分の足跡', theme:'共に歩む喜び' },
  { text:'弟の背丈を柱に刻むたび家の時間は木目をのぼる', form:'短歌', device:'比喩', effect:'成長と時間の経過を柱の木目に重ねる', image:'背丈の印が残る柱', theme:'家族の成長' },
  { text:'夕立のあとの匂いや土深く', form:'俳句', device:'嗅覚表現', effect:'雨上がりの大地を匂いから感じさせる', image:'夕立後の湿った土', theme:'自然の息づかい' },
  { text:'知らぬ町地図をたたんで歩き出す曲がり角から祭りの太鼓', form:'短歌', device:'聴覚による場面転換', effect:'不安が期待へ変わる瞬間を伝える', image:'未知の町と祭りの音', theme:'未知へ踏み出す楽しさ' },
];

const classics = [
  { text:'つれづれなるままに、日暮らし、硯に向かひて。', modern:'することもなく物思いにふけり、一日中硯に向かって。', word:'つれづれなり＝することがなく退屈だ', point:'冒頭で書き手の状態を示す', source:'徒然草' },
  { text:'花は盛りに、月は隈なきをのみ見るものかは。', modern:'桜は満開を、月は曇りなく照る時だけを見るものだろうか、いやそうではない。', word:'ものかは＝反語を表す', point:'反語によって不完全なものの美を説く', source:'徒然草' },
  { text:'月日は百代の過客にして、行きかふ年もまた旅人なり。', modern:'月日は永遠に旅を続ける旅人で、来ては去る年もまた旅人である。', word:'過客＝旅人', point:'月日を旅人にたとえる', source:'おくのほそ道' },
  { text:'行く春や鳥啼き魚の目は涙。', modern:'去っていく春を惜しみ、鳥は鳴き魚の目には涙があるようだ。', word:'行く春＝過ぎ去る春', point:'旅立ちの別れを生き物の姿に重ねる', source:'おくのほそ道' },
  { text:'祇園精舎の鐘の声、諸行無常の響きあり。', modern:'祇園精舎の鐘の音には、万物が移り変わるという響きがある。', word:'諸行無常＝すべては変化すること', point:'鐘の音から作品の主題を示す', source:'平家物語' },
  { text:'沙羅双樹の花の色、盛者必衰の理をあらはす。', modern:'沙羅双樹の花の色は、栄える者も必ず衰える道理を表す。', word:'理＝道理', point:'花の色で栄華のはかなさを象徴する', source:'平家物語' },
  { text:'春はあけぼの。やうやう白くなりゆく山ぎは。', modern:'春は明け方がよい。しだいに白くなっていく山際。', word:'やうやう＝だんだん', point:'色彩の変化を時間の流れとともに描く', source:'枕草子' },
  { text:'秋は夕暮れ。夕日のさして山の端いと近うなりたるに。', modern:'秋は夕暮れがよい。夕日が差して山の端にとても近くなったころに。', word:'いと＝とても', point:'季節と時刻を組み合わせて美を描く', source:'枕草子' },
  { text:'今は昔、竹取の翁といふ者ありけり。', modern:'今となっては昔のこと、竹取の翁という者がいた。', word:'ありけり＝いたのだった', point:'昔話の冒頭として時と人物を示す', source:'竹取物語' },
  { text:'男もすなる日記といふものを、女もしてみむとてするなり。', modern:'男も書くという日記というものを、女である私も書いてみようと思って書くのである。', word:'む＝意志を表す助動詞', point:'女性になりきった語り手を設定する', source:'土佐日記' },
];

const kanbun = [
  { text:'温故而知新', reading:'故きを温ねて新しきを知る', meaning:'昔のことを学び直して新しい知識を得る', point:'「而」は前後をつなぐ', lesson:'過去の学びを新しい理解に生かす' },
  { text:'学而時習之', reading:'学びて時に之を習ふ', meaning:'学んだことを機会あるごとに復習する', point:'「之」は学んだ内容を指す', lesson:'反復によって学びを身につける' },
  { text:'知之為知之', reading:'之を知るを之を知ると為す', meaning:'知っていることを知っていると認める', point:'同じ「之」が内容を受ける', lesson:'自分の知識を正直に捉える' },
  { text:'不知為不知', reading:'知らざるを知らずと為す', meaning:'知らないことを知らないと認める', point:'「不」を「ず」と訓読する', lesson:'無知を認めることが学びの出発点になる' },
  { text:'三人行必有我師焉', reading:'三人行へば必ず我が師有り', meaning:'三人で行けば必ず自分の手本となる人がいる', point:'「必」を「必ず」と読む', lesson:'誰からでも学ぶ点を見つけられる' },
  { text:'過而不改是謂過矣', reading:'過ちて改めざる、是を過ちと謂ふ', meaning:'間違いをしても直さないことこそ本当の過ちである', point:'「不改」を「改めず」と読む', lesson:'失敗に気づいたら改める' },
  { text:'有朋自遠方来', reading:'朋有り遠方より来たる', meaning:'友人が遠い所から訪ねて来る', point:'「自」を「より」と訓読する', lesson:'志を同じくする友を大切にする' },
  { text:'己所不欲勿施於人', reading:'己の欲せざる所は人に施すこと勿かれ', meaning:'自分が望まないことを人にしてはいけない', point:'「勿」は禁止の形を作る', lesson:'相手の立場を考えて行動する' },
  { text:'百聞不如一見', reading:'百聞は一見に如かず', meaning:'何度も聞くより一度実際に見る方がよい', point:'「不如」で比較の形を作る', lesson:'自分で確かめることを重んじる' },
  { text:'少年易老学難成', reading:'少年老い易く学成り難し', meaning:'若者はすぐ年を取り学問はなかなか完成しない', point:'「易」と「難」が対比される', lesson:'時間を惜しんで学ぶ' },
];

const grammar = [
  { sentence:'鳥が空を飛ぶ。', word:'飛ぶ', base:'飛ぶ', kind:'動詞', form:'終止形', reason:'文末で言い切っている' },
  { sentence:'雨が降らない。', word:'降ら', base:'降る', kind:'動詞', form:'未然形', reason:'後ろに助動詞「ない」が続く' },
  { sentence:'本を読むとき、印を付ける。', word:'読む', base:'読む', kind:'動詞', form:'連体形', reason:'後ろの名詞「とき」を修飾する' },
  { sentence:'早く起きれば間に合う。', word:'起きれ', base:'起きる', kind:'動詞', form:'仮定形', reason:'後ろに助詞「ば」が続く' },
  { sentence:'静かな海を眺める。', word:'静かな', base:'静かだ', kind:'形容動詞', form:'連体形', reason:'後ろの名詞「海」を修飾する' },
  { sentence:'空は青かった。', word:'青かっ', base:'青い', kind:'形容詞', form:'連用形', reason:'後ろに助動詞「た」が続く' },
  { sentence:'もっと強く投げよう。', word:'強く', base:'強い', kind:'形容詞', form:'連用形', reason:'後ろの動詞「投げる」を修飾する' },
  { sentence:'ここは便利なら利用したい。', word:'便利なら', base:'便利だ', kind:'形容動詞', form:'仮定形', reason:'条件を表して後ろへ続く' },
  { sentence:'急げば電車に間に合う。', word:'急げ', base:'急ぐ', kind:'動詞', form:'仮定形', reason:'後ろに助詞「ば」が続く' },
  { sentence:'美しい花が咲いた。', word:'美しい', base:'美しい', kind:'形容詞', form:'連体形', reason:'後ろの名詞「花」を修飾する' },
];

const vocabulary = [
  { word:'普遍', reading:'ふへん', meaning:'広くすべてに当てはまること', usage:'この物語は友情という普遍的な主題を扱う。', relation:'一般的' },
  { word:'顕著', reading:'けんちょ', meaning:'はっきり目立って現れること', usage:'対策後、事故件数の減少が顕著になった。', relation:'明白' },
  { word:'抽象', reading:'ちゅうしょう', meaning:'共通する性質を取り出して捉えること', usage:'具体例から抽象的な考えを導く。', relation:'概括' },
  { word:'具体', reading:'ぐたい', meaning:'形や内容がはっきりしていること', usage:'主張を具体的な数値で説明する。', relation:'明確' },
  { word:'推敲', reading:'すいこう', meaning:'文章を何度も練り直すこと', usage:'提出前に意見文を推敲した。', relation:'練り直し' },
  { word:'簡潔', reading:'かんけつ', meaning:'短く要点がまとまっていること', usage:'調査結果を簡潔に報告する。', relation:'端的' },
  { word:'妥当', reading:'だとう', meaning:'事情によく当てはまり適切であること', usage:'複数の資料から妥当な結論を選ぶ。', relation:'適切' },
  { word:'概念', reading:'がいねん', meaning:'物事の共通点をまとめた考え', usage:'自由という概念を例から考える。', relation:'観念' },
  { word:'相違', reading:'そうい', meaning:'二つのものの間に違いがあること', usage:'二つの意見の相違を整理する。', relation:'差異' },
  { word:'端的', reading:'たんてき', meaning:'要点を明確に示すさま', usage:'質問に端的な言葉で答える。', relation:'簡明' },
];

const argumentsData = [
  { theme:'制服の選択制', claim:'標準服を複数から選べるようにする', reason:'気候や体調に合わせやすくなる', evidence:'試行校の調査で多くの生徒が過ごしやすいと答えた', counter:'種類が増えると管理が複雑になる', reply:'色と素材を統一すれば管理上の混乱を抑えられる' },
  { theme:'地域清掃', claim:'学校と地域の合同清掃を学期ごとに行う', reason:'環境改善と交流を同時に進められる', evidence:'実施地域でごみの量と住民の苦情が減った', counter:'休日の参加負担が大きい', reply:'複数の日程から選べる方式にする' },
  { theme:'紙の使用量', claim:'配布物を必要に応じて電子化する', reason:'印刷と廃棄を減らせる', evidence:'校内調査で印刷物の一部が未使用のまま捨てられていた', counter:'端末を使えない場合がある', reply:'重要文書は紙も選べるようにする' },
  { theme:'図書館の開館時間', claim:'試験前だけ夕方の開館を延長する', reason:'静かな学習場所を確保できる', evidence:'生徒調査で放課後の利用希望が多かった', counter:'職員の負担が増える', reply:'期間を限定し当番を分担する' },
  { theme:'スマートフォン', claim:'使用禁止だけでなく情報モラルを授業で扱う', reason:'校外でも自分で判断する力が必要だからだ', evidence:'事例学習後に公開範囲を確認する生徒が増えた', counter:'授業で端末を扱うと集中が乱れる', reply:'操作時間と振り返り時間を明確に分ける' },
  { theme:'校庭の暑さ対策', claim:'日陰となる休憩場所を増やす', reason:'活動中の熱中症リスクを下げられる', evidence:'日陰の測定地点は日なたより暑さ指数が低かった', counter:'設置費用がかかる', reply:'可動式テントを必要な期間だけ使う' },
  { theme:'給食の食品ロス', claim:'食べられる量を申告できる仕組みを作る', reason:'配膳前に量を調整すれば残食を減らせる', evidence:'試行した学級で残食重量が減少した', counter:'少なく取り過ぎて栄養が不足する', reply:'基準量と栄養の説明を示して選ばせる' },
  { theme:'文化祭の広報', claim:'紙の案内とウェブ案内を併用する', reason:'異なる世代へ情報を届けられる', evidence:'来場者調査で情報を得た媒体が年代により異なった', counter:'二種類の作成に手間がかかる', reply:'元原稿を共通化して更新作業を減らす' },
  { theme:'自転車通学', claim:'定期的な安全講習を実施する', reason:'危険箇所と交通ルールを再確認できる', evidence:'講習後にヘルメット着用率が上がった', counter:'授業時間が減る', reply:'短時間の動画教材と実地確認を組み合わせる' },
  { theme:'校内の節電', claim:'教室ごとの使用電力を見える化する', reason:'行動の結果を確かめながら改善できる', evidence:'表示を始めた階で待機電力が減った', counter:'数値を競うだけになるおそれがある', reply:'快適さを保つ条件も評価に含める' },
];

const presentations = [
  { topic:'地域の防災', opening:'避難所までの道を実際に歩いた経験から始める', point:'危険箇所を平時に確認する必要がある', material:'危険箇所を書き込んだ地図', method:'地図を指しながら経路順に説明する', ending:'家族でも避難経路を確認しようと呼びかける' },
  { topic:'方言の魅力', opening:'祖母との会話で意味が分からなかった語を紹介する', point:'方言は地域の暮らしを伝える文化である', material:'標準語との対応表と音声', method:'実際の発音を聞かせて違いを示す', ending:'身近な方言を一語記録しようと提案する' },
  { topic:'食品ロス調査', opening:'給食後に量った残食重量を示す', point:'配膳時の工夫で残食を減らせる', material:'一週間の残食量の棒グラフ', method:'最大値と最小値を比較して原因を説明する', ending:'自分に合う量を伝えようと促す' },
  { topic:'読書の効用', opening:'一冊の本で考えが変わった体験を語る', point:'異なる立場を想像する力を読書で育てられる', material:'読書前後の感想の比較', method:'引用を短く示して変化を説明する', ending:'普段選ばない分野の本を勧める' },
  { topic:'商店街の歴史', opening:'昔と現在の同じ場所の写真を並べる', point:'商店街は地域の変化を記録している', material:'年代別の写真と聞き取り年表', method:'写真の共通点と相違点を順に示す', ending:'地域の記憶を聞き取って残そうと結ぶ' },
  { topic:'睡眠と学習', opening:'自分の睡眠時間を一週間記録した結果を示す', point:'学習計画には睡眠時間も組み込むべきだ', material:'睡眠時間と集中度の折れ線グラフ', method:'変化が対応した日を取り上げる', ending:'就寝時刻を一つ決めようと提案する' },
  { topic:'海岸のごみ', opening:'清掃で最も多く拾った物を見せる', point:'海へ流れる前にごみを減らす対策が必要だ', material:'種類別のごみの円グラフ', method:'割合の大きい項目から原因を説明する', ending:'使い捨て品を一つ減らそうと呼びかける' },
  { topic:'部活動紹介', opening:'活動中の短い音声を聞かせる', point:'成果だけでなく日々の協力に魅力がある', material:'年間活動の写真と予定表', method:'初心者の成長を時間順に示す', ending:'見学で活動の雰囲気を確かめてほしいと結ぶ' },
  { topic:'校内のバリアフリー', opening:'車いすで校内を移動した調査を紹介する', point:'設備と案内の両方を改善する必要がある', material:'移動に時間がかかった場所の校内図', method:'調査経路に沿って課題と改善案を示す', ending:'異なる立場で校内を見直そうと促す' },
  { topic:'星空観察', opening:'肉眼で見えた星の数を問いかける', point:'観察条件をそろえると空の明るさを比較できる', material:'場所別の観察結果と写真', method:'時刻と天候の条件を先に説明する', ending:'同じ時刻に地域の空を観察しようと誘う' },
];

const make = (id: string, n: number): GeneralProblem => {
  const i = n % 10, v = Math.floor(n / 10);
  if (id === 'KOKUGO_G8_U01') { const x=stories[i]; if(v===0)return{question:`小説「${x.title}」の中心となる人物関係は？`,answer:x.relation,options:choices(x.relation,stories.map(z=>z.relation),i),hint:'人物同士の関わりを整理しよう。'}; if(v===1)return{question:`小説「${x.title}」で心情を暗示する描写は？`,answer:x.cue,options:choices(x.cue,stories.map(z=>z.cue),i),hint:'言葉にされていない気持ちを行動から読もう。'}; if(v===2)return{question:`小説「${x.title}」の人物の変化は？`,answer:x.change,options:choices(x.change,stories.map(z=>z.change),i),hint:'出来事の前後を比べよう。'}; if(v===3)return{question:`小説「${x.title}」の転機は？`,answer:x.turn,options:choices(x.turn,stories.map(z=>z.turn),i),hint:'変化のきっかけを選ぼう。'}; return{question:`小説「${x.title}」の視点と主題の組合せは？`,answer:`${x.view}／${x.theme}`,options:choices(`${x.view}／${x.theme}`,stories.map(z=>`${z.view}／${z.theme}`),i),hint:'語り手と人物の変化を関連づけよう。'}; }
  if (id === 'KOKUGO_G8_U02') { const x=articles[i]; if(v===0)return{question:`論説「${x.title}」が取り上げる課題は？`,answer:x.issue,options:choices(x.issue,articles.map(z=>z.issue),i),hint:'問題提起を捉えよう。'}; if(v===1)return{question:`論説「${x.title}」の主張は？`,answer:x.claim,options:choices(x.claim,articles.map(z=>z.claim),i),hint:'筆者が必要だと述べることを選ぼう。'}; if(v===2)return{question:`主張「${x.claim}」を支える事実は？`,answer:x.evidence,options:choices(x.evidence,articles.map(z=>z.evidence),i),hint:'調査や観察の結果を選ぼう。'}; if(v===3)return{question:`論説「${x.title}」で事実から主張を導く論理は？`,answer:x.logic,options:choices(x.logic,articles.map(z=>z.logic),i),hint:'根拠と結論のつながりを読もう。'}; return{question:`論説「${x.title}」の構成は？`,answer:x.structure,options:choices(x.structure,articles.map(z=>z.structure),i),hint:'各部分の役割を整理しよう。'}; }
  if (id === 'KOKUGO_G8_U03') { const x=poems[i]; if(v===0)return{question:`「${x.text}」の形式は？`,answer:x.form,options:d(x.form,x.form==='俳句'?'短歌':'俳句','自由詩','漢詩'),hint:'音数と行のまとまりを見よう。'}; if(v===1)return{question:`「${x.text}」で用いられた表現の工夫は？`,answer:x.device,options:choices(x.device,poems.map(z=>z.device),i),hint:'比喩や感覚表現などに注目しよう。'}; if(v===2)return{question:`「${x.text}」の表現効果は？`,answer:x.effect,options:choices(x.effect,poems.map(z=>z.effect),i),hint:'表現が読み手に与える印象を考えよう。'}; if(v===3)return{question:`「${x.text}」が描く情景は？`,answer:x.image,options:choices(x.image,poems.map(z=>z.image),i),hint:'語句から場面を想像しよう。'}; return{question:`「${x.text}」の中心的な思いは？`,answer:x.theme,options:choices(x.theme,poems.map(z=>z.theme),i),hint:'情景と心情を関連づけよう。'}; }
  if (id === 'KOKUGO_G8_U04') { const x=classics[i]; if(v===0)return{question:`古文「${x.text}」の現代語訳は？`,answer:x.modern,options:choices(x.modern,classics.map(z=>z.modern),i),hint:'語句と文脈を対応させよう。'}; if(v===1)return{question:`古文「${x.text}」の重要語句は？`,answer:x.word,options:choices(x.word,classics.map(z=>z.word),i),hint:'古語の意味を確かめよう。'}; if(v===2)return{question:`古文「${x.text}」の表現上の要点は？`,answer:x.point,options:choices(x.point,classics.map(z=>z.point),i),hint:'比喩、反語、描写、語り方を見よう。'}; if(v===3)return{question:`「${x.text}」の出典は？`,answer:x.source,options:choices(x.source,classics.map(z=>z.source),i),hint:'作品と文章を結びつけよう。'}; return{question:`古文「${x.text}」を味わう読み方は？`,answer:'現代語訳だけでなく原文の調子や表現も確かめる',options:d('現代語訳だけでなく原文の調子や表現も確かめる','現代語訳だけを暗記する','漢字をすべて英語にする','出典を見ずに決める'),hint:'古文特有の言葉の響きにも注目しよう。'}; }
  if (id === 'KOKUGO_G8_U05') { const x=kanbun[i]; if(v===0)return{question:`漢文「${x.text}」の書き下し文は？`,answer:x.reading,options:choices(x.reading,kanbun.map(z=>z.reading),i),hint:'返り点と送り仮名を意識しよう。'}; if(v===1)return{question:`「${x.reading}」の意味は？`,answer:x.meaning,options:choices(x.meaning,kanbun.map(z=>z.meaning),i),hint:'文全体の意味を捉えよう。'}; if(v===2)return{question:`漢文「${x.text}」の訓読上の要点は？`,answer:x.point,options:choices(x.point,kanbun.map(z=>z.point),i),hint:'助字や否定・比較の形を見よう。'}; if(v===3)return{question:`漢文「${x.text}」から読み取れる教訓は？`,answer:x.lesson,options:choices(x.lesson,kanbun.map(z=>z.lesson),i),hint:'内容を自分の行動へ一般化しよう。'}; return{question:`漢文「${x.text}」を訓読する際の基本資料は？`,answer:'返り点・送り仮名・書き下し文',options:d('返り点・送り仮名・書き下し文','季語・切れ字・音数','人物・場面・語り手','主語・述語だけ'),hint:'漢文を日本語として読むきまりを確かめよう。'}; }
  if (id === 'KOKUGO_G8_U06') { const x=grammar[i]; if(v===0)return{question:`文「${x.sentence}」の「${x.word}」の品詞は？`,answer:x.kind,options:choices(x.kind,['動詞','形容詞','形容動詞','名詞','副詞'],i),hint:'活用と働きを確かめよう。'}; if(v===1)return{question:`「${x.word}」の基本形は？`,answer:x.base,options:choices(x.base,grammar.map(z=>z.base),i),hint:'辞書に載る形へ戻そう。'}; if(v===2)return{question:`文「${x.sentence}」の「${x.word}」の活用形は？`,answer:x.form,options:choices(x.form,['未然形','連用形','終止形','連体形','仮定形','命令形'],i),hint:'後ろに続く語と文中の働きを見よう。'}; if(v===3)return{question:`「${x.word}」を「${x.form}」と判断する理由は？`,answer:x.reason,options:choices(x.reason,grammar.map(z=>z.reason),i),hint:'接続する語や修飾先を確かめよう。'}; return{question:`文「${x.sentence}」で活用を判断する基本は？`,answer:'語形と後ろに続く語の関係を調べる',options:d('語形と後ろに続く語の関係を調べる','漢字の画数だけを見る','文の長さだけを数える','主語をすべて省く'),hint:'活用形は接続と働きに表れる。'}; }
  if (id === 'KOKUGO_G8_U07') { const x=vocabulary[i]; if(v===0)return{question:`「${x.word}」の読みは？`,answer:x.reading,options:choices(x.reading,vocabulary.map(z=>z.reading),i),hint:'語と読みを結びつけよう。'}; if(v===1)return{question:`「${x.word}」の意味は？`,answer:x.meaning,options:choices(x.meaning,vocabulary.map(z=>z.meaning),i),hint:'抽象語の意味を正確に捉えよう。'}; if(v===2)return{question:`「${x.word}」を適切に使った文は？`,answer:x.usage,options:choices(x.usage,vocabulary.map(z=>z.usage),i),hint:'意味と文脈が合う文を選ぼう。'}; if(v===3)return{question:`「${x.word}」と意味が近い語は？`,answer:x.relation,options:choices(x.relation,vocabulary.map(z=>z.relation),i),hint:'類義語の関係を考えよう。'}; return{question:`文章中の「${x.word}」の意味を確かめる方法は？`,answer:'前後の文脈と辞書の説明を照合する',options:d('前後の文脈と辞書の説明を照合する','読みだけで意味を決める','画数が多い意味を選ぶ','最初に思いついた意味で固定する'),hint:'語は文脈によって使われ方が定まる。'}; }
  if (id === 'KOKUGO_G8_U08') { const x=articles[i]; if(v===0)return{question:`文章「${x.title}」の要旨は？`,answer:x.claim,options:choices(x.claim,articles.map(z=>z.claim),i),hint:'筆者の中心的な主張を選ぼう。'}; if(v===1)return{question:`文章「${x.title}」の要約に残す課題は？`,answer:x.issue,options:choices(x.issue,articles.map(z=>z.issue),i),hint:'主張が答える問題を残そう。'}; if(v===2)return{question:`文章「${x.title}」の要約に残す根拠は？`,answer:x.evidence,options:choices(x.evidence,articles.map(z=>z.evidence),i),hint:'主張を直接支える事実を選ぼう。'}; if(v===3)return{question:`文章「${x.title}」の論理を要約する表現は？`,answer:x.logic,options:choices(x.logic,articles.map(z=>z.logic),i),hint:'根拠から主張へ至る理由を残そう。'}; return{question:`文章「${x.title}」を要約する時の構成は？`,answer:`${x.structure}の順序を保つ`,options:choices(`${x.structure}の順序を保つ`,articles.map(z=>`${z.structure}の順序を保つ`),i),hint:'元の論の進み方を崩さないようにしよう。'}; }
  if (id === 'KOKUGO_G8_U09') { const x=argumentsData[i]; if(v===0)return{question:`意見文「${x.theme}」の主張は？`,answer:x.claim,options:choices(x.claim,argumentsData.map(z=>z.claim),i),hint:'実現したい提案を選ぼう。'}; if(v===1)return{question:`主張「${x.claim}」の理由は？`,answer:x.reason,options:choices(x.reason,argumentsData.map(z=>z.reason),i),hint:'主張の必要性を説明する文を選ぼう。'}; if(v===2)return{question:`主張「${x.claim}」を支える根拠は？`,answer:x.evidence,options:choices(x.evidence,argumentsData.map(z=>z.evidence),i),hint:'調査や事実を選ぼう。'}; if(v===3)return{question:`主張「${x.claim}」への反対意見は？`,answer:x.counter,options:choices(x.counter,argumentsData.map(z=>z.counter),i),hint:'異なる立場の懸念を選ぼう。'}; return{question:`反対意見「${x.counter}」への適切な応答は？`,answer:x.reply,options:choices(x.reply,argumentsData.map(z=>z.reply),i),hint:'懸念を踏まえた改善策を選ぼう。'}; }
  if (id === 'KOKUGO_G8_U10') { const x=presentations[i]; if(v===0)return{question:`発表「${x.topic}」の導入として適切なのは？`,answer:x.opening,options:choices(x.opening,presentations.map(z=>z.opening),i),hint:'聞き手の関心を課題へつなげよう。'}; if(v===1)return{question:`発表「${x.topic}」の中心的な主張は？`,answer:x.point,options:choices(x.point,presentations.map(z=>z.point),i),hint:'最も伝えたい考えを選ぼう。'}; if(v===2)return{question:`発表「${x.topic}」に適した資料は？`,answer:x.material,options:choices(x.material,presentations.map(z=>z.material),i),hint:'主張を具体的に示す資料を選ぼう。'}; if(v===3)return{question:`資料「${x.material}」を効果的に示す方法は？`,answer:x.method,options:choices(x.method,presentations.map(z=>z.method),i),hint:'資料と説明の対応を考えよう。'}; return{question:`発表「${x.topic}」の結びとして適切なのは？`,answer:x.ending,options:choices(x.ending,presentations.map(z=>z.ending),i),hint:'主張を聞き手の行動へつなげよう。'}; }
  const x=argumentsData[i]; if(v===0)return{question:`討論「${x.theme}」で提案側が示す主張は？`,answer:x.claim,options:choices(x.claim,argumentsData.map(z=>z.claim),i),hint:'討論の論題に対する立場を確認しよう。'}; if(v===1)return{question:`討論で「${x.claim}」を支える客観的根拠は？`,answer:x.evidence,options:choices(x.evidence,argumentsData.map(z=>z.evidence),i),hint:'検証可能な事実を選ぼう。'}; if(v===2)return{question:`討論で提案「${x.claim}」へ予想される反論は？`,answer:x.counter,options:choices(x.counter,argumentsData.map(z=>z.counter),i),hint:'別の立場から問題点を考えよう。'}; if(v===3)return{question:`反論「${x.counter}」を受けた再提案は？`,answer:x.reply,options:choices(x.reply,argumentsData.map(z=>z.reply),i),hint:'反論を無視せず案を具体化しよう。'}; return{question:`討論「${x.theme}」で合意形成に必要な態度は？`,answer:'主張の共通点と相違点を根拠に沿って整理する',options:d('主張の共通点と相違点を根拠に沿って整理する','相手の発言を最後まで聞かない','声の大きさだけで結論を決める','論題と無関係な話へ移る'),hint:'勝敗ではなく考えの更新を目指そう。'};
};

const passageFor = (id: string, n: number): { passage: string; passageTitle: string } | null => {
  const i = n % 10;
  if (id === 'KOKUGO_G8_U01') return { passage: storyPassages[i], passageTitle: `小説「${stories[i].title}」本文` };
  if (id === 'KOKUGO_G8_U02' || id === 'KOKUGO_G8_U08') {
    const x=articles[i];
    return { passage:`${x.issue}が課題となっている。${x.evidence}。これは、${x.logic}である。したがって、${x.claim}。`, passageTitle:`論説「${x.title}」本文` };
  }
  if (id === 'KOKUGO_G8_U09' || id === 'KOKUGO_G8_U11') {
    const x=argumentsData[i];
    return { passage:`私は、${x.claim}べきだと考える。${x.reason}からだ。実際、${x.evidence}。一方で「${x.counter}」という意見もある。これに対して、${x.reply}。`, passageTitle:`意見文「${x.theme}」本文` };
  }
  if (id === 'KOKUGO_G8_U10') {
    const x=presentations[i];
    return { passage:`${x.opening}。私が伝えたいのは、${x.point}ということだ。${x.material}を使い、${x.method}。最後に、${x.ending}。`, passageTitle:`発表「${x.topic}」原稿` };
  }
  return null;
};

Object.keys(KOKUGO_G8_UNIT_DATA).forEach(id => {
  KOKUGO_G8_UNIT_DATA[id] = Array.from({ length: 50 }, (_, n) => {
    const problem=make(id,n), passage=passageFor(id,n);
    return passage ? { ...problem, ...passage } : problem;
  });
});

export const KOKUGO_G8_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G8_1: Object.values(KOKUGO_G8_UNIT_DATA).flat(),
  ...KOKUGO_G8_UNIT_DATA,
};
