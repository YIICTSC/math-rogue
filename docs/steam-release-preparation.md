# Steam版リリース準備

更新日: 2026-07-29

## 現在地

- Steam AppID: `5013100`
- Windows Content Depot ID: `5013101`
- ストアパッケージID: `1738674`
- Beta TestingパッケージID: `1738673`
- Developer CompパッケージID: `1738672`
- 希望販売価格: 日本500円（他地域価格はSteamの推奨換算を基準に設定）
- Steam専用Webビルドは `VITE_APP_PLATFORM=steam`、`VITE_PAID_EDITION=true` で生成する。
- Steam版では有料版の時間制限撤廃を適用し、ランキング・課題・協力・レース等の通信機能は維持する。
- Windows x64版の対象OSはWindows 10以降とする。Electron 23以降はWindows 7／8／8.1をサポートしない。
- Xbox標準配列のGamepad APIシミュレーションは14項目すべて合格済み。物理コントローラー確認はSteamテストブランチで行う。
- 初回はWindows x64版を対象とし、macOS／Linux版は別Depotとして後日判断する。
- Windows x64版の生成・Steam向け設定検証は完了済み。展開後容量は約1.2 GB。
- 日本価格500円とSteam推奨換算による全41地域価格を審査へ提出済み。審査後は自動反映せず、手動で公開する。
- Windows 64-bit対応、`LearningRogue.exe` の起動設定、英語・日本語のDepot言語設定はSteamworksへ公開済み。
- コンテンツアンケートを公開済み。軽度のファンタジー戦闘、武器表示、オンライン機能、プリレンダリング素材への生成AI利用を申告した。
- ストアタグ20件を公開済み。上位は「カードバトル」「ターン制戦略」「ローグライト」「教育」「PvE」。
- サポート窓口としてGitHub Issuesを登録済み。
- 開発元・パブリッシャー名を `YIICTSC` に設定し、Steamコミュニティグループ／Creator Homeへリンク済み。
- Steamコミュニティグループ: `https://steamcommunity.com/groups/yiictsc`（Group ID: `46228409`）
- 2026-07-25時点の最新ソースからWindows x64版を再生成し、Steamビルド検証に合格済み。
- macOS版SteamCMDを導入・更新し、SteamPipeアップロード設定を生成済み。
- Windows x64版をSteamPipeへアップロード済み。最新の成功Build IDは `24385958`、Depot Manifest IDは `2863320183767979359`。
- Build `24385958` をSteamworks画面からPublic defaultブランチへ反映済み。
- 2026-07-26のテスト版をSteamPipeへアップロード済み。Build IDは `24395548`、
  Depot Manifest IDは `8597407780415568028`。Public defaultには未反映で、
  非公開の`internal`ブランチへ反映済み。
- Steam専用の高校編タイトル選択は、コントローラーフォーカス時に背景・文字色を
  反転して視認性を高めた。全版共通で、バージョン情報の題名10回押下による
  テスト用デバッグ導線を一時的に有効化している。
- 非公開ブランチ`internal`を説明「Internal test build」で作成済み。
  2026-07-27にBuild `24395548`をライブ設定し、Steamworksの履歴とブランチ表示で確認済み。
- 2026-07-27の共通UI・課題安定化・報酬コントローラー修正版からWindows x64版を再生成し、
  ローカル検証に合格した。実行ファイルは約222.3 MiB、アプリ資産は約883.7 MiB。
  SteamPipeの`internal`向け設定も生成済み。SteamCMDの保存済み認証がなく、
  再ログインに失敗したため、このビルドのアップロードは認証情報の更新待ち。
- 2026-07-29の最新仕様からWindows x64版を再生成し、Steam向けビルド検証に合格した。
  実行ファイルは233,106,944 bytes、アプリ資産は926,657,433 bytes。
  `Preview=0`、`SetLive=internal` のSteamPipe設定でアップロードした。
- 校長対決は、Shogun Showdownのように「選択・キュー・実行・位置調整」を
  戦闘中に素早く行える専用配置へ変更した。`A`: カードをキューへ追加、
  `B`: 最後のキューを取消、`X`: 実行、`Y`: ターン進行、`LT/RT`: 左右移動、
  `LB`: 待機、`RB`: 位置入替。ほかの画面の標準操作は変更していない。
- 専用配置を含むGamepad APIシミュレーションは14項目すべて合格した。
- 最新ビルドを2026-07-29にSteamPipeへアップロードした。Build IDは
  `24442792`、Depot Manifest IDは `6474451404999003800`。
  `internal`ブランチへ自動反映する設定で成功しており、今回の専用配置を
  Steamクライアントからテストできる。
- Developer Compパッケージが用意されているため、開発者アカウントではWindows版Steamクライアントからインストールしてテストできる。Windows実機での起動確認は未実施。
- 2026-07-29の追加コントローラー修正版では、ランキング同意、報酬Skip、ミニゲーム問題、
  帰宅ダッシュA長押し、サバイバー連続軸、ポーカー複数選択、風来シリーズX斜め固定、
  校長対決の手札／キュー／上部UI、紙飛行機のセットアップ／換装／格納庫を修正した。
  Gamepad APIの対象回帰テストとWindows x64配布物のローカル検証に合格済み。
