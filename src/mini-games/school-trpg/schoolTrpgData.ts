import { trpgCopy, type TrpgChoice, type TrpgCopy, type TrpgEnding, type TrpgEndingArt, type TrpgEvent, type TrpgEventArchetype, type TrpgEventVariant, type TrpgLocation, type TrpgQuestionGateId, type TrpgReward, type TrpgStat } from './schoolTrpgTypes';

export const TRPG_STAT_COPY: Record<TrpgStat, ReturnType<typeof trpgCopy>> = {
  study: trpgCopy('学力', 'がくりょく', 'STUDY'),
  energy: trpgCopy('体力', 'たいりょく', 'ENERGY'),
  friendship: trpgCopy('友情', 'ゆうじょう', 'FRIENDSHIP'),
  courage: trpgCopy('勇気', 'ゆうき', 'COURAGE'),
};

/** Every discovery owns a dedicated illustration. No reward card reuses art. */
export const SCHOOL_TRPG_DISCOVERY_ART = {
  'emblem-shard': 'sprites/backgrounds/mini-games/school-trpg/discoveries/emblem-fragment.webp',
  'branch-notebook': 'sprites/backgrounds/mini-games/school-trpg/discoveries/branch-forecast-notebook.webp',
  'handmade-map': 'sprites/backgrounds/mini-games/school-trpg/discoveries/handmade-afterschool-map.webp',
  'clockwork-chime': 'sprites/backgrounds/mini-games/school-trpg/discoveries/clockwork-chime.webp',
  'star-chart': 'sprites/backgrounds/mini-games/school-trpg/discoveries/constellation-chart.webp',
  'memory-contract': 'sprites/backgrounds/mini-games/school-trpg/discoveries/memory-pact.webp',
  'chapter2-relic-1': 'sprites/backgrounds/mini-games/school-trpg/discoveries/echo-ticket.webp',
  'chapter2-relic-2': 'sprites/backgrounds/mini-games/school-trpg/discoveries/fireworks-mirror.webp',
  'chapter2-relic-3': 'sprites/backgrounds/mini-games/school-trpg/discoveries/memory-stall-tag.webp',
  'chapter3-relic-1': 'sprites/backgrounds/mini-games/school-trpg/discoveries/outbound-compass.webp',
  'chapter3-relic-2': 'sprites/backgrounds/mini-games/school-trpg/discoveries/echo-library-slip.webp',
  'chapter3-relic-3': 'sprites/backgrounds/mini-games/school-trpg/discoveries/distant-observation-lens.webp',
  'chapter4-relic-1': 'sprites/backgrounds/mini-games/school-trpg/discoveries/founders-blueprint.webp',
  'chapter4-relic-2': 'sprites/backgrounds/mini-games/school-trpg/discoveries/memory-reservoir-vial.webp',
  'chapter4-relic-3': 'sprites/backgrounds/mini-games/school-trpg/discoveries/origin-chamber-key.webp',
  'chapter5-relic-1': 'sprites/backgrounds/mini-games/school-trpg/discoveries/first-bell-fragment.webp',
  'chapter5-relic-2': 'sprites/backgrounds/mini-games/school-trpg/discoveries/constellation-thread.webp',
  'chapter5-relic-3': 'sprites/backgrounds/mini-games/school-trpg/discoveries/nameless-register-bookmark.webp',
} as const;

/**
 * Scene art is deliberately kept in the existing Learning Rogue library.  A
 * location keeps its wide battle/map background for the scene backdrop, while
 * this compact illustration is used for the map node and event focal point.
 * The background-based fallback also covers the generated chapter locations.
 */
const SCHOOL_TRPG_SCENE_ART_BY_LOCATION: Record<string, string> = {
  classroom: 'event-illustrations/校章の輝き.webp',
  hallway: 'event-illustrations/踊り場の鏡.webp',
  courtyard: 'event-illustrations/伝説の木の下.webp',
  library: 'event-illustrations/図書室の静寂.webp',
  'tcg-club': 'event-illustrations/放課後の決闘.webp',
  'old-school': 'event-illustrations/呪われた書物.webp',
  'music-room': 'event-illustrations/音楽室の肖像画.webp',
  rooftop: 'event-illustrations/屋上の貯水槽.webp',
  'science-lab': 'event-illustrations/理科室のアルコールランプ.webp',
  archive: 'event-illustrations/秘密の連絡帳.webp',
  'night-bridge': 'event-illustrations/階段の13段目.webp',
  'clock-tower': 'event-illustrations/終わらない朝礼.webp',
};

const SCHOOL_TRPG_SCENE_ART_BY_BACKGROUND: Array<[string, string]> = [
  ['map-festival.webp', 'event-illustrations/文化祭のポスター.webp'],
  ['battle-courtyard.webp', 'event-illustrations/伝説の木の下.webp'],
  ['battle-gym.webp', 'event-illustrations/体育館の跳び箱.webp'],
  ['battle-music-room.webp', 'event-illustrations/音楽室の肖像画.webp'],
  ['battle-science-lab.webp', 'event-illustrations/理科室のアルコールランプ.webp'],
  ['battle-rooftop.webp', 'event-illustrations/屋上の貯水槽.webp'],
  ['reward-rooftop.webp', 'event-illustrations/屋上の貯水槽.webp'],
  ['battle-library.webp', 'event-illustrations/図書室の静寂.webp'],
  ['compendium-library.webp', 'event-illustrations/図書室の貸出カード.webp'],
  ['event-hallway.webp', 'event-illustrations/踊り場の鏡.webp'],
  ['battle-hallway.webp', 'event-illustrations/放課後の決闘.webp'],
  ['map-indoor.webp', 'event-illustrations/放送室から変な声.webp'],
  ['high-school-map-act2.webp', 'event-illustrations/文化祭のポスター.webp'],
  ['magic-battle-library.webp', 'event-illustrations/秘密の連絡帳.webp'],
  ['magic-battle-classroom.webp', 'event-illustrations/校章の輝き.webp'],
  ['magic-map-act4.webp', 'event-illustrations/秘密基地.webp'],
  ['magic-treasure-vault.webp', 'event-illustrations/図書室の貸出カード.webp'],
  ['magic-reward-sanctuary.webp', 'event-illustrations/伝説の木の下.webp'],
  ['magic-final-bridge.webp', 'event-illustrations/階段の13段目.webp'],
];

