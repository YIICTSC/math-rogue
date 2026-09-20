import type { ThemedEndingPage } from './themedEndingSequences';

export type VacationEndingToneId = 'serious' | 'funny' | 'cool' | 'cute' | 'heartfelt';

type LocalizedLine = {
  ja: string;
  hira: string;
  en: string;
};

type VacationCharacterProfile = {
  name: LocalizedLine;
  role: LocalizedLine;
  motif: LocalizedLine;
  finale: Record<VacationEndingToneId, LocalizedLine>;
};

type VacationToneProfile = {
  pages: Array<{
    title: LocalizedLine;
    scene: LocalizedLine;
  }>;
  dialogue: Array<LocalizedLine | null>;
};

const line = (ja: string, hira: string, en: string): LocalizedLine => ({ ja, hira, en });

const CHARACTER_PROFILES: Record<string, VacationCharacterProfile> = {
  WARRIOR: {
    name: line('海辺を先導する戦士', 'うみべを せんどうする せんし', 'The Warrior Leading the Shore'),
    role: line('仲間の先頭に立つ戦士', 'なかまの せんとうに たつ せんし', 'the warrior who leads the friends'),
    motif: line('赤いバンダナと潮風', 'あかい ばんだなと しおかぜ', 'a red bandana and the sea wind'),
    finale: {
      serious: line('この海で終わりじゃない。次は、みんなが帰れる道を俺が拓く。', 'この うみで おわりじゃない。つぎは、みんなが かえれる みちを おれが ひらく。', 'This shore is not the end. I will open the next road home for everyone.'),
      funny: line('勝利のあとに砂まみれになるまでが、俺たちのバカンスってことだな！', 'しょうりの あとに すなまみれに なるまでが、おれたちの ばかんすって ことだな！', 'Getting covered in sand after the victory must be part of our vacation too!'),
      cool: line('灯台の光が消えても、俺たちの次の一歩は見失わない。', 'とうだいの ひかりが きえても、おれたちの つぎの いっぽは みうしなわない。', 'Even when the lighthouse goes dark, I will not lose sight of our next step.'),
      cute: line('今日の写真は、俺たちの夏が始まった証拠だ。真ん中は任せろ！', 'きょうの しゃしんは、おれたちの なつが はじまった しょうこだ。まんなかは まかせろ！', 'Today’s photo proves our summer has begun. Leave the center spot to me!'),
      heartfelt: line('この景色を守れたなら、次の夏もみんなをここへ連れてくる。', 'この けしきを まもれたなら、つぎの なつも みんなを ここへ つれてくる。', 'If we protected this view, I will bring everyone back here next summer.'),
    },
  },
  CARETAKER: {
    name: line('命を見守る飼育委員', 'いのちを みまもる しいくいいん', 'The Caretaker Watching Over Life'),
    role: line('小さな命を見守る飼育委員', 'ちいさな いのちを みまもる しいくいいん', 'the caretaker watching over small lives'),
    motif: line('観察ノートと羽根飾り', 'かんさつ のおとと はねかざり', 'an observation notebook and feather charm'),
    finale: {
      serious: line('海辺の命も、仲間の心も、明日までちゃんと見守ってみせる。', 'うみべの いのちも、なかまの こころも、あしたまで ちゃんと みまもって みせる。', 'I will watch over the lives by the shore and the hearts of my friends until tomorrow.'),
      funny: line('みんな元気すぎるよ！　次は追いかける前に、集合写真を撮ろうね。', 'みんな げんきすぎるよ！ つぎは おいかける まえに、しゅうごう しゃしんを とろうね。', 'Everyone has too much energy! Next time, let’s take the group photo before chasing anyone.'),
      cool: line('迷子になった命を見つけたら、帰る場所まで一緒に歩くよ。', 'まいごに なった いのちを みつけたら、かえる ばしょまで いっしょに あるくよ。', 'When I find a lost life, I will walk beside it all the way home.'),
      cute: line('この海の思い出も、観察ノートのいちばん大切なページにするね。', 'この うみの おもいでも、かんさつ のおとの いちばん たいせつな ぺえじに するね。', 'I will make this seaside memory the most precious page in my notebook.'),
      heartfelt: line('おかえりと言える場所を、海辺にも学園にも育てていこう。', 'おかえりと いえる ばしょを、うみべにも がくえんにも そだてて いこう。', 'Let’s nurture a place where everyone can say welcome home, by the sea and at school.'),
    },
  },
  ASSASSIN: {
    name: line('海風にほどける転入生', 'うみかぜに ほどける てんにゅうせい', 'The Transfer Student Unbound by the Sea Wind'),
    role: line('仲間の隣を選んだ転入生', 'なかまの となりを えらんだ てんにゅうせい', 'the transfer student who chose to stand beside friends'),
    motif: line('黒いスカーフと緑の腕章', 'くろい すかあふと みどりの わんしょう', 'a dark scarf and green armband'),
    finale: {
      serious: line('隠れる場所を探すより、仲間と帰る場所を選ぶ。今の私はそうする。', 'かくれる ばしょを さがすより、なかまと かえる ばしょを えらぶ。いまの わたしは そうする。', 'Instead of searching for somewhere to hide, I choose a place to return to with my friends.'),
      funny: line('今の転倒は見なかったことにして。……無理なら、笑っていて。', 'いまの てんとうは みなかった ことにして。むりなら、わらって いて。', 'Pretend you did not see that fall. If you cannot, then at least keep laughing.'),
      cool: line('影が長く伸びても、今度は一人で消えない。光の方へ行く。', 'かげが ながく のびても、こんどは ひとりで きえない。ひかりの ほうへ いく。', 'Even if the shadows grow long, I will not disappear alone. I am going toward the light.'),
      cute: line('この笑顔は、今日だけの秘密。……でも、みんなには見せてもいい。', 'この えがおは、きょうだけの ひみつ。でも、みんなには みせても いい。', 'This smile is a secret just for today. …But I suppose everyone may see it.'),
      heartfelt: line('帰る場所は誰かに与えられるものじゃない。私たちで選んで、守るものだ。', 'かえる ばしょは だれかに あたえられる ものじゃない。わたしたちで えらんで、まもる ものだ。', 'A place to return to is not handed to us. It is something we choose and protect together.'),
    },
  },
  DODGEBALL: {
    name: line('浜辺を駆けるバスケ部エース', 'はまべを かける ばすけぶ ええす', 'The Basketball Ace Racing the Beach'),
    role: line('最後まで走り抜くバスケ部エース', 'さいごまで はしりぬく ばすけぶ ええす', 'the basketball ace who runs to the finish'),
    motif: line('オレンジのボールと砂の足跡', 'おれんじの ぼおると すなの あしあと', 'an orange ball and footprints in the sand'),
    finale: {
      serious: line('最後の一球は、仲間とつないだ証だ。次のコートも一緒に走ろう。', 'さいごの いっきゅうは、なかまと つないだ あかしだ。つぎの こおとも いっしょに はしろう。', 'The final ball proves what we passed between us. Let’s run onto the next court together.'),
      funny: line('ボールは取れた！　でも砂まで取るのは無理だから、みんなで掃除な！', 'ぼおるは とれた！ でも すなまで とるのは むりだから、みんなで そうじな！', 'I caught the ball! But I cannot catch all the sand, so everyone is cleaning up!'),
      cool: line('ブザーの先にもコートはある。次の一球を、もっと遠くへ飛ばす。', 'ぶざあの さきにも こおとは ある。つぎの いっきゅうを、もっと とおくへ とばす。', 'There is another court beyond the buzzer. I will send the next ball farther.'),
      cute: line('このチームの笑顔がいちばんの勝利！　写真ではボールも主役だよ。', 'この ちいむの えがおが いちばんの しょうり！ しゃしんでは ぼおるも しゅやくだよ。', 'This team’s smiles are the greatest victory! The ball gets to be a star in the photo too.'),
      heartfelt: line('また投げよう。勝つためだけじゃなく、みんなと同じ場所に立つために。', 'また なげよう。かつ ためだけじゃなく、みんなと おなじ ばしょに たつ ために。', 'Let’s throw again, not only to win, but to stand in the same place together.'),
    },
  },
  BARD: {
    name: line('潮騒を届ける放送部員', 'しおさいを とどける ほうそうぶいん', 'The Broadcaster Carrying the Sound of Waves'),
    role: line('仲間の声を届ける放送部員', 'なかまの こえを とどける ほうそうぶいん', 'the broadcaster who carries the friends’ voices'),
    motif: line('黄色いマイクと音の波', 'きいろい まいくと おとの なみ', 'a yellow microphone and waves of sound'),
    finale: {
      serious: line('海の向こうまで、私たちの声を届ける。夏の終わりも、次の始まりも。', 'うみの むこうまで、わたしたちの こえを とどける。なつの おわりも、つぎの はじまりも。', 'I will carry our voices beyond the sea—the end of summer and the next beginning.'),
      funny: line('本日の臨時放送！　転倒、迷子、かき氷、全部まとめて大成功です！', 'ほんじつの りんじ ほうそう！ てんとう、まいご、かきごおり、ぜんぶ まとめて だいせいこうです！', 'Special broadcast! Falls, lost balls, and shaved ice—everything was a huge success!'),
      cool: line('波の音も、私たちの歌も、夜が明けるまで消えない。', 'なみの おとも、わたしたちの うたも、よが あけるまで きえない。', 'Neither the waves nor our song will fade before dawn.'),
      cute: line('せーの！　この夏の思い出、みんなの笑顔で録音しよう！', 'せえの！ この なつの おもいで、みんなの えがおで ろくおん しよう！', 'Ready? Let’s record this summer memory with everyone’s smiles!'),
      heartfelt: line('声が戻ってきた。だから次は、誰かの小さな声も聞き逃さない。', 'こえが もどって きた。だから つぎは、だれかの ちいさな こえも ききのがさない。', 'Our voices returned. So next time, I will not miss anyone’s smallest voice.'),
    },
  },
  LIBRARIAN: {
    name: line('海辺のページを綴る文芸部員', 'うみべの ぺえじを つづる ぶんげいぶいん', 'The Literature Member Writing the Shoreline Pages'),
    role: line('夏の記録を綴る文芸部員', 'なつの きろくを つづる ぶんげいぶいん', 'the literature member recording the summer'),
    motif: line('紫のしおりと開いた本', 'むらさきの しおりと ひらいた ほん', 'a purple bookmark and an open book'),
    finale: {
      serious: line('この夏の記録を、次の誰かが読む物語として残します。', 'この なつの きろくを、つぎの だれかが よむ ものがたりとして のこします。', 'I will leave this summer’s record as a story for someone else to read.'),
      funny: line('本は海風で飛ぶし、しおりは砂に埋まる。だから思い出は面白いんですね。', 'ほんは うみかぜで とぶし、しおりは すなに うまる。だから おもいでは おもしろいんですね。', 'Books fly in the sea wind and bookmarks vanish in sand. That is why memories are interesting.'),
      cool: line('次のページは白紙です。だからこそ、私たちの手で書き始められる。', 'つぎの ぺえじは はくしです。だからこそ、わたしたちの てで かきはじめられる。', 'The next page is blank. That is exactly why we can begin writing it ourselves.'),
      cute: line('このしおり、みんなで選んだ貝殻の色にしたの。次のページも一緒に読もうね。', 'この しおり、みんなで えらんだ かいがらの いろに したの。つぎの ぺえじも いっしょに よもうね。', 'I made this bookmark the color of the shell we chose together. Let’s read the next page too.'),
      heartfelt: line('物語の終わりは別れではなく、次のページを開く合図です。', 'ものがたりの おわりは わかれでは なく、つぎの ぺえじを ひらく あいずです。', 'The end of a story is not a goodbye; it is a signal to open the next page.'),
    },
  },
  CHEF: {
    name: line('夏の食卓を仕上げる料理長', 'なつの しょくたくを しあげる りょうりちょう', 'The Chef Finishing the Summer Table'),
    role: line('仲間の空腹を笑顔に変える料理長', 'なかまの くうふくを えがおに かえる りょうりちょう', 'the chef who turns hunger into smiles'),
    motif: line('ピンクのおたまと湯気', 'ぴんくの おたまと ゆげ', 'a pink ladle and curling steam'),
    finale: {
      serious: line('温かい一皿があれば、帰ってこられる。次の食卓も私が守るよ。', 'あたたかい ひとさらが あれば、かえって こられる。つぎの しょくたくも わたしが まもるよ。', 'With one warm dish, everyone can come home. I will protect the next table too.'),
      funny: line('料理は大成功！　床まで味見した人は、あとでちゃんと片づけてね！', 'りょうりは だいせいこう！ ゆかまで あじみした ひとは、あとで ちゃんと かたづけてね！', 'The cooking was a success! Anyone who tasted the floor is cleaning up afterward!'),
      cool: line('炎も湯気も、最後は笑顔のために使う。それが私のレシピだ。', 'ほのおも ゆげも、さいごは えがおの ために つかう。それが わたしの れしぴだ。', 'Flame and steam are ultimately for a smile. That is my recipe.'),
      cute: line('おかわりはたっぷりあるよ。夏の思い出も、みんなで分けようね！', 'おかわりは たっぷり あるよ。なつの おもいでも、みんなで わけようね！', 'There is plenty for seconds. Let’s share the summer memories too!'),
      heartfelt: line('一緒に食べた一皿は、離れても心を温める。次の食卓でまた会おうね。', 'いっしょに たべた ひとさらは、はなれても こころを あたためる。つぎの しょくたくで また あおうね。', 'A dish shared together can warm the heart even after we part. Let’s meet again at the next table.'),
    },
  },
  GARDENER: {
    name: line('浜辺に芽吹きを運ぶ園芸部長', 'はまべに めぶきを はこぶ えんげいぶちょう', 'The Gardening Captain Bringing New Growth'),
    role: line('荒れた場所を育て直す園芸部長', 'あれた ばしょを そだてなおす えんげいぶちょう', 'the gardening captain who grows ruined places anew'),
    motif: line('若葉と大きなひまわり', 'わかばと おおきな ひまわり', 'young leaves and a towering sunflower'),
    finale: {
      serious: line('小さな芽を守れば、明日の景色は変えられる。ゆっくりでも育てていくよ。', 'ちいさな めを まもれば、あしたの けしきは かえられる。ゆっくりでも そだてて いくよ。', 'Protect a small sprout and tomorrow’s view can change. I will grow it, even slowly.'),
      funny: line('水やりは成功！　ただし、私たちまで咲きそうなくらいびしょ濡れだね！', 'みずやりは せいこう！ ただし、わたしたちまで さきそうな くらい びしょぬれだね！', 'Watering succeeded! Though we are soaked enough to bloom ourselves!'),
      cool: line('花が道を描くなら、私はその先まで歩ける庭を育てる。', 'はなが みちを えがくなら、わたしは その さきまで あるける にわを そだてる。', 'If flowers draw the road, I will grow a garden we can walk beyond.'),
      cute: line('この貝殻みたいな花鉢、みんなで育てた夏のしるしにしようね。', 'この かいがら みたいな はちうえ、みんなで そだてた なつの しるしに しようね。', 'Let’s make this shell-like flowerpot a sign of the summer we grew together.'),
      heartfelt: line('守った季節は、次の誰かの春になる。花を未来へ手渡そう。', 'まもった きせつは、つぎの だれかの はるに なる。はなを みらいへ てわたそう。', 'The season we protected will become someone else’s spring. Let’s pass these flowers to the future.'),
    },
  },
  MAGE: {
    name: line('海辺の反応を解く化学研究会長', 'うみべの はんのうを とく かがく けんきゅうかいちょう', 'The Chemistry President Reading the Shoreline Reaction'),
    role: line('魔法と科学をつなぐ化学研究会長', 'まほうと かがくを つなぐ かがく けんきゅうかいちょう', 'the chemistry president connecting magic and science'),
    motif: line('青いフラスコと星型の火花', 'あおい ふらすこと ほしがたの ひばな', 'a blue flask and star-shaped sparks'),
    finale: {
      serious: line('観察した夏を仮説で終わらせない。次は、みんなの未来で検証する。', 'かんさつした なつを かせつで おわらせない。つぎは、みんなの みらいで けんしょうする。', 'I will not leave this observed summer as a hypothesis. Next, I will test it in everyone’s future.'),
      funny: line('泡は増えたけど実験は成功！　掃除までが研究の一部だからね！', 'あわは ふえたけど じっけんは せいこう！ そうじまでが けんきゅうの いちぶだからね！', 'The foam increased, but the experiment succeeded! Cleanup is part of research too!'),
      cool: line('海と星の反応は解けた。答えは、次の場所で確かめよう。', 'うみと ほしの はんのうは とけた。こたえは、つぎの ばしょで たしかめよう。', 'The reaction between sea and stars is solved. Let’s verify the answer at the next place.'),
      cute: line('星型の火花も、みんなの笑顔も、成功記録に大きく丸をつけるよ！', 'ほしがたの ひばなも、みんなの えがおも、せいこう きろくに おおきく まるを つけるよ！', 'Star-shaped sparks and everyone’s smiles both get a huge circle in the success log!'),
      heartfelt: line('学んだことは、次に困る誰かを照らす光になる。これを手渡していこう。', 'まなんだ ことは、つぎに こまる だれかを てらす ひかりに なる。これを てわたして いこう。', 'What we learn becomes light for someone who struggles next. Let’s pass it on.'),
    },
  },
};

