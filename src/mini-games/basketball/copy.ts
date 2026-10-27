const COPY:Record<string,[string,string]>={
  "バスケットボール": [
    "Basketball",
    "ばすけっとぼーる"
  ],
  "バスケットボールの入口へ": [
    "Back to basketball",
    "ばすけっとぼーるの いりぐちへ"
  ],
  "バスケットボールの問題選択": [
    "Basketball lesson selection",
    "ばすけっとぼーるの もんだいせんたく"
  ],
  "バスケットボールの学習タイム": [
    "Basketball learning break",
    "ばすけっとぼーるの がくしゅうたいむ"
  ],
  "パスでつなぎ、リングを狙おう。": [
    "Pass together and aim for the hoop.",
    "ぱすで つなぎ、りんぐを ねらおう。"
  ],
  "3対3・CPU対戦・オンライン大会": [
    "3-on-3 · CPU matches · Online tournament",
    "3たい3・CPUたいせん・おんらいんたいかい"
  ],
  "3対3のバスケットボール。不足はCPU、7人以上はトーナメント。": [
    "3-on-3 basketball. CPU fills empty places. Tournaments for 7 or more players.",
    "3たい3の ばすけっとぼーる。ふそくはCPU、7にんいじょうは とーなめんと。"
  ],
  "リングに近づいてシュート。遠くから決めると3点。": [
    "Get near the hoop to shoot. Long shots score 3 points.",
    "りんぐに ちかづいて しゅーと。とおくから きめると3てん。"
  ],
  "3分間の得点で勝負。同点なら次の得点で決着。24秒以内にシュートしよう。": [
    "Score the most in 3 minutes. Ties go to sudden death. Shoot within 24 seconds.",
    "3ぷんかんの とくてんで しょうぶ。どうてんなら つぎの とくてんで けっちゃく。24びょういないに しゅーとしよう。"
  ],
  "Zでシュート、Xでスティール、Cでパス、Spaceでダッシュ。": [
    "Z: shoot · X: steal · C: pass · Space: dash",
    "Zでしゅーと、Xですてぃーる、Cでぱす、Spaceでだっしゅ。"
  ],
  "試合前と1分ごとに3問。正解するとシュートの集中力が回復。": [
    "Three questions before play and each minute. Correct answers restore shot focus.",
    "しあいまえと1ぷんごとに3もん。せいかいすると しゅーとの しゅうちゅうりょくが かいふく。"
  ],
  "集中力": [
    "Focus",
    "しゅうちゅうりょく"
  ],
  "シュート": [
    "Shoot",
    "しゅーと"
  ],
  "スティール": [
    "Steal",
    "すてぃーる"
  ],
  "仲間にパスしてチャンスを作ろう。": [
    "Pass to teammates to create a chance.",
    "なかまに ぱすして ちゃんすを つくろう。"
  ]
};
export const BASKETBALL_ENGLISH=Object.fromEntries(Object.entries(COPY).map(([k,v])=>[k,v[0]]));
export const BASKETBALL_HIRAGANA=Object.fromEntries(Object.entries(COPY).map(([k,v])=>[k,v[1]]));
