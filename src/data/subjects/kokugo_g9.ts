import { GeneralProblem, d } from './utils';

export const KOKUGO_G9_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G9_U01: [], KOKUGO_G9_U02: [], KOKUGO_G9_U03: [], KOKUGO_G9_U04: [], KOKUGO_G9_U05: [], KOKUGO_G9_U06: [],
  KOKUGO_G9_U07: [], KOKUGO_G9_U08: [], KOKUGO_G9_U09: [], KOKUGO_G9_U10: [], KOKUGO_G9_U11: [], KOKUGO_G9_U12: [],
};

const c = (answer: string, pool: string[], index: number) => {
  const values = [answer];
  for (let k=1; values.length<4 && k<=pool.length; k++) { const value=pool[(index+k)%pool.length]; if(!values.includes(value)) values.push(value); }
  while(values.length<4) values.push(`当てはまらない説明${values.length}`);
  return d(values[0],values[1],values[2],values[3]);
};

const fiction = [
  {t:'橋の向こう',narrator:'故郷へ戻った「私」',symbol:'川に架かる古い橋',cue:'橋の中央で足を止め、欄干の傷に触れた',change:'過去を避けず友人へ手紙を書くと決めた',structure:'現在の帰郷に少年時代の回想を挟む',theme:'過去との向き合い方が未来を変える'},
  {t:'無音の拍手',narrator:'舞台袖にいる照明係の瑞希',symbol:'点滅する一台の照明',cue:'幕が下りても操作盤から手を離さなかった',change:'目立たない仕事にも自分の表現があると悟った',structure:'本番直前から終演までを時間順に描く',theme:'見えない役割も共同の成果を支える'},
  {t:'青い封筒',narrator:'父の遺品を整理する直樹',symbol:'宛名のない青い封筒',cue:'封を切らず窓辺へ置き直した',change:'父を一つの評価で決めつけるのをやめた',structure:'遺品の発見を軸に複数の記憶を往復する',theme:'他者を理解するには複数の面を見る必要がある'},
  {t:'冬の標本室',narrator:'生物部員の佳奈',symbol:'羽の欠けた蝶の標本',cue:'標本箱のラベルを新しい紙へ書き直した',change:'失敗した研究も記録として残そうと考えた',structure:'失敗の告白から原因究明へ進む',theme:'失敗を記録することが次の探究につながる'},
  {t:'名前のない写真',narrator:'地域史を調べる中学生の悠',symbol:'人物名のない集合写真',cue:'写真の端の少女を何度も拡大した',change:'資料の外にある人々の記憶も聞こうとした',structure:'写真の謎を聞き取りで解く過程を描く',theme:'歴史は多くの個人の記憶から成る'},
  {t:'海鳴りの部屋',narrator:'祖母の家を訪れた千尋',symbol:'閉じられた海側の窓',cue:'祖母の話の途中で窓の鍵に手をかけた',change:'災害の記憶を聞き継ぐ責任を感じた',structure:'穏やかな現在と災害時の回想を対照させる',theme:'記憶を語り継ぐことが備えになる'},
  {t:'六月の靴音',narrator:'進路に迷う拓海',symbol:'廊下に響く二種類の靴音',cue:'職員室の前を三度通り過ぎた',change:'他人の期待ではなく自分の関心を言葉にした',structure:'反復される廊下の場面で迷いを示す',theme:'選択には自分の価値観を確かめる必要がある'},
  {t:'風を測る',narrator:'陸上部を退部した颯太',symbol:'使われなくなった風速計',cue:'記録会の日にも観客席で風向きを記した',change:'競技者以外の形で陸上に関わり始めた',structure:'退部後の空白から新しい役割の発見へ進む',theme:'目標を失っても経験は別の形で生かせる'},
  {t:'灯台守の地図',narrator:'島を離れる予定の明日香',symbol:'手書きで修正された航路図',cue:'新しい道を古い地図の余白に描き足した',change:'島を離れることと故郷を捨てることを分けて考えた',structure:'祖父との対話を通じて地図の意味が変わる',theme:'故郷との関係は離れても更新できる'},
  {t:'朝の鍵盤',narrator:'合唱伴奏者の莉子',symbol:'音の出にくい一つの鍵盤',cue:'失敗した小節だけをゆっくり弾き直した',change:'完璧さより歌い手との呼吸を優先した',structure:'練習時の失敗と本番の判断を対応させる',theme:'協働では相手に応じて行動を変えることが大切だ'},
];

const fictionPassages = [
  '故郷へ戻った私は、川に架かる古い橋の前で足を止めた。少年時代、友人と争った日に付けた傷が欄干に残っている。橋の中央でその傷に触れると、避けてきた記憶が現在へつながった。私は宿へ戻り、長く書けなかった手紙を書き始めた。',
  '舞台袖の瑞希は、終演後も点滅する一台の照明を見つめていた。自分の仕事は観客に気づかれないと思っていたが、出演者は「あの光で最後の一歩を踏み出せた」と言った。幕が下りても瑞希は操作盤から手を離さなかった。目立たない光にも、自分の表現があると知ったからだ。',
  '直樹は父の遺品から、宛名のない青い封筒を見つけた。厳しかった父を思い出し、すぐには封を切れず窓辺へ置き直す。別の箱には、家族へ言えなかった感謝を記した手帳があった。直樹は父を一つの記憶だけで決めつけていたことに気づいた。',
  '佳奈は研究に失敗し、羽の欠けた蝶の標本を処分しようとした。だが記録を読み返すと、温度条件を変えた日だけ結果が異なる。佳奈は標本箱のラベルを新しい紙へ書き直した。失敗も、次の問いへ続く記録になると思った。',
  '悠が見つけた集合写真には、一人だけ名前の記されていない少女がいた。写真の端の姿を何度も拡大し、地域の人へ聞き取りを重ねる。少女は記録に残らない仕事で祭りを支えた人だと分かった。悠は資料の外にある声も歴史の一部だと考えた。',
  '千尋が祖母の家を訪れると、海側の窓だけが閉じられていた。祖母は災害の日の海を語り、途中で長く黙った。千尋は窓の鍵に手をかけたが、急かさず隣に座る。やがて祖母が語り直した避難の記憶を、千尋は一語ずつ記録した。',
  '進路希望票を持った拓海は、職員室の前を三度通り過ぎた。廊下には自分の靴音と、期待を語る家族の言葉が重なって聞こえる。四度目に扉を開き、他人の希望ではなく自分が学びたいことを話した。帰りの廊下には、一種類の靴音だけが響いた。',
  '退部した颯太は、記録会の日も観客席で古い風速計を動かしていた。走れない自分には価値がないと思っていたが、選手から風の記録が助走の調整に役立ったと聞く。颯太は測定結果を表にまとめ始めた。競技者ではない形でも、経験を生かせると気づいた。',
  '島を離れる明日香へ、祖父は手書きの航路図を渡した。古い地図には、海の変化に合わせて何本もの線が描き直されている。明日香は新しい道を余白へ描き足した。島を離れても、故郷との関係は書き換えながら続けられると思った。',
  '伴奏者の莉子は、音の出にくい鍵盤で何度も同じ小節を失敗した。本番前、失敗した部分だけをゆっくり弾き直す。合唱が始まると、莉子は楽譜通りの速さより歌い手の呼吸を選んだ。最後の和音は、全員の息と同時に静かに消えた。',
];