export const getSchoolTrpgSceneArt = (locationId: string, backgroundAsset: string): string => {
  const locationArt = SCHOOL_TRPG_SCENE_ART_BY_LOCATION[locationId];
  if (locationArt) return locationArt;
  const backgroundArt = SCHOOL_TRPG_SCENE_ART_BY_BACKGROUND.find(([asset]) => backgroundAsset.endsWith(asset));
  return backgroundArt?.[1] || 'event-illustrations/default.webp';
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
        flags: { heardClockSong: true, routeChapter1: 'ASTRAL' },
      },
      {
        id: 'partner', stat: 'friendship', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('仲間と合奏する', 'なかまとがっそうする', 'Play the score together'),
        detail: trpgCopy('友情判定。仲間の記憶から欠けた音を補う。', 'ゆうじょうはんてい。なかまのきおくからかけたおとをおぎなう。', 'Friendship check. Reconstruct the missing note from an ally’s memory.'),
        success: trpgCopy('二人の記憶が重なり、屋上へ続く夜間通路が開いた。', 'ふたりのきおくがかさなり、おくじょうへつづくやかんつうろがひらいた。', 'Your memories overlap and open a night passage to the rooftop.'),
        failure: trpgCopy('音は外れたが、ピアノの裏から星図の切れ端を見つけた。', 'おとははずれたが、ピアノのうらからせいずのきれはしをみつけた。', 'The notes clash, but a star-chart fragment appears behind the piano.'),
        flags: { metArchivist: true, routeChapter1: 'ALLY' },
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
        successFlags: { chapter1Shortcut: true, chapter1SkippedEvent: 'P1-03', chapter1Signal: 'STAR_STABLE' },
        failureFlags: { chapter1OpenAlternate: true, chapter1Signal: 'STAR_FRAGMENT' },
      },
      {
        id: 'storm', stat: 'courage', difficulty: 6, clueOnSuccess: 1, stressOnFailure: 1,
        label: trpgCopy('風の中で合図を返す', 'かぜのなかであいずをかえす', 'Answer through the wind'),
        detail: trpgCopy('勇気判定。危険な屋上から直接手がかりをつかむ。', 'ゆうきはんてい。きけんなおくじょうからちょくせつてがかりをつかむ。', 'Courage check. Take the clue directly from the dangerous rooftop.'),
        success: trpgCopy('光は「理科室」と返した。次に必要なのは透明なレンズだ。', 'ひかりは「りかしつ」とかえした。つぎにひつようなのはとうめいなレンズだ。', 'The light answers “science lab.” The next need is a clear lens.'),
        failure: trpgCopy('風に押し戻されたが、落ちた金属片を拾い上げた。', 'かぜにおしもどされたが、おちたきんぞくへんをひろいあげた。', 'The wind pushes you back, but you recover a fallen metal piece.'),
        flags: { bravedStorm: true },
        successFlags: { chapter1Shortcut: true, chapter1SkippedEvent: 'P1-03', chapter1Signal: 'STAR_STABLE' },
        failureFlags: { chapter1OpenAlternate: true, chapter1Signal: 'STAR_FRAGMENT' },
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
        successFlags: { chapter1Shortcut: true, chapter1SkippedEvent: 'P1-02', chapter1Signal: 'LENS_STABLE' },
        failureFlags: { chapter1OpenAlternate: true, chapter1Signal: 'LENS_FRAGMENT' },
      },
      {
        id: 'borrow-lens', stat: 'friendship', difficulty: 5, clueOnSuccess: 1, stressOnFailure: 0,
        label: trpgCopy('理科部の記録を借りる', 'りかぶのきろくをかりる', 'Borrow the science club log'),
        detail: trpgCopy('友情判定。前の探索者が残した注意書きを読む。', 'ゆうじょうはんてい。まえのたんさくしゃがのこしたちゅういがきをよむ。', 'Friendship check. Read a warning left by a former explorer.'),
        success: trpgCopy('注意書きから、レンズを校章に直接当ててはいけないと分かった。', 'ちゅういがきから、レンズをこうしょうにちょくせつあててはいけないとわかった。', 'The warning says never point the lens directly at the emblem.'),
        failure: trpgCopy('注意書きは破れていたが、保管庫の鍵番号だけは読めた。', 'ちゅういがきはやぶれていたが、ほかんこのかぎばんごうだけはよめた。', 'The warning is torn, but the archive key number is legible.'),
        flags: { borrowedLens: true },
        successFlags: { chapter1Shortcut: true, chapter1SkippedEvent: 'P1-02', chapter1Signal: 'LENS_STABLE' },
        failureFlags: { chapter1OpenAlternate: true, chapter1Signal: 'LENS_FRAGMENT' },
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
      {
        id: 'map-shortcut', requiresFlag: 'chapter1Shortcut', stat: 'study', difficulty: 5, clueOnSuccess: 2, stressOnFailure: 0,
        label: trpgCopy('手作りの地図で近道を開く', 'てづくりのちずでちかみちをひらく', 'Open the handmade shortcut'),
        detail: trpgCopy('前の調査で開いた短絡路を使い、時計塔への距離を縮める。', 'まえのちょうさでひらいたたんらくろをつかい、とけいとうへのきょりをちぢめる。', 'Use the shortcut uncovered earlier to shorten the route to the clock tower.'),
        success: trpgCopy('地図の余白が星図と重なり、番人の初動まで読めた。', 'ちずのよはくがせいずとかさなり、ばんにんのしょどうまでよめた。', 'The map margin overlaps the star chart, revealing the guardian’s opening move.'),
        failure: trpgCopy('近道は崩れたが、安全な足場を記録して時計塔へ急いだ。', 'ちかみちはくずれたが、あんぜんなあしばをきろくしてとけいとうへいそいだ。', 'The shortcut collapses, but you mark a safe footing and hurry to the tower.'),
        flags: { shortcutCrossing: true },
        successFlags: { chapter1Signal: 'MAP_GUIDED', chapter1ShortcutUsed: true },
        failureFlags: { chapter1OpenAlternate: true },
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

// Keep the prologue and first expansion on the same event vocabulary as the
// later chapters. These authored records are mapped explicitly rather than
// generated from their location order.
const AUTHORED_EVENT_ARCHETYPES: Record<string, TrpgEventArchetype> = {
  'P0-01': 'INVESTIGATION',
  'P0-02': 'PUZZLE',
  'P0-03': 'DIALOGUE',
  'P0-04': 'INVESTIGATION',
  'P0-05': 'DIALOGUE',
  'P0-06': 'COMBAT',
  'P1-01': 'PUZZLE',
  'P1-02': 'INVESTIGATION',
  'P1-03': 'PUZZLE',
  'P1-04': 'INVESTIGATION',
  'P1-05': 'CHASE',
  'P1-06': 'COMBAT',
};

SCHOOL_TRPG_EVENTS.forEach(event => {
  event.archetype = AUTHORED_EVENT_ARCHETYPES[event.id] || event.archetype;
});

export type TrpgChapterMeta = {
  chapter: number;
  label: TrpgCopy;
  shortLabel: TrpgCopy;
  routeLabel: TrpgCopy;
  battleLabel: TrpgCopy;
  guardianName: TrpgCopy;
  guardianAsset: string;
  battleBackgroundAsset: string;
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

const EXPANSION_STORY_BEATS: Record<TrpgEventArchetype, TrpgCopy> = {
  INVESTIGATION: trpgCopy('現場には三つの時刻が重なった痕跡があり、どれを真実として記録するかで航路が変わる。', 'げんばにはみっつのじこくがかさなったこんせきがあり、どれをしんじつとしてきろくするかでこうろがかわる。', 'Three different timestamps overlap at the scene, and the route changes depending on which one you record as truth.'),
  DIALOGUE: trpgCopy('残された声は質問するたびに話者が変わり、仲間の証言と照らし合わせなければ本音へ届かない。', 'のこされたこえはしつもんするたびにわしゃがかわり、なかまのしょうげんとてらしあわせなければほんねへとどかない。', 'The speaker behind the lingering voice changes with every question; only your allies’ testimony can expose its true intent.'),
  PUZZLE: trpgCopy('床・壁・天井に分かれた仕掛けは一つだけを動かせず、規則を読み替えて同時にそろえる必要がある。', 'ゆか・かべ・てんじょうにわかれたしかけはひとつだけをうごかせず、きそくをよみかえてどうじにそろえるひつようがある。', 'The floor, walls, and ceiling form one mechanism; its rules must be reinterpreted so all three align at once.'),
  CHASE: trpgCopy('逃げる光は通った場所の記憶を消していく。追いつく速さと、消える記録を救う判断の両方が試される。', 'にげるひかりはとおったばしょのきおくをけしていく。おいつくはやさと、きえるきろくをすくうはんだんのりょうほうがためされる。', 'The fleeing light erases every memory it passes. You must choose between gaining ground and rescuing the vanishing record.'),
  DEFENSE: trpgCopy('調査中の仲間へ影が押し寄せる。入口を守る者と暗号を解く者を分け、限られた時間を耐え抜く。', 'ちょうさちゅうのなかまへかげがおしよせる。いりぐちをまもるものとあんごうをとくものをわけ、かぎられたじかんをたえぬく。', 'Shadows close in on the investigators. Split the team between holding the entrance and decoding the clue before time runs out.'),
  COMBAT: trpgCopy('集めた選択の記録が番人の姿と攻撃手順を変える。倒す、理解する、持ち帰るという三つの結末が同時に開く。', 'あつめたせんたくのきろくがばんにんのすがたとこうげきてじゅんをかえる。たおす、りかいする、もちかえるというみっつのけつまつがどうじにひらく。', 'Your recorded choices reshape the guardian and its attack pattern, opening three outcomes at once: defeat it, understand it, or escape with the truth.'),
};

const EXPANSION_RESOLUTIONS: Record<Exclude<TrpgEventArchetype, 'COMBAT'>, { success: TrpgCopy; failure: TrpgCopy }> = {
  INVESTIGATION: {
    success: trpgCopy('矛盾する痕跡を年代順に並べると、次の航路だけが鮮明に残った。', 'むじゅんするこんせきをねんだいじゅんにならべると、つぎのこうろだけがせんめいにのこった。', 'Once the conflicting traces are ordered by age, only the next route remains in focus.'),
    failure: trpgCopy('証拠の一部は崩れたが、消える直前の輪郭を仲間が地図へ写し取った。', 'しょうこのいちぶはくずれたが、きえるちょくぜんのりんかくをなかまがちずへうつしとった。', 'Part of the evidence collapses, but an ally sketches its final outline onto the map.'),
  },
  DIALOGUE: {
    success: trpgCopy('声の主は警戒を解き、誰にも話さなかった合言葉と次の待ち合わせ場所を明かした。', 'こえのぬしはけいかいをとき、だれにもはなさなかったあいことばとつぎのまちあわせばしょをあかした。', 'The speaker lowers their guard and reveals a secret passphrase and meeting place.'),
    failure: trpgCopy('対話は途切れたが、沈黙の間隔が次の地点を示す鐘のリズムになっていた。', 'たいわはとぎれたが、ちんもくのかんかくがつぎのちてんをしめすかねのリズムになっていた。', 'The dialogue breaks off, yet the pauses form a bell rhythm pointing toward the next location.'),
  },
  PUZZLE: {
    success: trpgCopy('最後の部品がかみ合い、封印された扉と新しい地図の層が同時に開いた。', 'さいごのぶひんがかみあい、ふういんされたとびらとあたらしいちずのそうがどうじにひらいた。', 'The final piece locks in, opening both the sealed door and a new layer of the map.'),
    failure: trpgCopy('仕掛けは止まったままだが、逆回転した歯車が安全な迂回路を指し示した。', 'しかけはとまったままだが、ぎゃくかいてんしたはぐるまがあんぜんなうかいろをさししめした。', 'The mechanism remains stalled, but a reversed gear points out a safe detour.'),
  },
  CHASE: {
    success: trpgCopy('光を先回りして記憶の欠片を確保し、消される前の航路を取り戻した。', 'ひかりをさきまわりしてきおくのかけらをかくほし、けされるまえのこうろをとりもどした。', 'You cut off the light, secure the memory fragment, and restore the route before it vanishes.'),
    failure: trpgCopy('光には逃げられたが、足跡に残った残響が次の出現時刻を教えた。', 'ひかりにはにげられたが、あしあとにのこったざんきょうがつぎのしゅつげんじこくをおしえた。', 'The light escapes, but the echo in its tracks reveals when it will appear again.'),
  },
  DEFENSE: {
    success: trpgCopy('役割を交代しながら防衛線を保ち、仲間は最後の記録まで読み切った。', 'やくわりをこうたいしながらぼうえいせんをたもち、なかまはさいごのきろくまでよみきった。', 'By rotating roles, the team holds the line long enough to read the final record.'),
    failure: trpgCopy('防衛線は破られたが、守った一冊だけが次の航路を開く鍵として残った。', 'ぼうえいせんはやぶられたが、まもったいっさつだけがつぎのこうろをひらくかぎとしてのこった。', 'The line breaks, but the single book you protected becomes the key to the next route.'),
  },
};

// The generated chapters keep the same map grammar, but each one now carries
// a distinct question: festival memory, the route beyond campus, the origin
// room, and the forgotten first period. These motifs are included in every
// location's scene copy so chapters do not read like reskinned encounters.
const EXPANSION_CHAPTER_MOTIFS: Record<number, TrpgCopy> = {
  2: trpgCopy('祭りの音を誰の記憶として残すかが、最後の幕の形を決める。', 'まつりのおとをだれのきおくとしてのこすかが、さいごのまくのかたちをきめる。', 'Whose memory carries the festival sound decides the shape of the final curtain.'),
  3: trpgCopy('学園の外から届く旋律は、ここに残るか、遠い学びへ渡るかを問いかける。', 'がくえんのそとからとどくせんりつは、ここにのこるか、とおいまなびへわたるかをといかける。', 'A melody from beyond campus asks whether learning should stay here or travel onward.'),
  4: trpgCopy('校章を作った手は、守るためか、問いを次の世代へ渡すためかを試している。', 'こうしょうをつくったては、まもるためか、といをつぎのせだいへわたすためかをためしている。', 'The hand that made the emblem tests whether it should protect the past or pass its question on.'),
  5: trpgCopy('0時間目に置き去りにされた名前を呼べるかが、最初の鐘の意味を変える。', 'れいじかんめにおきざりにされたなまえをよべるかが、さいしょのかねのいみをかえる。', 'Whether you can name those left in zero-hour changes what the First Bell means.'),
};

type ExpansionSignature = {
  stat: TrpgStat;
  label: TrpgCopy;
  detail: TrpgCopy;
  success: TrpgCopy;
  failure: TrpgCopy;
};

const EXPANSION_SIGNATURES: Record<number, ExpansionSignature> = {
  2: {
    stat: 'friendship',
    label: trpgCopy('祭りの合図を再演する', 'まつりのあいずをさいえんする', 'Re-stage the festival signal'),
    detail: trpgCopy('仲間と照明・音・記憶の順番をそろえ、祭りの裏航路を開く。', 'なかまとしょうめい・おと・きおくのじゅんばんをそろえ、まつりのうらこうろをひらく。', 'Align light, sound, and memory with your allies to open the festival back-route.'),
    success: trpgCopy('客席の記憶が一つの合図にまとまり、次の場所へ先回りできる。', 'きゃくせきのきおくがひとつのあいずにまとまり、つぎのばしょへさきまわりできる。', 'The audience memories become one signal, letting you get ahead of the next scene.'),
    failure: trpgCopy('合図は乱れたが、誰か一人の記憶だけが消えずに残った。', 'あいずはみだれたが、だれかひとりのきおくだけがきえずにのこった。', 'The signal scatters, but one person’s memory remains intact.'),
  },
  3: {
    stat: 'study',
    label: trpgCopy('遠行の旋律を逆算する', 'えんこうのせんりつをぎゃくさんする', 'Reverse-engineer the outbound melody'),
    detail: trpgCopy('校歌の音程を問題の記録と照合し、外へ続く安全な拍を見つける。', 'こうかのおんていをもんだいのきろくとしょうごうし、そとへつづくあんぜんなはくをみつける。', 'Compare the school song’s intervals with the records to find the safe beat beyond campus.'),
    success: trpgCopy('旋律の空白が門の開く瞬間を示し、外の記録を持ち帰れる。', 'せんりつのくうはくがもんのひらくしゅんかんをしめし、そとのきろくをもちかえれる。', 'The melody’s gaps reveal when the gate opens, letting you bring back an outside record.'),
    failure: trpgCopy('音は合わなかったが、門の向こうから届く一節を記録した。', 'おとはあわなかったが、もんのむこうからとどくいっせつをきろくした。', 'The notes do not align, but you record a phrase arriving from beyond the gate.'),
  },
  4: {
    stat: 'courage',
    label: trpgCopy('原室の扉に校章を重ねる', 'げんしつのとびらにこうしょうをかさねる', 'Overlay the emblem on the origin door'),
    detail: trpgCopy('設計図を掲げ、校章を守るだけでなく問いを次へ渡す扉を選ぶ。', 'せっけいずをかかげ、こうしょうをまもるだけでなくといをつぎへわたすとびらをえらぶ。', 'Raise the blueprint and choose the door that passes the question onward instead of only guarding it.'),
    success: trpgCopy('校章の線が扉の空白と重なり、原室の目的が初めて読めた。', 'こうしょうのせんがとびらのくうはくとかさなり、げんしつのもくてきがはじめてよめた。', 'The emblem lines meet the door’s blanks and reveal the origin room’s purpose.'),
    failure: trpgCopy('扉は閉じたままだが、設計図の余白に次の世代への指示が残った。', 'とびらはとじたままだが、せっけいずのよはくにつぎのせだいへのしじがのこった。', 'The door stays shut, but the blueprint margin leaves instructions for the next generation.'),
  },
  5: {
    stat: 'friendship',
    label: trpgCopy('0時間目の名簿を読む', 'れいじかんめのめいぼをよむ', 'Read the zero-hour register'),
    detail: trpgCopy('発見した名前を仲間と読み上げ、最初の鐘へ返す呼びかけを作る。', 'はっけんしたなまえをなかまとよみあげ、さいしょのかねへかえすよびかけをつくる。', 'Read the recovered names with your allies and form a call back to the First Bell.'),
    success: trpgCopy('名簿の空欄が声で埋まり、鐘は敵意ではなく返事を返した。', 'めいぼのくうらんがこえでうまり、かねはてきいではなくへんじをかえした。', 'Voices fill the register’s blanks, and the bell answers without hostility.'),
    failure: trpgCopy('呼びかけは途切れたが、一つの名前が鐘の内側へ届いた。', 'よびかけはとぎれたが、ひとつのなまえがかねのうちがわへとどいた。', 'The call breaks apart, but one name reaches the inside of the bell.'),
  },
};

const expansionCopy = (chapter: number, index: number, location: ExpansionLocationBlueprint, archetype: TrpgEventArchetype, isFinal = false) => {
  const phase = isFinal ? '最終局面' : `探索 ${String(index).padStart(2, '0')}`;
  const phaseHira = isFinal ? 'さいしゅうきょくめん' : `たんさく ${String(index).padStart(2, '0')}`;
  const phaseEn = isFinal ? 'FINAL CONFRONTATION' : `EXPEDITION ${String(index).padStart(2, '0')}`;
  return {
    eyebrow: trpgCopy(`第${chapter + 1}章 // ${phase}`, `だい${chapter + 1}しょう // ${phaseHira}`, `CHAPTER ${chapter + 1} // ${phaseEn}`),
    title: trpgCopy(`${location.name.ja}の記録`, `${location.name.hira}のきろく`, `${location.name.en} Record`),
    body: trpgCopy(
      `${location.description.ja} ${EXPANSION_CHAPTER_MOTIFS[chapter]?.ja || ''} ${EXPANSION_STORY_BEATS[archetype].ja}`,
      `${location.description.hira} ${EXPANSION_CHAPTER_MOTIFS[chapter]?.hira || ''} ${EXPANSION_STORY_BEATS[archetype].hira}`,
      `${location.description.en} ${EXPANSION_CHAPTER_MOTIFS[chapter]?.en || ''} ${EXPANSION_STORY_BEATS[archetype].en}`,
    ),
  };
};

const expansionArchetype = (index: number, final = false): TrpgEventArchetype => {
  if (final) return 'COMBAT';
  return (['INVESTIGATION', 'DIALOGUE', 'PUZZLE', 'CHASE', 'DEFENSE'] as const)[(index - 1) % 5];
};

const makeExpansionChoices = (chapter: number, index: number, final = false, archetype: TrpgEventArchetype = expansionArchetype(index, final)) => {
  const key = `chapter${chapter}.clue${index}`;
  const resolution = EXPANSION_RESOLUTIONS[archetype === 'COMBAT' ? 'INVESTIGATION' : archetype];
  const shared = (stat: TrpgStat, label: TrpgCopy, detail: TrpgCopy, flags: Record<string, boolean | number | string>): TrpgChoice => ({
    id: `${key}-${stat}`,
    stat,
    difficulty: final ? 7 : 5 + (index % 2),
    clueOnSuccess: 1,
    stressOnFailure: final ? 1 : 0,
    label,
    detail,
    success: resolution.success,
    failure: resolution.failure,
    flags: {
      ...flags,
      [key]: true,
    },
    successFlags: {
      [`${key}.result`]: 'CLEAR',
      [`chapter${chapter}.momentum`]: archetype,
      [`chapter${chapter}.setback`]: false,
      ...(chapter === 4 && index === 4 ? { hiddenKey: true } : {}),
    },
    failureFlags: {
      [`${key}.result`]: 'SETBACK',
      [`chapter${chapter}.momentum`]: 'SETBACK',
      [`chapter${chapter}.setback`]: true,
    },
  });
  const signature = EXPANSION_SIGNATURES[chapter];
  const makeSignatureChoice = (): TrpgChoice | null => {
    if (!signature) return null;
    const signatureKey = `chapter${chapter}.signature.${index}`;
    return {
      id: `${key}-signature`,
      stat: signature.stat,
      difficulty: final ? 8 : 5 + ((index + chapter) % 2),
      clueOnSuccess: 2,
      stressOnFailure: final ? 1 : 0,
      label: signature.label,
      detail: signature.detail,
      success: signature.success,
      failure: signature.failure,
      requiresFlag: index > 1 ? `chapter${chapter}.signature.${index - 1}` : undefined,
      flags: { signatureAttempted: true },
      successFlags: {
        [signatureKey]: true,
        [`chapter${chapter}.signatureScore`]: index,
        ...(final ? { [`chapter${chapter}.finalSignature`]: true, [`chapter${chapter}Boss`]: true } : {}),
      },
      failureFlags: { [`${signatureKey}.failed`]: true },
    };
  };
  if (final) {
    const choices = [
      shared('courage', trpgCopy('核心へ踏み込む', 'かくしんへふみこむ', 'Step into the core'), trpgCopy('勇気で番人の中心へ進み、最終戦を開く。', 'ゆうきでばんにんのちゅうしんへすすみ、さいしゅうせんをひらく。', 'Use Courage to enter the guardian’s core and open the final encounter.'), { [`chapter${chapter}Boss`]: true }),
      shared('friendship', trpgCopy('仲間と記憶を掲げる', 'なかまときおくをかかげる', 'Raise the memory together'), trpgCopy('友情で記憶を束ね、別解のある最終戦を開く。', 'ゆうじょうできおくをたばね、べっかいのあるさいしゅうせんをひらく。', 'Use Friendship to bind the memories and open a multi-solution finale.'), { [`chapter${chapter}Boss`]: true, companionTrusted: true }),
    ];
    const signatureChoice = makeSignatureChoice();
    return signatureChoice ? [...choices, signatureChoice] : choices;
  }
  const choicesByArchetype: Record<Exclude<TrpgEventArchetype, 'COMBAT'>, TrpgChoice[]> = {
    INVESTIGATION: [
      shared('study', trpgCopy('痕跡を採取して記録する', 'こんせきをさいしゅしてきろくする', 'Collect and catalogue the traces'), trpgCopy('学力で証拠を分類し、次の地点を予測する。', 'がくりょくでしょうこをぶんるいし、つぎのちてんをよそくする。', 'Use Study to classify evidence and predict the next location.'), { evidenceLogged: true }),
      shared('friendship', trpgCopy('証言をつないで照合する', 'しょうげんをつないでしょうごうする', 'Cross-check linked testimonies'), trpgCopy('友情で証言を重ね、隠れた近道を見つける。', 'ゆうじょうでしょうげんをかさね、かくれたちかみちをみつける。', 'Use Friendship to compare testimonies and find a hidden shortcut.'), { allyEvidence: true }),
    ],
    DIALOGUE: [
      shared('friendship', trpgCopy('相手の記憶を最後まで聞く', 'あいてのきおくをさいごまできく', 'Listen to the memory to the end'), trpgCopy('友情判定。信頼を得て別の証言を引き出す。', 'ゆうじょうはんてい。しんらいをえてべつのしょうげんをひきだす。', 'Friendship check. Earn trust and unlock another testimony.'), { dialogueOpened: true }),
      shared('study', trpgCopy('矛盾する記録を示す', 'むじゅんするきろくをしめす', 'Present the conflicting record'), trpgCopy('学力判定。記憶の食い違いから真相へ迫る。', 'がくりょくはんてい。きおくのくいちがいからしんそうへせまる。', 'Study check. Use the contradiction to close in on the truth.'), { contradictionFound: true }),
      shared('courage', trpgCopy('答えを急がず沈黙を守る', 'こたえをいそがずちんもくをまもる', 'Hold the silence instead of rushing'), trpgCopy('勇気判定。相手が自分から核心を話すまで待つ。', 'ゆうきはんてい。あいてがじぶんからかくしんをはなすまでまつ。', 'Courage check. Wait until the witness volunteers the core clue.'), { patience: true }),
    ],
    PUZZLE: [
      shared('study', trpgCopy('装置の規則を組み替える', 'そうちのきそくをくみかえる', 'Reconfigure the device rules'), trpgCopy('学力判定。正しい順番で仕掛けを解く。', 'がくりょくはんてい。ただしいじゅんばんでしかけをとく。', 'Study check. Solve the mechanism in the correct order.'), { puzzleSolved: true }),
      shared('energy', trpgCopy('力で歯車を止める', 'ちからではぐるまをとめる', 'Stop the gears by force'), trpgCopy('体力判定。危険な装置を一時停止する。', 'たいりょくはんてい。きけんなそうちをいちじていしする。', 'Energy check. Halt the dangerous mechanism for a moment.'), { mechanismStopped: true }),
    ],
    CHASE: [
      shared('courage', trpgCopy('光の先へ先回りする', 'ひかりのさきへさきまわりする', 'Cut ahead of the moving light'), trpgCopy('勇気判定。時間を節約し、追跡の先手を取る。', 'ゆうきはんてい。じかんをせつやくし、ついせきのせんてをとる。', 'Courage check. Save time and gain the first move in the chase.'), { chaseLead: true }),
      shared('energy', trpgCopy('仲間を支えながら走る', 'なかまをささえながらはしる', 'Run while supporting an ally'), trpgCopy('体力判定。疲労を抑えながら追跡を続ける。', 'たいりょくはんてい。ひろうをおさえながらついせきをつづける。', 'Energy check. Continue the chase while limiting fatigue.'), { allyProtected: true }),
    ],
    DEFENSE: [
      shared('energy', trpgCopy('入口を守って時間を稼ぐ', 'いりぐちをまもってじかんをかせぐ', 'Hold the entrance to buy time'), trpgCopy('体力判定。仲間が調査を終えるまで耐える。', 'たいりょくはんてい。なかまがちょうさをおえるまでたえる。', 'Energy check. Endure until your allies finish their search.'), { defendedGate: true }),
      shared('friendship', trpgCopy('役割を分けて守り抜く', 'やくわりをわけてまもりぬく', 'Divide roles and hold the line'), trpgCopy('友情判定。仲間の連携で被害を分散する。', 'ゆうじょうはんてい。なかまのれんけいでひがいをぶんさんする。', 'Friendship check. Coordinate allies to spread the impact.'), { formationReady: true }),
    ],
  };
  const choices = choicesByArchetype[archetype === 'COMBAT' ? 'INVESTIGATION' : archetype];
  const signatureChoice = makeSignatureChoice();
  return signatureChoice ? [...choices, signatureChoice] : choices;
};

const EXPANSION_REWARD_BLUEPRINTS: Record<number, Array<Pick<TrpgReward, 'name' | 'description' | 'useCopy' | 'effect'>>> = {
  2: [
    { name: trpgCopy('残響の入場券', 'ざんきょうのにゅうじょうけん', 'Echo Admission Ticket'), description: trpgCopy('次章の最初の判定で、祭りの残響が答えを先取りして合計値を2上げる。', 'じしょうのさいしょのはんていで、まつりのざんきょうがこたえをさきどりしてごうけいちをにあげる。', 'The festival echo adds 2 to the first check in the next chapter.'), useCopy: trpgCopy('次章で最初に選択肢を判定した時に自動使用。', 'じしょうでさいしょにせんたくしをはんていしたときにじどうしよう。', 'Automatically used on the first choice check in the next chapter.'), effect: { kind: 'CHECK_BONUS', amount: 2 } },
    { name: trpgCopy('星火の手鏡', 'ほしびのてかがみ', 'Starfire Hand Mirror'), description: trpgCopy('次の番人戦で、鏡に映る攻撃予兆を読み取り洞察を2得る。', 'つぎのばんにんせんで、かがみにうつるこうげきよちょうをよみとりどうさつをにえる。', 'Read the next guardian’s attack omen in the mirror and begin with 2 insight.'), useCopy: trpgCopy('次章の番人戦が始まった時に自動使用。', 'じしょうのばんにんせんがはじまったときにじどうしよう。', 'Automatically used when the next guardian encounter begins.'), effect: { kind: 'COMBAT_INSIGHT', amount: 2 } },
    { name: trpgCopy('記憶屋台の札', 'きおくやたいのふだ', 'Memory-Stall Tag'), description: trpgCopy('次の問題ゲートで、札に残る記憶が正答1問分の手がかりを補う。', 'つぎのもんだいゲートで、ふだにのこるきおくがせいとういちもんぶんのてがかりをおぎなう。', 'Its stored memory supplies one answer’s worth of evidence at the next quiz gate.'), useCopy: trpgCopy('次章で最初の3問を解き終えた時に自動使用。', 'じしょうでさいしょのさんもんをときおえたときにじどうしよう。', 'Automatically used after the first three-question gate in the next chapter.'), effect: { kind: 'QUESTION_CLUE', amount: 1 } },
  ],
  3: [
    { name: trpgCopy('越境コンパス', 'えっきょうコンパス', 'Outbound Compass'), description: trpgCopy('次章で最初に移動する時、校外航路が近道を示して時間消費を2減らす。', 'じしょうでさいしょにいどうするとき、こうがいこうろがちかみちをしめしてじかんしょうひをにへらす。', 'The outbound route reduces the first travel cost in the next chapter by 2.'), useCopy: trpgCopy('次章で最初の地点へ移動した時に自動使用。', 'じしょうでさいしょのちてんへいどうしたときにじどうしよう。', 'Automatically used on the first travel in the next chapter.'), effect: { kind: 'TRAVEL_TIME', amount: 2 } },
    { name: trpgCopy('反響図書票', 'はんきょうとしょひょう', 'Echo Library Slip'), description: trpgCopy('次の問題ゲートで、過去の解答記録が正答1問分を補う。', 'つぎのもんだいゲートで、かこのかいとうきろくがせいとういちもんぶんをおぎなう。', 'A past answer record supplies one answer’s worth of evidence at the next quiz gate.'), useCopy: trpgCopy('次章で最初の3問を解き終えた時に自動使用。', 'じしょうでさいしょのさんもんをときおえたときにじどうしよう。', 'Automatically used after the first three-question gate in the next chapter.'), effect: { kind: 'QUESTION_CLUE', amount: 1 } },
    { name: trpgCopy('遠景観測レンズ', 'えんけいかんそくレンズ', 'Distant Observation Lens'), description: trpgCopy('次の番人戦で遠方の動きを先読みし、洞察を2得る。', 'つぎのばんにんせんでえんぽうのうごきをさきよみし、どうさつをにえる。', 'Read the next guardian from afar and begin with 2 insight.'), useCopy: trpgCopy('次章の番人戦が始まった時に自動使用。', 'じしょうのばんにんせんがはじまったときにじどうしよう。', 'Automatically used when the next guardian encounter begins.'), effect: { kind: 'COMBAT_INSIGHT', amount: 2 } },
  ],
  4: [
    { name: trpgCopy('始祖の設計図', 'しそのせっけいず', 'Founders’ Blueprint'), description: trpgCopy('隠し章の最初の判定で、原室の構造知識が合計値を2上げる。', 'かくししょうのさいしょのはんていで、げんしつのこうぞうちしきがごうけいちをにあげる。', 'Origin-room knowledge adds 2 to the first check in the hidden chapter.'), useCopy: trpgCopy('隠し章で最初に選択肢を判定した時に自動使用。', 'かくししょうでさいしょにせんたくしをはんていしたときにじどうしよう。', 'Automatically used on the first choice check in the hidden chapter.'), effect: { kind: 'CHECK_BONUS', amount: 2 } },
    { name: trpgCopy('記憶貯水の小瓶', 'きおくちょすいのこびん', 'Memory Reservoir Vial'), description: trpgCopy('隠し章開始時に記憶の水を飲み、疲労を2回復する。', 'かくししょうかいしじにきおくのみずをのみ、ひろうをにかいふくする。', 'Drink the stored memory at the start of the hidden chapter to recover 2 stress.'), useCopy: trpgCopy('隠し章へ進んだ直後に自動使用。', 'かくししょうへすすんだちょくごにじどうしよう。', 'Automatically used immediately after entering the hidden chapter.'), effect: { kind: 'FATIGUE_RECOVERY', amount: 2 } },
    { name: trpgCopy('原室の鍵', 'げんしつのかぎ', 'Origin Chamber Key'), description: trpgCopy('最初の鐘との対話口を開き、隠し章の番人戦を対話2から始める。', 'さいしょのかねとのたいわぐちをひらき、かくししょうのばんにんせんをたいわにからはじめる。', 'Open a dialogue with the First Bell and begin its encounter with 2 resolve.'), useCopy: trpgCopy('隠し章の番人戦が始まった時に自動使用。', 'かくししょうのばんにんせんがはじまったときにじどうしよう。', 'Automatically used when the hidden guardian encounter begins.'), effect: { kind: 'COMBAT_RESOLVE', amount: 2 } },
  ],
  5: [
    { name: trpgCopy('零時の鐘片', 'れいじのかねへん', 'Zero-Hour Bell Fragment'), description: trpgCopy('最初の鐘を封じた結末に、失われた始業時刻を記録する。', 'さいしょのかねをふうじたけつまつに、うしなわれたしぎょうじこくをきろくする。', 'Records the lost first hour in the ending where the First Bell is sealed.'), useCopy: trpgCopy('発見物選択後、撃破ルートの結末文に反映。', 'はっけんぶつせんたくご、げきはルートのけつまつぶんにはんえい。', 'Applied to the defeat-route ending after selection.'), effect: { kind: 'ENDING_KEY', amount: 1 } },
    { name: trpgCopy('星図の糸', 'せいずのいと', 'Constellation Thread'), description: trpgCopy('仲間との記憶を結び、説得ルートから時空結末へ到達できる。', 'なかまとのきおくをむすび、せっとくルートからじくうけつまつへとうたつできる。', 'Binds your team’s memories so persuasion can reach the timeline ending.'), useCopy: trpgCopy('全問正解・仲間の信頼・説得成功がそろった結末判定で使用。', 'ぜんもんせいかい・なかまのしんらい・せっとくせいこうがそろったけつまつはんていでしよう。', 'Used when perfect answers, ally trust, and persuasion meet at the ending branch.'), effect: { kind: 'ENDING_KEY', amount: 2 } },
    { name: trpgCopy('無名簿の栞', 'むめいぼのしおり', 'Nameless Register Bookmark'), description: trpgCopy('忘れられた生徒の名前を残し、退避ルートの記録を完全な帰還記録へ変える。', 'わすれられたせいとのなまえをのこし、たいひルートのきろくをかんぜんなきかんきろくへかえる。', 'Preserves the forgotten names and completes the record of an escape-route return.'), useCopy: trpgCopy('発見物選択後、退避ルートの結末文に反映。', 'はっけんぶつせんたくご、たいひルートのけつまつぶんにはんえい。', 'Applied to the escape-route ending after selection.'), effect: { kind: 'ENDING_KEY', amount: 3 } },
  ],
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
    const archetype = expansionArchetype(eventNumber, final);
    const copy = expansionCopy(blueprint.chapter, eventNumber, location, archetype, final);
    return {
      id: location.eventId,
      locationId: location.id,
      chapter: blueprint.chapter,
      title: copy.title,
      eyebrow: copy.eyebrow,
      body: copy.body,
      backgroundAsset: location.backgroundAsset,
      foregroundAsset: index % 2 === 0 ? 'sprites/backgrounds/mini-games/foreground/school-trpg.png' : undefined,
      archetype,
      choices: makeExpansionChoices(blueprint.chapter, eventNumber, final, archetype),
      nextPhase: final ? 'COMBAT' : eventNumber === 4 ? 'QUESTION' : 'MAP',
      questionGate: eventNumber === 4 ? blueprint.researchGate : undefined,
    };
  });
  const rewardBlueprints = EXPANSION_REWARD_BLUEPRINTS[blueprint.chapter];
  const rewards: TrpgReward[] = [1, 2, 3].map(index => ({
    id: `chapter${blueprint.chapter}-relic-${index}`,
    chapter: blueprint.chapter,
    useChapter: blueprint.chapter + 1,
    artName: `${blueprint.chapter}-${index}-discovery`,
    artAsset: SCHOOL_TRPG_DISCOVERY_ART[`chapter${blueprint.chapter}-relic-${index}` as keyof typeof SCHOOL_TRPG_DISCOVERY_ART],
    flag: `rewardChapter${blueprint.chapter}Relic${index}`,
    ...rewardBlueprints[index - 1],
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
    route: (['DEFEAT', 'PERSUADE', 'ESCAPE', 'OVERWHELMED', 'TIMELINE'] as const)[index],
    title: trpgCopy(`${blueprint.label.ja}・${endingLabels[index]}`, `${blueprint.label.hira}・${endingHira[index]}`, `${blueprint.label.en} // ${endingEnglish[index]}`),
    subtitle: trpgCopy(`${routeLabels[index]}ルート`, `${routeHira[index]}ルート`, `${routeEnglish[index]} ROUTE`),
    body: trpgCopy(`${blueprint.label.ja}で集めた記録が、校章の記憶を${bodyJa[index]}。`, `${blueprint.label.hira}であつめたきろくが、こうしょうのきおくを${bodyHira[index]}。`, `The records from ${blueprint.label.en} ${bodyEnglish[index]}.`),
  }));
  return { locations, events, rewards, endings };
};

export const SCHOOL_TRPG_CHAPTERS: TrpgChapterMeta[] = [
  { chapter: 0, label: trpgCopy('導入章・失われた校章', 'どうにゅうしょう・うしなわれたこうしょう', 'PROLOGUE // THE MISSING EMBLEM'), shortLabel: trpgCopy('導入章', 'どうにゅうしょう', 'PROLOGUE'), routeLabel: trpgCopy('航路 00', 'こうろ 00', 'ROUTE 00'), battleLabel: trpgCopy('記憶の番人との対決', 'きおくのばんにんとのたいけつ', 'ENCOUNTER: MEMORY GUARDIAN'), guardianName: trpgCopy('思い出の残滓', 'おもいでのざんし', 'MEMORY REMNANT'), guardianAsset: 'sprites/high-school/enemies/0.webp', battleBackgroundAsset: 'sprites/backgrounds/learning-rogue/battle-library.webp', researchGate: 'LIBRARY', clearGate: 'MISSION_CLEAR' },
  { chapter: 1, label: trpgCopy('第2章・時計塔の余白', 'だいにしょう・とけいとうのよはく', 'CHAPTER 2 // THE CLOCK TOWER MARGIN'), shortLabel: trpgCopy('第2章', 'だいにしょう', 'CHAPTER 2'), routeLabel: trpgCopy('航路 01', 'こうろ 01', 'ROUTE 01'), battleLabel: trpgCopy('時計塔の番人との対決', 'とけいとうのばんにんとのたいけつ', 'ENCOUNTER: CLOCK TOWER GUARDIAN'), guardianName: trpgCopy('時計塔の番人', 'とけいとうのばんにん', 'CLOCK TOWER GUARDIAN'), guardianAsset: 'sprites/high-school/enemies/8.webp', battleBackgroundAsset: 'sprites/backgrounds/learning-rogue/battle-rooftop.webp', researchGate: 'CHAPTER1_RESEARCH', clearGate: 'CHAPTER1_CLEAR' },
  { chapter: 2, label: trpgCopy('第3章・祭りの残響', 'だいさんしょう・まつりのざんきょう', 'CHAPTER 3 // FESTIVAL ECHOES'), shortLabel: trpgCopy('第3章', 'だいさんしょう', 'CHAPTER 3'), routeLabel: trpgCopy('航路 02', 'こうろ 02', 'ROUTE 02'), battleLabel: trpgCopy('祭りの残響との対決', 'まつりのざんきょうとのたいけつ', 'ENCOUNTER: FESTIVAL ECHO'), guardianName: trpgCopy('祭りの残響', 'まつりのざんきょう', 'FESTIVAL ECHO'), guardianAsset: 'sprites/high-school/enemies/16.webp', battleBackgroundAsset: 'sprites/backgrounds/learning-rogue/map-festival.webp', researchGate: 'CHAPTER2_RESEARCH', clearGate: 'CHAPTER2_CLEAR' },
  { chapter: 3, label: trpgCopy('第4章・校外航路', 'だいよんしょう・こうがいこうろ', 'CHAPTER 4 // BEYOND CAMPUS'), shortLabel: trpgCopy('第4章', 'だいよんしょう', 'CHAPTER 4'), routeLabel: trpgCopy('航路 03', 'こうろ 03', 'ROUTE 03'), battleLabel: trpgCopy('校外航路の番人との対決', 'こうがいこうろのばんにんとのたいけつ', 'ENCOUNTER: OUTBOUND GUARDIAN'), guardianName: trpgCopy('校外航路の番人', 'こうがいこうろのばんにん', 'OUTBOUND GUARDIAN'), guardianAsset: 'sprites/magic/enemies/19.webp', battleBackgroundAsset: 'sprites/backgrounds/learning-rogue/battle-rooftop.webp', researchGate: 'CHAPTER3_RESEARCH', clearGate: 'CHAPTER3_CLEAR' },
  { chapter: 4, label: trpgCopy('第5章・原室の記憶', 'だいごしょう・げんしつのきおく', 'CHAPTER 5 // MEMORY OF THE ORIGIN ROOM'), shortLabel: trpgCopy('第5章', 'だいごしょう', 'CHAPTER 5'), routeLabel: trpgCopy('航路 04', 'こうろ 04', 'ROUTE 04'), battleLabel: trpgCopy('原室の番人との対決', 'げんしつのばんにんとのたいけつ', 'ENCOUNTER: ORIGIN GUARDIAN'), guardianName: trpgCopy('原室の番人', 'げんしつのばんにん', 'ORIGIN GUARDIAN'), guardianAsset: 'sprites/magic/enemies/35.webp', battleBackgroundAsset: 'sprites/backgrounds/learning-rogue/magic-battle-library.webp', researchGate: 'CHAPTER4_RESEARCH', clearGate: 'CHAPTER4_CLEAR' },
  { chapter: 5, label: trpgCopy('隠し章・0時間目', 'かくししょう・れいじかんめ', 'HIDDEN CHAPTER // ZERO HOUR'), shortLabel: trpgCopy('隠し章', 'かくししょう', 'HIDDEN'), routeLabel: trpgCopy('秘航路 H', 'ひこうろ H', 'SECRET ROUTE H'), battleLabel: trpgCopy('最初の鐘との対決', 'さいしょのかねとのたいけつ', 'ENCOUNTER: THE FIRST BELL'), guardianName: trpgCopy('最初の鐘', 'さいしょのかね', 'THE FIRST BELL'), guardianAsset: 'sprites/magic/enemies/43.webp', battleBackgroundAsset: 'sprites/backgrounds/learning-rogue/magic-final-bridge.webp', researchGate: 'HIDDEN_RESEARCH', clearGate: 'HIDDEN_CLEAR', hidden: true },
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
    id: 'emblem-shard', artName: '校章ブレイク', artAsset: SCHOOL_TRPG_DISCOVERY_ART['emblem-shard'], flag: 'rewardEmblemShard',
    name: trpgCopy('校章の欠片', 'こうしょうのかけら', 'Emblem Fragment'),
    description: trpgCopy('次章の最初の判定で校章が正しい航路を照らし、合計値を1上げる。', 'じしょうのさいしょのはんていでこうしょうがただしいこうろをてらし、ごうけいちをいちあげる。', 'The emblem lights the correct route and adds 1 to the first check in the next chapter.'),
    useCopy: trpgCopy('第2章で最初に選択肢を判定した時に自動使用。', 'だいにしょうでさいしょにせんたくしをはんていしたときにじどうしよう。', 'Automatically used on the first choice check in Chapter 2.'), effect: { kind: 'CHECK_BONUS', amount: 1 },
  },
  {
    id: 'branch-notebook', artName: '分岐予測ノート', artAsset: SCHOOL_TRPG_DISCOVERY_ART['branch-notebook'], flag: 'rewardBranchNotebook',
    name: trpgCopy('分岐予測ノート', 'ぶんきよそくノート', 'Branch Forecast Notebook'),
    description: trpgCopy('次章の最初の判定で分岐予測を書き込み、合計値を2上げる。', 'じしょうのさいしょのはんていでぶんきよそくをかきこみ、ごうけいちをにあげる。', 'Forecasts the branch and adds 2 to the first check in the next chapter.'),
    useCopy: trpgCopy('第2章で最初に選択肢を判定した時に自動使用。', 'だいにしょうでさいしょにせんたくしをはんていしたときにじどうしよう。', 'Automatically used on the first choice check in Chapter 2.'), effect: { kind: 'CHECK_BONUS', amount: 2 },
  },
  {
    id: 'handmade-map', artName: '手作りの宝地図', artAsset: SCHOOL_TRPG_DISCOVERY_ART['handmade-map'], flag: 'rewardHandmadeMap',
    name: trpgCopy('放課後の手作り地図', 'ほうかごのてづくりちず', 'Handmade After-School Map'),
    description: trpgCopy('次章で最初に移動する時、仲間の近道で時間消費を1減らす。', 'じしょうでさいしょにいどうするとき、なかまのちかみちでじかんしょうひをいちへらす。', 'Uses an ally’s shortcut to reduce the first travel cost in the next chapter by 1.'),
    useCopy: trpgCopy('第2章で最初の地点へ移動した時に自動使用。', 'だいにしょうでさいしょのちてんへいどうしたときにじどうしよう。', 'Automatically used on the first travel in Chapter 2.'), effect: { kind: 'TRAVEL_TIME', amount: 1 },
  },
];

