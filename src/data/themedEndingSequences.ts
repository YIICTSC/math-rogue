import type { VisualThemeId } from './visualThemes';

export type NonMagicEndingTheme = Exclude<VisualThemeId, 'magic'>;

export interface ThemedEndingPage {
  title: string;
  titleHiragana: string;
  titleEnglish: string;
  text: string;
  textHiragana: string;
  textEnglish: string;
  imagePath: string;
}

export interface ThemedEndingVariant {
  id: string;
  tone: '真剣' | 'コミカル' | 'クール' | 'かわいい' | '感動';
  pages: ThemedEndingPage[];
}

export interface ThemedEndingGalleryEntry {
  id: string;
  theme: NonMagicEndingTheme;
  characterId: string;
  characterName: string;
  variant: ThemedEndingVariant;
  unlockedAt: number;
}

type CharacterEndingProfile = {
  elementary: string; elementaryHiragana: string; elementaryEnglish: string;
  highSchool: string; highSchoolHiragana: string; highSchoolEnglish: string;
  elementaryName: string; elementaryNameHiragana: string; elementaryNameEnglish: string;
  highSchoolName: string; highSchoolNameHiragana: string; highSchoolNameEnglish: string;
  motif: string; motifHiragana: string; motifEnglish: string;
};

const CHARACTER_PROFILE: Record<string, CharacterEndingProfile> = {
  WARRIOR: { elementary: '教室の先頭に立つわんぱく小学生', elementaryHiragana: 'きょうしつの せんとうに たつ わんぱくしょうがくせい', elementaryEnglish: 'the spirited grade-school leader standing at the front of the classroom', highSchool: '学園を解放した反逆の高校生', highSchoolHiragana: 'がくえんを かいほうした はんぎゃくの こうこうせい', highSchoolEnglish: 'the rebellious high-school student who liberated the academy', elementaryName: 'わんぱく小学生', elementaryNameHiragana: 'わんぱくしょうがくせい', elementaryNameEnglish: 'Spirited Student', highSchoolName: '反逆の高校生', highSchoolNameHiragana: 'はんぎゃくのこうこうせい', highSchoolNameEnglish: 'Rebel Student', motif: '赤い鉛筆と朝日', motifHiragana: 'あかい えんぴつと あさひ', motifEnglish: 'a red pencil and the sunrise' },
  CARETAKER: { elementary: '動物たちと帰る飼育委員', elementaryHiragana: 'どうぶつたちと かえる しいくいいん', elementaryEnglish: 'the animal caretaker returning with the school animals', highSchool: '新しい命の記録を始める生物部の先輩', highSchoolHiragana: 'あたらしい いのちの きろくを はじめる せいぶつぶの せんぱい', highSchoolEnglish: 'the biology-club senior beginning a new record of life', elementaryName: '飼育委員', elementaryNameHiragana: 'しいくいいん', elementaryNameEnglish: 'Animal Caretaker', highSchoolName: '生物部の先輩', highSchoolNameHiragana: 'せいぶつぶのせんぱい', highSchoolNameEnglish: 'Biology Club Senior', motif: '羽根と観察ノート', motifHiragana: 'はねと かんさつのおと', motifEnglish: 'a feather and an observation notebook' },
  ASSASSIN: { elementary: '仲間に本当の笑顔を見せた転校生', elementaryHiragana: 'なかまに ほんとうの えがおを みせた てんこうせい', elementaryEnglish: 'the transfer student finally showing a true smile to friends', highSchool: '過去を超えて学園に残る謎めく転入生', highSchoolHiragana: 'かこを こえて がくえんに のこる なぞめく てんにゅうせい', highSchoolEnglish: 'the mysterious transfer student who overcame the past and chose to stay', elementaryName: '転校生', elementaryNameHiragana: 'てんこうせい', elementaryNameEnglish: 'Transfer Student', highSchoolName: '謎めく転入生', highSchoolNameHiragana: 'なぞめくてんにゅうせい', highSchoolNameEnglish: 'Mysterious Transfer Student', motif: '緑のリボンと二つの影', motifHiragana: 'みどりの りぼんと ふたつの かげ', motifEnglish: 'a green ribbon and two shadows' },
  DODGEBALL: { elementary: 'ボールを抱えたドッジボールのエース', elementaryHiragana: 'ぼおるを かかえた どっじぼおるの ええす', elementaryEnglish: 'the dodgeball ace carrying the winning ball', highSchool: '最後のブザーの先へ駆けるバスケ部エース', highSchoolHiragana: 'さいごの ぶざあの さきへ かける ばすけぶええす', highSchoolEnglish: 'the basketball ace racing beyond the final buzzer', elementaryName: 'ドッジボールのエース', elementaryNameHiragana: 'どっじぼおるのええす', elementaryNameEnglish: 'Dodgeball Ace', highSchoolName: 'バスケ部エース', highSchoolNameHiragana: 'ばすけぶええす', highSchoolNameEnglish: 'Basketball Ace', motif: 'オレンジのボールと足跡', motifHiragana: 'おれんじの ぼおると あしあと', motifEnglish: 'an orange ball and a trail of footsteps' },
  BARD: { elementary: '全校放送で未来を宣言する放送委員', elementaryHiragana: 'ぜんこうほうそうで みらいを せんげんする ほうそういいん', elementaryEnglish: 'the broadcast member declaring the future to the whole school', highSchool: '解放の声を校内に届ける放送部ディレクター', highSchoolHiragana: 'かいほうの こえを こうないに とどける ほうそうぶの でぃれくたあ', highSchoolEnglish: 'the broadcast director carrying the voice of freedom across campus', elementaryName: '放送委員', elementaryNameHiragana: 'ほうそういいん', elementaryNameEnglish: 'Broadcast Member', highSchoolName: '放送部ディレクター', highSchoolNameHiragana: 'ほうそうぶでぃれくたあ', highSchoolNameEnglish: 'Broadcast Director', motif: '黄色いマイクと音の波', motifHiragana: 'きいろい まいくと おとの なみ', motifEnglish: 'a yellow microphone and waves of sound' },
  LIBRARIAN: { elementary: '新しい物語を書き始める図書委員', elementaryHiragana: 'あたらしい ものがたりを かきはじめる としょいいん', elementaryEnglish: 'the librarian beginning a brand-new story', highSchool: '反逆の記録を次世代に残す文芸部書記', highSchoolHiragana: 'はんぎゃくの きろくを つぎの せだいに のこす ぶんげいぶしょき', highSchoolEnglish: 'the literature secretary preserving the rebellion for the next generation', elementaryName: '図書委員', elementaryNameHiragana: 'としょいいん', elementaryNameEnglish: 'Librarian', highSchoolName: '文芸部書記', highSchoolNameHiragana: 'ぶんげいぶしょき', highSchoolNameEnglish: 'Literature Secretary', motif: '紫のしおりと開いた本', motifHiragana: 'むらさきの しおりと ひらいた ほん', motifEnglish: 'a purple bookmark and an open book' },
  CHEF: { elementary: 'みんなのお祝い給食を作る給食当番リーダー', elementaryHiragana: 'みんなの おいわいきゅうしょくを つくる きゅうしょくとうばんりいだあ', elementaryEnglish: 'the lunch leader cooking a victory meal for everyone', highSchool: '卒業祝いの特別メニューを仕上げる学食の料理長', highSchoolHiragana: 'そつぎょういわいの とくべつめにゅうを しあげる がくしょくの りょうりちょう', highSchoolEnglish: 'the cafeteria chef completing a special graduation menu', elementaryName: '給食当番リーダー', elementaryNameHiragana: 'きゅうしょくとうばんりいだあ', elementaryNameEnglish: 'Lunch Leader', highSchoolName: '学食の料理長', highSchoolNameHiragana: 'がくしょくのりょうりちょう', highSchoolNameEnglish: 'Cafeteria Chef', motif: 'ピンクのおたまと湯気', motifHiragana: 'ぴんくの おたまと ゆげ', motifEnglish: 'a pink ladle and curling steam' },
  GARDENER: { elementary: '校庭に未来の種をまく園芸委員', elementaryHiragana: 'こうていに みらいの たねを まく えんげいいいん', elementaryEnglish: 'the gardener planting seeds for the future', highSchool: '荒れた中庭を再生させる園芸部部長', highSchoolHiragana: 'あれた なかにわを よみがえらせる えんげいぶぶちょう', highSchoolEnglish: 'the gardening captain restoring the ruined courtyard', elementaryName: '園芸委員', elementaryNameHiragana: 'えんげいいいん', elementaryNameEnglish: 'Garden Committee Member', highSchoolName: '園芸部部長', highSchoolNameHiragana: 'えんげいぶぶちょう', highSchoolNameEnglish: 'Gardening Captain', motif: '若葉と大きなひまわり', motifHiragana: 'わかばと おおきな ひまわり', motifEnglish: 'young leaves and a towering sunflower' },
  MAGE: { elementary: '新しい実験を始める理科クラブ部長', elementaryHiragana: 'あたらしい じっけんを はじめる りかくらぶぶちょう', elementaryEnglish: 'the science-club leader beginning a new experiment', highSchool: '解放された研究棟で未来を証明する化学研究会長', highSchoolHiragana: 'かいほうされた けんきゅうとうで みらいを しょうめいする かがくけんきゅうかいちょう', highSchoolEnglish: 'the chemistry president proving the future in a liberated laboratory', elementaryName: '理科クラブ部長', elementaryNameHiragana: 'りかくらぶぶちょう', elementaryNameEnglish: 'Science Club Leader', highSchoolName: '化学研究会長', highSchoolNameHiragana: 'かがくけんきゅうかいちょう', highSchoolNameEnglish: 'Chemistry President', motif: '青いフラスコと星型の火花', motifHiragana: 'あおい ふらすこと ほしがたの ひばな', motifEnglish: 'a blue flask and star-shaped sparks' },
};

