# iOSアプリ化準備

更新日: 2026-07-26

## 採用構成

- 既存のReact/Vite版をCapacitorでiPhone/iPadアプリとして包む。
- Capacitorは8.4.2で固定し、iOS依存管理にはSwift Package Managerを使う。
- Simulator検証は`xcodebuild`で再現可能にし、App Store提出はXcode Organizerから直接行う。
- ネイティブ専用機能は、まずCapacitorプラグインまたは小さなSwiftブリッジとして段階的に追加する。

全面的なSwiftUI書き直しは、現在のゲーム規模とWeb版との機能差を考えると初期リリースの対象外とする。

## 確認済み環境

| 項目 | 状態 |
| --- | --- |
| macOS | 15.7.7 |
| Xcode | 26.3 (17C529) |
| iOS SDK / Simulator | SDK 26.2 / Simulator RuntimeはXcodeのComponentsで追加 |
| App Store提出SDK要件 | iOS 26 SDK要件を満たす |
| Capacitor | 8.4.2 |
| Node.js | 24.14.0（Codex同梱ランタイム） |
| iOS依存管理 | Swift Package Manager |
| Deployment Target | iOS 15.0、iPhone / iPad |
| 署名 | Automatic（Teamは正式Bundle ID確定後に設定） |

`App` schemeはiPhone Simulator向けに署名なしでビルド済み。実機を接続しなくても
`npm run ios:run`が利用可能なSimulatorを選択または作成して起動する。Xcodeの結果は
`BUILD SUCCEEDED`、生成されたDebugアプリは約976MBだった。

Simulatorへインストールし、アプリプロセスの起動、学年選択画面の表示、終了後の
再起動まで確認する。初回は資産展開を含めて表示まで時間がかかる場合がある。
確認画像は
[`ios-simulator-relaunch.png`](./ios-simulator-relaunch.png) に保存している。

2026-07-22にWeb版を再ビルドしてCapacitorへ同期し、同期後のXcodeビルドと
Simulator再起動も成功した。`dist`とiOS側のHTML／メインJavaScriptはSHA-256が一致。
確認画像は[`ios-simulator-web-sync.png`](./ios-simulator-web-sync.png)に保存している。

同日、有料ストア版の共通方針を反映した。iOSビルドは`VITE_PAID_EDITION=true`で
生成し、1日のプレイ時間加算、時間切れ判定、時間切れ画面、マスター達成時の
5分延長表示を無効化する。代わりに、マスター達成時は課題クリア時と同じ
生成ルールの報酬カードを付与し、アルバムへ保存する。Simulator上でも
`FULL VERSION: UNLIMITED`表示を確認済み。

2026-07-26のテスト期間中は、Web・iOS・Android・Steamの全版でデバッグ機能を
一時的に有効化した。通常画面にはボタンを表示せず、バージョン情報モーダルの題名を
10回押した場合だけデバッグメニューを表示する。公開確定前に再び無効化すること。
無効化時の確認画像は
[`ios-simulator-paid-debug-locked.png`](./ios-simulator-paid-debug-locked.png)に保存している。
確認画像は[`ios-simulator-paid-edition.png`](./ios-simulator-paid-edition.png)に保存している。

Simulator Runtimeの初回起動時にはdyld共有キャッシュ生成が走る場合がある。
生成中はSimulatorへのインストールが待機状態になるため、完了を待ってから再度
`npm run ios:run` を実行する。Appleが案内する事前生成コマンドは次のとおり。

```bash
xcrun simctl runtime dyld_shared_cache update --all
```

同じ処理は `npm run ios:prepare-simulator` でも実行できる。通常はRuntime導入直後の
1回だけでよい。

## アプリ識別情報

- 表示名: `学習ローグ`
- Bundle ID: `jp.yusukeishige.learningrogue`
- Xcode scheme: `App`
- Web出力: `dist`
- Apple Developer Team: `STVR67YH4M`

## App Store掲載文（iOS向け）

### サブタイトル案

学びながら楽しむデッキ構築ローグライク

