import { GeneralProblem,d } from './utils';
export const KOKUGO_G4_UNIT_DATA:Record<string,GeneralProblem[]>={KOKUGO_G4_U01:[],KOKUGO_G4_U02:[],KOKUGO_G4_U03:[],KOKUGO_G4_U04:[],KOKUGO_G4_U05:[],KOKUGO_G4_U06:[],KOKUGO_G4_U07:[],KOKUGO_G4_U08:[],KOKUGO_G4_U09:[]};
const c=(a:string,p:string[],i:number)=>{const r=[...p.slice(i+1),...p.slice(0,i+1),'書かれていない','どれでもない'];return d(a,...[...new Set(r)].filter(v=>v!==a).slice(0,3));};

const kanji=[
 {pair:'会う・合う',s1:'駅で友達に会う。',s2:'二人の答えが合う。',a1:'会う',a2:'合う',rule:'人と顔を合わせる時は「会う」、一致する時は「合う」'},
 {pair:'開く・空く',s1:'教室のまどを開く。',s2:'前の席が空く。',a1:'開く',a2:'空く',rule:'閉じた物をひらく時は「開く」、中身がなくなる時は「空く」'},
 {pair:'変える・代える',s1:'計画を変える。',s2:'係を妹と代える。',a1:'変える',a2:'代える',rule:'別の状態にする時は「変える」、役目を交代する時は「代える」'},
 {pair:'取る・採る',s1:'机の上の本を取る。',s2:'多数決を採る。',a1:'取る',a2:'採る',rule:'手にする時は「取る」、方法や意見を選ぶ時は「採る」'},
 {pair:'直す・治す',s1:'こわれた時計を直す。',s2:'けがを治す。',a1:'直す',a2:'治す',rule:'物やまちがいは「直す」、病気やけがは「治す」'},
 {pair:'暑い・熱い',s1:'今日はとても暑い。',s2:'熱いお茶を飲む。',a1:'暑い',a2:'熱い',rule:'気温は「暑い」、物の温度は「熱い」'},
 {pair:'早い・速い',s1:'朝早く起きる。',s2:'走るのが速い。',a1:'早い',a2:'速い',rule:'時刻は「早い」、動きは「速い」'},
 {pair:'聞く・聴く',s1:'先生に予定を聞く。',s2:'音楽を集中して聴く。',a1:'聞く',a2:'聴く',rule:'たずねたり音が入る時は「聞く」、注意して耳を向ける時は「聴く」'},
 {pair:'表す・現す',s1:'気持ちを言葉で表す。',s2:'雲の間から月が姿を現す。',a1:'表す',a2:'現す',rule:'意味を示す時は「表す」、姿を見せる時は「現す」'},
 {pair:'写す・映す',s1:'黒板の文をノートへ写す。',s2:'写真を画面に映す。',a1:'写す',a2:'映す',rule:'同じ形に書き取る時は「写す」、像を見せる時は「映す」'},
];
const jukugo=[
 {w:'登山',m:'山に登ること',x:'登る・山',type:'動作と相手',use:'夏休みに家族で登山をした。'},
 {w:'読書',m:'本を読むこと',x:'読む・書物',type:'動作と相手',use:'雨の日は教室で読書をする。'},
 {w:'強風',m:'強い風',x:'強い・風',type:'前の漢字が後をくわしくする',use:'強風で木の枝が大きくゆれた。'},
 {w:'青空',m:'青い空',x:'青い・空',type:'前の漢字が後をくわしくする',use:'雨上がりに青空が広がった。'},
 {w:'上下',m:'上と下',x:'上・下',type:'反対の意味を組み合わせる',use:'箱を上下に動かした。'},
 {w:'左右',m:'左と右',x:'左・右',type:'反対の意味を組み合わせる',use:'道路をわたる前に左右を見る。'},
 {w:'森林',m:'木が多く生える場所',x:'森・林',type:'似た意味を組み合わせる',use:'森林には多くの生き物がいる。'},
 {w:'道路',m:'人や車が通る道',x:'道・路',type:'似た意味を組み合わせる',use:'道路工事で道がせまくなった。'},
 {w:'開店',m:'店を開くこと',x:'開く・店',type:'動作と相手',use:'新しい店が九時に開店する。'},
 {w:'安心',m:'心配がなく心が落ち着くこと',x:'安らか・心',type:'前の漢字が後をくわしくする',use:'家族の声を聞いて安心した。'},
];
const dict=[
 {q:'「協力」の意味',tool:'国語辞典',way:'「きょうりょく」の最初の音から引く',info:'力を合わせること',other:'使い方の例も確かめる'},
 {q:'「観察」の使い方',tool:'国語辞典',way:'「かんさつ」を五十音順で引く',info:'物事を注意深く見ること',other:'「植物を観察する」と使う'},
 {q:'「静」の部首',tool:'漢字辞典',way:'部首や画数から引く',info:'部首は「青」',other:'読みと熟語も確かめる'},
 {q:'「議」の総画数',tool:'漢字辞典',way:'部首や音訓から引く',info:'総画数は二十画',other:'「会議」などの熟語も見る'},
 {q:'「成長」の反対に近い表現',tool:'国語辞典',way:'「せいちょう」を五十音順で引く',info:'育って大きくなること',other:'文脈に合う反対表現を考える'},
 {q:'「努」の読み',tool:'漢字辞典',way:'部首・画数・読みから引く',info:'音読みは「ド」',other:'「努力」という熟語を確かめる'},
 {q:'「おだやか」の意味',tool:'国語辞典',way:'「お」の見出しから引く',info:'静かで落ち着いているようす',other:'文中での使い方を見る'},
 {q:'「博物館」の「博」',tool:'漢字辞典',way:'部首や総画数から引く',info:'音読みは「ハク」',other:'同じ漢字を使う熟語を見る'},
 {q:'「たより」の複数の意味',tool:'国語辞典',way:'見出し語の意味番号を見る',info:'知らせ・助けになるものなど',other:'前後の文で意味を決める'},
 {q:'「省く」の読みと意味',tool:'国語辞典と漢字辞典',way:'読みが分かれば国語辞典、漢字からは漢字辞典',info:'必要でない部分を取り除くこと',other:'「手間を省く」と使う'},
];
const gist=[
 {t:'町の川では、地域の人が毎月ごみを拾っています。活動を続けた結果、水辺で見られる鳥が増えました。',topic:'川の清掃活動',fact:'毎月ごみを拾っている',claim:'清掃の継続で水辺の環境がよくなった',title:'鳥がもどった川',omit:'活動する人の名前'},
 {t:'学校図書館では、本の紹介カードを置きました。友達の感想を読んで本を選ぶ人が増え、貸出数も伸びました。',topic:'本の紹介カード',fact:'紹介後に貸出数が伸びた',claim:'紹介カードは本選びを助ける',title:'本と人をつなぐカード',omit:'カードの紙の色'},
 {t:'森林の土は雨水をたくわえ、少しずつ川へ流します。そのため、森林は急な増水をやわらげる働きをします。',topic:'森林と雨水',fact:'土が水をたくわえる',claim:'森林には川の急な増水をやわらげる働きがある',title:'水をたくわえる森林',omit:'木の本数'},
 {t:'地域の市場には近くでとれた野菜が集まります。運ぶ距離が短く、生産者と買う人が話せるよさもあります。',topic:'地域市場のよさ',fact:'近くの野菜が集まる',claim:'地域市場は生産者と消費者を近づける',title:'顔が見える市場',omit:'店の看板の色'},
 {t:'点字は六つの点の組み合わせで文字を表します。指で点のでこぼこにふれることで、文字を読み取れます。',topic:'点字の仕組み',fact:'六点の組み合わせを使う',claim:'点字は点のでこぼこを指で読める文字である',title:'指で読む文字',omit:'紙の大きさ'},
 {t:'台風が近づく前に、自治体は避難所を開きます。住民が早く安全な場所へ移れるよう情報も出します。',topic:'台風前の備え',fact:'避難所と情報を準備する',claim:'早い準備と情報が住民の安全を支える',title:'災害の前にできること',omit:'職員の人数'},
 {t:'大豆は、とうふ、みそ、しょうゆなどに加工されます。作り方を変えることで、形も味も異なる食品になります。',topic:'大豆の加工',fact:'多くの食品へ加工される',claim:'大豆は作り方によって多様な食品になる',title:'大豆の変身',omit:'食品の値段'},
 {t:'渡り鳥は季節に合わせて遠い土地へ移動します。食べ物や子育てに適した場所を求めて旅をするのです。',topic:'渡り鳥の移動',fact:'季節に合わせて移動する',claim:'渡り鳥は生活に適した場所を求めて移動する',title:'空をわたる旅',omit:'鳥の羽の色'},
 {t:'昔の道具には、地域で手に入る材料が使われました。材料と使い方を調べると、当時の暮らしが分かります。',topic:'昔の道具と暮らし',fact:'地域の材料を使っていた',claim:'昔の道具から当時の暮らしを読み取れる',title:'道具が語る暮らし',omit:'展示台の高さ'},
 {t:'学校では使わない電気を消す運動を始めました。一か月後、電気使用量が前月より減りました。',topic:'学校の節電',fact:'使用量が前月より減った',claim:'こまめな消灯は節電につながる',title:'みんなで減らした電気',omit:'スイッチの形'},
];
const stories=[
 {t:'航は係の発表資料を一人で作ろうとしましたが、時間が足りません。友達へ頼むと、地図と写真を分担してくれました。完成した資料を見て、航は肩の力が抜けました。',who:'航',act:'友達へ分担を頼んだ',why:'一人では時間が足りなかったから',change:'あせりから安心へ変わった',theme:'協力すると一人では難しいことも進められる'},
 {t:'美月は転校生へ声をかけたいと思いながら迷っていました。転校生が図書室の場所を探していると知り、案内しました。帰りには二人で好きな本の話をしました。',who:'美月',act:'図書室を案内した',why:'転校生が場所を探していたから',change:'迷いから親しみへ変わった',theme:'小さな親切が新しい関係を作る'},
 {t:'陸は育てたヘチマが台風でたおれ、がっかりしました。支柱を立て直すと、数日後につるが上へ伸び始めました。陸は毎朝見るのが楽しみになりました。',who:'陸',act:'支柱を立て直した',why:'ヘチマが台風でたおれたから',change:'落胆から期待へ変わった',theme:'手をかければ立ち直ることがある'},
 {t:'菜々は合唱で自分の声だけが大きいと注意されました。友達の声を聞きながら歌うと、全体の音がそろいました。録音を聞いた菜々は思わず笑顔になりました。',who:'菜々',act:'友達の声を聞いて歌った',why:'自分の声だけが大きかったから',change:'戸惑いから喜びへ変わった',theme:'周りを聞くことで全体がよくなる'},
 {t:'健太は試合で失敗した友達に何と言えばよいか分かりませんでした。黙って水筒を渡すと、友達は小さくうなずきました。二人は並んで次の試合を見ました。',who:'健太',act:'黙って水筒を渡した',why:'友達が失敗して落ちこんでいたから',change:'迷いから静かな理解へ変わった',theme:'言葉以外でも気持ちは伝えられる'},
 {t:'陽菜は自由研究の結果が予想と違い、失敗だと思いました。先生に結果も大切な発見だと言われ、条件を変えてもう一度試しました。ノートには新しい疑問が増えました。',who:'陽菜',act:'条件を変えて再実験した',why:'結果が予想と違ったから',change:'失望から探究心へ変わった',theme:'予想外の結果から新しい問いが生まれる'},
 {t:'翔は公園のベンチに古い手帳を見つけました。中に連絡先はなく、交番へ届けました。翌日、持ち主から礼の電話があり、翔は届けてよかったと思いました。',who:'翔',act:'手帳を交番へ届けた',why:'持ち主へ返したかったから',change:'気がかりから満足へ変わった',theme:'正しい行動が誰かの安心につながる'},
 {t:'結衣は弟が工作をこわしたと思い、強い声で責めました。ところが、棚から落ちたのだと分かりました。結衣は弟へ謝り、二人で直しました。',who:'結衣',act:'弟へ謝って工作を直した',why:'決めつけが間違いだと分かったから',change:'怒りから反省へ変わった',theme:'確かめずに決めつけてはいけない'},
 {t:'大樹は地域の祭りで太鼓をたたくことになりました。初めは音が合いませんでしたが、年上の人に教わり毎週練習しました。本番の音が広場へ響き、大樹の胸も震えました。',who:'大樹',act:'毎週太鼓を練習した',why:'祭りで音を合わせたかったから',change:'不安から達成感へ変わった',theme:'練習と交流が伝統をつなぐ'},
 {t:'真央は雨の日に一人で帰ろうとする一年生を見ました。かさへ入るよう声をかけ、家の近くまでいっしょに歩きました。別れ際の笑顔を見て心が温かくなりました。',who:'真央',act:'一年生をかさへ入れた',why:'一年生が雨の中で一人だったから',change:'心配から温かい気持ちへ変わった',theme:'相手を思う行動は自分の心も温める'},
];
const explains=[
 {t:'紙は木材などのせんいから作られます。古紙を回収して再利用すれば、新しく使う木材やごみを減らせます。',topic:'古紙の再利用',fact:'紙はせんいから作られる',reason:'木材とごみを減らせるから',example:'古紙を新しい紙へ再利用する',claim:'古紙回収は資源を大切にする方法だ'},
 {t:'海に流れたプラスチックは細かくなっても自然には消えにくい物です。生き物が食べることもあるため、町でごみを減らすことが海を守ります。',topic:'海のプラスチックごみ',fact:'細かくなっても消えにくい',reason:'生き物が食べることがあるから',example:'町で使い捨てごみを減らす',claim:'海を守るには陸上でごみを減らす必要がある'},
 {t:'地図の等高線は同じ高さの場所を結んだ線です。線の間がせまい所ほど、土地のかたむきが急です。',topic:'等高線の読み方',fact:'同じ高さを結ぶ線である',reason:'線の間隔が傾斜を表すから',example:'線がせまい場所は急な斜面',claim:'等高線の間隔から土地の傾きを読める'},
 {t:'発酵食品は微生物の働きを利用して作ります。例えば、乳酸菌を使うヨーグルトや、こうじを使うみそがあります。',topic:'発酵食品',fact:'微生物の働きを利用する',reason:'微生物が材料を変化させるから',example:'ヨーグルトやみそ',claim:'発酵では微生物が食品の味や性質を変える'},
 {t:'水は温められると水蒸気になり、上空で冷えると小さな水滴になります。その水滴が集まったものが雲です。',topic:'雲のでき方',fact:'水蒸気が冷えて水滴になる',reason:'水滴が集まると雲になるから',example:'温められた水が上空で冷える',claim:'雲は水蒸気が冷えてできた水滴の集まりだ'},
 {t:'地域の防災倉庫には水や毛布などが備えられています。しかし数には限りがあるため、各家庭でも備蓄が必要です。',topic:'災害への備蓄',fact:'防災倉庫の物資には限りがある',reason:'必要な物が全員へすぐ届くとは限らないから',example:'家庭で水や食料を備える',claim:'地域の備えに加え家庭の備蓄も必要だ'},
 {t:'渡り鳥は決まった季節に長い距離を移動します。星や太陽、地形などを手がかりに方向を知ると考えられています。',topic:'渡り鳥の方向感覚',fact:'季節に長距離を移動する',reason:'生活に適した場所へ移るため',example:'星や太陽を手がかりにする',claim:'渡り鳥は複数の手がかりで方向を知る'},
 {t:'点字ブロックには、進む方向を示す線状のものと、注意を示す点状のものがあります。場所に応じて使い分けられます。',topic:'点字ブロックの種類',fact:'線状と点状がある',reason:'移動と注意を伝え分けるため',example:'線状は進行、点状は注意',claim:'点字ブロックは形で異なる情報を伝える'},
 {t:'川の上流では流れが速く、大きな石も運ばれます。下流へ行くほど流れはゆるやかになり、細かな土砂が積もります。',topic:'川の流れと土地',fact:'上流は速く下流はゆるやか',reason:'場所によって傾きが変わるから',example:'下流に細かな土砂が積もる',claim:'川の流れは上流と下流で土地を異なる形にする'},
 {t:'地域の祭りには、豊作への願いや歴史上の出来事を伝えるものがあります。祭りを調べると地域の歴史や人々の思いが分かります。',topic:'地域の祭りの意味',fact:'願いや出来事を伝える祭りがある',reason:'地域の歴史や思いがこめられているから',example:'豊作を願う祭り',claim:'祭りは地域の歴史と人々の思いを伝える'},
];
const summaries=gist;
const opinions=[
 {theme:'学校に読書時間を増やす',claim:'朝に十分間の読書時間を設けたい',reason:'毎日少しずつ本に親しめるから',example:'今週は三冊の短い話を読めた',counter:'朝の準備時間が短くなる',reply:'開始時刻を守り準備を前日に行う'},
 {theme:'校庭に日かげを増やす',claim:'休けい用のテントを置きたい',reason:'暑い日も安全に休めるから',example:'運動会練習で日なたしか空いていなかった',counter:'設置や片づけに手間がかかる',reply:'当番と安全な手順を決める'},
 {theme:'給食の残りを減らす',claim:'食べられる量を最初に伝える仕組みがよい',reason:'無理なく食べ切れるから',example:'量を調整した日は残りが少なかった',counter:'配る時間が長くなる',reply:'配膳前にカードで希望を示す'},
 {theme:'学級新聞を作る',claim:'月に一度学級新聞を発行したい',reason:'活動や友達のよさを共有できるから',example:'係紹介の記事が好評だった',counter:'書く人へ負担が集中する',reply:'取材・文章・絵を分担する'},
 {theme:'地域清掃へ参加する',claim:'学期に一度公園清掃へ参加したい',reason:'使う場所を自分たちで守れるから',example:'前回はごみ袋三つ分を集めた',counter:'雨天時の予定が難しい',reply:'予備日を決めておく'},
 {theme:'教室の節電',claim:'休み時間の消灯当番を決めたい',reason:'使わない電気を減らせるから',example:'昼休みも全照明がついていた',counter:'暗い日は安全が心配だ',reply:'明るさを確認して必要な列は点灯する'},
 {theme:'話し合いのルール',claim:'発言前に前の意見を要約したい',reason:'意見のつながりが分かるから',example:'同じ意見の繰り返しが減った',counter:'話す時間が長くなる',reply:'一文で短く要約する'},
 {theme:'雨の日の遊び',claim:'教室遊びの道具箱を作りたい',reason:'安全に楽しく過ごせるから',example:'折り紙やカードが人気だった',counter:'片づけ忘れが増える',reply:'返却表と確認当番を作る'},
 {theme:'学校案内の改善',claim:'一年生向けに写真付き地図を作りたい',reason:'場所の特徴を見て分かるから',example:'言葉だけの地図では保健室を迷った',counter:'写真の更新が必要だ',reply:'毎年案内係が確認する'},
 {theme:'宿題の計画表',claim:'一週間の宿題計画表を使いたい',reason:'締切前にあわてず進められるから',example:'漢字練習を三日に分けられた',counter:'計画を書く時間がかかる',reply:'月曜日に五分だけ使う'},
];
const talks=[
 {topic:'町たんけんの発表',opening:'これから商店街で見つけた工夫を発表します。',point:'店ごとに品物の見せ方が違う',evidence:'八百屋は色別に、パン屋は種類別にならべていた',visual:'店の配置を示す地図',question:'なぜ店ごとにならべ方が違うのですか'},
 {topic:'ごみ分別の提案',opening:'学校のごみ分別を分かりやすくする提案です。',point:'ごみ箱へ絵の表示を付ける',evidence:'文字だけでは低学年が迷っていた',visual:'表示の見本',question:'絵はだれが作りますか'},
 {topic:'川の水質調査',opening:'地域の川で調べた結果を報告します。',point:'場所によって水のにごりが違った',evidence:'上流は透明で橋の近くは少しにごった',visual:'三地点の写真と表',question:'調べた日は同じですか'},
 {topic:'おすすめの本',opening:'わたしがおすすめする科学の本を紹介します。',point:'身近な疑問を実験で確かめられる',evidence:'氷がとける速さを比べる実験がある',visual:'本の表紙と実験ページ',question:'安全にできる実験ですか'},
 {topic:'防災バッグ',opening:'家庭で用意したい防災バッグについて話します。',point:'水・食料・明かりを優先する',evidence:'停電と断水を想定したため',visual:'持ち物一覧',question:'重すぎないですか'},
 {topic:'地域の祭り',opening:'秋祭りにこめられた願いを発表します。',point:'豊作への感謝を伝える祭りである',evidence:'古い記録と地域の人の話が一致した',visual:'昔と今の写真',question:'いつから続いていますか'},
 {topic:'節電の結果',opening:'一か月間の節電活動の結果です。',point:'電気使用量が前月より減った',evidence:'使用量の記録が百二十から百五へ減った',visual:'棒グラフ',question:'気温の違いは関係しませんか'},
 {topic:'学校の植物',opening:'校庭で見つけた植物を紹介します。',point:'日なたと日かげで種類が違う',evidence:'日なたにはタンポポ、日かげにはコケが多かった',visual:'場所を書いた校庭図',question:'数も調べましたか'},
 {topic:'点字ブロック',opening:'駅前の点字ブロック調査を報告します。',point:'線状と点状が場所で使い分けられていた',evidence:'通路は線状、階段前は点状だった',visual:'形と場所の写真',question:'交差点ではどうなっていますか'},
 {topic:'大豆の食品',opening:'大豆からできる食品について発表します。',point:'作り方で形も味も大きく変わる',evidence:'豆乳を固めるととうふ、発酵させるとみそになる',visual:'食品の関係図',question:'しょうゆはどう作りますか'},
];

