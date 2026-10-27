const COPY:Record<string,[string,string]>={
  "ナイスパス": ["NICE PASS","ないすぱす"],
  "チームの体力": ["Team health", "ちーむのたいりょく"],
  "残り時間": ["Time left", "のこりじかん"],
  "内野": ["Infield", "ないや"],
  "外野": ["Outfield", "がいや"],
  "自分のチーム": ["Your team", "じぶんのちーむ"],
  "相手チーム": ["Opponents", "あいてちーむ"],
  "ボール所持": ["Ball holder", "ぼーるしょじ"],
  "必殺シュートを選ぶ": ["Choose your super throw", "ひっさつしゅーとをえらぶ"],
  "直球ドライブ": ["Power drive", "ちょっきゅうどらいぶ"],
  "ウェーブ": ["Wave", "うぇーぶ"],
  "スカイアーク": ["Sky arc", "すかいあーく"],
  "まっすぐ速い強打": ["A fast, direct strike", "まっすぐはやいきょうだ"],
  "左右にうねる変化球": ["A swerving shot", "さゆうにうねるへんかきゅう"],
  "山なりに落ちる強打": ["A high, dropping strike", "やまなりにおちるきょうだ"],
  "ダッシュシュート": ["DASH SHOT", "だっしゅしゅーと"],
  "ジャンプシュート": ["AIR SHOT", "じゃんぷしゅーと"],
  "カウンター": ["COUNTER", "かうんたー"],
  "ジャストキャッチ": ["PERFECT CATCH", "じゃすときゃっち"],
  "ヒット": ["HIT", "ひっと"],
  "アウト": ["OUT", "あうと"],
  "スロー": ["THROW", "すろー"],
  "カウンター待機": ["Counter ready", "かうんたーたいき"],
  "今だ！ダッシュシュート": ["NOW! Dash shot", "いまだ！だっしゅしゅーと"],
  "タイミングよくキャッチ": ["Time your catch", "たいみんぐよくきゃっち"],
  "方向入力で球筋を調整": ["Steer the ball with direction input", "ほうこうにゅうりょくでたますじをちょうせい"],
  "ダッシュ・ジャンプで位置を取ろう": ["Dash and jump for position", "だっしゅ・じゃんぷでいちをとろう"],
  "ダッシュ": ["Dash", "だっしゅ"],
  "ジャンプ": ["Jump", "じゃんぷ"],
  "Dでダッシュ。光るタイミングでZを押すとダッシュシュート。": ["D: dash. Throw with Z when the ring glows for a dash shot.", "Dでだっしゅ。ひかるたいみんぐでZをおすとだっしゅしゅーと。"],
  "Vでジャンプ。空中から投げるとジャンプシュート。": ["V: jump. Throw in midair for an air shot.", "Vでじゃんぷ。くうちゅうからなげるとじゃんぷしゅーと。"],
  "Xでタイミングよくキャッチ。ジャストキャッチ直後はカウンター。": ["X: catch at contact. A perfect catch opens a counter window.", "Xでたいみんぐよくきゃっち。じゃすときゃっちちょくごはかうんたー。"],
  "Spaceでしゃがんで回避。Cで仲間へパス。Shiftで選んだ必殺球。": ["Space: duck. C: pass to a teammate. Shift: your selected super throw.", "Spaceでしゃがんでかいひ。Cでなかまへぱす。Shiftでえらんだひっさつきゅう。"],

  '打球時と直後の方向入力で球筋を調整':['Aim and curve with direction input at contact and just after.','だきゅうじと ちょくごの ほうこうにゅうりょくで たますじを ちょうせい'],
  '投球時と直後の方向入力で球筋を調整':['Aim and curve with direction input when throwing and just after.','とうきゅうじと ちょくごの ほうこうにゅうりょくで たますじを ちょうせい'],
  '必殺ゲージ':['Super gauge','ひっさつげーじ'],
  'テニスの素振り':['Tennis practice swing','てにすの すぶり'],
  'ドッジボールの投球練習':['Dodgeball throwing practice','どっじぼーるの とうきゅうれんしゅう'],
  'パッド／方向キーで移動。打球ボタンを長押しして離すと強打。打つ瞬間と直後の方向入力で球筋を調整できます。':['Move with the stick or direction keys. Hold and release a shot button for power. Aim at contact and curve with direction input just after.','ぱっど／ほうこうきーで いどう。だきゅうぼたんを ながおしして はなすと きょうだ。うつ しゅんかんと ちょくごの ほうこうにゅうりょくで たますじを ちょうせいできます。'],
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
