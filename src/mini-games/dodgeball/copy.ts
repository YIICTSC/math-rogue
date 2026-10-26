const COPY:Record<string,[string,string]>={
  "ドッジボール": [
    "Dodgeball",
    "どっじぼーる"
  ],
  "ドッジボールの入口へ": [
    "Back to dodgeball",
    "どっじぼーるの いりぐちへ"
  ],
  "ドッジボールの学習タイム": [
    "Dodgeball study break",
    "どっじぼーるの がくしゅうたいむ"
  ],
  "ドッジボールの問題選択": [
    "Dodgeball lesson selection",
    "どっじぼーるの もんだいせんたく"
  ],
  "投げて、つかんで、仲間とつなぐ。": [
    "Throw, catch, and connect as a team.",
    "なげて、つかんで、なかまとつなぐ。"
  ],
  "ランダムな3人チーム・オンライン大会": [
    "Random teams of three · online tournaments",
    "らんだむな3にんちーむ・おんらいんたいかい"
  ],
  "ランダムな3人チーム。不足はCPU、7人以上はトーナメント。": [
    "Random teams of three. CPU fills empty spots; seven or more players form a tournament.",
    "らんだむな3にんちーむ。ふそくはCPU、7にんいじょうはとーなめんと。"
  ],
  "外野から仲間を支援できます。": [
    "Support your team from the outfield.",
    "がいやから なかまを しえんできます。"
  ],
  "投げる方向": [
    "Throw direction",
    "なげるほうこう"
  ],
  "投げる": [
    "Throw",
    "なげる"
  ],
  "キャッチ": [
    "Catch",
    "きゃっち"
  ],
  "回避": [
    "Dodge",
    "かいひ"
  ],
  "パス": [
    "Pass",
    "ぱす"
  ],
  "必殺球": [
    "Super throw",
    "ひっさつきゅう"
  ],
  "相手の内野3人の体力をなくすと勝利。3分後は内野の人数と体力で判定。同点なら次の命中で決着。": [
    "Eliminate the three opposing infielders to win. After three minutes, infielders and health decide the winner; a tie goes to the next hit.",
    "あいてのないや3にんのたいりょくをなくすとしょうり。3ぷんごはないやのにんずうとたいりょくではんてい。どうてんならつぎのめいちゅうでけっちゃく。"
  ],
  "Zで投げる、Xでタイミングよくキャッチ、Spaceで回避、Cでパス。ゲージ満タンでShiftの必殺球。": [
    "Z: throw. X: timed catch. Space: dodge. C: pass. Shift: super throw with a full gauge.",
    "Zでなげる、Xでたいみんぐよくきゃっち、Spaceでかいひ、Cでぱす。げーじまんたんでShiftのひっさつきゅう。"
  ],
  "倒れた選手は外野へ。3問の学習で必殺ゲージを回復します。": [
    "Eliminated players move to the outfield. Answer three questions to recharge your super gauge.",
    "たおれたせんしゅはがいやへ。3もんのがくしゅうでひっさつげーじをかいふくします。"
  ]
};
export const DODGEBALL_ENGLISH=Object.fromEntries(Object.entries(COPY).map(([k,v])=>[k,v[0]]));
export const DODGEBALL_HIRAGANA=Object.fromEntries(Object.entries(COPY).map(([k,v])=>[k,v[1]]));