const TONE_PROFILES: Record<VacationEndingToneId, VacationToneProfile> = {
  serious: {
    pages: [
      { title: line('夜の浜辺で', 'よるの はまべで', 'On the Night Shore'), scene: line('__NAME__は夜の海辺で静かな波と灯りを見つめた。__ROLE__として、戦いのあとに残ったものを確かめる。', '__NAME__は よるの うみべで しずかな なみと あかりを みつめた。__ROLE__として、たたかいの あとに のこった ものを たしかめる。', '__NAME__ watched the quiet waves and lanterns at night. As __ROLE__, they checked what remained after the battle.') },
      { title: line('灯りのそばで', 'あかりの そばで', 'Beside the Lantern'), scene: line('仲間が休むキャンプのそばで、__NAME__は小さな灯りを守った。__MOTIF__が、次の朝までの目印になる。', 'なかまが やすむ きゃんぷの そばで、__NAME__は ちいさな あかりを まもった。__MOTIF__が、つぎの あさまでの めじるしに なる。', 'Beside the camp where the friends rested, __NAME__ guarded a small light. __MOTIF__ became a guide until morning.') },
      { title: line('灯台の向こうへ', 'とうだいの むこうへ', 'Beyond the Lighthouse'), scene: line('夜明けの灯台へ歩きながら、__NAME__は守った夏を胸に刻み、次の一歩を選んだ。', 'よあけの とうだいへ あるきながら、__NAME__は まもった なつを むねに きざみ、つぎの いっぽを えらんだ。', 'Walking toward the lighthouse at dawn, __NAME__ held the protected summer close and chose the next step.') },
    ],
    dialogue: [
      line('「__MOTIF__を胸に、次の一歩の目印を持ち帰る。」', '「__MOTIF__を むねに、つぎの いっぽの めじるしを もちかえる。」', '“I will carry __MOTIF__ home as a marker for our next step.”'),
      line('「__ROLE__として、仲間と見つけた海を明日も守る。」', '「__ROLE__として、なかまと みつけた うみを あしたも まもる。」', '“As __ROLE__, I will protect the sea we found together tomorrow too.”'),
      null,
    ],
  },
  funny: {
    pages: [
      { title: line('水しぶきの勝利', 'みずしぶきの しょうり', 'Victory in the Splash'), scene: line('海辺の祭りで、__NAME__は水しぶきと歓声に巻き込まれた。__ROLE__の真剣さまで、今日は笑いに変わる。', 'うみべの まつりで、__NAME__は みずしぶきと かんせいに まきこまれた。__ROLE__の しんけんさまで、きょうは わらいに かわる。', 'At the seaside festival, __NAME__ was caught in splashes and cheers. Even the seriousness of __ROLE__ turned into laughter today.') },
      { title: line('溶ける前に', 'とける まえに', 'Before It Melts'), scene: line('売店のかき氷を隠そうとした__NAME__は、結局みんなに見つかった。__MOTIF__にも甘い夏の記録が残る。', 'ばいてんの かきごおりを かくそうとした __NAME__は、けっきょく みんなに みつかった。__MOTIF__にも あまい なつの きろくが のこる。', '__NAME__ tried to hide a shaved ice from the snack stand, but everyone found out. Even __MOTIF__ kept a sweet summer record.') },
      { title: line('砂浜のあとしまつ', 'すなはまの あとしまつ', 'Beach Cleanup After the Legend'), scene: line('逃げたビーチボールを追いかけた__NAME__は、砂浜の片づけまで仲間と楽しんだ。', 'にげた びいちぼおるを おいかけた __NAME__は、すなはまの かたづけまで なかまと たのしんだ。', '__NAME__ chased a runaway beach ball and enjoyed cleaning the shore with the friends afterward.') },
    ],
    dialogue: [
      line('「__MOTIF__まで水しぶきだらけ！　勝利なら何度浴びてもいいよね！」', '「__MOTIF__まで みずしぶきだらけ！ しょうりなら なんど あびても いいよね！」', '“Even __MOTIF__ is covered in spray! If it is victory, we can get soaked again!”'),
      line('「__ROLE__の休憩はかき氷半分こ。こぼした分は思い出ってことで！」', '「__ROLE__の きゅうけいは かきごおり はんぶんこ。こぼした ぶんは おもいでって ことで！」', '“A break for __ROLE__ means sharing shaved ice. The spilled part counts as a memory!”'),
      null,
    ],
  },
  cool: {
    pages: [
      { title: line('青い時間', 'あおい じかん', 'Blue Hour'), scene: line('青い夕暮れのリゾート屋上で、__NAME__は海と灯台の光を静かに見下ろした。', 'あおい ゆうぐれの りぞおと おくじょうで、__NAME__は うみと とうだいの ひかりを しずかに みおろした。', 'On a resort rooftop at blue hour, __NAME__ quietly looked down over the sea and lighthouse beam.') },
      { title: line('月明かりの桟橋', 'つきあかりの さんばし', 'The Moonlit Pier'), scene: line('月明かりの桟橋で光る波を見つめ、__NAME__は__MOTIF__を風に預けた。', 'つきあかりの さんばしで ひかる なみを みつめ、__NAME__は __MOTIF__を かぜに あずけた。', 'Watching luminous waves at the moonlit pier, __NAME__ let __MOTIF__ drift in the wind.') },
      { title: line('海辺の駅から', 'うみべの えきから', 'From the Coastal Station'), scene: line('夜明けの海辺の駅で、__NAME__は友だちへ振り返り、次の旅へ向かう列車を待った。', 'よあけの うみべの えきで、__NAME__は ともだちへ ふりかえり、つぎの たびへ むかう れっしゃを まった。', 'At the coastal station at dawn, __NAME__ looked back at the friends and waited for the train to the next journey.') },
    ],
    dialogue: [
      line('「__ROLE__の足音が止まった時に、ここで得たものが見える。」', '「__ROLE__の あしおとが とまった ときに、ここで えた ものが みえる。」', '“When the footsteps of __ROLE__ fall silent, I can see what we gained here.”'),
      line('「月明かりなら、__MOTIF__に隠した答えも見失わない。」', '「つきあかりなら、__MOTIF__に かくした こたえも みうしなわない。」', '“Under moonlight, I will not lose the answer hidden in __MOTIF__.”'),
      null,
    ],
  },
  cute: {
    pages: [
      { title: line('貝殻のピクニック', 'かいがらの ぴくにっく', 'A Shell Picnic'), scene: line('貝殻を並べた浜辺のピクニックで、__NAME__は仲間と海鳥に囲まれた。__MOTIF__も夏の飾りになる。', 'かいがらを ならべた はまべの ぴくにっくで、__NAME__は なかまと うみどりに かこまれた。__MOTIF__も なつの かざりに なる。', 'At a shell picnic, __NAME__ was surrounded by friends and seabirds. __MOTIF__ became part of the summer decorations.') },
      { title: line('旅のしおり', 'たびの しおり', 'The Travel Journal'), scene: line('仲間と旅のしおりを飾りながら、__NAME__は忘れたくない一日を一ページずつ残した。', 'なかまと たびの しおりを かざりながら、__NAME__は わすれたくない いちにちを いちぺえじずつ のこした。', 'Decorating a travel journal with the friends, __NAME__ saved the day they never wanted to forget one page at a time.') },
      { title: line('小さな命を海へ', 'ちいさな いのちを うみへ', 'A Small Life Returned to the Sea'), scene: line('朝の浜辺で小さな海の生き物を見送った__NAME__は、仲間と優しい夏の約束を結んだ。', 'あさの はまべで ちいさな うみの いきものを みおくった __NAME__は、なかまと やさしい なつの やくそくを むすんだ。', 'At the morning shore, __NAME__ returned a small sea creature to the water and made a gentle summer promise with the friends.') },
    ],
    dialogue: [
      line('「__MOTIF__みたいに小さな幸せも、ちゃんと拾って帰ろう。」', '「__MOTIF__みたいに ちいさな しあわせも、ちゃんと ひろって かえろう。」', '“Let’s pick up even the small happinesses, like __MOTIF__, and take them home.”'),
      line('「__ROLE__の夏のページを、みんなの笑顔でいっぱいにしたいな。」', '「__ROLE__の なつの ぺえじを、みんなの えがおで いっぱいに したいな。」', '“I want to fill the summer page of __ROLE__ with everyone’s smiles.”'),
      null,
    ],
  },
  heartfelt: {
    pages: [
      { title: line('夕焼けの約束', 'ゆうやけの やくそく', 'A Sunset Promise'), scene: line('夕焼けの浜辺で仲間と腕をつなぎ、__NAME__は一緒に過ごした夏の重みを感じた。', 'ゆうやけの はまべで なかまと うでを つなぎ、__NAME__は いっしょに すごした なつの おもみを かんじた。', 'Linking arms with the friends at sunset, __NAME__ felt the weight of the summer they shared.') },
      { title: line('言葉のない贈り物', 'ことばの ない おくりもの', 'A Gift Without Words'), scene: line('海辺のカフェで何も書かれていない記念カードを受け取り、__NAME__は言葉以上の感謝を受け止めた。', 'うみべの かふぇで なにも かかれて いない きねん かあどを うけとり、__NAME__は ことば いじょうの かんしゃを うけとめた。', 'At a seaside café, __NAME__ received a blank keepsake card and understood gratitude beyond words.') },
      { title: line('次の朝へ', 'つぎの あさへ', 'Toward the Next Morning'), scene: line('海を離れる朝の道で、__NAME__は仲間と歩幅を合わせ、次に会う約束を胸へしまった。', 'うみを はなれる あさの みちで、__NAME__は なかまと ほはばを あわせ、つぎに あう やくそくを むねへ しまった。', 'On the morning road away from the coast, __NAME__ matched the friends’ pace and carried the promise to meet again close to the heart.') },
    ],
    dialogue: [
      line('「__ROLE__として過ごしたこの夏が終わっても、つないだ手は離れない。」', '「__ROLE__として すごした この なつが おわっても、つないだ ては はなれない。」', '“Even when the summer shared as __ROLE__ ends, I will not let go of the joined hands.”'),
      line('「__MOTIF__のそばに残る気持ちは、書かれていなくても伝わるんだね。」', '「__MOTIF__の そばに のこる きもちは、かかれて いなくても つたわるんだね。」', '“The feeling left beside __MOTIF__ can reach the heart even when it is unwritten.”'),
      null,
    ],
  },
};

