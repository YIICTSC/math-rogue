import type { VisualThemeId } from './visualThemes';
import { ENDING_PAGE_COPY } from './endingSceneCopy';
import { ENDING_PAGE_LOCALIZED_COPY } from './endingSceneLocalizedCopy';

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
  WARRIOR: { elementary: '教室の先頭に立つわんぱく小学生', elementaryHiragana: 'きょうしつの せんとうに たつ わんぱくしょうがくせい', elementaryEnglish: 'the spirited grade-school leader standing at the front of the classroom', highSchool: '学園を解放した反逆の高校生', highSchoolHiragana: 'がくえんを かいほうした はんぎゃくの こうこうせい', highSchoolEnglish: 'the rebellious high-school student who liberated the academy', elementaryName: 'わんぱく小学生', elementaryNameHiragana: 'わんぱくしょうがくせい', elementaryNameEnglish: 'Spirited Student', highSchoolName: '反逆の高校生', highSchoolNameHiragana: 'はんぎゃくのこうこうせい', highSchoolNameEnglish: 'Rebel Student', motif: '赤い帽子と朝日', motifHiragana: 'あかい ぼうしと あさひ', motifEnglish: 'a red cap and the sunrise' },
  CARETAKER: { elementary: '動物たちと帰る飼育委員', elementaryHiragana: 'どうぶつたちと かえる しいくいいん', elementaryEnglish: 'the animal caretaker returning with the school animals', highSchool: '新しい命の記録を始める生物部の先輩', highSchoolHiragana: 'あたらしい いのちの きろくを はじめる せいぶつぶの せんぱい', highSchoolEnglish: 'the biology-club senior beginning a new record of life', elementaryName: '飼育委員', elementaryNameHiragana: 'しいくいいん', elementaryNameEnglish: 'Animal Caretaker', highSchoolName: '生物部の先輩', highSchoolNameHiragana: 'せいぶつぶのせんぱい', highSchoolNameEnglish: 'Biology Club Senior', motif: '羽根と観察ノート', motifHiragana: 'はねと かんさつのおと', motifEnglish: 'a feather and an observation notebook' },
  ASSASSIN: { elementary: '仲間に本当の笑顔を見せた転校生', elementaryHiragana: 'なかまに ほんとうの えがおを みせた てんこうせい', elementaryEnglish: 'the transfer student finally showing a true smile to friends', highSchool: '過去を超えて学園に残る謎めく転入生', highSchoolHiragana: 'かこを こえて がくえんに のこる なぞめく てんにゅうせい', highSchoolEnglish: 'the mysterious transfer student who overcame the past and chose to stay', elementaryName: '転校生', elementaryNameHiragana: 'てんこうせい', elementaryNameEnglish: 'Transfer Student', highSchoolName: '謎めく転入生', highSchoolNameHiragana: 'なぞめくてんにゅうせい', highSchoolNameEnglish: 'Mysterious Transfer Student', motif: '黒いスカーフと仲間の影', motifHiragana: 'くろい すかあふと なかまの かげ', motifEnglish: 'a dark scarf and the shadows of friends' },
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