export const getThemedEndingCharacterName = (
  theme: NonMagicEndingTheme,
  characterId: string,
  languageMode: 'JAPANESE' | 'HIRAGANA' | 'ENGLISH',
): string => {
  const profile = CHARACTER_PROFILE[characterId] ?? CHARACTER_PROFILE.WARRIOR;
  if (theme === 'high-school') {
    if (languageMode === 'ENGLISH') return profile.highSchoolNameEnglish;
    if (languageMode === 'HIRAGANA') return profile.highSchoolNameHiragana;
    return profile.highSchoolName;
  }
  if (languageMode === 'ENGLISH') return profile.elementaryNameEnglish;
  if (languageMode === 'HIRAGANA') return profile.elementaryNameHiragana;
  return profile.elementaryName;
};

export const getThemedEndingToneLabel = (
  tone: ThemedEndingVariant['tone'],
  languageMode: 'JAPANESE' | 'HIRAGANA' | 'ENGLISH',
): string => {
  const labels = {
    '真剣': { JAPANESE: '真剣', HIRAGANA: 'しんけん', ENGLISH: 'Serious' },
    'コミカル': { JAPANESE: 'コミカル', HIRAGANA: 'こみかる', ENGLISH: 'Comic' },
    'クール': { JAPANESE: 'クール', HIRAGANA: 'くうる', ENGLISH: 'Cool' },
    'かわいい': { JAPANESE: 'かわいい', HIRAGANA: 'かわいい', ENGLISH: 'Cute' },
    '感動': { JAPANESE: '感動', HIRAGANA: 'かんどう', ENGLISH: 'Heartfelt' },
  } as const;
  return labels[tone][languageMode];
};

