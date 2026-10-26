# ダンジョンズ・星潮の航路の対面会話

NPCとの会話を、画面全体を使う `ConversationStage` に統一。左に選択中の主人公、右に会話相手を置き、互いに内側へ向ける。話者の枠と名前帯を明るくし、台詞に合わせて表情・手のポーズを切り替える。年代記の3種類の結末にもそれぞれの感情を設定する。

対象はダンジョンズ1・2の年代記、個人物語、仲間加入、案内人・先生との会話、および星潮の導入、島の物語、NPCとの会話、滑空覚醒、エンディング。会話文・分岐・報酬・途中再開・既存ボイスのIDは各ゲームの処理を継続して使用する。探索や学習出題の条件を変更するものではない。

## イラスト

- 主人公44人、年代記NPC22人、星潮の登場人物10人、先生・校長2人。78人×平常・喜び・心配・決意の4差分＝312枚。
- 全差分をImageGenで生成。既存の人物イラストを参照し、年齢、顔、髪、服、小物を維持する。生成元PNGは `assets-source/dialogue/`、キャストと参照画像・生成記録は `assets/dialogue/` に保存。
- `normalize-dialogue-art.mjs` は透明画素を使って人物を分離し、人物ごとに4表情共通の倍率と頭部の横位置を揃える。絵の描き直しはせず、パッキングと拡縮だけを行う。
- 配信用WebPは4列×2行、1コマ384×576。内容ハッシュ付きURLと生成レジストリを使用し、同時に表示する人物のシートだけを読み込む。表情の変更はSVG内のコマ位置で行い、縦横比を保つ。大きな背負い物がある人物はキャストの `focusX` で会話時の構図を補正できる。

## 操作と画面

縦画面は2人の上半身と下部の台詞、横長の小画面は台詞と操作を左右に配置。長文と選択肢はそれぞれスクロール可能。セーフエリア、44pxの基本タップ領域、Tabの循環、Escapeで戻る、閉じた後のフォーカス復帰、動きを減らす設定に対応する。探索中の操作は会話中に進行させない。

## 更新・検証

```sh
pnpm run generate:dialogue-art
pnpm run test:dialogue-art
pnpm run preview:dialogue-art
pnpm run test:dialogue:browser
node scripts/test-dungeons-chronicles.mjs
node scripts/test-dungeons-optional-npcs-browser.mjs
node scripts/test-star-tide-story-browser.mjs
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
```

アセット検証は全キャストの網羅、生成元と配信ファイルのハッシュ、透明度、差分の重複、倍率・アンカー、日英48会話の話者を確認する。ブラウザ検証は320/390px縦、844px横、デスクトップ、長文・選択肢、音声再生・停止、途中再開、NPC会話中の移動停止を対象とする。コンタクトシートと画面写真は `tmp/dialogue/` などに出力する。

## Star Tide narration

Star Tide selects the presentation per voice-catalog speaker. Narration with dedicated art shows that illustration clearly, uncropped, in place of the character portraits. Spoken character lines keep the two-person conversation stage. This applies to the opening, island story/choice pages, windsail introduction, endings, and narrative observations in NPC encounters. Voice playback, replay, story progress and choice handlers use the same controls in either presentation. Other games keep their existing dialogue layout.

`pnpm run test:star-tide:narration` checks mixed narrator/dialogue sequences, all 12 island paintings and choices, 48 NPC encounters, English, voice replay, close callbacks, and four phone/desktop sizes.