// Each illustration set tells a different story. Keep the first page tied to
// the character and tone instead of forcing every hero through one shared beat.
const CHARACTER_TONE_SCENE: Record<string, Record<string, LocalizedEndingLine>> = {
  WARRIOR: {
    serious: { ja: '傷ついた校舎の先頭で立ち止まり、仲間が安心して歩ける道を選んだ。', hira: 'きずついた こうしゃの せんとうで たちどまり、なかまが あんしんして あるける みちを えらんだ。', en: 'At the head of the damaged school, the leader chose a path everyone could walk safely.' },
    funny: { ja: '勢いよく勝利を宣言した拍子に道具を散らかし、仲間と腹を抱えて笑った。', hira: 'いきおいよく しょうりを せんげんした ひょうしに どうぐを ちらかし、なかまと はらを かかえて わらった。', en: 'A triumphant shout sent the equipment flying, and everyone burst out laughing.' },
    cool: { ja: '最後の力をまっすぐ解き放ち、開いた道の先へ誰より早く踏み出した。', hira: 'さいごの ちからを まっすぐ ときはなち、ひらいた みちの さきへ だれより はやく ふみだした。', en: 'The leader unleashed one final burst of power and stepped first onto the open road.' },
    cute: { ja: '仲間が飾った教室の真ん中で、赤い帽子を直しながら照れくさそうに笑った。', hira: 'なかまが かざった きょうしつの まんなかで、あかい ぼうしを なおしながら てれくさそうに わらった。', en: 'In the decorated classroom, the leader adjusted the red cap and smiled bashfully.' },
    heartfelt: { ja: '仲間の笑顔を見届け、朝日の差す校門で守り抜いた日常をかみしめた。', hira: 'なかまの えがおを みとどけ、あさひの さす こうもんで まもりぬいた にちじょうを かみしめた。', en: 'At the sunlit gate, the leader took in the ordinary life they had protected.' },
  },
  CARETAKER: {
    serious: { ja: '静かになった飼育場所を見回り、怯えていた動物たちへそっと手を差し出した。', hira: 'しずかに なった しいくばしょを みまわり、おびえていた どうぶつたちへ そっと てを さしだした。', en: 'The caretaker inspected the quiet animal area and gently reached toward the frightened animals.' },
    funny: { ja: '安心した動物たちに一斉に囲まれ、観察ノートごと転びながら笑い声を上げた。', hira: 'あんしんした どうぶつたちに いっせいに かこまれ、かんさつのおとごと ころびながら わらいごえを あげた。', en: 'The relieved animals swarmed the caretaker, sending notebook and hero tumbling into laughter.' },
    cool: { ja: '舞い上がる羽根の中で動物たちを導き、荒れた場所を迷いなく歩き抜けた。', hira: 'まいあがる はねの なかで どうぶつたちを みちびき、あれた ばしょを まよいなく あるきぬけた。', en: 'Amid swirling feathers, the caretaker led the animals through the ruined grounds without hesitation.' },
    cute: { ja: '動物たちと仲間から手作りの飾りを贈られ、観察ノートに笑顔を描き足した。', hira: 'どうぶつたちと なかまから てづくりの かざりを おくられ、かんさつのおとに えがおを かきたした。', en: 'Given handmade decorations by friends and animals, the caretaker added a smiling sketch to the notebook.' },
    heartfelt: { ja: '戻ってきた小さな命のぬくもりを抱き、観察ノートに新しい一日を記した。', hira: 'もどってきた ちいさな いのちの ぬくもりを だき、かんさつのおとに あたらしい いちにちを しるした。', en: 'Holding the warmth of a life returned, the caretaker recorded a new day in the observation notebook.' },
  },
  ASSASSIN: {
    serious: { ja: '長く隠していた顔を上げ、仲間と同じ場所に残ることを自分で選んだ。', hira: 'ながく かくしていた かおを あげ、なかまと おなじ ばしょに のこることを じぶんで えらんだ。', en: 'The transfer student finally looked up and chose to remain beside the others.' },
    funny: { ja: '格好よく姿を消すはずが仲間に見つかり、取り囲まれて思わず吹き出した。', hira: 'かっこうよく すがたを けす はずが なかまに みつかり、とりかこまれて おもわず ふきだした。', en: 'A stylish disappearance failed when friends found the hiding place, drawing an unexpected laugh.' },
    cool: { ja: '黒いスカーフを翻して最後の影を断ち、光の差す出口へ歩き出した。', hira: 'くろい すかあふを ひるがえして さいごの かげを たち、ひかりの さす でぐちへ あるきだした。', en: 'With a sweep of the dark scarf, the transfer student cut through the final shadow and walked toward the light.' },
    cute: { ja: '仲間が用意した飾りと写真に囲まれ、隠していたやわらかな笑顔を見せた。', hira: 'なかまが よういした かざりと しゃしんに かこまれ、かくしていた やわらかな えがおを みせた。', en: 'Surrounded by decorations and photographs, the transfer student revealed a long-hidden gentle smile.' },
    heartfelt: { ja: '並んで伸びる仲間の影を見つめ、ここを帰る場所にしていいのだと知った。', hira: 'ならんで のびる なかまの かげを みつめ、ここを かえる ばしょに していいのだと しった。', en: 'Watching the friends’ shadows stretch together, the transfer student realized this could be home.' },
  },
  DODGEBALL: {
    serious: { ja: '傷の残る体育館でボールを握り直し、最後まで立てなかった仲間の思いも受け取った。', hira: 'きずの のこる たいいくかんで ぼおるを にぎりなおし、さいごまで たてなかった なかまの おもいも うけとった。', en: 'In the scarred gym, the ace gripped the ball again and carried the hopes of every teammate.' },
    funny: { ja: '勝利の一投が思わぬ方向へ跳ね返り、みんなで逃げ回った末に大笑いした。', hira: 'しょうりの いっとうが おもわぬ ほうこうへ はねかえり、みんなで にげまわった すえに おおわらいした。', en: 'The victory throw ricocheted wildly, sending everyone running before they collapsed laughing.' },
    cool: { ja: '床を蹴って高く跳び、光をまとった最後の一球で戦いの幕を下ろした。', hira: 'ゆかを けって たかく とび、ひかりを まとった さいごの いっきゅうで たたかいの まくを おろした。', en: 'The ace leapt high and ended the battle with one final ball wrapped in light.' },
    cute: { ja: '仲間に囲まれて記念のボールを掲げ、全員そろって勝利のポーズを決めた。', hira: 'なかまに かこまれて きねんの ぼおるを かかげ、ぜんいん そろって しょうりの ぽおずを きめた。', en: 'Surrounded by teammates, the ace raised the keepsake ball for a shared victory pose.' },
    heartfelt: { ja: '静かな体育館に残る足跡をたどり、仲間とつないだ一球を胸に抱いた。', hira: 'しずかな たいいくかんに のこる あしあとを たどり、なかまと つないだ いっきゅうを むねに だいた。', en: 'Following the footprints across the quiet gym, the ace held close the ball everyone had carried together.' },
  },
  BARD: {
    serious: { ja: '静まった放送室でマイクを握り、学校中へ自分たちの本当の言葉を届けた。', hira: 'しずまった ほうそうしつで まいくを にぎり、がっこうじゅうへ じぶんたちの ほんとうの ことばを とどけた。', en: 'In the silent studio, the broadcaster took the microphone and sent their true words through the school.' },
    funny: { ja: '勝利宣言に効果音を盛りすぎて機材が大騒ぎになり、放送室が笑いに包まれた。', hira: 'しょうりせんげんに こうかおんを もりすぎて きざいが おおさわぎに なり、ほうそうしつが わらいに つつまれた。', en: 'Too many sound effects turned the victory broadcast into chaos, filling the studio with laughter.' },
    cool: { ja: '黄色いマイクから光の音波を放ち、校内に残る最後の静寂を打ち破った。', hira: 'きいろい まいくから ひかりの おんぱを はなち、こうないに のこる さいごの せいじゃくを うちやぶった。', en: 'A wave of light burst from the yellow microphone and shattered the school’s final silence.' },
    cute: { ja: '仲間の寄せ書きを読み上げるうちに声が弾み、最後は全員で記念放送をした。', hira: 'なかまの よせがきを よみあげる うちに こえが はずみ、さいごは ぜんいんで きねんほうそうを した。', en: 'Reading the friends’ messages brightened every word, ending in a joyful group broadcast.' },
    heartfelt: { ja: '誰もいない放送室で録音を聞き返し、仲間の声が戻った日常をそっと確かめた。', hira: 'だれも いない ほうそうしつで ろくおんを ききかえし、なかまの こえが もどった にちじょうを そっと たしかめた。', en: 'Alone in the studio, the broadcaster replayed the recording and heard ordinary life restored.' },
  },
  LIBRARIAN: {
    serious: { ja: '散らばった本を一冊ずつ拾い、戦いの記録を次に読む人のために残した。', hira: 'ちらばった ほんを いっさつずつ ひろい、たたかいの きろくを つぎに よむ ひとの ために のこした。', en: 'The librarian gathered every scattered book and preserved the battle for the next reader.' },
    funny: { ja: '本棚を直した途端に本が雪崩のように落ち、紙まみれの仲間と笑い合った。', hira: 'ほんだなを なおした とたんに ほんが なだれの ように おち、かみまみれの なかまと わらいあった。', en: 'The repaired shelf immediately unleashed an avalanche of books, leaving everyone laughing under the pages.' },
    cool: { ja: '開いた本から紫の光を放ち、乱れた物語を一つの結末へと書き換えた。', hira: 'ひらいた ほんから むらさきの ひかりを はなち、みだれた ものがたりを ひとつの けつまつへと かきかえた。', en: 'Purple light poured from an open book, rewriting the broken story toward its conclusion.' },
    cute: { ja: 'しおりと寄せ書きで飾られた本を受け取り、仲間の名前を大切に書き加えた。', hira: 'しおりと よせがきで かざられた ほんを うけとり、なかまの なまえを たいせつに かきくわえた。', en: 'Given a book decorated with bookmarks and messages, the librarian carefully added every friend’s name.' },
    heartfelt: { ja: '朝日の差す図書室でページをめくり、いつもの静けさが戻ったことに涙した。', hira: 'あさひの さす としょしつで ぺえじを めくり、いつもの しずけさが もどったことに なみだした。', en: 'Turning a page in the morning-lit library, the librarian wept for the return of familiar quiet.' },
  },
  CHEF: {
    serious: { ja: '壊れた食堂を見渡し、帰ってくる仲間のためにもう一度火を入れた。', hira: 'こわれた しょくどうを みわたし、かえってくる なかまの ために もういちど ひを いれた。', en: 'Looking across the damaged cafeteria, the chef lit the stove again for everyone coming home.' },
    funny: { ja: 'お祝い料理を急ぎすぎて湯気と食材が舞い上がり、みんなで鍋を追いかけた。', hira: 'おいわいりょうりを いそぎすぎて ゆげと しょくざいが まいあがり、みんなで なべを おいかけた。', en: 'Rushing the celebration meal sent steam and ingredients flying, and everyone chased the runaway pot.' },
    cool: { ja: 'おたまをひと振りして炎と湯気を操り、勝利の一皿を鮮やかに仕上げた。', hira: 'おたまを ひとふりして ほのおと ゆげを あやつり、しょうりの ひとさらを あざやかに しあげた。', en: 'With one sweep of the ladle, the chef shaped flame and steam into a brilliant victory dish.' },
    cute: { ja: '仲間と小さなお祝い料理を並べ、湯気の向こうで満足そうに笑った。', hira: 'なかまと ちいさな おいわいりょうりを ならべ、ゆげの むこうで まんぞくそうに わらった。', en: 'The chef arranged a celebration meal with friends and smiled contentedly through the steam.' },
    heartfelt: { ja: '空だった食堂に食器の音と笑い声が戻り、温かな一皿をそっと差し出した。', hira: 'からだった しょくどうに しょっきの おとと わらいごえが もどり、あたたかな ひとさらを そっと さしだした。', en: 'As clatter and laughter returned to the empty cafeteria, the chef quietly served a warm plate.' },
  },
  GARDENER: {
    serious: { ja: '踏み荒らされた土を両手で整え、明日のための種を一粒ずつまいた。', hira: 'ふみあらされた つちを りょうてで ととのえ、あしたの ための たねを ひとつぶずつ まいた。', en: 'The gardener restored the trampled soil and planted seeds one by one for tomorrow.' },
    funny: { ja: '元気になった植物が一気に伸び、つるに巻かれた仲間と顔を見合わせて笑った。', hira: 'げんきに なった しょくぶつが いっきに のび、つるに まかれた なかまと かおを みあわせて わらった。', en: 'Revived plants shot upward at once, leaving vine-tangled friends laughing at one another.' },
    cool: { ja: '地面へ手を当てると若葉が道を描き、荒れた校庭を鮮やかな緑で塗り替えた。', hira: 'じめんへ てを あてると わかばが みちを えがき、あれた こうていを あざやかな みどりで ぬりかえた。', en: 'A touch to the ground sent leaves tracing a path, repainting the ruined grounds in vivid green.' },
    cute: { ja: '仲間と育てた花に囲まれ、手作りの花冠を照れながら受け取った。', hira: 'なかまと そだてた はなに かこまれ、てづくりの はなかんむりを てれながら うけとった。', en: 'Surrounded by flowers grown together, the gardener shyly accepted a handmade flower crown.' },
    heartfelt: { ja: '朝日に向かって開くひまわりを見上げ、守った未来が育ち始めたと感じた。', hira: 'あさひに むかって ひらく ひまわりを みあげ、まもった みらいが そだちはじめたと かんじた。', en: 'Watching a sunflower open toward the morning sun, the gardener felt the protected future begin to grow.' },
  },
  MAGE: {
    serious: { ja: '静まり返った実験室で記録を確かめ、力を正しく使う新しい仮説を立てた。', hira: 'しずまりかえった じっけんしつで きろくを たしかめ、ちからを ただしく つかう あたらしい かせつを たてた。', en: 'In the silent laboratory, the scientist reviewed the results and formed a new hypothesis for using power wisely.' },
    funny: { ja: '成功の合図でフラスコが一斉に泡立ち、星型の煙に包まれて仲間と笑った。', hira: 'せいこうの あいずで ふらすこが いっせいに あわだち、ほしがたの けむりに つつまれて なかまと わらった。', en: 'At the success signal, every flask bubbled over, wrapping everyone in star-shaped smoke and laughter.' },
    cool: { ja: '青いフラスコを掲げると光の式が空中に広がり、最後の反応を完成させた。', hira: 'あおい ふらすこを かかげると ひかりの しきが くうちゅうに ひろがり、さいごの はんのうを かんせいさせた。', en: 'Raising a blue flask spread a luminous formula through the air and completed the final reaction.' },
    cute: { ja: '仲間と作った星型の飾りを実験室に並べ、成功記録へ大きな丸をつけた。', hira: 'なかまと つくった ほしがたの かざりを じっけんしつに ならべ、せいこうきろくへ おおきな まるを つけた。', en: 'The scientist hung star-shaped decorations made with friends and drew a huge circle around “success.”' },
    heartfelt: { ja: '朝の光が差す実験室で小さな火花を見つめ、学びが未来を照らすと信じた。', hira: 'あさの ひかりが さす じっけんしつで ちいさな ひばなを みつめ、まなびが みらいを てらすと しんじた。', en: 'In the morning-lit laboratory, the scientist watched a small spark and trusted learning to light the future.' },
  },
};

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
    const characterScene = CHARACTER_TONE_SCENE[safeCharacterId]?.[ending.id] ?? {
      ja: ending.beat,
      hira: ending.beatHiragana,
      en: ending.beatEnglish,
    };
    const characterVoice = CHARACTER_FINALE_VOICE[safeCharacterId]?.[theme]
      ?? CHARACTER_FINALE_VOICE.WARRIOR[theme];
    const toneResolution = FINALE_TONE_RESOLUTION[theme][ending.id]
      ?? FINALE_TONE_RESOLUTION[theme].serious;
    const pageCopy = ENDING_PAGE_COPY[theme]?.[safeCharacterId]?.[ending.id];
    const localizedPageCopy = ENDING_PAGE_LOCALIZED_COPY[theme]?.[safeCharacterId]?.[ending.id];
    const japanesePageCopy = (pageIndex: number, fallback: string): string =>
      (pageCopy?.[pageIndex] ?? fallback)
        .replaceAll('主人公名', name || characterName)
        .replaceAll('主人公', name || characterName);
    const localizedPageText = (
      pageIndex: number,
      language: 'HIRAGANA' | 'ENGLISH',
      fallback: string,
    ): string => {
      const pages = language === 'HIRAGANA' ? localizedPageCopy?.[0] : localizedPageCopy?.[1];
      const localizedName = language === 'HIRAGANA' ? nameHiragana : nameEnglish;
      return (pages?.[pageIndex] ?? fallback).replaceAll('__NAME__', localizedName);
    };
    return {
      id: ending.id,
      tone: ending.tone,
      pages: [
      {
        title: ending.title,
        titleHiragana: ending.titleHiragana,
        titleEnglish: ending.titleEnglish,
        text: japanesePageCopy(0, `${name || characterName}は校長との最後の戦いを終えた。${characterScene.ja}`),
        textHiragana: localizedPageText(0, 'HIRAGANA', `${nameHiragana}は こうちょうとの さいごの たたかいを おえた。${characterScene.hira}`),
        textEnglish: localizedPageText(0, 'ENGLISH', `${nameEnglish} finished the final battle with the headmaster. ${characterScene.en}`),
        imagePath: `sprites/endings/${folder}/${safeCharacterId.toLowerCase()}/ending-${variantIndex + 1}-1.webp`,
      },
      {
        title: `${characterName}の答え`,
        titleHiragana: `${nameHiragana}の こたえ`,
        titleEnglish: `${nameEnglish}'s Answer`,
        text: japanesePageCopy(1, `${role}は、これまで集めた学びと仲間の言葉を自分の力に変えた。${profile.motif}が、新しい日々の記憶として残る。`),
        textHiragana: localizedPageText(1, 'HIRAGANA', `${roleHiragana}は、これまで あつめた まなびと なかまの ことばを じぶんの ちからに かえた。${profile.motifHiragana}が、あたらしい まいにちの きおくとして のこる。`),
        textEnglish: localizedPageText(1, 'ENGLISH', `${roleEnglish} turned every lesson and every friend's words into personal strength. ${profile.motifEnglish} remained as a memory of the new days ahead.`),
        imagePath: `sprites/endings/${folder}/${safeCharacterId.toLowerCase()}/ending-${variantIndex + 1}-2.webp`,
      },
      {
        title: 'そして、次の朝へ',
        titleHiragana: 'そして、つぎの あさへ',
        titleEnglish: 'And Then, Into a New Morning',
        text: japanesePageCopy(2, `「${characterVoice.ja} ${toneResolution.ja}」——${name || characterName}は自分らしい一歩で、校門の向こうへ進んだ。`),
        textHiragana: localizedPageText(2, 'HIRAGANA', `「${characterVoice.hira} ${toneResolution.hira}」——${nameHiragana}は じぶんらしい いっぽで、こうもんの むこうへ すすんだ。`),
        textEnglish: localizedPageText(2, 'ENGLISH', `"${characterVoice.en} ${toneResolution.en}" ${nameEnglish} stepped beyond the school gate in a way only they could.`),
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