const make=(id:string,n:number):GeneralProblem=>{const v=n%5,i=Math.floor(n/5)%10;
 if(id==='KOKUGO_G4_U01'){const x=kanji[i];if(v===0)return{question:`「${x.s1}」の使い方に合う漢字は？`,answer:x.a1,options:c(x.a1,kanji.map(z=>z.a1),i),hint:'文の意味で漢字を選ぼう。'};if(v===1)return{question:`「${x.s2}」の使い方に合う漢字は？`,answer:x.a2,options:c(x.a2,kanji.map(z=>z.a2),i),hint:'同じ読みの漢字を使い分けよう。'};if(v===2)return{question:`「${x.pair}」を使い分ける説明は？`,answer:x.rule,options:c(x.rule,kanji.map(z=>z.rule),i),hint:'二つの文の意味をくらべよう。'};if(v===3)return{question:`音を聞いて「${x.s1}」に合う漢字を選ぼう。`,answer:x.a1,options:c(x.a1,kanji.map(z=>z.a1),i),hint:'文の意味と読みを結びつけよう。',audioPrompt:{text:x.s1,lang:'ja-JP',autoPlay:true}};return{question:`「${x.pair}」のように同じ読みの漢字を使い分ける理由は？`,answer:'文の意味を正確に伝えるため',options:d('文の意味を正確に伝えるため','字数を増やすため','音を変えるため','文を短くするため'),hint:'漢字ごとの意味を考えよう。'};}
 if(id==='KOKUGO_G4_U02'){const x=jukugo[i];if(v===0)return{question:`熟語「${x.w}」の意味は？`,answer:x.m,options:c(x.m,jukugo.map(z=>z.m),i),hint:'漢字の組み合わせから考えよう。'};if(v===1)return{question:`「${x.w}」を漢字の意味に分けると？`,answer:x.x,options:c(x.x,jukugo.map(z=>z.x),i),hint:'一字ずつの意味を見よう。'};if(v===2)return{question:`「${x.w}」の組み立ては？`,answer:x.type,options:c(x.type,jukugo.map(z=>z.type),i),hint:'二つの漢字の関係を考えよう。'};if(v===3)return{question:`「${x.w}」を正しく使った文は？`,answer:x.use,options:c(x.use,jukugo.map(z=>z.use),i),hint:'熟語の意味に合う文を選ぼう。'};return{question:`「${x.w}」の意味を知らない時、まずできることは？`,answer:'一字ずつの意味を考えて辞典で確かめる',options:d('一字ずつの意味を考えて辞典で確かめる','読みだけで決める','文脈を見ない','似た字へ変える'),hint:'熟語の組み立てと辞典を使おう。'};}
 if(id==='KOKUGO_G4_U03'){const x=dict[i];if(v===0)return{question:`${x.q}を調べるのに向くものは？`,answer:x.tool,options:c(x.tool,dict.map(z=>z.tool),i),hint:'言葉か漢字かで辞典を選ぼう。'};if(v===1)return{question:`${x.q}を調べる方法は？`,answer:x.way,options:c(x.way,dict.map(z=>z.way),i),hint:'見出しや部首を使おう。'};if(v===2)return{question:`${x.q}について辞典から分かることは？`,answer:x.info,options:c(x.info,dict.map(z=>z.info),i),hint:'辞典の説明を確かめよう。'};if(v===3)return{question:`${x.q}をさらに理解するために何をする？`,answer:x.other,options:c(x.other,dict.map(z=>z.other),i),hint:'読み、意味、用例、熟語を関連づけよう。'};return{question:`${x.q}を調べた後に大切なことは？`,answer:'文の中で意味や使い方を確かめる',options:d('文の中で意味や使い方を確かめる','最初の意味だけ暗記する','ページ番号だけ覚える','辞典を閉じて使わない'),hint:'調べた言葉を実際の文で使おう。'};}
 if(id==='KOKUGO_G4_U04'){const x=gist[i];if(v===0)return{question:`文章「${x.t}」の話題は？`,answer:x.topic,options:c(x.topic,gist.map(z=>z.topic),i),hint:'何について書かれているか考えよう。'};if(v===1)return{question:`文章「${x.t}」で要旨を支える事実は？`,answer:x.fact,options:c(x.fact,gist.map(z=>z.fact),i),hint:'筆者の考えを支える事実を選ぼう。'};if(v===2)return{question:`文章「${x.t}」の要旨は？`,answer:x.claim,options:c(x.claim,gist.map(z=>z.claim),i),hint:'話題と一番伝えたいことを結ぼう。'};if(v===3)return{question:`文章「${x.t}」に合う題名は？`,answer:x.title,options:c(x.title,gist.map(z=>z.title),i),hint:'要旨が伝わる題名を選ぼう。'};return{question:`文章「${x.t}」の要旨をまとめる時、省いてよい情報は？`,answer:x.omit,options:c(x.omit,gist.map(z=>z.omit),i),hint:'中心内容との関係を確かめよう。'};}
 if(id==='KOKUGO_G4_U05'){const x=stories[i];if(v===0)return{question:`物語「${x.t}」の中心人物は？`,answer:x.who,options:c(x.who,stories.map(z=>z.who),i),hint:'出来事の中心を見よう。'};if(v===1)return{question:`物語「${x.t}」で中心人物がしたことは？`,answer:x.act,options:c(x.act,stories.map(z=>z.act),i),hint:'行動を読み取ろう。'};if(v===2)return{question:`物語「${x.t}」で、その行動をした理由は？`,answer:x.why,options:c(x.why,stories.map(z=>z.why),i),hint:'出来事と行動をつなげよう。'};if(v===3)return{question:`物語「${x.t}」の気持ちの変化は？`,answer:x.change,options:c(x.change,stories.map(z=>z.change),i),hint:'初めと終わりをくらべよう。'};return{question:`物語「${x.t}」から考えられる中心的な意味は？`,answer:x.theme,options:c(x.theme,stories.map(z=>z.theme),i),hint:'人物の変化から考えよう。'};}
 if(id==='KOKUGO_G4_U06'){const x=explains[i];if(v===0)return{question:`説明「${x.t}」の話題は？`,answer:x.topic,options:c(x.topic,explains.map(z=>z.topic),i),hint:'何を説明しているか見よう。'};if(v===1)return{question:`説明「${x.t}」で示された事実は？`,answer:x.fact,options:c(x.fact,explains.map(z=>z.fact),i),hint:'本文に書かれた事実を選ぼう。'};if(v===2)return{question:`説明「${x.t}」で示された理由は？`,answer:x.reason,options:c(x.reason,explains.map(z=>z.reason),i),hint:'なぜそう言えるかを読もう。'};if(v===3)return{question:`説明「${x.t}」で考えを分かりやすくする例は？`,answer:x.example,options:c(x.example,explains.map(z=>z.example),i),hint:'具体的な例を見つけよう。'};return{question:`説明「${x.t}」で筆者が伝えたい考えは？`,answer:x.claim,options:c(x.claim,explains.map(z=>z.claim),i),hint:'事実・理由・例をまとめよう。'};}
 if(id==='KOKUGO_G4_U07'){const x=summaries[i];if(v===0)return{question:`文章「${x.t}」を要約する時の中心話題は？`,answer:x.topic,options:c(x.topic,summaries.map(z=>z.topic),i),hint:'何についての文章か考えよう。'};if(v===1)return{question:`文章「${x.t}」で残すべき重要な事実は？`,answer:x.fact,options:c(x.fact,summaries.map(z=>z.fact),i),hint:'中心の考えを支える事実を選ぼう。'};if(v===2)return{question:`文章「${x.t}」の要約として最もよいものは？`,answer:x.claim,options:c(x.claim,summaries.map(z=>z.claim),i),hint:'大事な内容を短くまとめよう。'};if(v===3)return{question:`文章「${x.t}」を要約する時、省いてよい情報は？`,answer:x.omit,options:c(x.omit,summaries.map(z=>z.omit),i),hint:'中心と関係が弱い情報を選ぼう。'};return{question:`「${x.claim}」のような要約を作る時に大切なことは？`,answer:'本文の意味を変えず自分の言葉で短くする',options:d('本文の意味を変えず自分の言葉で短くする','細かい例をすべて写す','自分の感想を中心にする','本文にない情報を加える'),hint:'正確さと短さを両立しよう。'};}
 if(id==='KOKUGO_G4_U08'){const x=opinions[i];if(v===0)return{question:`テーマ「${x.theme}」についての意見は？`,answer:x.claim,options:c(x.claim,opinions.map(z=>z.claim),i),hint:'筆者が実現したいことを見よう。'};if(v===1)return{question:`意見「${x.claim}」の理由は？`,answer:x.reason,options:c(x.reason,opinions.map(z=>z.reason),i),hint:'意見を支える説明を選ぼう。'};if(v===2)return{question:`意見「${x.claim}」を支える具体例は？`,answer:x.example,options:c(x.example,opinions.map(z=>z.example),i),hint:'実際の出来事や数値を選ぼう。'};if(v===3)return{question:`意見「${x.claim}」に対して考えられる反対意見は？`,answer:x.counter,options:c(x.counter,opinions.map(z=>z.counter),i),hint:'別の立場の心配を考えよう。'};return{question:`反対意見「${x.counter}」への答えは？`,answer:x.reply,options:c(x.reply,opinions.map(z=>z.reply),i),hint:'心配へ具体的に答えよう。'};}
 const x=talks[i];if(v===0)return{question:`発表「${x.topic}」の始めの言葉は？`,answer:x.opening,options:c(x.opening,talks.map(z=>z.opening),i),hint:'話題を知らせる文を選ぼう。'};if(v===1)return{question:`発表「${x.topic}」の中心は？`,answer:x.point,options:c(x.point,talks.map(z=>z.point),i),hint:'一番伝えたいことを聞き取ろう。'};if(v===2)return{question:`発表「${x.topic}」で中心を支える事実は？`,answer:x.evidence,options:c(x.evidence,talks.map(z=>z.evidence),i),hint:'観察や記録を選ぼう。'};if(v===3)return{question:`発表「${x.topic}」に合う資料は？`,answer:x.visual,options:c(x.visual,talks.map(z=>z.visual),i),hint:'内容を見やすくする資料を選ぼう。'};return{question:`発表「${x.topic}」の後に、内容を深める質問は？`,answer:x.question,options:c(x.question,talks.map(z=>z.question),i),hint:'発表でまだ分からない点を聞こう。'};
};
Object.keys(KOKUGO_G4_UNIT_DATA).forEach(id=>KOKUGO_G4_UNIT_DATA[id]=Array.from({length:50},(_,n)=>{const problem=make(id,n);if(id!=='KOKUGO_G4_U05')return problem;const index=Math.floor(n/5)%10,text=stories[index].t,label=`物語${index+1}`;return{...problem,question:problem.question.replace(`物語「${text}」`,label),passage:text,passageTitle:`${label} 本文`};}));
export const KOKUGO_G4_DATA:Record<string,GeneralProblem[]>={KOKUGO_G4_1:Object.values(KOKUGO_G4_UNIT_DATA).flat(),...KOKUGO_G4_UNIT_DATA};