- 上記修正版をSteamPipeへアップロードし、Build ID `24444544`、Depot Manifest ID
  `547586031312152787`を作成した。`SetLive=internal`で非公開`internal`ブランチへ反映済み。
- 2026-07-29の問題画面・風来シリーズ終了画面・校長対決・紙飛行機バトルの
  コントローラーフォーカス再修正版をWindows x64で再生成し、対象回帰テスト5項目と
  Steam配布物検証に合格した。SteamPipe Build ID `24445575`、Depot Manifest ID
  `8015492186608577460`として、非公開`internal`ブランチへ反映済み。
- Steamストア用の実ゲーム画面7枚（1920×1080）を `release/steam/store-assets/screenshots/` に準備済み。うち追加2枚はチュートリアルを閉じた戦闘画面と、戦闘後の学習問題画面。
- ImageGenで作成したキービジュアルと正式ロゴを用い、Steam規定寸法のカプセル／ライブラリ／アイコン素材10点を `release/steam/store-assets/generated/` に準備済み。

## ローカルのリリースコマンド

```bash
# Steam向けWeb資産のみ
pnpm run build:steam

# SteamPipeへ入れるWindows x64フォルダーを作成
pnpm run dist:steam:win

# Steam規定寸法のカプセル／ライブラリ／アイコン画像を再生成
pnpm run steam:assets

# SteamworksのIDを使ってSteamPipe VDFを生成（既定はPreview=1）
STEAM_APP_ID=000000 STEAM_DEPOT_ID=000001 pnpm run steam:config
```

生成先:

- ゲーム本体: `release/steam/win-unpacked/`
- 起動ファイル: `release/steam/win-unpacked/LearningRogue.exe`
- SteamPipe設定: `release/steam/steampipe/scripts/`
- SteamPipeキャッシュ／ログ: `release/steam/steampipe/output/`

`steam:config` は誤アップロードを避けるため、既定で `"Preview" "1"` を出力する。実際にアップロードする時だけ `STEAM_PREVIEW=0` を指定する。非公開テストブランチへ自動反映する場合は `STEAM_SET_LIVE=<branch-name>` も指定する。defaultブランチはSteamworks画面から設定する。

## Steamworks設定

- [x] Steam AppID: `5013100`
- [x] Windows Content Depot ID: `5013101`
- [x] Steamworks SDK（macOS版SteamCMDを含む）
- [x] ビルド用SteamアカウントとAppIDへの権限
- [x] 「アプリの変更をSteamに公開」権限
- [x] 「価格と割引の管理」権限／支払受取アカウント状態
- [x] 日本500円および地域別価格を審査へ提出
- [x] Windows 64-bit、起動オプション、Depot言語設定を公開
- [x] コンテンツアンケートを保存・公開
- [x] ストアタグ20件を設定・公開
- [x] サポート窓口URLを設定
- [x] 開発元・パブリッシャー名を `YIICTSC` に設定
- [x] `YIICTSC` コミュニティグループをCreator Homeへリンク
- [x] 最新ソースからWindows x64提出ビルドを再生成・検証
- [x] 校長対決のSteam専用コントローラー配置を実装・自動テスト
- [x] macOS版SteamCMDを導入・更新
- [x] SteamPipeアップロード設定を生成
- [x] Build `24385958` をSteamPipeへアップロード
- [x] Build `24385958` をPublic defaultブランチへ反映
- [x] Build `24395548` を非公開`internal`ブランチへ反映
- [x] Build `24442792` を非公開`internal`ブランチへアップロード
- [x] Build `24444544` を非公開`internal`ブランチへアップロード
- [x] Build `24445575` を非公開`internal`ブランチへアップロード
- [x] Beta Testing／Developer Compパッケージを確認
- [ ] Windows版Steamクライアントからインストール・起動・終了を確認

ID取得後、Steamworksの「インストール」設定を以下にする。

| 項目 | 値 |
| --- | --- |
| OS | Windows |
| アーキテクチャ | 64-bit |
| 起動ファイル | `LearningRogue.exe` |
| 起動オプション | なし |
| 作業ディレクトリ | 空欄／インストールルート |
| 対応OS表記 | Windows 10 / 11 |

## SteamPipeアップロード手順

1. `pnpm run dist:steam:win` を実行する。
2. Windows実機またはVMで `LearningRogue.exe` を直接起動し、初回設定・セーブ・終了を確認する。
3. AppID／Depot IDを環境変数へ設定し、Preview VDFを生成する。
4. Steamworks SDKの `tools/ContentBuilder/builder_osx/steamcmd.sh` を初回起動して更新する。
5. Preview buildを実行し、ファイル割当と容量を確認する。
6. `STEAM_PREVIEW=0` でVDFを再生成し、非公開テストブランチへアップロードする。
7. Steamクライアントからインストールし、Steam経由起動・アンインストール・再インストール・更新を確認する。
8. 合格したBuild IDをdefaultブランチへ設定し、ビルドレビューへ提出する。