### 詳しい説明

知識を力に、学びを冒険に。

「学習ローグ」は、問題に答えながらカードやレリックを集め、デッキを育てて冒険する学習ローグライクです。

【主な特徴】
・小学1年〜中学3年を中心に、算数・数学、国語・漢字、英語、生活、理科、社会など幅広い分野に対応
・小・中学校の学習指導要領に沿った単元から、高校以上・大人まで楽しめる問題を100,000問以上収録
・選択式と入力式、問題読み上げ、ひらがな中心表示、英語表示に対応
・カードバトル、マップ分岐、イベント、ショップ、ボス戦
・カードの強化・合成、レリック、ポーション、キャラクター育成
・小学生編、高校編、マジック編のテーマを切り替えて冒険
・放課後ポーカー、校庭サバイバー、風来の小学生、紙飛行機バトルなど多彩なミニゲーム
・メインゲームとミニゲームは縦画面・横画面の両方に対応
・日別・単元別の正解数、正答率、学習進度を端末内に記録
・オンラインランキング、協力プレイ、端末連携は任意で利用可能
・保護者・教員向け管理ポータルとの任意連携で、課題配信と進捗確認に対応

【保護者・教員向け管理ポータル】
管理ポータルでは、グループ管理、教材・課題の作成と配信、学習状況、正答率、学習時間、単元別進度を確認できます。

https://learning-rogue-management.yishigeict.chatgpt.site/

iOS有料版では、1日のプレイ時間制限なしで遊べます。広告なし、アプリ内課金なしの買い切り版です。

オンライン機能は任意です。ゲーム本体は、管理ポータルやランキングと連携せずに通常の学習・冒険を楽しめます。公開ランキングでは、実名や個人を特定できる名前を使用しないでください。

Bundle IDはApp Store Connectでアプリレコードを作る前に最終確定する。変更後に既存アプリ扱いへ戻すことはできないため、組織用の正式な逆ドメイン名がある場合は先に差し替える。

## XcodeからApp Store Connectへ提出する標準フロー

今後のiOS提出は、IPAをTransporterへ渡す方式ではなく、XcodeのOrganizerから
App Store Connectへ直接アップロードする。リポジトリを取得した直後、またはWeb側を
変更した提出前には、プロジェクトを開く前に次を実行する。

```bash
pnpm run ios:prepare-submit
```

このコマンドは、iOS有料版のWeb資産を生成し、CapacitorをiOSへ同期してから
`ios/App/App.xcodeproj`をXcodeで開く。Xcodeでは次を選択する。

1. Schemeが`App`、実行先が`Any iOS Device (arm64)`であることを確認する。Archiveに実機の接続は不要。
2. `Product > Archive`を実行する。
3. Organizerで生成されたArchiveを選び、`Distribute App > App Store Connect > Upload`を進める。
4. Bundle ID `jp.yusukeishige.learningrogue`、バージョン、Build番号が対象リリースと一致することを確認してアップロードする。

プロジェクトはAutomatic Signing、Team `STVR67YH4M`、ReleaseのApple Distribution署名、
iPhone／iPad向け設定を共有している。初回だけXcodeの`Signing & Capabilities`で
Apple Developerアカウントにログインし、Teamが設定されていることを確認する。
認証や2段階認証を求められた場合は、Xcodeの画面で本人が入力する。

XcodeのArchiveから直接アップロードするため、提出時にIPAを書き出したり、Transporterを
起動したりする必要はない。アップロード後のビルド処理、TestFlight、App Reviewの状態は
App Store Connectで確認する。

## Releaseアーカイブと署名状態

2026-07-27にApple Distribution署名とApp Store用プロビジョニングプロファイルを使い、
iOS 26.2 SDK、arm64、iOS 15.0以上、Version 1.0.0、Build 12でReleaseアーカイブに成功した。
MP3 172ファイルの同梱、Bundle ID `jp.yusukeishige.learningrogue`、Team
`STVR67YH4M`を確認し、App Store Connectへのアップロードにも成功した。Build 12は
TestFlightの内部・外部テストグループへ追加済みで、外部テストでも「テスト中」。
App Store版はBuild 11の審査提出を取り下げ、Build 12へ差し替えてApp Reviewへ
再提出済み（「審査待ち」）。審査メモもBuild 12の修正内容へ更新した。
リリース方法は引き続き手動公開に設定している。