SCHOOL_TRPG_REWARDS.push(
  {
    id: 'clockwork-chime', chapter: 1, artName: '時計塔のチャイム', artAsset: SCHOOL_TRPG_DISCOVERY_ART['clockwork-chime'], flag: 'rewardClockworkChime',
    name: trpgCopy('時計塔のチャイム', 'とけいとうのチャイム', 'Clock-Tower Chime'),
    description: trpgCopy('次章で最初に移動する時、チャイムが時間を巻き戻して時間消費を1減らす。', 'じしょうでさいしょにいどうするとき、チャイムがじかんをまきもどしてじかんしょうひをいちへらす。', 'The chime rewinds time and reduces the first travel cost in the next chapter by 1.'),
    useCopy: trpgCopy('第3章で最初の地点へ移動した時に自動使用。', 'だいさんしょうでさいしょのちてんへいどうしたときにじどうしよう。', 'Automatically used on the first travel in Chapter 3.'), effect: { kind: 'TRAVEL_TIME', amount: 1 },
  },
  {
    id: 'star-chart', chapter: 1, artName: '夜空の星図', artAsset: SCHOOL_TRPG_DISCOVERY_ART['star-chart'], flag: 'rewardStarChart',
    name: trpgCopy('夜空の星図', 'よぞらのせいず', 'Night-Sky Chart'),
    description: trpgCopy('次章の最初の判定で星図が安全な選択を示し、合計値を1上げる。', 'じしょうのさいしょのはんていでせいずがあんぜんなせんたくをしめし、ごうけいちをいちあげる。', 'The chart reveals the safer branch and adds 1 to the first check in the next chapter.'),
    useCopy: trpgCopy('第3章で最初に選択肢を判定した時に自動使用。', 'だいさんしょうでさいしょにせんたくしをはんていしたときにじどうしよう。', 'Automatically used on the first choice check in Chapter 3.'), effect: { kind: 'CHECK_BONUS', amount: 1 },
  },
  {
    id: 'memory-contract', chapter: 1, artName: '記憶の契約書', artAsset: SCHOOL_TRPG_DISCOVERY_ART['memory-contract'], flag: 'rewardMemoryContract',
    name: trpgCopy('記憶の契約書', 'きおくのけいやくしょ', 'Memory Pact'),
    description: trpgCopy('次章の番人戦で契約を提示し、対話を2進めた状態から始める。', 'じしょうのばんにんせんでけいやくをていじし、たいわをにすすめたじょうたいからはじめる。', 'Present the pact and begin the next guardian encounter with 2 resolve.'),
    useCopy: trpgCopy('第3章の番人戦が始まった時に自動使用。', 'だいさんしょうのばんにんせんがはじまったときにじどうしよう。', 'Automatically used when the Chapter 3 guardian encounter begins.'), effect: { kind: 'COMBAT_RESOLVE', amount: 2 },
  },
);