const essays = [
  {t:'効率と余白',issue:'効率だけを価値基準にする考え方',claim:'目的のない時間にも創造を生む価値がある',evidence:'自由時間を設けた組織で部門横断の提案が増えた',warrant:'偶然の交流や試行が新しい結び付きを生むため',counter:'余白は成果を遅らせるだけだ',response:'期限を定めた上で探索時間を確保すれば両立できる'},
  {t:'データと判断',issue:'数値だけで社会的判断を下すこと',claim:'データの作られ方と欠落も検討すべきだ',evidence:'同じ地域でも調査方法により満足度が異なった',warrant:'対象や質問の違いが結果へ影響するため',counter:'数値は主観より常に正確だ',response:'数値も収集条件を含むため条件の公開が必要だ'},
  {t:'翻訳するということ',issue:'翻訳を単語の置き換えとみなすこと',claim:'翻訳では文化的背景と読者を考慮する必要がある',evidence:'同じ挨拶の直訳が別文化では無礼に響く例がある',warrant:'表現の働きは文化と場面によって異なるため',counter:'原文に忠実なら直訳が最善だ',response:'意味と効果の双方を保つことも忠実さに含まれる'},
  {t:'都市と記憶',issue:'再開発で地域の痕跡が失われること',claim:'更新と同時に場所の記憶を記録すべきだ',evidence:'旧地名を示す案内が地域学習に利用された',warrant:'痕跡は住民が変化を理解する手掛かりになるため',counter:'古い記録は新しい利用を妨げる',response:'保存対象を選びデジタル記録も併用できる'},
  {t:'専門家と市民',issue:'専門知識を専門家だけに任せること',claim:'市民も判断過程へ参加できる仕組みが必要だ',evidence:'公開討議で地域事情を反映した防災案に修正された',warrant:'専門知と生活経験は異なる情報を補い合うため',counter:'市民参加は意思決定を遅くする',response:'論点と期限を明確にすれば熟議と速度を調整できる'},
  {t:'失敗の共有',issue:'組織で失敗が隠されること',claim:'責任追及と原因分析を分けて行うべきだ',evidence:'匿名報告制度の導入後に小さな事故情報が増えた',warrant:'早期の共有が重大な再発を防ぐため',counter:'失敗の公開は信頼を損なう',response:'改善策まで示す透明性は長期的な信頼につながる'},
  {t:'多数決の限界',issue:'多数決だけで合意とみなすこと',claim:'採決前に少数意見の理由を検討すべきだ',evidence:'少数案の安全対策を加えて全体案が改善した',warrant:'少数意見が見落とされた課題を示す場合があるため',counter:'検討を続けると決定できない',response:'検討時間と決定条件をあらかじめ定めればよい'},
  {t:'科学と不確実性',issue:'科学的結論を絶対に確定したものと捉えること',claim:'証拠の範囲と不確実性を併せて伝えるべきだ',evidence:'予測値に幅を示すと複数の対策を比較できた',warrant:'限界の明示が条件変化への備えを可能にするため',counter:'不確実性を示すと科学への信頼が下がる',response:'分からない範囲の説明こそ検証可能性を高める'},
  {t:'言葉と境界',issue:'分類名が人の見方を固定すること',claim:'分類の便利さと限界を意識すべきだ',evidence:'同じ行動が分類基準によって別の群に入った',warrant:'境界は目的に応じて人が設定したものだからだ',counter:'分類なしでは比較できない',response:'分類を使いつつ基準外の事例も記述すればよい'},
  {t:'継承と創造',issue:'伝統を変えずに守ることだけを継承と考えること',claim:'核となる価値を保ちながら表現を更新できる',evidence:'新素材を用いた工芸品が若い利用者へ広がった',warrant:'利用され続けることで技術と意味が次代へ伝わるため',counter:'変更すれば本来の伝統ではなくなる',response:'変更点と不変の技法を記録し検証可能にする'},
];

const poetry = [
  {text:'雲の峰一人の家を一人発ち',form:'俳句',device:'体言止めと反復',effect:'孤独と旅立ちの決意を短く強く残す',context:'大きな夏雲と小さな家を対照させる',theme:'孤独を引き受けて進む決意'},
  {text:'校庭の白線消えて秋の雨わたしの進路まだ名を持たず',form:'短歌',device:'景物と心情の対応',effect:'消える白線に将来の不確かさを重ねる',context:'秋雨の校庭で進路を考える',theme:'将来を選ぶ前の不安'},
  {text:'窓という窓に夕焼け残りおり病棟は船のように静かだ',form:'自由詩',device:'直喩',effect:'病棟を静かに進む船として印象づける',context:'夕焼けに包まれた病棟',theme:'不安の中にある静かな希望'},
  {text:'卒業歌声の中に声失くす',form:'俳句',device:'対比',effect:'周囲の歌声と個人の沈黙を際立たせる',context:'卒業式で歌えずにいる人物',theme:'別れを受け入れきれない心'},
  {text:'祖母の辞書余白の文字を指で追う知らない言葉知っていた人',form:'短歌',device:'対句的な言葉の配置',effect:'辞書の言葉と祖母の記憶を結び付ける',context:'遺された辞書を読む時間',theme:'言葉を通じた記憶の継承'},
  {text:'海はまだ昨日の色をしているのに町の時計は動き始める',form:'自由詩',device:'対比と擬人法',effect:'変わらない自然と進む日常の隔たりを示す',context:'大きな出来事の翌朝の海辺',theme:'喪失後も続く時間'},
  {text:'春寒し返事を書かぬままの紙',form:'俳句',device:'省略',effect:'書けない理由とためらいを読み手に想像させる',context:'寒さの残る春に手紙を前にする',theme:'伝えることへのためらい'},
  {text:'地図上の国境線を指で越え父の故郷の雨を想像す',form:'短歌',device:'具体と想像の対比',effect:'一本の線から遠い土地への思いを広げる',context:'地図を見ながら父の故郷を思う',theme:'境界を越えて出自を考える'},
  {text:'名前呼ぶ声の届かぬ花野かな',form:'俳句',device:'聴覚と広がりの対照',effect:'届かない声によって空間と喪失感を広げる',context:'広い秋の花野で人を呼ぶ',theme:'不在の人への思い'},
  {text:'まだ誰も答えを知らない朝だから僕らは椅子を円く並べる',form:'自由詩',device:'象徴',effect:'円形の椅子で対等な対話への期待を示す',context:'話し合いを始める朝',theme:'対話によって答えを探す希望'},
];