2026-07-27にiOS実機の横画面表示を再調整した。問題チャレンジ、ACT終了、校長対決は
背景・演出を画面端まで描画し、文字・ボタンなどの操作UIだけをノッチ／Dynamic Islandの
安全領域内へ配置する。校長対決の上部ステータスはステージと難易度を折り返さない一行表示へ
変更した。Version 1.0.0、Build 13でReleaseアーカイブとApp Store Connectへの
アップロードに成功し、TestFlightでの処理完了後に内部・外部テストへ追加する。

同日、上記の端まで描画する構造をiOS横画面の全メインゲーム・ミニゲームへ拡張した。
画面ルートと各背景・演出レイヤーは全幅のまま、直下の操作レイヤー、左右操作盤、
端寄せボタンだけに安全領域を適用する。校長対決の「再挑戦」では同一画面内の状態リセット
でもクリック直後に`kocho_setup` BGMを停止・再開始する。これらはBuild 14として
App Store Connectへのアップロードに成功し、TestFlightの内部・外部テストグループへ
追加済み。テスト内容を更新して外部テスト審査へ提出し、両グループで「テスト中」になった。

2026-07-28にBuild 15を作成した。iPhone横画面では板書ボタンを全問題画面で同じ正円表示へ
統一し、右上の距離・QUIT・上部ステータスをノッチの安全領域内へ固定した。背景と演出は
画面端まで描画し、冒険マップも背景レイヤーと操作ノードを分離して全幅表示にした。
ミニゲーム名は「校庭 / サバイバー」のように意味のまとまりでのみ改行する。英語圏児童向け
タイピングは英語のキー基礎、フォニックス、サイトワード、学校語彙、文・会話へ置換した。
戦闘中のフィニッシャー以外のボイスは再生率30%とし、攻撃側と被弾側の発話に短い間隔を置く。
同日、Build 15をApp Store Connectへアップロードし、TestFlightの内部・外部テストグループへ
追加した。両グループとも「テスト中」となり、テスターへ自動通知する設定で配信を開始した。

2026-07-28にBuild 16を作成した。iPhone縦画面の問題表示では板書ボタンと報酬説明を
横並びの独立領域へ分離し、問題チャレンジ選択画面と放課後ポーカーのランダムパック画面へ
専用の安全領域を追加した。iOSのMP3 BGMはHTML AudioをWeb Audioのゲインへ接続して
ゲーム内音量調整を反映する。テーマ・曲の切替、バックグラウンド移行、音声セッションの
中断後にはAudioContextとBGMを再構築し、効果音・キャラクターボイスも次の操作で確実に
復帰するようにした。同日、Build 16をApp Store Connectへアップロードし、TestFlightの
内部・外部テストグループへ追加した。両グループとも「テスト中」となっている。

2026-07-28にBuild 17を作成した。放課後ポーカーの大ランダムパックはiPhone縦画面で
候補5枚を3枚＋2枚の中央揃えにし、選択ボタンまでホームインジケータ上へ収めた。
SE事前読み込みがiOSのAudioContext再開待ちで停止する問題を解消し、初回再生から
`public/sfx`の打撃・爆発・フィニッシュ・ジャンプ音を使用する。全ミニゲームが利用する
共通SEも同じ実音源へ置き換えた。問題チャレンジのスマホ横画面はミニバトルを薄型化し、
問題文と回答操作をスクロールなしで収める可変密度レイアウトへ変更した。英語発音問題の
マイク・音声認識と、小学生編主人公撮影のカメラについてiOS利用目的文言を追加した。
同日、Build 17をApp Store Connectへアップロードし、内部テストグループへの追加を確認した。
外部テストグループにも追加し、更新内容を入力してTestFlight審査へ提出した。