export const SCHOOL_TRPG_ENDINGS: TrpgEnding[] = [
  {
    id: 'detective-club', tone: 'CYAN', route: 'DEFEAT',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/prologue-seal.webp',
    title: trpgCopy('放課後探偵団の始業式', 'ほうかごたんていだんのしぎょうしき', 'The Detective Club Begins'),
    subtitle: trpgCopy('撃破ルート // 仲間と証拠を守った', 'げきはルート // なかまとしょうこをまもった', 'SEAL ROUTE // CLUES PRESERVED'),
    body: trpgCopy('番人を封じ、校章の欠片を回収した。集めた証拠を先生へ報告し、放課後の学園を調べる正式なチームが生まれた。', 'ばんにんをふうじ、こうしょうのかけらをかいしゅうした。あつめたしょうこをせんせいへほうこくし、ほうかごのがくえんをしらべるせいしきなチームがうまれた。', 'You seal the guardian and recover the fragment. The evidence earns your group official permission to investigate the after-school campus.'),
  },
  {
    id: 'memory-returned', tone: 'VIOLET', route: 'PERSUADE',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/prologue-pact.webp',
    title: trpgCopy('記憶を返す日', 'きおくをかえすひ', 'The Day Memory Returned'),
    subtitle: trpgCopy('説得ルート // 番人の目的を理解した', 'せっとくルート // ばんにんのもくてきをりかいした', 'PERSUASION ROUTE // PURPOSE UNDERSTOOD'),
    body: trpgCopy('番人は敵ではなく、忘れられた卒業生の記憶を守っていた。校章を奪わず記憶を返したことで、時計塔への新しい道が開いた。', 'ばんにんはてきではなく、わすれられたそつぎょうせいのきおくをまもっていた。こうしょうをうばわずきおくをかえしたことで、とけいとうへのあたらしいみちがひらいた。', 'The guardian was protecting forgotten alumni memories. Returning them instead of taking the emblem opens a new route toward the clock tower.'),
  },
  {
    id: 'quiet-return', tone: 'GOLD', route: 'ESCAPE',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/prologue-return.webp',
    title: trpgCopy('静かな帰宅', 'しずかなきたく', 'A Quiet Walk Home'),
    subtitle: trpgCopy('退避ルート // 謎を次へ持ち越した', 'たいひルート // なぞをつぎへもちこした', 'ESCAPE ROUTE // MYSTERY DEFERRED'),
    body: trpgCopy('番人を倒すことより、仲間と手がかりを持ち帰ることを選んだ。旧校舎は閉じたままだが、次に必要な準備は分かっている。', 'ばんにんをたおすことより、なかまとてがかりをもちかえることをえらんだ。きゅうこうしゃはとじたままだが、つぎにひつようなじゅんびはわかっている。', 'You choose to bring your ally and clues home instead of defeating the guardian. The old wing stays sealed, but you now know what the next attempt needs.'),
  },
  {
    id: 'unfinished-map', tone: 'ROSE', route: 'OVERWHELMED',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/prologue-blank.webp',
    title: trpgCopy('未完成の放課後地図', 'みかんせいのほうかごちず', 'The Unfinished After-School Map'),
    subtitle: trpgCopy('疲労ルート // 手がかりは失われていない', 'ひろうルート // てがかりはうしなわれていない', 'FATIGUE ROUTE // CLUES SURVIVED'),
    body: trpgCopy('番人の力に押し戻されたが、記録と仲間は守り抜いた。失敗は地図の空白になり、次の探索で埋めるべき場所を示している。', 'ばんにんのちからにおしもどされたが、きろくとなかまはまもりぬいた。しっぱいはちずのくうはくになり、つぎのたんさくでうめるべきばしょをしめしている。', 'The guardian forces you back, but your notes and ally are safe. Failure becomes a blank on the map, marking where the next expedition must begin.'),
  },
];

