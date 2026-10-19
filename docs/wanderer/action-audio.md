# 風来の学生：アクション音声

音源は全て既存ファイルを参照し、新規音声ファイル・コピー・一括プリロードは追加しない。
Springin’ Sound Stock: https://www.springin.org/sound-stock/
既存の出典・利用条件記録: `public/sfx/attack-effects/SOURCES.md`、`public/sfx/status-effects/SOURCES.md`、`public/sfx/SOURCES.md`。

| アクション | 既存の効果音 | 主人公ボイス |
| --- | --- | --- |
| 通常攻撃 | slash／撃破時finisher | 22%、トドメ時は確率判定なし |
| 射撃・投擲 | projectile | 22%、トドメ時は確率判定なし |
| カード技 | lightning（各カード固有の既存SEも維持） | 35% |
| 被ダメージ | impact | 18% |
| 回復 | heal | 20% |
| 消耗品使用 | buff | 20% |
| 道具取得 | flash | なし |
| 装備変更 | block | なし |
| 階移動 | jump | なし |
| 罠発動 | debuff | なし |
| マジック変身 | drain | 確率判定なし |
| クリア・敗北 | graduation／weak | 確率判定なし |

高校編9人は既存の専用ボイスバンクのattack／damage／item／power／finish／defeatを参照。
マジック編17人は既存のattack／damage／spellを使用し、トドメ・変身・技にはspellを割り当てる。専用finish／defeatファイルは存在しないため生成・誤参照しない。
小学生編は効果音のみ。音量・ミュートは既存のSE／ボイス設定を尊重する。

発話開始の最短間隔は3.2秒。音声の読み込み中は追加発話を予約せず、連続攻撃・複数体同時撃破でも重ねない。
トドメもこの制限を守る。通常行動による発話の直後は無理に割り込ませない。
タイトル・算数問題・非表示タブでは新規アクション音を再生しない。ロード・主人公変更・初期配置によるHPや道具数の差分は発話しない。