const classics = [
  {text:'行く河の流れは絶えずして、しかももとの水にあらず。',modern:'流れていく川の水は絶えることがなく、それでいて元の水ではない。',word:'しかも＝それでいて',point:'川の流れを用いて無常を表す',background:'災害や遷都を経験した時代',source:'方丈記'},
  {text:'淀みに浮かぶうたかたは、かつ消えかつ結びて、久しくとどまりたるためしなし。',modern:'淀みに浮かぶ泡は、一方で消え一方で生まれ、長くとどまる例はない。',word:'うたかた＝水の泡',point:'対句と比喩で移ろいを示す',background:'世の不安定さを強く意識した時代',source:'方丈記'},
  {text:'月日は百代の過客にして、行きかふ年もまた旅人なり。',modern:'月日は永遠に旅をする旅人で、来ては去る年もまた旅人である。',word:'過客＝旅人',point:'時間を旅人にたとえる',background:'各地の歌枕を訪ねる旅',source:'おくのほそ道'},
  {text:'草の戸も住替る代ぞひなの家。',modern:'この粗末な家も住人が替わり、ひな人形を飾る家になることだ。',word:'代＝時・世',point:'旅立つ自分と新しい住人の生活を対照する',background:'長い旅へ出る際の別れ',source:'おくのほそ道'},
  {text:'祇園精舎の鐘の声、諸行無常の響きあり。',modern:'祇園精舎の鐘の音には、すべてが移り変わるという響きがある。',word:'諸行無常＝すべては変化すること',point:'聴覚表現で作品の主題を示す',background:'武士の台頭と平氏の栄枯盛衰',source:'平家物語'},
  {text:'おごれる人も久しからず、ただ春の夜の夢のごとし。',modern:'思い上がって栄える人も長くは続かず、まるで春の夜の夢のようだ。',word:'久しからず＝長く続かない',point:'直喩で栄華のはかなさを表す',background:'平氏の繁栄と滅亡を語る時代',source:'平家物語'},
  {text:'ある人、弓射ることを習ふに、諸矢をたばさみて的に向かふ。',modern:'ある人が弓を射ることを習う時、二本の矢を手に挟んで的に向かう。',word:'諸矢＝二本の矢',point:'具体的な逸話から教訓へ導く',background:'中世の生活と価値観を随筆に記した時代',source:'徒然草'},
  {text:'先達はあらまほしき事なり。',modern:'案内役はいてほしいものである。',word:'あらまほし＝望ましい',point:'失敗談を簡潔な教訓で結ぶ',background:'寺社参詣が広く行われた時代',source:'徒然草'},
  {text:'春はあけぼの。やうやう白くなりゆく山ぎは。',modern:'春は明け方がよい。しだいに白くなっていく山際。',word:'やうやう＝しだいに',point:'時間に伴う色彩の変化を描く',background:'宮廷生活の美意識が磨かれた時代',source:'枕草子'},
  {text:'男もすなる日記といふものを、女もしてみむとてするなり。',modern:'男も書くという日記というものを、女である私も書いてみようと思って書くのである。',word:'む＝意志を表す助動詞',point:'女性の語り手を仮構して仮名で記す',background:'男性が漢文で日記を書くことが多かった時代',source:'土佐日記'},
];

const kanbun = [
  {text:'故天将降大任於是人也',reading:'故に天の将に大任を是の人に降さんとするや',meaning:'だから天がこの人に大きな任務を与えようとする時には',pattern:'「将〜」で「まさに〜んとす」と読む',idea:'困難が人を鍛えるという議論の導入',source:'孟子'},
  {text:'必先苦其心志',reading:'必ず先づ其の心志を苦しむ',meaning:'必ずまずその人の精神を苦しませる',pattern:'「必」を「必ず」と読む',idea:'試練が精神を鍛える',source:'孟子'},
  {text:'天時不如地利',reading:'天の時は地の利に如かず',meaning:'好機は地理的な有利さには及ばない',pattern:'「不如」で比較を表す',idea:'条件の優劣を比較して論を進める',source:'孟子'},
  {text:'地利不如人和',reading:'地の利は人の和に如かず',meaning:'地理的な有利さも人々の団結には及ばない',pattern:'同じ比較表現を反復する',idea:'人の団結が最も重要だと説く',source:'孟子'},
  {text:'己所不欲勿施於人',reading:'己の欲せざる所は人に施すこと勿かれ',meaning:'自分が望まないことを他人にしてはならない',pattern:'「勿〜」で禁止を表す',idea:'他者の立場を考える',source:'論語'},
  {text:'過而不改是謂過矣',reading:'過ちて改めざる、是を過ちと謂ふ',meaning:'過ちを犯しても改めないことこそ過ちという',pattern:'「不」を「ず」と訓読する',idea:'失敗を認めて改める',source:'論語'},
  {text:'知者不惑仁者不憂勇者不懼',reading:'知者は惑はず、仁者は憂へず、勇者は懼れず',meaning:'知恵ある人は迷わず、仁ある人は思い悩まず、勇気ある人は恐れない',pattern:'同じ構文を三度並べる',idea:'三つの徳を対句的に示す',source:'論語'},
  {text:'先天下之憂而憂',reading:'天下の憂ひに先んじて憂ひ',meaning:'世の人々より先に天下のことを心配し',pattern:'「先んじて」と動詞として読む',idea:'公を自分より先に考える',source:'岳陽楼記'},
  {text:'後天下之楽而楽',reading:'天下の楽しみに後れて楽しむ',meaning:'世の人々が楽しんだ後で自分も楽しむ',pattern:'前句と対句を作る',idea:'指導者の責任を説く',source:'岳陽楼記'},
  {text:'苛政猛於虎也',reading:'苛政は虎よりも猛なり',meaning:'厳しくむごい政治は虎よりも恐ろしい',pattern:'「於」を「より」と読み比較する',idea:'悪政が民衆へ与える害を説く',source:'礼記'},
];

