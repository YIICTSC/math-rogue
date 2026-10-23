# 放課後トランプゲーム集

## 現時点の範囲

2026-10-23にGamefarm目次の「トランプ」分類467エントリーを確認。ゲーム名・人数・分類・参照URLなどの事実情報のみを一覧化し、記事本文やサイト画像はコピーしていない。

現時点の個別実装は32ルール。全467件の依頼は未完了で、残り435件は個別ルール・CPU方策・操作UIの実装が必要。全件の差分は [card-club-coverage.md](card-club-coverage.md) で管理する。最初の15種は2026-10-23に `b4d5e174` でmainへ反映した。

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

## 2026-10-23 追加分とジャンル検索

追加17種: ブリスコラ、スエカ、ポリニャック、ラウス、カルターシュラーク、グルカ、スパー、ミゼリア、チアパーノ、ハート（米国ルール）、メモリー、ベガー・マイ・ネイボー、ピシュティ、ラミー、ピティパット、スニップ・スナップ・スノーラム、キングズ・イン・ザ・コーナーズ。

- 17ジャンル選択と、名前・英語名・ジャンル名・小分類の複合検索。NFKCで全角入力を正規化、かな表記も正規化。「神経衰弱」「ババ抜き」「七並べ」などの別名を追加。
- ジャンルごとに遊べる件数を表示。未対応ゲームを含む参照件数と、遊べる件数を分ける。対応人数は飛び番を範囲と誤記せず列挙する。
- 交換札の保留、切札の選択、同一状態の反復検出、公開メルドと付け札、キングの列移動などをルール拡張として分離。
- 神経衰弱は公開済みの札だけをCPUが記憶。未公開の盤面、交換中の選択札、反復検出用の秘密状態は送信しない。
- 対応方式が変わるためP2Pプロトコルをv2へ更新。古いv1の部屋と混ざらない。

### 採用した卓ルールの範囲

各記事内の全変種を実装したという意味ではない。アプリの遊び方にも採用ルールと人数を明記する。

- スパー・スニップは1ディール。ポリニャックは10罰点・任意カポットなし。グルカは再参加なし。ラウスは4人。
- チアパーノは記事の「誰かが31罰点で最少罰点が勝者」変則。ハートは4人、シュート・ザ・ムーンで本人の罰点−26、初回トリックへの罰点札制限なし。
- ピシュティは記事本文の101点・場札残りは誰も獲得しない方式。記事後半のPagat変則（151点・Jの例外など）とは分ける。
- ラミーは各人2回ずつ親。公開済みメルドには誰でも付け札可能。進行不能対策として同一状態の反復または500手番で配札を得点なしの引き分けとする追加卓ルールを明示。
- ベガーは52枚、反復は引き分け・5,000手上限。ピティパットは山札切れでヒープ上1枚以外を再シャッフル。キングズは2〜4人・25罰点。

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

- `pnpm run test:card-club`: 各ゲームの全対応人数、3seedを通したCPU完走、カード保存則、合法手、手札秘匿、不正入力、切断CPU化、終了結果の配信。ジャンル検索と新17種のルール固有の回帰テストを併せて実行。
- `node scripts/report-card-club-coverage.mjs`: 全件の対応表を再生成。
- 実ブラウザ2タブで、全角コード参加・人間2人とCPU2人の混在・ホイストの手の同期・ホスト終了時の参加者リザルトを確認。
- 検証スクリーンショット: `build/card-club-qa/`。
- 最終エンジン検証は333試合・77,657手。シャッフルseedと初期アナーの秘匿、スコパの同位札優先、ジョーカー入り革命の回帰確認を含む。
- プロジェクトの型検査、英語UIゲート、本番Webビルドは成功。アセット一覧も更新済み。
- 390×844と844×390の表示を確認。横画面は参加者・場札と手札の二列配置。ブラウザのエラーログは0件。
- 追加分では実ブラウザ2画面で、全角コードの参加、英語の参加者、神経衰弱の札公開・裏返し・手番移動・ホスト終了結果を確認。390×844と844×390で横はみ出しなし。
- 神経衰弱の不一致確認ボタンを盤面上へ移動し、終了時には大きな盤面を隠してリザルトを表示。読み上げ用ラベルも内部カードIDではなく実際の札名にした。
- 接続仲介の一時エラーが出てもWebRTC対戦接続が開いている場合は「対戦の通信失敗」と誤表示しない。実データ接続のエラー・開始前のエラーは従来どおり表示する。純粋関数で切り分けを回帰検証。
- 切断参加者を次のロビーに人間の空席として残さず、ゲーム中の座席だけCPUへ引き継ぐ。
- 最新の検索画面: `build/card-club-qa/genre-search-final.png`。縦画面の別名検索: `genre-search-portrait.png`、新しい神経衰弱UI: `memory-portrait-v2.png`。

## 残作業

1. 対応表の未対応435件を、原典ごとに読む。名前だけを追加して対応済みにしない。
2. ルールごとに配札・合法手・反則処理・勝敗・ラウンド間の処理・CPUの判断・専用UIを実装。
3. 複数デッキ・タロット系の特殊ランク（トランプ分類で用いる独自強弱も含む）・宣言やパートナー選択・同時操作など、ゲームごとのプロトコルを拡張。
4. 各ゲームの指定全人数・本文中の変種をどこまで取り込むかも追跡する。
5. 本物の遠隔端末を組み合わせた接続検証、スマートフォンの縦横・多言語の仕上げを継続する。
