export interface EndlessChapterResult {
  chapter: number;
  title: string;
  content: string;
  englishTitle: string;
  englishContent: string;
}

/**
 * Chapter-clear records for Endless Mode. The first 49 records appear on
 * chapter result screens. Record 50 is reserved for the final clear screen,
 * where it follows the true-ending sequence without creating a Chapter 50
 * result-screen stop.
 */
export const ENDLESS_CHAPTER_RESULTS: EndlessChapterResult[] = [
  {
    chapter: 1,
    title: '深層記録 01：破れた印章',
    content: '入口の床下から、学校のものではない黒い印章が見つかった。裏面には「観測済み」とだけ刻まれている。',
    englishTitle: 'DEEP RECORD 01: The Torn Seal',
    englishContent: 'A black seal that does not belong to the school was found beneath the entrance floor. The reverse bears only two words: “Observation complete.”',
  },
  {
    chapter: 2,
    title: '深層記録 02：消えた名簿',
    content: '職員室の古い名簿から、数人分の名前だけが切り取られていた。切れ端には、見覚えのない番号が振られている。',
    englishTitle: 'DEEP RECORD 02: The Missing Register',
    englishContent: 'Several names were cut from an old staff register. The scraps carry numbers no one at the school recognizes.',
  },
  {
    chapter: 3,
    title: '深層記録 03：黒い封筒',
    content: '校長室の机に、差出人のない黒い封筒が置かれていた。中身は空なのに、紙だけが冷たく湿っている。',
    englishTitle: 'DEEP RECORD 03: The Black Envelope',
    englishContent: 'An unsigned black envelope was left on the principal’s desk. It is empty, yet the paper is cold and damp.',
  },
  {
    chapter: 4,
    title: '深層記録 04：二重の校印',
    content: '回収した答案の校印が、二重に押されていることに気づいた。薄い方の印は、誰かが学校の記録を写し取った跡らしい。',
    englishTitle: 'DEEP RECORD 04: The Double School Seal',
    englishContent: 'The school seal on the collected papers was stamped twice. The fainter mark appears to be a copy made by someone outside the school.',
  },
  {
    chapter: 5,
    title: '深層記録 05：観測欄',
    content: '倒した端末の記録には、生徒の成績ではなく「観測対象」と書かれていた。記録者の欄は黒く塗りつぶされている。',
    englishTitle: 'DEEP RECORD 05: The Observation Column',
    englishContent: 'The defeated terminal recorded students not as grades, but as “observation subjects.” The recorder’s name was painted over in black.',
  },
  {
    chapter: 6,
    title: '深層記録 06：回収命令',
    content: '廊下の掲示板に、破られた回収命令が貼られていた。誰かはこの学校を、答案を集める倉庫として見ている。',
    englishTitle: 'DEEP RECORD 06: The Retrieval Order',
    englishContent: 'A torn retrieval order was pinned to the hallway board. Someone sees this school as a warehouse for collecting answer sheets.',
  },
  {
    chapter: 7,
    title: '深層記録 07：無記名の報告',
    content: '図書室の端末から、無記名の進捗報告が一枚だけ出力された。そこには「第一校区、異常なし」と記されていた。',
    englishTitle: 'DEEP RECORD 07: The Unsigned Report',
    englishContent: 'One unsigned progress report was printed by the library terminal. It reads: “District One: no irregularities.”',
  },
  {
    chapter: 8,
    title: '深層記録 08：封鎖線',
    content: '校舎の壁に、見えない封鎖線が引かれている。線の外側から、こちらを数えるような機械音が聞こえた。',
    englishTitle: 'DEEP RECORD 08: The Quarantine Line',
    englishContent: 'An invisible quarantine line has been drawn through the school. From beyond it comes a machine counting something on our side.',
  },
  {
    chapter: 9,
    title: '深層記録 09：黒い採点',
    content: '答案の余白に、学校の採点とは違う黒い点数が浮かび上がった。合計点の横には「適性」と書かれている。',
    englishTitle: 'DEEP RECORD 09: The Black Score',
    englishContent: 'A black score unlike the school’s grading appeared in the margins of the papers. Beside the total was the word “aptitude.”',
  },
  {
    chapter: 10,
    title: '深層記録 10：帳簿の頭文字',
    content: '大ボスの装甲の中から、黒い帳簿の切れ端が見つかった。表紙には「黒帳」と、組織を思わせる頭文字が残されている。',
    englishTitle: 'DEEP RECORD 10: Initials in the Ledger',
    englishContent: 'A scrap of a black ledger was found inside the major boss’s armor. Its cover bears “Black Ledger” and initials that suggest an organization.',
  },
  {
    chapter: 11,
    title: '深層記録 11：転送票',
    content: '校長室の裏から、生徒の記録を別の場所へ送る転送票が見つかった。送り先は校舎の地図に存在しない。',
    englishTitle: 'DEEP RECORD 11: The Transfer Slip',
    englishContent: 'A transfer slip for sending student records elsewhere was found behind the principal’s office. Its destination does not exist on the school map.',
  },
  {
    chapter: 12,
    title: '深層記録 12：監査番号',
    content: '敵の残骸に、答案ではなく監査番号が刻まれていた。番号は一つではなく、学校全体を区切るように続いている。',
    englishTitle: 'DEEP RECORD 12: Audit Numbers',
    englishContent: 'Audit numbers, not grades, were etched into the enemy’s remains. They continue in a sequence that divides the entire school into sections.',
  },
  {
    chapter: 13,
    title: '深層記録 13：閉じた回線',
    content: '夜になると、校舎の電話回線がすべて同じ番号へつながろうとする。受話器の向こうでは、誰も名乗らない。',
    englishTitle: 'DEEP RECORD 13: The Closed Line',
    englishContent: 'At night, every telephone line in the school tries to connect to the same number. No one identifies themselves on the other end.',
  },
  {
    chapter: 14,
    title: '深層記録 14：欠番の教室',
    content: '廊下の教室番号に、ひとつだけ欠番がある。扉の向こうから、存在しない授業のチャイムが鳴った。',
    englishTitle: 'DEEP RECORD 14: The Missing Classroom',
    englishContent: 'One classroom number is missing from the hallway. A bell for a lesson that does not exist rang behind the door.',
  },
  {
    chapter: 15,
    title: '深層記録 15：回収担当',
    content: '倒した監査体は、自分を教師ではなく「回収担当」と呼んでいた。回収するものが答案だけではないことに気づく。',
    englishTitle: 'DEEP RECORD 15: Collection Officer',
    englishContent: 'The defeated auditor called itself a “collection officer,” not a teacher. It becomes clear that answer sheets are not all it collects.',
  },
  {
    chapter: 16,
    title: '深層記録 16：空の保管箱',
    content: '地下倉庫に並ぶ箱には、すべて「返却不可」と書かれていた。中身は空だが、箱の数だけ生徒の影が残っている。',
    englishTitle: 'DEEP RECORD 16: Empty Archive Boxes',
    englishContent: 'Every box in the basement archive is marked “No return.” The boxes are empty, but each one retains a student’s shadow.',
  },
  {
    chapter: 17,
    title: '深層記録 17：見えない署名',
    content: '黒いインクを熱すると、見えなかった署名が浮かび上がった。署名は一人分ではなく、複数の部署を束ねる形式だった。',
    englishTitle: 'DEEP RECORD 17: The Invisible Signature',
    englishContent: 'Heating the black ink revealed a hidden signature. It was not an individual signature, but a format binding several departments together.',
  },
  {
    chapter: 18,
    title: '深層記録 18：第二校区',
    content: '地図の端に、存在しないはずの「第二校区」が追加されていた。そこには学校ではなく、観測塔の記号が描かれている。',
    englishTitle: 'DEEP RECORD 18: District Two',
    englishContent: 'A nonexistent “District Two” was added to the edge of the map. Its symbol is not a school, but an observation tower.',
  },
  {
    chapter: 19,
    title: '深層記録 19：名前のない指示',
    content: '敵が消える直前、「次の章でも記録を続けろ」という指示だけを残した。誰が、誰に向けた命令なのかはわからない。',
    englishTitle: 'DEEP RECORD 19: The Nameless Directive',
    englishContent: 'Just before it vanished, the enemy left one instruction: “Continue the record in the next chapter.” Who gave the order, and to whom, is unknown.',
  },
  {
    chapter: 20,
    title: '深層記録 20：黒帳機関の影',
    content: '大ボスの記録には、初めて「黒帳機関」という呼び名が残されていた。組織はこの学校を、長い実験の一部として扱っている。',
    englishTitle: 'DEEP RECORD 20: The Shadow of the Black Ledger Bureau',
    englishContent: 'The major boss’s records contain the name “Black Ledger Bureau” for the first time. The organization treats this school as part of a long experiment.',
  },
  {
    chapter: 21,
    title: '深層記録 21：監視窓',
    content: '屋上の窓は外を映さず、別の校舎の様子を映していた。どの校舎にも、こちらを見返す黒い窓がある。',
    englishTitle: 'DEEP RECORD 21: The Watch Window',
    englishContent: 'The rooftop windows no longer show outside; they show another school building. Every building contains a black window looking back at us.',
  },
  {
    chapter: 22,
    title: '深層記録 22：選別表',
    content: '生徒の名前の横に、合否ではなく「保留」「移送」「廃棄」の欄がある選別表を見つけた。誰かが未来を事務処理している。',
    englishTitle: 'DEEP RECORD 22: The Selection Sheet',
    englishContent: 'A selection sheet lists “hold,” “transfer,” and “discard” beside students’ names instead of pass or fail. Someone is processing futures as paperwork.',
  },
  {
    chapter: 23,
    title: '深層記録 23：無音の放送',
    content: '校内放送が無音のまま流れ、画面にだけ「対象は順調」と表示された。放送室には、誰も触れていないマイクが立っている。',
    englishTitle: 'DEEP RECORD 23: The Silent Broadcast',
    englishContent: 'The school broadcast played in silence while its screen displayed “Subject progressing.” A microphone no one touched stood in the broadcast room.',
  },
  {
    chapter: 24,
    title: '深層記録 24：偽の卒業証書',
    content: '金庫の中から、まだ卒業していない生徒の卒業証書が出てきた。証書の発行者欄には、校長の印ではない黒い紋章がある。',
    englishTitle: 'DEEP RECORD 24: The False Diploma',
    englishContent: 'The safe contained diplomas for students who have not graduated. Their issuer bears a black crest, not the principal’s seal.',
  },
  {
    chapter: 25,
    title: '深層記録 25：半分の記録',
    content: '記録端末の画面には、ここまでの進行が半分しか保存されていなかった。残り半分は、さらに深い場所から送られてくるらしい。',
    englishTitle: 'DEEP RECORD 25: Half a Record',
    englishContent: 'The archive terminal had saved only half of the progress so far. The other half appears to be transmitted from somewhere deeper.',
  },
  {
    chapter: 26,
    title: '深層記録 26：黒い出席簿',
    content: '新しい出席簿には、生徒の代わりに「観測者」「補正者」「鍵」といった役割が記されている。誰がその役を割り当てたのか。',
    englishTitle: 'DEEP RECORD 26: The Black Attendance Book',
    englishContent: 'The new attendance book lists roles such as “observer,” “corrector,” and “key” instead of students. Who assigned those roles?',
  },
  {
    chapter: 27,
    title: '深層記録 27：送られた答案',
    content: '回収箱の底に、まだ解いていない問題の答案が届いていた。紙の端には「上層確認済み」という判が押されている。',
    englishTitle: 'DEEP RECORD 27: The Forwarded Answers',
    englishContent: 'Answers to problems no one has solved yet arrived at the bottom of the collection box. Their edges bear an “Upper level confirmed” stamp.',
  },
  {
    chapter: 28,
    title: '深層記録 28：空席の会議',
    content: '会議室の椅子が、誰もいないのに人数分だけ引かれていた。机の上には、学校ではなく「全校区」の議題が並んでいる。',
    englishTitle: 'DEEP RECORD 28: The Empty Meeting',
    englishContent: 'Every chair in the meeting room had been pulled out, though no one was there. The agenda concerned every school district, not just this school.',
  },
  {
    chapter: 29,
    title: '深層記録 29：承認待ち',
    content: '壊れた端末が、何度も「承認待ち」と点滅している。承認する相手の名前は最後まで表示されなかった。',
    englishTitle: 'DEEP RECORD 29: Awaiting Approval',
    englishContent: 'A broken terminal keeps blinking “Awaiting approval.” The name of the approving authority never appears.',
  },
  {
    chapter: 30,
    title: '深層記録 30：上層部の印',
    content: '大ボスの中枢から、黒帳機関の上層部だけが使う印章が現れた。ここで起きていることは、現場の暴走ではない。',
    englishTitle: 'DEEP RECORD 30: The Upper-Level Seal',
    englishContent: 'A seal used only by the Black Ledger Bureau’s upper ranks emerged from the major boss’s core. What is happening here is not a field operation gone wrong.',
  },
  {
    chapter: 31,
    title: '深層記録 31：深夜の出入口',
    content: '深夜、校舎の外壁にだけ存在する出入口が開いた。扉の向こうには、学校より大きな記録庫の気配がある。',
    englishTitle: 'DEEP RECORD 31: The Midnight Entrance',
    englishContent: 'At midnight, an entrance that exists only on the school’s outer wall opened. Beyond it lies the presence of an archive larger than the school.',
  },
  {
    chapter: 32,
    title: '深層記録 32：改ざん履歴',
    content: '校務記録の改ざん履歴をたどると、変更者の欄がすべて同じ黒い記号になっていた。記号は名前を隠すためのものではない。',
    englishTitle: 'DEEP RECORD 32: The Tampering History',
    englishContent: 'Every editor field in the school records had become the same black symbol. The symbol is not merely hiding a name; it is replacing one.',
  },
  {
    chapter: 33,
    title: '深層記録 33：保管期限',
    content: '答案の保管期限が、日付ではなく「次の観測完了まで」と指定されていた。学習は、誰かにとって永遠に終わらない。',
    englishTitle: 'DEEP RECORD 33: The Retention Period',
    englishContent: 'Answer sheets are retained not until a date, but “until the next observation is complete.” For someone, learning is never allowed to end.',
  },
  {
    chapter: 34,
    title: '深層記録 34：呼び戻す声',
    content: '閉じた教室から、失われた生徒の名前を呼び戻す声がした。声は助けを求めず、記録に戻るよう命じている。',
    englishTitle: 'DEEP RECORD 34: The Recall',
    englishContent: 'A voice from a sealed classroom called out the names of missing students. It did not ask for help; it ordered them back into the record.',
  },
  {
    chapter: 35,
    title: '深層記録 35：監査の目',
    content: '時計の針が止まった瞬間、すべての窓に黒い目のような印が浮かんだ。黒帳機関は、こちらの反抗も記録している。',
    englishTitle: 'DEEP RECORD 35: The Auditor’s Eye',
    englishContent: 'When the clock hands stopped, black eye-like marks appeared in every window. The Black Ledger Bureau is recording our resistance as well.',
  },
  {
    chapter: 36,
    title: '深層記録 36：未送信の命令',
    content: '未送信の命令書には、「鍵を深層へ進ませる」と書かれていた。鍵が誰を指すのか、もう偶然とは思えない。',
    englishTitle: 'DEEP RECORD 36: The Unsent Order',
    englishContent: 'An unsent order reads: “Advance the key into the deep layer.” It is no longer possible to believe that “the key” means no one in particular.',
  },
  {
    chapter: 37,
    title: '深層記録 37：黒い面談室',
    content: '職員室の裏に、黒帳機関専用の面談室が作られていた。壁には生徒ではなく、これまでの選択だけが並んでいる。',
    englishTitle: 'DEEP RECORD 37: The Black Interview Room',
    englishContent: 'A meeting room reserved for the Black Ledger Bureau was built behind the staff room. Its walls display choices made, not students.',
  },
  {
    chapter: 38,
    title: '深層記録 38：欠けた議事録',
    content: '議事録の最後のページだけが切り取られていた。残された一文は「次は本人に判定させる」だった。',
    englishTitle: 'DEEP RECORD 38: The Missing Minutes',
    englishContent: 'Only the final page of the meeting minutes was removed. The remaining line reads: “Next, let the subject judge for itself.”',
  },
  {
    chapter: 39,
    title: '深層記録 39：観測塔の座標',
    content: '地図に記された観測塔の座標が、校舎の中心と重なった。深層へ進むほど、学校そのものが装置に見えてくる。',
    englishTitle: 'DEEP RECORD 39: Coordinates of the Tower',
    englishContent: 'The observation tower’s coordinates overlap the center of the school. The deeper we go, the more the school itself looks like a machine.',
  },
  {
    chapter: 40,
    title: '深層記録 40：機関の目的',
    content: '大ボスの記録に、黒帳機関の目的が一行だけ残っていた。「学ぶ者を測り、測られる世界を作る」。',
    englishTitle: 'DEEP RECORD 40: The Bureau’s Purpose',
    englishContent: 'One line remains in the major boss’s record describing the Black Ledger Bureau’s purpose: “Measure the learner, then build a world that measures back.”',
  },
  {
    chapter: 41,
    title: '深層記録 41：最深部の鍵穴',
    content: '最深部へ続く扉に、鍵穴だけが取り付けられていた。鍵は物ではなく、ここまでの学びそのものだと示されている。',
    englishTitle: 'DEEP RECORD 41: The Deepest Keyhole',
    englishContent: 'A door leading to the deepest layer has only a keyhole. The records imply that the key is not an object, but everything learned along the way.',
  },
  {
    chapter: 42,
    title: '深層記録 42：反転した校章',
    content: '校章を裏返すと、黒帳機関の紋章と同じ線が現れた。学校は組織に乗っ取られたのではなく、最初から組み込まれていたのかもしれない。',
    englishTitle: 'DEEP RECORD 42: The Reversed Crest',
    englishContent: 'Turning the school crest over reveals the same lines as the Black Ledger Bureau’s emblem. The school may not have been taken over; it may have been built into the system from the start.',
  },
  {
    chapter: 43,
    title: '深層記録 43：名前を消す規則',
    content: '規則書の余白に、「名前は役割へ置き換える」と書かれていた。組織は人を人として記録しない。',
    englishTitle: 'DEEP RECORD 43: The Name-Erasing Rule',
    englishContent: 'A note in the margin of the rulebook says, “Replace names with roles.” The organization does not record people as people.',
  },
  {
    chapter: 44,
    title: '深層記録 44：戻れない廊下',
    content: '戻るはずの廊下が、進むたびに別の深層へつながった。黒帳機関は、退路さえ記録の一部に変えている。',
    englishTitle: 'DEEP RECORD 44: The One-Way Hallway',
    englishContent: 'The hallway that should lead back connects to a different deep layer each time we advance. The Black Ledger Bureau has turned even retreat into part of the record.',
  },
  {
    chapter: 45,
    title: '深層記録 45：判定者の席',
    content: '最上階の教室に、判定者のための席が一つだけ置かれていた。そこには、まだ誰の名前も書かれていない。',
    englishTitle: 'DEEP RECORD 45: The Judge’s Seat',
    englishContent: 'A classroom on the uppermost level holds a single seat for a judge. No name has been written on it yet.',
  },
  {
    chapter: 46,
    title: '深層記録 46：零号計画',
    content: '封印された計画書に、「零号を完成させる」と記されていた。零号が完成すれば、学校の全記録が一つの意思に統合される。',
    englishTitle: 'DEEP RECORD 46: Project Zero',
    englishContent: 'A sealed plan states: “Complete Zero.” Once Zero is complete, every school record will be merged into a single will.',
  },
  {
    chapter: 47,
    title: '深層記録 47：観測対象の反撃',
    content: '黒帳機関の報告書に、初めて「観測対象が自律行動を開始」と記された。こちらの進行は、すでに組織の想定を越えている。',
    englishTitle: 'DEEP RECORD 47: The Subject Fights Back',
    englishContent: 'For the first time, a Black Ledger report says, “The observation subject has begun acting independently.” Our progress has exceeded the Bureau’s plan.',
  },
  {
    chapter: 48,
    title: '深層記録 48：最後の監査',
    content: '残された監査票には、結果欄が空白のままだった。黒帳機関は、最後の判定を自分たちの手で下すつもりらしい。',
    englishTitle: 'DEEP RECORD 48: The Final Audit',
    englishContent: 'The result field on the last audit sheet remains blank. The Black Ledger Bureau intends to deliver the final judgment itself.',
  },
  {
    chapter: 49,
    title: '深層記録 49：零号の扉',
    content: '零号へ続く扉の前で、黒帳機関の全記録が一度だけ開いた。そこには、主人公たちを待つ「原典」の名が並んでいる。',
    englishTitle: 'DEEP RECORD 49: The Door to Zero',
    englishContent: 'Before the door to Zero, the Black Ledger Bureau’s entire archive opened once. It lists the names of the “originals” waiting for the protagonists.',
  },
  {
    chapter: 50,
    title: '深層記録 50：記録の外へ',
    content: '零号の記録を破り、黒帳機関が作った判定の世界に穴を開けた。深層の向こうには、まだ組織の本部と、次の記録が残っている。',
    englishTitle: 'DEEP RECORD 50: Beyond the Record',
    englishContent: 'The Zero record was torn apart, opening a breach in the judgment world built by the Black Ledger Bureau. Beyond the deep layer remain the Bureau’s headquarters and the next record.',
  },
];