const replaceTokens = (value: string, profile: VacationCharacterProfile, field: 'name' | 'role' | 'motif', locale: 'ja' | 'hira' | 'en') => value
  .replaceAll('__NAME__', profile.name[locale])
  .replaceAll('__ROLE__', profile.role[locale])
  .replaceAll('__MOTIF__', profile.motif[locale])
  .replaceAll('__FIELD__', profile[field][locale]);

const createPage = (
  page: VacationToneProfile['pages'][number],
  dialogue: LocalizedLine | null,
  profile: VacationCharacterProfile,
  locale: 'ja' | 'hira' | 'en',
): { title: string; text: string; dialogue?: string } => ({
  title: page.title[locale],
  text: replaceTokens(page.scene[locale], profile, 'motif', locale),
  ...(dialogue ? { dialogue: replaceTokens(dialogue[locale], profile, 'motif', locale) } : {}),
});

export const getVacationEndingPages = (
  characterId: string,
  tone: VacationEndingToneId,
): Array<ThemedEndingPage & { dialogue?: string; dialogueHiragana?: string; dialogueEnglish?: string }> => {
  const profile = CHARACTER_PROFILES[characterId] ?? CHARACTER_PROFILES.WARRIOR;
  const toneProfile = TONE_PROFILES[tone];
  return toneProfile.pages.map((page, index) => {
    const dialogue = toneProfile.dialogue[index] ?? profile.finale[tone];
    const ja = createPage(page, dialogue, profile, 'ja');
    const hira = createPage(page, dialogue, profile, 'hira');
    const en = createPage(page, dialogue, profile, 'en');
    if (index === 2) {
      ja.text = `${ja.text} 「${profile.finale[tone].ja}」`;
      hira.text = `${hira.text} 「${profile.finale[tone].hira}」`;
      en.text = `${en.text} “${profile.finale[tone].en}”`;
    }
    return {
      title: ja.title,
      titleHiragana: hira.title,
      titleEnglish: en.title,
      text: ja.text,
      textHiragana: hira.text,
      textEnglish: en.text,
      dialogue: ja.dialogue,
      dialogueHiragana: hira.dialogue,
      dialogueEnglish: en.dialogue,
      imagePath: '',
    };
  });
};