2026-07-29にBuild 18を作成した。共通の`playSound`は従来の電子音へ戻し、
実音源を再生する`playBattleSound`を分離した。メインゲームと各ミニゲームでは、
戦闘中の打撃・防御・ダメージ・フィニッシュ演出だけを実音源へ接続し、
メニュー操作、問題の正誤、イベント、ショップなど戦闘画面以外は電子音を維持する。
通常SEでは音源ファイルを開始せず、戦闘専用SEだけが初回からパッケージ音源を再生する
回帰テストを追加した。同日、Build 18をApp Store Connectへアップロードし、
内部・外部の両TestFlightグループへ追加して外部テスト審査へ提出した。

2026-07-29にBuild 19を作成した。iPhone縦画面の「帰宅ダッシュ」はライフ・レベル表示の
上余白をiOSの安全領域と重複させず、プレイ画面上部へ常時表示するよう修正した。
校長対決の問題画面では板書ボタンと全問正解報酬をノッチ・ステータスバーより下へ配置した。
校長対決はカード名・効果・連続ヒット数から斬撃、打撃、投擲、雷、風、音波、吸収、爆発を
選ぶ戦闘専用SEへ接続し、攻撃演出に合わせて再生する。紙飛行機バトル、風来の小学生1・2、
校庭サバイバーは戦闘を含め従来の電子音へ戻し、校長対決以外のミニゲームがパッケージSEを
使用しない回帰検査を追加した。同日、Build 19をApp Store Connectへアップロードした。
Build 19をTestFlightの内部・外部テストグループへ追加し、テスト内容を更新して
外部テストへ提出した。両グループとも「テスト中」で、テスターへの自動通知を有効にした。

2026-07-29に本番用Build 21を作成した。管理ポータルから新しい課題が配信された場合、
ユーザーが通知を許可した端末へOS通知を表示し、通知を開くと課題受信画面へ移動する。
高校編・マジック編の戦闘は、フィニッシュへ到達し得る攻撃カード／攻撃ルールの実行時に
攻撃ボイスを必ず再生する。本番環境ではバージョン情報10回押下を含むデバッグ導線を
無効化した。ImageGenで作成済みの正式アイコンからiOS AppIconを再生成し、Build 21へ
同梱した。

Apple Distribution署名、iOS 26.2 SDK、arm64、iOS 15.0以上、Version 1.0.0、
Build 21のReleaseアーカイブとApp Store Connectへのアップロードに成功した。
Build 21はTestFlightの内部・外部テストグループへ追加済みで、両グループとも
「テスト中」。外部テスターへの自動通知も有効にした。App Store版は旧Build 12の
審査提出を取り下げ、審査メモを本番仕様へ更新したうえでBuild 21を再提出した。
2026-07-29 16:35時点のApp Reviewステータスは「審査待ち」、公開方法は手動リリース。

2026-07-30にBuild 22を作成した。摩擦熱と幾何学模様を含む被弾時発動カードは、
説明どおりスタックごとに5ダメージを与えるようランタイム処理を修正し、同系統カードを
検査する回帰テストを追加した。iOSではCapacitorのアプリ状態通知を監視し、
バックグラウンド移行時に音声を一時停止、フォアグラウンド復帰時に
`AVAudioSession`、Web Audio、HTML Audioを順序付きで再開するようにした。
再開失敗時の再試行と、HTMLメディア要素への直接フォールバックも追加した。

Apple Distribution署名、iOS 26.2 SDK、arm64、iOS 15.0以上、Version 1.0.0、
Build 22のReleaseアーカイブ生成とApp Store Connectへのアップロードに成功した。
アーカイブは`build/ios/LearningRogue-1.0.0-22.xcarchive`。Build 22を内部テスト
「学習ローグ テストプレイ」と外部テスト「学習ローグ 外部テスト」へ追加し、
テスト内容を更新して外部TestFlight審査へ提出した。外部グループは2名。
App ReviewのBuild 21から22への差し替えは、App Store Connectの配信ページ本文が
読み込まれない状態を解消後、Build 21の審査提出を取り下げてBuild 22へ差し替えた。
審査メモをBuild 22の修正内容へ更新し、2026-07-30にApp Reviewへ再提出済み。
現在のステータスは「審査待ち」、公開方法は手動リリース。