const ENDING_TONES = [
  { id: 'serious', tone: '真剣' as const, title: '明日を選ぶ', titleHiragana: 'あしたを えらぶ', titleEnglish: 'Choosing Tomorrow', beat: '戦いの跡を振り返り、自分の言葉で次の一歩を決めた。', beatHiragana: 'たたかいの あとを ふりかえり、じぶんの ことばで つぎの いっぽを きめた。', beatEnglish: 'Looking back on the battle, the hero chose the next step in their own words.' },
  { id: 'funny', tone: 'コミカル' as const, title: '伝説のあとしまつ', titleHiragana: 'でんせつの あとしまつ', titleEnglish: 'Cleanup After a Legend', beat: '大事業を成し遂げた直後、忘れていた当番と宿題に気づいた。', beatHiragana: 'おおしごとを やりとげた すぐあと、わすれていた とうばんと しゅくだいに きづいた。', beatEnglish: 'Right after achieving the impossible, the hero remembered an unfinished duty and a pile of homework.' },
  { id: 'cool', tone: 'クール' as const, title: '校門の向こう側', titleHiragana: 'こうもんの むこうがわ', titleEnglish: 'Beyond the School Gate', beat: '歓声に背を向け、沈む夕日の中を静かに歩き出した。', beatHiragana: 'かんせいに せを むけ、しずむ ゆうひの なかを しずかに あるきだした。', beatEnglish: 'Turning away from the cheers, the hero walked quietly into the setting sun.' },
  { id: 'cute', tone: 'かわいい' as const, title: 'みんなの秘密のお祝い', titleHiragana: 'みんなの ひみつの おいわい', titleEnglish: "Everyone's Secret Celebration", beat: '仲間たちの手作り飾りと寄せ書きに囲まれ、照れながら笑った。', beatHiragana: 'なかまたちの てづくりかざりと よせがきに かこまれ、てれながら わらった。', beatEnglish: 'Surrounded by handmade decorations and messages from friends, the hero smiled shyly.' },
  { id: 'heartfelt', tone: '感動' as const, title: '窓から差す光', titleHiragana: 'まどから さす ひかり', titleEnglish: 'Light Through the Window', beat: '守りたかった日常が戻り、誰もいない教室でその実感をかみしめた。', beatHiragana: 'まもりたかった まいにちが もどり、だれも いない きょうしつで その よろこびを かみしめた。', beatEnglish: 'Everyday life returned. In the empty classroom, the hero quietly felt the joy of what had been protected.' },
];

