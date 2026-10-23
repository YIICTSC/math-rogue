import type { EndlessEndingPage } from './endlessEndingSequences';

/** Authored translations; do not run these through the event-text fallback. */
export type SummerText = readonly [ja: string, hira: string, en: string];
export interface SummerStoryBeat {
  title: SummerText;
  text: SummerText;
  dialogue: SummerText;
}
export type SummerStory = readonly [SummerStoryBeat, SummerStoryBeat, SummerStoryBeat];
const beat = (title: SummerText, text: SummerText, dialogue: SummerText): SummerStoryBeat => ({ title, text, dialogue });

/** The summer conclusion follows the same Chapter 50 victory, not a second battle. */
export const HIGH_SCHOOL_VACATION_TRUE_ENDINGS = {
  WARRIOR: [
    beat(['波がほどく黒い鎖', 'なみが ほどく くろい くさり', 'Chains beneath the Waves'],
      ['海上に重なっていた黒帳機関の観測網が崩れた。開いた帳面には、命令も採点も、もう浮かばない。', 'かいじょうに かさなっていた こくちょうきかんの かんそくもうが くずれた。ひらいた ちょうめんには、めいれいも さいてんも、もう うかばない。', 'The Bureau’s surveillance lattice collapsed above the sea. No orders or scores appeared in the open ledger anymore.'],
      ['俺たちの夏まで、勝手に決めさせるかよ。これで本当に、取り返したな。', 'おれたちの なつまで、かってに きめさせるかよ。これで ほんとうに、とりかえしたな。', 'They don’t get to decide our summer, either. We finally took it back.']),
    beat(['誰のものでもない足跡', 'だれの ものでもない あしあと', 'Footprints of Our Own'],
      ['夜明けの浜辺で、白紙の帳面を置いた。次の一歩を示す線はない。それでも、自分の足で砂を踏み出せた。', 'よあけの はまべで、はくしの ちょうめんを おいた。つぎの いっぽを しめす せんは ない。それでも、じぶんの あしで すなを ふみだせた。', 'He set the blank ledger on the dawn beach. No line dictated his next step. He stepped forward anyway, leaving his own footprints.'],
      ['正解の道がなくてもいい。間違えたら、俺たちで選び直す。', 'せいかいの みちが なくても いい。まちがえたら、おれたちで えらびなおす。', 'We don’t need a perfect path. If we’re wrong, we’ll choose again.']),
    beat(['反逆の、その先へ', 'はんぎゃくの、その さきへ', 'Beyond Rebellion'],
      ['海の家から仲間が呼んでいる。閉じた帳面を小脇に、彼は走り出した。反逆の先には、守りたい何でもない一日があった。', 'うみの いえから なかまが よんでいる。とじた ちょうめんを こわきに、かれは はしりだした。はんぎゃくの さきには、まもりたい なんでもない いちにちが あった。', 'His friends called from the beach house. Ledger tucked under his arm, he ran toward them. Beyond rebellion lay an ordinary day worth protecting.'],
      ['まずは飯だな。その先の冒険は、みんなで決めようぜ。', 'まずは めしだな。その さきの ぼうけんは、みんなで きめようぜ。', 'Food first. Then let’s decide our next adventure together.']),
  ],
  CARETAKER: [
    beat(['小さな鼓動を抱いて', 'ちいさな こどうを だいて', 'A Small Heartbeat'],
      ['最後の観測鎖が海へほどけた。腕の中のうさぎが身を寄せる。その温かさは、機関の数字には収まらない。', 'さいごの かんそくさが うみへ ほどけた。うでの なかの うさぎが みを よせる。その あたたかさは、きかんの すうじには おさまらない。', 'The last surveillance chain dissolved over the sea. Her rabbit nestled closer. Its warmth could never be reduced to the Bureau’s numbers.'],
      ['怖かったね。もう大丈夫。あなたが生きていることに、点数はいらないよ。', 'こわかったね。もう だいじょうぶ。あなたが いきている ことに、てんすうは いらないよ。', 'That was scary, wasn’t it? You’re safe. Being alive doesn’t need a score.']),
    beat(['潮だまりの観察会', 'しおだまりの かんさつかい', 'Life in a Tide Pool'],
      ['静けさを取り戻した磯で、小さなカニが岩陰から出てきた。先輩は捕まえず、同じ目線までしゃがんで見守った。', 'しずけさを とりもどした いそで、ちいさな かにが いわかげから でてきた。せんぱいは つかまえず、おなじ めせんまで しゃがんで みまもった。', 'A tiny crab emerged in the quiet tide pool. Instead of catching it, she crouched down and watched it go about its life.'],
      ['知ることと、支配することは違う。私は、この子たちの暮らしを知りたいんだ。', 'しることと、しはいすることは ちがう。わたしは、この こたちの くらしを しりたいんだ。', 'Understanding isn’t control. I want to learn how these little ones live.']),
    beat(['空欄から育つ研究', 'くうらんから そだつ けんきゅう', 'Room for Discovery'],
      ['海辺の観察帳の最初には、まだ名前のない発見が並んだ。答えを急がず待つ時間も、大切な研究になる。', 'うみべの かんさつちょうの さいしょには、まだ なまえの ない はっけんが ならんだ。こたえを いそがず まつ じかんも、たいせつな けんきゅうに なる。', 'Her beach journal began with discoveries she could not yet name. Taking time to wait for answers was part of good research, too.'],
      ['次の夏も、一緒に観察しようね。知らないことがあるって、うれしいね。', 'つぎの なつも、いっしょに かんさつしようね。しらないことが あるって、うれしいね。', 'Let’s come back next summer. Isn’t it wonderful that there’s more to learn?']),
  ],
  ASSASSIN: [
    beat(['消えた監視の水鏡', 'きえた かんしの みずかがみ', 'The Watching Mirror Breaks'],
      ['海辺の水鏡から、追跡の印が消えた。閉じた扇の向こうに、任務ではない夜祭りの灯りが見えた。', 'うみべの みずかがみから、ついせきの しるしが きえた。とじた おうぎの むこうに、にんむでは ない よまつりの あかりが みえた。', 'The tracking mark vanished from the seaside pool. Beyond the folded fan shone festival lanterns, not another mission.'],
      ['隠れる理由が、ひとつ減った。今夜の行き先は自分で決める。', 'かくれる りゆうが、ひとつ へった。こんやの いきさきは じぶんで きめる。', 'One less reason to hide. Tonight, I decide where I go.']),
    beat(['名札を外す夜', 'なふだを はずす よる', 'More than an Assigned Name'],
      ['機関に与えられた札を帯から外した。誰かの役を演じなくても、仲間はいつもの声で呼び止めてくれた。', 'きかんに あたえられた ふだを おびから はずした。だれかの やくを えんじなくても、なかまは いつもの こえで よびとめて くれた。', 'The Bureau’s identity tag came off the sash. Without playing an assigned role, the transfer student still heard friends calling in familiar voices.'],
      ['本当の名前は、命令書にはない。呼んでくれる人の中にあるんだね。', 'ほんとうの なまえは、めいれいしょには ない。よんでくれる ひとの なかに あるんだね。', 'A real name isn’t on an order sheet. It lives with the people who call you.']),
    beat(['光の道を歩く', 'ひかりの みちを あるく', 'Walking in the Open'],
      ['翌朝、転入生は影ではなく海沿いの大通りを選んだ。露店の準備を手伝う背中に、もう追っ手を探す緊張はなかった。', 'よくあさ、てんにゅうせいは かげでは なく うみぞいの おおどおりを えらんだ。ろてんの じゅんびを てつだう せなかに、もう おってを さがす きんちょうは なかった。', 'Next morning, the transfer student chose the open promenade rather than the shadows. Helping set up the stalls no longer meant watching for pursuers.'],
      ['今日は堂々と寄り道する。見失わないよう、隣にいて。', 'きょうは どうどうと よりみちする。みうしなわないよう、となりに いて。', 'Today, I’ll take my detour in plain sight. Stay beside me so we don’t get lost.']),
  ],
  MAGE: [
    beat(['支配を溶かす一滴', 'しはいを とかす いってき', 'A Drop against Control'],
      ['浜辺の実験台で、黒い制御結晶は透明な水に変わった。観測のために閉ざされた海が、再び潮の満ち引きを取り戻す。', 'はまべの じっけんだいで、くろい せいぎょけっしょうは とうめいな みずに かわった。かんそくの ために とざされた うみが、ふたたび しおの みちひきを とりもどす。', 'On her beach workbench, the black control crystal became clear water. The sea, once locked down for observation, found its tides again.'],
      ['反応終了。誰かを従わせる式なんて、これで最後にしましょう。', 'はんのう しゅうりょう。だれかを したがわせる しきなんて、これで さいごに しましょう。', 'Reaction complete. Let that be the last formula used to control someone.']),
    beat(['比べるための試験管', 'くらべる ための しけんかん', 'Vials for Questions'],
      ['会長は三本の海水を光に透かした。違いを見つける実験は、誰かを優劣に分けるためではなく、世界を知るためにある。', 'かいちょうは さんぼんの かいすいを ひかりに すかした。ちがいを みつける じっけんは、だれかを ゆうれつに わける ためでは なく、せかいを しる ために ある。', 'She held three seawater samples to the light. Comparing differences could explain the world without ranking the worth of people.'],
      ['同じ海でも、こんなに違う。結論より先に、もっと質問が増えたわ。', 'おなじ うみでも、こんなに ちがう。けつろんより さきに、もっと しつもんが ふえたわ。', 'So many differences in one sea. I’ve found more questions than conclusions.']),
    beat(['次の実験は自由研究', 'つぎの じっけんは じゆうけんきゅう', 'An Experiment of Our Own'],
      ['安全眼鏡をもう一組置き、会長は自由研究の机を広げた。失敗しても消されない記録から、次の学びが始まる。', 'あんぜんめがねを もう ひとくみ おき、かいちょうは じゆうけんきゅうの つくえを ひろげた。しっぱいしても けされない きろくから、つぎの まなびが はじまる。', 'She set out a second pair of safety goggles. On this workbench, failed attempts would stay in the record and inspire the next discovery.'],
      ['助手、募集中よ。条件はひとつ。わからないことを、楽しめる人。', 'じょしゅ、ぼしゅうちゅうよ。じょうけんは ひとつ。わからないことを、たのしめる ひと。', 'Assistant wanted. One requirement: enjoy not knowing the answer yet.']),
  ],
  DODGEBALL: [
    beat(['最後のブザーの向こう', 'さいごの ぶざーの むこう', 'After the Final Buzzer'],
      ['海上の得点板が消え、最後の笛だけが浜に響いた。機関に決められた勝敗から解き放たれ、エースは大きく息を吐いた。', 'かいじょうの とくてんばんが きえ、さいごの ふえだけが はまに ひびいた。きかんに きめられた しょうはいから ときはなたれ、えーすは おおきく いきを はいた。', 'The scoreboard above the sea vanished. The ace exhaled as the final whistle freed everyone from the Bureau’s predetermined results.'],
      ['やっと試合終了だ。勝ったのは俺だけじゃない。このチーム全員だ！', 'やっと しあいしゅうりょうだ。かったのは おれだけじゃない。この ちーむ ぜんいんだ！', 'Finally, the game is over. This wasn’t just my win. It belongs to the whole team!']),
    beat(['砂浜のパス練習', 'すなはまの ぱすれんしゅう', 'Passing on the Sand'],
      ['浜辺で渡したボールを、仲間が取り落とした。笑いながらもう一度投げる。失敗を責める声は、どこからも来なかった。', 'はまべで わたした ぼーるを、なかまが とりおとした。わらいながら もういちど なげる。しっぱいを せめる こえは、どこからも こなかった。', 'A friend fumbled his pass on the beach. Laughing, he tossed the ball again. No distant voice punished the mistake.'],
      ['落としても、また渡せばいい。パスを出す相手がいるって、最高だな。', 'おとしても、また わたせば いい。ぱすを だす あいてが いるって、さいこうだな。', 'Drop it? We’ll pass again. Having someone to pass to is what matters.']),
    beat(['点数のない円陣', 'てんすうの ない えんじん', 'A Huddle without Scores'],
      ['日暮れのコートに仲間が集まる。次の大会の前に、まず全員で夏の思い出を作ると決めた。', 'ひぐれの こーとに なかまが あつまる。つぎの たいかいの まえに、まず ぜんいんで なつの おもいでを つくると きめた。', 'Everyone gathered on the court at dusk. Before chasing the next tournament, they would make a summer memory together.'],
      ['次も一緒に走ろうぜ。ベンチもコートも、全員分の場所を空けとく！', 'つぎも いっしょに はしろうぜ。べんちも こーとも、ぜんいんぶんの ばしょを あけとく！', 'Run with me again. There’s room for everyone, on the court and on the bench!']),
  ],
  BARD: [
    beat(['放送終了、夏のはじまり', 'ほうそうしゅうりょう、なつの はじまり', 'Signing Off, Summer Begins'],
      ['黒帳機関の強制放送が途切れた。海辺のスピーカーから聞こえたのは、ディーバ自身の少し震える息だった。', 'こくちょうきかんの きょうせいほうそうが とぎれた。うみべの すぴーかーから きこえたのは、でぃーば じしんの すこし ふるえる いきだった。', 'The Bureau’s forced broadcast stopped. From the seaside speakers came the diva’s own slightly trembling breath.'],
      ['こちら、自由になった放送部です。最初のお知らせは、みんな無事、です！', 'こちら、じゆうに なった ほうそうぶです。さいしょの おしらせは、みんな ぶじ、です！', 'This is your newly free broadcasting club. First announcement: everyone is safe!']),
    beat(['潮騒に声を重ねて', 'しおさいに こえを かさねて', 'A Voice beside the Surf'],
      ['台本を閉じ、彼女は波音に合わせて歌った。上手に届けることよりも、今の気持ちを偽らないことを選ぶ。', 'だいほんを とじ、かのじょは なみおとに あわせて うたった。じょうずに とどけることよりも、いまの きもちを いつわらないことを えらぶ。', 'She closed the script and sang with the surf. Rather than sounding perfect, she chose to be honest about how she felt.'],
      ['途中で声が裏返っても、止めないでね。これが今日の私の歌だから。', 'とちゅうで こえが うらがえっても、とめないでね。これが きょうの わたしの うただから。', 'If my voice cracks, let me finish. This is my song for today.']),
    beat(['次回放送は待ち合わせ', 'じかいほうそうは まちあわせ', 'Our Next Broadcast: Meet Here'],
      ['夕暮れの小さな舞台に、仲間の拍手が集まった。次の放送予定には、命令ではなく海辺の待ち合わせを書き込んだ。', 'ゆうぐれの ちいさな ぶたいに、なかまの はくしゅが あつまった。つぎの ほうそうよていには、めいれいでは なく うみべの まちあわせを かきこんだ。', 'Her friends applauded the small sunset stage. The next broadcast schedule announced a beach get-together, not another order.'],
      ['またここで会おうね。あなたの声も、次の番組で聞かせて！', 'また ここで あおうね。あなたの こえも、つぎの ばんぐみで きかせて！', 'Let’s meet here again. I want to hear your voice on the next show, too!']),
  ],
  LIBRARIAN: [
    beat(['最終頁は燃やさない', 'さいしゅうぺーじは もやさない', 'Keep the Last Page'],
      ['黒帳機関の最後の頁を、書記は破らず封じた。傷つけられた人の記録まで、勝利の陰で消してはいけない。', 'こくちょうきかんの さいごの ぺーじを、しょきは やぶらず ふうじた。きずつけられた ひとの きろくまで、しょうりの かげで けしては いけない。', 'The secretary sealed the Bureau’s final page instead of tearing it up. Victory must not erase the stories of the people it hurt.'],
      ['終わったからこそ、忘れないために残す。これは、あの人たちの頁だから。', 'おわったからこそ、わすれない ために のこす。これは、あの ひとたちの ぺーじだから。', 'Now that it’s over, we keep it so we won’t forget. These pages belong to them.']),
    beat(['砂をはさんだ栞', 'すなを はさんだ しおり', 'A Bookmark Full of Sand'],
      ['海風にめくれる手帳には、旅の失敗談も残した。波に濡れた栞が、誰も筋書きを知らなかった夏を示している。', 'うみかぜに めくれる てちょうには、たびの しっぱいだんも のこした。なみに ぬれた しおりが、だれも すじがきを しらなかった なつを しめしている。', 'The sea breeze turned a journal that kept their blunders, too. Its damp bookmark marked a summer whose plot nobody had known.'],
      ['格好悪いところも書いていい？そこに、私たちらしさがある気がするの。', 'かっこうわるい ところも かいて いい？そこに、わたしたちらしさが ある きが するの。', 'May I keep the embarrassing parts? I think that’s where our real story is.']),
    beat(['続きは白い頁で', 'つづきは しろい ぺーじで', 'The Next Page Is Blank'],
      ['海辺の読書席で、新しいノートを開いた。誰かに書かれた結末の先へ、書記は自分の言葉を置く。', 'うみべの どくしょせきで、あたらしい のーとを ひらいた。だれかに かかれた けつまつの さきへ、しょきは じぶんの ことばを おく。', 'At a seaside reading table, she opened a fresh notebook. Beyond someone else’s ending, she began writing in her own words.'],
      ['完結は、ここまで。ここから先は、まだ知らない私たちの話ね。', 'かんけつは、ここまで。ここから さきは、まだ しらない わたしたちの はなしね。', 'This story ends here. What comes next is ours, and we haven’t read it yet.']),
  ],
  CHEF: [
    beat(['最後の命令を下ろす', 'さいごの めいれいを おろす', 'Take Orders off the Menu'],
      ['深層から戻り、料理長は黒い配給札を調理台から外した。必要な量も好きな味も、今度は一人ずつ尋ねればいい。', 'しんそうから もどり、りょうりちょうは くろい はいきゅうふだを ちょうりだいから はずした。ひつような りょうも すきな あじも、こんどは ひとりずつ たずねれば いい。', 'Back from the depths, the chef removed the black ration tag. This time, he would ask each person what they wanted to eat.'],
      ['食べる量まで命令されてたまるか。腹の声は、自分で聞けばいい。', 'たべる りょうまで めいれいされて たまるか。はらの こえは、じぶんで きけば いい。', 'Nobody orders your appetite around. Listen to your own stomach.']),
    beat(['浜辺のまかない', 'はまべの まかない', 'A Meal by the Beach'],
      ['浜辺の鍋から湯気が上がった。戦った仲間へ渡す一皿は、成績順ではなく、冷めないうちに食べたい人から。', 'はまべの なべから ゆげが あがった。たたかった なかまへ わたす ひとさらは、せいせきじゅんでは なく、さめない うちに たべたい ひとから。', 'Steam rose from the beach kitchen. The meal went not to the highest scorers first, but to anyone ready to eat while it was hot.'],
      ['おかわりも休憩も遠慮するな。今日はちゃんと、自分をいたわれ。', 'おかわりも きゅうけいも えんりょするな。きょうは ちゃんと、じぶんを いたわれ。', 'Ask for seconds. Take a break. Today, take proper care of yourself.']),
    beat(['予約のいらない食卓', 'よやくの いらない しょくたく', 'A Table with Room for You'],
      ['夕焼けの長机には、空いた椅子も用意した。まだ帰り着いていない誰かにも、温かい食事の場所を残しておく。', 'ゆうやけの ながづくえには、あいた いすも よういした。まだ かえりついていない だれかにも、あたたかい しょくじの ばしょを のこして おく。', 'An empty chair waited at the sunset table. Anyone still finding their way home would have a place and a warm meal.'],
      ['いつでも来い。次の冒険の帰りも、ちゃんと一人分取っとくからな。', 'いつでも こい。つぎの ぼうけんの かえりも、ちゃんと ひとりぶん とっとくからな。', 'Come anytime. After your next adventure, I’ll still have a plate for you.']),
  ],
  GARDENER: [
    beat(['潮風に解ける檻', 'しおかぜに とける おり', 'A Cage Unravels in Sea Air'],
      ['黒い観測の檻が消え、鉢植えに本物の潮風が届いた。部長は折れた枝を確かめ、残った芽にそっと水を注いだ。', 'くろい かんそくの おりが きえ、はちうえに ほんものの しおかぜが とどいた。ぶちょうは おれた えだを たしかめ、のこった めに そっと みずを そそいだ。', 'The observation cage vanished, letting real sea air reach her potted plant. She checked a broken branch and watered its surviving bud.'],
      ['全部を元通りにはできない。でも、ここから伸びる芽を守ることはできる。', 'ぜんぶを もとどおりには できない。でも、ここから のびる めを まもることは できる。', 'We can’t restore everything. But we can protect what grows from here.']),
    beat(['急がせない花壇', 'いそがせない かだん', 'A Garden Allowed to Grow'],
      ['浜辺の花壇から、成長を測る札を抜いた。咲く日が違っていてもよい場所に、部長は小さな苗を植え直す。', 'はまべの かだんから、せいちょうを はかる ふだを ぬいた。さく ひが ちがっていても よい ばしょに、ぶちょうは ちいさな なえを うえなおす。', 'She removed the growth-rating tags from the beach garden. Here, she replanted seedlings allowed to bloom on different days.'],
      ['早く咲くことだけが強さじゃない。あなたの季節を、一緒に待とう。', 'はやく さくことだけが つよさじゃない。あなたの きせつを、いっしょに まとう。', 'Blooming first isn’t the only kind of strength. Let’s wait for your season.']),
    beat(['持ち帰る夏の種', 'もちかえる なつの たね', 'Seeds of This Summer'],
      ['旅の鞄に、浜辺で育てた種を収めた。学校の庭に植える時、この夏に選び取った自由も一緒に根を張るだろう。', 'たびの かばんに、はまべで そだてた たねを おさめた。がっこうの にわに うえる とき、この なつに えらびとった じゆうも いっしょに ねを はるだろう。', 'She packed seeds from the beach garden. Back at school, the freedom they had chosen this summer would take root beside them.'],
      ['続きは学校の庭でね。次の花が咲いたら、いちばんに知らせる。', 'つづきは がっこうの にわでね。つぎの はなが さいたら、いちばんに しらせる。', 'We’ll continue in the school garden. You’ll be the first to know when they bloom.']),
  ],
} satisfies Record<string, SummerStory>;

export const buildSummerEndingPages = (story: SummerStory, folder: string): [EndlessEndingPage, EndlessEndingPage, EndlessEndingPage] =>
  story.map((page, index) => ({
    title: page.title[0], titleHiragana: page.title[1], titleEnglish: page.title[2],
    scene: page.text[2],
    text: page.text[0], textHiragana: page.text[1], textEnglish: page.text[2],
    dialogue: page.dialogue[0], dialogueHiragana: page.dialogue[1], dialogueEnglish: page.dialogue[2],
    imagePath: `${folder}/${index + 1}.webp`,
  })) as [EndlessEndingPage, EndlessEndingPage, EndlessEndingPage];
