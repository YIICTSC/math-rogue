import { trpgCopy, type TrpgEnding, type TrpgEvent, type TrpgLocation, type TrpgReward, type TrpgStat } from './schoolTrpgTypes';

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

export const SCHOOL_TRPG_ENDINGS: TrpgEnding[] = [
  {
    id: 'detective-club', tone: 'CYAN',
    title: trpgCopy('放課後探偵団の始業式', 'ほうかごたんていだんのしぎょうしき', 'The Detective Club Begins'),
    subtitle: trpgCopy('撃破ルート // 仲間と証拠を守った', 'げきはルート // なかまとしょうこをまもった', 'SEAL ROUTE // CLUES PRESERVED'),
    body: trpgCopy('番人を封じ、校章の欠片を回収した。集めた証拠を先生へ報告し、放課後の学園を調べる正式なチームが生まれた。', 'ばんにんをふうじ、こうしょうのかけらをかいしゅうした。あつめたしょうこをせんせいへほうこくし、ほうかごのがくえんをしらべるせいしきなチームがうまれた。', 'You seal the guardian and recover the fragment. The evidence earns your group official permission to investigate the after-school campus.'),
  },
  {
    id: 'memory-returned', tone: 'VIOLET',
    title: trpgCopy('記憶を返す日', 'きおくをかえすひ', 'The Day Memory Returned'),
    subtitle: trpgCopy('説得ルート // 番人の目的を理解した', 'せっとくルート // ばんにんのもくてきをりかいした', 'PERSUASION ROUTE // PURPOSE UNDERSTOOD'),
    body: trpgCopy('番人は敵ではなく、忘れられた卒業生の記憶を守っていた。校章を奪わず記憶を返したことで、時計塔への新しい道が開いた。', 'ばんにんはてきではなく、わすれられたそつぎょうせいのきおくをまもっていた。こうしょうをうばわずきおくをかえしたことで、とけいとうへのあたらしいみちがひらいた。', 'The guardian was protecting forgotten alumni memories. Returning them instead of taking the emblem opens a new route toward the clock tower.'),
  },
  {
    id: 'quiet-return', tone: 'GOLD',
    title: trpgCopy('静かな帰宅', 'しずかなきたく', 'A Quiet Walk Home'),
    subtitle: trpgCopy('退避ルート // 謎を次へ持ち越した', 'たいひルート // なぞをつぎへもちこした', 'ESCAPE ROUTE // MYSTERY DEFERRED'),
    body: trpgCopy('番人を倒すことより、仲間と手がかりを持ち帰ることを選んだ。旧校舎は閉じたままだが、次に必要な準備は分かっている。', 'ばんにんをたおすことより、なかまとてがかりをもちかえることをえらんだ。きゅうこうしゃはとじたままだが、つぎにひつようなじゅんびはわかっている。', 'You choose to bring your ally and clues home instead of defeating the guardian. The old wing stays sealed, but you now know what the next attempt needs.'),
  },
  {
    id: 'unfinished-map', tone: 'ROSE',
    title: trpgCopy('未完成の放課後地図', 'みかんせいのほうかごちず', 'The Unfinished After-School Map'),
    subtitle: trpgCopy('疲労ルート // 手がかりは失われていない', 'ひろうルート // てがかりはうしなわれていない', 'FATIGUE ROUTE // CLUES SURVIVED'),
    body: trpgCopy('番人の力に押し戻されたが、記録と仲間は守り抜いた。失敗は地図の空白になり、次の探索で埋めるべき場所を示している。', 'ばんにんのちからにおしもどされたが、きろくとなかまはまもりぬいた。しっぱいはちずのくうはくになり、つぎのたんさくでうめるべきばしょをしめしている。', 'The guardian forces you back, but your notes and ally are safe. Failure becomes a blank on the map, marking where the next expedition must begin.'),
  },
];

export const SCHOOL_TRPG_COPY = {
  title: trpgCopy('放課後スクールTRPG', 'ほうかごスクールTRPG', 'AFTER-SCHOOL TRPG'),
  campaign: trpgCopy('失われた校章', 'うしなわれたこうしょう', 'THE MISSING EMBLEM'),
  intro: trpgCopy('地図を選び、仲間と調査し、戦い方まで決める探索キャンペーン。導入章の選択は4種類の結末へつながる。', 'ちずをえらび、なかまとちょうさし、たたかいかたまできめるたんさくキャンペーン。どうにゅうしょうのせんたくはよんしゅるいのけつまつへつながる。', 'Choose routes, investigate with allies, and decide how conflicts end. Your prologue choices lead to four outcomes.'),
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
  questionHint: trpgCopy('3問の結果が手がかりと報酬に反映されます。', 'さんもんのけっかがてがかりとほうしゅうにはんえいされます。', 'The three answers affect clues and rewards.'),
  battle: trpgCopy('記憶の番人との対決', 'きおくのばんにんとのたいけつ', 'ENCOUNTER: MEMORY GUARDIAN'),
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

export const validateSchoolTrpgData = (): string[] => {
  const errors: string[] = [];
  const locationIds = new Set<string>();
  const eventIds = new Set<string>();
  for (const location of SCHOOL_TRPG_LOCATIONS) {
    if (locationIds.has(location.id)) errors.push(`Duplicate location: ${location.id}`);
    locationIds.add(location.id);
    if (location.x < 0 || location.x > 1 || location.y < 0 || location.y > 1) errors.push(`Invalid coordinates: ${location.id}`);
  }
  for (const event of SCHOOL_TRPG_EVENTS) {
    if (eventIds.has(event.id)) errors.push(`Duplicate event: ${event.id}`);
    eventIds.add(event.id);
    if (!locationIds.has(event.locationId)) errors.push(`Missing event location: ${event.id}`);
    if (event.choices.length === 0) errors.push(`Event has no choices: ${event.id}`);
    if (event.nextPhase === 'QUESTION' && !event.questionGate) errors.push(`Missing question gate: ${event.id}`);
  }
  for (const location of SCHOOL_TRPG_LOCATIONS) {
    if (!eventIds.has(location.eventId)) errors.push(`Missing location event: ${location.id}`);
  }
  if (new Set(SCHOOL_TRPG_REWARDS.map(reward => reward.id)).size !== SCHOOL_TRPG_REWARDS.length) errors.push('Duplicate rewards');
  if (new Set(SCHOOL_TRPG_ENDINGS.map(ending => ending.id)).size !== SCHOOL_TRPG_ENDINGS.length) errors.push('Duplicate endings');
  return errors;
};
