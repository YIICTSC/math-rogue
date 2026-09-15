export type KanjiReadingKind = 'onyomi' | 'kunyomi';

export interface KanjiReadingVariant {
    reading: string;
    example: string;
    hint: string;
}

export interface KanjiReadingProfile {
    kanji: string;
    onyomi?: KanjiReadingVariant[];
    kunyomi?: KanjiReadingVariant[];
}

/**
 * School-level reading pairs used to turn otherwise ambiguous single-kanji
 * questions into explicit on-yomi / kun-yomi questions.
 *
 * Readings marked as outside the ordinary school reading set are not added as
 * new pairs here; their existing single-kanji problem is still made explicit
 * by registering only the reading type that the curriculum item is testing.
 */
export const KANJI_READING_PROFILES: KanjiReadingProfile[] = [
    { kanji: '車', onyomi: [{ reading: 'しゃ', example: '車道', hint: '「車道（しゃどう）」の読みを思い出そう。' }], kunyomi: [{ reading: 'くるま', example: '車', hint: 'タイヤがついて走る「車」。' }] },
    { kanji: '耳', onyomi: [{ reading: 'じ', example: '耳鼻科', hint: '「耳鼻科（じびか）」の最初の音。' }], kunyomi: [{ reading: 'みみ', example: '耳', hint: '音を聞く体の部分。' }] },
    { kanji: '雲', onyomi: [{ reading: 'うん', example: '雲海', hint: '「雲海（うんかい）」の最初の音。' }], kunyomi: [{ reading: 'くも', example: '雲', hint: '空に浮かぶ白いもの。' }] },
    { kanji: '雪', onyomi: [{ reading: 'せつ', example: '雪原', hint: '「雪原（せつげん）」の最初の音。' }], kunyomi: [{ reading: 'ゆき', example: '雪', hint: '冬に空から降るもの。' }] },
    { kanji: '星', onyomi: [{ reading: 'せい', example: '星座', hint: '「星座（せいざ）」の最初の音。' }], kunyomi: [{ reading: 'ほし', example: '星', hint: '夜空に見える星。' }] },
    { kanji: '池', onyomi: [{ reading: 'ち', example: '電池', hint: '「電池（でんち）」の最後の音。' }], kunyomi: [{ reading: 'いけ', example: '池', hint: '公園などにある水のたまり。' }] },
    { kanji: '羽', onyomi: [{ reading: 'う', example: '羽毛', hint: '「羽毛（うもう）」の最初の音。' }], kunyomi: [{ reading: 'はね', example: '鳥の羽', hint: '鳥が飛ぶときに使う羽。' }] },
    { kanji: '寺', onyomi: [{ reading: 'じ', example: '寺院', hint: '「寺院（じいん）」の最初の音。' }], kunyomi: [{ reading: 'てら', example: '寺', hint: 'お坊さんがいる寺。' }] },
    { kanji: '船', onyomi: [{ reading: 'せん', example: '船長', hint: '「船長（せんちょう）」の最初の音。' }], kunyomi: [{ reading: 'ふね', example: '船', hint: '海の上を進む船。' }] },
    { kanji: '刀', onyomi: [{ reading: 'とう', example: '日本刀', hint: '「日本刀（にほんとう）」の最後の音。' }], kunyomi: [{ reading: 'かたな', example: '刀', hint: '武士が使った刀。' }] },
    { kanji: '器', onyomi: [{ reading: 'き', example: '楽器', hint: '「楽器（がっき）」の最後の音。' }], kunyomi: [{ reading: 'うつわ', example: '器', hint: '物を入れる器。' }] },
    { kanji: '係', onyomi: [{ reading: 'けい', example: '係数', hint: '「係数（けいすう）」の最初の音。' }], kunyomi: [{ reading: 'かかり', example: '係', hint: '仕事の担当を表す「係」。' }] },
    { kanji: '湖', onyomi: [{ reading: 'こ', example: '湖畔', hint: '「湖畔（こはん）」の最初の音。' }], kunyomi: [{ reading: 'みずうみ', example: '湖', hint: '陸の中にある大きな水の集まり。' }] },
    { kanji: '港', onyomi: [{ reading: 'こう', example: '港湾', hint: '「港湾（こうわん）」の最初の音。' }], kunyomi: [{ reading: 'みなと', example: '港', hint: '船が出入りする港。' }] },
    { kanji: '祭', onyomi: [{ reading: 'さい', example: '祭日', hint: '「祭日（さいじつ）」の最初の音。' }], kunyomi: [{ reading: 'まつり', example: '祭り', hint: '地域などで行う祭り。' }] },
    { kanji: '詩', onyomi: [{ reading: 'し', example: '詩人', hint: '「詩人（しじん）」の最初の音。' }] },
    { kanji: '柱', onyomi: [{ reading: 'ちゅう', example: '円柱', hint: '「円柱（えんちゅう）」の最後の音。' }], kunyomi: [{ reading: 'はしら', example: '柱', hint: '建物を支える柱。' }] },
    { kanji: '豆', onyomi: [{ reading: 'とう', example: '豆腐', hint: '「豆腐（とうふ）」の最初の音。' }], kunyomi: [{ reading: 'まめ', example: '豆', hint: '小さく丸い食べ物の豆。' }] },
    { kanji: '島', onyomi: [{ reading: 'とう', example: '半島', hint: '「半島（はんとう）」の最後の音。' }], kunyomi: [{ reading: 'しま', example: '島', hint: '周りを海に囲まれた島。' }] },
    { kanji: '波', onyomi: [{ reading: 'ぱ', example: '電波', hint: '「電波（でんぱ）」では、音読みの「ハ」が半濁音になって「ぱ」と読む。' }], kunyomi: [{ reading: 'なみ', example: '波', hint: '海の水面にできる波。' }] },
    { kanji: '箱', kunyomi: [{ reading: 'はこ', example: '箱', hint: '物を入れる箱。' }] },
    { kanji: '鼻', onyomi: [{ reading: 'び', example: '鼻音', hint: '「鼻音（びおん）」の最初の音。' }], kunyomi: [{ reading: 'はな', example: '鼻', hint: 'においをかぐ鼻。' }] },
    { kanji: '氷', onyomi: [{ reading: 'ひょう', example: '氷山', hint: '「氷山（ひょうざん）」の最初の音。' }], kunyomi: [{ reading: 'こおり', example: '氷', hint: '水が凍ってできる氷。' }] },
    { kanji: '物', onyomi: [{ reading: 'ぶつ', example: '動物', hint: '「動物（どうぶつ）」の最後の音。' }], kunyomi: [{ reading: 'もの', example: '物', hint: '形のある物。' }] },
    { kanji: '命', onyomi: [{ reading: 'めい', example: '生命', hint: '「生命（せいめい）」の最後の音。' }], kunyomi: [{ reading: 'いのち', example: '命', hint: '生きていることを表す命。' }] },
    { kanji: '油', onyomi: [{ reading: 'ゆ', example: '石油', hint: '「石油（せきゆ）」の最後の音。' }], kunyomi: [{ reading: 'あぶら', example: '油', hint: '料理などで使う油。' }] },
    { kanji: '羊', onyomi: [{ reading: 'よう', example: '羊毛', hint: '「羊毛（ようもう）」の最初の音。' }], kunyomi: [{ reading: 'ひつじ', example: '羊', hint: '毛がふわふわした羊。' }] },
    { kanji: '旅', onyomi: [{ reading: 'りょ', example: '旅行', hint: '「旅行（りょこう）」の最初の音。' }], kunyomi: [{ reading: 'たび', example: '旅', hint: '遠い所へ出かける旅。' }] },
    { kanji: '桜', onyomi: [{ reading: 'おう', example: '桜花', hint: '「桜花（おうか）」の最初の音。' }], kunyomi: [{ reading: 'さくら', example: '桜', hint: '春に咲く桜。' }] },
    { kanji: '志', onyomi: [{ reading: 'し', example: '意志', hint: '「意志（いし）」の最後の音。' }], kunyomi: [{ reading: 'こころざし', example: '志', hint: '心に決めた目標を表す志。' }] },
    { kanji: '灰', onyomi: [{ reading: 'かい', example: '石灰', hint: '「石灰（せっかい）」の最後の音。' }], kunyomi: [{ reading: 'はい', example: '灰', hint: '物が燃えたあとに残る灰。' }] },
    { kanji: '針', onyomi: [{ reading: 'しん', example: '方針', hint: '「方針（ほうしん）」の最後の音。' }], kunyomi: [{ reading: 'はり', example: '針', hint: '細くとがった針。' }] },
    { kanji: '穴', onyomi: [{ reading: 'けつ', example: '墓穴', hint: '「墓穴（ぼけつ）」の最後の音。' }], kunyomi: [{ reading: 'あな', example: '穴', hint: 'ぽっかり開いた穴。' }] },
    { kanji: '絹', onyomi: [{ reading: 'けん', example: '絹糸', hint: '「絹糸（けんし）」の最初の音。' }], kunyomi: [{ reading: 'きぬ', example: '絹', hint: 'かいこのまゆから取れる絹。' }] },
    { kanji: '宝', onyomi: [{ reading: 'ほう', example: '国宝', hint: '「国宝（こくほう）」の最後の音。' }], kunyomi: [{ reading: 'たから', example: '宝', hint: '大切で価値のある宝。' }] },
    { kanji: '姿', onyomi: [{ reading: 'し', example: '姿勢', hint: '「姿勢（しせい）」の最初の音。' }], kunyomi: [{ reading: 'すがた', example: '姿', hint: '目に見える形や様子を表す姿。' }] },
    { kanji: '窓', onyomi: [{ reading: 'そう', example: '車窓', hint: '「車窓（しゃそう）」の最後の音。' }], kunyomi: [{ reading: 'まど', example: '窓', hint: '壁にある窓。' }] },
    { kanji: '机', onyomi: [{ reading: 'き', example: '机上', hint: '「机上（きじょう）」の最初の音。' }], kunyomi: [{ reading: 'つくえ', example: '机', hint: '勉強するときに使う机。' }] },
    { kanji: '腸', onyomi: [{ reading: 'ちょう', example: '大腸', hint: '「大腸（だいちょう）」の最後の音。' }] },
    { kanji: '乳', onyomi: [{ reading: 'にゅう', example: '牛乳', hint: '「牛乳（ぎゅうにゅう）」の最後の音。' }], kunyomi: [{ reading: 'ちち', example: '母の乳', hint: '赤ちゃんが飲む「乳（ちち）」。' }, { reading: 'ち', example: '乳首', hint: '「乳首（ちくび）」の最初の音。' }] },
    { kanji: '詔', onyomi: [{ reading: 'しょう', example: '詔書', hint: '「詔書（しょうしょ）」の最初の音。' }], kunyomi: [{ reading: 'みことのり', example: '詔', hint: '天皇の言葉を表す「詔」。' }] },
];