SteamCMD例:

```bash
STEAM_PREVIEW=0 STEAM_SET_LIVE=internal \
  STEAM_APP_ID=000000 STEAM_DEPOT_ID=000001 pnpm run steam:config

/path/to/steamworks_sdk/tools/ContentBuilder/builder_osx/steamcmd.sh \
  +login <builder-account> \
  +run_app_build /absolute/path/to/release/steam/steampipe/scripts/app_build_000000.vdf \
  +quit
```

パスワードやSteam Guardコードはリポジトリ、VDF、シェル履歴へ保存しない。

## ストアページ原稿（初稿）

### 短い説明

学習問題に挑み、カードを集め、デッキを組んで冒険する学習ローグライク。メインゲームと個性豊かなミニゲームを、自分の学年や学習内容に合わせて楽しめます。

### 主な特徴

- 学習問題の正解が戦闘や成長につながるカード型ローグライク
- 小学生編・高校編・マジック編のテーマ
- 問題チャレンジ、課題配信、提出・学習記録
- 放課後ポーカー、風来の小学生、校長対決、紙飛行機バトルなどのミニゲーム
- 日本語・ひらがな・英語表示
- Xboxコントローラー対応
- 買い切り版はゲーム内の1日プレイ時間制限なし

### 注意書き

- 一部のタイピング学習では物理キーボードを使用します。
- オンラインランキング、課題連携、協力・レース機能にはインターネット接続が必要です。
- セーブデータは端末内へ保存されます。プラットフォーム間の自動共有には対応していません。

## 最低／推奨システム要件（初稿）

| | 最低 | 推奨 |
| --- | --- | --- |
| OS | Windows 10 64-bit | Windows 11 64-bit |
| CPU | 64-bit デュアルコア | 64-bit クアッドコア |
| メモリ | 4 GB RAM | 8 GB RAM |
| GPU | WebGL 2対応 | WebGL 2対応の単体または内蔵GPU |
| DirectX | Version 11 | Version 11 |
| ストレージ | 2 GBの空き容量 | 2 GBの空き容量 |
| 入力 | キーボード／マウス、Xbox互換コントローラー | Xbox互換コントローラー |
| ネットワーク | オンライン機能利用時に必要 | ブロードバンド接続 |

## ストア素材

Steamの基本カプセルには、ゲーム画像、製品名、正式なサブタイトル以外の販促文を入れない。Library Heroは文字なし、Library Logoは透明背景のロゴのみとする。

- [x] Header Capsule（ローカル準備済み、Steamworksへの登録待ち）
- [x] Small Capsule（ローカル準備済み、Steamworksへの登録待ち）
- [x] Main Capsule（ローカル準備済み、Steamworksへの登録待ち）
- [x] Vertical Capsule（ローカル準備済み、Steamworksへの登録待ち）
- [x] Library Capsule（ローカル準備済み、Steamworksへの登録待ち）
- [x] Library Header（ローカル準備済み、Steamworksへの登録待ち）
- [x] Library Hero（文字なし、ローカル準備済み、Steamworksへの登録待ち）
- [x] Library Logo（透明背景、ローカル準備済み、Steamworksへの登録待ち）
- [x] Shortcut Icon／App Icon（ローカル準備済み、Steamworksへの登録待ち）
- [x] ゲームプレイ中心のスクリーンショット（ローカル準備済み、Steamworksへの登録待ち）
- [ ] ゲームプレイトレーラー

画像を新規作成する場合はImageGenを使用し、Steam公式テンプレートの最新寸法へ合わせる。

## Valveレビューまでの順序

1. ストアページと価格を完成させ、ストアプレゼンスを先にレビュー提出する。
2. 承認後に「近日登場」として公開する。
3. 最終版に近いdefaultブランチのビルドをアップロードし、ゲームビルドをレビュー提出する。
4. 「近日登場」公開から最低2週間経過し、両レビュー承認後に手動でリリースする。

ストアレビューは通常3～5営業日だが、修正期間を含めて公開希望日の少なくとも7日前に提出する。

## リリース前ゲート

- [ ] Steam専用ビルドで `steam` プラットフォーム識別を確認
- [ ] 有料版で1日制限が発動しないことを確認
- [ ] 本番ビルドからデバッグ導線を開けないことを確認
- [ ] Windows 10／11で起動、全画面、終了、セーブ復元を確認
- [ ] Xbox物理コントローラーでタイトルからゲーム終了まで確認
- [ ] Steam Inputの標準ゲームパッドテンプレートを公開
- [ ] SteamオーバーレイとViewボタンの競合を確認
- [ ] オフライン起動とオンライン機能の復帰を確認
- [ ] ランキング・課題連携のプラットフォーム値が `steam` で送信されることを確認
- [ ] 協力・レースの通信をSteamビルドで確認
- [ ] 価格・対応言語・年齢関連回答を確定
- [ ] ストア文面と実装機能が一致していることを確認
- [ ] Depotインストール後のファイル構成とアンインストールを確認
- [ ] Valveのストアページ／ゲームビルド両レビューへ提出