export const getEndlessChapterResult = (chapter: number): EndlessChapterResult => {
  const normalizedChapter = Math.max(1, Math.floor(chapter));
  if (normalizedChapter > 50) return getTrueEndlessChapterResult(normalizedChapter);
  return ENDLESS_CHAPTER_RESULTS[normalizedChapter - 1] || ENDLESS_CHAPTER_RESULTS[0];
};

/** Deterministic chapter records for the unbounded true-endless continuation. */
export const getTrueEndlessChapterResult = (chapter: number): EndlessChapterResult => {
  const normalizedChapter = Math.max(51, Math.floor(chapter));
  const depth = normalizedChapter - 50;
  const motifs = [
    ['反転した校門', 'The Inverted Gate'],
    ['眠らない採点室', 'The Sleepless Grading Room'],
    ['星図の裏面', 'The Back of the Star Map'],
    ['名前のない観測者', 'The Nameless Observer'],
    ['深層の余白', 'The Margin of the Deep'],
  ];
  const [motif, englishMotif] = motifs[(depth - 1) % motifs.length];
  return {
    chapter: normalizedChapter,
    title: `真の深層記録 ${String(normalizedChapter).padStart(2, '0')}：${motif}`,
    content: `50章の記録を越えて${depth}章目。黒帳機関の観測網は形を変えながら続いている。次の扉にも、主人公たちが学び続けた証だけが残されていた。`,
    englishTitle: `TRUE ENDLESS RECORD ${normalizedChapter}: ${englishMotif}`,
    englishContent: `Chapter ${depth} beyond the 50-chapter record. The Black Ledger Bureau's observation network changes shape but continues. Beyond the next door, only proof that the protagonists kept learning remains.`,
  };
};