type LocalizedEndingLine = { ja: string; hira: string; en: string };

const CHARACTER_FINALE_VOICE: Record<string, Record<NonMagicEndingTheme, LocalizedEndingLine>> = {
  WARRIOR: {
    elementary: { ja: 'よーし、校門まで競争だ！ ぼくが一番に決まってる！', hira: 'よーし、こうもんまで きょうそうだ！ ぼくが いちばんに きまってる！', en: "All right, race you to the school gate! I'm obviously coming first!" },
    'high-school': { ja: '校長を倒して終わりじゃない。明日の校則は、俺たちで書く。', hira: 'こうちょうを たおして おわりじゃない。あしたの こうそくは、おれたちで かく。', en: "Beating the principal isn't the end. We write tomorrow's school rules ourselves." },
  },
  CARETAKER: {
    elementary: { ja: '飼育小屋のみんなにも、ちゃんと「ただいま」を言わなきゃ。', hira: 'しいくごやの みんなにも、ちゃんと「ただいま」を いわなきゃ。', en: 'I still need to tell every animal in the school pen that we made it home.' },
    'high-school': { ja: '傷ついた学園も、生きている。ここからまた、育て直せばいい。', hira: 'きずついた がくえんも、いきている。ここから また、そだてなおせばいい。', en: 'This wounded academy is still alive. We can nurture it back from here.' },
  },
  ASSASSIN: {
    elementary: { ja: 'ここなら、もう隠れなくていいんだね。みんなの横を歩いてみたい。', hira: 'ここなら、もう かくれなくていいんだね。みんなの よこを あるいてみたい。', en: "I don't have to hide here anymore. I want to walk beside everyone." },
    'high-school': { ja: '過去は消せない。でも、これからどこへ行くかは、私が選べる。', hira: 'かこは けせない。でも、これから どこへ いくかは、わたしが えらべる。', en: "I can't erase the past, but I can choose where I go from here." },
  },
  DODGEBALL: {
    elementary: { ja: '最後の一球は、みんなとつないだ勝利球だ！ ぜったいに離さないぞ！', hira: 'さいごの いっきゅうは、みんなと つないだ しょうりきゅうだ！ ぜったいに はなさないぞ！', en: "That last throw was our victory ball! I'm never letting it go!" },
    'high-school': { ja: 'ブザーは鳴った。でも、俺たちのゲームは延長戦ここからだ。', hira: 'ブザーは なった。でも、おれたちの ゲームは えんちょうせん ここからだ。', en: "The buzzer sounded, but our game goes into overtime from here." },
  },
  BARD: {
    elementary: { ja: '全校のみんな、聞こえますか？ 今日の大ニュースは、ぼくたちの大勝利です！', hira: 'ぜんこうの みんな、きこえますか？ きょうの だいニュースは、ぼくたちの だいしょうりです！', en: 'Attention, everyone in school! Today’s top story is our enormous victory!' },
    'high-school': { ja: 'マイクは切らない。次は、この学園の本当の声を放送する番だ。', hira: 'マイクは きらない。つぎは、この がくえんの ほんとうの こえを ほうそうする ばんだ。', en: "I'm keeping the microphone live. Now this academy gets to hear its real voice." },
  },
  LIBRARIAN: {
    elementary: { ja: '今日のしおりはここ。次のページは、みんなで書き込もう。', hira: 'きょうの しおりは ここ。つぎの ページは、みんなで かきこもう。', en: "Today's bookmark goes here. We'll write the next page together." },
    'high-school': { ja: 'この反逆は終章じゃない。次の世代に渡す、新しい序文だ。', hira: 'この はんぎゃくは しゅうしょうじゃない。つぎの せだいに わたす、あたらしい じょぶんだ。', en: "This rebellion isn't the final chapter. It's a new prologue for those who follow." },
  },
  CHEF: {
    elementary: { ja: '勝利のおかわり、みんなの分まで大盛りにするよ！', hira: 'しょうりの おかわり、みんなの ぶんまで おおもりに するよ！', en: "Seconds on victory for everyone—I'm serving extra-large portions!" },
    'high-school': { ja: '自由の味は、まだ仕上げが足りない。みんなが笑うまでが俺のレシピだ。', hira: 'じゆうの あじは、まだ しあげが たりない。みんなが わらうまでが おれの レシピだ。', en: "Freedom still needs seasoning. My recipe isn't done until everyone smiles." },
  },
  GARDENER: {
    elementary: { ja: '明日は、校庭いっぱいに花を咲かせるんだ。みんなの好きな色で！', hira: 'あしたは、こうてい いっぱいに はなを さかせるんだ。みんなの すきな いろで！', en: "Tomorrow I'll fill the whole schoolyard with flowers in everyone's favorite colors!" },
    'high-school': { ja: '荒れた中庭にも、根は残っていた。これから咲く景色を、私が育てる。', hira: 'あれた なかにわにも、ねは のこっていた。これから さく けしきを、わたしが そだてる。', en: 'Roots survived even in the ruined courtyard. I will grow what blooms next.' },
  },
  MAGE: {
    elementary: { ja: '実験大成功！ 「みんなで力を合わせる」は、教科書に追加すべきだね！', hira: 'じっけん だいせいこう！ 「みんなで ちからを あわせる」は、きょうかしょに ついかするべきだね！', en: 'Experiment successful! "Combine everyone’s strength" belongs in the textbook!' },
    'high-school': { ja: '仮説は証明された。学びは人を縛る檔じゃない、未来を変える反応だ。', hira: 'かせつは しょうめいされた。まなびは ひとを しばる おりじゃない、みらいを かえる はんのうだ。', en: "The hypothesis is proven. Learning isn't a cage; it's a reaction that changes the future." },
  },
};