const grammar = [
  {sentence:'私は、妹が昨日借りた本を読んだ。',part:'妹が昨日借りた',role:'名詞「本」を修飾する連体修飾節',relation:'主語「妹」と述語「借りた」が節を作る',rewrite:'妹は昨日、本を借りた。私はその本を読んだ。',caution:'「昨日」が借りた時を示すと捉える'},
  {sentence:'雨がやんだので、試合を再開した。',part:'雨がやんだので',role:'原因・理由を示す従属節',relation:'後半の再開理由を前半が示す',rewrite:'雨がやんだ。そのため、試合を再開した。',caution:'原因と結果の向きを逆にしない'},
  {sentence:'彼は笑いながら、静かに首を振った。',part:'笑いながら',role:'同時に行われる動作を示す修飾部',relation:'「笑う」と「首を振る」が同じ主体の動作である',rewrite:'彼は笑っていた。同時に、静かに首を振った。',caution:'二つの動作の主体を同じ人物と捉える'},
  {sentence:'先生が紹介した作家の新作を買った。',part:'先生が紹介した',role:'「作家」と「新作」のどちらにもかかり得る修飾節',relation:'修飾先によって文意が変わる',rewrite:'先生が紹介した作家による新作を買った。',caution:'曖昧さを避ける語を補う'},
  {sentence:'計画は変更されたが、目的は変わらない。',part:'変更されたが',role:'逆接によって後半へつなぐ部分',relation:'計画の変更と目的の不変を対比する',rewrite:'計画は変更された。しかし、目的は変わらない。',caution:'対立する内容の焦点をそろえる'},
  {sentence:'資料を比較すれば、相違点が明確になる。',part:'資料を比較すれば',role:'条件を示す従属節',relation:'比較することが明確化の条件になる',rewrite:'資料を比較する。その場合、相違点が明確になる。',caution:'仮定条件と確定した事実を区別する'},
  {sentence:'彼女は記録を調べ、仮説を立て、実験を始めた。',part:'記録を調べ、仮説を立て',role:'動作の順序を示す並列部分',relation:'三つの動作を時間順に並べる',rewrite:'彼女は記録を調べた。次に仮説を立て、実験を始めた。',caution:'並列された動作の順序を保つ'},
  {sentence:'私は彼が正しいと思う。',part:'彼が正しい',role:'思考内容を表す引用節',relation:'述語「思う」の内容を節が示す',rewrite:'私の考えでは、彼は正しい。',caution:'正しいと判断している主体は「私」である'},
  {sentence:'町を守るために、堤防が建設された。',part:'町を守るために',role:'目的を示す修飾部',relation:'建設の目的を前半が示す',rewrite:'堤防が建設された。その目的は町を守ることだ。',caution:'目的と原因を混同しない'},
  {sentence:'新聞によると、明日は交通規制が行われる。',part:'新聞によると',role:'情報源を示す独立的な修飾部',relation:'後半の情報の出所を限定する',rewrite:'新聞は、明日に交通規制が行われると報じている。',caution:'話し手自身の確認事項とは限らない'},
];

const vocabulary = [
  {word:'俯瞰',reading:'ふかん',meaning:'高い所から見下ろすように全体を捉えること',use:'複数の立場を俯瞰して論点を整理する。',related:'概観'},
  {word:'示唆',reading:'しさ',meaning:'直接言わず、それとなく気づかせること',use:'調査結果は別の原因の存在を示唆している。',related:'暗示'},
  {word:'看過',reading:'かんか',meaning:'見過ごして問題にしないこと',use:'小さな誤差でも看過できない。',related:'黙過'},
  {word:'享受',reading:'きょうじゅ',meaning:'利益や恵みを受け入れて味わうこと',use:'誰もが技術の恩恵を享受できる社会を目指す。',related:'受益'},
  {word:'踏襲',reading:'とうしゅう',meaning:'以前の方法や方針を受け継ぐこと',use:'従来の形式を踏襲しつつ内容を改める。',related:'継承'},
  {word:'収斂',reading:'しゅうれん',meaning:'多くのものが一つへまとまっていくこと',use:'議論は二つの案へ収斂した。',related:'集約'},
  {word:'蓋然性',reading:'がいぜんせい',meaning:'ある事柄が起こる可能性の程度',use:'複数の証拠から仮説の蓋然性を評価する。',related:'確からしさ'},
  {word:'恣意的',reading:'しいてき',meaning:'客観的な基準によらず思うままに行うさま',use:'資料を恣意的に選べば結論が偏る。',related:'独断的'},
  {word:'相対化',reading:'そうたいか',meaning:'他との関係の中で捉え直すこと',use:'自分の常識を異文化と比べて相対化する。',related:'位置づけ直し'},
  {word:'帰結',reading:'きけつ',meaning:'議論や原因から最終的に導かれる結果',use:'その前提からどのような帰結が生じるか考える。',related:'結論'},
];

