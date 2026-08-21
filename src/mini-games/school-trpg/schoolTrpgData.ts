import { trpgCopy, type TrpgCopy, type TrpgEnding, type TrpgEvent, type TrpgLocation, type TrpgQuestionGateId, type TrpgReward, type TrpgStat } from './schoolTrpgTypes';

export const TRPG_STAT_COPY: Record<TrpgStat, ReturnType<typeof trpgCopy>> = {
  study: trpgCopy('学力', 'がくりょく', 'STUDY'),
  energy: trpgCopy('体力', 'たいりょく', 'ENERGY'),
  friendship: trpgCopy('友情', 'ゆうじょう', 'FRIENDSHIP'),
  courage: trpgCopy('勇気', 'ゆうき', 'COURAGE'),
};
export const SCHOOL_TRPG_LOCATIONS: TrpgLocation[] = [
  {
    id: 'classroom', eventId: 'P0-01', x: 0.16, y: 0.66, danger: 0, travelCost: 0,
    name: trpgCopy('朝の教室', 'あさのきょうしつ', 'Morning Classroom'),
    shortName: trpgCopy('教室', 'きょうしつ', 'CLASSROOM'),
    description: trpgCopy('黒板に残された暗号から、消えた校章の手がかりを探す。', 'こくばんにのこされたあんごうから、きえたこうしょうのてがかりをさがす。', 'Trace the missing school emblem from a cipher left on the board.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-classroom.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/school-trpg.png',
  },
  {
    id: 'hallway', eventId: 'P0-02', x: 0.36, y: 0.42, danger: 0, travelCost: 1,
    name: trpgCopy('昼休みの廊下', 'ひるやすみのろうか', 'Lunch-Break Hallway'),
    shortName: trpgCopy('廊下', 'ろうか', 'HALLWAY'),
    description: trpgCopy('立入禁止の札の下に、古い鍵と校章の欠片が落ちている。', 'たちいりきんしのふだのしたに、ふるいかぎとこうしょうのかけらがおちている。', 'An old key and an emblem fragment lie beneath a no-entry sign.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/event-hallway.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/shogi.png',
  },
  {
    id: 'courtyard', eventId: 'P0-03', x: 0.54, y: 0.72, danger: 0, travelCost: 1,
    name: trpgCopy('風の中庭', 'かぜのなかにわ', 'Windy Courtyard'),
    shortName: trpgCopy('中庭', 'なかにわ', 'COURTYARD'),
    description: trpgCopy('同じ手紙を追う仲間と出会う。協力するか、先を急ぐか。', 'おなじてがみをおうなかまとであう。きょうりょくするか、さきをいそぐか。', 'Meet a student following the same letter. Cooperate, or press on alone.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-courtyard.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/stone-glow.png',
  },
  {
    id: 'library', eventId: 'P0-04', x: 0.58, y: 0.24, danger: 1, travelCost: 1,
    name: trpgCopy('図書室の隠し棚', 'としょしつのかくしだな', 'Hidden Library Shelf'),
    shortName: trpgCopy('図書室', 'としょしつ', 'LIBRARY'),
    description: trpgCopy('破れたカードと古い校歌を照合し、旧校舎への航路を復元する。', 'やぶれたカードとふるいこうかをしょうごうし、きゅうこうしゃへのこうろをふくげんする。', 'Compare a torn card with an old school song to restore a route to the old wing.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-library.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/learning-tcg.png',
  },
  {
    id: 'tcg-club', eventId: 'P0-05', x: 0.76, y: 0.52, danger: 1, travelCost: 1,
    name: trpgCopy('カード研究部', 'カードけんきゅうぶ', 'Card Research Club'),
    shortName: trpgCopy('カード部', 'カードぶ', 'CARD CLUB'),
    description: trpgCopy('カードの記憶に詳しいライバルから、旧校舎の番人について聞く。', 'カードのきおくにくわしいライバルから、きゅうこうしゃのばんにんについてきく。', 'Ask a rival who studies card memories about the guardian of the old wing.'),
    backgroundAsset: 'sprites/backgrounds/mini-games/learning-tcg.png',
    iconAsset: 'sprites/backgrounds/mini-games/badges/learning-tcg.png',
  },
  {
    id: 'old-school', eventId: 'P0-06', x: 0.88, y: 0.18, danger: 3, travelCost: 2,
    name: trpgCopy('旧校舎の封鎖教室', 'きゅうこうしゃのふうさきょうしつ', 'Sealed Old-School Classroom'),
    shortName: trpgCopy('旧校舎', 'きゅうこうしゃ', 'OLD WING'),
    description: trpgCopy('校章の記憶を抱えた番人と向き合う。倒す以外の道も残されている。', 'こうしょうのきおくをかかえたばんにんとむきあう。たおすいがいのみちものこされている。', 'Face the guardian carrying the emblem memory. Victory is not the only answer.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/chess.png',
  },
];

// Chapter 1 expands the same campus into a night-time route. Keeping these
// records in the same data table lets the map, save migration, and QA checks
// treat future chapters as content additions instead of new UI branches.
SCHOOL_TRPG_LOCATIONS.push(
  {
    id: 'music-room', eventId: 'P1-01', chapter: 1, x: 0.16, y: 0.66, danger: 1, travelCost: 1,
    name: trpgCopy('放課後の音楽室', 'ほうかごのおんがくしつ', 'After-School Music Room'),
    shortName: trpgCopy('音楽室', 'おんがくしつ', 'MUSIC ROOM'),
    description: trpgCopy('消えた校章の音階をたどり、時計塔へ続く最初の旋律を探す。', 'きえたこうしょうのおんかいをたどり、とけいとうへつづくさいしょのせんりつをさがす。', 'Follow the emblem’s melody and find the first refrain leading to the clock tower.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-classroom.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/school-trpg.png',
  },
  {
    id: 'rooftop', eventId: 'P1-02', chapter: 1, x: 0.36, y: 0.42, danger: 1, travelCost: 1,
    name: trpgCopy('星見の屋上', 'ほしみのおくじょう', 'Rooftop Observatory'),
    shortName: trpgCopy('屋上', 'おくじょう', 'ROOFTOP'),
    description: trpgCopy('夜空の星図に、旧校舎ではないもう一つの入口が浮かび上がる。', 'よぞらのせいずに、きゅうこうしゃではないもうひとつのいりぐちがうかびあがる。', 'A second entrance appears on the night sky chart, beyond the old wing.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/reward-rooftop.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/stone-glow.png',
  },
  {
    id: 'science-lab', eventId: 'P1-03', chapter: 1, x: 0.54, y: 0.72, danger: 1, travelCost: 1,
    name: trpgCopy('夜の理科室', 'よるのりかしつ', 'Night Science Lab'),
    shortName: trpgCopy('理科室', 'りかしつ', 'SCIENCE LAB'),
    description: trpgCopy('校章の欠片を照らすレンズを組み立て、見えない航路を可視化する。', 'こうしょうのかけらをてらすレンズをくみたて、みえないこうろをかしかする。', 'Build a lens that reveals the hidden route inside the emblem fragment.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-library.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/chess.png',
  },
  {
    id: 'archive', eventId: 'P1-04', chapter: 1, x: 0.58, y: 0.24, danger: 2, travelCost: 1,
    name: trpgCopy('記録保管庫', 'きろくほかんこ', 'Archive Vault'),
    shortName: trpgCopy('保管庫', 'ほかんこ', 'ARCHIVE'),
    description: trpgCopy('卒業生の記録を照合し、時計塔の夜間通路を問題で復元する。', 'そつぎょうせいのきろくをしょうごうし、とけいとうのやかんつうろをもんだいでふくげんする。', 'Cross-check alumni records and restore the clock tower’s night passage through a quiz.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-library.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/learning-tcg.png',
  },
  {
    id: 'night-bridge', eventId: 'P1-05', chapter: 1, x: 0.76, y: 0.52, danger: 2, travelCost: 1,
    name: trpgCopy('夜渡りの連絡橋', 'よわたりのれんらくきょう', 'Night Crossing'),
    shortName: trpgCopy('連絡橋', 'れんらくきょう', 'NIGHT BRIDGE'),
    description: trpgCopy('校舎と時計塔の間に浮かぶ連絡橋。足元の記憶が道の形を変える。', 'こうしゃととけいとうのあいだにうかぶれんらくきょう。あしもとのきおくがみちのかたちをかえる。', 'A bridge floats between the school and tower. Memories underfoot reshape its path.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/shogi.png',
  },
  {
    id: 'clock-tower', eventId: 'P1-06', chapter: 1, x: 0.88, y: 0.18, danger: 3, travelCost: 2,
    name: trpgCopy('時計塔の最上階', 'とけいとうのさいじょうかい', 'Clock Tower Apex'),
    shortName: trpgCopy('時計塔', 'とけいとう', 'CLOCK TOWER'),
    description: trpgCopy('校章を返すか、記憶の番人と新しい契約を結ぶか。夜の探索が結末を選ぶ。', 'こうしょうをかえすか、きおくのばんにんとあたらしいけいやくをむすぶか。よるのたんさくがけつまつをえらぶ。', 'Return the emblem or make a new pact with the memory guardian. The night expedition decides the ending.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp',
    iconAsset: 'sprites/backgrounds/mini-games/badges/school-trpg.png',
  },
);

export const SCHOOL_TRPG_EVENTS: TrpgEvent[] = [
  {
    id: 'P0-01', locationId: 'classroom', nextPhase: 'MAP',
    title: trpgCopy('黒板の暗号', 'こくばんのあんごう', 'Cipher on the Board'),
    eyebrow: trpgCopy('導入 01 // 最初の手がかり', 'どうにゅう 01 // さいしょのてがかり', 'PROLOGUE 01 // FIRST CLUE'),
    body: trpgCopy('朝の教室。黒板の隅に「校章は、放課後の地図を知る者へ」と書かれている。文字列の下には、見覚えのない3つの記号が並んでいた。', 'あさのきょうしつ。こくばんのすみに「こうしょうは、ほうかごのちずをしるものへ」とかかれている。もじれつのしたには、みおぼえのないみっつのきごうがならんでいた。', 'Morning classroom. In the corner of the board: “The emblem belongs to one who knows the after-school map.” Three unfamiliar symbols sit below it.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-classroom.webp',
    foregroundAsset: 'sprites/backgrounds/mini-games/foreground/school-trpg.png',
    choices: [
      {
        id: 'decode', stat: 'study', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('記号の規則を読み解く', 'きごうのきそくをよみとく', 'Decode the symbol pattern'),
        detail: trpgCopy('学力判定。成功すると廊下の位置が分かる。', 'がくりょくはんてい。せいこうするとろうかのいちがわかる。', 'Study check. Success reveals a hallway location.'),
        success: trpgCopy('記号は校内図の方角を表していた。次は東側の廊下だ。', 'きごうはこうないずのほうがくをあらわしていた。つぎはひがしがわのろうかだ。', 'The symbols are directions on the campus map. The east hallway is next.'),
        failure: trpgCopy('完全には読めないが、消えかけた矢印から廊下へ向かうことにした。', 'かんぜんにはよめないが、きえかけたやじるしからろうかへむかうことにした。', 'You cannot fully decode it, but a faded arrow still points toward the hallway.'),
        flags: { decodedBoard: true },
      },
      {
        id: 'ask', stat: 'friendship', difficulty: 4, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('クラスメイトと照合する', 'クラスメイトとしょうごうする', 'Compare notes with a classmate'),
        detail: trpgCopy('友情判定。仲間の記憶から記号を探す。', 'ゆうじょうはんてい。なかまのきおくからきごうをさがす。', 'Friendship check. Search a classmate’s memory for the symbols.'),
        success: trpgCopy('昨日、同じ記号を廊下で見たという証言を得た。', 'きのう、おなじきごうをろうかでみたというしょうげんをえた。', 'A classmate saw the same symbols in the hallway yesterday.'),
        failure: trpgCopy('手がかりは増えなかったが、廊下を一緒に調べてくれることになった。', 'てがかりはふえなかったが、ろうかをいっしょにしらべてくれることになった。', 'No new clue, but someone agrees to search the hallway with you.'),
        flags: { askedClassmate: true },
      },
    ],
  },
  {
    id: 'P0-02', locationId: 'hallway', nextPhase: 'MAP',
    title: trpgCopy('鍵と校章の欠片', 'かぎとこうしょうのかけら', 'The Key and Emblem Fragment'),
    eyebrow: trpgCopy('導入 02 // 分かれ道', 'どうにゅう 02 // わかれみち', 'PROLOGUE 02 // A FORK'),
    body: trpgCopy('立入禁止の札の下に、古い鍵と金色の欠片が落ちている。先生へ届けるか、先に欠片の出所を調べるか。', 'たちいりきんしのふだのしたに、ふるいかぎときんいろのかけらがおちている。せんせいへとどけるか、さきにかけらのでどころをしらべるか。', 'An old key and a golden fragment lie beneath a no-entry sign. Return them to a teacher, or investigate first?'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/event-hallway.webp',
    choices: [
      {
        id: 'report', stat: 'courage', difficulty: 4, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('先生に正直に報告する', 'せんせいにしょうじきにほうこくする', 'Report it honestly'),
        detail: trpgCopy('勇気判定。先生から正式な調査許可を得る。', 'ゆうきはんてい。せんせいからせいしきなちょうさきょかをえる。', 'Courage check. Seek formal permission to investigate.'),
        success: trpgCopy('先生は鍵を預け、「図書室と中庭を調べて」と頼んだ。', 'せんせいはかぎをあずけ、「としょしつとなかにわをしらべて」とたのんだ。', 'The teacher entrusts you with the key and asks you to search the library and courtyard.'),
        failure: trpgCopy('先生は忙しかったが、鍵の番号から図書室と中庭が候補に残った。', 'せんせいはいそがしかったが、かぎのばんごうからとしょしつとなかにわがこうほにのこった。', 'The teacher is busy, but the key number still points to the library and courtyard.'),
        flags: { reportedKey: true, keptSecret: false },
      },
      {
        id: 'investigate-key', stat: 'study', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('刻印を先に調べる', 'こくいんをさきにしらべる', 'Inspect the engraving first'),
        detail: trpgCopy('学力判定。鍵の番号と校内図を照合する。', 'がくりょくはんてい。かぎのばんごうとこうないずをしょうごうする。', 'Study check. Match the key number to the campus plan.'),
        success: trpgCopy('刻印は図書室と中庭を結ぶ古い管理番号だった。', 'こくいんはとしょしつとなかにわをむすぶふるいかんりばんごうだった。', 'The engraving is an old service number linking the library and courtyard.'),
        failure: trpgCopy('番号の意味は不明だが、欠片に映った二つの景色を頼りに進む。', 'ばんごうのいみはふめいだが、かけらにうつったふたつのけしきをたよりにすすむ。', 'The number remains unclear, but two reflected scenes point toward your next destinations.'),
        flags: { reportedKey: false, keptSecret: true },
      },
    ],
  },
  {
    id: 'P0-03', locationId: 'courtyard', nextPhase: 'MAP',
    title: trpgCopy('風の中の協力者', 'かぜのなかのきょうりょくしゃ', 'An Ally in the Wind'),
    eyebrow: trpgCopy('導入 03 // 仲間', 'どうにゅう 03 // なかま', 'PROLOGUE 03 // COMPANION'),
    body: trpgCopy('中庭で、破れたカードを追う生徒と出会う。カードには校章と同じ金色の線が走っていた。', 'なかにわで、やぶれたカードをおうせいととであう。カードにはこうしょうとおなじきんいろのせんがはしっていた。', 'In the courtyard, you meet a student tracking a torn card. A golden line matching the emblem runs across it.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-courtyard.webp',
    foregroundAsset: 'sprites/backgrounds/mini-games/foreground/learning-tcg.png',
    choices: [
      {
        id: 'team-up', stat: 'friendship', difficulty: 4, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('情報を共有して仲間になる', 'じょうほうをきょうゆうしてなかまになる', 'Share clues and team up'),
        detail: trpgCopy('友情判定。以後の説得と調査が有利になる。', 'ゆうじょうはんてい。いごのせっとくとちょうさがゆうりになる。', 'Friendship check. Improves later research and negotiation.'),
        success: trpgCopy('互いの手がかりがつながり、頼れる調査仲間が加わった。', 'たがいのてがかりがつながり、たよれるちょうさなかまがくわわった。', 'Your clues connect, and a dependable research partner joins you.'),
        failure: trpgCopy('まだ完全には信じてもらえないが、旧校舎まで同行してくれる。', 'まだかんぜんにはしんじてもらえないが、きゅうこうしゃまでどうこうしてくれる。', 'They are not fully convinced, but agree to accompany you to the old wing.'),
        flags: { companionJoined: true, companionTrusted: true },
      },
      {
        id: 'race', stat: 'energy', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('飛ばされたカードを追う', 'とばされたカードをおう', 'Chase the windblown card'),
        detail: trpgCopy('体力判定。カードを確保してから話を聞く。', 'たいりょくはんてい。カードをかくほしてからはなしをきく。', 'Energy check. Secure the card before comparing stories.'),
        success: trpgCopy('カードをつかみ、相手も腕前を認めて同行を申し出た。', 'カードをつかみ、あいてもうでまえをみとめてどうこうをもうしでた。', 'You catch the card, and the impressed student offers to join you.'),
        failure: trpgCopy('カードは木に引っかかった。二人で回収し、しぶしぶ協力することになった。', 'カードはきにひっかかった。ふたりでかいしゅうし、しぶしぶきょうりょくすることになった。', 'The card catches in a tree. Recovering it together leads to a reluctant alliance.'),
        flags: { companionJoined: true, companionTrusted: false },
      },
    ],
  },
  {
    id: 'P0-04', locationId: 'library', nextPhase: 'QUESTION', questionGate: 'LIBRARY',
    title: trpgCopy('隠し棚の照合', 'かくしだなのしょうごう', 'Cross-Checking the Hidden Shelf'),
    eyebrow: trpgCopy('導入 04 // 調査ミッション', 'どうにゅう 04 // ちょうさミッション', 'PROLOGUE 04 // RESEARCH MISSION'),
    body: trpgCopy('古い校歌、破れたカード、校内図を並べると、三つの空欄が浮かび上がる。問題を解けば旧校舎への経路を復元できそうだ。', 'ふるいこうか、やぶれたカード、こうないずをならべると、みっつのくうらんがうかびあがる。もんだいをとけばきゅうこうしゃへのけいろをふくげんできそうだ。', 'An old school song, the torn card, and a campus plan reveal three blanks. Solve them to restore the route to the old wing.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-library.webp',
    choices: [
      {
        id: 'verify-sources', stat: 'study', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('三つの資料を照合する', 'みっつのしりょうをしょうごうする', 'Cross-check all three sources'),
        detail: trpgCopy('学力判定後、3問の調査チャレンジへ進む。', 'がくりょくはんていご、さんもんのちょうさチャレンジへすすむ。', 'Make a Study check, then begin a three-question research challenge.'),
        success: trpgCopy('資料の食い違いを発見した。正しい順番を問題で確かめよう。', 'しりょうのくいちがいをはっけんした。ただしいじゅんばんをもんだいでたしかめよう。', 'You find a contradiction. The challenge will reveal the correct order.'),
        failure: trpgCopy('照合に時間がかかった。残りは問題を解きながら確かめる。', 'しょうごうにじかんがかかった。のこりはもんだいをときながらたしかめる。', 'Cross-checking takes time. You will verify the rest through the challenge.'),
        flags: { verifiedSources: true },
      },
      {
        id: 'follow-card', stat: 'courage', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('カードの光を信じる', 'カードのひかりをしんじる', 'Trust the card’s glow'),
        detail: trpgCopy('勇気判定後、3問で仮説を検証する。', 'ゆうきはんていご、さんもんでかせつをけんしょうする。', 'Make a Courage check, then test the hypothesis with three questions.'),
        success: trpgCopy('光が正しいページを示した。あとは内容を理解すればよい。', 'ひかりがただしいページをしめした。あとはないようをりかいすればよい。', 'The glow reveals the correct page. Now you only need to understand it.'),
        failure: trpgCopy('光は消えたが、印を付けたページから調査を続けられる。', 'ひかりはきえたが、しるしをつけたページからちょうさをつづけられる。', 'The glow fades, but the marked pages give you somewhere to continue.'),
        flags: { trustedCard: true },
      },
    ],
  },
  {
    id: 'P0-05', locationId: 'tcg-club', nextPhase: 'MAP',
    title: trpgCopy('カード研究部の証言', 'カードけんきゅうぶのしょうげん', 'Testimony from the Card Club'),
    eyebrow: trpgCopy('導入 05 // 交渉', 'どうにゅう 05 // こうしょう', 'PROLOGUE 05 // NEGOTIATION'),
    body: trpgCopy('ライバルは、破れたカードが「思い出の残滓」を封じる札だと知っていた。情報をどこまで明かすかで、協力の形が変わる。', 'ライバルは、やぶれたカードが「おもいでのざんし」をふうじるふだだとしっていた。じょうほうをどこまであかすかで、きょうりょくのかたちがかわる。', 'A rival knows the torn card seals a Remnant of Memory. How much you reveal will shape the alliance.'),
    backgroundAsset: 'sprites/backgrounds/mini-games/learning-tcg.png',
    foregroundAsset: 'sprites/backgrounds/mini-games/foreground/learning-tcg.png',
    choices: [
      {
        id: 'honest', stat: 'friendship', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('すべての手がかりを共有する', 'すべてのてがかりをきょうゆうする', 'Share every clue'),
        detail: trpgCopy('友情判定。番人を説得する方法を得る。', 'ゆうじょうはんてい。ばんにんをせっとくするほうほうをえる。', 'Friendship check. Learn how to persuade the guardian.'),
        success: trpgCopy('ライバルは番人の本当の目的と、記憶を返す合言葉を教えた。', 'ライバルはばんにんのほんとうのもくてきと、きおくをかえすあいことばをおしえた。', 'The rival reveals the guardian’s true purpose and a phrase that returns its memory.'),
        failure: trpgCopy('完全な信頼は得られないが、番人は話を聞く可能性があると分かった。', 'かんぜんなしんらいはえられないが、ばんにんははなしをきくかのうせいがあるとわかった。', 'Trust remains incomplete, but you learn the guardian may still listen.'),
        flags: { rivalAlliance: true, knowsPassphrase: true },
      },
      {
        id: 'challenge', stat: 'courage', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('腕前を示して情報を得る', 'うでまえをしめしてじょうほうをえる', 'Prove yourself to earn the clue'),
        detail: trpgCopy('勇気判定。危険だが戦闘の初手が有利になる。', 'ゆうきはんてい。きけんだがせんとうのしょてがゆうりになる。', 'Courage check. Risky, but grants an advantage in battle.'),
        success: trpgCopy('ライバルは実力を認め、番人の弱点が「忘れられる恐怖」だと明かした。', 'ライバルはじつりょくをみとめ、ばんにんのじゃくてんが「わすれられるきょうふ」だとあかした。', 'The rival respects your resolve and reveals the guardian fears being forgotten.'),
        failure: trpgCopy('情報は一部しか得られなかったが、番人の攻撃パターンは記録できた。', 'じょうほうはいちぶしかえられなかったが、ばんにんのこうげきパターンはきろくできた。', 'You gain only part of the clue, but record the guardian’s attack pattern.'),
        flags: { rivalAlliance: false, knowsWeakness: true },
      },
    ],
  },
  {
    id: 'P0-06', locationId: 'old-school', nextPhase: 'COMBAT',
    title: trpgCopy('記憶の番人', 'きおくのばんにん', 'Guardian of Memory'),
    eyebrow: trpgCopy('導入 06 // 複合戦闘', 'どうにゅう 06 // ふくごうせんとう', 'PROLOGUE 06 // MULTI-PATH ENCOUNTER'),
    body: trpgCopy('封鎖教室で「思い出の残滓」が姿を現す。攻撃して封印する、正体を調べて説得する、隙を作って逃げる。選んだ方法が結末を変える。', 'ふうさきょうしつで「おもいでのざんし」がすがたをあらわす。こうげきしてふういんする、しょうたいをしらべてせっとくする、すきをつくってにげる。えらんだほうほうがけつまつをかえる。', 'A Remnant of Memory appears in the sealed classroom. Seal it by force, investigate and persuade it, or create an opening to escape. Your method changes the ending.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp',
    choices: [
      {
        id: 'face-guardian', stat: 'courage', difficulty: 4, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('番人と向き合う', 'ばんにんとむきあう', 'Face the guardian'),
        detail: trpgCopy('勇気判定後、複数の解決方法を選べる戦闘へ進む。', 'ゆうきはんていご、ふくすうのかいけつほうほうをえらべるせんとうへすすむ。', 'Make a Courage check, then enter an encounter with several solutions.'),
        success: trpgCopy('恐怖を抑え、番人の意図を見極める余裕が生まれた。', 'きょうふをおさえ、ばんにんのいとをみきわめるよゆうがうまれた。', 'You master your fear and gain time to read the guardian’s intent.'),
        failure: trpgCopy('足がすくむ。それでも仲間の声を頼りに一歩を踏み出した。', 'あしがすくむ。それでもなかまのこえをたよりにいっぽをふみだした。', 'Your legs freeze, but an ally’s voice helps you step forward.'),
        flags: { facedGuardian: true },
      },
      {
        id: 'observe-guardian', stat: 'study', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('動きを記録してから近づく', 'うごきをきろくしてからちかづく', 'Observe before approaching'),
        detail: trpgCopy('学力判定。調査ゲージを持った状態で戦闘を始める。', 'がくりょくはんてい。ちょうさゲージをもったじょうたいでせんとうをはじめる。', 'Study check. Begin the encounter with investigation progress.'),
        success: trpgCopy('番人が校章ではなく、忘れられた記憶を守っていると気付いた。', 'ばんにんがこうしょうではなく、わすれられたきおくをまもっているときづいた。', 'You realize the guardian protects forgotten memories, not the emblem itself.'),
        failure: trpgCopy('正体は分からないが、攻撃の間隔だけは記録できた。', 'しょうたいはわからないが、こうげきのかんかくだけはきろくできた。', 'Its identity remains unclear, but you record the timing of its attacks.'),
        flags: { observedGuardian: true },
      },
    ],
  },
];

SCHOOL_TRPG_EVENTS.push(
  {
    id: 'P1-01', locationId: 'music-room', chapter: 1, nextPhase: 'MAP',
    title: trpgCopy('夜の音階', 'よるのおんかい', 'The Night Melody'),
    eyebrow: trpgCopy('第2章 01 // 消えた旋律', 'だいにしょう 01 // きえたせんりつ', 'CHAPTER 2 // THE LOST MELODY'),
    body: trpgCopy('放課後の音楽室で、誰も触れていないピアノが校歌の続きを奏でる。楽譜の空欄には、時計塔へ向かう時刻が隠されていた。', 'ほうかごのおんがくしつで、だれもふれていないピアノがこうかのつづきをかなでる。がくふのくうらんには、とけいとうへむかうじこくがかくされていた。', 'In the after-school music room, an untouched piano plays the next verse of the school song. A blank in the score hides the hour to visit the clock tower.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-classroom.webp',
    foregroundAsset: 'sprites/backgrounds/mini-games/foreground/school-trpg.png',
    choices: [
      {
        id: 'tune', stat: 'study', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('旋律の規則を読む', 'せんりつのきそくをよむ', 'Read the melody pattern'),
        detail: trpgCopy('学力判定。屋上へ向かう星の時刻を見つける。', 'がくりょくはんてい。おくじょうへむかうほしのじこくをみつける。', 'Study check. Find the star-hour that points to the rooftop.'),
        success: trpgCopy('音階は星の位置を示していた。次の鐘が鳴る前に屋上へ向かえる。', 'おんかいはほしのいちをしめしていた。つぎのかねがなるまえにおくじょうへむかえる。', 'The melody marks the stars. You can reach the rooftop before the next bell.'),
        failure: trpgCopy('正確な時刻は分からないが、最後の和音が屋上の鍵を響かせた。', 'せいかくなじこくはわからないが、さいごのわおんがおくじょうのかぎをひびかせた。', 'The exact hour is unclear, but the final chord resonates with the rooftop key.'),
        flags: { heardClockSong: true },
      },
      {
        id: 'partner', stat: 'friendship', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('仲間と合奏する', 'なかまとがっそうする', 'Play the score together'),
        detail: trpgCopy('友情判定。仲間の記憶から欠けた音を補う。', 'ゆうじょうはんてい。なかまのきおくからかけたおとをおぎなう。', 'Friendship check. Reconstruct the missing note from an ally’s memory.'),
        success: trpgCopy('二人の記憶が重なり、屋上へ続く夜間通路が開いた。', 'ふたりのきおくがかさなり、おくじょうへつづくやかんつうろがひらいた。', 'Your memories overlap and open a night passage to the rooftop.'),
        failure: trpgCopy('音は外れたが、ピアノの裏から星図の切れ端を見つけた。', 'おとははずれたが、ピアノのうらからせいずのきれはしをみつけた。', 'The notes clash, but a star-chart fragment appears behind the piano.'),
        flags: { metArchivist: true },
      },
    ],
  },
  {
    id: 'P1-02', locationId: 'rooftop', chapter: 1, nextPhase: 'MAP',
    title: trpgCopy('星見の合図', 'ほしみのあいず', 'Signal Among the Stars'),
    eyebrow: trpgCopy('第2章 02 // 夜空の地図', 'だいにしょう 02 // よぞらのちず', 'CHAPTER 2 // NIGHT MAP'),
    body: trpgCopy('屋上の望遠鏡から、時計塔の窓にだけ現れる光を見る。光は三回点滅し、校章の欠片を持つ者へ返事を求めていた。', 'おくじょうのぼうえんきょうから、とけいとうのまどにだけあらわれるひかりをみる。ひかりはさんかいてんめつし、こうしょうのかけらをもつものへへんじをもとめていた。', 'Through the rooftop telescope, a light appears only in the tower window. It flashes three times, asking the emblem holder for a reply.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/reward-rooftop.webp',
    choices: [
      {
        id: 'chart', stat: 'study', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('星図を写し取る', 'せいずをうつしとる', 'Copy the star chart'),
        detail: trpgCopy('学力判定。理科室で使える座標を得る。', 'がくりょくはんてい。りかしつでつかえるざひょうをえる。', 'Study check. Gain coordinates useful in the science lab.'),
        success: trpgCopy('光の座標がレンズの組み立て図になった。', 'ひかりのざひょうがレンズのくみたてずになった。', 'The light coordinates become a lens assembly diagram.'),
        failure: trpgCopy('写し間違いはあるが、三つの光源だけは正しく残った。', 'うつしまちがいはあるが、みっつのこうげんだけはただしくのこった。', 'The copy has mistakes, but the three light sources remain correct.'),
        flags: { foundStarChart: true },
      },
      {
        id: 'storm', stat: 'courage', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('風の中で合図を返す', 'かぜのなかであいずをかえす', 'Answer through the wind'),
        detail: trpgCopy('勇気判定。危険な屋上から直接手がかりをつかむ。', 'ゆうきはんてい。きけんなおくじょうからちょくせつてがかりをつかむ。', 'Courage check. Take the clue directly from the dangerous rooftop.'),
        success: trpgCopy('光は「理科室」と返した。次に必要なのは透明なレンズだ。', 'ひかりは「りかしつ」とかえした。つぎにひつようなのはとうめいなレンズだ。', 'The light answers “science lab.” The next need is a clear lens.'),
        failure: trpgCopy('風に押し戻されたが、落ちた金属片を拾い上げた。', 'かぜにおしもどされたが、おちたきんぞくへんをひろいあげた。', 'The wind pushes you back, but you recover a fallen metal piece.'),
        flags: { bravedStorm: true },
      },
    ],
  },
  {
    id: 'P1-03', locationId: 'science-lab', chapter: 1, nextPhase: 'MAP',
    title: trpgCopy('見えない航路', 'みえないこうろ', 'The Invisible Route'),
    eyebrow: trpgCopy('第2章 03 // レンズ作り', 'だいにしょう 03 // レンズづくり', 'CHAPTER 2 // LENSWORK'),
    body: trpgCopy('理科室の机には、望遠鏡のレンズ、校章の欠片、そして誰かが残した空の設計図がある。正しい順番で組めば、空中の道が見えるはずだ。', 'りかしつのつくえには、ぼうえんきょうのレンズ、こうしょうのかけら、そしてだれかがのこしたからのせっけいずがある。ただしいじゅんばんでくめば、くうちゅうのみちがみえるはずだ。', 'A telescope lens, the emblem fragment, and an empty blueprint wait on the lab desk. In the right order, they should reveal a path in the air.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-library.webp',
    choices: [
      {
        id: 'rebuild', stat: 'study', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('設計図を再構成する', 'せっけいずをさいこうせいする', 'Rebuild the blueprint'),
        detail: trpgCopy('学力判定。保管庫の記録を安全に照らす。', 'がくりょくはんてい。ほかんこのきろくをあんぜんにてらす。', 'Study check. Safely illuminate the archive records.'),
        success: trpgCopy('レンズは夜間通路の輪郭を映し出した。', 'レンズはやかんつうろのりんかくをうつしだした。', 'The lens projects the outline of the night passage.'),
        failure: trpgCopy('光が散り、短い時間だけ保管庫の番号が浮かんだ。', 'ひかりがちり、みじかいじかんだけほかんこのばんごうがうかんだ。', 'The light scatters, briefly revealing the archive number.'),
        flags: { repairedCompass: true },
      },
      {
        id: 'borrow-lens', stat: 'friendship', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('理科部の記録を借りる', 'りかぶのきろくをかりる', 'Borrow the science club log'),
        detail: trpgCopy('友情判定。前の探索者が残した注意書きを読む。', 'ゆうじょうはんてい。まえのたんさくしゃがのこしたちゅういがきをよむ。', 'Friendship check. Read a warning left by a former explorer.'),
        success: trpgCopy('注意書きから、レンズを校章に直接当ててはいけないと分かった。', 'ちゅういがきから、レンズをこうしょうにちょくせつあててはいけないとわかった。', 'The warning says never point the lens directly at the emblem.'),
        failure: trpgCopy('注意書きは破れていたが、保管庫の鍵番号だけは読めた。', 'ちゅういがきはやぶれていたが、ほかんこのかぎばんごうだけはよめた。', 'The warning is torn, but the archive key number is legible.'),
        flags: { borrowedLens: true },
      },
    ],
  },
  {
    id: 'P1-04', locationId: 'archive', chapter: 1, nextPhase: 'QUESTION', questionGate: 'CHAPTER1_RESEARCH',
    title: trpgCopy('卒業生の記録', 'そつぎょうせいのきろく', 'Alumni Records'),
    eyebrow: trpgCopy('第2章 04 // 研究ミッション', 'だいにしょう 04 // けんきゅうミッション', 'CHAPTER 2 // RESEARCH MISSION'),
    body: trpgCopy('保管庫には、時計塔へ向かった卒業生たちの記録が残っている。資料の順番を問題で確かめれば、夜渡りの連絡橋が開く。', 'ほかんこには、とけいとうへむかったそつぎょうせいたちのきろくがのこっている。しりょうのじゅんばんをもんだいでたしかめれば、よわたりのれんらくきょうがひらく。', 'The vault holds records of alumni who visited the tower. Verify their order through a quiz to open the night crossing.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-library.webp',
    choices: [
      {
        id: 'timeline', stat: 'study', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('記録を年代順に並べる', 'きろくをねんだいじゅんにならべる', 'Order the records by year'),
        detail: trpgCopy('学力判定後、3問の研究チャレンジへ進む。', 'がくりょくはんていご、さんもんのけんきゅうチャレンジへすすむ。', 'Make a Study check, then begin a three-question research challenge.'),
        success: trpgCopy('記録の空白が、連絡橋の座標を示している。', 'きろくのくうはんが、れんらくきょうのざひょうをしめしている。', 'The gaps in the records reveal the crossing coordinates.'),
        failure: trpgCopy('年代は曖昧だが、最後のページに橋の名前が残っていた。', 'ねんだいはあいまいだが、さいごのページにはしのなまえがのこっていた。', 'The years are unclear, but the final page names the bridge.'),
        flags: { archiveTimeline: true },
      },
      {
        id: 'voice', stat: 'friendship', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('記録者の声を探す', 'きろくしゃのこえをさがす', 'Find the recorder’s voice'),
        detail: trpgCopy('友情判定後、記録の読み解き問題へ進む。', 'ゆうじょうはんていご、きろくのよみときもんだいへすすむ。', 'Make a Friendship check, then decode the records.'),
        success: trpgCopy('仲間の記憶が、読めない欄の意味を補ってくれた。', 'なかまのきおくが、よめないらんのいみをおぎなってくれた。', 'An ally’s memory fills in the meaning of the unreadable fields.'),
        failure: trpgCopy('声は遠かったが、橋を渡るための合言葉だけ聞き取れた。', 'こえはとおかったが、はしをわたるためのあいことばだけききとれた。', 'The voice is distant, but you catch the phrase needed to cross.'),
        flags: { archiveVoice: true },
      },
    ],
  },
  {
    id: 'P1-05', locationId: 'night-bridge', chapter: 1, nextPhase: 'MAP',
    title: trpgCopy('夜渡りの連絡橋', 'よわたりのれんらくきょう', 'Crossing at Midnight'),
    eyebrow: trpgCopy('第2章 05 // 境界線', 'だいにしょう 05 // きょうかいせん', 'CHAPTER 2 // THE BORDER'),
    body: trpgCopy('連絡橋の床には、これまで集めた記憶が星のように流れている。一歩進むたび、誰かの忘れ物が道を変えていく。', 'れんらくきょうのゆかには、これまであつめたきおくがほしのようにながれている。いっぽすすむたび、だれかのわすれものがみちをかえていく。', 'Memories flow like stars beneath the crossing. Each step changes the path with someone’s forgotten keepsake.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp',
    choices: [
      {
        id: 'follow-stars', stat: 'courage', difficulty: 7, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('星の流れに足を合わせる', 'ほしのながれにあしをあわせる', 'Step with the stars'),
        detail: trpgCopy('勇気判定。時計塔への最短路を選ぶ。', 'ゆうきはんてい。とけいとうへのさいたんろをえらぶ。', 'Courage check. Choose the shortest route to the tower.'),
        success: trpgCopy('星の流れが階段を作り、時計塔の扉まで一気に進めた。', 'ほしのながれがかいだんをつくり、とけいとうのとびらまでいっきにすすめた。', 'The stars form stairs, carrying you straight to the tower door.'),
        failure: trpgCopy('橋が揺れたが、仲間の手を頼りに向こう岸へたどり着いた。', 'はしがゆれたが、なかまのてをたよりにむこうぎしへたどりついた。', 'The bridge sways, but an ally’s hand gets you to the far side.'),
        flags: { crossedBridge: true },
      },
      {
        id: 'anchor', stat: 'energy', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('橋の記憶を固定する', 'はしのきおくをこていする', 'Anchor the bridge memory'),
        detail: trpgCopy('体力判定。次の戦闘で番人の初手を弱める。', 'たいりょくはんてい。つぎのせんとうでばんにんのしょてをよわめる。', 'Energy check. Weaken the guardian’s opening move.'),
        success: trpgCopy('校章の欠片を橋の中央へ置き、安全な足場を固定した。', 'こうしょうのかけらをはしのちゅうおうへおき、あんぜんなあしばをこていした。', 'You place the fragment at the center and stabilize the crossing.'),
        failure: trpgCopy('足場は不安定なままだが、番人の気配だけは先に感じ取れた。', 'あしばはふあんていなままだが、ばんにんのけはいだけはさきにかんじとれた。', 'The footing remains unstable, but you sense the guardian ahead of time.'),
        flags: { anchoredBridge: true, observedGuardian: true },
      },
    ],
  },
  {
    id: 'P1-06', locationId: 'clock-tower', chapter: 1, nextPhase: 'COMBAT',
    title: trpgCopy('時計塔の残響', 'とけいとうのざんきょう', 'Echoes in the Clock Tower'),
    eyebrow: trpgCopy('第2章 06 // 最終対決', 'だいにしょう 06 // さいしゅうたいけつ', 'CHAPTER 2 // FINAL ENCOUNTER'),
    body: trpgCopy('最上階で、思い出の残滓は鐘の音に姿を変えた。校章を返して過去を解放するか、番人と新しい契約を結ぶか。', 'さいじょうかいで、おもいでのざんしはかねのおとにすがたをかえた。こうしょうをかえしてかこをかいほうするか、ばんにんとあたらしいけいやくをむすぶか。', 'At the apex, the Remnant of Memory becomes the sound of a bell. Return the emblem to release the past, or make a new pact with the guardian.'),
    backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp',
    choices: [
      {
        id: 'ring-bell', stat: 'courage', difficulty: 7, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('鐘を鳴らして向き合う', 'かねをならしてむきあう', 'Ring the bell and face it'),
        detail: trpgCopy('勇気判定後、番人との複数解決戦闘へ進む。', 'ゆうきはんていご、ばんにんとのふくすうかいけつせんとうへすすむ。', 'Make a Courage check, then enter a multi-solution guardian encounter.'),
        success: trpgCopy('鐘の音が番人の輪郭を定めた。選択の責任を引き受ける時だ。', 'かねのおとがばんにんのりんかくをさだめた。せんたくのせきにんをひきうけるときだ。', 'The bell defines the guardian’s shape. It is time to own your choice.'),
        failure: trpgCopy('鐘は割れた音を返した。それでも、番人の声は聞こえ始めた。', 'かねはわれたおとをかえした。それでも、ばんにんのこえはきこえはじめた。', 'The bell answers with a cracked tone, but the guardian’s voice begins to emerge.'),
        flags: { facedGuardian: true, chapterOneBoss: true },
      },
      {
        id: 'hold-fragment', stat: 'friendship', difficulty: 7, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('仲間と欠片を掲げる', 'なかまとかけらをかかげる', 'Raise the fragment together'),
        detail: trpgCopy('友情判定後、記憶を返す方法を探す戦闘へ進む。', 'ゆうじょうはんていご、きおくをかえすほうほうをさがすせんとうへすすむ。', 'Make a Friendship check, then seek a way to return the memory.'),
        success: trpgCopy('欠片が二人の間で光り、番人は攻撃を止めて話を聞いた。', 'かけらがふたりのあいだでひかり、ばんにんはこうげきをとめてはなしをきいた。', 'The fragment glows between you, and the guardian pauses to listen.'),
        failure: trpgCopy('光は弱いが、仲間の声が番人の記憶へ届いた。', 'ひかりはよわいが、なかまのこえがばんにんのきおくへとどいた。', 'The light is faint, but your ally’s voice reaches the guardian’s memory.'),
        flags: { companionTrusted: true, knowsPassphrase: true, chapterOneBoss: true },
      },
    ],
  },
);

export type TrpgChapterMeta = {
  chapter: number;
  label: TrpgCopy;
  shortLabel: TrpgCopy;
  routeLabel: TrpgCopy;
  battleLabel: TrpgCopy;
  guardianName: TrpgCopy;
  researchGate: TrpgQuestionGateId;
  clearGate: TrpgQuestionGateId;
  hidden?: boolean;
};

type ExpansionLocationBlueprint = {
  id: string;
  name: TrpgCopy;
  description: TrpgCopy;
  backgroundAsset: string;
};

type ExpansionChapterBlueprint = TrpgChapterMeta & {
  locations: ExpansionLocationBlueprint[];
  endingAssets: string[];
};

const expansionCopy = (chapter: number, index: number, location: ExpansionLocationBlueprint, isFinal = false) => {
  const phase = isFinal ? '最終局面' : `探索 ${String(index).padStart(2, '0')}`;
  const phaseHira = isFinal ? 'さいしゅうきょくめん' : `たんさく ${String(index).padStart(2, '0')}`;
  const phaseEn = isFinal ? 'FINAL CONFRONTATION' : `EXPEDITION ${String(index).padStart(2, '0')}`;
  return {
    eyebrow: trpgCopy(`第${chapter + 1}章 // ${phase}`, `だい${chapter + 1}しょう // ${phaseHira}`, `CHAPTER ${chapter + 1} // ${phaseEn}`),
    title: trpgCopy(`${location.name.ja}の記録`, `${location.name.hira}のきろく`, `${location.name.en} Record`),
    body: trpgCopy(
      `${location.description.ja} 仲間と手がかりをつなぎ、校章の記憶が隠した次の道を探す。`,
      `${location.description.hira} なかまとてがかりをつなぎ、こうしょうのきおくがかくしたつぎのみちをさがす。`,
      `${location.description.en} Connect the clue with your allies and find the next route hidden by the emblem's memory.`,
    ),
  };
};

const makeExpansionChoices = (chapter: number, index: number, final = false) => {
  const key = `chapter${chapter}.clue${index}`;
  const shared = (stat: 'study' | 'friendship' | 'courage', label: TrpgCopy, detail: TrpgCopy, flags: Record<string, boolean | number | string>) => ({
    id: `${key}-${stat}`,
    stat,
    difficulty: final ? 7 : 5 + (index % 2),
    clueOnSuccess: 1,
    stressOnFailure: final ? 1 : 0,
    label,
    detail,
    success: trpgCopy('記録がつながり、次の航路が光った。', 'きろくがつながり、つぎのこうろがひかった。', 'The records connect and the next route lights up.'),
    failure: trpgCopy('手がかりは欠けたが、仲間のメモが道を残した。', 'てがかりはかけたが、なかまのメモがみちをのこした。', 'The clue is incomplete, but an ally’s notes leave a path.'),
    flags: {
      ...flags,
      [key]: true,
      ...(chapter === 4 && index === 4 ? { hiddenKey: true } : {}),
    },
  });
  if (final) {
    return [
      shared('courage', trpgCopy('核心へ踏み込む', 'かくしんへふみこむ', 'Step into the core'), trpgCopy('勇気で番人の中心へ進み、最終戦を開く。', 'ゆうきでばんにんのちゅうしんへすすみ、さいしゅうせんをひらく。', 'Use Courage to enter the guardian’s core and open the final encounter.'), { [`chapter${chapter}Boss`]: true }),
      shared('friendship', trpgCopy('仲間と記憶を掲げる', 'なかまときおくをかかげる', 'Raise the memory together'), trpgCopy('友情で記憶を束ね、別解のある最終戦を開く。', 'ゆうじょうできおくをたばね、べっかいのあるさいしゅうせんをひらく。', 'Use Friendship to bind the memories and open a multi-solution finale.'), { [`chapter${chapter}Boss`]: true, companionTrusted: true }),
    ];
  }
  return [
    shared('study', trpgCopy('痕跡を観察して記録する', 'こんせきをかんさつしてきろくする', 'Observe and record the traces'), trpgCopy('学力で資料を整理し、次の地点を予測する。', 'がくりょくでしりょうをせいりし、つぎのちてんをよそくする。', 'Use Study to sort the evidence and predict the next location.'), {}),
    shared('friendship', trpgCopy('仲間と記憶を照合する', 'なかまときおくをしょうごうする', 'Cross-check memories with allies'), trpgCopy('友情で証言を重ね、隠れた近道を見つける。', 'ゆうじょうでしょうげんをかさね、かくれたちかみちをみつける。', 'Use Friendship to compare testimonies and find a hidden shortcut.'), {}),
  ];
};

const makeExpansionChapter = (blueprint: ExpansionChapterBlueprint) => {
  const locations: TrpgLocation[] = blueprint.locations.map((location, index) => ({
    ...location,
    chapter: blueprint.chapter,
    eventId: `P${blueprint.chapter}-0${index + 1}`,
    x: [0.16, 0.36, 0.54, 0.58, 0.76, 0.88][index],
    y: [0.66, 0.42, 0.72, 0.24, 0.52, 0.18][index],
    danger: (index > 3 ? 2 : index > 1 ? 1 : 0) as 0 | 1 | 2 | 3,
    travelCost: index === 5 ? 2 : 1,
    shortName: trpgCopy(location.name.ja.replace(/の.+$/, ''), location.name.hira.replace(/の.+$/, ''), location.name.en.split(' ')[0]),
    iconAsset: ['sprites/backgrounds/mini-games/badges/school-trpg.png', 'sprites/backgrounds/mini-games/badges/stone-glow.png', 'sprites/backgrounds/mini-games/badges/chess.png', 'sprites/backgrounds/mini-games/badges/learning-tcg.png', 'sprites/backgrounds/mini-games/badges/shogi.png', 'sprites/backgrounds/mini-games/badges/school-trpg.png'][index],
  }));
  const events: TrpgEvent[] = locations.map((location, index) => {
    const eventNumber = index + 1;
    const final = index === 5;
    const copy = expansionCopy(blueprint.chapter, eventNumber, location, final);
    return {
      id: location.eventId,
      locationId: location.id,
      chapter: blueprint.chapter,
      title: copy.title,
      eyebrow: copy.eyebrow,
      body: copy.body,
      backgroundAsset: location.backgroundAsset,
      foregroundAsset: index % 2 === 0 ? 'sprites/backgrounds/mini-games/foreground/school-trpg.png' : undefined,
      choices: makeExpansionChoices(blueprint.chapter, eventNumber, final),
      nextPhase: final ? 'COMBAT' : eventNumber === 4 ? 'QUESTION' : 'MAP',
      questionGate: eventNumber === 4 ? blueprint.researchGate : undefined,
    };
  });
  const rewards: TrpgReward[] = [1, 2, 3].map(index => ({
    id: `chapter${blueprint.chapter}-relic-${index}`,
    chapter: blueprint.chapter,
    artName: `${blueprint.chapter}-${index}-discovery`,
    flag: `rewardChapter${blueprint.chapter}Relic${index}`,
    name: trpgCopy(`${blueprint.label.ja}の発見物 ${index}`, `${blueprint.label.hira}のはっけんぶつ ${index}`, `${blueprint.label.en} Discovery ${index}`),
    description: trpgCopy('次の航路で、探索・判定・戦闘のいずれかを一度だけ有利にする。', 'つぎのこうろで、たんさく・はんてい・せんとうのいずれかをいちどだけゆうりにする。', 'Gain one advantage on a route, check, or encounter in the next expedition.'),
  }));
  const endingIds = blueprint.hidden
    ? ['revelation', 'constellation', 'sacrifice', 'memorial', 'timeline']
    : ['seal', 'pact', 'escape', 'failure'];
  const endingLabels = ['封印', '共鳴', '帰還', '余白', '時空'];
  const endingHira = ['ふういん', 'きょうめい', 'きかん', 'よはく', 'じくう'];
  const endingEnglish = ['SEALED', 'RESONANCE', 'RETURN', 'THE BLANK', 'TIMELINE'];
  const routeLabels = ['撃破', '説得', '退避', '疲労', '時空'];
  const routeHira = ['げきは', 'せっとく', 'たいひ', 'ひろう', 'じくう'];
  const routeEnglish = ['SEAL', 'PERSUASION', 'ESCAPE', 'FATIGUE', 'TIMELINE'];
  const bodyJa = ['静かに封じた', '仲間との共鳴へ変えた', '次の航路へ持ち越した', '未完成の地図として残した', '過去と未来の記録を一つの航路へ束ねた'];
  const bodyHira = ['しずかにふうじた', 'なかまとのきょうめいへかえた', 'つぎのこうろへもちこした', 'みかんせいのちずとしてのこした', 'かことみらいのきろくをひとつのこうろへたばねた'];
  const bodyEnglish = ['seal the emblem memory', 'become a resonance with your allies', 'carry the route forward', 'remain as an unfinished map', 'bind past and future records into one route'];
  const endings: TrpgEnding[] = endingIds.map((ending, index) => ({
    id: `chapter${blueprint.chapter}-${ending}`,
    chapter: blueprint.chapter,
    tone: (['CYAN', 'VIOLET', 'GOLD', 'ROSE', 'CYAN'] as const)[index],
    artAsset: blueprint.endingAssets[index],
    title: trpgCopy(`${blueprint.label.ja}・${endingLabels[index]}`, `${blueprint.label.hira}・${endingHira[index]}`, `${blueprint.label.en} // ${endingEnglish[index]}`),
    subtitle: trpgCopy(`${routeLabels[index]}ルート`, `${routeHira[index]}ルート`, `${routeEnglish[index]} ROUTE`),
    body: trpgCopy(`${blueprint.label.ja}で集めた記録が、校章の記憶を${bodyJa[index]}。`, `${blueprint.label.hira}であつめたきろくが、こうしょうのきおくを${bodyHira[index]}。`, `The records from ${blueprint.label.en} ${bodyEnglish[index]}.`),
  }));
  return { locations, events, rewards, endings };
};

export const SCHOOL_TRPG_CHAPTERS: TrpgChapterMeta[] = [
  { chapter: 0, label: trpgCopy('導入章・失われた校章', 'どうにゅうしょう・うしなわれたこうしょう', 'PROLOGUE // THE MISSING EMBLEM'), shortLabel: trpgCopy('導入章', 'どうにゅうしょう', 'PROLOGUE'), routeLabel: trpgCopy('航路 00', 'こうろ 00', 'ROUTE 00'), battleLabel: trpgCopy('記憶の番人との対決', 'きおくのばんにんとのたいけつ', 'ENCOUNTER: MEMORY GUARDIAN'), guardianName: trpgCopy('思い出の残滓', 'おもいでのざんし', 'MEMORY REMNANT'), researchGate: 'LIBRARY', clearGate: 'MISSION_CLEAR' },
  { chapter: 1, label: trpgCopy('第2章・時計塔の余白', 'だいにしょう・とけいとうのよはく', 'CHAPTER 2 // THE CLOCK TOWER MARGIN'), shortLabel: trpgCopy('第2章', 'だいにしょう', 'CHAPTER 2'), routeLabel: trpgCopy('航路 01', 'こうろ 01', 'ROUTE 01'), battleLabel: trpgCopy('時計塔の番人との対決', 'とけいとうのばんにんとのたいけつ', 'ENCOUNTER: CLOCK TOWER GUARDIAN'), guardianName: trpgCopy('時計塔の番人', 'とけいとうのばんにん', 'CLOCK TOWER GUARDIAN'), researchGate: 'CHAPTER1_RESEARCH', clearGate: 'CHAPTER1_CLEAR' },
  { chapter: 2, label: trpgCopy('第3章・祭りの残響', 'だいさんしょう・まつりのざんきょう', 'CHAPTER 3 // FESTIVAL ECHOES'), shortLabel: trpgCopy('第3章', 'だいさんしょう', 'CHAPTER 3'), routeLabel: trpgCopy('航路 02', 'こうろ 02', 'ROUTE 02'), battleLabel: trpgCopy('祭りの残響との対決', 'まつりのざんきょうとのたいけつ', 'ENCOUNTER: FESTIVAL ECHO'), guardianName: trpgCopy('祭りの残響', 'まつりのざんきょう', 'FESTIVAL ECHO'), researchGate: 'CHAPTER2_RESEARCH', clearGate: 'CHAPTER2_CLEAR' },
  { chapter: 3, label: trpgCopy('第4章・校外航路', 'だいよんしょう・こうがいこうろ', 'CHAPTER 4 // BEYOND CAMPUS'), shortLabel: trpgCopy('第4章', 'だいよんしょう', 'CHAPTER 4'), routeLabel: trpgCopy('航路 03', 'こうろ 03', 'ROUTE 03'), battleLabel: trpgCopy('校外航路の番人との対決', 'こうがいこうろのばんにんとのたいけつ', 'ENCOUNTER: OUTBOUND GUARDIAN'), guardianName: trpgCopy('校外航路の番人', 'こうがいこうろのばんにん', 'OUTBOUND GUARDIAN'), researchGate: 'CHAPTER3_RESEARCH', clearGate: 'CHAPTER3_CLEAR' },
  { chapter: 4, label: trpgCopy('第5章・原室の記憶', 'だいごしょう・げんしつのきおく', 'CHAPTER 5 // MEMORY OF THE ORIGIN ROOM'), shortLabel: trpgCopy('第5章', 'だいごしょう', 'CHAPTER 5'), routeLabel: trpgCopy('航路 04', 'こうろ 04', 'ROUTE 04'), battleLabel: trpgCopy('原室の番人との対決', 'げんしつのばんにんとのたいけつ', 'ENCOUNTER: ORIGIN GUARDIAN'), guardianName: trpgCopy('原室の番人', 'げんしつのばんにん', 'ORIGIN GUARDIAN'), researchGate: 'CHAPTER4_RESEARCH', clearGate: 'CHAPTER4_CLEAR' },
  { chapter: 5, label: trpgCopy('隠し章・0時間目', 'かくししょう・れいじかんめ', 'HIDDEN CHAPTER // ZERO HOUR'), shortLabel: trpgCopy('隠し章', 'かくししょう', 'HIDDEN'), routeLabel: trpgCopy('秘航路 H', 'ひこうろ H', 'SECRET ROUTE H'), battleLabel: trpgCopy('最初の鐘との対決', 'さいしょのかねとのたいけつ', 'ENCOUNTER: THE FIRST BELL'), guardianName: trpgCopy('最初の鐘', 'さいしょのかね', 'THE FIRST BELL'), researchGate: 'HIDDEN_RESEARCH', clearGate: 'HIDDEN_CLEAR', hidden: true },
];

const EXPANSION_BLUEPRINTS: ExpansionChapterBlueprint[] = [
  {
    ...SCHOOL_TRPG_CHAPTERS[2], endingAssets: ['sprites/backgrounds/mini-games/school-trpg/endings/chapter3-seal.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter3-resonance.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter3-return.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter3-blank.webp'],
    locations: [
      { id: 'festival-gate', name: trpgCopy('学園祭の正門', 'がくえんさいのせいもん', 'Festival Gate'), description: trpgCopy('学園祭の入口で、消えた校章の音が客席から聞こえる。', 'がくえんさいのいりぐちで、きえたこうしょうのおとがきゃくせきからきこえる。', 'At the festival gate, the missing emblem’s chime comes from the audience.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/map-festival.webp' },
      { id: 'stage-back', name: trpgCopy('舞台裏の配電室', 'ぶたいうらのはいでんしつ', 'Stage Control Room'), description: trpgCopy('照明の順番が校内図の暗号になっている。', 'しょうめいのじゅんばんがこうないずのあんごうになっている。', 'The lighting order forms a cipher for the campus map.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-courtyard.webp' },
      { id: 'night-market', name: trpgCopy('夜店の記憶市', 'よみせのきおくいち', 'Memory Night Market'), description: trpgCopy('夜店の景品に、卒業生の記憶を封じた札が混じっている。', 'よみせのけいひんに、そつぎょうせいのきおくをふうじたふだがまじっている。', 'A festival prize contains a seal for an alumnus memory.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-gym.webp' },
      { id: 'maze-of-banners', name: trpgCopy('幕の迷宮', 'まくのめいきゅう', 'Banner Maze'), description: trpgCopy('垂れ幕の迷路を、問題の答えで正しい順に並べ替える。', 'たれまくのめいろを、もんだいのこたえでただしいじゅんにならべかえる。', 'Reorder the banner maze using answers from the research challenge.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp' },
      { id: 'fireworks-roof', name: trpgCopy('花火観測デッキ', 'はなびかんそくデッキ', 'Fireworks Deck'), description: trpgCopy('花火の軌跡が、校章の欠片を次の舞台へ導く。', 'はなびのきせきが、こうしょうのかけらをつぎのぶたいへみちびく。', 'Firework trails lead the emblem fragment to the final stage.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/reward-rooftop.webp' },
      { id: 'mirror-stage', name: trpgCopy('鏡写しの講堂', 'かがみうつしのこうどう', 'Mirror Auditorium'), description: trpgCopy('観客の記憶が一つの番人となり、祭りの最後の幕が上がる。', 'かんきゃくのきおくがひとつのばんにんとなり、まつりのさいごのまくがあがる。', 'The audience memories become one guardian as the festival’s final curtain rises.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp' },
    ],
  },
  {
    ...SCHOOL_TRPG_CHAPTERS[3], endingAssets: ['sprites/backgrounds/mini-games/school-trpg/endings/chapter4-seal.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter4-resonance.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter4-return.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter4-blank.webp'],
    locations: [
      { id: 'gymnasium', name: trpgCopy('体育館の空白', 'たいいくかんのくうはく', 'Gymnasium Blank'), description: trpgCopy('誰もいない体育館に、校外へ続く扉の影が浮かぶ。', 'だれもいないたいいくかんに、こうがいへつづくとびらのかげがうかぶ。', 'A shadow door to beyond campus appears in the empty gymnasium.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-gym.webp' },
      { id: 'music-archive', name: trpgCopy('音楽資料室', 'おんがくしりょうしつ', 'Music Archive'), description: trpgCopy('校歌の原譜から、学園の外へ渡る旋律を探す。', 'こうかのげんぷから、がくえんのそとへわたるせんりつをさがす。', 'Search the original score for a melody that crosses beyond campus.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-music-room.webp' },
      { id: 'science-greenhouse', name: trpgCopy('理科準備室', 'りかじゅんびしつ', 'Science Prep Room'), description: trpgCopy('観測機器が、遠い街の学びの灯りを映し出す。', 'かんそくききが、とおいまちのまなびのあかりをうつしだす。', 'Observation equipment reveals learning lights in a distant town.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-science-lab.webp' },
      { id: 'indoor-crossing', name: trpgCopy('屋内連絡路', 'おくないれんらくろ', 'Indoor Crossing'), description: trpgCopy('問題の答えを扉に刻み、閉じた連絡路を開ける。', 'もんだいのこたえをとびらにきざみ、とじたれんらくろをあける。', 'Carve the quiz answers into the door and open the sealed crossing.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/map-indoor.webp' },
      { id: 'library-echo', name: trpgCopy('反響図書館', 'はんきょうとしょかん', 'Echo Library'), description: trpgCopy('世界中の学びの記録が、校章の出自を語り始める。', 'せかいじゅうのまなびのきろくが、こうしょうのしゅつじをかたりはじめる。', 'Learning records from around the world reveal the emblem’s origin.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/compendium-library.webp' },
      { id: 'rooftop-gate', name: trpgCopy('校外航路ゲート', 'こうがいこうろゲート', 'Beyond-Campus Gate'), description: trpgCopy('門の向こうで、番人が学園の外の航路を守っている。', 'もんのむこうで、ばんにんががくえんのそとのこうろをまもっている。', 'Beyond the gate, a guardian protects the route outside the campus.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-rooftop.webp' },
    ],
  },
  {
    ...SCHOOL_TRPG_CHAPTERS[4], endingAssets: ['sprites/backgrounds/mini-games/school-trpg/endings/chapter5-dawn.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter5-pact.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter5-escape.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/chapter5-silent.webp'],
    locations: [
      { id: 'old-map-room', name: trpgCopy('旧校舎地図室', 'きゅうこうしゃちずしつ', 'Old Map Room'), description: trpgCopy('校章が最初に描かれた地図を、古い机の奥から見つける。', 'こうしょうがさいしょにえがかれたちずを、ふるいつくえのおくからみつける。', 'Find the first map bearing the emblem behind an old desk.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/high-school-map-act2.webp' },
      { id: 'alumni-hall', name: trpgCopy('卒業生の回廊', 'そつぎょうせいのかいろう', 'Alumni Hall'), description: trpgCopy('歴代の学び手が残した言葉から、原室への鍵を読む。', 'れきだいのまなびてがのこしたことばから、げんしつへのかぎをよむ。', 'Read the key to the origin room in words left by generations of learners.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-hallway.webp' },
      { id: 'founders-workshop', name: trpgCopy('創設者工房', 'そうせつしゃこうぼう', 'Founders’ Workshop'), description: trpgCopy('校章を作った道具と、忘れられた設計図を照合する。', 'こうしょうをつくったどうぐと、わすれられたせっけいずをしょうごうする。', 'Match the emblem-maker’s tools with a forgotten blueprint.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/battle-gym.webp' },
      { id: 'memory-reservoir', name: trpgCopy('記憶貯水槽', 'きおくちょすいそう', 'Memory Reservoir'), description: trpgCopy('問題の答えで水面を整え、校章の原記憶を浮かび上がらせる。', 'もんだいのこたえですいめんをととのえ、こうしょうのげんきおくをうかびあがらせる。', 'Use quiz answers to still the water and reveal the emblem’s first memory.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-battle-library.webp' },
      { id: 'final-bridge', name: trpgCopy('最終連絡橋', 'さいしゅうれんらくきょう', 'Final Crossing'), description: trpgCopy('校舎と原室をつなぐ橋が、これまでの選択を映し出す。', 'こうしゃとげんしつをつなぐはしが、これまでのせんたくをうつしだす。', 'The bridge to the origin room reflects every choice you made.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-final-bridge.webp' },
      { id: 'origin-chamber', name: trpgCopy('校章の原室', 'こうしょうのげんしつ', 'Origin Chamber'), description: trpgCopy('校章の記憶を返すか、未来の学びへ結び直すかを決める。', 'こうしょうのきおくをかえすか、みらいのまなびへむすびなおすかをきめる。', 'Choose whether to return the emblem memory or bind it to future learning.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-battle-classroom.webp' },
    ],
  },
  {
    ...SCHOOL_TRPG_CHAPTERS[5], endingAssets: ['sprites/backgrounds/mini-games/school-trpg/endings/hidden-revelation.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/hidden-constellation.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/hidden-sacrifice.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/hidden-memorial.webp', 'sprites/backgrounds/mini-games/school-trpg/endings/hidden-timeline.webp'],
    locations: [
      { id: 'hidden-stair', name: trpgCopy('地下の隠し階段', 'ちかのかくしかいだん', 'Hidden Stair'), description: trpgCopy('誰も記録しなかった階段が、0時間目の教室へ降りていく。', 'だれもきろくしなかったかいだんが、れいじかんめのきょうしつへおりていく。', 'An unrecorded stair descends toward the zero-hour classroom.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-map-act4.webp' },
      { id: 'star-vault', name: trpgCopy('星図保管庫', 'せいずほかんこ', 'Star Vault'), description: trpgCopy('全章の航路を重ねると、秘密の星図が開く。', 'ぜんしょうのこうろをかさねると、ひみつのせいずがひらく。', 'Overlay every route to open a secret star chart.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-treasure-vault.webp' },
      { id: 'time-garden', name: trpgCopy('時間庭園', 'じかんていえん', 'Time Garden'), description: trpgCopy('過去と未来の校庭が同時に咲く庭で、仲間の記憶をつなぐ。', 'かことみらいのこうていがどうじにさくにわで、なかまのきおくをつなぐ。', 'In a garden where past and future bloom together, bind the team’s memories.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-reward-sanctuary.webp' },
      { id: 'name-less-room', name: trpgCopy('無名の教室', 'むめいのきょうしつ', 'Nameless Classroom'), description: trpgCopy('問題の答えで黒板の空欄を埋め、忘れられた生徒たちの名を呼ぶ。', 'もんだいのこたえでこくばんのくうらんをうめ、わすれられたせいとたちのなをよぶ。', 'Fill the blackboard blanks with quiz answers and name the forgotten students.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-battle-library.webp' },
      { id: 'first-bell', name: trpgCopy('最初の鐘の間', 'さいしょのかねのま', 'First Bell Chamber'), description: trpgCopy('学園が始まる前に鳴った鐘が、すべての記憶の中心で待つ。', 'がくえんがはじまるまえになったかねが、すべてのきおくのちゅうしんでまつ。', 'The bell that rang before the school began waits at the center of every memory.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-final-bridge.webp' },
      { id: 'zero-classroom', name: trpgCopy('0時間目の教室', 'れいじかんめのきょうしつ', 'Zero-Hour Classroom'), description: trpgCopy('番人ではなく、学びそのものと向き合い、最後の選択をする。', 'ばんにんではなく、まなびそのものとむきあい、さいごのせんたくをする。', 'Face learning itself rather than a guardian and make the final choice.'), backgroundAsset: 'sprites/backgrounds/learning-rogue/magic-battle-classroom.webp' },
    ],
  },
];

export const SCHOOL_TRPG_REWARDS: TrpgReward[] = [
  {
    id: 'emblem-shard', artName: '校章ブレイク', flag: 'rewardEmblemShard',
    name: trpgCopy('校章の欠片', 'こうしょうのかけら', 'Emblem Fragment'),
    description: trpgCopy('封鎖された学園マップの経路を開く、物語のキーアイテム。', 'ふうさされたがくえんマップのけいろをひらく、ものがたりのキーアイテム。', 'A key item that opens sealed routes on the school map.'),
  },
  {
    id: 'branch-notebook', artName: '分岐予測ノート', flag: 'rewardBranchNotebook',
    name: trpgCopy('分岐予測ノート', 'ぶんきよそくノート', 'Branch Forecast Notebook'),
    description: trpgCopy('次のイベントで、選択肢の危険と必要条件を詳しく確認できる。', 'つぎのイベントで、せんたくしのきけんとひつようじょうけんをくわしくかくにんできる。', 'Reveals detailed risks and requirements for choices in the next event.'),
  },
  {
    id: 'handmade-map', artName: '手作りの宝地図', flag: 'rewardHandmadeMap',
    name: trpgCopy('放課後の手作り地図', 'ほうかごのてづくりちず', 'Handmade After-School Map'),
    description: trpgCopy('仲間と見つけた地点を記録し、次周の近道を解禁する。', 'なかまとみつけたちてんをきろくし、じしゅうのちかみちをかいきんする。', 'Records shared discoveries and unlocks a shortcut on the next run.'),
  },
];

SCHOOL_TRPG_REWARDS.push(
  {
    id: 'clockwork-chime', chapter: 1, artName: '時計塔のチャイム', flag: 'rewardClockworkChime',
    name: trpgCopy('時計塔のチャイム', 'とけいとうのチャイム', 'Clock-Tower Chime'),
    description: trpgCopy('次の章で、イベント開始時に時間を1だけ戻せる。', 'つぎのしょうで、イベントかいしじにじかんをいちだけもどせる。', 'In the next chapter, rewind one time unit when an event begins.'),
  },
  {
    id: 'star-chart', chapter: 1, artName: '夜空の星図', flag: 'rewardStarChart',
    name: trpgCopy('夜空の星図', 'よぞらのせいず', 'Night-Sky Chart'),
    description: trpgCopy('未解禁地点の危険度を、マップ上で先に確認できる。', 'みかいきんちてんのきけんどを、マップじょうでさきにかくにんできる。', 'Preview the danger of locked locations on the map.'),
  },
  {
    id: 'memory-contract', chapter: 1, artName: '記憶の契約書', flag: 'rewardMemoryContract',
    name: trpgCopy('記憶の契約書', 'きおくのけいやくしょ', 'Memory Pact'),
    description: trpgCopy('説得ルートの次周で、番人との対話を最初から有利にする。', 'せっとくルートのじしゅうで、ばんにんとのたいわをさいしょからゆうりにする。', 'Starts the next persuasion route with an advantage in dialogue.'),
  },
);

export const SCHOOL_TRPG_ENDINGS: TrpgEnding[] = [
  {
    id: 'detective-club', tone: 'CYAN',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/prologue-seal.webp',
    title: trpgCopy('放課後探偵団の始業式', 'ほうかごたんていだんのしぎょうしき', 'The Detective Club Begins'),
    subtitle: trpgCopy('撃破ルート // 仲間と証拠を守った', 'げきはルート // なかまとしょうこをまもった', 'SEAL ROUTE // CLUES PRESERVED'),
    body: trpgCopy('番人を封じ、校章の欠片を回収した。集めた証拠を先生へ報告し、放課後の学園を調べる正式なチームが生まれた。', 'ばんにんをふうじ、こうしょうのかけらをかいしゅうした。あつめたしょうこをせんせいへほうこくし、ほうかごのがくえんをしらべるせいしきなチームがうまれた。', 'You seal the guardian and recover the fragment. The evidence earns your group official permission to investigate the after-school campus.'),
  },
  {
    id: 'memory-returned', tone: 'VIOLET',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/prologue-pact.webp',
    title: trpgCopy('記憶を返す日', 'きおくをかえすひ', 'The Day Memory Returned'),
    subtitle: trpgCopy('説得ルート // 番人の目的を理解した', 'せっとくルート // ばんにんのもくてきをりかいした', 'PERSUASION ROUTE // PURPOSE UNDERSTOOD'),
    body: trpgCopy('番人は敵ではなく、忘れられた卒業生の記憶を守っていた。校章を奪わず記憶を返したことで、時計塔への新しい道が開いた。', 'ばんにんはてきではなく、わすれられたそつぎょうせいのきおくをまもっていた。こうしょうをうばわずきおくをかえしたことで、とけいとうへのあたらしいみちがひらいた。', 'The guardian was protecting forgotten alumni memories. Returning them instead of taking the emblem opens a new route toward the clock tower.'),
  },
  {
    id: 'quiet-return', tone: 'GOLD',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/prologue-return.webp',
    title: trpgCopy('静かな帰宅', 'しずかなきたく', 'A Quiet Walk Home'),
    subtitle: trpgCopy('退避ルート // 謎を次へ持ち越した', 'たいひルート // なぞをつぎへもちこした', 'ESCAPE ROUTE // MYSTERY DEFERRED'),
    body: trpgCopy('番人を倒すことより、仲間と手がかりを持ち帰ることを選んだ。旧校舎は閉じたままだが、次に必要な準備は分かっている。', 'ばんにんをたおすことより、なかまとてがかりをもちかえることをえらんだ。きゅうこうしゃはとじたままだが、つぎにひつようなじゅんびはわかっている。', 'You choose to bring your ally and clues home instead of defeating the guardian. The old wing stays sealed, but you now know what the next attempt needs.'),
  },
  {
    id: 'unfinished-map', tone: 'ROSE',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/prologue-blank.webp',
    title: trpgCopy('未完成の放課後地図', 'みかんせいのほうかごちず', 'The Unfinished After-School Map'),
    subtitle: trpgCopy('疲労ルート // 手がかりは失われていない', 'ひろうルート // てがかりはうしなわれていない', 'FATIGUE ROUTE // CLUES SURVIVED'),
    body: trpgCopy('番人の力に押し戻されたが、記録と仲間は守り抜いた。失敗は地図の空白になり、次の探索で埋めるべき場所を示している。', 'ばんにんのちからにおしもどされたが、きろくとなかまはまもりぬいた。しっぱいはちずのくうはくになり、つぎのたんさくでうめるべきばしょをしめしている。', 'The guardian forces you back, but your notes and ally are safe. Failure becomes a blank on the map, marking where the next expedition must begin.'),
  },
];

SCHOOL_TRPG_ENDINGS.push(
  {
    id: 'clockwork-dawn', chapter: 1, tone: 'CYAN',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/chapter2-bell.webp',
    title: trpgCopy('鐘の音で迎える朝', 'かねのおとでむかえるあさ', 'Morning After the Bell'),
    subtitle: trpgCopy('封印ルート // 夜の記録を守った', 'ふういんルート // よるのきろくをまもった', 'SEAL ROUTE // NIGHT RECORDS PRESERVED'),
    body: trpgCopy('時計塔の鐘が朝を告げ、夜の航路は静かに閉じた。残された星図は、まだ見ぬ校外の物語を指している。', 'とけいとうのかねがあさをつげ、よるのこうろはしずかにとじた。のこされたせいずは、まだみぬこうがいのものがたりをさしている。', 'The tower bell announces morning and the night route closes. The remaining chart points toward stories beyond campus.'),
  },
  {
    id: 'constellation-pact', chapter: 1, tone: 'VIOLET',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/chapter2-constellation.webp',
    title: trpgCopy('星座の契約', 'せいざのけいやく', 'The Constellation Pact'),
    subtitle: trpgCopy('説得ルート // 番人と共に歩く', 'せっとくルート // ばんにんとともにあるく', 'PERSUASION ROUTE // WALKING WITH THE GUARDIAN'),
    body: trpgCopy('番人は鐘の音を道しるべに変え、仲間たちと新しい契約を結んだ。夜の学園には、まだ名前のない地点が残っている。', 'ばんにんはかねのおとをみちしるべにかえ、なかまたちとあたらしいけいやくをむすんだ。よるのがくえんには、まだなまえのないちてんがのこっている。', 'The guardian turns the bell into a guide and makes a new pact with your team. Unnamed places remain across the night campus.'),
  },
  {
    id: 'bridge-before-dawn', chapter: 1, tone: 'GOLD',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/chapter2-bridge.webp',
    title: trpgCopy('夜明け前の帰路', 'よあけまえのきろ', 'Return Before Dawn'),
    subtitle: trpgCopy('退避ルート // 地図を次へ持ち越した', 'たいひルート // ちずをつぎへもちこした', 'ESCAPE ROUTE // MAP CARRIED FORWARD'),
    body: trpgCopy('連絡橋が消える前に、記録と仲間を連れて戻った。時計塔の答えは、次の夜にもう一度探せる。', 'れんらくきょうがきえるまえに、きろくとなかまをつれてもどった。とけいとうのこたえは、つぎのよるにもういちどさがせる。', 'You return with your notes and ally before the crossing disappears. The tower’s answer can be sought on another night.'),
  },
  {
    id: 'silent-clock', chapter: 1, tone: 'ROSE',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/chapter2-silent.webp',
    title: trpgCopy('止まった時計', 'とまったとけい', 'The Silent Clock'),
    subtitle: trpgCopy('疲労ルート // 失敗を次の地図へ', 'ひろうルート // しっぱいをつぎのちずへ', 'FATIGUE ROUTE // FAILURE BECOMES A MAP'),
    body: trpgCopy('鐘は鳴らなかったが、集めた記録は残った。止まった時計の針が、次の探索で向き合うべき時間を示している。', 'かねはならなかったが、あつめたきろくはのこった。とまったとけいのはりが、つぎのたんさくでむきあうべきじかんをしめしている。', 'The bell stays silent, but your records survive. The stopped hands mark the hour your next expedition must face.'),
  },
);

for (const blueprint of EXPANSION_BLUEPRINTS) {
  const generated = makeExpansionChapter(blueprint);
  SCHOOL_TRPG_LOCATIONS.push(...generated.locations);
  SCHOOL_TRPG_EVENTS.push(...generated.events);
  SCHOOL_TRPG_REWARDS.push(...generated.rewards);
  SCHOOL_TRPG_ENDINGS.push(...generated.endings);
}

export const SCHOOL_TRPG_COPY = {
  title: trpgCopy('放課後スクールTRPG', 'ほうかごスクールTRPG', 'AFTER-SCHOOL TRPG'),
  campaign: trpgCopy('失われた校章', 'うしなわれたこうしょう', 'THE MISSING EMBLEM'),
  campaignHeader: trpgCopy('CAMPAIGN 00–05', 'キャンペーン れいぜろから ご', 'CAMPAIGN 00–05'),
  campaignTagline: trpgCopy('OPEN CAMPUS ADVENTURE // 全5章', 'オープンキャンパスアドベンチャー // ごしょう', 'OPEN CAMPUS ADVENTURE // FIVE CHAPTERS'),
  chapterTwo: trpgCopy('第2章・時計塔の余白', 'だいにしょう・とけいとうのよはく', 'CHAPTER 2 // THE CLOCK TOWER MARGIN'),
  intro: trpgCopy('導入章から第5章までの探索キャンペーン。各章で問題ゲートを越え、仲間と結末を選びながら校章の記憶を完成させる。', 'どうにゅうしょうからだいごしょうまでのたんさくキャンペーン。かくしょうでもんだいゲートをこえ、なかまとけつまつをえらびながらこうしょうのきおくをかんせいさせる。', 'An expedition from the prologue through Chapter 5. Clear quiz gates, choose allies, and complete the emblem memory.'),
  specChapters: trpgCopy('5章構成', 'ごしょうこうせい', '5 CHAPTERS'),
  specLocations: trpgCopy('36地点', 'さんじゅうろくちてん', '36 LOCATIONS'),
  specEndings: trpgCopy('25結末', 'にじゅうごけつまつ', '25 ENDINGS'),
  newCampaign: trpgCopy('新しい探索を始める', 'あたらしいたんさくをはじめる', 'START NEW EXPEDITION'),
  continueCampaign: trpgCopy('続きから再開', 'つづきからさいかい', 'CONTINUE EXPEDITION'),
  exit: trpgCopy('戻る', 'もどる', 'EXIT'),
  map: trpgCopy('学園航路図', 'がくえんこうろず', 'CAMPUS ROUTE MAP'),
  travel: trpgCopy('この地点へ移動', 'このちてんへいどう', 'TRAVEL TO LOCATION'),
  revisit: trpgCopy('調査済み', 'ちょうさずみ', 'INVESTIGATED'),
  locked: trpgCopy('まだ行けません', 'まだいけません', 'LOCKED'),
  selectLocation: trpgCopy('地点を選ぶと、必要時間と内容を確認できます。', 'ちてんをえらぶと、ひつようじかんとないようをかくにんできます。', 'Select a location to review its travel cost and purpose.'),
  returnToMap: trpgCopy('航路図へ戻る', 'こうろずへもどる', 'RETURN TO MAP'),
  useFate: trpgCopy('運命を使う +2', 'うんめいをつかう +2', 'USE FATE +2'),
  fateReady: trpgCopy('運命使用中', 'うんめいしようちゅう', 'FATE READY'),
  continue: trpgCopy('結果を確認して進む', 'けっかをかくにんしてすすむ', 'CONTINUE'),
  questionLibrary: trpgCopy('調査チャレンジ', 'ちょうさチャレンジ', 'RESEARCH CHALLENGE'),
  questionMission: trpgCopy('ミッションクリア問題', 'ミッションクリアもんだい', 'MISSION CLEAR QUIZ'),
  questionChapterResearch: trpgCopy('夜間記録チャレンジ', 'やかんきろくチャレンジ', 'NIGHT RECORD CHALLENGE'),
  questionChapterMission: trpgCopy('時計塔ミッションクリア問題', 'とけいとうミッションクリアもんだい', 'CLOCK TOWER MISSION QUIZ'),
  questionHint: trpgCopy('3問の結果が手がかりと報酬に反映されます。', 'さんもんのけっかがてがかりとほうしゅうにはんえいされます。', 'The three answers affect clues and rewards.'),
  battle: trpgCopy('記憶の番人との対決', 'きおくのばんにんとのたいけつ', 'ENCOUNTER: MEMORY GUARDIAN'),
  chapterBattle: trpgCopy('時計塔の番人との対決', 'とけいとうのばんにんとのたいけつ', 'ENCOUNTER: CLOCK TOWER GUARDIAN'),
  nextChapter: trpgCopy('第2章へ進む', 'だいにしょうへすすむ', 'CONTINUE TO CHAPTER 2'),
  reward: trpgCopy('発見物を1つ選ぶ', 'はっけんぶつをひとつえらぶ', 'CHOOSE ONE DISCOVERY'),
  finish: trpgCopy('探索結果へ進む', 'たんさくけっかへすすむ', 'COMPLETE EXPEDITION'),
  replay: trpgCopy('別の選択で再探索', 'べつのせんたくでさいたんさく', 'START ANOTHER EXPEDITION'),
  saved: trpgCopy('自動保存済み', 'じどうほぞんずみ', 'AUTOSAVED'),
  abandon: trpgCopy('探索を最初からやり直す', 'たんさくをさいしょからやりなおす', 'RESET EXPEDITION'),
  abandonConfirm: trpgCopy('現在の探索記録を消して最初から始めますか？', 'げんざいのたんさくきろくをけしてさいしょからはじめますか？', 'Erase the current expedition and start over?'),
  cancel: trpgCopy('キャンセル', 'キャンセル', 'CANCEL'),
};

export const getTrpgLocation = (id: string) => SCHOOL_TRPG_LOCATIONS.find(location => location.id === id);
export const getTrpgEvent = (id: string) => SCHOOL_TRPG_EVENTS.find(event => event.id === id);
export const getTrpgEnding = (id: string | null) => SCHOOL_TRPG_ENDINGS.find(ending => ending.id === id);
export const getTrpgChapterMeta = (chapter: number) => SCHOOL_TRPG_CHAPTERS.find(meta => meta.chapter === chapter) || SCHOOL_TRPG_CHAPTERS[0];
export const getTrpgChapterLocations = (chapter: number) => SCHOOL_TRPG_LOCATIONS.filter(location => (location.chapter || 0) === chapter);
export const getTrpgChapterEvents = (chapter: number) => SCHOOL_TRPG_EVENTS.filter(event => (event.chapter || 0) === chapter);
export const getTrpgChapterRewards = (chapter: number) => SCHOOL_TRPG_REWARDS.filter(reward => (reward.chapter || 0) === chapter);
export const getTrpgChapterEndings = (chapter: number) => SCHOOL_TRPG_ENDINGS.filter(ending => (ending.chapter || 0) === chapter);

export const validateSchoolTrpgData = (): string[] => {
  const errors: string[] = [];
  const locationIds = new Set<string>();
  const eventIds = new Set<string>();
  for (const location of SCHOOL_TRPG_LOCATIONS) {
    if (locationIds.has(location.id)) errors.push(`Duplicate location: ${location.id}`);
    locationIds.add(location.id);
    if (!Number.isInteger(location.chapter || 0) || (location.chapter || 0) < 0) errors.push(`Invalid chapter: ${location.id}`);
    if (location.x < 0 || location.x > 1 || location.y < 0 || location.y > 1) errors.push(`Invalid coordinates: ${location.id}`);
  }
  for (const event of SCHOOL_TRPG_EVENTS) {
    if (eventIds.has(event.id)) errors.push(`Duplicate event: ${event.id}`);
    eventIds.add(event.id);
    if (!Number.isInteger(event.chapter || 0) || (event.chapter || 0) < 0) errors.push(`Invalid event chapter: ${event.id}`);
    if (!locationIds.has(event.locationId)) errors.push(`Missing event location: ${event.id}`);
    if (event.choices.length === 0) errors.push(`Event has no choices: ${event.id}`);
    if (event.nextPhase === 'QUESTION' && !event.questionGate) errors.push(`Missing question gate: ${event.id}`);
  }
  for (const location of SCHOOL_TRPG_LOCATIONS) {
    if (!eventIds.has(location.eventId)) errors.push(`Missing location event: ${location.id}`);
  }
  if (new Set(SCHOOL_TRPG_REWARDS.map(reward => reward.id)).size !== SCHOOL_TRPG_REWARDS.length) errors.push('Duplicate rewards');
  if (new Set(SCHOOL_TRPG_ENDINGS.map(ending => ending.id)).size !== SCHOOL_TRPG_ENDINGS.length) errors.push('Duplicate endings');
  for (const chapter of new Set(SCHOOL_TRPG_LOCATIONS.map(location => location.chapter || 0))) {
    if (!getTrpgChapterEvents(chapter).length) errors.push(`Chapter has no events: ${chapter}`);
  }
  return errors;
};
