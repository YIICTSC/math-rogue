import { GeneralProblem,d } from './utils';
export const KOKUGO_G7_UNIT_DATA:Record<string,GeneralProblem[]>={KOKUGO_G7_U01:[],KOKUGO_G7_U02:[],KOKUGO_G7_U03:[],KOKUGO_G7_U04:[],KOKUGO_G7_U05:[],KOKUGO_G7_U06:[],KOKUGO_G7_U07:[],KOKUGO_G7_U08:[],KOKUGO_G7_U09:[],KOKUGO_G7_U10:[],KOKUGO_G7_U11:[],KOKUGO_G7_U12:[]};
const c=(a:string,p:string[],i:number)=>{const r=[...p.slice(i+1),...p.slice(0,i+1),'本文からは判断できない','どれでもない'];return d(a,...[...new Set(r)].filter(v=>v!==a).slice(0,3));};
const stories=[
 {t:'入学式の朝、颯は知らない顔ばかりの教室で、窓側の席に座った。隣の生徒が落とした鉛筆を拾うと、小さな「ありがとう」が返ってきた。颯は握っていた手をゆっくり開いた。',who:'颯',cue:'握っていた手をゆっくり開いた',change:'緊張から安心へ変わった',turn:'隣の生徒から礼を言われたこと',theme:'小さなやり取りが不安を和らげる'},
 {t:'美里は部活動の選考に落ち、練習をやめようとした。帰り道、先輩から「結果より、昨日できなかったことを数えよう」と言われた。翌朝、美里は練習ノートを開いた。',who:'美里',cue:'翌朝、練習ノートを開いた',change:'挫折から再挑戦へ変わった',turn:'先輩の言葉を聞いたこと',theme:'見方を変えると次の行動が生まれる'},
 {t:'亮は祖父の古いカメラを時代遅れだと思っていた。現像された写真に、今はない商店街が写っているのを見て、町の記録として残したいと思った。',who:'亮',cue:'町の記録として残したいと思った',change:'不要という見方から価値を認める見方へ変わった',turn:'昔の商店街の写真を見たこと',theme:'古い物は過去を伝える資料にもなる'},
 {t:'結衣は班の発表で自分の案が選ばれず黙りこんだ。発表後、別案に自分の調査結果が使われていると気づく。結衣は「次は先に共有する」と班員へ伝えた。',who:'結衣',cue:'次は先に共有すると伝えた',change:'不満から協働への意欲へ変わった',turn:'自分の調査が別案に生かされたと知ったこと',theme:'案が選ばれなくても貢献は生かせる'},
 {t:'海斗は転校生の名前を何度も言い間違え、照れ笑いで済ませていた。転校生が静かに正しい発音を教えると、海斗はノートへ音を書き取り、もう一度呼び直した。',who:'海斗',cue:'正しい発音でもう一度呼び直した',change:'軽く考える姿勢から相手を尊重する姿勢へ変わった',turn:'転校生本人から発音を教わったこと',theme:'名前を正しく呼ぶことは相手への尊重になる'},
 {t:'奈央は合唱練習で声が出ない友人を怠けていると思った。後で喉を痛めていると知り、責めたことを謝った。奈央は状況を確かめる前に判断しないと決めた。',who:'奈央',cue:'状況を確かめる前に判断しないと決めた',change:'決めつけから慎重な理解へ変わった',turn:'友人が喉を痛めていると知ったこと',theme:'事情を知らずに人を判断してはいけない'},
 {t:'拓真は地域清掃で黙々とごみを拾う高齢者に気づいた。話を聞くと、子どもの頃に遊んだ川を残したいという。拓真には川辺の景色が少し違って見えた。',who:'拓真',cue:'川辺の景色が少し違って見えた',change:'単なる清掃から思いを受け継ぐ活動という見方へ変わった',turn:'高齢者の思いを聞いたこと',theme:'行動の背景を知ると場所の見え方が変わる'},
 {t:'沙羅は討論で反対意見を聞く間、次の反論ばかり考えていた。相手の発言を要約する課題で、自分が理由を誤解していたと知る。沙羅は質問からやり直した。',who:'沙羅',cue:'質問からやり直した',change:'論破する姿勢から理解する姿勢へ変わった',turn:'相手の理由を誤解していたと気づいたこと',theme:'対話では反論より先に理解が必要'},
 {t:'陸は大会で目標順位に届かず、努力は無駄だったと言った。顧問が前年の記録を示すと三十秒縮まっていた。陸は順位表の横に自分の記録を書き加えた。',who:'陸',cue:'順位表の横に自分の記録を書き加えた',change:'他人との比較から自分の成長を見る姿勢へ変わった',turn:'前年より記録が伸びたと知ったこと',theme:'成果は順位だけでなく過去の自分との比較でも測れる'},
 {t:'杏は文化祭の展示を完成品だけにしようとした。友人が失敗した試作品も並べると、来場者は改良点を熱心に質問した。杏は失敗の跡も学びを語ると知った。',who:'杏',cue:'失敗の跡も学びを語ると知った',change:'失敗を隠す考えから過程を示す考えへ変わった',turn:'来場者が試作品へ関心を示したこと',theme:'試行錯誤の過程にも伝える価値がある'},
];
const articles=[
 {t:'情報の信頼性は、内容だけでなく発信者、日時、根拠から判断する必要がある。特に災害時は古い情報の再拡散が安全な行動を妨げるため、公的情報との照合が欠かせない。',topic:'情報の信頼性',claim:'発信者・日時・根拠を確認し公的情報と照合すべきだ',fact:'古い情報の再拡散が安全行動を妨げる',reason:'内容だけでは現在も正しいか判断できないから',structure:'原則・具体的危険・結論'},
 {t:'多数決は効率的な決定方法だが、少数意見を無視してよいわけではない。決定前に理由と影響を検討すれば、人数だけでは見えない問題を補える。',topic:'多数決と少数意見',claim:'多数決前に少数意見の理由と影響を検討すべきだ',fact:'人数だけでは重要な問題を見落とし得る',reason:'少数者へ重大な不利益が集中する場合があるから',structure:'利点・限定・改善策'},
 {t:'地域の公共交通は、利用者数だけで価値を測れない。通学や通院を支え、地域の店や病院の維持にも関わるため、地域全体への効果を含めて考える必要がある。',topic:'公共交通の価値',claim:'公共交通は地域全体への効果も含めて評価すべきだ',fact:'通学・通院や地域施設の利用を支える',reason:'影響が直接の利用者以外にも及ぶから',structure:'問題提起・複数の効果・結論'},
 {t:'生成AIは文章作成を助ける一方、誤った情報や既存表現に似た文章を出すことがある。出力の事実と権利を確認する責任は、利用を決める人に残る。',topic:'生成AIの利用責任',claim:'AI出力は人が事実と権利を確認して使う必要がある',fact:'AIは誤情報や類似表現を出すことがある',reason:'最終的に公開や提出を決めるのは人だから',structure:'利点・問題点・責任'},
 {t:'食品ロス削減では、捨てた量だけでなく理由を調べるべきだ。買いすぎ、作りすぎ、保存の失敗では対策が異なるため、原因別の記録が改善につながる。',topic:'食品ロスの原因分析',claim:'廃棄量とともに廃棄理由を調べるべきだ',fact:'食品を捨てる原因は複数ある',reason:'原因によって有効な対策が違うから',structure:'主張・原因例・理由'},
 {t:'伝統文化は形を変えず保存するだけでは続かない。担い手の生活や社会の変化に合わせながら、何を大切に継承するか話し合う必要がある。',topic:'伝統文化の継承',claim:'伝統の核心を確かめつつ変化へ対応すべきだ',fact:'担い手の生活と社会は変化する',reason:'形を固定すると継続困難になる場合があるから',structure:'一般論への疑問・背景・提案'},
 {t:'生物多様性は種の数だけを指さない。同じ種の中の違いと、森林や湿地など環境の多様さも、変化へ対応する力を支えている。',topic:'生物多様性の範囲',claim:'種・個体差・生態系を合わせて守る必要がある',fact:'同じ種の中にも違いがある',reason:'複数の多様性が環境変化への適応を支えるから',structure:'誤解の修正・要素の追加・意義'},
 {t:'睡眠は時間だけでなく質や生活リズムも重要だ。就寝時刻、運動、画面利用などを日中の状態と合わせて見なければ、原因に合う改善はできない。',topic:'睡眠と生活リズム',claim:'睡眠は時間だけでなく生活全体から見直すべきだ',fact:'睡眠には複数の生活習慣が関係する',reason:'一つの数字だけでは原因を特定できないから',structure:'単純化への注意・関連要因・結論'},
 {t:'防災計画は一度作れば終わりではない。家族構成や町の状況は変わるため、訓練で課題を見つけ、連絡先や避難経路を更新する必要がある。',topic:'防災計画の更新',claim:'防災計画は訓練と環境変化に応じ更新すべきだ',fact:'家族構成や町の状況は変化する',reason:'古い計画では現在の危険へ対応できないから',structure:'誤解の否定・変化・改善方法'},
 {t:'オンライン交流は遠方の人と話せるが、表情や声の情報が少ない場合もある。短い文を悪意と決めつけず、重要な内容は確認し直す姿勢が必要だ。',topic:'オンライン交流の誤解',claim:'文字情報だけで意図を断定せず確認すべきだ',fact:'オンラインでは非言語情報が少ない場合がある',reason:'同じ短文でも複数の意図があり得るから',structure:'利点・制約・対策'},
];
const poems=[
 {text:'朝の窓／まだ名のない光が／机の角を／そっと起こす',image:'朝日が机へ差しこむ情景',device:'光を人のように表す擬人法',effect:'静かな一日の始まりを感じさせる',title:'目覚める机',mood:'静かで新鮮な気分'},
 {text:'雨粒は／屋根で小さな太鼓になり／町の眠りを／細かくたたく',image:'夜の町へ雨音が響く情景',device:'雨音を太鼓にたとえる比喩',effect:'雨の音を具体的に想像させる',title:'雨の太鼓',mood:'落ち着きの中に動きがある'},
 {text:'帰り道／言えなかった言葉だけが／かばんの底で／重くなる',image:'伝えられない思いを抱えて歩く情景',device:'言葉に重さを与える比喩',effect:'後悔の強さを物の重さで示す',title:'かばんの底',mood:'重くためらう気分'},
 {text:'風よ／もう一度／あの雲を／こちらへ運べ',image:'雲を待ちながら風へ呼びかける情景',device:'風への呼びかけと短い行分け',effect:'願いの切実さを強める',title:'風への願い',mood:'強い期待'},
 {text:'白い息／白い道／白い朝に／赤い手袋',image:'雪の朝に赤い手袋が目立つ情景',device:'「白い」の反復と色の対比',effect:'白い世界と赤色の印象を強める',title:'赤い手袋',mood:'冷たさの中の温かさ'},
 {text:'川は知っている／山の雪も／町の橋も／海の広さも',image:'川が山から海まで流れる情景',device:'川が知るという擬人法',effect:'川の長い旅とつながりを示す',title:'川の記憶',mood:'広がりと悠久さ'},
 {text:'一枚の葉が落ちる／それだけで／秋は／音を持つ',image:'静かな中で葉が落ちる情景',device:'秋に音を持たせる表現',effect:'小さな音で季節の変化を示す',title:'秋の音',mood:'静かな寂しさ'},
 {text:'走る／息が切れる／それでも／空が近づく',image:'坂を走り続ける情景',device:'短い行と逆接',effect:'苦しさの先の達成感を示す',title:'坂の上',mood:'苦しさから希望へ向かう'},
 {text:'古い時計は／今日も同じ音で／ちがう一日を／送り出す',image:'時計が毎日を刻む情景',device:'同じとちがうの対比',effect:'時間の反復と日々の新しさを示す',title:'時計の朝',mood:'穏やかな時間の流れ'},
 {text:'さようならの後／ホームに残った風が／言葉の続きを／追いかける',image:'別れた後の駅のホーム',device:'風が言葉を追う擬人法',effect:'言い残した思いを余韻として示す',title:'言葉の続き',mood:'別れの寂しさと余韻'},
];
const classics=[
 {text:'春はあけぼの。やうやう白くなりゆく山ぎは。',modern:'春は明け方がよい。しだいに白くなる山際が美しい。',word:'あけぼの＝夜明け方',feature:'明るさが変化する景色を細かく捉える',source:'枕草子'},
 {text:'つれづれなるままに、日暮らし、硯に向かひて。',modern:'することもなく一日中、硯に向かって。',word:'つれづれ＝することがなく退屈なさま',feature:'書き手の状態から文章を始める',source:'徒然草'},
 {text:'祇園精舎の鐘の声、諸行無常の響きあり。',modern:'祇園精舎の鐘の音には、全てが変化するという響きがある。',word:'無常＝全ては変化し続けること',feature:'鐘の音から世の移り変わりを示す',source:'平家物語'},
 {text:'月日は百代の過客にして、行きかふ年もまた旅人なり。',modern:'月日は永遠に旅をする旅人で、去来する年も旅人である。',word:'過客＝旅人',feature:'月日を旅人にたとえる',source:'おくのほそ道'},
 {text:'竹取の翁といふ者ありけり。',modern:'竹取の翁という者がいた。',word:'ありけり＝いた・あった',feature:'物語の人物を簡潔に導入する',source:'竹取物語'},
 {text:'男もすなる日記といふものを、女もしてみむとてするなり。',modern:'男も書くという日記を、女の私も書いてみようと思って書く。',word:'みむ＝してみよう',feature:'女性になりきった語りで日記を始める',source:'土佐日記'},
 {text:'いづれの御時にか、女御、更衣あまたさぶらひ給ひける中に。',modern:'どの帝の時代だったか、多くの女御や更衣が仕えていた中に。',word:'いづれ＝どの',feature:'時代と宮中の状況を示して始める',source:'源氏物語'},
 {text:'行く河の流れは絶えずして、しかも、もとの水にあらず。',modern:'流れる川は絶えないが、その水は元の水ではない。',word:'あらず＝ではない',feature:'川の流れで世の変化を表す',source:'方丈記'},
 {text:'児のそら寝',modern:'子どもが寝たふりをする話。',word:'そら寝＝寝たふり',feature:'人物の行動と心のずれをおかしく描く',source:'宇治拾遺物語'},
 {text:'高名の木登りといひし男、人を高き木に登せて。',modern:'有名な木登り名人が、人を高い木へ登らせて。',word:'高名＝名高いこと',feature:'安全への教訓を具体的な話で示す',source:'徒然草'},
];
const kanbun=[
 {text:'温故而知新',reading:'故きを温ねて新しきを知る',meaning:'昔を学び新しい知識や考えを得る',point:'「而」は前後をつなぐ',lesson:'過去の学びを現在へ生かす'},
 {text:'学而時習之',reading:'学びて時にこれを習ふ',meaning:'学んだことを機会ごとに復習する',point:'「之」は学んだ内容を指す',lesson:'学習には繰り返しが必要'},
 {text:'知之為知之',reading:'これを知るをこれを知ると為す',meaning:'知っていることを知っているとする',point:'同じ「之」が内容を受ける',lesson:'知識の有無を正直に認める'},
 {text:'不知為不知',reading:'知らざるを知らずと為す',meaning:'知らないことを知らないと認める',point:'「不」は否定を表す',lesson:'無知を認めることも知恵である'},
 {text:'三人行必有我師焉',reading:'三人行けば必ず我が師有り',meaning:'複数で行動すれば必ず学べる人がいる',point:'「必」は必ずと読む',lesson:'誰からでも学べる'},
 {text:'過而不改是謂過矣',reading:'過ちて改めざる、これを過ちと謂ふ',meaning:'過ちを直さないことこそ本当の過ちである',point:'「不改」は改めないという否定',lesson:'失敗後に改めることが大切'},
 {text:'有朋自遠方来',reading:'朋有り遠方より来たる',meaning:'友人が遠くから訪ねて来る',point:'「自」は「より」と読む',lesson:'学び合う友の訪問を喜ぶ'},
 {text:'己所不欲勿施於人',reading:'己の欲せざる所、人に施すこと勿かれ',meaning:'自分が望まないことを人へしてはいけない',point:'「勿」は禁止を表す',lesson:'相手の立場を考える'},
 {text:'少年易老学難成',reading:'少年老い易く学成り難し',meaning:'若い時は早く過ぎ学問は成し遂げにくい',point:'「易」「難」が対になっている',lesson:'時間を大切に学ぶ'},
 {text:'百聞不如一見',reading:'百聞は一見に如かず',meaning:'何度も聞くより一度実際に見る方がよい',point:'「不如」は及ばないという比較',lesson:'実際の観察が理解を深める'},
];
const grammar=[
 {sent:'静かな風が木の葉を揺らす。',subject:'静かな風が',predicate:'揺らす',modifier:'静かな・木の葉を',noun:'風・木の葉',verb:'揺らす'},
 {sent:'弟は昨日、新しい自転車に乗った。',subject:'弟は',predicate:'乗った',modifier:'昨日・新しい・自転車に',noun:'弟・昨日・自転車',verb:'乗った'},
 {sent:'白い雲がゆっくり山を越えた。',subject:'白い雲が',predicate:'越えた',modifier:'白い・ゆっくり・山を',noun:'雲・山',verb:'越えた'},
 {sent:'図書委員が本を丁寧に並べる。',subject:'図書委員が',predicate:'並べる',modifier:'本を・丁寧に',noun:'図書委員・本',verb:'並べる'},
 {sent:'この地域では夏に大きな祭りがある。',subject:'大きな祭りが',predicate:'ある',modifier:'この地域では・夏に・大きな',noun:'地域・夏・祭り',verb:'ある'},
 {sent:'友達と駅前の店で昼食を食べた。',subject:'私は（省略）',predicate:'食べた',modifier:'友達と・駅前の・店で・昼食を',noun:'友達・駅前・店・昼食',verb:'食べた'},
 {sent:'雨が急に強くなったので、試合は中止された。',subject:'雨が・試合は',predicate:'強くなった・中止された',modifier:'急に',noun:'雨・試合',verb:'強くなった・中止された'},
 {sent:'先生から借りた資料を班員へ見せる。',subject:'私は（省略）',predicate:'見せる',modifier:'先生から借りた・資料を・班員へ',noun:'先生・資料・班員',verb:'借りた・見せる'},
 {sent:'もし晴れたら、校庭で観察を続けよう。',subject:'私たちは（省略）',predicate:'続けよう',modifier:'もし晴れたら・校庭で・観察を',noun:'校庭・観察',verb:'晴れた・続けよう'},
 {sent:'読み終えた本を元の棚へ戻した。',subject:'私は（省略）',predicate:'戻した',modifier:'読み終えた・本を・元の・棚へ',noun:'本・棚',verb:'読み終えた・戻した'},
];
const kanji=[
 {word:'概念',read:'がいねん',meaning:'物事の共通点をまとめた考え',use:'新しい概念を図で説明する。',related:'考え'},
 {word:'根拠',read:'こんきょ',meaning:'判断や主張を支える理由や事実',use:'資料を根拠に意見を述べる。',related:'理由'},
 {word:'比較',read:'ひかく',meaning:'二つ以上を比べること',use:'二つの調査結果を比較する。',related:'対照'},
 {word:'解釈',read:'かいしゃく',meaning:'意味を読み取り理解すること',use:'表現の効果を解釈する。',related:'理解'},
 {word:'象徴',read:'しょうちょう',meaning:'抽象的な意味を具体物で表すこと',use:'白い鳩は平和の象徴とされる。',related:'シンボル'},
 {word:'矛盾',read:'むじゅん',meaning:'二つの内容が同時に成り立たないこと',use:'二つの説明には矛盾がある。',related:'食い違い'},
 {word:'推論',read:'すいろん',meaning:'根拠から結論を導くこと',use:'複数の事実から原因を推論する。',related:'推理'},
 {word:'論証',read:'ろんしょう',meaning:'根拠を示して主張を成り立たせること',use:'データを使って考えを論証する。',related:'証明'},
 {word:'吟味',read:'ぎんみ',meaning:'内容を詳しく調べて選ぶこと',use:'情報の信頼性を吟味する。',related:'検討'},
 {word:'文脈',read:'ぶんみゃく',meaning:'前後の言葉や文章のつながり',use:'文脈から語句の意味を考える。',related:'前後関係'},
];
const args=[
 {theme:'校内のスマートフォン利用',claim:'学習目的と緊急連絡に用途を限定する',reason:'必要な利用とトラブル防止を両立できる',evidence:'調査では連絡利用の必要と撮影問題の両方があった',counter:'用途の判定が難しい',reply:'利用場所と時間を具体化する'},
 {theme:'図書館の開館延長',claim:'週一回一時間だけ試行する',reason:'需要と職員負担を小さく検証できる',evidence:'夕方利用を望む回答が多かった',counter:'職員負担が増える',reply:'期間と曜日を限定し利用数を測る'},
 {theme:'給食の食品ロス',claim:'量と残した理由を一週間記録する',reason:'原因に合う対策を選べる',evidence:'料理ごとに残量差があった',counter:'記録に時間がかかる',reply:'選択式の簡単な記録にする'},
 {theme:'地域の古木保全',claim:'専門家が危険枝だけを整える',reason:'安全と生き物のすみかを両立できる',evidence:'古木で複数の鳥と昆虫が確認された',counter:'管理費がかかる',reply:'伐採費と長期管理費を比較する'},
 {theme:'災害情報の多言語化',claim:'やさしい日本語・図・多言語を併用する',reason:'異なる人へ届く経路を増やせる',evidence:'訓練で日本語の指示を理解できない例があった',counter:'準備に時間がかかる',reply:'平時に定型文と図を準備する'},
 {theme:'学級討論の参加',claim:'個人メモと小集団対話を先に行う',reason:'全員が考えを準備して共有できる',evidence:'試行時に発言者数が増えた',counter:'決定まで時間が延びる',reply:'各段階の時間上限を決める'},
 {theme:'地域清掃の参加者',claim:'短時間参加と複数日程を用意する',reason:'生活に合わせて参加しやすくなる',evidence:'不参加理由では時間が合わないが多かった',counter:'運営回数が増える',reply:'地域団体で役割を分担する'},
 {theme:'文化祭の展示',claim:'完成品に加え試作と改善記録も展示する',reason:'思考の変化や工夫を伝えられる',evidence:'昨年は制作過程への質問が多かった',counter:'展示場所が不足する',reply:'試作品は写真と短い説明で示す'},
 {theme:'学校の節電',claim:'退出時の消灯確認を日直の役割にする',reason:'設備を増やさず継続できる',evidence:'一週間に複数の消し忘れがあった',counter:'日直の負担が増える',reply:'既存の確認表へ一項目だけ加える'},
 {theme:'制服の選択肢',claim:'気候や活動に合わせ複数型から選べるようにする',reason:'快適さと個人差へ対応できる',evidence:'暑さや動きにくさを訴える回答があった',counter:'統一感が失われる',reply:'色と基本デザインは共通にする'},
];
const speeches=[
 {topic:'中学校で学んだ対話',opening:'入学後、反対意見への見方が変わりました。',point:'対話では反論より先に理解が必要',episode:'相手の発言を要約して誤解に気づいた',device:'最初と改善後の考えを対比する',ending:'違う意見を考え直す材料として聞きたい'},
 {topic:'地域の言葉',opening:'祖父母への聞き取りから方言の価値を考えました。',point:'地域の言葉は歴史と感情を伝える',episode:'標準語に置き換えにくい表現を教わった',device:'実際の言葉を音声で紹介する',ending:'意味とともに言葉を記録したい'},
 {topic:'失敗からの発見',opening:'理科実験の予想外の結果について話します。',point:'失敗と思えるデータも次の問いになる',episode:'条件を見直して誤差原因を見つけた',device:'予想と結果の表を示す',ending:'不明な結果を隠さず調べたい'},
 {topic:'情報の確認',opening:'災害情報を共有する前の三つの確認を提案します。',point:'発信者・日時・根拠を確かめる',episode:'古い避難所情報が再投稿された例',device:'確認手順を三段階で示す',ending:'速さと正確さの両方を意識したい'},
 {topic:'成長の測り方',opening:'大会の順位から見えなかった成果があります。',point:'過去の自分との比較も成長を示す',episode:'順位は下がったが記録は伸びていた',device:'二年分の記録をグラフで示す',ending:'一つの数字だけで努力を決めない'},
 {topic:'異文化から学ぶ',opening:'転校生との交流で教えるという考えが変わりました。',point:'交流は互いの文化を問い直す学びである',episode:'日本の習慣の理由を一緒に調べた',device:'二文化の共通点と違いを表にする',ending:'知らない違いを質問できる人になりたい'},
 {topic:'地域清掃',opening:'参加者を増やすために調査したことを報告します。',point:'呼びかけより参加しやすい条件づくりが必要',episode:'時間が合わないという回答が多かった',device:'不参加理由の円グラフを示す',ending:'相手の事情を調べて活動を設計したい'},
 {topic:'古木と生態系',opening:'公園の古木を切るか残すか調べました。',point:'安全と保全を両立する方法がある',episode:'危険枝と生き物のすみかを別々に記録した',device:'古木の生き物地図を示す',ending:'二者択一でなく条件を調べたい'},
 {topic:'生成AIとの学習',opening:'AIを使った文章作成で気づいた責任を話します。',point:'出力を選ぶ人が事実と権利を確認する',episode:'存在しない資料名が出力された',device:'確認前後の文章を比べる',ending:'便利さと検証を組み合わせたい'},
 {topic:'将来の目標',opening:'高校で続けたい探究について話します。',point:'防災情報が誰にどう届くかを調べたい',episode:'訓練で指示を理解できない人がいた',device:'情報経路を図で示す',ending:'調査と対話から実行できる提案を作りたい'},
];