同日、マジック編のiPhone横画面で主人公専用レリックの名称・説明・所持数を
1行で表示するレイアウトへ調整し、変身後ボイスから遅延・フィルタ・フィードバックを
除去して原音再生へ統一したBuild 23を作成した。Apple Distribution署名、
iOS 26.2 SDK、arm64、iOS 15.0以上、Version 1.0.0でReleaseアーカイブを生成し、
App Store Connectへのアップロードに成功した。アーカイブは
`build/ios/LearningRogue-1.0.0-23.xcarchive`。

Build 23を内部テスト「学習ローグ テストプレイ」と外部テスト
「学習ローグ 外部テスト」へ追加し、テスト内容を更新して外部TestFlight審査へ
提出した。App Store版はBuild 22の審査提出を取り下げ、Build 23へ差し替え、
審査メモも最新の修正内容へ更新して2026-07-30 13:01に再提出した。
現在のApp Reviewステータスは「審査待ち」、公開方法は手動リリース。
外部テストの公開リンクは
`https://testflight.apple.com/join/Swgfe66z`で、参加上限は100人。

同日、Build 24を作成した。iPhone横画面のマジック編では、主人公固有レリックの
閉じた要約表示を縦画面と同じコンパクトな2行構成へ変更した。名称、3枠の進捗、
残り数をそれぞれ折り返さず表示し、横画面で文字列が縦に崩れたりパネルが間延び
したりしないようiOSのマジック編だけにレイアウトを限定した。詳細を開いた場合の
従来幅は維持する。専用レイアウト回帰検査と本番デバッグ無効化検査に合格し、
iOS向けVite本番ビルドとCapacitor同期を実施した。

Apple Distribution署名、App Store用プロビジョニングプロファイル、
iOS 26.2 SDK、arm64、iOS 15.0以上、Version 1.0.0、Build 24で
ReleaseアーカイブとApp Store向け検証に成功した。アーカイブは
`build/ios/LearningRogue-1.0.0-24.xcarchive`。2026-07-30 15:33に
App Store Connectへのアップロードに成功し、Apple側のビルド処理を待っている。

## 開発コマンド

```bash
npm run build:ios
npm run ios:sync
npm run ios:open
npm run ios:prepare-simulator
npm run ios:run
```

`npm run ios:run` は実機を必要とせず、次を連続実行する。

1. iOS向けWebビルドとCapacitor同期
2. 利用可能なRuntimeのSimulatorを選択し、なければ作成して起動
3. `App` schemeのDebugビルド
4. Simulatorへのインストールと起動

別のSimulatorを使う場合:

```bash
IOS_SIMULATOR="iPad Pro 11-inch (M4)" npm run ios:run
```

指定した機種が現在のRuntimeに対応しない場合は、既定で`iPhone 16 Pro`へ
フォールバックする。Runtimeを固定する場合は`IOS_SIMULATOR_RUNTIME`へ
`com.apple.CoreSimulator.SimRuntime.iOS-18-3`のようなRuntime IDを指定する。

Xcodeが選択中のRuntimeをSimulatorのビルド先として利用できない場合は、実機へ
フォールバックせず停止する。Xcodeの`Settings > Components`で、使用中のXcodeに
対応するiOS Simulator Runtimeを追加してから再実行する。複数のXcodeを使う場合は、
次のようにSimulator実行時だけDeveloper Directoryを指定できる。

```bash
IOS_DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer" npm run ios:run
```

## iOS互換性で実施した変更

