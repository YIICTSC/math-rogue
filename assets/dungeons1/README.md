# ダンジョンズ1 主人公アクション

全35人・変身後17形態に専用の透明WebPアトラスを使用します。
各シートは96pxセルの8列×8行で、方向は南・北・東・西・南東・南西・北東・北西、
行は左足歩行・右足歩行・攻撃・投擲・杖振り・読書・道具使用・射撃です。

`hero-actions.json` は既存のわんぱく小学生、`hero-actions-build.json` は
全52シートのImageGen生成履歴・参照画像・ハッシュ・共通スケールを記録します。
各キャラクターの既存8方向画像を参照し、変身前後を別々に生成しています。
今回の追加分の生成元PNGはワークスペースの `generated_images` に保持し、Gitには追加しません。

追加分の正規化は、`key`・`id`・`transformed`・`source`（生成元PNGのパス）を
持つ51項目のJSONを `node scripts/dungeons1/build-hero-actions.mjs <JSON>` に渡します。
セルごとの拡大率変更はせず、シート全体で共通スケールを使って足元を揃えます。

アトラス読み込み中・失敗時は既存の簡易ポーズを使用し、読み込み後は描き下ろしを使います。
描画のために追加のゲームターンを進めません。待機時は既存の静止画へ戻ります。

配信用一覧の更新と確認:

```sh
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs --update-prefix sprites/dungeons1/actions/
node scripts/test-dungeons1-actions.mjs
node scripts/test-dungeons1-actions-browser.mjs
```

Android一覧の部分更新は指定ディレクトリ内を完全に取得してから行います。
指定範囲以外の一覧項目は保持されます。通常の全体生成は引数なしで実行できます。