export const getVacationEndingDialogue = (characterId: string, tone: VacationEndingToneId) => {
  const profile = CHARACTER_PROFILES[characterId] ?? CHARACTER_PROFILES.WARRIOR;
  return profile.finale[tone];
};

export type MagicVacationCommonEndingPage = {
  title: LocalizedLine;
  description: LocalizedLine;
  dialogue: LocalizedLine;
};

export const MAGIC_VACATION_COMMON_ENDING_PAGES: MagicVacationCommonEndingPage[] = [
  {
    title: line('潮風の帰還', 'しおかぜの きかん', 'Return on the Sea Wind'),
    description: line('決戦のあと、海辺の灯りがゆっくりと日常を照らし始めた。魔法の痕跡は消えても、仲間と過ごした夏の記憶は残っている。', 'けっせんの あと、うみべの あかりが ゆっくりと にちじょうを てらし はじめた。まほうの こんせきは きえても、なかまと すごした なつの きおくは のこって いる。', 'After the final battle, seaside lights began to illuminate ordinary life again. The magic faded, but the summer shared with friends remained.'),
    dialogue: line('「魔法が消えても、この夏を選んだ気持ちは消えないよ。」', '「まほうが きえても、この なつを えらんだ きもちは きえないよ。」', '“Even if the magic fades, the feeling that chose this summer will remain.”'),
  },
  {
    title: line('水平線に結ぶ約束', 'すいへいせんに むすぶ やくそく', 'A Promise on the Horizon'),
    description: line('砂浜に並んだ仲間たちは、二つの世界の境界を越えて続く次の旅を思い描いた。帰る場所は一つではない。', 'すなはまに ならんだ なかまたちは、ふたつの せかいの きょうかいを こえて つづく つぎの たびを おもいえがいた。かえる ばしょは ひとつでは ない。', 'Standing together on the beach, the friends imagined the next journey beyond the boundary of two worlds. There was more than one place to call home.'),
    dialogue: line('「次に会う場所を、海の向こうにも星の向こうにも作ろう。」', '「つぎに あう ばしょを、うみの むこうにも ほしの むこうにも つくろう。」', '“Let’s make places to meet again beyond the sea and beyond the stars.”'),
  },
  {
    title: line('夏の魔法、明日へ', 'なつの まほう、あしたへ', 'Summer Magic, Toward Tomorrow'),
    description: line('朝の光が海を越え、学園へ戻る道を照らした。使命も学びも思い出も、次の季節へ持っていける魔法になる。', 'あさの ひかりが うみを こえ、がくえんへ もどる みちを てらした。しめいも まなびも おもいでも、つぎの きせつへ もって いける まほうに なる。', 'Morning light crossed the sea and lit the road back to the academy. Duty, learning, and memories became magic to carry into the next season.'),
    dialogue: line('「この夏の続きを、私たちの明日として始めよう。」', '「この なつの つづきを、わたしたちの あしたとして はじめよう。」', '“Let’s begin the continuation of this summer as our tomorrow.”'),
  },
];