- safe areaを有効化するためviewportへ `viewport-fit=cover` を追加。
- Capacitorのローカルホストを開発APIと誤認しないよう、ランキングAPIのlocalhost判定をWebプラットフォームに限定。
- iOSビルドでは `VITE_APP_PLATFORM=ios` を設定。
- iOS有料版では `VITE_PAID_EDITION=true` を設定し、Web版だけに1日制限を残す。
- 既存のImageGen製アイコン原画から1024pxのApp Iconを作成。
- iOSではHTML AudioによるMP3再生を優先し、Web Audioをフォールバックとして残す。
- 起動時とフォアグラウンド復帰時に`AVAudioSession`を`.playback`へ設定し、端末の消音
  スイッチ状態にかかわらずゲームBGMを再生できるようにする。

## リリース前の重要課題

### 1. アプリ容量

`public` が約952MBあり、現在は大半がアプリ本体へコピーされる。初回TestFlight前に以下へ分類する。

| 資産 | 現在の概算サイズ |
| --- | ---: |
| `public/sprites` | 358MB |
| `public/bgm` | 214MB |
| `public/bgm-new` | 211MB |
| `public/card-illustrations` | 75MB |
| `public/sfx` | 72MB |

`sprites`内では`magic`が約205MB、`high-school`が約56MB、背景が約45MB。
生成元シート／素材ディレクトリだけでも約59MBあるため、参照監査後に配布対象から
外せる可能性がある。BGMの旧／新版は設定から切り替える仕様なので、単純削除はしない。

- 起動・基本学習に必須の同梱資産
- テーマ開始時に取得する追加資産
- Apple-Hosted Background AssetsまたはCDNから配信する音声・高解像度画像

### 2. Web API差分

- 音声読み上げ (`speechSynthesis`)
- Web Audioの初回ユーザー操作制約
- ファイル書き出し・読み込み
- クリップボード
- PeerJS/WebRTC協力プレイ
- Fullscreen API

各機能を実機とSimulatorの両方で確認し、必要な箇所だけCapacitorプラグインへ置き換える。

### 3. Apple提出準備

- [x] Bundle IDと署名Teamの確定
- [x] 実機向けReleaseアーカイブの生成
- [x] App Store Connectの提供者とDistribution署名をXcodeで再読み込み
- [x] App Store Connectのアプリレコード作成
- Privacy ManifestとRequired Reason APIの監査
- 子ども向け・教育用途を踏まえた年齢区分、プライバシーポリシー、データ収集回答
- iPhone/iPadのスクリーンショットと審査用説明
- [x] TestFlight内部・外部テストへBuild 21を追加
- [x] App Store版をBuild 21へ差し替えてApp Reviewへ再提出
- [x] Build 22のReleaseアーカイブ生成とApp Store Connectへのアップロード
- [x] TestFlight内部・外部テストへBuild 22を追加し、外部テスト審査へ提出
- [x] App Store版をBuild 22へ差し替えてApp Reviewへ再提出
- [x] Build 23のReleaseアーカイブ生成とApp Store Connectへのアップロード
- [x] TestFlight内部・外部テストへBuild 23を追加し、外部テスト審査へ提出
- [x] App Store版をBuild 23へ差し替えてApp Reviewへ再提出
- [x] Build 24のReleaseアーカイブ生成とApp Store Connectへのアップロード
- [x] TestFlight内部・外部テストへBuild 24を追加
- [x] App Store版をBuild 24へ差し替えてApp Reviewへ再提出
- [x] Build 25のReleaseアーカイブ生成とApp Store Connectへのアップロード
- [x] TestFlight内部・外部テストへBuild 25を追加
- [x] App Store版をBuild 25へ差し替えてApp Reviewへ再提出

課金モデルの検討結果は[`ios-monetization-plan.md`](./ios-monetization-plan.md)を参照する。

## 次の完了条件

- [x] iPhone Simulatorで起動し、学年選択画面まで表示できる。
- [ ] 学年を選び、開始メニューまで表示できる。
- 新規ゲーム開始、保存、再起動後の復元が動く。
- 問題音声、BGM、ランキングAPI、管理ポータル連携を個別確認する。
- 実機でノッチ／Dynamic Island／ホームインジケータとの重なりがない。
