import { GeneralProblem,d } from './utils';
export const KOKUGO_G6_UNIT_DATA:Record<string,GeneralProblem[]>={KOKUGO_G6_U01:[],KOKUGO_G6_U02:[],KOKUGO_G6_U03:[],KOKUGO_G6_U04:[],KOKUGO_G6_U05:[],KOKUGO_G6_U06:[],KOKUGO_G6_U07:[],KOKUGO_G6_U08:[],KOKUGO_G6_U09:[],KOKUGO_G6_U10:[]};
const c=(a:string,p:string[],i:number)=>{const r=[...p.slice(i+1),...p.slice(0,i+1),'本文からは判断できない','どれでもない'];return d(a,...[...new Set(r)].filter(v=>v!==a).slice(0,3));};
const lang=[
 {q:'「責任」を使う文',a:'自分の役割に責任を持つ。',read:'せきにん',meaning:'引き受けた役目を果たす務め',related:'任務'},
 {q:'「貴重」を使う文',a:'貴重な資料を保存する。',read:'きちょう',meaning:'非常に価値があり大切なこと',related:'重要'},
 {q:'「視野」を使う文',a:'多くの意見を聞いて視野を広げる。',read:'しや',meaning:'物事を考える範囲',related:'見方'},
 {q:'「推測」を使う文',a:'足跡から動物の動きを推測する。',read:'すいそく',meaning:'分かっていることから予想すること',related:'予想'},
 {q:'「尊重」を使う文',a:'話し合いで相手の考えを尊重する。',read:'そんちょう',meaning:'価値を認めて大切にすること',related:'敬意'},
 {q:'「検証」を使う文',a:'実験で仮説を検証する。',read:'けんしょう',meaning:'根拠を使って確かめること',related:'確認'},
 {q:'「批判」を使う文',a:'根拠を示して考えを批判する。',read:'ひはん',meaning:'よい点と問題点を根拠から検討すること',related:'吟味'},
 {q:'「貢献」を使う文',a:'清掃活動で地域に貢献する。',read:'こうけん',meaning:'人や社会の役に立つこと',related:'協力'},
 {q:'「構成」を使う文',a:'文章の構成を考えてから書く。',read:'こうせい',meaning:'全体の組み立て',related:'組立て'},
 {q:'「展望」を使う文',a:'卒業後の生活について展望を持つ。',read:'てんぼう',meaning:'これからの見通し',related:'見通し'},
];
const idioms=[
 {word:'試行錯誤',meaning:'試しと失敗を重ねて解決へ近づくこと',scene:'模型を何度も作り直す',wrong:'一度で完成させる',use:'試行錯誤して丈夫な橋の模型を作った。'},
 {word:'異口同音',meaning:'多くの人が同じことを言うこと',scene:'全員が同じ案に賛成する',wrong:'一人ずつ別の意見を言う',use:'参加者は異口同音に楽しかったと話した。'},
 {word:'臨機応変',meaning:'その場の状況に合わせて対応すること',scene:'雨で発表場所をすぐ変える',wrong:'計画が崩れても何もしない',use:'急な変更へ臨機応変に対応した。'},
 {word:'一長一短',meaning:'長所も短所もあること',scene:'二つの案の利点と欠点を比べる',wrong:'一方だけが完全だと決める',use:'どちらの方法にも一長一短がある。'},
 {word:'温故知新',meaning:'昔を学んで新しい知恵を得ること',scene:'古い記録から現代の防災を考える',wrong:'過去をすべて忘れる',use:'地域史を調べて温故知新の大切さを知った。'},
 {word:'優柔不断',meaning:'迷ってなかなか決められないこと',scene:'選択肢を前に決断できない',wrong:'根拠を決めてすぐ行動する',use:'優柔不断にならず判断基準を決めた。'},
 {word:'以心伝心',meaning:'言葉にしなくても気持ちが通じること',scene:'長年の仲間が目くばせで動く',wrong:'詳しい説明でも伝わらない',use:'二人は以心伝心で役割を入れ替えた。'},
 {word:'切磋琢磨',meaning:'仲間と励まし合って力を高めること',scene:'互いの作品へ助言して改善する',wrong:'他者の努力をじゃまする',use:'チームで切磋琢磨して記録を伸ばした。'},
 {word:'公明正大',meaning:'公平で隠し事がないこと',scene:'同じ基準で全案を評価する',wrong:'親しい人だけを選ぶ',use:'公明正大な手順で代表を決めた。'},
 {word:'創意工夫',meaning:'新しい考えを出して方法を改善すること',scene:'材料を変えて使いやすくする',wrong:'前例を考えずそのまま写す',use:'創意工夫を重ねて展示を見やすくした。'},
];
const stories=[
 {t:'直樹は委員長として全てを一人で決めていました。準備が遅れ、班員から「任せてほしい」と言われます。役割を話し合って分けると作業が進み、直樹は任せることも責任だと知りました。',who:'直樹',turn:'班員から任せてほしいと言われたこと',change:'一人で決める姿勢から仲間を信頼する姿勢へ変わった',symbol:'分担表',theme:'責任とは一人で抱えず力を生かすことでもある'},
 {t:'彩花は祖母の方言を古い言葉だと思っていました。地域の昔話を録音すると、方言でしか表せない温かな言い回しに気づきます。彩花は録音へ意味の説明も付けました。',who:'彩花',turn:'方言の温かな意味に気づいたこと',change:'古いという見方から残したいという思いへ変わった',symbol:'録音機',theme:'地域の言葉には文化と人の思いが宿る'},
 {t:'拓海は討論で勝つことだけを考え、反対意見を聞き流していました。しかし安全上の弱点を指摘され、案を見直します。改善案が採用され、拓海は反論の価値を理解しました。',who:'拓海',turn:'反対意見が案の弱点を示したこと',change:'勝敗重視から対話重視へ変わった',symbol:'書き直した提案書',theme:'反対意見は考えを深める材料になる'},
 {t:'真由は被災地の記事を読んで募金だけを考えました。現地の人の「必要な支援は時期で変わる」という言葉を知り、まず情報を調べてから行動することにしました。',who:'真由',turn:'必要な支援は時期で変わると知ったこと',change:'すぐ行動する姿勢から必要を確かめる姿勢へ変わった',symbol:'更新される支援一覧',theme:'支援では相手の必要を確かめることが大切'},
 {t:'悠は卒業制作の失敗部分を隠そうとしました。友達が過程も展示しようと提案し、作り直した跡を並べます。見学者が工夫の変化へ関心を示し、悠は失敗も作品の一部だと思いました。',who:'悠',turn:'失敗の過程も展示する提案を受けたこと',change:'失敗を隠す気持ちから学びとして示す考えへ変わった',symbol:'作り直した部品',theme:'失敗の過程は成長を伝える記録になる'},
 {t:'梨央は転校生へ日本の習慣を教える役になりました。説明するうち、自分も理由を知らない習慣が多いと気づきます。二人で調べ、互いの国の習慣を発表しました。',who:'梨央',turn:'自分も習慣の理由を知らないと気づいたこと',change:'教える側という意識から共に学ぶ姿勢へ変わった',symbol:'二つの国を結ぶ発表資料',theme:'異文化交流は一方的に教えるのでなく共に学ぶこと'},
 {t:'颯太はマラソンで友達に負け、努力は無駄だと言いました。前年の記録表を見ると自分は二分速くなっています。颯太は順位でなく成長を目標に次の計画を立てました。',who:'颯太',turn:'前年より記録が伸びたと分かったこと',change:'他人との比較から自分の成長を見る姿勢へ変わった',symbol:'二年分の記録表',theme:'成果は順位だけでなく自分の変化でも測れる'},
 {t:'美羽は公園の古木を危険だから切るべきだと考えました。調査で木が多くの生き物のすみかだと知り、危険な枝だけを整える案を提案します。',who:'美羽',turn:'古木が生き物のすみかだと知ったこと',change:'全て切る考えから安全と保全を両立する考えへ変わった',symbol:'古木の生き物地図',theme:'異なる価値を調べて両立策を探すことができる'},
 {t:'健は弟の作品を見てすぐ直す場所を教えました。弟が黙りこみ、母からまずよい所を聞いてみたらと言われます。健が感想をたずねると、弟は自分の工夫を話し始めました。',who:'健',turn:'弟が黙りこみ母から助言されたこと',change:'すぐ直す姿勢から相手の意図を聞く姿勢へ変わった',symbol:'弟の未完成の作品',theme:'助言の前に相手の意図を聞くことが大切'},
 {t:'葵は修学旅行の班行動で、自分の行きたい場所を主張しました。移動時間を地図で確かめると全ては回れません。班で優先順位を決め、全員が一つずつ希望をかなえました。',who:'葵',turn:'移動時間から全て回れないと分かったこと',change:'自分の希望優先から全員の納得を求める姿勢へ変わった',symbol:'書き直した行程表',theme:'限られた条件では対話と優先順位が必要'},
];
const articles=[
 {t:'情報は速さだけでなく正確さが必要です。災害時の未確認情報は避難を混乱させることがあります。発信元と日時を確かめ、公的情報と照合してから共有すべきです。',topic:'災害時の情報共有',claim:'情報は出典と日時を確認してから共有すべきだ',fact:'未確認情報が避難を混乱させることがある',reason:'誤情報が人の安全な判断を妨げるから',structure:'問題提起・危険性・解決策'},
 {t:'森林を守るには木を植えるだけでなく、育つまで管理する必要があります。地域に合わない木や手入れ不足の森では、土砂災害防止などの働きが十分に得られない場合があります。',topic:'森林の継続管理',claim:'植林後も地域に合った管理を続ける必要がある',fact:'手入れ不足では森林機能が弱まる場合がある',reason:'木が健康に育って初めて森林の働きが保たれるから',structure:'一般的な考え・問題点・主張'},
 {t:'多数決は決定方法の一つですが、少数意見を無視してよい仕組みではありません。決定前に理由を聞き、重大な不利益がないか確かめることで、より納得できる合意に近づきます。',topic:'多数決と少数意見',claim:'多数決の前に少数意見の理由と影響を検討すべきだ',fact:'多数決だけでは少数者に不利益が集中し得る',reason:'人数だけでは意見の重要性を測れないから',structure:'限定・問題点・改善策'},
 {t:'食品ロス削減では、捨てた量だけでなく理由を調べることが重要です。買いすぎ、作りすぎ、保存方法など原因が違えば、必要な対策も変わるからです。',topic:'食品ロスの原因分析',claim:'廃棄量とともに廃棄理由を調べる必要がある',fact:'食品を捨てる原因は複数ある',reason:'原因ごとに有効な対策が異なるから',structure:'主張・具体的原因・理由'},
 {t:'公共交通は利用者だけの問題ではありません。車を運転できない人の移動を支え、地域の病院や店の利用にも関わります。費用と地域全体への効果を合わせて考える必要があります。',topic:'公共交通の価値',claim:'公共交通は地域全体への効果も含めて考えるべきだ',fact:'通院や買い物を支えている',reason:'路線の影響は利用者以外にも及ぶから',structure:'見方の転換・事例・結論'},
 {t:'生成AIは文章作成を助けますが、出力が常に正しいとは限りません。事実を元資料で確認し、他者の表現や個人情報を不適切に使っていないか点検する責任は利用者にあります。',topic:'生成AIの責任ある利用',claim:'AI出力は人が事実と権利を確認して使う必要がある',fact:'AIは誤った内容を出すことがある',reason:'最終的に利用を決めるのは人だから',structure:'利点・限界・利用者の責任'},
 {t:'地域の伝統は形を変えず保存するだけでは続きません。担い手の生活や社会の変化に合わせつつ、何を大切に受け継ぐか話し合う必要があります。',topic:'伝統の継承',claim:'伝統は核心を確かめながら変化へ対応して受け継ぐべきだ',fact:'担い手の生活と社会は変化する',reason:'形を固定すると続けられない場合があるから',structure:'一般論への疑問・背景・提案'},
 {t:'生物多様性は種の数だけでは測れません。同じ種の中の違いや森林・湿地など環境の多様さも、変化へ対応する力を支えます。',topic:'生物多様性の範囲',claim:'種・個体差・生態系を合わせて守る必要がある',fact:'同じ種の中にも違いがある',reason:'複数の多様性が環境変化への適応を支えるから',structure:'誤解の修正・要素の追加・意義'},
 {t:'睡眠時間だけを増やしても、生活の質が必ず上がるとは限りません。就寝時刻の安定、運動、画面利用なども含め、日中の状態と合わせて見直すことが大切です。',topic:'睡眠と生活習慣',claim:'睡眠は時間だけでなく生活全体から見直すべきだ',fact:'睡眠には複数の生活習慣が関係する',reason:'一つの数字だけでは原因を特定できないから',structure:'単純化への注意・関連要因・結論'},
 {t:'防災計画は一度作れば終わりではありません。家族構成や町の様子は変わるため、訓練で課題を見つけ、連絡先や避難経路を更新する必要があります。',topic:'防災計画の更新',claim:'防災計画は訓練と環境変化に応じて更新すべきだ',fact:'家族構成や町の様子は変化する',reason:'古い計画では現在の危険へ対応できないから',structure:'誤解の否定・変化・改善方法'},
];
const args=[
 {theme:'校内スマートフォン規則',problem:'目的外利用や撮影によるトラブルがある',proposal:'学習目的と緊急連絡に用途を限定する',reason:'全面禁止より必要な利用と危険防止を両立できる',evidence:'行事調査では連絡利用の必要も示された',counter:'用途の判定が難しい',reply:'利用場所と時間を具体的に定める'},
 {theme:'地域図書館の開館時間',problem:'放課後に間に合わない利用者がいる',proposal:'週一回だけ閉館を一時間延長する',reason:'小さく試して利用数と負担を確認できる',evidence:'利用者アンケートで夕方希望が多かった',counter:'職員の負担が増える',reply:'期間限定で試行し勤務体制を検証する'},
 {theme:'学校の食品ロス',problem:'給食の残菜が多い日がある',proposal:'量の希望と残した理由を記録する',reason:'原因に合った改善策を考えられる',evidence:'料理別で残量に差があった',counter:'記録に時間がかかる',reply:'一週間だけ簡単な選択式で調べる'},
 {theme:'修学旅行の班行動',problem:'希望場所が多く時間内に回れない',proposal:'学習目的と移動時間で優先順位を決める',reason:'全員が納得できる基準になる',evidence:'地図計算で全候補は時間超過と分かった',counter:'行きたい気持ちが反映されにくい',reply:'各自の第一希望を一つずつ残す'},
 {theme:'学校の節電',problem:'無人の教室でも照明がついている',proposal:'最後に出る人が消灯を確認する表示を置く',reason:'特別な設備なしで継続できる',evidence:'一週間に複数回の消し忘れを記録した',counter:'責任者が曖昧になる',reply:'日直が最終確認する'},
 {theme:'公園の古木',problem:'落枝の危険と生態系保全が対立している',proposal:'専門家が危険枝を診断し必要部分だけ整える',reason:'安全と生き物のすみかを両立できる',evidence:'古木には複数の鳥や虫が確認された',counter:'診断や手入れに費用がかかる',reply:'伐採費用と長期管理費を比較する'},
 {theme:'災害情報の多言語化',problem:'日本語だけでは情報が届かない住民がいる',proposal:'やさしい日本語・図・複数言語を併用する',reason:'異なる人が理解できる経路を増やせる',evidence:'訓練で避難指示を理解できない例があった',counter:'翻訳準備に時間がかかる',reply:'平時に定型文と図記号を準備する'},
 {theme:'学級の話し合い',problem:'同じ人だけが発言しやすい',proposal:'個人メモと小グループ対話を先に行う',reason:'全員が考えを準備して共有できる',evidence:'試行時は発言者数が増えた',counter:'決定まで時間が長くなる',reply:'議題ごとに時間上限を設定する'},
 {theme:'地域清掃活動',problem:'参加者が固定され活動が続きにくい',proposal:'短時間参加と複数日程を用意する',reason:'生活に合わせて参加しやすくなる',evidence:'不参加理由で時間が合わないが多かった',counter:'運営回数が増える',reply:'受付を簡素化し地域団体で分担する'},
 {theme:'卒業制作の展示',problem:'完成品だけでは学習過程が伝わらない',proposal:'失敗例と改善メモも展示する',reason:'考え方の変化や工夫を伝えられる',evidence:'試作比較への見学者の質問が多かった',counter:'展示場所が足りない',reply:'写真と短い説明で過程をまとめる'},
];
const speeches=[
 {topic:'六年間で学んだ協力',opening:'わたしが六年間で最も変わったのは、協力への考え方です。',point:'協力は仕事を分けるだけでなく互いの考えを生かすこと',episode:'委員会で全員の得意を聞いて役割を変えた',lesson:'任せることも責任だと学んだ',ending:'中学校でも人の力を信じて行動したい'},
 {topic:'地域の言葉',opening:'祖母への聞き取りから、方言の価値を考えました。',point:'方言は地域の歴史と感情を伝える',episode:'標準語にしにくい温かな言い回しを教わった',lesson:'古いと決めつけず意味を知る必要がある',ending:'録音と説明を残して次の世代へ伝えたい'},
 {topic:'失敗からの発見',opening:'科学実験の失敗が、考えを変えました。',point:'予想外の結果にも調べる価値がある',episode:'データを消さず条件を見直して誤差原因を見つけた',lesson:'結果を正直に見ることが次の問いを作る',ending:'分からない結果を恐れず調べ続けたい'},
 {topic:'反対意見の価値',opening:'討論で反対意見に助けられた経験を話します。',point:'反論は案を弱くするのでなく改善できる',episode:'安全上の弱点を指摘され計画を修正した',lesson:'勝つより問題をよく解くことが大切',ending:'違う意見を考え直す材料として聞きたい'},
 {topic:'支援で大切なこと',opening:'募金活動を調べて、支援の考え方が変わりました。',point:'相手が必要とする支援を確かめるべきだ',episode:'必要物資は時期で変わるという現地の声を読んだ',lesson:'善意だけでなく情報と対話が必要',ending:'行動前に相手の声を調べる習慣を持ちたい'},
 {topic:'伝統を受け継ぐ',opening:'地域の祭りに参加して気づいたことがあります。',point:'伝統は形だけでなく意味を共有して続く',episode:'太鼓の打ち方と豊作を願う理由を教わった',lesson:'理由を知ると自分も伝えたいと思える',ending:'記録と参加の両方で祭りを支えたい'},
 {topic:'成長の測り方',opening:'マラソン大会で順位以外の成果を見つけました。',point:'成長は過去の自分との比較でも分かる',episode:'順位は下がったが記録は前年より二分速かった',lesson:'一つの数字だけで努力を判断しない',ending:'複数の見方で自分の前進を確かめたい'},
 {topic:'情報を確かめる',opening:'災害情報の調査から、共有前の確認を提案します。',point:'発信元・日時・根拠を確かめる必要がある',episode:'古い避難所情報が再投稿された例を調べた',lesson:'速さだけでなく正確さが安全を守る',ending:'公的情報と比べてから共有したい'},
 {topic:'異文化から学ぶ',opening:'転校生との交流で、教えることの意味が変わりました。',point:'交流は一方が教えるのでなく共に学ぶこと',episode:'日本の習慣の理由を二人で調べた',lesson:'自分の文化も問い直すことが理解につながる',ending:'知らない違いを質問できる人になりたい'},
 {topic:'卒業後の目標',opening:'中学校で続けたい探究について話します。',point:'地域の防災と情報伝達を学びたい',episode:'訓練で情報が届かない人がいると知った',lesson:'科学とコミュニケーションの両方が必要',ending:'調査と対話を重ね実行できる提案を作りたい'},
];
const memoirs=[
 {title:'任せることも責任',event:'委員会活動で役割分担を見直した',detail:'得意なことを聞いて広報・記録・進行を分けた',change:'一人で抱えるより仲間を信頼するようになった',future:'中学校でも互いの力を生かしたい'},
 {title:'予想外を大切に',event:'理科実験で予想と違う結果が出た',detail:'条件と記録を見直して誤差の原因を調べた',change:'失敗を隠すのでなく問いへ変えるようになった',future:'分からない結果を丁寧に調べたい'},
 {title:'言葉の向こう側',event:'地域の方言を祖母へ聞き取った',detail:'言い回しに地域の暮らしや感情がこめられていた',change:'古い言葉という見方から残したい文化へ変わった',future:'違う言葉の背景も学びたい'},
 {title:'反対意見から生まれた案',event:'学級討論で安全面の反論を受けた',detail:'反対理由を取り入れて利用場所と時間を決めた',change:'討論を勝敗でなく改善の場と考えるようになった',future:'異なる意見を根拠から聞きたい'},
 {title:'順位では見えない成長',event:'マラソン大会で目標順位に届かなかった',detail:'前年の記録と比べると二分速くなっていた',change:'他人との比較だけでなく自分の変化を見るようになった',future:'複数の目標で努力を確かめたい'},
 {title:'初めての修学旅行計画',event:'班で見学場所の優先順位を決めた',detail:'移動時間を調べ全員の第一希望を一つずつ残した',change:'自分の希望だけでなく条件と納得を考えるようになった',future:'対話しながら計画を立てたい'},
 {title:'地域清掃で知ったこと',event:'公園清掃の参加者を増やす案を作った',detail:'不参加理由を調べ短時間参加と複数日程を提案した',change:'呼びかけだけでなく参加しやすい条件を考えるようになった',future:'相手の事情を調べて行動したい'},
 {title:'一年生への読み聞かせ',event:'一年生へ物語を読んだ',detail:'反応を見て読む速さや本の向きを変えた',change:'上手に読むより相手へ届くことを意識するようになった',future:'聞き手に合わせた伝え方を磨きたい'},
 {title:'古木をめぐる調査',event:'公園の古木を残す方法を調べた',detail:'危険な枝と生き物のすみかを地図へ記録した',change:'切るか残すかの二択でなく両立策を考えるようになった',future:'異なる価値を調べて提案したい'},
 {title:'六年間の最後の合奏',event:'卒業式の合奏で全員の音を合わせた',detail:'速さより互いの呼吸を聞くことを大切にした',change:'自分の技術だけでなく全体の調和を見るようになった',future:'新しい仲間とも聞き合って活動したい'},
];

