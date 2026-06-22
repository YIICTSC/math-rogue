import { GeneralProblem,d } from './utils';
export const KOKUGO_G5_UNIT_DATA:Record<string,GeneralProblem[]>={KOKUGO_G5_U01:[],KOKUGO_G5_U02:[],KOKUGO_G5_U03:[],KOKUGO_G5_U04:[],KOKUGO_G5_U05:[],KOKUGO_G5_U06:[],KOKUGO_G5_U07:[],KOKUGO_G5_U08:[],KOKUGO_G5_U09:[]};
const c=(a:string,p:string[],i:number)=>{const r=[...p.slice(i+1),...p.slice(0,i+1),'本文からは分からない','どれでもない'];return d(a,...[...new Set(r)].filter(v=>v!==a).slice(0,3));};
const kanji=[
 {pair:'測る・計る',s1:'川の深さを測る。',s2:'作業時間を計る。',a1:'測る',a2:'計る',rule:'長さや量は「測る」、時間や数は「計る」'},
 {pair:'収める・納める',s1:'作品を箱に収める。',s2:'決められた会費を納める。',a1:'収める',a2:'納める',rule:'中へ入れる時は「収める」、渡すべき物を渡す時は「納める」'},
 {pair:'務める・勤める',s1:'司会を務める。',s2:'会社に勤める。',a1:'務める',a2:'勤める',rule:'役目を果たす時は「務める」、職場で働く時は「勤める」'},
 {pair:'移す・写す',s1:'いすを別の部屋へ移す。',s2:'資料の文をノートへ写す。',a1:'移す',a2:'写す',rule:'場所を変える時は「移す」、同じ内容を書き取る時は「写す」'},
 {pair:'作る・造る',s1:'学級新聞を作る。',s2:'工場で船を造る。',a1:'作る',a2:'造る',rule:'一般的な物は「作る」、大きな製品などは「造る」'},
 {pair:'治める・修める',s1:'国を治める。',s2:'学問を修める。',a1:'治める',a2:'修める',rule:'統治する時は「治める」、学問を身につける時は「修める」'},
 {pair:'検討・見当',s1:'二つの案を検討する。',s2:'答えの見当をつける。',a1:'検討',a2:'見当',rule:'よく調べる時は「検討」、おおよその予想は「見当」'},
 {pair:'対象・対照',s1:'五年生を調査の対象にする。',s2:'二つの資料を対照する。',a1:'対象',a2:'対照',rule:'目当てとなる物は「対象」、比べ合わせる時は「対照」'},
 {pair:'保証・保障',s1:'製品の品質を保証する。',s2:'生活の安全を保障する。',a1:'保証',a2:'保障',rule:'確かだと請け合う時は「保証」、権利や安全を守る時は「保障」'},
 {pair:'意志・意思',s1:'最後まで続ける意志を持つ。',s2:'参加する意思を伝える。',a1:'意志',a2:'意思',rule:'積極的な決意は「意志」、考えや意向は「意思」'},
];
const honor=[
 {plain:'先生が来る',respect:'先生がいらっしゃる',humble:'私が先生の所へうかがう',polite:'先生が来ます',scene:'校長先生の行動を話す'},
 {plain:'先生が見る',respect:'先生がご覧になる',humble:'私が資料を拝見する',polite:'先生が見ます',scene:'来客が展示を見る'},
 {plain:'先生が言う',respect:'先生がおっしゃる',humble:'私が申し上げる',polite:'先生が言います',scene:'先生の言葉を伝える'},
 {plain:'先生が食べる',respect:'先生が召し上がる',humble:'私がいただく',polite:'先生が食べます',scene:'来客の食事を話す'},
 {plain:'先生が知る',respect:'先生がご存じだ',humble:'私は存じている',polite:'先生が知っています',scene:'先生の知識をたずねる'},
 {plain:'先生がする',respect:'先生がなさる',humble:'私がいたす',polite:'先生がします',scene:'来客の予定を確認する'},
 {plain:'先生に会う',respect:'先生がお会いになる',humble:'私がお目にかかる',polite:'先生に会います',scene:'自分が先生へ会う'},
 {plain:'先生からもらう',respect:'先生がお受け取りになる',humble:'私が頂戴する',polite:'先生からもらいます',scene:'自分が先生から資料を受け取る'},
 {plain:'先生へ行く',respect:'先生が行かれる',humble:'私が参る',polite:'先生へ行きます',scene:'自分の移動をへりくだって話す'},
 {plain:'先生に聞く',respect:'先生がお聞きになる',humble:'私が先生にうかがう',polite:'先生に聞きます',scene:'自分が先生へ質問する'},
];
const stories=[
 {t:'悠斗は地域の清掃活動で、参加者が少ないことを残念に思いました。次の回へ向けて写真入りの案内を作ると、親子の参加が増えました。公園を見渡した悠斗は、自分にも町を変える力があると感じました。',who:'悠斗',act:'写真入りの案内を作った',why:'清掃活動の参加者を増やしたかったから',change:'残念な気持ちから自信へ変わった',theme:'工夫して行動すれば周囲を動かせる'},
 {t:'紗季は転校生の発音を友達がまねして笑うのを聞きました。笑いに加わらず、その言葉の意味を転校生へたずねました。新しい言葉を教わり、周りの友達も話を聞き始めました。',who:'紗季',act:'転校生へ言葉の意味をたずねた',why:'笑うのでなく相手を知りたかったから',change:'戸惑いから理解する喜びへ変わった',theme:'違いへの関心が理解を生む'},
 {t:'蓮は科学発表で予想と反対の結果が出て、データを外そうとしました。しかし班員に結果にも意味があると言われ、条件を調べ直しました。誤差の原因を見つけた時、失敗だと思った表が発見の手がかりに見えました。',who:'蓮',act:'反対の結果も残して条件を調べた',why:'予想外の結果の原因を知るため',change:'隠したい気持ちから探究心へ変わった',theme:'予想外の結果も学びの手がかりになる'},
 {t:'美咲は合奏で速く弾くことばかり考えていました。録音を聞くと音がばらばらです。友達の呼吸を見て弾くと音が重なり、美咲は上手さは速さだけではないと気づきました。',who:'美咲',act:'友達の呼吸を見て弾いた',why:'合奏の音をそろえたかったから',change:'速さへのこだわりから調和への理解へ変わった',theme:'周囲と合わせることも上手さである'},
 {t:'海斗は祖父の古い工具を捨てようとしました。祖父が一つずつ使い方を語ると、道具には家を直してきた記憶が重なっていると知りました。海斗は工具を手入れして残すことにしました。',who:'海斗',act:'工具を手入れして残した',why:'道具に家族の記憶があると知ったから',change:'不要という考えから大切にする思いへ変わった',theme:'物には人の記憶や歴史が宿る'},
 {t:'結菜は討論で自分と反対の意見を聞き、すぐ否定しようとしました。相手の理由をメモすると、自分の案に足りない安全面が見えました。結菜は二つの案を合わせた提案をしました。',who:'結菜',act:'反対意見の理由をメモした',why:'相手の考えを正確に知るため',change:'反発から改善への意欲へ変わった',theme:'反対意見は考えを深める材料になる'},
 {t:'大地は駅で白い杖を持つ人が立ち止まっているのを見ました。腕を引かずに手伝いが必要か声をかけると、階段の場所を教えてほしいと言われました。大地は相手の歩調に合わせて案内しました。',who:'大地',act:'必要な手伝いをたずねて案内した',why:'相手の意思を尊重して支えたかったから',change:'迷いから落ち着いた行動へ変わった',theme:'支援では相手の希望を確かめることが大切'},
 {t:'凛は班長として全部自分で決めていましたが、班員の表情が暗くなりました。意見を一人ずつ聞くと、絵が得意な人や調査が好きな人が分かりました。役割を変えると発表準備が進みました。',who:'凛',act:'班員の意見を聞いて役割を変えた',why:'班全体で準備を進めるため',change:'一人で決める姿勢から任せる姿勢へ変わった',theme:'力を生かすには意見を聞き役割を分ける必要がある'},
 {t:'蒼はマラソン大会で目標順位に届かず、練習は無駄だったと思いました。記録を見ると去年より一分速くなっています。蒼は順位だけでなく自分の変化も成果だと気づきました。',who:'蒼',act:'過去の記録と今回を比べた',why:'練習の成果を確かめるため',change:'失望から成長の実感へ変わった',theme:'成果は他人との順位だけでは測れない'},
 {t:'花は地域の祭りで外国から来た人が作法に迷っているのを見ました。決まりを注意する代わりに、理由を説明して一緒にやってみました。相手の笑顔を見て、伝統は教え合って続くと思いました。',who:'花',act:'祭りの作法と理由を説明した',why:'相手が作法に迷っていたから',change:'注意する考えから共有する考えへ変わった',theme:'文化は理由とともに伝えることで受け継がれる'},
];
const articles=[
 {t:'食品ロスとは、まだ食べられるのに捨てられる食品です。家庭では買う量を決め、期限を確認し、残り物を活用することで減らせます。',topic:'家庭の食品ロス',claim:'計画的な購入と活用で食品ロスを減らせる',fact:'食べられる食品も捨てられている',reason:'必要量と期限を管理できるから',example:'残り野菜をスープに使う'},
 {t:'森林は二酸化炭素を取りこむだけでなく、土に雨水をたくわえます。しかし木を植えるだけでは十分でなく、地域に合う種類を育て続ける管理が必要です。',topic:'森林の働きと管理',claim:'森林を守るには植林後の継続管理も必要だ',fact:'森林の土は雨水をたくわえる',reason:'植えた木が健康に育つとは限らないから',example:'地域に合う木を選び手入れする'},
 {t:'インターネットの情報はすぐ更新される一方、誤りも広がります。発信者、日付、根拠を確認し、複数の資料と比べることが必要です。',topic:'ネット情報の確認',claim:'ネット情報は出典と複数資料で確かめる必要がある',fact:'誤情報も速く広がる',reason:'一つの情報だけでは正確さを判断しにくいから',example:'公式発表と報道を照合する'},
 {t:'地域の公共交通は、通学や通院を支えます。利用者が減ると路線維持が難しくなるため、地域全体で必要な移動手段を考える必要があります。',topic:'地域の公共交通',claim:'地域全体で必要な交通を考える必要がある',fact:'公共交通は通学や通院を支える',reason:'利用者減少で路線維持が難しくなるから',example:'バスと予約型交通を組み合わせる'},
 {t:'プラスチックは軽く便利ですが、自然で分解されにくい物もあります。使い捨てを減らし、必要な物は回収して再利用することが海ごみ対策になります。',topic:'プラスチックごみ',claim:'使用削減と回収を組み合わせる必要がある',fact:'自然で分解されにくい物がある',reason:'海へ流れると長く残るから',example:'詰め替え容器を選ぶ'},
 {t:'災害時には同じ情報でも必要な伝え方が異なります。音声だけでなく文字や図、多言語を組み合わせると、より多くの人へ届きます。',topic:'災害情報の伝え方',claim:'災害情報は複数の方法で伝えるべきだ',fact:'人によって受け取りやすい方法が違う',reason:'一つの方法では届かない人がいるから',example:'放送と文字表示を併用する'},
 {t:'図書館は本を貸すだけでなく、調べ物の相談にも応じます。信頼できる資料の探し方を支えることで、地域の学びを助けています。',topic:'図書館の役割',claim:'図書館は情報探索を支える学びの拠点だ',fact:'調べ物の相談に応じる',reason:'必要な資料を一人で探すのは難しい場合があるから',example:'司書が資料の場所を案内する'},
 {t:'生物多様性は多くの生き物がいることだけではありません。生息場所や同じ種の中の違いも含み、環境変化への強さを支えます。',topic:'生物多様性',claim:'種・生息場所・個体差をまとめて守る必要がある',fact:'同じ種の中にも違いがある',reason:'多様性が環境変化への対応を支えるから',example:'異なる環境の森や湿地を残す'},
 {t:'睡眠中、体と脳は休み、学んだことの整理も進みます。夜更かしで睡眠が不足すると、翌日の集中や判断に影響します。',topic:'睡眠の役割',claim:'十分な睡眠は学習と健康に必要だ',fact:'睡眠中に学習内容の整理が進む',reason:'不足すると集中と判断が低下するから',example:'就寝前の画面時間を減らす'},
 {t:'地産地消には、運ぶ距離を短くし、生産者と消費者を近づけるよさがあります。一方、季節や量に限りがある点も考える必要があります。',topic:'地産地消',claim:'地産地消は長所と限界を理解して進めるべきだ',fact:'輸送距離を短くできる',reason:'地域産品だけでは量や季節に限りがあるから',example:'地域産と他地域産を適切に組み合わせる'},
];
const summaries=articles;
const opinions=[
 {theme:'学校へ給水機を置く',claim:'水筒へ補給できる給水機を設置したい',reason:'暑い日の水分補給と容器ごみ削減につながる',evidence:'夏の調査で水筒が空になった児童が多かった',counter:'設置と清掃に費用がかかる',reply:'利用人数と維持費を調べ試験設置する'},
 {theme:'宿題の選択制',claim:'一部の宿題を複数課題から選べるようにしたい',reason:'自分の課題に合う練習ができる',evidence:'アンケートで苦手分野が人により違った',counter:'学習量に差が出る',reply:'共通課題と選択課題を組み合わせる'},
 {theme:'校庭の植物地図',claim:'季節ごとの植物地図を作りたい',reason:'身近な自然の変化を継続観察できる',evidence:'春と秋で見られる花が大きく違った',counter:'更新の手間がかかる',reply:'学年ごとに季節を分担する'},
 {theme:'図書館の開館時間',claim:'週一回だけ放課後の開館を延ばしたい',reason:'委員会後にも本を借りられる',evidence:'閉館に間に合わないという意見があった',counter:'担当者の負担が増える',reply:'利用数を調べ当番と期間を限定する'},
 {theme:'食品ロス削減',claim:'給食前に量の希望を伝える仕組みを作りたい',reason:'無理なく食べ切れる量を選べる',evidence:'試行日は残菜が少なかった',counter:'配膳時間が長くなる',reply:'事前カードで希望を示す'},
 {theme:'地域防災訓練',claim:'子どもも地域防災訓練へ参加したい',reason:'避難場所と助け合い方を学べる',evidence:'学校外の避難所を知らない児童が多かった',counter:'休日の参加が難しい家庭もある',reply:'複数日程と家庭用資料を用意する'},
 {theme:'教室の換気',claim:'休み時間ごとに換気を確認する当番を置きたい',reason:'空気を入れ替える習慣が続く',evidence:'寒い日は窓を閉めたままになりやすかった',counter:'室温が下がる',reply:'短時間の換気と服装調整を組み合わせる'},
 {theme:'タブレット利用ルール',claim:'目的と時間を決めて使うルールが必要だ',reason:'学習外利用と目の疲れを減らせる',evidence:'調べ物後も画面を見続ける例があった',counter:'細かいルールは使いにくい',reply:'三つの基本原則だけに絞る'},
 {theme:'地域の店の紹介',claim:'商店街の紹介ページを学級で作りたい',reason:'店の工夫と地域のつながりを伝えられる',evidence:'町たんけんで初めて知った店が多かった',counter:'情報が古くなる',reply:'公開期間を決め店へ確認する'},
 {theme:'休み時間の過ごし方',claim:'静かに過ごす場所と体を動かす場所を分けたい',reason:'異なる過ごし方を互いにじゃましない',evidence:'読書中にボールが飛んできたことがある',counter:'使える場所がせまくなる',reply:'曜日ごとに場所を入れ替える'},
];
const reports=[
 {topic:'校内の水使用量',purpose:'節水できる場所を見つける',method:'三日間、場所別の使用回数を記録した',result:'手洗い場の使用が最も多かった',conclusion:'手洗い場の止水表示から改善する',visual:'場所別の棒グラフ'},
 {topic:'町のバリアフリー',purpose:'移動しやすい設備を調べる',method:'駅から図書館まで歩いて記録した',result:'歩道の段差と休憩場所の少なさが見つかった',conclusion:'段差案内とベンチが必要である',visual:'設備を書きこんだ地図'},
 {topic:'給食の残菜',purpose:'残りやすい料理を調べる',method:'一週間、料理別の残量を量った',result:'野菜料理の残量が多かった',conclusion:'味付けや量の理由を追加調査する',visual:'料理別の表'},
 {topic:'校庭の気温',purpose:'日なたと日かげの違いを調べる',method:'同じ時刻に三地点で測定した',result:'木かげが最も低温だった',conclusion:'暑い日の休憩場所に木かげが適する',visual:'地点別の折れ線グラフ'},
 {topic:'図書館の利用',purpose:'人気の本の種類を知る',method:'一か月の貸出記録を分類した',result:'物語と科学の本が多かった',conclusion:'人気分野の新刊紹介を増やす',visual:'分類別の円グラフ'},
 {topic:'地域のごみ',purpose:'多いごみの種類を調べる',method:'公園と通学路で種類別に数えた',result:'飲料容器が最も多かった',conclusion:'自動販売機周辺の回収方法を考える',visual:'場所と種類の表'},
 {topic:'睡眠時間',purpose:'睡眠と朝の調子の関係を調べる',method:'匿名アンケートで時間と体調を聞いた',result:'睡眠が短い群で眠気の回答が多かった',conclusion:'因果を断定せず生活習慣も調べる',visual:'睡眠時間別の棒グラフ'},
 {topic:'地域の防災設備',purpose:'避難時に使う設備を知る',method:'防災地図と現地を照合した',result:'倉庫と給水所の場所を確認できた',conclusion:'家族と経路を共有する必要がある',visual:'避難経路図'},
 {topic:'植物の分布',purpose:'日当たりと植物の関係を調べる',method:'日なたと日かげで種類を数えた',result:'場所により多い種類が違った',conclusion:'光以外の土や水分も調べる',visual:'場所別の写真と表'},
 {topic:'あいさつ運動',purpose:'活動前後の変化を調べる',method:'一週間ずつ通行人数とあいさつ数を記録した',result:'活動後にあいさつ数が増えた',conclusion:'時期の影響も考え継続調査する',visual:'前後比較の棒グラフ'},
];
const debates=opinions;
const speeches=[
 {topic:'心に残った本',opening:'一冊の本から学んだ勇気について話します。',point:'失敗後に助けを求める主人公が印象に残った',reason:'助けを求めることも強さだと気づいたから',example:'主人公が友達へ正直に話す場面',ending:'困った時に声を上げる勇気を持ちたい',delivery:'引用部分をゆっくり読む'},
 {topic:'地域の川',opening:'身近な川の変化について発表します。',point:'清掃活動後に水辺の生き物が増えた',reason:'ごみが減り生息場所が改善した可能性がある',example:'昨年より鳥の観察数が増えた',ending:'観察と清掃をこれからも続けたい',delivery:'前後の写真を示す'},
 {topic:'将来の仕事',opening:'わたしが関心を持つ防災の仕事を紹介します。',point:'災害前の備えを支える仕事がしたい',reason:'被害を小さくするには事前準備が重要だから',example:'地域訓練で避難経路を調べた経験',ending:'科学と地域について学び続けたい',delivery:'仕事と学びの関係図を示す'},
 {topic:'食品ロス',opening:'家庭でできる食品ロス対策を提案します。',point:'買い物前の在庫確認を習慣にする',reason:'同じ食品の買いすぎを防げる',example:'冷蔵庫一覧を作ると廃棄が減った',ending:'小さな確認を家族で続けたい',delivery:'一週間の記録表を示す'},
 {topic:'異文化交流',opening:'転校生から教わった言葉について話します。',point:'違いを質問すると交流のきっかけになる',reason:'笑ったり避けたりせず意味を知れるから',example:'挨拶の言葉を互いに教えた',ending:'知らない違いを学ぶ姿勢を大切にしたい',delivery:'言葉を正しい発音で紹介する'},
 {topic:'学校図書館',opening:'図書館をもっと使いやすくする案です。',point:'テーマ別のおすすめ棚を作る',reason:'分類番号だけでは迷う人も選びやすい',example:'環境月間に関連本を集める',ending:'本との新しい出会いを増やしたい',delivery:'棚の見取り図を示す'},
 {topic:'睡眠の大切さ',opening:'睡眠と学習の関係を調べました。',point:'十分な睡眠は翌日の集中を支える',reason:'脳と体の回復に時間が必要だから',example:'睡眠時間と朝の眠気の調査',ending:'就寝前の過ごし方を見直したい',delivery:'調査の限界も伝える'},
 {topic:'祭りの役割',opening:'地域の祭りが受け継ぐものを紹介します。',point:'祭りは歴史と人のつながりを伝える',reason:'世代をこえて準備や技術を共有するから',example:'年上の人から太鼓を習う活動',ending:'参加して記録を残したい',delivery:'昔と今の写真を比べる'},
 {topic:'プラスチック削減',opening:'使い捨てプラスチックを減らす提案です。',point:'繰り返し使える容器を選ぶ',reason:'ごみになる量を減らせる',example:'水筒利用でペットボトル購入が減った',ending:'無理なく続く方法を選びたい',delivery:'一週間の本数をグラフで示す'},
 {topic:'話し合いの力',opening:'反対意見から学んだ経験を話します。',point:'相手の理由を聞くと案を改善できる',reason:'自分が見落とした問題に気づけるから',example:'安全面を加えた学級遊びの案',ending:'違う意見を考える材料にしたい',delivery:'最初と改善後の案を対比する'},
];

