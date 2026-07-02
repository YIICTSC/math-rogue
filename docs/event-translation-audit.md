# 学習ローグ イベント翻訳一覧

生成日: 2026-07-01

対象: 全編のイベント関連ソースから、イベント画面に表示される可能性が高い title / description / label / text / result / resultLog 系の文字列を抽出。問題文・単元名・通常ストーリー本文は対象外。

動的な結果文は、カード名や人数などにサンプル値を入れて翻訳表示を確認しています。ひらがな表示はイベント画面と同じ transEventText(..., HIRAGANA) 経路です。

## サマリー

- 抽出行数: 2966
- 対象ファイル数: 11
- 英語欄に日本語が残る行: 0
- 英語欄が汎用/弱い翻訳に見える行: 0（2026-07-02 再チェック）
- ひらがな欄に漢字が残る行: 0（2026-07-02 再チェック）

## 2026-07-02 追補

この監査で「汎用/弱い英訳」として抽出されていた行は、`src/utils/textUtils.ts` のイベント翻訳辞書・結果文パターン追加で修正済み。

- `<br>` 区切りのイベント結果文を全文翻訳対象に変更
- 引用内のキャラ名・カード名・レリック名が空になる問題を修正
- マジック友情ルートのタイトル / イベントタイトル / エンド名を個別英訳化
- 監査 Markdown 全体 3166 行に対する簡易再チェックでは、英語の汎用表示・日本語残りは 0 件

## 2026-07-02 ひらがな追補

イベント監査 Markdown 全体 3166 行に対して、`transEventText(..., HIRAGANA)` の再チェックを実施。漢字残りは 0 件。

- 監査対象のイベント表示文字列は `src/data/eventHiraganaExact.ts` の exact map を優先
- `pykakasi` 生成後に、キャラ名、ゲーム用語、カード / おたから / HP / G などを補正
- 単漢字の部分置換による `公しき`、`に走`、`し性` のような誤読を避ける経路へ変更

## 2026-07-02 修正後実表示

以下の各イベント表は、原文ごとに現在の `transEventText(..., HIRAGANA)` と `transEventText(..., ENGLISH)` を再実行した実表示です。

- 再生成対象: 3166 行
- ひらがな表示の漢字残り: 0 件
- 英語表示の日本語残り: 0 件
- `星界` の読みは `せいかい` に統一
- 明確な誤読として、`手に入った`、`力が入った`、`気合いが入った`、`重ねた`、`灯る`、`花守り` などを補正
- 追加精査で、`今日` / `日` / `君` / `特訓` / `組んだ` / `人気` / `月の光` など文脈読みの誤りを補正

## 対象ファイル

- src/services/eventService.ts
- src/services/magicRomanceEventService.ts
- src/services/magicEndingService.ts
- src/data/visualThemes.ts
- src/data/friendshipEvents.ts
- src/data/magicScenarioEvents.ts
- src/data/romanceEvents.ts
- src/data/magicRomanceDialogue.ts
- src/data/magicFriendshipRoutes.ts
- src/data/magicFriendshipEndingDialogue.ts
- src/data/endings.ts

## 修正済みの元要確認行

この表は、修正前の監査で「汎用/弱い英訳」または「ひらがな欄に漢字残り」として検出された履歴です。現在の `ひらがな表示` / `英語表示` 欄は修正後の実表示に再生成済みで、この表に残っている `issue` は当時の検出理由です。

| issue | source | field | 原文 | ひらがな表示 | 英語表示 |
|---|---:|---|---|---|---|
| 汎用/弱い英訳 | src/services/eventService.ts:734 | resultLog | 鏡の中から「あかり」の複製が現れた。 | かがみのなかから「あかり」のふくせいがあらわれた。 | A duplicate of Akari appeared from inside the mirror. |
| 汎用/弱い英訳 | src/services/eventService.ts:804 | resultLog | 禁書と契約した。(HP-10)&lt;br&gt;レリック「あかり」を入手。 | きんしょとけいやくした。(HP-10)&lt;br&gt;おたから「あかり」をにゅうしゅ。 | You made a contract with the forbidden book. Lost 10 HP.&lt;br&gt;Obtained the relic "Akari". |
| 汎用/弱い英訳 | src/services/eventService.ts:1043 | resultLog | 空気が凍って黒歴史化…呪い「後悔」を受けた。 | くうきがこごってくろれきしか…のろい「こうかい」をうけた。 | The air froze and the moment became a dark memory... You received the curse "Regret". |
| 汎用/弱い英訳 | src/services/eventService.ts:1258 | resultLog | 伝説の演目になった。観客から80Gの投げ銭！ | でんせつのえんもくになった。かんきゃくから80Gのなげせん！ | Your performance became legendary. The audience tossed you 80G in tips! |
| 汎用/弱い英訳 | src/services/eventService.ts:1261 | resultLog | 完泳して達成感MAX！&lt;br&gt;最大HPと現在HPが5増えた。 | かんえいしてたっせいかんMAX！&lt;br&gt;さいだいHPとげんざいHPが5ふえた。 | You finished the swim and felt maximum achievement!&lt;br&gt;Max HP and current HP +5. |
| 汎用/弱い英訳 | src/services/eventService.ts:1317 | resultLog | 誰にも見られていない。150Gを手に入れた。 | だれにもみられていない。150Gをてにいれた。 | No one saw you. You gained 150G. |
| 汎用/弱い英訳 | src/services/eventService.ts:1329 | resultLog | 中身は思ったより少なかった。&lt;br&gt;30Gだけ手に入った。 | なかみはおもったよりすくなかった。&lt;br&gt;30Gだけてにはいった。 | There was less inside than you expected.&lt;br&gt;You gained only 30G. |
| 汎用/弱い英訳 | src/services/eventService.ts:1451 | resultLog | 100点満点！&lt;br&gt;お祝いに100Gをもらった。 | 100てんまんてん！&lt;br&gt;おいわいに100Gをもらった。 | A perfect score!&lt;br&gt;You received 100G as a celebration. |
| 汎用/弱い英訳 | src/services/eventService.ts:2050 | resultLog | マットの隙間に60Gが挟まっていた。 | まっとのすきまに60Gがはさまっていた。 | 60G was stuck between the mats. |
| 汎用/弱い英訳 | src/services/eventService.ts:3192 | description | 夜になると動き出すという石像。背負っている薪（まき）が重そうだ。 | よるになるとうごきだすというせきぞう。せおっているたきぎ（まき）がおもそうだ。 | A stone statue said to move at night. The bundle of firewood on its back looks heavy. |
| 汎用/弱い英訳 | src/services/eventService.ts:3648 | description | ボロボロの『ジャンプ』が置いてある。続きが気になる。 | ぼろぼろの『じゃんぷ』がおいてある。つづきがきになる。 | A tattered copy of Jump is lying here. You cannot help wondering what happens next. |
| 汎用/弱い英訳 | src/services/eventService.ts:4372 | description | 夜になると増えるという伝説の階段。今、足元にあるのは13段目だ。 | よるになるとふえるというでんせつのかいだん。いま、あしもとにあるのは13だんめだ。 | A legendary staircase said to gain steps at night. Right now, the step beneath your feet is the thirteenth. |
| 汎用/弱い英訳 ひらがな欄に漢字残り | src/data/romanceEvents.ts:127 | summary | 4章ボス撃破後に表示する個別恋愛エンド。真恋愛エンド候補を兼ねる。 | 4しょうぼすげきはのちにひょうじするこべつれんあいえんど。しんれんあいえんどこうほをかねる。 | An individual romance ending shown after defeating the Chapter 4 boss. It also serves as a true romance ending candidate. |
| 汎用/弱い英訳 ひらがな欄に漢字残り | src/data/romanceEvents.ts:493 | summary | 50 サンプルのあかりとの関係を、あかりの物語として分岐させる。 | 50 さんぷるのあかりとのかんけいを、あかりのものがたりとしてぶんきさせる。 | Branches the 50-sample relationship with Akari into Akari's story route. |
| 汎用/弱い英訳 | src/data/magicFriendshipRoutes.ts:287 | endingText | もう「先輩の後ろ」ではない。湊は蓮の隣で、同じ景色を見て歩いた。 | もう「せんぱいのうしろ」ではない。みなとはれんのとなりで、おなじけしきをみてあるいた。 | Minato was no longer walking behind his senior. He walked beside Ren, seeing the same scenery. |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:26 | text | こはる「風は任せて。花が笑う方向へ、ちゃんと道を作るから。」 | こはる「かぜはまかせて。はながわらうほうこうへ、ちゃんとみちをつくるから。」 | Koharu: Leave the wind to me. I will make a proper path toward the place where the flowers can smile. |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:30 | text | セラ「では、ひよりの花の処方も星界標準に登録します。やさしさ多めで。」 | セラ「では、ひよりのはなのしょほうもせいかいひょうじゅんにとうろくします。やさしさおおめで。」 | Sera: Then I will register Hiyori's flower prescription as a celestial standard, with extra kindness. |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:33 | text | つばさ「あかり、今日の反省会は走りながらでいいよな？」 | つばさ「あかり、きょうのはんせいかいははしりながらでいいよな？」 | Tsubasa: Akari, today's review meeting can happen while we run, right? |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:58 | text | ひより「うん。こはるちゃんが風を見てくれるから、安心して咲けるよ。」 | ひより「うん。こはるちゃんがかぜをみてくれるから、あんしんしてさけるよ。」 | Hiyori: Yes. Koharu watches the wind for me, so I can bloom without worry. |
| 汎用/弱い英訳 ひらがな欄に漢字残り | src/data/magicFriendshipEndingDialogue.ts:62 | text | セラ「案内板を作ります。こはる監修なら、風向き表示つきです。」 | セラ「あんないばんをつくります。こはるかんしゅうなら、かざむきひょうじつきです。」 | Sera: I will make a guide sign. With Koharu supervising, it will include wind direction. |
| 汎用/弱い英訳 ひらがな欄に漢字残り | src/data/magicFriendshipEndingDialogue.ts:81 | text | 蓮「大和、反省会は五分だけ。机を壊さない範囲でな。」 | れん「やまと、はんせいかいはごふんだけ。つくえをこわさないはんいでな。」 | Ren: Yamato, the review meeting is five minutes only. Keep it within desk-safe limits. |
| 汎用/弱い英訳 ひらがな欄に漢字残り | src/data/magicFriendshipEndingDialogue.ts:85 | text | 蓮「今日は俺の後ろじゃなくて、横に並んで帰る日だな。」 | れん「きょうはおれのうしろじゃなくて、よこにならんでかえるひだな。」 | Ren: Today is the day you walk home beside me, not behind me. |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:98 | text | 蓮「もちろん。迷ったら風で知らせる。迷わなくても、たまに呼ぶ。」 | れん「もちろん。まよったらかぜでしらせる。まよわなくても、たまによぶ。」 | Ren: Of course. If you get lost, I will signal with the wind. Even if you do not, I will call sometimes. |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:102 | text | エリオット「湊の水は安心の味がします。処方名は、友だちの一杯で。」 | エリオット「みなとのみずはあんしんのあじがします。しょほうめいは、ともだちのいっぱいで。」 | Elliot: Minato's water tastes like reassurance. The prescription name will be A Cup from a Friend. |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:125 | text | レオン「星界の楽譜、難しいね。だけど客席が宇宙なら燃える。」 | レオン「せいかいのがくふ、むずかしいね。だけどきゃくせきがうちゅうならもえる。」 | Leon: Celestial sheet music is difficult. But if the audience is the universe, that fires me up. |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:126 | text | エリオット「初演の指揮は任せます。私は迷子の星を席へ案内します。」 | エリオット「しょえんのしきはまかせます。わたしはまいごのほしをせきへあんないします。」 | Elliot: I will leave the premiere's conducting to you. I will guide lost stars to their seats. |
| 汎用/弱い英訳 | src/data/magicFriendshipEndingDialogue.ts:141 | text | 朔夜「赦しはいらないと言ったのに、君は隣に残った。」 | さくや「ゆるしはいらないといったのに、きみはとなりにのこった。」 | Sakuya: I said I did not need forgiveness, yet you stayed by my side. |
| ひらがな欄に漢字残り | src/services/eventService.ts:317 | label | 記録を残す | きろくをのこす | Leave a record |
| ひらがな欄に漢字残り | src/services/eventService.ts:347 | result | 誰も見ていない片付けが、妙に気分を整えた。 | だれもみていないかたづけが、みょうにきぶんをととのえた。 | Cleaning up when no one was watching somehow helped settle your mood. |
| ひらがな欄に漢字残り | src/services/eventService.ts:357 | label | 帰り道を考える | かえりみちをかんがえる | Think about the way home |
| ひらがな欄に漢字残り | src/services/eventService.ts:370 | label | 靴を並べ直す | くつをならべなおす | Line up the shoes again |
| ひらがな欄に漢字残り | src/services/eventService.ts:370 | result | 落とし物の持ち主から礼を受けた。 | おとしもののもちぬしかられいをうけた。 | The owner of the lost item thanked you. |
| ひらがな欄に漢字残り | src/services/eventService.ts:380 | result | 春の景色を残すと、肩の力が抜けた。 | はるのけしきをのこすと、かたのちからがぬけた。 | Capturing the spring scenery helped the tension leave your shoulders. |
| ひらがな欄に漢字残り | src/services/eventService.ts:385 | label | 話を聞いて回る | はなしをきいてまわる | The exchange with others changed the mood and opened a way forward. |
| ひらがな欄に漢字残り | src/services/eventService.ts:385 | result | いくつもの勧誘を聞き、新しい要領を覚えた。 | いくつものかんゆうをきき、あたらしいようりょうをおぼえた。 | After hearing many club invitations, you learned a new way to handle things. |
| ひらがな欄に漢字残り | src/services/eventService.ts:416 | label | 落ち葉を集める | おちばをあつめる | Gather fallen leaves |
| ひらがな欄に漢字残り | src/services/eventService.ts:442 | result | だるさの中でも、一歩だけ進めた。 | だるさのなかでも、いっぽだけすすめた。 | Even through the sluggishness, you managed to take one step forward. |
| ひらがな欄に漢字残り | src/services/eventService.ts:465 | result | 雨音を聞いているうち、焦りが薄れた。 | あまおとをきいているうち、あせりがうすれた。 | Listening to the rain helped your thoughts settle and eased your impatience. |
| ひらがな欄に漢字残り | src/services/eventService.ts:477 | result | 別の見方に触れ、自分の視界も広がった。 | べつのみかたにふれ、じぶんのしかいもひろがった。 | Seeing another point of view widened your own perspective. |
| ひらがな欄に漢字残り | src/services/eventService.ts:497 | label | 余りを売る | あまりをうる | Sell the leftovers |
| ひらがな欄に漢字残り | src/services/eventService.ts:501 | label | 記事を読む | きじをよむ | Read the article |
| ひらがな欄に漢字残り | src/services/eventService.ts:512 | result | 落ち込む前に動くと、芯が少し太くなった。 | おちこむまえにうごくと、しんがすこしふとくなった。 | Acting before you sank into discouragement made your core a little stronger. |
| ひらがな欄に漢字残り | src/services/eventService.ts:536 | result | 焦りが予定に変わり、少し呼吸が楽になった。 | あせりがよていにかわり、すこしこきゅうがらくになった。 | The short break helped your body and mind recover. |
| ひらがな欄に漢字残り | src/services/eventService.ts:537 | result | 次に使える具体策を持ち帰った。 | つぎにつかえるぐたいさくをもちかえった。 | You brought home a concrete tactic you can use next time. |
| ひらがな欄に漢字残り | src/services/eventService.ts:542 | result | 落とし物を届けた礼が、思わぬ形で返ってきた。 | おとしものをとどけたれいが、おもわぬかたちでかえってきた。 | Thanks for returning a lost item came back in an unexpected form. |
| ひらがな欄に漢字残り | src/services/eventService.ts:546 | label | 後輩に言葉を残す | こうはいにことばをのこす | Leave words for a younger student |
| ひらがな欄に漢字残り | src/services/eventService.ts:555 | result | 眠気の向こうで、一問だけ確かな手応えを得た。 | ねむけのむこうで、いちもんだけたしかなてごたえをえた。 | The study moment clarified what you needed to understand next. |
| ひらがな欄に漢字残り | src/services/eventService.ts:557 | label | 互いに教える | たがいにおしえる | Teach each other |
| ひらがな欄に漢字残り | src/services/eventService.ts:1065 | text | 学習効率調整（カード2枚強化 / HP+8） | がくしゅうこうりつちょうせい（カード2まいきょうか / HP+8） | Study Efficiency Adjustment (Upgrade 2 cards / Heal 8 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:1132 | resultLog | 避難導線を完璧に把握した。&lt;br&gt;「あかり」が強化された。 | ひなんどうせんをかんぺきにはあくした。&lt;br&gt;「あかり」がきょうかされた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:1154 | text | 基本重視（カード削除 / HP+8） | きほんじゅうし（カードさくじょ / HP+8） | Choose Option (Remove 1 card / Heal 8 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:1244 | resultLog | 泳がず観察し、無駄を削った。&lt;br&gt;「あかり」を取り除いた。 | およがずかんさつし、むだをけずった。&lt;br&gt;「あかり」をとりのぞいた。 | Seeing the situation from a new angle gave you a useful perspective.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:1273 | text | 正攻法（レリック / 60G） | せいこうほう（おたから / 60G） | Straightforward Plan (Gain a relic / Gain 60G) |
| ひらがな欄に漢字残り | src/services/eventService.ts:1302 | resultLog | 校内を駆け回った経験が糧に。&lt;br&gt;「あかり」が強化された。 | こうないをかけまわったけいけんがかてに。&lt;br&gt;「あかり」がきょうかされた。 | The experience of running all over the school became fuel for growth.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:1347 | resultLog | 身元不明の英雄として語られた。&lt;br&gt;「あかり」を取り除いた。 | みもとふめいのえいゆうとしてかたられた。&lt;br&gt;「あかり」をとりのぞいた。 | You were spoken of as an unidentified hero.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:1378 | resultLog | 華麗に滑ってコツを掴んだ。&lt;br&gt;「あかり」が強化された。 | かれいにすべってこつをつかんだ。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:1389 | text | 堅実ルート（カード削除 / HP+10） | けんじつるーと（カードさくじょ / HP+10） | Steady Route (Remove 1 card / Heal 10 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:1404 | resultLog | 床と一緒に迷いも磨かれた。&lt;br&gt;「あかり」を取り除いた。 | とこといっしょにまよいもみがかれた。&lt;br&gt;「あかり」をとりのぞいた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:1464 | resultLog | 結果は平凡だが学びは大きい。&lt;br&gt;「あかり」が強化された。 | けっかはへいぼんだがまなびはおおきい。&lt;br&gt;「あかり」がきょうかされた。 | The result was ordinary, but the lesson was substantial.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:1604 | resultLog | 喋っているうちに悩みが一つ消えた。&lt;br&gt;「あかり」を取り除いた。 | しゃべっているうちになやみがひとつきえた。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:1656 | text | 生存優先（カード削除 / HP+6） | せいぞんゆうせん（カードさくじょ / HP+6） | Alive (Remove 1 card / Heal 6 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:1671 | resultLog | 恐怖で一つ記憶が飛んだ。&lt;br&gt;「あかり」を取り除いた。 | きょうふでひとつきおくがとんだ。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:1730 | resultLog | 知識が技に結びついた。&lt;br&gt;「あかり」が強化された。 | ちしきがわざにむすびついた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:1822 | resultLog | 看護師の助言で心の重荷が消えた。&lt;br&gt;「あかり」を取り除いた。 | かんごしのじょげんでこころのおもにがきえた。&lt;br&gt;「あかり」をとりのぞいた。 | The nurse's advice lifted the weight from your heart.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:1884 | resultLog | 荷物整理で身軽になった。&lt;br&gt;「あかり」を取り除いた。 | にもつせいりでみがるになった。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2009 | resultLog | 迷いを札に託した。&lt;br&gt;「あかり」を取り除いた。 | まよいをさつにたくした。&lt;br&gt;「あかり」をとりのぞいた。 | You entrusted your hesitation to a talisman.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2053 | text | 慎重策（カード削除 / HP+8） | しんちょうさく（カードさくじょ / HP+8） | Careful Plan (Remove 1 card / Heal 8 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2126 | text | 知性（カード2枚強化 / HP+6） | ちせい（カード2まいきょうか / HP+6） | Intellect (Upgrade 2 cards / Heal 6 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2158 | resultLog | 通行証をもらい迷いが消えた。&lt;br&gt;「あかり」を取り除いた。 | つうこうしょうをもらいまよいがきえた。&lt;br&gt;「あかり」をとりのぞいた。 | Receiving the pass cleared away your hesitation.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2191 | text | 誠実（HP全回復+削除 / 80G） | せいじつ（HPぜんかいふく+さくじょ / 80G） | Honesty (Heal to full HP and remove 1 card / Gain 80G) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2265 | resultLog | 逃走ルート最適化で荷が軽くなった。&lt;br&gt;「あかり」を取り除いた。 | とうそうるーとさいてきかでにがかるくなった。&lt;br&gt;「あかり」をとりのぞいた。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2308 | text | 善行（HP+10 / カード削除） | ぜんこう（HP+10 / カードさくじょ） | Good Deed (Heal 10 HP / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2350 | resultLog | 本番経験で技が磨かれた。&lt;br&gt;「あかり」が強化された。 | ほんばんけいけんでわざがみがかれた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:2380 | text | 造形（防御強化 / カード1枚強化） | ぞうけい（ぼうぎょきょうか / カード1まいきょうか） | Craftsmanship (Improve defense / Upgrade 1 cards) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2408 | resultLog | 発想が閃いた。&lt;br&gt;「あかり」が強化された。 | はっそうがひらめいた。&lt;br&gt;「あかり」がきょうかされた。 | A new idea flashed into your mind.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:2443 | resultLog | 講評で課題が明確に。&lt;br&gt;「あかり」を取り除いた。 | こうひょうでかだいがめいかくに。&lt;br&gt;「あかり」をとりのぞいた。 | The critique made your next task clear.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2489 | text | 意志（カード強化 / 最大HP+3） | いし（カードきょうか / さいだいHP+3） | Willpower (Upgrade 1 card / Increase max HP by 3) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2503 | resultLog | 誘惑に打ち勝った。&lt;br&gt;「あかり」が強化された。 | ゆうわくにうちかった。&lt;br&gt;「あかり」がきょうかされた。 | You overcame the temptation.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:2581 | text | 支援役（グルグルバット強化 / カード削除） | しえんやく（グルグルバットきょうか / カードさくじょ） | Support Role (Upgrade Whirl Bat / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2671 | text | 正道（カード削除 / カード1枚強化） | せいどう（カードさくじょ / カード1まいきょうか） | Right Path (Remove 1 card / Upgrade 1 cards) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2686 | resultLog | 誠実な行いで心が軽くなった。&lt;br&gt;「あかり」を取り除いた。 | せいじつなおこないでこころがかるくなった。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2737 | resultLog | 公式に認められた。&lt;br&gt;レリック「図書カード」を得た。 | こうしきにみとめられた。&lt;br&gt;おたから「としょカード」をえた。 | You were officially recognized.&lt;br&gt;Gained the relic "Library Card". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2769 | text | 整頓（カード削除 / HP+8） | せいとん（カードさくじょ / HP+8） | Tidying Up (Remove 1 card / Heal 8 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2784 | resultLog | 掲示板を綺麗にした。&lt;br&gt;「あかり」を消し去った。 | けいじばんをきれいにした。&lt;br&gt;「あかり」をけしさった。 | You cleaned up the bulletin board.&lt;br&gt;Erased "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2807 | resultLog | 采配が冴えた。&lt;br&gt;「あかり」が強化された。 | さいはいがさえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:2877 | text | 撤退（カード削除 / HP+6） | てったい（カードさくじょ / HP+6） | Retreat (Remove 1 card / Heal 6 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:2892 | resultLog | 脱兎のごとく逃げた！&lt;br&gt;「あかり」が飛んだ。 | だっとのごとくにげた！&lt;br&gt;「あかり」がとんだ。 | You fled like a startled rabbit! Lost "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:2939 | text | 静観（チャイム砂時計+後悔 / カード削除） | せいかん（チャイムすなどけい+こうかい / カードさくじょ） | Wait and Watch (Chime Hourglass and Regret / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:3024 | text | 循環（再起動カード / カード削除） | じゅんかん（さいきどうカード / カードさくじょ） | Cycle (Gain Reboot Card / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:3066 | resultLog | 運用改善に成功。&lt;br&gt;「あかり」が強化された。 | うんようかいぜんにせいこう。&lt;br&gt;「あかり」がきょうかされた。 | You succeeded in improving the operation.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:3123 | resultLog | 余計な癖が一つ消えた。&lt;br&gt;「あかり」を取り除いた。 | よけいなくせがひとつきえた。&lt;br&gt;「あかり」をとりのぞいた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:3142 | resultLog | 聞き込みで洞察が冴えた。&lt;br&gt;「あかり」が強化された。 | ききこみでどうさつがさえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:3298 | text | 対策（カード強化 / 70G） | たいさく（カードきょうか / 70G） | Countermeasure (Upgrade 1 card / Gain 70G) |
| ひらがな欄に漢字残り | src/services/eventService.ts:3312 | resultLog | 観察眼が鋭くなった。&lt;br&gt;「あかり」が強化された。 | かんさつめがするどくなった。&lt;br&gt;「あかり」がきょうかされた。 | Your eye for observation grew sharper.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:3337 | resultLog | 面倒を一つ手放した。&lt;br&gt;「あかり」を取り除いた。 | めんどうをひとつてばなした。&lt;br&gt;「あかり」をとりのぞいた。 | You let go of one troublesome burden.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:3370 | text | 回想（カード強化+HP+5 / 最大HP+3） | かいそう（カードきょうか+HP+5 / さいだいHP+3） | times (Upgrade card(s). and 5 / Increase max HP by 3) |
| ひらがな欄に漢字残り | src/services/eventService.ts:3385 | resultLog | 昔の言葉に背中を押された。&lt;br&gt;HPが5回復し「あかり」が強化された。 | むかしのことばにせなかをおされた。&lt;br&gt;HPが5かいふくし「あかり」がきょうかされた。 | Old words gave you a push forward.&lt;br&gt;Healed 5 HP, and "Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:3428 | resultLog | 過去を断ち切った。&lt;br&gt;「あかり」を取り除いた。 | かこをたちきった。&lt;br&gt;「あかり」をとりのぞいた。 | You cut yourself free from the past.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:3494 | text | 交流（HP+10+後悔 / 恒久ムキムキ+1） | こうりゅう（HP+10+こうかい / こうきゅうむきむき+1） | Interaction (HP +10+Regret / permanentStrength and 1) |
| ひらがな欄に漢字残り | src/services/eventService.ts:3526 | resultLog | 飼育理論が応用できた。&lt;br&gt;「あかり」が強化された。 | しいくりろんがおうようできた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:3617 | resultLog | 機転が効いた。&lt;br&gt;「あかり」が強化された。 | きてんがきいた。&lt;br&gt;「あかり」がきょうかされた。 | Your quick thinking paid off.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:3673 | resultLog | 名台詞が刺さった。&lt;br&gt;「あかり」が強化された。 | めいぜりふがささった。&lt;br&gt;「あかり」がきょうかされた。 | A famous line struck home.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:3782 | resultLog | 実験成功！&lt;br&gt;「あかり」が強化された。 | じっけんせいこう！&lt;br&gt;「あかり」がきょうかされた。 | The experiment succeeded!&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:3860 | text | 分析（カード2枚強化 / カード削除） | ぶんせき（カード2まいきょうか / カードさくじょ） | Analysis (Upgrade 2 cards / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:3883 | resultLog | 雑念が一つ消えた。&lt;br&gt;「あかり」を取り除いた。 | ざつねんがひとつきえた。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:3937 | text | 探索（マトリョーシカ+悩み / カード削除） | たんさく（マトリョーシカ+なやみ / カードさくじょ） | Search (Matryoshka and Worry / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:4014 | text | 節水（HP+10 / カード削除） | せっすい（HP+10 / カードさくじょ） | Water Saving (Heal 10 HP / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:4032 | resultLog | 心の濁りも流れた。&lt;br&gt;「あかり」を取り除いた。 | こころのにごりもながれた。&lt;br&gt;「あかり」をとりのぞいた。 | The cloudiness in your heart washed away too.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4119 | resultLog | 切れ味最高！&lt;br&gt;「あかり」をコピーした。 | きれあじさいこう！&lt;br&gt;「あかり」をこぴーした。 | The sharpness was perfect! Copied "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4129 | text | 料理（HP+15 / カード1枚強化） | りょうり（HP+15 / カード1まいきょうか） | Cooking (Heal 15 HP / Upgrade 1 cards) |
| ひらがな欄に漢字残り | src/services/eventService.ts:4146 | resultLog | 包丁さばきが冴えた。&lt;br&gt;「あかり」が強化された。 | ほうちょうさばきがさえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:4174 | resultLog | 余計な一手を捨てた。&lt;br&gt;「あかり」を取り除いた。 | よけいないってをすてた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4220 | resultLog | 人の振り見て我が振り直せ。&lt;br&gt;「あかり」が強化された。 | にんのふりみてわがふりなおせ。&lt;br&gt;「あかり」がきょうかされた。 | Seeing another's behavior taught you to correct your own.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:4327 | resultLog | 価値観が整理された。&lt;br&gt;「あかり」を取り除いた。 | かちかんがせいりされた。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4390 | resultLog | 別世界に吸い込まれた！&lt;br&gt;HP-10、「あかり」を置いてきた。 | べっせかいにすいこまれた！&lt;br&gt;HP-10、「あかり」をおいてきた。 | You were pulled into another world!&lt;br&gt;Lost 10 HP and left "Akari" behind. |
| ひらがな欄に漢字残り | src/services/eventService.ts:4477 | resultLog | 一節が刺さった。&lt;br&gt;「あかり」が強化された。 | いっせつがささった。&lt;br&gt;「あかり」がきょうかされた。 | One passage struck home.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:4482 | text | 礼儀（HP+5 / カード削除） | れいぎ（HP+5 / カードさくじょ） | Courtesy (Heal 5 HP / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:4500 | resultLog | 静かな決断。&lt;br&gt;「あかり」を取り除いた。 | しずかなけつだん。&lt;br&gt;「あかり」をとりのぞいた。 | You made a quiet decision.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4563 | text | 反響（恒久ムキムキ+1 / カード強化） | はんきょう（こうきゅうむきむき+1 / カードきょうか） | Echo (permanentStrength and 1 / Upgrade 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:4580 | resultLog | 反響で集中力が高まった。&lt;br&gt;「あかり」が強化された。 | はんきょうでしゅうちゅうりょくがたかまった。&lt;br&gt;「あかり」がきょうかされた。 | The echo sharpened your concentration.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:4602 | resultLog | 配管と一緒に心も整った。&lt;br&gt;「あかり」を取り除いた。 | はいかんといっしょにこころもととのった。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4634 | text | 癒やし（全回復+寄生虫 / HP+8） | いやし（ぜんかいふく+きせいちゅう / HP+8） | Healing (Heal to full HP and receive Parasite / Heal 8 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:4762 | resultLog | きれいに片づけた。&lt;br&gt;「あかり」を捨てた。 | きれいにかたづけた。&lt;br&gt;「あかり」をすてた。 | You cleaned it up neatly.&lt;br&gt;Discarded "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4824 | text | 傾聴（HP+10+退屈 / カード強化） | けいちょう（HP+10+たいくつ / カードきょうか） | Active Listening (Receive Boredom / Upgrade 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:4847 | resultLog | 耳が鍛えられた。&lt;br&gt;「あかり」が強化された。 | みみがきたえられた。&lt;br&gt;「あかり」がきょうかされた。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:4869 | resultLog | ノイズを断ち切った。&lt;br&gt;「あかり」を取り除いた。 | のいずをたちきった。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4915 | resultLog | まる写しで効率アップ。&lt;br&gt;「あかり」強化、呪い「恥」を受けた。 | まるうつしでこうりつあっぷ。&lt;br&gt;「あかり」きょうか、のろい「はじ」をうけた。 | Copying it outright improved efficiency.&lt;br&gt;"Akari" was upgraded, and you received the curse "Embarrassment". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4952 | resultLog | 古い執着を捨てた。&lt;br&gt;「あかり」を取り除いた。 | ふるいしゅうちゃくをすてた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4981 | resultLog | 教育祭で評価された。&lt;br&gt;レリック「図書カード」を得た。 | きょういくまつりでひょうかされた。&lt;br&gt;おたから「としょカード」をえた。 | Your work was recognized at the education festival.&lt;br&gt;Gained the relic "Library Card". |
| ひらがな欄に漢字残り | src/services/eventService.ts:4996 | text | 休息（全回復+次戦闘E-1 / HP+12） | きゅうそく（ぜんかいふく+じせんとうE-1 / HP+12） | Rest (Heal to full HP and start the next battle with -1 Energy / Heal 12 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:5036 | resultLog | 几帳面さが戻った。&lt;br&gt;「あかり」を取り除いた。 | きちょうめんさがもどった。&lt;br&gt;「あかり」をとりのぞいた。 | Your careful habits returned.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:5109 | text | 協調（カード削除 / カード強化） | きょうちょう（カードさくじょ / カードきょうか） | Cooperation (Remove 1 card / Upgrade 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:5138 | resultLog | 連携が良くなった。&lt;br&gt;「あかり」が強化された。 | れんけいがよくなった。&lt;br&gt;「あかり」がきょうかされた。 | Your coordination improved.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:5225 | resultLog | 職人技を覚えた。&lt;br&gt;「あかり」が強化された。 | しょくにんわざをおぼえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:5274 | resultLog | 体が毒に慣れた！&lt;br&gt;HP-10、「あかり」強化。 | からだがどくになれた！&lt;br&gt;HP-10、「あかり」きょうか。 | Your body adapted to the poison!&lt;br&gt;Lost 10 HP, and "Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:5284 | text | 平和（50G+HP10 / カード削除） | へいわ（50G+HP10 / カードさくじょ） | Peaceful Approach (Gain 50G and heal 10 HP / Remove 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:5307 | resultLog | 危険を断って思考が澄んだ。&lt;br&gt;「あかり」を取り除いた。 | きけんをたってしこうがすんだ。&lt;br&gt;「あかり」をとりのぞいた。 | Refusing the danger cleared your thoughts.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:5388 | resultLog | 逃走ルート最適化。&lt;br&gt;「あかり」を取り除いた。 | とうそうるーとさいてきか。&lt;br&gt;「あかり」をとりのぞいた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:5398 | text | 交渉（カード2枚強化 / HP-6） | こうしょう（カード2まいきょうか / HP-6） | Negotiation (Upgrade 2 cards / Lose 6 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:5453 | resultLog | 作戦会議がはかどった。&lt;br&gt;「あかり」が強化された。 | さくせんかいぎがはかどった。&lt;br&gt;「あかり」がきょうかされた。 | Turning the situation into a plan made the next step easier to take.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:5486 | resultLog | 不要品を処分した。&lt;br&gt;「あかり」を取り除いた。 | ふようひんをしょぶんした。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:5544 | resultLog | 追跡で集中力が上がった。&lt;br&gt;「あかり」が強化された。 | ついせきでしゅうちゅうりょくがあがった。&lt;br&gt;「あかり」がきょうかされた。 | The chase sharpened your focus.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:5616 | resultLog | 主との激闘に勝利した。&lt;br&gt;HP-10、「あかり」が強化された。 | しゅとのげきとうにしょうりした。&lt;br&gt;HP-10、「あかり」がきょうかされた。 | You won the fierce battle against the master.&lt;br&gt;Lost 10 HP, and "Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:5626 | text | 交渉（ポーション / HP+10） | こうしょう（ポーション / HP+10） | Negotiation (Gain a potion / Heal 10 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:5654 | resultLog | 誠意が伝わった。&lt;br&gt;「あかり」を取り除いた。 | せいいがつたわった。&lt;br&gt;「あかり」をとりのぞいた。 | Your careful choice helped someone and improved the situation.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:5701 | resultLog | 売買成立。&lt;br&gt;50G獲得し、「あかり」を処分した。 | ばいばいせいりつ。&lt;br&gt;50Gかくとくし、「あかり」をしょぶんした。 | The deal went through.&lt;br&gt;Gained 50G and removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:5730 | text | 鎮圧（HP+12 / カード強化） | ちんあつ（HP+12 / カードきょうか） | Suppression (Heal 12 HP / Upgrade 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:5800 | resultLog | 危機対応が洗練された。&lt;br&gt;「あかり」が強化された。 | ききたいおうがせんれんされた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:5808 | text | 退避（HP+10 / 90G） | たいひ（HP+10 / 90G） | Evacuation (Heal 10 HP / Gain 90G) |
| ひらがな欄に漢字残り | src/services/eventService.ts:5886 | resultLog | フォーム改善で技が冴えた。&lt;br&gt;「あかり」が強化された。 | ふぉーむかいぜんでわざがさえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:5919 | resultLog | 無駄を省いた。&lt;br&gt;「あかり」を取り除いた。 | むだをはぶいた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:5970 | text | 癒やし系（HP+20 / カード強化） | いやしけい（HP+20 / カードきょうか） | Healing Approach (Heal 20 HP / Upgrade 1 card) |
| ひらがな欄に漢字残り | src/services/eventService.ts:6057 | resultLog | 勇気を出して取り返した。&lt;br&gt;HP-5、「あかり」が強化された。 | ゆうきをだしてとりかえした。&lt;br&gt;HP-5、「あかり」がきょうかされた。 | You found the courage to take it back.&lt;br&gt;Lost 5 HP, and "Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:6067 | text | 撤退（呪い「不安」 / HP+10） | てったい（のろい「ふあん」 / HP+10） | Retreat (Receive the curse "Anxiety" / Heal 10 HP) |
| ひらがな欄に漢字残り | src/services/eventService.ts:6097 | resultLog | 正式な手続きで解決。&lt;br&gt;「あかり」を取り除いた。 | せいしきなてつづきでかいけつ。&lt;br&gt;「あかり」をとりのぞいた。 | You solved it through the proper procedure.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:6161 | resultLog | 土いじりで集中した。&lt;br&gt;「あかり」が強化された。 | つちいじりでしゅうちゅうした。&lt;br&gt;「あかり」がきょうかされた。 | Working with the soil helped you focus.&lt;br&gt;"Akari" was upgraded. |
| ひらがな欄に漢字残り | src/services/eventService.ts:6183 | text | 研究（カード削除 / 恒久ムキムキ+1） | けんきゅう（カードさくじょ / こうきゅうむきむき+1） | Research (Remove 1 card / permanentStrength and 1) |
| ひらがな欄に漢字残り | src/services/eventService.ts:6198 | resultLog | 無駄を取り除けた。&lt;br&gt;「あかり」を取り除いた。 | むだをとりのぞけた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| ひらがな欄に漢字残り | src/services/eventService.ts:6229 | text | 試作（カード変化 / カード強化） | しさく（カードへんか / カードきょうか） | Prototype (Transform 1 card / Upgrade 1 card) |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:272 | text | 好感度+50 | こうかんど+50 | Affection +50 |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:307 | resultLog | あかり 好感度+50&lt;br&gt;サンプル&lt;br&gt;50 | あかり こうかんど+50&lt;br&gt;さんぷる&lt;br&gt;50 | Akari Affection +50&lt;br&gt;Sample&lt;br&gt;50 |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:322 | label | 一緒に帰る | いっしょにかえる | Go Home Together |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:323 | label | 次の任務を相談する | つぎのにんむをそうだんする | Discuss the Next Mission |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:324 | label | 勉強の続きをする | べんきょうのつづきをする | Continue Studying |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:328 | title | あかり・約束の続き | あかり・やくそくのつづき | Akari: Continuing the Promise |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:329 | description | サンプル&lt;br&gt;&lt;br&gt;五つの大切な時間を重ねた二人には、もう言葉に迷う距離はなかった。 | さんぷる&lt;br&gt;&lt;br&gt;いつつのたいせつなじかんをかさねたふたりには、もうことばにまようきょりはなかった。 | Sample&lt;br&gt;&lt;br&gt;After sharing five important moments, the two no longer stood at a distance where words could falter. |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:334 | text | 5段階完了 / サンプル | 5だんかいかんりょう / さんぷる | 5 / |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:347 | resultLog | あかりとの五つの物語を越え、穏やかな時間を過ごした。&lt;br&gt;好感度は変化しない。&lt;br&gt;50 | あかりとのいつつのものがたりをこえ、おだやかなじかんをすごした。&lt;br&gt;こうかんどはへんかしない。&lt;br&gt;50 | After passing through five stories with Akari, you spent a peaceful time together.&lt;br&gt;Affection does not change.&lt;br&gt;You handled the moment and carried its outcome into what came next. |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:360 | text | 絆+18 / 最大HP+4 | きずな+18 / さいだいHP+4 | Bond +18 / Max HP +4 |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:361 | label | 連携を練習する | れんけいをれんしゅうする | Practice Coordination |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:361 | text | 絆+15 / カードを1枚強化 | きずな+15 / カードを1まいきょうか | Bond +15 / Upgrade 1 card |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:362 | label | 一緒に休む | いっしょにやすむ | Rest Together |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:362 | text | 絆+12 / HPを14回復 | きずな+12 / HPを14かいふく | Bond +12 / Heal 14 HP |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:367 | description | サンプル&lt;br&gt;&lt;br&gt;あかりとの絆が、恋とは違う強さで胸に灯る。 | さんぷる&lt;br&gt;&lt;br&gt;あかりとのきずなが、こいとはちがうつよさでむねにともる。 | Sample&lt;br&gt;&lt;br&gt;Your bond with Akari glows in your heart with a strength different from romance. |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:405 | resultLog | あかり 絆+50&lt;br&gt;サンプル&lt;br&gt;50 | あかり きずな+50&lt;br&gt;さんぷる&lt;br&gt;50 | Akari Bond +50&lt;br&gt;Sample&lt;br&gt;50 |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:418 | label | 親友の証を結ぶ | しんゆうのしょうをむすぶ | Seal the Proof of Best Friends |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:419 | label | 相棒技を磨く | あいぼうわざをみがく | Practice Partner Techniques |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:420 | label | 次の任務を約束する | つぎのにんむをやくそくする | Promise the Next Mission |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:425 | description | サンプル&lt;br&gt;&lt;br&gt;これは恋愛ではなく、何周しても選び直したくなる友情の終着点だ。 | さんぷる&lt;br&gt;&lt;br&gt;これはれんあいではなく、なんしゅうしてもえらびなおしたくなるゆうじょうのしゅうちゃくてんだ。 | Sample&lt;br&gt;&lt;br&gt;This is not romance, but the destination of a friendship you would choose again no matter how many loops you lived. |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:429 | text | 友情ルート完了 / サンプル | ゆうじょうるーとかんりょう / さんぷる | Friendship route complete / Sample |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:442 | resultLog | あかりとの友情ルートを確認した。&lt;br&gt;50 | あかりとのゆうじょうるーとをかくにんした。&lt;br&gt;50 | You confirmed Akari's friendship route.&lt;br&gt;You handled the moment and carried its outcome into what came next. |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:460 | label | 一緒に復習する | いっしょにふくしゅうする | Review Together |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:461 | label | 魔力を整える | まりょくをととのえる | Steady Your Magic Power |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:462 | label | 購買へ寄る | こうばいへよる | Stop by the School Store |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:467 | description | サンプル&lt;br&gt;&lt;br&gt;二人の関係は確かに進んでいる。けれど、次の出来事が動き出すのは第50章からだ。今日は焦らず、いつもの学園生活を一緒に過ごすことにした。 | さんぷる&lt;br&gt;&lt;br&gt;ふたりのかんけいはたしかにすすんでいる。けれど、つぎのできごとがうごきだすのはだい50しょうからだ。きょうはあせらず、いつものがくえんせいかつをいっしょにすごすことにした。 | Sample&lt;br&gt;&lt;br&gt;The relationship between the two has certainly moved forward. But the next event begins from Chapter 50, so today you decide not to rush and spend an ordinary academy day together. |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:472 | text | 段階維持 / サンプル | だんかいいじ / さんぷる | Stage held / Sample |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:485 | resultLog | あかりと穏やかな放課後を過ごした。&lt;br&gt;次の恋愛イベントは第50章で解放される。&lt;br&gt;50 | あかりとおだやかなほうかごをすごした。&lt;br&gt;つぎのれんあいいべんとはだい50しょうでかいほうされる。&lt;br&gt;50 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You handled the moment and carried its outcome into what came next.&lt;br&gt;You handled the moment and carried its outcome into what came next. |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:510 | title | 放課後、誰と過ごす？ | ほうかご、だれとすごす？ | After School, Who Will You Spend Time With? |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:511 | description | 授業と魔法訓練の合間に、少しだけ自由な時間ができた。&lt;br&gt;恋の相手、あるいは親友として絆を深める相手を選ぼう。以前選んだ相手は、次から候補に現れやすくなる。 | じゅぎょうとまほうくんれんのあいまに、すこしだけじゆうなじかんができた。&lt;br&gt;こいのあいて、あるいはしんゆうとしてきずなをふかめるあいてをえらぼう。いぜんえらんだあいては、つぎからこうほにあらわれやすくなる。 | Between classes and magic training, you found a little free time.&lt;br&gt;Choose someone to grow closer to as a romantic interest or a best friend. Someone you chose before will be more likely to appear as a candidate next time. |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:570 | label | あかり（友情） | あかり（ゆうじょう） | Akari (Friendship) |
| ひらがな欄に漢字残り | src/services/magicRomanceEventService.ts:571 | text | 絆 50/100 / 友情エンド解放済み | きずな 50/100 / ゆうじょうえんどかいほうすみ | Bond 50/100 / Friendship ending unlocked |
| ひらがな欄に漢字残り | src/services/magicEndingService.ts:160 | description | 決戦後、あかりを呼び止めた二人は、互いの想いが同じ強さだと知る。好意を曖昧にしないため、二人は正面から答えを求めた。 | けっせんのち、あかりをよびとめたふたりは、たがいのおもいがおなじつよさだとしる。こういをあいまいにしないため、ふたりはしょうめんからこたえをもとめた。 | The experience strengthened your resolve and helped you grow. |
| ひらがな欄に漢字残り | src/data/visualThemes.ts:51 | description | 【光の魔法の魔法】光の魔法。得意分野は光の魔法。固有能力「光の魔法」を軸に戦う光の魔法。 | 【ひかりのまほうのまほう】ひかりのまほう。とくいぶんやはひかりのまほう。こゆうのうりょく「ひかりのまほう」をじくにたたかうひかりのまほう。 | You handled the moment and carried its outcome into what came next. |
| ひらがな欄に漢字残り | src/data/visualThemes.ts:459 | title | 深夜の自習室 | しんやのじしゅうしつ | Midnight Study Room |
| ひらがな欄に漢字残り | src/data/visualThemes.ts:460 | description | 誰もいない自習室に、まだ消えていないスタンドライトが一つだけ残っている。 | だれもいないじしゅうしつに、まだきえていないすたんどらいとがひとつだけのこっている。 | In the empty study room, a single desk lamp is still lit. |
| ひらがな欄に漢字残り | src/data/visualThemes.ts:464 | title | 屋上の夕焼け | おくじょうのゆうやけ | Sunset on the Rooftop |
| ひらがな欄に漢字残り | src/data/visualThemes.ts:465 | description | 夕焼けの屋上に風だけが通る。少し立ち止まるにはちょうどいい。 | ゆうやけのおくじょうにかぜだけがとおる。すこしたちとまるにはちょうどいい。 | Only the wind passes across the sunset rooftop. It is just right for stopping a moment. |
| ひらがな欄に漢字残り | src/data/visualThemes.ts:469 | title | 模試の返却 | もしのへんきゃく | Mock Exam Returns |
| ひらがな欄に漢字残り | src/data/visualThemes.ts:470 | description | 赤い丸が並ぶ答案が返ってきた。次の一手を考える時間だ。 | あかいまるがならぶとうあんがかえってきた。つぎのいってをかんがえるじかんだ。 | An answer sheet lined with red circles has been returned. It is time to think about your next move. |
| ひらがな欄に漢字残り | src/data/visualThemes.ts:474 | title | 文化祭の準備 | ぶんかさいのじゅんび | Festival Preparations |

※ 要確認行は先頭200件のみ表示。全件数: 1062

## イベント一覧（編・カテゴリ別）

通常のイベント一覧は、編ごと、カテゴリごと、必要に応じてイベント単位に並べ替えています。各行の `ひらがな表示` / `英語表示` は現在の `transEventText` 実変換結果です。

- 一覧行数: 2966
- 表示列: source / field / 原文 / ひらがな表示 / 英語表示

## メインモード

### 共通イベント補助（8行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:210 | title | 忘れ物 | わすれもの | Lost Item |
| src/services/eventService.ts:211 | description | 校庭の隅に、誰かが落としたと思われるカード「あかり」が落ちている。&lt;br&gt;これは以前ここを冒険した生徒の持ち物かもしれない...。 | こうていのすみに、だれかがおとしたとおもわれるカード「あかり」がおちている。&lt;br&gt;これはいぜんここをぼうけんしたせいとのもちものかもしれない...。 | In the corner of the schoolyard, you find a card that someone seems to have dropped: "Akari".&lt;br&gt;It may have belonged to a student who adventured here before. |
| src/services/eventService.ts:214 | label | ひろう | ひろう | Pick Up |
| src/services/eventService.ts:215 | text | カードをデッキに加える | カードをでっきにくわえる | Add the card to your deck |
| src/services/eventService.ts:221 | resultLog | 「あかり」を拾い、大切にランドセルにしまった。 | 「あかり」をひろい、たいせつにらんどせるにしまった。 | You picked up "Akari" and carefully tucked it into your school bag. |
| src/services/eventService.ts:225 | label | そのままにする | そのままにする | Leave It Alone |
| src/services/eventService.ts:226 | text | ひろわずに進む | ひろわずにすすむ | Continue without picking it up |
| src/services/eventService.ts:228 | resultLog | 自分には必要ないと判断し、そのまま通り過ぎた。またいつか誰かが拾うだろう。 | じぶんにはひつようないとはんだんし、そのままとおりすぎた。またいつかだれかがひろうだろう。 | You decided you did not need it and walked past. Someone else may pick it up someday. |

### 高校編テーマ選択肢（494行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:275 | resultLog | サンプルサンプル | サンプルサンプル | Sample result |
| src/services/eventService.ts:290 | label | 残って勉強する | のこってべんきょうする | Stay and Study |
| src/services/eventService.ts:290 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:290 | result | 静かな机で復習が進んだ。 | しずかなつくえでふくしゅうがすすんだ。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:291 | label | 少し仮眠する | すこしかみんする | Take a Short Nap |
| src/services/eventService.ts:291 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:291 | result | 短い仮眠で頭が冴えた。 | みじかいかみんであたまがさえた。 | A short nap cleared your head. |
| src/services/eventService.ts:292 | label | 机を片付ける | つくえをかたづける | Tidy the Desk |
| src/services/eventService.ts:292 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:292 | result | 机まわりを整えると、次の一手も見えやすくなった。 | つくえまわりをととのえると、つぎのいってもみえやすくなった。 | After organizing your desk, the next move became easier to see. |
| src/services/eventService.ts:295 | label | 深呼吸する | しんこきゅうする | Take a Deep Breath |
| src/services/eventService.ts:295 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:295 | result | 冷たい風で腹が据わった。 | つめたいかぜではらがすわった。 | The experience strengthened your resolve and helped you grow. |
| src/services/eventService.ts:296 | label | 夕景をメモする | ゆうけいをめもする | Write Down the Sunset |
| src/services/eventService.ts:296 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:296 | result | 考えが整理され、ノートの要点がつながった。 | かんがえがせいりされ、のーとのようてんがつながった。 | Your thoughts settled, and the key points in your notes connected. |
| src/services/eventService.ts:297 | label | すぐ戻る | すぐもどる | Head Back Right Away |
| src/services/eventService.ts:297 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:297 | result | 忘れていた小遣い袋を鞄で見つけた。 | わすれていたこづかいふくろをかばんでみつけた。 | You found a forgotten allowance pouch in your bag. |
| src/services/eventService.ts:300 | label | 答案を見直す | とうあんをみなおす | Review the Answer Sheet |
| src/services/eventService.ts:300 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:300 | result | 間違いの癖を一つ潰した。 | まちがいのくせをひとつつぶした。 | You corrected one habit behind your mistakes. |
| src/services/eventService.ts:301 | label | 苦手だけ復習する | にがてだけふくしゅうする | Review Only Weak Areas |
| src/services/eventService.ts:301 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:301 | result | 弱点を直視したぶん、次の勝負に強くなった。 | じゃくてんをちょくししたぶん、つぎのしょうぶにつよくなった。 | The experience strengthened your resolve and helped you grow. |
| src/services/eventService.ts:302 | label | いったんしまう | いったんしまう | Put It Away for Now |
| src/services/eventService.ts:302 | text | HPを8回復する | HPを8かいふくする | Heal 8 HP |
| src/services/eventService.ts:302 | result | 気持ちを切り替え、肩の力が抜けた。 | きもちをきりかえ、かたのちからがぬけた。 | You reset your mood, and the tension left your shoulders. |
| src/services/eventService.ts:305 | label | 飾り付けを進める | かざりつけをすすめる | Keep Decorating |
| src/services/eventService.ts:305 | text | 35Gを得る | 35Gをえる | Gain 35G |
| src/services/eventService.ts:305 | result | 段取りの良さを買われ、謝礼を受け取った。 | だんどりのよさをかわれ、しゃれいをうけとった。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:306 | label | 会計を手伝う | かいけいをてつだう | Help with Accounting |
| src/services/eventService.ts:306 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:306 | result | 数字を追ううちに、手札の扱いも洗練された。 | すうじをおううちに、てふだのあつかいもせんれんされた。 | As you followed the numbers, your handling of cards became sharper. |
| src/services/eventService.ts:307 | label | 休憩を入れる | きゅうけいをいれる | Take a Break |
| src/services/eventService.ts:307 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:307 | result | 教室の隅で一息ついた。 | きょうしつのすみでひといきついた。 | You took a quiet breather in the corner of the classroom. |
| src/services/eventService.ts:310 | label | ポスターを読む | ぽすたーをよむ | Read the Posters |
| src/services/eventService.ts:310 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:310 | result | 掲示を見比べるうちに、今の自分に必要なことが見えた。 | けいじをみくらべるうちに、いまのじぶんにひつようなことがみえた。 | Comparing the notices showed you what you need right now. |
| src/services/eventService.ts:311 | label | 体験入部の紙を取る | たいけんにゅうぶのかみをとる | Take a Club Trial Form |
| src/services/eventService.ts:311 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:311 | result | 新しい活動の要領を覚えた。 | あたらしいかつどうのようりょうをおぼえた。 | You learned the basics of a new activity. |
| src/services/eventService.ts:312 | label | 廊下を抜ける | ろうかをぬける | Pass Through the Hallway |
| src/services/eventService.ts:312 | text | 20Gを得る | 20Gをえる | Gain 20G |
| src/services/eventService.ts:312 | result | 落ちていた購買券を拾って届け、謝礼をもらった。 | おちていたこうばいけんをひろってとどけ、しゃれいをもらった。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:315 | label | 換気する | かんきする | Air Out the Room |
| src/services/eventService.ts:315 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:315 | result | 空気が入れ替わり、むせ返る匂いが消えた。 | くうきがいれかわり、むせかえるにおいがきえた。 | Fresh air flowed in, and the choking smell disappeared. |
| src/services/eventService.ts:316 | label | 残った試料を調べる | のこったしりょうをしらべる | Examine the Remaining Sample |
| src/services/eventService.ts:316 | text | ポーションを得る | ポーションをえる | Gain a potion |
| src/services/eventService.ts:316 | result | 安全な分だけ小瓶に分けた。 | あんぜんなぶんだけこびんにわけた。 | You separated a safe amount into a small bottle. |
| src/services/eventService.ts:317 | label | 記録を残す | きろくをのこす | Leave a record |
| src/services/eventService.ts:317 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:317 | result | 事故の経過を整理し、使える知見に変えた。 | じこのけいかをせいりし、つかえるちけんにかえた。 | You organized the accident record and turned it into useful knowledge. |
| src/services/eventService.ts:320 | label | 軽食を買う | けいしょくをかう | Buy a snack |
| src/services/eventService.ts:320 | text | HPを14回復する | HPを14かいふくする | Heal 14 HP |
| src/services/eventService.ts:320 | result | 温かい軽食で空腹が落ち着いた。 | あたたかいけいしょくでくうふくがおちついた。 | A warm snack settled your hunger. |
| src/services/eventService.ts:321 | label | 栄養ドリンクを選ぶ | えいようどりんくをえらぶ | Choose an energy drink |
| src/services/eventService.ts:321 | text | ポーションを得る | ポーションをえる | Gain a potion |
| src/services/eventService.ts:321 | result | 棚から集中用の一本を選んだ。 | たなからしゅうちゅうようのいっぽんをえらんだ。 | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:322 | label | ポイントを使う | ぽいんとをつかう | Use your points |
| src/services/eventService.ts:322 | text | 30Gを得る | 30Gをえる | Gain 30G |
| src/services/eventService.ts:322 | result | 貯まっていたポイントを換金した。 | たまっていたぽいんとをかんきんした。 | You cashed in the points you had saved. |
| src/services/eventService.ts:325 | label | 資料を分類する | しりょうをぶんるいする | Sort the documents |
| src/services/eventService.ts:325 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:325 | result | 山積みの資料を整理し、判断も速くなった。 | やまづみのしりょうをせいりし、はんだんもはやくなった。 | Tidying things up also helped clear your mind for the next step. |
| src/services/eventService.ts:326 | label | 予算案を読む | よさんあんをよむ | Read the budget proposal |
| src/services/eventService.ts:326 | text | 40Gを得る | 40Gをえる | Gain 40G |
| src/services/eventService.ts:326 | result | 無駄を一つ見つけ、協力費を受け取った。 | むだをひとつみつけ、きょうりょくひをうけとった。 | You found a small reward and put the extra money to use. |
| src/services/eventService.ts:327 | label | 会議の空気を整える | かいぎのくうきをととのえる | Settle the meeting room |
| src/services/eventService.ts:327 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:327 | result | 面倒な場をさばいて、少し肝が据わった。 | めんどうなばをさばいて、すこしきもがすわった。 | Managing the difficult meeting made you a little steadier. |
| src/services/eventService.ts:330 | label | 雨宿りする | あまやどりする | Take shelter from the rain |
| src/services/eventService.ts:330 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:330 | result | 雨脚が弱まるまで休んだ。 | あまあしがよわまるまでやすんだ。 | You rested until the rain eased. |
| src/services/eventService.ts:331 | label | 雨音を聞く | あまおとをきく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:331 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:331 | result | 単調な雨音で思考が整った。 | たんちょうなあまおとでしこうがととのった。 | Listening to the rain helped your thoughts settle and eased your impatience. |
| src/services/eventService.ts:332 | label | 傘立てを整える | かさたててをととのえる | Organize the umbrella stand |
| src/services/eventService.ts:332 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:332 | result | 落とし主から礼を受け取った。 | おとししゅかられいをうけとった。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:335 | label | ノートを整える | のーとをととのえる | Organize your notes |
| src/services/eventService.ts:335 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:335 | result | 机に向かうと、今日の学びが一本につながった。 | つくえにむかうと、きょうのまなびがいっぽんにつながった。 | At your desk, the day's lessons came together. |
| src/services/eventService.ts:336 | label | 窓を開ける | まどをひらける | Open the window |
| src/services/eventService.ts:336 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:336 | result | 夕方の風で、教室の空気が入れ替わった。 | ゆうがたのかぜで、きょうしつのくうきがいれかわった。 | The quiet atmosphere helped you calm down and clear your head. |
| src/services/eventService.ts:337 | label | 明日の準備をする | あしたのじゅんびをする | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:337 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:337 | result | 先に段取りを済ませると、気持ちに余白ができた。 | さきにだんどりをすませると、きもちによはくができた。 | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:340 | label | 譜面を整える | ふめんをととのえる | Organize the sheet music |
| src/services/eventService.ts:340 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:340 | result | ばらけた譜面を並べると、手順の癖も見えた。 | ばらけたふめんをならべると、てじゅんのくせもみえた。 | As you arranged the scattered sheet music, you also noticed the habits in your procedure. |
| src/services/eventService.ts:341 | label | 一曲だけ弾く | いっきょくだけひく | Play one song |
| src/services/eventService.ts:341 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:341 | result | 指が温まり、気持ちも前へ出た。 | ゆびがあたたまり、きもちもまえへでた。 | Your fingers warmed up, and your confidence moved forward too. |
| src/services/eventService.ts:342 | label | 静けさを味わう | しずけさをあじわう | Enjoy the quiet |
| src/services/eventService.ts:342 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:342 | result | 余韻の中で疲れがほどけた。 | よいんのなかでつかれがほどけた。 | The lingering music eased your fatigue. |
| src/services/eventService.ts:345 | label | 忘れ物を届ける | わすれものをとどける | Deliver the lost item |
| src/services/eventService.ts:345 | text | 35Gを得る | 35Gをえる | Gain 35G |
| src/services/eventService.ts:345 | result | 持ち主に届け、礼を受け取った。 | もちぬしにとどけ、れいをうけとった。 | You delivered it to its owner and received thanks. |
| src/services/eventService.ts:346 | label | 軽くストレッチする | かるくすとれっちする | Do a light stretch |
| src/services/eventService.ts:346 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:346 | result | 固まっていた体がほぐれた。 | かたまっていたからだがほぐれた。 | Your stiff body loosened up. |
| src/services/eventService.ts:347 | label | 備品を整える | びひんをととのえる | Organize the equipment |
| src/services/eventService.ts:347 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:347 | result | 誰も見ていない片付けが、妙に気分を整えた。 | だれもみていないかたづけが、みょうにきぶんをととのえた。 | Cleaning up when no one was watching somehow helped settle your mood. |
| src/services/eventService.ts:350 | label | 読みかけの本を開く | よみかけのほんをひらく | Open the book you were reading |
| src/services/eventService.ts:350 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:350 | result | 一節が思わぬ発想をくれた。 | いっせつがおもわぬはっそうをくれた。 | One passage gave you an unexpected idea. |
| src/services/eventService.ts:351 | label | 調べ物を進める | しらべものをすすめる | Continue the research |
| src/services/eventService.ts:351 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:351 | result | 必要なページに辿り着いた。 | ひつようなぺーじにたどりついた。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:352 | label | 灯りを消して帰る | あかりをけしてかえる | Turn off the lights and leave |
| src/services/eventService.ts:352 | text | HPを8回復する | HPを8かいふくする | Heal 8 HP |
| src/services/eventService.ts:352 | result | 区切りをつけると、気持ちが軽くなった。 | くぎりをつけると、きもちがかるくなった。 | Drawing a line under the day made you feel lighter. |
| src/services/eventService.ts:355 | label | サドルを拭く | さどるをふく | Wipe the saddle |
| src/services/eventService.ts:355 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:355 | result | 困っていた生徒を手伝い、礼を受け取った。 | こまっていたせいとをてつだい、れいをうけとった。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:356 | label | 雨粒を払う | あまつぶをはらう | Brush off the raindrops |
| src/services/eventService.ts:356 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:356 | result | 冷たい空気で頭がすっきりした。 | つめたいくうきであたまがすっきりした。 | The cold air cleared your head. |
| src/services/eventService.ts:357 | label | 帰り道を考える | かえりみちをかんがえる | Think about the way home |
| src/services/eventService.ts:357 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:357 | result | 濡れた道を見ながら、次の動きが自然に整理できた。 | ぬれたみちをみながら、つぎのうごきがしぜんにせいりできた。 | Watching the wet road helped you sort out your next move. |
| src/services/eventService.ts:360 | label | 少し横になる | すこしよこになる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:360 | text | HPを16回復する | HPを16かいふくする | Heal 16 HP. |
| src/services/eventService.ts:360 | result | 短く休んで、だいぶ持ち直した。 | みじかくやすんで、だいぶもちなおした。 | You took a moment to recover and regain your rhythm. |
| src/services/eventService.ts:361 | label | 薬箱を整理する | くすりばこをせいりする | Organize the medicine box |
| src/services/eventService.ts:361 | text | ポーションを得る | ポーションをえる | Gain a potion |
| src/services/eventService.ts:361 | result | 使える備品を一つ分けてもらった。 | つかえるびひんをひとつわけてもらった。 | You were given one useful supply item. |
| src/services/eventService.ts:362 | label | 体調メモを書く | たいちょうめもをかく | Write a health note |
| src/services/eventService.ts:362 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:362 | result | 自分の限界を把握し、無理の線引きが上手くなった。 | じぶんのげんかいをはあくし、むりのせんひきがうまくなった。 | You understood your limits and got better at drawing the line. |
| src/services/eventService.ts:365 | label | 色を足す | いろをたす | Add color |
| src/services/eventService.ts:365 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:365 | result | 一筆入れる覚悟が、そのまま力になった。 | いっぴついれるかくごが、そのままちからになった。 | The resolve to add one stroke became strength. |
| src/services/eventService.ts:366 | label | 道具を洗う | どうぐをあらう | Wash the tools |
| src/services/eventService.ts:366 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:366 | result | 丁寧な片付けを見込まれ、材料費の残りを託された。 | ていねいなかたづけをみこまれ、ざいりょうひののこりをたくされた。 | Your careful cleanup earned trust, and you were given the leftover material money. |
| src/services/eventService.ts:367 | label | しばらく眺める | しばらくながめる | Look at it for a while |
| src/services/eventService.ts:367 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:367 | result | 未完成の絵を見ていると、自分の次の手も浮かんだ。 | みかんせいのえをみていると、じぶんのつぎのてもうかんだ。 | Looking at the unfinished painting gave you an idea for your next move. |
| src/services/eventService.ts:370 | label | 靴を並べ直す | くつをならべなおす | Line up the shoes again |
| src/services/eventService.ts:370 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:370 | result | 落とし物の持ち主から礼を受けた。 | おとしもののもちぬしかられいをうけた。 | The owner of the lost item thanked you. |
| src/services/eventService.ts:371 | label | 風に当たる | かぜにあたる | Feel the wind |
| src/services/eventService.ts:371 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:371 | result | 涼しい風で熱が引いた。 | すずしいかぜでねつがひいた。 | The quiet atmosphere helped you calm down and clear your head. |
| src/services/eventService.ts:372 | label | 明日の予定を確認する | あしたのよていをかくにんする | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:372 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:372 | result | 明日の段取りが見え、動きが洗練された。 | あしたのだんどりがみえ、うごきがせんれんされた。 | Reviewing the plan made the next steps clearer and your movements smoother. |
| src/services/eventService.ts:375 | label | ベンチで待つ | べんちでまつ | Wait on the bench |
| src/services/eventService.ts:375 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:375 | result | 夜風に当たりながら、電車を待った。 | よかぜにあたりながら、でんしゃをまった。 | You waited for the train in the night breeze. |
| src/services/eventService.ts:376 | label | 時刻表を確認する | じこくひょうをかくにんする | Check the timetable |
| src/services/eventService.ts:376 | text | 40Gを得る | 40Gをえる | Gain 40G |
| src/services/eventService.ts:376 | result | 乗り継ぎを見直し、余った交通費が残った。 | のりつぎをみなおし、あまったこうつうひがのこった。 | You reviewed your transfers and had some travel money left over. |
| src/services/eventService.ts:377 | label | 考えをまとめる | かんがえをまとめる | Organize your thoughts |
| src/services/eventService.ts:377 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:377 | result | ホームの静けさで、次にやることが整理できた。 | ほーむのしずけさで、つぎにやることがせいりできた。 | The quiet platform helped you organize what to do next. |
| src/services/eventService.ts:380 | label | 写真を撮る | しゃしんをとる | Take Photo |
| src/services/eventService.ts:380 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:380 | result | 春の景色を残すと、肩の力が抜けた。 | はるのけしきをのこすと、かたのちからがぬけた。 | Capturing the spring scenery helped the tension leave your shoulders. |
| src/services/eventService.ts:381 | label | 式次第を確認する | しきしだいをかくにんする | Check the program |
| src/services/eventService.ts:381 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:381 | result | 最初の段取りを把握し、動きが整った。 | さいしょのだんどりをはあくし、うごきがととのった。 | Reviewing the plan made the next steps clearer and your movements smoother. |
| src/services/eventService.ts:382 | label | 新入生を案内する | しんにゅうせいをあんないする | New Student |
| src/services/eventService.ts:382 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:382 | result | 迷っていた後輩を助け、礼を受けた。 | まよっていたこうはいをたすけ、れいをうけた。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:385 | label | 話を聞いて回る | はなしをきいてまわる | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:385 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:385 | result | いくつもの勧誘を聞き、新しい要領を覚えた。 | いくつものかんゆうをきき、あたらしいようりょうをおぼえた。 | After hearing many club invitations, you learned a new way to handle things. |
| src/services/eventService.ts:386 | label | チラシ配りを手伝う | ちらしくばりをてつだう | Help hand out flyers |
| src/services/eventService.ts:386 | text | 35Gを得る | 35Gをえる | Gain 35G |
| src/services/eventService.ts:386 | result | 先輩に手際を買われ、差し入れ代をもらった。 | せんぱいにてぎわをかわれ、さしいれだいをもらった。 | You found a small reward and put the extra money to use. |
| src/services/eventService.ts:387 | label | 少し距離を置く | すこしきょりをおく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:387 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:387 | result | 喧騒を眺めるうち、自分に合う場所が見えてきた。 | けんそうをながめるうち、じぶんにあうばしょがみえてきた。 | Finding your place helped you feel steadier about what came next. |
| src/services/eventService.ts:390 | label | 前列を引く | ぜんれつをひく | Draw a front-row seat |
| src/services/eventService.ts:390 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:390 | result | 逃げ場のない席を引き、腹が据わった。 | にげばのないせきをひき、はらがすわった。 | Finding your place helped you feel steadier about what came next. |
| src/services/eventService.ts:391 | label | 友人と笑う | ゆうじんとわらう | Laugh with a friend |
| src/services/eventService.ts:391 | text | HPを8回復する | HPを8かいふくする | Heal 8 HP |
| src/services/eventService.ts:391 | result | どの席でも何とかなる気がしてきた。 | どのせきでもなんとかなるきがしてきた。 | Finding your place helped you feel steadier about what came next. |
| src/services/eventService.ts:392 | label | 席表を書き直す | せきあらをかきなおす | Rewrite the seating chart |
| src/services/eventService.ts:392 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:392 | result | 配置を整理しながら、自分の手も整えた。 | はいちをせいりしながら、じぶんのてもととのえた。 | Tidying things up also helped clear your mind for the next step. |
| src/services/eventService.ts:395 | label | 弁当を分ける | べんとうをわける | Share your lunch |
| src/services/eventService.ts:395 | text | HPを14回復する | HPを14かいふくする | Heal 14 HP |
| src/services/eventService.ts:395 | result | 笑いながら食べる昼食は、思った以上に効いた。 | わらいながらたべるちゅうしょくは、おもったいじょうにきいた。 | The short break helped your body and mind recover. |
| src/services/eventService.ts:396 | label | 進路の話をする | しんろのはなしをする | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:396 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:396 | result | 他人の言葉で、自分の考えも少し輪郭を持った。 | たにんのことばで、じぶんのかんがえもすこしりんかくをもった。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/services/eventService.ts:397 | label | 昼休みに復習する | ひるやすみにふくしゅうする | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:397 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:397 | result | 短い時間をうまく使えた。 | みじかいじかんをうまくつかえた。 | Using the time well gave you room to think and move forward. |
| src/services/eventService.ts:400 | label | 傘に入る | かさにいる | Share an umbrella |
| src/services/eventService.ts:400 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:400 | result | 雨を避けるだけで、気持ちまで少し軽くなった。 | あめをさけるだけで、きもちまですこしかるくなった。 | rain, feelings a little. |
| src/services/eventService.ts:401 | label | 予備の傘を貸す | よびのかさをかす | Lend a spare umbrella |
| src/services/eventService.ts:401 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:401 | result | 翌日、丁寧なお礼が返ってきた。 | よくじつ、ていねいなおれいがかえってきた。 | Your careful choice helped someone and improved the situation. |
| src/services/eventService.ts:402 | label | 雨脚を読む | あまあしをよむ | The physical effort sharpened your rhythm and confidence. |
| src/services/eventService.ts:402 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:402 | result | 待つべき時を見極める感覚が磨かれた。 | まつべきときをみきわめるかんかくがみがかれた。 | Using the time well gave you room to think and move forward. |
| src/services/eventService.ts:405 | label | 添削を読み込む | てんさくをよみこむ | Study the corrections |
| src/services/eventService.ts:405 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:405 | result | 赤字の意図がつながり、理解が深まった。 | あかじのいとがつながり、りかいがふかまった。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:406 | label | 質問する | しつもんする | Ask a question |
| src/services/eventService.ts:406 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:406 | result | 一歩踏み込んだ問いで、新しい視点を得た。 | いっぽふみこんだといで、あたらしいしてんをえた。 | , new perspective gained. |
| src/services/eventService.ts:407 | label | 礼を言う | れいをいう | Say thanks |
| src/services/eventService.ts:407 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:407 | result | 素直に受け取る強さが少し身についた。 | すなおにうけとるつよさがすこしみについた。 | The experience strengthened your resolve and helped you grow. |
| src/services/eventService.ts:410 | label | 議事録を取る | ぎじろくをとる | Take meeting notes |
| src/services/eventService.ts:410 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:410 | result | 話の流れを追ううち、判断が速くなった。 | はなしのながれをおううち、はんだんがはやくなった。 | Reviewing the plan made the next steps clearer and your movements smoother. |
| src/services/eventService.ts:411 | label | 予算を確認する | よさんをかくにんする | Check the budget |
| src/services/eventService.ts:411 | text | 40Gを得る | 40Gをえる | Gain 40G |
| src/services/eventService.ts:411 | result | 余剰費を見つけ、協力分を受け取った。 | よじょうひをみつけ、きょうりょくぶんをうけとった。 | You found a small reward and put the extra money to use. |
| src/services/eventService.ts:412 | label | 意見を出す | いけんをだす | Offer an opinion |
| src/services/eventService.ts:412 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:412 | result | 場に声を置いたことで、少し前へ出られた。 | ばにこえをおいたことで、すこしまえへでられた。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/services/eventService.ts:415 | label | 丁寧に掃く | ていねいにはく | Sweep carefully |
| src/services/eventService.ts:415 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:415 | result | 単調な動きで呼吸が整った。 | たんちょうなうごきでこきゅうがととのった。 | The short break helped your body and mind recover. |
| src/services/eventService.ts:416 | label | 落ち葉を集める | おちばをあつめる | Gather fallen leaves |
| src/services/eventService.ts:416 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:416 | result | 作業を見ていた教師から差し入れ代をもらった。 | さぎょうをみていたきょうしからさしいれだいをもらった。 | You found a small reward and put the extra money to use. |
| src/services/eventService.ts:417 | label | 季節を惜しむ | きせつをおしむ | Savor the season |
| src/services/eventService.ts:417 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:417 | result | 終わるものを見送る余裕ができた。 | おわるものをみおくるよゆうができた。 | Using the time well gave you room to think and move forward. |
| src/services/eventService.ts:420 | label | 差出人を探す | さしだしにんをさがす | Look for the sender |
| src/services/eventService.ts:420 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:420 | result | 手がかりを追ううち、観察眼が冴えた。 | てがかりをおううち、かんさつめがさえた。 | Seeing the situation from a new angle gave you a useful perspective. |
| src/services/eventService.ts:421 | label | 返事を書く | へんじをかく | Write a reply |
| src/services/eventService.ts:421 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:421 | result | 言葉を選ぶ中で、自分の考えも研ぎ澄まされた。 | ことばをえらぶなかで、じぶんのかんがえもとぎすまされた。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/services/eventService.ts:422 | label | そっと戻す | そっともどす | Put it back quietly |
| src/services/eventService.ts:422 | text | HPを8回復する | HPを8かいふくする | Heal 8 HP |
| src/services/eventService.ts:422 | result | 踏み込みすぎない選択に、心が少し静まった。 | ふみこみすぎないせんたくに、こころがすこししずまった。 | Facing the feeling directly helped your mind settle. |
| src/services/eventService.ts:425 | label | 全力で走る | ぜんりょくではしる | Run with all your strength |
| src/services/eventService.ts:425 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:425 | result | 最後まで脚を緩めず、体に芯が通った。 | さいごまであしをゆるめず、からだにしんがかよった。 | The short break helped your body and mind recover. |
| src/services/eventService.ts:426 | label | 応援に回る | おうえんにまわる | Switch to cheering |
| src/services/eventService.ts:426 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:426 | result | 声を出しているうちに、気分まで晴れた。 | こえをだしているうちに、きぶんまではれた。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/services/eventService.ts:427 | label | バトンを磨く | ばとんをみがく | Polish the baton |
| src/services/eventService.ts:427 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:427 | result | 受け渡しを見直し、手順が洗練された。 | うけわたしをみなおし、てじゅんがせんれんされた。 | Reviewing the handoff refined your procedure. |
| src/services/eventService.ts:430 | label | 氷を削る | こおりをけずる | Shave the ice |
| src/services/eventService.ts:430 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:430 | result | 手際の良さを見込まれ、売上の一部を任された。 | てぎわのよさをみこまれ、うりあげのいちぶをまかされた。 | Your effort paid off and earned a useful reward. |
| src/services/eventService.ts:431 | label | 味見する | あじみする | Taste it |
| src/services/eventService.ts:431 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:431 | result | 冷たさで一気に生き返った。 | つめたさでいっきにいきかえった。 | The cold taste brought you back to life. |
| src/services/eventService.ts:432 | label | 段取りを組む | だんどりをくむ | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:432 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:432 | result | 混雑を想像して、先回りの感覚を得た。 | こんざつをそうぞうして、さきまわりのかんかくをえた。 | Imagining the crowd gave you a better sense of how to prepare ahead. |
| src/services/eventService.ts:435 | label | 教え合う | おしえあう | Teach each other |
| src/services/eventService.ts:435 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:435 | result | 説明することで、自分の理解も深まった。 | せつめいすることで、じぶんのりかいもふかまった。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:436 | label | 要点をまとめる | ようてんをまとめる | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:436 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:436 | result | 散らばった知識が、使える形にまとまった。 | ちらばったちしきが、つかえるかたちにまとまった。 | You refined what you learned and turned it into a practical advantage. |
| src/services/eventService.ts:437 | label | 休憩を促す | きゅうけいをうながす | Encourage a break |
| src/services/eventService.ts:437 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:437 | result | 全員で一息つき、集中力が戻った。 | ぜんいんでひといきつき、しゅうちゅうりょくがもどった。 | The short break helped your body and mind recover. |
| src/services/eventService.ts:440 | label | 風を入れる | かぜをいれる | Let in some air |
| src/services/eventService.ts:440 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:440 | result | 熱気が抜け、頭の中まで少し涼しくなった。 | ねっきがぬけ、あたまのなかまですこしすずしくなった。 | The heat cleared out, and even your thoughts cooled a little. |
| src/services/eventService.ts:441 | label | 夏の句を考える | なつのくをかんがえる | Think of a summer haiku |
| src/services/eventService.ts:441 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:441 | result | 音を言葉にするうち、思考が整った。 | おとをことばにするうち、しこうがととのった。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/services/eventService.ts:442 | label | 短く復習する | みじかくふくしゅうする | Do a quick review |
| src/services/eventService.ts:442 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:442 | result | だるさの中でも、一歩だけ進めた。 | だるさのなかでも、いっぽだけすすめた。 | Even through the sluggishness, you managed to take one step forward. |
| src/services/eventService.ts:445 | label | 水分を取る | すいぶんをとる | Drink some water |
| src/services/eventService.ts:445 | text | HPを14回復する | HPを14かいふくする | Heal 14 HP |
| src/services/eventService.ts:445 | result | 冷たい水が体の奥まで染みた。 | つめたいみずがからだのおくまでそみた。 | The cold water sank deep into your body. |
| src/services/eventService.ts:446 | label | フォームを見直す | ふぉーむをみなおす | Review your form |
| src/services/eventService.ts:446 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:446 | result | 無駄な動きが一つ減った。 | むだなうごきがひとつへった。 | Tidying things up also helped clear your mind for the next step. |
| src/services/eventService.ts:447 | label | 後輩に教える | こうはいにおしえる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:447 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:447 | result | 人に伝えることで、自信も少し増した。 | ひとにつたえることで、じしんもすこしました。 | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:450 | label | 最後まで見る | さいごまでみる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:450 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:450 | result | 夜空の光を見上げ、心がゆるんだ。 | よぞらのひかりをみあげ、こころがゆるんだ。 | The quiet atmosphere helped you calm down and clear your head. |
| src/services/eventService.ts:451 | label | 写真を撮る | しゃしんをとる | Take Photo |
| src/services/eventService.ts:451 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:451 | result | 良い一枚が撮れ、後で譲って礼を受けた。 | よいいちまいがとれ、あとでゆずってれいをうけた。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:452 | label | 願いを決める | ねがいをきめる | Decide your wish |
| src/services/eventService.ts:452 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:452 | result | 言葉にしない目標が、少しだけ固まった。 | ことばにしないもくひょうが、すこしだけかたまった。 | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:455 | label | 譜面を読む | ふめんをよむ | Read the sheet music |
| src/services/eventService.ts:455 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:455 | result | 全体の流れが見え、手も迷わなくなった。 | ぜんたいのながれがみえ、てもまよわなくなった。 | Reviewing the plan made the next steps clearer and your movements smoother. |
| src/services/eventService.ts:456 | label | 合奏に混ざる | がっそうにまざる | Join the ensemble |
| src/services/eventService.ts:456 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:456 | result | 音を合わせる緊張で、背筋が伸びた。 | おとをあわせるきんちょうで、せすじがのびた。 | The tension of matching the music straightened your posture. |
| src/services/eventService.ts:457 | label | 片付けを手伝う | かたづけをてつだう | Help clean up |
| src/services/eventService.ts:457 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:457 | result | 顧問から差し入れ代を預かった。 | こもんからさしいれだいをあずかった。 | You found a small reward and put the extra money to use. |
| src/services/eventService.ts:460 | label | 冷たい飲み物を買う | つめたいのみものをかう | Buy a cold drink |
| src/services/eventService.ts:460 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:460 | result | 喉が潤い、夕方の疲れが抜けた。 | のどがじゅんい、ゆうがたのつかれがぬけた。 | The drink and short break helped your body recover. |
| src/services/eventService.ts:461 | label | 新商品を試す | しんしょうひんをためす | Try the new product |
| src/services/eventService.ts:461 | text | ポーションを得る | ポーションをえる | Gain a potion |
| src/services/eventService.ts:461 | result | 妙に効きそうな一本を見つけた。 | みょうにききそうないっぽんをみつけた。 | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:462 | label | 寄り道の相談をする | よりみちのそうだんをする | Talk about stopping somewhere |
| src/services/eventService.ts:462 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:462 | result | 雑談の中で、次の予定が自然に決まった。 | ざつだんのなかで、つぎのよていがしぜんにきまった。 | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:465 | label | 雨宿りする | あまやどりする | Take shelter from the rain |
| src/services/eventService.ts:465 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:465 | result | 雨音を聞いているうち、焦りが薄れた。 | あまおとをきいているうち、あせりがうすれた。 | Listening to the rain helped your thoughts settle and eased your impatience. |
| src/services/eventService.ts:466 | label | 自転車を拭く | じてんしゃをふく | Wipe the bicycle |
| src/services/eventService.ts:466 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:466 | result | 困っていた生徒に感謝された。 | こまっていたせいとにかんしゃされた。 | A student in trouble thanked you. |
| src/services/eventService.ts:467 | label | 空模様を読む | そらもようをよむ | Read the sky |
| src/services/eventService.ts:467 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:467 | result | 待つべき時を見極める感覚が少し冴えた。 | まつべきときをみきわめるかんかくがすこしさえた。 | Using the time well gave you room to think and move forward. |
| src/services/eventService.ts:470 | label | 大道具を組む | おおどうぐをくむ | Large Class |
| src/services/eventService.ts:470 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:470 | result | 重い板を運び切り、腕に自信がついた。 | おもいいたをはこびきり、うでにじしんがついた。 | The experience strengthened your resolve and helped you grow. |
| src/services/eventService.ts:471 | label | 設計を見直す | せっけいをみなおす | Review the design |
| src/services/eventService.ts:471 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:471 | result | 導線を整えると、手順もすっきりした。 | どうせんをととのえると、てじゅんもすっきりした。 | Organizing the flow also clarified the procedure. |
| src/services/eventService.ts:472 | label | 演出を考える | えんしゅつをかんがえる | Plan the staging |
| src/services/eventService.ts:472 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:472 | result | 驚かせ方を考えるうち、発想が広がった。 | おどろかせほうをかんがえるうち、はっそうがひろがった。 | Thinking about how to surprise people broadened your ideas. |
| src/services/eventService.ts:475 | label | 色を拾う | いろをひろう | Pick Up |
| src/services/eventService.ts:475 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:475 | result | 葉の色を見比べ、観察が深まった。 | はのいろをみくらべ、かんさつがふかまった。 | Seeing the situation from a new angle gave you a useful perspective. |
| src/services/eventService.ts:476 | label | 静かに描く | しずかにえがく | Draw quietly |
| src/services/eventService.ts:476 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:476 | result | 手を動かす時間で、心が落ち着いた。 | てをうごかすじかんで、こころがおちついた。 | Facing the feeling directly helped your mind settle. |
| src/services/eventService.ts:477 | label | 友人の絵を見る | ゆうじんのえをみる | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:477 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:477 | result | 別の見方に触れ、自分の視界も広がった。 | べつのみかたにふれ、じぶんのしかいもひろがった。 | Seeing another point of view widened your own perspective. |
| src/services/eventService.ts:480 | label | 志望を話す | しぼうをはなす | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:480 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:480 | result | 口に出したぶん、覚悟が少し固まった。 | くちにだしたぶん、かくごがすこしかたまった。 | Facing the feeling directly helped your mind settle. |
| src/services/eventService.ts:481 | label | 資料を読む | しりょうをよむ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:481 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:481 | result | 必要な条件が整理できた。 | ひつようなじょうけんがせいりできた。 | Tidying things up also helped clear your mind for the next step. |
| src/services/eventService.ts:482 | label | 別案も聞く | べつあんもきく | Hear another idea |
| src/services/eventService.ts:482 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:482 | result | 思いがけない選択肢を知った。 | おもいがけないせんたくしをしった。 | Seeing the situation from a new angle gave you a useful perspective. |
| src/services/eventService.ts:485 | label | 荷物を運ぶ | にもつをはこぶ | Carry the luggage |
| src/services/eventService.ts:485 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:485 | result | 重い鞄を手伝い、足腰に力が入った。 | おもいかばんをてつだい、あしこしにちからがはいった。 | Helping with a heavy bag strengthened your legs and back. |
| src/services/eventService.ts:486 | label | しおりを確認する | しおりをかくにんする | Check the itinerary |
| src/services/eventService.ts:486 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:486 | result | 行程を頭に入れ、動きが滑らかになった。 | こうていをあたまにいれ、うごきがなめらかになった。 | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:487 | label | 売店を見る | ばいてんをみる | Check the shop |
| src/services/eventService.ts:487 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:487 | result | 余った小銭をうまくやりくりできた。 | あまったこぜにをうまくやりくりできた。 | The opportunity produced a practical reward. |
| src/services/eventService.ts:490 | label | 素振りを続ける | そぶりをつづける | Keep practicing swings |
| src/services/eventService.ts:490 | text | 恒久ムキムキ+1 | こうきゅうむきむき+1 | Permanent Strength +1 |
| src/services/eventService.ts:490 | result | 夕日が沈むまで、振りを崩さなかった。 | ゆうひがしずむまで、ふりをくずさなかった。 | The physical effort sharpened your rhythm and confidence. |
| src/services/eventService.ts:491 | label | 球拾いを手伝う | たまひろいをてつだう | Help collect balls |
| src/services/eventService.ts:491 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:491 | result | 監督から飲み物代を渡された。 | かんとくからのみものかをわたされた。 | You found a small reward and put the extra money to use. |
| src/services/eventService.ts:492 | label | フォームを観察する | ふぉーむをかんさつする | Observe the form |
| src/services/eventService.ts:492 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:492 | result | 良い動きを盗み、自分の手札にも活かした。 | よいうごきをぬすみ、じぶんのてふだにもいかした。 | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:495 | label | 味見をする | あじみをする | Taste it |
| src/services/eventService.ts:495 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:495 | result | 焼きたての甘さで元気が戻った。 | やきたてのあまさでげんきがもどった。 | The fresh-baked sweetness restored your energy. |
| src/services/eventService.ts:496 | label | 分量を量る | ぶんりょうをはかる | Measure the ingredients |
| src/services/eventService.ts:496 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:496 | result | 正確さを意識し、手順が安定した。 | せいかくさをいしきし、てじゅんがあんていした。 | Focusing on accuracy made the procedure steadier. |
| src/services/eventService.ts:497 | label | 余りを売る | あまりをうる | Sell the leftovers |
| src/services/eventService.ts:497 | text | 35Gを得る | 35Gをえる | Gain 35G |
| src/services/eventService.ts:497 | result | 好評で、材料費以上の売上になった。 | こうひょうで、ざいりょうひいじょうのうりあげになった。 | Your effort paid off and earned a useful reward. |
| src/services/eventService.ts:500 | label | 質問を受ける | しつもんをうける | Answer questions |
| src/services/eventService.ts:500 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:500 | result | 自分の考えを言葉にし、少し肝が据わった。 | じぶんのかんがえをことばにし、すこしきもがすわった。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/services/eventService.ts:501 | label | 記事を読む | きじをよむ | Read the article |
| src/services/eventService.ts:501 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:501 | result | 人の見方を知り、新しい切り口を得た。 | にんのみかたをしり、あたらしいきりくちをえた。 | Seeing the situation from a new angle gave you a useful perspective. |
| src/services/eventService.ts:502 | label | 写真を手伝う | しゃしんをてつだう | Help with the photos |
| src/services/eventService.ts:502 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:502 | result | 撮影補助のお礼をもらった。 | さつえいほじょのおれいをもらった。 | The opportunity produced a practical reward. |
| src/services/eventService.ts:505 | label | 話を聞く | はなしをきく | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:505 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:505 | result | 友人の声で、胸のつかえが少しほどけた。 | ゆうじんのこえで、むねのつかえがすこしほどけた。 | friend voice, a little. |
| src/services/eventService.ts:506 | label | 相談に乗る | そうだんにのる | Hear them out |
| src/services/eventService.ts:506 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:506 | result | 相手の考えを整理するうち、自分も整った。 | あいてのかんがえをせいりするうち、じぶんもととのった。 | Helping them sort out their thoughts also settled your own. |
| src/services/eventService.ts:507 | label | 写真を撮る | しゃしんをとる | Take Photo |
| src/services/eventService.ts:507 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:507 | result | 良い一枚を渡し、あとで礼を受けた。 | よいいちまいをわたし、あとでれいをうけた。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:510 | label | 結果を読む | けっかをよむ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:510 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:510 | result | 数字を受け止め、次の課題が見えた。 | すうじをうけとめ、つぎのかだいがみえた。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:511 | label | 友人を励ます | ゆうじんをはげます | Encourage a friend |
| src/services/eventService.ts:511 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:511 | result | 声をかけるうち、自分も少し前向きになった。 | こえをかけるうち、じぶんもすこしまえむきになった。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/services/eventService.ts:512 | label | 次を決める | つぎをきめる | Decide the next step |
| src/services/eventService.ts:512 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:512 | result | 落ち込む前に動くと、芯が少し太くなった。 | おちこむまえにうごくと、しんがすこしふとくなった。 | Acting before you sank into discouragement made your core a little stronger. |
| src/services/eventService.ts:515 | label | 雪を踏みしめる | ゆきをふみしめる | Step through the snow |
| src/services/eventService.ts:515 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:515 | result | 静かな朝の冷気で、気分が澄んだ。 | しずかなあさのれいきで、きぶんがすんだ。 | The quiet atmosphere helped you calm down and clear your head. |
| src/services/eventService.ts:516 | label | 早めに登校する | はやめにとうこうする | Go to school early |
| src/services/eventService.ts:516 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:516 | result | 余裕を持てたぶん、準備も丁寧になった。 | よゆうをもてたぶん、じゅんびもていねいになった。 | Having extra time made your preparation more careful. |
| src/services/eventService.ts:517 | label | 転びそうな後輩を支える | ころびそうなこうはいをささえる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:517 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:517 | result | あとで温かい飲み物をおごってもらった。 | あとであたたかいのみものをおごってもらった。 | The short break helped your body and mind recover. |
| src/services/eventService.ts:520 | label | 手を温める | てをあたためる | Warm your hands |
| src/services/eventService.ts:520 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:520 | result | 冷えた指が戻り、体も楽になった。 | ひえたゆびがもどり、からだもらくになった。 | Your cold fingers recovered, and your body felt easier. |
| src/services/eventService.ts:521 | label | 朝学習を始める | あさがくしゅうをはじめる | Start morning study |
| src/services/eventService.ts:521 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:521 | result | 静かな時間をうまく使えた。 | しずかなじかんをうまくつかえた。 | Using the time well gave you room to think and move forward. |
| src/services/eventService.ts:522 | label | 友人を呼ぶ | ゆうじんをよぶ | Call a friend |
| src/services/eventService.ts:522 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:522 | result | 集まる空気の中で、少し元気が戻った。 | あつまるくうきのなかで、すこしげんきがもどった。 | You took a moment to recover and regain your rhythm. |
| src/services/eventService.ts:525 | label | 募金を呼びかける | ぼきんをよびかける | Call for donations |
| src/services/eventService.ts:525 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:525 | result | 声を張るうち、人前に立つ強さがついた。 | こえをはるうち、ひとまえにたつつよさがついた。 | Raising your voice gave you strength in front of others. |
| src/services/eventService.ts:526 | label | 品物を並べる | しなものをならべる | Arrange the goods |
| src/services/eventService.ts:526 | text | 35Gを得る | 35Gをえる | Gain 35G |
| src/services/eventService.ts:526 | result | 売上が伸び、運営から礼を受けた。 | うりあがのび、うんえいかられいをうけた。 | Sales improved, and the organizers thanked you. |
| src/services/eventService.ts:527 | label | 飾りを直す | かざりをなおす | Fix the decorations |
| src/services/eventService.ts:527 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:527 | result | 細部を整える感覚が、次にも活きそうだ。 | さいぶをととのえるかんかくが、つぎにもいきそうだ。 | The sense for fixing details will help next time too. |
| src/services/eventService.ts:530 | label | 願いを書く | ねがいをかく | Write down your wish |
| src/services/eventService.ts:530 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:530 | result | 目標を文字にすると、手が少し迷わなくなった。 | もくひょうをもじにすると、てがすこしまよわなくなった。 | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:531 | label | 甘酒を飲む | あまざけをのむ | Drink amazake |
| src/services/eventService.ts:531 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:531 | result | 温かさが体に広がった。 | あたたかさがからだにひろがった。 | Warmth spread through your body. |
| src/services/eventService.ts:532 | label | おみくじを引く | おみくじをひく | Draw a fortune slip |
| src/services/eventService.ts:532 | text | ポーションを得る | ポーションをえる | Gain a potion |
| src/services/eventService.ts:532 | result | 妙に縁起の良い小瓶を授かった。 | みょうにえんぎのよいこびんをさずかった。 | You received a strangely lucky little bottle. |
| src/services/eventService.ts:535 | label | 弱点を確認する | じゃくてんをかくにんする | Check your weak points |
| src/services/eventService.ts:535 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:535 | result | 避けていた問題に、ようやく名前をつけられた。 | さけていたもんだいに、ようやくなまえをつけられた。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:536 | label | 計画を立てる | けいかくをたてる | Make a plan |
| src/services/eventService.ts:536 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:536 | result | 焦りが予定に変わり、少し呼吸が楽になった。 | あせりがよていにかわり、すこしこきゅうがらくになった。 | The short break helped your body and mind recover. |
| src/services/eventService.ts:537 | label | 助言を受ける | じょげんをうける | Accept advice |
| src/services/eventService.ts:537 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:537 | result | 次に使える具体策を持ち帰った。 | つぎにつかえるぐたいさくをもちかえった。 | You brought home a concrete tactic you can use next time. |
| src/services/eventService.ts:540 | label | 受け取る | うけとる | Accept it |
| src/services/eventService.ts:540 | text | HPを10回復する | HPを10かいふくする | Heal 10 HP |
| src/services/eventService.ts:540 | result | 照れくささごと、甘さが疲れをほどいた。 | てれくささごと、あまさがつかれをほどいた。 | The sweetness, embarrassment and all, eased your fatigue. |
| src/services/eventService.ts:541 | label | お返しを考える | おかえしをかんがえる | Think of a return gift |
| src/services/eventService.ts:541 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:541 | result | 相手のことを考える時間が、少し自分を整えた。 | あいてのことをかんがえるじかんが、すこしじぶんをととのえた。 | Tidying things up also helped clear your mind for the next step. |
| src/services/eventService.ts:542 | label | 箱をしまう | はこをしまう | Put the box away |
| src/services/eventService.ts:542 | text | 25Gを得る | 25Gをえる | Gain 25G |
| src/services/eventService.ts:542 | result | 落とし物を届けた礼が、思わぬ形で返ってきた。 | おとしものをとどけたれいが、おもわぬかたちでかえってきた。 | Thanks for returning a lost item came back in an unexpected form. |
| src/services/eventService.ts:545 | label | 花束を受け取る | はなたばをうけとる | Accept the bouquet |
| src/services/eventService.ts:545 | text | HPを14回復する | HPを14かいふくする | Heal 14 HP |
| src/services/eventService.ts:545 | result | 積み重ねを思い出し、胸が少し温かくなった。 | つみかさねをおもいだし、むねがすこしあたたかくなった。 | Facing the feeling directly helped your mind settle. |
| src/services/eventService.ts:546 | label | 後輩に言葉を残す | こうはいにことばをのこす | Leave words for a younger student |
| src/services/eventService.ts:546 | text | 最大HP+2 | さいだいHP+2 | Max HP +2 |
| src/services/eventService.ts:546 | result | 伝える側に立つと、背筋が自然に伸びた。 | つたえるがわにたつと、せすじがしぜんにのびた。 | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:547 | label | 写真に写る | しゃしんにうつる | Join the photo |
| src/services/eventService.ts:547 | text | 35Gを得る | 35Gをえる | Gain 35G |
| src/services/eventService.ts:547 | result | 記念写真の手伝いで、後から礼を受けた。 | きねんしゃしんのてつだいで、のちかられいをうけた。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:550 | label | 机をなでる | つくえをなでる | Touch the desk |
| src/services/eventService.ts:550 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:550 | result | 静けさの中で、ようやく一息つけた。 | しずけさのなかで、ようやくひといきつけた。 | In the quiet, you finally caught your breath. |
| src/services/eventService.ts:551 | label | 黒板を消す | こくばんをけす | Erase the blackboard |
| src/services/eventService.ts:551 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:551 | result | 最後を整えると、次へ進む準備もできた。 | さいごをととのえると、つぎへすすむじゅんびもできた。 | final, next move on preparation. |
| src/services/eventService.ts:552 | label | 教室を見渡す | きょうしつをみわたす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:552 | text | 小さな成果を得る | ちいさなせいかをえる | Gain a small bonus |
| src/services/eventService.ts:552 | result | 終わった時間を受け止め、前を向けた。 | おわったじかんをうけとめ、まえをむけた。 | Using the time well gave you room to think and move forward. |
| src/services/eventService.ts:555 | label | 問題を解き切る | もんだいをとききる | Finish solving the problems |
| src/services/eventService.ts:555 | text | カードを1枚強化する | カードを1まいきょうかする | Upgrade 1 card |
| src/services/eventService.ts:555 | result | 眠気の向こうで、一問だけ確かな手応えを得た。 | ねむけのむこうで、いちもんだけたしかなてごたえをえた。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:556 | label | ドリンクを足す | どりんくをたす | Refill your drink |
| src/services/eventService.ts:556 | text | HPを12回復する | HPを12かいふくする | Heal 12 HP |
| src/services/eventService.ts:556 | result | 温かい飲み物で、もう少しだけ粘れそうだ。 | あたたかいのみもので、もうすこしだけねばれそうだ。 | The short break helped your body and mind recover. |
| src/services/eventService.ts:557 | label | 互いに教える | たがいにおしえる | Teach each other |
| src/services/eventService.ts:557 | text | スキルカードを1枚得る | すきるカードを1まいえる | Gain 1 Skill card |
| src/services/eventService.ts:557 | result | 友人の説明から、新しい見方を拾った。 | ゆうじんのせつめいから、あたらしいみかたをひろった。 | Seeing the situation from a new angle gave you a useful perspective. |
| src/services/eventService.ts:565 | resultLog | サンプル&lt;br&gt;50Gを得た。 | さんぷる&lt;br&gt;50Gをえた。 | Sample&lt;br&gt;Gained 50G. |
| src/services/eventService.ts:569 | resultLog | サンプル&lt;br&gt;HPが50回復した。 | さんぷる&lt;br&gt;HPが50かいふくした。 | Sample&lt;br&gt;Healed 50 HP. |
| src/services/eventService.ts:580 | resultLog | サンプル&lt;br&gt;最大HP+50。 | さんぷる&lt;br&gt;さいだいHP+50。 | Sample&lt;br&gt;Max HP +50. |
| src/services/eventService.ts:584 | resultLog | サンプル&lt;br&gt;恒久ムキムキ+50。 | さんぷる&lt;br&gt;こうきゅうむきむき+50。 | Sample&lt;br&gt;Permanent Strength +50. |
| src/services/eventService.ts:603 | resultLog | サンプル&lt;br&gt;「あかり」が強化された。 | さんぷる&lt;br&gt;「あかり」がきょうかされた。 | Sample&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:614 | resultLog | サンプル&lt;br&gt;「あかり」を得た。 | さんぷる&lt;br&gt;「あかり」をえた。 | Sample&lt;br&gt;Gained "Akari". |
| src/services/eventService.ts:626 | resultLog | サンプル&lt;br&gt;「あかり」を得た。 | さんぷる&lt;br&gt;「あかり」をえた。 | Sample&lt;br&gt;Gained "Akari". |

### 小中高イベント本体（1401行）

#### 怪しい薬売り（17行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:653 | title | 怪しい薬売り | あやしいくすりうりり | Suspicious Medicine Seller |
| src/services/eventService.ts:654 | description | 路地裏で男が声をかけてきた。「とびきりの薬、あるよ」 | ろじうらでおとこがこえをかけてきた。「とびきりのくすり、あるよ」 | Familiar: They share their honest feelings. |
| src/services/eventService.ts:656 | label | 買う | かう | Buy it |
| src/services/eventService.ts:656 | text | 20Gを払って薬を買う | 20Gをはらってくすりをかう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:658 | resultLog | お金が足りない…。 | おきんがたりない…。 | You do not have enough gold. |
| src/services/eventService.ts:671 | resultLog | 怪しい薬(ポーション: あかり)を手に入れた！&lt;br&gt;残金: 50G | あやしいくすり(ポーション: あかり)をてにいれた！&lt;br&gt;ざんきん: 50G | You obtained a suspicious medicine (Potion: Akari)!&lt;br&gt;Gold left: 50G |
| src/services/eventService.ts:674 | label | 無視 | むし | Ignore it |
| src/services/eventService.ts:674 | text | 関わらず立ち去る | かかわらずたちさる | Leave without getting involved |
| src/services/eventService.ts:677 | label | 通報する | つうほうする | Report it |
| src/services/eventService.ts:677 | text | 先生を呼んで摘発を試みる | せんせいをよんでてきはつをこころみる | Call a teacher and try to expose it |
| src/services/eventService.ts:681 | resultLog | 摘発成功！謝礼と60G入手。 | てきはつせいこう！しゃれいと60Gにゅうしゅ。 | Your helpful action was noticed, and you received thanks in return. Gained 60G. |
| src/services/eventService.ts:686 | resultLog | 逆恨みで反撃された！HP-8。 | さかうらみではんげきされた！HP-8。 | The risky choice backfired and left you with a setback. Lost 8 HP. |
| src/services/eventService.ts:689 | label | 弟子入り | でしいり | Become an apprentice |
| src/services/eventService.ts:689 | text | 調合を学びたいと願い出る | ちょうごうをまなびたいとねがいでる | Ask to learn the mixture |
| src/services/eventService.ts:704 | resultLog | 才能を認められた！ムキムキ永続+1とプロテインを入手。 | さいのうをみとめられた！むきむきえいぞく+1とぷろていんをにゅうしゅ。 | Your effort was recognized and turned into a stronger result. Permanent Strength +1 and obtained "Protein Shake". |
| src/services/eventService.ts:710 | resultLog | 調合のコツを掴み、最大HP+3。 | ちょうごうのこつをつかみ、さいだいHP+3。 | You refined what you learned and turned it into a practical advantage. Increase max HP by 3. |
| src/services/eventService.ts:719 | resultLog | 失敗。怪しい薬でHP-10、「後悔」を入手。 | しっぱい。あやしいくすりでHP-10、「こうかい」をにゅうしゅ。 | failure. HP -10, " Regret " obtained. |

#### 踊り場の鏡（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:725 | title | 踊り場の鏡 | おどりばのかがみ | Landing Mirror |
| src/services/eventService.ts:726 | description | 大きな鏡がある。映っている自分と目が合った。 | おおきなかがみがある。うつっているじぶんとめがあった。 | The strange school scene offered a choice with real consequences. |
| src/services/eventService.ts:728 | label | 覗き込む | のぞきこむ | Peer inside |
| src/services/eventService.ts:728 | text | 鏡の奥にある真実を探る | かがみのおくにあるしんじつをさぐる | Search for the truth inside the mirror |
| src/services/eventService.ts:734 | resultLog | 鏡の中から「あかり」の複製が現れた。 | かがみのなかから「あかり」のふくせいがあらわれた。 | A duplicate of Akari appeared from inside the mirror. |
| src/services/eventService.ts:740 | resultLog | 鏡の縁から小銭が落ちた。35G入手。 | かがみのへりからこぜにがおちた。35Gにゅうしゅ。 | The opportunity produced a practical reward. Gained 35G. |
| src/services/eventService.ts:743 | resultLog | 視線を奪われてくらみが走る。HP-8。 | しせんをうばわれてくらみがはしる。HP-8。 | You moved through the situation cleanly and kept the momentum going. Lost 8 HP. |
| src/services/eventService.ts:746 | label | 割る | わる | Break It |
| src/services/eventService.ts:746 | text | 鏡を破壊して道を開く | かがみをはかいしてみちをひらく | Break the Mirror Open and Clear the Way |
| src/services/eventService.ts:750 | resultLog | 破片の痛みと引き換えに突破した。呪い「骨折」を受けた。 | はへんのいたみとひきかえにとっぱした。のろい「こっせつ」をうけた。 | The risky choice backfired and left you with a setback. Received the curse "Injury". |
| src/services/eventService.ts:753 | resultLog | 恐れを断ち切り、最大HP+2。 | おそれをたちきり、さいだいHP+2。 | Facing the feeling directly helped your mind settle. Increase max HP by 2. |
| src/services/eventService.ts:756 | resultLog | 破片を浴びて重傷。HP-12。 | はへんをあびてじゅうしょう。HP-12。 | The risky choice backfired and left you with a setback. Lost 12 HP. |
| src/services/eventService.ts:759 | label | 話しかける | はなしかける | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:759 | text | 鏡の向こう側と交渉する | かがみのむこうがわとこうしょうする | Negotiate with the other side of the mirror |
| src/services/eventService.ts:763 | resultLog | 別の自分と折り合いがつき、ムキムキ永続+1。 | べつのじぶんとおりあいがつき、むきむきえいぞく+1。 | You handled the moment and carried its outcome into what came next. Permanent Strength +1. |
| src/services/eventService.ts:767 | resultLog | 交渉成立。エナジーポーションを入手。 | こうしょうせいりつ。えなじーポーションをにゅうしゅ。 | Your effort was recognized and turned into a stronger result. Obtained a Energy Potion. |
| src/services/eventService.ts:770 | resultLog | 言葉が逆撫でして混乱。状態異常カードを追加。 | ことばがぎゃくなでしてこんらん。じょうたいいじょうカードをついか。 | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:773 | label | 立ち去る | たちさる | Walk away |
| src/services/eventService.ts:773 | text | この場は深追いしない | このばはしんおいしない | Do not press any deeper here |
| src/services/eventService.ts:777 | resultLog | 慎重な判断が吉と出た。HP+8。 | しんちょうなはんだんがきちとでた。HP+8。 | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:782 | resultLog | 退却中に財布を落とした。25G失う。 | たいきゃくなかにさいふをおとした。25Gうしなう。 | The opportunity produced a practical reward. Lost 25G. |

#### 呪われた書物（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:788 | title | 呪われた書物 | のろわれたしょもつ | Cursed Book |
| src/services/eventService.ts:789 | description | 古びた祭壇に一冊の本が置かれている。不吉な気配がする。 | ふるびたさいだんにいっさつのほんがおかれている。ふきつなけはいがする。 | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:791 | label | 読む | よむ | Read it |
| src/services/eventService.ts:791 | text | 禁書の力を受け入れる | きんしょのちからをうけいれる | Accept the forbidden book's power |
| src/services/eventService.ts:804 | resultLog | 禁書と契約した。(HP-10)&lt;br&gt;レリック「あかり」を入手。 | きんしょとけいやくした。(HP-10)&lt;br&gt;おたから「あかり」をにゅうしゅ。 | You made a contract with the forbidden book. Lost 10 HP.&lt;br&gt;Obtained the relic "Akari". |
| src/services/eventService.ts:808 | resultLog | ページの間から古い紙幣を見つけた。50G入手。 | ぺーじのかんからふるいしへいをみつけた。50Gにゅうしゅ。 | The study moment clarified what you needed to understand next. Gained 50G. |
| src/services/eventService.ts:817 | resultLog | 呪いが逆流した！HP-14、呪い「後悔」を受けた。 | のろいがぎゃくりゅうした！HP-14、のろい「こうかい」をうけた。 | curse!HP -14, curse " Regret ". |
| src/services/eventService.ts:820 | label | 封印する | ふういんする | Seal it away |
| src/services/eventService.ts:820 | text | 本を閉じて安全を優先する | ほんをとじてあんぜんをゆうせんする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:824 | resultLog | 正しい判断だった。精神が安定しHP+12。 | ただしいはんだんだった。せいしんがあんていしHP+12。 | right judgment. god HP +12. |
| src/services/eventService.ts:829 | resultLog | 封印の儀式費用を請求された。30G失った。 | ふういんのぎしきひようをせいきゅうされた。30Gうしなった。 | The opportunity produced a practical reward. Lost 30G. |
| src/services/eventService.ts:832 | label | 燃やす | もやす | Burn it |
| src/services/eventService.ts:832 | text | 危険物として処分する | きけんぶつとしてしょぶんする | You cleared away something unnecessary and made room to move forward. |
| src/services/eventService.ts:836 | resultLog | 恐怖を乗り越え、ムキムキ永続+1。 | きょうふをのりこえ、むきむきえいぞく+1。 | Facing the feeling directly helped your mind settle. Permanent Strength +1. |
| src/services/eventService.ts:840 | resultLog | 炎の残滃が瓶に宿った。火炎ポーションを入手。 | ほのおのざんかめにやどった。かえんポーションをにゅうしゅ。 | You handled the moment and carried its outcome into what came next. Obtained a Fire Potion. |
| src/services/eventService.ts:843 | resultLog | 燃え上がる呪炎に巻き込まれた。HP-9。 | もえあがるじゅほのおにまきこまれた。HP-9。 | The risky choice backfired and left you with a setback. Lost 9 HP. |
| src/services/eventService.ts:846 | label | 写し取る | うつしとる | Copy it down |
| src/services/eventService.ts:846 | text | 危ない部分だけ抜き書きする | あぶないぶぶんだけぬきかきする | Copy only the dangerous parts |
| src/services/eventService.ts:852 | resultLog | 禁書の知識を抜き出した。「あかり」を入手。 | きんしょのちしきをぬきだした。「あかり」をにゅうしゅ。 | You refined what you learned and turned it into a practical advantage. Obtained "Akari". |
| src/services/eventService.ts:855 | resultLog | 知識が自信になった。最大HP+2。 | ちしきがじしんになった。さいだいHP+2。 | The experience strengthened your resolve and helped you grow. Increase max HP by 2. |
| src/services/eventService.ts:858 | resultLog | 写本中に精神を削られた。状態異常カードを1枚追加。 | しゃほんなかにせいしんをけずられた。じょうたいいじょうカードを1まいついか。 | You turned the event into a useful tool for the road ahead. |

#### 伝説の給食（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:864 | title | 伝説の給食 | でんせつのきゅうしょく | Legendary School Lunch |
| src/services/eventService.ts:865 | description | 今日は揚げパンの日だ！しかし、最後に一つだけ余っている。&lt;br&gt;クラスメートとジャンケンで勝負だ。 | きょうはあげぱんのひだ！しかし、さいごにひとつだけあまっている。&lt;br&gt;くらすめーととじゃんけんでしょうぶだ。 | Today is fried-bread day! But there is only one piece left.&lt;br&gt;You face your classmates in rock-paper-scissors. |
| src/services/eventService.ts:867 | label | 正々堂々ジャンケン | せいせいどうどうじゃんけん | Play fair rock-paper-scissors |
| src/services/eventService.ts:867 | text | 真っ向勝負で揚げパンを狙う | まっこうしょうぶであげぱんをねらう | Fried Bread |
| src/services/eventService.ts:871 | resultLog | 見事に勝利！伝説の揚げパンで最大HP+5。 | みごとにしょうり！でんせつのあげぱんでさいだいHP+5。 | The event turned into a memorable success with lasting value. Increase max HP by 5. |
| src/services/eventService.ts:874 | resultLog | 惜敗したが、給食券を譲ってもらい30G入手。 | せきはいしたが、きゅうしょくけんをゆずってもらい30Gにゅうしゅ。 | You found a small reward and put the extra money to use. Gained 30G. |
| src/services/eventService.ts:877 | resultLog | 連敗でしょんぼり。精神的ダメージでHP-5。 | れんぱいでしょんぼり。せいしんてきだめーじでHP-5。 | You handled the moment and carried its outcome into what came next. Lost 5 HP. |
| src/services/eventService.ts:880 | label | 半分こを提案 | はんぶんこをていあん | Suggest splitting it in half |
| src/services/eventService.ts:880 | text | クラスメートと分け合って食べる | くらすめーととわけあってたべる | Share it with your classmates |
| src/services/eventService.ts:884 | resultLog | 交渉成功！仲良く半分こしてHP+12。 | こうしょうせいこう！なかよくはんぶんこしてHP+12。 | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:888 | resultLog | 分けてくれたお礼にデザートをもらった。HPポーション入手。 | わけてくれたおれいにでざーとをもらった。HPポーションにゅうしゅ。 | You turned the event into a useful tool for the road ahead. Gain a potion. |
| src/services/eventService.ts:890 | resultLog | 提案は却下。気まずい空気になった。 | ていあんはきゃっか。きまずいくうきになった。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:893 | label | 配膳を手伝う | はいぜんをてつだう | Help serve lunch |
| src/services/eventService.ts:893 | text | 先生に協力して別報酬を狙う | せんせいにきょうりょくしてべっぽうしゅうをねらう | Co-op Reward |
| src/services/eventService.ts:897 | resultLog | 働きぶりを認められ、ムキムキ永続+1。 | はたらきぶりをみとめられ、むきむきえいぞく+1。 | Your effort was recognized and turned into a stronger result. Permanent Strength +1. |
| src/services/eventService.ts:900 | resultLog | 給食当番ポイントで50G相当の報酬を得た。 | きゅうしょくとうばんぽいんとで50Gそうとうのほうしゅうをえた。 | Your effort paid off and earned a useful reward. |
| src/services/eventService.ts:903 | resultLog | 重い食缶を運んで腰を痛めた。HP-6。 | おもいしょっかんをはこんでこしをいためた。HP-6。 | The physical effort sharpened your rhythm and confidence. Lost 6 HP. |
| src/services/eventService.ts:906 | label | きっぱり譲る | きっぱりゆずる | Give it up cleanly |
| src/services/eventService.ts:906 | text | 今回は我慢して次に備える | こんかいはがまんしてつぎにそなえる | Hold back this time and prepare for next time |
| src/services/eventService.ts:910 | resultLog | 潔さが評価され、最大HP+2。 | きよしさがひょうかされ、さいだいHP+2。 | Your effort was recognized and turned into a stronger result. Increase max HP by 2. |
| src/services/eventService.ts:915 | resultLog | ジュースをおごる流れになり20G失った。 | じゅーすをおごるながれになり20Gうしなった。 | You handled the moment and carried its outcome into what came next. Lost 20G. |

#### 校庭の野良犬（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:921 | title | 校庭の野良犬 | こうていののらいぬ | Stray Dog in the Schoolyard |
| src/services/eventService.ts:922 | description | 授業中、校庭に野良犬が迷い込んできた！&lt;br&gt;首輪はなく、お腹を空かせているようだ。 | じゅぎょうちゅう、こうていにのらいぬがまよいこんできた！&lt;br&gt;くびわはなく、おはらをあかせているようだ。 | During class, a stray dog wanders into the schoolyard!&lt;br&gt;It has no collar and looks hungry. |
| src/services/eventService.ts:924 | label | 保護する | ほごする | Protect it |
| src/services/eventService.ts:924 | text | 水と飯を用意して見守る | みずとめしをよういしてみまもる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:928 | resultLog | 犬は安心して尻尾を振った。HP全回復。 | いぬはあんしんしてしっぽをふった。HPぜんかいふく。 | The short break helped your body and mind recover. Heal to full HP. |
| src/services/eventService.ts:931 | resultLog | 首輪の落し物を見つけた。45G入手。 | くびわのおとしものをみつけた。45Gにゅうしゅ。 | You noticed the opening and turned it into an advantage. Gained 45G. |
| src/services/eventService.ts:934 | resultLog | 警戒されて噋まれた！HP-9。 | けいかいされてれた！HP-9。 | You handled the moment and carried its outcome into what came next. Lost 9 HP. |
| src/services/eventService.ts:937 | label | じっと観察 | じっとかんさつ | Observe quietly |
| src/services/eventService.ts:937 | text | 距離を保って様子を見る | きょりをたもってようすをみる | Keep your distance and watch |
| src/services/eventService.ts:941 | resultLog | 落ち着きを学び、最大HP+3。 | おちつきをまなび、さいだいHP+3。 | You took a moment to recover and regain your rhythm. Increase max HP by 3. |
| src/services/eventService.ts:947 | resultLog | 緊張で手が震えた。状態異常カード追加。 | きんちょうでてがふるえた。じょうたいいじょうカードついか。 | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:950 | label | エサで手なづけ | えさでてなづけ | Tame it with food |
| src/services/eventService.ts:950 | text | パンをみせて信頼を得る | ぱんをみせてしんらいをえる | Show bread and earn its trust |
| src/services/eventService.ts:955 | resultLog | なついてきた。お礼の薬草でHPポーション入手。 | なついてきた。おれいのやくそうでHPポーションにゅうしゅ。 | You turned the event into a useful tool for the road ahead. Gain a potion. |
| src/services/eventService.ts:958 | resultLog | パンを奪われた。給食費20G消費。 | ぱんをうばわれた。きゅうしょくひ20Gしょうひ。 | You found a small reward and put the extra money to use. |
| src/services/eventService.ts:961 | resultLog | 近づきすぎてひっかかれた。HP-6。 | ちかづきすぎてひっかかれた。HP-6。 | The risky choice backfired and left you with a setback. Lost 6 HP. |
| src/services/eventService.ts:964 | label | 通報する | つうほうする | Report it |
| src/services/eventService.ts:964 | text | 見回り先生を呼ぶ | みまわりせんせいをよぶ | Call the patrol teacher |
| src/services/eventService.ts:968 | resultLog | 無事保護に成功。感謝の謝礼60G。 | ぶじほごにせいこう。かんしゃのしゃれい60G。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:970 | resultLog | 連絡が遅れ、犬はどこかに去った。 | れんらくがおくれ、いぬはどこかにさった。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:973 | resultLog | 待ち時間に足をひねった。HP-5。 | まちじかんにあしをひねった。HP-5。 | The risky choice backfired and left you with a setback. Lost 5 HP. |

#### 謎の転校生（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:979 | title | 謎の転校生 | なぞのてんこうせい | Mysterious Transfer Student |
| src/services/eventService.ts:980 | description | 「ねえ、君のそのカード、僕のと交換しない？」&lt;br&gt;見たことのないカードを持っている。 | 「ねえ、きみのそのカード、ぼくのとこうかんしない？」&lt;br&gt;みたことのないカードをもっている。 | "Hey, want to trade that card of yours for mine?"&lt;br&gt;They are holding a card you have never seen. |
| src/services/eventService.ts:982 | label | 交換に応じる | こうかんにおうじる | Accept the trade |
| src/services/eventService.ts:982 | text | カードを差し出して対価を受け取る | カードをさしだしてたいかをうけとる | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:1000 | resultLog | 交換大成功！「あかり」を渡し「あかり」を入手。 | こうかんだいせいこう！「あかり」をわたし「あかり」をにゅうしゅ。 | Your effort was recognized and turned into a stronger result. Obtained "Item". |
| src/services/eventService.ts:1002 | resultLog | 交換成立。「あかり」を受け取った。 | こうかんせいりつ。「あかり」をうけとった。 | Trade complete. Received "Akari". |
| src/services/eventService.ts:1004 | resultLog | 交換の代償で混乱した。状態異常カードも追加された。 | こうかんのだいしょうでこんらんした。じょうたいいじょうカードもついかされた。 | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:1007 | label | 断る | ことわる | Refuse the offer |
| src/services/eventService.ts:1007 | text | リスクを避けて静観する | りすくをさけてせいかんする | Avoid the Risk and Watch Quietly |
| src/services/eventService.ts:1011 | resultLog | 警戒した判断が当たった。HP+10。 | けいかいしたはんだんがあたった。HP+10。 | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:1016 | resultLog | 去り際に財布を抜かれた。30G失った。 | さりさいにさいふをぬかれた。30Gうしなった。 | The opportunity produced a practical reward. Lost 30G. |
| src/services/eventService.ts:1019 | label | 情報を聞き出す | じょうほうをききだす | Ask for Information |
| src/services/eventService.ts:1019 | text | 相手の目的を探る | あいてのもくてきをさぐる | Investigate Their Motives |
| src/services/eventService.ts:1024 | resultLog | 有益な情報と引き換えにエナジーポーションを得た。 | ゆうえきなじょうほうとひきかえにえなじーポーションをえた。 | You turned the event into a useful tool for the road ahead. Gain a potion. |
| src/services/eventService.ts:1027 | resultLog | 秘密を売ってくれた。45G相当の価値を得た。 | ひみつをうってくれた。45Gそうとうのかちをえた。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1030 | resultLog | はぐらかされて疲弊。HP-7。 | はぐらかされてひへい。HP-7。 | The risky choice backfired and left you with a setback. Lost 7 HP. |
| src/services/eventService.ts:1033 | label | モノマネ対決 | ものまねたいけつ | Imitation contest |
| src/services/eventService.ts:1033 | text | 転校生の口調を完コピして笑いを取りに行く | てんこうせいのくちょうをかんこぴしてわらいをとりにいく | Transfer Student |
| src/services/eventService.ts:1037 | resultLog | 大ウケ！場の主導権を握り、ムキムキ永続+1。 | だいうけ！ばのしゅどうけんをにぎり、むきむきえいぞく+1。 | Your effort was recognized and turned into a stronger result. Permanent Strength +1. |
| src/services/eventService.ts:1040 | resultLog | 投げ銭が飛んできた。60G入手。 | なげせんがとんできた。60Gにゅうしゅ。 | Your effort paid off and earned a useful reward. Gained 60G. |
| src/services/eventService.ts:1043 | resultLog | 空気が凍って黒歴史化…呪い「後悔」を受けた。 | くうきがこごってくろれきしか…のろい「こうかい」をうけた。 | The air froze and the moment became a dark memory... You received the curse "Regret". |

#### 席替え（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1049 | title | 席替え | せきがえ | Seat Change |
| src/services/eventService.ts:1050 | description | 今日は席替えの日だ。窓際の一番後ろになれるか...？&lt;br&gt;それとも最前列か。 | きょうはせきがえのひだ。まどぎわのいちばんうしろになれるか...？&lt;br&gt;それともさいぜんれつか。 | Today is seat-change day. Can you get the back seat by the window...?&lt;br&gt;Or will you end up in the front row? |
| src/services/eventService.ts:1052 | label | くじ引きに賭ける | くじひきにかける | Bet on the lottery draw |
| src/services/eventService.ts:1052 | text | 運試し（HP+4 / 35G / HP-6） | うんだめし（HP+4 / 35G / HP-6） | Test Your Luck (Heal 4 HP / Gain 35G / Lose 6 HP) |
| src/services/eventService.ts:1056 | resultLog | 神引き！窓際の特等席を確保した。&lt;br&gt;最大HPと現在HPが4増えた。 | かみひき！まどぎわのとくとうせきをかくほした。&lt;br&gt;さいだいHPとげんざいHPが4ふえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP and current HP +4. |
| src/services/eventService.ts:1059 | resultLog | 悪くない席だ。机の中から封筒を見つけ、35G手に入れた。 | わるくないせきだ。つくえのなかからふうとうをみつけ、35Gてにいれた。 | You noticed the opening and turned it into an advantage. Gained 35G. |
| src/services/eventService.ts:1062 | resultLog | 最前列のど真ん中。緊張で胃が痛い...&lt;br&gt;HPが6減った。 | さいぜんれつのどまんなか。きんちょうでいがいたい...&lt;br&gt;HPが6へった。 | The risky choice backfired and left you with a setback.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:1065 | label | 先生に相談する | せんせいにそうだんする | Ask the teacher for advice |
| src/services/eventService.ts:1065 | text | 学習効率調整（カード2枚強化 / HP+8） | がくしゅうこうりつちょうせい（カード2まいきょうか / HP+8） | Study Efficiency Adjustment (Upgrade 2 cards / Heal 8 HP) |
| src/services/eventService.ts:1074 | resultLog | 配慮してもらい、集中できる席に。&lt;br&gt;カードを2枚強化した。 | はいりょしてもらい、しゅうちゅうできるせきに。&lt;br&gt;カードを2まいきょうかした。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:1077 | resultLog | 先生が優しく声をかけてくれた。&lt;br&gt;HPが8回復した。 | せんせいがやさしくこえをかけてくれた。&lt;br&gt;HPが8かいふくした。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Healed 8 HP. |
| src/services/eventService.ts:1079 | resultLog | 相談したが、席はそのままだった。 | そうだんしたが、せきはそのままだった。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1082 | label | 荷物を片付ける | にもつをかたづける | You cleared away something unnecessary and made room to move forward. |
| src/services/eventService.ts:1082 | text | 準備を整える（ポーション / 恒久ムキムキ+1 / 呪い） | じゅんびをととのえる（ポーション / こうきゅうむきむき+1 / のろい） | Preparation (Gain a potion / permanentStrength and 1 / Receive a curse) |
| src/services/eventService.ts:1087 | resultLog | 忘れ物の中にエナジーポーションを発見した。 | わすれもののなかにえなじーポーションをはっけんした。 | You turned the event into a useful tool for the road ahead. Gain a potion. |
| src/services/eventService.ts:1090 | resultLog | 机を運んで汗だくに。筋力がつき、恒久ムキムキ+1。 | つくえをはこんであせだくに。きんりょくがつき、こうきゅうむきむき+1。 | The physical effort sharpened your rhythm and confidence. Permanent Strength +1. |
| src/services/eventService.ts:1093 | resultLog | 古いプリントのホコリで目が回る...&lt;br&gt;呪いカードを1枚受け取った。 | ふるいぷりんとのほこりでめがまわる...&lt;br&gt;のろいカードを1まいうけとった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received 1 curse card. |
| src/services/eventService.ts:1096 | label | 席を譲る | せきをゆずる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1096 | text | 徳を積む（50G / HP+6 / 20G） | とくをつむ（50G / HP+6 / 20G） | Build Virtue (Gain 50G / Heal 6 HP / Gain 20G) |
| src/services/eventService.ts:1100 | resultLog | お礼に売店券をもらった。50G獲得。 | おれいにばいてんけんをもらった。50Gかくとく。 | You found a small reward and put the extra money to use. Gained 50G. |
| src/services/eventService.ts:1103 | resultLog | 気分が晴れて体が軽い。&lt;br&gt;HPが6回復した。 | きぶんがはれてからだがかるい。&lt;br&gt;HPが6かいふくした。 | The short break helped your body and mind recover.&lt;br&gt;Healed 6 HP. |
| src/services/eventService.ts:1106 | resultLog | いいことをしたはずが、財布を落とした...&lt;br&gt;20G失った。 | いいことをしたはずが、さいふをおとした...&lt;br&gt;20Gうしなった。 | The opportunity produced a practical reward.&lt;br&gt;You handled the moment and carried its outcome into what came next. Lost 0G. |

#### 避難訓練（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1112 | title | 避難訓練 | ひなんくんれん | Evacuation Drill |
| src/services/eventService.ts:1113 | description | ジリリリリ！非常ベルが鳴り響く。「お・か・し」を守って避難しよう。 | じりりりり！ひじょうべるがなりひびく。「お・か・し」をまもってひなんしよう。 | Rrrrring! The emergency bell blares. Evacuate while following the safety rules. |
| src/services/eventService.ts:1115 | label | 先頭で誘導する | せんとうでゆうどうする | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:1115 | text | リーダー行動（最大HP+3 / カード1枚強化 / HP-5） | りーだーこうどう（さいだいHP+3 / カード1まいきょうか / HP-5） | Leader Action (Increase max HP by 3 / Upgrade 1 cards / Lose 5 HP) |
| src/services/eventService.ts:1119 | resultLog | 落ち着いた誘導でみんなを救った。&lt;br&gt;最大HPと現在HPが3増えた。 | おちついたゆうどうでみんなをすくった。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:1132 | resultLog | 避難導線を完璧に把握した。&lt;br&gt;「あかり」が強化された。 | ひなんどうせんをかんぺきにはあくした。&lt;br&gt;「あかり」がきょうかされた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:1137 | resultLog | 走り回って息切れした。&lt;br&gt;HPが5減った。 | はしりまわっていきぎれした。&lt;br&gt;HPが5へった。 | You moved through the situation cleanly and kept the momentum going.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:1140 | label | 防災袋を点検する | ぼうさいふくろをてんけんする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1140 | text | 備えを確認（ポーション / 30G / 呪い） | そなえをかくにん（ポーション / 30G / のろい） | Check Preparations (Gain a potion / Gain 30G / Receive a curse) |
| src/services/eventService.ts:1145 | resultLog | 防災袋に良い薬が入っていた。&lt;br&gt;ポーションを1つ入手。 | ぼうさいふくろによいくすりがいっっていた。&lt;br&gt;ポーションを1つにゅうしゅ。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gain a potion. |
| src/services/eventService.ts:1148 | resultLog | 備品整理の謝礼を受け取った。&lt;br&gt;30G獲得。 | びひんせいりのしゃれいをうけとった。&lt;br&gt;30Gかくとく。 | Your helpful action was noticed, and you received thanks in return.&lt;br&gt;Gained 30G. |
| src/services/eventService.ts:1151 | resultLog | 古い非常食でお腹を壊した...&lt;br&gt;呪いカードを1枚受け取った。 | ふるいひじょうしょくでおはらをこわした...&lt;br&gt;のろいカードを1まいうけとった。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received 1 curse card. |
| src/services/eventService.ts:1154 | label | 放送に従って避難 | ほうそうにしたがってひなん | You moved through the situation cleanly and kept the momentum going. |
| src/services/eventService.ts:1154 | text | 基本重視（カード削除 / HP+8） | きほんじゅうし（カードさくじょ / HP+8） | Choose Option (Remove 1 card / Heal 8 HP) |
| src/services/eventService.ts:1169 | resultLog | 手順通りに動き、ムダが消えた。&lt;br&gt;「あかり」を取り除いた。 | てじゅんとおりにうごき、むだがきえた。&lt;br&gt;「あかり」をとりのぞいた。 | Turning the situation into a plan made the next step easier to take.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1174 | resultLog | 混乱せず行動できた。&lt;br&gt;HPが8回復した。 | こんらんせずこうどうできた。&lt;br&gt;HPが8かいふくした。 | The risky choice backfired and left you with a setback.&lt;br&gt;Healed 8 HP. |
| src/services/eventService.ts:1179 | label | 非常ベルのモノマネ | ひじょうべるのものまね | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1179 | text | 奇想天外（50G / 恒久ムキムキ+1 / 呪い「恥」） | きそうてんがい（50G / こうきゅうむきむき+1 / のろい「はじ」） | Wild Idea (Gain 50G / permanentStrength and 1 / Receive the curse "Embarrassment") |
| src/services/eventService.ts:1183 | resultLog | 完璧な再現で拍手喝采！&lt;br&gt;余興代として50G獲得。 | かんぺきなさいげんではくしゅかっさい！&lt;br&gt;よきょうだいとして50Gかくとく。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained 50G. |
| src/services/eventService.ts:1186 | resultLog | 全力発声で体幹が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | ぜんりょくはっせいでたいかんがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:1189 | resultLog | 先生に止められた。気まずすぎる...&lt;br&gt;呪い「恥」を受けた。 | せんせいにやめられた。きまずすぎる...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### プール開き（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1195 | title | プール開き | ぷーるひらき | Pool Opening |
| src/services/eventService.ts:1196 | description | 待ちに待ったプール開きだ！&lt;br&gt;しかし水は冷たそうだ。 | まちにまったぷーるひらきだ！&lt;br&gt;しかしみずはつめたそうだ。 | The long-awaited pool opening is here!&lt;br&gt;But the water looks cold. |
| src/services/eventService.ts:1198 | label | 飛び込んで泳ぐ | とびこんでおよぐ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1198 | text | 水に挑む（全回復 / HP+12 / 呪い） | みずにいどむ（ぜんかいふく / HP+12 / のろい） | Challenge the Water (Heal to full HP. / Heal 12 HP / Receive a curse) |
| src/services/eventService.ts:1202 | resultLog | 思い切って飛び込んだ！&lt;br&gt;全身が目覚め、HPが全回復。 | おもいきってとびこんだ！&lt;br&gt;ぜんしんがめざめ、HPがぜんかいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;The short break helped your body and mind recover. Heal to full HP. |
| src/services/eventService.ts:1205 | resultLog | 冷水で気合いが入った。&lt;br&gt;HPが12回復した。 | ひやみずできあいがはいった。&lt;br&gt;HPが12かいふくした。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Healed 12 HP. |
| src/services/eventService.ts:1208 | resultLog | 体は冷え切り、風邪気味に...&lt;br&gt;呪い「虫歯(腐敗)」を受けた。 | からだはひえきり、かぜぎみに...&lt;br&gt;のろい「むしば(ふはい)」をうけた。 | The short break helped your body and mind recover.&lt;br&gt;Received the curse "Decay( )". |
| src/services/eventService.ts:1211 | label | 水中トレーニング | すいちゅうとれーにんぐ | Underwater Training |
| src/services/eventService.ts:1211 | text | 鍛錬（恒久ムキムキ+1 / カード2枚強化 / HP-6） | たんれん（こうきゅうむきむき+1 / カード2まいきょうか / HP-6） | Training (permanentStrength and 1 / Upgrade 2 cards / Lose 6 HP) |
| src/services/eventService.ts:1215 | resultLog | 水の抵抗で筋力が伸びた。&lt;br&gt;恒久ムキムキ+1。 | みずのていこうできんりょくがのびた。&lt;br&gt;こうきゅうむきむき+1。 | The physical effort sharpened your rhythm and confidence.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:1223 | resultLog | 泳法を研究し、技術が洗練された。&lt;br&gt;カードを2枚強化した。 | えいほうをけんきゅうし、ぎじゅつがせんれんされた。&lt;br&gt;カードを2まいきょうかした。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:1226 | resultLog | 張り切りすぎて脚をつった。&lt;br&gt;HPが6減った。 | はりきりすぎてあしをつった。&lt;br&gt;HPが6へった。 | The physical effort sharpened your rhythm and confidence.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:1229 | label | 見学して作戦会議 | けんがくしてさくせんかいぎ | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:1229 | text | 冷静判断（カード削除 / 40G） | れいせいはんだん（カードさくじょ / 40G） | Choose Option (Remove 1 card / Gain 40G) |
| src/services/eventService.ts:1244 | resultLog | 泳がず観察し、無駄を削った。&lt;br&gt;「あかり」を取り除いた。 | およがずかんさつし、むだをけずった。&lt;br&gt;「あかり」をとりのぞいた。 | Seeing the situation from a new angle gave you a useful perspective.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1249 | resultLog | 監視係のバイト代をもらった。&lt;br&gt;40G獲得。 | かんしかかりのばいとかをもらった。&lt;br&gt;40Gかくとく。 | You found a small reward and put the extra money to use.&lt;br&gt;Gained 40G. |
| src/services/eventService.ts:1254 | label | 一人シンクロ百人分 | ひとりしんくろひゃくにんふん | players players |
| src/services/eventService.ts:1254 | text | 奇想天外（80G / 最大HP+5 / 呪い「恥」） | きそうてんがい（80G / さいだいHP+5 / のろい「はじ」） | Wild Idea (Gain 80G / Increase max HP by 5 / Receive the curse "Embarrassment") |
| src/services/eventService.ts:1258 | resultLog | 伝説の演目になった。観客から80Gの投げ銭！ | でんせつのえんもくになった。かんきゃくから80Gのなげせん！ | Your performance became legendary. The audience tossed you 80G in tips! |
| src/services/eventService.ts:1261 | resultLog | 完泳して達成感MAX！&lt;br&gt;最大HPと現在HPが5増えた。 | かんえいしてたっせいかんMAX！&lt;br&gt;さいだいHPとげんざいHPが5ふえた。 | You finished the swim and felt maximum achievement!&lt;br&gt;Max HP and current HP +5. |
| src/services/eventService.ts:1264 | resultLog | 終盤で足がつり、盛大に沈んだ...&lt;br&gt;呪い「恥」を受けた。 | しゅうばんであしがつり、せいだいにしずんだ...&lt;br&gt;のろい「はじ」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Embarrassment". |

#### 修学旅行の積立金（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1270 | title | 修学旅行の積立金 | しゅうがくりょこうのつみたてきん | School Trip Savings |
| src/services/eventService.ts:1271 | description | 集金袋を拾った。中にはお金が入っている。 | しゅうきんぶくろをひろった。なかにはおきんがいっっている。 | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:1273 | label | 職員室に届ける | しょくいんしつにとどける | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:1273 | text | 正攻法（レリック / 60G） | せいこうほう（おたから / 60G） | Straightforward Plan (Gain a relic / Gain 60G) |
| src/services/eventService.ts:1280 | resultLog | 正直者は報われる。&lt;br&gt;先生から「図書カード」をもらった！ | しょうじきものはむくわれる。&lt;br&gt;せんせいから「としょカード」をもらった！ | Your careful choice helped someone and improved the situation.&lt;br&gt;You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:1283 | resultLog | 落とし主から謝礼を受け取った。&lt;br&gt;60G獲得。 | おとししゅからしゃれいをうけとった。&lt;br&gt;60Gかくとく。 | Your helpful action was noticed, and you received thanks in return.&lt;br&gt;Gained 60G. |
| src/services/eventService.ts:1285 | resultLog | 無事に届けた。誰にも気づかれなかったが、胸は晴れた。 | ぶじにとどけた。だれにもきづかれなかったが、むねははれた。 | Facing the feeling directly helped your mind settle. |
| src/services/eventService.ts:1288 | label | 落とし主を探す | おとししゅをさがす | The mishap left a mark and cost you momentum. |
| src/services/eventService.ts:1288 | text | 奔走する（カード1枚強化 / HP+8 / HP-6） | ほんそうする（カード1まいきょうか / HP+8 / HP-6） | Run Around (Upgrade 1 cards / Heal 8 HP / Lose 6 HP) |
| src/services/eventService.ts:1302 | resultLog | 校内を駆け回った経験が糧に。&lt;br&gt;「あかり」が強化された。 | こうないをかけまわったけいけんがかてに。&lt;br&gt;「あかり」がきょうかされた。 | The experience of running all over the school became fuel for growth.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:1307 | resultLog | 感謝されて心が温まった。&lt;br&gt;HPが8回復した。 | かんしゃされてこころがあたたまった。&lt;br&gt;HPが8かいふくした。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Healed 8 HP. |
| src/services/eventService.ts:1310 | resultLog | 階段を走りすぎてヘトヘトに...&lt;br&gt;HPが6減った。 | かいだんをはしりすぎてへとへとに...&lt;br&gt;HPが6へった。 | You moved through the situation cleanly and kept the momentum going.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:1313 | label | ネコババする | ねこばばする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1313 | text | 強欲ルート（150G / 90G+呪い / 30G） | ごうよくるーと（150G / 90G+のろい / 30G） | Greedy Route (Gain 150G / Gain 90G and receive a curse / Gain 30G) |
| src/services/eventService.ts:1317 | resultLog | 誰にも見られていない。150Gを手に入れた。 | だれにもみられていない。150Gをてにいれた。 | No one saw you. You gained 150G. |
| src/services/eventService.ts:1326 | resultLog | 大金は得たが罪悪感が残る...&lt;br&gt;90G獲得し、呪い「後悔」を受けた。 | たいきんはえたがざいあくかんがのこる...&lt;br&gt;90Gかくとくし、のろい「こうかい」をうけた。 | large amount of money gained...&lt;br&gt;90G gained, curse " Regret ". |
| src/services/eventService.ts:1329 | resultLog | 中身は思ったより少なかった。&lt;br&gt;30Gだけ手に入った。 | なかみはおもったよりすくなかった。&lt;br&gt;30Gだけてにはいった。 | There was less inside than you expected.&lt;br&gt;You gained only 30G. |
| src/services/eventService.ts:1332 | label | 偽名で落とし物届け | ぎめいでおとしものとどけ | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:1332 | text | 奇策（カード削除 / 恒久ムキムキ+1 / 呪い「恥」） | きさく（カードさくじょ / こうきゅうむきむき+1 / のろい「はじ」） | Unusual Plan (Remove 1 card / permanentStrength and 1 / Receive the curse "Embarrassment") |
| src/services/eventService.ts:1347 | resultLog | 身元不明の英雄として語られた。&lt;br&gt;「あかり」を取り除いた。 | みもとふめいのえいゆうとしてかたられた。&lt;br&gt;「あかり」をとりのぞいた。 | You were spoken of as an unidentified hero.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1352 | resultLog | 謎の行動力で肝が据わった。&lt;br&gt;恒久ムキムキ+1。 | なぞのこうどうりょくできもがすわった。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:1355 | resultLog | 筆跡でバレた！&lt;br&gt;呪い「恥」を受けた。 | ひっせきでばれた！&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 魔の掃除時間（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1361 | title | 魔の掃除時間 | まのそうじじかん | Cursed Cleaning Time |
| src/services/eventService.ts:1362 | description | 廊下のワックスがけの時間だ。&lt;br&gt;ツルツル滑る床は危険だが、滑れば速く移動できるかも？ | ろうかのわっくすがけのじかんだ。&lt;br&gt;つるつるすべるとこはきけんだが、すべればはやくいどうできるかも？ | It is time to wax the hallway.&lt;br&gt;The slick floor is dangerous, but sliding might let you move faster. |
| src/services/eventService.ts:1364 | label | 滑走ルートを開拓 | かっそうるーとをかいたく | You moved through the situation cleanly and kept the momentum going. |
| src/services/eventService.ts:1364 | text | 攻める掃除（カード強化 / 70G / HP-5） | せめるそうじ（カードきょうか / 70G / HP-5） | Aggressive Cleaning (Upgrade 1 card / Gain 70G / Lose 5 HP) |
| src/services/eventService.ts:1378 | resultLog | 華麗に滑ってコツを掴んだ。&lt;br&gt;「あかり」が強化された。 | かれいにすべってこつをつかんだ。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:1383 | resultLog | 滑走ショーが話題に。イベント出演料70Gを獲得。 | かっそうしょーがわだいに。いべんとしゅつえんりょう70Gをかくとく。 | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:1386 | resultLog | 勢い余って大転倒...&lt;br&gt;HPが5減った。 | いきおいあまってだいてんとう...&lt;br&gt;HPが5へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:1389 | label | 黙々と磨く | もくもくとみがく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1389 | text | 堅実ルート（カード削除 / HP+10） | けんじつるーと（カードさくじょ / HP+10） | Steady Route (Remove 1 card / Heal 10 HP) |
| src/services/eventService.ts:1404 | resultLog | 床と一緒に迷いも磨かれた。&lt;br&gt;「あかり」を取り除いた。 | とこといっしょにまよいもみがかれた。&lt;br&gt;「あかり」をとりのぞいた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1409 | resultLog | 掃除後の達成感で元気が戻る。&lt;br&gt;HPが10回復した。 | そうじのちのたっせいかんでげんきがもどる。&lt;br&gt;HPが10かいふくした。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Healed 10 HP. |
| src/services/eventService.ts:1411 | resultLog | 完璧に磨いた。見返りはないが気分はいい。 | かんぺきにみがいた。みかえりはないがきぶんはいい。 | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:1414 | label | バケツリレーを組む | ばけつりれーをくむ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1414 | text | 連携重視（恒久ムキムキ+1 / ポーション / 呪い） | れんけいじゅうし（こうきゅうむきむき+1 / ポーション / のろい） | Teamwork Focus (permanentStrength and 1 / Gain a potion / Receive a curse) |
| src/services/eventService.ts:1418 | resultLog | 連携作業で体が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | れんけいさぎょうでからだがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:1422 | resultLog | 先生がご褒美にポーションをくれた。 | せんせいがごほうびにポーションをくれた。 | You turned the event into a useful tool for the road ahead. Gain a potion. |
| src/services/eventService.ts:1425 | resultLog | 水をかぶって頭が真っ白に...&lt;br&gt;呪いカードを1枚受け取った。 | みずをかぶってあたまがまっしろに...&lt;br&gt;のろいカードを1まいうけとった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received 1 curse card. |
| src/services/eventService.ts:1428 | label | 廊下スケート大会開催 | ろうかすけーとたいかいかいさい | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1428 | text | 奇想天外（最大HP+4 / 90G / 呪い「後悔」） | きそうてんがい（さいだいHP+4 / 90G / のろい「こうかい」） | Wild Idea (Increase max HP by 4 / Gain 90G / Receive the curse "Regret") |
| src/services/eventService.ts:1432 | resultLog | 大会を完走！&lt;br&gt;最大HPと現在HPが4増えた。 | たいかいをかんそう！&lt;br&gt;さいだいHPとげんざいHPが4ふえた。 | You moved through the situation cleanly and kept the momentum going.&lt;br&gt;Max HP and current HP +4. |
| src/services/eventService.ts:1435 | resultLog | 観客が集まり、参加費で90G稼いだ。 | かんきゃくがあつまり、さんかひで90Gかせいだ。 | The opportunity produced a practical reward. Gained 90G. |
| src/services/eventService.ts:1438 | resultLog | 校長に見つかった...&lt;br&gt;呪い「後悔」を受けた。 | こうちょうにみつかった...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |

#### 運命のテスト返却（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1444 | title | 運命のテスト返却 | うんめいのてすとへんきゃく | Fateful Test Return |
| src/services/eventService.ts:1445 | description | 今日は算数のテストが返却される日だ。&lt;br&gt;自信はあるか？ | きょうはさんすうのてすとがへんきゃくされるひだ。&lt;br&gt;じしんはあるか？ | You handled the moment and carried its outcome into what came next.&lt;br&gt;The experience strengthened your resolve and helped you grow. |
| src/services/eventService.ts:1447 | label | 堂々と受け取る | どうどうとうけとる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1447 | text | 正面突破（100G / カード1枚強化 / HP-10） | しょうめんとっぱ（100G / カード1まいきょうか / HP-10） | Frontal Breakthrough (Gain 100G / Upgrade 1 cards / Lose 10 HP) |
| src/services/eventService.ts:1451 | resultLog | 100点満点！&lt;br&gt;お祝いに100Gをもらった。 | 100てんまんてん！&lt;br&gt;おいわいに100Gをもらった。 | A perfect score!&lt;br&gt;You received 100G as a celebration. |
| src/services/eventService.ts:1464 | resultLog | 結果は平凡だが学びは大きい。&lt;br&gt;「あかり」が強化された。 | けっかはへいぼんだがまなびはおおきい。&lt;br&gt;「あかり」がきょうかされた。 | The result was ordinary, but the lesson was substantial.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:1469 | resultLog | 名前の記入漏れで0点...&lt;br&gt;精神的ダメージでHPが10減った。 | なまえのきにゅうもれで0てん...&lt;br&gt;せいしんてきだめーじでHPが10へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;The risky choice backfired and left you with a setback. |
| src/services/eventService.ts:1472 | label | 再採点をお願いする | さいさいてんをおねがいする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1472 | text | 交渉（カード削除 / 50G / 呪い「後悔」） | こうしょう（カードさくじょ / 50G / のろい「こうかい」） | Negotiation (Remove 1 card / Gain 50G / Receive the curse "Regret") |
| src/services/eventService.ts:1487 | resultLog | 粘り勝ちで評価が見直された。&lt;br&gt;「あかり」を取り除いた。 | ねばりかちでひょうかがみなおされた。&lt;br&gt;「あかり」をとりのぞいた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1492 | resultLog | 努力が認められ、特別奨励金50Gを獲得。 | どりょくがみとめられ、とくべつしょうれいきん50Gをかくとく。 | effort, special 50G gained. |
| src/services/eventService.ts:1495 | resultLog | 強引すぎて先生を怒らせた...&lt;br&gt;呪い「後悔」を受けた。 | ごういんすぎてせんせいをいからせた...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |
| src/services/eventService.ts:1498 | label | 答案を封印する | とうあんをふういんする | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:1498 | text | 現実逃避（HP+20 / 恒久ムキムキ+1 / 呪い「恥」） | げんじつとうひ（HP+20 / こうきゅうむきむき+1 / のろい「はじ」） | Choose Option (Heal 20 HP / permanentStrength and 1 / Receive the curse "Embarrassment") |
| src/services/eventService.ts:1502 | resultLog | いったん忘れて深呼吸。気持ちが整った。&lt;br&gt;HPが20回復。 | いったんわすれてしんこきゅう。きもちがととのった。&lt;br&gt;HPが20かいふく。 | The short break helped your body and mind recover.&lt;br&gt;Heal 20 HP. |
| src/services/eventService.ts:1505 | resultLog | 答案を握りしめる握力で鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | とうあんをにぎりしめるあくりょくできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The study moment clarified what you needed to understand next.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:1508 | resultLog | 封印は破られた。クラス中に結果が拡散...&lt;br&gt;呪い「恥」を受けた。 | ふういんはやぶられた。くらすなかにけっかがかくさん...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:1511 | label | 未来の自分に採点させる | みらいのじぶんにさいてんさせる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1511 | text | 奇想天外（レリック / 120G / HP-8） | きそうてんがい（おたから / 120G / HP-8） | Wild Idea (Gain a relic / Gain 120G / Lose 8 HP) |
| src/services/eventService.ts:1518 | resultLog | 時空を超えた赤ペン添削！？&lt;br&gt;レリック「放課後の水筒」を得た。 | じくうをこえたあかぺんてんさく！？&lt;br&gt;おたから「ほうかごのすいとう」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "After-School Canteen". |
| src/services/eventService.ts:1521 | resultLog | 未来の投資アドバイスが届いた。&lt;br&gt;120G獲得。 | みらいのとうしあどばいすがとどいた。&lt;br&gt;120Gかくとく。 | You noticed the opening and turned it into an advantage.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:1524 | resultLog | 時間酔いでフラフラに...&lt;br&gt;HPが8減った。 | じかんよいでふらふらに...&lt;br&gt;HPが8へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 8 HP. |

#### 放送室のジャック（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1530 | title | 放送室のジャック | ほうそうしつのじゃっく | Broadcast Room Takeover |
| src/services/eventService.ts:1531 | description | 放送室に誰もいない。マイクの電源が入っている。&lt;br&gt;イタズラするチャンス？ | ほうそうしつにだれもいない。まいくのでんげんがいっっている。&lt;br&gt;いたずらするちゃんす？ | No one is in the broadcast room. The microphone is on.&lt;br&gt;Is this a chance for a prank? |
| src/services/eventService.ts:1533 | label | 校内ラジオを始める | こうないらじおをはじめる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1533 | text | 番組進行（最大HP+4 / 80G / HP-6） | ばんぐみしんこう（さいだいHP+4 / 80G / HP-6） | Class (Increase max HP by 4 / Gain 80G / Lose 6 HP) |
| src/services/eventService.ts:1537 | resultLog | 神トークで人気爆発。&lt;br&gt;最大HPと現在HPが4増えた。 | かみとーくでにんきばくはつ。&lt;br&gt;さいだいHPとげんざいHPが4ふえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Max HP and current HP +4. |
| src/services/eventService.ts:1540 | resultLog | スポンサー(購買部)がついた。&lt;br&gt;80G獲得。 | すぽんさー(こうばいぶ)がついた。&lt;br&gt;80Gかくとく。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained 80G. |
| src/services/eventService.ts:1543 | resultLog | 緊張で喉を痛めた...&lt;br&gt;HPが6減った。 | きんちょうでのどをいためた...&lt;br&gt;HPが6へった。 | The risky choice backfired and left you with a setback.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:1546 | label | リクエスト曲を流す | りくえすときょくをながす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1546 | text | 空気づくり（カード1枚強化 / HP+10） | くうきづくり（カード1まいきょうか / HP+10） | Choose Option (Upgrade 1 cards / Heal 10 HP) |
| src/services/eventService.ts:1560 | resultLog | 選曲が完璧だった。&lt;br&gt;「あかり」が強化された。 | せんきょくがかんぺきだった。&lt;br&gt;「あかり」がきょうかされた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:1565 | resultLog | 音楽で気持ちが整った。&lt;br&gt;HPが10回復した。 | おんがくできもちがととのった。&lt;br&gt;HPが10かいふくした。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Healed 10 HP. |
| src/services/eventService.ts:1570 | label | 校長のモノマネ演説 | こうちょうのものまねえんぜつ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1570 | text | 賭け（120G / 恒久ムキムキ+1 / 呪い「後悔」） | かけ（120G / こうきゅうむきむき+1 / のろい「こうかい」） | Gamble (Gain 120G / permanentStrength and 1 / Receive the curse "Regret") |
| src/services/eventService.ts:1574 | resultLog | 大爆笑で配信収益化。&lt;br&gt;120G獲得。 | だいばくしょうではいしんしゅうえきか。&lt;br&gt;120Gかくとく。 | The opportunity produced a practical reward.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:1577 | resultLog | 腹式呼吸が極まり、恒久ムキムキ+1。 | ふくしきこきゅうがきわまり、こうきゅうむきむき+1。 | The short break helped your body and mind recover. Permanent Strength +1. |
| src/services/eventService.ts:1580 | resultLog | 本人登場で終了...&lt;br&gt;呪い「後悔」を受けた。 | ほんにんとうじょうでしゅうりょう...&lt;br&gt;のろい「こうかい」をうけた。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Received the curse "Regret". |
| src/services/eventService.ts:1583 | label | 深夜ラジオ風に一人二役 | しんやらじおかぜにひとりにやく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1583 | text | 奇想天外（レリック / カード削除 / 呪い「恥」） | きそうてんがい（おたから / カードさくじょ / のろい「はじ」） | Wild Idea (Gain a relic / Remove 1 card / Receive the curse "Embarrassment") |
| src/services/eventService.ts:1590 | resultLog | 伝説回になった。&lt;br&gt;レリック「スマイルシール」を得た。 | でんせつかいになった。&lt;br&gt;おたから「すまいるしーる」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Smile Sticker". |
| src/services/eventService.ts:1604 | resultLog | 喋っているうちに悩みが一つ消えた。&lt;br&gt;「あかり」を取り除いた。 | しゃべっているうちになやみがひとつきえた。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1609 | resultLog | 録音が全校配信された...&lt;br&gt;呪い「恥」を受けた。 | ろくおんがぜんこうはいしんされた...&lt;br&gt;のろい「はじ」をうけた。 | sound the whole school broadcast...&lt;br&gt;Received the curse "Embarrassment". |

#### 理科室の人体模型（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1615 | title | 理科室の人体模型 | りかしつのじんたいもけい | Science Room Anatomy Model |
| src/services/eventService.ts:1616 | description | 夜の理科室。人体模型が動いている気がする。&lt;br&gt;「心臓ヲ...クレ...」と聞こえた。 | よるのりかしつ。じんたいもけいがうごいているきがする。&lt;br&gt;「しんぞうを...くれ...」ときこえた。 | The science room at night. The anatomy model seems to move.&lt;br&gt;You hear it whisper, "Give me... a heart..." |
| src/services/eventService.ts:1618 | label | 交渉して分ける | こうしょうしてわける | Negotiate and share it |
| src/services/eventService.ts:1618 | text | 取引（レリック+HP-10 / 80G / HP-6） | とりひき（おたから+HP-10 / 80G / HP-6） | Deal (Gain a relic and lose 10 HP / Gain 80G / Lose 6 HP) |
| src/services/eventService.ts:1629 | resultLog | 血を分け与えた(HP-10)。&lt;br&gt;礼として「保健室の飴(レリック)」を得た。 | ちをわけあたえた(HP-10)。&lt;br&gt;れいとして「ほけんしつのあめ(おたから)」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained "Infirmary Candy(Relic)". |
| src/services/eventService.ts:1632 | resultLog | 教材費の返金袋を渡された。&lt;br&gt;80G獲得。 | きょうざいひのへんきんふくろをわたされた。&lt;br&gt;80Gかくとく。 | You found a small reward and put the extra money to use.&lt;br&gt;Gained 80G. |
| src/services/eventService.ts:1635 | resultLog | 握手した瞬間に冷たさで凍えた。&lt;br&gt;HPが6減った。 | あくしゅしたしゅんかんにつめたさでこごえた。&lt;br&gt;HPが6へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:1638 | label | 解剖図で論破する | かいぼうずでろんぱする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1638 | text | 知識勝負（カード2枚強化 / HP+8 / 呪い） | ちしきしょうぶ（カード2まいきょうか / HP+8 / のろい） | Choose Option (Upgrade 2 cards / Heal 8 HP / Receive a curse) |
| src/services/eventService.ts:1647 | resultLog | 見事な説明で納得させた。&lt;br&gt;カードを2枚強化した。 | みごとなせつめいでなっとくさせた。&lt;br&gt;カードを2まいきょうかした。 | The study moment clarified what you needed to understand next.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:1650 | resultLog | 知識が自信になった。&lt;br&gt;HPが8回復。 | ちしきがじしんになった。&lt;br&gt;HPが8かいふく。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:1653 | resultLog | 用語を噛んで空気が凍った...&lt;br&gt;呪いカードを1枚受け取った。 | ようごをかんでくうきがこごった...&lt;br&gt;のろいカードを1まいうけとった。 | The study moment clarified what you needed to understand next.&lt;br&gt;Received 1 curse card. |
| src/services/eventService.ts:1656 | label | 全力で逃げる | ぜんりょくでにげる | Strength Run |
| src/services/eventService.ts:1656 | text | 生存優先（カード削除 / HP+6） | せいぞんゆうせん（カードさくじょ / HP+6） | Alive (Remove 1 card / Heal 6 HP) |
| src/services/eventService.ts:1671 | resultLog | 恐怖で一つ記憶が飛んだ。&lt;br&gt;「あかり」を取り除いた。 | きょうふでひとつきおくがとんだ。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1676 | resultLog | 助かった安堵で元気が戻る。&lt;br&gt;HPが6回復。 | たすかったあんどでげんきがもどる。&lt;br&gt;HPが6かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 6 HP. |
| src/services/eventService.ts:1681 | label | 模型に白衣を着せる | もけいにはくいをきせる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1681 | text | 奇想天外（恒久ムキムキ+1 / 120G / 呪い「恥」） | きそうてんがい（こうきゅうむきむき+1 / 120G / のろい「はじ」） | Wild Idea (permanentStrength and 1 / Gain 120G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:1685 | resultLog | 妙に威圧感が増した模型に敬礼。&lt;br&gt;恒久ムキムキ+1。 | みょうにいあつかんがましたもけいにけいれい。&lt;br&gt;こうきゅうむきむき+1。 | Your careful choice helped someone and improved the situation.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:1688 | resultLog | 理科準備室の映え企画として採用された。&lt;br&gt;120G獲得。 | りかじゅんびしつのはえきかくとしてさいようされた。&lt;br&gt;120Gかくとく。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:1691 | resultLog | 朝礼で犯人探しが始まった...&lt;br&gt;呪い「恥」を受けた。 | ちょうれいではんにんさがしがはじまった...&lt;br&gt;のろい「はじ」をうけた。 | Your careful choice helped someone and improved the situation.&lt;br&gt;Received the curse "Embarrassment". |

#### 図書室の静寂（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1697 | title | 図書室の静寂 | としょしつのせいじゃく | Library Silence |
| src/services/eventService.ts:1698 | description | 放課後の図書室はとても静かだ。&lt;br&gt;心地よい眠気が襲ってくる... | ほうかごのとしょしつはとてもしずかだ。&lt;br&gt;ここちよいねむけがおそってくる... | after school the library.&lt;br&gt;The short break helped your body and mind recover. |
| src/services/eventService.ts:1700 | label | 机で仮眠する | つくえでかみんする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1700 | text | 休息（HP+20 / 最大HP+3 / 呪い） | きゅうそく（HP+20 / さいだいHP+3 / のろい） | Rest (Heal 20 HP / Increase max HP by 3 / Receive a curse) |
| src/services/eventService.ts:1704 | resultLog | ぐっすり眠れた。&lt;br&gt;HPが20回復した。 | ぐっすりねむれた。&lt;br&gt;HPが20かいふくした。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Healed 20 HP. |
| src/services/eventService.ts:1707 | resultLog | 深い休息で体力の器が広がった。&lt;br&gt;最大HPと現在HPが3増えた。 | ふかいきゅうそくでたいりょくのうつわがひろがった。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | The short break helped your body and mind recover.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:1710 | resultLog | 寝ぼけて本棚に頭をぶつけた...&lt;br&gt;呪いカードを1枚受け取った。 | ねぼけてほんだなにあたまをぶつけた...&lt;br&gt;のろいカードを1まいうけとった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received 1 curse card. |
| src/services/eventService.ts:1713 | label | 難解な本を読む | なんかいなほんをよむ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1713 | text | 学習（先読み入手 / カード1枚強化 / HP-5） | がくしゅう（さきよみにゅうしゅ / カード1まいきょうか / HP-5） | learning (Read AheadGain / Upgrade 1 cards / Lose 5 HP) |
| src/services/eventService.ts:1717 | resultLog | 新しい視点を得た。&lt;br&gt;「先読み」を習得。 | あたらしいしてんをえた。&lt;br&gt;「さきよみ」をしゅうとく。 | Seeing the situation from a new angle gave you a useful perspective. Learned "Read Ahead". |
| src/services/eventService.ts:1730 | resultLog | 知識が技に結びついた。&lt;br&gt;「あかり」が強化された。 | ちしきがわざにむすびついた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:1735 | resultLog | 難しすぎて頭痛がした...&lt;br&gt;HPが5減った。 | むつかしすぎてずつうがした...&lt;br&gt;HPが5へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:1738 | label | 返却棚を整える | へんきゃくたなをととのえる | Tidying things up also helped clear your mind for the next step. |
| src/services/eventService.ts:1738 | text | 奉仕（カード削除 / 40G） | ほうし（カードさくじょ / 40G） | Service (Remove 1 card / Gain 40G) |
| src/services/eventService.ts:1753 | resultLog | 本を整えて心も整った。&lt;br&gt;「あかり」を取り除いた。 | ほんをととのえてこころもととのった。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1758 | resultLog | 図書委員から謝礼を受け取った。&lt;br&gt;40G獲得。 | としょいいんからしゃれいをうけとった。&lt;br&gt;40Gかくとく。 | Your helpful action was noticed, and you received thanks in return.&lt;br&gt;Gained 40G. |
| src/services/eventService.ts:1763 | label | 朗読を全力でキメる | ろうどくをぜんりょくできめる | Japanese Rodoku Strength |
| src/services/eventService.ts:1763 | text | 奇想天外（120G / 恒久ムキムキ+1 / 呪い「恥」） | きそうてんがい（120G / こうきゅうむきむき+1 / のろい「はじ」） | Wild Idea (Gain 120G / permanentStrength and 1 / Receive the curse "Embarrassment") |
| src/services/eventService.ts:1767 | resultLog | 演劇部にスカウトされ出演料獲得。&lt;br&gt;120G。 | えんげきぶにすかうとされしゅつえんりょうかくとく。&lt;br&gt;120G。 | The opportunity produced a practical reward. Gained 120G. |
| src/services/eventService.ts:1770 | resultLog | 腹から声を出し続けて鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | はらからこえをだしつづけてきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:1773 | resultLog | 静寂を破りすぎて司書に怒られた...&lt;br&gt;呪い「恥」を受けた。 | せいじゃくをやぶりすぎてししょにいかられた...&lt;br&gt;のろい「はじ」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Embarrassment". |

#### 終わらない朝礼（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1779 | title | 終わらない朝礼 | おわらないちょうれい | Endless Morning Assembly |
| src/services/eventService.ts:1780 | description | 校長先生の話が長い...もう30分も続いている。&lt;br&gt;貧血で倒れそうだ。 | こうちょうせんせいのはなしがながい...もう30ふんもつづいている。&lt;br&gt;ひんけつでたおれそうだ。 | The principal's speech is long... It has already gone on for 30 minutes.&lt;br&gt;You feel like you might faint. |
| src/services/eventService.ts:1782 | label | 直立で耐え抜く | ちょくりつでたえぬく | The experience strengthened your resolve and helped you grow. |
| src/services/eventService.ts:1782 | text | 根性（最大HP+5&HP-5 / 70G / HP-8） | こんじょう（さいだいHP+5&amp;HP-5 / 70G / HP-8） | Grit (Increase max HP by 5 and lose 5 HP / Gain 70G / Lose 8 HP) |
| src/services/eventService.ts:1789 | resultLog | 耐え抜いた！精神力が鍛えられた。&lt;br&gt;最大HP+5、HP-5。 | たえぬいた！せいしんりょくがきたえられた。&lt;br&gt;さいだいHP+5、HP-5。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Gained +5 Max HP and lost 5 HP. |
| src/services/eventService.ts:1792 | resultLog | 模範姿勢で表彰され、70Gを受け取った。 | もはんしせいでひょうしょうされ、70Gをうけとった。 | The study moment clarified what you needed to understand next. Gained 70G. |
| src/services/eventService.ts:1795 | resultLog | 立ちくらみでフラついた...&lt;br&gt;HPが8減った。 | たちくらみでふらついた...&lt;br&gt;HPが8へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 8 HP. |
| src/services/eventService.ts:1798 | label | 保健室に直行 | ほけんしつにちょっこう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1798 | text | 安全策（HP全回復+呪い / カード削除） | あんぜんさく（HPぜんかいふく+のろい / カードさくじょ） | Safe Plan (Heal to full HP. and Curse / Remove 1 card) |
| src/services/eventService.ts:1808 | resultLog | 休めてHP全回復。&lt;br&gt;だがサボり扱いで呪い「ドジ」を受けた。 | やすめてHPぜんかいふく。&lt;br&gt;だがさぼりあつかいでのろい「どじ」をうけた。 | Heal to full HP.&lt;br&gt;Received the curse "Clumsiness". |
| src/services/eventService.ts:1822 | resultLog | 看護師の助言で心の重荷が消えた。&lt;br&gt;「あかり」を取り除いた。 | かんごしのじょげんでこころのおもにがきえた。&lt;br&gt;「あかり」をとりのぞいた。 | The nurse's advice lifted the weight from your heart.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1826 | resultLog | 保健室は満員だった。戻るしかない。 | ほけんしつはまんいんだった。もどるしかない。 | Nothing changed much, but you avoided making things worse. |
| src/services/eventService.ts:1829 | label | メモを取り続ける | めもをとりつづける | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1829 | text | 集中（カード2枚強化 / HP+8 / 呪い「不安」） | しゅうちゅう（カード2まいきょうか / HP+8 / のろい「ふあん」） | focus (Upgrade 2 cards / Heal 8 HP / Receive the curse "Anxiety") |
| src/services/eventService.ts:1838 | resultLog | 話の要点を掴み切った。&lt;br&gt;カードを2枚強化した。 | はなしのようてんをつかみきった。&lt;br&gt;カードを2まいきょうかした。 | The study moment clarified what you needed to understand next.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:1841 | resultLog | 姿勢を整えたら調子が戻った。&lt;br&gt;HPが8回復。 | しせいをととのえたらちょうしがもどった。&lt;br&gt;HPが8かいふく。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:1844 | resultLog | メモが追いつかず不安だけが残る...&lt;br&gt;呪い「不安」を受けた。 | めもがおいつかずふあんだけがのこる...&lt;br&gt;のろい「ふあん」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:1847 | label | 校長の話をラップ化 | こうちょうのはなしをらっぷか | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:1847 | text | 奇想天外（レリック / 150G / 呪い「恥」） | きそうてんがい（おたから / 150G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 150G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:1854 | resultLog | 韻が完璧で伝説になった。&lt;br&gt;レリック「インク瓶」を得た。 | いんがかんぺきででんせつになった。&lt;br&gt;おたから「いんくかめ」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Ink Bottle". |
| src/services/eventService.ts:1857 | resultLog | 文化祭出演が決定し、前金150G獲得。 | ぶんかさいしゅつえんがけっていし、まえきん150Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 150G. |
| src/services/eventService.ts:1860 | resultLog | マイクが入っていた...&lt;br&gt;呪い「恥」を受けた。 | まいくがいっっていた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 置き勉の誘惑（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1866 | title | 置き勉の誘惑 | おきつとむのゆうわく | Temptation to Leave Textbooks |
| src/services/eventService.ts:1867 | description | カバンが重すぎる。教科書を学校に置いて帰ろうか... | かばんがおもすぎる。きょうかしょをがっこうにおいてかえろうか... | The strange school scene offered a choice with real consequences. |
| src/services/eventService.ts:1869 | label | 教科書を置いて帰る | きょうかしょをおいてかえる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1869 | text | 軽量化（カード削除 / 50G / 呪い） | けいりょうか（カードさくじょ / 50G / のろい） | Lightening the Load (Remove 1 card / Gain 50G / Receive a curse) |
| src/services/eventService.ts:1884 | resultLog | 荷物整理で身軽になった。&lt;br&gt;「あかり」を取り除いた。 | にもつせいりでみがるになった。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:1889 | resultLog | ロッカー整理の手伝いで50G獲得。 | ろっかーせいりのてつだいで50Gかくとく。 | Tidying things up also helped clear your mind for the next step. Gained 50G. |
| src/services/eventService.ts:1892 | resultLog | 宿題を忘れた不安がつきまとう...&lt;br&gt;呪い「不安」を受けた。 | しゅくだいをわすれたふあんがつきまとう...&lt;br&gt;のろい「ふあん」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:1895 | label | 全部持って帰る | ぜんぶもってかえる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1895 | text | 根性（頭突き入手 / 恒久ムキムキ+1 / HP-6） | こんじょう（ずつきにゅうしゅ / こうきゅうむきむき+1 / HP-6） | Grit (Gain Headbutt / permanentStrength and 1 / Lose 6 HP) |
| src/services/eventService.ts:1899 | resultLog | 重さに打ち勝った。&lt;br&gt;「頭突き」を習得した。 | おもさにうちかった。&lt;br&gt;「ずつき」をしゅうとくした。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Learned "Headbutt". |
| src/services/eventService.ts:1902 | resultLog | 毎日の負荷で鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | まいにちのふかできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:1905 | resultLog | 肩が悲鳴を上げた...&lt;br&gt;HPが6減った。 | かたがひめいをあげた...&lt;br&gt;HPが6へった。 | The short break helped your body and mind recover.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:1908 | label | 友達に分担してもらう | ともだちにぶんたんしてもらう | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:1908 | text | 協力（HP+10 / カード1枚強化） | きょうりょく（HP+10 / カード1まいきょうか） | Co-op (Heal 10 HP / Upgrade 1 cards) |
| src/services/eventService.ts:1912 | resultLog | 荷物が減って余裕ができた。&lt;br&gt;HPが10回復。 | にもつがへってよゆうができた。&lt;br&gt;HPが10かいふく。 | Using the time well gave you room to think and move forward.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:1925 | resultLog | 協力のコツを掴んだ。&lt;br&gt;「あかり」が強化された。 | きょうりょくのこつをつかんだ。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:1929 | resultLog | みんなも手一杯だった。現状維持。 | みんなもていっぱいだった。げんじょういじ。 | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:1932 | label | 教科書を宅配便で送る | きょうかしょをたくはいびんでおくる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1932 | text | 奇想天外（120G / レリック / 呪い「後悔」） | きそうてんがい（120G / おたから / のろい「こうかい」） | Wild Idea (Gain 120G / Gain a relic / Receive the curse "Regret") |
| src/services/eventService.ts:1936 | resultLog | 送料が想像以上だった...&lt;br&gt;120G失った。 | そうりょうがそうぞういじょうだった...&lt;br&gt;120Gうしなった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You handled the moment and carried its outcome into what came next. Lost 20G. |
| src/services/eventService.ts:1942 | resultLog | 業者から記念品をもらった。&lt;br&gt;レリック「予習かばん」を得た。 | ぎょうしゃからきねんひんをもらった。&lt;br&gt;おたから「よしゅうかばん」をえた。 | The opportunity produced a practical reward.&lt;br&gt;Gained the relic "Prep Bag". |
| src/services/eventService.ts:1945 | resultLog | 翌日、荷物が届かず大混乱...&lt;br&gt;呪い「後悔」を受けた。 | よくじつ、にもつがとどかずだいこんらん...&lt;br&gt;のろい「こうかい」をうけた。 | You noticed the opening and turned it into an advantage.&lt;br&gt;Received the curse "Regret". |

#### 伝説の木の下（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:1951 | title | 伝説の木の下 | でんせつのきのした | Under the Legendary Tree |
| src/services/eventService.ts:1952 | description | この木の下で告白すると結合されるという伝説がある。&lt;br&gt;誰かが待っているようだ。 | このきのしたでこくはくするとけつごうされるというでんせつがある。&lt;br&gt;だれかがまっているようだ。 | Legend says that confessing under this tree will bind two people together.&lt;br&gt;Someone seems to be waiting. |
| src/services/eventService.ts:1954 | label | 勇気を出して行く | ゆうきをだしていく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1954 | text | 告白勝負（レリック / 100G / 呪い） | こくはくしょうぶ（おたから / 100G / のろい） | Choose Option (Gain a relic / Gain 100G / Receive a curse) |
| src/services/eventService.ts:1958 | resultLog | 待っていた相手から贈り物を受け取った。&lt;br&gt;レリック「アサガオ」を得た。 | まっていたあいてからおくりものをうけとった。&lt;br&gt;おたから「あさがお」をえた。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Gained the relic "Morning Glory". |
| src/services/eventService.ts:1961 | resultLog | 告白現場は誰もいない。だが木の根元に100Gあった。 | こくはくげんばはだれもいない。だがきのねもとに100Gあった。 | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:1964 | resultLog | イタズラ告白だった...&lt;br&gt;呪い「悩み」を受けた。 | いたずらこくはくだった...&lt;br&gt;のろい「なやみ」をうけた。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Received the curse "Worry". |
| src/services/eventService.ts:1967 | label | 遠くから様子を見る | とおくからようすをみる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1967 | text | 観察（カード1枚強化 / HP+8） | かんさつ（カード1まいきょうか / HP+8） | Observation (Upgrade 1 cards / Heal 8 HP) |
| src/services/eventService.ts:1981 | resultLog | 人間観察で洞察が磨かれた。&lt;br&gt;「あかり」が強化された。 | にんげんかんさつでどうさつがみがかれた。&lt;br&gt;「あかり」がきょうかされた。 | Seeing the situation from a new angle gave you a useful perspective.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:1986 | resultLog | 穏やかな空気に癒やされた。&lt;br&gt;HPが8回復。 | おだやかなくうきにいやされた。&lt;br&gt;HPが8かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:1991 | label | 木に願い札を結ぶ | きにねがいさつをむすぶ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:1991 | text | 祈願（最大HP+4 / カード削除 / HP-6） | きがん（さいだいHP+4 / カードさくじょ / HP-6） | Prayer (Increase max HP by 4 / Remove 1 card / Lose 6 HP) |
| src/services/eventService.ts:1995 | resultLog | 願いが届いた気がする。&lt;br&gt;最大HPと現在HPが4増えた。 | ねがいがとどいたきがする。&lt;br&gt;さいだいHPとげんざいHPが4ふえた。 | You noticed the opening and turned it into an advantage.&lt;br&gt;Max HP and current HP +4. |
| src/services/eventService.ts:2009 | resultLog | 迷いを札に託した。&lt;br&gt;「あかり」を取り除いた。 | まよいをさつにたくした。&lt;br&gt;「あかり」をとりのぞいた。 | You entrusted your hesitation to a talisman.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2014 | resultLog | 高い枝に手を伸ばして転んだ...&lt;br&gt;HPが6減った。 | たかいえだにてをのばしてころんだ...&lt;br&gt;HPが6へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:2017 | label | 木の下でプロポーズ代行業 | きのしたでぷろぽーずだいこうぎょう | The opportunity produced a practical reward. |
| src/services/eventService.ts:2017 | text | 奇想天外（180G / 恒久ムキムキ+1 / 呪い「恥」） | きそうてんがい（180G / こうきゅうむきむき+1 / のろい「はじ」） | Wild Idea (Gain 180G / permanentStrength and 1 / Receive the curse "Embarrassment") |
| src/services/eventService.ts:2021 | resultLog | 代行依頼が殺到。180G獲得。 | だいこういらいがさっとう。180Gかくとく。 | The opportunity produced a practical reward. Gained 180G. |
| src/services/eventService.ts:2024 | resultLog | 連続の熱弁で体幹が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | れんぞくのねつべんでたいかんがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:2027 | resultLog | 本人を間違えて告白してしまった...&lt;br&gt;呪い「恥」を受けた。 | ほんにんをまちがえてこくはくしてしまった...&lt;br&gt;のろい「はじ」をうけた。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Received the curse "Embarrassment". |

#### 体育倉庫のマット（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2033 | title | 体育倉庫のマット | たいいくそうこのまっと | Gym Storage Mats |
| src/services/eventService.ts:2034 | description | 体育倉庫のマットの間に何かが挟まっている。&lt;br&gt;腐った匂いもするが... | たいいくそうこのまっとのまになにかがはさまっている。&lt;br&gt;くさったにおいもするが... | Something is stuck between the mats in the gym storage room.&lt;br&gt;It also smells rotten... |
| src/services/eventService.ts:2036 | label | 勇気を出して探る | ゆうきをだしてさぐる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2036 | text | 探索（レアカード / 粘液 / 60G） | たんさく（れあカード / ねんえき / 60G） | Search (Gain a rare card / Receive Mucus / Gain 60G) |
| src/services/eventService.ts:2044 | resultLog | 隠しレアカードを発見した！ | かくしれあカードをはっけんした！ | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:2047 | resultLog | 腐ったものを掴んでしまった...&lt;br&gt;状態異常「粘液」を受けた。 | くさったものをつかんでしまった...&lt;br&gt;じょうたいいじょう「ねんえき」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the status "Mucus". |
| src/services/eventService.ts:2050 | resultLog | マットの隙間に60Gが挟まっていた。 | まっとのすきまに60Gがはさまっていた。 | 60G was stuck between the mats. |
| src/services/eventService.ts:2053 | label | 掃除してから探す | そうじしてからさがす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2053 | text | 慎重策（カード削除 / HP+8） | しんちょうさく（カードさくじょ / HP+8） | Careful Plan (Remove 1 card / Heal 8 HP) |
| src/services/eventService.ts:2068 | resultLog | 整理整頓で視界がクリアに。&lt;br&gt;「あかり」を取り除いた。 | せいりせいとんでしかいがくりあに。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2073 | resultLog | ほこりを払って気分も回復。&lt;br&gt;HPが8回復。 | ほこりをはらってきぶんもかいふく。&lt;br&gt;HPが8かいふく。 | The short break helped your body and mind recover.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:2078 | label | マットで筋トレ | まっとですじとれ | The physical effort sharpened your rhythm and confidence. |
| src/services/eventService.ts:2078 | text | 鍛錬（恒久ムキムキ+1 / 最大HP+3 / HP-5） | たんれん（こうきゅうむきむき+1 / さいだいHP+3 / HP-5） | Training (permanentStrength and 1 / Increase max HP by 3 / Lose 5 HP) |
| src/services/eventService.ts:2082 | resultLog | 腕立て100回達成！恒久ムキムキ+1。 | うでたてて100かいたつせい！こうきゅうむきむき+1。 | The physical effort sharpened your rhythm and confidence. Gain 1 Strength. |
| src/services/eventService.ts:2085 | resultLog | 体幹が安定した。&lt;br&gt;最大HPと現在HPが3増えた。 | たいかんがあんていした。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | The short break helped your body and mind recover.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:2088 | resultLog | 勢い余って腰を打った...&lt;br&gt;HPが5減った。 | いきおいあまってこしをうった...&lt;br&gt;HPが5へった。 | The physical effort sharpened your rhythm and confidence.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:2091 | label | マット要塞を建設 | まっとようさいをけんせつ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2091 | text | 奇想天外（レリック / 120G / 呪い「後悔」） | きそうてんがい（おたから / 120G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 120G / Receive the curse "Regret") |
| src/services/eventService.ts:2098 | resultLog | 難攻不落の要塞完成。&lt;br&gt;レリック「厚紙シールド」を得た。 | なんこうふらくのようさいかんせい。&lt;br&gt;おたから「あつがみしーるど」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Cardboard Shield". |
| src/services/eventService.ts:2101 | resultLog | 秘密基地ツアーが有料化された。&lt;br&gt;120G獲得。 | ひみつきちつあーがゆうりょうかされた。&lt;br&gt;120Gかくとく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:2104 | resultLog | 撤収時に全部崩れた...&lt;br&gt;呪い「後悔」を受けた。 | てっしゅうときにぜんぶくずれた...&lt;br&gt;のろい「こうかい」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Regret". |

#### 秘密基地のパスワード（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2110 | title | 秘密基地のパスワード | ひみつきちのぱすわーど | Secret Base Password |
| src/services/eventService.ts:2111 | description | 草むらに隠された合言葉。正解すればお宝が手に入るかもしれない。 | くさむらにかくされたあいことば。せいかいすればおたからがてにいるかもしれない。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:2113 | label | 勘で唱える | かんでとなえる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2113 | text | 運試し（200G / HP-5 / 呪い） | うんだめし（200G / HP-5 / のろい） | Test Your Luck (Gain 200G / Lose 5 HP / Receive a curse) |
| src/services/eventService.ts:2117 | resultLog | 「開けゴマ！」で本当に開いた！&lt;br&gt;200G獲得。 | 「ひらけごま！」でほんとうにひらいた！&lt;br&gt;200Gかくとく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained 200G. |
| src/services/eventService.ts:2120 | resultLog | 警報が鳴り響いた！&lt;br&gt;HPが5減った。 | けいほうがなりひびいた！&lt;br&gt;HPが5へった。 | The risky choice backfired and left you with a setback.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:2123 | resultLog | 正解か不正解か分からないまま帰る羽目に...&lt;br&gt;呪い「不安」を受けた。 | せいかいかふせいかいかわからないままかえるはめに...&lt;br&gt;のろい「ふあん」をうけた。 | right answer right answer...&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:2126 | label | 暗号を解読する | あんごうをかいどくする | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:2126 | text | 知性（カード2枚強化 / HP+6） | ちせい（カード2まいきょうか / HP+6） | Intellect (Upgrade 2 cards / Heal 6 HP) |
| src/services/eventService.ts:2135 | resultLog | 暗号理論が冴えた。&lt;br&gt;カードを2枚強化した。 | あんごうりろんがさえた。&lt;br&gt;カードを2まいきょうかした。 | The study moment clarified what you needed to understand next.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:2138 | resultLog | 正解目前まで迫った。&lt;br&gt;HPが6回復。 | せいかいもくぜんまでせまった。&lt;br&gt;HPが6かいふく。 | The study moment clarified what you needed to understand next.&lt;br&gt;Heal 6 HP. |
| src/services/eventService.ts:2140 | resultLog | 暗号は深すぎた。成果なし。 | あんごうはふかすぎた。せいかなし。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:2143 | label | 見張りと交渉する | みはりとこうしょうする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2143 | text | 交渉（カード削除 / 90G / HP-4） | こうしょう（カードさくじょ / 90G / HP-4） | Negotiation (Remove 1 card / Gain 90G / Lose 4 HP) |
| src/services/eventService.ts:2158 | resultLog | 通行証をもらい迷いが消えた。&lt;br&gt;「あかり」を取り除いた。 | つうこうしょうをもらいまよいがきえた。&lt;br&gt;「あかり」をとりのぞいた。 | Receiving the pass cleared away your hesitation.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2163 | resultLog | 見張りの副業を手伝い90G獲得。 | みはりのふくぎょうをてつだい90Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 90G. |
| src/services/eventService.ts:2166 | resultLog | 口論になって追い返された。&lt;br&gt;HPが4減った。 | こうろんになっておいかえされた。&lt;br&gt;HPが4へった。 | The risky choice backfired and left you with a setback.&lt;br&gt;Lost 4 HP. |
| src/services/eventService.ts:2169 | label | 秘密基地を乗っ取る | ひみつきちをのっとる | Secret Base |
| src/services/eventService.ts:2169 | text | 奇想天外（レリック / 150G / 呪い「恥」） | きそうてんがい（おたから / 150G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 150G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:2176 | resultLog | 基地の主になった。&lt;br&gt;レリック「懐中電灯」を得た。 | きちのおもになった。&lt;br&gt;おたから「かいちゅうでんとう」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Flashlight". |
| src/services/eventService.ts:2179 | resultLog | 会員権販売で150G獲得。 | かいいんけんはんばいで150Gかくとく。 | The opportunity produced a practical reward. Gained 150G. |
| src/services/eventService.ts:2182 | resultLog | 三日で追放された...&lt;br&gt;呪い「恥」を受けた。 | みっかでついほうされた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 職員室の呼び出し（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2188 | title | 職員室の呼び出し | しょくいんしつのよびだし | Call to the Teachers' Room |
| src/services/eventService.ts:2189 | description | 校内放送で名前を呼ばれた。心当たりはあるか？ | こうないほうそうでなまえをよばれた。こころあたりはあるか？ | Facing the feeling directly helped your mind settle. |
| src/services/eventService.ts:2191 | label | 正面から行く | しょうめんからいく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2191 | text | 誠実（HP全回復+削除 / 80G） | せいじつ（HPぜんかいふく+さくじょ / 80G） | Honesty (Heal to full HP and remove 1 card / Gain 80G) |
| src/services/eventService.ts:2207 | resultLog | 褒められた！HP全回復。&lt;br&gt;「あかり」を捨て去った。 | ほめられた！HPぜんかいふく。&lt;br&gt;「あかり」をすてさった。 | The short break helped your body and mind recover. Heal to full HP.&lt;br&gt;Threw away "Akari". |
| src/services/eventService.ts:2211 | resultLog | 校内係の謝礼を受けた。&lt;br&gt;80G獲得。 | こうないかかりのしゃれいをうけた。&lt;br&gt;80Gかくとく。 | Your helpful action was noticed, and you received thanks in return.&lt;br&gt;Gained 80G. |
| src/services/eventService.ts:2216 | label | 廊下で待ち伏せ | ろうかでまちふせ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2216 | text | 奇策（カード1枚強化 / HP+8 / HP-6） | きさく（カード1まいきょうか / HP+8 / HP-6） | Unusual Plan (Upgrade 1 cards / Heal 8 HP / Lose 6 HP) |
| src/services/eventService.ts:2230 | resultLog | 先手を打って評価アップ。&lt;br&gt;「あかり」が強化された。 | せんてをうってひょうかあっぷ。&lt;br&gt;「あかり」がきょうかされた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:2235 | resultLog | 待機中に深呼吸して落ち着いた。&lt;br&gt;HPが8回復。 | たいきちゅうにしんこきゅうしておちついた。&lt;br&gt;HPが8かいふく。 | The short break helped your body and mind recover.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:2238 | resultLog | 走り回って見つかり消耗...&lt;br&gt;HPが6減った。 | はしりまわってみつかりしょうもう...&lt;br&gt;HPが6へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:2241 | label | バックれる | ばっくれる | Skip out |
| src/services/eventService.ts:2241 | text | 逃走（50G+呪い / カード削除 / 恒久ムキムキ+1） | とうそう（50G+のろい / カードさくじょ / こうきゅうむきむき+1） | Escape (Gain 50G and receive a curse / Remove 1 card / permanentStrength and 1) |
| src/services/eventService.ts:2251 | resultLog | 逃げた拍子に50G拾ったが、呪い「不安」を受けた。 | にげたひょうしに50Gひろったが、のろい「ふあん」をうけた。 | 50G picked up, curse " Anxiety ". |
| src/services/eventService.ts:2265 | resultLog | 逃走ルート最適化で荷が軽くなった。&lt;br&gt;「あかり」を取り除いた。 | とうそうるーとさいてきかでにがかるくなった。&lt;br&gt;「あかり」をとりのぞいた。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2270 | resultLog | 毎日逃げ足を鍛えた成果。&lt;br&gt;恒久ムキムキ+1。 | まいにちにげあしをきたえたせいか。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:2273 | label | 先生の代わりに呼び出し放送 | せんせいのかわりによびだしほうそう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2273 | text | 奇想天外（レリック / 140G / 呪い「恥」） | きそうてんがい（おたから / 140G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 140G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:2280 | resultLog | 放送進行が評価された。&lt;br&gt;レリック「チャイム時計」を得た。 | ほうそうしんこうがひょうかされた。&lt;br&gt;おたから「ちゃいむとけい」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Chime Clock". |
| src/services/eventService.ts:2283 | resultLog | 校内MCの謝礼で140G獲得。 | こうないMCのしゃれいで140Gかくとく。 | Your helpful action was noticed, and you received thanks in return. Gained 140G. |
| src/services/eventService.ts:2286 | resultLog | 名前を噛んで大事故...&lt;br&gt;呪い「恥」を受けた。 | なまえをかんでだいじこ...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 落とし物のリコーダー（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2292 | title | 落とし物のリコーダー | おとしもののりこーだー | Lost Recorder |
| src/services/eventService.ts:2293 | description | 道端に誰かのリコーダーが落ちている。名前は書いていない。 | みちばたにだれかのりこーだーがおちている。なまえはかいていない。 | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:2295 | label | 試しに吹く | ためしにふく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2295 | text | 音の運命（歌うカード / めまい / 70G） | おとのうんめい（うたうカード / めまい / 70G） | Choose Option (Card / Dizziness / Gain 70G) |
| src/services/eventService.ts:2299 | resultLog | 見事な音色！新しい表現を覚えた。 | みごとなねいろ！あたらしいひょうげんをおぼえた。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2302 | resultLog | 音程が外れてくらくら...&lt;br&gt;状態異常「めまい」を受けた。 | おんていがはずれてくらくら...&lt;br&gt;じょうたいいじょう「めまい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the status "Dizziness". |
| src/services/eventService.ts:2305 | resultLog | 演奏を見た人が投げ銭してくれた。&lt;br&gt;70G獲得。 | えんそうをみたにんがなげせんしてくれた。&lt;br&gt;70Gかくとく。 | Your effort paid off and earned a useful reward.&lt;br&gt;Gained 70G. |
| src/services/eventService.ts:2308 | label | 洗って届ける | あらってとどける | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:2308 | text | 善行（HP+10 / カード削除） | ぜんこう（HP+10 / カードさくじょ） | Good Deed (Heal 10 HP / Remove 1 card) |
| src/services/eventService.ts:2312 | resultLog | きれいにして届けた。&lt;br&gt;HPが10回復。 | きれいにしてとどけた。&lt;br&gt;HPが10かいふく。 | You noticed the opening and turned it into an advantage.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:2326 | resultLog | 感謝されて心のノイズが消えた。&lt;br&gt;「あかり」を取り除いた。 | かんしゃされてこころののいずがきえた。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2330 | resultLog | 職員室が留守だった。また今度届けよう。 | しょくいんしつがるすだった。またこんどとどけよう。 | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:2333 | label | 演奏会を開く | えんそうかいをひらく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2333 | text | 挑戦（最大HP+3 / カード1枚強化 / HP-5） | ちょうせん（さいだいHP+3 / カード1まいきょうか / HP-5） | Choose Option (Increase max HP by 3 / Upgrade 1 cards / Lose 5 HP) |
| src/services/eventService.ts:2337 | resultLog | 息遣いが安定した。&lt;br&gt;最大HPと現在HPが3増えた。 | いきづかいがあんていした。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:2350 | resultLog | 本番経験で技が磨かれた。&lt;br&gt;「あかり」が強化された。 | ほんばんけいけんでわざがみがかれた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:2355 | resultLog | 息切れでダウン...&lt;br&gt;HPが5減った。 | いきぎれでだうん...&lt;br&gt;HPが5へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:2358 | label | リコーダー探偵を名乗る | りこーだーたんていをなのる | The strange school scene offered a choice with real consequences. |
| src/services/eventService.ts:2358 | text | 奇想天外（レリック / 130G / 呪い「後悔」） | きそうてんがい（おたから / 130G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 130G / Receive the curse "Regret") |
| src/services/eventService.ts:2365 | resultLog | 落とし物事件を解決。&lt;br&gt;レリック「小物入れ」を得た。 | おとしものじけんをかいけつ。&lt;br&gt;おたから「こものいれれ」をえた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Gained the relic "Tiny Case". |
| src/services/eventService.ts:2368 | resultLog | 調査協力費として130G獲得。 | ちょうさきょうりょくひとして130Gかくとく。 | The opportunity produced a practical reward. Gained 130G. |
| src/services/eventService.ts:2371 | resultLog | 持ち主を取り違えてしまった...&lt;br&gt;呪い「後悔」を受けた。 | もちぬしをとりちがえてしまった...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |

#### 図工室の粘土（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2377 | title | 図工室の粘土 | ずこうしつのねんど | Art Room Clay |
| src/services/eventService.ts:2378 | description | 乾燥してカチカチの粘土がある。水をかければ使えるかもしれない。 | かんそうしてかちかちのねんどがある。みずをかければつかえるかもしれない。 | The strange school scene offered a choice with real consequences. |
| src/services/eventService.ts:2380 | label | 丁寧にこねる | ていねいにこねる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2380 | text | 造形（防御強化 / カード1枚強化） | ぞうけい（ぼうぎょきょうか / カード1まいきょうか） | Craftsmanship (Improve defense / Upgrade 1 cards) |
| src/services/eventService.ts:2394 | resultLog | 鉄壁の造形が完成！「防御」が強化された。 | てっぺきのぞうけいがかんせい！「ぼうぎょ」がきょうかされた。 | Your effort was recognized and turned into a stronger result. "Defense" was upgraded. |
| src/services/eventService.ts:2408 | resultLog | 発想が閃いた。&lt;br&gt;「あかり」が強化された。 | はっそうがひらめいた。&lt;br&gt;「あかり」がきょうかされた。 | A new idea flashed into your mind.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:2412 | resultLog | いい作品ができた。効果は特にない。 | いいさくひんができた。こうかはとくにない。 | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:2415 | label | 豪快に叩く | ごうかいにたたく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2415 | text | 破壊（最大HP+2 / 60G / HP-5） | はかい（さいだいHP+2 / 60G / HP-5） | Destruction (Increase max HP by 2 / Gain 60G / Lose 5 HP) |
| src/services/eventService.ts:2419 | resultLog | ストレス解放で体が軽い。&lt;br&gt;最大HPと現在HPが2増えた。 | すとれすかいほうでからだがかるい。&lt;br&gt;さいだいHPとげんざいHPが2ふえた。 | The short break helped your body and mind recover.&lt;br&gt;Max HP and current HP +2. |
| src/services/eventService.ts:2422 | resultLog | 破片アートが売れた。&lt;br&gt;60G獲得。 | はへんあーとがうれた。&lt;br&gt;60Gかくとく。 | The risky choice backfired and left you with a setback.&lt;br&gt;Gained 60G. |
| src/services/eventService.ts:2425 | resultLog | 破片で手を切った...&lt;br&gt;HPが5減った。 | はへんでてをきった...&lt;br&gt;HPが5へった。 | The risky choice backfired and left you with a setback.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:2428 | label | 先生に評価してもらう | せんせいにひょうかしてもらう | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:2428 | text | 評価（カード削除 / HP+8 / 呪い） | ひょうか（カードさくじょ / HP+8 / のろい） | Evaluation (Remove 1 card / Heal 8 HP / Receive a curse) |
| src/services/eventService.ts:2443 | resultLog | 講評で課題が明確に。&lt;br&gt;「あかり」を取り除いた。 | こうひょうでかだいがめいかくに。&lt;br&gt;「あかり」をとりのぞいた。 | The critique made your next task clear.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2448 | resultLog | 褒められて元気になった。&lt;br&gt;HPが8回復。 | ほめられてげんきになった。&lt;br&gt;HPが8かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:2451 | resultLog | 公開講評で緊張した...&lt;br&gt;呪い「恥」を受けた。 | こうかいこうひょうできんちょうした...&lt;br&gt;のろい「はじ」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:2454 | label | 粘土で自分の分身を作る | ねんどでじぶんのぶんしんをつくる | The strange school scene offered a choice with real consequences. |
| src/services/eventService.ts:2454 | text | 奇想天外（レリック / 恒久ムキムキ+1 / 呪い「後悔」） | きそうてんがい（おたから / こうきゅうむきむき+1 / のろい「こうかい」） | Wild Idea (Gain a relic / permanentStrength and 1 / Receive the curse "Regret") |
| src/services/eventService.ts:2461 | resultLog | 分身が微笑んだ。&lt;br&gt;レリック「合わせ鏡」を得た。 | ぶんしんがほほえんだ。&lt;br&gt;おたから「あわせかがみ」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Facing Mirrors". |
| src/services/eventService.ts:2464 | resultLog | 粘土運びで鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | ねんどはこびできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The strange school scene offered a choice with real consequences.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:2467 | resultLog | 完成直前で崩れた...&lt;br&gt;呪い「後悔」を受けた。 | かんせいちょくぜんでくずれた...&lt;br&gt;のろい「こうかい」をうけた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Received the curse "Regret". |

#### 家庭科室のつまみ食い（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2473 | title | 家庭科室のつまみ食い | かていかしつのつまみくい | Home Economics Snack |
| src/services/eventService.ts:2474 | description | 調理実習の余りのクッキーがある。誰の物かわからない。 | ちょうりじっしゅうのあまりのくっきーがある。だれのものかわからない。 | The strange school scene offered a choice with real consequences. |
| src/services/eventService.ts:2476 | label | ひとくち食べる | ひとくちたべる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2476 | text | 試食（HP+15 / 呪い / 40G） | ししょく（HP+15 / のろい / 40G） | Taste Test (Heal 15 HP / Receive a curse / Gain 40G) |
| src/services/eventService.ts:2480 | resultLog | サクサクで美味しい！&lt;br&gt;HPが15回復。 | さくさくでおいしい！&lt;br&gt;HPが15かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 15 HP. |
| src/services/eventService.ts:2483 | resultLog | 賞味期限が怪しかった...&lt;br&gt;呪い「腹痛」を受けた。 | しょうみきげんがあやしかった...&lt;br&gt;のろい「ふくつう」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Pain". |
| src/services/eventService.ts:2486 | resultLog | 味見係として40Gをもらった。 | あじみかかとして40Gをもらった。 | You handled the moment and carried its outcome into what came next. Gained 40G. |
| src/services/eventService.ts:2489 | label | 我慢する | がまんする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2489 | text | 意志（カード強化 / 最大HP+3） | いし（カードきょうか / さいだいHP+3） | Willpower (Upgrade 1 card / Increase max HP by 3) |
| src/services/eventService.ts:2503 | resultLog | 誘惑に打ち勝った。&lt;br&gt;「あかり」が強化された。 | ゆうわくにうちかった。&lt;br&gt;「あかり」がきょうかされた。 | You overcame the temptation.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:2508 | resultLog | 自己管理が身についた。&lt;br&gt;最大HPと現在HPが3増えた。 | じこかんりがみについた。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:2513 | label | 皆に配る | みなにくばる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2513 | text | 共有（カード削除 / 70G / HP-5） | きょうゆう（カードさくじょ / 70G / HP-5） | Sharing (Remove 1 card / Gain 70G / Lose 5 HP) |
| src/services/eventService.ts:2528 | resultLog | 感謝されて心が軽くなった。&lt;br&gt;「あかり」を取り除いた。 | かんしゃされてこころがかるくなった。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2533 | resultLog | お礼のお菓子券を換金。&lt;br&gt;70G獲得。 | おれいのおかしけんをかんきん。&lt;br&gt;70Gかくとく。 | Your careful choice helped someone and improved the situation.&lt;br&gt;Gained 70G. |
| src/services/eventService.ts:2536 | resultLog | 運搬で疲れた...&lt;br&gt;HPが5減った。 | うんぱんでつかれた...&lt;br&gt;HPが5へった。 | The short break helped your body and mind recover.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:2539 | label | 家庭科室にカフェを開く | かていかしつにかふぇをひらく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2539 | text | 奇想天外（レリック / 150G / 呪い「恥」） | きそうてんがい（おたから / 150G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 150G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:2546 | resultLog | 臨時カフェが大盛況。&lt;br&gt;レリック「放課後の水筒」を得た。 | りんじかふぇがだいせいきょう。&lt;br&gt;おたから「ほうかごのすいとう」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "After-School Canteen". |
| src/services/eventService.ts:2549 | resultLog | 売上で150G獲得。 | うりあげで150Gかくとく。 | Your effort paid off and earned a useful reward. Gained 150G. |
| src/services/eventService.ts:2552 | resultLog | 食レポで盛大にむせた...&lt;br&gt;呪い「恥」を受けた。 | しょくれぽでせいだいにむせた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 体育祭の練習（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2558 | title | 体育祭の練習 | たいいくさいのれんしゅう | Sports Festival Practice |
| src/services/eventService.ts:2559 | description | 大縄跳びの練習をしている。一緒に混ざる？ | おおなわとびのれんしゅうをしている。いっしょにまざる？ | The physical effort sharpened your rhythm and confidence. |
| src/services/eventService.ts:2561 | label | 跳び手として混ざる | とびてとしてまざる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2561 | text | 体力勝負（HP-5+40G / HP+10 / 呪い） | たいりょくしょうぶ（HP-5+40G / HP+10 / のろい） | Strength (HP-5+40G / Heal 10 HP / Receive a curse) |
| src/services/eventService.ts:2572 | resultLog | みんなで跳んだ！&lt;br&gt;HP-5、40G獲得。 | みんなではんだ！&lt;br&gt;HP-5、40Gかくとく。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Gained 40G. |
| src/services/eventService.ts:2575 | resultLog | リズムに乗って気分爽快。&lt;br&gt;HPが10回復。 | りずむにのってきぶんそうかい。&lt;br&gt;HPが10かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:2578 | resultLog | 足を引っかけて転倒...&lt;br&gt;呪い「ドジ」を受けた。 | あしをひっかけててんとう...&lt;br&gt;のろい「どじ」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Clumsiness". |
| src/services/eventService.ts:2581 | label | 縄を回す | なわをまわす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2581 | text | 支援役（グルグルバット強化 / カード削除） | しえんやく（グルグルバットきょうか / カードさくじょ） | Support Role (Upgrade Whirl Bat / Remove 1 card) |
| src/services/eventService.ts:2595 | resultLog | 回転技術が向上した！「グルグルバット」が強化された。 | かいてんぎじゅつがこうじょうした！「グルグルバット」がきょうかされた。 | You refined what you learned and turned it into a practical advantage. "Whirl Bat" was upgraded. |
| src/services/eventService.ts:2610 | resultLog | チーム運営で無駄が消えた。&lt;br&gt;「あかり」を取り除いた。 | ちーむうんえいでむだがきえた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2614 | resultLog | 練習は無難に終了。 | れんしゅうはぶなんにしゅうりょう。 | The physical effort sharpened your rhythm and confidence. |
| src/services/eventService.ts:2617 | label | 応援団に入る | おうえんだんにいる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2617 | text | 鼓舞（恒久ムキムキ+1 / 80G / HP-4） | こぶ（こうきゅうむきむき+1 / 80G / HP-4） | Encouragement (permanentStrength and 1 / Gain 80G / Lose 4 HP) |
| src/services/eventService.ts:2621 | resultLog | 声出しで体幹が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | こえだしでたいかんがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:2624 | resultLog | 応援演目の出演料で80G獲得。 | おうえんえんもくのしゅつえんりょうで80Gかくとく。 | The opportunity produced a practical reward. Gained 80G. |
| src/services/eventService.ts:2627 | resultLog | 声を張りすぎて喉が痛い...&lt;br&gt;HPが4減った。 | こえをはりすぎてのどがいたい...&lt;br&gt;HPが4へった。 | The risky choice backfired and left you with a setback.&lt;br&gt;Lost 4 HP. |
| src/services/eventService.ts:2630 | label | 実況配信を始める | じっきょうはいしんをはじめる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2630 | text | 奇想天外（レリック / 160G / 呪い「後悔」） | きそうてんがい（おたから / 160G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 160G / Receive the curse "Regret") |
| src/services/eventService.ts:2637 | resultLog | 配信がバズった。&lt;br&gt;レリック「観察メモ」を得た。 | はいしんがばずった。&lt;br&gt;おたから「かんさつめも」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Observation Notes". |
| src/services/eventService.ts:2640 | resultLog | 投げ銭が飛んだ。&lt;br&gt;160G獲得。 | なげせんがとんだ。&lt;br&gt;160Gかくとく。 | Your effort paid off and earned a useful reward.&lt;br&gt;Gained 160G. |
| src/services/eventService.ts:2643 | resultLog | マイク切り忘れで炎上...&lt;br&gt;呪い「後悔」を受けた。 | まいくきりわすれでえんじょう...&lt;br&gt;のろい「こうかい」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Regret". |

#### 校章の輝き（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2649 | title | 校章の輝き | こうしょうのかがやき | Shining School Emblem |
| src/services/eventService.ts:2650 | description | 地面に落ちているピカピカの校章。学校への愛着を試されている。 | じめんにおちているぴかぴかのこうしょう。がっこうへのあいちゃくをためされている。 | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:2652 | label | 丁寧に磨く | ていねいにみがく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2652 | text | 敬意（金の定規+悩み / 100G / HP+6） | けいい（きんのじょうぎ+なやみ / 100G / HP+6） | Respect (Golden Ruler and Worry / Gain 100G / Heal 6 HP) |
| src/services/eventService.ts:2662 | resultLog | 輝きが増した！レリック「金の定規」を得た。&lt;br&gt;だが執着して呪い「悩み」を受けた。 | かがやきがました！おたから「きんのじょうぎ」をえた。&lt;br&gt;だがしゅうちゃくしてのろい「なやみ」をうけた。 | Your effort was recognized and turned into a stronger result. Gained the relic "Golden Ruler".&lt;br&gt;Received the curse "Worry". |
| src/services/eventService.ts:2665 | resultLog | 落とし主から謝礼を受けた。&lt;br&gt;100G獲得。 | おとししゅからしゃれいをうけた。&lt;br&gt;100Gかくとく。 | Your helpful action was noticed, and you received thanks in return.&lt;br&gt;Gained 100G. |
| src/services/eventService.ts:2668 | resultLog | 姿勢を正したら気持ちが整った。&lt;br&gt;HPが6回復。 | しせいをただしたらきもちがととのった。&lt;br&gt;HPが6かいふく。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Heal 6 HP. |
| src/services/eventService.ts:2671 | label | 職員室へ届ける | しょくいんしつへとどける | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:2671 | text | 正道（カード削除 / カード1枚強化） | せいどう（カードさくじょ / カード1まいきょうか） | Right Path (Remove 1 card / Upgrade 1 cards) |
| src/services/eventService.ts:2686 | resultLog | 誠実な行いで心が軽くなった。&lt;br&gt;「あかり」を取り除いた。 | せいじつなおこないでこころがかるくなった。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2701 | resultLog | 評価されて自信がついた。&lt;br&gt;「あかり」が強化された。 | ひょうかされてじしんがついた。&lt;br&gt;「あかり」がきょうかされた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:2705 | resultLog | 無事に届けた。見返りはない。 | ぶじにとどけた。みかえりはない。 | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:2708 | label | 踏んで運試し | ふんでうんだめし | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2708 | text | 背徳（全カード強化+恥 / 恒久ムキムキ+1 / HP-8） | はいとく（ぜんカードきょうか+はじ / こうきゅうむきむき+1 / HP-8） | Forbidden Choice (Upgrade all cards and receive Embarrassment / permanentStrength and 1 / Lose 8 HP) |
| src/services/eventService.ts:2718 | resultLog | 背徳の快感！全カード強化。&lt;br&gt;代償に呪い「恥」を受けた。 | はいとくのかいかん！ぜんカードきょうか。&lt;br&gt;だいしょうにのろい「はじ」をうけた。 | You turned the event into a useful tool for the road ahead. Upgrade card(s).&lt;br&gt;curse " Embarrassment ". |
| src/services/eventService.ts:2721 | resultLog | 肝が据わった。&lt;br&gt;恒久ムキムキ+1。 | きもがすわった。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:2724 | resultLog | 先生に見つかって正座...&lt;br&gt;HPが8減った。 | せんせいにみつかってせいざ...&lt;br&gt;HPが8へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 8 HP. |
| src/services/eventService.ts:2727 | label | 校章を複製して商売 | こうしょうをふくせいしてしょうばい | The strange school scene offered a choice with real consequences. |
| src/services/eventService.ts:2727 | text | 奇想天外（200G / レリック / 呪い「後悔」） | きそうてんがい（200G / おたから / のろい「こうかい」） | Wild Idea (Gain 200G / Gain a relic / Receive the curse "Regret") |
| src/services/eventService.ts:2731 | resultLog | 限定グッズが完売。&lt;br&gt;200G獲得。 | げんていぐっずがかんばい。&lt;br&gt;200Gかくとく。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained 200G. |
| src/services/eventService.ts:2737 | resultLog | 公式に認められた。&lt;br&gt;レリック「図書カード」を得た。 | こうしきにみとめられた。&lt;br&gt;おたから「としょカード」をえた。 | You were officially recognized.&lt;br&gt;Gained the relic "Library Card". |
| src/services/eventService.ts:2740 | resultLog | 在庫を抱えて赤字...&lt;br&gt;呪い「後悔」を受けた。 | ざいこをかかえてあかじ...&lt;br&gt;のろい「こうかい」をうけた。 | The opportunity produced a practical reward.&lt;br&gt;Received the curse "Regret". |

#### 文化祭のポスター（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2746 | title | 文化祭のポスター | ぶんかさいのぽすたー | Culture Festival Poster |
| src/services/eventService.ts:2747 | description | 真っ白な掲示板。何か描いていく？ | まっしろなけいじばん。なにかえがいていく？ | The strange school scene offered a choice with real consequences. |
| src/services/eventService.ts:2749 | label | 大胆に描く | だいたんにえがく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2749 | text | 創作（カード変化 / 90G / 呪い） | そうさく（カードへんか / 90G / のろい） | Creation (Transform 1 card / Gain 90G / Receive a curse) |
| src/services/eventService.ts:2760 | resultLog | 閃きでカードが1枚変化した！ | ひらめきでカードが1まいへんかした！ | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:2763 | resultLog | 作品が採用され、90G獲得。 | さくひんがさいようされ、90Gかくとく。 | Your effort was recognized and turned into a stronger result. Gained 90G. |
| src/services/eventService.ts:2766 | resultLog | 絵がSNSで拡散されて赤面...&lt;br&gt;呪い「恥」を受けた。 | えがSNSでかくさんされてせきめん...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:2769 | label | 丁寧に清掃する | ていねいにせいそうする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2769 | text | 整頓（カード削除 / HP+8） | せいとん（カードさくじょ / HP+8） | Tidying Up (Remove 1 card / Heal 8 HP) |
| src/services/eventService.ts:2784 | resultLog | 掲示板を綺麗にした。&lt;br&gt;「あかり」を消し去った。 | けいじばんをきれいにした。&lt;br&gt;「あかり」をけしさった。 | You cleaned up the bulletin board.&lt;br&gt;Erased "Akari". |
| src/services/eventService.ts:2788 | resultLog | 作業後の達成感でHPが8回復。 | さぎょうのちのたっせいかんでHPが8かいふく。 | The short break helped your body and mind recover. Heal 8 HP. |
| src/services/eventService.ts:2793 | label | 実行委員として調整 | じっこういいんとしてちょうせい | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2793 | text | 運営（カード1枚強化 / 最大HP+3 / HP-5） | うんえい（カード1まいきょうか / さいだいHP+3 / HP-5） | Operations (Upgrade 1 cards / Increase max HP by 3 / Lose 5 HP) |
| src/services/eventService.ts:2807 | resultLog | 采配が冴えた。&lt;br&gt;「あかり」が強化された。 | さいはいがさえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:2812 | resultLog | 段取り力が身についた。&lt;br&gt;最大HPと現在HPが3増えた。 | だんどりちからがみについた。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | Turning the situation into a plan made the next step easier to take.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:2815 | resultLog | 徹夜作業でへとへと...&lt;br&gt;HPが5減った。 | てつやさぎょうでへとへと...&lt;br&gt;HPが5へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:2818 | label | 巨大立体ポスターを建造 | きょだいりったいぽすたーをけんぞう | Large ー |
| src/services/eventService.ts:2818 | text | 奇想天外（レリック / 170G / 呪い「後悔」） | きそうてんがい（おたから / 170G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 170G / Receive the curse "Regret") |
| src/services/eventService.ts:2825 | resultLog | 作品が伝説になった。&lt;br&gt;レリック「インク瓶」を得た。 | さくひんがでんせつになった。&lt;br&gt;おたから「いんくかめ」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Ink Bottle". |
| src/services/eventService.ts:2828 | resultLog | スポンサーがついて170G獲得。 | すぽんさーがついて170Gかくとく。 | Your effort was recognized and turned into a stronger result. Gained 170G. |
| src/services/eventService.ts:2831 | resultLog | 搬入で壊れてしまった...&lt;br&gt;呪い「後悔」を受けた。 | はんにゅうでこわれてしまった...&lt;br&gt;のろい「こうかい」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Regret". |

#### 不気味な音楽室（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2837 | title | 不気味な音楽室 | ぶきみなおんがくしつ | Eerie Music Room |
| src/services/eventService.ts:2838 | description | 誰もいないのにピアノの音が聞こえる。ベートーヴェンの肖像画がこっちを見ている気がする。 | だれもいないのにぴあののおとがきこえる。べーとーゔぇんのしょうぞうがこっちをみているきがする。 | You hear piano music even though no one is there. Beethoven's portrait seems to be staring at you. |
| src/services/eventService.ts:2840 | label | 一緒に弾く | いっしょにひく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2840 | text | 共演（反響カード / HP-15 / 120G） | きょうえん（はんきょうカード / HP-15 / 120G） | Joint Performance (Card / Lose 15 HP / Gain 120G) |
| src/services/eventService.ts:2850 | resultLog | 死の舞踏！HP-15。&lt;br&gt;「予習復習(反響)」を習得した。 | しのぶとう！HP-15。&lt;br&gt;「よしゅうふくしゅう(はんきょう)」をしゅうとくした。 | You handled the moment and carried its outcome into what came next. Lost 15 HP.&lt;br&gt;Learned "Preview and Review( )". |
| src/services/eventService.ts:2853 | resultLog | 幽霊オーケストラの謝礼を受け取った。&lt;br&gt;HP-15、120G獲得。 | ゆうれいおーけすとらのしゃれいをうけとった。&lt;br&gt;HP-15、120Gかくとく。 | Your helpful action was noticed, and you received thanks in return.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:2856 | resultLog | 演奏だけが残り、体力は無事だった。&lt;br&gt;120G獲得。 | えんそうだけがのこり、たいりょくはぶじだった。&lt;br&gt;120Gかくとく。 | The short break helped your body and mind recover.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:2859 | label | 調律する | ちょうりつする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2859 | text | 技術（カード2枚強化 / HP+8 / 呪い） | ぎじゅつ（カード2まいきょうか / HP+8 / のろい） | Technique (Upgrade 2 cards / Heal 8 HP / Receive a curse) |
| src/services/eventService.ts:2868 | resultLog | 音の粒が揃った。&lt;br&gt;カードを2枚強化した。 | おとのつぶがそろった。&lt;br&gt;カードを2まいきょうかした。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:2871 | resultLog | 和音に癒やされた。&lt;br&gt;HPが8回復。 | わおんにいやされた。&lt;br&gt;HPが8かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:2874 | resultLog | 不協和音で頭が真っ白に...&lt;br&gt;呪いカードを1枚受け取った。 | ふきょうわおんであたまがまっしろに...&lt;br&gt;のろいカードを1まいうけとった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received 1 curse card. |
| src/services/eventService.ts:2877 | label | 逃げ出す | にげだす | Run away |
| src/services/eventService.ts:2877 | text | 撤退（カード削除 / HP+6） | てったい（カードさくじょ / HP+6） | Retreat (Remove 1 card / Heal 6 HP) |
| src/services/eventService.ts:2892 | resultLog | 脱兎のごとく逃げた！&lt;br&gt;「あかり」が飛んだ。 | だっとのごとくにげた！&lt;br&gt;「あかり」がとんだ。 | You fled like a startled rabbit! Lost "Akari". |
| src/services/eventService.ts:2896 | resultLog | 助かった安堵でHPが6回復。 | たすかったあんどでHPが6かいふく。 | The short break helped your body and mind recover. Heal 6 HP. |
| src/services/eventService.ts:2901 | label | 肖像画とデュオ配信 | しょうぞうがとでゅおはいしん | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2901 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:2908 | resultLog | 怪演が評価された。&lt;br&gt;レリック「飼育小屋のえさ皿」を得た。 | かいえんがひょうかされた。&lt;br&gt;おたから「しいくこやのえささら」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Animal Shed Food Dish". |
| src/services/eventService.ts:2911 | resultLog | 配信収益で180G獲得。 | はいしんしゅうえきで180Gかくとく。 | The opportunity produced a practical reward. Gained 180G. |
| src/services/eventService.ts:2914 | resultLog | 肖像画が無言でドン引きしていた...&lt;br&gt;呪い「恥」を受けた。 | しょうぞうがむごんでどんひきしていた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 屋上の柵（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:2920 | title | 屋上の柵 | おくじょうのさく | Rooftop Fence |
| src/services/eventService.ts:2921 | description | 屋上のフェンスが一部壊れている。外の景色がよく見える。 | おくじょうのふぇんすがいちぶこわれている。そとのけしきがよくみえる。 | The risky choice backfired and left you with a setback. |
| src/services/eventService.ts:2923 | label | 思い切り叫ぶ | おもいきりさけぶ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2923 | text | 解放（全回復+最大HP-5 / 120G / HP+8） | かいほう（ぜんかいふく+さいだいHP-5 / 120G / HP+8） | Minigame unlock status (Heal to full HP. and maximumHP -5 / Gain 120G / Heal 8 HP) |
| src/services/eventService.ts:2930 | resultLog | 叫んでスッキリ！&lt;br&gt;HP全回復、最大HP-5。 | さけんですっきり！&lt;br&gt;HPぜんかいふく、さいだいHP-5。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;The short break helped your body and mind recover. Heal to full HP. |
| src/services/eventService.ts:2933 | resultLog | 声が校庭まで届き、出演依頼が来た。&lt;br&gt;120G獲得。 | こえがこうていまでとどき、しゅつえんいらいがきた。&lt;br&gt;120Gかくとく。 | You noticed the opening and turned it into an advantage.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:2936 | resultLog | 胸のつかえが取れた。&lt;br&gt;HPが8回復。 | むねのつかえがとれた。&lt;br&gt;HPが8かいふく。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:2939 | label | 景色を眺める | けしきをながめる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2939 | text | 静観（チャイム砂時計+後悔 / カード削除） | せいかん（チャイムすなどけい+こうかい / カードさくじょ） | Wait and Watch (Chime Hourglass and Regret / Remove 1 card) |
| src/services/eventService.ts:2949 | resultLog | 時を忘れて佇んだ。&lt;br&gt;レリック「チャイム砂時計」を得たが、呪い「後悔」を受けた。 | ときをわすれてちょんだ。&lt;br&gt;おたから「チャイムすなどけい」をえたが、のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;relic " clock " gained, curse " Regret ". |
| src/services/eventService.ts:2963 | resultLog | 考えが整理された。&lt;br&gt;「あかり」を取り除いた。 | かんがえがせいりされた。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:2970 | label | フェンスを直す | ふぇんすをなおす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2970 | text | 修繕（恒久ムキムキ+1 / 最大HP+4 / HP-6） | しゅうぜん（こうきゅうむきむき+1 / さいだいHP+4 / HP-6） | Repair (permanentStrength and 1 / Increase max HP by 4 / Lose 6 HP) |
| src/services/eventService.ts:2974 | resultLog | 重作業で鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | じゅうさくぎょうできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:2977 | resultLog | 達成感でみなぎる。&lt;br&gt;最大HPと現在HPが4増えた。 | たっせいかんでみなぎる。&lt;br&gt;さいだいHPとげんざいHPが4ふえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP and current HP +4. |
| src/services/eventService.ts:2980 | resultLog | 工具を落として負傷...&lt;br&gt;HPが6減った。 | こうぐをおとしてふしょう...&lt;br&gt;HPが6へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:2983 | label | 屋上ラジオ局を開設 | おくじょうらじおきょくをかいせつ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:2983 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:2990 | resultLog | 屋上名物になった。&lt;br&gt;レリック「ミニ校舎模型」を得た。 | おくじょうめいぶつになった。&lt;br&gt;おたから「みにこうしゃもけい」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Mini School Model". |
| src/services/eventService.ts:2993 | resultLog | スポンサー契約成立。&lt;br&gt;180G獲得。 | すぽんさーけいやくせいりつ。&lt;br&gt;180Gかくとく。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained 180G. |
| src/services/eventService.ts:2996 | resultLog | 放送事故で赤面...&lt;br&gt;呪い「恥」を受けた。 | ほうそうじこでせきめん...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 給食の残飯処理（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3002 | title | 給食の残飯処理 | きゅうしょくのざんぱんしょり | School Lunch Leftovers |
| src/services/eventService.ts:3003 | description | バケツ一杯の残飯。誰かが片付けなければならない。 | ばけついっぱいのざんぱん。だれかがかたづけなければならない。 | You cleared away something unnecessary and made room to move forward. |
| src/services/eventService.ts:3005 | label | 責任を持って食べる | せきにんをもってたべる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3005 | text | 気合（HP+20+寄生虫 / 90G / HP-8） | きあい（HP+20+きせいちゅう / 90G / HP-8） | Fighting Spirit (Your Status. If your HP reaches 0, you lose. Use Block to prevent enemy attacks. Block becomes 0 at the end of the turn. / Gain 90G / Lose 8 HP) |
| src/services/eventService.ts:3015 | resultLog | 完食した！HPが20回復。&lt;br&gt;だが呪い「寄生虫」を受けた。 | かんしょくした！HPが20かいふく。&lt;br&gt;だがのろい「きせいちゅう」をうけた。 | The short break helped your body and mind recover. Heal 20 HP.&lt;br&gt;Received the curse "Parasite". |
| src/services/eventService.ts:3018 | resultLog | 給食委員の謝礼として90G獲得。 | きゅうしょくいいんのしゃれいとして90Gかくとく。 | Your helpful action was noticed, and you received thanks in return. Gained 90G. |
| src/services/eventService.ts:3021 | resultLog | お腹が重すぎる...&lt;br&gt;HPが8減った。 | おはらがおもすぎる...&lt;br&gt;HPが8へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 8 HP. |
| src/services/eventService.ts:3024 | label | 土に還す | つちにかえす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3024 | text | 循環（再起動カード / カード削除） | じゅんかん（さいきどうカード / カードさくじょ） | Cycle (Gain Reboot Card / Remove 1 card) |
| src/services/eventService.ts:3031 | resultLog | 循環の尊さを学んだ。&lt;br&gt;カード「再起動」を習得。 | じゅんかんのとーとさをまなんだ。&lt;br&gt;カード「さいきどう」をしゅうとく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:3045 | resultLog | 気持ちの整理がついた。&lt;br&gt;「あかり」を取り除いた。 | きもちのせいりがついた。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3049 | resultLog | 静かに片付けが終わった。 | しずかにかたづけがおわった。 | You cleared away something unnecessary and made room to move forward. |
| src/services/eventService.ts:3052 | label | 配膳計画を組み直す | はいぜんけいかくをくみなおす | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:3052 | text | 改善（カード1枚強化 / HP+8 / 呪い） | かいぜん（カード1まいきょうか / HP+8 / のろい） | Improvement (Upgrade 1 cards / Heal 8 HP / Receive a curse) |
| src/services/eventService.ts:3066 | resultLog | 運用改善に成功。&lt;br&gt;「あかり」が強化された。 | うんようかいぜんにせいこう。&lt;br&gt;「あかり」がきょうかされた。 | You succeeded in improving the operation.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:3071 | resultLog | 混乱が減って気分が楽になった。&lt;br&gt;HPが8回復。 | こんらんがへってきぶんがらくになった。&lt;br&gt;HPが8かいふく。 | The risky choice backfired and left you with a setback.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:3074 | resultLog | 提案が通らず気まずい...&lt;br&gt;呪い「不安」を受けた。 | ていあんがとうらずきまずい...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:3077 | label | 残飯アート展を開催 | ざんぱんあーとてんをかいさい | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3077 | text | 奇想天外（レリック / 160G / 呪い「恥」） | きそうてんがい（おたから / 160G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 160G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3084 | resultLog | 作品が芸術祭で入賞。&lt;br&gt;レリック「図工の魚皿」を得た。 | さくひんがげいじゅつまつりでにゅうしょう。&lt;br&gt;おたから「ずこうのさかなざら」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Art Room Fish Plate". |
| src/services/eventService.ts:3087 | resultLog | 入場料で160G獲得。 | にゅうじょうりょうで160Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 160G. |
| src/services/eventService.ts:3090 | resultLog | 匂いで会場騒然...&lt;br&gt;呪い「恥」を受けた。 | においでかいじょうそうぜん...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 昇降口の下履き（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3096 | title | 昇降口の下履き | しょうこうくちのしたばきき | Entryway Shoes |
| src/services/eventService.ts:3097 | description | 誰かの靴が散乱している。揃えてあげる？ | だれかのくつがさんらんしている。そろえてあげる？ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3099 | label | 綺麗に揃える | きれいにそろえる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3099 | text | 善行（角笛 / HP+8 / カード削除） | ぜんこう（つのぶえ / HP+8 / カードさくじょ） | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:3106 | resultLog | 徳を積んだ。&lt;br&gt;レリック「上履き」を得た。 | とくをつんだ。&lt;br&gt;おたから「うわばき」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Indoor Shoes". |
| src/services/eventService.ts:3109 | resultLog | 気持ちが整った。&lt;br&gt;HPが8回復。 | きもちがととのった。&lt;br&gt;HPが8かいふく。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:3123 | resultLog | 余計な癖が一つ消えた。&lt;br&gt;「あかり」を取り除いた。 | よけいなくせがひとつきえた。&lt;br&gt;「あかり」をとりのぞいた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3128 | label | 靴の持ち主を探す | くつのもちぬしをさがす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3128 | text | 奔走（カード1枚強化 / 80G / HP-5） | ほんそう（カード1まいきょうか / 80G / HP-5） | Running Around (Upgrade 1 cards / Gain 80G / Lose 5 HP) |
| src/services/eventService.ts:3142 | resultLog | 聞き込みで洞察が冴えた。&lt;br&gt;「あかり」が強化された。 | ききこみでどうさつがさえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:3147 | resultLog | お礼として80G獲得。 | おれいとして80Gかくとく。 | Your careful choice helped someone and improved the situation. Gained 80G. |
| src/services/eventService.ts:3150 | resultLog | 走り回って疲れた...&lt;br&gt;HPが5減った。 | はしりまわってつかれた...&lt;br&gt;HPが5へった。 | The short break helped your body and mind recover.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:3153 | label | こっそり隠す | こっそりかくす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3153 | text | 悪戯（100G+恥 / 恒久ムキムキ+1 / 呪い「後悔」） | いたずら（100G+はじ / こうきゅうむきむき+1 / のろい「こうかい」） | Prank (100G and Embarrassment / permanentStrength and 1 / Receive the curse "Regret") |
| src/services/eventService.ts:3163 | resultLog | 靴から100Gを見つけた。&lt;br&gt;呪い「恥」を受けた。 | くつから100Gをみつけた。&lt;br&gt;のろい「はじ」をうけた。 | You found a small reward and put the extra money to use.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:3166 | resultLog | 逃げ足が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | にげあしがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:3169 | resultLog | やりすぎたかもしれない...&lt;br&gt;呪い「後悔」を受けた。 | やりすぎたかもしれない...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |
| src/services/eventService.ts:3172 | label | 靴を並べてアート作品 | くつをなべてあーとさくひん | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:3172 | text | 奇想天外（レリック / 140G / 呪い「恥」） | きそうてんがい（おたから / 140G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 140G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3179 | resultLog | 展示が話題に。&lt;br&gt;レリック「スマイルシール」を得た。 | てんじがわだいに。&lt;br&gt;おたから「すまいるしーる」をえた。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Gained the relic "Smile Sticker". |
| src/services/eventService.ts:3182 | resultLog | 観覧料で140G獲得。 | かんらんりょうで140Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 140G. |
| src/services/eventService.ts:3185 | resultLog | 先生に怒られて公開反省...&lt;br&gt;呪い「恥」を受けた。 | せんせいにいかられてこうかいはんせい...&lt;br&gt;のろい「はじ」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Embarrassment". |

#### 二宮金次郎の背負い物（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3191 | title | 二宮金次郎の背負い物 | にのみやきんじろうのせおいもの | Ninomiya Kinjiro's Bundle |
| src/services/eventService.ts:3192 | description | 夜になると動き出すという石像。背負っている薪（まき）が重そうだ。 | よるになるとうごきだすというせきぞう。せおっているたきぎ（まき）がおもそうだ。 | A stone statue said to move at night. The bundle of firewood on its back looks heavy. |
| src/services/eventService.ts:3194 | label | 薪運びを手伝う | たきぎはこびをてつだう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3194 | text | 献身（最大HP+10 / HP-10 / 100G） | けんしん（さいだいHP+10 / HP-10 / 100G） | Devotion (Increase max HP by 10 / Lose 10 HP / Gain 100G) |
| src/services/eventService.ts:3201 | resultLog | 重労働をやり切った。&lt;br&gt;最大HP+10、HP-10。 | じゅうろうどうをやりきった。&lt;br&gt;さいだいHP+10、HP-10。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained +10 Max HP and lost 10 HP. |
| src/services/eventService.ts:3204 | resultLog | 感謝の薪代として100G獲得。 | かんしゃのたきぎだいとして100Gかくとく。 | Your careful choice helped someone and improved the situation. Gained 100G. |
| src/services/eventService.ts:3207 | resultLog | 想像以上に重かった...&lt;br&gt;HPが10減った。 | そうぞういじょうにおもかった...&lt;br&gt;HPが10へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 10 HP. |
| src/services/eventService.ts:3210 | label | 読書を教わる | どくしょをおそわる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3210 | text | 学び（カード2枚強化 / HP+8 / 呪い「不安」） | まなび（カード2まいきょうか / HP+8 / のろい「ふあん」） | Learning (Upgrade 2 cards / Heal 8 HP / Receive the curse "Anxiety") |
| src/services/eventService.ts:3219 | resultLog | 読書の芯を掴んだ。&lt;br&gt;カードを2枚強化した。 | どくしょのしんをつかんだ。&lt;br&gt;カードを2まいきょうかした。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:3222 | resultLog | 心が落ち着いた。&lt;br&gt;HPが8回復。 | こころがおちついた。&lt;br&gt;HPが8かいふく。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:3225 | resultLog | 偉人すぎて比較してしまう...&lt;br&gt;呪い「不安」を受けた。 | いじんすぎてひかくしてしまう...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:3228 | label | 本を借りる（無断） | ほんをかりる（むだん） | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3228 | text | 危険（辞書+骨折 / 120G / カード削除） | きけん（じしょ+こっせつ / 120G / カードさくじょ） | dangerous ( + Injury / 120G / card ) |
| src/services/eventService.ts:3238 | resultLog | 分厚い辞書を手に入れた。&lt;br&gt;だが反撃で呪い「骨折」を受けた。 | ぶあついじしょをてにいれた。&lt;br&gt;だがはんげきでのろい「こっせつ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Injury". |
| src/services/eventService.ts:3241 | resultLog | 古紙回収で120Gを得た。 | こしかいしゅうで120Gをえた。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3255 | resultLog | 大事なノートを落とした...&lt;br&gt;「あかり」を失った。 | だいじなのーとをおとした...&lt;br&gt;「あかり」をうしなった。 | The study moment clarified what you needed to understand next.&lt;br&gt;Lost "Akari". |
| src/services/eventService.ts:3260 | label | 石像と深夜読書会 | せきぞうとしんやどくしょかい | Hold a midnight reading club with the statue |
| src/services/eventService.ts:3260 | text | 奇想天外（レリック / 恒久ムキムキ+1 / 呪い「恥」） | きそうてんがい（おたから / こうきゅうむきむき+1 / のろい「はじ」） | Wild Idea (Gain a relic / permanentStrength and 1 / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3267 | resultLog | 時を忘れる名著会だった。&lt;br&gt;レリック「チャイム時計」を得た。 | ときをわすれるめいちょかいだった。&lt;br&gt;おたから「ちゃいむとけい」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Chime Clock". |
| src/services/eventService.ts:3270 | resultLog | 薪運び読書会で鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | たきぎはこびどくしょかいできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:3273 | resultLog | 巡回の先生に見つかった...&lt;br&gt;呪い「恥」を受けた。 | じゅんかいのせんせいにみつかった...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 保健室の視力検査（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3279 | title | 保健室の視力検査 | ほけんしつのしりょくけんさ | Infirmary Eye Exam |
| src/services/eventService.ts:3280 | description | 「C」の向きを答えてください。全問正解でお宝です。 | 「C」のむきをこたえてください。ぜんもんせいかいでおたからです。 | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:3282 | label | 真面目に受ける | まじめにうける | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3282 | text | 検査（スネッコアイ / 虚無 / HP+6） | けんさ（すねっこあい / きょむ / HP+6） | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3289 | resultLog | 全問正解！&lt;br&gt;レリック「ぐるぐるメガネ」を得た。 | ぜんもんせいかい！&lt;br&gt;おたから「ぐるぐるめがね」をえた。 | The study moment clarified what you needed to understand next.&lt;br&gt;Gained the relic "Swirly Glasses". |
| src/services/eventService.ts:3292 | resultLog | 見間違いが続いた...&lt;br&gt;状態異常「虚無」を受けた。 | みまちがいがつづいた...&lt;br&gt;じょうたいいじょう「きょむ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the status "Void". |
| src/services/eventService.ts:3295 | resultLog | 目薬でスッキリ。&lt;br&gt;HPが6回復。 | めぐすりですっきり。&lt;br&gt;HPが6かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 6 HP. |
| src/services/eventService.ts:3298 | label | ランドルト環を暗記する | らんどるとかんをあんきする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3298 | text | 対策（カード強化 / 70G） | たいさく（カードきょうか / 70G） | Countermeasure (Upgrade 1 card / Gain 70G) |
| src/services/eventService.ts:3312 | resultLog | 観察眼が鋭くなった。&lt;br&gt;「あかり」が強化された。 | かんさつめがするどくなった。&lt;br&gt;「あかり」がきょうかされた。 | Your eye for observation grew sharper.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:3317 | resultLog | 検査補助の謝礼で70G獲得。 | けんさほじょのしゃれいで70Gかくとく。 | Your helpful action was noticed, and you received thanks in return. Gained 70G. |
| src/services/eventService.ts:3319 | resultLog | ほどほどの結果で終わった。 | ほどほどのけっかでおわった。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3322 | label | 検査から逃げる | けんさからにげる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3322 | text | 回避（カード削除 / HP-5 / 呪い「不安」） | かいひ（カードさくじょ / HP-5 / のろい「ふあん」） | Dodge (Remove 1 card / Lose 5 HP / Receive the curse "Anxiety") |
| src/services/eventService.ts:3337 | resultLog | 面倒を一つ手放した。&lt;br&gt;「あかり」を取り除いた。 | めんどうをひとつてばなした。&lt;br&gt;「あかり」をとりのぞいた。 | You let go of one troublesome burden.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3342 | resultLog | 廊下ダッシュで消耗...&lt;br&gt;HPが5減った。 | ろうかだっしゅでしょうもう...&lt;br&gt;HPが5へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:3345 | resultLog | 視力が気になって落ち着かない...&lt;br&gt;呪い「不安」を受けた。 | しりょくがきになっておちつかない...&lt;br&gt;のろい「ふあん」をうけた。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:3348 | label | Cの向き占い師になる | Cのむきうらないしになる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3348 | text | 奇想天外（レリック / 150G / 呪い「恥」） | きそうてんがい（おたから / 150G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 150G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3355 | resultLog | 占いが当たりまくる。&lt;br&gt;レリック「観察メモ」を得た。 | うらないがあたりまくる。&lt;br&gt;おたから「かんさつめも」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Observation Notes". |
| src/services/eventService.ts:3358 | resultLog | 行列ができて150G獲得。 | ぎょうれつができて150Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 150G. |
| src/services/eventService.ts:3361 | resultLog | 全部ハズして気まずい...&lt;br&gt;呪い「恥」を受けた。 | ぜんぶはずしてきまずい...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 図書室の貸出カード（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3367 | title | 図書室の貸出カード | としょしつのたいしゅつカード | Library Checkout Card |
| src/services/eventService.ts:3368 | description | 自分の名前が書かれた古い貸出カードを見つけた。昔の自分からのメッセージだ。 | じぶんのなまえがかかれたふるいたいしゅつカードをみつけた。むかしのじぶんからのめっせーじだ。 | You find an old checkout card with your name on it. It is a message from your past self. |
| src/services/eventService.ts:3370 | label | 読み返す | よみかえす | Read it again |
| src/services/eventService.ts:3370 | text | 回想（カード強化+HP+5 / 最大HP+3） | かいそう（カードきょうか+HP+5 / さいだいHP+3） | times (Upgrade card(s). and 5 / Increase max HP by 3) |
| src/services/eventService.ts:3385 | resultLog | 昔の言葉に背中を押された。&lt;br&gt;HPが5回復し「あかり」が強化された。 | むかしのことばにせなかをおされた。&lt;br&gt;HPが5かいふくし「あかり」がきょうかされた。 | Old words gave you a push forward.&lt;br&gt;Healed 5 HP, and "Akari" was upgraded. |
| src/services/eventService.ts:3390 | resultLog | 初心を思い出した。&lt;br&gt;最大HPと現在HPが3増えた。 | しょしんをおもいだした。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:3395 | label | 新しいメモを書き足す | あたらしいめもをかきたす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3395 | text | 前進（カード2枚強化 / 80G / 呪い「不安」） | ぜんしん（カード2まいきょうか / 80G / のろい「ふあん」） | Move Forward (Upgrade 2 cards / Gain 80G / Receive the curse "Anxiety") |
| src/services/eventService.ts:3404 | resultLog | 目標を書き出して頭が冴えた。&lt;br&gt;カードを2枚強化した。 | もくひょうをかきだしてあたまがさえた。&lt;br&gt;カードを2まいきょうかした。 | Turning the situation into a plan made the next step easier to take.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:3407 | resultLog | 学級文庫の手伝い報酬で80G獲得。 | がっきゅうぶんこのてつだいほうしゅうで80Gかくとく。 | Your effort paid off and earned a useful reward. Gained 80G. |
| src/services/eventService.ts:3410 | resultLog | 未来を考えすぎて不安に...&lt;br&gt;呪い「不安」を受けた。 | みらいをかんがえすぎてふあんに...&lt;br&gt;のろい「ふあん」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:3413 | label | 捨てる | すてる | Throw it away |
| src/services/eventService.ts:3413 | text | 決別（カード削除 / 恒久ムキムキ+1 / 呪い「後悔」） | けつべつ（カードさくじょ / こうきゅうむきむき+1 / のろい「こうかい」） | Parting Ways (Remove 1 card / permanentStrength and 1 / Receive the curse "Regret") |
| src/services/eventService.ts:3428 | resultLog | 過去を断ち切った。&lt;br&gt;「あかり」を取り除いた。 | かこをたちきった。&lt;br&gt;「あかり」をとりのぞいた。 | You cut yourself free from the past.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3432 | resultLog | 覚悟が決まった。&lt;br&gt;恒久ムキムキ+1。 | かくごがきまった。&lt;br&gt;こうきゅうむきむき+1。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:3435 | resultLog | 捨てた直後に懐かしくなった...&lt;br&gt;呪い「後悔」を受けた。 | すてたちょくごになつかしくなった...&lt;br&gt;のろい「こうかい」をうけた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Received the curse "Regret". |
| src/services/eventService.ts:3438 | label | 貸出カードをNFT化 | たいしゅつカードをNFTか | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:3438 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3445 | resultLog | デジタル遺産として評価された。&lt;br&gt;レリック「小物入れ」を得た。 | でじたるいさんとしてひょうかされた。&lt;br&gt;おたから「こものいれれ」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Tiny Case". |
| src/services/eventService.ts:3448 | resultLog | 購入希望者が現れて180G獲得。 | こうにゅうきぼうものがあらわれて180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:3451 | resultLog | 誰にも理解されず気まずい...&lt;br&gt;呪い「恥」を受けた。 | だれにもりかいされずきまずい...&lt;br&gt;のろい「はじ」をうけた。 | The study moment clarified what you needed to understand next.&lt;br&gt;Received the curse "Embarrassment". |

#### 飼育小屋の掃除（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3457 | title | 飼育小屋の掃除 | しいくこやのそうじ | Animal Shed Cleaning |
| src/services/eventService.ts:3458 | description | ニワトリのフンがすごい。掃除をすれば何か見つかるかも？ | にわとりのふんがすごい。そうじをすればなにかみつかるかも？ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3460 | label | 本気で掃除する | ほんきでそうじする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3460 | text | 労働（HP-5+ポーション / 90G / カード削除） | ろうどう（HP-5+ポーション / 90G / カードさくじょ） | labor (HP -5+potion / Gain 90G / Remove 1 card) |
| src/services/eventService.ts:3473 | resultLog | ぴかぴかにした！&lt;br&gt;HP-5だがポーションを見つけた。 | ぴかぴかにした！&lt;br&gt;HP-5だがポーションをみつけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. Gain a potion. |
| src/services/eventService.ts:3476 | resultLog | 手当として90G獲得。 | てあとして90Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 90G. |
| src/services/eventService.ts:3490 | resultLog | 無駄を捨てる決心がついた。&lt;br&gt;「あかり」を取り除いた。 | むだをすてるけっしんがついた。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3494 | label | ニワトリと遊ぶ | にわとりとあそぶ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3494 | text | 交流（HP+10+後悔 / 恒久ムキムキ+1） | こうりゅう（HP+10+こうかい / こうきゅうむきむき+1） | Interaction (HP +10+Regret / permanentStrength and 1) |
| src/services/eventService.ts:3504 | resultLog | 癒やされてHP+10。&lt;br&gt;でも当番を忘れて呪い「後悔」。 | いやされてHP+10。&lt;br&gt;でもとうばんをわすれてのろい「こうかい」。 | You took a moment to recover and regain your rhythm.&lt;br&gt;The risky choice backfired and left you with a setback. |
| src/services/eventService.ts:3507 | resultLog | 追いかけっこで鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | おいかけっこできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:3512 | label | 餌の配合を研究 | えさのはいごうをけんきゅう | You refined what you learned and turned it into a practical advantage. |
| src/services/eventService.ts:3512 | text | 研究（カード1枚強化 / 最大HP+3 / 呪い） | けんきゅう（カード1まいきょうか / さいだいHP+3 / のろい） | Research (Upgrade 1 cards / Increase max HP by 3 / Receive a curse) |
| src/services/eventService.ts:3526 | resultLog | 飼育理論が応用できた。&lt;br&gt;「あかり」が強化された。 | しいくりろんがおうようできた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:3531 | resultLog | 生活リズムが整った。&lt;br&gt;最大HPと現在HPが3増えた。 | せいかつりずむがととのった。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:3534 | resultLog | 正解が分からなくなった...&lt;br&gt;呪い「不安」を受けた。 | せいかいがわからなくなった...&lt;br&gt;のろい「ふあん」をうけた。 | The study moment clarified what you needed to understand next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:3537 | label | 飼育小屋ライブ配信 | しいくこやらいぶはいしん | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3537 | text | 奇想天外（レリック / 150G / 呪い「恥」） | きそうてんがい（おたから / 150G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 150G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3544 | resultLog | 人気企画になった。&lt;br&gt;レリック「飼育小屋のえさ皿」を得た。 | にんききかくになった。&lt;br&gt;おたから「しいくこやのえささら」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Animal Shed Food Dish". |
| src/services/eventService.ts:3547 | resultLog | 視聴者から投げ銭で150G獲得。 | しちょうしゃからなげせんで150Gかくとく。 | Your effort paid off and earned a useful reward. Gained 150G. |
| src/services/eventService.ts:3550 | resultLog | 音声が入りっぱなしだった...&lt;br&gt;呪い「恥」を受けた。 | おんせいがいりっぱなしだった...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 先生の忘れ物（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3556 | title | 先生の忘れ物 | せんせいのわすれもの | Teacher's Lost Item |
| src/services/eventService.ts:3557 | description | 職員室の廊下に先生の出席簿が落ちている。中には秘密のメモが... | しょくいんしつのろうかにせんせいのしゅっせきぼがおちている。なかにはひみつのめもが... | the staff room the hallway teacher. secret... |
| src/services/eventService.ts:3559 | label | 中を見る | なかをみる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3559 | text | 覗き見（予習セット+恥 / 120G / 呪い「後悔」） | のぞきけん（よしゅうせっと+はじ / 120G / のろい「こうかい」） | Peek (Prep Set and Embarrassment / Gain 120G / Receive the curse "Regret") |
| src/services/eventService.ts:3569 | resultLog | テスト範囲を把握した！&lt;br&gt;レリック「予習セット」を得たが、呪い「恥」を受けた。 | てすとはんいをはあくした！&lt;br&gt;おたから「よしゅうせっと」をえたが、のろい「はじ」をうけた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;relic " " gained, curse " Embarrassment ". |
| src/services/eventService.ts:3572 | resultLog | 落とし物の謝礼袋を発見。&lt;br&gt;120G獲得。 | おとしもののしゃれいふくろをはっけん。&lt;br&gt;120Gかくとく。 | Your helpful action was noticed, and you received thanks in return.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:3575 | resultLog | 見なければよかった...&lt;br&gt;呪い「後悔」を受けた。 | みなければよかった...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |
| src/services/eventService.ts:3578 | label | そのまま届ける | そのままとどける | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:3578 | text | 誠実（100G / カード削除 / HP+8） | せいじつ（100G / カードさくじょ / HP+8） | Honesty (Gain 100G / Remove 1 card / Heal 8 HP) |
| src/services/eventService.ts:3582 | resultLog | 正直者は報われる。&lt;br&gt;100G獲得。 | しょうじきものはむくわれる。&lt;br&gt;100Gかくとく。 | Your careful choice helped someone and improved the situation.&lt;br&gt;Gained 100G. |
| src/services/eventService.ts:3596 | resultLog | 気持ちが整った。&lt;br&gt;「あかり」を取り除いた。 | きもちがととのった。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3600 | resultLog | 感謝されて元気が出た。&lt;br&gt;HPが8回復。 | かんしゃされてげんきがでた。&lt;br&gt;HPが8かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:3603 | label | 先生を探して走る | せんせいをさがしてはしる | You moved through the situation cleanly and kept the momentum going. |
| src/services/eventService.ts:3603 | text | 急行（カード1枚強化 / HP-6 / 恒久ムキムキ+1） | きゅうこう（カード1まいきょうか / HP-6 / こうきゅうむきむき+1） | Rush (Upgrade 1 cards / Lose 6 HP / permanentStrength and 1) |
| src/services/eventService.ts:3617 | resultLog | 機転が効いた。&lt;br&gt;「あかり」が強化された。 | きてんがきいた。&lt;br&gt;「あかり」がきょうかされた。 | Your quick thinking paid off.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:3622 | resultLog | 階段ダッシュで息切れ...&lt;br&gt;HPが6減った。 | かいだんだっしゅでいきぎれ...&lt;br&gt;HPが6へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:3625 | resultLog | 毎日の全力疾走で鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | まいにちのぜんりょくしっそうできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:3628 | label | 出席簿を朗読会にする | しゅっせきぼをろうどくかいにする | Attendance Ledger Japanese Rodoku |
| src/services/eventService.ts:3628 | text | 奇想天外（レリック / 160G / 呪い「恥」） | きそうてんがい（おたから / 160G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 160G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3635 | resultLog | 語りが評価された。&lt;br&gt;レリック「インク瓶」を得た。 | かたりがひょうかされた。&lt;br&gt;おたから「いんくかめ」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Ink Bottle". |
| src/services/eventService.ts:3638 | resultLog | 即席イベントの収益で160G獲得。 | そくせきいべんとのしゅうえきで160Gかくとく。 | The opportunity produced a practical reward. Gained 160G. |
| src/services/eventService.ts:3641 | resultLog | 関係者が来て凍りついた...&lt;br&gt;呪い「恥」を受けた。 | かんけいしゃがきてこおりついた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 学級文庫の漫画（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3647 | title | 学級文庫の漫画 | がっきゅうぶんこのまんが | Class Library Manga |
| src/services/eventService.ts:3648 | description | ボロボロの『ジャンプ』が置いてある。続きが気になる。 | ぼろぼろの『じゃんぷ』がおいてある。つづきがきになる。 | A tattered copy of Jump is lying here. You cannot help wondering what happens next. |
| src/services/eventService.ts:3650 | label | 読む | よむ | Read it |
| src/services/eventService.ts:3650 | text | 熱中（恒久ムキムキ+2&HP-5 / カード強化 / 80G） | ねっちゅう（こうきゅうむきむき+2&amp;HP-5 / カードきょうか / 80G） | JH (permanentStrength and 2&amp;HP-5 / Upgrade 1 card / Gain 80G) |
| src/services/eventService.ts:3660 | resultLog | 友情・努力・勝利！&lt;br&gt;恒久ムキムキ+2、HP-5。 | ゆうじょう・どりょく・しょうり！&lt;br&gt;こうきゅうむきむき+2、HP-5。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;permanentStrength+2, HP -5. |
| src/services/eventService.ts:3673 | resultLog | 名台詞が刺さった。&lt;br&gt;「あかり」が強化された。 | めいぜりふがささった。&lt;br&gt;「あかり」がきょうかされた。 | A famous line struck home.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:3678 | resultLog | 付録カードが売れた。&lt;br&gt;80G獲得。 | ふろくカードがうれた。&lt;br&gt;80Gかくとく。 | You turned the event into a useful tool for the road ahead.&lt;br&gt;Gained 80G. |
| src/services/eventService.ts:3681 | label | 寄付する | きふする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3681 | text | 奉仕（カード削除 / HP+10） | ほうし（カードさくじょ / HP+10） | Service (Remove 1 card / Heal 10 HP) |
| src/services/eventService.ts:3696 | resultLog | 本棚に思い出を置いてきた。&lt;br&gt;「あかり」を取り除いた。 | ほんだなにおもいでをおいてきた。&lt;br&gt;「あかり」をとりのぞいた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3700 | resultLog | いいことをして元気が出た。&lt;br&gt;HPが10回復。 | いいことをしてげんきがでた。&lt;br&gt;HPが10かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:3705 | label | 続きの考察ノートを書く | つづきのこうさつのーとをかく | Saved adventure |
| src/services/eventService.ts:3705 | text | 考察（カード2枚強化 / 呪い「不安」 / 最大HP+3） | こうさつ（カード2まいきょうか / のろい「ふあん」 / さいだいHP+3） | Consideration (Upgrade 2 cards / Receive the curse "Anxiety" / Increase max HP by 3) |
| src/services/eventService.ts:3714 | resultLog | 考察が冴え渡る。&lt;br&gt;カードを2枚強化した。 | こうさつがさえわたる。&lt;br&gt;カードを2まいきょうかした。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:3717 | resultLog | 考察沼にハマった...&lt;br&gt;呪い「不安」を受けた。 | こうさつぬまにはまった...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:3720 | resultLog | 理解が深まり器が広がる。&lt;br&gt;最大HPと現在HPが3増えた。 | りかいがふかまりうつわがひろがる。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | The study moment clarified what you needed to understand next.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:3723 | label | 漫画評論チャンネル開設 | まんがひょうろんちゃんねるかいせつ | Launch a manga review channel |
| src/services/eventService.ts:3723 | text | 奇想天外（レリック / 170G / 呪い「恥」） | きそうてんがい（おたから / 170G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 170G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3730 | resultLog | 語りが刺さった。&lt;br&gt;レリック「スマイルシール」を得た。 | かたりがささった。&lt;br&gt;おたから「すまいるしーる」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Smile Sticker". |
| src/services/eventService.ts:3733 | resultLog | 広告収益で170G獲得。 | こうこくしゅうえきで170Gかくとく。 | The opportunity produced a practical reward. Gained 170G. |
| src/services/eventService.ts:3736 | resultLog | 炎上してコメント欄が地獄...&lt;br&gt;呪い「恥」を受けた。 | えんじょうしてこめんとらんがじごく...&lt;br&gt;のろい「はじ」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Embarrassment". |

#### 理科室のアルコールランプ（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3742 | title | 理科室のアルコールランプ | りかしつのあるこーるらんぷ | Science Room Alcohol Lamp |
| src/services/eventService.ts:3743 | description | 火がついたまま放置されている。危ない！ | ひがついたままほうちされている。あぶない！ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3745 | label | 安全に消火する | あんぜんにしょうかする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3745 | text | 冷静（防御強化 / HP+6） | れいせい（ぼうぎょきょうか / HP+6） | Calm Judgment (Improve defense / Heal 6 HP) |
| src/services/eventService.ts:3759 | resultLog | 冷静な判断だ。&lt;br&gt;防御カードが強化された。 | れいせいなはんだんだ。&lt;br&gt;ぼうぎょカードがきょうかされた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. Upgrade card(s). |
| src/services/eventService.ts:3763 | resultLog | 緊張を乗り越えた。&lt;br&gt;HPが6回復。 | きんちょうをのりこえた。&lt;br&gt;HPが6かいふく。 | The risky choice backfired and left you with a setback.&lt;br&gt;Heal 6 HP. |
| src/services/eventService.ts:3768 | label | 実験を手伝う | じっけんをてつだう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3768 | text | 挑戦（カード1枚強化 / ポーション / HP-6） | ちょうせん（カード1まいきょうか / ポーション / HP-6） | Choose Option (Upgrade 1 cards / Gain a potion / Lose 6 HP) |
| src/services/eventService.ts:3782 | resultLog | 実験成功！&lt;br&gt;「あかり」が強化された。 | じっけんせいこう！&lt;br&gt;「あかり」がきょうかされた。 | The experiment succeeded!&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:3788 | resultLog | 実験の副産物をもらった。&lt;br&gt;ポーションを入手。 | じっけんのふくさんぶつをもらった。&lt;br&gt;ポーションをにゅうしゅ。 | The opportunity produced a practical reward.&lt;br&gt;Obtained a potion. |
| src/services/eventService.ts:3791 | resultLog | 火傷してしまった...&lt;br&gt;HPが6減った。 | やけどしてしまった...&lt;br&gt;HPが6へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:3794 | label | 火遊びする | ひあそびする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3794 | text | 危険（最大HP+5+火傷3枚 / 120G / 呪い） | きけん（さいだいHP+5+やけど3まい / 120G / のろい） | dangerous (Increase max HP by 5. / Gain 120G / Receive a curse) |
| src/services/eventService.ts:3809 | resultLog | スリルでみなぎる。&lt;br&gt;最大HP+5、ただし火傷カード3枚。 | すりるでみなぎる。&lt;br&gt;さいだいHP+5、ただしやけどカード3まい。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. Increase max HP by 5. |
| src/services/eventService.ts:3812 | resultLog | 実演ショーで120G獲得。 | じつえんしょーで120Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 120G. |
| src/services/eventService.ts:3815 | resultLog | やりすぎて反省...&lt;br&gt;呪い「後悔」を受けた。 | やりすぎてはんせい...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |
| src/services/eventService.ts:3818 | label | 炎の精と契約する | ほのおのせいとけいやくする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3818 | text | 奇想天外（レリック / 恒久ムキムキ+1 / 呪い「恥」） | きそうてんがい（おたから / こうきゅうむきむき+1 / のろい「はじ」） | Wild Idea (Gain a relic / permanentStrength and 1 / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3825 | resultLog | 未知の知識を授かった。&lt;br&gt;レリック「星座早見盤」を得た。 | みちのちしきをさずかった。&lt;br&gt;おたから「せいざはやみばん」をえた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Gained the relic "Star Chart". |
| src/services/eventService.ts:3828 | resultLog | 熱気で鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | ねっきできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:3831 | resultLog | 詠唱を聞かれてしまった...&lt;br&gt;呪い「恥」を受けた。 | えいしょうをきかれてしまった...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 音楽室の肖像画（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3837 | title | 音楽室の肖像画 | おんがくしつのしょうぞうが | Music Room Portrait |
| src/services/eventService.ts:3838 | description | バッハの目が動いた気がする。何か言いたそうだ。 | ばっはのめがうごいたきがする。なにかいいたそうだ。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3840 | label | 肖像画に向かって歌う | しょうぞうがにむかってうたう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3840 | text | 共鳴（最大エナジー+1&HP-10 / 120G / HP+8） | きょうめい（さいだいえなじー+1&amp;HP-10 / 120G / HP+8） | Resonance (LargeEnergy and 1&amp;HP-10 / Gain 120G / Heal 8 HP) |
| src/services/eventService.ts:3851 | resultLog | 魂の歌が響いた。&lt;br&gt;最大エナジー+1、HP-10。 | たましいのうたがひびいた。&lt;br&gt;さいだいえなじー+1、HP-10。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You handled the moment and carried its outcome into what came next. Gain 1 Energy. |
| src/services/eventService.ts:3854 | resultLog | 特別演奏の謝礼で120G獲得。 | とくべつえんそうのしゃれいで120Gかくとく。 | Your helpful action was noticed, and you received thanks in return. Gained 120G. |
| src/services/eventService.ts:3857 | resultLog | 歌い切って気分爽快。&lt;br&gt;HPが8回復。 | うたいきってきぶんそうかい。&lt;br&gt;HPが8かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:3860 | label | 楽譜を読む | がくふをよむ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3860 | text | 分析（カード2枚強化 / カード削除） | ぶんせき（カード2まいきょうか / カードさくじょ） | Analysis (Upgrade 2 cards / Remove 1 card) |
| src/services/eventService.ts:3869 | resultLog | 旋律の構造を理解した。&lt;br&gt;カードを2枚強化した。 | せんりつのこうぞうをりかいした。&lt;br&gt;カードを2まいきょうかした。 | The study moment clarified what you needed to understand next.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:3883 | resultLog | 雑念が一つ消えた。&lt;br&gt;「あかり」を取り除いた。 | ざつねんがひとつきえた。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3889 | label | 目を見返す | めをみかえす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3889 | text | 度胸（恒久ムキムキ+1 / HP-6 / 呪い「不安」） | どきょう（こうきゅうむきむき+1 / HP-6 / のろい「ふあん」） | Courage (permanentStrength and 1 / Lose 6 HP / Receive the curse "Anxiety") |
| src/services/eventService.ts:3893 | resultLog | 胆力がついた。&lt;br&gt;恒久ムキムキ+1。 | たんりょくがついた。&lt;br&gt;こうきゅうむきむき+1。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:3896 | resultLog | 視線が強すぎた...&lt;br&gt;HPが6減った。 | しせんがつよすぎた...&lt;br&gt;HPが6へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:3899 | resultLog | 本当に動いた気がして眠れない...&lt;br&gt;呪い「不安」を受けた。 | ほんとうにうごいたきがしてねむれない...&lt;br&gt;のろい「ふあん」をうけた。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:3902 | label | 肖像画とデュエット配信 | しょうぞうがとでゅえっとはいしん | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3902 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3909 | resultLog | 神回になった。&lt;br&gt;レリック「観察メモ」を得た。 | かみかいになった。&lt;br&gt;おたから「かんさつめも」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Observation Notes". |
| src/services/eventService.ts:3912 | resultLog | 配信収益で180G獲得。 | はいしんしゅうえきで180Gかくとく。 | The opportunity produced a practical reward. Gained 180G. |
| src/services/eventService.ts:3915 | resultLog | コメント欄が大荒れ...&lt;br&gt;呪い「恥」を受けた。 | こめんとらんがおおあれ...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 体育館の跳び箱（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:3921 | title | 体育館の跳び箱 | たいいくかんのとびはこ | Gym Vaulting Box |
| src/services/eventService.ts:3922 | description | 12段の跳び箱がそびえ立っている。挑戦する？ | 12だんのとびはこがそびえたっている。ちょうせんする？ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3924 | label | 正面から跳ぶ | しょうめんからとぶ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3924 | text | 挑戦（最大HP+5 / HP-10 / 100G） | ちょうせん（さいだいHP+5 / HP-10 / 100G） | Choose Option (Increase max HP by 5 / Lose 10 HP / Gain 100G) |
| src/services/eventService.ts:3928 | resultLog | きれいに着地！&lt;br&gt;最大HPと現在HPが5増えた。 | きれいにちゃくち！&lt;br&gt;さいだいHPとげんざいHPが5ふえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP and current HP +5. |
| src/services/eventService.ts:3931 | resultLog | ぶつかった！&lt;br&gt;HPが10減った。 | ぶつかった！&lt;br&gt;HPが10へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 10 HP. |
| src/services/eventService.ts:3934 | resultLog | 見事な演技に賞金が出た。&lt;br&gt;100G獲得。 | みごとなえんぎにしょうきんがでた。&lt;br&gt;100Gかくとく。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Gained 100G. |
| src/services/eventService.ts:3937 | label | 跳び箱の中を探る | とびはこのなかをさぐる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3937 | text | 探索（マトリョーシカ+悩み / カード削除） | たんさく（マトリョーシカ+なやみ / カードさくじょ） | Search (Matryoshka and Worry / Remove 1 card) |
| src/services/eventService.ts:3947 | resultLog | 隠し箱を見つけた！&lt;br&gt;レリック獲得、ただし呪い「悩み」。 | かくしはこをみつけた！&lt;br&gt;おたからかくとく、ただしのろい「なやみ」。 | You noticed the opening and turned it into an advantage.&lt;br&gt;Facing the feeling directly helped your mind settle. |
| src/services/eventService.ts:3961 | resultLog | 荷物を整理した。&lt;br&gt;「あかり」を取り除いた。 | にもつをせいりした。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:3967 | label | 助走のフォーム改善 | じょそうのふぉーむかいぜん | Improve your run-up form |
| src/services/eventService.ts:3967 | text | 技術（カード1枚強化 / HP+8 / 呪い「不安」） | ぎじゅつ（カード1まいきょうか / HP+8 / のろい「ふあん」） | Technique (Upgrade 1 cards / Heal 8 HP / Receive the curse "Anxiety") |
| src/services/eventService.ts:3981 | resultLog | フォームが固まった。&lt;br&gt;「あかり」が強化された。 | ふぉーむがかたまった。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:3986 | resultLog | 体が温まりHPが8回復。 | からだがあたたまりHPが8かいふく。 | The short break helped your body and mind recover. Heal 8 HP. |
| src/services/eventService.ts:3989 | resultLog | 緊張が抜けない...&lt;br&gt;呪い「不安」を受けた。 | きんちょうがぬけない...&lt;br&gt;のろい「ふあん」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:3992 | label | 跳び箱サーカスを開催 | とびはこさーかすをかいさい | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:3992 | text | 奇想天外（レリック / 170G / 呪い「恥」） | きそうてんがい（おたから / 170G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 170G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:3999 | resultLog | 演目が名物になった。&lt;br&gt;レリック「アサガオ」を得た。 | えんもくがめいぶつになった。&lt;br&gt;おたから「あさがお」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Morning Glory". |
| src/services/eventService.ts:4002 | resultLog | チケットが売れて170G獲得。 | ちけっとがうれて170Gかくとく。 | Your effort paid off and earned a useful reward. Gained 170G. |
| src/services/eventService.ts:4005 | resultLog | 着地失敗で大転倒...&lt;br&gt;呪い「恥」を受けた。 | ちゃくちしっぱいでだいてんとう...&lt;br&gt;のろい「はじ」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Embarrassment". |

#### 水道の蛇口（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4011 | title | 水道の蛇口 | すいどうのじゃぐち | Water Faucet |
| src/services/eventService.ts:4012 | description | 誰かが水を出しっぱなしにしている。もったいない。 | だれかがみずをだしっぱなしにしている。もったいない。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4014 | label | 蛇口を閉める | じゃぐちをしめる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4014 | text | 節水（HP+10 / カード削除） | せっすい（HP+10 / カードさくじょ） | Water Saving (Heal 10 HP / Remove 1 card) |
| src/services/eventService.ts:4018 | resultLog | 水を大切にした。&lt;br&gt;HPが10回復。 | みずをたいせつにした。&lt;br&gt;HPが10かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:4032 | resultLog | 心の濁りも流れた。&lt;br&gt;「あかり」を取り除いた。 | こころのにごりもながれた。&lt;br&gt;「あかり」をとりのぞいた。 | The cloudiness in your heart washed away too.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4038 | label | 飲んでみる | のんでみる | Try drinking it |
| src/services/eventService.ts:4038 | text | 直飲み（ポーション+HP-5 / HP+6 / 呪い） | ちょくのみ（ポーション+HP-5 / HP+6 / のろい） | Drink Directly (Potions and HP-5 / Heal 6 HP / Receive a curse) |
| src/services/eventService.ts:4050 | resultLog | 冷たすぎる！HP-5。&lt;br&gt;ポーションを入手した。 | つめたすぎる！HP-5。&lt;br&gt;ポーションをにゅうしゅした。 | You handled the moment and carried its outcome into what came next. Lost 5 HP.&lt;br&gt;Gain a potion. |
| src/services/eventService.ts:4053 | resultLog | 意外とおいしくて元気が出た。&lt;br&gt;HPが6回復。 | いがいとおいしくてげんきがでた。&lt;br&gt;HPが6かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 6 HP. |
| src/services/eventService.ts:4056 | resultLog | お腹が冷えすぎた...&lt;br&gt;呪い「腹痛」を受けた。 | おはらがひえすぎた...&lt;br&gt;のろい「ふくつう」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Pain". |
| src/services/eventService.ts:4059 | label | 配管を点検する | はいかんをてんけんする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4059 | text | 整備（カード1枚強化 / 70G / HP-4） | せいび（カード1まいきょうか / 70G / HP-4） | Maintenance (Upgrade 1 cards / Gain 70G / Lose 4 HP) |
| src/services/eventService.ts:4073 | resultLog | 手際が良くなった。&lt;br&gt;「あかり」が強化された。 | てぎわがよくなった。&lt;br&gt;「あかり」がきょうかされた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:4078 | resultLog | 修理協力費で70G獲得。 | しゅうりきょうりょくひで70Gかくとく。 | The opportunity produced a practical reward. Gained 70G. |
| src/services/eventService.ts:4081 | resultLog | 工具で手を打った...&lt;br&gt;HPが4減った。 | こうぐでてをうった...&lt;br&gt;HPが4へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 4 HP. |
| src/services/eventService.ts:4084 | label | ウォーターパーク化する | うぉーたーぱーくかする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4084 | text | 奇想天外（レリック / 160G / 呪い「恥」） | きそうてんがい（おたから / 160G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 160G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4091 | resultLog | 噴水演出が大成功。&lt;br&gt;レリック「チャイム砂時計」を得た。 | ふんすいえんしゅつがだいせいこう。&lt;br&gt;おたから「チャイムすなどけい」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Chime Hourglass". |
| src/services/eventService.ts:4094 | resultLog | 入場料で160G獲得。 | にゅうじょうりょうで160Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 160G. |
| src/services/eventService.ts:4097 | resultLog | びしょ濡れで注目を浴びた...&lt;br&gt;呪い「恥」を受けた。 | びしょぬれでちゅうもくをあびた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 家庭科の包丁（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4103 | title | 家庭科の包丁 | かていかのほうちょう | Home Economics Knife |
| src/services/eventService.ts:4104 | description | 研ぎ澄まされた包丁。料理の準備はできている。 | とぎすまされたほうちょう。りょうりのじゅんびはできている。 | Turning the situation into a plan made the next step easier to take. |
| src/services/eventService.ts:4106 | label | 丁寧に研ぐ | ていねいにとぐ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4106 | text | 鍛錬（攻撃カードコピー / 80G / 呪い） | たんれん（こうげきカードこぴー / 80G / のろい） | Training (AttackCardCopy / Gain 80G / Receive a curse) |
| src/services/eventService.ts:4119 | resultLog | 切れ味最高！&lt;br&gt;「あかり」をコピーした。 | きれあじさいこう！&lt;br&gt;「あかり」をこぴーした。 | The sharpness was perfect! Copied "Akari". |
| src/services/eventService.ts:4123 | resultLog | 包丁研ぎ代で80G獲得。 | ほうちょうとぎだいで80Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 80G. |
| src/services/eventService.ts:4126 | resultLog | 手元が狂った...&lt;br&gt;呪い「骨折」を受けた。 | てもとがくるった...&lt;br&gt;のろい「こっせつ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Injury". |
| src/services/eventService.ts:4129 | label | 野菜を切る | やさいをきる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4129 | text | 料理（HP+15 / カード1枚強化） | りょうり（HP+15 / カード1まいきょうか） | Cooking (Heal 15 HP / Upgrade 1 cards) |
| src/services/eventService.ts:4133 | resultLog | おいしいサラダができた。&lt;br&gt;HPが15回復。 | おいしいさらだができた。&lt;br&gt;HPが15かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 15 HP. |
| src/services/eventService.ts:4146 | resultLog | 包丁さばきが冴えた。&lt;br&gt;「あかり」が強化された。 | ほうちょうさばきがさえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:4153 | label | 肉の解体に挑む | にくのかいたいにいどむ | The short break helped your body and mind recover. |
| src/services/eventService.ts:4153 | text | 本番（恒久ムキムキ+1 / HP-8 / カード削除） | ほんばん（こうきゅうむきむき+1 / HP-8 / カードさくじょ） | Real Performance (permanentStrength and 1 / Lose 8 HP / Remove 1 card) |
| src/services/eventService.ts:4157 | resultLog | 腕力がついた。&lt;br&gt;恒久ムキムキ+1。 | わんりょくがついた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:4160 | resultLog | 重労働で消耗...&lt;br&gt;HPが8減った。 | じゅうろうどうでしょうもう...&lt;br&gt;HPが8へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 8 HP. |
| src/services/eventService.ts:4174 | resultLog | 余計な一手を捨てた。&lt;br&gt;「あかり」を取り除いた。 | よけいないってをすてた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4178 | label | 包丁アートパフォーマンス | ほうちょうあーとぱふぉーまんす | Perform knife art |
| src/services/eventService.ts:4178 | text | 奇想天外（レリック / 170G / 呪い「恥」） | きそうてんがい（おたから / 170G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 170G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4185 | resultLog | 演武が評価された。&lt;br&gt;レリック「紙飛行機」を得た。 | えんぶがひょうかされた。&lt;br&gt;おたから「かみひこうき」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Paper Airplane". |
| src/services/eventService.ts:4188 | resultLog | 投げ銭で170G獲得。 | なげせんで170Gかくとく。 | Your effort paid off and earned a useful reward. Gained 170G. |
| src/services/eventService.ts:4191 | resultLog | 手元をミスして赤面...&lt;br&gt;呪い「恥」を受けた。 | てもとをみすしてせきめん...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 秘密の連絡帳（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4197 | title | 秘密の連絡帳 | ひみつのれんらくちょう | Secret Contact Notebook |
| src/services/eventService.ts:4198 | description | クラスの誰かの秘密が書かれている。見ちゃいけない... | くらすのだれかのひみつがかかれている。みちゃいけない... | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4200 | label | こっそり見る | こっそりみる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4200 | text | 覗き見（150G / 呪い「恥」 / カード強化） | のぞきけん（150G / のろい「はじ」 / カードきょうか） | Peek (Gain 150G / Receive the curse "Embarrassment" / Upgrade 1 card) |
| src/services/eventService.ts:4204 | resultLog | 秘密のメモから埋蔵金情報を得た。&lt;br&gt;150G獲得。 | ひみつのめもからまいぞうきんじょうほうをえた。&lt;br&gt;150Gかくとく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained 150G. |
| src/services/eventService.ts:4207 | resultLog | 最低な自分を知ってしまった...&lt;br&gt;呪い「恥」を受けた。 | さいていなじぶんをしってしまった...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:4220 | resultLog | 人の振り見て我が振り直せ。&lt;br&gt;「あかり」が強化された。 | にんのふりみてわがふりなおせ。&lt;br&gt;「あかり」がきょうかされた。 | Seeing another's behavior taught you to correct your own.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:4225 | label | そっと戻す | そっともどす | Put it back quietly |
| src/services/eventService.ts:4225 | text | 良心（HP+8 / カード削除） | りょうしん（HP+8 / カードさくじょ） | Conscience (Heal 8 HP / Remove 1 card) |
| src/services/eventService.ts:4229 | resultLog | 良心が勝った。&lt;br&gt;HPが8回復。 | りょうしんがかった。&lt;br&gt;HPが8かいふく。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:4243 | resultLog | 心が軽くなった。&lt;br&gt;「あかり」を取り除いた。 | こころがかるくなった。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4246 | resultLog | プライバシーは守られた。 | ぷらいばしーはまもられた。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4249 | label | 先生に報告する | せんせいにほうこくする | Report to Teacher |
| src/services/eventService.ts:4249 | text | 通報（100G / HP-5 / 呪い「不安」） | つうほう（100G / HP-5 / のろい「ふあん」） | Report (Gain 100G / Lose 5 HP / Receive the curse "Anxiety") |
| src/services/eventService.ts:4253 | resultLog | 誠実な対応で100G獲得。 | せいじつなたいおうで100Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 100G. |
| src/services/eventService.ts:4256 | resultLog | 事情説明でぐったり...&lt;br&gt;HPが5減った。 | じじょうせつめいでぐったり...&lt;br&gt;HPが5へった。 | The study moment clarified what you needed to understand next.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:4259 | resultLog | 逆に疑われた気がする...&lt;br&gt;呪い「不安」を受けた。 | ぎゃくにうたがわれたきがする...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:4262 | label | 秘密相談サービス開業 | ひみつそうだんさーびすかいぎょう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4262 | text | 奇想天外（レリック / 180G / 呪い「後悔」） | きそうてんがい（おたから / 180G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Regret") |
| src/services/eventService.ts:4269 | resultLog | 相談所が人気化。&lt;br&gt;レリック「相談室の整理券」を得た。 | そうだんしょがにんきか。&lt;br&gt;おたから「そうだんしつのせいりけん」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Counseling Room Ticket". |
| src/services/eventService.ts:4272 | resultLog | 相談料で180G獲得。 | そうだんりょうで180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:4275 | resultLog | 相談内容が漏れてしまった...&lt;br&gt;呪い「後悔」を受けた。 | そうだんないようがもれてしまった...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |

#### 校長先生の銅像（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4281 | title | 校長先生の銅像 | こうちょうせんせいのどうぞう | Principal's Bronze Statue |
| src/services/eventService.ts:4282 | description | 威厳のある銅像。磨けば光るだろうか。 | いげんのあるどうぞう。みがけばひかるだろうか。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4284 | label | 丁寧に磨く | ていねいにみがく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4284 | text | 奉仕（最大HP+2 / HP+8 / 100G） | ほうし（さいだいHP+2 / HP+8 / 100G） | Service (Increase max HP by 2 / Heal 8 HP / Gain 100G) |
| src/services/eventService.ts:4288 | resultLog | 心まで磨かれた気がする。&lt;br&gt;最大HPと現在HPが2増えた。 | こころまでみがかれたきがする。&lt;br&gt;さいだいHPとげんざいHPが2ふえた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Max HP and current HP +2. |
| src/services/eventService.ts:4291 | resultLog | 達成感でHPが8回復。 | たっせいかんでHPが8かいふく。 | Heal 8 HP. |
| src/services/eventService.ts:4294 | resultLog | 校内美化の謝礼で100G獲得。 | こうないびかのしゃれいで100Gかくとく。 | Your helpful action was noticed, and you received thanks in return. Gained 100G. |
| src/services/eventService.ts:4297 | label | 歴史を調べる | れきしをしらべる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4297 | text | 学び（カード強化 / カード削除） | まなび（カードきょうか / カードさくじょ） | Learning (Upgrade 1 card / Remove 1 card) |
| src/services/eventService.ts:4311 | resultLog | 知識が力になった。&lt;br&gt;「あかり」が強化された。 | ちしきがちからになった。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:4327 | resultLog | 価値観が整理された。&lt;br&gt;「あかり」を取り除いた。 | かちかんがせいりされた。&lt;br&gt;「あかり」をとりのぞいた。 | Tidying things up also helped clear your mind for the next step.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4333 | label | 落書きする | らくがきする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4333 | text | 背徳（150G+後悔 / 恒久ムキムキ+1 / HP-6） | はいとく（150G+こうかい / こうきゅうむきむき+1 / HP-6） | Forbidden Choice (150G and Regret / permanentStrength and 1 / Lose 6 HP) |
| src/services/eventService.ts:4343 | resultLog | 悪い力！150G獲得。&lt;br&gt;呪い「後悔」を受けた。 | わるいちから！150Gかくとく。&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next. Gained 150G.&lt;br&gt;Received the curse "Regret". |
| src/services/eventService.ts:4346 | resultLog | 肝が据わった。&lt;br&gt;恒久ムキムキ+1。 | きもがすわった。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:4349 | resultLog | 逃げるときに転んだ...&lt;br&gt;HPが6減った。 | にげるときにころんだ...&lt;br&gt;HPが6へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:4352 | label | 銅像ライトアップショー | どうぞうらいとあっぷしょー | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4352 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4359 | resultLog | 夜の校庭が映えた。&lt;br&gt;レリック「懐中電灯」を得た。 | よるのこうていがはえた。&lt;br&gt;おたから「かいちゅうでんとう」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Flashlight". |
| src/services/eventService.ts:4362 | resultLog | 観覧料で180G獲得。 | かんらんりょうで180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:4365 | resultLog | 配線トラブルで赤面...&lt;br&gt;呪い「恥」を受けた。 | はいせんとらぶるでせきめん...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 階段の13段目（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4371 | title | 階段の13段目 | かいだんの13だんめ | The Thirteenth Stair |
| src/services/eventService.ts:4372 | description | 夜になると増えるという伝説の階段。今、足元にあるのは13段目だ。 | よるになるとふえるというでんせつのかいだん。いま、あしもとにあるのは13だんめだ。 | A legendary staircase said to gain steps at night. Right now, the step beneath your feet is the thirteenth. |
| src/services/eventService.ts:4374 | label | 踏み抜く | ふみぬく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4374 | text | 異界（カード削除+HP-10 / レリック / 呪い） | いかい（カードさくじょ+HP-10 / おたから / のろい） | Otherworld Approach (Remove Card and HP-10 / Gain a relic / Receive a curse) |
| src/services/eventService.ts:4390 | resultLog | 別世界に吸い込まれた！&lt;br&gt;HP-10、「あかり」を置いてきた。 | べっせかいにすいこまれた！&lt;br&gt;HP-10、「あかり」をおいてきた。 | You were pulled into another world!&lt;br&gt;Lost 10 HP and left "Akari" behind. |
| src/services/eventService.ts:4397 | resultLog | 時の狭間を見た。&lt;br&gt;レリック「チャイム時計」を得た。 | ときのはざまをみた。&lt;br&gt;おたから「ちゃいむとけい」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Chime Clock". |
| src/services/eventService.ts:4400 | resultLog | 帰ってきたが胸騒ぎが残る...&lt;br&gt;呪い「悩み」を受けた。 | かえってきたがむなさわぎがのこる...&lt;br&gt;のろい「なやみ」をうけた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Received the curse "Worry". |
| src/services/eventService.ts:4403 | label | 飛び越える | とびこえる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4403 | text | 回避（回避カード / HP+8） | かいひ（かいひカード / HP+8） | Dodge (Card / Heal 8 HP) |
| src/services/eventService.ts:4407 | resultLog | 見事に飛び越えた！&lt;br&gt;「回避」を習得。 | みごとにとびこえた！&lt;br&gt;「かいひ」をしゅうとく。 | You handled the moment and carried its outcome into what came next. Learned "Dodge". |
| src/services/eventService.ts:4410 | resultLog | 危機を乗り越えHPが8回復。 | ききをのりこえHPが8かいふく。 | The short break helped your body and mind recover. Heal 8 HP. |
| src/services/eventService.ts:4415 | label | 段数を数え直す | だんすうをかぞえなおす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4415 | text | 検証（カード2枚強化 / 70G / HP-5） | けんしょう（カード2まいきょうか / 70G / HP-5） | Verification (Upgrade 2 cards / Gain 70G / Lose 5 HP) |
| src/services/eventService.ts:4424 | resultLog | 冷静な観察で技が研がれた。&lt;br&gt;カードを2枚強化。 | れいせいなかんさつでわざがとがれた。&lt;br&gt;カードを2まいきょうか。 | Seeing the situation from a new angle gave you a useful perspective.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:4427 | resultLog | 怪談調査の謝礼で70G獲得。 | かいだんちょうさのしゃれいで70Gかくとく。 | Your helpful action was noticed, and you received thanks in return. Gained 70G. |
| src/services/eventService.ts:4430 | resultLog | 怖くて足がすくんだ...&lt;br&gt;HPが5減った。 | こわくてあしがすくんだ...&lt;br&gt;HPが5へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:4433 | label | 13段目ツアーを企画 | 13だんめつあーをきかく | 13 ー |
| src/services/eventService.ts:4433 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4440 | resultLog | 怪談ガイドとして名を上げた。&lt;br&gt;レリック「観察メモ」を得た。 | かいだんがいどとしてめいをあげた。&lt;br&gt;おたから「かんさつめも」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Observation Notes". |
| src/services/eventService.ts:4443 | resultLog | 参加費で180G獲得。 | さんかひで180Gかくとく。 | The opportunity produced a practical reward. Gained 180G. |
| src/services/eventService.ts:4446 | resultLog | 一人も来なくて気まずい...&lt;br&gt;呪い「恥」を受けた。 | ひとりもこなくてきまずい...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 図書室の司書さん（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4452 | title | 図書室の司書さん | としょしつのししょさん | The Librarian |
| src/services/eventService.ts:4453 | description | 「お静かに. 本を読みますか？」 | 「おしずかに. ほんをよみますか？」 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4455 | label | おすすめ本を読む | おすすめほんをよむ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4455 | text | 読書（アンコモンカード / HP+5 / カード強化） | どくしょ（あんこもんカード / HP+5 / カードきょうか） | Reading (Card / Heal 5 HP / Upgrade 1 card) |
| src/services/eventService.ts:4461 | resultLog | 感動する物語だった！&lt;br&gt;カードを1枚入手。 | かんどうするものがたりだった！&lt;br&gt;カードを1まいにゅうしゅ。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:4464 | resultLog | 静かな時間でHPが5回復。 | しずかなじかんでHPが5かいふく。 | The short break helped your body and mind recover. Heal 5 HP. |
| src/services/eventService.ts:4477 | resultLog | 一節が刺さった。&lt;br&gt;「あかり」が強化された。 | いっせつがささった。&lt;br&gt;「あかり」がきょうかされた。 | One passage struck home.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:4482 | label | 静かに去る | しずかにさる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4482 | text | 礼儀（HP+5 / カード削除） | れいぎ（HP+5 / カードさくじょ） | Courtesy (Heal 5 HP / Remove 1 card) |
| src/services/eventService.ts:4486 | resultLog | マナーを守ってHPが5回復。 | まなーをまもってHPが5かいふく。 | The short break helped your body and mind recover. Heal 5 HP. |
| src/services/eventService.ts:4500 | resultLog | 静かな決断。&lt;br&gt;「あかり」を取り除いた。 | しずかなけつだん。&lt;br&gt;「あかり」をとりのぞいた。 | You made a quiet decision.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4506 | label | 司書さんに質問攻め | ししょさんにしつもんせめ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4506 | text | 探求（カード2枚強化 / 80G / 呪い「不安」） | たんきゅう（カード2まいきょうか / 80G / のろい「ふあん」） | Inquiry (Upgrade 2 cards / Gain 80G / Receive the curse "Anxiety") |
| src/services/eventService.ts:4515 | resultLog | 知識の扉が開いた。&lt;br&gt;カードを2枚強化。 | ちしきのとびらがひらいた。&lt;br&gt;カードを2まいきょうか。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:4518 | resultLog | 資料整理の手伝いで80G獲得。 | しりょうせいりのてつだいで80Gかくとく。 | Tidying things up also helped clear your mind for the next step. Gained 80G. |
| src/services/eventService.ts:4521 | resultLog | 聞きすぎて混乱...&lt;br&gt;呪い「不安」を受けた。 | ききすぎてこんらん...&lt;br&gt;のろい「ふあん」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:4524 | label | 図書室で朗読ライブ | としょしつでろうどくらいぶ | the library Japanese Rodoku live show |
| src/services/eventService.ts:4524 | text | 奇想天外（レリック / 160G / 呪い「恥」） | きそうてんがい（おたから / 160G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 160G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4531 | resultLog | 美しい朗読だった。&lt;br&gt;レリック「インク瓶」を得た。 | うつくしいろうどくだった。&lt;br&gt;おたから「いんくかめ」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Ink Bottle". |
| src/services/eventService.ts:4534 | resultLog | 投げ銭で160G獲得。 | なげせんで160Gかくとく。 | Your effort paid off and earned a useful reward. Gained 160G. |
| src/services/eventService.ts:4537 | resultLog | 声が大きすぎた...&lt;br&gt;呪い「恥」を受けた。 | こえがおおきすぎた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 屋上の貯水槽（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4543 | title | 屋上の貯水槽 | おくじょうのちょすいそう | Rooftop Water Tank |
| src/services/eventService.ts:4544 | description | 巨大なタンク。中から音が聞こえる。 | きょだいなたんく。なかからおとがきこえる。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4546 | label | 覗き込む | のぞきこむ | Peer inside |
| src/services/eventService.ts:4546 | text | 探索（ポーション / HP-10 / 120G） | たんさく（ポーション / HP-10 / 120G） | Search (Gain a potion / Lose 10 HP / Gain 120G) |
| src/services/eventService.ts:4554 | resultLog | きれいな水だ！&lt;br&gt;ポーションを入手。 | きれいなみずだ！&lt;br&gt;ポーションをにゅうしゅ。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Obtained a potion. |
| src/services/eventService.ts:4557 | resultLog | 滑って落ちそうになった！&lt;br&gt;HPが10減った。 | すべっておちそうになった！&lt;br&gt;HPが10へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 10 HP. |
| src/services/eventService.ts:4560 | resultLog | 点検報酬として120G獲得。 | てんけんほうしゅうとして120Gかくとく。 | Your effort paid off and earned a useful reward. Gained 120G. |
| src/services/eventService.ts:4563 | label | コンコン叩く | こんこんたたく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4563 | text | 反響（恒久ムキムキ+1 / カード強化） | はんきょう（こうきゅうむきむき+1 / カードきょうか） | Echo (permanentStrength and 1 / Upgrade 1 card) |
| src/services/eventService.ts:4567 | resultLog | いい音だ。腕の力がついて恒久ムキムキ+1。 | いいおとだ。うでのちからがついてこうきゅうむきむき+1。 | You handled the moment and carried its outcome into what came next. Gain 1 Strength. |
| src/services/eventService.ts:4580 | resultLog | 反響で集中力が高まった。&lt;br&gt;「あかり」が強化された。 | はんきょうでしゅうちゅうりょくがたかまった。&lt;br&gt;「あかり」がきょうかされた。 | The echo sharpened your concentration.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:4587 | label | 配管を整備する | はいかんをせいびする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4587 | text | 整備（カード削除 / HP+8 / 呪い） | せいび（カードさくじょ / HP+8 / のろい） | Maintenance (Remove 1 card / Heal 8 HP / Receive a curse) |
| src/services/eventService.ts:4602 | resultLog | 配管と一緒に心も整った。&lt;br&gt;「あかり」を取り除いた。 | はいかんといっしょにこころもととのった。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4606 | resultLog | 整備後の達成感でHPが8回復。 | せいびのちのたっせいかんでHPが8かいふく。 | The short break helped your body and mind recover. Heal 8 HP. |
| src/services/eventService.ts:4609 | resultLog | 異音の原因が分からない...&lt;br&gt;呪い「不安」を受けた。 | いおんのげんいんがわからない...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:4612 | label | 貯水槽サウナを開業 | ちょすいそうさうなをかいぎょう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4612 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4619 | resultLog | 謎施設が流行った。&lt;br&gt;レリック「図工の魚皿」を得た。 | なぞしせつがはやった。&lt;br&gt;おたから「ずこうのさかなざら」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Art Room Fish Plate". |
| src/services/eventService.ts:4622 | resultLog | 利用料で180G獲得。 | りようりょうで180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:4625 | resultLog | 温度管理をミスして大騒ぎ...&lt;br&gt;呪い「恥」を受けた。 | おんどかんりをみすしておおさわぎ...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 飼育室のウサギ（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4631 | title | 飼育室のウサギ | しいくしつのうさぎ | Rabbit in the Animal Room |
| src/services/eventService.ts:4632 | description | モフモフのウサギがいる。癒やされる... | もふもふのうさぎがいる。いやされる... | You took a moment to recover and regain your rhythm. |
| src/services/eventService.ts:4634 | label | 抱っこする | だっこする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4634 | text | 癒やし（全回復+寄生虫 / HP+8） | いやし（ぜんかいふく+きせいちゅう / HP+8） | Healing (Heal to full HP and receive Parasite / Heal 8 HP) |
| src/services/eventService.ts:4644 | resultLog | とても癒やされた。HP全回復。&lt;br&gt;でも呪い「寄生虫」を受けた。 | とてもいやされた。HPぜんかいふく。&lt;br&gt;でものろい「きせいちゅう」をうけた。 | The short break helped your body and mind recover. Heal to full HP.&lt;br&gt;Received the curse "Parasite". |
| src/services/eventService.ts:4647 | resultLog | なでるだけでもHPが8回復。 | なでるだけでもHPが8かいふく。 | The short break helped your body and mind recover. Heal 8 HP. |
| src/services/eventService.ts:4649 | resultLog | うさぎはすやすや寝ていた。 | うさぎれんやすやねていた。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4652 | label | 観察する | かんさつする | Observe it |
| src/services/eventService.ts:4652 | text | 分析（先読み強化 / カード2枚強化 / 70G） | ぶんせき（さきよみきょうか / カード2まいきょうか / 70G） | Analysis (Upgrade card(s). / Upgrade 2 cards / Gain 70G) |
| src/services/eventService.ts:4666 | resultLog | 動きを完璧に読んだ！「先読み」が強化された。 | うごきをかんぺきによんだ！「さきよみ」がきょうかされた。 | Your effort was recognized and turned into a stronger result. "Read Ahead" was upgraded. |
| src/services/eventService.ts:4675 | resultLog | 観察眼が冴えた。&lt;br&gt;カードを2枚強化。 | かんさつめがさえた。&lt;br&gt;カードを2まいきょうか。 | Seeing the situation from a new angle gave you a useful perspective.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:4678 | resultLog | 飼育メモの謝礼で70G獲得。 | しいくめものしゃれいで70Gかくとく。 | Your helpful action was noticed, and you received thanks in return. Gained 70G. |
| src/services/eventService.ts:4681 | label | 餌を作る | えさをつくる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4681 | text | 世話（カード削除 / 恒久ムキムキ+1 / 呪い） | せわ（カードさくじょ / こうきゅうむきむき+1 / のろい） | Choose Option (Remove 1 card / permanentStrength and 1 / Receive a curse) |
| src/services/eventService.ts:4696 | resultLog | 生活が整った。&lt;br&gt;「あかり」を取り除いた。 | せいかつがととのった。&lt;br&gt;「あかり」をとりのぞいた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4700 | resultLog | 飼育作業で鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | しいくさぎょうできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:4703 | resultLog | 正しい餌が分からない...&lt;br&gt;呪い「不安」を受けた。 | ただしいえさがわからない...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:4706 | label | うさぎ神を召喚する | うさぎかみをしょうかんする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4706 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4713 | resultLog | 祝福を受けた。&lt;br&gt;レリック「保健室の飴」を得た。 | しゅくふくをうけた。&lt;br&gt;おたから「ほけんしつのあめ」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Infirmary Candy". |
| src/services/eventService.ts:4716 | resultLog | 奉納金が集まり180G獲得。 | ほうのうきんがあつまり180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:4719 | resultLog | 儀式を見られてしまった...&lt;br&gt;呪い「恥」を受けた。 | ぎしきをみられてしまった...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 学校のゴミ捨て場（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4725 | title | 学校のゴミ捨て場 | がっこうのごみすてば | School Trash Area |
| src/services/eventService.ts:4726 | description | 掘り出し物があるかもしれない。 | ほりだしものがあるかもしれない。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4728 | label | あさる | あさる | Search through it |
| src/services/eventService.ts:4728 | text | 探索（コモンレリック / 骨折 / 100G） | たんさく（こもんおたから / こっせつ / 100G） | Search (Relic / Injury / Gain 100G) |
| src/services/eventService.ts:4738 | resultLog | 掘り出し物を発見！&lt;br&gt;コモンレリックを得た。 | ほりだしものをはっけん！&lt;br&gt;こもんおたからをえた。 | You noticed the opening and turned it into an advantage.&lt;br&gt;You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:4741 | resultLog | 粗大ゴミの下敷きになった...&lt;br&gt;呪い「骨折」を受けた。 | そだいごみのしたじきになった...&lt;br&gt;のろい「こっせつ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Injury". |
| src/services/eventService.ts:4744 | resultLog | 売れそうな金属を回収。&lt;br&gt;100G獲得。 | うれそうなきんぞくをかいしゅう。&lt;br&gt;100Gかくとく。 | Your effort paid off and earned a useful reward.&lt;br&gt;Gained 100G. |
| src/services/eventService.ts:4747 | label | 掃除する | そうじする | Clean it |
| src/services/eventService.ts:4747 | text | 整理（カード削除 / HP+8） | せいり（カードさくじょ / HP+8） | Organizing (Remove 1 card / Heal 8 HP) |
| src/services/eventService.ts:4762 | resultLog | きれいに片づけた。&lt;br&gt;「あかり」を捨てた。 | きれいにかたづけた。&lt;br&gt;「あかり」をすてた。 | You cleaned it up neatly.&lt;br&gt;Discarded "Akari". |
| src/services/eventService.ts:4766 | resultLog | 空気が澄んでHPが8回復。 | くうきがすんでHPが8かいふく。 | The quiet atmosphere helped you calm down and clear your head. Heal 8 HP. |
| src/services/eventService.ts:4771 | label | 分別マスターになる | ふんべつますたーになる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4771 | text | 研究（カード2枚強化 / 恒久ムキムキ+1 / HP-5） | けんきゅう（カード2まいきょうか / こうきゅうむきむき+1 / HP-5） | Research (Upgrade 2 cards / permanentStrength and 1 / Lose 5 HP) |
| src/services/eventService.ts:4780 | resultLog | 最適化が冴えた。&lt;br&gt;カードを2枚強化。 | さいてきかがさえた。&lt;br&gt;カードを2まいきょうか。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:4783 | resultLog | 重いもの運びで鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | おもいものはこびできたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:4786 | resultLog | 粉塵でむせた...&lt;br&gt;HPが5減った。 | ふんじんでむせた...&lt;br&gt;HPが5へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 5 HP. |
| src/services/eventService.ts:4789 | label | 宝探し配信を始める | たからさがしはいしんをはじめる | You noticed the opening and turned it into an advantage. |
| src/services/eventService.ts:4789 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4796 | resultLog | 伝説の発掘回だった。&lt;br&gt;レリック「小物入れ」を得た。 | でんせつのはっくつかいだった。&lt;br&gt;おたから「こものいれれ」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Tiny Case". |
| src/services/eventService.ts:4799 | resultLog | 広告収益で180G獲得。 | こうこくしゅうえきで180Gかくとく。 | The opportunity produced a practical reward. Gained 180G. |
| src/services/eventService.ts:4802 | resultLog | 撮れ高ゼロで気まずい...&lt;br&gt;呪い「恥」を受けた。 | とれたかぜろできまずい...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 放送室から変な声（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4808 | title | 放送室から変な声 | ほうそうしつからへんなこえ | Strange Voice from the Broadcast Room |
| src/services/eventService.ts:4809 | description | 放送室から変な声が流れてきた。止めに行く？ | ほうそうしつからへんなこえがながれてきた。とめにいく？ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4811 | label | 止めに行く | とめにいく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4811 | text | 制圧（大声カード / 120G / HP-6） | せいあつ（おおごえカード / 120G / HP-6） | Subdue (Card / Gain 120G / Lose 6 HP) |
| src/services/eventService.ts:4815 | resultLog | マイクを奪取！&lt;br&gt;「大声」を習得した。 | まいくをだっしゅ！&lt;br&gt;「おおごえ」をしゅうとくした。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Learned "Large". |
| src/services/eventService.ts:4818 | resultLog | トラブル対応手当で120G獲得。 | とらぶるたいおうてあてで120Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 120G. |
| src/services/eventService.ts:4821 | resultLog | 機材を運んで消耗...&lt;br&gt;HPが6減った。 | きざいをはこんでしょうもう...&lt;br&gt;HPが6へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:4824 | label | 聞き入る | ききいる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4824 | text | 傾聴（HP+10+退屈 / カード強化） | けいちょう（HP+10+たいくつ / カードきょうか） | Active Listening (Receive Boredom / Upgrade 1 card) |
| src/services/eventService.ts:4834 | resultLog | 不思議な歌声でHPが10回復。&lt;br&gt;だが呪い「退屈」を受けた。 | ふしぎなうたごえでHPが10かいふく。&lt;br&gt;だがのろい「たいくつ」をうけた。 | The short break helped your body and mind recover. Heal 10 HP.&lt;br&gt;Received the curse "Normality". |
| src/services/eventService.ts:4847 | resultLog | 耳が鍛えられた。&lt;br&gt;「あかり」が強化された。 | みみがきたえられた。&lt;br&gt;「あかり」がきょうかされた。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:4854 | label | 電源を落とす | でんげんをおとす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4854 | text | 即断（カード削除 / HP+8 / 呪い「不安」） | そくだん（カードさくじょ / HP+8 / のろい「ふあん」） | Quick Decision (Remove 1 card / Heal 8 HP / Receive the curse "Anxiety") |
| src/services/eventService.ts:4869 | resultLog | ノイズを断ち切った。&lt;br&gt;「あかり」を取り除いた。 | のいずをたちきった。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4873 | resultLog | 静寂が戻ってHPが8回復。 | せいじゃくがもどってHPが8かいふく。 | The short break helped your body and mind recover. Heal 8 HP. |
| src/services/eventService.ts:4876 | resultLog | 本当に止めてよかったのか...&lt;br&gt;呪い「不安」を受けた。 | ほんとうにとめてよかったのか...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:4879 | label | 怪電波DJとしてデビュー | かいでんぱDJとしてでびゅー | DJ ー |
| src/services/eventService.ts:4879 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4886 | resultLog | 怪電波がカルト的人気に。&lt;br&gt;レリック「観察メモ」を得た。 | かいでんぱがかるとてきにんきに。&lt;br&gt;おたから「かんさつめも」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Observation Notes". |
| src/services/eventService.ts:4889 | resultLog | 投げ銭で180G獲得。 | なげせんで180Gかくとく。 | Your effort paid off and earned a useful reward. Gained 180G. |
| src/services/eventService.ts:4892 | resultLog | 校内放送で身バレした...&lt;br&gt;呪い「恥」を受けた。 | こうないほうそうでみばれした...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 掲示板の100点答案（22行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4898 | title | 掲示板の100点答案 | けいじばんの100てんとうあん | Perfect Test on the Bulletin Board |
| src/services/eventService.ts:4899 | description | 誰かの100点のテストが飾られている。眩しい。 | だれかの100てんのてすとがかざられている。まぶしい。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:4901 | label | 写して学ぶ | うつしてまなぶ | Copy it and learn |
| src/services/eventService.ts:4901 | text | 模倣（カード強化+恥 / 100G / HP+6） | もほう（カードきょうか+はじ / 100G / HP+6） | Imitation (Card Upgrade and Embarrassment / Gain 100G / Heal 6 HP) |
| src/services/eventService.ts:4915 | resultLog | まる写しで効率アップ。&lt;br&gt;「あかり」強化、呪い「恥」を受けた。 | まるうつしでこうりつあっぷ。&lt;br&gt;「あかり」きょうか、のろい「はじ」をうけた。 | Copying it outright improved efficiency.&lt;br&gt;"Akari" was upgraded, and you received the curse "Embarrassment". |
| src/services/eventService.ts:4919 | resultLog | ノート整理のバイトで100G獲得。 | のーとせいりのばいとで100Gかくとく。 | Tidying things up also helped clear your mind for the next step. Gained 100G. |
| src/services/eventService.ts:4922 | resultLog | 勉強意欲が戻った。&lt;br&gt;HPが6回復。 | べんきょういよくがもどった。&lt;br&gt;HPが6かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 6 HP. |
| src/services/eventService.ts:4925 | label | 破る | やぶる | Tear it up |
| src/services/eventService.ts:4925 | text | 反抗（恒久ムキムキ+2+後悔 / HP-8 / カード削除） | はんこう（こうきゅうむきむき+2+こうかい / HP-8 / カードさくじょ） | Defiance (permanentStrength+2 and Regret / Lose 8 HP / Remove 1 card) |
| src/services/eventService.ts:4935 | resultLog | 嫉妬の炎！&lt;br&gt;恒久ムキムキ+2、呪い「後悔」。 | しっとのほのお！&lt;br&gt;こうきゅうむきむき+2、のろい「こうかい」。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;permanentStrength+2, curse"Regret". |
| src/services/eventService.ts:4938 | resultLog | 先生に追いかけられて消耗...&lt;br&gt;HPが8減った。 | せんせいにおいかけられてしょうもう...&lt;br&gt;HPが8へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 8 HP. |
| src/services/eventService.ts:4952 | resultLog | 古い執着を捨てた。&lt;br&gt;「あかり」を取り除いた。 | ふるいしゅうちゃくをすてた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:4956 | label | 自分の答案を貼る | じぶんのとうあんをはる | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:4956 | text | 挑戦（カード2枚強化 / 最大HP+3 / 呪い「不安」） | ちょうせん（カード2まいきょうか / さいだいHP+3 / のろい「ふあん」） | Choose Option (Upgrade 2 cards / Increase max HP by 3 / Receive the curse "Anxiety") |
| src/services/eventService.ts:4965 | resultLog | 覚悟が決まった。&lt;br&gt;カードを2枚強化。 | かくごがきまった。&lt;br&gt;カードを2まいきょうか。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:4968 | resultLog | 自信がついた。&lt;br&gt;最大HPと現在HPが3増えた。 | じしんがついた。&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:4971 | resultLog | 比較して不安に...&lt;br&gt;呪い「不安」を受けた。 | ひかくしてふあんに...&lt;br&gt;のろい「ふあん」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:4974 | label | 答案展をプロデュース | とうあんてんをぷろでゅーす | The study moment clarified what you needed to understand next. |
| src/services/eventService.ts:4974 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:4981 | resultLog | 教育祭で評価された。&lt;br&gt;レリック「図書カード」を得た。 | きょういくまつりでひょうかされた。&lt;br&gt;おたから「としょカード」をえた。 | Your work was recognized at the education festival.&lt;br&gt;Gained the relic "Library Card". |
| src/services/eventService.ts:4984 | resultLog | 入場料で180G獲得。 | にゅうじょうりょうで180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:4987 | resultLog | 展示がスベって気まずい...&lt;br&gt;呪い「恥」を受けた。 | てんじがすべってきまずい...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 保健室のベッド（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:4993 | title | 保健室のベッド | ほけんしつのべっど | Infirmary Bed |
| src/services/eventService.ts:4994 | description | ふかふかのシーツ。今なら誰もいない。 | ふかふかのしーつ。いまならだれもいない。 | Nothing changed much, but you avoided making things worse. |
| src/services/eventService.ts:4996 | label | 寝る | ねる | Go to sleep |
| src/services/eventService.ts:4996 | text | 休息（全回復+次戦闘E-1 / HP+12） | きゅうそく（ぜんかいふく+じせんとうE-1 / HP+12） | Rest (Heal to full HP and start the next battle with -1 Energy / Heal 12 HP) |
| src/services/eventService.ts:5000 | resultLog | ぐっすり眠った。HP全回復。&lt;br&gt;ただし次戦闘の1ターン目エナジー-1。 | ぐっすりねむった。HPぜんかいふく。&lt;br&gt;ただしじせんとうの1たーんめえなじー-1。 | The short break helped your body and mind recover. Heal to full HP.&lt;br&gt;You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5003 | resultLog | 短時間でも効いた。&lt;br&gt;HPが12回復。 | たんじかんでもきいた。&lt;br&gt;HPが12かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 12 HP. |
| src/services/eventService.ts:5008 | label | 飛び跳ねる | とびはねる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5008 | text | 遊び（最大HP+3 / HP-6 / 恒久ムキムキ+1） | あそび（さいだいHP+3 / HP-6 / こうきゅうむきむき+1） | Play (Increase max HP by 3 / Lose 6 HP / permanentStrength and 1) |
| src/services/eventService.ts:5012 | resultLog | ベッドでジャンプ！&lt;br&gt;最大HPと現在HPが3増えた。 | べっどでじゃんぷ！&lt;br&gt;さいだいHPとげんざいHPが3ふえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP and current HP +3. |
| src/services/eventService.ts:5015 | resultLog | 着地を失敗した...&lt;br&gt;HPが6減った。 | ちゃくちをしっぱいした...&lt;br&gt;HPが6へった。 | The risky choice backfired and left you with a setback.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:5018 | resultLog | 体幹が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | たいかんがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:5021 | label | シーツを整える | しーつをととのえる | Tidying things up also helped clear your mind for the next step. |
| src/services/eventService.ts:5021 | text | 整頓（カード削除 / カード強化 / 呪い） | せいとん（カードさくじょ / カードきょうか / のろい） | Tidying Up (Remove 1 card / Upgrade 1 card / Receive a curse) |
| src/services/eventService.ts:5036 | resultLog | 几帳面さが戻った。&lt;br&gt;「あかり」を取り除いた。 | きちょうめんさがもどった。&lt;br&gt;「あかり」をとりのぞいた。 | Your careful habits returned.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:5050 | resultLog | 手際が良くなった。&lt;br&gt;「あかり」が強化された。 | てぎわがよくなった。&lt;br&gt;「あかり」がきょうかされた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5055 | resultLog | 誰かの視線を感じる...&lt;br&gt;呪い「不安」を受けた。 | だれかのしせんをかんじる...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:5058 | label | 保健室ホテルを開業 | ほけんしつほてるをかいぎょう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5058 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:5065 | resultLog | 寝具経営が成功。&lt;br&gt;レリック「ミニ校舎模型」を得た。 | しんぐけいえいがせいこう。&lt;br&gt;おたから「みにこうしゃもけい」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Mini School Model". |
| src/services/eventService.ts:5068 | resultLog | 宿泊費で180G獲得。 | しゅくはくひで180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:5071 | resultLog | 無断営業がバレた...&lt;br&gt;呪い「恥」を受けた。 | むだんえいぎょうがばれた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 給食の余りの牛乳（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5077 | title | 給食の余りの牛乳 | きゅうしょくのあまりのぎゅうにゅう | Leftover School Milk |
| src/services/eventService.ts:5078 | description | バケツに1本だけ余っている。冷たそうだ。 | ばけつに1ほんだけあまっている。つめたそうだ。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5080 | label | 飲む | のむ | Drink it |
| src/services/eventService.ts:5080 | text | 栄養（最大HP+2 / HP+10 / 呪い） | えいよう（さいだいHP+2 / HP+10 / のろい） | Nutrition (Increase max HP by 2 / Heal 10 HP / Receive a curse) |
| src/services/eventService.ts:5084 | resultLog | カルシウム補給！&lt;br&gt;最大HPと現在HPが2増えた。 | かるしうむほきゅう！&lt;br&gt;さいだいHPとげんざいHPが2ふえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP and current HP +2. |
| src/services/eventService.ts:5087 | resultLog | 体が温まった。&lt;br&gt;HPが10回復。 | からだがあたたまった。&lt;br&gt;HPが10かいふく。 | The short break helped your body and mind recover.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:5090 | resultLog | お腹が痛い...&lt;br&gt;呪い「腹痛」を受けた。 | おはらがいたい...&lt;br&gt;のろい「ふくつう」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Pain". |
| src/services/eventService.ts:5093 | label | かける | かける | Pour it on |
| src/services/eventService.ts:5093 | text | 暴走（全カード強化+HP-5 / 120G / 呪い「恥」） | ぼうそう（ぜんカードきょうか+HP-5 / 120G / のろい「はじ」） | Reckless Move (Upgrade card(s). and HP-5 / Gain 120G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:5100 | resultLog | ミルクシャワー！&lt;br&gt;HP-5、全カード強化。 | みるくしゃわー！&lt;br&gt;HP-5、ぜんカードきょうか。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 5 HP and upgraded all cards. |
| src/services/eventService.ts:5103 | resultLog | 動画がバズって120G獲得。 | どうががばずって120Gかくとく。 | Your effort was recognized and turned into a stronger result. Gained 120G. |
| src/services/eventService.ts:5106 | resultLog | 後片付けで怒られた...&lt;br&gt;呪い「恥」を受けた。 | あとかたづけけでいかられた...&lt;br&gt;のろい「はじ」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:5109 | label | 分け合う | わけあう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5109 | text | 協調（カード削除 / カード強化） | きょうちょう（カードさくじょ / カードきょうか） | Cooperation (Remove 1 card / Upgrade 1 card) |
| src/services/eventService.ts:5124 | resultLog | 気持ちよく分けられた。&lt;br&gt;「あかり」を取り除いた。 | きもちよくわけられた。&lt;br&gt;「あかり」をとりのぞいた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:5138 | resultLog | 連携が良くなった。&lt;br&gt;「あかり」が強化された。 | れんけいがよくなった。&lt;br&gt;「あかり」がきょうかされた。 | Your coordination improved.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5145 | label | 牛乳先物トレード | ぎゅうにゅうさきものとれーど | Milk ー |
| src/services/eventService.ts:5145 | text | 奇想天外（レリック / 180G / 呪い「後悔」） | きそうてんがい（おたから / 180G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Regret") |
| src/services/eventService.ts:5152 | resultLog | 乳製品市場を制した。&lt;br&gt;レリック「給食の大鍋」を得た。 | にゅうせいひんしじょうをせいした。&lt;br&gt;おたから「きゅうしょくのおおなべ」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Big Lunch Pot". |
| src/services/eventService.ts:5155 | resultLog | 相場読み成功で180G獲得。 | そうばよみせいこうで180Gかくとく。 | Your effort was recognized and turned into a stronger result. Gained 180G. |
| src/services/eventService.ts:5158 | resultLog | 全力で外した...&lt;br&gt;呪い「後悔」を受けた。 | ぜんりょくではずした...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |

#### 廊下のワックス（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5164 | title | 廊下のワックス | ろうかのわっくす | Hallway Wax |
| src/services/eventService.ts:5165 | description | 塗りたてピカピカ. 滑るぞ。 | ぬりたてぴかぴか. すべるぞ。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5167 | label | 滑る | すべる | Slide across |
| src/services/eventService.ts:5167 | text | 滑走（上履き+HP-5 / 120G / 恒久ムキムキ+1） | かっそう（うわばき+HP-5 / 120G / こうきゅうむきむき+1） | Slide Run (Indoor Shoes and HP-5 / Gain 120G / permanentStrength and 1) |
| src/services/eventService.ts:5178 | resultLog | かっこいいスライディング！&lt;br&gt;HP-5、レリック「上履き」を得た。 | かっこいいすらいでぃんぐ！&lt;br&gt;HP-5、おたから「うわばき」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:5181 | resultLog | 滑走パフォーマンスがウケた。&lt;br&gt;120G獲得。 | かっそうぱふぉーまんすがうけた。&lt;br&gt;120Gかくとく。 | You moved through the situation cleanly and kept the momentum going.&lt;br&gt;Gained 120G. |
| src/services/eventService.ts:5184 | resultLog | 転ばない体幹が身についた。&lt;br&gt;恒久ムキムキ+1。 | ころばないたいかんがみについた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:5187 | label | 慎重に歩く | しんちょうにあるく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5187 | text | 安全（カード削除 / HP+8） | あんぜん（カードさくじょ / HP+8） | safety (Remove 1 card / Heal 8 HP) |
| src/services/eventService.ts:5202 | resultLog | 丁寧に歩いて無駄を削った。&lt;br&gt;「あかり」を取り除いた。 | ていねいにあるいてむだをけずった。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:5206 | resultLog | 慎重さで疲れが減った。&lt;br&gt;HPが8回復。 | しんちょうさでつかれがへった。&lt;br&gt;HPが8かいふく。 | The short break helped your body and mind recover.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:5211 | label | ワックスがけを手伝う | わっくすがけをてつだう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5211 | text | 作業（カード強化 / HP-4 / 呪い「不安」） | さぎょう（カードきょうか / HP-4 / のろい「ふあん」） | Work (Upgrade 1 card / Lose 4 HP / Receive the curse "Anxiety") |
| src/services/eventService.ts:5225 | resultLog | 職人技を覚えた。&lt;br&gt;「あかり」が強化された。 | しょくにんわざをおぼえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5230 | resultLog | 薬剤でむせた...&lt;br&gt;HPが4減った。 | やくざいでむせた...&lt;br&gt;HPが4へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 4 HP. |
| src/services/eventService.ts:5233 | resultLog | 本当にこれで合ってる？&lt;br&gt;呪い「不安」を受けた。 | ほんとうにこれであってる？&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:5236 | label | 廊下カーリング大会 | ろうかかーりんぐたいかい | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5236 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:5243 | resultLog | 大会が伝説になった。&lt;br&gt;レリック「お道具箱」を得た。 | たいかいがでんせつになった。&lt;br&gt;おたから「おどうぐばこ」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Toolbox". |
| src/services/eventService.ts:5246 | resultLog | 参加費で180G獲得。 | さんかひで180Gかくとく。 | The opportunity produced a practical reward. Gained 180G. |
| src/services/eventService.ts:5249 | resultLog | 転倒シーンが拡散された...&lt;br&gt;呪い「恥」を受けた。 | てんとうしーんがかくさんされた...&lt;br&gt;のろい「はじ」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Embarrassment". |

#### 理科室の毒薬（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5255 | title | 理科室の毒薬 | りかしつのどくやく | Science Room Poison |
| src/services/eventService.ts:5256 | description | ドクロマークの小瓶。どうする？ | どくろまーくのこびん。どうする？ | You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:5258 | label | 飲む | のむ | Drink it |
| src/services/eventService.ts:5258 | text | 試薬（カード強化+HP-10 / 恒久ムキムキ+1 / 呪い） | しやく（カードきょうか+HP-10 / こうきゅうむきむき+1 / のろい） | Potion (Card Upgrade and HP-10 / permanentStrength and 1 / Receive a curse) |
| src/services/eventService.ts:5274 | resultLog | 体が毒に慣れた！&lt;br&gt;HP-10、「あかり」強化。 | からだがどくになれた！&lt;br&gt;HP-10、「あかり」きょうか。 | Your body adapted to the poison!&lt;br&gt;Lost 10 HP, and "Akari" was upgraded. |
| src/services/eventService.ts:5278 | resultLog | 猛毒に耐えて体質が変化。&lt;br&gt;恒久ムキムキ+1。 | もうどくにたえてたいしつがへんか。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:5281 | resultLog | 胃が限界...&lt;br&gt;呪い「腹痛」を受けた。 | いがげんかい...&lt;br&gt;のろい「ふくつう」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Pain". |
| src/services/eventService.ts:5284 | label | 捨てる | すてる | Throw it away |
| src/services/eventService.ts:5284 | text | 平和（50G+HP10 / カード削除） | へいわ（50G+HP10 / カードさくじょ） | Peaceful Approach (Gain 50G and heal 10 HP / Remove 1 card) |
| src/services/eventService.ts:5293 | resultLog | 平和主義で処理した。&lt;br&gt;HP+10、50G獲得。 | へいわしゅぎでしょりした。&lt;br&gt;HP+10、50Gかくとく。 | Your careful choice helped someone and improved the situation.&lt;br&gt;Gained 50G. |
| src/services/eventService.ts:5307 | resultLog | 危険を断って思考が澄んだ。&lt;br&gt;「あかり」を取り除いた。 | きけんをたってしこうがすんだ。&lt;br&gt;「あかり」をとりのぞいた。 | Refusing the danger cleared your thoughts.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:5313 | label | 解毒薬を調合する | げどくくすりをちょうごうする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5313 | text | 研究（カード2枚強化 / HP+8 / 70G） | けんきゅう（カード2まいきょうか / HP+8 / 70G） | Research (Upgrade 2 cards / Heal 8 HP / Gain 70G) |
| src/services/eventService.ts:5322 | resultLog | 理論がつながった。&lt;br&gt;カードを2枚強化。 | りろんがつながった。&lt;br&gt;カードを2まいきょうか。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:5325 | resultLog | 安心してHPが8回復。 | あんしんしてHPが8かいふく。 | Heal 8 HP. |
| src/services/eventService.ts:5328 | resultLog | 試験協力費で70G獲得。 | しけんきょうりょくひで70Gかくとく。 | The opportunity produced a practical reward. Gained 70G. |
| src/services/eventService.ts:5331 | label | 毒薬バーを開く | どくやくばーをひらく | PoisonPotions ー |
| src/services/eventService.ts:5331 | text | 奇想天外（レリック / 180G / 呪い「後悔」） | きそうてんがい（おたから / 180G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Regret") |
| src/services/eventService.ts:5338 | resultLog | 怪しい店が繁盛。&lt;br&gt;レリック「給食の大鍋」を得た。 | あやしいみせがはんじょう。&lt;br&gt;おたから「きゅうしょくのおおなべ」をえた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Gained the relic "Big Lunch Pot". |
| src/services/eventService.ts:5341 | resultLog | 常連客で180G獲得。 | じょうれんきゃくで180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:5344 | resultLog | 保健所に止められた...&lt;br&gt;呪い「後悔」を受けた。 | ほけんしょにやめられた...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |

#### 放課後の決闘（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5350 | title | 放課後の決闘 | ほうかごのけっとう | After-School Duel |
| src/services/eventService.ts:5351 | description | 隣の小学校の番長が待ち構えている。「俺と勝負しろ！」 | となりのしょうがっこうのばんちょうがまちかまえている。「おれとしょうぶしろ！」 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5353 | label | 受けて立つ | うけてたつ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5353 | text | 真剣勝負（HP-20+金の定規 / 150G / 恒久ムキムキ+2） | しんけんしょうぶ（HP-20+きんのじょうぎ / 150G / こうきゅうむきむき+2） | Choose Option (Your Status. If your HP reaches 0, you lose. Use Block to prevent enemy attacks. Block becomes 0 at the end of the turn. / Gain 150G / permanentStrength and 2) |
| src/services/eventService.ts:5364 | resultLog | 激闘に勝利！&lt;br&gt;HP-20、レリック「金の定規」を得た。 | げきとうにしょうり！&lt;br&gt;HP-20、おたから「きんのじょうぎ」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:5367 | resultLog | 引き分けの手打ち金で150G獲得。 | ひきわけのてうちちきんで150Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 150G. |
| src/services/eventService.ts:5370 | resultLog | 負けたが鍛えられた。&lt;br&gt;恒久ムキムキ+2。 | まけたがきたえられた。&lt;br&gt;こうきゅうむきむき+2。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +2. |
| src/services/eventService.ts:5373 | label | 逃げる | にげる | Run |
| src/services/eventService.ts:5373 | text | 撤退（カード削除 / HP+8 / 呪い「恥」） | てったい（カードさくじょ / HP+8 / のろい「はじ」） | Retreat (Remove 1 card / Heal 8 HP / Receive the curse "Embarrassment") |
| src/services/eventService.ts:5388 | resultLog | 逃走ルート最適化。&lt;br&gt;「あかり」を取り除いた。 | とうそうるーとさいてきか。&lt;br&gt;「あかり」をとりのぞいた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:5392 | resultLog | 危機を回避してHPが8回復。 | ききをかいひしてHPが8かいふく。 | The short break helped your body and mind recover. Heal 8 HP. |
| src/services/eventService.ts:5395 | resultLog | 野次で心が折れた...&lt;br&gt;呪い「恥」を受けた。 | やじでこころがおれた...&lt;br&gt;のろい「はじ」をうけた。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:5398 | label | 言葉で和解する | ことばでわかいする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5398 | text | 交渉（カード2枚強化 / HP-6） | こうしょう（カード2まいきょうか / HP-6） | Negotiation (Upgrade 2 cards / Lose 6 HP) |
| src/services/eventService.ts:5407 | resultLog | 対話が通じた。&lt;br&gt;カードを2枚強化。 | たいわがつうじた。&lt;br&gt;カードを2まいきょうか。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:5410 | resultLog | 話し合いは長引いた...&lt;br&gt;HPが6減った。 | はなしあいはながびいた...&lt;br&gt;HPが6へった。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:5415 | label | 決闘を興行化する | けっとうをこうぎょうかする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5415 | text | 奇想天外（レリック / 200G / 呪い「後悔」） | きそうてんがい（おたから / 200G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 200G / Receive the curse "Regret") |
| src/services/eventService.ts:5422 | resultLog | 番長リーグ設立。&lt;br&gt;レリック「赤点答案」を得た。 | ばんちょうりーぐせつりつ。&lt;br&gt;おたから「あかてんとうあん」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Failing Test Paper". |
| src/services/eventService.ts:5425 | resultLog | 観客席が埋まり200G獲得。 | かんきゃくせきがうまり200Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 200G. |
| src/services/eventService.ts:5428 | resultLog | 安全管理で大失敗...&lt;br&gt;呪い「後悔」を受けた。 | あんぜんかんりでだいしっぱい...&lt;br&gt;のろい「こうかい」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Regret". |

#### 秘密基地（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5434 | title | 秘密基地 | ひみつきち | Secret Base |
| src/services/eventService.ts:5435 | description | 森の奥に子供たちの秘密基地を見つけた。お菓子やマンガが置いてある。 | もりのおくにこどもたちのひみつきちをみつけた。おかしやまんががおいてある。 | Deep in the woods, you find a children's secret base. Snacks and manga are lying around. |
| src/services/eventService.ts:5437 | label | 休む | やすむ | Take a rest |
| src/services/eventService.ts:5437 | text | 休憩（HP+30 / カード強化） | きゅうけい（HP+30 / カードきょうか） | Rest (Heal 30 HP / Upgrade 1 card) |
| src/services/eventService.ts:5441 | resultLog | 基地でぐっすり休めた。&lt;br&gt;HPが30回復した。 | きちでぐっすりやすめた。&lt;br&gt;HPが30かいふくした。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Healed 30 HP. |
| src/services/eventService.ts:5453 | resultLog | 作戦会議がはかどった。&lt;br&gt;「あかり」が強化された。 | さくせんかいぎがはかどった。&lt;br&gt;「あかり」がきょうかされた。 | Turning the situation into a plan made the next step easier to take.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5460 | label | あさる | あさる | Search through it |
| src/services/eventService.ts:5460 | text | 探索（エナジー薬+30G / カード削除 / 呪い「後悔」） | たんさく（えなじーくすり+30G / カードさくじょ / のろい「こうかい」） | Search (EnergyPotions and 30G / Remove 1 card / Receive the curse "Regret") |
| src/services/eventService.ts:5472 | resultLog | 宝箱を発見！&lt;br&gt;30Gとエナジーポーションを手に入れた。 | たからばこをはっけん！&lt;br&gt;30Gとえなじーポーションをてにいれた。 | Treasure Chest Found!&lt;br&gt;You turned the event into a useful tool for the road ahead. Gain a potion. |
| src/services/eventService.ts:5486 | resultLog | 不要品を処分した。&lt;br&gt;「あかり」を取り除いた。 | ふようひんをしょぶんした。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:5490 | resultLog | 誰かの私物を壊してしまった...&lt;br&gt;呪い「後悔」を受けた。 | だれかのしぶつをこわしてしまった...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |
| src/services/eventService.ts:5493 | label | 見張りをする | みはりをする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5493 | text | 警備（恒久ムキムキ+1 / 90G / HP-8） | けいび（こうきゅうむきむき+1 / 90G / HP-8） | Security (permanentStrength and 1 / Gain 90G / Lose 8 HP) |
| src/services/eventService.ts:5497 | resultLog | 警戒心が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | けいかいしんがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:5500 | resultLog | 見張りの報酬で90G獲得。 | みはりのほうしゅうで90Gかくとく。 | Your effort paid off and earned a useful reward. Gained 90G. |
| src/services/eventService.ts:5503 | resultLog | 長時間立ちっぱなしで消耗...&lt;br&gt;HPが8減った。 | ちょうじかんたちっぱなしでしょうもう...&lt;br&gt;HPが8へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 8 HP. |
| src/services/eventService.ts:5506 | label | 基地を要塞化する | きちをようさいかする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5506 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:5513 | resultLog | 秘密基地が難攻不落になった。&lt;br&gt;レリック「厚紙シールド」を得た。 | ひみつきちがなんこうふらくになった。&lt;br&gt;おたから「あつがみしーるど」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Cardboard Shield". |
| src/services/eventService.ts:5516 | resultLog | 防衛費のカンパが集まり180G獲得。 | ぼうえいひのかんぱがあつまり180Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 180G. |
| src/services/eventService.ts:5519 | resultLog | 要塞化が大げさすぎて笑われた...&lt;br&gt;呪い「恥」を受けた。 | ようさいかがおおげさすぎてわらわれた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 脱走したウサギ（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5525 | title | 脱走したウサギ | だっそうしたうさぎ | Escaped Rabbit |
| src/services/eventService.ts:5526 | description | 飼育小屋のウサギが逃げ出した！校庭を走り回っている。 | しいくこやのうさぎがにげだした！こうていをはしりまわっている。 | A rabbit has escaped from the animal shed! It is running around the schoolyard. |
| src/services/eventService.ts:5528 | label | 捕まえる | つかまえる | Catch it |
| src/services/eventService.ts:5528 | text | 追跡（50G / カード強化 / HP-6） | ついせき（50G / カードきょうか / HP-6） | Pursuit (Gain 50G / Upgrade 1 card / Lose 6 HP) |
| src/services/eventService.ts:5532 | resultLog | 見事に確保！&lt;br&gt;先生から50Gもらった。 | みごとにかくほ！&lt;br&gt;せんせいから50Gもらった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;The opportunity produced a practical reward. |
| src/services/eventService.ts:5544 | resultLog | 追跡で集中力が上がった。&lt;br&gt;「あかり」が強化された。 | ついせきでしゅうちゅうりょくがあがった。&lt;br&gt;「あかり」がきょうかされた。 | The chase sharpened your focus.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5549 | resultLog | 全力疾走でバテた...&lt;br&gt;HPが6減った。 | ぜんりょくしっそうでばてた...&lt;br&gt;HPが6へった。 | You moved through the situation cleanly and kept the momentum going.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:5552 | label | 一緒に遊ぶ | いっしょにあそぶ | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5552 | text | ふれあい（最大HP+3 / HP+10） | ふれあい（さいだいHP+3 / HP+10） | Friendly Contact (Increase max HP by 3 / Heal 10 HP) |
| src/services/eventService.ts:5556 | resultLog | ウサギと仲良くなった。&lt;br&gt;最大HP+3。 | うさぎとなかよくなった。&lt;br&gt;さいだいHP+3。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Max HP +3. |
| src/services/eventService.ts:5559 | resultLog | ふわふわに癒やされた。&lt;br&gt;HPが10回復。 | ふわふわにいやされた。&lt;br&gt;HPが10かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:5564 | label | ニンジンで誘導 | にんじんでゆうどう | The exchange with others changed the mood and opened a way forward. |
| src/services/eventService.ts:5564 | text | 作戦（ポーション / 120G / 呪い「不安」） | さくせん（ポーション / 120G / のろい「ふあん」） | Choose Option (Gain a potion / Gain 120G / Receive the curse "Anxiety") |
| src/services/eventService.ts:5569 | resultLog | 誘導成功！&lt;br&gt;体力ポーションを入手。 | ゆうどうせいこう！&lt;br&gt;たいりょくポーションをにゅうしゅ。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Obtained a stamina Potion. |
| src/services/eventService.ts:5572 | resultLog | 飼育委員会から謝礼120Gを獲得。 | しいくいいんかいからしゃれい120Gをかくとく。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:5575 | resultLog | ニンジンの位置を迷って大混乱...&lt;br&gt;呪い「不安」を受けた。 | にんじんのいちをまよってだいこんらん...&lt;br&gt;のろい「ふあん」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:5578 | label | ウサギレースを開催 | うさぎれーすをかいさい | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5578 | text | 奇想天外（レリック / 180G / 呪い「後悔」） | きそうてんがい（おたから / 180G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Regret") |
| src/services/eventService.ts:5585 | resultLog | 大盛況の夜レース！&lt;br&gt;レリック「懐中電灯」を得た。 | だいせいきょうのよるれーす！&lt;br&gt;おたから「かいちゅうでんとう」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Flashlight". |
| src/services/eventService.ts:5588 | resultLog | 参加費で180G獲得。 | さんかひで180Gかくとく。 | The opportunity produced a practical reward. Gained 180G. |
| src/services/eventService.ts:5591 | resultLog | 運営が大混乱...&lt;br&gt;呪い「後悔」を受けた。 | うんえいがだいこんらん...&lt;br&gt;のろい「こうかい」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Regret". |

#### 飼育小屋の主（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5597 | title | 飼育小屋の主 | しいくこやのしゅ | Master of the Animal Shed |
| src/services/eventService.ts:5598 | description | 飼育小屋の奥に、主と呼ばれる巨大なニワトリがいる。 | しいくこやのおくに、しゅとよばれるきょだいなにわとりがいる。 | Deep inside the animal shed is a giant chicken known as the master. |
| src/services/eventService.ts:5600 | label | 戦う | たたかう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5600 | text | 正面突破（HP-10+カード強化 / 140G / 恒久ムキムキ+1） | しょうめんとっぱ（HP-10+カードきょうか / 140G / こうきゅうむきむき+1） | Frontal Breakthrough (Upgrade card(s). / Gain 140G / permanentStrength and 1) |
| src/services/eventService.ts:5616 | resultLog | 主との激闘に勝利した。&lt;br&gt;HP-10、「あかり」が強化された。 | しゅとのげきとうにしょうりした。&lt;br&gt;HP-10、「あかり」がきょうかされた。 | You won the fierce battle against the master.&lt;br&gt;Lost 10 HP, and "Akari" was upgraded. |
| src/services/eventService.ts:5620 | resultLog | 見世物になってしまったが、賭け金で140G獲得。 | みせものになってしまったが、かけきんで140Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 140G. |
| src/services/eventService.ts:5623 | resultLog | つつかれ続けて体幹が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | つつかれつづけてたいかんがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:5626 | label | 卵をもらう | たまごをもらう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5626 | text | 交渉（ポーション / HP+10） | こうしょう（ポーション / HP+10） | Negotiation (Gain a potion / Heal 10 HP) |
| src/services/eventService.ts:5631 | resultLog | 新鮮な卵を分けてもらった。&lt;br&gt;体力ポーションを入手。 | しんせんなたまごをわけてもらった。&lt;br&gt;たいりょくポーションをにゅうしゅ。 | The opportunity produced a practical reward.&lt;br&gt;Obtained a stamina Potion. |
| src/services/eventService.ts:5634 | resultLog | 栄養たっぷりの卵料理でHPが10回復。 | えいようたっぷりのたまごりょうりでHPが10かいふく。 | The short break helped your body and mind recover. Heal 10 HP. |
| src/services/eventService.ts:5639 | label | 掃除を手伝う | そうじをてつだう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5639 | text | 奉仕（カード削除 / 100G / 呪い「不安」） | ほうし（カードさくじょ / 100G / のろい「ふあん」） | Service (Remove 1 card / Gain 100G / Receive the curse "Anxiety") |
| src/services/eventService.ts:5654 | resultLog | 誠意が伝わった。&lt;br&gt;「あかり」を取り除いた。 | せいいがつたわった。&lt;br&gt;「あかり」をとりのぞいた。 | Your careful choice helped someone and improved the situation.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:5658 | resultLog | 飼育委員会から謝礼100Gを獲得。 | しいくいいんかいからしゃれい100Gをかくとく。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:5661 | resultLog | 本当にこの掃除で合ってる？&lt;br&gt;呪い「不安」を受けた。 | ほんとうにこのそうじであってる？&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:5664 | label | ニワトリ王国を建国 | にわとりおうこくをけんこく | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5664 | text | 奇想天外（レリック / 200G / 呪い「後悔」） | きそうてんがい（おたから / 200G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 200G / Receive the curse "Regret") |
| src/services/eventService.ts:5671 | resultLog | 王国の戴冠式が始まった。&lt;br&gt;レリック「給食の大鍋」を得た。 | おうこくのたいかんしきがはじまった。&lt;br&gt;おたから「きゅうしょくのおおなべ」をえた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Gained the relic "Big Lunch Pot". |
| src/services/eventService.ts:5674 | resultLog | 観光収入で200G獲得。 | かんこうしゅうにゅうで200Gかくとく。 | Your effort paid off and earned a useful reward. Gained 200G. |
| src/services/eventService.ts:5677 | resultLog | 国家運営が破綻した...&lt;br&gt;呪い「後悔」を受けた。 | こっかうんえいがはたんした...&lt;br&gt;のろい「こうかい」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Regret". |

#### 闇の掲示板（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5683 | title | 闇の掲示板 | やみのけいじばん | Dark Bulletin Board |
| src/services/eventService.ts:5684 | description | 校舎裏の掲示板に, ターゲットの情報が書かれている。 | こうしゃうらのけいじばんに, たーげっとのじょうほうがかかれている。 | Behind the school building, target information is written on a bulletin board. |
| src/services/eventService.ts:5686 | label | 情報を売る | じょうほうをうる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5686 | text | 取引（カード削除+50G / 120G / 呪い「恥」） | とりひき（カードさくじょ+50G / 120G / のろい「はじ」） | Deal (Remove Card and 50G / Gain 120G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:5701 | resultLog | 売買成立。&lt;br&gt;50G獲得し、「あかり」を処分した。 | ばいばいせいりつ。&lt;br&gt;50Gかくとくし、「あかり」をしょぶんした。 | The deal went through.&lt;br&gt;Gained 50G and removed "Akari". |
| src/services/eventService.ts:5705 | resultLog | 相場が跳ね上がり120G獲得。 | そうばがはねあがり120Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 120G. |
| src/services/eventService.ts:5708 | resultLog | 取引記録がバレた...&lt;br&gt;呪い「恥」を受けた。 | とりひききろくがばれた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:5711 | label | 依頼を受ける | いらいをうける | The opportunity produced a practical reward. |
| src/services/eventService.ts:5711 | text | 実行（HP-15+毒突き / 180G / 恒久ムキムキ+1） | じっこう（HP-15+どくづき / 180G / こうきゅうむきむき+1） | Execution (HP -15+Poison / Gain 180G / permanentStrength and 1) |
| src/services/eventService.ts:5721 | resultLog | 危ない任務を完遂。&lt;br&gt;HP-15、「毒突き」を習得。 | あぶないにんむをかんすい。&lt;br&gt;HP-15、「どくづき」をしゅうとく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:5724 | resultLog | 高額報酬で180G獲得。 | こうがくほうしゅうで180Gかくとく。 | Your effort paid off and earned a useful reward. Gained 180G. |
| src/services/eventService.ts:5727 | resultLog | 修羅場を越えて鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | しゅらばをこえてきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:5730 | label | 掲示板を消す | けいじばんをけす | Bulletin Board |
| src/services/eventService.ts:5730 | text | 鎮圧（HP+12 / カード強化） | ちんあつ（HP+12 / カードきょうか） | Suppression (Heal 12 HP / Upgrade 1 card) |
| src/services/eventService.ts:5734 | resultLog | 悪い噂が消えて気持ちが軽くなった。&lt;br&gt;HPが12回復。 | わるいうわさがきえてきもちがかるくなった。&lt;br&gt;HPが12かいふく。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Heal 12 HP. |
| src/services/eventService.ts:5746 | resultLog | 迷いが消えた。&lt;br&gt;「あかり」が強化された。 | まよいがきえた。&lt;br&gt;「あかり」がきょうかされた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5753 | label | 有料ニュース配信 | ゆうりょうにゅーすはいしん | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5753 | text | 奇想天外（レリック / 200G / 呪い「後悔」） | きそうてんがい（おたから / 200G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 200G / Receive the curse "Regret") |
| src/services/eventService.ts:5760 | resultLog | 配信が大当たり。&lt;br&gt;レリック「懐中電灯」を得た。 | はいしんがおおあたり。&lt;br&gt;おたから「かいちゅうでんとう」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Flashlight". |
| src/services/eventService.ts:5763 | resultLog | 課金が集まり200G獲得。 | かきんがあつまり200Gかくとく。 | Your effort paid off and earned a useful reward. Gained 200G. |
| src/services/eventService.ts:5766 | resultLog | 炎上で謝罪会見...&lt;br&gt;呪い「後悔」を受けた。 | えんじょうでしゃざいかいけん...&lt;br&gt;のろい「こうかい」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Regret". |

#### 理科室の爆発（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5772 | title | 理科室の爆発 | りかしつのばくはつ | Science Room Explosion |
| src/services/eventService.ts:5773 | description | 実験中に薬品を混ぜすぎた！フラスコが光り輝いている。 | じっけんちゅうにやくひんをまぜすぎた！ふらすこがひかりかがやいている。 | Too many chemicals were mixed during an experiment! The flask is glowing brightly. |
| src/services/eventService.ts:5775 | label | 耐える | たえる | Endure it |
| src/services/eventService.ts:5775 | text | 耐久（HP-15+ポーション2個 / カード強化 / 呪い「腹痛」） | たいきゅう（HP-15+ポーション2こ / カードきょうか / のろい「ふくつう」） | Endurance (You turned the event into a useful tool for the road ahead. Gain a potion. / Upgrade 1 card / Receive the curse "Pain") |
| src/services/eventService.ts:5788 | resultLog | 爆風を耐え切った。&lt;br&gt;HP-15、ポーションを2個入手。 | ばくふうをたえきった。&lt;br&gt;HP-15、ポーションを2こにゅうしゅ。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Lost 15 HP and obtained 2 potions. |
| src/services/eventService.ts:5800 | resultLog | 危機対応が洗練された。&lt;br&gt;「あかり」が強化された。 | ききたいおうがせんれんされた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5805 | resultLog | 有毒ガスを吸ってしまった...&lt;br&gt;呪い「腹痛」を受けた。 | ゆうどくがすをすってしまった...&lt;br&gt;のろい「ふくつう」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Pain". |
| src/services/eventService.ts:5808 | label | 逃げる | にげる | Run |
| src/services/eventService.ts:5808 | text | 退避（HP+10 / 90G） | たいひ（HP+10 / 90G） | Evacuation (Heal 10 HP / Gain 90G) |
| src/services/eventService.ts:5812 | resultLog | 無事に退避できた。&lt;br&gt;HPが10回復。 | ぶじにたいひできた。&lt;br&gt;HPが10かいふく。 | You moved through the situation cleanly and kept the momentum going.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:5815 | resultLog | 避難誘導で感謝され、90G獲得。 | ひなんゆうどうでかんしゃされ、90Gかくとく。 | The exchange with others changed the mood and opened a way forward. Gained 90G. |
| src/services/eventService.ts:5820 | label | 原因を解析する | げんいんをかいせきする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5820 | text | 分析（カード2枚強化 / 恒久ムキムキ+1 / HP-8） | ぶんせき（カード2まいきょうか / こうきゅうむきむき+1 / HP-8） | Analysis (Upgrade 2 cards / permanentStrength and 1 / Lose 8 HP) |
| src/services/eventService.ts:5829 | resultLog | 分析ノートが完成した。&lt;br&gt;カードを2枚強化。 | ぶんせきのーとがかんせいした。&lt;br&gt;カードを2まいきょうか。 | The study moment clarified what you needed to understand next.&lt;br&gt;Upgraded 2 cards. |
| src/services/eventService.ts:5832 | resultLog | 化学知識で自信がついた。&lt;br&gt;恒久ムキムキ+1。 | かがくちしきでじしんがついた。&lt;br&gt;こうきゅうむきむき+1。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:5835 | resultLog | 調査中にまた小爆発...&lt;br&gt;HPが8減った。 | ちょうさちゅうにまたしょうばくはつ...&lt;br&gt;HPが8へった。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Lost 8 HP. |
| src/services/eventService.ts:5838 | label | 爆発ショーを開催 | ばくはつしょーをかいさい | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5838 | text | 奇想天外（レリック / 200G / 呪い「恥」） | きそうてんがい（おたから / 200G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 200G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:5845 | resultLog | 危険芸が伝説になった。&lt;br&gt;レリック「お道具箱」を得た。 | きけんげいがでんせつになった。&lt;br&gt;おたから「おどうぐばこ」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Toolbox". |
| src/services/eventService.ts:5848 | resultLog | 興行が当たり200G獲得。 | こうぎょうがあたり200Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 200G. |
| src/services/eventService.ts:5851 | resultLog | 派手に失敗して大恥...&lt;br&gt;呪い「恥」を受けた。 | はでにしっぱいしておおはじ...&lt;br&gt;のろい「はじ」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Embarrassment". |

#### 地獄の特訓（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5857 | title | 地獄の特訓 | じごくのとっくん | Hellish Training |
| src/services/eventService.ts:5858 | description | タイヤを引いて校庭を10周！エースへの道は険しい。 | たいやをひいてこうていを10しゅう！えーすへのみちはけわしい。 | Pull a tire around the schoolyard for 10 laps! The road to becoming an ace is rough. |
| src/services/eventService.ts:5860 | label | やる | やる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5860 | text | 本気（HP-10+最大HP+10 / 恒久ムキムキ+2 / カード強化） | ほんき（HP-10+さいだいHP+10 / こうきゅうむきむき+2 / カードきょうか） | Full Effort (HP-10+Max HP +10 / permanentStrength and 2 / Upgrade 1 card) |
| src/services/eventService.ts:5871 | resultLog | 限界まで走り切った。&lt;br&gt;HP-10、最大HP+10。 | げんかいまではしりきった。&lt;br&gt;HP-10、さいだいHP+10。 | You moved through the situation cleanly and kept the momentum going.&lt;br&gt;Lost 10 HP and gained +10 Max HP. |
| src/services/eventService.ts:5874 | resultLog | 地獄を越えて覚醒。&lt;br&gt;恒久ムキムキ+2。 | じごくをこえてかくせい。&lt;br&gt;こうきゅうむきむき+2。 | The experience strengthened your resolve and helped you grow.&lt;br&gt;Permanent Strength +2. |
| src/services/eventService.ts:5886 | resultLog | フォーム改善で技が冴えた。&lt;br&gt;「あかり」が強化された。 | ふぉーむかいぜんでわざがさえた。&lt;br&gt;「あかり」がきょうかされた。 | You refined what you learned and turned it into a practical advantage.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5891 | label | サボる | さぼる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5891 | text | 回避（HP全回復 / 120G / 呪い「恥」） | かいひ（HPぜんかいふく / 120G / のろい「はじ」） | Dodge (Heal to full HP. / Gain 120G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:5895 | resultLog | 木陰で回復に専念した。&lt;br&gt;HPが全回復。 | こかげでかいふくにせんねんした。&lt;br&gt;HPがぜんかいふく。 | The short break helped your body and mind recover.&lt;br&gt;Fully healed HP. |
| src/services/eventService.ts:5898 | resultLog | 代走の手配で120G獲得。 | だいそうのてはいで120Gかくとく。 | You moved through the situation cleanly and kept the momentum going. Gained 120G. |
| src/services/eventService.ts:5901 | resultLog | サボりが見つかった...&lt;br&gt;呪い「恥」を受けた。 | さぼりがみつかった...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:5904 | label | メニューを組み直す | めにゅーをくみなおす | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5904 | text | 指導（カード削除 / HP+12） | しどう（カードさくじょ / HP+12） | Guidance (Remove 1 card / Heal 12 HP) |
| src/services/eventService.ts:5919 | resultLog | 無駄を省いた。&lt;br&gt;「あかり」を取り除いた。 | むだをはぶいた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:5923 | resultLog | 負荷が適正化され、HPが12回復。 | ふかがてきせいかされ、HPが12かいふく。 | The short break helped your body and mind recover. Heal 12 HP. |
| src/services/eventService.ts:5928 | label | 特訓配信でバズる | とっくんはいしんでばずる | Your effort was recognized and turned into a stronger result. |
| src/services/eventService.ts:5928 | text | 奇想天外（レリック / 220G / 呪い「後悔」） | きそうてんがい（おたから / 220G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 220G / Receive the curse "Regret") |
| src/services/eventService.ts:5935 | resultLog | 鬼コーチ企画がヒット。&lt;br&gt;レリック「赤点答案」を得た。 | おにこーちきかくがひっと。&lt;br&gt;おたから「あかてんとうあん」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Failing Test Paper". |
| src/services/eventService.ts:5938 | resultLog | 広告収入で220G獲得。 | こうこくしゅうにゅうで220Gかくとく。 | Your effort paid off and earned a useful reward. Gained 220G. |
| src/services/eventService.ts:5941 | resultLog | 炎上して企画中止...&lt;br&gt;呪い「後悔」を受けた。 | えんじょうしてきかくちゅうし...&lt;br&gt;のろい「こうかい」をうけた。 | The mishap left a mark and cost you momentum.&lt;br&gt;Received the curse "Regret". |

#### 校内放送ジャック（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:5947 | title | 校内放送ジャック | こうないほうそうじゃっく | School Broadcast Takeover |
| src/services/eventService.ts:5948 | description | お昼の放送でリサイタルを開こう！全校生徒が君の歌を待っている（？） | おひるのほうそうでりさいたるをひらこう！ぜんこうせいとがきみのうたをまっている（？） | Put on a lunchtime broadcast recital! The whole school is waiting for your song... probably. |
| src/services/eventService.ts:5950 | label | 熱唱 | ねっしょう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5950 | text | 全力ライブ（最大エナジー+1+HP-10 / 180G / 恒久ムキムキ+1） | ぜんりょくらいぶ（さいだいえなじー+1+HP-10 / 180G / こうきゅうむきむき+1） | Strength (Gain 1 Energy. and HP-10 / Gain 180G / permanentStrength and 1) |
| src/services/eventService.ts:5961 | resultLog | 魂の熱唱が刺さった！&lt;br&gt;最大エナジー+1、HP-10。 | たましいのねっしょうがささった！&lt;br&gt;さいだいえなじー+1、HP-10。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You handled the moment and carried its outcome into what came next. Gain 1 Energy. |
| src/services/eventService.ts:5964 | resultLog | 投げ銭が飛び交い180G獲得。 | なげせんがとびこうい180Gかくとく。 | Your effort paid off and earned a useful reward. Gained 180G. |
| src/services/eventService.ts:5967 | resultLog | 腹式呼吸が身についた。&lt;br&gt;恒久ムキムキ+1。 | ふくしきこきゅうがみについた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:5970 | label | バラード | ばらーど | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5970 | text | 癒やし系（HP+20 / カード強化） | いやしけい（HP+20 / カードきょうか） | Healing Approach (Heal 20 HP / Upgrade 1 card) |
| src/services/eventService.ts:5974 | resultLog | しっとり歌い上げた。&lt;br&gt;HPが20回復。 | しっとりうたいあげた。&lt;br&gt;HPが20かいふく。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 20 HP. |
| src/services/eventService.ts:5986 | resultLog | 集中が研ぎ澄まされた。&lt;br&gt;「あかり」が強化された。 | しゅうちゅうがとぎすまされた。&lt;br&gt;「あかり」がきょうかされた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:5993 | label | 機材を調整する | きざいをちょうせいする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:5993 | text | 裏方（カード削除 / ポーション / HP-6） | うらかた（カードさくじょ / ポーション / HP-6） | Backstage Support (Remove 1 card / Gain a potion / Lose 6 HP) |
| src/services/eventService.ts:6008 | resultLog | ノイズを除去した。&lt;br&gt;「あかり」を取り除いた。 | のいずをじょきょした。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:6013 | resultLog | 余った栄養ドリンクを入手。&lt;br&gt;エナジーポーションを得た。 | あまったえいようどりんくをにゅうしゅ。&lt;br&gt;えなじーポーションをえた。 | The opportunity produced a practical reward.&lt;br&gt;You turned the event into a useful tool for the road ahead. Gain a potion. |
| src/services/eventService.ts:6016 | resultLog | 重い機材で腰を痛めた...&lt;br&gt;HPが6減った。 | おもいきざいでこしをいためた...&lt;br&gt;HPが6へった。 | The physical effort sharpened your rhythm and confidence.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:6019 | label | 学校をフェス会場にする | がっこうをふぇすかいじょうにする | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6019 | text | 奇想天外（レリック / 220G / 呪い「恥」） | きそうてんがい（おたから / 220G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 220G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:6026 | resultLog | 照明演出が大成功。&lt;br&gt;レリック「懐中電灯」を得た。 | しょうめいえんしゅつがだいせいこう。&lt;br&gt;おたから「かいちゅうでんとう」をえた。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Gained the relic "Flashlight". |
| src/services/eventService.ts:6029 | resultLog | チケット収入で220G獲得。 | ちけっとしゅうにゅうで220Gかくとく。 | Your effort paid off and earned a useful reward. Gained 220G. |
| src/services/eventService.ts:6032 | resultLog | 音響トラブルで大事故...&lt;br&gt;呪い「恥」を受けた。 | おんきょうとらぶるでだいじこ...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 延滞図書の督促（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:6038 | title | 延滞図書の督促 | えんたいとしょのとくそく | Overdue Library Notice |
| src/services/eventService.ts:6039 | description | 「あ、あの...本返してください...」不良グループが本を返してくれない。 | 「あ、あの...ほんかえしてください...」ふりょうぐるーぷがほんをかえしてくれない。 | "Um... please give the book back..." A group of delinquents refuses to return it. |
| src/services/eventService.ts:6041 | label | 戦う | たたかう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6041 | text | 強行（HP-5+カード強化 / 120G / 恒久ムキムキ+1） | きょうこう（HP-5+カードきょうか / 120G / こうきゅうむきむき+1） | Force Through (Upgrade card(s). / Gain 120G / permanentStrength and 1) |
| src/services/eventService.ts:6057 | resultLog | 勇気を出して取り返した。&lt;br&gt;HP-5、「あかり」が強化された。 | ゆうきをだしてとりかえした。&lt;br&gt;HP-5、「あかり」がきょうかされた。 | You found the courage to take it back.&lt;br&gt;Lost 5 HP, and "Akari" was upgraded. |
| src/services/eventService.ts:6061 | resultLog | 示談金として120Gを獲得。 | じだんきんとして120Gをかくとく。 | The opportunity produced a practical reward. |
| src/services/eventService.ts:6064 | resultLog | 度胸がついた。&lt;br&gt;恒久ムキムキ+1。 | どきょうがついた。&lt;br&gt;こうきゅうむきむき+1。 | Facing the feeling directly helped your mind settle.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:6067 | label | 諦める | あきらめる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6067 | text | 撤退（呪い「不安」 / HP+10） | てったい（のろい「ふあん」 / HP+10） | Retreat (Receive the curse "Anxiety" / Heal 10 HP) |
| src/services/eventService.ts:6074 | resultLog | 言い出せずに退いた...&lt;br&gt;呪い「不安」を受けた。 | いいだせずにしりぞいた...&lt;br&gt;のろい「ふあん」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Anxiety". |
| src/services/eventService.ts:6077 | resultLog | 深呼吸して気持ちを立て直した。&lt;br&gt;HPが10回復。 | しんこきゅうしてきもちをたてなおした。&lt;br&gt;HPが10かいふく。 | The short break helped your body and mind recover.&lt;br&gt;Heal 10 HP. |
| src/services/eventService.ts:6082 | label | 先生に相談する | せんせいにそうだんする | Ask the teacher for advice |
| src/services/eventService.ts:6082 | text | 公的手段（カード削除 / 90G / 呪い「恥」） | こうてきしゅだん（カードさくじょ / 90G / のろい「はじ」） | Official Procedure (Remove 1 card / Gain 90G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:6097 | resultLog | 正式な手続きで解決。&lt;br&gt;「あかり」を取り除いた。 | せいしきなてつづきでかいけつ。&lt;br&gt;「あかり」をとりのぞいた。 | You solved it through the proper procedure.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:6101 | resultLog | 図書委員会から謝礼90Gを獲得。 | としょいいんかいからしゃれい90Gをかくとく。 | Your helpful action was noticed, and you received thanks in return. |
| src/services/eventService.ts:6104 | resultLog | 大事になって注目を浴びた...&lt;br&gt;呪い「恥」を受けた。 | だいじになってちゅうもくをあびた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |
| src/services/eventService.ts:6107 | label | 延滞者更生ラップを披露 | えんたいものこうせいらっぷをひろう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6107 | text | 奇想天外（レリック / 200G / 呪い「後悔」） | きそうてんがい（おたから / 200G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 200G / Receive the curse "Regret") |
| src/services/eventService.ts:6114 | resultLog | 説教ラップが学校中で話題に。&lt;br&gt;レリック「懐中電灯」を得た。 | せっきょうらっぷががっこうなかでわだいに。&lt;br&gt;おたから「かいちゅうでんとう」をえた。 | The exchange with others changed the mood and opened a way forward.&lt;br&gt;Gained the relic "Flashlight". |
| src/services/eventService.ts:6117 | resultLog | 配信収益で200G獲得。 | はいしんしゅうえきで200Gかくとく。 | The opportunity produced a practical reward. Gained 200G. |
| src/services/eventService.ts:6120 | resultLog | 韻が滑って黒歴史化...&lt;br&gt;呪い「後悔」を受けた。 | いんがすべってくろれきしか...&lt;br&gt;のろい「こうかい」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Regret". |

#### 肥沃な土壌（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:6126 | title | 肥沃な土壌 | ひよくなどじょう | Fertile Soil |
| src/services/eventService.ts:6127 | description | とても良質な土を見つけた。種を植えるには最適だ。 | とてもりょうしつなつちをみつけた。たねをうえるにはさいてきだ。 | You found very high-quality soil. It is perfect for planting seeds. |
| src/services/eventService.ts:6129 | label | 植える | うえる | Plant it |
| src/services/eventService.ts:6129 | text | 栽培（成長+2 / カード強化 / HP+8） | さいばい（せいちょう+2 / カードきょうか / HP+8） | Cultivation (growth and 2 / Upgrade 1 card / Heal 8 HP) |
| src/services/eventService.ts:6148 | resultLog | 土の力で作物がぐんと育った。 | つちのちからでさくもつがぐんとそだった。 | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6161 | resultLog | 土いじりで集中した。&lt;br&gt;「あかり」が強化された。 | つちいじりでしゅうちゅうした。&lt;br&gt;「あかり」がきょうかされた。 | Working with the soil helped you focus.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:6166 | resultLog | 自然の香りで落ち着いた。&lt;br&gt;HPが8回復。 | しぜんのかおりでおちついた。&lt;br&gt;HPが8かいふく。 | You took a moment to recover and regain your rhythm.&lt;br&gt;Heal 8 HP. |
| src/services/eventService.ts:6169 | label | 持ち帰る | もちかえる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6169 | text | 運搬（100G / ポーション / 呪い「腹痛」） | うんぱん（100G / ポーション / のろい「ふくつう」） | Carrying (Gain 100G / Gain a potion / Receive the curse "Pain") |
| src/services/eventService.ts:6173 | resultLog | 良質な土が高く売れた。&lt;br&gt;100G獲得。 | りょうしつなつちがたかくうれた。&lt;br&gt;100Gかくとく。 | Your effort paid off and earned a useful reward.&lt;br&gt;Gained 100G. |
| src/services/eventService.ts:6177 | resultLog | 栄養抽出に成功。&lt;br&gt;体力ポーションを入手。 | えいようちゅうしゅつにせいこう。&lt;br&gt;たいりょくポーションをにゅうしゅ。 | Your effort was recognized and turned into a stronger result.&lt;br&gt;Obtained a stamina Potion. |
| src/services/eventService.ts:6180 | resultLog | 土埃を吸い込みすぎた...&lt;br&gt;呪い「腹痛」を受けた。 | つちぼこりをすいこみすぎた...&lt;br&gt;のろい「ふくつう」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Pain". |
| src/services/eventService.ts:6183 | label | 土壌を分析する | どじょうをぶんせきする | You refined what you learned and turned it into a practical advantage. |
| src/services/eventService.ts:6183 | text | 研究（カード削除 / 恒久ムキムキ+1） | けんきゅう（カードさくじょ / こうきゅうむきむき+1） | Research (Remove 1 card / permanentStrength and 1) |
| src/services/eventService.ts:6198 | resultLog | 無駄を取り除けた。&lt;br&gt;「あかり」を取り除いた。 | むだをとりのぞけた。&lt;br&gt;「あかり」をとりのぞいた。 | You cleared away something unnecessary and made room to move forward.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:6202 | resultLog | 耕作で体幹が鍛えられた。&lt;br&gt;恒久ムキムキ+1。 | こうさくでたいかんがきたえられた。&lt;br&gt;こうきゅうむきむき+1。 | The short break helped your body and mind recover.&lt;br&gt;Permanent Strength +1. |
| src/services/eventService.ts:6207 | label | 土で巨大プリンを作る | つちできょだいぷりんをつくる | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6207 | text | 奇想天外（レリック / 180G / 呪い「恥」） | きそうてんがい（おたから / 180G / のろい「はじ」） | Wild Idea (Gain a relic / Gain 180G / Receive the curse "Embarrassment") |
| src/services/eventService.ts:6214 | resultLog | 謎料理がなぜか絶賛された。&lt;br&gt;レリック「給食の大鍋」を得た。 | なぞりょうりがなぜかぜっさんされた。&lt;br&gt;おたから「きゅうしょくのおおなべ」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Big Lunch Pot". |
| src/services/eventService.ts:6217 | resultLog | 屋台が売れて180G獲得。 | やたいがうれて180Gかくとく。 | Your effort paid off and earned a useful reward. Gained 180G. |
| src/services/eventService.ts:6220 | resultLog | 見た目が強烈すぎた...&lt;br&gt;呪い「恥」を受けた。 | みためがきょうれつすぎた...&lt;br&gt;のろい「はじ」をうけた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Received the curse "Embarrassment". |

#### 新メニューのインスピレーション（21行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/eventService.ts:6226 | title | 新メニューのインスピレーション | しんめにゅーのいんすぴれーしょん | New Menu Inspiration |
| src/services/eventService.ts:6227 | description | 食堂の隅に古いレシピ本がある。新しいアイデアが浮かぶかも。 | しょくどうのすみにふるいれしぴほんがある。あたらしいあいであがうかぶかも。 | An old recipe book sits in the corner of the cafeteria. It might inspire a new idea. |
| src/services/eventService.ts:6229 | label | 研究する | けんきゅうする | Research it |
| src/services/eventService.ts:6229 | text | 試作（カード変化 / カード強化） | しさく（カードへんか / カードきょうか） | Prototype (Transform 1 card / Upgrade 1 card) |
| src/services/eventService.ts:6241 | resultLog | 新しいメニューがひらめいた。&lt;br&gt;カード1枚が別のカードに変化した。 | あたらしいめにゅーがひらめいた。&lt;br&gt;カード1まいがべつのカードにへんかした。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You turned the event into a useful tool for the road ahead. |
| src/services/eventService.ts:6253 | resultLog | 味の調整が決まった。&lt;br&gt;「あかり」が強化された。 | あじのちょうせいがきまった。&lt;br&gt;「あかり」がきょうかされた。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;"Akari" was upgraded. |
| src/services/eventService.ts:6260 | label | 試食する | ししょくする | Taste-test it |
| src/services/eventService.ts:6260 | text | 実食（HP+15+恒久ムキムキ+1 / 120G / 呪い「腹痛」） | みしょく（HP+15+こうきゅうむきむき+1 / 120G / のろい「ふくつう」） | Taste Test (HP +15+permanentStrength+1 / Gain 120G / Receive the curse "Pain") |
| src/services/eventService.ts:6273 | resultLog | 絶品だった！&lt;br&gt;HPが15回復し、恒久ムキムキ+1。 | ぜっぴんだった！&lt;br&gt;HPが15かいふくし、こうきゅうむきむき+1。 | You handled the moment and carried its outcome into what came next.&lt;br&gt;Heal 15 HP. Permanent Strength +1. |
| src/services/eventService.ts:6276 | resultLog | 試食レビューがバズって120G獲得。 | ししょくれびゅーがばずって120Gかくとく。 | Your effort was recognized and turned into a stronger result. Gained 120G. |
| src/services/eventService.ts:6279 | resultLog | 食べ合わせに失敗...&lt;br&gt;呪い「腹痛」を受けた。 | たべあわせにしっぱい...&lt;br&gt;のろい「ふくつう」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Pain". |
| src/services/eventService.ts:6282 | label | 厨房を手伝う | ちゅうぼうをてつだう | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6282 | text | 実務（カード削除 / ポーション / HP-6） | じつむ（カードさくじょ / ポーション / HP-6） | Practical Work (Remove 1 card / Gain a potion / Lose 6 HP) |
| src/services/eventService.ts:6297 | resultLog | 段取りが洗練された。&lt;br&gt;「あかり」を取り除いた。 | だんどりがせんれんされた。&lt;br&gt;「あかり」をとりのぞいた。 | Reviewing the plan made the next steps clearer and your movements smoother.&lt;br&gt;Removed "Akari". |
| src/services/eventService.ts:6302 | resultLog | まかないドリンクをもらった。&lt;br&gt;エナジーポーションを入手。 | まかないどりんくをもらった。&lt;br&gt;えなじーポーションをにゅうしゅ。 | The opportunity produced a practical reward.&lt;br&gt;Obtained a Energy Potion. |
| src/services/eventService.ts:6305 | resultLog | 慣れない火加減で消耗...&lt;br&gt;HPが6減った。 | なれないひかげんでしょうもう...&lt;br&gt;HPが6へった。 | The mishap left a mark and cost you momentum.&lt;br&gt;Lost 6 HP. |
| src/services/eventService.ts:6308 | label | 世界給食フェスを開催 | せかいきゅうしょくふぇすをかいさい | You handled the moment and carried its outcome into what came next. |
| src/services/eventService.ts:6308 | text | 奇想天外（レリック / 220G / 呪い「後悔」） | きそうてんがい（おたから / 220G / のろい「こうかい」） | Wild Idea (Gain a relic / Gain 220G / Receive the curse "Regret") |
| src/services/eventService.ts:6315 | resultLog | 給食の大鍋メニューが大ヒット。&lt;br&gt;レリック「給食の大鍋」を得た。 | きゅうしょくのおおなべめにゅーがだいひっと。&lt;br&gt;おたから「きゅうしょくのおおなべ」をえた。 | The event turned into a memorable success with lasting value.&lt;br&gt;Gained the relic "Big Lunch Pot". |
| src/services/eventService.ts:6318 | resultLog | 来場者が殺到して220G獲得。 | らいじょうしゃがさっとうして220Gかくとく。 | You handled the moment and carried its outcome into what came next. Gained 220G. |
| src/services/eventService.ts:6321 | resultLog | 仕込みが間に合わず大混乱...&lt;br&gt;呪い「後悔」を受けた。 | しこみがまにあわずだいこんらん...&lt;br&gt;のろい「こうかい」をうけた。 | The risky choice backfired and left you with a setback.&lt;br&gt;Received the curse "Regret". |

## 高校編・マジック編テーマ

### イベント背景 / テーマ（149行）

#### 補助 / 結果文（1行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:51 | description | 【光の魔法の魔法】光の魔法。得意分野は光の魔法。固有能力「光の魔法」を軸に戦う光の魔法。 | 【ひかりのまほうのまほう】ひかりのまほう。とくいぶんやはひかりのまほう。こゆうのうりょく「ひかりのまほう」をじくにたたかうひかりのまほう。 | You handled the moment and carried its outcome into what came next. |

#### 深夜の自習室（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:459 | title | 深夜の自習室 | しんやのじしゅうしつ | Midnight Study Room |
| src/data/visualThemes.ts:460 | description | 誰もいない自習室に、まだ消えていないスタンドライトが一つだけ残っている。 | だれもいないじしゅうしつに、まだきえていないすたんどらいとがひとつだけのこっている。 | In the empty study room, a single desk lamp is still lit. |

#### 屋上の夕焼け（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:464 | title | 屋上の夕焼け | おくじょうのゆうやけ | Sunset on the Rooftop |
| src/data/visualThemes.ts:465 | description | 夕焼けの屋上に風だけが通る。少し立ち止まるにはちょうどいい。 | ゆうやけのおくじょうにかぜだけがとおる。すこしたちとまるにはちょうどいい。 | Only the wind passes across the sunset rooftop. It is just right for stopping a moment. |

#### 模試の返却（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:469 | title | 模試の返却 | もしのへんきゃく | Mock Exam Returns |
| src/data/visualThemes.ts:470 | description | 赤い丸が並ぶ答案が返ってきた。次の一手を考える時間だ。 | あかいまるがならぶとうあんがかえってきた。つぎのいってをかんがえるじかんだ。 | An answer sheet lined with red circles has been returned. It is time to think about your next move. |

#### 文化祭の準備（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:474 | title | 文化祭の準備 | ぶんかさいのじゅんび | Festival Preparations |
| src/data/visualThemes.ts:475 | description | 教室は装飾と段ボールでいっぱいだ。手伝えば何か得るものがありそうだ。 | きょうしつはそうしょくとだんぼーるでいっぱいだ。てつだえばなにかえるものがありそうだ。 | The classroom is packed with decorations and cardboard. If you help out, you may gain something. |

#### 掲示板の廊下（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:479 | title | 掲示板の廊下 | けいじばんのろうか | Bulletin Board Hallway |
| src/data/visualThemes.ts:480 | description | 放課後の廊下に、色とりどりの部活ポスターが並んでいる。 | ほうかごのろうかに、いろとりどりのぶかつぽすたーがならんでいる。 | Colorful club posters line the hallway after school. |

#### 化学室の事故（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:484 | title | 化学室の事故 | かがくしつのじこ | Chemistry Room Accident |
| src/data/visualThemes.ts:485 | description | フラスコから光が噴き上がった。危険だが、珍しい成果も期待できる。 | ふらすこからひかりがふきあがった。きけんだが、めずらしいせいかもきたいできる。 | Light bursts from a flask. It is dangerous, but a rare result may come from it. |

#### コンビニ休憩（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:489 | title | コンビニ休憩 | こんびにきゅうけい | Convenience Store Break |
| src/data/visualThemes.ts:490 | description | 帰り道のコンビニで少しだけ息をつく。補給するか、先を急ぐか。 | かえりみちのこんびにですこしだけいきをつく。ほきゅうするか、さきをいそぐか。 | You take a short breather at the convenience store on the way home. Restock, or hurry on? |

#### 生徒会室の資料（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:494 | title | 生徒会室の資料 | せいとかいしつのしりょう | Student Council Documents |
| src/data/visualThemes.ts:495 | description | 生徒会室の机に、未整理の資料が高く積まれている。 | せいとかいしつのつくえに、みせいりのしりょうがたかくつまれている。 | Unsorted documents are stacked high on a desk in the student council room. |

#### 雨の校門（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:499 | title | 雨の校門 | あめのこうもん | Rainy School Gate |
| src/data/visualThemes.ts:500 | description | 雨に煙る校門で、帰るべきか、もう少しだけ残るべきか迷う。 | あめにけぶるこうもんで、かえるべきか、もうすこしだけのこるべきかまよう。 | At the rain-blurred school gate, you wonder whether to go home or stay a little longer. |

#### 放課後の教室（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:504 | title | 放課後の教室 | ほうかごのきょうしつ | After-School Classroom |
| src/data/visualThemes.ts:505 | description | 人気のない教室に、夕方の光だけが静かに残っている。 | ひとけのないきょうしつに、ゆうがたのひかりだけがしずかにのこっている。 | In the empty classroom, only the evening light remains quietly. |

#### 音楽室の夕暮れ（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:509 | title | 音楽室の夕暮れ | おんがくしつのゆうぐれ | Music Room at Dusk |
| src/data/visualThemes.ts:510 | description | 人気のない音楽室で、譜面台だけが夕日を受けている。 | にんきのないおんがくしつで、ふめんだいだけがゆうひをうけている。 | In the empty music room, only the music stands catch the sunset. |

#### 体育館の忘れ物（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:514 | title | 体育館の忘れ物 | たいいくかんのわすれもの | Forgotten Items in the Gym |
| src/data/visualThemes.ts:515 | description | 静かな体育館に、水筒とタオルだけが残されている。 | しずかなたいいくかんに、すいとうとたおるだけがのこされている。 | In the quiet gym, only a water bottle and towel have been left behind. |

#### 図書室の灯り（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:519 | title | 図書室の灯り | としょしつのあかり | Library Light |
| src/data/visualThemes.ts:520 | description | 閉館後の図書室に、読みかけの本と灯りが一つ残っている。 | へいかんごのとしょしつに、よみかけのほんとあかりがひとつのこっている。 | After closing time, one half-read book and one light remain in the library. |

#### 雨上がりの駐輪場（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:524 | title | 雨上がりの駐輪場 | あめあがりのちゅうりんじょう | Bike Parking After the Rain |
| src/data/visualThemes.ts:525 | description | 濡れた自転車が並ぶ駐輪場に、雨上がりの光が差している。 | ぬれたじてんしゃがならぶちゅうりんじょうに、あめあがりのひかりがさしている。 | Sunlight after the rain falls across rows of wet bicycles in the bike parking area. |

#### 保健室の午後（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:529 | title | 保健室の午後 | ほけんしつのごご | Afternoon in the Nurse's Office |
| src/data/visualThemes.ts:530 | description | 白いベッドとカーテンの向こうで、時間だけがゆっくり進んでいる。 | しろいべっどとかーてんのむこうで、じかんだけがゆっくりすすんでいる。 | Beyond the white bed and curtains, only time moves slowly. |

#### 美術室のキャンバス（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:534 | title | 美術室のキャンバス | びじゅつしつのきゃんばす | Canvas in the Art Room |
| src/data/visualThemes.ts:535 | description | 描きかけのキャンバスが、誰かの途中の決意を映している。 | えがきかけのきゃんばすが、だれかのとちゅうのけついをうつしている。 | An unfinished canvas reflects someone's still-forming resolve. |

#### 靴箱の夕風（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:539 | title | 靴箱の夕風 | くつばこのゆうかぜ | Evening Wind at the Shoe Lockers |
| src/data/visualThemes.ts:540 | description | 開け放たれた昇降口を、放課後の風が静かに抜けていく。 | あけはなたれたしょうこうくちを、ほうかごのかぜがしずかにぬけていく。 | The after-school wind quietly passes through the open entrance. |

#### 駅のベンチ（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:544 | title | 駅のベンチ | えきのべんち | Station Bench |
| src/data/visualThemes.ts:545 | description | 終電前のホームに、人の気配だけが薄く残っている。 | しゅうでんまえのほーむに、にんのけはいだけがうすくのこっている。 | On the platform before the last train, only faint traces of people remain. |

#### 入学式の桜道（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:548 | title | 入学式の桜道 | にゅうがくしきのさくらみち | Cherry Blossom Road to the Entrance Ceremony |
| src/data/visualThemes.ts:548 | description | 桜が舞う校門に、新しい制服のざわめきが満ちている。 | さくらがまうこうもんに、あたらしいせいふくのざわめきがみちている。 | Cherry blossoms dance at the school gate, filled with the rustle of new uniforms. |

#### 勧誘の中庭（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:549 | title | 勧誘の中庭 | かんゆうのなかにわ | Recruitment Courtyard |
| src/data/visualThemes.ts:549 | description | 先輩たちの声が飛び交い、部活のチラシが春風に揺れる。 | せんぱいたちのこえがとびこうい、ぶかつのちらしがはるかぜにゆれる。 | Upperclassmen call out as club flyers sway in the spring breeze. |

#### 席替えのくじ（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:550 | title | 席替えのくじ | せきがえのくじ | Seat-Change Lottery |
| src/data/visualThemes.ts:550 | description | 教室の真ん中で、次の景色を決める小さなくじが回っている。 | きょうしつのまんなかで、つぎのけしきをきめるちいさなくじがまわっている。 | In the middle of the classroom, a small lottery decides the next view. |

#### 屋上の昼休み（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:551 | title | 屋上の昼休み | おくじょうのひるやすみ | Rooftop Lunch Break |
| src/data/visualThemes.ts:551 | description | 弁当を広げた友人たちの笑い声が、青空へ抜けていく。 | べんとうをひろげたゆうじんたちのわらいこえが、あおぞらへぬけていく。 | The laughter of friends with open lunch boxes drifts into the blue sky. |

#### 相合い傘の校門（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:552 | title | 相合い傘の校門 | あいあいがさのこうもん | Shared Umbrella at the Gate |
| src/data/visualThemes.ts:552 | description | 雨粒の向こうで、一本の傘を分け合う二人が立ち止まる。 | あまつぶのむこうで、いっぽんのかさをわけあうふたりがたちとまる。 | Beyond the raindrops, two people pause under a shared umbrella. |

#### 廊下の返却ノート（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:553 | title | 廊下の返却ノート | ろうかのへんきゃくのーと | Returned Notebook in the Hallway |
| src/data/visualThemes.ts:553 | description | 教師が差し出したノートに、赤字の助言が丁寧に並んでいる。 | きょうしがさしだしたのーとに、あかじのじょげんがていねいにならんでいる。 | In the notebook the teacher offers, red-ink advice is carefully written out. |

#### 生徒会オリエンテーション（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:554 | title | 生徒会オリエンテーション | せいとかいおりえんてーしょん | Student Council Orientation |
| src/data/visualThemes.ts:554 | description | 長机を囲む声の中に、学校を動かす空気が少しだけ見える。 | ながづくえをかこむこえのなかに、がっこうをうごかすくうきがすこしだけみえる。 | Around the long table, the voices reveal a glimpse of how the school is run. |

#### 桜掃きの放課後（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:555 | title | 桜掃きの放課後 | さくらはきのほうかご | After-School Cherry Blossom Sweeping |
| src/data/visualThemes.ts:555 | description | 花びらを掃く手元に、春の終わりが静かに積もっていく。 | はなびらをはくてもとに、はるのおわりがしずかにつもっていく。 | As hands sweep up petals, the end of spring quietly gathers there. |

#### 靴箱の手紙（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:556 | title | 靴箱の手紙 | くつばこのてがみ | Letter in the Shoe Locker |
| src/data/visualThemes.ts:556 | description | 開いた靴箱の奥に、差出人のない封筒が一通だけ残されている。 | ひらいたくつばこのおくに、さしだしにんのないふうとうがいっつうだけのこされている。 | At the back of the open shoe locker, a single envelope with no sender remains. |

#### 体育祭のリレー（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:557 | title | 体育祭のリレー | たいいくさいのりれー | The short break helped your body and mind recover. |
| src/data/visualThemes.ts:557 | description | 乾いた土を蹴る足音と声援が、真夏の校庭を震わせる。 | かわいたつちをけるあしおととせいえんが、まなつのこうていをしんわせる。 | Footsteps kicking dry dirt and cheering voices shake the midsummer schoolyard. |

#### かき氷の準備室（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:558 | title | かき氷の準備室 | かきこおりのじゅんびしつ | Turning the situation into a plan made the next step easier to take. |
| src/data/visualThemes.ts:558 | description | 部室では氷とシロップが並び、祭り前の熱気が立ちのぼる。 | ぶしつではこおりとしろっぷがならび、まつりまえのねっきがたちのぼる。 | In the club room, ice and syrup are lined up as pre-festival excitement rises. |

#### 試験前の勉強会（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:559 | title | 試験前の勉強会 | しけんまえのべんきょうかい | Learning challenge |
| src/data/visualThemes.ts:559 | description | 図書室の机に参考書が積まれ、眠気より焦りが勝っている。 | としょしつのつくえにさんこうしょがつまれ、ねむけよりあせりがかっている。 | Reference books are stacked on the library desk, and urgency is beating sleepiness. |

#### 蝉時雨の窓辺（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:560 | title | 蝉時雨の窓辺 | せみしぐれのまどべ | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:560 | description | 窓の外の蝉と扇風機だけが、午後の時間を進めている。 | まどのそとのせみとせんぷうきだけが、ごごのじかんをすすめている。 | Only the cicadas outside and the fan keep the afternoon moving. |

#### 水泳部の休憩（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:561 | title | 水泳部の休憩 | すいえいぶのきゅうけい | Swim Club Rest |
| src/data/visualThemes.ts:561 | description | プールサイドに水滴が光り、練習後の息が少しずつ整う。 | ぷーるさいどにすいてきがひかり、れんしゅうのちのいきがすこしずつととのう。 | Water drops shine by the poolside as breathing slowly settles after practice. |

#### 屋上の花火（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:562 | title | 屋上の花火 | おくじょうのはなび | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:562 | description | 夜空に開く光を、言葉少なに見上げる影が並ぶ。 | よぞらにひらくひかりを、ことばすくなにみあげるかげがならぶ。 | Silent figures line up, looking up at lights blooming in the night sky. |

#### 吹奏楽の合奏（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:563 | title | 吹奏楽の合奏 | すいそうがくのがっそう | Wind Ensemble Rehearsal |
| src/data/visualThemes.ts:563 | description | 音楽室に重なる音が、まだ未完成の曲を少しずつ形にする。 | おんがくしつにかさなるおとが、まだみかんせいのきょくをすこしずつかたちにする。 | Layered sounds in the music room slowly shape an unfinished piece. |

#### 夏のコンビニ前（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:564 | title | 夏のコンビニ前 | なつのこんびにまえ | In Front of the Convenience Store in Summer |
| src/data/visualThemes.ts:564 | description | 湿った夕方、買ったばかりの飲み物が手のひらを冷やす。 | しめったゆうがた、かったばかりののみものがてのひらをひやす。 | On a humid evening, a freshly bought drink cools your palm. |

#### 夕立の駐輪場（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:565 | title | 夕立の駐輪場 | ゆうだちのちゅうりんじょう | Bike Parking in a Sudden Shower |
| src/data/visualThemes.ts:565 | description | 屋根を打つ雨音の下で、帰れない生徒たちが空を見上げる。 | やねをうつあまおとのしたで、かえれないせいとたちがそらをみあげる。 | Under rain striking the roof, students who cannot go home look up at the sky. |

#### 文化祭の怪物づくり（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:566 | title | 文化祭の怪物づくり | ぶんかさいのかいぶつづくり | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:566 | description | 段ボールと絵の具の匂いの中、教室が別の世界へ変わっていく。 | だんぼーるとえのぐのにおいのなか、きょうしつがべつのせかいへかわっていく。 | Amid the smell of cardboard and paint, the classroom transforms into another world. |

#### 落葉の写生会（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:567 | title | 落葉の写生会 | おちばのしゃせいかい | Fallen-Leaf Sketching Session |
| src/data/visualThemes.ts:567 | description | 赤い葉を追う鉛筆の線が、静かな秋を紙に留めていく。 | あかいはをおうえんぴつのせんが、しずかなあきをかみにとめていく。 | Pencil lines following red leaves capture a quiet autumn on paper. |

#### 進路相談室（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:568 | title | 進路相談室 | しんろそうだんしつ | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:568 | description | 教師の問いかけの前で、未来が少しだけ具体的な形を持つ。 | きょうしのといかけのまえで、みらいがすこしだけぐたいてきなかたちをもつ。 | Before the teacher's question, the future takes on a slightly clearer shape. |

#### 修学旅行のホーム（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:569 | title | 修学旅行のホーム | しゅうがくりょこうのほーむ | School Trip Platform |
| src/data/visualThemes.ts:569 | description | 大きな鞄と期待を抱えた列が、発車ベルを待っている。 | おおきなかばんときたいをかかえたれつが、はっしゃべるをまっている。 | A line carrying big bags and expectations waits for the departure bell. |

#### 夕焼けの野球部（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:570 | title | 夕焼けの野球部 | ゆうやけのやきゅうぶ | Baseball Club |
| src/data/visualThemes.ts:570 | description | 長い影の中で、最後の一球まで声が途切れない。 | ながいかげのなかで、さいごのいっきゅうまでこえがとぎれない。 | In the long shadows, voices do not stop until the final pitch. |

#### 家庭科室の焼き菓子（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:571 | title | 家庭科室の焼き菓子 | かていかしつのやきかし | Baked Sweets in the Home Economics Room |
| src/data/visualThemes.ts:571 | description | 甘い香りが広がり、失敗も笑いに変わる午後になる。 | あまいかおりがひろがり、しっぱいもわらいにかわるごごになる。 | A sweet smell spreads, turning even mistakes into laughter that afternoon. |

#### 新聞部の取材（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:572 | title | 新聞部の取材 | しんぶんぶのしゅざい | Newspaper Club Interview |
| src/data/visualThemes.ts:572 | description | 廊下の片隅で、質問の一つひとつが相手の輪郭を映していく。 | ろうかのかたすみで、しつもんのひとつひとつがあいてのりんかくをうつしていく。 | In a corner of the hallway, each question brings the other person into clearer focus. |

#### 紅葉の裏道（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:573 | title | 紅葉の裏道 | こうようのうらみち | Back Road of Autumn Leaves |
| src/data/visualThemes.ts:573 | description | 体育館裏の道を、友人との会話がゆっくり進んでいく。 | たいいくかんうらのみちを、ゆうじんとのかいわがゆっくりすすんでいく。 | Along the path behind the gym, conversation with a friend moves slowly onward. |

#### 掲示板の結果発表（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:574 | title | 掲示板の結果発表 | けいじばんのけっかはっぴょう | Bulletin Board Result |
| src/data/visualThemes.ts:574 | description | 張り出された紙の前に、人の波とため息が重なっている。 | はりだされたかみのまえに、にんのなみとためいきがかさなっている。 | In front of the posted results, waves of people overlap with sighs. |

#### 雪の朝の校門（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:575 | title | 雪の朝の校門 | ゆきのあさのこうもん | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:575 | description | 白く染まった通学路で、足音だけがいつもより柔らかい。 | しろくそまったつうがくろで、あしおとだけがいつもよりやわらかい。 | On the white-covered school route, even footsteps sound softer than usual. |

#### ストーブ前の教室（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:576 | title | ストーブ前の教室 | すとーぶまえのきょうしつ | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:576 | description | 登校直後の教室に、人が少しずつ温まりに集まってくる。 | とうこうちょくごのきょうしつに、にんがすこしずつあたたまりにあつまってくる。 | Just after arrival, students slowly gather in the classroom to warm up. |

#### 冬のチャリティー（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:577 | title | 冬のチャリティー | ふゆのちゃりてぃー | Winter Charity |
| src/data/visualThemes.ts:577 | description | 飾り付けられた廊下で、手渡す品物に小さな善意が混じる。 | かざりつけられたろうかで、てわたすしなものにちいさなぜんいがまじる。 | In the decorated hallway, small kindness mixes into the items being handed over. |

#### 初詣の寄り道（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:578 | title | 初詣の寄り道 | はつもうでのよりみち | New Year's Shrine Detour |
| src/data/visualThemes.ts:578 | description | 冬休み明けの仲間たちが、境内でそれぞれの願いを結ぶ。 | ふいやすみあけのなかまたちが、けいだいでそれぞれのねがいをむすぶ。 | Friends just back from winter break tie up their separate wishes at the shrine. |

#### 模試面談（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:579 | title | 模試面談 | もしめんだん | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:579 | description | 机の上の数字を前に、焦りと覚悟が同じ椅子に座っている。 | つくえのうえのすうじをまえに、あせりとかくごがおなじいすにすわっている。 | Before the numbers on the desk, anxiety and resolve sit in the same chair. |

#### 靴箱のバレンタイン（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:580 | title | 靴箱のバレンタイン | くつばこのばれんたいん | Valentine at the Shoe Lockers |
| src/data/visualThemes.ts:580 | description | 夕方の昇降口で、小さな箱が思い切りの証になる。 | ゆうがたのしょうこうくちで、ちいさなはこがおもいきりのしょうになる。 | At the evening entryway, a small box becomes proof of courage. |

#### 卒業式の花道（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:581 | title | 卒業式の花道 | そつぎょうしきのはなみち | Graduation Ceremony |
| src/data/visualThemes.ts:581 | description | 花束と拍手の間を、三年間の時間が静かに通り過ぎていく。 | はなたばとはくしゅのかんを、さんねんまのじかんがしずかにとおりすぎていく。 | Between bouquets and applause, three years pass quietly by. |

#### 卒業後の教室（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:582 | title | 卒業後の教室 | そつぎょうごのきょうしつ | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:582 | description | 誰もいない教室に、夕日だけが最後まで残っている。 | だれもいないきょうしつに、ゆうひだけがさいごまでのこっている。 | In the empty classroom, only the sunset remains until the end. |

#### 深夜のファミレス（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:583 | title | 深夜のファミレス | しんやのふぁみれす | Late-Night Family Restaurant |
| src/data/visualThemes.ts:583 | description | 参考書とドリンクバーの明かりの中で、友人たちがまだ粘っている。 | さんこうしょとどりんくばーのあかりのなかで、ゆうじんたちがまだねばっている。 | Under reference books and the drink bar lights, friends are still holding on. |

#### 星図教室の放課後（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:654 | title | 星図教室の放課後 | せいずきょうしつのほうかご | the classroom after school |
| src/data/visualThemes.ts:654 | description | 黒板に浮かぶ星図が、今日の選択を静かに照らしている。 | こくばんにうかぶせいずが、きょうのせんたくをしずかにてらしている。 | The star chart floating on the blackboard quietly lights today's choice. |

#### 月光の中庭（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:655 | title | 月光の中庭 | げっこうのなかにわ | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:655 | description | 月の光を浴びた噴水の前で、誰かがひとり考え込んでいる。 | つきのひかりをあびたふんすいのまえで、だれかがひとりかんがえこんでいる。 | In front of the moonlit fountain, someone is deep in thought alone. |

#### 花の迷宮演習（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:656 | title | 花の迷宮演習 | はなのめいきゅうえんしゅう | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:656 | description | 訓練場に咲いた魔法の花が、正しい道と危険な道を隠している。 | くんれんばにさいたまほうのはなが、ただしいみちときけんなみちをかくしている。 | Magical flowers blooming in the training field hide both the right path and the dangerous one. |

#### 炎の魔法実技（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:657 | title | 炎の魔法実技 | ほのおのまほうじつぎ | You refined what you learned and turned it into a practical advantage. |
| src/data/visualThemes.ts:657 | description | 実技室の結界内で、炎の軌跡が勇気と焦りを映し出す。 | じつぎしつのけっかいないで、ほのおのきせきがゆうきとあせりをうつしだす。 | Inside the practical room's barrier, trails of flame reflect courage and impatience. |

#### 深淵図書館の栞（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:658 | title | 深淵図書館の栞 | しんえんとしょかんのしおり | Bookmark of the Abyss Library |
| src/data/visualThemes.ts:658 | description | 禁書棚の奥で、見覚えのない栞が小さく光っている。 | きんしょたなのおくで、みおぼえのないしおりがちいさくひかっている。 | Deep in the forbidden bookshelf, an unfamiliar bookmark glows faintly. |

#### 時計塔の補習（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:659 | title | 時計塔の補習 | とけいとうのほしゅう | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:659 | description | 止まった時計の針が、やり直したい一問を指している。 | とまったとけいのはりが、やりなおしたいいちもんをさしている。 | The hands of a stopped clock point to one question you want to redo. |

#### 風渡りの屋上（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:660 | title | 風渡りの屋上 | かぜわたりのおくじょう | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:660 | description | 屋上を抜ける風に、言えなかった言葉が少しだけ軽くなる。 | おくじょうをぬけるかぜに、いえなかったことばがすこしだけかるくなる。 | In the wind crossing the rooftop, words left unsaid grow a little lighter. |

#### 夢見の保健室（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:661 | title | 夢見の保健室 | ゆめみのほけんしつ | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:661 | description | 白いカーテンの向こうで、誰かの悪夢が淡い光になって揺れる。 | しろいかーてんのむこうで、だれかのあくむがあわいひかりになってゆれる。 | Beyond the white curtain, someone's nightmare sways as pale light. |

#### 光の礼拝堂（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:662 | title | 光の礼拝堂 | ひかりのれいはいどう | Your careful choice helped someone and improved the situation. |
| src/data/visualThemes.ts:662 | description | ステンドグラスの下で、使命と願いのどちらを選ぶか問われる。 | すてんどぐらすのしたで、しめいとねがいのどちらをえらぶかとわれる。 | Beneath the stained glass, you are asked whether to choose duty or desire. |

#### 魔法陣の廊下（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:663 | title | 魔法陣の廊下 | まほうじんのろうか | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:663 | description | 廊下の床に現れた魔法陣が、次の出会いへ導いている。 | ろうかのとこにあらわれたまほうじんが、つぎのであいへみちびいている。 | A magic circle on the hallway floor guides you toward the next encounter. |

#### SNSに届いた予兆（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:664 | title | SNSに届いた予兆 | SNSにとどいたよちょう | You noticed the opening and turned it into an advantage. |
| src/data/visualThemes.ts:664 | description | 端末に届いた短いメッセージが、学園の裏側の異変を告げる。 | たんまつにとどいたみじかいめっせーじが、がくえんのうらがわのいへんをつげる。 | A short message on your device warns of trouble behind the academy's surface. |

#### 購買部の魔法雑貨（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:665 | title | 購買部の魔法雑貨 | こうばいぶのまほうざっか | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:665 | description | 棚に並ぶ不思議な小物の中に、今日だけ役立つ品が混じっている。 | たなにならぶふしぎなこもののなかに、きょうだけやくたつひんがまじっている。 | Among the strange trinkets on the shelf is something useful only today. |

#### 寮の作戦会議（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:666 | title | 寮の作戦会議 | りょうのさくせんかいぎ | Dorm Strategy Meeting |
| src/data/visualThemes.ts:666 | description | 夜の共有スペースで、仲間たちが明日の作戦を小声で話し合う。 | よるのきょうゆうすぺーすで、なかまたちがあしたのさくせんをこごえではなしあう。 | In the shared space at night, friends quietly discuss tomorrow's plan. |

#### 水族館の約束（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:667 | title | 水族館の約束 | すいぞくかんのやくそく | Aquarium Promise |
| src/data/visualThemes.ts:667 | description | 休日の水槽前で、戦いから離れた一瞬の本音がこぼれる。 | きゅうじつのすいそうまえで、たたかいからはなれたいっしゅんのほんねがこぼれる。 | Before a holiday aquarium tank, a rare honest feeling slips out away from battle. |

#### 夏祭りの結界（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:668 | title | 夏祭りの結界 | なつまつりのけっかい | Summer Festival Barrier |
| src/data/visualThemes.ts:668 | description | 屋台の明かりに紛れて、薄い結界のほころびが見えている。 | やたいのあかりにまぎれて、うすいけっかいのほころびがみえている。 | Amid the stall lights, you can see a thin barrier beginning to fray. |

#### 文化祭の秘密舞台（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:669 | title | 文化祭の秘密舞台 | ぶんかさいのひみつぶたい | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:669 | description | 舞台袖の暗がりで、誰かの魔法と恋心が同時に揺れている。 | ぶたいそでのあんがりで、だれかのまほうとこいごころがどうじにゆれている。 | In the darkness offstage, someone's magic and romantic feelings waver together. |

#### クリスマス街の魔光（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:670 | title | クリスマス街の魔光 | くりすますまちのまひかり | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:670 | description | イルミネーションの中に、異世界からの淡い信号が混じっている。 | いるみねーしょんのなかに、いせかいからのあわいしんごうがまじっている。 | Among the illuminations, a faint signal from another world is mixed in. |

#### バレンタインの魔法包み（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:671 | title | バレンタインの魔法包み | ばれんたいんのまほうつつみ | You handled the moment and carried its outcome into what came next. |
| src/data/visualThemes.ts:671 | description | 小さな包みに込めた気持ちが、魔力より強く胸を鳴らす。 | ちいさなつつみにこめたきもちが、まりょくよりつよくむねをならす。 | The feeling tucked into a small package makes your heart beat louder than magic. |

#### 卒業式前夜の星空（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:672 | title | 卒業式前夜の星空 | そつぎょうしきぜんやのほしぞら | Graduation Ceremony |
| src/data/visualThemes.ts:672 | description | 最後の夜、九人の願いが星空の下でひとつの答えに近づく。 | さいごのよる、きゅうにんのねがいがほしぞらのしたでひとつのこたえにちかづく。 | On the final night, nine wishes move closer to one answer beneath the stars. |

#### 真夜中の変身訓練（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/visualThemes.ts:673 | title | 真夜中の変身訓練 | まよなかのへんしんくんれん | JH Transform |
| src/data/visualThemes.ts:673 | description | 誰もいない訓練場で、変身後の自分と向き合う時間が始まる。 | だれもいないくんれんばで、へんしんごのじぶんとむきあうじかんがはじまる。 | In the empty training field, your time facing your transformed self begins. |

## マジック編

### イベント実行（44行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/magicRomanceEventService.ts:272 | text | 好感度+50 | こうかんど+50 | Affection +50 |
| src/services/magicRomanceEventService.ts:307 | resultLog | あかり 好感度+50&lt;br&gt;サンプル&lt;br&gt;50 | あかり こうかんど+50&lt;br&gt;さんぷる&lt;br&gt;50 | Akari Affection +50&lt;br&gt;Sample&lt;br&gt;50 |
| src/services/magicRomanceEventService.ts:322 | label | 一緒に帰る | いっしょにかえる | Go Home Together |
| src/services/magicRomanceEventService.ts:322 | text | HPを10回復 | HPを10かいふく | Heal 10 HP |
| src/services/magicRomanceEventService.ts:323 | label | 次の任務を相談する | つぎのにんむをそうだんする | Discuss the Next Mission |
| src/services/magicRomanceEventService.ts:323 | text | 20Gを得る | 20Gをえる | Gain 20G |
| src/services/magicRomanceEventService.ts:324 | label | 勉強の続きをする | べんきょうのつづきをする | Continue Studying |
| src/services/magicRomanceEventService.ts:324 | text | カードを1枚強化 | カードを1まいきょうか | Upgraded 1 cards. |
| src/services/magicRomanceEventService.ts:328 | title | あかり・約束の続き | あかり・やくそくのつづき | Akari: Continuing the Promise |
| src/services/magicRomanceEventService.ts:329 | description | サンプル&lt;br&gt;&lt;br&gt;五つの大切な時間を重ねた二人には、もう言葉に迷う距離はなかった。 | さんぷる&lt;br&gt;&lt;br&gt;いつつのたいせつなじかんをかさねたふたりには、もうことばにまようきょりはなかった。 | Sample&lt;br&gt;&lt;br&gt;After sharing five important moments, the two no longer stood at a distance where words could falter. |
| src/services/magicRomanceEventService.ts:334 | text | 5段階完了 / サンプル | 5だんかいかんりょう / さんぷる | 5 / |
| src/services/magicRomanceEventService.ts:347 | resultLog | あかりとの五つの物語を越え、穏やかな時間を過ごした。&lt;br&gt;好感度は変化しない。&lt;br&gt;50 | あかりとのいつつのものがたりをこえ、おだやかなじかんをすごした。&lt;br&gt;こうかんどはへんかしない。&lt;br&gt;50 | After passing through five stories with Akari, you spent a peaceful time together.&lt;br&gt;Affection does not change.&lt;br&gt;You handled the moment and carried its outcome into what came next. |
| src/services/magicRomanceEventService.ts:360 | label | 本音を聞く | ほんねをきく | Ask for Their True Feelings |
| src/services/magicRomanceEventService.ts:360 | text | 絆+18 / 最大HP+4 | きずな+18 / さいだいHP+4 | Bond +18 / Max HP +4 |
| src/services/magicRomanceEventService.ts:361 | label | 連携を練習する | れんけいをれんしゅうする | Practice Coordination |
| src/services/magicRomanceEventService.ts:361 | text | 絆+15 / カードを1枚強化 | きずな+15 / カードを1まいきょうか | Bond +15 / Upgrade 1 card |
| src/services/magicRomanceEventService.ts:362 | label | 一緒に休む | いっしょにやすむ | Rest Together |
| src/services/magicRomanceEventService.ts:362 | text | 絆+12 / HPを14回復 | きずな+12 / HPを14かいふく | Bond +12 / Heal 14 HP |
| src/services/magicRomanceEventService.ts:367 | description | サンプル&lt;br&gt;&lt;br&gt;あかりとの絆が、恋とは違う強さで胸に灯る。 | さんぷる&lt;br&gt;&lt;br&gt;あかりとのきずなが、こいとはちがうつよさでむねにともる。 | Sample&lt;br&gt;&lt;br&gt;Your bond with Akari glows in your heart with a strength different from romance. |
| src/services/magicRomanceEventService.ts:405 | resultLog | あかり 絆+50&lt;br&gt;サンプル&lt;br&gt;50 | あかり きずな+50&lt;br&gt;さんぷる&lt;br&gt;50 | Akari Bond +50&lt;br&gt;Sample&lt;br&gt;50 |
| src/services/magicRomanceEventService.ts:418 | label | 親友の証を結ぶ | しんゆうのしょうをむすぶ | Seal the Proof of Best Friends |
| src/services/magicRomanceEventService.ts:418 | text | 最大HP+6 | さいだいHP+6 | Max HP +6 |
| src/services/magicRomanceEventService.ts:419 | label | 相棒技を磨く | あいぼうわざをみがく | Practice Partner Techniques |
| src/services/magicRomanceEventService.ts:419 | text | カードを1枚強化 | カードを1まいきょうか | Upgraded 1 cards. |
| src/services/magicRomanceEventService.ts:420 | label | 次の任務を約束する | つぎのにんむをやくそくする | Promise the Next Mission |
| src/services/magicRomanceEventService.ts:420 | text | 30Gを得る | 30Gをえる | Gain 30G |
| src/services/magicRomanceEventService.ts:425 | description | サンプル&lt;br&gt;&lt;br&gt;これは恋愛ではなく、何周しても選び直したくなる友情の終着点だ。 | さんぷる&lt;br&gt;&lt;br&gt;これはれんあいではなく、なんしゅうしてもえらびなおしたくなるゆうじょうのしゅうちゃくてんだ。 | Sample&lt;br&gt;&lt;br&gt;This is not romance, but the destination of a friendship you would choose again no matter how many loops you lived. |
| src/services/magicRomanceEventService.ts:429 | text | 友情ルート完了 / サンプル | ゆうじょうるーとかんりょう / さんぷる | Friendship route complete / Sample |
| src/services/magicRomanceEventService.ts:442 | resultLog | あかりとの友情ルートを確認した。&lt;br&gt;50 | あかりとのゆうじょうるーとをかくにんした。&lt;br&gt;50 | You confirmed Akari's friendship route.&lt;br&gt;You handled the moment and carried its outcome into what came next. |
| src/services/magicRomanceEventService.ts:460 | label | 一緒に復習する | いっしょにふくしゅうする | Review Together |
| src/services/magicRomanceEventService.ts:460 | text | カードを1枚強化 | カードを1まいきょうか | Upgraded 1 cards. |
| src/services/magicRomanceEventService.ts:461 | label | 魔力を整える | まりょくをととのえる | Steady Your Magic Power |
| src/services/magicRomanceEventService.ts:461 | text | HPを10回復 | HPを10かいふく | Heal 10 HP |
| src/services/magicRomanceEventService.ts:462 | label | 購買へ寄る | こうばいへよる | Stop by the School Store |
| src/services/magicRomanceEventService.ts:462 | text | 18Gを得る | 18Gをえる | Gain 18G |
| src/services/magicRomanceEventService.ts:466 | title | あかり・次の季節を待ちながら | あかり・つぎのきせつをまちながら | Akari: Waiting for the Next Season |
| src/services/magicRomanceEventService.ts:467 | description | サンプル&lt;br&gt;&lt;br&gt;二人の関係は確かに進んでいる。けれど、次の出来事が動き出すのは第50章からだ。今日は焦らず、いつもの学園生活を一緒に過ごすことにした。 | さんぷる&lt;br&gt;&lt;br&gt;ふたりのかんけいはたしかにすすんでいる。けれど、つぎのできごとがうごきだすのはだい50しょうからだ。きょうはあせらず、いつものがくえんせいかつをいっしょにすごすことにした。 | Sample&lt;br&gt;&lt;br&gt;The relationship between the two has certainly moved forward. But the next event begins from Chapter 50, so today you decide not to rush and spend an ordinary academy day together. |
| src/services/magicRomanceEventService.ts:472 | text | 段階維持 / サンプル | だんかいいじ / さんぷる | Stage held / Sample |
| src/services/magicRomanceEventService.ts:485 | resultLog | あかりと穏やかな放課後を過ごした。&lt;br&gt;次の恋愛イベントは第50章で解放される。&lt;br&gt;50 | あかりとおだやかなほうかごをすごした。&lt;br&gt;つぎのれんあいいべんとはだい50しょうでかいほうされる。&lt;br&gt;50 | You handled the moment and carried its outcome into what came next.&lt;br&gt;You handled the moment and carried its outcome into what came next.&lt;br&gt;You handled the moment and carried its outcome into what came next. |
| src/services/magicRomanceEventService.ts:510 | title | 放課後、誰と過ごす？ | ほうかご、だれとすごす？ | After School, Who Will You Spend Time With? |
| src/services/magicRomanceEventService.ts:511 | description | 授業と魔法訓練の合間に、少しだけ自由な時間ができた。&lt;br&gt;恋の相手、あるいは親友として絆を深める相手を選ぼう。以前選んだ相手は、次から候補に現れやすくなる。 | じゅぎょうとまほうくんれんのあいまに、すこしだけじゆうなじかんができた。&lt;br&gt;こいのあいて、あるいはしんゆうとしてきずなをふかめるあいてをえらぼう。いぜんえらんだあいては、つぎからこうほにあらわれやすくなる。 | Between classes and magic training, you found a little free time.&lt;br&gt;Choose someone to grow closer to as a romantic interest or a best friend. Someone you chose before will be more likely to appear as a candidate next time. |
| src/services/magicRomanceEventService.ts:515 | label | あかり（サンプル） | あかり（サンプル） | Akari (Sample) |
| src/services/magicRomanceEventService.ts:570 | label | あかり（友情） | あかり（ゆうじょう） | Akari (Friendship) |
| src/services/magicRomanceEventService.ts:571 | text | 絆 50/100 / 友情エンド解放済み | きずな 50/100 / ゆうじょうえんどかいほうすみ | Bond 50/100 / Friendship ending unlocked |

### エンディングイベント（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/services/magicEndingService.ts:159 | title | あかりとあかり、譲れない告白 | あかりとあかり、ゆずれないこくはく | The exchange with others changed the mood and opened a way forward. |
| src/services/magicEndingService.ts:160 | description | 決戦後、あかりを呼び止めた二人は、互いの想いが同じ強さだと知る。好意を曖昧にしないため、二人は正面から答えを求めた。 | けっせんのち、あかりをよびとめたふたりは、たがいのおもいがおなじつよさだとしる。こういをあいまいにしないため、ふたりはしょうめんからこたえをもとめた。 | The experience strengthened your resolve and helped you grow. |

### 親友イベント（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/friendshipEvents.ts:6 | title | あかりとの親友の誓い | あかりとのしんゆうのちかい | The exchange with others changed the mood and opened a way forward. |
| src/data/friendshipEvents.ts:8 | summary | あかりと互いの進路と使命を支え合う約束をする。 | あかりとたがいのしんろとしめいをささえあうやくそくをする。 | You handled the moment and carried its outcome into what came next. |

### シナリオイベント（20行）

#### サンプル 50（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicScenarioEvents.ts:54 | title | サンプル 50 | サンプル 50 | You handled the moment and carried its outcome into what came next. |
| src/data/magicScenarioEvents.ts:57 | label | 落ち着いて考える | おちついてかんがえる | Think Calmly |
| src/data/magicScenarioEvents.ts:57 | result | 学んだ内容を整理し、確実な一歩を選んだ。 | まなんだないようをせいりし、かくじつないっぽをえらんだ。 | You organized what you learned and chose a steady next step. |
| src/data/magicScenarioEvents.ts:58 | label | 仲間に相談する | なかまにそうだんする | Consult Your Friends |
| src/data/magicScenarioEvents.ts:58 | result | 一人で抱えず、チームで答えを見つけた。 | ひとりでかかえず、ちーむでこたえをみつけた。 | Instead of carrying it alone, the team found the answer together. |

#### あかり・光の魔法（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicScenarioEvents.ts:75 | title | あかり・光の魔法 | あかり・ひかりのまほう | You handled the moment and carried its outcome into what came next. |
| src/data/magicScenarioEvents.ts:79 | label | 最後まで話を聞く | さいごまではなしをきく | Listen to the End |
| src/data/magicScenarioEvents.ts:79 | result | あかりは安心したように笑った。 | あかりはあんしんしたようにわらった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicScenarioEvents.ts:80 | label | 自分の経験を話す | じぶんのけいけんをはなす | Share Your Own Experience |
| src/data/magicScenarioEvents.ts:80 | result | 互いの弱さを知り、距離が縮まった。 | たがいのよわさをしり、きょりがちぢまった。 | You learned each other's weak points, and the distance between you narrowed. |

#### あかり・光の魔法（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicScenarioEvents.ts:100 | title | あかり・光の魔法 | あかり・ひかりのまほう | You handled the moment and carried its outcome into what came next. |
| src/data/magicScenarioEvents.ts:104 | label | 素直な気持ちを伝える | すなおなきもちをつたえる | Express Your Honest Feelings |
| src/data/magicScenarioEvents.ts:104 | result | あかりはまっすぐに言葉を受け止めた。 | あかりはまっすぐにことばをうけとめた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicScenarioEvents.ts:105 | label | まず使命を優先する | まずしめいをゆうせんする | Put the Mission First |
| src/data/magicScenarioEvents.ts:105 | result | 今できることを確認し、信頼を深めた。 | いまできることをかくにんし、しんらいをふかめた。 | You handled the moment and carried its outcome into what came next. |

#### サンプル 50（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicScenarioEvents.ts:127 | title | サンプル 50 | サンプル 50 | You handled the moment and carried its outcome into what came next. |
| src/data/magicScenarioEvents.ts:130 | label | みんなとの時間を大切にする | みんなとのじかんをたいせつにする | Treasure Time with Everyone |
| src/data/magicScenarioEvents.ts:130 | result | 何気ない時間が大切な思い出になった。 | なにげないじかんがたいせつなおもいでになった。 | An ordinary moment became an important memory. |
| src/data/magicScenarioEvents.ts:131 | label | 将来について話す | しょうらいについてはなす | Talk About the Future |
| src/data/magicScenarioEvents.ts:131 | result | 自分の望む未来が少しだけ明確になった。 | じぶんののぞむみらいがすこしだけめいかくになった。 | The future you want became a little clearer. |

### 恋愛イベント定義（54行）

#### 補助 / 結果文（12行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:67 | label | 出会い | であい | Meeting |
| src/data/romanceEvents.ts:72 | summary | 初対面、または恋愛ルートの入口。相手の役割と第一印象を示す。 | しょたいめん、またはれんあいるーとのいりぐち。あいてのやくわりとだいいちいんしょうをしめす。 | The exchange with others changed the mood and opened a way forward. |
| src/data/romanceEvents.ts:77 | label | 信頼 | しんらい | Trust |
| src/data/romanceEvents.ts:83 | summary | 学習、学園生活、魔法訓練で小さく協力し、信頼を得る。 | がくしゅう、がくえんせいかつ、まほうくんれんでちいさくきょうりょくし、しんらいをえる。 | learning, the academy,, trust. |
| src/data/romanceEvents.ts:88 | label | 接近 | せっきん | Growing Closer |
| src/data/romanceEvents.ts:94 | summary | 放課後、休日、秘密共有で距離が縮まる。 | ほうかご、きゅうじつ、ひみつきょうゆうできょりがちぢまる。 | You took a moment to recover and regain your rhythm. |
| src/data/romanceEvents.ts:99 | label | 危機 | きき | Crisis |
| src/data/romanceEvents.ts:105 | summary | 魔法少女としての危機を二人で越え、関係が特別になる。 | まほうしょうじょとしてのききをふたりでこえ、かんけいがとくべつになる。 | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:110 | label | 告白/約束 | こくはく/やくそく | Confession / Promise |
| src/data/romanceEvents.ts:116 | summary | 恋心、使命、進路の約束を確認する。 | こいごころ、しめい、しんろのやくそくをかくにんする。 | Facing the feeling directly helped your mind settle. |
| src/data/romanceEvents.ts:121 | label | 個別エンド | こべつえんど | Personal Ending |
| src/data/romanceEvents.ts:127 | summary | 4章ボス撃破後に表示する個別恋愛エンド。真恋愛エンド候補を兼ねる。 | 4しょうぼすげきはのちにひょうじするこべつれんあいえんど。しんれんあいえんどこうほをかねる。 | An individual romance ending shown after defeating the Chapter 4 boss. It also serves as a true romance ending candidate. |

#### 星図教室の放課後（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:132 | title | 星図教室の放課後 | せいずきょうしつのほうかご | the classroom after school |
| src/data/romanceEvents.ts:132 | description | 星図の黒板前で進路と使命を話す。 | せいずのこくばんまえでしんろとしめいをはなす。 | The exchange with others changed the mood and opened a way forward. |

#### 月光の中庭（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:133 | title | 月光の中庭 | げっこうのなかにわ | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:133 | description | 月光の噴水前で冷静な判断を求められる。 | げっこうのふんすいまえでれいせいなはんだんをもとめられる。 | You handled the moment and carried its outcome into what came next. |

#### 花の迷宮演習（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:134 | title | 花の迷宮演習 | はなのめいきゅうえんしゅう | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:134 | description | 花の訓練迷宮で治癒と選択を学ぶ。 | はなのくんれんめいきゅうでちゆとせんたくをまなぶ。 | You took a moment to recover and regain your rhythm. |

#### 炎の魔法実技（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:135 | title | 炎の魔法実技 | ほのおのまほうじつぎ | You refined what you learned and turned it into a practical advantage. |
| src/data/romanceEvents.ts:135 | description | 結界内で炎の実技と本音がぶつかる。 | けっかいないでほのおのじつぎとほんねがぶつかる。 | You refined what you learned and turned it into a practical advantage. |

#### 深淵図書館の栞（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:136 | title | 深淵図書館の栞 | しんえんとしょかんのしおり | Bookmark of the Abyss Library |
| src/data/romanceEvents.ts:136 | description | 禁書棚の奥で敵幹部の葛藤に触れる。 | きんしょたなのおくでてきかんぶのかっとうにふれる。 | You handled the moment and carried its outcome into what came next. |

#### 時計塔の補習（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:137 | title | 時計塔の補習 | とけいとうのほしゅう | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:137 | description | 止まった時計塔で失敗のやり直しを考える。 | とまったとけいとうでしっぱいのやりなおしをかんがえる。 | The risky choice backfired and left you with a setback. |

#### 風渡りの屋上（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:138 | title | 風渡りの屋上 | かぜわたりのおくじょう | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:138 | description | 屋上の風の中で言えない言葉を交わす。 | おくじょうのかぜのなかでいえないことばをまじわす。 | You handled the moment and carried its outcome into what came next. |

#### 夢見の保健室（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:139 | title | 夢見の保健室 | ゆめみのほけんしつ | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:139 | description | 悪夢の気配を舞台魔法でほどく。 | あくむのけはいをぶたいまほうでほどく。 | You handled the moment and carried its outcome into what came next. |

#### 光の礼拝堂（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:140 | title | 光の礼拝堂 | ひかりのれいはいどう | Your careful choice helped someone and improved the situation. |
| src/data/romanceEvents.ts:140 | description | ステンドグラス下で二つの世界の使命を選ぶ。 | すてんどぐらすしたでふたつのせかいのしめいをえらぶ。 | You handled the moment and carried its outcome into what came next. |

#### 魔法陣の廊下（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:141 | title | 魔法陣の廊下 | まほうじんのろうか | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:141 | description | 廊下の魔法陣が次の出会いを示す。 | ろうかのまほうじんがつぎのであいをしめす。 | You handled the moment and carried its outcome into what came next. |

#### SNSに届いた予兆（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:142 | title | SNSに届いた予兆 | SNSにとどいたよちょう | You noticed the opening and turned it into an advantage. |
| src/data/romanceEvents.ts:142 | description | 端末の予兆メッセージと幻術のノイズ。 | たんまつのよちょうめっせーじとげんじゅつののいず。 | You cleared away something unnecessary and made room to move forward. |

#### 購買部の魔法雑貨（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:143 | title | 購買部の魔法雑貨 | こうばいぶのまほうざっか | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:143 | description | 魔法雑貨の中から今日だけの助けを選ぶ。 | まほうざっかのなかからきょうだけのたすけをえらぶ。 | Your careful choice helped someone and improved the situation. |

#### 寮の作戦会議（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:144 | title | 寮の作戦会議 | りょうのさくせんかいぎ | Dorm Strategy Meeting |
| src/data/romanceEvents.ts:144 | description | 夜の寮で作戦と友情を固める。 | よるのりょうでさくせんとゆうじょうをかためる。 | Turning the situation into a plan made the next step easier to take. |

#### 水族館の約束（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:145 | title | 水族館の約束 | すいぞくかんのやくそく | Aquarium Promise |
| src/data/romanceEvents.ts:145 | description | 水槽前で戦いから離れた本音を交わす。 | すいそうまえでたたかいからはなれたほんねをまじわす。 | You handled the moment and carried its outcome into what came next. |

#### 夏祭りの結界（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:146 | title | 夏祭りの結界 | なつまつりのけっかい | Summer Festival Barrier |
| src/data/romanceEvents.ts:146 | description | 屋台の光の中、結界のほころびを塞ぐ。 | やたいのひかりのなか、けっかいのほころびをふさぐ。 | You handled the moment and carried its outcome into what came next. |

#### 文化祭の秘密舞台（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:147 | title | 文化祭の秘密舞台 | ぶんかさいのひみつぶたい | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:147 | description | 舞台袖で魔法と恋心が同時に揺れる。 | ぶたいそででまほうとこいごころがどうじにゆれる。 | Facing the feeling directly helped your mind settle. |

#### クリスマス街の魔光（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:148 | title | クリスマス街の魔光 | くりすますまちのまひかり | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:148 | description | 街のイルミネーションに異世界信号が混じる。 | まちのいるみねーしょんにいせかいしんごうがまじる。 | You handled the moment and carried its outcome into what came next. |

#### バレンタインの魔法包み（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:149 | title | バレンタインの魔法包み | ばれんたいんのまほうつつみ | You handled the moment and carried its outcome into what came next. |
| src/data/romanceEvents.ts:149 | description | 小さな包みに気持ちと魔力を込める。 | ちいさなつつみにきもちとまりょくをこめる。 | Facing the feeling directly helped your mind settle. |

#### 卒業式前夜の星空（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:150 | title | 卒業式前夜の星空 | そつぎょうしきぜんやのほしぞら | Graduation Ceremony |
| src/data/romanceEvents.ts:150 | description | 最後の夜に九人の願いが一つになる。 | さいごのよるにきゅうにんのねがいがひとつになる。 | You handled the moment and carried its outcome into what came next. |

#### 真夜中の変身訓練（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:151 | title | 真夜中の変身訓練 | まよなかのへんしんくんれん | JH Transform |
| src/data/romanceEvents.ts:151 | description | 誰もいない訓練場で変身後の自分と向き合う。 | だれもいないくんれんばでへんしんごのじぶんとむきあう。 | Nothing changed much, but you avoided making things worse. |

#### あかり×あかり・50（2行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/romanceEvents.ts:484 | title | あかり×あかり・50 | あかり×あかり・50 | Akari×Akari: 50 |
| src/data/romanceEvents.ts:493 | summary | 50 サンプルのあかりとの関係を、あかりの物語として分岐させる。 | 50 さんぷるのあかりとのかんけいを、あかりのものがたりとしてぶんきさせる。 | Branches the 50-sample relationship with Akari into Akari's story route. |

### 会話 / 選択肢（543行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicRomanceDialogue.ts:90 | label | まっすぐ気持ちを伝える | まっすぐきもちをつたえる | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:91 | label | 相手の不安を受け止める | あいてのふあんをうけやめる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:92 | label | 一緒に行動する提案をする | いっしょにこうどうするていあんをする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:95 | label | 得意分野を教えてもらう | とくいぶんやをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:96 | label | 自分の弱点も打ち明ける | じぶんのじゃくてんもうちあける | You Weak |
| src/data/magicRomanceDialogue.ts:97 | label | 休憩用の魔法菓子を分ける | きゅうけいようのまほうかしをわける | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:100 | label | 今日は二人で寄り道する | きょうはふたりでよりみちする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:101 | label | 相手の夢を最後まで聞く | あいてのゆめをさいごまできく | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:102 | label | 記念になる魔法写真を撮る | きねんになるまほうしゃしんをとる | Take Photo |
| src/data/magicRomanceDialogue.ts:105 | label | 背中を預けて共闘する | せなかをあずけてきょうとうする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:106 | label | 危険でも手を離さない | きけんでもてをはなさない | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:107 | label | いったん退いて作戦を練る | いったんしりぞいてさくせんをねる | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:110 | label | 卒業後も隣にいたいと告げる | そつぎょうごもとなりにいたいとつげる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:111 | label | 使命と恋を両方選ぶ | しめいとこいをりょうほうえらぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:112 | label | 二人だけの約束を交わす | ふたりだけのやくそくをまじわす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:118 | label | 自分から手伝うと申し出る | じぶんからてつだうともうしでる | You Leave |
| src/data/magicRomanceDialogue.ts:119 | label | 彼女の不安を受け止める | かのじょのふあんをうけやめる | The mishap left a mark and cost you momentum. |
| src/data/magicRomanceDialogue.ts:120 | label | 二人で動こうと誘う | ふたりでうごこうとさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:123 | label | 彼女の得意分野を頼る | かのじょのとくいぶんやをたよる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:124 | label | 自分の弱点を先に打ち明ける | じぶんのじゃくてんをさきにうちあける | You Weak |
| src/data/magicRomanceDialogue.ts:125 | label | 休憩へ連れ出す | きゅうけいへつれだす | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:128 | label | 二人きりの寄り道へ誘う | ふたりきりのよりみちへさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:129 | label | 彼女の夢を聞き出す | かのじょのゆめをききだす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:130 | label | 思い出を形に残そうと提案する | おもいでをかたちにのこそうとていあんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:133 | label | 自分が前に出て共闘する | じぶんがまえにでてきょうとうする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:134 | label | 必ず連れて帰ると告げる | かならずつれてかえるとつげる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:135 | label | 彼女を守る作戦を組み直す | かのじょをまもるさくせんをくみなおす | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:138 | label | 卒業後も隣にいてほしいと告げる | そつぎょうごもとなりにいてほしいとつげる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:139 | label | 使命も彼女も諦めないと誓う | しめいもかのじょもあきらめないとちかう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:140 | label | 自分から二人の約束を結ぶ | じぶんからふたりのやくそくをむすぶ | You players |
| src/data/magicRomanceDialogue.ts:235 | label | 素直にお礼を言う | すなおにおれいをいう | Your careful choice helped someone and improved the situation. |
| src/data/magicRomanceDialogue.ts:235 | response | 感謝の言葉をまっすぐ伝えた。蓮は少し照れながらも、いつものように隣へ並んだ。 | かんしゃのことばをまっすぐつたえた。れんはすこしてれながらも、いつものようにとなりへならんだ。 | Your careful choice helped someone and improved the situation. |
| src/data/magicRomanceDialogue.ts:236 | label | また助けてほしいと頼む | またたすけてほしいとたのむ | Your careful choice helped someone and improved the situation. |
| src/data/magicRomanceDialogue.ts:236 | response | 頼られた蓮は目をそらしたが、口元だけは嬉しそうだった。次からも先に気づける場所にいると約束してくれた。 | たよられたれんはめをそらしたが、くちもとだけはうれしそうだった。つぎからもさきにきづけるばしょにいるとやくそくしてくれた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:237 | label | 一緒に魔法陣を調べる | いっしょにまほうじんをしらべる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:237 | response | 二人で魔法陣をのぞき込むと、蓮の防護風が自然に二人の足元を守った。近い距離に、少しだけ沈黙が落ちた。 | ふたりでまほうじんをのぞきこむと、れんのぼうごかぜがしぜんにふたりのあしもとをまもった。ちかいきょりに、すこしだけちんもくがおちた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:281 | label | 得意なところを教えてもらう | とくいなところをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:281 | response | 蓮は丁寧にノートへ印をつけた。昔から見ていたから分かると言われ、胸が少しだけくすぐったくなった。 | れんはていねいにのーとへいんをつけた。むかしからみていたからわかるといわれ、むねがすこしだけくすぐったくなった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:282 | label | 自分の苦手も打ち明ける | じぶんのにがてもうちあける | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:282 | response | 弱音をこぼすと、蓮は笑わずに聞いた。できないところから一緒に始めようと言う声は、思っていたより優しかった。 | よわねをこぼすと、れんはわらわずにきいた。できないところからいっしょにはじめようというこえは、おもっていたよりやさしかった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:283 | label | 休憩に誘う | きゅうけいにさそう | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:283 | response | 休憩しようと誘うと、蓮は少し驚いてから頷いた。二人で分けた購買のパンは、いつもよりあたたかく感じた。 | きゅうけいしようとさそうと、れんはすこしおどろいてからうなずいた。ふたりでわけたこうばいのぱんは、いつもよりあたたかくかんじた。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:327 | label | 今なら聞けると伝える | いまならきけるとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:327 | response | 二人が立ち止まると、蓮も逃げずに向き合った。言葉は短かったが、ずっと大切にしてきた気持ちがそこにあった。 | ふたりがたちとまると、れんもにげずにむきあった。ことばはみじかったが、ずっとたいせつにしてきたきもちがそこにあった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:328 | label | 無理に聞かず隣を歩く | むりにきかずとなりをあるく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:328 | response | 急かさず歩き出すと、蓮はほっとしたように息を吐いた。言えない時間ごと受け止められたことが、二人の距離を近づけた。 | せかさずあるきだすと、れんはほっとしたようにいきをはいた。いえないじかんごとうけとめられたことが、ふたりのきょりをちかづけた。 | Using the time well gave you room to think and move forward. |
| src/data/magicRomanceDialogue.ts:329 | label | 思い出の場所へ誘う | おもいでのばしょへさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:329 | response | 昔よく寄った階段へ向かうと、蓮は懐かしそうに笑った。変わらない場所で、変わり始めた関係を確かめた。 | むかしよくよったかいだんへむかうと、れんはなつかしそうにわらった。かわらないばしょで、かわりはじめたかんけいをたしかめた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:373 | label | 背中を預けて進む | せなかをあずけてすすむ | JH Next |
| src/data/magicRomanceDialogue.ts:373 | response | 二人が前へ踏み出すと、蓮の風がその背を押した。守られるだけではなく、並んで帰るための戦いになった。 | ふたりがまえへふみだすと、れんのかぜがそのせをおした。まもられるだけではなく、ならんでかえるためのたたかいになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:374 | label | 必ず一緒に帰ると約束する | かならずいっしょにかえるとやくそくする | Go Home Together |
| src/data/magicRomanceDialogue.ts:374 | response | 約束の言葉に、蓮の表情が引き締まった。幼なじみだからではなく、大切だから守りたいのだと彼は告げた。 | やくそくのことばに、れんのひょうじょうがひきしまった。おさななじみだからではなく、たいせつだからまもりたいのだとかれはつげた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:375 | label | 退路を一緒に作る | たいろをいっしょにつくる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:375 | response | 二人で結界の流れを読み、風の道を開いた。蓮は相手の判断を信じ、最後まで手を離さなかった。 | ふたりでけっかいのながれをよみ、かぜのみちをひらいた。れんはあいてのはんだんをしんじ、さいごまでてをはなさなかった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:419 | label | 卒業後も隣にいたいと伝える | そつぎょうごもとなりにいたいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:419 | response | 二人が気持ちを言葉にすると、蓮は迷わず頷いた。明日の朝も、その先も迎えに行くと約束してくれた。 | ふたりがきもちをことばにすると、れんはまよわずうなずいた。あしたのあさも、そのさきもむかえにいくとやくそくしてくれた。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:420 | label | 使命も日常も大切にすると誓う | しめいもにちじょうもたいせつにするとちかう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:420 | response | 二人は戦いだけで終わらない未来を選んだ。蓮の手は少し震えていたが、離れることはなかった。 | ふたりはたたかいだけでおわらないみらいをえらんだ。れんのてすこしふるえていたが、はなれることはなかった。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:421 | label | 二人だけの約束を交わす | ふたりだけのやくそくをまじわす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:421 | response | いつもの道で交わした約束は、特別な告白になった。蓮は照れたように笑い、明日もここで待つと言った。 | いつものみちでまじわしたやくそくは、とくべつなこくはくになった。れんはてれたようにわらい、あしたもここでまつといった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:467 | label | まっすぐ手伝うと伝える | まっすぐてつだうとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:467 | response | 二人が机の横に立つと、颯真は新しい資料を差し出した。堅い言葉の奥に、確かな信頼が見えた。 | ふたりがつくえのよこにたつと、そうまはあたらしいしりょうをさしだした。かたいことばのおくに、たしかなしんらいがみえた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:468 | label | 無理していないか尋ねる | むりしていないかたずねる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:468 | response | 颯真は一瞬だけ答えに詰まった。完璧に見せようとする彼が、疲れを認めたこと自体が小さな変化だった。 | そうまはいっしゅんだけこたえにつまった。かんぺきにみせようとするかれが、つかれをみとめたことじたいがちいさなへんかだった。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:469 | label | 一緒に段取りを決める | いっしょにだんどりをきめる | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:469 | response | 二人で予定を組み直すと、颯真は感心したように頷いた。計画の中に二人の名前が自然に加わった。 | ふたりでよていをくみなおすと、そうまはかんしんしたようにうなずいた。けいかくのなかにふたりのなまえがしぜんにくわわった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:513 | label | 得意分野を教えてもらう | とくいぶんやをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:513 | response | 颯真は丁寧に式を分解した。説明の途中で何度も二人の理解を確かめる声は、思ったよりやわらかかった。 | そうまはていねいにしきをぶんかいした。せつめいのとちゅうでなんどもふたりのりかいをたしかめるこえは、おもったよりやわらかかった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:514 | label | 自分の弱点を認める | じぶんのじゃくてんをみとめる | You Weak |
| src/data/magicRomanceDialogue.ts:514 | response | 苦手だと打ち明けると、颯真は責めずにノートを引き寄せた。弱点を把握できたなら対策は可能だと、真剣に向き合ってくれた。 | にがてだとうちあけると、そうまはせめずにのーとをひきよせた。じゃくてんをはあくできたならたいさくはかのうだと、しんけんにむきあってくれた。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:515 | label | 休憩の時間も予定に入れる | きゅうけいのじかんもよていにいれる | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:515 | response | 休憩を提案すると、颯真は少し眉を上げた。だが予定表に休憩を書き足し、君の判断は合理的だと認めた。 | きゅうけいをていあんすると、そうまはすこしまゆをあげた。だがよていひょうにきゅうけいをかきたし、きみのはんだんはごうりてきだとみとめた。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:559 | label | そのまま話を聞く | そのままはなしをきく | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:559 | response | 二人が黙って待つと、颯真は少しずつ本音を話した。弱さを見せても崩れない関係が、二人の間に残った。 | ふたりがだまってまつと、そうまはすこしずつほんねをはなした。よわさをみせてもくずれないかんけいが、ふたりのまにのこった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:560 | label | 自分の失敗も話す | じぶんのしっぱいもはなす | Putting things into words helped clarify your thoughts and steady your mood. |
| src/data/magicRomanceDialogue.ts:560 | response | 二人の失敗談に、颯真は小さく笑った。完璧でない時間を共有したことで、緊張がほどけていった。 | ふたりのしっぱいだんに、そうまはちいさくわらった。かんぺきでないじかんをきょうゆうしたことで、きんちょうがほどけていった。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:561 | label | 次は一緒に迷おうと言う | つぎはいっしょにめいおうという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:561 | response | 迷うことを許す言葉に、颯真は静かに目を伏せた。結論を急がない時間が、彼にとって救いになった。 | まようことをゆるすことばに、そうまはしずかにめをふせた。けつろんをいそがないじかんが、かれにとってすくいになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:605 | label | 対等な相手として並ぶ | たいとうなあいてとしてならぶ | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:605 | response | 二人が隣に立つと、颯真は初めて指示ではなく相談をした。二人で組んだ術式が暴走を押し戻した。 | ふたりがとなりにたつと、そうまははじめてしじではなくそうだんをした。ふたりでくんだじゅつしきがぼうそうをおしもどした。 | You moved through the situation cleanly and kept the momentum going. |
| src/data/magicRomanceDialogue.ts:606 | label | 必ず帰ると確認する | かならずかえるとかくにんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:606 | response | 帰る約束を口にすると、颯真は規則より先にその言葉を守ると答えた。冷たい結界の中で、手の温度だけが確かだった。 | かえるやくそくをくちにすると、そうまはきそくよりさきにそのことばをまもるとこたえた。つめたいけっかいのなかで、てのおんどだけがたしかだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:607 | label | 作戦を組み直す | さくせんをくみなおす | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:607 | response | 二人の提案で計画を変更すると、颯真は迷わず従った。完璧な予定より、今の二人に合う答えを選んだ。 | ふたりのていあんでけいかくをへんこうすると、そうまはまよわずしたがった。かんぺきなよていより、いまのふたりにあうこたえをえらんだ。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:651 | label | 卒業後も会いたいと伝える | そつぎょうごもあいたいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:651 | response | 二人の言葉に、颯真は予定表へ新しい約束を書き込んだ。形式ばった文字なのに、そこには確かな想いがあった。 | ふたりのことばに、そうまはよていひょうへあたらしいやくそくをかきこんだ。けいしきばったもじなのに、そこにはたしかなおもいがあった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:652 | label | 使命と気持ちを両方選ぶ | しめいときもちをりょうほうえらぶ | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:652 | response | 颯真は責任から逃げず、同時に二人の手も取った。どちらかを切り捨てる未来は選ばないと誓った。 | そうまはせきにんからにげず、どうじにふたりのてもとった。どちらかをきりすてるみらいはえらばないとちかった。 | You cleared away something unnecessary and made room to move forward. |
| src/data/magicRomanceDialogue.ts:653 | label | 二人の予定を決める | ふたりのよていをきめる | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:653 | response | 最初の予定は昼食だった。颯真は真面目な顔で場所まで指定し、二人はその不器用な誘いに笑った。 | さいしょのよていはちゅうしょくだった。そうまはまじめなかおでばしょまでしていし、ふたりはそのぶきようなさそいにわらった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:699 | label | 一緒に運ぼうと誘う | いっしょにはこぼうとさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:699 | response | 二人で教材を分け合うと、湊は嬉しそうに背筋を伸ばした。頼られるだけでなく、並べたことが自信になった。 | ふたりできょうざいをわけあうと、みなとはうれしそうにせすじをのばした。たよられるだけでなく、ならべたことがじしんになった。 | The physical effort sharpened your rhythm and confidence. |
| src/data/magicRomanceDialogue.ts:700 | label | 頑張りを認める | がんばりをみとめる | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:700 | response | 二人が努力を褒めると、湊は耳まで赤くした。見ていてくれたことが、何よりの励みになった。 | ふたりがどりょくをほめると、みなとはみみまであかくした。みていてくれたことが、なによりのはげみになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:701 | label | 次は頼ると約束する | つぎはたよるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:701 | response | 次は頼ると言うと、湊はぱっと顔を上げた。小さな約束が、彼の背中を少し大きく見せた。 | つぎはたよるというと、みなとはぱっとかおをあげた。ちいさなやくそくが、かのせなかをすこしおおきくみせた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:745 | label | 治癒魔法を教えてもらう | ちゆまほうをおしえてもらう | You took a moment to recover and regain your rhythm. |
| src/data/magicRomanceDialogue.ts:745 | response | 湊は緊張しながらも、ひとつずつ手順を説明した。二人が頷くたびに、声が少しずつ明るくなった。 | みなとはきんちょうしながらも、ひとつずつてじゅんをせつめいした。ふたりがうなずくたびに、こえがすこしずつあかるくなった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:746 | label | 苦手な実習を相談する | にがてなじっしゅうをそうだんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:746 | response | 二人が苦手を打ち明けると、湊は自分も失敗した話をしてくれた。一緒に間違えたことで、教室の空気がやわらいだ。 | ふたりがにがてをうちあけると、みなとはじぶんもしっぱいしたはなしをしてくれた。いっしょにまちがえたことで、きょうしつのくうきがやわらいだ。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/data/magicRomanceDialogue.ts:747 | label | 休憩に誘う | きゅうけいにさそう | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:747 | response | 休憩を提案すると、湊はほっとしたように笑った。頑張るだけでは続かないと、二人で温かいお茶を分けた。 | きゅうけいをていあんすると、みなとはほっとしたようにわらった。がんばるだけではつづかないと、ふたりであたたかいおちゃをわけた。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:791 | label | 隣にいるよと伝える | となりにいるよとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:791 | response | 二人が隣に立ち直すと、湊は小さく息をのんだ。憧れだけではない気持ちが、静かに伝わってきた。 | ふたりがとなりにたちなおすと、みなとはちいさくいきをのんだ。あこがれだけではないきもちが、しずかにつたわってきた。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:792 | label | 湊の夢を聞く | みなとのゆめをきく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:792 | response | 湊は少し迷ってから、誰かを支えられる人になりたいと話した。その「誰か」に二人も含まれていることが分かった。 | みなとすこしまよってから、だれかをささえられるにんになりたいとはなした。その「だれか」にふたりもふくまれていることがわかった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:793 | label | 写真を撮ろうと誘う | しゃしんをとろうとさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:793 | response | 水槽の前で撮った写真に、湊は照れくさそうに笑っていた。今日の時間を何度も見返したいと言ってくれた。 | すいそうのまえでとったしゃしんに、みなとはてれくさそうにわらっていた。きょうのじかんをなんどもみかえしたいといってくれた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:837 | label | 湊を信じて前へ出る | みなとをしんじてまえへでる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:837 | response | 二人が湊の魔法を信じて踏み出すと、清い水の盾が道を開いた。湊は震えながらも、最後まで支え続けた。 | ふたりがみなとのまほうをしんじてふみだすと、きよいみずのたてがみちをひらいた。みなとはふるえながらも、さいごまでささえつづけた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:838 | label | 必ず一緒に戻ると約束する | かならずいっしょにもどるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:838 | response | 帰る約束に、湊は強く頷いた。守ることと守られることが、二人の間で同じ意味になった。 | かえるやくそくに、みなとはつよくうなずいた。まもることとまもられることが、ふたりのかんでおなじいみになった。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:839 | label | 回復役として作戦を任せる | かいふくやくとしてさくせんをまかせる | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:839 | response | 二人が判断を任せると、湊は迷いを振り切った。的確な指示で危機を乗り越え、少し誇らしそうに笑った。 | ふたりがはんだんをまかせると、みなとはまよいをふりきった。てきかくなしじでききをのりこえ、すこしほこらしそうにわらった。 | The physical effort sharpened your rhythm and confidence. |
| src/data/magicRomanceDialogue.ts:883 | label | 卒業後も隣にいてほしいと伝える | そつぎょうごもとなりにいてほしいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:883 | response | 二人が手を差し出すと、湊は両手でそっと握り返した。これからは自分が隣で支えると約束してくれた。 | ふたりがてをさしだすと、みなとはりょうてでそっとにぎりかえした。これからはじぶんがとなりでささえるとやくそくしてくれた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:884 | label | 使命も恋も諦めないと言う | しめいもこいもあきらめないという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:884 | response | 湊はまっすぐ相手を見た。怖くても一緒に強くなりたいという言葉に、二人の未来が重なった。 | みなとはまっすぐあいてをみた。こわくてもいっしょにつよくなりたいということばに、ふたりのみらいがかさなった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:885 | label | 次の休日の約束をする | つぎのきゅうじつのやくそくをする | You took a moment to recover and regain your rhythm. |
| src/data/magicRomanceDialogue.ts:885 | response | 最初の約束は休日の散歩になった。湊は嬉しそうに予定を確認し、何度も忘れませんと言った。 | さいしょのやくそくはきゅうじつのさんぽになった。みなとはうれしそうによていをかくにんし、なんどもわすれませんといった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:931 | label | 理由を聞く | りゆうをきく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:931 | response | 二人が問い詰めると、理玖は楽しそうに肩をすくめた。未来より今の反応が見たいと言われ、少し振り回された。 | ふたりがといつめると、りくはたのしそうにかたをすくめた。みらいよりいまのはんのうがみたいといわれ、すこしふりまわされた。 | Seeing the situation from a new angle gave you a useful perspective. |
| src/data/magicRomanceDialogue.ts:932 | label | 一緒に調べようと誘う | いっしょにしらべようとさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:932 | response | 理玖は意外そうに瞬いたあと、悪くないねと笑った。観測するだけだった時間に、二人の歩幅が混ざった。 | りくはいがいそうにしゅんいたあと、わるくないねとわらった。かんそくするだけだったじかんに、ふたりのほはばがまざった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:933 | label | 先に進んでみる | さきにすすんでみる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:933 | response | 二人が迷わず歩き出すと、理玖は声を立てて笑った。予想外だと言いながら、ちゃんと隣についてきた。 | ふたりがまよわずあるきだすと、りくはこえをたててわらった。よそうがいだといいながら、ちゃんととなりについてきた。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:977 | label | 記録の読み方を教えてもらう | きろくのよみかたをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:977 | response | 理玖は軽い口調で、しかし丁寧に記録の意味を教えた。失敗が未来への手紙みたいに見えてきた。 | りくはかるいくちょうで、しかしていねいにきろくのいみをおしえた。しっぱいがみらいへのてがみみたいにみえてきた。 | The risky choice backfired and left you with a setback. |
| src/data/magicRomanceDialogue.ts:978 | label | 失敗が怖いと話す | しっぱいがこわいとはなす | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:978 | response | 二人が本音を話すと、理玖は笑わなかった。怖いまま選ぶ方が面白い未来になることもあると、静かに言った。 | ふたりがほんねをはなすと、りくはわらわなかった。こわいままえらぶほうがおもしろいみらいになることもあると、しずかにいった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:979 | label | 少し休んでから続ける | すこしやすんでからつづける | You took a moment to recover and regain your rhythm. |
| src/data/magicRomanceDialogue.ts:979 | response | 休憩を挟むと、理玖は窓の外を見ながら今日は急がなくていいと言った。先を知りすぎない時間が、心地よかった。 | きゅうけいをはさむと、りくはまどのそとをみながらきょうはいそがなくていいといった。さきをしりすぎないじかんが、ここちよかった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:1023 | label | その言葉を受け止める | そのことばをうけやめる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1023 | response | 二人が頷くと、理玖は少しだけ照れたように笑った。予測できない沈黙が、二人には新鮮だった。 | ふたりがうなずくと、りくはすこしだけてれたようにわらった。よそくできないちんもくが、ふたりにはしんせんだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1024 | label | 理玖の本音を聞く | りくのほんねをきく | Ask for Their True Feelings |
| src/data/magicRomanceDialogue.ts:1024 | response | 理玖は冗談を挟まず、先を知るほど怖くなることもあると話した。二人はその弱さを、初めて近くで聞いた。 | りくはじょうだんをはさまず、さきをしるほどこわくなることもあるとはなした。ふたりはそのよわさを、はじめてちかくできいた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1025 | label | 今日のことを覚えておくと言う | きょうのことをおぼえておくという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1025 | response | 忘れないと言うと、理玖は時計をポケットにしまった。記録しなくても残る時間があると、二人で知った。 | わすれないというと、りくはとけいをぽけっとにしまった。きろくしなくてものこるじかんがあると、ふたりでしった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1069 | label | 今を信じて飛び込む | いまをしんじてとびこむ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1069 | response | 二人が迷わず進むと、理玖も時計を閉じて続いた。先読みではなく、二人の選択が道を作った。 | ふたりがまよわずすすむと、りくもとけいをとじてつづいた。さきよみではなく、ふたりのせんたくがみちをつくった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:1070 | label | 必ず戻ると約束する | かならずもどるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1070 | response | 約束を聞いた理玖は、いつもの軽さを消して頷いた。帰る未来は見るものではなく作るものだと言った。 | やくそくをきいたりくは、いつものかるさをけしてうなずいた。かえるみらいはみるものではなくつくるものだといった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1071 | label | 分岐を一緒に整理する | ぶんきをいっしょにせいりする | Tidying things up also helped clear your mind for the next step. |
| src/data/magicRomanceDialogue.ts:1071 | response | 二人で目の前の情報だけを拾い、危険な未来をひとつずつ避けた。理玖は君となら外れても悪くないと笑った。 | ふたりでめのまえのじょうほうだけをひろい、きけんなみらいをひとつずつさけた。りくはきみとならはずれてもわるくないとわらった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1115 | label | 隣で答え合わせしたいと言う | となりでこたえあわせしたいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1115 | response | 二人がそう伝えると、理玖は満足そうに笑った。未来を知らない約束が、二人には何より特別だった。 | ふたりがそうつたえると、りくはまんぞくそうにわらった。みらいをしらないやくそくが、ふたりにはなによりとくべつだった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1116 | label | 使命も今の気持ちも選ぶ | しめいもいまのきもちもえらぶ | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:1116 | response | 理玖は軽く頷いたが、その目は真剣だった。どの分岐でも、今の気持ちだけは自分で選ぶと言った。 | りくはかるくうなずいたが、そのめはしんけんだった。どのぶんきでも、いまのきもちだけはじぶんでえらぶといった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:1117 | label | 明日の待ち合わせを決める | あしたのまちあわせをきめる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1117 | response | 待ち合わせの時間を決めると、理玖は時計を見ずに覚えた。最初の答え合わせは、明日の朝になった。 | まちあわせのじかんをきめると、りくはとけいをみずにおぼえた。さいしょのこたえあわせは、あしたのあさになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1163 | label | 横で手伝う | よこでてつだう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1163 | response | 二人が工具を渡すと、大和は文句を言いながら受け取った。追い払わないことが、彼なりの許可だった。 | ふたりがこうぐをわたすと、やまとはもんくをいいながらうけとった。おいはらわないことが、かれなりのきょかだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1164 | label | 心配してくれたのか聞く | しんぱいしてくれたのかきく | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:1164 | response | 大和は顔をそむけて、うるせえとだけ言った。耳が赤いことには、気づかないふりをしておいた。 | やまとはかおをそむけて、うるせえとだけいった。みみがあかいことには、きづかないふりをしておいた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1165 | label | 一緒に片づける | いっしょにかたづける | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1165 | response | 二人で片づけるうちに、大和の口調は少しだけ柔らかくなった。乱暴な手つきでも、二人の分だけは丁寧だった。 | ふたりでかたづけるうちに、やまとのくちょうすこしだけやわらかくなった。らんぼうなてつきでも、ふたりのふんだけはていねいだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1209 | label | 炎の扱いを教えてもらう | ほのおのあつかいをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1209 | response | 大和はぶっきらぼうに説明したが、危ないところでは必ず手を添えた。教え方は荒いのに、不思議と怖くなかった。 | やまとはぶっきらぼうにせつめいしたが、あぶないところではかならずてをそえた。おしえかたはあらいのに、ふしぎとこわくなかった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:1210 | label | 自分も失敗すると話す | じぶんもしっぱいするとはなす | Putting things into words helped clarify your thoughts and steady your mood. |
| src/data/magicRomanceDialogue.ts:1210 | response | 二人が失敗を話すと、大和は笑わなかった。分かんねえなら聞けよ、と短く言って隣に座った。 | ふたりがしっぱいをはなすと、やまとはわらわなかった。わかんねえならきけよ、とみじかくいってとなりにすわった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1211 | label | 水分補給に誘う | すいぶんほきゅうにさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1211 | response | 休憩を促すと、大和は文句を言いながらも従った。渡した飲み物を受け取る手は、思ったより素直だった。 | きゅうけいをうながすと、やまとはもんくをいいながらもしたがった。わたしたのみものをうけとるては、おもったよりすなおだった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:1255 | label | 一緒に回りたいと言う | いっしょにまわりたいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1255 | response | 二人が笑うと、大和は照れ隠しに早足になった。けれど歩幅は、ちゃんと二人に合わせていた。 | ふたりがわらうと、やまとはてれかくしにはやあしになった。けれどほはばは、ちゃんとふたりにあわせていた。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:1256 | label | 本当は優しいと言う | ほんとうはやさしいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1256 | response | 優しいと言われた大和は露骨にむせた。否定する声は荒かったが、離れようとはしなかった。 | やさしいといわれたやまとはろこつにむせた。ひていするこえはあらかったが、はなれようとはしなかった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1257 | label | 記念に屋台へ誘う | きねんにやたいへさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1257 | response | 屋台で選んだ小さな飾りを、大和は不器用に受け取った。いらねえと言いながら、最後まで手放さなかった。 | やたいでえらんだちいさなかざりを、やまとはぶきようにうけとった。いらねえといいながら、さいごまでてばなさなかった。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:1301 | label | 隣で戦う | となりでたたかう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1301 | response | 二人が隣へ飛び込むと、大和は怒鳴りながらも笑った。守るだけではなく、並んで突破する炎が道を作った。 | ふたりがとなりへとびこむと、やまとはどなりながらもわらった。まもるだけではなく、ならんでとっぱするほのおがみちをつくった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1302 | label | 必ず帰ると叫ぶ | かならずかえるとさけぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1302 | response | 帰る約束に、大和の炎がさらに強くなった。乱暴な言葉の奥に、失いたくない気持ちがはっきり見えた。 | かえるやくそくに、やまとのほのおがさらにつよくなった。らんぼうなことばのおくに、うしないたくないきもちがはっきりみえた。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:1303 | label | 退路を確保する | たいろをかくほする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1303 | response | 相手の判断で退路を開くと、大和は素直に従った。意地よりも、二人で戻ることを選んだ。 | あいてのはんだんでたいろをひらくと、やまとはすなおにしたがった。いじよりも、ふたりでもどることをえらんだ。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1347 | label | 隣にいたいと伝える | となりにいたいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1347 | response | 二人が頷くと、大和は照れたように視線をそらした。難しい言葉はなかったが、約束だけはまっすぐだった。 | ふたりがうなずくと、やまとはてれたようにしせんをそらした。むずかしいことばはなかったが、やくそくだけはまっすぐだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1348 | label | 戦いも日常も一緒に選ぶ | たたかいもにちじょうもいっしょにえらぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1348 | response | 大和は拳を握りしめ、どっちも守ると言った。ぶっきらぼうな声に、確かな覚悟がこもっていた。 | やまとはこぶしをにぎりしめ、どっちもまもるといった。ぶっきらぼうなこえに、たしかなかくごがこもっていた。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/data/magicRomanceDialogue.ts:1349 | label | 明日の約束をする | あしたのやくそくをする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1349 | response | 明日も会おうと言うと、大和は当然だろと返した。その短い返事が、何より彼らしかった。 | あしたもあおうというと、やまとはとうぜんだろとかえした。そのみじかいへんじが、なによりかれらしかった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1395 | label | 舞台に上がる | ぶたいにあがる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1395 | response | 二人が舞台へ上がると、レオンは満足そうに手を差し出した。特等席ではなく、共演者として迎えられた。 | ふたりがぶたいへあがると、レオンはまんぞくそうにてをさしだした。とくとうせきではなく、きょうえんしゃとしてむかえられた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1396 | label | 少し緊張すると話す | すこしきんちょうするとはなす | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1396 | response | 緊張を打ち明けると、レオンは優雅に笑った。大丈夫、君の一歩目は僕が照らすよと囁いた。 | きんちょうをうちあけると、レオンはゆうがにわらった。だいじょうぶ、きみのいっぽめはぼくがてらすよとささやいた。 | The risky choice backfired and left you with a setback. |
| src/data/magicRomanceDialogue.ts:1397 | label | 一緒に練習する | いっしょにれんしゅうする | The physical effort sharpened your rhythm and confidence. |
| src/data/magicRomanceDialogue.ts:1397 | response | 二人の魔法が音に合わせて重なると、レオンの表情が本気になった。褒め言葉は華やかでも、努力を見る目は誠実だった。 | ふたりのまほうがおとにあわせてかさなると、レオンのひょうじょうがほんきになった。ほめことばははなやかでも、どりょくをみるめはせいじつだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1441 | label | 努力を認める | どりょくをみとめる | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:1441 | response | 二人が素直に称えると、レオンは一瞬だけ言葉を失った。華やかな笑顔の裏に、報われた安堵が見えた。 | ふたりがすなおにとなえると、レオンはいっしゅんだけことばをうしなった。はなやかなえがおのうらに、むくわれたあんどがみえた。 | The risky choice backfired and left you with a setback. |
| src/data/magicRomanceDialogue.ts:1442 | label | 自分の弱点も話す | じぶんのじゃくてんもはなす | You Weak |
| src/data/magicRomanceDialogue.ts:1442 | response | 弱点を話すと、レオンは勝ち誇らずに聞いた。なら次の稽古はそこからだねと、自然に二人分の予定を作った。 | じゃくてんをはなすと、レオンはかちほこらずにきいた。ならつぎのけいこはそこからだねと、しぜんにふたりぶんのよていをつくった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:1443 | label | 休憩に誘う | きゅうけいにさそう | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:1443 | response | 休憩を提案すると、レオンは芝居がかったため息をついた。けれど差し出された飲み物は、嬉しそうに受け取った。 | きゅうけいをていあんすると、レオンはしばいがかったためいきをついた。けれどさしだされたのみものは、うれしそうにうけとった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:1487 | label | 本当の顔も見たいと言う | ほんとうのかおもみたいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1487 | response | 二人の言葉に、レオンは仮面を外すように笑った。華やかでない沈黙も、二人の時間になった。 | ふたりのことばに、レオンはかめんをはずすようにわらった。はなやかでないちんもくも、ふたりのじかんになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1488 | label | 最後まで話を聞く | さいごまではなしをきく | Listen to the End |
| src/data/magicRomanceDialogue.ts:1488 | response | 急かさず聞くと、レオンは舞台に立ち続ける怖さを打ち明けた。弱さを見せても輝きは消えないと、二人は知った。 | せかさずきくと、レオンはぶたいにたちつづけるこわさをうちあけた。よわさをみせてもかがやきはきえないと、ふたりはしった。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:1489 | label | 開演前の写真を撮る | かいえんまえのしゃしんをとる | Opening Take Photo |
| src/data/magicRomanceDialogue.ts:1489 | response | 写真を提案すると、レオンはいつもの笑顔を作りかけてやめた。少し素のまま写った一枚を、大切そうに見つめた。 | しゃしんをていあんすると、レオンはいつものえがおをつくりかけてやめた。すこしもとのままうつったいちまいを、たいせつそうにみつめた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1533 | label | 共演者として前へ出る | きょうえんしゃとしてまえへでる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1533 | response | 二人が隣に立つと、レオンの幻術が一気に色を取り戻した。二人の呼吸が合い、悪夢の舞台は希望の場面へ変わった。 | ふたりがとなりにたつと、レオンのげんじゅつがいっきにいろをとりもどした。ふたりのこきゅうがあい、あくむのぶたいはきぼうのばめんへかわった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:1534 | label | 必ず幕を上げると誓う | かならずまくをあげるとちかう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1534 | response | 誓いの言葉に、レオンは眩しいほど笑った。怖さを知った主役は、それでも観客席ではなく相手を見ていた。 | ちかいのことばに、レオンはまぶしいほどわらった。こわさをしったしゅやくは、それでもかんきゃくせきではなくあいてをみていた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1535 | label | 演出を組み直す | えんしゅつをくみなおす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1535 | response | 二人の提案で幻術の流れを変えると、レオンは即座に合わせた。即興の二重奏が、結界の中心を切り開いた。 | ふたりのていあんでげんじゅつのながれをかえると、レオンはそくざにあわせた。そっきょうのにじゅうそうが、けっかいのちゅうしんをきりひらいた。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:1579 | label | これからも隣にいたいと言う | これからもとなりにいたいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1579 | response | 二人が気持ちを伝えると、レオンは恭しく手を取った。舞台が終わっても、君との物語は続くよと微笑んだ。 | ふたりがきもちをつたえると、レオンはうやうやしくてをとった。ぶたいがおわっても、きみとのものがたりはつづくよとほほえんだ。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:1580 | label | 使命と恋をどちらも選ぶ | しめいとこいをどちらもえらぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1580 | response | レオンは大げさに頷きながらも、目は真剣だった。どんな幕でも二人で上げようと約束した。 | レオンはおおげさにがんきながらも、めはしんけんだった。どんなまくでもふたりであげようとやくそくした。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1581 | label | 次の公演を約束する | つぎのこうえんをやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1581 | response | 次の公演の約束に、レオンは最高の招待状を用意すると言った。けれど一番大事なのは、二人が隣にいることだった。 | つぎのこうえんのやくそくに、レオンはさいこうのしょうたいじょうをよういするといった。けれどいちばんだいじなのは、ふたりがとなりにいることだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1627 | label | もっと教えてほしいと言う | もっとおしえてほしいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1627 | response | 二人が身を乗り出すと、エリオットは丁寧に本を開いた。秘密を分けるような静かな時間が始まった。 | ふたりがみをのりだすと、エリオットはていねいにほんをひらいた。ひみつをわけるようなしずかなじかんがはじまった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1628 | label | 無理に聞かないと伝える | むりにきかないとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1628 | response | 気遣う言葉に、エリオットの表情が少し和らいだ。近づきすぎない優しさが、彼の警戒をほどいた。 | きづかうことばに、エリオットのひょうじょうがすこしやわらいだ。ちかづきすぎないやさしさが、かれのけいかいをほどいた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1629 | label | 一緒に調べる | いっしょにしらべる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1629 | response | 二人で文字を追ううちに、エリオットはこの世界の言葉も美しいと言った。その声はどこか寂しげだった。 | ふたりでもじをおううちに、エリオットはこのせかいのことばもうつくしいといった。そのこえはどこかさびしげだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1673 | label | 星界文字を教えてもらう | せいかいもじをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1673 | response | エリオットは発音まで丁寧に教えてくれた。二人が一文字読めるたび、彼は静かに嬉しそうだった。 | エリオットははつおんまでていねいにおしえてくれた。ふたりがひともじよめるたび、かれはしずかにうれしそうだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1674 | label | 自分の苦手も見せる | じぶんのにがてもみせる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1674 | response | 二人が間違えると、エリオットは責めずに訂正した。失敗を急がせない優しさが、緊張をほどいた。 | ふたりがまちがえると、エリオットはせめずにていせいした。しっぱいをいそがせないやさしさが、きんちょうをほどいた。 | The risky choice backfired and left you with a setback. |
| src/data/magicRomanceDialogue.ts:1675 | label | お茶に誘う | おちゃにさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1675 | response | 休憩に誘うと、エリオットは少し驚いたあと微笑んだ。この世界の放課後を、また一つ覚えられたと言った。 | きゅうけいにさそうと、エリオットすこしおどろいたあとほほえんだ。このせかいのほうかごを、またひとつおぼえられたといった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:1719 | label | この世界の好きなものを聞く | このせかいのすきなものをきく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1719 | response | エリオットは迷いながら、購買のパンや夕方のチャイムを挙げた。最後に、あなたと見る景色も、と小さく付け加えた。 | エリオットはまよいながら、こうばいのぱんやゆうがたのちゃいむをあげた。さいごに、あなたとみるけしきも、とちいさくつけくわえた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1720 | label | 寂しさを受け止める | さびしさをうけやめる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1720 | response | 二人がそばにいると伝えると、エリオットは目を伏せた。帰る場所が一つでなくてもいいと、少しだけ思えたようだった。 | ふたりがそばにいるとつたえると、エリオットはめをふせた。かえるばしょがひとつでなくてもいいと、すこしだけおもえたようだった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1721 | label | 思い出を残そうと提案する | おもいでをのこそうとていあんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1721 | response | 二人で星の光を写真に収めた。エリオットは記録ではなく思い出として残したいと、大切そうに保存した。 | ふたりでほしのひかりをしゃしんにおさめた。エリオットはきろくではなくおもいでとしてのこしたいと、たいせつそうにほぞんした。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1765 | label | 一緒に門を閉じる | いっしょにもんをとじる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1765 | response | 二人が手を伸ばすと、エリオットの光が強くなった。帰る命令より、今守りたいものを選んだ光だった。 | ふたりがてをのばすと、エリオットのひかりがつよくなった。かえるめいれいより、いままもりたいものをえらんだひかりだった。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:1766 | label | 必ずまた会うと約束する | かならずまたあうとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1766 | response | 約束の言葉に、エリオットは静かに頷いた。どの世界にいても、あなたへ続く道を探すと言った。 | やくそくのことばに、エリオットはしずかにうなずいた。どのせかいにいても、あなたへつづくみちをさがすといった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1767 | label | 信号を解析する | しんごうをかいせきする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1767 | response | 二人で信号を読み解き、門の暴走を止めた。エリオットは相手の判断を、正式な記録より信頼していた。 | ふたりでしんごうをよみとき、もんのぼうそうをとめた。エリオットはあいてのはんだんを、せいしきなきろくよりしんらいしていた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1811 | label | 隣にいてほしいと伝える | となりにいてほしいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1811 | response | その言葉に、エリオットは深く礼をした。礼儀正しい仕草の奥で、手は確かに相手を求めていた。 | そのことばに、エリオットはふかくれいをした。れいぎただしいしぐさのおくで、てはたしかにあいてをもとめていた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1812 | label | 二つの世界を大切にすると誓う | ふたつのせかいをたいせつにするとちかう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1812 | response | エリオットはどちらも捨てない未来に頷いた。境界を越えても、二人で戻れる道を作ると約束した。 | エリオットはどちらもすてないみらいにうなずいた。きょうかいをこえても、ふたりでもどれるみちをつくるとやくそくした。 | You cleared away something unnecessary and made room to move forward. |
| src/data/magicRomanceDialogue.ts:1813 | label | 次に会う場所を決める | つぎにあうばしょをきめる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1813 | response | 待ち合わせは礼拝堂の前になった。エリオットは何度も時間を確認し、初めて普通の約束を喜んだ。 | まちあわせはれいはいどうのまえになった。エリオットはなんどもじかんをかくにんし、はじめてふつうのやくそくをよろこんだ。 | Your careful choice helped someone and improved the situation. |
| src/data/magicRomanceDialogue.ts:1859 | label | それでも手を伸ばす | それでもてをのばす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1859 | response | 二人が退かずにいると、朔夜は封印札を下ろした。信じるとは言わないが、攻撃する理由も消えたようだった。 | ふたりがしりぞかずにいると、さくやはふういんさつをくだろした。しんじるとはいわないが、こうげきするりゆうもきえたようだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1860 | label | 無理に信じなくていいと言う | むりにしんじなくていいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1860 | response | 二人の言葉に、朔夜はわずかに目を細めた。赦しを押しつけない距離が、彼には意外だった。 | ふたりのことばに、さくやはわずかにめをほそめた。ゆるしをおしつけないきょりが、かれにはいがいだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1861 | label | 封印を一緒に調べる | ふういんをいっしょにしらべる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1861 | response | 二人で禁書の文字を追うと、朔夜は必要なことだけを淡々と教えた。短い説明の中に、確かな協力があった。 | ふたりできんしょのもじをおうと、さくやはひつようなことだけをたんたんとおしえた。みじかいせつめいのなかに、たしかなきょうりょくがあった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:1905 | label | 手伝う理由を伝える | てつだうりゆうをつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1905 | response | 二人が自分で選んだと伝えると、朔夜は黙って席を空けた。拒絶ではなく、受け入れるための沈黙だった。 | ふたりがじぶんでえらんだとつたえると、さくやはだまってせきをあけた。きょぜつではなく、うけいれるためのちんもくだった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1906 | label | 怖さも正直に話す | こわさもしょうじきにはなす | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1906 | response | 怖いと認めても離れない二人に、朔夜は少しだけ表情を崩した。恐れられてもなお隣にいる意味を、考えているようだった。 | こわいとみとめてもはなれないふたりに、さくやすこしだけひょうじょうをくずした。おそれられてもなおとなりにいるいみを、かんがえているようだった。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:1907 | label | 休憩を提案する | きゅうけいをていあんする | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:1907 | response | 休憩など不要だと返した朔夜だったが、二人が差し出した茶には手を伸ばした。湯気の向こうで、空気が少しやわらいだ。 | きゅうけいなどふようだとかえしたさくやだったが、ふたりがさしだしたちゃにはてをのばした。ゆげのむこうで、くうきがすこしやわらいだ。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:1951 | label | 今の朔夜を見ると言う | いまのさくやをみるという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1951 | response | 二人が現在の行動を見たいと伝えると、朔夜は長く沈黙した。赦しではなく理解を求められたことに、戸惑っていた。 | ふたりがげんざいのこうどうをみたいとつたえると、さくやはながくちんもくした。ゆるしではなくりかいをもとめられたことに、とまどっていた。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:1952 | label | 聞けるところまででいいと待つ | きけるところまででいいとまつ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1952 | response | 急かさず待つと、朔夜は途切れ途切れに過去を語った。言葉は冷たかったが、逃げずに話すことが彼の信頼だった。 | せかさずまつと、さくやはとぎれとぎれにかこをかたった。ことばはつめたかったが、にげずにはなすことがかのしんらいだった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1953 | label | 記録として残さないと約束する | きろくとしてのこさないとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1953 | response | 誰にも話さないと約束すると、朔夜は静かに頷いた。秘密を預ける重さを、二人は両手で受け止めた。 | だれにもはなさないとやくそくすると、さくやはしずかにうなずいた。ひみつをあずけるおもさを、ふたりはりょうてでうけとめた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:1997 | label | 隣で封印を支える | となりでふういんをささえる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1997 | response | 二人が封印陣に手を重ねると、朔夜は初めて助けを拒まなかった。二人の魔力が重なり、暴走は静かに鎮まった。 | ふたりがふういんじんにてをかさねると、さくやははじめてたすけをこばまなかった。ふたりのまりょくがかさなり、ぼうそうはしずかにつつしまった。 | Your careful choice helped someone and improved the situation. |
| src/data/magicRomanceDialogue.ts:1998 | label | 必ず生きて戻ると告げる | かならずいきてもどるとつげる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1998 | response | 生きて戻るという言葉に、朔夜の目が揺れた。捨て石になるなと怒る二人の声が、彼を現実へ引き戻した。 | いきてもどるということばに、さくやのめがゆれた。すていしになるなといかるふたりのこえが、かれをげんじつへひきもどした。 | You cleared away something unnecessary and made room to move forward. |
| src/data/magicRomanceDialogue.ts:1999 | label | 退路を封印術で作る | たいろをふういんじゅつでつくる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:1999 | response | 二人の提案に、朔夜は即座に術式を組み替えた。自己犠牲ではなく、二人で帰るための封印だった。 | ふたりのていあんに、さくやはそくざにじゅつしきをくみかえた。じこぎせいではなく、ふたりでかえるためのふういんだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2043 | label | 隣にいてほしいと伝える | となりにいてほしいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2043 | response | 二人が手を差し出すと、朔夜はためらいながらも取った。過去ではなく、これからの行動で示すと静かに誓った。 | ふたりがてをさしだすと、さくやはためらいながらもとった。かこではなく、これからのこうどうでしめすとしずかにちかった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2044 | label | 使命と気持ちを両方選ぶ | しめいときもちをりょうほうえらぶ | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:2044 | response | 朔夜は逃げずに頷いた。罪を消すことはできなくても、二人と未来を守ることは選べると言った。 | さくやはにげずにうなずいた。つみをけすことはできなくても、ふたりとみらいをまもることはえらべるといった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2045 | label | 二人だけの約束を交わす | ふたりだけのやくそくをまじわす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2045 | response | 燃え尽きた札の灰が風に消えた。朔夜は二人の名前を呼び、初めて穏やかな声で明日を約束した。 | もえことごときたさつのはいがかぜにきえた。さくやはふたりのなまえをよび、はじめておだやかなこえであしたをやくそくした。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2090 | label | 一緒に行こうと言う | いっしょにいこうという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2090 | response | あかりはぱっと笑って、二人の手を引いた。一人で走るより、隣にいる方が心強いと素直に言った。 | あかりはぱっとわらって、ふたりのてをひいた。ひとりではしるより、となりにいるほうがこころづよいとすなおにいった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:2091 | label | 危なかったら止めると伝える | あぶなかったらやめるとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2091 | response | 止めてくれる人がいるならもっと頑張れると、あかりは胸を張った。勢いだけではない信頼が生まれた。 | とめてくれるにんがいるならもっとがんばれると、あかりはむねをはった。いきおいだけではないしんらいがうまれた。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:2092 | label | まず状況を見ようと提案する | まずじょうきょうをみようとていあんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2092 | response | あかりは少しだけ足を止めた。急ぐ前に一緒に見る、その選択が二人の最初の連携になった。 | あかりはすこしだけあしをとめた。いそぐまえにいっしょにみる、そのせんたくがふたりのさいしょのれんけいになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2132 | label | 得意なところを褒める | とくいなところをほめる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2132 | response | 褒められたあかりは照れずに喜んだ。その明るさが、机の上の課題まで軽くした。 | ほめられたあかりはてれずによろこんだ。そのあかるさが、つくえのうえのかだいまでかるくした。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:2133 | label | 苦手なところを一緒に解く | にがてなところをいっしょにとく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2133 | response | 二人で同じ問題に向き合うと、あかりは何度も頷いた。できた瞬間、笑顔が教室いっぱいに広がった。 | ふたりでおなじもんだいにむきあうと、あかりはなんどもうなずいた。できたしゅんかん、えがおがきょうしついっぱいにひろがった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:2134 | label | 休憩してから続ける | きゅうけいしてからつづける | Rest Continue |
| src/data/magicRomanceDialogue.ts:2134 | response | 休憩を挟むと、あかりはまた元気を取り戻した。無理に走り続けないことも、二人で覚えた。 | きゅうけいをはさむと、あかりはまたげんきをとりもどした。むりにはしりつづけないことも、ふたりでおぼえた。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:2174 | label | 隣にいると伝える | となりにいるとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2174 | response | 二人が隣に立つと、あかりは安心したように息を吐いた。明るい笑顔の奥の不安を、初めて見せてくれた。 | ふたりがとなりにたつと、あかりはあんしんしたようにいきをはいた。あかるいえがおのおくのふあんを、はじめてみせてくれた。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:2175 | label | 話を最後まで聞く | はなしをさいごまできく | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2175 | response | 急かさず聞くと、あかりは少しずつ本音を話した。強がらなくてもいい時間が、二人の秘密になった。 | せかさずきくと、あかりはすこしずつほんねをはなした。つよがらなくてもいいじかんが、ふたりのひみつになった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2176 | label | 星空を一緒に見る | ほしぞらをいっしょにみる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2176 | response | 二人で空を見上げると、あかりはまた笑った。星を見るなら一人より二人がいいと、素直に言ってくれた。 | ふたりでそらをみあげると、あかりはまたわらった。ほしをみるならひとりよりふたりがいいと、すなおにいってくれた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2216 | label | 一緒に前へ出る | いっしょにまえへでる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2216 | response | 二人が並ぶと、あかりの光が強くなった。守るだけでなく、二人で道を切り開いた。 | ふたりがならぶと、あかりのひかりがつよくなった。まもるだけでなく、ふたりでみちをきりひらいた。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:2217 | label | 必ず帰ると約束する | かならずかえるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2217 | response | 約束の言葉に、あかりは力強く頷いた。怖くても笑えるのは、隣に二人がいるからだった。 | やくそくのことばに、あかりはちからづよくうなずいた。こわくてもわらえるのは、となりにふたりがいるからだった。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:2218 | label | 作戦を立て直す | さくせんをたてなおす | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:2218 | response | 勢いだけではなく、二人で動きを合わせた。あかりは真剣な顔で二人の合図を待った。 | いきおいだけではなく、ふたりでうごきをあわせた。あかりはしんけんなかおでふたりのあいずをまった。 | The physical effort sharpened your rhythm and confidence. |
| src/data/magicRomanceDialogue.ts:2258 | label | 隣にいたいと伝える | となりにいたいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2258 | response | あかりは迷わず頷いた。恋も任務も、二人なら明るく選べると笑った。 | あかりはまよわずうなずいた。こいもにんむも、ふたりならあかるくえらべるとわらった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:2259 | label | 使命も日常も大切にする | しめいもにちじょうもたいせつにする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2259 | response | 二人は戦いの先にある普通の明日を約束した。あかりの手はあたたかく、まっすぐだった。 | ふたりはたたかいのさきにあるふつうのあしたをやくそくした。あかりのてはあたたかく、まっすぐだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2260 | label | 明日の約束をする | あしたのやくそくをする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2260 | response | 最初の約束は放課後の待ち合わせになった。あかりは何度も楽しみだと言って笑った。 | さいしょのやくそくはほうかごのまちあわせになった。あかりはなんどもたのしみだといってわらった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2302 | label | 一緒に観測する | いっしょにかんそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2302 | response | しずくは淡々と手順を説明したが、隣の席は自然に空けてくれた。必要とされていることが伝わってきた。 | しずくはたんたんとてじゅんをせつめいしたが、となりのせきはしぜんにあけてくれた。ひつようとされていることがつたわってきた。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:2303 | label | 頼ってほしいと言う | たよってほしいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2303 | response | しずくは少し目を伏せた。それは……予想外です、と言いながらも拒まなかった。 | しずくはすこしめをふせた。それは……よそうがいです、といいながらもこばまなかった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2304 | label | 記録を分担する | きろくをぶんたんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2304 | response | 二人で記録を分けると、しずくの表情がやわらいだ。合理的です、という言葉が嬉しそうに響いた。 | ふたりできろくをわけると、しずくのひょうじょうがやわらいだ。ごうりてきです、ということばがうれしそうにひびいた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2344 | label | 解き方を教えてもらう | ときほうをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2344 | response | しずくの説明は的確だった。二人が理解すると、彼女はほんの少しだけ誇らしそうにした。 | しずくのせつめいはてきかくだった。ふたりがりかいすると、かのじょはほんのすこしだけほこらしそうにした。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:2345 | label | 自分の弱点を話す | じぶんのじゃくてんをはなす | You Weak |
| src/data/magicRomanceDialogue.ts:2345 | response | 弱点を聞いたしずくは笑わず、対策を書き出した。優しさを理屈で包むのが、彼女らしかった。 | じゃくてんをきいたしずくはわらわず、たいさくをかきだした。やさしさをりくつでつつむのが、かのじょらしかった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2346 | label | 休憩を提案する | きゅうけいをていあんする | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:2346 | response | 休憩は非効率では、と言いかけてしずくは止まった。あなたとなら必要かもしれません、と小さく付け加えた。 | きゅうけいはひこうりつでは、といいかけてしずくはとまった。あなたとならひつようかもしれません、とちいさくつけくわえた。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:2386 | label | 分析しなくてもいいと言う | ぶんせきしなくてもいいという | You refined what you learned and turned it into a practical advantage. |
| src/data/magicRomanceDialogue.ts:2386 | response | 二人の言葉に、しずくは少しだけ肩の力を抜いた。答えを急がない時間を、彼女は大切に受け取った。 | ふたりのことばに、しずくはすこしだけかたのちからをぬいた。こたえをいそがないじかんを、かのじょはたいせつにうけとった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:2387 | label | 最後まで聞く | さいごまできく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2387 | response | しずくは言葉を選びながら、本音を話した。感情をそのまま置いてもいいと知り、目元が和らいだ。 | しずくはことばをえらびながら、ほんねをはなした。かんじょうをそのままおいてもいいとしり、めもとがやわらいだ。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2388 | label | 一緒に記録する | いっしょにきろくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2388 | response | 二人で今日の出来事を書き残した。しずくは記録の最後に、楽しかった、と小さく書き足した。 | ふたりできょうのできごとをかきのこした。しずくはきろくのさいごに、たのしかった、とちいさくかきたした。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2428 | label | しずくを信じて進む | しずくをしんじてすすむ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2428 | response | 二人が頷くと、しずくの判断に迷いは消えた。二人の動きは計算以上に噛み合った。 | ふたりがうなずくと、しずくのはんだんにまよいはきえた。ふたりのうごきはけいさんいじょうにかみあった。 | The physical effort sharpened your rhythm and confidence. |
| src/data/magicRomanceDialogue.ts:2429 | label | 必ず戻ると約束する | かならずもどるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2429 | response | 約束を確認すると、しずくは静かに頷いた。帰るという条件だけは、絶対に外さないと言った。 | やくそくをかくにんすると、しずくはしずかにうなずいた。かえるというじょうけんだけは、ぜったいにはずさないといった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2430 | label | 作戦を組み直す | さくせんをくみなおす | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:2430 | response | 相手の案を聞き、しずくはすぐに式を修正した。予定外を受け入れる強さが、二人を救った。 | あいてのあんをきき、しずくれんぐにしきをしゅうせいした。よていがいをうけいれるつよさが、ふたりをすくった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:2470 | label | 隣にいたいと伝える | となりにいたいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2470 | response | しずくは頬を染めながら予定表に名前を書いた。恋人という欄はありませんが、と言いながら嬉しそうだった。 | しずくはほおをそめながらよていひょうになまえをかいた。こいびとというらんはありませんが、といいながらうれしそうだった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:2471 | label | 一緒に未来を選ぶ | いっしょにみらいをえらぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2471 | response | 二人で予定を決めるうちに、しずくの声は少しずつ柔らかくなった。未知の未来も、一緒なら怖くないと言った。 | ふたりでよていをきめるうちに、しずくのこえすこしずつやわらかくなった。みちのみらいも、いっしょならこわくないといった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:2472 | label | 次の約束を決める | つぎのやくそくをきめる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2472 | response | 次の約束は図書室になった。しずくは時間を正確に書き込み、絶対に忘れませんと微笑んだ。 | つぎのやくそくはとしょしつになった。しずくはじかんをせいかくにかきこみ、ぜったいにわすれませんとほほえんだ。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2514 | label | そばにいる | そばにいる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2514 | response | 二人が隣に座ると、ひよりは安心したように笑った。誰かに休んでいいと言われることに、まだ慣れていないようだった。 | ふたりがとなりにすわると、ひよりはあんしんしたようにわらった。だれかにやすんでいいといわれることに、まだなれていないようだった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:2515 | label | 無理しなくていいと言う | むりしなくていいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2515 | response | ひよりは小さく頷いた。優しい言葉を受け取るのが下手な彼女が、今日は少しだけ肩を預けた。 | ひよりはちいさくうなずいた。やさしいことばをうけとるのがへたなかのじょが、きょうはすこしだけかたをあずけた。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:2516 | label | 花の世話を手伝う | はなのせわをてつだう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2516 | response | 二人で花に水をやると、ひよりは嬉しそうに名前を教えてくれた。静かな時間が、やわらかな距離を作った。 | ふたりではなにみずをやると、ひよりはうれしそうになまえをおしえてくれた。しずかなじかんが、やわらかなきょりをつくった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2556 | label | 手当てを教えてもらう | てあてをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2556 | response | ひよりは優しく手順を教えた。二人がうまくできると、自分のことのように喜んでくれた。 | ひよりはやさしくてじゅんをおしえた。ふたりがうまくできると、じぶんのことのようによろこんでくれた。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:2557 | label | 自分の不安を話す | じぶんのふあんをはなす | You Doubt |
| src/data/magicRomanceDialogue.ts:2557 | response | 不安を打ち明けると、ひよりは手を止めて聞いてくれた。大丈夫と決めつけず、そっと寄り添ってくれた。 | ふあんをうちあけると、ひよりはてをとめてきいてくれた。だいじょうぶときめつけず、そっとよりそってくれた。 | The mishap left a mark and cost you momentum. |
| src/data/magicRomanceDialogue.ts:2558 | label | 少し休もうと誘う | すこしやすもうとさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2558 | response | 休もうと言うと、ひよりは迷ったあと頷いた。誰かを癒やす彼女にも、休む場所が必要だった。 | やすもうというと、ひよりはまよったあとうなずいた。だれかをいやすかのじょにも、やすむばしょがひつようだった。 | You took a moment to recover and regain your rhythm. |
| src/data/magicRomanceDialogue.ts:2598 | label | 弱音も聞くと伝える | よわねもきくとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2598 | response | 二人が待つと、ひよりは少しずつ言葉にした。優しくするだけではなく、優しさを受け取る時間になった。 | ふたりがまつと、ひよりすこしずつことばにした。やさしくするだけではなく、やさしさをうけとるじかんになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2599 | label | 抱え込まないでと言う | かかえこまないでという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2599 | response | ひよりは泣きそうな顔で笑った。一人で大丈夫と言う癖を、今日は二人が止めてくれた。 | ひよりはなきそうなかおでわらった。ひとりでだいじょうぶというくせを、きょうはふたりがとめてくれた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2600 | label | 花を見ながら話す | はなをみながらはなす | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2600 | response | 花壇の前で並ぶと、ひよりの声は少し落ち着いた。何気ない会話が、彼女の心をほどいていった。 | かだんのまえでならぶと、ひよりのこえすこしおちついた。なにげないかいわが、かのじょのこころをほどいていった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:2640 | label | 一緒に結界を支える | いっしょにけっかいをささえる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2640 | response | 二人が魔力を重ねると、ひよりの花がもう一度咲いた。二人で支える強さが、傷を希望へ変えた。 | ふたりがまりょくをかさねると、ひよりのはながもういちどさいた。ふたりでささえるつよさが、きずをきぼうへかえた。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:2641 | label | 必ず帰ると約束する | かならずかえるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2641 | response | 帰る約束に、ひよりは涙をこらえて頷いた。優しさは逃げ道ではなく、戻るための力になった。 | かえるやくそくに、ひよりはなみだをこらえてうなずいた。やさしさはにげみちではなく、もどるためのちからになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2642 | label | 守る場所を分担する | まもるばしょをぶんたんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2642 | response | 二人で役割を分けると、ひよりは無理に全部を抱えなかった。信じて任せることも、彼女の強さになった。 | ふたりでやくわりをわけると、ひよりはむりにぜんぶをかかえなかった。しんじてまかせることも、かのじょのつよさになった。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:2682 | label | 二人の場所を作ろうと言う | ふたりのばしょをつくろうという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2682 | response | ひよりは両手で花を包むように頷いた。嬉しい日も苦しい日も、分け合いたいと話してくれた。 | ひよりはりょうてではなをつつむようにうなずいた。うれしいひもくるしいひも、わけあいたいとはなしてくれた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2683 | label | 使命も日常も守ると誓う | しめいもにちじょうもまもるとちかう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2683 | response | 二人は戦いの先にある穏やかな時間を選んだ。ひよりの笑顔は、夜の花よりやさしく咲いた。 | ふたりはたたかいのさきにあるおだやかなじかんをえらんだ。ひよりのえがおは、よるのはなよりやさしくさいた。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:2684 | label | 次に会う約束をする | つぎにあうやくそくをする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2684 | response | 次の約束を決めると、ひよりは何度も嬉しそうに繰り返した。帰り道が寂しくないと言ってくれた。 | つぎのやくそくをきめると、ひよりはなんどもうれしそうにくりかえした。かえりみちがさびしくないといってくれた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2726 | label | 勝負を受ける | しょうぶをうける | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2726 | response | 二人が構えると、つばさは嬉しそうに飛び出した。ぶつかり合うほど、二人の距離は近づいた。 | ふたりがかまえると、つばさはうれしそうにとびだした。ぶつかりあうほど、ふたりのきょりはちかづいた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2727 | label | 危ないところを注意する | あぶないところをちゅういする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2727 | response | 注意されて、つばさはむっとした顔をした。けれど次の一撃は、ちゃんと相手を気遣っていた。 | ちゅういされて、つばさはむっとしたかおをした。けれどつぎのいちげきは、ちゃんとあいてをきづかっていた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2728 | label | 一緒に練習する | いっしょにれんしゅうする | The physical effort sharpened your rhythm and confidence. |
| src/data/magicRomanceDialogue.ts:2728 | response | 二人で型を合わせると、つばさの炎がまっすぐ伸びた。照れ隠しの大声まで、今日は頼もしかった。 | ふたりでかたをあわせると、つばさのほのおがまっすぐのびた。てれかくしのおおごえまで、きょうはたのもしかった。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:2768 | label | 得意なところを教えてもらう | とくいなところをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2768 | response | つばさは実技の例えで説明した。勢い任せに見えて、守るための理屈をちゃんと持っていた。 | つばさはじつぎのたとえでせつめいした。いきおいまかせにみえて、まもるためのりくつをちゃんともっていた。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:2769 | label | 苦手を一緒に解く | にがてをいっしょにとく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2769 | response | 分からないところで二人して悩むと、つばさは笑い出した。負けた気がしない勉強もあると知った。 | わからないところでふたりしてなやむと、つばさはわらいだした。まけたきがしないべんきょうもあるとしった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2770 | label | 休憩勝負に誘う | きゅうけいしょうぶにさそう | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:2770 | response | 休憩まで勝負にすると、つばさは照れながら乗ってきた。笑い声で、疲れが少し軽くなった。 | きゅうけいまでしょうぶにすると、つばさはてれながらのってきた。わらいこえで、つかれがすこしかるくなった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:2810 | label | もっと知りたいと言う | もっとしりたいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2810 | response | 二人が素直に言うと、つばさは真っ赤になってそっぽを向いた。逃げない背中が、答えのようだった。 | ふたりがすなおにいうと、つばさはまっかになってそっぽをむいた。にげないせなかが、こたえのようだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2811 | label | 無理に話さなくていいと言う | むりにはなさなくていいという | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2811 | response | 急かさない言葉に、つばさは少しだけ肩の力を抜いた。勢いで隠した本音が、ゆっくり顔を出した。 | せかさないことばに、つばさすこしだけかたのちからをぬいた。いきおいでかくしたほんねが、ゆっくりかおをだした。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:2812 | label | 一緒に帰ろうと誘う | いっしょにかえろうとさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2812 | response | 帰り道の誘いに、つばさは小さく頷いた。勝負ではない時間に、少し照れた横顔を見せた。 | かえりみちのさそいに、つばさはちいさくうなずいた。しょうぶではないじかんに、すこしてれたよこがおをみせた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2852 | label | 背中を預ける | せなかをあずける | Trust Them With Your Back |
| src/data/magicRomanceDialogue.ts:2852 | response | 二人が頷くと、つばさの炎が迷いなく走った。二人の連携は、ただの勢いではない強さになった。 | ふたりがうなずくと、つばさのほのおがまよいなくはしった。ふたりのれんけいは、ただのいきおいではないつよさになった。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:2853 | label | 帰る約束を叫ぶ | かえるやくそくをさけぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2853 | response | 約束に、つばさは満面の笑みで応えた。怖さを吹き飛ばす声が、結界の闇を裂いた。 | やくそくに、つばさはまんめんのえみでこたえた。こわさをふきとばすこえが、けっかいのやみをさいた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2854 | label | 作戦を合わせる | さくせんをあわせる | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:2854 | response | 二人の合図に合わせ、つばさは炎の角度を変えた。勝手に走らず待てたことが、何よりの信頼だった。 | ふたりのあいずにあわせ、つばさはほのおのかくどをかえた。かってにはしらずまてたことが、なによりのしんらいだった。 | You moved through the situation cleanly and kept the momentum going. |
| src/data/magicRomanceDialogue.ts:2894 | label | 隣にいたいと伝える | となりにいたいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2894 | response | 二人が笑うと、つばさは照れながらも手を差し出した。恋人になっても勝負は続くらしい。 | ふたりがわらうと、つばさはてれながらもてをさしだした。こいびとになってもしょうぶはつづくらしい。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2895 | label | 使命も恋も正面から選ぶ | しめいもこいもしょうめんからえらぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2895 | response | つばさは力強く頷いた。世界の終わりだって二人でぶっ飛ばすと、いつもの調子で言ってくれた。 | つばさはちからづよくうなずいた。せかいのおわりだってふたりでぶっとばすと、いつものちょうしでいってくれた。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:2896 | label | 次の勝負を約束する | つぎのしょうぶをやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2896 | response | 明日の勝負を決めると、つばさは楽しそうに笑った。その約束が、二人の告白の続きになった。 | あしたのしょうぶをきめると、つばさはたのしそうにわらった。そのやくそくが、ふたりのこくはくのつづきになった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2938 | label | 指示に従って手伝う | しじにしたがっててつだう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2938 | response | 二人が真剣に頷くと、れいは必要な札を渡した。短い言葉の奥に、守ろうとする意思があった。 | ふたりがしんけんにうなずくと、れいはひつようなさつをわたした。みじかいことばのおくに、まもろうとするいしがあった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2939 | label | 心配していると伝える | しんぱいしているとつたえる | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:2939 | response | 心配だと言われ、れいは少しだけ目を伏せた。問題ない、と返す声はいつもより柔らかかった。 | しんぱいだといわれ、れいはすこしだけめをふせた。もんだいない、とかえすこえはいつもよりやわらかかった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:2940 | label | 結界を一緒に確認する | けっかいをいっしょにかくにんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2940 | response | 二人で封印を確認すると、れいは二人の観察を認めた。無駄ではない、という言葉が小さな信頼になった。 | ふたりでふういんをかくにんすると、れいはふたりのかんさつをみとめた。むだではない、ということばがちいさなしんらいになった。 | Seeing the situation from a new angle gave you a useful perspective. |
| src/data/magicRomanceDialogue.ts:2980 | label | 古典の読み方を教わる | こてんのよみかたをおそわる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2980 | response | れいの説明は簡潔だったが、分からないところでは必ず待ってくれた。厳しさの中に優しさがあった。 | れいのせつめいはかんけつだったが、わからないところではかならずまってくれた。いかめしさのなかにやさしさがあった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:2981 | label | 苦手を打ち明ける | にがてをうちあける | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:2981 | response | 苦手だと話しても、れいは責めなかった。弱点を知ったなら対処できる、と静かに支えてくれた。 | にがてだとはなしても、れいはせめなかった。じゃくてんをしったならたいしょできる、としずかにささえてくれた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2982 | label | 少し休もうと誘う | すこしやすもうとさそう | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:2982 | response | 休憩は不要だと言いながら、れいは席を立たなかった。二人となら、沈黙の休憩も悪くないようだった。 | きゅうけいはふようだといいながら、れいはせきをたたなかった。ふたりとなら、ちんもくのきゅうけいもわるくないようだった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3022 | label | そばにいると答える | そばにいるとこたえる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3022 | response | 二人が頷くと、れいはそれ以上隠そうとしなかった。言葉は少なくても、確かな信頼がそこにあった。 | ふたりがうなずくと、れいはそれいじょうかくそうとしなかった。ことばれんくなくても、たしかなしんらいがそこにあった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3023 | label | 過去より今を見ると言う | かこよりいまをみるという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3023 | response | れいは長く沈黙したあと、感謝する、とだけ言った。その短い言葉に、彼女の本音が詰まっていた。 | れいはながくちんもくしたあと、かんしゃする、とだけいった。そのみじかいことばに、かのじょのほんねがつまっていた。 | Your careful choice helped someone and improved the situation. |
| src/data/magicRomanceDialogue.ts:3024 | label | 静かに一緒にいる | しずかにいっしょにいる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3024 | response | 何も聞かず隣にいると、れいの呼吸が少し落ち着いた。沈黙が、二人にとって一番優しい会話になった。 | なにもきかずとなりにいると、れいのこきゅうがすこしおちついた。ちんもくが、ふたりにとっていちばんやさしいかいわになった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3064 | label | 一緒に封印する | いっしょにふういんする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3064 | response | 二人が札に魔力を重ねると、れいは迷わず術式を開いた。守るだけではなく、信じて任せてくれた。 | ふたりがさつにまりょくをかさねると、れいはまよわずじゅつしきをひらいた。まもるだけではなく、しんじてまかせてくれた。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:3065 | label | 必ず戻ると伝える | かならずもどるとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3065 | response | 帰る約束に、れいは静かに頷いた。命令ではなく、自分の意思で二人の手を取った。 | かえるやくそくに、れいはしずかにうなずいた。めいれいではなく、じぶんのいしでふたりのてをとった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3066 | label | 結界の穴を探す | けっかいのあなをさがす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3066 | response | 二人の指摘に、れいは即座に動いた。短い連携だけで十分だった。二人は互いの判断を信じていた。 | ふたりのしてきに、れいはそくざにうごいた。みじかいれんけいだけでじゅうぶんだった。ふたりはたがいのはんだんをしんじていた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3106 | label | それでも隣を選ぶ | それでもとなりをえらぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3106 | response | 二人が手を取ると、れいは強く握り返した。言葉は少ないが、二度と離さない覚悟が伝わった。 | ふたりがてをとると、れいはつよくにぎりかえした。ことばれんくないが、にどとはなさないかくごがつたわった。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/data/magicRomanceDialogue.ts:3107 | label | 使命も一緒に背負う | しめいもいっしょにせおう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3107 | response | れいは首を横に振り、背負わせるのではなく共に歩くのだと言った。その訂正が、何より優しかった。 | れいはくびをよこにふり、せおいわせるのではなくともにあるくのだといった。そのていせいが、なによりやさしかった。 | The physical effort sharpened your rhythm and confidence. |
| src/data/magicRomanceDialogue.ts:3108 | label | 次の約束をする | つぎのやくそくをする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3108 | response | 次に会う日を決めると、れいは必ず時間を作ると言った。静かな約束が、卒業前夜に残った。 | つぎにあうひをきめると、れいはかならずじかんをつくるといった。しずかなやくそくが、そつぎょうぜんやにのこった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3150 | label | 一緒に装置を見る | いっしょにそうちをみる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3150 | response | 二人が隣に座ると、まどかの手の震えが少し止まった。失敗しないことより、一緒に直すことが大事になった。 | ふたりがとなりにすわると、まどかのてのふるえがすこしとまった。しっぱいしないことより、いっしょになおすことがだいじになった。 | The risky choice backfired and left you with a setback. |
| src/data/magicRomanceDialogue.ts:3151 | label | 焦らなくていいと言う | あセラなくていいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3151 | response | 二人の言葉に、まどかは深呼吸した。時間に追われる気持ちが、少しだけゆっくりになった。 | ふたりのことばに、まどかはしんこきゅうした。じかんにおわれるきもちが、すこしだけゆっくりになった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3152 | label | 記録を手伝う | きろくをてつだう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3152 | response | 二人で記録を取ると、まどかは嬉しそうにページを増やした。今日の失敗も、次へ進む材料になった。 | ふたりできろくをとると、まどかはうれしそうにぺーじをふやした。きょうのしっぱいも、つぎへすすむざいりょうになった。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:3192 | label | 記録の見方を教わる | きろくのみかたをおそわる | Seeing the situation from a new angle gave you a useful perspective. |
| src/data/magicRomanceDialogue.ts:3192 | response | まどかは少しずつ説明してくれた。二人が理解するたび、彼女の声に自信が戻っていった。 | まどかすこしずつせつめいしてくれた。ふたりがりかいするたび、かのじょのこえにじしんがもどっていった。 | little by little. understanding, voice. |
| src/data/magicRomanceDialogue.ts:3193 | label | 自分の失敗も話す | じぶんのしっぱいもはなす | Putting things into words helped clarify your thoughts and steady your mood. |
| src/data/magicRomanceDialogue.ts:3193 | response | 二人の失敗談に、まどかは驚いてから笑った。失敗しても一緒なら前に進めると、二人で確かめた。 | ふたりのしっぱいだんに、まどかはおどろいてからわらった。しっぱいしてもいっしょならまえにすすめると、ふたりでたしかめた。 | The risky choice backfired and left you with a setback. |
| src/data/magicRomanceDialogue.ts:3194 | label | 休憩を入れる | きゅうけいをいれる | Take a Break |
| src/data/magicRomanceDialogue.ts:3194 | response | 休憩を提案すると、まどかはタイマーを止めた。この時間、消したくないです、と小さく言った。 | きゅうけいをていあんすると、まどかはたいまーをとめた。このじかん、けしたくないです、とちいさくいった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3234 | label | 消さなくていいと伝える | けさなくていいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3234 | response | 二人がそう言うと、まどかは記録を閉じた。失敗も今も、二人で持っていける気がした。 | ふたりがそういうと、まどかはきろくをとじた。しっぱいもいまも、ふたりでもっていけるきがした。 | The risky choice backfired and left you with a setback. |
| src/data/magicRomanceDialogue.ts:3235 | label | 怖さを聞く | こわさをきく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3235 | response | まどかは失敗が怖いと正直に話した。二人が聞き続けることで、彼女は少しずつ前を向いた。 | まどかはしっぱいがこわいとしょうじきにはなした。ふたりがききつづけることで、かのじょすこしずつまえをむいた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3236 | label | 思い出を残す | おもいでをのこす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3236 | response | 二人で今日のことを書き残した。まどかはページの端に、小さく「大切」と記した。 | ふたりできょうのことをかきのこした。まどかはぺーじのはじに、ちいさく「たいせつ」としるした。 | The two of them wrote down what happened today. In the corner of the page, Madoka quietly wrote, "precious." |
| src/data/magicRomanceDialogue.ts:3276 | label | 今のまどかを信じる | いまのまどかをしんじる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3276 | response | 二人が手を伸ばすと、まどかは装置を止める決断をした。失敗を恐れるより、今を守ることを選んだ。 | ふたりがてをのばすと、まどかはそうちをやめるけつだんをした。しっぱいをおそれるより、いまをまもることをえらんだ。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:3277 | label | 必ず一緒に抜け出す | かならずいっしょにぬけだす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3277 | response | 約束に、まどかは涙をこらえて頷いた。何度戻っても、二人の声だけは道しるべになった。 | やくそくに、まどかはなみだをこらえてうなずいた。なんどもどっても、ふたりのこえだけはみちしるべになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3278 | label | 装置の手順を確認する | そうちのてじゅんをかくにんする | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:3278 | response | 二人で手順を読み上げ、暴走の原因を見つけた。まどかはもう一人で抱え込まなかった。 | ふたりでてじゅんをよみあげ、ぼうそうのげんいんをみつけた。まどかはもうひとりでかかえこまなかった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:3318 | label | 予定を一緒に作る | よていをいっしょにつくる | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:3318 | response | まどかは照れながら予定帳を開いた。最初の一行に二人の名前を書き、嬉しそうに笑った。 | まどかはてれながらよていちょうをひらいた。さいしょのいちぎょうにふたりのなまえをかき、うれしそうにわらった。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:3319 | label | 使命も恋も選ぶ | しめいもこいもえらぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3319 | response | 二人は巻き戻せない未来を選んだ。まどかは失敗しても一緒なら大丈夫だと、初めて強く言った。 | ふたりはまきもどせないみらいをえらんだ。まどかはしっぱいしてもいっしょならだいじょうぶだと、はじめてつよくいった。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:3320 | label | 明日の約束をする | あしたのやくそくをする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3320 | response | 明日の約束を記録したあと、まどかはそのページを大切に閉じた。この時間は消さないと決めた。 | あしたのやくそくをきろくしたあと、まどかはそのぺーじをたいせつにとじた。このじかんはけさないときめた。 | The study moment clarified what you needed to understand next. |
| src/data/magicRomanceDialogue.ts:3362 | label | 隣に立つ | となりにたつ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3362 | response | 二人が隣に立つと、こはるは穏やかに笑った。近づきすぎず、でも離れない距離が心地よかった。 | ふたりがとなりにたつと、こはるはおだやかにわらった。ちかづきすぎず、でもはなれないきょりがここちよかった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:3363 | label | 風の話を聞く | かぜのはなしをきく | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3363 | response | こはるはゆっくりと言葉を選んだ。守るために離れることもあると知り、二人はその優しさを受け止めた。 | こはるはゆっくりとことばをえらんだ。まもるためにはなれることもあるとしり、ふたりはそのやさしさをうけとめた。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:3364 | label | 一緒に見回る | いっしょにみまわる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3364 | response | 二人で屋上を歩くと、こはるの表情が少し明るくなった。守る場所を一緒に見る時間になった。 | ふたりでおくじょうをあるくと、こはるのひょうじょうがすこしあかるくなった。まもるばしょをいっしょにみるじかんになった。 | the rooftop, a little. protect look time. |
| src/data/magicRomanceDialogue.ts:3404 | label | 育て方を教えてもらう | そだてほうをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3404 | response | こはるは水の量から風の通し方まで丁寧に教えた。静かな声が、温室の空気に溶けていった。 | こはるはみずのりょうからかぜのとうしほうまでていねいにおしえた。しずかなこえが、おんしつのくうきにとけていった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3405 | label | 自分の迷いを話す | じぶんのまよいをはなす | Putting things into words helped clarify your thoughts and steady your mood. |
| src/data/magicRomanceDialogue.ts:3405 | response | 二人が迷いを話すと、こはるは遮らず聞いた。風みたいに受け止める優しさがあった。 | ふたりがまよいをはなすと、こはるはさえぎらずきいた。かぜみたいにうけやめるやさしさがあった。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3406 | label | 休憩しようと誘う | きゅうけいしようとさそう | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3406 | response | 休憩を提案すると、こはるは少し驚いてから頷いた。守る人にも休む時間が必要だと、二人で確かめた。 | きゅうけいをていあんすると、こはるはすこしおどろいてからうなずいた。まもるひとにもやすむじかんがひつようだと、ふたりでたしかめた。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3446 | label | 同じ場所に立ちたいと言う | おなじばしょにたちたいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3446 | response | 二人の言葉に、こはるは静かに目を見開いた。今度は同じ場所に立ちたいと、彼女も言ってくれた。 | ふたりのことばに、こはるはしずかにめをみひらいた。こんどはおなじばしょにたちたいと、かのじょもいってくれた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3447 | label | 無理に近づかなくていいと言う | むりにちかづかなくていいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3447 | response | 急がない言葉に、こはるは安心したように笑った。離れないために、ゆっくり近づく時間になった。 | いそがないことばに、こはるはあんしんしたようにわらった。はなれないために、ゆっくりちかづくじかんになった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:3448 | label | 風の音を一緒に聞く | かぜのおとをいっしょにきく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3448 | response | 二人で黙って風を聞いた。言葉にしなくても伝わるものがあると、こはるはそっと手を伸ばした。 | ふたりでだまってかぜをきいた。ことばにしなくてもつたわるものがあると、こはるはそっとてをのばした。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3488 | label | 隣で結界を支える | となりでけっかいをささえる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3488 | response | 二人が隣に立つと、こはるの風は穏やかさを取り戻した。守るために離れるのではなく、並んで守る力になった。 | ふたりがとなりにたつと、こはるのかぜはおだやかさをとりもどした。まもるためにはなれるのではなく、ならんでまもるちからになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3489 | label | 必ず戻ると約束する | かならずもどるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3489 | response | 約束を聞いたこはるは強く頷いた。帰る場所を守るために、二人は前へ進んだ。 | やくそくをきいたこはるはつよくうなずいた。かえるばしょをまもるために、ふたりはまえへすすんだ。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:3490 | label | 風の流れを読む | かぜのながれをよむ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3490 | response | 二人で風の通り道を見つけ、結界の裂け目を塞いだ。こはるは相手の判断を信じて任せた。 | ふたりでかぜのとおりみちをみつけ、けっかいのさけめをふさいだ。こはるはあいてのはんだんをしんじてまかせた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3530 | label | 二人の場所を作ると約束する | ふたりのばしょをつくるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3530 | response | こはるは二人の手をそっと握った。どこへ行っても戻れる場所を、二人で育てる約束になった。 | こはるはふたりのてをそっとにぎった。どこへいってももどれるばしょを、ふたりでそだてるやくそくになった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3531 | label | 使命と日常を守る | しめいとにちじょうをまもる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3531 | response | 二人は精霊樹の前で頷き合った。戦いの先にも、穏やかな風が吹く未来を選んだ。 | ふたりはせいれいきのまえでがんきあった。たたかいのさきにも、おだやかなかぜがふくみらいをえらんだ。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:3532 | label | 次に会う日を決める | つぎにあうひをきめる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3532 | response | 次の約束を決めると、こはるは嬉しそうに笑った。風がその言葉を遠くまで運んでいくようだった。 | つぎのやくそくをきめると、こはるはうれしそうにわらった。かぜがそのことばをとおくまではこんでいくようだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3574 | label | 見ていると伝える | みているとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3574 | response | 二人が頷くと、みらいの笑顔が少し本物に近づいた。観客ではなく、支えとして見てほしいようだった。 | ふたりがうなずくと、みらいのえがおがすこしほんものにちかづいた。かんきゃくではなく、ささえとしてみてほしいようだった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3575 | label | 無理していないか聞く | むりしていないかきく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3575 | response | みらいは一瞬だけ言葉を止めた。平気よ、と笑ったが、その声は少しだけ揺れていた。 | みらいはいっしゅんだけことばをとめた。へいきよ、とわらったが、そのこえすこしだけゆれていた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3576 | label | 一緒に準備する | いっしょにじゅんびする | Turning the situation into a plan made the next step easier to take. |
| src/data/magicRomanceDialogue.ts:3576 | response | 二人で小道具を整えると、みらいは嬉しそうに鼻歌を歌った。舞台裏の時間が、少し特別になった。 | ふたりでこどうぐをととのえると、みらいはうれしそうにはなうたをうたった。ぶたいうらのじかんが、すこしとくべつになった。 | Tidying things up also helped clear your mind for the next step. |
| src/data/magicRomanceDialogue.ts:3616 | label | 努力を認める | どりょくをみとめる | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:3616 | response | 二人が素直に褒めると、みらいは照れ隠しにお辞儀をした。華やかな姿の裏にある真剣さを見せてくれた。 | ふたりがすなおにほめると、みらいはてれかくしにおじぎをした。はなやかなすがたのうらにあるしんけんさをみせてくれた。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:3617 | label | 自分の弱さも話す | じぶんのよわさもはなす | You Weak |
| src/data/magicRomanceDialogue.ts:3617 | response | 弱音を話すと、みらいは演技ではない顔で聞いた。舞台裏なら、二人とも少しだけ素直になれた。 | よわねをはなすと、みらいはえんぎではないかおできいた。ぶたいうらなら、ふたりともすこしだけすなおになれた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3618 | label | 休憩に誘う | きゅうけいにさそう | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3618 | response | 休憩を提案すると、みらいは大げさに笑ってから隣に座った。明るい声の奥に、安心した息が混じっていた。 | きゅうけいをていあんすると、みらいはおおげさにわらってからとなりにすわった。あかるいこえのおくに、あんしんしたいきがまじっていた。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3658 | label | そのままでいいと言う | そのままでいいという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3658 | response | 二人の言葉に、みらいは静かに笑った。拍手のない場所で見せる表情が、二人だけの秘密になった。 | ふたりのことばに、みらいはしずかにわらった。はくしゅのないばしょでみせるひょうじょうが、ふたりだけのひみつになった。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:3659 | label | 寂しさを聞く | さびしさをきく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3659 | response | みらいは少し迷ってから、明るくしていないと不安になると話した。二人はその言葉を最後まで受け止めた。 | みらいすこしまよってから、あかるくしていないとふあんになるとはなした。ふたりはそのことばをさいごまでうけとめた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3660 | label | 思い出を残す | おもいでをのこす | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3660 | response | 鏡越しに小さな写真を撮ると、みらいは演技ではない笑顔を見せた。舞台裏の一枚を、大切にしまった。 | かがみごしにちいさなしゃしんをとると、みらいはえんぎではないえがおをみせた。ぶたいうらのいちまいを、たいせつにしまった。 | The strange school scene offered a choice with real consequences. |
| src/data/magicRomanceDialogue.ts:3700 | label | 一緒に舞台へ立つ | いっしょにぶたいへたつ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3700 | response | 二人が隣に立つと、みらいはもう一度笑った。作り物ではない笑顔が、悪夢の幕を切り裂いた。 | ふたりがとなりにたつと、みらいはもういちどわらった。つくりものではないえがおが、あくむのまくをきりさいた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3701 | label | 必ず朝まで行くと誓う | かならずあさまでいくとちかう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3701 | response | 約束の言葉に、みらいは震える手を伸ばした。二人の手を取った瞬間、舞台に光が戻った。 | やくそくのことばに、みらいはふるえるてをのばした。ふたりのてをとったしゅんかん、ぶたいにひかりがもどった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3702 | label | 演出を変える | えんしゅつをかえる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3702 | response | 二人で結界の流れを読み替えると、みらいは即興で応えた。悪夢は、二人の物語に書き換えられていった。 | ふたりでけっかいのながれをよみかえると、みらいはそっきょうでこたえた。あくむは、ふたりのものがたりにかきかえられていった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3742 | label | 隣にいたいと伝える | となりにいたいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3742 | response | 二人が手を取ると、みらいは演技ではない笑顔で頷いた。舞台が終わっても、二人の時間は続いていく。 | ふたりがてをとると、みらいはえんぎではないえがおでうなずいた。ぶたいがおわっても、ふたりのじかんはつづいていく。 | You refined what you learned and turned it into a practical advantage. |
| src/data/magicRomanceDialogue.ts:3743 | label | 使命も恋も演じきると言う | しめいもこいもえんじきるという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3743 | response | みらいは華やかに笑い、でも目は真剣だった。どんな場面も二人で越えると約束した。 | みらいははなやかにわらい、でもめはしんけんだった。どんなばめんもふたりでこえるとやくそくした。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3744 | label | 次の約束をする | つぎのやくそくをする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3744 | response | 次に会う日を決めると、みらいはそれをアンコールと呼んだ。拍手より嬉しい約束だった。 | つぎにあうひをきめると、みらいはそれをあんこーるとよんだ。はくしゅよりうれしいやくそくだった。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicRomanceDialogue.ts:3786 | label | 一緒に案内する | いっしょにあんないする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3786 | response | 二人が案内を申し出ると、セラは丁寧に礼をした。何気ない廊下さえ、彼女には新しい発見だった。 | ふたりがあんないをもうしでると、セラはていねいにれいをした。なにげないろうかさえ、かのじょにはあたらしいはっけんだった。 | You noticed the opening and turned it into an advantage. |
| src/data/magicRomanceDialogue.ts:3787 | label | 不安はないか聞く | ふあんはないかきく | The mishap left a mark and cost you momentum. |
| src/data/magicRomanceDialogue.ts:3787 | response | セラは少し考えて、不安もありますと正直に答えた。それでも希望を信じたいという声は、まっすぐだった。 | セラすこしかんがえて、ふあんもありますとしょうじきにこたえた。それでもきぼうをしんじたいというこえは、まっすぐだった。 | Putting things into words helped clarify your thoughts and steady your mood. |
| src/data/magicRomanceDialogue.ts:3788 | label | 一緒に学ぶ | いっしょにまなぶ | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3788 | response | 二人で教材を開くと、セラは一つずつ丁寧に質問した。学ぶたびに、この世界が近くなっていった。 | ふたりできょうざいをひらくと、セラはひとつずつていねいにしつもんした。まなぶたびに、このせかいがちかくなっていった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3828 | label | 星界の言葉を教えてもらう | せいかいのことばをおしえてもらう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3828 | response | セラは丁寧に発音を教えた。二人が真似ると、嬉しそうに何度も頷いてくれた。 | セラはていねいにはつおんをおしえた。ふたりがまねると、うれしそうになんどもうなずいてくれた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3829 | label | 自分の苦手も見せる | じぶんのにがてもみせる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3829 | response | 間違えても、セラは優しく直してくれた。学び合う時間が、二人の距離を自然に近づけた。 | まちがえても、セラはやさしくなおしてくれた。まなびあうじかんが、ふたりのきょりをしぜんにちかづけた。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3830 | label | 休憩して日常を教える | きゅうけいしてにちじょうをおしえる | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3830 | response | 購買の飲み物を教えると、セラは目を輝かせた。この世界の普通が、彼女には宝物のようだった。 | こうばいののみものをおしえると、セラはめをかがやかせた。このせかいのふつうが、かのじょにはたからもののようだった。 | The short break helped your body and mind recover. |
| src/data/magicRomanceDialogue.ts:3870 | label | ここにも居場所があると言う | ここにもいばしょがあるという | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3870 | response | 二人の言葉に、セラは胸元を押さえた。二つの世界を大切にしていいのだと、少し安心したようだった。 | ふたりのことばに、セラはむなもとをおさえた。ふたつのせかいをたいせつにしていいのだと、すこしあんしんしたようだった。 | Facing the feeling directly helped your mind settle. |
| src/data/magicRomanceDialogue.ts:3871 | label | 寂しさを聞く | さびしさをきく | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3871 | response | セラは静かに故郷の話をした。知らない世界で笑っていられるのは、二人がいるからだと打ち明けた。 | セラはしずかにこきょうのはなしをした。しらないせかいでわらっていられるのは、ふたりがいるからだとうちあけた。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3872 | label | 思い出を記録する | おもいでをきろくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3872 | response | 二人で星の光を記録した。セラは任務の記録ではなく、個人的な思い出として残したいと言った。 | ふたりでほしのひかりをきろくした。セラはにんむのきろくではなく、こじんてきなおもいでとしてのこしたいといった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3912 | label | 一緒に扉を閉じる | いっしょにとびらをとじる | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3912 | response | 二人が光に手を伸ばすと、セラの祈りが強くなった。二人で作る道が、世界の境界を静かに結んだ。 | ふたりがひかりにてをのばすと、セラのいのりがつよくなった。ふたりでつくるみちが、せかいのきょうかいをしずかにむすんだ。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicRomanceDialogue.ts:3913 | label | 必ず戻ると約束する | かならずもどるとやくそくする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3913 | response | 約束を聞いたセラは涙を浮かべて微笑んだ。希望を信じる声が、礼拝堂に澄んで響いた。 | やくそくをきいたセラはなみだをうかべてほほえんだ。きぼうをしんじるこえが、れいはいどうにすんでひびいた。 | Your careful choice helped someone and improved the situation. |
| src/data/magicRomanceDialogue.ts:3914 | label | 光の流れを整える | ひかりのながれをととのえる | Reviewing the plan made the next steps clearer and your movements smoother. |
| src/data/magicRomanceDialogue.ts:3914 | response | 二人で光の向きを変えると、暴走は収まっていった。セラはこの世界で学んだことが力になったと話した。 | ふたりでひかりのむきをかえると、ぼうそうはおさまっていった。セラはこのせかいでまなんだことがちからになったとはなした。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3954 | label | 隣にいてほしいと伝える | となりにいてほしいとつたえる | The exchange with others changed the mood and opened a way forward. |
| src/data/magicRomanceDialogue.ts:3954 | response | 二人の言葉に、セラは両手を重ねて頷いた。礼儀正しい仕草の奥に、まっすぐな恋があった。 | ふたりのことばに、セラはりょうてをおもねてうなずいた。れいぎただしいしぐさのおくに、まっすぐなこいがあった。 | Your careful choice helped someone and improved the situation. |
| src/data/magicRomanceDialogue.ts:3955 | label | 二つの世界をつなぐと誓う | ふたつのせかいをつなぐとちかう | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3955 | response | セラは希望を信じると言った。二人となら、帰る場所を一つに決めなくてもいいと笑った。 | セラはきぼうをしんじるといった。ふたりとなら、かえるばしょをひとつにきめなくてもいいとわらった。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3956 | label | 次の約束をする | つぎのやくそくをする | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:3956 | response | 次に会う日を決めると、セラはその約束を光の記録に残した。任務ではなく、願いとして。 | つぎにあうひをきめると、セラはそのやくそくをひかりのきろくにのこした。にんむではなく、ねがいとして。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:4165 | title | あかりとあかりの、その先 | あかりとあかりの、そのさき | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:4166 | description | 二つの願いが奇跡を起こした。彼は自分から彼女の手を取り、恋と使命を共に選ぶ未来へ歩き出す。 | ふたつのねがいがきせきをおこした。かれはじぶんからかのじょのてをとり、こいとしめいをともにえらぶみらいへあるきだす。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicRomanceDialogue.ts:4219 | title | あかりとあかりの、その先 | あかりとあかりの、そのさき | You handled the moment and carried its outcome into what came next. |

### 友情ルート（170行）

#### 星と月の作戦会議（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:20 | title | 星と月の作戦会議 | ほしとがつのさくせんかいぎ | Star and Moon Strategy Meeting |
| src/data/magicFriendshipRoutes.ts:22 | eventTitle | 夜の教室、二人だけの星図 | よるのきょうしつ、ふたりだけのせいず | A Star Map for Two in the Night Classroom |
| src/data/magicFriendshipRoutes.ts:23 | eventSummary | あかりの直感を、しずくが月の計算で支える。二人は敵の結界図を読み解き、次の戦いへ進む。 | あかりのちょっかんを、しずくががつのけいさんでささえる。ふたりはてきのけっかいずをよみとき、つぎのたたかいへすすむ。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:25 | endingTitle | 星月同盟エンド | ほしづきどうめいえんど | Star-Moon Alliance Ending |
| src/data/magicFriendshipRoutes.ts:26 | endingText | 卒業後も、あかりは最初に走り出し、しずくは隣で道を照らした。二人の作戦ノートには、失敗も勝利も同じくらい大切な思い出として残っている。 | そつぎょうごも、あかりはさいしょにはしりだし、しずくはとなりでみちをてらした。ふたりのさくせんのーとには、しっぱいもしょうりもおなじくらいたいせつなおもいでとしてのこっている。 | The study moment clarified what you needed to understand next. |

#### 星火の突撃コンビ（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:33 | title | 星火の突撃コンビ | ほしひのとつげきこんび | Starfire Charge Duo |
| src/data/magicFriendshipRoutes.ts:35 | eventTitle | 訓練場の流星スパーリング | くんれんばのりゅうせいすぱーりんぐ | Meteor Sparring at the Training Ground |
| src/data/magicFriendshipRoutes.ts:36 | eventSummary | つばさの炎をあかりの星光が導き、二人は正面突破の連携技を完成させる。 | つばさのほのおをあかりのせいこうがみちびき、ふたりはしょうめんとっぱのれんけいわざをかんせいさせる。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicFriendshipRoutes.ts:38 | endingTitle | 流星ブレイブエンド | りゅうせいぶれいぶえんど | Meteor Brave Ending |
| src/data/magicFriendshipRoutes.ts:39 | endingText | どんな強敵の前でも、二人は顔を見合わせて笑った。怖さを勇気に変える合図は、卒業しても変わらない。 | どんなきょうてきのまえでも、ふたりはかおをみあわせてわらった。こわさをゆうきにかえるあいずは、そつぎょうしてもかわらない。 | You handled the moment and carried its outcome into what came next. |

#### 月が選んだ一番星（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:46 | title | 月が選んだ一番星 | がつがえらんだいちばんほし | The First Star Chosen by the Moon |
| src/data/magicFriendshipRoutes.ts:48 | eventTitle | 月鏡に映るリーダーの背中 | がつかがみにうつるりーだーのせなか | The Leader's Back Reflected in the Moon Mirror |
| src/data/magicFriendshipRoutes.ts:49 | eventSummary | しずくは計算だけでは届かない答えを、あかりのまっすぐな行動から学ぶ。 | しずくはけいさんだけではとどかないこたえを、あかりのまっすぐなこうどうからまなぶ。 | You noticed the opening and turned it into an advantage. |
| src/data/magicFriendshipRoutes.ts:51 | endingTitle | ルナスターエンド | ルナスターエンド | Lunar Star Ending |
| src/data/magicFriendshipRoutes.ts:52 | endingText | しずくの予定表には、あかりと寄り道する時間が最初から書き込まれるようになった。予測不能な日々こそ、二人の宝物になった。 | しずくのよていひょうには、あかりとよりみちするじかんがさいしょからかきこまれるようになった。よそくふのうなひびこそ、ふたりのたからものになった。 | Turning the situation into a plan made the next step easier to take. |

#### 月時計の研究室（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:59 | title | 月時計の研究室 | がつとけいのけんきゅうしつ | Moon Clock Laboratory |
| src/data/magicFriendshipRoutes.ts:61 | eventTitle | 壊れた時計塔の共同解析 | こわれたとけいとうのきょうどうかいせき | Joint Analysis of the Broken Clock Tower |
| src/data/magicFriendshipRoutes.ts:62 | eventSummary | しずくの観測とまどかの時間装置が合わさり、二人は未来を固定しない答えを選ぶ。 | しずくのかんそくとまどかのじかんそうちがあわさり、ふたりはみらいをこていしないこたえをえらぶ。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:64 | endingTitle | クロノミラーエンド | クロノミラーエンド | Chrono Mirror Ending |
| src/data/magicFriendshipRoutes.ts:65 | endingText | 研究ノートの最後には、必ず二人分の署名があった。未知の時間も、二人なら怖くない。 | けんきゅうのーとのさいごには、かならずふたりぶんのしょめいがあった。みちのじかんも、ふたりならこわくない。 | The study moment clarified what you needed to understand next. |

#### 花風の癒やし庭園（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:72 | title | 花風の癒やし庭園 | はなふうのいやしていえん | Healing Garden of Flowers and Wind |
| src/data/magicFriendshipRoutes.ts:74 | eventTitle | 精霊樹の下で聞く本音 | せいれいきのしたできくほんね | True Feelings Beneath the Spirit Tree |
| src/data/magicFriendshipRoutes.ts:75 | eventSummary | ひよりが痛みを受け止め、こはるが風で重さをほどく。二人は守るだけではない強さを知る。 | ひよりがいたみをうけとめ、こはるがかぜでおもさをほどく。ふたりはまもるだけではないつよさをしる。 | The risky choice backfired and left you with a setback. |
| src/data/magicFriendshipRoutes.ts:77 | endingTitle | ブルームゲイルエンド | ブルームゲイルエンド | Bloom Gale Ending |
| src/data/magicFriendshipRoutes.ts:78 | endingText | 二人が育てた庭には、傷ついた誰もが休める風が吹く。優しさは逃げ道ではなく、明日へ向かう力になった。 | ふたりがそだてたにわには、きずついただれもがやすめるかぜがふく。やさしさはにげみちではなく、あしたへむかうちからになった。 | You took a moment to recover and regain your rhythm. |

#### 命花と星界の祈り（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:85 | title | 命花と星界の祈り | いのちはなとせいかいのいのり | Life Flowers and Celestial Prayers |
| src/data/magicFriendshipRoutes.ts:87 | eventTitle | 保健室に降る星の光 | ほけんしつにふるほしのひかり | Starlight Falling in the Infirmary |
| src/data/magicFriendshipRoutes.ts:88 | eventSummary | セラが異世界の光を分け、ひよりが学園の傷を癒やす。二人は互いの孤独に気づく。 | セラがいせかいのひかりをわけ、ひよりががくえんのきずをいやす。ふたりはたがいのこどくにきづく。 | You took a moment to recover and regain your rhythm. |
| src/data/magicFriendshipRoutes.ts:90 | endingTitle | ホーリーブルームエンド | ホーリーブルームエンド | Holy Bloom Ending |
| src/data/magicFriendshipRoutes.ts:91 | endingText | どちらの世界にも、帰る場所は一つではない。二人の祈りは、誰かの夜を明るくする花になった。 | どちらのせかいにも、かえるばしょはひとつではない。ふたりのいのりは、だれかのよるをあかるくするはなになった。 | You handled the moment and carried its outcome into what came next. |

#### 炎星ライバル宣言（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:98 | title | 炎星ライバル宣言 | ほのおほしらいばるせんげん | Fire-Star Rival Declaration |
| src/data/magicFriendshipRoutes.ts:100 | eventTitle | 流星ハンマー特訓 | りゅうせいはんまーとっくん | Meteor Hammer Special Training |
| src/data/magicFriendshipRoutes.ts:101 | eventSummary | つばさはあかりの明るさに背中を押され、守るための炎をまっすぐ振るう。 | つばさはあかりのあかるさにせなかをおされ、まもるためのほのおをまっすぐふるう。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:103 | endingTitle | ブレイズスターエンド | ブレイズスターエンド | Blaze Star Ending |
| src/data/magicFriendshipRoutes.ts:104 | endingText | 二人の勝負は卒業しても終わらない。昨日より強く、昨日より笑える自分になるために。 | ふたりのしょうぶはそつぎょうしてもおわらない。きのうよりつよく、きのうよりわらえるじぶんになるために。 | The experience strengthened your resolve and helped you grow. |

#### 炎と影札の約束（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:111 | title | 炎と影札の約束 | ほのおとかげさつのやくそく | Promise of Flame and Shadow Cards |
| src/data/magicFriendshipRoutes.ts:113 | eventTitle | 封印廊下の背中合わせ | ふういんろうかのせなかあわせ | Back to Back in the Sealed Corridor |
| src/data/magicFriendshipRoutes.ts:114 | eventSummary | つばさの突破力を、れいの結界が支える。反発していた二人は互いの覚悟を認める。 | つばさのとっぱりょくを、れいのけっかいがささえる。はんぱつしていたふたりはたがいのかくごをみとめる。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicFriendshipRoutes.ts:116 | endingTitle | シャドウフォージエンド | シャドウフォージエンド | Shadow Forge Ending |
| src/data/magicFriendshipRoutes.ts:117 | endingText | 荒い炎と静かな影は、誰よりも相性のいい盾と剣になった。言葉は少なくても、背中はいつも預けられる。 | あらいほのおとしずかなかげは、だれよりもあいしょうのいいたてとつるぎになった。ことばれんくなくても、せなかはいつもあずけられる。 | You handled the moment and carried its outcome into what came next. |

#### 影を照らす炎（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:124 | title | 影を照らす炎 | かげをてらすほのお | Flames That Light the Shadows |
| src/data/magicFriendshipRoutes.ts:126 | eventTitle | 禁術印を砕く火花 | きんじゅついんをくだくひばな | Sparks That Break Forbidden Seals |
| src/data/magicFriendshipRoutes.ts:127 | eventSummary | れいはつばさの真っ直ぐな炎に救われ、禁術の重さを一人で抱えないと決める。 | れいはつばさのまっすぐぐなほのおにすくわれ、きんじゅつのおもさをひとりでかかえないときめる。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:129 | endingTitle | クリムゾンブレイズエンド | クリムゾンブレイズエンド | Crimson Blaze Ending |
| src/data/magicFriendshipRoutes.ts:130 | endingText | れいが沈黙した時、つばさは遠慮なく扉を叩いた。孤独を破る音は、いつも少し乱暴で温かい。 | れいがちんもくしたとき、つばさはえんりょなくとびらをたたいた。こどくをやぶるおとは、いつもすこしらんぼうであたたかい。 | The short break helped your body and mind recover. |

#### 闇符と星界記録（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:137 | title | 闇符と星界記録 | やみふとせいかいきろく | Dark Talismans and Celestial Records |
| src/data/magicFriendshipRoutes.ts:139 | eventTitle | 深淵図書館の封印解除 | しんえんとしょかんのふういんかいじょ | Unsealing the Abyss Library |
| src/data/magicFriendshipRoutes.ts:140 | eventSummary | セラはれいの過去を否定せず、れいはセラの希望を守るために闇を使う。 | セラはれいのかこをひていせず、れいはセラのきぼうをまもるためにやみをつかう。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:142 | endingTitle | ノクターンライトエンド | ノクターンライトエンド | Nocturne Light Ending |
| src/data/magicFriendshipRoutes.ts:143 | endingText | 闇は消すものではなく、光を見失わないための輪郭になった。二人は記録に残らない救いを積み重ねた。 | やみはけすものではなく、ひかりをけんうしなわないためのりんかくになった。ふたりはきろくにのこらないすくいをつみかさねた。 | You handled the moment and carried its outcome into what came next. |

#### 時環と月鏡の証明（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:150 | title | 時環と月鏡の証明 | ときかんとがつかがみのしょうめい | Proof of Time Rings and Moon Mirrors |
| src/data/magicFriendshipRoutes.ts:152 | eventTitle | 失敗記録の再計算 | しっぱいきろくのさいけいさん | Recalculating the Failure Records |
| src/data/magicFriendshipRoutes.ts:153 | eventSummary | まどかはしずくと失敗記録を見直し、過去を消すのではなく次へ活かす勇気を得る。 | まどかはしずくとしっぱいきろくをみなおし、かこをけすのではなくつぎへいかすゆうきをえる。 | The risky choice backfired and left you with a setback. |
| src/data/magicFriendshipRoutes.ts:155 | endingTitle | タイムミラーエンド | タイムミラーエンド | Time Mirror Ending |
| src/data/magicFriendshipRoutes.ts:156 | endingText | 間違えたページにも付箋を貼って、二人は笑った。失敗を隠さない研究室には、未来へ進む音がした。 | まちがえたぺーじにもふせんをはって、ふたりはわらった。しっぱいをかくさないけんきゅうしつには、みらいへすすむおとがした。 | The study moment clarified what you needed to understand next. |

#### 夢時計アンコール（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:163 | title | 夢時計アンコール | ゆめとけいあんこーる | Dream Clock Encore |
| src/data/magicFriendshipRoutes.ts:165 | eventTitle | 止まった舞台の時間修復 | とまったぶたいのじかんしゅうふく | Repairing Time on the Frozen Stage |
| src/data/magicFriendshipRoutes.ts:166 | eventSummary | みらいの舞台を、まどかの時間魔法が支える。二人は失敗した本番を最高の再演に変える。 | みらいのぶたいを、まどかのじかんまほうがささえる。ふたりはしっぱいしたほんばんをさいこうのさいえんにかえる。 | The risky choice backfired and left you with a setback. |
| src/data/magicFriendshipRoutes.ts:168 | endingTitle | クロノステージエンド | クロノステージエンド | Chrono Stage Ending |
| src/data/magicFriendshipRoutes.ts:169 | endingText | 幕が下りても、二人の挑戦は続く。観客の拍手より先に、互いの「大丈夫」が聞こえるから。 | まくがくだりても、ふたりのちょうせんはつづく。かんきゃくのはくしゅよりさきに、たがいの「だいじょうぶ」がきこえるから。 | Your effort was recognized and turned into a stronger result. |

#### 風が運ぶ花の声（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:176 | title | 風が運ぶ花の声 | かぜがはこぶはなのこえ | The Flower Voice Carried by the Wind |
| src/data/magicFriendshipRoutes.ts:178 | eventTitle | 中庭の結界花壇 | なかにわのけっかいかだん | Barrier Flowerbed in the Courtyard |
| src/data/magicFriendshipRoutes.ts:179 | eventSummary | こはるはひよりの優しさに触れ、守るだけでなく頼ることも強さだと知る。 | こはるはひよりのやさしさにふれ、まもるだけでなくたよることもつよさだとしる。 | The experience strengthened your resolve and helped you grow. |
| src/data/magicFriendshipRoutes.ts:181 | endingTitle | ゲイルブルームエンド | ゲイルブルームエンド | Gale Bloom Ending |
| src/data/magicFriendshipRoutes.ts:182 | endingText | 風が強い日も、花は折れずに揺れる。二人は互いの弱さを知っているから、誰よりも強く立てた。 | かぜがつよいひも、はなはおれずにゆれる。ふたりはたがいのよわさをしっているから、だれよりもつよくたてた。 | The experience strengthened your resolve and helped you grow. |

#### 翠嵐と星界の道標（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:189 | title | 翠嵐と星界の道標 | すいらんとせいかいのどうひょう | Emerald Gale and the Celestial Signpost |
| src/data/magicFriendshipRoutes.ts:191 | eventTitle | 精霊樹に降りる星図 | せいれいきにおりるせいず | A Star Chart Descending on the Spirit Tree |
| src/data/magicFriendshipRoutes.ts:192 | eventSummary | こはるが学園の根を守り、セラが星界の道を示す。二人は世界をつなぐ守護者になる。 | こはるががくえんのねをまもり、セラがせいかいのみちをしめす。ふたりはせかいをつなぐしゅごしゃになる。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:194 | endingTitle | ワールドツリーライトエンド | ワールドツリーライトエンド | World Tree Light Ending |
| src/data/magicFriendshipRoutes.ts:195 | endingText | 精霊樹の枝には、星界へ続く小さな光が宿った。二人が守る場所は、もう一つの世界にも届いている。 | せいれいきのえだには、せいかいへつづくちいさなひかりがやどった。ふたりがまもるばしょは、もうひとつのせかいにもとどいている。 | You noticed the opening and turned it into an advantage. |

#### 夢幻舞台の調律師（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:202 | title | 夢幻舞台の調律師 | むげんぶたいのちょうりつし | Tuner of the Dream Stage |
| src/data/magicFriendshipRoutes.ts:204 | eventTitle | 悪夢のリハーサル | あくむのりはーさる | Nightmare Rehearsal |
| src/data/magicFriendshipRoutes.ts:205 | eventSummary | みらいが隠した不安を、まどかは丁寧に観測する。二人は悪夢を演出ではなく本音で越える。 | みらいがかくしたふあんを、まどかはていねいにかんそくする。ふたりはあくむをえんしゅつではなくほんねでこえる。 | You noticed the opening and turned it into an advantage. |
| src/data/magicFriendshipRoutes.ts:207 | endingTitle | ドリームクロックエンド | ドリームクロックエンド | Dream Clock Ending |
| src/data/magicFriendshipRoutes.ts:208 | endingText | 舞台袖には、まどかが直した小さな時計がある。みらいは本番前、それを見て本当の笑顔を思い出す。 | ぶたいそでには、まどかがなおしたちいさなとけいがある。みらいはほんばんまえ、それをみてほんとうのえがおをおもいだす。 | You handled the moment and carried its outcome into what came next. |

#### 花束のカーテンコール（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:215 | title | 花束のカーテンコール | はなたばのかーてんこーる | Bouquet Curtain Call |
| src/data/magicFriendshipRoutes.ts:217 | eventTitle | 保健室の秘密リハーサル | ほけんしつのひみつりはーさる | Secret Rehearsal in the Infirmary |
| src/data/magicFriendshipRoutes.ts:218 | eventSummary | ひよりはみらいの本音を急かさず聞く。みらいは演技ではない涙を初めて友に見せる。 | ひよりはみらいのほんねをせかさずきく。みらいはえんぎではないなみだをはじめてともにみせる。 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicFriendshipRoutes.ts:220 | endingTitle | ハートフルステージエンド | ハートフルステージエンド | Heartful Stage Ending |
| src/data/magicFriendshipRoutes.ts:221 | endingText | 花束を受け取る時、みらいは客席ではなくひよりを探した。弱い自分を知る友がいるから、舞台はもっと眩しくなる。 | はなたばをうけとるとき、みらいはきゃくせきではなくひよりをさがした。よわいじぶんをしるともがいるから、ぶたいはもっとまぶしくなる。 | The exchange with others changed the mood and opened a way forward. |

#### 星界から来た花守り（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:228 | title | 星界から来た花守り | せいかいからきたはなもり | Flower Guardian from the Celestial Realm |
| src/data/magicFriendshipRoutes.ts:230 | eventTitle | 星界語で書かれた処方箋 | せいかいごでかかれたしょほうせん | A Prescription Written in Celestial Script |
| src/data/magicFriendshipRoutes.ts:231 | eventSummary | セラはひよりにこの世界の優しさを教わり、自分も誰かを癒やす存在になりたいと願う。 | セラはひよりにこのせかいのやさしさをおそわり、じぶんもだれかをいやすそんざいになりたいとねがう。 | You took a moment to recover and regain your rhythm. |
| src/data/magicFriendshipRoutes.ts:233 | endingTitle | セレスティアルブルームエンド | セレスティアルブルームエンド | Celestial Bloom Ending |
| src/data/magicFriendshipRoutes.ts:234 | endingText | 星界の記録に、ひよりの花の名前が増えていく。セラにとってこの世界は、もう任務先ではなく友達のいる場所だった。 | せいかいのきろくに、ひよりのはなのなまえがふえていく。セラにとってこのせかいは、もうにんむさきではなくともだちのいるばしょだった。 | The exchange with others changed the mood and opened a way forward. |

#### 星光と禁術の境界（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:241 | title | 星光と禁術の境界 | せいこうときんじゅつのきょうかい | Boundary of Starlight and Forbidden Arts |
| src/data/magicFriendshipRoutes.ts:243 | eventTitle | 封印門の共同防衛 | ふういんもんのきょうどうぼうえい | Joint Defense of the Sealed Gate |
| src/data/magicFriendshipRoutes.ts:244 | eventSummary | セラはれいの闇を怖がらず、れいはセラの光を甘さではなく強さとして認める。 | セラはれいのやみをこわがらず、れいはセラのひかりをあまさではなくつよさとしてみとめる。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicFriendshipRoutes.ts:246 | endingTitle | ライトシールエンド | ライトシールエンド | Light Seal Ending |
| src/data/magicFriendshipRoutes.ts:247 | endingText | 封印門の前で、二人は違う祈りを同じ未来へ重ねた。光と闇は対立ではなく、世界を守る両翼になった。 | ふういんもんのまえで、ふたりはちがういのりをおなじみらいへかさねた。ひかりとやみはたいりつではなく、せかいをまもるりょうよくになった。 | You handled the moment and carried its outcome into what came next. |

#### 風炎の悪友コンビ（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:252 | title | 風炎の悪友コンビ | かぜほのおのあくゆうこんび | Wind-and-Flame Troublemaker Duo |
| src/data/magicFriendshipRoutes.ts:253 | eventSummary | 蓮が大和の炎を風で導き、大和が蓮の迷いを拳で吹き飛ばす。 | れんがやまとのほのおをかぜでみちびき、やまとがれんのまよいをこぶしでふきとばす。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:253 | eventTitle | 中庭の風炎スパーリング | なかにわのかぜほのおすぱーりんぐ | Wind-Flame Sparring in the Courtyard |
| src/data/magicFriendshipRoutes.ts:254 | endingTitle | ゲイルブレイズエンド | ゲイルブレイズエンド | Gale Blaze Ending |
| src/data/magicFriendshipRoutes.ts:255 | endingText | 口げんかの回数だけ、二人の連携は鋭くなった。困った時に最初に駆けつけるのは、いつも互いだった。 | くちげんかのかいすうだけ、ふたりのれんけいれんるどくなった。こまったときにさいしょにかけつけるのは、いつもたがいだった。 | You handled the moment and carried its outcome into what came next. |

#### 風が支える清流（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:260 | title | 風が支える清流 | かぜがささえるせいりゅう | A Clear Stream Supported by Wind |
| src/data/magicFriendshipRoutes.ts:261 | eventSummary | 蓮は答えを教えるだけでなく、湊が自分で立てるまで隣で風を支える。 | れんはこたえをおしえるだけでなく、みなとがじぶんでたてるまでとなりでかぜをささえる。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:261 | eventTitle | 屋上の防護魔法練習 | おくじょうのぼうごまほうれんしゅう | Protective Magic Practice on the Rooftop |
| src/data/magicFriendshipRoutes.ts:262 | endingTitle | アクアゲイルエンド | アクアゲイルエンド | Aqua Gale Ending |
| src/data/magicFriendshipRoutes.ts:263 | endingText | 湊が一人で任務を任される日も、蓮は少し離れた場所から背中を見守った。 | みなとがひとりでにんむをまかされるひも、れんはすこしはなれたばしょからせなかをみまもった。 | You handled the moment and carried its outcome into what came next. |

#### 氷律と時詠の盤上戦（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:268 | title | 氷律と時詠の盤上戦 | こおりりつとときえいのばんじょうせん | Board Battle of Ice Law and Time Reading |
| src/data/magicFriendshipRoutes.ts:269 | eventSummary | 颯真の精密な計画へ、理玖が予測不能な未来分岐を持ち込む。 | そうまのせいみつなけいかくへ、りくがよそくふのうなみらいぶんきをもちこむ。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicFriendshipRoutes.ts:269 | eventTitle | 凍結時計の作戦盤 | とうけつとけいのさくせんばん | Strategy Board of the Frozen Clock |
| src/data/magicFriendshipRoutes.ts:270 | endingTitle | クロノオーダーエンド | クロノオーダーエンド | Chrono Order Ending |
| src/data/magicFriendshipRoutes.ts:271 | endingText | 完璧な予定表には、理玖が勝手に書き足した余白が残った。それを消さないことが颯真の信頼だった。 | かんぺきなよていひょうには、りくがかってにかきたしたよはくがのこった。それをけさないことがそうまのしんらいだった。 | Your effort was recognized and turned into a stronger result. |

#### 二界の生徒会協定（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:276 | title | 二界の生徒会協定 | にかいのせいとかいきょうてい | Student Council Accord Between Two Worlds |
| src/data/magicFriendshipRoutes.ts:277 | eventSummary | 颯真とエリオットは学園と星界、双方を守るため対等な協定を結ぶ。 | そうまとエリオットはがくえんとせいかい、そうほうをまもるためたいとうなきょうていをむすぶ。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:277 | eventTitle | 月夜の機密文書交換 | つきよのきみつぶんしょこうかん | Secret Document Exchange by Moonlight |
| src/data/magicFriendshipRoutes.ts:278 | endingTitle | アストラルオーダーエンド | アストラルオーダーエンド | Astral Order Ending |
| src/data/magicFriendshipRoutes.ts:279 | endingText | 世界が違っても、守る責任は理解できる。二人の署名は新しい同盟の始まりになった。 | せかいがちがっても、まもるせきにんはりかいできる。ふたりのしょめいはあたらしいどうめいのはじまりになった。 | world, protect responsibility understanding. new. |

#### 追いつく清流（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:284 | title | 追いつく清流 | おいつくせいりゅう | The Clear Stream That Catches Up |
| src/data/magicFriendshipRoutes.ts:285 | eventSummary | 湊は蓮に守られるだけでなく、傷ついた使い魔を共に運ぶ相棒になる。 | みなとはれんにまもられるだけでなく、きずついたつかいまをともにはこぶあいぼうになる。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:285 | eventTitle | 雨の使い魔救護 | あめのつかいまきゅうご | Rescuing Familiars in the Rain |
| src/data/magicFriendshipRoutes.ts:286 | endingTitle | ブルーゲイルエンド | ブルーゲイルエンド | Blue Gale Ending |
| src/data/magicFriendshipRoutes.ts:287 | endingText | もう「先輩の後ろ」ではない。湊は蓮の隣で、同じ景色を見て歩いた。 | もう「せんぱいのうしろ」ではない。みなとはれんのとなりで、おなじけしきをみてあるいた。 | Minato was no longer walking behind his senior. He walked beside Ren, seeing the same scenery. |

#### 清流と星界の救護班（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:292 | title | 清流と星界の救護班 | せいりゅうとせいかいのきゅうごはん | Clear Stream and Celestial Rescue Team |
| src/data/magicFriendshipRoutes.ts:293 | eventSummary | 湊の治癒水とエリオットの星光が重なり、新しい救護術が生まれる。 | みなとのちゆみずとエリオットのせいこうがかさなり、あたらしいきゅうごじゅつがうまれる。 | You took a moment to recover and regain your rhythm. |
| src/data/magicFriendshipRoutes.ts:293 | eventTitle | 保健室の星水治療 | ほけんしつのほしすいちりょう | Star-Water Treatment in the Infirmary |
| src/data/magicFriendshipRoutes.ts:294 | endingTitle | スターリィスプリングエンド | スターリィスプリングエンド | Starry Spring Ending |
| src/data/magicFriendshipRoutes.ts:295 | endingText | 二人の共同処方は多くの傷を癒やした。分からない術式ほど、隣で学ぶ時間が楽しかった。 | ふたりのきょうどうしょほうはおおくのきずをいやした。わからないじゅつしきほど、となりでまなぶじかんがたのしかった。 | You took a moment to recover and regain your rhythm. |

#### 未来を縛らない規則（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:300 | title | 未来を縛らない規則 | みらいをしばらないきそく | Rules That Do Not Bind the Future |
| src/data/magicFriendshipRoutes.ts:301 | eventSummary | 理玖は颯真と時計を直しながら、予定外を恐れない未来を示す。 | りくはそうまととけいをなおしながら、よていがいをおそれないみらいをしめす。 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicFriendshipRoutes.ts:301 | eventTitle | 止まった鐘楼の共同修理 | とまったしょうろうのきょうどうしゅうり | Joint Repair of the Stopped Bell Tower |
| src/data/magicFriendshipRoutes.ts:302 | endingTitle | フリークロックエンド | フリークロックエンド | Free Clock Ending |
| src/data/magicFriendshipRoutes.ts:303 | endingText | 二人は未来を固定せず、何度でも相談して決め直した。その約束だけは変わらなかった。 | ふたりはみらいをこていせず、なんどでもそうだんしてきめなおした。そのやくそくだけはかわらなかった。 | You handled the moment and carried its outcome into what came next. |

#### 時幻即興劇（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:308 | title | 時幻即興劇 | ときまぼろしそっきょうげき | Time-Illusion Improvisation |
| src/data/magicFriendshipRoutes.ts:309 | eventSummary | 理玖が時間を刻み、レオンがその隙間へ予測不能な幻を咲かせる。 | りくがじかんをきざみ、レオンがそのすきまへよそくふのうなまぼろしをさかせる。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:309 | eventTitle | 一秒先のアドリブ舞台 | いちびょうさきのあどりぶぶたい | Ad-Lib Stage One Second Ahead |
| src/data/magicFriendshipRoutes.ts:310 | endingTitle | クロノノクターンエンド | クロノノクターンエンド | Chrono Nocturne Ending |
| src/data/magicFriendshipRoutes.ts:311 | endingText | 台本のない舞台ほど二人は笑った。未来を知っても驚ける相手は、そう多くない。 | だいほんのないぶたいほどふたりはわらった。みらいをしってもおどろけるあいては、そうおおくない。 | The exchange with others changed the mood and opened a way forward. |

#### 拳と風の防波堤（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:316 | title | 拳と風の防波堤 | こぶしとかぜのぼうはてい | Breakwater of Fists and Wind |
| src/data/magicFriendshipRoutes.ts:317 | eventSummary | 大和の炎拳と蓮の防護風が、後輩たちへ迫る崩壊を止める。 | やまとのほのおこぶしとれんのぼうごかぜが、こうはいたちへせまるほうかいをとめる。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:317 | eventTitle | 崩壊結界の最前線 | ほうかいけっかいのさいぜんせん | Front Line of the Collapsing Barrier |
| src/data/magicFriendshipRoutes.ts:318 | endingTitle | バーニングゲイルエンド | バーニングゲイルエンド | Burning Gale Ending |
| src/data/magicFriendshipRoutes.ts:319 | endingText | どちらが多く守ったかで、また言い争う。そんな日常が戻ったことを二人は誰より喜んだ。 | どちらがおおくまもったかで、またいいあらそう。そんなにちじょうがもどったことをふたりはだれよりよろこんだ。 | You handled the moment and carried its outcome into what came next. |

#### 獄炎と宵闇の停戦（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:324 | title | 獄炎と宵闇の停戦 | ごくほのおとよいやみのていせん | Ceasefire Between Hellfire and Twilight |
| src/data/magicFriendshipRoutes.ts:325 | eventSummary | 大和は朔夜を疑いながらも、その覚悟を炎で支える。 | やまとはさくやをうたがいながらも、そのかくごをほのおでささえる。 | Facing the feeling directly helped your mind settle. |
| src/data/magicFriendshipRoutes.ts:325 | eventTitle | 地下封印区画の共同突破 | ちかふういんくかくのきょうどうとっぱ | Joint Breakthrough of the Underground Seal Zone |
| src/data/magicFriendshipRoutes.ts:326 | endingTitle | ヘルファイアシールエンド | ヘルファイアシールエンド | Hellfire Seal Ending |
| src/data/magicFriendshipRoutes.ts:327 | endingText | 信じるとは言わない。それでも背中を向けられる。その不器用な距離が二人には十分だった。 | しんじるとはいわない。それでもせなかをむけられる。そのぶきようなきょりがふたりにはじゅうぶんだった。 | You handled the moment and carried its outcome into what came next. |

#### 幻想時計の二重奏（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:332 | title | 幻想時計の二重奏 | げんそうとけいのにじゅうそう | Duet of the Illusion Clock |
| src/data/magicFriendshipRoutes.ts:333 | eventSummary | レオンの幻奏を理玖の時間環が支え、二人だけの舞台を完成させる。 | レオンのげんそうをりくのじかんかんがささえ、ふたりだけのぶたいをかんせいさせる。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicFriendshipRoutes.ts:333 | eventTitle | 時環ステージの調律 | ときかんすてーじのちょうりつ | Tuning the Time-Ring Stage |
| src/data/magicFriendshipRoutes.ts:334 | endingTitle | ミラージュクロックエンド | ミラージュクロックエンド | Mirage Clock Ending |
| src/data/magicFriendshipRoutes.ts:335 | endingText | 拍手がなくても、二人なら幕を上げられる。互いの無茶を楽しめる最高の共演者だった。 | はくしゅがなくても、ふたりならまくをあげられる。たがいのむちゃをたのしめるさいこうのきょうえんしゃだった。 | Your effort was recognized and turned into a stronger result. |

#### 星譜のノクターン（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:340 | title | 星譜のノクターン | ほしふののくたーん | Nocturne of the Star Score |
| src/data/magicFriendshipRoutes.ts:341 | eventSummary | レオンが星界の音を演奏し、エリオットが失われた旋律を記録する。 | レオンがせいかいのおとをえんそうし、エリオットがうしなわれたせんりつをきろくする。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:341 | eventTitle | 星空ドームの未完成楽譜 | ほしぞらどーむのみかんせいがくふ | Unfinished Score in the Star Dome |
| src/data/magicFriendshipRoutes.ts:342 | endingTitle | セレスティアルノクターンエンド | セレスティアルノクターンエンド | Celestial Nocturne Ending |
| src/data/magicFriendshipRoutes.ts:343 | endingText | 二つの世界で同じ曲が奏でられた。最初の観客であり共作者であることが二人の誇りだった。 | ふたつのせかいでおなじきょくがかなでられた。さいしょのかんきゃくでありきょうさくしゃであることがふたりのほこりだった。 | You handled the moment and carried its outcome into what came next. |

#### 星界氷壁協定（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:348 | title | 星界氷壁協定 | せいかいひょうへききょうてい | Celestial Ice Wall Accord |
| src/data/magicFriendshipRoutes.ts:349 | eventSummary | エリオットの星光と颯真の氷壁が、二界の記録を守り抜く。 | エリオットのせいこうとそうまのひょうへきが、にかいのきろくをまもりぬく。 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipRoutes.ts:349 | eventTitle | 禁書庫の共同防衛 | きんしょこのきょうどうぼうえい | Joint Defense of the Forbidden Archive |
| src/data/magicFriendshipRoutes.ts:350 | endingTitle | フローズンアーカイブエンド | フローズンアーカイブエンド | Frozen Archive Ending |
| src/data/magicFriendshipRoutes.ts:351 | endingText | 秘密は孤独に抱えるものではない。二人は守るべき記録と、頼れる友を同時に得た。 | ひみつはこどくにかかえるものではない。ふたりはまもるべききろくと、たよれるともをどうじにえた。 | The exchange with others changed the mood and opened a way forward. |

#### 幻奏の星界門（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:356 | title | 幻奏の星界門 | げんそうのせいかいもん | Celestial Gate of Illusion Music |
| src/data/magicFriendshipRoutes.ts:357 | eventSummary | エリオットの星界門へ、レオンが観客の恐怖を希望へ変える幻を重ねる。 | エリオットのせいかいもんへ、レオンがかんきゃくのきょうふをきぼうへかえるまぼろしをかさねる。 | Facing the feeling directly helped your mind settle. |
| src/data/magicFriendshipRoutes.ts:357 | eventTitle | 舞台に開く星の門 | ぶたいにひらくほしのもん | Star Gate Opening on the Stage |
| src/data/magicFriendshipRoutes.ts:358 | endingTitle | アストラルステージエンド | アストラルステージエンド | Astral Stage Ending |
| src/data/magicFriendshipRoutes.ts:359 | endingText | 別れの門は再会の舞台になった。二人は世界を越える公演を何度も成功させた。 | わかれのもんはさいかいのぶたいになった。ふたりはせかいをこえるこうえんをなんどもせいこうさせた。 | Your effort was recognized and turned into a stronger result. |

#### 宵闇を殴り開け（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:364 | title | 宵闇を殴り開け | よいやみをなぐりひらけ | Punch Open the Twilight |
| src/data/magicFriendshipRoutes.ts:365 | eventSummary | 朔夜が封印を維持し、大和が迷わず退路を切り開く。 | さくやがふういんをいじし、やまとがまよわずたいろをきりひらく。 | Facing the feeling directly helped your mind settle. |
| src/data/magicFriendshipRoutes.ts:365 | eventTitle | 影兵包囲網の突破 | かげへいほういあみのとっぱ | Breaking Through the Shadow-Soldier Encirclement |
| src/data/magicFriendshipRoutes.ts:366 | endingTitle | ナイトブレイカーエンド | ナイトブレイカーエンド | Night Breaker Ending |
| src/data/magicFriendshipRoutes.ts:367 | endingText | 過去へ沈みそうな時、大和の拳と怒鳴り声が朔夜を現在へ連れ戻した。 | かこへしずみそうなとき、やまとのこぶしとどなりこえがさくやをげんざいへつれもどした。 | You handled the moment and carried its outcome into what came next. |

#### 風がほどく封印（5行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipRoutes.ts:372 | title | 風がほどく封印 | かぜがほどくふういん | The Seal Undone by Wind |
| src/data/magicFriendshipRoutes.ts:373 | eventSummary | 蓮の風が暴走を抑え、朔夜は初めて仲間を信じて封印を完成させる。 | れんのかぜがぼうそうをおさえ、さくやははじめてなかまをしんじてふういんをかんせいさせる。 | Your effort was recognized and turned into a stronger result. |
| src/data/magicFriendshipRoutes.ts:373 | eventTitle | 次元亀裂の共同封鎖 | じげんきれつのきょうどうふうさ | Joint Sealing of the Dimensional Rift |
| src/data/magicFriendshipRoutes.ts:374 | endingTitle | ゲイルシールエンド | ゲイルシールエンド | Gale Seal Ending |
| src/data/magicFriendshipRoutes.ts:375 | endingText | 蓮は過去ではなく今の行動を見ると言った。朔夜はその言葉を、生涯忘れない借りとして受け取った。 | れんはかこではなくいまのこうどうをみるといった。さくやはそのことばを、しょうがいわすれないかりとしてうけとった。 | You handled the moment and carried its outcome into what came next. |

### 友情エンディング会話（68行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/magicFriendshipEndingDialogue.ts:9 | text | あかり「しずくの予定表、今日だけは寄り道の予定を一番上にしておいて！」 | あかり「しずくのよていひょう、きょうだけはよりみちのよていをいちばんうえにしておいて！」 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicFriendshipEndingDialogue.ts:10 | text | しずく「計算済みです。あなたが迷子になる時間も、ちゃんと余白に入れてあります。」 | しずく「けいさんすみです。あなたがまいごになるじかんも、ちゃんとよはくにいれてあります。」 | Facing the feeling directly helped your mind settle. |
| src/data/magicFriendshipEndingDialogue.ts:13 | text | あかり「次の勝負、負けた方がジュースおごりね。もちろん全力で！」 | あかり「つぎのしょうぶ、まけたほうがじゅーすおごりね。もちろんぜんりょくで！」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:14 | text | つばさ「上等！でも勝ってもおごるよ。今日は二人で勝った日だからな！」 | つばさ「じょうとう！でもかってもおごるよ。きょうはふたりでかったひだからな！」 | Tsubasa: They share their honest feelings. |
| src/data/magicFriendshipEndingDialogue.ts:17 | text | しずく「予定外でした。けれど、あなたとの予定外は不思議と楽しいです。」 | しずく「よていがいでした。けれど、あなたとのよていがいはふしぎとたのしいです。」 | Shizuku: schedule., schedule fun. |
| src/data/magicFriendshipEndingDialogue.ts:18 | text | あかり「じゃあ明日も予定外しよう！月の先生、星の生徒からの宿題です！」 | あかり「じゃああしたもよていがいしよう！つきのせんせい、ほしのせいとからのしゅくだいです！」 | " tomorrow schedule! teacher, student homework!" |
| src/data/magicFriendshipEndingDialogue.ts:21 | text | しずく「この研究、結論より先にお茶の時間を固定しましょう。」 | しずく「このけんきゅう、けつろんよりさきにおちゃのじかんをこていしましょう。」 | You refined what you learned and turned it into a practical advantage. |
| src/data/magicFriendshipEndingDialogue.ts:22 | text | まどか「そ、その予定なら失敗しません。失敗しても、もう一杯いれます。」 | まどか「そ、そのよていならしっぱいしません。しっぱいしても、もういっぱいいれます。」 | Madoka: , schedule failure. failure,. |
| src/data/magicFriendshipEndingDialogue.ts:25 | text | ひより「この庭、疲れた子がいつでも休める場所にしたいな。」 | ひより「このにわ、つかれたこがいつでもやすめるばしょにしたいな。」 | Hiyori: , tired. |
| src/data/magicFriendshipEndingDialogue.ts:26 | text | こはる「風は任せて。花が笑う方向へ、ちゃんと道を作るから。」 | こはる「かぜはまかせて。はながわらうほうこうへ、ちゃんとみちをつくるから。」 | Koharu: Leave the wind to me. I will make a proper path toward the place where the flowers can smile. |
| src/data/magicFriendshipEndingDialogue.ts:29 | text | ひより「セラちゃんの星の光、ばんそうこうより効くかも。」 | ひより「セラちゃんのほしのひかり、ばんそうこうよりきくかも。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:30 | text | セラ「では、ひよりの花の処方も星界標準に登録します。やさしさ多めで。」 | セラ「では、ひよりのはなのしょほうもせいかいひょうじゅんにとうろくします。やさしさおおめで。」 | Sera: Then I will register Hiyori's flower prescription as a celestial standard, with extra kindness. |
| src/data/magicFriendshipEndingDialogue.ts:33 | text | つばさ「あかり、今日の反省会は走りながらでいいよな？」 | つばさ「あかり、きょうのはんせいかいははしりながらでいいよな？」 | Tsubasa: Akari, today's review meeting can happen while we run, right? |
| src/data/magicFriendshipEndingDialogue.ts:34 | text | あかり「いいよ！でも反省より、次に勝つ作戦の方が多くなりそう！」 | あかり「いいよ！でもはんせいより、つぎにかつさくせんのほうがおおくなりそう！」 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicFriendshipEndingDialogue.ts:37 | text | つばさ「れい、無茶する前に合図しろよ。止めるんじゃなくて一緒に行くから。」 | つばさ「れい、むちゃするまえにあいずしろよ。やめるんじゃなくていっしょにいくから。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:38 | text | れい「騒がしい合図なら、もう十分届いている。背中は預ける。」 | れい「さわがしいあいずなら、もうじゅうぶんとどいている。せなかはあずける。」 | Rei: They share their honest feelings. |
| src/data/magicFriendshipEndingDialogue.ts:41 | text | れい「封印が乱れた時、あなたの足音だけは迷わず聞こえた。」 | れい「ふういんがみだれたとき、あなたのあしおとだけはまよわずきこえた。」 | Facing the feeling directly helped your mind settle. |
| src/data/magicFriendshipEndingDialogue.ts:42 | text | つばさ「当たり前だろ。友だちが黙って困るの、禁止に決まってる！」 | つばさ「あたりまえだろ。ともだちがだまってこまるの、きんしにきまってる！」 | Tsubasa: They share their honest feelings. |
| src/data/magicFriendshipEndingDialogue.ts:45 | text | れい「闇の記録を、あなたは怖がらずに読んだ。」 | れい「やみのきろくを、あなたはこわがらずによんだ。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:46 | text | セラ「怖くても読みます。れいが一人でページを閉じないように。」 | セラ「こわくてもよみます。れいがひとりでぺーじをとじないように。」 | The study moment clarified what you needed to understand next. |
| src/data/magicFriendshipEndingDialogue.ts:49 | text | まどか「失敗記録に、笑った回数も書いておけばよかったです。」 | まどか「しっぱいきろくに、わらったかいすうもかいておけばよかったです。」 | Madoka: failure record,. |
| src/data/magicFriendshipEndingDialogue.ts:50 | text | しずく「では次のノートから欄を追加します。かなり大きめに。」 | しずく「ではつぎののーとかららんをついかします。かなりおおきめに。」 | Shizuku: next.. |
| src/data/magicFriendshipEndingDialogue.ts:53 | text | まどか「本番前の三秒だけ、時間をゆっくりにしますね。」 | まどか「ほんばんまえのさんびょうだけ、じかんをゆっくりにしますね。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:54 | text | みらい「助かる！その三秒で、最高のウインクを完成させるから！」 | みらい「たすかる！そのさんびょうで、さいこうのういんくをかんせいさせるから！」 | Mirai: They share their honest feelings. |
| src/data/magicFriendshipEndingDialogue.ts:57 | text | こはる「強い風の日は、花が根を張る日でもあるんだね。」 | こはる「つよいかぜのひは、はながねをはるひでもあるんだね。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:58 | text | ひより「うん。こはるちゃんが風を見てくれるから、安心して咲けるよ。」 | ひより「うん。こはるちゃんがかぜをみてくれるから、あんしんしてさけるよ。」 | Hiyori: Yes. Koharu watches the wind for me, so I can bloom without worry. |
| src/data/magicFriendshipEndingDialogue.ts:61 | text | こはる「精霊樹に星界行きの枝が増えたら、迷子が出そう。」 | こはる「せいれいきにせいかいいきのえだがふえたら、まいごがでそう。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:62 | text | セラ「案内板を作ります。こはる監修なら、風向き表示つきです。」 | セラ「あんないばんをつくります。こはるかんしゅうなら、かざむきひょうじつきです。」 | Sera: I will make a guide sign. With Koharu supervising, it will include wind direction. |
| src/data/magicFriendshipEndingDialogue.ts:65 | text | みらい「まどかの時計があると、緊張までリズムに聞こえるの。」 | みらい「まどかのとけいがあると、きんちょうまでりずむにきこえるの。」 | The risky choice backfired and left you with a setback. |
| src/data/magicFriendshipEndingDialogue.ts:66 | text | まどか「そ、それなら次は拍手のタイミングも測ってみます。」 | まどか「そ、それならつぎははくしゅのたいみんぐもはかってみます。」 | Madoka: , next. |
| src/data/magicFriendshipEndingDialogue.ts:69 | text | みらい「泣いた後のリハーサルって、なんだか声がまっすぐ出るね。」 | みらい「ないたのちのりはーさるって、なんだかこえがまっすぐでるね。」 | Mirai: , voice. |
| src/data/magicFriendshipEndingDialogue.ts:70 | text | ひより「その声、ちゃんと本物だよ。花束より先に届けたいくらい。」 | ひより「そのこえ、ちゃんとほんものだよ。はなたばよりさきにとどけたいくらい。」 | You noticed the opening and turned it into an advantage. |
| src/data/magicFriendshipEndingDialogue.ts:73 | text | セラ「星界の辞書に、ひよりの花言葉を増やしておきました。」 | セラ「せいかいのじしょに、ひよりのはなことばをふやしておきました。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:74 | text | ひより「じゃあ私は、この世界の辞書にセラちゃんの笑顔を追加するね。」 | ひより「じゃあわたしは、このせかいのじしょにセラちゃんのえがおをついかするね。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:77 | text | セラ「光だけでは守れない場所を、れいが教えてくれました。」 | セラ「ひかりだけではまもれないばしょを、れいがおしえてくれました。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:78 | text | れい「闇だけでも進めない。だから、あなたの灯りは必要だ。」 | れい「やみだけでもすすめない。だから、あなたのあかりはひつようだ。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:81 | text | 蓮「大和、反省会は五分だけ。机を壊さない範囲でな。」 | れん「やまと、はんせいかいはごふんだけ。つくえをこわさないはんいでな。」 | Ren: Yamato, the review meeting is five minutes only. Keep it within desk-safe limits. |
| src/data/magicFriendshipEndingDialogue.ts:82 | text | 大和「五分で足りるかよ。勝った理由と次に勝つ理由、両方話すぞ！」 | やまと「ごふんでたりるかよ。かったりゆうとつぎにかつりゆう、りょうほうはなすぞ！」 | The exchange with others changed the mood and opened a way forward. |
| src/data/magicFriendshipEndingDialogue.ts:85 | text | 蓮「今日は俺の後ろじゃなくて、横に並んで帰る日だな。」 | れん「きょうはおれのうしろじゃなくて、よこにならんでかえるひだな。」 | Ren: Today is the day you walk home beside me, not behind me. |
| src/data/magicFriendshipEndingDialogue.ts:86 | text | 湊「はい。次は僕が、先輩の傘を持ちます。」 | みなと「はい。つぎはぼくが、せんぱいのかさをもちます。」 | Minato: . next, umbrella. |
| src/data/magicFriendshipEndingDialogue.ts:89 | text | 颯真「理玖、予定表に落書きするなら、せめて読める字で頼む。」 | そうま「りく、よていひょうにらくがきするなら、せめてよめるじでたのむ。」 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicFriendshipEndingDialogue.ts:90 | text | 理玖「未来は読みにくい方が面白いだろ。ほら、余白は残したよ。」 | りく「みらいはよみにくいほうがおもしろいだろ。ほら、よはくはのこしたよ。」 | Riku: future white.,. |
| src/data/magicFriendshipEndingDialogue.ts:93 | text | 颯真「この協定書、茶菓子の項目だけ妙に細かいな。」 | そうま「このきょうていしょ、ちゃがしのこうもくだけみょうにこまかいな。」 | Soma: They share their honest feelings. |
| src/data/magicFriendshipEndingDialogue.ts:94 | text | エリオット「重要です。世界を守る会議には、甘いものが必要ですから。」 | エリオット「じゅうようです。せかいをまもるかいぎには、あまいものがひつようですから。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:97 | text | 湊「先輩、今日は僕が前を歩いてもいいですか。」 | みなと「せんぱい、きょうはぼくがまえをあるいてもいいですか。」 | Minato: They share their honest feelings. |
| src/data/magicFriendshipEndingDialogue.ts:98 | text | 蓮「もちろん。迷ったら風で知らせる。迷わなくても、たまに呼ぶ。」 | れん「もちろん。まよったらかぜでしらせる。まよわなくても、たまによぶ。」 | Ren: Of course. If you get lost, I will signal with the wind. Even if you do not, I will call sometimes. |
| src/data/magicFriendshipEndingDialogue.ts:101 | text | 湊「星の水って、少し甘い匂いがするんですね。」 | みなと「ほしのみずって、すこしあまいにおいがするんですね。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:102 | text | エリオット「湊の水は安心の味がします。処方名は、友だちの一杯で。」 | エリオット「みなとのみずはあんしんのあじがします。しょほうめいは、ともだちのいっぱいで。」 | Elliot: Minato's water tastes like reassurance. The prescription name will be A Cup from a Friend. |
| src/data/magicFriendshipEndingDialogue.ts:105 | text | 理玖「未来を一つに決めないって、意外と規則的だろ？」 | りく「みらいをひとつにきめないって、いがいときそくてきだろ？」 | Riku: future one, rules? |
| src/data/magicFriendshipEndingDialogue.ts:106 | text | 颯真「認めよう。君との予定変更だけは、必要な手順だ。」 | そうま「みとめよう。きみとのよていへんこうだけは、ひつようなてじゅんだ。」 | Soma: . schedule, needed procedure. |
| src/data/magicFriendshipEndingDialogue.ts:109 | text | 理玖「次のアドリブ、未来で見ても意味不明だったよ。」 | りく「つぎのあどりぶ、みらいでみてもいみふめいだったよ。」 | Riku: next, future. |
| src/data/magicFriendshipEndingDialogue.ts:110 | text | レオン「最高の褒め言葉だね。観測不能のアンコール、いくよ！」 | レオン「さいこうのほめことばだね。かんそくふのうのあんこーる、いくよ！」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:113 | text | 大和「蓮、どっちが多く守ったか勝負はまだついてねえぞ。」 | やまと「れん、どっちがおおくまもったかしょうぶはまだついてねえぞ。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:114 | text | 蓮「じゃあ引き分けだ。次も同じ場所に立つ理由ができる。」 | れん「じゃあひきわけだ。つぎもおなじばしょにたつりゆうができる。」 | Ren: . next. |
| src/data/magicFriendshipEndingDialogue.ts:117 | text | 大和「信用したわけじゃねえ。でも、お前の背中はもう覚えた。」 | やまと「しんようしたわけじゃねえ。でも、おまえのせなかはもうおぼえた。」 | Yamato: They share their honest feelings. |
| src/data/magicFriendshipEndingDialogue.ts:118 | text | 朔夜「それで十分だ。次に迷う時は、その炎を目印にする。」 | さくや「それでじゅうぶんだ。つぎにまようときは、そのほのおをめじるしにする。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:121 | text | レオン「理玖、未来の拍手は聞こえた？」 | レオン「りく、みらいのはくしゅはきこえた？」 | Your effort was recognized and turned into a stronger result. |
| src/data/magicFriendshipEndingDialogue.ts:122 | text | 理玖「聞こえたよ。問題は、君がさらに派手にして歴史を変えることだ。」 | りく「きこえたよ。もんだいは、きみがさらにはでにしてれきしをかえることだ。」 | Riku: . problem, change. |
| src/data/magicFriendshipEndingDialogue.ts:125 | text | レオン「星界の楽譜、難しいね。だけど客席が宇宙なら燃える。」 | レオン「せいかいのがくふ、むずかしいね。だけどきゃくせきがうちゅうならもえる。」 | Leon: Celestial sheet music is difficult. But if the audience is the universe, that fires me up. |
| src/data/magicFriendshipEndingDialogue.ts:126 | text | エリオット「初演の指揮は任せます。私は迷子の星を席へ案内します。」 | エリオット「しょえんのしきはまかせます。わたしはまいごのほしをせきへあんないします。」 | Elliot: I will leave the premiere's conducting to you. I will guide lost stars to their seats. |
| src/data/magicFriendshipEndingDialogue.ts:129 | text | エリオット「秘密を共有すると、少しだけ荷物が軽くなるのですね。」 | エリオット「ひみつをきょうゆうすると、すこしだけにもつがかるくなるのですね。」 | Elliot: secret, a little. |
| src/data/magicFriendshipEndingDialogue.ts:130 | text | 颯真「管理する書類は増えたが、悪くない重さだ。」 | そうま「かんりするしょるいはふえたが、わるくないおもさだ。」 | Soma: They share their honest feelings. |
| src/data/magicFriendshipEndingDialogue.ts:133 | text | エリオット「別れの門に、再演予定を書き込む人は初めてです。」 | エリオット「わかれのもんに、さいえんよていをかきこむにんははじめてです。」 | Turning the situation into a plan made the next step easier to take. |
| src/data/magicFriendshipEndingDialogue.ts:134 | text | レオン「閉幕じゃないよ。星をまたぐツアーの初日さ。」 | レオン「へいまくじゃないよ。ほしをまたぐつあーのしょにちさ。」 | Leon: "This is not the closing curtain. It is the first day of a tour across the stars." |
| src/data/magicFriendshipEndingDialogue.ts:137 | text | 朔夜「過去へ沈みかけた時、君の声はひどく現実的だった。」 | さくや「かこへしずみかけたとき、きみのこえはひどくげんじつてきだった。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:138 | text | 大和「褒めてんのか？まあいい。次も引っぱり戻してやる。」 | やまと「ほめてんのか？まあいい。つぎもひっぱりもどしてやる。」 | You handled the moment and carried its outcome into what came next. |
| src/data/magicFriendshipEndingDialogue.ts:141 | text | 朔夜「赦しはいらないと言ったのに、君は隣に残った。」 | さくや「ゆるしはいらないといったのに、きみはとなりにのこった。」 | Sakuya: I said I did not need forgiveness, yet you stayed by my side. |
| src/data/magicFriendshipEndingDialogue.ts:142 | text | 蓮「残るのに理由がいるなら、友だちだからで十分だろ。」 | れん「のこるのにりゆうがいるなら、ともだちだからでじゅうぶんだろ。」 | Ren: They share their honest feelings. |

## 通常エンディング

### 通常エンディング（11行）

| source | field | 原文 | ひらがな表示 | 英語表示 |
|---:|---|---|---|---|
| src/data/endings.ts:9 | description | 使命を終え、それぞれの道へ進む。 | しめいをおえ、それぞれのみちへすすむ。 | You handled the moment and carried its outcome into what came next. |
| src/data/endings.ts:10 | description | あかりと卒業後の未来を選ぶ。 | あかりとそつぎょうごのみらいをえらぶ。 | You handled the moment and carried its outcome into what came next. |
| src/data/endings.ts:11 | description | あかりと恋と使命を両立する。 | あかりとこいとしめいをりょうりつする。 | You handled the moment and carried its outcome into what came next. |
| src/data/endings.ts:12 | description | 離れても続く親友関係を結ぶ。 | はなれてもつづくしんゆうかんけいをむすぶ。 | The exchange with others changed the mood and opened a way forward. |
| src/data/endings.ts:13 | description | 魔法少女コンビとして活動する。 | まほうしょうじょこんびとしてかつどうする。 | You handled the moment and carried its outcome into what came next. |
| src/data/endings.ts:14 | description | 九人で学園の守護者になる。 | きゅうにんでがくえんのしゅごしゃになる。 | You handled the moment and carried its outcome into what came next. |
| src/data/endings.ts:15 | description | 全員の合意のもと支え合う未来へ。 | ぜんいんのごういのもとささえあうみらいへ。 | The exchange with others changed the mood and opened a way forward. |
| src/data/endings.ts:16 | description | 失った信頼を胸に一人で卒業する。 | うしなったしんらいをむねにひとりでそつぎょうする。 | Facing the feeling directly helped your mind settle. |
| src/data/endings.ts:17 | description | 魔法以外の夢も選び取る。 | まほういがいのゆめもえらびとる。 | You handled the moment and carried its outcome into what came next. |
| src/data/endings.ts:18 | description | 後世に語られる守護者となる。 | こうせいにかたられるしゅごしゃとなる。 | You handled the moment and carried its outcome into what came next. |
| src/data/endings.ts:19 | description | 二つの世界を救い共存を選ぶ。 | ふたつのせかいをすくいきょうぞんをえらぶ。 | You handled the moment and carried its outcome into what came next. |