const make=(id:string,n:number):GeneralProblem=>{const v=n%5,i=Math.floor(n/5)%10;
 if(id==='KOKUGO_G7_U01'){const x=stories[i];if(v===0)return{question:`小説「${x.t}」の中心人物は？`,answer:x.who,options:c(x.who,stories.map(z=>z.who),i),hint:'出来事の中心を見よう。'};if(v===1)return{question:`小説「${x.t}」の心情を示す表現は？`,answer:x.cue,options:c(x.cue,stories.map(z=>z.cue),i),hint:'行動や描写に注目しよう。'};if(v===2)return{question:`小説「${x.t}」の人物の変化は？`,answer:x.change,options:c(x.change,stories.map(z=>z.change),i),hint:'前後の考えを比べよう。'};if(v===3)return{question:`小説「${x.t}」の転機は？`,answer:x.turn,options:c(x.turn,stories.map(z=>z.turn),i),hint:'変化のきっかけを選ぼう。'};return{question:`小説「${x.t}」の主題は？`,answer:x.theme,options:c(x.theme,stories.map(z=>z.theme),i),hint:'人物の変化と結末から考えよう。'};}
 if(id==='KOKUGO_G7_U02'){const x=articles[i];if(v===0)return{question:`説明「${x.t}」の話題は？`,answer:x.topic,options:c(x.topic,articles.map(z=>z.topic),i),hint:'何について論じているか見よう。'};if(v===1)return{question:`説明「${x.t}」の筆者の主張は？`,answer:x.claim,options:c(x.claim,articles.map(z=>z.claim),i),hint:'中心的な考えを選ぼう。'};if(v===2)return{question:`主張「${x.claim}」を支える事実は？`,answer:x.fact,options:c(x.fact,articles.map(z=>z.fact),i),hint:'本文の根拠を選ぼう。'};if(v===3)return{question:`説明「${x.t}」で示された理由は？`,answer:x.reason,options:c(x.reason,articles.map(z=>z.reason),i),hint:'主張と事実を結ぶ論理を見よう。'};return{question:`説明「${x.t}」の構成は？`,answer:x.structure,options:c(x.structure,articles.map(z=>z.structure),i),hint:'各文の役割を整理しよう。'};}
 if(id==='KOKUGO_G7_U03'){const x=poems[i];if(v===0)return{question:`詩「${x.text}」が描く情景は？`,answer:x.image,options:c(x.image,poems.map(z=>z.image),i),hint:'言葉から場面を想像しよう。'};if(v===1)return{question:`詩「${x.text}」で使われた表現技法は？`,answer:x.device,options:c(x.device,poems.map(z=>z.device),i),hint:'比喩、擬人、反復、対比を見よう。'};if(v===2)return{question:`詩「${x.text}」の表現効果は？`,answer:x.effect,options:c(x.effect,poems.map(z=>z.effect),i),hint:'技法が印象へ与える働きを考えよう。'};if(v===3)return{question:`詩「${x.text}」に合う題名は？`,answer:x.title,options:c(x.title,poems.map(z=>z.title),i),hint:'情景と中心語から考えよう。'};return{question:`詩「${x.text}」から受ける調子は？`,answer:x.mood,options:c(x.mood,poems.map(z=>z.mood),i),hint:'語句、行分け、音から捉えよう。'};}
 if(id==='KOKUGO_G7_U04'){const x=classics[i];if(v===0)return{question:`古文「${x.text}」の現代語訳は？`,answer:x.modern,options:c(x.modern,classics.map(z=>z.modern),i),hint:'語句と文脈を対応させよう。'};if(v===1)return{question:`古文「${x.text}」の重要語句は？`,answer:x.word,options:c(x.word,classics.map(z=>z.word),i),hint:'現代語との違いを確かめよう。'};if(v===2)return{question:`古文「${x.text}」の表現上の特徴は？`,answer:x.feature,options:c(x.feature,classics.map(z=>z.feature),i),hint:'比喩、描写、語り方を見よう。'};if(v===3)return{question:`「${x.text}」の出典は？`,answer:x.source,options:c(x.source,classics.map(z=>z.source),i),hint:'作品名と文を結びつけよう。'};return{question:`古文「${x.text}」を音読する時に大切なことは？`,answer:'歴史的仮名遣いと文の調子を確かめる',options:d('歴史的仮名遣いと文の調子を確かめる','現代語訳だけを読む','句読点をすべて消す','漢字を英語へ直す'),hint:'古文独特の響きを捉えよう。'};}
 if(id==='KOKUGO_G7_U05'){const x=kanbun[i];if(v===0)return{question:`漢文「${x.text}」の書き下し文は？`,answer:x.reading,options:c(x.reading,kanbun.map(z=>z.reading),i),hint:'訓読の順序を確かめよう。'};if(v===1)return{question:`「${x.reading}」の意味は？`,answer:x.meaning,options:c(x.meaning,kanbun.map(z=>z.meaning),i),hint:'語句と文全体を対応させよう。'};if(v===2)return{question:`漢文「${x.text}」の訓読上の要点は？`,answer:x.point,options:c(x.point,kanbun.map(z=>z.point),i),hint:'否定、比較、助字に注目しよう。'};if(v===3)return{question:`漢文「${x.text}」から得られる教訓は？`,answer:x.lesson,options:c(x.lesson,kanbun.map(z=>z.lesson),i),hint:'具体的な意味を一般化しよう。'};return{question:`漢文「${x.text}」を読む時に使うものは？`,answer:'返り点・送り仮名・書き下し文',options:d('返り点・送り仮名・書き下し文','詩の行分けだけ','敬語の種類だけ','英語の語順だけ'),hint:'訓読のきまりを確認しよう。'};}
 if(id==='KOKUGO_G7_U06'){const x=grammar[i];if(v===0)return{question:`文「${x.sent}」の主語は？`,answer:x.subject,options:c(x.subject,grammar.map(z=>z.subject),i),hint:'だれが・何がに当たる部分を見よう。'};if(v===1)return{question:`文「${x.sent}」の述語は？`,answer:x.predicate,options:c(x.predicate,grammar.map(z=>z.predicate),i),hint:'文の終わりを中心に見よう。'};if(v===2)return{question:`文「${x.sent}」で修飾する部分は？`,answer:x.modifier,options:c(x.modifier,grammar.map(z=>z.modifier),i),hint:'他の語を詳しくする部分を選ぼう。'};if(v===3)return{question:`文「${x.sent}」の主語が省略されている場合、どう判断する？`,answer:'文脈から動作の主体を補う',options:d('文脈から動作の主体を補う','必ず「私」と決める','述語を主語にする','省略文は意味がないとする'),hint:'前後の文とのつながりを見よう。'};return{question:`文「${x.sent}」の組み立てを捉える基本は？`,answer:'主語・述語・修飾語の関係を確かめる',options:d('主語・述語・修飾語の関係を確かめる','漢字数だけを数える','文を単語一つにする','句読点だけを見る'),hint:'文節の働きを関連づけよう。'};}
 if(id==='KOKUGO_G7_U07'){const x=grammar[i];if(v===0)return{question:`文「${x.sent}」に含まれる名詞は？`,answer:x.noun,options:c(x.noun,grammar.map(z=>z.noun),i),hint:'物事の名称を表す語を選ぼう。'};if(v===1)return{question:`文「${x.sent}」に含まれる動詞は？`,answer:x.verb,options:c(x.verb,grammar.map(z=>z.verb),i),hint:'動作や状態を表し活用する語を選ぼう。'};if(v===2)return{question:`文「${x.sent}」で活用する語を見分ける方法は？`,answer:'語尾の形が文中で変わるか確かめる',options:d('語尾の形が文中で変わるか確かめる','漢字かどうかだけ見る','文字数で決める','文頭だけを見る'),hint:'動詞・形容詞・形容動詞の特徴を考えよう。'};if(v===3)return{question:`文「${x.sent}」を単語に分ける時の注意は？`,answer:'意味と文法上の働きを持つ最小単位で区切る',options:d('意味と文法上の働きを持つ最小単位で区切る','一文字ずつ区切る','句点の所だけ区切る','漢字だけを取り出す'),hint:'文節と単語を区別しよう。'};return{question:`品詞を学ぶと文「${x.sent}」の何が分かる？`,answer:'各単語の働きと文の組み立て',options:d('各単語の働きと文の組み立て','作者の経歴','紙の種類','文字の色'),hint:'単語の分類を文理解へつなげよう。'};}
 if(id==='KOKUGO_G7_U08'){const x=kanji[i];if(v===0)return{question:`「${x.word}」の読みは？`,answer:x.read,options:c(x.read,kanji.map(z=>z.read),i),hint:'語句と読みを結びつけよう。'};if(v===1)return{question:`「${x.word}」の意味は？`,answer:x.meaning,options:c(x.meaning,kanji.map(z=>z.meaning),i),hint:'文脈で意味を確かめよう。'};if(v===2)return{question:`「${x.word}」を正しく使った文は？`,answer:x.use,options:c(x.use,kanji.map(z=>z.use),i),hint:'意味に合う用例を選ぼう。'};if(v===3)return{question:`「${x.word}」と意味が近い語は？`,answer:x.related.trim(),options:c(x.related.trim(),kanji.map(z=>z.related.trim()),i),hint:'語の関係を考えよう。'};return{question:`「${x.word}」を文章で使う時に大切なことは？`,answer:'意味と文脈が合うか確かめる',options:d('意味と文脈が合うか確かめる','画数だけで選ぶ','難しい語なら必ず使う','読みだけを合わせる'),hint:'適切な語句を選ぼう。'};}
 if(id==='KOKUGO_G7_U09'){const x=articles[i];if(v===0)return{question:`文章「${x.t}」の要旨は？`,answer:x.claim,options:c(x.claim,articles.map(z=>z.claim),i),hint:'筆者の中心的な考えを選ぼう。'};if(v===1)return{question:`文章「${x.t}」の要約で残す事実は？`,answer:x.fact,options:c(x.fact,articles.map(z=>z.fact),i),hint:'要旨を支える根拠を選ぼう。'};if(v===2)return{question:`要旨「${x.claim}」を支える理由は？`,answer:x.reason,options:c(x.reason,articles.map(z=>z.reason),i),hint:'論理のつながりを見よう。'};if(v===3)return{question:`文章「${x.t}」の要約で構成をどう生かす？`,answer:`${x.structure}の流れを保つ`,options:c(`${x.structure}の流れを保つ`,articles.map(z=>`${z.structure}の流れを保つ`),i),hint:'元の論理順序を残そう。'};return{question:`文章「${x.t}」を要約する条件は？`,answer:'要旨と主要な根拠を意味を変えず短くする',options:d('要旨と主要な根拠を意味を変えず短くする','例をすべて写す','自分の感想へ置き換える','本文にない情報を加える'),hint:'正確さと簡潔さを両立しよう。'};}
 if(id==='KOKUGO_G7_U10'){const x=args[i];if(v===0)return{question:`意見文「${x.theme}」の主張は？`,answer:x.claim,options:c(x.claim,args.map(z=>z.claim),i),hint:'筆者が実現したいことを選ぼう。'};if(v===1)return{question:`主張「${x.claim}」の理由は？`,answer:x.reason,options:c(x.reason,args.map(z=>z.reason),i),hint:'主張を支える説明を選ぼう。'};if(v===2)return{question:`主張「${x.claim}」の根拠は？`,answer:x.evidence,options:c(x.evidence,args.map(z=>z.evidence),i),hint:'調査や事実を選ぼう。'};if(v===3)return{question:`主張「${x.claim}」への反対意見は？`,answer:x.counter,options:c(x.counter,args.map(z=>z.counter),i),hint:'異なる立場の懸念を選ぼう。'};return{question:`反対意見「${x.counter}」への応答は？`,answer:x.reply,options:c(x.reply,args.map(z=>z.reply),i),hint:'懸念をふまえて主張を補おう。'};}
 if(id==='KOKUGO_G7_U11'){const x=speeches[i];if(v===0)return{question:`スピーチ「${x.topic}」の導入は？`,answer:x.opening,options:c(x.opening,speeches.map(z=>z.opening),i),hint:'話題と問題意識を示す文を選ぼう。'};if(v===1)return{question:`スピーチ「${x.topic}」の中心は？`,answer:x.point,options:c(x.point,speeches.map(z=>z.point),i),hint:'一番伝えたい考えを選ぼう。'};if(v===2)return{question:`中心「${x.point}」を支える経験は？`,answer:x.episode,options:c(x.episode,speeches.map(z=>z.episode),i),hint:'具体的な出来事を選ぼう。'};if(v===3)return{question:`スピーチ「${x.topic}」に合う資料・話し方は？`,answer:x.device,options:c(x.device,speeches.map(z=>z.device),i),hint:'内容を効果的に伝える工夫を選ぼう。'};return{question:`スピーチ「${x.topic}」の結びは？`,answer:x.ending,options:c(x.ending,speeches.map(z=>z.ending),i),hint:'今後の行動へつなぐ文を選ぼう。'};}
 const x=args[i];if(v===0)return{question:`話し合い「${x.theme}」の提案は？`,answer:x.claim,options:c(x.claim,args.map(z=>z.claim),i),hint:'中心となる意見を聞こう。'};if(v===1)return{question:`提案「${x.claim}」を支える事実は？`,answer:x.evidence,options:c(x.evidence,args.map(z=>z.evidence),i),hint:'根拠を選ぼう。'};if(v===2)return{question:`提案「${x.claim}」への懸念は？`,answer:x.counter,options:c(x.counter,args.map(z=>z.counter),i),hint:'別の立場の意見を聞こう。'};if(v===3)return{question:`懸念「${x.counter}」をふまえた改善は？`,answer:x.reply,options:c(x.reply,args.map(z=>z.reply),i),hint:'双方の考えを生かそう。'};return{question:`話し合い「${x.theme}」で合意へ近づくために必要なことは？`,answer:'意見・根拠・懸念・実行条件を整理する',options:d('意見・根拠・懸念・実行条件を整理する','声の大きさだけで決める','反対意見を無視する','最初の案を変えない'),hint:'論点を整理して比べよう。'};
};
Object.keys(KOKUGO_G7_UNIT_DATA).forEach(id=>KOKUGO_G7_UNIT_DATA[id]=Array.from({length:50},(_,n)=>{const problem=make(id,n);if(id!=='KOKUGO_G7_U01')return problem;const index=Math.floor(n/5)%10,text=stories[index].t,label=`小説${index+1}`;return{...problem,question:problem.question.replace(`小説「${text}」`,label),passage:text,passageTitle:`${label} 本文`};}));
export const KOKUGO_G7_DATA:Record<string,GeneralProblem[]>={KOKUGO_G7_1:Object.values(KOKUGO_G7_UNIT_DATA).flat(),...KOKUGO_G7_UNIT_DATA};