const FINALE_TONE_RESOLUTION: Record<NonMagicEndingTheme, Record<string, LocalizedEndingLine>> = {
  elementary: {
    serious: { ja: '次は、間違えた子も胸を張れる学校にする。', hira: 'つぎは、まちがえた こも むねを はれる がっこうに する。', en: "Next we'll make a school where making a mistake never makes anyone bow their head." },
    funny: { ja: 'でもその前に、忘れてた日直と宿題を大急ぎで片づけよう！', hira: 'でも そのまえに、わすれてた にっちょくと しゅくだいを おおいそぎで かたづけよう！', en: 'But first, emergency cleanup duty and the homework we completely forgot!' },
    cool: { ja: '歓声はあとでいい。じゃあ、ひと足先に行くよ。', hira: 'かんせいは あとでいい。じゃあ、ひとあし さきに いくよ。', en: "The cheers can wait. I'll see you on the other side of the gate." },
    cute: { ja: 'みんなでお祝いしよう。きらきらの寄せ書きは、ずっと宝物にする！', hira: 'みんなで おいわいしよう。きらきらの よせがきは、ずっと たからものに する！', en: "Let's celebrate together. I'll treasure every sparkling message forever!" },
    heartfelt: { ja: '守りたかったのは、このいつもの教室だったんだ。ただいま。', hira: 'まもりたかったのは、この いつもの きょうしつだったんだ。ただいま。', en: 'What I wanted to protect was this ordinary classroom. I am home.' },
  },
  'high-school': {
    serious: { ja: '次は、声を上げられない生徒の明日まで取り戻す。', hira: 'つぎは、こえを あげられない せいとの あしたまで とりもどす。', en: "Next we reclaim tomorrow for every student who still can't raise their voice." },
    funny: { ja: '伝説になる前に、停学届と壊した備品の始末書から逃げ切ろう。', hira: 'でんせつに なるまえに、ていがくとどけと こわした びひんの しまつしょから にげきろう。', en: 'Before we become legends, we should escape the suspension forms and equipment reports.' },
    cool: { ja: '拍手も感謝もいらない。開いた校門が、俺たちの答えだ。', hira: 'はくしゅも かんしゃも いらない。ひらいた こうもんが、おれたちの こたえだ。', en: "We need neither applause nor thanks. The open gate is our answer." },
    cute: { ja: '反逆の記念写真、全員笑って撮ろう。この日だけは格好つけなしだ。', hira: 'はんぎゃくの きねんしゃしん、ぜんいん わらって とろう。この ひだけは かっこうつけなしだ。', en: "Let's take a rebellion victory photo with everyone smiling. No posing cool today." },
    heartfelt: { ja: '失くしかけて、やっと分かった。ここは校舎じゃない、俺たちの居場所だ。', hira: 'なくしかけて、やっと わかった。ここは こうしゃじゃない、おれたちの いばしょだ。', en: "I understood only when we nearly lost it. This isn't just a school; it's where we belong." },
  },
};

