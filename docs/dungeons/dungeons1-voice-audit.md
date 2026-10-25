# ダンジョンズ1・2 主人公音声の監査・最適化

2026-10-25、最新main `b7bea534` を取り込んで確認。
クラウドでの作業は、この会話で承認されたチェックアウトを使用した。

## 確認結果

- `SchoolDungeonRPG.tsx` の通常移動に `studentCue('walk')` が追加されていた。
  町・道場でも `useStudentAudio` が座標変更を検出する。
  既存コントローラーは歩行ごとに8%の確率、発話開始から最低3.2秒の間隔で
  `sfx/dungeons-chronicles/<hero>/walk.ogg` を再生していた。
- 反逆の高校生の歩行台詞は生成設計上「次の道へ。」。
  高校編9人・マジック編17人、計26人の追加音声は21種類ずつ、計546本。
  設計・生成記録・実ファイルを全件SHA-256で照合し、一致を確認した。
- 生成処理は `SamplingRequest(..., no_ref=True, ...)`。
  話者を固定する参照音声は渡されておらず、人物ごとの説明文とseedで生成されている。
  Irodoriのモデル名が同じでも、本編戦闘時と同じ話者として生成・検証された音声ではない。
  旧処理は探索用の追加音声を優先し、戦闘でも確率で本編音声と混在させていた。

元の追加音声のモデルは `Aratako/Irodori-TTS-v4.1-Small`、revision
`2b28324dc263ed5e6638b3cf3dd94c82ead07b4b`。
生成コードの記録は `89f9d8fbd4d51ea019867ee1197725ede1df13c5`、
推論・codecともCPU。今回は新規生成せず、本編が実際に再生するOGGをそのまま再利用する。

## 適用した方針

`dungeons1` プロファイルをゲーム1だけに適用する。
高校編は `sfx/high-school-voices/<ID>/`、マジック編は `sfx/magic-voices/<ID>/` を使う。
本編と同じ再生API・実ファイルを通るため、似せた別音声ではなく同じ音声になる。
本編ファイル423本のパスとSHA-256は [機械検証用記録](./dungeons1-voice-audit.json) に記録。

| 操作 | 高校編 | マジック編 |
| --- | --- | --- |
| 通常歩行・方向転換 | 発話なし。音声側からの選択クリック音もなし | 同左 |
| 通常攻撃・投擲・射撃 | 本編 `attack-*` | 本編 `attack-*` |
| 撃破・勝利 | 本編 `finish-*` | 本編 `spell-*` |
| 技・杖・変身 | 本編 `power-*` | 本編 `spell-*` |
| 被弾・罠 | 本編 `damage-*` | 本編 `damage-*` |
| 敗北 | 本編 `defeat-*` | 本編 `damage-*` |
| 回復・道具・巻物 | 本編 `item-*` | 効果音のみ。回復時に攻撃魔法名を言わせない |
| 拾得・装備・階段・会話 | 対応する効果音のみ | 同左 |

参照音声なしで生成された26人分の年代記の結末音声は再生しない。
台詞・選択肢・結末の記録は維持し、NPCの会話は引き続き再生する。
本編に同じ台詞の音声がない箇所へ、無関係な戦闘台詞を代わりに流さない。
小学生編の年代記は既存の音声方針を維持する。ダンジョンズ2専用9人も、参照なしの結末音声は再生しない。

装備変更はオブジェクト参照ではなく保存可能な装備内容で比較する。
同じ装備がコピーされただけで「装備した」と誤認する音も防ぐ。
発話間隔・音量設定・再生中の重複防止・画面を離れた際の停止は維持する。

## 再検証

```sh
node scripts/audit-dungeons1-voice-identity.mjs
node scripts/test-dungeons1-audio-policy.mjs
node scripts/test-dungeons1-audio-browser.mjs
node scripts/test-student-audio.mjs
node scripts/test-dungeons-chronicle-audio.mjs
```

監査の更新は、参照・台詞・実ファイルを確認してから
`node scripts/audit-dungeons1-voice-identity.mjs --write` を実行する。
声量・長さだけの検査を、話者の同一性の検査として扱わない。

## ダンジョンズ2

追加された9人×21本＝189本も同じ no_ref=True の生成経路だった。
従来の専用音声270本（9人×10種類×3差分）は、各人の参照音声を生成してから
同じ話者参照を指定する `scripts/dungeons2/generate-voices.py` の経路。
こちらの既存OGGを再利用し、追加の年代記音声とのランダム混在をなくした。
歩行は両作とも発話・選択効果音なし。巻物・道具・汎用杖では無関係な必殺技名を言わせない。
必殺技は実際の能力名と一致する ultimate-1〜3 または card だけを選択し、未知の名前は無音にする。
攻撃・被弾・回復・撃破・変身・敗北は対応する従来音声を使用する。
元モデルは Aratako/Irodori-TTS-v4.1-Small-MF、revision
ccc78f5d480b6e51b69b2d5042a14c4da04fea6e。新しい音声生成は実施していない。

ダンジョンズ2の実ファイル照合記録は [専用音声の監査記録](./dungeons2-voice-audit.json)。
追加検証:

```sh
node scripts/audit-dungeons2-voice-identity.mjs
node scripts/test-dungeons2-voices.mjs
node scripts/test-dungeons2-actions-browser.mjs
```

後者は実ゲームの町・迷宮で歩行時の音声呼び出しがないことも検証する。
