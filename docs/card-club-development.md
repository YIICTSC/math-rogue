# 放課後トランプゲーム集

## 現時点の範囲

2026-10-23にGamefarm目次の「トランプ」分類467エントリーを確認。ゲーム名・人数・分類・参照URLなどの事実情報のみを一覧化し、記事本文やサイト画像はコピーしていない。

現時点の個別実装は15ルール。全467件の依頼は未完了で、残り452件は個別ルール・CPU方策・操作UIの実装が必要。全件の差分は [card-club-coverage.md](card-club-coverage.md) で管理する。

実装済み: 大貧民・大富豪（1ディール）、ホイスト（アナー・ラバー戦）、スペード（4人チーム）、オーヘル、オールドメイド（2〜5人）、ファンタン、クレイジーエイト（2〜5人）、ゴーフィッシュ（全ブック方式・一致ドローで続行）、オーサー、ダウト、戦争（300勝負上限）、99加算（2〜4人）、スコパ（2〜4人）、スコポーネ、ブラックジャック（家庭卓、スプリット・保険なし）。参照記事内の全変種・全人数を実装したという意味ではない。

## 操作と接続

- ミニゲーム一覧から「放課後トランプゲーム集」。解放条件は放課後ポーカーと同じ1,500問。
- 専用タイトル → キャラクターと参加名 → ゲーム選択 → CPU卓またはオンライン卓。
- 放課後ポーカーの26人の顔画像を再利用。本人の顔は参加者それぞれが選ぶ。
- 待機中の空席はCPU。ホストがゲームと人数を選び、対戦開始時に人数を確定。
- 6桁コードはNFKCで全角数字を正規化。招待URLは `?cardClubRoom=コード`。
- PeerJSの既存シグナリング設定・ICE設定を利用するP2P。新しいサーバーのデプロイは不要。
- 権限を持つホストが入力を検証し、参加者ごとに自分の手札・公開情報・自分の合法手だけを送る。山札、裏向きのダウト札、シャッフルseedは配信しない。ホスト自身はP2Pの管理者として全状態を持つ。
- リビジョンが古い入力、手番外の入力、存在しない札や合法でない操作を拒否。
- 参加者切断時はCPUに置換。ホスト終了時は参加者へ終了時点の結果を送る。突然のホスト通信断は中断表示。
- BGMは `poker_shop`（タイトル・選択・待機）と `poker_play`（対戦）。

## 画像

built-in ImageGenで新規生成。生成元PNGは保持し、ゲーム用のWebPを次の場所へ保存。

- `public/sprites/card-club/title.webp`
- `public/sprites/card-club/table.webp`

生成元:

- `/Users/admin/.codex/generated_images/019ffe33-7620-79d1-b505-3e5742c4e554/exec-0a3460df-eacd-4e1f-9092-b53838a01f4f.png`
- `/Users/admin/.codex/generated_images/019ffe33-7620-79d1-b505-3e5742c4e554/exec-f512d4a6-16e5-4a5a-88c9-bf0e931dcf7f.png`

### タイトル背景のプロンプト

Use case: stylized-concept. Asset type: dedicated title background for Learning Rogue playing-card anthology. Original sumptuous school card-club room at dusk, warm sunset through tall classroom windows, polished wooden card table, bookshelves and brass lamps, floating heart spade club diamond motifs and elegant blue and gold playing-card backs around edges, magical celebratory sense of a world of card games opening up. Anime game illustration with painterly detail and crisp readable forms. Wide cinematic landscape 16:9. Large calm dark navy negative space upper-left for title text and bottom for buttons; a lavish emerald felt table toward right. No people, no letters, no UI, no watermark, no readable card faces. All ages friendly, no casino money imagery.

### 対戦テーブルのプロンプト

Use case: stylized-concept. Asset type: top-down card-game table background for a school playing-card anthology. Perfectly overhead view, spacious deep emerald velvet felt rectangular play area covering central 85 percent, subtle worn fabric grain, refined brass and dark walnut border, warm school-library lamps and a few stacked books only at very outer corners. Tiny gold spade heart club diamond inlays along border, luxurious inviting after-school club atmosphere. Illustrated anime game background with painterly edge details. Wide landscape 16:9. Centre absolutely empty for gameplay cards. No people, no cards, no chips, no text, no numbers, no UI, no watermark. Clear dark uniform central field for white cards.

## 確認用

- `node scripts/test-card-club.mjs`: 各ゲームの最少・最多人数、3seedを通したCPU完走、カード保存則、合法手、手札秘匿、不正入力、切断CPU化、終了結果の配信。
- `node scripts/report-card-club-coverage.mjs`: 全件の対応表を再生成。
- 実ブラウザ2タブで、全角コード参加・人間2人とCPU2人の混在・ホイストの手の同期・ホスト終了時の参加者リザルトを確認。
- 検証スクリーンショット: `build/card-club-qa/`。
- 最終エンジン検証は81試合・17,749手。シャッフルseedと初期アナーの秘匿、スコパの同位札優先、ジョーカー入り革命の回帰確認を含む。
- プロジェクトの型検査、英語UIゲート、本番Webビルドは成功。アセット一覧も更新済み。
- 390×844と844×390の表示を確認。横画面は参加者・場札と手札の二列配置。ブラウザのエラーログは0件。

## 残作業

1. 対応表の未対応452件を、原典ごとに読む。名前だけを追加して対応済みにしない。
2. ルールごとに配札・合法手・反則処理・勝敗・ラウンド間の処理・CPUの判断・専用UIを実装。
3. 複数デッキ・タロット系の特殊ランク（トランプ分類で用いる独自強弱も含む）・宣言やパートナー選択・同時操作など、ゲームごとのプロトコルを拡張。
4. 各ゲームの指定全人数・本文中の変種をどこまで取り込むかも追跡する。
5. 本物の遠隔端末を組み合わせた接続検証、スマートフォンの縦横・多言語の仕上げを継続する。