SCHOOL_TRPG_ENDINGS.push(
  {
    id: 'clockwork-dawn', chapter: 1, tone: 'CYAN', route: 'DEFEAT',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/chapter2-bell.webp',
    title: trpgCopy('鐘の音で迎える朝', 'かねのおとでむかえるあさ', 'Morning After the Bell'),
    subtitle: trpgCopy('封印ルート // 夜の記録を守った', 'ふういんルート // よるのきろくをまもった', 'SEAL ROUTE // NIGHT RECORDS PRESERVED'),
    body: trpgCopy('時計塔の鐘が朝を告げ、夜の航路は静かに閉じた。残された星図は、まだ見ぬ校外の物語を指している。', 'とけいとうのかねがあさをつげ、よるのこうろはしずかにとじた。のこされたせいずは、まだみぬこうがいのものがたりをさしている。', 'The tower bell announces morning and the night route closes. The remaining chart points toward stories beyond campus.'),
  },
  {
    id: 'constellation-pact', chapter: 1, tone: 'VIOLET', route: 'PERSUADE',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/chapter2-constellation.webp',
    title: trpgCopy('星座の契約', 'せいざのけいやく', 'The Constellation Pact'),
    subtitle: trpgCopy('説得ルート // 番人と共に歩く', 'せっとくルート // ばんにんとともにあるく', 'PERSUASION ROUTE // WALKING WITH THE GUARDIAN'),
    body: trpgCopy('番人は鐘の音を道しるべに変え、仲間たちと新しい契約を結んだ。夜の学園には、まだ名前のない地点が残っている。', 'ばんにんはかねのおとをみちしるべにかえ、なかまたちとあたらしいけいやくをむすんだ。よるのがくえんには、まだなまえのないちてんがのこっている。', 'The guardian turns the bell into a guide and makes a new pact with your team. Unnamed places remain across the night campus.'),
  },
  {
    id: 'bridge-before-dawn', chapter: 1, tone: 'GOLD', route: 'ESCAPE',
    artAsset: 'sprites/backgrounds/mini-games/school-trpg/endings/chapter2-bridge.webp',
    title: trpgCopy('夜明け前の帰路', 'よあけまえのきろ', 'Return Before Dawn'),
    subtitle: trpgCopy('退避ルート // 地図を次へ持ち越した', 'たいひルート // ちずをつぎへもちこした', 'ESCAPE ROUTE // MAP CARRIED FORWARD'),
    body: trpgCopy('連絡橋が消える前に、記録と仲間を連れて戻った。時計塔の答えは、次の夜にもう一度探せる。', 'れんらくきょうがきえるまえに、きろくとなかまをつれてもどった。とけいとうのこたえは、つぎのよるにもういちどさがせる。', 'You return with your notes and ally before the crossing disappears. The tower’s answer can be sought on another night.'),
  },
  {
    id: 'silent-clock', chapter: 1, tone: 'ROSE', route: 'OVERWHELMED',
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

// Each campaign event owns a full-width original illustration. Event artwork
// never falls back to the enlarged TRPG badge/foreground used by the title UI.
SCHOOL_TRPG_EVENTS.forEach(event => {
  event.illustrationAsset = `sprites/backgrounds/mini-games/school-trpg/events/${event.id.toLowerCase()}.webp`;
});

/**
 * A completed location can be revisited.  Revisit scenes are intentionally
 * authored as a small second beat rather than reopening the same check: the
 * previous outcome is now part of the fiction and the two actions ask the
 * player to use that changed state in a new way.
 */
const REVISIT_BEAT: Record<TrpgEventArchetype, { title: TrpgCopy; body: TrpgCopy }> = {
  INVESTIGATION: {
    title: trpgCopy('残された痕跡を再照合する', 'のこされたこんせきをさいしょうごうする', 'Cross-check the remaining traces'),
    body: trpgCopy('前回の調査で動いたものだけが、別の順番で光っている。記録を持ち帰ったことで新しい証拠の読み方が生まれた。', 'ぜんかいのちょうさでうごいたものだけが、べつのじゅんばんでひかっている。きろくをもちかえったことであたらしいしょうこのよみかたがうまれた。', 'Only the clues moved by the first investigation glow in a new order. Bringing the record home reveals another way to read the evidence.'),
  },
  DIALOGUE: {
    title: trpgCopy('返事を待つ余白', 'へんじをまつよはく', 'The pause before an answer'),
    body: trpgCopy('前回の言葉が相手の中で形を変え、今度は沈黙の長さそのものが返事になっている。', 'ぜんかいのことばがあいてのなかでかたちをかえ、こんどはちんもくのながさそのものがへんじになっている。', 'Your last words have changed shape inside the witness; this time the length of the silence is the answer.'),
  },
  PUZZLE: {
    title: trpgCopy('解かれた装置の裏面', 'とかれたそうちのうらめん', 'The solved mechanism’s reverse side'),
    body: trpgCopy('一度解いた装置を裏返すと、正解の手順が次の問いを組み立てる歯車になっていた。', 'いちどといたそうちをうらがえすと、せいかいのてじゅんがつぎのといをくみたてるはぐるまになっていた。', 'Turn the solved device over and the correct order becomes a gear that builds the next question.'),
  },
  CHASE: {
    title: trpgCopy('追跡の終点から戻る', 'ついせきのしゅうてんからもどる', 'Return from the end of the chase'),
    body: trpgCopy('逃げた光が消えた場所へ戻ると、急いだことで見落とした足跡が逆向きに残っている。', 'にげたひかりがきえたばしょへもどると、いそいだことでみおとしたあしあとがぎゃくむきにのこっている。', 'Return to where the moving light vanished and the footprints missed in the rush now point backward.'),
  },
  DEFENSE: {
    title: trpgCopy('守り終えた門の内側', 'まもりおえたもんのうちがわ', 'Inside the gate you defended'),
    body: trpgCopy('守り切った門の内側に、仲間が次に守るべき名前を残していた。成功も失敗も、配置を変える手がかりになる。', 'まもりきったもんのうちがわに、なかまがつぎにまもるべきなまえをのこしていた。せいこうもしっぱいも、はいちをかえるてがかりになる。', 'Inside the gate you held, an ally left the next name to protect. Whether you won or missed, the formation can now change.'),
  },
  COMBAT: {
    title: trpgCopy('番人の残響を記録する', 'ばんじんのざんきょうをきろくする', 'Record the guardian’s afterimage'),
    body: trpgCopy('戦いのあとに残った脅威の波形を読むと、番人が守っていた別の入口が見つかる。', 'たたかいのあとにのこったきょういのはけいをよむと、ばんじんがまもっていたべつのいりぐちがみつかる。', 'Reading the threat waveform left after the battle reveals another entrance the guardian was protecting.'),
  },
};

const makeRevisitVariant = (event: TrpgEvent): TrpgEventVariant => {
  const archetype = event.archetype || 'INVESTIGATION';
  const beat = REVISIT_BEAT[archetype];
  const choices = event.choices.slice(0, 2).map((choice, index) => ({
    ...choice,
    id: `${choice.id}-revisit`,
    difficulty: Math.min(choice.difficulty + 1, 9),
    label: trpgCopy(
      index === 0 ? `${beat.title.ja}を深く読む` : `前回の結果を仲間に渡す`,
      index === 0 ? `${beat.title.hira}をふかくよむ` : `ぜんかいのけっかをなかまにわたす`,
      index === 0 ? `Read ${beat.title.en.toLowerCase()} more deeply` : 'Pass the previous result to an ally',
    ),
    detail: trpgCopy(
      index === 0 ? '前回の選択が残した変化を、同じ場所で別の角度から確認する。' : '自分だけで抱えず、前回の結果を仲間の次の行動へつなぐ。',
      index === 0 ? 'ぜんかいのせんたくがのこしたへんかを、おなじばしょでべつのかくどからかくにんする。' : 'じぶんだけでかかえず、ぜんかいのけっかをなかまのつぎのこうどうへつなぐ。',
      index === 0 ? 'Inspect the change left by the first choice from another angle.' : 'Turn the previous result into an ally’s next action.',
    ),
    success: trpgCopy(
      `${choice.success.ja} 前回の記録が再調査の手順として定着した。`,
      `${choice.success.hira} ぜんかいのきろくがさいちょうさのてじゅんとしてていちゃくした。`,
      `${choice.success.en} The previous record now anchors the revisit procedure.`,
    ),
    failure: trpgCopy(
      `${choice.failure.ja} うまくいかなかった箇所も、次の航路に残る印になった。`,
      `${choice.failure.hira} うまくいかなかったかしょも、つぎのこうろにのこるしるしになった。`,
      `${choice.failure.en} Even the missed part becomes a mark on the next route.`,
    ),
    requiresFlag: undefined,
    flags: { ...choice.flags, [`revisit.${event.id}`]: true },
    successFlags: { ...(choice.successFlags || {}), [`revisit.${event.id}.result`]: 'CLEAR' },
    failureFlags: { ...(choice.failureFlags || {}), [`revisit.${event.id}.result`]: 'SETBACK' },
  }));
  return {
    id: `${event.id}-revisit`,
    locationId: event.locationId,
    title: beat.title,
    eyebrow: trpgCopy(`${event.eyebrow.ja} // 再調査`, `${event.eyebrow.hira} // さいちょうさ`, `${event.eyebrow.en} // REVISIT`),
    body: beat.body,
    backgroundAsset: event.backgroundAsset,
    illustrationAsset: event.illustrationAsset,
    foregroundAsset: event.foregroundAsset,
    archetype,
    choices,
    nextPhase: 'MAP',
  };
};

SCHOOL_TRPG_EVENTS.forEach(event => {
  event.revisit = makeRevisitVariant(event);
});

/** Single source of truth for ending art, crop focal points, and accessible alt copy. */
export const SCHOOL_TRPG_ENDING_ART: Record<string, TrpgEndingArt> = Object.fromEntries(
  SCHOOL_TRPG_ENDINGS.map((ending, index) => [ending.id, {
    asset: ending.artAsset || '',
    focalPoint: { x: 50 + ((index % 5) - 2) * 4, y: 50 + ((index % 3) - 1) * 5 },
    alt: trpgCopy(
      `${ending.title.ja}のエンディングイラスト`,
      `${ending.title.hira}のえんでぃんぐいらすと`,
      `Ending illustration: ${ending.title.en}`,
    ),
  }] as const),
) as Record<string, TrpgEndingArt>;

export const getTrpgEndingArt = (endingId: string | null): TrpgEndingArt | null =>
  endingId ? SCHOOL_TRPG_ENDING_ART[endingId] || null : null;

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
  revisit: trpgCopy('再調査する', 'さいちょうさする', 'REVISIT'),
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
    if (!event.illustrationAsset) errors.push(`Missing original event illustration: ${event.id}`);
    if (!event.revisit || event.revisit.choices.length < 2) errors.push(`Missing revisit scene: ${event.id}`);
    if (event.nextPhase === 'QUESTION' && !event.questionGate) errors.push(`Missing question gate: ${event.id}`);
  }
  for (const location of SCHOOL_TRPG_LOCATIONS) {
    if (!eventIds.has(location.eventId)) errors.push(`Missing location event: ${location.id}`);
  }
  if (new Set(SCHOOL_TRPG_REWARDS.map(reward => reward.id)).size !== SCHOOL_TRPG_REWARDS.length) errors.push('Duplicate rewards');
  if (new Set(SCHOOL_TRPG_REWARDS.map(reward => reward.artAsset)).size !== SCHOOL_TRPG_REWARDS.length) errors.push('Discovery artwork must be unique');
  for (const reward of SCHOOL_TRPG_REWARDS) {
    if (!reward.artAsset) errors.push(`Missing discovery artwork: ${reward.id}`);
    if (!reward.useCopy.ja || !reward.useCopy.hira || !reward.useCopy.en) errors.push(`Missing discovery usage copy: ${reward.id}`);
    if (!reward.effect.kind || reward.effect.amount < 1) errors.push(`Invalid discovery effect: ${reward.id}`);
    const originChapter = reward.chapter || 0;
    const useChapter = reward.useChapter ?? originChapter + 1;
    if (!Number.isInteger(useChapter) || useChapter < originChapter) errors.push(`Invalid discovery use chapter: ${reward.id}`);
    if (originChapter > 0 && useChapter !== originChapter + 1 && reward.effect.kind !== 'ENDING_KEY') errors.push(`Discovery should be used on the following chapter: ${reward.id}`);
  }
  if (new Set(SCHOOL_TRPG_ENDINGS.map(ending => ending.id)).size !== SCHOOL_TRPG_ENDINGS.length) errors.push('Duplicate endings');
  for (const ending of SCHOOL_TRPG_ENDINGS) {
    const art = SCHOOL_TRPG_ENDING_ART[ending.id];
    if (!art || !art.asset || !ending.artAsset || art.asset !== ending.artAsset) errors.push(`Missing ending art registry entry: ${ending.id}`);
    if (!art || art.focalPoint.x < 0 || art.focalPoint.x > 100 || art.focalPoint.y < 0 || art.focalPoint.y > 100) errors.push(`Invalid ending art focal point: ${ending.id}`);
  }
  if (new Set(SCHOOL_TRPG_EVENTS.map(event => event.illustrationAsset)).size !== SCHOOL_TRPG_EVENTS.length) errors.push('Event illustrations must be unique');
  for (const chapter of new Set(SCHOOL_TRPG_LOCATIONS.map(location => location.chapter || 0))) {
    if (!getTrpgChapterEvents(chapter).length) errors.push(`Chapter has no events: ${chapter}`);
  }
  return errors;
};