const argumentsData = [
  {t:'生成AIの学校利用',claim:'利用過程と出典を示す条件で学習に活用する',reason:'情報を検証し修正する力を実践的に学べる',evidence:'検証手順を教えた授業では誤情報の指摘が増えた',counter:'自分で考えず回答を写すおそれがある',reply:'下書きと修正理由の提出を必須にする',criterion:'思考過程を説明できるか'},
  {t:'公共交通への投資',claim:'利用者の少ない地域でも最低限の路線を維持する',reason:'移動手段は生活機会へのアクセスを支える',evidence:'減便地域では通院や通学の選択肢が減った',counter:'赤字路線の維持は財政負担が大きい',reply:'需要に応じて車両と運行方式を小型化する',criterion:'費用と生活保障の両立'},
  {t:'文化財の公開',claim:'保存条件を満たす範囲でデジタル公開を進める',reason:'現地へ行けない人も資料を研究・鑑賞できる',evidence:'画像公開後に地域外から研究情報が寄せられた',counter:'画像だけでは実物の価値が伝わらない',reply:'寸法や材質の情報と実物公開を組み合わせる',criterion:'保存と利用可能性の均衡'},
  {t:'校則の見直し',claim:'目的と根拠を定期的に生徒と検証する',reason:'社会や学校環境の変化に規則を適応させられる',evidence:'見直し校では規則の理由を説明できる生徒が増えた',counter:'頻繁な変更は秩序を不安定にする',reply:'見直し時期と変更条件をあらかじめ定める',criterion:'必要性と予測可能性'},
  {t:'匿名表現',claim:'匿名性を残しつつ運営者が責任を追跡できる仕組みにする',reason:'弱い立場の発言機会と被害防止を両立できる',evidence:'内部通報では匿名窓口が情報提供を増やした',counter:'匿名では無責任な発言が増える',reply:'違反時のみ所定手続で確認できるようにする',criterion:'発言機会と責任の両立'},
  {t:'観光地の入場制限',claim:'混雑期には予約制を導入する',reason:'自然環境と住民生活への負荷を抑えられる',evidence:'試行期間にごみと交通渋滞が減少した',counter:'誰でも訪れられる機会が損なわれる',reply:'無料枠と当日枠を一定数設ける',criterion:'環境保全と公平な利用'},
  {t:'研究データの公開',claim:'個人情報を除いた研究データを原則公開する',reason:'第三者が結果を検証し再利用できる',evidence:'公開データから元研究とは別の傾向が発見された',counter:'整理と公開に研究者の負担がかかる',reply:'共通形式と保存支援の制度を整える',criterion:'検証可能性と実務負担'},
  {t:'地域の防災計画',claim:'住民の経験を専門家の想定へ組み込む',reason:'地図だけでは分からない地域特有の危険を補える',evidence:'聞き取りで過去の浸水経路が判明した',counter:'個人の記憶には誤りがあり得る',reply:'複数証言と公的記録を照合する',criterion:'専門知と経験知の統合'},
  {t:'スポーツの判定技術',claim:'映像判定は明確な対象場面に限定する',reason:'正確さを高めつつ試合の流れを保てる',evidence:'対象を限定した競技では確認時間が短縮した',counter:'機械を使うなら全判定を確認すべきだ',reply:'重要度と判定可能性に基準を設ける',criterion:'正確性と競技の連続性'},
  {t:'方言教育',claim:'地域学習で方言の記録と使用場面を扱う',reason:'言葉と地域文化の関係を理解できる',evidence:'聞き取り活動で昔の仕事に関する語が集まった',counter:'標準語の習得を妨げる可能性がある',reply:'場面による言葉の使い分けとして教える',criterion:'文化継承と言語運用力'},
];

const speeches = [
  {t:'選択する責任',audience:'進路を考える同級生',opening:'自分が二つの進路で迷った経験を示す',claim:'正解探しより選択の基準を言葉にすることが大切だ',story:'先生との対話で優先したい価値に気づいた',device:'二つの選択肢を対比した図',ending:'自分の基準を三語で書こうと促す'},
  {t:'記憶をつなぐ',audience:'地域の防災集会の参加者',opening:'祖母から聞いた浸水時の話を紹介する',claim:'個人の災害経験を地域の記録へつなぐべきだ',story:'古い写真から避難経路が判明した',device:'過去と現在の地図の重ね合わせ',ending:'家族の経験を一つ聞き取ろうと呼びかける'},
  {t:'失敗を語る',audience:'新入生',opening:'発表で資料を取り違えた失敗を明かす',claim:'失敗を共有すれば次の人の備えになる',story:'原因と対策を部内手順書へ残した',device:'失敗前後の手順の比較表',ending:'困った経験を一つ記録してほしいと結ぶ'},
  {t:'言葉の境界',audience:'多文化交流会の参加者',opening:'同じ挨拶が異なる意味に取られた例を示す',claim:'理解できない表現をすぐ誤りと決めないことが必要だ',story:'意味を尋ねたことで文化的背景を知った',device:'二言語の表現と場面の対応表',ending:'分からない時に一度質問しようと提案する'},
  {t:'数字の読み方',audience:'調査発表を行う生徒',opening:'同じ結果を示す二種類のグラフを比べる',claim:'数字だけでなく尺度と調査条件を確認すべきだ',story:'縦軸の省略で差を大きく見誤った',device:'軸の異なるグラフ二枚',ending:'資料を見る三つの確認点を共有する'},
  {t:'沈黙の役割',audience:'話し合いを急ぎがちな学級',opening:'発言が途切れた十秒間の体験を語る',claim:'沈黙を考える時間として待つことも対話である',story:'待った後に少数意見が示され案が改善した',device:'発言順と間を示す記録',ending:'次の話し合いで十秒待とうと提案する'},
  {t:'町を歩いて知る',audience:'地域調査を始める生徒',opening:'地図にはない細い水路を見つけた話から始める',claim:'資料調査と現地観察を組み合わせるべきだ',story:'水路沿いの聞き取りで昔の土地利用が分かった',device:'地図と現地写真の対照',ending:'一つの場所を二つの方法で調べようと促す'},
  {t:'受け継ぐということ',audience:'文化祭の来場者',opening:'伝統演目で道具だけ新しくした例を示す',claim:'変えない部分を選ぶことも継承の一部だ',story:'演者との対話で動作の意味を確認した',device:'旧版と新版の共通点一覧',ending:'変化の中の不変を見つけてほしいと結ぶ'},
  {t:'便利さの代価',audience:'学校のICT利用者',opening:'通知で集中が途切れた回数を提示する',claim:'技術は目的に応じて使わない時間も設けるべきだ',story:'通知を切る時間帯を決めて作業効率が上がった',device:'利用時間と集中度のグラフ',ending:'一つの通知設定を見直そうと呼びかける'},
  {t:'問いを持ち続ける',audience:'卒業を迎える同級生',opening:'三年間答えが変わった問いを紹介する',claim:'すぐ答えが出ない問いも持ち続ける価値がある',story:'異なる資料と人に出会うたび考えが更新された',device:'考えの変化を示す年表',ending:'卒業後へ持っていく問いを一つ選ぼうと結ぶ'},
];

