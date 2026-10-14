// Reviewed contextual translations; enemy names are shared with personal equipment.
export const ENGLISH_CONTEXT_ENTITY_NAMES: Record<string,string> = {
  "墨核端末ピポ": "Pipo the Inkcore Terminal",
  "採点殻ヴァルナ": "Varna the Grading Shell",
  "門式端末オクト": "Octo the Gate Terminal",
  "三相演算体オルビス": "Orbis the Three-Phase Processor",
  "頁喰いミラ": "Mira the Page Eater",
  "三監プロトコル・ノア": "Noa the Triple-Audit Protocol",
  "刻喰いクロノル": "Chronor the Time Eater",
  "反復機リピタ": "Repita the Repeater",
  "空白面ブランクス": "Blanks the Blank Mask",
  "零号記録者ノクス・ルート": "Nox Root, the Zeroth Recorder",
  "再提出官レドゥン": "Redun the Resubmission Officer",
  "三相試験体トライクス": "Tryx the Three-Phase Test Entity",
  "通知残響ネイヴ": "Nave the Notification Echo",
  "規約執行体ヴェルデック": "Verdeck the Rule Enforcer",
  "化成炉主任カルブリス": "Calbris the Reactor Chief",
  "屋上演算体バルグリフ": "Balgrif the Rooftop Processor",
  "評定演算体モノメル": "Monomel the Grading Processor",
  "白紙皇后アウレリア": "Aurelia the Blank-Page Empress",
  "周波監査体オルト": "Ort the Waveform Auditor",
  "零号判定者ノクス・プライム": "Nox Prime, the Zeroth Judge",
  "時相端末テンポラ": "Tempora the Time-Phase Terminal",
  "封印監理体カテドラ": "Cathedra the Seal Overseer",
  "反照体ヴェイル": "Veil the Reflection Entity",
  "三属性監督体プリズマ": "Prisma the Three-Element Overseer",
  "星鍵収束体キーファ": "Kifa the Star-Key Converger",
  "欠月炉エクリプサ": "Eclipsa the Crescent Reactor",
  "深層頁獣アビスラ": "Abysra the Deep-Page Beast",
  "軌道観測体オルビタ": "Orbita the Orbital Observer",
  "変身残像体モルファ": "Morpha the Shifting Afterimage",
  "零号星核ノクス・オリジン": "Nox Origin, the Zeroth Star Core",
  "ドドメデス": "Dodomedesu",
  "ゲンゾー": "Genzo"
};
export const ENGLISH_CONTEXT_EXACT: Record<string,string> = {
 ...ENGLISH_CONTEXT_ENTITY_NAMES,
 "算数": "Math", "数学": "Math",
 "回収（長押し）": "Collect (hold)",
 "ミッション範囲（20ステージずつ）": "Mission range (groups of 20 stages)",
 "制限時間（秒）": "Time limit (seconds)",
 "能力値+1（基礎成長）": "Stats +1 (base growth)",
 "よみがな（機械音声用）": "Pronunciation (for text-to-speech)",
 "ラーメンの気合（次の3戦の開始エナジー+1）": "Ramen Boost (+1 starting Energy for the next 3 battles)",
 "同一戦闘で学習判定に成功するたびブロック2（最大3回）": "Gain 2 Block each time you pass a learning check in the same battle (up to 3 times).",
 "次の変身または固有能力のコストを1回、1エネルギー減らす（最低0）": "Your next transformation or unique ability costs 1 less Energy (minimum 0). Applies once.",
 "出典: Wikimedia Commons（Public domain）": "Source: Wikimedia Commons (public domain)",
 "上が北の地図（模式図）": "North-up map (schematic)",
 "放課後の学校（ダンジョン）": "After-School Campus (Dungeon)",
 "説得（撃破）": "Persuasion (defeat)",

 "敵全体に8ダメージ。": "Deal 8 damage to all enemies.",
 "作戦ノートの30階": "Strategy Notebook: 30 Floors",
};

export const formatEnglishBattleStartBonus = (strength:string, block:string, draw:string, heal:string):string =>
 `At battle start: ${strength} Strength, ${block} Block, draw ${draw} extra card${draw === '1' ? '' : 's'}, restore ${heal} HP.`;
export const translateReviewedEnglishDynamic = (source:string):string|null => {
 const stats=source.match(/^戦闘開始時、筋力(-?\d+)・ブロック(-?\d+)・追加ドロー(\d+)・HP回復(\d+)。$/);
 if(stats)return formatEnglishBattleStartBonus(stats[1],stats[2],stats[3],stats[4]);
 const arm=source.match(/^アームは空振りしたが、参加賞として(\d+)Gを得た。$/);
 if(arm)return `The claw missed, but you received ${arm[1]}G as a participation reward.`;
 const vote=source.match(/^みんなと推しが一致した！\s*(\d+)Gを得た。$/);
 if(vote)return `Everyone chose the same favorite! Gained ${vote[1]}G.`;
 const academy=source.match(/^強化できるカードがなかったため、魔法学園の協力費(\d+)Gを得た。$/);
 if(academy)return `No cards were available to upgrade, so you received ${academy[1]}G in support funds from the magic academy.`;
 const prediction=source.match(/^先読み成功！早押し報酬として(\d+)Gを得た。$/);
 if(prediction)return `Prediction succeeded! Gained ${prediction[1]}G for your quick answer.`;
 const inspiration=source.match(/^ひらめき成功！早押し報酬として(\d+)Gを得た。$/);
 if(inspiration)return `Aha! Gained ${inspiration[1]}G for your quick answer.`;
 return null;
};