const make=(id:string,n:number):GeneralProblem=>{const v=n%5,i=Math.floor(n/5)%10;
 if(id==='KOKUGO_G5_U01'){const x=kanji[i];if(v===0)return{question:`「${x.s1}」に合う漢字は？`,answer:x.a1,options:c(x.a1,kanji.map(z=>z.a1),i),hint:'文脈に合う漢字を選ぼう。'};if(v===1)return{question:`「${x.s2}」に合う漢字は？`,answer:x.a2,options:c(x.a2,kanji.map(z=>z.a2),i),hint:'同じ読みの意味を区別しよう。'};if(v===2)return{question:`「${x.pair}」の使い分けは？`,answer:x.rule,options:c(x.rule,kanji.map(z=>z.rule),i),hint:'二つの文をくらべよう。'};if(v===3)return{question:`音を聞いて「${x.s1}」に合う漢字を選ぼう。`,answer:x.a1,options:c(x.a1,kanji.map(z=>z.a1),i),hint:'文の意味と読みを結びつけよう。',audioPrompt:{text:x.s1,lang:'ja-JP',autoPlay:true}};return{question:`「${x.pair}」のような同音語を辞典で確かめる時に大切なことは？`,answer:'意味と用例を文脈に合わせて比べる',options:d('意味と用例を文脈に合わせて比べる','画数だけで決める','最初の漢字を選ぶ','音だけを聞く'),hint:'意味と使い方を調べよう。'};}
 if(id==='KOKUGO_G5_U02'){const x=honor[i];if(v===0)return{question:`「${x.plain}」を相手の動作を高める敬語にすると？`,answer:x.respect,options:c(x.respect,honor.map(z=>z.respect),i),hint:'尊敬語を選ぼう。'};if(v===1)return{question:`「${x.humble}」はどの種類の敬語？`,answer:'謙譲語',options:d('謙譲語','尊敬語','丁寧語','命令語'),hint:'自分側の動作をへりくだる表現か考えよう。'};if(v===2)return{question:`「${x.plain}」を「です・ます」を使う丁寧語にすると？`,answer:x.polite,options:c(x.polite,honor.map(z=>z.polite),i),hint:'文末を丁寧にしよう。'};if(v===3)return{question:`「${x.respect}」はどの種類の敬語？`,answer:'尊敬語',options:d('尊敬語','謙譲語','丁寧語','命令語'),hint:'相手の動作を高める表現か考えよう。'};return{question:`「${x.plain}」の敬語を選ぶ時に最初に確認することは？`,answer:'だれの動作をだれに伝えるか',options:d('だれの動作をだれに伝えるか','文の長さだけ','漢字の画数','声の大きさだけ'),hint:'人物の関係と場面を考えよう。'};}
 if(id==='KOKUGO_G5_U03'){const x=stories[i];if(v===0)return{question:`物語「${x.t}」の中心人物は？`,answer:x.who,options:c(x.who,stories.map(z=>z.who),i),hint:'出来事の中心を見よう。'};if(v===1)return{question:`物語「${x.t}」で中心人物がしたことは？`,answer:x.act,options:c(x.act,stories.map(z=>z.act),i),hint:'選択や行動を読み取ろう。'};if(v===2)return{question:`物語「${x.t}」で、その行動をした理由は？`,answer:x.why,options:c(x.why,stories.map(z=>z.why),i),hint:'出来事と考えを結びつけよう。'};if(v===3)return{question:`物語「${x.t}」の心情変化は？`,answer:x.change,options:c(x.change,stories.map(z=>z.change),i),hint:'前後の描写をくらべよう。'};return{question:`物語「${x.t}」の主題として最も近いものは？`,answer:x.theme,options:c(x.theme,stories.map(z=>z.theme),i),hint:'人物の変化と結末から考えよう。'};}
 if(id==='KOKUGO_G5_U04'){const x=articles[i];if(v===0)return{question:`説明「${x.t}」の話題は？`,answer:x.topic,options:c(x.topic,articles.map(z=>z.topic),i),hint:'何について論じているか見よう。'};if(v===1)return{question:`説明「${x.t}」の筆者の主張は？`,answer:x.claim,options:c(x.claim,articles.map(z=>z.claim),i),hint:'一番伝えたい考えを選ぼう。'};if(v===2)return{question:`主張「${x.claim}」を支える事実は？`,answer:x.fact,options:c(x.fact,articles.map(z=>z.fact),i),hint:'本文の事実を選ぼう。'};if(v===3)return{question:`説明「${x.t}」で示された理由は？`,answer:x.reason,options:c(x.reason,articles.map(z=>z.reason),i),hint:'主張と理由をつなげよう。'};return{question:`説明「${x.t}」で使われた具体例は？`,answer:x.example,options:c(x.example,articles.map(z=>z.example),i),hint:'考えを具体化する部分を選ぼう。'};}
 if(id==='KOKUGO_G5_U05'){const x=summaries[i];if(v===0)return{question:`文章「${x.t}」の要旨は？`,answer:x.claim,options:c(x.claim,summaries.map(z=>z.claim),i),hint:'話題と中心的な考えを結ぼう。'};if(v===1)return{question:`文章「${x.t}」を要約する時に残す事実は？`,answer:x.fact,options:c(x.fact,summaries.map(z=>z.fact),i),hint:'要旨を支える事実を選ぼう。'};if(v===2)return{question:`文章「${x.t}」の話題は？`,answer:x.topic,options:c(x.topic,summaries.map(z=>z.topic),i),hint:'何について書かれているか見よう。'};if(v===3)return{question:`要旨「${x.claim}」と事例「${x.example}」の関係は？`,answer:'事例が要旨を具体的に支えている',options:d('事例が要旨を具体的に支えている','事例が要旨と反対である','二つは無関係である','事例だけが文章全体の中心である'),hint:'中心と具体例を区別しよう。'};return{question:`文章「${x.t}」の要約として大切な条件は？`,answer:'要旨と主な根拠を短く正確に残す',options:d('要旨と主な根拠を短く正確に残す','例をすべてそのまま写す','自分の感想だけを書く','本文にない情報を足す'),hint:'要旨と要約の違いを意識しよう。'};}
 if(id==='KOKUGO_G5_U06'){const x=opinions[i];if(v===0)return{question:`テーマ「${x.theme}」についての意見は？`,answer:x.claim,options:c(x.claim,opinions.map(z=>z.claim),i),hint:'実現したい内容を見よう。'};if(v===1)return{question:`意見「${x.claim}」の理由は？`,answer:x.reason,options:c(x.reason,opinions.map(z=>z.reason),i),hint:'なぜそう考えるかを選ぼう。'};if(v===2)return{question:`意見「${x.claim}」を支える根拠は？`,answer:x.evidence,options:c(x.evidence,opinions.map(z=>z.evidence),i),hint:'観察や調査の事実を選ぼう。'};if(v===3)return{question:`意見「${x.claim}」への反対意見は？`,answer:x.counter,options:c(x.counter,opinions.map(z=>z.counter),i),hint:'別の立場の心配を考えよう。'};return{question:`反対意見「${x.counter}」への応答は？`,answer:x.reply,options:c(x.reply,opinions.map(z=>z.reply),i),hint:'懸念へ具体的に答えよう。'};}
 if(id==='KOKUGO_G5_U07'){const x=reports[i];if(v===0)return{question:`報告「${x.topic}」の調査目的は？`,answer:x.purpose,options:c(x.purpose,reports.map(z=>z.purpose),i),hint:'何を明らかにしたいか見よう。'};if(v===1)return{question:`報告「${x.topic}」の調査方法は？`,answer:x.method,options:c(x.method,reports.map(z=>z.method),i),hint:'どのように調べたか選ぼう。'};if(v===2)return{question:`報告「${x.topic}」で得られた結果は？`,answer:x.result,options:c(x.result,reports.map(z=>z.result),i),hint:'調査から分かった事実を選ぼう。'};if(v===3)return{question:`報告「${x.topic}」の考察・結論は？`,answer:x.conclusion,options:c(x.conclusion,reports.map(z=>z.conclusion),i),hint:'結果から考えたことを選ぼう。'};return{question:`報告「${x.topic}」に合う資料は？`,answer:x.visual,options:c(x.visual,reports.map(z=>z.visual),i),hint:'結果を分かりやすく示す資料を選ぼう。'};}
 if(id==='KOKUGO_G5_U08'){const x=debates[i];if(v===0)return{question:`討論「${x.theme}」の提案は？`,answer:x.claim,options:c(x.claim,debates.map(z=>z.claim),i),hint:'中心となる意見を聞き取ろう。'};if(v===1)return{question:`提案「${x.claim}」の理由は？`,answer:x.reason,options:c(x.reason,debates.map(z=>z.reason),i),hint:'意見と理由を結ぼう。'};if(v===2)return{question:`提案「${x.claim}」の根拠は？`,answer:x.evidence,options:c(x.evidence,debates.map(z=>z.evidence),i),hint:'事実や調査結果を選ぼう。'};if(v===3)return{question:`提案「${x.claim}」に対する反対意見は？`,answer:x.counter,options:c(x.counter,debates.map(z=>z.counter),i),hint:'異なる立場の懸念を聞こう。'};return{question:`反対意見「${x.counter}」をふまえた改善案は？`,answer:x.reply,options:c(x.reply,debates.map(z=>z.reply),i),hint:'双方の考えを生かそう。'};}
 const x=speeches[i];if(v===0)return{question:`スピーチ「${x.topic}」の導入は？`,answer:x.opening,options:c(x.opening,speeches.map(z=>z.opening),i),hint:'話題を示す始めの文を選ぼう。'};if(v===1)return{question:`スピーチ「${x.topic}」の中心は？`,answer:x.point,options:c(x.point,speeches.map(z=>z.point),i),hint:'一番伝えたいことを選ぼう。'};if(v===2)return{question:`中心「${x.point}」の理由は？`,answer:x.reason,options:c(x.reason,speeches.map(z=>z.reason),i),hint:'考えを支える説明を選ぼう。'};if(v===3)return{question:`スピーチ「${x.topic}」で使う具体例は？`,answer:x.example,options:c(x.example,speeches.map(z=>z.example),i),hint:'聞き手の理解を助ける例を選ぼう。'};return{question:`スピーチ「${x.topic}」の結びと話し方の工夫は？`,answer:`${x.ending}／${x.delivery}`,options:c(`${x.ending}／${x.delivery}`,speeches.map(z=>`${z.ending}／${z.delivery}`),i),hint:'内容と伝え方を組み合わせよう。'};
};
Object.keys(KOKUGO_G5_UNIT_DATA).forEach(id=>KOKUGO_G5_UNIT_DATA[id]=Array.from({length:50},(_,n)=>{const problem=make(id,n);if(id!=='KOKUGO_G5_U03')return problem;const index=Math.floor(n/5)%10,text=stories[index].t,label=`物語${index+1}`;return{...problem,question:problem.question.replace(`物語「${text}」`,label),passage:text,passageTitle:`${label} 本文`};}));
export const KOKUGO_G5_DATA:Record<string,GeneralProblem[]>={KOKUGO_G5_1:Object.values(KOKUGO_G5_UNIT_DATA).flat(),...KOKUGO_G5_UNIT_DATA};