const research = [
  {t:'通学路の安全',question:'時間帯によって危険箇所はどう変わるか',method:'朝夕に交通量と見通しを地点別に記録する',source:'現地観察・道路地図・住民への聞き取り',result:'夕方は西日で交差点の歩行者が見えにくかった',analysis:'交通量だけでなく光の条件も危険度へ影響する',limit:'季節による日没時刻の違いを調べていない'},
  {t:'地域の方言',question:'世代によって使用する方言語彙はどう異なるか',method:'同じ質問票で三世代へ聞き取りを行う',source:'録音・方言辞典・地域史資料',result:'仕事に関する語は高年層、感情表現は各世代に残った',analysis:'生活様式の変化が語彙の継承へ影響している',limit:'聞き取り人数が少なく地域全体へ一般化できない'},
  {t:'学校図書館',question:'本の配置は生徒の選択へどう影響するか',method:'展示前後の貸出冊数と利用者の動線を比較する',source:'貸出記録・観察記録・利用者アンケート',result:'入口展示の関連分野まで貸出が増えた',analysis:'目に入る位置と関連付けが本との出会いを増やした',limit:'試験期間と重なり通常時の利用と異なる可能性がある'},
  {t:'川の水質',question:'雨の前後で水の状態はどう変化するか',method:'同じ三地点で透明度と水温を継続測定する',source:'測定値・気象記録・土地利用図',result:'雨後は下流地点で透明度が大きく低下した',analysis:'流域から流れ込む土砂の量が地点差を生んだと考えられる',limit:'化学成分を測定しておらず汚濁原因を特定できない'},
  {t:'商店街の変化',question:'店舗構成は二十年間でどう変わったか',method:'年代別住宅地図を分類して店主へ聞き取る',source:'住宅地図・写真・商店会記録',result:'生活用品店が減り飲食店とサービス業が増えた',analysis:'居住人口と来訪者の需要変化が構成へ反映した',limit:'閉店理由を全店舗について確認できていない'},
  {t:'校内の電力',question:'教室の使い方と消費電力にはどんな関係があるか',method:'用途別の使用時間と電力計の値を一週間記録する',source:'電力記録・時間割・室温測定',result:'無人時間の空調と照明が一定量を占めた',analysis:'設備更新前にも運用改善で削減できる余地がある',limit:'季節の異なる月との比較がない'},
  {t:'祭りの継承',question:'地域の祭りで変化した部分と残った部分は何か',method:'年代別映像を比較し運営者へ半構造化面接を行う',source:'映像・プログラム・聞き取り記録',result:'衣装と時間帯は変わったが行列の順序は保たれた',analysis:'安全と参加者に合わせつつ儀礼の核を維持した',limit:'観客側が変化をどう捉えたか調べていない'},
  {t:'ニュースの見出し',question:'見出しの表現は記事内容の予測へどう影響するか',method:'表現の異なる見出しを示し予測内容を比較する',source:'回答票・元記事・表現分類表',result:'断定的な見出しほど原因まで確定したと予測された',analysis:'見出しの確実性表現が本文を読む前の判断を方向づける',limit:'対象記事が一分野に限られる'},
  {t:'公園の利用',question:'時間帯と設備によって利用者層はどう変わるか',method:'曜日と時間をそろえて人数と活動を観察する',source:'観察記録・公園図面・利用者への短い質問',result:'日陰とベンチのある区画は午後も幅広い年代が利用した',analysis:'休憩設備が滞在時間と利用可能な活動を広げた',limit:'天候条件を十分にそろえられていない'},
  {t:'睡眠と集中',question:'就寝時刻の変化と自己評価の集中度は関係するか',method:'二週間、就寝時刻と授業後の自己評価を記録する',source:'生活記録・自己評価票・時間割',result:'就寝が遅い翌日は集中度が低い傾向を示した',analysis:'睡眠時間が集中へ関係する可能性はあるが他要因もある',limit:'自己評価だけで客観的な集中度を測っていない'},
];