export interface KanjiContextReadingVariant {
    reading: string;
    question: string;
    hint: string;
    distractors: string[];
}

export interface KanjiContextReadingProfile {
    sourceQuestion: string;
    variants: KanjiContextReadingVariant[];
}

/**
 * Whole-word spellings that have multiple established readings.  The old
 * questions placed another valid reading among the wrong choices, so these
 * are expanded into context-specific questions instead.
 */
export const KANJI_CONTEXT_READING_PROFILES: KanjiContextReadingProfile[] = [
    {
        sourceQuestion: '明日',
        variants: [
            { reading: 'あした', question: '【日常的な読み】「明日は友達と遊びます。」の「明日」は何と読む？', hint: '日常の会話でよく使う読み方。', distractors: ['あけび', 'めいにち', 'みょうじつ'] },
            { reading: 'あす', question: '【やや改まった読み】「明日は晴れるでしょう。」の「明日」は何と読む？', hint: '天気予報などでも使われる読み方。', distractors: ['あけひ', 'めいじつ', 'みょうび'] },
            { reading: 'みょうにち', question: '【改まった読み】「明日、改めてご連絡します。」の「明日」は何と読む？', hint: '改まった場面で使われる読み方。', distractors: ['めいにち', 'みょうび', 'あけにち'] },
        ],
    },
    {
        sourceQuestion: '昨日',
        variants: [
            { reading: 'きのう', question: '【日常的な読み】「昨日、友達と遊びました。」の「昨日」は何と読む？', hint: '日常の会話でよく使う読み方。', distractors: ['さくび', 'きじつ', 'きのひ'] },
            { reading: 'さくじつ', question: '【改まった読み】「昨日はご来場ありがとうございました。」の「昨日」は何と読む？', hint: '改まった場面で使われる読み方。', distractors: ['さくび', 'さくにち', 'きじつ'] },
        ],
    },
    {
        sourceQuestion: '海辺',
        variants: [
            { reading: 'うみべ', question: '【和語の読み】「海辺で貝がらを拾う。」の「海辺」は何と読む？', hint: '「海のほとり」という意味の日常的な読み方。', distractors: ['うみへん', 'かいべ', 'うみなべ'] },
            { reading: 'かいへん', question: '【音読みの語】「海辺の地域を調査する。」の「海辺」は何と読む？', hint: '漢字を音で読む読み方。', distractors: ['かいべ', 'うみへん', 'かいべん'] },
        ],
    },
    {
        sourceQuestion: '竹林',
        variants: [
            { reading: 'ちくりん', question: '【音読みの語】「竹林を保護する。」の「竹林」は何と読む？', hint: '漢字を音で読む読み方。', distractors: ['たけはやし', 'ちくらん', 'ちくばやし'] },
            { reading: 'たけばやし', question: '【和語の読み】「家の裏の竹林を歩く。」の「竹林」は何と読む？', hint: '「竹の林」をそのまま表す読み方。', distractors: ['たけはやし', 'たけりん', 'ちくばやし'] },
        ],
    },
    {
        sourceQuestion: '塩水',
        variants: [
            { reading: 'しおみず', question: '【和語の読み】「塩水で野菜を洗う。」の「塩水」は何と読む？', hint: '日常的に使う読み方。', distractors: ['しおすい', 'えんみず', 'しおみ'] },
            { reading: 'えんすい', question: '【音読みの語】「実験で塩水を使う。」の「塩水」は何と読む？', hint: '理科などで使われる音読みの読み方。', distractors: ['しおすい', 'えんみず', 'えんみ'] },
        ],
    },
    {
        sourceQuestion: '紅葉',
        variants: [
            { reading: 'こうよう', question: '【現象の読み】「秋になると山の葉が紅葉する。」の「紅葉」は何と読む？', hint: '葉が赤や黄色に色づく現象の読み方。', distractors: ['べにば', 'あかば', 'こうは'] },
            { reading: 'もみじ', question: '【木・葉の読み】「庭の紅葉の葉を拾う。」の「紅葉」は何と読む？', hint: '木やその葉を指すときの読み方。', distractors: ['べには', 'もみは', 'こうば'] },
        ],
    },
];