export const getThemedEndingVariants = (
  theme: NonMagicEndingTheme,
  characterId: string,
  characterName: string,
): ThemedEndingVariant[] => {
  const safeCharacterId = CHARACTER_PROFILE[characterId] ? characterId : 'WARRIOR';
  const profile = CHARACTER_PROFILE[safeCharacterId];
  const role = theme === 'high-school' ? profile.highSchool : profile.elementary;
  const roleHiragana = theme === 'high-school' ? profile.highSchoolHiragana : profile.elementaryHiragana;
  const roleEnglish = theme === 'high-school' ? profile.highSchoolEnglish : profile.elementaryEnglish;
  const name = theme === 'high-school' ? profile.highSchoolName : profile.elementaryName;
  const nameHiragana = theme === 'high-school' ? profile.highSchoolNameHiragana : profile.elementaryNameHiragana;
  const nameEnglish = theme === 'high-school' ? profile.highSchoolNameEnglish : profile.elementaryNameEnglish;
  const folder = theme === 'high-school' ? 'high-school' : 'elementary';

  return ENDING_TONES.map((ending, variantIndex) => {
    const characterVoice = CHARACTER_FINALE_VOICE[safeCharacterId]?.[theme]
      ?? CHARACTER_FINALE_VOICE.WARRIOR[theme];
    const toneResolution = FINALE_TONE_RESOLUTION[theme][ending.id]
      ?? FINALE_TONE_RESOLUTION[theme].serious;
    return {
      id: ending.id,
      tone: ending.tone,
      pages: [
      {
        title: ending.title,
        titleHiragana: ending.titleHiragana,
        titleEnglish: ending.titleEnglish,
        text: `${name || characterName}は校長との最後の戦いを終えた。${ending.beat}`,
        textHiragana: `${nameHiragana}は こうちょうとの さいごの たたかいを おえた。${ending.beatHiragana}`,
        textEnglish: `${nameEnglish} finished the final battle with the headmaster. ${ending.beatEnglish}`,
        imagePath: `sprites/endings/${folder}/${safeCharacterId.toLowerCase()}/ending-${variantIndex + 1}-1.webp`,
      },
      {
        title: `${characterName}の答え`,
        titleHiragana: `${nameHiragana}の こたえ`,
        titleEnglish: `${nameEnglish}'s Answer`,
        text: `${role}は、これまで集めた学びと仲間の言葉を自分の力に変えた。${profile.motif}が、新しい日々の記憶として残る。`,
        textHiragana: `${roleHiragana}は、これまで あつめた まなびと なかまの ことばを じぶんの ちからに かえた。${profile.motifHiragana}が、あたらしい まいにちの きおくとして のこる。`,
        textEnglish: `${roleEnglish} turned every lesson and every friend's words into personal strength. ${profile.motifEnglish} remained as a memory of the new days ahead.`,
        imagePath: `sprites/endings/${folder}/${safeCharacterId.toLowerCase()}/ending-${variantIndex + 1}-2.webp`,
      },
      {
        title: 'そして、次の朝へ',
        titleHiragana: 'そして、つぎの あさへ',
        titleEnglish: 'And Then, Into a New Morning',
        text: `「${characterVoice.ja} ${toneResolution.ja}」——${name || characterName}は自分らしい一歩で、校門の向こうへ進んだ。`,
        textHiragana: `「${characterVoice.hira} ${toneResolution.hira}」——${nameHiragana}は じぶんらしい いっぽで、こうもんの むこうへ すすんだ。`,
        textEnglish: `"${characterVoice.en} ${toneResolution.en}" ${nameEnglish} stepped beyond the school gate in a way only they could.`,
        imagePath: `sprites/endings/${folder}/${safeCharacterId.toLowerCase()}/ending-${variantIndex + 1}-3.webp`,
      },
      ],
    };
  });
};

export const buildThemedEndingGalleryEntry = (
  theme: NonMagicEndingTheme,
  characterId: string,
  characterName: string,
  variant: ThemedEndingVariant,
  unlockedAt = Date.now(),
): ThemedEndingGalleryEntry => ({
  id: `${theme}:${characterId}:${variant.id}`,
  theme,
  characterId,
  characterName,
  variant,
  unlockedAt,
});