const make=(id:string,n:number):GeneralProblem=>{const v=n%5,i=Math.floor(n/5)%10;
 if(id==='KOKUGO_G6_U01'){const x=lang[i],word=x.q.match(/「([^」]+)」/)?.[1]??x.q;if(v===0)return{question:`${x.q}として正しいものは？`,answer:x.a,options:c(x.a,lang.map(z=>z.a),i),hint:'語の意味に合う文を選ぼう。'};if(v===1)return{question:`「${word}」の読みは？`,answer:x.read,options:c(x.read,lang.map(z=>z.read),i),hint:'読みと語句を結びつけよう。'};if(v===2)return{question:`「${word}」の意味は？`,answer:x.meaning,options:c(x.meaning,lang.map(z=>z.meaning),i),hint:'文脈で意味を確かめよう。'};if(v===3)return{question:`「${word}」と意味が近い語は？`,answer:x.related,options:c(x.related,lang.map(z=>z.related),i),hint:'語の関係を考えよう。'};return{question:`「${word}」を文章で使う時に大切なことは？`,answer:'意味と文脈が合うか確かめる',options:d('意味と文脈が合うか確かめる','画数だけで選ぶ','難しい語なら必ず使う','読みだけを合わせる'),hint:'伝えたい内容に合う語を選ぼう。'};}
 if(id==='KOKUGO_G6_U02'){const x=idioms[i];if(v===0)return{question:`四字熟語「${x.word}」の意味は？`,answer:x.meaning,options:c(x.meaning,idioms.map(z=>z.meaning),i),hint:'漢字の意味と使い方を考えよう。'};if(v===1)return{question:`「${x.word}」に合う場面は？`,answer:x.scene,options:c(x.scene,idioms.map(z=>z.scene),i),hint:'意味を具体的な場面へ当てはめよう。'};if(v===2)return{question:`「${x.word}」と反対に近い場面は？`,answer:x.wrong,options:c(x.wrong,idioms.map(z=>z.wrong),i),hint:'意味を比べよう。'};if(v===3)return{question:`「${x.word}」を正しく使った文は？`,answer:x.use,options:c(x.use,idioms.map(z=>z.use),i),hint:'熟語の意味に合う文を選ぼう。'};return{question:`「${x.word}」を使う効果は？`,answer:'複雑な状況を短い言葉で表せる',options:d('複雑な状況を短い言葉で表せる','事実確認が不要になる','文の意味を曖昧にする','どの場面でも同じ意味になる'),hint:'熟語がまとめて表す意味を考えよう。'};}
 if(id==='KOKUGO_G6_U03'){const x=stories[i];if(v===0)return{question:`物語「${x.t}」の中心人物は？`,answer:x.who,options:c(x.who,stories.map(z=>z.who),i),hint:'出来事の中心を見よう。'};if(v===1)return{question:`物語「${x.t}」の転機は？`,answer:x.turn,options:c(x.turn,stories.map(z=>z.turn),i),hint:'考えが変わるきっかけを選ぼう。'};if(v===2)return{question:`物語「${x.t}」の人物の変化は？`,answer:x.change,options:c(x.change,stories.map(z=>z.change),i),hint:'前半と後半を比べよう。'};if(v===3)return{question:`物語「${x.t}」で象徴的に使われた物は？`,answer:x.symbol,options:c(x.symbol,stories.map(z=>z.symbol),i),hint:'人物の変化と結びつく物を選ぼう。'};return{question:`物語「${x.t}」の主題は？`,answer:x.theme,options:c(x.theme,stories.map(z=>z.theme),i),hint:'転機と結末から考えよう。'};}
 if(id==='KOKUGO_G6_U04'){const x=articles[i];if(v===0)return{question:`説明「${x.t}」の話題は？`,answer:x.topic,options:c(x.topic,articles.map(z=>z.topic),i),hint:'何について論じているか見よう。'};if(v===1)return{question:`説明「${x.t}」の筆者の考えは？`,answer:x.claim,options:c(x.claim,articles.map(z=>z.claim),i),hint:'中心的な主張を選ぼう。'};if(v===2)return{question:`主張「${x.claim}」を支える事実は？`,answer:x.fact,options:c(x.fact,articles.map(z=>z.fact),i),hint:'本文の根拠を選ぼう。'};if(v===3)return{question:`説明「${x.t}」で示された理由は？`,answer:x.reason,options:c(x.reason,articles.map(z=>z.reason),i),hint:'事実と主張のつながりを読もう。'};return{question:`説明「${x.t}」の文章構成は？`,answer:x.structure,options:c(x.structure,articles.map(z=>z.structure),i),hint:'各文の役割を整理しよう。'};}
 if(id==='KOKUGO_G6_U05'){const x=articles[i];if(v===0)return{question:`文章「${x.t}」の要旨は？`,answer:x.claim,options:c(x.claim,articles.map(z=>z.claim),i),hint:'話題と筆者の考えをまとめよう。'};if(v===1)return{question:`文章「${x.t}」の要約で残す事実は？`,answer:x.fact,options:c(x.fact,articles.map(z=>z.fact),i),hint:'要旨を支える根拠を選ぼう。'};if(v===2)return{question:`要旨「${x.claim}」を支える論理は？`,answer:x.reason,options:c(x.reason,articles.map(z=>z.reason),i),hint:'なぜその主張になるかを見よう。'};if(v===3)return{question:`文章「${x.t}」の要約で文章構成をどう生かす？`,answer:`${x.structure}の順を保つ`,options:c(`${x.structure}の順を保つ`,articles.map(z=>`${z.structure}の順を保つ`),i),hint:'元の論理の流れを残そう。'};return{question:`文章「${x.t}」を要約する時の条件は？`,answer:'要旨と主要な根拠を意味を変えず短くする',options:d('要旨と主要な根拠を意味を変えず短くする','例を全て写す','自分の意見へ置き換える','結論だけを逆にする'),hint:'正確さと簡潔さを両立しよう。'};}
 if(id==='KOKUGO_G6_U06'){const x=args[i];if(v===0)return{question:`意見文「${x.theme}」が扱う問題は？`,answer:x.problem,options:c(x.problem,args.map(z=>z.problem),i),hint:'提案前の課題を明確にしよう。'};if(v===1)return{question:`問題「${x.problem}」への主張は？`,answer:x.proposal,options:c(x.proposal,args.map(z=>z.proposal),i),hint:'筆者の提案を選ぼう。'};if(v===2)return{question:`主張「${x.proposal}」の理由は？`,answer:x.reason,options:c(x.reason,args.map(z=>z.reason),i),hint:'主張を支える説明を選ぼう。'};if(v===3)return{question:`主張「${x.proposal}」の根拠は？`,answer:x.evidence,options:c(x.evidence,args.map(z=>z.evidence),i),hint:'調査や事実を選ぼう。'};return{question:`反対意見「${x.counter}」への応答は？`,answer:x.reply,options:c(x.reply,args.map(z=>z.reply),i),hint:'異なる考えをふまえて主張を補おう。'};}
 if(id==='KOKUGO_G6_U07'){const x=args[i];if(v===0)return{question:`提案「${x.theme}」で解決したい課題は？`,answer:x.problem,options:c(x.problem,args.map(z=>z.problem),i),hint:'現状の問題を選ぼう。'};if(v===1)return{question:`課題「${x.problem}」への具体的な提案は？`,answer:x.proposal,options:c(x.proposal,args.map(z=>z.proposal),i),hint:'何をどうするか選ぼう。'};if(v===2)return{question:`提案「${x.proposal}」で期待する効果は？`,answer:x.reason,options:c(x.reason,args.map(z=>z.reason),i),hint:'提案と目的を結びつけよう。'};if(v===3)return{question:`提案「${x.proposal}」の必要性を示す根拠は？`,answer:x.evidence,options:c(x.evidence,args.map(z=>z.evidence),i),hint:'現状を示す事実を選ぼう。'};return{question:`提案「${x.proposal}」を実行しやすくする改善は？`,answer:x.reply,options:c(x.reply,args.map(z=>z.reply),i),hint:'反対意見をふまえ具体化しよう。'};}
 if(id==='KOKUGO_G6_U08'){const x=args[i];if(v===0)return{question:`討論「${x.theme}」の賛成側の主張は？`,answer:x.proposal,options:c(x.proposal,args.map(z=>z.proposal),i),hint:'中心となる提案を聞こう。'};if(v===1)return{question:`討論「${x.theme}」で賛成側が示した事実上の根拠は？`,answer:x.evidence,options:c(x.evidence,args.map(z=>z.evidence),i),hint:'事実や調査結果を選ぼう。'};if(v===2)return{question:`主張「${x.proposal}」への反対意見は？`,answer:x.counter,options:c(x.counter,args.map(z=>z.counter),i),hint:'別の立場の懸念を選ぼう。'};if(v===3)return{question:`反対意見「${x.counter}」を受けた改善案は？`,answer:x.reply,options:c(x.reply,args.map(z=>z.reply),i),hint:'双方の考えを生かそう。'};return{question:`討論「${x.theme}」で最終判断に必要なことは？`,answer:'主張・根拠・反対意見・実行条件を比べる',options:d('主張・根拠・反対意見・実行条件を比べる','声の大きさで決める','最初の案を変えない','人数だけで理由を見ない'),hint:'複数の観点で評価しよう。'};}
 if(id==='KOKUGO_G6_U09'){const x=speeches[i];if(v===0)return{question:`スピーチ「${x.topic}」の導入は？`,answer:x.opening,options:c(x.opening,speeches.map(z=>z.opening),i),hint:'話題と関心を示す文を選ぼう。'};if(v===1)return{question:`スピーチ「${x.topic}」の中心は？`,answer:x.point,options:c(x.point,speeches.map(z=>z.point),i),hint:'一番伝えたい考えを選ぼう。'};if(v===2)return{question:`中心「${x.point}」を支える経験は？`,answer:x.episode,options:c(x.episode,speeches.map(z=>z.episode),i),hint:'具体的な出来事を選ぼう。'};if(v===3)return{question:`経験「${x.episode}」から得た学びは？`,answer:x.lesson,options:c(x.lesson,speeches.map(z=>z.lesson),i),hint:'経験と考えを結びつけよう。'};return{question:`スピーチ「${x.topic}」の結びは？`,answer:x.ending,options:c(x.ending,speeches.map(z=>z.ending),i),hint:'未来の行動へつなぐ文を選ぼう。'};}
 const x=memoirs[i];if(v===0)return{question:`卒業文集「${x.event}」に合う題名は？`,answer:x.title,options:c(x.title,memoirs.map(z=>z.title),i),hint:'経験と学びを表す題名を選ぼう。'};if(v===1)return{question:`卒業文集「${x.title}」の中心となる経験は？`,answer:x.event,options:c(x.event,memoirs.map(z=>z.event),i),hint:'何を振り返る文章か見よう。'};if(v===2)return{question:`経験「${x.event}」を具体的にする内容は？`,answer:x.detail,options:c(x.detail,memoirs.map(z=>z.detail),i),hint:'行動や事実を選ぼう。'};if(v===3)return{question:`経験「${x.event}」による考えの変化は？`,answer:x.change,options:c(x.change,memoirs.map(z=>z.change),i),hint:'経験前後の見方を比べよう。'};return{question:`卒業文集「${x.title}」の結びに合う将来の目標は？`,answer:x.future,options:c(x.future,memoirs.map(z=>z.future),i),hint:'経験から次の行動へつなげよう。'};
};
Object.keys(KOKUGO_G6_UNIT_DATA).forEach(id=>KOKUGO_G6_UNIT_DATA[id]=Array.from({length:50},(_,n)=>{const problem=make(id,n);if(id!=='KOKUGO_G6_U03')return problem;const index=Math.floor(n/5)%10,text=stories[index].t,label=`物語${index+1}`;return{...problem,question:problem.question.replace(`物語「${text}」`,label),passage:text,passageTitle:`${label} 本文`};}));
export const KOKUGO_G6_DATA:Record<string,GeneralProblem[]>={KOKUGO_G6_1:Object.values(KOKUGO_G6_UNIT_DATA).flat(),...KOKUGO_G6_UNIT_DATA};