const make = (id:string,n:number):GeneralProblem => {
  const i=n%10,v=Math.floor(n/10);
  if(id==='KOKUGO_G9_U01'){const x=fiction[i];if(v===0)return{question:`小説「${x.t}」の語り手は？`,answer:x.narrator,options:c(x.narrator,fiction.map(z=>z.narrator),i),hint:'誰の視点で描かれるか見よう。'};if(v===1)return{question:`小説「${x.t}」で象徴的に用いられるものは？`,answer:x.symbol,options:c(x.symbol,fiction.map(z=>z.symbol),i),hint:'繰り返され意味が変化するものを選ぼう。'};if(v===2)return{question:`小説「${x.t}」で心情を暗示する描写は？`,answer:x.cue,options:c(x.cue,fiction.map(z=>z.cue),i),hint:'行動から内面を推測しよう。'};if(v===3)return{question:`小説「${x.t}」の人物の変化は？`,answer:x.change,options:c(x.change,fiction.map(z=>z.change),i),hint:'出来事の前後を比べよう。'};return{question:`小説「${x.t}」の構成と主題の組合せは？`,answer:`${x.structure}／${x.theme}`,options:c(`${x.structure}／${x.theme}`,fiction.map(z=>`${z.structure}／${z.theme}`),i),hint:'構成が主題をどう支えるか考えよう。'};}
  if(id==='KOKUGO_G9_U02'){const x=essays[i];if(v===0)return{question:`論説「${x.t}」が批判的に検討する課題は？`,answer:x.issue,options:c(x.issue,essays.map(z=>z.issue),i),hint:'筆者が問い直す考えを選ぼう。'};if(v===1)return{question:`論説「${x.t}」の主張は？`,answer:x.claim,options:c(x.claim,essays.map(z=>z.claim),i),hint:'課題に対する筆者の立場を選ぼう。'};if(v===2)return{question:`主張「${x.claim}」を支える事実は？`,answer:x.evidence,options:c(x.evidence,essays.map(z=>z.evidence),i),hint:'検証可能な根拠を選ぼう。'};if(v===3)return{question:`論説「${x.t}」で根拠と主張を結ぶ理由は？`,answer:x.warrant,options:c(x.warrant,essays.map(z=>z.warrant),i),hint:'根拠がなぜ主張を支えるのか考えよう。'};return{question:`反論「${x.counter}」への筆者の応答は？`,answer:x.response,options:c(x.response,essays.map(z=>z.response),i),hint:'反対意見を踏まえた再反論を選ぼう。'};}
  if(id==='KOKUGO_G9_U03'){const x=poetry[i];if(v===0)return{question:`詩歌「${x.text}」の形式は？`,answer:x.form,options:c(x.form,['俳句','短歌','自由詩','漢詩'],i),hint:'音数と行の構成を見よう。'};if(v===1)return{question:`詩歌「${x.text}」の表現技法は？`,answer:x.device,options:c(x.device,poetry.map(z=>z.device),i),hint:'比喩、対比、省略、象徴に注目しよう。'};if(v===2)return{question:`詩歌「${x.text}」の表現効果は？`,answer:x.effect,options:c(x.effect,poetry.map(z=>z.effect),i),hint:'技法と印象を関連づけよう。'};if(v===3)return{question:`詩歌「${x.text}」が描く状況は？`,answer:x.context,options:c(x.context,poetry.map(z=>z.context),i),hint:'語句から人物と場面を捉えよう。'};return{question:`詩歌「${x.text}」の主題は？`,answer:x.theme,options:c(x.theme,poetry.map(z=>z.theme),i),hint:'情景と心情を統合して考えよう。'};}
  if(id==='KOKUGO_G9_U04'){const x=classics[i];if(v===0)return{question:`古文「${x.text}」の現代語訳は？`,answer:x.modern,options:c(x.modern,classics.map(z=>z.modern),i),hint:'古語と文脈を対応させよう。'};if(v===1)return{question:`古文「${x.text}」の重要語句は？`,answer:x.word,options:c(x.word,classics.map(z=>z.word),i),hint:'現代語との意味の違いも確かめよう。'};if(v===2)return{question:`古文「${x.text}」の表現上の特徴は？`,answer:x.point,options:c(x.point,classics.map(z=>z.point),i),hint:'比喩、対句、描写、語り方を見よう。'};if(v===3)return{question:`古文「${x.text}」を理解する時代背景は？`,answer:x.background,options:c(x.background,classics.map(z=>z.background),i),hint:'作品成立時の社会や文化を考えよう。'};return{question:`古文「${x.text}」の出典は？`,answer:x.source,options:c(x.source,classics.map(z=>z.source),i),hint:'文章と作品名を結びつけよう。'};}
  if(id==='KOKUGO_G9_U05'){const x=kanbun[i];if(v===0)return{question:`漢文「${x.text}」の書き下し文は？`,answer:x.reading,options:c(x.reading,kanbun.map(z=>z.reading),i),hint:'返り点と句法を意識しよう。'};if(v===1)return{question:`「${x.reading}」の意味は？`,answer:x.meaning,options:c(x.meaning,kanbun.map(z=>z.meaning),i),hint:'訓読した文の内容を捉えよう。'};if(v===2)return{question:`漢文「${x.text}」の句法・構成上の要点は？`,answer:x.pattern,options:c(x.pattern,kanbun.map(z=>z.pattern),i),hint:'否定、比較、反復などを確認しよう。'};if(v===3)return{question:`漢文「${x.text}」が示す考えは？`,answer:x.idea,options:c(x.idea,kanbun.map(z=>z.idea),i),hint:'表現から思想や教訓を捉えよう。'};return{question:`漢文「${x.text}」の出典は？`,answer:x.source,options:c(x.source,kanbun.map(z=>z.source),i),hint:'思想と作品を結びつけよう。'};}
  if(id==='KOKUGO_G9_U06'){const x=grammar[i];if(v===0)return{question:`文「${x.sentence}」の「${x.part}」の働きは？`,answer:x.role,options:c(x.role,grammar.map(z=>z.role),i),hint:'文中で何を表す部分か考えよう。'};if(v===1)return{question:`文「${x.sentence}」の構造上の関係は？`,answer:x.relation,options:c(x.relation,grammar.map(z=>z.relation),i),hint:'節や修飾のつながりを整理しよう。'};if(v===2)return{question:`文「${x.sentence}」を意味を保って書き換えたものは？`,answer:x.rewrite,options:c(x.rewrite,grammar.map(z=>z.rewrite),i),hint:'論理関係と主体を保とう。'};if(v===3)return{question:`文「${x.sentence}」を解釈する際の注意は？`,answer:x.caution,options:c(x.caution,grammar.map(z=>z.caution),i),hint:'曖昧さや論理関係に注目しよう。'};return{question:`文「${x.sentence}」の構造を明確にする基本は？`,answer:'節の主語・述語と接続関係を整理する',options:d('節の主語・述語と接続関係を整理する','漢字の画数だけを数える','読点をすべて削除する','修飾語を無条件に文末へ移す'),hint:'複数の節がどう結ばれるか見よう。'};}
  if(id==='KOKUGO_G9_U07'){const x=vocabulary[i];if(v===0)return{question:`「${x.word}」の読みは？`,answer:x.reading,options:c(x.reading,vocabulary.map(z=>z.reading),i),hint:'語と読みを結びつけよう。'};if(v===1)return{question:`「${x.word}」の意味は？`,answer:x.meaning,options:c(x.meaning,vocabulary.map(z=>z.meaning),i),hint:'抽象語を正確に理解しよう。'};if(v===2)return{question:`「${x.word}」を適切に使った文は？`,answer:x.use,options:c(x.use,vocabulary.map(z=>z.use),i),hint:'意味と文脈が合う用例を選ぼう。'};if(v===3)return{question:`「${x.word}」と意味が近い語は？`,answer:x.related,options:c(x.related,vocabulary.map(z=>z.related),i),hint:'類義関係を確かめよう。'};return{question:`論説文中の「${x.word}」の意味を確定する方法は？`,answer:'辞書の意味と前後の論理を照合する',options:d('辞書の意味と前後の論理を照合する','読みだけで決める','画数の多さで選ぶ','文脈を見ず一つの意味に固定する'),hint:'語義と文脈の両方を使おう。'};}
  if(id==='KOKUGO_G9_U08'){const x=essays[i];if(v===0)return{question:`論説「${x.t}」の要旨は？`,answer:x.claim,options:c(x.claim,essays.map(z=>z.claim),i),hint:'中心となる主張を選ぼう。'};if(v===1)return{question:`論説「${x.t}」の要約に残す課題は？`,answer:x.issue,options:c(x.issue,essays.map(z=>z.issue),i),hint:'主張が答える問題を残そう。'};if(v===2)return{question:`論説「${x.t}」の要約に残す根拠は？`,answer:x.evidence,options:c(x.evidence,essays.map(z=>z.evidence),i),hint:'主張を直接支える事実を選ぼう。'};if(v===3)return{question:`論説「${x.t}」の要約に必要な論拠は？`,answer:x.warrant,options:c(x.warrant,essays.map(z=>z.warrant),i),hint:'事実と主張を結ぶ理由を残そう。'};return{question:`論説「${x.t}」で反論を要約に含める方法は？`,answer:`「${x.counter}」に対し「${x.response}」とまとめる`,options:c(`「${x.counter}」に対し「${x.response}」とまとめる`,essays.map(z=>`「${z.counter}」に対し「${z.response}」とまとめる`),i),hint:'反論と再反論を対応させよう。'};}
  if(id==='KOKUGO_G9_U09'){const x=argumentsData[i];if(v===0)return{question:`論説文「${x.t}」の主張は？`,answer:x.claim,options:c(x.claim,argumentsData.map(z=>z.claim),i),hint:'論題に対する立場を明確にしよう。'};if(v===1)return{question:`主張「${x.claim}」の理由は？`,answer:x.reason,options:c(x.reason,argumentsData.map(z=>z.reason),i),hint:'主張の必要性を示す説明を選ぼう。'};if(v===2)return{question:`主張「${x.claim}」を支える根拠は？`,answer:x.evidence,options:c(x.evidence,argumentsData.map(z=>z.evidence),i),hint:'検証可能な資料を選ぼう。'};if(v===3)return{question:`反論「${x.counter}」への再反論は？`,answer:x.reply,options:c(x.reply,argumentsData.map(z=>z.reply),i),hint:'懸念を踏まえて主張を調整しよう。'};return{question:`論説文「${x.t}」で案を評価する基準は？`,answer:x.criterion,options:c(x.criterion,argumentsData.map(z=>z.criterion),i),hint:'対立する価値を比較する観点を選ぼう。'};}
  if(id==='KOKUGO_G9_U10'){const x=speeches[i];if(v===0)return{question:`スピーチ「${x.t}」が想定する聞き手は？`,answer:x.audience,options:c(x.audience,speeches.map(z=>z.audience),i),hint:'内容と呼びかけから考えよう。'};if(v===1)return{question:`スピーチ「${x.t}」の導入は？`,answer:x.opening,options:c(x.opening,speeches.map(z=>z.opening),i),hint:'聞き手を主題へ導く始め方を選ぼう。'};if(v===2)return{question:`スピーチ「${x.t}」の中心的な主張は？`,answer:x.claim,options:c(x.claim,speeches.map(z=>z.claim),i),hint:'最も伝えたい考えを選ぼう。'};if(v===3)return{question:`主張「${x.claim}」を支える経験と資料は？`,answer:`${x.story}／${x.device}`,options:c(`${x.story}／${x.device}`,speeches.map(z=>`${z.story}／${z.device}`),i),hint:'具体例と視覚資料を対応させよう。'};return{question:`スピーチ「${x.t}」の結びは？`,answer:x.ending,options:c(x.ending,speeches.map(z=>z.ending),i),hint:'主張を聞き手の行動へつなげよう。'};}
  if(id==='KOKUGO_G9_U11'){const x=argumentsData[i];if(v===0)return{question:`討論「${x.t}」の提案は？`,answer:x.claim,options:c(x.claim,argumentsData.map(z=>z.claim),i),hint:'提案側の立場を選ぼう。'};if(v===1)return{question:`討論で「${x.claim}」を支える根拠は？`,answer:x.evidence,options:c(x.evidence,argumentsData.map(z=>z.evidence),i),hint:'検証可能な事実を選ぼう。'};if(v===2)return{question:`提案「${x.claim}」への反論は？`,answer:x.counter,options:c(x.counter,argumentsData.map(z=>z.counter),i),hint:'異なる立場の懸念を捉えよう。'};if(v===3)return{question:`反論「${x.counter}」を踏まえた修正案は？`,answer:x.reply,options:c(x.reply,argumentsData.map(z=>z.reply),i),hint:'反論を取り入れて案を具体化しよう。'};return{question:`討論「${x.t}」で合意形成に用いる評価基準は？`,answer:x.criterion,options:c(x.criterion,argumentsData.map(z=>z.criterion),i),hint:'双方が共有できる判断軸を選ぼう。'};}
  const x=research[i];if(v===0)return{question:`研究「${x.t}」の問いは？`,answer:x.question,options:c(x.question,research.map(z=>z.question),i),hint:'調査で明らかにする対象を選ぼう。'};if(v===1)return{question:`研究課題「${x.question}」に合う方法は？`,answer:x.method,options:c(x.method,research.map(z=>z.method),i),hint:'比較条件と記録方法を確認しよう。'};if(v===2)return{question:`研究「${x.t}」で組み合わせる資料は？`,answer:x.source,options:c(x.source,research.map(z=>z.source),i),hint:'複数の方法で確かめられる資料を選ぼう。'};if(v===3)return{question:`結果「${x.result}」から導いた考察は？`,answer:x.analysis,options:c(x.analysis,research.map(z=>z.analysis),i),hint:'結果に基づき、断定し過ぎない説明を選ぼう。'};return{question:`研究「${x.t}」の限界は？`,answer:x.limit,options:c(x.limit,research.map(z=>z.limit),i),hint:'調査範囲や方法で未検証の点を選ぼう。'};
};

const passageFor = (id:string,n:number):{passage:string;passageTitle:string}|null => {
  const i=n%10;
  if(id==='KOKUGO_G9_U01')return{passage:fictionPassages[i],passageTitle:`小説「${fiction[i].t}」本文`};
  if(id==='KOKUGO_G9_U02'||id==='KOKUGO_G9_U08'){
    const x=essays[i];
    return{passage:`${x.issue}には注意が必要だ。${x.evidence}。これは、${x.warrant}である。したがって、${x.claim}。一方、「${x.counter}」との反論もある。これに対しては、${x.response}。`,passageTitle:`論説「${x.t}」本文`};
  }
  if(id==='KOKUGO_G9_U09'||id==='KOKUGO_G9_U11'){
    const x=argumentsData[i];
    return{passage:`私は、${x.claim}べきだと考える。${x.reason}からだ。${x.evidence}。ただし、「${x.counter}」との反論がある。そこで、${x.reply}。この案は「${x.criterion}」という基準で評価できる。`,passageTitle:`論説文「${x.t}」本文`};
  }
  if(id==='KOKUGO_G9_U10'){
    const x=speeches[i];
    return{passage:`${x.opening}。ここで伝えたいのは、${x.claim}ということだ。${x.story}。資料として${x.device}を示す。最後に、${x.ending}。`,passageTitle:`スピーチ「${x.t}」原稿`};
  }
  if(id==='KOKUGO_G9_U12'){
    const x=research[i];
    return{passage:`研究課題は「${x.question}」である。${x.method}。資料には${x.source}を用いた。その結果、${x.result}。ここから、${x.analysis}と考えた。ただし、${x.limit}という限界がある。`,passageTitle:`研究「${x.t}」要旨`};
  }
  return null;
};

Object.keys(KOKUGO_G9_UNIT_DATA).forEach(id=>KOKUGO_G9_UNIT_DATA[id]=Array.from({length:50},(_,n)=>{const problem=make(id,n),passage=passageFor(id,n);return passage?{...problem,...passage}:problem;}));
export const KOKUGO_G9_DATA: Record<string, GeneralProblem[]> = { KOKUGO_G9_1:Object.values(KOKUGO_G9_UNIT_DATA).flat(), ...KOKUGO_G9_UNIT_DATA };
